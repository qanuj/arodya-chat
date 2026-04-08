import { waitUntil } from "@vercel/functions";
import { getBot } from "@/lib/bot";

// Allow up to 60s for gpt-4o + thread.post() to complete before Vercel kills the fn.
export const maxDuration = 60;

// Zernio sends POST requests to this endpoint for every incoming message/comment.
// The adapter handles signature verification (ZERNIO_WEBHOOK_SECRET) and dispatches
// the event to the handlers defined in src/lib/bot.ts.
export async function POST(request: Request): Promise<Response> {
  // webhooks.zernio() may fire message handlers asynchronously after returning.
  // We await it fully here so the fn stays alive for the entire handler chain
  // (gpt-4o call + thread.post). maxDuration = 60 gives us the budget.
  // Pass waitUntil so the SDK can register the processMessage promise.
  // Without this, Vercel kills the function before generateText completes.
  const response = await getBot().webhooks.zernio(request, { waitUntil });

  return response;
}
