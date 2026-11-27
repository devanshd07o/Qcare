import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, Pill, Plus, Search, Trash2, X } from 'lucide-react';
import {
  COMMON_DURATIONS,
  COMMON_FREQUENCIES,
  COMMON_ROUTES,
  MEDICINE_CATALOG
} from '../../data/medicineCatalog';
import type { MedicationItem, MedicineCatalogItem } from '../../types';
import { Input } from '../ui/input';

interface PrescriptionComposerProps {
  medications: MedicationItem[];
  onChange: (medications: MedicationItem[]) => void;
  disabled?: boolean;
}

interface DraftMedication {
  drugName: string;
  genericName: string;
  dose: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
}

const EMPTY_DRAFT: DraftMedication = {
  drugName: '',
  genericName: '',
  dose: '',
  frequency: COMMON_FREQUENCIES[1],
  duration: COMMON_DURATIONS[1],
  route: COMMON_ROUTES[0],
  instructions: ''
};

export const PrescriptionComposer: React.FC<PrescriptionComposerProps> = ({
  medications,
  onChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(medications.length > 0);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<MedicineCatalogItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftMedication>(EMPTY_DRAFT);
  const [draftError, setDraftError] = useState('');
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSuggestions) return;
    const handleOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showSuggestions]);

  const filteredCatalog = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return MEDICINE_CATALOG.slice(0, 8);
    return MEDICINE_CATALOG.filter(
      item =>
        item.brandName.toLowerCase().includes(q) ||
        item.genericName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [catalogQuery]);

  const handleSelectCatalog = (item: MedicineCatalogItem) => {
    setSelectedCatalogItem(item);
    setCatalogQuery(`${item.genericName} (${item.brandName})`);
    setDraft(prev => ({
      ...prev,
      drugName: item.brandName,
      genericName: item.genericName,
      dose: item.commonDosages[0] || '',
      frequency: item.commonFrequencies[0] || COMMON_FREQUENCIES[0],
      duration: item.commonDurations[0] || COMMON_DURATIONS[1],
      route: item.commonRoutes[0] || COMMON_ROUTES[0]
    }));
    setShowSuggestions(false);
    setDraftError('');
  };

  const resetDraft = () => {
    setDraft(EMPTY_DRAFT);
    setCatalogQuery('');
    setSelectedCatalogItem(null);
    setEditingId(null);
    setDraftError('');
    setShowSuggestions(false);
  };

  const handleSaveMedication = () => {
    const cleanDrug = draft.drugName.trim() || catalogQuery.trim();
    const cleanDose = draft.dose.trim();
    if (!cleanDrug) {
      setDraftError('Select or enter a medication name.');
      return;
    }
    if (!cleanDose) {
      setDraftError('Enter strength / dosage (e.g. 500mg).');
      return;
    }

    const item: MedicationItem = {
      id: editingId || `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      drugName: cleanDrug,
      genericName: draft.genericName.trim() || undefined,
      dose: cleanDose,
      frequency: draft.frequency || COMMON_FREQUENCIES[0],
      duration: draft.duration || COMMON_DURATIONS[1],
      route: draft.route || COMMON_ROUTES[0],
      instructions: draft.instructions.trim() || undefined,
      dispensed: false
    };

    if (editingId) {
      onChange(medications.map(m => (m.id === editingId ? item : m)));
    } else {
      onChange([...medications, item]);
    }

    resetDraft();
  };

  const handleEditMedication = (item: MedicationItem) => {
    const catalogMatch =
      MEDICINE_CATALOG.find(
        c =>
          c.brandName.toLowerCase() === item.drugName.toLowerCase() ||
          c.genericName.toLowerCase() === (item.genericName || '').toLowerCase()
      ) || null;
    setSelectedCatalogItem(catalogMatch);
    setEditingId(item.id);
    setCatalogQuery(item.genericName ? `${item.genericName} (${item.drugName})` : item.drugName);
    setDraft({
      drugName: item.drugName,
      genericName: item.genericName || '',
      dose: item.dose,
      frequency: item.frequency,
      duration: item.duration,
      route: item.route,
      instructions: item.instructions || ''
    });
    setDraftError('');
    setIsOpen(true);
    setShowSuggestions(false);
  };

  const handleRemoveMedication = (id: string) => {
    const next = medications.filter(m => m.id !== id);
    onChange(next);
    if (editingId === id) resetDraft();
  };

  const dosageOptions = selectedCatalogItem?.commonDosages || [];
  const frequencyOptions = Array.from(
    new Set([...(selectedCatalogItem?.commonFrequencies || []), ...COMMON_FREQUENCIES])
  );
  const durationOptions = Array.from(
    new Set([...(selectedCatalogItem?.commonDurations || []), ...COMMON_DURATIONS])
  );
  const routeOptions = Array.from(
    new Set([...(selectedCatalogItem?.commonRoutes || []), ...COMMON_ROUTES])
  );

  if (!isOpen && medications.length === 0) {
    return (
      <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
        <span className="text-[12.5px] text-[#64748B]">
          Optional medication prescription
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(true)}
          className="h-9 px-3.5 rounded-[8px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] hover:border-[#087C80] text-[12.5px] font-medium text-[#087C80] inline-flex items-center gap-1.5 transition-colors duration-150 cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Add Medication</span>
        </button>
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-[#E2E8F0] space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Pill className="w-4 h-4 text-[#087C80] shrink-0" strokeWidth={1.75} />
          <span className="text-[13.5px] font-semibold text-[#0F172A]">
            Prescription medications
          </span>
          {medications.length > 0 && (
            <span className="text-[12px] font-medium text-[#64748B] tabular-nums">
              ({medications.length})
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (medications.length === 0) {
              resetDraft();
              setIsOpen(false);
            } else {
              resetDraft();
            }
          }}
          className="text-[12px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors duration-150 cursor-pointer"
        >
          {medications.length === 0 ? 'Collapse' : editingId ? 'Cancel edit' : 'Clear draft'}
        </button>
      </div>

      {/* Committed Medications List (Flush rows, zero nested rounded cards) */}
      {medications.length > 0 && (
        <div className="border border-[#E2E8F0] rounded-[8px] divide-y divide-[#E2E8F0] bg-white overflow-hidden">
          {medications.map((med, idx) => (
            <div
              key={med.id}
              className="px-3.5 py-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 text-[12.5px]"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[11.5px] font-medium text-[#64748B] tabular-nums">
                    {idx + 1}.
                  </span>
                  <span className="font-semibold text-[#0F172A]">
                    {med.drugName}
                  </span>
                  {med.genericName && (
                    <span className="text-[12px] text-[#64748B]">
                      ({med.genericName})
                    </span>
                  )}
                  <span className="font-semibold text-[#087C80] tabular-nums">
                    {med.dose}
                  </span>
                </div>
                <div className="text-[12px] text-[#475569] tabular-nums">
                  {med.frequency} · {med.duration} · {med.route}
                  {med.instructions ? ` · ${med.instructions}` : ''}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleEditMedication(med)}
                  aria-label={`Edit ${med.drugName}`}
                  className="w-8 h-8 rounded-[6px] flex items-center justify-center text-[#64748B] hover:text-[#087C80] hover:bg-[#F8FAFC] transition-colors duration-150 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleRemoveMedication(med.id)}
                  aria-label={`Remove ${med.drugName}`}
                  className="w-8 h-8 rounded-[6px] flex items-center justify-center text-[#64748B] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors duration-150 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Searchable Catalog + Dosage / Frequency / Duration / Route Builder */}
      <div className="border border-[#E2E8F0] rounded-[8px] bg-[#F8FAFC] p-3.5 space-y-3">
        <div ref={searchBoxRef} className="relative">
          <Search
            className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            strokeWidth={1.75}
          />
          <Input
            type="text"
            disabled={disabled}
            value={catalogQuery}
            onFocus={() => setShowSuggestions(true)}
            onChange={e => {
              const val = e.target.value;
              setCatalogQuery(val);
              setDraft(prev => ({ ...prev, drugName: val, genericName: '' }));
              setSelectedCatalogItem(null);
              setShowSuggestions(true);
              setDraftError('');
            }}
            placeholder="Search medicine catalog or enter drug name..."
            aria-label="Search medicine catalog"
            className="pl-9 pr-9"
          />
          {catalogQuery && (
            <button
              type="button"
              onClick={resetDraft}
              aria-label="Clear medicine search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[6px] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          )}

          {showSuggestions && filteredCatalog.length > 0 && (
            <div className="absolute z-30 left-0 right-0 mt-1 rounded-[8px] border border-[#E2E8F0] bg-white shadow-[0_10px_24px_-6px_rgba(15,23,42,0.12)] max-h-52 overflow-y-auto divide-y divide-[#E2E8F0]">
              {filteredCatalog.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectCatalog(item)}
                  className="w-full text-left px-3 py-2 hover:bg-[#F8FAFC] transition-colors duration-150 flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#0F172A] truncate">
                      {item.genericName}{' '}
                      <span className="font-normal text-[#64748B]">({item.brandName})</span>
                    </div>
                    <div className="text-[11.5px] text-[#64748B] tabular-nums truncate">
                      {item.category} · {item.commonDosages.join(', ')}
                    </div>
                  </div>
                  <span className="text-[12px] font-medium text-[#087C80] shrink-0">
                    Select
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Dose / Strength */}
          <div className="space-y-1">
            <label className="block text-[11.5px] font-medium text-[#475569] leading-[1.3]">
              Dose / strength
            </label>
            {dosageOptions.length > 0 ? (
              <select
                aria-label="Medication dosage"
                disabled={disabled}
                value={dosageOptions.includes(draft.dose) ? draft.dose : '__custom__'}
                onChange={e => {
                  const v = e.target.value;
                  if (v === '__custom__') {
                    setSelectedCatalogItem(null);
                  } else {
                    setDraft(prev => ({ ...prev, dose: v }));
                  }
                }}
                className="h-10 w-full rounded-[8px] border border-[#CBD5E1] bg-white px-2.5 text-base sm:text-[13px] leading-[1.5] text-[#0F172A] tabular-nums outline-none focus:border-[#087C80]"
              >
                {dosageOptions.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value="__custom__">Custom dose...</option>
              </select>
            ) : (
              <Input
                type="text"
                aria-label="Medication dosage"
                disabled={disabled}
                value={draft.dose}
                onChange={e => setDraft(prev => ({ ...prev, dose: e.target.value }))}
                placeholder="e.g. 500mg"
                className="tabular-nums"
              />
            )}
          </div>

          {/* Frequency */}
          <div className="space-y-1">
            <label className="block text-[11.5px] font-medium text-[#475569] leading-[1.3]">
              Frequency
            </label>
            <select
              aria-label="Medication frequency"
              disabled={disabled}
              value={draft.frequency}
              onChange={e => setDraft(prev => ({ ...prev, frequency: e.target.value }))}
              className="h-10 w-full rounded-[8px] border border-[#CBD5E1] bg-white px-2.5 text-base sm:text-[13px] leading-[1.5] text-[#0F172A] outline-none focus:border-[#087C80]"
            >
              {frequencyOptions.map(freq => (
                <option key={freq} value={freq}>
                  {freq}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <label className="block text-[11.5px] font-medium text-[#475569] leading-[1.3]">
              Duration
            </label>
            <select
              aria-label="Medication duration"
              disabled={disabled}
              value={draft.duration}
              onChange={e => setDraft(prev => ({ ...prev, duration: e.target.value }))}
              className="h-10 w-full rounded-[8px] border border-[#CBD5E1] bg-white px-2.5 text-base sm:text-[13px] leading-[1.5] text-[#0F172A] tabular-nums outline-none focus:border-[#087C80]"
            >
              {durationOptions.map(dur => (
                <option key={dur} value={dur}>
                  {dur}
                </option>
              ))}
            </select>
          </div>

          {/* Route */}
          <div className="space-y-1">
            <label className="block text-[11.5px] font-medium text-[#475569] leading-[1.3]">
              Route
            </label>
            <select
              aria-label="Medication route"
              disabled={disabled}
              value={draft.route}
              onChange={e => setDraft(prev => ({ ...prev, route: e.target.value }))}
              className="h-10 w-full rounded-[8px] border border-[#CBD5E1] bg-white px-2.5 text-base sm:text-[13px] leading-[1.5] text-[#0F172A] outline-none focus:border-[#087C80]"
            >
              {routeOptions.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <Input
            type="text"
            aria-label="Medication instructions"
            disabled={disabled}
            value={draft.instructions}
            onChange={e => setDraft(prev => ({ ...prev, instructions: e.target.value }))}
            placeholder="Optional instructions (e.g. after meals)"
            className="flex-1"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={handleSaveMedication}
            className="h-10 px-4 rounded-[8px] border border-[#087C80] bg-white hover:bg-[#087C80] text-[#087C80] hover:text-white text-[13px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors duration-150 cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            <span>{editingId ? 'Update Medicine' : 'Add to Rx'}</span>
          </button>
        </div>

        {draftError && (
          <p className="text-[12px] font-medium text-[#B91C1C]" role="alert">
            {draftError}
          </p>
        )}
      </div>
    </div>
  );
};
