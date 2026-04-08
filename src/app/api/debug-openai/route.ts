import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

// Quick smoke-test: hit this endpoint to verify OpenAI works in production.
// Remove or protect this route once confirmed.
export async function GET(): Promise<Response> {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ ok: false, error: "OPENAI_API_KEY not set" }, { status: 500 });
  }

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: "Reply with exactly: OK",
      maxTokens: 10,
    });
    return Response.json({ ok: true, reply: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
