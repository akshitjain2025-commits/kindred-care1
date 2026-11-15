import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bot, CornerDownLeft, Sparkles, Volume2, VolumeX } from "lucide-react";
import type { ResidentProfile } from "../data/eldercareData";
import { askKindred } from "../services/careAssistantEngine";
import {
  loadMoodForToday,
  loadMoodLog,
  type MoodEntry,
} from "../services/wellnessExtras";
import { Skiper27RollingText } from "./SkiperKineticPrimitives";
import { AppleGradientFrame } from "./AppleGradientFrame";

interface KindredAssistantProps {
  resident: ResidentProfile;
  caregiverName?: string;
  externalPromptRequest?: { id: number; prompt: string } | null;
}

interface ChatMessage {
  id: string;
  role: "assistant" | "caregiver";
  text: string;
  chips?: string[];
}

const readSleepHours = (residentId: string): number | null => {
  try {
    const raw = window.localStorage.getItem(`kindred_sleep_journal_${residentId}`);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const last = parsed[parsed.length - 1] as { hours?: number };
    return typeof last.hours === "number" ? last.hours : null;
  } catch {
    return null;
  }
};

const readCognitiveSessions = (residentId: string): number => {
  try {
    const raw = window.localStorage.getItem(`kindred_cognitive_sessions_${residentId}`);
    if (!raw) return 0;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
};

const timeLabel = () =>
  new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export function KindredAssistant({
  resident,
  caregiverName,
  externalPromptRequest,
}: KindredAssistantProps) {
  const prefersReducedMotion = useReducedMotion();
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [mood, setMood] = useState<MoodEntry | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const first = askKindred("hello", {
      resident,
      caregiverName,
      sleepHours: readSleepHours(resident.id),
      cognitiveSessions: readCognitiveSessions(resident.id),
      mood: loadMoodForToday(resident.id),
    });
    return [
      {
        id: "welcome",
        role: "assistant",
        text: `Good to see you${caregiverName ? `, ${caregiverName.split(" ")[0]}` : ""}. ${first.text}`,
        chips: first.chips,
      },
    ];
  });
  const listRef = useRef<HTMLDivElement | null>(null);
  const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [glow, setGlow] = useState(true);

  const speak = (text: string, messageId?: string) => {
    if (!speechSupported) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const spoken = text.replace(/[•·]/g, ",").replace(/\n+/g, ". ").slice(0, 1200);
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.rate = 0.96;
    utterance.pitch = 1;
    const voices = synth.getVoices();
    const preferred =
      voices.find(
        (voice) => voice.lang.startsWith("en") && /samantha|jenny|aria|zira|female/i.test(voice.name)
      ) || voices.find((voice) => voice.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;
    if (messageId) {
      utterance.onstart = () => setSpeakingId(messageId);
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
    }
    synth.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    setMood(loadMoodForToday(resident.id));
  }, [resident.id]);

  const context = useMemo(
    () => ({
      resident,
      caregiverName,
      sleepHours: readSleepHours(resident.id),
      cognitiveSessions: readCognitiveSessions(resident.id),
      mood,
    }),
    [resident, caregiverName, mood]
  );

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, thinking]);

  const send = (raw: string) => {
    const question = raw.trim();
    if (!question || thinking) return;
    setInput("");
    setMessages((current) => [
      ...current,
      { id: `q-${Date.now()}`, role: "caregiver", text: question },
    ]);
    setThinking(true);
    window.setTimeout(() => {
      const reply = askKindred(question, context);
      const replyId = `a-${Date.now()}`;
      setMessages((current) => [
        ...current,
        { id: replyId, role: "assistant", text: reply.text, chips: reply.chips },
      ]);
      setThinking(false);
      if (speakEnabled) speak(reply.text, replyId);
    }, prefersReducedMotion ? 0 : 280);
  };

  useEffect(() => {
    if (!externalPromptRequest) return;
    send(externalPromptRequest.prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPromptRequest?.id]);

  const activeChips = useMemo(() => {
    const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
    return lastAssistant?.chips ?? ["Medication schedule", "What should I focus on today?"];
  }, [messages]);

  return (
    <section id="kindred-assistant" className="py-20 border-t border-slate-200 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <p className="text-xs font-medium text-[#0D6E5C] tracking-wide">
              06. Kindred Companion
            </p>
            <Skiper27RollingText
              as="h2"
              text="A care assistant that answers from the record itself"
              className="mt-2 text-3xl lg:text-4xl font-medium tracking-tight text-slate-900"
            />
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Every answer is computed on this device from {resident.name.split(" ")[0]}&apos;s
              own medications, vitals, sleep, tasks and circle. No API key, no network
              call, nothing to configure — it cannot fail because a service is down.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              {[
                "Medication and refill watch",
                "Vitals with anything flagged",
                "Sleep, mood and cognitive trends",
                "Safety score, handoff text, emergency contacts",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0D6E5C]" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-8">
            <AppleGradientFrame
              active={glow}
              intensity="lg"
              className="rounded-3xl"
              innerClassName="rounded-3xl bg-[#F8FAFC]"
            >
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden rounded-3xl bg-[#F8FAFC]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#0D6E5C]/10">
                    <Bot className="h-4 w-4 text-[#0D6E5C]" aria-hidden="true" />
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Kindred companion</p>
                    <p className="text-[11px] text-slate-500">
                      On-device · {resident.name.split(" ")[0]}&apos;s record
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGlow((current) => !current)}
                    aria-pressed={glow}
                    aria-label={glow ? "Turn the gradient glow off" : "Turn the gradient glow on"}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                      glow
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    Glow
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSpeakEnabled((current) => {
                        if (current && speechSupported) window.speechSynthesis.cancel();
                        return !current;
                      });
                    }}
                    aria-pressed={speakEnabled}
                    aria-label={speakEnabled ? "Turn spoken answers off" : "Turn spoken answers on"}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                      speakEnabled
                        ? "border-[#0D6E5C]/30 bg-[#0D6E5C]/10 text-[#0D6E5C]"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    {speakEnabled ? (
                      <Volume2 className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <VolumeX className="h-3 w-3" aria-hidden="true" />
                    )}
                    {speakEnabled ? "Voice on" : "Voice off"}
                  </button>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-800">
                    Always available
                  </span>
                </div>
              </div>

              <div
                ref={listRef}
                className="max-h-[26rem] space-y-3 overflow-y-auto px-5 py-4"
                aria-live="polite"
              >
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className={`flex ${message.role === "caregiver" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                          message.role === "caregiver"
                            ? "bg-[#0D6E5C] text-white"
                            : "border border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {message.text}
                        {message.role === "assistant" && speechSupported && (
                          <button
                            type="button"
                            onClick={() => speak(message.text, message.id)}
                            aria-label="Read this answer aloud"
                            className="mt-3 flex w-fit items-center gap-1 text-[11px] font-medium text-[#0D6E5C] hover:underline"
                          >
                            <Volume2 className="h-3 w-3" aria-hidden="true" />
                            {speakingId === message.id ? "Speaking…" : "Read aloud"}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {thinking && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      {[0, 1, 2].map((dot) => (
                        <motion.span
                          key={dot}
                          className="h-1.5 w-1.5 rounded-full bg-slate-400"
                          animate={{ opacity: [0.25, 1, 0.25] }}
                          transition={{ duration: 1, repeat: Infinity, delay: dot * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white px-5 py-3">
                <div className="mb-2.5 flex flex-wrap gap-2">
                  {activeChips.slice(0, 3).map((chip) => (
                    <motion.button
                      key={chip}
                      type="button"
                      onClick={() => send(chip)}
                      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 transition-colors hover:border-[#0D6E5C]/40 hover:text-[#0D6E5C]"
                    >
                      {chip}
                    </motion.button>
                  ))}
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    send(input);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    id="kindred-assistant-input"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={`Ask about ${resident.name.split(" ")[0]}'s day…`}
                    aria-label="Ask the Kindred companion"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-[#0D6E5C]/50"
                  />
                  <motion.button
                    type="submit"
                    disabled={!input.trim() || thinking}
                    whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D6E5C] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#095547] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Ask
                    <CornerDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  </motion.button>
                </form>
                <p className="mt-2 text-[11px] text-slate-400">
                  Answers are read aloud — tap Read aloud to hear one again. Answered at{" "}
                  {timeLabel()} from local data only. Not a medical device — call a clinician
                  for decisions.
                </p>
              </div>
            </motion.div>
            </AppleGradientFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
