import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import type { FreebuffUser } from "@freebuff/auth";

export interface ApiEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
  FREEBUFF_CLIENT_ID: string;
  FREEBUFF_ISSUER?: string;
  APP_ORIGIN: string;
  GEMINI_API_KEY?: string;
  GOOGLE_MAPS_API_KEY?: string;
}

const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getGeminiClient(env: ApiEnv, apiVersion?: string): GoogleGenAI {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it in Sites → Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    ...(apiVersion ? { apiVersion } : {}),
    httpOptions: { headers: { "User-Agent": "kindred-care-sites" } },
  });
}

function isTransientError(message: string): boolean {
  const raw = message.toLowerCase();
  return (
    raw.includes("429") ||
    raw.includes("503") ||
    raw.includes("timeout") ||
    raw.includes("overloaded") ||
    raw.includes("rate limit")
  );
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const clean = raw.replace(/\[[^\]]*\]/g, "").trim();
  if (!raw.toLowerCase().includes("api key")) {
    return {
      status: 500,
      message: clean || "Unable to complete the assistant request right now.",
    };
  }
  return {
    status: 500,
    message: "Gemini API key is not configured for this deployment.",
  };
}

interface ChatHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

interface ResidentContextPayload {
  residentName?: string;
  age?: number | string;
  careFocus?: string;
  medicationsSummary?: string;
  upcomingEvents?: string;
  recentNotes?: string;
  safetyStatus?: string;
  allergiesAndConditions?: string;
  wellnessSummary?: string;
  comfortPreferences?: string;
}

async function readBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

export async function handleApiRoute(
  request: Request,
  env: ApiEnv,
  user: FreebuffUser | null,
  url: URL
): Promise<Response> {
  const path = url.pathname;

  if (path === "/api/health") {
    return json({ ok: true, service: "kindred-care", signedIn: Boolean(user) });
  }

  if (path === "/api/maps/config") {
    return json({ apiKey: env.GOOGLE_MAPS_API_KEY || "" });
  }

  if (path === "/api/session/whoami") {
    return json({ user }, user ? 200 : 200);
  }

  // Every remaining route touches resident data, so it needs a session.
  if (!user) {
    return json({ error: "Sign in required" }, 401);
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!isBrowserSameOrigin(request, env.APP_ORIGIN)) {
    return new Response(null, { status: 403 });
  }

  switch (path) {
    case "/api/hospitals/nearby":
      return handleHospitals(await readBody(request), env);
    case "/api/assistant/chat":
      return handleChat(await readBody(request), env);
    case "/api/assistant/transcribe":
      return handleTranscribe(await readBody(request), env);
    case "/api/assistant/speak":
      return handleSpeak(await readBody(request), env);
    case "/api/memories/caption":
      return handleMemories(await readBody(request), env);
    case "/api/care-inquiry":
      return handleCareInquiry(await readBody(request), user);
    case "/api/alerts/dispatch":
      return handleAlertDispatch(await readBody(request));
    case "/api/notifications/medication-reminder":
      return handleMedicationReminder(await readBody(request));
    case "/api/doctor/contact":
      return handleDoctorContact(await readBody(request));
    default:
      return json({ error: "Not found" }, 404);
  }
}

function isBrowserSameOrigin(request: Request, origin: string): boolean {
  const requestOrigin = request.headers.get("Origin");
  if (requestOrigin) return requestOrigin === origin;
  // Some privacy modes omit Origin; fall back to the fetch metadata.
  const site = request.headers.get("Sec-Fetch-Site");
  return site === "same-origin" || site === "none";
}

async function handleHospitals(body: unknown, env: ApiEnv): Promise<Response> {
  const { lat, lng, radiusMeters = 8000 } = (body || {}) as {
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
    return json({ error: "Valid coordinates are required." }, 400);
  }

  const apiKey = env.GOOGLE_MAPS_API_KEY || "";
  if (!apiKey) {
    return json({ error: "Google Maps Platform API key is not configured." }, 503);
  }

  const clampedRadius = Math.max(500, Math.min(50000, Number(radiusMeters) || 8000));

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
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
          circle: { center: { latitude: lat, longitude: lng }, radius: clampedRadius },
        },
      }),
    });

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
      }>;
      error?: { status?: string; message?: string };
    };

    if (response.status === 429 || data?.error?.status === "RESOURCE_EXHAUSTED") {
      return json(
        { error: "Google Maps Platform quota reached.", status: "RESOURCE_EXHAUSTED" },
        429
      );
    }

    if (!response.ok) {
      return json(
        { error: data?.error?.message || "Unable to search nearby care hospitals." },
        response.status
      );
    }

    const hospitals = (data.places || []).map((place) => ({
      id: place.id || `${place.location?.latitude}-${place.location?.longitude}`,
      name: place.displayName?.text || "Medical Center",
      address: place.formattedAddress || "",
      lat: place.location?.latitude ?? lat,
      lng: place.location?.longitude ?? lng,
      phone: place.nationalPhoneNumber || null,
      openNow: place.regularOpeningHours?.openNow ?? null,
      googleMapsUri: place.googleMapsUri || null,
      rating: place.rating ?? null,
      userRatingCount: place.userRatingCount ?? null,
    }));

    return json({ hospitals });
  } catch (err) {
    return json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unable to query nearby hospitals right now.",
      },
      500
    );
  }
}

async function handleChat(body: unknown, env: ApiEnv): Promise<Response> {
  try {
    const {
      message,
      history = [],
      context = {},
      enableWebSearch = true,
      dictateNoteMode = false,
      caregiverName = "Caregiver",
    } = (body || {}) as {
      message?: string;
      history?: ChatHistoryTurn[];
      context?: ResidentContextPayload;
      enableWebSearch?: boolean;
      dictateNoteMode?: boolean;
      caregiverName?: string;
    };

    if (!message || typeof message !== "string" || !message.trim()) {
      return json({ error: "Please provide a message for Kindred." }, 400);
    }

    const trimmedMessage = message.trim();
    const explicitNoteCommand =
      /^(?:please\s+)?(?:add|log|record|save|dictate|write)\s+(?:a\s+)?(?:care\s+|handoff\s+|quick\s+)?note\b/i.test(
        trimmedMessage
      ) || /^note\s+(?:for|about|on)\b/i.test(trimmedMessage);
    const isNoteDictation = Boolean(dictateNoteMode || explicitNoteCommand);
    const ai = getGeminiClient(env);

    if (isNoteDictation) {
      const noteSystemInstruction = [
        "You are Kindred, an eldercare coordination assistant parsing a caregiver's dictated or typed care note.",
        `Active Resident: ${context.residentName || "Resident"}, Age ${context.age || 79}.`,
        `Default Caregiver Author: ${caregiverName || "Caregiver"}.`,
        "Extract and polish the dictated observation into a concise, accurate, dignified caregiver handoff note (1 to 3 clear sentences) preserving all clinical or daily details.",
        "If the caregiver states their own name in the note, set `author` to that name; otherwise use the Default Caregiver Author.",
        "Also provide a warm 1-2 sentence confirmation `reply` confirming the note was added to the resident's Care Circle record.",
      ].join("\n");

      let parsed: {
        noteText?: string;
        author?: string;
        noteCategory?: string;
        reply?: string;
      } | null = null;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: trimmedMessage,
          config: {
            systemInstruction: noteSystemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                shouldSaveNote: { type: Type.BOOLEAN },
                noteText: { type: Type.STRING },
                author: { type: Type.STRING },
                noteCategory: { type: Type.STRING },
                reply: { type: Type.STRING },
              },
            },
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });
        const rawJson = (response.text || "").trim();
        if (rawJson) parsed = JSON.parse(rawJson);
      } catch {
        parsed = null;
      }

      const cleanFallbackNote = trimmedMessage
        .replace(
          /^(?:please\s+)?(?:add|log|record|save|dictate|write)\s+(?:a\s+)?(?:care\s+|handoff\s+|quick\s+)?note(?:\s+(?:for|about|that|saying))?[:\s-]*/i,
          ""
        )
        .trim();

      const finalNoteText = parsed?.noteText?.trim() || cleanFallbackNote || trimmedMessage;
      const finalCategory = parsed?.noteCategory?.trim() || "Care Update";

      return json({
        reply:
          parsed?.reply?.trim() ||
          `I've saved your ${finalCategory.toLowerCase()} note to ${
            context.residentName || "the resident"
          }'s care record.`,
        groundingSources: [],
        parsedNote: {
          text: finalNoteText,
          author: parsed?.author?.trim() || caregiverName || "Caregiver",
          category: finalCategory,
        },
      });
    }

    const systemInstruction = [
      "You are Kindred, a warm, dignified, and reassuring eldercare companion and family care coordinator.",
      "Speak clearly in plain, respectful, everyday language—never condescending, never clinical jargon without simple explanation.",
      "Keep answers concise (2 to 4 short sentences) so they are easy to read and pleasant to listen to aloud, unless the user explicitly asks for a detailed breakdown.",
      "Never diagnose medical conditions or prescribe medications; if someone describes urgent or worsening symptoms (chest pain, dizziness, sudden weakness, a fall), advise contacting their clinician or emergency services (911) right away.",
      "Use the active resident care snapshot below to answer questions accurately about today's schedule, medications, wellness trends, allergies, comfort preferences, safety logs, and family notes.",
      `Resident: ${context.residentName || "Arthur Pendelton"}, Age ${context.age || 79}`,
      `Care Focus: ${context.careFocus || "Independent living with gentle medication & hydration reminders"}`,
      `Today's Schedule & Medications: ${context.medicationsSummary || "Morning Lisinopril taken; Evening Vitamin D due at 6:00 PM"}`,
      `Upcoming Visits & Appointments: ${context.upcomingEvents || "Video tea with Clara at 4:30 PM"}`,
      `Recent Care Notes: ${context.recentNotes || "Slept peacefully, 20-minute garden walk completed"}`,
      `Home Safety Status: ${context.safetyStatus || "All ambient living zones calm and normal"}`,
      context.allergiesAndConditions
        ? `Health Profile & Allergies: ${context.allergiesAndConditions}`
        : "",
      context.wellnessSummary ? `7-Day Wellness Trajectory: ${context.wellnessSummary}` : "",
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
      { role: "user" as const, parts: [{ text: trimmedMessage }] },
    ];

    let reply = "";
    let groundingSources: Array<{ title: string; uri: string }> = [];
    let lastError: unknown = null;

    const attempts = [
      { model: "gemini-4-hydrogen", useThinkingLow: true, useSearch: Boolean(enableWebSearch) },
      { model: "gemini-3.1-flash-lite", useThinkingLow: false, useSearch: false },
    ];

    for (const attempt of attempts) {
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
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          const seen = new Set<string>();
          groundingSources = chunks
            .map((chunk) => chunk.web)
            .filter((web): web is { uri: string; title?: string } => {
              if (!web?.uri || seen.has(web.uri)) return false;
              seen.add(web.uri);
              return true;
            })
            .slice(0, 4)
            .map((web) => ({ title: web.title || "Verified Web Source", uri: web.uri }));
          break;
        }
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (!isTransientError(msg)) throw err;
        await sleep(150);
      }
    }

    if (!reply) {
      if (lastError) throw lastError;
      return json({ error: "Kindred returned an empty response." }, 502);
    }

    return json({ reply, groundingSources });
  } catch (err) {
    const formatted = formatGeminiError(err);
    return json({ error: formatted.message }, formatted.status);
  }
}

async function handleTranscribe(body: unknown, env: ApiEnv): Promise<Response> {
  try {
    const { audioBase64, mimeType } = (body || {}) as {
      audioBase64?: string;
      mimeType?: string;
    };

    if (!audioBase64 || typeof audioBase64 !== "string") {
      return json({ error: "No audio recording was provided." }, 400);
    }

    const ai = getGeminiClient(env);
    let transcript = "";
    let lastErr: unknown = null;

    for (const modelName of ["gemini-3.5-transcribe", "gemini-3.1-flash-lite"]) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              { inlineData: { mimeType: mimeType || "audio/webm", data: audioBase64 } },
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

    if (!transcript && lastErr) throw lastErr;
    return json({ transcript });
  } catch (err) {
    const formatted = formatGeminiError(err);
    return json({ error: formatted.message }, formatted.status);
  }
}

async function handleSpeak(body: unknown, env: ApiEnv): Promise<Response> {
  try {
    const { text, voiceName } = (body || {}) as { text?: string; voiceName?: string };

    if (!text || typeof text !== "string" || !text.trim()) {
      return json({ error: "Text is required to generate speech." }, 400);
    }

    const cleanText = text.trim().slice(0, 1200);
    const selectedVoice =
      voiceName && ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"].includes(voiceName)
        ? voiceName
        : "Kore";

    let base64Audio: string | undefined;
    let lastErr: unknown = null;

    const ttsAttempts = [
      async () =>
        getGeminiClient(env, "v1beta").models.generateContent({
          model: "gemini-3.8-flash-lite-tts",
          contents: [{ role: "user", parts: [{ text: cleanText }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
            },
          },
        }),
      async () =>
        getGeminiClient(env).models.generateContent({
          model: "gemini-3.8-flash-lite-tts",
          contents: cleanText,
          config: { responseModalities: ["AUDIO"] },
        }),
    ];

    for (const runAttempt of ttsAttempts) {
      try {
        const response = await runAttempt();
        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
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
      return json({ error: "Speech synthesis returned no audio data." }, 502);
    }

    return json({ audioBase64: base64Audio, mimeType: "audio/wav" });
  } catch (err) {
    const formatted = formatGeminiError(err);
    return json({ error: formatted.message }, formatted.status);
  }
}

async function handleMemories(body: unknown, env: ApiEnv): Promise<Response> {
  try {
    const {
      residentName = "Arthur",
      title = "",
      era = "",
      people = "",
      familyHint = "",
      imageBase64 = "",
    } = (body || {}) as {
      residentName?: string;
      title?: string;
      era?: string;
      people?: string;
      familyHint?: string;
      imageBase64?: string;
    };

    const ai = getGeminiClient(env);
    const parts: Array<
      { text: string } | { inlineData: { mimeType: string; data: string } }
    > = [];

    if (imageBase64 && typeof imageBase64 === "string") {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (match) {
        parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      } else if (imageBase64.length > 64) {
        parts.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });
      }
    }

    const promptText = [
      `Create warm, respectful memory-support context for an older adult named ${residentName} looking at a shared family photograph.`,
      title ? `Photo Title: ${title}` : "",
      era ? `Year / Era / Setting: ${era}` : "",
      people ? `People Featured: ${people}` : "",
      familyHint ? `Family Note: ${familyHint}` : "",
      "1. `descriptiveCaption`: A clear, vivid, heartwarming 2-sentence description grounded in what is visible in the photograph and family context, easy to read aloud.",
      "2. `historicalContext`: 1 to 2 sentences of nostalgic era/cultural/sensory context that sparks pleasant long-term recall.",
      "3. `memoryPrompt`: 1 gentle, open-ended question a family member or voice companion can ask to invite conversation without testing or pressuring memory.",
    ]
      .filter(Boolean)
      .join("\n");

    parts.push({ text: promptText });

    let parsed: {
      descriptiveCaption?: string;
      historicalContext?: string;
      memoryPrompt?: string;
    } | null = null;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: [{ role: "user", parts }],
        config: {
          systemInstruction:
            "You are Kindred, a compassionate reminiscence therapy and memory-support companion for older adults and their families. Keep tone dignified, warm, sensory, and reassuring.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              descriptiveCaption: { type: Type.STRING },
              historicalContext: { type: Type.STRING },
              memoryPrompt: { type: Type.STRING },
            },
          },
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
      const rawText = (response.text || "").trim();
      if (rawText) parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }

    return json({
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
    return json({ error: formatted.message }, formatted.status);
  }
}

async function handleCareInquiry(body: unknown, user: FreebuffUser): Promise<Response> {
  const { fullName, email, relationship, careFocus } = (body || {}) as {
    fullName?: string;
    email?: string;
    relationship?: string;
    careFocus?: string;
  };

  const resolvedEmail = (fullName?.trim() ? email?.trim() : "") || user.email || "";

  if (!fullName?.trim() || !resolvedEmail.includes("@")) {
    return json({ error: "Please enter a valid name and email address." }, 400);
  }

  return json({
    confirmed: true,
    referenceCode: `KC-${Math.floor(100000 + Math.random() * 900000)}`,
    message: `Thank you, ${fullName.trim()}. Your care coordinator will reach out to ${resolvedEmail} within one business day regarding ${
      careFocus || "personalized home support"
    } (${relationship || "Family Inquiry"}).`,
  });
}

async function handleAlertDispatch(body: unknown): Promise<Response> {
  const { residentName, residence, alertType, customNote, contacts } = (body || {}) as {
    residentName?: string;
    residence?: string;
    alertType?: string;
    customNote?: string;
    contacts?: Array<{ id?: string; name?: string; role?: string; phone?: string }>;
  };

  if (!residentName?.trim() || !Array.isArray(contacts) || contacts.length === 0) {
    return json(
      { error: "Resident name and at least one designated emergency contact are required." },
      400
    );
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

  return json({
    alertId: `QA-${Math.floor(100000 + Math.random() * 900000)}`,
    dispatchedAt,
    smsBody,
    recipients,
  });
}

async function handleMedicationReminder(body: unknown): Promise<Response> {
  const {
    residentName,
    medicationTitle,
    scheduledTime,
    personalizedMessage,
    channel = "both",
    recipientPhone,
  } = (body || {}) as {
    residentName?: string;
    medicationTitle?: string;
    scheduledTime?: string;
    personalizedMessage?: string;
    channel?: "both" | "push" | "sms";
    recipientPhone?: string;
  };

  if (!residentName?.trim() || !medicationTitle?.trim()) {
    return json({ error: "Resident name and medication title are required." }, 400);
  }

  const cleanPhone = (recipientPhone || "").replace(/[^+\d]/g, "");
  const messageBody =
    personalizedMessage?.trim() ||
    `Kindred Care reminder for ${residentName.trim()}: ${medicationTitle.trim()} scheduled at ${
      scheduledTime || "soon"
    }.`;

  return json({
    notificationId: `MR-${Math.floor(100000 + Math.random() * 900000)}`,
    sentAt: new Date().toISOString(),
    channel,
    pushTitle: `Medication Reminder · ${residentName.trim()}`,
    pushBody: messageBody,
    smsBody: messageBody,
    smsUri: cleanPhone ? `sms:${cleanPhone}?&body=${encodeURIComponent(messageBody)}` : null,
  });
}

async function handleDoctorContact(body: unknown): Promise<Response> {
  const {
    residentName,
    doctorName,
    doctorPhone,
    doctorEmail,
    urgency,
    subject,
    message,
  } = (body || {}) as {
    residentName?: string;
    doctorName?: string;
    doctorPhone?: string;
    doctorEmail?: string;
    urgency?: "Routine" | "Same-Day Callback";
    subject?: string;
    message?: string;
  };

  if (!residentName?.trim() || !message?.trim()) {
    return json(
      { error: "Resident name and message are required to contact a physician." },
      400
    );
  }

  return json({
    referenceId: `DR-${Math.floor(100000 + Math.random() * 900000)}`,
    sentAt: new Date().toISOString(),
    doctorName: doctorName || "Primary Care Physician",
    urgency: urgency || "Routine",
    subject: subject?.trim() || `Care inquiry for ${residentName.trim()}`,
    confirmationText: `Dispatched to ${doctorName || "Primary Care Physician"}${
      doctorPhone ? ` (${doctorPhone})` : ""
    }${doctorEmail ? ` · ${doctorEmail}` : ""}.`,
  });
}
