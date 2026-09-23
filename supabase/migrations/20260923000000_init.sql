-- Payment reminder system: schema.
-- Run in the Supabase SQL editor, or `supabase db push`.

create extension if not exists pgcrypto;

create table if not exists public.entries (
  id               uuid primary key default gen_random_uuid(),
  customer_name    text        not null check (length(trim(customer_name)) > 0),
  email            text        not null check (position('@' in email) > 1),
  amount           numeric(14,2) not null check (amount > 0),
  due_date         date        not null,
  status           text        not null default 'active'
                   check (status in ('active', 'paused', 'needs_attention', 'paid')),
  -- how many of the 4 stages have been sent; hard-capped at 4
  stages_sent      smallint    not null default 0 check (stages_sent between 0 and 4),
  last_sent_on     date,
  attention_reason text        check (attention_reason in ('sequence_complete', 'send_failed')),
  last_error       text,
  paid_at          timestamptz,
  paused_at        timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists entries_status_idx on public.entries (status);

create table if not exists public.reminder_log (
  id                  uuid primary key default gen_random_uuid(),
  entry_id            uuid        not null references public.entries (id) on delete cascade,
  stage               smallint    not null check (stage between 1 and 4),
  channel             text        not null default 'email',
  recipient           text        not null,
  status              text        not null check (status in ('sending', 'sent', 'failed', 'bounced')),
  provider_message_id text,
  error               text,
  run_date            date        not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- At most one in-flight or successful send per entry+stage: this is the
-- database-level guard against double-sending if two runs overlap.
create unique index if not exists reminder_log_one_live_send
  on public.reminder_log (entry_id, stage)
  where status in ('sending', 'sent');

create index if not exists reminder_log_entry_idx on public.reminder_log (entry_id, created_at desc);
create index if not exists reminder_log_provider_idx on public.reminder_log (provider_message_id);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists entries_touch on public.entries;
create trigger entries_touch before update on public.entries
  for each row execute function public.touch_updated_at();

drop trigger if exists reminder_log_touch on public.reminder_log;
create trigger reminder_log_touch before update on public.reminder_log
  for each row execute function public.touch_updated_at();

-- Lock the tables down: only the server (service role key) may touch them.
alter table public.entries enable row level security;
alter table public.reminder_log enable row level security;
