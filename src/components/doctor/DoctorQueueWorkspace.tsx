import React from 'react';
import {
  Check,
  Clock,
  ExternalLink,
  FileCheck,
  FlaskConical,
  MapPin,
  Printer,
  Search,
  Users,
  X
} from 'lucide-react';
import { ClinicalReport, Department, DiagnosticTest, Patient, QueueToken } from '../../types';
import { AnimatedBackground } from '../ui/animated-background';
import { BlurFade } from '../ui/blur-fade';
import { NumberTicker } from '../ui/number-ticker';
import { ProgressBar } from '../ui/progress-bar';

export type QueueFilterMode = 'all' | 'waiting' | 'in_diagnostics' | 'reports_ready' | 'completed';
export type WorkspaceTabMode = 'route' | 'prescribe' | 'reports';

interface DoctorQueueWorkspaceProps {
  patients: Patient[];
  filteredPatients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (id: string) => void;
  tests: DiagnosticTest[];
  departments: Department[];
  queueTokens: QueueToken[];
  patientReports: ClinicalReport[];
  queueFilter: QueueFilterMode;
  onChangeQueueFilter: (filter: QueueFilterMode) => void;
  queueSearchQuery: string;
  onChangeQueueSearch: (q: string) => void;
  waitingCount: number;
  inDiagCount: number;
  reportsReadyCount: number;
  completedCount: number;
  workspaceTab: WorkspaceTabMode;
  onChangeWorkspaceTab: (tab: WorkspaceTabMode) => void;
  doctorConclusionNotes: string;
  onChangeConclusionNotes: (notes: string) => void;
  onOpenSlip: (p: Patient) => void;
  onOpenPatientView: (patientId: string) => void;
  onEditTests: (p: Patient) => void;
  onSwitchToWalkin: () => void;
  onVerifyAndDischarge: (patientId: string, notes: string) => void;
  onLoadDemoQueue: () => void;
}

function formatIndianPhone(rawContact: string): string {
  const trimmed = (rawContact || '').trim();
  if (!trimmed) return '—';
  const digits = trimmed.replace(/\D/g, '');
  const localTen = digits.length >= 10 ? digits.slice(-10) : digits;
  if (localTen.length === 10) {
    return `+91 ${localTen.slice(0, 5)} ${localTen.slice(5)}`;
  }
  return trimmed.startsWith('+') ? trimmed : `+91 ${trimmed}`;
}

export const DoctorQueueWorkspace: React.FC<DoctorQueueWorkspaceProps> = ({
  patients,
  filteredPatients,
  selectedPatient,
  onSelectPatient,
  tests,
  departments,
  queueTokens,
  patientReports,
  queueFilter,
  onChangeQueueFilter,
  queueSearchQuery,
  onChangeQueueSearch,
  waitingCount,
  inDiagCount,
  reportsReadyCount,
  completedCount,
  workspaceTab,
  onChangeWorkspaceTab,
  doctorConclusionNotes,
  onChangeConclusionNotes,
  onOpenSlip,
  onOpenPatientView,
  onEditTests,
  onSwitchToWalkin,
  onVerifyAndDischarge,
  onLoadDemoQueue
}) => {
  const filterItems: Array<{ id: QueueFilterMode; label: string; count: number }> = [
    { id: 'all', label: 'All', count: patients.length },
    { id: 'waiting', label: 'Wait', count: waitingCount },
    { id: 'in_diagnostics', label: 'Tests', count: inDiagCount },
    { id: 'reports_ready', label: 'Ready', count: reportsReadyCount },
    { id: 'completed', label: 'Done', count: completedCount }
  ];

  const testsCount = selectedPatient?.prescribedTests.length || 0;
  const doneCount = selectedPatient?.completedTests.length || 0;
  const hasReports = patientReports.length > 0;
  const activeViewKey: 'reports' | 'route' =
    workspaceTab === 'reports' && hasReports ? 'reports' : 'route';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* ==================================================
          LEFT COLUMN: CLEAN OPD ROSTER (4 Cols)
      ================================================== */}
      <aside className="lg:col-span-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col">
        <div className="p-3.5 sm:p-4 border-b border-[var(--border-subtle)] space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
              OPD Queue
            </h2>
            <span className="font-mono text-xs text-[var(--text-secondary)] tabular-nums">
              <NumberTicker value={filteredPatients.length} /> / {patients.length}
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={queueSearchQuery}
              onChange={e => onChangeQueueSearch(e.target.value)}
              placeholder="Search name or token..."
              aria-label="Search OPD queue"
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)]/60 focus:bg-[var(--bg-surface)] text-base sm:text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-[border-color,background-color] duration-150"
            />
            {queueSearchQuery && (
              <button
                type="button"
                onClick={() => onChangeQueueSearch('')}
                aria-label="Clear queue search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer p-1.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Crisp 5-item Status Filter */}
          <div className="bg-[var(--bg-surface-subtle)] p-1 rounded-xl border border-[var(--border-subtle)] grid grid-cols-5">
            <AnimatedBackground
              value={queueFilter}
              onValueChange={val => {
                if (val) onChangeQueueFilter(val as QueueFilterMode);
              }}
              className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xs"
            >
              {filterItems.map(tab => {
                const isActive = queueFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    data-id={tab.id}
                    className={`min-h-[34px] w-full px-0.5 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-semibold flex items-center justify-center gap-0.5 sm:gap-1 cursor-pointer transition-colors duration-150 whitespace-nowrap ${
                      isActive
                        ? 'text-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`font-mono text-[9.5px] sm:text-[10px] tabular-nums ${
                        isActive ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-tertiary)]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </AnimatedBackground>
          </div>
        </div>

        {/* Clean Two-Line Patient Rows */}
        <div className="divide-y divide-[var(--border-subtle)] max-h-[540px] overflow-y-auto dp-scroll">
          {filteredPatients.length === 0 ? (
            <div className="p-7 text-center space-y-3">
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                No patients in this filter
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onSwitchToWalkin}
                  className="h-10 sm:h-9 px-3 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-semibold cursor-pointer transition-colors duration-150"
                >
                  + Walk-in
                </button>
                <button
                  type="button"
                  onClick={onLoadDemoQueue}
                  className="h-10 sm:h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] text-xs font-semibold cursor-pointer transition-colors duration-150"
                >
                  Demo Patients
                </button>
              </div>
            </div>
          ) : (
            filteredPatients.map(patient => {
              const isSelected = selectedPatient?.id === patient.id;
              const isEmergency = patient.priority === 'emergency';

              return (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => onSelectPatient(patient.id)}
                  className={`w-full text-left px-4 py-3 flex flex-col gap-1 cursor-pointer border-l-[3px] transition-[background-color,border-color] duration-150 ${
                    isSelected
                      ? 'bg-[var(--accent-subtle)]/65 border-l-[var(--accent-primary)]'
                      : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-[13px] text-[var(--text-primary)] truncate">
                        {patient.name}
                      </span>
                      {isEmergency && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--danger)] shrink-0">
                          Urgent
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-[var(--accent-primary)] tabular-nums shrink-0">
                      {patient.opdTokenNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    {patient.doctorReviewStatus === 'awaiting_prescription' && (
                      <span className="text-[var(--status-warning)] font-medium inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-warning)]" />
                        Waiting
                      </span>
                    )}
                    {patient.doctorReviewStatus === 'awaiting_lab_reports' && (
                      <span className="text-[var(--accent-primary)] font-medium inline-flex items-center gap-1.5 tabular-nums">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                        Tests ({patient.completedTests.length}/{patient.prescribedTests.length})
                      </span>
                    )}
                    {patient.doctorReviewStatus === 'reports_ready' && (
                      <span className="text-[var(--status-success)] font-semibold inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)]" />
                        Reports Ready
                      </span>
                    )}
                    {patient.doctorReviewStatus === 'completed' && (
                      <span className="text-[var(--text-tertiary)] inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]" />
                        Done
                      </span>
                    )}

                    <span className="text-[10.5px] text-[var(--text-tertiary)] font-mono tabular-nums">
                      {patient.registrationTime}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {patients.length < 3 && (
          <div className="px-4 py-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/60 flex items-center justify-end">
            <button
              type="button"
              onClick={onLoadDemoQueue}
              className="text-[11px] font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer"
            >
              + Load Demo Patients
            </button>
          </div>
        )}
      </aside>

      {/* ==================================================
          RIGHT COLUMN: SINGLE COHESIVE PATIENT CARD (8 Cols)
      ================================================== */}
      <section className="lg:col-span-8">
        {!selectedPatient ? (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center space-y-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <Users className="w-6 h-6 text-[var(--text-tertiary)] mx-auto" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Select a patient</p>
          </div>
        ) : (
          <BlurFade
            key={selectedPatient.id}
            duration={0.18}
            offset={4}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden"
          >
            {/* 1. Patient Identity & Actions */}
            <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight leading-[1.2]">
                      {selectedPatient.name}
                    </h2>
                    <span className="text-xs font-medium text-[var(--text-secondary)] tabular-nums">
                      {selectedPatient.age}Y · {selectedPatient.gender}
                    </span>
                    <span className="font-mono text-xs font-semibold text-[var(--accent-primary)] tabular-nums">
                      {selectedPatient.opdTokenNumber}
                    </span>
                    {selectedPatient.priority === 'emergency' && (
                      <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--danger)]">
                        Urgent
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono tabular-nums flex-wrap">
                    <span>{selectedPatient.uhid}</span>
                    <span className="text-[var(--border-default)]" aria-hidden="true">·</span>
                    <span>{formatIndianPhone(selectedPatient.contact)}</span>
                    <span className="text-[var(--border-default)]" aria-hidden="true">·</span>
                    <span>{selectedPatient.registrationTime}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenSlip(selectedPatient)}
                    className="h-10 sm:h-9 px-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] text-xs font-semibold rounded-lg border border-[var(--border-default)] transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    <span>Print Pass</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPatientView(selectedPatient.id)}
                    className="h-10 sm:h-9 px-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] text-xs font-semibold rounded-lg border border-[var(--border-default)] transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    <span>Patient View</span>
                  </button>
                </div>
              </div>

              <div
                className={`pt-2.5 border-t border-[var(--border-subtle)] ${
                  testsCount > 0
                    ? 'grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px] gap-3 items-center'
                    : ''
                }`}
              >
                <p className="text-xs text-[var(--text-secondary)] leading-[1.45]">
                  <span className="font-semibold text-[var(--text-primary)]">Complaint: </span>
                  {selectedPatient.chiefComplaint || selectedPatient.symptoms || 'OPD Consultation'}
                </p>

                {testsCount > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] font-medium text-[var(--text-secondary)]">
                      <span>Tests</span>
                      <span className="font-mono font-semibold text-[var(--text-primary)] tabular-nums">
                        {doneCount}/{testsCount}
                      </span>
                    </div>
                    <ProgressBar
                      value={doneCount}
                      max={testsCount}
                      variant={doneCount === testsCount ? 'success' : 'default'}
                    />
                  </div>
                )}
              </div>

              {/* Render 2-tab switcher strictly when reports exist (no empty duplicate pill bars) */}
              {hasReports && (
                <div className="bg-[var(--bg-surface-subtle)] p-1 rounded-xl border border-[var(--border-subtle)] inline-flex items-center gap-0.5">
                  <AnimatedBackground
                    value={activeViewKey}
                    onValueChange={val => {
                      if (val === 'reports') onChangeWorkspaceTab('reports');
                      else if (val === 'route') onChangeWorkspaceTab('route');
                    }}
                    className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xs"
                  >
                    <button
                      type="button"
                      data-id="reports"
                      className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors duration-150 ${
                        activeViewKey === 'reports'
                          ? 'text-[var(--accent-primary)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Reports ({patientReports.length})
                    </button>
                    <button
                      type="button"
                      data-id="route"
                      className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors duration-150 ${
                        activeViewKey === 'route'
                          ? 'text-[var(--accent-primary)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Tests ({doneCount}/{testsCount})
                    </button>
                  </AnimatedBackground>
                </div>
              )}
            </div>

            {/* 2. Streamlined Body: Reports OR Unified Tests + Always-Ready Consultation Notes */}
            <div className="p-4 sm:p-5 space-y-4">
              {activeViewKey === 'reports' ? (
                <div className="space-y-4">
                  {patientReports.map(rep => (
                    <div key={rep.id} className="rounded-xl border border-[var(--border-default)] overflow-hidden">
                      <div className="px-4 py-2.5 bg-[var(--bg-surface-subtle)] border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {rep.testName}
                        </span>
                        <span className="text-[var(--text-secondary)] font-mono text-[11px] tabular-nums shrink-0 whitespace-nowrap">
                          {rep.timestamp} · {rep.roomNo}
                        </span>
                      </div>

                      {/* Mobile Parameter Rows (< 640px) */}
                      <div className="sm:hidden divide-y divide-[var(--border-subtle)] bg-[var(--bg-surface)]">
                        {rep.metrics.map((m, mIdx) => {
                          const flagTone =
                            m.flag === 'normal'
                              ? 'text-[var(--status-success)]'
                              : m.flag === 'critical'
                                ? 'text-[var(--danger)]'
                                : m.flag === 'high'
                                  ? 'text-[var(--status-warning)]'
                                  : 'text-[var(--accent-primary)]';

                          return (
                            <div key={mIdx} className="px-4 py-2.5 space-y-0.5 text-xs">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="font-semibold text-[var(--text-primary)]">
                                  {m.label}
                                </span>
                                <span className="font-mono font-bold text-[var(--text-primary)] tabular-nums shrink-0">
                                  {m.value} {m.unit}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2 text-[11px]">
                                <span className="font-mono text-[var(--text-tertiary)] tabular-nums">
                                  Ref: {m.normalRange}
                                </span>
                                <span className={`font-semibold shrink-0 ${flagTone}`}>
                                  {m.flag.charAt(0).toUpperCase() + m.flag.slice(1)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop / Tablet Table (>= 640px) */}
                      <div className="hidden sm:block overflow-x-auto bg-[var(--bg-surface)]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="border-b border-[var(--border-subtle)] text-[10.5px] uppercase font-semibold text-[var(--text-secondary)]">
                            <tr>
                              <th className="py-2.5 px-4">Parameter</th>
                              <th className="py-2.5 px-4">Result</th>
                              <th className="py-2.5 px-4">Ref. Range</th>
                              <th className="py-2.5 px-4 text-right">Flag</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-subtle)]">
                            {rep.metrics.map((m, mIdx) => {
                              const isAbnormal = m.flag !== 'normal';
                              const flagClass =
                                m.flag === 'normal'
                                  ? 'text-[var(--status-success)] font-medium'
                                  : m.flag === 'critical'
                                    ? 'px-2 py-0.5 rounded-md bg-[var(--danger-bg)] text-[var(--danger)] font-bold'
                                    : m.flag === 'high'
                                      ? 'px-2 py-0.5 rounded-md bg-[var(--status-warning-bg)] text-[var(--status-warning)] font-semibold'
                                      : 'px-2 py-0.5 rounded-md bg-[var(--bg-surface-subtle)] text-[var(--accent-primary)] font-semibold';

                              return (
                                <tr key={mIdx}>
                                  <td className="py-2.5 px-4 font-semibold text-[var(--text-primary)]">{m.label}</td>
                                  <td className="py-2.5 px-4 font-mono font-bold text-[var(--text-primary)] tabular-nums">
                                    {m.value} {m.unit}
                                  </td>
                                  <td className="py-2.5 px-4 text-[var(--text-secondary)] font-mono text-[11px] tabular-nums">
                                    {m.normalRange}
                                  </td>
                                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                    <span className={`text-[11px] ${isAbnormal ? 'inline-block' : ''} ${flagClass}`}>
                                      {m.flag.charAt(0).toUpperCase() + m.flag.slice(1)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : testsCount === 0 ? (
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    No tests ordered
                  </span>
                  <button
                    type="button"
                    onClick={() => onEditTests(selectedPatient)}
                    className="h-10 sm:h-9 px-3.5 border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] text-[var(--accent-primary)] text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors duration-150 cursor-pointer"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Order Tests</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      Ordered Tests ({doneCount}/{testsCount})
                    </span>
                    <button
                      type="button"
                      onClick={() => onEditTests(selectedPatient)}
                      className="text-xs font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer"
                    >
                      + Edit Tests
                    </button>
                  </div>

                  {/* Full-bleed hairline rows (zero card-in-card nesting) */}
                  <div className="-mx-4 sm:-mx-5 border-t border-b border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                    {selectedPatient.prescribedTests.map((tId, idx) => {
                      const test = tests.find(t => t.id === tId);
                      const dept = departments.find(d => d.id === test?.departmentId);
                      const isDone = selectedPatient.completedTests.includes(tId);
                      const isNext = selectedPatient.currentLockedDestinationTestId === tId;
                      const tokenId = selectedPatient.activeTokenIds[tId];
                      const tokenObj = queueTokens.find(t => t.id === tokenId);

                      const deptTokens = queueTokens.filter(
                        t =>
                          t.departmentId === dept?.id &&
                          (t.status === 'waiting' || t.status === 'in_progress') &&
                          t.patientId !== selectedPatient.id
                      );
                      const aheadCount = deptTokens.length;
                      const avgDuration = test?.averageDurationMinutes || 8;
                      const waitMins = Math.max(3, aheadCount * avgDuration);

                      return (
                        <div
                          key={tId}
                          className={`px-4 sm:px-5 py-3 transition-colors duration-150 ${
                            isDone
                              ? 'bg-[var(--status-success-bg)]/35'
                              : isNext
                                ? 'bg-[var(--accent-subtle)]/40'
                                : 'bg-[var(--bg-surface)]'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-start gap-3 min-w-0">
                              <span
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 tabular-nums ${
                                  isDone
                                    ? 'bg-[var(--status-success)] text-white'
                                    : isNext
                                      ? 'bg-[var(--accent-primary)] text-white'
                                      : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]'
                                }`}
                              >
                                {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                              </span>

                              <div className="min-w-0 space-y-0.5">
                                <div className="font-semibold text-sm text-[var(--text-primary)] truncate">
                                  {test?.name}
                                </div>
                                <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 flex-wrap">
                                  <MapPin className="w-3 h-3 text-[var(--accent-primary)] shrink-0" />
                                  <span>{dept?.name}</span>
                                  <span>·</span>
                                  <span className="font-mono font-medium text-[var(--text-primary)]">
                                    {dept?.location.room}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1 shrink-0 pl-9 sm:pl-0">
                              {isDone ? (
                                <span className="text-xs font-semibold text-[var(--status-success)]">
                                  Completed
                                </span>
                              ) : isNext ? (
                                <>
                                  <span className="text-xs font-semibold text-[var(--accent-primary)] font-mono tabular-nums inline-flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                                    Now · {tokenObj?.tokenNumber || 'Active'}
                                  </span>
                                  <span className="text-[11px] text-[var(--text-secondary)] tabular-nums">
                                    {aheadCount === 0 ? 'At counter' : `${aheadCount} ahead · ~${waitMins}m`}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-xs font-medium text-[var(--text-secondary)] font-mono tabular-nums inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
                                    {tokenObj?.tokenNumber || 'Queued'}
                                  </span>
                                  <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums">
                                    {aheadCount > 0 ? `${aheadCount} ahead · ~${waitMins}m` : 'In line'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Consultation Notes & Complete — Always Accessible Without Tab Hunts */}
              <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5">
                <label
                  htmlFor="doctor-disposition-notes"
                  className="text-xs font-bold text-[var(--text-primary)] block"
                >
                  Consultation Notes
                </label>
                <textarea
                  id="doctor-disposition-notes"
                  rows={2}
                  value={doctorConclusionNotes}
                  onChange={e => onChangeConclusionNotes(e.target.value)}
                  placeholder="Diagnosis, medicines & follow-up advice..."
                  className="w-full p-3 text-base sm:text-xs rounded-xl border border-[var(--border-input)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onVerifyAndDischarge(selectedPatient.id, doctorConclusionNotes)}
                    className="h-11 sm:h-10 px-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-semibold rounded-xl transition-colors duration-150 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>{activeViewKey === 'reports' ? 'Verify & Complete' : 'Complete Consultation'}</span>
                  </button>
                </div>
              </div>
            </div>
          </BlurFade>
        )}
      </section>
    </div>
  );
};
