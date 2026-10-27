import { z } from "zod";

export type AiResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Gemini output is only trusted after it parses and validates. Anything else is "couldn't
 * check", which callers must never treat as a pass.
 */
export function parseAiJson<T>(schema: z.ZodType<T>, text: string): AiResult<T> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "Couldn't check: the AI reply was not valid JSON." };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { ok: false, error: "Couldn't check: the AI reply did not match the expected shape." };
  }
  return { ok: true, data: result.data };
}

/** JSON Schema for `responseJsonSchema`, without the `$schema` key Gemini does not accept. */
export function jsonSchemaFor(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  return Object.fromEntries(Object.entries(json).filter(([key]) => key !== "$schema"));
}
