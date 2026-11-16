import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { consumeRateQuota, verifyDummyPassword, verifyPassword } from "@/lib/auth-security";
import { findUserByEmailOrUsername } from "@/lib/db";
import {
  createGuardianConsentRequest,
  isGuardianEmailConfigured,
  sendGuardianConsentEmail,
} from "@/lib/guardian-consent";
import { extractClientIp } from "@/lib/input-security";
import { prisma } from "@/lib/prisma";

const ResendSchema = z.object({
  email: z.string().trim().email().max(100),
  username: z.string().trim().min(3).max(25),
  password: z.string().min(1).max(128),
});

export async function POST(request: NextRequest) {
  const ip = extractClientIp(request.headers);
  const ipQuota = consumeRateQuota(`guardian_resend_${ip}`, 5);
  if (!ipQuota.allowed) {
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
    const acctQuota = consumeRateQuota(`guardian_resend_acct_${email.toLowerCase()}`, 3);
    if (!acctQuota.allowed) {
      return NextResponse.json(
        { error: "Too many resend attempts for this account. Please wait before trying again." },
        { status: 429 },
      );
    }

    const user = await findUserByEmailOrUsername(email);
    if (!user) {
      await verifyDummyPassword(password);
    } else if (
      user.email.toLowerCase() === email.toLowerCase() &&
      user.username.toLowerCase() === username.toLowerCase() &&
      (await verifyPassword(password, user.password_hash, user.salt, user.iterations || 100000))
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

    return NextResponse.json(
      { message: "If the account is awaiting guardian consent, a new request has been sent." },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch {
    console.error("Guardian consent resend failed.");
    return NextResponse.json(
      { error: "Could not resend the guardian consent email. Please try again later." },
      { status: 502 },
    );
  }
}
