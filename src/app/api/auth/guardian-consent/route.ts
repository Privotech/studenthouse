import { NextRequest, NextResponse } from "next/server";
import { grantGuardianConsent } from "@/lib/guardian-consent";

const securityHeaders = {
  "Content-Security-Policy": "default-src 'none'; form-action 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

function consentPage(title: string, message: string, token?: string, status = 200) {
  const form = token
    ? `<form method="post"><input type="hidden" name="token" value="${token}"><button type="submit">Approve guardian consent</button></form>`
    : "";
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>body{font:16px system-ui;background:#0b111e;color:#e2e8f0;max-width:38rem;margin:10vh auto;padding:2rem}button{background:#059669;color:white;border:0;border-radius:.5rem;padding:.8rem 1rem;font-weight:700;cursor:pointer}</style><h1>${title}</h1><p>${message}</p>${form}</html>`;
  return new NextResponse(html, {
    status,
    headers: { ...securityHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return consentPage("Invalid consent link", "This guardian consent link is invalid.", undefined, 400);
  }
  return consentPage(
    "Guardian consent for NaijaPlay",
    "Approving grants the player access to their account and saved academic progress.",
    token,
  );
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const token = form.get("token");
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
      return consentPage("Invalid consent link", "This guardian consent link is invalid.", undefined, 400);
    }

    const result = await grantGuardianConsent(token);
    if (result === "GRANTED" || result === "ALREADY_GRANTED") {
      return consentPage(
        "Consent recorded",
        "Guardian consent has been recorded. The player can now sign in to NaijaPlay.",
      );
    }
    if (result === "EXPIRED") {
      return consentPage("Consent link expired", "Request a new guardian consent email from the player account.", undefined, 410);
    }
    return consentPage("Consent link unavailable", "This request is no longer pending.", undefined, 410);
  } catch (error) {
    console.error("Failed to record guardian consent:", error);
    return consentPage(
      "Consent could not be recorded",
      "Please try again later or contact NaijaPlay support.",
      undefined,
      500,
    );
  }
}
