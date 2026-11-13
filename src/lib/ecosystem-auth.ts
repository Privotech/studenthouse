import { NextRequest } from "next/server";
import { DbUser, findSession, findUserById } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export interface AuthenticatedActor {
  userId: string;
  email: string;
  username: string;
  displayName: string;
  ageZone: DbUser["age_zone"];
  age: number;
  school: string;
  state: string;
  role: DbUser["role"];
  playerProfileId?: string;
}

export async function getAuthenticatedActor(
  request: NextRequest,
): Promise<AuthenticatedActor | null> {
  const authorization = request.headers.get("authorization");
  const bearerToken =
    authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const token = request.cookies.get("np_session")?.value || bearerToken;

  if (!token) return null;

  const session = await findSession(token);
  if (!session) return null;

  const appUser = await findUserById(session.user_id);
  if (!appUser) return null;

  let playerProfileId: string | undefined;
  try {
    const canonical = await prisma.user.findUnique({
      where: { email: appUser.email },
      include: { playerProfile: { select: { id: true } } },
    });
    if (
      canonical &&
      (canonical.accountStatus === "SUSPENDED" ||
        canonical.accountStatus === "DEACTIVATED" ||
        canonical.accountStatus === "RESTRICTED")
    ) {
      return null;
    }
    playerProfileId = canonical?.playerProfile?.id;
  } catch {
    // Allow standalone memory-backed execution when Prisma remote DB isn't attached
  }

  return {
    userId: appUser.id,
    email: appUser.email,
    username: appUser.username,
    displayName: appUser.display_name,
    ageZone: appUser.age_zone,
    age: appUser.age,
    school: appUser.school,
    state: appUser.state,
    role: appUser.role,
    playerProfileId,
  };
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
