import { Chat, type Thread, type Message } from "chat";
import { createZernioAdapter } from "@zernio/chat-sdk-adapter";
import { createMemoryState } from "@chat-adapter/state-memory";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const SYSTEM_PROMPT = `You are the Arodya assistant — a warm, knowledgeable guide for African patients exploring medical treatment in India.

Arodya is a medical travel facilitation platform. We help patients navigate hospitals, specialists, and logistics for treatment in India. We are NOT a hospital.

Your role:
- Answer questions about treatments, hospitals, and cities we work with in India
- Guide patients through the process: initial inquiry → case creation → hospital match → travel
- Be empathetic, clear, and patient-first — never use medical jargon without explaining it
- For serious clinical questions, always recommend they speak with a doctor
- To start a formal case, direct patients to: https://arodya.com/intake
- Keep responses concise and conversational — this is social media, not email

Tone: Trustworthy, warm, direct. No clickbait, no pressure.`;

async function handleMessage(thread: Thread, message: Message): Promise<void> {
  const userText = message.text?.trim();
  if (!userText) return;

  const platform: string =
    (message.raw as { platform?: string }).platform ?? "unknown";

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: SYSTEM_PROMPT,
      prompt: `Platform: ${platform}\n\nUser message: ${userText}`,
      maxTokens: 400,
    });

    await thread.post(text);
  } catch (err) {
    console.error("[arodya-chat] AI generation failed:", err);
    await thread.post(
      "Hi! Thanks for reaching out to Arodya. Our team will get back to you shortly. " +
        "To start your medical journey now, visit https://arodya.com/intake"
    );
  }
}

// Lazy singleton — avoids crashing at build time when env vars are absent
let _bot: Chat | null = null;

export function getBot(): Chat {
  if (_bot) return _bot;

  const botName = process.env.ZERNIO_BOT_NAME ?? "Arodya";

  _bot = new Chat({
    userName: botName,
    state: createMemoryState(),
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
    await handleMessage(thread, message);
  });

  // Handle @mentions and comments (Instagram comments, X/Twitter replies, etc.)
  _bot.onNewMention(async (thread, message) => {
    await handleMessage(thread, message);
  });

  // Catch-all: any message matching any text
  _bot.onNewMessage(/.+/, async (thread, message) => {
    await handleMessage(thread, message);
  });

  return _bot;
}
