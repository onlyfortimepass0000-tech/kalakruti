# Payment Reminders

Track customers who owe you money. The app emails them reminders on a fixed schedule, and flags anyone still unpaid after the last reminder so you can follow up yourself.

Built with Next.js 16, Supabase and Resend. It uses no AI APIs.

## How it works

| Reminder | When | 
|---|---|
| #1 | `REMINDER_LEAD_DAYS` before the due date (default 3) |
| #2 | On the due date |
| #3 | Due date + 1 |
| #4 | Due date + 2 |
| After #4 | Automatic reminders stop. The entry moves to **Needs Attention** |

- **Mark Paid** (the big green button on every entry) cancels all remaining reminders immediately. An *Undo* toast covers mis-taps.
- **Pause** is a one-tap switch that stops reminders for one entry without marking it paid. Use it during a negotiation or dispute, or when you've agreed a new date.
- **Catch-up:** a daily run sends at most one reminder per entry, and only the next unsent one. If a run is missed, the next run sends the stage that was skipped, and the rest of the sequence moves back by the same number of days. No stage is ever skipped, and no customer gets several reminders at once.
- **No double sends:** every attempt first claims a row in `reminder_log`. A unique index allows only one live send per entry and stage, so overlapping runs can't send the same reminder twice.
- **Failures are recorded:**
  - Every attempt is written to the **Send log** page.
  - An invalid address (Resend 4xx), or a bounce reported by webhook, moves the entry to Needs Attention and labels it **Email failed**. Fix the address and press **Retry**.
  - Temporary errors (network, 5xx) leave the entry active and are retried on the next run.

## Run locally (no keys needed)

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # schedule + runner tests
```

With no env vars set, data goes to `.data/db.json` and emails are only logged (mock mode). In mock mode you can use the **Pretend today is** date field next to *Run daily check now* to step through the whole sequence.

## Deploy (Vercel + Supabase + Resend)

1. **Supabase:** create a project and run `supabase/migrations/20260923000000_init.sql` in the SQL editor. Copy the project URL and the **service role** key.
2. **Resend:** verify your sending domain and create an API key. Optional: add a webhook to `https://<your-app>/api/webhooks/resend` for `email.bounced` and `email.complained`, then copy its signing secret.
3. **Vercel:** import the repo and set these env vars (see `.env.example`):
   `ADMIN_PASSWORD`, `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `BUSINESS_NAME`, and optionally `RESEND_WEBHOOK_SECRET`, `EMAIL_REPLY_TO`, `REMINDER_LEAD_DAYS`, `APP_TIMEZONE`, `CURRENCY`.
4. `vercel.json` runs `/api/cron/daily` every day at 03:30 UTC (09:00 IST). Any other scheduler works too: call `GET /api/cron/daily` with `Authorization: Bearer $CRON_SECRET`.

**Never commit API keys.** Put them only in the Vercel / `.env.local` environment.

## Adding WhatsApp later

All sending goes through `sendReminder(entry, stage)` in `lib/channels/index.ts`. To add WhatsApp:

1. Add a `phone` column.
2. Write `lib/channels/whatsapp.ts` so it returns the same `SendResult` shape.
3. Decide in `sendReminder` whether to send on both channels, or WhatsApp first with email as a fallback.

`reminder_log` already has a `channel` column.

## Layout

```
lib/schedule.ts        pure schedule rules (tested)
lib/runner.ts          the daily check
lib/channels/          sendReminder abstraction + Resend email sender
lib/store/             Supabase store + local JSON demo store
app/                   dashboard, send log, login, cron + webhook routes
supabase/migrations/   database schema
```
