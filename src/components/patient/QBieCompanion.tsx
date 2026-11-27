import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  ChevronRight,
  Cpu
} from 'lucide-react';
import { Patient, QueueRoutingPlan, RouteStep, QueueToken, ClinicalReport } from '../../types';
import { askQBieAI, QBiePatientContext } from '../../engine/groqService';

interface QBieCompanionProps {
  patient: Patient;
  routingPlan: QueueRoutingPlan;
  hospitalName?: string;
  upNextStep?: RouteStep;
  calledToken?: QueueToken;
  inProgressToken?: QueueToken;
  allCompleted: boolean;
  reports: ClinicalReport[];
  language?: 'en' | 'hi';
}

export const QBieCompanion: React.FC<QBieCompanionProps> = ({
  patient,
  routingPlan,
  hospitalName,
  upNextStep,
  calledToken,
  inProgressToken,
  allCompleted,
  reports,
  language = 'en'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [frameIndex, setFrameIndex] = useState(1);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'qbie' | 'user'; text: string; time: string }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Position coordinates of draggable avatar (desktop)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      return {
        x: Math.max(16, window.innerWidth - 96),
        y: Math.max(16, window.innerHeight - 120)
      };
    }
    return { x: 300, y: 500 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    moved: false
  });

  const avatarWidth = 76;
  const avatarHeight = 76;

  // Window resize bounds protection: ensures mascot never gets lost off-screen
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (!mobile) {
        setPosition(prev => ({
          x: Math.max(12, Math.min(window.innerWidth - avatarWidth - 12, prev.x)),
          y: Math.max(12, Math.min(window.innerHeight - avatarHeight - 12, prev.y))
        }));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping, isOpen]);

  // Mouse drag handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragStartRef.current.moved = true;
      }

      const newX = Math.max(12, Math.min(window.innerWidth - avatarWidth - 12, dragStartRef.current.initialX + dx));
      const newY = Math.max(12, Math.min(window.innerHeight - avatarHeight - 12, dragStartRef.current.initialY + dy));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Touch drag handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: position.x,
      initialY: position.y,
      moved: false
    };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.startX;
    const dy = touch.clientY - dragStartRef.current.startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragStartRef.current.moved = true;
    }

    const newX = Math.max(12, Math.min(window.innerWidth - avatarWidth - 12, dragStartRef.current.initialX + dx));
    const newY = Math.max(12, Math.min(window.innerHeight - avatarHeight - 12, dragStartRef.current.initialY + dy));

    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      if (!dragStartRef.current.moved) {
        setIsOpen(prev => !prev);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with left click
    if (e.button !== 0) return;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      moved: false
    };
    setIsDragging(true);
  };

  const handleClickAvatar = () => {
    if (!dragStartRef.current.moved) {
      setIsOpen(prev => !prev);
    }
  };

  // Preload mascot frames to prevent broken images
  useEffect(() => {
    for (let i = 1; i <= 6; i++) {
      const img = new Image();
      img.src = `/robot_frames/robot_${i}.png`;
    }
  }, []);

  // Smooth animation frames
  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex(prev => (prev >= 6 ? 1 : prev + 1));
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  // Build live patient context object for Groq
  const patientContext: QBiePatientContext = useMemo(() => {
    return {
      patientName: patient.name,
      uhid: patient.uhid,
      age: patient.age,
      gender: patient.gender,
      hospitalName: hospitalName || 'Outpatient Diagnostic Center',
      doctorName: patient.prescribedDoctorName || 'Attending Physician',
      doctorDepartment: 'OPD Consultation',
      doctorRoom: patient.prescribedDoctorRoom || 'Room 1',
      symptoms: patient.chiefComplaint || patient.symptoms,
      opdTokenNumber: patient.opdTokenNumber,
      currentStop: upNextStep ? {
        testName: upNextStep.testName,
        room: upNextStep.location.room,
        floor: upNextStep.location.floor,
        estimatedWaitMinutes: upNextStep.estimatedWaitMinutes,
        patientsAhead: 2,
        reason: upNextStep.reasonForSequence
      } : undefined,
      calledToken: calledToken ? {
        tokenNumber: calledToken.tokenNumber,
        room: upNextStep?.location.room
      } : undefined,
      inProgressToken: inProgressToken ? {
        tokenNumber: inProgressToken.tokenNumber,
        testName: upNextStep?.testName
      } : undefined,
      allCompleted,
      prescribedTests: routingPlan.smartRouteSteps.map(s => ({
        name: s.testName,
        room: s.location.room,
        floor: s.location.floor,
        status: patient.completedTests.includes(s.testId) 
          ? 'completed' 
          : (s.testId === upNextStep?.testId ? 'up_next' : 'queued'),
        waitMinutes: s.estimatedWaitMinutes,
        queueCount: 2
      })),
      completedReports: reports.map(r => ({
        testName: r.testName,
        summary: r.summary
      })),
      language
    };
  }, [patient, routingPlan, upNextStep, calledToken, inProgressToken, allCompleted, reports, language]);

  // Initial greeting
  useEffect(() => {
    if (chatMessages.length === 0) {
      const greeting = language === 'hi'
        ? `नमस्ते ${patient.name.split(' ')[0]} जी! मैं Q-Bie हूँ, Groq AI संचालित अस्पताल साथी। मैं सबसे कम इंतज़ार में आपकी जांचें पूरी करवाने में मदद करूँगा। मुझसे कुछ भी पूछें!`
        : `Hi ${patient.name.split(' ')[0]}! I'm Q-Bie, your Groq AI-powered hospital companion. I track all diagnostic queues in real-time. Ask me anything or tap any quick question below!`;

      setChatMessages([
        {
          sender: 'qbie',
          text: greeting,
          time: 'Just now'
        }
      ]);
    }
  }, [patient.name, chatMessages.length, language]);

  const handleQuickQuestion = async (type: 'where' | 'why_skip' | 'explain_reports' | 'how_called') => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let userText = '';

    if (type === 'where') {
      userText = language === 'hi' ? 'मुझे अभी कहाँ जाना चाहिए और किस कमरे में?' : 'Where should I go right now and in which room?';
    } else if (type === 'why_skip') {
      userText = language === 'hi' ? 'स्मार्ट रूटिंग से मेरा समय कैसे बचता है?' : 'Why did Q-Care optimize my test sequence?';
    } else if (type === 'explain_reports') {
      userText = language === 'hi' ? 'मेरी जांच रिपोर्ट की क्या स्थिति है?' : 'What is the status of my completed test reports?';
    } else if (type === 'how_called') {
      userText = language === 'hi' ? 'मेरी बारी कब और कैसे आएगी?' : 'How will I know when my turn is called?';
    }

    setChatMessages(prev => [...prev, { sender: 'user', text: userText, time: nowStr }]);
    setIsTyping(true);

    try {
      const aiReply = await askQBieAI(userText, patientContext);
      setChatMessages(prev => [...prev, { sender: 'qbie', text: aiReply, time: nowStr }]);
    } catch {
      setChatMessages(prev => [...prev, { 
        sender: 'qbie', 
        text: upNextStep 
          ? `Please proceed to ${upNextStep.location.room} (${upNextStep.location.floor}) for ${upNextStep.testName}. Estimated wait is ~${upNextStep.estimatedWaitMinutes} mins!` 
          : `All tests are complete! Please return to ${patient.prescribedDoctorName}.`, 
        time: nowStr 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setInputValue('');

    setChatMessages(prev => [...prev, { sender: 'user', text: userText, time: nowStr }]);
    setIsTyping(true);

    try {
      const aiReply = await askQBieAI(userText, patientContext);
      setChatMessages(prev => [...prev, { sender: 'qbie', text: aiReply, time: nowStr }]);
    } catch {
      setChatMessages(prev => [...prev, { 
        sender: 'qbie', 
        text: upNextStep 
          ? `Head to ${upNextStep.location.room} for your ${upNextStep.testName}. Wait is only ~${upNextStep.estimatedWaitMinutes} mins!` 
          : `All tests complete! Please return to ${patient.prescribedDoctorName}.`, 
        time: nowStr 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Smart responsive boundary-aware panel placement
  // Calculate panel position so it NEVER overflows or clips off viewport edges
  const panelWidth = typeof window !== 'undefined' ? Math.min(390, window.innerWidth - 24) : 380;
  const panelHeight = typeof window !== 'undefined' ? Math.min(540, window.innerHeight - 40) : 500;

  let panelStyle: React.CSSProperties = {};
  if (typeof window !== 'undefined') {
    const isBottomHalf = position.y > window.innerHeight / 2;
    const isRightHalf = position.x > window.innerWidth / 2;

    const top = isBottomHalf 
      ? Math.max(12, position.y - panelHeight - 12)
      : Math.min(window.innerHeight - panelHeight - 12, position.y + avatarHeight + 12);

    const left = isRightHalf
      ? Math.max(12, position.x + avatarWidth - panelWidth)
      : Math.min(window.innerWidth - panelWidth - 12, position.x);

    panelStyle = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${panelWidth}px`,
      maxHeight: `${panelHeight}px`,
      zIndex: 55
    };
  }

  return (
    <>
      {/* Prominent Q-Bie Avatar Trigger (Mobile thumb-docked / Desktop draggable) */}
      <div
        style={
          isMobile
            ? {
                position: 'fixed',
                right: '12px',
                bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                zIndex: 45,
                touchAction: 'manipulation'
              }
            : {
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 50,
                touchAction: 'none'
              }
        }
        onMouseDown={!isMobile ? handleMouseDown : undefined}
        onTouchStart={!isMobile ? handleTouchStart : undefined}
        onTouchMove={!isMobile ? handleTouchMove : undefined}
        onTouchEnd={!isMobile ? handleTouchEnd : undefined}
        onClick={handleClickAvatar}
        className={`group select-none ${!isMobile ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} transition-transform ${
          isDragging ? 'scale-105' : 'hover:scale-105 active:scale-95'
        }`}
      >
        <div className="relative flex items-center justify-center">
          {/* Pulsing Aura Halo */}
          <span className="absolute inset-0 rounded-full bg-teal-500/25 animate-ping pointer-events-none" />

          {/* Thick-Sized Avatar Bubble */}
          <div className="w-[66px] h-[66px] sm:w-[80px] sm:h-[80px] rounded-full bg-gradient-to-br from-white via-teal-50 to-indigo-100 border-4 border-teal-600 shadow-2xl flex items-center justify-center p-1 relative overflow-hidden backdrop-blur-md">
            <img 
              src={`/robot_frames/robot_${frameIndex}.png`} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/robot_frames/robot_1.png"; }} 
              alt="Q-Bie AI Hospital Companion Mascot" 
              className="w-full h-full object-contain pointer-events-none select-none drop-shadow-sm"
              draggable={false}
            />

            {/* Online Green Indicator Dot */}
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 absolute top-1 right-1 border-2 border-white shadow-xs" />

            {/* Desktop Drag Handle Indicator */}
            <div className="hidden sm:block absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-[7px] font-black uppercase text-center tracking-tighter py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              Drag Me
            </div>
          </div>

          {/* Pill Badge Tag */}
          <div className="absolute -bottom-2 bg-slate-950 text-white px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold tracking-tight border border-teal-400 shadow-md flex items-center gap-1 pointer-events-none whitespace-nowrap">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            <span>Q-Bie AI</span>
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM-SHEET DRAWER (< 640px) */}
      {isOpen && isMobile && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Dark Backdrop */}
          <div 
            className="fixed inset-0 bg-obsidian-950/60 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Bottom Sheet Container */}
          <div 
            className="relative z-10 w-full bg-white rounded-t-3xl border-t border-slate-200/90 shadow-2xl flex flex-col max-h-[88vh] h-[82vh] overflow-hidden animate-slideUp text-slate-900"
            style={{
              boxShadow: '0 -10px 40px -10px rgba(15, 23, 42, 0.25)'
            }}
          >
            {/* Top Drag Handle / Dismiss Touch Area */}
            <div 
              className="w-full pt-2.5 pb-1 flex justify-center cursor-pointer touch-none bg-slate-50"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-teal-700 via-teal-800 to-obsidian-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/15 p-1 flex items-center justify-center border border-white/25 shrink-0">
                  <img 
                    src={`/robot_frames/robot_${frameIndex}.png`} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/robot_frames/robot_1.png"; }} 
                    alt="Q-Bie" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-extrabold text-sm tracking-tight">Q-Bie AI Companion</h3>
                    <span className="text-[10px] font-bold bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-pulse" />
                      <span>Groq Live</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-100 flex items-center gap-1 font-medium mt-0.5">
                    <Cpu className="w-3 h-3 shrink-0" />
                    <span>Real-Time Diagnostic Queue Intelligence</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                aria-label="Close Q-Bie Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Chat Area */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-slate-50/70 text-sm">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'qbie' && (
                    <div className="w-7 h-7 rounded-xl bg-teal-100 border border-teal-200 p-0.5 shrink-0 self-end">
                      <img 
                        src={`/robot_frames/robot_${frameIndex}.png`} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/robot_frames/robot_1.png"; }} 
                        alt="Q-Bie" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl shadow-2xs leading-relaxed text-xs sm:text-sm whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-teal-700 text-white rounded-br-xs font-medium'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs font-normal'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className={`text-[9px] block mt-1.5 font-medium ${msg.sender === 'user' ? 'text-teal-200' : 'text-slate-400'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-slate-500 text-xs italic pl-9">
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce delay-100" />
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce delay-200" />
                  <span className="font-medium">Q-Bie is analyzing real-time hospital queues...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions - Touch friendly (min-h-[44px]) */}
            <div className="p-3 bg-white border-t border-slate-200 space-y-2 shrink-0">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{language === 'hi' ? 'त्वरित प्रश्न (1-टैप)' : 'Quick Answers (1-Tap)'}</span>
                </span>
                <span className="text-[10px] text-teal-700 font-bold">Fast Routing</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickQuestion('where')}
                  className="min-h-[44px] px-3 py-2 text-left bg-slate-50 hover:bg-teal-50 active:bg-teal-100 border border-slate-200 hover:border-teal-300 rounded-xl text-xs font-bold text-slate-800 hover:text-teal-900 transition-all flex items-center justify-between active:scale-98 cursor-pointer"
                >
                  <span className="truncate">{language === 'hi' ? 'कहाँ जाना है?' : 'Where to go now?'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickQuestion('why_skip')}
                  className="min-h-[44px] px-3 py-2 text-left bg-slate-50 hover:bg-teal-50 active:bg-teal-100 border border-slate-200 hover:border-teal-300 rounded-xl text-xs font-bold text-slate-800 hover:text-teal-900 transition-all flex items-center justify-between active:scale-98 cursor-pointer"
                >
                  <span className="truncate">{language === 'hi' ? 'समय कैसे बचा?' : 'Why smart route?'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickQuestion('explain_reports')}
                  className="min-h-[44px] px-3 py-2 text-left bg-slate-50 hover:bg-teal-50 active:bg-teal-100 border border-slate-200 hover:border-teal-300 rounded-xl text-xs font-bold text-slate-800 hover:text-teal-900 transition-all flex items-center justify-between active:scale-98 cursor-pointer"
                >
                  <span className="truncate">{language === 'hi' ? 'रिपोर्ट स्थिति' : 'Report status'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickQuestion('how_called')}
                  className="min-h-[44px] px-3 py-2 text-left bg-slate-50 hover:bg-teal-50 active:bg-teal-100 border border-slate-200 hover:border-teal-300 rounded-xl text-xs font-bold text-slate-800 hover:text-teal-900 transition-all flex items-center justify-between active:scale-98 cursor-pointer"
                >
                  <span className="truncate">{language === 'hi' ? 'मेरी बारी कब?' : 'How am I called?'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              </div>
            </div>

            {/* Form Input - 44px touch height, 16px font to prevent mobile zoom */}
            <form 
              onSubmit={handleSendMessage} 
              className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
            >
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={language === 'hi' ? 'कमरा, फास्टिंग या रिपोर्ट पूछें...' : 'Ask Q-Bie (room, fasting, test)...'}
                className="flex-1 h-11 px-3.5 bg-white border border-slate-300 rounded-2xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-11 h-11 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md shrink-0 cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DESKTOP FLOATING DIALOGUE PANEL (>= 640px) */}
      {isOpen && !isMobile && (
        <div 
          style={panelStyle}
          className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col animate-scaleUp text-slate-900"
        >
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-teal-700 via-teal-800 to-obsidian-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/15 p-1 flex items-center justify-center border border-white/20">
                <img 
                  src={`/robot_frames/robot_${frameIndex}.png`} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/robot_frames/robot_1.png"; }} 
                  alt="Q-Bie" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs tracking-tight">Q-Bie AI Mascot</h3>
                  <span className="text-[9px] font-bold bg-emerald-400 text-slate-950 px-1.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-pulse" />
                    <span>Groq Live</span>
                  </span>
                </div>
                <p className="text-[10px] text-teal-100 flex items-center gap-1">
                  <Cpu className="w-2.5 h-2.5" />
                  <span>Real Hospital Context</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="p-3.5 overflow-y-auto flex-1 space-y-2.5 bg-slate-50/60 text-xs">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'qbie' && (
                  <div className="w-6 h-6 rounded-lg bg-teal-100 border border-teal-200 p-0.5 shrink-0 self-end">
                    <img 
                      src={`/robot_frames/robot_${frameIndex}.png`} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/robot_frames/robot_1.png"; }} 
                      alt="Q-Bie" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[84%] p-2.5 rounded-2xl shadow-2xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-teal-700 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className={`text-[8px] block mt-1 ${msg.sender === 'user' ? 'text-teal-200' : 'text-slate-400'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-slate-400 text-xs italic pl-8">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce delay-200" />
                <span>Q-Bie is thinking with Groq AI...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="p-2.5 bg-white border-t border-slate-100 space-y-1 shrink-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-1">
              {language === 'hi' ? 'त्वरित सहायता' : 'Quick Questions'}
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickQuestion('where')}
                className="p-1.5 text-left bg-slate-50 hover:bg-teal-50/70 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-700 hover:text-teal-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">{language === 'hi' ? 'कहाँ जाना है?' : 'Where to go now?'}</span>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickQuestion('why_skip')}
                className="p-1.5 text-left bg-slate-50 hover:bg-teal-50/70 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-700 hover:text-teal-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">{language === 'hi' ? 'समय कैसे बचा?' : 'Why smart route?'}</span>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickQuestion('explain_reports')}
                className="p-1.5 text-left bg-slate-50 hover:bg-teal-50/70 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-700 hover:text-teal-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">{language === 'hi' ? 'मेरी रिपोर्ट स्थिति' : 'Report status'}</span>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickQuestion('how_called')}
                className="p-1.5 text-left bg-slate-50 hover:bg-teal-50/70 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-700 hover:text-teal-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">{language === 'hi' ? 'मेरी बारी कब?' : 'How am I called?'}</span>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 shrink-0">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={language === 'hi' ? 'फास्टिंग, कमरा या रिपोर्ट के बारे में पूछें...' : 'Ask Q-Bie anything (fasting, room, reports)...'}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-base md:text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-colors duration-150"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white transition-all shadow-2xs cursor-pointer"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
