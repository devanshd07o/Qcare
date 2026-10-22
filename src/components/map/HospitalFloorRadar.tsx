import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Navigation,
  AlertCircle,
  Check,
  Compass,
  CornerDownRight
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { RouteStep } from '../../types';
import '../../styles/qcare-motion.css';

interface HospitalFloorRadarProps {
  onClose?: () => void;
}

type FloorKey = 'Ground Floor' | '1st Floor' | '2nd Floor' | 'Basement 1';

interface PlanRoom {
  deptId?: string;          // live department (interactive)
  testId?: string;          // test used for the "done" marker
  tag: string;              // room code label
  fallbackName: string;
  sub: string;
  accent: string;
  x: number;
  y: number;
  w: number;
  h: number;
  footer?: string;          // static rooms only
}

const FLOOR_ROOMS: Record<FloorKey, PlanRoom[]> = {
  'Ground Floor': [
    { deptId: 'dept-pathology', testId: 'test-cbc', tag: 'ROOM G-102 · EAST', fallbackName: 'Blood Sample Collection', sub: 'Phlebotomy Bay · CBC, Serum & Lipid', accent: '#dc2626', x: 40, y: 60, w: 300, h: 170 },
    { deptId: 'dept-biochem', testId: 'test-fbs', tag: 'ROOM G-106 · EAST', fallbackName: 'Biochemistry & Metabolic', sub: 'Fasting Glucose, HbA1c & Profiles', accent: '#d97706', x: 40, y: 255, w: 300, h: 170 },
    { deptId: 'dept-ultrasound', testId: 'test-usg-abdomen', tag: 'ROOM G-215 · WEST', fallbackName: 'Ultrasonography & Doppler', sub: 'Whole Abdomen & Pelvic USG', accent: '#7c3aed', x: 580, y: 60, w: 300, h: 170 },
    { tag: 'CENTRAL LOUNGE', fallbackName: 'Diagnostic Waiting Area', sub: 'Chime Audio & Digital Screen Displays', accent: '#64748b', x: 580, y: 255, w: 300, h: 170, footer: 'Seating capacity: 40 seats · Air conditioned' }
  ],
  '1st Floor': [
    { deptId: 'dept-cardio', testId: 'test-ecg', tag: 'ROOM 104-A · 1ST FLOOR', fallbackName: 'Cardiology Diagnostic Suite', sub: '12-Lead Digital ECG & Rhythm Analysis', accent: '#2563eb', x: 40, y: 100, w: 310, h: 260 },
    { tag: 'OPD-108 · EAST WING', fallbackName: 'Internal Medicine OPD', sub: 'Dr. Priya Shenoy (Head of Medicine)', accent: '#64748b', x: 570, y: 100, w: 310, h: 260, footer: 'Consultation Chamber · In Session' }
  ],
  '2nd Floor': [
    { deptId: 'dept-ophthalmology', testId: 'test-oct-retina', tag: 'ROOM 208 · 2ND FLOOR', fallbackName: 'Ophthalmic Diagnostics', sub: 'Digital Fundus & OCT Retinal Scans', accent: '#0891b2', x: 40, y: 100, w: 310, h: 260 },
    { tag: 'OPD-204 · CENTRAL', fallbackName: 'Cardiology OPD Doctor Chamber', sub: 'Dr. Arvind Swaminathan (Consultant)', accent: '#64748b', x: 570, y: 100, w: 310, h: 260, footer: 'Final Consultation & Report Sign-Off' }
  ],
  'Basement 1': [
    { deptId: 'dept-radiology', testId: 'test-xray-chest', tag: 'VAULT B1-08 · LEAD SHIELDED', fallbackName: 'Digital X-Ray Vault', sub: 'Low-Dose Chest PA & Skeletal Radiography', accent: '#6d28d9', x: 40, y: 100, w: 310, h: 260 },
    { tag: 'VAULT B1-12 · RADIOLOGY', fallbackName: 'CT Scan & Imaging Suite', sub: 'High-Speed 128-Slice Spiral Scanner', accent: '#64748b', x: 570, y: 100, w: 310, h: 260, footer: 'Scheduled inpatient procedures' }
  ]
};

const FLOORS = ['Ground Floor', '1st Floor', '2nd Floor', 'Basement 1'] as const;

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

export const HospitalFloorRadar: React.FC<HospitalFloorRadarProps> = ({ onClose }) => {
  const {
    departments,
    counters,
    queueTokens,
    selectedPatient,
    currentRoutingPlan,
    tests,
    markTestCompletedByPatient,
    language
  } = useHospitalStore();

  const hi = language === 'hi';

  // Find the patient's current upcoming diagnostic test
  const upNextStep = useMemo(() => {
    return currentRoutingPlan.smartRouteSteps.find(
      (s: RouteStep) => !selectedPatient?.completedTests.includes(s.testId)
    );
  }, [currentRoutingPlan.smartRouteSteps, selectedPatient?.completedTests]);

  // Default active floor to the floor of the upcoming test, or Ground Floor
  const initialFloor: FloorKey = (upNextStep?.location.floor as FloorKey) || 'Ground Floor';
  const [activeFloor, setActiveFloor] = useState<FloorKey>(initialFloor);

  // Selected department for inspection deck (defaults to upcoming test dept)
  const [selectedDeptId, setSelectedDeptId] = useState<string>(() => {
    return upNextStep?.departmentId || 'dept-ultrasound';
  });

  // Live statistics for all departments
  const deptStats = useMemo(() => {
    return departments.map(dept => {
      const deptCounters = counters.filter(c => c.departmentId === dept.id);
      const activeCounters = deptCounters.filter(c => c.status === 'active');
      const waitingTokens = queueTokens.filter(t => t.departmentId === dept.id && (t.status === 'waiting' || t.status === 'in_progress'));

      const effectiveCountersCount = Math.max(1, activeCounters.length);
      const avgDuration = activeCounters.length > 0 && activeCounters[0].averageServiceMinutes
        ? activeCounters[0].averageServiceMinutes
        : 6.0;

      // Realistic wait time: 0 if no queue, else (waitingCount * avgDuration) / counters
      const waitMins = waitingTokens.length === 0
        ? 0
        : Math.max(4, Math.round((waitingTokens.length * avgDuration) / effectiveCountersCount));

      return { dept, deptCounters, activeCounters, waitingTokens, waitMins };
    });
  }, [departments, counters, queueTokens]);

  // Selected department details
  const selectedDept = departments.find(d => d.id === selectedDeptId) || departments[0];
  const selectedStats = deptStats.find(s => s.dept.id === selectedDept?.id);

  // Check if patient has prescribed test in selected room
  const matchingPatientStep = currentRoutingPlan.smartRouteSteps.find(
    (s: RouteStep) => s.departmentId === selectedDept?.id
  );
  const isStepDone = matchingPatientStep
    ? selectedPatient?.completedTests.includes(matchingPatientStep.testId)
    : false;

  const matchingTest = tests.find(t => t.departmentId === selectedDept?.id);

  const getFloorRoomCount = (floor: FloorKey) => departments.filter(d => d.location.floor === floor).length;

  const isGround = activeFloor === 'Ground Floor';
  const startY = isGround ? 385 : 128;

  const renderRoom = (room: PlanRoom) => {
    const { deptId, testId, x, y, w, h } = room;
    const dept = deptId ? departments.find(d => d.id === deptId) : undefined;
    const stats = deptId ? deptStats.find(s => s.dept.id === deptId) : undefined;
    const interactive = !!deptId;
    const isSelected = interactive && selectedDeptId === deptId;
    const isTarget = interactive && upNextStep?.departmentId === deptId;
    const isDone = interactive && !!testId && !!selectedPatient?.completedTests.includes(testId);
    const waiting = stats?.waitingTokens.length ?? 0;
    const mins = stats?.waitMins ?? 0;

    const stroke = isSelected ? '#0f766e' : isTarget ? '#d97706' : isDone ? '#10b981' : '#cbd5e1';
    const sw = isSelected || isTarget ? 2.5 : 1.5;
    const tagW = room.tag.length * 6.3 + 26;
    const rightEdge = x < 460; // door faces corridor
    const doorX = rightEdge ? w : 0;

    const badgeW = isDone ? 64 : 92;

    return (
      <g
        key={room.tag}
        transform={`translate(${x}, ${y})`}
        className={interactive ? 'qc-room' : undefined}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? `${dept?.name || room.fallbackName}, ${waiting} waiting` : undefined}
        onClick={interactive ? () => setSelectedDeptId(deptId as string) : undefined}
        onKeyDown={interactive ? (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDeptId(deptId as string); }
        } : undefined}
      >
        <rect
          className={`qc-body ${isSelected ? 'sel' : ''}`}
          width={w}
          height={h}
          rx="14"
          fill={isSelected ? '#f0fdfa' : interactive ? '#ffffff' : '#f1f5f9'}
          stroke={stroke}
          strokeWidth={sw}
          strokeDasharray={interactive ? undefined : '5 4'}
        />
        {/* door opening */}
        <rect x={doorX - 4} y={h / 2 - 20} width="8" height="40" fill="#f8fafc" />
        <line x1={doorX - 4} y1={h / 2 - 20} x2={doorX - 4} y2={h / 2 + 20} stroke={stroke} strokeWidth="1" opacity="0.6" />

        {/* tag */}
        <rect x="18" y="16" width={tagW} height="22" rx="11" fill={room.accent} fillOpacity="0.1" />
        <circle cx="29" cy="27" r="3" fill={room.accent} />
        <text x="38" y="31" fill="#334155" fontSize="9.5" fontWeight="600" letterSpacing="0.6">{room.tag}</text>

        {/* status badge */}
        {isDone ? (
          <g transform={`translate(${w - 18 - badgeW}, 16)`}>
            <rect width={badgeW} height="22" rx="11" fill="#ecfdf5" stroke="#10b981" />
            <text x={badgeW / 2} y="15" fill="#047857" fontSize="9.5" fontWeight="700" textAnchor="middle" letterSpacing="0.6">{hi ? '✓ पूर्ण' : '✓ DONE'}</text>
          </g>
        ) : isTarget ? (
          <g transform={`translate(${w - 18 - badgeW}, 16)`}>
            <rect width={badgeW} height="22" rx="11" fill="#fffbeb" stroke="#f59e0b" />
            <text x={badgeW / 2} y="15" fill="#b45309" fontSize="9.5" fontWeight="700" textAnchor="middle" letterSpacing="0.6">{hi ? 'अगला पड़ाव' : 'NEXT STOP'}</text>
          </g>
        ) : null}

        {/* titles */}
        <text x="18" y={h > 200 ? 84 : 72} fill="#0f172a" fontSize={h > 200 ? 16 : 14.5} fontWeight="600">
          {clip(dept?.name || room.fallbackName, 30)}
        </text>
        <text x="18" y={h > 200 ? 106 : 92} fill="#64748b" fontSize="11.5">{clip(room.sub, 44)}</text>

        {/* queue block / footer */}
        <rect x="18" y={h - 54} width={w - 36} height="36" rx="10" fill="#f1f5f9" />
        {interactive ? (
          <>
            <text x="32" y={h - 31} fill="#475569" fontSize="11.5" fontWeight="600">
              {hi ? `कतार: ${waiting} प्रतीक्षा में` : `Queue: ${waiting} waiting`}
            </text>
            <text x={w - 32} y={h - 31} fill={mins === 0 ? '#047857' : '#0f766e'} fontSize="11.5" fontWeight="700" textAnchor="end">
              {mins === 0 ? (hi ? 'कोई प्रतीक्षा नहीं' : 'No wait') : `~${mins} ${hi ? 'मिनट' : 'min'}`}
            </text>
          </>
        ) : (
          <text x="32" y={h - 31} fill="#64748b" fontSize="11.5">{room.footer}</text>
        )}
      </g>
    );
  };

  const rooms = FLOOR_ROOMS[activeFloor];
  const targetRoom = rooms.find(r => r.deptId && r.deptId === upNextStep?.departmentId);

  const renderPath = () => {
    if (!targetRoom) return null;
    const doorY = targetRoom.y + targetRoom.h / 2;
    const endX = targetRoom.x < 460 ? targetRoom.x + targetRoom.w + 4 : targetRoom.x - 4;
    const d = `M 460 ${startY} L 460 ${doorY} L ${endX} ${doorY}`;
    return (
      <g>
        <path d={d} fill="none" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        <path d={d} fill="none" stroke="url(#walkGrad)" strokeWidth="3.5" strokeDasharray="8 6" strokeLinecap="round" strokeLinejoin="round" className="qc-march" />
        <circle cx={endX} cy={doorY} r="5" fill="#f59e0b" className="qc-beacon" />
        <circle cx={endX} cy={doorY} r="4" fill="#f59e0b" />
      </g>
    );
  };

  return (
    <div className="qc-root bg-white text-slate-900 rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-5 relative overflow-hidden">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="qc-focus qc-press min-h-[36px] px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{hi ? 'वापस' : 'Back'}</span>
            </button>
          )}
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              <Compass className="w-[18px] h-[18px] text-teal-700 shrink-0" />
              <span>{hi ? 'अस्पताल इंडोर नेविगेशन' : 'Hospital indoor wayfinding'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {hi ? 'लाइव वॉकिंग पाथ और कमरों की वास्तविक कतार के साथ फ्लोर प्लान।' : 'Floor plan with live walking path and real-time room queues.'}
            </p>
          </div>
        </div>

        {/* Floor selector */}
        <div role="tablist" className="flex items-center gap-1 p-1 bg-slate-100/90 border border-slate-200/70 rounded-2xl text-xs overflow-x-auto max-w-full">
          {FLOORS.map(f => {
            const count = getFloorRoomCount(f);
            const isTargetFloor = upNextStep?.location.floor === f;
            const active = activeFloor === f;
            return (
              <button
                key={f}
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setActiveFloor(f);
                  const firstDeptOnFloor = departments.find(d => d.location.floor === f);
                  if (firstDeptOnFloor) setSelectedDeptId(firstDeptOnFloor.id);
                }}
                className={`qc-focus px-3 min-h-[34px] rounded-xl whitespace-nowrap transition-all duration-200 font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                  active ? 'bg-white text-teal-800 shadow-sm border border-slate-200/70' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{f}</span>
                {isTargetFloor && <span className={`w-1.5 h-1.5 rounded-full bg-amber-500 ${active ? '' : 'qc-ring-amber'}`} />}
                <span className={`qc-mono text-[10px] px-1.5 rounded-md ${active ? 'bg-teal-50 text-teal-700' : 'bg-slate-200/70 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floor plan */}
      <div className="relative w-full rounded-2xl border border-slate-200 bg-slate-50 p-1.5 sm:p-3 select-none overflow-hidden">
        <svg
          key={activeFloor}
          viewBox="0 0 920 480"
          className="qc-plan-in w-full h-auto max-h-[460px]"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`${activeFloor} floor plan`}
        >
          <defs>
            <pattern id="planGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" opacity="0.7" />
            </pattern>
            <linearGradient id="walkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0f766e" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>

          {/* Outer wall + grid */}
          <rect x="10" y="10" width="900" height="460" rx="22" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
          <rect x="10" y="10" width="900" height="460" rx="22" fill="url(#planGrid)" />

          {/* Corridor */}
          <rect x="360" y="30" width="200" height="420" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="6 4" />
          <text x="460" y="48" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle" letterSpacing="2.5">
            {hi ? 'मुख्य गलियारा' : 'CENTRAL CORRIDOR'}
          </text>

          {/* Elevator bank */}
          <g transform="translate(390, 62)">
            <rect width="140" height="62" rx="12" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <rect x="14" y="14" width="14" height="26" rx="2" fill="#e2e8f0" stroke="#94a3b8" />
            <rect x="30" y="14" width="14" height="26" rx="2" fill="#e2e8f0" stroke="#94a3b8" />
            <text x="58" y="26" fill="#0f172a" fontSize="11" fontWeight="600">{hi ? 'लिफ्ट' : 'Central Elevators'}</text>
            <text x="58" y="42" fill="#64748b" fontSize="9">B1 · G · 1F · 2F</text>
          </g>

          {/* Restroom + water (kept clear of the walking path) */}
          <g transform="translate(484, 176)">
            <rect width="62" height="58" rx="10" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
            <text x="31" y="26" fill="#475569" fontSize="11" fontWeight="700" textAnchor="middle">WC</text>
            <text x="31" y="44" fill="#94a3b8" fontSize="9" textAnchor="middle">{hi ? 'जल' : 'Water'}</text>
          </g>

          {/* Reception / nurse hub */}
          {isGround && (
            <g transform="translate(380, 385)">
              <rect width="160" height="60" rx="12" fill="#f0fdfa" stroke="#0f766e" strokeWidth="1.5" />
              <text x="80" y="27" fill="#0f172a" fontSize="12" fontWeight="600" textAnchor="middle">{hi ? 'मुख्य रिसेप्शन' : 'Main Reception'}</text>
              <text x="80" y="44" fill="#0f766e" fontSize="9.5" textAnchor="middle">{hi ? 'OPD पंजीकरण व ट्राइएज' : 'OPD Registration & Triage'}</text>
            </g>
          )}
          {activeFloor === '1st Floor' && (
            <g transform="translate(380, 385)">
              <rect width="160" height="60" rx="12" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
              <text x="80" y="27" fill="#0f172a" fontSize="12" fontWeight="600" textAnchor="middle">1st Floor Nurse Hub</text>
              <text x="80" y="44" fill="#64748b" fontSize="9.5" textAnchor="middle">Vitals &amp; Token Screen</text>
            </g>
          )}

          {/* Rooms */}
          {rooms.map(renderRoom)}

          {/* Animated path */}
          {renderPath()}

          {/* You-are-here marker (ground floor start) */}
          {isGround && (
            <g>
              <circle cx="460" cy="385" r="5" fill="#0f766e" className="qc-beacon" />
              <circle cx="460" cy="385" r="4.5" fill="#0f766e" stroke="#ffffff" strokeWidth="1.5" />
              <text x="472" y="375" fill="#0f766e" fontSize="9.5" fontWeight="700" letterSpacing="0.6">{hi ? 'आप यहां हैं' : 'YOU ARE HERE'}</text>
            </g>
          )}
        </svg>
      </div>

      {/* Room inspection deck */}
      {selectedDept && (
        <div key={selectedDept.id} className="qc-rise rounded-2xl bg-slate-50/70 border border-slate-200 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="qc-mono text-[11px] font-semibold text-teal-800 uppercase tracking-wider">
                    {selectedDept.location.room}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {selectedDept.location.floor} · {selectedDept.location.wing}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mt-0.5 truncate">{selectedDept.name}</h3>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs">
              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200">
                <span className="qc-label block">{hi ? 'आगे प्रतीक्षा में' : 'Waiting ahead'}</span>
                <span className="font-semibold text-slate-900 inline-flex items-center gap-1.5 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-teal-700" />
                  <span className="qc-mono">{selectedStats?.waitingTokens.length ?? 0}</span>
                  <span className="font-normal text-slate-500">{hi ? 'मरीज' : 'patients'}</span>
                </span>
              </div>
              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200">
                <span className="qc-label block">{hi ? 'अनुमानित प्रतीक्षा' : 'Estimated wait'}</span>
                <span className="font-semibold text-teal-800 inline-flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="qc-mono">
                    {(selectedStats?.waitMins ?? 0) === 0 ? (hi ? 'कोई नहीं' : 'No wait') : `~${selectedStats?.waitMins} ${hi ? 'मिनट' : 'min'}`}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-teal-700" />
                <span>{hi ? 'चलने के निर्देश' : 'Walking directions'}</span>
              </div>
              <p className="text-slate-600 leading-relaxed flex items-start gap-1.5">
                <CornerDownRight className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  {activeFloor === 'Ground Floor'
                    ? `From Main Reception, head straight past the central corridor towards ${selectedDept.location.wing}. Enter ${selectedDept.location.room}.`
                    : `Take Central Elevators to ${selectedDept.location.floor}. Exit toward ${selectedDept.location.wing} hallway to ${selectedDept.location.room}.`}
                </span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>{hi ? 'तैयारी निर्देश' : 'Preparation instructions'}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {matchingTest?.preparationNotes ||
                  'Please wait outside until your token chimes over the speaker. Keep your digital boarding pass ready.'}
              </p>
            </div>
          </div>

          {matchingPatientStep && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
              <div className="text-xs text-slate-600">
                {isStepDone ? (
                  <span className="text-emerald-700 font-semibold inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{hi ? 'यह जांच पूरी और सत्यापित है।' : 'This test is already completed and verified.'}</span>
                  </span>
                ) : (
                  <span>{hi ? 'यह जांच पहले करा चुके हैं या बाहरी रिपोर्ट है?' : 'Already completed this test earlier or hold an external report?'}</span>
                )}
              </div>

              {!isStepDone && selectedPatient && (
                <button
                  type="button"
                  onClick={() => {
                    markTestCompletedByPatient(
                      selectedPatient.id,
                      matchingPatientStep.testId,
                      'Patient marked done from Hospital Map'
                    );
                  }}
                  className="qc-focus qc-press min-h-[38px] px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{hi ? 'मेरे पास रिपोर्ट है · पूर्ण करें' : 'I have this report · Mark done'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Legend + footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-700" /><span>{hi ? 'चयनित कमरा' : 'Selected room'}</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span>{hi ? 'अगला पड़ाव' : 'Next stop'}</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span>{hi ? 'पूर्ण जांच' : 'Completed test'}</span></div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="qc-focus qc-press min-h-[36px] px-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-colors text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{hi ? 'डैशबोर्ड पर लौटें' : 'Return to dashboard'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
