import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  BookOpen,
  Camera,
  Check,
  ImagePlus,
  LayoutGrid,
  List,
  Loader2,
  Move,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import type { ResidentProfile } from "../data/eldercareData";
import {
  RollingActionLabel,
  Skiper27RollingText,
} from "./SkiperKineticPrimitives";

export interface ReminiscencePhoto {
  id: string;
  residentId: string;
  title: string;
  era: string;
  people: string;
  imageSrc: string;
  familyHint: string;
  descriptiveCaption: string;
  historicalContext: string;
  memoryPrompt: string;
  aiGenerated?: boolean;
}

const INITIAL_MEMORIES: ReminiscencePhoto[] = [
  {
    id: "mem-coast",
    residentId: "arthur",
    title: "Cape Perpetua Sunset Overlook",
    era: "Summer 1974 · Oregon Coast",
    people: "Arthur, Margaret & Young Clara",
    imageSrc: "/assets/images/memory_coastal_roadtrip_1794719847841.jpg",
    familyHint: "Stopped after driving Highway 101 in the blue station wagon.",
    descriptiveCaption:
      "Golden evening sunlight reflects across a sheltered coastal cove framed by tall coastal pines and a weathered timber overlook railing.",
    historicalContext:
      "In the mid-1970s along Oregon's Highway 101, family road trips often paused at cedar-railed turnouts before dusk while roadside diners served warm clam chowder and thermos coffee.",
    memoryPrompt:
      "Do you remember what songs were playing on the car radio during those coastal drives north?",
  },
  {
    id: "mem-picnic",
    residentId: "arthur",
    title: "Orchard Harvest Table & Lemonade",
    era: "September 2021 · Hood River Valley",
    people: "Arthur, Clara & Grandchildren",
    imageSrc: "/assets/images/memory_family_picnic_1794719849583.jpg",
    familyHint: "Three generations gathered under the apple trees for harvest weekend.",
    descriptiveCaption:
      "Family members of all ages gather around an outdoor oak table under fruiting apple branches with cold lemonade, fresh orchard apples, and sunny wildflowers.",
    historicalContext:
      "Autumn orchard weekends around Hood River celebrate heirloom Gravenstein and Honeycrisp harvests with crisp morning air and backyard wooden tables set under shade trees.",
    memoryPrompt:
      "Which apple variety from that orchard tasted best right off the branch?",
  },
  {
    id: "mem-greenhouse",
    residentId: "eleanor",
    title: "Cedar Orchid & Herb Greenhouse",
    era: "Spring 1998 · Maple Street Garden",
    people: "Eleanor Vance",
    imageSrc: "/assets/images/memory_botanical_greenhouse_1794719849772.jpg",
    familyHint: "Spent Saturday mornings potting white phalaenopsis orchids.",
    descriptiveCaption:
      "Soft morning light streams through glass panes onto rows of blooming white orchids in terracotta pots beside a brass watering can and garden twine.",
    historicalContext:
      "Late-1990s Pacific Northwest backyard cedar greenhouses favored terracotta potting benches and rainwater cans to nurture delicate moth orchids through cool springs.",
    memoryPrompt:
      "What made caring for those white orchids in the morning light feel most rewarding?",
  },
  {
    id: "mem-tea",
    residentId: "arthur",
    title: "Sunday Sunroom Chamomile Ritual",
    era: "October 2025 · Oakridge Living Room",
    people: "Arthur & Clara Pendelton",
    imageSrc: "/assets/images/eldercare_living_sunlight_1794715912243.jpg",
    familyHint: "Clara brought honey shortbread after visiting the botanical gardens.",
    descriptiveCaption:
      "Arthur and Clara sit peacefully by a sunlit window sharing warm tea at a wooden table surrounded by soft household greenery.",
    historicalContext:
      "Unrushed afternoon tea traditions create familiar sensory anchors—steeped chamomile, gentle daylight, and unhurried conversation without screens.",
    memoryPrompt:
      "Which cozy memory from your Sunday tea chats with Clara always brings a smile?",
  },
  {
    id: "mem-stroll",
    residentId: "eleanor",
    title: "Conservatory Walk with Julian",
    era: "Spring 2026 · Neighborhood Path",
    people: "Eleanor & Julian Vance",
    imageSrc: "/assets/images/family_garden_walk_1794715913136.jpg",
    familyHint: "First long outdoor stroll after strengthening hip balance.",
    descriptiveCaption:
      "Eleanor smiles warmly while strolling arm-in-arm with her son Julian along a flower-lined garden walkway dappled in spring sunlight.",
    historicalContext:
      "Consistent spring walks along neighborhood cedar-lined paths blend gentle sunlight with meaningful mother-and-son storytelling.",
    memoryPrompt:
      "What blooms along the neighborhood path caught your eye first that morning?",
  },
];

interface ReminiscenceGalleryProps {
  resident: ResidentProfile;
  onAddNote: (residentId: string, author: string, text: string) => void;
  onReadSummaryAloud: (prompt: string) => void;
}

/**
 * Resize an uploaded image file to a clean JPEG Data URL so it stays compact
 * for instant preview + multimodal Gemini analysis.
 */
function resizeImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read selected file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image file."));
      img.onload = () => {
        const maxDim = 960;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result || ""));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

export function ReminiscenceGallery({
  resident,
  onAddNote,
  onReadSummaryAloud,
}: ReminiscenceGalleryProps) {
  const prefersReducedMotion = useReducedMotion();
  const [photos, setPhotos] = useState<ReminiscencePhoto[]>(INITIAL_MEMORIES);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterScope, setFilterScope] = useState<"resident" | "all">("all");
  const [hoveredPhoto, setHoveredPhoto] = useState<ReminiscencePhoto | null>(
    null
  );
  const [cursorOffset, setCursorOffset] = useState({ x: 0, y: 0 });
  const [selectedPhoto, setSelectedPhoto] = useState<ReminiscencePhoto | null>(
    null
  );

  // Gemini captioning status per photo
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);

  // Add Family Memory Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newEra, setNewEra] = useState("Summer 1982 · Family Cabin");
  const [newPeople, setNewPeople] = useState("");
  const [newHint, setNewHint] = useState("");
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string>("");
  const [isAddingWithAi, setIsAddingWithAi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const visiblePhotos = useMemo(() => {
    if (filterScope === "all") return photos;
    const matched = photos.filter((p) => p.residentId === resident.id);
    return matched.length > 0 ? matched : photos;
  }, [photos, filterScope, resident.id]);

  const handleRowPointerMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorOffset({
      x: Math.max(-24, Math.min(24, ((e.clientX - rect.left) / rect.width - 0.5) * 32)),
      y: Math.max(-18, Math.min(18, ((e.clientY - rect.top) / rect.height - 0.5) * 22)),
    });
  };

  const generateGeminiMemoryContext = async (photo: ReminiscencePhoto) => {
    setGeneratingId(photo.id);
    setGeminiError(null);
    try {
      const isDataUrl = photo.imageSrc.startsWith("data:");
      const res = await fetch("/api/memories/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentName: resident.name,
          title: photo.title,
          era: photo.era,
          people: photo.people,
          familyHint: photo.familyHint,
          ...(isDataUrl
            ? { imageBase64: photo.imageSrc }
            : { imageUrl: photo.imageSrc }),
        }),
      });
      const data = (await res.json()) as {
        descriptiveCaption?: string;
        historicalContext?: string;
        memoryPrompt?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(
          data.error || "Unable to generate Gemini memory context."
        );
      }

      const updated: ReminiscencePhoto = {
        ...photo,
        descriptiveCaption: data.descriptiveCaption || photo.descriptiveCaption,
        historicalContext: data.historicalContext || photo.historicalContext,
        memoryPrompt: data.memoryPrompt || photo.memoryPrompt,
        aiGenerated: true,
      };
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? updated : p)));
      setSelectedPhoto((curr) => (curr?.id === photo.id ? updated : curr));
    } catch (err) {
      setGeminiError(
        err instanceof Error ? err.message : "Could not reach Gemini service."
      );
    } finally {
      setGeneratingId(null);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageFileToDataUrl(file);
      setUploadedDataUrl(dataUrl);
    } catch {
      setGeminiError("Please choose a valid JPEG, PNG, or WebP photograph.");
    }
  };

  const handleAddMemorySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsAddingWithAi(true);
    setGeminiError(null);

    const chosenSrc =
      uploadedDataUrl ||
      "/assets/images/memory_family_picnic_1794719849583.jpg";
    const id = `mem-${Date.now()}`;
    const draftPhoto: ReminiscencePhoto = {
      id,
      residentId: resident.id,
      title: newTitle.trim(),
      era: newEra.trim() || "Family Archive",
      people: newPeople.trim() || resident.name,
      imageSrc: chosenSrc,
      familyHint: newHint.trim(),
      descriptiveCaption: `Curated photograph: ${newTitle.trim()}.`,
      historicalContext: "Generating Gemini historical context...",
      memoryPrompt: "What warm memory comes back first when seeing this moment?",
    };

    try {
      const isDataUrl = chosenSrc.startsWith("data:");
      const res = await fetch("/api/memories/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentName: resident.name,
          title: draftPhoto.title,
          era: draftPhoto.era,
          people: draftPhoto.people,
          familyHint: draftPhoto.familyHint,
          ...(isDataUrl ? { imageBase64: chosenSrc } : { imageUrl: chosenSrc }),
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          descriptiveCaption?: string;
          historicalContext?: string;
          memoryPrompt?: string;
        };
        draftPhoto.descriptiveCaption =
          data.descriptiveCaption || draftPhoto.descriptiveCaption;
        draftPhoto.historicalContext =
          data.historicalContext || draftPhoto.historicalContext;
        draftPhoto.memoryPrompt = data.memoryPrompt || draftPhoto.memoryPrompt;
        draftPhoto.aiGenerated = true;
      }
    } catch {
      // Keep draft entry even if AI request fails transiently
    }

    setPhotos((prev) => [draftPhoto, ...prev]);
    setSelectedPhoto(draftPhoto);
    onAddNote(
      resident.id,
      "Reminiscence Album",
      `Added shared memory photo "${draftPhoto.title}" (${draftPhoto.era}) with Gemini memory context.`
    );
    setNewTitle("");
    setNewPeople("");
    setNewHint("");
    setUploadedDataUrl("");
    setShowAddForm(false);
    setIsAddingWithAi(false);
  };

  return (
    <section
      id="reminiscence-gallery"
      className="py-20 border-t border-slate-200 bg-white"
    >
      <div className="max-w-[1200px] mx-auto px-6 space-y-8">
        {/* Header with Skiper27 Rolling Headline + View Controls (Skiper80 Pattern) */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#0D6E5C] tracking-wide">
              Shared Family Memory Support · Powered by Gemini &amp; Skiper80
            </p>
            <Skiper27RollingText
              as="h2"
              text="Reminiscence Gallery & living photo stories"
              className="mt-2 text-3xl lg:text-4xl font-medium tracking-tight text-slate-900 text-balance"
            />
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              Family members curate meaningful photographs together. Gemini enriches
              each photo with warm descriptive captions, historical era context,
              and gentle conversation prompts—presented with tactile{" "}
              <span className="font-medium text-slate-800">Skiper80</span>{" "}
              gallery-to-detail transitions and draggable keepsake prints.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <div
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200"
              role="group"
              aria-label="Filter gallery scope"
            >
              <button
                type="button"
                onClick={() => setFilterScope("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  filterScope === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Full Circle ({photos.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterScope("resident")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  filterScope === "resident"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {resident.name.split(" ")[0]}&apos;s Album
              </button>
            </div>

            <div
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200"
              role="group"
              aria-label="Reminiscence layout view"
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
                Album Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === "list"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <List className="w-3.5 h-3.5" aria-hidden="true" />
                Story Index
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D6E5C] text-white px-4 py-2 text-xs sm:text-sm font-medium hover:bg-[#095547] transition-colors cursor-pointer whitespace-nowrap"
            >
              <ImagePlus className="w-4 h-4" aria-hidden="true" />
              {showAddForm ? "Close Form" : "Add Family Photo"}
            </button>
          </div>
        </div>

        {/* Add Curated Family Memory Drawer */}
        <AnimatePresence initial={false}>
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={(e) => void handleAddMemorySubmit(e)}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-emerald-200 bg-[#F8FAFC] p-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Curate a Shared Memory for {resident.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Upload a family photo (or use our archive backdrop) and let
                      Gemini write sensory historical context.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => void handleFileChange(e)}
                      className="sr-only"
                      aria-label="Upload family memory photo"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-36 rounded-xl border-2 border-dashed border-slate-300 bg-white hover:border-[#0D6E5C] flex flex-col items-center justify-center gap-2 p-3 text-center transition-colors cursor-pointer overflow-hidden"
                    >
                      {uploadedDataUrl ? (
                        <img
                          src={uploadedDataUrl}
                          alt="Uploaded memory preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-[#0D6E5C]" aria-hidden="true" />
                          <span className="text-xs font-medium text-slate-700">
                            Choose Photo from Device
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Or submit to use family archive scene
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Memory title (e.g. Lake Tahoe Dock 1978)"
                      aria-label="Memory title"
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900"
                    />
                    <input
                      type="text"
                      value={newEra}
                      onChange={(e) => setNewEra(e.target.value)}
                      placeholder="Year & location (e.g. Summer 1978)"
                      aria-label="Year and setting"
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900"
                    />
                    <input
                      type="text"
                      value={newPeople}
                      onChange={(e) => setNewPeople(e.target.value)}
                      placeholder="People in photo"
                      aria-label="People in photo"
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900"
                    />
                    <input
                      type="text"
                      value={newHint}
                      onChange={(e) => setNewHint(e.target.value)}
                      placeholder="Short family clue for Gemini context..."
                      aria-label="Family hint"
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900"
                    />
                    <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={isAddingWithAi}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0F2922] text-white px-5 py-2.5 text-xs sm:text-sm font-medium hover:bg-[#163b31] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {isAddingWithAi ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                            Analyzing Photo with Gemini...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" aria-hidden="true" />
                            Save Photo &amp; Generate Gemini Context
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {geminiError && (
          <p className="text-xs font-medium text-rose-700">{geminiError}</p>
        )}

        {/* Skiper80 Stage: Layout Morph between Photo Grid & Floating-Preview Story Index */}
        <div
          className="relative"
          onMouseMove={viewMode === "list" ? handleRowPointerMove : undefined}
          onMouseLeave={() => setHoveredPhoto(null)}
        >
          {/* Skiper80 Floating Cursor-Tracking Preview Thumbnail in Story List Mode */}
          <AnimatePresence>
            {viewMode === "list" &&
              hoveredPhoto &&
              !selectedPhoto &&
              !prefersReducedMotion && (
                <motion.div
                  key={hoveredPhoto.id}
                  initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: cursorOffset.x * 0.14,
                    x: cursorOffset.x,
                    y: cursorOffset.y,
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className="hidden lg:block pointer-events-none fixed lg:absolute right-6 top-4 z-20 w-72 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xl"
                >
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img
                      src={hoveredPhoto.imageSrc}
                      alt={hoveredPhoto.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3.5 bg-white">
                    <p className="font-mono-tabular text-[11px] text-[#0D6E5C] font-medium">
                      {hoveredPhoto.era}
                    </p>
                    <p className="text-xs font-semibold text-slate-900 mt-0.5 truncate">
                      {hoveredPhoto.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {hoveredPhoto.people}
                    </p>
                  </div>
                </motion.div>
              )}
          </AnimatePresence>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visiblePhotos.map((photo) => {
                const isLoading = generatingId === photo.id;
                return (
                  <motion.div
                    key={photo.id}
                    layout
                    layoutId={`reminiscence-card-${photo.id}`}
                    whileHover={prefersReducedMotion ? undefined : { y: -5 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="rounded-2xl border border-slate-200 bg-[#F8FAFC] overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(photo)}
                        className="block w-full text-left cursor-pointer"
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-slate-200 relative">
                          <img
                            src={photo.imageSrc}
                            alt={photo.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      </button>

                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span className="font-mono-tabular text-[#0D6E5C] font-medium">
                            {photo.era}
                          </span>
                          <span>{photo.people}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(photo)}
                          className="text-left block w-full cursor-pointer"
                        >
                          <h3 className="text-lg font-medium text-slate-900 group-hover:text-[#0D6E5C] transition-colors">
                            {photo.title}
                          </h3>
                        </button>

                        <p className="text-sm text-slate-700 leading-relaxed">
                          {photo.descriptiveCaption}
                        </p>

                        <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-200 pt-2.5">
                          <span className="font-semibold text-slate-700">
                            Era Context:
                          </span>{" "}
                          {photo.historicalContext}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-2 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => void generateGeminiMemoryContext(photo)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-[#0D6E5C] hover:bg-emerald-100 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                            {photo.aiGenerated ? "Gemini Refreshed" : "Gemini Context"}
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(photo)}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#0F2922] text-white px-3.5 py-1.5 text-xs font-medium hover:bg-[#163b31] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <RollingActionLabel label="Open Story" />
                        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6 divide-y divide-slate-200">
              {visiblePhotos.map((photo, idx) => (
                <motion.div
                  key={photo.id}
                  layout
                  layoutId={`reminiscence-card-${photo.id}`}
                  onMouseEnter={() => setHoveredPhoto(photo)}
                  className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(photo)}
                    className="flex items-start sm:items-center gap-4 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <span className="font-mono-tabular text-xs font-medium text-slate-400 group-hover:text-[#0D6E5C] shrink-0">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-medium text-slate-900 group-hover:text-[#0D6E5C] transition-colors">
                        {photo.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {photo.era} · {photo.people}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={generatingId === photo.id}
                      onClick={() => void generateGeminiMemoryContext(photo)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:border-[#0D6E5C] cursor-pointer whitespace-nowrap"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
                      {generatingId === photo.id ? "Generating..." : "Gemini Context"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPhoto(photo)}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-900 text-white px-3.5 py-1.5 text-xs font-medium hover:bg-[#0D6E5C] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Inspect Print
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Skiper80 Shared-Layout Interactive Keepsake Detail Modal with Draggable Print */}
      <AnimatePresence>
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-label={selectedPhoto.title}
          >
            <motion.div
              layoutId={`reminiscence-card-${selectedPhoto.id}`}
              initial={prefersReducedMotion ? { opacity: 0 } : undefined}
              animate={prefersReducedMotion ? { opacity: 1 } : undefined}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 270, damping: 28 }}
              className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 sticky top-0 bg-white z-10">
                <div>
                  <p className="font-mono-tabular text-xs text-[#0D6E5C]">
                    {selectedPhoto.era} · {selectedPhoto.people}
                  </p>
                  <h3 className="text-xl font-medium text-slate-900">
                    {selectedPhoto.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  aria-label="Close keepsake view"
                  className="w-9 h-9 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Tactile Draggable Keepsake Photo Print */}
                <div className="md:col-span-6 space-y-2.5">
                  <motion.div
                    drag={!prefersReducedMotion}
                    dragSnapToOrigin
                    dragElastic={0.22}
                    whileDrag={{ scale: 1.03, rotate: 2, cursor: "grabbing" }}
                    className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3 shadow-md cursor-grab select-none"
                  >
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-200">
                      <img
                        src={selectedPhoto.imageSrc}
                        alt={selectedPhoto.title}
                        referrerPolicy="no-referrer"
                        draggable={false}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="mt-2.5 px-1 text-xs text-slate-600 font-medium">
                      {selectedPhoto.familyHint || selectedPhoto.era}
                    </p>
                  </motion.div>
                  <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <Move className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
                    Drag photo print gently to inspect · Releases smoothly back into frame
                  </p>
                </div>

                {/* Gemini Memory Support Context & Audio Story Controls */}
                <div className="md:col-span-6 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-[#0D6E5C] mb-1">
                      Visual Memory Description
                    </p>
                    <p className="text-sm text-slate-800 leading-relaxed">
                      {selectedPhoto.descriptiveCaption}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                    <p className="text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
                      Historical &amp; Sensory Context
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {selectedPhoto.historicalContext}
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <p className="text-xs font-semibold text-[#0F2922] mb-1">
                      Gentle Conversation Prompt
                    </p>
                    <p className="text-sm text-[#0F2922] italic leading-relaxed">
                      &ldquo;{selectedPhoto.memoryPrompt}&rdquo;
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={generatingId === selectedPhoto.id}
                      onClick={() =>
                        void generateGeminiMemoryContext(selectedPhoto)
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D6E5C] text-white px-4 py-2.5 text-xs font-medium hover:bg-[#095547] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {generatingId === selectedPhoto.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                          Generating Gemini Context...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                          Enrich Context with Gemini
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onReadSummaryAloud(
                          `Please warmly read this memory photo story for ${resident.name}: "${selectedPhoto.title}" from ${selectedPhoto.era}. ${selectedPhoto.descriptiveCaption} ${selectedPhoto.historicalContext} Then gently ask: ${selectedPhoto.memoryPrompt}`
                        );
                        setSelectedPhoto(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#0D6E5C]" aria-hidden="true" />
                      Read Memory Aloud
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onAddNote(
                          resident.id,
                          "Memory Reflection",
                          `Shared photo "${selectedPhoto.title}" (${selectedPhoto.era}). Prompt: "${selectedPhoto.memoryPrompt}"`
                        );
                        setSavedNoteId(selectedPhoto.id);
                        window.setTimeout(() => setSavedNoteId(null), 2400);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-[#0D6E5C] hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {savedNoteId === selectedPhoto.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          Saved to Notes
                        </>
                      ) : (
                        "Log to Care Notes"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
