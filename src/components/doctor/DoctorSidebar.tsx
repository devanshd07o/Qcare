/* Source: Crafted clinical duo-tone rail SVGs + Motion (MIT) — adapted under /impeccable & /hallmark */
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { NumberTicker } from '../ui/number-ticker';
import type { DoctorPortalView } from '../../types';

export type { DoctorPortalView };

interface DoctorSidebarProps {
  activeView: DoctorPortalView;
  onSelectView: (view: DoctorPortalView) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  queueCount: number;
  reportsCount: number;
  unreadReportsCount?: number;
  recordsCount: number;
  onSignOut: () => void;
}

const SidebarToggleGlyph: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="2.25" y="3.5" width="15.5" height="13" rx="3.25" stroke="currentColor" strokeWidth="1.5" />
    <rect x="4.25" y="5.5" width="3.5" height="9" rx="1.25" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.2" />
    {expanded ? (
      <path d="M13.25 7.75L10.75 10L13.25 12.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d="M11.25 7.75L13.75 10L11.25 12.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);

const DashboardGlyph: React.FC<{ active: boolean }> = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect
      x="2.75"
      y="2.75"
      width="6.5"
      height="7.5"
      rx="2"
      fill="currentColor"
      fillOpacity={active ? 0.18 : 0.08}
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <rect x="10.75" y="2.75" width="6.5" height="4.75" rx="1.75" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2.75" y="11.75" width="6.5" height="5.5" rx="1.75" stroke="currentColor" strokeWidth="1.5" />
    <rect
      x="10.75"
      y="9"
      width="6.5"
      height="8.25"
      rx="2"
      fill="currentColor"
      fillOpacity={active ? 0.16 : 0.06}
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const WalkInChartGlyph: React.FC<{ active: boolean }> = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect
      x="3.25"
      y="3.25"
      width="11.5"
      height="13.5"
      rx="3"
      fill="currentColor"
      fillOpacity={active ? 0.16 : 0.08}
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M6.5 3.25V2.75C6.5 2.06 7.06 1.5 7.75 1.5H10.25C10.94 1.5 11.5 2.06 11.5 2.75V3.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M6.25 7.75H10.75M6.25 10.75H9.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="15" cy="14.25" r="3.5" fill="var(--bg-surface, #FFFFFF)" stroke="currentColor" strokeWidth="1.45" />
    <path d="M15 12.75V15.75M13.5 14.25H16.5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
  </svg>
);

const OpdQueueGlyph: React.FC<{ active: boolean }> = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect
      x="2.75"
      y="5.75"
      width="11.5"
      height="10.5"
      rx="2.75"
      fill="currentColor"
      fillOpacity={active ? 0.16 : 0.08}
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M5.75 3.25H14.5C15.88 3.25 17 4.37 17 5.75V12.5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
    <path d="M5.75 9.75H11.25M5.75 12.5H9.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ReportsGlyph: React.FC<{ active: boolean }> = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M4.25 3.75C4.25 2.92 4.92 2.25 5.75 2.25H11.5L15.75 6.5V16.25C15.75 17.08 15.08 17.75 14.25 17.75H5.75C4.92 17.75 4.25 17.08 4.25 16.25V3.75Z"
      fill="currentColor"
      fillOpacity={active ? 0.16 : 0.08}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M11.25 2.5V6.75H15.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M6.75 10.25H13.25M6.75 13.25H11.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ArchiveRecordsGlyph: React.FC<{ active: boolean }> = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M2.75 5.75C2.75 4.37 3.87 3.25 5.25 3.25H7.9C8.55 3.25 9.16 3.57 9.53 4.1L10.35 5.25H14.75C16.13 5.25 17.25 6.37 17.25 7.75V14.25C17.25 15.63 16.13 16.75 14.75 16.75H5.25C3.87 16.75 2.75 15.63 2.75 14.25V5.75Z"
      fill="currentColor"
      fillOpacity={active ? 0.16 : 0.08}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M6.25 9.75H13.75M6.25 12.75H11.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SignOutDoorGlyph: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M11.25 3.25H5.75C4.37 3.25 3.25 4.37 3.25 5.75V14.25C3.25 15.63 4.37 16.75 5.75 16.75H11.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <rect x="4.75" y="4.75" width="4.5" height="10.5" rx="1.25" fill="currentColor" fillOpacity="0.1" />
    <path d="M9.75 10H16.75M14.25 7.25L17 10L14.25 12.75" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DoctorSidebar: React.FC<DoctorSidebarProps> = ({
  activeView,
  onSelectView,
  isExpanded,
  onToggleExpand,
  queueCount,
  reportsCount,
  unreadReportsCount = 0,
  recordsCount,
  onSignOut
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close drawer cleanly on Escape and lock body scroll while overlapping drawer is open
  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileDrawerOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [mobileDrawerOpen]);

  const navItems: Array<{
    id: DoctorPortalView;
    label: string;
    Glyph: React.FC<{ active: boolean }>;
    count?: number;
    highlightNew?: boolean;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      Glyph: DashboardGlyph
    },
    {
      id: 'walkin',
      label: 'Walk-in Desk',
      Glyph: WalkInChartGlyph
    },
    {
      id: 'queue',
      label: 'OPD Queue',
      Glyph: OpdQueueGlyph,
      count: queueCount
    },
    {
      id: 'reports',
      label: 'Patient Reports',
      Glyph: ReportsGlyph,
      count: unreadReportsCount > 0 ? unreadReportsCount : reportsCount,
      highlightNew: unreadReportsCount > 0
    },
    {
      id: 'records',
      label: 'Past Records',
      Glyph: ArchiveRecordsGlyph,
      count: recordsCount
    }
  ];

  const activeItemLabel = navItems.find(n => n.id === activeView)?.label || 'Dashboard';

  return (
    <>
      {/* Mobile / Narrow Viewport (< 768px): Top-left Triple-Line Trigger right below Qcare header */}
      <div className="md:hidden mb-3 flex items-center justify-between gap-2 select-none">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            aria-expanded={mobileDrawerOpen}
            aria-controls="doctor-mobile-drawer"
            aria-label="Open navigation menu"
            data-testid="mobile-sidebar-trigger"
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] qcare-pill-3d hover:bg-[var(--bg-surface-subtle)] active:translate-y-px transition-[background-color,transform] duration-150 cursor-pointer"
          >
            <Menu className="w-5 h-5" strokeWidth={2.2} />
            {unreadReportsCount > 0 && (
              <span
                aria-label={`${unreadReportsCount} unread reports`}
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--status-success)] text-white font-mono text-[9.5px] font-bold leading-none flex items-center justify-center tabular-nums qcare-pill-3d-solid"
              >
                {unreadReportsCount}
              </span>
            )}
          </button>

          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            {activeItemLabel}
          </span>
        </div>
      </div>

      {/* Overlapping Mobile Slide-In Sidebar Drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50" id="doctor-mobile-drawer" role="dialog" aria-modal="true" aria-label="Doctor workstation navigation">
            {/* Translucent backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/35"
              aria-hidden="true"
            />

            {/* Overlapping Drawer Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-10 w-[264px] max-w-[82vw] bg-[var(--bg-surface)] border-r border-[var(--border-default)] shadow-[8px_0_28px_-8px_rgba(15,23,42,0.18)] flex flex-col p-3.5 select-none"
            >
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src="/logo-glossy.png"
                    alt="Qcare"
                    className="h-6 w-auto object-contain shrink-0"
                    draggable={false}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] truncate">
                    Workstation
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Close navigation menu"
                  data-testid="mobile-sidebar-close"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150 cursor-pointer"
                >
                  <X className="w-4 h-4" strokeWidth={2.2} />
                </button>
              </div>

              <nav aria-label="Mobile sections" className="flex-1 space-y-1.5 overflow-y-auto">
                {navItems.map(item => {
                  const active = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectView(item.id);
                        setMobileDrawerOpen(false);
                      }}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                        active
                          ? 'bg-[var(--bg-surface-subtle)] text-[var(--accent-primary)] border border-[var(--border-default)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)] border border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <item.Glyph active={active} />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {typeof item.count === 'number' && (
                        <span
                          className={`ml-2 px-1.5 py-0.5 rounded-md font-mono text-[10.5px] font-bold tabular-nums shrink-0 ${
                            item.highlightNew
                              ? 'bg-[var(--status-success)] text-white qcare-pill-3d-solid'
                              : active
                                ? 'bg-[var(--accent-primary)] text-white qcare-pill-3d-solid'
                                : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] qcare-pill-3d'
                          }`}
                        >
                          {item.highlightNew ? `${item.count} new` : item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 mt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    onSignOut();
                  }}
                  className="flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] transition-colors duration-150 cursor-pointer"
                >
                  <SignOutDoorGlyph />
                  <span>Sign out</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop / Tablet Truly Fixed Non-Scrolling Rail (>= 768px) */}
      <motion.aside
        aria-label="Doctor workstation sidebar"
        initial={false}
        animate={{ width: isExpanded ? 216 : 64 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex fixed left-3 sm:left-4 top-[80px] bottom-3.5 z-30 flex-col rounded-[22px] border border-white/80 ring-1 ring-[var(--border-default)]/80 bg-white/90 backdrop-blur-xl shadow-[0_8px_24px_-6px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] p-2.5 select-none overflow-hidden"
      >
        {/* Expand / Collapse Control */}
        <div className="pb-2.5 mb-2.5 border-b border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            data-tooltip={!isExpanded ? 'Expand menu' : undefined}
            className="flex h-10 w-full items-center justify-start rounded-[14px] border border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          >
            <span className="flex h-10 w-[42px] shrink-0 items-center justify-center">
              <SidebarToggleGlyph expanded={isExpanded} />
            </span>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.14 }}
                  className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] whitespace-nowrap pr-2"
                >
                  Workstation
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Core Navigation Links (Dashboard, Walk-in, OPD Queue, Patient Reports, Past Records) */}
        <nav aria-label="Doctor sections" className="flex-1 space-y-1.5">
          {navItems.map(item => {
            const active = activeView === item.id;
            const collapsedTooltip = !isExpanded
              ? typeof item.count === 'number'
                ? item.highlightNew
                  ? `${item.label} (${item.count} new)`
                  : `${item.label} (${item.count})`
                : item.label
              : undefined;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                aria-current={active ? 'page' : undefined}
                aria-label={collapsedTooltip || item.label}
                data-tooltip={collapsedTooltip}
                className={`relative flex h-11 w-full items-center justify-start rounded-[14px] text-xs font-semibold transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                  active
                    ? 'text-[var(--accent-primary)] border border-[var(--border-default)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)] border border-transparent'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="doctorSidebarActivePill"
                    transition={{ type: 'spring', bounce: 0.16, duration: 0.24 }}
                    className="absolute inset-0 rounded-[13px] bg-[var(--bg-surface-subtle)]"
                    aria-hidden="true"
                  />
                )}

                <span className="relative z-10 flex h-10 w-[42px] shrink-0 items-center justify-center">
                  <item.Glyph active={active} />
                  {!isExpanded && item.id === 'queue' && (
                    <span className="absolute -top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--accent-primary)] text-white font-mono text-[9.5px] font-bold leading-none flex items-center justify-center tabular-nums qcare-pill-3d-solid">
                      {item.count}
                    </span>
                  )}
                  {!isExpanded && item.id === 'reports' && item.highlightNew && (
                    <span className="absolute -top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--status-success)] text-white font-mono text-[9.5px] font-bold leading-none flex items-center justify-center tabular-nums qcare-pill-3d-solid">
                      {item.count}
                    </span>
                  )}
                </span>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{ duration: 0.14 }}
                      className="relative z-10 flex flex-1 items-center justify-between pr-2.5 whitespace-nowrap min-w-0"
                    >
                      <span className="truncate">{item.label}</span>
                      {typeof item.count === 'number' && (
                        <span
                          className={`ml-2 px-1.5 py-0.5 rounded-md font-mono text-[10.5px] font-bold tabular-nums ${
                            item.highlightNew
                              ? 'bg-[var(--status-success)] text-white qcare-pill-3d-solid'
                              : active
                                ? 'bg-[var(--accent-primary)] text-white qcare-pill-3d-solid'
                                : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] qcare-pill-3d'
                          }`}
                        >
                          <NumberTicker value={item.count} />
                        </span>
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        {/* Static Bottom Docked Sign Out */}
        <div className="pt-2.5 mt-2.5 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            data-tooltip={!isExpanded ? 'Sign out' : undefined}
            className="flex h-11 w-full items-center justify-start rounded-[14px] border border-transparent text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]"
          >
            <span className="flex h-10 w-[42px] shrink-0 items-center justify-center">
              <SignOutDoorGlyph />
            </span>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.14 }}
                  className="whitespace-nowrap pr-2.5"
                >
                  Sign out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  );
};
