import React from 'react';
import { 
  Activity, 
  Heart, 
  Droplet, 
  Calendar, 
  Clock, 
  FileText, 
  Pill, 
  Stethoscope, 
  CheckCircle2, 
  ChevronRight, 
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Download
} from 'lucide-react';
import { Patient, ClinicalReport } from '../../types';
import { HISTORICAL_PATIENT_RECORDS } from '../../data/historicalPatientsData';

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
  // Sample historical records for this patient
  const matchingHistory = HISTORICAL_PATIENT_RECORDS.filter(
    h => h.uhid === patient.uhid || h.name.toLowerCase() === patient.name.toLowerCase()
  );

  return (
    <div className="space-y-6">
      {/* 1. Clinical Vitals Dashboard */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-700" />
              <span>Patient Vitals & Clinical Baselines</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Recorded during hospital triage intake today at {patient.registrationTime || '09:30 AM'}.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Vitals Stable</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Blood Pressure
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
              122/80 <span className="text-xs font-semibold text-slate-500">mmHg</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-600 inline-block">
              Normal Range
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Heart Rate (Pulse)
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
              74 <span className="text-xs font-semibold text-slate-500">bpm</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-600 inline-block">
              Rhythm Normal
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Oxygen (SpO2)
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
              98% <span className="text-xs font-semibold text-slate-500">Room Air</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-600 inline-block">
              Optimal
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Blood Glucose
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
              112 <span className="text-xs font-semibold text-slate-500">mg/dL</span>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
              Random
            </span>
          </div>
        </div>
      </div>

      {/* 2. Longitudinal Medical History Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Care Timeline & Clinical History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete electronic medical history across hospital visits, diagnostic evaluations and prescriptions.
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

        {/* Timeline Events */}
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          
          {/* Event 1: Today's Active Hospital Visit */}
          <div className="relative space-y-2">
            <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-teal-700 ring-4 ring-teal-100" />
            <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/40 border border-teal-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-teal-900 uppercase tracking-wider">
                    Today's Hospital Encounter
                  </span>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                    In Progress
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  {new Date().toLocaleDateString()} • Token #{patient.opdTokenNumber || 'OPD-104'}
                </span>
              </div>

              <p className="text-sm font-bold text-slate-900">
                OPD Consultation with {patient.prescribedDoctorName} ({patient.prescribedDoctorRoom || 'Chamber 204'})
              </p>
              <p className="text-xs text-slate-600">
                Primary Complaint: "{patient.currentIllness || patient.symptoms || 'General clinical evaluation'}". Prescribed investigations routed through QCare smart queue orchestrator.
              </p>

              <div className="flex items-center gap-2 pt-2 flex-wrap">
                {onViewPrescriptions && (
                  <button
                    onClick={onViewPrescriptions}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-teal-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Pill className="w-3 h-3 text-teal-700" />
                    <span>View Prescriptions</span>
                  </button>
                )}
                {onViewReports && reports.length > 0 && (
                  <button
                    onClick={onViewReports}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-teal-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3 h-3 text-teal-700" />
                    <span>View {reports.length} Reports</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Past Historical Records */}
          {matchingHistory.length > 0 ? (
            matchingHistory.map((item, idx) => (
              <div key={item.id || idx} className="relative space-y-2">
                <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-slate-300 ring-4 ring-white" />
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Prior Hospital Visit
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{item.visitDate}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Consultation with {item.prescribedDoctorName}
                  </h4>
                  <p className="text-xs text-slate-600">{item.chiefComplaint}</p>
                  {item.diagnosisNotes && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 italic">
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
            ))
          ) : (
            <div className="relative space-y-2">
              <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-slate-300 ring-4 ring-white" />
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Routine Health Profile Established
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">3 Months Prior</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Initial Registration & ABHA Health Record Linked
                </h4>
                <p className="text-xs text-slate-600">
                  Patient registered under national UHID {patient.uhid}. Basic vitals and immunization profile verified.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
