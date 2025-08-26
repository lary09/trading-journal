-- Create trading strategies table
create table if not exists public.trading_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  risk_level text check (risk_level in ('low', 'medium', 'high')) default 'medium',
  max_risk_per_trade numeric(5,2) check (max_risk_per_trade >= 0 and max_risk_per_trade <= 100),
  target_profit_ratio numeric(5,2) check (target_profit_ratio > 0),
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.trading_strategies enable row level security;

-- Create RLS policies
create policy "strategies_select_own"
  on public.trading_strategies for select
  using (auth.uid() = user_id);

create policy "strategies_insert_own"
  on public.trading_strategies for insert
  with check (auth.uid() = user_id);

create policy "strategies_update_own"
  on public.trading_strategies for update
  using (auth.uid() = user_id);

create policy "strategies_delete_own"
  on public.trading_strategies for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger
create trigger strategies_updated_at
  before update on public.trading_strategies
  for each row
  execute function public.handle_updated_at();
