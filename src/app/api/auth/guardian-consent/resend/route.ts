import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, verifyPassword } from "@/lib/auth-security";
import { findUserByEmailOrUsername } from "@/lib/db";
import {
  createGuardianConsentRequest,
  isGuardianEmailConfigured,
  sendGuardianConsentEmail,
} from "@/lib/guardian-consent";
import { prisma } from "@/lib/prisma";

const ResendSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";
  const rateLimit = checkRateLimit(`guardian_resend_${ip}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many resend requests. Please wait before trying again." },
      { status: 429 },
    );
  }

  try {
    const parsed = ResendSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid resend request." }, { status: 400 });
    }

    const { email, username, password } = parsed.data;
    const user = await findUserByEmailOrUsername(email);
    if (
      user &&
      user.email.toLowerCase() === email.toLowerCase() &&
      user.username.toLowerCase() === username.toLowerCase() &&
      await verifyPassword(password, user.password_hash, user.salt, user.iterations || 100000)
    ) {
      const canonicalUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { accountStatus: true },
      });
      if (canonicalUser?.accountStatus === "PENDING_GUARDIAN_CONSENT") {
        if (!isGuardianEmailConfigured()) {
          return NextResponse.json(
            { error: "Guardian email is not configured in the root .env file." },
            { status: 503 },
          );
        }
        const consent = await createGuardianConsentRequest(user.email);
        await sendGuardianConsentEmail(consent.guardianEmail, consent.token);
      }
    }

    return NextResponse.json({
      message: "If the account is awaiting guardian consent, a new request has been sent.",
    });
  } catch (error) {
    console.error("Guardian consent resend failed.");
    return NextResponse.json(
      { error: "Could not resend the guardian consent email. Please try again later." },
      { status: 502 },
    );
  }
}
