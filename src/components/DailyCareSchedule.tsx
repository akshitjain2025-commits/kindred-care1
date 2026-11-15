import { useMemo, useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  BellRing,
  Check,
  Clock,
  Moon,
  Plus,
  Repeat,
  Sun,
  Sunrise,
} from "lucide-react";
import type { CareTaskItem, ResidentProfile } from "../data/eldercareData";
import {
  findApproachingMedicationTasks,
  getNextPendingMedicationTask,
  type NotificationChannel,
} from "../services/medicationNotifications";

interface DailyCareScheduleProps {
  resident: ResidentProfile;
  onToggleTask: (residentId: string, taskId: string) => void;
  onAddTask: (
    residentId: string,
    task: Omit<CareTaskItem, "id" | "completed">
  ) => void;
  autoMedReminders: boolean;
  onToggleAutoMedReminders: () => void;
  reminderChannel: NotificationChannel;
  onChangeReminderChannel: (channel: NotificationChannel) => void;
  onTriggerMedicationReminder: () => void;
  lastMedReminderSentAt?: string | null;
}

type DayPeriod = "all" | "morning" | "afternoon" | "evening";

function parseTimeMinutes(timeStr: string): number {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 720;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function getPeriodFromTime(timeStr: string): Exclude<DayPeriod, "all"> {
  const mins = parseTimeMinutes(timeStr);
  if (mins < 12 * 60) return "morning";
  if (mins < 17 * 60) return "afternoon";
  return "evening";
}

function PeriodIcon({ period }: { period: Exclude<DayPeriod, "all"> }) {
  if (period === "morning") {
    return <Sunrise className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />;
  }
  if (period === "afternoon") {
    return <Sun className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />;
  }
  return <Moon className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />;
}

const RECURRING_PRESETS: Array<Omit<CareTaskItem, "id" | "completed">> = [
  {
    time: "09:15 AM",
    title: "Morning courtyard walk",
    detail: "15–20 minute outdoor stroll with walking support",
    category: "Mobility",
  },
  {
    time: "03:30 PM",
    title: "Afternoon hydration tea break",
    detail: "Herbal tea and light stretching by sunroom window",
    category: "Hydration",
  },
  {
    time: "08:00 PM",
    title: "Evening reading routine",
    detail: "Large-print book or audiobook before quiet hours",
    category: "Family",
  },
];

export function DailyCareSchedule({
  resident,
  onToggleTask,
  onAddTask,
  autoMedReminders,
  onToggleAutoMedReminders,
  reminderChannel,
  onChangeReminderChannel,
  onTriggerMedicationReminder,
  lastMedReminderSentAt,
}: DailyCareScheduleProps) {
  const prefersReducedMotion = useReducedMotion();
  const [periodFilter, setPeriodFilter] = useState<DayPeriod>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTime, setNewTime] = useState("08:30 PM");
  const [newTitle, setNewTitle] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [newCategory, setNewCategory] =
    useState<CareTaskItem["category"]>("Mobility");

  const sortedTasks = useMemo(() => {
    return [...resident.tasks]
      .sort((a, b) => parseTimeMinutes(a.time) - parseTimeMinutes(b.time))
      .filter((task) => {
        if (periodFilter === "all") return true;
        return getPeriodFromTime(task.time) === periodFilter;
      });
  }, [resident.tasks, periodFilter]);

  const completedTotal = resident.tasks.filter((t) => t.completed).length;
  const totalTasks = resident.tasks.length;
  const progressPct = Math.round(
    (completedTotal / Math.max(1, totalTasks)) * 100
  );

  const approachingMeds = findApproachingMedicationTasks(resident);
  const nextMed = approachingMeds[0] || getNextPendingMedicationTask(resident);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(resident.id, {
      time: newTime.trim() || "07:30 PM",
      title: newTitle.trim(),
      detail: newDetail.trim() || "Recurring daily care routine",
      category: newCategory,
    });
    setNewTitle("");
    setNewDetail("");
    setShowAddForm(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      {/* Header & Progress Bar */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-medium text-slate-900">
              Daily Care Schedule &amp; Visual Timeline
            </h4>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Upcoming visit: {resident.upcomingVisit}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100"
            role="group"
            aria-label="Filter timeline by time of day"
          >
            {(
              [
                { id: "all", label: "All Day" },
                { id: "morning", label: "Morning" },
                { id: "afternoon", label: "Afternoon" },
                { id: "evening", label: "Evening" },
              ] as { id: DayPeriod; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriodFilter(opt.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  periodFilter === opt.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
            Add Task
          </button>
        </div>
      </div>

      {/* Day Rhythm Completion Bar */}
      <div className="mb-6 rounded-xl border border-slate-100 bg-[#F8FAFC] px-4 py-3">
        <div className="flex items-center justify-between gap-3 text-xs mb-2">
          <span className="font-medium text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
            Daily Routine Progress
          </span>
          <span className="font-mono-tabular font-semibold text-[#0D6E5C]">
            {completedTotal} / {totalTasks} completed ({progressPct}%)
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
            }
            className="h-full rounded-full bg-[#0D6E5C]"
          />
        </div>
      </div>

      {/* Automated Personalized Medication Notification Trigger */}
      <div className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <BellRing
            className="w-4 h-4 text-amber-700 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900">
              {approachingMeds.length > 0
                ? `Approaching Dose: ${approachingMeds[0].task.title} (${approachingMeds[0].task.time})`
                : nextMed
                  ? `Next Medication Cue: ${nextMed.task.title} (${nextMed.task.time})`
                  : "All scheduled medication doses completed"}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Automated personalized SMS &amp; push trigger for{" "}
              {resident.name.split(" ")[0]}
              {resident.patientPhone ? ` (${resident.patientPhone})` : ""}
              {lastMedReminderSentAt ? ` · Last cue ${lastMedReminderSentAt}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            value={reminderChannel}
            onChange={(e) =>
              onChangeReminderChannel(e.target.value as NotificationChannel)
            }
            aria-label="Medication notification channel"
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
          >
            <option value="both">Push + SMS</option>
            <option value="push">In-App Push</option>
            <option value="sms">SMS Only</option>
          </select>
          <button
            type="button"
            onClick={onToggleAutoMedReminders}
            aria-pressed={autoMedReminders}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              autoMedReminders
                ? "bg-[#0D6E5C] text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            {autoMedReminders ? "Auto-Trigger On" : "Auto-Trigger Off"}
          </button>
          <button
            type="button"
            disabled={!nextMed}
            onClick={onTriggerMedicationReminder}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-50 disabled:opacity-45 transition-colors cursor-pointer whitespace-nowrap"
          >
            Send Cue Now
          </button>
        </div>
      </div>

      {/* Inline Add Recurring Task Panel */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-800">
              Add Recurring Daily Task
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {RECURRING_PRESETS.map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => {
                    setNewTime(preset.time);
                    setNewTitle(preset.title);
                    setNewDetail(preset.detail);
                    setNewCategory(preset.category);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-[#0D6E5C] hover:text-[#0D6E5C] cursor-pointer whitespace-nowrap"
                >
                  + {preset.title}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <input
              type="text"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              placeholder="08:00 PM"
              aria-label="Scheduled time"
              className="sm:col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono-tabular text-slate-900"
            />
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title (e.g. Evening reading)"
              aria-label="Task title"
              className="sm:col-span-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
            <input
              type="text"
              value={newDetail}
              onChange={(e) => setNewDetail(e.target.value)}
              placeholder="Short care note"
              aria-label="Task detail"
              className="sm:col-span-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
            <select
              value={newCategory}
              onChange={(e) =>
                setNewCategory(e.target.value as CareTaskItem["category"])
              }
              aria-label="Task category"
              className="sm:col-span-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900"
            >
              <option value="Mobility">Mobility</option>
              <option value="Medication">Medication</option>
              <option value="Hydration">Hydration</option>
              <option value="Family">Family</option>
            </select>
            <button
              type="submit"
              className="sm:col-span-1 rounded-xl bg-[#0D6E5C] text-white px-3 py-2 text-xs font-medium hover:bg-[#095547] cursor-pointer whitespace-nowrap"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {/* Visual Chronological Timeline */}
      {sortedTasks.length === 0 ? (
        <div className="py-10 text-center border-t border-slate-100">
          <p className="text-sm font-medium text-slate-700">
            No scheduled items in this time window
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Switch to All Day or add a recurring care routine above.
          </p>
        </div>
      ) : (
        <ol className="relative pl-6 space-y-4">
          {/* Vertical Spine */}
          <div
            aria-hidden="true"
            className="absolute left-[11px] top-3 bottom-3 w-px bg-slate-200"
          />

          {sortedTasks.map((task) => {
            const period = getPeriodFromTime(task.time);
            return (
              <li key={task.id} className="relative">
                {/* Timeline Status Marker */}
                <button
                  type="button"
                  onClick={() => onToggleTask(resident.id, task.id)}
                  aria-label={
                    task.completed
                      ? `Mark ${task.title} incomplete`
                      : `Mark ${task.title} completed`
                  }
                  className={`absolute -left-6 top-3.5 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${
                    task.completed
                      ? "bg-[#0D6E5C] border-[#0D6E5C] text-white"
                      : "bg-white border-slate-300 text-transparent hover:border-[#0D6E5C]"
                  }`}
                >
                  <Check className="w-3 h-3" aria-hidden="true" />
                </button>

                {/* Interactive Timeline Row */}
                <button
                  type="button"
                  onClick={() => onToggleTask(resident.id, task.id)}
                  className={`w-full min-h-[56px] text-left rounded-xl border px-4 py-3 transition-colors cursor-pointer ${
                    task.completed
                      ? "border-slate-200 bg-slate-50/70"
                      : "border-slate-200 bg-white hover:bg-emerald-50/30 hover:border-emerald-200"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1 font-mono-tabular font-semibold text-slate-700">
                        <PeriodIcon period={period} />
                        {task.time}
                      </span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-medium text-[#0D6E5C]">
                        {task.category}
                      </span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Repeat className="w-3 h-3" aria-hidden="true" />
                        Daily
                      </span>
                    </div>

                    <span
                      className={`text-xs font-medium ${
                        task.completed ? "text-[#0D6E5C]" : "text-slate-500"
                      }`}
                    >
                      {task.completed ? "Completed" : "Tap to complete"}
                    </span>
                  </div>

                  <p
                    className={`mt-1 text-sm font-medium ${
                      task.completed
                        ? "text-slate-500 line-through"
                        : "text-slate-900"
                    }`}
                  >
                    {task.title}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {task.detail}
                  </p>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
