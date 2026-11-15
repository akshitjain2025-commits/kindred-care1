import type { ResidentProfile } from "../data/eldercareData";
import { buildHandoffText, computeSafetyScore, type MoodEntry } from "./wellnessExtras";

export interface AssistantContext {
  resident: ResidentProfile;
  caregiverName?: string;
  sleepHours?: number | null;
  cognitiveSessions?: number;
  mood?: MoodEntry | null;
}

export interface AssistantReply {
  text: string;
  chips: string[];
}

const DEFAULT_CHIPS = [
  "What should I focus on today?",
  "Medication schedule",
  "Sleep and mood trend",
  "Health summary",
];

const has = (haystack: string, needles: string[]) =>
  needles.some((needle) => haystack.includes(needle));

const list = (items: string[]) => items.map((item) => `• ${item}`).join("\n");

function medicationAnswer(resident: ResidentProfile) {
  const taken = resident.prescriptions.filter((item) => item.daysRemaining > 7).length;
  const refills = resident.prescriptions.filter((item) => item.refillRequested);
  return [
    `Medication plan for ${resident.name.split(" ")[0]} right now:`,
    "",
    list(
      resident.prescriptions.map(
        (item) =>
          `${item.name} ${item.dosage} — ${item.timing}${
            item.refillRequested ? " (refill requested)" : ""
          }, ${item.daysRemaining} days left`
      )
    ),
    "",
    refills.length
      ? `${refills.length} prescription${refills.length > 1 ? "s" : ""} needs a refill soon (${refills
          .map((item) => item.name)
          .join(", ")}).`
      : `${taken}/${resident.prescriptions.length} prescriptions have comfortable supply left.`,
  ].join("\n");
}

function vitalsAnswer(resident: ResidentProfile) {
  const watch = resident.vitals.filter((reading) => reading.status === "Watch");
  return [
    `Latest recorded vitals for ${resident.name.split(" ")[0]}:`,
    "",
    list(resident.vitals.map((reading) => `${reading.label}: ${reading.value} ${reading.unit} · ${reading.measuredAt}`)),
    "",
    watch.length
      ? `${watch.map((reading) => reading.label).join(", ")} flagged for a watch — worth a re-check and a note for ${resident.doctorName || "the care team"}.`
      : "Everything is inside the expected range today. Keep logging at the same time so trends stay comparable.",
  ].join("\n");
}

function sleepMoodAnswer(resident: ResidentProfile, context: AssistantContext) {
  const recent = resident.wellnessHistory.slice(-7);
  const sleepScores = recent.map((day) => day.sleepScore);
  const average = sleepScores.length
    ? Math.round(sleepScores.reduce((sum, value) => sum + value, 0) / sleepScores.length)
    : 0;
  const mood = context.mood;
  return [
    `Sleep and mood snapshot for ${resident.name.split(" ")[0]}:`,
    "",
    list([
      context.sleepHours
        ? `Last logged night: ${context.sleepHours.toFixed(1)} hours.`
        : "No night logged yet in the sleep journal — worth capturing tonight.",
      `Seven-day sleep score average: ${average}/100 (${sleepScores.join(" · ")}).`,
      context.cognitiveSessions
        ? `${context.cognitiveSessions} cognitive session${context.cognitiveSessions > 1 ? "s" : ""} recorded — those feed the same wellness history.`
        : "No cognitive session logged yet — the memory pairs game takes about two minutes.",
      mood
        ? `Mood check-in today: ${mood.mood}/5 with energy ${mood.energy}/5.`
        : "No mood check-in today — one tap in the vitals studio is enough.",
    ]),
    "",
    average < 60
      ? "The short nights are consistent rather than random, so an earlier wind-down cue is the simplest lever."
      : "Sleep is holding steady, which usually keeps the mornings calmer.",
  ].join("\n");
}

function focusAnswer(resident: ResidentProfile, context: AssistantContext) {
  const actions: string[] = [];
  const overdueTasks = resident.tasks.filter((task) => !task.completed);
  const refills = resident.prescriptions.filter((item) => item.refillRequested || item.daysRemaining <= 7);

  if (refills.length) {
    actions.push(
      `Request the ${refills.map((item) => item.name).join(", ")} refill — ${refills[0].daysRemaining} days of supply left.`
    );
  }
  if (resident.hydrationGlasses < resident.hydrationTarget) {
    actions.push(
      `Offer water: ${resident.hydrationGlasses} of ${resident.hydrationTarget} glasses logged today.`
    );
  }
  if (overdueTasks.length) {
    actions.push(
      `${overdueTasks[0].time} — ${overdueTasks[0].title} is still open${
        overdueTasks.length > 1 ? ` (${overdueTasks.length - 1} more after it)` : ""
      }.`
    );
  }
  if (context.sleepHours !== null && context.sleepHours !== undefined && context.sleepHours < 6.5) {
    actions.push(
      `Short night logged (${context.sleepHours.toFixed(1)} h) — plan an earlier, quieter evening cue.`
    );
  }
  if (!context.mood) {
    actions.push("Capture today's mood and energy so the weekly report stays honest.");
  }
  const safety = computeSafetyScore(resident, context.sleepHours ?? null, context.mood ?? null);
  if (safety.score < 70) {
    actions.push(`Safety score is ${safety.score}/100 — ${safety.factors[0]}`);
  }
  if (!actions.length) {
    actions.push("Everything on today's rhythm is closed out. A short walk and a photo note would make the day feel complete.");
  }
  return [
    `Here is the calmest order of work for ${resident.name.split(" ")[0]}:`,
    "",
    list(actions.slice(0, 5)),
    "",
    `Safety score today: ${safety.score}/100 (${safety.band}).`,
  ].join("\n");
}

function emergencyAnswer(resident: ResidentProfile) {
  const primary = resident.circleMembers[0];
  return [
    "If this is an emergency, call your local emergency number first — do not wait for this app.",
    "",
    list([
      `Allergies on file: ${resident.allergies.length ? resident.allergies.join(", ") : "none recorded"}.`,
      `Conditions: ${resident.conditions.length ? resident.conditions.join(", ") : "none recorded"}.`,
      resident.doctorName
        ? `Clinician: ${resident.doctorName}${resident.doctorPhone ? ` · ${resident.doctorPhone}` : ""}`
        : "No clinician recorded yet.",
      primary ? `Family contact: ${primary.name}${primary.phone ? ` · ${primary.phone}` : ""}` : "No family contact recorded.",
      resident.patientPhone ? `Resident phone: ${resident.patientPhone}` : "No resident phone on file.",
    ]),
    "",
    "For a fall: keep them still, check for pain and alertness, and call the clinician before moving them.",
  ].join("\n");
}

export function askKindred(question: string, context: AssistantContext): AssistantReply {
  const resident = context.resident;
  const text = question.toLowerCase().trim();
  const firstName = resident.name.split(" ")[0];

  if (!text) {
    return {
      text: `I read only what is already in ${firstName}'s care record — nothing leaves this device. Ask me about medications, vitals, sleep, appointments, the family circle, or what to do next.`,
      chips: DEFAULT_CHIPS,
    };
  }

  if (has(text, ["emergency", "999", "911", "urgent", "ambulance", "fell", "fall"])) {
    return { text: emergencyAnswer(resident), chips: ["Health summary", "Medication schedule"] };
  }

  if (has(text, ["med", "pill", "prescription", "dose", "refill", "adherence"])) {
    return { text: medicationAnswer(resident), chips: ["What should I focus on today?", "Vitals"] };
  }

  if (has(text, ["vital", "blood pressure", "bp", "heart rate", "glucose", "weight", "oxygen", "spo2"])) {
    return { text: vitalsAnswer(resident), chips: ["Sleep and mood trend", "What should I focus on today?"] };
  }

  if (has(text, ["sleep", "night", "tired", "mood", "energy", "brain", "cognitive", "memory game"])) {
    return { text: sleepMoodAnswer(resident, context), chips: ["Medication schedule", "Weekly report"] };
  }

  if (has(text, ["appointment", "visit", "doctor", "clinic", "schedule", "calendar"])) {
    return {
      text: [
        `Upcoming care for ${firstName}:`,
        "",
        list(
          resident.appointments.map(
            (item) => `${item.date} · ${item.time} — ${item.title} with ${item.withPerson} (${item.mode})`
          )
        ),
        "",
        resident.upcomingVisit ? `Next on the family calendar: ${resident.upcomingVisit}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      chips: ["Doctor visit prep", "Handoff summary"],
    };
  }

  if (has(text, ["hydrat", "water", "drink", "fluid"])) {
    const percent = Math.round((resident.hydrationGlasses / resident.hydrationTarget) * 100);
    return {
      text: [
        `Hydration today: ${resident.hydrationGlasses} of ${resident.hydrationTarget} glasses (${percent}%).`,
        "",
        percent >= 100
          ? "Target reached — keep the glass within reach so the evening stays on track."
          : `${resident.hydrationTarget - resident.hydrationGlasses} more glasses to reach target. ${resident.comfortPreferences.favoriteDrink} is the preference on file.`,
      ].join("\n"),
      chips: ["What should I focus on today?", "Sleep and mood trend"],
    };
  }

  if (has(text, ["task", "todo", "to-do", "today", "routine", "focus", "next"])) {
    return { text: focusAnswer(resident, context), chips: ["Medication schedule", "Handoff summary"] };
  }

  if (has(text, ["family", "circle", "contact", "caregiver", "daughter", "son", "who"])) {
    return {
      text: [
        `The care circle around ${firstName}:`,
        "",
        list(
          resident.circleMembers.map(
            (member) => `${member.name} — ${member.role} · ${member.location} · ${member.lastCheckIn}`
          )
        ),
        "",
        context.caregiverName ? `You are signed in as ${context.caregiverName}.` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      chips: ["Handoff summary", "Appointments"],
    };
  }

  if (has(text, ["safety", "fall risk", "alert", "sensor", "camera", "secure"])) {
    const safety = computeSafetyScore(resident, context.sleepHours ?? null, context.mood ?? null);
    return {
      text: [
        `Safety read for ${firstName}: ${safety.score}/100 (${safety.band}).`,
        "",
        list(safety.factors),
        "",
        resident.safetySummary,
        "",
        `${resident.securityLogs.length} sensor events on file, ${resident.securityLogs.filter((log) => log.status === "Resolved").length} resolved.`,
      ].join("\n"),
      chips: ["Emergency contacts", "Health summary"],
    };
  }

  if (has(text, ["handoff", "shift", "summary", "report", "share"])) {
    return {
      text: buildHandoffText(resident, context.sleepHours ?? null, context.mood ?? null),
      chips: ["What should I focus on today?", "Appointments"],
    };
  }

  if (has(text, ["allerg", "condition", "diagnos", "history", "health summary", "profile"])) {
    return {
      text: [
        `${resident.name} · ${resident.age} · ${resident.bloodType}`,
        "",
        list([
          `Conditions: ${resident.conditions.join(", ") || "none recorded"}.`,
          `Allergies: ${resident.allergies.join(", ") || "none recorded"}.`,
          `Mobility: ${resident.mobilityAid}.`,
          `Care focus: ${resident.careFocus}.`,
          `Primary language: ${resident.primaryLanguage}.`,
        ]),
      ].join("\n"),
      chips: ["Medication schedule", "Vitals"],
    };
  }

  if (has(text, ["hello", "hi ", "hey", "help", "what can you do"])) {
    return {
      text: [
        "I am the Kindred companion. I answer from this resident's own record — no outside service, no key, no waiting.",
        "",
        list([
          "Medication schedule and refill watch",
          "Latest vitals and anything flagged",
          "Sleep, mood and cognitive trends",
          "Appointments and the family circle",
          "Safety score, handoff summary and emergency contacts",
        ]),
      ].join("\n"),
      chips: DEFAULT_CHIPS,
    };
  }

  return {
    text: [
      `I could not match that to ${firstName}'s record, so here is the short version instead.`,
      "",
      list([
        `${resident.tasks.filter((task) => !task.completed).length} care tasks still open today.`,
        `${resident.prescriptions.length} prescriptions, ${resident.prescriptions.filter((item) => item.refillRequested).length} awaiting refill.`,
        `Hydration ${resident.hydrationGlasses}/${resident.hydrationTarget} glasses.`,
        resident.upcomingVisit,
      ]),
      "",
      "Try asking about medications, vitals, sleep, appointments, safety or a handoff summary.",
    ].join("\n"),
    chips: DEFAULT_CHIPS,
  };
}
