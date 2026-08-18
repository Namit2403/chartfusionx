import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1).max(4000),
  voice: z.string().optional(),
});

/**
 * Generates a single full-length narration for the voice summary. Browser
 * speechSynthesis truncated long sentences, so the audio is produced server
 * side and returned as one MP3 the <audio> element owns end to end.
 */
export const synthesizeSummary = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI narration is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: data.text,
        voice: data.voice ?? "alloy",
        response_format: "mp3",
        instructions:
          "Read as a calm, neutral narrator summarising past performance data. Finish every sentence fully.",
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`TTS request failed [${response.status}]: ${body}`);
      throw new Error(`Narration failed [${response.status}]`);
    }

    const buffer = await response.arrayBuffer();
    return { audio: Buffer.from(buffer).toString("base64"), mimeType: "audio/mpeg" };
  });
