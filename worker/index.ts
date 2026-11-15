import { createFreebuffAuth } from "@freebuff/auth";
import type { FreebuffAuth } from "@freebuff/auth";
import { handleApiRoute, type ApiEnv } from "./api";

/**
 * Freebuff Sites entry point: one Worker, three jobs.
 *   1. `/auth/freebuff/*` — real OIDC sign-in, callback, session and sign-out.
 *   2. `/api/*` — the care API, authorized on the server with `getUser`.
 *   3. everything else — the built SPA from `./dist`.
 */
let auth: FreebuffAuth | undefined;
let app: ((request: Request, env: ApiEnv) => Promise<Response>) | undefined;

function setup(env: ApiEnv): (request: Request, env: ApiEnv) => Promise<Response> {
  // One instance per isolate caches discovery documents and signing keys.
  auth ??= createFreebuffAuth({
    clientId: env.FREEBUFF_CLIENT_ID,
    issuer: env.FREEBUFF_ISSUER,
    baseUrl: env.APP_ORIGIN,
    // Only ever true for a loopback development origin; production is https.
    allowInsecureLocalhost: env.APP_ORIGIN.startsWith("http://"),
  });
  const instance = auth;

  app ??= instance.wrap(async (request: Request, requestEnv: ApiEnv) => {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const user = await instance.getUser(request);
      return handleApiRoute(request, requestEnv, user, url);
    }

    return requestEnv.ASSETS.fetch(request);
  });

  return app;
}

export default {
  fetch(request: Request, env: ApiEnv): Promise<Response> {
    return setup(env)(request, env);
  },
};
