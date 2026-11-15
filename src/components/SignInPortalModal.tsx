import { useEffect, useState, type FormEvent } from "react";
import { freebuffAuthAvailable, PUBLISHED_SITE_URL } from "../freebuffAuth";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, LogIn, Mail, ShieldCheck, UserPlus, X } from "lucide-react";

interface SignInPortalModalProps {
  open: boolean;
  onClose: () => void;
  onFreebuffSignIn: (input?: { email?: string; name?: string }) => Promise<void>;
  onProceedWithEmailOnboarding: (name: string, email: string) => void;
}

function formatNameFromEmail(email: string): string {
  const local = (email.split("@")[0] || "").replace(/[0-9._-]+/g, " ").trim();
  if (!local) return "New Member";
  return local
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function SignInPortalModal({
  open,
  onClose,
  onFreebuffSignIn,
  onProceedWithEmailOnboarding,
}: SignInPortalModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittingFreebuff, setSubmittingFreebuff] = useState(false);
  const [authAvailable, setAuthAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!open) return;
    let live = true;
    freebuffAuthAvailable().then((available) => {
      if (live) setAuthAvailable(available);
    });
    return () => {
      live = false;
    };
  }, [open]);

  const handleFreebuffClick = async () => {
    setSubmittingFreebuff(true);
    setErrorMsg(null);
    try {
      // Redirects to Freebuff OIDC and back to this page; no tokens touch the browser.
      await onFreebuffSignIn();
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not start Freebuff sign-in."
      );
    } finally {
      setSubmittingFreebuff(false);
    }
  };

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    const resolvedName = nameInput.trim() || formatNameFromEmail(cleanEmail);
    setErrorMsg(null);
    onClose();
    onProceedWithEmailOnboarding(resolvedName, cleanEmail);
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signin-portal-title"
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
            className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-[#F8FAFC]">
              <div>
                <h3
                  id="signin-portal-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Sign In with Freebuff
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  One session for the whole family care circle
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close sign in dialog"
                className="min-h-[40px] min-w-[40px] rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200/70 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800"
                >
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
                  <p className="text-xs font-medium text-[#0F2922] inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
                    Freebuff sign-in
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    You&apos;ll be sent to Freebuff (Google, GitHub or Apple) and
                    returned here signed in. The session is a secure cookie issued by
                    this site — no passwords or tokens reach the page.
                  </p>

                  {authAvailable === false && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      Freebuff sign-in is served by this app&apos;s Worker. Open the
                      published deployment to sign in:{" "}
                      <a
                        href={PUBLISHED_SITE_URL}
                        className="underline font-medium whitespace-nowrap"
                      >
                        Kindred Care on Freebuff Sites
                      </a>
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleFreebuffClick}
                    disabled={submittingFreebuff || authAvailable === false}
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2922] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#163b31] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                    {submittingFreebuff
                      ? "Redirecting to Freebuff..."
                      : "Continue with Freebuff"}
                  </button>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="px-3 bg-white text-[11px] font-medium text-slate-400 whitespace-nowrap">
                    your details
                  </span>
                  <div className="border-t border-slate-200 w-full" />
                </div>

                <div>
                  <label
                    htmlFor="portal-email"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Email ID
                  </label>
                  <div className="relative">
                    <Mail
                      className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      id="portal-email"
                      type="email"
                      value={emailInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEmailInput(val);
                        if (!nameInput && val.includes("@")) {
                          setNameInput(formatNameFromEmail(val));
                        }
                      }}
                      placeholder="e.g. akshit@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2 text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="portal-name"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Your Name / Patient Name
                  </label>
                  <input
                    id="portal-name"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Akshit"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D6E5C] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#095547] transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" aria-hidden="true" />
                  Sign in &amp; enroll a new patient
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
