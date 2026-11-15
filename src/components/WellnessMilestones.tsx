import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Activity,
  Award,
  CheckCircle2,
  Droplets,
  Moon,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ResidentProfile } from "../data/eldercareData";

interface WellnessMilestonesProps {
  resident: ResidentProfile;
  onIncrementHydration: (residentId: string) => void;
  onShareMilestoneNote: (residentId: string, milestoneTitle: string) => void;
}

interface ComputedMilestone {
  id: string;
  title: string;
  subtitle: string;
  progressLabel: string;
  progressPct: number;
  reached: boolean;
  icon: "hydration" | "activity" | "sleep" | "routine" | "safety";
}

const BURST_PARTICLES = [
  { x: -56, y: -38, rot: -25, color: "#0D6E5C" },
  { x: 54, y: -42, rot: 22, color: "#D97706" },
  { x: -72, y: 12, rot: -40, color: "#10B981" },
  { x: 70, y: 16, rot: 35, color: "#0D6E5C" },
  { x: -28, y: -62, rot: 15, color: "#F59E0B" },
  { x: 30, y: -60, rot: -18, color: "#059669" },
  { x: 0, y: -74, rot: 0, color: "#0D6E5C" },
];

function MilestoneIcon({ kind }: { kind: ComputedMilestone["icon"] }) {
  if (kind === "hydration") return <Droplets className="w-4 h-4" aria-hidden="true" />;
  if (kind === "activity") return <Activity className="w-4 h-4" aria-hidden="true" />;
  if (kind === "sleep") return <Moon className="w-4 h-4" aria-hidden="true" />;
  if (kind === "safety") return <ShieldCheck className="w-4 h-4" aria-hidden="true" />;
  return <CheckCircle2 className="w-4 h-4" aria-hidden="true" />;
}

export function WellnessMilestones({
  resident,
  onIncrementHydration,
  onShareMilestoneNote,
}: WellnessMilestonesProps) {
  const prefersReducedMotion = useReducedMotion();

  const milestones = useMemo<ComputedMilestone[]>(() => {
    const avgActivity = Math.round(
      resident.wellnessHistory.reduce((s, d) => s + d.activityScore, 0) /
        resident.wellnessHistory.length
    );
    const avgSleep = Math.round(
      resident.wellnessHistory.reduce((s, d) => s + d.sleepScore, 0) /
        resident.wellnessHistory.length
    );
    const hydrationDaysMet = resident.wellnessHistory.filter(
      (d) => d.hydrationScore >= 70
    ).length;
    const completedTasks = resident.tasks.filter((t) => t.completed).length;
    const totalTasks = resident.tasks.length;
    const openAlerts = resident.securityLogs.filter(
      (l) => l.status !== "Resolved"
    ).length;

    return [
      {
        id: "hydration-streak",
        title: "7-Day Hydration Streak",
        subtitle:
          resident.hydrationGlasses >= resident.hydrationTarget
            ? "7 consecutive days meeting daily fluid goal"
            : `Reach ${resident.hydrationTarget} glasses today to lock in day 7`,
        progressLabel: `${resident.hydrationGlasses}/${resident.hydrationTarget} glasses · ${hydrationDaysMet}/7 days`,
        progressPct: Math.min(
          100,
          Math.round((resident.hydrationGlasses / resident.hydrationTarget) * 100)
        ),
        reached:
          hydrationDaysMet >= 7 &&
          resident.hydrationGlasses >= resident.hydrationTarget,
        icon: "hydration",
      },
      {
        id: "consistent-activity",
        title: "Consistent Activity Levels",
        subtitle: "Maintain at least 80% weekly mobility cadence",
        progressLabel: `${avgActivity}% 7-day average`,
        progressPct: Math.min(100, Math.round((avgActivity / 80) * 100)),
        reached: avgActivity >= 80,
        icon: "activity",
      },
      {
        id: "restful-sleep",
        title: "Restful Sleep Rhythm",
        subtitle: "Sustained 82%+ overnight sleep continuity",
        progressLabel: `${avgSleep}% 7-day average`,
        progressPct: Math.min(100, Math.round((avgSleep / 82) * 100)),
        reached: avgSleep >= 82,
        icon: "sleep",
      },
      {
        id: "daily-routine",
        title: "Daily Care Routine Complete",
        subtitle: "Every scheduled medication and check-in finished today",
        progressLabel: `${completedTasks}/${totalTasks} items done`,
        progressPct: Math.round((completedTasks / Math.max(1, totalTasks)) * 100),
        reached: totalTasks > 0 && completedTasks === totalTasks,
        icon: "routine",
      },
      {
        id: "calm-sanctuary",
        title: "All Safety Alerts Resolved",
        subtitle: "Zero open movement or fall alerts requiring review",
        progressLabel:
          openAlerts === 0 ? "All clear" : `${openAlerts} open for review`,
        progressPct: openAlerts === 0 ? 100 : Math.max(25, 100 - openAlerts * 30),
        reached: openAlerts === 0,
        icon: "safety",
      },
    ];
  }, [resident]);

  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [recentBanner, setRecentBanner] = useState<string | null>(null);
  const [sharedIds, setSharedIds] = useState<Record<string, boolean>>({});
  const prevReachedRef = useRef<Record<string, boolean>>({});
  const lastResidentRef = useRef<string>(resident.id);
  const celebrationTimerRef = useRef<number | null>(null);

  // Detect newly reached milestones and trigger reward animation automatically
  useEffect(() => {
    const currentMap: Record<string, boolean> = {};
    milestones.forEach((m) => {
      currentMap[m.id] = m.reached;
    });

    if (lastResidentRef.current !== resident.id) {
      lastResidentRef.current = resident.id;
      prevReachedRef.current = currentMap;
      if (celebrationTimerRef.current) {
        window.clearTimeout(celebrationTimerRef.current);
      }
      setCelebratingId(null);
      setRecentBanner(null);
      return;
    }

    const newlyUnlocked = milestones.find(
      (m) => m.reached && prevReachedRef.current[m.id] === false
    );

    prevReachedRef.current = currentMap;

    if (newlyUnlocked) {
      if (celebrationTimerRef.current) {
        window.clearTimeout(celebrationTimerRef.current);
      }
      setCelebratingId(newlyUnlocked.id);
      setRecentBanner(newlyUnlocked.title);
      celebrationTimerRef.current = window.setTimeout(() => {
        setCelebratingId(null);
      }, 2200);
    }
  }, [resident.id, milestones]);

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) {
        window.clearTimeout(celebrationTimerRef.current);
      }
    };
  }, []);

  const triggerManualCelebrate = (m: ComputedMilestone) => {
    if (celebrationTimerRef.current) {
      window.clearTimeout(celebrationTimerRef.current);
    }
    setCelebratingId(m.id);
    setRecentBanner(m.title);
    celebrationTimerRef.current = window.setTimeout(() => {
      setCelebratingId((curr) => (curr === m.id ? null : curr));
    }, 2000);
  };

  const reachedCount = milestones.filter((m) => m.reached).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#0D6E5C]">
            <Award className="w-4 h-4" aria-hidden="true" />
            <span>Wellness Milestones</span>
            <span className="text-slate-400" aria-hidden="true">
              ·
            </span>
            <span className="font-mono-tabular text-slate-600">
              {reachedCount} of {milestones.length} achieved
            </span>
          </div>
          <h4 className="mt-1 text-xl font-medium text-slate-900">
            Celebrating steady daily habits for {resident.name}
          </h4>
        </div>

        <button
          type="button"
          onClick={() => onIncrementHydration(resident.id)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800 hover:border-[#0D6E5C] hover:text-[#0D6E5C] transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Droplets className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
          Log Hydration Glass ({resident.hydrationGlasses}/{resident.hydrationTarget})
        </button>
      </div>

      {/* Newly Reached Celebration Banner */}
      <AnimatePresence>
        {recentBanner && (
          <motion.div
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -8, rotateX: 8 }
            }
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 text-sm text-[#0F2922]">
              <Sparkles className="w-4 h-4 text-[#0D6E5C] shrink-0" aria-hidden="true" />
              <span>
                Milestone reached: <strong className="font-semibold">{recentBanner}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRecentBanner(null)}
              className="text-xs font-medium text-[#0D6E5C] hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Milestones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {milestones.map((m) => {
          const isCelebrating = celebratingId === m.id;
          const isShared = Boolean(sharedIds[`${resident.id}-${m.id}`]);

          return (
            <motion.div
              key={m.id}
              animate={
                isCelebrating && !prefersReducedMotion
                  ? {
                      scale: [1, 1.03, 1],
                      rotateX: [0, -4, 0],
                      rotateY: [0, 4, 0],
                    }
                  : { scale: 1, rotateX: 0, rotateY: 0 }
              }
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformPerspective: 1000 }}
              className={`relative overflow-hidden rounded-xl border p-4 flex flex-col justify-between transition-colors ${
                m.reached
                  ? "border-[#0D6E5C]/40 bg-[#F8FAFC]"
                  : "border-slate-200 bg-white"
              }`}
            >
              {/* Visual Reward Burst Animation Overlay */}
              <AnimatePresence>
                {isCelebrating && !prefersReducedMotion && (
                  <div
                    className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
                    aria-hidden="true"
                  >
                    <motion.span
                      initial={{ scale: 0.4, opacity: 0.7 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
                      className="w-24 h-24 rounded-full border-2 border-[#0D6E5C]"
                    />
                    {BURST_PARTICLES.map((p, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ x: 0, y: 0, scale: 0.4, opacity: 1, rotate: 0 }}
                        animate={{
                          x: p.x,
                          y: p.y,
                          scale: [0.6, 1.15, 0.7],
                          opacity: [1, 0.95, 0],
                          rotate: p.rot,
                        }}
                        transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
                        style={{ backgroundColor: p.color }}
                        className="absolute w-2 h-2 rounded-xs"
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      m.reached ? "text-[#0D6E5C]" : "text-slate-600"
                    }`}
                  >
                    <MilestoneIcon kind={m.icon} />
                    {m.reached ? "Achieved" : "In Progress"}
                  </span>

                  <span className="font-mono-tabular text-xs font-medium text-slate-600">
                    {m.progressPct}%
                  </span>
                </div>

                <h5 className="mt-2 text-base font-medium text-slate-900">
                  {m.title}
                </h5>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {m.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2.5">
                {/* Progress Track */}
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <motion.div
                    initial={false}
                    animate={{ scaleX: Math.max(0.04, m.progressPct / 100) }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: "left" }}
                    className={`h-full w-full ${
                      m.reached ? "bg-[#0D6E5C]" : "bg-slate-400"
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono-tabular text-slate-500 truncate">
                    {m.progressLabel}
                  </span>

                  {m.reached && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => triggerManualCelebrate(m)}
                        className="text-xs font-medium text-[#0D6E5C] hover:underline cursor-pointer whitespace-nowrap"
                      >
                        Celebrate
                      </button>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <button
                        type="button"
                        disabled={isShared}
                        onClick={() => {
                          onShareMilestoneNote(resident.id, m.title);
                          setSharedIds((prev) => ({
                            ...prev,
                            [`${resident.id}-${m.id}`]: true,
                          }));
                        }}
                        className="text-xs font-medium text-slate-700 hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer whitespace-nowrap"
                      >
                        {isShared ? "Shared" : "Share Note"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
