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
  DoctorPortalView
} from '../types';
import {
  DEFAULT_HOSPITAL,
  REGISTERED_HOSPITALS,
  findHospitalByQuery,
  INITIAL_DEPARTMENTS,
  INITIAL_TESTS,
  INITIAL_COUNTERS,
  INITIAL_PATIENTS,
  INITIAL_QUEUE_TOKENS,
  INITIAL_CLINICAL_REPORTS,
  DEMO_SCENARIO_PATIENTS_LIST,
  DEMO_SCENARIO_TOKENS,
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
  currentUser: CurrentUser | null;
  activeRole: UserRole;
  doctorView: DoctorPortalView;
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

// Initial default state (ZERO FAKE DATA, ZERO PRE-SEEDED DOCTORS/PATIENTS)
let state: HospitalStoreState = {
  currentHospital: DEFAULT_HOSPITAL,
  departments: INITIAL_DEPARTMENTS,
  tests: INITIAL_TESTS,
  counters: INITIAL_COUNTERS,
  patients: [],
  queueTokens: [],
  clinicalReports: [],
  currentUser: null,
  activeRole: 'doctor',
  doctorView: 'dashboard',
  activeLanguage: 'en',
  selectedPatientId: null,
  activeBayDepartmentId: 'dept-pathology',
  navigationHistory: [],
  callingAlert: null,
  toastNotification: null,
  prefilledWalkinData: null,
  isSearchModalOpen: false
};

// Hydrate auth session & persistent store from localStorage on startup / refresh
if (typeof window !== 'undefined') {
  try {
    const savedSessionStr = localStorage.getItem(SESSION_KEY);
    const savedStateStr = localStorage.getItem(STORAGE_KEY);

    let hydratedUser: CurrentUser | null = null;
    let hydratedHosp = DEFAULT_HOSPITAL;
    let hydratedRole: UserRole = 'doctor';
    let hydratedPatientId: string | null = null;

    if (savedSessionStr) {
      const sess = JSON.parse(savedSessionStr);
      if (sess && sess.currentUser) {
        hydratedUser = sess.currentUser;
        hydratedHosp = sess.currentHospital || DEFAULT_HOSPITAL;
        hydratedRole = sess.activeRole || 'doctor';
        hydratedPatientId = sess.selectedPatientId || null;
      }
    }

    if (savedStateStr) {
      const parsed = JSON.parse(savedStateStr);
      const effectiveHosp = hydratedHosp || parsed.currentHospital || DEFAULT_HOSPITAL;
      state = {
        ...state,
        ...parsed,
        currentUser: hydratedUser || parsed.currentUser || null,
        currentHospital: effectiveHosp,
        activeRole: hydratedRole || parsed.activeRole || 'doctor',
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

// Real-time Cross-Tab Synchronization Channel
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('qcare_v2_sync_channel');
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'SYNC_STATE' && event.data?.payload) {
        const incoming = event.data.payload;
        const preserveLocalSession = state.currentUser !== null;
        state = {
          ...state,
          ...incoming,
          ...(preserveLocalSession
            ? {
                currentUser: state.currentUser,
                activeRole: state.activeRole,
                doctorView: state.doctorView,
                activeBayDepartmentId: state.activeBayDepartmentId,
                selectedPatientId: state.selectedPatientId
              }
            : {}),
          callingAlert: incoming.callingAlert !== undefined ? incoming.callingAlert : state.callingAlert
        };
        listeners.forEach(listener => listener());
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
        const preserveLocalSession = state.currentUser !== null;
        state = {
          ...state,
          ...parsed,
          ...(preserveLocalSession
            ? {
                currentUser: state.currentUser,
                activeRole: state.activeRole,
                doctorView: state.doctorView,
                activeBayDepartmentId: state.activeBayDepartmentId,
                selectedPatientId: state.selectedPatientId
              }
            : {})
        };
        listeners.forEach(listener => listener());
      } catch {
        // Safe catch
      }
    }
  });
}

let _emitThrottleTimer: ReturnType<typeof setTimeout> | null = null;

function emitChange() {
  // Always notify React subscribers immediately (cheap — just setState)
  listeners.forEach(listener => listener());

  // Throttle expensive localStorage + BroadcastChannel writes to max once per 300ms
  if (_emitThrottleTimer) return;
  _emitThrottleTimer = setTimeout(() => {
    _emitThrottleTimer = null;
    const syncPayload = {
      patients: state.patients,
      queueTokens: state.queueTokens,
      clinicalReports: state.clinicalReports,
      counters: state.counters,
      currentUser: state.currentUser,
      currentHospital: state.currentHospital,
      activeRole: state.activeRole,
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
  }, 300);
}

function updateState(updater: (prev: HospitalStoreState) => HospitalStoreState) {
  state = updater(state);
  emitChange();
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
    viewTitle: title || (state.activeRole === 'doctor' ? 'Doctor Chamber' : state.activeRole === 'lab_tech' ? 'Lab Workstation' : 'Patient Pass')
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
    if (state.activeRole === 'patient' || state.activeRole === 'lab_tech') {
      // Return to doctor workstation if in patient or lab view
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
    }
    return {
      ...prev,
      activeRole: role,
      ...(role === 'doctor' ? { doctorView: 'dashboard' as DoctorPortalView } : {}),
      currentUser,
      navigationHistory: nextHistory
    };
  });
}

export function setDoctorViewAction(view: DoctorPortalView) {
  updateState(prev => (prev.doctorView === view ? prev : { ...prev, doctorView: view }));
}

export function setLanguageAction(lang: Language) {
  updateState(prev => ({ ...prev, activeLanguage: lang }));
}

export function setSelectedPatientIdAction(patientId: string | null) {
  updateState(prev => ({ ...prev, selectedPatientId: patientId }));
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

  const serial = Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isSenior = ageVal.value >= 60;
  const calculatedPriority = data.priority === 'emergency' ? 'emergency' : (isSenior ? 'senior' : 'standard');

  const newPatient: Patient = {
    id: `pat-${serial}`,
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
    registeredAtMs: now.getTime(),
    opdTokenNumber: `OPD-${state.patients.length + 14}`,
    doctorReviewStatus: 'awaiting_prescription'
  };

  updateState(prev => ({
    ...prev,
    patients: [newPatient, ...prev.patients],
    selectedPatientId: newPatient.id,
    toastNotification: `Patient registered: ${newPatient.name} (${newPatient.opdTokenNumber})`
  }));

  return newPatient;
}

/**
 * Doctor prescribes tests:
 * 1. Computes optimal lowest-wait route
 * 2. Mints atomic bay tokens for each prescribed test
 * 3. Locks first destination (Stability Lock)
 * 4. Updates patient status to in_transit
 */
export function prescribeTestsAction(
  patientId: string,
  testIds: string[],
  doctorPriority: 'normal' | 'priority' | 'urgent' = 'normal',
  notes?: string
) {
  if (testIds.length === 0) return;

  updateState(prev => {
    const patientIndex = prev.patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) return prev;

    const patient = prev.patients[patientIndex];
    const updatedPatient: Patient = {
      ...patient,
      prescribedTests: testIds,
      doctorPriority,
      doctorReviewStatus: 'awaiting_lab_reports',
      status: 'in_transit',
      notes: notes ? sanitizeString(notes) : patient.notes
    };

    // Calculate optimal route
    const plan = calculateOptimalQueueRoute(
      updatedPatient,
      prev.tests,
      prev.departments,
      prev.queueTokens,
      prev.counters
    );

    const smartOrderedIds = plan.smartRouteSteps.map(s => s.testId);
    const firstLockedTestId = smartOrderedIds[0] || testIds[0];

    // Mint atomic tokens for all prescribed tests
    const newTokens: QueueToken[] = [];
    const activeTokenIdsMap: Record<string, string> = {};

    testIds.forEach((tId, idx) => {
      const test = prev.tests.find(t => t.id === tId);
      const dept = prev.departments.find(d => d.id === test?.departmentId);
      const existingInDept = prev.queueTokens.filter(t => t.departmentId === dept?.id).length;
      const bayTokenNum = mintBayTokenNumber(dept?.category || 'pathology', existingInDept + idx);
      const activeDeptCounters = prev.counters.filter(c => c.departmentId === dept?.id && c.status === 'active');
      const counter = activeDeptCounters[0] || prev.counters.find(c => c.departmentId === dept?.id);

      const tokenObj: QueueToken = {
        id: `tok-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${tId}`,
        tokenNumber: bayTokenNum,
        patientId: patient.id,
        patientName: patient.name,
        patientUhid: patient.uhid,
        patientAge: patient.age,
        patientGender: patient.gender,
        testId: tId,
        testName: test?.name || 'Diagnostic Test',
        departmentId: dept?.id || '',
        counterId: counter?.id,
        roomNo: dept?.location.room,
        priority: patient.priority,
        doctorPriority,
        status: 'waiting',
        issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        issuedAtMs: Date.now(),
        queuePosition: existingInDept + 1,
        estimatedWaitMinutes: (existingInDept + 1) * (counter?.averageServiceMinutes || 6)
      };

      newTokens.push(tokenObj);
      activeTokenIdsMap[tId] = tokenObj.id;
    });

    const prescribedTestItems = testIds.map(tId => {
      const test = prev.tests.find(t => t.id === tId);
      return {
        testId: tId,
        testName: test?.name || 'Test',
        technicalName: test?.technicalName,
        priority: doctorPriority,
        status: 'waiting' as const,
        preparationInstructions: test?.preparationNotes
      };
    });

    const fullyUpdatedPatient: Patient = {
      ...updatedPatient,
      assignedSmartRoute: smartOrderedIds,
      currentLockedDestinationTestId: firstLockedTestId,
      activeTokenIds: activeTokenIdsMap,
      prescribedTestItems
    };

    const nextPatients = [...prev.patients];
    nextPatients[patientIndex] = fullyUpdatedPatient;

    return {
      ...prev,
      patients: nextPatients,
      queueTokens: [...newTokens, ...prev.queueTokens],
      toastNotification: `Investigations prescribed for ${patient.name}. First stop: ${plan.smartRouteSteps[0]?.location.room} (${plan.smartRouteSteps[0]?.testName})`
    };
  });
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
  });
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
    id: `rep-${nowMs}`,
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
      const completedTests = [...(patient.completedTests || []), token.testId];

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
  });
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
    const completedTests = [...(patient.completedTests || []), testId];
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Mark corresponding token as completed
    const updatedTokens = prev.queueTokens.map(t =>
      t.patientId === patientId && t.testId === testId
        ? { ...t, status: 'completed' as const, completedAt: timeStr }
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
      id: `rep-ext-${Date.now()}-${testId}`,
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
  });
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
  });
}

/**
 * Doctor verifies reports and discharges patient
 */
export function verifyAndDischargePatientAction(patientId: string, doctorConclusionNotes: string = '') {
  updateState(prev => {
    const patIdx = prev.patients.findIndex(p => p.id === patientId);
    if (patIdx === -1) return prev;

    const patient = prev.patients[patIdx];
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
  });
}

/**
 * Load Demo Scenario (Rameshwar Sharma)
 */
export function loadDemoScenarioAction() {
  const nextHistory = pushNavigationHistory('Previous View');
  updateState(prev => ({
    ...prev,
    navigationHistory: nextHistory,
    patients: DEMO_SCENARIO_PATIENTS_LIST,
    queueTokens: DEMO_SCENARIO_TOKENS,
    clinicalReports: [],
    selectedPatientId: 'pat-rameshwar',
    activeRole: 'patient',
    currentUser: {
      id: 'pat-rameshwar',
      role: 'patient',
      name: 'Rameshwar Sharma',
      identifier: 'QC-2026-9411',
      subtitle: 'QC-9411'
    },
    toastNotification: '🎉 Demo Scenario Loaded: Rameshwar Sharma (QC-9411) active on Mobile Boarding Pass!'
  }));
}

/**
 * Load Doctor OPD Demo Queue (4 patients in various clinical workflow states, without leaving Doctor role)
 */
export function loadDoctorDemoPatientsAction() {
  const baseMs = Date.now();
  const preparedPatients: Patient[] = [
    // Case 1: Rameshwar Sharma - Just walked in, needs prescription
    {
      ...DEMO_SCENARIO_PATIENTS_LIST[0],
      registeredAtMs: baseMs - 4 * 60_000,
      doctorReviewStatus: 'awaiting_prescription',
      prescribedTests: [],
      completedTests: [],
      activeTokenIds: {},
      status: 'registered'
    },
    // Case 2: Sita Devi - In Diagnostics at Biochemistry Lab
    {
      ...DEMO_SCENARIO_PATIENTS_LIST[1],
      registeredAtMs: baseMs - 14 * 60_000,
      doctorReviewStatus: 'awaiting_lab_reports',
      status: 'in_transit'
    },
    // Case 3: Vinod Kumar - Lab Reports Ready for Doctor Review
    {
      ...DEMO_SCENARIO_PATIENTS_LIST[2],
      registeredAtMs: baseMs - 28 * 60_000,
      prescribedTests: ['test-cbc', 'test-ecg'],
      completedTests: ['test-cbc', 'test-ecg'],
      doctorReviewStatus: 'reports_ready',
      status: 'all_completed'
    },
    // Case 4: Anita Singh - Discharged / Complete
    {
      ...DEMO_SCENARIO_PATIENTS_LIST[3],
      registeredAtMs: baseMs - 55 * 60_000,
      prescribedTests: ['test-ecg'],
      completedTests: ['test-ecg'],
      doctorReviewStatus: 'completed',
      status: 'discharged'
    }
  ];

  updateState(prev => {
    const docId = prev.currentUser?.id || 'doc-on-duty';
    const docName = prev.currentUser?.name || prev.currentHospital.doctorName || 'Attending Physician';
    const docRoom = prev.currentUser?.identifier || prev.currentHospital.doctorRoom || 'Chamber 101';
    const scopedDemoPatients = preparedPatients.map(p => ({
      ...p,
      prescribedDoctorId: docId,
      prescribedDoctorName: docName,
      prescribedDoctorRoom: docRoom
    }));

    return {
      ...prev,
      patients: scopedDemoPatients,
      queueTokens: DEMO_SCENARIO_TOKENS,
      clinicalReports: [
        {
          id: 'rep-vinod-2',
          testId: 'test-ecg',
          testName: '12-Lead Electrocardiogram (ECG)',
          technicalName: 'Electrocardiography',
          patientId: 'pat-bg-2',
          patientUhid: 'QC-2026-9409',
          patientName: 'Vinod Kumar',
          technicianName: 'Rajesh K. (Cardio Tech)',
          counterId: 'counter-ecg-1',
          roomNo: 'Room 04',
          timestamp: '10:35 AM',
          createdAtMs: baseMs - 6 * 60_000,
          actualTurnaroundMinutes: 5.5,
          status: 'uploaded',
          summary: 'Normal sinus rhythm, heart rate 74 bpm, no acute ST-T changes.',
          metrics: [
            { label: 'Heart Rate', value: '74', unit: 'bpm', normalRange: '60 - 100', flag: 'normal' },
            { label: 'Rhythm', value: 'Sinus Rhythm', unit: '', normalRange: 'Sinus Rhythm', flag: 'normal' },
            { label: 'PR Interval', value: '152', unit: 'ms', normalRange: '120 - 200', flag: 'normal' }
          ],
          technicianNotes: 'Baseline recording clean, minimal muscle tremor artifact.'
        },
        {
          id: 'rep-vinod-1',
          testId: 'test-cbc',
          testName: 'Complete Blood Count (CBC)',
          technicalName: 'Automated Hematology Profile',
          patientId: 'pat-bg-2',
          patientUhid: 'QC-2026-9409',
          patientName: 'Vinod Kumar',
          technicianName: 'Sunil Kumar (Phlebotomy Tech)',
          counterId: 'counter-phleb-1',
          roomNo: 'Room 12',
          timestamp: '10:15 AM',
          createdAtMs: baseMs - 16 * 60_000,
          actualTurnaroundMinutes: 6.5,
          status: 'uploaded',
          summary: 'Mild microcytic hypochromic picture. Platelets adequate.',
          metrics: [
            { label: 'Hemoglobin (Hb)', value: '11.8', unit: 'g/dL', normalRange: '13.0 - 17.0', flag: 'low' },
            { label: 'Total Leukocyte Count (TLC)', value: '7,400', unit: '/uL', normalRange: '4000 - 11000', flag: 'normal' },
            { label: 'Platelet Count', value: '2,65,000', unit: '/uL', normalRange: '150000 - 450000', flag: 'normal' }
          ],
          technicianNotes: 'Venipuncture performed smoothly. Patient advised to rest 5 mins.'
        }
      ],
      selectedPatientId: scopedDemoPatients[0]?.id || null,
      toastNotification: 'Sample OPD queue loaded with 4 authentic clinical cases.'
    };
  });
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
    selectedPatientId: null,
    activeRole: 'doctor',
    navigationHistory: [],
    currentUser: {
      id: 'doc-verma',
      role: 'doctor',
      name: 'Dr. Rajesh Verma',
      identifier: 'Room 104',
      subtitle: 'Cardiologist & General Physician'
    },
    toastNotification: 'Clean slate restored. Zero walk-ins.'
  }));
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
    });
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
  });
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
      subtitle: `${cleanClinic} (${targetHosp.code})`,
      avatar: resolvedAvatar,
      gender: resolvedGender
    },
    activeRole: 'doctor',
    doctorView: 'dashboard',
    toastNotification: `Signed in: ${displayName} • ${targetHosp.shortName}`
  }));

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
  }));

  return { success: true };
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
  }));
  return true;
}

/**
 * Explicit Patient Search / Pass Lookup
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

  // Demo Fallback: If no match found by query, automatically seed or log in DEMO_SCENARIO_PATIENTS_LIST[0]
  const fallbackPatient = state.patients.length > 0 ? state.patients[0] : DEMO_SCENARIO_PATIENTS_LIST[0];
  if (!state.patients.some(p => p.id === fallbackPatient.id)) {
    updateState(prev => ({
      ...prev,
      patients: [fallbackPatient, ...prev.patients]
    }));
  }
  selectAndLoginPatientAction(fallbackPatient.id);
  return { success: true, patients: [fallbackPatient] };
}

/**
 * Sign Out to Auth Gate Screen
 */
export function signOutAction() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(STORAGE_KEY);
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
  }));
}

/**
 * Login/Resolve patient directly from QR scan URL session or QR payload
 */
export function loginAsPatientWithSessionAction(sessionIdOrUhid: string, payloadBase64?: string): boolean {
  const clean = sessionIdOrUhid.trim().toUpperCase();
  let patient = state.patients.find(
    p => p.qrSessionId.toUpperCase() === clean || p.uhid.toUpperCase() === clean
  );

  // If not found in current state, auto-hydrate demo or decode encoded payload
  if (!patient) {
    if (payloadBase64) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(payloadBase64)));
        if (decoded && decoded.uhid) {
          const restoredPat: Patient = {
            id: decoded.id || `pat-${clean.toLowerCase()}`,
            uhid: decoded.uhid,
            qrSessionId: clean,
            name: decoded.name || 'Walk-in Patient',
            age: decoded.age || 45,
            gender: decoded.gender || 'Male',
            contact: decoded.contact || '',
            priority: decoded.priority || 'standard',
            doctorPriority: decoded.doctorPriority || 'normal',
            prescribedDoctorId: decoded.prescribedDoctorId || 'doc-on-duty',
            prescribedDoctorName: decoded.prescribedDoctorName || 'Attending Physician',
            prescribedDoctorRoom: decoded.prescribedDoctorRoom || 'Chamber 101',
            chiefComplaint: decoded.chiefComplaint || 'Consultation',
            symptoms: decoded.symptoms || '',
            prescribedTests: decoded.tests || [],
            prescribedTestItems: [],
            completedTests: decoded.completed || [],
            activeTokenIds: {},
            status: decoded.status || 'in_transit',
            assignedSmartRoute: decoded.route || decoded.tests || [],
            currentLockedDestinationTestId: decoded.locked || (decoded.tests ? decoded.tests[0] : undefined),
            registrationTime: decoded.regTime || 'Today',
            opdTokenNumber: decoded.token || `OPD-${clean}`,
            doctorReviewStatus: decoded.docStatus || 'awaiting_lab_reports'
          };
          updateState(prev => ({
            ...prev,
            patients: [restoredPat, ...prev.patients]
          }));
          patient = restoredPat;
        }
      } catch {
        // Ignore malformed payload
      }
    } else if (clean === 'QC-9411' || clean === 'QC-2026-9411' || clean === 'PAT-RAMESHWAR' || clean.includes('DEMO') || clean.includes('7886') || clean.startsWith('QC-')) {
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
    }));
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
    setLanguage: setLanguageAction,
    setSelectedPatientId: setSelectedPatientIdAction,
    setActiveBayDepartmentId: setActiveBayDepartmentIdAction,
    dismissCallingAlert: dismissCallingAlertAction,
    showToast: showToastAction,
    dismissToast: dismissToastAction,
    registerPatient: registerPatientAction,
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
    loadDemoScenario: loadDemoScenarioAction,
    loadDoctorDemoPatients: loadDoctorDemoPatientsAction,
    resetToCleanSlate: resetToCleanSlateAction,
    loginAsPatientWithSession: loginAsPatientWithSessionAction,
    loginDoctor: loginDoctorAction,
    loginLabTech: loginLabTechAction,
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
