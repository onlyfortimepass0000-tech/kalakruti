"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, createSessionToken, isValidSession, SESSION_COOKIE } from "@/lib/auth";
import { config, TOTAL_STAGES } from "@/lib/config";
import { isISODate } from "@/lib/dates";
import { runDailyCheck, type RunSummary } from "@/lib/runner";
import { getStore } from "@/lib/store";

export type ActionState = { error?: string; ok?: string } | undefined;

// Server actions are public POST endpoints — each one checks the session.
async function requireOwner() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!isValidSession(token)) redirect("/login");
}

function done() {
  revalidatePath("/");
  revalidatePath("/log");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEntryForm(form: FormData) {
  const customer_name = String(form.get("customer_name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const amount = Number(String(form.get("amount") ?? "").replace(/,/g, ""));
  const due_date = String(form.get("due_date") ?? "");
  if (!customer_name) return { error: "Customer name is required." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be greater than 0." };
  if (!isISODate(due_date)) return { error: "Pick a due date." };
  return { value: { customer_name, email, amount: Math.round(amount * 100) / 100, due_date } };
}

export async function addEntry(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireOwner();
  const parsed = parseEntryForm(form);
  if ("error" in parsed) return { error: parsed.error };
  await getStore().createEntry(parsed.value);
  done();
  return { ok: `Added ${parsed.value.customer_name}.` };
}

export async function editEntry(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireOwner();
  const id = String(form.get("id"));
  const parsed = parseEntryForm(form);
  if ("error" in parsed) return { error: parsed.error };
  const store = getStore();
  const current = await store.getEntry(id);
  if (!current) return { error: "Entry not found." };
  if (current.status === "paid") return { error: "Paid entries can't be edited. Undo paid first." };
  // Moving the due date mid-sequence would scramble the stage timing.
  if (current.stages_sent > 0 && parsed.value.due_date !== current.due_date) {
    return { error: "Due date can't change after reminders have started. Pause it, or mark paid and add a new entry." };
  }
  await store.updateEntry(id, parsed.value);
  done();
  return { ok: "Saved." };
}

export async function markPaid(id: string) {
  await requireOwner();
  await getStore().updateEntry(
    id,
    { status: "paid", paid_at: new Date().toISOString() },
    { status: ["active", "paused", "needs_attention"] },
  );
  done();
}

export async function undoPaid(id: string) {
  await requireOwner();
  const store = getStore();
  const e = await store.getEntry(id);
  if (!e || e.status !== "paid") return;
  const finished = e.stages_sent >= TOTAL_STAGES;
  await store.updateEntry(
    id,
    {
      status: finished ? "needs_attention" : "active",
      attention_reason: finished ? "sequence_complete" : null,
      paid_at: null,
    },
    { status: ["paid"] },
  );
  done();
}

export async function togglePause(id: string) {
  await requireOwner();
  const store = getStore();
  const e = await store.getEntry(id);
  if (!e) return;
  if (e.status === "active") {
    await store.updateEntry(id, { status: "paused", paused_at: new Date().toISOString() }, { status: ["active"] });
  } else if (e.status === "paused") {
    await store.updateEntry(id, { status: "active", paused_at: null }, { status: ["paused"] });
  }
  done();
}

/** After fixing a bad email address, put the entry back in the sequence. */
export async function resumeAfterFailure(id: string) {
  await requireOwner();
  await getStore().updateEntry(
    id,
    { status: "active", attention_reason: null, last_error: null },
    { status: ["needs_attention"] },
  );
  done();
}

export async function deleteEntry(id: string) {
  await requireOwner();
  const store = getStore();
  // Entries with send history are kept as the record in case of disputes.
  if ((await store.listSends({ entryId: id, limit: 1 })).length > 0) return;
  await store.deleteEntry(id);
  done();
}

export async function runNow(_prev: unknown, form: FormData): Promise<{ summary?: RunSummary; error?: string }> {
  await requireOwner();
  const simulated = String(form.get("simulate_date") ?? "");
  if (simulated) {
    if (config.emailMode !== "mock") return { error: "Date simulation is only available in mock (log-only) mode." };
    if (!isISODate(simulated)) return { error: "Invalid simulated date." };
  }
  const summary = await runDailyCheck(simulated ? { today: simulated } : {});
  done();
  return { summary };
}

export async function login(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!checkPassword(String(form.get("password") ?? ""))) return { error: "Wrong password." };
  const { value, maxAge } = createSessionToken();
  (await cookies()).set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/",
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
