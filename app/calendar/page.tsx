import Link from "next/link"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Plus, Upload } from "lucide-react"

export default function CalendarPage() {
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-slate-900/60 border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Upcoming</CardTitle>
            <CardDescription className="text-slate-400">
              Sync earnings dates, economic releases, and your planned trades.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-96 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-slate-500">
            <div className="flex flex-col items-center gap-2">
              <CalendarIcon className="h-10 w-10" />
              <p>No events yet. Connect a broker or add a manual entry.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Daily Checklist</CardTitle>
            <CardDescription className="text-slate-400">Stay consistent with pre‑trade habits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <ChecklistItem text="Review overnight news" />
            <ChecklistItem text="Mark key levels" />
            <ChecklistItem text="Set alerts on watchlist" />
            <ChecklistItem text="Journal yesterday's trades" />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function ChecklistItem({ text }: { text: string }) {
  return <div className="rounded-md border border-slate-800/60 px-3 py-2 bg-slate-950/40">{text}</div>
}
