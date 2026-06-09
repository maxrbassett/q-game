-- =============================================================================
-- Q Game - Phase 3: turn sent_questions into a two-sided guessing game
-- =============================================================================
-- Paste this file into the Supabase SQL editor after phase2.sql.
-- Safe to re-run, and safe whether phase2's table already exists or not.
--
-- The game: A answers a question and sends it to B.
--   1. status = 'awaiting_b': B guesses A's answer, sees the reveal, then
--      answers it themselves.
--   2. status = 'awaiting_a': A sees what B guessed, then guesses B's answer
--      and sees the reveal.
--   3. status = 'complete': archived recap for both.
--
-- Correctness ("did they guess right?") is derived in the client from the
-- stored guess + actual answer, so there are no verdict columns here.
-- Fairness is honor-system for v1: the row is fully readable by both parties,
-- so the hidden-until-guessed reveal is enforced only in the UI.
-- =============================================================================


-- ── Table (fresh installs) ───────────────────────────────────────────────────
-- Existing installs already have this from phase2.sql; the ALTERs below bring
-- them up to the new shape.
create table if not exists public.sent_questions (
  id              uuid primary key default gen_random_uuid(),
  from_user_id    uuid references public.profiles(id) on delete set null,
  to_user_id      uuid not null references public.profiles(id) on delete cascade,
  question_id     text not null references public.questions(id) on delete cascade,
  note            text,
  sent_at         timestamptz not null default now(),
  constraint sent_questions_not_self check (from_user_id is null or from_user_id <> to_user_id)
);


-- ── New columns (existing installs) ──────────────────────────────────────────
alter table public.sent_questions
  add column if not exists status          text not null default 'awaiting_b',
  -- A's real answer, captured at send time and never changed afterward.
  add column if not exists a_answer_text    text,
  add column if not exists a_answer_choice  text,
  -- B's guess of A's answer (b_guess_skipped = true for skipped free-text guesses).
  add column if not exists b_guess_text     text,
  add column if not exists b_guess_choice   text,
  add column if not exists b_guess_skipped  boolean not null default false,
  -- B's real answer.
  add column if not exists b_answer_text    text,
  add column if not exists b_answer_choice  text,
  -- A's guess of B's answer.
  add column if not exists a_guess_text     text,
  add column if not exists a_guess_choice   text,
  add column if not exists a_guess_skipped  boolean not null default false,
  -- Turn transition timestamps.
  add column if not exists b_played_at      timestamptz,
  add column if not exists completed_at     timestamptz;

-- Constrain status to the three known states.
alter table public.sent_questions drop constraint if exists sent_questions_status_chk;
alter table public.sent_questions add constraint sent_questions_status_chk
  check (status in ('awaiting_b', 'awaiting_a', 'complete'));


-- ── Drop the old one-directional columns ─────────────────────────────────────
-- The Phase 2 inbox stored a single reply; the game model replaces it.
alter table public.sent_questions
  drop column if exists read_at,
  drop column if exists answered_at,
  drop column if exists answer_text,
  drop column if exists answer_choice;


-- ── Indexes ──────────────────────────────────────────────────────────────────
-- Old inbox/outbox indexes referenced answered_at (now dropped); replace them
-- with status-aware ones that back the "your turn" / "waiting" / archive lists.
drop index if exists public.sent_questions_inbox_idx;
drop index if exists public.sent_questions_outbox_idx;
create index if not exists sent_questions_recipient_idx
  on public.sent_questions (to_user_id, status, sent_at desc);
create index if not exists sent_questions_sender_idx
  on public.sent_questions (from_user_id, status, sent_at desc);


-- ── Immutability trigger ─────────────────────────────────────────────────────
-- Pins the structural columns AND A's answer (set at insert, fixed forever) so
-- neither party can rewrite them on update. Everything else (guesses, B's
-- answer, status, timestamps) is app-controlled under honor-system rules.
create or replace function public.sent_questions_pin_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.from_user_id is distinct from old.from_user_id
     or new.to_user_id is distinct from old.to_user_id
     or new.question_id is distinct from old.question_id
     or new.sent_at is distinct from old.sent_at
     or new.note is distinct from old.note
     or new.a_answer_text is distinct from old.a_answer_text
     or new.a_answer_choice is distinct from old.a_answer_choice then
    raise exception 'sent_questions: from_user_id, to_user_id, question_id, sent_at, note, and A''s answer are immutable';
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

-- Both players take turns now, so EITHER participant may update. (Phase 2 only
-- allowed the recipient.) The immutability trigger keeps the fixed columns safe.
drop policy if exists sent_questions_update_as_recipient on public.sent_questions;
drop policy if exists sent_questions_update_participants on public.sent_questions;
create policy sent_questions_update_participants
  on public.sent_questions for update
  using (auth.uid() = from_user_id or auth.uid() = to_user_id)
  with check (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- Either party can delete their own row.
drop policy if exists sent_questions_delete_participants on public.sent_questions;
create policy sent_questions_delete_participants
  on public.sent_questions for delete
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);


-- ── Realtime ─────────────────────────────────────────────────────────────────
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
