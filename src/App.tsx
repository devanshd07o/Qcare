import React, { useEffect } from 'react';
import {
  useHospitalStore,
  setHospitalByCodeAction,
  navigateBackAction,
  isInternalNavigationBack,
  getHospitalState,
  loginDoctorAction,
  loginLabTechAction,
  selectAndLoginPatientAction,
  registerPatientAction,
  prescribeTestsAction,
  callPatientAction,
  completeTestAndUploadReportAction,
  signOutAction
} from './store/useHospitalStore';
import { AuthScreen } from './components/auth/AuthScreen';
import { Header } from './components/common/Header';
import { DoctorPortal } from './components/doctor/DoctorPortal';
import { PatientPortal } from './components/patient/PatientPortal';
import { LabPortal } from './components/lab/LabPortal';
import { GlobalTooltip } from './components/common/GlobalTooltip';
import { Sparkles, X, ShieldCheck } from 'lucide-react';

export default function App() {
  const {
    currentUser,
    activeRole,
    currentHospital,
    toastNotification,
    dismissToast,
    loginAsPatientWithSession
  } = useHospitalStore();

  // Expose store for test verification in development
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__hospitalStore = useHospitalStore;
      (window as any).__qcare = {
        getState: getHospitalState,
        loginDoctor: loginDoctorAction,
        loginLabTech: loginLabTechAction,
        selectAndLoginPatient: selectAndLoginPatientAction,
        registerPatient: registerPatientAction,
        prescribeTests: prescribeTestsAction,
        callPatient: callPatientAction,
        completeTestAndUploadReport: completeTestAndUploadReportAction,
        signOut: signOutAction
      };
    }
  }, []);

  // SPA Browser History Interception & Native Back Protection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Guarantee initial browser history entry so hitting back never exits/closes the website tab
    try {
      if (!window.history.state || !window.history.state.qcare) {
        window.history.replaceState({ qcare: true, root: true, depth: 0 }, '');
        window.history.pushState({ qcare: true, depth: 1 }, '');
      }
    } catch {}

    const handlePopState = () => {
      // If internal in-app back button triggered this popstate, consume and exit
      if (isInternalNavigationBack()) {
        return;
      }

      // Execute internal store back navigation
      const handled = navigateBackAction(true);
      if (!handled) {
        // If already at root screen (AuthScreen), push trap state back to prevent browser tab closure
        try {
          window.history.pushState({ qcare: true, depth: 1 }, '');
        } catch {}
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Sync hospital from URL (?hospital=... or ?h=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hospParam = urlParams.get('hospital') || urlParams.get('h');
      if (hospParam && hospParam.trim() && hospParam.trim().toUpperCase() !== currentHospital.code) {
        setHospitalByCodeAction(hospParam.trim());
      }
    } catch {
      // Safe catch for query string parsing
    }
  }, [currentHospital.code]);

  // Auto-login from QR Code scan (?session=... or ?token=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const session = urlParams.get('session') || urlParams.get('token') || urlParams.get('patient');
      const payload = urlParams.get('p') || urlParams.get('payload') || undefined;
      if (session) {
        loginAsPatientWithSession(session, payload);
      }
    } catch {
      // Safe catch for query string parsing
    }
  }, [loginAsPatientWithSession]);

  // Auto-dismiss toast notification after 4.5 seconds
  useEffect(() => {
    if (!toastNotification) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toastNotification, dismissToast]);

  // If user is not signed in and no QR session is active, render the dedicated Auth Gate
  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative glass-page-bg">
      {/* Top Clinical Header Bar - Fixed with Rounded Island */}
      <Header />

      {/* Main Dedicated Portal Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-16 sm:pt-17 pb-4">
        {activeRole === 'doctor' && <DoctorPortal />}
        {activeRole === 'patient' && <PatientPortal />}
        {activeRole === 'lab_tech' && <LabPortal />}
      </main>

      {/* Universal Liquid Glass Tooltip Engine */}
      <GlobalTooltip />

      {/* Clean Hospital Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-3 text-xs text-slate-500 print:hidden mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Qcare</span>
            <span className="text-slate-300">·</span>
            <span>{currentHospital.name}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <a href="#support" className="hover:text-slate-800 transition-colors">Support</a>
            <span>·</span>
            <a href="#privacy" className="hover:text-slate-800 transition-colors">Privacy</a>
            <span>·</span>
            <a href="#terms" className="hover:text-slate-800 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
