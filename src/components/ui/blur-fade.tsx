/* Source: D:\LetsCode\UI_COMPONENTS\magicui (MIT) — adapted for crisp clinical reveal */
import React from 'react';
import { motion, type MotionProps } from 'motion/react';
import { cn } from '../../utils/cn';

interface BlurFadeProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  offset?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function BlurFade({
  children,
  className,
  duration = 0.22,
  delay = 0,
  offset = 6,
  direction = 'up',
  ...props
}: BlurFadeProps) {
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const signedOffset = direction === 'right' || direction === 'down' ? -offset : offset;

  return (
    <motion.div
      initial={{ opacity: 0, [axis]: signedOffset }}
      animate={{ opacity: 1, [axis]: 0 }}
      transition={{
        delay,
        duration,
        ease: [0.16, 1, 0.3, 1]
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
