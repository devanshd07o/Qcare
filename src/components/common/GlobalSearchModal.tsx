import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { HISTORICAL_PATIENT_RECORDS, HistoricalPatientRecord } from '../../data/historicalPatientsData';
import {
  Search,
  X,
  Sparkles,
  ArrowRight,
  User,
  Calendar,
  CheckCircle2,
  FileText,
  Activity,
  Phone,
  Stethoscope,
  ChevronRight
} from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchModalOpen,
    closeSearchModal,
    setPrefilledWalkinData,
    generateAiDemoPatient,
    showToast
  } = useHospitalStore();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isSearchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchModalOpen]);

  // Keyboard shortcut listener (ESC to close, Ctrl+K / Cmd+K handled globally)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchModalOpen) {
        closeSearchModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, closeSearchModal]);

  // Filter 56 historical patient records
  const filteredRecords = useMemo(() => {
    return HISTORICAL_PATIENT_RECORDS.filter(p => {
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'cardio' && !p.completedTests.includes('test-ecg')) return false;
        if (selectedCategory === 'diabetes' && !p.completedTests.includes('test-fbs')) return false;
        if (selectedCategory === 'radiology' && !p.completedTests.includes('test-xray-chest')) return false;
        if (selectedCategory === 'blood' && !p.completedTests.includes('test-cbc')) return false;
      }
      if (!query.trim()) return true;
      const q = query.toLowerCase().trim();
      const digits = q.replace(/\D/g, '');
      return (
        p.name.toLowerCase().includes(q) ||
        p.uhid.toLowerCase().includes(q) ||
        p.chiefComplaint.toLowerCase().includes(q) ||
        p.diagnosisNotes.toLowerCase().includes(q) ||
        (digits.length >= 3 && p.contact.replace(/\D/g, '').includes(digits))
      );
    });
  }, [query, selectedCategory]);

  const handleFillPatient = (p: HistoricalPatientRecord) => {
    setPrefilledWalkinData({
      name: p.name,
      age: String(p.age),
      gender: p.gender,
      contact: p.contact.replace(/\D/g, '').slice(-10),
      chiefComplaint: p.chiefComplaint,
      testIds: p.completedTests
    });
    showToast(`Autofilled walk-in form: ${p.name} (${p.uhid})`);
    closeSearchModal();
  };

  const handleGenerateAiDemo = () => {
    generateAiDemoPatient();
  };

  if (!isSearchModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-3xl bg-white/95 backdrop-blur-2xl rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Clinical Patient Lookup & Archive
                </h3>
                <p className="text-[11px] text-slate-500">
                  Search 56 archived OPD visits or generate realistic AI patient data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* AI Demo Random Patient Generator Button */}
              <button
                type="button"
                onClick={handleGenerateAiDemo}
                data-tooltip="Generate authentic random Indian patient with clinical symptoms & tests"
                className="h-8.5 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-full shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Demo Patient</span>
              </button>

              <button
                type="button"
                onClick={closeSearchModal}
                data-tooltip="Close search palette (Esc)"
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Input Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by patient name, UHID, phone number, symptoms, or diagnosis..."
              className="w-full h-11 pl-10 pr-9 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {[
              { id: 'all', label: 'All records (56)' },
              { id: 'diabetes', label: 'Diabetes & Metabolism' },
              { id: 'cardio', label: 'Cardiology' },
              { id: 'radiology', label: 'Chest & X-Ray' },
              { id: 'blood', label: 'Hematology / CBC' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-[background-color,border-color,color] duration-150 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white border border-slate-950 qcare-pill-3d-solid'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 qcare-pill-3d'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Patient List (Normal comfortable height) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-slate-100 space-y-2">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium text-slate-600">
                No archived patient records match "{query}"
              </p>
              <button
                type="button"
                onClick={handleGenerateAiDemo}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Click here to generate a fresh AI demo patient
              </button>
            </div>
          ) : (
            filteredRecords.map(item => (
              <div
                key={item.id}
                className="pt-3 pb-3 first:pt-0 last:pb-0 hover:bg-slate-50/80 p-3 rounded-2xl transition-all border border-transparent hover:border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Patient Information */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      {item.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200 qcare-pill-3d">
                      {item.uhid}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {item.age}Y · {item.gender}
                    </span>
                    <span className="text-[11px] text-slate-400">·</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {item.contact}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-snug line-clamp-1">
                    <strong className="text-slate-700 font-medium">Complaint:</strong> {item.chiefComplaint}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Visited {item.visitDate}</span>
                    </span>
                    <span>·</span>
                    <span className="text-slate-600 font-medium">
                      Tests: {item.testNames.join(', ')}
                    </span>
                  </div>
                </div>

                {/* Direct Fill Action Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleFillPatient(item)}
                    data-tooltip={`Autofill ${item.name} into walk-in registration form`}
                    className="h-8.5 px-3.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 shadow-2xs group-hover:bg-blue-600 group-hover:text-white cursor-pointer"
                  >
                    <span>Fill in form</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="px-5 py-3 border-t border-slate-200/80 bg-slate-50/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Showing {filteredRecords.length} of 56 historical records</span>
          <span className="hidden sm:inline">Press Esc or click outside to dismiss</span>
        </div>
      </div>
    </div>
  );
};
