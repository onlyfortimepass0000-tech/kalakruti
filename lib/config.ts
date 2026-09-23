/**
 * All tunables live here and read from env vars, so the schedule can be
 * adjusted in the hosting dashboard without a code change.
 */

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  /** Days before the due date that reminder #1 goes out. */
  get leadDays() {
    return Math.max(1, intEnv("REMINDER_LEAD_DAYS", 3));
  },
  /** Timezone that defines "today" for the business. */
  get timezone() {
    return process.env.APP_TIMEZONE || "Asia/Kolkata";
  },
  get currency() {
    return process.env.CURRENCY || "INR";
  },
  get businessName() {
    return process.env.BUSINESS_NAME || "Our team";
  },
  /** "Name <billing@yourdomain.com>" — must be on a Resend-verified domain. */
  get emailFrom() {
    return process.env.EMAIL_FROM || "";
  },
  get replyTo() {
    return process.env.EMAIL_REPLY_TO || "";
  },
  get resendApiKey() {
    return process.env.RESEND_API_KEY || "";
  },
  /**
   * "live" sends through Resend. Anything else uses the log-only mock sender.
   * Defaults to mock unless both a key and a from address are configured.
   */
  get emailMode(): "live" | "mock" {
    const mode = process.env.EMAIL_MODE;
    if (mode === "mock") return "mock";
    if (mode === "live") return "live";
    return this.resendApiKey && this.emailFrom ? "live" : "mock";
  },
};

/** Total reminders in the sequence. Fixed by the client — do not change. */
export const TOTAL_STAGES = 4;
