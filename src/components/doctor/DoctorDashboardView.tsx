import React, { useState } from 'react';
import { ChevronRight, UserPlus } from 'lucide-react';
import { DoctorReportPatientEntry } from '../../engine/doctorReportsHelper';
import { DoctorPortalView, Patient } from '../../types';
import { QueueFilterMode } from './DoctorQueueWorkspace';
import { BlurFade } from '../ui/blur-fade';
import { NumberTicker } from '../ui/number-ticker';
import { OpdMixDonutChart } from './DoctorDashboardCharts';

interface DoctorDashboardViewProps {
  doctorId: string;
  doctorName: string;
  doctorRoom: string;
  patients: Patient[];
  recordsCount: number;
  reportPatients: DoctorReportPatientEntry[];
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
  patients,
  reportPatients,
  onSelectView,
  onOpenQueueWithFilter,
  onOpenPatientReports,
  onLoadDemoQueue
}) => {
  const [queueTab, setQueueTab] = useState<'all' | 'tests'>('all');

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
    e => e.tier === 'new_incoming'
  );
  const unreadReportPatientIds = new Set(
    incomingReportEntries.map(e => e.patientId)
  );

  type RowKind = 'urgent' | 'ready' | 'in_tests' | 'waiting';
  interface PatientRow {
    id: string;
    name: string;
    token: string;
    tag: string;
    kind: RowKind;
    otherRoom?: string;
    actionType: 'reports' | 'queue';
    sortWeight: number;
  }

  const seenIds = new Set<string>();
  const activeRows: PatientRow[] = [];
  const inTestRows: PatientRow[] = [];

  for (const entry of incomingReportEntries) {
    const isOwn =
      doctorPatientIds.has(entry.patientId) ||
      (normalizedActiveDoc !== '' &&
        normalizeDoctorName(entry.prescribedDoctorName) === normalizedActiveDoc);
    seenIds.add(entry.patientId);
    activeRows.push({
      id: entry.patientId,
      name: entry.name,
      token: entry.opdTokenNumber || entry.uhid,
      tag: entry.hasCriticalFlag ? 'Critical' : 'Report',
      kind: entry.hasCriticalFlag ? 'urgent' : 'ready',
      otherRoom: !isOwn ? entry.prescribedDoctorRoom : undefined,
      actionType: 'reports',
      sortWeight: (isOwn ? 0 : 10) + (entry.hasCriticalFlag ? 0 : 1)
    });
  }

  for (const pat of patients) {
    const isOwn = patientBelongsToDoctor(pat, doctorId, doctorName);

    if (pat.doctorReviewStatus === 'awaiting_lab_reports') {
      inTestRows.push({
        id: pat.id,
        name: pat.name,
        token: pat.opdTokenNumber,
        tag: 'In Tests',
        kind: 'in_tests',
        otherRoom: !isOwn ? pat.prescribedDoctorRoom : undefined,
        actionType: 'queue',
        sortWeight: (isOwn ? 0 : 10) + 2
      });
    }

    if (seenIds.has(pat.id) || pat.doctorReviewStatus === 'completed') continue;

    if (pat.doctorReviewStatus === 'reports_ready') {
      seenIds.add(pat.id);
      activeRows.push({
        id: pat.id,
        name: pat.name,
        token: pat.opdTokenNumber,
        tag: 'Ready',
        kind: 'ready',
        otherRoom: !isOwn ? pat.prescribedDoctorRoom : undefined,
        actionType: 'reports',
        sortWeight: (isOwn ? 0 : 10) + 1.5
      });
    } else if (pat.priority === 'emergency') {
      seenIds.add(pat.id);
      activeRows.push({
        id: pat.id,
        name: pat.name,
        token: pat.opdTokenNumber,
        tag: 'Urgent',
        kind: 'urgent',
        otherRoom: !isOwn ? pat.prescribedDoctorRoom : undefined,
        actionType: 'queue',
        sortWeight: (isOwn ? 0 : 10) + 0.5
      });
    } else if (pat.doctorReviewStatus === 'awaiting_prescription') {
      seenIds.add(pat.id);
      activeRows.push({
        id: pat.id,
        name: pat.name,
        token: pat.opdTokenNumber,
        tag: 'Waiting',
        kind: 'waiting',
        otherRoom: !isOwn ? pat.prescribedDoctorRoom : undefined,
        actionType: 'queue',
        sortWeight: (isOwn ? 0 : 10) + 3
      });
    }
  }

  const allSorted = [
    ...activeRows,
    ...inTestRows.filter(t => !activeRows.some(a => a.id === t.id))
  ].sort((a, b) => a.sortWeight - b.sortWeight);

  const visibleRows =
    queueTab === 'tests'
      ? inTestRows.slice(0, 6)
      : allSorted.slice(0, 6);

  const unreadHeaderCount = doctorPatients.filter(p =>
    unreadReportPatientIds.has(p.id)
  ).length;
  const reportsMetric = Math.max(reportsReadyCount, unreadHeaderCount);

  return (
    <BlurFade duration={0.2} offset={4} className="space-y-4">
      {/* 1. Doctor Name + Register CTA */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-default)]">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-[26px] font-bold tracking-[-0.025em] text-[var(--text-primary)] leading-[1.15]">
            {doctorName}
          </h1>
          <p className="mt-0.5 text-xs sm:text-[13px] font-medium text-[var(--text-secondary)]">
            {doctorRoom}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {patients.length === 0 && (
            <button
              type="button"
              onClick={onLoadDemoQueue}
              className="h-11 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] text-xs font-semibold text-[var(--text-primary)] transition-[background-color] duration-150 cursor-pointer"
            >
              Demo Patients
            </button>
          )}
          <button
            type="button"
            onClick={() => onSelectView('walkin')}
            className="h-11 px-5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] active:translate-y-px text-white text-sm font-semibold inline-flex items-center justify-center gap-2 border border-[var(--accent-primary-hover)] qcare-pill-3d-solid transition-[background-color,transform] duration-150 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 shrink-0" strokeWidth={2.2} />
            <span>Register Patient</span>
          </button>
        </div>
      </header>

      {/* 2. 4 Clean Numbers — crisp crosshair gap-px hairline grid */}
      <section
        aria-label="Patient counts"
        className="rounded-xl border border-[var(--border-default)] bg-[var(--border-subtle)] overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px">
          <button
            type="button"
            onClick={() => onOpenQueueWithFilter('waiting')}
            className="bg-[var(--bg-surface)] px-4 py-3.5 text-left hover:bg-[var(--bg-surface-hover)] transition-colors duration-150 cursor-pointer"
          >
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Waiting
            </span>
            <span className="mt-1 block font-mono text-2xl font-bold text-[var(--text-primary)] tabular-nums leading-none">
              <NumberTicker value={waitingCount} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQueueWithFilter('in_diagnostics')}
            className="bg-[var(--bg-surface)] px-4 py-3.5 text-left hover:bg-[var(--bg-surface-hover)] transition-colors duration-150 cursor-pointer"
          >
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              In Tests
            </span>
            <span className="mt-1 block font-mono text-2xl font-bold text-[var(--text-primary)] tabular-nums leading-none">
              <NumberTicker value={inTestsCount} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView('reports')}
            className="bg-[var(--bg-surface)] px-4 py-3.5 text-left hover:bg-[var(--bg-surface-hover)] transition-colors duration-150 cursor-pointer"
          >
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Reports
            </span>
            <span className="mt-1 block font-mono text-2xl font-bold text-[var(--text-primary)] tabular-nums leading-none">
              <NumberTicker value={reportsMetric} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView('records')}
            className="bg-[var(--bg-surface)] px-4 py-3.5 text-left hover:bg-[var(--bg-surface-hover)] transition-colors duration-150 cursor-pointer"
          >
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Done
            </span>
            <span className="mt-1 block font-mono text-2xl font-bold text-[var(--text-primary)] tabular-nums leading-none">
              <NumberTicker value={doneCount} />
            </span>
          </button>
        </div>
      </section>

      {/* 3. Balanced Patients List & Overview Chart */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-7 h-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col">
          <div className="px-4 sm:px-5 py-2.5 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[var(--text-primary)] leading-[1.25] tracking-tight">
              Patients
            </h2>

            <div className="flex items-center gap-2">
              {activeRows.length > 0 && inTestRows.length > 0 && (
                <div className="inline-flex rounded-lg bg-[var(--bg-surface-subtle)] p-0.5 border border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setQueueTab('all')}
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-semibold transition-colors duration-150 cursor-pointer ${
                      queueTab === 'all'
                        ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] qcare-pill-3d'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Active ({allSorted.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueTab('tests')}
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-semibold transition-colors duration-150 cursor-pointer ${
                      queueTab === 'tests'
                        ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] qcare-pill-3d'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Tests ({inTestRows.length})
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => onSelectView('queue')}
                className="text-xs font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer"
              >
                {allSorted.length > 6 ? `All (${allSorted.length})` : 'Queue'}
              </button>
            </div>
          </div>

          {visibleRows.length === 0 ? (
            <div className="flex-1 px-4 sm:px-5 py-8 flex items-center justify-center">
              <p className="text-xs font-medium text-[var(--text-tertiary)]">
                No active patients
              </p>
            </div>
          ) : (
            <div className="flex-1 divide-y divide-[var(--border-subtle)]">
              {visibleRows.map(row => {
                const tagClass =
                  row.kind === 'urgent'
                    ? 'text-[var(--danger)]'
                    : row.kind === 'ready'
                      ? 'text-[var(--status-success)]'
                      : row.kind === 'in_tests'
                        ? 'text-[var(--seg-2)]'
                        : 'text-[var(--accent-primary)]';

                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => {
                      if (row.actionType === 'reports') {
                        onOpenPatientReports(row.id);
                      } else {
                        onOpenQueueWithFilter('all', row.id);
                      }
                    }}
                    className="w-full px-4 sm:px-5 py-3 text-left hover:bg-[var(--bg-surface-hover)] transition-[background-color] duration-150 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                        {row.name}
                      </span>
                      <span className="font-mono text-[11px] font-medium text-[var(--text-tertiary)] tabular-nums shrink-0">
                        {row.token}
                      </span>
                      {row.otherRoom && (
                        <span className="font-mono text-[10px] text-[var(--text-tertiary)] shrink-0">
                          ({row.otherRoom})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-semibold ${tagClass}`}>
                        {row.tag}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 h-full">
          <OpdMixDonutChart patients={doctorPatients} />
        </div>
      </section>
    </BlurFade>
  );
};
