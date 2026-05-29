-- =============================================================================
-- Q Game - Schema (Phase 1)
-- =============================================================================
-- Paste this whole file into the Supabase SQL editor and run it once.
-- After this completes, paste and run `seed.sql` to load the 436 questions.
--
-- Re-running this file is safe: every CREATE uses IF NOT EXISTS and policies
-- are DROPped before re-creation.
-- =============================================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";   -- gen_random_uuid()


-- ── profiles ─────────────────────────────────────────────────────────────────
-- One row per signed-in user. Username is the public handle used for sending
-- questions to friends. Created by a trigger when a new auth.users row appears.
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (lower(username));

-- Username validity (3-20 chars, lowercase letters/numbers/underscores).
-- Nullable until the user picks one on first sign-in.
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9_]{3,20}$');


-- ── questions ────────────────────────────────────────────────────────────────
-- Seeded questions have created_by = NULL.
-- User-created questions (Phase 3) will set created_by to a real auth.users id.
create table if not exists public.questions (
  id           text primary key,
  category     text not null,
  text         text not null,
  tags         text[] not null default '{}',
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists questions_category_idx on public.questions (category);
create index if not exists questions_tags_idx on public.questions using gin (tags);


-- ── user_favorites ───────────────────────────────────────────────────────────
create table if not exists public.user_favorites (
  user_id     uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.questions(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, question_id)
);


-- ── user_answers ─────────────────────────────────────────────────────────────
create table if not exists public.user_answers (
  user_id     uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.questions(id) on delete cascade,
  text        text not null default '',
  choice      text,
  updated_at  timestamptz not null default now(),
  primary key (user_id, question_id)
);


-- ── user_custom_tags ─────────────────────────────────────────────────────────
create table if not exists public.user_custom_tags (
  user_id     uuid not null references auth.users(id) on delete cascade,
  slug        text not null,
  label       text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, slug)
);


-- ── user_question_tags ───────────────────────────────────────────────────────
-- Per-question tag overrides (when present, fully replaces question.tags
-- for that user on that question).
create table if not exists public.user_question_tags (
  user_id     uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.questions(id) on delete cascade,
  tag_slugs   text[] not null default '{}',
  updated_at  timestamptz not null default now(),
  primary key (user_id, question_id)
);


-- =============================================================================
-- Row-Level Security
-- =============================================================================

alter table public.profiles            enable row level security;
alter table public.questions           enable row level security;
alter table public.user_favorites      enable row level security;
alter table public.user_answers        enable row level security;
alter table public.user_custom_tags    enable row level security;
alter table public.user_question_tags  enable row level security;


-- ── profiles policies ────────────────────────────────────────────────────────
-- Anyone (including anon) can read a profile by username — needed so the
-- "send a question to @username" autocomplete works for signed-in users.
-- (We'll narrow this in Phase 2 if it ever feels too open.)
drop policy if exists profiles_read_all on public.profiles;
create policy profiles_read_all
  on public.profiles for select
  using (true);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ── questions policies ───────────────────────────────────────────────────────
-- Seeded questions (created_by IS NULL) are readable by anyone, including the
-- anon client used by guests. User-created questions are private to their
-- author for now; sharing them comes in Phase 2 via sent_questions.
drop policy if exists questions_read on public.questions;
create policy questions_read
  on public.questions for select
  using (created_by is null or auth.uid() = created_by);

drop policy if exists questions_insert_own on public.questions;
create policy questions_insert_own
  on public.questions for insert
  with check (auth.uid() = created_by);

drop policy if exists questions_update_own on public.questions;
create policy questions_update_own
  on public.questions for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

drop policy if exists questions_delete_own on public.questions;
create policy questions_delete_own
  on public.questions for delete
  using (auth.uid() = created_by);


-- ── per-user table policies (favorites, answers, custom_tags, question_tags) ─
-- Same shape for all four: user can do anything to rows where user_id = auth.uid().
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'user_favorites',
    'user_answers',
    'user_custom_tags',
    'user_question_tags'
  ]
  loop
    execute format('drop policy if exists %1$s_owner_select on public.%1$s', tbl);
    execute format('drop policy if exists %1$s_owner_insert on public.%1$s', tbl);
    execute format('drop policy if exists %1$s_owner_update on public.%1$s', tbl);
    execute format('drop policy if exists %1$s_owner_delete on public.%1$s', tbl);

    execute format($q$
      create policy %1$s_owner_select on public.%1$s
        for select using (auth.uid() = user_id)
    $q$, tbl);

    execute format($q$
      create policy %1$s_owner_insert on public.%1$s
        for insert with check (auth.uid() = user_id)
    $q$, tbl);

    execute format($q$
      create policy %1$s_owner_update on public.%1$s
        for update using (auth.uid() = user_id)
                  with check (auth.uid() = user_id)
    $q$, tbl);

    execute format($q$
      create policy %1$s_owner_delete on public.%1$s
        for delete using (auth.uid() = user_id)
    $q$, tbl);
  end loop;
end$$;


-- =============================================================================
-- Auto-create a profile row when a new auth.users row appears
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
