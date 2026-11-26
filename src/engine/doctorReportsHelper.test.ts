import { describe, it, expect } from 'vitest';
import {
  buildHierarchicalReportPatients,
  filterReportPatients
} from './doctorReportsHelper';
import { INITIAL_TESTS, INITIAL_DEPARTMENTS } from '../data/mockHospitalData';
import { HISTORICAL_PATIENT_RECORDS } from '../data/historicalPatientsData';
import { ClinicalReport, Patient } from '../types';

function makePatient(overrides: Partial<Patient>): Patient {
  return {
    id: 'pat-1',
    uhid: 'QC-2026-1001',
    qrSessionId: 'QC-1001',
    name: 'Test Patient',
    age: 40,
    gender: 'Male',
    contact: '9810000001',
    priority: 'standard',
    prescribedDoctorId: 'doc-1',
    prescribedDoctorName: 'Dr. Ananya Sen',
    prescribedDoctorRoom: 'Chamber 204',
    chiefComplaint: 'Fever',
    prescribedTests: ['test-cbc'],
    completedTests: [],
    activeTokenIds: {},
    status: 'in_transit',
    assignedSmartRoute: ['test-cbc'],
    registrationTime: '09:00 AM',
    opdTokenNumber: 'OPD-14',
    doctorReviewStatus: 'awaiting_lab_reports',
    ...overrides
  };
}

describe('Doctor Hierarchical Patient Reports Helper', () => {
  it('places newly generated lab reports at the very top, recent today patients above, and old archived patients at the bottom', () => {
    const now = Date.now();

    const pOlderToday = makePatient({
      id: 'pat-older-today',
      uhid: 'QC-2026-9001',
      name: 'Older Today Verified',
      registeredAtMs: now - 3600_000,
      completedTests: ['test-cbc'],
      doctorReviewStatus: 'completed',
      status: 'discharged'
    });

    const pJustSentWaiting = makePatient({
      id: 'pat-just-sent-waiting',
      uhid: 'QC-2026-9002',
      name: 'Just Sent Awaiting Lab',
      registeredAtMs: now - 120_000,
      prescribedTests: ['test-cbc', 'test-ecg'],
      completedTests: [],
      doctorReviewStatus: 'awaiting_lab_reports'
    });

    const pJustReceived = makePatient({
      id: 'pat-just-received',
      uhid: 'QC-2026-9003',
      name: 'Just Sent Report Arrived',
      registeredAtMs: now - 600_000,
      prescribedTests: ['test-cbc', 'test-xray-chest'],
      completedTests: ['test-cbc'],
      doctorReviewStatus: 'awaiting_lab_reports'
    });

    const reports: ClinicalReport[] = [
      {
        id: 'rep-new',
        testId: 'test-cbc',
        testName: 'Blood Collection',
        patientId: 'pat-just-received',
        patientUhid: 'QC-2026-9003',
        patientName: 'Just Sent Report Arrived',
        technicianName: 'Sunil',
        counterId: 'c1',
        roomNo: 'Room 12',
        timestamp: '10:45 AM',
        createdAtMs: now - 10_000,
        status: 'uploaded',
        summary: 'CBC done',
        metrics: [{ label: 'Hb', value: '10.2', unit: 'g/dL', normalRange: '13-17', flag: 'low' }]
      },
      {
        id: 'rep-old-today',
        testId: 'test-cbc',
        testName: 'Blood Collection',
        patientId: 'pat-older-today',
        patientUhid: 'QC-2026-9001',
        patientName: 'Older Today Verified',
        technicianName: 'Sunil',
        counterId: 'c1',
        roomNo: 'Room 12',
        timestamp: '09:30 AM',
        createdAtMs: now - 3000_000,
        status: 'verified_by_doctor',
        summary: 'CBC normal',
        metrics: [{ label: 'Hb', value: '14.0', unit: 'g/dL', normalRange: '13-17', flag: 'normal' }]
      }
    ];

    const entries = buildHierarchicalReportPatients({
      patients: [pJustSentWaiting, pJustReceived, pOlderToday],
      clinicalReports: reports,
      historicalRecords: HISTORICAL_PATIENT_RECORDS,
      tests: INITIAL_TESTS,
      departments: INITIAL_DEPARTMENTS
    });

    // 3 live patients + 56 historical patients = 59 total
    expect(entries.length).toBe(3 + HISTORICAL_PATIENT_RECORDS.length);

    // #1 MUST be the patient with newly arrived unverified lab report
    expect(entries[0].patientId).toBe('pat-just-received');
    expect(entries[0].tier).toBe('new_incoming');
    expect(entries[0].unreadCount).toBe(1);
    expect(entries[0].pendingTests).toHaveLength(1);
    expect(entries[0].pendingTests[0].testId).toBe('test-xray-chest');

    // #2 & #3 MUST be the other recent today patients (newest registration first)
    expect(entries[1].patientId).toBe('pat-just-sent-waiting');
    expect(entries[1].tier).toBe('recent_today');
    expect(entries[2].patientId).toBe('pat-older-today');
    expect(entries[2].tier).toBe('recent_today');

    // Bottom entries MUST be past archived patients sorted newest visitDate -> oldest visitDate
    const archivedEntries = entries.slice(3);
    expect(archivedEntries.every(e => e.tier === 'past_archived')).toBe(true);
    expect(archivedEntries[0].sortTimestampMs).toBeGreaterThanOrEqual(
      archivedEntries[archivedEntries.length - 1].sortTimestampMs
    );
    // Oldest record 2026-08-12 must be at the very bottom
    expect(archivedEntries[archivedEntries.length - 1].activityTimeLabel).toBe('2026-08-12');
  });

  it('orders multiple reports inside a single patient newest-first and builds structured reports for historical patients', () => {
    const now = Date.now();
    const p = makePatient({
      id: 'pat-multi',
      prescribedTests: ['test-cbc', 'test-ecg'],
      completedTests: ['test-cbc', 'test-ecg']
    });

    const olderRep: ClinicalReport = {
      id: 'rep-1',
      testId: 'test-cbc',
      testName: 'Blood Collection',
      patientId: 'pat-multi',
      patientUhid: p.uhid,
      patientName: p.name,
      technicianName: 'Tech A',
      counterId: 'c1',
      roomNo: 'Room 12',
      timestamp: '09:10 AM',
      createdAtMs: now - 500_000,
      status: 'verified_by_doctor',
      summary: 'Old',
      metrics: []
    };
    const newerRep: ClinicalReport = {
      id: 'rep-2',
      testId: 'test-ecg',
      testName: 'Heart Rhythm',
      patientId: 'pat-multi',
      patientUhid: p.uhid,
      patientName: p.name,
      technicianName: 'Tech B',
      counterId: 'c2',
      roomNo: 'Room 104',
      timestamp: '09:40 AM',
      createdAtMs: now - 5_000,
      status: 'uploaded',
      summary: 'New',
      metrics: []
    };

    const entries = buildHierarchicalReportPatients({
      patients: [p],
      clinicalReports: [olderRep, newerRep],
      historicalRecords: HISTORICAL_PATIENT_RECORDS.slice(0, 2),
      tests: INITIAL_TESTS,
      departments: INITIAL_DEPARTMENTS
    });

    const liveEntry = entries.find(e => e.patientId === 'pat-multi')!;
    expect(liveEntry.reports[0].id).toBe('rep-2');
    expect(liveEntry.reports[1].id).toBe('rep-1');

    // Historical patient must also have populated ClinicalReport sheets with metrics
    const pastEntry = entries.find(e => e.tier === 'past_archived')!;
    expect(pastEntry.reports.length).toBeGreaterThan(0);
    expect(pastEntry.reports[0].status).toBe('verified_by_doctor');
    expect(pastEntry.reports[0].metrics.length).toBeGreaterThan(0);
  });

  it('filters patients cleanly by tier filter and search query (name, UHID, complaint, phone)', () => {
    const entries = buildHierarchicalReportPatients({
      patients: [
        makePatient({ id: 'p-live', name: 'Rameshwar Sharma', uhid: 'QC-2026-9411', contact: '9876543210' })
      ],
      clinicalReports: [
        {
          id: 'rep-live',
          testId: 'test-cbc',
          testName: 'Blood Collection',
          patientId: 'p-live',
          patientUhid: 'QC-2026-9411',
          patientName: 'Rameshwar Sharma',
          technicianName: 'Sunil',
          counterId: 'c1',
          roomNo: 'Room 12',
          timestamp: '10:00 AM',
          createdAtMs: Date.now(),
          status: 'uploaded',
          summary: 'Done',
          metrics: []
        }
      ],
      historicalRecords: HISTORICAL_PATIENT_RECORDS,
      tests: INITIAL_TESTS,
      departments: INITIAL_DEPARTMENTS
    });

    const onlyNew = filterReportPatients(entries, 'new_reports', '');
    expect(onlyNew).toHaveLength(1);
    expect(onlyNew[0].name).toBe('Rameshwar Sharma');

    const onlyPast = filterReportPatients(entries, 'past', '');
    expect(onlyPast).toHaveLength(HISTORICAL_PATIENT_RECORDS.length);

    const searchByName = filterReportPatients(entries, 'all', 'Harish Chandra Gupta');
    expect(searchByName.some(e => e.uhid === 'QC-2026-8001')).toBe(true);
  });
});
