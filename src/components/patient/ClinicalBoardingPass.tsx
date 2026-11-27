import React from 'react';
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  Check, 
  User, 
  AlertCircle,
  FileText,
  Printer
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
  hideProfileStrip?: boolean;
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
  onPrintSlip,
  hideProfileStrip = false
}) => {
  const { markTestCompletedByPatient, clinicalReports, currentHospital } = useHospitalStore();
  const t = TRANSLATIONS[language];
  const doctorRoom = patient.prescribedDoctorRoom || currentHospital.doctorRoom || 'Consultation Room';

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
      ? `आपकी सभी जांचें व रिपोर्ट समीक्षा पूरी हो चुकी हैं। ओपीडी टोकन #${patient.opdTokenNumber || 'OPD'} संपन्न हुआ।`
      : `Your final consultation, test evaluations, and report review are complete. You are discharged. OPD Token #${patient.opdTokenNumber || 'OPD'} is marked completed.`;
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
    directiveSubtitle = `${doctorRoom} ${language === 'hi' ? 'में परामर्श के लिए जाएं (टोकन #' : 'for your OPD consultation (Token #'}${patient.opdTokenNumber || 'OPD'}).`;
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
    ? `${patient.opdTokenNumber || 'OPD'} (Done)`
    : calledToken?.tokenNumber || (allCompleted && patient.opdTokenNumber ? patient.opdTokenNumber : upNextToken?.tokenNumber) || (effectiveStep ? `${effectiveStep.testCode}-0${effectiveStep.stepNumber}` : patient.opdTokenNumber || 'OPD-REG');

  return (
    <div className="space-y-6">
      
      {/* 1. Patient Profile Strip (suppressed when embedded under PatientView header to prevent duplication) */}
      {!hideProfileStrip && (
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold shrink-0">
            <User className="w-5 h-5 text-teal-700" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-obsidian-900 tracking-tight truncate">
                {patient.name}
              </h2>
              <span className="text-[11px] sm:text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 tabular-nums">
                {patient.uhid}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full tabular-nums">
                {patient.age}Y • {patient.gender}
              </span>
              {patient.doctorPriority && patient.doctorPriority !== 'normal' && (
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  patient.doctorPriority === 'urgent' ? 'bg-coral-100 text-coral-700 border border-coral-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {patient.doctorPriority}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Doctor: <strong className="text-slate-800 font-semibold">{patient.prescribedDoctorName}</strong> ({doctorRoom})
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100">
          {onPrintSlip && (
            <button
              type="button"
              onClick={onPrintSlip}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'पर्ची प्रिंट' : 'Print Slip'}</span>
            </button>
          )}

          <div className="text-right">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase block">{t.token}</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 inline-block tabular-nums">
              {activeTokenNumber}
            </span>
          </div>
        </div>
      </div>
      )}

      {/* Urgent Doctor Priority Alert Banner */}
      {patient.doctorPriority === 'urgent' && (
        <div className="p-4 rounded-3xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex items-start gap-3.5 shadow-sm animate-pulse">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-black text-xs text-rose-900 uppercase tracking-wide">
              🚨 URGENT CLINICAL PRIORITY: Follow hospital emergency protocol.
            </h4>
            <p className="text-xs text-rose-800 mt-0.5 font-medium">
              Attending doctor has requested urgent clinical priority for your evaluation. Follow hospital emergency protocol. All diagnostic counters and triage queues will fast-track your token.
            </p>
          </div>
        </div>
      )}

      {/* Temporarily Unavailable Lab Alert Banner */}
      {unavailablePrescriptions.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-3.5 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-black text-xs text-amber-900 uppercase tracking-wide">
              ⚠️ {unavailablePrescriptions.map(u => u?.dept?.name || u?.test?.name).join(', ')} temporarily unavailable.
            </h4>
            <p className="text-xs text-amber-800 mt-0.5 font-medium">
              {unavailablePrescriptions.map(u => `${u?.dept?.name || 'Lab'} temporarily unavailable. Recommended route has been updated.`).join(' ')}
            </p>
          </div>
        </div>
      )}

      {/* 2. Primary Direction Hero Card (User Rule 4: Next Step Guidance) */}
      <div className="bg-gradient-to-br from-white via-slate-50/80 to-teal-50/30 rounded-2xl sm:rounded-3xl border-2 border-teal-500/30 shadow-md p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-5 relative overflow-hidden">
        
        {/* Animated Direction Indicator (Rule 4) */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide qcare-pill-3d-solid ${directiveBadgeColor}`}>
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{directiveBadge}</span>
            </span>

            {hideProfileStrip && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 tabular-nums">
                {t.token} {activeTokenNumber}
              </span>
            )}

            {/* If patient manually selected a test, offer 1-click Reset to AI Recommended */}
            {isManualActive && (
              <button
                type="button"
                onClick={() => handleSelectManual(null)}
                className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-teal-600" />
                <span>⚡ Reset to AI Recommended</span>
              </button>
            )}

            {/* Pulsing Animated Arrow */}
            <div className="flex items-center text-teal-700 font-extrabold text-xs animate-pulse gap-1">
              <span>{t.nextStep}</span>
              <ArrowRight className="w-4 h-4 animate-bounce" />
            </div>
          </div>

          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 flex items-center gap-1 tabular-nums">
            <Clock className="w-3.5 h-3.5" />
            <span>Check-in: {patient.registrationTime}</span>
          </span>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-obsidian-950 tracking-tight leading-snug text-balance">
            {directiveTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium leading-relaxed max-w-prose">
            {directiveSubtitle}
          </p>
        </div>

        {/* Location & Room Pill */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t.floor} & {t.room}
              </div>
              <div className="text-base sm:text-lg font-black text-obsidian-900">
                {targetRoom}
              </div>
              <div className="text-xs text-slate-500">
                {targetLocation}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100">
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase block">{t.estimatedWait}</span>
              <span className="text-base sm:text-lg font-extrabold text-teal-900 tabular-nums">
                {waitMinutesText}
              </span>
              {effectiveStep && !allCompleted && !isDischarged && (
                <span className="text-[10px] text-teal-700 block font-bold mt-0.5 tabular-nums">
                  ({calculatedPatientsAhead} ahead • ~{avgDurationMinutes}m/test)
                </span>
              )}
            </div>
            {effectiveStep && !allCompleted && (
              <>
                <div className="h-7 w-px bg-slate-200" />
                <div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase block">
                    {language === 'hi' ? 'आगे मरीज' : 'Ahead in line'}
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-obsidian-900 tabular-nums">
                    {calculatedPatientsAhead} <span className="text-xs font-normal text-slate-500">{language === 'hi' ? 'मरीज' : 'people'}</span>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Symptoms / Registered Complaints Banner */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-900 block">{language === 'hi' ? 'लक्षण:' : 'Registered Symptoms:'}</span>
            <span className="font-medium text-slate-800">
              "{patient.currentIllness || patient.symptoms || 'General Checkup'}"
            </span>
          </div>
        </div>
      </div>

      {/* 3. Step-by-Step Journey */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {language === 'hi' ? 'जांच अनुक्रम' : 'Your Diagnostic Route'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'hi'
                ? 'न्यूनतम प्रतीक्षा समय के लिए इस क्रम का पालन करें।'
                : 'Follow each step in order for the fastest hospital visit.'}
            </p>
          </div>

          {patient.prescribedTests.length > 0 && (
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {patient.completedTests.length} of {patient.prescribedTests.length} {t.completed}
            </span>
          )}
        </div>

        {/* Real-time Report Ready Notification Banner */}
        {patient.completedTests.length > 0 && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                ✓
              </div>
              <div>
                <div className="font-bold text-xs text-emerald-950">
                  {patient.completedTests.length} of {patient.prescribedTests.length} Tests Completed & Verified!
                </div>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Lab reports with clinical metrics have been generated and signed.
                </p>
              </div>
            </div>

            {onViewReports && (
              <button
                onClick={onViewReports}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Reports</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Case B: Prescribed Investigations Active (Responsive Vertical on Mobile / Horizontal on Desktop) */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 lg:gap-3 lg:overflow-x-auto p-1 py-2">
          {routingPlan.smartRouteSteps.map((step, idx) => {
            const isDone = patient.completedTests.includes(step.testId);
            const isManualTarget = isManualActive && activeManualTestId === step.testId;
            const isAiTarget = !isDone && !isManualActive && (step.testId === upNextStep?.testId);
            const isCurrent = isManualTarget || isAiTarget;

            const stepDept = departments?.find(d => d.id === step.departmentId);
            const isStepUnavailable = stepDept?.availabilityStatus === 'unavailable' || (stepDept?.activeMachines !== undefined && stepDept.activeMachines <= 0);

            return (
              <React.Fragment key={step.testId}>
                <div
                  onClick={() => {
                    if (isDone) {
                      if (onViewReports) onViewReports();
                    } else {
                      handleSelectManual(activeManualTestId === step.testId ? null : step.testId);
                    }
                  }}
                  className={`min-w-0 w-full lg:w-auto lg:min-w-[240px] lg:flex-1 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between active:scale-[0.99] ${
                    isDone
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs hover:border-emerald-400 cursor-pointer'
                      : isCurrent
                      ? 'bg-gradient-to-b from-teal-50/90 via-white to-teal-50/40 border-teal-600 ring-2 ring-teal-500/50 text-slate-900 shadow-md cursor-pointer'
                      : isStepUnavailable
                      ? 'bg-amber-50/40 border-amber-300 text-slate-600 cursor-not-allowed opacity-80'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-teal-300 hover:shadow-xs cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                        Step {idx + 1}
                      </span>
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-2xs shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Done</span>
                        </span>
                      ) : isManualTarget ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-2xs shrink-0">
                          🎯 Selected
                        </span>
                      ) : isAiTarget ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-600 text-white shadow-xs shrink-0 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          <span>GO HERE NEXT</span>
                        </span>
                      ) : isStepUnavailable ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                          Unavailable
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="font-extrabold text-sm text-obsidian-900 leading-snug">
                      {step.testName}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{step.location.room.split('(')[0]}</span>
                    </div>
                    {isCurrent && !isDone && (
                      <div className="mt-2.5 flex items-center justify-between text-[11px] font-bold text-teal-900 bg-teal-100/90 px-3 py-2 rounded-xl border border-teal-200 shadow-2xs">
                        <span className="flex items-center gap-1.5 truncate">
                          <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping shrink-0" />
                          <span className="truncate">Walk to {step.location.room.split('(')[0]}</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-teal-700 animate-bounce shrink-0 ml-1" />
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold gap-2">
                      {isDone ? (
                        <>
                          <span className="text-emerald-700 flex items-center gap-1">
                            ✓ Verified
                          </span>
                          {onViewReports && (
                            <span className="text-teal-700 hover:text-teal-900 underline font-bold">
                              Report ➔
                            </span>
                          )}
                        </>
                      ) : isStepUnavailable ? (
                        <span className="text-amber-700 font-bold">
                          Temporarily Unavailable
                        </span>
                      ) : (
                        <>
                          <span className={`truncate ${isCurrent ? 'text-teal-800 font-extrabold' : 'text-slate-500'}`}>
                            {isManualTarget ? 'Destination ➔' : isAiTarget ? 'Up Next ➔' : 'Estimated Wait'}
                          </span>
                          <span className="text-obsidian-900 bg-slate-100 px-2 py-0.5 rounded-md font-bold tabular-nums shrink-0">
                            ~{formatWaitRange(step.estimatedWaitMinutes)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Patient Self-Complete Option */}
                    {!isDone && !isStepUnavailable && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markTestCompletedByPatient(patient.id, step.testId);
                        }}
                        className="w-full min-h-[40px] py-2 px-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 hover:border-emerald-300 transition-colors active:scale-98 cursor-pointer"
                        title="Mark complete if you already have this report"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Have report? Mark done</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Flow connector between steps */}
                {idx < routingPlan.smartRouteSteps.length - 1 && (
                  <>
                    <div className="lg:hidden flex justify-center py-0.5 text-teal-600">
                      <ArrowRight className="w-4 h-4 rotate-90" />
                    </div>
                    <div className="hidden lg:flex items-center justify-center text-slate-300 px-0.5">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </>
                )}
              </React.Fragment>
            );
          })}

          {/* Final Return to Doctor Step Connector */}
          <div className="lg:hidden flex justify-center py-0.5 text-teal-600">
            <ArrowRight className="w-4 h-4 rotate-90" />
          </div>
          <div className="hidden lg:flex items-center justify-center text-slate-300 px-0.5">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div
            className={`min-w-0 w-full lg:w-auto lg:min-w-[220px] lg:flex-1 p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
              isDischarged
                ? 'bg-slate-50 border-emerald-300 text-slate-800 shadow-2xs'
                : allCompleted
                ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-500 ring-4 ring-emerald-500/30 text-emerald-950 shadow-lg scale-[1.01] animate-pulse'
                : 'bg-white border-slate-200 text-slate-500 opacity-80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Step {routingPlan.smartRouteSteps.length + 1}
                </span>
                {isDischarged ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-2xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Completed</span>
                  </span>
                ) : allCompleted ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-2xs animate-pulse">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Reports Ready</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <Clock className="w-3 h-3" />
                    <span>Awaiting Labs</span>
                  </span>
                )}
              </div>

              <div>
                <div className="font-extrabold text-sm text-obsidian-900 leading-snug">
                  Final Consultation with {patient.prescribedDoctorName} ({doctorRoom})
                </div>
                <div className="text-xs font-bold text-teal-700 mt-1 tabular-nums">
                  OPD Token #{patient.opdTokenNumber || 'OPD'}
                </div>
                {allCompleted && (
                  <div className="text-[11px] font-bold text-emerald-800 mt-2 bg-emerald-100/90 px-2.5 py-1 rounded-xl border border-emerald-200">
                    Please return to your doctor / consultation area.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
              {isDischarged ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  ✓ Consultation Finished & Discharged
                </span>
              ) : allCompleted ? (
                <span className="text-emerald-700 font-black flex items-center gap-1">
                  Doctor Ready for Review ➔
                </span>
              ) : (
                <span className="text-slate-500">
                  Awaiting Reports / Ready When Done
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dedicated Visible Completed Diagnostics & Reports Section (User Request) */}
        {patient.completedTests.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Verified Diagnostic Records ({patient.completedTests.length} of {patient.prescribedTests.length})
                </h4>
              </div>
              {onViewReports && (
                <button
                  type="button"
                  onClick={onViewReports}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Reports</span>
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
                  <div
                    key={tId}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between gap-2 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">
                          {testObj?.code || 'LAB'}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isPrior 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isPrior ? '📋 Prior Report Verified' : '✓ Lab Verified'}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {testObj?.name || 'Diagnostic Investigation'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {reportObj?.timestamp || 'Today'}
                      </div>
                    </div>

                    {onViewReports && (
                      <button
                        type="button"
                        onClick={onViewReports}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start pt-1 cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Inspect Findings ➔</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-3 border-t border-slate-100">
          {onOpenRadar && (
            <button
              onClick={onOpenRadar}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs active:scale-98 cursor-pointer"
            >
              <span>{language === 'hi' ? 'अस्पताल नक्शा देखें' : 'View Hospital Map'}</span>
            </button>
          )}

          {allCompleted && onViewReports && (
            <button
              onClick={onViewReports}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md active:scale-98 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'hi' ? 'रिपोर्ट देखें ➔' : 'View Reports ➔'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
