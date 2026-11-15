import { useCallback } from "react";
import { useFreebuffUser } from "@freebuff/auth/react";

/**
 * Real Sign in with Freebuff.
 *
 * The session lives in the `__Host-freebuff_session` cookie, issued by the
 * site's own server through `/auth/freebuff/*` (OIDC + PKCE, no secrets in
 * this project). The browser never sees tokens and nothing is stored in
 * localStorage. `wrap` in `worker/index.ts` serves those routes; the Express
 * dev server mounts the same handler in `server.ts`.
 */
export interface FreebuffUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  provider: "freebuff";
}

export interface FreebuffSignInInput {
  email?: string;
  name?: string;
}

/** The published Freebuff Sites origin where the OAuth callback is registered. */
export const PUBLISHED_SITE_URL =
  "https://site-f5d231c483354fe0b0e0b0bc37991057.freebuff.page";

let authProbe: Promise<boolean> | undefined;

/**
 * `/auth/freebuff/session` only exists where the Worker (or a server mounting
 * the same handler) serves the site. Elsewhere — for example the AI Studio
 * preview origin — sign-in cannot complete, so the UI points at the published
 * deployment instead of navigating to a dead route.
 */
export function freebuffAuthAvailable(): Promise<boolean> {
  authProbe ??= fetch("/auth/freebuff/session", {
    headers: { Accept: "application/json" },
  })
    .then((response) => {
      if (!response.ok) return false;
      const type = response.headers.get("content-type") || "";
      return type.includes("application/json");
    })
    .catch(() => false);
  return authProbe;
}

const SIGN_IN_PATH = "/auth/freebuff/signin";
const SIGN_OUT_PATH = "/auth/freebuff/signout";

export function deriveDisplayName(email: string): string {
  const local = (email.split("@")[0] || "").replace(/[0-9._-]+/g, " ").trim();
  if (!local) return "New Member";
  return local
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function freebuffSignInUrl(returnTo?: string): string {
  const target =
    returnTo ||
    (typeof window === "undefined"
      ? "/"
      : `${window.location.pathname}${window.location.search}`);
  return `${SIGN_IN_PATH}?returnTo=${encodeURIComponent(target)}`;
}

/** Starts the OAuth redirect. Sign-in cannot be completed from browser JS alone. */
export async function signInWithFreebuff(
  input: FreebuffSignInInput = {}
): Promise<void> {
  void input;
  window.location.assign(freebuffSignInUrl());
}

/** Sign-out must be a same-origin POST; a link would let other sites sign users out. */
export async function signOutCaregiver(): Promise<void> {
  const response = await fetch(SIGN_OUT_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "returnTo=/",
    credentials: "same-origin",
  });
  if (!response.ok && response.status !== 302) {
    throw new Error("Could not sign out of Freebuff. Please try again.");
  }
  window.location.assign("/");
}

interface SessionState {
  user: FreebuffUser | null;
  ready: boolean;
  signIn: (input?: FreebuffSignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

function mapUser(raw: {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
} | null): FreebuffUser | null {
  if (!raw?.sub) return null;
  return {
    uid: raw.sub,
    displayName: raw.name ?? null,
    email: raw.email ?? null,
    photoURL: raw.picture ?? null,
    provider: "freebuff",
  };
}

/** Reads the server session; the endpoint is the single source of truth. */
export function useCaregiverSession(): SessionState {
  const { user, isLoading, refresh } = useFreebuffUser();
  const signIn = useCallback(
    (input?: FreebuffSignInInput) => signInWithFreebuff(input),
    []
  );
  const signOut = useCallback(() => signOutCaregiver(), []);

  return {
    user: mapUser(user ?? null),
    ready: !isLoading,
    signIn,
    signOut,
    refresh,
  };
}
