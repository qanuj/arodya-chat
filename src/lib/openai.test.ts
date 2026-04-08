import { describe, it, expect } from "vitest";
import { loadEnv } from "vite";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { SYSTEM_PROMPT } from "./system-prompt";

// Load .env.test into process.env (Vitest 4.x dropped --env-file)
Object.assign(process.env, loadEnv("test", process.cwd(), ""));

describe("OpenAI integration", () => {
  it("returns a non-empty reply for a WhatsApp message", async () => {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set — add it to .env.test");

    const platform = "whatsapp";
    const userText = "What treatments do you cover?";

    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 45_000);
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: SYSTEM_PROMPT,
      prompt: `Platform: ${platform}\n\nUser message: ${userText}`,
      maxTokens: 400,
      abortSignal: ac.signal,
    });
    clearTimeout(timeout);

    expect(text).toBeTruthy();
    expect(text.length).toBeGreaterThan(10);
    console.log("OpenAI reply:", text);
  }, 60_000);
});
