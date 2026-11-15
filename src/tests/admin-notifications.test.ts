import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_ADMIN_EMAIL,
  formatActivityNotification,
  getAdminNotificationEmail,
  notifyAdminOfActivity,
  redactSensitiveDetails,
} from "@/lib/admin-notifications";

describe("Admin Activity Email Notifications (jeonprivileged@gmail.com)", () => {
  const origAdminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  const origResendKey = process.env.RESEND_API_KEY;

  beforeEach(() => {
    delete process.env.ADMIN_NOTIFICATION_EMAIL;
    delete process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    if (origAdminEmail === undefined) delete process.env.ADMIN_NOTIFICATION_EMAIL;
    else process.env.ADMIN_NOTIFICATION_EMAIL = origAdminEmail;
    if (origResendKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = origResendKey;
  });

  it("defaults target admin email to jeonprivileged@gmail.com and respects valid env overrides", () => {
    expect(DEFAULT_ADMIN_EMAIL).toBe("jeonprivileged@gmail.com");
    expect(getAdminNotificationEmail()).toBe("jeonprivileged@gmail.com");

    process.env.ADMIN_NOTIFICATION_EMAIL = "Ops-Admin@NaijaPlay.ng";
    expect(getAdminNotificationEmail()).toBe("ops-admin@naijaplay.ng");

    process.env.ADMIN_NOTIFICATION_EMAIL = "not-an-email";
    expect(getAdminNotificationEmail()).toBe("jeonprivileged@gmail.com");
  });

  it("redacts sensitive credentials and escapes HTML/XSS payloads in email templates", () => {
    const redacted = redactSensitiveDetails({
      username: "tunde_99",
      password: "SuperSecretPassword!",
      secretKey: "PRIV_ADMIN",
      token: "abcdef123456",
      nested: { session_token: "rawtok", score: 900 },
    });

    expect(redacted.username).toBe("tunde_99");
    expect(redacted.password).toBe("[REDACTED]");
    expect(redacted.secretKey).toBe("[REDACTED]");
    expect(redacted.token).toBe("[REDACTED]");
    expect((redacted.nested as Record<string, unknown>).session_token).toBe("[REDACTED]");
    expect((redacted.nested as Record<string, unknown>).score).toBe(900);

    const formatted = formatActivityNotification({
      id: "log_xss_1",
      user_id: "<script>alert(1)</script>",
      event_type: "SAFETY_REPORT",
      ip_address: "197.210.1.2",
      details: { reason: `<img src=x onerror="alert(1)">` },
      created_at: "2026-11-15T00:00:00.000Z",
    });

    expect(formatted.subject).toContain("SECURITY & SAFETY");
    expect(formatted.subject).toContain("SAFETY_REPORT");
    expect(formatted.html).not.toContain("<script>");
    expect(formatted.html).not.toContain("<img src=x");
    expect(formatted.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("dispatches formatted activity alerts to jeonprivileged@gmail.com via custom/Resend sender", async () => {
    const mockSender = vi.fn(async () => ({ id: "email_msg_001", error: null }));

    const delivery = await notifyAdminOfActivity(
      {
        id: "log_act_42",
        user_id: "user_123",
        event_type: "GAME_COMPLETED",
        ip_address: "127.0.0.1",
        details: { gameSlug: "naija-trivia", score: 800, awardedXP: 90 },
        created_at: "2026-11-15T00:00:00.000Z",
      },
      mockSender,
    );

    expect(mockSender).toHaveBeenCalledTimes(1);
    expect(mockSender).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["jeonprivileged@gmail.com"],
        subject: "[NaijaPlay · NAIJAPLAY ARENA] GAME_COMPLETED",
      }),
    );
    expect(delivery.status).toBe("SENT");
    expect(delivery.recipient).toBe("jeonprivileged@gmail.com");
    expect(delivery.provider_message_id).toBe("email_msg_001");
  });

  it("handles email delivery failures gracefully without throwing and records FAILED status", async () => {
    const failingSender = vi.fn(async () => ({ id: null, error: "SMTP gateway unreachable" }));

    const delivery = await notifyAdminOfActivity(
      {
        id: "log_act_99",
        user_id: null,
        event_type: "REGISTER",
        ip_address: "10.0.0.1",
        details: { username: "ada_coder", ageZone: "TEEN" },
        created_at: "2026-11-15T00:00:00.000Z",
      },
      failingSender,
    );

    expect(delivery.status).toBe("FAILED");
    expect(delivery.error_message).toBe("SMTP gateway unreachable");
    expect(delivery.recipient).toBe("jeonprivileged@gmail.com");
  });
});
