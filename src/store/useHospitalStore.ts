import { useState, useEffect } from 'react';
import {
  Hospital,
  Department,
  DiagnosticTest,
  Counter,
  Patient,
  QueueToken,
  ClinicalReport,
  CurrentUser,
  UserRole,
  Language,
  ClinicalMetric,
  DoctorPortalView,
  DoctorPriority,
  Prescription,
  PharmacyDispenseRecord,
  MedicationItem,
  IssueMedicationInput,
  UpdatePatientVisitPayload
} from '../types';
import {
  DEFAULT_HOSPITAL,
  REGISTERED_HOSPITALS,
  findHospitalByQuery,
  INITIAL_DEPARTMENTS,
  INITIAL_TESTS,
  INITIAL_COUNTERS,
  DEMO_SCENARIO_PATIENT,
  DEMO_SCENARIO_PATIENTS_LIST,
  DEMO_SCENARIO_TOKENS,
  createCanonicalDemoDataset,
  getDepartmentsForHospital,
  getCountersForHospital
} from '../data/mockHospitalData';
import { calculateOptimalQueueRoute } from '../engine/queueRouter';
import { hospitalAudio } from '../engine/chimeAudio';
import { sanitizeString, validatePatientName, validatePatientAge, validatePatientPhone, evaluateMetricFlag } from '../engine/sanitizer';

export interface NavigationHistoryEntry {
  role: UserRole;
  selectedPatientId: string | null;
  currentUser: CurrentUser | null;
  activeBayDepartmentId?: string;
  viewTitle?: string;
}

interface HospitalStoreState {
  currentHospital: Hospital;
  departments: Department[];
  tests: DiagnosticTest[];
  counters: Counter[];
  patients: Patient[];
  queueTokens: QueueToken[];
  clinicalReports: ClinicalReport[];
  prescriptions: Prescription[];
  dispenseRecords: PharmacyDispenseRecord[];
  stateVersion: number;
  updatedAtMs: number;
  currentUser: CurrentUser | null;
  activeRole: UserRole;
  doctorView: DoctorPortalView;
  doctorSidebarExpanded: boolean;
  activeLanguage: Language;
  selectedPatientId: string | null;
  activeBayDepartmentId: string;
  navigationHistory: NavigationHistoryEntry[];
  callingAlert: {
    tokenNumber: string;
    patientName: string;
    roomNo: string;
    counterName: string;
  } | null;
  toastNotification: string | null;
  prefilledWalkinData: {
    name: string;
    age: string;
    gender: 'Male' | 'Female' | 'Other';
    contact: string;
    chiefComplaint: string;
    testIds?: string[];
  } | null;
  isSearchModalOpen: boolean;
}

const STORAGE_KEY = 'qcare_v2_app_store_state';
const SESSION_KEY = 'qcare_auth_session';
const DOCTOR_UI_KEY = 'qcare_doctor_tab_nav';
const VALID_DOCTOR_VIEWS: readonly DoctorPortalView[] = [
  'dashboard',
  'walkin',
  'queue',
  'reports',
  'records'
];

function isValidDoctorView(value: unknown): value is DoctorPortalView {
  return typeof value === 'string' && (VALID_DOCTOR_VIEWS as readonly string[]).includes(value);
}

function persistDoctorTabNav(
  doctorView: DoctorPortalView,
  doctorSidebarExpanded: boolean,
  selectedPatientId: string | null
) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      DOCTOR_UI_KEY,
      JSON.stringify({ doctorView, doctorSidebarExpanded, selectedPatientId })
    );
  } catch {
    // Ignore storage quota errors
  }
}

// Initial default state (ZERO FAKE DATA, ZERO PRE-SEEDED DOCTORS/PATIENTS)
let state: HospitalStoreState = {
  currentHospital: DEFAULT_HOSPITAL,
  departments: INITIAL_DEPARTMENTS,
  tests: INITIAL_TESTS,
  counters: INITIAL_COUNTERS,
  patients: [],
  queueTokens: [],
  clinicalReports: [],
  prescriptions: [],
  dispenseRecords: [],
  stateVersion: 0,
  updatedAtMs: 0,
  currentUser: null,
  activeRole: 'doctor',
  doctorView: 'dashboard',
  doctorSidebarExpanded: false,
  activeLanguage: 'en',
  selectedPatientId: null,
  activeBayDepartmentId: 'dept-pathology',
  navigationHistory: [],
  callingAlert: null,
  toastNotification: null,
  prefilledWalkinData: null,
  isSearchModalOpen: false
};

// Hydrate auth session & persistent store from localStorage + per-tab sessionStorage on startup / refresh
if (typeof window !== 'undefined') {
  try {
    const savedSessionStr = localStorage.getItem(SESSION_KEY);
    const savedStateStr = localStorage.getItem(STORAGE_KEY);
    const savedTabNavStr = sessionStorage.getItem(DOCTOR_UI_KEY);

    let hydratedUser: CurrentUser | null = null;
    let hydratedHosp = DEFAULT_HOSPITAL;
    let hydratedRole: UserRole = 'doctor';
    let hydratedPatientId: string | null = null;
    let hydratedDoctorView: DoctorPortalView | null = null;
    let hydratedSidebarExpanded: boolean | null = null;

    if (savedSessionStr) {
      const sess = JSON.parse(savedSessionStr);
      if (sess && sess.currentUser) {
        hydratedUser = sess.currentUser;
        hydratedHosp = sess.currentHospital || DEFAULT_HOSPITAL;
        hydratedRole = sess.activeRole || 'doctor';
        hydratedPatientId = sess.selectedPatientId || null;
        if (isValidDoctorView(sess.doctorView)) {
          hydratedDoctorView = sess.doctorView;
        }
        if (typeof sess.doctorSidebarExpanded === 'boolean') {
          hydratedSidebarExpanded = sess.doctorSidebarExpanded;
        }
      }
    }

    if (savedTabNavStr) {
      try {
        const tabNav = JSON.parse(savedTabNavStr);
        if (isValidDoctorView(tabNav?.doctorView)) {
          hydratedDoctorView = tabNav.doctorView;
        }
        if (typeof tabNav?.doctorSidebarExpanded === 'boolean') {
          hydratedSidebarExpanded = tabNav.doctorSidebarExpanded;
        }
        if (typeof tabNav?.selectedPatientId === 'string' || tabNav?.selectedPatientId === null) {
          if (tabNav.selectedPatientId) {
            hydratedPatientId = tabNav.selectedPatientId;
          }
        }
      } catch {
        // Ignore corrupt tab navigation JSON
      }
    }

    if (savedStateStr) {
      const parsed = JSON.parse(savedStateStr);
      const effectiveHosp = hydratedHosp || parsed.currentHospital || DEFAULT_HOSPITAL;
      const resolvedDoctorView =
        hydratedDoctorView ||
        (isValidDoctorView(parsed.doctorView) ? parsed.doctorView : 'dashboard');
      const resolvedSidebarExpanded =
        hydratedSidebarExpanded ??
        (typeof parsed.doctorSidebarExpanded === 'boolean' ? parsed.doctorSidebarExpanded : false);

      state = {
        ...state,
        ...parsed,
        prescriptions: Array.isArray(parsed.prescriptions) ? parsed.prescriptions : [],
        dispenseRecords: Array.isArray(parsed.dispenseRecords) ? parsed.dispenseRecords : [],
        stateVersion: typeof parsed.stateVersion === 'number' ? parsed.stateVersion : 0,
        updatedAtMs: typeof parsed.updatedAtMs === 'number' ? parsed.updatedAtMs : 0,
        currentUser: hydratedUser || parsed.currentUser || null,
        currentHospital: effectiveHosp,
        activeRole: hydratedRole || parsed.activeRole || 'doctor',
        doctorView: resolvedDoctorView,
        doctorSidebarExpanded: resolvedSidebarExpanded,
        selectedPatientId: hydratedPatientId || parsed.selectedPatientId || null,
        departments: getDepartmentsForHospital(effectiveHosp.code || effectiveHosp.id),
        tests: INITIAL_TESTS,
        counters: getCountersForHospital(effectiveHosp.code || effectiveHosp.id),
        callingAlert: null,
        toastNotification: null
      };
    } else if (hydratedUser) {
      const effectiveHosp = hydratedHosp || DEFAULT_HOSPITAL;
      state = {
        ...state,
        currentUser: hydratedUser,
        currentHospital: effectiveHosp,
        activeRole: hydratedRole,
        doctorView: hydratedDoctorView || 'dashboard',
        doctorSidebarExpanded: hydratedSidebarExpanded ?? false,
        selectedPatientId: hydratedPatientId,
        departments: getDepartmentsForHospital(effectiveHosp.code || effectiveHosp.id),
        counters: getCountersForHospital(effectiveHosp.code || effectiveHosp.id)
      };
    }
  } catch {
    // Ignore hydration failure
  }
}

const listeners = new Set<() => void>();

function shouldAcceptIncomingSync(incoming: Partial<HospitalStoreState>, current: HospitalStoreState): boolean {
  const incomingVersion = typeof incoming.stateVersion === 'number' ? incoming.stateVersion : 0;
  const currentVersion = current.stateVersion || 0;
  const incomingUpdatedAt = typeof incoming.updatedAtMs === 'number' ? incoming.updatedAtMs : 0;
  const currentUpdatedAt = current.updatedAtMs || 0;

  if (incomingVersion < currentVersion) return false;
  if (incomingVersion === currentVersion && incomingUpdatedAt <= currentUpdatedAt) return false;
  return true;
}

function applySyncedState(incoming: Partial<HospitalStoreState>) {
  if (!shouldAcceptIncomingSync(incoming, state)) return;

  const preserveLocalSession = state.currentUser !== null;
  state = {
    ...state,
    ...incoming,
    prescriptions: Array.isArray(incoming.prescriptions) ? incoming.prescriptions : state.prescriptions,
    dispenseRecords: Array.isArray(incoming.dispenseRecords) ? incoming.dispenseRecords : state.dispenseRecords,
    ...(preserveLocalSession
      ? {
          currentUser: state.currentUser,
          activeRole: state.activeRole,
          doctorView: state.doctorView,
          doctorSidebarExpanded: state.doctorSidebarExpanded,
          activeBayDepartmentId: state.activeBayDepartmentId,
          selectedPatientId: state.selectedPatientId
        }
      : {}),
    callingAlert: incoming.callingAlert !== undefined ? incoming.callingAlert : state.callingAlert
  };
  listeners.forEach(listener => listener());
}

export const applyExternalSyncAction = applySyncedState;

// Real-time Cross-Tab Synchronization Channel
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('qcare_v2_sync_channel');
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'SYNC_STATE' && event.data?.payload) {
        applySyncedState(event.data.payload);
      }
    };
  } catch {
    // Fallback if BroadcastChannel blocked by browser security
  }
}

// Storage event listener fallback for cross-tab sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        applySyncedState(parsed);
      } catch {
        // Safe catch
      }
    }
  });
}

let _emitThrottleTimer: ReturnType<typeof setTimeout> | null = null;

function flushSyncPersistence() {
  const syncPayload = {
    patients: state.patients,
    queueTokens: state.queueTokens,
    clinicalReports: state.clinicalReports,
    prescriptions: state.prescriptions,
    dispenseRecords: state.dispenseRecords,
    counters: state.counters,
    stateVersion: state.stateVersion,
    updatedAtMs: state.updatedAtMs,
    currentUser: state.currentUser,
    currentHospital: state.currentHospital,
    activeRole: state.activeRole,
    doctorView: state.doctorView,
    doctorSidebarExpanded: state.doctorSidebarExpanded,
    activeLanguage: state.activeLanguage,
    selectedPatientId: state.selectedPatientId,
    activeBayDepartmentId: state.activeBayDepartmentId,
    callingAlert: state.callingAlert
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(syncPayload));
      if (state.currentUser) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          currentUser: state.currentUser,
          currentHospital: state.currentHospital,
          activeRole: state.activeRole,
          doctorView: state.doctorView,
          doctorSidebarExpanded: state.doctorSidebarExpanded,
          selectedPatientId: state.selectedPatientId
        }));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Ignore storage quota errors
    }
  }

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'SYNC_STATE', payload: syncPayload });
    } catch {
      // Ignore broadcast errors
    }
  }
}

function emitChange(immediate: boolean = false) {
  // Always notify React subscribers immediately (cheap — just setState)
  listeners.forEach(listener => listener());

  if (immediate) {
    if (_emitThrottleTimer) {
      clearTimeout(_emitThrottleTimer);
      _emitThrottleTimer = null;
    }
    flushSyncPersistence();
    return;
  }

  // Throttle expensive localStorage + BroadcastChannel writes to max once per 300ms
  if (_emitThrottleTimer) return;
  _emitThrottleTimer = setTimeout(() => {
    _emitThrottleTimer = null;
    flushSyncPersistence();
  }, 300);
}

function updateState(updater: (prev: HospitalStoreState) => HospitalStoreState, immediate: boolean = false) {
  const next = updater(state);
  if (next === state) return;
  state = {
    ...next,
    stateVersion: (state.stateVersion || 0) + 1,
    updatedAtMs: Date.now()
  };
  emitChange(immediate);
}

let _atomicSeq = 0;
const RESERVED_DEMO_SERIALS = new Set([9408, 9409, 9410, 9411, 9412]);

function nextAtomicSeq(): number {
  _atomicSeq += 1;
  return _atomicSeq;
}

function generateUniquePatientSerial(existingPatients: Patient[]): number {
  const usedSerials = new Set<number>(RESERVED_DEMO_SERIALS);
  for (const p of existingPatients) {
    const uhidTail = parseInt((p.uhid || '').split('-').pop() || '', 10);
    if (Number.isFinite(uhidTail)) usedSerials.add(uhidTail);
    const qrTail = parseInt((p.qrSessionId || '').split('-').pop() || '', 10);
    if (Number.isFinite(qrTail)) usedSerials.add(qrTail);
  }

  const seed = Math.floor(1000 + Math.random() * 9000);
  if (!usedSerials.has(seed)) return seed;

  for (let offset = 1; offset < 9000; offset++) {
    const candidate = 1000 + ((seed - 1000 + offset) % 9000);
    if (!usedSerials.has(candidate)) return candidate;
  }

  return 10000 + nextAtomicSeq();
}

function generateUniqueOpdToken(existingPatients: Patient[]): string {
  const usedTokens = new Set(existingPatients.map(p => (p.opdTokenNumber || '').toUpperCase()));
  let maxNum = 13;
  for (const p of existingPatients) {
    const parsed = parseInt((p.opdTokenNumber || '').replace(/\D/g, ''), 10);
    if (Number.isFinite(parsed) && parsed > maxNum) {
      maxNum = parsed;
    }
  }
  let nextNum = maxNum + 1;
  while (usedTokens.has(`OPD-${nextNum}`)) {
    nextNum += 1;
  }
  return `OPD-${nextNum}`;
}

/**
 * Mint official atomic bay token
 */
function mintBayTokenNumber(deptCategory: string, count: number): string {
  const prefixMap: Record<string, string> = {
    pathology: 'BLD',
    biochemistry: 'B',
    cardiology: 'E',
    radiology: 'X',
    ultrasound: 'U',
    ophthalmology: 'EYE',
    ent: 'ENT',
    neurology: 'NEU',
    pulmonary: 'PFT',
    orthopedics: 'DEX'
  };
  const prefix = prefixMap[deptCategory] || 'T';
  return `${prefix}-${count + 10}`;
}

function generateUniqueBayToken(deptCategory: string, existingTokens: QueueToken[], deptId: string): string {
  const usedTokenNumbers = new Set(existingTokens.map(t => t.tokenNumber));
  let offset = existingTokens.filter(t => t.departmentId === deptId).length;
  let candidate = mintBayTokenNumber(deptCategory, offset);
  while (usedTokenNumbers.has(candidate)) {
    offset += 1;
    candidate = mintBayTokenNumber(deptCategory, offset);
  }
  return candidate;
}

// -------------------------------------------------------------
// NAVIGATION HISTORY ENGINE (SPA Trapping & Back Flow)
// -------------------------------------------------------------

let isInternalNavBack = false;

export function isInternalNavigationBack(): boolean {
  return isInternalNavBack;
}

export function setInternalNavigationBack(val: boolean) {
  isInternalNavBack = val;
}

export function pushNavigationHistory(title?: string): NavigationHistoryEntry[] {
  const currentEntry: NavigationHistoryEntry = {
    role: state.activeRole,
    selectedPatientId: state.selectedPatientId,
    currentUser: state.currentUser,
    activeBayDepartmentId: state.activeBayDepartmentId,
    viewTitle: title || (
      state.activeRole === 'doctor'
        ? 'Doctor Chamber'
        : state.activeRole === 'lab_tech'
          ? 'Lab Workstation'
          : state.activeRole === 'pharmacist'
            ? 'Pharmacy Workstation'
            : 'Patient Pass'
    )
  };

  const nextHistory = [...(state.navigationHistory || []).slice(-19), currentEntry];

  if (typeof window !== 'undefined' && window.history) {
    try {
      window.history.pushState({ qcare: true, depth: nextHistory.length }, '');
    } catch {
      // Safe catch for sandbox / iframe
    }
  }

  return nextHistory;
}

export function navigateBackAction(fromPopState: boolean = false): boolean {
  // 1. If quick search modal is open, close it first
  if (state.isSearchModalOpen) {
    closeSearchModalAction();
    return true;
  }

  // 2. If we have internal navigation history, pop and restore previous view
  if (state.navigationHistory && state.navigationHistory.length > 0) {
    const nextHistory = [...state.navigationHistory];
    const target = nextHistory.pop()!;

    updateState(prev => ({
      ...prev,
      navigationHistory: nextHistory,
      activeRole: target.role,
      selectedPatientId: target.selectedPatientId,
      currentUser: target.currentUser,
      activeBayDepartmentId: target.activeBayDepartmentId || prev.activeBayDepartmentId,
      callingAlert: null,
      toastNotification: target.viewTitle ? `Returned to ${target.viewTitle}` : null
    }));

    if (!fromPopState && typeof window !== 'undefined' && window.history) {
      isInternalNavBack = true;
      try {
        window.history.back();
      } catch {}
      setTimeout(() => {
        isInternalNavBack = false;
      }, 150);
    }
    return true;
  }

  // 3. If history is empty but user is currently logged in
  if (state.currentUser !== null) {
    if (state.activeRole === 'patient' || state.activeRole === 'lab_tech' || state.activeRole === 'pharmacist') {
      // Return to doctor workstation if in patient, lab, or pharmacy view
      setRoleAction('doctor');
      if (!fromPopState && typeof window !== 'undefined' && window.history) {
        isInternalNavBack = true;
        try {
          window.history.back();
        } catch {}
        setTimeout(() => {
          isInternalNavBack = false;
        }, 150);
      }
      return true;
    }

    // In doctor view with no history: sign out gracefully to login screen
    signOutAction();
    if (!fromPopState && typeof window !== 'undefined' && window.history) {
      isInternalNavBack = true;
      try {
        window.history.back();
      } catch {}
      setTimeout(() => {
        isInternalNavBack = false;
      }, 150);
    }
    return true;
  }

  // 4. Already at AuthScreen with 0 history.
  // Re-push a state so browser doesn't close on further back presses
  if (fromPopState && typeof window !== 'undefined' && window.history) {
    try {
      window.history.pushState({ qcare: true, depth: 1 }, '');
    } catch {}
  }

  return false;
}

// -------------------------------------------------------------
// STORE ACTIONS
// -------------------------------------------------------------

export function setRoleAction(role: UserRole) {
  const nextHistory = role !== state.activeRole ? pushNavigationHistory() : state.navigationHistory;
  updateState(prev => {
    let currentUser: CurrentUser | null = prev.currentUser;
    if (role === 'doctor') {
      currentUser = {
        id: 'doc-verma',
        role: 'doctor',
        name: prev.currentHospital.doctorName || 'Dr. Ananya Sen',
        identifier: prev.currentHospital.doctorRoom || 'Chamber 204',
        designation: prev.currentHospital.doctorDesignation || 'Consultant Physician',
        subtitle: `${prev.currentHospital.name} (${prev.currentHospital.code})`,
        avatar: prev.currentHospital.doctorAvatar || '/doctors/doctor_female_1.jpg',
        gender: prev.currentHospital.doctorGender || 'Female'
      };
    } else if (role === 'patient') {
      const activePat = prev.patients.find(p => p.id === prev.selectedPatientId) || prev.patients[0];
      currentUser = activePat ? {
        id: activePat.id,
        role: 'patient',
        name: activePat.name,
        identifier: activePat.uhid,
        subtitle: activePat.qrSessionId
      } : null;
    } else if (role === 'lab_tech') {
      const activeDept = prev.departments.find(d => d.id === prev.activeBayDepartmentId) || prev.departments[0];
      const counter = prev.counters.find(c => c.departmentId === activeDept.id);
      currentUser = {
        id: counter?.id || 'tech-01',
        role: 'lab_tech',
        name: counter?.technicianName || 'Lab Technician',
        identifier: activeDept.location.room,
        subtitle: activeDept.name,
        assignedBayDepartmentId: activeDept.id
      };
    } else if (role === 'pharmacist') {
      currentUser = prev.currentUser?.role === 'pharmacist'
        ? prev.currentUser
        : {
            id: `pharm-${prev.currentHospital.code.toLowerCase()}`,
            role: 'pharmacist',
            name: 'Duty Pharmacist',
            identifier: `${prev.currentHospital.shortName} Pharmacy`,
            subtitle: `${prev.currentHospital.name} (${prev.currentHospital.code})`
          };
    }
    return {
      ...prev,
      activeRole: role,
      ...(role === 'doctor' ? { doctorView: 'dashboard' as DoctorPortalView } : {}),
      currentUser,
      navigationHistory: nextHistory
    };
  }, true);
  if (role === 'doctor') {
    persistDoctorTabNav(state.doctorView, state.doctorSidebarExpanded, state.selectedPatientId);
  }
}

export function setDoctorViewAction(view: DoctorPortalView) {
  updateState(prev => (prev.doctorView === view ? prev : { ...prev, doctorView: view }));
  persistDoctorTabNav(state.doctorView, state.doctorSidebarExpanded, state.selectedPatientId);
}

export function toggleDoctorSidebarAction() {
  updateState(prev => ({ ...prev, doctorSidebarExpanded: !prev.doctorSidebarExpanded }));
  persistDoctorTabNav(state.doctorView, state.doctorSidebarExpanded, state.selectedPatientId);
}

export function setLanguageAction(lang: Language) {
  updateState(prev => ({ ...prev, activeLanguage: lang }));
}

export function setSelectedPatientIdAction(patientId: string | null) {
  updateState(prev => ({ ...prev, selectedPatientId: patientId }));
  persistDoctorTabNav(state.doctorView, state.doctorSidebarExpanded, state.selectedPatientId);
}

export function setActiveBayDepartmentIdAction(deptId: string) {
  updateState(prev => {
    const dept = prev.departments.find(d => d.id === deptId);
    const counter = prev.counters.find(c => c.departmentId === deptId);
    return {
      ...prev,
      activeBayDepartmentId: deptId,
      currentUser: prev.activeRole === 'lab_tech' ? {
        id: counter?.id || 'tech-01',
        role: 'lab_tech',
        name: counter?.technicianName || 'Lab Technician',
        identifier: dept?.location.room || 'Room 12',
        subtitle: dept?.name,
        assignedBayDepartmentId: deptId
      } : prev.currentUser
    };
  });
}

export function dismissCallingAlertAction() {
  updateState(prev => ({ ...prev, callingAlert: null }));
}

export function showToastAction(message: string) {
  updateState(prev => ({ ...prev, toastNotification: message }));
}

export function dismissToastAction() {
  updateState(prev => ({ ...prev, toastNotification: null }));
}

/**
 * Register a new walk-in patient
 */
export function registerPatientAction(data: {
  name: string;
  age: number | string;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  chiefComplaint?: string;
  priority?: 'standard' | 'emergency';
}): Patient {
  const nameVal = validatePatientName(data.name);
  if (!nameVal.isValid) throw new Error(nameVal.error || 'Invalid patient name');

  const ageVal = validatePatientAge(data.age);
  if (!ageVal.isValid) throw new Error(ageVal.error || 'Invalid patient age');

  const phoneVal = validatePatientPhone(data.contact);
  const cleanPhone = phoneVal.isValid ? phoneVal.value : data.contact;

  const serial = generateUniquePatientSerial(state.patients);
  const opdTokenNumber = generateUniqueOpdToken(state.patients);
  const now = new Date();
  const nowMs = now.getTime();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isSenior = ageVal.value >= 60;
  const calculatedPriority = data.priority === 'emergency' ? 'emergency' : (isSenior ? 'senior' : 'standard');

  const newPatient: Patient = {
    id: `pat-${nowMs}-${nextAtomicSeq()}-${serial}`,
    hospitalId: state.currentHospital.id,
    hospitalCode: state.currentHospital.code,
    uhid: `QC-2026-${serial}`,
    qrSessionId: `QC-${serial}`,
    name: nameVal.value,
    age: ageVal.value,
    gender: data.gender,
    contact: cleanPhone,
    priority: calculatedPriority,
    doctorPriority: data.priority === 'emergency' ? 'urgent' : 'normal',
    prescribedDoctorId: state.currentUser?.id || 'doc-on-duty',
    prescribedDoctorName: state.currentUser?.name || state.currentHospital.doctorName || 'Attending Physician',
    prescribedDoctorRoom: state.currentUser?.identifier || state.currentHospital.doctorRoom || 'Room 101',
    chiefComplaint: sanitizeString(data.chiefComplaint || 'Walk-in consultation'),
    symptoms: sanitizeString(data.chiefComplaint || 'Walk-in consultation'),
    prescribedTests: [],
    prescribedTestItems: [],
    completedTests: [],
    activeTokenIds: {},
    status: 'registered',
    assignedSmartRoute: [],
    registrationTime: timeStr,
    registeredAtMs: nowMs,
    opdTokenNumber,
    doctorReviewStatus: 'awaiting_prescription'
  };

  updateState(prev => ({
    ...prev,
    patients: [newPatient, ...prev.patients],
    selectedPatientId: newPatient.id,
    toastNotification: `Patient registered: ${newPatient.name} (${newPatient.opdTokenNumber})`
  }), true);

  return newPatient;
}

function reconcilePatientVisitInternal(
  prev: HospitalStoreState,
  patientId: string,
  updates: UpdatePatientVisitPayload
): { nextState: HospitalStoreState; updatedPatient: Patient | null } {
  const patientIndex = prev.patients.findIndex(p => p.id === patientId);
  if (patientIndex === -1) return { nextState: prev, updatedPatient: null };

  const patient = prev.patients[patientIndex];

  let nextName = patient.name;
  if (updates.name !== undefined) {
    const nameVal = validatePatientName(updates.name);
    if (!nameVal.isValid) throw new Error(nameVal.error || 'Invalid patient name');
    nextName = nameVal.value;
  }

  let nextAge = patient.age;
  if (updates.age !== undefined) {
    const ageVal = validatePatientAge(updates.age);
    if (!ageVal.isValid) throw new Error(ageVal.error || 'Invalid patient age');
    nextAge = ageVal.value;
  }

  let nextContact = patient.contact;
  if (updates.contact !== undefined) {
    const phoneVal = validatePatientPhone(updates.contact);
    nextContact = phoneVal.isValid ? phoneVal.value : updates.contact;
  }

  const nextGender = updates.gender ?? patient.gender;
  const nextPriority: Patient['priority'] = updates.priority
    ? (updates.priority === 'emergency' ? 'emergency' : (nextAge >= 60 ? 'senior' : 'standard'))
    : (updates.age !== undefined ? (patient.priority === 'emergency' ? 'emergency' : (nextAge >= 60 ? 'senior' : 'standard')) : patient.priority);
  const nextDoctorPriority: DoctorPriority = updates.doctorPriority ?? (updates.priority === 'emergency' ? 'urgent' : (patient.doctorPriority || 'normal'));
  const nextComplaint = updates.chiefComplaint !== undefined ? sanitizeString(updates.chiefComplaint) : patient.chiefComplaint;
  const nextNotes = updates.notes !== undefined ? sanitizeString(updates.notes) : patient.notes;

  const existingCompleted = patient.completedTests || [];
  const completedSet = new Set(existingCompleted);
  const finalPrescribedTests = Array.from(new Set([...existingCompleted, ...updates.testIds]));
  const finalSet = new Set(finalPrescribedTests);

  const cancelledTokenNumbers = new Set<string>();
  const updatedTokens = prev.queueTokens.map(t => {
    if (t.patientId !== patientId) return t;
    if (!completedSet.has(t.testId) && !finalSet.has(t.testId) && t.status !== 'completed' && t.status !== 'cancelled') {
      cancelledTokenNumbers.add(t.tokenNumber);
      return { ...t, status: 'cancelled' as const };
    }
    if (finalSet.has(t.testId) && t.status !== 'cancelled') {
      return {
        ...t,
        patientName: nextName,
        patientAge: nextAge,
        patientGender: nextGender,
        priority: nextPriority,
        doctorPriority: nextDoctorPriority
      };
    }
    return t;
  });

  const activeTokenIdsMap: Record<string, string> = {};
  const newTokens: QueueToken[] = [];
  const accumulatedTokens = [...updatedTokens];
  const nowMs = Date.now();
  const issuedTimeStr = new Date(nowMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  for (const tId of finalPrescribedTests) {
    const existingTok = accumulatedTokens.find(
      t => t.patientId === patientId && t.testId === tId && t.status !== 'cancelled'
    );
    if (existingTok) {
      activeTokenIdsMap[tId] = existingTok.id;
      continue;
    }
    if (completedSet.has(tId)) {
      if (patient.activeTokenIds?.[tId]) {
        activeTokenIdsMap[tId] = patient.activeTokenIds[tId];
      }
      continue;
    }

    const test = prev.tests.find(t => t.id === tId);
    const dept = prev.departments.find(d => d.id === test?.departmentId);
    const existingInDept = accumulatedTokens.filter(
      t => t.departmentId === dept?.id && t.status !== 'cancelled' && t.status !== 'completed'
    ).length;
    const bayTokenNum = generateUniqueBayToken(dept?.category || 'pathology', accumulatedTokens, dept?.id || '');
    const activeDeptCounters = prev.counters.filter(c => c.departmentId === dept?.id && c.status === 'active');
    const counter = activeDeptCounters[0] || prev.counters.find(c => c.departmentId === dept?.id);

    const tokenObj: QueueToken = {
      id: `tok-${nowMs}-${nextAtomicSeq()}-${tId}`,
      hospitalId: prev.currentHospital.id,
      hospitalCode: prev.currentHospital.code,
      tokenNumber: bayTokenNum,
      patientId: patient.id,
      patientName: nextName,
      patientUhid: patient.uhid,
      patientAge: nextAge,
      patientGender: nextGender,
      testId: tId,
      testName: test?.name || 'Diagnostic Test',
      departmentId: dept?.id || '',
      counterId: counter?.id,
      roomNo: dept?.location.room,
      priority: nextPriority,
      doctorPriority: nextDoctorPriority,
      status: 'waiting',
      issuedAt: issuedTimeStr,
      issuedAtMs: nowMs,
      queuePosition: existingInDept + 1,
      estimatedWaitMinutes: (existingInDept + 1) * (counter?.averageServiceMinutes || 6)
    };

    newTokens.push(tokenObj);
    accumulatedTokens.push(tokenObj);
    activeTokenIdsMap[tId] = tokenObj.id;
  }

  const nextQueueTokens = [...newTokens, ...updatedTokens];
  const canKeepLock =
    Boolean(patient.currentLockedDestinationTestId) &&
    finalSet.has(patient.currentLockedDestinationTestId!) &&
    !completedSet.has(patient.currentLockedDestinationTestId!);

  const tempPatientForRoute: Patient = {
    ...patient,
    name: nextName,
    age: nextAge,
    gender: nextGender,
    contact: nextContact,
    priority: nextPriority,
    doctorPriority: nextDoctorPriority,
    chiefComplaint: nextComplaint,
    symptoms: nextComplaint,
    prescribedTests: finalPrescribedTests,
    completedTests: existingCompleted,
    currentLockedDestinationTestId: canKeepLock ? patient.currentLockedDestinationTestId : undefined,
    notes: nextNotes
  };

  const plan = calculateOptimalQueueRoute(
    tempPatientForRoute,
    prev.tests,
    prev.departments,
    nextQueueTokens,
    prev.counters
  );

  const smartOrderedIds = plan.smartRouteSteps.map(s => s.testId);
  const firstLockedTestId = canKeepLock
    ? patient.currentLockedDestinationTestId
    : (plan.recommendedNextTestId || smartOrderedIds.find(id => !completedSet.has(id)));

  const prescribedTestItems = finalPrescribedTests.map(tId => {
    const test = prev.tests.find(t => t.id === tId);
    const existingItem = (patient.prescribedTestItems || []).find(i => i.testId === tId);
    if (completedSet.has(tId)) {
      return existingItem
        ? { ...existingItem, status: 'completed' as const }
        : {
            testId: tId,
            testName: test?.name || 'Test',
            technicalName: test?.technicalName,
            priority: nextDoctorPriority,
            status: 'completed' as const,
            preparationInstructions: test?.preparationNotes
          };
    }
    return {
      testId: tId,
      testName: test?.name || existingItem?.testName || 'Test',
      technicalName: test?.technicalName || existingItem?.technicalName,
      priority: nextDoctorPriority,
      status: existingItem?.status === 'in_progress' ? ('in_progress' as const) : ('waiting' as const),
      preparationInstructions: test?.preparationNotes || existingItem?.preparationInstructions
    };
  });

  const pendingTestsRemaining = finalPrescribedTests.some(id => !completedSet.has(id));
  const nextStatus: Patient['status'] = finalPrescribedTests.length === 0
    ? (patient.status === 'discharged' ? 'discharged' : 'registered')
    : (pendingTestsRemaining ? 'in_transit' : (patient.status === 'discharged' ? 'discharged' : 'all_completed'));
  const nextDocStatus: Patient['doctorReviewStatus'] = finalPrescribedTests.length === 0
    ? (patient.doctorReviewStatus === 'completed' ? 'completed' : 'awaiting_prescription')
    : (pendingTestsRemaining ? 'awaiting_lab_reports' : (patient.doctorReviewStatus === 'completed' ? 'completed' : 'reports_ready'));

  const fullyUpdatedPatient: Patient = {
    ...tempPatientForRoute,
    assignedSmartRoute: smartOrderedIds,
    currentLockedDestinationTestId: firstLockedTestId,
    activeTokenIds: activeTokenIdsMap,
    prescribedTestItems,
    status: nextStatus,
    doctorReviewStatus: nextDocStatus
  };

  const nextPatients = [...prev.patients];
  nextPatients[patientIndex] = fullyUpdatedPatient;

  const firstPendingStep = plan.smartRouteSteps.find(s => s.status !== 'completed');
  const nextCallingAlert =
    prev.callingAlert && cancelledTokenNumbers.has(prev.callingAlert.tokenNumber)
      ? null
      : prev.callingAlert;

  return {
    updatedPatient: fullyUpdatedPatient,
    nextState: {
      ...prev,
      patients: nextPatients,
      queueTokens: nextQueueTokens,
      callingAlert: nextCallingAlert,
      toastNotification: firstPendingStep
        ? `Investigations updated for ${fullyUpdatedPatient.name}. Next stop: ${firstPendingStep.location.room} (${firstPendingStep.testName})`
        : `Visit details updated for ${fullyUpdatedPatient.name}`
    }
  };
}

/**
 * In-place patient visit & investigation reconciliation (prevents duplicate patient records on edit)
 */
export function updatePatientVisitAndTestsAction(
  patientId: string,
  updates: UpdatePatientVisitPayload
): Patient | null {
  let resultPatient: Patient | null = null;
  updateState(prev => {
    const res = reconcilePatientVisitInternal(prev, patientId, updates);
    resultPatient = res.updatedPatient;
    return res.nextState;
  }, true);
  return resultPatient;
}

export const reconcilePatientVisitAction = updatePatientVisitAndTestsAction;

/**
 * Doctor prescribes tests:
 * 1. Computes optimal lowest-wait route
 * 2. Mints atomic bay tokens for each prescribed test (idempotent/reconciling if already prescribed)
 * 3. Locks first destination (Stability Lock)
 * 4. Updates patient status to in_transit
 */
export function prescribeTestsAction(
  patientId: string,
  testIds: string[],
  doctorPriority: 'normal' | 'priority' | 'urgent' = 'normal',
  notes?: string
) {
  const target = state.patients.find(p => p.id === patientId);
  if (!target) return;
  if (testIds.length === 0 && target.prescribedTests.length === 0) return;

  updateState(prev => {
    return reconcilePatientVisitInternal(prev, patientId, {
      testIds,
      doctorPriority,
      notes
    }).nextState;
  }, true);
}

/**
 * Technician calls patient token:
 * 1. Plays 880Hz -> 440Hz dual chime
 * 2. Speaks dual-lingual English + Hindi broadcast
 * 3. Triggers pulsing green calling banner
 */
export function callPatientAction(tokenId: string) {
  const token = state.queueTokens.find(t => t.id === tokenId);
  if (!token) return;

  const dept = state.departments.find(d => d.id === token.departmentId);
  const counter = state.counters.find(c => c.id === token.counterId);
  const roomNo = token.roomNo || dept?.location.room || 'Room 12';
  const counterName = counter?.name || 'Diagnostic Station';

  hospitalAudio.announceToken(token.tokenNumber, counterName, roomNo, token.patientName);

  updateState(prev => {
    const nowMs = Date.now();
    const updatedTokens = prev.queueTokens.map(t =>
      t.id === tokenId ? { ...t, status: 'called' as const, calledAt: new Date(nowMs).toLocaleTimeString(), calledAtMs: nowMs } : t
    );

    return {
      ...prev,
      queueTokens: updatedTokens,
      callingAlert: {
        tokenNumber: token.tokenNumber,
        patientName: token.patientName || 'Patient',
        roomNo,
        counterName
      },
      toastNotification: `📢 Calling Token ${token.tokenNumber} (${token.patientName}) to ${roomNo}`
    };
  }, true);
}

/**
 * Put patient on hold (no show)
 */
export function putTokenOnHoldAction(tokenId: string) {
  updateState(prev => ({
    ...prev,
    queueTokens: prev.queueTokens.map(t =>
      t.id === tokenId ? { ...t, status: 'on_hold' as const } : t
    ),
    toastNotification: `Token put on-hold.`
  }));
}

/**
 * Recall token from hold
 */
export function recallTokenFromHoldAction(tokenId: string) {
  updateState(prev => ({
    ...prev,
    queueTokens: prev.queueTokens.map(t =>
      t.id === tokenId ? { ...t, status: 'waiting' as const } : t
    )
  }));
  callPatientAction(tokenId);
}

/**
 * Lab Technician completes test and uploads clinical report:
 * 1. Validates metric values against reference ranges and sets flags
 * 2. Unlocks stability lock
 * 3. Dynamically calculates next lowest-wait route for remaining tests
 * 4. If all tests done, marks patient reports_ready
 */
export function completeTestAndUploadReportAction(
  tokenId: string,
  metricValues: Record<string, string>,
  technicianNotes: string = ''
) {
  const token = state.queueTokens.find(t => t.id === tokenId);
  if (!token) return;

  const test = state.tests.find(t => t.id === token.testId);
  const dept = state.departments.find(d => d.id === token.departmentId);
  const counter = state.counters.find(c => c.id === token.counterId);

  // Compute metrics with flags
  const metrics: ClinicalMetric[] = (test?.metricTemplates || []).map(tmpl => {
    const rawVal = metricValues[tmpl.label] || tmpl.defaultValue || '0';
    const flag = evaluateMetricFlag(rawVal, tmpl.normalRange);
    return {
      label: tmpl.label,
      value: rawVal,
      unit: tmpl.unit,
      normalRange: tmpl.normalRange,
      flag
    };
  });

  const isCritical = metrics.some(m => m.flag === 'critical');
  const now = new Date();
  const nowMs = now.getTime();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const baselineMins = test?.averageDurationMinutes || counter?.averageServiceMinutes || 6;
  const elapsedRawMins = token.calledAtMs
    ? (nowMs - token.calledAtMs) / 60000
    : token.issuedAtMs
      ? (nowMs - token.issuedAtMs) / 60000
      : NaN;
  const observedTurnaroundMins =
    Number.isFinite(elapsedRawMins) && elapsedRawMins >= 1.5 && elapsedRawMins <= 60
      ? Number(elapsedRawMins.toFixed(1))
      : baselineMins;

  // Explicitly record the authenticated lab technician's identity for clinical audit
  const loggedInTech = (state.currentUser?.role === 'lab_tech' && state.currentUser.name)
    ? state.currentUser.name
    : (counter?.technicianName || 'Technician');

  const newReport: ClinicalReport = {
    id: `rep-${nowMs}-${nextAtomicSeq()}`,
    hospitalId: state.currentHospital.id,
    hospitalCode: state.currentHospital.code,
    testId: token.testId,
    testName: test?.name || 'Diagnostic Investigation',
    technicalName: test?.technicalName,
    patientId: token.patientId,
    patientUhid: token.patientUhid || '',
    patientName: token.patientName || '',
    technicianName: loggedInTech,
    counterId: counter?.id || '',
    roomNo: token.roomNo || dept?.location.room || 'Room 12',
    timestamp: timeStr,
    createdAtMs: nowMs,
    actualTurnaroundMinutes: observedTurnaroundMins,
    status: 'uploaded',
    summary: `${test?.name} completed successfully. Findings documented.`,
    metrics,
    technicianNotes: sanitizeString(technicianNotes),
    isCritical
  };

  updateState(prev => {
    const updatedTokens = prev.queueTokens.map(t =>
      t.id === tokenId ? { ...t, status: 'completed' as const, completedAt: timeStr, completedAtMs: nowMs } : t
    );

    const patientIndex = prev.patients.findIndex(p => p.id === token.patientId);
    let updatedPatients = [...prev.patients];

    if (patientIndex !== -1) {
      const patient = prev.patients[patientIndex];
      const completedTests = Array.from(new Set([...(patient.completedTests || []), token.testId]));

      const allDone = patient.prescribedTests.length > 0 &&
        patient.prescribedTests.every(tId => completedTests.includes(tId));

      // Calculate new dynamic lowest-wait route for remaining tests!
      const tempPatient: Patient = {
        ...patient,
        completedTests,
        currentLockedDestinationTestId: undefined // Unlock stability lock
      };

      const newPlan = calculateOptimalQueueRoute(
        tempPatient,
        prev.tests,
        prev.departments,
        updatedTokens,
        prev.counters
      );

      const nextSmartRoute = newPlan.smartRouteSteps.map(s => s.testId);
      const nextLockedDestination = newPlan.recommendedNextTestId;

      const updatedPrescribedItems = (patient.prescribedTestItems || []).map(item =>
        item.testId === token.testId
          ? { ...item, status: 'completed' as const, completedAt: timeStr, completedByStaff: loggedInTech }
          : item
      );

      updatedPatients[patientIndex] = {
        ...patient,
        completedTests,
        assignedSmartRoute: nextSmartRoute,
        currentLockedDestinationTestId: nextLockedDestination,
        status: allDone ? 'all_completed' : 'in_transit',
        doctorReviewStatus: allDone ? 'reports_ready' : 'awaiting_lab_reports',
        prescribedTestItems: updatedPrescribedItems
      };
    }

    // Increment counter served count and dynamically adapt averageServiceMinutes via bounded EMA
    const updatedCounters = prev.counters.map(c => {
      if (c.id !== counter?.id) return c;
      const oldAvg = c.averageServiceMinutes || baselineMins;
      const blended = Math.max(2, Math.min(45, Number((0.8 * oldAvg + 0.2 * observedTurnaroundMins).toFixed(1))));
      return {
        ...c,
        servedCountToday: c.servedCountToday + 1,
        averageServiceMinutes: blended
      };
    });

    return {
      ...prev,
      queueTokens: updatedTokens,
      clinicalReports: [newReport, ...prev.clinicalReports],
      patients: updatedPatients,
      counters: updatedCounters,
      callingAlert: null,
      toastNotification: `✅ Test completed: ${test?.name} for ${token.patientName}. Next lowest-wait route updated!`
    };
  }, true);
}

/**
 * Manual next test switcher / override
 */
export function manuallySwitchNextTestAction(patientId: string, newNextTestId: string) {
  updateState(prev => {
    const patIdx = prev.patients.findIndex(p => p.id === patientId);
    if (patIdx === -1) return prev;

    const patient = prev.patients[patIdx];
    const remaining = patient.prescribedTests.filter(t => !patient.completedTests.includes(t));
    if (!remaining.includes(newNextTestId)) return prev;

    const tempPatient: Patient = {
      ...patient,
      currentLockedDestinationTestId: newNextTestId
    };

    const newPlan = calculateOptimalQueueRoute(
      tempPatient,
      prev.tests,
      prev.departments,
      prev.queueTokens,
      prev.counters
    );

    const newSmartRoute = newPlan.smartRouteSteps.map(s => s.testId);

    const updatedPatients = [...prev.patients];
    updatedPatients[patIdx] = {
      ...patient,
      currentLockedDestinationTestId: newNextTestId,
      assignedSmartRoute: newSmartRoute
    };

    const test = prev.tests.find(t => t.id === newNextTestId);
    return {
      ...prev,
      patients: updatedPatients,
      toastNotification: `Next destination switched to ${test?.name || newNextTestId}.`
    };
  });
}

/**
 * Mark a test as already completed (holds external report or sampled earlier).
 * 1. Appends testId to patient.completedTests
 * 2. Marks any matching queue token as completed
 * 3. Adds an uploaded ClinicalReport acknowledging prior completion
 * 4. Unlocks stability lock and dynamically reroutes remaining tests
 * 5. Updates patient and queue state
 */
export function markTestAlreadyDoneAction(
  patientId: string,
  testId: string,
  notes: string = 'Patient already had test done earlier / holds external report.'
) {
  updateState(prev => {
    const patIdx = prev.patients.findIndex(p => p.id === patientId);
    if (patIdx === -1) return prev;

    const patient = prev.patients[patIdx];
    if (patient.completedTests.includes(testId)) return prev;

    const test = prev.tests.find(t => t.id === testId);
    const dept = prev.departments.find(d => d.id === test?.departmentId);
    const completedTests = Array.from(new Set([...(patient.completedTests || []), testId]));
    const now = new Date();
    const nowMs = now.getTime();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Mark corresponding token as completed
    const updatedTokens = prev.queueTokens.map(t =>
      t.patientId === patientId && t.testId === testId && t.status !== 'cancelled'
        ? { ...t, status: 'completed' as const, completedAt: timeStr, completedAtMs: nowMs }
        : t
    );

    const allDone = patient.prescribedTests.length > 0 &&
      patient.prescribedTests.every(tId => completedTests.includes(tId));

    // Dynamic reroute without stability lock
    const tempPatient: Patient = {
      ...patient,
      completedTests,
      currentLockedDestinationTestId: undefined
    };

    const newPlan = calculateOptimalQueueRoute(
      tempPatient,
      prev.tests,
      prev.departments,
      updatedTokens,
      prev.counters
    );

    const nextSmartRoute = newPlan.smartRouteSteps.map(s => s.testId);
    const nextLockedDestination = newPlan.recommendedNextTestId;

    const updatedPrescribedItems = (patient.prescribedTestItems || []).map(item =>
      item.testId === testId
        ? { ...item, status: 'completed' as const, completedAt: timeStr }
        : item
    );

    const updatedPatient: Patient = {
      ...patient,
      completedTests,
      assignedSmartRoute: nextSmartRoute,
      currentLockedDestinationTestId: nextLockedDestination,
      status: allDone ? 'all_completed' : 'in_transit',
      doctorReviewStatus: allDone ? 'reports_ready' : 'awaiting_lab_reports',
      prescribedTestItems: updatedPrescribedItems
    };

    const nextPatients = [...prev.patients];
    nextPatients[patIdx] = updatedPatient;

    // Create clinical report entry acknowledging prior/external completion
    const newReport: ClinicalReport = {
      id: `rep-ext-${nowMs}-${nextAtomicSeq()}-${testId}`,
      hospitalId: prev.currentHospital.id,
      hospitalCode: prev.currentHospital.code,
      testId,
      testName: test?.name || 'Diagnostic Investigation',
      technicalName: test?.technicalName,
      patientId: patient.id,
      patientUhid: patient.uhid,
      patientName: patient.name,
      technicianName: 'Verified Earlier / External',
      counterId: 'external',
      roomNo: dept?.location.room || 'Room 12',
      timestamp: timeStr,
      createdAtMs: nowMs,
      status: 'uploaded',
      summary: `${test?.name || 'Test'} verified as completed earlier. Prior clinical findings acknowledged.`,
      metrics: (test?.metricTemplates || []).map(tmpl => ({
        label: tmpl.label,
        value: tmpl.defaultValue || 'Normal',
        unit: tmpl.unit,
        normalRange: tmpl.normalRange,
        flag: 'normal' as const
      })),
      technicianNotes: sanitizeString(notes),
      isCritical: false
    };

    return {
      ...prev,
      patients: nextPatients,
      queueTokens: updatedTokens,
      clinicalReports: [newReport, ...prev.clinicalReports],
      toastNotification: `✓ ${test?.name || 'Investigation'} marked as already done. Next route updated!`
    };
  }, true);
}

/**
 * Technician skips current token in queue:
 * Moves this token to the back of the waiting queue for this department,
 * allowing the next waiting patient to be served immediately.
 */
export function skipTokenAction(tokenId: string) {
  updateState(prev => {
    const token = prev.queueTokens.find(t => t.id === tokenId);
    if (!token) return prev;

    const deptTokens = prev.queueTokens.filter(
      t => t.departmentId === token.departmentId && (t.status === 'waiting' || t.status === 'called')
    );

    if (deptTokens.length <= 1) {
      return {
        ...prev,
        queueTokens: prev.queueTokens.map(t => t.id === tokenId ? { ...t, status: 'waiting' as const } : t),
        callingAlert: prev.callingAlert?.tokenNumber === token.tokenNumber ? null : prev.callingAlert,
        toastNotification: `Token ${token.tokenNumber} is the only token in queue.`
      };
    }

    const otherTokens = prev.queueTokens.filter(t => t.id !== tokenId);
    const updatedToken: QueueToken = {
      ...token,
      status: 'waiting',
      queuePosition: deptTokens.length
    };

    return {
      ...prev,
      queueTokens: [...otherTokens, updatedToken],
      callingAlert: prev.callingAlert?.tokenNumber === token.tokenNumber ? null : prev.callingAlert,
      toastNotification: `⏭️ Skipped token ${token.tokenNumber}. Serving next in queue.`
    };
  });
}

/**
 * Doctor verifies a single lab report without necessarily discharging the entire OPD visit yet
 */
export function verifyLabReportAction(reportId: string, doctorNotes: string = '') {
  updateState(prev => {
    const target = prev.clinicalReports.find(r => r.id === reportId);
    if (!target) return prev;

    const cleanNotes = doctorNotes ? sanitizeString(doctorNotes) : target.doctorNotes;
    const signature = prev.currentUser?.name || prev.currentHospital.doctorName || 'Attending Physician';

    const updatedReports = prev.clinicalReports.map(r =>
      r.id === reportId
        ? {
            ...r,
            status: 'verified_by_doctor' as const,
            doctorNotes: cleanNotes,
            doctorSignature: signature
          }
        : r
    );

    return {
      ...prev,
      clinicalReports: updatedReports,
      toastNotification: `Report verified: ${target.testName} (${target.patientName})`
    };
  }, true);
}

/**
 * Doctor verifies reports and discharges patient (duplicate sign-off guarded)
 */
export function verifyAndDischargePatientAction(patientId: string, doctorConclusionNotes: string = '') {
  updateState(prev => {
    const patIdx = prev.patients.findIndex(p => p.id === patientId);
    if (patIdx === -1) return prev;

    const patient = prev.patients[patIdx];
    if (patient.status === 'discharged' && patient.doctorReviewStatus === 'completed') {
      return prev;
    }

    const signature = prev.currentUser?.name || prev.currentHospital.doctorName || 'Attending Physician';
    const updatedPatients = [...prev.patients];
    updatedPatients[patIdx] = {
      ...patient,
      status: 'discharged',
      doctorReviewStatus: 'completed',
      notes: sanitizeString(doctorConclusionNotes)
    };

    const updatedReports = prev.clinicalReports.map(r =>
      r.patientId === patientId
        ? {
            ...r,
            status: 'verified_by_doctor' as const,
            doctorNotes: sanitizeString(doctorConclusionNotes),
            doctorSignature: r.doctorSignature || signature
          }
        : r
    );

    return {
      ...prev,
      patients: updatedPatients,
      clinicalReports: updatedReports,
      toastNotification: `Patient ${patient.name} (${patient.opdTokenNumber}) verified and discharged!`
    };
  }, true);
}

/**
 * Load Demo Scenario (Rameshwar Sharma) — non-destructive for existing dynamic patients
 */
export function loadDemoScenarioAction() {
  const nextHistory = pushNavigationHistory('Previous View');
  updateState(prev => {
    const demoPatIds = new Set(DEMO_SCENARIO_PATIENTS_LIST.map(p => p.id));
    const demoTokIds = new Set(DEMO_SCENARIO_TOKENS.map(t => t.id));
    const dynamicPatients = prev.patients.filter(p => !demoPatIds.has(p.id));
    const dynamicTokens = prev.queueTokens.filter(t => !demoTokIds.has(t.id));

    const scopedDemoPatients = DEMO_SCENARIO_PATIENTS_LIST.map(p => ({
      ...p,
      hospitalId: prev.currentHospital.id,
      hospitalCode: prev.currentHospital.code
    }));
    const scopedDemoTokens = DEMO_SCENARIO_TOKENS.map(t => ({
      ...t,
      hospitalId: prev.currentHospital.id,
      hospitalCode: prev.currentHospital.code
    }));

    return {
      ...prev,
      navigationHistory: nextHistory,
      patients: [...scopedDemoPatients, ...dynamicPatients],
      queueTokens: [...scopedDemoTokens, ...dynamicTokens],
      selectedPatientId: 'pat-rameshwar',
      activeRole: 'patient',
      currentUser: {
        id: 'pat-rameshwar',
        role: 'patient',
        name: DEMO_SCENARIO_PATIENT.name,
        identifier: DEMO_SCENARIO_PATIENT.uhid,
        subtitle: DEMO_SCENARIO_PATIENT.qrSessionId
      },
      toastNotification: '🎉 Demo Scenario Loaded: Rameshwar Sharma (QC-9411) active on Mobile Boarding Pass!'
    };
  }, true);
}

/**
 * Load Doctor OPD Demo Queue via canonical dataset factory (non-destructive for dynamic patients)
 */
export function loadDoctorDemoPatientsAction() {
  updateState(prev => {
    const dataset = createCanonicalDemoDataset(prev.currentHospital, prev.currentUser);
    const demoPatIds = new Set(dataset.patients.map(p => p.id));
    const demoTokIds = new Set(dataset.queueTokens.map(t => t.id));
    const demoRepIds = new Set(dataset.clinicalReports.map(r => r.id));
    const demoRxIds = new Set(dataset.prescriptions.map(rx => rx.id));

    const dynamicPatients = prev.patients.filter(p => !demoPatIds.has(p.id));
    const dynamicTokens = prev.queueTokens.filter(t => !demoTokIds.has(t.id));
    const dynamicReports = prev.clinicalReports.filter(r => !demoRepIds.has(r.id));
    const dynamicPrescriptions = prev.prescriptions.filter(rx => !demoRxIds.has(rx.id));

    const scopedDemoPatients = dataset.patients.map(p => ({
      ...p,
      hospitalId: prev.currentHospital.id,
      hospitalCode: prev.currentHospital.code
    }));
    const scopedDemoTokens = dataset.queueTokens.map(t => ({
      ...t,
      hospitalId: prev.currentHospital.id,
      hospitalCode: prev.currentHospital.code
    }));
    const scopedDemoReports = dataset.clinicalReports.map(r => ({
      ...r,
      hospitalId: prev.currentHospital.id,
      hospitalCode: prev.currentHospital.code
    }));
    const scopedDemoPrescriptions = dataset.prescriptions.map(rx => ({
      ...rx,
      hospitalId: prev.currentHospital.id,
      hospitalCode: prev.currentHospital.code
    }));

    return {
      ...prev,
      patients: [...scopedDemoPatients, ...dynamicPatients],
      queueTokens: [...scopedDemoTokens, ...dynamicTokens],
      clinicalReports: [...scopedDemoReports, ...dynamicReports],
      prescriptions: [...scopedDemoPrescriptions, ...dynamicPrescriptions],
      selectedPatientId: scopedDemoPatients[0]?.id || null,
      toastNotification: `Sample OPD queue loaded with ${scopedDemoPatients.length} canonical clinical cases.`
    };
  }, true);
}

/**
 * Reset to pristine clean slate
 */
export function resetToCleanSlateAction() {
  updateState(prev => ({
    ...prev,
    patients: [],
    queueTokens: [],
    clinicalReports: [],
    prescriptions: [],
    dispenseRecords: [],
    selectedPatientId: null,
    activeRole: 'doctor',
    navigationHistory: [],
    callingAlert: null,
    currentUser: {
      id: 'doc-verma',
      role: 'doctor',
      name: 'Dr. Rajesh Verma',
      identifier: 'Room 104',
      subtitle: 'Cardiologist & General Physician'
    },
    toastNotification: 'Clean slate restored. Zero walk-ins.'
  }), true);
}

/**
 * Resolve and switch hospital tenant by hospital ID
 */
export function setHospitalByIdAction(hospitalId: string) {
  const found = findHospitalByQuery(hospitalId) || REGISTERED_HOSPITALS.find(
    h => h.id === hospitalId || h.code.toUpperCase() === hospitalId.toUpperCase()
  );
  if (found) {
    updateState(prev => {
      let updatedUser = prev.currentUser;
      if (prev.currentUser && prev.currentUser.role === 'doctor') {
        const resolvedGender = found.doctorGender || 'Female';
        const resolvedAvatar = found.doctorAvatar || resolveIndianDoctorAvatar(found.doctorName, resolvedGender);
        updatedUser = {
          ...prev.currentUser,
          name: found.doctorName || 'Attending Physician',
          identifier: found.doctorRoom || 'Chamber 101',
          subtitle: `${found.name} (${found.code})`,
          avatar: resolvedAvatar,
          gender: resolvedGender
        };
      }
      return {
        ...prev,
        currentHospital: found,
        currentUser: updatedUser,
        departments: getDepartmentsForHospital(found.code || found.id),
        counters: getCountersForHospital(found.code || found.id)
      };
    }, true);
  }
}

/**
 * Resolve and switch hospital tenant by hospital code (URL or first visit)
 */
export function setHospitalByCodeAction(code: string) {
  const clean = code.trim();
  const found = findHospitalByQuery(clean);
  const targetHosp = found || {
    ...DEFAULT_HOSPITAL,
    id: `hosp-${clean.toLowerCase().replace(/[\s-]+/g, '')}`,
    code: clean.toUpperCase(),
    name: DEFAULT_HOSPITAL.name,
    shortName: DEFAULT_HOSPITAL.shortName
  };
  updateState(prev => {
    let updatedUser = prev.currentUser;
    if (prev.currentUser && prev.currentUser.role === 'doctor') {
      const resolvedGender = targetHosp.doctorGender || 'Female';
      const resolvedAvatar = targetHosp.doctorAvatar || resolveIndianDoctorAvatar(targetHosp.doctorName, resolvedGender);
      updatedUser = {
        ...prev.currentUser,
        name: targetHosp.doctorName || 'Attending Physician',
        identifier: targetHosp.doctorRoom || 'Chamber 101',
        subtitle: `${targetHosp.name} (${targetHosp.code})`,
        avatar: resolvedAvatar,
        gender: resolvedGender
      };
    }
    return {
      ...prev,
      currentHospital: targetHosp,
      currentUser: updatedUser,
      departments: getDepartmentsForHospital(targetHosp.code || targetHosp.id),
      counters: getCountersForHospital(targetHosp.code || targetHosp.id)
    };
  }, true);
}

/**
 * Doctor / Staff authentication
 */
/**
 * Resolves authentic photorealistic Indian doctor profile avatar
 */
export function resolveIndianDoctorAvatar(docName?: string, gender?: string): string {
  const name = (docName || '').toLowerCase();
  const isFemale = gender === 'Female' || /ananya|sunita|meenakshi|pooja|priya|neha|dr\.\s*(mrs|ms|miss)/i.test(name);
  const isSeniorMale = /singhal|sharma|kumar|verma|joshi|gupta|sen/i.test(name) && /r\.?\s*k|senior|distinguished|prof/i.test(name);
  
  if (isFemale) {
    return /sunita|resident|young/i.test(name) ? '/doctors/doctor_female_2.jpg' : '/doctors/doctor_female_1.jpg';
  }
  return isSeniorMale ? '/doctors/doctor_male_2.jpg' : '/doctors/doctor_male_1.jpg';
}

export function loginDoctorAction(
  doctorName: string,
  clinicName?: string,
  roomNo?: string,
  mobile?: string,
  assistantName?: string,
  pin?: string,
  hospitalId?: string
): { success: boolean; error?: string } {
  if (pin !== undefined && pin.trim() !== '' && pin.trim() !== '1234') {
    return { success: false, error: 'Invalid PIN. Please try again.' };
  }

  const targetHosp = hospitalId
    ? (findHospitalByQuery(hospitalId) || REGISTERED_HOSPITALS.find(h => h.id === hospitalId || h.code.toUpperCase() === hospitalId.toUpperCase()) || state.currentHospital)
    : state.currentHospital;

  const cleanDoc = doctorName.trim() || targetHosp.doctorName || 'Attending Physician';
  const cleanClinic = targetHosp.name;
  const cleanRoom = roomNo?.trim() || targetHosp.doctorRoom || 'Chamber 101';
  const displayName = assistantName?.trim()
    ? `${cleanDoc} (Asst: ${assistantName.trim()})`
    : cleanDoc;

  const resolvedGender = (targetHosp.doctorName === cleanDoc && targetHosp.doctorGender)
    ? targetHosp.doctorGender
    : (/ananya|sunita|meenakshi|pooja|priya|neha/i.test(cleanDoc) ? 'Female' : 'Male');
  const resolvedAvatar = (targetHosp.doctorName === cleanDoc && targetHosp.doctorAvatar)
    ? targetHosp.doctorAvatar
    : resolveIndianDoctorAvatar(cleanDoc, resolvedGender);
  
  const nextHistory = pushNavigationHistory('Sign In Gate');

  updateState(prev => ({
    ...prev,
    navigationHistory: nextHistory,
    currentHospital: targetHosp,
    departments: getDepartmentsForHospital(targetHosp.code || targetHosp.id),
    counters: getCountersForHospital(targetHosp.code || targetHosp.id),
    currentUser: {
      id: `doc-${Date.now()}`,
      role: 'doctor',
      name: displayName,
      identifier: cleanRoom,
      designation: targetHosp.doctorDesignation || 'Consultant Physician',
      subtitle: `${cleanClinic} (${targetHosp.code})`,
      avatar: resolvedAvatar,
      gender: resolvedGender
    },
    activeRole: 'doctor',
    doctorView: 'dashboard',
    toastNotification: `Signed in: ${displayName} • ${targetHosp.shortName}`
  }), true);

  persistDoctorTabNav('dashboard', state.doctorSidebarExpanded, state.selectedPatientId);

  return { success: true };
}

/**
 * Explicit Diagnostic Bay / Lab Technician Sign In
 */
export function loginLabTechAction(
  techName: string,
  departmentId: string,
  pin?: string,
  hospitalId?: string
): { success: boolean; error?: string } {
  if (pin !== undefined && pin.trim() !== '' && pin.trim() !== '1234') {
    return { success: false, error: 'Invalid PIN. Please try again.' };
  }

  const targetHosp = hospitalId
    ? (findHospitalByQuery(hospitalId) || REGISTERED_HOSPITALS.find(h => h.id === hospitalId || h.code.toUpperCase() === hospitalId.toUpperCase()) || state.currentHospital)
    : state.currentHospital;

  const cleanTech = techName.trim() || 'Lab Technician';
  const targetDepts = getDepartmentsForHospital(targetHosp.code || targetHosp.id);
  const targetCounters = getCountersForHospital(targetHosp.code || targetHosp.id);
  const dept = targetDepts.find(d => d.id === departmentId) || targetDepts[0];
  const counter = targetCounters.find(c => c.departmentId === dept.id);

  const nextHistory = pushNavigationHistory('Sign In Gate');

  updateState(prev => ({
    ...prev,
    navigationHistory: nextHistory,
    currentHospital: targetHosp,
    departments: targetDepts,
    counters: targetCounters,
    activeBayDepartmentId: dept.id,
    currentUser: {
      id: counter?.id || `tech-${Date.now()}`,
      role: 'lab_tech',
      name: cleanTech,
      identifier: dept.location.room,
      subtitle: `${dept.name} • ${targetHosp.shortName}`,
      assignedBayDepartmentId: dept.id
    },
    activeRole: 'lab_tech',
    toastNotification: `Workstation Active: ${cleanTech} (${dept.name}) • ${targetHosp.shortName}`
  }), true);

  return { success: true };
}

/**
 * Explicit Pharmacist Sign In
 */
export function loginPharmacistAction(
  pharmacistName: string,
  pharmacyName: string = 'Hospital Pharmacy',
  pin?: string,
  hospitalId?: string
): { success: boolean; error?: string } {
  if (pin !== undefined && pin.trim() !== '' && pin.trim() !== '1234') {
    return { success: false, error: 'Invalid PIN. Please try again.' };
  }

  const targetHosp = hospitalId
    ? (findHospitalByQuery(hospitalId) || REGISTERED_HOSPITALS.find(h => h.id === hospitalId || h.code.toUpperCase() === hospitalId.toUpperCase()) || state.currentHospital)
    : state.currentHospital;

  const cleanPharmacist = sanitizeString(pharmacistName) || 'Duty Pharmacist';
  const cleanPharmacy = sanitizeString(pharmacyName) || `${targetHosp.shortName} Pharmacy`;
  const nextHistory = pushNavigationHistory('Sign In Gate');

  updateState(prev => ({
    ...prev,
    navigationHistory: nextHistory,
    currentHospital: targetHosp,
    departments: getDepartmentsForHospital(targetHosp.code || targetHosp.id),
    counters: getCountersForHospital(targetHosp.code || targetHosp.id),
    currentUser: {
      id: `pharm-${Date.now()}-${nextAtomicSeq()}`,
      role: 'pharmacist',
      name: cleanPharmacist,
      identifier: cleanPharmacy,
      subtitle: `${cleanPharmacy} • ${targetHosp.shortName}`
    },
    activeRole: 'pharmacist',
    toastNotification: `Pharmacy Active: ${cleanPharmacist} (${cleanPharmacy})`
  }), true);

  return { success: true };
}

function buildMedicationFingerprint(medications: IssueMedicationInput[]): string {
  return medications
    .map(m => `${(m.drugName || '').trim().toLowerCase()}|${(m.dose || '').trim().toLowerCase()}|${(m.frequency || '').trim().toLowerCase()}|${(m.duration || '').trim().toLowerCase()}`)
    .join(';');
}

/**
 * Doctor issues a structured digital prescription for a patient (duplicate-submit protected)
 */
export function issuePrescriptionAction(
  patientId: string,
  medications: IssueMedicationInput[],
  clinicalNotes: string = '',
  diagnosis?: string,
  followUpDate?: string
): Prescription | null {
  if (!medications || medications.length === 0) return null;
  const targetPatient = state.patients.find(p => p.id === patientId);
  if (!targetPatient) return null;

  const nowMs = Date.now();
  const cleanNotes = clinicalNotes ? sanitizeString(clinicalNotes) : '';
  const cleanDiagnosis = diagnosis ? sanitizeString(diagnosis) : targetPatient.chiefComplaint;
  const fingerprint = buildMedicationFingerprint(medications);

  // Duplicate-submission protection: reject rapid identical double-submit within 3s
  const recentSamePatientRx = state.prescriptions.find(rx => rx.patientId === patientId);
  if (recentSamePatientRx) {
    const issuedMs = Date.parse(recentSamePatientRx.issuedAt);
    if (
      Number.isFinite(issuedMs) &&
      nowMs - issuedMs < 3000 &&
      buildMedicationFingerprint(recentSamePatientRx.medications) === fingerprint &&
      (recentSamePatientRx.clinicalNotes || '') === cleanNotes &&
      (recentSamePatientRx.diagnosis || '') === (cleanDiagnosis || '')
    ) {
      return recentSamePatientRx;
    }
  }

  let createdRx: Prescription | null = null;
  updateState(prev => {
    const pat = prev.patients.find(p => p.id === patientId);
    if (!pat) return prev;

    const docId = prev.currentUser?.role === 'doctor' ? prev.currentUser.id : pat.prescribedDoctorId;
    const docName = prev.currentUser?.role === 'doctor' ? prev.currentUser.name : pat.prescribedDoctorName;
    const seq = nextAtomicSeq();

    const structuredMeds: MedicationItem[] = medications.map((m, idx) => ({
      id: m.id || `med-${nowMs}-${seq}-${idx + 1}`,
      drugName: sanitizeString(m.drugName),
      genericName: m.genericName ? sanitizeString(m.genericName) : undefined,
      dose: sanitizeString(m.dose),
      frequency: sanitizeString(m.frequency),
      duration: sanitizeString(m.duration),
      route: sanitizeString(m.route || 'Oral'),
      instructions: m.instructions ? sanitizeString(m.instructions) : undefined,
      quantity: m.quantity ? sanitizeString(m.quantity) : undefined,
      dispensed: Boolean(m.dispensed),
      dispensedAt: m.dispensedAt
    }));

    const newRx: Prescription = {
      id: `RX-${pat.uhid.replace('QC-', '')}-${seq}`,
      patientId: pat.id,
      patientName: pat.name,
      patientUhid: pat.uhid,
      doctorId: docId || 'doc-on-duty',
      doctorName: docName || prev.currentHospital.doctorName || 'Attending Physician',
      hospitalId: prev.currentHospital.id,
      hospitalCode: prev.currentHospital.code,
      issuedAt: new Date(nowMs).toISOString(),
      validUntil: new Date(nowMs + 30 * 24 * 60 * 60_000).toISOString(),
      medications: structuredMeds,
      clinicalNotes: cleanNotes || undefined,
      diagnosis: cleanDiagnosis,
      followUpDate: followUpDate ? sanitizeString(followUpDate) : undefined,
      status: structuredMeds.every(m => m.dispensed)
        ? 'fully_dispensed'
        : structuredMeds.some(m => m.dispensed)
          ? 'partially_dispensed'
          : 'active'
    };

    createdRx = newRx;
    return {
      ...prev,
      prescriptions: [newRx, ...prev.prescriptions],
      toastNotification: `Digital prescription ${newRx.id} issued for ${pat.name}`
    };
  }, true);

  return createdRx;
}

/**
 * Pharmacist dispenses selected medications for a prescription (duplicate-dispense guarded)
 */
export function dispenseMedicationsAction(
  prescriptionId: string,
  medicationIds: string[],
  pharmacistName?: string,
  pharmacyName?: string,
  notes?: string
): PharmacyDispenseRecord | null {
  if (!medicationIds || medicationIds.length === 0) return null;

  let createdRecord: PharmacyDispenseRecord | null = null;
  updateState(prev => {
    const rxIdx = prev.prescriptions.findIndex(rx => rx.id === prescriptionId);
    if (rxIdx === -1) return prev;

    const rx = prev.prescriptions[rxIdx];
    if (rx.status === 'fully_dispensed' || rx.status === 'expired') return prev;

    const requestedSet = new Set(medicationIds);
    const newlyDispensedMeds = rx.medications.filter(m => requestedSet.has(m.id) && !m.dispensed);
    if (newlyDispensedMeds.length === 0) return prev;

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const resolvedPharmacist = sanitizeString(
      pharmacistName ||
      (prev.currentUser?.role === 'pharmacist' ? prev.currentUser.name : 'Duty Pharmacist')
    );
    const resolvedPharmacy = sanitizeString(
      pharmacyName ||
      (prev.currentUser?.role === 'pharmacist' ? prev.currentUser.identifier : `${prev.currentHospital.shortName} Pharmacy`)
    );

    const newlyDispensedIds = new Set(newlyDispensedMeds.map(m => m.id));
    const updatedMedications = rx.medications.map(m =>
      newlyDispensedIds.has(m.id) ? { ...m, dispensed: true, dispensedAt: nowIso } : m
    );

    const allDispensed = updatedMedications.every(m => Boolean(m.dispensed));
    const someDispensed = updatedMedications.some(m => Boolean(m.dispensed));
    const nextRxStatus: Prescription['status'] = allDispensed
      ? 'fully_dispensed'
      : someDispensed
        ? 'partially_dispensed'
        : 'active';

    const updatedRx: Prescription = {
      ...rx,
      medications: updatedMedications,
      status: nextRxStatus,
      dispensedAt: nowIso,
      dispensedBy: resolvedPharmacist,
      dispensedPharmacy: resolvedPharmacy
    };

    const nextPrescriptions = [...prev.prescriptions];
    nextPrescriptions[rxIdx] = updatedRx;

    const record: PharmacyDispenseRecord = {
      id: `disp-${nowMs}-${nextAtomicSeq()}`,
      prescriptionId: rx.id,
      patientId: rx.patientId,
      patientName: rx.patientName,
      patientUhid: rx.patientUhid,
      hospitalId: rx.hospitalId || prev.currentHospital.id,
      hospitalCode: rx.hospitalCode || prev.currentHospital.code,
      pharmacistName: resolvedPharmacist,
      pharmacyName: resolvedPharmacy,
      dispensedAt: nowIso,
      medicationsDispensed: newlyDispensedMeds.map(m => `${m.drugName} (${m.dose})`),
      notes: notes ? sanitizeString(notes) : undefined
    };

    createdRecord = record;
    return {
      ...prev,
      prescriptions: nextPrescriptions,
      dispenseRecords: [record, ...prev.dispenseRecords],
      toastNotification: `Dispensed ${newlyDispensedMeds.length} medication(s) for ${rx.patientName} (${nextRxStatus.replace('_', ' ')})`
    };
  }, true);

  return createdRecord;
}

/**
 * Search Pre-registered Patients across UHID, Name, Token, QR, or Contact
 */
export function searchPreRegisteredPatientsAction(query: string): Patient[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const digitsOnly = q.replace(/\D/g, '');

  return state.patients.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(q);
    const uhidMatch = p.uhid.toLowerCase().includes(q);
    const tokenMatch = p.opdTokenNumber?.toLowerCase().includes(q);
    const qrMatch = p.qrSessionId?.toLowerCase().includes(q);
    const phoneMatch = digitsOnly.length >= 3 && p.contact.replace(/\D/g, '').includes(digitsOnly);
    return nameMatch || uhidMatch || tokenMatch || qrMatch || phoneMatch;
  });
}

/**
 * Directly authenticate and open a pre-registered patient's pass
 */
export function selectAndLoginPatientAction(patientId: string): boolean {
  const pat = state.patients.find(p => p.id === patientId);
  if (!pat) return false;

  const nextHistory = pushNavigationHistory(state.currentUser?.role === 'doctor' ? 'Doctor Workstation' : 'Diagnostic Workstation');

  updateState(prev => ({
    ...prev,
    navigationHistory: nextHistory,
    selectedPatientId: pat.id,
    currentUser: {
      id: pat.id,
      role: 'patient',
      name: pat.name,
      identifier: pat.uhid,
      subtitle: pat.opdTokenNumber
    },
    activeRole: 'patient',
    toastNotification: `Patient pass verified for ${pat.name}`
  }), true);
  return true;
}

/**
 * Explicit Patient Search / Pass Lookup (ZERO silent demo fallback)
 */
export function loginPatientLookupAction(query: string): { success: boolean; error?: string; patients?: Patient[] } {
  const clean = query.trim();
  if (!clean) return { success: false, error: 'Please enter a valid Token, UHID, Name, or Mobile number' };

  const matches = searchPreRegisteredPatientsAction(clean);
  if (matches.length === 1) {
    selectAndLoginPatientAction(matches[0].id);
    return { success: true, patients: matches };
  }
  if (matches.length > 1) {
    return { success: true, patients: matches };
  }

  // Only allow explicit canonical demo key when store has no live patients yet
  const upper = clean.toUpperCase();
  if (state.patients.length === 0 && (upper === 'QC-9411' || upper === 'QC-2026-9411')) {
    loadDemoScenarioAction();
    const demoPat = state.patients.find(p => p.id === 'pat-rameshwar');
    if (demoPat) {
      return { success: true, patients: [demoPat] };
    }
  }

  return {
    success: false,
    error: 'Patient record not found. Verify your Token, UHID, Name, or Mobile number.'
  };
}

/**
 * Sign Out to Auth Gate Screen
 */
export function signOutAction() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(DOCTOR_UI_KEY);
      sessionStorage.removeItem('qcare_doctor_report_patient');
      sessionStorage.removeItem('qcare_doctor_queue_filter');
    } catch {}
  }
  updateState(prev => ({
    ...prev,
    currentUser: null,
    doctorView: 'dashboard',
    selectedPatientId: null,
    callingAlert: null,
    navigationHistory: [],
    toastNotification: 'Signed out successfully'
  }), true);
}

function parseAndValidateQrPayload(
  payloadBase64: string,
  expectedSessionClean: string,
  currentHospital: Hospital
): Record<string, unknown> | null {
  try {
    const decoded = JSON.parse(atob(decodeURIComponent(payloadBase64)));
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) return null;
    if (typeof decoded.uhid !== 'string' || decoded.uhid.trim().length < 3) return null;
    if (typeof decoded.name !== 'string' || decoded.name.trim().length < 2) return null;
    if (
      decoded.tests !== undefined &&
      (!Array.isArray(decoded.tests) || !decoded.tests.every((t: unknown) => typeof t === 'string'))
    ) {
      return null;
    }
    if (
      decoded.completed !== undefined &&
      (!Array.isArray(decoded.completed) || !decoded.completed.every((t: unknown) => typeof t === 'string'))
    ) {
      return null;
    }
    if (
      typeof decoded.qrSessionId === 'string' &&
      decoded.qrSessionId.trim().toUpperCase() !== expectedSessionClean
    ) {
      return null;
    }
    if (typeof decoded.hospitalCode === 'string' && decoded.hospitalCode.trim()) {
      const resolved = findHospitalByQuery(decoded.hospitalCode);
      const codeMatches = decoded.hospitalCode.trim().toUpperCase() === currentHospital.code.toUpperCase();
      if (!codeMatches && resolved?.id !== currentHospital.id) {
        return null;
      }
    }
    return decoded as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Login/Resolve patient directly from QR scan URL session or schema-validated QR payload
 */
export function loginAsPatientWithSessionAction(sessionIdOrUhid: string, payloadBase64?: string): boolean {
  const clean = sessionIdOrUhid.trim().toUpperCase();
  if (!clean) return false;

  let patient = state.patients.find(
    p => p.qrSessionId.toUpperCase() === clean || p.uhid.toUpperCase() === clean
  );

  if (!patient) {
    if (payloadBase64) {
      const decoded = parseAndValidateQrPayload(payloadBase64, clean, state.currentHospital);
      if (decoded) {
        const tests = Array.isArray(decoded.tests) ? (decoded.tests as string[]) : [];
        const completed = Array.isArray(decoded.completed) ? (decoded.completed as string[]) : [];
        const restoredPat: Patient = {
          id: typeof decoded.id === 'string' && decoded.id ? decoded.id : `pat-${clean.toLowerCase()}-${nextAtomicSeq()}`,
          hospitalId: state.currentHospital.id,
          hospitalCode: typeof decoded.hospitalCode === 'string' ? decoded.hospitalCode : state.currentHospital.code,
          uhid: String(decoded.uhid),
          qrSessionId: clean,
          name: sanitizeString(String(decoded.name)),
          age: typeof decoded.age === 'number' && decoded.age > 0 && decoded.age <= 120 ? decoded.age : 45,
          gender: decoded.gender === 'Female' || decoded.gender === 'Other' ? decoded.gender : 'Male',
          contact: typeof decoded.contact === 'string' ? decoded.contact : '',
          priority: decoded.priority === 'emergency' || decoded.priority === 'senior' ? decoded.priority : 'standard',
          doctorPriority: decoded.doctorPriority === 'urgent' || decoded.doctorPriority === 'priority' ? decoded.doctorPriority : 'normal',
          prescribedDoctorId: typeof decoded.prescribedDoctorId === 'string' ? decoded.prescribedDoctorId : 'doc-on-duty',
          prescribedDoctorName: typeof decoded.prescribedDoctorName === 'string' ? decoded.prescribedDoctorName : (state.currentHospital.doctorName || 'Attending Physician'),
          prescribedDoctorRoom: typeof decoded.prescribedDoctorRoom === 'string' ? decoded.prescribedDoctorRoom : (state.currentHospital.doctorRoom || 'Chamber 101'),
          chiefComplaint: typeof decoded.chiefComplaint === 'string' ? sanitizeString(decoded.chiefComplaint) : 'Consultation',
          symptoms: typeof decoded.symptoms === 'string' ? sanitizeString(decoded.symptoms) : '',
          prescribedTests: tests,
          prescribedTestItems: [],
          completedTests: completed,
          activeTokenIds: {},
          status: (decoded.status as Patient['status']) || 'in_transit',
          assignedSmartRoute: Array.isArray(decoded.route) ? (decoded.route as string[]) : tests,
          currentLockedDestinationTestId: typeof decoded.locked === 'string' ? decoded.locked : tests[0],
          registrationTime: typeof decoded.regTime === 'string' ? decoded.regTime : 'Today',
          opdTokenNumber: typeof decoded.token === 'string' ? decoded.token : `OPD-${clean}`,
          doctorReviewStatus: (decoded.docStatus as Patient['doctorReviewStatus']) || 'awaiting_lab_reports'
        };
        updateState(prev => ({
          ...prev,
          patients: prev.patients.some(p => p.uhid.toUpperCase() === restoredPat.uhid.toUpperCase())
            ? prev.patients
            : [restoredPat, ...prev.patients]
        }), true);
        patient = restoredPat;
      }
    } else if (clean === 'QC-9411' || clean === 'QC-2026-9411') {
      loadDemoScenarioAction();
      patient = state.patients.find(p => p.qrSessionId === 'QC-9411');
    }
  }

  if (patient) {
    const nextHistory = pushNavigationHistory('Sign In Gate');
    updateState(prev => ({
      ...prev,
      navigationHistory: nextHistory,
      selectedPatientId: patient!.id,
      activeRole: 'patient',
      currentUser: {
        id: patient!.id,
        role: 'patient',
        name: patient!.name,
        identifier: patient!.uhid,
        subtitle: patient!.qrSessionId
      },
      toastNotification: `📱 Boarding pass opened for ${patient!.name}`
    }), true);
    return true;
  }
  return false;
}

const DEMO_AI_PATIENT_PROFILES = [
  {
    name: 'Amitabh Saxena',
    age: '54',
    gender: 'Male' as const,
    contact: '9810423912',
    chiefComplaint: 'Substernal chest tightness radiating to left shoulder, palpitations on exertion since 2 days',
    testIds: ['test-ecg', 'test-cbc', 'test-xray-chest']
  },
  {
    name: 'Sangeeta Pillai',
    age: '49',
    gender: 'Female' as const,
    contact: '9820541289',
    chiefComplaint: 'Uncontrolled polydipsia, excessive fatigue, blurred vision and suspected diabetic neuropathy',
    testIds: ['test-fbs', 'test-ppbs', 'test-lipid', 'test-retina-oct']
  },
  {
    name: 'Vikramaditya Rao',
    age: '62',
    gender: 'Male' as const,
    contact: '9845019842',
    chiefComplaint: 'Bilateral knee crepitation, lower lumbar back stiffness, difficulty walking unassisted',
    testIds: ['test-dexa', 'test-cbc']
  },
  {
    name: 'Pooja Chawla',
    age: '32',
    gender: 'Female' as const,
    contact: '9811234908',
    chiefComplaint: 'Persistent dry cough with nocturnal breathlessness, allergic bronchial wheeze for 3 weeks',
    testIds: ['test-spirometry', 'test-xray-chest', 'test-cbc']
  },
  {
    name: 'Mohammed Farooq',
    age: '41',
    gender: 'Male' as const,
    contact: '9833098712',
    chiefComplaint: 'Unilateral tinnitus in left ear, muffled hearing after viral upper respiratory tract infection',
    testIds: ['test-audiometry', 'test-tympanometry']
  },
  {
    name: 'Harshvardhan Joshi',
    age: '28',
    gender: 'Male' as const,
    contact: '9890123456',
    chiefComplaint: 'Episodic morning headaches with aura, transient limb tingling sensation and sensory numbness',
    testIds: ['test-eeg', 'test-ncs']
  },
  {
    name: 'Sunita Kapoor',
    age: '57',
    gender: 'Female' as const,
    contact: '9811987654',
    chiefComplaint: 'Progressive visual blurring while reading, ocular pressure feeling and night driving halos',
    testIds: ['test-retina-oct', 'test-visual-acuity']
  }
];

export function setPrefilledWalkinDataAction(data: HospitalStoreState['prefilledWalkinData']) {
  updateState(prev => ({ ...prev, prefilledWalkinData: data }));
}

export function openSearchModalAction() {
  updateState(prev => ({ ...prev, isSearchModalOpen: true }));
}

export function closeSearchModalAction() {
  updateState(prev => ({ ...prev, isSearchModalOpen: false }));
}

export function generateAiDemoPatientAction(): { name: string; uhid: string } {
  const randomIndex = Math.floor(Math.random() * DEMO_AI_PATIENT_PROFILES.length);
  const sample = DEMO_AI_PATIENT_PROFILES[randomIndex];
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const phone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

  const generated = {
    ...sample,
    contact: phone
  };

  updateState(prev => ({
    ...prev,
    prefilledWalkinData: generated,
    isSearchModalOpen: false,
    toastNotification: `🎲 AI Generated & Loaded: ${generated.name} (${generated.age}Y/${generated.gender})`
  }));

  return { name: generated.name, uhid: `QC-2026-${randNum}` };
}

/**
 * Getter for current store state (non-hook access for tests and background workers)
 */
export function getHospitalState(): HospitalStoreState {
  return state;
}

// -------------------------------------------------------------
// REACT HOOK
// -------------------------------------------------------------

export function useHospitalStore() {
  const [snapshot, setSnapshot] = useState(state);

  useEffect(() => {
    const handleStoreChange = () => setSnapshot({ ...state });
    listeners.add(handleStoreChange);
    return () => {
      listeners.delete(handleStoreChange);
    };
  }, []);

  const selectedPatient = snapshot.patients.find(p => p.id === snapshot.selectedPatientId) || snapshot.patients[0] || null;

  // Lazy getter — only computes route when actually called (PatientView / HospitalFloorRadar)
  // NOT computed on every render for DoctorPortal/Header/Sidebar etc.
  const currentRoutingPlan = selectedPatient
    ? calculateOptimalQueueRoute(selectedPatient, snapshot.tests, snapshot.departments, snapshot.queueTokens, snapshot.counters)
    : {
        patientId: '',
        calculatedAt: '',
        smartRouteSteps: [],
        smartTotalTimeMinutes: 0,
        naiveTotalTimeMinutes: 0,
        timeSavedMinutes: 0,
        percentageSaved: 0,
        bottlenecksAvoided: [],
        fastingSatisfied: true,
        transitTotalMinutes: 0
      };

  return {
    ...snapshot,
    selectedPatient,
    currentRoutingPlan,
    language: snapshot.activeLanguage,
    setRole: setRoleAction,
    setDoctorView: setDoctorViewAction,
    toggleDoctorSidebar: toggleDoctorSidebarAction,
    setLanguage: setLanguageAction,
    setSelectedPatientId: setSelectedPatientIdAction,
    setActiveBayDepartmentId: setActiveBayDepartmentIdAction,
    dismissCallingAlert: dismissCallingAlertAction,
    showToast: showToastAction,
    dismissToast: dismissToastAction,
    registerPatient: registerPatientAction,
    updatePatientVisitAndTests: updatePatientVisitAndTestsAction,
    reconcilePatientVisit: updatePatientVisitAndTestsAction,
    prescribeTests: prescribeTestsAction,
    callPatient: callPatientAction,
    putOnHold: putTokenOnHoldAction,
    recallFromHold: recallTokenFromHoldAction,
    completeTestAndUploadReport: completeTestAndUploadReportAction,
    manuallySwitchNextTest: manuallySwitchNextTestAction,
    markTestAlreadyDone: markTestAlreadyDoneAction,
    markTestCompletedByPatient: markTestAlreadyDoneAction,
    skipToken: skipTokenAction,
    verifyLabReport: verifyLabReportAction,
    verifyAndDischargePatient: verifyAndDischargePatientAction,
    issuePrescription: issuePrescriptionAction,
    dispenseMedications: dispenseMedicationsAction,
    loadDemoScenario: loadDemoScenarioAction,
    loadDoctorDemoPatients: loadDoctorDemoPatientsAction,
    resetToCleanSlate: resetToCleanSlateAction,
    loginAsPatientWithSession: loginAsPatientWithSessionAction,
    loginDoctor: loginDoctorAction,
    loginLabTech: loginLabTechAction,
    loginPharmacist: loginPharmacistAction,
    loginPatientLookup: loginPatientLookupAction,
    searchPreRegisteredPatients: searchPreRegisteredPatientsAction,
    selectAndLoginPatient: selectAndLoginPatientAction,
    setHospitalByCode: setHospitalByCodeAction,
    setHospitalById: setHospitalByIdAction,
    setPrefilledWalkinData: setPrefilledWalkinDataAction,
    openSearchModal: openSearchModalAction,
    closeSearchModal: closeSearchModalAction,
    canGoBack: (snapshot.navigationHistory && snapshot.navigationHistory.length > 0) || snapshot.currentUser !== null,
    navigateBack: () => navigateBackAction(false),
    navigateBackAction,
    generateAiDemoPatient: generateAiDemoPatientAction,
    signOut: signOutAction
  };
}
