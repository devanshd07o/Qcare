import React from 'react';
import { 
  Printer, 
  Download, 
  ShieldCheck, 
  FileText,
  ArrowLeft 
} from 'lucide-react';
import { ClinicalReport } from '../../types';

interface ClinicalReportSheetProps {
  reports: ClinicalReport[];
  patientUhid: string;
  patientName: string;
  onBack?: () => void;
}

export const ClinicalReportSheet: React.FC<ClinicalReportSheetProps> = ({
  reports,
  patientUhid,
  patientName,
  onBack
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (reports.length === 0) return;
    const content = reports.map(r => `
======================================================================
CITYCARE GENERAL HOSPITAL & RESEARCH INSTITUTE
DIAGNOSTIC TEST REPORT
======================================================================
REPORT ID      : ${r.id}
INVESTIGATION  : ${r.testName}
DATE / TIME    : ${r.timestamp}
PATIENT NAME   : ${r.patientName}
UHID           : ${r.patientUhid}
ATTENDING TECH : ${r.technicianName} (${r.counterId})
STATUS         : ${r.status.toUpperCase()}

CLINICAL IMPRESSION:
${r.summary}

MEASURED PARAMETERS:
${r.metrics.map(m => `• ${m.label.padEnd(30)} : ${m.value} ${m.unit.padEnd(8)} (Ref: ${m.normalRange}) [${m.flag.toUpperCase()}]`).join('\n')}

DOCTOR NOTES:
${r.doctorNotes || 'Pending OPD Consultation Review'}
Digital Sign: ${r.doctorSignature || 'Awaiting Consulting Medical Officer'}
======================================================================
    `.trim()).join('\n\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${patientUhid}_Diagnostic_Report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (reports.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Diagnostic Reports Ready Yet</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Your diagnostic samples and scans are being processed in the laboratories. Once filed by technicians, they will appear here.
        </p>
        {onBack && (
          <div className="pt-2">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to My Journey</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
              Medical Reports • {patientName}
            </span>
            <h2 className="text-base font-bold text-slate-900">
              {reports.length} Diagnostic {reports.length === 1 ? 'Report' : 'Reports'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Download (.txt)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-6">
        {reports.map(report => (
          <div
            key={report.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* Top Hospital Letterhead */}
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img 
                  src="/logo.png" 
                  alt="CityCare Logo" 
                  className="w-10 h-10 object-contain drop-shadow-xs" 
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                      CityCare General Hospital
                    </h3>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                      Accredited Lab
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Clinical Diagnostics & Imaging Division
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Report Status</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  report.status === 'verified_by_doctor'
                    ? 'bg-slate-100 text-slate-800 border border-slate-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{report.status === 'verified_by_doctor' ? 'Verified by Doctor' : 'Lab Uploaded'}</span>
                </span>
              </div>
            </div>

            {/* Patient & Report Metadata Strip */}
            <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">PATIENT</span>
                <strong className="text-slate-900">{report.patientName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">UHID</span>
                <strong className="text-blue-700">{report.patientUhid}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">REPORT ID</span>
                <strong className="text-slate-800">{report.id}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">DATE & TIME</span>
                <strong className="text-slate-800">{report.timestamp}</strong>
              </div>
            </div>

            {/* Main Report Body */}
            <div className="p-6 space-y-6">
              
              {/* Test Title & Summary */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-base font-bold text-slate-900">
                    Test: {report.testName}
                  </h4>
                  <span className="text-xs text-slate-500">
                    Technician: <strong className="text-slate-800">{report.technicianName}</strong>
                  </span>
                </div>

                <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">
                    Clinical Impression
                  </span>
                  <p className="leading-relaxed font-medium text-slate-900">
                    {report.summary}
                  </p>
                </div>
              </div>

              {/* Observed Parameters */}
              <div className="space-y-3">
                <span className="font-bold text-xs text-slate-600 uppercase tracking-wider block">
                  Measured Parameters
                </span>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {report.metrics.map((metric, idx) => {
                    const isNormal = metric.flag === 'normal';
                    const isCrit = metric.flag === 'critical';

                    return (
                      <div key={idx} className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        {/* Parameter Label */}
                        <div className="md:w-1/3">
                          <span className="font-bold text-sm text-slate-900 block">
                            {metric.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            Reference: {metric.normalRange}
                          </span>
                        </div>

                        {/* Visual Range Gauge Slider */}
                        <div className="md:w-1/3 space-y-1.5">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Low</span>
                            <span className="text-emerald-700 font-semibold">Normal</span>
                            <span>High</span>
                          </div>
                          
                          <div className="relative pt-1 pb-1">
                            <div className="h-2.5 w-full bg-slate-200 rounded-full relative overflow-hidden flex">
                              <div className="w-1/4 bg-amber-200" title="Low" />
                              <div className="w-2/4 bg-emerald-300" title="Normal" />
                              <div className="w-1/4 bg-rose-200" title="High" />
                            </div>

                            <div
                              className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                              style={{
                                left:
                                  metric.flag === 'low'
                                    ? '14%'
                                    : metric.flag === 'normal'
                                    ? '50%'
                                    : metric.flag === 'high'
                                    ? '82%'
                                    : '94%'
                              }}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                                  isNormal
                                    ? 'bg-emerald-600'
                                    : isCrit
                                    ? 'bg-rose-600'
                                    : 'bg-amber-500'
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Status Flag Badge & Numeric readout */}
                        <div className="md:w-1/4 text-left md:text-right flex md:flex-col items-center md:items-end justify-between">
                          <div className="text-base font-bold text-slate-900">
                            {metric.value} <span className="text-xs font-normal text-slate-500">{metric.unit}</span>
                          </div>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isNormal
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : isCrit
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {metric.flag}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Official Attestation & Doctor Notes */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Doctor's Notes & Advice
                  </span>
                  <p className="text-xs text-slate-700 font-medium">
                    {report.doctorNotes || 'Pending review with attending physician.'}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 flex items-center gap-3 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-900">{report.doctorSignature || 'Dr. Sarah Jenkins, MD'}</div>
                    <div className="text-[10px] text-slate-500">Consulting Physician</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
