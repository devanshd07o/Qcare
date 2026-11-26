// ==========================================
// Q-Care v2 Core Domain Types & Data Models
// ==========================================

export type PriorityLevel = 'emergency' | 'senior' | 'standard';
export type DoctorPriority = 'normal' | 'priority' | 'urgent';

export type TokenStatus = 
  | 'waiting' 
  | 'called' 
  | 'in_progress' 
  | 'completed' 
  | 'skipped' 
  | 'on_hold' 
  | 'awaiting_lab_reports' 
  | 'reports_ready';

export type DoctorReviewStatus = 
  | 'awaiting_prescription' 
  | 'awaiting_lab_reports' 
  | 'reports_ready' 
  | 'in_consultation' 
  | 'completed';

export type MetricFlag = 'normal' | 'high' | 'low' | 'critical';

export interface ClinicalMetric {
  label: string;
  value: string;
  unit: string;
  normalRange: string;
  flag: MetricFlag;
}

export interface ClinicalReport {
  id: string;
  testId: string;
  testName: string;
  technicalName?: string;
  patientId: string;
  patientUhid: string;
  patientName: string;
  technicianName: string;
  counterId: string;
  roomNo: string;
  timestamp: string;
  createdAtMs?: number;
  actualTurnaroundMinutes?: number;
  status: 'pending' | 'uploaded' | 'verified_by_doctor';
  summary: string;
  metrics: ClinicalMetric[];
  technicianNotes?: string;
  isCritical?: boolean;
  doctorNotes?: string;
  doctorSignature?: string;
}

export interface DepartmentLocation {
  building?: string;
  wing: string;
  floor: string;
  room: string;
  directions?: string;
  coordX?: number;
  coordY?: number;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  category: 'pathology' | 'cardiology' | 'radiology' | 'ultrasound' | 'biochemistry' | 'ophthalmology' | 'ent' | 'neurology' | 'pulmonary' | 'orthopedics';
  location: DepartmentLocation;
  accentColor: string;
  iconName: string;
  description: string;
  availabilityStatus?: 'available' | 'busy' | 'unavailable';
  totalMachines?: number;
  activeMachines?: number;
}

export interface DiagnosticTest {
  id: string;
  code: string;
  name: string;
  technicalName: string;
  departmentId: string;
  averageDurationMinutes: number;
  requiresFasting?: boolean;
  requiresFullBladder?: boolean;
  preparationNotes: string;
  prerequisites?: string[];
  standardPrice: number;
  defaultPriority?: DoctorPriority;
  metricTemplates?: {
    label: string;
    unit: string;
    normalRange: string;
    defaultValue?: string;
  }[];
}

export interface PrescribedTestItem {
  testId: string;
  testName: string;
  technicalName?: string;
  priority: DoctorPriority;
  notes?: string;
  preparationInstructions?: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  completedAt?: string;
  completedByStaff?: string;
}

export interface Counter {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  roomNo: string;
  technicianName: string;
  status: 'active' | 'paused' | 'closed';
  currentServingTokenId?: string;
  currentPatientId?: string;
  servedCountToday: number;
  averageServiceMinutes: number;
}

export interface QueueToken {
  id: string;
  tokenNumber: string; // e.g. "B-11", "OPD-14"
  patientId: string;
  patientName?: string;
  patientUhid?: string;
  patientAge?: number;
  patientGender?: string;
  testId: string;
  testName?: string;
  departmentId: string;
  counterId?: string;
  roomNo?: string;
  priority: PriorityLevel;
  doctorPriority?: DoctorPriority;
  status: TokenStatus;
  issuedAt: string;
  issuedAtMs?: number;
  calledAt?: string;
  calledAtMs?: number;
  completedAt?: string;
  completedAtMs?: number;
  queuePosition: number;
  estimatedWaitMinutes: number;
}

export interface Patient {
  id: string;
  uhid: string; // e.g. "QC-2026-9411"
  qrSessionId: string; // e.g. "QC-9411"
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  priority: PriorityLevel;
  doctorPriority?: DoctorPriority;
  prescribedDoctorId: string;
  prescribedDoctorName: string;
  prescribedDoctorRoom: string;
  chiefComplaint?: string;
  currentIllness?: string;
  symptoms?: string;
  prescribedTests: string[];
  prescribedTestItems?: PrescribedTestItem[];
  completedTests: string[];
  currentLockedDestinationTestId?: string; // Stability lock
  activeTokenIds: Record<string, string>; // testId -> tokenId
  status: 'registered' | 'in_transit' | 'in_test' | 'all_completed' | 'discharged';
  assignedSmartRoute: string[];
  registrationTime: string;
  registeredAtMs?: number;
  opdTokenNumber: string;
  doctorReviewStatus: DoctorReviewStatus;
  notes?: string;
}

export interface RouteStep {
  stepNumber: number;
  testId: string;
  testName: string;
  technicalName: string;
  testCode: string;
  departmentId: string;
  departmentName: string;
  location: DepartmentLocation;
  recommendedCounterId?: string;
  estimatedWaitMinutes: number;
  estimatedDurationMinutes: number;
  walkingTimeFromPrevMinutes: number;
  expectedStartTime: string;
  expectedEndTime: string;
  status: 'completed' | 'in_progress' | 'up_next' | 'queued';
  reasonForSequence: string;
  priority?: DoctorPriority;
  preparationNotes?: string;
  waitRangeText?: string;
}

export interface QueueRoutingPlan {
  patientId: string;
  calculatedAt: string;
  smartRouteSteps: RouteStep[];
  smartTotalTimeMinutes: number;
  naiveTotalTimeMinutes: number;
  timeSavedMinutes: number;
  percentageSaved: number;
  bottlenecksAvoided: string[];
  fastingSatisfied: boolean;
  transitTotalMinutes: number;
  recommendedNextTestId?: string;
  recommendationReason?: string;
}

export interface Hospital {
  id: string;
  name: string;
  code: string;
  shortName: string;
  tagline: string;
  address: string;
  city: string;
  contactNumber: string;
  doctorName: string;
  doctorRoom: string;
  doctorAvatar?: string;
  doctorGender?: 'Male' | 'Female';
  helpdeskPhone?: string;
  opdTimings?: string;
  locality?: string;
  officialWebsite?: string;
  aliases?: string[];
  departmentsList?: string[];
  diagnosticServicesList?: string[];
  dataStatus?: string;
}

export type UserRole = 'doctor' | 'patient' | 'lab_tech' | 'pharmacist';
export type DoctorPortalView = 'dashboard' | 'walkin' | 'queue' | 'reports' | 'records';

export interface CurrentUser {
  id: string;
  role: UserRole;
  name: string;
  identifier: string;
  subtitle?: string;
  assignedBayDepartmentId?: string;
  avatar?: string;
  gender?: 'Male' | 'Female';
}

export type Language = 'en' | 'hi';

// ==========================================
// Prescription & Pharmacy Domain Types
// ==========================================

export interface MedicationItem {
  id: string;
  drugName: string;
  genericName?: string;
  dose: string;
  frequency: string;
  duration: string;
  route: string;
  instructions?: string;
  quantity?: string;
  dispensed?: boolean;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  doctorId: string;
  doctorName: string;
  hospitalCode: string;
  issuedAt: string;
  validUntil?: string;
  medications: MedicationItem[];
  clinicalNotes?: string;
  diagnosis?: string;
  followUpDate?: string;
  status: 'active' | 'partially_dispensed' | 'fully_dispensed' | 'expired';
  dispensedAt?: string;
  dispensedBy?: string;
  dispensedPharmacy?: string;
}

export interface PharmacyDispenseRecord {
  id: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  pharmacistName: string;
  dispensedAt: string;
  medicationsDispensed: string[];
  notes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  hospitalCode: string;
  scheduledDate: string;
  scheduledTime: string;
  type: 'consultation' | 'follow_up' | 'emergency';
  status: 'booked' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  chiefComplaint?: string;
  notes?: string;
  createdAt: string;
}

export interface MedicineCatalogItem {
  id: string;
  brandName: string;
  genericName: string;
  category: string;
  commonDosages: string[];
  commonFrequencies: string[];
  commonRoutes: string[];
  commonDurations: string[];
}

export interface MedicalHistoryEntry {
  id: string;
  patientId: string;
  date: string;
  type: 'visit' | 'prescription' | 'lab_report' | 'appointment';
  title: string;
  summary: string;
  linkedId?: string;
}
