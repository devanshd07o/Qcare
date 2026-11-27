export interface HistoricalPatientRecord {
  id: string;
  uhid: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  visitDate: string;
  chiefComplaint: string;
  prescribedDoctorName: string;
  prescribedDoctorRoom: string;
  completedTests: string[];
  testNames: string[];
  status: 'completed';
  diagnosisNotes: string;
}

export const DEFAULT_ARCHIVE_DOCTOR_NAME = 'Attending OPD Physician';
export const DEFAULT_ARCHIVE_DOCTOR_ROOM = 'OPD Archive';

const BASE_HISTORICAL_RECORDS: HistoricalPatientRecord[] = [
  {
    id: 'hist-001',
    uhid: 'QC-2026-8001',
    name: 'Harish Chandra Gupta',
    age: 58,
    gender: 'Male',
    contact: '+91 97101 22341',
    visitDate: '2026-08-12',
    chiefComplaint: 'Routine Type-2 Diabetes quarterly review, morning dizziness',
    prescribedDoctorName: DEFAULT_ARCHIVE_DOCTOR_NAME,
    prescribedDoctorRoom: DEFAULT_ARCHIVE_DOCTOR_ROOM,
    completedTests: ['test-fbs', 'test-cbc'],
    testNames: ['Blood Sugar Fasting', 'Complete Blood Count (CBC)'],
    status: 'completed',
    diagnosisNotes: 'FBS 134 mg/dL. Controlled diabetic status. Advised continue Metformin 500mg BD.'
  },
  {
    id: 'hist-002',
    uhid: 'QC-2026-8002',
    name: 'Kamla Devi Sharma',
    age: 64,
    gender: 'Female',
    contact: '+91 97112 33452',
    visitDate: '2026-08-14',
    chiefComplaint: 'Bilateral knee stiffness, pain worsening while climbing stairs',
    prescribedDoctorName: DEFAULT_ARCHIVE_DOCTOR_NAME,
    prescribedDoctorRoom: DEFAULT_ARCHIVE_DOCTOR_ROOM,
    completedTests: ['test-cbc', 'test-xray-chest'],
    testNames: ['Complete Blood Count', 'Digital Chest Radiography'],
    status: 'completed',
    diagnosisNotes: 'Mild osteoarthritic changes. Started calcium + Vitamin D3 supplements. Physiotherapy advised.'
  },
  {
    id: 'hist-003',
    uhid: 'QC-2026-8003',
    name: 'Gurpreet Singh Anand',
    age: 42,
    gender: 'Male',
    contact: '+91 97711 44563',
    visitDate: '2026-08-16',
    chiefComplaint: 'Exertional breathlessness and palpitation after walking 500m',
    prescribedDoctorName: DEFAULT_ARCHIVE_DOCTOR_NAME,
    prescribedDoctorRoom: DEFAULT_ARCHIVE_DOCTOR_ROOM,
    completedTests: ['test-ecg', 'test-cbc'],
    testNames: ['12-Lead ECG', 'Complete Blood Count (CBC)'],
    status: 'completed',
    diagnosisNotes: 'Sinus tachycardia 96 bpm, no ischemic ST changes. Hb 14.2 g/dL. Advised stress reduction & echo.'
  },
  {
    id: 'hist-004',
    uhid: 'QC-2026-8004',
    name: 'Pooja Saxena',
    age: 31,
    gender: 'Female',
    contact: '+91 97100 55674',
    visitDate: '2026-08-18',
    chiefComplaint: 'Persistent fatigue, hair thinning, sensitivity to cold',
    prescribedDoctorName: DEFAULT_ARCHIVE_DOCTOR_NAME,
    prescribedDoctorRoom: DEFAULT_ARCHIVE_DOCTOR_ROOM,
    completedTests: ['test-cbc', 'test-fbs'],
    testNames: ['Complete Blood Count', 'Fasting Blood Sugar'],
    status: 'completed',
    diagnosisNotes: 'Mild hypochromic microcytic picture. TSH sent to endocrine wing. Started oral iron.'
  },
  {
    id: 'hist-005',
    uhid: 'QC-2026-8005',
    name: 'Rajendra Prasad Mehra',
    age: 69,
    gender: 'Male',
    contact: '+91 97188 66785',
    visitDate: '2026-08-20',
    chiefComplaint: 'Chronic non-productive cough, mild night sweats for 3 weeks',
    prescribedDoctorName: DEFAULT_ARCHIVE_DOCTOR_NAME,
    prescribedDoctorRoom: DEFAULT_ARCHIVE_DOCTOR_ROOM,
    completedTests: ['test-xray-chest', 'test-cbc'],
    testNames: ['Digital Chest Radiography (PA)', 'Complete Blood Count'],
    status: 'completed',
    diagnosisNotes: 'X-ray chest clear, no active infiltrates. TLC 8,200. Viral post-infectious bronchitis.'
  },
  {
    id: 'hist-006',
    uhid: 'QC-2026-8006',
    name: 'Sunita Narayanan',
    age: 47,
    gender: 'Female',
    contact: '+91 97103 77896',
    visitDate: '2026-08-22',
    chiefComplaint: 'Upper quadrant postprandial heaviness after oily food',
    prescribedDoctorName: DEFAULT_ARCHIVE_DOCTOR_NAME,
    prescribedDoctorRoom: DEFAULT_ARCHIVE_DOCTOR_ROOM,
    completedTests: ['test-usg-abdomen'],
    testNames: ['Whole Abdomen Sonography'],
    status: 'completed',
    diagnosisNotes: 'Grade 1 fatty liver, no cholelithiasis. Dietary lifestyle modifications prescribed.'
  },
  {
    id: 'hist-007',
    uhid: 'QC-2026-8007',
    name: 'Mohammad Tariq Khan',
    age: 53,
    gender: 'Male',
    contact: '+91 97912 88907',
    visitDate: '2026-08-25',
    chiefComplaint: 'Annual corporate health checkup, mild borderline BP (138/88)',
    prescribedDoctorName: DEFAULT_ARCHIVE_DOCTOR_NAME,
    prescribedDoctorRoom: DEFAULT_ARCHIVE_DOCTOR_ROOM,
    completedTests: ['test-fbs', 'test-cbc', 'test-ecg'],
    testNames: ['Blood Sugar Fasting', 'Complete Blood Count', '12-Lead ECG'],
    status: 'completed',
    diagnosisNotes: 'All investigation parameters within normal biological limits. Advised low-sodium diet.'
  },
  {
    id: 'hist-008',
    uhid: 'QC-2026-8008',
    name: 'Anita Rawat',
    age: 38,
    gender: 'Female',
    contact: '+91 97734 99018',
    visitDate: '2026-08-28',
    chiefComplaint: 'Recurrent burning micturition, lower pelvic cramping',
    prescribedDoctorName: DEFAULT_ARCHIVE_DOCTOR_NAME,
    prescribedDoctorRoom: DEFAULT_ARCHIVE_DOCTOR_ROOM,
    completedTests: ['test-urine', 'test-cbc'],
    testNames: ['Urinalysis Routine', 'Complete Blood Count'],
    status: 'completed',
    diagnosisNotes: 'Urinary tract infection (Pus cells 15-20). Started Tab Nitrofurantoin 100mg BD x 7 days.'
  },
  {
    id: 'hist-009',
    uhid: 'QC-2026-8009',
    name: 'Deepak Joshi',
    age: 29,
    gender: 'Male',
    contact: '+91 97991 10129',
    visitDate: '2026-08-30',
    chiefComplaint: 'Low back pain after heavy lifting in gym, radiating to left thigh',
    prescribedDoctorName: DEFAULT_ARCHIVE_DOCTOR_NAME,
    prescribedDoctorRoom: DEFAULT_ARCHIVE_DOCTOR_ROOM,
    completedTests: ['test-xray-chest'],
    testNames: ['Digital Radiography PA'],
    status: 'completed',
    diagnosisNotes: 'Acute lumbar paraspinal muscle spasm. Prescribed muscle relaxant + lumbar support belt.'
  },
  {
    id: 'hist-010',
    uhid: 'QC-2026-8010',
    name: 'Meenakshi Iyer',
    age: 62,
    gender: 'Female',
    contact: '+91 97114 21230',
    visitDate: '2026-09-02',
    chiefComplaint: 'Post-menopausal routine osteopenia evaluation, joint pain',
    prescribedDoctorName: DEFAULT_ARCHIVE_DOCTOR_NAME,
    prescribedDoctorRoom: DEFAULT_ARCHIVE_DOCTOR_ROOM,
    completedTests: ['test-cbc', 'test-fbs'],
    testNames: ['Complete Blood Count', 'Blood Sugar Fasting'],
    status: 'completed',
    diagnosisNotes: 'Hb 12.6, FBS 92. Calcium & Cholecalciferol sachets given. DEXA scan scheduled.'
  }
];

const COMMON_NAMES: ReadonlyArray<{
  name: string;
  gender: 'Male' | 'Female';
  age: number;
  complaint: string;
}> = [
  { name: 'Sanjay Kapoor', gender: 'Male', age: 49, complaint: 'Hypertension review, mild occipital morning headache' },
  { name: 'Kavita Menon', gender: 'Female', age: 34, complaint: 'Acute gastroenteritis, vomiting 2 episodes yesterday' },
  { name: 'Vikramaditya Rao', gender: 'Male', age: 56, complaint: 'Diabetes follow-up, tingling in both soles (neuropathy)' },
  { name: 'Aruna Chandrasekhar', gender: 'Female', age: 67, complaint: 'Known ischemic heart disease, regular checkup' },
  { name: 'Naveen Jindal', gender: 'Male', age: 39, complaint: 'Hyperacidity, gastroesophageal reflux after dinner' },
  { name: 'Shashi Prabha Verma', gender: 'Female', age: 54, complaint: 'Hypothyroidism management, weight gain despite diet' },
  { name: 'Abhishek Mukherjee', gender: 'Male', age: 31, complaint: 'Viral upper respiratory tract infection, sore throat' },
  { name: 'Usha Kulkarni', gender: 'Female', age: 60, complaint: 'Bilateral ankle swelling after evening sitting' },
  { name: 'Praveen Chawla', gender: 'Male', age: 44, complaint: 'Executive health evaluation, family history of CAD' },
  { name: 'Bimla Rani', gender: 'Female', age: 72, complaint: 'Generalized body ache and chronic osteoarthritis' },
  { name: 'Amitabh Chatterjee', gender: 'Male', age: 51, complaint: 'Follow up for dyslipidemia, on Atorvastatin 20mg' },
  { name: 'Geeta Kashyap', gender: 'Female', age: 28, complaint: 'Iron deficiency anemia, paleness, mild exertional dyspnea' },
  { name: 'Manish Tyagi', gender: 'Male', age: 36, complaint: 'Acute low backache after scooter commute' },
  { name: 'Rashmi Nambiar', gender: 'Female', age: 43, complaint: 'Intermittent right flank discomfort, mild burning micturition' },
  { name: 'Sudhir Bhargava', gender: 'Male', age: 65, complaint: 'Post-CABG 3-year surveillance checkup' },
  { name: 'Madhu Goel', gender: 'Female', age: 59, complaint: 'Type 2 Diabetes Mellitus with microalbuminuria check' },
  { name: 'Rohit Juneja', gender: 'Male', age: 26, complaint: 'High grade fever with chills 2 days (malaria/dengue screen)' },
  { name: 'Saroj Bala', gender: 'Female', age: 63, complaint: 'Chronic insomnia, hypertension monitoring' },
  { name: 'Ashok Bansal', gender: 'Male', age: 57, complaint: 'Mild chest heaviness post heavy breakfast' },
  { name: 'Neelam Aggarwal', gender: 'Female', age: 50, complaint: 'Post-menopausal syndrome, hot flashes, palpitations' },
  { name: 'Gaurav Vashisth', gender: 'Male', age: 33, complaint: 'Allergic rhinitis, sneezing fits in morning' },
  { name: 'Shobha Murthy', gender: 'Female', age: 70, complaint: 'Memory lapses, benign essential tremor evaluation' },
  { name: 'Kishore Kumar Das', gender: 'Male', age: 48, complaint: 'Elevated fasting blood sugar in home glucometer (168)' },
  { name: 'Ritu Trehan', gender: 'Female', age: 37, complaint: 'Migraine with aura, unilateral throbbing headache' },
  { name: 'Virendra Oberoi', gender: 'Male', age: 68, complaint: 'Prostatic enlargement symptoms, nocturia 4 times' },
  { name: 'Pushpa Krishnan', gender: 'Female', age: 55, complaint: 'Cervical spondylosis, neck pain radiating to right hand' },
  { name: 'Alok Dixit', gender: 'Male', age: 41, complaint: 'Fatty liver surveillance, elevated SGOT/SGPT on lab' },
  { name: 'Hemlata Pandey', gender: 'Female', age: 61, complaint: 'Osteoarthritis knee, advised intra-articular therapy' },
  { name: 'Tarun Mathur', gender: 'Male', age: 45, complaint: 'Dry hacking cough post flu for 4 weeks' },
  { name: 'Vandana Shukla', gender: 'Female', age: 32, complaint: 'Polycystic ovarian syndrome metabolic check' },
  { name: 'Satish Narang', gender: 'Male', age: 64, complaint: 'Peripheral arterial screening, calf claudication' },
  { name: 'Anuradha Bose', gender: 'Female', age: 52, complaint: 'Subclinical hypothyroidism, TSH 6.8' },
  { name: 'Nikhil Saxena', gender: 'Male', age: 27, complaint: 'Acute sprained ankle during badminton' },
  { name: 'Prem Lata Sethi', gender: 'Female', age: 74, complaint: 'Hypertensive heart disease maintenance' },
  { name: 'Rajiv Malhotra', gender: 'Male', age: 53, complaint: 'Elevated uric acid (8.2 mg/dL), great toe tenderness' },
  { name: 'Bhawna Jain', gender: 'Female', age: 46, complaint: 'Frequent tension headaches and eye strain' },
  { name: 'Rakesh Ahluwalia', gender: 'Male', age: 58, complaint: 'Chronic COPD follow-up, spirometry review' },
  { name: 'Sujata Deshmukh', gender: 'Female', age: 39, complaint: 'Acid peptic disease, epigastric burning' },
  { name: 'Kuldeep Gill', gender: 'Male', age: 47, complaint: 'Pre-operative fitness assessment for inguinal hernia' },
  { name: 'Nirmala Tewari', gender: 'Female', age: 66, complaint: 'Osteoporosis management, Vitamin D deficiency' },
  { name: 'Yogesh Bhardwaj', gender: 'Male', age: 35, complaint: 'Fatigue, sedentary lifestyle wellness check' },
  { name: 'Monika Sehgal', gender: 'Female', age: 40, complaint: 'Borderline glucose tolerance test review' },
  { name: 'Mahesh Chandra', gender: 'Male', age: 62, complaint: 'Routine ECG checkup, stable angina history' },
  { name: 'Sunil Grover', gender: 'Male', age: 50, complaint: 'Sleep apnea, daytime somnolence and snoring' },
  { name: 'Indira Nair', gender: 'Female', age: 58, complaint: 'Hypocalcemia review, paresthesias' },
  { name: 'Harish Bajaj', gender: 'Male', age: 71, complaint: 'Benign prostatic hyperplasia annual monitoring' }
];

export const HISTORICAL_PATIENT_RECORDS: HistoricalPatientRecord[] = [
  ...BASE_HISTORICAL_RECORDS,
  ...COMMON_NAMES.map((item, index): HistoricalPatientRecord => {
    const serialNum = 11 + index;
    const uhidStr = `QC-2026-80${serialNum}`;
    const day = (serialNum % 28) + 1;
    const month = serialNum % 2 === 0 ? '09' : '10';
    const dateStr = `2026-${month}-${day < 10 ? `0${day}` : day}`;
    const phone = `+91 ${97200 + serialNum} ${30000 + serialNum * 17}`;

    return {
      id: `hist-${serialNum}`,
      uhid: uhidStr,
      name: item.name,
      age: item.age,
      gender: item.gender,
      contact: phone,
      visitDate: dateStr,
      chiefComplaint: item.complaint,
      prescribedDoctorName: DEFAULT_ARCHIVE_DOCTOR_NAME,
      prescribedDoctorRoom: DEFAULT_ARCHIVE_DOCTOR_ROOM,
      completedTests: ['test-cbc', 'test-fbs'],
      testNames: ['Complete Blood Count', 'Blood Sugar Fasting'],
      status: 'completed',
      diagnosisNotes: 'Completed investigations. Clinical findings verified and discharge prescribed.'
    };
  })
];

/**
 * Returns historical archive records bound dynamically to a given hospital's attending doctor/room.
 */
export function getHistoricalPatientRecordsForHospital(hospital?: {
  doctorName?: string;
  doctorRoom?: string;
}): HistoricalPatientRecord[] {
  const doctorName = hospital?.doctorName || DEFAULT_ARCHIVE_DOCTOR_NAME;
  const doctorRoom = hospital?.doctorRoom || DEFAULT_ARCHIVE_DOCTOR_ROOM;
  return HISTORICAL_PATIENT_RECORDS.map(record => ({
    ...record,
    prescribedDoctorName: doctorName,
    prescribedDoctorRoom: doctorRoom
  }));
}
