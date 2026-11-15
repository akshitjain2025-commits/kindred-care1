import { motion, useReducedMotion } from "motion/react";
import { CheckCircle2, Droplets, Minus, Plus, RotateCcw } from "lucide-react";
import type { ResidentProfile } from "../data/eldercareData";

interface HydrationTrackerProps {
  resident: ResidentProfile;
  onLogHydrationDelta: (residentId: string, delta: number) => void;
  onUpdateHydrationGoal: (residentId: string, nextTarget: number) => void;
}

export function HydrationTracker({
  resident,
  onLogHydrationDelta,
  onUpdateHydrationGoal,
}: HydrationTrackerProps) {
  const prefersReducedMotion = useReducedMotion();

  const currentGlasses = resident.hydrationGlasses;
  const targetGlasses = Math.max(1, resident.hydrationTarget);
  const progressPct = Math.min(
    100,
    Math.round((currentGlasses / targetGlasses) * 100)
  );
  const consumedMl = currentGlasses * 250;
  const targetMl = targetGlasses * 250;
  const remainingGlasses = Math.max(0, targetGlasses - currentGlasses);
  const goalReached = currentGlasses >= targetGlasses;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h4 className="text-lg font-medium text-slate-900 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-[#0D6E5C]" aria-hidden="true" />
            Daily Hydration Tracker
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Track fluid intake ({resident.comfortPreferences.favoriteDrink}) and
            adjust {resident.name.split(" ")[0]}&apos;s daily glass target.
          </p>
        </div>

        {/* Daily Goal Stepper */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Daily Goal:</span>
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() =>
                onUpdateHydrationGoal(
                  resident.id,
                  Math.max(4, targetGlasses - 1)
                )
              }
              aria-label="Decrease daily hydration goal"
              className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <span className="px-2 font-mono-tabular text-xs font-semibold text-slate-900 whitespace-nowrap">
              {targetGlasses} glasses
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateHydrationGoal(
                  resident.id,
                  Math.min(16, targetGlasses + 1)
                )
              }
              aria-label="Increase daily hydration goal"
              className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Visual Animated Carafe / Fluid Level Indicator */}
        <div className="md:col-span-4 flex items-center gap-5">
          <div
            className="relative w-20 h-28 rounded-2xl border-2 border-slate-200 bg-slate-50 overflow-hidden shrink-0"
            role="img"
            aria-label={`Hydration level at ${progressPct} percent`}
          >
            <motion.div
              initial={false}
              animate={{ height: `${progressPct}%` }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.1 }
                  : { type: "spring", stiffness: 120, damping: 18 }
              }
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0D6E5C] to-emerald-400/85"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
              <span
                className={`font-mono-tabular text-lg font-bold ${
                  progressPct > 55 ? "text-white drop-shadow-xs" : "text-slate-900"
                }`}
              >
                {progressPct}%
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-mono-tabular text-2xl font-semibold text-slate-900">
              {currentGlasses}{" "}
              <span className="text-sm font-normal text-slate-500">
                / {targetGlasses} glasses
              </span>
            </p>
            <p className="font-mono-tabular text-xs text-slate-600">
              {consumedMl.toLocaleString()} mL of {targetMl.toLocaleString()} mL
            </p>
            <p className="text-xs font-medium text-[#0D6E5C] flex items-center gap-1 pt-0.5">
              {goalReached ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Daily hydration target reached
                </>
              ) : (
                <span>
                  {remainingGlasses} glass{remainingGlasses === 1 ? "" : "es"} left
                  today
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Individual Glass Pips + Preset Goals + Quick-Add (+1, +2) Controls */}
        <div className="md:col-span-8 space-y-4">
          {/* Segmented Glass Progress Strip */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Today&apos;s Glasses (250 mL each)</span>
              <div className="flex items-center gap-1.5">
                <span>Quick Goal:</span>
                {[6, 8, 10].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onUpdateHydrationGoal(resident.id, preset)}
                    className={`px-2 py-0.5 rounded-md font-mono-tabular text-[11px] transition-colors cursor-pointer ${
                      targetGlasses === preset
                        ? "bg-[#0F2922] text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
              {Array.from({ length: Math.min(16, Math.max(targetGlasses, currentGlasses)) }).map(
                (_, idx) => {
                  const filled = idx < currentGlasses;
                  return (
                    <motion.div
                      key={idx}
                      initial={false}
                      animate={{ scale: filled ? 1 : 0.96 }}
                      transition={{ duration: 0.18 }}
                      className={`h-7 rounded-lg border flex items-center justify-center transition-colors ${
                        filled
                          ? "bg-emerald-50 border-[#0D6E5C] text-[#0D6E5C]"
                          : "bg-slate-50 border-slate-200 text-slate-300"
                      }`}
                      title={`Glass ${idx + 1}`}
                    >
                      <Droplets className="w-3.5 h-3.5" aria-hidden="true" />
                    </motion.div>
                  );
                }
              )}
            </div>
          </div>

          {/* Quick-Add Buttons (+1, +2 Glasses) & Undo */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onLogHydrationDelta(resident.id, 1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D6E5C] text-white px-4 py-2.5 text-xs sm:text-sm font-medium hover:bg-[#095547] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              +1 Glass (250 mL)
            </button>

            <button
              type="button"
              onClick={() => onLogHydrationDelta(resident.id, 2)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F2922] text-white px-4 py-2.5 text-xs sm:text-sm font-medium hover:bg-[#163b31] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              +2 Glasses (500 mL)
            </button>

            <button
              type="button"
              disabled={currentGlasses === 0}
              onClick={() => onLogHydrationDelta(resident.id, -1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Undo (-1)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
