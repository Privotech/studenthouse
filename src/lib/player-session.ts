import { NextRequest } from "next/server";
import { findSession, findUserById } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { calculateAgeYears } from "@naijaplay/validation";

export async function getCanonicalPlayerSummary(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { playerProfile: true },
  });
  if (!user?.playerProfile) return null;

  const profile = user.playerProfile;
  const dateOfBirth = profile.dateOfBirth.toISOString().slice(0, 10);
  const displayName = profile.displayName;
  const nameParts = displayName.trim().split(/\s+/);
  return {
    display_name: displayName,
    avatar_initials:
      nameParts.length > 1
        ? `${nameParts[0]![0]}${nameParts[nameParts.length - 1]![0]}`.toUpperCase()
        : displayName.slice(0, 2).toUpperCase(),
    avatar_crest: profile.avatarId,
    age: calculateAgeYears(dateOfBirth),
    age_zone: profile.ageZone,
    school: profile.schoolName,
    state: profile.stateCode,
    level: profile.level,
    xp: profile.totalXp,
    streak_days: profile.currentStreakDays,
  };
}

export async function getPlayerProfileFromRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const bearerToken =
    authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const token = request.cookies.get("np_session")?.value || bearerToken;

  if (!token) return null;

  const session = await findSession(token);
  if (!session) return null;

  const appUser = await findUserById(session.user_id);
  if (!appUser) return null;

  const user = await prisma.user.findUnique({
    where: { email: appUser.email },
    include: { playerProfile: true },
  });

  if (!user?.playerProfile || user.accountStatus !== "ACTIVE") return null;
  return { user, profile: user.playerProfile };
}
