/* Source: D:\LetsCode\UI_COMPONENTS\originui & kokonutui (MIT) — adapted to QCare full-bleed frosted header */
import React from 'react';
import { useHospitalStore, resolveIndianDoctorAvatar } from '../../store/useHospitalStore';
import {
  Stethoscope,
  FlaskConical,
  LogOut,
  User,
  ArrowLeft,
  Pill
} from 'lucide-react';

const ROLE_ICON = {
  doctor: Stethoscope,
  lab_tech: FlaskConical,
  pharmacist: Pill,
  patient: User
} as const;

export const Header: React.FC = () => {
  const {
    currentHospital,
    currentUser,
    activeRole,
    doctorView,
    navigationHistory,
    signOut,
    navigateBack
  } = useHospitalStore();

  const doctorAvatar =
    currentUser?.avatar ||
    resolveIndianDoctorAvatar(currentUser?.name || currentHospital.doctorName);

  const RoleIcon = currentUser ? ROLE_ICON[currentUser.role] : User;
  const isDoctorPortal = activeRole === 'doctor';
  const isDoctorDashboard = isDoctorPortal && doctorView === 'dashboard';

  // Back button must NEVER log the user out: only allow stepping back to an authenticated in-session view.
  const previousEntry =
    navigationHistory && navigationHistory.length > 0
      ? navigationHistory[navigationHistory.length - 1]
      : null;
  const canStepBackInSession = Boolean(previousEntry && previousEntry.currentUser !== null);

  const handleSafeBack = () => {
    if (!canStepBackInSession) return;
    navigateBack();
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 sm:px-4 pt-2.5 pb-2 pointer-events-none select-none bg-[var(--bg-page)]/60 backdrop-blur-md">
      <div
        className={`pointer-events-auto ${
          isDoctorPortal ? 'w-full' : 'mx-auto max-w-7xl'
        } grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[minmax(max-content,1fr)_minmax(0,auto)_minmax(max-content,1fr)] items-center gap-3 rounded-[22px] border border-white/80 ring-1 ring-[var(--border-default)]/80 bg-white/85 px-3 sm:px-4 backdrop-blur-xl shadow-[0_6px_22px_-6px_rgba(15,23,42,0.09),inset_0_1px_0_rgba(255,255,255,0.95)]`}
      >
        {/* Left Zone: Optional In-Session Back + Raised Rounded Qcare Brand */}
        <nav aria-label="Workspace navigation" className="flex items-center gap-2 justify-self-start shrink-0">
          {canStepBackInSession && (
            <button
              type="button"
              onClick={handleSafeBack}
              aria-label="Back to previous view"
              data-tooltip="Back"
              className="group flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-primary)] cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
            >
              <ArrowLeft
                className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5"
                strokeWidth={2.2}
              />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          <div className="inline-flex h-9 items-center rounded-2xl border border-[var(--border-default)]/90 bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-surface-hover)] px-2.5 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.09),0_1px_2px_rgba(15,23,42,0.04),inset_0_1px_0_var(--bg-surface)] shrink-0">
            <img
              src="/logo-glossy.png"
              alt="Qcare"
              className="h-6 w-auto object-contain"
              draggable={false}
            />
          </div>
        </nav>

        {/* Center Zone: Clean Centered Hospital Name */}
        <div className="min-w-0 px-1 sm:px-3 text-center">
          <span className="block truncate text-xs sm:text-sm md:text-[15px] font-bold tracking-[-0.015em] text-[var(--text-primary)]">
            {currentHospital.name}
          </span>
        </div>

        {/* Right Zone: Clinician Identity (+ Sign out for dashboard or non-sidebar portals) */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5 justify-self-end">
          {currentUser && !isDoctorDashboard && (
            <div className="flex items-center gap-2 pr-0.5 sm:pr-1">
              {currentUser.role === 'doctor' ? (
                <img
                  src={doctorAvatar}
                  alt={currentUser.name}
                  className="h-8 w-8 rounded-full object-cover object-top ring-1 ring-[var(--border-default)] shrink-0"
                  onError={e => {
                    const img = e.currentTarget;
                    if (!img.src.includes('doctor_male_1.jpg')) {
                      img.src = '/doctors/doctor_male_1.jpg';
                    }
                  }}
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)]">
                  <RoleIcon className="h-4 w-4" />
                </div>
              )}

              <div className="hidden text-left leading-tight md:block">
                <span className="block max-w-[160px] truncate text-[12.5px] font-semibold leading-[1.2] text-[var(--text-primary)]">
                  {currentUser.name}
                </span>
                {currentUser.identifier && (
                  <span className="block max-w-[160px] truncate text-[11px] leading-[1.2] text-[var(--text-secondary)]">
                    {currentUser.identifier}
                  </span>
                )}
              </div>
            </div>
          )}

          {currentUser && (!isDoctorPortal || isDoctorDashboard) && (
            <>
              {!isDoctorDashboard && (
                <span aria-hidden="true" className="hidden sm:block h-4 w-px bg-[var(--border-subtle)]" />
              )}

              <button
                type="button"
                onClick={signOut}
                data-tooltip="Sign out"
                className="flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
