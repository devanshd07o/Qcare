/* Solid Dark Navy (#102A43) Clinical Sidebar with Uniform 1.75px Icon Strokes */
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ClipboardList,
  FileText,
  FolderArchive,
  LayoutGrid,
  LogOut,
  type LucideIcon,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserPlus,
  X
} from 'lucide-react';
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

interface SidebarNavItem {
  id: DoctorPortalView;
  label: string;
  Icon: LucideIcon;
  count?: number;
  highlightNew?: boolean;
}

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

  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileDrawerOpen]);

  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileDrawerOpen]);

  const navItems: SidebarNavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      Icon: LayoutGrid
    },
    {
      id: 'walkin',
      label: 'Walk-in Desk',
      Icon: UserPlus
    },
    {
      id: 'queue',
      label: 'OPD Queue',
      Icon: ClipboardList,
      count: queueCount
    },
    {
      id: 'reports',
      label: 'Patient Reports',
      Icon: FileText,
      count: unreadReportsCount > 0 ? unreadReportsCount : reportsCount,
      highlightNew: unreadReportsCount > 0
    },
    {
      id: 'records',
      label: 'Past Records',
      Icon: FolderArchive,
      count: recordsCount
    }
  ];

  const activeItemLabel = navItems.find(n => n.id === activeView)?.label || 'Dashboard';

  return (
    <>
      {/* Mobile / Narrow Viewport (< 768px): Top-left Triple-Line Trigger cleanly aligned below white header */}
      <div className="md:hidden px-4 pt-3.5 pb-1 flex items-center justify-between gap-2 select-none">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            aria-expanded={mobileDrawerOpen}
            aria-controls="doctor-mobile-drawer"
            aria-label="Open navigation menu"
            data-testid="mobile-sidebar-trigger"
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-[#102A43] text-white hover:bg-[#193C5C] active:translate-y-px transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087C80]/70 focus-visible:ring-offset-1"
          >
            <Menu className="w-[19px] h-[19px]" strokeWidth={1.75} />
            {unreadReportsCount > 0 && (
              <span
                aria-label={`${unreadReportsCount} unread reports`}
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#087C80] text-white border border-white text-[10px] font-semibold leading-none flex items-center justify-center tabular-nums"
              >
                {unreadReportsCount}
              </span>
            )}
          </button>

          <span className="text-[13px] font-medium text-[#64748B]">
            {activeItemLabel}
          </span>
        </div>
      </div>

      {/* Overlapping Mobile Slide-In Solid Navy Drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50" id="doctor-mobile-drawer" role="dialog" aria-modal="true" aria-label="Doctor workstation navigation">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/45"
              aria-hidden="true"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-10 w-[264px] max-w-[82vw] bg-[#102A43] flex flex-col p-3.5 select-none"
            >
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300 truncate px-1">
                  Workstation
                </span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Close navigation menu"
                  data-testid="mobile-sidebar-close"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-white/15 bg-white/5 text-white hover:bg-white/12 transition-colors duration-150 cursor-pointer"
                >
                  <X className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </button>
              </div>

              <nav aria-label="Mobile sections" className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map(item => {
                  const active = activeView === item.id;
                  const NavIcon = item.Icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectView(item.id);
                        setMobileDrawerOpen(false);
                      }}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-[44px] w-full items-center justify-between rounded-[8px] px-3 text-[13px] font-medium transition-colors duration-150 cursor-pointer ${
                        active
                          ? 'bg-white/12 text-white'
                          : 'text-slate-300 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <NavIcon className="w-[19px] h-[19px] shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {typeof item.count === 'number' && (
                        <span
                          className={`ml-2 px-1.5 py-0.5 rounded-[6px] text-[11px] font-medium tabular-nums shrink-0 ${
                            item.highlightNew
                              ? 'bg-[#087C80] text-white'
                              : active
                                ? 'bg-white/20 text-white'
                                : 'bg-white/10 text-slate-200'
                          }`}
                        >
                          {item.highlightNew ? `${item.count} new` : item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 mt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    onSignOut();
                  }}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-[8px] px-3 text-[13px] font-medium text-slate-300 hover:bg-rose-500/20 hover:text-white transition-colors duration-150 cursor-pointer"
                >
                  <LogOut className="w-[19px] h-[19px] shrink-0" strokeWidth={1.75} />
                  <span>Sign out</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop / Tablet Solid Dark Navy Fixed Rail (#102A43, 68px collapsed -> 224px expanded) */}
      <motion.aside
        aria-label="Doctor workstation sidebar"
        initial={false}
        animate={{ width: isExpanded ? 224 : 68 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex fixed left-0 top-16 bottom-0 z-30 flex-col bg-[#102A43] qc-clinical-sidebar px-2.5 py-3 select-none overflow-hidden"
      >
        {/* Expand / Collapse Control */}
        <div className="pb-2.5 mb-2.5 border-b border-white/10">
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            data-tooltip={!isExpanded ? 'Expand menu' : undefined}
            className="flex h-10 w-full items-center justify-start rounded-[8px] text-slate-300 hover:bg-white/8 hover:text-white transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087C80]"
          >
            <span className="flex h-10 w-[46px] shrink-0 items-center justify-center">
              {isExpanded ? (
                <PanelLeftClose className="w-[19px] h-[19px]" strokeWidth={1.75} />
              ) : (
                <PanelLeftOpen className="w-[19px] h-[19px]" strokeWidth={1.75} />
              )}
            </span>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.14 }}
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300 whitespace-nowrap pr-2"
                >
                  Workstation
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Navigation Links — Uniform 1.75px Stroke & High Contrast */}
        <nav aria-label="Doctor sections" className="flex-1 space-y-1">
          {navItems.map(item => {
            const active = activeView === item.id;
            const NavIcon = item.Icon;
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
                className={`relative flex h-11 w-full items-center justify-start rounded-[8px] text-[13px] font-medium transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087C80] ${
                  active
                    ? 'bg-white/12 text-white'
                    : 'text-slate-300 hover:bg-white/8 hover:text-white'
                }`}
              >
                {active && (
                  <span
                    className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-[#38BDF8]"
                    aria-hidden="true"
                  />
                )}

                <span className="relative z-10 flex h-10 w-[46px] shrink-0 items-center justify-center">
                  <NavIcon className="w-[19px] h-[19px]" strokeWidth={1.75} />
                  {!isExpanded && item.id === 'queue' && typeof item.count === 'number' && item.count > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-white text-[#102A43] text-[10px] font-semibold leading-none flex items-center justify-center tabular-nums">
                      {item.count}
                    </span>
                  )}
                  {!isExpanded && item.id === 'reports' && item.highlightNew && (
                    <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#087C80] text-white border border-[#102A43] text-[10px] font-semibold leading-none flex items-center justify-center tabular-nums">
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
                      <span className="truncate font-medium">{item.label}</span>
                      {typeof item.count === 'number' && (
                        <span
                          className={`ml-2 px-1.5 py-0.5 rounded-[6px] text-[11px] font-medium tabular-nums ${
                            item.highlightNew
                              ? 'bg-[#087C80] text-white'
                              : active
                                ? 'bg-white/20 text-white'
                                : 'bg-white/10 text-slate-200'
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

        {/* Bottom Docked Sign Out */}
        <div className="pt-2.5 mt-2.5 border-t border-white/10">
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            data-tooltip={!isExpanded ? 'Sign out' : undefined}
            className="flex h-11 w-full items-center justify-start rounded-[8px] text-[13px] font-medium text-slate-300 hover:bg-rose-500/20 hover:text-white transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087C80]"
          >
            <span className="flex h-10 w-[46px] shrink-0 items-center justify-center">
              <LogOut className="w-[19px] h-[19px]" strokeWidth={1.75} />
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
