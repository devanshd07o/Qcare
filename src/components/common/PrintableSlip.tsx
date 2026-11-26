import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Patient, DiagnosticTest, Department } from '../../types';
import { useHospitalStore } from '../../store/useHospitalStore';
import { estimateWalkinInvestigations } from '../../engine/labTurnaroundEngine';
import { X, QrCode as QrIcon } from 'lucide-react';

interface PrintableSlipProps {
  patient: Patient;
  tests: DiagnosticTest[];
  departments: Department[];
  onClose: () => void;
}

export const PrintableSlip: React.FC<PrintableSlipProps> = ({
  patient,
  tests,
  departments,
  onClose
}) => {
  const { currentHospital, selectAndLoginPatient, counters, queueTokens, clinicalReports } = useHospitalStore();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const slipEstimate = React.useMemo(
    () =>
      estimateWalkinInvestigations(patient.prescribedTests, {
        tests,
        departments,
        counters,
        queueTokens,
        clinicalReports,
        doctorPriority: patient.doctorPriority || 'normal',
        excludePatientId: patient.id
      }),
    [patient.id, patient.prescribedTests, patient.doctorPriority, tests, departments, counters, queueTokens, clinicalReports]
  );

  // Lock body scroll while modal open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://qcare.app';
    const payloadObj = {
      id: patient.id,
      uhid: patient.uhid,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      contact: patient.contact,
      token: patient.opdTokenNumber,
      tests: patient.prescribedTests,
      status: patient.status,
      docStatus: patient.doctorReviewStatus,
      route: patient.assignedSmartRoute,
      locked: patient.currentLockedDestinationTestId
    };
    const payloadEncoded = encodeURIComponent(btoa(JSON.stringify(payloadObj)));
    // Unique per patient via qrSessionId — different QR for every patient
    const url = `${origin}/?session=${patient.qrSessionId}&p=${payloadEncoded}`;
    setQrCodeDataUrl('');

    QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' }
    })
      .then(d => setQrCodeDataUrl(d))
      .catch(() => {});
  }, [patient.id, patient.uhid, patient.qrSessionId, JSON.stringify(patient.prescribedTests)]);

  const handleOpenPatientPass = () => { onClose(); selectAndLoginPatient(patient.id); };

  const prescribedList = patient.prescribedTests.map(id => {
    const test = tests.find(t => t.id === id);
    const dept = test ? departments.find(d => d.id === test.departmentId) : undefined;
    return { test, dept };
  });
  const hasTests = prescribedList.length > 0;

  return (
    // Overlay — light washout, no blur, background fully visible
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 print:static print:p-0"
      style={{ background: 'rgba(15,23,42,0.18)' }}
    >
      {/*
        Wrapper div — relative, same max-width as card.
        X button floats just above the card's top-right corner.
      */}
      <div className="relative w-full" style={{ maxWidth: 620 }}>

        {/* ── Close button — above card, right side, pill shape ── */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          data-tooltip="Close"
          className="absolute right-0 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-slate-900 shadow-sm text-[11px] font-medium transition-colors duration-150 cursor-pointer print:hidden"
          style={{ bottom: 'calc(100% + 8px)' }}
        >
          <X className="w-3.5 h-3.5" />
          Close
        </button>

        {/* ── Card ── */}
        <div
          className="printable-slip-card relative bg-white w-full rounded-2xl shadow-2xl print:shadow-none overflow-hidden"
          style={{ maxHeight: 'calc(100dvh - 72px)' }}
        >
          {/* QCare watermark — faint, left col background, center */}
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none absolute opacity-[0.04] grayscale"
            style={{
              zIndex: 0,
              width: 180,
              bottom: 24,
              left: 24,
              transform: 'rotate(-6deg)'
            }}
          />

          {/* Teal accent line at top */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{
              background: 'linear-gradient(90deg, var(--accent-primary, #0f766e) 0%, #0d9488 55%, transparent 100%)',
              zIndex: 2
            }}
            aria-hidden="true"
          />

          {/* ══ Two-column body ══ */}
          <div
            className="relative flex flex-col sm:flex-row"
            style={{ zIndex: 1 }}
          >

            {/* ── LEFT: identity + route (fixed height, no scroll on col itself) ── */}
            <div className="flex-1 min-w-0 px-6 pt-6 pb-6 flex flex-col gap-4">

              {/* Hospital + Doctor */}
              <div>
                <p className="text-[13px] font-semibold text-slate-900 leading-tight">
                  {currentHospital.name}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {patient.prescribedDoctorName}
                  {patient.prescribedDoctorRoom ? ` · ${patient.prescribedDoctorRoom}` : ''}
                </p>
              </div>

              {/* Token + Name */}
              <div className="space-y-1">
                <p className="font-mono text-[11px] text-teal-600 tabular-nums tracking-widest uppercase">
                  {patient.opdTokenNumber} · {patient.registrationTime}
                </p>
                <h2
                  className="text-[26px] font-bold text-slate-900 leading-tight tracking-tight"
                  style={{ textWrap: 'balance' }}
                >
                  {patient.name}
                </h2>
                <p className="text-xs text-slate-400 tabular-nums">
                  {patient.age} y · {patient.gender} · {patient.uhid}
                </p>
              </div>

              {patient.priority === 'emergency' && (
                <p className="text-[11px] font-bold text-red-600 uppercase tracking-widest border-l-2 border-red-500 pl-2">
                  Emergency Triage
                </p>
              )}

              {/* Divider */}
              <div className="border-t border-slate-100" />

              {/* Investigations header (sticky label) */}
              <div className="flex items-baseline justify-between shrink-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  {hasTests ? 'Investigations' : 'Route'}
                </p>
                {hasTests && slipEstimate.totalEstimatedMinutes > 0 && (
                  <p className="text-[10px] text-teal-600 tabular-nums">
                    ~{slipEstimate.totalEstimatedMinutes} min · {slipEstimate.readyAtTime}
                  </p>
                )}
              </div>

              {/* ── Investigations list — INTERNAL SCROLL only here ── */}
              <div
                className="overflow-y-auto divide-y divide-slate-50"
                style={{ maxHeight: 180 }}
              >
                {!hasTests ? (
                  <div className="py-2.5 flex gap-3">
                    <span className="font-mono text-[10px] text-slate-300 w-3 shrink-0 tabular-nums pt-px">1</span>
                    <div>
                      <p className="text-[12px] font-semibold text-slate-800">OPD Consultation</p>
                      <p className="text-[11px] text-slate-400">
                        {patient.prescribedDoctorName} · {patient.prescribedDoctorRoom}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {prescribedList.map(({ test, dept }, idx) => (
                      <div key={test?.id || idx} className="py-2.5 flex gap-3">
                        <span className="font-mono text-[10px] text-slate-300 w-3 shrink-0 tabular-nums pt-px">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-[12px] font-semibold text-slate-800 leading-snug">{test?.name}</p>
                          <p className="text-[11px] text-slate-400">{dept?.location.room} · {dept?.location.floor}</p>
                        </div>
                      </div>
                    ))}
                    <div className="py-2.5 flex gap-3">
                      <span className="font-mono text-[10px] text-slate-300 w-3 shrink-0 tabular-nums pt-px">
                        {prescribedList.length + 1}
                      </span>
                      <div>
                        <p className="text-[12px] font-semibold text-slate-800">
                          Return · {patient.prescribedDoctorName}
                        </p>
                        <p className="text-[11px] text-slate-400">{patient.prescribedDoctorRoom}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* ── Perforation divider ── */}
            <div
              className="hidden sm:flex flex-col items-center w-px relative shrink-0"
              aria-hidden="true"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border border-slate-100 shadow-sm" />
              <div className="flex-1 w-full border-l border-dashed border-slate-200" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border border-slate-100 shadow-sm" />
            </div>

            {/* ── RIGHT: QR dominant + actions ── */}
            <div
              className="sm:w-[204px] shrink-0 flex flex-col items-center justify-between gap-5 px-6 py-7 border-t sm:border-t-0 border-slate-100 print:hidden"
              style={{ background: 'linear-gradient(160deg, #f0fdf9 0%, #ffffff 60%)' }}
            >

              {/* QR — hero element, largest thing in the right col */}
              <div className="flex flex-col items-center gap-2.5 w-full">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt={`QR — ${patient.uhid}`}
                    className="w-[164px] h-[164px] rounded-xl bg-white"
                    draggable={false}
                  />
                ) : (
                  <div className="w-[164px] h-[164px] rounded-xl bg-white border border-slate-100 flex items-center justify-center">
                    <QrIcon className="w-9 h-9 text-slate-300 animate-pulse" />
                  </div>
                )}
                <p className="text-[10px] text-slate-400 text-center">Scan to open live pass</p>
                <p className="font-mono text-[9.5px] text-teal-500 tabular-nums">{patient.uhid}</p>
              </div>

              {/* Actions — 2 only */}
              <div className="w-full space-y-2">
                <button
                  type="button"
                  onClick={handleOpenPatientPass}
                  data-tooltip="Open patient live boarding pass"
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer"
                >
                  Open Live Pass
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  data-tooltip="Print or save as PDF"
                  className="w-full py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 text-[11px] font-medium transition-colors duration-150 cursor-pointer"
                >
                  Print / Save PDF
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
