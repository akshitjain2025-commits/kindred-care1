import { useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Droplets,
  FileText,
  PhoneCall,
  Plus,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
  Volume2,
} from "lucide-react";
import type {
  CareTaskItem,
  ResidentProfile,
  SecurityAlertStatus,
} from "../data/eldercareData";
import { DailyCareSchedule } from "./DailyCareSchedule";
import type { FamilyPageNotification } from "./QuickPageModal";
import type { NotificationChannel } from "../services/medicationNotifications";
import type { DoctorModalTab } from "./DoctorConnectModal";
import { Skiper27RollingText } from "./SkiperKineticPrimitives";
import { HydrationTracker } from "./HydrationTracker";

interface CareCircleWorkbenchProps {
  residents: ResidentProfile[];
  activeResidentId: string;
  onSelectResident: (id: string) => void;
  onToggleTask: (residentId: string, taskId: string) => void;
  onAddTask: (
    residentId: string,
    task: Omit<CareTaskItem, "id" | "completed">
  ) => void;
  onLogHydrationDelta: (residentId: string, delta: number) => void;
  onUpdateHydrationGoal: (residentId: string, nextTarget: number) => void;
  onAddNote: (residentId: string, author: string, text: string) => void;
  onResolveSecurityLog: (residentId: string, logId: string) => void;
  onUpdateTodayWellness: (
    residentId: string,
    patch: { activityScore?: number; sleepScore?: number }
  ) => void;
  onReadSummaryAloud: (summaryPrompt: string) => void;
  onOpenPhysicianReport: () => void;
  onOpenQuickAlert: () => void;
  onOpenQuickPage: () => void;
  onOpenNewPatientForm: () => void;
  onOpenDoctorConnect: (tab: DoctorModalTab) => void;
  familyPages: FamilyPageNotification[];
  onAcknowledgePage: (pageId: string) => void;
  autoMedReminders: boolean;
  onToggleAutoMedReminders: () => void;
  reminderChannel: NotificationChannel;
  onChangeReminderChannel: (channel: NotificationChannel) => void;
  onTriggerMedicationReminder: () => void;
  lastMedReminderSentAt?: string | null;
}

type WorkbenchTab = "schedule" | "security";
type SecurityFilter = "all" | "falls" | "movement" | "open";
type TrendMetricFilter = "all" | "activityScore" | "sleepScore" | "hydrationScore";

function SecurityStatusLabel({ status }: { status: SecurityAlertStatus }) {
  if (status === "Resolved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0D6E5C] whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
        Resolved
      </span>
    );
  }
  if (status === "Acknowledged") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
        Acknowledged
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 whitespace-nowrap">
      <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
      Monitoring
    </span>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string;
  }>;
  label?: string;
}

function WellnessTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm text-xs">
      <p className="font-semibold text-slate-900 mb-1.5">{label} Wellness</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={String(entry.dataKey)}
            className="flex items-center justify-between gap-4"
          >
            <span className="text-slate-600">{entry.name}</span>
            <span className="font-mono-tabular font-semibold text-slate-900">
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CareCircleWorkbench({
  residents,
  activeResidentId,
  onSelectResident,
  onToggleTask,
  onAddTask,
  onLogHydrationDelta,
  onUpdateHydrationGoal,
  onAddNote,
  onResolveSecurityLog,
  onUpdateTodayWellness,
  onReadSummaryAloud,
  onOpenPhysicianReport,
  onOpenQuickAlert,
  onOpenQuickPage,
  onOpenNewPatientForm,
  onOpenDoctorConnect,
  familyPages,
  onAcknowledgePage,
  autoMedReminders,
  onToggleAutoMedReminders,
  reminderChannel,
  onChangeReminderChannel,
  onTriggerMedicationReminder,
  lastMedReminderSentAt,
}: CareCircleWorkbenchProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<WorkbenchTab>("schedule");
  const [securityFilter, setSecurityFilter] = useState<SecurityFilter>("all");
  const [trendFilter, setTrendFilter] = useState<TrendMetricFilter>("all");
  const [noteAuthor, setNoteAuthor] = useState("Clara Pendelton");
  const [noteText, setNoteText] = useState("");
  const [noteError, setNoteError] = useState("");

  const activeResident =
    residents.find((r) => r.id === activeResidentId) || residents[0];

  const completedCount = activeResident.tasks.filter((t) => t.completed).length;
  const totalCount = activeResident.tasks.length;
  const completionPct = Math.round((completedCount / Math.max(1, totalCount)) * 100);

  const openAlertsCount = activeResident.securityLogs.filter(
    (log) => log.status !== "Resolved"
  ).length;

  const avgActivity = Math.round(
    activeResident.wellnessHistory.reduce((s, d) => s + d.activityScore, 0) /
      activeResident.wellnessHistory.length
  );
  const avgSleep = Math.round(
    activeResident.wellnessHistory.reduce((s, d) => s + d.sleepScore, 0) /
      activeResident.wellnessHistory.length
  );
  const avgHydration = Math.round(
    activeResident.wellnessHistory.reduce((s, d) => s + d.hydrationScore, 0) /
      activeResident.wellnessHistory.length
  );

  const todayPoint =
    activeResident.wellnessHistory[activeResident.wellnessHistory.length - 1];

  const filteredLogs = activeResident.securityLogs.filter((log) => {
    if (securityFilter === "falls") return log.eventType === "Fall Detection";
    if (securityFilter === "movement") {
      return (
        log.eventType === "Unusual Movement" ||
        log.eventType === "Nighttime Wandering"
      );
    }
    if (securityFilter === "open") return log.status !== "Resolved";
    return true;
  });

  const handleNoteSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) {
      setNoteError("Please write a short care update before posting.");
      return;
    }
    setNoteError("");
    onAddNote(activeResident.id, noteAuthor.trim() || "Family Member", noteText.trim());
    setNoteText("");
  };

  const handleSpeakSummary = () => {
    const remaining = activeResident.tasks.filter((t) => !t.completed);
    const remainingText =
      remaining.length > 0
        ? remaining.map((t) => `${t.title} at ${t.time}`).join("; ")
        : "all scheduled tasks are complete for today";
    onReadSummaryAloud(
      `Please give a warm, brief spoken summary of ${activeResident.name}'s day so far: ${completedCount} of ${totalCount} care items completed, hydration is at ${activeResident.hydrationGlasses} of ${activeResident.hydrationTarget} glasses, 7-day averages are ${avgActivity}% activity and ${avgSleep}% sleep, ${openAlertsCount} safety log items open for review, and remaining items are ${remainingText}.`
    );
  };

  return (
    <section
      id="care-circle"
      className="py-20 border-t border-slate-200 bg-white"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section Header + Resident Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#0D6E5C] tracking-wide">
              02. Shared Family Care Circle
            </p>
            <Skiper27RollingText
              as="h2"
              text="One calm daily rhythm for elders, adult children, and clinicians"
              className="mt-2 text-3xl lg:text-4xl font-medium tracking-tight text-slate-900 text-balance"
            />
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              Monitor 7-day wellness trajectories, check off daily medications, and
              review non-optical safety logs in one shared family workbench.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <div
              className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200"
              role="tablist"
              aria-label="Select resident care circle"
            >
              {residents.map((resident) => {
                const selected = resident.id === activeResident.id;
                return (
                  <button
                    key={resident.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => onSelectResident(resident.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      selected
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {resident.name}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onOpenNewPatientForm}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#0D6E5C] hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              New Patient
            </button>
          </div>
        </div>

        {/* 3D Transitioning Resident Care Board */}
        <div className="perspective-stage">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeResident.id}
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, rotateY: -5, scale: 0.988, y: 10 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, rotateY: 0, scale: 1, y: 0 }
              }
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, rotateY: 5, scale: 0.988, y: -10 }
              }
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              {/* Top Grid: Profile Snapshot + Recharts 7-Day Wellness Trajectory */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Resident Summary & Circle Members */}
                <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
                  <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-200 shrink-0">
                        <img
                          src={activeResident.avatarUrl}
                          alt={activeResident.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xl font-medium text-slate-900">
                          {activeResident.name}
                        </h3>
                        <p className="text-sm text-slate-600 mt-0.5">
                          Age {activeResident.age} · {activeResident.residence}
                        </p>
                        <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                          {activeResident.careFocus}
                        </p>
                      </div>
                    </div>

                    {/* Clean Tabular Metrics Grid */}
                    <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Today&apos;s Rhythm</p>
                        <p className="mt-1 font-mono-tabular text-xl font-semibold text-slate-900">
                          {completionPct}%
                        </p>
                        <p className="text-xs text-slate-500 font-mono-tabular">
                          {completedCount}/{totalCount} complete
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Resting Pulse</p>
                        <p className="mt-1 font-mono-tabular text-xl font-semibold text-slate-900">
                          {activeResident.restingHeartRate}
                        </p>
                        <p className="text-xs text-slate-500">
                          {activeResident.statusLevel} state
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Hydration</p>
                        <p className="mt-1 font-mono-tabular text-xl font-semibold text-[#0D6E5C]">
                          {activeResident.hydrationGlasses}/
                          {activeResident.hydrationTarget}
                        </p>
                        <button
                          type="button"
                          onClick={() => onLogHydrationDelta(activeResident.id, 1)}
                          className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-[#0D6E5C] hover:underline cursor-pointer whitespace-nowrap"
                        >
                          <Droplets className="w-3 h-3" aria-hidden="true" />
                          +1 glass
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-200 flex items-start gap-2.5 text-sm text-slate-700">
                      <ShieldCheck
                        className="w-4 h-4 text-[#0D6E5C] mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{activeResident.safetySummary}</span>
                    </div>

                    <div className="mt-5 space-y-2.5">
                      <button
                        type="button"
                        onClick={handleSpeakSummary}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2922] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#163b31] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Volume2 className="w-4 h-4" aria-hidden="true" />
                        Ask Kindred to Read Daily Summary
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenDoctorConnect("contact")}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
                          Contact Doctor
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDoctorConnect("appointment")}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-[#0D6E5C] hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Circle Members List */}
                  <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-medium text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#0D6E5C]" aria-hidden="true" />
                        Active Care Circle
                      </h4>
                      <span className="text-xs text-slate-500 font-mono-tabular">
                        {activeResident.circleMembers.length} members
                      </span>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {activeResident.circleMembers.map((member) => (
                        <div
                          key={member.id}
                          className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {member.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {member.role} · {member.location}
                            </p>
                          </div>
                          <span className="text-xs text-slate-500 font-mono-tabular whitespace-nowrap shrink-0">
                            {member.lastCheckIn}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500">
                        Non-emergency family ping
                      </span>
                      <button
                        type="button"
                        onClick={onOpenQuickPage}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D6E5C] text-white px-3.5 py-2 text-xs font-medium hover:bg-[#095547] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                        Quick Page
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Recharts 7-Day Wellness Trajectory + Tabbed Schedule/Security Logs */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {/* Recharts 7-Day Wellness Trajectory Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-slate-900">
                          7-Day Wellness Trajectory
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Daily activity, sleep quality, and hydration adherence (%)
                        </p>
                      </div>

                      <div
                        className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100"
                        role="group"
                        aria-label="Wellness trend metric filter"
                      >
                        {(
                          [
                            { id: "all", label: "All" },
                            { id: "activityScore", label: "Activity" },
                            { id: "sleepScore", label: "Sleep" },
                            { id: "hydrationScore", label: "Hydration" },
                          ] as { id: TrendMetricFilter; label: string }[]
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setTrendFilter(opt.id)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                              trendFilter === opt.id
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 7-Day Averages Strip */}
                    <div className="grid grid-cols-3 gap-4 pb-4 mb-4 border-b border-slate-100">
                      <div>
                        <p className="text-xs text-slate-500">Activity (7d avg)</p>
                        <p className="font-mono-tabular text-base font-semibold text-[#0D6E5C]">
                          {avgActivity}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Sleep Quality (7d avg)</p>
                        <p className="font-mono-tabular text-base font-semibold text-[#1D4ED8]">
                          {avgSleep}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Hydration (7d avg)</p>
                        <p className="font-mono-tabular text-base font-semibold text-[#B45309]">
                          {avgHydration}%
                        </p>
                      </div>
                    </div>

                    {/* Recharts Responsive AreaChart */}
                    <div className="w-full h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={activeResident.wellnessHistory}
                          margin={{ top: 6, right: 8, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="gradActivity" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0D6E5C" stopOpacity={0.24} />
                              <stop offset="95%" stopColor="#0D6E5C" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="gradSleep" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="gradHydration" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#D97706" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 12, fill: "#64748B" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[40, 100]}
                            tick={{ fontSize: 11, fill: "#64748B" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip content={<WellnessTooltip />} />
                          {(trendFilter === "all" || trendFilter === "activityScore") && (
                            <Area
                              type="monotone"
                              dataKey="activityScore"
                              name="Activity"
                              stroke="#0D6E5C"
                              strokeWidth={2}
                              fill="url(#gradActivity)"
                            />
                          )}
                          {(trendFilter === "all" || trendFilter === "sleepScore") && (
                            <Area
                              type="monotone"
                              dataKey="sleepScore"
                              name="Sleep"
                              stroke="#1D4ED8"
                              strokeWidth={2}
                              fill="url(#gradSleep)"
                            />
                          )}
                          {(trendFilter === "all" || trendFilter === "hydrationScore") && (
                            <Area
                              type="monotone"
                              dataKey="hydrationScore"
                              name="Hydration"
                              stroke="#D97706"
                              strokeWidth={2}
                              fill="url(#gradHydration)"
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Interactive Today Wellness Check Controls */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="text-slate-600 font-medium">
                        Update Today&apos;s Check-In (Sun):
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateTodayWellness(activeResident.id, {
                              sleepScore: Math.min(100, (todayPoint?.sleepScore || 80) + 5),
                            })
                          }
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          +5% Restful Sleep
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateTodayWellness(activeResident.id, {
                              activityScore: Math.min(
                                100,
                                (todayPoint?.activityScore || 78) + 5
                              ),
                            })
                          }
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          +5% Mobility Walk
                        </button>
                        <button
                          type="button"
                          onClick={onOpenPhysicianReport}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2922] text-white px-3 py-1 hover:bg-[#163b31] transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                          Physician PDF
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Daily Hydration Tracker with Editable Target & +1/+2 Quick-Add */}
                  <HydrationTracker
                    resident={activeResident}
                    onLogHydrationDelta={onLogHydrationDelta}
                    onUpdateHydrationGoal={onUpdateHydrationGoal}
                  />

                  {/* Workbench Sub-Navigation Tabs: Daily Schedule vs Security Logs */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div
                      className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200"
                      role="tablist"
                      aria-label="Care workbench views"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === "schedule"}
                        onClick={() => setActiveTab("schedule")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          activeTab === "schedule"
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Daily Schedule
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === "security"}
                        onClick={() => setActiveTab("security")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          activeTab === "security"
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Security Logs ({activeResident.securityLogs.length})
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="text-xs text-slate-500 font-mono-tabular">
                        {openAlertsCount === 0
                          ? "All safety events resolved"
                          : `${openAlertsCount} alert${openAlertsCount > 1 ? "s" : ""} open for review`}
                      </p>
                      <button
                        type="button"
                        onClick={onOpenQuickPage}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-[#0D6E5C] hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                        Quick Page
                      </button>
                      <button
                        type="button"
                        onClick={onOpenQuickAlert}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-800 hover:bg-rose-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                        Quick Alert
                      </button>
                    </div>
                  </div>

                  {/* Active In-App Family Coordination Pages */}
                  {familyPages.length > 0 && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2.5">
                      <p className="text-xs font-semibold text-[#0F2922]">
                        Recent In-App Family Pages ({familyPages.length})
                      </p>
                      <div className="space-y-2">
                        {familyPages.slice(0, 3).map((pg) => (
                          <div
                            key={pg.id}
                            className="rounded-xl border border-emerald-200/80 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900">
                                &ldquo;{pg.message}&rdquo;
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {pg.sender} · {pg.timestamp} · Paged{" "}
                                {pg.recipients.length} family members
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onAcknowledgePage(pg.id)}
                              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                                pg.acknowledgedBy.length > 0
                                  ? "bg-emerald-50 text-[#0D6E5C] border border-emerald-200"
                                  : "bg-[#0F2922] text-white hover:bg-[#163b31]"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              {pg.acknowledgedBy.length > 0
                                ? `Covered by ${pg.acknowledgedBy[0]}`
                                : "I'll Handle This"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3D Tab Content Transition */}
                  <div className="perspective-stage">
                    <AnimatePresence mode="wait">
                      {activeTab === "schedule" ? (
                        <motion.div
                          key="schedule-tab"
                          initial={
                            prefersReducedMotion
                              ? { opacity: 0 }
                              : { opacity: 0, rotateX: 4, y: 8 }
                          }
                          animate={{ opacity: 1, rotateX: 0, y: 0 }}
                          exit={
                            prefersReducedMotion
                              ? { opacity: 0 }
                              : { opacity: 0, rotateX: -4, y: -8 }
                          }
                          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                          className="flex flex-col gap-6"
                        >
                          <DailyCareSchedule
                            resident={activeResident}
                            onToggleTask={onToggleTask}
                            onAddTask={onAddTask}
                            autoMedReminders={autoMedReminders}
                            onToggleAutoMedReminders={onToggleAutoMedReminders}
                            reminderChannel={reminderChannel}
                            onChangeReminderChannel={onChangeReminderChannel}
                            onTriggerMedicationReminder={onTriggerMedicationReminder}
                            lastMedReminderSentAt={lastMedReminderSentAt}
                          />

                          {/* Shared Care Notes Log */}
                          <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <h4 className="text-lg font-medium text-slate-900 mb-4">
                              Caregiver &amp; Family Handoff Notes
                            </h4>
                            <div className="space-y-4 mb-5">
                              {activeResident.notes.map((note) => (
                                <div
                                  key={note.id}
                                  className="pb-4 border-b border-slate-100 last:border-none last:pb-0"
                                >
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="font-medium text-slate-800">
                                      {note.author}
                                    </span>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-mono-tabular">
                                      {note.timestamp}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                                    {note.text}
                                  </p>
                                </div>
                              ))}
                            </div>

                            <form onSubmit={handleNoteSubmit} className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <input
                                  type="text"
                                  value={noteAuthor}
                                  onChange={(e) => setNoteAuthor(e.target.value)}
                                  aria-label="Caregiver name"
                                  placeholder="Your name"
                                  className="sm:col-span-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D6E5C]"
                                />
                                <input
                                  type="text"
                                  value={noteText}
                                  onChange={(e) => setNoteText(e.target.value)}
                                  aria-label="Care note"
                                  placeholder="Add a handoff note (e.g., pharmacy pickup, lunch appetite)..."
                                  className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D6E5C]"
                                />
                              </div>
                              {noteError && (
                                <p className="text-xs text-rose-700">{noteError}</p>
                              )}
                              <div className="flex justify-end">
                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white px-4 py-2 text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                                  Post to Care Circle
                                </button>
                              </div>
                            </form>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="security-tab"
                          initial={
                            prefersReducedMotion
                              ? { opacity: 0 }
                              : { opacity: 0, rotateX: 4, y: 8 }
                          }
                          animate={{ opacity: 1, rotateX: 0, y: 0 }}
                          exit={
                            prefersReducedMotion
                              ? { opacity: 0 }
                              : { opacity: 0, rotateX: -4, y: -8 }
                          }
                          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                          className="rounded-2xl border border-slate-200 bg-white p-6"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                            <div>
                              <h4 className="text-lg font-medium text-slate-900">
                                Chronological Safety &amp; Movement Logs
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Non-optical millimeter-wave events for{" "}
                                {activeResident.name}
                              </p>
                            </div>

                            <div
                              className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100"
                              role="group"
                              aria-label="Filter security logs"
                            >
                              {(
                                [
                                  { id: "all", label: "All" },
                                  { id: "falls", label: "Falls" },
                                  { id: "movement", label: "Movement" },
                                  { id: "open", label: "Needs Review" },
                                ] as { id: SecurityFilter; label: string }[]
                              ).map((f) => (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => setSecurityFilter(f.id)}
                                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                                    securityFilter === f.id
                                      ? "bg-white text-slate-900 shadow-xs"
                                      : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  {f.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {filteredLogs.length === 0 ? (
                            <div className="py-10 text-center border-t border-slate-100">
                              <p className="text-sm font-medium text-slate-700">
                                No matching safety alerts
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                All home zones are calm under the current filter.
                              </p>
                            </div>
                          ) : (
                            <div className="divide-y divide-slate-200">
                              {filteredLogs.map((log) => (
                                <div
                                  key={log.id}
                                  className="py-4 first:pt-1 last:pb-1 space-y-2"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                                      <span className="font-mono-tabular font-medium text-slate-700">
                                        {log.timestamp}
                                      </span>
                                      <span aria-hidden="true">·</span>
                                      <span className="font-medium text-slate-900">
                                        {log.eventType}
                                      </span>
                                      <span aria-hidden="true">·</span>
                                      <span>{log.zone}</span>
                                      <span aria-hidden="true">·</span>
                                      <span className="font-mono-tabular">
                                        {log.responseTime}
                                      </span>
                                    </div>

                                    <SecurityStatusLabel status={log.status} />
                                  </div>

                                  <p className="text-sm text-slate-700 leading-relaxed">
                                    {log.description}
                                  </p>

                                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                    <span className="text-xs text-slate-500">
                                      Resolution: {log.resolvedBy}
                                    </span>

                                    {log.status !== "Resolved" && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onResolveSecurityLog(
                                            activeResident.id,
                                            log.id
                                          )
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-[#0D6E5C] hover:text-white hover:border-[#0D6E5C] transition-colors cursor-pointer whitespace-nowrap"
                                      >
                                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                        Mark Resolved
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
