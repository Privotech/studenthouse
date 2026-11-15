import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";
import { escapeHtml } from "@/lib/input-security";

export const DEFAULT_ADMIN_EMAIL = "jeonprivileged@gmail.com";

export type AdminNotificationStatus =
  | "SENT"
  | "QUEUED_NO_RESEND_KEY"
  | "SKIPPED_TEST_ENV"
  | "FAILED";

export interface AdminActivityPayload {
  id: string;
  user_id: string | null;
  event_type: string;
  ip_address: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AdminEmailDeliveryRecord {
  id: string;
  event_type: string;
  recipient: string;
  subject: string;
  status: AdminNotificationStatus;
  provider_message_id: string | null;
  error_message: string | null;
  created_at: string;
}

export type EmailSenderFn = (params: {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
}) => Promise<{ id: string | null; error: string | null }>;

const MAX_RECENT_DELIVERIES = 100;
const recentDeliveries: AdminEmailDeliveryRecord[] = [];
let outboxTableReady = false;

const SENSITIVE_KEY_PATTERN =
  /password|secret|token|salt|authorization|cookie|api_key|apikey/i;

export function getAdminNotificationEmail(): string {
  const configured = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
  if (configured && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configured)) {
    return configured.toLowerCase();
  }
  return DEFAULT_ADMIN_EMAIL;
}

export function getAdminNotificationFrom(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    "NaijaPlay Alerts <onboarding@resend.dev>"
  );
}

export function isAdminEmailDeliveryConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function redactSensitiveDetails(
  details: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      sanitized[key] = "[REDACTED]";
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = redactSensitiveDetails(value as Record<string, unknown>);
    } else if (typeof value === "string") {
      sanitized[key] = value.slice(0, 400);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function resolveActivityCategory(eventType: string): {
  category: string;
  accentColor: string;
} {
  if (
    eventType === "LOGIN_FAILURE" ||
    eventType === "RATE_LIMITED" ||
    eventType === "GAME_ANOMALY" ||
    eventType === "SAFETY_REPORT" ||
    eventType === "ADMIN_AUTH"
  ) {
    return { category: "SECURITY & SAFETY", accentColor: "#f43f5e" };
  }
  if (
    eventType === "REGISTER" ||
    eventType === "LOGIN_SUCCESS" ||
    eventType === "LOGOUT" ||
    eventType === "GUARDIAN_CONSENT" ||
    eventType === "PASSWORD_CHANGE"
  ) {
    return { category: "IDENTITY & AUTH", accentColor: "#10b981" };
  }
  if (
    eventType === "GAME_COMPLETED" ||
    eventType === "TOURNAMENT_ENTRY" ||
    eventType === "TOURNAMENT_QUALIFIER"
  ) {
    return { category: "NAIJAPLAY ARENA", accentColor: "#f59e0b" };
  }
  if (eventType.startsWith("SKILLQUEST_")) {
    return { category: "SKILLQUEST ACADEMY", accentColor: "#38bdf8" };
  }
  if (eventType.startsWith("TALENT_") || eventType === "CREATIVE_UPLOAD") {
    return { category: "TALENT & STUDIO", accentColor: "#a855f7" };
  }
  return { category: "ECOSYSTEM ACTIVITY", accentColor: "#34d399" };
}

export function formatActivityNotification(activity: AdminActivityPayload): {
  subject: string;
  text: string;
  html: string;
} {
  const { category, accentColor } = resolveActivityCategory(activity.event_type);
  const safeDetails = redactSensitiveDetails(activity.details || {});
  const detailsJson = JSON.stringify(safeDetails, null, 2);

  const subject = `[NaijaPlay · ${category}] ${activity.event_type}`;
  const text = [
    `NaijaPlay Ecosystem — Admin Activity Alert`,
    `Event: ${activity.event_type}`,
    `Category: ${category}`,
    `Audit ID: ${activity.id}`,
    `User ID: ${activity.user_id || "Anonymous / System"}`,
    `IP Address: ${activity.ip_address}`,
    `Timestamp: ${activity.created_at}`,
    ``,
    `Activity Details:`,
    detailsJson,
  ].join("\n");

  const html = `
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#0b111e;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#111827;border:1px solid #1e293b;border-radius:14px;overflow:hidden;">
      <div style="padding:18px 22px;border-bottom:1px solid #1e293b;background:#0f172a;">
        <span style="display:inline-block;padding:4px 10px;border-radius:6px;background:${accentColor}22;color:${accentColor};font-size:11px;font-weight:700;letter-spacing:0.06em;">
          ${escapeHtml(category)}
        </span>
        <h2 style="margin:10px 0 4px;font-size:18px;color:#ffffff;">
          ${escapeHtml(activity.event_type)}
        </h2>
        <p style="margin:0;font-size:12px;color:#94a3b8;">
          NaijaPlay Ecosystem Live Activity Notification
        </p>
      </div>
      <div style="padding:20px 22px;font-size:13px;line-height:1.6;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <tr>
            <td style="padding:6px 0;color:#94a3b8;width:130px;">Audit ID</td>
            <td style="padding:6px 0;color:#f8fafc;font-family:monospace;">${escapeHtml(activity.id)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#94a3b8;">User ID</td>
            <td style="padding:6px 0;color:#f8fafc;font-family:monospace;">${escapeHtml(activity.user_id || "Anonymous / System")}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#94a3b8;">Client IP</td>
            <td style="padding:6px 0;color:#f8fafc;font-family:monospace;">${escapeHtml(activity.ip_address)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#94a3b8;">Timestamp</td>
            <td style="padding:6px 0;color:#f8fafc;font-family:monospace;">${escapeHtml(activity.created_at)}</td>
          </tr>
        </table>
        <div style="background:#0b111e;border:1px solid #1e293b;border-radius:8px;padding:12px 14px;">
          <div style="font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:6px;text-transform:uppercase;">
            Sanitized Payload Details
          </div>
          <pre style="margin:0;white-space:pre-wrap;word-break:break-word;font-size:12px;color:#34d399;font-family:monospace;">${escapeHtml(detailsJson)}</pre>
        </div>
      </div>
    </div>
  </body>
</html>
`.trim();

  return { subject, text, html };
}

function getNeonConnection(): string | null {
  const url = process.env.DATABASE_URL || "";
  if (
    url &&
    !url.includes("localhost") &&
    (url.startsWith("postgres://") || url.startsWith("postgresql://"))
  ) {
    return url;
  }
  return null;
}

async function persistDeliveryRecord(record: AdminEmailDeliveryRecord): Promise<void> {
  recentDeliveries.unshift(record);
  if (recentDeliveries.length > MAX_RECENT_DELIVERIES) {
    recentDeliveries.length = MAX_RECENT_DELIVERIES;
  }

  const connectionString = getNeonConnection();
  if (!connectionString || process.env.VITEST) return;

  try {
    const sql = neon(connectionString);
    if (!outboxTableReady) {
      await sql`
        CREATE TABLE IF NOT EXISTS np_admin_email_notifications (
          id TEXT PRIMARY KEY,
          event_type TEXT NOT NULL,
          recipient TEXT NOT NULL,
          subject TEXT NOT NULL,
          status TEXT NOT NULL,
          provider_message_id TEXT,
          error_message TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
      outboxTableReady = true;
    }
    await sql`
      INSERT INTO np_admin_email_notifications (
        id, event_type, recipient, subject, status, provider_message_id, error_message, created_at
      ) VALUES (
        ${record.id}, ${record.event_type}, ${record.recipient}, ${record.subject},
        ${record.status}, ${record.provider_message_id}, ${record.error_message}, NOW()
      )
    `;
  } catch (err) {
    console.warn("Admin email notification outbox persistence skipped:", err);
  }
}

export async function getRecentAdminEmailDeliveries(): Promise<AdminEmailDeliveryRecord[]> {
  const connectionString = getNeonConnection();
  if (connectionString && !process.env.VITEST) {
    try {
      const sql = neon(connectionString);
      if (!outboxTableReady) {
        await sql`
          CREATE TABLE IF NOT EXISTS np_admin_email_notifications (
            id TEXT PRIMARY KEY,
            event_type TEXT NOT NULL,
            recipient TEXT NOT NULL,
            subject TEXT NOT NULL,
            status TEXT NOT NULL,
            provider_message_id TEXT,
            error_message TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `;
        outboxTableReady = true;
      }
      const rows = (await sql`
        SELECT id, event_type, recipient, subject, status, provider_message_id, error_message, created_at
        FROM np_admin_email_notifications
        ORDER BY created_at DESC
        LIMIT 30
      `) as AdminEmailDeliveryRecord[];
      return rows;
    } catch {
      return [...recentDeliveries].slice(0, 30);
    }
  }
  return [...recentDeliveries].slice(0, 30);
}

const defaultResendSender: EmailSenderFn = async ({
  from,
  to,
  subject,
  text,
  html,
}) => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { id: null, error: "RESEND_API_KEY is not configured." };
  }
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({ from, to, subject, text, html });
  if (result.error) {
    return { id: null, error: result.error.message || "Resend delivery failed." };
  }
  return { id: result.data?.id ?? null, error: null };
};

export async function notifyAdminOfActivity(
  activity: AdminActivityPayload,
  customSender?: EmailSenderFn,
): Promise<AdminEmailDeliveryRecord> {
  const recipient = getAdminNotificationEmail();
  const from = getAdminNotificationFrom();
  const { subject, text, html } = formatActivityNotification(activity);

  let status: AdminNotificationStatus = "QUEUED_NO_RESEND_KEY";
  let providerMessageId: string | null = null;
  let errorMessage: string | null = null;

  if (process.env.VITEST && !customSender) {
    status = "SKIPPED_TEST_ENV";
  } else if (!customSender && !isAdminEmailDeliveryConfigured()) {
    status = "QUEUED_NO_RESEND_KEY";
  } else {
    try {
      const sender = customSender ?? defaultResendSender;
      const res = await sender({
        from,
        to: [recipient],
        subject,
        text,
        html,
      });
      if (res.error) {
        status = "FAILED";
        errorMessage = res.error;
      } else {
        status = "SENT";
        providerMessageId = res.id;
      }
    } catch (err) {
      status = "FAILED";
      errorMessage = err instanceof Error ? err.message : "Email dispatch error";
    }
  }

  const record: AdminEmailDeliveryRecord = {
    id: `mail_${randomUUID()}`,
    event_type: activity.event_type,
    recipient,
    subject,
    status,
    provider_message_id: providerMessageId,
    error_message: errorMessage,
    created_at: new Date().toISOString(),
  };

  await persistDeliveryRecord(record);
  return record;
}
