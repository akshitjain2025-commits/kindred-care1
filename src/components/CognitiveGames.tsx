import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Brain,
  Check,
  Circle,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import type { ResidentProfile } from "../data/eldercareData";
import { RollingActionLabel, Skiper27RollingText } from "./SkiperKineticPrimitives";

type GameId =
  | "memory"
  | "pattern"
  | "sequence"
  | "oddone"
  | "numberpath"
  | "wordrecall"
  | "colour"
  | "sorting"
  | "steady";

interface GameDefinition {
  id: GameId;
  title: string;
  skill: string;
  tagline: string;
  detail: string;
  minutes: number;
}

const GAMES: GameDefinition[] = [
  {
    id: "memory",
    title: "Botanical Memory Pairs",
    skill: "Short-term recall",
    tagline: "Flip the garden cards and reunite every matching pair.",
    detail:
      "Twelve face-down cards hide six familiar household symbols. Recall where each one lives and clear the board in as few turns as possible.",
    minutes: 4,
  },
  {
    id: "pattern",
    title: "Pattern Continuation",
    skill: "Sequencing & attention",
    tagline: "Read the rhythm of shapes and choose what comes next.",
    detail:
      "Five gentle shape sequences build up a repeating rhythm. Pick the shape that continues each pattern to keep the sequence flowing.",
    minutes: 3,
  },
  {
    id: "sequence",
    title: "Sequence Echo",
    skill: "Working memory",
    tagline: "Watch four coloured pads light up, then repeat the order.",
    detail:
      "Each round adds one pad to the echo. Watch the lights, then tap the same pads in order — the gentlest way to stretch working memory.",
    minutes: 3,
  },
  {
    id: "oddone",
    title: "Odd One Out",
    skill: "Category reasoning",
    tagline: "Four familiar words — choose the one that does not belong.",
    detail:
      "Four short rounds, each with three words from one everyday family and one misfit. Naming the odd one out keeps word-finding and categorising active.",
    minutes: 2,
  },
  {
    id: "numberpath",
    title: "Number Path",
    skill: "Attention & scanning",
    tagline: "Tap one to nine in order, as calmly as you like.",
    detail:
      "The digits are scattered rather than lined up, so the eyes have to sweep the board while the count stays in mind. Mistakes cost a little, never a lot.",
    minutes: 2,
  },
  {
    id: "wordrecall",
    title: "Word Recall",
    skill: "Delayed recall",
    tagline: "Meet six household words, then find them again.",
    detail:
      "Six familiar words stay on screen for five seconds. Then twelve appear and only the six you met count — a light check on short-term recall.",
    minutes: 3,
  },
  {
    id: "colour",
    title: "Colour Word",
    skill: "Focus & inhibition",
    tagline: "Read the ink, not the word — six gentle rounds.",
    detail:
      "Each card shows a colour name painted in a different colour. Tap the colour you actually see, which trains the brain to hold back the automatic answer.",
    minutes: 2,
  },
  {
    id: "sorting",
    title: "Everyday Sort",
    skill: "Word meaning",
    tagline: "Six familiar things, two homes for each.",
    detail:
      "An apple, a ferry, a hammer — decide which everyday group each one belongs to. Familiar vocabulary keeps it comfortable rather than clinical.",
    minutes: 2,
  },
  {
    id: "steady",
    title: "Steady Tap",
    skill: "Reaction pace",
    tagline: "Tap the moment the square turns green.",
    detail:
      "Five patient waits, five quick taps. The score rewards a steady, unhurried response rather than raw speed.",
    minutes: 2,
  },
];

function shuffle<T>(values: T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface CognitiveResult {
  game: string;
  score: number;
  accuracy: number;
}

interface CognitiveGamesProps {
  resident: ResidentProfile;
  onSessionComplete: (residentId: string, result: CognitiveResult) => void;
}

const MEMORY_SYMBOLS = ["🌿", "☕", "🎵", "🐦", "🌻", "📖"];

function buildDeck() {
  const deck = [...MEMORY_SYMBOLS, ...MEMORY_SYMBOLS].map((symbol, idx) => ({
    uid: `${symbol}-${idx}`,
    symbol,
  }));
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

interface PatternRound {
  sequence: string[];
  options: string[];
  answer: string;
}

const PATTERN_ROUNDS: PatternRound[] = [
  { sequence: ["●", "▲", "■", "●", "▲"], options: ["●", "▲", "■"], answer: "■" },
  { sequence: ["◆", "●", "◆", "●", "◆"], options: ["◆", "●", "▲"], answer: "●" },
  { sequence: ["■", "■", "▲", "■", "■"], options: ["■", "▲", "◆"], answer: "▲" },
  { sequence: ["●", "▲", "■", "◆", "●", "▲"], options: ["◆", "●", "■"], answer: "■" },
  { sequence: ["▲", "◆", "▲", "◆", "▲"], options: ["▲", "◆", "■"], answer: "◆" },
];

function MemoryBoard({
  onFinish,
}: {
  onFinish: (score: number, accuracy: number) => void;
}) {
  const [deck, setDeck] = useState(buildDeck);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const isComplete = matched.length === MEMORY_SYMBOLS.length;

  useEffect(() => {
    if (!isComplete) return;
    const totalPairs = MEMORY_SYMBOLS.length;
    const accuracy = Math.min(100, Math.round((totalPairs / Math.max(totalPairs, moves)) * 100));
    onFinish(Math.max(20, accuracy), accuracy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const handleFlip = (uid: string, symbol: string) => {
    if (locked || flipped.includes(uid) || matched.includes(symbol)) return;

    const nextFlipped = [...flipped, uid];
    setFlipped(nextFlipped);

    if (nextFlipped.length < 2) return;

    setMoves((prev) => prev + 1);
    const [firstUid, secondUid] = nextFlipped;
    const firstSymbol = deck.find((card) => card.uid === firstUid)?.symbol;
    const secondSymbol = deck.find((card) => card.uid === secondUid)?.symbol;

    if (firstSymbol && firstSymbol === secondSymbol) {
      setMatched((prev) => [...prev, firstSymbol]);
      setFlipped([]);
      return;
    }

    setLocked(true);
    window.setTimeout(() => {
      setFlipped([]);
      setLocked(false);
    }, 750);
  };

  const reset = () => {
    setDeck(buildDeck());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setLocked(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-600 font-mono-tabular">
          Pairs found {matched.length}/{MEMORY_SYMBOLS.length} · Turns {moves}
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          New board
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {deck.map((card) => {
          const shown = flipped.includes(card.uid) || matched.includes(card.symbol);
          const isMatched = matched.includes(card.symbol);
          return (
            <button
              key={card.uid}
              type="button"
              onClick={() => handleFlip(card.uid, card.symbol)}
              aria-label={shown ? `Card showing ${card.symbol}` : "Face-down memory card"}
              className={`relative aspect-square rounded-xl border text-2xl transition-colors cursor-pointer flex items-center justify-center ${
                isMatched
                  ? "border-emerald-300 bg-emerald-50"
                  : shown
                    ? "border-[#0D6E5C] bg-white"
                    : "border-slate-200 bg-slate-100 hover:bg-slate-50"
              }`}
            >
              {shown ? (
                <span aria-hidden="true">{card.symbol}</span>
              ) : (
                <Circle className="w-5 h-5 text-slate-400" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {isComplete && (
        <p className="text-sm font-medium text-[#0D6E5C] inline-flex items-center gap-1.5">
          <Trophy className="w-4 h-4" aria-hidden="true" />
          Board cleared in {moves} turns — saved to the wellness history.
        </p>
      )}
    </div>
  );
}

function PatternBoard({
  onFinish,
}: {
  onFinish: (score: number, accuracy: number) => void;
}) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const round = PATTERN_ROUNDS[roundIndex];
  const isComplete = roundIndex >= PATTERN_ROUNDS.length;

  useEffect(() => {
    if (!isComplete) return;
    const accuracy = Math.round((correct / PATTERN_ROUNDS.length) * 100);
    onFinish(accuracy, accuracy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const handlePick = (option: string) => {
    if (picked) return;
    setPicked(option);
    if (option === round.answer) setCorrect((prev) => prev + 1);

    window.setTimeout(() => {
      setPicked(null);
      setRoundIndex((prev) => prev + 1);
    }, 650);
  };

  if (isComplete) {
    const accuracy = Math.round((correct / PATTERN_ROUNDS.length) * 100);
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="font-mono-tabular text-2xl font-semibold text-[#0D6E5C]">
          {correct}/{PATTERN_ROUNDS.length}
        </p>
        <p className="mt-1 text-sm font-medium text-slate-900">
          {accuracy}% pattern accuracy
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Saved to {""}
          the resident&apos;s wellness history.
        </p>
        <button
          type="button"
          onClick={() => {
            setRoundIndex(0);
            setCorrect(0);
            setPicked(null);
          }}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0F2922] text-white px-4 py-2 text-xs font-medium hover:bg-[#163b31] transition-colors cursor-pointer whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Play again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-600 font-mono-tabular">
        Round {roundIndex + 1}/{PATTERN_ROUNDS.length} · Correct {correct}
      </p>

      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {round.sequence.map((shape, idx) => (
          <span
            key={`${shape}-${idx}`}
            aria-hidden="true"
            className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl border border-slate-200 bg-[#F8FAFC] text-xl sm:text-2xl text-slate-800"
          >
            {shape}
          </span>
        ))}
        <span
          aria-hidden="true"
          className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl border-2 border-dashed border-[#0D6E5C] bg-emerald-50 text-lg text-[#0D6E5C]"
        >
          ?
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {round.options.map((option) => {
          const isCorrect = picked && option === round.answer;
          const isWrong = picked === option && option !== round.answer;
          return (
            <button
              key={option}
              type="button"
              onClick={() => handlePick(option)}
              aria-label={`Choose ${option}`}
              className={`flex h-14 items-center justify-center rounded-xl border text-2xl transition-colors cursor-pointer ${
                isCorrect
                  ? "border-emerald-400 bg-emerald-50 text-[#0D6E5C]"
                  : isWrong
                    ? "border-rose-300 bg-rose-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span aria-hidden="true">{option}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500">
        Tap the shape that continues the rhythm.
      </p>
    </div>
  );
}

/**
 * Skiper80-inspired kinetic card: pointer-tracked 3D tilt with a shared
 * layout transition into an expandable exercise overlay.
 */
function KineticGameCard({
  game,
  bestScore,
  sessions,
  onOpen,
}: {
  game: GameDefinition;
  bestScore: number;
  sessions: number;
  onOpen: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((event.clientY - rect.top) / rect.height - 0.5) * -9,
      y: ((event.clientX - rect.left) / rect.width - 0.5) * 11,
    });
  };

  const resetTilt = () => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  };

  return (
    <motion.div
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={resetTilt}
      animate={
        prefersReducedMotion
          ? undefined
          : { rotateX: tilt.x, rotateY: tilt.y, scale: hovered ? 1.015 : 1 }
      }
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{ transformPerspective: 900 }}
      className="relative rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between gap-4 preserve-3d"
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-[#0D6E5C]">
            <Brain className="w-3 h-3" aria-hidden="true" />
            {game.skill}
          </span>
          <span className="font-mono-tabular text-[11px] text-slate-500">
            {game.minutes} min
          </span>
        </div>
        <h4 className="mt-3 text-lg font-medium text-slate-900 text-balance">
          {game.title}
        </h4>
        <p className="mt-1 text-sm text-slate-600 leading-relaxed">{game.tagline}</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500">
          <p className="font-mono-tabular">
            Best {bestScore}% · {sessions} session{sessions === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="group inline-flex items-center gap-1.5 rounded-xl bg-[#0F2922] text-white px-3.5 py-2 text-xs font-medium hover:bg-[#163b31] transition-colors cursor-pointer whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5" aria-hidden="true" />
          <RollingActionLabel label="Start" />
        </button>
      </div>

      <motion.span
        aria-hidden="true"
        animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 6 }}
        transition={{ duration: 0.24 }}
        className="pointer-events-none absolute right-4 top-4 text-[#0D6E5C]"
      >
        <ArrowRight className="w-4 h-4" />
      </motion.span>
    </motion.div>
  );
}

function gradeFor(score: number) {
  if (score >= 90)
    return {
      grade: "A",
      label: "Excellent",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
      bar: "bg-emerald-600",
    };
  if (score >= 75)
    return {
      grade: "B",
      label: "Strong",
      tone: "border-teal-200 bg-teal-50 text-teal-800",
      bar: "bg-[#0D6E5C]",
    };
  if (score >= 60)
    return {
      grade: "C",
      label: "Comfortable",
      tone: "border-amber-200 bg-amber-50 text-amber-800",
      bar: "bg-amber-500",
    };
  return {
    grade: "D",
    label: "Warm-up",
    tone: "border-slate-200 bg-slate-50 text-slate-700",
    bar: "bg-slate-500",
  };
}

function analysisFor(game: GameDefinition, score: number, accuracy: number): string[] {
  const lines: string[] = [];
  lines.push(
    accuracy >= 85
      ? "Accuracy held steady right through to the last round."
      : accuracy >= 65
        ? "Most rounds landed correctly, with a few slips later in the set."
        : "The pacing was quick today — a shorter attempt tomorrow will feel easier."
  );
  if (score >= 90) {
    lines.push(
      `That is the best ${game.skill.toLowerCase()} result recorded this week — worth mentioning in the physician report.`
    );
  } else if (score >= 75) {
    lines.push(
      `Good ${game.skill.toLowerCase()} control. Repeating the same exercise tomorrow usually nudges this up a grade.`
    );
  } else {
    lines.push(
      `Keep the next session short: two rounds is enough to build ${game.skill.toLowerCase()} without fatigue.`
    );
  }
  lines.push(
    game.id === "steady"
      ? "Reaction time settles with a calm morning far more than with a hurried tap."
      : "Steady pacing scored better than speed here, which is exactly the aim."
  );
  return lines;
}

function GameResultPanel({
  game,
  score,
  accuracy,
  bestScore,
  onReplay,
  onDone,
}: {
  game: GameDefinition;
  score: number;
  accuracy: number;
  bestScore: number;
  onReplay: () => void;
  onDone: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const grade = gradeFor(score);
  const analysis = analysisFor(game, score, accuracy);

  return (
    <div>
      <div className="flex items-start gap-4">
        <motion.div
          initial={prefersReducedMotion ? false : { scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 20 }}
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-2xl font-semibold ${grade.tone}`}
        >
          {grade.grade}
        </motion.div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#0D6E5C]">
            Round complete · {game.skill}
          </p>
          <p className="mt-1 text-lg font-medium text-slate-900">
            {grade.label} — {score}%
          </p>
          <p className="text-xs text-slate-500">
            Accuracy {accuracy}% · best so far {bestScore}%
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {[
          { label: "Score", value: score },
          { label: "Accuracy", value: accuracy },
        ].map((row, index) => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>{row.label}</span>
              <span className="font-mono-tabular">{row.value}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className={`h-full rounded-full ${grade.bar}`}
                initial={{ width: 0 }}
                animate={{ width: `${row.value}%` }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.7,
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {analysis.map((line) => (
          <li key={line} className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0D6E5C]" aria-hidden="true" />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onReplay}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F2922] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#163b31]"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Play again
        </button>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-[#0D6E5C]/40 hover:text-[#0D6E5C]"
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Done
        </button>
        <span className="text-[11px] text-slate-500">Saved to the care circle log</span>
      </div>
    </div>
  );
}

const STROOP_ROUNDS = [
  { word: "Red", ink: "Blue" },
  { word: "Green", ink: "Red" },
  { word: "Blue", ink: "Amber" },
  { word: "Amber", ink: "Green" },
  { word: "Green", ink: "Blue" },
  { word: "Red", ink: "Amber" },
];

const INK_STYLES: Record<string, string> = {
  Red: "text-rose-600",
  Blue: "text-sky-600",
  Green: "text-emerald-600",
  Amber: "text-amber-500",
};

function ColourWord({
  onFinish,
}: {
  onFinish: (score: number, accuracy: number) => void;
}) {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const current = STROOP_ROUNDS[round];
  const inks = Array.from(new Set(STROOP_ROUNDS.map((item) => item.ink)));

  const choose = (ink: string) => {
    if (picked) return;
    setPicked(ink);
    const isRight = ink === current.ink;
    const nextCorrect = correct + (isRight ? 1 : 0);
    setCorrect(nextCorrect);
    window.setTimeout(() => {
      if (round + 1 >= STROOP_ROUNDS.length) {
        const accuracy = Math.round((nextCorrect / STROOP_ROUNDS.length) * 100);
        onFinish(Math.max(20, accuracy), accuracy);
        return;
      }
      setRound(round + 1);
      setPicked(null);
    }, 760);
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>Round {round + 1} of {STROOP_ROUNDS.length}</span>
        <span className="font-mono-tabular">{correct} correct</span>
      </div>
      <div className="mt-3 flex h-28 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
        <span className={`text-4xl font-semibold tracking-tight ${INK_STYLES[current.ink]}`}>
          {current.word}
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-600">Which colour is the ink?</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {inks.map((ink) => {
          const reveal = Boolean(picked);
          const isAnswer = ink === current.ink;
          const isPicked = picked === ink;
          return (
            <button
              key={ink}
              type="button"
              onClick={() => choose(ink)}
              className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                reveal && isAnswer
                  ? "border-[#0D6E5C]/50 bg-[#0D6E5C]/10 text-[#0D6E5C]"
                  : isPicked
                    ? "border-rose-300 bg-rose-50 text-rose-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#0D6E5C]/35"
              }`}
            >
              {ink}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SORT_ROUNDS = [
  { item: "Apple", options: ["Fruit", "Furniture"], answer: "Fruit" },
  { item: "Sofa", options: ["Fruit", "Furniture"], answer: "Furniture" },
  { item: "Robin", options: ["Bird", "Vehicle"], answer: "Bird" },
  { item: "Ferry", options: ["Bird", "Vehicle"], answer: "Vehicle" },
  { item: "Rosemary", options: ["Herb", "Tool"], answer: "Herb" },
  { item: "Hammer", options: ["Herb", "Tool"], answer: "Tool" },
];

function EverydaySort({
  onFinish,
}: {
  onFinish: (score: number, accuracy: number) => void;
}) {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const current = SORT_ROUNDS[round];

  const choose = (option: string) => {
    if (picked) return;
    setPicked(option);
    const isRight = option === current.answer;
    const nextCorrect = correct + (isRight ? 1 : 0);
    setCorrect(nextCorrect);
    window.setTimeout(() => {
      if (round + 1 >= SORT_ROUNDS.length) {
        const accuracy = Math.round((nextCorrect / SORT_ROUNDS.length) * 100);
        onFinish(Math.max(20, accuracy), accuracy);
        return;
      }
      setRound(round + 1);
      setPicked(null);
    }, 700);
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>Item {round + 1} of {SORT_ROUNDS.length}</span>
        <span className="font-mono-tabular">{correct} correct</span>
      </div>
      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center">
        <p className="text-2xl font-medium text-slate-900">{current.item}</p>
        <p className="mt-1 text-xs text-slate-500">Where does this belong?</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {current.options.map((option) => {
          const reveal = Boolean(picked);
          const isAnswer = option === current.answer;
          const isPicked = picked === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(option)}
              className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
                reveal && isAnswer
                  ? "border-[#0D6E5C]/50 bg-[#0D6E5C]/10 text-[#0D6E5C]"
                  : isPicked
                    ? "border-rose-300 bg-rose-50 text-rose-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#0D6E5C]/35"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const STEADY_TRIALS = 5;

function SteadyTap({
  onFinish,
}: {
  onFinish: (score: number, accuracy: number) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "waiting" | "ready">("idle");
  const [times, setTimes] = useState<number[]>([]);
  const [tooSoon, setTooSoon] = useState(false);
  const startedAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const nextTrial = () => {
    setTooSoon(false);
    setPhase("waiting");
    const delay = 900 + Math.random() * 1800;
    timerRef.current = window.setTimeout(() => {
      startedAtRef.current = Date.now();
      setPhase("ready");
    }, delay);
  };

  const handleTap = () => {
    if (phase === "waiting") {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setTooSoon(true);
      setPhase("idle");
      return;
    }
    if (phase !== "ready") return;
    const elapsed = Date.now() - startedAtRef.current;
    const next = [...times, elapsed];
    setTimes(next);
    if (next.length >= STEADY_TRIALS) {
      const average = next.reduce((sum, value) => sum + value, 0) / next.length;
      const score = Math.max(20, Math.min(100, Math.round(120 - average / 12)));
      const quick = next.filter((value) => value < 900).length;
      onFinish(score, Math.round((quick / next.length) * 100));
      return;
    }
    setPhase("idle");
  };

  const average = times.length
    ? Math.round(times.reduce((sum, value) => sum + value, 0) / times.length)
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>Trial {Math.min(times.length + 1, STEADY_TRIALS)} of {STEADY_TRIALS}</span>
        <span className="font-mono-tabular">
          {times.length ? `Avg ${average} ms` : "No taps yet"}
        </span>
      </div>
      <button
        type="button"
        onClick={phase === "idle" ? nextTrial : handleTap}
        className={`mt-3 flex h-40 w-full flex-col items-center justify-center rounded-2xl border text-center transition-colors duration-150 ${
          phase === "ready"
            ? "border-emerald-400 bg-emerald-500 text-white"
            : phase === "waiting"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-[#0D6E5C]/35"
        }`}
      >
        <span className="text-lg font-medium">
          {phase === "ready"
            ? "Tap now"
            : phase === "waiting"
              ? "Wait for green…"
              : "Tap to begin"}
        </span>
        <span className="mt-1 text-xs opacity-80">
          {tooSoon ? "A little early — try again" : "Five unhurried taps"}
        </span>
      </button>
      <p className="mt-3 text-xs text-slate-500">
        {times.length ? `Last ${times[times.length - 1]} ms` : "Patience scores as well as speed."}
      </p>
    </div>
  );
}

const ECHO_PADS = [
  { id: 0, label: "Leaf", tone: "bg-emerald-500" },
  { id: 1, label: "Sun", tone: "bg-amber-500" },
  { id: 2, label: "Sky", tone: "bg-sky-500" },
  { id: 3, label: "Clay", tone: "bg-rose-400" },
];

function SequenceEcho({
  onFinish,
}: {
  onFinish: (score: number, accuracy: number) => void;
}) {
  const [round, setRound] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [phase, setPhase] = useState<"idle" | "show" | "input" | "done">("idle");
  const [flash, setFlash] = useState<number | null>(null);
  const [position, setPosition] = useState(0);
  const [hits, setHits] = useState(0);
  const [taps, setTaps] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);

  const startRound = (roundIndex: number) => {
    const next = Array.from({ length: 3 + roundIndex }, () =>
      Math.floor(Math.random() * ECHO_PADS.length)
    );
    setSequence(next);
    setRound(roundIndex);
    setPosition(0);
    setPhase("show");
  };

  useEffect(() => {
    if (phase !== "show" || sequence.length === 0) return;
    const timers: number[] = [];
    sequence.forEach((pad, index) => {
      timers.push(window.setTimeout(() => setFlash(pad), index * 620));
      timers.push(window.setTimeout(() => setFlash(null), index * 620 + 400));
    });
    timers.push(
      window.setTimeout(() => setPhase("input"), sequence.length * 620 + 220)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [phase, sequence]);

  const finish = (finalHits: number, finalTaps: number) => {
    setPhase("done");
    const accuracy = finalTaps
      ? Math.round((finalHits / finalTaps) * 100)
      : 0;
    onFinish(Math.max(20, accuracy), accuracy);
  };

  const handlePad = (pad: number) => {
    if (phase !== "input") return;
    const totalTaps = taps + 1;
    setTaps(totalTaps);
    if (sequence[position] !== pad) {
      setWrong(pad);
      window.setTimeout(() => setWrong(null), 420);
      window.setTimeout(() => finish(hits, totalTaps), 380);
      return;
    }
    const nextHits = hits + 1;
    setHits(nextHits);
    const nextPosition = position + 1;
    if (nextPosition >= sequence.length) {
      if (round >= 3) {
        window.setTimeout(() => finish(nextHits, totalTaps), 380);
      } else {
        window.setTimeout(() => startRound(round + 1), 520);
      }
      return;
    }
    setPosition(nextPosition);
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>Round {Math.min(round + 1, 4)} of 4</span>
        <span className="font-mono-tabular">
          {phase === "show" ? "Watch the pads…" : phase === "input" ? "Your turn" : "Ready"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {ECHO_PADS.map((pad) => {
          const isLit = flash === pad.id;
          const isWrong = wrong === pad.id;
          return (
            <button
              key={pad.id}
              type="button"
              onClick={() => handlePad(pad.id)}
              aria-label={pad.label}
              className={`flex h-20 items-center justify-center rounded-2xl border text-sm font-medium transition-all duration-150 ${
                isWrong
                  ? "border-rose-300 bg-rose-100 text-rose-700"
                  : isLit
                    ? `${pad.tone} border-transparent text-white scale-[1.03]`
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#0D6E5C]/35"
              }`}
            >
              {pad.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {phase === "idle" ? "Four rounds, one extra pad each time." : `Score so far ${hits}/${taps}`}
        </p>
        <button
          type="button"
          onClick={() => {
            setHits(0);
            setTaps(0);
            startRound(0);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F2922] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#163b31]"
        >
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          {phase === "idle" ? "Begin" : "Restart"}
        </button>
      </div>
    </div>
  );
}

const ODD_ROUNDS = [
  { words: ["Apple", "Pear", "Carrot", "Plum"], answer: "Carrot" },
  { words: ["Bus", "Train", "Bicycle", "Kettle"], answer: "Kettle" },
  { words: ["Monday", "March", "Friday", "Sunday"], answer: "March" },
  { words: ["Robin", "Sparrow", "Salmon", "Finch"], answer: "Salmon" },
];

function OddOneOut({
  onFinish,
}: {
  onFinish: (score: number, accuracy: number) => void;
}) {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);

  const current = ODD_ROUNDS[round];

  const choose = (word: string) => {
    if (picked) return;
    setPicked(word);
    const isRight = word === current.answer;
    const nextCorrect = correct + (isRight ? 1 : 0);
    setCorrect(nextCorrect);
    window.setTimeout(() => {
      if (round + 1 >= ODD_ROUNDS.length) {
        const accuracy = Math.round((nextCorrect / ODD_ROUNDS.length) * 100);
        onFinish(Math.max(20, accuracy), accuracy);
        return;
      }
      setRound(round + 1);
      setPicked(null);
    }, 780);
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>Round {round + 1} of {ODD_ROUNDS.length}</span>
        <span className="font-mono-tabular">{correct} correct</span>
      </div>
      <p className="mt-3 text-sm text-slate-600">Which word does not belong with the others?</p>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {current.words.map((word) => {
          const isAnswer = word === current.answer;
          const isPicked = picked === word;
          const reveal = Boolean(picked);
          return (
            <button
              key={word}
              type="button"
              onClick={() => choose(word)}
              className={`rounded-xl border px-3 py-3 text-sm transition-all duration-200 ${
                reveal && isAnswer
                  ? "border-[#0D6E5C]/50 bg-[#0D6E5C]/10 text-[#0D6E5C]"
                  : isPicked
                    ? "border-rose-300 bg-rose-50 text-rose-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#0D6E5C]/35"
              }`}
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NumberPath({
  onFinish,
}: {
  onFinish: (score: number, accuracy: number) => void;
}) {
  const [order, setOrder] = useState(() => shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  const [next, setNext] = useState(1);
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState<number | null>(null);

  const tap = (value: number) => {
    if (value === next) {
      if (next === 9) {
        const accuracy = Math.max(0, 100 - mistakes * 10);
        onFinish(Math.max(30, accuracy), accuracy);
        return;
      }
      setNext(next + 1);
      return;
    }
    setMistakes(mistakes + 1);
    setShake(value);
    window.setTimeout(() => setShake(null), 380);
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>Next number: <strong className="text-slate-900">{next}</strong></span>
        <span className="font-mono-tabular">{mistakes} slip{mistakes === 1 ? "" : "s"}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {order.map((value) => {
          const done = value < next;
          return (
            <button
              key={value}
              type="button"
              onClick={() => tap(value)}
              aria-label={`Number ${value}`}
              className={`flex h-16 items-center justify-center rounded-xl border font-mono-tabular text-lg transition-all duration-150 ${
                shake === value
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : done
                    ? "border-[#0D6E5C]/30 bg-[#0D6E5C]/10 text-[#0D6E5C]"
                    : "border-slate-200 bg-white text-slate-800 hover:border-[#0D6E5C]/35"
              }`}
            >
              {value}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => {
          setOrder(shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]));
          setNext(1);
          setMistakes(0);
        }}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-[#0D6E5C]/40 hover:text-[#0D6E5C]"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Shuffle again
      </button>
    </div>
  );
}

const WORD_BANK = [
  "Lantern",
  "Quilt",
  "Harbour",
  "Piano",
  "Rosemary",
  "Slippers",
  "Cinnamon",
  "Ferry",
  "Notebook",
  "Willow",
  "Teacup",
  "Compass",
];

function buildWordRound() {
  const shuffled = shuffle(WORD_BANK);
  return {
    target: shuffled.slice(0, 6),
    options: shuffle(shuffled.slice(0, 12)),
  };
}

function WordRecall({
  onFinish,
}: {
  onFinish: (score: number, accuracy: number) => void;
}) {
  const [round, setRound] = useState(() => buildWordRound());
  const [phase, setPhase] = useState<"show" | "pick">("show");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (phase !== "show") return;
    const timer = window.setTimeout(() => setPhase("pick"), 5000);
    return () => window.clearTimeout(timer);
  }, [phase, round]);

  const toggle = (word: string) => {
    if (phase !== "pick") return;
    setSelected((current) => {
      if (current.includes(word)) return current.filter((item) => item !== word);
      if (current.length >= 6) return current;
      return [...current, word];
    });
  };

  const submit = () => {
    const correct = selected.filter((word) => round.target.includes(word)).length;
    const wrong = selected.length - correct;
    const accuracy = Math.max(0, Math.round(((correct - wrong) / round.target.length) * 100));
    onFinish(Math.max(20, accuracy), accuracy);
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>{phase === "show" ? "Remember these six words" : "Pick the six you saw"}</span>
        <span className="font-mono-tabular">{selected.length}/6 selected</span>
      </div>

      {phase === "show" ? (
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {round.target.map((word) => (
            <div
              key={word}
              className="rounded-xl border border-[#0D6E5C]/25 bg-[#0D6E5C]/[0.06] px-3 py-4 text-center text-sm font-medium text-slate-800"
            >
              {word}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {round.options.map((word) => {
              const isSelected = selected.includes(word);
              return (
                <button
                  key={word}
                  type="button"
                  onClick={() => toggle(word)}
                  aria-pressed={isSelected}
                  className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    isSelected
                      ? "border-[#0D6E5C]/50 bg-[#0D6E5C]/10 text-[#0D6E5C]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-[#0D6E5C]/35"
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setSelected([]);
                setRound(buildWordRound());
                setPhase("show");
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              New words
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={selected.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F2922] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#163b31] disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Finish
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function sessionsKey(residentId: string): string {
  return `kindred_cognitive_sessions_${residentId}`;
}

function readSessions(residentId: string): CognitiveResult[] {
  try {
    const raw = window.localStorage.getItem(sessionsKey(residentId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CognitiveResult[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSessions(residentId: string, sessions: CognitiveResult[]): void {
  try {
    window.localStorage.setItem(sessionsKey(residentId), JSON.stringify(sessions));
  } catch {
    // Ignore storage errors; the in-memory session log still works.
  }
}

export function CognitiveGames({ resident, onSessionComplete }: CognitiveGamesProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const [finished, setFinished] = useState<{
    game: GameDefinition;
    score: number;
    accuracy: number;
  } | null>(null);
  const [runId, setRunId] = useState(0);
  const [sessions, setSessions] = useState<CognitiveResult[]>(() =>
    readSessions(resident.id)
  );

  useEffect(() => {
    setSessions(readSessions(resident.id));
  }, [resident.id]);

  useEffect(() => {
    writeSessions(resident.id, sessions);
  }, [resident.id, sessions]);

  const activeGame = GAMES.find((game) => game.id === activeGameId) || null;

  const statsFor = (game: GameDefinition) => {
    const gameSessions = sessions.filter((session) => session.game === game.title);
    const bestScore = gameSessions.reduce(
      (best, session) => Math.max(best, session.score),
      0
    );
    return { bestScore, count: gameSessions.length };
  };

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    []
  );

  const completeSession = (game: GameDefinition, score: number, accuracy: number) => {
    const result: CognitiveResult = { game: game.title, score, accuracy };
    setSessions((prev) => [result, ...prev]);
    onSessionComplete(resident.id, result);
    setFinished({ game, score, accuracy });
  };

  const completedToday = sessions.length;
  const bestToday = sessions.reduce((best, session) => Math.max(best, session.score), 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-md">
          <p className="text-xs font-medium text-[#0D6E5C] tracking-wide">
            Daily Brain Training
          </p>
          <Skiper27RollingText
            as="h3"
            text="Gentle cognitive exercises for today"
            className="mt-1 text-2xl font-medium tracking-tight text-slate-900 text-balance"
          />
          <p className="mt-1.5 text-sm text-slate-600">
            Nine short sessions for {resident.name.split(" ")[0]}, chosen to keep recall,
            attention, word-finding and reaction pace comfortable rather than clinical.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3">
          <p className="text-xs text-slate-500">{todayLabel}</p>
          <p className="mt-1 font-mono-tabular text-lg font-semibold text-slate-900">
            {completedToday === 0 ? "Not started" : `${completedToday} completed`}
          </p>
          <p className="text-xs text-slate-500">
            {completedToday === 0 ? "Pick any card to begin" : `Best score ${bestToday}%`}
          </p>
        </div>
      </div>

      <motion.div
        layout
        className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {GAMES.map((game) => {
          const { bestScore, count } = statsFor(game);
          return (
            <KineticGameCard
              key={game.id}
              game={game}
              bestScore={bestScore}
              sessions={count}
              onOpen={() => {
                setFinished(null);
                setRunId((current) => current + 1);
                setActiveGameId(game.id);
              }}
            />
          );
        })}
      </motion.div>

      {/* Progress tracked into the resident's wellness history */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <p className="text-xs font-medium text-slate-600 mb-2">
          Cognitive progress in {resident.name.split(" ")[0]}&apos;s wellness history
        </p>
        {sessions.length === 0 ? (
          <p className="text-xs text-slate-500">
            Completed sessions appear here and update today&apos;s wellness trajectory.
          </p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {sessions.slice(0, 3).map((session, idx) => (
                <motion.div
                  key={`${session.game}-${idx}`}
                  initial={
                    prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-900">
                    <Sparkles className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
                    {session.game}
                  </span>
                  <span className="font-mono-tabular text-xs text-slate-600">
                    {session.score}% · {session.accuracy}% accuracy
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Expandable exercise overlay */}
      <AnimatePresence>
        {activeGame && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveGameId(null)}
          >
            <motion.div
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 18, scale: 0.97, rotateX: -6 }
              }
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 12, scale: 0.98 }
              }
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{ transformPerspective: 1200 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[#0D6E5C]">
                    {activeGame.skill}
                  </p>
                  <h4 className="mt-1 text-xl font-medium text-slate-900">
                    {activeGame.title}
                  </h4>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    {activeGame.detail}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFinished(null);
                    setActiveGameId(null);
                  }}
                  aria-label="Close exercise"
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-5">
                {finished && finished.game.id === activeGame.id ? (
                  <GameResultPanel
                    game={finished.game}
                    score={finished.score}
                    accuracy={finished.accuracy}
                    bestScore={statsFor(finished.game).bestScore}
                    onReplay={() => {
                      setFinished(null);
                      setRunId((current) => current + 1);
                    }}
                    onDone={() => {
                      setFinished(null);
                      setActiveGameId(null);
                    }}
                  />
                ) : (
                <div key={runId}>
                {activeGame.id === "memory" && (
                  <MemoryBoard
                    onFinish={(score, accuracy) =>
                      completeSession(activeGame, score, accuracy)
                    }
                  />
                )}
                {activeGame.id === "pattern" && (
                  <PatternBoard
                    onFinish={(score, accuracy) =>
                      completeSession(activeGame, score, accuracy)
                    }
                  />
                )}
                {activeGame.id === "sequence" && (
                  <SequenceEcho
                    onFinish={(score, accuracy) => {
                      completeSession(activeGame, score, accuracy);
                    }}
                  />
                )}
                {activeGame.id === "oddone" && (
                  <OddOneOut
                    onFinish={(score, accuracy) => {
                      completeSession(activeGame, score, accuracy);
                    }}
                  />
                )}
                {activeGame.id === "numberpath" && (
                  <NumberPath
                    onFinish={(score, accuracy) => {
                      completeSession(activeGame, score, accuracy);
                    }}
                  />
                )}
                {activeGame.id === "wordrecall" && (
                  <WordRecall
                    onFinish={(score, accuracy) => {
                      completeSession(activeGame, score, accuracy);
                    }}
                  />
                )}
                {activeGame.id === "colour" && (
                  <ColourWord
                    onFinish={(score, accuracy) => {
                      completeSession(activeGame, score, accuracy);
                    }}
                  />
                )}
                {activeGame.id === "sorting" && (
                  <EverydaySort
                    onFinish={(score, accuracy) => {
                      completeSession(activeGame, score, accuracy);
                    }}
                  />
                )}
                {activeGame.id === "steady" && (
                  <SteadyTap
                    onFinish={(score, accuracy) => {
                      completeSession(activeGame, score, accuracy);
                    }}
                  />
                )}
                </div>
                )}
              </div>

              {!finished && (
                <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Check className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
                  Results are saved to the shared care circle log.
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
