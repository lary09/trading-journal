-- Create views for performance analytics
create or replace view public.user_performance_summary as
select 
  user_id,
  count(*) as total_trades,
  count(*) filter (where status = 'closed' and profit_loss > 0) as winning_trades,
  count(*) filter (where status = 'closed' and profit_loss < 0) as losing_trades,
  count(*) filter (where status = 'closed' and profit_loss = 0) as breakeven_trades,
  round(
    (count(*) filter (where status = 'closed' and profit_loss > 0)::numeric / 
     nullif(count(*) filter (where status = 'closed'), 0) * 100), 2
  ) as win_rate_percentage,
  coalesce(sum(profit_loss) filter (where status = 'closed'), 0) as total_profit_loss,
  coalesce(avg(profit_loss) filter (where status = 'closed'), 0) as average_profit_loss,
  coalesce(max(profit_loss) filter (where status = 'closed'), 0) as best_trade,
  coalesce(min(profit_loss) filter (where status = 'closed'), 0) as worst_trade,
  coalesce(avg(profit_loss_percentage) filter (where status = 'closed'), 0) as average_return_percentage
from public.trades
where status in ('closed', 'open')
group by user_id;

-- Create monthly performance view
create or replace view public.monthly_performance as
select 
  user_id,
  date_trunc('month', entry_time) as month,
  count(*) as trades_count,
  count(*) filter (where status = 'closed' and profit_loss > 0) as winning_trades,
  round(
    (count(*) filter (where status = 'closed' and profit_loss > 0)::numeric / 
     nullif(count(*) filter (where status = 'closed'), 0) * 100), 2
  ) as win_rate,
  coalesce(sum(profit_loss) filter (where status = 'closed'), 0) as monthly_pnl
from public.trades
group by user_id, date_trunc('month', entry_time)
order by user_id, month desc;
