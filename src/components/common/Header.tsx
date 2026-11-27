/* Source: D:\LetsCode\UI_COMPONENTS\originui & kokonutui (MIT) — adapted to QCare logo brand chrome */
import React from 'react';
import { useHospitalStore, resolveIndianDoctorAvatar } from '../../store/useHospitalStore';
import { REGISTERED_HOSPITALS } from '../../data/mockHospitalData';
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

const DoctorFallbackSvg: React.FC = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-full h-full" aria-hidden="true">
    <rect width="40" height="40" rx="8" fill="#F1F5F9" />
    <circle cx="20" cy="14.5" r="5.5" fill="#FFFFFF" stroke="#102A43" strokeWidth="1.6" />
    <path
      d="M10 33.5C10.8 27 15 23.5 20 23.5C25 23.5 29.2 27 30 33.5"
      fill="#FFFFFF"
      stroke="#102A43"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path d="M16 24.5L20 30L24 24.5" stroke="#087C80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Header: React.FC = () => {
  const {
    currentHospital,
    currentUser,
    activeRole,
    navigationHistory,
    signOut,
    navigateBack
  } = useHospitalStore();

  const [avatarFailed, setAvatarFailed] = React.useState(false);
  const doctorAvatar =
    currentUser?.avatar ||
    resolveIndianDoctorAvatar(currentUser?.name || currentHospital.doctorName);

  React.useEffect(() => {
    setAvatarFailed(false);
  }, [doctorAvatar]);

  const RoleIcon = currentUser ? ROLE_ICON[currentUser.role] : User;
  const isDoctorPortal = activeRole === 'doctor';
  const catalogHospital = REGISTERED_HOSPITALS.find(
    h => h.id === currentHospital.id || h.code === currentHospital.code
  );
  const doctorDesignation =
    currentUser?.designation ||
    currentHospital.doctorDesignation ||
    catalogHospital?.doctorDesignation ||
    'Senior Consultant · Internal Medicine';

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
    <header className="fixed inset-x-0 top-0 z-40 select-none qc-clinical-header">
      <div
        className={`${
          isDoctorPortal ? 'w-full px-4 sm:px-6' : 'mx-auto max-w-7xl px-4 sm:px-6'
        } flex h-16 items-center justify-between gap-4`}
      >
        {/* Left Zone: Back (when navigated) + Clean Qcare Logo + 17px Semibold Inter Hospital Name */}
        <div className="flex min-w-0 items-center gap-3">
          {canStepBackInSession && (
            <button
              type="button"
              onClick={handleSafeBack}
              aria-label="Back to previous view"
              data-tooltip="Back"
              className="group flex h-8 items-center gap-1 rounded-[8px] px-2 text-xs font-medium text-[#64748B] transition-colors duration-150 hover:bg-[#F5F7FA] hover:text-[#0F172A] cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087C80]"
            >
              <ArrowLeft
                className="h-4 w-4 transition-transform duration-150 group-hover:-translate-x-0.5"
                strokeWidth={1.75}
              />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          <img
            src="/logo-glossy.png"
            alt="Qcare"
            className="h-7 w-auto object-contain shrink-0"
            draggable={false}
          />

          <span aria-hidden="true" className="hidden sm:block h-5 w-px bg-[#E2E8F0] shrink-0" />

          <span className="truncate text-[15px] sm:text-[17px] font-semibold tracking-[-0.015em] text-[#0F172A]">
            {currentHospital.name}
          </span>
        </div>

        {/* Right Zone: Doctor Profile in Top-Right (no Sign out in Doctor header), Identity + Sign out for Other Portals */}
        <div className="flex shrink-0 items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-2.5">
              {currentUser.role === 'doctor' ? (
                <div className="h-10 w-10 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] overflow-hidden shrink-0 flex items-center justify-center">
                  {doctorAvatar && !avatarFailed ? (
                    <img
                      src={doctorAvatar}
                      alt={currentUser.name}
                      loading="eager"
                      decoding="sync"
                      className="h-full w-full object-cover object-top block"
                      onError={() => setAvatarFailed(true)}
                    />
                  ) : (
                    <DoctorFallbackSvg />
                  )}
                </div>
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#F5F7FA] text-[#0F172A] border border-[#E2E8F0]">
                  <RoleIcon className="h-4 w-4" strokeWidth={1.75} />
                </div>
              )}

              <div className="hidden text-left sm:block leading-tight">
                <span className="block max-w-[190px] truncate text-[14px] font-medium text-[#0F172A]">
                  {currentUser.name}
                </span>
                <span className="block max-w-[210px] truncate text-[12px] font-normal text-[#64748B] tabular-nums">
                  {isDoctorPortal
                    ? `${doctorDesignation.split('·')[0].trim()} · ${currentUser.identifier}`
                    : currentUser.role === 'pharmacist'
                    ? `${currentUser.subtitle || 'Hospital Dispensary'} · ${currentUser.identifier}`
                    : currentUser.identifier}
                </span>
              </div>
            </div>
          )}

          {currentUser && !isDoctorPortal && (
            <>
              <span aria-hidden="true" className="hidden sm:block h-5 w-px bg-[#E2E8F0]" />
              <button
                type="button"
                onClick={signOut}
                data-tooltip="Sign out"
                className="flex h-9 items-center gap-1.5 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#0F172A] transition-colors duration-150 hover:bg-[#F5F7FA] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087C80]"
              >
                <LogOut className="h-3.5 w-3.5 text-[#64748B]" strokeWidth={1.75} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
