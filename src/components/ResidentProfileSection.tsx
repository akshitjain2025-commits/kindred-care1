import { useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  Calendar,
  Check,
  Copy,
  Download,
  FileText,
  HeartPulse,
  Phone,
  PhoneCall,
  Pill,
  Plus,
  Sparkles,
} from "lucide-react";
import type {
  AppointmentItem,
  ComfortPreferences,
  PrescriptionItem,
  ResidentProfile,
  VitalReading,
} from "../data/eldercareData";
import { WellnessMilestones } from "./WellnessMilestones";
import { generatePhysicianReportPdf } from "../utils/physicianReportPdf";
import type { DoctorModalTab } from "./DoctorConnectModal";

interface ResidentProfileSectionProps {
  resident: ResidentProfile;
  onUpdateStatus: (residentId: string, status: "Calm" | "Active" | "Resting") => void;
  onAddVital: (residentId: string, vital: Omit<VitalReading, "id">) => void;
  onAddMedicalFlag: (
    residentId: string,
    kind: "allergy" | "condition",
    text: string
  ) => void;
  onToggleRefill: (residentId: string, rxId: string) => void;
  onAddPrescription: (
    residentId: string,
    rx: Omit<PrescriptionItem, "id" | "refillRequested">
  ) => void;
  onAddAppointment: (residentId: string, apt: Omit<AppointmentItem, "id">) => void;
  onUpdateComfort: (
    residentId: string,
    patch: Partial<ComfortPreferences>
  ) => void;
  onIncrementHydration: (residentId: string) => void;
  onShareMilestoneNote: (residentId: string, milestoneTitle: string) => void;
  onOpenPhysicianReport: () => void;
  onOpenDoctorConnect: (tab: DoctorModalTab) => void;
}

type ProfileTab = "vitals" | "medications" | "appointments" | "comfort";

export function ResidentProfileSection({
  resident,
  onUpdateStatus,
  onAddVital,
  onAddMedicalFlag,
  onToggleRefill,
  onAddPrescription,
  onAddAppointment,
  onUpdateComfort,
  onIncrementHydration,
  onShareMilestoneNote,
  onOpenPhysicianReport,
  onOpenDoctorConnect,
}: ResidentProfileSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<ProfileTab>("vitals");
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  // Vitals form
  const [vitalLabel, setVitalLabel] = useState("Blood Pressure");
  const [vitalValue, setVitalValue] = useState("");
  const [vitalUnit, setVitalUnit] = useState("mmHg");

  // Medical flag form
  const [flagKind, setFlagKind] = useState<"allergy" | "condition">("allergy");
  const [flagText, setFlagText] = useState("");

  // Prescription form
  const [rxName, setRxName] = useState("");
  const [rxDosage, setRxDosage] = useState("");
  const [rxTiming, setRxTiming] = useState("");
  const [rxDays, setRxDays] = useState("30");

  // Appointment form
  const [aptTitle, setAptTitle] = useState("");
  const [aptDate, setAptDate] = useState("Nov 24");
  const [aptTime, setAptTime] = useState("10:30 AM");
  const [aptWith, setAptWith] = useState("");
  const [aptMode, setAptMode] = useState<AppointmentItem["mode"]>("In-Person");

  const handleVitalSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!vitalValue.trim()) return;
    onAddVital(resident.id, {
      label: vitalLabel,
      value: vitalValue.trim(),
      unit: vitalUnit.trim() || "-",
      measuredAt: `Today · ${new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      status: "Normal",
    });
    setVitalValue("");
  };

  const handleFlagSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!flagText.trim()) return;
    onAddMedicalFlag(resident.id, flagKind, flagText.trim());
    setFlagText("");
  };

  const handleRxSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!rxName.trim() || !rxDosage.trim()) return;
    onAddPrescription(resident.id, {
      name: rxName.trim(),
      dosage: rxDosage.trim(),
      timing: rxTiming.trim() || "Daily with breakfast",
      prescriber: "Primary Care Physician",
      daysRemaining: Math.max(1, Number(rxDays) || 30),
    });
    setRxName("");
    setRxDosage("");
    setRxTiming("");
  };

  const handleAptSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!aptTitle.trim() || !aptWith.trim()) return;
    onAddAppointment(resident.id, {
      date: aptDate.trim() || "Upcoming",
      time: aptTime.trim() || "10:00 AM",
      title: aptTitle.trim(),
      withPerson: aptWith.trim(),
      mode: aptMode,
    });
    setAptTitle("");
    setAptWith("");
  };

  const handleCopyPhone = (memberId: string, phone: string) => {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(phone);
    }
    setCopiedPhoneId(memberId);
    setTimeout(() => setCopiedPhoneId(null), 1800);
  };

  const handleExportPhysicianPdf = () => {
    generatePhysicianReportPdf(resident);
    setPdfDownloaded(true);
    setTimeout(() => setPdfDownloaded(false), 2600);
  };

  return (
    <section
      id="resident-profile"
      className="py-20 border-t border-slate-200 bg-[#F8FAFC]"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section Heading & Physician PDF Export Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#0D6E5C] tracking-wide">
              03. Resident Profile &amp; Clinical Directory
            </p>
            <h2 className="mt-2 text-3xl lg:text-4xl font-medium tracking-tight text-slate-900 text-balance">
              Complete health records, prescriptions, and comfort rituals in one place
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              Keep allergies, vitals, medication refills, doctor appointments, and
              personal preferences current—or download a formatted weekly PDF summary
              for {resident.name}&apos;s primary physician.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => onOpenDoctorConnect("contact")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <PhoneCall className="w-4 h-4 text-[#0D6E5C]" aria-hidden="true" />
              Contact Doctor
            </button>
            <button
              type="button"
              onClick={() => onOpenDoctorConnect("appointment")}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-[#0D6E5C] hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Book Appointment
            </button>
            <button
              type="button"
              onClick={onOpenPhysicianReport}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileText className="w-4 h-4 text-[#0D6E5C]" aria-hidden="true" />
              Customize Report
            </button>
            <button
              type="button"
              onClick={handleExportPhysicianPdf}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0D6E5C] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#095547] transition-colors cursor-pointer whitespace-nowrap"
            >
              {pdfDownloaded ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  PDF Downloaded
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Download Physician PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Profile Overview Banner */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                <img
                  src={resident.avatarUrl}
                  alt={resident.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="text-2xl font-medium text-slate-900">
                    {resident.name}
                  </h3>
                  <span className="text-xs text-slate-400" aria-hidden="true">
                    ·
                  </span>
                  <span className="font-mono-tabular text-xs text-slate-600">
                    DOB {resident.dateOfBirth}
                  </span>
                  <span className="text-xs text-slate-400" aria-hidden="true">
                    ·
                  </span>
                  <span className="font-mono-tabular text-xs text-slate-600">
                    Blood {resident.bloodType}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {resident.residence} · {resident.mobilityAid}
                </p>
                <p className="mt-1.5 text-xs text-slate-500">
                  Allergies:{" "}
                  <span className="text-rose-700 font-medium">
                    {resident.allergies.join(", ")}
                  </span>{" "}
                  <span aria-hidden="true">·</span> Language: {resident.primaryLanguage}
                </p>
              </div>
            </div>

            {/* Live Resident Status Switcher (drives Ambient Soundscapes + Context) */}
            <div className="shrink-0">
              <p className="text-xs font-medium text-slate-500 mb-1.5">
                Current Resident Status
              </p>
              <div
                className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200"
                role="group"
                aria-label="Update resident status"
              >
                {(["Calm", "Active", "Resting"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onUpdateStatus(resident.id, level)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      resident.statusLevel === level
                        ? "bg-[#0F2922] text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Wellness Milestones & Visual Reward Celebrations */}
        <WellnessMilestones
          resident={resident}
          onIncrementHydration={onIncrementHydration}
          onShareMilestoneNote={onShareMilestoneNote}
        />

        {/* Profile Sub-Navigation Tabs */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white border border-slate-200"
            role="tablist"
            aria-label="Resident profile sections"
          >
            {(
              [
                { id: "vitals", label: "Health & Vitals", icon: HeartPulse },
                { id: "medications", label: "Prescriptions & Refills", icon: Pill },
                { id: "appointments", label: "Appointments", icon: Calendar },
                { id: "comfort", label: "Contacts & Comfort", icon: Sparkles },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    selected
                      ? "bg-[#0F2922] text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabbed Profile Content with Subtle 3D Transitions */}
        <div className="perspective-stage">
          <AnimatePresence mode="wait">
            {activeTab === "vitals" && (
              <motion.div
                key="tab-vitals"
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotateX: 4, y: 10 }
                }
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotateX: -4, y: -10 }
                }
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Vitals Snapshot + Log Entry */}
                <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6">
                  <h4 className="text-lg font-medium text-slate-900 mb-4">
                    Recent Vital Readings
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {resident.vitals.map((v) => (
                      <div
                        key={v.id}
                        className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-slate-600">
                            {v.label}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              v.status === "Normal"
                                ? "text-[#0D6E5C]"
                                : "text-amber-700"
                            }`}
                          >
                            {v.status}
                          </span>
                        </div>
                        <p className="mt-1.5 font-mono-tabular text-2xl font-semibold text-slate-900">
                          {v.value}{" "}
                          <span className="text-xs font-normal text-slate-500">
                            {v.unit}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-slate-500 font-mono-tabular">
                          {v.measuredAt}
                        </p>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={handleVitalSubmit}
                    className="pt-5 border-t border-slate-200 space-y-3"
                  >
                    <p className="text-xs font-medium text-slate-700">
                      Record New Vital Reading
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <select
                        value={vitalLabel}
                        onChange={(e) => {
                          const lbl = e.target.value;
                          setVitalLabel(lbl);
                          if (lbl === "Blood Pressure") setVitalUnit("mmHg");
                          else if (lbl === "Fasting Glucose") setVitalUnit("mg/dL");
                          else if (lbl === "Oxygen Saturation") setVitalUnit("%");
                          else if (lbl === "Body Temp") setVitalUnit("°F");
                          else setVitalUnit("lbs");
                        }}
                        aria-label="Vital metric"
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                      >
                        <option>Blood Pressure</option>
                        <option>Fasting Glucose</option>
                        <option>Oxygen Saturation</option>
                        <option>Body Temp</option>
                        <option>Body Weight</option>
                      </select>
                      <input
                        type="text"
                        value={vitalValue}
                        onChange={(e) => setVitalValue(e.target.value)}
                        placeholder="Value (e.g. 122/78)"
                        aria-label="Vital reading value"
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                      />
                      <input
                        type="text"
                        value={vitalUnit}
                        onChange={(e) => setVitalUnit(e.target.value)}
                        placeholder="Unit"
                        aria-label="Vital unit"
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0D6E5C] text-white px-4 py-2 text-xs font-medium hover:bg-[#095547] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        Log Vital
                      </button>
                    </div>
                  </form>
                </div>

                {/* Allergies & Chronic Conditions */}
                <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-slate-900 mb-3">
                        Allergies &amp; Sensitivities
                      </h4>
                      <ul className="space-y-2">
                        {resident.allergies.map((allergy) => (
                          <li
                            key={allergy}
                            className="flex items-center gap-2 text-sm text-rose-800"
                          >
                            <AlertTriangle
                              className="w-4 h-4 shrink-0"
                              aria-hidden="true"
                            />
                            <span>{allergy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-5 border-t border-slate-200">
                      <h4 className="text-lg font-medium text-slate-900 mb-3">
                        Active Care Conditions
                      </h4>
                      <ul className="space-y-2">
                        {resident.conditions.map((cond) => (
                          <li
                            key={cond}
                            className="flex items-center gap-2 text-sm text-slate-700"
                          >
                            <Check
                              className="w-4 h-4 text-[#0D6E5C] shrink-0"
                              aria-hidden="true"
                            />
                            <span>{cond}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <form
                    onSubmit={handleFlagSubmit}
                    className="mt-6 pt-5 border-t border-slate-200 space-y-3"
                  >
                    <p className="text-xs font-medium text-slate-700">
                      Add Allergy or Care Condition
                    </p>
                    <div className="flex gap-2">
                      <select
                        value={flagKind}
                        onChange={(e) =>
                          setFlagKind(e.target.value as "allergy" | "condition")
                        }
                        aria-label="Clinical flag type"
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                      >
                        <option value="allergy">Allergy</option>
                        <option value="condition">Condition</option>
                      </select>
                      <input
                        type="text"
                        value={flagText}
                        onChange={(e) => setFlagText(e.target.value)}
                        placeholder="e.g. Aspirin sensitivity"
                        aria-label="Clinical note"
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-slate-900 text-white px-3.5 py-2 text-xs font-medium hover:bg-slate-800 cursor-pointer whitespace-nowrap"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === "medications" && (
              <motion.div
                key="tab-meds"
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotateX: 4, y: 10 }
                }
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotateX: -4, y: -10 }
                }
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                  <div>
                    <h4 className="text-lg font-medium text-slate-900">
                      Prescription Directory &amp; Refill Status
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tracks supply levels and notifies the family coordinator before
                      running low.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500">
                        <th className="py-2.5 pr-4 font-medium">Medication</th>
                        <th className="py-2.5 pr-4 font-medium">Dosage</th>
                        <th className="py-2.5 pr-4 font-medium">Schedule</th>
                        <th className="py-2.5 pr-4 font-medium">Prescriber</th>
                        <th className="py-2.5 pr-4 font-medium text-right">
                          Supply
                        </th>
                        <th className="py-2.5 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {resident.prescriptions.map((rx) => {
                        const low = rx.daysRemaining <= 7;
                        return (
                          <tr key={rx.id} className="hover:bg-slate-50/70">
                            <td className="py-3.5 pr-4 font-medium text-slate-900">
                              {rx.name}
                            </td>
                            <td className="py-3.5 pr-4 text-slate-700">
                              {rx.dosage}
                            </td>
                            <td className="py-3.5 pr-4 text-slate-600">
                              {rx.timing}
                            </td>
                            <td className="py-3.5 pr-4 text-slate-600">
                              {rx.prescriber}
                            </td>
                            <td className="py-3.5 pr-4 text-right font-mono-tabular">
                              <span
                                className={
                                  low
                                    ? "text-amber-700 font-semibold"
                                    : "text-slate-700"
                                }
                              >
                                {rx.daysRemaining}d left{low ? " (Low)" : ""}
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => onToggleRefill(resident.id, rx.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                                  rx.refillRequested
                                    ? "bg-[#0D6E5C] text-white"
                                    : "border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
                                }`}
                              >
                                {rx.refillRequested
                                  ? "Refill Requested"
                                  : "Request Refill"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <form
                  onSubmit={handleRxSubmit}
                  className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-3"
                >
                  <input
                    type="text"
                    value={rxName}
                    onChange={(e) => setRxName(e.target.value)}
                    placeholder="Medication name"
                    aria-label="New medication name"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  />
                  <input
                    type="text"
                    value={rxDosage}
                    onChange={(e) => setRxDosage(e.target.value)}
                    placeholder="Dosage (e.g. 20 mg)"
                    aria-label="Medication dosage"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  />
                  <input
                    type="text"
                    value={rxTiming}
                    onChange={(e) => setRxTiming(e.target.value)}
                    placeholder="Timing (e.g. 8:00 AM)"
                    aria-label="Medication timing"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  />
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={rxDays}
                    onChange={(e) => setRxDays(e.target.value)}
                    placeholder="Days"
                    aria-label="Days supply"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0F2922] text-white px-4 py-2 text-xs font-medium hover:bg-[#163b31] cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Add Prescription
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === "appointments" && (
              <motion.div
                key="tab-appointments"
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotateX: 4, y: 10 }
                }
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotateX: -4, y: -10 }
                }
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <h4 className="text-lg font-medium text-slate-900 mb-4">
                  Upcoming Appointments &amp; Family Visits
                </h4>
                <div className="divide-y divide-slate-200 mb-6">
                  {resident.appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {apt.title}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          With {apt.withPerson} · {apt.mode}
                        </p>
                      </div>
                      <span className="font-mono-tabular text-xs font-medium text-[#0D6E5C] whitespace-nowrap">
                        {apt.date} · {apt.time}
                      </span>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={handleAptSubmit}
                  className="pt-5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-3"
                >
                  <input
                    type="text"
                    value={aptTitle}
                    onChange={(e) => setAptTitle(e.target.value)}
                    placeholder="Visit or clinic appointment"
                    aria-label="Appointment title"
                    className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  />
                  <input
                    type="text"
                    value={aptWith}
                    onChange={(e) => setAptWith(e.target.value)}
                    placeholder="Clinician or family member"
                    aria-label="Appointment person"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aptDate}
                      onChange={(e) => setAptDate(e.target.value)}
                      placeholder="Date"
                      aria-label="Appointment date"
                      className="w-1/2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900"
                    />
                    <input
                      type="text"
                      value={aptTime}
                      onChange={(e) => setAptTime(e.target.value)}
                      placeholder="Time"
                      aria-label="Appointment time"
                      className="w-1/2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={aptMode}
                      onChange={(e) =>
                        setAptMode(e.target.value as AppointmentItem["mode"])
                      }
                      aria-label="Visit mode"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900"
                    >
                      <option>In-Person</option>
                      <option>Video Visit</option>
                      <option>Home Visit</option>
                    </select>
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-[#0D6E5C] text-white px-3 py-2 text-xs font-medium hover:bg-[#095547] cursor-pointer whitespace-nowrap"
                    >
                      Schedule
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === "comfort" && (
              <motion.div
                key="tab-comfort"
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotateX: 4, y: 10 }
                }
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, rotateX: -4, y: -10 }
                }
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Emergency Contacts */}
                <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6">
                  <h4 className="text-lg font-medium text-slate-900 mb-4">
                    Emergency &amp; Clinician Contacts
                  </h4>
                  <div className="divide-y divide-slate-200">
                    {resident.circleMembers.map((member) => (
                      <div
                        key={member.id}
                        className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {member.name}
                          </p>
                          <p className="text-xs text-slate-600">
                            {member.role} · {member.location}
                          </p>
                        </div>
                        {member.phone && (
                          <button
                            type="button"
                            onClick={() => handleCopyPhone(member.id, member.phone!)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono-tabular text-xs text-slate-800 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
                          >
                            <Phone className="w-3 h-3 text-[#0D6E5C]" aria-hidden="true" />
                            {copiedPhoneId === member.id ? (
                              <>
                                <Check className="w-3 h-3 text-[#0D6E5C]" />
                                Copied
                              </>
                            ) : (
                              <>
                                {member.phone}
                                <Copy className="w-3 h-3 text-slate-400" aria-hidden="true" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comfort & Gemini Companion Rituals */}
                <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                  <div>
                    <h4 className="text-lg font-medium text-slate-900">
                      Comfort &amp; Voice Companion Preferences
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kindred uses these preferences to personalize daily conversations.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="pref-drink"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Favorite Afternoon Tea / Hydration Cue
                    </label>
                    <input
                      id="pref-drink"
                      type="text"
                      value={resident.comfortPreferences.favoriteDrink}
                      onChange={(e) =>
                        onUpdateComfort(resident.id, {
                          favoriteDrink: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pref-topics"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Favorite Conversation Topics
                    </label>
                    <input
                      id="pref-topics"
                      type="text"
                      value={resident.comfortPreferences.preferredTopics}
                      onChange={(e) =>
                        onUpdateComfort(resident.id, {
                          preferredTopics: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label
                        htmlFor="pref-quiet"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Quiet Hours Window
                      </label>
                      <input
                        id="pref-quiet"
                        type="text"
                        value={resident.comfortPreferences.quietHours}
                        onChange={(e) =>
                          onUpdateComfort(resident.id, {
                            quietHours: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 font-mono-tabular"
                      />
                    </div>

                    <div>
                      <span className="block text-xs font-medium text-slate-700 mb-1">
                        Voice Companion Pace
                      </span>
                      <div className="inline-flex w-full rounded-xl bg-slate-100 p-1">
                        {(["Unhurried", "Standard"] as const).map((pace) => (
                          <button
                            key={pace}
                            type="button"
                            onClick={() =>
                              onUpdateComfort(resident.id, { voicePace: pace })
                            }
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                              resident.comfortPreferences.voicePace === pace
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-600"
                            }`}
                          >
                            {pace}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
