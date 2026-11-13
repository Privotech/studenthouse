import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ReportReasonCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPlayerProfileFromRequest } from "@/lib/player-session";
import { logAuditEvent } from "@/lib/db";

const ReportSchema = z.object({
  targetType: z.enum(["CREATIVE_SUBMISSION", "LEADERBOARD_PLAYER", "CLUB_MEMBER", "GENERAL"]),
  targetId: z.string().trim().min(1).max(120),
  targetLabel: z.string().trim().min(1).max(120).optional(),
  reasonCategory: z.enum([
    "INAPPROPRIATE_FOR_AGE",
    "PERSONAL_INFORMATION_EXPOSURE",
    "UNFAIR_PLAY_OR_CHEATING",
    "HARASSMENT_OR_BULLYING",
    "SPAM_OR_SCAM",
  ]),
  details: z.string().trim().min(5).max(400),
});

function deterministicUuid(input: string): string {
  const hex = createHash("sha256").update(input).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export async function POST(request: NextRequest) {
  try {
    const player = await getPlayerProfileFromRequest(request);
    if (!player) {
      return NextResponse.json({ error: "Sign in to submit a safety report." }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = ReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide a valid reason category and description.", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { targetType, targetId, targetLabel, reasonCategory, details } = parsed.data;
    const uuidTarget = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)
      ? targetId
      : deterministicUuid(`${targetType}:${targetId}`);

    const report = await prisma.contentReport.create({
      data: {
        reporterUserId: player.user.id,
        targetType,
        targetId: uuidTarget,
        reasonCategory: reasonCategory as ReportReasonCategory,
        details: `[${targetLabel || targetId}] ${details}`.slice(0, 500),
      },
      select: { id: true, status: true, createdAt: true },
    });

    await prisma.notification.create({
      data: {
        userId: player.user.id,
        title: "Safety Report Logged",
        body: `Your ${reasonCategory.replace(/_/g, " ").toLowerCase()} report has been queued for Trust & Safety review.`,
        category: "SAFETY",
      },
    });

    await logAuditEvent({
      user_id: player.user.id,
      event_type: "SAFETY_REPORT",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      details: { reportId: report.id, targetType, targetId, reasonCategory },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Safety report submission failed:", error);
    return NextResponse.json({ error: "Could not submit safety report." }, { status: 500 });
  }
}
