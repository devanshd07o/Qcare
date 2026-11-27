import React, { useState, useRef, useMemo } from 'react';
import {
  Search, ShieldCheck, Pill, Clock, CheckCircle2,
  AlertTriangle, User, Calendar, FileText,
  Package, X, Loader2, Stethoscope, ArrowLeft,
  ScanLine, Check, ChevronRight
} from 'lucide-react';
import {
  pharmacyApi,
  getAccessToken,
  ApiPatientSummary,
  ApiPrescription,
  ApiMedication,
  ApiDispenseRecord
} from '../../api/client';
import { useHospitalStore } from '../../store/useHospitalStore';
import { Patient, Prescription } from '../../types';

interface PharmacyPortalProps {
  pharmacistName: string;
  pharmacyName: string;
  onBack: () => void;
}

function extractScanQuery(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || trimmed.includes('session=')) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://qcare.local/?${trimmed.replace(/^\?/, '')}`);
      const session = url.searchParams.get('session') || url.searchParams.get('token') || url.searchParams.get('patient');
      if (session) return session.trim().toUpperCase();
    } catch {
      const match = trimmed.match(/[?&]session=([^&]+)/i);
      if (match?.[1]) return decodeURIComponent(match[1]).trim().toUpperCase();
    }
  }
  return trimmed.toUpperCase();
}

function toApiPrescription(rx: Prescription): ApiPrescription {
  return {
    id: rx.id,
    patientId: rx.patientId,
    patientName: rx.patientName,
    patientUhid: rx.patientUhid,
    diagnosis: rx.diagnosis || '',
    clinicalNotes: rx.clinicalNotes || '',
    followUpDate: rx.followUpDate || '',
    status: rx.status,
    issuedAt: rx.issuedAt,
    validUntil: rx.validUntil || rx.issuedAt,
    dispensedAt: rx.dispensedAt,
    dispensedBy: rx.dispensedBy,
    dispensedPharmacy: rx.dispensedPharmacy,
    doctor: { name: rx.doctorName, speciality: 'OPD Consultant' },
    medications: rx.medications.map(m => ({
      id: m.id,
      drugName: m.drugName,
      genericName: m.genericName || '',
      dose: m.dose,
      frequency: m.frequency,
      duration: m.duration,
      route: m.route || 'Oral',
      instructions: m.instructions || '',
      quantity: m.quantity || '',
      dispensed: Boolean(m.dispensed),
      dispensedAt: m.dispensedAt
    }))
  };
}

function toApiPatientSummary(p: Patient): ApiPatientSummary {
  return {
    id: p.id,
    uhid: p.uhid,
    qrSessionId: p.qrSessionId,
    name: p.name,
    age: p.age,
    gender: p.gender,
    contact: p.contact,
    priority: p.priority,
    createdAt: p.registrationTime || new Date().toISOString()
  };
}

export const PharmacyPortal: React.FC<PharmacyPortalProps> = ({ pharmacistName, pharmacyName, onBack }) => {
  const {
    currentHospital,
    currentUser,
    patients: storePatients,
    prescriptions: storePrescriptions,
    dispenseRecords: storeDispenseRecords,
    dispenseMedications
  } = useHospitalStore();

  const effectivePharmacistName =
    currentUser?.role === 'pharmacist' && currentUser.name ? currentUser.name : pharmacistName;
  const effectivePharmacyName =
    currentUser?.role === 'pharmacist' && currentUser.identifier ? currentUser.identifier : pharmacyName;

  const [mode, setMode] = useState<'scan' | 'result'>('scan');
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataSource, setDataSource] = useState<'store' | 'backend'>('store');

  // Backend-mode state (when getAccessToken() is active)
  const [apiPatient, setApiPatient] = useState<ApiPatientSummary | null>(null);
  const [apiPrescriptions, setApiPrescriptions] = useState<ApiPrescription[]>([]);
  const [apiDispenses, setApiDispenses] = useState<ApiDispenseRecord[]>([]);

  // Store-mode active patient key (stays reactive as store mutates)
  const [storePatientId, setStorePatientId] = useState<string | null>(null);

  const [selectedRxId, setSelectedRxId] = useState<string | null>(null);
  const [selectedMedIds, setSelectedMedIds] = useState<Set<string>>(new Set());
  const [dispensing, setDispensing] = useState(false);
  const [dispensedSuccess, setDispensedSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scoped prescriptions & patients for the current hospital
  const hospitalScopedPatients = useMemo(
    () =>
      storePatients.filter(
        p =>
          (!p.hospitalId && !p.hospitalCode) ||
          p.hospitalId === currentHospital.id ||
          p.hospitalCode === currentHospital.code
      ),
    [storePatients, currentHospital.id, currentHospital.code]
  );

  const hospitalScopedPrescriptions = useMemo(
    () =>
      storePrescriptions.filter(
        rx =>
          (!rx.hospitalId && !rx.hospitalCode) ||
          rx.hospitalId === currentHospital.id ||
          rx.hospitalCode === currentHospital.code
      ),
    [storePrescriptions, currentHospital.id, currentHospital.code]
  );

  const hospitalScopedDispenses = useMemo(
    () =>
      storeDispenseRecords.filter(
        d =>
          (!d.hospitalId && !d.hospitalCode) ||
          d.hospitalId === currentHospital.id ||
          d.hospitalCode === currentHospital.code
      ),
    [storeDispenseRecords, currentHospital.id, currentHospital.code]
  );

  // Quick-select roster of patients with prescriptions
  const patientsWithRx = useMemo(() => {
    const byPatient = new Map<string, { patient: ApiPatientSummary; rxCount: number; latestRx: Prescription }>();
    for (const rx of hospitalScopedPrescriptions) {
      const matchedPat = hospitalScopedPatients.find(
        p => p.id === rx.patientId || p.uhid.toUpperCase() === rx.patientUhid.toUpperCase()
      );
      const summary: ApiPatientSummary = matchedPat
        ? toApiPatientSummary(matchedPat)
        : {
            id: rx.patientId,
            uhid: rx.patientUhid,
            qrSessionId: rx.patientUhid.replace('QC-2026-', 'QC-'),
            name: rx.patientName,
            age: 0,
            gender: 'Other',
            contact: '',
            priority: 'standard',
            createdAt: rx.issuedAt
          };
      const existing = byPatient.get(summary.id);
      if (existing) {
        existing.rxCount += 1;
      } else {
        byPatient.set(summary.id, { patient: summary, rxCount: 1, latestRx: rx });
      }
    }
    return Array.from(byPatient.values());
  }, [hospitalScopedPrescriptions, hospitalScopedPatients]);

  // Active patient + prescriptions derived reactively in store mode
  const activePatient: ApiPatientSummary | null = useMemo(() => {
    if (dataSource === 'backend') return apiPatient;
    if (!storePatientId) return null;
    const found = hospitalScopedPatients.find(p => p.id === storePatientId);
    if (found) return toApiPatientSummary(found);
    const rxFallback = hospitalScopedPrescriptions.find(rx => rx.patientId === storePatientId);
    if (!rxFallback) return null;
    return {
      id: rxFallback.patientId,
      uhid: rxFallback.patientUhid,
      qrSessionId: rxFallback.patientUhid.replace('QC-2026-', 'QC-'),
      name: rxFallback.patientName,
      age: 0,
      gender: 'Other',
      contact: '',
      priority: 'standard',
      createdAt: rxFallback.issuedAt
    };
  }, [dataSource, apiPatient, storePatientId, hospitalScopedPatients, hospitalScopedPrescriptions]);

  const activePrescriptions: ApiPrescription[] = useMemo(() => {
    if (dataSource === 'backend') return apiPrescriptions;
    if (!activePatient) return [];
    return hospitalScopedPrescriptions
      .filter(
        rx =>
          rx.patientId === activePatient.id ||
          rx.patientUhid.toUpperCase() === activePatient.uhid.toUpperCase()
      )
      .map(toApiPrescription);
  }, [dataSource, apiPrescriptions, activePatient, hospitalScopedPrescriptions]);

  const activePatientDispenses = useMemo(() => {
    if (dataSource === 'backend') {
      return apiDispenses.map(r => ({
        id: r.id,
        pharmacyName: r.pharmacyName,
        dispensedAt: r.dispensedAt,
        summary: r.prescription?.medications.filter(m => m.dispensed).map(m => m.drugName).join(', ') || r.notes || 'Dispensed'
      }));
    }
    if (!activePatient) return [];
    return hospitalScopedDispenses
      .filter(
        d =>
          d.patientId === activePatient.id ||
          d.patientUhid.toUpperCase() === activePatient.uhid.toUpperCase()
      )
      .map(d => ({
        id: d.id,
        pharmacyName: d.pharmacyName || effectivePharmacyName,
        dispensedAt: d.dispensedAt,
        summary: `${d.medicationsDispensed.join(', ')} (${d.pharmacistName})`
      }));
  }, [dataSource, apiDispenses, activePatient, hospitalScopedDispenses, effectivePharmacyName]);

  const selectedRx = activePrescriptions.find(p => p.id === selectedRxId) ?? activePrescriptions[0] ?? null;

  function openStorePatient(patientId: string, preferredRxId?: string) {
    const rxs = hospitalScopedPrescriptions.filter(rx => rx.patientId === patientId);
    setDataSource('store');
    setStorePatientId(patientId);
    setSelectedRxId(preferredRxId || rxs[0]?.id || null);
    setSelectedMedIds(new Set());
    setDispensedSuccess(false);
    setError('');
    setMode('result');
  }

  async function handleScan(overrideQuery?: string) {
    const query = extractScanQuery(overrideQuery ?? qrInput);
    if (!query) return;
    setLoading(true);
    setError('');

    const hasBackendJwt = Boolean(getAccessToken());
    if (hasBackendJwt) {
      try {
        const data = await pharmacyApi.scanQR(query);
        setDataSource('backend');
        setApiPatient(data.patient);
        setApiPrescriptions(data.prescriptions);
        setSelectedRxId(data.prescriptions[0]?.id ?? null);
        setSelectedMedIds(new Set());
        setDispensedSuccess(false);
        setMode('result');
        try {
          const hist = await pharmacyApi.history(data.patient.id);
          setApiDispenses(hist.records || []);
        } catch {
          setApiDispenses([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'QR scan failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Store-first local resolution (works for dynamic walk-ins & demo patients)
    const matchedPatient = hospitalScopedPatients.find(
      p =>
        p.qrSessionId.toUpperCase() === query ||
        p.uhid.toUpperCase() === query ||
        p.opdTokenNumber.toUpperCase() === query ||
        p.id.toUpperCase() === query
    );

    if (matchedPatient) {
      openStorePatient(matchedPatient.id);
      setLoading(false);
      return;
    }

    const matchedRx = hospitalScopedPrescriptions.find(
      rx => rx.id.toUpperCase() === query || rx.patientUhid.toUpperCase() === query
    );

    if (matchedRx) {
      openStorePatient(matchedRx.patientId, matchedRx.id);
      setLoading(false);
      return;
    }

    setError(`No patient or prescription found for "${query}". Verify QR session ID, UHID, or OPD token.`);
    setLoading(false);
  }

  function toggleMed(id: string, dispensed: boolean) {
    if (dispensed || dispensing) return;
    setSelectedMedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDispense() {
    if (!selectedRx || selectedMedIds.size === 0 || dispensing) return;
    const pendingSelectedIds = selectedRx.medications
      .filter(m => !m.dispensed && selectedMedIds.has(m.id))
      .map(m => m.id);
    if (pendingSelectedIds.length === 0) return;

    setDispensing(true);
    setError('');

    if (dataSource === 'backend') {
      try {
        await pharmacyApi.dispense({
          prescriptionId: selectedRx.id,
          pharmacyName: effectivePharmacyName,
          medicationIds: pendingSelectedIds,
          notes: '',
        });
        setDispensedSuccess(true);
        const refreshed = await pharmacyApi.scanQR(extractScanQuery(qrInput) || activePatient?.qrSessionId || '');
        setApiPrescriptions(refreshed.prescriptions);
        const updRx = refreshed.prescriptions.find(p => p.id === selectedRx.id);
        if (updRx) setSelectedRxId(updRx.id);
        if (activePatient) {
          try {
            const hist = await pharmacyApi.history(activePatient.id);
            setApiDispenses(hist.records || []);
          } catch {}
        }
        setSelectedMedIds(new Set());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Dispense failed');
      } finally {
        setDispensing(false);
      }
      return;
    }

    // Store mode dispense
    const record = dispenseMedications(
      selectedRx.id,
      pendingSelectedIds,
      effectivePharmacistName,
      effectivePharmacyName,
      ''
    );
    if (record) {
      setDispensedSuccess(true);
      setSelectedMedIds(new Set());
    } else {
      setError('Unable to dispense selected medications (already dispensed or prescription inactive).');
    }
    setDispensing(false);
  }

  function reset() {
    setMode('scan');
    setQrInput('');
    setApiPatient(null);
    setApiPrescriptions([]);
    setApiDispenses([]);
    setStorePatientId(null);
    setSelectedRxId(null);
    setSelectedMedIds(new Set());
    setDispensedSuccess(false);
    setError('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const rxStatusBadge = (s: string) => {
    if (s === 'active') return 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]';
    if (s === 'partially_dispensed') return 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]';
    if (s === 'fully_dispensed') return 'bg-[#E6F4F4] text-[#087C80] border-[#B2DCD3]';
    return 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]';
  };

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#F5F7FA] text-[#0F172A] font-sans pb-12">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-2 space-y-5">
        {/* Clinical Pharmacy Header Bar */}
        <div className="bg-white border border-[#E2E8F0] rounded-[10px] px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[40px] px-3 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors duration-150 cursor-pointer shrink-0"
            >
              <ArrowLeft size={15} className="text-[#64748B]" />
              <span>Back</span>
            </button>
            <div className="w-px h-6 bg-[#E2E8F0] shrink-0" aria-hidden="true" />
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-[8px] bg-[#102A43] text-white grid place-items-center shrink-0">
                <Pill size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#087C80] leading-tight">
                  Pharmacy Dispensary
                </p>
                <p className="text-sm font-semibold text-[#0F172A] truncate leading-tight">
                  {effectivePharmacyName}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B]">
            <User size={13} className="text-[#102A43]" />
            <span className="font-semibold text-[#0F172A]">{effectivePharmacistName}</span>
          </div>
        </div>

        {/* SCAN MODE */}
        {mode === 'scan' && (
          <div className="space-y-5">
            <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-6 sm:p-8 flex flex-col items-center gap-5 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-[10px] bg-[#E6F4F4] border border-[#087C80]/20 grid place-items-center">
                <ScanLine size={30} className="text-[#087C80]" />
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-[#102A43] leading-tight text-balance">
                  Scan or Lookup Patient Rx
                </h2>
                <p className="text-sm text-[#64748B] max-w-prose leading-relaxed">
                  Enter patient QR session ID, UHID, or OPD token to load active digital prescriptions.
                </p>
              </div>

              {error && (
                <div className="w-full flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] rounded-[8px] px-4 py-3 text-sm">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="w-full flex flex-col sm:flex-row gap-2">
                <input
                  ref={inputRef}
                  className="flex-1 h-11 px-3.5 rounded-[8px] bg-white border border-[#CBD5E1] focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/20 text-base md:text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none tabular-nums transition-colors duration-150"
                  placeholder="e.g. QC-9410 or QC-2026-9410"
                  value={qrInput}
                  onChange={e => setQrInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleScan()}
                  autoFocus
                />
                <button
                  type="button"
                  className="min-h-[44px] px-5 rounded-[8px] bg-[#087C80] hover:bg-[#066569] disabled:opacity-55 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed shrink-0"
                  onClick={() => handleScan()}
                  disabled={loading || !qrInput.trim()}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  <span>{loading ? 'Searching...' : 'Lookup Rx'}</span>
                </button>
              </div>

              <p className="text-xs text-[#64748B] text-center max-w-prose leading-relaxed">
                Patient shares QR code from their QCare health card or printed OPD slip.
              </p>
            </div>

            {/* Quick-select patients with active prescriptions (Store Mode) */}
            {!getAccessToken() && patientsWithRx.length > 0 && (
              <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                  <h3 className="text-sm font-bold text-[#102A43] text-balance leading-tight">
                    Patients with Active Prescriptions ({patientsWithRx.length})
                  </h3>
                  <span className="text-xs text-[#64748B]">{currentHospital.shortName}</span>
                </div>
                <div className="divide-y divide-[#E2E8F0]">
                  {patientsWithRx.map(({ patient: p, rxCount, latestRx }) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => openStorePatient(p.id, latestRx.id)}
                      className="w-full py-3 px-2 hover:bg-[#F8FAFC] flex items-center justify-between gap-3 text-left transition-colors duration-150 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-[#0F172A]">{p.name}</span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0] text-[#102A43] tabular-nums">
                            {p.qrSessionId} · {p.uhid}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase ${rxStatusBadge(latestRx.status)}`}>
                            {latestRx.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-0.5 tabular-nums">
                          {rxCount} Rx · {latestRx.medications.length} medication(s) · Dr. {latestRx.doctorName}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-[#64748B] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Pharmacy Dispense History */}
            {!getAccessToken() && hospitalScopedDispenses.length > 0 && (
              <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-5 space-y-3">
                <h3 className="text-sm font-bold text-[#102A43] border-b border-[#E2E8F0] pb-2.5 text-balance leading-tight">
                  Recent Dispense Log ({hospitalScopedDispenses.length})
                </h3>
                <div className="divide-y divide-[#E2E8F0]">
                  {hospitalScopedDispenses.slice(0, 6).map(rec => (
                    <div key={rec.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0F172A]">
                          {rec.patientName} <span className="text-[#64748B] tabular-nums">({rec.patientUhid})</span>
                        </p>
                        <p className="text-[#64748B] truncate">{rec.medicationsDispensed.join(', ')}</p>
                      </div>
                      <span className="text-[#64748B] tabular-nums shrink-0">
                        {new Date(rec.dispensedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESULT MODE */}
        {mode === 'result' && activePatient && (
          <div className="space-y-4">
            {/* Patient identity summary */}
            <div className="bg-white border border-[#E2E8F0] rounded-[10px] px-5 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-[8px] bg-[#102A43] text-white grid place-items-center shrink-0">
                  <User size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-lg text-[#0F172A] leading-tight truncate">{activePatient.name}</p>
                  <div className="flex items-center flex-wrap gap-2 text-xs text-[#64748B] mt-1">
                    <span className="tabular-nums bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded-[6px] text-[#102A43] font-semibold">
                      {activePatient.uhid}
                    </span>
                    <span className="tabular-nums">QR: {activePatient.qrSessionId}</span>
                    {activePatient.age > 0 && (
                      <span className="tabular-nums">{activePatient.age}y · {activePatient.gender}</span>
                    )}
                    {(activePatient as ApiPatientSummary & { allergies?: string }).allergies && (
                      <span className="text-xs text-[#B91C1C] font-semibold">
                        Allergies: {(activePatient as ApiPatientSummary & { allergies?: string }).allergies}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={reset}
                className="min-h-[40px] px-3.5 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors duration-150 cursor-pointer"
              >
                <X size={14} className="text-[#64748B]" />
                <span>New Scan</span>
              </button>
            </div>

            {dispensedSuccess && (
              <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-[10px] px-4 py-3 flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#047857] shrink-0" />
                <p className="text-sm font-semibold text-[#047857]">Medications dispensed successfully.</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] rounded-[8px] px-4 py-3 text-sm">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{error}</span>
                <button type="button" onClick={() => setError('')} className="ml-auto cursor-pointer" aria-label="Dismiss error">
                  <X size={14} />
                </button>
              </div>
            )}

            {activePrescriptions.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-[10px] px-6 py-12 text-center space-y-2">
                <FileText size={32} className="text-[#94A3B8] mx-auto" />
                <p className="font-semibold text-[#0F172A]">No active prescriptions found</p>
                <p className="text-sm text-[#64748B] max-w-prose mx-auto leading-relaxed">
                  No finalized prescriptions are pending dispensing for this patient yet.
                </p>
              </div>
            ) : (
              <>
                {activePrescriptions.length > 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {activePrescriptions.map(rx => (
                      <button
                        key={rx.id}
                        type="button"
                        onClick={() => { setSelectedRxId(rx.id); setSelectedMedIds(new Set()); }}
                        className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold border transition-colors duration-150 tabular-nums cursor-pointer ${
                          selectedRx?.id === rx.id
                            ? 'bg-[#102A43] text-white border-[#102A43]'
                            : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#087C80] hover:text-[#0F172A]'
                        }`}
                      >
                        {rx.id} · {new Date(rx.issuedAt).toLocaleDateString()}
                      </button>
                    ))}
                  </div>
                )}

                {selectedRx && (
                  <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-5 sm:p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="tabular-nums text-xs text-[#087C80] font-bold">{selectedRx.id}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border uppercase tracking-wide ${rxStatusBadge(selectedRx.status)}`}>
                            {selectedRx.status.replace('_', ' ')}
                          </span>
                        </div>
                        {selectedRx.diagnosis && (
                          <p className="text-sm font-semibold text-[#0F172A]">Dx: {selectedRx.diagnosis}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#64748B] tabular-nums">
                          <span className="flex items-center gap-1"><Stethoscope size={12} /> {selectedRx.doctor?.name}</span>
                          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(selectedRx.issuedAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> Valid till {new Date(selectedRx.validUntil).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {selectedRx.clinicalNotes && (
                        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[8px] px-3 py-2 max-w-xs">
                          <p className="text-xs font-bold text-[#B45309] mb-0.5">Doctor's Note</p>
                          <p className="text-xs text-[#78350F] max-w-prose leading-relaxed">{selectedRx.clinicalNotes}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] tabular-nums">
                          Medications ({selectedRx.medications.length})
                        </p>
                        {selectedRx.status !== 'fully_dispensed' && (
                          <button
                            type="button"
                            onClick={() => {
                              const undispensed = selectedRx.medications.filter(m => !m.dispensed).map(m => m.id);
                              setSelectedMedIds(new Set(undispensed));
                            }}
                            className="text-xs font-semibold text-[#087C80] hover:underline cursor-pointer"
                          >
                            Select all pending
                          </button>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        {(selectedRx.medications as ApiMedication[]).map(med => {
                          const isSelected = selectedMedIds.has(med.id);
                          return (
                            <div
                              key={med.id}
                              onClick={() => toggleMed(med.id, med.dispensed)}
                              className={`flex items-start gap-3 p-3.5 rounded-[8px] border transition-colors duration-150 ${
                                med.dispensed
                                  ? 'bg-[#ECFDF5]/60 border-[#A7F3D0] opacity-80'
                                  : isSelected
                                  ? 'bg-[#E6F4F4] border-[#087C80] cursor-pointer'
                                  : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#94A3B8] cursor-pointer'
                              }`}
                            >
                              <div className={`mt-0.5 w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 transition-colors duration-150 ${
                                med.dispensed
                                  ? 'bg-[#047857] border-[#047857]'
                                  : isSelected
                                  ? 'bg-[#087C80] border-[#087C80]'
                                  : 'border-[#CBD5E1] bg-white'
                              }`}>
                                {(med.dispensed || isSelected) && <Check size={12} className="text-white" />}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-sm text-[#0F172A]">{med.drugName}</p>
                                  {med.genericName && <span className="text-xs text-[#64748B]">({med.genericName})</span>}
                                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[6px] bg-white border border-[#E2E8F0] text-[#102A43] tabular-nums">
                                    {med.dose}
                                  </span>
                                  {med.dispensed && (
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] inline-flex items-center gap-1">
                                      <CheckCircle2 size={10} /> Dispensed
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-3 mt-1 text-xs text-[#64748B] tabular-nums">
                                  <span className="flex items-center gap-1"><Clock size={11} /> {med.frequency}</span>
                                  <span className="flex items-center gap-1"><Package size={11} /> {med.duration}</span>
                                  {med.quantity && <span>Qty: {med.quantity}</span>}
                                </div>
                                {med.instructions && (
                                  <p className="mt-1 text-xs text-[#087C80] font-medium max-w-prose leading-relaxed">{med.instructions}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {selectedRx.status !== 'fully_dispensed' && (
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
                        <p className="text-sm text-[#64748B] tabular-nums">
                          {selectedMedIds.size} of {selectedRx.medications.filter(m => !m.dispensed).length} pending selected
                        </p>
                        <button
                          type="button"
                          className="min-h-[44px] px-5 rounded-[8px] bg-[#087C80] hover:bg-[#066569] disabled:opacity-55 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
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
                      <div className="flex items-center gap-2 bg-[#ECFDF5] border border-[#A7F3D0] rounded-[8px] px-4 py-3">
                        <CheckCircle2 size={16} className="text-[#047857]" />
                        <p className="text-sm font-semibold text-[#047857]">All medications fully dispensed.</p>
                      </div>
                    )}
                  </div>
                )}

                {activePatientDispenses.length > 0 && (
                  <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-5 space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      Dispense History ({activePatientDispenses.length})
                    </h3>
                    <div className="divide-y divide-[#E2E8F0]">
                      {activePatientDispenses.map(rec => (
                        <div key={rec.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                          <span className="font-medium text-[#0F172A]">{rec.summary}</span>
                          <span className="text-[#64748B] tabular-nums shrink-0">
                            {rec.pharmacyName} · {new Date(rec.dispensedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
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
