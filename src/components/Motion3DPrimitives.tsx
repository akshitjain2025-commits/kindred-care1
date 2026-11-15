import { useRef, type MouseEvent, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

interface SpatialRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function SpatialDepthReveal({
  children,
  className = "",
  delay = 0,
}: SpatialRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 22,
        rotateX: 6,
        scale: 0.988,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        rotateX: 0,
        scale: 1,
      }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ transformPerspective: 1200, transformOrigin: "50% 100%" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface PerspectiveCardProps {
  children: ReactNode;
  className?: string;
}

export function Perspective3DCard({ children, className = "" }: PerspectiveCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 220, damping: 24 });
  const springY = useSpring(pointerY, { stiffness: 220, damping: 24 });
  const rotateY = useTransform(springX, [-0.5, 0.5], [-3, 3]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [3, -3]);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileHover={{
        y: -4,
        transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
      }}
      whileTap={{
        scale: 0.992,
        transition: { duration: 0.12 },
      }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1100,
        transformStyle: "preserve-3d",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
