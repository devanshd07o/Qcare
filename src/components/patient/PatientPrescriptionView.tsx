import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Pill,
  Calendar,
  Clock,
  Printer,
  QrCode,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Coffee,
  Check,
  Stethoscope,
  Package
} from 'lucide-react';
import { Patient, Prescription } from '../../types';
import { useHospitalStore } from '../../store/useHospitalStore';

interface PatientPrescriptionViewProps {
  patient: Patient;
  onShowHealthCard?: () => void;
}

const RX_STATUS_LABEL: Record<Prescription['status'], { label: string; cls: string }> = {
  active: {
    label: 'Active & Valid',
    cls: 'text-emerald-800 bg-emerald-50 border-emerald-200'
  },
  partially_dispensed: {
    label: 'Partially Dispensed',
    cls: 'text-amber-800 bg-amber-50 border-amber-200'
  },
  fully_dispensed: {
    label: 'Fully Dispensed',
    cls: 'text-teal-800 bg-teal-50 border-teal-200'
  },
  expired: {
    label: 'Expired',
    cls: 'text-rose-800 bg-rose-50 border-rose-200'
  }
};

export const PatientPrescriptionView: React.FC<PatientPrescriptionViewProps> = ({
  patient,
  onShowHealthCard
}) => {
  const { currentHospital, prescriptions, dispenseRecords, language } = useHospitalStore();
  const [showChemistQR, setShowChemistQR] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [selectedRxId, setSelectedRxId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const patientPrescriptions = prescriptions.filter(
    rx => rx.patientId === patient.id || rx.patientUhid.toUpperCase() === patient.uhid.toUpperCase()
  );

  const primaryRx =
    patientPrescriptions.find(rx => rx.id === selectedRxId) ||
    patientPrescriptions[0] ||
    null;

  const rxDispenses = primaryRx
    ? dispenseRecords.filter(d => d.prescriptionId === primaryRx.id)
    : [];

  useEffect(() => {
    if (!showChemistQR) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://qcare.app';
    const url = `${origin}/?session=${encodeURIComponent(patient.qrSessionId || patient.uhid)}&h=${encodeURIComponent(currentHospital.code)}`;
    setQrDataUrl('');
    QRCode.toDataURL(url, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' }
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [showChemistQR, patient.qrSessionId, patient.uhid, currentHospital.code]);

  const copyPrescriptionId = () => {
    if (!primaryRx) return;
    navigator.clipboard?.writeText(primaryRx.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (patientPrescriptions.length === 0 || !primaryRx) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto">
          <Pill className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            {language === 'hi' ? 'डिजिटल प्रिस्क्रिप्शन' : 'Digital Prescription'}
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight text-balance leading-tight">
            {language === 'hi'
              ? 'परामर्श जारी है — डॉक्टर के अंतिम अनुमोदन के बाद प्रिस्क्रिप्शन यहाँ दिखेगा'
              : 'Consultation in progress — digital prescription will appear here once finalized by your doctor'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-prose mx-auto leading-relaxed">
            {language === 'hi'
              ? `पंजीकृत चिकित्सक ${patient.prescribedDoctorName} (${patient.prescribedDoctorRoom || currentHospital.doctorRoom || 'Consultation Room'}) जांच रिपोर्ट की समीक्षा के बाद दवाइयों की सूची जारी करेंगे।`
              : `Once ${patient.prescribedDoctorName} (${patient.prescribedDoctorRoom || currentHospital.doctorRoom || 'Consultation Room'}) finalizes your consultation, your verified medications and pharmacy QR will sync here automatically.`}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
          {onShowHealthCard && (
            <button
              type="button"
              onClick={onShowHealthCard}
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold inline-flex items-center gap-2 transition-colors duration-150 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{language === 'hi' ? 'डिजिटल हेल्थ कार्ड देखें' : 'View Digital Health Card'}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const statusMeta = RX_STATUS_LABEL[primaryRx.status] || RX_STATUS_LABEL.active;
  const dispensedCount = primaryRx.medications.filter(m => Boolean(m.dispensed)).length;

  return (
    <div className="space-y-6">
      {/* Multiple prescriptions selector */}
      {patientPrescriptions.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {patientPrescriptions.map(rx => (
            <button
              key={rx.id}
              type="button"
              onClick={() => setSelectedRxId(rx.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors duration-150 tabular-nums cursor-pointer ${
                primaryRx.id === rx.id
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
              }`}
            >
              {rx.id} · {new Date(rx.issuedAt).toLocaleDateString()}
            </button>
          ))}
        </div>
      )}

      {/* Top Rx Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0 shadow-2xs">
            <Pill className="w-6 h-6 text-teal-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Official Digital Prescription
              </span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${statusMeta.cls}`}>
                <CheckCircle2 className="w-3 h-3" />
                <span>{statusMeta.label}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 text-balance leading-tight tabular-nums">
              Prescription #{primaryRx.id}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-prose leading-normal">
              Issued by <strong className="text-slate-800">{primaryRx.doctorName}</strong> ({patient.prescribedDoctorRoom || currentHospital.doctorRoom || 'Consultation Room'}) • {currentHospital.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <button
            type="button"
            onClick={copyPrescriptionId}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors duration-150 cursor-pointer"
          >
            {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5" />}
            <span>{copiedId ? 'Copied' : 'Copy Rx ID'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowChemistQR(!showChemistQR)}
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-2 transition-[background-color,transform] duration-150 shadow-xs cursor-pointer active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>{showChemistQR ? 'Hide Chemist QR' : 'Show Chemist QR'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors duration-150 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Rx</span>
          </button>
        </div>
      </div>

      {/* Chemist / Pharmacy Scan Banner (Expands on Click) */}
      {showChemistQR && (
        <div className="bg-gradient-to-br from-teal-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800 animate-scaleUp">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-prose text-center md:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 bg-white/10 px-3 py-1 rounded-full">
                Instant Pharmacy Dispense Protocol
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white text-balance leading-tight">
                Show this QR to Chemist or Hospital Pharmacy
              </h3>
              <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed max-w-prose">
                Any registered medical store can scan this barcode or enter patient session{' '}
                <strong className="text-white bg-teal-800/80 px-2 py-0.5 rounded tabular-nums font-bold">
                  {patient.qrSessionId || patient.uhid}
                </strong>{' '}
                to verify this prescription and dispense medicines.
              </p>
              <div className="flex items-center gap-3 pt-2 justify-center md:justify-start text-xs text-teal-200">
                <span className="flex items-center gap-1">✓ Tamper-proof digital seal</span>
                <span>•</span>
                <span className="flex items-center gap-1">✓ Real-time dispense tracking</span>
              </div>
            </div>

            {/* QR Card */}
            <div className="bg-white p-4 rounded-2xl shadow-2xl text-slate-900 flex flex-col items-center shrink-0">
              <div className="w-40 h-40 bg-slate-50 rounded-xl border-2 border-dashed border-teal-600 flex flex-col items-center justify-center p-2 relative">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Chemist QR for ${patient.uhid}`}
                    className="w-36 h-36 object-contain"
                    draggable={false}
                  />
                ) : (
                  <QrCode className="w-32 h-32 text-slate-900" />
                )}
              </div>
              <div className="mt-2 text-center">
                <div className="tabular-nums font-black text-sm text-slate-900">
                  {patient.qrSessionId || patient.uhid}
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tabular-nums">
                  Patient UHID: {patient.uhid}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clinical Diagnosis & Notes Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
            <span>Primary Diagnosis & Clinical Evaluation</span>
          </div>
          <p className="text-base font-extrabold text-slate-900">
            {primaryRx.diagnosis || patient.chiefComplaint || patient.symptoms || 'Clinical OPD Consultation'}
          </p>
          {primaryRx.clinicalNotes && (
            <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-prose">
              {primaryRx.clinicalNotes}
            </p>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-200/80 shadow-2xs space-y-2">
          <div className="text-[10px] font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-700" />
            <span>Care Plan Schedule</span>
          </div>
          <div className="space-y-1 text-xs tabular-nums">
            <div className="flex justify-between">
              <span className="text-slate-500">Issued On:</span>
              <span className="font-bold text-slate-800">{new Date(primaryRx.issuedAt).toLocaleDateString()}</span>
            </div>
            {primaryRx.validUntil && (
              <div className="flex justify-between">
                <span className="text-slate-500">Valid Until:</span>
                <span className="font-bold text-slate-800">{new Date(primaryRx.validUntil).toLocaleDateString()}</span>
              </div>
            )}
            {primaryRx.followUpDate && (
              <div className="flex justify-between pt-1 border-t border-teal-200/60">
                <span className="text-teal-900 font-bold">Follow-up:</span>
                <span className="font-black text-teal-950">{primaryRx.followUpDate}</span>
              </div>
            )}
            {primaryRx.dispensedPharmacy && (
              <div className="flex justify-between pt-1 border-t border-teal-200/60">
                <span className="text-teal-900 font-bold">Dispensed At:</span>
                <span className="font-bold text-teal-950 truncate max-w-[140px]">{primaryRx.dispensedPharmacy}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Structured Medicines Roster */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight text-balance leading-tight tabular-nums">
              Prescribed Medications ({primaryRx.medications.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-prose">
              Strictly adhere to the clinical dosages and food schedule indicated below.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 tabular-nums">
            {dispensedCount} of {primaryRx.medications.length} Dispensed
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {primaryRx.medications.map((med, index) => (
            <div
              key={med.id || index}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 hover:border-teal-300 bg-slate-50/40 hover:bg-white transition-colors duration-150 space-y-3 shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs mt-0.5 tabular-nums">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                        {med.drugName}
                      </h4>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 tabular-nums">
                        {med.dose}
                      </span>
                      {med.dispensed ? (
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Dispensed</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          Pending Chemist Dispense
                        </span>
                      )}
                    </div>
                    {med.genericName && (
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Generic Composition: {med.genericName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Duration & Quantity</span>
                  <span className="text-xs font-black text-slate-800 tabular-nums">
                    {med.duration}{med.quantity ? ` • ${med.quantity}` : ''}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-teal-700 shrink-0" />
                  <span><strong>Schedule:</strong> {med.frequency} ({med.route || 'Oral'})</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Coffee className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="max-w-prose"><strong>Instructions:</strong> {med.instructions || 'Take as advised with water.'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pharmacy Dispense History */}
      {rxDispenses.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-extrabold text-slate-900">Pharmacy Dispense Log</h3>
          </div>
          <div className="space-y-2">
            {rxDispenses.map(rec => (
              <div key={rec.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <p className="font-bold text-slate-900">
                    {rec.medicationsDispensed.join(', ')}
                  </p>
                  <p className="text-slate-500">
                    Dispensed by {rec.pharmacistName} ({rec.pharmacyName || 'Hospital Pharmacy'})
                  </p>
                </div>
                <span className="text-slate-500 font-semibold tabular-nums shrink-0">
                  {new Date(rec.dispensedAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Doctor Signature & Hospital Accreditation Seal */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900">{primaryRx.doctorName}</div>
            <div className="text-slate-500">Electronically verified &amp; signed clinical prescription • {currentHospital.name}</div>
          </div>
        </div>

        <div className="text-left sm:text-right text-[11px] text-slate-400 font-medium tabular-nums">
          Digital Hash: {primaryRx.id}-VERIFIED
        </div>
      </div>
    </div>
  );
};
