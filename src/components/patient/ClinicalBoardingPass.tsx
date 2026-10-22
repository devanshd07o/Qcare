import React from 'react';
import {
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight,
  Check,
  AlertCircle,
  FileText,
  Printer,
  Stethoscope,
  Map as MapIcon,
  RotateCcw
} from 'lucide-react';
import { Patient, QueueRoutingPlan, RouteStep, QueueToken, Counter, Department, DiagnosticTest } from '../../types';
import { formatWaitRange } from '../../engine/queueRouter';
import { TRANSLATIONS } from '../../i18n/translations';
import { useHospitalStore } from '../../store/useHospitalStore';

interface ClinicalBoardingPassProps {
  patient: Patient;
  routingPlan: QueueRoutingPlan;
  upNextStep?: RouteStep;
  upNextToken?: QueueToken;
  calledToken?: QueueToken;
  inProgressToken?: QueueToken;
  allCompleted: boolean;
  activeCounter?: Counter;
  activeDept?: Department;
  waitingAheadCount: number;
  bloodLabWaitingCount?: number;
  language?: 'en' | 'hi';
  tests?: DiagnosticTest[];
  departments?: Department[];
  counters?: Counter[];
  queueTokens?: QueueToken[];
  selectedManualTestId?: string | null;
  onSelectManualTest?: (testId: string | null) => void;
  onViewReports?: () => void;
  onOpenRadar?: () => void;
  onOpenSimulator?: () => void;
  onPrintSlip?: () => void;
}

export const ClinicalBoardingPass: React.FC<ClinicalBoardingPassProps> = ({
  patient,
  routingPlan,
  upNextStep,
  upNextToken,
  calledToken,
  inProgressToken,
  allCompleted,
  activeCounter,
  activeDept,
  waitingAheadCount,
  language = 'en',
  tests,
  departments,
  counters,
  queueTokens,
  selectedManualTestId,
  onSelectManualTest,
  onViewReports,
  onOpenRadar,
  onPrintSlip
}) => {
  const { markTestCompletedByPatient, clinicalReports } = useHospitalStore();
  const t = TRANSLATIONS[language];
  const doctorRoom = patient.prescribedDoctorRoom || 
    (patient.prescribedDoctorId === 'doc-01' ? 'Room 204' : patient.prescribedDoctorId === 'doc-02' ? 'Room 108' : 'Room 12');

  const isDischarged = patient.status === 'discharged' || patient.doctorReviewStatus === 'completed';

  // Manual next test selection state
  const [internalManualTestId, setInternalManualTestId] = React.useState<string | null>(null);
  const activeManualTestId = selectedManualTestId !== undefined ? selectedManualTestId : internalManualTestId;
  const handleSelectManual = (testId: string | null) => {
    if (onSelectManualTest) onSelectManualTest(testId);
    setInternalManualTestId(testId);
  };

  const isManualActive = !!activeManualTestId && !patient.completedTests.includes(activeManualTestId);
  const manualSelectedStep = isManualActive
    ? routingPlan.smartRouteSteps.find(s => s.testId === activeManualTestId)
    : undefined;

  const effectiveStep = manualSelectedStep || upNextStep;
  const effectiveTest = tests?.find(t => t.id === effectiveStep?.testId);
  const effectiveDept = departments?.find(d => d.id === (effectiveStep?.departmentId || effectiveTest?.departmentId)) || activeDept;

  // Queue visibility metrics & calculation formula: (Patients Ahead × Avg Duration ÷ Active Machines)
  const targetDeptTokens = queueTokens
    ? queueTokens.filter(t => t.departmentId === effectiveDept?.id && t.status === 'waiting' && t.patientId !== patient.id)
    : [];
  const calculatedPatientsAhead = queueTokens ? targetDeptTokens.length : waitingAheadCount;
  const avgDurationMinutes = effectiveTest?.averageDurationMinutes || effectiveStep?.estimatedDurationMinutes || 10;
  const isDeptClosed = effectiveDept?.availabilityStatus === 'unavailable' || (effectiveDept?.activeMachines !== undefined && effectiveDept.activeMachines <= 0);
  const activeMachines = isDeptClosed
    ? 0
    : Math.max(1, effectiveDept?.activeMachines ?? (counters?.filter(c => c.departmentId === effectiveDept?.id && c.status === 'active').length || 1));
  const calculatedWaitMinutes = isDeptClosed
    ? 90
    : (calculatedPatientsAhead === 0 ? 0 : Math.max(1, Math.round((calculatedPatientsAhead * avgDurationMinutes) / Math.max(1, activeMachines))));
  const effectiveWaitRange = isDeptClosed ? 'Lab Unavailable / Extended Delay' : formatWaitRange(calculatedWaitMinutes);

  // Check for unavailable labs in prescribed tests
  const unavailablePrescriptions = patient.prescribedTests
    .filter(tId => !patient.completedTests.includes(tId))
    .map(tId => {
      const test = tests?.find(t => t.id === tId);
      const dept = departments?.find(d => d.id === test?.departmentId);
      const isUnavailable = dept?.availabilityStatus === 'unavailable' || (dept?.activeMachines !== undefined && dept.activeMachines <= 0);
      return isUnavailable ? { test, dept } : null;
    })
    .filter(Boolean) as { test?: DiagnosticTest; dept?: Department }[];

  // Determine Primary Destination Directive
  let directiveBadge = t.upNext;
  let directiveBadgeColor = 'bg-blue-600 text-white';
  let directiveTitle = '';
  let directiveSubtitle = '';
  let targetRoom = '';
  let targetLocation = '';
  let waitMinutesText = '';

  if (isDischarged) {
    directiveBadge = language === 'hi' ? 'परामर्श समाप्त • डिस्चार्ज' : 'Consultation Completed • Discharged';
    directiveBadgeColor = 'bg-emerald-700 text-white';
    directiveTitle = `${language === 'hi' ? 'अंतिम रिपोर्ट समीक्षा संपन्न:' : 'Care Summary: Finalized with'} ${patient.prescribedDoctorName}`;
    directiveSubtitle = language === 'hi'
      ? `आपकी सभी जांचें व रिपोर्ट समीक्षा पूरी हो चुकी हैं। ओपीडी टोकन #${patient.opdTokenNumber || 'OPD-104'} संपन्न हुआ।`
      : `Your final consultation, test evaluations, and report review are complete. You are discharged. OPD Token #${patient.opdTokenNumber || 'OPD-104'} is marked completed.`;
    targetRoom = doctorRoom;
    targetLocation = language === 'hi' ? 'डिस्चार्ज' : 'Discharged / Completed';
    waitMinutesText = language === 'hi' ? 'पूर्ण' : 'Completed';
  } else if (calledToken) {
    directiveBadge = language === 'hi' ? 'टोकन बुलाया गया • तुरंत जाएं' : 'Token Called • Proceed Now';
    directiveBadgeColor = 'bg-amber-500 text-slate-900 animate-pulse';
    directiveTitle = `${language === 'hi' ? 'यहां जाएं:' : 'Go to:'} ${activeCounter?.name || 'Testing Counter'} (${activeDept?.code || 'LAB'})`;
    directiveSubtitle = language === 'hi'
      ? `आपका टोकन #${calledToken.tokenNumber} बुलाया गया है। कृपया तुरंत अंदर जाएं।`
      : `Your token #${calledToken.tokenNumber} is called. Please head inside now.`;
    targetRoom = activeDept?.location.room || 'Assigned Room';
    targetLocation = `${activeDept?.location.wing || ''}, ${activeDept?.location.floor || ''}`;
    waitMinutesText = language === 'hi' ? 'बुलाया गया' : 'Called';
  } else if (inProgressToken) {
    directiveBadge = language === 'hi' ? 'जांच जारी है' : 'Test In Progress';
    directiveBadgeColor = 'bg-blue-600 text-white';
    directiveTitle = `${language === 'hi' ? 'वर्तमान में यहां:' : 'Currently at'} ${activeCounter?.name || 'Station'}`;
    directiveSubtitle = language === 'hi'
      ? 'आपकी जांच चल रही है। पूरा होते ही अगला कदम यहां दिखेगा।'
      : 'Your test is in progress. Once complete, your next stop will appear here.';
    targetRoom = activeDept?.location.room || 'Test Room';
    targetLocation = `${activeDept?.location.wing || ''}, ${activeDept?.location.floor || ''}`;
    waitMinutesText = language === 'hi' ? 'जारी' : 'In progress';
  } else if (allCompleted) {
    directiveBadge = language === 'hi' ? 'सभी जांचें पूर्ण • डॉक्टर के पास जाएं' : 'All Diagnostic Tests Completed';
    directiveBadgeColor = 'bg-emerald-600 text-white';
    directiveTitle = language === 'hi' ? 'सभी जांचें पूर्ण (All Diagnostic Tests Completed)' : 'All Diagnostic Tests Completed';
    directiveSubtitle = language === 'hi'
      ? `आपकी सभी जांचें पूरी हो चुकी हैं। Please return to your doctor / consultation area (${doctorRoom}).`
      : `All Diagnostic Tests Completed. Please return to your doctor / consultation area (${doctorRoom}). All reports are verified and signed.`;
    targetRoom = doctorRoom;
    targetLocation = 'OPD Consulting';
    waitMinutesText = language === 'hi' ? 'समीक्षा हेतु तैयार' : 'Ready for review';
  } else if (patient.prescribedTests.length === 0) {
    directiveBadge = language === 'hi' ? 'कदम 1: डॉक्टर से मिलें' : 'Step 1: Consult Doctor';
    directiveBadgeColor = 'bg-blue-600 text-white';
    directiveTitle = `${patient.prescribedDoctorName} ${language === 'hi' ? 'से परामर्श' : 'Consultation'}`;
    directiveSubtitle = `${doctorRoom} ${language === 'hi' ? 'में परामर्श के लिए जाएं (टोकन #' : 'for your OPD consultation (Token #'}${patient.opdTokenNumber || 'OPD-100'}).`;
    targetRoom = doctorRoom;
    targetLocation = 'OPD Floor';
    waitMinutesText = language === 'hi' ? 'पंजीकृत' : 'Check-in Complete';
  } else if (isManualActive && manualSelectedStep) {
    directiveBadge = language === 'hi' ? 'मरीज द्वारा चुनी गई जांच' : 'Patient Selected Next';
    directiveBadgeColor = 'bg-indigo-600 text-white';
    directiveTitle = `${language === 'hi' ? 'यहां जाएं: ' : 'Go to: '} ${manualSelectedStep.location.room} (${manualSelectedStep.testName})`;
    directiveSubtitle = language === 'hi'
      ? 'आपने इस जांच को प्राथमिकता दी है। आप कभी भी AI अनुशंसित मार्ग पर रीसेट कर सकते हैं।'
      : 'You have manually selected this destination. Click "Reset to AI Recommended" to restore the fastest AI route.';
    targetRoom = manualSelectedStep.location.room;
    targetLocation = `${manualSelectedStep.location.wing}, ${manualSelectedStep.location.floor}`;
    waitMinutesText = `~${effectiveWaitRange} ${t.mins}`;
  } else if (upNextStep) {
    directiveBadge = language === 'hi' ? 'AI अनुशंसित (सर्वोत्तम)' : 'AI Recommended (Optimal)';
    directiveBadgeColor = 'bg-blue-600 text-white';
    directiveTitle = `${language === 'hi' ? 'यहां जाएं: ' : 'Go to: '} ${upNextStep.location.room} (${upNextStep.testName})`;
    directiveSubtitle = upNextStep.reasonForSequence || (language === 'hi' ? 'कम से कम प्रतीक्षा समय के लिए इस जांच की सिफारिश की गई है।' : 'Optimal route assigned to minimize your overall wait time.');
    targetRoom = upNextStep.location.room;
    targetLocation = `${upNextStep.location.wing}, ${upNextStep.location.floor}`;
    waitMinutesText = `~${effectiveWaitRange} ${t.mins}`;
  } else {
    directiveBadge = 'Standby';
    directiveBadgeColor = 'bg-slate-700 text-white';
    directiveTitle = 'Waiting for Updates';
    directiveSubtitle = 'Please check in with the reception or doctor.';
    targetRoom = doctorRoom;
    targetLocation = 'Hospital Floor';
    waitMinutesText = 'Standby';
  }

  const activeTokenNumber = isDischarged
    ? `${patient.opdTokenNumber || 'OPD-104'} (Done)`
    : calledToken?.tokenNumber || (allCompleted && patient.opdTokenNumber ? patient.opdTokenNumber : upNextToken?.tokenNumber) || (effectiveStep ? `${effectiveStep.testCode}-0${effectiveStep.stepNumber}` : patient.opdTokenNumber || 'OPD-REG');

  // ---- Visual tone (presentation only; derived from existing directive state) ----
  const tone: 'called' | 'done' | 'manual' | 'standby' | 'info' =
    directiveBadgeColor.includes('amber') ? 'called'
    : directiveBadgeColor.includes('emerald') ? 'done'
    : directiveBadgeColor.includes('indigo') ? 'manual'
    : directiveBadgeColor.includes('slate') ? 'standby'
    : 'info';

  const TONES = {
    called:  { bar: 'bg-amber-500',   chip: 'bg-amber-50 text-amber-900 border-amber-300/80',     dot: 'bg-amber-500',   num: 'text-amber-800' },
    done:    { bar: 'bg-emerald-600', chip: 'bg-emerald-50 text-emerald-900 border-emerald-300/80', dot: 'bg-emerald-600', num: 'text-emerald-800' },
    manual:  { bar: 'bg-indigo-600',  chip: 'bg-indigo-50 text-indigo-900 border-indigo-300/80',   dot: 'bg-indigo-600',  num: 'text-indigo-800' },
    standby: { bar: 'bg-slate-400',   chip: 'bg-slate-100 text-slate-700 border-slate-300/80',     dot: 'bg-slate-400',   num: 'text-slate-700' },
    info:    { bar: 'bg-teal-600',    chip: 'bg-teal-50 text-teal-900 border-teal-300/80',         dot: 'bg-teal-600',    num: 'text-teal-800' }
  }[tone];

  const hi = language === 'hi';
  const totalPrescribed = patient.prescribedTests.length;
  const donePct = totalPrescribed > 0 ? Math.min(100, Math.round((patient.completedTests.length / totalPrescribed) * 100)) : 0;
  const initials = patient.name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
  const isUrgent = patient.doctorPriority === 'urgent';

  return (
    <div className="qc-root space-y-5">

      {/* 1. Patient identity strip */}
      <div className="qc-card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-teal-700 text-white flex items-center justify-center text-sm font-semibold tracking-wide shrink-0 ring-4 ring-teal-50">
            {initials || 'P'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight truncate">{patient.name}</h2>
              <span className="qc-mono text-[11px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/70">
                {patient.uhid}
              </span>
              <span className="qc-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {patient.age}Y · {patient.gender}
              </span>
              {patient.doctorPriority && patient.doctorPriority !== 'normal' && (
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  isUrgent ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {patient.doctorPriority}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                <strong className="text-slate-700 font-semibold">{patient.prescribedDoctorName}</strong> · {doctorRoom}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
          {onPrintSlip && (
            <button
              type="button"
              onClick={onPrintSlip}
              className="qc-focus qc-press min-h-[38px] px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>{hi ? 'पर्ची प्रिंट' : 'Print Slip'}</span>
            </button>
          )}
          <div className="text-right">
            <span className="qc-label block">{t.token}</span>
            <span className="qc-mono text-base font-semibold text-teal-800 tracking-tight">{activeTokenNumber}</span>
          </div>
        </div>
      </div>

      {/* Urgent priority notice */}
      {isUrgent && (
        <div role="alert" className="qc-rise relative overflow-hidden rounded-2xl border border-rose-200 bg-rose-50/80 p-4 flex items-start gap-3">
          <span className="absolute inset-y-0 left-0 w-1 bg-rose-500" />
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 ml-1" />
          <div>
            <h4 className="font-semibold text-sm text-rose-900">Urgent clinical priority</h4>
            <p className="text-xs text-rose-800/90 mt-0.5 leading-relaxed">
              Your attending doctor has requested urgent priority for your evaluation. Follow hospital emergency protocol. Diagnostic counters and triage queues will fast-track your token.
            </p>
          </div>
        </div>
      )}

      {/* Unavailable lab notice */}
      {unavailablePrescriptions.length > 0 && (
        <div role="status" className="qc-rise relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/80 p-4 flex items-start gap-3">
          <span className="absolute inset-y-0 left-0 w-1 bg-amber-500" />
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 ml-1" />
          <div>
            <h4 className="font-semibold text-sm text-amber-900">
              {unavailablePrescriptions.map(u => u?.dept?.name || u?.test?.name).join(', ')} temporarily unavailable
            </h4>
            <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
              {unavailablePrescriptions.map(u => `${u?.dept?.name || 'Lab'} temporarily unavailable. Recommended route has been updated.`).join(' ')}
            </p>
          </div>
        </div>
      )}

      {/* 2. Boarding-pass hero */}
      <div className="qc-card qc-rise qc-d1 overflow-hidden">
        <div className={`h-1 w-full ${TONES.bar}`} />
        <div className="grid lg:grid-cols-[1fr_232px]">
          {/* Main */}
          <div className="p-4 sm:p-6 lg:p-7 space-y-5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${TONES.chip}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${TONES.dot} ${tone === 'called' ? 'qc-ring-amber' : ''}`} />
                <span>{directiveBadge}</span>
              </span>

              {isManualActive && (
                <button
                  type="button"
                  onClick={() => handleSelectManual(null)}
                  className="qc-focus qc-press inline-flex items-center gap-1.5 min-h-[30px] px-2.5 rounded-full text-[11px] font-semibold text-slate-600 hover:text-teal-800 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-200 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{hi ? 'AI अनुशंसित पर रीसेट' : 'Reset to AI recommended'}</span>
                </button>
              )}

              <span className="ml-auto text-[11px] text-slate-500 inline-flex items-center gap-1.5 qc-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{hi ? 'चेक-इन' : 'Check-in'} {patient.registrationTime}</span>
              </span>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl lg:text-[28px] font-semibold text-slate-900 tracking-tight leading-snug">
                {directiveTitle}
              </h1>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed max-w-2xl">{directiveSubtitle}</p>
            </div>

            {/* Facts */}
            <div className={`grid gap-px rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-200/70 ${
              effectiveStep && !allCompleted ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'
            }`}>
              <div className="bg-white p-3.5 col-span-2 lg:col-span-1">
                <div className="qc-label flex items-center gap-1.5"><MapPin className="w-3 h-3" />{t.floor} &amp; {t.room}</div>
                <div className="text-base font-semibold text-slate-900 mt-1 leading-tight">{targetRoom}</div>
                <div className="text-xs text-slate-500 mt-0.5">{targetLocation}</div>
              </div>
              <div className="bg-white p-3.5">
                <div className="qc-label">{t.estimatedWait}</div>
                <div className={`qc-mono text-base font-semibold mt-1 ${TONES.num}`}>{waitMinutesText}</div>
                {effectiveStep && !allCompleted && !isDischarged && (
                  <div className="qc-mono text-[10px] text-slate-500 mt-0.5">
                    {calculatedPatientsAhead} ahead · ~{avgDurationMinutes}m/test
                  </div>
                )}
              </div>
              {effectiveStep && !allCompleted && (
                <div className="bg-white p-3.5">
                  <div className="qc-label">{hi ? 'आगे मरीज' : 'Ahead in line'}</div>
                  <div className="qc-mono text-base font-semibold text-slate-900 mt-1">
                    {calculatedPatientsAhead}{' '}
                    <span className="text-xs font-normal text-slate-500 font-sans">{hi ? 'मरीज' : 'people'}</span>
                  </div>
                </div>
              )}
              {effectiveStep && !allCompleted && (
                <div className="bg-white p-3.5">
                  <div className="qc-label">{t.nextStep}</div>
                  <div className="text-sm font-semibold text-slate-900 mt-1 flex items-center gap-1.5 truncate">
                    <ArrowRight className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="truncate">{effectiveStep.testName}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Symptoms */}
            <div className="flex items-start gap-2.5 text-xs text-slate-600 pt-1">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-semibold text-slate-700">{hi ? 'दर्ज लक्षण: ' : 'Registered symptoms: '}</span>
                <span className="italic">“{patient.currentIllness || patient.symptoms || 'General Checkup'}”</span>
              </p>
            </div>

            {(onOpenRadar || (allCompleted && onViewReports)) && (
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                {onOpenRadar && (
                  <button
                    onClick={onOpenRadar}
                    className="qc-focus qc-press min-h-[42px] px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MapIcon className="w-4 h-4" />
                    <span>{hi ? 'अस्पताल नक्शा देखें' : 'View hospital map'}</span>
                  </button>
                )}
                {allCompleted && onViewReports && (
                  <button
                    onClick={onViewReports}
                    className="qc-focus qc-press min-h-[42px] px-4 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{hi ? 'रिपोर्ट देखें' : 'View reports'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Stub */}
          <div className="qc-ticket-stub bg-slate-50/70 p-4 sm:p-6 flex lg:flex-col items-center lg:items-start justify-between lg:justify-center gap-4">
            <div>
              <span className="qc-label block">{t.token}</span>
              <span className={`qc-mono text-2xl sm:text-3xl font-semibold tracking-tight block mt-1 ${TONES.num}`}>
                {activeTokenNumber}
              </span>
            </div>
            <div className="text-right lg:text-left">
              <span className="qc-label block">{hi ? 'चेक-इन' : 'Check-in'}</span>
              <span className="qc-mono text-sm font-medium text-slate-800">{patient.registrationTime}</span>
              <div className="mt-2 hidden lg:flex gap-[2px] h-7 items-end opacity-70" aria-hidden>
                {Array.from({ length: 28 }).map((_, i) => (
                  <span key={i} className="bg-slate-700 rounded-[1px]" style={{ width: i % 3 === 0 ? 3 : 1.5, height: `${55 + ((i * 37) % 45)}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Diagnostic route */}
      <div className="qc-card qc-rise qc-d2 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{hi ? 'जांच अनुक्रम' : 'Your diagnostic route'}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {hi ? 'न्यूनतम प्रतीक्षा समय के लिए इस क्रम का पालन करें।' : 'Follow each step in order for the fastest hospital visit.'}
            </p>
          </div>
          {totalPrescribed > 0 && (
            <div className="sm:w-56">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
                <span className="qc-mono font-medium text-slate-700">{patient.completedTests.length} / {totalPrescribed}</span>
                <span>{t.completed}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="qc-bar h-full rounded-full bg-teal-600 transition-[width] duration-700" style={{ width: `${donePct}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Report-ready notice */}
        {patient.completedTests.length > 0 && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <div className="font-semibold text-xs text-emerald-950">
                  {patient.completedTests.length} of {patient.prescribedTests.length} Tests Completed &amp; Verified
                </div>
                <p className="text-[11px] text-emerald-800/90 mt-0.5">Lab reports with clinical metrics have been generated and signed.</p>
              </div>
            </div>
            {onViewReports && (
              <button
                onClick={onViewReports}
                className="qc-focus qc-press px-3.5 min-h-[36px] rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Reports</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Timeline */}
        <ol className="mt-5">
          {routingPlan.smartRouteSteps.map((step, idx) => {
            const isDone = patient.completedTests.includes(step.testId);
            const isManualTarget = isManualActive && activeManualTestId === step.testId;
            const isAiTarget = !isDone && !isManualActive && (step.testId === upNextStep?.testId);
            const isCurrent = isManualTarget || isAiTarget;

            const stepDept = departments?.find(d => d.id === step.departmentId);
            const isStepUnavailable = stepDept?.availabilityStatus === 'unavailable' || (stepDept?.activeMachines !== undefined && stepDept.activeMachines <= 0);

            const activate = () => {
              if (isDone) {
                if (onViewReports) onViewReports();
              } else {
                handleSelectManual(activeManualTestId === step.testId ? null : step.testId);
              }
            };

            return (
              <li key={step.testId} className="relative grid grid-cols-[32px_1fr] gap-3 sm:gap-4 pb-4 last:pb-0">
                {/* rail */}
                <span aria-hidden className={`absolute left-[15px] top-8 bottom-0 w-px ${isDone ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                <div className="relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-300 ${
                    isDone ? 'bg-emerald-600 text-white'
                    : isCurrent ? 'bg-teal-700 text-white qc-ring'
                    : isStepUnavailable ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-white text-slate-500 border border-slate-300'
                  }`}>
                    {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : isStepUnavailable ? '!' : idx + 1}
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={activate}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } }}
                  className={`qc-focus qc-lift min-w-0 rounded-2xl border p-3.5 sm:p-4 cursor-pointer ${
                    isDone ? 'bg-emerald-50/50 border-emerald-200'
                    : isCurrent ? 'bg-teal-50/40 border-teal-300 shadow-sm'
                    : isStepUnavailable ? 'bg-amber-50/40 border-amber-200 cursor-not-allowed'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-900 leading-snug">{step.testName}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{step.location.room.split('(')[0]}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isDone ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Done</span>
                      ) : isManualTarget ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">Selected</span>
                      ) : isAiTarget ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-white bg-teal-700 px-2 py-0.5 rounded-md">Go here next</span>
                      ) : isStepUnavailable ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">Unavailable</span>
                      ) : (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Pending</span>
                      )}
                    </div>
                  </div>

                  {isCurrent && !isDone && (
                    <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-teal-900 bg-white/80 px-3 py-2 rounded-lg border border-teal-200/80">
                      <span className="truncate">Walk to {step.location.room.split('(')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-teal-700 shrink-0 ml-2" />
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center justify-between sm:justify-start gap-3 text-xs">
                      {isDone ? (
                        <>
                          <span className="text-emerald-700 font-medium inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" />Verified</span>
                          {onViewReports && <span className="text-teal-700 font-semibold">Report →</span>}
                        </>
                      ) : isStepUnavailable ? (
                        <span className="text-amber-700 font-medium">Temporarily unavailable</span>
                      ) : (
                        <>
                          <span className="text-slate-500">{isManualTarget ? 'Destination' : isAiTarget ? 'Up next' : 'Estimated wait'}</span>
                          <span className="qc-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                            ~{formatWaitRange(step.estimatedWaitMinutes)}
                          </span>
                        </>
                      )}
                    </div>

                    {!isDone && !isStepUnavailable && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markTestCompletedByPatient(patient.id, step.testId);
                        }}
                        className="qc-focus qc-press min-h-[34px] px-3 rounded-lg bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer"
                        title="Mark complete if you already have this report"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Have report? Mark done</span>
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}

          {/* Final consultation */}
          <li className="relative grid grid-cols-[32px_1fr] gap-3 sm:gap-4">
            <div className="relative z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                isDischarged ? 'bg-emerald-600 text-white'
                : allCompleted ? 'bg-emerald-600 text-white qc-ring'
                : 'bg-white text-slate-400 border border-slate-300'
              }`}>
                {isDischarged ? <Check className="w-4 h-4 stroke-[3]" /> : <Stethoscope className="w-4 h-4" />}
              </div>
            </div>
            <div className={`min-w-0 rounded-2xl border p-3.5 sm:p-4 ${
              isDischarged ? 'bg-slate-50 border-emerald-200'
              : allCompleted ? 'bg-emerald-50/50 border-emerald-300 shadow-sm'
              : 'bg-white border-slate-200 border-dashed'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-900 leading-snug">
                    Final Consultation with {patient.prescribedDoctorName} ({doctorRoom})
                  </div>
                  <div className="qc-mono text-xs text-teal-800 mt-1">OPD Token #{patient.opdTokenNumber || 'OPD-104'}</div>
                </div>
                {isDischarged ? (
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Completed</span>
                ) : allCompleted ? (
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-white bg-emerald-700 px-2 py-0.5 rounded-md">Reports ready</span>
                ) : (
                  <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-slate-400">Awaiting labs</span>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200/70 text-xs font-medium">
                {isDischarged ? (
                  <span className="text-emerald-700">Consultation finished &amp; discharged</span>
                ) : allCompleted ? (
                  <span className="text-emerald-800">Please return to your doctor / consultation area. Doctor ready for review.</span>
                ) : (
                  <span className="text-slate-500">Awaiting reports · ready when done</span>
                )}
              </div>
            </div>
          </li>
        </ol>

        {/* Verified records */}
        {patient.completedTests.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-900 inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Verified diagnostic records
                <span className="qc-mono text-slate-400 font-normal">{patient.completedTests.length}/{patient.prescribedTests.length}</span>
              </h4>
              {onViewReports && (
                <button
                  type="button"
                  onClick={onViewReports}
                  className="qc-focus text-xs font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {patient.completedTests.map(tId => {
                const testObj = tests?.find(t => t.id === tId);
                const reportObj = clinicalReports?.find(r => r.patientId === patient.id && r.testId === tId);
                const isPrior = reportObj?.technicianName.includes('Prior');

                return (
                  <div key={tId} className="qc-lift rounded-xl bg-slate-50/70 border border-slate-200/80 p-3 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="qc-mono text-[10px] font-medium text-slate-500 truncate max-w-[110px]">{testObj?.code || 'LAB'}</span>
                        <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isPrior ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {isPrior ? 'Prior report' : 'Lab verified'}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-slate-900 truncate">{testObj?.name || 'Diagnostic Investigation'}</div>
                      <div className="qc-mono text-[10px] text-slate-500 mt-0.5">{reportObj?.timestamp || 'Today'}</div>
                    </div>
                    {onViewReports && (
                      <button
                        type="button"
                        onClick={onViewReports}
                        className="qc-focus text-[11px] font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 self-start cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Inspect findings</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
