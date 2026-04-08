import { waitUntil } from "@vercel/functions";
import { getBot } from "@/lib/bot";

// Allow up to 60s for gpt-4o + thread.post() to complete before Vercel kills the fn.
export const maxDuration = 60;

// Zernio sends POST requests to this endpoint for every incoming message/comment.
// The adapter handles signature verification (ZERNIO_WEBHOOK_SECRET) and dispatches
// the event to the handlers defined in src/lib/bot.ts.
export async function POST(request: Request): Promise<Response> {
  const response = getBot().webhooks.zernio(request);
  // Keep the serverless function alive until the bot finishes sending the reply.
  waitUntil(response);
  return response;
}
