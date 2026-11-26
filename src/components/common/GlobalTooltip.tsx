/* Source: D:\LetsCode\UI_COMPONENTS\originui (MIT) — single unified bright clinical tooltip controller */
import React, { useState, useEffect, useRef } from 'react';

interface TooltipState {
  text: string;
  x: number;
  y: number;
  visible: boolean;
  isAbove: boolean;
}

/**
 * Strip native `title` attributes into `data-tooltip` proactively so
 * the browser OS tooltip never fires simultaneously alongside custom tooltips.
 */
function stripNativeTitle(el: HTMLElement | null): void {
  let cursor: HTMLElement | null = el;
  while (cursor) {
    if (cursor.hasAttribute('title')) {
      const titleText = cursor.getAttribute('title')?.trim();
      if (titleText && !cursor.hasAttribute('data-tooltip') && !cursor.hasAttribute('data-custom-tooltip')) {
        cursor.setAttribute('data-tooltip', titleText);
      }
      cursor.removeAttribute('title');
    }
    cursor = cursor.parentElement;
  }
}

export const GlobalTooltip: React.FC = () => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    text: '',
    x: 0,
    y: 0,
    visible: false,
    isAbove: true
  });

  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };

    const handlePointerOver = (e: PointerEvent) => {
      const rawTarget = e.target as HTMLElement | null;
      stripNativeTitle(rawTarget);

      // Suppress global tooltip when element is owned by a dedicated rich clinical popover
      if (rawTarget?.closest?.('[data-custom-tooltip]')) {
        currentTargetRef.current = null;
        clearTimers();
        setTooltip(prev => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const target = rawTarget?.closest?.('[data-tooltip]') as HTMLElement | null;
      if (!target) return;

      const text = target.getAttribute('data-tooltip')?.trim();
      if (!text) return;

      if (currentTargetRef.current === target) return;
      currentTargetRef.current = target;
      clearTimers();

      showTimeoutRef.current = setTimeout(() => {
        if (currentTargetRef.current !== target) return;

        const rect = target.getBoundingClientRect();
        const x = Math.min(Math.max(16, rect.left + rect.width / 2), window.innerWidth - 16);
        const isAbove = rect.top > 120 && (rect.bottom > window.innerHeight - 100 || rect.top > window.innerHeight - 140);
        const y = isAbove ? Math.max(8, rect.top - 8) : Math.min(window.innerHeight - 30, rect.bottom + 8);

        setTooltip({
          text,
          x,
          y,
          isAbove,
          visible: true
        });
      }, 220);
    };

    const handlePointerOut = (e: PointerEvent) => {
      const activeEl = currentTargetRef.current;
      if (!activeEl) return;

      if (e.relatedTarget && activeEl.contains(e.relatedTarget as Node)) {
        return;
      }

      currentTargetRef.current = null;
      clearTimers();

      hideTimeoutRef.current = setTimeout(() => {
        setTooltip(prev => (prev.visible ? { ...prev, visible: false } : prev));
      }, 60);
    };

    const handleDismiss = () => {
      currentTargetRef.current = null;
      clearTimers();
      setTooltip(prev => (prev.visible ? { ...prev, visible: false } : prev));
    };

    document.addEventListener('pointerover', handlePointerOver, { passive: true, capture: true });
    document.addEventListener('pointerout', handlePointerOut, { passive: true, capture: true });
    document.addEventListener('click', handleDismiss, { passive: true });
    window.addEventListener('scroll', handleDismiss, { passive: true, capture: true });

    return () => {
      document.removeEventListener('pointerover', handlePointerOver, { capture: true });
      document.removeEventListener('pointerout', handlePointerOut, { capture: true });
      document.removeEventListener('click', handleDismiss);
      window.removeEventListener('scroll', handleDismiss, { capture: true });
      clearTimers();
    };
  }, []);

  if (!tooltip.visible || !tooltip.text) return null;

  const estimatedWidth = Math.min(280, Math.max(72, Math.ceil(tooltip.text.length * 7.2 + 28)));
  const halfWidth = estimatedWidth / 2;
  const safeX = Math.max(halfWidth + 10, Math.min(window.innerWidth - halfWidth - 10, tooltip.x));
  const rawArrowOffset = tooltip.x - safeX;
  const clampedArrowOffset = Math.max(-halfWidth + 14, Math.min(halfWidth - 14, rawArrowOffset));

  return (
    <div
      role="tooltip"
      className={`liquid-glass-tooltip ${tooltip.isAbove ? 'is-above' : 'is-below'}`}
      style={{
        position: 'fixed',
        left: safeX,
        top: tooltip.y,
        transform: tooltip.isAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
        ['--tooltip-arrow-offset' as string]: `${clampedArrowOffset}px`
      }}
    >
      {tooltip.text}
    </div>
  );
};
