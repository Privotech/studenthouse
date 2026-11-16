import { randomUUID } from "node:crypto";
import { AgeZone, AccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashSessionToken } from "@/lib/session-crypto";
import { notifyAdminOfActivity } from "@/lib/admin-notifications";

/**
 * PostgreSQL database client and storage engine.
 */

export interface DbUser {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  salt: string;
  iterations: number;
  display_name: string;
  date_of_birth: string;
  age: number;
  age_zone: "JUNIOR" | "TEEN" | "YOUTH" | "SENIOR";
  school: string;
  state: string;
  avatar_crest: string;
  avatar_initials: string;
  role: "USER" | "STUDENT" | "GUARDIAN" | "ADMIN";
  level: number;
  xp: number;
  streak_days: number;
  failed_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export const isRemoteDatabaseConfigured = () => isNeonConfigured;

export interface DbSession {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface DbAuditLog {
  id: string;
  user_id: string | null;
  event_type:
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILURE"
    | "REGISTER"
    | "LOGOUT"
    | "PASSWORD_CHANGE"
    | "RATE_LIMITED"
    | "SAFETY_REPORT"
    | "USER_BLOCK"
    | "SETTINGS_UPDATE"
    | "GAME_COMPLETED"
    | "GAME_ANOMALY"
    | "TOURNAMENT_ENTRY"
    | "TOURNAMENT_QUALIFIER"
    | "SKILLQUEST_COMPLETE"
    | "SKILLQUEST_ASSIGNMENT"
    | "SKILLQUEST_COURSE_CREATE"
    | "SKILLQUEST_CLASS_TASK"
    | "TALENT_PROFILE_UPDATE"
    | "TALENT_PORTFOLIO_ADD"
    | "TALENT_COMPETITION_CREATE"
    | "TALENT_SUBMISSION"
    | "TALENT_JUDGE_SCORE"
    | "CREATIVE_UPLOAD"
    | "GUARDIAN_CONSENT"
    | "ORG_TENANT_UPDATE"
    | "ORG_MEMBERSHIP_JOIN"
    | "SUBSCRIPTION_UPDATE"
    | "ADMIN_AUTH"
    | "ADMIN_EMAIL_TEST";
  ip_address: string;
  details: Record<string, unknown>;
  created_at: string;
}

const connectionString = process.env.DATABASE_URL || "";

export const isNeonConfigured =
  Boolean(connectionString) &&
  !connectionString.includes("localhost") &&
  (connectionString.startsWith("postgres://") || connectionString.startsWith("postgresql://"));

export function getNeonConnectionString(): string {
  return connectionString;
}

// In-memory fallback repository for standalone testing and instant zero-downtime execution
const fallbackUsers = new Map<string, DbUser>();
const fallbackSessions = new Map<string, DbSession>();
const fallbackAuditLogs: DbAuditLog[] = [];
const fallbackBlockedEntities = new Map<string, Set<string>>();

let tablesInitialized = false;

export async function initTablesIfRemote(): Promise<void> {
  if (!isNeonConfigured || tablesInitialized) return;

  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS np_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        iterations INTEGER NOT NULL DEFAULT 100000,
        display_name TEXT NOT NULL,
        age INTEGER NOT NULL,
        age_zone TEXT NOT NULL,
        school TEXT NOT NULL,
        state TEXT NOT NULL,
        avatar_crest TEXT NOT NULL,
        avatar_initials TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'USER',
        level INTEGER NOT NULL DEFAULT 1,
        xp INTEGER NOT NULL DEFAULT 0,
        streak_days INTEGER NOT NULL DEFAULT 1,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS np_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES np_users(id) ON DELETE CASCADE,
        session_token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        ip_address TEXT NOT NULL,
        user_agent TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS np_audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        event_type TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        details JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS np_blocked_users (
        id TEXT PRIMARY KEY,
        blocker_user_id TEXT NOT NULL,
        blocked_name TEXT NOT NULL,
        reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (blocker_user_id, blocked_name)
      );
    `;

    tablesInitialized = true;
  } catch (err) {
    console.error("Failed to initialize the PostgreSQL auth tables:", err);
    throw err;
  }
}

// Data Access Methods
export async function findUserByEmailOrUsername(identifier: string): Promise<DbUser | null> {
  const normalized = identifier.trim().toLowerCase();

  if (isNeonConfigured) {
    try {
      await initTablesIfRemote();
      const rows = await prisma.$queryRaw<DbUser[]>`
        SELECT * FROM np_users 
        WHERE LOWER(email) = ${normalized} OR LOWER(username) = ${normalized}
        LIMIT 1
      `;
      if (rows && rows.length > 0) return rows[0];
    } catch (e) {
      console.error("PostgreSQL user lookup failed:", e);
      throw e;
    }
  }

  return (
    Array.from(fallbackUsers.values()).find(
      (u) =>
        u.email.toLowerCase() === normalized ||
        u.username.toLowerCase() === normalized
    ) || null
  );
}

export async function findUserById(id: string): Promise<DbUser | null> {
  if (isNeonConfigured) {
    try {
      await initTablesIfRemote();
      const rows = await prisma.$queryRaw<DbUser[]>`
        SELECT * FROM np_users 
        WHERE id = ${id}
        LIMIT 1
      `;
      if (rows && rows.length > 0) return rows[0];
    } catch (e) {
      console.error("PostgreSQL user lookup failed:", e);
      throw e;
    }
  }

  return fallbackUsers.get(id) || null;
}

export async function createUser(user: DbUser): Promise<DbUser> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
  if (!isUuid) {
    user.id = randomUUID();
  }

  if (isNeonConfigured) {
    await initTablesIfRemote();
    await prisma.$transaction(async (transaction) => {
      const canonicalUser = await transaction.user.create({
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          passwordHash: user.password_hash,
          passwordSalt: user.salt,
          passwordIterations: user.iterations,
          failedAttempts: user.failed_attempts,
          lockedUntil: user.locked_until ? new Date(user.locked_until) : null,
          role: UserRole.PLAYER,
          accountStatus:
            user.age < 18
              ? AccountStatus.PENDING_GUARDIAN_CONSENT
              : AccountStatus.ACTIVE,
          playerProfile: {
            create: {
              displayName: user.display_name,
              dateOfBirth: new Date(`${user.date_of_birth}T00:00:00.000Z`),
              ageZone: user.age_zone as AgeZone,
              avatarId: user.avatar_crest,
              schoolName: user.school,
              stateCode: user.state,
              level: user.level,
              totalXp: user.xp,
              currentStreakDays: user.streak_days,
            },
          },
        },
      });

      await transaction.$executeRaw`
        INSERT INTO np_users (
          id, email, username, password_hash, salt, iterations,
          display_name, age, age_zone, school, state, avatar_crest,
          avatar_initials, role, level, xp, streak_days, failed_attempts,
          created_at, updated_at
        ) VALUES (
          ${user.id}, ${user.email}, ${user.username}, ${user.password_hash},
          ${user.salt}, ${user.iterations}, ${user.display_name}, ${user.age},
          ${user.age_zone}, ${user.school}, ${user.state}, ${user.avatar_crest},
          ${user.avatar_initials}, ${user.role}, ${user.level}, ${user.xp},
          ${user.streak_days}, ${user.failed_attempts},
          NOW(),
          NOW()
        )
      `;
      return canonicalUser.id;
    });

  }

  fallbackUsers.set(user.id, user);
  fallbackUsers.set(user.email, user);
  fallbackUsers.set(user.username, user);
  return user;
}

export async function createSession(session: DbSession): Promise<DbSession> {
  const hashedToken = hashSessionToken(session.session_token);
  const storedSession: DbSession = {
    ...session,
    id: /^[0-9a-f-]{36}$/i.test(session.id) ? session.id : randomUUID(),
    session_token: hashedToken,
  };

  if (isNeonConfigured) {
    try {
      await initTablesIfRemote();
      await prisma.$executeRaw`
        INSERT INTO np_sessions (id, user_id, session_token, expires_at, ip_address, user_agent, created_at)
        VALUES (${storedSession.id}, ${storedSession.user_id}, ${storedSession.session_token}, ${storedSession.expires_at}::timestamptz, ${storedSession.ip_address}, ${storedSession.user_agent}, NOW())
      `;
    } catch (e) {
      console.error("PostgreSQL session creation failed:", e);
      throw e;
    }
  }

  fallbackSessions.set(hashedToken, storedSession);
  return storedSession;
}

export async function findSession(token: string): Promise<DbSession | null> {
  if (!token || token.length < 16) return null;
  const hashedToken = hashSessionToken(token);

  if (isNeonConfigured) {
    try {
      await initTablesIfRemote();
      const rows = await prisma.$queryRaw<DbSession[]>`
        SELECT * FROM np_sessions 
        WHERE session_token = ${hashedToken} AND expires_at > NOW()
        LIMIT 1
      `;
      if (rows && rows.length > 0) return rows[0];
    } catch (e) {
      console.error("PostgreSQL session lookup failed:", e);
      throw e;
    }
  }

  const s = fallbackSessions.get(hashedToken);
  if (!s) return null;
  if (new Date(s.expires_at).getTime() < Date.now()) {
    fallbackSessions.delete(hashedToken);
    return null;
  }
  return s;
}

export async function deleteSession(token: string): Promise<void> {
  if (!token) return;
  const hashedToken = hashSessionToken(token);
  if (isNeonConfigured) {
    try {
      await prisma.$executeRaw`
        DELETE FROM np_sessions
        WHERE session_token = ${hashedToken} OR expires_at <= NOW()
      `;
    } catch (e) {
      console.error("PostgreSQL session deletion failed:", e);
      throw e;
    }
  }
  fallbackSessions.delete(hashedToken);
}

export async function logAuditEvent(log: Omit<DbAuditLog, "id" | "created_at">): Promise<void> {
  const item: DbAuditLog = {
    id: `log_${randomUUID()}`,
    ...log,
    created_at: new Date().toISOString(),
  };

  if (isNeonConfigured) {
    try {
      await initTablesIfRemote();
      await prisma.$executeRaw`
        INSERT INTO np_audit_logs (id, user_id, event_type, ip_address, details, created_at)
        VALUES (${item.id}, ${item.user_id}, ${item.event_type}, ${item.ip_address}, ${JSON.stringify(item.details)}, NOW())
      `;
    } catch (e) {
      console.warn("PostgreSQL audit log error:", e);
    }
  }

  fallbackAuditLogs.push(item);
  if (fallbackAuditLogs.length > 500) {
    fallbackAuditLogs.shift();
  }

  // Notify platform administrator email on all recorded activity without blocking request latency
  void notifyAdminOfActivity(item).catch((err) => {
    console.warn("Admin activity notification dispatch failed:", err);
  });
}

export async function getDbStatus() {
  let counts = {
    userCount: fallbackUsers.size,
    profileCount: 0,
    gameSessionCount: 0,
    gameScoreCount: 0,
    xpTransactionCount: 0,
    tournamentCount: 0,
    tournamentEntryCount: 0,
    sessionCount: fallbackSessions.size,
    auditLogCount: fallbackAuditLogs.length,
  };

  if (isNeonConfigured) {
    await initTablesIfRemote();
    const [databaseCounts] = await prisma.$queryRaw<
      Array<{
        userCount: number;
        profileCount: number;
        gameSessionCount: number;
        gameScoreCount: number;
        xpTransactionCount: number;
        tournamentCount: number;
        tournamentEntryCount: number;
        sessionCount: number;
        auditLogCount: number;
      }>
    >`
      SELECT
        (SELECT COUNT(*)::int FROM "User") AS "userCount",
        (SELECT COUNT(*)::int FROM "PlayerProfile") AS "profileCount",
        (SELECT COUNT(*)::int FROM "GameSession") AS "gameSessionCount",
        (SELECT COUNT(*)::int FROM "GameScore") AS "gameScoreCount",
        (SELECT COUNT(*)::int FROM "XPTransaction") AS "xpTransactionCount",
        (SELECT COUNT(*)::int FROM "Tournament") AS "tournamentCount",
        (SELECT COUNT(*)::int FROM "TournamentEntry") AS "tournamentEntryCount",
        (SELECT COUNT(*)::int FROM np_sessions) AS "sessionCount",
        (SELECT COUNT(*)::int FROM np_audit_logs) AS "auditLogCount"
    `;
    counts = databaseCounts;
  }

  return {
    provider: "PostgreSQL",
    isConfigured: isNeonConfigured,
    mode: isNeonConfigured ? "Remote PostgreSQL" : "PostgreSQL Standby (Local Memory)",
    ...counts,
    security: {
      pbkdf2Iterations: 100000,
      hashAlgorithm: "SHA-256",
      rateLimiter: "Sliding Window (5 attempts / 15m)",
      constantTimeComparison: true,
      sslRequired: true,
    },
  };
}

export async function getAdminLiveFeed() {
  if (!isNeonConfigured) {
    return {
      users: Array.from(fallbackUsers.values()).slice(0, 15).map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username,
        display_name: u.display_name,
        age: u.age,
        age_zone: u.age_zone,
        school: u.school,
        state: u.state,
        role: u.role,
        level: u.level,
        xp: u.xp,
        created_at: u.created_at,
      })),
      auditLogs: fallbackAuditLogs.slice(-25).reverse(),
    };
  }

  await initTablesIfRemote();
  const [users, auditLogs] = await Promise.all([
    prisma.$queryRaw`
      SELECT id, email, username, display_name, age, age_zone, school, state, role, level, xp, created_at
      FROM np_users
      ORDER BY created_at DESC
      LIMIT 25
    `,
    prisma.$queryRaw`
      SELECT id, user_id, event_type, ip_address, details, created_at
      FROM np_audit_logs
      ORDER BY created_at DESC
      LIMIT 30
    `,
  ]);

  return { users, auditLogs };
}

export async function getBlockedEntities(blockerUserId: string): Promise<string[]> {
  if (isNeonConfigured) {
    try {
      await initTablesIfRemote();
      const rows = await prisma.$queryRaw<Array<{ blocked_name: string }>>`
        SELECT blocked_name FROM np_blocked_users
        WHERE blocker_user_id = ${blockerUserId}
        ORDER BY created_at DESC
      `;
      return rows.map((r) => r.blocked_name);
    } catch (e) {
      console.warn("PostgreSQL blocked list lookup error:", e);
    }
  }
  return Array.from(fallbackBlockedEntities.get(blockerUserId) ?? []);
}

export async function blockEntity(
  blockerUserId: string,
  blockedName: string,
  reason = "User preference"
): Promise<string[]> {
  const cleanName = blockedName.trim().slice(0, 80);
  if (!cleanName) return getBlockedEntities(blockerUserId);

  if (isNeonConfigured) {
    try {
      await initTablesIfRemote();
      await prisma.$executeRaw`
        INSERT INTO np_blocked_users (id, blocker_user_id, blocked_name, reason, created_at)
        VALUES (${randomUUID()}, ${blockerUserId}, ${cleanName}, ${reason}, NOW())
        ON CONFLICT (blocker_user_id, blocked_name) DO NOTHING
      `;
      return getBlockedEntities(blockerUserId);
    } catch (e) {
      console.warn("PostgreSQL block insert error:", e);
    }
  }

  const set = fallbackBlockedEntities.get(blockerUserId) ?? new Set<string>();
  set.add(cleanName);
  fallbackBlockedEntities.set(blockerUserId, set);
  return Array.from(set);
}

export async function unblockEntity(
  blockerUserId: string,
  blockedName: string
): Promise<string[]> {
  const cleanName = blockedName.trim();
  if (isNeonConfigured) {
    try {
      await initTablesIfRemote();
      await prisma.$executeRaw`
        DELETE FROM np_blocked_users
        WHERE blocker_user_id = ${blockerUserId} AND blocked_name = ${cleanName}
      `;
      return getBlockedEntities(blockerUserId);
    } catch (e) {
      console.warn("PostgreSQL unblock delete error:", e);
    }
  }

  const set = fallbackBlockedEntities.get(blockerUserId);
  if (set) set.delete(cleanName);
  return Array.from(set ?? []);
}
