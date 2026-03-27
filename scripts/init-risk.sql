-- Risk rules table (run once in Neon)
create table if not exists risk_rules (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade unique,
  daily_loss_limit numeric(15,2),
  weekly_loss_limit numeric(15,2),
  max_risk_per_trade numeric(6,2),
  alerts_enabled boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
