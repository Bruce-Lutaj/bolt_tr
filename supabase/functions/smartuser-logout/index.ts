import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { smartUserLogout } from "../_shared/smartuser.ts";

Deno.serve(async (req: Request) => {
  const optRes = handleOptions(req);
  if (optRes) return optRes;

  try {
    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    const body = await req.json();
    const { token } = body;

    if (token && typeof token === "string") {
      await smartUserLogout(token);
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message.includes("Missing required env var")) {
      return errorResponse(message, 503);
    }
    // Best-effort: still return ok even if logout call failed
    return jsonResponse({ ok: true });
  }
});
