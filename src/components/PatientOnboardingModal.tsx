import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Calendar, PhoneCall, UserPlus, X } from "lucide-react";
import type { ResidentProfile } from "../data/eldercareData";

export type PostOnboardingAction = "profile" | "contact_doctor" | "book_appointment";

interface PatientOnboardingModalProps {
  open: boolean;
  defaultName: string;
  defaultEmail: string;
  onClose: () => void;
  onCreateResident: (
    resident: ResidentProfile,
    postAction: PostOnboardingAction
  ) => void;
}

export function PatientOnboardingModal({
  open,
  defaultName,
  defaultEmail,
  onClose,
  onCreateResident,
}: PatientOnboardingModalProps) {
  const prefersReducedMotion = useReducedMotion();

  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("68");
  const [dateOfBirth, setDateOfBirth] = useState("January 15, 1958");
  const [bloodType, setBloodType] = useState("O+");
  const [primaryLanguage, setPrimaryLanguage] = useState("English");
  const [mobilityAid, setMobilityAid] = useState("Independent (No aid)");
  const [residence, setResidence] = useState("Home Residence · Main Suite");
  const [careFocus, setCareFocus] = useState(
    "Daily wellness rhythm, medication reminders, and doctor check-ins"
  );
  const [statusLevel, setStatusLevel] = useState<"Calm" | "Active" | "Resting">(
    "Calm"
  );
  const [restingHeartRate, setRestingHeartRate] = useState("70 bpm");
  const [hydrationTarget, setHydrationTarget] = useState("7");
  const [allergiesInput, setAllergiesInput] = useState("None reported");
  const [conditionsInput, setConditionsInput] = useState("Routine preventive wellness");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactRelation, setEmergencyContactRelation] =
    useState("Family Member");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [doctorName, setDoctorName] = useState("Dr. Hannah Sato, MD");
  const [doctorSpecialty, setDoctorSpecialty] = useState(
    "Primary Care & Preventive Medicine"
  );
  const [doctorPhone, setDoctorPhone] = useState("(503) 555-0192");
  const [doctorEmail, setDoctorEmail] = useState("care@cedarvalleyclinic.example");
  const [starterMedName, setStarterMedName] = useState("Daily Multivitamin");
  const [starterMedDosage, setStarterMedDosage] = useState("1 tablet");
  const [starterMedTime, setStarterMedTime] = useState("08:30 AM");
  const [favoriteDrink, setFavoriteDrink] = useState("Warm herbal tea");
  const [preferredTopics, setPreferredTopics] = useState(
    "Music, reading, family updates, light walking"
  );
  const [quietHours, setQuietHours] = useState("10:00 PM – 07:00 AM");
  const [postAction, setPostAction] = useState<PostOnboardingAction>("profile");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setEmail(defaultEmail);
      setFormError(null);
    }
  }, [open, defaultName, defaultEmail]);

  const buildNewResident = (): ResidentProfile => {
    const cleanName = name.trim();
    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32);
    const id = `${slug || "patient"}-${Date.now().toString().slice(-5)}`;
    const parsedAge = Math.max(18, Math.min(120, Number(age) || 68));
    const parsedTarget = Math.max(1, Math.min(16, Number(hydrationTarget) || 7));
    const allergies = allergiesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const conditions = conditionsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const medTitle = starterMedName.trim()
      ? `${starterMedName.trim()} (${starterMedDosage.trim() || "1 dose"})`
      : "Morning Medication Check-In";
    const medTime = starterMedTime.trim() || "08:30 AM";

    const circleMembers = [
      {
        id: `cm-doc-${Date.now()}`,
        name: doctorName.trim() || "Primary Physician",
        role: doctorSpecialty.trim() || "Primary Care Doctor",
        location: "Primary Clinic",
        lastCheckIn: "On file",
        phone: doctorPhone.trim() || undefined,
      },
      ...(emergencyContactName.trim()
        ? [
            {
              id: `cm-fam-${Date.now() + 1}`,
              name: emergencyContactName.trim(),
              role: emergencyContactRelation.trim() || "Emergency Contact",
              location: "Family Circle",
              lastCheckIn: "Today",
              phone: emergencyContactPhone.trim() || undefined,
            },
          ]
        : []),
    ];

    return {
      id,
      name: cleanName,
      age: parsedAge,
      dateOfBirth: dateOfBirth.trim() || "On file",
      bloodType: bloodType.trim() || "O+",
      primaryLanguage: primaryLanguage.trim() || "English",
      mobilityAid: mobilityAid.trim() || "Independent",
      residence: residence.trim() || "Home Residence",
      careFocus: careFocus.trim() || "Daily health & medication rhythm",
      statusLevel,
      avatarUrl: "/assets/images/eldercare_living_sunlight_1794715912243.jpg",
      safetySummary:
        "New care profile initialized · Personalized medication reminders active",
      restingHeartRate: restingHeartRate.trim() || "70 bpm",
      hydrationGlasses: 2,
      hydrationTarget: parsedTarget,
      upcomingVisit: `Primary Doctor: ${doctorName.trim() || "Schedule check-in"}`,
      homeLat: 45.5231,
      homeLng: -122.6765,
      patientEmail: email.trim() || undefined,
      patientPhone: phone.trim() || undefined,
      doctorName: doctorName.trim() || undefined,
      doctorSpecialty: doctorSpecialty.trim() || undefined,
      doctorPhone: doctorPhone.trim() || undefined,
      doctorEmail: doctorEmail.trim() || undefined,
      allergies: allergies.length > 0 ? allergies : ["None reported"],
      conditions: conditions.length > 0 ? conditions : ["General wellness"],
      vitals: [
        {
          id: `v-init-${Date.now()}`,
          label: "Resting Heart Rate",
          value: (restingHeartRate.trim() || "70").replace(/\s*bpm/i, ""),
          unit: "bpm",
          measuredAt: "Today · Baseline",
          status: "Normal",
        },
      ],
      prescriptions: starterMedName.trim()
        ? [
            {
              id: `rx-init-${Date.now()}`,
              name: starterMedName.trim(),
              dosage: starterMedDosage.trim() || "As directed",
              timing: medTime,
              prescriber: doctorName.trim() || "Primary Physician",
              daysRemaining: 30,
              refillRequested: false,
            },
          ]
        : [],
      appointments: [],
      comfortPreferences: {
        favoriteDrink: favoriteDrink.trim() || "Warm herbal tea",
        preferredTopics: preferredTopics.trim() || "Music, daily walks, reading",
        quietHours: quietHours.trim() || "10:00 PM – 07:00 AM",
        voicePace: "Unhurried",
        eveningLampCue: true,
      },
      wellnessHistory: [
        { day: "Mon", activityScore: 78, sleepScore: 80, hydrationScore: 75 },
        { day: "Tue", activityScore: 80, sleepScore: 82, hydrationScore: 80 },
        { day: "Wed", activityScore: 79, sleepScore: 84, hydrationScore: 85 },
        { day: "Thu", activityScore: 82, sleepScore: 85, hydrationScore: 85 },
        { day: "Fri", activityScore: 84, sleepScore: 86, hydrationScore: 90 },
        { day: "Sat", activityScore: 85, sleepScore: 88, hydrationScore: 85 },
        { day: "Sun", activityScore: 80, sleepScore: 84, hydrationScore: 80 },
      ],
      tasks: [
        {
          id: `t-med-${Date.now()}`,
          time: medTime,
          title: medTitle,
          detail: "Scheduled dose with hydration check",
          category: "Medication",
          completed: false,
        },
        {
          id: `t-walk-${Date.now() + 1}`,
          time: "10:30 AM",
          title: "Morning walk & stretch",
          detail: "15–20 minutes gentle daily movement",
          category: "Mobility",
          completed: false,
        },
        {
          id: `t-hyd-${Date.now() + 2}`,
          time: "03:00 PM",
          title: "Afternoon hydration check",
          detail: favoriteDrink.trim() || "Full glass of water or tea",
          category: "Hydration",
          completed: false,
        },
      ],
      circleMembers,
      notes: [
        {
          id: `note-init-${Date.now()}`,
          author: cleanName,
          timestamp: "Today · Enrolled",
          text: `Completed new patient profile for ${cleanName}${
            email.trim() ? ` (${email.trim()})` : ""
          }. Primary physician: ${doctorName.trim() || "Pending"}.`,
        },
      ],
      securityLogs: [
        {
          id: `sec-init-${Date.now()}`,
          timestamp: "Today · Enrolled",
          eventType: "Pathway Check",
          zone: residence.trim() || "Home Residence",
          description: "Patient care record initialized and baseline sensors ready.",
          responseTime: "Automated",
          status: "Resolved",
          resolvedBy: cleanName,
        },
      ],
    };
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Please enter the patient or member name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError("Please provide a valid email address for the patient record.");
      return;
    }
    setFormError(null);
    const created = buildNewResident();
    onCreateResident(created, postAction);
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="patient-onboarding-title"
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
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full sm:max-w-3xl rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-[#F8FAFC]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0D6E5C] shrink-0">
                  <UserPlus className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3
                    id="patient-onboarding-title"
                    className="text-base sm:text-lg font-semibold text-slate-900 truncate"
                  >
                    New Patient &amp; Care Profile Enrollment
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    Complete essential health, medication, and physician details
                    {defaultEmail ? ` · Signed in as ${defaultEmail}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close enrollment form"
                className="min-h-[40px] min-w-[40px] rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 overflow-y-auto space-y-6"
            >
              {formError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800"
                >
                  {formError}
                </div>
              )}

              {/* Section 1: Identity & Contact */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-[#0D6E5C] uppercase tracking-wider">
                  1. Personal &amp; Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="onboard-name"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      id="onboard-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Akshit Jain"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-email"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Email ID
                    </label>
                    <input
                      id="onboard-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-phone"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Mobile Phone (SMS Alerts)
                    </label>
                    <input
                      id="onboard-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 234-5678"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label
                      htmlFor="onboard-age"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Age
                    </label>
                    <input
                      id="onboard-age"
                      type="number"
                      min={1}
                      max={125}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-dob"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Date of Birth
                    </label>
                    <input
                      id="onboard-dob"
                      type="text"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-blood"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Blood Type
                    </label>
                    <select
                      id="onboard-blood"
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    >
                      {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(
                        (b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-lang"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Language
                    </label>
                    <input
                      id="onboard-lang"
                      type="text"
                      value={primaryLanguage}
                      onChange={(e) => setPrimaryLanguage(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="onboard-residence"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Home / Residence Location
                    </label>
                    <input
                      id="onboard-residence"
                      type="text"
                      value={residence}
                      onChange={(e) => setResidence(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-mobility"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Mobility Support
                    </label>
                    <input
                      id="onboard-mobility"
                      type="text"
                      value={mobilityAid}
                      onChange={(e) => setMobilityAid(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Clinical & Wellness Baseline */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-semibold text-[#0D6E5C] uppercase tracking-wider">
                  2. Health Parameters &amp; Baseline Metrics
                </h4>
                <div>
                  <label
                    htmlFor="onboard-focus"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Primary Care Focus / Wellness Goal
                  </label>
                  <input
                    id="onboard-focus"
                    type="text"
                    value={careFocus}
                    onChange={(e) => setCareFocus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="onboard-status"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Current Status
                    </label>
                    <select
                      id="onboard-status"
                      value={statusLevel}
                      onChange={(e) =>
                        setStatusLevel(
                          e.target.value as "Calm" | "Active" | "Resting"
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="Calm">Calm</option>
                      <option value="Active">Active</option>
                      <option value="Resting">Resting</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-hr"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Resting Heart Rate
                    </label>
                    <input
                      id="onboard-hr"
                      type="text"
                      value={restingHeartRate}
                      onChange={(e) => setRestingHeartRate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-hydration"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Daily Hydration Target (glasses)
                    </label>
                    <input
                      id="onboard-hydration"
                      type="number"
                      min={1}
                      max={16}
                      value={hydrationTarget}
                      onChange={(e) => setHydrationTarget(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 font-mono-tabular"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="onboard-allergies"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Known Allergies (comma-separated)
                    </label>
                    <input
                      id="onboard-allergies"
                      type="text"
                      value={allergiesInput}
                      onChange={(e) => setAllergiesInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-conditions"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Health Conditions (comma-separated)
                    </label>
                    <input
                      id="onboard-conditions"
                      type="text"
                      value={conditionsInput}
                      onChange={(e) => setConditionsInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Primary Physician & Emergency Contact */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-semibold text-[#0D6E5C] uppercase tracking-wider">
                  3. Primary Doctor &amp; Emergency Circle
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="onboard-doc-name"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Primary Doctor Name
                    </label>
                    <input
                      id="onboard-doc-name"
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-doc-spec"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Specialty / Clinic
                    </label>
                    <input
                      id="onboard-doc-spec"
                      type="text"
                      value={doctorSpecialty}
                      onChange={(e) => setDoctorSpecialty(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-doc-phone"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Doctor Phone
                    </label>
                    <input
                      id="onboard-doc-phone"
                      type="tel"
                      value={doctorPhone}
                      onChange={(e) => setDoctorPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-doc-email"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Doctor Email
                    </label>
                    <input
                      id="onboard-doc-email"
                      type="email"
                      value={doctorEmail}
                      onChange={(e) => setDoctorEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="onboard-em-name"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Emergency / Family Contact
                    </label>
                    <input
                      id="onboard-em-name"
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="e.g. Priya Jain"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-em-rel"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Relationship
                    </label>
                    <input
                      id="onboard-em-rel"
                      type="text"
                      value={emergencyContactRelation}
                      onChange={(e) =>
                        setEmergencyContactRelation(e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-em-phone"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Contact Phone
                    </label>
                    <input
                      id="onboard-em-phone"
                      type="tel"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="(555) 987-6543"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Scheduled Medication & Comfort Rituals */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-semibold text-[#0D6E5C] uppercase tracking-wider">
                  4. Medication Schedule &amp; Comfort Preferences
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="onboard-med-name"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Daily Medication / Supplement
                    </label>
                    <input
                      id="onboard-med-name"
                      type="text"
                      value={starterMedName}
                      onChange={(e) => setStarterMedName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-med-dosage"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Dosage
                    </label>
                    <input
                      id="onboard-med-dosage"
                      type="text"
                      value={starterMedDosage}
                      onChange={(e) => setStarterMedDosage(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-med-time"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Reminder Time
                    </label>
                    <input
                      id="onboard-med-time"
                      type="text"
                      value={starterMedTime}
                      onChange={(e) => setStarterMedTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 font-mono-tabular"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="onboard-drink"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Preferred Beverage
                    </label>
                    <input
                      id="onboard-drink"
                      type="text"
                      value={favoriteDrink}
                      onChange={(e) => setFavoriteDrink(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-topics"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Interests / Topics
                    </label>
                    <input
                      id="onboard-topics"
                      type="text"
                      value={preferredTopics}
                      onChange={(e) => setPreferredTopics(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboard-quiet"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Quiet Hours
                    </label>
                    <input
                      id="onboard-quiet"
                      type="text"
                      value={quietHours}
                      onChange={(e) => setQuietHours(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 font-mono-tabular"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions with Doctor Contact / Appointment Options */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    onClick={() => setPostAction("contact_doctor")}
                    className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
                    Save &amp; Contact Doctor
                  </button>
                  <button
                    type="submit"
                    onClick={() => setPostAction("book_appointment")}
                    className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-[#0D6E5C] hover:bg-emerald-100 cursor-pointer whitespace-nowrap"
                  >
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    Save &amp; Book Appointment
                  </button>
                  <button
                    type="submit"
                    onClick={() => setPostAction("profile")}
                    className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-[#0D6E5C] text-white px-4 py-2 text-xs sm:text-sm font-medium hover:bg-[#095547] cursor-pointer whitespace-nowrap"
                  >
                    Save Patient Profile
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
