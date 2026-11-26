/* Source: D:\LetsCode\UI_COMPONENTS (motion-primitives, tremor, originui MIT/Apache-2.0) — adapted to QCare Hue semantic tokens */
import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck,
  FileText,
  FlaskConical,
  Printer,
  Search,
  ShieldCheck,
  User,
  X
} from 'lucide-react';
import {
  DoctorReportPatientEntry,
  ReportTierFilter,
  filterReportPatients
} from '../../engine/doctorReportsHelper';
import { AnimatedBackground } from '../ui/animated-background';
import { Badge } from '../ui/badge';
import { BlurFade } from '../ui/blur-fade';
import { NumberTicker } from '../ui/number-ticker';

interface DoctorReportsViewProps {
  entries: DoctorReportPatientEntry[];
  hospitalName: string;
  selectedPatientId: string | null;
  onSelectPatientId: (id: string) => void;
  onVerifySingleReport: (reportId: string, notes?: string) => void;
  onVerifyAndDischarge: (patientId: string, notes: string) => void;
  onSwitchToWalkin: () => void;
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

  const filteredEntries = useMemo(
    () => filterReportPatients(entries, tierFilter, searchQuery),
    [entries, tierFilter, searchQuery]
  );

  // Resolve selected entry cleanly from filtered list or fallback to first available
  const selectedEntry = useMemo(() => {
    if (selectedPatientId) {
      const exact = filteredEntries.find(e => e.patientId === selectedPatientId);
      if (exact) return exact;
      const inAll = entries.find(e => e.patientId === selectedPatientId);
      if (inAll && tierFilter === 'all' && !searchQuery.trim()) return inAll;
    }
    return filteredEntries[0] || null;
  }, [filteredEntries, entries, selectedPatientId, tierFilter, searchQuery]);

  // Reset draft notes when patient selection changes
  useEffect(() => {
    setDoctorNotesInput(selectedEntry?.patientNotes || '');
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
INVESTIGATION  : ${r.testName}${r.technicalName ? ` (${r.technicalName})` : ''}
TIMESTAMP      : ${r.timestamp} | ROOM: ${r.roomNo}
TECHNICIAN     : ${r.technicianName}
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

    const blob = new Blob([text.trim()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entry.uhid}_Reports.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tierHeadingFor = (
    entry: DoctorReportPatientEntry,
    prevEntry: DoctorReportPatientEntry | undefined
  ): string | null => {
    if (tierFilter !== 'all') return null;
    if (!prevEntry || prevEntry.tier !== entry.tier) {
      if (entry.tier === 'new_incoming') return 'New Lab Reports (Just Generated)';
      if (entry.tier === 'recent_today') return "Today's OPD Patients (Recent)";
      return 'Older Archived Patients';
    }
    return null;
  };

  return (
    <BlurFade duration={0.2} offset={4}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ============================================================
            LEFT COLUMN: HIERARCHICAL PATIENT ROSTER (4 Cols)
        ============================================================ */}
        <aside
          className={`lg:col-span-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs overflow-hidden flex flex-col ${
            mobileDetailOpen ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                  Patient Reports
                </h2>
                {newCount > 0 && (
                  <span className="font-mono text-[11px] font-semibold text-[var(--status-success)] tabular-nums">
                    {newCount} new
                  </span>
                )}
              </div>
              <span className="font-mono text-xs text-[var(--text-secondary)] tabular-nums">
                <NumberTicker value={filteredEntries.length} /> / {entries.length}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search patient, UHID, token..."
                aria-label="Search patient reports"
                className="w-full h-10 pl-9 pr-8 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)]/60 focus:bg-white text-base sm:text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--focus-ring)] transition-[border-color,box-shadow,background-color] duration-150"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear reports search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Hierarchical Tier Filter */}
            <div className="bg-[var(--bg-surface-subtle)] p-1 rounded-xl border border-[var(--border-subtle)] grid grid-cols-4 gap-0.5">
              <AnimatedBackground
                value={tierFilter}
                onValueChange={val => {
                  if (val) setTierFilter(val as ReportTierFilter);
                }}
                className="rounded-lg bg-white border border-[var(--border-subtle)] shadow-2xs"
              >
                {filterTabs.map(tab => {
                  const active = tierFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      data-id={tab.id}
                      className={`min-h-[36px] px-1.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors duration-150 ${
                        active
                          ? 'text-[var(--accent-primary)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`font-mono text-[10px] tabular-nums ${
                          active ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-tertiary)]'
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

          {/* Patient Directory List (Newest / Just-Sent on Top -> Past Archived Below) */}
          <div className="max-h-[580px] overflow-y-auto dp-scroll divide-y divide-[var(--border-subtle)]">
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <FileText className="w-7 h-7 text-[var(--text-tertiary)] mx-auto" />
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    No matching patient reports
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Try another filter or register a walk-in patient.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onSwitchToWalkin}
                  className="h-9 px-3 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold cursor-pointer"
                >
                  + New Walk-in
                </button>
              </div>
            ) : (
              filteredEntries.map((entry, idx) => {
                const isSelected = selectedEntry?.patientId === entry.patientId;
                const sectionHeading = tierHeadingFor(entry, filteredEntries[idx - 1]);

                return (
                  <React.Fragment key={entry.patientId}>
                    {sectionHeading && (
                      <div className="px-4 py-1.5 bg-[var(--bg-surface-subtle)] border-y border-[var(--border-subtle)] first:border-t-0 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center justify-between">
                        <span>{sectionHeading}</span>
                        {entry.tier === 'new_incoming' && (
                          <span className="inline-flex items-center gap-1 text-[var(--status-success)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)]" />
                            Live
                          </span>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSelectRow(entry.patientId)}
                      className={`w-full text-left px-4 py-3.5 flex flex-col gap-1.5 cursor-pointer border-l-[3px] transition-[background-color,border-color] duration-150 ${
                        isSelected
                          ? 'bg-[var(--accent-subtle)]/65 border-l-[var(--accent-primary)]'
                          : 'bg-white hover:bg-[var(--bg-surface-hover)] border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-semibold text-[13px] text-[var(--text-primary)] truncate">
                            {entry.name}
                          </span>
                          {entry.hasCriticalFlag && (
                            <Badge variant="error">Critical</Badge>
                          )}
                        </div>
                        <span className="font-mono text-[11px] font-medium text-[var(--text-tertiary)] shrink-0 tabular-nums">
                          {entry.opdTokenNumber || entry.uhid}
                        </span>
                      </div>

                      <p className="text-[11.5px] text-[var(--text-secondary)] truncate">
                        {entry.age}Y · {entry.gender === 'Male' ? 'M' : entry.gender === 'Female' ? 'F' : 'O'} · {entry.chiefComplaint}
                      </p>

                      <div className="flex items-center justify-between text-[11px] pt-0.5 gap-2">
                        {entry.unreadCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--status-success)] tabular-nums">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)]" />
                            <span>
                              {entry.unreadCount} new report{entry.unreadCount > 1 ? 's' : ''}
                            </span>
                          </span>
                        ) : entry.pendingTests.length > 0 && entry.reports.length === 0 ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-[var(--accent-primary)] tabular-nums">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary-bright)]" />
                            <span>Awaiting lab ({entry.pendingTests.length})</span>
                          </span>
                        ) : entry.isLivePatient ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-[var(--text-secondary)] tabular-nums">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>
                              {entry.reports.length} verified today
                            </span>
                          </span>
                        ) : (
                          <span className="text-[var(--text-tertiary)] tabular-nums">
                            Past · {entry.reports.length} report{entry.reports.length > 1 ? 's' : ''}
                          </span>
                        )}

                        <span className="font-mono text-[10.5px] text-[var(--text-tertiary)] tabular-nums shrink-0">
                          {entry.activityTimeLabel}
                        </span>
                      </div>
                    </button>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </aside>

        {/* ============================================================
            RIGHT COLUMN: SELECTED PATIENT'S REPORTS VIEWER (8 Cols)
        ============================================================ */}
        <section
          className={`lg:col-span-8 ${
            mobileDetailOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          {!selectedEntry ? (
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-10 text-center space-y-3 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent-primary)] flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-[var(--text-primary)]">
                Select a patient to view reports
              </p>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                Recent and newly generated lab reports appear at the top; older archived visits remain below.
              </p>
            </div>
          ) : (
            <BlurFade
              key={selectedEntry.patientId}
              duration={0.2}
              offset={4}
              className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs overflow-hidden"
            >
              {/* Mobile Back Button */}
              <div className="lg:hidden px-4 pt-3 pb-1 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/50">
                <button
                  type="button"
                  onClick={() => setMobileDetailOpen(false)}
                  className="h-10 px-2 text-xs font-semibold text-[var(--accent-primary)] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Patient List</span>
                </button>
              </div>

              {/* Patient Clinical Identity Header */}
              <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] flex items-center justify-center shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight leading-[1.2]">
                          {selectedEntry.name}
                        </h2>
                        <span className="text-xs font-medium text-[var(--text-secondary)] tabular-nums">
                          {selectedEntry.age}Y · {selectedEntry.gender}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono tabular-nums flex-wrap">
                        <span>{selectedEntry.uhid}</span>
                        <span aria-hidden="true">·</span>
                        <span>{selectedEntry.contact}</span>
                        <span aria-hidden="true">·</span>
                        <span>{selectedEntry.prescribedDoctorName} ({selectedEntry.prescribedDoctorRoom})</span>
                      </div>
                    </div>
                  </div>

                  {selectedEntry.reports.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadPatientReports(selectedEntry)}
                        className="h-9 px-3 bg-white hover:bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] text-xs font-semibold rounded-lg border border-[var(--border-default)] transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        <span>Download</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => typeof window !== 'undefined' && window.print()}
                        className="h-9 px-3 bg-white hover:bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] text-xs font-semibold rounded-lg border border-[var(--border-default)] transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        <span>Print</span>
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)] leading-[1.45]">
                  <strong className="font-semibold text-[var(--text-primary)]">Chief complaint: </strong>
                  {selectedEntry.chiefComplaint}
                </p>
              </div>

              {/* Body: Pending Lab Tests + Hierarchical Reports Stack */}
              <div className="p-4 sm:p-5 space-y-4">
                {/* Pending Investigations Banner (Live patients waiting for Lab Tech submission) */}
                {selectedEntry.pendingTests.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] flex items-start gap-2.5">
                    <FlaskConical className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">
                        {selectedEntry.pendingTests.length} test{selectedEntry.pendingTests.length > 1 ? 's' : ''} in lab
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        {selectedEntry.pendingTests
                          .map(p => `${p.testName} (${p.room})`)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>
                )}

                {selectedEntry.reports.length === 0 ? (
                  <div className="p-10 text-center border border-dashed border-[var(--border-default)] rounded-xl bg-[var(--bg-surface-subtle)]/50 space-y-2">
                    <Clock3 className="w-7 h-7 text-[var(--text-tertiary)] mx-auto" />
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      No diagnostic reports generated yet
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] max-w-md mx-auto">
                      Once the laboratory technician submits findings for {selectedEntry.name}, the report will appear right at the top of this workspace automatically.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedEntry.reports.map(rep => {
                      const isNewReport = rep.status === 'uploaded';
                      return (
                        <div
                          key={rep.id}
                          className={`rounded-xl border border-[var(--border-default)] overflow-hidden ${
                            isNewReport ? 'border-l-[3px] border-l-[var(--accent-primary)]' : ''
                          }`}
                        >
                          {/* Report Card Header */}
                          <div className="px-4 py-3 bg-[var(--bg-surface-subtle)] border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                                  {rep.testName}
                                </h3>
                                {rep.technicalName && (
                                  <span className="text-[11px] text-[var(--text-secondary)]">
                                    ({rep.technicalName})
                                  </span>
                                )}
                                {isNewReport ? (
                                  <span className="text-[11px] font-semibold text-[var(--status-success)]">New</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-tertiary)]">
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Verified</span>
                                  </span>
                                )}
                                {rep.isCritical && (
                                  <Badge variant="error">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Critical</span>
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-[var(--text-secondary)] font-mono mt-0.5 tabular-nums">
                                {rep.timestamp} · {rep.roomNo} · Tech: {rep.technicianName}
                                {typeof rep.actualTurnaroundMinutes === 'number'
                                  ? ` · Turnaround ${rep.actualTurnaroundMinutes}m`
                                  : ''}
                              </p>
                            </div>

                            {selectedEntry.isLivePatient && isNewReport && (
                              <button
                                type="button"
                                onClick={() => onVerifySingleReport(rep.id, doctorNotesInput)}
                                className="h-8 px-3 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors duration-150 cursor-pointer shrink-0"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Verified</span>
                              </button>
                            )}
                          </div>

                          {/* Clinical Summary & Tech Notes */}
                          <div className="px-4 py-2.5 bg-white border-b border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex flex-col gap-1">
                            <p>
                              <strong className="text-[var(--text-primary)]">Clinical summary: </strong>
                              {rep.summary}
                            </p>
                            {rep.technicianNotes && (
                              <p className="text-[11px]">
                                <strong className="text-[var(--text-primary)]">Lab remarks: </strong>
                                {rep.technicianNotes}
                              </p>
                            )}
                          </div>

                          {/* Measured Parameters Table */}
                          {rep.metrics.length > 0 && (
                            <div className="overflow-x-auto bg-white">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="border-b border-[var(--border-subtle)] text-[10.5px] uppercase font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface-subtle)]/40">
                                  <tr>
                                    <th className="py-2.5 px-4">Clinical Parameter</th>
                                    <th className="py-2.5 px-4">Observed Value</th>
                                    <th className="py-2.5 px-4">Biological Reference</th>
                                    <th className="py-2.5 px-4 text-right">Flag</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-subtle)]">
                                  {rep.metrics.map((m, mIdx) => (
                                    <tr key={mIdx}>
                                      <td className="py-2.5 px-4 font-semibold text-[var(--text-primary)]">
                                        {m.label}
                                      </td>
                                      <td className="py-2.5 px-4 font-mono font-bold text-[var(--text-primary)] tabular-nums">
                                        {m.value} {m.unit}
                                      </td>
                                      <td className="py-2.5 px-4 text-[var(--text-secondary)] font-mono text-[11px] tabular-nums">
                                        {m.normalRange}
                                      </td>
                                      <td className="py-2.5 px-4 text-right">
                                        <span
                                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold tabular-nums ${
                                            m.flag === 'normal'
                                              ? 'text-[var(--status-success)]'
                                              : m.flag === 'critical'
                                                ? 'text-[var(--danger)]'
                                                : m.flag === 'high'
                                                  ? 'text-[var(--status-warning)]'
                                                  : 'text-[var(--accent-primary)]'
                                          }`}
                                        >
                                          <span
                                            className={`w-1.5 h-1.5 rounded-full ${
                                              m.flag === 'normal'
                                                ? 'bg-[var(--status-success)]'
                                                : m.flag === 'critical'
                                                  ? 'bg-[var(--danger)]'
                                                  : m.flag === 'high'
                                                    ? 'bg-[var(--status-warning)]'
                                                    : 'bg-[var(--accent-primary)]'
                                            }`}
                                          />
                                          <span>{m.flag.charAt(0).toUpperCase() + m.flag.slice(1)}</span>
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Doctor Verification Footer */}
                          {rep.doctorNotes && (
                            <div className="px-4 py-2.5 bg-[var(--status-success-bg)]/50 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] flex flex-wrap items-center justify-between gap-2">
                              <span>
                                <strong className="text-[var(--text-primary)]">Doctor impression: </strong>
                                {rep.doctorNotes}
                              </span>
                              {rep.doctorSignature && (
                                <span className="font-mono font-semibold text-[var(--status-success)]">
                                  Signed: {rep.doctorSignature}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Live Patient Disposition & Final Sign-off */}
                    {selectedEntry.isLivePatient &&
                      selectedEntry.doctorReviewStatus !== 'completed' && (
                        <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5">
                          <label
                            htmlFor="reports-doctor-disposition"
                            className="text-xs font-bold text-[var(--text-primary)] block"
                          >
                            Doctor Clinical Impression & Consultation Sign-Off
                          </label>
                          <textarea
                            id="reports-doctor-disposition"
                            rows={2}
                            value={doctorNotesInput}
                            onChange={e => setDoctorNotesInput(e.target.value)}
                            placeholder="Document diagnosis, treatment plan, and follow-up advice..."
                            className="w-full p-3 text-base sm:text-xs rounded-xl border border-[var(--border-input)] bg-white text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                          />
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-[11px] text-[var(--text-secondary)]">
                              Verifies all uploaded reports and completes this OPD visit.
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                onVerifyAndDischarge(
                                  selectedEntry.patientId,
                                  doctorNotesInput
                                )
                              }
                              className="h-10 px-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-semibold rounded-xl transition-colors duration-150 cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Verify All & Complete Consultation</span>
                            </button>
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </BlurFade>
          )}
        </section>
      </div>
    </BlurFade>
  );
};
