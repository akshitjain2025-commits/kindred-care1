import { useState, type MouseEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Accessibility,
  ArrowUpRight,
  CalendarPlus,
  Check,
  Clock,
  LayoutGrid,
  List,
  MapPin,
  Move,
  Users,
  Volume2,
  X,
} from "lucide-react";

/**
 * Skiper27-inspired Rolling Text:
 * Center-to-edges staggered 3D kinetic letter roll triggered on scroll,
 * plus optional hover re-roll while preserving full screen-reader accessibility.
 */
interface Skiper27RollingTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  centerOut?: boolean;
  hoverReroll?: boolean;
}

export function Skiper27RollingText({
  text,
  className = "",
  as = "h2",
  centerOut = true,
  hoverReroll = false,
}: Skiper27RollingTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const [rollCycle, setRollCycle] = useState(0);

  if (prefersReducedMotion) {
    if (as === "h1") return <h1 className={className}>{text}</h1>;
    if (as === "h3") return <h3 className={className}>{text}</h3>;
    if (as === "p") return <p className={className}>{text}</p>;
    if (as === "span") return <span className={className}>{text}</span>;
    return <h2 className={className}>{text}</h2>;
  }

  const chars = Array.from(text);
  const centerIndex = (chars.length - 1) / 2;

  const content = (
    <motion.span
      key={rollCycle}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
      aria-label={text}
      onMouseEnter={
        hoverReroll ? () => setRollCycle((c) => c + 1) : undefined
      }
      className="inline-block perspective-[900px]"
    >
      {chars.map((char, idx) => {
        const distanceFromCenter = centerOut
          ? Math.abs(idx - centerIndex)
          : idx * 0.6;
        const delay = Math.min(0.45, distanceFromCenter * 0.015);

        if (char === " ") {
          return (
            <span key={`sp-${idx}`} aria-hidden="true" className="inline-block">
              &nbsp;
            </span>
          );
        }

        return (
          <span
            key={`ch-${idx}`}
            aria-hidden="true"
            className="inline-block overflow-hidden align-bottom"
          >
            <motion.span
              className="inline-block origin-bottom"
              variants={{
                hidden: {
                  y: "105%",
                  rotateX: -65,
                  opacity: 0,
                },
                visible: {
                  y: "0%",
                  rotateX: 0,
                  opacity: 1,
                },
              }}
              transition={{
                type: "spring",
                stiffness: 310,
                damping: 26,
                delay,
              }}
            >
              {char}
            </motion.span>
          </span>
        );
      })}
    </motion.span>
  );

  if (as === "h1") return <h1 className={className}>{content}</h1>;
  if (as === "h3") return <h3 className={className}>{content}</h3>;
  if (as === "p") return <p className={className}>{content}</p>;
  if (as === "span") return <span className={className}>{content}</span>;
  return <h2 className={className}>{content}</h2>;
}

interface KineticHeadlineProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
  /** "mount" plays immediately (above the fold); "inView" waits for scroll. */
  trigger?: "mount" | "inView";
  delayStep?: number;
}

/**
 * Word-level kinetic lift used for display headlines. Unlike the per-character
 * roll it keeps native word wrapping, so long display lines never clip a glyph
 * or collapse the heading box.
 */
export function KineticHeadline({
  text,
  className = "",
  as = "h2",
  trigger = "inView",
  delayStep = 0.045,
}: KineticHeadlineProps) {
  const prefersReducedMotion = useReducedMotion();
  const words = text.split(" ");

  if (prefersReducedMotion) {
    if (as === "h1") return <h1 className={className}>{text}</h1>;
    if (as === "h3") return <h3 className={className}>{text}</h3>;
    if (as === "p") return <p className={className}>{text}</p>;
    return <h2 className={className}>{text}</h2>;
  }

  const content = (
    <motion.span
      initial="hidden"
      animate={trigger === "mount" ? "visible" : undefined}
      whileInView={trigger === "inView" ? "visible" : undefined}
      viewport={trigger === "inView" ? { once: true, amount: 0.2 } : undefined}
      className="inline"
    >
      {words.map((word, index) => (
        <span key={`${word}-${index}`} aria-hidden="true">
          <span className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
            <motion.span
              className="inline-block"
              variants={{
                hidden: { y: "115%", opacity: 0 },
                visible: { y: "0%", opacity: 1 },
              }}
              transition={{
                duration: 0.62,
                delay: index * delayStep,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {word}
            </motion.span>
          </span>
          {index < words.length - 1 ? " " : null}
        </span>
      ))}
    </motion.span>
  );

  if (as === "h1") return <h1 className={className}>{content}</h1>;
  if (as === "h3") return <h3 className={className}>{content}</h3>;
  if (as === "p") return <p className={className}>{content}</p>;
  return <h2 className={className}>{content}</h2>;
}

/**
 * Interactive hover rolling label inspired by Skiper27 dual-layer character roll.
 */
export function RollingActionLabel({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <span className={className}>{label}</span>;
  }

  return (
    <span
      className={`relative inline-flex overflow-hidden leading-tight group ${className}`}
    >
      <span className="inline-flex transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full">
        {label}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 inline-flex translate-y-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
      >
        {label}
      </span>
    </span>
  );
}

export interface LodgeProgramItem {
  id: string;
  code: string;
  title: string;
  category: "Mobility" | "Nutrition" | "Social" | "Calm";
  time: string;
  location: string;
  host: string;
  spotsAvailable: number;
  accessibilityNote: string;
  summary: string;
  detail: string;
  imageSrc: string;
  imageAlt: string;
}

const LODGE_PROGRAMS: LodgeProgramItem[] = [
  {
    id: "prog-taichi",
    code: "01",
    title: "Conservatory Morning Tai Chi",
    category: "Mobility",
    time: "09:30 AM",
    location: "South Glass Conservatory",
    host: "Nadia Okafor, PT",
    spotsAvailable: 4,
    accessibilityNote: "Seated chairs provided · Step-free courtyard ramp",
    summary:
      "Slow, rhythmic seated and standing balance movements among warm morning light and indoor ferns.",
    detail:
      "Designed specifically for aging joints, hip-replacement recovery, and cane or rollator users. Gentle breathwork paces each posture to lower morning stiffness without fatigue.",
    imageSrc: "/assets/images/lodge_conservatory_taichi_1794719427416.jpg",
    imageAlt: "Older adults practicing seated tai chi inside a sunlit conservatory",
  },
  {
    id: "prog-dining",
    code: "02",
    title: "Heart-Healthy Harvest Soup & Tea Table",
    category: "Nutrition",
    time: "12:15 PM",
    location: "Oak Dining Hall · Window Alcove",
    host: "Chef Elena Morales",
    spotsAvailable: 6,
    accessibilityNote: "Low-sodium · Easy-grip cutlery · Allergen screened",
    summary:
      "Velvety roasted squash soup, leafy greens, and warm chamomile served at quiet, acoustic-buffered tables.",
    detail:
      "Meals are calibrated for easy swallowing and balanced blood sugar. Staff track hydration glasses quietly and verify every plate against resident allergy records.",
    imageSrc: "/assets/images/lodge_dining_tray_1794719428288.jpg",
    imageAlt: "Squash soup, green salad, and warm chamomile tea on oak dining table",
  },
  {
    id: "prog-jazz",
    code: "03",
    title: "1960s Vinyl Jazz & Large-Print Reading Lounge",
    category: "Social",
    time: "03:15 PM",
    location: "West Wing Library Lounge",
    host: "Arthur & Volunteers",
    spotsAvailable: 5,
    accessibilityNote: "Induction hearing loop · 18pt large-print editions",
    summary:
      "Relaxed afternoon listening circle featuring classic acoustic jazz records, magnifying lamps, and warm tea.",
    detail:
      "Comfortable high-back armchairs with firm armrests make standing effortless. Ideal for residents who prefer smaller conversational groups over crowded halls.",
    imageSrc: "/assets/images/lodge_music_lounge_1794719428318.jpg",
    imageAlt: "Quiet sunlit senior library lounge with vinyl turntable and armchair",
  },
  {
    id: "prog-garden",
    code: "04",
    title: "Guided Porch & Courtyard Garden Walk",
    category: "Mobility",
    time: "04:00 PM",
    location: "Main Garden Perimeter Path",
    host: "Marcus Rivera, Aide",
    spotsAvailable: 3,
    accessibilityNote: "Paved level walkway · Benches every 40 feet",
    summary:
      "Unhurried 20-minute outdoor fresh-air stroll along continuous handrails and shaded resting benches.",
    detail:
      "Encourages vitamin D synthesis and natural afternoon circadian cues before evening wind-down. Escort wheelchairs always accompany the group.",
    imageSrc: "/assets/images/family_garden_walk_1794715913136.jpg",
    imageAlt: "Older resident walking with companion along sunlit garden path",
  },
  {
    id: "prog-medtea",
    code: "05",
    title: "Evening Tea & Gentle Medication Check",
    category: "Calm",
    time: "06:15 PM",
    location: "Suite Sanctuary / Living Room",
    host: "Kindred Tabletop Companion",
    spotsAvailable: 12,
    accessibilityNote: "Private in-suite spoken cue · Large-print tray card",
    summary:
      "A calm transition into evening with warm herbal tea, soft corridor lighting, and evening pill verification.",
    detail:
      "Combines soothing acoustic brown-noise texture with friendly verbal reminders so evening supplements and eye drops are never missed or rushed.",
    imageSrc: "/assets/images/caregiver_medication_tablet_1794715912691.jpg",
    imageAlt: "Ceramic organizer with herbal tea and large-print evening care schedule",
  },
];

interface Skiper80LodgeShowcaseProps {
  residentName: string;
  rsvpedIds: string[];
  onRsvpProgram: (program: LodgeProgramItem) => void;
  onBookRideForProgram: (program: LodgeProgramItem) => void;
  onReadAloud: (prompt: string) => void;
}

/**
 * Skiper80-inspired Interactive Projects Showcase:
 * List vs. Grid layout toggle with hover-tracking floating preview thumbnail,
 * shared layoutId transition into an expandable detail overlay featuring a draggable photo inspect card.
 */
export function Skiper80LodgeShowcase({
  residentName,
  rsvpedIds,
  onRsvpProgram,
  onBookRideForProgram,
  onReadAloud,
}: Skiper80LodgeShowcaseProps) {
  const prefersReducedMotion = useReducedMotion();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [hoveredItem, setHoveredItem] = useState<LodgeProgramItem | null>(null);
  const [cursorOffset, setCursorOffset] = useState({ x: 0, y: 0 });
  const [selectedItem, setSelectedItem] = useState<LodgeProgramItem | null>(
    null
  );

  const handleRowPointerMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorOffset({
      x: Math.max(-24, Math.min(24, ((e.clientX - rect.left) / rect.width - 0.5) * 32)),
      y: Math.max(-16, Math.min(16, ((e.clientY - rect.top) / rect.height - 0.5) * 20)),
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-[#0D6E5C] tracking-wide">
            Lodge Community &amp; Sanctuary Directory
          </p>
          <Skiper27RollingText
            as="h3"
            text="Daily shared spaces & enrichment clubs"
            className="mt-1 text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight text-balance"
          />
          <p className="mt-1.5 text-sm text-slate-600 max-w-xl">
            Hover or tap any lodge space or club to inspect accessibility details,
            drag the photo card, or RSVP straight onto {residentName.split(" ")[0]}&apos;s
            schedule.
          </p>
        </div>

        <div
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 self-start sm:self-auto"
          role="group"
          aria-label="Lodge directory layout view"
        >
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              viewMode === "list"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="w-3.5 h-3.5" aria-hidden="true" />
            Directory List
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              viewMode === "grid"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
            Gallery Grid
          </button>
        </div>
      </div>

      {/* Relative Stage for List / Grid Morph + Hover Preview */}
      <div
        className="relative mt-6"
        onMouseMove={viewMode === "list" ? handleRowPointerMove : undefined}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {/* Floating Desktop Hover Preview Thumbnail (Skiper80 Signature Interaction) */}
        <AnimatePresence>
          {viewMode === "list" && hoveredItem && !selectedItem && !prefersReducedMotion && (
            <motion.div
              key={hoveredItem.id}
              initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: cursorOffset.x * 0.12,
                x: cursorOffset.x,
                y: cursorOffset.y,
              }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="hidden lg:block pointer-events-none absolute right-6 top-6 z-20 w-64 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={hoveredItem.imageSrc}
                  alt={hoveredItem.imageAlt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 bg-white">
                <p className="font-mono-tabular text-[11px] text-[#0D6E5C] font-medium">
                  {hoveredItem.time} · {hoveredItem.location}
                </p>
                <p className="text-xs font-semibold text-slate-900 mt-0.5 truncate">
                  {hoveredItem.title}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {viewMode === "list" ? (
          <div className="divide-y divide-slate-200">
            {LODGE_PROGRAMS.map((item) => {
              const isRsvped = rsvpedIds.includes(item.id);
              return (
                <motion.div
                  key={item.id}
                  layout
                  layoutId={`skiper80-card-${item.id}`}
                  onMouseEnter={() => setHoveredItem(item)}
                  className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="flex items-start sm:items-center gap-4 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <span className="font-mono-tabular text-xs font-medium text-slate-400 group-hover:text-[#0D6E5C] transition-colors shrink-0">
                      {item.code}
                    </span>
                    <div className="w-14 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 lg:hidden">
                      <img
                        src={item.imageSrc}
                        alt={item.imageAlt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                        <span className="text-base font-medium text-slate-900 group-hover:text-[#0D6E5C] transition-colors">
                          {item.title}
                        </span>
                        <span className="text-xs text-slate-400" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-mono-tabular text-xs text-slate-600">
                          {item.time}
                        </span>
                        {isRsvped && (
                          <>
                            <span className="text-xs text-slate-400" aria-hidden="true">
                              ·
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D6E5C]">
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              Joined
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {item.location} · {item.accessibilityNote}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onRsvpProgram(item)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        isRsvped
                          ? "bg-emerald-50 text-[#0D6E5C] border border-emerald-200"
                          : "bg-slate-900 text-white hover:bg-[#0D6E5C]"
                      }`}
                    >
                      {isRsvped ? (
                        <>
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          Added to Schedule
                        </>
                      ) : (
                        <>
                          <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" />
                          <RollingActionLabel label="RSVP" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      aria-label={`Inspect ${item.title}`}
                      className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {LODGE_PROGRAMS.map((item) => {
              const isRsvped = rsvpedIds.includes(item.id);
              return (
                <motion.div
                  key={item.id}
                  layout
                  layoutId={`skiper80-card-${item.id}`}
                  whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl border border-slate-200 bg-[#F8FAFC] overflow-hidden flex flex-col justify-between group"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="text-left cursor-pointer block w-full"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-slate-200">
                      <img
                        src={item.imageSrc}
                        alt={item.imageAlt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-mono-tabular text-xs text-[#0D6E5C]">
                        {item.code} · {item.time} · {item.category}
                      </p>
                      <h4 className="mt-1 text-lg font-medium text-slate-900 group-hover:text-[#0D6E5C] transition-colors">
                        {item.title}
                      </h4>
                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                  </button>

                  <div className="px-4 pb-4 pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 truncate">
                      {item.location}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRsvpProgram(item)}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isRsvped
                          ? "bg-emerald-50 text-[#0D6E5C] border border-emerald-200"
                          : "bg-[#0F2922] text-white hover:bg-[#163b31]"
                      }`}
                    >
                      {isRsvped ? "Joined" : "Join Activity"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Skiper80 Shared-Layout Detail Overlay with Draggable Photo Frame */}
      <AnimatePresence>
        {selectedItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-label={selectedItem.title}
          >
            <motion.div
              layoutId={`skiper80-card-${selectedItem.id}`}
              initial={prefersReducedMotion ? { opacity: 0 } : undefined}
              animate={prefersReducedMotion ? { opacity: 1 } : undefined}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono-tabular text-xs text-[#0D6E5C]">
                    {selectedItem.code} · {selectedItem.category} · {selectedItem.time}
                  </p>
                  <h4 className="text-xl font-medium text-slate-900">
                    {selectedItem.title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  aria-label="Close activity detail"
                  className="w-9 h-9 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Draggable Preview Photo (Skiper80 Signature Interactive Element) */}
                <div className="md:col-span-6 space-y-2">
                  <motion.div
                    drag={!prefersReducedMotion}
                    dragSnapToOrigin
                    dragElastic={0.22}
                    whileDrag={{ scale: 1.03, rotate: 2, cursor: "grabbing" }}
                    className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-md cursor-grab relative select-none"
                  >
                    <div className="aspect-[4/3]">
                      <img
                        src={selectedItem.imageSrc}
                        alt={selectedItem.imageAlt}
                        referrerPolicy="no-referrer"
                        draggable={false}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                  <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <Move className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
                    Drag photo lightly to inspect space · Springs back cleanly
                  </p>
                </div>

                {/* Accessible Program Details & Instant Actions */}
                <div className="md:col-span-6 space-y-4">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {selectedItem.detail}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#0D6E5C] shrink-0" aria-hidden="true" />
                      <span>Location: {selectedItem.location}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#0D6E5C] shrink-0" aria-hidden="true" />
                      <span>Hosted by {selectedItem.host}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#0D6E5C] shrink-0" aria-hidden="true" />
                      <span>{selectedItem.spotsAvailable} comfortable seats open</span>
                    </p>
                    <p className="flex items-center gap-2 text-[#0F2922] font-medium">
                      <Accessibility className="w-3.5 h-3.5 text-[#0D6E5C] shrink-0" aria-hidden="true" />
                      <span>{selectedItem.accessibilityNote}</span>
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onRsvpProgram(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D6E5C] text-white px-4 py-2.5 text-xs font-medium hover:bg-[#095547] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" />
                      {rsvpedIds.includes(selectedItem.id)
                        ? "Already on Schedule"
                        : "Add to Daily Schedule"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onBookRideForProgram(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Book Wheel-Chair Escort
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onReadAloud(
                          `Please tell ${residentName} gently about today's lodging activity "${selectedItem.title}" at ${selectedItem.time} in the ${selectedItem.location}, hosted by ${selectedItem.host}. Accessibility details: ${selectedItem.accessibilityNote}.`
                        );
                        setSelectedItem(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-[#0D6E5C] hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Read Aloud
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
