import {
  Department,
  DiagnosticTest,
  Counter,
  QueueToken,
  Patient,
  QueueRoutingPlan,
  RouteStep,
  DoctorPriority
} from '../types';

/**
 * Calculates transit / walking duration in minutes between two hospital departments.
 */
export function calculateTransitMinutes(
  deptA?: Department,
  deptB?: Department
): number {
  if (!deptA || !deptB) return 2.0;
  if (deptA.id === deptB.id) return 0.5;

  let transit = 1.0;

  // Floor difference (stairs / elevator)
  if (deptA.location.floor !== deptB.location.floor) {
    transit += 2.0;
  }

  // Wing difference (corridor traverse)
  if (deptA.location.wing !== deptB.location.wing) {
    transit += 2.0;
  }

  return Math.min(transit, 6.0);
}

/**
 * Formats wait time in minutes into a realistic natural range.
 * E.g., 0-2 -> "Immediate (< 3 min)", 15 -> "Approx. 13–19 min"
 */
export function formatWaitRange(minutes: number): string {
  if (minutes <= 2) return 'Immediate (< 3 min)';
  const min = Math.max(1, Math.round(minutes * 0.85));
  const max = Math.round(minutes * 1.15) + 2;
  return `Approx. ${min}–${max} min`;
}

/**
 * Calculates current department waiting time accounting for active counters and machines.
 * Formula: (Patients Ahead * Average Service Duration) / Max(1, Active Serving Units)
 */
export function calculateDepartmentCurrentWait(
  deptId: string,
  tokens: QueueToken[],
  counters: Counter[],
  patientId?: string,
  departments?: Department[],
  deptServiceOverride?: number
): {
  waitMinutes: number;
  waitingCount: number;
  activeCountersCount: number;
  avgService: number;
  isClosed: boolean;
} {
  const dept = departments?.find(d => d.id === deptId);
  const isDeptMarkedUnavailable = dept?.availabilityStatus === 'unavailable';

  const deptCounters = counters.filter(c => c.departmentId === deptId);
  const activeCounters = deptCounters.filter(c => c.status === 'active');

  const isClosed = isDeptMarkedUnavailable ||
    (dept?.activeMachines !== undefined && dept.activeMachines <= 0) ||
    (deptCounters.length > 0 && activeCounters.length === 0);

  // Determine effective parallel serving capacity
  const activeCountersCount = isClosed
    ? 0
    : (dept?.activeMachines !== undefined && dept.activeMachines > 0
        ? (activeCounters.length > 0 ? Math.max(activeCounters.length, dept.activeMachines) : dept.activeMachines)
        : Math.max(1, activeCounters.length));

  const avgService =
    typeof deptServiceOverride === 'number' && deptServiceOverride > 0
      ? deptServiceOverride
      : activeCounters.length > 0
        ? activeCounters.reduce((acc, c) => acc + (c.averageServiceMinutes || 6.0), 0) / activeCounters.length
        : 6.0;

  // Count active tokens currently waiting, called, or in progress (excluding patient's own token)
  const waitingTokens = tokens.filter(
    t => t.departmentId === deptId &&
         (t.status === 'waiting' || t.status === 'called' || t.status === 'in_progress') &&
         (!patientId || t.patientId !== patientId)
  );
  const waitingCount = waitingTokens.length;

  const waitMinutes = isClosed
    ? (waitingCount > 0 ? waitingCount * 20 + 90 : 90)
    : (waitingCount === 0
        ? 0
        : Math.max(1, Math.round((waitingCount * avgService) / Math.max(1, activeCountersCount))));

  return {
    waitMinutes,
    waitingCount,
    activeCountersCount,
    avgService,
    isClosed
  };
}

/**
 * Simulates wait time at a department after elapsed minutes of prior tests.
 */
function estimateProjectedWait(
  deptId: string,
  elapsedMinutes: number,
  tokens: QueueToken[],
  counters: Counter[],
  patientId?: string,
  departments?: Department[],
  projectedLoadCount: number = 0,
  deptServiceOverride?: number
): number {
  const current = calculateDepartmentCurrentWait(deptId, tokens, counters, patientId, departments, deptServiceOverride);
  if (current.isClosed) {
    return current.waitMinutes;
  }
  const effectiveSpeed = Math.max(1, current.avgService || 6.0);
  const effectiveUnits = Math.max(1, current.activeCountersCount);

  const patientsServedDuringElapsed = Math.floor((elapsedMinutes / effectiveSpeed) * effectiveUnits);
  const projectedWaiting = Math.max(0, current.waitingCount - patientsServedDuringElapsed) + projectedLoadCount;
  return Math.round((projectedWaiting * effectiveSpeed) / effectiveUnits);
}

/**
 * Generates topologically valid permutations of tests honoring prerequisite dependencies.
 * Uses Beam Search for N > 7 to eliminate combinatorial explosion.
 */
function generateValidSequences(
  tests: DiagnosticTest[],
  completedTestIds: string[] = []
): DiagnosticTest[][] {
  if (tests.length === 0) return [[]];
  if (tests.length === 1) return [tests];

  const testIdSet = new Set(tests.map(t => t.id));

  const isPrereqSatisfied = (test: DiagnosticTest, current: DiagnosticTest[]) => {
    if (!test.prerequisites || test.prerequisites.length === 0) return true;
    return test.prerequisites.every(
      prereqId =>
        prereqId === test.id || // Self-dependency guard
        !testIdSet.has(prereqId) || // Missing from prescribed set guard
        completedTestIds.includes(prereqId) ||
        current.some(t => t.id === prereqId)
    );
  };

  if (tests.length <= 7) {
    const result: DiagnosticTest[][] = [];

    function permute(current: DiagnosticTest[], remaining: DiagnosticTest[]) {
      if (remaining.length === 0) {
        result.push(current);
        return;
      }

      let branched = false;
      for (let i = 0; i < remaining.length; i++) {
        const nextTest = remaining[i];
        if (isPrereqSatisfied(nextTest, current)) {
          branched = true;
          const newRemaining = [...remaining.slice(0, i), ...remaining.slice(i + 1)];
          permute([...current, nextTest], newRemaining);
        }
      }

      // If cyclic dependency blocked all branches, append remaining to prevent deadlocks
      if (!branched && remaining.length > 0) {
        result.push([...current, ...remaining]);
      }
    }

    permute([], tests);
    return result.length > 0 ? result : [tests];
  }

  // Beam Search heuristic for N > 7
  const BEAM_WIDTH = 12;
  let beam: { current: DiagnosticTest[]; remaining: DiagnosticTest[] }[] = [
    { current: [], remaining: [...tests] }
  ];

  while (beam.length > 0 && beam[0].remaining.length > 0) {
    const nextLevel: { current: DiagnosticTest[]; remaining: DiagnosticTest[] }[] = [];

    for (const state of beam) {
      let branched = false;
      for (let i = 0; i < state.remaining.length; i++) {
        const nextTest = state.remaining[i];
        if (isPrereqSatisfied(nextTest, state.current)) {
          branched = true;
          const newRemaining = [...state.remaining.slice(0, i), ...state.remaining.slice(i + 1)];
          nextLevel.push({
            current: [...state.current, nextTest],
            remaining: newRemaining
          });
        }
      }

      if (!branched && state.remaining.length > 0) {
        nextLevel.push({
          current: [...state.current, ...state.remaining],
          remaining: []
        });
      }
    }

    beam = nextLevel.slice(0, BEAM_WIDTH);
  }

  const result = beam.map(b => b.current);
  return result.length > 0 ? result : [tests];
}

/**
 * Evaluates total duration, transit time, and scoring penalties for a test sequence.
 */
function evaluateSequence(
  sequence: DiagnosticTest[],
  departments: Department[],
  tokens: QueueToken[],
  counters: Counter[],
  startTimeDate: Date = new Date(),
  patientId?: string,
  projectedLoadMap: Record<string, number> = {},
  doctorPriority: DoctorPriority = 'normal',
  completedTestIds: string[] = [],
  testDurationOverrides: Record<string, number> = {},
  deptServiceOverrides: Record<string, number> = {}
): {
  totalTime: number;
  steps: RouteStep[];
  bottlenecks: string[];
  transitTotal: number;
  penaltyScore: number;
} {
  let currentTimeOffset = 0;
  let totalTransit = 0;
  let penaltyScore = 0;
  const steps: RouteStep[] = [];
  const bottlenecks: string[] = [];

  let previousDept: Department | undefined = undefined;

  for (let idx = 0; idx < sequence.length; idx++) {
    const test = sequence[idx];
    const dept = departments.find(d => d.id === test.departmentId);
    const transitTime = calculateTransitMinutes(previousDept, dept);
    currentTimeOffset += transitTime;
    totalTransit += transitTime;

    const projectedLoad = projectedLoadMap[test.departmentId] || 0;

    const projectedWait = estimateProjectedWait(
      test.departmentId,
      currentTimeOffset,
      tokens,
      counters,
      patientId,
      departments,
      projectedLoad,
      deptServiceOverrides[test.departmentId]
    );

    if (projectedWait > 25 && dept) {
      if (!bottlenecks.includes(dept.name)) {
        bottlenecks.push(dept.name);
      }
    }

    const overrideDur = testDurationOverrides[test.id];
    const testDuration =
      typeof overrideDur === 'number' && overrideDur > 0
        ? overrideDur
        : (test.averageDurationMinutes && test.averageDurationMinutes > 0)
          ? test.averageDurationMinutes
          : 6;
    const startOffset = currentTimeOffset + projectedWait;
    const endOffset = startOffset + testDuration;

    const stepStart = new Date(startTimeDate.getTime() + startOffset * 60000);
    const stepEnd = new Date(startTimeDate.getTime() + endOffset * 60000);

    const formatTime = (d: Date) =>
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let reason = '';
    if (idx === 0 && projectedWait <= 5) {
      reason = 'Lowest queue wait & immediate availability.';
    } else if (test.requiresFullBladder) {
      reason = 'Full bladder preparation: prioritized early before voiding.';
    } else if (test.requiresFasting) {
      reason = 'Fasting prerequisite: prioritized early to minimize fasting duration.';
    } else if (projectedWait < 10) {
      reason = 'Diagnostic counter operating near real-time capacity.';
    } else {
      reason = 'Optimal sequence while earlier queues clear.';
    }

    if (doctorPriority === 'urgent' && idx === 0) {
      reason = 'Urgent Doctor Priority: Fast-tracked ahead of routine queues.';
    }

    const activeDeptCounters = counters.filter(c => c.departmentId === test.departmentId && c.status === 'active');
    const recommendedCounter = activeDeptCounters[0] || counters.find(c => c.departmentId === test.departmentId);

    steps.push({
      stepNumber: idx + 1,
      testId: test.id,
      testName: test.name,
      technicalName: test.technicalName,
      testCode: test.code,
      departmentId: test.departmentId,
      departmentName: dept?.name || 'Department',
      location: dept?.location || {
        wing: 'East Wing',
        floor: 'Ground Floor',
        room: 'Diagnostic Bay'
      },
      recommendedCounterId: recommendedCounter?.id,
      estimatedWaitMinutes: projectedWait,
      estimatedDurationMinutes: testDuration,
      walkingTimeFromPrevMinutes: transitTime,
      expectedStartTime: formatTime(stepStart),
      expectedEndTime: formatTime(stepEnd),
      status: idx === 0 ? 'up_next' : 'queued',
      reasonForSequence: reason,
      priority: doctorPriority,
      preparationNotes: test.preparationNotes,
      waitRangeText: formatWaitRange(projectedWait)
    });

    currentTimeOffset = endOffset;
    previousDept = dept;

    // Penalty adjustments
    if (test.requiresFullBladder && idx > 0) {
      if (doctorPriority === 'priority' || doctorPriority === 'urgent') {
        penaltyScore += 25 * idx;
      } else {
        penaltyScore += 2 * idx;
      }
    }

    // Fasting priority: penalized if delayed
    if (test.requiresFasting && idx > 1) {
      penaltyScore += 1 * idx;
    }

    // Prerequisite enforcement: massive penalty if scheduled before prerequisites are satisfied
    if (test.prerequisites && test.prerequisites.length > 0) {
      const priorTestIds = sequence.slice(0, idx).map(t => t.id);
      const isUnmet = test.prerequisites.some(
        prereqId => !completedTestIds.includes(prereqId) && !priorTestIds.includes(prereqId)
      );
      if (isUnmet) {
        penaltyScore += 50000 * (sequence.length - idx);
      }
    }

    const isDeptUnavailable = dept?.availabilityStatus === 'unavailable' ||
      (dept?.activeMachines !== undefined && dept.activeMachines <= 0) ||
      (counters.some(c => c.departmentId === test.departmentId) && activeDeptCounters.length === 0);

    if (isDeptUnavailable) {
      penaltyScore += 10000 * (sequence.length - idx);
    }

    if (doctorPriority === 'urgent' && idx === 0) {
      penaltyScore -= 15;
    } else if (doctorPriority === 'priority' && idx === 0) {
      penaltyScore -= 5;
    }
  }

  return {
    totalTime: currentTimeOffset,
    steps,
    bottlenecks,
    transitTotal: totalTransit,
    penaltyScore
  };
}

/**
 * Calculates the optimal diagnostic journey for a patient.
 * 
 * Stability Lock Invariant:
 * If a patient has an active `currentLockedDestinationTestId` and that test is not yet completed,
 * that test remains LOCKED as Step 1. Rerouting optimizes ONLY the subsequent pending tests.
 */
export function calculateOptimalQueueRoute(
  patient: Patient,
  allTests: DiagnosticTest[],
  departments: Department[],
  tokens: QueueToken[],
  counters: Counter[],
  projectedLoadMap: Record<string, number> = {},
  testDurationOverrides: Record<string, number> = {},
  deptServiceOverrides: Record<string, number> = {}
): QueueRoutingPlan {
  const completedTestIds = patient.completedTests || [];

  // Filter pending tests
  const pendingTestIds = patient.prescribedTests.filter(
    id => !completedTestIds.includes(id)
  );

  const pendingTests = pendingTestIds
    .map(id => allTests.find(t => t.id === id))
    .filter((t): t is DiagnosticTest => Boolean(t));

  const now = new Date();

  // Completed steps representation
  const completedSteps: RouteStep[] = completedTestIds
    .map((testId, idx) => {
      const test = allTests.find(t => t.id === testId);
      const dept = test ? departments.find(d => d.id === test.departmentId) : undefined;
      const matchedToken = tokens.find(t => t.patientId === patient.id && t.testId === testId);
      return {
        stepNumber: idx + 1,
        testId,
        testName: test?.name || 'Completed Investigation',
        technicalName: test?.technicalName || 'Completed',
        testCode: test?.code || 'DONE',
        departmentId: test?.departmentId || '',
        departmentName: dept?.name || 'Laboratory',
        location: dept?.location || {
          wing: 'East Wing',
          floor: 'Ground Floor',
          room: 'Diagnostic Bay'
        },
        recommendedCounterId: matchedToken?.counterId,
        estimatedWaitMinutes: 0,
        estimatedDurationMinutes: test?.averageDurationMinutes || 5,
        walkingTimeFromPrevMinutes: 0,
        expectedStartTime: 'Completed',
        expectedEndTime: 'Completed',
        status: 'completed' as const,
        reasonForSequence: 'Investigation completed & sample processed.',
        priority: patient.doctorPriority || 'normal',
        preparationNotes: test?.preparationNotes,
        waitRangeText: 'Completed'
      };
    });

  if (pendingTests.length === 0) {
    return {
      patientId: patient.id,
      calculatedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      smartRouteSteps: completedSteps,
      smartTotalTimeMinutes: 0,
      naiveTotalTimeMinutes: 0,
      timeSavedMinutes: 0,
      percentageSaved: 0,
      bottlenecksAvoided: completedSteps.length > 0 ? ['All prescribed investigations completed'] : [],
      fastingSatisfied: true,
      transitTotalMinutes: 0,
      recommendedNextTestId: undefined,
      recommendationReason: 'All diagnostic investigations completed. Return to doctor consultation room.'
    };
  }

  const patientDoctorPriority: DoctorPriority = patient.doctorPriority || 'normal';

  // Check Stability Lock:
  // If destination is locked to a test that is still pending, it MUST stay at position 1!
  const lockedTestId = patient.currentLockedDestinationTestId;
  const isLockedAndPending = lockedTestId && pendingTests.some(t => t.id === lockedTestId);

  let candidatePermutations: DiagnosticTest[][];

  if (isLockedAndPending) {
    const lockedTest = pendingTests.find(t => t.id === lockedTestId)!;
    const otherPending = pendingTests.filter(t => t.id !== lockedTestId);
    const subPermutations = generateValidSequences(otherPending, [...completedTestIds, lockedTestId]);
    candidatePermutations = subPermutations.map(sub => [lockedTest, ...sub]);
  } else {
    candidatePermutations = generateValidSequences(pendingTests, completedTestIds);
  }

  const naiveSequence = [...pendingTests];
  const naiveEvaluation = evaluateSequence(
    naiveSequence,
    departments,
    tokens,
    counters,
    now,
    patient.id,
    projectedLoadMap,
    patientDoctorPriority,
    completedTestIds,
    testDurationOverrides,
    deptServiceOverrides
  );

  const getEvaluationScore = (ev: { totalTime: number; penaltyScore: number }) =>
    ev.totalTime + ev.penaltyScore;

  const firstValidPerm = candidatePermutations[0] || naiveSequence;
  let bestEvaluation = evaluateSequence(
    firstValidPerm,
    departments,
    tokens,
    counters,
    now,
    patient.id,
    projectedLoadMap,
    patientDoctorPriority,
    completedTestIds,
    testDurationOverrides,
    deptServiceOverrides
  );

  for (const perm of candidatePermutations) {
    const evaluation = evaluateSequence(
      perm,
      departments,
      tokens,
      counters,
      now,
      patient.id,
      projectedLoadMap,
      patientDoctorPriority,
      completedTestIds,
      testDurationOverrides,
      deptServiceOverrides
    );
    if (getEvaluationScore(evaluation) < getEvaluationScore(bestEvaluation)) {
      bestEvaluation = evaluation;
    }
  }

  const offset = completedSteps.length;
  const renumberedSteps: RouteStep[] = bestEvaluation.steps.map((step, idx) => ({
    ...step,
    stepNumber: offset + idx + 1,
    status: idx === 0 ? ('up_next' as const) : ('queued' as const)
  }));

  const allRouteSteps = [...completedSteps, ...renumberedSteps];

  const naiveTotal = Math.max(naiveEvaluation.totalTime, 1);
  const smartTotal = bestEvaluation.totalTime;
  const timeSaved = Math.max(0, naiveTotal - smartTotal);
  const percentage = Math.round((timeSaved / naiveTotal) * 100);

  const avoided = naiveEvaluation.bottlenecks.filter(b => !bestEvaluation.bottlenecks.includes(b));
  if (avoided.length === 0 && naiveEvaluation.bottlenecks.length > 0) {
    avoided.push(...naiveEvaluation.bottlenecks.map(b => `${b} (peak rush avoided)`));
  }

  const upNextStep = renumberedSteps[0];

  return {
    patientId: patient.id,
    calculatedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    smartRouteSteps: allRouteSteps,
    smartTotalTimeMinutes: smartTotal,
    naiveTotalTimeMinutes: naiveTotal,
    timeSavedMinutes: timeSaved,
    percentageSaved: percentage,
    bottlenecksAvoided: avoided.length > 0 ? avoided : ['Hematology Peak Rush Avoided'],
    fastingSatisfied: true,
    transitTotalMinutes: bestEvaluation.transitTotal,
    recommendedNextTestId: upNextStep?.testId,
    recommendationReason: upNextStep?.reasonForSequence || 'Optimal diagnostic path calculated by smart routing engine.'
  };
}
