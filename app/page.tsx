import { redirect } from "next/navigation"
import Link from "next/link"
import { Activity, ArrowUpRight, BarChart3, CandlestickChart, Shield, Target, TrendingUp } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth/session"

export default async function HomePage() {
  const session = await getSession()

  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="terminal-shell min-h-screen">
      <div className="container mx-auto px-4 py-6 md:px-8 lg:px-12">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-border/70 bg-black/20 px-4 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between md:mb-10 md:rounded-3xl md:px-5">
          <div className="min-w-0">
            <div className="terminal-kicker mb-1">Trading Journal</div>
            <div className="text-base font-semibold text-white md:text-lg">Terminal-grade execution review</div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="ghost" className="hidden md:inline-flex">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </header>

        <section className="mb-8 grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="terminal-panel overflow-hidden p-5 sm:p-8 md:p-10">
            <div className="terminal-kicker mb-4">Professional workflow</div>
            <h1 className="max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl md:text-6xl">
              Replace spreadsheet chaos with a trading desk built for review, discipline and repeatability.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Log trades, inspect your edge, track execution quality and turn daily data into a repeatable process.
              Built like a terminal, not a generic dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/auth/signup">
                  Launch Workspace
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/login">Open Existing Account</Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-3 md:grid-cols-3">
              <MetricChip label="Execution review" value="Structured" />
              <MetricChip label="Risk visibility" value="Daily / weekly" />
              <MetricChip label="Strategy audit" value="Journal-backed" />
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="terminal-panel-muted border-primary/20 bg-primary/[0.07] py-5">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 p-2 text-primary">
                    <CandlestickChart className="h-5 w-5" />
                  </div>
                  Precision over clutter
                </CardTitle>
                <CardDescription>
                  A focused cockpit for trade review, performance patterns and behavioral discipline.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="terminal-panel py-5">
              <CardHeader>
                <CardTitle className="text-white">What changes when you journal properly</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3"><Activity className="mt-0.5 h-4 w-4 text-accent" />You stop measuring only P&amp;L and start measuring decision quality.</div>
                <div className="flex items-start gap-3"><TrendingUp className="mt-0.5 h-4 w-4 text-primary" />You find where your edge actually lives by day, setup and market.</div>
                <div className="flex items-start gap-3"><Shield className="mt-0.5 h-4 w-4 text-emerald-400" />You enforce risk before the session deteriorates.</div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <FeatureCard icon={<TrendingUp className="mb-2 h-8 w-8 text-primary" />} title="Performance Tracking" description="Monitor your win rate, profit/loss, and trading performance with detailed analytics." />
          <FeatureCard icon={<Shield className="mb-2 h-8 w-8 text-emerald-400" />} title="Risk Management" description="Track stop losses, take profits, and risk-reward ratios to improve your trading discipline." />
          <FeatureCard icon={<BarChart3 className="mb-2 h-8 w-8 text-accent" />} title="Advanced Analytics" description="Visualize your trading data with charts, graphs, and comprehensive performance reports." />
          <FeatureCard icon={<Target className="mb-2 h-8 w-8 text-orange-400" />} title="Strategy Development" description="Create and test trading strategies, track their performance, and refine your approach." />
        </section>

        <section className="pb-10">
          <Card className="terminal-panel mx-auto max-w-4xl overflow-hidden py-8">
            <CardHeader>
              <div className="terminal-kicker">Start clean</div>
            <CardTitle className="text-2xl text-white md:text-3xl">Build a sharper review loop before the next session opens.</CardTitle>
              <CardDescription>
                Create your workspace, import your trades and start building an evidence-based process.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Button asChild size="lg">
                <Link href="/auth/signup">Start Workspace</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-black/20 px-4 py-4 backdrop-blur-sm">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <Card className="terminal-panel py-5">
      <CardHeader>
        {icon}
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  )
}
