import Link from "next/link"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, FileText, RefreshCw } from "lucide-react"

export default function ExportPage() {
  return (
    <AppShell
      title="Exports"
      cta={
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <Card className="terminal-panel py-6">
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="terminal-kicker mb-2">Data Portability</div>
              <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Export your trading record.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Move journal data into spreadsheets, reporting systems or your external automation stack.
              </p>
            </div>
            <div className="terminal-panel-muted px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Format</div>
              <div className="mt-2 text-xl font-semibold text-white">CSV</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="terminal-panel lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Generate CSV</CardTitle>
            <CardDescription>
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
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
              <RefreshCw className="h-4 w-4 mr-2" />
              Schedule nightly export (coming soon)
            </Button>
          </CardContent>
        </Card>

          <Card className="terminal-panel">
          <CardHeader>
            <CardTitle className="text-white">Destinations</CardTitle>
            <CardDescription>Keep data flowing to your stack.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <Destination label="Google Sheets" />
            <Destination label="Notion" />
            <Destination label="Slack daily digest" />
            <Destination label="Webhook" />
          </CardContent>
        </Card>
        </div>
      </div>
    </AppShell>
  )
}

function Destination({ label }: { label: string }) {
  return <div className="terminal-panel-muted rounded-lg px-3 py-2">{label}</div>
}
