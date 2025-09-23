-- Clickstream table with required fields
create extension if not exists "pgcrypto";

create table if not exists public.clickstream (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  time timestamptz not null default now(),
  event_context text,
  component text,
  event_name text,
  description text,
  origin text,
  ip_address text,
  metadata jsonb
);

-- Highscores table for click-speed game
create table if not exists public.highscores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  score integer not null,
  created_at timestamptz default now()
);

-- Enable realtime replication (via Supabase dashboard also)
-- ALTER TABLE public.clickstream REPLICA IDENTITY FULL;
-- ALTER TABLE public.highscores REPLICA IDENTITY FULL;
