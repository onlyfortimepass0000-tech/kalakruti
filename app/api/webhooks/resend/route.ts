/**
 * Resend delivery webhooks. Bounces happen after Resend has accepted the
 * email, so this is how a bounced address reaches the log and the dashboard.
 * Configure in Resend → Webhooks: URL = <app>/api/webhooks/resend, events
 * email.bounced (+ email.complained), and put the signing secret in
 * RESEND_WEBHOOK_SECRET.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Svix signature check (the scheme Resend webhooks use). */
function verify(body: string, headers: Headers, secret: string) {
  const id = headers.get("svix-id");
  const ts = headers.get("svix-timestamp");
  const sigs = headers.get("svix-signature");
  if (!id || !ts || !sigs) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 5 * 60) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = Buffer.from(createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64"));
  return sigs.split(" ").some((part) => {
    const sig = Buffer.from(part.split(",")[1] ?? "");
    return sig.length === expected.length && timingSafeEqual(sig, expected);
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  const body = await req.text();
  if (!verify(body, req.headers, secret)) return NextResponse.json({ error: "bad signature" }, { status: 401 });

  const event = JSON.parse(body) as { type: string; data?: { email_id?: string; bounce?: { message?: string } } };
  if (event.type !== "email.bounced" && event.type !== "email.complained") return NextResponse.json({ ok: true });

  const store = getStore();
  const log = event.data?.email_id ? await store.findSendByProviderId(event.data.email_id) : null;
  if (!log) return NextResponse.json({ ok: true, matched: false });

  const reason =
    event.type === "email.bounced"
      ? `Bounced: ${event.data?.bounce?.message ?? "recipient address rejected"}`
      : "Recipient marked the email as spam";
  await store.updateSend(log.id, { status: "bounced", error: reason });
  await store.updateEntry(
    log.entry_id,
    { status: "needs_attention", attention_reason: "send_failed", last_error: reason },
    { status: ["active", "needs_attention"] },
  );
  return NextResponse.json({ ok: true, matched: true });
}
