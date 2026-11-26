import React, { useState, useRef } from 'react';
import {
  QrCode, Search, ShieldCheck, Pill, Clock, CheckCircle2,
  AlertTriangle, User, Calendar, FileText, ChevronDown,
  Package, X, Loader2, Stethoscope, Building2, ArrowLeft,
  ScanLine, Check
} from 'lucide-react';
import { pharmacyApi, ApiPatientSummary, ApiPrescription, ApiMedication } from '../../api/client';

/* ────────────────────────────────────────────────────────
   Design tokens — violet/purple palette for pharmacy
──────────────────────────────────────────────────────── */
const PH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap');

.ph-root {
  --ph-violet: #7c3aed;
  --ph-purple: #6d28d9;
  --ph-line: rgba(109,40,217,.09);
  font-family: 'Figtree', ui-sans-serif, system-ui, sans-serif;
  position: relative; isolation: isolate;
}

.ph-aurora { position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden }
.ph-aurora i { position:absolute;border-radius:50%;filter:blur(90px);opacity:.35;will-change:transform }
.ph-aurora i:nth-child(1){width:44vw;height:44vw;left:-10vw;top:-12vw;background:radial-gradient(circle,#c4b5fd,transparent 66%);animation:phD1 26s ease-in-out infinite alternate}
.ph-aurora i:nth-child(2){width:38vw;height:38vw;right:-8vw;top:8vh;background:radial-gradient(circle,#a78bfa,transparent 66%);animation:phD2 34s ease-in-out infinite alternate}
.ph-aurora i:nth-child(3){width:36vw;height:36vw;left:30vw;bottom:-18vw;background:radial-gradient(circle,#ddd6fe,transparent 66%);animation:phD3 40s ease-in-out infinite alternate}
@keyframes phD1{to{transform:translate(8vw,6vh) scale(1.1)}}
@keyframes phD2{to{transform:translate(-7vw,9vh) scale(.93)}}
@keyframes phD3{to{transform:translate(-9vw,-7vh) scale(1.12)}}

.ph-glass {
  background:linear-gradient(180deg,rgba(255,255,255,.93),rgba(255,255,255,.74));
  -webkit-backdrop-filter:blur(20px) saturate(1.5);
  backdrop-filter:blur(20px) saturate(1.5);
  border:1px solid rgba(255,255,255,.95);
  box-shadow:0 1px 0 rgba(255,255,255,.95) inset,0 0 0 1px var(--ph-line),0 24px 48px -24px rgba(90,20,180,.14),0 2px 6px rgba(90,20,180,.04);
  border-radius:22px;
}

.ph-rise { animation:phRise .65s cubic-bezier(.2,.8,.2,1) backwards }
.ph-rise:nth-child(1){animation-delay:.04s}
.ph-rise:nth-child(2){animation-delay:.14s}
.ph-rise:nth-child(3){animation-delay:.24s}
@keyframes phRise{from{opacity:0;transform:translateY(16px)}}

.ph-scan-ring {
  position:relative;
  width:120px;height:120px;
  border-radius:24px;
  border:2px dashed rgba(109,40,217,.3);
  display:grid;place-items:center;
  animation:phPulse 2s ease-in-out infinite;
}
@keyframes phPulse{0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.25)}50%{box-shadow:0 0 0 14px rgba(124,58,237,0)}}

.ph-field {
  height:2.75rem;border-radius:14px;
  background:rgba(245,243,255,.85);
  border:1px solid rgba(109,40,217,.15);
  box-shadow:inset 0 1px 2px rgba(109,40,217,.04);
  transition:border-color .2s,box-shadow .25s,background .2s;
  padding:0 .9rem;font-size:14px;width:100%;outline:none;
}
.ph-field:focus { background:#fff;border-color:var(--ph-violet);box-shadow:0 0 0 4px rgba(124,58,237,.12) }

.ph-btn-primary {
  height:2.75rem;padding:0 1.5rem;border-radius:14px;font-size:14px;font-weight:700;
  background:linear-gradient(110deg,var(--ph-violet),#9333ea);
  color:#fff;border:none;cursor:pointer;
  box-shadow:0 8px 16px -8px rgba(124,58,237,.7);
  transition:transform .15s,box-shadow .2s,opacity .2s;
  display:flex;align-items:center;gap:8px;
}
.ph-btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 20px -8px rgba(124,58,237,.8)}
.ph-btn-primary:active{transform:scale(.97)}
.ph-btn-primary:disabled{opacity:.55;cursor:not-allowed}

.ph-btn-ghost {
  height:2.25rem;padding:0 1rem;border-radius:10px;font-size:13px;font-weight:600;
  background:rgba(124,58,237,.08);color:var(--ph-violet);border:1px solid rgba(124,58,237,.2);
  cursor:pointer;transition:background .2s;display:flex;align-items:center;gap:6px;
}
.ph-btn-ghost:hover{background:rgba(124,58,237,.14)}

.ph-med-row {
  display:flex;align-items:flex-start;gap:12px;
  padding:14px 16px;border-radius:16px;
  background:rgba(245,243,255,.6);border:1px solid rgba(109,40,217,.1);
  transition:background .2s,border-color .2s;
}
.ph-med-row.selected { background:rgba(124,58,237,.08);border-color:rgba(124,58,237,.35) }
.ph-med-row.dispensed { background:rgba(5,150,105,.06);border-color:rgba(5,150,105,.2);opacity:.7 }

.ph-badge {
  font-size:11px;font-weight:700;padding:2px 9px;border-radius:999px;
  background:rgba(124,58,237,.1);color:var(--ph-violet);border:1px solid rgba(124,58,237,.2);
  box-shadow:0 1px 2px rgba(15,23,42,.08),0 1px 0 rgba(15,23,42,.04),inset 0 1px 0 rgba(255,255,255,.65);
}
.ph-badge-green { background:rgba(5,150,105,.1);color:#059669;border-color:rgba(5,150,105,.25) }
.ph-badge-amber { background:rgba(245,158,11,.1);color:#d97706;border-color:rgba(245,158,11,.25) }
.ph-badge-red   { background:rgba(239,68,68,.1);color:#dc2626;border-color:rgba(239,68,68,.25) }
`;

interface PharmacyPortalProps {
  pharmacistName: string;
  pharmacyName: string;
  onBack: () => void;
}

export const PharmacyPortal: React.FC<PharmacyPortalProps> = ({ pharmacistName, pharmacyName, onBack }) => {
  const [mode, setMode] = useState<'scan' | 'result'>('scan');
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState<ApiPatientSummary | null>(null);
  const [prescriptions, setPrescriptions] = useState<ApiPrescription[]>([]);
  const [selectedRxId, setSelectedRxId] = useState<string | null>(null);
  const [selectedMedIds, setSelectedMedIds] = useState<Set<string>>(new Set());
  const [dispensing, setDispensing] = useState(false);
  const [dispensedSuccess, setDispensedSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedRx = prescriptions.find(p => p.id === selectedRxId) ?? null;

  async function handleScan() {
    const id = qrInput.trim().toUpperCase();
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await pharmacyApi.scanQR(id);
      setPatient(data.patient);
      setPrescriptions(data.prescriptions);
      setSelectedRxId(data.prescriptions[0]?.id ?? null);
      setSelectedMedIds(new Set());
      setDispensedSuccess(false);
      setMode('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'QR scan failed');
    } finally {
      setLoading(false);
    }
  }

  function toggleMed(id: string, dispensed: boolean) {
    if (dispensed) return; // already dispensed
    setSelectedMedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDispense() {
    if (!selectedRx || selectedMedIds.size === 0) return;
    setDispensing(true);
    try {
      await pharmacyApi.dispense({
        prescriptionId: selectedRx.id,
        pharmacyName,
        medicationIds: Array.from(selectedMedIds),
        notes: '',
      });
      setDispensedSuccess(true);
      // Refresh prescription list
      const refreshed = await pharmacyApi.scanQR(qrInput.trim().toUpperCase());
      setPrescriptions(refreshed.prescriptions);
      const updRx = refreshed.prescriptions.find(p => p.id === selectedRx.id);
      if (updRx) setSelectedRxId(updRx.id);
      setSelectedMedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dispense failed');
    } finally {
      setDispensing(false);
    }
  }

  function reset() {
    setMode('scan');
    setQrInput('');
    setPatient(null);
    setPrescriptions([]);
    setSelectedRxId(null);
    setSelectedMedIds(new Set());
    setDispensedSuccess(false);
    setError('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const rxStatusColor = (s: string) =>
    s === 'active' ? 'ph-badge-green' :
    s === 'partially_dispensed' ? 'ph-badge-amber' :
    s === 'fully_dispensed' ? '' : 'ph-badge-red';

  return (
    <div className="ph-root min-h-screen pb-16">
      <style>{PH_CSS}</style>
      {/* Aurora */}
      <div className="ph-aurora"><i /><i /><i /></div>

      {/* Topbar */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="ph-glass px-5 py-3 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="ph-btn-ghost">
              <ArrowLeft size={15} /> Back
            </button>
            <div className="w-px h-5 bg-violet-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 grid place-items-center shadow-sm">
                <Pill size={16} className="text-white" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-violet-400">Pharmacy Portal</p>
                <p className="text-sm font-bold text-slate-800">{pharmacyName}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-slate-500">
            <User size={13} />
            <span className="font-semibold">{pharmacistName}</span>
          </div>
        </div>

        {/* SCAN MODE */}
        {mode === 'scan' && (
          <div className="ph-glass p-8 ph-rise flex flex-col items-center gap-6 max-w-md mx-auto">
            <div className="ph-scan-ring">
              <ScanLine size={40} className="text-violet-500" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black text-slate-800 mb-1">Scan Patient QR</h2>
              <p className="text-sm text-slate-500">Enter QR session ID or scan to load patient prescriptions</p>
            </div>

            {error && (
              <div className="w-full flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="w-full flex gap-2">
              <input
                ref={inputRef}
                className="ph-field flex-1"
                placeholder="e.g. QC-DEMO or QC-9411"
                value={qrInput}
                onChange={e => setQrInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
                autoFocus
              />
              <button
                className="ph-btn-primary"
                onClick={handleScan}
                disabled={loading || !qrInput.trim()}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {loading ? 'Loading...' : 'Find'}
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center">
              Patient shares QR code from their QCare health card. Scan with a QR reader or type the session ID manually.
            </p>
          </div>
        )}

        {/* RESULT MODE */}
        {mode === 'result' && patient && (
          <div className="space-y-5">
            {/* Patient card */}
            <div className="ph-glass px-6 py-4 ph-rise flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 grid place-items-center shadow-md">
                  <User size={22} className="text-white" />
                </div>
                <div>
                  <p className="font-black text-lg text-slate-800">{patient.name}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="font-mono text-xs bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-lg text-violet-700 font-bold">{patient.uhid}</span>
                    <span>{patient.age}y · {patient.gender}</span>
                    {(patient as ApiPatientSummary & { allergies?: string }).allergies && (
                      <span className="text-xs text-red-600 font-semibold">⚠ Allergies: {(patient as ApiPatientSummary & { allergies?: string }).allergies}</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={reset} className="ph-btn-ghost">
                <X size={14} /> New Scan
              </button>
            </div>

            {dispensedSuccess && (
              <div className="ph-glass px-5 py-3 border border-emerald-300 bg-emerald-50/60 flex items-center gap-3 ph-rise">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <p className="text-sm font-bold text-emerald-700">Medications dispensed successfully!</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <AlertTriangle size={15} />
                <span>{error}</span>
                <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
              </div>
            )}

            {prescriptions.length === 0 ? (
              <div className="ph-glass px-6 py-12 text-center ph-rise">
                <FileText size={36} className="text-violet-200 mx-auto mb-3" />
                <p className="font-bold text-slate-500">No active prescriptions found</p>
                <p className="text-sm text-slate-400 mt-1">All prescriptions have been dispensed or expired.</p>
              </div>
            ) : (
              <>
                {/* Prescription tabs */}
                {prescriptions.length > 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {prescriptions.map(rx => (
                      <button
                        key={rx.id}
                        onClick={() => { setSelectedRxId(rx.id); setSelectedMedIds(new Set()); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedRxId === rx.id
                            ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                            : 'bg-white/70 text-slate-600 border-slate-200 hover:border-violet-300'
                        }`}
                      >
                        {rx.id} · {new Date(rx.issuedAt).toLocaleDateString()}
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected prescription detail */}
                {selectedRx && (
                  <div className="ph-glass p-6 space-y-5 ph-rise">
                    {/* Rx header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-violet-600 font-bold">{selectedRx.id}</span>
                          <span className={`ph-badge ${rxStatusColor(selectedRx.status)}`}>
                            {selectedRx.status.replace('_', ' ')}
                          </span>
                        </div>
                        {selectedRx.diagnosis && (
                          <p className="text-sm font-semibold text-slate-700">Dx: {selectedRx.diagnosis}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Stethoscope size={11} /> Dr. {selectedRx.doctor?.name}</span>
                          <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(selectedRx.issuedAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Clock size={11} /> Valid till {new Date(selectedRx.validUntil).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {selectedRx.clinicalNotes && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 max-w-xs">
                          <p className="text-xs font-bold text-amber-700 mb-0.5">Doctor's Note</p>
                          <p className="text-xs text-amber-800">{selectedRx.clinicalNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Medications */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Medications ({selectedRx.medications.length})
                        </p>
                        {selectedRx.status !== 'fully_dispensed' && (
                          <button
                            onClick={() => {
                              const undispensed = selectedRx.medications.filter(m => !m.dispensed).map(m => m.id);
                              setSelectedMedIds(new Set(undispensed));
                            }}
                            className="text-xs font-bold text-violet-600 hover:underline"
                          >
                            Select all
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {(selectedRx.medications as ApiMedication[]).map(med => (
                          <div
                            key={med.id}
                            onClick={() => toggleMed(med.id, med.dispensed)}
                            className={`ph-med-row ${selectedMedIds.has(med.id) ? 'selected' : ''} ${med.dispensed ? 'dispensed' : 'cursor-pointer'}`}
                          >
                            {/* Checkbox */}
                            <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                              med.dispensed ? 'bg-emerald-500 border-emerald-500' :
                              selectedMedIds.has(med.id) ? 'bg-violet-600 border-violet-600' :
                              'border-violet-200 bg-white'
                            }`}>
                              {(med.dispensed || selectedMedIds.has(med.id)) && <Check size={12} className="text-white" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-sm text-slate-800">{med.drugName}</p>
                                {med.genericName && <span className="text-xs text-slate-400">({med.genericName})</span>}
                                <span className="ph-badge">{med.dose}</span>
                                {med.dispensed && <span className="ph-badge ph-badge-green flex items-center gap-1"><CheckCircle2 size={10} /> Dispensed</span>}
                              </div>
                              <div className="flex gap-3 mt-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Clock size={10} /> {med.frequency}</span>
                                <span className="flex items-center gap-1"><Package size={10} /> {med.duration}</span>
                                {med.quantity && <span>Qty: {med.quantity}</span>}
                              </div>
                              {med.instructions && (
                                <p className="mt-1 text-xs text-violet-600 font-medium">{med.instructions}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dispense CTA */}
                    {selectedRx.status !== 'fully_dispensed' && (
                      <div className="flex items-center justify-between pt-2 border-t border-violet-100">
                        <p className="text-sm text-slate-500">
                          {selectedMedIds.size} of {selectedRx.medications.filter(m => !m.dispensed).length} selected
                        </p>
                        <button
                          className="ph-btn-primary"
                          onClick={handleDispense}
                          disabled={dispensing || selectedMedIds.size === 0}
                        >
                          {dispensing
                            ? <><Loader2 size={15} className="animate-spin" /> Processing...</>
                            : <><ShieldCheck size={15} /> Dispense {selectedMedIds.size > 0 ? `(${selectedMedIds.size})` : ''}</>
                          }
                        </button>
                      </div>
                    )}

                    {selectedRx.status === 'fully_dispensed' && (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <p className="text-sm font-bold text-emerald-700">All medications fully dispensed.</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacyPortal;
