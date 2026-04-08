import { Chat, type Thread, type Message } from "chat";
import { createZernioAdapter } from "@zernio/chat-sdk-adapter";
import { createMemoryState } from "@chat-adapter/state-memory";
import { createRedisState } from "@chat-adapter/state-redis";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { SYSTEM_PROMPT } from "./system-prompt";

function createState() {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) return createRedisState({ url: redisUrl });
  console.warn("[arodya-chat] REDIS_URL not set — using in-memory state (dev only)");
  return createMemoryState();
}

async function handleMessage(thread: Thread, message: Message, kind: string): Promise<void> {
  const userText = message.text?.trim();
  
  console.log("[arodya-chat] Received message:",message);
  
  if (!userText) return;

  const platform: string =
    (message.raw as { platform?: string }).platform ?? "unknown";

  console.log(`[arodya-chat] handleMessage called — platform=${platform} text="${userText.slice(0, 60)}" kind="${kind}"`);

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: SYSTEM_PROMPT,
      prompt: `Platform: ${platform}\n\nUser message: ${userText}`,
      maxTokens: 400,
    });

    console.log(`[arodya-chat] AI reply ready (${text.length} chars), posting to thread…`);
    await thread.post(text);
    console.log("[arodya-chat] thread.post() completed");
  } catch (err) {
    console.error("[arodya-chat] AI generation failed:", err);
    try {
      await thread.post(
        "Hi! Thanks for reaching out to Arodya. Our team will get back to you shortly. " +
          "To start your medical journey now, visit https://arodya.com/intake"
      );
    } catch (postErr) {
      console.error("[arodya-chat] fallback thread.post() also failed:", postErr);
    }
  }
}

// Lazy singleton — avoids crashing at build time when env vars are absent
let _bot: Chat | null = null;

export function getBot(): Chat {
  if (_bot) return _bot;

  const botName = process.env.ZERNIO_BOT_NAME ?? "Arodya";

  _bot = new Chat({
    userName: botName,
    state: createState(),
    adapters: {
      zernio: createZernioAdapter({
        apiKey: process.env.ZERNIO_API_KEY!,
        webhookSecret: process.env.ZERNIO_WEBHOOK_SECRET,
        botName,
      }),
    },
  });

  // Handle all DMs (Instagram DMs, WhatsApp, Telegram, Facebook Messenger, etc.)
  _bot.onDirectMessage(async (thread, message) => {
    await handleMessage(thread, message, "direct_message");
  });

  // Handle @mentions and comments (Instagram comments, X/Twitter replies, etc.)
  _bot.onNewMention(async (thread, message) => {
    await handleMessage(thread, message, "mention");
  });

  // Catch-all: any message matching any text
  _bot.onNewMessage(/.+/, async (thread, message) => {
    await handleMessage(thread, message, "new_message");
  });

  return _bot;
}
