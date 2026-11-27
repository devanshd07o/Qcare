import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Radio, 
  Footprints, 
  X, 
  Printer, 
  Languages, 
  ArrowLeft,
  Compass,
  Info,
  ShieldCheck,
  Navigation,
  Pill,
  Activity,
  QrCode,
  Droplet,
  User,
  Clock,
  Sparkles
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { ClinicalBoardingPass } from './ClinicalBoardingPass';
import { HospitalFloorRadar } from '../map/HospitalFloorRadar';
import { ClinicalReportSheet } from './ClinicalReportSheet';
import { QBieCompanion } from './QBieCompanion';
import { WhyQCareModal } from '../common/WhyQCareModal';
import { PrintableSlip } from '../common/PrintableSlip';
import { PatientPrescriptionView } from './PatientPrescriptionView';
import { PatientHealthCardModal } from './PatientHealthCardModal';
import { PatientHistoryTimeline } from './PatientHistoryTimeline';
import { PrescribedTestsNavigationPanel } from './PrescribedTestsNavigationPanel';
import { RouteStep } from '../../types';

export const PatientView: React.FC = () => {
  const {
    selectedPatient,
    currentHospital,
    currentRoutingPlan,
    clinicalReports,
    prescriptions,
    queueTokens,
    departments,
    counters,
    tests,
    language,
    setLanguage,
    callingAlert,
    dismissCallingAlert,
    canGoBack,
    navigateBack
  } = useHospitalStore();

  const [activeTab, setActiveTab] = useState<'journey' | 'prescriptions' | 'reports' | 'map' | 'history'>('journey');
  const [showRadarModal, setShowRadarModal] = useState<boolean>(false);
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [showHealthCard, setShowHealthCard] = useState(false);
  const [selectedManualTestId, setSelectedManualTestId] = useState<string | null>(null);
  // Live refresh tick — fires every 2 minutes, triggers re-render of queue stats
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number>(() => Date.now());
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      setLastRefreshedAt(Date.now());
    }, 120_000); // 2 minutes
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, []);

  if (!selectedPatient) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm font-sans">
        <p className="max-w-prose mx-auto leading-relaxed">
          No patient profile active. Please sign in via the clinical portal reception gate.
        </p>
      </div>
    );
  }

  // Reports belonging to this patient
  const patientReports = clinicalReports.filter(r => r.patientId === selectedPatient.id);

  // Prescriptions belonging to this patient
  const patientPrescriptions = prescriptions.filter(
    rx => rx.patientId === selectedPatient.id || rx.patientUhid.toUpperCase() === selectedPatient.uhid.toUpperCase()
  );

  // Patient tokens
  const patientTokens = queueTokens.filter(t => t.patientId === selectedPatient.id);

  // Active called or in-progress token
  const calledToken = patientTokens.find(t => t.status === 'called');
  const inProgressToken = patientTokens.find(t => t.status === 'in_progress');

  // Find next uncompleted step in the optimized route
  const upNextStep = currentRoutingPlan.smartRouteSteps.find(
    (s: RouteStep) => !selectedPatient.completedTests.includes(s.testId)
  );

  const upNextToken = upNextStep
    ? patientTokens.find(t => t.testId === upNextStep.testId)
    : undefined;

  const bloodLabWaitingCount = queueTokens.filter(
    t => t.departmentId === 'dept-pathology' && t.status === 'waiting'
  ).length;

  const allCompleted = selectedPatient.completedTests.length > 0 && 
    selectedPatient.prescribedTests.every((id: string) => selectedPatient.completedTests.includes(id));

  // Determine current active counter details if called or up next
  const activeCounterId = calledToken?.counterId || upNextStep?.recommendedCounterId;
  const activeCounter = counters.find(c => c.id === activeCounterId);
  const activeDept = departments.find(d => d.id === (calledToken?.departmentId || upNextStep?.departmentId));

  const waitingAheadCount = upNextStep
    ? queueTokens.filter(t => t.departmentId === upNextStep.departmentId && t.status === 'waiting' && t.patientId !== selectedPatient.id).length
    : 0;

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Live Calling Alert Banner */}
      {callingAlert &&
        (callingAlert.patientId
          ? callingAlert.patientId === selectedPatient.id
          : callingAlert.patientName === selectedPatient.name || !callingAlert.patientName) && (
        <div className="bg-teal-800 text-white p-4 rounded-2xl border border-teal-900 flex items-center justify-between gap-3 shadow-md animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-teal-200">
                Token Called Now · टोकन बुलाया गया
              </p>
              <p className="font-extrabold text-sm sm:text-base text-white">
                Please proceed immediately to {callingAlert.roomNo} ({callingAlert.counterName})
              </p>
            </div>
          </div>
          {dismissCallingAlert && (
            <button
              onClick={dismissCallingAlert}
              className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Top Patient Identity & Digital Health Pass Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
            <User className="w-5 h-5 text-teal-700" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate text-balance leading-tight">
                {selectedPatient.name}
              </h2>
              <span className="text-xs font-bold tabular-nums text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                {selectedPatient.uhid}
              </span>
              <span className="text-[11px] font-bold tabular-nums text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {selectedPatient.age}Y • {selectedPatient.gender}
              </span>
              {Boolean((selectedPatient as typeof selectedPatient & { bloodGroup?: string }).bloodGroup) && (
                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                  <Droplet className="w-3 h-3 fill-current" />
                  <span>{(selectedPatient as typeof selectedPatient & { bloodGroup?: string }).bloodGroup}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 tabular-nums leading-normal">
              Physician: <strong className="text-slate-800">{selectedPatient.prescribedDoctorName}</strong> ({selectedPatient.prescribedDoctorRoom || currentHospital.doctorRoom || 'Consultation Room'}) • Token <strong className="text-teal-800">#{selectedPatient.opdTokenNumber || 'OPD'}</strong>
            </p>
          </div>
        </div>

        {/* Quick Action Badges */}
        <div className="flex items-center gap-2 flex-wrap border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <button
            type="button"
            onClick={() => setShowHealthCard(true)}
            className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 transition-[background-color,transform] duration-150 shadow-xs cursor-pointer active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Digital Health Card</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReceiptOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'hi' ? 'पर्ची' : 'QR Slip'}</span>
          </button>

          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-teal-700" />
            <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWhyModal(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Why QCare</span>
          </button>
        </div>
      </div>
      
      {/* 5 Executive Tabs for Complete Hospital Journey */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto">
        {canGoBack && (
          <button
            type="button"
            onClick={navigateBack}
            className="min-h-[40px] px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-[background-color,transform] duration-150 active:scale-95 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>{language === 'hi' ? 'वापस' : 'Back'}</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('journey')}
          className={`min-h-[40px] py-2 px-3.5 sm:px-4 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-[background-color,border-color,color] duration-150 cursor-pointer whitespace-nowrap ${
            activeTab === 'journey'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Footprints className="w-4 h-4 shrink-0" />
          <span>{language === 'hi' ? 'कतार एवं यात्रा' : 'Queue & Journey'}</span>
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`min-h-[40px] py-2 px-3.5 sm:px-4 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-[background-color,border-color,color] duration-150 cursor-pointer whitespace-nowrap ${
            activeTab === 'prescriptions'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Pill className="w-4 h-4 shrink-0" />
          <span>{language === 'hi' ? 'प्रिस्क्रिप्शन व दवा' : 'Prescriptions & Rx'}</span>
          {patientPrescriptions.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
              activeTab === 'prescriptions' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {patientPrescriptions[0].status === 'fully_dispensed'
                ? 'Dispensed'
                : patientPrescriptions[0].status === 'partially_dispensed'
                ? 'Partial'
                : patientPrescriptions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`min-h-[40px] py-2 px-3.5 sm:px-4 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-[background-color,border-color,color] duration-150 cursor-pointer whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>{language === 'hi' ? 'लैब रिपोर्ट्स' : 'Diagnostic Reports'}</span>
          {patientReports.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
              activeTab === 'reports' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {patientReports.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`min-h-[40px] py-2 px-3.5 sm:px-4 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-[background-color,border-color,color] duration-150 cursor-pointer whitespace-nowrap ${
            activeTab === 'map'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Compass className="w-4 h-4 shrink-0" />
          <span>{language === 'hi' ? 'अस्पताल नक्शा' : 'Indoor Floor Map'}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`min-h-[40px] py-2 px-3.5 sm:px-4 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-[background-color,border-color,color] duration-150 cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span>{language === 'hi' ? 'इतिहास व वाइटल्स' : 'Vitals & History'}</span>
        </button>
      </div>

      {/* TAB 1: Live Journey & Boarding Pass + Inline Floor Map Outside! */}
      {activeTab === 'journey' && (
        <div className="space-y-8">
          {/* Live "Where To Go" Navigation Panel — refreshes every 2 mins, reshuffles on test completion */}
          {selectedPatient.prescribedTests.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5">
              <PrescribedTestsNavigationPanel
                patient={selectedPatient}
                tests={tests}
                departments={departments}
                counters={counters}
                queueTokens={queueTokens}
                routeSteps={currentRoutingPlan.smartRouteSteps}
                lastRefreshedAt={lastRefreshedAt}
                language={language}
                onViewReports={() => setActiveTab('reports')}
              />
            </div>
          )}

          <ClinicalBoardingPass
            patient={selectedPatient}
            routingPlan={currentRoutingPlan}
            upNextStep={upNextStep}
            upNextToken={upNextToken}
            calledToken={calledToken}
            inProgressToken={inProgressToken}
            allCompleted={allCompleted}
            activeCounter={activeCounter}
            activeDept={activeDept}
            waitingAheadCount={waitingAheadCount}
            bloodLabWaitingCount={bloodLabWaitingCount}
            language={language}
            tests={tests}
            departments={departments}
            counters={counters}
            queueTokens={queueTokens}
            selectedManualTestId={selectedManualTestId}
            onSelectManualTest={setSelectedManualTestId}
            onViewReports={() => setActiveTab('reports')}
            onOpenRadar={() => {
              const el = document.getElementById('indoor-floor-map');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              else setShowRadarModal(true);
            }}
            onPrintSlip={() => setIsReceiptOpen(true)}
            hideProfileStrip
          />

          {/* Hospital Floor Blueprint & Live Radar - RENDERED OUTSIDE ON THE MAIN PAGE */}
          <div id="indoor-floor-map" className="space-y-3 pt-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold shadow-2xs">
                  <Compass className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight text-balance">
                    {language === 'hi' ? 'अस्पताल फ्लोर मैप व लाइव नेविगेशन' : 'Hospital Indoor Navigation & Blueprint'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-prose leading-relaxed">
                    {language === 'hi' ? 'अपनी मंजिल व सभी जांच कमरों का लाइव ब्लूप्रिंट देखें' : 'Architectural floor plan with active room queues, walking routes, and live wayfinding.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRadarModal(true)}
                className="text-xs font-bold text-teal-800 hover:text-teal-950 bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Full Screen</span>
                <span className="text-slate-400">↗</span>
              </button>
            </div>
            <HospitalFloorRadar />
          </div>
        </div>
      )}

      {/* TAB 2: Digital Prescriptions & Medications View */}
      {activeTab === 'prescriptions' && (
        <PatientPrescriptionView 
          patient={selectedPatient}
          onShowHealthCard={() => setShowHealthCard(true)}
        />
      )}

      {/* TAB 3: Diagnostic Lab Reports (PHR) */}
      {activeTab === 'reports' && (
        <ClinicalReportSheet
          reports={patientReports}
          patientUhid={selectedPatient.uhid}
          patientName={selectedPatient.name}
          onBack={() => setActiveTab('journey')}
        />
      )}

      {/* TAB 4: Dedicated Full Map Tab */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveTab('journey')}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Journey</span>
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Live updates every 30s • Floor Navigation
            </span>
          </div>
          <HospitalFloorRadar />
        </div>
      )}

      {/* TAB 5: Vitals & History Timeline */}
      {activeTab === 'history' && (
        <PatientHistoryTimeline
          patient={selectedPatient}
          reports={patientReports}
          onViewReports={() => setActiveTab('reports')}
          onViewPrescriptions={() => setActiveTab('prescriptions')}
        />
      )}

      {/* Interactive Q-Bie AI Companion Mascot */}
      <QBieCompanion
        patient={selectedPatient}
        routingPlan={currentRoutingPlan}
        upNextStep={upNextStep}
        calledToken={calledToken}
        inProgressToken={inProgressToken}
        allCompleted={allCompleted}
        reports={patientReports}
        language={language}
      />

      {/* Digital Health Pass Modal */}
      {showHealthCard && (
        <PatientHealthCardModal
          patient={selectedPatient}
          hospital={currentHospital}
          onClose={() => setShowHealthCard(false)}
        />
      )}

      {/* Thermal Receipt Modal */}
      {isReceiptOpen && (
        <PrintableSlip
          patient={selectedPatient}
          tests={tests}
          departments={departments}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}

      {/* Why Q-Care Comparison Modal */}
      <WhyQCareModal
        isOpen={showWhyModal}
        onClose={() => setShowWhyModal(false)}
      />

      {/* Radar Map Fullscreen Modal */}
      {showRadarModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  {language === 'hi' ? 'अस्पताल फ्लोर नेविगेशन नक्शा' : 'Hospital Floor Navigation Map'}
                </h3>
              </div>
              <button
                onClick={() => setShowRadarModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <HospitalFloorRadar onClose={() => setShowRadarModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
