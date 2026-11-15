import { useMemo, useState, type FormEvent, type MouseEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  BatteryCharging,
  Building2,
  Cake,
  Calendar,
  Check,
  ClipboardList,
  CloudSun,
  Copy,
  CreditCard,
  Flame,
  LayoutGrid,
  List,
  Moon,
  Move,
  Plus,
  ShieldCheck,
  Syringe,
  Wallet,
  X,
} from "lucide-react";
import type {
  CareTaskItem,
  ComfortPreferences,
  ResidentProfile,
} from "../data/eldercareData";
import type { DoctorModalTab } from "./DoctorConnectModal";
import {
  RollingActionLabel,
  Skiper27RollingText,
} from "./SkiperKineticPrimitives";

interface ExtendedCareSkiper80HubProps {
  resident: ResidentProfile;
  onAddNote: (residentId: string, author: string, text: string) => void;
  onAddTask: (
    residentId: string,
    task: Omit<CareTaskItem, "id" | "completed">
  ) => void;
  onUpdateComfort: (
    residentId: string,
    patch: Partial<ComfortPreferences>
  ) => void;
  onUpdateHydrationGoal: (residentId: string, nextTarget: number) => void;
  onOpenDoctorConnect: (tab: DoctorModalTab) => void;
}

type ModuleId =
  | "ice-card"
  | "pharmacy-vault"
  | "sensory-care"
  | "sleep-hygiene"
  | "family-dates"
  | "immunizations"
  | "utility-safety"
  | "allowance-ledger"
  | "shift-handoff"
  | "weather-outing";

interface CareUtilityMeta {
  id: ModuleId;
  code: string;
  title: string;
  category: "Clinical" | "Daily Aid" | "Safety" | "Family";
  shortTag: string;
  metricLabel: string;
  icon: typeof ShieldCheck;
  imageSrc: string;
}

export function ExtendedCareSkiper80Hub({
  resident,
  onAddNote,
  onAddTask,
  onUpdateComfort,
  onUpdateHydrationGoal,
  onOpenDoctorConnect,
}: ExtendedCareSkiper80HubProps) {
  const prefersReducedMotion = useReducedMotion();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [hoveredModule, setHoveredModule] = useState<CareUtilityMeta | null>(
    null
  );
  const [cursorOffset, setCursorOffset] = useState({ x: 0, y: 0 });
  const [activeModuleId, setActiveModuleId] = useState<ModuleId | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 2. Pharmacy & Insurance State
  const [pharmacyName, setPharmacyName] = useState("Oakridge Apothecary & Compounding");
  const [pharmacyPhone, setPharmacyPhone] = useState("(503) 555-0188");
  const [policyPlan, setPolicyPlan] = useState("Medicare Part D · Plan #KC-88412");

  // 3. Sensory Care (Hearing Aids & Glasses)
  const [leftBatteryDays, setLeftBatteryDays] = useState(2);
  const [rightBatteryDays, setRightBatteryDays] = useState(5);
  const [glassesCleaned, setGlassesCleaned] = useState(true);

  // 4. Sleep Hygiene Checklist
  const [sleepChecks, setSleepChecks] = useState([
    { id: "sl-1", label: "No caffeine after 2:00 PM", done: true },
    { id: "sl-2", label: "Corridor curtains drawn at dusk", done: true },
    { id: "sl-3", label: "Reading glasses placed on bedside tray", done: false },
    { id: "sl-4", label: "Chamomile wind-down & quiet music off", done: false },
  ]);

  // 5. Family Dates & Birthday Wall
  const [familyDates, setFamilyDates] = useState([
    { id: "fd-1", occasion: "Clara's Birthday Video Tea", date: "Nov 22", daysAway: 8 },
    { id: "fd-2", occasion: "Grandson Leo's School Concert", date: "Dec 04", daysAway: 20 },
  ]);
  const [newOccasion, setNewOccasion] = useState("");
  const [newOccasionDate, setNewOccasionDate] = useState("Dec 12");

  // 6. Seasonal Immunizations
  const [vaccines, setVaccines] = useState([
    { id: "vac-1", name: "High-Dose Seasonal Flu", lastDate: "Oct 2026", upToDate: true },
    { id: "vac-2", name: "RSV Senior Protection", lastDate: "Nov 2025", upToDate: true },
    { id: "vac-3", name: "Shingles Booster / Eye Exam", lastDate: "Due Nov", upToDate: false },
  ]);

  // 7. Suite Kitchen & Utility Auto-Checks
  const [utilities, setUtilities] = useState([
    { id: "ut-1", name: "Induction Tea Kettle Auto-Shutoff", safe: true },
    { id: "ut-2", name: "Stove Burner Safety Lock", safe: true },
    { id: "ut-3", name: "Bathroom Exhaust Timer", safe: true },
    { id: "ut-4", name: "Suite Entry Deadbolt Latch", safe: false },
  ]);

  // 8. Shared Lodging Allowance Ledger
  const [expenses, setExpenses] = useState([
    { id: "ex-1", item: "Prescription copays (Nov cycle)", amount: 34, by: "Clara" },
    { id: "ex-2", item: "In-suite haircut & grooming visit", amount: 45, by: "Shared Fund" },
    { id: "ex-3", item: "Organic chamomile & orchard fruit basket", amount: 22, by: "Marcus" },
  ]);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseCost, setExpenseCost] = useState("");

  // 9. Shift Handoff Extra Note
  const [shiftNote, setShiftNote] = useState("Steady gait after afternoon tea; prefers window lamp at 5 PM.");

  // 10. Weather-Aware Outing Mode
  const [weatherMode, setWeatherMode] = useState<
    "Sunny 68°F" | "Warm 84°F" | "Rainy Walkways" | "Crisp 44°F"
  >("Sunny 68°F");

  const weatherAdviceMap: Record<
    typeof weatherMode,
    { garment: string; footing: string; hydrationDelta: number }
  > = {
    "Sunny 68°F": {
      garment: "Light cardigan & sun brim hat for courtyard bench time.",
      footing: "Ideal traction; great 20-minute garden walk window.",
      hydrationDelta: 0,
    },
    "Warm 84°F": {
      garment: "Breathable cotton shirt; keep outdoor stroll before 10:30 AM.",
      footing: "Pause at shaded benches every 8 minutes and carry water.",
      hydrationDelta: 1,
    },
    "Rainy Walkways": {
      garment: "Water-resistant coat; recommend indoor South Conservatory walk.",
      footing: "Inspect rubber cane/rollator ferrules before stepping outside.",
      hydrationDelta: 0,
    },
    "Crisp 44°F": {
      garment: "Warm wool sweater, scarf, and gloved grip for railings.",
      footing: "Check porch stone for morning dew or frost before strolling.",
      hydrationDelta: 0,
    },
  };

  const modules: CareUtilityMeta[] = useMemo(() => {
    const dueVaccines = vaccines.filter((v) => !v.upToDate).length;
    const utilitiesClear = utilities.filter((u) => u.safe).length;
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
    const pendingTasks = resident.tasks.filter((t) => !t.completed).length;

    return [
      {
        id: "ice-card",
        code: "01",
        title: "Emergency ICE & Directive Wallet",
        category: "Clinical",
        shortTag: `Blood ${resident.bloodType} · ${resident.allergies.length} allergies`,
        metricLabel: "1-Tap Paramedic Summary",
        icon: CreditCard,
        imageSrc: "/assets/images/eldercare_living_sunlight_1794715912243.jpg",
      },
      {
        id: "pharmacy-vault",
        code: "02",
        title: "Pharmacy & Rx Insurance Vault",
        category: "Clinical",
        shortTag: pharmacyName,
        metricLabel: `${resident.prescriptions.length} active Rx`,
        icon: Building2,
        imageSrc: "/assets/images/caregiver_medication_tablet_1794715912691.jpg",
      },
      {
        id: "sensory-care",
        code: "03",
        title: "Hearing Aid & Eyeglass Care",
        category: "Daily Aid",
        shortTag: `Left ${leftBatteryDays}d · Right ${rightBatteryDays}d battery`,
        metricLabel: glassesCleaned ? "Lenses clean" : "Check lenses",
        icon: BatteryCharging,
        imageSrc: "/assets/images/lodge_music_lounge_1794719428318.jpg",
      },
      {
        id: "sleep-hygiene",
        code: "04",
        title: "Sleep Hygiene & Dusk Lamp Planner",
        category: "Daily Aid",
        shortTag: `Quiet hours ${resident.comfortPreferences.quietHours}`,
        metricLabel: `${sleepChecks.filter((s) => s.done).length}/${sleepChecks.length} ready`,
        icon: Moon,
        imageSrc: "/assets/images/senior_portrait_eleanor_1794715912898.jpg",
      },
      {
        id: "family-dates",
        code: "05",
        title: "Family Birthdays & Celebration Wall",
        category: "Family",
        shortTag: `${familyDates.length} upcoming family milestones`,
        metricLabel: `Next in ${familyDates[0]?.daysAway ?? 7}d`,
        icon: Cake,
        imageSrc: "/assets/images/memory_family_picnic_1794719849583.jpg",
      },
      {
        id: "immunizations",
        code: "06",
        title: "Immunizations & Preventive Screenings",
        category: "Clinical",
        shortTag: dueVaccines > 0 ? `${dueVaccines} due soon` : "All current",
        metricLabel: `${vaccines.length} tracked`,
        icon: Syringe,
        imageSrc: "/assets/images/lodge_conservatory_taichi_1794719427416.jpg",
      },
      {
        id: "utility-safety",
        code: "07",
        title: "Suite Kettle, Stove & Latch Safety",
        category: "Safety",
        shortTag: `${utilitiesClear}/${utilities.length} home utilities verified`,
        metricLabel: utilitiesClear === utilities.length ? "All Clear" : "Verify Latch",
        icon: Flame,
        imageSrc: "/assets/images/lodge_dining_tray_1794719428288.jpg",
      },
      {
        id: "allowance-ledger",
        code: "08",
        title: "Shared Lodging Sundries & Ledger",
        category: "Family",
        shortTag: `Nov cycle · ${expenses.length} entries`,
        metricLabel: `$${totalExpense} logged`,
        icon: Wallet,
        imageSrc: "/assets/images/memory_botanical_greenhouse_1794719849772.jpg",
      },
      {
        id: "shift-handoff",
        code: "09",
        title: "Caregiver Shift Handoff Generator",
        category: "Family",
        shortTag: `${pendingTasks} tasks remaining today`,
        metricLabel: "Auto-syncs vitals + logs",
        icon: ClipboardList,
        imageSrc: "/assets/images/family_garden_walk_1794715913136.jpg",
      },
      {
        id: "weather-outing",
        code: "10",
        title: "Weather-Aware Walk & Hydration Advisor",
        category: "Daily Aid",
        shortTag: weatherMode,
        metricLabel:
          weatherAdviceMap[weatherMode].hydrationDelta > 0
            ? "+1 glass suggested"
            : "Standard goal",
        icon: CloudSun,
        imageSrc: "/assets/images/memory_coastal_roadtrip_1794719847841.jpg",
      },
    ];
  }, [
    resident,
    pharmacyName,
    leftBatteryDays,
    rightBatteryDays,
    glassesCleaned,
    sleepChecks,
    familyDates,
    vaccines,
    utilities,
    expenses,
    weatherMode,
  ]);

  const activeModule = modules.find((m) => m.id === activeModuleId) || null;

  const handleRowPointerMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorOffset({
      x: Math.max(-24, Math.min(24, ((e.clientX - rect.left) / rect.width - 0.5) * 32)),
      y: Math.max(-18, Math.min(18, ((e.clientY - rect.top) / rect.height - 0.5) * 22)),
    });
  };

  const copyText = (id: string, text: string) => {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddFamilyDate = (e: FormEvent) => {
    e.preventDefault();
    if (!newOccasion.trim()) return;
    setFamilyDates((prev) => [
      {
        id: `fd-${Date.now()}`,
        occasion: newOccasion.trim(),
        date: newOccasionDate.trim() || "Upcoming",
        daysAway: 14,
      },
      ...prev,
    ]);
    setNewOccasion("");
  };

  const handleAddExpense = (e: FormEvent) => {
    e.preventDefault();
    const amt = Number(expenseCost);
    if (!expenseTitle.trim() || !amt || amt <= 0) return;
    setExpenses((prev) => [
      {
        id: `ex-${Date.now()}`,
        item: expenseTitle.trim(),
        amount: Math.round(amt),
        by: resident.circleMembers[0]?.name.split(" ")[0] || "Family",
      },
      ...prev,
    ]);
    onAddNote(
      resident.id,
      "Lodging Ledger",
      `Added shared living expense: "${expenseTitle.trim()}" ($${Math.round(amt)}).`
    );
    setExpenseTitle("");
    setExpenseCost("");
  };

  const buildShiftBriefText = () => {
    const pending = resident.tasks.filter((t) => !t.completed).length;
    const openSafety = resident.securityLogs.filter(
      (l) => l.status !== "Resolved"
    ).length;
    return `${resident.name} Shift Handoff — Status: ${resident.statusLevel}. Hydration: ${resident.hydrationGlasses}/${resident.hydrationTarget} glasses. Tasks left today: ${pending}. Open safety alerts: ${openSafety}. Notes: ${shiftNote}`;
  };

  return (
    <section
      id="extended-care-modules"
      className="py-20 border-t border-slate-200 bg-[#F8FAFC]"
    >
      <div className="max-w-[1200px] mx-auto px-6 space-y-8">
        {/* Header with Skiper27 Rolling Headline & Skiper80 Layout Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#0D6E5C] tracking-wide">
              10 Additional Senior Living Modules · Interactive Skiper80 Explorer
            </p>
            <Skiper27RollingText
              as="h2"
              text="Sensory care, safety wallets, shift handoffs & daily aid"
              className="mt-2 text-3xl lg:text-4xl font-medium tracking-tight text-slate-900 text-balance"
            />
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              Explore ten specialized utilities for senior lodging—hover any row for
              floating previews or click any module to expand its interactive{" "}
              <span className="font-medium text-slate-800">Skiper80</span>{" "}
              workspace with draggable inspection cards.
            </p>
          </div>

          <div
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-white border border-slate-200 self-start lg:self-auto"
            role="group"
            aria-label="Care utilities layout view"
          >
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === "grid"
                  ? "bg-[#0F2922] text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
              Visual Module Grid (10)
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === "list"
                  ? "bg-[#0F2922] text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" aria-hidden="true" />
              Hover Preview Index
            </button>
          </div>
        </div>

        {/* Skiper80 Stage: Layout Morph between 10-Card Grid & Cursor-Tracking List */}
        <div
          className="relative"
          onMouseMove={viewMode === "list" ? handleRowPointerMove : undefined}
          onMouseLeave={() => setHoveredModule(null)}
        >
          <AnimatePresence>
            {viewMode === "list" &&
              hoveredModule &&
              !activeModule &&
              !prefersReducedMotion && (
                <motion.div
                  key={hoveredModule.id}
                  initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: cursorOffset.x * 0.14,
                    x: cursorOffset.x,
                    y: cursorOffset.y,
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className="hidden lg:block pointer-events-none absolute right-6 top-6 z-20 w-72 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xl"
                >
                  <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                    <img
                      src={hoveredModule.imageSrc}
                      alt={hoveredModule.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3.5 bg-white">
                    <p className="font-mono-tabular text-[11px] text-[#0D6E5C] font-medium">
                      {hoveredModule.code} · {hoveredModule.category}
                    </p>
                    <p className="text-xs font-semibold text-slate-900 mt-0.5 truncate">
                      {hoveredModule.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {hoveredModule.shortTag}
                    </p>
                  </div>
                </motion.div>
              )}
          </AnimatePresence>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {modules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <motion.button
                    key={mod.id}
                    type="button"
                    layout
                    layoutId={`skiper80-ext-${mod.id}`}
                    whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => setActiveModuleId(mod.id)}
                    className="rounded-2xl border border-slate-200 bg-white p-5 text-left flex flex-col justify-between gap-4 hover:border-[#0D6E5C] transition-colors cursor-pointer group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0D6E5C] group-hover:bg-[#0D6E5C] group-hover:text-white transition-colors">
                          <Icon className="w-4 h-4" aria-hidden="true" />
                        </span>
                        <span className="font-mono-tabular text-xs text-slate-400">
                          {mod.code}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs text-[#0D6E5C] font-medium">
                          {mod.category}
                        </p>
                        <h3 className="mt-0.5 text-sm font-semibold text-slate-900 leading-snug group-hover:text-[#0D6E5C] transition-colors">
                          {mod.title}
                        </h3>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500 truncate">
                        {mod.metricLabel}
                      </span>
                      <ArrowUpRight
                        className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D6E5C] shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 divide-y divide-slate-200">
              {modules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <motion.div
                    key={mod.id}
                    layout
                    layoutId={`skiper80-ext-${mod.id}`}
                    onMouseEnter={() => setHoveredModule(mod)}
                    className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveModuleId(mod.id)}
                      className="flex items-center gap-4 text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <span className="font-mono-tabular text-xs font-medium text-slate-400 group-hover:text-[#0D6E5C] shrink-0">
                        {mod.code}
                      </span>
                      <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#0D6E5C] shrink-0">
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-medium text-slate-900 group-hover:text-[#0D6E5C] transition-colors">
                          {mod.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {mod.shortTag} · {mod.metricLabel}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveModuleId(mod.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-[#0F2922] hover:text-white transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
                    >
                      <RollingActionLabel label="Open Module" />
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Skiper80 Shared-Layout Interactive Module Overlay */}
      <AnimatePresence>
        {activeModule && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-label={activeModule.title}
          >
            <motion.div
              layoutId={`skiper80-ext-${activeModule.id}`}
              initial={prefersReducedMotion ? { opacity: 0 } : undefined}
              animate={prefersReducedMotion ? { opacity: 1 } : undefined}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 sticky top-0 bg-white z-10">
                <div>
                  <p className="font-mono-tabular text-xs text-[#0D6E5C]">
                    Module {activeModule.code} · {activeModule.category}
                  </p>
                  <h3 className="text-xl font-medium text-slate-900">
                    {activeModule.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModuleId(null)}
                  aria-label="Close module workbench"
                  className="w-9 h-9 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Draggable Visual Summary Card (Skiper80 Tactile Signature) */}
                <div className="md:col-span-5 space-y-2">
                  <motion.div
                    drag={!prefersReducedMotion}
                    dragSnapToOrigin
                    dragElastic={0.2}
                    whileDrag={{ scale: 1.03, rotate: 2, cursor: "grabbing" }}
                    className="rounded-2xl border border-slate-200 bg-[#F8FAFC] overflow-hidden shadow-sm cursor-grab select-none"
                  >
                    <div className="aspect-[16/10] bg-slate-200">
                      <img
                        src={activeModule.imageSrc}
                        alt={activeModule.title}
                        referrerPolicy="no-referrer"
                        draggable={false}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 space-y-1">
                      <p className="text-xs text-[#0D6E5C] font-medium">
                        {resident.name}
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {activeModule.shortTag}
                      </p>
                      <p className="font-mono-tabular text-xs text-slate-500">
                        {activeModule.metricLabel}
                      </p>
                    </div>
                  </motion.div>
                  <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <Move className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
                    Drag summary card gently · Releases cleanly back into frame
                  </p>
                </div>

                {/* Live Feature Interactive Panel */}
                <div className="md:col-span-7 space-y-4">
                  {activeModule.id === "ice-card" && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-2 text-xs">
                        <p className="font-semibold text-rose-900">
                          EMS / Paramedic Quick Readout
                        </p>
                        <p className="text-slate-800">
                          <strong>Resident:</strong> {resident.name} (Age{" "}
                          {resident.age}, DOB {resident.dateOfBirth})
                        </p>
                        <p className="text-slate-800">
                          <strong>Blood Type:</strong> {resident.bloodType} ·{" "}
                          <strong>Allergies:</strong>{" "}
                          {resident.allergies.join(", ") || "None"}
                        </p>
                        <p className="text-slate-800">
                          <strong>Conditions:</strong>{" "}
                          {resident.conditions.join(", ") || "None"}
                        </p>
                        <p className="text-slate-800">
                          <strong>Proxy Contact:</strong>{" "}
                          {resident.circleMembers[0]?.name} (
                          {resident.circleMembers[0]?.phone || "On file"})
                        </p>
                        <p className="text-slate-800">
                          <strong>Physician:</strong>{" "}
                          {resident.doctorName || "Primary Care"} (
                          {resident.doctorPhone || "On file"})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            "ice",
                            `ICE WALLET: ${resident.name} | DOB ${resident.dateOfBirth} | Blood ${resident.bloodType} | Allergies: ${resident.allergies.join(", ")} | Conditions: ${resident.conditions.join(", ")} | Proxy: ${resident.circleMembers[0]?.name} ${resident.circleMembers[0]?.phone || ""}`
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0D6E5C] text-white px-4 py-2.5 text-xs font-medium hover:bg-[#095547] cursor-pointer"
                      >
                        {copiedId === "ice" ? (
                          <>
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            Copied ICE Wallet to Clipboard
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                            Copy ICE Card for Paramedics
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {activeModule.id === "pharmacy-vault" && (
                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-slate-700">
                        Preferred Pharmacy Name
                        <input
                          type="text"
                          value={pharmacyName}
                          onChange={(e) => setPharmacyName(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                        />
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="block text-xs font-medium text-slate-700">
                          Pharmacy Phone
                          <input
                            type="text"
                            value={pharmacyPhone}
                            onChange={(e) => setPharmacyPhone(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 font-mono-tabular"
                          />
                        </label>
                        <label className="block text-xs font-medium text-slate-700">
                          Insurance Policy / Group
                          <input
                            type="text"
                            value={policyPlan}
                            onChange={(e) => setPolicyPlan(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onAddNote(
                            resident.id,
                            "Pharmacy Vault",
                            `Verified Rx routing via ${pharmacyName} (${pharmacyPhone}) under ${policyPlan}.`
                          );
                          setActiveModuleId(null);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F2922] text-white px-4 py-2.5 text-xs font-medium hover:bg-[#163b31] cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        Save &amp; Log Pharmacy Verification
                      </button>
                    </div>
                  )}

                  {activeModule.id === "sensory-care" && (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Left Hearing Aid Battery
                          </p>
                          <p className="font-mono-tabular text-xs text-slate-600">
                            Estimated {leftBatteryDays} days remaining
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setLeftBatteryDays(7);
                            onAddNote(
                              resident.id,
                              "Sensory Aid Log",
                              "Replaced left hearing aid battery (fresh 7-day cell)."
                            );
                          }}
                          className="rounded-lg bg-[#0D6E5C] text-white px-3 py-1.5 text-xs font-medium cursor-pointer"
                        >
                          Replaced Today
                        </button>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Right Hearing Aid Battery
                          </p>
                          <p className="font-mono-tabular text-xs text-slate-600">
                            Estimated {rightBatteryDays} days remaining
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRightBatteryDays(7);
                            onAddNote(
                              resident.id,
                              "Sensory Aid Log",
                              "Replaced right hearing aid battery (fresh 7-day cell)."
                            );
                          }}
                          className="rounded-lg bg-[#0D6E5C] text-white px-3 py-1.5 text-xs font-medium cursor-pointer"
                        >
                          Replaced Today
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGlassesCleaned((g) => !g)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-800 hover:bg-slate-50 cursor-pointer"
                      >
                        {glassesCleaned
                          ? "Reading & Distance Lenses Cleaned Today"
                          : "Mark Eyeglasses Cleaned"}
                      </button>
                    </div>
                  )}

                  {activeModule.id === "sleep-hygiene" && (
                    <div className="space-y-3">
                      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4">
                        {sleepChecks.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              setSleepChecks((prev) =>
                                prev.map((s) =>
                                  s.id === item.id ? { ...s, done: !s.done } : s
                                )
                              )
                            }
                            className="w-full py-3 flex items-center justify-between gap-3 text-left text-sm text-slate-800 cursor-pointer"
                          >
                            <span>{item.label}</span>
                            <span
                              className={`text-xs font-medium ${
                                item.done ? "text-[#0D6E5C]" : "text-slate-400"
                              }`}
                            >
                              {item.done ? "Ready" : "Pending"}
                            </span>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateComfort(resident.id, {
                            eveningLampCue: !resident.comfortPreferences.eveningLampCue,
                          })
                        }
                        className="w-full rounded-xl bg-[#0F2922] text-white px-4 py-2.5 text-xs font-medium hover:bg-[#163b31] cursor-pointer"
                      >
                        Evening Dusk Path Lamp Cue:{" "}
                        {resident.comfortPreferences.eveningLampCue
                          ? "Enabled (Click to Pause)"
                          : "Paused (Click to Enable)"}
                      </button>
                    </div>
                  )}

                  {activeModule.id === "family-dates" && (
                    <div className="space-y-4">
                      <div className="divide-y divide-slate-200">
                        {familyDates.map((fd) => (
                          <div
                            key={fd.id}
                            className="py-2.5 flex items-center justify-between gap-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {fd.occasion}
                              </p>
                              <p className="font-mono-tabular text-xs text-slate-500">
                                {fd.date} · In {fd.daysAway} days
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                onAddTask(resident.id, {
                                  time: "03:30 PM",
                                  title: `Prepare greeting for ${fd.occasion}`,
                                  detail: `Scheduled for ${fd.date}`,
                                  category: "Family",
                                })
                              }
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-[#0D6E5C] cursor-pointer whitespace-nowrap"
                            >
                              Add Reminder Task
                            </button>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={handleAddFamilyDate} className="flex gap-2">
                        <input
                          type="text"
                          value={newOccasion}
                          onChange={(e) => setNewOccasion(e.target.value)}
                          placeholder="Birthday or anniversary..."
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                        />
                        <input
                          type="text"
                          value={newOccasionDate}
                          onChange={(e) => setNewOccasionDate(e.target.value)}
                          className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900"
                        />
                        <button
                          type="submit"
                          className="rounded-xl bg-[#0D6E5C] text-white px-3 py-2 text-xs font-medium cursor-pointer"
                        >
                          Add
                        </button>
                      </form>
                    </div>
                  )}

                  {activeModule.id === "immunizations" && (
                    <div className="space-y-4">
                      <div className="divide-y divide-slate-200">
                        {vaccines.map((v) => (
                          <div
                            key={v.id}
                            className="py-3 flex items-center justify-between gap-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {v.name}
                              </p>
                              <p className="font-mono-tabular text-xs text-slate-500">
                                {v.lastDate}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setVaccines((prev) =>
                                  prev.map((item) =>
                                    item.id === v.id
                                      ? { ...item, upToDate: !item.upToDate }
                                      : item
                                  )
                                )
                              }
                              className={`rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer ${
                                v.upToDate
                                  ? "bg-emerald-50 text-[#0D6E5C]"
                                  : "bg-amber-50 text-amber-800"
                              }`}
                            >
                              {v.upToDate ? "Up to Date" : "Due Soon"}
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModuleId(null);
                          onOpenDoctorConnect("appointment");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D6E5C] text-white px-4 py-2.5 text-xs font-medium hover:bg-[#095547] cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                        Book Preventive Visit with Doctor
                      </button>
                    </div>
                  )}

                  {activeModule.id === "utility-safety" && (
                    <div className="space-y-3">
                      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4">
                        {utilities.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() =>
                              setUtilities((prev) =>
                                prev.map((item) =>
                                  item.id === u.id
                                    ? { ...item, safe: !item.safe }
                                    : item
                                )
                              )
                            }
                            className="w-full py-3 flex items-center justify-between gap-3 text-left text-sm text-slate-800 cursor-pointer"
                          >
                            <span>{u.name}</span>
                            <span
                              className={`text-xs font-medium ${
                                u.safe ? "text-[#0D6E5C]" : "text-amber-700"
                              }`}
                            >
                              {u.safe ? "Verified Off / Safe" : "Check Needed"}
                            </span>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUtilities((prev) =>
                            prev.map((u) => ({ ...u, safe: true }))
                          );
                          onAddNote(
                            resident.id,
                            "Suite Safety Check",
                            "Confirmed kettle auto-shutoff, stove lock, exhaust fan, and entry deadbolt safe before bedtime."
                          );
                        }}
                        className="w-full rounded-xl bg-[#0F2922] text-white px-4 py-2.5 text-xs font-medium hover:bg-[#163b31] cursor-pointer"
                      >
                        Verify All Suite Utilities Safe &amp; Log Note
                      </button>
                    </div>
                  )}

                  {activeModule.id === "allowance-ledger" && (
                    <div className="space-y-4">
                      <div className="divide-y divide-slate-200">
                        {expenses.map((ex) => (
                          <div
                            key={ex.id}
                            className="py-2.5 flex items-center justify-between gap-3 text-sm"
                          >
                            <div>
                              <p className="font-medium text-slate-900">
                                {ex.item}
                              </p>
                              <p className="text-xs text-slate-500">
                                Paid by {ex.by}
                              </p>
                            </div>
                            <span className="font-mono-tabular font-semibold text-slate-900">
                              ${ex.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={handleAddExpense} className="flex gap-2">
                        <input
                          type="text"
                          value={expenseTitle}
                          onChange={(e) => setExpenseTitle(e.target.value)}
                          placeholder="Expense description"
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                        />
                        <input
                          type="number"
                          min={1}
                          value={expenseCost}
                          onChange={(e) => setExpenseCost(e.target.value)}
                          placeholder="$"
                          className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-xl bg-[#0D6E5C] text-white px-3 py-2 text-xs font-medium cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          Add
                        </button>
                      </form>
                    </div>
                  )}

                  {activeModule.id === "shift-handoff" && (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 text-xs text-slate-700 leading-relaxed">
                        {buildShiftBriefText()}
                      </div>
                      <textarea
                        rows={2}
                        value={shiftNote}
                        onChange={(e) => setShiftNote(e.target.value)}
                        aria-label="Shift handoff note"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyText("shift", buildShiftBriefText())}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          {copiedId === "shift" ? "Copied Brief" : "Copy Brief"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onAddNote(
                              resident.id,
                              "Shift Handover",
                              buildShiftBriefText()
                            );
                            setActiveModuleId(null);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D6E5C] text-white px-4 py-2 text-xs font-medium cursor-pointer"
                        >
                          Post Handoff to Care Circle
                        </button>
                      </div>
                    </div>
                  )}

                  {activeModule.id === "weather-outing" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            "Sunny 68°F",
                            "Warm 84°F",
                            "Rainy Walkways",
                            "Crisp 44°F",
                          ] as const
                        ).map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setWeatherMode(w)}
                            className={`rounded-xl border px-3 py-2 text-xs font-medium cursor-pointer ${
                              weatherMode === w
                                ? "border-[#0D6E5C] bg-emerald-50 text-[#0D6E5C]"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 space-y-2 text-xs text-slate-700">
                        <p>
                          <strong>Garment Cue:</strong>{" "}
                          {weatherAdviceMap[weatherMode].garment}
                        </p>
                        <p>
                          <strong>Mobility &amp; Path Note:</strong>{" "}
                          {weatherAdviceMap[weatherMode].footing}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateHydrationGoal(
                            resident.id,
                            Math.min(16, resident.hydrationTarget + 1)
                          );
                          onAddNote(
                            resident.id,
                            "Weather Outing Advisor",
                            `Adjusted hydration target +1 glass for ${weatherMode} weather.`
                          );
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D6E5C] text-white px-4 py-2.5 text-xs font-medium hover:bg-[#095547] cursor-pointer"
                      >
                        Increase Water Goal +1 Glass for {weatherMode}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
