import React, { useState, useEffect, useRef } from 'react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Bell,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  Users,
  Clock,
  FileText,
  ChevronDown,
  LogOut,
  X,
  Search,
  FlaskConical,
  ShieldCheck,
  Activity,
  ArrowRight,
  UserCheck,
  Droplet,
  ScanLine,
  Waves,
  Eye,
  Volume2,
  Brain,
  Wind,
  Bone,
  Check
} from 'lucide-react';

function renderDepartmentIcon(iconName: string, className: string) {
  switch (iconName) {
    case 'Droplet':
      return <Droplet className={className} strokeWidth={1.75} />;
    case 'Activity':
      return <Activity className={className} strokeWidth={1.75} />;
    case 'ScanLine':
      return <ScanLine className={className} strokeWidth={1.75} />;
    case 'Waves':
      return <Waves className={className} strokeWidth={1.75} />;
    case 'Eye':
      return <Eye className={className} strokeWidth={1.75} />;
    case 'Volume2':
      return <Volume2 className={className} strokeWidth={1.75} />;
    case 'Brain':
      return <Brain className={className} strokeWidth={1.75} />;
    case 'Wind':
      return <Wind className={className} strokeWidth={1.75} />;
    case 'Bone':
      return <Bone className={className} strokeWidth={1.75} />;
    default:
      return <FlaskConical className={className} strokeWidth={1.75} />;
  }
}

export const LabPortal: React.FC = () => {
  const {
    currentHospital,
    departments,
    tests,
    counters,
    queueTokens,
    activeBayDepartmentId,
    setActiveBayDepartmentId,
    callPatient,
    putOnHold,
    recallFromHold,
    completeTestAndUploadReport,
    skipToken,
    signOut
  } = useHospitalStore();

  const currentDept = departments.find(d => d.id === activeBayDepartmentId) || departments[0];
  const currentCounter = counters.find(c => c.departmentId === currentDept?.id);

  /* ── token lists ── */
  const deptTokens = currentDept ? queueTokens.filter(t => t.departmentId === currentDept.id) : [];
  const waitingTokens = deptTokens.filter(
    t => t.status === 'waiting' || t.status === 'called' || t.status === 'in_progress'
  );
  const onHoldTokens = deptTokens.filter(t => t.status === 'on_hold');
  const completedTokens = deptTokens.filter(t => t.status === 'completed');

  /* ── selected / active token ── */
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const calledToken = waitingTokens.find(t => t.status === 'called');
  const currentToken = waitingTokens.find(t => t.id === selectedTokenId) || calledToken || waitingTokens[0];
  const activeTest = tests.find(t => t.id === currentToken?.testId);
  const nextToken = waitingTokens.find(t => t.id !== currentToken?.id);

  /* ── custom station dropdown state & outside click ── */
  const [isStationMenuOpen, setIsStationMenuOpen] = useState(false);
  const stationMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (stationMenuRef.current && !stationMenuRef.current.contains(e.target as Node)) {
        setIsStationMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsStationMenuOpen(false);
    };
    if (isStationMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isStationMenuOpen]);

  /* ── queue tab + search ── */
  const [queueTab, setQueueTab] = useState<'waiting' | 'on_hold' | 'completed'>('waiting');
  const [queueSearch, setQueueSearch] = useState('');

  /* ── report modal state ── */
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [metricValues, setMetricValues] = useState<Record<string, string>>({});
  const [techRemarks, setTechRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── auto-populate metric defaults when patient/test changes ── */
  useEffect(() => {
    if (activeTest?.metricTemplates) {
      const map: Record<string, string> = {};
      activeTest.metricTemplates.forEach(t => {
        map[t.label] = t.defaultValue || '';
      });
      setMetricValues(map);
    } else {
      setMetricValues({});
    }
    setTechRemarks('');
  }, [currentToken?.id, activeTest?.id]);

  /* ── handlers ── */
  const handleCall = (tokenId?: string) => {
    const id = tokenId || currentToken?.id;
    if (id) {
      callPatient(id);
      setSelectedTokenId(id);
    }
  };

  const handleHold = () => {
    if (currentToken) putOnHold(currentToken.id);
  };

  const handleOpenModal = (tokId?: string) => {
    if (tokId) setSelectedTokenId(tokId);
    setIsReportModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentToken || isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => {
      completeTestAndUploadReport(currentToken.id, metricValues, techRemarks);
      setIsSubmitting(false);
      setIsReportModalOpen(false);
      setSelectedTokenId(null);
    }, 180);
  };

  const queueWaiting = waitingTokens.filter(t => t.id !== currentToken?.id);

  const visibleTokens = (
    queueTab === 'waiting'
      ? queueWaiting
      : queueTab === 'on_hold'
        ? onHoldTokens
        : completedTokens
  ).filter(t => {
    if (!queueSearch.trim()) return true;
    const q = queueSearch.toLowerCase();
    return (
      (t.patientName || '').toLowerCase().includes(q) ||
      (t.tokenNumber || '').toLowerCase().includes(q) ||
      (t.patientUhid || '').toLowerCase().includes(q)
    );
  });

  if (!currentDept) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] font-sans text-[#0F172A] pb-12 space-y-6">
      {/* ══════════════════════════════════════════════════════════════════
          TOPBAR (Clinical White Surface + #E2E8F0 Border)
      ══════════════════════════════════════════════════════════════════ */}
      <header className="qc-header-bar rounded-[10px] px-4 sm:px-5 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 min-w-0 flex-1">
          {/* Brand mark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-[8px] bg-[#102A43] text-white flex items-center justify-center shrink-0">
              <FlaskConical className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="leading-[1.2]">
              <div className="text-[11px] font-medium text-[#64748B] tracking-wide">
                {currentHospital.shortName}
              </div>
              <div className="text-[15px] font-semibold text-[#0F172A] leading-[1.2]">
                Lab Portal
              </div>
            </div>
          </div>

          <div className="w-px h-6 bg-[#E2E8F0] shrink-0 hidden sm:block" />

          {/* Station dropdown */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[12px] font-medium text-[#64748B] shrink-0 hidden sm:inline">
              Station
            </span>
            <div className="relative" ref={stationMenuRef}>
              <button
                type="button"
                onClick={() => setIsStationMenuOpen(prev => !prev)}
                className={`h-9 pl-2.5 pr-3 rounded-[8px] bg-white border transition-colors duration-150 flex items-center gap-2 text-left cursor-pointer max-w-full ${
                  isStationMenuOpen
                    ? 'border-[#087C80] ring-[3px] ring-[rgba(8,124,128,0.2)]'
                    : 'border-[#CBD5E1] hover:border-[#94A3B8]'
                }`}
              >
                <span className="w-5 h-5 rounded-[6px] bg-[#F0FDFA] text-[#087C80] flex items-center justify-center shrink-0 border border-[#E2E8F0]">
                  {renderDepartmentIcon(currentDept.iconName, 'w-3.5 h-3.5')}
                </span>
                <span className="text-[13px] font-semibold text-[#0F172A] truncate max-w-[140px] sm:max-w-[220px]">
                  {currentDept.name}
                </span>
                <span className="text-[12px] tabular-nums text-[#64748B] shrink-0 hidden md:inline">
                  ({currentDept.location.room})
                </span>
                {waitingTokens.length > 0 && (
                  <span className="text-[11px] tabular-nums font-semibold text-[#087C80] shrink-0">
                    · {waitingTokens.length} waiting
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-[#64748B] transition-transform duration-150 shrink-0 ${
                    isStationMenuOpen ? 'rotate-180 text-[#087C80]' : ''
                  }`}
                  strokeWidth={1.75}
                />
              </button>

              {isStationMenuOpen && (
                <div className="absolute top-full left-0 mt-1.5 z-50 w-[min(360px,calc(100vw-2rem))] rounded-[10px] bg-white border border-[#E2E8F0] shadow-[0_12px_28px_-6px_rgba(15,23,42,0.14)] p-2 space-y-1">
                  <div className="px-2.5 py-2 border-b border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
                      Diagnostic stations
                    </span>
                    <span className="text-[11px] tabular-nums text-[#64748B]">
                      {departments.length} active
                    </span>
                  </div>

                  <div className="max-h-[320px] overflow-y-auto overscroll-contain space-y-1 pt-1">
                    {departments.map(dept => {
                      const isSelected = dept.id === currentDept.id;
                      const deptWaitingCount = queueTokens.filter(
                        t =>
                          t.departmentId === dept.id &&
                          (t.status === 'waiting' || t.status === 'called' || t.status === 'in_progress')
                      ).length;

                      return (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => {
                            setActiveBayDepartmentId(dept.id);
                            setSelectedTokenId(null);
                            setIsReportModalOpen(false);
                            setIsStationMenuOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-[8px] flex items-center justify-between gap-2.5 transition-colors duration-150 text-left cursor-pointer ${
                            isSelected
                              ? 'bg-[#F0FDFA] border border-[#087C80]/30'
                              : 'hover:bg-[#F8FAFC] border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-[#087C80] text-white'
                                  : 'bg-[#F1F5F9] text-[#475569]'
                              }`}
                            >
                              {renderDepartmentIcon(dept.iconName, 'w-3.5 h-3.5')}
                            </div>
                            <div className="min-w-0">
                              <div
                                className={`text-[13px] truncate ${
                                  isSelected ? 'font-semibold text-[#0F172A]' : 'font-medium text-[#0F172A]'
                                }`}
                              >
                                {dept.name}
                              </div>
                              <div className="text-[11px] text-[#64748B] tabular-nums truncate">
                                {dept.location.room} · {dept.location.floor}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {deptWaitingCount > 0 && (
                              <span className="tabular-nums text-[11px] font-medium text-[#334155]">
                                {deptWaitingCount} wait
                              </span>
                            )}
                            {isSelected && <Check className="w-4 h-4 text-[#087C80] shrink-0" strokeWidth={2} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <span className="text-[12px] text-[#64748B] tabular-nums hidden lg:inline truncate">
              {currentDept.location.floor} · {currentDept.location.building || currentHospital.shortName}
            </span>
          </div>
        </div>

        {/* Staff identity + logout */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <div className="text-right leading-[1.3]">
            <span className="text-[13px] font-semibold text-[#0F172A] block">
              {currentCounter?.technicianName || 'Lab Technician'}
            </span>
            <span className="text-[11px] text-[#64748B] tabular-nums">
              {currentCounter?.code || 'BAY-1'} · {currentDept.location.room}
            </span>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="h-9 w-9 rounded-[8px] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1] text-[#334155] hover:text-[#0F172A] flex items-center justify-center transition-colors duration-150 cursor-pointer"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN LAYOUT — left: counter (5 cols) | right: queue (7 cols)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT — Active Serving Console */}
        <div className="lg:col-span-5 space-y-6 min-w-0">
          <div className="rounded-[10px] border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
            {/* Panel sub-header */}
            <div className="px-4 sm:px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#475569]">
                At counter · {currentCounter?.code || 'BAY-1'}
              </span>
              <span className="text-[12px] font-medium text-[#64748B] tabular-nums">
                {currentDept.location.room}
              </span>
            </div>

            {currentToken ? (
              <div>
                {/* Deep Navy Patient Hero Card Header */}
                <div className="bg-[#102A43] text-white px-4 sm:px-5 py-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="tabular-nums text-[12.5px] font-semibold text-[#5EEAD4]">
                      {currentToken.tokenNumber}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#CBD5E1]">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          currentToken.status === 'called'
                            ? 'bg-[#2DD4BF]'
                            : currentToken.status === 'in_progress'
                              ? 'bg-[#38BDF8]'
                              : 'bg-[#FBBF24]'
                        }`}
                        aria-hidden="true"
                      />
                      <span>
                        {currentToken.status === 'called'
                          ? 'Called'
                          : currentToken.status === 'in_progress'
                            ? 'In Progress'
                            : 'Waiting'}
                      </span>
                    </span>
                  </div>

                  <h2 className="text-[22px] font-semibold text-white tracking-[-0.015em] leading-[1.2]">
                    {currentToken.patientName || '—'}
                  </h2>

                  <p className="text-[13px] leading-[1.4] text-[#CBD5E1] tabular-nums mt-1.5">
                    {currentToken.patientAge}Y / {currentToken.patientGender}
                    <span className="mx-2 text-white/35">·</span>
                    UHID: {currentToken.patientUhid}
                  </p>
                </div>

                {/* Investigation & Controls */}
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="space-y-1">
                    <span className="block text-[11px] font-medium uppercase tracking-[0.04em] text-[#64748B]">
                      Investigation
                    </span>
                    <div className="flex items-center gap-2 text-[14px] font-semibold text-[#0F172A]">
                      <FlaskConical className="w-4 h-4 text-[#087C80] shrink-0" strokeWidth={1.75} />
                      <span>{currentToken.testName}</span>
                    </div>
                  </div>

                  {activeTest?.preparationNotes && (
                    <div className="rounded-[8px] border border-[#FDE68A] bg-[#FFFBEB] px-3.5 py-2.5 text-[12.5px] text-[#92400E] leading-[1.5]">
                      <strong className="font-semibold">Prep:</strong> {activeTest.preparationNotes}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenModal()}
                    className="qc-primary-cta w-full h-11 rounded-[8px] text-white text-[13.5px] font-medium flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    <span>Enter Lab Findings &amp; Submit Report</span>
                  </button>

                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleCall()}
                      className="h-10 rounded-[8px] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1] text-[13px] font-medium text-[#0F172A] flex items-center justify-center gap-1.5 transition-colors duration-150 cursor-pointer"
                      title="Announce via chime"
                    >
                      <Bell className="w-3.5 h-3.5 text-[#087C80]" strokeWidth={1.75} />
                      <span>Call</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleHold}
                      className="h-10 rounded-[8px] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1] text-[13px] font-medium text-[#334155] flex items-center justify-center gap-1.5 transition-colors duration-150 cursor-pointer"
                      title="Put on hold"
                    >
                      <Pause className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={1.75} />
                      <span>Hold</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => skipToken(currentToken.id)}
                      className="h-10 rounded-[8px] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1] text-[13px] font-medium text-[#334155] flex items-center justify-center gap-1.5 transition-colors duration-150 cursor-pointer"
                      title="Skip to next"
                    >
                      <SkipForward className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={1.75} />
                      <span>Skip</span>
                    </button>
                  </div>

                  {nextToken && (
                    <div className="rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <ArrowRight className="w-4 h-4 text-[#64748B] shrink-0" strokeWidth={1.75} />
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#64748B]">
                            Up next
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="tabular-nums text-[12px] font-semibold text-[#087C80] shrink-0">
                              {nextToken.tokenNumber}
                            </span>
                            <span className="text-[13px] font-semibold text-[#0F172A] truncate">
                              {nextToken.patientName}
                            </span>
                          </div>
                          <div className="text-[12px] text-[#64748B] truncate">
                            {nextToken.testName}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCall(nextToken.id)}
                        className="h-8 px-3 rounded-[8px] border border-[#CBD5E1] bg-white hover:border-[#087C80] text-[12px] font-medium text-[#087C80] inline-flex items-center gap-1.5 transition-colors duration-150 cursor-pointer shrink-0"
                      >
                        <Bell className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Call</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 px-6 text-center space-y-3">
                <UserCheck className="w-8 h-8 text-[#94A3B8] mx-auto" strokeWidth={1.75} />
                <div className="space-y-1">
                  <h3 className="text-[15px] font-semibold text-[#0F172A]">Counter free</h3>
                  <p className="text-[13px] leading-[1.5] text-[#64748B] max-w-prose mx-auto">
                    No patient at this counter. Select one from the queue.
                  </p>
                </div>
                {waitingTokens.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleCall(waitingTokens[0].id)}
                    className="qc-primary-cta h-10 px-4 rounded-[8px] text-white text-[13px] font-medium inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Bell className="w-4 h-4" strokeWidth={1.75} />
                    <span>Call First — {waitingTokens[0].tokenNumber}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Stats strip */}
          <div className="rounded-[10px] border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] px-4 py-3.5">
            <div className="grid grid-cols-3 divide-x divide-[#E2E8F0] text-center">
              <div className="px-2">
                <div className="tabular-nums font-semibold text-[22px] leading-[1.2] text-[#0F172A]">
                  {queueWaiting.length}
                </div>
                <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-[0.04em] mt-1">
                  Waiting
                </div>
              </div>
              <div className="px-2">
                <div className="tabular-nums font-semibold text-[22px] leading-[1.2] text-[#B45309]">
                  {onHoldTokens.length}
                </div>
                <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-[0.04em] mt-1">
                  On hold
                </div>
              </div>
              <div className="px-2">
                <div className="tabular-nums font-semibold text-[22px] leading-[1.2] text-[#047857]">
                  {completedTokens.length}
                </div>
                <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-[0.04em] mt-1">
                  Served
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Scrollable Patient Queue Hub */}
        <div className="lg:col-span-7 rounded-[10px] border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden min-w-0">
          <div className="px-4 sm:px-5 pt-4 pb-0 bg-[#F8FAFC] border-b border-[#E2E8F0] space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Users className="w-4 h-4 text-[#087C80] shrink-0" strokeWidth={1.75} />
                <h2 className="text-[16px] font-semibold text-[#0F172A] leading-[1.3] truncate">
                  Patient Queue — {currentDept.name}
                </h2>
              </div>
              <span className="text-[12px] text-[#64748B] tabular-nums shrink-0">
                {currentDept.location.room} · {currentDept.location.floor}
              </span>
            </div>

            <div className="relative">
              <Search
                className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                strokeWidth={1.75}
              />
              <Input
                type="search"
                value={queueSearch}
                onChange={e => setQueueSearch(e.target.value)}
                placeholder="Search by name, token, or UHID..."
                aria-label="Search lab queue"
                className="pl-9 pr-9"
              />
              {queueSearch && (
                <button
                  type="button"
                  onClick={() => setQueueSearch('')}
                  aria-label="Clear lab search"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[6px] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors duration-150 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              )}
            </div>

            {/* Clean Underline Tab Strip */}
            <div role="tablist" aria-label="Filter lab queue" className="-mx-4 sm:-mx-5 px-2 sm:px-3 pt-1 grid grid-cols-3">
              {(['waiting', 'on_hold', 'completed'] as const).map(tab => {
                const isActive = queueTab === tab;
                const count =
                  tab === 'waiting'
                    ? queueWaiting.length
                    : tab === 'on_hold'
                      ? onHoldTokens.length
                      : completedTokens.length;
                const label = tab === 'waiting' ? 'Waiting' : tab === 'on_hold' ? 'Hold' : 'Done';

                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setQueueTab(tab)}
                    className={`relative py-2.5 px-2 text-[12.5px] font-medium whitespace-nowrap transition-colors duration-150 inline-flex items-baseline justify-center gap-1.5 cursor-pointer border-b-2 ${
                      isActive
                        ? 'text-[#087C80] font-semibold border-[#087C80]'
                        : 'text-[#64748B] hover:text-[#0F172A] border-transparent'
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`text-[11px] tabular-nums ${
                        isActive ? 'text-[#087C80] font-semibold' : 'text-[#94A3B8]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="divide-y divide-[#E2E8F0] max-h-[540px] overflow-y-auto overscroll-contain">
            {visibleTokens.length > 0 ? (
              visibleTokens.map((tok, idx) => {
                const isCurrent = tok.id === currentToken?.id;
                return (
                  <div
                    key={tok.id}
                    className={`px-4 sm:px-5 py-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 border-l-[3px] transition-colors duration-150 ${
                      isCurrent
                        ? 'bg-[#F0FDFA]/70 border-l-[#087C80]'
                        : 'bg-white hover:bg-[#F8FAFC] border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={`w-7 h-7 rounded-[8px] flex items-center justify-center text-[12px] font-semibold tabular-nums shrink-0 ${
                          isCurrent
                            ? 'bg-[#087C80] text-white'
                            : 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="tabular-nums font-semibold text-[13px] text-[#087C80]">
                            {tok.tokenNumber}
                          </span>
                          {tok.status === 'called' && (
                            <span className="inline-block w-2 h-2 rounded-full bg-[#087C80] shrink-0" />
                          )}
                          <span className="font-semibold text-[14px] text-[#0F172A] truncate">
                            {tok.patientName}
                          </span>
                        </div>
                        <p className="text-[12px] leading-[1.4] text-[#64748B] tabular-nums mt-0.5 truncate">
                          {tok.patientAge}Y · {tok.testName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {queueTab === 'waiting' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCall(tok.id)}
                            className="h-8 px-3 rounded-[8px] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1] text-[12px] font-medium text-[#0F172A] inline-flex items-center gap-1.5 transition-colors duration-150 cursor-pointer"
                          >
                            <Bell className="w-3.5 h-3.5 text-[#087C80]" strokeWidth={1.75} />
                            <span>Call</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenModal(tok.id)}
                            className="qc-primary-cta h-8 px-3 rounded-[8px] text-white text-[12px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
                            <span>Report</span>
                          </button>
                        </>
                      )}
                      {queueTab === 'on_hold' && (
                        <button
                          type="button"
                          onClick={() => recallFromHold(tok.id)}
                          className="h-8 px-3 rounded-[8px] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[12px] font-medium text-[#0F172A] inline-flex items-center gap-1.5 transition-colors duration-150 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-[#087C80]" strokeWidth={1.75} />
                          <span>Recall</span>
                        </button>
                      )}
                      {queueTab === 'completed' && (
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#047857]">
                          <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                          <span>Done</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 px-6 text-center space-y-2.5">
                {queueSearch ? (
                  <Search className="w-7 h-7 text-[#94A3B8] mx-auto" strokeWidth={1.75} />
                ) : (
                  <Clock className="w-7 h-7 text-[#94A3B8] mx-auto" strokeWidth={1.75} />
                )}
                <p className="text-[14px] font-semibold text-[#0F172A]">
                  {queueSearch ? 'No results' : 'Queue is empty'}
                </p>
                <p className="text-[13px] leading-[1.5] text-[#64748B] max-w-prose mx-auto">
                  {queueSearch ? 'No patients match your search.' : 'New arrivals will appear here automatically.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          REPORT ENTRY MODAL (Clean Navy Header + #E2E8F0 Borders)
      ══════════════════════════════════════════════════════════════════ */}
      {isReportModalOpen && currentToken && activeTest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-950/55"
          role="dialog"
          aria-modal="true"
          aria-label="Lab Report Entry"
          onClick={e => {
            if (e.target === e.currentTarget) setIsReportModalOpen(false);
          }}
        >
          <div className="bg-white rounded-[10px] shadow-xl max-w-2xl w-full border border-[#E2E8F0] overflow-hidden my-6">
            {/* Modal Navy Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-[#102A43] text-white">
              <div className="flex items-center gap-3 min-w-0">
                <ShieldCheck className="w-5 h-5 text-[#5EEAD4] shrink-0" strokeWidth={1.75} />
                <div className="min-w-0">
                  <h3 className="font-semibold text-[16px] leading-[1.25] text-white">
                    Lab Report Entry
                  </h3>
                  <p className="text-[12px] leading-[1.35] text-[#CBD5E1] tabular-nums mt-0.5 truncate">
                    {currentToken.tokenNumber} · {currentToken.patientName} · {currentToken.testName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                aria-label="Close lab report entry"
                className="w-9 h-9 rounded-[8px] text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors duration-150 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            {/* Patient context strip */}
            <div className="px-5 sm:px-6 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap gap-x-5 gap-y-1 text-[12px] leading-[1.4] tabular-nums text-[#334155]">
              <span>
                <strong className="font-semibold text-[#0F172A]">Name:</strong> {currentToken.patientName}
              </span>
              <span>
                <strong className="font-semibold text-[#0F172A]">Age:</strong> {currentToken.patientAge}Y / {currentToken.patientGender}
              </span>
              <span>
                <strong className="font-semibold text-[#0F172A]">UHID:</strong> {currentToken.patientUhid}
              </span>
              <span>
                <strong className="font-semibold text-[#0F172A]">Test:</strong> {currentToken.testName}
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
              <div className="space-y-3 max-h-[50vh] overflow-y-auto overscroll-contain pr-1">
                {activeTest.metricTemplates?.map(tmpl => (
                  <div
                    key={tmpl.label}
                    className="rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[13px] font-semibold text-[#0F172A] leading-[1.35]">
                        {tmpl.label}
                      </label>
                      <span className="text-[11px] tabular-nums text-[#64748B] shrink-0">
                        Ref: {tmpl.normalRange} {tmpl.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="text"
                        required
                        value={metricValues[tmpl.label] || ''}
                        onChange={e => setMetricValues(p => ({ ...p, [tmpl.label]: e.target.value }))}
                        placeholder="Enter value..."
                        className="flex-1 tabular-nums"
                      />
                      {tmpl.unit && (
                        <span className="text-[12.5px] text-[#64748B] tabular-nums w-14 text-right shrink-0">
                          {tmpl.unit}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                <div className="space-y-1.5">
                  <label
                    htmlFor="lab-tech-remarks"
                    className="block text-[13px] font-semibold text-[#0F172A] leading-[1.35]"
                  >
                    Technician remarks
                  </label>
                  <Textarea
                    id="lab-tech-remarks"
                    rows={3}
                    value={techRemarks}
                    onChange={e => setTechRemarks(e.target.value)}
                    placeholder="Specimen notes, observations, procedural remarks..."
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="h-10 px-4 rounded-[8px] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[13px] font-medium text-[#334155] transition-colors duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="qc-primary-cta h-10 px-5 rounded-[8px] text-white text-[13px] font-medium inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Report & Route Patient'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
