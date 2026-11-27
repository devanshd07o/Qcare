/* Source: D:\LetsCode\UI_COMPONENTS\originui (comp-272, comp-276) & uiverse-galaxy\Cards\andrew-demchenk0_bad-squid-34.html (MIT) — adapted to Q-Care tokens */
import * as React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../utils/cn';

export type CalloutTone = 'warning' | 'danger' | 'success' | 'neutral';

const TONE_CLASSES: Record<CalloutTone, string> = {
  warning: 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]',
  danger: 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]',
  success: 'border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]',
  neutral: 'border-[#E2E8F0] bg-[#F8FAFC] text-[#334155]'
};

const ICON_CLASSES: Record<CalloutTone, string> = {
  warning: 'text-[#B45309]',
  danger: 'text-[#B91C1C]',
  success: 'text-[#047857]',
  neutral: 'text-[#087C80]'
};

interface ClinicalCalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: CalloutTone;
  title?: string;
}

export const ClinicalCallout: React.FC<ClinicalCalloutProps> = ({
  tone = 'neutral',
  title,
  className,
  children,
  ...props
}) => {
  const Icon =
    tone === 'warning' || tone === 'danger'
      ? AlertTriangle
      : tone === 'success'
        ? CheckCircle2
        : Info;

  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'status' : undefined}
      className={cn(
        'rounded-[8px] border px-4 py-3 flex items-start gap-3',
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    >
      <Icon
        className={cn('w-4 h-4 shrink-0 mt-0.5', ICON_CLASSES[tone])}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1 space-y-1">
        {title && (
          <div className="text-[12.5px] font-semibold leading-snug">
            {title}
          </div>
        )}
        <div className="text-[12.5px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
};
