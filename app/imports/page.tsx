"use client"

import Link from "next/link"
import { useState } from "react"
import { CloudUpload, Plug } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const connections = [
  { name: "Alpaca", status: "Disconnected" },
  { name: "Tradier", status: "Disconnected" },
  { name: "Oanda", status: "Disconnected" },
]

export default function ImportsPage() {
  return (
    <AppShell
      title="Imports"
      cta={
        <Button asChild>
          <Link href="/trades/new">Log manually</Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <CsvWizard />

        <Card className="terminal-panel">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plug className="h-5 w-5" />
              Broker Connections
            </CardTitle>
            <CardDescription>Connect paper/live accounts to sync executions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {connections.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                <div className="text-sm font-medium">{c.name}</div>
                <Badge variant="outline" className="capitalize border-border/70">
                  {c.status}
                </Badge>
              </div>
            ))}
            <Button asChild variant="outline" className="w-full">
               <Link href="/watchlist">Open watchlist</Link>
             </Button>
           </CardContent>
         </Card>
      </div>
    </AppShell>
  )
}

import Papa from "papaparse"
import { UploadCloud, File, AlertCircle } from "lucide-react"

type PreviewSummary = {
  totalRows: number
  validRows: number
  invalidRows: number
}

type PreviewIssue = {
  row: number
  error: string
}

function CsvWizard() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [parsedData, setParsedData] = useState<any[]>([])
  const [issues, setIssues] = useState<PreviewIssue[]>([])
  const [summary, setSummary] = useState<PreviewSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setStatus(null)
      
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setStatus("Parse error: " + results.errors[0].message)
          } else {
            setParsedData(results.data)
            void fetchPreview(results.data as any[])
          }
        },
      })
    }
  }

  const fetchPreview = async (rows: any[]) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/imports/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mode: "preview", trades: rows }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Preview failed")

      setPreview(json.preview ?? [])
      setIssues(json.issues ?? [])
      setSummary(json.summary ?? null)
      setStatus("Preview ready. Review valid and invalid rows before import.")
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Preview failed")
      setPreview([])
      setIssues([])
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (parsedData.length === 0) return
    setIsLoading(true)
    setStatus(null)

    try {
      const res = await fetch("/api/imports/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mode: "import", trades: parsedData }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Import failed")
      
      setStatus(`Imported ${json.inserted} trades, skipped ${json.skipped}, invalid ${json.invalid}.`)
      setFile(null)
      setParsedData([])
      setPreview([])
      setIssues([])
      setSummary(null)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Import failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="terminal-panel">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-primary">
          <CloudUpload className="h-5 w-5" />
          CSV Upload
        </CardTitle>
        <CardDescription>Upload a CSV file from any broker to import your trading history.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {!file ? (
          <div className="group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/70 p-8 text-center transition-colors hover:bg-white/[0.03]">
            <input 
              type="file" 
              accept=".csv" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <UploadCloud className="h-10 w-10 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
            <h3 className="font-medium text-slate-200">Click or drag CSV file here</h3>
            <p className="text-sm text-muted-foreground mt-1">Maximum file size 5MB</p>
          </div>
        ) : (
          <div className="terminal-panel-muted flex items-center justify-between rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="rounded bg-primary/10 p-2 text-primary">
                <File className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB • {parsedData.length} rows</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setParsedData([]); setPreview([]); setIssues([]); setSummary(null); setStatus(null); }}>
              Remove
            </Button>
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-3 gap-3 text-sm">
            <SummaryTile label="Rows" value={summary.totalRows} />
            <SummaryTile label="Valid" value={summary.validRows} tone="positive" />
            <SummaryTile label="Invalid" value={summary.invalidRows} tone={summary.invalidRows > 0 ? "negative" : "neutral"} />
          </div>
        )}

        {preview.length > 0 && (
           <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Preview Data</h4>
             <div className="terminal-table overflow-x-auto rounded-lg">
               <table className="w-full text-left text-xs text-slate-300">
                 <thead className="text-muted-foreground">
                   <tr>
                     <th className="px-3 py-2">Symbol</th>
                     <th className="px-3 py-2">Entry Time</th>
                     <th className="px-3 py-2 text-right">P&L</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border/60">
                   {preview.map((row, i) => (
                    <tr key={i}>
                        <td className="px-3 py-2 font-medium">{row.symbol || "N/A"}</td>
                        <td className="px-3 py-2">{row.entryTime ? new Date(row.entryTime).toLocaleString() : "N/A"}</td>
                        <td className="px-3 py-2 text-right">{row.profitLoss ?? "$0.00"}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
           </div>
         )}

        {issues.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-rose-300">Invalid rows</h4>
            <div className="terminal-panel-muted rounded-lg p-3 text-xs text-rose-200">
              {issues.slice(0, 8).map((issue) => (
                <div key={`${issue.row}-${issue.error}`} className="py-1">
                  Row {issue.row}: {issue.error}
                </div>
              ))}
            </div>
          </div>
        )}

        {status && (
          <div className={`p-3 rounded-md text-sm flex items-start gap-2 ${status.includes('fail') || status.includes('error') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{status}</p>
          </div>
        )}

        <Button onClick={handleImport} disabled={isLoading || parsedData.length === 0} className="w-full gap-2">
          {isLoading ? "Importing to Database..." : "Import " + (parsedData.length > 0 ? parsedData.length + " Trades" : "Trades")}
        </Button>
        <Separator />
        <div className="text-xs text-muted-foreground flex justify-between">
          <span>Recommended headers: symbol, entry_time, entry_price, quantity</span>
          <Link href="/api/export/trades" className="text-primary hover:underline">Download sample shape</Link>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryTile({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "positive" | "negative" }) {
  const color = tone === "positive" ? "text-emerald-400" : tone === "negative" ? "text-rose-400" : "text-white"
  return (
    <div className="terminal-panel-muted p-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className={`mt-2 text-xl font-semibold ${color}`}>{value}</div>
    </div>
  )
}
