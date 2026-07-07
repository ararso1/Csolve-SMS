const HTML_TAG = /<[^>]*>/g;
const SCRIPT_BLOCK = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

/** Strip HTML tags and control characters from user text input. */
export function sanitizeText(value: string, maxLength = 5000): string {
  return value
    .replace(SCRIPT_BLOCK, "")
    .replace(HTML_TAG, "")
    .replace(CONTROL_CHARS, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeOptionalText(
  value: string | null | undefined,
  maxLength = 5000
): string | null {
  if (value == null || value === "") return null;
  return sanitizeText(value, maxLength);
}

export function sanitizeRecord<T extends Record<string, unknown>>(
  data: T,
  textFields: (keyof T)[]
): T {
  const copy = { ...data };
  for (const field of textFields) {
    const val = copy[field];
    if (typeof val === "string") {
      (copy as Record<string, unknown>)[field as string] = sanitizeText(val);
    }
  }
  return copy;
}
