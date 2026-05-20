import React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Activity, ArrowLeft, BarChart4, DollarSign, PieChart, Target, TrendingUp } from "lucide-react"

import { auth } from "@/auth"
import { PerformanceBarChart } from "@/components/charts/analytics-charts"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { generateAnalytics } from "@/lib/data/analytics"
import { getClosedTradesWithPnL } from "@/lib/data/trades"

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  const closedTrades = await getClosedTradesWithPnL(session.user.id)
  if (closedTrades.length === 0) {
    return <AppShell title="Advanced Analytics"><EmptyState /></AppShell>
  }

  const analytics = generateAnalytics(closedTrades)
  const byDayData = Object.entries(analytics.byDayOfWeek).map(([name, pnl]) => ({ name: name.substring(0, 3), pnl }))
  const byHourData = Object.entries(analytics.byHourOfDay).filter(([, pnl]) => pnl !== 0).map(([name, pnl]) => ({ name, pnl }))
  const bySetupData = Object.entries(analytics.bySetup).map(([name, data]) => ({ name, pnl: data.pnl }))

  return (
    <AppShell
      title="Advanced Analytics"
      cta={<Button variant="outline" size="sm" asChild><Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>}
    >
      <section className="mb-8 grid gap-4 md:gap-6 md:grid-cols-[1.2fr_0.8fr] lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="terminal-panel py-6">
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="terminal-kicker mb-2">Advanced Review</div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">Where the edge shows up.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Break performance down by day, hour and setup to identify where your process is strongest.</p>
            </div>
            <div className="terminal-panel-muted px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Total closed trades</div>
              <div className="mt-2 text-3xl font-semibold text-white">{closedTrades.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="terminal-panel py-6">
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="terminal-kicker">Interpretation</div>
            <p>Use these views to narrow your playbook, cut weak setups and define when your edge is actually present.</p>
          </CardContent>
        </Card>
      </section>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Profit Factor" value={analytics.profitFactor === Infinity ? "∞" : analytics.profitFactor.toFixed(2)} description={analytics.profitFactor >= 2 ? "Excellent" : analytics.profitFactor > 1 ? "Profitable" : "Losing"} icon={<TrendingUp className="h-4 w-4" />} tone={analytics.profitFactor > 1 ? "positive" : "negative"} />
        <StatCard label="Expectancy" value={`$${analytics.expectancy.toFixed(2)}`} description="Avg Return per Trade" icon={<Target className="h-4 w-4" />} tone={analytics.expectancy >= 0 ? "positive" : "negative"} />
        <StatCard label="Avg Win" value={`$${analytics.averageWin.toFixed(2)}`} icon={<DollarSign className="h-4 w-4" />} tone="positive" />
        <StatCard label="Avg Loss" value={`-$${Math.abs(analytics.averageLoss).toFixed(2)}`} icon={<Activity className="h-4 w-4" />} tone="negative" />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-2">
        <AnalyticsPanel title="P&L by Day of Week" description="Discover your most profitable trading days." icon={<BarChart4 className="h-5 w-5 text-primary" />}>
          <PerformanceBarChart data={byDayData} title="By Day" color="#10b981" />
        </AnalyticsPanel>

        <AnalyticsPanel title="P&L by Hour of Day" description="Optimize the time you spend executing trades." icon={<BarChart4 className="h-5 w-5 text-accent" />}>
          <PerformanceBarChart data={byHourData} title="By Hour" color="#3b82f6" />
        </AnalyticsPanel>

        <AnalyticsPanel title="Performance by Setup" description="Identify which strategies are actually making you money." icon={<Target className="h-5 w-5 text-orange-400" />} className="lg:col-span-2">
          {bySetupData.length > 0 ? (
            <PerformanceBarChart data={bySetupData} title="By Setup" color="#8b5cf6" />
          ) : (
            <div className="flex h-64 items-center justify-center text-slate-500">No setups recorded. Start tagging your trades.</div>
          )}
        </AnalyticsPanel>
      </div>
    </AppShell>
  )
}

function AnalyticsPanel({ title, description, icon, className, children }: { title: string; description: string; icon: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <Card className={`terminal-panel ${className ?? ""}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-white">{icon}{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function StatCard({ label, value, description, icon, tone = "neutral" }: { label: string; value: string | number; description?: string; icon?: React.ReactNode; tone?: "neutral" | "positive" | "negative" }) {
  const color = tone === "positive" ? "text-emerald-400" : tone === "negative" ? "text-rose-400" : "text-slate-300"
  return (
    <Card className="terminal-panel group relative overflow-hidden py-5">
      <div className={`absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20 ${color}`}>
        {icon && React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-16 w-16" }) : icon}
      </div>
      <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">{label}</CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className={`text-3xl font-bold tracking-tight ${color}`}>{value}</div>
        {description && <p className="mt-2 text-xs font-medium text-slate-500">{description}</p>}
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="terminal-panel mx-auto mt-12 max-w-2xl">
      <CardContent className="space-y-4 py-16 text-center">
        <PieChart className="mx-auto h-16 w-16 text-slate-700" />
        <div className="text-xl font-medium text-white">Insufficient Data</div>
        <p className="mx-auto max-w-md text-slate-400">You need closed tracking data capable of yielding advanced analytics. Record your first real executions.</p>
        <div className="pt-4">
          <Button asChild><Link href="/trades/new">Log First Trade</Link></Button>
        </div>
      </CardContent>
    </Card>
  )
}
