import React, { useEffect } from 'react';
import { useHospitalStore, setHospitalByCodeAction, navigateBackAction, isInternalNavigationBack } from './store/useHospitalStore';
import { AuthScreen } from './components/auth/AuthScreen';
import { Header } from './components/common/Header';
import { DoctorPortal } from './components/doctor/DoctorPortal';
import { PatientPortal } from './components/patient/PatientPortal';
import { LabPortal } from './components/lab/LabPortal';
import { PharmacyPortal } from './components/pharmacy/PharmacyPortal';
import { GlobalTooltip } from './components/common/GlobalTooltip';
import { SiteFooter } from './components/common/SiteFooter';

export default function App() {
  const {
    currentUser,
    activeRole,
    doctorSidebarExpanded,
    currentHospital,
    toastNotification,
    dismissToast,
    loginAsPatientWithSession
  } = useHospitalStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__hospitalStore = useHospitalStore;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (!window.history.state || !window.history.state.qcare) {
        window.history.replaceState({ qcare: true, root: true, depth: 0 }, '');
        window.history.pushState({ qcare: true, depth: 1 }, '');
      }
    } catch {}

    const handlePopState = () => {
      if (isInternalNavigationBack()) {
        return;
      }

      const handled = navigateBackAction(true);
      if (!handled) {
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hospParam = urlParams.get('hospital') || urlParams.get('h');
      if (hospParam && hospParam.trim() && hospParam.trim().toUpperCase() !== currentHospital.code) {
        setHospitalByCodeAction(hospParam.trim());
      }
    } catch {}
  }, [currentHospital.code]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const session = urlParams.get('session') || urlParams.get('token') || urlParams.get('patient');
      const payload = urlParams.get('p') || urlParams.get('payload') || undefined;
      if (session) {
        loginAsPatientWithSession(session, payload);
      }
    } catch {}
  }, [loginAsPatientWithSession]);

  useEffect(() => {
    if (!toastNotification) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toastNotification, dismissToast]);

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative glass-page-bg">
      {/* Top Clinical Header Bar */}
      <Header />

      {/* Main Dedicated Portal Views — Flush L-Shell Canvas with Generous Breathing Room */}
      <main className={`flex-1 w-full pb-4 ${activeRole === 'doctor' ? 'pt-[64px] px-0' : 'pt-[94px] max-w-7xl mx-auto px-3 sm:px-6'}`}>
        {activeRole === 'doctor' && <DoctorPortal />}
        {activeRole === 'patient' && <PatientPortal />}
        {activeRole === 'lab_tech' && <LabPortal />}
        {activeRole === 'pharmacist' && currentUser && (
          <PharmacyPortal
            pharmacistName={currentUser.name}
            pharmacyName='QCare Pharmacy'
            onBack={() => window.history.back()}
          />
        )}
      </main>

      <GlobalTooltip />

      {/* Deep Brand-Matched Floating Rounded Footer Synced with Sidebar Width */}
      <SiteFooter
        activeRole={activeRole}
        hospital={currentHospital}
        doctorSidebarExpanded={doctorSidebarExpanded}
      />
    </div>
  );
}
