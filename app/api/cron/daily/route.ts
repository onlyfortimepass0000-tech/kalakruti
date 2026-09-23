import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { runDailyCheck } from "@/lib/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return header.length === expected.length && timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

/**
 * Called once a day by Vercel Cron (see vercel.json), or by any external
 * scheduler with `Authorization: Bearer $CRON_SECRET`. Safe to call more
 * often — extra calls on the same day do nothing new.
 */
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const summary = await runDailyCheck();
  const failed = summary.outcomes.filter((o) => o.action === "failed");
  if (failed.length) console.error(`[cron] ${failed.length} reminder(s) failed`, failed);
  return NextResponse.json(summary);
}

export const POST = GET;
