import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding QCare database...');

  // ── Create demo & MAX-01 hospitals
  const hospitals = await Promise.all([
    prisma.hospital.upsert({
      where: { code: 'AIIMS' },
      update: {},
      create: {
        name: 'AIIMS New Delhi',
        code: 'AIIMS',
        shortName: 'AIIMS',
        tagline: 'Delivering excellence in healthcare since 1956',
        address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi',
        city: 'New Delhi',
        contactNumber: '011-26588500',
        helpdeskPhone: '011-26588700',
        opdTimings: 'Mon–Sat, 08:30 AM – 02:00 PM',
        website: 'https://aiims.edu',
      },
    }),
    prisma.hospital.upsert({
      where: { code: 'APOLLO' },
      update: {},
      create: {
        name: 'Apollo Hospitals Delhi',
        code: 'APOLLO',
        shortName: 'Apollo',
        tagline: 'Touching Lives, Saving Lives',
        address: 'Sarita Vihar, Delhi Mathura Road, New Delhi',
        city: 'New Delhi',
        contactNumber: '011-71791090',
        helpdeskPhone: '1860-500-1066',
        opdTimings: 'Mon–Sat, 09:00 AM – 05:00 PM',
        website: 'https://apollohospitals.com',
      },
    }),
    prisma.hospital.upsert({
      where: { code: 'DEMO' },
      update: {},
      create: {
        name: 'QCare Demo Hospital',
        code: 'DEMO',
        shortName: 'QCare Demo',
        tagline: 'Powered by QCare — Smart Healthcare Platform',
        address: '1 Healthcare Avenue, Tech City',
        city: 'Demo City',
        contactNumber: '1800-QCARE-01',
        helpdeskPhone: '1800-QCARE-02',
        opdTimings: 'Mon–Sun, 08:00 AM – 08:00 PM',
        website: 'https://qcare.health',
      },
    }),
    prisma.hospital.upsert({
      where: { code: 'MAX-01' },
      update: {},
      create: {
        name: 'Max Super Speciality Hospital, Saket',
        code: 'MAX-01',
        shortName: 'Max Saket',
        tagline: 'Tertiary Care & Smart Diagnostic Network',
        address: '1-2, Press Enclave Marg, Saket, New Delhi, Delhi 110017',
        city: 'New Delhi',
        contactNumber: '+91 11 2651 5050',
        helpdeskPhone: '+91 11 2651 5050',
        opdTimings: 'Mon–Sat, 08:30 AM – 04:30 PM',
        website: 'https://www.maxhealthcare.in/hospital-network/max-super-speciality-hospital-saket',
      },
    }),
  ]);

  const demoHospital = hospitals[2]!;
  const maxHospital = hospitals[3]!;
  console.log(`✅ Hospitals: ${hospitals.map(h => h.code).join(', ')}`);

  // ── Create departments for DEMO hospital
  const deptData = [
    { code: 'PATH', name: 'Pathology & Blood Lab', category: 'pathology', wing: 'A', floor: 'G', room: '101', accentColor: '#ef4444', iconName: 'droplet', description: 'Blood tests, CBC, LFT, KFT, lipid profiles' },
    { code: 'CARD', name: 'Cardiology', category: 'cardiology', wing: 'B', floor: '1', room: '201', accentColor: '#ec4899', iconName: 'heart-pulse', description: 'ECG, Echo, TMT, Holter monitoring' },
    { code: 'RADIO', name: 'Radiology & Imaging', category: 'radiology', wing: 'C', floor: 'G', room: '102', accentColor: '#8b5cf6', iconName: 'scan-line', description: 'X-Ray, CT scan, MRI' },
    { code: 'USG', name: 'Ultrasound', category: 'ultrasound', wing: 'C', floor: 'G', room: '103', accentColor: '#06b6d4', iconName: 'waves', description: 'Abdominal, pelvic, Doppler ultrasound' },
    { code: 'NEURO', name: 'Neurology', category: 'neurology', wing: 'D', floor: '2', room: '301', accentColor: '#f59e0b', iconName: 'brain', description: 'EEG, nerve conduction studies' },
    { code: 'PULM', name: 'Pulmonology', category: 'pulmonary', wing: 'D', floor: '2', room: '302', accentColor: '#10b981', iconName: 'wind', description: 'PFT, spirometry, bronchoscopy' },
  ];

  const departments = await Promise.all(
    deptData.map((d) =>
      prisma.department.upsert({
        where: { hospitalId_code: { hospitalId: demoHospital.id, code: d.code } },
        update: {},
        create: { hospitalId: demoHospital.id, ...d },
      })
    )
  );
  console.log(`✅ DEMO Departments: ${departments.length} created`);

  // ── Create departments for MAX-01 hospital (matching frontend MAX-01 layout)
  const maxDeptData = [
    { code: 'BLD', name: 'Phlebotomy & Blood Lab', category: 'pathology', wing: 'East Wing', floor: 'Ground Floor', room: 'Room 12', accentColor: '#DC2626', iconName: 'Droplet', description: 'Blood sample collection, CBC, ESR, routine microscopy' },
    { code: 'BIO', name: 'Biochemistry & Metabolic Lab', category: 'biochemistry', wing: 'East Wing', floor: 'Ground Floor', room: 'Room 14', accentColor: '#D97706', iconName: 'FlaskConical', description: 'Fasting glucose, HbA1c, Lipid profile, renal panel' },
    { code: 'ECG', name: 'Cardiology Diagnostic Suite', category: 'cardiology', wing: 'Heart Institute Wing', floor: '1st Floor', room: 'Room 104', accentColor: '#2563EB', iconName: 'Activity', description: '12-lead digital ECG, cardiac rhythm evaluation' },
    { code: 'RAD', name: 'Radiology & Digital Imaging', category: 'radiology', wing: 'Imaging Block', floor: 'Basement 1', room: 'Room B-08', accentColor: '#7C3AED', iconName: 'ScanLine', description: 'Low-dose digital X-Ray PA/Lateral views' },
    { code: 'USG', name: 'Ultrasonography & Doppler Suite', category: 'ultrasound', wing: 'Sonography Wing', floor: 'Ground Floor', room: 'Room 10', accentColor: '#0D9488', iconName: 'Waves', description: 'Whole abdomen, pelvic, and Doppler sonography' },
  ];

  const maxDepartments = await Promise.all(
    maxDeptData.map((d) =>
      prisma.department.upsert({
        where: { hospitalId_code: { hospitalId: maxHospital.id, code: d.code } },
        update: {},
        create: { hospitalId: maxHospital.id, ...d },
      })
    )
  );
  console.log(`✅ MAX-01 Departments: ${maxDepartments.length} created`);

  // ── Create counters for DEMO & MAX-01
  const pathDept = departments.find(d => d.code === 'PATH')!;
  const maxPhlebDept = maxDepartments.find(d => d.code === 'BLD')!;
  const maxBioDept = maxDepartments.find(d => d.code === 'BIO')!;
  const maxCardioDept = maxDepartments.find(d => d.code === 'ECG')!;

  await Promise.all([
    prisma.counter.upsert({
      where: { hospitalId_code: { hospitalId: demoHospital.id, code: 'PATH-A' } },
      update: {},
      create: { hospitalId: demoHospital.id, departmentId: pathDept.id, code: 'PATH-A', name: 'Blood Collection A', roomNo: '101-A', technicianName: 'Ramesh Kumar', status: 'active', averageServiceMinutes: 8 },
    }),
    prisma.counter.upsert({
      where: { hospitalId_code: { hospitalId: demoHospital.id, code: 'PATH-B' } },
      update: {},
      create: { hospitalId: demoHospital.id, departmentId: pathDept.id, code: 'PATH-B', name: 'Blood Collection B', roomNo: '101-B', technicianName: 'Priya Sharma', status: 'active', averageServiceMinutes: 8 },
    }),
    prisma.counter.upsert({
      where: { hospitalId_code: { hospitalId: maxHospital.id, code: 'B-01' } },
      update: {},
      create: { hospitalId: maxHospital.id, departmentId: maxPhlebDept.id, code: 'B-01', name: 'Phlebotomy Bay Alpha', roomNo: 'Room 12', technicianName: 'Sunil Kumar', status: 'active', averageServiceMinutes: 6 },
    }),
    prisma.counter.upsert({
      where: { hospitalId_code: { hospitalId: maxHospital.id, code: 'BIO-01' } },
      update: {},
      create: { hospitalId: maxHospital.id, departmentId: maxBioDept.id, code: 'BIO-01', name: 'Biochemistry Counter 1', roomNo: 'Room 14', technicianName: 'Anita Sen', status: 'active', averageServiceMinutes: 6 },
    }),
    prisma.counter.upsert({
      where: { hospitalId_code: { hospitalId: maxHospital.id, code: 'E-01' } },
      update: {},
      create: { hospitalId: maxHospital.id, departmentId: maxCardioDept.id, code: 'E-01', name: 'Cardiac Rhythm Station 1', roomNo: 'Room 104', technicianName: 'Vikram Das', status: 'active', averageServiceMinutes: 5 },
    }),
  ]);
  console.log('✅ Counters created');

  // ── Create staff users (DEMO + MAX-01)
  const passwordHash = await bcrypt.hash('QCare@123', 12);

  const staffUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'doctor@demo.qcare' },
      update: {},
      create: {
        hospitalId: demoHospital.id,
        role: 'doctor',
        name: 'Dr. Arjun Sharma',
        email: 'doctor@demo.qcare',
        passwordHash,
        identifier: 'MCI-12345',
        speciality: 'General Medicine',
        gender: 'Male',
      },
    }),
    prisma.user.upsert({
      where: { email: 'lab@demo.qcare' },
      update: {},
      create: {
        hospitalId: demoHospital.id,
        role: 'lab_tech',
        name: 'Rohit Verma',
        email: 'lab@demo.qcare',
        passwordHash,
        identifier: 'LAB-7890',
        speciality: 'Clinical Pathology',
        gender: 'Male',
      },
    }),
    prisma.user.upsert({
      where: { email: 'pharmacist@demo.qcare' },
      update: {},
      create: {
        hospitalId: demoHospital.id,
        role: 'pharmacist',
        name: 'Sunita Patel',
        email: 'pharmacist@demo.qcare',
        passwordHash,
        identifier: 'PHARM-4567',
        speciality: 'Clinical Pharmacy',
        gender: 'Female',
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@demo.qcare' },
      update: {},
      create: {
        hospitalId: demoHospital.id,
        role: 'admin',
        name: 'Admin User',
        email: 'admin@demo.qcare',
        passwordHash,
        identifier: 'ADMIN-001',
      },
    }),
    prisma.user.upsert({
      where: { email: 'doctor@max01.qcare' },
      update: {},
      create: {
        hospitalId: maxHospital.id,
        role: 'doctor',
        name: 'Dr. Ananya Sen',
        email: 'doctor@max01.qcare',
        passwordHash,
        identifier: 'Chamber 204',
        speciality: 'Senior Consultant · Internal Medicine, MD',
        gender: 'Female',
        avatar: '/doctors/doctor_female_1.jpg',
      },
    }),
    prisma.user.upsert({
      where: { email: 'lab@max01.qcare' },
      update: {},
      create: {
        hospitalId: maxHospital.id,
        role: 'lab_tech',
        name: 'Sunil Kumar',
        email: 'lab@max01.qcare',
        passwordHash,
        identifier: 'LAB-MAX-01',
        speciality: 'Phlebotomy & Blood Lab',
        gender: 'Male',
      },
    }),
    prisma.user.upsert({
      where: { email: 'pharmacist@max01.qcare' },
      update: {},
      create: {
        hospitalId: maxHospital.id,
        role: 'pharmacist',
        name: 'Meera Kapoor',
        email: 'pharmacist@max01.qcare',
        passwordHash,
        identifier: 'PHARM-MAX-01',
        speciality: 'Clinical Pharmacy',
        gender: 'Female',
      },
    }),
  ]);
  console.log(`✅ Staff users: ${staffUsers.map(u => u.email).join(', ')}`);

  // ── Create demo patient (DEMO hospital)
  const doctor = staffUsers.find(u => u.email === 'doctor@demo.qcare')!;
  const demoPatient = await prisma.patient.upsert({
    where: { uhid: 'QC-2026-DEMO' },
    update: {},
    create: {
      uhid: 'QC-2026-DEMO',
      qrSessionId: 'QC-DEMO',
      hospitalId: demoHospital.id,
      name: 'Rajesh Kumar',
      age: 42,
      gender: 'Male',
      contact: '9876543210',
      bloodGroup: 'B+',
      allergies: 'Penicillin',
      chronicConditions: 'Hypertension, Type 2 Diabetes',
      priority: 'standard',
    },
  });

  // ── Create demo prescription (DEMO hospital)
  const existingRx = await prisma.prescription.findFirst({ where: { patientId: demoPatient.id } });
  if (!existingRx) {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    await prisma.prescription.create({
      data: {
        id: 'RX-DEMO001',
        patientId: demoPatient.id,
        doctorId: doctor.id,
        hospitalId: demoHospital.id,
        diagnosis: 'Hypertension with Type 2 Diabetes Mellitus',
        clinicalNotes: 'BP: 148/92 mmHg. HbA1c: 7.8%. Continue lifestyle modifications. Review in 4 weeks.',
        followUpDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        validUntil,
        medications: {
          create: [
            { drugName: 'Amlodipine', dose: '5mg', frequency: 'Once daily (OD)', duration: '30 days', route: 'Oral', instructions: 'Take in the morning', quantity: '30 tablets' },
            { drugName: 'Metformin', genericName: 'Metformin HCl', dose: '500mg', frequency: 'Twice daily (BD)', duration: '30 days', route: 'Oral', instructions: 'After meals', quantity: '60 tablets' },
            { drugName: 'Atorvastatin', dose: '20mg', frequency: 'Once daily (OD)', duration: '30 days', route: 'Oral', instructions: 'At bedtime', quantity: '30 tablets' },
          ],
        },
      },
    });

    await prisma.medicalHistoryEntry.create({
      data: {
        patientId: demoPatient.id,
        type: 'prescription',
        title: 'Prescription issued by Dr. Arjun Sharma',
        summary: 'Diagnosis: Hypertension with Type 2 Diabetes. 3 medications prescribed.',
        linkedPrescriptionId: 'RX-DEMO001',
      },
    });
  }

  // ── Create MAX-01 canonical patient (Rameshwar Sharma / QC-9411) + active Rx
  const maxDoctor = staffUsers.find(u => u.email === 'doctor@max01.qcare')!;
  const rameshwarPatient = await prisma.patient.upsert({
    where: { uhid: 'QC-2026-9411' },
    update: {},
    create: {
      uhid: 'QC-2026-9411',
      qrSessionId: 'QC-9411',
      hospitalId: maxHospital.id,
      name: 'Rameshwar Sharma',
      age: 52,
      gender: 'Male',
      contact: '+91 98765 43210',
      chronicConditions: 'Suspected Angina, Impaired Fasting Glucose',
      priority: 'standard',
    },
  });

  const existingMaxRx = await prisma.prescription.findFirst({ where: { patientId: rameshwarPatient.id } });
  if (!existingMaxRx) {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    await prisma.prescription.create({
      data: {
        id: 'RX-MAX-9411',
        patientId: rameshwarPatient.id,
        doctorId: maxDoctor.id,
        hospitalId: maxHospital.id,
        diagnosis: 'Exertional Chest Discomfort — Rule Out Acute Coronary Syndrome',
        clinicalNotes: 'Monitor BP daily. Avoid strenuous exertion until 12-Lead ECG & Chest X-Ray review.',
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        validUntil,
        medications: {
          create: [
            { drugName: 'Atorva / Lipitor', genericName: 'Atorvastatin', dose: '20mg', frequency: 'Once daily (OD)', duration: '30 days', route: 'Oral', instructions: 'At bedtime', quantity: '30 tablets' },
            { drugName: 'Amlodac / Norvasc', genericName: 'Amlodipine', dose: '5mg', frequency: 'Once daily (OD)', duration: '30 days', route: 'Oral', instructions: 'After breakfast', quantity: '30 tablets' },
            { drugName: 'Omez / Pan', genericName: 'Omeprazole', dose: '20mg', frequency: 'Once daily (OD)', duration: '14 days', route: 'Oral', instructions: 'Before breakfast', quantity: '14 capsules' },
          ],
        },
      },
    });

    await prisma.medicalHistoryEntry.create({
      data: {
        patientId: rameshwarPatient.id,
        type: 'prescription',
        title: 'Prescription issued by Dr. Ananya Sen',
        summary: 'Diagnosis: Exertional Chest Discomfort. 3 medications prescribed.',
        linkedPrescriptionId: 'RX-MAX-9411',
      },
    });
  }

  console.log(`✅ Demo patient: ${demoPatient.uhid} (QR: ${demoPatient.qrSessionId})`);
  console.log(`✅ MAX-01 patient: ${rameshwarPatient.uhid} (QR: ${rameshwarPatient.qrSessionId})`);

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Demo credentials (password: QCare@123):');
  console.log('  doctor@demo.qcare       → Doctor Portal (DEMO)');
  console.log('  lab@demo.qcare          → Lab Portal (DEMO)');
  console.log('  pharmacist@demo.qcare   → Pharmacy Portal (DEMO)');
  console.log('  admin@demo.qcare        → Admin Portal (DEMO)');
  console.log('  doctor@max01.qcare      → Doctor Portal (MAX-01 · Dr. Ananya Sen)');
  console.log('  lab@max01.qcare         → Lab Portal (MAX-01)');
  console.log('  pharmacist@max01.qcare  → Pharmacy Portal (MAX-01)');
  console.log('\n🔑 Demo Patient QR Sessions: QC-DEMO (DEMO), QC-9411 (MAX-01)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
