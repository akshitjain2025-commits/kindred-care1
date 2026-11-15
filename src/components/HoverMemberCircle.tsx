import { useRef, useState, type PointerEvent } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import type { FamilyMember } from "../data/eldercareData";

/**
 * Skiper6-style "hover members" roster (reimplemented in-repo: the registry
 * component is Pro/licensed and cannot be installed through the shadcn CLI).
 * Hovering or focusing a member reveals their name with a staggered letter
 * animation while a cursor follower tracks the pointer across the stage.
 */
interface HoverMemberCircleProps {
  members: FamilyMember[];
  residentName: string;
  defaultName?: string;
}

function initialsOf(name: string) {
  return name
    .replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function HoverMemberCircle({
  members,
  residentName,
  defaultName = "The care circle",
}: HoverMemberCircleProps) {
  const prefersReducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const followerX = useSpring(pointerX, { stiffness: 260, damping: 26, mass: 0.4 });
  const followerY = useSpring(pointerY, { stiffness: 260, damping: 26, mass: 0.4 });

  const hovered = members.find((member) => member.id === hoveredId) ?? null;
  const activeName = hovered?.name ?? defaultName;

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    pointerX.set(event.clientX - rect.left);
    pointerY.set(event.clientY - rect.top);
  };

  if (members.length === 0) return null;

  return (
    <div
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHoveredId(null)}
      className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 px-6 py-8 sm:px-8"
    >
      {/* Cursor follower */}
      {!prefersReducedMotion && hovered && (
        <motion.span
          aria-hidden="true"
          style={{ x: followerX, y: followerY }}
          className="pointer-events-none absolute left-0 top-0 z-20 hidden md:block"
        >
          <span className="relative flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <span className="absolute h-16 w-16 rounded-full bg-[#0D6E5C]/12" />
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#0D6E5C] text-[10px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(13,110,92,0.8)]">
              {initialsOf(hovered.name)}
            </span>
          </span>
        </motion.span>
      )}

      <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#0D6E5C]">
            The people around {residentName}
          </p>

          <div className="mt-2 min-h-[3.25rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={activeName}
                aria-live="polite"
                className="text-2xl sm:text-[1.75rem] font-medium tracking-tight text-slate-900"
              >
                {Array.from(activeName).map((char, index) =>
                  char === " " ? (
                    <span key={`space-${index}`}>&nbsp;</span>
                  ) : (
                    <motion.span
                      key={`${char}-${index}`}
                      className="inline-block"
                      initial={
                        prefersReducedMotion ? false : { y: 14, opacity: 0 }
                      }
                      animate={{ y: 0, opacity: 1 }}
                      exit={
                        prefersReducedMotion ? undefined : { y: -14, opacity: 0 }
                      }
                      transition={{
                        duration: 0.35,
                        delay: prefersReducedMotion ? 0 : index * 0.012,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      {char}
                    </motion.span>
                  )
                )}
              </motion.p>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={hovered ? `${hovered.id}-meta` : "default-meta"}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600"
            >
              {hovered ? (
                <>
                  <span className="font-medium text-slate-800">{hovered.role}</span>
                  <span aria-hidden="true" className="text-slate-400">
                    ·
                  </span>
                  <span>{hovered.location}</span>
                  <span aria-hidden="true" className="text-slate-400">
                    ·
                  </span>
                  <span className="text-slate-500">{hovered.lastCheckIn}</span>
                </>
              ) : (
                <span className="text-slate-500">
                  Hover a face to meet the people sharing {residentName}&apos;s
                  daily care.
                </span>
              )}
            </motion.p>
          </AnimatePresence>
        </div>

        <ul className="flex flex-wrap items-center gap-3 sm:gap-4">
          {members.map((member) => {
            const isActive = member.id === hoveredId;
            return (
              <li key={member.id}>
                <button
                  type="button"
                  aria-label={`${member.name} — ${member.role}`}
                  onMouseEnter={() => setHoveredId(member.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(member.id)}
                  onBlur={() => setHoveredId(null)}
                  className="group flex cursor-pointer flex-col items-center gap-2 rounded-2xl px-1.5 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[#0D6E5C]/40"
                >
                  <motion.span
                    animate={
                      prefersReducedMotion
                        ? undefined
                        : isActive
                          ? { scale: 1.06, y: -3 }
                          : { scale: 1, y: 0 }
                    }
                    transition={{ type: "spring", stiffness: 320, damping: 24 }}
                    className={`relative flex h-20 w-20 items-center justify-center rounded-full border text-base font-semibold transition-colors duration-300 ${
                      isActive
                        ? "border-[#0D6E5C]/50 bg-[#0D6E5C] text-white shadow-[0_16px_30px_-16px_rgba(13,110,92,0.75)]"
                        : "border-slate-200 bg-white text-slate-500 group-hover:border-[#0D6E5C]/35"
                    }`}
                  >
                    {initialsOf(member.name)}
                    <span
                      aria-hidden="true"
                      className={`absolute -inset-1.5 rounded-full border transition-all duration-300 ${
                        isActive
                          ? "border-[#0D6E5C]/30 opacity-100"
                          : "border-transparent opacity-0"
                      }`}
                    />
                  </motion.span>
                  <span
                    className={`max-w-[7.5rem] text-center text-[11px] leading-tight transition-colors duration-300 ${
                      isActive ? "text-[#0D6E5C]" : "text-slate-500"
                    }`}
                  >
                    {member.role}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
