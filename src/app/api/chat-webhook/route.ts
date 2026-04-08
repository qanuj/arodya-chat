import { getBot } from "@/lib/bot";

// Zernio sends POST requests to this endpoint for every incoming message/comment.
// The adapter handles signature verification (ZERNIO_WEBHOOK_SECRET) and dispatches
// the event to the handlers defined in src/lib/bot.ts.
export async function POST(request: Request): Promise<Response> {
  return getBot().webhooks.zernio(request);
}
