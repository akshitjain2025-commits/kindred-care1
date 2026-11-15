import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Hospital,
  Mic,
  Plus,
  ShieldCheck,
  Volume2,
  X,
} from "lucide-react";

interface FeatureSlide {
  id: string;
  indexLabel: string;
  title: string;
  shortLabel: string;
  summary: string;
  detail: string;
  metric: string;
  caption: string;
  icon: typeof ShieldCheck;
  imageSrc: string;
  imageAlt: string;
}

type AccentTone = "evergreen" | "slate" | "linen";

const TONE_STYLES: Record<
  AccentTone,
  {
    name: string;
    swatch: string;
    surfaceBg: string;
    activePillBg: string;
    activeText: string;
  }
> = {
  evergreen: {
    name: "Deep Evergreen",
    swatch: "#0F2922",
    surfaceBg: "bg-[#0F2922]",
    activePillBg: "bg-white/14 border-white/25",
    activeText: "text-emerald-300",
  },
  slate: {
    name: "Twilight Slate",
    swatch: "#1E293B",
    surfaceBg: "bg-slate-900",
    activePillBg: "bg-white/14 border-white/25",
    activeText: "text-sky-300",
  },
  linen: {
    name: "Warm Sanctuary",
    swatch: "#2B3A32",
    surfaceBg: "bg-[#23312A]",
    activePillBg: "bg-white/14 border-white/25",
    activeText: "text-amber-200",
  },
};

const FEATURE_SLIDES: FeatureSlide[] = [
  {
    id: "presence",
    indexLabel: "01",
    title: "Camera-Free Spatial Presence",
    shortLabel: "Spatial Sensing",
    summary:
      "Ambient millimeter-wave rhythm sensing tracks gait stability and hallway pauses without a single lens.",
    detail:
      "Detects unusual stillness in the kitchen or nighttime wandering across corridors and illuminates low-glare path cues automatically while logging timestamps for family.",
    metric: "14 sec median alert triage",
    caption: "Oakridge Living Sanctuary · Privacy-First Architecture",
    icon: ShieldCheck,
    imageSrc: "/assets/images/eldercare_living_sunlight_1794715912243.jpg",
    imageAlt: "Older father and daughter sharing tea in a sunlit living room",
  },
  {
    id: "soundscapes",
    indexLabel: "02",
    title: "Circadian Ambient Soundscapes",
    shortLabel: "Adaptive Audio",
    summary:
      "Procedural pink and brown noise textures tune dynamically to morning, afternoon, or quiet rest hours.",
    detail:
      "Soft acoustic masking eases restless afternoons and nighttime sensitivity, adapting automatically whenever a caregiver updates the resident's Calm, Active, or Resting status.",
    metric: "Zero looping samples · Web Audio DSP",
    caption: "Synthesized locally for seamless, gentle room acoustics",
    icon: Volume2,
    imageSrc: "/assets/images/caregiver_medication_tablet_1794715912691.jpg",
    imageAlt: "Ceramic medication organizer beside chamomile tea",
  },
  {
    id: "hospitals",
    indexLabel: "03",
    title: "Nearest Care & Hospital Routing",
    shortLabel: "Hospital Locator",
    summary:
      "One-tap lookup locates nearby verified hospitals and urgent care centers around the resident's home.",
    detail:
      "Powered by Google Maps Platform Places and Routes, displaying live distance, current open status, direct hospital phone numbers, and turn-by-turn drive previews.",
    metric: "Live proximity & drive-time routes",
    caption: "Connected directly to resident neighborhood coordinates",
    icon: Hospital,
    imageSrc: "/assets/images/family_garden_walk_1794715913136.jpg",
    imageAlt: "Older mother walking with her adult son along a garden pathway",
  },
  {
    id: "voice",
    indexLabel: "04",
    title: "Gemini Spoken Continuity",
    shortLabel: "Voice Companion",
    summary:
      "Natural voice conversation grounded in today's schedule, active prescriptions, and live web guidance.",
    detail:
      "Seniors speak without navigating tiny mobile menus; Kindred checks today's task list, pulls up-to-date wellness answers via Search Grounding, and speaks back in an unhurried tone.",
    metric: "24 kHz warm voice synthesis",
    caption: "Personalized to favorite tea cues and quiet hours",
    icon: Mic,
    imageSrc: "/assets/images/senior_portrait_eleanor_1794715912898.jpg",
    imageAlt: "Warm portrait of older adult in sunlit home",
  },
];

export function SkiperFeatureShowcase() {
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(FEATURE_SLIDES[0].id);
  const [tone, setTone] = useState<AccentTone>("evergreen");

  const activeSlide = FEATURE_SLIDES[activeIndex];
  const toneConfig = TONE_STYLES[tone];

  const handleSelectSlide = (idx: number) => {
    setActiveIndex(idx);
    setExpandedId(FEATURE_SLIDES[idx].id);
  };

  const handleStep = (dir: -1 | 1) => {
    const next = (activeIndex + dir + FEATURE_SLIDES.length) % FEATURE_SLIDES.length;
    handleSelectSlide(next);
  };

  return (
    <section className="py-16 border-t border-slate-200 bg-[#F8FAFC]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#0D6E5C] tracking-wide">
              Interactive Capability Showcase
            </p>
            <h2 className="mt-2 text-3xl lg:text-4xl font-medium tracking-tight text-slate-900 text-balance">
              Explore every layer of the Kindred Care sanctuary
            </h2>
          </div>

          {/* Theme Finish Selector (Apple Feature Block / Skiper76 pattern) */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <span className="text-xs font-medium text-slate-500">
              Finish: {toneConfig.name}
            </span>
            <div
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5"
              role="group"
              aria-label="Showcase finish tone"
            >
              {(Object.keys(TONE_STYLES) as AccentTone[]).map((tKey) => {
                const selected = tone === tKey;
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => setTone(tKey)}
                    aria-label={TONE_STYLES[tKey].name}
                    aria-pressed={selected}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                      selected
                        ? "ring-2 ring-offset-2 ring-[#0D6E5C] scale-110"
                        : "opacity-75 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: TONE_STYLES[tKey].swatch }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Skiper76-style Dark Showcase Stage with Expandable Kinetic Capsules + Synced Visual */}
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className={`rounded-3xl ${toneConfig.surfaceBg} text-white p-6 sm:p-8 lg:p-10 overflow-hidden shadow-lg transition-colors duration-300`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Expandable Feature Stack */}
            <div className="lg:col-span-5 space-y-3">
              {FEATURE_SLIDES.map((slide, idx) => {
                const isSelected = idx === activeIndex;
                const isExpanded = expandedId === slide.id && isSelected;
                const Icon = slide.icon;

                return (
                  <motion.div
                    key={slide.id}
                    layout
                    transition={
                      prefersReducedMotion
                        ? { duration: 0.15 }
                        : { type: "spring", stiffness: 320, damping: 30 }
                    }
                    className={`rounded-2xl border transition-colors ${
                      isSelected
                        ? `${toneConfig.activePillBg} shadow-xs`
                        : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setExpandedId((prev) =>
                            prev === slide.id ? null : slide.id
                          );
                        } else {
                          handleSelectSlide(idx);
                        }
                      }}
                      className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-white text-slate-900"
                              : "bg-white/10 text-white/80"
                          }`}
                        >
                          <Icon className="w-4 h-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <span className="font-mono-tabular text-[11px] text-white/60 block">
                            {slide.indexLabel} · {slide.shortLabel}
                          </span>
                          <span className="text-sm font-semibold text-white truncate block">
                            {slide.title}
                          </span>
                        </div>
                      </div>

                      <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        {isExpanded ? (
                          <X className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />
                        )}
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={
                            prefersReducedMotion
                              ? { opacity: 0 }
                              : { opacity: 0, height: 0 }
                          }
                          animate={{ opacity: 1, height: "auto" }}
                          exit={
                            prefersReducedMotion
                              ? { opacity: 0 }
                              : { opacity: 0, height: 0 }
                          }
                          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-2">
                            <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                              {slide.detail}
                            </p>
                            <p
                              className={`font-mono-tabular text-xs font-medium ${toneConfig.activeText}`}
                            >
                              {slide.metric}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* Step Controls & Expanding Indicator Dots (Skiper76 choreography) */}
              <div className="pt-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStep(-1)}
                    aria-label="Previous showcase capability"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep(1)}
                    aria-label="Next showcase capability"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex items-center gap-2" role="tablist" aria-label="Feature slides">
                  {FEATURE_SLIDES.map((s, idx) => {
                    const active = idx === activeIndex;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-label={s.title}
                        onClick={() => handleSelectSlide(idx)}
                        className="h-2.5 rounded-full bg-white/25 overflow-hidden relative cursor-pointer transition-all"
                        style={{ width: active ? 32 : 10 }}
                      >
                        {active && (
                          <motion.span
                            layoutId="skiper76-indicator"
                            className="absolute inset-0 rounded-full bg-white"
                            transition={{
                              type: "spring",
                              stiffness: 360,
                              damping: 30,
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Smooth Cross-Fading 3D Depth Visual Frame */}
            <div className="lg:col-span-7 perspective-stage">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide.id}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.96, rotateY: 6, x: 18 }
                  }
                  animate={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 1, scale: 1, rotateY: 0, x: 0 }
                  }
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.96, rotateY: -6, x: -18 }
                  }
                  transition={{
                    type: "spring",
                    stiffness: 240,
                    damping: 26,
                  }}
                  className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/25 aspect-[16/10]"
                >
                  <img
                    src={activeSlide.imageSrc}
                    alt={activeSlide.imageAlt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
                    aria-hidden="true"
                  />
                  <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="max-w-lg">
                      <p className={`text-xs font-medium ${toneConfig.activeText}`}>
                        {activeSlide.indexLabel} · {activeSlide.shortLabel}
                      </p>
                      <h3 className="mt-1 text-xl sm:text-2xl font-medium text-white">
                        {activeSlide.title}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm text-white/85 leading-relaxed">
                        {activeSlide.summary}
                      </p>
                    </div>
                    <span className="font-mono-tabular text-xs text-white/75 shrink-0">
                      {activeSlide.caption}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
