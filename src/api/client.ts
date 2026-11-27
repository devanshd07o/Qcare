// QCare API Client — Frontend ↔ Backend bridge
// All API calls go through here. Handles auth tokens, refresh, errors.

const API_BASE = import.meta.env['VITE_API_URL'] ?? 'http://localhost:4000/api';

function safeGetStorage(key: string): string | null {
  try {
    return typeof window !== 'undefined' && typeof localStorage?.getItem === 'function'
      ? localStorage.getItem(key)
      : null;
  } catch {
    return null;
  }
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage?.setItem === 'function') {
      localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage unavailability
  }
}

function safeRemoveStorage(key: string): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage?.removeItem === 'function') {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage unavailability
  }
}

// ── Token storage (memory + localStorage)
let accessToken: string | null = safeGetStorage('qcare_access_token');
let refreshTokenValue: string | null = safeGetStorage('qcare_refresh_token');

export function setTokens(at: string, rt: string): void {
  accessToken = at;
  refreshTokenValue = rt;
  safeSetStorage('qcare_access_token', at);
  safeSetStorage('qcare_refresh_token', rt);
}

export function clearTokens(): void {
  accessToken = null;
  refreshTokenValue = null;
  safeRemoveStorage('qcare_access_token');
  safeRemoveStorage('qcare_refresh_token');
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ── Core fetch wrapper with auto-refresh
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && retry && refreshTokenValue) {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (refreshRes.ok) {
        const { accessToken: newAt, refreshToken: newRt } = await refreshRes.json() as { accessToken: string; refreshToken: string };
        setTokens(newAt, newRt);
        return apiFetch<T>(path, options, false);
      }
    } catch {
      // Refresh failed — force logout
    }
    clearTokens();
    window.dispatchEvent(new CustomEvent('qcare:session-expired'));
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ user: ApiUser; hospital: ApiHospital; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: RegisterPayload) =>
    apiFetch<{ user: ApiUser; accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: (rt: string) =>
    apiFetch<{ message: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: rt }),
    }),

  me: () => apiFetch<{ user: ApiUser }>('/auth/me'),
};

// ── Hospitals API
export const hospitalApi = {
  list: () => apiFetch<{ hospitals: ApiHospital[] }>('/hospitals'),
  get: (code: string) => apiFetch<{ hospital: ApiHospital }>(`/hospitals/${code}`),
  getDoctors: (code: string) => apiFetch<{ doctors: ApiDoctor[] }>(`/hospitals/${code}/doctors`),
  getAnalytics: (code: string) => apiFetch<{ analytics: ApiAnalytics }>(`/hospitals/${code}/analytics`),
};

// ── Patients API
export const patientApi = {
  list: (query?: string, page = 1) =>
    apiFetch<{ patients: ApiPatientSummary[]; total: number; pages: number }>(
      `/patients?q=${query ?? ''}&page=${page}`
    ),

  get: (id: string) => apiFetch<{ patient: ApiPatient }>(`/patients/${id}`),

  getByQR: (sessionId: string) => apiFetch<{ patient: ApiPatient }>(`/patients/qr/${sessionId}`),

  register: (data: RegisterPatientPayload) =>
    apiFetch<{ patient: ApiPatient }>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ── Prescriptions API
export const prescriptionApi = {
  create: (data: CreatePrescriptionPayload) =>
    apiFetch<{ prescription: ApiPrescription }>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listForPatient: (patientId: string) =>
    apiFetch<{ prescriptions: ApiPrescription[] }>(`/prescriptions/patient/${patientId}`),

  get: (id: string) => apiFetch<{ prescription: ApiPrescription }>(`/prescriptions/${id}`),
};

// ── Pharmacy API
export const pharmacyApi = {
  scanQR: (sessionId: string) =>
    apiFetch<{ patient: ApiPatientSummary; prescriptions: ApiPrescription[] }>(`/pharmacy/scan/${sessionId}`),

  dispense: (data: DispensePayload) =>
    apiFetch<{ dispenseRecord: ApiDispenseRecord }>('/pharmacy/dispense', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  history: (patientId: string) =>
    apiFetch<{ records: ApiDispenseRecord[] }>(`/pharmacy/dispense-history/${patientId}`),
};

// ── Appointments API
export const appointmentApi = {
  book: (data: BookAppointmentPayload) =>
    apiFetch<{ appointment: ApiAppointment }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  doctorAppts: (doctorId: string, date?: string) =>
    apiFetch<{ appointments: ApiAppointment[] }>(`/appointments/doctor/${doctorId}${date ? `?date=${date}` : ''}`),

  patientAppts: (patientId: string) =>
    apiFetch<{ appointments: ApiAppointment[] }>(`/appointments/patient/${patientId}`),

  getSlots: (doctorId: string, date: string) =>
    apiFetch<{ slots: { time: string; available: boolean }[] }>(`/appointments/slots/${doctorId}/${date}`),

  updateStatus: (id: string, status: string) =>
    apiFetch<{ appointment: ApiAppointment }>(`/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ── Lab API
export const labApi = {
  uploadReport: (data: CreateLabReportPayload) =>
    apiFetch<{ report: ApiLabReport }>('/lab/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  patientReports: (patientId: string) =>
    apiFetch<{ reports: ApiLabReport[] }>(`/lab/reports/patient/${patientId}`),

  getReport: (id: string) => apiFetch<{ report: ApiLabReport }>(`/lab/reports/${id}`),

  getQueue: () => apiFetch<{ tokens: ApiQueueToken[] }>('/lab/queue'),

  updateTokenStatus: (tokenId: string, status: string) =>
    apiFetch<{ token: ApiQueueToken }>(`/lab/queue/${tokenId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ── Queue API
export const queueApi = {
  getTokens: (departmentId?: string) =>
    apiFetch<{ tokens: ApiQueueToken[] }>(`/queue/tokens${departmentId ? `?departmentId=${departmentId}` : ''}`),

  issueToken: (data: IssueTokenPayload) =>
    apiFetch<{ token: ApiQueueToken }>('/queue/tokens', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateToken: (id: string, status: string) =>
    apiFetch<{ token: ApiQueueToken }>(`/queue/tokens/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  patientTokens: (patientId: string) =>
    apiFetch<{ tokens: ApiQueueToken[] }>(`/queue/patient/${patientId}`),
};

// ── API Type Definitions
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: 'doctor' | 'lab_tech' | 'pharmacist' | 'admin';
  identifier: string;
  speciality?: string;
  gender?: string;
  avatar?: string;
  hospitalId: string;
}

export interface ApiDoctor {
  id: string;
  name: string;
  speciality: string;
  gender: string;
  avatar: string;
  identifier: string;
}

export interface ApiHospital {
  id: string;
  name: string;
  code: string;
  shortName: string;
  tagline: string;
  address: string;
  city: string;
  contactNumber: string;
  opdTimings?: string;
  departments?: ApiDepartment[];
}

export interface ApiDepartment {
  id: string;
  name: string;
  code: string;
  category: string;
  wing: string;
  floor: string;
  room: string;
  accentColor: string;
  counters?: ApiCounter[];
}

export interface ApiCounter {
  id: string;
  code: string;
  name: string;
  roomNo: string;
  status: string;
}

export interface ApiPatientSummary {
  id: string;
  uhid: string;
  qrSessionId: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  priority: string;
  createdAt: string;
}

export interface ApiPatient extends ApiPatientSummary {
  bloodGroup: string;
  address: string;
  allergies: string;
  chronicConditions: string;
  emergencyContact: string;
  prescriptions: ApiPrescription[];
  labReports: ApiLabReport[];
  appointments: ApiAppointment[];
  medicalHistory: ApiMedicalHistoryEntry[];
  queueTokens?: ApiQueueToken[];
}

export interface ApiMedication {
  id: string;
  drugName: string;
  genericName: string;
  dose: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
  quantity: string;
  dispensed: boolean;
  dispensedAt?: string;
}

export interface ApiPrescription {
  id: string;
  patientId: string;
  patientName?: string;
  patientUhid?: string;
  diagnosis: string;
  clinicalNotes: string;
  followUpDate: string;
  status: string;
  issuedAt: string;
  validUntil: string;
  dispensedAt?: string;
  dispensedBy?: string;
  dispensedPharmacy?: string;
  medications: ApiMedication[];
  doctor?: { name: string; speciality: string };
  patient?: { name: string; uhid: string; age: number; gender: string; allergies: string };
  hospital?: { name: string; address: string; contactNumber: string };
}

export interface ApiLabMetric {
  id: string;
  label: string;
  value: string;
  unit: string;
  normalRange: string;
  flag: string;
}

export interface ApiLabReport {
  id: string;
  testId: string;
  testName: string;
  technicalName: string;
  departmentId: string;
  status: string;
  summary: string;
  isCritical: boolean;
  doctorNotes: string;
  technicianName: string;
  createdAt: string;
  metrics: ApiLabMetric[];
  patient?: { name: string; uhid: string; age: number; gender: string };
  technician?: { name: string };
}

export interface ApiAppointment {
  id: string;
  patientId: string;
  scheduledDate: string;
  scheduledTime: string;
  type: string;
  status: string;
  chiefComplaint: string;
  notes: string;
  createdAt: string;
  doctor?: { name: string; speciality: string; gender?: string };
  patient?: { id: string; name: string; uhid: string; age: number; gender: string; contact: string };
  hospital?: { name: string; code: string };
}

export interface ApiDispenseRecord {
  id: string;
  pharmacyName: string;
  dispensedAt: string;
  notes: string;
  prescription?: ApiPrescription;
}

export interface ApiQueueToken {
  id: string;
  tokenNumber: string;
  patientId: string;
  testId: string;
  testName: string;
  departmentId: string;
  counterId: string;
  roomNo: string;
  priority: string;
  status: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
  issuedAt: string;
  calledAt?: string;
  completedAt?: string;
  patient?: { name: string; uhid: string; age: number; gender: string; priority: string };
}

export interface ApiMedicalHistoryEntry {
  id: string;
  date: string;
  type: string;
  title: string;
  summary: string;
}

export interface ApiAnalytics {
  totalPatients: number;
  todayPatients: number;
  totalPrescriptions: number;
  todayPrescriptions: number;
  activeTokens: number;
  totalReports: number;
}

// ── Payload types
export interface RegisterPayload {
  hospitalCode: string;
  role: 'doctor' | 'lab_tech' | 'pharmacist' | 'admin';
  name: string;
  email: string;
  password: string;
  identifier: string;
  speciality?: string;
  gender?: string;
}

export interface RegisterPatientPayload {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  bloodGroup?: string;
  address?: string;
  allergies?: string;
  chronicConditions?: string;
  emergencyContact?: string;
  priority?: 'standard' | 'senior' | 'emergency';
}

export interface CreatePrescriptionPayload {
  patientId: string;
  diagnosis?: string;
  clinicalNotes?: string;
  followUpDate?: string;
  validDays?: number;
  medications: {
    drugName: string;
    genericName?: string;
    dose: string;
    frequency: string;
    duration: string;
    route: string;
    instructions?: string;
    quantity?: string;
  }[];
}

export interface DispensePayload {
  prescriptionId: string;
  pharmacyName: string;
  medicationIds: string[];
  notes?: string;
}

export interface BookAppointmentPayload {
  patientId: string;
  doctorId: string;
  scheduledDate: string;
  scheduledTime: string;
  type?: 'consultation' | 'follow_up' | 'emergency';
  chiefComplaint?: string;
  notes?: string;
}

export interface CreateLabReportPayload {
  patientId: string;
  testId: string;
  testName: string;
  technicalName?: string;
  departmentId: string;
  counterId?: string;
  roomNo?: string;
  summary?: string;
  isCritical?: boolean;
  metrics?: { label: string; value: string; unit: string; normalRange: string; flag?: string }[];
}

export interface IssueTokenPayload {
  patientId: string;
  testId: string;
  testName: string;
  departmentId: string;
  counterId?: string;
  roomNo?: string;
  priority?: 'standard' | 'senior' | 'emergency';
  doctorPriority?: 'normal' | 'priority' | 'urgent';
}
