import type { ReactNode } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Skiper86 "Apple Ai gradient", reimplemented in-repo: a slowly rotating
 * conic-gradient ring behind a surface, blurred by an intensity step, with the
 * gradient fading in and out rather than snapping.
 *
 * The registry component is Pro-only (the shadcn registry returns 401 without a
 * license key) and pulls in `use-sound` for a toggle click, which this project
 * does not ship — so the effect is CSS + motion here, no extra dependency.
 */
interface AppleGradientFrameProps {
  children: ReactNode;
  active?: boolean;
  intensity?: "sm" | "md" | "lg" | "xl";
  className?: string;
  innerClassName?: string;
}

const INTENSITY = {
  sm: { blur: 4, opacity: 0.75, ring: 2 },
  md: { blur: 8, opacity: 0.85, ring: 3 },
  lg: { blur: 14, opacity: 0.95, ring: 4 },
  xl: { blur: 22, opacity: 1, ring: 5 },
} as const;

const GRADIENT =
  "conic-gradient(from 0deg, #022c22, #0c4a6e, #312e81, #831843, #7c2d12, #134e4a, #022c22)";

export function AppleGradientFrame({
  children,
  active = true,
  intensity = "lg",
  className = "",
  innerClassName = "rounded-3xl bg-white",
}: AppleGradientFrameProps) {
  const prefersReducedMotion = useReducedMotion();
  const config = INTENSITY[intensity];

  return (
    <div className={`relative ${className}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[5px] overflow-hidden rounded-[inherit] transition-opacity duration-700 ease-out"
        style={{ opacity: active ? 1 : 0 }}
      >
        <div
          className={`absolute left-1/2 top-1/2 h-[240%] w-[240%] -translate-x-1/2 -translate-y-1/2 ${
            prefersReducedMotion ? "" : "kindred-gradient-spin"
          }`}
          style={{
            background: GRADIENT,
            filter: `blur(${config.blur}px)`,
            opacity: config.opacity,
          }}
        />
      </div>

      {active && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-[5px] rounded-[inherit]"
            style={{
              background: GRADIENT,
              padding: `${config.ring}px`,
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              maskComposite: "exclude",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-2 -z-10 rounded-[inherit] blur-2xl"
            style={{ background: GRADIENT, opacity: prefersReducedMotion ? 0.24 : 0.42 }}
          />
        </>
      )}

      <div className={`relative overflow-hidden ${innerClassName}`}>{children}</div>
    </div>
  );
}
