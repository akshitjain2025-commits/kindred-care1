import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Calendar,
  CheckCircle2,
  Mail,
  Phone,
  Send,
  Stethoscope,
  X,
} from "lucide-react";
import type {
  AppointmentItem,
  ResidentProfile,
} from "../data/eldercareData";

export type DoctorModalTab = "contact" | "appointment";

interface DoctorConnectModalProps {
  open: boolean;
  initialTab?: DoctorModalTab;
  resident: ResidentProfile;
  onClose: () => void;
  onAddAppointment: (
    residentId: string,
    apt: Omit<AppointmentItem, "id">
  ) => void;
  onAddNote: (residentId: string, author: string, text: string) => void;
}

export function DoctorConnectModal({
  open,
  initialTab = "contact",
  resident,
  onClose,
  onAddAppointment,
  onAddNote,
}: DoctorConnectModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const [tab, setTab] = useState<DoctorModalTab>(initialTab);

  // Doctor resolution from resident profile or prescriptions/circle
  const defaultDoctor =
    resident.doctorName ||
    resident.circleMembers.find((m) =>
      m.role.toLowerCase().includes("clinician") ||
      m.role.toLowerCase().includes("doctor") ||
      m.name.startsWith("Dr.")
    )?.name ||
    resident.prescriptions[0]?.prescriber ||
    "Dr. Hannah Sato, MD";
  const defaultSpecialty =
    resident.doctorSpecialty || "Primary Care & Geriatric Medicine";
  const defaultPhone =
    resident.doctorPhone ||
    resident.circleMembers.find((m) => m.name === defaultDoctor)?.phone ||
    "(503) 555-0192";
  const defaultEmail =
    resident.doctorEmail || "care@cedarvalleyclinic.example";

  // Contact Doctor state
  const [urgency, setUrgency] = useState<"Routine" | "Same-Day Callback">(
    "Routine"
  );
  const [subject, setSubject] = useState(
    `Care follow-up for ${resident.name}`
  );
  const [messageBody, setMessageBody] = useState("");
  const [contactSending, setContactSending] = useState(false);
  const [contactConfirmation, setContactConfirmation] = useState<string | null>(
    null
  );
  const [contactError, setContactError] = useState<string | null>(null);

  // Book Appointment state
  const [aptTitle, setAptTitle] = useState("Routine Consultation & Wellness Check");
  const [aptDoctor, setAptDoctor] = useState(defaultDoctor);
  const [aptDate, setAptDate] = useState("Nov 25");
  const [aptTime, setAptTime] = useState("10:30 AM");
  const [aptMode, setAptMode] = useState<AppointmentItem["mode"]>("In-Person");
  const [aptBooked, setAptBooked] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setSubject(`Care follow-up for ${resident.name}`);
      setAptDoctor(defaultDoctor);
      setContactConfirmation(null);
      setContactError(null);
      setAptBooked(false);
    }
  }, [open, initialTab, resident.name, defaultDoctor]);

  const handleSendDoctorMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim()) {
      setContactError("Please enter a short message for the physician.");
      return;
    }

    setContactSending(true);
    setContactError(null);
    try {
      const res = await fetch("/api/doctor/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentName: resident.name,
          doctorName: defaultDoctor,
          doctorPhone: defaultPhone,
          doctorEmail: defaultEmail,
          urgency,
          subject: subject.trim(),
          message: messageBody.trim(),
        }),
      });
      const data = (await res.json()) as {
        referenceId?: string;
        confirmationText?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "Unable to reach physician portal.");
      }

      onAddNote(
        resident.id,
        "Physician Outreach",
        `Sent ${urgency} inquiry to ${defaultDoctor} (${
          data.referenceId || "Sent"
        }): "${messageBody.trim()}"`
      );
      setContactConfirmation(
        `${data.confirmationText || "Message sent."} Reference ${
          data.referenceId || ""
        }`
      );
      setMessageBody("");
    } catch (err) {
      setContactError(
        err instanceof Error ? err.message : "Could not dispatch message."
      );
    } finally {
      setContactSending(false);
    }
  };

  const handleBookAppointment = (e: FormEvent) => {
    e.preventDefault();
    if (!aptTitle.trim() || !aptDoctor.trim()) return;

    onAddAppointment(resident.id, {
      title: aptTitle.trim(),
      withPerson: aptDoctor.trim(),
      date: aptDate.trim() || "Upcoming",
      time: aptTime.trim() || "10:30 AM",
      mode: aptMode,
    });
    onAddNote(
      resident.id,
      "Appointment Desk",
      `Booked ${aptMode} appointment "${aptTitle.trim()}" with ${aptDoctor.trim()} on ${
        aptDate.trim() || "Upcoming"
      } at ${aptTime.trim() || "10:30 AM"}.`
    );
    setAptBooked(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="doctor-connect-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
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
            className="relative w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-[#F8FAFC]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0D6E5C] shrink-0">
                  <Stethoscope className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3
                    id="doctor-connect-title"
                    className="text-base font-semibold text-slate-900 truncate"
                  >
                    Physician Care · {resident.name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {defaultDoctor} · {defaultSpecialty}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close doctor modal"
                className="min-h-[40px] min-w-[40px] rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Mode Tabs */}
            <div className="px-6 pt-4">
              <div
                className="inline-flex w-full rounded-xl bg-slate-100 p-1"
                role="tablist"
                aria-label="Doctor outreach mode"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "contact"}
                  onClick={() => setTab("contact")}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    tab === "contact"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                  Contact Doctor
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "appointment"}
                  onClick={() => setTab("appointment")}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    tab === "appointment"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  Book Appointment
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Direct Quick Links Strip */}
              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {defaultDoctor}
                  </p>
                  <p className="text-xs text-slate-500 font-mono-tabular">
                    {defaultPhone} · {defaultEmail}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:${defaultPhone.replace(/[^+\d]/g, "")}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0D6E5C] text-white px-3 py-1.5 text-xs font-medium hover:bg-[#095547] whitespace-nowrap"
                  >
                    <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                    Call Clinic
                  </a>
                  <a
                    href={`mailto:${defaultEmail}?subject=${encodeURIComponent(
                      `Kindred Care Inquiry: ${resident.name}`
                    )}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
                    Email
                  </a>
                </div>
              </div>

              {tab === "contact" ? (
                <form onSubmit={handleSendDoctorMessage} className="space-y-4">
                  {contactConfirmation && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-start gap-2.5 text-xs text-[#0F2922]">
                      <CheckCircle2
                        className="w-4 h-4 text-[#0D6E5C] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{contactConfirmation}</span>
                    </div>
                  )}

                  {contactError && (
                    <div
                      role="alert"
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800"
                    >
                      {contactError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="doc-urgency"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Request Priority
                      </label>
                      <select
                        id="doc-urgency"
                        value={urgency}
                        onChange={(e) =>
                          setUrgency(
                            e.target.value as "Routine" | "Same-Day Callback"
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                      >
                        <option value="Routine">Routine Portal Message</option>
                        <option value="Same-Day Callback">
                          Same-Day Nurse / Doctor Callback
                        </option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="doc-subject"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Topic
                      </label>
                      <input
                        id="doc-subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="doc-msg"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Message or Question for {defaultDoctor}
                    </label>
                    <textarea
                      id="doc-msg"
                      rows={4}
                      maxLength={500}
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      placeholder="Describe symptoms, prescription questions, or request a callback..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={contactSending}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D6E5C] text-white px-5 py-2.5 text-xs sm:text-sm font-medium hover:bg-[#095547] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      <Send className="w-3.5 h-3.5" aria-hidden="true" />
                      {contactSending ? "Sending..." : "Send Message to Doctor"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleBookAppointment} className="space-y-4">
                  {aptBooked && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-start gap-2.5 text-xs text-[#0F2922]">
                      <CheckCircle2
                        className="w-4 h-4 text-[#0D6E5C] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>
                        Appointment scheduled and added to {resident.name}&apos;s
                        clinical directory and Care Circle notes.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="apt-modal-title"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Appointment Reason
                      </label>
                      <input
                        id="apt-modal-title"
                        type="text"
                        required
                        value={aptTitle}
                        onChange={(e) => setAptTitle(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="apt-modal-doc"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Doctor / Clinician
                      </label>
                      <input
                        id="apt-modal-doc"
                        type="text"
                        required
                        value={aptDoctor}
                        onChange={(e) => setAptDoctor(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label
                        htmlFor="apt-modal-date"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Preferred Date
                      </label>
                      <input
                        id="apt-modal-date"
                        type="text"
                        value={aptDate}
                        onChange={(e) => setAptDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="apt-modal-time"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Time Slot
                      </label>
                      <input
                        id="apt-modal-time"
                        type="text"
                        value={aptTime}
                        onChange={(e) => setAptTime(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="apt-modal-mode"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Visit Type
                      </label>
                      <select
                        id="apt-modal-mode"
                        value={aptMode}
                        onChange={(e) =>
                          setAptMode(e.target.value as AppointmentItem["mode"])
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                      >
                        <option value="In-Person">In-Person Clinic</option>
                        <option value="Video Visit">Video Visit</option>
                        <option value="Home Visit">Home Visit</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D6E5C] text-white px-5 py-2.5 text-xs sm:text-sm font-medium hover:bg-[#095547] cursor-pointer whitespace-nowrap"
                    >
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                      Confirm Appointment
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
