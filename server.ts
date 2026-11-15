import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";

function getGeminiClient(apiVersion?: string): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please verify it in Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    ...(apiVersion ? { apiVersion } : {}),
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

interface ChatHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

interface ResidentContextPayload {
  residentName?: string;
  age?: number;
  careFocus?: string;
  medicationsSummary?: string;
  upcomingEvents?: string;
  recentNotes?: string;
  safetyStatus?: string;
  allergiesAndConditions?: string;
  comfortPreferences?: string;
  wellnessSummary?: string;
}

function extractReadableMessage(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    if (parsed?.error?.message) {
      return parsed.error.message;
    }
  } catch {
    // not raw JSON
  }
  return raw;
}

function isTransientError(raw: string): boolean {
  return (
    raw.includes("503") ||
    raw.includes("UNAVAILABLE") ||
    raw.includes("high demand") ||
    raw.includes("429") ||
    raw.includes("RESOURCE_EXHAUSTED") ||
    raw.includes("500") ||
    raw.includes("INTERNAL")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const clean = extractReadableMessage(raw);

  if (raw.includes("GEMINI_API_KEY")) {
    return { status: 500, message: clean };
  }
  if (
    raw.includes("403") ||
    raw.includes("PERMISSION_DENIED") ||
    raw.includes("API_KEY_INVALID")
  ) {
    return {
      status: 403,
      message:
        "Gemini API access could not be verified. Please check your API key in Settings > Secrets.",
    };
  }
  if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      message:
        "Voice companion is momentarily busy. Please wait a few seconds and try again.",
    };
  }
  if (raw.includes("503") || raw.includes("UNAVAILABLE")) {
    return {
      status: 503,
      message:
        "Gemini is experiencing temporary high demand right now. Please try your message again in a moment.",
    };
  }
  return {
    status: 500,
    message: clean || "Unable to complete the assistant request right now.",
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "kindred-care" });
  });

  app.get("/api/maps/config", (_req, res) => {
    const apiKey =
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      "";
    res.json({ apiKey });
  });

  app.post("/api/hospitals/nearby", async (req, res) => {
    try {
      const { lat, lng, radiusMeters = 8000 } = req.body as {
        lat?: number;
        lng?: number;
        radiusMeters?: number;
      };

      if (
        typeof lat !== "number" ||
        typeof lng !== "number" ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        res.status(400).json({ error: "Valid coordinates are required." });
        return;
      }

      const apiKey =
        process.env.GOOGLE_MAPS_API_KEY ||
        process.env.VITE_GOOGLE_MAPS_API_KEY ||
        "";

      if (!apiKey) {
        res.status(503).json({
          error: "Google Maps Platform API key is not configured.",
        });
        return;
      }

      const clampedRadius = Math.max(500, Math.min(50000, Number(radiusMeters) || 8000));

      const response = await fetch(
        "https://places.googleapis.com/v1/places:searchNearby",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.regularOpeningHours,places.googleMapsUri,places.rating,places.userRatingCount,places.businessStatus",
            "X-Goog-Maps-Solution-ID": "gmp_mcp_codeassist_v1_aistudio",
          },
          body: JSON.stringify({
            includedPrimaryTypes: ["hospital"],
            maxResultCount: 8,
            rankPreference: "DISTANCE",
            locationRestriction: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: clampedRadius,
              },
            },
          }),
        }
      );

      const data = (await response.json()) as {
        places?: Array<{
          id?: string;
          displayName?: { text?: string };
          formattedAddress?: string;
          location?: { latitude?: number; longitude?: number };
          nationalPhoneNumber?: string;
          regularOpeningHours?: { openNow?: boolean };
          googleMapsUri?: string;
          rating?: number;
          userRatingCount?: number;
          businessStatus?: string;
        }>;
        error?: { code?: number; status?: string; message?: string };
      };

      if (
        response.status === 429 ||
        data?.error?.status === "RESOURCE_EXHAUSTED"
      ) {
        res.status(429).json({
          error: "Google Maps Platform quota reached.",
          status: "RESOURCE_EXHAUSTED",
        });
        return;
      }

      if (!response.ok) {
        res.status(response.status).json({
          error:
            data?.error?.message || "Unable to search nearby care hospitals.",
        });
        return;
      }

      const hospitals = (data.places || []).map((p) => ({
        id: p.id || `${p.location?.latitude}-${p.location?.longitude}`,
        name: p.displayName?.text || "Medical Center",
        address: p.formattedAddress || "",
        lat: p.location?.latitude ?? lat,
        lng: p.location?.longitude ?? lng,
        phone: p.nationalPhoneNumber || null,
        openNow: p.regularOpeningHours?.openNow ?? null,
        googleMapsUri: p.googleMapsUri || null,
        rating: p.rating ?? null,
        userRatingCount: p.userRatingCount ?? null,
      }));

      res.json({ hospitals });
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : "Unable to query nearby hospitals right now.",
      });
    }
  });

  app.post("/api/assistant/chat", async (req, res) => {
    try {
      const {
        message,
        history = [],
        context = {},
        enableWebSearch = true,
        dictateNoteMode = false,
        caregiverName = "Caregiver",
      } = req.body as {
        message?: string;
        history?: ChatHistoryTurn[];
        context?: ResidentContextPayload;
        enableWebSearch?: boolean;
        dictateNoteMode?: boolean;
        caregiverName?: string;
      };

      if (!message || typeof message !== "string" || !message.trim()) {
        res.status(400).json({ error: "Please provide a message for Kindred." });
        return;
      }

      const trimmedMessage = message.trim();
      const explicitNoteCommand =
        /^(?:please\s+)?(?:add|log|record|save|dictate|write)\s+(?:a\s+)?(?:care\s+|handoff\s+|quick\s+)?note\b/i.test(
          trimmedMessage
        ) || /^note\s+(?:for|about|on)\b/i.test(trimmedMessage);
      const isNoteDictation = Boolean(dictateNoteMode || explicitNoteCommand);

      const ai = getGeminiClient();

      if (isNoteDictation) {
        const noteSystemInstruction = [
          "You are Kindred, an eldercare coordination assistant parsing a caregiver's dictated or typed care note.",
          `Active Resident: ${context.residentName || "Resident"}, Age ${context.age || 79}.`,
          `Default Caregiver Author: ${caregiverName || "Caregiver"}.`,
          "Extract and polish the dictated observation into a concise, accurate, dignified caregiver handoff note (1 to 3 clear sentences) preserving all clinical or daily details (meals, mood, mobility, vitals, medication taken, sleep).",
          "If the caregiver states their own name in the note (e.g., 'This is Marcus...'), set `author` to that name; otherwise use the Default Caregiver Author.",
          "Also provide a warm 1-2 sentence confirmation `reply` confirming the note was added to the resident's Care Circle record.",
        ].join("\n");

        const noteAttempts = [
          { model: "gemini-4-hydrogen", useThinkingLow: true, delayMs: 0 },
          { model: "gemini-3.1-flash-lite", useThinkingLow: false, delayMs: 150 },
        ];

        interface ParsedDictatedNote {
          shouldSaveNote?: boolean;
          noteText?: string;
          author?: string;
          noteCategory?: string;
          reply?: string;
        }
        let parsedResult: ParsedDictatedNote | null = null;
        let lastNoteErr: unknown = null;

        for (const attempt of noteAttempts) {
          if (attempt.delayMs > 0) await sleep(attempt.delayMs);
          try {
            const response = await ai.models.generateContent({
              model: attempt.model,
              contents: trimmedMessage,
              config: {
                systemInstruction: noteSystemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    shouldSaveNote: {
                      type: Type.BOOLEAN,
                      description: "True if the text contains a care observation or update to log.",
                    },
                    noteText: {
                      type: Type.STRING,
                      description: "Cleanly formatted caregiver handoff note text.",
                    },
                    author: {
                      type: Type.STRING,
                      description: "Name of the caregiver logging the note.",
                    },
                    noteCategory: {
                      type: Type.STRING,
                      description: "Category such as Medication, Nutrition, Mobility, Wellness, or General.",
                    },
                    reply: {
                      type: Type.STRING,
                      description: "Warm spoken confirmation confirming the note was saved.",
                    },
                  },
                },
                ...(attempt.useThinkingLow
                  ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                  : {}),
              },
            });
            const rawJson = (response.text || "").trim();
            if (rawJson) {
              const candidate = JSON.parse(rawJson) as ParsedDictatedNote;
              parsedResult = candidate;
              if (candidate?.noteText) break;
            }
          } catch (err) {
            lastNoteErr = err;
            const msg = err instanceof Error ? err.message : String(err);
            if (!isTransientError(msg)) {
              break;
            }
          }
        }

        const cleanFallbackNote = trimmedMessage
          .replace(
            /^(?:please\s+)?(?:add|log|record|save|dictate|write)\s+(?:a\s+)?(?:care\s+|handoff\s+|quick\s+)?note(?:\s+(?:for|about|that|saying))?[:\s-]*/i,
            ""
          )
          .trim();

        const finalNoteText =
          parsedResult?.noteText?.trim() || cleanFallbackNote || trimmedMessage;
        const finalAuthor =
          parsedResult?.author?.trim() || caregiverName || "Caregiver";
        const finalCategory = parsedResult?.noteCategory?.trim() || "Care Update";
        const finalReply =
          parsedResult?.reply?.trim() ||
          `I've saved your ${finalCategory.toLowerCase()} note to ${
            context.residentName || "the resident"
          }'s care record.`;

        if (!finalNoteText && lastNoteErr) {
          throw lastNoteErr;
        }

        res.json({
          reply: finalReply,
          groundingSources: [],
          parsedNote: {
            text: finalNoteText,
            author: finalAuthor,
            category: finalCategory,
          },
        });
        return;
      }

      const systemInstruction = [
        "You are Kindred, a warm, dignified, and reassuring eldercare companion and family care coordinator.",
        "Speak clearly in plain, respectful, everyday language—never condescending, never clinical jargon without simple explanation.",
        "Keep answers concise (2 to 4 short sentences) so they are easy to read and pleasant to listen to aloud, unless the user explicitly asks for a detailed breakdown.",
        "Never diagnose medical conditions or prescribe medications; if someone describes urgent or worsening symptoms (chest pain, dizziness, sudden weakness, a fall), advise contacting their clinician or emergency services (911) right away.",
        "Use the active resident care snapshot below to answer questions accurately about today's schedule, medications, wellness trends, allergies, comfort preferences, safety logs, and family notes. When answering general eldercare, medication guidance, nutrition, or seasonal wellness questions, you may also verify current facts with Google Search.",
        `Resident: ${context.residentName || "Arthur Pendelton"}, Age ${context.age || 79}`,
        `Care Focus: ${context.careFocus || "Independent living with gentle medication & hydration reminders"}`,
        `Today's Schedule & Medications: ${context.medicationsSummary || "Morning Lisinopril taken; Evening Vitamin D due at 6:00 PM"}`,
        `Upcoming Visits & Appointments: ${context.upcomingEvents || "Video tea with Clara at 4:30 PM"}`,
        `Recent Care Notes: ${context.recentNotes || "Slept peacefully, 20-minute garden walk completed"}`,
        `Home Safety Status: ${context.safetyStatus || "All ambient living zones calm and normal"}`,
        context.allergiesAndConditions
          ? `Health Profile & Allergies: ${context.allergiesAndConditions}`
          : "",
        context.wellnessSummary
          ? `7-Day Wellness Trajectory: ${context.wellnessSummary}`
          : "",
        context.comfortPreferences
          ? `Comfort & Conversation Preferences: ${context.comfortPreferences}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      const conversationContents = [
        ...history.slice(-8).map((turn) => ({
          role: turn.role === "assistant" ? ("model" as const) : ("user" as const),
          parts: [{ text: turn.content }],
        })),
        {
          role: "user" as const,
          parts: [{ text: trimmedMessage }],
        },
      ];

      let reply = "";
      let groundingSources: Array<{ title: string; uri: string }> = [];
      let lastError: unknown = null;

      // Primary: gemini-4-hydrogen with ThinkingLevel.LOW and optional Google Search grounding; fallback: gemini-3.1-flash-lite
      const attempts: Array<{
        model: string;
        useThinkingLow: boolean;
        useSearch: boolean;
        delayMs: number;
      }> = [
        {
          model: "gemini-4-hydrogen",
          useThinkingLow: true,
          useSearch: Boolean(enableWebSearch),
          delayMs: 0,
        },
        {
          model: "gemini-3.1-flash-lite",
          useThinkingLow: false,
          useSearch: false,
          delayMs: 150,
        },
      ];

      for (const attempt of attempts) {
        if (attempt.delayMs > 0) {
          await sleep(attempt.delayMs);
        }
        try {
          const response = await ai.models.generateContent({
            model: attempt.model,
            contents: conversationContents,
            config: {
              systemInstruction,
              ...(attempt.useSearch ? { tools: [{ googleSearch: {} }] } : {}),
              ...(attempt.useThinkingLow
                ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                : {}),
            },
          });
          const text = (response.text || "").trim();
          if (text) {
            reply = text;
            const chunks =
              response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            const seenUris = new Set<string>();
            groundingSources = chunks
              .map((c) => c.web)
              .filter(
                (w): w is { uri: string; title?: string } =>
                  Boolean(w?.uri && !seenUris.has(w.uri) && seenUris.add(w.uri))
              )
              .slice(0, 4)
              .map((w) => ({
                title: w.title || "Verified Web Source",
                uri: w.uri,
              }));
            break;
          }
        } catch (err) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          if (!isTransientError(msg)) {
            throw err;
          }
        }
      }

      if (!reply) {
        if (lastError) throw lastError;
        res.status(502).json({ error: "Kindred returned an empty response." });
        return;
      }

      res.json({ reply, groundingSources });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post("/api/assistant/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body as {
        audioBase64?: string;
        mimeType?: string;
      };

      if (!audioBase64 || typeof audioBase64 !== "string") {
        res.status(400).json({ error: "No audio recording was provided." });
        return;
      }

      const ai = getGeminiClient();
      const modelsToTry = ["gemini-3.5-transcribe", "gemini-3.1-flash-lite"];
      let transcript = "";
      let lastErr: unknown = null;

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || "audio/webm",
                    data: audioBase64,
                  },
                },
                {
                  text: "Transcribe the spoken words accurately in English. Return only the clean transcript text without commentary.",
                },
              ],
            },
          });
          transcript = (response.text || "").trim();
          if (transcript) break;
        } catch (err) {
          lastErr = err;
        }
      }

      if (!transcript && lastErr) {
        throw lastErr;
      }

      res.json({ transcript });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post("/api/assistant/speak", async (req, res) => {
    try {
      const { text, voiceName } = req.body as {
        text?: string;
        voiceName?: string;
      };

      if (!text || typeof text !== "string" || !text.trim()) {
        res.status(400).json({ error: "Text is required to generate speech." });
        return;
      }

      const cleanText = text.trim().slice(0, 1200);
      const selectedVoice =
        voiceName && ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"].includes(voiceName)
          ? voiceName
          : "Kore";

      let base64Audio: string | undefined;
      let lastErr: unknown = null;

      // Try v1beta standard speechConfig, then v1alpha speechMetadata, then plain AUDIO modality
      const ttsAttempts = [
        async () => {
          const ai = getGeminiClient("v1beta");
          return ai.models.generateContent({
            model: "gemini-3.8-flash-lite-tts",
            contents: [
              {
                role: "user",
                parts: [{ text: cleanText }],
              },
            ],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: selectedVoice },
                },
              },
            },
          });
        },
        async () => {
          const ai = getGeminiClient("v1alpha");
          return ai.models.generateContent({
            model: "gemini-3.8-flash-lite-tts",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: cleanText,
                    speechMetadata: {
                      style: "Warm, patient, calm, and articulate eldercare companion",
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: selectedVoice },
                },
              },
            },
          });
        },
        async () => {
          const ai = getGeminiClient();
          return ai.models.generateContent({
            model: "gemini-3.8-flash-lite-tts",
            contents: cleanText,
            config: {
              responseModalities: ["AUDIO"],
            },
          });
        },
      ];

      for (const runAttempt of ttsAttempts) {
        try {
          const response = await runAttempt();
          const data =
            response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (data) {
            base64Audio = data;
            break;
          }
        } catch (err) {
          lastErr = err;
        }
      }

      if (!base64Audio) {
        if (lastErr) throw lastErr;
        res.status(502).json({ error: "Speech synthesis returned no audio data." });
        return;
      }

      res.json({
        audioBase64: base64Audio,
        mimeType: "audio/wav",
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post("/api/care-inquiry", (req, res) => {
    const { fullName, email, relationship, careFocus } = req.body as {
      fullName?: string;
      email?: string;
      relationship?: string;
      careFocus?: string;
    };

    if (!fullName?.trim() || !email?.trim() || !email.includes("@")) {
      res.status(400).json({
        error: "Please enter a valid name and email address.",
      });
      return;
    }

    const referenceCode = `KC-${Math.floor(100000 + Math.random() * 900000)}`;
    res.json({
      confirmed: true,
      referenceCode,
      message: `Thank you, ${fullName.trim()}. Your care coordinator will reach out to ${email.trim()} within one business day regarding ${
        careFocus || "personalized home support"
      } (${relationship || "Family Inquiry"}).`,
    });
  });

  app.post("/api/alerts/dispatch", (req, res) => {
    const { residentName, residence, alertType, customNote, contacts } =
      req.body as {
        residentName?: string;
        residence?: string;
        alertType?: string;
        customNote?: string;
        contacts?: Array<{
          id?: string;
          name?: string;
          role?: string;
          phone?: string;
        }>;
      };

    if (!residentName?.trim() || !Array.isArray(contacts) || contacts.length === 0) {
      res.status(400).json({
        error: "Resident name and at least one designated emergency contact are required.",
      });
      return;
    }

    const dispatchedAt = new Date().toISOString();
    const smsBody = [
      `Kindred Care Quick Alert for ${residentName.trim()}`,
      alertType ? `Reason: ${alertType}` : "Reason: Urgent Check-In",
      residence ? `Location: ${residence}` : "",
      customNote?.trim() ? `Note: ${customNote.trim()}` : "",
      "Please check Care Circle or call right away.",
    ]
      .filter(Boolean)
      .join(" | ");

    const recipients = contacts.slice(0, 15).map((contact) => ({
      id: contact.id || contact.name || "contact",
      name: contact.name || "Emergency Contact",
      role: contact.role || "Care Circle Member",
      phone: contact.phone || "",
      channel: contact.phone ? "SMS + Push Notification" : "Care Circle Alert",
      deliveryStatus: "Dispatched",
      smsUri: contact.phone
        ? `sms:${contact.phone.replace(/[^+\d]/g, "")}?&body=${encodeURIComponent(smsBody)}`
        : null,
      dispatchedAt,
    }));

    res.json({
      alertId: `QA-${Math.floor(100000 + Math.random() * 900000)}`,
      dispatchedAt,
      smsBody,
      recipients,
    });
  });

  app.post("/api/notifications/medication-reminder", (req, res) => {
    const {
      residentName,
      medicationTitle,
      scheduledTime,
      personalizedMessage,
      channel = "both",
      recipientPhone,
    } = req.body as {
      residentId?: string;
      residentName?: string;
      taskId?: string;
      medicationTitle?: string;
      scheduledTime?: string;
      personalizedMessage?: string;
      channel?: "both" | "push" | "sms";
      recipientPhone?: string;
    };

    if (!residentName?.trim() || !medicationTitle?.trim()) {
      res.status(400).json({
        error: "Resident name and medication title are required.",
      });
      return;
    }

    const cleanPhone = (recipientPhone || "").replace(/[^+\d]/g, "");
    const messageBody =
      personalizedMessage?.trim() ||
      `Kindred Care reminder for ${residentName.trim()}: ${medicationTitle.trim()} scheduled at ${
        scheduledTime || "soon"
      }.`;

    res.json({
      notificationId: `MR-${Math.floor(100000 + Math.random() * 900000)}`,
      sentAt: new Date().toISOString(),
      channel,
      pushTitle: `Medication Reminder · ${residentName.trim()}`,
      pushBody: messageBody,
      smsBody: messageBody,
      smsUri: cleanPhone
        ? `sms:${cleanPhone}?&body=${encodeURIComponent(messageBody)}`
        : null,
    });
  });

  app.post("/api/doctor/contact", (req, res) => {
    const {
      residentName,
      doctorName,
      doctorPhone,
      doctorEmail,
      urgency,
      subject,
      message,
    } = req.body as {
      residentName?: string;
      doctorName?: string;
      doctorPhone?: string;
      doctorEmail?: string;
      urgency?: "Routine" | "Same-Day Callback";
      subject?: string;
      message?: string;
    };

    if (!residentName?.trim() || !message?.trim()) {
      res.status(400).json({
        error: "Resident name and message are required to contact a physician.",
      });
      return;
    }

    const referenceId = `DR-${Math.floor(100000 + Math.random() * 900000)}`;
    res.json({
      referenceId,
      sentAt: new Date().toISOString(),
      doctorName: doctorName || "Primary Care Physician",
      urgency: urgency || "Routine",
      subject: subject?.trim() || `Care inquiry for ${residentName.trim()}`,
      confirmationText: `Dispatched to ${doctorName || "Primary Care Physician"}${
        doctorPhone ? ` (${doctorPhone})` : ""
      }${doctorEmail ? ` · ${doctorEmail}` : ""}.`,
    });
  });

  app.post("/api/memories/caption", async (req, res) => {
    try {
      const {
        residentName = "Arthur",
        title = "",
        era = "",
        people = "",
        familyHint = "",
        imageBase64 = "",
        imageUrl = "",
      } = req.body as {
        residentName?: string;
        title?: string;
        era?: string;
        people?: string;
        familyHint?: string;
        imageBase64?: string;
        imageUrl?: string;
      };

      const ai = getGeminiClient();
      const parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      > = [];

      // Attach visual photo bytes if uploaded via DataURL/base64 or served from verified local assets
      if (imageBase64 && typeof imageBase64 === "string") {
        const match = imageBase64.match(
          /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
        );
        if (match) {
          parts.push({
            inlineData: { mimeType: match[1], data: match[2] },
          });
        } else if (imageBase64.length > 64) {
          parts.push({
            inlineData: { mimeType: "image/jpeg", data: imageBase64 },
          });
        }
      } else if (
        imageUrl &&
        typeof imageUrl === "string" &&
        imageUrl.startsWith("/src/assets/images/")
      ) {
        const fs = await import("node:fs/promises");
        const safeBase = path.resolve(__dirname, "src/assets/images");
        const candidate = path.resolve(__dirname, imageUrl.replace(/^\/+/, ""));
        if (candidate.startsWith(safeBase + path.sep)) {
          try {
            const bytes = await fs.readFile(candidate);
            parts.push({
              inlineData: {
                mimeType: "image/jpeg",
                data: bytes.toString("base64"),
              },
            });
          } catch {
            // Fall back to metadata-guided prompt if file unreadable
          }
        }
      }

      const promptText = [
        `Create warm, respectful memory-support context for an older adult named ${residentName} looking at a shared family photograph.`,
        title ? `Photo Title: ${title}` : "",
        era ? `Year / Era / Setting: ${era}` : "",
        people ? `People Featured: ${people}` : "",
        familyHint ? `Family Note: ${familyHint}` : "",
        "1. `descriptiveCaption`: A clear, vivid, heartwarming 2-sentence description grounded in what is visible in the photograph and family context, easy to read aloud.",
        "2. `historicalContext`: 1 to 2 sentences of nostalgic era/cultural/sensory context (seasons, film warmth, neighborhood traditions, music or nature of that era) that sparks pleasant long-term recall.",
        "3. `memoryPrompt`: 1 gentle, open-ended question a family member or voice companion can ask to invite conversation without testing or pressuring memory.",
      ]
        .filter(Boolean)
        .join("\n");

      parts.push({ text: promptText });

      interface MemoryCaptionJson {
        descriptiveCaption?: string;
        historicalContext?: string;
        memoryPrompt?: string;
      }

      const attempts = [
        { model: "gemini-4-hydrogen", useThinkingLow: true, delayMs: 0 },
        { model: "gemini-3.1-flash-lite", useThinkingLow: false, delayMs: 150 },
      ];

      let parsed: MemoryCaptionJson | null = null;
      let lastErr: unknown = null;

      for (const attempt of attempts) {
        if (attempt.delayMs > 0) await sleep(attempt.delayMs);
        try {
          const response = await ai.models.generateContent({
            model: attempt.model,
            contents: [{ role: "user", parts }],
            config: {
              systemInstruction:
                "You are Kindred, a compassionate reminiscence therapy and memory-support companion for older adults and their families. Keep tone dignified, warm, sensory, and reassuring.",
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  descriptiveCaption: {
                    type: Type.STRING,
                    description:
                      "Warm 2-sentence visual description grounded in the photo.",
                  },
                  historicalContext: {
                    type: Type.STRING,
                    description:
                      "Nostalgic era or sensory context assisting long-term recall.",
                  },
                  memoryPrompt: {
                    type: Type.STRING,
                    description:
                      "Gentle open-ended question to spark conversation together.",
                  },
                },
              },
              ...(attempt.useThinkingLow
                ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                : {}),
            },
          });

          const rawText = (response.text || "").trim();
          if (rawText) {
            const candidate = JSON.parse(rawText) as MemoryCaptionJson;
            if (candidate.descriptiveCaption) {
              parsed = candidate;
              break;
            }
          }
        } catch (err) {
          lastErr = err;
          const msg = err instanceof Error ? err.message : String(err);
          if (!isTransientError(msg)) break;
        }
      }

      if (!parsed && lastErr) {
        const formatted = formatGeminiError(lastErr);
        res.status(formatted.status).json({ error: formatted.message });
        return;
      }

      res.json({
        descriptiveCaption:
          parsed?.descriptiveCaption ||
          `A cherished family moment${title ? ` titled "${title}"` : ""}${
            people ? ` featuring ${people}` : ""
          }.`,
        historicalContext:
          parsed?.historicalContext ||
          `Captured during ${
            era || "a memorable family season"
          }, preserving everyday warmth and familiar surroundings.`,
        memoryPrompt:
          parsed?.memoryPrompt ||
          "What favorite detail or sound from that day comes back to mind first?",
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Kindred Care server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Kindred Care server:", err);
  process.exit(1);
});
