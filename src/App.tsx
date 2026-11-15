import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, LogIn, LogOut, Mic } from "lucide-react";
import { motion } from "motion/react";
import { KineticHeadline } from "./components/SkiperKineticPrimitives";
import { HoverMemberCircle } from "./components/HoverMemberCircle";
import type { FamilyMember } from "./data/eldercareData";
import { CareHub3D } from "./components/CareHub3D";
import { SkiperFeatureShowcase } from "./components/SkiperFeatureShowcase";
import { CareCircleWorkbench } from "./components/CareCircleWorkbench";
import { SleepTracker, type SleepLogInput } from "./components/SleepTracker";
import {
  CognitiveGames,
  type CognitiveResult,
} from "./components/CognitiveGames";
import { ResidentProfileSection } from "./components/ResidentProfileSection";
import { KindredAssistant } from "./components/KindredAssistant";
import { HealthVitalsStudio } from "./components/HealthVitalsStudio";
import { FamilyHandoffHub } from "./components/FamilyHandoffHub";
import { CareProgressDigest } from "./components/CareProgressDigest";
import { CareInquirySection } from "./components/CareInquirySection";
import {
  MobileQuickAlert,
  type QuickAlertPreset,
} from "./components/MobileQuickAlert";
import { PhysicianReportModal } from "./components/PhysicianReportModal";
import {
  QuickPageModal,
  QuickPageNotificationToast,
  type FamilyPageNotification,
} from "./components/QuickPageModal";
import { MedicationReminderToast } from "./components/MedicationReminderToast";
import {
  PatientOnboardingModal,
  type PostOnboardingAction,
} from "./components/PatientOnboardingModal";
import {
  DoctorConnectModal,
  type DoctorModalTab,
} from "./components/DoctorConnectModal";
import { SignInPortalModal } from "./components/SignInPortalModal";
import { SeniorLodgingHub } from "./components/SeniorLodgingHub";
import { ReminiscenceGallery } from "./components/ReminiscenceGallery";
import { ExtendedCareSkiper80Hub } from "./components/ExtendedCareSkiper80Hub";
import type { ReaderFontScale } from "./components/AccessibilityReaderBar";
import {
  Perspective3DCard,
  SpatialDepthReveal,
} from "./components/Motion3DPrimitives";
import {
  CAREGIVER_STORIES,
  CLINICAL_OUTCOMES,
  INITIAL_RESIDENTS,
  type AppointmentItem,
  type CareTaskItem,
  type ComfortPreferences,
  type PrescriptionItem,
  type ResidentProfile,
  type SecurityLogEntry,
  type SpatialCareMode,
  type VitalReading,
} from "./data/eldercareData";
import {
  deriveDisplayName,
  signOutCaregiver,
  useCaregiverSession,
  type FreebuffUser,
} from "./freebuffAuth";
import {
  loadInitialCareState,
  persistAddAppointment,
  persistAddNote,
  persistAddPrescription,
  persistAddSecurityLog,
  persistAddTask,
  persistAddVital,
  persistComfortPreferences,
  persistCreateResident,
  persistHydration,
  persistHydrationTarget,
  persistLastActiveResident,
  persistMedicalFlags,
  persistResolveSecurityLog,
  persistStatusLevel,
  persistTaskCompleted,
  persistToggleRefill,
  persistWellnessHistory,
  saveCareState,
} from "./services/careStore";
import {
  findApproachingMedicationTasks,
  getNextPendingMedicationTask,
  sendMedicationReminderNotification,
  type MedicationReminderAlert,
  type NotificationChannel,
} from "./services/medicationNotifications";

function ResilientPhoto({
  src,
  alt,
  fallbackTitle,
}: {
  src: string;
  alt: string;
  fallbackTitle: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-emerald-50 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm font-medium text-slate-700">{fallbackTitle}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
    />
  );
}

export default function App() {
  const [initialCare] = useState(() => loadInitialCareState());
  const [residents, setResidents] = useState<ResidentProfile[]>(
    initialCare.residents
  );
  const [activeResidentId, setActiveResidentId] = useState<string>(
    initialCare.activeResidentId
  );
  const [active3DMode, setActive3DMode] = useState<SpatialCareMode>("overview");
  const [voiceActive, setVoiceActive] = useState<boolean>(false);
  const [externalPromptRequest, setExternalPromptRequest] = useState<{
    id: number;
    prompt: string;
  } | null>(null);

  // Real Sign in with Freebuff: cookie session verified by the server
  const {
    user,
    ready: authReady,
    signIn: startFreebuffSignIn,
  } = useCaregiverSession();
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Google Maps Platform Key & Case A Quota Defense State
  const [mapsApiKey, setMapsApiKey] = useState<string>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  );
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  // Mobile Quick Alert, Quick Page, Physician Report, Onboarding & Doctor Modal State
  const [quickAlertOpen, setQuickAlertOpen] = useState(false);
  const [quickPageOpen, setQuickPageOpen] = useState(false);
  const [physicianReportOpen, setPhysicianReportOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingDefaults, setOnboardingDefaults] = useState({
    name: "",
    email: "",
  });
  const [doctorModalState, setDoctorModalState] = useState<{
    open: boolean;
    tab: DoctorModalTab;
  }>({ open: false, tab: "contact" });

  const [familyPages, setFamilyPages] = useState<FamilyPageNotification[]>([]);
  const [activeToastPage, setActiveToastPage] =
    useState<FamilyPageNotification | null>(null);

  // Automated Personalized Medication Notification State
  const [autoMedReminders, setAutoMedReminders] = useState(true);
  const [reminderChannel, setReminderChannel] =
    useState<NotificationChannel>("both");
  const [activeMedToast, setActiveMedToast] =
    useState<MedicationReminderAlert | null>(null);
  const [lastMedReminderSentAt, setLastMedReminderSentAt] = useState<
    string | null
  >(null);

  // Senior Lodging Accessibility Scale & Contrast Preferences
  const [fontScale, setFontScale] = useState<ReaderFontScale>(() => {
    try {
      const saved = window.localStorage.getItem("kindred_font_scale");
      if (saved === "comfortable" || saved === "large") return saved;
    } catch {
      // Ignore storage errors
    }
    return "standard";
  });
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem("kindred_high_contrast") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("kindred_font_scale", fontScale);
      window.localStorage.setItem("kindred_high_contrast", highContrast ? "1" : "0");
    } catch {
      // Ignore storage errors
    }
  }, [fontScale, highContrast]);

  const voiceAmplitudeRef = useRef<number>(0);
  const notifiedMedKeysRef = useRef<Set<string>>(new Set());

  // Resolve Google Maps Platform key from server runtime if not bundled in Vite env
  useEffect(() => {
    if (mapsApiKey) return;
    let active = true;
    fetch("/api/maps/config")
      .then((res) => res.json())
      .then((data: { apiKey?: string }) => {
        if (active && data.apiKey) {
          setMapsApiKey(data.apiKey);
        }
      })
      .catch(() => {
        // Silent; locator card renders waiting state
      });
    return () => {
      active = false;
    };
  }, [mapsApiKey]);

  // Listen to global Google Maps Platform quota events
  useEffect(() => {
    const onQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener("gmp-quota-exceeded", onQuota);
    return () => window.removeEventListener("gmp-quota-exceeded", onQuota);
  }, []);

  const deriveFirstName = (nextUser: FreebuffUser): string =>
    nextUser.displayName?.trim() ||
    deriveDisplayName(nextUser.email || "") ||
    "New Member";

  // Once the Freebuff session resolves, greet the caregiver and offer a first entry
  useEffect(() => {
    if (!authReady || !user) {
      setSyncNotice(null);
      return;
    }

    setSyncNotice("Signed in with Freebuff · saving on this device");

    const promptedKey = `kindred_prompted_${user.uid}`;
    let alreadyPrompted = false;
    try {
      alreadyPrompted = window.localStorage.getItem(promptedKey) === "1";
    } catch {
      alreadyPrompted = false;
    }
    if (alreadyPrompted) return;

    const userEmailLower = (user.email || "").toLowerCase();
    const hasPersonalEntry = residents.some(
      (resident) =>
        Boolean(userEmailLower) &&
        resident.patientEmail?.toLowerCase() === userEmailLower
    );
    if (hasPersonalEntry) return;

    try {
      window.localStorage.setItem(promptedKey, "1");
    } catch {
      // Ignore storage errors.
    }
    setOnboardingDefaults({
      name: deriveFirstName(user),
      email: user.email || "",
    });
    setOnboardingOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user?.uid]);

  // Persist the care circle on this device whenever it changes
  useEffect(() => {
    saveCareState({ activeResidentId, residents });
  }, [activeResidentId, residents]);

  const handleFreebuffSignIn = async () => {
    await startFreebuffSignIn();
  };

  const handleFreebuffSignOut = async () => {
    await signOutCaregiver();
    setResidents(INITIAL_RESIDENTS);
    setActiveResidentId(INITIAL_RESIDENTS[0].id);
    setSyncNotice(null);
  };

  const handleQuotaExceeded = useCallback(() => {
    setMapsQuotaExceeded(true);
  }, []);

  const activeResident =
    residents.find((r) => r.id === activeResidentId) || residents[0];

  // Background Trigger: checks every 30s for approaching Medication tasks
  useEffect(() => {
    if (!autoMedReminders || !activeResident) return;

    const checkAndDispatch = async () => {
      const approaching = findApproachingMedicationTasks(
        activeResident,
        new Date(),
        45
      );
      if (approaching.length === 0) return;

      const target = approaching[0];
      const key = `${activeResident.id}:${target.task.id}`;
      if (notifiedMedKeysRef.current.has(key)) return;
      notifiedMedKeysRef.current.add(key);

      try {
        const alert = await sendMedicationReminderNotification({
          resident: activeResident,
          task: target.task,
          channel: reminderChannel,
          minutesUntilDue: target.minutesUntilDue,
          requestBrowserPermission: false,
        });
        setActiveMedToast(alert);
        setLastMedReminderSentAt(
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
      } catch {
        // Allow retry on next cycle if network call failed
        notifiedMedKeysRef.current.delete(key);
      }
    };

    void checkAndDispatch();
    const timer = window.setInterval(() => {
      void checkAndDispatch();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [activeResident, autoMedReminders, reminderChannel]);

  const handleTriggerMedicationReminder = async () => {
    const approaching = findApproachingMedicationTasks(activeResident, new Date(), 45);
    const match = approaching[0] || getNextPendingMedicationTask(activeResident);
    if (!match) return;

    try {
      const alert = await sendMedicationReminderNotification({
        resident: activeResident,
        task: match.task,
        channel: reminderChannel,
        minutesUntilDue: match.minutesUntilDue,
        requestBrowserPermission: true,
      });
      notifiedMedKeysRef.current.add(`${activeResident.id}:${match.task.id}`);
      setActiveMedToast(alert);
      setLastMedReminderSentAt(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      // Ignore transient UI error
    }
  };

  const handleCreateResident = (
    newResident: ResidentProfile,
    postAction: PostOnboardingAction
  ) => {
    setResidents((prev) => [newResident, ...prev]);
    setActiveResidentId(newResident.id);
    setOnboardingOpen(false);

    if (user) {
      void persistCreateResident(user.uid, newResident)
        .then(() => persistLastActiveResident(user.uid, newResident.id))
        .catch(() => {});
    }

    if (postAction === "contact_doctor") {
      setDoctorModalState({ open: true, tab: "contact" });
    } else if (postAction === "book_appointment") {
      setDoctorModalState({ open: true, tab: "appointment" });
    }
  };

  const handleSelectResident = (id: string) => {
    setActiveResidentId(id);
    if (user) {
      void persistLastActiveResident(user.uid, id).catch(() => {});
    }
  };

  const handleToggleTask = (residentId: string, taskId: string) => {
    const current = residents.find((r) => r.id === residentId);
    const targetTask = current?.tasks.find((t) => t.id === taskId);
    if (!current || !targetTask) return;

    const nextCompleted = !targetTask.completed;
    const nextTasks = current.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: nextCompleted } : task
    );
    const completedTotal = nextTasks.filter((t) => t.completed).length;
    const pct = Math.round((completedTotal / Math.max(1, nextTasks.length)) * 100);
    const nextHistory = current.wellnessHistory.map((pt, idx, arr) =>
      idx === arr.length - 1
        ? { ...pt, activityScore: Math.max(55, Math.min(100, pct)) }
        : pt
    );

    setResidents((prev) =>
      prev.map((resident) =>
        resident.id === residentId
          ? { ...resident, tasks: nextTasks, wellnessHistory: nextHistory }
          : resident
      )
    );

    if (user) {
      void persistTaskCompleted(
        user.uid,
        residentId,
        taskId,
        nextCompleted,
        nextHistory
      ).catch(() => {});
    }
  };

  const handleAddTask = (
    residentId: string,
    taskInput: Omit<CareTaskItem, "id" | "completed">
  ) => {
    const newTask: CareTaskItem = {
      id: `task-${Date.now()}`,
      ...taskInput,
      completed: false,
    };

    setResidents((prev) =>
      prev.map((resident) =>
        resident.id === residentId
          ? { ...resident, tasks: [...resident.tasks, newTask] }
          : resident
      )
    );

    if (user) {
      void persistAddTask(user.uid, residentId, newTask).catch(() => {});
    }
  };

  const handleSendQuickPage = ({
    residentId,
    sender,
    message,
    recipients,
  }: {
    residentId: string;
    sender: string;
    message: string;
    recipients: string[];
  }) => {
    const targetResident =
      residents.find((r) => r.id === residentId) || activeResident;
    const timestamp = `Today · ${new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    const newPage: FamilyPageNotification = {
      id: `page-${Date.now()}`,
      residentId,
      residentName: targetResident.name,
      sender,
      message,
      recipients,
      timestamp,
      acknowledgedBy: [],
    };

    setFamilyPages((prev) => [newPage, ...prev]);
    setActiveToastPage(newPage);
    handleAddNote(
      residentId,
      `${sender} (Quick Page)`,
      `Paged ${recipients.join(", ")}: "${message}"`
    );
  };

  const handleAcknowledgePage = (pageId: string) => {
    const responder = user?.displayName?.split(" ")[0] || "Family Member";
    setFamilyPages((prev) =>
      prev.map((p) =>
        p.id === pageId
          ? {
              ...p,
              acknowledgedBy: p.acknowledgedBy.includes(responder)
                ? p.acknowledgedBy
                : [...p.acknowledgedBy, responder],
            }
          : p
      )
    );
    setActiveToastPage((prev) =>
      prev && prev.id === pageId
        ? {
            ...prev,
            acknowledgedBy: prev.acknowledgedBy.includes(responder)
              ? prev.acknowledgedBy
              : [...prev.acknowledgedBy, responder],
          }
        : prev
    );
  };

  const handleLogHydrationDelta = (residentId: string, delta: number) => {
    const current = residents.find((r) => r.id === residentId);
    if (!current) return;

    const nextVal = Math.max(0, Math.min(20, current.hydrationGlasses + delta));
    const hydrationPct = Math.min(
      100,
      Math.round((nextVal / Math.max(1, current.hydrationTarget)) * 100)
    );
    const nextHistory = current.wellnessHistory.map((pt, idx, arr) =>
      idx === arr.length - 1 ? { ...pt, hydrationScore: hydrationPct } : pt
    );

    setResidents((prev) =>
      prev.map((resident) =>
        resident.id === residentId
          ? { ...resident, hydrationGlasses: nextVal, wellnessHistory: nextHistory }
          : resident
      )
    );

    if (user) {
      void persistHydration(
        user.uid,
        residentId,
        nextVal,
        nextHistory,
        current.hydrationTarget
      ).catch(() => {});
    }
  };

  const handleUpdateHydrationGoal = (residentId: string, nextTarget: number) => {
    const current = residents.find((r) => r.id === residentId);
    if (!current) return;

    const clampedTarget = Math.max(4, Math.min(16, Math.round(nextTarget)));
    const hydrationPct = Math.min(
      100,
      Math.round((current.hydrationGlasses / clampedTarget) * 100)
    );
    const nextHistory = current.wellnessHistory.map((pt, idx, arr) =>
      idx === arr.length - 1 ? { ...pt, hydrationScore: hydrationPct } : pt
    );

    setResidents((prev) =>
      prev.map((resident) =>
        resident.id === residentId
          ? {
              ...resident,
              hydrationTarget: clampedTarget,
              wellnessHistory: nextHistory,
            }
          : resident
      )
    );

    if (user) {
      void persistHydrationTarget(
        user.uid,
        residentId,
        clampedTarget,
        nextHistory
      ).catch(() => {});
    }
  };

  const handleUpdateTodayWellness = (
    residentId: string,
    patch: { activityScore?: number; sleepScore?: number }
  ) => {
    const current = residents.find((r) => r.id === residentId);
    if (!current) return;

    const nextHistory = current.wellnessHistory.map((pt, idx, arr) =>
      idx === arr.length - 1 ? { ...pt, ...patch } : pt
    );

    setResidents((prev) =>
      prev.map((resident) =>
        resident.id === residentId
          ? { ...resident, wellnessHistory: nextHistory }
          : resident
      )
    );

    if (user) {
      void persistWellnessHistory(user.uid, residentId, nextHistory).catch(
        () => {}
      );
    }
  };

  const handleLogSleep = (residentId: string, entry: SleepLogInput) => {
    const sleepScore = Math.max(20, Math.min(100, Math.round(entry.quality * 20)));
    handleUpdateTodayWellness(residentId, { sleepScore });
    handleAddNote(
      residentId,
      user?.displayName?.split(" ")[0] || "Caregiver",
      `Sleep log: ${entry.hours}h of rest rated ${entry.quality}/5.`
    );
  };

  const handleCognitiveSession = (
    residentId: string,
    result: CognitiveResult
  ) => {
    const current = residents.find((resident) => resident.id === residentId);
    const today =
      current?.wellnessHistory[current.wellnessHistory.length - 1];
    handleUpdateTodayWellness(residentId, {
      activityScore: Math.min(
        100,
        (today?.activityScore ?? 78) + Math.max(2, Math.round(result.accuracy / 20))
      ),
    });
    handleAddNote(
      residentId,
      user?.displayName?.split(" ")[0] || "Caregiver",
      `${result.game} completed — ${result.score}% score at ${result.accuracy}% accuracy.`
    );
  };

  const handleAddNote = (residentId: string, author: string, text: string) => {
    const timestamp = `Today · ${new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    const newNote = {
      id: `note-${Date.now()}`,
      author,
      timestamp,
      text,
    };

    setResidents((prev) =>
      prev.map((resident) =>
        resident.id === residentId
          ? { ...resident, notes: [newNote, ...resident.notes] }
          : resident
      )
    );

    if (user) {
      void persistAddNote(user.uid, residentId, newNote).catch(() => {});
    }
  };

  const handleResolveSecurityLog = (residentId: string, logId: string) => {
    const resolvedBy = user?.displayName
      ? `Marked resolved by ${user.displayName}`
      : "Marked resolved by Care Coordinator";

    setResidents((prev) =>
      prev.map((resident) =>
        resident.id === residentId
          ? {
              ...resident,
              securityLogs: resident.securityLogs.map((log) =>
                log.id === logId
                  ? { ...log, status: "Resolved", resolvedBy }
                  : log
              ),
            }
          : resident
      )
    );

    if (user) {
      void persistResolveSecurityLog(user.uid, residentId, logId, resolvedBy).catch(
        () => {}
      );
    }
  };

  const handleExecuteQuickAlertSequence = ({
    residentId,
    alertType,
    customNote,
    notifiedCount,
  }: {
    residentId: string;
    alertType: QuickAlertPreset;
    customNote: string;
    notifiedCount: number;
  }) => {
    const timeLabel = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const timestamp = `Today · ${timeLabel}`;
    const initiator = user?.displayName || "Mobile Caregiver";

    const newLog: SecurityLogEntry = {
      id: `qa-${Date.now()}`,
      timestamp,
      eventType: "Quick Alert",
      zone: "Mobile Emergency Sequence",
      description: `${alertType} dispatched to ${notifiedCount} designated contact${
        notifiedCount === 1 ? "" : "s"
      }${customNote ? ` — "${customNote}"` : ""}.`,
      responseTime: "One-tap sequence",
      status: "Monitoring",
      resolvedBy: `Triggered by ${initiator}`,
    };

    const newNote = {
      id: `note-qa-${Date.now()}`,
      author: initiator,
      timestamp,
      text: `Quick Alert (${alertType}) sent to ${notifiedCount} emergency contacts.${
        customNote ? ` Note: ${customNote}` : ""
      }`,
    };

    setResidents((prev) =>
      prev.map((resident) =>
        resident.id === residentId
          ? {
              ...resident,
              securityLogs: [newLog, ...resident.securityLogs],
              notes: [newNote, ...resident.notes],
            }
          : resident
      )
    );

    if (user) {
      void persistAddSecurityLog(user.uid, residentId, newLog).catch(() => {});
      void persistAddNote(user.uid, residentId, newNote).catch(() => {});
    }
  };

  const handleUpdateStatus = (
    residentId: string,
    statusLevel: "Calm" | "Active" | "Resting"
  ) => {
    setResidents((prev) =>
      prev.map((r) => (r.id === residentId ? { ...r, statusLevel } : r))
    );

    if (user) {
      void persistStatusLevel(user.uid, residentId, statusLevel).catch(() => {});
    }
  };

  const handleAddVital = (residentId: string, vital: Omit<VitalReading, "id">) => {
    const newVital: VitalReading = { id: `v-${Date.now()}`, ...vital };
    setResidents((prev) =>
      prev.map((r) =>
        r.id === residentId
          ? { ...r, vitals: [newVital, ...r.vitals.slice(0, 5)] }
          : r
      )
    );

    if (user) {
      void persistAddVital(user.uid, residentId, newVital).catch(() => {});
    }
  };

  const handleAddMedicalFlag = (
    residentId: string,
    kind: "allergy" | "condition",
    text: string
  ) => {
    const current = residents.find((r) => r.id === residentId);
    if (!current) return;

    const nextAllergies =
      kind === "allergy" ? [...current.allergies, text] : current.allergies;
    const nextConditions =
      kind === "condition" ? [...current.conditions, text] : current.conditions;

    setResidents((prev) =>
      prev.map((r) =>
        r.id === residentId
          ? { ...r, allergies: nextAllergies, conditions: nextConditions }
          : r
      )
    );

    if (user) {
      void persistMedicalFlags(
        user.uid,
        residentId,
        nextAllergies,
        nextConditions
      ).catch(() => {});
    }
  };

  const handleToggleRefill = (residentId: string, rxId: string) => {
    const current = residents.find((r) => r.id === residentId);
    const targetRx = current?.prescriptions.find((rx) => rx.id === rxId);
    if (!current || !targetRx) return;

    const nextRefill = !targetRx.refillRequested;
    setResidents((prev) =>
      prev.map((r) =>
        r.id === residentId
          ? {
              ...r,
              prescriptions: r.prescriptions.map((rx) =>
                rx.id === rxId ? { ...rx, refillRequested: nextRefill } : rx
              ),
            }
          : r
      )
    );

    if (user) {
      void persistToggleRefill(user.uid, residentId, rxId, nextRefill).catch(
        () => {}
      );
    }
  };

  const handleAddPrescription = (
    residentId: string,
    rx: Omit<PrescriptionItem, "id" | "refillRequested">
  ) => {
    const newRx: PrescriptionItem = {
      id: `rx-${Date.now()}`,
      ...rx,
      refillRequested: false,
    };

    setResidents((prev) =>
      prev.map((r) =>
        r.id === residentId
          ? { ...r, prescriptions: [...r.prescriptions, newRx] }
          : r
      )
    );

    if (user) {
      void persistAddPrescription(user.uid, residentId, newRx).catch(() => {});
    }
  };

  const handleAddAppointment = (
    residentId: string,
    apt: Omit<AppointmentItem, "id">
  ) => {
    const newApt: AppointmentItem = { id: `apt-${Date.now()}`, ...apt };
    setResidents((prev) =>
      prev.map((r) =>
        r.id === residentId
          ? { ...r, appointments: [...r.appointments, newApt] }
          : r
      )
    );

    if (user) {
      void persistAddAppointment(user.uid, residentId, newApt).catch(() => {});
    }
  };

  const handleUpdateComfort = (
    residentId: string,
    patch: Partial<ComfortPreferences>
  ) => {
    const current = residents.find((r) => r.id === residentId);
    if (!current) return;
    const nextComfort = { ...current.comfortPreferences, ...patch };

    setResidents((prev) =>
      prev.map((r) =>
        r.id === residentId ? { ...r, comfortPreferences: nextComfort } : r
      )
    );

    if (user) {
      void persistComfortPreferences(user.uid, residentId, nextComfort).catch(
        () => {}
      );
    }
  };

  const handleReadSummaryAloud = (summaryPrompt: string) => {
    setActive3DMode("voice");
    setExternalPromptRequest({ id: Date.now(), prompt: summaryPrompt });
    const el = document.getElementById("kindred-assistant");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Skiper6 roster: seeded circle members when present, otherwise the people we
  // actually know about for this resident (caregiver, resident, physician).
  const circleRoster = useMemo<FamilyMember[]>(() => {
    const roster: FamilyMember[] = [...activeResident.circleMembers];
    const seen = new Set(
      roster.map((member) => member.name.trim().toLowerCase()).filter(Boolean)
    );

    const addMember = (member: FamilyMember) => {
      const key = member.name.trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      roster.push(member);
    };

    if (user?.displayName || user?.email) {
      addMember({
        id: "roster-caregiver",
        name: user.displayName || user.email || "",
        role: "Signed-in caregiver",
        location: "This device",
        lastCheckIn: "Active now",
      });
    }
    addMember({
      id: "roster-resident",
      name: activeResident.name,
      role: "Resident",
      location: "At home",
      lastCheckIn: activeResident.statusLevel
        ? `Today · ${activeResident.statusLevel}`
        : "Today",
    });
    if (activeResident.doctorName) {
      const [specialty, clinic] = (activeResident.doctorSpecialty || "").split("·");
      addMember({
        id: "roster-physician",
        name: activeResident.doctorName,
        role: specialty?.trim() || "Care clinician",
        location: clinic?.trim() || "Clinic",
        lastCheckIn: "Care team",
      });
    }
    return roster.slice(0, 5);
  }, [activeResident, user?.displayName, user?.email]);

  const handleTalkWithKindred = () => {
    const section = document.getElementById("kindred-assistant");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      document.getElementById("kindred-assistant-input")?.focus();
    }, 480);
  };

  const inspectSanctuaryMode = (mode: SpatialCareMode) => {
    setActive3DMode(mode);
    const el = document.getElementById("sanctuary-view");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Google Maps Platform Case A Quota Defense Banner */}
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{" "}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{" "}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-xl font-semibold tracking-tight text-[#0F2922] whitespace-nowrap shrink-0"
          >
            Kindred Care
          </a>

          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#care-circle"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Care Circle
            </a>
            <a
              href="#resident-profile"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Profile
            </a>
            <a
              href="#lodging-living"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Lodging Hub
            </a>
            <a
              href="#family-handoff"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Handoff
            </a>
            <a
              href="#kindred-assistant"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Assistant
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {authReady && user ? (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setOnboardingDefaults({
                      name: deriveFirstName(user),
                      email: user.email || "",
                    });
                    setOnboardingOpen(true);
                  }}
                  className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-[#0D6E5C] hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {user.displayName?.split(" ")[0] || deriveFirstName(user)} · New Entry
                </button>
                <button
                  type="button"
                  onClick={handleFreebuffSignOut}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSignInModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
                Sign In
              </button>
            )}

            <a
              href="#care-plan"
              className="inline-flex items-center justify-center rounded-xl bg-[#0F2922] text-white px-4 py-2 text-xs font-medium hover:bg-[#163b31] transition-colors whitespace-nowrap shrink-0"
            >
              Start Care Plan
            </a>
          </div>
        </div>
      </header>

      <main
        id="top"
        className={`flex-1 ${
          fontScale === "large"
            ? "senior-scale-large"
            : fontScale === "comfortable"
              ? "senior-scale-comfortable"
              : ""
        } ${highContrast ? "senior-high-contrast" : ""}`}
      >
        {/* Hero Section with Subtle 3D Interactive Sanctuary & Ambient Soundscapes */}
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-20">
          {/* Ambient kinetic backdrop — slowly drifting colour fields behind the opening page */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="kindred-aurora absolute -top-32 -left-24 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(13,110,92,0.16),transparent_65%)] blur-2xl" />
            <div className="kindred-aurora-reverse absolute -top-10 right-[-120px] h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(217,162,74,0.16),transparent_65%)] blur-2xl" />
            <div className="kindred-aurora absolute bottom-[-160px] left-1/3 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.10),transparent_65%)] blur-2xl" />
          </div>
          <div className="relative max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Editorial Proposition */}
              <div className="lg:col-span-5 space-y-6 kindred-hero-stack">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-flex items-center gap-2 rounded-full border border-[#0D6E5C]/20 bg-[#0D6E5C]/[0.06] px-3 py-1.5"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0D6E5C] opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#0D6E5C]" />
                  </span>
                  <p className="text-xs font-medium text-[#0D6E5C] tracking-wide">
                    Home Eldercare &amp; Family Coordination
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                >
                  <KineticHeadline
                    as="h1"
                    trigger="mount"
                    delayStep={0.05}
                    text="Independent living at home, guided by a calm voice"
                    className="block text-[clamp(2.25rem,4vw,3.5rem)] font-medium leading-[1.12] tracking-tight text-slate-950"
                  />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="text-base text-slate-600 leading-relaxed max-w-xl"
                >
                  Kindred Care connects older adults and their families through a
                  camera-free home sanctuary, shared daily medication and safety logs,
                  nearby hospital lookup, and a patient Gemini voice companion.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-wrap items-center gap-4 pt-1"
                >
                  <button
                    type="button"
                    onClick={handleTalkWithKindred}
                    className="group inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0D6E5C] text-white px-5 py-3 text-sm font-medium shadow-[0_1px_2px_rgba(13,110,92,0.25)] transition-all duration-300 hover:bg-[#095547] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(13,110,92,0.55)] whitespace-nowrap shrink-0"
                  >
                    <Mic
                      className="w-4 h-4 transition-transform duration-300 group-hover:scale-110"
                      aria-hidden="true"
                    />
                    Talk with Kindred
                  </button>
                  <a
                    href="#kindred-assistant"
                    className="group inline-flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
                  >
                    Ask the assistant
                    <ArrowRight
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </a>
                </motion.div>

                {/* Clean unboxed trust metadata */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.34 }}
                  className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500"
                >
                  <span>Camera-free millimeter sensing</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">96.4% medication adherence</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {syncNotice ||
                      (user
                        ? "Freebuff session active"
                        : "Sign in with Freebuff to save care records")}
                  </span>
                </motion.div>
              </div>

              {/* Right Interactive Sanctuary Card with Subtle 3D Transitions */}
              <div id="sanctuary-view" className="lg:col-span-7">
                <CareHub3D
                  activeMode={active3DMode}
                  onModeChange={setActive3DMode}
                  voiceActive={voiceActive}
                  voiceAmplitudeRef={voiceAmplitudeRef}
                  residentName={activeResident.name}
                  residentStatus={activeResident.statusLevel}
                />
              </div>
            </div>

            {/* Full-Width 4-Column Quick Capability Strip below Hero Split */}
            <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  index: "01",
                  title: "Sanctuary Presence",
                  body: "Calm home rhythm mapping across living spaces with zero video.",
                  mode: "overview" as const,
                },
                {
                  index: "02",
                  title: "Medication Timing",
                  body: "Gentle mealtime audio cues paired with live family check-offs.",
                  mode: "medications" as const,
                },
                {
                  index: "03",
                  title: "Fall & Path Guard",
                  body: "Detects hallway stumbles and alerts designated family in 14s.",
                  mode: "safety" as const,
                },
                {
                  index: "04",
                  title: "Gemini Voice Companion",
                  body: "Spoken reminders, grounded health info, and family recall.",
                  mode: "voice" as const,
                },
              ].map((capability, capabilityIndex) => (
                <motion.div
                  key={capability.index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.55,
                    delay: 0.42 + capabilityIndex * 0.07,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="h-full"
                >
                  <Perspective3DCard className="h-full rounded-2xl">
                    <button
                      type="button"
                      onClick={() => inspectSanctuaryMode(capability.mode)}
                      className="group relative flex h-full w-full cursor-pointer flex-col rounded-2xl border border-slate-200/80 bg-white/60 p-5 text-left transition-[border-color,background-color,box-shadow] duration-300 hover:border-[#0D6E5C]/35 hover:bg-white hover:shadow-[0_18px_40px_-26px_rgba(13,110,92,0.55)]"
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0D6E5C]/[0.07] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-5 top-5 h-6 w-[2px] origin-top scale-y-0 rounded-full bg-[#0D6E5C] transition-transform duration-300 group-hover:scale-y-100"
                      />
                      <p className="text-xs text-slate-500 font-mono-tabular">
                        {capability.index}
                      </p>
                      <p className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-slate-900 transition-colors duration-300 group-hover:text-[#0D6E5C]">
                        {capability.title}
                        <ArrowRight
                          aria-hidden="true"
                          className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                        />
                      </p>
                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                        {capability.body}
                      </p>
                    </button>
                  </Perspective3DCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Skiper6-Inspired Care Circle Roster: hover to reveal each member */}
        <section className="pb-16 lg:pb-20">
          <div className="relative max-w-[1200px] mx-auto px-6">
            <SpatialDepthReveal>
              <HoverMemberCircle
                members={circleRoster}
                residentName={activeResident.name.split(" ")[0]}
              />
            </SpatialDepthReveal>
          </div>
        </section>

        {/* Skiper76-Inspired Interactive Apple-Showcase Feature Block */}
        <SkiperFeatureShowcase />

        {/* Core Platform Capabilities: Asymmetric Bento Grid with 3D Hover Transitions */}
        <section
          id="platform"
          className="py-20 border-t border-slate-200 bg-white"
        >
          <div className="max-w-[1200px] mx-auto px-6">
            <SpatialDepthReveal className="max-w-2xl mb-12">
              <p className="text-xs font-medium text-[#0D6E5C] tracking-wide">
                01. Designed for Dignity at Home
              </p>
              <KineticHeadline
                as="h2"
                text="Thoughtful support that blends into everyday household life"
                className="mt-2 text-3xl lg:text-4xl font-medium tracking-tight text-slate-900"
              />
              <p className="mt-3 text-base text-slate-600 leading-relaxed">
                Instead of clinical wall panels or intrusive ceiling cameras, Kindred
                lives beside a morning cup of tea and keeps every family caregiver
                in quiet agreement.
              </p>
            </SpatialDepthReveal>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Primary Wide Editorial Card */}
              <Perspective3DCard className="lg:col-span-7 group rounded-2xl border border-slate-200 bg-[#F8FAFC] overflow-hidden flex flex-col">
                <div className="w-full flex-1 min-h-[280px] overflow-hidden bg-slate-200">
                  <ResilientPhoto
                    src="/assets/images/eldercare_living_sunlight_1794715912243.jpg"
                    alt="Older father and adult daughter enjoying morning tea in a sunlit living room"
                    fallbackTitle="Shared Morning Family Rhythm"
                  />
                </div>
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-mono-tabular">
                      01 · Family Continuity
                    </p>
                    <h3 className="mt-2 text-2xl font-medium text-slate-900">
                      Shared care circles without endless group-text confusion
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Siblings, visiting aides, and primary clinicians share one
                      living timeline. When a prescription refills or a safety log
                      resolves, everyone sees the update in real time.
                    </p>
                  </div>
                  <div className="mt-6">
                    <a
                      href="#care-circle"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0D6E5C] hover:underline"
                    >
                      Try the live Family Circle board
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </Perspective3DCard>

              {/* Stacked Right Bento Column */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <Perspective3DCard className="group rounded-2xl border border-slate-200 bg-[#F8FAFC] overflow-hidden flex-1 flex flex-col">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-slate-200">
                    <ResilientPhoto
                      src="/assets/images/caregiver_medication_tablet_1794715912691.jpg"
                      alt="Minimalist ceramic medication organizer beside chamomile tea and large-print daily care schedule"
                      fallbackTitle="Daily Medication Rhythm"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-slate-500 font-mono-tabular">
                      02 · Medication &amp; Hydration Rhythm
                    </p>
                    <h3 className="mt-1.5 text-xl font-medium text-slate-900">
                      Large-print cues and spoken mealtime prompts
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                      Clear, unhurried reminders synced to breakfast, afternoon tea,
                      and evening wind-down.
                    </p>
                  </div>
                </Perspective3DCard>

                <Perspective3DCard className="group rounded-2xl border border-slate-200 bg-[#F8FAFC] overflow-hidden flex-1 flex flex-col">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-slate-200">
                    <ResilientPhoto
                      src="/assets/images/family_garden_walk_1794715913136.jpg"
                      alt="Smiling older mother walking with her adult son along a sunlit neighborhood garden pathway"
                      fallbackTitle="Active Mobility Confidence"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-slate-500 font-mono-tabular">
                      03 · Mobility &amp; Gait Continuity
                    </p>
                    <p className="mt-1.5 text-xl font-medium text-slate-900">
                      Celebrate daily movement and spot quiet changes early
                    </p>
                  </div>
                </Perspective3DCard>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Family Care Circle, Recharts 7-Day Trend & Security Logs Workbench */}
        <CareCircleWorkbench
          residents={residents}
          activeResidentId={activeResidentId}
          onSelectResident={handleSelectResident}
          onToggleTask={handleToggleTask}
          onAddTask={handleAddTask}
          onLogHydrationDelta={handleLogHydrationDelta}
          onUpdateHydrationGoal={handleUpdateHydrationGoal}
          onAddNote={handleAddNote}
          onResolveSecurityLog={handleResolveSecurityLog}
          onUpdateTodayWellness={handleUpdateTodayWellness}
          onReadSummaryAloud={handleReadSummaryAloud}
          onOpenPhysicianReport={() => setPhysicianReportOpen(true)}
          onOpenQuickAlert={() => setQuickAlertOpen(true)}
          onOpenQuickPage={() => setQuickPageOpen(true)}
          onOpenNewPatientForm={() => {
            setOnboardingDefaults({
              name: user ? deriveFirstName(user) : "",
              email: user?.email || "",
            });
            setOnboardingOpen(true);
          }}
          onOpenDoctorConnect={(tab) => setDoctorModalState({ open: true, tab })}
          familyPages={familyPages.filter((p) => p.residentId === activeResident.id)}
          onAcknowledgePage={handleAcknowledgePage}
          autoMedReminders={autoMedReminders}
          onToggleAutoMedReminders={() => setAutoMedReminders((v) => !v)}
          reminderChannel={reminderChannel}
          onChangeReminderChannel={setReminderChannel}
          onTriggerMedicationReminder={() => void handleTriggerMedicationReminder()}
          lastMedReminderSentAt={lastMedReminderSentAt}
        />

        {/* Sleep Tracking + Daily Cognitive Training (Skiper27 & Skiper80 kinetics) */}
        <section
          id="rest-and-brain"
          className="py-20 border-t border-slate-200 bg-[#F8FAFC]"
        >
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="max-w-2xl mb-10">
              <p className="text-xs font-medium text-[#0D6E5C] tracking-wide">
                03. Rest &amp; Cognitive Rhythm
              </p>
              <KineticHeadline
                as="h2"
                text="Better nights, steadier mornings, gentler brain training"
                className="mt-2 text-3xl lg:text-4xl font-medium tracking-tight text-slate-900"
              />
              <p className="mt-3 text-base text-slate-600 leading-relaxed">
                Caregivers log how the night actually went, and short daily
                exercises keep recall and sequencing comfortable — both feeding
                the same resident wellness history your physician report reads
                from.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 flex">
                <SleepTracker
                  resident={activeResident}
                  onLogSleep={handleLogSleep}
                />
              </div>
              <div className="lg:col-span-7 flex">
                <CognitiveGames
                  resident={activeResident}
                  onSessionComplete={handleCognitiveSession}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Comprehensive Resident Profile & Clinical Hub */}
        <ResidentProfileSection
          resident={activeResident}
          onUpdateStatus={handleUpdateStatus}
          onAddVital={handleAddVital}
          onAddMedicalFlag={handleAddMedicalFlag}
          onToggleRefill={handleToggleRefill}
          onAddPrescription={handleAddPrescription}
          onAddAppointment={handleAddAppointment}
          onUpdateComfort={handleUpdateComfort}
          onIncrementHydration={(id) => handleLogHydrationDelta(id, 1)}
          onShareMilestoneNote={(residentId, milestoneTitle) =>
            handleAddNote(
              residentId,
              "Kindred Milestones",
              `Celebrated milestone: ${milestoneTitle}.`
            )
          }
          onOpenPhysicianReport={() => setPhysicianReportOpen(true)}
          onOpenDoctorConnect={(tab) => setDoctorModalState({ open: true, tab })}
        />

        {/* Senior Lodging & Aging Care Suite (10 Living Features + Skiper27 & Skiper80 Kinetics) */}
        <SeniorLodgingHub
          resident={activeResident}
          fontScale={fontScale}
          onChangeFontScale={setFontScale}
          highContrast={highContrast}
          onToggleHighContrast={() => setHighContrast((c) => !c)}
          onAddNote={handleAddNote}
          onAddTask={handleAddTask}
          onAddAppointment={handleAddAppointment}
          onToggleRefill={handleToggleRefill}
          onBoostActivity={(residentId) => {
            const currentToday =
              activeResident.wellnessHistory[
                activeResident.wellnessHistory.length - 1
              ];
            handleUpdateTodayWellness(residentId, {
              activityScore: Math.min(100, (currentToday?.activityScore || 78) + 6),
            });
          }}
          onReadSummaryAloud={handleReadSummaryAloud}
        />

        {/* Shared Family Reminiscence Gallery with Gemini Multimodal Memory Context + Skiper80 */}
        <ReminiscenceGallery
          resident={activeResident}
          onAddNote={handleAddNote}
          onReadSummaryAloud={handleReadSummaryAloud}
        />

        {/* 10 Additional Senior Living Modules in Interactive Skiper80 Explorer */}
        <ExtendedCareSkiper80Hub
          resident={activeResident}
          onAddNote={handleAddNote}
          onAddTask={handleAddTask}
          onUpdateComfort={handleUpdateComfort}
          onUpdateHydrationGoal={handleUpdateHydrationGoal}
          onOpenDoctorConnect={(tab) => setDoctorModalState({ open: true, tab })}
        />


        {/* Clinical Proof & Attributable Stories */}
        <section className="py-20 border-t border-slate-200 bg-[#F8FAFC]">
          <div className="max-w-[1200px] mx-auto px-6">
            <SpatialDepthReveal className="max-w-2xl mb-12">
              <p className="text-xs font-medium text-[#0D6E5C] tracking-wide">
                05. Verified Household Outcomes
              </p>
              <KineticHeadline
                as="h2"
                text="Measured peace of mind across families and geriatric practices"
                className="mt-2 text-3xl lg:text-4xl font-medium tracking-tight text-slate-900"
              />
            </SpatialDepthReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 border-b border-slate-200">
              {CLINICAL_OUTCOMES.map((item) => (
                <Perspective3DCard
                  key={item.metric}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <p className="font-mono-tabular text-3xl font-semibold text-[#0D6E5C]">
                    {item.metric}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900 leading-snug">
                    {item.label}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {item.context}
                  </p>
                </Perspective3DCard>
              ))}
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {CAREGIVER_STORIES.map((story) => (
                <Perspective3DCard
                  key={story.name}
                  className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col justify-between"
                >
                  <blockquote>
                    <p className="text-base text-slate-800 leading-relaxed">
                      &ldquo;{story.quote}&rdquo;
                    </p>
                    <footer className="mt-6 pt-4 border-t border-slate-200">
                      <p className="text-sm font-semibold text-slate-900">
                        {story.name}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {story.role} · {story.organization}
                      </p>
                    </footer>
                  </blockquote>
                </Perspective3DCard>
              ))}
            </div>
          </div>
        </section>

        {/* Kindred Companion: local, key-free care assistant */}
        <KindredAssistant
          resident={activeResident}
          caregiverName={user?.displayName ?? undefined}
          externalPromptRequest={externalPromptRequest}
        />

        {/* Family handoff: appointments, board, emergency contacts, generated note */}
        <FamilyHandoffHub resident={activeResident} caregiverName={user?.displayName ?? undefined} />

        {/* Vitals, mood and safety studio */}
        <HealthVitalsStudio resident={activeResident} />

        {/* Weekly digest, badges and doctor visit prep */}
        <CareProgressDigest resident={activeResident} />

        {/* Care Plan Consultation Intake */}
        <CareInquirySection />
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 pb-24 md:pb-10">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-display text-base font-semibold text-[#0F2922]">
              Kindred Care
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Ambient home eldercare coordination and conversational support.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
            <a href="#care-circle" className="hover:text-slate-900">
              Care Circle
            </a>
            <a href="#resident-profile" className="hover:text-slate-900">
              Profile
            </a>
            <a href="#lodging-living" className="hover:text-slate-900">
              Lodging Hub
            </a>
            <a href="#reminiscence-gallery" className="hover:text-slate-900">
              Memories
            </a>
            <a href="#extended-care-modules" className="hover:text-slate-900">
              Care Modules
            </a>
            <a href="#family-handoff" className="hover:text-slate-900">
              Handoff
            </a>
            <a href="#kindred-assistant" className="hover:text-slate-900">
              Assistant
            </a>
            <span className="text-slate-400">© 2026 Kindred Care</span>
          </div>
        </div>
      </footer>

      {/* Mobile Floating Quick Alert Action Button & Emergency Sequence Sheet */}
      <MobileQuickAlert
        resident={activeResident}
        open={quickAlertOpen}
        onOpenChange={setQuickAlertOpen}
        onExecuteAlertSequence={handleExecuteQuickAlertSequence}
      />

      {/* Physician Weekly Health & Medication Adherence PDF Report Dialog */}
      <PhysicianReportModal
        open={physicianReportOpen}
        resident={activeResident}
        onClose={() => setPhysicianReportOpen(false)}
      />

      {/* Non-Emergency Quick Page Coordination Modal & Live In-App Toast */}
      <QuickPageModal
        open={quickPageOpen}
        resident={activeResident}
        senderName={user?.displayName || "Clara Pendelton"}
        onClose={() => setQuickPageOpen(false)}
        onSendQuickPage={handleSendQuickPage}
      />

      <QuickPageNotificationToast
        notification={activeToastPage}
        onAcknowledge={handleAcknowledgePage}
        onDismiss={() => setActiveToastPage(null)}
      />

      {/* Automated Personalized Medication Reminder Push/SMS Toast */}
      <MedicationReminderToast
        alert={activeMedToast}
        onMarkTaken={handleToggleTask}
        onDismiss={() => setActiveMedToast(null)}
      />

      {/* Sign In & Email ID Patient Enrollment Portal */}
      <SignInPortalModal
        open={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
        onFreebuffSignIn={handleFreebuffSignIn}
        onProceedWithEmailOnboarding={(name, email) => {
          setOnboardingDefaults({ name, email });
          setOnboardingOpen(true);
        }}
      />

      {/* New Patient & Full Parameter Onboarding Form */}
      <PatientOnboardingModal
        open={onboardingOpen}
        defaultName={onboardingDefaults.name}
        defaultEmail={onboardingDefaults.email}
        onClose={() => setOnboardingOpen(false)}
        onCreateResident={handleCreateResident}
      />

      {/* Primary Physician Contact & Appointment Scheduler Modal */}
      <DoctorConnectModal
        open={doctorModalState.open}
        initialTab={doctorModalState.tab}
        resident={activeResident}
        onClose={() =>
          setDoctorModalState((prev) => ({ ...prev, open: false }))
        }
        onAddAppointment={handleAddAppointment}
        onAddNote={handleAddNote}
      />
    </div>
  );
}
