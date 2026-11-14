# Payment Reminders: what it does (overview)

A single-client system: one business owner tracks the customers who owe them money, and the system emails those customers polite reminders on a fixed schedule.

## In one sentence

The owner adds who owes what and by when; the system emails the customer before the due date, on it, and for two days after, then stops and flags the account so the owner can follow up personally. Everything (who is paid, who needs a call, who replied, what was sent) is on one dashboard.

## The problem it solves

Owners forget to chase payments, chase them at awkward times, or keep chasing someone who has already paid. This does the first, polite round of chasing automatically, stops the moment the owner says "paid", and tells the owner clearly when a human needs to step in.

## What happens, step by step

1. **The owner adds a customer** with four details: name, email, amount owed and due date. Nothing else is needed.
2. **A daily check runs by itself** (9:00 AM and a 3:00 PM safety run, India time) and decides which reminders are due.
3. **Reminders go out on a fixed schedule**: #1 three days before the due date, #2 on the due date, #3 the day after, #4 the day after that. All four use the same polite tone.
4. **Every send is recorded** in the send log: when, to whom, which reminder, and whether it worked.
5. **The owner stops it any time.** **Mark Paid** cancels all remaining reminders at once (with an Undo). **Pause** stops one customer without marking them paid, for example during a negotiation.
6. **After reminder #4, it stops sending.** The customer moves to **Needs Attention**, shown in red at the top of the dashboard, so the owner follows up personally.
7. **Problems and replies are flagged.** A bounced address or a refused send shows as Needs Attention with the reason. A customer's reply shows a **💬 Replied** badge and a banner on the dashboard.

## What each person sees

| Person | What they get |
|---|---|
| **Customer** | A short, polite reminder from the business name, with the amount and due date. They can reply to it. |
| **Business owner** | A dashboard with the big green **Mark Paid** button on every customer, a Pause switch, a send log, and flags for anyone who needs attention or has replied. Works on phone and desktop. |

## The dashboard

- **Needs Attention** (top, red): customers who got all 4 reminders and still haven't paid, or whose email failed or bounced. The count shows on load.
- **Reminders running**: who is at which of the 4 stages, and when the next reminder will go out.
- **Paused**: customers the owner has paused.
- **Paid**: resolved customers, for reference.
- **Send log**: every attempt, with the result and the exact reason when something failed.
- **Settings**: business name, sender address, reply-to address(es), the Resend email key, and bounce and reply tracking.
- **Daily check panel**: runs the check on demand, with a "pretend today is" date for demos in mock mode.

Sign-in is a single owner password. On phones the pages use a bottom tab bar (Home, Log, Settings).

## Adding a customer

Open the dashboard and use **Add outstanding payment**. The first reminder is scheduled automatically from the due date. Customers added late still get all four reminders, one per day, in order.

## Safety and privacy built in

- **Mark Paid is manual on purpose.** The system never guesses that someone has paid, so the owner is always the safety valve.
- **No duplicate sends.** At most one reminder per customer per day, and the database itself refuses a second send of the same reminder, even if two checks overlap.
- **No silent failures.** Refused or bounced emails are logged and flagged. Temporary errors retry on the next run; permanent ones (like a bad address) stop and ask for a fix.
- **Missed days catch up.** If a daily check is skipped, the next one sends the reminder that was missed. It never skips a stage and never sends several at once.
- **Locked-down data.** Every database request must carry a valid login or scheduler token, checked by the database itself. Without one, nothing is visible.
- **Forged webhooks are rejected.** Bounce and reply notices from Resend are signature-checked inside the database.
- **Secrets stay out of the code.** The password is stored hashed, and API keys and settings live in a private part of the database.
- **No AI anywhere.** Messages are a fixed template with the name, amount and date filled in.

## How emails are protected

The free Resend plan allows about 100 emails a day and 3,000 a month, which is plenty for one business. The sender is `billing@mail.atomz.online`, shown as "Payment Reminders" (or the client's name). Replies go to the owner's chosen address(es). Bounces and spam complaints are picked up by webhook and flagged on the customer. There is no automatic daily cap yet (see below).

## How it is built (short)

- **Next.js** web app hosted on **Vercel**, deployed automatically from the `main` branch.
- **Supabase** (Postgres) for data, with row-level security. Tables are prefixed `pr_`.
- **Supabase `pg_cron`** as the scheduler, calling the app twice a day.
- **Resend** for email, with signed webhooks for bounces and replies.
- The channel is a single `sendReminder()` function, so WhatsApp can be added later without a rewrite.
- 22 automated tests, plus live end-to-end tests of sending, bounce handling and the daily schedule.

## Where it stands today

- **Live** at `https://kalakruti-seven.vercel.app`.
- **Email sending works**: reminders go out from `billing@mail.atomz.online` and have been delivered to real inboxes, including a customer other than the owner.
- **Tested end to end**: the 4-stage schedule, no duplicates, Mark Paid, failed sends, bounces (via Resend's test address), the daily scheduler, and replies reaching the owner's inbox.
- **Bounce tracking is connected.** Reply flagging on the dashboard is built and tested in the database; turning it on for real needs three Resend steps listed on the Settings page.
- **Still to do before real use:** clear the demo and test customers, then add the real ones.

## What it does not do (yet)

- WhatsApp, SMS, or any channel other than email.
- Detect payments automatically. The owner marks paid by hand.
- Serve several clients from one system. This is a one-business build; another client means another copy.
- A daily send cap or an unsubscribe link in the email.
- Show the text of a customer's reply on the dashboard. Replies are read in the owner's inbox; the dashboard only flags them.
- Import a customer list or connect to accounting software.
- Editing the email wording, currency, timezone or "days before" from the Settings page. Those are set in code and default to ₹, India time and 3 days.

## Files in this repository

| File | What it is |
|---|---|
| `OVERVIEW.md` | This page. |
| `README.md` | Short developer guide and deployment notes. |
| `supabase/migrations/` | The database setup, in order. |
| `lib/` | The schedule rules, the daily check, the email sender and settings. |
| `app/` | The dashboard, send log, settings, login and the cron and webhook routes. |
| `tests/` | The automated checks. |
