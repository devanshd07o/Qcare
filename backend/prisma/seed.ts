import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding QCare database...');

  // ── Create demo hospitals
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
  ]);

  const demoHospital = hospitals[2]!;
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
  console.log(`✅ Departments: ${departments.length} created`);

  // ── Create counters
  const pathDept = departments.find(d => d.code === 'PATH')!;
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
  ]);
  console.log('✅ Counters created');

  // ── Create staff users
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
  ]);
  console.log(`✅ Staff users: ${staffUsers.map(u => u.email).join(', ')}`);

  // ── Create demo patient
  const doctor = staffUsers.find(u => u.role === 'doctor')!;
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

  // ── Create demo prescription
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

  console.log(`✅ Demo patient: ${demoPatient.uhid} (QR: ${demoPatient.qrSessionId})`);

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Demo credentials (password: QCare@123):');
  console.log('  doctor@demo.qcare       → Doctor Portal');
  console.log('  lab@demo.qcare          → Lab Portal');
  console.log('  pharmacist@demo.qcare   → Pharmacy Portal');
  console.log('  admin@demo.qcare        → Admin Portal');
  console.log('\n🔑 Demo Patient QR Session: QC-DEMO');
  console.log('  Scan QR at pharmacy to pull up Rajesh Kumar\'s prescriptions.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
