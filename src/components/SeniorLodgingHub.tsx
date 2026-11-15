import { useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Accessibility,
  AlertTriangle,
  Bus,
  Check,
  CheckCircle2,
  ClipboardCheck,
  HeartHandshake,
  KeyRound,
  Pill,
  Plus,
  ShieldAlert,
  Smile,
  Utensils,
  Wrench,
} from "lucide-react";
import type {
  AppointmentItem,
  CareTaskItem,
  ResidentProfile,
} from "../data/eldercareData";
import {
  AccessibilityReaderBar,
  type ReaderFontScale,
} from "./AccessibilityReaderBar";
import {
  RollingActionLabel,
  Skiper27RollingText,
  Skiper80LodgeShowcase,
  type LodgeProgramItem,
} from "./SkiperKineticPrimitives";
import { SeniorMindBodyStudio } from "./SeniorMindBodyStudio";

interface SeniorLodgingHubProps {
  resident: ResidentProfile;
  fontScale: ReaderFontScale;
  onChangeFontScale: (scale: ReaderFontScale) => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  onAddNote: (residentId: string, author: string, text: string) => void;
  onAddTask: (
    residentId: string,
    task: Omit<CareTaskItem, "id" | "completed">
  ) => void;
  onAddAppointment: (residentId: string, apt: Omit<AppointmentItem, "id">) => void;
  onToggleRefill: (residentId: string, rxId: string) => void;
  onBoostActivity: (residentId: string) => void;
  onReadSummaryAloud: (prompt: string) => void;
}

type LodgingSuiteTab = "daily" | "suite" | "wellness";

interface MealOption {
  id: string;
  period: "Breakfast" | "Lunch" | "Dinner";
  title: string;
  dietTag: string;
  ingredients: string[];
}

const LODGE_MENU: MealOption[] = [
  {
    id: "m-b1",
    period: "Breakfast",
    title: "Warm Steel-Cut Oatmeal with Poached Pear",
    dietTag: "Heart-Healthy · Soft Texture",
    ingredients: ["oats", "pear", "cinnamon"],
  },
  {
    id: "m-b2",
    period: "Breakfast",
    title: "Soft-Scrambled Eggs & Herb Toast",
    dietTag: "High Protein · Easy Chew",
    ingredients: ["eggs", "wheat", "parsley"],
  },
  {
    id: "m-l1",
    period: "Lunch",
    title: "Roasted Butternut Squash Soup & Chamomile Tea",
    dietTag: "Low Sodium · Easy Swallow",
    ingredients: ["squash", "greens", "chamomile"],
  },
  {
    id: "m-l2",
    period: "Lunch",
    title: "Poached Wild Salmon & Steamed Rice",
    dietTag: "Omega-3 · Tender Flake",
    ingredients: ["fish", "rice", "lemon"],
  },
  {
    id: "m-l3",
    period: "Lunch",
    title: "Coastal Shrimp & Herb Bisque",
    dietTag: "Chef Special · Classic",
    ingredients: ["shellfish", "shrimp", "cream"],
  },
  {
    id: "m-d1",
    period: "Dinner",
    title: "Herb-Roasted Chicken Breast & Mash",
    dietTag: "Low Sodium · Soft Cut",
    ingredients: ["chicken", "potato", "thyme"],
  },
  {
    id: "m-d2",
    period: "Dinner",
    title: "Mediterranean Lentil Stew & Seeded Roll",
    dietTag: "Fiber-Rich · Plant Protein",
    ingredients: ["lentils", "carrot", "olive oil"],
  },
];

interface MaintenanceTicket {
  id: string;
  title: string;
  priority: "Routine" | "Safety Fix";
  status: "Requested" | "Scheduled" | "Completed";
  createdAt: string;
}

interface SafetyAuditItem {
  id: string;
  label: string;
  zone: string;
  checked: boolean;
}

interface VisitorPass {
  id: string;
  name: string;
  relation: string;
  expectedWindow: string;
  passCode: string;
  status: "Expected" | "Checked In" | "Departed";
}

const INITIAL_TICKETS: MaintenanceTicket[] = [
  {
    id: "maint-1",
    title: "Replace warm bulb in bathroom mirror fixture",
    priority: "Safety Fix",
    status: "Scheduled",
    createdAt: "Today · 09:20 AM",
  },
  {
    id: "maint-2",
    title: "Fresh cotton bath towels & bed linen change",
    priority: "Routine",
    status: "Requested",
    createdAt: "Today · 11:05 AM",
  },
];

const INITIAL_SAFETY_ITEMS: SafetyAuditItem[] = [
  { id: "sf-1", label: "Non-slip bath mat flat & dry", zone: "Bathroom", checked: true },
  { id: "sf-2", label: "Hallway walking path clear of cords & rugs", zone: "Corridor", checked: true },
  { id: "sf-3", label: "Dusk-to-dawn low-glare nightlight active", zone: "Bedroom", checked: true },
  { id: "sf-4", label: "Shower & bedside grab bars tested tight", zone: "Bathroom", checked: true },
  { id: "sf-5", label: "Bedside water carafe within seated reach", zone: "Living Area", checked: false },
];

const INITIAL_VISITORS: VisitorPass[] = [
  {
    id: "vp-1",
    name: "Clara Pendelton",
    relation: "Daughter",
    expectedWindow: "Today · 4:15 PM",
    passCode: "482-910",
    status: "Expected",
  },
  {
    id: "vp-2",
    name: "Nadia Okafor, PT",
    relation: "Physical Therapist",
    expectedWindow: "Tomorrow · 1:30 PM",
    passCode: "739-204",
    status: "Expected",
  },
];

export function SeniorLodgingHub({
  resident,
  fontScale,
  onChangeFontScale,
  highContrast,
  onToggleHighContrast,
  onAddNote,
  onAddTask,
  onAddAppointment,
  onToggleRefill,
  onBoostActivity,
  onReadSummaryAloud,
}: SeniorLodgingHubProps) {
  const prefersReducedMotion = useReducedMotion();
  const [suiteTab, setSuiteTab] = useState<LodgingSuiteTab>("daily");

  // Feature 2: Dietary & Meal Tray State
  const [mealPeriod, setMealPeriod] = useState<"Breakfast" | "Lunch" | "Dinner">("Lunch");
  const [selectedMealId, setSelectedMealId] = useState<string>("m-l1");
  const [appetiteLevel, setAppetiteLevel] = useState<
    "Full appetite" | "Half portion" | "Warm soup & tea only"
  >("Full appetite");
  const [mealSavedBanner, setMealSavedBanner] = useState<string | null>(null);

  // Feature 3: Suite Housekeeping & Maintenance Queue
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(INITIAL_TICKETS);
  const [newTicketText, setNewTicketText] = useState("");
  const [newTicketPriority, setNewTicketPriority] = useState<
    "Routine" | "Safety Fix"
  >("Routine");

  // Feature 4: Skiper80 Community RSVPs
  const [rsvpedPrograms, setRsvpedPrograms] = useState<string[]>([]);

  // Feature 5: Assisted Lodge Shuttle Booking
  const [rideDestination, setRideDestination] = useState("Cedar Valley Clinic");
  const [rideMobility, setRideMobility] = useState<
    "Cane Assist" | "Rollator Support" | "Wheelchair Escort"
  >("Wheelchair Escort");
  const [rideDate, setRideDate] = useState("Tomorrow");
  const [rideTime, setRideTime] = useState("10:00 AM");
  const [rideConfirmed, setRideConfirmed] = useState<string | null>(null);

  // Feature 7: Fall-Risk Suite Safety Audit
  const [safetyItems, setSafetyItems] =
    useState<SafetyAuditItem[]>(INITIAL_SAFETY_ITEMS);

  // Feature 8: Visual 4-Slot Pill Organizer Verifications
  const [verifiedSlots, setVerifiedSlots] = useState<Record<string, boolean>>({
    Morning: true,
    Midday: false,
    Evening: false,
    Bedtime: false,
  });

  // Feature 9: Mood, Comfort & Pain Check-In
  const [mood, setMood] = useState<
    "Peaceful" | "Cheerful" | "Tired" | "Unsteady" | "In Discomfort"
  >("Peaceful");
  const [comfortScore, setComfortScore] = useState<number>(2);
  const [comfortNoteChips, setComfortNoteChips] = useState<string[]>([]);
  const [checkInConfirmed, setCheckInConfirmed] = useState(false);

  // Feature 10: Front-Desk Visitor Pass Registry
  const [visitors, setVisitors] = useState<VisitorPass[]>(INITIAL_VISITORS);
  const [visitorName, setVisitorName] = useState("");
  const [visitorRelation, setVisitorRelation] = useState("Family Member");
  const [visitorWindow, setVisitorWindow] = useState("Today · 5:30 PM");

  // Allergen check helper against resident.allergies
  const hasAllergyConflict = (ingredients: string[]) => {
    const allergyText = resident.allergies.join(" ").toLowerCase();
    return ingredients.filter((ing) => allergyText.includes(ing.toLowerCase()));
  };

  const periodMeals = useMemo(
    () => LODGE_MENU.filter((m) => m.period === mealPeriod),
    [mealPeriod]
  );

  const selectedMeal =
    periodMeals.find((m) => m.id === selectedMealId) || periodMeals[0];
  const selectedMealConflicts = selectedMeal
    ? hasAllergyConflict(selectedMeal.ingredients)
    : [];

  // Pill Tray Slots derived dynamically from active prescriptions
  const pillTraySlots = useMemo(() => {
    const slots: Array<{
      slot: "Morning" | "Midday" | "Evening" | "Bedtime";
      windowLabel: string;
      items: typeof resident.prescriptions;
    }> = [
      { slot: "Morning", windowLabel: "07:30 – 09:30 AM", items: [] },
      { slot: "Midday", windowLabel: "12:00 – 02:00 PM", items: [] },
      { slot: "Evening", windowLabel: "05:30 – 07:30 PM", items: [] },
      { slot: "Bedtime", windowLabel: "08:30 – 10:00 PM", items: [] },
    ];

    resident.prescriptions.forEach((rx) => {
      const t = rx.timing.toLowerCase();
      if (t.includes("pm") || t.includes("dinner") || t.includes("evening")) {
        if (t.includes("9:") || t.includes("10:") || t.includes("nightly")) {
          slots[3].items.push(rx);
        } else {
          slots[2].items.push(rx);
        }
      } else if (t.includes("noon") || t.includes("lunch") || t.includes("12:")) {
        slots[1].items.push(rx);
      } else {
        slots[0].items.push(rx);
      }
    });
    return slots;
  }, [resident.prescriptions]);

  const safetyCheckedCount = safetyItems.filter((s) => s.checked).length;
  const safetyPct = Math.round((safetyCheckedCount / safetyItems.length) * 100);

  // Handlers
  const handleConfirmMealTray = () => {
    if (!selectedMeal || selectedMealConflicts.length > 0) return;
    onAddNote(
      resident.id,
      "Dining Service",
      `Confirmed ${mealPeriod} tray for ${resident.name}: "${selectedMeal.title}" (${appetiteLevel}).`
    );
    setMealSavedBanner(`${selectedMeal.title} sent to dining team`);
    window.setTimeout(() => setMealSavedBanner(null), 3200);
  };

  const handleSubmitMaintenance = (
    titleOverride?: string,
    priorityOverride?: "Routine" | "Safety Fix"
  ) => {
    const title = (titleOverride ?? newTicketText).trim();
    if (!title) return;
    const priority = priorityOverride ?? newTicketPriority;
    const ticket: MaintenanceTicket = {
      id: `maint-${Date.now()}`,
      title,
      priority,
      status: "Requested",
      createdAt: `Today · ${new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    };
    setTickets((prev) => [ticket, ...prev]);
    if (!titleOverride) setNewTicketText("");
    onAddNote(
      resident.id,
      "Suite Services",
      `Submitted ${priority.toLowerCase()} lodge request: "${title}".`
    );
  };

  const handleAdvanceTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const nextStatus =
          t.status === "Requested"
            ? "Scheduled"
            : t.status === "Scheduled"
              ? "Completed"
              : "Completed";
        return { ...t, status: nextStatus };
      })
    );
  };

  const handleRsvpProgram = (program: LodgeProgramItem) => {
    if (rsvpedPrograms.includes(program.id)) return;
    setRsvpedPrograms((prev) => [...prev, program.id]);
    onAddTask(resident.id, {
      time: program.time,
      title: program.title,
      detail: `${program.location} · ${program.accessibilityNote}`,
      category: program.category === "Mobility" ? "Mobility" : "Family",
    });
    onAddNote(
      resident.id,
      "Lodge Activities",
      `RSVPed ${resident.name} for "${program.title}" at ${program.time} (${program.location}).`
    );
  };

  const handleBookRideForProgram = (program: LodgeProgramItem) => {
    setRideDestination(program.location);
    setRideTime(program.time);
    setRideDate("Today");
    setSuiteTab("suite");
  };

  const handleBookShuttle = (e: FormEvent) => {
    e.preventDefault();
    onAddAppointment(resident.id, {
      date: rideDate,
      time: rideTime,
      title: `Assisted Shuttle to ${rideDestination} (${rideMobility})`,
      withPerson: "Lodge Escort Transport",
      mode: "Home Visit",
    });
    onAddNote(
      resident.id,
      "Lodge Transport",
      `Booked assisted door-to-door ride to ${rideDestination} on ${rideDate} at ${rideTime} (${rideMobility}).`
    );
    setRideConfirmed(`${rideDestination} · ${rideDate} at ${rideTime}`);
    window.setTimeout(() => setRideConfirmed(null), 3600);
  };

  const handleSubmitCheckIn = () => {
    const chipsSummary =
      comfortNoteChips.length > 0 ? ` Requests: ${comfortNoteChips.join(", ")}.` : "";
    const alertTag =
      mood === "Unsteady" || mood === "In Discomfort" || comfortScore >= 6
        ? " [Priority family & nurse check-in requested]"
        : "";
    onAddNote(
      resident.id,
      resident.name.split(" ")[0],
      `Daily Comfort Check-In — Mood: ${mood}, Discomfort level: ${comfortScore}/10.${chipsSummary}${alertTag}`
    );
    setCheckInConfirmed(true);
    window.setTimeout(() => setCheckInConfirmed(false), 3000);
  };

  const handleAddVisitor = (e: FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) return;
    const code = `${Math.floor(100 + Math.random() * 899)}-${Math.floor(
      100 + Math.random() * 899
    )}`;
    const pass: VisitorPass = {
      id: `vp-${Date.now()}`,
      name: visitorName.trim(),
      relation: visitorRelation,
      expectedWindow: visitorWindow,
      passCode: code,
      status: "Expected",
    };
    setVisitors((prev) => [pass, ...prev]);
    onAddNote(
      resident.id,
      "Front Desk Registry",
      `Issued visitor pass ${code} for ${pass.name} (${pass.relation}) arriving ${pass.expectedWindow}.`
    );
    setVisitorName("");
  };

  const handleCycleVisitorStatus = (id: string) => {
    setVisitors((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        const nextStatus =
          v.status === "Expected"
            ? "Checked In"
            : v.status === "Checked In"
              ? "Departed"
              : "Expected";
        if (nextStatus === "Checked In") {
          onAddNote(
            resident.id,
            "Front Desk Registry",
            `${v.name} (${v.relation}) checked in to visit ${resident.name}.`
          );
        }
        return { ...v, status: nextStatus };
      })
    );
  };

  return (
    <section
      id="lodging-living"
      className="py-20 border-t border-slate-200 bg-[#F8FAFC]"
    >
      <div className="max-w-[1200px] mx-auto px-6 space-y-10">
        {/* Section Heading powered by Skiper27RollingText */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#0D6E5C] tracking-wide">
              04. Senior Lodging &amp; Independent Living Suite
            </p>
            <Skiper27RollingText
              as="h2"
              text="Everyday comfort, dining, rides, and calm routines"
              className="mt-2 text-3xl lg:text-4xl font-medium tracking-tight text-slate-900 text-balance"
            />
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              Designed specifically for aging residents living in senior lodging
              suites or assisted households—combining allergen-safe meals, suite
              maintenance, fall audits, escorted transport, mind-body calm, and
              shared lodge social life.
            </p>
          </div>

          {/* Hub Navigation Tabs */}
          <div
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white border border-slate-200 self-start lg:self-auto"
            role="tablist"
            aria-label="Senior lodging living views"
          >
            {(
              [
                { id: "daily", label: "Dining, Mood & Pill Tray" },
                { id: "suite", label: "Suite Safety, Rides & Visitors" },
                { id: "wellness", label: "Mind, Breathing & Mobility" },
              ] as { id: LodgingSuiteTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={suiteTab === tab.id}
                onClick={() => setSuiteTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  suiteTab === tab.id
                    ? "bg-[#0F2922] text-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feature 1: Large-Print & High-Contrast Accessibility Reader Strip */}
        <AccessibilityReaderBar
          residentName={resident.name}
          fontScale={fontScale}
          onChangeFontScale={onChangeFontScale}
          highContrast={highContrast}
          onToggleHighContrast={onToggleHighContrast}
          onReadLodgingBrief={() =>
            onReadSummaryAloud(
              `Please share a warm lodging brief for ${resident.name}: dining preference for ${mealPeriod} is "${selectedMeal?.title}", suite fall-prevention audit is ${safetyPct}% clear, ${visitors.length} visitor passes are registered, and the conservatory Tai Chi and Jazz Lounge are open today.`
            )
          }
        />

        {/* Active Suite Tab Content */}
        <div className="perspective-stage">
          <AnimatePresence mode="wait">
            {suiteTab === "daily" && (
              <motion.div
                key="lodging-daily"
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotateX: 4, y: 10 }
                }
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotateX: -4, y: -10 }
                }
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Feature 2: Allergen-Aware Meal & Dietary Tray Planner */}
                  <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                            <Utensils className="w-4 h-4 text-[#0D6E5C]" aria-hidden="true" />
                            Allergen-Screened Meal &amp; Tea Planner
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Auto-checks against allergies:{" "}
                            <span className="font-medium text-rose-700">
                              {resident.allergies.join(", ") || "None on file"}
                            </span>
                          </p>
                        </div>

                        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100">
                          {(["Breakfast", "Lunch", "Dinner"] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                setMealPeriod(p);
                                const first = LODGE_MENU.find((m) => m.period === p);
                                if (first) setSelectedMealId(first.id);
                              }}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                mealPeriod === p
                                  ? "bg-white text-slate-900 shadow-xs"
                                  : "text-slate-600"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {periodMeals.map((meal) => {
                          const conflicts = hasAllergyConflict(meal.ingredients);
                          const blocked = conflicts.length > 0;
                          const selected = selectedMeal?.id === meal.id;

                          return (
                            <button
                              key={meal.id}
                              type="button"
                              onClick={() => setSelectedMealId(meal.id)}
                              className={`w-full text-left rounded-xl border p-3.5 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                                blocked
                                  ? "border-rose-200 bg-rose-50/60"
                                  : selected
                                    ? "border-[#0D6E5C] bg-emerald-50/50"
                                    : "border-slate-200 bg-[#F8FAFC] hover:bg-slate-50"
                              }`}
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {meal.title}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {meal.dietTag}
                                </p>
                                {blocked && (
                                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-rose-800">
                                    <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                                    Allergy Alert: Contains {conflicts.join(", ")}
                                  </p>
                                )}
                              </div>
                              {!blocked && selected && (
                                <CheckCircle2
                                  className="w-4 h-4 text-[#0D6E5C] shrink-0 mt-0.5"
                                  aria-hidden="true"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 font-medium">
                          Appetite:
                        </span>
                        <select
                          value={appetiteLevel}
                          onChange={(e) =>
                            setAppetiteLevel(
                              e.target.value as typeof appetiteLevel
                            )
                          }
                          aria-label="Meal appetite rating"
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900"
                        >
                          <option>Full appetite</option>
                          <option>Half portion</option>
                          <option>Warm soup &amp; tea only</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        disabled={selectedMealConflicts.length > 0}
                        onClick={handleConfirmMealTray}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D6E5C] text-white px-4 py-2 text-xs font-medium hover:bg-[#095547] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <RollingActionLabel
                          label={
                            mealSavedBanner
                              ? "Sent to Dining Hall"
                              : "Confirm Dining Tray"
                          }
                        />
                      </button>
                    </div>
                  </div>

                  {/* Feature 9: Daily Mood, Comfort & Pain Check-In */}
                  <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                          <Smile className="w-4 h-4 text-[#0D6E5C]" aria-hidden="true" />
                          How Are You Feeling Today?
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Gentle 1-tap mood &amp; comfort check shared with{" "}
                          {resident.circleMembers[0]?.name || "family"}.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(
                          [
                            "Peaceful",
                            "Cheerful",
                            "Tired",
                            "Unsteady",
                            "In Discomfort",
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setMood(opt)}
                            className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                              mood === opt
                                ? opt === "Unsteady" || opt === "In Discomfort"
                                  ? "border-amber-600 bg-amber-50 text-amber-900"
                                  : "border-[#0D6E5C] bg-emerald-50 text-[#0D6E5C]"
                                : "border-slate-200 bg-[#F8FAFC] text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-medium text-slate-700">
                            Joint / Physical Discomfort Scale
                          </span>
                          <span className="font-mono-tabular font-semibold text-slate-900">
                            {comfortScore} / 10
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={10}
                          value={comfortScore}
                          onChange={(e) => setComfortScore(Number(e.target.value))}
                          aria-label="Comfort and pain scale from 0 to 10"
                          className="w-full accent-[#0D6E5C] cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>0 · Totally Comfortable</span>
                          <span>10 · Severe Pain</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-700 mb-2">
                          Quick Comfort Requests
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "Extra warm blanket",
                            "Quiet dining table",
                            "Video chat with family",
                            "Afternoon chamomile tea",
                          ].map((chip) => {
                            const active = comfortNoteChips.includes(chip);
                            return (
                              <button
                                key={chip}
                                type="button"
                                onClick={() =>
                                  setComfortNoteChips((prev) =>
                                    prev.includes(chip)
                                      ? prev.filter((c) => c !== chip)
                                      : [...prev, chip]
                                  )
                                }
                                className={`rounded-lg border px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                                  active
                                    ? "border-[#0D6E5C] bg-emerald-50 text-[#0D6E5C] font-medium"
                                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                {chip}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmitCheckIn}
                      className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2922] text-white px-4 py-2.5 text-xs font-medium hover:bg-[#163b31] transition-colors cursor-pointer"
                    >
                      {checkInConfirmed ? (
                        <>
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          Check-In Shared with Care Circle
                        </>
                      ) : (
                        <>
                          <HeartHandshake className="w-3.5 h-3.5" aria-hidden="true" />
                          Send Comfort Check-In
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Feature 8: Visual 4-Slot Pill-Tray Companion */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                    <div>
                      <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                        <Pill className="w-4 h-4 text-[#0D6E5C]" aria-hidden="true" />
                        Visual 4-Compartment Pill Organizer Tray
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Synced from {resident.name}&apos;s active prescriptions so morning,
                        midday, evening, and bedtime pouches are never mixed up.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {pillTraySlots.map((tray) => {
                      const verified = Boolean(verifiedSlots[tray.slot]);
                      return (
                        <div
                          key={tray.slot}
                          className={`rounded-xl border p-4 flex flex-col justify-between transition-colors ${
                            verified
                              ? "border-emerald-200 bg-emerald-50/40"
                              : "border-slate-200 bg-[#F8FAFC]"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                              <span className="text-sm font-semibold text-slate-900">
                                {tray.slot}
                              </span>
                              <span className="font-mono-tabular text-[11px] text-slate-500">
                                {tray.windowLabel}
                              </span>
                            </div>

                            {tray.items.length === 0 ? (
                              <p className="py-4 text-xs text-slate-500">
                                No scheduled doses in this window.
                              </p>
                            ) : (
                              <ul className="py-3 space-y-2.5">
                                {tray.items.map((rx) => (
                                  <li key={rx.id} className="text-xs">
                                    <p className="font-medium text-slate-900">
                                      {rx.name}{" "}
                                      <span className="text-slate-500 font-normal">
                                        ({rx.dosage})
                                      </span>
                                    </p>
                                    <p className="text-slate-500 mt-0.5">
                                      {rx.timing}
                                    </p>
                                    {rx.daysRemaining <= 7 && (
                                      <button
                                        type="button"
                                        onClick={() => onToggleRefill(resident.id, rx.id)}
                                        className="mt-1 text-[11px] font-medium text-amber-800 underline cursor-pointer"
                                      >
                                        {rx.refillRequested
                                          ? "Refill Requested"
                                          : `Low (${rx.daysRemaining}d left) · Request Refill`}
                                      </button>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setVerifiedSlots((prev) => ({
                                ...prev,
                                [tray.slot]: !prev[tray.slot],
                              }))
                            }
                            className={`mt-2 w-full rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                              verified
                                ? "bg-[#0D6E5C] text-white"
                                : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-100"
                            }`}
                          >
                            {verified ? "Compartment Verified" : "Mark Tray Checked"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {suiteTab === "suite" && (
              <motion.div
                key="lodging-suite"
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotateX: 4, y: 10 }
                }
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotateX: -4, y: -10 }
                }
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Feature 3: Suite Housekeeping, Laundry & Maintenance Requests */}
                <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[#0D6E5C]" aria-hidden="true" />
                      Suite Maintenance, Linens &amp; Laundry
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      One-tap lodging tickets dispatched to building staff &amp; shared
                      with family.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Tighten Bath Grab Bar", priority: "Safety Fix" as const },
                      { label: "Laundry Bag Pickup", priority: "Routine" as const },
                      { label: "Adjust Suite Thermostat 72°F", priority: "Routine" as const },
                      { label: "Clear Corridor Threshold", priority: "Safety Fix" as const },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          handleSubmitMaintenance(preset.label, preset.priority)
                        }
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-slate-800 hover:border-[#0D6E5C] hover:text-[#0D6E5C] transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" aria-hidden="true" />
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmitMaintenance();
                    }}
                    className="flex flex-wrap gap-2"
                  >
                    <input
                      type="text"
                      value={newTicketText}
                      onChange={(e) => setNewTicketText(e.target.value)}
                      placeholder="Other suite request (e.g. extra pillow, leaky tap)..."
                      aria-label="Maintenance request detail"
                      className="flex-1 min-w-[200px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                    <select
                      value={newTicketPriority}
                      onChange={(e) =>
                        setNewTicketPriority(e.target.value as "Routine" | "Safety Fix")
                      }
                      aria-label="Request priority"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900"
                    >
                      <option>Routine</option>
                      <option>Safety Fix</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-xl bg-[#0F2922] text-white px-4 py-2 text-xs font-medium hover:bg-[#163b31] cursor-pointer"
                    >
                      Send Ticket
                    </button>
                  </form>

                  <div className="divide-y divide-slate-200 pt-2">
                    {tickets.map((t) => (
                      <div
                        key={t.id}
                        className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {t.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {t.priority} · {t.createdAt}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAdvanceTicket(t.id)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap cursor-pointer ${
                            t.status === "Completed"
                              ? "bg-emerald-50 text-[#0D6E5C]"
                              : t.status === "Scheduled"
                                ? "bg-amber-50 text-amber-800"
                                : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {t.status}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature 7: Fall-Risk Suite Safety Checklist */}
                <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-[#0D6E5C]" aria-hidden="true" />
                        Suite Fall-Risk &amp; Grab-Bar Audit
                      </h3>
                      <span className="font-mono-tabular text-sm font-semibold text-[#0D6E5C]">
                        {safetyPct}% Ready
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Daily physical room checks prevent slips before dusk.
                    </p>

                    <div className="mt-4 divide-y divide-slate-100">
                      {safetyItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            setSafetyItems((prev) =>
                              prev.map((s) =>
                                s.id === item.id ? { ...s, checked: !s.checked } : s
                              )
                            )
                          }
                          className="w-full py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-slate-50/70 rounded-lg px-2 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                                item.checked
                                  ? "bg-[#0D6E5C] border-[#0D6E5C] text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {item.checked && (
                                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                            </span>
                            <span className="text-sm text-slate-800">
                              {item.label}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 shrink-0">
                            {item.zone}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {safetyPct < 100 && (
                    <button
                      type="button"
                      onClick={() => {
                        const unchecked = safetyItems
                          .filter((s) => !s.checked)
                          .map((s) => s.label)
                          .join("; ");
                        handleSubmitMaintenance(
                          `Safety audit fix: ${unchecked}`,
                          "Safety Fix"
                        );
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                      Dispatch Safety Fix Ticket for Unchecked Items
                    </button>
                  )}
                </div>

                {/* Feature 5: Assisted Shuttle & Wheelchair Escort Booking */}
                <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                      <Bus className="w-4 h-4 text-[#0D6E5C]" aria-hidden="true" />
                      Doorstep Shuttle &amp; Wheelchair Escort
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Books round-trip assisted rides straight onto {resident.name}
                      &apos;s Appointments calendar.
                    </p>
                  </div>

                  <form onSubmit={handleBookShuttle} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="ride-dest"
                          className="block text-xs font-medium text-slate-700 mb-1"
                        >
                          Destination
                        </label>
                        <select
                          id="ride-dest"
                          value={rideDestination}
                          onChange={(e) => setRideDestination(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                        >
                          <option>Cedar Valley Clinic</option>
                          <option>Neighborhood Pharmacy</option>
                          <option>Botanical Conservatory</option>
                          <option>Greenwood Grocery Loop</option>
                          <option>South Glass Conservatory</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="ride-mobility"
                          className="block text-xs font-medium text-slate-700 mb-1"
                        >
                          Mobility Escort
                        </label>
                        <select
                          id="ride-mobility"
                          value={rideMobility}
                          onChange={(e) =>
                            setRideMobility(e.target.value as typeof rideMobility)
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                        >
                          <option>Cane Assist</option>
                          <option>Rollator Support</option>
                          <option>Wheelchair Escort</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={rideDate}
                        onChange={(e) => setRideDate(e.target.value)}
                        aria-label="Ride date"
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                      />
                      <input
                        type="text"
                        value={rideTime}
                        onChange={(e) => setRideTime(e.target.value)}
                        aria-label="Ride departure time"
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 font-mono-tabular"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D6E5C] text-white px-4 py-2.5 text-xs font-medium hover:bg-[#095547] transition-colors cursor-pointer"
                    >
                      <Accessibility className="w-4 h-4" aria-hidden="true" />
                      Reserve Escorted Lodge Ride
                    </button>

                    {rideConfirmed && (
                      <p className="text-xs font-medium text-[#0D6E5C]">
                        Booked: {rideConfirmed} — added to Appointments.
                      </p>
                    )}
                  </form>
                </div>

                {/* Feature 10: Front-Desk Visitor Pass & Guest Registry */}
                <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#0D6E5C]" aria-hidden="true" />
                      Front-Desk Visitor Pass &amp; Guest Registry
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pre-authorize visiting family or aides with a lodge gate code.
                    </p>
                  </div>

                  <form
                    onSubmit={handleAddVisitor}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
                  >
                    <input
                      type="text"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="Visitor name"
                      aria-label="Visitor name"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                    <input
                      type="text"
                      value={visitorRelation}
                      onChange={(e) => setVisitorRelation(e.target.value)}
                      placeholder="Relation (e.g. Grandson)"
                      aria-label="Visitor relation"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={visitorWindow}
                        onChange={(e) => setVisitorWindow(e.target.value)}
                        aria-label="Expected arrival time"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-[#0F2922] text-white px-3 py-2 text-xs font-medium hover:bg-[#163b31] cursor-pointer whitespace-nowrap"
                      >
                        Issue Pass
                      </button>
                    </div>
                  </form>

                  <div className="divide-y divide-slate-200">
                    {visitors.map((v) => (
                      <div
                        key={v.id}
                        className="py-3 first:pt-1 last:pb-0 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {v.name}{" "}
                            <span className="text-xs font-normal text-slate-500">
                              · {v.relation}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500 font-mono-tabular">
                            {v.expectedWindow} · Gate Code {v.passCode}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCycleVisitorStatus(v.id)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer whitespace-nowrap ${
                            v.status === "Checked In"
                              ? "bg-emerald-50 text-[#0D6E5C]"
                              : v.status === "Departed"
                                ? "bg-slate-100 text-slate-600"
                                : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          {v.status}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {suiteTab === "wellness" && (
              <motion.div
                key="lodging-wellness"
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotateX: 4, y: 10 }
                }
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotateX: -4, y: -10 }
                }
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Feature 6: Guided 4-4-6 Breathing, Seated Stretch Coach & Memory Recall */}
                <SeniorMindBodyStudio
                  residentId={resident.id}
                  residentName={resident.name}
                  onAddNote={onAddNote}
                  onBoostActivity={onBoostActivity}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Feature 4: Skiper80-Powered Lodge Community & Sanctuary Program Directory */}
        <Skiper80LodgeShowcase
          residentName={resident.name}
          rsvpedIds={rsvpedPrograms}
          onRsvpProgram={handleRsvpProgram}
          onBookRideForProgram={handleBookRideForProgram}
          onReadAloud={onReadSummaryAloud}
        />
      </div>
    </section>
  );
}
