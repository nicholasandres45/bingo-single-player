-- Run this in your Supabase SQL editor

create table if not exists game_sessions (
  id uuid default gen_random_uuid() primary key,
  round_id text not null,
  bet_amount integer not null,
  card_count integer not null,
  status text not null default 'active', -- active | won | lost
  win_type text,
  payout integer default 0,
  call_count integer default 0,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Enable Row Level Security (open for now, lock down when wallet is connected)
alter table game_sessions enable row level security;

create policy "Allow all for now"
  on game_sessions
  for all
  using (true)
  with check (true);
