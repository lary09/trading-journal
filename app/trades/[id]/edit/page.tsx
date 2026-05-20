import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { getStrategyById, getActiveStrategies } from "@/lib/data/strategies"
import { getTradeById } from "@/lib/data/trades"
import { NewTradeForm } from "@/app/trades/new/new-trade-form"

const toLocalDateTime = (value: Date | null) => {
  if (!value) return ""
  return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default async function EditTradePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const { id } = await params
  const [trade, strategies] = await Promise.all([
    getTradeById(id, session.user.id),
    getActiveStrategies(session.user.id),
  ])

  if (!trade) {
    redirect("/dashboard")
  }

  const currentStrategy = trade.strategyId ? await getStrategyById(session.user.id, trade.strategyId) : null
  const strategyOptions = currentStrategy && !strategies.find((strategy) => strategy.id === currentStrategy.id)
    ? [{ id: currentStrategy.id, name: currentStrategy.name }, ...strategies]
    : strategies

  return (
    <NewTradeForm
      mode="edit"
      strategies={strategyOptions}
      initialData={{
        id: trade.id,
        isTradeOpen: trade.status === "open",
        symbol: trade.symbol,
        tradeType: trade.tradeType,
        marketType: trade.marketType,
        strategyId: trade.strategyId ?? "",
        entryPrice: trade.entryPrice?.toString() ?? "",
        exitPrice: trade.exitPrice?.toString() ?? "",
        quantity: trade.quantity?.toString() ?? "",
        stopLoss: trade.stopLoss?.toString() ?? "",
        takeProfit: trade.takeProfit?.toString() ?? "",
        riskAmount: trade.riskAmount?.toString() ?? "",
        entryTime: toLocalDateTime(trade.entryTime),
        exitTime: toLocalDateTime(trade.exitTime),
        tradeSetup: trade.tradeSetup ?? "",
        tradeOutcome: trade.tradeOutcome ?? "",
        lessonsLearned: trade.lessonsLearned ?? "",
        confidenceLevel: trade.confidenceLevel ?? "",
        emotionalState: trade.emotionalState ?? "",
        marketCondition: trade.marketCondition ?? "",
        newsImpact: trade.newsImpact ?? "",
        additionalNotes: trade.additionalNotes ?? "",
      }}
    />
  )
}
