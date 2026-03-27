import Link from "next/link"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, RefreshCw } from "lucide-react"

export default function ExportPage() {
  return (
    <AppShell
      title="Exports"
      cta={
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-slate-900/60 border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Generate CSV</CardTitle>
            <CardDescription className="text-slate-400">
              Export your journal with performance metrics for Excel, Google Sheets, or Airtable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" size="lg">
              <Download className="h-4 w-4 mr-2" />
              Download latest trades
            </Button>
            <Button variant="outline" className="w-full" size="lg">
              <FileText className="h-4 w-4 mr-2" />
              Export backtests
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <RefreshCw className="h-4 w-4 mr-2" />
              Schedule nightly export (coming soon)
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Destinations</CardTitle>
            <CardDescription className="text-slate-400">Keep data flowing to your stack.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <Destination label="Google Sheets" />
            <Destination label="Notion" />
            <Destination label="Slack daily digest" />
            <Destination label="Webhook" />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function Destination({ label }: { label: string }) {
  return <div className="rounded-md border border-slate-800/60 px-3 py-2 bg-slate-950/40">{label}</div>
}
