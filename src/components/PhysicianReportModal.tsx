import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Download, FileText, X } from "lucide-react";
import type { ResidentProfile } from "../data/eldercareData";
import {
  computeResidentReportMetrics,
  generatePhysicianReportPdf,
} from "../utils/physicianReportPdf";

interface PhysicianReportModalProps {
  open: boolean;
  resident: ResidentProfile;
  onClose: () => void;
  onDownloaded?: (filename: string) => void;
}

export function PhysicianReportModal({
  open,
  resident,
  onClose,
  onDownloaded,
}: PhysicianReportModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const metrics = computeResidentReportMetrics(resident);

  const [physicianName, setPhysicianName] = useState(metrics.primaryPrescriber);
  const [clinicName, setClinicName] = useState("Primary Geriatric Care");
  const [visitDate, setVisitDate] = useState("Upcoming Visit");
  const [additionalNote, setAdditionalNote] = useState("");
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPhysicianName(metrics.primaryPrescriber);
      setDownloadedFile(null);
    }
  }, [open, resident.id, metrics.primaryPrescriber]);

  const handleDownload = (e: FormEvent) => {
    e.preventDefault();
    const res = generatePhysicianReportPdf(resident, {
      physicianName,
      clinicName,
      visitDate,
      additionalNote,
    });
    setDownloadedFile(res.filename);
    onDownloaded?.(res.filename);
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="physician-report-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs"
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
            className="relative w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-[#0F2922] text-white">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-300" aria-hidden="true" />
                <div>
                  <h3
                    id="physician-report-title"
                    className="text-base font-medium leading-tight"
                  >
                    Physician Weekly Report (PDF)
                  </h3>
                  <p className="text-xs text-emerald-100/80">
                    {resident.name} · Weekly Trends &amp; Medication Adherence
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close physician report dialog"
                className="min-h-[40px] min-w-[40px] rounded-lg flex items-center justify-center text-emerald-100 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDownload} className="p-6 overflow-y-auto space-y-5">
              {/* Included Snapshot KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                <div>
                  <p className="text-[11px] text-slate-500">Med Adherence</p>
                  <p className="font-mono-tabular text-lg font-semibold text-[#0D6E5C]">
                    {metrics.adherenceRatePct}%
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono-tabular">
                    {metrics.completedMedTasks}/{metrics.totalMedTasks} today
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Activity (7d)</p>
                  <p className="font-mono-tabular text-lg font-semibold text-slate-900">
                    {metrics.avgActivity}%
                  </p>
                  <p className="text-[11px] text-slate-500">Avg score</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Sleep (7d)</p>
                  <p className="font-mono-tabular text-lg font-semibold text-blue-700">
                    {metrics.avgSleep}%
                  </p>
                  <p className="text-[11px] text-slate-500">Avg quality</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Prescriptions</p>
                  <p className="font-mono-tabular text-lg font-semibold text-slate-900">
                    {resident.prescriptions.length}
                  </p>
                  <p className="text-[11px] text-slate-500">Active Rx</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="pdf-physician"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Attending Physician
                  </label>
                  <input
                    id="pdf-physician"
                    type="text"
                    value={physicianName}
                    onChange={(e) => setPhysicianName(e.target.value)}
                    placeholder="e.g. Dr. Hannah Sato, MD"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pdf-clinic"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Clinic / Practice
                  </label>
                  <input
                    id="pdf-clinic"
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="Clinic name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="pdf-visit-date"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Visit / Review Label
                  </label>
                  <input
                    id="pdf-visit-date"
                    type="text"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="pdf-extra-note"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Questions or Symptoms to Highlight (Optional)
                  </label>
                  <input
                    id="pdf-extra-note"
                    type="text"
                    value={additionalNote}
                    onChange={(e) => setAdditionalNote(e.target.value)}
                    placeholder="e.g. Evening hydration improved; ask about Vitamin D refill"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Includes allergies, 7-day Activity / Sleep / Hydration charts, today&apos;s
                scheduled dose check-offs, prescription supply levels, vitals, and
                safety log history.
              </p>

              {downloadedFile && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#0D6E5C] shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    Downloaded <strong>{downloadedFile}</strong>
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0D6E5C] text-white px-5 py-2.5 text-xs sm:text-sm font-medium hover:bg-[#095547] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Download Physician PDF
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
