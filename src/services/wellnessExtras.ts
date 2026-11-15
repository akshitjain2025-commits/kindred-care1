import type { ResidentProfile } from "../data/eldercareData";

export interface MoodEntry {
  date: string;
  mood: number;
  energy: number;
}

export interface LocalVital {
  id: string;
  label: string;
  value: string;
  unit: string;
  measuredAt: string;
  status: "Normal" | "Watch";
}

export interface FamilyBoardNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface SafetyScore {
  score: number;
  band: "Steady" | "Watchful" | "Needs attention";
  factors: string[];
}

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is best effort; the UI keeps working in memory.
  }
};

const todayKey = () => new Date().toISOString().slice(0, 10);

export const moodStorageKey = (residentId: string) => `kindred_mood_${residentId}`;
export const vitalsStorageKey = (residentId: string) => `kindred_vitals_${residentId}`;
export const medLogStorageKey = (residentId: string) => `kindred_medlog_${residentId}`;
export const boardStorageKey = (residentId: string) => `kindred_board_${residentId}`;
export const checklistStorageKey = (residentId: string) => `kindred_prep_${residentId}`;

export const loadMoodLog = (residentId: string) =>
  readJson<Record<string, MoodEntry>>(moodStorageKey(residentId), {});

export const loadMoodForToday = (residentId: string): MoodEntry | null =>
  loadMoodLog(residentId)[todayKey()] ?? null;

export const saveMoodEntry = (residentId: string, entry: MoodEntry) => {
  const log = { ...loadMoodLog(residentId), [entry.date]: entry };
  writeJson(moodStorageKey(residentId), log);
  return log;
};

export const loadExtraVitals = (residentId: string) =>
  readJson<LocalVital[]>(vitalsStorageKey(residentId), []);

export const saveExtraVitals = (residentId: string, readings: LocalVital[]) =>
  writeJson(vitalsStorageKey(residentId), readings);

export const loadMedLog = (residentId: string) =>
  readJson<Record<string, string[]>>(medLogStorageKey(residentId), {});

export const loadMedsTakenToday = (residentId: string): string[] =>
  loadMedLog(residentId)[todayKey()] ?? [];

export const saveMedsTakenToday = (residentId: string, ids: string[]) => {
  const log = { ...loadMedLog(residentId), [todayKey()]: ids };
  writeJson(medLogStorageKey(residentId), log);
};

export const loadBoardNotes = (residentId: string) =>
  readJson<FamilyBoardNote[]>(boardStorageKey(residentId), []);

export const saveBoardNotes = (residentId: string, notes: FamilyBoardNote[]) =>
  writeJson(boardStorageKey(residentId), notes);

export const loadPrepChecklist = (residentId: string) =>
  readJson<string[]>(checklistStorageKey(residentId), []);

export const savePrepChecklist = (residentId: string, ids: string[]) =>
  writeJson(checklistStorageKey(residentId), ids);

export const PREP_ITEMS = [
  { id: "prep-meds", label: "Bring the current medication list and refill dates" },
  { id: "prep-vitals", label: "Print the last two weeks of vitals" },
  { id: "prep-sleep", label: "Note sleep and appetite changes since the last visit" },
  { id: "prep-questions", label: "Write the three questions that matter most" },
  { id: "prep-transport", label: "Confirm transport and who is accompanying" },
  { id: "prep-insurance", label: "Have insurance card and photo ID ready" },
];

export function computeSafetyScore(
  resident: ResidentProfile,
  sleepHours: number | null,
  mood: MoodEntry | null
): SafetyScore {
  const factors: string[] = [];
  let score = 100;

  const hydrationRatio = resident.hydrationTarget
    ? resident.hydrationGlasses / resident.hydrationTarget
    : 1;
  if (hydrationRatio < 0.6) {
    score -= 12;
    factors.push("Hydration is well below target today.");
  } else if (hydrationRatio < 1) {
    score -= 5;
    factors.push("Hydration is slightly behind target.");
  }

  const openTasks = resident.tasks.filter((task) => !task.completed).length;
  if (openTasks > 4) {
    score -= 10;
    factors.push(`${openTasks} care tasks are still open today.`);
  } else if (openTasks > 0) {
    score -= 4;
    factors.push(`${openTasks} care task${openTasks > 1 ? "s" : ""} still open.`);
  }

  const unresolved = resident.securityLogs.filter((log) => log.status !== "Resolved").length;
  if (unresolved > 0) {
    score -= 8;
    factors.push(`${unresolved} sensor event${unresolved > 1 ? "s" : ""} not yet resolved.`);
  }

  const recentSleep = resident.wellnessHistory.slice(-3);
  const sleepAverage = recentSleep.length
    ? recentSleep.reduce((sum, day) => sum + day.sleepScore, 0) / recentSleep.length
    : 75;
  if (sleepAverage < 55) {
    score -= 12;
    factors.push("Three-night sleep average is low.");
  } else if (sleepAverage < 70) {
    score -= 5;
    factors.push("Sleep is a little below the usual rhythm.");
  }

  if (sleepHours !== null && sleepHours < 6) {
    score -= 10;
    factors.push("Last logged night was under six hours.");
  }

  const refills = resident.prescriptions.filter((item) => item.refillRequested).length;
  if (refills > 0) {
    score -= 6;
    factors.push(`${refills} prescription refill still pending.`);
  }

  if (mood && mood.mood <= 2) {
    score -= 7;
    factors.push("Mood check-in was low today.");
  }

  const clamped = Math.max(35, Math.min(100, Math.round(score)));
  const band: SafetyScore["band"] =
    clamped >= 85 ? "Steady" : clamped >= 70 ? "Watchful" : "Needs attention";

  if (!factors.length) {
    factors.push("Vitals, hydration, tasks and sensor log are all inside their usual range.");
  }

  return { score: clamped, band, factors };
}

export function buildWeeklyReport(
  resident: ResidentProfile,
  sleepHours: number | null,
  mood: MoodEntry | null
) {
  const week = resident.wellnessHistory.slice(-7);
  const average = (values: number[]) =>
    values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

  const hydrationPct = resident.hydrationTarget
    ? Math.min(100, Math.round((resident.hydrationGlasses / resident.hydrationTarget) * 100))
    : 0;
  const completedTasks = resident.tasks.filter((task) => task.completed).length;
  const taskPct = resident.tasks.length
    ? Math.round((completedTasks / resident.tasks.length) * 100)
    : 0;

  const sleep = average(week.map((day) => day.sleepScore));
  const activity = average(week.map((day) => day.activityScore));
  const hydration = average(week.map((day) => day.hydrationScore));
  const safety = computeSafetyScore(resident, sleepHours, mood);

  return {
    sleep,
    activity,
    hydration,
    hydrationPct,
    taskPct,
    completedTasks,
    openTasks: resident.tasks.length - completedTasks,
    safety,
    overall: Math.round((sleep + activity + hydration + safety.score + taskPct) / 5),
  };
}

export function buildHandoffText(
  resident: ResidentProfile,
  sleepHours: number | null,
  mood: MoodEntry | null
) {
  const openTasks = resident.tasks.filter((task) => !task.completed);
  const report = buildWeeklyReport(resident, sleepHours, mood);
  return [
    `Kindred Care handoff · ${resident.name}`,
    new Date().toLocaleString(),
    "",
    `Safety score ${report.safety.score}/100 (${report.safety.band}). Weekly rhythm: sleep ${report.sleep}, activity ${report.activity}, hydration ${report.hydration}.`,
    sleepHours ? `Last night: ${sleepHours.toFixed(1)} hours.` : "No night logged in the sleep journal.",
    mood ? `Mood today ${mood.mood}/5, energy ${mood.energy}/5.` : "No mood check-in today.",
    "",
    openTasks.length
      ? `Still open: ${openTasks.map((task) => `${task.time} ${task.title}`).join("; ")}.`
      : "All scheduled care tasks are closed out.",
    resident.hydrationGlasses < resident.hydrationTarget
      ? `Hydration ${resident.hydrationGlasses}/${resident.hydrationTarget} glasses.`
      : "Hydration target reached.",
    resident.prescriptions.filter((item) => item.refillRequested).length
      ? `Refills pending: ${resident.prescriptions
          .filter((item) => item.refillRequested)
          .map((item) => item.name)
          .join(", ")}.`
      : "No refills pending.",
    "",
    `Next visit: ${resident.upcomingVisit}`,
    report.safety.factors[0] ? `Watch: ${report.safety.factors[0]}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function computeBadges(
  resident: ResidentProfile,
  extras: { sleepEntries: number; cognitiveSessions: number; moodEntries: number; adherence: number }
) {
  return [
    {
      id: "badge-hydration",
      label: "Hydration streak",
      detail: `${resident.hydrationGlasses}/${resident.hydrationTarget} glasses today`,
      earned: resident.hydrationGlasses >= resident.hydrationTarget,
    },
    {
      id: "badge-sleep",
      label: "Sleep journal",
      detail: `${extras.sleepEntries} night${extras.sleepEntries === 1 ? "" : "s"} logged`,
      earned: extras.sleepEntries >= 3,
    },
    {
      id: "badge-brain",
      label: "Brain training",
      detail: `${extras.cognitiveSessions} session${extras.cognitiveSessions === 1 ? "" : "s"} played`,
      earned: extras.cognitiveSessions >= 2,
    },
    {
      id: "badge-mood",
      label: "Mood awareness",
      detail: `${extras.moodEntries} check-in${extras.moodEntries === 1 ? "" : "s"}`,
      earned: extras.moodEntries >= 3,
    },
    {
      id: "badge-meds",
      label: "Medication rhythm",
      detail: `${Math.round(extras.adherence * 100)}% taken today`,
      earned: extras.adherence >= 0.8,
    },
    {
      id: "badge-tasks",
      label: "Care tasks closed",
      detail: `${resident.tasks.filter((task) => task.completed).length}/${resident.tasks.length} done`,
      earned:
        resident.tasks.length > 0 &&
        resident.tasks.every((task) => task.completed),
    },
  ];
}

export function daysUntil(dateLabel: string) {
  const parsed = new Date(dateLabel);
  if (Number.isNaN(parsed.getTime())) return null;
  const today = new Date();
  const diff = Math.ceil(
    (parsed.getTime() - new Date(today.toDateString()).getTime()) / 86_400_000
  );
  return diff;
}
