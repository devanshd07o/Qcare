import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowUp,
  FileText,
  Phone,
  X
} from 'lucide-react';
import { DoctorPortalView, Hospital, UserRole } from '../../types';
import { setDoctorViewAction } from '../../store/useHospitalStore';

interface SiteFooterProps {
  activeRole: UserRole | null;
  hospital: Hospital;
  doctorSidebarExpanded?: boolean;
}

type InfoModalTopic = 'support' | 'privacy' | 'terms' | null;

export const SiteFooter: React.FC<SiteFooterProps> = ({
  activeRole,
  hospital,
  doctorSidebarExpanded = false
}) => {
  const [infoTopic, setInfoTopic] = useState<InfoModalTopic>(null);
  const isDoctor = activeRole === 'doctor';

  const scrollTopSmooth = () => {
    if (typeof window === 'undefined') return;
    const reduceMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const navigateDoctor = (view: DoctorPortalView) => {
    setDoctorViewAction(view);
    scrollTopSmooth();
  };

  const modalCopy: Record<Exclude<InfoModalTopic, null>, { title: string; body: string }> = {
    support: {
      title: 'Hospital Help Desk',
      body: `${hospital.name} OPD Desk · Timings: ${hospital.opdTimings || '08:00 AM – 08:00 PM'}${
        hospital.helpdeskPhone ? ` · Helpline: ${hospital.helpdeskPhone}` : ''
      }. Contact the front-desk coordinator for terminal or token sync assistance.`
    },
    privacy: {
      title: 'Clinical Data Privacy',
      body: 'Patient consultation records, diagnostic lab queues, and prescriptions remain strictly scoped to the active hospital tenant and signed-in clinical session.'
    },
    terms: {
      title: 'Workstation Terms of Use',
      body: 'Qcare assists clinical workflows and diagnostic queue routing. Attending physicians hold final verification authority over diagnostic reports and clinical sign-off.'
    }
  };

  return (
    <>
      <div
        className={`print:hidden mt-5 pb-6 transition-[padding-left] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isDoctor
            ? doctorSidebarExpanded
              ? 'md:pl-[224px]'
              : 'md:pl-[68px]'
            : 'max-w-7xl mx-auto w-full'
        }`}
      >
        <div className={isDoctor ? 'px-4 sm:px-6' : 'px-4 sm:px-6'}>
        <footer className="qc-site-footer rounded-[10px] overflow-hidden">
          <div className="px-5 sm:px-7 lg:px-8 pt-8 pb-6 space-y-6">
            {/* Top Multi-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Brand Block */}
              <div className="md:col-span-4 space-y-3.5">
                <div className="inline-flex h-9 items-center rounded-[8px] bg-white px-2.5">
                  <img
                    src="/logo-glossy.png"
                    alt="Qcare"
                    className="h-5 w-auto object-contain"
                    draggable={false}
                  />
                </div>

                <p className="text-[13px] leading-[1.6] text-[var(--footer-muted)] max-w-[34ch]">
                  Outpatient registration, diagnostic routing, and verified clinical reporting.
                </p>

                {/* Genuine Utility Replacement (no empty icon dock pills) */}
                <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  {isDoctor ? (
                    <button
                      type="button"
                      onClick={() => navigateDoctor('walkin')}
                      className="inline-flex items-center gap-1.5 font-semibold text-[var(--footer-accent)] hover:text-white transition-colors duration-150 cursor-pointer"
                    >
                      <span>Register Walk-in</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setInfoTopic('support')}
                    className="inline-flex items-center gap-1.5 text-[11.5px] whitespace-nowrap text-[var(--footer-muted)] hover:text-white transition-colors duration-150 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-[var(--footer-accent)] shrink-0" />
                    <span>{(hospital.opdTimings || '8:00 AM – 8:00 PM OPD').replace(/\b0(\d:)/g, '$1')}</span>
                  </button>
                </div>
              </div>

              {/* Navigation Columns Connected Directly to App Pages */}
              <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
                <div className="qc-footer-col">
                  <h4 className="qc-footer-heading text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--footer-text)] mb-2.5">
                    {isDoctor ? 'Workstation' : 'Portal'}
                  </h4>
                  <ul className="space-y-0.5 text-[13px]">
                    {isDoctor ? (
                      <>
                        <li>
                          <button
                            type="button"
                            onClick={() => navigateDoctor('dashboard')}
                            className="qc-footer-link cursor-pointer text-left"
                          >
                            <span className="qc-footer-link-label">Dashboard</span>
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => navigateDoctor('walkin')}
                            className="qc-footer-link cursor-pointer text-left"
                          >
                            <span className="qc-footer-link-label">Walk-in Desk</span>
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => navigateDoctor('queue')}
                            className="qc-footer-link cursor-pointer text-left"
                          >
                            <span className="qc-footer-link-label">OPD Queue</span>
                          </button>
                        </li>
                      </>
                    ) : (
                      <li>
                        <button
                          type="button"
                          onClick={scrollTopSmooth}
                          className="qc-footer-link cursor-pointer text-left"
                        >
                          <span className="qc-footer-link-label">Top of Workspace</span>
                        </button>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="qc-footer-col">
                  <h4 className="qc-footer-heading text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--footer-text)] mb-2.5">
                    Records
                  </h4>
                  <ul className="space-y-0.5 text-[13px]">
                    {isDoctor ? (
                      <>
                        <li>
                          <button
                            type="button"
                            onClick={() => navigateDoctor('reports')}
                            className="qc-footer-link cursor-pointer text-left"
                          >
                            <span className="qc-footer-link-label">Patient Reports</span>
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => navigateDoctor('records')}
                            className="qc-footer-link cursor-pointer text-left"
                          >
                            <span className="qc-footer-link-label">Past Records</span>
                          </button>
                        </li>
                      </>
                    ) : (
                      <li>
                        <button
                          type="button"
                          onClick={() => setInfoTopic('support')}
                          className="qc-footer-link cursor-pointer text-left"
                        >
                          <span className="qc-footer-link-label">Hospital Desk</span>
                        </button>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="qc-footer-col">
                  <h4 className="qc-footer-heading text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--footer-text)] mb-2.5">
                    Support
                  </h4>
                  <ul className="space-y-0.5 text-[13px]">
                    <li>
                      <button
                        type="button"
                        onClick={() => setInfoTopic('support')}
                        className="qc-footer-link cursor-pointer text-left"
                      >
                        <span className="qc-footer-link-label">Help Desk</span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setInfoTopic('privacy')}
                        data-testid="footer-privacy-trigger"
                        className="qc-footer-link cursor-pointer text-left"
                      >
                        <span className="qc-footer-link-label">Privacy Policy</span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setInfoTopic('terms')}
                        className="qc-footer-link cursor-pointer text-left"
                      >
                        <span className="qc-footer-link-label">Terms of Use</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Clean Bottom Line (Zero version/v2.0 clutter) */}
            <div className="pt-4 border-t border-[var(--footer-border)] flex items-center justify-between gap-4 text-xs text-[var(--footer-muted)]">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                <span className="font-semibold text-[var(--footer-text)]">Qcare</span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{hospital.name}</span>
              </div>

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={scrollTopSmooth}
                  aria-label="Back to top"
                  className="qc-to-top cursor-pointer"
                >
                  <ArrowUp className="w-4 h-4" strokeWidth={2.2} />
                </button>
                <span className="qc-footer-tooltip" aria-hidden="true">
                  Back to top
                </span>
              </div>
            </div>
          </div>
        </footer>
        </div>
      </div>

      {/* Info Modal */}
      {infoTopic && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45"
          role="dialog"
          aria-modal="true"
          aria-labelledby="footer-info-title"
          onClick={() => setInfoTopic(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-xl space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--accent-primary)]" />
                <h3 id="footer-info-title" className="text-sm font-bold text-[var(--text-primary)]">
                  {modalCopy[infoTopic].title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInfoTopic(null)}
                aria-label="Close dialog"
                className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs leading-[1.6] text-[var(--text-secondary)]">
              {modalCopy[infoTopic].body}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
