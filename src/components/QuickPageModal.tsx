import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bell, CheckCircle2, Send, Users, X } from "lucide-react";
import type { ResidentProfile } from "../data/eldercareData";

export interface FamilyPageNotification {
  id: string;
  residentId: string;
  residentName: string;
  sender: string;
  message: string;
  recipients: string[];
  timestamp: string;
  acknowledgedBy: string[];
}

interface QuickPageModalProps {
  open: boolean;
  resident: ResidentProfile;
  senderName: string;
  onClose: () => void;
  onSendQuickPage: (payload: {
    residentId: string;
    sender: string;
    message: string;
    recipients: string[];
  }) => void;
}

export function QuickPageModal({
  open,
  resident,
  senderName,
  onClose,
  onSendQuickPage,
}: QuickPageModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const firstName = resident.name.split(" ")[0];
  const presets = [
    `Can someone check in on ${firstName} this afternoon?`,
    `Running 20 minutes late for ${firstName}'s tea & walk—anyone nearby?`,
    `Picked up prescriptions for ${firstName}; dropping off before 5 PM.`,
    `Everything looks calm today—sharing a quick check-in ping!`,
  ];

  const [message, setMessage] = useState(presets[0]);
  const [sender, setSender] = useState(senderName);

  useEffect(() => {
    if (open) {
      setMessage(`Can someone check in on ${firstName} this afternoon?`);
      setSender(senderName);
    }
  }, [open, firstName, senderName]);

  const recipients = resident.circleMembers.map((m) => m.name);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSendQuickPage({
      residentId: resident.id,
      sender: sender.trim() || "Family Caregiver",
      message: message.trim(),
      recipients,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-page-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
          />

          <motion.div
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 24, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 20, scale: 0.98 }
            }
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0D6E5C]">
                  <Bell className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3
                    id="quick-page-title"
                    className="text-base font-semibold text-slate-900"
                  >
                    Quick Page · Family Coordination
                  </h3>
                  <p className="text-xs text-slate-500">
                    Non-emergency in-app notification to {recipients.length} circle
                    members
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Quick Page"
                className="min-h-[40px] min-w-[40px] rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-700 mb-2">
                  Quick Coordination Prompts
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setMessage(p)}
                      className={`text-left rounded-lg border px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                        message === p
                          ? "border-[#0D6E5C] bg-emerald-50 text-[#0F2922] font-medium"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="quick-page-sender"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  From
                </label>
                <input
                  id="quick-page-sender"
                  type="text"
                  maxLength={80}
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="quick-page-msg"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Coordination Message
                </label>
                <textarea
                  id="quick-page-msg"
                  rows={3}
                  maxLength={240}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a non-emergency request for the Care Circle..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 flex items-start gap-2.5 text-xs text-slate-600">
                <Users
                  className="w-4 h-4 text-[#0D6E5C] mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  Will notify:{" "}
                  <strong className="text-slate-900">
                    {recipients.join(", ")}
                  </strong>
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D6E5C] text-white px-5 py-2.5 text-xs sm:text-sm font-medium hover:bg-[#095547] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  Send Quick Page
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function QuickPageNotificationToast({
  notification,
  onAcknowledge,
  onDismiss,
}: {
  notification: FamilyPageNotification | null;
  onAcknowledge: (id: string) => void;
  onDismiss: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification.id}
          initial={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -16, scale: 0.98 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -12, scale: 0.98 }
          }
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 left-4 sm:left-auto sm:w-[400px] z-50 rounded-2xl border border-emerald-200 bg-white shadow-xl p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0D6E5C] shrink-0 mt-0.5">
                <Bell className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#0D6E5C]">
                  Family Page Sent · {notification.residentName}
                </p>
                <p className="mt-1 text-sm text-slate-900 leading-snug">
                  &ldquo;{notification.message}&rdquo;
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  From {notification.sender} · Notified{" "}
                  {notification.recipients.join(", ")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss notification"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 font-mono-tabular">
              {notification.timestamp}
            </span>
            <button
              type="button"
              onClick={() => onAcknowledge(notification.id)}
              className="inline-flex items-center gap-1 rounded-lg bg-[#0F2922] text-white px-3 py-1.5 font-medium hover:bg-[#163b31] transition-colors cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              {notification.acknowledgedBy.length > 0
                ? "Acknowledged"
                : "I'll Handle This"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
