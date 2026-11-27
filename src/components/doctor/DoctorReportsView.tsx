/* Source: D:\LetsCode\UI_COMPONENTS (magicui MagicCard & BorderBeam, motion-primitives Spotlight & AnimatedGroup, originui Input/Textarea/Callout MIT) — adapted to Q-Care tokens */
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Download,
  FileCheck,
  FileText,
  Printer,
  Search,
  X
} from 'lucide-react';
import {
  DoctorReportPatientEntry,
  ReportTierFilter,
  filterReportPatients
} from '../../engine/doctorReportsHelper';
import type { MedicationItem } from '../../types';
import { PrescriptionComposer } from './PrescriptionComposer';
import { AnimatedGroup } from '../ui/animated-group';
import { ClinicalCallout } from '../ui/clinical-callout';
import { LabRangeMeter, MetricStatusIndicator } from '../ui/clinical-status';
import { Input } from '../ui/input';
import { MagicCard } from '../ui/magic-card';
import { Spotlight } from '../ui/spotlight';
import { Textarea } from '../ui/textarea';

interface DoctorReportsViewProps {
  entries: DoctorReportPatientEntry[];
  hospitalName: string;
  selectedPatientId: string | null;
  onSelectPatientId: (id: string) => void;
  onVerifySingleReport: (reportId: string, notes?: string) => void;
  onVerifyAndDischarge: (patientId: string, notes: string, medications?: MedicationItem[]) => void;
  onSwitchToWalkin: () => void;
}

function formatClinicalTime(raw?: string): string {
  const clean = (raw || '').trim();
  if (!clean) return '—';
  return clean.replace(/\b(am|pm)\b/gi, m => m.toUpperCase());
}

function formatCompactComplaint(raw?: string): string {
  const clean = (raw || '').trim().replace(/\s+/g, ' ');
  if (!clean) return 'OPD consultation';
  const firstClause = clean.split(',')[0].trim();
  if (firstClause.length <= 26) return firstClause;
  const sliced = firstClause.slice(0, 26);
  const lastSpace = sliced.lastIndexOf(' ');
  const trimmed = lastSpace > 10 ? sliced.slice(0, lastSpace) : sliced;
  return `${trimmed.trim()}…`;
}

export const DoctorReportsView: React.FC<DoctorReportsViewProps> = ({
  entries,
  hospitalName,
  selectedPatientId,
  onSelectPatientId,
  onVerifySingleReport,
  onVerifyAndDischarge,
  onSwitchToWalkin
}) => {
  const [tierFilter, setTierFilter] = useState<ReportTierFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [doctorNotesInput, setDoctorNotesInput] = useState('');
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [isSubmittingSignoff, setIsSubmittingSignoff] = useState(false);

  const filteredEntries = useMemo(
    () => filterReportPatients(entries, tierFilter, searchQuery),
    [entries, tierFilter, searchQuery]
  );

  const selectedEntry = useMemo(() => {
    if (selectedPatientId) {
      const exact = filteredEntries.find(e => e.patientId === selectedPatientId);
      if (exact) return exact;
      const inAll = entries.find(e => e.patientId === selectedPatientId);
      if (inAll && tierFilter === 'all' && !searchQuery.trim()) return inAll;
    }
    return filteredEntries[0] || null;
  }, [filteredEntries, entries, selectedPatientId, tierFilter, searchQuery]);

  useEffect(() => {
    setDoctorNotesInput(selectedEntry?.patientNotes || '');
    setMedications([]);
    setIsSubmittingSignoff(false);
  }, [selectedEntry?.patientId]);

  const newCount = entries.filter(e => e.tier === 'new_incoming').length;
  const recentCount = entries.filter(e => e.isLivePatient).length;
  const pastCount = entries.filter(e => e.tier === 'past_archived').length;

  const filterTabs: Array<{ id: ReportTierFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: entries.length },
    { id: 'new_reports', label: 'New', count: newCount },
    { id: 'recent', label: 'Today', count: recentCount },
    { id: 'past', label: 'Past', count: pastCount }
  ];

  const handleSelectRow = (id: string) => {
    onSelectPatientId(id);
    setMobileDetailOpen(true);
  };

  const handleDownloadPatientReports = (entry: DoctorReportPatientEntry) => {
    if (entry.reports.length === 0) return;
    const text = entry.reports
      .map(
        r => `
======================================================================
${hospitalName.toUpperCase()} — CLINICAL DIAGNOSTIC REPORT
======================================================================
PATIENT        : ${entry.name} (${entry.age}Y / ${entry.gender})
UHID           : ${entry.uhid}
INVESTIGATION  : ${r.testName}
TIMESTAMP      : ${formatClinicalTime(r.timestamp)} | ROOM: ${r.roomNo}
STATUS         : ${r.status.toUpperCase()}

SUMMARY:
${r.summary}

PARAMETERS:
${r.metrics
  .map(
    m =>
      `- ${m.label.padEnd(32)}: ${m.value} ${m.unit.padEnd(8)} (Ref: ${m.normalRange}) [${m.flag.toUpperCase()}]`
  )
  .join('\n')}

DOCTOR IMPRESSION:
${r.doctorNotes || 'Pending verification'}
SIGNATORY: ${r.doctorSignature || entry.prescribedDoctorName}
======================================================================`
      )
      .join('\n\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.uhid}-${entry.name.toLowerCase().replace(/\s+/g, '-')}-reports.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const flaggedFindings = useMemo(() => {
    if (!selectedEntry) return [];
    return selectedEntry.reports.flatMap(rep =>
      rep.metrics
        .filter(m => m.flag !== 'normal')
        .map(m => ({
          testName: rep.testName,
          label: m.label,
          value: m.value,
          unit: m.unit,
          normalRange: m.normalRange,
          flag: m.flag
        }))
    );
  }, [selectedEntry]);

  const getListStatus = (entry: DoctorReportPatientEntry) => {
    if (entry.hasCriticalFlag) {
      return { text: 'Critical', tone: 'text-[#B91C1C]' };
    }
    if (entry.unreadCount > 0) {
      return { text: `${entry.unreadCount} new`, tone: 'text-[#087C80]' };
    }
    if (entry.pendingTests.length > 0 && entry.reports.length === 0) {
      return { text: `In lab (${entry.pendingTests.length})`, tone: 'text-[#0369A1]' };
    }
    if (entry.reports.length > 0) {
      return { text: `${entry.reports.length} verified`, tone: 'text-[#64748B]' };
    }
    return { text: 'Pending', tone: 'text-[#64748B]' };
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] leading-[1.2]">
          Patient Reports
        </h1>
        <span className="text-[13px] font-medium text-[#64748B] tabular-nums">
          {newCount > 0 ? `${newCount} awaiting verification` : `${entries.length} records`}
        </span>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================
            LEFT RAIL: DISTINCT PATIENT DIRECTORY (4 Cols)
        ============================================================ */}
        <aside
          className={`lg:col-span-4 min-w-0 lg:sticky lg:top-[84px] rounded-[10px] border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col ${
            mobileDetailOpen ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="px-4 sm:px-5 pt-4 pb-0 bg-[#F8FAFC] space-y-3 border-b border-[#E2E8F0]">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-[16px] font-semibold text-[#0F172A] leading-[1.3] tracking-[-0.01em]">
                Patients
              </h2>
              <span className="text-[12px] font-medium text-[#64748B] tabular-nums">
                {filteredEntries.length} of {entries.length}
              </span>
            </div>

            <div className="relative">
              <Search
                className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                strokeWidth={1.75}
              />
              <Input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search patient or token"
                aria-label="Search patient reports"
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear reports search"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[6px] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors duration-150 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              )}
            </div>

            {/* Underline Filter Strip — Plain Aligned Tabular Counts */}
            <div
              role="tablist"
              aria-label="Filter report patients"
              className="-mx-4 sm:-mx-5 px-2 sm:px-3 pt-1 grid grid-cols-4"
            >
              {filterTabs.map(tab => {
                const active = tierFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTierFilter(tab.id)}
                    className={`relative py-2.5 px-1 text-[12px] font-medium whitespace-nowrap transition-colors duration-150 inline-flex items-baseline justify-center gap-1 cursor-pointer ${
                      active ? 'text-[#087C80] font-semibold' : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[11px] tabular-nums ${
                        active ? 'text-[#087C80] font-semibold' : 'text-[#94A3B8]'
                      }`}
                    >
                      {tab.count}
                    </span>
                    {active && (
                      <motion.span
                        layoutId="reportsFilterUnderline"
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

          <div className="max-h-[420px] lg:max-h-[580px] overflow-y-auto overscroll-contain divide-y divide-[#E2E8F0]">
            {filteredEntries.length === 0 ? (
              <div className="px-5 py-10 text-center space-y-3">
                <p className="text-[13px] font-medium text-[#64748B]">
                  No matching patient reports
                </p>
                <button
                  type="button"
                  onClick={onSwitchToWalkin}
                  className="h-9 px-3.5 rounded-[8px] qc-primary-cta text-white text-[12.5px] font-medium cursor-pointer"
                >
                  + Register Patient
                </button>
              </div>
            ) : (
              filteredEntries.map(entry => {
                const isSelected = selectedEntry?.patientId === entry.patientId;
                const status = getListStatus(entry);
                const subline = [
                  entry.age ? `${entry.age} yrs` : '',
                  entry.gender,
                  formatCompactComplaint(entry.chiefComplaint)
                ]
                  .filter(Boolean)
                  .join(' · ');

                return (
                  <button
                    key={entry.patientId}
                    type="button"
                    onClick={() => handleSelectRow(entry.patientId)}
                    aria-current={isSelected ? 'true' : undefined}
                    className={`w-full text-left px-4 sm:px-5 py-3.5 flex flex-col gap-1.5 border-l-[3px] transition-colors duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-[#F0FDFA]/70 border-l-[#087C80]'
                        : 'bg-white hover:bg-[#F8FAFC] border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold text-[#0F172A] truncate">
                        {entry.name}
                      </span>
                      <span className={`text-[12px] font-semibold tabular-nums shrink-0 ${status.tone}`}>
                        {status.text}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-[12px] text-[#64748B]">
                      <span className="truncate">{subline}</span>
                      <span className="shrink-0 tabular-nums">
                        {formatClinicalTime(entry.activityTimeLabel)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ============================================================
            RIGHT WORKSPACE: CONTRAST NAVY PATIENT HERO + SYSTEMATIC REPORT CARDS (8 Cols)
        ============================================================ */}
        <section
          className={`lg:col-span-8 min-w-0 ${
            mobileDetailOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          {!selectedEntry ? (
            <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-12 text-center space-y-2.5">
              <FileText className="w-7 h-7 text-[#64748B] mx-auto" strokeWidth={1.75} />
              <p className="text-[15px] font-semibold text-[#0F172A]">
                Select a patient to review reports
              </p>
            </div>
          ) : (
            <AnimatedGroup key={selectedEntry.patientId} preset="slide" staggerDelay={0.04} className="space-y-6 min-w-0">
              {/* Mobile Back Bar */}
              {mobileDetailOpen && (
                <div className="lg:hidden">
                  <button
                    type="button"
                    onClick={() => setMobileDetailOpen(false)}
                    className="h-9 px-3 rounded-[8px] border border-[#CBD5E1] bg-white text-[13px] font-medium text-[#087C80] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
                    <span>All patients</span>
                  </button>
                </div>
              )}

              {/* 1. DISTINCT DEEP NAVY PATIENT HERO + CLINICAL FOCUS CALLOUT */}
              <div className="rounded-[10px] border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
                <div className="relative bg-[#102A43] text-white px-4 sm:px-6 py-5">
                  <Spotlight size={260} />
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <h2 className="text-[21px] font-semibold text-white tracking-[-0.015em] leading-[1.2]">
                          {selectedEntry.name}
                        </h2>
                        {selectedEntry.opdTokenNumber && (
                          <span className="text-[12.5px] font-medium text-[#5EEAD4] tabular-nums">
                            {selectedEntry.opdTokenNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#CBD5E1] tabular-nums">
                        <span className="font-medium text-white/95">
                          {selectedEntry.age} yrs, {selectedEntry.gender}
                        </span>
                        <span>UHID: {selectedEntry.uhid}</span>
                        <span>{selectedEntry.contact}</span>
                      </div>
                    </div>

                    {selectedEntry.reports.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDownloadPatientReports(selectedEntry)}
                          className="h-9 px-3.5 bg-white/10 hover:bg-white/20 text-white text-[13px] font-medium rounded-[8px] border border-white/20 transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-white/80" strokeWidth={1.75} />
                          <span>Download</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => typeof window !== 'undefined' && window.print()}
                          className="h-9 px-3.5 bg-white/10 hover:bg-white/20 text-white text-[13px] font-medium rounded-[8px] border border-white/20 transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-white/80" strokeWidth={1.75} />
                          <span>Print</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 sm:px-6 py-4 bg-white space-y-3">
                  <div className="space-y-1">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
                      Chief complaint
                    </span>
                    <p className="text-[13.5px] font-medium text-[#0F172A] leading-[1.5]">
                      {selectedEntry.chiefComplaint}
                    </p>
                  </div>

                  {flaggedFindings.length > 0 ? (
                    <ClinicalCallout
                      tone={selectedEntry.hasCriticalFlag ? 'danger' : 'warning'}
                      title={`${flaggedFindings.length} flagged finding${flaggedFindings.length > 1 ? 's' : ''}`}
                    >
                      <div className="flex flex-wrap gap-x-5 gap-y-1.5 tabular-nums">
                        {flaggedFindings.map((item, idx) => (
                          <span key={idx}>
                            <strong className="font-semibold">{item.label}:</strong>{' '}
                            {item.value} {item.unit}{' '}
                            <span className="opacity-85">
                              ({item.flag === 'low' ? '↓ Low' : item.flag === 'high' ? '↑ High' : 'Critical'} · Ref {item.normalRange})
                            </span>
                          </span>
                        ))}
                      </div>
                    </ClinicalCallout>
                  ) : selectedEntry.reports.length > 0 ? (
                    <ClinicalCallout tone="success">
                      All measured parameters within normal reference range.
                    </ClinicalCallout>
                  ) : null}

                  {selectedEntry.pendingTests.length > 0 && (
                    <ClinicalCallout
                      tone="neutral"
                      title={`${selectedEntry.pendingTests.length} test${selectedEntry.pendingTests.length > 1 ? 's' : ''} in lab`}
                    >
                      {selectedEntry.pendingTests.map(p => `${p.testName} (${p.room})`).join(' · ')}
                    </ClinicalCallout>
                  )}
                </div>
              </div>

              {/* 2. INDIVIDUAL DIAGNOSTIC REPORT CARDS (FLUSH TABLE, ZERO CARD-IN-CARD NESTING) */}
              {selectedEntry.reports.length === 0 ? (
                <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-8 text-center">
                  <p className="text-[14px] font-medium text-[#0F172A]">
                    No diagnostic reports uploaded yet
                  </p>
                  <p className="mt-1 text-[12.5px] text-[#64748B]">
                    Results appear automatically once submitted by the lab.
                  </p>
                </div>
              ) : (
                selectedEntry.reports.map(rep => {
                  const isNewReport = rep.status === 'uploaded';
                  return (
                    <MagicCard key={rep.id} gradientSize={260}>
                      {/* Unified Slate Header Band */}
                      <div className="px-4 sm:px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-[15px] font-semibold text-[#0F172A] leading-snug">
                              {rep.testName}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${
                                rep.isCritical
                                  ? 'text-[#B91C1C]'
                                  : isNewReport
                                    ? 'text-[#087C80]'
                                    : 'text-[#64748B]'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  rep.isCritical
                                    ? 'bg-[#DC2626]'
                                    : isNewReport
                                      ? 'bg-[#087C80]'
                                      : 'bg-[#94A3B8]'
                                }`}
                                aria-hidden="true"
                              />
                              <span>
                                {rep.isCritical ? 'Critical' : isNewReport ? 'Pending review' : 'Verified'}
                              </span>
                            </span>
                          </div>
                          <p className="text-[12px] text-[#64748B] tabular-nums">
                            {formatClinicalTime(rep.timestamp)} · {rep.roomNo}
                          </p>
                        </div>

                        {selectedEntry.isLivePatient && isNewReport && (
                          <button
                            type="button"
                            onClick={() => onVerifySingleReport(rep.id, doctorNotesInput)}
                            className="h-8 px-3.5 rounded-[8px] border border-[#087C80] bg-white hover:bg-[#087C80] text-[#087C80] hover:text-white text-[12.5px] font-medium inline-flex items-center gap-1.5 transition-colors duration-150 cursor-pointer shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" strokeWidth={2} />
                            <span>Mark Verified</span>
                          </button>
                        )}
                      </div>

                      {/* Mobile Parameter Rows (< 640px) — Flush */}
                      <div className="sm:hidden divide-y divide-[#E2E8F0]">
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
                              <LabRangeMeter
                                value={m.value}
                                normalRange={m.normalRange}
                                flag={m.flag}
                              />
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

                      {/* Desktop / Tablet Data Table (>= 640px) — Flush Inside Card */}
                      {rep.metrics.length > 0 && (
                        <div className="hidden sm:block">
                          <table className="w-full table-fixed text-left border-collapse">
                            <thead className="bg-[#F8FAFC]/70 border-b border-[#E2E8F0] text-[12px] font-semibold text-[#475569]">
                              <tr>
                                <th scope="col" className="w-[36%] py-2.5 px-6">Parameter</th>
                                <th scope="col" className="w-[20%] py-2.5 px-3">Result</th>
                                <th scope="col" className="w-[28%] py-2.5 px-3">Reference</th>
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
                                      <div>{m.normalRange}</div>
                                      <LabRangeMeter
                                        value={m.value}
                                        normalRange={m.normalRange}
                                        flag={m.flag}
                                      />
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
                      )}

                      {rep.summary && (
                        <div className="px-4 sm:px-6 py-3.5 bg-[#F8FAFC]/60 border-t border-[#E2E8F0] text-[12.5px] text-[#475569] leading-relaxed">
                          {rep.summary}
                        </div>
                      )}

                      {rep.doctorNotes && (
                        <div className="px-4 sm:px-6 py-3 bg-[#ECFDF5]/60 border-t border-[#E2E8F0] text-[12px] text-[#065F46] flex flex-wrap items-center justify-between gap-2">
                          <span>
                            <strong>Impression:</strong> {rep.doctorNotes}
                          </span>
                          {rep.doctorSignature && (
                            <span className="font-medium">Signed: {rep.doctorSignature}</span>
                          )}
                        </div>
                      )}
                    </MagicCard>
                  );
                })
              )}

              {/* 3. DEDICATED CONSULTATION SIGN-OFF CARD */}
              {selectedEntry.isLivePatient &&
                selectedEntry.reports.length > 0 &&
                selectedEntry.doctorReviewStatus !== 'completed' && (
                  <MagicCard gradientSize={240}>
                    <div className="px-4 sm:px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between gap-3">
                      <label
                        htmlFor="reports-doctor-disposition"
                        className="text-[15px] font-semibold text-[#0F172A] leading-[1.3]"
                      >
                        Consultation impression
                      </label>
                      <span className="text-[12px] text-[#64748B]">
                        Diagnosis &amp; sign-off
                      </span>
                    </div>
                    <div className="p-4 sm:p-6 space-y-4">
                      <Textarea
                        id="reports-doctor-disposition"
                        rows={3}
                        value={doctorNotesInput}
                        onChange={e => setDoctorNotesInput(e.target.value)}
                        placeholder="Document diagnosis, treatment plan & follow-up advice..."
                      />
                      <PrescriptionComposer
                        key={selectedEntry.patientId}
                        medications={medications}
                        onChange={setMedications}
                        disabled={isSubmittingSignoff}
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={isSubmittingSignoff}
                          onClick={() => {
                            if (isSubmittingSignoff) return;
                            setIsSubmittingSignoff(true);
                            onVerifyAndDischarge(
                              selectedEntry.patientId,
                              doctorNotesInput,
                              medications
                            );
                            setMedications([]);
                            setTimeout(() => setIsSubmittingSignoff(false), 300);
                          }}
                          className="h-10 px-5 qc-primary-cta text-white text-[13px] font-medium rounded-[8px] cursor-pointer inline-flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FileCheck className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                          <span>Verify All & Complete</span>
                        </button>
                      </div>
                    </div>
                  </MagicCard>
                )}
            </AnimatedGroup>
          )}
        </section>
      </div>
    </div>
  );
};
