import React, { useState } from 'react';
import { 
  Navigation, 
  Volume2, 
  RefreshCw, 
  Stethoscope, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Clock
} from 'lucide-react';

export const HowQCareWorksGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });

  return (
    <div className="bg-gradient-to-r from-teal-50/80 via-slate-50 to-teal-50/80 rounded-2xl sm:rounded-3xl border border-teal-200/80 p-3.5 sm:p-5 shadow-xs transition-colors duration-150">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold text-obsidian-900 tracking-tight truncate text-balance leading-tight">
                How Q-Care Works for You
              </h2>
              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                Quick Guide
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate sm:whitespace-normal max-w-prose">
              4 simple steps that save you 45+ minutes in your diagnostic checkup.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="min-h-[40px] px-3 py-1.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1.5 transition-colors shadow-2xs shrink-0 active:scale-95 cursor-pointer"
        >
          <span>{isOpen ? 'Minimize' : 'View Guide'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-blue-200/60 animate-fadeIn">
          {/* Step 1 */}
          <div className="bg-white/90 rounded-2xl p-3.5 border border-blue-100 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Step 1
                </span>
                <Navigation className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Follow the Shortest Line</h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Q-Care checks all rooms in real time and routes you to whichever lab has the shortest wait, skipping 1-hour bottlenecks.
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
              <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Saves ~45 mins</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white/90 rounded-2xl p-3.5 border border-blue-100 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  Step 2
                </span>
                <Volume2 className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Audio Chime & Screen Call</h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Relax in the waiting lounge. When your turn is called, an audio hospital chime plays and your token flashes on the room display.
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] text-indigo-700 font-bold">
              <span>Zero standing in lines</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white/90 rounded-2xl p-3.5 border border-blue-100 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Step 3
                </span>
                <RefreshCw className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Automatic Next Hop</h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                As soon as a test sample is taken, your digital boarding pass updates automatically to your next room with walking advice.
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] text-purple-700 font-bold">
              <span>No lost paper tokens</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white/90 rounded-2xl p-3.5 border border-blue-100 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  Step 4
                </span>
                <Stethoscope className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Final Doctor Sign-Off</h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Once all tests are completed, your reports sync directly to your doctor's screen. Walk back to your doctor for final prescription!
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
              <span>Doctor already has reports</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
