import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPlayerProfileFromRequest } from "@/lib/player-session";
import { DEFAULT_ANNOUNCEMENTS } from "@/data/mockData";

const PatchSchema = z.object({
  notificationId: z.string().optional(),
  markAllRead: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const player = await getPlayerProfileFromRequest(request);
    if (!player) {
      return NextResponse.json({
        notifications: DEFAULT_ANNOUNCEMENTS,
        unreadCount: DEFAULT_ANNOUNCEMENTS.length,
      });
    }

    const dbNotifications = await prisma.notification.findMany({
      where: { userId: player.user.id },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    const mappedUserNotes = dbNotifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      category: (n.category as "ANNOUNCEMENT" | "ACHIEVEMENT" | "TOURNAMENT" | "SAFETY" | "GAME") || "ANNOUNCEMENT",
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
      isSystemAnnouncement: false,
    }));

    const combined = [...mappedUserNotes, ...DEFAULT_ANNOUNCEMENTS];
    const unreadCount = mappedUserNotes.filter((n) => !n.readAt).length + DEFAULT_ANNOUNCEMENTS.length;

    return NextResponse.json(
      { notifications: combined, unreadCount },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    console.error("Failed to load notifications:", error);
    return NextResponse.json({
      notifications: DEFAULT_ANNOUNCEMENTS,
      unreadCount: DEFAULT_ANNOUNCEMENTS.length,
    });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const player = await getPlayerProfileFromRequest(request);
    if (!player) {
      return NextResponse.json({ ok: true });
    }

    const body: unknown = await request.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid notification payload." }, { status: 400 });
    }

    const { notificationId, markAllRead } = parsed.data;
    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: player.user.id, readAt: null },
        data: { readAt: new Date() },
      });
    } else if (notificationId && !notificationId.startsWith("ann-")) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: player.user.id },
        data: { readAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to mark notifications read:", error);
    return NextResponse.json({ error: "Could not update notification state." }, { status: 500 });
  }
}
