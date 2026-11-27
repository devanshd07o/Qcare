import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Clock,
  ExternalLink,
  FileCheck,
  FlaskConical,
  Plus,
  Printer,
  Search,
  Users,
  X
} from 'lucide-react';
import { ClinicalReport, Department, DiagnosticTest, MedicationItem, Patient, QueueToken } from '../../types';
import { getReadableTestName } from './DoctorDashboardCharts';
import { PrescriptionComposer } from './PrescriptionComposer';
import { AnimatedGroup } from '../ui/animated-group';
import { MetricStatusIndicator } from '../ui/clinical-status';
import { Input } from '../ui/input';
import { MagicCard } from '../ui/magic-card';
import { ProgressBar } from '../ui/progress-bar';
import { Spotlight } from '../ui/spotlight';
import { Textarea } from '../ui/textarea';

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
  onVerifyAndDischarge: (patientId: string, notes: string, medications?: MedicationItem[]) => void;
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

function formatClinicalTime(raw?: string): string {
  const clean = (raw || '').trim();
  if (!clean) return '—';
  return clean.replace(/\b(am|pm)\b/gi, match => match.toUpperCase());
}

function formatCompactComplaint(raw?: string): string {
  const clean = (raw || '').trim().replace(/\s+/g, ' ');
  if (!clean) return 'OPD consultation';
  const firstClause = clean.split(',')[0].trim();
  return firstClause.length > 34 ? `${firstClause.slice(0, 33).trim()}…` : firstClause;
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
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [isSubmittingSignoff, setIsSubmittingSignoff] = useState(false);

  useEffect(() => {
    setMedications([]);
    setIsSubmittingSignoff(false);
  }, [selectedPatient?.id, selectedPatient?.doctorReviewStatus]);

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

  const getQueueStatusDisplay = (patient: Patient) => {
    switch (patient.doctorReviewStatus) {
      case 'awaiting_prescription':
        return {
          label: 'Waiting',
          dotClass: 'bg-[#D97706]',
          textClass: 'text-[#B45309]'
        };
      case 'awaiting_lab_reports':
        return {
          label: `Tests ${patient.completedTests.length}/${patient.prescribedTests.length}`,
          dotClass: 'bg-[#087C80]',
          textClass: 'text-[#087C80]'
        };
      case 'reports_ready':
        return {
          label: 'Reports ready',
          dotClass: 'bg-[#047857]',
          textClass: 'text-[#047857]'
        };
      default:
        return {
          label: 'Completed',
          dotClass: 'bg-[#94A3B8]',
          textClass: 'text-[#64748B]'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Clean Clinical Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] leading-[1.2]">
          OPD Queue
        </h1>

        <button
          type="button"
          onClick={onSwitchToWalkin}
          className="h-10 px-4 rounded-[8px] qc-primary-cta text-white text-[13px] font-medium inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          <span>Register Patient</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================================================
            LEFT RAIL: PATIENT QUEUE LIST (4 Cols)
        ================================================== */}
        <aside className="lg:col-span-4 min-w-0 lg:sticky lg:top-[84px] rounded-[10px] border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col">
          {/* Header + OriginUI Search Input */}
          <div className="px-4 sm:px-5 pt-4 pb-0 bg-[#F8FAFC] space-y-3 border-b border-[#E2E8F0]">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-[16px] font-semibold text-[#0F172A] leading-[1.3] tracking-[-0.01em]">
                Patients
              </h2>
              <span className="text-[12px] font-medium text-[#64748B] tabular-nums">
                {filteredPatients.length} of {patients.length}
              </span>
            </div>

            <div className="relative">
              <Search
                className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                strokeWidth={1.75}
              />
              <Input
                type="search"
                value={queueSearchQuery}
                onChange={e => onChangeQueueSearch(e.target.value)}
                placeholder="Search patient or token"
                aria-label="Search OPD queue"
                className="pl-9 pr-9"
              />
              {queueSearchQuery && (
                <button
                  type="button"
                  onClick={() => onChangeQueueSearch('')}
                  aria-label="Clear queue search"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[6px] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors duration-150 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              )}
            </div>

            {/* Underline Filter Strip — Equal 5-Column Plain Count Alignment */}
            <div
              role="tablist"
              aria-label="Filter OPD patients"
              className="-mx-4 sm:-mx-5 px-2 sm:px-3 pt-1 grid grid-cols-5"
            >
              {filterItems.map(tab => {
                const isActive = queueFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onChangeQueueFilter(tab.id)}
                    className={`relative py-2.5 px-1 text-[12px] font-medium whitespace-nowrap transition-colors duration-150 inline-flex items-baseline justify-center gap-1 cursor-pointer ${
                      isActive
                        ? 'text-[#087C80] font-semibold'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[11px] tabular-nums ${
                        isActive ? 'text-[#087C80] font-semibold' : 'text-[#94A3B8]'
                      }`}
                    >
                      {tab.count}
                    </span>
                    {isActive && (
                      <motion.span
                        layoutId="opdQueueFilterUnderline"
                        transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                        aria-hidden="true"
                        className="absolute inset-x-1.5 bottom-0 h-[2px] bg-[#087C80] rounded-t-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spacious 2-Line Patient List with Internal Scroll */}
          <div className="divide-y divide-[#E2E8F0] max-h-[380px] lg:max-h-[580px] overflow-y-auto overscroll-contain">
            {filteredPatients.length === 0 ? (
              <div className="px-5 py-10 text-center space-y-3">
                <p className="text-[13px] font-medium text-[#64748B]">
                  No patients in this filter
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={onSwitchToWalkin}
                    className="h-9 px-3.5 rounded-[8px] qc-primary-cta text-white text-[12.5px] font-medium cursor-pointer"
                  >
                    + Register Patient
                  </button>
                  <button
                    type="button"
                    onClick={onLoadDemoQueue}
                    className="h-9 px-3.5 rounded-[8px] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-[12.5px] font-medium cursor-pointer transition-colors duration-150"
                  >
                    Demo Patients
                  </button>
                </div>
              </div>
            ) : (
              filteredPatients.map(patient => {
                const isSelected = selectedPatient?.id === patient.id;
                const isEmergency = patient.priority === 'emergency';
                const status = getQueueStatusDisplay(patient);
                const subline = [
                  patient.age ? `${patient.age} yrs` : '',
                  patient.gender,
                  formatCompactComplaint(patient.chiefComplaint || patient.symptoms)
                ]
                  .filter(Boolean)
                  .join(' · ');

                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => onSelectPatient(patient.id)}
                    aria-current={isSelected ? 'true' : undefined}
                    className={`w-full text-left px-4 sm:px-5 py-3.5 flex flex-col gap-1.5 border-l-[3px] transition-colors duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-[#F0FDFA]/70 border-l-[#087C80]'
                        : 'bg-white hover:bg-[#F8FAFC] border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[14px] font-semibold text-[#0F172A] truncate">
                          {patient.name}
                        </span>
                        {isEmergency && (
                          <span className="text-[11px] font-semibold text-[#B91C1C] shrink-0">
                            Urgent
                          </span>
                        )}
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 text-[12px] font-medium tabular-nums shrink-0 ${status.textClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} aria-hidden="true" />
                        <span>{status.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-[12px] text-[#64748B]">
                      <span className="truncate">{subline}</span>
                      <span className="shrink-0 tabular-nums text-[#64748B]">
                        {formatClinicalTime(patient.registrationTime)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {patients.length < 3 && (
            <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-2">
              <span className="text-[12px] text-[#64748B]">Need sample queue?</span>
              <button
                type="button"
                onClick={onLoadDemoQueue}
                className="text-[12.5px] font-medium text-[#087C80] hover:underline cursor-pointer"
              >
                Load demo patients
              </button>
            </div>
          )}
        </aside>

        {/* ==================================================
            RIGHT WORKSPACE: CONTRAST NAVY HERO + SYSTEMATIC CARDS (8 Cols)
        ================================================== */}
        <section className="lg:col-span-8 min-w-0">
          {!selectedPatient ? (
            <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-12 text-center space-y-2.5">
              <Users className="w-7 h-7 text-[#64748B] mx-auto" strokeWidth={1.75} />
              <p className="text-[15px] font-semibold text-[#0F172A]">
                Select a patient from the queue
              </p>
              <p className="text-[13px] text-[#64748B]">
                Choose any OPD visit on the left to inspect investigations, reports, and consultation notes.
              </p>
            </div>
          ) : (
            <AnimatedGroup key={selectedPatient.id} preset="slide" staggerDelay={0.04} className="space-y-6 min-w-0">
              {/* CARD 1: DEEP NAVY PATIENT IDENTITY HERO */}
              <div className="rounded-[10px] border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
                <div className="relative bg-[#102A43] text-white px-4 sm:px-6 py-5">
                  <Spotlight size={260} />
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <h2 className="text-[21px] font-semibold text-white tracking-[-0.015em] leading-[1.2]">
                          {selectedPatient.name}
                        </h2>
                        {selectedPatient.opdTokenNumber && (
                          <span className="text-[12.5px] font-medium text-[#5EEAD4] tabular-nums">
                            {selectedPatient.opdTokenNumber}
                          </span>
                        )}
                        {selectedPatient.priority === 'emergency' && (
                          <span className="text-[12px] font-semibold text-[#FCA5A5]">
                            Urgent
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#CBD5E1] tabular-nums">
                        <span className="font-medium text-white/95">
                          {selectedPatient.age} yrs, {selectedPatient.gender}
                        </span>
                        <span>UHID: {selectedPatient.uhid}</span>
                        <span>{formatIndianPhone(selectedPatient.contact)}</span>
                        <span>{formatClinicalTime(selectedPatient.registrationTime)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenSlip(selectedPatient)}
                        className="h-9 px-3.5 bg-white/10 hover:bg-white/20 text-white text-[13px] font-medium rounded-[8px] border border-white/20 transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-white/80" strokeWidth={1.75} />
                        <span>Print Pass</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenPatientView(selectedPatient.id)}
                        className="h-9 px-3.5 bg-white/10 hover:bg-white/20 text-white text-[13px] font-medium rounded-[8px] border border-white/20 transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-white/80" strokeWidth={1.75} />
                        <span>Patient View</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Calm Complaint & Progress Strip */}
                <div
                  className={`px-4 sm:px-6 py-4 border-t border-[#E2E8F0] ${
                    testsCount > 0
                      ? 'grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-4 items-center'
                      : ''
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <span className="block text-[11px] font-medium uppercase tracking-[0.04em] text-[#64748B]">
                      Chief complaint
                    </span>
                    <p className="text-[13.5px] text-[#0F172A] leading-[1.5]">
                      {selectedPatient.chiefComplaint || selectedPatient.symptoms || 'OPD Consultation'}
                    </p>
                  </div>

                  {testsCount > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-[#64748B]">Progress</span>
                        <span className="font-semibold text-[#0F172A] tabular-nums">
                          {doneCount} of {testsCount}
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

                {hasReports && (
                  <div
                    role="tablist"
                    aria-label="Patient record sections"
                    className="px-4 sm:px-6 border-t border-[#E2E8F0] bg-white flex items-center gap-6"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeViewKey === 'reports'}
                      onClick={() => onChangeWorkspaceTab('reports')}
                      className={`relative py-3 text-[13px] font-medium transition-colors duration-150 cursor-pointer inline-flex items-baseline gap-1.5 ${
                        activeViewKey === 'reports'
                          ? 'text-[#087C80] font-semibold'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      <span>Lab reports</span>
                      <span
                        className={`text-[12px] tabular-nums ${
                          activeViewKey === 'reports' ? 'text-[#087C80] font-semibold' : 'text-[#64748B]'
                        }`}
                      >
                        {patientReports.length}
                      </span>
                      {activeViewKey === 'reports' && (
                        <motion.span
                          layoutId="opdWorkspaceTabUnderline"
                          transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-[2px] bg-[#087C80] rounded-t-full"
                        />
                      )}
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeViewKey === 'route'}
                      onClick={() => onChangeWorkspaceTab('route')}
                      className={`relative py-3 text-[13px] font-medium transition-colors duration-150 cursor-pointer inline-flex items-baseline gap-1.5 ${
                        activeViewKey === 'route'
                          ? 'text-[#087C80] font-semibold'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      <span>Diagnostic pathway</span>
                      <span
                        className={`text-[12px] tabular-nums ${
                          activeViewKey === 'route' ? 'text-[#087C80] font-semibold' : 'text-[#64748B]'
                        }`}
                      >
                        {doneCount}/{testsCount}
                      </span>
                      {activeViewKey === 'route' && (
                        <motion.span
                          layoutId="opdWorkspaceTabUnderline"
                          transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-[2px] bg-[#087C80] rounded-t-full"
                        />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* CARD 2: DIAGNOSTIC PATHWAY / LAB REPORTS (SYSTEMATIC FLUSH TABLE, ZERO NESTED BOXES) */}
              <MagicCard gradientSize={260}>
                {activeViewKey === 'reports' ? (
                  <>
                    <div className="px-4 sm:px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between gap-3">
                      <h3 className="text-[16px] font-semibold text-[#0F172A] leading-[1.3]">
                        Laboratory reports
                      </h3>
                      <span className="text-[12px] font-medium text-[#64748B] tabular-nums">
                        {patientReports.length} {patientReports.length === 1 ? 'report' : 'reports'}
                      </span>
                    </div>

                    <div className="divide-y divide-[#E2E8F0]">
                      {patientReports.map(rep => (
                        <div key={rep.id}>
                          <div className="px-4 sm:px-6 py-3 bg-[#F8FAFC]/60 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[13.5px] font-semibold text-[#0F172A]">
                              {rep.testName}
                            </span>
                            <span className="text-[12px] text-[#64748B] tabular-nums shrink-0">
                              {formatClinicalTime(rep.timestamp)} · {rep.roomNo}
                            </span>
                          </div>

                          {/* Mobile Parameter Rows (< 640px) — Zero Pills */}
                          <div className="sm:hidden divide-y divide-[#E2E8F0] bg-white">
                            {rep.metrics.map((m, mIdx) => {
                              const rowHighlight =
                                m.flag === 'critical'
                                  ? 'bg-[#FEF2F2]/75'
                                  : m.flag !== 'normal'
                                    ? 'bg-[#FFFBEB]/75'
                                    : 'bg-white';

                              return (
                                <div key={mIdx} className={`px-4 py-3.5 space-y-1.5 ${rowHighlight}`}>
                                  <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-[13px] font-medium text-[#0F172A]">
                                      {m.label}
                                    </span>
                                    <span className="text-[13px] font-semibold text-[#0F172A] tabular-nums shrink-0">
                                      {m.value} {m.unit}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[12px] text-[#64748B] tabular-nums">
                                      Ref: {m.normalRange}
                                    </span>
                                    <MetricStatusIndicator flag={m.flag} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Desktop / Tablet Parameter Table (>= 640px) — Flush */}
                          <div className="hidden sm:block bg-white">
                            <table className="w-full table-fixed text-left border-collapse">
                              <thead className="bg-[#F8FAFC]/70 border-b border-[#E2E8F0] text-[12px] font-semibold text-[#475569]">
                                <tr>
                                  <th scope="col" className="w-[38%] py-2.5 px-6">Parameter</th>
                                  <th scope="col" className="w-[22%] py-2.5 px-3">Result</th>
                                  <th scope="col" className="w-[24%] py-2.5 px-3">Reference</th>
                                  <th scope="col" className="w-[16%] py-2.5 px-6 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E2E8F0]">
                                {rep.metrics.map((m, mIdx) => {
                                  const rowHighlight =
                                    m.flag === 'critical'
                                      ? 'bg-[#FEF2F2]/75'
                                      : m.flag !== 'normal'
                                        ? 'bg-[#FFFBEB]/75'
                                        : 'bg-white';

                                  return (
                                    <tr key={mIdx} className={rowHighlight}>
                                      <td className="py-3.5 px-6 text-[13px] font-medium text-[#0F172A] truncate">
                                        {m.label}
                                      </td>
                                      <td className="py-3.5 px-3 text-[13px] font-semibold text-[#0F172A] tabular-nums">
                                        {m.value} {m.unit}
                                      </td>
                                      <td className="py-3.5 px-3 text-[12.5px] text-[#64748B] tabular-nums">
                                        {m.normalRange}
                                      </td>
                                      <td className="py-3.5 px-6 text-right">
                                        <MetricStatusIndicator flag={m.flag} />
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
                  </>
                ) : (
                  <>
                    <div className="px-4 sm:px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-baseline gap-2.5 min-w-0">
                        <h3 className="text-[16px] font-semibold text-[#0F172A] leading-[1.3]">
                          Diagnostic pathway
                        </h3>
                        {testsCount > 0 && (
                          <span className="text-[12.5px] font-medium text-[#64748B] tabular-nums whitespace-nowrap">
                            {doneCount} of {testsCount} completed
                          </span>
                        )}
                      </div>

                      {testsCount > 0 && (
                        <button
                          type="button"
                          onClick={() => onEditTests(selectedPatient)}
                          className="h-8 px-3 rounded-[8px] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1] text-[12.5px] font-medium text-[#087C80] transition-colors duration-150 cursor-pointer shrink-0 whitespace-nowrap"
                        >
                          + Edit tests
                        </button>
                      )}
                    </div>

                    {testsCount === 0 ? (
                      <div className="px-4 sm:px-6 py-5 flex items-center justify-between gap-3">
                        <span className="text-[13px] text-[#64748B]">
                          No diagnostic tests ordered
                        </span>
                        <button
                          type="button"
                          onClick={() => onEditTests(selectedPatient)}
                          className="h-9 px-3.5 border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#087C80] text-[13px] font-medium rounded-[8px] inline-flex items-center gap-1.5 transition-colors duration-150 cursor-pointer shrink-0"
                        >
                          <FlaskConical className="w-4 h-4" strokeWidth={1.75} />
                          <span>Order Tests</span>
                        </button>
                      </div>
                    ) : (
                      <div>
                        {/* Aligned Desktop Column Header */}
                        <div className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_120px_172px] gap-4 px-6 py-2.5 bg-[#F8FAFC]/70 border-b border-[#E2E8F0] text-[12px] font-semibold text-[#475569]">
                          <span>Test &amp; department</span>
                          <span>Room</span>
                          <span className="text-right">Token &amp; queue</span>
                        </div>

                        <div className="divide-y divide-[#E2E8F0]">
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
                              <motion.div
                                key={tId}
                                data-slot="timeline-item"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.18, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                                className={`px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_120px_172px] gap-3 sm:gap-4 items-center border-l-[3px] transition-colors duration-150 ${
                                  isNext
                                    ? 'bg-[#F8FAFC]/85 border-l-[#087C80]'
                                    : 'bg-white border-l-transparent hover:bg-[#F8FAFC]/60'
                                }`}
                              >
                                {/* Col 1: Step Badge + Investigation + Lab */}
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <span
                                    aria-hidden="true"
                                    className={`flex size-6 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums shrink-0 ${
                                      isDone
                                        ? 'bg-[#047857] text-white'
                                        : isNext
                                          ? 'bg-[#087C80] text-white'
                                          : 'border border-[#CBD5E1] bg-white text-[#64748B]'
                                    }`}
                                  >
                                    {isDone ? <Check className="w-3.5 h-3.5" strokeWidth={2.25} /> : idx + 1}
                                  </span>

                                  <div className="min-w-0 space-y-0.5">
                                    <div className="text-[14px] font-medium text-[#0F172A] leading-snug truncate">
                                      {getReadableTestName(tId, test?.name)}
                                    </div>
                                    <div className="text-[12.5px] text-[#64748B] truncate">
                                      {dept?.name}
                                    </div>
                                  </div>
                                </div>

                                {/* Col 2: Fixed-Width Room Column (Zero Nested Boxes) */}
                                <div className="pl-9 sm:pl-0 text-[13px] font-medium text-[#334155] tabular-nums whitespace-nowrap">
                                  {dept?.location.room || '—'}
                                </div>

                                {/* Col 3: Fixed-Width Right-Aligned Token & ETA Column */}
                                <div className="pl-9 sm:pl-0 flex flex-wrap sm:flex-nowrap sm:flex-col sm:items-end justify-between gap-x-3 gap-y-0.5 tabular-nums">
                                  {isDone ? (
                                    <>
                                      <span className="text-[12.5px] font-semibold text-[#047857] whitespace-nowrap">
                                        Completed
                                      </span>
                                      <span className="text-[12px] text-[#64748B] whitespace-nowrap">
                                        Report uploaded
                                      </span>
                                    </>
                                  ) : isNext ? (
                                    <>
                                      <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-[#087C80] whitespace-nowrap">
                                        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#087C80] opacity-75" />
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#087C80]" />
                                        </span>
                                        <span>Active · {tokenObj?.tokenNumber || 'Bay ready'}</span>
                                      </span>
                                      <span className="text-[12px] text-[#64748B] whitespace-nowrap">
                                        {aheadCount === 0
                                          ? 'At diagnostic counter'
                                          : `${aheadCount} ahead · ~${waitMins} min`}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#334155] whitespace-nowrap">
                                        <Clock className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={1.75} />
                                        <span>{tokenObj?.tokenNumber || 'Queued'}</span>
                                      </span>
                                      <span className="text-[12px] text-[#64748B] whitespace-nowrap">
                                        {aheadCount > 0 ? `${aheadCount} ahead · ~${waitMins} min` : 'Waiting in line'}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </MagicCard>

              {/* CARD 3: DEDICATED CONSULTATION NOTES & SIGN-OFF CARD */}
              <MagicCard gradientSize={240}>
                <div className="px-4 sm:px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between gap-3">
                  <label
                    htmlFor="doctor-disposition-notes"
                    className="text-[16px] font-semibold text-[#0F172A] leading-[1.3]"
                  >
                    Consultation notes
                  </label>
                  <span className="text-[12px] text-[#64748B]">
                    Diagnosis &amp; sign-off
                  </span>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                  <Textarea
                    id="doctor-disposition-notes"
                    rows={3}
                    value={doctorConclusionNotes}
                    onChange={e => onChangeConclusionNotes(e.target.value)}
                    placeholder="Diagnosis, prescription & follow-up advice..."
                  />

                  <PrescriptionComposer
                    key={selectedPatient.id}
                    medications={medications}
                    onChange={setMedications}
                    disabled={isSubmittingSignoff || selectedPatient.doctorReviewStatus === 'completed'}
                  />

                  <div className="flex justify-end">
                    <motion.button
                      type="button"
                      disabled={isSubmittingSignoff || selectedPatient.doctorReviewStatus === 'completed'}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => {
                        if (isSubmittingSignoff || selectedPatient.doctorReviewStatus === 'completed') return;
                        setIsSubmittingSignoff(true);
                        onVerifyAndDischarge(selectedPatient.id, doctorConclusionNotes, medications);
                        setMedications([]);
                        setTimeout(() => setIsSubmittingSignoff(false), 300);
                      }}
                      className="h-10 px-5 qc-primary-cta text-white text-[13px] font-medium rounded-[8px] cursor-pointer inline-flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileCheck className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      <span>
                        {selectedPatient.doctorReviewStatus === 'completed'
                          ? 'Consultation Completed'
                          : activeViewKey === 'reports'
                            ? 'Verify & Complete'
                            : 'Complete Consultation'}
                      </span>
                    </motion.button>
                  </div>
                </div>
              </MagicCard>
            </AnimatedGroup>
          )}
        </section>
      </div>
    </div>
  );
};
