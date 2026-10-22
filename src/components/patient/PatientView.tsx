import React, { useEffect, useState } from 'react';
import {
  FileText,
  Radio,
  Footprints,
  X,
  Zap,
  Printer,
  Languages,
  Map as MapIcon,
  BellRing,
  ArrowLeft
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { ClinicalBoardingPass } from './ClinicalBoardingPass';
import { HospitalFloorRadar } from '../map/HospitalFloorRadar';
import { ClinicalReportSheet } from './ClinicalReportSheet';
import { QBieCompanion } from './QBieCompanion';
import { WhyQCareModal } from '../common/WhyQCareModal';
import { PrintableSlip } from '../common/PrintableSlip';
import { RouteStep } from '../../types';
import '../../styles/qcare-motion.css';

export const PatientView: React.FC = () => {
  const {
    selectedPatient,
    currentRoutingPlan,
    clinicalReports,
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

  const [activeTab, setActiveTab] = useState<'journey' | 'reports'>('journey');
  const [showRadarModal, setShowRadarModal] = useState<boolean>(false);
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedManualTestId, setSelectedManualTestId] = useState<string | null>(null);

  // Close map modal with Escape
  useEffect(() => {
    if (!showRadarModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowRadarModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showRadarModal]);

  if (!selectedPatient) {
    return (
      <div className="qc-root qc-card p-12 text-center text-slate-500 font-sans text-sm">
        No patient profile active. Please sign in via the clinical portal reception gate.
      </div>
    );
  }

  // Reports belonging to this patient
  const patientReports = clinicalReports.filter(r => r.patientId === selectedPatient.id);

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

  const hi = language === 'hi';
  const toolBtn =
    'qc-focus qc-press min-h-[36px] px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer';

  return (
    <div className="qc-root space-y-5 pb-16 font-sans">
      {/* Live calling alert */}
      {callingAlert && (callingAlert.patientName === selectedPatient.name || !callingAlert.patientName) && (
        <div
          role="alert"
          className="qc-sheet relative overflow-hidden rounded-2xl border border-amber-300/80 bg-amber-50 p-4 flex items-center justify-between gap-3"
        >
          <span className="absolute inset-y-0 left-0 w-1 bg-amber-500" />
          <div className="flex items-center gap-3 pl-1.5">
            <div className="qc-ring-amber w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
              <BellRing className="w-[18px] h-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="qc-label !text-amber-800">
                {hi ? 'टोकन बुलाया गया' : 'Token called'}
              </p>
              <p className="font-semibold text-sm sm:text-base text-slate-900 leading-snug">
                {hi ? 'कृपया जाएं: ' : 'Please proceed to '}{callingAlert.roomNo} ({callingAlert.counterName})
              </p>
            </div>
          </div>
          {dismissCallingAlert && (
            <button
              onClick={dismissCallingAlert}
              className="qc-focus qc-press shrink-0 px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold transition-colors cursor-pointer"
            >
              {hi ? 'ठीक है' : 'Dismiss'}
            </button>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="qc-rise flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {canGoBack && (
            <button
              type="button"
              onClick={navigateBack}
              aria-label={hi ? 'पिछला पृष्ठ' : 'Go back'}
              className="qc-focus qc-press min-h-[38px] px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 hover:text-slate-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>{hi ? 'वापस' : 'Back'}</span>
            </button>
          )}

          {/* Sliding segmented control */}
          <div role="tablist" className="relative grid grid-cols-2 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/70 w-full sm:w-[360px]">
            <span
              aria-hidden
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-sm border border-slate-200/70 transition-transform duration-300"
              style={{
                transform: activeTab === 'journey' ? 'translateX(0)' : 'translateX(100%)',
                transitionTimingFunction: 'cubic-bezier(.22,.8,.3,1)'
              }}
            />
            <button
              role="tab"
              aria-selected={activeTab === 'journey'}
              onClick={() => setActiveTab('journey')}
              className={`qc-focus relative z-10 min-h-[38px] px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'journey' ? 'text-teal-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Footprints className="w-4 h-4 shrink-0" />
              <span className="truncate">{hi ? 'जांच यात्रा' : 'Diagnostic Journey'}</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'reports'}
              onClick={() => setActiveTab('reports')}
              className={`qc-focus relative z-10 min-h-[38px] px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'reports' ? 'text-teal-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">{hi ? 'रिपोर्ट्स' : 'Diagnostic Reports'}</span>
              {patientReports.length > 0 && (
                <span className="qc-mono text-[10px] px-1.5 rounded-full font-semibold bg-teal-50 text-teal-700 border border-teal-200/70">
                  {patientReports.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button type="button" onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} className={toolBtn}>
            <Languages className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
          </button>
          <button type="button" onClick={() => setIsReceiptOpen(true)} className={toolBtn}>
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{hi ? 'पर्ची QR' : 'QR Slip'}</span>
          </button>
          <button type="button" onClick={() => setShowWhyModal(true)} className={toolBtn}>
            <Zap className="w-3.5 h-3.5 text-teal-600" />
            <span>Why QCare?</span>
          </button>
          <button type="button" onClick={() => setShowRadarModal(true)} className={toolBtn}>
            <MapIcon className="w-3.5 h-3.5 text-teal-600" />
            <span>{hi ? 'नक्शा' : 'Map'}</span>
          </button>
        </div>
      </div>

      {/* Main tab content (keyed so each switch animates in) */}
      <div key={activeTab} className="qc-rise">
        {activeTab === 'journey' ? (
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
            onOpenRadar={() => setShowRadarModal(true)}
            onPrintSlip={() => setIsReceiptOpen(true)}
          />
        ) : (
          <ClinicalReportSheet
            reports={patientReports}
            patientUhid={selectedPatient.uhid}
            patientName={selectedPatient.name}
            onBack={() => setActiveTab('journey')}
            language={language}
          />
        )}
      </div>

      {/* Interactive Q-Bie AI Mascot Companion */}
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
      <WhyQCareModal isOpen={showWhyModal} onClose={() => setShowWhyModal(false)} />

      {/* Radar Map Modal */}
      {showRadarModal && (
        <div
          className="qc-fade fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[6px] flex items-end sm:items-center justify-center sm:p-4"
          onClick={() => setShowRadarModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
            className="qc-sheet bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden"
          >
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/70 text-teal-700 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-slate-900">
                  {hi ? 'अस्पताल फ्लोर नेविगेशन नक्शा' : 'Hospital Floor Navigation Map'}
                </h3>
              </div>
              <button
                onClick={() => setShowRadarModal(false)}
                aria-label="Close"
                className="qc-focus qc-press w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 sm:p-5 overflow-y-auto flex-1 bg-slate-50/60">
              <HospitalFloorRadar onClose={() => setShowRadarModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
