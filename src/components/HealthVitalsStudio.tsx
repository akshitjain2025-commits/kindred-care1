import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Activity, Check, Droplets, HeartPulse, Plus } from "lucide-react";
import type { ResidentProfile } from "../data/eldercareData";
import {
  computeSafetyScore,
  loadExtraVitals,
  loadMedsTakenToday,
  loadMoodForToday,
  loadMoodLog,
  saveExtraVitals,
  saveMedsTakenToday,
  saveMoodEntry,
  type LocalVital,
  type MoodEntry,
} from "../services/wellnessExtras";
import { KineticHeadline, Skiper27RollingText } from "./SkiperKineticPrimitives";
import { Perspective3DCard } from "./Motion3DPrimitives";

interface HealthVitalsStudioProps {
  resident: ResidentProfile;
}

const MOOD_FACES = ["😔", "😕", "🙂", "😊", "😄"];
const VITAL_TYPES = [
  { label: "Blood Pressure", unit: "mmHg", placeholder: "126/78" },
  { label: "Pulse", unit: "bpm", placeholder: "72" },
  { label: "SpO₂", unit: "%", placeholder: "97" },
  { label: "Weight", unit: "kg", placeholder: "68.4" },
  { label: "Glucose", unit: "mg/dL", placeholder: "104" },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

function statusFor(label: string, value: string): "Normal" | "Watch" {
  const numbers = value.split("/").map((part) => Number.parseFloat(part.trim()));
  const primary = numbers[0];
  if (Number.isNaN(primary)) return "Normal";
  if (label === "Blood Pressure") {
    const diastolic = numbers[1] ?? 0;
    return primary >= 140 || diastolic >= 90 ? "Watch" : "Normal";
  }
  if (label === "Pulse") return primary > 100 || primary < 55 ? "Watch" : "Normal";
  if (label === "SpO₂") return primary < 94 ? "Watch" : "Normal";
  if (label === "Glucose") return primary > 160 ? "Watch" : "Normal";
  return "Normal";
}

export function HealthVitalsStudio({ resident }: HealthVitalsStudioProps) {
  const prefersReducedMotion = useReducedMotion();
  const [mood, setMood] = useState<MoodEntry | null>(null);
  const [moodLog, setMoodLog] = useState<Record<string, MoodEntry>>({});
  const [extraVitals, setExtraVitals] = useState<LocalVital[]>([]);
  const [medsTaken, setMedsTaken] = useState<string[]>([]);
  const [vitalType, setVitalType] = useState(VITAL_TYPES[0]);
  const [vitalValue, setVitalValue] = useState("");
  const [energy, setEnergy] = useState(3);

  useEffect(() => {
    setMood(loadMoodForToday(resident.id));
    setMoodLog(loadMoodLog(resident.id));
    setExtraVitals(loadExtraVitals(resident.id));
    setMedsTaken(loadMedsTakenToday(resident.id));
  }, [resident.id]);

  const allVitals = useMemo(
    () => [...extraVitals, ...resident.vitals].slice(0, 6),
    [extraVitals, resident.vitals]
  );

  const safety = useMemo(
    () => computeSafetyScore(resident, null, mood),
    [resident, mood]
  );

  const adherence = resident.prescriptions.length
    ? medsTaken.filter((id) => resident.prescriptions.some((item) => item.id === id)).length /
      resident.prescriptions.length
    : 0;

  const weekMoods = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      return { key, entry: moodLog[key] ?? null, day: date.toLocaleDateString([], { weekday: "narrow" }) };
    });
  }, [moodLog]);

  const handleMood = (value: number, energyValue: number) => {
    const entry: MoodEntry = { date: todayKey(), mood: value, energy: energyValue };
    setMood(entry);
    setMoodLog(saveMoodEntry(resident.id, entry));
  };

  const handleAddVital = (event: FormEvent) => {
    event.preventDefault();
    if (!vitalValue.trim()) return;
    const reading: LocalVital = {
      id: `local-${Date.now()}`,
      label: vitalType.label,
      value: vitalValue.trim(),
      unit: vitalType.unit,
      measuredAt: `Today · ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
      status: statusFor(vitalType.label, vitalValue),
    };
    const next = [reading, ...extraVitals].slice(0, 10);
    setExtraVitals(next);
    saveExtraVitals(resident.id, next);
    setVitalValue("");
  };

  const toggleMed = (id: string) => {
    const next = medsTaken.includes(id)
      ? medsTaken.filter((item) => item !== id)
      : [...medsTaken, id];
    setMedsTaken(next);
    saveMedsTakenToday(resident.id, next);
  };

  const gaugeCircumference = 2 * Math.PI * 54;
  const gaugeOffset = gaugeCircumference * (1 - safety.score / 100);

  return (
    <section id="vitals-studio" className="py-20 border-t border-slate-200 bg-[#F8FAFC]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-medium text-[#0D6E5C] tracking-wide">
            08. Vitals, Mood & Safety
          </p>
          <KineticHeadline
            as="h2"
            text="Small daily readings that keep the whole picture honest"
            className="mt-2 text-3xl lg:text-4xl font-medium tracking-tight text-slate-900"
          />
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Log a reading, tap how the day feels, and watch the safety score, medication
            rhythm and mood strip respond instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Safety gauge */}
          <Perspective3DCard className="lg:col-span-4 h-full rounded-2xl">
            <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                Safety score
              </p>
              <div className="relative mx-auto mt-3 flex h-40 w-40 items-center justify-center">
                <svg viewBox="0 0 128 128" className="h-40 w-40 -rotate-90">
                  <circle cx="64" cy="64" r="54" fill="none" stroke="#E2E8F0" strokeWidth="10" />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="54"
                    fill="none"
                    stroke={safety.score >= 85 ? "#0D6E5C" : safety.score >= 70 ? "#D9A24A" : "#B91C1C"}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={gaugeCircumference}
                    initial={{ strokeDashoffset: gaugeCircumference }}
                    animate={{ strokeDashoffset: gaugeOffset }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 1.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-semibold text-slate-900">{safety.score}</span>
                  <span className="text-[11px] uppercase tracking-wide text-slate-500">
                    {safety.band}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{safety.factors[0]}</p>
              <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-slate-500">
                <Activity className="h-3.5 w-3.5 text-[#0D6E5C]" aria-hidden="true" />
                Recomputed from live care data
              </div>
            </div>
          </Perspective3DCard>

          {/* Mood check-in */}
          <Perspective3DCard className="lg:col-span-4 h-full rounded-2xl">
            <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                Mood &amp; energy check-in
              </p>
              <div className="mt-4 flex items-center justify-between gap-1.5">
                {MOOD_FACES.map((face, index) => {
                  const value = index + 1;
                  const isActive = mood?.mood === value;
                  return (
                    <motion.button
                      key={face}
                      type="button"
                      aria-label={`Mood ${value} of 5`}
                      onClick={() => handleMood(value, energy)}
                      whileHover={prefersReducedMotion ? undefined : { y: -4, scale: 1.06 }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.93 }}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl transition-colors ${
                        isActive
                          ? "border-[#0D6E5C]/40 bg-[#0D6E5C]/10"
                          : "border-slate-200 bg-slate-50 hover:border-[#0D6E5C]/30"
                      }`}
                    >
                      {face}
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-slate-500">Energy</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      aria-label={`Energy ${level} of 5`}
                      onClick={() => {
                        setEnergy(level);
                        if (mood) handleMood(mood.mood, level);
                      }}
                      className={`h-2.5 w-6 rounded-full transition-colors ${
                        level <= energy ? "bg-[#0D6E5C]" : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between gap-1">
                {weekMoods.map((day) => (
                  <div key={day.key} className="flex flex-1 flex-col items-center gap-1">
                    <motion.div
                      className={`w-full rounded-t-md ${
                        day.entry ? "bg-[#0D6E5C]" : "bg-slate-200"
                      }`}
                      initial={{ height: 4 }}
                      animate={{ height: day.entry ? 10 + day.entry.mood * 8 : 6 }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
                    />
                    <span className="text-[10px] text-slate-400">{day.day}</span>
                  </div>
                ))}
              </div>
              <p className="mt-auto pt-4 text-xs text-slate-500">
                {mood
                  ? `Logged today · mood ${mood.mood}/5, energy ${mood.energy}/5`
                  : "One tap records today's mood"}
              </p>
            </div>
          </Perspective3DCard>

          {/* Vitals logger */}
          <Perspective3DCard className="lg:col-span-4 h-full rounded-2xl">
            <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                Log a reading
              </p>
              <form onSubmit={handleAddVital} className="mt-3 space-y-2">
                <select
                  value={vitalType.label}
                  onChange={(event) => {
                    const next = VITAL_TYPES.find((item) => item.label === event.target.value);
                    if (next) setVitalType(next);
                  }}
                  aria-label="Vital type"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0D6E5C]/50"
                >
                  {VITAL_TYPES.map((type) => (
                    <option key={type.label} value={type.label}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    value={vitalValue}
                    onChange={(event) => setVitalValue(event.target.value)}
                    placeholder={vitalType.placeholder}
                    aria-label={`${vitalType.label} value`}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0D6E5C]/50"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-lg bg-[#0D6E5C] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#095547]"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    Add
                  </button>
                </div>
              </form>

              <ul className="mt-4 space-y-2">
                {allVitals.slice(0, 4).map((reading) => (
                  <li
                    key={reading.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/70 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-slate-800">{reading.label}</p>
                      <p className="text-[10px] text-slate-500">{reading.measuredAt}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {reading.value}
                        <span className="ml-0.5 text-[10px] font-normal text-slate-500">
                          {reading.unit}
                        </span>
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          reading.status === "Watch"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        {reading.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Perspective3DCard>

          {/* Medication timeline */}
          <div className="lg:col-span-12 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                  Today&apos;s medication rhythm
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {resident.prescriptions.length - medsTaken.length} of{" "}
                  {resident.prescriptions.length} still to take
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Droplets className="h-3.5 w-3.5 text-[#0D6E5C]" aria-hidden="true" />
                Adherence {Math.round(adherence * 100)}%
              </div>
            </div>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-[#0D6E5C]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(adherence * 100)}%` }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              {resident.prescriptions.map((item, index) => {
                const taken = medsTaken.includes(item.id);
                return (
                  <motion.li
                    key={item.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                    className={`rounded-xl border px-4 py-3 transition-colors ${
                      taken ? "border-[#0D6E5C]/30 bg-[#0D6E5C]/[0.05]" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{item.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.dosage} · {item.timing}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {item.daysRemaining} days left
                          {item.refillRequested ? " · refill requested" : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleMed(item.id)}
                        aria-pressed={taken}
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          taken
                            ? "bg-[#0D6E5C] text-white"
                            : "border border-slate-200 text-slate-600 hover:border-[#0D6E5C]/40 hover:text-[#0D6E5C]"
                        }`}
                      >
                        {taken ? <Check className="h-3 w-3" aria-hidden="true" /> : <HeartPulse className="h-3 w-3" aria-hidden="true" />}
                        {taken ? "Taken" : "Mark taken"}
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
