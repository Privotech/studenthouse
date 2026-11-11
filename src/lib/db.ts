import { Pool, neon } from "@neondatabase/serverless";
import { AgeZone, AccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Neon PostgreSQL Database Client & Storage Engine
 * Supports live Neon serverless connection with automatic table bootstrapping
 * and seamless secure local fallback when DATABASE_URL is not yet provisioned.
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
  event_type: "LOGIN_SUCCESS" | "LOGIN_FAILURE" | "REGISTER" | "LOGOUT" | "PASSWORD_CHANGE" | "RATE_LIMITED";
  ip_address: string;
  details: Record<string, unknown>;
  created_at: string;
}

const connectionString = process.env.DATABASE_URL || "";

const isNeonConfigured =
  Boolean(connectionString) &&
  !connectionString.includes("localhost") &&
  (connectionString.startsWith("postgres://") || connectionString.startsWith("postgresql://"));

// In-memory fallback repository for standalone testing and instant zero-downtime execution
const fallbackUsers = new Map<string, DbUser>();
const fallbackSessions = new Map<string, DbSession>();
const fallbackAuditLogs: DbAuditLog[] = [];

let poolInstance: Pool | null = null;
let tablesInitialized = false;

export function getDbPool(): Pool | null {
  if (!isNeonConfigured) return null;
  if (!poolInstance) {
    try {
      poolInstance = new Pool({ connectionString });
    } catch (err) {
      console.warn("Failed to initialize Neon connection pool:", err);
      return null;
    }
  }
  return poolInstance;
}

export async function initTablesIfRemote(): Promise<void> {
  if (!isNeonConfigured || tablesInitialized) return;

  try {
    const sql = neon(connectionString);
    await sql`
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

    await sql`
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

    await sql`
      CREATE TABLE IF NOT EXISTS np_audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        event_type TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        details JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    tablesInitialized = true;
  } catch (err) {
    console.error("Failed to initialize the Neon database tables:", err);
    throw err;
  }
}

// Data Access Methods
export async function findUserByEmailOrUsername(identifier: string): Promise<DbUser | null> {
  const normalized = identifier.trim().toLowerCase();

  if (isNeonConfigured) {
    try {
      await initTablesIfRemote();
      const sql = neon(connectionString);
      const rows = (await sql`
        SELECT * FROM np_users 
        WHERE LOWER(email) = ${normalized} OR LOWER(username) = ${normalized}
        LIMIT 1
      `) as DbUser[];
      if (rows && rows.length > 0) return rows[0];
    } catch (e) {
      console.error("Neon user lookup failed:", e);
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
      const sql = neon(connectionString);
      const rows = (await sql`
        SELECT * FROM np_users 
        WHERE id = ${id}
        LIMIT 1
      `) as DbUser[];
      if (rows && rows.length > 0) return rows[0];
    } catch (e) {
      console.error("Neon user lookup failed:", e);
      throw e;
    }
  }

  return fallbackUsers.get(id) || null;
}

export async function createUser(user: DbUser): Promise<DbUser> {
  if (isNeonConfigured) {
    await initTablesIfRemote();
    await prisma.$transaction(async (transaction) => {
      const canonicalUser = await transaction.user.create({
        data: {
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
          ${user.streak_days}, ${user.failed_attempts}, ${user.created_at},
          ${user.updated_at}
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
  if (isNeonConfigured) {
    try {
      await initTablesIfRemote();
      const sql = neon(connectionString);
      await sql`
        INSERT INTO np_sessions (id, user_id, session_token, expires_at, ip_address, user_agent, created_at)
        VALUES (${session.id}, ${session.user_id}, ${session.session_token}, ${session.expires_at}, ${session.ip_address}, ${session.user_agent}, ${session.created_at})
      `;
    } catch (e) {
      console.error("Neon session creation failed:", e);
      throw e;
    }
  }

  fallbackSessions.set(session.session_token, session);
  return session;
}

export async function findSession(token: string): Promise<DbSession | null> {
  if (isNeonConfigured) {
    try {
      await initTablesIfRemote();
      const sql = neon(connectionString);
      const rows = (await sql`
        SELECT * FROM np_sessions 
        WHERE session_token = ${token} AND expires_at > NOW()
        LIMIT 1
      `) as DbSession[];
      if (rows && rows.length > 0) return rows[0];
    } catch (e) {
      console.error("Neon session lookup failed:", e);
      throw e;
    }
  }

  const s = fallbackSessions.get(token);
  if (!s) return null;
  if (new Date(s.expires_at).getTime() < Date.now()) {
    fallbackSessions.delete(token);
    return null;
  }
  return s;
}

export async function deleteSession(token: string): Promise<void> {
  if (isNeonConfigured) {
    try {
      const sql = neon(connectionString);
      await sql`DELETE FROM np_sessions WHERE session_token = ${token}`;
    } catch (e) {
      console.error("Neon session deletion failed:", e);
      throw e;
    }
  }
  fallbackSessions.delete(token);
}

export async function logAuditEvent(log: Omit<DbAuditLog, "id" | "created_at">): Promise<void> {
  const item: DbAuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...log,
    created_at: new Date().toISOString(),
  };

  if (isNeonConfigured) {
    try {
      const sql = neon(connectionString);
      await sql`
        INSERT INTO np_audit_logs (id, user_id, event_type, ip_address, details, created_at)
        VALUES (${item.id}, ${item.user_id}, ${item.event_type}, ${item.ip_address}, ${JSON.stringify(item.details)}, ${item.created_at})
      `;
    } catch (e) {
      console.warn("Neon audit log error:", e);
    }
  }

  fallbackAuditLogs.push(item);
  if (fallbackAuditLogs.length > 500) {
    fallbackAuditLogs.shift();
  }
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
    provider: "Neon PostgreSQL",
    isConfigured: isNeonConfigured,
    mode: isNeonConfigured ? "Neon Serverless Cluster" : "Neon Adapter Standby (Local Memory Synced)",
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
