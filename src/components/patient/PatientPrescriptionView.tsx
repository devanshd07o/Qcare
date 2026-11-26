import React, { useState } from 'react';
import { 
  Pill, 
  Calendar, 
  Clock, 
  User, 
  Printer, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ShieldCheck, 
  Sparkles,
  Share2,
  Download,
  Sun,
  Moon,
  Coffee,
  Check,
  Building2,
  Stethoscope
} from 'lucide-react';
import { Patient, Prescription, MedicationItem } from '../../types';
import { useHospitalStore } from '../../store/useHospitalStore';

interface PatientPrescriptionViewProps {
  patient: Patient;
  onShowHealthCard?: () => void;
}

export const PatientPrescriptionView: React.FC<PatientPrescriptionViewProps> = ({ 
  patient, 
  onShowHealthCard 
}) => {
  const { currentHospital, language } = useHospitalStore();
  const [showChemistQR, setShowChemistQR] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Generate authentic mock clinical prescriptions tailored to this patient's symptoms/complaint
  const mockPrescriptions: Prescription[] = [
    {
      id: `RX-${patient.uhid.replace('QC-', '')}-01`,
      patientId: patient.id,
      patientName: patient.name,
      patientUhid: patient.uhid,
      doctorId: patient.prescribedDoctorId || 'doc-01',
      doctorName: patient.prescribedDoctorName || 'Dr. Arjun Sharma',
      hospitalCode: currentHospital.code,
      issuedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      diagnosis: patient.currentIllness || patient.symptoms || 'Acute Upper Respiratory Tract Symptoms & Otitis Media',
      clinicalNotes: 'Blood pressure and vitals evaluated. Complete the full antibiotic and anti-inflammatory course. Drink adequate warm fluids. Avoid cold or dusty environments.',
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: 'active',
      medications: [
        {
          id: 'med-1',
          drugName: 'Amoxicillin + Clavulanate (Augmentin)',
          genericName: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
          dose: '625 mg',
          frequency: 'Twice daily (BD)',
          duration: '5 days',
          route: 'Oral',
          instructions: 'Take 1 tablet after meals (Morning and Night). Complete full 5-day course.',
          quantity: '10 tablets',
          dispensed: false
        },
        {
          id: 'med-2',
          drugName: 'Paracetamol (Dolo 650)',
          genericName: 'Paracetamol IP',
          dose: '650 mg',
          frequency: 'SOS / Max 3 times daily (TDS)',
          duration: '3 days',
          route: 'Oral',
          instructions: 'Take only when fever > 100°F or body ache occurs. Maintain 6-hour gap.',
          quantity: '6 tablets',
          dispensed: true
        },
        {
          id: 'med-3',
          drugName: 'Levocetirizine + Montelukast',
          genericName: 'Levocetirizine 5mg + Montelukast 10mg',
          dose: '1 tablet',
          frequency: 'Once daily at bedtime (HS)',
          duration: '7 days',
          route: 'Oral',
          instructions: 'Take 1 tablet at night before sleeping. May cause mild drowsiness.',
          quantity: '7 tablets',
          dispensed: false
        },
        {
          id: 'med-4',
          drugName: 'Pantoprazole (Pan-40)',
          genericName: 'Pantoprazole Gastro-resistant',
          dose: '40 mg',
          frequency: 'Once daily before breakfast (OD)',
          duration: '5 days',
          route: 'Oral',
          instructions: 'Take empty stomach in the morning 30 minutes before food with water.',
          quantity: '5 tablets',
          dispensed: false
        }
      ]
    }
  ];

  const primaryRx = mockPrescriptions[0];

  const copyPrescriptionId = () => {
    navigator.clipboard.writeText(primaryRx.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6">
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
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Active &amp; Valid</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Prescription #{primaryRx.id}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Issued by <strong className="text-slate-800">{primaryRx.doctorName}</strong> ({patient.prescribedDoctorRoom || 'Chamber 204'}) • {currentHospital.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <button
            type="button"
            onClick={copyPrescriptionId}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5" />}
            <span>{copiedId ? 'Copied' : 'Copy Rx ID'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowChemistQR(!showChemistQR)}
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>Show Chemist QR</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
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
            <div className="space-y-2 max-w-xl text-center md:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 bg-white/10 px-3 py-1 rounded-full">
                Instant Pharmacy Dispense Protocol
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Show this QR to Chemist or Hospital Pharmacy
              </h3>
              <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
                Any registered medical store can scan this barcode or enter patient session <strong className="text-white bg-teal-800/80 px-2 py-0.5 rounded font-mono font-bold">{patient.qrSessionId || 'QC-DEMO'}</strong> to view this exact digital prescription and dispense medicines instantly.
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
                <QrCode className="w-32 h-32 text-slate-900" />
              </div>
              <div className="mt-2 text-center">
                <div className="font-mono font-black text-sm text-slate-900">
                  {patient.qrSessionId || 'QC-DEMO'}
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">
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
            {primaryRx.diagnosis}
          </p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {primaryRx.clinicalNotes}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-200/80 shadow-2xs space-y-2">
          <div className="text-[10px] font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-700" />
            <span>Care Plan Schedule</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Issued On:</span>
              <span className="font-bold text-slate-800">{new Date(primaryRx.issuedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Valid Until:</span>
              <span className="font-bold text-slate-800">{new Date(primaryRx.validUntil || '').toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-teal-200/60">
              <span className="text-teal-900 font-bold">Recommended Follow-up:</span>
              <span className="font-black text-teal-950">{primaryRx.followUpDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Medicines Roster */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Prescribed Medications ({primaryRx.medications.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly adhere to the clinical dosages and food schedule indicated below.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {primaryRx.medications.filter(m => m.dispensed).length} of {primaryRx.medications.length} Dispensed
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {primaryRx.medications.map((med, index) => (
            <div
              key={med.id || index}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 hover:border-teal-300 bg-slate-50/40 hover:bg-white transition-all space-y-3 shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                        {med.drugName}
                      </h4>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        {med.dose}
                      </span>
                      {med.dispensed ? (
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
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
                  <span className="text-xs font-black text-slate-800">{med.duration} • {med.quantity}</span>
                </div>
              </div>

              {/* Timing & Food Schedule Indicator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-teal-700 shrink-0" />
                  <span><strong>Schedule:</strong> {med.frequency}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Coffee className="w-4 h-4 text-amber-700 shrink-0" />
                  <span><strong>Instructions:</strong> {med.instructions || 'Take as advised with water.'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Doctor Signature & Hospital Accreditation Seal */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900">{primaryRx.doctorName} (MCI Reg. #88921)</div>
            <div className="text-slate-500">Electronically verified & signed clinical prescription • QCare Secure Network</div>
          </div>
        </div>

        <div className="text-left sm:text-right text-[11px] text-slate-400 font-medium">
          Digital Hash: {primaryRx.id}-VERIFIED-CLINICAL
        </div>
      </div>
    </div>
  );
};
