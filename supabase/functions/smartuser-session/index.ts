import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { smartUserValidateSession } from "../_shared/smartuser.ts";

Deno.serve(async (req: Request) => {
  const optRes = handleOptions(req);
  if (optRes) return optRes;

  try {
    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return errorResponse("Token is required", 400);
    }

    const result = await smartUserValidateSession(token);
    return jsonResponse(result as unknown as Record<string, unknown>);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("Missing required env var") ? 503 : 401;
    return errorResponse(message, status);
  }
});
