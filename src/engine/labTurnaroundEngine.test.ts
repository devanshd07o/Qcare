import { describe, it, expect } from 'vitest';
import {
  getHourlyDemandProfile,
  getTestLiveEstimate,
  estimateWalkinInvestigations,
  getAllDepartmentTelemetry
} from './labTurnaroundEngine';
import {
  INITIAL_TESTS,
  INITIAL_DEPARTMENTS,
  INITIAL_COUNTERS,
  DEMO_SCENARIO_TOKENS
} from '../data/mockHospitalData';
import { ClinicalReport, Counter, QueueToken } from '../types';

describe('Lab Turnaround & Dynamic Q-Care Estimation Engine', () => {
  const baseMorning = new Date(2026, 9, 25, 9, 30, 0); // 09:30 AM peak OPD hour
  const baseNight = new Date(2026, 9, 25, 22, 15, 0); // 10:15 PM off-peak hour

  it('computes distinct hourly demand profiles across morning rush vs off-peak night hours', () => {
    const morningPath = getHourlyDemandProfile('pathology', baseMorning);
    const nightPath = getHourlyDemandProfile('pathology', baseNight);

    expect(morningPath.hourLabel).toBe('09:00–10:00');
    expect(nightPath.hourLabel).toBe('22:00–23:00');
    expect(morningPath.demandFactor).toBeGreaterThan(nightPath.demandFactor);
    expect(morningPath.rushLevel).toBe('peak');
    expect(nightPath.rushLevel).toBe('low');
  });

  it('dynamically adapts test estimated time and per-hour throughput based on live queue tokens and lab reports', () => {
    const cbc = INITIAL_TESTS.find(t => t.id === 'test-cbc')!;
    const emptyCtx = {
      tests: INITIAL_TESTS,
      departments: INITIAL_DEPARTMENTS,
      counters: INITIAL_COUNTERS,
      queueTokens: [] as QueueToken[],
      clinicalReports: [] as ClinicalReport[],
      now: baseMorning
    };

    const idleEst = getTestLiveEstimate(cbc, emptyCtx);
    expect(idleEst.estimatedTotalMinutes).toBeGreaterThanOrEqual(5);
    expect(idleEst.throughputPerHour).toBeGreaterThan(0);
    expect(idleEst.liveWaitingCount).toBe(0);

    // Add 4 active tokens waiting in pathology (Blood Lab)
    const busyEst = getTestLiveEstimate(cbc, {
      ...emptyCtx,
      queueTokens: DEMO_SCENARIO_TOKENS
    });

    expect(busyEst.liveWaitingCount).toBeGreaterThan(0);
    expect(busyEst.estimatedTotalMinutes).toBeGreaterThan(idleEst.estimatedTotalMinutes);
    expect(busyEst.throughputPerHour).toBeLessThanOrEqual(idleEst.throughputPerHour);

    // Add real observed lab reports showing slower actual lab turnaround (14 mins)
    const slowReports: ClinicalReport[] = [
      {
        id: 'rep-slow-1',
        testId: 'test-cbc',
        testName: 'Blood Collection',
        patientId: 'p1',
        patientUhid: 'QC-1',
        patientName: 'Test P1',
        technicianName: 'Tech 1',
        counterId: 'counter-phleb-1',
        roomNo: 'Room 12',
        timestamp: '09:20 AM',
        createdAtMs: baseMorning.getTime() - 600_000,
        actualTurnaroundMinutes: 14,
        status: 'uploaded',
        summary: 'Done',
        metrics: []
      },
      {
        id: 'rep-slow-2',
        testId: 'test-cbc',
        testName: 'Blood Collection',
        patientId: 'p2',
        patientUhid: 'QC-2',
        patientName: 'Test P2',
        technicianName: 'Tech 1',
        counterId: 'counter-phleb-1',
        roomNo: 'Room 12',
        timestamp: '09:25 AM',
        createdAtMs: baseMorning.getTime() - 300_000,
        actualTurnaroundMinutes: 15,
        status: 'uploaded',
        summary: 'Done',
        metrics: []
      }
    ];

    const adaptedEst = getTestLiveEstimate(cbc, {
      ...emptyCtx,
      queueTokens: DEMO_SCENARIO_TOKENS,
      clinicalReports: slowReports
    });

    expect(adaptedEst.reportSampleCount).toBe(2);
    expect(adaptedEst.effectiveServiceMinutes).toBeGreaterThan(busyEst.effectiveServiceMinutes);
    expect(adaptedEst.estimatedTotalMinutes).toBeGreaterThan(busyEst.estimatedTotalMinutes);
  });

  it('handles unavailable / closed lab departments safely without division by zero', () => {
    const lipid = INITIAL_TESTS.find(t => t.id === 'test-lipid')!;
    const closedDepts = INITIAL_DEPARTMENTS.map(d =>
      d.id === 'dept-biochem' ? { ...d, activeMachines: 0, availabilityStatus: 'unavailable' as const } : d
    );
    const closedCounters: Counter[] = INITIAL_COUNTERS.map(c =>
      c.departmentId === 'dept-biochem' ? { ...c, status: 'closed' as const } : c
    );

    const est = getTestLiveEstimate(lipid, {
      tests: INITIAL_TESTS,
      departments: closedDepts,
      counters: closedCounters,
      queueTokens: [],
      clinicalReports: [],
      now: baseMorning
    });

    expect(est.isUnavailable).toBe(true);
    expect(est.loadStatus).toBe('unavailable');
    expect(est.throughputPerHour).toBe(0);
    expect(est.estimatedTotalMinutes).toBeGreaterThanOrEqual(90);
  });

  it('calculates real multi-test Q-Care combined estimate for Blood Collection + Chest X-Ray + Lipid Profile', () => {
    const selected = ['test-cbc', 'test-xray-chest', 'test-lipid'];

    const plan = estimateWalkinInvestigations(selected, {
      tests: INITIAL_TESTS,
      departments: INITIAL_DEPARTMENTS,
      counters: INITIAL_COUNTERS,
      queueTokens: DEMO_SCENARIO_TOKENS,
      clinicalReports: [],
      now: baseMorning,
      doctorPriority: 'normal'
    });

    expect(plan.steps).toHaveLength(3);
    expect(plan.totalEstimatedMinutes).toBeGreaterThan(15);
    expect(plan.readyAtTime).toBeTruthy();
    expect(plan.hourLabel).toBe('09:00–10:00');
    expect(plan.averageHourlyThroughput).toBeGreaterThan(0);
    expect(plan.totalLiveWaiting).toBeGreaterThan(0);

    // Fasting test (Lipid Profile) or low-wait X-ray should be sequenced smartly ahead of congested Blood Lab
    const stepIds = plan.steps.map(s => s.testId);
    expect(stepIds).toContain('test-cbc');
    expect(stepIds).toContain('test-xray-chest');
    expect(stepIds).toContain('test-lipid');

    // Urgent priority should reduce wait projection compared to routine
    const urgentPlan = estimateWalkinInvestigations(selected, {
      tests: INITIAL_TESTS,
      departments: INITIAL_DEPARTMENTS,
      counters: INITIAL_COUNTERS,
      queueTokens: DEMO_SCENARIO_TOKENS,
      clinicalReports: [],
      now: baseMorning,
      doctorPriority: 'urgent'
    });
    expect(urgentPlan.totalEstimatedMinutes).toBeLessThanOrEqual(plan.totalEstimatedMinutes);
  });

  it('handles empty, duplicate, and unknown test IDs gracefully', () => {
    const emptyPlan = estimateWalkinInvestigations([], {
      tests: INITIAL_TESTS,
      departments: INITIAL_DEPARTMENTS,
      counters: INITIAL_COUNTERS,
      queueTokens: [],
      clinicalReports: [],
      now: baseMorning
    });
    expect(emptyPlan.steps).toHaveLength(0);
    expect(emptyPlan.totalEstimatedMinutes).toBe(0);
    expect(emptyPlan.timeSavedMinutes).toBe(0);

    const dupAndUnknown = estimateWalkinInvestigations(['test-cbc', 'test-cbc', 'nonexistent-test'], {
      tests: INITIAL_TESTS,
      departments: INITIAL_DEPARTMENTS,
      counters: INITIAL_COUNTERS,
      queueTokens: [],
      clinicalReports: [],
      now: baseMorning
    });
    expect(dupAndUnknown.steps).toHaveLength(1);
    expect(dupAndUnknown.steps[0].testId).toBe('test-cbc');
  });

  it('returns live telemetry across all 10 hospital diagnostic bays for the Doctor Dashboard', () => {
    const telemetry = getAllDepartmentTelemetry({
      tests: INITIAL_TESTS,
      departments: INITIAL_DEPARTMENTS,
      counters: INITIAL_COUNTERS,
      queueTokens: DEMO_SCENARIO_TOKENS,
      clinicalReports: [],
      now: baseMorning
    });

    expect(telemetry).toHaveLength(INITIAL_DEPARTMENTS.length);
    const bloodBay = telemetry.find(d => d.departmentId === 'dept-pathology')!;
    expect(bloodBay.waitingCount).toBeGreaterThan(0);
    expect(bloodBay.throughputPerHour).toBeGreaterThan(0);
    expect(bloodBay.estimatedWaitPlusServiceMinutes).toBeGreaterThan(0);
  });

  it('excludes the patient own minted tokens when excludePatientId is passed so slip time matches pre-issue estimate', () => {
    const selected = ['test-cbc', 'test-xray-chest', 'test-lipid'];
    const preEstimate = estimateWalkinInvestigations(selected, {
      tests: INITIAL_TESTS,
      departments: INITIAL_DEPARTMENTS,
      counters: INITIAL_COUNTERS,
      queueTokens: [],
      clinicalReports: [],
      now: baseMorning
    });

    const patientOwnTokens: QueueToken[] = [
      {
        id: 't1',
        tokenNumber: 'BLD-10',
        patientId: 'pat-meera',
        testId: 'test-cbc',
        departmentId: 'dept-pathology',
        priority: 'standard',
        status: 'waiting',
        issuedAt: '09:30 AM',
        queuePosition: 1,
        estimatedWaitMinutes: 6
      },
      {
        id: 't2',
        tokenNumber: 'X-10',
        patientId: 'pat-meera',
        testId: 'test-xray-chest',
        departmentId: 'dept-radiology',
        priority: 'standard',
        status: 'waiting',
        issuedAt: '09:30 AM',
        queuePosition: 1,
        estimatedWaitMinutes: 7
      },
      {
        id: 't3',
        tokenNumber: 'B-10',
        patientId: 'pat-meera',
        testId: 'test-lipid',
        departmentId: 'dept-biochem',
        priority: 'standard',
        status: 'waiting',
        issuedAt: '09:30 AM',
        queuePosition: 1,
        estimatedWaitMinutes: 7
      }
    ];

    const postEstimate = estimateWalkinInvestigations(selected, {
      tests: INITIAL_TESTS,
      departments: INITIAL_DEPARTMENTS,
      counters: INITIAL_COUNTERS,
      queueTokens: patientOwnTokens,
      clinicalReports: [],
      now: baseMorning,
      excludePatientId: 'pat-meera'
    });

    expect(postEstimate.totalEstimatedMinutes).toBe(preEstimate.totalEstimatedMinutes);
  });
});
