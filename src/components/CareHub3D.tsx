import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { SlidersHorizontal, Volume2, VolumeX } from "lucide-react";
import { CARE_MODE_META, type SpatialCareMode } from "../data/eldercareData";
import {
  AmbientSoundscapeEngine,
  getTimeOfDayPhase,
  resolveSoundscapeProfile,
  type SoundscapePreset,
} from "../utils/ambientSoundscape";

interface CareHub3DProps {
  activeMode: SpatialCareMode;
  onModeChange: (mode: SpatialCareMode) => void;
  voiceActive: boolean;
  voiceAmplitudeRef: { current: number };
  residentName: string;
  residentStatus: "Calm" | "Active" | "Resting";
}

export function CareHub3D({
  activeMode,
  onModeChange,
  voiceActive,
  voiceAmplitudeRef,
  residentName,
  residentStatus,
}: CareHub3DProps) {
  const prefersReducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<AmbientSoundscapeEngine | null>(null);

  const [soundscapeEnabled, setSoundscapeEnabled] = useState(false);
  const [soundscapePreset, setSoundscapePreset] =
    useState<SoundscapePreset>("auto");
  const [soundscapeVolume, setSoundscapeVolume] = useState(0.45);
  const [soundscapeOpen, setSoundscapeOpen] = useState(false);
  const [soundError, setSoundError] = useState<string | null>(null);
  const [liveVoiceLevel, setLiveVoiceLevel] = useState(0);
  const [photoFailed, setPhotoFailed] = useState(false);

  // Subtle 3D pointer parallax tilt (compositor-only transforms)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 160, damping: 24 });
  const smoothY = useSpring(mouseY, { stiffness: 160, damping: 24 });
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-3.5, 3.5]);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [3.5, -3.5]);

  const handlePointerMove = (e: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(nx);
    mouseY.set(ny);
  };

  const handlePointerLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Sync voice amplitude to subtle bar meter when Gemini speaks
  useEffect(() => {
    if (!voiceActive) {
      setLiveVoiceLevel(0);
      return;
    }
    let raf = 0;
    const sample = () => {
      setLiveVoiceLevel(voiceAmplitudeRef.current);
      raf = requestAnimationFrame(sample);
    };
    raf = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(raf);
  }, [voiceActive, voiceAmplitudeRef]);

  // Ambient Soundscapes Web Audio lifecycle
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new AmbientSoundscapeEngine();
    }
    const engine = engineRef.current;

    if (soundscapeEnabled) {
      engine
        .start(soundscapeVolume, soundscapePreset, residentStatus)
        .then(() => setSoundError(null))
        .catch((err) => {
          setSoundError(
            err instanceof Error ? err.message : "Could not start audio playback."
          );
          setSoundscapeEnabled(false);
        });
    } else {
      engine.stop();
    }
  }, [soundscapeEnabled, soundscapePreset, soundscapeVolume, residentStatus]);

  useEffect(() => {
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  const activeMeta = CARE_MODE_META[activeMode];
  const timePhase = getTimeOfDayPhase();
  const resolvedAudio = resolveSoundscapeProfile(
    soundscapePreset,
    timePhase,
    residentStatus
  );

  return (
    <div
      ref={stageRef}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      className="perspective-stage w-full"
    >
      <motion.div
        style={
          prefersReducedMotion
            ? undefined
            : { rotateX, rotateY, transformStyle: "preserve-3d" }
        }
        className="relative w-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
      >
        {/* Editorial Living Space Photo with Measured Contrast Scrim */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200">
          {photoFailed ? (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-emerald-50 flex items-center justify-center p-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                {residentName} · Home Sanctuary
              </p>
            </div>
          ) : (
            <img
              src="/assets/images/eldercare_living_sunlight_1794715912243.jpg"
              alt="Older adult and family member sharing morning tea in a sunlit living room"
              referrerPolicy="no-referrer"
              onError={() => setPhotoFailed(true)}
              className="w-full h-full object-cover"
            />
          )}

          {/* Measured Dark Gradient Scrim for 4.5:1+ Legibility */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#0F2922]/95 via-[#0F2922]/45 to-transparent"
            aria-hidden="true"
          />

          {/* Top-Left Minimal Context Line */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-4">
            <div className="rounded-xl bg-white/95 border border-slate-200 px-3.5 py-2 shadow-xs">
              <p className="text-xs font-medium text-slate-900 whitespace-nowrap">
                {residentName} · {residentStatus} Baseline
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSoundscapeOpen((v) => !v)}
              aria-expanded={soundscapeOpen}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-xs ${
                soundscapeEnabled
                  ? "bg-[#0D6E5C] border-[#0D6E5C] text-white"
                  : "bg-white/95 border-slate-200 text-slate-800 hover:bg-white"
              }`}
            >
              {soundscapeEnabled ? (
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>Ambient Soundscapes</span>
            </button>
          </div>

          {/* 3D Depth-Transitioning Mode Overlay at Bottom of Frame */}
          <div className="absolute bottom-5 left-5 right-5 perspective-stage">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMode}
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotateX: 10, y: 14, scale: 0.985 }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, rotateX: 0, y: 0, scale: 1 }
                }
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotateX: -8, y: -10, scale: 0.985 }
                }
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white"
              >
                <div className="max-w-lg">
                  <p className="text-xs font-medium text-emerald-300">
                    {activeMeta.label}
                  </p>
                  <h2 className="mt-1 text-xl sm:text-2xl font-medium leading-snug text-white">
                    {activeMeta.headline}
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {activeMeta.description}
                  </p>
                </div>

                <div className="shrink-0 sm:text-right">
                  <p className="text-xs text-emerald-200">{activeMeta.metricLabel}</p>
                  <p className="mt-0.5 font-mono-tabular text-lg font-semibold text-white">
                    {activeMeta.metricValue}
                  </p>
                  {voiceActive && (
                    <div
                      className="mt-2 flex sm:justify-end items-end gap-1 h-4"
                      aria-hidden="true"
                    >
                      {[0.4, 0.85, 0.6, 1, 0.5].map((w, idx) => (
                        <span
                          key={idx}
                          className="w-1 rounded-full bg-emerald-300 transition-transform duration-75"
                          style={{
                            height: "14px",
                            transform: `scaleY(${Math.max(0.25, liveVoiceLevel * w)})`,
                            transformOrigin: "bottom",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Collapsible Ambient Soundscapes Settings Drawer (3D Reveal) */}
        <AnimatePresence initial={false}>
          {soundscapeOpen && (
            <motion.div
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, rotateX: -6, y: -6 }
              }
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, rotateX: -6, y: -6 }
              }
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-slate-200 bg-[#F8FAFC] px-5 py-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <SlidersHorizontal
                      className="w-4 h-4 text-[#0D6E5C]"
                      aria-hidden="true"
                    />
                    <span>Ambient Soundscapes</span>
                    <span className="text-xs font-normal text-slate-500">
                      · {resolvedAudio.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Synthesizes gentle white noise and natural textures tuned to{" "}
                    {timePhase} hours and {residentName}&apos;s {residentStatus.toLowerCase()}{" "}
                    status.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSoundscapeEnabled((v) => !v)}
                    aria-pressed={soundscapeEnabled}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      soundscapeEnabled
                        ? "bg-[#0D6E5C] text-white"
                        : "bg-[#0F2922] text-white hover:bg-[#163b31]"
                    }`}
                  >
                    {soundscapeEnabled ? "Turn Soundscape Off" : "Play Soundscape"}
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-200/70">
                  {(
                    [
                      { id: "auto", label: "Auto (Time & Status)" },
                      { id: "breeze", label: "Morning Breeze" },
                      { id: "rain", label: "Soft Rain" },
                      { id: "night", label: "Night Hush" },
                    ] as { id: SoundscapePreset; label: string }[]
                  ).map((presetOpt) => (
                    <button
                      key={presetOpt.id}
                      type="button"
                      onClick={() => setSoundscapePreset(presetOpt.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        soundscapePreset === presetOpt.id
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {presetOpt.label}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-2.5 text-xs text-slate-700">
                  <span>Volume</span>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={soundscapeVolume}
                    onChange={(e) => setSoundscapeVolume(Number(e.target.value))}
                    className="w-24 accent-[#0D6E5C] cursor-pointer"
                  />
                  <span className="font-mono-tabular w-8 text-right">
                    {Math.round(soundscapeVolume * 100)}%
                  </span>
                </label>
              </div>

              {soundError && (
                <p role="alert" className="mt-2 text-xs text-rose-700">
                  {soundError}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Mode Switcher Strip */}
        <div className="border-t border-slate-200 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex flex-wrap items-center gap-1"
            role="tablist"
            aria-label="Sanctuary Care Modes"
          >
            {(["overview", "medications", "safety", "voice"] as SpatialCareMode[]).map(
              (modeKey) => {
                const isActive = activeMode === modeKey;
                const shortLabel =
                  modeKey === "overview"
                    ? "Sanctuary"
                    : modeKey === "medications"
                      ? "Medications"
                      : modeKey === "safety"
                        ? "Fall Guard"
                        : "Voice Companion";
                return (
                  <button
                    key={modeKey}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onModeChange(modeKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? "bg-[#0F2922] text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {shortLabel}
                  </button>
                );
              }
            )}
          </div>

          <span className="text-xs text-slate-500 font-mono-tabular whitespace-nowrap">
            {soundscapeEnabled ? `Audio: ${resolvedAudio.label}` : "Audio: Muted"}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
