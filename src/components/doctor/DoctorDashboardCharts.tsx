import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Patient } from '../../types';
import { NumberTicker } from '../ui/number-ticker';

export interface PatientOverviewSlice {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface OpdMixDonutChartProps {
  patients: Patient[];
}

export const OpdMixDonutChart: React.FC<OpdMixDonutChartProps> = ({
  patients
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const slices: PatientOverviewSlice[] = useMemo(() => {
    const waiting = patients.filter(
      p => p.doctorReviewStatus === 'awaiting_prescription'
    ).length;
    const inTests = patients.filter(
      p => p.doctorReviewStatus === 'awaiting_lab_reports'
    ).length;
    const ready = patients.filter(
      p => p.doctorReviewStatus === 'reports_ready'
    ).length;
    const done = patients.filter(
      p => p.doctorReviewStatus === 'completed'
    ).length;

    return [
      { id: 'wait', label: 'Waiting', value: waiting, color: 'var(--seg-3)' },
      { id: 'tests', label: 'In Tests', value: inTests, color: 'var(--seg-2)' },
      { id: 'ready', label: 'Ready', value: ready, color: 'var(--status-success)' },
      { id: 'done', label: 'Done', value: done, color: 'var(--border-input)' }
    ];
  }, [patients]);

  const activeSlices = slices.filter(s => s.value > 0);
  const totalPatients = patients.length;

  const SIZE = 116;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 42;
  const STROKE = 12;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const GAP_LEN = activeSlices.length > 1 ? 3 : 0;

  let cumulativeLen = 0;
  const arcs = activeSlices.map(slice => {
    const fraction = totalPatients > 0 ? slice.value / totalPatients : 0;
    const rawLen = fraction * CIRCUMFERENCE;
    const dashLen = Math.max(0, rawLen - GAP_LEN);
    const offset = -cumulativeLen;
    cumulativeLen += rawLen;
    return {
      ...slice,
      pct: totalPatients > 0 ? Math.round(fraction * 100) : 0,
      dashLen,
      offset
    };
  });

  const focusedSlice = arcs.find(a => a.id === hoveredId) || null;

  return (
    <div className="h-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col">
      <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[var(--text-primary)] leading-[1.25] tracking-tight">
          Overview
        </h2>
        <span className="font-mono text-xs text-[var(--text-tertiary)] tabular-nums">
          {totalPatients}
        </span>
      </div>

      <div className="flex-1 p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label={`Patient status overview across ${totalPatients} patients`}
          >
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="var(--bg-surface-subtle)"
              strokeWidth={STROKE}
            />
            <g transform={`rotate(-90 ${CX} ${CY})`}>
              {arcs.map((arc, idx) => {
                const isHovered = hoveredId === arc.id;
                const dimmed = hoveredId !== null && !isHovered;
                return (
                  <motion.circle
                    key={arc.id}
                    cx={CX}
                    cy={CY}
                    r={R}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth={isHovered ? STROKE + 2.5 : STROKE}
                    strokeLinecap="butt"
                    strokeDasharray={`${arc.dashLen} ${CIRCUMFERENCE}`}
                    strokeDashoffset={arc.offset}
                    initial={{ opacity: 0, strokeDasharray: `0 ${CIRCUMFERENCE}` }}
                    animate={{
                      opacity: dimmed ? 0.35 : 1,
                      strokeDasharray: `${arc.dashLen} ${CIRCUMFERENCE}`
                    }}
                    transition={{
                      duration: 0.4,
                      delay: idx * 0.05,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    className="cursor-pointer transition-[opacity,stroke-width] duration-150"
                    onMouseEnter={() => setHoveredId(arc.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                );
              })}
            </g>
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-3">
            <span className="font-mono text-lg font-bold text-[var(--text-primary)] tabular-nums leading-none">
              {focusedSlice ? focusedSlice.value : <NumberTicker value={totalPatients} />}
            </span>
            {focusedSlice && (
              <span className="mt-1 font-mono text-[10px] font-semibold text-[var(--text-secondary)]">
                {focusedSlice.pct}%
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 w-full min-w-0 space-y-1">
          {slices.map(slice => {
            const isHovered = hoveredId === slice.id;
            const hasValue = slice.value > 0;
            return (
              <div
                key={slice.id}
                onMouseEnter={() => hasValue && setHoveredId(slice.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg text-xs transition-colors duration-150 cursor-default ${
                  isHovered ? 'bg-[var(--bg-surface-subtle)]' : ''
                } ${!hasValue ? 'opacity-55' : ''}`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-[var(--text-primary)] font-medium truncate">
                    {slice.label}
                  </span>
                </span>
                <span className="font-mono text-xs font-semibold text-[var(--text-primary)] tabular-nums shrink-0">
                  {slice.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
