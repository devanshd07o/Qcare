import React from 'react';
import { motion } from 'motion/react';
import { MetricFlag } from '../../types';

interface MetricStatusIndicatorProps {
  flag: MetricFlag;
}

const FLAG_STYLES: Record<MetricFlag, { dot: string; text: string; label: string }> = {
  normal: {
    dot: 'bg-[#047857]',
    text: 'text-[#047857] font-medium',
    label: 'Normal'
  },
  low: {
    dot: 'bg-[#D97706]',
    text: 'text-[#B45309] font-semibold',
    label: '↓ Low'
  },
  high: {
    dot: 'bg-[#D97706]',
    text: 'text-[#B45309] font-semibold',
    label: '↑ High'
  },
  critical: {
    dot: 'bg-[#DC2626]',
    text: 'text-[#B91C1C] font-semibold',
    label: 'Critical'
  }
};

export const MetricStatusIndicator: React.FC<MetricStatusIndicatorProps> = ({ flag }) => {
  const style = FLAG_STYLES[flag] || FLAG_STYLES.normal;

  return (
    <span className={`inline-flex items-center gap-1.5 text-[12.5px] whitespace-nowrap ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden="true" />
      <span>{style.label}</span>
    </span>
  );
};

interface LabRangeMeterProps {
  value: string;
  normalRange: string;
  flag: MetricFlag;
  className?: string;
}

interface ParsedRangeGeometry {
  zoneLeftPct: number;
  zoneWidthPct: number;
  markerPct: number;
}

function parseRangeGeometry(valueStr: string, normalRangeStr: string): ParsedRangeGeometry | null {
  const valMatch = String(valueStr || '').replace(/,/g, '').match(/[-+]?\d*\.?\d+/);
  if (!valMatch) return null;
  const numericVal = parseFloat(valMatch[0]);
  if (!Number.isFinite(numericVal)) return null;

  const cleanRange = (normalRangeStr || '').replace(/,/g, '').trim();

  // Case 1: "min - max" or "min – max"
  const betweenMatch = cleanRange.match(/([-+]?\d*\.?\d+)\s*(?:-|–|—|\bto\b)\s*([-+]?\d*\.?\d+)/i);
  if (betweenMatch) {
    const low = parseFloat(betweenMatch[1]);
    const high = parseFloat(betweenMatch[2]);
    if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) return null;
    const span = high - low;
    const domainMin = low - span * 0.35;
    const domainMax = high + span * 0.35;
    const totalDomain = domainMax - domainMin;
    const zoneLeftPct = ((low - domainMin) / totalDomain) * 100;
    const zoneWidthPct = (span / totalDomain) * 100;
    const rawMarkerPct = ((numericVal - domainMin) / totalDomain) * 100;
    return {
      zoneLeftPct,
      zoneWidthPct,
      markerPct: Math.min(96, Math.max(4, rawMarkerPct))
    };
  }

  // Case 2: "< upper" or "<= upper"
  const upperOnlyMatch = cleanRange.match(/^<=?\s*([-+]?\d*\.?\d+)/);
  if (upperOnlyMatch) {
    const high = parseFloat(upperOnlyMatch[1]);
    if (!Number.isFinite(high) || high <= 0) return null;
    const domainMax = high * 1.4;
    const rawMarkerPct = (numericVal / domainMax) * 100;
    return {
      zoneLeftPct: 0,
      zoneWidthPct: (high / domainMax) * 100,
      markerPct: Math.min(96, Math.max(4, rawMarkerPct))
    };
  }

  return null;
}

export const LabRangeMeter: React.FC<LabRangeMeterProps> = ({
  value,
  normalRange,
  flag,
  className = ''
}) => {
  const geom = parseRangeGeometry(value, normalRange);
  if (!geom) return null;

  const markerColor =
    flag === 'critical'
      ? 'bg-[#DC2626]'
      : flag === 'low' || flag === 'high'
        ? 'bg-[#D97706]'
        : 'bg-[#047857]';

  return (
    <div
      aria-hidden="true"
      className={`relative mt-1.5 h-1.5 w-full max-w-[132px] rounded-full bg-[#E2E8F0] ${className}`}
    >
      <div
        className="absolute inset-y-0 rounded-full bg-[#10B981]/25"
        style={{
          left: `${geom.zoneLeftPct}%`,
          width: `${geom.zoneWidthPct}%`
        }}
      />
      <motion.span
        initial={{ left: '50%', scale: 0.5, opacity: 0 }}
        animate={{ left: `${geom.markerPct}%`, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-[0_1px_2px_rgba(15,23,42,0.22)] ${markerColor}`}
      />
    </div>
  );
};
