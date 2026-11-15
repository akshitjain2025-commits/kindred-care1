import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";

export function CareInquirySection() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("Adult Child / Family");
  const [careFocus, setCareFocus] = useState("Independent Aging at Home");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    referenceCode: string;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/care-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, relationship, careFocus }),
      });
      const data = (await res.json()) as {
        confirmed?: boolean;
        referenceCode?: string;
        message?: string;
        error?: string;
      };
      if (!res.ok || !data.confirmed) {
        throw new Error(data.error || "Unable to submit care plan request.");
      }
      setConfirmation({
        referenceCode: data.referenceCode || "KC-104200",
        message: data.message || "Your consultation request has been received.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="care-plan"
      className="py-20 border-t border-slate-200 bg-[#0F2922] text-white"
    >
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-6">
          <p className="text-xs font-medium text-emerald-300 tracking-wide">
            05. Start a Home Care Circle
          </p>
          <h2 className="mt-2 text-3xl lg:text-4xl font-medium tracking-tight text-white text-balance">
            Bring calm, camera-free care coordination to your family&apos;s home
          </h2>
          <p className="mt-4 text-base text-slate-200 leading-relaxed max-w-xl">
            Every Kindred Care kit arrives pre-configured with your parent&apos;s
            medication schedule, family circle contacts, and voice companion
            preferences—ready to plug into a living room outlet in five minutes.
          </p>

          <dl className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-white/15">
            <div>
              <dt className="text-xs text-emerald-200">Hardware &amp; Setup</dt>
              <dd className="mt-1 text-sm font-medium text-white">
                Ceramic Tabletop Beacon + 2 Ambient Path Nodes
              </dd>
            </div>
            <div>
              <dt className="text-xs text-emerald-200">Privacy Architecture</dt>
              <dd className="mt-1 text-sm font-medium text-white">
                Zero optical cameras · Local acoustic wake word
              </dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-2xl bg-white text-slate-900 p-6 sm:p-8 border border-slate-200">
            {confirmation ? (
              <div className="py-6 space-y-4">
                <div className="inline-flex items-center gap-2 text-[#0D6E5C] font-medium text-sm">
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                  Care Consultation Scheduled · Ref{" "}
                  <span className="font-mono-tabular">{confirmation.referenceCode}</span>
                </div>
                <p className="text-base text-slate-800 leading-relaxed">
                  {confirmation.message}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmation(null);
                    setFullName("");
                    setEmail("");
                  }}
                  className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <h3 className="text-xl font-medium text-slate-900">
                    Request a Family Care Walkthrough
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Speak with a certified geriatric care coordinator—no obligation.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="inquiry-name"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Your Full Name
                    </label>
                    <input
                      id="inquiry-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Clara Pendelton"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D6E5C]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="inquiry-email"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="inquiry-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="clara@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D6E5C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="inquiry-relationship"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Your Role
                    </label>
                    <select
                      id="inquiry-relationship"
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D6E5C]"
                    >
                      <option>Adult Child / Family</option>
                      <option>Older Adult Planning Ahead</option>
                      <option>Home Care Agency / Clinician</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="inquiry-focus"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Primary Support Need
                    </label>
                    <select
                      id="inquiry-focus"
                      value={careFocus}
                      onChange={(e) => setCareFocus(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D6E5C]"
                    >
                      <option>Independent Aging at Home</option>
                      <option>Medication &amp; Hydration Reminders</option>
                      <option>Post-Hospital Mobility Recovery</option>
                      <option>Multi-Caregiver Coordination</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="text-xs text-rose-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#0D6E5C] text-white px-5 py-3 text-sm font-medium hover:bg-[#095547] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {submitting ? "Scheduling Walkthrough..." : "Schedule Care Plan Call"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
