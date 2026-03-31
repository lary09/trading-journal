import { NormalizedTrade } from "./trades"

export interface AnalyticsSummary {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalPnL: number
  profitFactor: number
  expectancy: number
  largestWin: number
  largestLoss: number
  averageWin: number
  averageLoss: number
  averageR: number
  byDayOfWeek: Record<string, number>
  byHourOfDay: Record<string, number>
  bySetup: Record<string, { trades: number; pnl: number }>
  byMarket: Record<string, { trades: number; pnl: number }>
}

export function generateAnalytics(trades: NormalizedTrade[]): AnalyticsSummary {
  let winningTrades = 0
  let losingTrades = 0
  let totalPnL = 0
  let grossProfit = 0
  let grossLoss = 0
  let largestWin = 0
  let largestLoss = 0

  const byDayOfWeek: Record<string, number> = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  }

  const byHourOfDay: Record<string, number> = {}
  const bySetup: Record<string, { trades: number; pnl: number }> = {}
  const byMarket: Record<string, { trades: number; pnl: number }> = {}

  for (let i = 0; i <= 23; i++) {
    byHourOfDay[`${i.toString().padStart(2, "0")}:00`] = 0
  }

  trades.forEach((trade) => {
    const rawPnl = trade.profitLoss
    const pnl = rawPnl !== null && rawPnl !== undefined ? Number(rawPnl) : 0
    totalPnL += pnl

    if (pnl > 0) {
      winningTrades++
      grossProfit += pnl
      largestWin = Math.max(largestWin, pnl)
    } else if (pnl < 0) {
      losingTrades++
      grossLoss += Math.abs(pnl)
      largestLoss = Math.min(largestLoss, pnl)
    }

    // Temporal Grouping
    const date = new Date(trade.entryTime)
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" })
    const hourName = `${date.getHours().toString().padStart(2, "0")}:00`

    if (byDayOfWeek[dayName] !== undefined) {
      byDayOfWeek[dayName] += pnl
    }
    
    if (byHourOfDay[hourName] !== undefined) {
      byHourOfDay[hourName] += pnl
    }

    // Setup Grouping
    const setup = trade.tradeSetup || "Uncategorized"
    if (!bySetup[setup]) bySetup[setup] = { trades: 0, pnl: 0 }
    bySetup[setup].trades++
    bySetup[setup].pnl += pnl

    // Market Grouping
    const market = trade.marketType || "Unknown"
    if (!byMarket[market]) byMarket[market] = { trades: 0, pnl: 0 }
    byMarket[market].trades++
    byMarket[market].pnl += pnl
  })

  // Calculations
  const totalTrades = trades.length
  const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss
  const averageWin = winningTrades > 0 ? grossProfit / winningTrades : 0
  const averageLoss = losingTrades > 0 ? grossLoss / losingTrades : 0
  
  // Expectancy = (Win Rate x Average Win) - (Loss Rate x Average Loss)
  const lossRate = 1 - winRate
  const expectancy = (winRate * averageWin) - (lossRate * averageLoss)

  // Average R (Risk multiple). For simplification we'll use expectancy ratio here if risk is empty
  const averageR = averageLoss > 0 ? averageWin / averageLoss : 0

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    winRate: winRate * 100, // percentage string representation later
    totalPnL,
    profitFactor,
    expectancy,
    largestWin,
    largestLoss,
    averageWin,
    averageLoss,
    averageR,
    byDayOfWeek,
    byHourOfDay,
    bySetup,
    byMarket,
  }
}
