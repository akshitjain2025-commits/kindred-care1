import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  CalendarClock,
  Check,
  Copy,
  MessageSquarePlus,
  Phone,
  Send,
  ShieldAlert,
} from "lucide-react";
import type { ResidentProfile } from "../data/eldercareData";
import {
  buildHandoffText,
  daysUntil,
  loadBoardNotes,
  loadMoodForToday,
  saveBoardNotes,
  type FamilyBoardNote,
} from "../services/wellnessExtras";
import { KineticHeadline } from "./SkiperKineticPrimitives";
import { Perspective3DCard } from "./Motion3DPrimitives";

interface FamilyHandoffHubProps {
  resident: ResidentProfile;
  caregiverName?: string;
}

export function FamilyHandoffHub({ resident, caregiverName }: FamilyHandoffHubProps) {
  const prefersReducedMotion = useReducedMotion();
  const [notes, setNotes] = useState<FamilyBoardNote[]>([]);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setNotes(loadBoardNotes(resident.id));
  }, [resident.id]);

  const handoff = useMemo(
    () => buildHandoffText(resident, null, loadMoodForToday(resident.id)),
    [resident]
  );

  const appointments = useMemo(() => {
    const sorted = [...resident.appointments].slice(0, 3);
    return sorted.map((appointment) => ({
      ...appointment,
      countdown: daysUntil(appointment.date),
    }));
  }, [resident.appointments]);

  const contacts = useMemo(() => {
    const entries: { name: string; role: string; phone?: string }[] = [];
    if (resident.patientPhone) {
      entries.push({ name: resident.name, role: "Resident", phone: resident.patientPhone });
    }
    if (resident.doctorName && resident.doctorPhone) {
      entries.push({
        name: resident.doctorName,
        role: resident.doctorSpecialty?.split("·")[0]?.trim() || "Clinician",
        phone: resident.doctorPhone,
      });
    }
    resident.circleMembers.forEach((member) => {
      if (member.phone) entries.push({ name: member.name, role: member.role, phone: member.phone });
    });
    return entries.slice(0, 3);
  }, [resident]);

  const postNote = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    const note: FamilyBoardNote = {
      id: `board-${Date.now()}`,
      author: caregiverName || "Caregiver",
      text: draft.trim(),
      createdAt: new Date().toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    };
    const next = [note, ...notes].slice(0, 12);
    setNotes(next);
    saveBoardNotes(resident.id, next);
    setDraft("");
  };

  const copyHandoff = async () => {
    try {
      await navigator.clipboard.writeText(handoff);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="family-handoff" className="py-20 border-t border-slate-200 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-medium text-[#0D6E5C] tracking-wide">
            07. Family Handoff
          </p>
          <KineticHeadline
            as="h2"
            text="Everything the next caregiver needs, ready in one screen"
            className="mt-2 text-3xl lg:text-4xl font-medium tracking-tight text-slate-900"
          />
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Countdown to the next visit, a shared board for the family, a generated
            handoff note, and the numbers worth reaching in a hurry.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Appointment countdown */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              <CalendarClock className="h-3.5 w-3.5 text-[#0D6E5C]" aria-hidden="true" />
              Upcoming care
            </div>
            <ul className="mt-4 space-y-3">
              {appointments.map((appointment, index) => (
                <motion.li
                  key={appointment.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: index * 0.07 }}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{appointment.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {appointment.date} · {appointment.time} · {appointment.withPerson}
                    </p>
                    <p className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                      {appointment.mode}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      appointment.countdown !== null && appointment.countdown <= 2
                        ? "bg-amber-50 text-amber-800"
                        : "bg-[#0D6E5C]/10 text-[#0D6E5C]"
                    }`}
                  >
                    {appointment.countdown === null
                      ? "Soon"
                      : appointment.countdown <= 0
                        ? "Today"
                        : `in ${appointment.countdown}d`}
                  </span>
                </motion.li>
              ))}
              {appointments.length === 0 && (
                <li className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                  No visits scheduled yet — add one from the resident profile.
                </li>
              )}
            </ul>
          </div>

          {/* Family board */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              <MessageSquarePlus className="h-3.5 w-3.5 text-[#0D6E5C]" aria-hidden="true" />
              Family board
            </div>
            <form onSubmit={postNote} className="mt-3 flex items-center gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Leave a note for the circle…"
                aria-label="Note for the family board"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0D6E5C]/50"
              />
              <button
                type="submit"
                aria-label="Post note"
                className="inline-flex items-center justify-center rounded-lg bg-[#0D6E5C] p-2.5 text-white transition-colors hover:bg-[#095547]"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </form>

            <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
              {notes.map((note) => (
                <motion.li
                  key={note.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2"
                >
                  <p className="text-xs text-slate-700">{note.text}</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {note.author} · {note.createdAt}
                  </p>
                </motion.li>
              ))}
              {notes.length === 0 && (
                <li className="rounded-lg border border-dashed border-slate-300 px-3 py-5 text-center text-xs text-slate-500">
                  Nothing posted yet. A short note saves a phone call.
                </li>
              )}
            </ul>
          </div>

          {/* Emergency contacts */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              <ShieldAlert className="h-3.5 w-3.5 text-[#B91C1C]" aria-hidden="true" />
              Reach fast
            </div>
            <ul className="mt-4 space-y-2">
              {contacts.map((contact) => (
                <li key={`${contact.name}-${contact.phone}`}>
                  <a
                    href={`tel:${(contact.phone || "").replace(/[^\d+]/g, "")}`}
                    className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-[#0D6E5C]/40"
                  >
                    <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#0D6E5C]/10">
                      <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-[#0D6E5C]/15" />
                      <Phone className="relative h-3.5 w-3.5 text-[#0D6E5C]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium text-slate-900">
                        {contact.name}
                      </span>
                      <span className="block truncate text-[10px] text-slate-500">
                        {contact.role} · {contact.phone}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
              For an emergency, call your local emergency number first.
            </p>
          </div>

          {/* Handoff summary */}
          <Perspective3DCard className="lg:col-span-12 rounded-2xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    Generated handoff note
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Built from live data — copy it into a message before the next shift.
                  </p>
                </div>
                <motion.button
                  type="button"
                  onClick={copyHandoff}
                  whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-[#0D6E5C]/40 hover:text-[#0D6E5C]"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-[#0D6E5C]" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {copied ? "Copied" : "Copy handoff"}
                </motion.button>
              </div>
              <pre className="mt-4 max-h-52 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 font-sans text-xs leading-relaxed text-slate-700">
                {handoff}
              </pre>
            </div>
          </Perspective3DCard>
        </div>
      </div>
    </section>
  );
}
