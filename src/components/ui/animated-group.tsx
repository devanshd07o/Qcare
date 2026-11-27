/* Source: D:\LetsCode\UI_COMPONENTS\motion-primitives\components\core\animated-group.tsx (MIT) — adapted to Q-Care React 18 */
import React, { ReactNode } from 'react';
import { motion, type Variants } from 'motion/react';

export type PresetType = 'fade' | 'slide' | 'scale' | 'blur-slide';

export type AnimatedGroupProps = {
  children: ReactNode;
  className?: string;
  preset?: PresetType;
  staggerDelay?: number;
};

const presetVariants: Record<PresetType, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }
  },
  slide: {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }
  },
  scale: {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }
  },
  'blur-slide': {
    hidden: { opacity: 0, filter: 'blur(3px)', y: 8 },
    visible: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }
  }
};

export function AnimatedGroup({
  children,
  className,
  preset = 'slide',
  staggerDelay = 0.05
}: AnimatedGroupProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: staggerDelay }
    }
  };
  const itemVariants = presetVariants[preset];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
