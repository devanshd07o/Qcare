import React from 'react';
import {
  Activity,
  FileText,
  Pill,
  CheckCircle2,
  Download,
  Package,
  Clock
} from 'lucide-react';
import { Patient, ClinicalReport } from '../../types';
import { HISTORICAL_PATIENT_RECORDS } from '../../data/historicalPatientsData';
import { useHospitalStore } from '../../store/useHospitalStore';

interface PatientHistoryTimelineProps {
  patient: Patient;
  reports: ClinicalReport[];
  onViewReports?: () => void;
  onViewPrescriptions?: () => void;
}

export const PatientHistoryTimeline: React.FC<PatientHistoryTimelineProps> = ({
  patient,
  reports,
  onViewReports,
  onViewPrescriptions
}) => {
  const { currentHospital, queueTokens, prescriptions, dispenseRecords } = useHospitalStore();

  const matchingHistory = HISTORICAL_PATIENT_RECORDS.filter(
    h => h.uhid === patient.uhid || h.name.toLowerCase() === patient.name.toLowerCase()
  );

  const patientTokens = queueTokens.filter(
    t => t.patientId === patient.id && t.status !== 'cancelled'
  );
  const patientPrescriptions = prescriptions.filter(
    rx => rx.patientId === patient.id || rx.patientUhid.toUpperCase() === patient.uhid.toUpperCase()
  );
  const patientDispenses = dispenseRecords.filter(
    d => d.patientId === patient.id || d.patientUhid.toUpperCase() === patient.uhid.toUpperCase()
  );

  const measuredMetrics = reports.flatMap(r =>
    r.metrics.map(m => ({
      ...m,
      testName: r.testName,
      timestamp: r.timestamp
    }))
  );

  const latestRx = patientPrescriptions[0];
  const rxSummaryText = latestRx
    ? latestRx.status === 'fully_dispensed'
      ? 'Fully Dispensed'
      : latestRx.status === 'partially_dispensed'
      ? 'Partially Dispensed'
      : 'Active Rx'
    : 'Pending Doctor Rx';

  const encounterStatusLabel =
    patient.status === 'discharged'
      ? 'Discharged'
      : patient.doctorReviewStatus === 'reports_ready'
      ? 'Reports Ready'
      : patient.prescribedTests.length > 0
      ? 'In Diagnostics'
      : 'Registered';

  return (
    <div className="space-y-6">
      {/* 1. Real Clinical Progress & Measured Readings */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2 text-balance leading-tight">
              <Activity className="w-5 h-5 text-teal-700" />
              <span>Clinical Progress &amp; Diagnostic Readings</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums max-w-prose">
              Live visit telemetry since check-in at {patient.registrationTime || 'Today'} ({currentHospital.name}).
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{encounterStatusLabel}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Investigations
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
              {patient.completedTests.length}/{patient.prescribedTests.length}
            </div>
            <span className="text-[10px] font-semibold text-slate-600 inline-block">
              {patient.prescribedTests.length === 0 ? 'No labs ordered' : 'Tests completed'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Lab Reports
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
              {reports.length}
            </div>
            <span className="text-[10px] font-semibold text-slate-600 inline-block tabular-nums">
              {reports.filter(r => r.status === 'verified_by_doctor').length} doctor verified
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Prescriptions
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
              {patientPrescriptions.length}
            </div>
            <span className="text-[10px] font-semibold text-slate-600 inline-block">
              {rxSummaryText}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pharmacy Dispenses
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
              {patientDispenses.length}
            </div>
            <span className="text-[10px] font-semibold text-slate-600 inline-block">
              {patientDispenses.length > 0 ? 'Dispensed' : 'None yet'}
            </span>
          </div>
        </div>

        {/* Measured Clinical Parameters from Uploaded Lab Reports */}
        {measuredMetrics.length > 0 ? (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Measured Diagnostic Parameters
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {measuredMetrics.slice(0, 8).map((metric, i) => (
                <div key={`${metric.label}-${i}`} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-500 block truncate" title={metric.label}>
                    {metric.label}
                  </span>
                  <div className="text-sm font-black text-slate-900 tabular-nums">
                    {metric.value} <span className="text-[11px] font-normal text-slate-500">{metric.unit}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase inline-block ${
                    metric.flag === 'normal'
                      ? 'text-emerald-700'
                      : metric.flag === 'critical'
                      ? 'text-rose-700'
                      : 'text-amber-700'
                  }`}>
                    {metric.flag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 max-w-prose leading-relaxed">
            No diagnostic measurements uploaded yet — measured clinical values will appear automatically as laboratory technicians file test results.
          </div>
        )}
      </div>

      {/* 2. Dynamic Longitudinal Medical Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight text-balance leading-tight">
              Care Timeline &amp; Clinical History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-prose">
              Real-time chronological record of check-in, diagnostic tokens, lab reports, prescriptions, and pharmacy dispenses.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="text-xs font-bold text-teal-800 hover:text-teal-950 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PHR Summary</span>
          </button>
        </div>

        <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {/* Pharmacy Dispense Milestones (Newest first) */}
          {patientDispenses.map(disp => (
            <div key={disp.id} className="relative space-y-2">
              <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                      Pharmacy Dispensed
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold tabular-nums">
                    {new Date(disp.dispensedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {disp.medicationsDispensed.join(', ')}
                </p>
                <p className="text-xs text-slate-600 max-w-prose">
                  Dispensed by {disp.pharmacistName} at {disp.pharmacyName || 'Hospital Pharmacy'}.
                </p>
              </div>
            </div>
          ))}

          {/* Digital Prescription Milestones */}
          {patientPrescriptions.map(rx => (
            <div key={rx.id} className="relative space-y-2">
              <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-teal-600 ring-4 ring-teal-100" />
              <div className="p-4 rounded-2xl bg-teal-50/40 border border-teal-200/80 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Pill className="w-3.5 h-3.5 text-teal-700" />
                    <span className="text-xs font-black text-teal-900 uppercase tracking-wider tabular-nums">
                      Digital Prescription #{rx.id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-teal-200 text-teal-800 uppercase">
                      {rx.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold tabular-nums">
                    {new Date(rx.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium max-w-prose">
                  {rx.medications.length} medication(s) prescribed by {rx.doctorName}:{' '}
                  {rx.medications.map(m => `${m.drugName} (${m.dose})`).join(', ')}
                </p>
                {onViewPrescriptions && (
                  <button
                    type="button"
                    onClick={onViewPrescriptions}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-teal-800 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Pill className="w-3 h-3 text-teal-700" />
                    <span>View Prescription</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Dynamic Lab Reports */}
          {reports.map(rep => (
            <div key={rep.id} className="relative space-y-2">
              <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100" />
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-700" />
                    <span className="text-xs font-bold text-slate-900">{rep.testName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      rep.status === 'verified_by_doctor'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {rep.status === 'verified_by_doctor' ? 'Doctor Verified' : 'Lab Uploaded'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold tabular-nums">{rep.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 max-w-prose">{rep.summary}</p>
                <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500">
                  <span>{rep.roomNo} • Tech: {rep.technicianName}</span>
                  {onViewReports && (
                    <button
                      type="button"
                      onClick={onViewReports}
                      className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                    >
                      Open Report
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Today's Active Hospital Encounter */}
          <div className="relative space-y-2">
            <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-teal-700 ring-4 ring-teal-100" />
            <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/40 border border-teal-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-teal-900 uppercase tracking-wider">
                    Today's Hospital Encounter
                  </span>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                    {encounterStatusLabel}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-semibold tabular-nums">
                  {patient.registrationTime || 'Today'} • Token #{patient.opdTokenNumber || 'OPD'}
                </span>
              </div>

              <p className="text-sm font-bold text-slate-900">
                OPD Consultation with {patient.prescribedDoctorName} ({patient.prescribedDoctorRoom || currentHospital.doctorRoom || 'Consultation Room'})
              </p>
              <p className="text-xs text-slate-600 max-w-prose leading-relaxed">
                Primary Complaint: "{patient.chiefComplaint || patient.currentIllness || patient.symptoms || 'General clinical evaluation'}".
                {patientTokens.length > 0
                  ? ` ${patientTokens.length} active/completed diagnostic queue token(s) assigned.`
                  : ' Awaiting diagnostic orders or consultation sign-off.'}
              </p>

              {patientTokens.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {patientTokens.map(tok => (
                    <span
                      key={tok.id}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 tabular-nums"
                    >
                      <Clock className="w-2.5 h-2.5 text-teal-700" />
                      <span>#{tok.tokenNumber} · {tok.testName || tok.testId} ({tok.status.replace('_', ' ')})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Archived Prior Visits (only rendered when real matches exist) */}
          {matchingHistory.map((item, idx) => (
            <div key={item.id || idx} className="relative space-y-2">
              <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-slate-300 ring-4 ring-white" />
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Prior Hospital Visit
                  </span>
                  <span className="text-xs text-slate-400 font-semibold tabular-nums">{item.visitDate}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Consultation with {item.prescribedDoctorName}
                </h4>
                <p className="text-xs text-slate-600 max-w-prose">{item.chiefComplaint}</p>
                {item.diagnosisNotes && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 italic max-w-prose">
                    "{item.diagnosisNotes}"
                  </div>
                )}
                {item.testNames && item.testNames.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold">Completed:</span>
                    {item.testNames.map((tName, tIdx) => (
                      <span key={tIdx} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {tName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
