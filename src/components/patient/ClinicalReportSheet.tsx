import React from 'react';
import {
  Printer,
  Download,
  ShieldCheck,
  FileText,
  ArrowLeft,
  FlaskConical,
  AlertTriangle,
  BadgeCheck
} from 'lucide-react';
import { ClinicalReport } from '../../types';

interface ClinicalReportSheetProps {
  reports: ClinicalReport[];
  patientUhid: string;
  patientName: string;
  onBack?: () => void;
  language?: 'en' | 'hi';
}

export const ClinicalReportSheet: React.FC<ClinicalReportSheetProps> = ({
  reports,
  patientUhid,
  patientName,
  onBack,
  language = 'en'
}) => {
  const hi = language === 'hi';

  const L = {
    back: hi ? 'वापस' : 'Back',
    backJourney: hi ? 'मेरी यात्रा पर वापस' : 'Back to My Journey',
    emptyTitle: hi ? 'अभी कोई रिपोर्ट तैयार नहीं' : 'No diagnostic reports ready yet',
    emptyBody: hi
      ? 'आपके सैंपल और स्कैन प्रयोगशाला में प्रोसेस हो रहे हैं। तकनीशियन द्वारा दर्ज होते ही वे यहां दिखेंगे।'
      : 'Your diagnostic samples and scans are being processed in the laboratories. Once filed by technicians, they will appear here.',
    medReports: hi ? 'मेडिकल रिपोर्ट्स' : 'Medical reports',
    report: hi ? 'रिपोर्ट' : 'Report',
    reports: hi ? 'रिपोर्ट्स' : 'Reports',
    download: hi ? 'डाउनलोड (.txt)' : 'Download (.txt)',
    print: hi ? 'रिपोर्ट प्रिंट' : 'Print report',
    division: hi ? 'क्लिनिकल डायग्नोस्टिक्स एवं इमेजिंग विभाग' : 'Clinical Diagnostics & Imaging Division',
    accredited: hi ? 'मान्यता प्राप्त लैब' : 'Accredited Lab',
    status: hi ? 'रिपोर्ट स्थिति' : 'Report status',
    verified: hi ? 'डॉक्टर द्वारा सत्यापित' : 'Verified by doctor',
    uploaded: hi ? 'लैब द्वारा अपलोड' : 'Lab uploaded',
    patient: hi ? 'मरीज' : 'Patient',
    reportId: hi ? 'रिपोर्ट आईडी' : 'Report ID',
    dateTime: hi ? 'दिनांक व समय' : 'Date & time',
    test: hi ? 'जांच' : 'Investigation',
    tech: hi ? 'तकनीशियन' : 'Technician',
    impression: hi ? 'क्लिनिकल निष्कर्ष' : 'Clinical impression',
    params: hi ? 'मापे गए पैरामीटर' : 'Measured parameters',
    reference: hi ? 'सामान्य सीमा' : 'Reference',
    low: hi ? 'कम' : 'Low',
    normal: hi ? 'सामान्य' : 'Normal',
    high: hi ? 'अधिक' : 'High',
    notes: hi ? 'डॉक्टर की टिप्पणी व सलाह' : "Doctor's notes & advice",
    pending: hi ? 'डॉक्टर की समीक्षा लंबित है।' : 'Pending review with attending physician.',
    physician: hi ? 'परामर्श चिकित्सक' : 'Consulting physician',
    critNote: hi ? 'क्रिटिकल मान — कृपया तुरंत अपने डॉक्टर से मिलें।' : 'Critical value — please consult your doctor promptly.',
    footer: hi
      ? 'यह कंप्यूटर-जनित रिपोर्ट है। निदान के लिए अपने चिकित्सक से परामर्श करें।'
      : 'Computer-generated report. Please consult your physician for interpretation.'
  };

  const flagLabel = (f: string) =>
    hi
      ? ({ normal: 'सामान्य', low: 'कम', high: 'अधिक', critical: 'क्रिटिकल' } as Record<string, string>)[f] || f
      : f;

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
      <div className="qc-root qc-card qc-rise p-10 sm:p-14 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">{L.emptyTitle}</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">{L.emptyBody}</p>
        {onBack && (
          <div className="pt-2">
            <button
              onClick={onBack}
              className="qc-focus qc-press min-h-[40px] px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{L.backJourney}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="qc-root space-y-5">
      {/* Action bar */}
      <div className="qc-card qc-noprint p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="qc-focus qc-press min-h-[38px] px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{L.back}</span>
            </button>
          )}
          <div className="min-w-0">
            <span className="qc-label block truncate">{L.medReports} · {patientName}</span>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              <span className="qc-mono">{reports.length}</span> {reports.length === 1 ? L.report : L.reports}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="qc-focus qc-press min-h-[38px] px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{L.download}</span>
          </button>
          <button
            onClick={handlePrint}
            className="qc-focus qc-press min-h-[38px] px-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{L.print}</span>
          </button>
        </div>
      </div>

      {/* Reports */}
      <div className="space-y-6">
        {reports.map((report, rIdx) => {
          const verified = report.status === 'verified_by_doctor';
          const hasCritical = report.metrics.some(m => m.flag === 'critical');

          return (
            <article
              key={report.id}
              className="qc-card qc-rise overflow-hidden"
              style={{ animationDelay: `${Math.min(rIdx, 4) * 70}ms` }}
            >
              {/* Letterhead */}
              <header className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200/80">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img src="/logo.png" alt="CityCare Logo" className="w-11 h-11 object-contain shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base sm:text-lg text-slate-900 tracking-tight">CityCare General Hospital</h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/70">
                        <BadgeCheck className="w-3 h-3" />{L.accredited}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{L.division}</p>
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="qc-label block mb-1">{L.status}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${
                    verified
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-sky-50 text-sky-800 border-sky-300'
                  }`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{verified ? L.verified : L.uploaded}</span>
                  </span>
                </div>
              </header>

              {/* Meta strip */}
              <div className="px-5 sm:px-7 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-xs border-b border-slate-200/80 bg-white">
                <div className="min-w-0">
                  <span className="qc-label block">{L.patient}</span>
                  <strong className="text-slate-900 font-semibold truncate block">{report.patientName}</strong>
                </div>
                <div>
                  <span className="qc-label block">UHID</span>
                  <strong className="qc-mono text-teal-800 font-medium">{report.patientUhid}</strong>
                </div>
                <div className="min-w-0">
                  <span className="qc-label block">{L.reportId}</span>
                  <strong className="qc-mono text-slate-800 font-medium truncate block">{report.id}</strong>
                </div>
                <div>
                  <span className="qc-label block">{L.dateTime}</span>
                  <strong className="qc-mono text-slate-800 font-medium">{report.timestamp}</strong>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-7 space-y-6">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-100">
                    <h4 className="text-base font-semibold text-slate-900 inline-flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-teal-700" />
                      {report.testName}
                    </h4>
                    <span className="text-xs text-slate-500">
                      {L.tech}: <strong className="text-slate-800 font-semibold">{report.technicianName}</strong>
                    </span>
                  </div>

                  <div className="mt-3.5 pl-4 border-l-2 border-teal-600/70">
                    <span className="qc-label block mb-1">{L.impression}</span>
                    <p className="text-sm leading-relaxed text-slate-800">{report.summary}</p>
                  </div>
                </div>

                {hasCritical && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-3 text-xs text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{L.critNote}</span>
                  </div>
                )}

                {/* Parameters */}
                <div className="space-y-2.5">
                  <span className="qc-label block">{L.params}</span>

                  <div className="border border-slate-200/90 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {report.metrics.map((metric, idx) => {
                      const isNormal = metric.flag === 'normal';
                      const isCrit = metric.flag === 'critical';
                      const markerLeft =
                        metric.flag === 'low' ? '14%' : metric.flag === 'normal' ? '50%' : metric.flag === 'high' ? '82%' : '94%';

                      return (
                        <div
                          key={idx}
                          className={`relative p-3.5 sm:p-4 transition-colors hover:bg-slate-50/70 grid md:grid-cols-[1.2fr_1fr_0.9fr] gap-3 md:gap-6 md:items-center ${
                            isCrit ? 'bg-rose-50/40' : ''
                          }`}
                        >
                          {!isNormal && (
                            <span className={`absolute inset-y-0 left-0 w-[3px] ${isCrit ? 'bg-rose-500' : 'bg-amber-500'}`} />
                          )}

                          <div className="min-w-0">
                            <span className="font-semibold text-sm text-slate-900 block">{metric.label}</span>
                            <span className="text-[11px] text-slate-500">
                              {L.reference}: <span className="qc-mono">{metric.normalRange}</span>
                            </span>
                          </div>

                          <div>
                            <div className="relative h-1.5 w-full rounded-full overflow-hidden flex bg-slate-200">
                              <div className="w-1/4 bg-amber-200" />
                              <div className="w-2/4 bg-emerald-300" />
                              <div className="w-1/4 bg-rose-200" />
                            </div>
                            <div className="relative h-0">
                              <span
                                className={`absolute -top-[11px] -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow transition-all duration-700 ${
                                  isNormal ? 'bg-emerald-600' : isCrit ? 'bg-rose-600' : 'bg-amber-500'
                                }`}
                                style={{ left: markerLeft }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 mt-2.5">
                              <span>{L.low}</span>
                              <span className="text-emerald-700 font-medium">{L.normal}</span>
                              <span>{L.high}</span>
                            </div>
                          </div>

                          <div className="flex md:flex-col items-center md:items-end justify-between gap-1.5">
                            <div className="qc-mono text-base font-semibold text-slate-900">
                              {metric.value} <span className="text-xs font-normal text-slate-500 font-sans">{metric.unit}</span>
                            </div>
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
                              isNormal
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : isCrit
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {flagLabel(metric.flag)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sign-off */}
                <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                  <div className="space-y-1 min-w-0 sm:max-w-md">
                    <span className="qc-label block">{L.notes}</span>
                    <p className="text-sm text-slate-700 leading-relaxed">{report.doctorNotes || L.pending}</p>
                  </div>

                  <div className="shrink-0 sm:text-right">
                    <div className="flex sm:justify-end items-center gap-2">
                      {verified && <BadgeCheck className="w-4 h-4 text-emerald-600" />}
                      <div className="font-semibold text-sm text-slate-900 italic tracking-tight">
                        {report.doctorSignature || 'Dr. Sarah Jenkins, MD'}
                      </div>
                    </div>
                    <div className="mt-1 pt-1 border-t border-slate-300 text-[10px] uppercase tracking-wider text-slate-500">
                      {L.physician}
                    </div>
                  </div>
                </div>
              </div>

              <footer className="px-5 sm:px-7 py-2.5 bg-slate-50 border-t border-slate-200/80 text-[10px] text-slate-400">
                {L.footer}
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
};
