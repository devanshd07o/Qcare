import React, { useState, useRef, useEffect } from 'react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { askQBiePublicAI, getPublicClinicalFallback } from '../../engine/groqService';
import { REGISTERED_HOSPITALS, findHospitalByQuery } from '../../data/mockHospitalData';
import { Hospital } from '../../types';
import {
  Globe,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  HelpCircle,
  FileText,
  X,
  Send,
  Move,
  Building2,
  Search
} from 'lucide-react';

// ==========================================
// QCare Official Tagline
// ==========================================
export const QCARE_TAGLINE = {
  en: "Intelligent Hospital Queue & Diagnostic Flow Orchestration",
  hi: "स्मार्ट अस्पताल कतार एवं डायग्नोस्टिक प्रवाह प्रबंधन"
};

// ==========================================
// Authentic Clinical Advisory (Zero Emojis, Pure Editorial Typography)
// ==========================================
interface TickerItem {
  title: { en: string; hi: string };
  desc: { en: string; hi: string };
}

export const QCARE_TICKER_UPDATES: TickerItem[] = [
  {
    title: { en: 'Fasting Guidelines', hi: 'खाली पेट जांच' },
    desc: {
      en: '8–10 hours overnight fasting required for Blood Sugar and Lipid Profile (water permitted)',
      hi: 'फास्टिंग ब्लड शुगर एवं लिपिड प्रोफाइल के लिए 8–10 घंटे खाली पेट रहना आवश्यक है'
    }
  },
  {
    title: { en: 'Dynamic Queue Routing', hi: 'स्मार्ट कतार राउटिंग' },
    desc: {
      en: 'QCare automatically directs patients to lowest-wait diagnostic counters',
      hi: 'मरीजों को स्वतः सबसे कम प्रतीक्षा वाले जांच काउंटर पर भेजा जाता है'
    }
  },
  {
    title: { en: 'Digital Boarding Pass', hi: 'डिजिटल बोर्डिंग पास' },
    desc: {
      en: 'Scan printed receipt QR code to track live queue position on your smartphone',
      hi: 'पर्ची का क्यूआर कोड स्कैन करके फोन पर लाइव टोकन नंबर और कमरा देखें'
    }
  },
  {
    title: { en: 'Ultrasound Scan Protocol', hi: 'अल्ट्रासाउंड निर्देश' },
    desc: {
      en: 'Drink 4–5 glasses of water 30 minutes prior to Pelvic Ultrasound examination',
      hi: 'पेल्विक अल्ट्रासाउंड से 30 मिनट पहले 4–5 गिलास पानी पीकर ब्लैडर भरा रखें'
    }
  },
  {
    title: { en: 'Diagnostic Turnaround', hi: 'जांच रिपोर्ट समय' },
    desc: {
      en: 'Routine Complete Blood Count (CBC) and Urine analysis reports ready within 45 minutes',
      hi: 'सीबीसी एवं सामान्य लैब जांच रिपोर्ट 45 मिनट के भीतर तैयार होती हैं'
    }
  },
  {
    title: { en: 'OPD Consultation Hours', hi: 'ओपीडी परामर्श समय' },
    desc: {
      en: 'Monday to Saturday, 08:30 AM – 02:00 PM • Emergency diagnostics 24x7',
      hi: 'सोमवार से शनिवार, सुबह 08:30 से दोपहर 02:00 बजे • आपातकालीन जांच 24x7'
    }
  }
];

// ==========================================
// Carousel Slides with Real App Modules
// ==========================================
interface CarouselSlide {
  image: string;
  step: { en: string; hi: string };
  title: { en: string; hi: string };
  desc: { en: string; hi: string };
}

const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    image: '/carousel/carousel_1.jpg',
    step: { en: 'MODULE 1 · OPD DOCTOR DESK', hi: 'मॉड्यूल 1 · डॉक्टर ओपीडी' },
    title: { en: 'Prescribe Investigations & Print Pass', hi: 'जांच पर्ची एवं क्यूआर टोकन जनरेशन' },
    desc: { en: 'Select required lab tests for walk-in patients and generate a thermal QR slip.', hi: 'मरीज के लिए जरूरी टेस्ट चुनें और प्रिंटेड क्यूआर पर्ची निकालें।' }
  },
  {
    image: '/carousel/carousel_2.jpg',
    step: { en: 'MODULE 2 · DIAGNOSTIC WORKSTATION', hi: 'मॉड्यूल 2 · डायग्नोस्टिक काउंटर' },
    title: { en: 'Token Caller & Sample Collection', hi: 'टोकन कॉलर एवं सैंपल कलेक्शन' },
    desc: { en: 'Call patient tokens with hospital chime, scan QR codes, and record test data.', hi: 'हॉस्पिटल चाइम के साथ टोकन कॉल करें और सैंपल का स्टेटस अपडेट करें।' }
  },
  {
    image: '/carousel/carousel_3.jpg',
    step: { en: 'MODULE 3 · PATIENT LIVE PASS', hi: 'मॉड्यूल 3 · पेशेंट लाइव पास' },
    title: { en: 'Real-Time Room & Wait Tracking', hi: 'लाइव रूम एवं कतार स्थिति' },
    desc: { en: 'Open live queue boarding pass on phone camera to see assigned chamber and turn.', hi: 'फोन कैमरे से क्यूआर स्कैन करके अपना कमरा नंबर और आगे के मरीज देखें।' }
  },
  {
    image: '/carousel/carousel_4.jpg',
    step: { en: 'MODULE 4 · CENTRAL MONITORING', hi: 'मॉड्यूल 4 · सेंट्रल मॉनिटरिंग' },
    title: { en: 'Live Department Queue Telemetry', hi: 'डिपार्टमेंट-वाइज कतार स्थिति' },
    desc: { en: 'Real-time visibility across all active diagnostic chambers and waiting rooms.', hi: 'सभी एक्टिव जांच काउंटरों और वेटिंग एरिया की स्थिति एक जगह देखें।' }
  }
];

// ==========================================
// 4-Box PIN Input
// ==========================================
interface PinInputProps {
  pin: string[];
  onChange: (pin: string[]) => void;
  showPin: boolean;
  onToggleShow: () => void;
  disabled?: boolean;
  lang: 'en' | 'hi';
  autoFocusFirst?: boolean;
}

const PinInput: React.FC<PinInputProps> = ({
  pin,
  onChange,
  showPin,
  onToggleShow,
  disabled = false,
  lang,
  autoFocusFirst = true
}) => {
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  useEffect(() => {
    if (autoFocusFirst) {
      inputRefs[0].current?.focus();
    }
  }, [autoFocusFirst]);

  const handleInputChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const char = cleaned.slice(-1);
    const nextPin = [...pin];
    nextPin[index] = char;
    onChange(nextPin);

    if (char && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (pin[index] === '' && index > 0) {
        inputRefs[index - 1].current?.focus();
        const nextPin = [...pin];
        nextPin[index - 1] = '';
        onChange(nextPin);
      } else {
        const nextPin = [...pin];
        nextPin[index] = '';
        onChange(nextPin);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    const nextPin = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      nextPin[i] = pasted[i];
    }
    onChange(nextPin);
    const focusIdx = Math.min(pasted.length, 3);
    inputRefs[focusIdx].current?.focus();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {lang === 'hi' ? '4-अंकों का पिन' : '4-digit PIN'}
        </label>
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={showPin ? (lang === 'hi' ? 'पिन छुपाएं' : 'Hide PIN') : (lang === 'hi' ? 'पिन दिखाएं' : 'Show PIN')}
          className="min-h-[32px] px-2 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 transition-colors"
        >
          {showPin ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
          <span>{showPin ? (lang === 'hi' ? 'छुपाएं' : 'Hide') : (lang === 'hi' ? 'दिखाएं' : 'Show')}</span>
        </button>
      </div>
      <div className="flex items-center gap-3">
        {pin.map((digit, idx) => (
          <input
            key={idx}
            ref={inputRefs[idx]}
            type={showPin ? 'text' : 'password'}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={e => handleInputChange(idx, e.target.value)}
            onKeyDown={e => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            placeholder=""
            className="w-11 h-11 sm:w-12 sm:h-12 text-center text-base sm:text-lg font-bold rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-slate-900 bg-white shadow-xs outline-none disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
          />
        ))}
      </div>
    </div>
  );
};

// ==========================================
// Custom One-Line Bay Select
// ==========================================
interface BayOption {
  id: string;
  name: string;
  room: string;
  displayName: string;
}

interface BaySelectProps {
  bays: BayOption[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  lang: 'en' | 'hi';
}

const BaySelect: React.FC<BaySelectProps> = ({ bays, value, onChange, disabled = false, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedBay = bays.find(b => b.id === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
        {lang === 'hi' ? 'जांच काउंटर' : 'Diagnostic bay'}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-11 px-3.5 bg-white rounded-xl border text-left flex items-center justify-between text-sm transition-all cursor-pointer focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 shadow-xs ${
          isOpen ? 'border-teal-600 ring-2 ring-teal-500/20' : 'border-slate-300 hover:border-slate-400'
        } ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}`}
      >
        <span className={`truncate ${selectedBay ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
          {selectedBay ? selectedBay.displayName : (lang === 'hi' ? 'काउंटर चुनें' : 'Select your bay')}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto py-1 divide-y divide-slate-100 animate-fadeIn"
        >
          {bays.map(bay => (
            <button
              key={bay.id}
              type="button"
              role="option"
              aria-selected={bay.id === value}
              onClick={() => {
                onChange(bay.id);
                setIsOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 text-left text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer ${
                bay.id === value
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">{bay.displayName.split('·')[0].trim()}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{bay.room}</span>
              </div>
              {bay.id === value && <Check className="w-4 h-4 text-teal-700 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// MAIN AUTH SCREEN COMPONENT
// ==========================================
export const AuthScreen: React.FC<{ customImage?: string }> = ({ customImage }) => {
  const {
    departments,
    activeLanguage: lang,
    setLanguage,
    loginDoctor,
    loginLabTech,
    loginPharmacist,
    loginPatientLookup,
    selectAndLoginPatient
  } = useHospitalStore();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'staff' | 'lab' | 'pharmacy' | 'patient'>('staff');

  // Staff Form State
  const [staffMobile, setStaffMobile] = useState('');
  const [staffPin, setStaffPin] = useState(['', '', '', '']);
  const [staffShowPin, setStaffShowPin] = useState(false);
  const [staffRemember, setStaffRemember] = useState(false);

  // Lab Form State
  const [labStaffId, setLabStaffId] = useState('');
  const [labBayId, setLabBayId] = useState('');
  const [labPin, setLabPin] = useState(['', '', '', '']);
  const [labShowPin, setLabShowPin] = useState(false);

  // Pharmacy Form State
  const [pharmName, setPharmName] = useState('');
  const [pharmacyStationName, setPharmacyStationName] = useState('');
  const [pharmPin, setPharmPin] = useState(['', '', '', '']);
  const [pharmShowPin, setPharmShowPin] = useState(false);

  // Patient Form State
  const [patientToken, setPatientToken] = useState('');
  const [patientMobile, setPatientMobile] = useState('');
  const [patientMatches, setPatientMatches] = useState<Array<{ id: string; name: string; uhid: string; opdTokenNumber: string }>>([]);

  // Carousel & UI State
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Translation Menu State
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Hospital Multi-Tenant Selection State
  // Initially null (no hospital selected by default)
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [hospitalCodeInput, setHospitalCodeInput] = useState('');
  const [isHospitalMenuOpen, setIsHospitalMenuOpen] = useState(false);
  const [hospitalSearchQuery, setHospitalSearchQuery] = useState('');
  const hospitalMenuRef = useRef<HTMLDivElement>(null);

  // Outside click listener for hospital dropdown menu
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (hospitalMenuRef.current && !hospitalMenuRef.current.contains(e.target as Node)) {
        setIsHospitalMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // URL query parameter detection (e.g. ?hospital=MAX-01 or ?code=MAX-01)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('hospital') || params.get('code');
      if (codeParam) {
        const found = findHospitalByQuery(codeParam);
        if (found) {
          setSelectedHospital(found);
          setHospitalCodeInput(found.code);
        }
      }
    }
  }, []);

  const handleHospitalCodeChange = (val: string) => {
    setHospitalCodeInput(val);
    setError('');
    if (!val.trim()) {
      setSelectedHospital(null);
      return;
    }
    const matched = findHospitalByQuery(val);
    if (matched) {
      setSelectedHospital(matched);
    }
  };

  const handleSelectHospital = (hosp: Hospital) => {
    setSelectedHospital(hosp);
    setHospitalCodeInput(hosp.code);
    setIsHospitalMenuOpen(false);
    setHospitalSearchQuery('');
    setError('');
  };

  const handleClearHospital = () => {
    setSelectedHospital(null);
    setHospitalCodeInput('');
    setHospitalSearchQuery('');
  };

  const filteredHospitals = REGISTERED_HOSPITALS.filter(h => {
    if (!hospitalSearchQuery.trim()) return true;
    const q = hospitalSearchQuery.toLowerCase().trim();
    return (
      h.name.toLowerCase().includes(q) ||
      h.shortName.toLowerCase().includes(q) ||
      h.code.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q) ||
      h.address.toLowerCase().includes(q)
    );
  });

  // Qbie Assistant & Notification Prompt State
  const [showQbieChat, setShowQbieChat] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(true);
  const [qbieFrameIndex, setQbieFrameIndex] = useState(1);
  const [qbieChatMessages, setQbieChatMessages] = useState<Array<{ sender: 'qbie' | 'user'; text: string; time: string }>>([
    {
      sender: 'qbie',
      text: lang === 'hi'
        ? 'नमस्ते! मैं Qbie हूँ, QCare अस्पताल गाइड। आप मुझसे ओपीडी समय, खाली पेट जांच (Fasting), लाइव टोकन या जांच काउंटर के बारे में कुछ भी पूछ सकते हैं!'
        : 'Hello! I am Qbie, your QCare hospital and queue guide. Ask me anything about OPD timings, test rules (fasting/water), live QR pass, or how QCare manages patient flow!',
      time: 'Just now'
    }
  ]);
  const [qbieInputValue, setQbieInputValue] = useState('');
  const [qbieIsTyping, setQbieIsTyping] = useState(false);
  const qbieMessagesEndRef = useRef<HTMLDivElement>(null);

  // Moveable / Draggable Qbie Mascot State
  // When null, CSS fixed positioning (bottom-3 right-3 sm:bottom-6 sm:right-6) keeps it locked to the bottom right on any device
  const [qbieCustomPosition, setQbieCustomPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingQbie, setIsDraggingQbie] = useState(false);
  const mascotRef = useRef<HTMLDivElement>(null);
  const qbieDragStartRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    moved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    moved: false
  });

  // Dynamic mascot dimensions based on viewport
  const getMascotDimensions = () => {
    if (typeof window === 'undefined') return { width: 80, height: 80 };
    const isMobile = window.innerWidth < 640;
    return isMobile ? { width: 44, height: 44 } : { width: 80, height: 80 };
  };

  // Clamping on resize only if custom position was set
  useEffect(() => {
    const handleResize = () => {
      setQbieCustomPosition(prev => {
        if (!prev) return null;
        const isMobile = window.innerWidth < 640;
        const w = isMobile ? 44 : 80;
        const h = isMobile ? 44 : 80;
        const margin = isMobile ? 12 : 24;
        return {
          x: Math.max(margin, Math.min(window.innerWidth - w - margin, prev.x)),
          y: Math.max(56, Math.min(window.innerHeight - h - margin, prev.y))
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global mousemove and mouseup listeners for desktop drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingQbie) return;
      const dx = e.clientX - qbieDragStartRef.current.startX;
      const dy = e.clientY - qbieDragStartRef.current.startY;

      if (Math.hypot(dx, dy) > 5) {
        qbieDragStartRef.current.moved = true;
      }

      const { width, height } = getMascotDimensions();
      const minX = 8;
      const maxX = window.innerWidth - width - 8;
      const minY = 56; // below the top header
      const maxY = window.innerHeight - height - 8;

      setQbieCustomPosition({
        x: Math.max(minX, Math.min(maxX, qbieDragStartRef.current.initialX + dx)),
        y: Math.max(minY, Math.min(maxY, qbieDragStartRef.current.initialY + dy))
      });
    };

    const handleMouseUp = () => {
      if (isDraggingQbie) {
        setIsDraggingQbie(false);
      }
    };

    if (isDraggingQbie) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingQbie]);

  // Touch drag event listeners for mobile devices
  const handleTouchStartQbie = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = mascotRef.current?.getBoundingClientRect();
    const currentX = qbieCustomPosition ? qbieCustomPosition.x : (rect ? rect.left : window.innerWidth - 56);
    const currentY = qbieCustomPosition ? qbieCustomPosition.y : (rect ? rect.top : window.innerHeight - 56);

    qbieDragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: currentX,
      initialY: currentY,
      moved: false
    };
    setIsDraggingQbie(true);
  };

  const handleTouchMoveQbie = (e: React.TouchEvent) => {
    if (!isDraggingQbie || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - qbieDragStartRef.current.startX;
    const dy = touch.clientY - qbieDragStartRef.current.startY;

    if (Math.hypot(dx, dy) > 5) {
      qbieDragStartRef.current.moved = true;
    }

    const { width, height } = getMascotDimensions();
    const minX = 8;
    const maxX = window.innerWidth - width - 8;
    const minY = 56;
    const maxY = window.innerHeight - height - 8;

    setQbieCustomPosition({
      x: Math.max(minX, Math.min(maxX, qbieDragStartRef.current.initialX + dx)),
      y: Math.max(minY, Math.min(maxY, qbieDragStartRef.current.initialY + dy))
    });
  };

  const handleTouchEndQbie = () => {
    if (isDraggingQbie) {
      setIsDraggingQbie(false);
      if (!qbieDragStartRef.current.moved) {
        setShowQbieChat(true);
      }
    }
  };

  const handleMouseDownQbie = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const rect = mascotRef.current?.getBoundingClientRect();
    const currentX = qbieCustomPosition ? qbieCustomPosition.x : (rect ? rect.left : window.innerWidth - 88);
    const currentY = qbieCustomPosition ? qbieCustomPosition.y : (rect ? rect.top : window.innerHeight - 88);

    qbieDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY,
      moved: false
    };
    setIsDraggingQbie(true);
  };

  const handleClickQbie = () => {
    if (!qbieDragStartRef.current.moved) {
      setShowQbieChat(true);
    }
  };

  // Preload all robot frames on mount to eliminate broken images or network hiccups
  useEffect(() => {
    for (let i = 1; i <= 6; i++) {
      const img = new Image();
      img.src = `/robot_frames/robot_${i}.png`;
    }
  }, []);

  // Outside click for language dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Frame cycling for Qbie mascot animation (cycles 1..6 smoothly)
  useEffect(() => {
    const interval = setInterval(() => {
      setQbieFrameIndex(prev => (prev >= 6 ? 1 : prev + 1));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll Qbie chat to latest message
  useEffect(() => {
    if (showQbieChat) {
      qbieMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [qbieChatMessages, qbieIsTyping, showQbieChat]);

  // Handle Qbie message submit (uses Groq multi-key pool with automatic rotation & local clinical fallback)
  const handleSendQbieMessage = async (customText?: string) => {
    const textToSend = (customText || qbieInputValue).trim();
    if (!textToSend || qbieIsTyping) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setQbieChatMessages(prev => [...prev, { sender: 'user', text: textToSend, time: timeStr }]);
    if (!customText) {
      setQbieInputValue('');
    }
    setQbieIsTyping(true);

    try {
      const response = await askQBiePublicAI(textToSend, lang);
      setQbieChatMessages(prev => [
        ...prev,
        {
          sender: 'qbie',
          text: response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch {
      // Deterministic local clinical fallback if network exception occurs
      const fallback = getPublicClinicalFallback(textToSend, lang);
      setQbieChatMessages(prev => [
        ...prev,
        {
          sender: 'qbie',
          text: fallback,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setQbieIsTyping(false);
    }
  };

  // Carousel auto-advance
  useEffect(() => {
    if (customImage || isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, customImage]);

  // Carousel controls
  const handlePrevSlide = () => {
    setActiveSlide(prev => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };
  const handleNextSlide = () => {
    setActiveSlide(prev => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  // Language switch
  const handleLanguageChange = (newLang: 'en' | 'hi') => {
    setLanguage(newLang);
    setShowLangMenu(false);
  };

  // Demo auto-fill
  const handleDemoFill = () => {
    setError('');
    // Auto-select Max Hospital Saket (MAX-01) if not selected
    if (!selectedHospital) {
      const demoHosp = REGISTERED_HOSPITALS[0]; // MAX-01
      setSelectedHospital(demoHosp);
      setHospitalCodeInput(demoHosp.code);
    }
    if (activeTab === 'staff') {
      setStaffMobile('9810011001');
      setStaffPin(['1', '2', '3', '4']);
    } else if (activeTab === 'lab') {
      setLabStaffId('TECH-01');
      setLabBayId(departments[0]?.id || 'dept-pathology');
      setLabPin(['1', '2', '3', '4']);
    } else if (activeTab === 'pharmacy') {
      const hospShort = selectedHospital?.shortName || REGISTERED_HOSPITALS[0].shortName;
      setPharmName('Meera Kapoor');
      setPharmacyStationName(`${hospShort} Dispensary`);
      setPharmPin(['1', '2', '3', '4']);
    } else if (activeTab === 'patient') {
      setPatientToken('QC-9411');
      setPatientMobile('9876543210');
      setPatientMatches([]);
    }
  };

  // Staff Submit
  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedHospital) {
      setError(
        lang === 'hi'
          ? 'कृपया आगे बढ़ने के लिए अपना अस्पताल चुनें या कोड (उदा. MAX-01) दर्ज करें।'
          : 'Please select your hospital or enter a valid hospital code (e.g. MAX-01).'
      );
      return;
    }

    const cleaned = staffMobile.trim();
    if (!cleaned) {
      setError(lang === 'hi' ? 'कृपया पंजीकृत मोबाइल नंबर दर्ज करें।' : 'Please enter registered mobile number.');
      return;
    }
    const joinedPin = staffPin.join('');
    if (joinedPin.length < 4) {
      setError(lang === 'hi' ? 'कृपया 4-अंकों का पिन दर्ज करें।' : 'Please enter 4-digit PIN.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const res = loginDoctor(
        selectedHospital.doctorName || 'Dr. Attending Physician',
        selectedHospital.name,
        selectedHospital.doctorRoom || 'Chamber 101',
        staffMobile,
        undefined,
        joinedPin,
        selectedHospital.id
      );
      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Authentication failed.');
      }
    }, 200);
  };

  // Lab Submit
  const handleLabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedHospital) {
      setError(
        lang === 'hi'
          ? 'कृपया आगे बढ़ने के लिए अपना अस्पताल चुनें या कोड (उदा. MAX-01) दर्ज करें।'
          : 'Please select your hospital or enter a valid hospital code (e.g. MAX-01).'
      );
      return;
    }

    const joinedPin = labPin.join('');
    if (joinedPin.length < 4) {
      setError(lang === 'hi' ? 'कृपया 4-अंकों का पिन दर्ज करें।' : 'Please enter any 4-digit PIN.');
      return;
    }

    const targetBay = labBayId || departments[0]?.id || 'dept-pathology';
    const targetStaff = labStaffId.trim() || 'TECH-01';

    setLoading(true);

    setTimeout(() => {
      const res = loginLabTech(targetStaff, targetBay, joinedPin, selectedHospital.id);
      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Authentication failed.');
      }
    }, 200);
  };

  // Pharmacy Submit
  const handlePharmacySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedHospital) {
      setError(
        lang === 'hi'
          ? 'कृपया आगे बढ़ने के लिए अपना अस्पताल चुनें या कोड (उदा. MAX-01) दर्ज करें।'
          : 'Please select your hospital or enter a valid hospital code (e.g. MAX-01).'
      );
      return;
    }

    const joinedPin = pharmPin.join('');
    if (joinedPin.length < 4) {
      setError(lang === 'hi' ? 'कृपया 4-अंकों का पिन दर्ज करें।' : 'Please enter 4-digit PIN.');
      return;
    }

    const targetPharmacist = pharmName.trim() || 'Duty Pharmacist';
    const targetDispensary = pharmacyStationName.trim() || `${selectedHospital.shortName} Pharmacy`;
    setLoading(true);

    setTimeout(() => {
      const res = loginPharmacist(targetPharmacist, targetDispensary, joinedPin, selectedHospital.id);
      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Authentication failed.');
      }
    }, 200);
  };

  // Patient Submit
  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPatientMatches([]);
    const query = patientToken.trim() || patientMobile.trim();
    if (!query) {
      setError(
        lang === 'hi'
          ? 'कृपया पर्ची टोकन नंबर, UHID या पंजीकृत मोबाइल दर्ज करें।'
          : 'Please enter a valid Token, UHID, Name, or Mobile number.'
      );
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = loginPatientLookup(query);
      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Patient record not found. Verify your Token, UHID, Name, or Mobile number.');
      } else if (res.patients && res.patients.length > 1) {
        setPatientMatches(
          res.patients.map(p => ({
            id: p.id,
            name: p.name,
            uhid: p.uhid,
            opdTokenNumber: p.opdTokenNumber
          }))
        );
      }
    }, 200);
  };

  // Diagnostic Bay Options
  const bayOptions: BayOption[] = departments.map(d => ({
    id: d.id,
    name: d.name,
    room: d.location.room,
    displayName: `${d.name.split('(')[0].trim()} · ${d.location.room}`
  }));

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-[#EBF5F3] via-35% to-[#B2DCD3] text-slate-900 font-sans selection:bg-teal-700 selection:text-white relative">
      
      {/* ==========================================
          1. STATIC TOP HEADER (Blends seamlessly with page)
      ========================================== */}
      <header className="flex-none h-14 sm:h-16 bg-white/70 backdrop-blur-md border-b border-slate-200/40 px-4 sm:px-8 flex items-center justify-between z-30 transition-all">
        {/* Top Left: User's Official Glossy Qcare Brand Mark */}
        <div className="flex items-center">
          <img
            src="/logo-glossy.png"
            alt="Qcare"
            className="h-8 sm:h-9 w-auto object-contain select-none"
          />
        </div>

        {/* Top Right: Translation Dropdown & Help Modal Trigger */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Translation Dropdown Trigger */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setShowLangMenu(prev => !prev)}
              aria-label="Change language"
              className="min-h-[36px] px-3 py-1.5 flex items-center gap-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 text-xs font-medium text-slate-700 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-600/30 shadow-2xs"
            >
              <Globe className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-800">{lang === 'hi' ? 'हिंदी' : 'English'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-fadeIn">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {lang === 'hi' ? 'भाषा चुनें' : 'Select Language'}
                </div>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    lang === 'en' ? 'text-teal-800 font-bold bg-teal-50/60' : 'text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>English</span>
                    <span className="text-[10px] text-slate-400">(Default)</span>
                  </span>
                  {lang === 'en' && <Check className="w-3.5 h-3.5 text-teal-700" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('hi')}
                  className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    lang === 'hi' ? 'text-teal-800 font-bold bg-teal-50/60' : 'text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>हिंदी</span>
                    <span className="text-[10px] text-slate-400">(Hindi)</span>
                  </span>
                  {lang === 'hi' && <Check className="w-3.5 h-3.5 text-teal-700" />}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="text-xs font-medium text-slate-500 hover:text-teal-700 cursor-pointer transition-colors hidden sm:block"
          >
            {lang === 'hi' ? 'सहायता' : 'Help'}
          </button>
        </div>
      </header>

      {/* ==========================================
          CONTINUOUS CLINICAL BULLETIN (Anti-Vibe Coded: Zero Pills, Zero Emojis, Pure Editorial Typography)
      ========================================== */}
      <div className="flex-none h-7 sm:h-8 bg-white/60 backdrop-blur-xs border-b border-slate-200/50 px-4 sm:px-6 flex items-center overflow-hidden z-20 group select-none text-slate-600">
        <div className="flex items-center shrink-0 pr-3.5 border-r border-slate-200/80 text-[10px] font-bold tracking-widest text-slate-400 uppercase font-sans">
          <span>{lang === 'hi' ? 'सूचना' : 'Notice'}</span>
        </div>
        
        <div className="flex-1 overflow-hidden relative h-full flex items-center pl-3.5">
          <div className="flex items-center gap-8 whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused] cursor-default">
            {QCARE_TICKER_UPDATES.map((item, idx) => (
              <span key={`ticker-1-${idx}`} className="inline-flex items-center gap-2.5 text-slate-600 text-xs font-normal">
                <span className="font-semibold text-slate-800">{item.title[lang]}:</span>
                <span className="text-slate-600">{item.desc[lang]}</span>
                <span className="text-slate-300 font-light select-none ml-2">—</span>
              </span>
            ))}
            {/* Duplicate for seamless infinite loop */}
            {QCARE_TICKER_UPDATES.map((item, idx) => (
              <span key={`ticker-2-${idx}`} className="inline-flex items-center gap-2.5 text-slate-600 text-xs font-normal">
                <span className="font-semibold text-slate-800">{item.title[lang]}:</span>
                <span className="text-slate-600">{item.desc[lang]}</span>
                <span className="text-slate-300 font-light select-none ml-2">—</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ==========================================
          2. MAIN STAGE (RESPONSIVE: DESKTOP 2-COL, MOBILE 1-COL)
      ========================================== */}
      <main className="flex-1 overflow-y-auto flex items-center justify-center px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
        <div className="w-full max-w-[1100px] my-auto grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-center">
          
          {/* ==========================================
              LEFT PANEL: QCARE CLINICAL WORKFLOW CAROUSEL
          ========================================== */}
          <div className="flex lg:flex lg:col-span-7 h-full flex-col justify-center order-2 lg:order-1">
            <div
              className="w-full h-[280px] sm:h-[340px] lg:h-[460px] lg:max-h-[480px] rounded-2xl border border-slate-200/90 bg-slate-900 shadow-md overflow-hidden relative group"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* QCare Platform Stamp */}
              <div className="absolute top-4 left-5 z-20 flex items-center gap-2.5 pointer-events-none">
                <div className="w-8 h-8 rounded-xl bg-slate-900/80 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs p-1">
                  <img src="/logo-gradient.png" alt="Qcare" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-xs tracking-tight leading-none font-sans">
                    QCare
                  </span>
                  <span className="text-slate-300 text-[10px] leading-tight mt-0.5 font-sans">
                    Diagnostic Flow
                  </span>
                </div>
              </div>

              {/* Carousel Images Stack */}
              <div className="relative w-full h-full overflow-hidden">
                {customImage ? (
                  <img
                    src={customImage}
                    alt="Hospital Operations"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  CAROUSEL_SLIDES.map((slide, idx) => (
                    <div
                      key={idx}
                      className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        idx === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                      }`}
                    >
                      <img
                        src={slide.image}
                        alt={slide.title[lang]}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                )}

                {/* Prev & Next Controls */}
                {!customImage && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevSlide}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-white/10"
                      aria-label="Previous visual"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextSlide}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-white/10"
                      aria-label="Next visual"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Clean Bottom Information Dock */}
                {!customImage && (
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col justify-end bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent">
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-teal-300 tracking-wider uppercase font-sans">
                        {CAROUSEL_SLIDES[activeSlide].step[lang]}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug font-sans text-balance">
                        {CAROUSEL_SLIDES[activeSlide].title[lang]}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-prose leading-relaxed font-sans">
                        {CAROUSEL_SLIDES[activeSlide].desc[lang]}
                      </p>
                    </div>

                    {/* Progress Bar / Dots */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15">
                      {CAROUSEL_SLIDES.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveSlide(idx)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            idx === activeSlide ? 'w-8 bg-teal-400' : 'w-2 bg-white/35 hover:bg-white/60'
                          }`}
                          aria-label={`Slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ==========================================
              RIGHT PANEL: CLEAN SIGN-IN CARD
          ========================================== */}
          <div className="w-full lg:col-span-5 h-full flex flex-col justify-center order-1 lg:order-2">
            <div className="w-full max-w-[420px] mx-auto bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/40 p-5 sm:p-6 flex flex-col">
              
              {/* Tabs: Underline style */}
              <div className="flex border-b border-slate-200 mb-3.5 overflow-x-auto no-scrollbar" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'staff'}
                  onClick={() => {
                    setActiveTab('staff');
                    setError('');
                  }}
                  className={`flex-1 pb-2.5 px-1 text-xs sm:text-[13px] font-semibold tracking-tight transition-colors duration-150 relative cursor-pointer whitespace-nowrap ${
                    activeTab === 'staff'
                      ? 'text-teal-800'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {lang === 'hi' ? 'डॉक्टर' : 'Doctor & Staff'}
                  {activeTab === 'staff' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-700 rounded-full" />
                  )}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'lab'}
                  onClick={() => {
                    setActiveTab('lab');
                    setError('');
                  }}
                  className={`flex-1 pb-2.5 px-1 text-xs sm:text-[13px] font-semibold tracking-tight transition-colors duration-150 relative cursor-pointer whitespace-nowrap ${
                    activeTab === 'lab'
                      ? 'text-teal-800'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {lang === 'hi' ? 'लैब' : 'Lab Tech'}
                  {activeTab === 'lab' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-700 rounded-full" />
                  )}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'pharmacy'}
                  onClick={() => {
                    setActiveTab('pharmacy');
                    setError('');
                  }}
                  className={`flex-1 pb-2.5 px-1 text-xs sm:text-[13px] font-semibold tracking-tight transition-colors duration-150 relative cursor-pointer whitespace-nowrap ${
                    activeTab === 'pharmacy'
                      ? 'text-teal-800'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {lang === 'hi' ? 'फार्मेसी' : 'Pharmacy'}
                  {activeTab === 'pharmacy' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-700 rounded-full" />
                  )}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'patient'}
                  onClick={() => {
                    setActiveTab('patient');
                    setError('');
                    setPatientMatches([]);
                  }}
                  className={`flex-1 pb-2.5 px-1 text-xs sm:text-[13px] font-semibold tracking-tight transition-colors duration-150 relative cursor-pointer whitespace-nowrap ${
                    activeTab === 'patient'
                      ? 'text-teal-800'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {lang === 'hi' ? 'मरीज' : 'Patient'}
                  {activeTab === 'patient' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-700 rounded-full" />
                  )}
                </button>
              </div>

              {/* Title Header */}
              <div className="mb-3">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight text-balance leading-tight">
                  {activeTab === 'staff' && (lang === 'hi' ? 'साइन इन करें' : 'Sign in')}
                  {activeTab === 'lab' && (lang === 'hi' ? 'लैब स्टेशन खोलें' : 'Open lab station')}
                  {activeTab === 'pharmacy' && (lang === 'hi' ? 'फार्मेसी काउंटर खोलें' : 'Open pharmacy desk')}
                  {activeTab === 'patient' && (lang === 'hi' ? 'अपनी जांच ट्रैक करें' : 'Track your tests')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 max-w-prose">
                  {activeTab === 'staff' && (lang === 'hi' ? 'ड्यूटी डॉक्टर एवं ओपीडी सहायक' : 'Duty doctor & clinical assistant')}
                  {activeTab === 'lab' && (lang === 'hi' ? 'डायग्नोस्टिक काउंटर कंसोल' : 'Diagnostic counter technician console')}
                  {activeTab === 'pharmacy' && (lang === 'hi' ? 'डिजिटल पर्ची सत्यापन व दवा वितरण' : 'Digital prescription verification & dispensing')}
                  {activeTab === 'patient' && (lang === 'hi' ? 'लाइव डिजिटल बोर्डिंग पास' : 'Real-time diagnostic boarding pass')}
                </p>
              </div>

              {/* Inline Error */}
              {error && (
                <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              {/* ==========================================
                  HOSPITAL / CENTER SELECTION (Hybrid: Dropdown + Auto-Detect Code)
              ========================================== */}
              {(activeTab === 'staff' || activeTab === 'lab' || activeTab === 'pharmacy') && (
                <div className="mb-3 relative" ref={hospitalMenuRef}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-teal-700" />
                      <span>{lang === 'hi' ? 'अस्पताल / केंद्र' : 'Hospital / Center'}</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {lang === 'hi' ? 'चुनें या कोड लिखें' : 'Select or type code'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Main Premium Custom Dropdown Trigger */}
                    <div className="relative flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => setIsHospitalMenuOpen(prev => !prev)}
                        aria-expanded={isHospitalMenuOpen}
                        aria-label="Select hospital"
                        className={`w-full h-11 pl-3 bg-white border rounded-xl flex items-center justify-between transition-[border-color,background-color,box-shadow] duration-150 cursor-pointer shadow-xs text-left ${
                          selectedHospital ? 'pr-14' : 'pr-9'
                        } ${
                          !selectedHospital && error
                            ? 'border-amber-400 bg-amber-50/20 ring-2 ring-amber-400/20'
                            : selectedHospital
                              ? 'border-teal-600/70 bg-teal-50/15 ring-1 ring-teal-600/20'
                              : 'border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          {selectedHospital ? (
                            <>
                              <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-teal-700 text-white text-[10px] tabular-nums font-bold">
                                {selectedHospital.code}
                              </span>
                              <div className="truncate">
                                <span className="text-xs sm:text-[13px] font-semibold text-slate-900 block truncate">
                                  {selectedHospital.name}
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  {selectedHospital.city} • {selectedHospital.shortName}
                                </span>
                              </div>
                            </>
                          ) : (
                            <span className="text-xs sm:text-[13px] text-slate-400 font-normal truncate">
                              {lang === 'hi' ? 'अस्पताल / डायग्नोस्टिक सेंटर चुनें...' : 'Select Hospital / Center...'}
                            </span>
                          )}
                        </div>
                      </button>

                      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {selectedHospital && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearHospital();
                            }}
                            title="Clear hospital selection"
                            aria-label="Clear hospital selection"
                            className="pointer-events-auto w-5 h-5 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform ${
                            isHospitalMenuOpen ? 'rotate-180 text-teal-700' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Hybrid Quick Code Input (Auto-detects when typing 'MAX-01', 'max 01', etc.) */}
                    <div className="w-28 sm:w-32 shrink-0">
                      <input
                        type="text"
                        value={hospitalCodeInput}
                        onChange={e => handleHospitalCodeChange(e.target.value)}
                        placeholder="MAX-01"
                        title={lang === 'hi' ? 'अस्पताल कोड लिखें (उदा. MAX-01)' : 'Type hospital code (e.g. MAX-01)'}
                        className={`w-full h-11 px-2.5 text-center text-base md:text-xs tabular-nums font-bold uppercase rounded-xl border bg-white shadow-xs outline-none transition-colors duration-150 ${
                          selectedHospital
                            ? 'border-teal-600 bg-teal-50/20 text-teal-900 font-bold focus:ring-2 focus:ring-teal-500/20'
                            : 'border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Floating Dropdown Menu Panel (Anti-Vibe Coded, Compact & Contained) */}
                  {isHospitalMenuOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 animate-fadeIn max-h-[220px] flex flex-col overflow-hidden ring-1 ring-black/5">
                      
                      {/* Quick Search & Code Filter inside Menu */}
                      <div className="p-2 border-b border-slate-100 bg-white shrink-0">
                        <div className="flex items-center gap-2 px-2.5 h-8 bg-slate-50 border border-slate-200 rounded-lg focus-within:border-teal-600 focus-within:bg-white transition-all">
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            autoFocus
                            value={hospitalSearchQuery}
                            onChange={e => setHospitalSearchQuery(e.target.value)}
                            placeholder={lang === 'hi' ? 'अस्पताल या कोड खोजें (उदा. MAX-01)...' : 'Search hospital or code (e.g. MAX-01)...'}
                            className="w-full text-base md:text-xs bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
                          />
                          {hospitalSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setHospitalSearchQuery('')}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 6 Hospital Options List */}
                      <div className="overflow-y-auto p-1.5 space-y-0.5 flex-1 divide-y divide-slate-50">
                        {filteredHospitals.length === 0 ? (
                          <div className="py-5 text-center text-xs text-slate-400 font-medium">
                            {lang === 'hi' ? 'कोई अस्पताल नहीं मिला' : 'No matching hospital found'}
                          </div>
                        ) : (
                          filteredHospitals.map(hosp => {
                            const isSelected = selectedHospital?.id === hosp.id;
                            return (
                              <button
                                key={hosp.id}
                                type="button"
                                onClick={() => handleSelectHospital(hosp)}
                                className={`w-full text-left px-2.5 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                                  isSelected
                                    ? 'bg-teal-50 border border-teal-200/90 text-teal-950 font-semibold shadow-2xs'
                                    : 'hover:bg-slate-50 border border-transparent text-slate-800'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-slate-900 truncate block">
                                      {hosp.name}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {hosp.locality ? `${hosp.locality}, ${hosp.city}` : hosp.address}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                                  <span
                                    className={`px-1.5 py-0.5 rounded-md text-[10px] tabular-nums font-bold ${
                                      isSelected
                                        ? 'bg-teal-700 text-white'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200/80'
                                    }`}
                                  >
                                    {hosp.code}
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Form Content: Staff */}
              {activeTab === 'staff' && (
                <form onSubmit={handleStaffSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      {lang === 'hi' ? 'पंजीकृत मोबाइल' : 'Registered mobile'}
                    </label>
                    <div className="flex rounded-xl border border-slate-300 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-500/20 bg-white overflow-hidden shadow-xs">
                      <span className="inline-flex items-center px-3.5 bg-slate-50 text-slate-600 font-semibold text-sm border-r border-slate-300">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={staffMobile}
                        onChange={e => setStaffMobile(e.target.value.replace(/\D/g, ''))}
                        placeholder="98100 11001"
                        className="w-full h-10 px-3 text-base md:text-sm tabular-nums text-slate-900 bg-white outline-none font-medium"
                      />
                    </div>
                  </div>

                  <PinInput
                    pin={staffPin}
                    onChange={setStaffPin}
                    showPin={staffShowPin}
                    onToggleShow={() => setStaffShowPin(prev => !prev)}
                    disabled={loading}
                    lang={lang}
                  />

                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={staffRemember}
                        onChange={e => setStaffRemember(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-700 border-slate-300 focus:ring-teal-600 cursor-pointer"
                      />
                      <span className="text-xs text-slate-600 font-medium">
                        {lang === 'hi' ? 'याद रखें' : 'Remember me'}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={handleDemoFill}
                      className="text-xs font-medium text-teal-700 hover:text-teal-900 cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{lang === 'hi' ? 'डेमो भरें' : 'Demo fill'}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 mt-1 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-teal-900/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>{lang === 'hi' ? 'साइन इन करें' : 'Sign In'}</span>
                    )}
                  </button>
                </form>
              )}

              {/* Form Content: Lab */}
              {activeTab === 'lab' && (
                <form onSubmit={handleLabSubmit} className="space-y-3">
                  <BaySelect
                    bays={bayOptions}
                    value={labBayId}
                    onChange={setLabBayId}
                    disabled={loading}
                    lang={lang}
                  />

                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                      {lang === 'hi' ? 'स्टाफ आईडी' : 'Staff ID'}
                    </label>
                    <input
                      type="text"
                      value={labStaffId}
                      onChange={e => setLabStaffId(e.target.value)}
                      placeholder="TECH-01"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-base md:text-sm text-slate-900 bg-white outline-none shadow-xs font-medium"
                    />
                  </div>

                  <PinInput
                    pin={labPin}
                    onChange={setLabPin}
                    showPin={labShowPin}
                    onToggleShow={() => setLabShowPin(prev => !prev)}
                    disabled={loading}
                    lang={lang}
                    autoFocusFirst={false}
                  />

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleDemoFill}
                      className="text-xs font-medium text-teal-700 hover:text-teal-900 cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{lang === 'hi' ? 'डेमो भरें' : 'Demo fill'}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 mt-2 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-teal-900/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>{lang === 'hi' ? 'स्टेशन खोलें' : 'Open Workstation'}</span>
                    )}
                  </button>
                </form>
              )}

              {/* Form Content: Pharmacy */}
              {activeTab === 'pharmacy' && (
                <form onSubmit={handlePharmacySubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                      {lang === 'hi' ? 'फार्मासिस्ट नाम' : 'Pharmacist Name'}
                    </label>
                    <input
                      type="text"
                      value={pharmName}
                      onChange={e => setPharmName(e.target.value)}
                      placeholder="Meera Kapoor"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-base md:text-sm text-slate-900 bg-white outline-none shadow-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                      {lang === 'hi' ? 'डिस्पेंसरी / फार्मेसी काउंटर' : 'Dispensary / Pharmacy Counter'}
                    </label>
                    <input
                      type="text"
                      value={pharmacyStationName}
                      onChange={e => setPharmacyStationName(e.target.value)}
                      placeholder={selectedHospital ? `${selectedHospital.shortName} Dispensary` : 'Central Dispensary'}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-base md:text-sm text-slate-900 bg-white outline-none shadow-xs font-medium"
                    />
                  </div>

                  <PinInput
                    pin={pharmPin}
                    onChange={setPharmPin}
                    showPin={pharmShowPin}
                    onToggleShow={() => setPharmShowPin(prev => !prev)}
                    disabled={loading}
                    lang={lang}
                    autoFocusFirst={false}
                  />

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleDemoFill}
                      className="text-xs font-medium text-teal-700 hover:text-teal-900 cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{lang === 'hi' ? 'डेमो भरें' : 'Demo fill'}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 mt-2 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-semibold text-sm rounded-xl transition-colors duration-150 shadow-md shadow-teal-900/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>{lang === 'hi' ? 'फार्मेसी खोलें' : 'Open Dispensary'}</span>
                    )}
                  </button>
                </form>
              )}

              {/* Form Content: Patient */}
              {activeTab === 'patient' && (
                <form onSubmit={handlePatientSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      {lang === 'hi' ? 'पर्ची टोकन नंबर' : 'Receipt token number'}
                    </label>
                    <input
                      type="text"
                      value={patientToken}
                      onChange={e => setPatientToken(e.target.value.toUpperCase())}
                      placeholder="QC-9411"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-base md:text-sm tabular-nums text-slate-900 bg-white outline-none shadow-xs font-medium uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      {lang === 'hi' ? 'या पंजीकृत मोबाइल' : 'Or registered mobile'}
                    </label>
                    <div className="flex rounded-xl border border-slate-300 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-500/20 bg-white overflow-hidden shadow-xs">
                      <span className="inline-flex items-center px-3.5 bg-slate-50 text-slate-600 font-semibold text-sm border-r border-slate-300">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={patientMobile}
                        onChange={e => setPatientMobile(e.target.value.replace(/\D/g, ''))}
                        placeholder="98765 43210"
                        className="w-full h-10 px-3 text-base md:text-sm tabular-nums text-slate-900 bg-white outline-none font-medium"
                      />
                    </div>
                  </div>

                  {patientMatches.length > 1 && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <p className="text-[11px] font-semibold text-slate-600">
                        Select your profile ({patientMatches.length} matches):
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {patientMatches.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => selectAndLoginPatient(m.id)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white hover:bg-teal-50 border border-slate-200 text-left text-xs font-semibold text-slate-800 flex items-center justify-between cursor-pointer"
                          >
                            <span>{m.name}</span>
                            <span className="text-[11px] text-teal-700 tabular-nums">{m.uhid} · {m.opdTokenNumber}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={handleDemoFill}
                      className="text-xs font-medium text-teal-700 hover:text-teal-900 cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{lang === 'hi' ? 'डेमो भरें' : 'Demo fill'}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 mt-1 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-semibold text-sm rounded-xl transition-colors duration-150 shadow-md shadow-teal-900/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>{lang === 'hi' ? 'लाइव पास देखें' : 'Access Live Pass'}</span>
                    )}
                  </button>
                </form>
              )}

              {/* Security Footnote */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <Lock className="w-3.5 h-3.5 text-teal-700" />
                <span>{lang === 'hi' ? 'सुरक्षित 256-बिट एन्क्रिप्टेड कतार सत्र' : 'Protected 256-bit encrypted clinical session'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ==========================================
          3. DEEPLY BLENDED BOTTOM BAR (Seamless with background gradient)
      ========================================== */}
      <footer className="flex-none h-11 px-6 sm:px-8 flex items-center justify-between text-xs text-teal-950/75 bg-transparent border-t-0 select-none">
        <div className="flex items-center gap-2">
          <span className="font-medium">© 2026 QCare Clinical Systems</span>
          <span className="text-teal-900/30">•</span>
          <span className="text-teal-950/60 hidden sm:inline">Outpatient & Diagnostic Queue Management</span>
        </div>
        <div className="flex items-center gap-4 font-medium">
          <button
            type="button"
            onClick={() => setShowHowItWorks(true)}
            className="hover:text-teal-950 cursor-pointer transition-colors"
          >
            {lang === 'hi' ? 'यह कैसे काम करता है' : 'How it works'}
          </button>
          <span className="text-teal-900/30">·</span>
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="hover:text-teal-950 cursor-pointer transition-colors"
          >
            {lang === 'hi' ? 'सहायता' : 'Support'}
          </button>
        </div>
      </footer>

      {/* ==========================================
          4. QBIE ASSISTANT (Freestanding Moveable Mascot + Responsive Notification Balloon)
      ========================================== */}
      {!showQbieChat && (
        <div
          ref={mascotRef}
          style={
            qbieCustomPosition
              ? {
                  position: 'fixed',
                  left: `${qbieCustomPosition.x}px`,
                  top: `${qbieCustomPosition.y}px`,
                  touchAction: 'none'
                }
              : {
                  position: 'fixed',
                  touchAction: 'none'
                }
          }
          className={`${
            qbieCustomPosition ? '' : 'bottom-3 right-3 sm:bottom-6 sm:right-6'
          } z-40 flex items-center select-none`}
        >
          {/* Floating Notification Balloon (Dismissible with 'X' Cut Button) */}
          {showNotificationPrompt && (
            <div
              onClick={() => setShowQbieChat(true)}
              className={`absolute cursor-pointer bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-2 sm:p-3 pr-6 sm:pr-8 hover:shadow-2xl hover:border-teal-300 transition-all group animate-fadeIn ${
                typeof window !== 'undefined' && window.innerWidth < 640
                  ? 'bottom-full mb-1.5 right-0 max-w-[190px]'
                  : qbieCustomPosition && qbieCustomPosition.x <= (typeof window !== 'undefined' ? window.innerWidth / 2 : 400)
                    ? 'left-full ml-3 bottom-0 w-[260px]'
                    : 'right-full mr-3 bottom-0 w-[260px]'
              }`}
            >
              {/* Cut / Dismiss Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotificationPrompt(false);
                }}
                aria-label="Dismiss notification"
                className="absolute top-1.5 right-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>

              <div className="flex items-start gap-1.5 sm:gap-2.5">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 mt-1 shrink-0 animate-pulse" />
                <div>
                  <div className="text-[10px] sm:text-xs font-semibold text-slate-900 group-hover:text-teal-800 transition-colors">
                    {lang === 'hi' ? 'सहायता चाहिए? Qbie से पूछें' : 'Need guidance? Ask Qbie'}
                  </div>
                  <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {lang === 'hi' ? 'चैट के लिए टैप करें' : 'Tap to chat with AI guide'}
                  </p>
                </div>
              </div>

              {/* Speech pointer towards Qbie */}
              {typeof window !== 'undefined' && window.innerWidth < 640 ? (
                <div className="absolute -bottom-1.5 right-3 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white/95" />
              ) : qbieCustomPosition && qbieCustomPosition.x <= (typeof window !== 'undefined' ? window.innerWidth / 2 : 400) ? (
                <div className="absolute -left-2 bottom-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-white/95" />
              ) : (
                <div className="absolute -right-2 bottom-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-white/95" />
              )}
            </div>
          )}

          {/* Freestanding Moveable Qbie Mascot (Touch & Mouse Drag + Tap to Open) */}
          <div
            role="button"
            tabIndex={0}
            onMouseDown={handleMouseDownQbie}
            onTouchStart={handleTouchStartQbie}
            onTouchMove={handleTouchMoveQbie}
            onTouchEnd={handleTouchEndQbie}
            onClick={handleClickQbie}
            className={`w-11 h-11 sm:w-16 sm:h-16 md:w-20 md:h-20 select-none touch-none ${
              isDraggingQbie ? 'cursor-grabbing scale-105' : 'cursor-grab hover:scale-105 active:scale-95'
            } transition-transform flex items-center justify-center relative drop-shadow-xl hover:drop-shadow-2xl group`}
            aria-label="Qbie Assistant - Drag to move or click to chat"
          >
            <img
              src={`/robot_frames/robot_${qbieFrameIndex}.png`}
              alt="Qbie"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/robot_frames/robot_1.png';
              }}
              className="w-full h-full object-contain pointer-events-none select-none"
            />
            {/* Move indicator badge */}
            <div
              title={lang === 'hi' ? 'घसीट कर ले जाएँ' : 'Drag to move'}
              className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/95 border border-slate-200 shadow-xs flex items-center justify-center text-slate-400 group-hover:text-teal-700 transition-colors pointer-events-none"
            >
              <Move className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          QBIE INTERACTIVE CHAT WINDOW (Open State)
      ========================================== */}
      {showQbieChat && (
        <div className="fixed inset-x-2 bottom-2 top-14 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:h-[530px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-slideUp z-50">
            
            {/* Chat Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-teal-800 to-teal-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/15 p-1 flex items-center justify-center border border-white/20 shrink-0">
                  <img
                    src={`/robot_frames/robot_${qbieFrameIndex}.png`}
                    alt="Qbie"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/robot_frames/robot_1.png';
                    }}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm leading-tight font-sans">Qbie</h3>
                    <span className="text-[10px] bg-emerald-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">
                      Guide
                    </span>
                  </div>
                  <p className="text-[10px] text-teal-200 mt-0.5">
                    {lang === 'hi' ? 'अस्पताल एवं कतार मार्गदर्शक' : 'Hospital & Queue Assistant'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQbieChat(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Close Qbie Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 no-scrollbar">
              <button
                type="button"
                onClick={() => handleSendQbieMessage(lang === 'hi' ? 'खाली पेट जांच के क्या नियम हैं?' : 'What are the fasting rules for blood tests?')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-teal-600 hover:text-teal-800 whitespace-nowrap transition-colors cursor-pointer shrink-0 font-medium"
              >
                {lang === 'hi' ? 'खाली पेट जांच नियम' : 'Fasting rules'}
              </button>
              <button
                type="button"
                onClick={() => handleSendQbieMessage(lang === 'hi' ? 'पर्ची का क्यूआर कोड कैसे स्कैन करें?' : 'How to scan receipt QR code for live pass?')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-teal-600 hover:text-teal-800 whitespace-nowrap transition-colors cursor-pointer shrink-0 font-medium"
              >
                {lang === 'hi' ? 'टोकन कैसे ट्रैक करें?' : 'Track QR token'}
              </button>
              <button
                type="button"
                onClick={() => handleSendQbieMessage(lang === 'hi' ? 'अस्पताल ओपीडी का समय क्या है?' : 'What are OPD and diagnostic timings?')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-teal-600 hover:text-teal-800 whitespace-nowrap transition-colors cursor-pointer shrink-0 font-medium"
              >
                {lang === 'hi' ? 'ओपीडी का समय' : 'OPD timings'}
              </button>
              <button
                type="button"
                onClick={() => handleSendQbieMessage(lang === 'hi' ? 'इमरजेंसी हेल्पलाइन नंबर क्या है?' : 'What is the emergency helpline number?')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-teal-600 hover:text-teal-800 whitespace-nowrap transition-colors cursor-pointer shrink-0 font-medium"
              >
                {lang === 'hi' ? 'इमरजेंसी' : 'Emergency'}
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#F8FAFC]">
              {qbieChatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'qbie' && (
                    <div className="w-7 h-7 rounded-lg bg-teal-100 border border-teal-200 p-0.5 shrink-0 self-end">
                      <img
                        src={`/robot_frames/robot_${qbieFrameIndex}.png`}
                        alt="Qbie"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/robot_frames/robot_1.png';
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-teal-700 text-white rounded-br-xs font-medium shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs font-normal shadow-xs'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span
                      className={`text-[9px] block mt-1 font-medium ${
                        msg.sender === 'user' ? 'text-teal-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}

              {qbieIsTyping && (
                <div className="flex items-center gap-1.5 text-slate-400 text-xs pl-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:300ms]" />
                  <span className="text-[11px] ml-1 text-slate-500 italic">Qbie is typing...</span>
                </div>
              )}
              <div ref={qbieMessagesEndRef} />
            </div>

            {/* Chat Input */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendQbieMessage();
              }}
              className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={qbieInputValue}
                onChange={e => setQbieInputValue(e.target.value)}
                placeholder={lang === 'hi' ? 'सवाल पूछें (उदा. खाली पेट नियम)...' : 'Ask a question (e.g. fasting rules)...'}
                className="flex-1 h-9 px-3 text-base md:text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 focus:bg-white text-slate-900"
              />
              <button
                type="submit"
                disabled={!qbieInputValue.trim() || qbieIsTyping}
                className="w-9 h-9 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

      {/* ==========================================
          MODALS: HOW IT WORKS & HELP
      ========================================== */}
      {showHowItWorks && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowHowItWorks(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <span>{lang === 'hi' ? 'यह कैसे काम करता है' : 'How it works'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHowItWorks(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3.5 text-xs text-slate-600">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center shrink-0">1</div>
                <div>
                  <div className="font-semibold text-slate-900">{lang === 'hi' ? 'पर्ची प्राप्त करें' : 'Receive printed receipt'}</div>
                  <p className="mt-0.5">{lang === 'hi' ? 'ओपीडी या रिसेप्शन से टेस्ट और क्यूआर कोड वाली पर्ची लें।' : 'Get your OPD receipt containing registered tests and official QR code.'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center shrink-0">2</div>
                <div>
                  <div className="font-semibold text-slate-900">{lang === 'hi' ? 'क्यूआर स्कैन करें' : 'Scan live QR pass'}</div>
                  <p className="mt-0.5">{lang === 'hi' ? 'बिना किसी ऐप डाउनलोड के फोन कैमरे से तुरंत लाइव बोर्डिंग पास खोलें।' : 'Scan using any smartphone camera to open your live queue boarding pass without app install.'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center shrink-0">3</div>
                <div>
                  <div className="font-semibold text-slate-900">{lang === 'hi' ? 'न्यूनतम प्रतीक्षा में जांच पूरी करें' : 'Auto-routed tests'}</div>
                  <p className="mt-0.5">{lang === 'hi' ? 'सिस्टम आपको सबसे खाली काउंटर पर निर्देशित करता है।' : 'Smart routing directs you to the lowest-wait diagnostic counter dynamically.'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHelpModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-teal-700" />
                <span>{lang === 'hi' ? 'तकनीकी एवं प्रशासनिक सहायता' : 'Hospital Help & Support'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <p>
                {lang === 'hi'
                  ? 'यदि आपको लॉगिन या लाइव कतार संचालन में कोई समस्या है, तो अस्पताल आईटी हेल्पडेस्क से संपर्क करें:'
                  : 'For assistance with sign-in, queue tokens, or counter operations, reach the clinical IT helpdesk:'}
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-900">QCare Central Clinical Helpdesk</div>
                <div className="text-teal-700 font-semibold">+91 11 4100 2200</div>
                <div className="text-slate-500 text-[11px]">support@qcare.health • Mon–Sat: 08:00 AM – 06:00 PM</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
