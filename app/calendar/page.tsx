import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"
import { getClosedTradesWithPnL } from "@/lib/data/trades"
import { InteractiveCalendar } from "@/components/calendar/interactive-calendar"

export default async function CalendarPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  const trades = await getClosedTradesWithPnL(session.user.id)

  return (
    <AppShell
      title="Calendar"
      cta={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/trades/new">
              <Plus className="h-4 w-4 mr-2" />
              New Trade
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/imports">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Link>
          </Button>
        </div>
      }
    >
      <div className="w-full">
        <InteractiveCalendar trades={trades} />
      </div>
    </AppShell>
  )
}
