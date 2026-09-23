/**
 * Single-owner password login. The cookie holds "<expiry>.<hmac>" signed with
 * SESSION_SECRET, so no session table is needed.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "pr_session";
const MAX_AGE_S = 60 * 60 * 24 * 30;

function secret() {
  return process.env.SESSION_SECRET || `pw:${process.env.ADMIN_PASSWORD ?? ""}`;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** "open" = no password configured and not production (local dev only). */
export function authMode(): "password" | "open" | "misconfigured" {
  if (process.env.ADMIN_PASSWORD) return "password";
  return process.env.NODE_ENV === "production" ? "misconfigured" : "open";
}

export function checkPassword(input: string) {
  const pw = process.env.ADMIN_PASSWORD;
  return !!pw && safeEqual(input, pw);
}

export function createSessionToken() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE_S);
  return { value: `${exp}.${sign(exp)}`, maxAge: MAX_AGE_S };
}

export function isValidSession(token: string | undefined) {
  if (authMode() === "open") return true;
  if (authMode() !== "password" || !token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !safeEqual(sig, sign(exp))) return false;
  return Number(exp) > Date.now() / 1000;
}
