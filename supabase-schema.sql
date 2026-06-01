-- ============================================================
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- Drop old tables
drop table if exists game_sessions cascade;
drop table if exists round_bets cascade;
drop table if exists game_rounds cascade;

-- ── Game Rounds ──────────────────────────────────────────────
create table game_rounds (
  id              uuid default gen_random_uuid() primary key,
  round_id        text unique not null,
  status          text not null default 'waiting', -- waiting | active | finished | cancelled
  call_sequence   integer[] default '{}',
  start_time      timestamptz,
  total_pot       integer not null default 0,
  possible_win    integer not null default 0,
  player_count    integer not null default 0,
  winner_player_id text,
  winner_card_id  integer,
  winner_type     text,
  winner_payout   integer default 0,
  created_at      timestamptz default timezone('utc', now())
);

-- ── Round Bets ────────────────────────────────────────────────
create table round_bets (
  id          uuid default gen_random_uuid() primary key,
  round_id    text not null references game_rounds(round_id),
  player_id   text not null,
  card_ids    integer[] not null,
  bet_amount  integer not null,
  total_cost  integer not null,
  created_at  timestamptz default timezone('utc', now())
);

-- ── Trigger: auto-update pot & player count on every bet ─────
create or replace function update_round_stats()
returns trigger as $$
declare
  v_rid  text := coalesce(NEW.round_id, OLD.round_id);
  v_pot  integer;
  v_players integer;
begin
  select coalesce(sum(total_cost), 0), count(distinct player_id)
  into v_pot, v_players
  from round_bets
  where round_id = v_rid;

  update game_rounds
  set total_pot    = v_pot,
      possible_win = floor(v_pot * 0.9),
      player_count = v_players
  where round_id = v_rid;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

drop trigger if exists trg_bet_change on round_bets;
create trigger trg_bet_change
after insert or update or delete on round_bets
for each row execute function update_round_stats();

-- ── Row Level Security ────────────────────────────────────────
alter table game_rounds enable row level security;
alter table round_bets   enable row level security;

create policy "read_rounds"   on game_rounds for select using (true);
create policy "insert_rounds" on game_rounds for insert with check (true);
create policy "update_rounds" on game_rounds for update using (true);
create policy "all_bets"      on round_bets  for all    using (true) with check (true);

-- ── Wallets ───────────────────────────────────────────────────
drop table if exists wallets cascade;

create table wallets (
  player_id  text primary key,
  balance    integer not null default 500,
  updated_at timestamptz default timezone('utc', now())
);

alter table wallets enable row level security;
create policy "wallet_all" on wallets for all using (true) with check (true);

-- ── Enable Realtime ───────────────────────────────────────────
alter publication supabase_realtime add table game_rounds;
alter publication supabase_realtime add table round_bets;
