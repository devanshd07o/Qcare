import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  QrCode, 
  Printer, 
  Check, 
  ShieldCheck, 
  Droplet,
  Copy
} from 'lucide-react';
import { Patient, Hospital } from '../../types';

interface PatientHealthCardModalProps {
  patient: Patient;
  hospital: Hospital;
  onClose: () => void;
}

export const PatientHealthCardModal: React.FC<PatientHealthCardModalProps> = ({
  patient,
  hospital,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://qcare.app';
    const url = `${origin}/?session=${encodeURIComponent(patient.qrSessionId || 'QC-9411')}&h=${encodeURIComponent(hospital.code)}`;
    setQrDataUrl('');
    QRCode.toDataURL(url, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' }
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [patient.qrSessionId, hospital.code]);

  const copyUhid = () => {
    navigator.clipboard.writeText(patient.uhid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-scaleUp">
        
        {/* Top Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-700" />
            <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
              QCare Official Patient Digital Pass
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Digital Card Body (Styled like an executive Apple Wallet / Hospital Smart Pass) */}
        <div className="p-6 space-y-6">
          <div className="relative rounded-3xl bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 text-white p-6 shadow-xl border border-teal-800/80 space-y-5 overflow-hidden">
            {/* Ambient subtle glow circles */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Hospital branding & card type */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-500 text-white flex items-center justify-center font-black text-xs">
                  Q
                </div>
                <div>
                  <h4 className="font-black text-xs text-white tracking-wide">{hospital.name}</h4>
                  <p className="text-[10px] text-teal-300">National Healthcare Network</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-teal-200 bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Digital ID
              </span>
            </div>

            {/* Patient Core Details */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest block">
                  Patient Name
                </span>
                <h3 className="text-xl font-black text-white tracking-tight text-balance leading-tight">
                  {patient.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-teal-100/90 pt-0.5 tabular-nums">
                  <span>{patient.age}Y • {patient.gender}</span>
                  {(patient as typeof patient & { bloodGroup?: string }).bloodGroup && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-bold text-amber-300">
                        <Droplet className="w-3 h-3 fill-current" />
                        <span>Blood: {(patient as typeof patient & { bloodGroup?: string }).bloodGroup}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Patient Avatar placeholder */}
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-lg text-teal-300 shrink-0 shadow-inner">
                {patient.name.charAt(0)}
              </div>
            </div>

            {/* Dynamic QR Display */}
            <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg text-slate-900 space-y-2">
              <div className="w-36 h-36 border-2 border-dashed border-teal-700/60 rounded-xl flex items-center justify-center p-1.5 relative bg-white">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Pass ${patient.qrSessionId}`}
                    className="w-32 h-32 object-contain"
                    draggable={false}
                  />
                ) : (
                  <QrCode className="w-32 h-32 text-slate-900" />
                )}
              </div>
              <div className="text-center">
                <div className="tabular-nums font-black text-sm text-slate-900 tracking-wider">
                  {patient.qrSessionId || 'QC-DEMO'}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold">
                  Scan at Doctor Desk, Diagnostic Labs & Chemists
                </div>
              </div>
            </div>

            {/* UHID & Emergency Strip */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-teal-300 block font-bold">UHID Number</span>
                <span className="tabular-nums font-bold text-white text-xs">{patient.uhid}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-teal-300 block font-bold">Registration</span>
                <span className="tabular-nums font-bold text-white text-xs">{patient.registrationTime || 'Today'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={copyUhid}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'UHID Copied' : 'Copy UHID'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="py-2.5 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Health Pass</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed max-w-prose mx-auto">
            This digital health pass is linked to your medical profile. Pharmacists and diagnostic centers scan this code for instant authorization without paper forms.
          </p>
        </div>
      </div>
    </div>
  );
};
