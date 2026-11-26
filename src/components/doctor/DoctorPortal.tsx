import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useHospitalStore, getHospitalState } from '../../store/useHospitalStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { PrintableSlip } from '../common/PrintableSlip';
import { HISTORICAL_PATIENT_RECORDS, HistoricalPatientRecord } from '../../data/historicalPatientsData';
import { Patient } from '../../types';
import { DoctorQueueWorkspace, QueueFilterMode, WorkspaceTabMode } from './DoctorQueueWorkspace';
import { DoctorSidebar, DoctorPortalView } from './DoctorSidebar';
import { DoctorDashboardView } from './DoctorDashboardView';
import { DoctorReportsView } from './DoctorReportsView';
import {
  getTestLiveEstimate,
  estimateWalkinInvestigations,
  getAllDepartmentTelemetry,
  TestLiveEstimate
} from '../../engine/labTurnaroundEngine';
import { buildHierarchicalReportPatients } from '../../engine/doctorReportsHelper';
import { AnimatedBackground } from '../ui/animated-background';
import { Badge } from '../ui/badge';
import { BlurFade } from '../ui/blur-fade';
import {
  Search,
  Check,
  Printer,
  FlaskConical,
  ChevronRight,
  ChevronDown,
  X,
  AlertCircle,
  ListChecks,
  Mic,
  ArrowLeft,
  UserPlus,
  User,
  Phone,
  Calendar,
  MapPin,
  Clock,
  FolderArchive
} from 'lucide-react';

const DP_CSS = `
.dp-root{--dp-teal:var(--accent-primary,#0F766E);--dp-bright:var(--accent-primary-bright,#0D9488);--dp-line:var(--border-default,#CBD5D3);position:relative}

/* ---------- bright clinical panels ---------- */
.dp-root .glass-panel{background:var(--bg-surface,#FFFFFF);border:1px solid var(--border-default,#CBD5D3);box-shadow:0 1px 3px rgba(15,23,42,.04)}

/* ---------- panel headers & live ECG trace ---------- */
.dp-ico{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;color:#fff;background:linear-gradient(135deg,#0D9488,#0F766E)}
.dp-badge{font-size:11px;font-weight:700;color:var(--text-primary,#0F172A);background:var(--bg-surface-subtle,#F1F5F9);border:1px solid var(--border-default,#CBD5D3);padding:2px 9px;border-radius:999px}
.dp-badge-pop{animation:dpBadge .32s cubic-bezier(.3,1.5,.5,1)}
@keyframes dpBadge{from{transform:scale(.75);opacity:0}}

.dp-ecg{width:88px;height:22px;margin-left:4px;color:#CBD5D3;transition:color .25s ease;overflow:visible}
.dp-ecg.live{color:var(--dp-bright)}
.dp-ecg path{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:100;animation:dpTrace 2.8s ease-in-out infinite}
.dp-ecg.live path{animation-duration:1.6s}
@keyframes dpTrace{0%{stroke-dashoffset:100}55%{stroke-dashoffset:0}100%{stroke-dashoffset:-100}}

/* ---------- form fields ---------- */
.dp-root .dp-label{display:block;font-size:12px;font-weight:600;color:var(--text-secondary,#475569);margin-bottom:.375rem;letter-spacing:.01em;transition:color .15s ease}
.dp-root div:focus-within>.dp-label{color:var(--dp-teal)}
.dp-root .dp-field{height:2.75rem;border-radius:12px;background:#FFFFFF;border:1.5px solid var(--border-input,#94A3A0);transition:border-color .15s ease,box-shadow .15s ease}
.dp-root .dp-field.dp-sm{height:2.25rem;border-radius:10px}
.dp-root textarea.dp-field{height:auto;min-height:5.25rem;padding:.7rem .85rem;line-height:1.5;resize:vertical}
.dp-root .dp-field:hover{border-color:var(--border-input-hover,#647470)}
.dp-root .dp-field:focus,.dp-root .dp-field:focus-within{background:#fff;border-color:var(--dp-teal);box-shadow:0 0 0 3px var(--focus-ring,rgba(13,148,136,.22));outline:none}

.dp-root .dp-ai{color:#fff;background:linear-gradient(135deg,#0D9488,#0F766E);transition:opacity .15s ease,transform .15s ease}
.dp-root .dp-ai:hover{opacity:.94;transform:translateY(-1px)}
.dp-root .dp-ai:active{transform:scale(.97)}

.dp-root .dp-quick{background:#fff;border:1px solid var(--border-default,#CBD5D3);transition:border-color .15s ease,background-color .15s ease}
.dp-root .dp-quick:hover{border-color:var(--dp-teal);background:var(--bg-surface-subtle,#F1F5F4)}

/* ---------- triage ---------- */
.dp-root .dp-tri{background:#fff;border:1.5px solid var(--border-default,#CBD5D3);transition:border-color .15s ease,background-color .15s ease,transform .15s ease}
.dp-root .dp-tri:hover{border-color:var(--dp-teal);background:var(--bg-surface-hover,#F7FAFA)}
.dp-root .dp-tri:active{transform:scale(.99)}
.dp-root .dp-tri.on-teal{background:var(--accent-subtle,#E6F5F3);border-color:var(--dp-teal)}
.dp-root .dp-tri.on-rose{background:#FEF2F2;border-color:#DC2626}

/* ---------- test cards ---------- */
.dp-scroll{scrollbar-width:thin;scrollbar-color:rgba(15,118,110,.3) transparent}
.dp-root .dp-test{position:relative;background:#fff;border:1.5px solid var(--border-subtle,#E2E8E7);transition:transform .16s cubic-bezier(.16,1,.3,1),border-color .15s ease,box-shadow .15s ease,background-color .15s ease}
.dp-root .dp-test:hover{transform:translateY(-1px);border-color:var(--dp-bright);box-shadow:0 8px 18px -12px rgba(15,118,110,.35)}
.dp-root .dp-test:active{transform:scale(.99)}
.dp-root .dp-test:focus-visible{outline:2px solid var(--dp-teal);outline-offset:2px}
.dp-root .dp-test.is-checked{background:var(--accent-subtle,#E6F5F3);border-color:var(--dp-teal)}
.dp-test-ico{background:var(--bg-surface-subtle,#F1F5F4);border:1px solid var(--border-subtle,#E2E8E7);transition:transform .2s cubic-bezier(.16,1,.3,1),background-color .15s ease}
.dp-test-ico svg{width:1.25rem;height:1.25rem}
.dp-test:hover .dp-test-ico{transform:scale(1.05)}
.dp-test.is-checked .dp-test-ico{background:#fff;border-color:var(--status-success-border,#A7F3D0)}
.dp-check{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;border:1.5px solid var(--border-input,#94A3A0);background:#fff;color:#fff;transition:background-color .15s ease,border-color .15s ease}
.dp-check svg{transform:scale(0);transition:transform .2s cubic-bezier(.3,1.6,.5,1)}
.dp-test.is-checked .dp-check{background:var(--dp-teal);border-color:var(--dp-teal)}
.dp-test.is-checked .dp-check svg{transform:scale(1)}

/* ---------- primary CTA ---------- */
.dp-root .dp-cta{color:#fff;background:linear-gradient(135deg,#0D9488 0%,#0F766E 100%);border:1px solid #0B5E57;box-shadow:0 6px 16px -4px rgba(13,148,136,.35);transition:transform .16s cubic-bezier(.16,1,.3,1),box-shadow .16s ease,opacity .15s ease}
.dp-root .dp-cta:hover{transform:translateY(-1px);box-shadow:0 10px 22px -6px rgba(13,148,136,.45)}
.dp-root .dp-cta:active{transform:translateY(0)}

.dp-root .dp-shake{animation:dpShake .4s}
@keyframes dpShake{20%{transform:translateX(-5px)}40%{transform:translateX(4px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
.dp-root button:focus-visible,.dp-root [role="checkbox"]:focus-visible{outline:2px solid var(--dp-teal);outline-offset:2px}

@media (prefers-reduced-motion:reduce){
  .dp-root *,.dp-root *::before,.dp-root *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
`;

export const DoctorPortal: React.FC = () => {
  const {
    currentHospital,
    currentUser,
    patients,
    tests,
    departments,
    counters,
    queueTokens,
    clinicalReports,
    selectedPatientId,
    setSelectedPatientId,
    activeLanguage,
    registerPatient,
    prescribeTests,
    verifyLabReport,
    verifyAndDischargePatient,
    loadDoctorDemoPatients,
    selectAndLoginPatient,
    prefilledWalkinData,
    setPrefilledWalkinData,
    generateAiDemoPatient,
    signOut,
    showToast,
    doctorView,
    setDoctorView
  } = useHospitalStore();

  void TRANSLATIONS[activeLanguage];

  // ==========================================
  // SIDEBAR WORKSPACE NAVIGATION: 'dashboard' | 'walkin' | 'queue' | 'reports' | 'records'
  // ==========================================
  const mainViewMode = doctorView;
  const setMainViewMode = setDoctorView;
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [reportSelectedPatientId, setReportSelectedPatientId] = useState<string | null>(null);

  // Live clock tick (refreshes every 30s so hourly load & pill ETAs stay dynamically synced)
  const [telemetryNow, setTelemetryNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryNow(new Date());
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  // ==========================================
  // 1. WALK-IN CONSULTATION & REGISTRATION FORM STATE
  // ==========================================
  const [patName, setPatName] = useState('');
  const [patAge, setPatAge] = useState('');
  const [patGender, setPatGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [patPhone, setPatPhone] = useState('');
  const [patComplaint, setPatComplaint] = useState('');
  const [patPriority, setPatPriority] = useState<'standard' | 'emergency'>('standard');
  const [walkinTestIds, setWalkinTestIds] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  // Returning Patient Quick-Search
  const [returningSearchQuery, setReturningSearchQuery] = useState('');
  const [showReturningDropdown, setShowReturningDropdown] = useState(false);

  // Diagnostic Test Discovery
  const [walkinCategoryFilter] = useState<string>('all');
  const [walkinSearchFilter, setWalkinSearchFilter] = useState('');

  // Thermal Slip Modal State (Shown immediately upon registration)
  const [slipModalPatient, setSlipModalPatient] = useState<Patient | null>(null);

  // Diagnostic Test 1.5s Hover Preview Tooltip State
  const [hoveredTest, setHoveredTest] = useState<{ id: string; top: number; left: number } | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTestMouseEnter = (testId: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredTest({
        id: testId,
        top: rect.top,
        left: rect.left + rect.width / 2
      });
    }, 550);
  };

  const handleTestMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredTest(null);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Mobile 2-step wizard state (Step 1: Patient Details -> Step 2: Diagnostic Tests)
  const [mobileStep, setMobileStep] = useState<1 | 2>(1);

  // Speech Recognition & Voice Dictation State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Quick Dropdowns State (Symptoms & Bundles)
  const [showQuickSymptoms, setShowQuickSymptoms] = useState(false);
  const [showQuickBundles, setShowQuickBundles] = useState(false);
  const quickSymptomsRef = useRef<HTMLDivElement>(null);
  const quickBundlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickSymptomsRef.current && !quickSymptomsRef.current.contains(e.target as Node)) {
        setShowQuickSymptoms(false);
      }
      if (quickBundlesRef.current && !quickBundlesRef.current.contains(e.target as Node)) {
        setShowQuickBundles(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to global prefilled patient data (e.g. from 56 patient search or AI Demo generator)
  useEffect(() => {
    if (!prefilledWalkinData) return;
    setPatName(prefilledWalkinData.name);
    setPatAge(prefilledWalkinData.age);
    setPatGender(prefilledWalkinData.gender);
    setPatPhone(prefilledWalkinData.contact);
    setPatComplaint(prefilledWalkinData.chiefComplaint);
    if (prefilledWalkinData.testIds && prefilledWalkinData.testIds.length > 0) {
      setWalkinTestIds(prefilledWalkinData.testIds);
    }
    setFormError('');
    setMainViewMode('walkin');
    setMobileStep(1);
    setPrefilledWalkinData(null);
  }, [prefilledWalkinData, setPrefilledWalkinData]);

  // ==========================================
  // 2. HISTORICAL REGISTRY (56 PATIENTS) FILTER STATE
  // ==========================================
  const [historicalSearch, setHistoricalSearch] = useState('');
  const [historicalCategoryFilter, setHistoricalCategoryFilter] = useState<string>('all');

  // ==========================================
  // 3. TODAY'S ACTIVE QUEUE & REPORTS WORKSPACE STATE
  // ==========================================
  const [queueFilter, setQueueFilter] = useState<QueueFilterMode>('all');
  const [queueSearchQuery, setQueueSearchQuery] = useState('');
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTabMode>('prescribe');
  const [doctorConclusionNotes, setDoctorConclusionNotes] = useState('');

  // Selected patient in Live Queue mode
  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || (patients.length > 0 ? patients[0] : null);
  }, [patients, selectedPatientId]);

  // Sync workspace subtab based on patient's diagnostic phase
  useEffect(() => {
    if (!selectedPatient) return;
    if (selectedPatient.doctorReviewStatus === 'reports_ready') {
      setWorkspaceTab('reports');
    } else if (selectedPatient.doctorReviewStatus === 'awaiting_lab_reports') {
      setWorkspaceTab('route');
    } else if (selectedPatient.doctorReviewStatus === 'awaiting_prescription') {
      setWorkspaceTab('prescribe');
    }
  }, [selectedPatient?.id, selectedPatient?.doctorReviewStatus]);

  // Queue KPI counts
  const waitingCount = patients.filter(p => p.doctorReviewStatus === 'awaiting_prescription').length;
  const inDiagCount = patients.filter(p => p.doctorReviewStatus === 'awaiting_lab_reports').length;
  const reportsReadyCount = patients.filter(p => p.doctorReviewStatus === 'reports_ready').length;
  const completedCount = patients.filter(p => p.doctorReviewStatus === 'completed').length;

  // Filtered live queue
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      if (queueFilter === 'waiting' && p.doctorReviewStatus !== 'awaiting_prescription') return false;
      if (queueFilter === 'in_diagnostics' && p.doctorReviewStatus !== 'awaiting_lab_reports') return false;
      if (queueFilter === 'reports_ready' && p.doctorReviewStatus !== 'reports_ready') return false;
      if (queueFilter === 'completed' && p.doctorReviewStatus !== 'completed') return false;

      if (queueSearchQuery.trim()) {
        const q = queueSearchQuery.trim().toLowerCase();
        const digits = q.replace(/\D/g, '');
        const matchName = p.name.toLowerCase().includes(q);
        const matchUhid = p.uhid.toLowerCase().includes(q);
        const matchToken = p.opdTokenNumber?.toLowerCase().includes(q);
        const matchPhone = digits.length >= 3 && p.contact.replace(/\D/g, '').includes(digits);
        return matchName || matchUhid || matchToken || matchPhone;
      }
      return true;
    });
  }, [patients, queueFilter, queueSearchQuery]);

  // Clinical reports for selected queue patient
  const patientReports = useMemo(() => {
    if (!selectedPatient) return [];
    return clinicalReports.filter(r => r.patientId === selectedPatient.id);
  }, [clinicalReports, selectedPatient]);

  // ==========================================
  // LIVE LAB TURNAROUND TELEMETRY & HIERARCHICAL REPORTS
  // ==========================================
  const telemetryContext = useMemo(
    () => ({
      tests,
      departments,
      counters,
      queueTokens,
      clinicalReports,
      now: telemetryNow,
      doctorPriority: (patPriority === 'emergency' ? 'urgent' : 'normal') as 'urgent' | 'normal'
    }),
    [tests, departments, counters, queueTokens, clinicalReports, telemetryNow, patPriority]
  );

  const testLiveEstimatesMap = useMemo(() => {
    const map: Record<string, TestLiveEstimate> = {};
    for (const test of tests) {
      map[test.id] = getTestLiveEstimate(test, telemetryContext);
    }
    return map;
  }, [tests, telemetryContext]);

  // Debounce walkinTestIds so rapid checkbox clicks (7+ tests) batch into one estimate call
  const [debouncedWalkinTestIds, setDebouncedWalkinTestIds] = useState<string[]>([]);
  const walkinDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (walkinDebounceRef.current) clearTimeout(walkinDebounceRef.current);
    walkinDebounceRef.current = setTimeout(() => {
      setDebouncedWalkinTestIds(walkinTestIds);
    }, 120);
    return () => { if (walkinDebounceRef.current) clearTimeout(walkinDebounceRef.current); };
  }, [walkinTestIds]);

  const walkinEstimate = useMemo(
    // Pass pre-computed map → engine skips redundant O(N) getTestLiveEstimate loop
    () => estimateWalkinInvestigations(debouncedWalkinTestIds, telemetryContext, testLiveEstimatesMap),
    [debouncedWalkinTestIds, telemetryContext, testLiveEstimatesMap]
  );

  const departmentTelemetry = useMemo(
    () => getAllDepartmentTelemetry(telemetryContext),
    [telemetryContext]
  );

  const lastSyncedLabel = useMemo(
    () =>
      telemetryNow.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
    [telemetryNow]
  );

  const hierarchicalReportPatients = useMemo(
    () =>
      buildHierarchicalReportPatients({
        patients,
        clinicalReports,
        historicalRecords: HISTORICAL_PATIENT_RECORDS,
        tests,
        departments
      }),
    [patients, clinicalReports, tests, departments]
  );

  const unreadReportPatientsCount = useMemo(
    () => hierarchicalReportPatients.filter(e => e.unreadCount > 0).length,
    [hierarchicalReportPatients]
  );

  // ==========================================
  // RETURNING PATIENT AUTO-SEARCH MATCHES
  // ==========================================
  const returningMatches = useMemo((): { histMatches: HistoricalPatientRecord[]; activeMatches: Patient[] } => {
    const q = returningSearchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return { histMatches: [], activeMatches: [] };
    const digits = q.replace(/\D/g, '');

    const histMatches = HISTORICAL_PATIENT_RECORDS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      (digits.length >= 3 && p.contact.replace(/\D/g, '').includes(digits))
    ).slice(0, 5);

    const activeMatches = patients.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      (digits.length >= 3 && p.contact.replace(/\D/g, '').includes(digits))
    ).slice(0, 3);

    return { histMatches, activeMatches };
  }, [returningSearchQuery, patients]);

  const handleSelectReturningPatient = (p: HistoricalPatientRecord | Patient) => {
    setPatName(p.name);
    setPatAge(String(p.age));
    setPatGender(p.gender as 'Male' | 'Female' | 'Other');
    setPatPhone(p.contact.replace(/\D/g, '').slice(-10));
    setPatComplaint(p.chiefComplaint || ('symptoms' in p ? (p.symptoms || '') : ''));
    setFormError('');
    setReturningSearchQuery('');
    setShowReturningDropdown(false);
  };

  const handleAutofillFromHistoricalModal = (item: HistoricalPatientRecord) => {
    setPatName(item.name);
    setPatAge(String(item.age));
    setPatGender(item.gender);
    setPatPhone(item.contact.replace(/\D/g, '').slice(-10));
    setPatComplaint(item.chiefComplaint);
    setFormError('');
    setMainViewMode('walkin');
  };

  // ==========================================
  // DIAGNOSTIC TEST FILTERING & SELECTION
  // ==========================================
  const filteredWalkinTests = useMemo(() => {
    return tests.filter(test => {
      if (walkinCategoryFilter !== 'all') {
        const dept = departments.find(d => d.id === test.departmentId);
        if (dept?.category !== walkinCategoryFilter) return false;
      }
      if (!walkinSearchFilter.trim()) return true;
      const q = walkinSearchFilter.toLowerCase().trim();
      return (
        test.name.toLowerCase().includes(q) ||
        test.technicalName.toLowerCase().includes(q) ||
        test.code.toLowerCase().includes(q)
      );
    });
  }, [tests, departments, walkinCategoryFilter, walkinSearchFilter]);

  const toggleWalkinTest = (testId: string) => {
    setWalkinTestIds(prev =>
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  // Preset Diagnostic Panels (Expanded with all Clinical Specialties)
  const TEST_BUNDLES = [
    { label: 'Routine OPD', ids: ['test-cbc', 'test-fbs'], desc: 'CBC + Fasting Blood Sugar' },
    { label: 'Cardiac Care', ids: ['test-ecg', 'test-cbc', 'test-lipid'], desc: '12-Lead ECG + CBC + Lipid' },
    { label: 'Fever Workup', ids: ['test-cbc', 'test-urine'], desc: 'CBC + Urinalysis Microscopy' },
    { label: 'Chest & Resp', ids: ['test-xray-chest', 'test-spirometry'], desc: 'Chest X-Ray + Spirometry PFT' },
    { label: 'Diabetic Panel', ids: ['test-fbs', 'test-ppbs', 'test-lipid'], desc: 'FBS + PPBS + Fasting Lipid' },
    { label: 'Ophthalmic Exam', ids: ['test-retina-oct', 'test-visual-acuity'], desc: 'Retinal OCT + Slit Lamp Exam' },
    { label: 'ENT & Audiology', ids: ['test-audiometry', 'test-tympanometry'], desc: 'Audiometry PTA + Tympanometry' },
    { label: 'Abdomen & Sonography', ids: ['test-usg-abdomen', 'test-urine'], desc: 'Abdominal USG + Urinalysis' },
    { label: 'Neuro Screen', ids: ['test-eeg', 'test-ncs'], desc: '32-Ch EEG + Nerve Conduction' },
    { label: 'Bone DEXA Scan', ids: ['test-dexa', 'test-cbc'], desc: 'DEXA Bone Densitometry + CBC' },
    { label: 'Executive Health Check', ids: ['test-cbc', 'test-fbs', 'test-lipid', 'test-ecg', 'test-xray-chest', 'test-usg-abdomen'], desc: 'Comprehensive Multi-Lab Screen' }
  ];

  const applyTestBundle = (ids: string[]) => {
    setWalkinTestIds(prev => Array.from(new Set([...prev, ...ids])));
  };

  // AI Chief Complaint Clinical Sentence Expander & Test Matcher
  const handleAiSuggestTests = () => {
    const raw = (patComplaint || '').trim();
    const lower = raw.toLowerCase();
    const suggested: string[] = [];
    const clinicalSentences: string[] = [];

    if (!raw) {
      setPatComplaint("Patient presents for routine clinical evaluation with generalized fatigue and mild body ache.");
      setWalkinTestIds(prev => Array.from(new Set([...prev, 'test-cbc', 'test-fbs'])));
      return;
    }

    if (/chest|tight|angina|palpitat|heart|sweat|breathless/i.test(lower)) {
      clinicalSentences.push("Patient presents with acute chest discomfort and exertional dyspnea.");
      suggested.push('test-ecg', 'test-xray-chest', 'test-cbc');
    }
    if (/sugar|diabet|thirst|urin|polyuria|fatigue|fbs|hba1c|glucose/i.test(lower)) {
      clinicalSentences.push("Patient reports uncontrolled blood glucose levels accompanied by polyuria and excessive thirst.");
      suggested.push('test-fbs', 'test-ppbs', 'test-lipid');
    }
    if (/fever|chills|cold|bodyache|weakness|vomit|infection|rigor|temp|bukhar/i.test(lower)) {
      clinicalSentences.push("Patient is suffering from high-grade fever associated with chills and generalized malaise.");
      suggested.push('test-cbc', 'test-urine');
    }
    if (/vision|eye|blur|see|cataract|retina|floaters|reading/i.test(lower)) {
      clinicalSentences.push("Patient reports progressive blurring of vision and difficulty with near-distance tasks.");
      suggested.push('test-retina-oct', 'test-visual-acuity');
    }
    if (/ear|hear|sound|ring|tinnitus|vertigo|throat|deaf|earache/i.test(lower)) {
      clinicalSentences.push("Patient complains of hearing difficulty accompanied by episodic tinnitus and vertigo.");
      suggested.push('test-audiometry', 'test-tympanometry');
    }
    if (/headache|seiz|fits|epilep|tremor|numb|tingl|migraine|faint|nerve|sir/i.test(lower)) {
      clinicalSentences.push("Patient presents with recurrent throbbing headaches and occasional episodes of lightheadedness.");
      suggested.push('test-eeg', 'test-ncs');
    }
    if (/cough|breath|wheez|asthma|lungs|phlegm|sputum|smoke|dyspnea|khansi/i.test(lower)) {
      clinicalSentences.push("Patient presents with persistent productive cough, wheezing, and exertional breathlessness.");
      suggested.push('test-spirometry', 'test-xray-chest');
    }
    if (/joint|knee|bone|fracture|back|spine|osteo|stiff|crepitus|dard/i.test(lower)) {
      clinicalSentences.push("Patient complains of bilateral joint pain and morning stiffness exacerbated by weight bearing.");
      suggested.push('test-dexa', 'test-cbc');
    }
    if (/abdom|stomach|liver|jaundice|pain|acidity|gas|digest|pelvic|pet/i.test(lower)) {
      clinicalSentences.push("Patient complains of diffuse abdominal discomfort, nausea, and epigastric tenderness.");
      suggested.push('test-usg-abdomen', 'test-cbc');
    }

    if (clinicalSentences.length > 0) {
      setPatComplaint(clinicalSentences.join(' '));
    } else {
      const clean = raw.charAt(0).toUpperCase() + raw.slice(1);
      setPatComplaint(clean.endsWith('.') ? `Patient presents with ${raw.toLowerCase()}.` : `Patient presents with ${raw.toLowerCase()}, requiring clinical investigation.`);
    }

    if (suggested.length === 0) {
      suggested.push('test-cbc', 'test-fbs');
    }

    setWalkinTestIds(prev => Array.from(new Set([...prev, ...suggested])));
  };

  // Quick symptom chip append helper
  const handleQuickSymptom = (symptom: string) => {
    setPatComplaint(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return symptom;
      if (trimmed.toLowerCase().includes(symptom.toLowerCase())) return prev;
      return `${trimmed}, ${symptom}`;
    });
  };

  // Web Speech API Voice Dictation
  const handleToggleVoiceDictation = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Safe ignore
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast('Voice dictation not supported in this browser. Please type symptoms or use Chrome.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = activeLanguage === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        showToast('🎙️ Listening... speak patient symptoms clearly');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setPatComplaint(prev => (prev ? `${prev}. ${transcript}` : transcript));
          showToast(`Transcribed: "${transcript}"`);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'no-speech') {
          showToast(`Microphone notification: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      showToast('Microphone access denied or unavailable.');
    }
  };

  // ==========================================
  // SUBMIT WALK-IN REGISTRATION & GENERATE THERMAL PASS
  // ==========================================
  const handleRegisterAndIssuePass = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanPhone = patPhone.replace(/\D/g, '');
    if (!patName.trim() || patName.trim().length < 2) {
      setFormError('Please enter a valid patient full name (at least 2 characters).');
      return;
    }
    const ageNum = parseInt(patAge, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setFormError('Please enter a valid age between 1 and 120.');
      return;
    }
    if (cleanPhone.length !== 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      const newPat = registerPatient({
        name: patName.trim(),
        age: ageNum,
        gender: patGender,
        contact: cleanPhone,
        chiefComplaint: patComplaint.trim() || 'General OPD consultation',
        priority: patPriority
      });

      if (walkinTestIds.length > 0) {
        prescribeTests(
          newPat.id,
          walkinTestIds,
          patPriority === 'emergency' ? 'urgent' : 'normal',
          patComplaint
        );
      }

      // Fetch the updated patient from the store with activeTokenIds and prescribedTests populated!
      const refreshedPat = getHospitalState().patients.find(p => p.id === newPat.id) || {
        ...newPat,
        prescribedTests: walkinTestIds,
        assignedSmartRoute: walkinTestIds,
        doctorReviewStatus: walkinTestIds.length > 0 ? 'awaiting_lab_reports' : 'awaiting_prescription',
        status: walkinTestIds.length > 0 ? 'in_transit' : 'registered'
      };

      // Reset form
      setPatName('');
      setPatAge('');
      setPatPhone('');
      setPatComplaint('');
      setPatPriority('standard');
      setWalkinTestIds([]);

      // Immediately display thermal QR pass with refreshed tests and tokens
      setSelectedPatientId(newPat.id);
      setReportSelectedPatientId(newPat.id);
      setSlipModalPatient(refreshedPat);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Registration failed. Please review input fields.');
    }
  };

  // ==========================================
  // HISTORICAL RECORDS FILTERING (56 PATIENTS)
  // ==========================================
  const filteredHistoricalRecords = useMemo(() => {
    return HISTORICAL_PATIENT_RECORDS.filter(item => {
      if (historicalCategoryFilter !== 'all') {
        if (historicalCategoryFilter === 'pathology' && !item.completedTests.includes('test-cbc')) return false;
        if (historicalCategoryFilter === 'biochemistry' && !item.completedTests.includes('test-fbs')) return false;
        if (historicalCategoryFilter === 'radiology' && !item.completedTests.includes('test-xray-chest')) return false;
        if (historicalCategoryFilter === 'cardiology' && !item.completedTests.includes('test-ecg')) return false;
        if (historicalCategoryFilter === 'ultrasound' && !item.completedTests.includes('test-usg-abdomen')) return false;
      }
      if (historicalSearch.trim()) {
        const q = historicalSearch.toLowerCase().trim();
        const digits = q.replace(/\D/g, '');
        const matchName = item.name.toLowerCase().includes(q);
        const matchUhid = item.uhid.toLowerCase().includes(q);
        const matchComplaint = item.chiefComplaint.toLowerCase().includes(q);
        const matchDiagnosis = item.diagnosisNotes.toLowerCase().includes(q);
        const matchPhone = digits.length >= 3 && item.contact.replace(/\D/g, '').includes(digits);
        return matchName || matchUhid || matchComplaint || matchDiagnosis || matchPhone;
      }
      return true;
    });
  }, [historicalSearch, historicalCategoryFilter]);

  // Clinical SVG visual badge for test cards
  const getTestVisualBadge = (testId: string, testCode: string) => {
    if (testId.includes('cbc') || testCode.startsWith('BLD-101')) {
      return (
        <svg className="w-5 h-5 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8 6 5 11 5 15a7 7 0 0 0 14 0c0-4-3-9-7-13Z" />
          <path d="M9 14a3 3 0 0 0 4.5 2.5" />
        </svg>
      );
    }
    if (testId.includes('fbs') || testId.includes('ppbs') || testId.includes('lipid') || testCode.startsWith('BIO')) {
      return (
        <svg className="w-5 h-5 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" />
          <circle cx="12" cy="16" r="1.5" fill="currentColor" />
        </svg>
      );
    }
    if (testId.includes('ecg') || testCode.startsWith('ECG')) {
      return (
        <svg className="w-5 h-5 text-teal-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h3l2.5-6 3.5 12 3-8 2 4h4" />
        </svg>
      );
    }
    if (testId.includes('xray') || testCode.startsWith('RAD')) {
      return (
        <svg className="w-5 h-5 text-slate-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M12 7v10M8 9c2 .5 6 .5 8 0M8 12c2 .5 6 .5 8 0M8 15c2 .5 6 .5 8 0" />
        </svg>
      );
    }
    if (testId.includes('usg') || testCode.startsWith('USG')) {
      return (
        <svg className="w-5 h-5 text-teal-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12c2.5-4 5.5-4 8 0s5.5 4 8 0 4-2 4-2" />
          <path d="M2 16c2.5-4 5.5-4 8 0s5.5 4 8 0" />
        </svg>
      );
    }
    if (testId.includes('retina') || testId.includes('acuity') || testCode.startsWith('EYE')) {
      return (
        <svg className="w-5 h-5 text-teal-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    }
    if (testId.includes('audio') || testId.includes('tympano') || testCode.startsWith('ENT')) {
      return (
        <svg className="w-5 h-5 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5Z" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      );
    }
    if (testId.includes('eeg') || testId.includes('ncs') || testCode.startsWith('NEU')) {
      return (
        <svg className="w-5 h-5 text-emerald-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a5 5 0 0 0-5 5c0 1.5.7 2.8 1.7 3.7A5 5 0 0 0 7 15a5 5 0 0 0 5 5 5 5 0 0 0 5-5c0-1.7-.8-3.2-2-4.1.9-.9 1.5-2.2 1.5-3.6a5 5 0 0 0-4.5-5.3Z" />
          <path d="M9 12h6M12 9v6" />
        </svg>
      );
    }
    if (testId.includes('spiro') || testCode.startsWith('PFT')) {
      return (
        <svg className="w-5 h-5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v10M7 8c2.5-3 5-3 5 0M17 8c-2.5-3-5-3-5 0" />
          <path d="M8 12c-3 1-5 4-5 8 0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2 0-4-2-7-5-8" />
        </svg>
      );
    }
    if (testId.includes('dexa') || testCode.startsWith('DEX')) {
      return (
        <svg className="w-5 h-5 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 4a2 2 0 0 0-2 2v2H9V6a2 2 0 1 0-4 0v12a2 2 0 1 0 4 0v-2h6v2a2 2 0 1 0 4 0V6a2 2 0 0 0-2-2Z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  };

  return (
    <div className="dp-root text-[var(--text-primary)] pb-4 w-full">
      <style>{DP_CSS}</style>

      {/* ========================================================
          1. STATIC FIXED COLLAPSIBLE WORKSTATION SIDEBAR
      ======================================================== */}
      <DoctorSidebar
        activeView={mainViewMode}
        onSelectView={setMainViewMode}
        isExpanded={sidebarExpanded}
        onToggleExpand={() => setSidebarExpanded(prev => !prev)}
        queueCount={patients.length}
        reportsCount={hierarchicalReportPatients.length}
        unreadReportsCount={unreadReportPatientsCount}
        recordsCount={HISTORICAL_PATIENT_RECORDS.length}
        onSignOut={signOut}
      />

      <div
        className={`w-full min-w-0 transition-[padding-left] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          sidebarExpanded ? 'md:pl-[228px]' : 'md:pl-[76px]'
        }`}
      >
        {/* ========================================================
            1. VIEW 0: CLINICAL DOCTOR DASHBOARD
        ======================================================== */}
        {mainViewMode === 'dashboard' && (
          <DoctorDashboardView
            doctorId={currentUser?.id || ''}
            doctorName={currentUser?.name || currentHospital.doctorName}
            doctorRoom={currentUser?.identifier || currentHospital.doctorRoom}
            patients={patients}
            recordsCount={HISTORICAL_PATIENT_RECORDS.length}
            reportPatients={hierarchicalReportPatients}
            onSelectView={setMainViewMode}
            onOpenQueueWithFilter={(filter, patId) => {
              setQueueFilter(filter);
              if (patId) setSelectedPatientId(patId);
              setMainViewMode('queue');
            }}
            onOpenPatientReports={patId => {
              setReportSelectedPatientId(patId);
              setMainViewMode('reports');
            }}
            onLoadDemoQueue={loadDoctorDemoPatients}
          />
        )}

        {/* ========================================================
            2. VIEW 1: BRIGHT WALK-IN REGISTRATION & ORDER BUILDER
        ======================================================== */}
        {mainViewMode === 'walkin' && (
        <BlurFade duration={0.2} offset={4}>
          <form onSubmit={handleRegisterAndIssuePass} className="space-y-4">
            {/* Mobile 2-Step Progress Indicator (< 1024px) */}
            <div className="lg:hidden flex items-center justify-between p-1 bg-[var(--bg-surface-subtle)] rounded-xl border border-[var(--border-default)] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMobileStep(1)}
                className={`flex-1 py-2 text-center rounded-lg transition-colors cursor-pointer ${
                  mobileStep === 1
                    ? 'bg-white text-[var(--accent-primary)] shadow-2xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                1. Patient Information
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!patName.trim()) {
                    setFormError('Please enter patient full name first.');
                    return;
                  }
                  setFormError('');
                  setMobileStep(2);
                }}
                className={`flex-1 py-2 text-center rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  mobileStep === 2
                    ? 'bg-white text-[var(--accent-primary)] shadow-2xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>2. Prescribe Tests</span>
                {walkinTestIds.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[var(--accent-primary)] text-white text-[10px] flex items-center justify-center font-bold tabular-nums">
                    {walkinTestIds.length}
                  </span>
                )}
              </button>
            </div>

            {/* Inline Form Error */}
            {formError && (
              <div
                role="alert"
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 dp-shake"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{formError}</span>
              </div>
            )}

            {/* 2-Column Clinical Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* COLUMN 1: PATIENT REGISTRATION FORM (5 Cols) */}
              <div
                className={`lg:col-span-5 glass-panel rounded-2xl p-5 flex flex-col space-y-4 ${
                  mobileStep === 1 ? 'block' : 'hidden lg:block'
                }`}
              >
                <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-subtle)]">
                  <div className="dp-ico">
                    <UserPlus className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                    New Patient
                  </h2>
                </div>

                {/* Returning Patient Search + Demo */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={returningSearchQuery}
                        onChange={e => {
                          setReturningSearchQuery(e.target.value);
                          setShowReturningDropdown(true);
                        }}
                        onFocus={() => setShowReturningDropdown(true)}
                        placeholder="Returning patient — name, UHID, phone"
                        className="dp-field w-full h-10 pl-9 pr-7 rounded-xl text-sm sm:text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                      />
                      {returningSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setReturningSearchQuery('')}
                          aria-label="Clear search"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={generateAiDemoPatient}
                      data-tooltip="Fill sample patient data"
                      className="h-8 px-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] hover:bg-white hover:border-[var(--border-input)] text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center transition-colors duration-150 cursor-pointer shrink-0"
                    >
                      Demo
                    </button>
                  </div>

                  {showReturningDropdown && returningSearchQuery.trim().length >= 2 && (
                    <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-[var(--border-default)] divide-y divide-[var(--border-subtle)] max-h-56 overflow-y-auto">
                      {returningMatches.histMatches.length === 0 && returningMatches.activeMatches.length === 0 ? (
                        <div className="p-3 text-xs text-[var(--text-secondary)] text-center">
                          No returning records found for "{returningSearchQuery}"
                        </div>
                      ) : (
                        returningMatches.histMatches.map(hist => (
                          <button
                            key={hist.id}
                            type="button"
                            onClick={() => handleSelectReturningPatient(hist)}
                            className="w-full text-left p-3 hover:bg-[var(--bg-surface-hover)] transition-colors flex items-center justify-between text-xs cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                                <span>{hist.name}</span>
                                <span className="font-mono text-[11px] text-[var(--text-secondary)]">({hist.uhid})</span>
                              </div>
                              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate">
                                {hist.age}Y · {hist.gender} · {hist.contact} · Visited {hist.visitDate}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-[var(--accent-primary)] shrink-0">Select</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Full Name */}
                <div>
                  <label className="dp-label">
                    Full name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={patName}
                      onChange={e => setPatName(e.target.value)}
                      placeholder="Patient full name"
                      className="dp-field w-full h-10 pl-10 pr-3 rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                    />
                  </div>
                </div>

                {/* Age & Gender Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="dp-label">
                      Age (years) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="number"
                        required
                        min={1}
                        max={120}
                        value={patAge}
                        onChange={e => setPatAge(e.target.value)}
                        placeholder="Age"
                        className="dp-field w-full h-10 pl-10 pr-3 rounded-xl text-sm text-[var(--text-primary)] tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="dp-label">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <div className="h-[44px] p-1 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] grid grid-cols-3 gap-0.5">
                      <AnimatedBackground
                        value={patGender}
                        onValueChange={val => {
                          if (val === 'Male' || val === 'Female' || val === 'Other') setPatGender(val);
                        }}
                        className="rounded-lg bg-white border border-[var(--border-subtle)] shadow-2xs"
                      >
                        {(['Male', 'Female', 'Other'] as const).map(g => (
                          <button
                            key={g}
                            type="button"
                            data-id={g}
                            className={`h-full rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                              patGender === g
                                ? 'text-[var(--accent-primary)]'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {g === 'Male' ? 'M' : g === 'Female' ? 'F' : 'O'}
                          </button>
                        ))}
                      </AnimatedBackground>
                    </div>
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="dp-label">
                    Mobile number <span className="text-rose-500">*</span>
                  </label>
                  <div className="dp-field flex rounded-xl overflow-hidden h-10">
                    <span className="inline-flex items-center px-3 bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] font-semibold text-xs border-r border-[var(--border-subtle)] shrink-0 font-mono">
                      +91
                    </span>
                    <div className="relative flex-1 flex items-center">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={patPhone}
                        onChange={e => setPatPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="98101 23456"
                        className="w-full h-full pl-9 pr-3 text-sm text-[var(--text-primary)] bg-transparent outline-none font-mono tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                {/* Chief Complaint with AI, Voice Dictation & Quick Dropdown */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label className="dp-label !mb-0 whitespace-nowrap">
                      Chief complaint & symptoms <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleToggleVoiceDictation}
                        data-tooltip={isListening ? 'Click to stop voice dictation' : 'Dictate symptoms by voice'}
                        className={`h-7 px-2 rounded-lg text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer ${
                          isListening
                            ? 'bg-rose-600 text-white'
                            : 'bg-[var(--bg-surface-subtle)] hover:bg-slate-200/80 text-[var(--text-primary)] border border-[var(--border-subtle)]'
                        }`}
                      >
                        <Mic className="w-3 h-3 shrink-0" />
                        <span>{isListening ? 'Listening...' : 'Voice'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAiSuggestTests}
                        data-tooltip="Expand symptoms & auto-select matching tests"
                        className="dp-ai h-7 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer"
                      >
                        <ListChecks className="w-3 h-3 text-white shrink-0" />
                        <span>AI Assist</span>
                      </button>

                      <div className="relative" ref={quickSymptomsRef}>
                        <button
                          type="button"
                          onClick={() => setShowQuickSymptoms(prev => !prev)}
                          className="h-7 px-2 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--bg-surface-subtle)] hover:bg-slate-200/80 border border-[var(--border-subtle)] rounded-lg flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer"
                        >
                          <span>Quick</span>
                          <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-150 ${showQuickSymptoms ? 'rotate-180' : ''}`} />
                        </button>
                        {showQuickSymptoms && (
                          <div className="absolute right-0 top-8 z-40 w-52 bg-white rounded-xl shadow-xl border border-[var(--border-default)] p-1.5 max-h-48 overflow-y-auto space-y-0.5">
                            {[
                              'Fever & chills',
                              'Chest tightness',
                              'High blood sugar',
                              'Eye blurring',
                              'Body ache',
                              'Abdominal pain',
                              'Persistent cough',
                              'Joint stiffness',
                              'Ear ringing & vertigo'
                            ].map(sym => (
                              <button
                                key={sym}
                                type="button"
                                onClick={() => {
                                  handleQuickSymptom(sym);
                                  setShowQuickSymptoms(false);
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent-primary)] rounded-lg transition-colors cursor-pointer"
                              >
                                + {sym}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={2}
                      value={patComplaint}
                      onChange={e => setPatComplaint(e.target.value)}
                      placeholder="Document symptoms (or type shorthand like 'fever' and click AI Assist)..."
                      className="dp-field w-full p-2.5 rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                    />
                  </div>
                </div>

                {/* Triage Classification */}
                <div>
                  <label className="dp-label">Triage classification</label>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <label
                      className={`p-3 rounded-xl flex items-center gap-2.5 cursor-pointer ${
                        patPriority === 'standard'
                          ? 'dp-tri on-teal font-semibold text-[var(--text-primary)]'
                          : 'dp-tri text-[var(--text-secondary)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="patPriority"
                        checked={patPriority === 'standard'}
                        onChange={() => setPatPriority('standard')}
                        className="sr-only"
                      />
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          patPriority === 'standard'
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]'
                            : 'border-[var(--border-input)]'
                        }`}
                      >
                        {patPriority === 'standard' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <span className="block leading-tight font-semibold">Standard OPD</span>
                        <span className="text-[10px] text-[var(--text-secondary)] font-normal">Routine Flow</span>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-xl flex items-center gap-2.5 cursor-pointer ${
                        patPriority === 'emergency'
                          ? 'dp-tri on-rose font-semibold text-rose-900'
                          : 'dp-tri text-[var(--text-secondary)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="patPriority"
                        checked={patPriority === 'emergency'}
                        onChange={() => setPatPriority('emergency')}
                        className="sr-only"
                      />
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          patPriority === 'emergency' ? 'border-rose-600 bg-rose-600' : 'border-[var(--border-input)]'
                        }`}
                      >
                        {patPriority === 'emergency' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <span className="block leading-tight font-semibold">Urgent / Priority</span>
                        <span className="text-[10px] text-rose-700 font-normal">Fast-Track Queue</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Mobile Continue CTA */}
                <div className="lg:hidden pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!patName.trim()) {
                        setFormError('Please enter patient full name.');
                        return;
                      }
                      if (!patPhone.trim() || patPhone.replace(/\D/g, '').length !== 10) {
                        setFormError('Please enter a valid 10-digit mobile number.');
                        return;
                      }
                      setFormError('');
                      setMobileStep(2);
                    }}
                    className="w-full h-11 dp-cta text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Prescribe Tests ({walkinTestIds.length})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* COLUMN 2: DIAGNOSTIC INVESTIGATIONS ORDER BUILDER (7 Cols) */}
              <div
                className={`lg:col-span-7 glass-panel rounded-2xl p-5 flex flex-col space-y-3.5 ${
                  mobileStep === 2 ? 'block' : 'hidden lg:block'
                }`}
              >
                <div className="lg:hidden pb-1">
                  <button
                    type="button"
                    onClick={() => setMobileStep(1)}
                    className="text-xs font-semibold text-[var(--accent-primary)] flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to patient information</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2.5">
                    <div className="dp-ico">
                      <FlaskConical className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                      Investigations
                    </h2>
                    {walkinTestIds.length > 0 && (
                      <span key={walkinTestIds.length} className="dp-badge dp-badge-pop tabular-nums">
                        {walkinTestIds.length}
                      </span>
                    )}
                    <svg className={`dp-ecg hidden sm:block ${walkinTestIds.length > 0 ? 'live' : ''}`} viewBox="0 0 96 24" aria-hidden="true">
                      <path pathLength="100" d="M0 12h26l4-1 5-9 7 20 6-15 4 5h44" />
                    </svg>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative" ref={quickBundlesRef}>
                      <button
                        type="button"
                        onClick={() => setShowQuickBundles(prev => !prev)}
                        className="dp-quick h-9 px-3 rounded-xl text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Bundles</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-150 ${showQuickBundles ? 'rotate-180' : ''}`} />
                      </button>
                      {showQuickBundles && (
                        <div className="absolute right-0 top-10 z-40 w-64 bg-white rounded-xl shadow-xl border border-[var(--border-default)] p-1.5 max-h-60 overflow-y-auto space-y-0.5">
                          <div className="px-2 py-1 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                            Diagnostic Bundles
                          </div>
                          {TEST_BUNDLES.map((b, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                applyTestBundle(b.ids);
                                setShowQuickBundles(false);
                              }}
                              className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[var(--accent-subtle)] transition-colors group cursor-pointer"
                            >
                              <div className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]">
                                {b.label}
                              </div>
                              <div className="text-[11px] text-[var(--text-secondary)]">
                                {b.desc}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative w-36 sm:w-44 shrink-0">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search tests..."
                        value={walkinSearchFilter}
                        onChange={e => setWalkinSearchFilter(e.target.value)}
                        className="dp-field dp-sm w-full h-9 pl-8 pr-6 text-base sm:text-xs rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                      />
                      {walkinSearchFilter && (
                        <button
                          type="button"
                          onClick={() => setWalkinSearchFilter('')}
                          aria-label="Clear test filter"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Diagnostic Test Cards Grid (Clean Typographic Telemetry) */}
                <div className="dp-scroll flex-1 min-h-[300px] max-h-[380px] overflow-y-auto pr-1 py-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 content-start">
                  {filteredWalkinTests.map(test => {
                    const isChecked = walkinTestIds.includes(test.id);
                    const dept = departments.find(d => d.id === test.departmentId);
                    const liveEst = testLiveEstimatesMap[test.id];
                    const dotToneClass =
                      liveEst?.loadStatus === 'unavailable'
                        ? 'bg-[var(--danger)]'
                        : liveEst?.loadStatus === 'busy' || liveEst?.loadStatus === 'moderate'
                          ? 'bg-[var(--status-warning)]'
                          : 'bg-[var(--status-success)]';

                    return (
                      <div
                        key={test.id}
                        data-custom-tooltip="true"
                        onClick={() => {
                          toggleWalkinTest(test.id);
                          handleTestMouseLeave();
                        }}
                        onMouseEnter={e => handleTestMouseEnter(test.id, e)}
                        onMouseLeave={handleTestMouseLeave}
                        className={`dp-test ${isChecked ? 'is-checked' : ''} p-3 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer select-none`}
                        role="checkbox"
                        aria-checked={isChecked}
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            toggleWalkinTest(test.id);
                            handleTestMouseLeave();
                          }
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="dp-test-ico w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                            {getTestVisualBadge(test.id, test.code)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-[13px] text-[var(--text-primary)] block truncate">
                              {test.name}
                            </span>
                            <span className="text-[11px] text-[var(--text-secondary)] block truncate mt-0.5 tabular-nums">
                              {dept ? `${dept.location.room}` : 'Lab'}
                              {liveEst && !liveEst.isUnavailable
                                ? ` · ${liveEst.liveWaitingCount} in Q · ${liveEst.throughputPerHour}/hr`
                                : ''}
                              {test.requiresFasting && ' · Fasting'}
                              {test.requiresFullBladder && ' · Full bladder'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {liveEst && (
                            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[var(--text-secondary)] tabular-nums">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotToneClass}`} />
                              <span>{liveEst.isUnavailable ? 'Closed' : `~${liveEst.estimatedTotalMinutes}m`}</span>
                            </span>
                          )}

                          <div className="dp-check shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Editorial Diagnostic Turnaround Summary & Color-Keyed Route Legend */}
                {walkinTestIds.length > 0 && (
                  <div
                    data-testid="qcare-estimate-panel"
                    className="pt-3.5 border-t border-[var(--border-subtle)] space-y-2.5"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                          Estimated Completion
                        </span>
                        <span
                          data-testid="qcare-total-minutes"
                          className="font-mono text-lg font-bold text-[var(--text-primary)] tabular-nums tracking-tight leading-[1.1]"
                        >
                          ~{walkinEstimate.totalEstimatedMinutes} min
                        </span>
                        <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                          · Ready ~{walkinEstimate.readyAtTime}
                        </span>
                        {walkinEstimate.timeSavedMinutes > 0 && (
                          <span className="text-xs font-semibold text-[var(--status-success)] tabular-nums">
                            · {walkinEstimate.timeSavedMinutes}m saved via smart order
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)] tabular-nums">
                        <span>
                          {walkinEstimate.transitMinutes}m walk + {Math.max(0, walkinEstimate.totalEstimatedMinutes - walkinEstimate.transitMinutes)}m lab queue
                        </span>
                        {walkinTestIds.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setWalkinTestIds([])}
                            className="font-semibold text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors duration-150 cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Circular Pie Chart + Compact Legend */}
                    {(() => {
                      const SEG_COLORS = [
                        'var(--seg-1)',
                        'var(--seg-2)',
                        'var(--seg-3)',
                        'var(--seg-4)',
                        'var(--seg-5)',
                      ];
                      const SEG_HEX = ['#0F766E', '#0284C7', '#D97706', '#4F46E5', '#059669'];
                      const stepSum = Math.max(
                        1,
                        walkinEstimate.steps.reduce((acc, s) => acc + Math.max(1, s.stepTotalMinutes), 0)
                      );
                      const R = 36; // outer radius
                      const GAP_DEG = walkinEstimate.steps.length > 1 ? 2.5 : 0;
                      const CX = 44;
                      const CY = 44;
                      const SIZE = 88;
                      const INNER_R = 22; // donut hole

                      // Build arcs
                      const toRad = (deg: number) => (deg * Math.PI) / 180;
                      const polarToXY = (cx: number, cy: number, r: number, deg: number) => ({
                        x: cx + r * Math.cos(toRad(deg - 90)),
                        y: cy + r * Math.sin(toRad(deg - 90)),
                      });

                      let cursor = 0;
                      const arcs = walkinEstimate.steps.map((step, idx) => {
                        const slice = (Math.max(1, step.stepTotalMinutes) / stepSum) * 360;
                        const startDeg = cursor + GAP_DEG / 2;
                        const endDeg = cursor + slice - GAP_DEG / 2;
                        cursor += slice;

                        const o1 = polarToXY(CX, CY, R, startDeg);
                        const o2 = polarToXY(CX, CY, R, endDeg);
                        const i1 = polarToXY(CX, CY, INNER_R, endDeg);
                        const i2 = polarToXY(CX, CY, INNER_R, startDeg);
                        const large = slice - GAP_DEG > 180 ? 1 : 0;

                        const d = [
                          `M ${o1.x} ${o1.y}`,
                          `A ${R} ${R} 0 ${large} 1 ${o2.x} ${o2.y}`,
                          `L ${i1.x} ${i1.y}`,
                          `A ${INNER_R} ${INNER_R} 0 ${large} 0 ${i2.x} ${i2.y}`,
                          'Z',
                        ].join(' ');

                        return { d, color: SEG_HEX[idx % 5], cssVar: SEG_COLORS[idx % 5], step, idx };
                      });

                      return (
                        <div className="flex items-start gap-4 pt-1">
                          {/* Pie */}
                          <div className="shrink-0 relative" style={{ width: SIZE, height: SIZE }}>
                            <svg
                              width={SIZE}
                              height={SIZE}
                              viewBox={`0 0 ${SIZE} ${SIZE}`}
                              role="img"
                              aria-label={`Time breakdown: ${stepSum} minutes total`}
                            >
                              {arcs.map(({ d, color, step }) => (
                                <path
                                  key={step.testId}
                                  d={d}
                                  fill={color}
                                  opacity={0.92}
                                />
                              ))}
                              {/* Center label */}
                              <text
                                x={CX}
                                y={CY - 5}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="12"
                                fontWeight="700"
                                fontFamily="ui-monospace, monospace"
                                fill="var(--text-primary)"
                              >
                                ~{walkinEstimate.totalEstimatedMinutes}
                              </text>
                              <text
                                x={CX}
                                y={CY + 9}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="8"
                                fontWeight="500"
                                fontFamily="system-ui, sans-serif"
                                fill="var(--text-secondary)"
                                letterSpacing="0.04em"
                              >
                                MIN
                              </text>
                            </svg>
                          </div>

                          {/* Legend */}
                          <div className="flex-1 min-w-0 space-y-0">
                            {arcs.map(({ cssVar, step }) => (
                              <div
                                key={step.testId}
                                className="flex items-center justify-between gap-2 py-[5px] border-b border-[var(--border-subtle)]/60 text-xs last:border-b-0"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-2 h-2 rounded-sm shrink-0"
                                    style={{ backgroundColor: cssVar }}
                                  />
                                  <span className="font-mono text-[10px] text-[var(--text-tertiary)] tabular-nums shrink-0">
                                    {step.stepNumber}.
                                  </span>
                                  <span className="font-medium text-[var(--text-primary)] truncate leading-tight">
                                    {step.testName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="font-mono text-[11px] text-[var(--text-secondary)] tabular-nums">
                                    ~{step.stepTotalMinutes}m
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleWalkinTest(step.testId)}
                                    aria-label={`Remove ${step.testName}`}
                                    data-tooltip={`Remove ${step.testName}`}
                                    className="text-[var(--text-tertiary)] hover:text-[var(--danger)] p-0.5 rounded transition-colors duration-150 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-[var(--text-primary)] font-bold text-xs block tabular-nums">
                      {walkinTestIds.length > 0
                        ? `${walkinTestIds.length} test${walkinTestIds.length > 1 ? 's' : ''} selected · Est. ~${walkinEstimate.totalEstimatedMinutes}m`
                        : '0 tests selected'}
                    </span>
                    <span className="text-[var(--text-secondary)] text-[11px] block truncate">
                      {walkinTestIds.length > 0
                        ? `Optimal route ready (~${walkinEstimate.readyAtTime}) · Issue printable QR pass`
                        : 'Select investigations or register directly'}
                    </span>
                  </div>
                  <button
                    type="submit"
                    data-tooltip="Print thermal QR pass & route patient"
                    className="dp-cta h-11 px-5 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Register & Issue Pass</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </BlurFade>
      )}

      {/* ========================================================
          3. VIEW 2: UNCLUTTERED OPD QUEUE & CLINICAL WORKSPACE
      ======================================================== */}
      {mainViewMode === 'queue' && (
        <DoctorQueueWorkspace
          patients={patients}
          filteredPatients={filteredPatients}
          selectedPatient={selectedPatient}
          onSelectPatient={setSelectedPatientId}
          tests={tests}
          departments={departments}
          queueTokens={queueTokens}
          patientReports={patientReports}
          queueFilter={queueFilter}
          onChangeQueueFilter={setQueueFilter}
          queueSearchQuery={queueSearchQuery}
          onChangeQueueSearch={setQueueSearchQuery}
          waitingCount={waitingCount}
          inDiagCount={inDiagCount}
          reportsReadyCount={reportsReadyCount}
          completedCount={completedCount}
          workspaceTab={workspaceTab}
          onChangeWorkspaceTab={setWorkspaceTab}
          doctorConclusionNotes={doctorConclusionNotes}
          onChangeConclusionNotes={setDoctorConclusionNotes}
          onOpenSlip={p => setSlipModalPatient(p)}
          onOpenPatientView={id => selectAndLoginPatient(id)}
          onEditTests={p => {
            setPatName(p.name);
            setPatAge(String(p.age));
            setPatGender(p.gender);
            setPatPhone(p.contact.replace(/\D/g, '').slice(-10));
            setPatComplaint(p.chiefComplaint || '');
            setWalkinTestIds(p.prescribedTests);
            setMainViewMode('walkin');
          }}
          onSwitchToWalkin={() => setMainViewMode('walkin')}
          onVerifyAndDischarge={(id, notes) => {
            verifyAndDischargePatient(id, notes);
            setDoctorConclusionNotes('');
          }}
          onLoadDemoQueue={loadDoctorDemoPatients}
        />
      )}

      {/* ========================================================
          3.5 VIEW 2B: HIERARCHICAL PATIENT REPORTS HUB
      ======================================================== */}
      {mainViewMode === 'reports' && (
        <DoctorReportsView
          entries={hierarchicalReportPatients}
          hospitalName={currentHospital.name}
          selectedPatientId={reportSelectedPatientId}
          onSelectPatientId={setReportSelectedPatientId}
          onVerifySingleReport={(repId, notes) => verifyLabReport(repId, notes)}
          onVerifyAndDischarge={(patId, notes) => verifyAndDischargePatient(patId, notes)}
          onSwitchToWalkin={() => setMainViewMode('walkin')}
        />
      )}

      {/* ========================================================
          4. VIEW 3: OUTPATIENT RECORDS ARCHIVE (56 PATIENTS)
      ======================================================== */}
      {mainViewMode === 'records' && (
        <BlurFade duration={0.2} offset={4}>
          <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="dp-ico">
                  <FolderArchive className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="font-bold text-base text-[var(--text-primary)] tracking-tight">
                      Outpatient Records Archive
                    </h2>
                    <span className="font-mono text-xs text-[var(--text-tertiary)] tabular-nums">
                      {HISTORICAL_PATIENT_RECORDS.length} records
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Verified outpatient records over the past 6 months · {currentHospital.name}
                  </p>
                </div>
              </div>

              <span className="text-xs font-medium text-[var(--text-secondary)] tabular-nums">
                Showing {filteredHistoricalRecords.length} of {HISTORICAL_PATIENT_RECORDS.length}
              </span>
            </div>

            <div className="p-4 border-b border-[var(--border-subtle)] bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { id: 'all', label: `All (${HISTORICAL_PATIENT_RECORDS.length})` },
                  { id: 'pathology', label: 'Pathology / CBC' },
                  { id: 'biochemistry', label: 'Biochemistry / FBS' },
                  { id: 'cardiology', label: 'Cardiology / ECG' },
                  { id: 'radiology', label: 'Radiology / X-Ray' },
                  { id: 'ultrasound', label: 'Ultrasound / USG' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setHistoricalCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      historicalCategoryFilter === cat.id
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={historicalSearch}
                  onChange={e => setHistoricalSearch(e.target.value)}
                  placeholder="Search UHID, name, contact..."
                  className="w-full h-9 pl-9 pr-7 text-xs rounded-xl border border-[var(--border-input)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--focus-ring)] bg-white"
                />
                {historicalSearch && (
                  <button
                    type="button"
                    onClick={() => setHistoricalSearch('')}
                    aria-label="Clear archive search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="dp-scroll max-h-[620px] overflow-y-auto p-3 sm:p-4 space-y-2.5">
              {filteredHistoricalRecords.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-secondary)]">
                  <p className="text-xs">No historical records match your search criteria.</p>
                </div>
              ) : (
                filteredHistoricalRecords.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-[var(--border-default)] bg-white hover:border-[var(--accent-primary)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{item.uhid}</span>
                        <span className="font-bold text-sm text-[var(--text-primary)]">{item.name}</span>
                        <span className="text-[var(--text-secondary)]">({item.age}Y · {item.gender})</span>
                        <span className="font-mono text-[var(--text-secondary)]">{item.contact}</span>
                        <span className="text-[11px] font-semibold text-[var(--status-success)]">Completed</span>
                      </div>
                      <p className="text-[var(--text-secondary)] text-xs">
                        <span className="font-semibold text-[var(--text-primary)]">Complaint:</span> {item.chiefComplaint}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[var(--text-secondary)]">
                        <span>Investigations:</span>
                        {item.testNames.map((tName, tIdx) => (
                          <span key={tIdx} className="bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-md text-[var(--text-primary)] font-medium">
                            {tName}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <span className="text-[11px] font-mono text-[var(--text-tertiary)] tabular-nums">{item.visitDate}</span>
                      <button
                        type="button"
                        onClick={() => handleAutofillFromHistoricalModal(item)}
                        className="h-8 px-3 bg-[var(--accent-subtle)] hover:bg-[#d4efe9] border border-[var(--status-success-border)] text-[var(--accent-primary)] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Autofill walk-in</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </BlurFade>
      )}
      </div>

      {/* ========================================================
          5. PRINTABLE THERMAL QR SLIP MODAL
      ======================================================== */}
      {slipModalPatient && (
        <PrintableSlip
          patient={slipModalPatient}
          tests={tests}
          departments={departments}
          onClose={() => setSlipModalPatient(null)}
        />
      )}

      {/* ========================================================
          6. SINGLE BRIGHT DIAGNOSTIC TEST DETAIL TOOLTIP
      ======================================================== */}
      {hoveredTest && (() => {
        const hTest = tests.find(t => t.id === hoveredTest.id);
        if (!hTest) return null;
        const hDept = departments.find(d => d.id === hTest.departmentId);
        const hEst = testLiveEstimatesMap[hTest.id];
        const isNearTop = hoveredTest.top < 170;
        const safeLeft =
          typeof window !== 'undefined'
            ? Math.max(150, Math.min(window.innerWidth - 150, hoveredTest.left))
            : hoveredTest.left;

        return (
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              top: isNearTop ? `${hoveredTest.top + 66}px` : `${hoveredTest.top - 10}px`,
              left: `${safeLeft}px`,
              transform: isNearTop ? 'translateX(-50%)' : 'translate(-50%, -100%)'
            }}
            className={`qcare-bright-tooltip ${isNearTop ? 'tip-below' : 'tip-above'}`}
          >
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[var(--border-subtle)]">
              <span className="font-bold text-xs text-[var(--text-primary)] truncate">{hTest.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)] font-semibold shrink-0">
                {hTest.code}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-primary)] truncate">
                  <MapPin className="w-3 h-3 text-[var(--accent-primary)] shrink-0" />
                  <span className="truncate">{hDept?.location.room} · {hDept?.location.floor}</span>
                </span>
                <span className="inline-flex items-center gap-1 font-mono font-semibold text-[var(--status-success)] shrink-0 tabular-nums">
                  <Clock className="w-3 h-3" />
                  <span>~{hEst ? hEst.estimatedTotalMinutes : hTest.averageDurationMinutes}m</span>
                </span>
              </div>

              {hEst && (
                <div className="px-2 py-1 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-primary)] flex items-center justify-between gap-2 tabular-nums">
                  <span>Lab avg {hEst.effectiveServiceMinutes}m + Q {hEst.queueWaitMinutes}m</span>
                  <span className="font-bold text-[var(--accent-primary)]">{hEst.throughputPerHour}/hr</span>
                </div>
              )}

              {hDept?.location.directions && (
                <p className="text-[10.5px] text-[var(--text-secondary)] leading-[1.4]">
                  <strong className="font-semibold text-[var(--text-primary)]">Route:</strong> {hDept.location.directions}
                </p>
              )}

              <div className="pt-1.5 border-t border-[var(--border-subtle)] text-[10.5px] font-medium text-[var(--status-warning)]">
                {hTest.requiresFasting
                  ? 'Fasting required (8–10 hrs, water permitted)'
                  : hTest.requiresFullBladder
                    ? 'Full bladder required prior to scan'
                    : hTest.preparationNotes || 'No special fasting required'}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
