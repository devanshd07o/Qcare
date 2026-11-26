import React from 'react';
import {
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Droplet,
  Waves,
  Activity,
  Eye,
  FlaskConical,
  Zap,
  Wind,
  Bone,
  Brain,
  ScanLine,
  Microscope,
  RefreshCw,
  Radio,
} from 'lucide-react';
import {
  Patient,
  QueueToken,
  Department,
  DiagnosticTest,
  Counter,
  RouteStep,
} from '../../types';
import { formatWaitRange } from '../../engine/queueRouter';

interface PrescribedTestsNavigationPanelProps {
  patient: Patient;
  tests: DiagnosticTest[];
  departments: Department[];
  counters: Counter[];
  queueTokens: QueueToken[];
  routeSteps: RouteStep[];
  lastRefreshedAt: number;
  language?: 'en' | 'hi';
  onViewReports?: () => void;
}

// Department category → icon + color
const DEPT_ICON_MAP: Record<
  string,
  { Icon: React.ElementType; bg: string; iconColor: string }
> = {
  pathology:    { Icon: Droplet,     bg: 'bg-rose-500',    iconColor: 'text-white' },
  biochemistry: { Icon: FlaskConical, bg: 'bg-violet-500',  iconColor: 'text-white' },
  cardiology:   { Icon: Activity,    bg: 'bg-blue-500',    iconColor: 'text-white' },
  radiology:    { Icon: ScanLine,    bg: 'bg-blue-600',    iconColor: 'text-white' },
  ultrasound:   { Icon: Waves,       bg: 'bg-blue-500',    iconColor: 'text-white' },
  ophthalmology:{ Icon: Eye,         bg: 'bg-cyan-500',    iconColor: 'text-white' },
  ent:          { Icon: Radio,       bg: 'bg-indigo-500',  iconColor: 'text-white' },
  neurology:    { Icon: Brain,       bg: 'bg-purple-500',  iconColor: 'text-white' },
  pulmonary:    { Icon: Wind,        bg: 'bg-sky-500',     iconColor: 'text-white' },
  orthopedics:  { Icon: Bone,        bg: 'bg-orange-500',  iconColor: 'text-white' },
};

const FALLBACK_ICON = { Icon: Microscope, bg: 'bg-teal-500', iconColor: 'text-white' };

function getDeptIcon(category?: string): { Icon: React.ElementType; bg: string; iconColor: string } {
  return (category ? DEPT_ICON_MAP[category] : undefined) ?? FALLBACK_ICON;
}

function computeLiveStats(
  testId: string,
  deptId: string,
  patientId: string,
  test: DiagnosticTest,
  queueTokens: QueueToken[],
  counters: Counter[],
  departments: Department[],
) {
  const dept = departments.find((d) => d.id === deptId);
  const activeMachines = Math.max(
    1,
    dept?.activeMachines ??
      counters.filter((c) => c.departmentId === deptId && c.status === 'active').length,
  );
  const isDeptClosed =
    dept?.availabilityStatus === 'unavailable' ||
    (dept?.activeMachines !== undefined && dept.activeMachines <= 0);

  const waitingAhead = queueTokens.filter(
    (t) =>
      t.departmentId === deptId &&
      t.status === 'waiting' &&
      t.patientId !== patientId,
  ).length;

  const avgDuration = test.averageDurationMinutes || 10;
  const waitMinutes = isDeptClosed
    ? 90
    : waitingAhead === 0
    ? 0
    : Math.max(1, Math.round((waitingAhead * avgDuration) / activeMachines));

  const myToken = queueTokens.find(
    (t) => t.patientId === patientId && t.testId === testId,
  );

  return {
    waitingAhead,
    waitMinutes,
    waitRange: isDeptClosed ? 'Unavailable' : formatWaitRange(waitMinutes),
    isDeptClosed,
    myTokenNumber: myToken?.tokenNumber ?? null,
    myTokenStatus: myToken?.status ?? null,
  };
}

export const PrescribedTestsNavigationPanel: React.FC<
  PrescribedTestsNavigationPanelProps
> = ({
  patient,
  tests,
  departments,
  counters,
  queueTokens,
  routeSteps,
  lastRefreshedAt,
  language = 'en',
  onViewReports,
}) => {
  const hi = language === 'hi';

  // Ordered: route steps first (AI optimal order), then remaining prescribed tests
  const orderedTestIds: string[] = [
    ...routeSteps.map((s) => s.testId),
    ...patient.prescribedTests.filter(
      (id) => !routeSteps.some((s) => s.testId === id),
    ),
  ];

  const recommendedNextTestId = routeSteps.find(
    (s) => !patient.completedTests.includes(s.testId),
  )?.testId;

  const refreshedTime = new Date(lastRefreshedAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (patient.prescribedTests.length === 0) return null;

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-4">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          {hi ? 'लाइव क्यू' : 'Live Queue'}
        </h3>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <RefreshCw className="w-3 h-3 text-teal-500" />
          <span>{refreshedTime}</span>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {orderedTestIds.map((testId) => {
          const test = tests.find((t) => t.id === testId);
          if (!test) return null;

          const dept = departments.find((d) => d.id === test.departmentId);
          const isDone = patient.completedTests.includes(testId);
          const isRecommendedNext = testId === recommendedNextTestId;
          const stats = computeLiveStats(
            testId,
            test.departmentId,
            patient.id,
            test,
            queueTokens,
            counters,
            departments,
          );
          const { Icon, bg, iconColor } = getDeptIcon(dept?.category);

          // Sub-label: waiting + wait range
          let subLabel = '';
          if (isDone) {
            subLabel = hi ? 'पूर्ण व सत्यापित' : 'Completed & verified';
          } else if (stats.isDeptClosed) {
            subLabel = hi ? 'अस्थायी रूप से बंद' : 'Temporarily closed';
          } else if (stats.myTokenStatus === 'called') {
            subLabel = hi
              ? `टोकन #${stats.myTokenNumber} बुलाया — तुरंत जाएं!`
              : `Token #${stats.myTokenNumber} called — go now!`;
          } else if (stats.myTokenStatus === 'in_progress') {
            subLabel = hi ? 'जांच जारी है' : 'Test in progress';
          } else {
            const waitingPart =
              stats.waitingAhead === 0
                ? hi ? 'अभी कोई नहीं' : '0 waiting'
                : `${stats.waitingAhead} ${hi ? 'प्रतीक्षारत' : 'waiting'}`;
            const timePart = stats.waitMinutes === 0
              ? hi ? '• तुरंत' : '• Immediate'
              : `• ${stats.waitRange}`;
            subLabel = `${waitingPart} ${timePart}`;
          }

          return (
            <div
              key={testId}
              onClick={isDone ? onViewReports : undefined}
              className={`flex items-center gap-4 py-4 px-1 transition-colors ${
                isDone ? 'cursor-pointer hover:bg-slate-50/60' : ''
              } ${isRecommendedNext && !isDone ? 'relative' : ''}`}
            >
              {/* Dept Icon Circle */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  isDone ? 'bg-emerald-500' : stats.isDeptClosed ? 'bg-slate-300' : bg
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-6 h-6 text-white" />
                ) : stats.isDeptClosed ? (
                  <AlertTriangle className="w-5 h-5 text-white" />
                ) : stats.myTokenStatus === 'called' ? (
                  <Zap className="w-5 h-5 text-white animate-pulse" />
                ) : (
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                )}
              </div>

              {/* Text block */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-bold text-base leading-tight ${
                      isDone
                        ? 'text-emerald-700'
                        : stats.myTokenStatus === 'called'
                        ? 'text-rose-700'
                        : 'text-slate-900'
                    }`}
                  >
                    {test.name}
                  </span>
                  {stats.myTokenNumber && !isDone && (
                    <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 tabular-nums">
                      #{stats.myTokenNumber}
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm font-medium mt-0.5 ${
                    isDone
                      ? 'text-emerald-600'
                      : stats.isDeptClosed
                      ? 'text-amber-600'
                      : stats.myTokenStatus === 'called'
                      ? 'text-rose-600 font-bold animate-pulse'
                      : stats.waitingAhead === 0
                      ? 'text-emerald-600'
                      : 'text-slate-500'
                  }`}
                >
                  {subLabel}
                </p>
              </div>

              {/* Right side: badge OR chevron */}
              {isRecommendedNext && !isDone ? (
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 border border-emerald-700 text-white text-xs font-bold qcare-pill-3d-solid whitespace-nowrap">
                    {hi ? 'AI अनुशंसित' : 'Recommended Next'}
                  </span>
                </div>
              ) : isDone ? (
                <ChevronRight className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <ChevronRight
                  className={`w-5 h-5 shrink-0 ${
                    stats.myTokenStatus === 'called'
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
        <span>
          {patient.completedTests.length}/{patient.prescribedTests.length}{' '}
          {hi ? 'जांचें पूर्ण' : 'tests completed'}
        </span>
        <span className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3" />
          {hi ? 'हर 2 मिनट में अपडेट' : 'Updates every 2 min'}
        </span>
      </div>
    </div>
  );
};
