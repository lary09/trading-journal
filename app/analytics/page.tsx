import React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Target, TrendingUp, PieChart, Activity, DollarSign, BarChart4 } from "lucide-react"

import { auth } from "@/auth"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getClosedTradesWithPnL, NormalizedTrade } from "@/lib/data/trades"
import { generateAnalytics } from "@/lib/data/analytics"
import { PerformanceBarChart } from "@/components/charts/analytics-charts"

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  const closedTrades = await getClosedTradesWithPnL(session.user.id)
  
  if (closedTrades.length === 0) {
    return (
      <AppShell title="Advanced Analytics">
        <EmptyState />
      </AppShell>
    )
  }

  const analytics = generateAnalytics(closedTrades)

  // Map data to Recharts format
  const byDayData = Object.entries(analytics.byDayOfWeek).map(([name, pnl]) => ({ name: name.substring(0, 3), pnl }))
  const byHourData = Object.entries(analytics.byHourOfDay).filter(([_, pnl]) => pnl !== 0).map(([name, pnl]) => ({ name, pnl }))
  const bySetupData = Object.entries(analytics.bySetup).map(([name, data]) => ({ name, pnl: data.pnl }))

  return (
    <AppShell
      title="Advanced Analytics"
      cta={
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          label="Profit Factor" 
          value={analytics.profitFactor === Infinity ? "∞" : analytics.profitFactor.toFixed(2)} 
          description={analytics.profitFactor >= 2 ? "Excellent" : analytics.profitFactor > 1 ? "Profitable" : "Losing"}
          icon={<TrendingUp className="h-4 w-4" />} 
          tone={analytics.profitFactor > 1 ? "positive" : "negative"} 
        />
        <StatCard 
          label="Expectancy" 
          value={`$${analytics.expectancy.toFixed(2)}`} 
          description="Avg Return per Trade"
          icon={<Target className="h-4 w-4" />} 
          tone={analytics.expectancy >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Avg Win"
          value={`$${analytics.averageWin.toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4" />}
          tone="positive"
        />
        <StatCard 
          label="Avg Loss" 
          value={`-$${Math.abs(analytics.averageLoss).toFixed(2)}`} 
          icon={<Activity className="h-4 w-4" />}
          tone="negative"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <BarChart4 className="w-5 h-5 text-indigo-400" />
              P&L by Day of Week
            </CardTitle>
            <CardDescription className="text-slate-400">
              Discover your most profitable trading days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceBarChart data={byDayData} title="By Day" color="#10b981" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <BarChart4 className="w-5 h-5 text-indigo-400" />
              P&L by Hour of Day
            </CardTitle>
            <CardDescription className="text-slate-400">
              Optimize the time you spend executing trades.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceBarChart data={byHourData} title="By Hour" color="#3b82f6" />
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              Performance by Setup
            </CardTitle>
            <CardDescription className="text-slate-400">
              Identify which strategies are actually making you money.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bySetupData.length > 0 ? (
               <PerformanceBarChart data={bySetupData} title="By Setup" color="#8b5cf6" />
            ) : (
               <div className="h-64 flex items-center justify-center text-slate-500">
                 No setups recorded. Start tagging your trades.
               </div>
            )}
          </CardContent>
        </Card>
      </div>

    </AppShell>
  )
}

function StatCard({
  label,
  value,
  description,
  icon,
  tone = "neutral",
}: {
  label: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  tone?: "neutral" | "positive" | "negative"
}) {
  const color = tone === "positive" ? "text-emerald-400" : tone === "negative" ? "text-rose-400" : "text-slate-300"
  return (
    <Card className="bg-slate-900/60 border-slate-800 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        {icon && React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{className?: string}>, { className: "w-16 h-16" }) : icon}
      </div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-slate-400">{label}</CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className={`text-3xl font-bold tracking-tight ${color}`}>{value}</div>
        {description && <p className="text-xs text-slate-500 mt-2 font-medium">{description}</p>}
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="bg-slate-900/60 border-slate-800 max-w-2xl mx-auto mt-12">
      <CardContent className="py-16 text-center space-y-4">
        <PieChart className="h-16 w-16 text-slate-700 mx-auto" />
        <div className="text-xl font-medium text-white">Insufficient Data</div>
        <p className="text-slate-400 max-w-md mx-auto">
          You need closed tracking data capable of yielding advanced analytics. Record your first real executions.
        </p>
        <div className="pt-4">
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Link href="/trades/new">Log First Trade</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

