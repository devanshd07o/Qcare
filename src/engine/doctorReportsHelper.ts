import { ClinicalReport, Department, DiagnosticTest, Patient } from '../types';
import { HistoricalPatientRecord } from '../data/historicalPatientsData';
import { evaluateMetricFlag } from './sanitizer';

export type ReportPatientTier = 'new_incoming' | 'recent_today' | 'past_archived';
export type ReportTierFilter = 'all' | 'new_reports' | 'recent' | 'past';

export interface PendingInvestigationItem {
  testId: string;
  testName: string;
  room: string;
}

export interface DoctorReportPatientEntry {
  patientId: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  uhid: string;
  contact: string;
  opdTokenNumber?: string;
  chiefComplaint: string;
  prescribedDoctorName: string;
  prescribedDoctorRoom: string;
  tier: ReportPatientTier;
  tierRank: 1 | 2 | 3;
  reports: ClinicalReport[];
  pendingTests: PendingInvestigationItem[];
  unreadCount: number;
  hasCriticalFlag: boolean;
  hasAbnormalFlag: boolean;
  activityTimeLabel: string;
  sortTimestampMs: number;
  isLivePatient: boolean;
  doctorReviewStatus?: Patient['doctorReviewStatus'];
  patientNotes?: string;
}

export interface BuildHierarchicalReportsInput {
  patients: Patient[];
  clinicalReports: ClinicalReport[];
  historicalRecords: HistoricalPatientRecord[];
  tests: DiagnosticTest[];
  departments: Department[];
}

function resolveHistoricalMetricValue(
  testId: string,
  label: string,
  defaultValue: string | undefined,
  notes: string
): string {
  const lowerNotes = notes.toLowerCase();

  if (testId === 'test-fbs' && label.toLowerCase().includes('glucose')) {
    const fbsMatch = notes.match(/fbs\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
    if (fbsMatch) return fbsMatch[1];
    return lowerNotes.includes('diabet') ? '136' : '91';
  }

  if (testId === 'test-cbc') {
    if (label.toLowerCase().includes('hemoglobin')) {
      const hbMatch = notes.match(/hb\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
      if (hbMatch) return hbMatch[1];
      if (lowerNotes.includes('anemia') || lowerNotes.includes('microcytic')) return '11.4';
      return '13.8';
    }
    if (label.toLowerCase().includes('leukocyte') || label.toLowerCase().includes('tlc')) {
      const tlcMatch = notes.match(/tlc\s*[:=]?\s*([\d,]+)/i);
      if (tlcMatch) return tlcMatch[1].replace(/,/g, '');
      return '7400';
    }
  }

  if (testId === 'test-ecg' && label.toLowerCase().includes('heart rate')) {
    const hrMatch = notes.match(/(\d+)\s*bpm/i);
    if (hrMatch) return hrMatch[1];
  }

  if (testId === 'test-urine' && label.toLowerCase().includes('pus')) {
    const pusMatch = notes.match(/pus cells?\s*(\d+\s*-\s*\d+|\d+)/i);
    if (pusMatch) return pusMatch[1];
  }

  if (testId === 'test-usg-abdomen' && label.toLowerCase().includes('liver')) {
    if (lowerNotes.includes('fatty liver')) return 'Grade 1 fatty hepatomegaly, normal CBD';
  }

  return defaultValue || 'Normal';
}

function buildHistoricalPatientReports(
  record: HistoricalPatientRecord,
  tests: DiagnosticTest[],
  departments: Department[]
): ClinicalReport[] {
  const baseDateMs = Date.parse(record.visitDate) || 0;

  return record.completedTests.map((testId, idx) => {
    const test = tests.find(t => t.id === testId);
    const dept = test ? departments.find(d => d.id === test.departmentId) : undefined;

    const metrics = (test?.metricTemplates || []).map(tmpl => {
      const value = resolveHistoricalMetricValue(
        testId,
        tmpl.label,
        tmpl.defaultValue,
        record.diagnosisNotes
      );
      return {
        label: tmpl.label,
        value,
        unit: tmpl.unit,
        normalRange: tmpl.normalRange,
        flag: evaluateMetricFlag(value, tmpl.normalRange)
      };
    });

    const isCritical = metrics.some(m => m.flag === 'critical');

    return {
      id: `rep-hist-${record.id}-${testId}`,
      testId,
      testName: test?.name || record.testNames[idx] || 'Diagnostic Investigation',
      technicalName: test?.technicalName,
      patientId: record.id,
      patientUhid: record.uhid,
      patientName: record.name,
      technicianName: 'Archive Diagnostic Lab',
      counterId: dept?.code || 'LAB',
      roomNo: dept?.location.room || 'Diagnostic Plaza',
      timestamp: record.visitDate,
      createdAtMs: baseDateMs,
      status: 'verified_by_doctor',
      summary: record.diagnosisNotes,
      metrics,
      isCritical,
      doctorNotes: record.diagnosisNotes,
      doctorSignature: record.prescribedDoctorName
    };
  });
}

function sortLiveReportsNewestFirst(reports: ClinicalReport[]): ClinicalReport[] {
  return [...reports].sort((a, b) => {
    const tA = a.createdAtMs ?? 0;
    const tB = b.createdAtMs ?? 0;
    if (tB !== tA) return tB - tA;
    // Unverified uploaded reports rank above older verified ones on equal timestamps
    const sA = a.status === 'uploaded' ? 1 : 0;
    const sB = b.status === 'uploaded' ? 1 : 0;
    return sB - sA;
  });
}

/**
 * Builds the Doctor Portal hierarchical patient report directory:
 * Tier 1 (Top): Just-sent / active patients with newly generated unverified lab reports (`status === 'uploaded'`)
 * Tier 2 (Upper-Middle): Other today's active/recent OPD patients (verified or awaiting lab generation)
 * Tier 3 (Bottom): Past historical patients (`HISTORICAL_PATIENT_RECORDS`), newest visitDate -> oldest
 */
export function buildHierarchicalReportPatients(
  input: BuildHierarchicalReportsInput
): DoctorReportPatientEntry[] {
  const { patients, clinicalReports, historicalRecords, tests, departments } = input;
  const totalLive = patients.length;

  const liveEntries: Array<DoctorReportPatientEntry & { orderBoost: number }> = patients.map(
    (patient, idx) => {
      const matchingReports = sortLiveReportsNewestFirst(
        clinicalReports.filter(r => r.patientId === patient.id)
      );

      const unreadCount = matchingReports.filter(r => r.status === 'uploaded').length;
      const hasUnread = unreadCount > 0;

      const latestReportMs = matchingReports.reduce(
        (max, r) => Math.max(max, r.createdAtMs ?? 0),
        0
      );
      const regMs = patient.registeredAtMs ?? 0;
      const sortTimestampMs = Math.max(latestReportMs, regMs);

      const pendingTests: PendingInvestigationItem[] = (patient.prescribedTests || [])
        .filter(tId => !(patient.completedTests || []).includes(tId))
        .map(tId => {
          const tObj = tests.find(t => t.id === tId);
          const dept = tObj ? departments.find(d => d.id === tObj.departmentId) : undefined;
          return {
            testId: tId,
            testName: tObj?.name || 'Diagnostic Investigation',
            room: dept?.location.room || 'Diagnostic Bay'
          };
        });

      const hasCriticalFlag = matchingReports.some(
        r => r.isCritical || r.metrics.some(m => m.flag === 'critical')
      );
      const hasAbnormalFlag = matchingReports.some(r =>
        r.metrics.some(m => m.flag !== 'normal')
      );

      const tier: ReportPatientTier = hasUnread ? 'new_incoming' : 'recent_today';
      const tierRank: 1 | 2 = hasUnread ? 1 : 2;
      const activityTimeLabel =
        matchingReports[0]?.timestamp || patient.registrationTime || 'Today';

      return {
        patientId: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        uhid: patient.uhid,
        contact: patient.contact,
        opdTokenNumber: patient.opdTokenNumber,
        chiefComplaint: patient.chiefComplaint || patient.symptoms || 'OPD Consultation',
        prescribedDoctorName: patient.prescribedDoctorName,
        prescribedDoctorRoom: patient.prescribedDoctorRoom,
        tier,
        tierRank,
        reports: matchingReports,
        pendingTests,
        unreadCount,
        hasCriticalFlag,
        hasAbnormalFlag,
        activityTimeLabel,
        sortTimestampMs,
        isLivePatient: true,
        doctorReviewStatus: patient.doctorReviewStatus,
        patientNotes: patient.notes,
        // Array index 0 in `patients` is the most recently registered patient
        orderBoost: totalLive - idx
      };
    }
  );

  liveEntries.sort((a, b) => {
    if (a.tierRank !== b.tierRank) return a.tierRank - b.tierRank;
    if (b.sortTimestampMs !== a.sortTimestampMs) {
      return b.sortTimestampMs - a.sortTimestampMs;
    }
    return b.orderBoost - a.orderBoost;
  });

  const cleanLiveEntries: DoctorReportPatientEntry[] = liveEntries.map(
    ({ orderBoost: _ignored, ...entry }) => entry
  );

  const archivedEntries: DoctorReportPatientEntry[] = historicalRecords
    .map(record => {
      const generatedReports = buildHistoricalPatientReports(
        record,
        tests,
        departments
      );
      const visitMs = Date.parse(record.visitDate) || 0;
      const hasCriticalFlag = generatedReports.some(
        r => r.isCritical || r.metrics.some(m => m.flag === 'critical')
      );
      const hasAbnormalFlag = generatedReports.some(r =>
        r.metrics.some(m => m.flag !== 'normal')
      );

      return {
        patientId: record.id,
        name: record.name,
        age: record.age,
        gender: record.gender,
        uhid: record.uhid,
        contact: record.contact,
        chiefComplaint: record.chiefComplaint,
        prescribedDoctorName: record.prescribedDoctorName,
        prescribedDoctorRoom: record.prescribedDoctorRoom,
        tier: 'past_archived' as const,
        tierRank: 3 as const,
        reports: generatedReports,
        pendingTests: [],
        unreadCount: 0,
        hasCriticalFlag,
        hasAbnormalFlag,
        activityTimeLabel: record.visitDate,
        sortTimestampMs: visitMs,
        isLivePatient: false,
        doctorReviewStatus: 'completed' as const,
        patientNotes: record.diagnosisNotes
      };
    })
    .sort((a, b) => b.sortTimestampMs - a.sortTimestampMs);

  return [...cleanLiveEntries, ...archivedEntries];
}

export function filterReportPatients(
  entries: DoctorReportPatientEntry[],
  tierFilter: ReportTierFilter,
  query: string
): DoctorReportPatientEntry[] {
  const q = query.trim().toLowerCase();
  const digits = q.replace(/\D/g, '');

  return entries.filter(entry => {
    if (tierFilter === 'new_reports' && entry.tier !== 'new_incoming') return false;
    if (tierFilter === 'recent' && !entry.isLivePatient) return false;
    if (tierFilter === 'past' && entry.tier !== 'past_archived') return false;

    if (!q) return true;

    return (
      entry.name.toLowerCase().includes(q) ||
      entry.uhid.toLowerCase().includes(q) ||
      (entry.opdTokenNumber || '').toLowerCase().includes(q) ||
      entry.chiefComplaint.toLowerCase().includes(q) ||
      (digits.length >= 3 && entry.contact.replace(/\D/g, '').includes(digits))
    );
  });
}
