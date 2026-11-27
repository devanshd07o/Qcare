import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerPatientAction,
  prescribeTestsAction,
  callPatientAction,
  putTokenOnHoldAction,
  recallTokenFromHoldAction,
  completeTestAndUploadReportAction,
  markTestAlreadyDoneAction,
  skipTokenAction,
  verifyAndDischargePatientAction,
  verifyLabReportAction,
  resetToCleanSlateAction,
  loadDemoScenarioAction,
  loadDoctorDemoPatientsAction,
  loginAsPatientWithSessionAction,
  searchPreRegisteredPatientsAction,
  selectAndLoginPatientAction,
  loginDoctorAction,
  setDoctorViewAction,
  loginLabTechAction,
  loginPatientLookupAction,
  setHospitalByCodeAction,
  setHospitalByIdAction,
  setRoleAction,
  navigateBackAction,
  signOutAction,
  openSearchModalAction,
  closeSearchModalAction,
  updatePatientVisitAndTestsAction,
  reconcilePatientVisitAction,
  issuePrescriptionAction,
  dispenseMedicationsAction,
  loginPharmacistAction,
  applyExternalSyncAction,
  getHospitalState
} from './useHospitalStore';
import { findHospitalByQuery, REGISTERED_HOSPITALS } from '../data/mockHospitalData';
import { Patient } from '../types';

describe('Hospital State Machine & End-to-End Workflow', () => {
  beforeEach(() => {
    resetToCleanSlateAction();
  });

  it('initializes in clean slate default state with zero walk-in patients', () => {
    resetToCleanSlateAction();
    const pat = registerPatientAction({
      name: 'Pooja Verma',
      age: 28,
      gender: 'Female',
      contact: '9876543210',
      chiefComplaint: 'Mild headache'
    });

    expect(pat.uhid).toBeDefined();
    expect(pat.qrSessionId).toBeDefined();
    expect(pat.doctorReviewStatus).toBe('awaiting_prescription');
  });

  it('executes full closed-loop clinical journey: Register -> Prescribe -> Call -> Test Complete -> Mark Already Done -> Reports Ready -> Discharge', () => {
    resetToCleanSlateAction();

    // 1. Walk-in Registration
    const patient = registerPatientAction({
      name: 'Rameshwar Sharma',
      age: 52,
      gender: 'Male',
      contact: '9876543210',
      chiefComplaint: 'Severe chest tightness',
      priority: 'emergency'
    });

    expect(patient.priority).toBe('emergency');
    expect(patient.doctorReviewStatus).toBe('awaiting_prescription');

    // 2. Doctor Prescribes 2 Tests: Fasting Blood Sugar and ECG
    prescribeTestsAction(patient.id, ['test-fbs', 'test-ecg'], 'urgent');

    // Verify token minting and stability lock on store
    const sessionResolved = loginAsPatientWithSessionAction(patient.qrSessionId);
    expect(sessionResolved).toBe(true);

    const storeStateAfterPrescribe = getHospitalState();
    const updatedPatient = storeStateAfterPrescribe.patients.find(p => p.id === patient.id)!;
    expect(updatedPatient.prescribedTests).toEqual(['test-fbs', 'test-ecg']);
    expect(updatedPatient.currentLockedDestinationTestId).toBe('test-fbs');

    const fbsTokenId = updatedPatient.activeTokenIds['test-fbs'];
    expect(fbsTokenId).toBeDefined();

    // 3. Lab Technician calls token
    callPatientAction(fbsTokenId);
    const storeStateAfterCall = getHospitalState();
    const calledToken = storeStateAfterCall.queueTokens.find(t => t.id === fbsTokenId)!;
    expect(calledToken.status).toBe('called');
    expect(storeStateAfterCall.callingAlert?.tokenNumber).toBe(calledToken.tokenNumber);

    // 4. Lab Technician puts on hold then recalls
    putTokenOnHoldAction(fbsTokenId);
    expect(getHospitalState().queueTokens.find(t => t.id === fbsTokenId)?.status).toBe('on_hold');
    recallTokenFromHoldAction(fbsTokenId);

    // 5. Technician completes 1st test (FBS) with high glucose parameter (142 mg/dL)
    completeTestAndUploadReportAction(
      fbsTokenId,
      { 'Fasting Blood Glucose': '142' },
      'Sample drawn from median cubital vein.'
    );

    // Verify 1st report uploaded and flagged as HIGH
    const storeAfterFBS = getHospitalState();
    expect(storeAfterFBS.clinicalReports.length).toBe(1);
    expect(storeAfterFBS.clinicalReports[0].testId).toBe('test-fbs');
    expect(storeAfterFBS.clinicalReports[0].metrics[0].flag).toBe('high');

    // Verify dynamic route recalculated to next test (ECG)
    const patientAfterFBS = storeAfterFBS.patients.find(p => p.id === patient.id)!;
    expect(patientAfterFBS.completedTests).toContain('test-fbs');
    expect(patientAfterFBS.currentLockedDestinationTestId).toBe('test-ecg');

    // 6. Patient uses "Mark Already Done" toggle for 2nd test (ECG done earlier)
    markTestAlreadyDoneAction(patient.id, 'test-ecg', 'Patient holds recent ECG report from casualty');

    const storeAfterAllDone = getHospitalState();
    const patientAllDone = storeAfterAllDone.patients.find(p => p.id === patient.id)!;
    expect(patientAllDone.status).toBe('all_completed');
    expect(patientAllDone.doctorReviewStatus).toBe('reports_ready');
    expect(storeAfterAllDone.clinicalReports.length).toBe(2);

    // 7. Doctor verifies reports and discharges patient
    verifyAndDischargePatientAction(patient.id, 'ECG & Glucose reviewed. Prescribed Tab Metoprolol 25mg.');
    const storeFinal = getHospitalState();
    const dischargedPatient = storeFinal.patients.find(p => p.id === patient.id)!;
    expect(dischargedPatient.status).toBe('discharged');
    expect(dischargedPatient.doctorReviewStatus).toBe('completed');
  });

  it('tests skipTokenAction: moves skipped token to back of bay queue and serves next patient', () => {
    resetToCleanSlateAction();

    // Register 2 patients with FBS
    const p1 = registerPatientAction({ name: 'Patient One', age: 30, gender: 'Male', contact: '9800000001' });
    const p2 = registerPatientAction({ name: 'Patient Two', age: 40, gender: 'Female', contact: '9800000002' });

    prescribeTestsAction(p1.id, ['test-fbs']);
    prescribeTestsAction(p2.id, ['test-fbs']);

    const store1 = getHospitalState();
    const p1TokenId = store1.patients.find(p => p.id === p1.id)!.activeTokenIds['test-fbs'];
    const p2TokenId = store1.patients.find(p => p.id === p2.id)!.activeTokenIds['test-fbs'];

    // Skip P1's token
    skipTokenAction(p1TokenId);

    const store2 = getHospitalState();
    const biochemTokens = store2.queueTokens.filter(t => t.testId === 'test-fbs');
    // After skip, p2Token should come before p1Token
    const p1Idx = biochemTokens.findIndex(t => t.id === p1TokenId);
    const p2Idx = biochemTokens.findIndex(t => t.id === p2TokenId);
    expect(p2Idx).toBeLessThan(p1Idx);
  });

  it('loads realistic demo scenario cleanly and resolves QR session', () => {
    loadDemoScenarioAction();
    const resolved = loginAsPatientWithSessionAction('QC-9411');
    expect(resolved).toBe(true);
  });

  it('resolves standalone QR session with encoded base64 payload on fresh client', () => {
    resetToCleanSlateAction();

    const samplePayload = {
      uhid: 'QC-2026-7788',
      name: 'Direct QR Patient',
      age: 42,
      gender: 'Male',
      contact: '9988776655',
      token: 'OPD-99',
      tests: ['test-cbc'],
      status: 'in_transit'
    };
    const b64 = btoa(JSON.stringify(samplePayload));

    const resolved = loginAsPatientWithSessionAction('QC-7788', b64);
    expect(resolved).toBe(true);

    const currentStore = getHospitalState();
    const pat = currentStore.patients.find(p => p.uhid === 'QC-2026-7788');
    expect(pat).toBeDefined();
    expect(pat?.name).toBe('Direct QR Patient');
  });

  it('searches pre-registered patients by UHID, phone, and name and authenticates directly', () => {
    resetToCleanSlateAction();
    const p = registerPatientAction({
      name: 'Virendra Sehwag',
      age: 44,
      gender: 'Male',
      contact: '9811223344',
      chiefComplaint: 'Knee and ankle pain'
    });

    // Search by name
    const byName = searchPreRegisteredPatientsAction('Virendra');
    expect(byName.length).toBe(1);
    expect(byName[0].id).toBe(p.id);

    // Search by partial phone
    const byPhone = searchPreRegisteredPatientsAction('223344');
    expect(byPhone.length).toBe(1);
    expect(byPhone[0].id).toBe(p.id);

    // Search by UHID
    const byUhid = searchPreRegisteredPatientsAction(p.uhid);
    expect(byUhid.length).toBe(1);

    // Non-existent search
    const notFound = searchPreRegisteredPatientsAction('NonExistent9999');
    expect(notFound.length).toBe(0);

    // Select and authenticate
    const loggedIn = selectAndLoginPatientAction(p.id);
    expect(loggedIn).toBe(true);

    const store = getHospitalState();
    expect(store.currentUser?.role).toBe('patient');
    expect(store.currentUser?.name).toBe('Virendra Sehwag');
    expect(store.selectedPatientId).toBe(p.id);
  });

  it('Stress Test: handles 150 concurrent patients registered and routed rapidly without slowdown', () => {
    resetToCleanSlateAction();
    const t0 = performance.now();

    for (let i = 1; i <= 150; i++) {
      const p = registerPatientAction({
        name: `Stress Patient ${i}`,
        age: 20 + (i % 60),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        contact: `98000000${i.toString().padStart(2, '0')}`,
        chiefComplaint: `Symptom report ${i}`,
        priority: i % 10 === 0 ? 'emergency' : 'standard'
      });

      if (i % 2 === 0) {
        prescribeTestsAction(p.id, ['test-cbc', 'test-fbs']);
      }
    }

    const elapsedMs = performance.now() - t0;
    expect(elapsedMs).toBeLessThan(1500); // 150 patients processed under 1.5s
  });

  describe('Clinical Authentication & Security Rules', () => {
    it('rejects invalid PIN without leaking demo credentials in error message', () => {
      resetToCleanSlateAction();
      const res = loginDoctorAction('Dr. Smith', 'Test Clinic', 'Chamber 101', '9810011001', undefined, '9999');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Invalid PIN. Please try again.');
      expect(res.error).not.toContain('1234');
      expect(res.error).not.toContain('demo');
    });

    it('successfully signs in clinician with valid credentials', () => {
      resetToCleanSlateAction();
      const res = loginDoctorAction('Duty Doctor', 'City Care Diagnostics', 'Chamber 101', '9810011001', undefined, '1234');
      expect(res.success).toBe(true);
      const state = getHospitalState();
      expect(state.currentUser?.role).toBe('doctor');
      expect(state.currentUser?.identifier).toBe('Chamber 101');
    });

    it('rejects invalid lab technician PIN without leaking demo credentials', () => {
      resetToCleanSlateAction();
      const res = loginLabTechAction('ST-8821', 'dept-pathology', '0000');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Invalid PIN. Please try again.');
      expect(res.error).not.toContain('1234');
      expect(res.error).not.toContain('demo');
    });

    it('successfully signs in lab tech and records technician identity for audit trail', () => {
      resetToCleanSlateAction();
      const res = loginLabTechAction('ST-8821', 'dept-pathology', '1234');
      expect(res.success).toBe(true);
      const state = getHospitalState();
      expect(state.currentUser?.role).toBe('lab_tech');
      expect(state.currentUser?.name).toBe('ST-8821');
      expect(state.activeBayDepartmentId).toBe('dept-pathology');
    });

    it('authenticates patient via token or mobile lookup', () => {
      resetToCleanSlateAction();
      const patient = registerPatientAction({
        name: 'Anita Roy',
        age: 34,
        gender: 'Female',
        contact: '9811122233',
        chiefComplaint: 'Routine checkup'
      });

      const res = loginPatientLookupAction(patient.opdTokenNumber || 'OPD-1');
      expect(res.success).toBe(true);
      const state = getHospitalState();
      expect(state.currentUser?.role).toBe('patient');
      expect(state.currentUser?.name).toBe('Anita Roy');
    });

    it('logs the authenticated lab technician identity with each uploaded report', () => {
      resetToCleanSlateAction();
      const patient = registerPatientAction({
        name: 'Suresh Kumar',
        age: 45,
        gender: 'Male',
        contact: '9822334455'
      });
      prescribeTestsAction(patient.id, ['test-fbs']);
      const fbsTokenId = getHospitalState().patients[0].activeTokenIds['test-fbs'];

      // Lab technician signs in with Staff ID 'ST-9004'
      loginLabTechAction('ST-9004', 'dept-pathology', '1234');

      // Complete test and upload report
      completeTestAndUploadReportAction(fbsTokenId, { 'Fasting Blood Glucose': '105' }, 'Normal sample');

      const latestState = getHospitalState();
      expect(latestState.clinicalReports.length).toBeGreaterThan(0);
      const report = latestState.clinicalReports[0];
      expect(report.technicianName).toBe('ST-9004');
      const pat = latestState.patients.find(p => p.id === patient.id);
      const testItem = pat?.prescribedTestItems?.find(i => i.testId === 'test-fbs');
      expect(testItem?.completedByStaff).toBe('ST-9004');
    });

    it('resolves and switches hospital tenant cleanly by hospital code', () => {
      resetToCleanSlateAction();
      setHospitalByCodeAction('APOLLO-02');
      let state = getHospitalState();
      expect(state.currentHospital.code).toBe('APOLLO-02');
      expect(state.currentHospital.name).toContain('Apollo Hospitals');

      setHospitalByCodeAction('MAX-01');
      state = getHospitalState();
      expect(state.currentHospital.code).toBe('MAX-01');
      expect(state.currentHospital.name).toContain('Max Super Speciality Hospital');

      // Custom code defaults cleanly to fallback
      setHospitalByCodeAction('QC-NEW-99');
      state = getHospitalState();
      expect(state.currentHospital.code).toBe('QC-NEW-99');
      expect(state.currentHospital.name).toBeDefined();
    });

    it('contains all 6 Delhi NCR hospitals from the verified demo dataset', () => {
      expect(REGISTERED_HOSPITALS.length).toBe(6);
      const codes = REGISTERED_HOSPITALS.map(h => h.code);
      expect(codes).toEqual([
        'MAX-01',
        'APOLLO-02',
        'AIIMS-03',
        'SAFDARJUNG-04',
        'RML-05',
        'LNJP-06'
      ]);
      const ids = REGISTERED_HOSPITALS.map(h => h.id);
      expect(ids).toEqual(['H001', 'H002', 'H003', 'H004', 'H005', 'H006']);
    });

    it('auto-detects hospital by code variants (e.g. Max 01, MAX-01, H001, SJH, LNJP)', () => {
      // 1. Max Super Speciality Hospital, Saket
      expect(findHospitalByQuery('MAX-01')?.id).toBe('H001');
      expect(findHospitalByQuery('Max 01')?.id).toBe('H001');
      expect(findHospitalByQuery('H001')?.id).toBe('H001');
      expect(findHospitalByQuery('Saket')?.id).toBe('H001');

      // 2. Indraprastha Apollo Hospitals
      expect(findHospitalByQuery('APOLLO-02')?.id).toBe('H002');
      expect(findHospitalByQuery('Apollo 02')?.id).toBe('H002');
      expect(findHospitalByQuery('H002')?.id).toBe('H002');
      expect(findHospitalByQuery('Apollo Delhi')?.id).toBe('H002');

      // 3. AIIMS Delhi
      expect(findHospitalByQuery('AIIMS-03')?.id).toBe('H003');
      expect(findHospitalByQuery('AIIMS 03')?.id).toBe('H003');
      expect(findHospitalByQuery('H003')?.id).toBe('H003');
      expect(findHospitalByQuery('AIIMS')?.id).toBe('H003');

      // 4. Safdarjung Hospital
      expect(findHospitalByQuery('SAFDARJUNG-04')?.id).toBe('H004');
      expect(findHospitalByQuery('Safdarjung 04')?.id).toBe('H004');
      expect(findHospitalByQuery('H004')?.id).toBe('H004');
      expect(findHospitalByQuery('SJH')?.id).toBe('H004');

      // 5. RML Hospital
      expect(findHospitalByQuery('RML-05')?.id).toBe('H005');
      expect(findHospitalByQuery('Rml 05')?.id).toBe('H005');
      expect(findHospitalByQuery('H005')?.id).toBe('H005');
      expect(findHospitalByQuery('RML')?.id).toBe('H005');

      // 6. LNJP Hospital
      expect(findHospitalByQuery('LNJP-06')?.id).toBe('H006');
      expect(findHospitalByQuery('Lnjp 06')?.id).toBe('H006');
      expect(findHospitalByQuery('H006')?.id).toBe('H006');
      expect(findHospitalByQuery('Lok Nayak')?.id).toBe('H006');
    });

    it('scopes doctor and lab technician login to the chosen hospital tenant', () => {
      // Doctor logs into Safdarjung Hospital (H004)
      const docRes = loginDoctorAction('Dr. Sunita Batra', undefined, 'Room 108', '9811122233', undefined, '1234', 'H004');
      expect(docRes.success).toBe(true);
      let state = getHospitalState();
      expect(state.currentHospital.id).toBe('H004');
      expect(state.currentHospital.name).toContain('Safdarjung Hospital');
      expect(state.currentUser?.subtitle).toContain('SAFDARJUNG-04');

      // Lab technician logs into LNJP Hospital (H006)
      const labRes = loginLabTechAction('Technician Ramesh', 'dept-pathology', '1234', 'H006');
      expect(labRes.success).toBe(true);
      state = getHospitalState();
      expect(state.currentHospital.id).toBe('H006');
      expect(state.currentHospital.shortName).toBe('LNJP Hospital');
      expect(state.currentUser?.subtitle).toContain('LNJP Hospital');
    });
  });

  describe('In-App Navigation & Browser Back Button History Protection', () => {
    beforeEach(() => {
      resetToCleanSlateAction();
    });

    it('records navigation history when transitioning from Doctor workstation to Patient view and goes back seamlessly', () => {
      // 1. Doctor registers a patient
      const pat = registerPatientAction({
        name: 'Virender Sehwag',
        age: 44,
        gender: 'Male',
        contact: '9810123456',
        chiefComplaint: 'Right shoulder pain'
      });

      let state = getHospitalState();
      expect(state.activeRole).toBe('doctor');
      expect(state.currentUser?.role).toBe('doctor');

      // 2. Doctor opens patient view (e.g. clicks Patient View button)
      selectAndLoginPatientAction(pat.id);

      state = getHospitalState();
      expect(state.activeRole).toBe('patient');
      expect(state.currentUser?.role).toBe('patient');
      expect(state.currentUser?.name).toBe('Virender Sehwag');
      expect(state.navigationHistory.length).toBeGreaterThanOrEqual(1);

      // 3. User clicks Back button (or triggers browser popstate)
      const handled = navigateBackAction(true);
      expect(handled).toBe(true);

      // 4. Verifies state smoothly restored to Doctor Chamber
      state = getHospitalState();
      expect(state.activeRole).toBe('doctor');
      expect(state.currentUser?.role).toBe('doctor');
      expect(state.selectedPatientId).toBe(pat.id);
    });

    it('navigates through multi-step role transitions (Doctor -> Lab -> Patient -> Back -> Back)', () => {
      setRoleAction('doctor');
      setRoleAction('lab_tech');
      let state = getHospitalState();
      expect(state.activeRole).toBe('lab_tech');

      setRoleAction('patient');
      state = getHospitalState();
      expect(state.activeRole).toBe('patient');

      // First back goes to lab_tech
      navigateBackAction(true);
      state = getHospitalState();
      expect(state.activeRole).toBe('lab_tech');

      // Second back goes to doctor
      navigateBackAction(true);
      state = getHospitalState();
      expect(state.activeRole).toBe('doctor');
    });

    it('closes open quick-search modal before popping screen navigation', () => {
      openSearchModalAction();
      let state = getHospitalState();
      expect(state.isSearchModalOpen).toBe(true);

      // Trigger back
      const handled = navigateBackAction(true);
      expect(handled).toBe(true);

      // Modal closed, role preserved
      state = getHospitalState();
      expect(state.isSearchModalOpen).toBe(false);
      expect(state.activeRole).toBe('doctor');
    });

    it('gracefully signs out to AuthScreen when navigating back from root doctor session with 0 history', () => {
      resetToCleanSlateAction();
      let state = getHospitalState();
      expect(state.navigationHistory.length).toBe(0);
      expect(state.currentUser).not.toBeNull();

      // Back action with empty history signs out so user reaches auth gate without tab closing
      const handled = navigateBackAction(true);
      expect(handled).toBe(true);

      state = getHospitalState();
      expect(state.currentUser).toBeNull();
    });
  });

  describe('Doctor Reports Verification & Live Lab Telemetry Sync', () => {
    beforeEach(() => {
      resetToCleanSlateAction();
    });

    it('verifies individual lab reports with doctor notes without prematurely discharging patient', () => {
      const p = registerPatientAction({
        name: 'Kavita Mehta',
        age: 39,
        gender: 'Female',
        contact: '9811445566',
        chiefComplaint: 'Chest discomfort and fatigue'
      });
      expect(p.registeredAtMs).toBeGreaterThan(0);

      prescribeTestsAction(p.id, ['test-cbc', 'test-xray-chest'], 'normal');
      const s1 = getHospitalState();
      const cbcTok = s1.patients[0].activeTokenIds['test-cbc'];

      completeTestAndUploadReportAction(cbcTok, { 'Hemoglobin (Hb)': '11.2' }, 'Mild pallor');
      const s2 = getHospitalState();
      expect(s2.clinicalReports).toHaveLength(1);
      const rep = s2.clinicalReports[0];
      expect(rep.status).toBe('uploaded');
      expect(rep.createdAtMs).toBeGreaterThan(0);
      expect(rep.actualTurnaroundMinutes).toBeGreaterThan(0);

      verifyLabReportAction(rep.id, 'Start oral iron supplementation after reviewing X-Ray');
      const s3 = getHospitalState();
      const verifiedRep = s3.clinicalReports.find(r => r.id === rep.id)!;
      expect(verifiedRep.status).toBe('verified_by_doctor');
      expect(verifiedRep.doctorNotes).toContain('oral iron');
      expect(verifiedRep.doctorSignature).toBeTruthy();

      // Patient still has Chest X-Ray pending so not discharged yet
      const patAfter = s3.patients.find(x => x.id === p.id)!;
      expect(patAfter.status).not.toBe('discharged');
    });

    it('loads doctor demo queue with staggered timestamps, canonical Room 104, Rx, and reports ordered newest-first', () => {
      loginDoctorAction('Dr. Ananya Sen', undefined, 'Chamber 204', '', '', '1234', 'MAX-01');
      loadDoctorDemoPatientsAction();
      const s = getHospitalState();
      expect(s.patients).toHaveLength(5);
      expect(s.clinicalReports).toHaveLength(4);
      expect(s.queueTokens).toHaveLength(6);
      expect(s.prescriptions).toHaveLength(1);
      expect(s.prescriptions[0].patientId).toBe('pat-bg-3');
      expect((s.clinicalReports[0].createdAtMs ?? 0)).toBeGreaterThanOrEqual(
        s.clinicalReports[1].createdAtMs ?? 0
      );
      const patientIds = new Set(s.patients.map(p => p.id));
      expect(s.queueTokens.every(t => patientIds.has(t.patientId))).toBe(true);
      const ecgTokens = s.queueTokens.filter(t => t.departmentId === 'dept-cardio');
      expect(ecgTokens.every(t => t.roomNo === 'Room 104')).toBe(true);
      const ecgReports = s.clinicalReports.filter(r => r.testId === 'test-ecg');
      expect(ecgReports.every(r => r.roomNo === 'Room 104')).toBe(true);
    });

    it('defaults doctorView to dashboard on login and supports switching views', () => {
      loginDoctorAction('Dr. Ananya Sen', 'Max Super Speciality Hospital, Saket', 'Chamber 204', '', '', '1234', 'H001');
      expect(getHospitalState().doctorView).toBe('dashboard');
      setDoctorViewAction('walkin');
      expect(getHospitalState().doctorView).toBe('walkin');
      loginDoctorAction('Dr. Ananya Sen', 'Max Super Speciality Hospital, Saket', 'Chamber 204', '', '', '1234', 'H001');
      expect(getHospitalState().doctorView).toBe('dashboard');
    });
  });

  describe('Reported Bugs Regression & Pharmacy/Reconciliation TDD', () => {
    beforeEach(() => {
      resetToCleanSlateAction();
    });

    it('rejects unmatched loginPatientLookupAction without silently logging into Rameshwar or another patient', () => {
      signOutAction();
      const emptyRes = loginPatientLookupAction('WRONG-9999');
      expect(emptyRes.success).toBe(false);
      expect(emptyRes.error).toBeTruthy();
      expect(getHospitalState().currentUser).toBeNull();
      expect(getHospitalState().patients).toHaveLength(0);

      // Even when another patient exists in live state, wrong lookup must NOT log into them or Rameshwar
      loginDoctorAction('Dr. Ananya Sen', undefined, 'Chamber 204', '', '', '1234', 'MAX-01');
      registerPatientAction({
        name: 'Pooja Verma',
        age: 31,
        gender: 'Female',
        contact: '9876543210',
        chiefComplaint: 'Fever'
      });
      signOutAction();

      const wrongRes = loginPatientLookupAction('WRONG-9999');
      expect(wrongRes.success).toBe(false);
      expect(wrongRes.error).toBeTruthy();
      expect(getHospitalState().currentUser).toBeNull();
      expect(getHospitalState().selectedPatientId).toBeNull();
      expect(getHospitalState().patients.some(p => p.id === 'pat-rameshwar')).toBe(false);
    });

    it('rejects unknown QR sessions in loginAsPatientWithSessionAction without hijacking state.patients to Rameshwar', () => {
      const pooja = registerPatientAction({
        name: 'Pooja Verma',
        age: 31,
        gender: 'Female',
        contact: '9876543210'
      });
      signOutAction();

      expect(loginAsPatientWithSessionAction('QC-8888')).toBe(false);
      expect(loginAsPatientWithSessionAction('QC-7886')).toBe(false);
      expect(loginAsPatientWithSessionAction('DEMO-UNKNOWN')).toBe(false);

      const sAfterInvalid = getHospitalState();
      expect(sAfterInvalid.currentUser).toBeNull();
      expect(sAfterInvalid.patients).toHaveLength(1);
      expect(sAfterInvalid.patients[0].id).toBe(pooja.id);
      expect(sAfterInvalid.patients.some(p => p.id === 'pat-rameshwar')).toBe(false);

      // Live registered patient QR and exact canonical demo QC-9411 / QC-2026-9411 still resolve
      expect(loginAsPatientWithSessionAction(pooja.qrSessionId)).toBe(true);
      expect(getHospitalState().selectedPatientId).toBe(pooja.id);

      resetToCleanSlateAction();
      signOutAction();
      expect(loginAsPatientWithSessionAction('QC-9411')).toBe(true);
      expect(getHospitalState().currentUser?.identifier).toBe('QC-2026-9411');

      resetToCleanSlateAction();
      signOutAction();
      expect(loginAsPatientWithSessionAction('QC-2026-9411')).toBe(true);
      expect(getHospitalState().currentUser?.identifier).toBe('QC-2026-9411');
    });

    it('generates collision-free id, uhid, qrSessionId, and opdTokenNumber across rapid registrations', () => {
      loadDoctorDemoPatientsAction();
      for (let i = 1; i <= 150; i++) {
        registerPatientAction({
          name: `Unique Patient ${i}`,
          age: 20 + (i % 50),
          gender: i % 2 === 0 ? 'Male' : 'Female',
          contact: `981234${String(i).padStart(4, '0')}`,
          chiefComplaint: `Complaint ${i}`
        });
      }

      const allPatients = getHospitalState().patients;
      expect(new Set(allPatients.map(p => p.id)).size).toBe(allPatients.length);
      expect(new Set(allPatients.map(p => p.uhid)).size).toBe(allPatients.length);
      expect(new Set(allPatients.map(p => p.qrSessionId)).size).toBe(allPatients.length);
      expect(new Set(allPatients.map(p => p.opdTokenNumber)).size).toBe(allPatients.length);
    });

    it('reconciles patient tests in-place without duplicating patients, preserving completed reports and cancelling removed waiting tokens', () => {
      const pat = registerPatientAction({
        name: 'Meera Nair',
        age: 35,
        gender: 'Female',
        contact: '9876500001',
        chiefComplaint: 'Fatigue'
      });

      prescribeTestsAction(pat.id, ['test-cbc', 'test-fbs'], 'normal');
      const s1 = getHospitalState();
      const cbcTokenId = s1.patients[0].activeTokenIds['test-cbc'];
      const fbsTokenId = s1.patients[0].activeTokenIds['test-fbs'];

      // Complete CBC so there is a completed test + uploaded ClinicalReport
      completeTestAndUploadReportAction(cbcTokenId, { 'Hemoglobin (Hb)': '11.4' }, 'Collected');
      expect(getHospitalState().clinicalReports).toHaveLength(1);

      // Edit visit in-place: keep CBC (completed), remove FBS (waiting), add ECG (new)
      const reconciled = updatePatientVisitAndTestsAction(pat.id, {
        name: 'Meera Nair',
        age: 36,
        gender: 'Female',
        contact: '9876500001',
        chiefComplaint: 'Fatigue and mild palpitations',
        testIds: ['test-cbc', 'test-ecg'],
        doctorPriority: 'priority',
        notes: 'Replaced FBS with ECG'
      });

      expect(reconciled).not.toBeNull();
      const s2 = getHospitalState();
      expect(s2.patients).toHaveLength(1);
      const updated = s2.patients[0];
      expect(updated.id).toBe(pat.id);
      expect(updated.uhid).toBe(pat.uhid);
      expect(updated.opdTokenNumber).toBe(pat.opdTokenNumber);
      expect(updated.age).toBe(36);
      expect(updated.completedTests).toContain('test-cbc');
      expect(updated.prescribedTests).toEqual(['test-cbc', 'test-ecg']);
      expect(s2.clinicalReports).toHaveLength(1);

      // Cancelled waiting token for removed FBS, preserved completed CBC token, minted 1 new token for ECG
      expect(s2.queueTokens.find(t => t.id === fbsTokenId)?.status).toBe('cancelled');
      expect(s2.queueTokens.find(t => t.id === cbcTokenId)?.status).toBe('completed');
      const ecgTokens = s2.queueTokens.filter(t => t.patientId === pat.id && t.testId === 'test-ecg' && t.status !== 'cancelled');
      expect(ecgTokens).toHaveLength(1);
      expect(updated.activeTokenIds['test-ecg']).toBe(ecgTokens[0].id);
      expect(updated.activeTokenIds['test-fbs']).toBeUndefined();

      // Alias reconcilePatientVisitAction also updates in-place cleanly without re-minting ECG
      reconcilePatientVisitAction(pat.id, {
        testIds: ['test-cbc', 'test-ecg']
      });
      const s3 = getHospitalState();
      expect(s3.patients).toHaveLength(1);
      expect(s3.queueTokens.filter(t => t.patientId === pat.id && t.testId === 'test-ecg' && t.status !== 'cancelled')).toHaveLength(1);
    });

    it('handles pharmacist auth, prescription issuance, partial/full dispensing, and immediate persistence flush', () => {
      const storageMap = new Map<string, string>();
      vi.stubGlobal('window', {});
      vi.stubGlobal('localStorage', {
        getItem: (k: string) => storageMap.get(k) ?? null,
        setItem: (k: string, v: string) => { storageMap.set(k, v); },
        removeItem: (k: string) => { storageMap.delete(k); }
      });

      try {
        const badLogin = loginPharmacistAction('Pharm Priya', 'Max Pharmacy', '9999', 'MAX-01');
        expect(badLogin.success).toBe(false);
        expect(badLogin.error).toBe('Invalid PIN. Please try again.');

        const pat = registerPatientAction({
          name: 'Alok Nath',
          age: 50,
          gender: 'Male',
          contact: '9811002200',
          chiefComplaint: 'Fever and body ache'
        });

        const rx = issuePrescriptionAction(
          pat.id,
          [
            {
              drugName: 'Calpol / Dolo',
              genericName: 'Paracetamol',
              dose: '650mg',
              frequency: 'Three times daily (TDS)',
              duration: '3 days',
              route: 'Oral',
              quantity: '9 tablets'
            },
            {
              drugName: 'Omez / Pan',
              genericName: 'Omeprazole',
              dose: '20mg',
              frequency: 'Once daily (OD)',
              duration: '5 days',
              route: 'Oral',
              quantity: '5 capsules'
            }
          ],
          'Take after meals',
          'Acute viral fever'
        );

        expect(rx).not.toBeNull();
        expect(rx!.status).toBe('active');
        expect(getHospitalState().prescriptions).toHaveLength(1);

        // Immediate flush to localStorage (no 300ms wait required)
        const persistedRaw = storageMap.get('qcare_v2_app_store_state');
        expect(persistedRaw).toBeTruthy();
        const persisted = JSON.parse(persistedRaw!);
        expect(persisted.prescriptions).toHaveLength(1);
        expect(persisted.patients.some((p: Patient) => p.id === pat.id)).toBe(true);

        const goodLogin = loginPharmacistAction('Pharm Priya', 'Max Pharmacy', '1234', 'MAX-01');
        expect(goodLogin.success).toBe(true);
        expect(getHospitalState().activeRole).toBe('pharmacist');
        expect(getHospitalState().currentUser?.role).toBe('pharmacist');

        // Partial dispense (1 of 2 meds)
        const rec1 = dispenseMedicationsAction(rx!.id, [rx!.medications[0].id], 'Pharm Priya', 'Max Pharmacy', 'Issued paracetamol');
        expect(rec1).not.toBeNull();
        let s = getHospitalState();
        expect(s.prescriptions[0].status).toBe('partially_dispensed');
        expect(s.prescriptions[0].medications[0].dispensed).toBe(true);
        expect(s.prescriptions[0].medications[1].dispensed).toBe(false);
        expect(s.dispenseRecords).toHaveLength(1);

        // Remaining dispense (2 of 2 meds)
        const rec2 = dispenseMedicationsAction(rx!.id, [rx!.medications[1].id], 'Pharm Priya', 'Max Pharmacy');
        expect(rec2).not.toBeNull();
        s = getHospitalState();
        expect(s.prescriptions[0].status).toBe('fully_dispensed');
        expect(s.prescriptions[0].medications.every(m => m.dispensed)).toBe(true);
        expect(s.dispenseRecords).toHaveLength(2);

        // Duplicate-dispense guard: attempting to dispense already-dispensed meds returns null
        const dupDispense = dispenseMedicationsAction(rx!.id, [rx!.medications[0].id], 'Pharm Priya', 'Max Pharmacy');
        expect(dupDispense).toBeNull();
        expect(getHospitalState().dispenseRecords).toHaveLength(2);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('enforces duplicate-submission guards on consultation sign-off & Rx publish, cancels in-progress tokens, preserves dynamic patients on demo activation, and blocks stale cross-tab sync', () => {
      // 1. Register dynamic patient & start an in_progress test
      const dynPat = registerPatientAction({
        name: 'Deepak Malhotra',
        age: 40,
        gender: 'Male',
        contact: '9876001122',
        chiefComplaint: 'Chest discomfort'
      });
      prescribeTestsAction(dynPat.id, ['test-cbc', 'test-fbs']);
      const fbsTokId = getHospitalState().patients.find(p => p.id === dynPat.id)!.activeTokenIds['test-fbs'];
      callPatientAction(fbsTokId);
      expect(getHospitalState().callingAlert).not.toBeNull();

      // Remove FBS while called/in-progress -> explicitly cancelled and callingAlert cleared
      updatePatientVisitAndTestsAction(dynPat.id, {
        testIds: ['test-cbc']
      });
      const afterCancel = getHospitalState();
      expect(afterCancel.queueTokens.find(t => t.id === fbsTokId)?.status).toBe('cancelled');
      expect(afterCancel.callingAlert).toBeNull();

      // 2. Duplicate Rx publish guard (rapid identical double-submit returns existing Rx without duplicating)
      const medInput = [{
        drugName: 'Calpol / Dolo',
        genericName: 'Paracetamol',
        dose: '650mg',
        frequency: 'Three times daily (TDS)',
        duration: '3 days',
        route: 'Oral'
      }];
      const rx1 = issuePrescriptionAction(dynPat.id, medInput, 'After food', 'Pyrexia');
      const rx2 = issuePrescriptionAction(dynPat.id, medInput, 'After food', 'Pyrexia');
      expect(rx1?.id).toBe(rx2?.id);
      expect(getHospitalState().prescriptions.filter(r => r.patientId === dynPat.id)).toHaveLength(1);

      // 3. Duplicate consultation sign-off guard
      verifyAndDischargePatientAction(dynPat.id, 'First discharge');
      verifyAndDischargePatientAction(dynPat.id, 'Accidental double click');
      expect(getHospitalState().patients.find(p => p.id === dynPat.id)?.notes).toBe('First discharge');

      // 4. Demo activation (QC-9411) MUST NOT overwrite dynamic patients
      expect(loginAsPatientWithSessionAction('QC-9411')).toBe(true);
      const afterDemo = getHospitalState();
      expect(afterDemo.patients.some(p => p.id === dynPat.id)).toBe(true);
      expect(afterDemo.patients.some(p => p.id === 'pat-rameshwar')).toBe(true);

      // 5. Strict QR payload validation rejects mismatched hospitalCode
      const wrongHospB64 = btoa(JSON.stringify({
        uhid: 'QC-2026-8899',
        name: 'Wrong Hosp Patient',
        hospitalCode: 'AIIMS-03'
      }));
      expect(loginAsPatientWithSessionAction('QC-8899', wrongHospB64)).toBe(false);

      // 6. Monotonic cross-tab sync guard ignores stale lower-version payload
      const currentVer = getHospitalState().stateVersion;
      applyExternalSyncAction({
        patients: [],
        queueTokens: [],
        clinicalReports: [],
        prescriptions: [],
        dispenseRecords: [],
        stateVersion: Math.max(0, currentVer - 2),
        updatedAtMs: Date.now() - 60_000
      });
      expect(getHospitalState().patients.some(p => p.id === dynPat.id)).toBe(true);
    });
  });
});
