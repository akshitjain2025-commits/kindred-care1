import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, MessageSquare, Pill, X } from "lucide-react";
import type { MedicationReminderAlert } from "../services/medicationNotifications";

interface MedicationReminderToastProps {
  alert: MedicationReminderAlert | null;
  onMarkTaken: (residentId: string, taskId: string) => void;
  onDismiss: () => void;
}

export function MedicationReminderToast({
  alert,
  onMarkTaken,
  onDismiss,
}: MedicationReminderToastProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          key={alert.notificationId}
          initial={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 18, scale: 0.98 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 14, scale: 0.98 }
          }
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:right-auto sm:w-[420px] z-50 rounded-2xl border border-amber-200 bg-white shadow-xl p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                <Pill className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-800">
                  Medication Cue · {alert.residentName} ·{" "}
                  <span className="font-mono-tabular">{alert.scheduledTime}</span>
                </p>
                <p className="mt-1 text-sm text-slate-900 leading-snug">
                  {alert.personalizedMessage}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {alert.channel === "both"
                    ? "In-App Push + SMS Ready"
                    : alert.channel === "sms"
                      ? "Personalized SMS Dispatch"
                      : "In-App Push Notification"}
                  {alert.recipientPhone ? ` · ${alert.recipientPhone}` : ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss medication reminder"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-mono-tabular text-slate-500">
              Ref {alert.notificationId}
            </span>
            <div className="flex items-center gap-2">
              {alert.smsUri && (
                <a
                  href={alert.smsUri}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
                  Send SMS
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  onMarkTaken(alert.residentId, alert.taskId);
                  onDismiss();
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-[#0D6E5C] text-white px-3 py-1.5 font-medium hover:bg-[#095547] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                Mark Taken
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
