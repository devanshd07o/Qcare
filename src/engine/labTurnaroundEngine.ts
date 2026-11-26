import {
  ClinicalReport,
  Counter,
  Department,
  DiagnosticTest,
  DoctorPriority,
  Patient,
  QueueToken
} from '../types';
import { calculateOptimalQueueRoute, calculateTransitMinutes } from './queueRouter';

export interface LabTelemetryContext {
  tests: DiagnosticTest[];
  departments: Department[];
  counters: Counter[];
  queueTokens: QueueToken[];
  clinicalReports: ClinicalReport[];
  now?: Date;
  doctorPriority?: DoctorPriority;
  excludePatientId?: string;
}

export interface HourlyDemandProfile {
  hourLabel: string;
  demandFactor: number;
  rushLevel: 'low' | 'moderate' | 'peak';
}

export interface TestLiveEstimate {
  testId: string;
  testName: string;
  code: string;
  departmentId: string;
  departmentName: string;
  room: string;
  floor: string;
  effectiveServiceMinutes: number;
  queueWaitMinutes: number;
  estimatedTotalMinutes: number;
  liveWaitingCount: number;
  activeUnits: number;
  throughputPerHour: number;
  servedToday: number;
  reportSampleCount: number;
  hourLabel: string;
  rushLevel: 'low' | 'moderate' | 'peak';
  loadStatus: 'fast' | 'moderate' | 'busy' | 'unavailable';
  isUnavailable: boolean;
}

export interface WalkinStepEstimate {
  stepNumber: number;
  testId: string;
  testName: string;
  code: string;
  departmentId: string;
  room: string;
  floor: string;
  walkingMinutes: number;
  waitMinutes: number;
  serviceMinutes: number;
  stepTotalMinutes: number;
  standaloneTotalMinutes: number;
  throughputPerHour: number;
  waitingAhead: number;
  isUnavailable: boolean;
}

export interface WalkinInvestigationEstimate {
  steps: WalkinStepEstimate[];
  totalEstimatedMinutes: number;
  naiveTotalMinutes: number;
  timeSavedMinutes: number;
  transitMinutes: number;
  readyAtTime: string;
  averageHourlyThroughput: number;
  totalLiveWaiting: number;
  hourLabel: string;
  rushLevel: 'low' | 'moderate' | 'peak';
  observedReportCount: number;
  unavailableTestNames: string[];
}

export interface DepartmentTelemetryRow {
  departmentId: string;
  departmentName: string;
  code: string;
  category: Department['category'];
  room: string;
  floor: string;
  waitingCount: number;
  inProgressCount: number;
  activeUnits: number;
  totalUnits: number;
  avgServiceMinutes: number;
  estimatedWaitMinutes: number;
  estimatedWaitPlusServiceMinutes: number;
  throughputPerHour: number;
  servedToday: number;
  reportCount: number;
  utilizationPct: number;
  rushLevel: 'low' | 'moderate' | 'peak';
  status: 'available' | 'busy' | 'unavailable';
}

function gaussian(x: number, mean: number, sigma: number): number {
  const z = (x - mean) / sigma;
  return Math.exp(-0.5 * z * z);
}

function formatHourWindow(hour24: number): string {
  const hStart = ((hour24 % 24) + 24) % 24;
  const hEnd = (hStart + 1) % 24;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hStart)}:00–${pad(hEnd)}:00`;
}

/**
 * Computes deterministic hourly OPD lab demand multiplier based on time-of-day and specialty.
 * Morning fasting/phlebotomy peaks ~09:30, imaging/specialty OPD peaks ~11:00, evening clinic ~16:00.
 */
export function getHourlyDemandProfile(
  deptCategory: Department['category'] | string,
  now: Date = new Date()
): HourlyDemandProfile {
  const hour = now.getHours();
  const hourFloat = hour + now.getMinutes() / 60;
  const hourLabel = formatHourWindow(hour);

  const isMorningFastingLab =
    deptCategory === 'pathology' || deptCategory === 'biochemistry';

  const morningPeak = isMorningFastingLab
    ? 1.05 * gaussian(hourFloat, 9.5, 2.0)
    : 0.95 * gaussian(hourFloat, 11.0, 2.3);

  const afternoonBump = isMorningFastingLab
    ? 0.52 * gaussian(hourFloat, 15.5, 1.8)
    : 0.68 * gaussian(hourFloat, 16.0, 1.9);

  const rawFactor = 0.35 + morningPeak + afternoonBump;
  const demandFactor = Number(Math.max(0.35, Math.min(1.5, rawFactor)).toFixed(2));

  const rushLevel: HourlyDemandProfile['rushLevel'] =
    demandFactor >= 1.08 ? 'peak' : demandFactor >= 0.72 ? 'moderate' : 'low';

  return {
    hourLabel,
    demandFactor,
    rushLevel
  };
}

function resolveActiveDepartmentCapacity(
  dept: Department | undefined,
  counters: Counter[],
  deptId: string
): {
  isUnavailable: boolean;
  activeUnits: number;
  totalUnits: number;
  activeCounters: Counter[];
  deptCounters: Counter[];
} {
  const deptCounters = counters.filter(c => c.departmentId === deptId);
  const activeCounters = deptCounters.filter(c => c.status === 'active');

  const isUnavailable =
    dept?.availabilityStatus === 'unavailable' ||
    (dept?.activeMachines !== undefined && dept.activeMachines <= 0) ||
    (deptCounters.length > 0 && activeCounters.length === 0);

  const activeUnits = isUnavailable
    ? 0
    : dept?.activeMachines !== undefined && dept.activeMachines > 0
      ? activeCounters.length > 0
        ? Math.max(activeCounters.length, dept.activeMachines)
        : dept.activeMachines
      : Math.max(1, activeCounters.length);

  const totalUnits = Math.max(
    activeUnits,
    dept?.totalMachines ?? deptCounters.length ?? 1
  );

  return { isUnavailable, activeUnits, totalUnits, activeCounters, deptCounters };
}

/**
 * Computes live turnaround estimate & per-hour throughput for a single diagnostic test
 * using lab counter averages, real-time queue tokens, observed LabPortal report durations,
 * and current hour demand profile.
 */
export function getTestLiveEstimate(
  test: DiagnosticTest,
  context: LabTelemetryContext
): TestLiveEstimate {
  const now = context.now ?? new Date();
  const dept = context.departments.find(d => d.id === test.departmentId);
  const { isUnavailable, activeUnits, activeCounters, deptCounters } =
    resolveActiveDepartmentCapacity(dept, context.counters, test.departmentId);

  const hourly = getHourlyDemandProfile(dept?.category || 'pathology', now);

  const counterAvg =
    activeCounters.length > 0
      ? activeCounters.reduce((acc, c) => acc + (c.averageServiceMinutes || test.averageDurationMinutes), 0) /
        activeCounters.length
      : deptCounters.length > 0
        ? deptCounters.reduce((acc, c) => acc + (c.averageServiceMinutes || test.averageDurationMinutes), 0) /
          deptCounters.length
        : test.averageDurationMinutes || 6;

  // Baseline blended with live lab counter service speed
  const baseMinutes = 0.55 * (test.averageDurationMinutes || 6) + 0.45 * counterAvg;

  // Adapt dynamically from actual clinical reports submitted by LabPortal (direct test reports weighted higher than sibling counter reports)
  const deptCounterIds = new Set(deptCounters.map(c => c.id));
  const weightedObservations: Array<{ duration: number; weight: number }> = [];
  for (const r of context.clinicalReports) {
    const dur = r.actualTurnaroundMinutes;
    if (typeof dur !== 'number' || !Number.isFinite(dur) || dur <= 0) continue;
    if (r.testId === test.id) {
      weightedObservations.push({ duration: dur, weight: 1.0 });
    } else if (r.counterId && deptCounterIds.has(r.counterId)) {
      weightedObservations.push({ duration: dur, weight: 0.45 });
    }
    if (weightedObservations.length >= 10) break;
  }

  let effectiveServiceMinutes = baseMinutes;
  if (weightedObservations.length > 0) {
    const totalWeight = weightedObservations.reduce((s, o) => s + o.weight, 0);
    const observedWeightedMean =
      weightedObservations.reduce((s, o) => s + o.duration * o.weight, 0) / totalWeight;
    const blendAlpha = Math.min(0.6, totalWeight * 0.16);
    effectiveServiceMinutes = (1 - blendAlpha) * baseMinutes + blendAlpha * observedWeightedMean;
  }
  effectiveServiceMinutes = Number(Math.max(2, effectiveServiceMinutes).toFixed(1));

  const liveWaitingTokens = context.queueTokens.filter(
    t =>
      t.departmentId === test.departmentId &&
      (t.status === 'waiting' || t.status === 'called' || t.status === 'in_progress') &&
      (!context.excludePatientId || t.patientId !== context.excludePatientId)
  );
  const liveWaitingCount = liveWaitingTokens.length;

  const testReportCount = context.clinicalReports.filter(
    r => r.testId === test.id || (r.counterId && deptCounterIds.has(r.counterId))
  ).length;
  const servedToday =
    deptCounters.reduce((sum, c) => sum + (c.servedCountToday || 0), 0) +
    testReportCount;

  const priorityScale =
    context.doctorPriority === 'urgent'
      ? 0.6
      : context.doctorPriority === 'priority'
        ? 0.8
        : 1.0;
  const intakeBase = isUnavailable
    ? 0
    : Math.max(0, Math.round(hourly.demandFactor * 1.15 * priorityScale));

  let queueWaitMinutes = 0;
  if (isUnavailable) {
    queueWaitMinutes = liveWaitingCount > 0 ? liveWaitingCount * 20 + 90 : 90;
  } else if (liveWaitingCount > 0) {
    const rawWait = (liveWaitingCount * effectiveServiceMinutes) / Math.max(1, activeUnits);
    queueWaitMinutes = intakeBase + Math.max(1, Math.round(rawWait * priorityScale));
  } else {
    queueWaitMinutes = intakeBase;
  }

  const estimatedTotalMinutes = Math.max(2, Math.round(queueWaitMinutes + effectiveServiceMinutes));

  const maxCapPerHour =
    (60 / Math.max(2, effectiveServiceMinutes)) * Math.max(1, activeUnits);
  const hourlyLoadPenalty = Math.min(
    0.45,
    liveWaitingCount * 0.055 + Math.max(0, hourly.demandFactor - 0.35) * 0.19
  );
  const throughputPerHour = isUnavailable
    ? 0
    : Math.max(1, Math.round(maxCapPerHour * (1 - hourlyLoadPenalty)));

  const loadStatus: TestLiveEstimate['loadStatus'] = isUnavailable
    ? 'unavailable'
    : estimatedTotalMinutes >= 22 || liveWaitingCount >= 4
      ? 'busy'
      : estimatedTotalMinutes >= 12 || liveWaitingCount >= 2
        ? 'moderate'
        : 'fast';

  return {
    testId: test.id,
    testName: test.name,
    code: test.code,
    departmentId: test.departmentId,
    departmentName: dept?.name || 'Diagnostic Lab',
    room: dept?.location.room || 'Diagnostic Bay',
    floor: dept?.location.floor || 'Ground Floor',
    effectiveServiceMinutes,
    queueWaitMinutes,
    estimatedTotalMinutes,
    liveWaitingCount,
    activeUnits,
    throughputPerHour,
    servedToday,
    reportSampleCount: weightedObservations.length,
    hourLabel: hourly.hourLabel,
    rushLevel: hourly.rushLevel,
    loadStatus,
    isUnavailable
  };
}

/**
 * Estimates combined multi-test turnaround time for the Doctor Walk-in Investigation builder.
 * Connects optimal Q-Care route sequencing (parallel queue clearing, fasting/full bladder/prerequisites,
 * inter-department walking transit) with live LabPortal queue & report turnaround telemetry.
 */
export function estimateWalkinInvestigations(
  selectedTestIds: string[],
  context: LabTelemetryContext,
  /** Optional pre-computed map (from testLiveEstimatesMap) — avoids redundant O(N) recompute */
  precomputedEstimates?: Record<string, TestLiveEstimate>
): WalkinInvestigationEstimate {
  const now = context.now ?? new Date();
  const uniqueIds = Array.from(new Set(selectedTestIds)).filter(id =>
    context.tests.some(t => t.id === id)
  );
  const baseHourly = getHourlyDemandProfile('pathology', now);

  if (uniqueIds.length === 0) {
    return {
      steps: [],
      totalEstimatedMinutes: 0,
      naiveTotalMinutes: 0,
      timeSavedMinutes: 0,
      transitMinutes: 0,
      readyAtTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      averageHourlyThroughput: 0,
      totalLiveWaiting: 0,
      hourLabel: baseHourly.hourLabel,
      rushLevel: baseHourly.rushLevel,
      observedReportCount: 0,
      unavailableTestNames: []
    };
  }

  const liveEstByTestId: Record<string, TestLiveEstimate> = {};
  const testDurationOverrides: Record<string, number> = {};
  const deptServiceBuckets: Record<string, number[]> = {};

  // Use pre-computed estimates if provided — avoids iterating all tests twice
  for (const t of context.tests) {
    const est = precomputedEstimates?.[t.id] ?? getTestLiveEstimate(t, context);
    liveEstByTestId[t.id] = est;
    testDurationOverrides[t.id] = est.effectiveServiceMinutes;
    if (!deptServiceBuckets[t.departmentId]) deptServiceBuckets[t.departmentId] = [];
    deptServiceBuckets[t.departmentId].push(est.effectiveServiceMinutes);
  }

  const deptServiceOverrides: Record<string, number> = {};
  for (const [deptId, vals] of Object.entries(deptServiceBuckets)) {
    deptServiceOverrides[deptId] = Number(
      (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1)
    );
  }

  const virtualPatient: Patient = {
    id: context.excludePatientId || 'virtual-walkin-preview',
    uhid: 'PREVIEW',
    qrSessionId: 'PREVIEW',
    name: 'Preview Patient',
    age: 40,
    gender: 'Male',
    contact: '0000000000',
    priority: context.doctorPriority === 'urgent' ? 'emergency' : 'standard',
    doctorPriority: context.doctorPriority || 'normal',
    prescribedDoctorId: 'doc-preview',
    prescribedDoctorName: 'Attending Physician',
    prescribedDoctorRoom: 'Chamber',
    prescribedTests: uniqueIds,
    completedTests: [],
    activeTokenIds: {},
    status: 'registered',
    assignedSmartRoute: uniqueIds,
    registrationTime: '',
    opdTokenNumber: 'PREVIEW',
    doctorReviewStatus: 'awaiting_prescription'
  };

  const plan = calculateOptimalQueueRoute(
    virtualPatient,
    context.tests,
    context.departments,
    context.queueTokens,
    context.counters,
    {},
    testDurationOverrides,
    deptServiceOverrides
  );

  const steps: WalkinStepEstimate[] = [];
  let prevDept: Department | undefined = undefined;
  let totalTransit = 0;
  const visitedDepts = new Set<string>();
  const unavailableTestNames: string[] = [];

  const priorityScale =
    context.doctorPriority === 'urgent'
      ? 0.6
      : context.doctorPriority === 'priority'
        ? 0.8
        : 1.0;

  plan.smartRouteSteps.forEach((routeStep, index) => {
    const testObj = context.tests.find(t => t.id === routeStep.testId);
    if (!testObj) return;
    const dept = context.departments.find(d => d.id === testObj.departmentId);
    const live = liveEstByTestId[testObj.id] || getTestLiveEstimate(testObj, context);
    const deptHourly = getHourlyDemandProfile(dept?.category || 'pathology', now);
    const intakeBase = live.isUnavailable
      ? 0
      : Math.max(0, Math.round(deptHourly.demandFactor * 1.15 * priorityScale));

    if (live.isUnavailable) {
      unavailableTestNames.push(testObj.name);
    }

    // First walk from doctor chamber to first lab (~1.5m), then inter-department transit
    const walkMins =
      index === 0
        ? 1.5
        : calculateTransitMinutes(prevDept, dept);
    totalTransit += walkMins;

    const alreadyClearedThisDept = visitedDepts.has(testObj.departmentId);
    visitedDepts.add(testObj.departmentId);

    let smartWait: number;
    if (live.isUnavailable) {
      smartWait = live.queueWaitMinutes;
    } else if (alreadyClearedThisDept) {
      // Patient is already at this counter; avoid waiting in external department queue twice
      smartWait = Math.min(1, live.queueWaitMinutes);
    } else if (live.liveWaitingCount > 0) {
      const drainedWait = Math.round(routeStep.estimatedWaitMinutes * priorityScale);
      smartWait = drainedWait > 0 ? intakeBase + drainedWait : intakeBase;
    } else {
      smartWait = live.queueWaitMinutes;
    }

    const serviceMins = Math.round(live.effectiveServiceMinutes);
    const stepTotalMinutes = Math.max(
      2,
      Math.round(walkMins + smartWait + serviceMins)
    );

    steps.push({
      stepNumber: index + 1,
      testId: testObj.id,
      testName: testObj.name,
      code: testObj.code,
      departmentId: testObj.departmentId,
      room: live.room,
      floor: live.floor,
      walkingMinutes: walkMins,
      waitMinutes: smartWait,
      serviceMinutes: serviceMins,
      stepTotalMinutes,
      standaloneTotalMinutes: live.estimatedTotalMinutes,
      throughputPerHour: live.throughputPerHour,
      waitingAhead: live.liveWaitingCount,
      isUnavailable: live.isUnavailable
    });

    prevDept = dept;
  });

  const totalEstimatedMinutes = Math.max(
    1,
    Math.round(
      steps.reduce(
        (sum, s) => sum + s.walkingMinutes + s.waitMinutes + s.serviceMinutes,
        0
      )
    )
  );

  // Evaluate unoptimized input-order baseline (using same walking physics, without smart queue drain or bay-queue reuse)
  let naiveTotalMinutes = totalEstimatedMinutes;
  if (uniqueIds.length > 1) {
    let naivePrevDept: Department | undefined = undefined;
    let naiveRawSum = 0;
    uniqueIds.forEach((tId, idx) => {
      const tObj = context.tests.find(t => t.id === tId);
      if (!tObj) return;
      const dept = context.departments.find(d => d.id === tObj.departmentId);
      const live = liveEstByTestId[tId] || getTestLiveEstimate(tObj, context);
      const walk = idx === 0 ? 1.5 : calculateTransitMinutes(naivePrevDept, dept);
      naiveRawSum += walk + live.queueWaitMinutes + live.effectiveServiceMinutes;
      naivePrevDept = dept;
    });
    naiveTotalMinutes = Math.max(totalEstimatedMinutes, Math.round(naiveRawSum));
  }

  const timeSavedMinutes =
    uniqueIds.length > 1
      ? Math.max(0, naiveTotalMinutes - totalEstimatedMinutes)
      : 0;

  const readyDate = new Date(now.getTime() + totalEstimatedMinutes * 60_000);
  const readyAtTime = readyDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const activeThroughputs = steps
    .map(s => s.throughputPerHour)
    .filter(v => v > 0);
  const averageHourlyThroughput =
    activeThroughputs.length > 0
      ? Math.max(
          1,
          Math.round(
            activeThroughputs.reduce((a, b) => a + b, 0) / activeThroughputs.length
          )
        )
      : 0;

  // Deduplicate waiting counts by department so two tests in same dept aren't double-counted
  const seenDepts = new Set<string>();
  let totalLiveWaiting = 0;
  for (const s of steps) {
    if (!seenDepts.has(s.departmentId)) {
      seenDepts.add(s.departmentId);
      totalLiveWaiting += s.waitingAhead;
    }
  }

  // Count clinical reports relevant to the selected tests / selected departments
  const selectedDeptIds = new Set(steps.map(s => s.departmentId));
  const selectedCounterIds = new Set(
    context.counters
      .filter(c => selectedDeptIds.has(c.departmentId))
      .map(c => c.id)
  );
  const selectedTestIdSet = new Set(uniqueIds);
  const observedReportCount = context.clinicalReports.filter(
    r => selectedTestIdSet.has(r.testId) || (r.counterId && selectedCounterIds.has(r.counterId))
  ).length;

  return {
    steps,
    totalEstimatedMinutes,
    naiveTotalMinutes,
    timeSavedMinutes,
    transitMinutes: Number(totalTransit.toFixed(1)),
    readyAtTime,
    averageHourlyThroughput,
    totalLiveWaiting,
    hourLabel: baseHourly.hourLabel,
    rushLevel: baseHourly.rushLevel,
    observedReportCount,
    unavailableTestNames
  };
}

/**
 * Generates live telemetry across all hospital diagnostic departments for the Doctor Dashboard.
 */
export function getAllDepartmentTelemetry(
  context: LabTelemetryContext
): DepartmentTelemetryRow[] {
  const now = context.now ?? new Date();

  return context.departments.map(dept => {
    const { isUnavailable, activeUnits, totalUnits, activeCounters, deptCounters } =
      resolveActiveDepartmentCapacity(dept, context.counters, dept.id);
    const hourly = getHourlyDemandProfile(dept.category, now);

    const deptTests = context.tests.filter(t => t.departmentId === dept.id);
    const repTest = deptTests[0];
    const baseTestDuration =
      deptTests.length > 0
        ? deptTests.reduce((s, t) => s + t.averageDurationMinutes, 0) / deptTests.length
        : 8;

    const counterAvg =
      activeCounters.length > 0
        ? activeCounters.reduce((s, c) => s + (c.averageServiceMinutes || baseTestDuration), 0) /
          activeCounters.length
        : baseTestDuration;

    const deptTokens = context.queueTokens.filter(t => t.departmentId === dept.id);
    const waitingCount = deptTokens.filter(t => t.status === 'waiting' || t.status === 'called').length;
    const inProgressCount = deptTokens.filter(t => t.status === 'in_progress').length;
    const totalActiveQueue = waitingCount + inProgressCount;

    const deptCounterIds = new Set(deptCounters.map(c => c.id));
    const deptReports = context.clinicalReports.filter(
      r =>
        deptTests.some(t => t.id === r.testId) ||
        (r.counterId && deptCounterIds.has(r.counterId))
    );
    const observedDurations = deptReports
      .map(r => r.actualTurnaroundMinutes)
      .filter((m): m is number => typeof m === 'number' && Number.isFinite(m) && m > 0);

    let avgServiceMinutes = 0.5 * baseTestDuration + 0.5 * counterAvg;
    if (observedDurations.length > 0) {
      const meanObs = observedDurations.reduce((a, b) => a + b, 0) / observedDurations.length;
      const w = Math.min(0.55, observedDurations.length * 0.15);
      avgServiceMinutes = (1 - w) * avgServiceMinutes + w * meanObs;
    }
    avgServiceMinutes = Number(Math.max(2, avgServiceMinutes).toFixed(1));

    const intakeBase = isUnavailable
      ? 0
      : Math.max(0, Math.round(hourly.demandFactor * 1.15));

    const estimatedWaitMinutes = isUnavailable
      ? totalActiveQueue > 0 ? totalActiveQueue * 20 + 90 : 90
      : totalActiveQueue > 0
        ? intakeBase + Math.max(1, Math.round((totalActiveQueue * avgServiceMinutes) / Math.max(1, activeUnits)))
        : intakeBase;

    const estimatedWaitPlusServiceMinutes = repTest
      ? getTestLiveEstimate(repTest, context).estimatedTotalMinutes
      : Math.round(estimatedWaitMinutes + avgServiceMinutes);

    const maxCapPerHour = (60 / Math.max(2, avgServiceMinutes)) * Math.max(1, activeUnits);
    const hourlyLoadPenalty = Math.min(
      0.45,
      totalActiveQueue * 0.055 + Math.max(0, hourly.demandFactor - 0.35) * 0.19
    );
    const throughputPerHour = isUnavailable
      ? 0
      : Math.max(1, Math.round(maxCapPerHour * (1 - hourlyLoadPenalty)));

    const servedToday =
      deptCounters.reduce((sum, c) => sum + (c.servedCountToday || 0), 0) +
      deptReports.length;

    const utilizationPct = isUnavailable
      ? 0
      : Math.min(
          100,
          Math.round((totalActiveQueue / Math.max(1, activeUnits * 4)) * 70 + hourly.demandFactor * 22)
        );

    const status: DepartmentTelemetryRow['status'] = isUnavailable
      ? 'unavailable'
      : totalActiveQueue >= 3 || utilizationPct >= 75
        ? 'busy'
        : 'available';

    return {
      departmentId: dept.id,
      departmentName: dept.name,
      code: dept.code,
      category: dept.category,
      room: dept.location.room,
      floor: dept.location.floor,
      waitingCount,
      inProgressCount,
      activeUnits,
      totalUnits,
      avgServiceMinutes,
      estimatedWaitMinutes,
      estimatedWaitPlusServiceMinutes,
      throughputPerHour,
      servedToday,
      reportCount: deptReports.length,
      utilizationPct,
      rushLevel: hourly.rushLevel,
      status
    };
  });
}
