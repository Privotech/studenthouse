/**
 * Input Validation, URL Safety & XSS Defense Helpers
 */

export function sanitizeSafeHttpUrl(rawUrl: string | null | undefined): {
  valid: boolean;
  value: string;
  error?: string;
} {
  const trimmed = (rawUrl ?? "").trim();
  if (!trimmed) {
    return { valid: true, value: "" };
  }
  if (trimmed.length > 260) {
    return { valid: false, value: "", error: "URL exceeds maximum allowed length (260 chars)." };
  }
  // Block control chars, whitespace, or script schemes before URL parsing
  if (/[\u0000-\u001f\u007f\s]/.test(trimmed)) {
    return { valid: false, value: "", error: "URL must not contain whitespace or control characters." };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return {
        valid: false,
        value: "",
        error: "Only https:// or http:// URLs are permitted.",
      };
    }
    return { valid: true, value: parsed.toString() };
  } catch {
    return { valid: false, value: "", error: "Enter a valid https:// artifact URL." };
  }
}

export function sanitizePlainText(input: string, maxLength: number): string {
  return input
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first && /^[0-9a-fA-F.:]+$/.test(first)) {
      return first.slice(0, 64);
    }
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp && /^[0-9a-fA-F.:]+$/.test(realIp)) {
    return realIp.slice(0, 64);
  }
  return "127.0.0.1";
}
