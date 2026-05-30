-- =============================================================================
-- Q Game - Phase 2 schema additions (sent_questions / inbox)
-- =============================================================================
-- Paste this file into the Supabase SQL editor after Phase 1's schema.sql is
-- in place. Safe to re-run.
-- =============================================================================


-- ── sent_questions ───────────────────────────────────────────────────────────
-- FK to profiles (not auth.users) so PostgREST can join sender/recipient
-- usernames directly. profiles.id is 1:1 with auth.users.id, so cascade
-- behavior is preserved transitively.
create table if not exists public.sent_questions (
  id              uuid primary key default gen_random_uuid(),
  from_user_id    uuid references public.profiles(id) on delete set null,
  to_user_id      uuid not null references public.profiles(id) on delete cascade,
  question_id     text not null references public.questions(id) on delete cascade,
  note            text,
  sent_at         timestamptz not null default now(),
  read_at         timestamptz,
  answered_at     timestamptz,
  answer_text     text,
  answer_choice   text,
  -- Block self-sends at the schema level so a buggy client can't ever insert one.
  constraint sent_questions_not_self check (from_user_id is null or from_user_id <> to_user_id)
);

create index if not exists sent_questions_inbox_idx
  on public.sent_questions (to_user_id, answered_at, sent_at desc);
create index if not exists sent_questions_outbox_idx
  on public.sent_questions (from_user_id, sent_at desc);


-- ── Immutability trigger ─────────────────────────────────────────────────────
-- RLS UPDATE policies can't enforce per-column rules cleanly, so a BEFORE
-- UPDATE trigger pins the columns that should never change after insert.
create or replace function public.sent_questions_pin_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.from_user_id is distinct from old.from_user_id
     or new.to_user_id is distinct from old.to_user_id
     or new.question_id is distinct from old.question_id
     or new.sent_at is distinct from old.sent_at
     or new.note is distinct from old.note then
    raise exception 'sent_questions: from_user_id, to_user_id, question_id, sent_at, and note are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists sent_questions_pin_immutable_trg on public.sent_questions;
create trigger sent_questions_pin_immutable_trg
  before update on public.sent_questions
  for each row execute function public.sent_questions_pin_immutable();


-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.sent_questions enable row level security;

-- Sender or recipient can read their own row.
drop policy if exists sent_questions_read_participants on public.sent_questions;
create policy sent_questions_read_participants
  on public.sent_questions for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- Only the sender can insert, and only as themselves.
drop policy if exists sent_questions_insert_as_sender on public.sent_questions;
create policy sent_questions_insert_as_sender
  on public.sent_questions for insert
  with check (auth.uid() = from_user_id);

-- Only the recipient can update (answering + marking read). The immutability
-- trigger above prevents them from tampering with sender/question/sent_at.
drop policy if exists sent_questions_update_as_recipient on public.sent_questions;
create policy sent_questions_update_as_recipient
  on public.sent_questions for update
  using (auth.uid() = to_user_id)
  with check (auth.uid() = to_user_id);

-- Either party can delete their own row.
drop policy if exists sent_questions_delete_participants on public.sent_questions;
create policy sent_questions_delete_participants
  on public.sent_questions for delete
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);


-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Add the table to the realtime publication so badge updates push live.
-- (Wrapped in a do block because adding a table that's already a member errors.)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sent_questions'
  ) then
    alter publication supabase_realtime add table public.sent_questions;
  end if;
end$$;
