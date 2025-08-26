-- Create trades table with comprehensive trading data
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  strategy_id uuid references public.trading_strategies(id) on delete set null,
  
  -- Basic trade information
  symbol text not null,
  trade_type text not null check (trade_type in ('buy', 'sell', 'long', 'short')),
  market_type text not null check (market_type in ('forex', 'stocks', 'crypto', 'commodities', 'indices', 'futures', 'options')),
  
  -- Trade execution details
  entry_price numeric(15,8) not null check (entry_price > 0),
  exit_price numeric(15,8) check (exit_price > 0),
  quantity numeric(15,8) not null check (quantity > 0),
  
  -- Risk management
  stop_loss numeric(15,8) check (stop_loss > 0),
  take_profit numeric(15,8) check (take_profit > 0),
  risk_amount numeric(15,2) check (risk_amount >= 0),
  
  -- Trade outcome
  profit_loss numeric(15,2),
  profit_loss_percentage numeric(8,4),
  commission numeric(10,2) default 0,
  swap numeric(10,2) default 0,
  
  -- Trade timing
  entry_time timestamp with time zone not null,
  exit_time timestamp with time zone,
  
  -- Trade status and analysis
  status text not null check (status in ('open', 'closed', 'cancelled')) default 'open',
  trade_setup text, -- Description of the trade setup
  trade_outcome text, -- Analysis of what happened
  lessons_learned text, -- What was learned from this trade
  
  -- Emotional and psychological factors
  confidence_level integer check (confidence_level >= 1 and confidence_level <= 10),
  emotional_state text check (emotional_state in ('calm', 'excited', 'fearful', 'greedy', 'confident', 'uncertain')),
  
  -- Market conditions
  market_condition text check (market_condition in ('trending', 'ranging', 'volatile', 'calm')),
  news_impact text check (news_impact in ('none', 'low', 'medium', 'high')),
  
  -- Screenshots and attachments
  chart_screenshot_url text,
  additional_notes text,
  
  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.trades enable row level security;

-- Create RLS policies
create policy "trades_select_own"
  on public.trades for select
  using (auth.uid() = user_id);

create policy "trades_insert_own"
  on public.trades for insert
  with check (auth.uid() = user_id);

create policy "trades_update_own"
  on public.trades for update
  using (auth.uid() = user_id);

create policy "trades_delete_own"
  on public.trades for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger
create trigger trades_updated_at
  before update on public.trades
  for each row
  execute function public.handle_updated_at();

-- Create indexes for better performance
create index idx_trades_user_id on public.trades(user_id);
create index idx_trades_symbol on public.trades(symbol);
create index idx_trades_entry_time on public.trades(entry_time);
create index idx_trades_status on public.trades(status);
create index idx_trades_strategy_id on public.trades(strategy_id);
