import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Phone,
  ShieldAlert,
  X,
} from "lucide-react";
import type { ResidentProfile } from "../data/eldercareData";

export type QuickAlertPreset =
  | "Urgent Wellness Check-In"
  | "Fall or Mobility Assistance"
  | "Medication / Symptom Escalation";

interface DispatchedRecipient {
  id: string;
  name: string;
  role: string;
  phone: string;
  channel: string;
  deliveryStatus: string;
  smsUri: string | null;
}

interface DispatchReceipt {
  alertId: string;
  dispatchedAt: string;
  smsBody: string;
  recipients: DispatchedRecipient[];
}

interface MobileQuickAlertProps {
  resident: ResidentProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExecuteAlertSequence: (payload: {
    residentId: string;
    alertType: QuickAlertPreset;
    customNote: string;
    notifiedCount: number;
  }) => void;
}

function playGentleAlertChime() {
  if (typeof window === "undefined") return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.14);
      gain.gain.setValueAtTime(0.001, now + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.08, now + i * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.3);
    });
  } catch {
    // Ignore autoplay constraints
  }
}

export function MobileQuickAlert({
  resident,
  open,
  onOpenChange,
  onExecuteAlertSequence,
}: MobileQuickAlertProps) {
  const prefersReducedMotion = useReducedMotion();
  const [preset, setPreset] = useState<QuickAlertPreset>(
    "Urgent Wellness Check-In"
  );
  const [customNote, setCustomNote] = useState("");
  const [stage, setStage] = useState<"ready" | "sending" | "sent">("ready");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [receipt, setReceipt] = useState<DispatchReceipt | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const emergencyContacts = resident.circleMembers;

  const resetAndClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStage("ready");
      setActiveStepIndex(0);
      setReceipt(null);
      setErrorMsg(null);
      setCustomNote("");
    }, 220);
  };

  const handleStartSequence = async () => {
    setStage("sending");
    setErrorMsg(null);
    setActiveStepIndex(1);

    try {
      // Step 1: Request server SMS & contact dispatch payload
      const res = await fetch("/api/alerts/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentName: resident.name,
          residence: resident.residence,
          alertType: preset,
          customNote: customNote.trim(),
          contacts: emergencyContacts.map((m) => ({
            id: m.id,
            name: m.name,
            role: m.role,
            phone: m.phone || "",
          })),
        }),
      });

      const data = (await res.json()) as DispatchReceipt & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Unable to complete alert dispatch.");
      }

      setActiveStepIndex(2);

      // Step 2: Persist Quick Alert to Security Logs + Care Circle Handoff Notes
      onExecuteAlertSequence({
        residentId: resident.id,
        alertType: preset,
        customNote: customNote.trim(),
        notifiedCount: data.recipients.length,
      });

      // Step 3: Trigger local push notification & audible confirmation tone
      setActiveStepIndex(3);
      playGentleAlertChime();

      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification(`Quick Alert Sent · ${resident.name}`, {
            body: `${preset} dispatched to ${data.recipients.length} designated contacts.`,
          });
        } else if (Notification.permission !== "denied") {
          void Notification.requestPermission().then((perm) => {
            if (perm === "granted") {
              new Notification(`Quick Alert Sent · ${resident.name}`, {
                body: `${preset} dispatched to ${data.recipients.length} designated contacts.`,
              });
            }
          });
        }
      }

      setReceipt(data);
      setStage("sent");
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Could not dispatch the Quick Alert sequence."
      );
      setStage("ready");
      setActiveStepIndex(0);
    }
  };

  return (
    <>
      {/* Mobile-Only Floating Quick Alert Action Button */}
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        aria-label="Open Quick Alert for emergency contacts"
        className="md:hidden fixed bottom-5 right-4 z-40 min-h-[48px] px-4 rounded-2xl bg-rose-700 hover:bg-rose-800 active:scale-[0.97] text-white shadow-lg shadow-rose-950/25 flex items-center gap-2 text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
      >
        <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Quick Alert</span>
      </button>

      {/* Pre-Defined Quick Alert Sequence Drawer */}
      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-alert-title"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={resetAndClose}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            />

            <motion.div
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 40, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 40, scale: 0.98 }
              }
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Mobile Drag Handle */}
              <div className="sm:hidden pt-3 pb-1 flex justify-center">
                <div className="w-10 h-1.5 rounded-full bg-slate-300" />
              </div>

              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
                    <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3
                      id="quick-alert-title"
                      className="text-base font-semibold text-slate-900"
                    >
                      Quick Alert Sequence
                    </h3>
                    <p className="text-xs text-slate-500">
                      {resident.name} · {emergencyContacts.length} designated contacts
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetAndClose}
                  aria-label="Close quick alert"
                  className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* 911 Medical Safety Reminder */}
                <div className="rounded-xl border border-rose-200 bg-rose-50/75 px-4 py-3 flex items-start gap-2.5 text-xs text-rose-950">
                  <AlertTriangle
                    className="w-4 h-4 text-rose-700 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <p>
                    For a life-threatening emergency, <strong>call 911 directly</strong>.
                    Quick Alert notifies your designated family and clinician circle
                    and logs an urgent event.
                  </p>
                </div>

                {errorMsg && (
                  <div
                    role="alert"
                    className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900"
                  >
                    {errorMsg}
                  </div>
                )}

                {stage === "ready" && (
                  <>
                    {/* Preset Reason Selector */}
                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-2">
                        1. Choose Alert Sequence Type
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {(
                          [
                            {
                              id: "Urgent Wellness Check-In",
                              desc: "Requests immediate callback or check-in at home.",
                            },
                            {
                              id: "Fall or Mobility Assistance",
                              desc: "Alerts contacts of possible fall and highlights nearby hospitals.",
                            },
                            {
                              id: "Medication / Symptom Escalation",
                              desc: "Flags urgent symptom or dosage question for clinician review.",
                            },
                          ] as const
                        ).map((opt) => {
                          const active = preset === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setPreset(opt.id)}
                              className={`text-left rounded-xl border px-4 py-3 transition-colors cursor-pointer ${
                                active
                                  ? "border-rose-700 bg-rose-50/50"
                                  : "border-slate-200 bg-white hover:bg-slate-50"
                              }`}
                            >
                              <p className="text-sm font-medium text-slate-900">
                                {opt.id}
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5">
                                {opt.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Optional Message */}
                    <div>
                      <label
                        htmlFor="quick-alert-note"
                        className="block text-xs font-medium text-slate-700 mb-1.5"
                      >
                        2. Short Situation Note (Optional)
                      </label>
                      <input
                        id="quick-alert-note"
                        type="text"
                        maxLength={180}
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        placeholder="e.g. Felt dizzy in hallway, seated safely now..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                      />
                    </div>

                    {/* Designated Recipients Preview */}
                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-2">
                        3. Automated Notification Sequence Recipients
                      </p>
                      <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 bg-[#F8FAFC]">
                        {emergencyContacts.map((member) => (
                          <div
                            key={member.id}
                            className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate">
                                {member.name}
                              </p>
                              <p className="text-slate-500 truncate">
                                {member.role}
                              </p>
                            </div>
                            <span className="font-mono-tabular text-slate-700 whitespace-nowrap shrink-0">
                              {member.phone || "Care Circle App"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {stage === "sending" && (
                  <div className="py-4 space-y-3">
                    {[
                      "Preparing SMS & emergency context payload...",
                      "Logging urgent event to Security Logs & Care Circle...",
                      "Dispatching notifications to designated contacts...",
                    ].map((label, idx) => {
                      const done = activeStepIndex > idx + 1;
                      const current = activeStepIndex === idx + 1;
                      return (
                        <div
                          key={label}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-xs"
                        >
                          <BellRing
                            className={`w-4 h-4 shrink-0 ${
                              done
                                ? "text-[#0D6E5C]"
                                : current
                                  ? "text-rose-700"
                                  : "text-slate-400"
                            }`}
                            aria-hidden="true"
                          />
                          <span className="font-medium text-slate-800">
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {stage === "sent" && receipt && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-start gap-3">
                      <CheckCircle2
                        className="w-5 h-5 text-[#0D6E5C] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Quick Alert Dispatched ({receipt.alertId})
                        </p>
                        <p className="text-xs text-slate-700 mt-1">
                          Logged to Care Circle &amp; Security Logs for{" "}
                          {resident.name}. Tap below to open SMS or place a direct
                          call to any contact.
                        </p>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                      {receipt.recipients.map((rec) => (
                        <div
                          key={rec.id}
                          className="p-3.5 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                              {rec.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {rec.role} · {rec.deliveryStatus}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {rec.smsUri && (
                              <a
                                href={rec.smsUri}
                                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg bg-[#0D6E5C] text-white px-3 py-1.5 text-xs font-medium hover:bg-[#095547] whitespace-nowrap"
                              >
                                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                                Send SMS
                              </a>
                            )}
                            {rec.phone && (
                              <a
                                href={`tel:${rec.phone.replace(/[^+\d]/g, "")}`}
                                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                              >
                                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                                Call
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <a
                      href="#hospital-locator"
                      onClick={resetAndClose}
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-rose-700" aria-hidden="true" />
                      View Nearby Hospitals on Map
                    </a>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                {stage === "ready" ? (
                  <>
                    <button
                      type="button"
                      onClick={resetAndClose}
                      className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleStartSequence}
                      className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-rose-700 text-white px-5 py-2.5 text-sm font-medium hover:bg-rose-800 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                    >
                      <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                      Send Quick Alert to All Contacts
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="w-full min-h-[44px] rounded-xl bg-[#0F2922] text-white px-4 py-2.5 text-xs font-medium hover:bg-[#163b31] cursor-pointer"
                  >
                    Done
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
