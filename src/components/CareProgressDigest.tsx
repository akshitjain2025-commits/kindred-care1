import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Award, Check, ClipboardList, TrendingUp } from "lucide-react";
import type { ResidentProfile } from "../data/eldercareData";
import {
  buildWeeklyReport,
  computeBadges,
  loadMedsTakenToday,
  loadMoodLog,
  loadMoodForToday,
  loadPrepChecklist,
  PREP_ITEMS,
  savePrepChecklist,
} from "../services/wellnessExtras";
import { KineticHeadline } from "./SkiperKineticPrimitives";
import { Perspective3DCard } from "./Motion3DPrimitives";

interface CareProgressDigestProps {
  resident: ResidentProfile;
}

const countKey = (residentId: string, prefix: string) => {
  try {
    const raw = window.localStorage.getItem(`${prefix}_${residentId}`);
    if (!raw) return 0;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
};

export function CareProgressDigest({ resident }: CareProgressDigestProps) {
  const prefersReducedMotion = useReducedMotion();
  const [prepDone, setPrepDone] = useState<string[]>([]);
  const [sleepEntries, setSleepEntries] = useState(0);
  const [cognitiveSessions, setCognitiveSessions] = useState(0);
  const [moodEntries, setMoodEntries] = useState(0);
  const [adherence, setAdherence] = useState(0);

  useEffect(() => {
    setPrepDone(loadPrepChecklist(resident.id));
    setSleepEntries(countKey(resident.id, "kindred_sleep_journal"));
    setCognitiveSessions(countKey(resident.id, "kindred_cognitive_sessions"));
    setMoodEntries(Object.keys(loadMoodLog(resident.id)).length);
    const taken = loadMedsTakenToday(resident.id).filter((id) =>
      resident.prescriptions.some((item) => item.id === id)
    ).length;
    setAdherence(
      resident.prescriptions.length ? taken / resident.prescriptions.length : 0
    );
  }, [resident]);

  const report = useMemo(
    () => buildWeeklyReport(resident, null, loadMoodForToday(resident.id)),
    [resident]
  );

  const badges = useMemo(
    () =>
      computeBadges(resident, {
        sleepEntries,
        cognitiveSessions,
        moodEntries,
        adherence,
      }),
    [resident, sleepEntries, cognitiveSessions, moodEntries, adherence]
  );

  const bars = [
    { label: "Sleep quality", value: report.sleep },
    { label: "Movement", value: report.activity },
    { label: "Hydration", value: report.hydration },
    { label: "Safety", value: report.safety.score },
    { label: "Tasks closed", value: report.taskPct },
  ];

  const prepPercent = Math.round((prepDone.length / PREP_ITEMS.length) * 100);

  const togglePrep = (id: string) => {
    const next = prepDone.includes(id)
      ? prepDone.filter((item) => item !== id)
      : [...prepDone, id];
    setPrepDone(next);
    savePrepChecklist(resident.id, next);
  };

  return (
    <section id="care-digest" className="py-20 border-t border-slate-200 bg-[#F8FAFC]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-medium text-[#0D6E5C] tracking-wide">
            09. Progress &amp; Preparation
          </p>
          <KineticHeadline
            as="h2"
            text="A week of small signals, turned into a decision you can share"
            className="mt-2 text-3xl lg:text-4xl font-medium tracking-tight text-slate-900"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Weekly report */}
          <Perspective3DCard className="lg:col-span-5 rounded-2xl">
            <div className="h-full rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                  Weekly rhythm
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#0D6E5C]/10 px-2.5 py-1 text-[11px] font-medium text-[#0D6E5C]">
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  {report.overall}/100
                </span>
              </div>
              <ul className="mt-5 space-y-3.5">
                {bars.map((bar, index) => (
                  <li key={bar.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700">{bar.label}</span>
                      <span className="font-mono-tabular text-slate-500">{bar.value}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        className="h-full rounded-full bg-[#0D6E5C]"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${bar.value}%` }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{
                          duration: prefersReducedMotion ? 0 : 0.8,
                          delay: index * 0.08,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                {report.openTasks} open task{report.openTasks === 1 ? "" : "s"} ·{" "}
                {report.completedTasks} closed · safety {report.safety.band.toLowerCase()}
              </p>
            </div>
          </Perspective3DCard>

          {/* Badges */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              <Award className="h-3.5 w-3.5 text-[#0D6E5C]" aria-hidden="true" />
              Earned this week
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {badges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  whileHover={prefersReducedMotion ? undefined : { y: -4, scale: 1.02 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={`rounded-xl border px-3 py-3 ${
                    badge.earned
                      ? "border-[#0D6E5C]/30 bg-[#0D6E5C]/[0.06]"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-900">{badge.label}</p>
                    {badge.earned && <Check className="h-3.5 w-3.5 text-[#0D6E5C]" aria-hidden="true" />}
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{badge.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Doctor prep checklist */}
          <div className="lg:col-span-12 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                <ClipboardList className="h-3.5 w-3.5 text-[#0D6E5C]" aria-hidden="true" />
                Doctor visit prep
              </div>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-[#0D6E5C]"
                    animate={{ width: `${prepPercent}%` }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
                  />
                </div>
                <span className="text-xs text-slate-600">
                  {prepDone.length}/{PREP_ITEMS.length}
                </span>
              </div>
            </div>

            <ul className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
              {PREP_ITEMS.map((item) => {
                const done = prepDone.includes(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => togglePrep(item.id)}
                      aria-pressed={done}
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 text-left transition-colors hover:border-[#0D6E5C]/35"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                          done
                            ? "border-[#0D6E5C] bg-[#0D6E5C] text-white"
                            : "border-slate-300 bg-white text-transparent"
                        }`}
                      >
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </span>
                      <span
                        className={`text-xs ${done ? "text-slate-500 line-through" : "text-slate-700"}`}
                      >
                        {item.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
