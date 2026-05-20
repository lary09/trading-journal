import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus, Upload } from "lucide-react"

import { auth } from "@/auth"
import { InteractiveCalendar } from "@/components/calendar/interactive-calendar"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { getTradesForUser } from "@/lib/data/trades"

export default async function CalendarPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  const trades = await getTradesForUser(session.user.id)

  return (
    <AppShell
      title="Calendar"
      cta={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" size="sm" asChild><Link href="/trades/new"><Plus className="mr-2 h-4 w-4" />New Trade</Link></Button>
          <Button size="sm" asChild><Link href="/imports"><Upload className="mr-2 h-4 w-4" />Import</Link></Button>
        </div>
      }
    >
      <section className="mb-6 grid gap-4 md:gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="terminal-panel px-4 py-5 md:px-6 md:py-6">
          <div className="terminal-kicker mb-2">Calendar Review</div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">Read performance in time, not just in totals.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Surface profitable and weak sessions by day so review becomes part of the routine.</p>
        </div>
        <div className="terminal-panel px-4 py-5 md:px-6 md:py-6">
          <div className="terminal-kicker mb-2">Daily executions</div>
          <div className="text-4xl font-semibold text-white">{trades.length}</div>
          <p className="mt-2 text-sm text-muted-foreground">Open and closed trades are included. Days with one trade open that trade directly.</p>
        </div>
      </section>
      <div className="w-full">
        <InteractiveCalendar trades={trades} />
      </div>
    </AppShell>
  )
}
