import type { CareTaskItem, ResidentProfile } from "../data/eldercareData";

export type NotificationChannel = "both" | "push" | "sms";

export interface ApproachingMedicationMatch {
  task: CareTaskItem;
  minutesUntilDue: number;
  personalizedMessage: string;
}

export interface MedicationReminderAlert {
  notificationId: string;
  residentId: string;
  residentName: string;
  taskId: string;
  medicationTitle: string;
  scheduledTime: string;
  minutesUntilDue: number;
  personalizedMessage: string;
  channel: NotificationChannel;
  recipientPhone: string | null;
  smsUri: string | null;
  sentAt: string;
}

/**
 * Parses a human clock string such as "08:00 AM", "06:30 PM", or "18:30"
 * into minutes since midnight (0..1439). Returns null if unparseable.
 */
export function parseTaskClockMinutes(timeStr: string): number | null {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  if (hours < 0 || hours > 23) return null;
  return hours * 60 + minutes;
}

/**
 * Composes an empathetic, personalized medication reminder grounded in the
 * resident's name, medication schedule, and comfort preferences.
 */
export function composePersonalizedMedicationMessage(
  resident: ResidentProfile,
  task: CareTaskItem,
  minutesUntilDue: number
): string {
  const firstName = resident.name.split(" ")[0] || resident.name;
  const drinkCue = resident.comfortPreferences?.favoriteDrink
    ? ` Enjoy it with ${resident.comfortPreferences.favoriteDrink.toLowerCase()}.`
    : " Take with a full glass of water.";

  let timingPhrase = `scheduled for ${task.time}`;
  if (minutesUntilDue > 1) {
    timingPhrase = `coming up in ${minutesUntilDue} minutes (${task.time})`;
  } else if (minutesUntilDue === 1) {
    timingPhrase = `coming up in 1 minute (${task.time})`;
  } else if (minutesUntilDue === 0) {
    timingPhrase = `due right now (${task.time})`;
  } else {
    timingPhrase = `scheduled ${Math.abs(minutesUntilDue)} min ago (${task.time})`;
  }

  return `Hello ${firstName} — gentle medication reminder: ${task.title} is ${timingPhrase}. ${task.detail}.${drinkCue}`;
}

/**
 * Scans the resident's existing task list for incomplete Medication tasks whose
 * scheduled time is approaching within `windowMinutes` (or slightly overdue by <= 15 min).
 */
export function findApproachingMedicationTasks(
  resident: ResidentProfile,
  now: Date = new Date(),
  windowMinutes = 45
): ApproachingMedicationMatch[] {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const matches: ApproachingMedicationMatch[] = [];
  for (const task of resident.tasks) {
    if (task.category !== "Medication" || task.completed) continue;
    const taskMinutes = parseTaskClockMinutes(task.time);
    if (taskMinutes === null) continue;

    const delta = taskMinutes - nowMinutes;
    if (delta >= -15 && delta <= windowMinutes) {
      matches.push({
        task,
        minutesUntilDue: delta,
        personalizedMessage: composePersonalizedMedicationMessage(
          resident,
          task,
          delta
        ),
      });
    }
  }

  return matches.sort((a, b) => a.minutesUntilDue - b.minutesUntilDue);
}

/**
 * Selects the next pending medication task from `resident.tasks` (used for manual
 * immediate trigger testing or status preview outside scheduled hours).
 */
export function getNextPendingMedicationTask(
  resident: ResidentProfile,
  now: Date = new Date()
): ApproachingMedicationMatch | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const pendingMeds = resident.tasks.filter(
    (t) => t.category === "Medication" && !t.completed
  );
  if (pendingMeds.length === 0) return null;

  const sorted = [...pendingMeds].sort((a, b) => {
    const aMin = parseTaskClockMinutes(a.time) ?? 9999;
    const bMin = parseTaskClockMinutes(b.time) ?? 9999;
    return Math.abs(aMin - nowMinutes) - Math.abs(bMin - nowMinutes);
  });

  const chosen = sorted[0];
  const chosenMin = parseTaskClockMinutes(chosen.time);
  const delta = chosenMin !== null ? chosenMin - nowMinutes : 15;

  return {
    task: chosen,
    minutesUntilDue: delta,
    personalizedMessage: composePersonalizedMedicationMessage(
      resident,
      chosen,
      delta
    ),
  };
}

/**
 * Service layer trigger: Dispatches an automated, personalized SMS &/or in-app
 * push medication reminder for a specific resident and task.
 */
export async function sendMedicationReminderNotification({
  resident,
  task,
  channel = "both",
  minutesUntilDue,
  requestBrowserPermission = false,
}: {
  resident: ResidentProfile;
  task: CareTaskItem;
  channel?: NotificationChannel;
  minutesUntilDue: number;
  requestBrowserPermission?: boolean;
}): Promise<MedicationReminderAlert> {
  const personalizedMessage = composePersonalizedMedicationMessage(
    resident,
    task,
    minutesUntilDue
  );
  const recipientPhone =
    resident.patientPhone ||
    resident.circleMembers.find((m) => m.phone)?.phone ||
    "";

  const res = await fetch("/api/notifications/medication-reminder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      residentId: resident.id,
      residentName: resident.name,
      taskId: task.id,
      medicationTitle: task.title,
      scheduledTime: task.time,
      personalizedMessage,
      channel,
      recipientPhone,
    }),
  });

  const data = (await res.json()) as {
    notificationId?: string;
    sentAt?: string;
    smsUri?: string | null;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(
      data.error || "Unable to send medication reminder notification."
    );
  }

  // Trigger native browser push notification when permitted or explicitly requested
  if (
    (channel === "push" || channel === "both") &&
    typeof window !== "undefined" &&
    "Notification" in window
  ) {
    const pushTitle = `Medication Reminder · ${resident.name}`;
    if (Notification.permission === "granted") {
      new Notification(pushTitle, { body: personalizedMessage });
    } else if (requestBrowserPermission && Notification.permission !== "denied") {
      void Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          new Notification(pushTitle, { body: personalizedMessage });
        }
      });
    }
  }

  return {
    notificationId: data.notificationId || `MR-${Date.now()}`,
    residentId: resident.id,
    residentName: resident.name,
    taskId: task.id,
    medicationTitle: task.title,
    scheduledTime: task.time,
    minutesUntilDue,
    personalizedMessage,
    channel,
    recipientPhone: recipientPhone || null,
    smsUri: data.smsUri ?? null,
    sentAt: data.sentAt || new Date().toISOString(),
  };
}
