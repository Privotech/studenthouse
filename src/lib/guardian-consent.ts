import { createHash, randomBytes } from "node:crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

export function isGuardianEmailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY &&
      process.env.RESEND_FROM_EMAIL &&
      process.env.APP_URL,
  );
}

export async function createGuardianConsentRequest(
  childEmail: string,
  guardianEmail?: string,
) {
  const child = await prisma.user.findUnique({
    where: { email: childEmail },
    select: { id: true },
  });
  if (!child) throw new Error("Player account was not found for guardian consent.");

  const existing = await prisma.$queryRaw<Array<{ guardianEmail: string }>>`
    SELECT "guardianEmail"
    FROM "GuardianConsentRequest"
    WHERE "childUserId" = ${child.id}::uuid
    LIMIT 1
  `;
  const recipient = guardianEmail?.trim().toLowerCase() || existing[0]?.guardianEmail;
  if (!recipient) throw new Error("A guardian email address is required.");

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await prisma.$executeRaw`
    INSERT INTO "GuardianConsentRequest" (
      "childUserId", "guardianEmail", "verificationTokenHash", "status",
      "expiresAt", "grantedAt", "createdAt", "updatedAt"
    ) VALUES (
      ${child.id}::uuid, ${recipient}, ${tokenHash}, 'PENDING',
      ${expiresAt}, NULL, NOW(), NOW()
    )
    ON CONFLICT ("childUserId") DO UPDATE SET
      "guardianEmail" = EXCLUDED."guardianEmail",
      "verificationTokenHash" = EXCLUDED."verificationTokenHash",
      "status" = 'PENDING',
      "expiresAt" = EXCLUDED."expiresAt",
      "grantedAt" = NULL,
      "updatedAt" = NOW()
  `;

  return { token, guardianEmail: recipient };
}

export async function sendGuardianConsentEmail(guardianEmail: string, token: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const appUrl = process.env.APP_URL?.replace(/\/+$/, "");
  if (!apiKey || !from || !appUrl) {
    throw new Error("Guardian consent email is not configured.");
  }

  const consentUrl = `${appUrl}/api/auth/guardian-consent?token=${encodeURIComponent(token)}`;
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: guardianEmail,
    subject: "Guardian consent requested for NaijaPlay",
    text: `A player account requested guardian consent. Review and approve it here: ${consentUrl}\n\nThis link expires in 48 hours. If you did not expect this request, you can ignore this email.`,
    html: `<p>A player account requested guardian consent.</p><p><a href="${consentUrl}">Review and approve the request</a></p><p>This link expires in 48 hours. If you did not expect this request, you can ignore this email.</p>`,
  });

  if (error) {
    throw new Error("Resend could not deliver the guardian consent email.");
  }
}

export async function grantGuardianConsent(token: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const requests = await prisma.$queryRaw<
    Array<{ id: string; childUserId: string; status: string; expiresAt: Date }>
  >`
    SELECT id, "childUserId", status, "expiresAt"
    FROM "GuardianConsentRequest"
    WHERE "verificationTokenHash" = ${tokenHash}
    LIMIT 1
  `;
  const request = requests[0];
  if (!request) return "NOT_FOUND" as const;
  if (request.status === "GRANTED") return "ALREADY_GRANTED" as const;
  if (request.status !== "PENDING") return "NOT_PENDING" as const;
  if (request.expiresAt <= new Date()) {
    await prisma.$executeRaw`
      UPDATE "GuardianConsentRequest"
      SET status = 'EXPIRED', "updatedAt" = NOW()
      WHERE id = ${request.id}::uuid AND status = 'PENDING'
    `;
    return "EXPIRED" as const;
  }

  const granted = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.$queryRaw<Array<{ childUserId: string }>>`
      UPDATE "GuardianConsentRequest"
      SET status = 'GRANTED', "grantedAt" = NOW(), "updatedAt" = NOW()
      WHERE id = ${request.id}::uuid
        AND status = 'PENDING'
        AND "expiresAt" > NOW()
      RETURNING "childUserId"
    `;
    if (!updated[0]) return false;

    await transaction.user.update({
      where: { id: updated[0].childUserId },
      data: { accountStatus: "ACTIVE" },
    });
    return true;
  });

  return granted ? "GRANTED" as const : "EXPIRED" as const;
}
