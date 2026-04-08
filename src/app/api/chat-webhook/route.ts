import { after } from "next/server";
import { getBot } from "@/lib/bot";

// Allow up to 60s for gpt-4o + thread.post() to complete before Vercel kills the fn.
export const maxDuration = 60;

// Zernio sends POST requests to this endpoint for every incoming message/comment.
// The adapter handles signature verification (ZERNIO_WEBHOOK_SECRET) and dispatches
// the event to the handlers defined in src/lib/bot.ts.
export async function POST(request: Request): Promise<Response> {
  // Use Next.js `after()` (stable in Next.js 15) instead of @vercel/functions
  // `waitUntil`, which relies on a runtime context not reliably available in
  // App Router routes. `after` keeps the function alive after the response
  // is returned so generateText + thread.post() can complete.
  const response = await getBot().webhooks.zernio(request, { waitUntil: after });

  return response;
}
