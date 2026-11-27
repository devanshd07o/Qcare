import React, { useEffect, useState } from 'react';
import { ChevronRight, UserPlus } from 'lucide-react';
import { DoctorReportPatientEntry } from '../../engine/doctorReportsHelper';
import { HistoricalPatientRecord } from '../../data/historicalPatientsData';
import { DiagnosticTest, DoctorPortalView, Patient } from '../../types';
import { QueueFilterMode } from './DoctorQueueWorkspace';
import { BlurFade } from '../ui/blur-fade';
import { NumberTicker } from '../ui/number-ticker';
import {
  DiagnosticActivityCard,
  getShortTestCodeLabel
} from './DoctorDashboardCharts';

const DoctorPortraitSvg: React.FC = () => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
    aria-hidden="true"
  >
    <rect width="64" height="64" rx="10" fill="#F1F5F9" />
    <circle cx="32" cy="23" r="9.5" fill="#FFFFFF" stroke="#102A43" strokeWidth="1.75" />
    <path
      d="M15 53C15.8 42.5 22.8 37 32 37C41.2 37 48.2 42.5 49 53"
      fill="#FFFFFF"
      stroke="#102A43"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <path
      d="M25.5 38.5L32 47.5L38.5 38.5"
      stroke="#087C80"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M23.5 41.5V47.5C23.5 50.5 26 53 29 53C32 53 34.5 50.5 34.5 47.5V45"
      stroke="#102A43"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <circle cx="40.5" cy="46.5" r="2.25" fill="#087C80" />
    <path d="M40.5 44.25V41.5" stroke="#087C80" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

function formatCompactComplaint(text?: string): string {
  const clean = (text || '').trim().replace(/\s+/g, ' ');
  if (!clean) return '';
  const firstClause = clean.split(',')[0].trim();
  if (firstClause.length <= 24) return firstClause;
  const sliced = firstClause.slice(0, 24);
  const lastSpace = sliced.lastIndexOf(' ');
  const trimmed = lastSpace > 10 ? sliced.slice(0, lastSpace) : sliced;
  return `${trimmed.trim()}…`;
}

interface DoctorDashboardViewProps {
  doctorId: string;
  doctorName: string;
  doctorRoom: string;
  doctorDesignation?: string;
  doctorAvatar?: string;
  patients: Patient[];
  recordsCount: number;
  reportPatients: DoctorReportPatientEntry[];
  historicalRecords: HistoricalPatientRecord[];
  tests: DiagnosticTest[];
  onSelectView: (view: DoctorPortalView) => void;
  onOpenQueueWithFilter: (filter: QueueFilterMode, patientId?: string) => void;
  onOpenPatientReports: (patientId: string) => void;
  onLoadDemoQueue: () => void;
}

function normalizeDoctorName(name?: string): string {
  return (name || '')
    .replace(/\(Asst:[^)]*\)/gi, '')
    .replace(/^dr\.?\s*/i, '')
    .trim()
    .toLowerCase();
}

function patientBelongsToDoctor(
  patient: Patient,
  doctorId: string,
  doctorName: string
): boolean {
  if (doctorId && patient.prescribedDoctorId === doctorId) return true;
  const targetDoc = normalizeDoctorName(doctorName);
  const patDoc = normalizeDoctorName(patient.prescribedDoctorName);
  return Boolean(targetDoc && patDoc && targetDoc === patDoc);
}

export const DoctorDashboardView: React.FC<DoctorDashboardViewProps> = ({
  doctorId,
  doctorName,
  doctorRoom,
  doctorDesignation = 'Consultant Physician',
  doctorAvatar,
  patients,
  recordsCount,
  reportPatients,
  tests,
  onSelectView,
  onOpenQueueWithFilter,
  onOpenPatientReports,
  onLoadDemoQueue
}) => {
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [doctorAvatar]);

  const showPhoto = Boolean(doctorAvatar && !avatarFailed);

  // Scope metrics and patient queue strictly to this doctor's personal patients
  const doctorPatients = patients.filter(p =>
    patientBelongsToDoctor(p, doctorId, doctorName)
  );
  const doctorPatientIds = new Set(doctorPatients.map(p => p.id));

  const waitingCount = doctorPatients.filter(
    p => p.doctorReviewStatus === 'awaiting_prescription'
  ).length;
  const inTestsCount = doctorPatients.filter(
    p => p.doctorReviewStatus === 'awaiting_lab_reports'
  ).length;
  const reportsReadyCount = doctorPatients.filter(
    p => p.doctorReviewStatus === 'reports_ready'
  ).length;
  const doneCount = doctorPatients.filter(
    p => p.doctorReviewStatus === 'completed'
  ).length;

  const normalizedActiveDoc = normalizeDoctorName(doctorName);
  const incomingReportEntries = reportPatients.filter(
    e =>
      e.tier === 'new_incoming' &&
      (doctorPatientIds.has(e.patientId) ||
        (normalizedActiveDoc !== '' &&
          normalizeDoctorName(e.prescribedDoctorName) === normalizedActiveDoc))
  );
  const unreadReportPatientIds = new Set(
    incomingReportEntries.map(e => e.patientId)
  );

  interface QueueTableRow {
    id: string;
    name: string;
    clinicalMeta: string;
    totalTests: number;
    completedTests: number;
    statusLabel: string;
    statusTone: 'danger' | 'success' | 'info' | 'warning';
    actionType: 'reports' | 'queue';
    sortWeight: number;
  }

  const seenIds = new Set<string>();
  const queueRows: QueueTableRow[] = [];

  for (const pat of doctorPatients) {
    if (pat.doctorReviewStatus === 'completed') continue;

    seenIds.add(pat.id);
    const totalTests = pat.prescribedTests?.length || 0;
    const completedTests = pat.completedTests?.length || 0;
    const complaint = formatCompactComplaint(pat.chiefComplaint);
    const ageGender = [pat.age ? `${pat.age} yrs` : '', pat.gender, complaint]
      .filter(Boolean)
      .join(' · ');

    if (unreadReportPatientIds.has(pat.id) || pat.doctorReviewStatus === 'reports_ready') {
      const reportEntry = incomingReportEntries.find(e => e.patientId === pat.id);
      const isCrit = Boolean(reportEntry?.hasCriticalFlag);
      queueRows.push({
        id: pat.id,
        name: pat.name,
        clinicalMeta: ageGender,
        totalTests,
        completedTests: totalTests > 0 ? Math.max(completedTests, totalTests) : 0,
        statusLabel: isCrit ? 'Critical' : 'Reports ready',
        statusTone: isCrit ? 'danger' : 'success',
        actionType: 'reports',
        sortWeight: isCrit ? 0 : 1
      });
    } else if (pat.priority === 'emergency') {
      queueRows.push({
        id: pat.id,
        name: pat.name,
        clinicalMeta: ageGender,
        totalTests,
        completedTests,
        statusLabel: 'Urgent',
        statusTone: 'danger',
        actionType: 'queue',
        sortWeight: 0.5
      });
    } else if (pat.doctorReviewStatus === 'awaiting_lab_reports') {
      queueRows.push({
        id: pat.id,
        name: pat.name,
        clinicalMeta: ageGender,
        totalTests,
        completedTests,
        statusLabel: 'In tests',
        statusTone: 'info',
        actionType: 'queue',
        sortWeight: 2
      });
    } else {
      queueRows.push({
        id: pat.id,
        name: pat.name,
        clinicalMeta: ageGender,
        totalTests,
        completedTests,
        statusLabel: 'Waiting',
        statusTone: 'warning',
        actionType: 'queue',
        sortWeight: 3
      });
    }
  }

  for (const entry of incomingReportEntries) {
    if (seenIds.has(entry.patientId)) continue;
    seenIds.add(entry.patientId);
    const entryComplaint = formatCompactComplaint(entry.chiefComplaint);
    queueRows.push({
      id: entry.patientId,
      name: entry.name,
      clinicalMeta: [entry.age ? `${entry.age} yrs` : '', entry.gender, entryComplaint]
        .filter(Boolean)
        .join(' · '),
      totalTests: entry.reports.length,
      completedTests: entry.reports.length,
      statusLabel: entry.hasCriticalFlag ? 'Critical' : 'Reports ready',
      statusTone: entry.hasCriticalFlag ? 'danger' : 'success',
      actionType: 'reports',
      sortWeight: entry.hasCriticalFlag ? 0 : 1
    });
  }

  queueRows.sort((a, b) => a.sortWeight - b.sortWeight);

  const unreadHeaderCount = doctorPatients.filter(p =>
    unreadReportPatientIds.has(p.id)
  ).length;
  const reportsMetric = Math.max(reportsReadyCount, unreadHeaderCount);

  const liveReviewReports = incomingReportEntries.slice(0, 8);

  const statItems: Array<{
    key: string;
    label: string;
    value: number;
    onClick: () => void;
  }> = [
    {
      key: 'waiting',
      label: 'Waiting',
      value: waitingCount,
      onClick: () => onOpenQueueWithFilter('waiting')
    },
    {
      key: 'diagnostics',
      label: 'In diagnostics',
      value: inTestsCount,
      onClick: () => onOpenQueueWithFilter('in_diagnostics')
    },
    {
      key: 'reports',
      label: 'Reports ready',
      value: reportsMetric,
      onClick: () => onSelectView('reports')
    },
    {
      key: 'done',
      label: 'Completed',
      value: doneCount,
      onClick: () => onSelectView('records')
    }
  ];

  return (
    <BlurFade duration={0.18} offset={4} className="space-y-5">
      {/* 1. Clinical Workspace Header: Prominent Doctor Portrait/SVG + 26px Masthead + Designation + Register CTA */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[10px] border border-[#E2E8F0] bg-white overflow-hidden shrink-0">
            {showPhoto ? (
              <img
                src={doctorAvatar}
                alt={doctorName}
                loading="eager"
                decoding="sync"
                onError={() => setAvatarFailed(true)}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <DoctorPortraitSvg />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] leading-[1.2] truncate">
              {doctorName}
            </h1>
            <p className="mt-1 text-[12px] font-normal text-[#64748B] leading-[1.45]">
              {doctorDesignation} · {doctorRoom}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {patients.length === 0 && (
            <button
              type="button"
              onClick={onLoadDemoQueue}
              className="h-10 px-4 rounded-[8px] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[13px] font-medium text-[#0F172A] transition-colors duration-150 cursor-pointer"
            >
              Demo Patients
            </button>
          )}
          <button
            type="button"
            onClick={() => onSelectView('walkin')}
            className="h-10 px-4 rounded-[8px] qc-primary-cta text-white text-[13px] font-medium inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>Register Patient</span>
          </button>
        </div>
      </header>

      {/* 2. Minimal 4-Card Clinical Statistics (No icons, no color noise, 32px Inter tabular-nums) */}
      <section aria-label="Patient counts" className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {statItems.map(stat => (
          <button
            key={stat.key}
            type="button"
            onClick={stat.onClick}
            className="rounded-[10px] border border-[#E2E8F0] bg-white px-5 py-4 text-left hover:border-[#CBD5E1] transition-colors duration-150 cursor-pointer"
          >
            <span className="block text-[12px] font-normal text-[#64748B]">
              {stat.label}
            </span>
            <span className="mt-2 block text-[32px] font-semibold text-[#0F172A] tabular-nums leading-none">
              <NumberTicker value={stat.value} />
            </span>
          </button>
        ))}
      </section>

      {/* 3. Row 1: Clinical Patient Queue Table (Internal Scroll) & Diagnostic Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 h-full rounded-[10px] border border-[#E2E8F0] bg-white overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2.5 min-w-0">
              <h2 className="text-[16px] font-semibold text-[#0F172A] leading-[1.3] tracking-[-0.01em]">
                Patient queue
              </h2>
              <span className="text-[12px] font-normal text-[#64748B] tabular-nums">
                {queueRows.length} {queueRows.length === 1 ? 'patient' : 'patients'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onSelectView('queue')}
              className="text-[12px] font-medium text-[#087C80] hover:underline cursor-pointer shrink-0"
            >
              Full queue
            </button>
          </div>

          {queueRows.length === 0 ? (
            <div className="flex-1 px-5 py-10 flex items-center justify-between gap-3">
              <p className="text-[12px] font-normal text-[#64748B]">
                No active patients in queue
              </p>
              <button
                type="button"
                onClick={() => onSelectView('walkin')}
                className="text-[12px] font-medium text-[#087C80] hover:underline cursor-pointer shrink-0"
              >
                Register walk-in
              </button>
            </div>
          ) : (
            <div className="flex-1 max-h-[296px] overflow-y-auto overscroll-contain">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                  <tr>
                    <th scope="col" className="px-5 py-2.5 text-[12px] font-medium text-[#64748B] border-b border-[#E2E8F0] bg-[#F8FAFC]">
                      Patient
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-[12px] font-medium text-[#64748B] hidden sm:table-cell border-b border-[#E2E8F0] bg-[#F8FAFC]">
                      Test progress
                    </th>
                    <th scope="col" className="px-5 py-2.5 text-right text-[12px] font-medium text-[#64748B] border-b border-[#E2E8F0] bg-[#F8FAFC]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:not(:last-child)_td]:border-b [&_tr:not(:last-child)_td]:border-[#E2E8F0]">
                  {queueRows.map(row => {
                    const progressPct =
                      row.totalTests > 0
                        ? Math.round((row.completedTests / row.totalTests) * 100)
                        : 0;

                    const statusColor =
                      row.statusTone === 'danger'
                        ? 'text-[#B91C1C]'
                        : row.statusTone === 'success'
                          ? 'text-[#087C80]'
                          : row.statusTone === 'info'
                            ? 'text-[#0369A1]'
                            : 'text-[#B45309]';

                    const openRow = () => {
                      if (row.actionType === 'reports') {
                        onOpenPatientReports(row.id);
                      } else {
                        onOpenQueueWithFilter('all', row.id);
                      }
                    };

                    const testsUnit = row.totalTests === 1 ? 'test' : 'tests';

                    return (
                      <tr
                        key={row.id}
                        tabIndex={0}
                        onClick={openRow}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openRow();
                          }
                        }}
                        className="h-[54px] hover:bg-[#F8FAFC] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:bg-[#F1F5F9]"
                      >
                        <td className="px-5 py-2.5 align-middle">
                          <div className="text-[14px] font-medium text-[#0F172A] leading-snug">
                            {row.name}
                          </div>
                          <div className="text-[12px] font-normal text-[#64748B] leading-snug mt-0.5">
                            {row.clinicalMeta}
                            {row.totalTests > 0 && (
                              <span className="sm:hidden">
                                {' · '}
                                {row.completedTests}/{row.totalTests} {testsUnit}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-2.5 align-middle hidden sm:table-cell">
                          {row.totalTests > 0 ? (
                            <div className="max-w-[130px]">
                              <div className="text-[12px] font-medium text-[#0F172A] tabular-nums">
                                {row.completedTests} of {row.totalTests} {testsUnit}
                              </div>
                              <div className="mt-1 h-1.5 w-full rounded-[3px] bg-[#E2E8F0] overflow-hidden">
                                <div
                                  className="h-full rounded-[3px] bg-[#087C80]"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[12px] font-normal text-[#64748B]">
                              Consult pending
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-2.5 align-middle text-right whitespace-nowrap">
                          <span className={`text-[12px] font-medium ${statusColor}`}>
                            {row.statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 h-full">
          <DiagnosticActivityCard patients={doctorPatients} tests={tests} />
        </div>
      </section>

      {/* 4. Row 2: Minimalistic Incoming Reports Review Bar */}
      <section className="rounded-[10px] border border-[#E2E8F0] bg-white overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-[16px] font-semibold text-[#0F172A] leading-[1.3] tracking-[-0.01em]">
              Reports to review
            </h2>
            {liveReviewReports.length > 0 && (
              <span className="text-[12px] font-medium text-[#087C80] tabular-nums">
                {liveReviewReports.length} pending
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-[12px] font-medium">
            <button
              type="button"
              onClick={() => onSelectView('records')}
              className="text-[#64748B] hover:text-[#0F172A] transition-colors duration-150 cursor-pointer tabular-nums"
            >
              Past records ({recordsCount})
            </button>
            <button
              type="button"
              onClick={() => onSelectView('reports')}
              className="text-[#087C80] hover:underline cursor-pointer"
            >
              All reports
            </button>
          </div>
        </div>

        {liveReviewReports.length === 0 ? (
          <div className="px-5 py-4 flex items-center justify-between gap-3">
            <span className="text-[13px] text-[#64748B]">
              No pending lab reports awaiting review
            </span>
          </div>
        ) : (
          <div className="max-h-[220px] overflow-y-auto overscroll-contain divide-y divide-[#E2E8F0]">
            {liveReviewReports.map(entry => {
              const testSummary = entry.reports
                .slice(0, 2)
                .map(r => getShortTestCodeLabel(r.testId, r.testName.replace(/\s*\([^)]*\)/g, '')))
                .join(' · ');
              const abnormalMetric = entry.reports
                .flatMap(r => r.metrics)
                .find(m => m.flag !== 'normal');
              const abnormalHint = abnormalMetric
                ? `${abnormalMetric.label} ${abnormalMetric.value}${abnormalMetric.unit ? ` ${abnormalMetric.unit}` : ''}`
                : '';
              const secondarySummary = [testSummary, abnormalHint].filter(Boolean).join(' · ');
              const statusTone = entry.hasCriticalFlag
                ? 'text-[#B91C1C]'
                : entry.hasAbnormalFlag
                  ? 'text-[#B45309]'
                  : 'text-[#087C80]';
              const statusText = entry.hasCriticalFlag
                ? 'Critical'
                : entry.hasAbnormalFlag
                  ? 'Abnormal'
                  : `${entry.unreadCount} new`;

              return (
                <button
                  key={entry.patientId}
                  type="button"
                  onClick={() => onOpenPatientReports(entry.patientId)}
                  className="w-full min-h-[52px] px-5 py-3 text-left hover:bg-[#F8FAFC] transition-colors duration-150 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-[#0F172A] truncate">
                      {entry.name}
                    </div>
                    {secondarySummary && (
                      <div className="text-[12px] font-normal text-[#64748B] truncate mt-0.5">
                        {secondarySummary}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[12px] font-medium tabular-nums ${statusTone}`}>
                      {statusText}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#64748B]" strokeWidth={1.75} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </BlurFade>
  );
};
