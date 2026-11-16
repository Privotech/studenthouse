import { NextRequest, NextResponse } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const MAX_JSON_BODY_BYTES = 256 * 1024; // 256 KB
const MAX_MEDIA_BODY_BYTES = 3 * 1024 * 1024; // 3 MB

function extractHostname(urlOrHost: string | null): string | null {
  if (!urlOrHost) return null;
  try {
    const parsed = urlOrHost.includes("://")
      ? new URL(urlOrHost)
      : new URL(`https://${urlOrHost}`);
    return parsed.host.toLowerCase();
  } catch {
    return null;
  }
}

export function validateMutationOrigin(req: NextRequest): { ok: boolean; reason?: string } {
  if (!MUTATING_METHODS.has(req.method)) {
    return { ok: true };
  }

  const expectedHost = extractHostname(
    req.headers.get("x-forwarded-host") || req.headers.get("host"),
  );
  const originHeader = req.headers.get("origin");
  const refererHeader = req.headers.get("referer");

  // Always enforce strict host match whenever browser sends Origin or Referer
  if (originHeader) {
    const originHost = extractHostname(originHeader);
    if (!originHost || !expectedHost || originHost !== expectedHost) {
      return { ok: false, reason: "Cross-origin request rejected by CSRF protection." };
    }
    return { ok: true };
  }

  if (refererHeader) {
    const refererHost = extractHostname(refererHeader);
    if (!refererHost || !expectedHost || refererHost !== expectedHost) {
      return { ok: false, reason: "Cross-origin referer rejected by CSRF protection." };
    }
    return { ok: true };
  }

  // If browser cookies are attached on a mutation without Origin or Referer, reject potential CSRF
  const hasSessionCookie = Boolean(
    req.cookies.get("np_session")?.value || req.cookies.get("np_admin_session")?.value,
  );
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site" && fetchSite !== "none") {
    return { ok: false, reason: "Cross-site browser fetch rejected." };
  }
  if (hasSessionCookie && fetchSite === "cross-site") {
    return { ok: false, reason: "Cross-site cookie mutation rejected." };
  }

  return { ok: true };
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    // Enforce payload size caps cleanly
    const contentLengthHeader = req.headers.get("content-length");
    if (contentLengthHeader) {
      const bytes = Number(contentLengthHeader);
      const limit = pathname.startsWith("/api/media/")
        ? MAX_MEDIA_BODY_BYTES
        : MAX_JSON_BODY_BYTES;
      if (Number.isFinite(bytes) && bytes > limit) {
        return NextResponse.json(
          { error: "Request payload exceeds server security limit." },
          { status: 413 },
        );
      }
    }

    // Enforce CSRF Origin/Host check on state-changing API routes
    const csrfCheck = validateMutationOrigin(req);
    if (!csrfCheck.ok) {
      return NextResponse.json({ error: csrfCheck.reason }, { status: 403 });
    }
  }

  const response = NextResponse.next();
  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store, private");
    response.headers.set("X-Content-Type-Options", "nosniff");
  }
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
