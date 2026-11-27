import React, { useMemo } from 'react';
import { DiagnosticTest, Patient } from '../../types';

const CLINICAL_TEST_DISPLAY_NAMES: Record<string, string> = {
  'test-cbc': 'Complete Blood Count (CBC)',
  'test-fbs': 'Fasting Blood Sugar',
  'test-ecg': '12-Lead ECG',
  'test-xray-chest': 'Chest X-Ray',
  'test-usg-abdomen': 'Abdominal Ultrasound',
  'test-lipid': 'Lipid Profile',
  'test-ppbs': 'Blood Sugar (PPBS)',
  'test-urine': 'Urine Routine'
};

const CLINICAL_SHORT_LABELS: Record<string, string> = {
  'test-cbc': 'CBC',
  'test-fbs': 'Fasting Sugar',
  'test-ecg': 'ECG',
  'test-xray-chest': 'Chest X-Ray',
  'test-usg-abdomen': 'USG Abdomen',
  'test-lipid': 'Lipid Profile',
  'test-ppbs': 'PPBS',
  'test-urine': 'Urine Routine'
};

export function getReadableTestName(testId: string, fallbackName?: string): string {
  return CLINICAL_TEST_DISPLAY_NAMES[testId] || fallbackName || testId.replace(/^test-/, '').toUpperCase();
}

export function getShortTestCodeLabel(testId: string, fallbackName?: string): string {
  return CLINICAL_SHORT_LABELS[testId] || fallbackName || testId.replace(/^test-/, '').toUpperCase();
}

function getDiagnosticGroupLabel(testId: string, fallbackName?: string): string {
  const idLower = testId.toLowerCase();
  const nameLower = (fallbackName || '').toLowerCase();
  if (/cbc|fbs|ppbs|lipid|urine|blood|sugar|biochem|path/.test(idLower) || /blood|sugar|lipid|urine/.test(nameLower)) {
    return 'Blood test';
  }
  if (/ecg|echo|rhythm|cardio/.test(idLower) || /ecg|electrocardiogram/.test(nameLower)) {
    return 'ECG';
  }
  if (/xray|x-ray/.test(idLower) || /x-ray|xray/.test(nameLower)) {
    return 'X-Ray';
  }
  if (/usg|ultrasound|doppler/.test(idLower) || /ultrasound/.test(nameLower)) {
    return 'Ultrasound';
  }
  return getShortTestCodeLabel(testId, fallbackName);
}

interface DiagnosticActivityCardProps {
  patients: Patient[];
  tests: DiagnosticTest[];
}

export const DiagnosticActivityCard: React.FC<DiagnosticActivityCardProps> = ({
  patients,
  tests
}) => {
  const rows = useMemo(() => {
    const groupMap = new Map<string, { label: string; ordered: number; completed: number }>();

    for (const pat of patients) {
      const doneSet = new Set(pat.completedTests || []);
      for (const tid of pat.prescribedTests || []) {
        const test = tests.find(t => t.id === tid);
        const label = getDiagnosticGroupLabel(tid, test?.name);
        const prev = groupMap.get(label) || { label, ordered: 0, completed: 0 };
        prev.ordered += 1;
        if (doneSet.has(tid)) {
          prev.completed += 1;
        }
        groupMap.set(label, prev);
      }
    }

    return Array.from(groupMap.values()).sort((a, b) => b.ordered - a.ordered);
  }, [patients, tests]);

  const maxOrdered = Math.max(1, ...rows.map(r => r.ordered));

  return (
    <div className="h-full rounded-[10px] border border-[#E2E8F0] bg-white overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-2">
        <h2 className="text-[16px] font-semibold text-[#0F172A] leading-[1.3] tracking-[-0.01em]">
          Diagnostic activity
        </h2>
        <span className="text-[12px] font-medium text-[#64748B] shrink-0">
          Today
        </span>
      </div>

      <div className="flex-1 max-h-[296px] overflow-y-auto overscroll-contain p-5">
        {rows.length === 0 ? (
          <div className="h-full flex items-center justify-center py-10 text-center">
            <p className="text-[13px] font-normal text-[#64748B]">
              No tests scheduled today
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map(row => {
              const groupScalePct = Math.max(18, Math.round((row.ordered / maxOrdered) * 100));
              const completedInsidePct = row.ordered > 0
                ? Math.round((row.completed / row.ordered) * 100)
                : 0;

              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-[#0F172A] truncate">
                      {row.label}
                    </span>
                    <span className="text-[12px] font-medium text-[#64748B] tabular-nums shrink-0">
                      {row.completed}/{row.ordered}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden"
                    style={{ width: `${groupScalePct}%` }}
                  >
                    <div
                      className="h-full rounded-full bg-[#087C80] transition-[width] duration-300 ease-out"
                      style={{ width: `${completedInsidePct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
