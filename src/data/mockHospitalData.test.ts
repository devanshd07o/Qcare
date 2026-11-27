import { describe, it, expect } from 'vitest';
import {
  DEFAULT_HOSPITAL,
  REGISTERED_HOSPITALS,
  INITIAL_TESTS,
  getDepartmentsForHospital,
  getCountersForHospital,
  DEMO_SCENARIO_PATIENT,
  DEMO_SCENARIO_TOKENS,
  DEMO_SCENARIO_PATIENTS_LIST,
  createCanonicalDemoDataset
} from './mockHospitalData';
import { HISTORICAL_PATIENT_RECORDS } from './historicalPatientsData';

const ALL_HOSPITAL_CODES = [
  'MAX-01',
  'APOLLO-02',
  'AIIMS-03',
  'SAFDARJUNG-04',
  'RML-05',
  'LNJP-06'
] as const;

describe('mockHospitalData invariants & canonical demo dataset', () => {
  it('produces 10 departments and 10 counters per hospital with exact room === roomNo alignment', () => {
    for (const code of ALL_HOSPITAL_CODES) {
      const depts = getDepartmentsForHospital(code);
      const counters = getCountersForHospital(code);

      expect(depts, `${code} must have 10 departments`).toHaveLength(10);
      expect(counters, `${code} must have 10 counters`).toHaveLength(10);

      for (const dept of depts) {
        const deptCounters = counters.filter(c => c.departmentId === dept.id);
        expect(deptCounters.length, `${code} ${dept.id} missing counter`).toBeGreaterThanOrEqual(1);
        for (const counter of deptCounters) {
          expect(
            counter.roomNo,
            `${code} ${dept.id} counter ${counter.id} roomNo must equal dept.location.room (${dept.location.room})`
          ).toBe(dept.location.room);
        }
      }
    }

    const maxCardioDept = getDepartmentsForHospital('MAX-01').find(d => d.id === 'dept-cardio');
    const maxCardioCounter = getCountersForHospital('MAX-01').find(c => c.departmentId === 'dept-cardio');
    expect(maxCardioDept?.location.room).toBe('Room 104');
    expect(maxCardioCounter?.roomNo).toBe('Room 104');
  });

  it('has zero "Dr. Ananya Sen" or "Chamber 204" direction leakage in non-MAX-01 hospitals', () => {
    const nonMaxCodes = ALL_HOSPITAL_CODES.filter(c => c !== 'MAX-01');
    for (const code of nonMaxCodes) {
      const depts = getDepartmentsForHospital(code);
      for (const dept of depts) {
        expect(
          dept.location.directions || '',
          `${code} ${dept.id} directions leaked Dr. Ananya Sen`
        ).not.toContain('Dr. Ananya Sen');
        expect(
          dept.location.directions || '',
          `${code} ${dept.id} directions leaked Chamber 204`
        ).not.toContain('Chamber 204');
      }
    }
  });

  it('keeps DEMO_SCENARIO_TOKENS strictly consistent with DEMO_SCENARIO_PATIENTS_LIST and hospital rooms', () => {
    const patientMap = new Map(DEMO_SCENARIO_PATIENTS_LIST.map(p => [p.id, p]));
    const maxDepts = new Map(getDepartmentsForHospital('MAX-01').map(d => [d.id, d]));
    const testMap = new Map(INITIAL_TESTS.map(t => [t.id, t]));

    expect(patientMap.has(DEMO_SCENARIO_PATIENT.id)).toBe(true);

    for (const token of DEMO_SCENARIO_TOKENS) {
      const owner = patientMap.get(token.patientId);
      expect(
        owner,
        `Orphan token ${token.id} references missing patient ${token.patientId}`
      ).toBeDefined();

      expect(
        owner!.prescribedTests,
        `Token ${token.id} testId ${token.testId} not in patient ${owner!.id} prescribedTests`
      ).toContain(token.testId);

      const testDef = testMap.get(token.testId);
      expect(testDef).toBeDefined();
      expect(token.departmentId).toBe(testDef!.departmentId);

      const dept = maxDepts.get(token.departmentId);
      expect(dept).toBeDefined();
      expect(
        token.roomNo,
        `Token ${token.id} roomNo must match ${dept!.location.room}`
      ).toBe(dept!.location.room);
    }
  });

  it('exports createCanonicalDemoDataset producing zero orphan tokens, consistent reports, and canonical Rx', () => {
    const dataset = createCanonicalDemoDataset(DEFAULT_HOSPITAL, {
      id: 'doc-max-01',
      name: DEFAULT_HOSPITAL.doctorName,
      room: DEFAULT_HOSPITAL.doctorRoom
    });

    const { patients, queueTokens: tokens, clinicalReports: reports, prescriptions } = dataset;

    expect(patients).toHaveLength(5);

    const patientMap = new Map(patients.map(p => [p.id, p]));
    const depts = new Map(getDepartmentsForHospital(DEFAULT_HOSPITAL.code).map(d => [d.id, d]));
    const testMap = new Map(INITIAL_TESTS.map(t => [t.id, t]));

    for (const token of tokens) {
      const pat = patientMap.get(token.patientId);
      expect(pat, `Orphan canonical token ${token.id} -> ${token.patientId}`).toBeDefined();
      expect(pat!.prescribedTests).toContain(token.testId);

      const testDef = testMap.get(token.testId);
      expect(testDef).toBeDefined();
      expect(token.departmentId).toBe(testDef!.departmentId);

      const dept = depts.get(token.departmentId);
      expect(dept).toBeDefined();
      expect(token.roomNo).toBe(dept!.location.room);
    }

    // Rameshwar (awaiting_prescription) must have 0 prescribedTests and 0 active lab tokens
    const rameshwar = patients.find(p => p.id === 'pat-rameshwar');
    expect(rameshwar).toBeDefined();
    expect(rameshwar!.doctorReviewStatus).toBe('awaiting_prescription');
    expect(rameshwar!.prescribedTests).toEqual([]);
    expect(tokens.filter(t => t.patientId === 'pat-rameshwar')).toHaveLength(0);

    // Sita Devi (in_progress at Biochemistry)
    const sita = patients.find(p => p.id === 'pat-bg-1');
    expect(sita).toBeDefined();
    const sitaToken = tokens.find(t => t.patientId === 'pat-bg-1' && t.testId === 'test-fbs');
    expect(sitaToken?.status).toBe('in_progress');
    expect(sitaToken?.tokenNumber).toBe('B-12');

    // Sunita Kapoor (multi-stop: FBS completed + report, ECG waiting at Room 104)
    const sunita = patients.find(p => p.id === 'pat-sunita');
    expect(sunita).toBeDefined();
    expect(sunita!.completedTests).toEqual(['test-fbs']);
    expect(reports.find(r => r.patientId === 'pat-sunita' && r.testId === 'test-fbs')).toBeDefined();
    const sunitaEcgToken = tokens.find(t => t.patientId === 'pat-sunita' && t.testId === 'test-ecg');
    expect(sunitaEcgToken?.status).toBe('waiting');
    expect(sunitaEcgToken?.roomNo).toBe('Room 104');

    // Vinod Kumar (reports_ready: CBC Hb 11.8 low + ECG Room 104)
    const vinod = patients.find(p => p.id === 'pat-bg-2');
    expect(vinod?.doctorReviewStatus).toBe('reports_ready');
    const vinodCbc = reports.find(r => r.patientId === 'pat-bg-2' && r.testId === 'test-cbc');
    expect(vinodCbc?.metrics.some(m => m.value === '11.8' && m.flag === 'low')).toBe(true);
    const vinodEcg = reports.find(r => r.patientId === 'pat-bg-2' && r.testId === 'test-ecg');
    expect(vinodEcg?.roomNo).toBe('Room 104');

    // Completed / discharged patients must have matching 'completed' tokens & ClinicalReports
    const dischargedPatients = patients.filter(
      p => p.status === 'discharged' || p.doctorReviewStatus === 'completed' || p.doctorReviewStatus === 'reports_ready'
    );
    expect(dischargedPatients.length).toBeGreaterThanOrEqual(2);

    for (const pat of dischargedPatients) {
      for (const testId of pat.prescribedTests) {
        const matchingToken = tokens.find(t => t.patientId === pat.id && t.testId === testId);
        expect(matchingToken?.status, `${pat.id} ${testId} token must be completed`).toBe('completed');

        const matchingReport = reports.find(r => r.patientId === pat.id && r.testId === testId);
        expect(matchingReport, `${pat.id} ${testId} must have ClinicalReport`).toBeDefined();
      }
    }

    // Anita Singh (pat-bg-3) discharged with verified ECG report & structured Prescription
    const anita = patients.find(p => p.id === 'pat-bg-3');
    expect(anita?.status).toBe('discharged');
    expect(reports.some(r => r.patientId === 'pat-bg-3' && r.status === 'verified_by_doctor')).toBe(true);
    const anitaRx = prescriptions.filter(rx => rx.patientId === 'pat-bg-3');
    expect(anitaRx.length).toBeGreaterThanOrEqual(1);
    expect(anitaRx[0].medications.length).toBeGreaterThanOrEqual(1);
    expect(anitaRx[0].status).toBe('active');
  });

  it('dynamically binds hospital doctor name and room in createCanonicalDemoDataset across all hospitals', () => {
    const sjh = REGISTERED_HOSPITALS.find(h => h.code === 'SAFDARJUNG-04')!;
    const sjhDataset = createCanonicalDemoDataset(sjh, {
      id: 'doc-sjh',
      name: sjh.doctorName,
      room: sjh.doctorRoom
    });

    for (const pat of sjhDataset.patients) {
      expect(pat.prescribedDoctorName).toBe(sjh.doctorName);
      expect(pat.prescribedDoctorRoom).toBe(sjh.doctorRoom);
    }

    const sjhDepts = new Map(getDepartmentsForHospital('SAFDARJUNG-04').map(d => [d.id, d]));
    for (const tok of sjhDataset.queueTokens) {
      expect(tok.roomNo).toBe(sjhDepts.get(tok.departmentId)?.location.room);
    }
  });

  it('ensures historicalPatientsData has zero UHID or phone collisions with live demo patients', () => {
    const demoDataset = createCanonicalDemoDataset(DEFAULT_HOSPITAL);
    const liveUhids = new Set(demoDataset.patients.map(p => p.uhid));
    const livePhones = new Set(demoDataset.patients.map(p => p.contact.replace(/\D/g, '')));

    for (const record of HISTORICAL_PATIENT_RECORDS) {
      expect(liveUhids.has(record.uhid), `Historical UHID collision: ${record.uhid}`).toBe(false);
      expect(
        livePhones.has(record.contact.replace(/\D/g, '')),
        `Historical phone collision: ${record.contact}`
      ).toBe(false);
      expect(record.prescribedDoctorName).not.toContain('Ananya Sen');
    }
  });
});
