/* Source: D:\LetsCode\UI_COMPONENTS\magicui\apps\www\registry\magicui\magic-card.tsx (MIT) — adapted to Q-Care bright clinical palette */
import React, { useCallback, useEffect, useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'motion/react';
import { cn } from '../../utils/cn';

interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  surfaceClassName?: string;
}

export const MagicCard: React.FC<MagicCardProps> = ({
  children,
  className,
  surfaceClassName,
  gradientSize = 260,
  gradientColor = 'rgba(8, 124, 128, 0.11)',
  gradientFrom = '#087C80',
  gradientTo = '#14B8A6',
  ...props
}) => {
  const gradientSizeRef = useRef(gradientSize);
  useEffect(() => {
    gradientSizeRef.current = gradientSize;
  }, [gradientSize]);

  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);

  const reset = useCallback(() => {
    const off = -gradientSizeRef.current;
    mouseX.set(off);
    mouseY.set(off);
  }, [mouseX, mouseY]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <motion.div
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      className={cn(
        'group relative isolate overflow-hidden rounded-[10px] border border-transparent shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_16px_-6px_rgba(16,42,67,0.10)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-[1px]',
        className
      )}
      style={{
        background: useMotionTemplate`
          linear-gradient(#FFFFFF 0 0) padding-box,
          radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
            ${gradientFrom},
            ${gradientTo},
            #E2E8F0 100%
          ) border-box
        `
      }}
      {...(props as Record<string, unknown>)}
    >
      <div className={cn('pointer-events-none absolute inset-px z-10 rounded-[9px] bg-white', surfaceClassName)} />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-px z-20 rounded-[9px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
              ${gradientColor},
              transparent 80%
            )
          `
        }}
      />
      <div className="relative z-30">{children}</div>
    </motion.div>
  );
};
