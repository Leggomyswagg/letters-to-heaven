create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient text not null,
  tags text[] not null default '{}',
  body text not null,
  released boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
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

alter table public.profiles enable row level security;
alter table public.letters enable row level security;
alter table public.memories enable row level security;
alter table public.candle_lights enable row level security;

drop policy if exists "profiles own" on public.profiles;
create policy "profiles own" on public.profiles for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "letters own" on public.letters;
create policy "letters own" on public.letters for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "memories own" on public.memories;
create policy "memories own" on public.memories for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "candles own" on public.candle_lights;
create policy "candles own" on public.candle_lights for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', '')) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists letters_touch_updated_at on public.letters;
create trigger letters_touch_updated_at before update on public.letters for each row execute function public.touch_updated_at();
