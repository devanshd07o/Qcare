import React, { useState, useEffect, useRef } from 'react';
import { useHospitalStore } from '../../store/useHospitalStore';
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

/* ============================================================================
   LAB PORTAL — Design System
   Palette: teal / emerald / cyan  (clinical, clean, credible)
   Mirrors Doctor Portal architecture: aurora, glass, lp-rise, lp-cta
============================================================================ */
const LP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&display=swap');

/* ── root variables ─────────────────────────────────────── */
.lp-root {
  --lp-teal:   #0d9488;
  --lp-teal-d: #0f766e;
  --lp-emr:    #059669;
  --lp-line:   rgba(15,40,80,.09);
  font-family: 'Figtree', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  position: relative;
  isolation: isolate;
}

/* ── ambient aurora ─────────────────────────────────────── */
.lp-aurora{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
.lp-aurora i{position:absolute;border-radius:50%;filter:blur(90px);opacity:.4;will-change:transform}
.lp-aurora i:nth-child(1){width:46vw;height:46vw;left:-12vw;top:-14vw;background:radial-gradient(circle,#99f6e4,transparent 66%);animation:lpD1 28s ease-in-out infinite alternate}
.lp-aurora i:nth-child(2){width:40vw;height:40vw;right:-10vw;top:6vh;background:radial-gradient(circle,#6ee7b7,transparent 66%);animation:lpD2 34s ease-in-out infinite alternate}
.lp-aurora i:nth-child(3){width:38vw;height:38vw;left:28vw;bottom:-20vw;background:radial-gradient(circle,#a5f3fc,transparent 66%);animation:lpD3 40s ease-in-out infinite alternate}
@keyframes lpD1{to{transform:translate(9vw,7vh) scale(1.12)}}
@keyframes lpD2{to{transform:translate(-8vw,10vh) scale(.92)}}
@keyframes lpD3{to{transform:translate(-10vw,-8vh) scale(1.15)}}

/* ── glass surfaces ─────────────────────────────────────── */
.lp-root .glass-panel{
  background:linear-gradient(180deg,rgba(255,255,255,.93),rgba(255,255,255,.74));
  -webkit-backdrop-filter:blur(20px) saturate(1.6);
  backdrop-filter:blur(20px) saturate(1.6);
  border:1px solid rgba(255,255,255,.95);
  box-shadow:0 1px 0 rgba(255,255,255,.95) inset,0 0 0 1px var(--lp-line),0 24px 48px -24px rgba(10,80,70,.18),0 2px 6px rgba(10,80,70,.04);
  border-radius:22px;
}
.lp-root .lp-topbar{
  position:relative;
  padding:.5rem 1rem;
  border-radius:20px;
  background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(255,255,255,.78));
  -webkit-backdrop-filter:blur(20px) saturate(1.6);
  backdrop-filter:blur(20px) saturate(1.6);
  border:1px solid rgba(255,255,255,.95);
  box-shadow:0 0 0 1px var(--lp-line),0 14px 32px -20px rgba(10,80,70,.22);
}

/* ── entrance animations ────────────────────────────────── */
.lp-rise{animation:lpRise .7s cubic-bezier(.2,.8,.2,1) backwards}
@keyframes lpRise{from{opacity:0;transform:translateY(18px)}}
.lp-pop{animation:lpPop .5s cubic-bezier(.2,.9,.3,1.15) backwards}
@keyframes lpPop{from{opacity:0;transform:translateY(8px) scale(.96)}}

/* ── panel icon ─────────────────────────────────────────── */
.lp-ico{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;flex-shrink:0;color:#fff}
.lp-ico-teal{background:linear-gradient(145deg,#14b8a6,#0f766e);box-shadow:0 8px 18px -8px rgba(13,148,136,.85),inset 0 1px 0 rgba(255,255,255,.35)}
.lp-ico-emr{background:linear-gradient(145deg,#34d399,#059669);box-shadow:0 8px 18px -8px rgba(5,150,105,.85),inset 0 1px 0 rgba(255,255,255,.35)}

/* ── ACTIVE PATIENT CARD  ───────────────────────────────── */
/* hero card that shows who is currently at the counter     */
.lp-hero-card{
  position:relative;
  border-radius:18px;
  overflow:hidden;
  border:1px solid rgba(13,148,136,.18);
  background:linear-gradient(160deg,rgba(240,253,250,.95) 0%,rgba(255,255,255,.92) 60%,rgba(236,253,245,.9) 100%);
  box-shadow:0 0 0 3px rgba(13,148,136,.08),0 18px 36px -20px rgba(13,148,136,.35);
  transition:box-shadow .3s;
}
.lp-hero-card.is-called{
  border-color:rgba(13,148,136,.38);
  box-shadow:0 0 0 4px rgba(13,148,136,.13),0 20px 40px -20px rgba(13,148,136,.5);
}
/* accent left stripe */
.lp-hero-card::before{
  content:'';
  position:absolute;
  left:0;top:0;bottom:0;
  width:4px;
  background:linear-gradient(180deg,var(--lp-teal),var(--lp-emr));
  border-radius:18px 0 0 18px;
}

/* ── live pulse dot ─────────────────────────────────────── */
.lp-live{animation:lpLive 2.4s ease-out infinite}
@keyframes lpLive{
  0%{box-shadow:0 0 0 2px #fff,0 0 0 2px rgba(13,148,136,.55)}
  70%,100%{box-shadow:0 0 0 2px #fff,0 0 0 9px rgba(13,148,136,0)}
}

/* ── next-patient preview strip ─────────────────────────── */
.lp-next-strip{
  border-radius:14px;
  border:1px solid rgba(15,40,80,.08);
  background:rgba(248,250,252,.85);
  transition:border-color .2s,background .2s;
}
.lp-next-strip:hover{border-color:rgba(13,148,136,.25);background:#fff}

/* ── primary CTA ────────────────────────────────────────── */
.lp-root .lp-cta{
  position:relative;overflow:hidden;color:#fff;
  background:linear-gradient(110deg,#0d9488 0%,#059669 45%,#0891b2 100%);
  background-size:200% 100%;
  box-shadow:0 14px 28px -12px rgba(13,148,136,.72),inset 0 1px 0 rgba(255,255,255,.28);
  transition:background-position .7s,transform .18s,box-shadow .3s;
}
.lp-root .lp-cta::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.38) 50%,transparent 65%);
  transform:translateX(-120%);transition:transform .8s;
}
.lp-root .lp-cta:hover{background-position:100% 0;transform:translateY(-1px);box-shadow:0 20px 34px -14px rgba(13,148,136,.82),inset 0 1px 0 rgba(255,255,255,.3)}
.lp-root .lp-cta:hover::after{transform:translateX(120%)}
.lp-root .lp-cta:active{transform:scale(.985)}

/* ── action ghost buttons ───────────────────────────────── */
.lp-root .lp-ghost{
  background:rgba(255,255,255,.85);
  border:1px solid rgba(15,40,80,.1);
  transition:border-color .2s,box-shadow .2s,transform .15s,background .15s;
}
.lp-root .lp-ghost:hover{border-color:rgba(13,148,136,.4);box-shadow:0 8px 18px -10px rgba(13,148,136,.45);background:#fff;transform:translateY(-1px)}
.lp-root .lp-ghost:active{transform:scale(.97)}

/* ── segmented tab control ──────────────────────────────── */
.lp-seg{position:relative;display:grid;grid-template-columns:repeat(3,1fr);padding:4px;border-radius:999px;background:rgba(15,40,80,.06);border:1px solid rgba(15,40,80,.07)}
.lp-seg-thumb{position:absolute;top:4px;bottom:4px;left:4px;width:calc((100% - 8px)/3);border-radius:999px;background:#fff;box-shadow:0 6px 14px -6px rgba(13,148,136,.4),0 0 0 1px rgba(13,148,136,.12);transition:transform .42s cubic-bezier(.3,1.25,.5,1)}
.lp-seg[data-tab="on_hold"] .lp-seg-thumb{transform:translateX(100%)}
.lp-seg[data-tab="completed"] .lp-seg-thumb{transform:translateX(200%)}
.lp-seg-btn{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:7px 10px;font-size:12px;font-weight:700;color:#5b6f86;border-radius:999px;cursor:pointer;transition:color .25s;white-space:nowrap}
.lp-seg-btn:hover{color:#1d3350}
.lp-seg-btn.on{color:var(--lp-teal)}
.lp-seg-count{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;font-weight:700;padding:1px 6px;border-radius:999px;background:rgba(15,40,80,.08);color:#4a5f78;transition:background .3s,color .3s}
.lp-seg-btn.on .lp-seg-count{background:var(--lp-teal);color:#fff}

/* ── queue rows ─────────────────────────────────────────── */
.lp-root .lp-row{transition:background-color .2s,box-shadow .2s,transform .15s}
.lp-root .lp-row:hover{box-shadow:inset 3px 0 0 rgba(13,148,136,.4);transform:translateX(1px)}

/* ── form fields (modal) ────────────────────────────────── */
.lp-root .lp-label{display:block;font-size:12px;font-weight:700;color:#2d5a52;margin-bottom:.35rem;letter-spacing:.01em;transition:color .2s}
.lp-root div:focus-within>.lp-label{color:var(--lp-teal)}
.lp-root .lp-field{height:2.75rem;border-radius:14px;background:rgba(240,253,250,.85);border:1px solid rgba(15,40,80,.1);box-shadow:inset 0 1px 2px rgba(15,40,80,.04);transition:border-color .2s,box-shadow .25s,background .2s}
.lp-root .lp-field:hover{border-color:rgba(13,148,136,.35)}
.lp-root .lp-field:focus,.lp-root .lp-field:focus-within{background:#fff;border-color:var(--lp-teal);box-shadow:0 0 0 4px rgba(13,148,136,.13),0 10px 22px -12px rgba(13,148,136,.45);outline:none}
.lp-root textarea.lp-field{height:auto;min-height:5.5rem;padding:.75rem .9rem;line-height:1.5;resize:vertical}

/* ── metric card in modal ───────────────────────────────── */
.lp-metric-row{background:rgba(240,253,250,.6);border:1px solid rgba(13,148,136,.12);border-radius:14px;transition:border-color .2s,background .2s,box-shadow .2s}
.lp-metric-row:focus-within{background:#fff;border-color:var(--lp-teal);box-shadow:0 0 0 3px rgba(13,148,136,.09)}

/* ── scrollbar ──────────────────────────────────────────── */
.lp-scroll{scrollbar-width:thin;scrollbar-color:rgba(13,148,136,.3) transparent}

/* ── modal ──────────────────────────────────────────────── */
.lp-modal-bd{animation:lpBdIn .2s ease backwards}
@keyframes lpBdIn{from{opacity:0}}
.lp-modal-card{animation:lpMdIn .3s cubic-bezier(.2,.9,.3,1.15) backwards}
@keyframes lpMdIn{from{opacity:0;transform:translateY(14px) scale(.97)}}

/* ── reduced motion ─────────────────────────────────────── */
@media(prefers-reduced-motion:reduce){
  .lp-root *,.lp-root *::before,.lp-root *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
  .lp-aurora i{animation:none}
}
`;

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
  const currentCounter = counters.find(c => c.departmentId === currentDept.id);

  /* ── token lists ── */
  const deptTokens = queueTokens.filter(t => t.departmentId === currentDept.id);
  const waitingTokens = deptTokens.filter(
    t => t.status === 'waiting' || t.status === 'called' || t.status === 'in_progress'
  );
  const onHoldTokens  = deptTokens.filter(t => t.status === 'on_hold');
  const completedTokens = deptTokens.filter(t => t.status === 'completed');

  /* ── selected / active token ── */
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const calledToken   = waitingTokens.find(t => t.status === 'called');
  const currentToken  = waitingTokens.find(t => t.id === selectedTokenId) || calledToken || waitingTokens[0];
  const activeTest    = tests.find(t => t.id === currentToken?.testId);
  // next-in-line: first waiting token that is NOT the current one
  const nextToken     = waitingTokens.find(t => t.id !== currentToken?.id);

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
  const [queueTab, setQueueTab]     = useState<'waiting' | 'on_hold' | 'completed'>('waiting');
  const [queueSearch, setQueueSearch] = useState('');

  /* ── report modal state ── */
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [metricValues, setMetricValues] = useState<Record<string, string>>({});
  const [techRemarks, setTechRemarks]   = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── auto-populate metric defaults when patient/test changes ── */
  useEffect(() => {
    if (activeTest?.metricTemplates) {
      const map: Record<string, string> = {};
      activeTest.metricTemplates.forEach(t => { map[t.label] = t.defaultValue || ''; });
      setMetricValues(map);
    } else {
      setMetricValues({});
    }
    setTechRemarks('');
  }, [currentToken?.id, activeTest?.id]);

  /* ── handlers ── */
  const handleCall = (tokenId?: string) => {
    const id = tokenId || currentToken?.id;
    if (id) { callPatient(id); setSelectedTokenId(id); }
  };
  const handleHold = () => { if (currentToken) putOnHold(currentToken.id); };
  const handleOpenModal = (tokId?: string) => {
    if (tokId) setSelectedTokenId(tokId);
    setIsReportModalOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentToken) return;
    setIsSubmitting(true);
    setTimeout(() => {
      completeTestAndUploadReport(currentToken.id, metricValues, techRemarks);
      setIsSubmitting(false);
      setIsReportModalOpen(false);
      setSelectedTokenId(null);
    }, 220);
  };

  /* ── filtered visible queue ──────────────────────────────────────────────
     The patient currently at the counter (currentToken) is excluded from the
     waiting list — they are already shown in the left panel.
     On-hold and completed tabs are unaffected (currentToken is never there).
  ── */
  const queueWaiting = waitingTokens.filter(t => t.id !== currentToken?.id);

  const visibleTokens = (
    queueTab === 'waiting' ? queueWaiting :
    queueTab === 'on_hold' ? onHoldTokens :
    completedTokens
  ).filter(t => {
    if (!queueSearch.trim()) return true;
    const q = queueSearch.toLowerCase();
    return (
      (t.patientName  || '').toLowerCase().includes(q) ||
      (t.tokenNumber  || '').toLowerCase().includes(q) ||
      (t.patientUhid  || '').toLowerCase().includes(q)
    );
  });

  /* ════════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                  */
  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="lp-root space-y-4 text-slate-900 pb-12">
      <style>{LP_CSS}</style>

      {/* Aurora */}
      <div className="lp-aurora" aria-hidden="true"><i /><i /><i /></div>

      {/* ══════════════════════════════════════════════════════════════════
          TOPBAR
      ══════════════════════════════════════════════════════════════════ */}
      <div className="lp-topbar lp-rise flex items-center gap-3" style={{ animationDelay: '0s' }}>

        {/* Brand mark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="lp-ico lp-ico-teal">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div className="leading-none">
            <div className="text-[10px] font-semibold text-slate-400 mb-0.5 tracking-wide">
              {currentHospital.shortName}
            </div>
            <div className="text-sm font-black text-slate-900">Lab Portal</div>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-200 shrink-0" />

        {/* Station dropdown */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 hidden sm:inline">
            Station:
          </span>
          <div className="relative" ref={stationMenuRef}>
            <button
              type="button"
              onClick={() => setIsStationMenuOpen(prev => !prev)}
              className={`h-8.5 pl-2.5 pr-3 rounded-xl bg-white/90 border transition-all flex items-center gap-2 shadow-2xs text-left cursor-pointer ${
                isStationMenuOpen
                  ? 'border-teal-500 ring-2 ring-teal-500/15 bg-white'
                  : 'border-slate-200 hover:border-teal-400 hover:bg-white'
              }`}
            >
              <div className="w-5 h-5 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200/50">
                {currentDept.iconName === 'Droplet' ? <Droplet className="w-3 h-3" /> :
                 currentDept.iconName === 'Activity' ? <Activity className="w-3 h-3" /> :
                 currentDept.iconName === 'ScanLine' ? <ScanLine className="w-3 h-3" /> :
                 currentDept.iconName === 'Waves' ? <Waves className="w-3 h-3" /> :
                 currentDept.iconName === 'Eye' ? <Eye className="w-3 h-3" /> :
                 currentDept.iconName === 'Volume2' ? <Volume2 className="w-3 h-3" /> :
                 currentDept.iconName === 'Brain' ? <Brain className="w-3 h-3" /> :
                 currentDept.iconName === 'Wind' ? <Wind className="w-3 h-3" /> :
                 currentDept.iconName === 'Bone' ? <Bone className="w-3 h-3" /> :
                 <FlaskConical className="w-3 h-3" />}
              </div>
              <span className="text-xs font-bold text-slate-900 truncate max-w-[160px] sm:max-w-[220px]">
                {currentDept.name}
              </span>
              <span className="text-[11px] font-mono text-slate-400 shrink-0 hidden md:inline">
                ({currentDept.location.room})
              </span>
              {waitingTokens.length > 0 && (
                <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200 shrink-0">
                  {waitingTokens.length} waiting
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-0.5 ${
                  isStationMenuOpen ? 'rotate-180 text-teal-600' : ''
                }`}
              />
            </button>

            {/* Premium Popover Menu */}
            {isStationMenuOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 w-[320px] sm:w-[380px] rounded-2xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl p-2 lp-pop space-y-1">
                {/* Header */}
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Diagnostic Stations
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {departments.length} Units Active
                  </span>
                </div>

                {/* Station Items List */}
                <div className="max-h-[340px] overflow-y-auto lp-scroll space-y-1 pr-1 pt-1">
                  {departments.map(dept => {
                    const isSelected = dept.id === currentDept.id;
                    const deptWaitingCount = queueTokens.filter(
                      t => t.departmentId === dept.id &&
                           (t.status === 'waiting' || t.status === 'called')
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
                        className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-2.5 transition-all text-left cursor-pointer group ${
                          isSelected
                            ? 'bg-teal-50/80 border border-teal-200/80 shadow-2xs'
                            : 'hover:bg-slate-50/90 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-700'
                            }`}
                          >
                            {dept.iconName === 'Droplet' ? <Droplet className="w-3.5 h-3.5" /> :
                             dept.iconName === 'Activity' ? <Activity className="w-3.5 h-3.5" /> :
                             dept.iconName === 'ScanLine' ? <ScanLine className="w-3.5 h-3.5" /> :
                             dept.iconName === 'Waves' ? <Waves className="w-3.5 h-3.5" /> :
                             dept.iconName === 'Eye' ? <Eye className="w-3.5 h-3.5" /> :
                             dept.iconName === 'Volume2' ? <Volume2 className="w-3.5 h-3.5" /> :
                             dept.iconName === 'Brain' ? <Brain className="w-3.5 h-3.5" /> :
                             dept.iconName === 'Wind' ? <Wind className="w-3.5 h-3.5" /> :
                             dept.iconName === 'Bone' ? <Bone className="w-3.5 h-3.5" /> :
                             <FlaskConical className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <div className={`text-xs font-bold truncate ${isSelected ? 'text-teal-950 font-black' : 'text-slate-800 group-hover:text-slate-900'}`}>
                              {dept.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                              {dept.location.room} · {dept.location.floor}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {deptWaitingCount > 0 && (
                            <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {deptWaitingCount} waiting
                            </span>
                          )}
                          {isSelected && (
                            <Check className="w-4 h-4 text-teal-600 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* location breadcrumb — very compact */}
          <span className="text-[11px] text-slate-400 font-mono hidden lg:inline truncate">
            {currentDept.location.floor} · {currentDept.location.building || currentHospital.shortName}
          </span>
        </div>

        {/* Staff identity + logout — right-most */}
        <div className="flex items-center gap-2.5 shrink-0 ml-auto">
          <div className="text-right leading-tight">
            <span className="text-xs font-bold text-slate-900 block">
              {currentCounter?.technicianName || 'Lab Technician'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {currentCounter?.code || 'BAY-1'} · {currentDept.location.room}
            </span>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN LAYOUT  — left: counter  |  right: queue
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        {/* ──────────────────────────────────────────────────────────────
            LEFT — Active Serving Console  (5 cols)
        ────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-3">

          {/* Panel wrapper */}
          <div className="glass-panel p-5 space-y-4 lp-rise" style={{ animationDelay: '.06s' }}>

            {/* Panel header — small & compact */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="lp-ico lp-ico-teal" style={{ width: 28, height: 28, borderRadius: 9 }}>
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  At Counter · {currentCounter?.code || 'BAY-1'}
                </span>
              </div>
              {currentToken && (
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {currentDept.location.room}
                </span>
              )}
            </div>

            {currentToken ? (
              <div className="space-y-3">

                {/* ── HERO PATIENT CARD ─────────────────────────────────── */}
                <div className={`lp-hero-card px-5 pt-4 pb-5 ${currentToken.status === 'called' ? 'is-called' : ''}`}>

                  {/* Top row: token badge (small) + status */}
                  <div className="flex items-center justify-between mb-3 pl-1">
                    <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {currentToken.tokenNumber}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                      {currentToken.status === 'called' && (
                        <span className="lp-live inline-block w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                      )}
                      {currentToken.status === 'called' ? 'Called' :
                       currentToken.status === 'in_progress' ? 'In Progress' : 'Waiting'}
                    </span>
                  </div>

                  {/* PATIENT NAME — hero element */}
                  <h2 className="font-black text-3xl text-slate-900 leading-tight tracking-tight pl-1 mb-1">
                    {currentToken.patientName || '—'}
                  </h2>

                  {/* Demographics — small, secondary */}
                  <p className="text-xs text-slate-500 font-mono pl-1 mb-3">
                    {currentToken.patientAge}Y / {currentToken.patientGender}
                    <span className="mx-1.5 text-slate-300">·</span>
                    UHID: {currentToken.patientUhid}
                  </p>

                  {/* Investigation chip */}
                  <div className="pl-1">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
                      <FlaskConical className="w-3 h-3 shrink-0" />
                      {currentToken.testName}
                    </span>
                  </div>

                  {/* Prep note — amber, compact */}
                  {activeTest?.preparationNotes && (
                    <div className="mt-3 ml-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200/70 px-3 py-2 rounded-xl leading-relaxed">
                      <strong className="font-bold">Prep:</strong> {activeTest.preparationNotes}
                    </div>
                  )}
                </div>

                {/* ── PRIMARY ACTION ────────────────────────────────────── */}
                <button
                  type="button"
                  onClick={() => handleOpenModal()}
                  className="lp-cta w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Enter Lab Findings & Submit Report
                </button>

                {/* ── SECONDARY ACTIONS ─────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCall()}
                    className="lp-ghost flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer"
                    title="Announce via chime"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    Call
                  </button>
                  <button
                    type="button"
                    onClick={handleHold}
                    className="lp-ghost flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                    title="Put on hold"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Hold
                  </button>
                  <button
                    type="button"
                    onClick={() => skipToken(currentToken.id)}
                    className="lp-ghost flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                    title="Skip to next"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    Skip
                  </button>
                </div>

                {/* ── NEXT PATIENT PREVIEW ──────────────────────────────── */}
                {nextToken && (
                  <div className="lp-next-strip flex items-center gap-3 px-4 py-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-slate-200/80 shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
                        Up Next
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-400">
                          {nextToken.tokenNumber}
                        </span>
                        <span className="font-bold text-sm text-slate-800 truncate">
                          {nextToken.patientName}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {nextToken.testName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCall(nextToken.id)}
                      className="lp-ghost flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold text-teal-700 cursor-pointer shrink-0"
                    >
                      <Bell className="w-3 h-3" />
                      Call
                    </button>
                  </div>
                )}

              </div>
            ) : (
              /* ── EMPTY COUNTER STATE ──────────────────────────────── */
              <div className="py-14 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100/80 border border-slate-200/80 flex items-center justify-center mx-auto">
                  <UserCheck className="w-7 h-7 text-slate-300" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-700">Counter Free</h4>
                  <p className="text-xs text-slate-500 max-w-[190px] mx-auto mt-1 leading-relaxed">
                    No patient at this counter. Select one from the queue →
                  </p>
                </div>
                {waitingTokens.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleCall(waitingTokens[0].id)}
                    className="lp-cta mt-1 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    Call First — {waitingTokens[0].tokenNumber}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Stats strip */}
          <div className="glass-panel px-5 py-3.5 lp-rise" style={{ animationDelay: '.12s' }}>
            <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
              <div className="px-2">
                <div className="font-mono font-black text-2xl text-slate-900">{queueWaiting.length}</div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">Waiting</div>
              </div>
              <div className="px-2">
                <div className="font-mono font-black text-2xl text-amber-600">{onHoldTokens.length}</div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">On Hold</div>
              </div>
              <div className="px-2">
                <div className="font-mono font-black text-2xl text-teal-600">{completedTokens.length}</div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">Served</div>
              </div>
            </div>
          </div>

        </div>

        {/* ──────────────────────────────────────────────────────────────
            RIGHT — Scrollable Patient Queue Hub  (7 cols)
        ────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-7 glass-panel p-5 space-y-4 lp-rise" style={{ animationDelay: '.18s' }}>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100/80 pb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="lp-ico lp-ico-emr">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 truncate">
                  Patient Queue — {currentDept.name}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {currentDept.location.room} · {currentDept.location.floor}
                </p>
              </div>
            </div>

            {/* Segmented tab */}
            <div className="lp-seg shrink-0" data-tab={queueTab}>
              <div className="lp-seg-thumb" />
              {(['waiting', 'on_hold', 'completed'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setQueueTab(tab)}
                  className={`lp-seg-btn ${queueTab === tab ? 'on' : ''}`}
                >
                  {tab === 'waiting' ? 'Waiting' : tab === 'on_hold' ? 'Hold' : 'Done'}
                  <span className="lp-seg-count">
                    {tab === 'waiting' ? queueWaiting.length :
                     tab === 'on_hold' ? onHoldTokens.length : completedTokens.length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={queueSearch}
              onChange={e => setQueueSearch(e.target.value)}
              placeholder="Search by name, token, or UHID…"
              className="lp-field w-full text-xs text-slate-900 font-medium placeholder:font-normal placeholder:text-slate-400"
              style={{ paddingLeft: '2.25rem', paddingRight: '1rem' }}
            />
          </div>

          {/* Scrollable queue */}
          <div className="lp-scroll max-h-[500px] overflow-y-auto space-y-2 pr-1">
            {visibleTokens.length > 0 ? (
              visibleTokens.map((tok, idx) => {
                const isCurrent = tok.id === currentToken?.id;
                return (
                  <div
                    key={tok.id}
                    className={`lp-row flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border ${
                      isCurrent
                        ? 'bg-teal-50/80 border-teal-200 ring-1 ring-teal-100 shadow-sm'
                        : 'bg-white/70 border-slate-200/80 hover:bg-white/90'
                    }`}
                  >
                    {/* Patient info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 ${
                        isCurrent ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-sm text-slate-900">
                            {tok.tokenNumber}
                          </span>
                          {tok.status === 'called' && (
                            <span className="lp-live inline-block w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                          )}
                          {/* Patient name — readable size */}
                          <span className="font-bold text-sm text-slate-900 truncate">
                            {tok.patientName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                          {tok.patientAge}Y · {tok.testName}
                        </p>
                      </div>
                    </div>

                    {/* Row actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {queueTab === 'waiting' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCall(tok.id)}
                            className="lp-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-800 cursor-pointer"
                          >
                            <Bell className="w-3 h-3" />
                            Call
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenModal(tok.id)}
                            className="lp-cta flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer"
                            style={{ boxShadow: '0 6px 14px -6px rgba(13,148,136,.55)' }}
                          >
                            <FileText className="w-3 h-3" />
                            Report
                          </button>
                        </>
                      )}
                      {queueTab === 'on_hold' && (
                        <button
                          type="button"
                          onClick={() => recallFromHold(tok.id)}
                          className="lp-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-800 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Recall
                        </button>
                      )}
                      {queueTab === 'completed' && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-teal-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Done
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100/80 border border-slate-200/80 flex items-center justify-center mx-auto">
                  {queueSearch ? <Search className="w-7 h-7 text-slate-300" /> : <Clock className="w-7 h-7 text-slate-300" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    {queueSearch ? 'No Results' : 'Queue is Empty'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[210px] mx-auto leading-relaxed">
                    {queueSearch
                      ? 'No patients match your search.'
                      : 'New arrivals will appear here automatically.'}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          REPORT ENTRY MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {isReportModalOpen && currentToken && activeTest && (
        <div
          className="lp-modal-bd fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setIsReportModalOpen(false); }}
        >
          <div className="lp-modal-card bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200/80 overflow-hidden my-6">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="lp-ico lp-ico-teal">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Lab Report Entry</h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {currentToken.tokenNumber} · {currentToken.patientName} · {currentToken.testName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient context strip */}
            <div className="px-6 py-3 bg-teal-50/60 border-b border-teal-100/80 flex flex-wrap gap-x-5 gap-y-1">
              <span className="text-[11px] font-mono text-teal-900">
                <strong>Name:</strong> {currentToken.patientName}
              </span>
              <span className="text-[11px] font-mono text-teal-900">
                <strong>Age:</strong> {currentToken.patientAge}Y / {currentToken.patientGender}
              </span>
              <span className="text-[11px] font-mono text-teal-900">
                <strong>UHID:</strong> {currentToken.patientUhid}
              </span>
              <span className="text-[11px] font-mono text-teal-900">
                <strong>Test:</strong> {currentToken.testName}
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="lp-scroll space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {activeTest.metricTemplates?.map(tmpl => (
                  <div key={tmpl.label} className="lp-metric-row p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="lp-label mb-0">{tmpl.label}</label>
                      <span className="text-[10px] font-mono text-slate-400">
                        Ref: {tmpl.normalRange} {tmpl.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        required
                        value={metricValues[tmpl.label] || ''}
                        onChange={e => setMetricValues(p => ({ ...p, [tmpl.label]: e.target.value }))}
                        placeholder="Enter value…"
                        className="lp-field flex-1 px-4 text-sm font-mono text-slate-900"
                      />
                      {tmpl.unit && (
                        <span className="text-xs text-slate-500 font-mono w-12 text-right shrink-0">
                          {tmpl.unit}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Remarks */}
                <div>
                  <label className="lp-label">Technician Remarks</label>
                  <textarea
                    rows={3}
                    value={techRemarks}
                    onChange={e => setTechRemarks(e.target.value)}
                    placeholder="Specimen notes, observations, procedural remarks…"
                    className="lp-field w-full px-4 py-3 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="lp-cta flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Submitting…' : 'Submit Report & Route Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
