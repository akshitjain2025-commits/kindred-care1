import { Eye, Sparkles, Type, Volume2 } from "lucide-react";

export type ReaderFontScale = "standard" | "comfortable" | "large";

interface AccessibilityReaderBarProps {
  residentName: string;
  fontScale: ReaderFontScale;
  onChangeFontScale: (scale: ReaderFontScale) => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  onReadLodgingBrief: () => void;
}

export function AccessibilityReaderBar({
  residentName,
  fontScale,
  onChangeFontScale,
  highContrast,
  onToggleHighContrast,
  onReadLodgingBrief,
}: AccessibilityReaderBarProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
          <Type className="w-5 h-5 text-[#0D6E5C]" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Senior Accessibility &amp; Large-Print Reader Controls
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            Adjust print scale, ink contrast, or hear today&apos;s lodge briefing
            read aloud for {residentName}.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200"
          role="group"
          aria-label="Text reading size"
        >
          {(
            [
              { id: "standard", label: "Standard" },
              { id: "comfortable", label: "Larger +10%" },
              { id: "large", label: "Large Print +20%" },
            ] as { id: ReaderFontScale; label: string }[]
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeFontScale(opt.id)}
              aria-pressed={fontScale === opt.id}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                fontScale === opt.id
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onToggleHighContrast}
          aria-pressed={highContrast}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
            highContrast
              ? "bg-slate-950 text-white border-slate-950"
              : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          {highContrast ? "High Contrast On" : "High Contrast"}
        </button>

        <button
          type="button"
          onClick={onReadLodgingBrief}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D6E5C] text-white px-3.5 py-2 text-xs font-medium hover:bg-[#095547] transition-colors cursor-pointer whitespace-nowrap"
        >
          <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
          Read Daily Brief
          <Sparkles className="w-3 h-3 opacity-80" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
