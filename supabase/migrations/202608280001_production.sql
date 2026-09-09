create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 160),
  created_at timestamptz not null default now()
);

create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient text not null check (char_length(btrim(recipient)) between 1 and 160),
  tags text[] not null default '{}' check (cardinality(tags) <= 10),
  body text not null check (char_length(btrim(body)) between 1 and 50000),
  released boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.candle_lights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  letter_id uuid not null references public.letters(id) on delete cascade,
  lit_at timestamptz not null default now()
);

create index if not exists letters_user_updated_idx on public.letters(user_id, updated_at desc);
create index if not exists memories_user_created_idx on public.memories(user_id, created_at desc);
create index if not exists candles_letter_idx on public.candle_lights(letter_id, lit_at desc);
create index if not exists candles_user_idx on public.candle_lights(user_id, lit_at desc);

alter table public.profiles enable row level security;
alter table public.letters enable row level security;
alter table public.memories enable row level security;
alter table public.candle_lights enable row level security;

drop policy if exists "profiles own" on public.profiles;
drop policy if exists "profiles select own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles select own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles update own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "letters own" on public.letters;
drop policy if exists "letters select own" on public.letters;
drop policy if exists "letters insert own" on public.letters;
drop policy if exists "letters update own" on public.letters;
drop policy if exists "letters delete own" on public.letters;
create policy "letters select own" on public.letters for select to authenticated using ((select auth.uid()) = user_id);
create policy "letters insert own" on public.letters for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "letters update own" on public.letters for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "letters delete own" on public.letters for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "memories own" on public.memories;
drop policy if exists "memories select own" on public.memories;
drop policy if exists "memories insert own" on public.memories;
drop policy if exists "memories delete own" on public.memories;
create policy "memories select own" on public.memories for select to authenticated using ((select auth.uid()) = user_id);
create policy "memories insert own" on public.memories for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "memories delete own" on public.memories for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "candles own" on public.candle_lights;
drop policy if exists "candles select own" on public.candle_lights;
drop policy if exists "candles insert own letter" on public.candle_lights;
drop policy if exists "candles delete own" on public.candle_lights;
create policy "candles select own" on public.candle_lights for select to authenticated using ((select auth.uid()) = user_id);
create policy "candles insert own letter" on public.candle_lights for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.letters
    where letters.id = candle_lights.letter_id
      and letters.user_id = (select auth.uid())
  )
);
create policy "candles delete own" on public.candle_lights for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 160))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

revoke all on function public.touch_updated_at() from public, anon, authenticated;

drop trigger if exists letters_touch_updated_at on public.letters;
create trigger letters_touch_updated_at before update on public.letters for each row execute function public.touch_updated_at();
