import { getGenerativeModel, type Part } from "firebase/ai";
import type { z } from "zod";

import { type AiResult, jsonSchemaFor, parseAiJson } from "@/lib/ai/parse";
import { GEMINI_MODEL, GEMINI_TIMEOUT_MS } from "@/lib/constants";
import { geminiBackend } from "@/lib/firebase/client";

function imagePart(dataUrl: string): Part {
  const [header, data = ""] = dataUrl.split(",");
  const mimeType = header?.match(/^data:(.*?);base64$/)?.[1] ?? "image/jpeg";
  return { type: "inlineData", inlineData: { mimeType, data } };
}

export async function generateJson<T>(
  schema: z.ZodType<T>,
  prompt: string,
  images: string[] = [],
): Promise<AiResult<T>> {
  const model = getGenerativeModel(geminiBackend(), {
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: jsonSchemaFor(schema),
      temperature: 0.2,
    },
  });

  try {
    const result = await model.generateContent(
      [{ type: "text", text: prompt }, ...images.map(imagePart)],
      { timeout: GEMINI_TIMEOUT_MS },
    );
    return parseAiJson(schema, result.response.text());
  } catch (error) {
    console.error("Gemini call failed", error);
    return { ok: false, error: "Couldn't check: the AI service is slow or unavailable." };
  }
}
