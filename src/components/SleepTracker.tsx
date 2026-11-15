import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  BedDouble,
  Check,
  MoonStar,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ResidentProfile } from "../data/eldercareData";
import { RollingActionLabel, Skiper27RollingText } from "./SkiperKineticPrimitives";

const QUALITY_LABELS = ["Poor", "Restless", "Fair", "Good", "Restful"];

export interface SleepEntry {
  id: string;
  day: string;
  hours: number;
  quality: number;
  caregiver: string;
  note?: string;
}

export interface SleepLogInput {
  hours: number;
  quality: number;
}

interface SleepTrackerProps {
  resident: ResidentProfile;
  onLogSleep: (residentId: string, entry: SleepLogInput) => void;
}

/**
 * Seed the sleep journal from the resident's stored wellness history so the
 * trend chart is meaningful before a caregiver logs anything by hand.
 */
function seedEntries(resident: ResidentProfile): SleepEntry[] {
  return resident.wellnessHistory.map((point, idx) => {
    const score = Math.max(20, Math.min(100, point.sleepScore));
    const hours = Math.round((4 + (score / 100) * 4) * 10) / 10;
    const quality = Math.max(1, Math.min(5, Math.round(score / 20)));
    return {
      id: `sleep-${resident.id}-${idx}`,
      day: point.day,
      hours,
      quality,
      caregiver: "Millimeter-wave rest sensing",
    };
  });
}

function journalKey(residentId: string): string {
  return `kindred_sleep_journal_${residentId}`;
}

function readJournal(residentId: string, fallback: SleepEntry[]): SleepEntry[] {
  try {
    const raw = window.localStorage.getItem(journalKey(residentId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as SleepEntry[];
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback;
    return parsed.filter((entry) => typeof entry?.hours === "number");
  } catch {
    return fallback;
  }
}

function writeJournal(residentId: string, entries: SleepEntry[]): void {
  try {
    window.localStorage.setItem(journalKey(residentId), JSON.stringify(entries));
  } catch {
    // Ignore storage errors; the in-memory journal still works.
  }
}

export function SleepTracker({ resident, onLogSleep }: SleepTrackerProps) {
  const prefersReducedMotion = useReducedMotion();
  const [entries, setEntries] = useState<SleepEntry[]>(() =>
    readJournal(resident.id, seedEntries(resident))
  );
  const [hours, setHours] = useState("7.5");
  const [quality, setQuality] = useState(4);
  const [caregiver, setCaregiver] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setEntries(readJournal(resident.id, seedEntries(resident)));
    setSavedAt(null);
    setError("");
  }, [resident.id]);

  useEffect(() => {
    writeJournal(resident.id, entries);
  }, [resident.id, entries]);

  const chartData = useMemo(
    () => entries.slice(-7).map((entry) => ({ ...entry })),
    [entries]
  );

  const lastNight = entries[entries.length - 1];
  const previousNight = entries[entries.length - 2];
  const hoursDelta = lastNight && previousNight ? lastNight.hours - previousNight.hours : 0;
  const averageHours = chartData.length
    ? Math.round(
        (chartData.reduce((sum, entry) => sum + entry.hours, 0) / chartData.length) * 10
      ) / 10
    : 0;
  const averageQuality = chartData.length
    ? Math.round(
        (chartData.reduce((sum, entry) => sum + entry.quality, 0) / chartData.length) * 10
      ) / 10
    : 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsedHours = Number.parseFloat(hours);
    if (!Number.isFinite(parsedHours) || parsedHours <= 0 || parsedHours > 14) {
      setError("Enter a sleep duration between 0.5 and 14 hours.");
      return;
    }

    setError("");
    const today = entries[entries.length - 1]?.day || "Today";
    const entry: SleepEntry = {
      id: `sleep-log-${Date.now()}`,
      day: today,
      hours: Math.round(parsedHours * 10) / 10,
      quality,
      caregiver: caregiver.trim() || "Caregiver",
      note: note.trim() || undefined,
    };

    setEntries((prev) => {
      const withoutToday = prev.slice(0, -1);
      return [...withoutToday, entry];
    });
    onLogSleep(resident.id, { hours: entry.hours, quality });
    setSavedAt(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
    setNote("");
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 flex flex-col gap-6 h-full">
      <div>
        <p className="text-xs font-medium text-[#0D6E5C] tracking-wide">
          Nightly Rest Journal
        </p>
        <Skiper27RollingText
          as="h3"
          text="Sleep duration & quality trends"
          className="mt-1 text-2xl font-medium tracking-tight text-slate-900 text-balance"
        />
        <p className="mt-1.5 text-sm text-slate-600">
          Log how {resident.name.split(" ")[0]} slept. Every entry feeds the
          seven-night trend and the shared wellness history.
        </p>
      </div>

      {/* Last Night + Averages */}
      <div className="grid grid-cols-3 gap-4 pb-5 border-b border-slate-100">
        <div>
          <p className="text-xs text-slate-500">Last Night</p>
          <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[#0D6E5C]">
            {lastNight ? `${lastNight.hours}h` : "—"}
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
            {hoursDelta === 0 ? (
              <Sparkles className="w-3 h-3" aria-hidden="true" />
            ) : hoursDelta > 0 ? (
              <TrendingUp className="w-3 h-3 text-[#0D6E5C]" aria-hidden="true" />
            ) : (
              <TrendingDown className="w-3 h-3 text-amber-600" aria-hidden="true" />
            )}
            <span className="font-mono-tabular">
              {hoursDelta > 0 ? "+" : ""}
              {Math.round(hoursDelta * 10) / 10}h vs prior
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">7-Night Average</p>
          <p className="mt-1 font-mono-tabular text-2xl font-semibold text-slate-900">
            {averageHours}h
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Rest duration</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Quality</p>
          <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[#1D4ED8]">
            {averageQuality}/5
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Caregiver rated</p>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="w-full h-[210px]" aria-label="Sleep trend chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 6, right: 4, left: -24, bottom: 0 }}
          >
            <defs>
              <linearGradient id="sleepHoursGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D6E5C" stopOpacity={0.75} />
                <stop offset="95%" stopColor="#0D6E5C" stopOpacity={0.28} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="hours"
              domain={[0, 12]}
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="quality"
              orientation="right"
              domain={[0, 5]}
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value, name) =>
                name === "Hours" ? [`${value}h`, "Sleep"] : [`${value}/5`, "Quality"]
              }
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #E2E8F0",
                fontSize: 12,
              }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
            />
            <Bar
              yAxisId="hours"
              dataKey="hours"
              name="Hours"
              fill="url(#sleepHoursGrad)"
              radius={[6, 6, 0, 0]}
              maxBarSize={34}
            />
            <Line
              yAxisId="quality"
              type="monotone"
              dataKey="quality"
              name="Quality"
              stroke="#1D4ED8"
              strokeWidth={2}
              dot={{ r: 3, fill: "#1D4ED8" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Caregiver Log Form */}
      <form onSubmit={handleSubmit} className="pt-5 border-t border-slate-100 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">
              Sleep duration (hours)
            </span>
            <input
              type="number"
              min="0.5"
              max="14"
              step="0.1"
              value={hours}
              onChange={(event) => setHours(event.target.value)}
              aria-label="Sleep duration in hours"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D6E5C]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">
              Logged by caregiver
            </span>
            <input
              type="text"
              value={caregiver}
              onChange={(event) => setCaregiver(event.target.value)}
              placeholder="e.g. Clara Pendelton"
              aria-label="Caregiver name"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D6E5C]"
            />
          </label>
        </div>

        <fieldset>
          <legend className="text-xs font-medium text-slate-600">Sleep quality</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {QUALITY_LABELS.map((label, idx) => {
              const value = idx + 1;
              const selected = quality === value;
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setQuality(value)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    selected
                      ? "border-[#0D6E5C] bg-emerald-50 text-[#0D6E5C]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {selected && <Check className="w-3 h-3" aria-hidden="true" />}
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-xs font-medium text-slate-600">
            Observation (optional)
          </span>
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Woke twice for the bathroom, settled again quickly…"
            aria-label="Sleep observation"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D6E5C]"
          />
        </label>

        {error && <p className="text-xs text-rose-700">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500 inline-flex items-center gap-1.5">
            <BedDouble className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
            {savedAt
              ? `Saved to wellness history at ${savedAt}`
              : "Adds tonight's entry to the resident's wellness history"}
          </p>
          <button
            type="submit"
            className="group inline-flex items-center gap-1.5 rounded-xl bg-[#0F2922] text-white px-4 py-2 text-xs font-medium hover:bg-[#163b31] transition-colors cursor-pointer whitespace-nowrap"
          >
            <MoonStar className="w-3.5 h-3.5" aria-hidden="true" />
            <RollingActionLabel label="Log Sleep" />
          </button>
        </div>
      </form>

      {/* Recent Entries with Skiper27 card entry animation */}
      <div className="pt-5 border-t border-slate-100">
        <p className="text-xs font-medium text-slate-600 mb-2">Recent nights</p>
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {entries
              .slice(-4)
              .reverse()
              .map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, rotateX: -18, y: 10 }
                  }
                  animate={{ opacity: 1, rotateX: 0, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{
                    duration: 0.34,
                    delay: prefersReducedMotion ? 0 : idx * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {entry.day} · {entry.hours}h
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {entry.caregiver}
                      {entry.note ? ` — ${entry.note}` : ""}
                    </p>
                  </div>
                  <span className="font-mono-tabular text-xs font-semibold text-[#1D4ED8] whitespace-nowrap">
                    {QUALITY_LABELS[entry.quality - 1]}
                  </span>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
