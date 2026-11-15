import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Brain,
  Check,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Wind,
} from "lucide-react";

interface SeniorMindBodyStudioProps {
  residentId: string;
  residentName: string;
  onAddNote: (residentId: string, author: string, text: string) => void;
  onBoostActivity?: (residentId: string) => void;
}

const STRETCH_STEPS = [
  {
    title: "Slow Shoulder Rolls",
    cue: "Sit tall in a supportive chair. Roll both shoulders forward, up, and gently back 5 times.",
    seconds: 25,
  },
  {
    title: "Seated Ankle Circles",
    cue: "Lift one foot slightly off the floor and draw slow circles with your toes to boost leg circulation.",
    seconds: 25,
  },
  {
    title: "Gentle Chin & Neck Ease",
    cue: "Slowly look toward the sunlit window on the left, pause 3 seconds, then look smoothly to the right.",
    seconds: 25,
  },
  {
    title: "Open-Chest Ribcage Breath",
    cue: "Place hands gently on your lap, lift your chest while inhaling, and relax shoulders down completely.",
    seconds: 25,
  },
];

const MEMORY_TOKENS = [
  { key: "tea", label: "Chamomile Tea" },
  { key: "garden", label: "Garden Walk" },
  { key: "jazz", label: "Vinyl Jazz" },
  { key: "lantern", label: "Warm Lamp" },
  { key: "book", label: "Large Print Book" },
  { key: "rose", label: "Tea Rose" },
];

interface MemoryCard {
  uid: string;
  key: string;
  label: string;
  matched: boolean;
}

function buildShuffledDeck(): MemoryCard[] {
  const deck: MemoryCard[] = [];
  MEMORY_TOKENS.forEach((item) => {
    deck.push({ uid: `${item.key}-a`, key: item.key, label: item.label, matched: false });
    deck.push({ uid: `${item.key}-b`, key: item.key, label: item.label, matched: false });
  });
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function SeniorMindBodyStudio({
  residentId,
  residentName,
  onAddNote,
  onBoostActivity,
}: SeniorMindBodyStudioProps) {
  const prefersReducedMotion = useReducedMotion();

  // 1. 4-4-6 Breathing Pacer
  const [breathingOn, setBreathingOn] = useState(false);
  const [breathTick, setBreathTick] = useState(0); // 0..13 cycle (4 in, 4 hold, 6 out)

  useEffect(() => {
    if (!breathingOn) return;
    const interval = window.setInterval(() => {
      setBreathTick((t) => (t + 1) % 14);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [breathingOn]);

  const breathPhase =
    breathTick < 4
      ? { label: "Breathe In Slowly", remain: 4 - breathTick, scale: 1.24 }
      : breathTick < 8
        ? { label: "Hold Gently", remain: 8 - breathTick, scale: 1.24 }
        : { label: "Slow Relaxed Exhale", remain: 14 - breathTick, scale: 0.92 };

  // 2. Seated Chair Stretch Coach
  const [stretchIndex, setStretchIndex] = useState(0);
  const [stretchRunning, setStretchRunning] = useState(false);
  const [stretchRemain, setStretchRemain] = useState(STRETCH_STEPS[0].seconds);
  const [stretchLogged, setStretchLogged] = useState(false);

  useEffect(() => {
    if (!stretchRunning) return;
    const timer = window.setInterval(() => {
      setStretchRemain((prev) => {
        if (prev > 1) return prev - 1;
        if (stretchIndex < STRETCH_STEPS.length - 1) {
          const nextIdx = stretchIndex + 1;
          setStretchIndex(nextIdx);
          return STRETCH_STEPS[nextIdx].seconds;
        }
        setStretchRunning(false);
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [stretchRunning, stretchIndex]);

  const currentStretch = STRETCH_STEPS[stretchIndex];

  const handleLogStretchSession = () => {
    onAddNote(
      residentId,
      "Mobility Coach",
      `${residentName} completed a calm seated chair-stretch mobility session.`
    );
    onBoostActivity?.(residentId);
    setStretchLogged(true);
    window.setTimeout(() => setStretchLogged(false), 3000);
  };

  // 3. Calm Memory Recall Pair Warm-Up
  const [deck, setDeck] = useState<MemoryCard[]>(() => buildShuffledDeck());
  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [movesCount, setMovesCount] = useState(0);
  const [memoryLogged, setMemoryLogged] = useState(false);
  const lockRef = useRef(false);

  const matchedPairs = deck.filter((c) => c.matched).length / 2;
  const allMatched = matchedPairs === MEMORY_TOKENS.length;

  const handleCardPick = (card: MemoryCard) => {
    if (lockRef.current || card.matched || flippedUids.includes(card.uid)) return;
    const nextFlipped = [...flippedUids, card.uid];
    setFlippedUids(nextFlipped);

    if (nextFlipped.length === 2) {
      setMovesCount((m) => m + 1);
      const first = deck.find((c) => c.uid === nextFlipped[0]);
      const second = card;
      if (first && first.key === second.key) {
        const updatedDeck = deck.map((c) =>
          c.key === first.key ? { ...c, matched: true } : c
        );
        setDeck(updatedDeck);
        setFlippedUids([]);
        if (updatedDeck.every((c) => c.matched) && !memoryLogged) {
          setMemoryLogged(true);
          onAddNote(
            residentId,
            "Cognitive Wellness",
            `${residentName} completed the 6-pair gentle memory recall warm-up in ${
              movesCount + 1
            } turns.`
          );
        }
      } else {
        lockRef.current = true;
        window.setTimeout(() => {
          setFlippedUids([]);
          lockRef.current = false;
        }, 780);
      }
    }
  };

  const resetMemoryGame = () => {
    setDeck(buildShuffledDeck());
    setFlippedUids([]);
    setMovesCount(0);
    setMemoryLogged(false);
    lockRef.current = false;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Calm 4-4-6 Breathing Pacer */}
      <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-lg font-medium text-slate-900 flex items-center gap-2">
              <Wind className="w-4 h-4 text-[#0D6E5C]" aria-hidden="true" />
              4-4-6 Calm Breathing
            </h4>
            <span className="font-mono-tabular text-xs text-slate-500">
              Paced Rest
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Gently lowers afternoon restlessness and steadies heart rate before rest
            or clinic calls.
          </p>
        </div>

        <div className="my-6 flex flex-col items-center justify-center py-4">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <motion.div
              animate={
                prefersReducedMotion
                  ? { scale: 1 }
                  : { scale: breathingOn ? breathPhase.scale : 1 }
              }
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="w-28 h-28 rounded-full bg-emerald-50 border-2 border-[#0D6E5C]/40 flex flex-col items-center justify-center text-center shadow-inner"
            >
              <span className="font-mono-tabular text-2xl font-semibold text-[#0F2922]">
                {breathingOn ? `${breathPhase.remain}s` : "4-4-6"}
              </span>
            </motion.div>
          </div>
          <p className="mt-2 text-sm font-medium text-[#0D6E5C]">
            {breathingOn ? breathPhase.label : "Ready when you are"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!breathingOn) setBreathTick(0);
            setBreathingOn((v) => !v);
          }}
          className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
            breathingOn
              ? "border border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100"
              : "bg-[#0F2922] text-white hover:bg-[#163b31]"
          }`}
        >
          {breathingOn ? (
            <>
              <Pause className="w-3.5 h-3.5" aria-hidden="true" />
              Pause Breathing Pacer
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              Begin Calm Breathing
            </>
          )}
        </button>
      </div>

      {/* Seated Chair Stretch Guide */}
      <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-lg font-medium text-slate-900">
              Seated Chair Mobility
            </h4>
            <span className="font-mono-tabular text-xs text-[#0D6E5C] font-medium">
              Step {stretchIndex + 1}/{STRETCH_STEPS.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Zero-balance-risk stretches designed to do comfortably from an armchair.
          </p>

          <div className="mt-5 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">
                {currentStretch.title}
              </p>
              <span className="font-mono-tabular text-sm font-semibold text-[#0D6E5C]">
                {stretchRemain}s
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {currentStretch.cue}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStretchRunning((r) => !r)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0D6E5C] text-white px-3.5 py-2.5 text-xs font-medium hover:bg-[#095547] transition-colors cursor-pointer whitespace-nowrap"
            >
              {stretchRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  Start Timer
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                const next = (stretchIndex + 1) % STRETCH_STEPS.length;
                setStretchIndex(next);
                setStretchRemain(STRETCH_STEPS[next].seconds);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
            >
              Next Stretch
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogStretchSession}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-[#0D6E5C] hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            {stretchLogged ? (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                Logged to Care Record
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                Mark Seated Mobility Done
              </>
            )}
          </button>
        </div>
      </div>

      {/* Gentle 3D Flip Memory Pair Recall */}
      <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-lg font-medium text-slate-900 flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#0D6E5C]" aria-hidden="true" />
              Memory Recall Pairs
            </h4>
            <button
              type="button"
              onClick={resetMemoryGame}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" aria-hidden="true" />
              Shuffle
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Unhurried word-pair recall ·{" "}
            <span className="font-mono-tabular font-medium text-slate-800">
              {matchedPairs}/{MEMORY_TOKENS.length} pairs · {movesCount} turns
            </span>
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 perspective-stage">
            {deck.map((card) => {
              const revealed = card.matched || flippedUids.includes(card.uid);
              return (
                <motion.button
                  key={card.uid}
                  type="button"
                  onClick={() => handleCardPick(card)}
                  animate={{
                    rotateY: prefersReducedMotion ? 0 : revealed ? 0 : 180,
                  }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-14 rounded-xl border text-center px-1.5 flex items-center justify-center text-[11px] font-medium transition-colors cursor-pointer ${
                    card.matched
                      ? "bg-emerald-50 border-emerald-300 text-[#0D6E5C]"
                      : revealed
                        ? "bg-white border-[#0D6E5C] text-slate-900 shadow-xs"
                        : "bg-[#0F2922] border-[#0F2922] text-emerald-100/80 hover:bg-[#163b31]"
                  }`}
                >
                  <span style={{ transform: !prefersReducedMotion && !revealed ? "rotateY(180deg)" : undefined }}>
                    {revealed ? card.label : "Kindred"}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-600">
          {allMatched
            ? "All 6 familiar pairs matched cleanly and saved to today's care record."
            : "Tap two tiles at your own pace to match familiar household moments."}
        </p>
      </div>
    </div>
  );
}
