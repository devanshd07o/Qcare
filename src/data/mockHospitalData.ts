import {
  Hospital,
  Department,
  DiagnosticTest,
  Counter,
  Patient,
  QueueToken,
  ClinicalReport,
  CurrentUser,
  Prescription,
  MedicationItem
} from '../types';
import { MEDICINE_CATALOG } from './medicineCatalog';

export const DEFAULT_HOSPITAL: Hospital = {
  id: 'H001',
  name: 'Max Super Speciality Hospital, Saket',
  code: 'MAX-01',
  shortName: 'Max Saket',
  tagline: 'Tertiary Care & Smart Diagnostic Network',
  address: '1-2, Press Enclave Marg, Saket, New Delhi, Delhi 110017',
  city: 'New Delhi',
  locality: 'Saket',
  contactNumber: '+91 11 2651 5050',
  doctorName: 'Dr. Ananya Sen',
  doctorRoom: 'Chamber 204',
  doctorDesignation: 'Senior Consultant · Internal Medicine, MD',
  doctorAvatar: '/doctors/doctor_female_1.jpg',
  doctorGender: 'Female',
  helpdeskPhone: '+91 11 2651 5050',
  officialWebsite: 'https://www.maxhealthcare.in/hospital-network/max-super-speciality-hospital-saket',
  opdTimings: 'Mon – Sat: 08:30 AM – 04:30 PM',
  aliases: ['H001', 'MAX-01', 'MAX01', 'MAX', 'MAX SAKET'],
  departmentsList: ['Cardiology', 'Oncology', 'Neurology', 'Neurosurgery', 'Nephrology', 'General Surgery', 'Radiology and Imaging', 'Ophthalmology', 'Pulmonology', 'ENT'],
  diagnosticServicesList: ['CT', 'Ultrasound', 'Mammography', 'EEG', 'Laboratory services', 'OCT Retina', 'Spirometry', 'Audiometry'],
  dataStatus: 'public_reference_partial'
};

export const REGISTERED_HOSPITALS: Hospital[] = [
  DEFAULT_HOSPITAL,
  {
    id: 'H002',
    name: 'Indraprastha Apollo Hospitals',
    code: 'APOLLO-02',
    shortName: 'Apollo Delhi',
    tagline: 'Advanced Outpatient Flow & Multi-Speciality Diagnostics',
    address: 'NH-19, Jasola Vihar, New Delhi, Delhi 110020',
    city: 'New Delhi',
    locality: 'Jasola Vihar',
    contactNumber: '+91 11 7179 1090',
    doctorName: 'Dr. Rajesh Verma',
    doctorRoom: 'Chamber 101',
    doctorDesignation: 'Senior Consultant · Cardiology, DM',
    doctorAvatar: '/doctors/doctor_male_1.jpg',
    doctorGender: 'Male',
    helpdeskPhone: '+91 11 7179 1090',
    officialWebsite: 'https://www.apollohospitals.com/hospitals/apollo-hospitals-delhi',
    opdTimings: 'Mon – Sat: 08:00 AM – 05:00 PM',
    aliases: ['H002', 'APOLLO-02', 'APOLLO02', 'APOLLO', 'APOLLO DELHI', 'SARITA VIHAR'],
    departmentsList: ['Cardiology', 'Oncology', 'Orthopaedics', 'Neurology', 'Nephrology', 'Internal Medicine', 'ENT', 'Ophthalmology', 'Laboratory and Cardio Diagnostics'],
    diagnosticServicesList: ['Laboratory sample collection', 'Cardio diagnostics', 'Apollo Health Check', 'OCT Retina', 'EEG'],
    dataStatus: 'public_reference_partial'
  },
  {
    id: 'H003',
    name: 'All India Institute of Medical Sciences, New Delhi',
    code: 'AIIMS-03',
    shortName: 'AIIMS Delhi',
    tagline: 'Premier Autonomous Institute & Smart Referral Queue',
    address: 'Sri Aurobindo Marg, Ansari Nagar East, New Delhi, Delhi 110029',
    city: 'New Delhi',
    locality: 'Ansari Nagar East',
    contactNumber: '+91 11 2658 8500',
    doctorName: 'Dr. R. K. Singhal',
    doctorRoom: 'Chamber 12',
    doctorDesignation: 'Professor & Head · General Medicine',
    doctorAvatar: '/doctors/doctor_male_2.jpg',
    doctorGender: 'Male',
    helpdeskPhone: '+91 11 2658 8500',
    officialWebsite: 'https://www.aiims.edu/',
    opdTimings: 'Mon – Sat: 08:00 AM – 01:00 PM',
    aliases: ['H003', 'AIIMS-03', 'AIIMS03', 'AIIMS', 'AIIMS DELHI'],
    departmentsList: ['Cardiology', 'Neurology', 'Nephrology', 'Oncology', 'Radiodiagnosis', 'Pathology', 'Microbiology', 'Pulmonology', 'Ophthalmology'],
    diagnosticServicesList: ['Laboratory services', 'Radiology and imaging', 'Neurophysiology', 'Pulmonary function'],
    dataStatus: 'public_reference_partial'
  },
  {
    id: 'H004',
    name: 'Vardhman Mahavir Medical College and Safdarjung Hospital',
    code: 'SAFDARJUNG-04',
    shortName: 'Safdarjung Hospital',
    tagline: 'Central OPD & Multi-Laboratory Diagnostic Services',
    address: 'Ansari Nagar West, New Delhi, Delhi 110029',
    city: 'New Delhi',
    locality: 'Ansari Nagar West',
    contactNumber: '+91 11 2616 5060',
    doctorName: 'Dr. Sunita Batra',
    doctorRoom: 'Room 108',
    doctorDesignation: 'Consultant Physician · OPD Medicine',
    doctorAvatar: '/doctors/doctor_female_2.jpg',
    doctorGender: 'Female',
    helpdeskPhone: '+91 11 2616 5060',
    officialWebsite: 'https://vmmc-sjh.mohfw.gov.in/',
    opdTimings: 'Mon – Sat: 08:30 AM – 01:30 PM',
    aliases: ['H004', 'SAFDARJUNG-04', 'SAFDARJUNG04', 'SAFDARJUNG', 'SJH', 'SJH-04', 'VMMC'],
    departmentsList: ['Pathology', 'Microbiology', 'Biochemistry', 'Haematology', 'Radiodiagnosis', 'Cardiology', 'Neurology'],
    diagnosticServicesList: ['Central sample collection centre', 'Clinical pathology', 'Haematology', 'Molecular pathology', 'Blood bank and transfusion medicine', 'Emergency laboratory', 'Burns and plastic surgery laboratory', 'Gynaecology laboratory', 'HLA laboratory', 'Immunology laboratory', 'Histopathology and cytopathology'],
    dataStatus: 'public_reference_partial'
  },
  {
    id: 'H005',
    name: 'Atal Bihari Vajpayee Institute of Medical Sciences and Dr. Ram Manohar Lohia Hospital',
    code: 'RML-05',
    shortName: 'RML Hospital',
    tagline: 'Comprehensive Central Government Clinical & Diagnostic Wing',
    address: 'Baba Kharak Singh Road, New Delhi, Delhi 110001',
    city: 'New Delhi',
    locality: 'Connaught Place area',
    contactNumber: '+91 11 2336 5525',
    doctorName: 'Dr. Arvind Joshi',
    doctorRoom: 'Room 205',
    doctorDesignation: 'Senior Specialist · General Medicine',
    doctorAvatar: '/doctors/doctor_male_1.jpg',
    doctorGender: 'Male',
    helpdeskPhone: '+91 11 2336 5525',
    officialWebsite: 'https://rmlh.mohfw.gov.in/',
    opdTimings: 'Mon – Sat: 08:30 AM – 01:00 PM',
    aliases: ['H005', 'RML-05', 'RML05', 'RML', 'ABVIMS', 'RML HOSPITAL'],
    departmentsList: ['General Medicine', 'General Surgery', 'Orthopaedics', 'Obstetrics and Gynaecology', 'Paediatrics', 'Radiodiagnosis', 'Laboratory services'],
    diagnosticServicesList: ['Laboratory services', 'CT and ultrasound', 'X-ray', 'DEXA Scan'],
    dataStatus: 'public_reference_partial'
  },
  {
    id: 'H006',
    name: 'Lok Nayak Hospital',
    code: 'LNJP-06',
    shortName: 'LNJP Hospital',
    tagline: 'Tertiary Diagnostic & Trauma Care Flow Center',
    address: 'Jawaharlal Nehru Marg, Delhi Gate, New Delhi, Delhi 110002',
    city: 'New Delhi',
    locality: 'Delhi Gate',
    contactNumber: '+91 11 2323 3000',
    doctorName: 'Dr. Meenakshi Sundaram',
    doctorRoom: 'Chamber 14',
    doctorDesignation: 'Senior Consultant · Paediatrics & OPD',
    doctorAvatar: '/doctors/doctor_female_1.jpg',
    doctorGender: 'Female',
    helpdeskPhone: '+91 11 2323 3000',
    officialWebsite: 'https://lnjp.delhi.gov.in/',
    opdTimings: 'Mon – Sat: 08:00 AM – 02:00 PM',
    aliases: ['H006', 'LNJP-06', 'LNJP06', 'LNJP', 'LOK NAYAK', 'MAMC'],
    departmentsList: ['Pathology', 'Biochemistry', 'Microbiology', 'Paediatrics', 'Orthopaedics', 'General Surgery', 'Radiology'],
    diagnosticServicesList: ['Ultrasound and Doppler scheduling', 'CT scheduling', 'MRI scheduling', 'Emergency radiology', 'Trauma X-ray', 'OPD chest and abdomen X-ray'],
    dataStatus: 'public_reference_partial'
  }
];

export function findHospitalByQuery(query: string): Hospital | undefined {
  const clean = query.trim();
  if (!clean) return undefined;
  const normalizedCode = clean.toUpperCase().replace(/\s+/g, '-');
  const codeNoHyphen = clean.toUpperCase().replace(/[\s-]+/g, '');
  const rawLower = clean.toLowerCase();

  return REGISTERED_HOSPITALS.find(h => {
    if (h.id.toUpperCase() === clean.toUpperCase() || h.id.toUpperCase().replace(/[\s-]+/g, '') === codeNoHyphen) {
      return true;
    }

    const hCodeNorm = h.code.toUpperCase().replace(/\s+/g, '-');
    const hCodeNoHyphen = h.code.toUpperCase().replace(/[\s-]+/g, '');
    if (hCodeNorm === normalizedCode || hCodeNoHyphen === codeNoHyphen) {
      return true;
    }

    if (h.aliases && h.aliases.some(alias => {
      const aNorm = alias.toUpperCase().replace(/\s+/g, '-');
      const aNoHyphen = alias.toUpperCase().replace(/[\s-]+/g, '');
      return aNorm === normalizedCode || aNoHyphen === codeNoHyphen || aNorm === clean.toUpperCase() || aNoHyphen === clean.toUpperCase();
    })) {
      return true;
    }

    if (h.name.toLowerCase().includes(rawLower) || h.shortName.toLowerCase().includes(rawLower)) {
      return true;
    }
    if (h.locality && h.locality.toLowerCase().includes(rawLower)) {
      return true;
    }

    return false;
  });
}

// ==========================================
// STRUCTURED HOSPITAL CLINICAL LAYOUT CONFIG
// Single source of truth driving department & counter builders
// ==========================================

type DepartmentId =
  | 'dept-pathology'
  | 'dept-biochem'
  | 'dept-cardio'
  | 'dept-radiology'
  | 'dept-ultrasound'
  | 'dept-ophthalmology'
  | 'dept-ent'
  | 'dept-neurology'
  | 'dept-pulmonary'
  | 'dept-orthopedics';

interface DepartmentBaseSpec {
  id: DepartmentId;
  code: string;
  category: Department['category'];
  accentColor: string;
  iconName: string;
  defaultDescription: string;
  counterCode: string;
}

const DEPARTMENT_ORDER: readonly DepartmentBaseSpec[] = [
  { id: 'dept-pathology', code: 'BLD', category: 'pathology', accentColor: '#DC2626', iconName: 'Droplet', defaultDescription: 'Blood sample collection, CBC, routine hematology', counterCode: 'B-01' },
  { id: 'dept-biochem', code: 'BIO', category: 'biochemistry', accentColor: '#D97706', iconName: 'FlaskConical', defaultDescription: 'Fasting glucose, HbA1c, Lipid profile, renal panel', counterCode: 'BIO-01' },
  { id: 'dept-cardio', code: 'ECG', category: 'cardiology', accentColor: '#2563EB', iconName: 'Activity', defaultDescription: '12-lead digital ECG, cardiac rhythm evaluation', counterCode: 'E-01' },
  { id: 'dept-radiology', code: 'RAD', category: 'radiology', accentColor: '#7C3AED', iconName: 'ScanLine', defaultDescription: 'Low-dose digital X-Ray PA/Lateral views', counterCode: 'X-01' },
  { id: 'dept-ultrasound', code: 'USG', category: 'ultrasound', accentColor: '#0D9488', iconName: 'Waves', defaultDescription: 'Whole abdomen, pelvic, and Doppler sonography', counterCode: 'U-01' },
  { id: 'dept-ophthalmology', code: 'EYE', category: 'ophthalmology', accentColor: '#0284C7', iconName: 'Eye', defaultDescription: 'Optical Coherence Tomography (OCT), automated visual refraction', counterCode: 'EYE-01' },
  { id: 'dept-ent', code: 'ENT', category: 'ent', accentColor: '#D97706', iconName: 'Volume2', defaultDescription: 'Pure Tone Audiometry (PTA), Tympanometry and acoustic reflex evaluation', counterCode: 'ENT-01' },
  { id: 'dept-neurology', code: 'NEU', category: 'neurology', accentColor: '#9333EA', iconName: 'Brain', defaultDescription: '32-channel digital EEG, nerve conduction studies (NCS)', counterCode: 'NEU-01' },
  { id: 'dept-pulmonary', code: 'PFT', category: 'pulmonary', accentColor: '#059669', iconName: 'Wind', defaultDescription: 'Digital spirometry, flow-volume loops', counterCode: 'PFT-01' },
  { id: 'dept-orthopedics', code: 'DEX', category: 'orthopedics', accentColor: '#E11D48', iconName: 'Bone', defaultDescription: 'DEXA bone density scan for spine & hip', counterCode: 'DEX-01' }
];

interface DepartmentLayoutEntry {
  name: string;
  building: string;
  wing: string;
  floor: string;
  room: string;
  directions: string;
  machines: number;
  description?: string;
  counterId: string;
  counterName: string;
  technicianName: string;
  servedCountToday: number;
  averageServiceMinutes: number;
}

type HospitalClinicalLayout = Record<DepartmentId, DepartmentLayoutEntry>;

export const HOSPITAL_CLINICAL_LAYOUTS: Record<string, HospitalClinicalLayout> = {
  'MAX-01': {
    'dept-pathology': {
      name: 'Phlebotomy & Blood Lab',
      building: 'Diagnostic Plaza',
      wing: 'East Wing',
      floor: 'Ground Floor',
      room: 'Room 12',
      directions: 'From Dr. Ananya Sen (Chamber 204), take Central Tower lift to Ground Floor, cross lobby to Diagnostic Plaza Room 12.',
      machines: 2,
      description: 'Blood sample collection, CBC, ESR, routine microscopy',
      counterId: 'counter-phleb-1',
      counterName: 'Phlebotomy Bay Alpha',
      technicianName: 'Sunil Kumar',
      servedCountToday: 8,
      averageServiceMinutes: 5.5
    },
    'dept-biochem': {
      name: 'Biochemistry & Metabolic Lab',
      building: 'Diagnostic Plaza',
      wing: 'East Wing',
      floor: 'Ground Floor',
      room: 'Room 14',
      directions: 'Ground Floor Diagnostic Plaza, past Phlebotomy, at the end of the east clinical corridor.',
      machines: 2,
      counterId: 'counter-bio-1',
      counterName: 'Biochemistry Counter 1',
      technicianName: 'Anita Sen',
      servedCountToday: 6,
      averageServiceMinutes: 6.0
    },
    'dept-cardio': {
      name: 'Cardiology Diagnostic Suite',
      building: 'Central Tower',
      wing: 'Heart Institute Wing',
      floor: '1st Floor',
      room: 'Room 104',
      directions: 'Take Central Tower Elevator to 1st Floor, follow blue floor line to Heart Institute Suite 104.',
      machines: 2,
      counterId: 'counter-ecg-1',
      counterName: 'Cardiac Rhythm Station 1',
      technicianName: 'Vikram Das',
      servedCountToday: 5,
      averageServiceMinutes: 5.0
    },
    'dept-radiology': {
      name: 'Radiology & Digital Imaging',
      building: 'West Wing',
      wing: 'Imaging Block',
      floor: 'Basement 1',
      room: 'Room B-08',
      directions: 'Take West Wing service stairs or Lift 3 down to Basement 1, follow orange signage to Digital Radiography console.',
      machines: 1,
      counterId: 'counter-xray-1',
      counterName: 'Digital X-Ray Console',
      technicianName: 'Pooja Mehta',
      servedCountToday: 4,
      averageServiceMinutes: 7.0
    },
    'dept-ultrasound': {
      name: 'Ultrasonography & Doppler Suite',
      building: 'Diagnostic Plaza',
      wing: 'Sonography Wing',
      floor: 'Ground Floor',
      room: 'Room 10',
      directions: 'Ground Floor Diagnostic Plaza, adjacent to patient hydration lounge near Room 10.',
      machines: 1,
      counterId: 'counter-usg-1',
      counterName: 'Sonography Console A',
      technicianName: 'Dr. K. Sharma',
      servedCountToday: 3,
      averageServiceMinutes: 12.0
    },
    'dept-ophthalmology': {
      name: 'Ophthalmology & Retina Diagnostic Clinic',
      building: 'Central Tower',
      wing: 'Speciality OPD Wing',
      floor: '2nd Floor',
      room: 'Room 218',
      directions: 'Take Central Lift to 2nd Floor, turn right past OPD Pharmacy to Eye & Retina Clinic.',
      machines: 1,
      description: 'Optical Coherence Tomography (OCT), fundus photography, automated visual refraction',
      counterId: 'counter-eye-1',
      counterName: 'Ophthalmic OCT & Refraction Desk',
      technicianName: 'Dr. Vivek Nair',
      servedCountToday: 4,
      averageServiceMinutes: 9.0
    },
    'dept-ent': {
      name: 'ENT & Audiology Testing Suite',
      building: 'Central Tower',
      wing: 'Speech & Hearing Bay',
      floor: '1st Floor',
      room: 'Room 120',
      directions: '1st Floor Central Tower, enter Soundproof Audiometry Corridor, Room 120.',
      machines: 1,
      counterId: 'counter-ent-1',
      counterName: 'Audiometric Soundproof Chamber',
      technicianName: 'Megha Sen',
      servedCountToday: 3,
      averageServiceMinutes: 11.0
    },
    'dept-neurology': {
      name: 'Neuro-Electrophysiology Lab',
      building: 'Central Tower',
      wing: 'Neurosciences Suite',
      floor: '2nd Floor',
      room: 'Room 224',
      directions: '2nd Floor Central Tower, follow purple indicator to Neuro-Electrophysiology Lab 224.',
      machines: 1,
      description: '32-channel digital EEG, nerve conduction studies (NCS), evoked potentials',
      counterId: 'counter-neu-1',
      counterName: 'Neuro-Physiology Console 1',
      technicianName: 'Rajeev Pillai',
      servedCountToday: 2,
      averageServiceMinutes: 22.0
    },
    'dept-pulmonary': {
      name: 'Pulmonary Function & Spirometry Lab',
      building: 'West Wing',
      wing: 'Respiratory OPD',
      floor: 'Ground Floor',
      room: 'Room 116',
      directions: 'Ground Floor West Wing, entrance adjacent to Chest & Allergy Clinic.',
      machines: 1,
      description: 'Digital spirometry, flow-volume loops, bronchodilator reversibility testing',
      counterId: 'counter-pft-1',
      counterName: 'Pulmonary Spirometry Cabin',
      technicianName: 'Farhan Ali',
      servedCountToday: 5,
      averageServiceMinutes: 10.0
    },
    'dept-orthopedics': {
      name: 'Bone Mineral Densitometry (DEXA) Suite',
      building: 'West Wing',
      wing: 'Bone & Joint Imaging',
      floor: 'Basement 1',
      room: 'Room B-22',
      directions: 'Basement 1 West Wing, adjacent to MRI/CT reception desk, Room B-22.',
      machines: 1,
      description: 'Dual-energy X-ray absorptiometry (DEXA) for osteopenia/osteoporosis diagnosis',
      counterId: 'counter-dex-1',
      counterName: 'DEXA Bone Densitometer A',
      technicianName: 'Geeta Kumari',
      servedCountToday: 2,
      averageServiceMinutes: 15.0
    }
  },
  'SAFDARJUNG-04': {
    'dept-pathology': {
      name: 'Central Blood Collection Centre',
      building: 'New OPD Complex',
      wing: 'Gate 2 Corridor',
      floor: 'Ground Floor',
      room: 'Room 18',
      directions: 'From Dr. Sunita Batra (Room 108), turn right along the ground floor corridor towards Gate 2 exit; Room 18 is the Central Blood Collection Bay on your right.',
      machines: 3,
      counterId: 'counter-phleb-sjh',
      counterName: 'Central Phlebotomy Counter 1',
      technicianName: 'Ramesh Chander (Lab Asst)',
      servedCountToday: 12,
      averageServiceMinutes: 4.5
    },
    'dept-biochem': {
      name: 'Clinical Biochemistry Division',
      building: 'Main Hospital Block',
      wing: 'Clinical Biochemistry Wing',
      floor: '1st Floor',
      room: 'Room 114',
      directions: 'Take connecting ramp from New OPD to Main Hospital Block, take stairs/lift to 1st Floor; Room 114 is directly ahead.',
      machines: 2,
      counterId: 'counter-bio-sjh',
      counterName: 'Biochemistry Intake Desk',
      technicianName: 'Dr. Neeraj Bansal',
      servedCountToday: 9,
      averageServiceMinutes: 5.5
    },
    'dept-cardio': {
      name: 'Cardiology Non-Invasive Bay',
      building: 'Super Speciality Block (SSB)',
      wing: 'Cardiology Non-Invasive Wing',
      floor: '2nd Floor',
      room: 'Room 208',
      directions: 'Enter SSB glass entrance, take elevator to 2nd Floor, follow red heart signs to ECG Room 208.',
      machines: 2,
      counterId: 'counter-ecg-sjh',
      counterName: 'SSB Cardiac Rhythm Station',
      technicianName: 'Praveen Yadav',
      servedCountToday: 7,
      averageServiceMinutes: 5.0
    },
    'dept-radiology': {
      name: 'Central Digital Radiodiagnosis',
      building: 'Emergency & Trauma Block',
      wing: 'Trauma Radiodiagnosis Wing',
      floor: 'Ground Floor',
      room: 'Room 06',
      directions: 'Ground Floor Trauma Block corridor, Room 06 opposite the triage observation unit.',
      machines: 2,
      counterId: 'counter-xray-sjh',
      counterName: 'Trauma Digital Radiography Console',
      technicianName: 'Sunita Meena (Radiographer)',
      servedCountToday: 8,
      averageServiceMinutes: 6.5
    },
    'dept-ultrasound': {
      name: 'Ultrasound & Doppler Wing',
      building: 'New OPD Complex',
      wing: 'Antenatal & Doppler Diagnostic Wing',
      floor: '1st Floor',
      room: 'Room 112',
      directions: 'Take central escalator or lift in New OPD to 1st Floor; Room 112 is adjacent to Antenatal Clinic.',
      machines: 2,
      counterId: 'counter-usg-sjh',
      counterName: 'Doppler Sonography Suite 1',
      technicianName: 'Dr. Aarti Rawat',
      servedCountToday: 4,
      averageServiceMinutes: 12.0
    },
    'dept-ophthalmology': {
      name: 'Retina & Glaucoma Diagnostics',
      building: 'Eye OPD Wing',
      wing: 'Eye Diagnostics Section',
      floor: '2nd Floor',
      room: 'Room 210',
      directions: 'Take Eye OPD stairs to 2nd Floor, Room 210 for automated OCT & slit-lamp examination.',
      machines: 1,
      counterId: 'counter-eye-sjh',
      counterName: 'Eye OPD OCT Desk',
      technicianName: 'Satish Tyagi',
      servedCountToday: 5,
      averageServiceMinutes: 8.5
    },
    'dept-ent': {
      name: 'Audiology & Speech Pathology',
      building: 'ENT Block',
      wing: 'Speech & Hearing Bay',
      floor: '3rd Floor',
      room: 'Room 304',
      directions: 'ENT Block 3rd Floor, enter sound-damped corridor to Audiometry Room 304.',
      machines: 1,
      counterId: 'counter-ent-sjh',
      counterName: 'Audiology Sound Cabin',
      technicianName: 'Kavita Mathur',
      servedCountToday: 4,
      averageServiceMinutes: 12.0
    },
    'dept-neurology': {
      name: 'Neurophysiology Lab',
      building: 'Super Speciality Block (SSB)',
      wing: 'Neuro Diagnostic Wing',
      floor: '3rd Floor',
      room: 'Room 316',
      directions: 'Take SSB central lift to 3rd Floor, follow purple signs to Digital EEG Room 316.',
      machines: 1,
      counterId: 'counter-neu-sjh',
      counterName: 'SSB Neuro Console',
      technicianName: 'Deepak Sharma',
      servedCountToday: 3,
      averageServiceMinutes: 20.0
    },
    'dept-pulmonary': {
      name: 'Respiratory Medicine & Spirometry',
      building: 'New OPD Complex',
      wing: 'Chest OPD Wing',
      floor: 'Ground Floor',
      room: 'Room 104',
      directions: 'Ground Floor New OPD Complex, two doors down from Dr. Sunita Batra, Room 104.',
      machines: 1,
      counterId: 'counter-pft-sjh',
      counterName: 'Respiratory Spirometry Unit',
      technicianName: 'Mohd. Imran',
      servedCountToday: 6,
      averageServiceMinutes: 9.0
    },
    'dept-orthopedics': {
      name: 'Bone Mineral Densitometry (DEXA)',
      building: 'Trauma & Orthopaedics Block',
      wing: 'Bone Health Unit',
      floor: 'Basement 1',
      room: 'Room B-06',
      directions: 'Take elevator down to Basement 1 in Orthopaedics Block, Room B-06 on the left.',
      machines: 1,
      counterId: 'counter-dex-sjh',
      counterName: 'Trauma Bone Mineral Unit',
      technicianName: 'Vikas Kumar',
      servedCountToday: 3,
      averageServiceMinutes: 14.0
    }
  },
  'AIIMS-03': {
    'dept-pathology': {
      name: 'Central Sample Collection Wing',
      building: 'Rajkumari Amrit Kaur (RAK) OPD Block',
      wing: 'Central Blood Collection Hall',
      floor: 'Ground Floor',
      room: 'Room 15',
      directions: 'From Dr. R. K. Singhal (Chamber 12), follow green floor line directly to Central Blood Collection Hall (Room 15).',
      machines: 4,
      counterId: 'counter-phleb-aiims',
      counterName: 'RAK Central Sample Collection Counter',
      technicianName: 'Harish Rawat',
      servedCountToday: 15,
      averageServiceMinutes: 4.0
    },
    'dept-biochem': {
      name: 'Department of Biochemistry',
      building: 'Main Hospital Building',
      wing: 'Clinical Biochemistry Wing',
      floor: 'Ground Floor',
      room: 'Room 22',
      directions: 'Walk through covered corridor from RAK Block to Main Hospital Ground Floor, Room 22 on the left.',
      machines: 2,
      counterId: 'counter-bio-aiims',
      counterName: 'Biochemistry Routine Counter',
      technicianName: 'Dr. S. K. Jain',
      servedCountToday: 11,
      averageServiceMinutes: 5.0
    },
    'dept-cardio': {
      name: 'Cardiology Non-Invasive Lab',
      building: 'RAK OPD Block',
      wing: 'Cardiology OPD',
      floor: '1st Floor',
      room: 'Room 108',
      directions: 'Take RAK Block central staircase to 1st Floor, Room 108 near ECG testing counters.',
      machines: 2,
      counterId: 'counter-ecg-aiims',
      counterName: 'Cardiology OPD ECG Bay',
      technicianName: 'Manoj Tiwari',
      servedCountToday: 9,
      averageServiceMinutes: 4.5
    },
    'dept-radiology': {
      name: 'Department of Radiodiagnosis',
      building: 'Dr. B.R. Ambedkar Block',
      wing: 'Imaging Wing',
      floor: 'Ground Floor',
      room: 'Room 05',
      directions: 'Ground Floor Ambedkar Block, follow blue signage to Digital Chest Radiography counter (Room 05).',
      machines: 2,
      counterId: 'counter-xray-aiims',
      counterName: 'Ambedkar Block Digital X-Ray',
      technicianName: 'Preeti Deshmukh',
      servedCountToday: 10,
      averageServiceMinutes: 6.0
    },
    'dept-ultrasound': {
      name: 'Ultrasound Diagnostic Section',
      building: 'RAK OPD Block',
      wing: 'Ultrasound Diagnostic Section',
      floor: 'Ground Floor',
      room: 'Room 19',
      directions: 'Ground Floor RAK Block, past the pharmacy counter to Room 19 waiting area.',
      machines: 2,
      counterId: 'counter-usg-aiims',
      counterName: 'RAK Sonography Console',
      technicianName: 'Dr. R. K. Goel',
      servedCountToday: 5,
      averageServiceMinutes: 11.0
    },
    'dept-ophthalmology': {
      name: 'Dr. R.P. Centre for Ophthalmic Sciences',
      building: 'Dr. R.P. Centre for Ophthalmic Sciences',
      wing: 'Retina & Diagnostics Wing',
      floor: '1st Floor',
      room: 'Room 102',
      directions: 'Cross to Dr. R.P. Centre, take lift to 1st Floor, Room 102 (OCT & Refraction Lab).',
      machines: 1,
      counterId: 'counter-eye-aiims',
      counterName: 'RPC Retina Imaging Station',
      technicianName: 'Alok Pandey',
      servedCountToday: 6,
      averageServiceMinutes: 8.0
    },
    'dept-ent': {
      name: 'Speech & Hearing Clinic',
      building: 'RAK OPD Block',
      wing: 'Speech & Hearing Clinic',
      floor: '2nd Floor',
      room: 'Room 212',
      directions: '2nd Floor RAK Block, soundproof audiometry testing chamber Room 212.',
      machines: 1,
      counterId: 'counter-ent-aiims',
      counterName: 'Speech & Hearing Audiometry Booth',
      technicianName: 'Vandana Rao',
      servedCountToday: 4,
      averageServiceMinutes: 13.0
    },
    'dept-neurology': {
      name: 'Clinical Neurophysiology Lab',
      building: 'Neuro-Sciences Centre (NSC)',
      wing: 'Clinical Neurophysiology Lab',
      floor: '1st Floor',
      room: 'Room 118',
      directions: 'NSC Building 1st Floor, enter Neurophysiology corridor to EEG Console 118.',
      machines: 1,
      counterId: 'counter-neu-aiims',
      counterName: 'NSC Neurophysiology Console',
      technicianName: 'Subhashish Roy',
      servedCountToday: 4,
      averageServiceMinutes: 20.0
    },
    'dept-pulmonary': {
      name: 'Pulmonary Function Laboratory',
      building: 'Department of Pulmonary Medicine',
      wing: 'Spirometry & Allergy Lab',
      floor: 'Ground Floor',
      room: 'Room 14',
      directions: 'Ground Floor Pulmonary Wing, follow orange line to Spirometry Cabin Room 14.',
      machines: 1,
      counterId: 'counter-pft-aiims',
      counterName: 'Pulmonary Function Station',
      technicianName: 'Devender Negi',
      servedCountToday: 7,
      averageServiceMinutes: 9.5
    },
    'dept-orthopedics': {
      name: 'Bone Densitometry Unit',
      building: 'Dr. B.R. Ambedkar Block',
      wing: 'Bone Densitometry Unit',
      floor: 'Basement 1',
      room: 'Room B-02',
      directions: 'Take lift to Basement 1 Ambedkar Block, DEXA Bone Mineral Scan Unit Room B-02.',
      machines: 1,
      counterId: 'counter-dex-aiims',
      counterName: 'Ambedkar Block Bone Density Unit',
      technicianName: 'Sanjay Mishra',
      servedCountToday: 3,
      averageServiceMinutes: 15.0
    }
  },
  'APOLLO-02': {
    'dept-pathology': {
      name: 'Central Phlebotomy Lounge',
      building: 'Apollo Health Check Block',
      wing: 'Central Phlebotomy Hall',
      floor: 'Ground Floor',
      room: 'Room 102',
      directions: 'From Dr. Rajesh Verma (Chamber 101), take connecting ramp to Apollo Health Check Block Ground Floor, Room 102.',
      machines: 2,
      counterId: 'counter-phleb-apollo',
      counterName: 'Health Check Phlebotomy Lounge',
      technicianName: 'Amit Saxena',
      servedCountToday: 10,
      averageServiceMinutes: 5.0
    },
    'dept-biochem': {
      name: 'Metabolic & Endocrine Lab',
      building: 'Apollo Health Check Block',
      wing: 'Metabolic & Endocrine Lab',
      floor: 'Ground Floor',
      room: 'Room 106',
      directions: 'Ground Floor Health Check Block, proceed past Phlebotomy to Room 106 counter.',
      machines: 2,
      counterId: 'counter-bio-apollo',
      counterName: 'Metabolic Testing Desk',
      technicianName: 'Dr. Malini Roy',
      servedCountToday: 8,
      averageServiceMinutes: 5.5
    },
    'dept-cardio': {
      name: 'Non-Invasive Cardiology Suite',
      building: 'Apollo Heart Centre',
      wing: 'Non-Invasive Cardiology',
      floor: '2nd Floor',
      room: 'Room 204',
      directions: 'Take Heart Centre glass lift to 2nd Floor, follow red cardiac icon to Room 204.',
      machines: 2,
      counterId: 'counter-ecg-apollo',
      counterName: 'Heart Centre ECG Console',
      technicianName: 'Tanvi Kapoor',
      servedCountToday: 7,
      averageServiceMinutes: 4.5
    },
    'dept-radiology': {
      name: 'Digital Radiography Console',
      building: 'Diagnostic Radiology Tower',
      wing: 'Digital Imaging Bay',
      floor: 'Basement 1',
      room: 'Room B-04',
      directions: 'Take Tower Elevator down to Basement 1, follow yellow pathway to X-Ray Bay B-04.',
      machines: 2,
      counterId: 'counter-xray-apollo',
      counterName: 'Radiology Tower X-Ray Console',
      technicianName: 'Rohan Vashist',
      servedCountToday: 6,
      averageServiceMinutes: 6.5
    },
    'dept-ultrasound': {
      name: 'Diagnostic Ultrasound Suite',
      building: 'Apollo Health Check Block',
      wing: 'Ultrasound Suite',
      floor: 'Ground Floor',
      room: 'Room 110',
      directions: 'Ground Floor Health Check Block, opposite Patient Helpdesk Lounge, Room 110.',
      machines: 2,
      counterId: 'counter-usg-apollo',
      counterName: 'Health Check Sonography A',
      technicianName: 'Dr. Sameer Khan',
      servedCountToday: 4,
      averageServiceMinutes: 12.0
    },
    'dept-ophthalmology': {
      name: 'Apollo Retina & OCT Centre',
      building: 'Main Hospital Block',
      wing: 'Apollo Eye Clinic',
      floor: '2nd Floor',
      room: 'Room 308',
      directions: 'Take Lift A to 2nd Floor, walk straight to Apollo Retina & OCT Centre 308.',
      machines: 1,
      counterId: 'counter-eye-apollo',
      counterName: 'Apollo Retina OCT Desk',
      technicianName: 'Nisha Gupta',
      servedCountToday: 5,
      averageServiceMinutes: 8.5
    },
    'dept-ent': {
      name: 'ENT & Cochlear Implant Bay',
      building: 'Main Hospital Block',
      wing: 'ENT & Cochlear Implant Bay',
      floor: '1st Floor',
      room: 'Room 215',
      directions: '1st Floor Main Block, corridor next to Audiology booth 215.',
      machines: 1,
      counterId: 'counter-ent-apollo',
      counterName: 'Cochlear & Audiology Chamber',
      technicianName: 'Aditya Sen',
      servedCountToday: 3,
      averageServiceMinutes: 12.0
    },
    'dept-neurology': {
      name: 'Neurosciences EEG & Sleep Lab',
      building: 'Neurosciences Tower',
      wing: 'EEG & Sleep Lab',
      floor: '2nd Floor',
      room: 'Room 220',
      directions: '2nd Floor Neurosciences Tower, entrance through Room 220.',
      machines: 1,
      counterId: 'counter-neu-apollo',
      counterName: 'Neurosciences EEG Cabin',
      technicianName: 'Dr. Priya Nambiar',
      servedCountToday: 3,
      averageServiceMinutes: 20.0
    },
    'dept-pulmonary': {
      name: 'Pulmonary Function Clinic',
      building: 'Main Hospital Block',
      wing: 'Chest & Sleep Diagnostics',
      floor: 'Ground Floor',
      room: 'Room 112',
      directions: 'Ground Floor Main Block, near West Gate exit, Room 112.',
      machines: 1,
      counterId: 'counter-pft-apollo',
      counterName: 'Pulmonary Diagnostic Console',
      technicianName: 'Karan Mehra',
      servedCountToday: 5,
      averageServiceMinutes: 9.0
    },
    'dept-orthopedics': {
      name: 'Bone Mineral Density Bay',
      building: 'Diagnostic Radiology Tower',
      wing: 'Bone Mineral Density Bay',
      floor: 'Basement 1',
      room: 'Room B-12',
      directions: 'Basement 1 Radiology Tower, corridor next to X-Ray console, Room B-12.',
      machines: 1,
      counterId: 'counter-dex-apollo',
      counterName: 'Bone Mineral Density Console',
      technicianName: 'Suresh Raina',
      servedCountToday: 3,
      averageServiceMinutes: 14.0
    }
  },
  'RML-05': {
    'dept-pathology': {
      name: 'Central Phlebotomy Hall',
      building: 'New Multi-Storey OPD Building',
      wing: 'Central Phlebotomy Hall',
      floor: 'Ground Floor',
      room: 'Counter 6',
      directions: 'Ground Floor OPD Hall near entrance, Counter 6 for blood draw and token verification.',
      machines: 2,
      counterId: 'counter-phleb-rml',
      counterName: 'OPD Blood Collection Counter 6',
      technicianName: 'Babulal Meena',
      servedCountToday: 14,
      averageServiceMinutes: 4.5
    },
    'dept-biochem': {
      name: 'Central Biochemistry Lab',
      building: 'Central Laboratory Block',
      wing: 'Biochemistry Division',
      floor: '1st Floor',
      room: 'Room 110',
      directions: '1st Floor Central Lab Block, follow blue corridor strip to Room 110.',
      machines: 2,
      counterId: 'counter-bio-rml',
      counterName: 'Central Lab Biochemistry Counter',
      technicianName: 'Dr. Vandana Garg',
      servedCountToday: 9,
      averageServiceMinutes: 5.5
    },
    'dept-cardio': {
      name: 'Cardiology Diagnostic Bay',
      building: 'Cardiology & CTVS Wing',
      wing: 'Cardiac OPD',
      floor: '2nd Floor',
      room: 'Room 214',
      directions: '2nd Floor Cardiology Wing, follow red heart line to ECG Room 214.',
      machines: 2,
      counterId: 'counter-ecg-rml',
      counterName: 'Cardiology CTVS Rhythm Desk',
      technicianName: 'Gaurav Bisht',
      servedCountToday: 8,
      averageServiceMinutes: 4.5
    },
    'dept-radiology': {
      name: 'Digital Radiography Unit',
      building: 'Radiodiagnosis Block',
      wing: 'Digital Radiography Unit',
      floor: 'Ground Floor',
      room: 'Room 08',
      directions: 'Ground Floor Radiodiagnosis Block, entrance opposite Casualty, Room 08.',
      machines: 2,
      counterId: 'counter-xray-rml',
      counterName: 'Radiodiagnosis Block Console',
      technicianName: 'Pankaj Srivastava',
      servedCountToday: 8,
      averageServiceMinutes: 6.0
    },
    'dept-ultrasound': {
      name: 'Diagnostic Ultrasound Suite',
      building: 'New OPD Building',
      wing: 'Diagnostic Ultrasound Suite',
      floor: '1st Floor',
      room: 'Room 118',
      directions: '1st Floor OPD Building, next to gynaecological consultation rooms, Room 118.',
      machines: 2,
      counterId: 'counter-usg-rml',
      counterName: 'OPD Sonography Console 1',
      technicianName: 'Dr. Nidhi Batra',
      servedCountToday: 4,
      averageServiceMinutes: 12.0
    },
    'dept-ophthalmology': {
      name: 'Ophthalmic Diagnostics Clinic',
      building: 'New OPD Building',
      wing: 'Ophthalmic Diagnostics',
      floor: '3rd Floor',
      room: 'Room 302',
      directions: '3rd Floor OPD Building, follow eye icon to OCT Retina Clinic 302.',
      machines: 1,
      counterId: 'counter-eye-rml',
      counterName: 'Ophthalmic OCT & Refraction Clinic',
      technicianName: 'Ashok Sehgal',
      servedCountToday: 4,
      averageServiceMinutes: 8.5
    },
    'dept-ent': {
      name: 'Audiology Cabin',
      building: 'New OPD Building',
      wing: 'Audiology Cabin',
      floor: '2nd Floor',
      room: 'Room 222',
      directions: '2nd Floor OPD Building, opposite Dr. Arvind Joshi (Room 205), Room 222.',
      machines: 1,
      counterId: 'counter-ent-rml',
      counterName: 'Audiology Cabin Console',
      technicianName: 'Archana Singh',
      servedCountToday: 3,
      averageServiceMinutes: 11.5
    },
    'dept-neurology': {
      name: 'Neurology Department Console',
      building: 'Super Speciality Wing',
      wing: 'Neurology Department',
      floor: '4th Floor',
      room: 'Room 408',
      directions: 'Take Super Speciality lift to 4th Floor, Room 408 EEG & EMG console.',
      machines: 1,
      counterId: 'counter-neu-rml',
      counterName: 'Neurology Department Console',
      technicianName: 'Vinod Nair',
      servedCountToday: 3,
      averageServiceMinutes: 21.0
    },
    'dept-pulmonary': {
      name: 'Spirometry Cabin',
      building: 'New OPD Building',
      wing: 'Chest & TB Clinic',
      floor: 'Ground Floor',
      room: 'Room 102',
      directions: 'Ground Floor OPD Building, near South Gate, Spirometry Cabin 102.',
      machines: 1,
      counterId: 'counter-pft-rml',
      counterName: 'Spirometry Cabin Desk',
      technicianName: 'Lalit Joshi',
      servedCountToday: 5,
      averageServiceMinutes: 9.5
    },
    'dept-orthopedics': {
      name: 'DEXA Bone Suite',
      building: 'Radiodiagnosis Block',
      wing: 'DEXA Bone Suite',
      floor: 'Basement 1',
      room: 'Room B-04',
      directions: 'Basement 1 Radiodiagnosis Block, next to MRI reception, Room B-04.',
      machines: 1,
      counterId: 'counter-dex-rml',
      counterName: 'Radiodiagnosis Bone Suite Console',
      technicianName: 'Dharmendra Kumar',
      servedCountToday: 2,
      averageServiceMinutes: 14.5
    }
  },
  'LNJP-06': {
    'dept-pathology': {
      name: 'Main Blood Sample Bay',
      building: 'Main OPD Block',
      wing: 'Central Phlebotomy Bay',
      floor: 'Ground Floor',
      room: 'Room 11',
      directions: 'From Dr. Meenakshi Sundaram (Chamber 14), walk to Ground Floor Main OPD, near registration counter, Room 11 Blood Sample Bay.',
      machines: 2,
      counterId: 'counter-phleb-lnjp',
      counterName: 'Main OPD Blood Sample Bay',
      technicianName: 'Mohan Lal',
      servedCountToday: 13,
      averageServiceMinutes: 4.5
    },
    'dept-biochem': {
      name: 'Central Biochemistry Section',
      building: 'Central Clinical Lab Building',
      wing: 'Biochemistry Section',
      floor: '1st Floor',
      room: 'Room 105',
      directions: '1st Floor Clinical Lab Building, follow green corridor to Room 105.',
      machines: 2,
      counterId: 'counter-bio-lnjp',
      counterName: 'Clinical Lab Biochemistry Desk',
      technicianName: 'Dr. Renu Aggarwal',
      servedCountToday: 9,
      averageServiceMinutes: 5.5
    },
    'dept-cardio': {
      name: 'Cardiac Diagnostic Bay',
      building: 'Main OPD Block',
      wing: 'Cardiac Diagnostic Bay',
      floor: '1st Floor',
      room: 'Room 122',
      directions: '1st Floor OPD Block, same corridor as Dr. Meenakshi Sundaram, Room 122.',
      machines: 2,
      counterId: 'counter-ecg-lnjp',
      counterName: 'Cardiac OPD Rhythm Station',
      technicianName: 'Tarun Verma',
      servedCountToday: 7,
      averageServiceMinutes: 4.5
    },
    'dept-radiology': {
      name: 'Digital X-Ray Section',
      building: 'Trauma & Emergency Imaging Block',
      wing: 'Digital X-Ray Section',
      floor: 'Ground Floor',
      room: 'Room 04',
      directions: 'Ground Floor Imaging Block, follow yellow signage to Room 04.',
      machines: 2,
      counterId: 'counter-xray-lnjp',
      counterName: 'Trauma & Emergency X-Ray Unit',
      technicianName: 'Jagdish Prasad',
      servedCountToday: 8,
      averageServiceMinutes: 6.0
    },
    'dept-ultrasound': {
      name: 'Sonography Wing',
      building: 'Main OPD Block',
      wing: 'Sonography Wing',
      floor: 'Ground Floor',
      room: 'Room 16',
      directions: 'Ground Floor OPD Block, adjacent to Gynae OPD, Room 16.',
      machines: 2,
      counterId: 'counter-usg-lnjp',
      counterName: 'Main OPD Sonography Console',
      technicianName: 'Dr. Seema Malik',
      servedCountToday: 4,
      averageServiceMinutes: 12.0
    },
    'dept-ophthalmology': {
      name: 'Guru Nanak Eye Centre (GNEC)',
      building: 'Guru Nanak Eye Centre (GNEC)',
      wing: 'Retina & OCT Diagnostic Unit',
      floor: '1st Floor',
      room: 'Room 110',
      directions: 'Walk to Guru Nanak Eye Centre adjacent block, 1st Floor, Room 110.',
      machines: 1,
      counterId: 'counter-eye-lnjp',
      counterName: 'Guru Nanak Eye Centre Desk',
      technicianName: 'Mahesh Chand',
      servedCountToday: 4,
      averageServiceMinutes: 8.5
    },
    'dept-ent': {
      name: 'Audiology & Speech Clinic',
      building: 'Main OPD Block',
      wing: 'Audiology & Speech Clinic',
      floor: '2nd Floor',
      room: 'Room 208',
      directions: '2nd Floor Main OPD, Soundproof Testing Chamber 208.',
      machines: 1,
      counterId: 'counter-ent-lnjp',
      counterName: 'Speech & Hearing Audiometry Desk',
      technicianName: 'Sunita Chauhan',
      servedCountToday: 3,
      averageServiceMinutes: 12.0
    },
    'dept-neurology': {
      name: 'LNJP / G.B. Pant Neuro Lab',
      building: 'G.B. Pant / LNJP Neuro Wing',
      wing: 'Neurophysiology Lab',
      floor: '2nd Floor',
      room: 'Room 215',
      directions: '2nd Floor Neuro Wing, enter Room 215 for digital EEG and nerve studies.',
      machines: 1,
      counterId: 'counter-neu-lnjp',
      counterName: 'G.B. Pant / LNJP Neuro Lab Console',
      technicianName: 'Pradeep Jha',
      servedCountToday: 3,
      averageServiceMinutes: 21.0
    },
    'dept-pulmonary': {
      name: 'PFT Suite',
      building: 'Chest Clinic & Respiratory Unit',
      wing: 'PFT Suite',
      floor: 'Ground Floor',
      room: 'Room 108',
      directions: 'Ground Floor Chest Clinic, Room 108 Spirometry and allergen testing.',
      machines: 1,
      counterId: 'counter-pft-lnjp',
      counterName: 'Chest Clinic Spirometry Unit',
      technicianName: 'Rameshwar Dayal',
      servedCountToday: 6,
      averageServiceMinutes: 9.0
    },
    'dept-orthopedics': {
      name: 'Bone Mineral Densitometry',
      building: 'Orthopaedic Centre',
      wing: 'Bone Mineral Densitometry',
      floor: 'Basement 1',
      room: 'Room B-02',
      directions: 'Basement 1 Orthopaedic Centre, Room B-02 adjacent to Plaster Room.',
      machines: 1,
      counterId: 'counter-dex-lnjp',
      counterName: 'Orthopaedic Centre BMD Unit',
      technicianName: 'Devraj Singh',
      servedCountToday: 2,
      averageServiceMinutes: 15.0
    }
  }
};

function resolveLayoutCode(hospitalOrCode?: Hospital | string): string {
  if (!hospitalOrCode) return DEFAULT_HOSPITAL.code;
  const query = typeof hospitalOrCode === 'string'
    ? hospitalOrCode
    : (hospitalOrCode.code || hospitalOrCode.id);
  const matched = findHospitalByQuery(query);
  if (matched && HOSPITAL_CLINICAL_LAYOUTS[matched.code]) {
    return matched.code;
  }
  const normalized = query.trim().toUpperCase().replace(/\s+/g, '-');
  return HOSPITAL_CLINICAL_LAYOUTS[normalized] ? normalized : DEFAULT_HOSPITAL.code;
}

export function buildHospitalDepartments(hospitalOrCode: Hospital | string = DEFAULT_HOSPITAL): Department[] {
  const layout = HOSPITAL_CLINICAL_LAYOUTS[resolveLayoutCode(hospitalOrCode)];
  return DEPARTMENT_ORDER.map(spec => {
    const entry = layout[spec.id];
    return {
      id: spec.id,
      name: entry.name,
      code: spec.code,
      category: spec.category,
      location: {
        building: entry.building,
        wing: entry.wing,
        floor: entry.floor,
        room: entry.room,
        directions: entry.directions
      },
      accentColor: spec.accentColor,
      iconName: spec.iconName,
      description: entry.description ?? spec.defaultDescription,
      activeMachines: entry.machines,
      totalMachines: entry.machines,
      availabilityStatus: 'available'
    };
  });
}

export function buildHospitalCounters(hospitalOrCode: Hospital | string = DEFAULT_HOSPITAL): Counter[] {
  const layout = HOSPITAL_CLINICAL_LAYOUTS[resolveLayoutCode(hospitalOrCode)];
  return DEPARTMENT_ORDER.map(spec => {
    const entry = layout[spec.id];
    return {
      id: entry.counterId,
      code: spec.counterCode,
      name: entry.counterName,
      departmentId: spec.id,
      roomNo: entry.room,
      technicianName: entry.technicianName,
      status: 'active',
      servedCountToday: entry.servedCountToday,
      averageServiceMinutes: entry.averageServiceMinutes
    };
  });
}

export const INITIAL_DEPARTMENTS: Department[] = buildHospitalDepartments(DEFAULT_HOSPITAL);
export const INITIAL_COUNTERS: Counter[] = buildHospitalCounters(DEFAULT_HOSPITAL);

export const HOSPITAL_DEPARTMENTS_MAP: Record<string, Department[]> = REGISTERED_HOSPITALS.reduce<Record<string, Department[]>>(
  (acc, hospital) => {
    const depts = buildHospitalDepartments(hospital);
    acc[hospital.code] = depts;
    acc[hospital.id] = depts;
    return acc;
  },
  {}
);

export const HOSPITAL_COUNTERS_MAP: Record<string, Counter[]> = REGISTERED_HOSPITALS.reduce<Record<string, Counter[]>>(
  (acc, hospital) => {
    const counters = buildHospitalCounters(hospital);
    acc[hospital.code] = counters;
    acc[hospital.id] = counters;
    return acc;
  },
  {}
);

export function getDepartmentsForHospital(query: string): Department[] {
  if (!query) return INITIAL_DEPARTMENTS;
  const hosp = findHospitalByQuery(query);
  const code = (hosp ? hosp.code : query).toUpperCase().replace(/\s+/g, '-');
  if (HOSPITAL_DEPARTMENTS_MAP[code]) {
    return HOSPITAL_DEPARTMENTS_MAP[code];
  }
  const id = (hosp ? hosp.id : query).toUpperCase();
  if (HOSPITAL_DEPARTMENTS_MAP[id]) {
    return HOSPITAL_DEPARTMENTS_MAP[id];
  }
  return INITIAL_DEPARTMENTS;
}

export function getCountersForHospital(query: string): Counter[] {
  if (!query) return INITIAL_COUNTERS;
  const hosp = findHospitalByQuery(query);
  const code = (hosp ? hosp.code : query).toUpperCase().replace(/\s+/g, '-');
  if (HOSPITAL_COUNTERS_MAP[code]) {
    return HOSPITAL_COUNTERS_MAP[code];
  }
  const id = (hosp ? hosp.id : query).toUpperCase();
  if (HOSPITAL_COUNTERS_MAP[id]) {
    return HOSPITAL_COUNTERS_MAP[id];
  }
  return INITIAL_COUNTERS;
}

export const INITIAL_TESTS: DiagnosticTest[] = [
  {
    id: 'test-fbs',
    code: 'BIO-101',
    name: 'Blood Sugar Fasting',
    technicalName: 'Fasting Blood Glucose (FBG)',
    departmentId: 'dept-biochem',
    averageDurationMinutes: 6,
    requiresFasting: true,
    requiresFullBladder: false,
    preparationNotes: 'Empty stomach / Fasting sample (8-10 hours overnight fasting required)',
    standardPrice: 150,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Fasting Blood Glucose', unit: 'mg/dL', normalRange: '70 - 99', defaultValue: '142' }
    ]
  },
  {
    id: 'test-cbc',
    code: 'BLD-101',
    name: 'Blood Collection',
    technicalName: 'Complete Blood Count (CBC)',
    departmentId: 'dept-pathology',
    averageDurationMinutes: 6,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'No fasting required. Stay relaxed and hydrated.',
    standardPrice: 350,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Hemoglobin (Hb)', unit: 'g/dL', normalRange: '13.0 - 17.0', defaultValue: '13.5' },
      { label: 'Total Leukocyte Count (TLC)', unit: '/uL', normalRange: '4000 - 11000', defaultValue: '7600' },
      { label: 'Platelet Count', unit: '/uL', normalRange: '150000 - 450000', defaultValue: '240000' }
    ]
  },
  {
    id: 'test-ecg',
    code: 'ECG-201',
    name: 'Heart Rhythm',
    technicalName: '12-Lead Electrocardiogram (ECG)',
    departmentId: 'dept-cardio',
    averageDurationMinutes: 5,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Rest quietly 5 minutes before electrode placement. Remove metal objects.',
    standardPrice: 300,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Heart Rate', unit: 'bpm', normalRange: '60 - 100', defaultValue: '76' },
      { label: 'Rhythm', unit: '', normalRange: 'Sinus Rhythm', defaultValue: 'Sinus Rhythm' },
      { label: 'PR Interval', unit: 'ms', normalRange: '120 - 200', defaultValue: '160' }
    ]
  },
  {
    id: 'test-xray-chest',
    code: 'RAD-301',
    name: 'Chest X-Ray',
    technicalName: 'Digital Chest Radiography (PA View)',
    departmentId: 'dept-radiology',
    averageDurationMinutes: 7,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Remove neck chains, metallic ornaments, and shirts with metal buttons.',
    standardPrice: 450,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Lung Fields', unit: '', normalRange: 'Clear', defaultValue: 'Clear, normal bronchovascular markings' },
      { label: 'Cardiothoracic Ratio', unit: '', normalRange: '< 0.50', defaultValue: '0.46 (Normal)' }
    ]
  },
  {
    id: 'test-usg-abdomen',
    code: 'USG-401',
    name: 'Abdominal Ultrasound',
    technicalName: 'Whole Abdomen Ultrasonography',
    departmentId: 'dept-ultrasound',
    averageDurationMinutes: 12,
    requiresFasting: false,
    requiresFullBladder: true,
    preparationNotes: 'Drink 3-4 glasses of water 45 minutes prior. Hold urine for full bladder visualization.',
    standardPrice: 900,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Liver & Gallbladder', unit: '', normalRange: 'Normal', defaultValue: 'Normal liver size and parenchymal echo' },
      { label: 'Urinary Bladder', unit: '', normalRange: 'Distended', defaultValue: 'Well distended, normal wall thickness' }
    ]
  },
  {
    id: 'test-lipid',
    code: 'BIO-102',
    name: 'Lipid Profile',
    technicalName: 'Fasting Lipid Panel',
    departmentId: 'dept-biochem',
    averageDurationMinutes: 7,
    requiresFasting: true,
    requiresFullBladder: false,
    preparationNotes: '10-12 hours overnight fasting mandatory. Only water allowed.',
    standardPrice: 650,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Total Cholesterol', unit: 'mg/dL', normalRange: '< 200', defaultValue: '185' },
      { label: 'Triglycerides', unit: 'mg/dL', normalRange: '< 150', defaultValue: '140' },
      { label: 'HDL Cholesterol', unit: 'mg/dL', normalRange: '> 40', defaultValue: '44' },
      { label: 'LDL Cholesterol', unit: 'mg/dL', normalRange: '< 100', defaultValue: '112' }
    ]
  },
  {
    id: 'test-ppbs',
    code: 'BIO-103',
    name: 'Blood Sugar Post-Meal (PP)',
    technicalName: 'Post-Prandial Blood Glucose (PPBS)',
    departmentId: 'dept-biochem',
    averageDurationMinutes: 6,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Blood sample exactly 2 hours after starting breakfast/meal.',
    prerequisites: ['test-fbs'],
    standardPrice: 150,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Post-Meal Glucose (2hr)', unit: 'mg/dL', normalRange: '< 140', defaultValue: '138' }
    ]
  },
  {
    id: 'test-urine',
    code: 'BLD-102',
    name: 'Urine Routine',
    technicalName: 'Urinalysis & Physical-Chemical Microscopy',
    departmentId: 'dept-pathology',
    averageDurationMinutes: 5,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Clean-catch midstream urine sample in sterile container provided.',
    standardPrice: 150,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Urine Protein', unit: '', normalRange: 'Nil', defaultValue: 'Nil' },
      { label: 'Urine Sugar', unit: '', normalRange: 'Nil', defaultValue: 'Nil' },
      { label: 'Pus Cells', unit: '/hpf', normalRange: '0 - 5', defaultValue: '1 - 2' }
    ]
  },
  {
    id: 'test-retina-oct',
    code: 'EYE-101',
    name: 'Retinal OCT Scan',
    technicalName: 'Optical Coherence Tomography (Macula & Optic Disc)',
    departmentId: 'dept-ophthalmology',
    averageDurationMinutes: 10,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Pupil dilation drops may be administered 20 mins prior. Temporary blurred vision expected.',
    standardPrice: 1200,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Central Foveal Thickness', unit: 'µm', normalRange: '220 - 280', defaultValue: '242' },
      { label: 'Retinal Nerve Fiber Layer (RNFL)', unit: 'µm', normalRange: '85 - 110', defaultValue: '98' }
    ]
  },
  {
    id: 'test-visual-acuity',
    code: 'EYE-102',
    name: 'Visual Acuity & Refraction',
    technicalName: 'Automated Computerised Refraction & Slit Lamp Exam',
    departmentId: 'dept-ophthalmology',
    averageDurationMinutes: 8,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Bring existing prescription spectacle glasses or contact lenses for baseline comparison.',
    standardPrice: 350,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Right Eye (OD) Visual Acuity', unit: '', normalRange: '6/6', defaultValue: '6/9' },
      { label: 'Left Eye (OS) Visual Acuity', unit: '', normalRange: '6/6', defaultValue: '6/6' },
      { label: 'Intraocular Pressure (IOP)', unit: 'mmHg', normalRange: '10 - 21', defaultValue: '15' }
    ]
  },
  {
    id: 'test-audiometry',
    code: 'ENT-101',
    name: 'Pure Tone Audiometry',
    technicalName: 'Pure Tone Audiometry (PTA) Air & Bone Conduction',
    departmentId: 'dept-ent',
    averageDurationMinutes: 15,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Conducted in a soundproof booth. Avoid loud headphone or factory noise exposure 14 hours prior.',
    standardPrice: 650,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Right Ear PTA Average', unit: 'dB HL', normalRange: '< 25 (Normal)', defaultValue: '18 dB HL' },
      { label: 'Left Ear PTA Average', unit: 'dB HL', normalRange: '< 25 (Normal)', defaultValue: '22 dB HL' }
    ]
  },
  {
    id: 'test-tympanometry',
    code: 'ENT-102',
    name: 'Tympanometry & Reflex',
    technicalName: 'Acoustic Immittance & Middle Ear Compliance',
    departmentId: 'dept-ent',
    averageDurationMinutes: 7,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Ear canals should be clear of wax impaction. Test is quick and painless.',
    standardPrice: 450,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Tympanogram Peak Pressure', unit: 'daPa', normalRange: '-100 to +50', defaultValue: '-15 daPa (Type A)' },
      { label: 'Middle Ear Compliance', unit: 'mL', normalRange: '0.3 - 1.6', defaultValue: '0.8 mL' }
    ]
  },
  {
    id: 'test-eeg',
    code: 'NEU-101',
    name: '32-Channel Digital EEG',
    technicalName: '32-Channel Electroencephalogram with Hyperventilation',
    departmentId: 'dept-neurology',
    averageDurationMinutes: 25,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Wash scalp and hair with plain shampoo; do not apply hair oil, gels, condition sprays, or styling agents.',
    standardPrice: 1800,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Background Alpha Rhythm', unit: 'Hz', normalRange: '8.5 - 12.0', defaultValue: '10.2 Hz, symmetric' },
      { label: 'Epileptiform Discharges', unit: '', normalRange: 'Absent', defaultValue: 'Absent / Normal awake tracing' }
    ]
  },
  {
    id: 'test-ncs',
    code: 'NEU-102',
    name: 'Nerve Conduction Study',
    technicalName: 'Electrophysiological Nerve Conduction Velocity (NCV/NCS)',
    departmentId: 'dept-neurology',
    averageDurationMinutes: 20,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Keep limbs warm. Do not apply hand or body lotions/moisturizers on the test day.',
    standardPrice: 1600,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Median Motor NCV', unit: 'm/s', normalRange: '> 50.0', defaultValue: '54.5 m/s' },
      { label: 'Peroneal Motor NCV', unit: 'm/s', normalRange: '> 42.0', defaultValue: '46.2 m/s' }
    ]
  },
  {
    id: 'test-spirometry',
    code: 'PFT-101',
    name: 'Pulmonary Function Test',
    technicalName: 'Pre & Post Bronchodilator Digital Spirometry',
    departmentId: 'dept-pulmonary',
    averageDurationMinutes: 12,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Do not smoke for 1 hour prior. Avoid large heavy meals 2 hours prior. Wear loose comfortable clothing.',
    standardPrice: 850,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'FEV1 / FVC Ratio', unit: '%', normalRange: '> 75%', defaultValue: '81.4%' },
      { label: 'FEV1 % Predicted', unit: '%', normalRange: '> 80%', defaultValue: '89.2%' }
    ]
  },
  {
    id: 'test-dexa',
    code: 'DEX-101',
    name: 'DEXA Bone Mineral Scan',
    technicalName: 'Dual-Energy X-Ray Absorptiometry (Spine & Hip)',
    departmentId: 'dept-orthopedics',
    averageDurationMinutes: 15,
    requiresFasting: false,
    requiresFullBladder: false,
    preparationNotes: 'Do not take calcium supplements or multivitamins on test morning. Avoid clothing with metallic zippers or hooks.',
    standardPrice: 1500,
    defaultPriority: 'normal',
    metricTemplates: [
      { label: 'Lumbar Spine (L1-L4) T-Score', unit: '', normalRange: '> -1.0 (Normal)', defaultValue: '-0.8 (Normal BMD)' },
      { label: 'Femoral Neck T-Score', unit: '', normalRange: '> -1.0 (Normal)', defaultValue: '-1.1 (Mild Osteopenia)' }
    ]
  }
];

/**
 * Clean slate default arrays (Zero fake data initially)
 */
export const INITIAL_PATIENTS: Patient[] = [];
export const INITIAL_QUEUE_TOKENS: QueueToken[] = [];
export const INITIAL_CLINICAL_REPORTS: ClinicalReport[] = [];

// ==========================================
// CANONICAL DEMO DATASET FACTORY & QUICK DEMO SCENARIO
// ==========================================

export interface CanonicalDemoDoctorContext {
  id?: string;
  name?: string;
  room?: string;
}

export interface CanonicalDemoDataset {
  hospital: Hospital;
  departments: Department[];
  counters: Counter[];
  patients: Patient[];
  queueTokens: QueueToken[];
  clinicalReports: ClinicalReport[];
  prescriptions: Prescription[];
}

function resolveDoctorInfo(
  hospital: Hospital,
  doctor?: CurrentUser | CanonicalDemoDoctorContext | null
): { id: string; name: string; room: string } {
  const roomFromDoctor = doctor
    ? ('room' in doctor && doctor.room)
      ? doctor.room
      : ('identifier' in doctor && doctor.identifier ? doctor.identifier : undefined)
    : undefined;
  return {
    id: doctor?.id || 'doc-on-duty',
    name: doctor?.name || hospital.doctorName || 'Attending Physician',
    room: roomFromDoctor || hospital.doctorRoom || 'Chamber 101'
  };
}

function buildMedicationFromCatalog(
  catalogId: string,
  itemId: string,
  doseIndex: number,
  frequencyIndex: number,
  durationIndex: number,
  instructions: string,
  quantity: string
): MedicationItem {
  const med = MEDICINE_CATALOG.find(m => m.id === catalogId) || MEDICINE_CATALOG[0];
  return {
    id: itemId,
    drugName: med.brandName,
    genericName: med.genericName,
    dose: med.commonDosages[doseIndex] || med.commonDosages[0],
    frequency: med.commonFrequencies[frequencyIndex] || med.commonFrequencies[0],
    duration: med.commonDurations[durationIndex] || med.commonDurations[0],
    route: med.commonRoutes[0] || 'Oral',
    instructions,
    quantity,
    dispensed: false
  };
}

export function createCanonicalDemoDataset(
  hospital: Hospital = DEFAULT_HOSPITAL,
  doctor?: CurrentUser | CanonicalDemoDoctorContext | null,
  baseMs: number = Date.now()
): CanonicalDemoDataset {
  const doc = resolveDoctorInfo(hospital, doctor);
  const departments = buildHospitalDepartments(hospital);
  const counters = buildHospitalCounters(hospital);

  const deptMap = new Map(departments.map(d => [d.id, d]));
  const counterMap = new Map(counters.map(c => [c.departmentId, c]));

  const biochemRoom = deptMap.get('dept-biochem')?.location.room || 'Room 14';
  const biochemCounter = counterMap.get('dept-biochem');
  const phlebRoom = deptMap.get('dept-pathology')?.location.room || 'Room 12';
  const phlebCounter = counterMap.get('dept-pathology');
  const cardioRoom = deptMap.get('dept-cardio')?.location.room || 'Room 104';
  const cardioCounter = counterMap.get('dept-cardio');

  const patients: Patient[] = [
    {
      id: 'pat-rameshwar',
      uhid: 'QC-2026-9411',
      qrSessionId: 'QC-9411',
      name: 'Rameshwar Sharma',
      age: 52,
      gender: 'Male',
      contact: '+91 98765 43210',
      priority: 'standard',
      doctorPriority: 'normal',
      prescribedDoctorId: doc.id,
      prescribedDoctorName: doc.name,
      prescribedDoctorRoom: doc.room,
      chiefComplaint: 'Chest pain, tightness and uneasiness since yesterday',
      symptoms: 'Substernal chest tightness radiating to left shoulder',
      prescribedTests: [],
      prescribedTestItems: [],
      completedTests: [],
      activeTokenIds: {},
      status: 'registered',
      assignedSmartRoute: [],
      registrationTime: '09:42 AM',
      registeredAtMs: baseMs - 4 * 60_000,
      opdTokenNumber: 'OPD-11',
      doctorReviewStatus: 'awaiting_prescription',
      notes: 'Walk-in OPD consultation pending diagnostic order.'
    },
    {
      id: 'pat-bg-1',
      uhid: 'QC-2026-9408',
      qrSessionId: 'QC-9408',
      name: 'Sita Devi',
      age: 48,
      gender: 'Female',
      contact: '+91 98111 22334',
      priority: 'standard',
      doctorPriority: 'normal',
      prescribedDoctorId: doc.id,
      prescribedDoctorName: doc.name,
      prescribedDoctorRoom: doc.room,
      chiefComplaint: 'Routine diabetes checkup',
      prescribedTests: ['test-fbs'],
      prescribedTestItems: [
        {
          testId: 'test-fbs',
          testName: 'Blood Sugar Fasting',
          technicalName: 'Fasting Blood Glucose (FBG)',
          priority: 'normal',
          status: 'in_progress',
          preparationInstructions: 'Empty stomach / Fasting sample (8-10 hours overnight fasting required)'
        }
      ],
      completedTests: [],
      currentLockedDestinationTestId: 'test-fbs',
      activeTokenIds: { 'test-fbs': 'tok-bg-bio-1' },
      status: 'in_test',
      assignedSmartRoute: ['test-fbs'],
      registrationTime: '09:30 AM',
      registeredAtMs: baseMs - 14 * 60_000,
      opdTokenNumber: 'OPD-12',
      doctorReviewStatus: 'awaiting_lab_reports'
    },
    {
      id: 'pat-sunita',
      uhid: 'QC-2026-9412',
      qrSessionId: 'QC-9412',
      name: 'Sunita Kapoor',
      age: 44,
      gender: 'Female',
      contact: '+91 98444 55667',
      priority: 'standard',
      doctorPriority: 'normal',
      prescribedDoctorId: doc.id,
      prescribedDoctorName: doc.name,
      prescribedDoctorRoom: doc.room,
      chiefComplaint: 'Fasting glucose follow-up with episodic palpitations',
      prescribedTests: ['test-fbs', 'test-ecg'],
      prescribedTestItems: [
        {
          testId: 'test-fbs',
          testName: 'Blood Sugar Fasting',
          technicalName: 'Fasting Blood Glucose (FBG)',
          priority: 'normal',
          status: 'completed',
          completedAt: '09:35 AM',
          completedByStaff: biochemCounter?.technicianName || 'Lab Technician'
        },
        {
          testId: 'test-ecg',
          testName: 'Heart Rhythm',
          technicalName: '12-Lead Electrocardiogram (ECG)',
          priority: 'normal',
          status: 'waiting',
          preparationInstructions: 'Rest quietly 5 minutes before electrode placement.'
        }
      ],
      completedTests: ['test-fbs'],
      currentLockedDestinationTestId: 'test-ecg',
      activeTokenIds: {
        'test-fbs': 'tok-sunita-fbs',
        'test-ecg': 'tok-sunita-ecg'
      },
      status: 'in_transit',
      assignedSmartRoute: ['test-fbs', 'test-ecg'],
      registrationTime: '09:20 AM',
      registeredAtMs: baseMs - 22 * 60_000,
      opdTokenNumber: 'OPD-13',
      doctorReviewStatus: 'awaiting_lab_reports'
    },
    {
      id: 'pat-bg-2',
      uhid: 'QC-2026-9409',
      qrSessionId: 'QC-9409',
      name: 'Vinod Kumar',
      age: 61,
      gender: 'Male',
      contact: '+91 98222 33445',
      priority: 'senior',
      doctorPriority: 'normal',
      prescribedDoctorId: doc.id,
      prescribedDoctorName: doc.name,
      prescribedDoctorRoom: doc.room,
      chiefComplaint: 'Hypertension and dizziness',
      prescribedTests: ['test-cbc', 'test-ecg'],
      prescribedTestItems: [
        {
          testId: 'test-cbc',
          testName: 'Blood Collection',
          technicalName: 'Complete Blood Count (CBC)',
          priority: 'normal',
          status: 'completed',
          completedAt: '10:15 AM',
          completedByStaff: phlebCounter?.technicianName || 'Lab Technician'
        },
        {
          testId: 'test-ecg',
          testName: 'Heart Rhythm',
          technicalName: '12-Lead Electrocardiogram (ECG)',
          priority: 'normal',
          status: 'completed',
          completedAt: '10:35 AM',
          completedByStaff: cardioCounter?.technicianName || 'Cardio Technician'
        }
      ],
      completedTests: ['test-cbc', 'test-ecg'],
      activeTokenIds: {
        'test-cbc': 'tok-vinod-cbc',
        'test-ecg': 'tok-vinod-ecg'
      },
      status: 'all_completed',
      assignedSmartRoute: ['test-cbc', 'test-ecg'],
      registrationTime: '09:10 AM',
      registeredAtMs: baseMs - 28 * 60_000,
      opdTokenNumber: 'OPD-14',
      doctorReviewStatus: 'reports_ready'
    },
    {
      id: 'pat-bg-3',
      uhid: 'QC-2026-9410',
      qrSessionId: 'QC-9410',
      name: 'Anita Singh',
      age: 35,
      gender: 'Female',
      contact: '+91 98333 44556',
      priority: 'standard',
      doctorPriority: 'normal',
      prescribedDoctorId: doc.id,
      prescribedDoctorName: doc.name,
      prescribedDoctorRoom: doc.room,
      chiefComplaint: 'Heart flutter during work',
      prescribedTests: ['test-ecg'],
      prescribedTestItems: [
        {
          testId: 'test-ecg',
          testName: 'Heart Rhythm',
          technicalName: '12-Lead Electrocardiogram (ECG)',
          priority: 'normal',
          status: 'completed',
          completedAt: '09:18 AM',
          completedByStaff: cardioCounter?.technicianName || 'Cardio Technician'
        }
      ],
      completedTests: ['test-ecg'],
      activeTokenIds: { 'test-ecg': 'tok-anita-ecg' },
      status: 'discharged',
      assignedSmartRoute: ['test-ecg'],
      registrationTime: '08:50 AM',
      registeredAtMs: baseMs - 55 * 60_000,
      opdTokenNumber: 'OPD-15',
      doctorReviewStatus: 'completed',
      notes: 'Normal sinus rhythm. Oral hydration, stress hygiene, and supportive Rx issued.'
    }
  ];

  const queueTokens: QueueToken[] = [
    {
      id: 'tok-bg-bio-1',
      tokenNumber: 'B-12',
      patientId: 'pat-bg-1',
      patientName: 'Sita Devi',
      patientUhid: 'QC-2026-9408',
      patientAge: 48,
      patientGender: 'Female',
      testId: 'test-fbs',
      testName: 'Blood Sugar Fasting',
      departmentId: 'dept-biochem',
      counterId: biochemCounter?.id || 'counter-bio-1',
      roomNo: biochemRoom,
      priority: 'standard',
      status: 'in_progress',
      issuedAt: '09:30 AM',
      queuePosition: 1,
      estimatedWaitMinutes: 2
    },
    {
      id: 'tok-sunita-fbs',
      tokenNumber: 'B-11',
      patientId: 'pat-sunita',
      patientName: 'Sunita Kapoor',
      patientUhid: 'QC-2026-9412',
      patientAge: 44,
      patientGender: 'Female',
      testId: 'test-fbs',
      testName: 'Blood Sugar Fasting',
      departmentId: 'dept-biochem',
      counterId: biochemCounter?.id || 'counter-bio-1',
      roomNo: biochemRoom,
      priority: 'standard',
      status: 'completed',
      issuedAt: '09:20 AM',
      completedAt: '09:35 AM',
      queuePosition: 0,
      estimatedWaitMinutes: 0
    },
    {
      id: 'tok-sunita-ecg',
      tokenNumber: 'E-14',
      patientId: 'pat-sunita',
      patientName: 'Sunita Kapoor',
      patientUhid: 'QC-2026-9412',
      patientAge: 44,
      patientGender: 'Female',
      testId: 'test-ecg',
      testName: 'Heart Rhythm',
      departmentId: 'dept-cardio',
      counterId: cardioCounter?.id || 'counter-ecg-1',
      roomNo: cardioRoom,
      priority: 'standard',
      status: 'waiting',
      issuedAt: '09:36 AM',
      queuePosition: 1,
      estimatedWaitMinutes: 5
    },
    {
      id: 'tok-vinod-cbc',
      tokenNumber: 'BLD-18',
      patientId: 'pat-bg-2',
      patientName: 'Vinod Kumar',
      patientUhid: 'QC-2026-9409',
      patientAge: 61,
      patientGender: 'Male',
      testId: 'test-cbc',
      testName: 'Blood Collection',
      departmentId: 'dept-pathology',
      counterId: phlebCounter?.id || 'counter-phleb-1',
      roomNo: phlebRoom,
      priority: 'senior',
      status: 'completed',
      issuedAt: '09:10 AM',
      completedAt: '10:15 AM',
      queuePosition: 0,
      estimatedWaitMinutes: 0
    },
    {
      id: 'tok-vinod-ecg',
      tokenNumber: 'E-12',
      patientId: 'pat-bg-2',
      patientName: 'Vinod Kumar',
      patientUhid: 'QC-2026-9409',
      patientAge: 61,
      patientGender: 'Male',
      testId: 'test-ecg',
      testName: 'Heart Rhythm',
      departmentId: 'dept-cardio',
      counterId: cardioCounter?.id || 'counter-ecg-1',
      roomNo: cardioRoom,
      priority: 'senior',
      status: 'completed',
      issuedAt: '09:10 AM',
      completedAt: '10:35 AM',
      queuePosition: 0,
      estimatedWaitMinutes: 0
    },
    {
      id: 'tok-anita-ecg',
      tokenNumber: 'E-03',
      patientId: 'pat-bg-3',
      patientName: 'Anita Singh',
      patientUhid: 'QC-2026-9410',
      patientAge: 35,
      patientGender: 'Female',
      testId: 'test-ecg',
      testName: 'Heart Rhythm',
      departmentId: 'dept-cardio',
      counterId: cardioCounter?.id || 'counter-ecg-1',
      roomNo: cardioRoom,
      priority: 'standard',
      status: 'completed',
      issuedAt: '08:50 AM',
      completedAt: '09:18 AM',
      queuePosition: 0,
      estimatedWaitMinutes: 0
    }
  ];

  const clinicalReports: ClinicalReport[] = [
    {
      id: 'rep-vinod-2',
      testId: 'test-ecg',
      testName: '12-Lead Electrocardiogram (ECG)',
      technicalName: 'Electrocardiography',
      patientId: 'pat-bg-2',
      patientUhid: 'QC-2026-9409',
      patientName: 'Vinod Kumar',
      technicianName: cardioCounter?.technicianName || 'Vikram Das',
      counterId: cardioCounter?.id || 'counter-ecg-1',
      roomNo: cardioRoom,
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
      id: 'rep-sunita-fbs',
      testId: 'test-fbs',
      testName: 'Blood Sugar Fasting',
      technicalName: 'Fasting Blood Glucose (FBG)',
      patientId: 'pat-sunita',
      patientUhid: 'QC-2026-9412',
      patientName: 'Sunita Kapoor',
      technicianName: biochemCounter?.technicianName || 'Anita Sen',
      counterId: biochemCounter?.id || 'counter-bio-1',
      roomNo: biochemRoom,
      timestamp: '09:35 AM',
      createdAtMs: baseMs - 11 * 60_000,
      actualTurnaroundMinutes: 6.0,
      status: 'uploaded',
      summary: 'Borderline impaired fasting glucose (114 mg/dL). Proceed to Cardiology ECG.',
      metrics: [
        { label: 'Fasting Blood Glucose', value: '114', unit: 'mg/dL', normalRange: '70 - 99', flag: 'high' }
      ],
      technicianNotes: 'Overnight 9-hour fasting state confirmed.'
    },
    {
      id: 'rep-vinod-1',
      testId: 'test-cbc',
      testName: 'Complete Blood Count (CBC)',
      technicalName: 'Automated Hematology Profile',
      patientId: 'pat-bg-2',
      patientUhid: 'QC-2026-9409',
      patientName: 'Vinod Kumar',
      technicianName: phlebCounter?.technicianName || 'Sunil Kumar',
      counterId: phlebCounter?.id || 'counter-phleb-1',
      roomNo: phlebRoom,
      timestamp: '10:15 AM',
      createdAtMs: baseMs - 16 * 60_000,
      actualTurnaroundMinutes: 6.5,
      status: 'uploaded',
      summary: 'Mild microcytic hypochromic picture (Hb 11.8 g/dL Low). Platelets adequate.',
      metrics: [
        { label: 'Hemoglobin (Hb)', value: '11.8', unit: 'g/dL', normalRange: '13.0 - 17.0', flag: 'low' },
        { label: 'Total Leukocyte Count (TLC)', value: '7400', unit: '/uL', normalRange: '4000 - 11000', flag: 'normal' },
        { label: 'Platelet Count', value: '265000', unit: '/uL', normalRange: '150000 - 450000', flag: 'normal' }
      ],
      technicianNotes: 'Venipuncture performed smoothly. Patient advised to rest 5 mins.'
    },
    {
      id: 'rep-anita-ecg',
      testId: 'test-ecg',
      testName: '12-Lead Electrocardiogram (ECG)',
      technicalName: 'Electrocardiography',
      patientId: 'pat-bg-3',
      patientUhid: 'QC-2026-9410',
      patientName: 'Anita Singh',
      technicianName: cardioCounter?.technicianName || 'Vikram Das',
      counterId: cardioCounter?.id || 'counter-ecg-1',
      roomNo: cardioRoom,
      timestamp: '09:18 AM',
      createdAtMs: baseMs - 32 * 60_000,
      actualTurnaroundMinutes: 5.0,
      status: 'verified_by_doctor',
      summary: 'Sinus rhythm at 78 bpm, normal axis, no ST-T abnormalities.',
      metrics: [
        { label: 'Heart Rate', value: '78', unit: 'bpm', normalRange: '60 - 100', flag: 'normal' },
        { label: 'Rhythm', value: 'Sinus Rhythm', unit: '', normalRange: 'Sinus Rhythm', flag: 'normal' },
        { label: 'PR Interval', value: '158', unit: 'ms', normalRange: '120 - 200', flag: 'normal' }
      ],
      technicianNotes: 'Resting 12-lead recording completed cleanly.',
      doctorNotes: 'Verified normal cardiac rhythm. No ischemic or arrhythmic findings.',
      doctorSignature: doc.name
    }
  ];

  const prescriptions: Prescription[] = [
    {
      id: 'RX-ANITA-01',
      patientId: 'pat-bg-3',
      patientName: 'Anita Singh',
      patientUhid: 'QC-2026-9410',
      doctorId: doc.id,
      doctorName: doc.name,
      hospitalCode: hospital.code,
      issuedAt: new Date(baseMs - 25 * 60_000).toISOString(),
      validUntil: new Date(baseMs + 30 * 24 * 60 * 60_000).toISOString(),
      diagnosis: 'Benign Sinus Palpitations with Mild Dyspepsia',
      clinicalNotes: '12-Lead ECG verified normal. Reassurance, adequate hydration, and 14-day supportive course advised.',
      followUpDate: new Date(baseMs + 14 * 24 * 60 * 60_000).toISOString().split('T')[0],
      status: 'active',
      medications: [
        buildMedicationFromCatalog('med-omep', 'rx-med-anita-1', 0, 0, 1, 'Before breakfast', '14 capsules'),
        buildMedicationFromCatalog('med-b-complex', 'rx-med-anita-2', 0, 0, 0, 'After lunch with water', '30 capsules')
      ]
    }
  ];

  return {
    hospital,
    departments,
    counters,
    patients,
    queueTokens,
    clinicalReports,
    prescriptions
  };
}

/**
 * Pre-configured Patient-Pass Quick Demo Scenario (Rameshwar Sharma + active queue backdrop)
 * Strictly synchronized with MAX-01 rooms (Cardiology Room 104, Radiology Room B-08) and zero orphan tokens.
 */
export const DEMO_SCENARIO_PATIENT: Patient = {
  id: 'pat-rameshwar',
  uhid: 'QC-2026-9411',
  qrSessionId: 'QC-9411',
  name: 'Rameshwar Sharma',
  age: 52,
  gender: 'Male',
  contact: '+91 98765 43210',
  priority: 'standard',
  doctorPriority: 'normal',
  prescribedDoctorId: 'doc-max-01',
  prescribedDoctorName: DEFAULT_HOSPITAL.doctorName,
  prescribedDoctorRoom: DEFAULT_HOSPITAL.doctorRoom,
  chiefComplaint: 'Chest pain, tightness and uneasiness since yesterday',
  symptoms: 'Substernal chest tightness radiating to left shoulder',
  prescribedTests: ['test-fbs', 'test-cbc', 'test-ecg', 'test-xray-chest'],
  prescribedTestItems: [
    {
      testId: 'test-fbs',
      testName: 'Blood Sugar Fasting',
      technicalName: 'Fasting Blood Glucose (FBG)',
      priority: 'normal',
      status: 'waiting',
      preparationInstructions: 'Empty stomach / Fasting sample required'
    },
    {
      testId: 'test-ecg',
      testName: 'Heart Rhythm',
      technicalName: '12-Lead Electrocardiogram (ECG)',
      priority: 'normal',
      status: 'waiting',
      preparationInstructions: 'Rest quietly 5 minutes prior'
    },
    {
      testId: 'test-xray-chest',
      testName: 'Chest X-Ray',
      technicalName: 'Digital Chest Radiography (PA View)',
      priority: 'normal',
      status: 'waiting',
      preparationInstructions: 'Remove metallic ornaments and neck chains'
    },
    {
      testId: 'test-cbc',
      testName: 'Blood Collection',
      technicalName: 'Complete Blood Count (CBC)',
      priority: 'normal',
      status: 'waiting',
      preparationInstructions: 'Routine venous blood sample'
    }
  ],
  completedTests: [],
  currentLockedDestinationTestId: 'test-fbs',
  activeTokenIds: {
    'test-fbs': 'tok-demo-rameshwar-fbs',
    'test-ecg': 'tok-demo-rameshwar-ecg',
    'test-xray-chest': 'tok-demo-rameshwar-xray',
    'test-cbc': 'tok-demo-rameshwar-cbc'
  },
  status: 'in_transit',
  assignedSmartRoute: ['test-fbs', 'test-ecg', 'test-xray-chest', 'test-cbc'],
  registrationTime: '09:15 AM',
  opdTokenNumber: 'OPD-14',
  doctorReviewStatus: 'awaiting_lab_reports',
  notes: 'Fasting status confirmed by patient attendants.'
};

export const DEMO_SCENARIO_PATIENTS_LIST: Patient[] = [
  DEMO_SCENARIO_PATIENT,
  {
    id: 'pat-bg-1',
    uhid: 'QC-2026-9408',
    qrSessionId: 'QC-9408',
    name: 'Sita Devi',
    age: 48,
    gender: 'Female',
    contact: '+91 98111 22334',
    priority: 'standard',
    prescribedDoctorId: 'doc-max-01',
    prescribedDoctorName: DEFAULT_HOSPITAL.doctorName,
    prescribedDoctorRoom: DEFAULT_HOSPITAL.doctorRoom,
    chiefComplaint: 'Routine diabetes checkup',
    prescribedTests: ['test-fbs'],
    completedTests: [],
    activeTokenIds: { 'test-fbs': 'tok-bg-bio-1' },
    status: 'in_test',
    assignedSmartRoute: ['test-fbs'],
    registrationTime: '09:00 AM',
    opdTokenNumber: 'OPD-11',
    doctorReviewStatus: 'awaiting_lab_reports'
  },
  {
    id: 'pat-bg-2',
    uhid: 'QC-2026-9409',
    qrSessionId: 'QC-9409',
    name: 'Vinod Kumar',
    age: 61,
    gender: 'Male',
    contact: '+91 98222 33445',
    priority: 'senior',
    prescribedDoctorId: 'doc-max-01',
    prescribedDoctorName: DEFAULT_HOSPITAL.doctorName,
    prescribedDoctorRoom: DEFAULT_HOSPITAL.doctorRoom,
    chiefComplaint: 'Hypertension and dizziness',
    prescribedTests: ['test-fbs', 'test-cbc'],
    completedTests: [],
    activeTokenIds: {
      'test-fbs': 'tok-bg-bio-2',
      'test-cbc': 'tok-bg-bld-1'
    },
    status: 'in_transit',
    assignedSmartRoute: ['test-fbs', 'test-cbc'],
    registrationTime: '09:05 AM',
    opdTokenNumber: 'OPD-12',
    doctorReviewStatus: 'awaiting_lab_reports'
  },
  {
    id: 'pat-bg-3',
    uhid: 'QC-2026-9410',
    qrSessionId: 'QC-9410',
    name: 'Anita Singh',
    age: 35,
    gender: 'Female',
    contact: '+91 98333 44556',
    priority: 'standard',
    prescribedDoctorId: 'doc-max-01',
    prescribedDoctorName: DEFAULT_HOSPITAL.doctorName,
    prescribedDoctorRoom: DEFAULT_HOSPITAL.doctorRoom,
    chiefComplaint: 'Heart flutter during work',
    prescribedTests: ['test-ecg', 'test-cbc'],
    completedTests: [],
    activeTokenIds: {
      'test-ecg': 'tok-bg-ecg-1',
      'test-cbc': 'tok-bg-bld-2'
    },
    status: 'in_test',
    assignedSmartRoute: ['test-ecg', 'test-cbc'],
    registrationTime: '09:10 AM',
    opdTokenNumber: 'OPD-13',
    doctorReviewStatus: 'awaiting_lab_reports'
  },
  {
    id: 'pat-sunita',
    uhid: 'QC-2026-9412',
    qrSessionId: 'QC-9412',
    name: 'Sunita Kapoor',
    age: 44,
    gender: 'Female',
    contact: '+91 98444 55667',
    priority: 'standard',
    prescribedDoctorId: 'doc-max-01',
    prescribedDoctorName: DEFAULT_HOSPITAL.doctorName,
    prescribedDoctorRoom: DEFAULT_HOSPITAL.doctorRoom,
    chiefComplaint: 'Routine hematology checkup',
    prescribedTests: ['test-cbc'],
    completedTests: [],
    activeTokenIds: { 'test-cbc': 'tok-bg-bld-3' },
    status: 'in_transit',
    assignedSmartRoute: ['test-cbc'],
    registrationTime: '09:12 AM',
    opdTokenNumber: 'OPD-15',
    doctorReviewStatus: 'awaiting_lab_reports'
  }
];

export const DEMO_SCENARIO_TOKENS: QueueToken[] = [
  {
    id: 'tok-demo-rameshwar-fbs',
    tokenNumber: 'B-14',
    patientId: 'pat-rameshwar',
    patientName: 'Rameshwar Sharma',
    patientUhid: 'QC-2026-9411',
    patientAge: 52,
    patientGender: 'Male',
    testId: 'test-fbs',
    testName: 'Blood Sugar Fasting',
    departmentId: 'dept-biochem',
    counterId: 'counter-bio-1',
    roomNo: 'Room 14',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '09:15 AM',
    queuePosition: 3,
    estimatedWaitMinutes: 10
  },
  {
    id: 'tok-demo-rameshwar-ecg',
    tokenNumber: 'E-04',
    patientId: 'pat-rameshwar',
    patientName: 'Rameshwar Sharma',
    patientUhid: 'QC-2026-9411',
    patientAge: 52,
    patientGender: 'Male',
    testId: 'test-ecg',
    testName: 'Heart Rhythm',
    departmentId: 'dept-cardio',
    counterId: 'counter-ecg-1',
    roomNo: 'Room 104',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '09:15 AM',
    queuePosition: 2,
    estimatedWaitMinutes: 5
  },
  {
    id: 'tok-demo-rameshwar-xray',
    tokenNumber: 'X-02',
    patientId: 'pat-rameshwar',
    patientName: 'Rameshwar Sharma',
    patientUhid: 'QC-2026-9411',
    patientAge: 52,
    patientGender: 'Male',
    testId: 'test-xray-chest',
    testName: 'Chest X-Ray',
    departmentId: 'dept-radiology',
    counterId: 'counter-xray-1',
    roomNo: 'Room B-08',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '09:15 AM',
    queuePosition: 1,
    estimatedWaitMinutes: 0
  },
  {
    id: 'tok-demo-rameshwar-cbc',
    tokenNumber: 'BLD-24',
    patientId: 'pat-rameshwar',
    patientName: 'Rameshwar Sharma',
    patientUhid: 'QC-2026-9411',
    patientAge: 52,
    patientGender: 'Male',
    testId: 'test-cbc',
    testName: 'Blood Collection',
    departmentId: 'dept-pathology',
    counterId: 'counter-phleb-1',
    roomNo: 'Room 12',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '09:15 AM',
    queuePosition: 4,
    estimatedWaitMinutes: 18
  },
  {
    id: 'tok-bg-bio-1',
    tokenNumber: 'B-12',
    patientId: 'pat-bg-1',
    patientName: 'Sita Devi',
    patientUhid: 'QC-2026-9408',
    patientAge: 48,
    patientGender: 'Female',
    testId: 'test-fbs',
    testName: 'Blood Sugar Fasting',
    departmentId: 'dept-biochem',
    counterId: 'counter-bio-1',
    roomNo: 'Room 14',
    priority: 'standard',
    status: 'in_progress',
    issuedAt: '09:02 AM',
    queuePosition: 1,
    estimatedWaitMinutes: 2
  },
  {
    id: 'tok-bg-bio-2',
    tokenNumber: 'B-13',
    patientId: 'pat-bg-2',
    patientName: 'Vinod Kumar',
    patientUhid: 'QC-2026-9409',
    patientAge: 61,
    patientGender: 'Male',
    testId: 'test-fbs',
    testName: 'Blood Sugar Fasting',
    departmentId: 'dept-biochem',
    counterId: 'counter-bio-1',
    roomNo: 'Room 14',
    priority: 'senior',
    status: 'waiting',
    issuedAt: '09:08 AM',
    queuePosition: 2,
    estimatedWaitMinutes: 6
  },
  {
    id: 'tok-bg-ecg-1',
    tokenNumber: 'E-03',
    patientId: 'pat-bg-3',
    patientName: 'Anita Singh',
    patientUhid: 'QC-2026-9410',
    patientAge: 35,
    patientGender: 'Female',
    testId: 'test-ecg',
    testName: 'Heart Rhythm',
    departmentId: 'dept-cardio',
    counterId: 'counter-ecg-1',
    roomNo: 'Room 104',
    priority: 'standard',
    status: 'in_progress',
    issuedAt: '09:12 AM',
    queuePosition: 1,
    estimatedWaitMinutes: 3
  },
  {
    id: 'tok-bg-bld-1',
    tokenNumber: 'BLD-21',
    patientId: 'pat-bg-2',
    patientName: 'Vinod Kumar',
    patientUhid: 'QC-2026-9409',
    patientAge: 61,
    patientGender: 'Male',
    testId: 'test-cbc',
    testName: 'Blood Collection',
    departmentId: 'dept-pathology',
    counterId: 'counter-phleb-1',
    roomNo: 'Room 12',
    priority: 'senior',
    status: 'waiting',
    issuedAt: '09:06 AM',
    queuePosition: 1,
    estimatedWaitMinutes: 5
  },
  {
    id: 'tok-bg-bld-2',
    tokenNumber: 'BLD-22',
    patientId: 'pat-bg-3',
    patientName: 'Anita Singh',
    patientUhid: 'QC-2026-9410',
    patientAge: 35,
    patientGender: 'Female',
    testId: 'test-cbc',
    testName: 'Blood Collection',
    departmentId: 'dept-pathology',
    counterId: 'counter-phleb-1',
    roomNo: 'Room 12',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '09:10 AM',
    queuePosition: 2,
    estimatedWaitMinutes: 10
  },
  {
    id: 'tok-bg-bld-3',
    tokenNumber: 'BLD-23',
    patientId: 'pat-sunita',
    patientName: 'Sunita Kapoor',
    patientUhid: 'QC-2026-9412',
    patientAge: 44,
    patientGender: 'Female',
    testId: 'test-cbc',
    testName: 'Blood Collection',
    departmentId: 'dept-pathology',
    counterId: 'counter-phleb-1',
    roomNo: 'Room 12',
    priority: 'standard',
    status: 'waiting',
    issuedAt: '09:12 AM',
    queuePosition: 3,
    estimatedWaitMinutes: 15
  }
];
