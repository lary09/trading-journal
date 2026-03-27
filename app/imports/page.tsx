"use client"

import Link from "next/link"
import { useState } from "react"
import { CloudUpload, Plug, Upload } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

const connections = [
  { name: "Alpaca", status: "Disconnected" },
  { name: "Tradier", status: "Disconnected" },
  { name: "Oanda", status: "Disconnected" },
]

export default function ImportsPage() {
  const [csv, setCsv] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/imports/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      })
      const json = await res.json()
      setStatus(json.message ?? "Imported")
      setPreview(json.preview ?? [])
    } catch (e: any) {
      setStatus(e?.message ?? "Import failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppShell
      title="Imports"
      cta={
        <Button asChild className="bg-[--primary] text-[--primary-foreground]">
          <Link href="#">Start import</Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <CsvWizard />

        <Card className="border-border/70 bg-card/80 backdrop-blur">
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
              <Link href="#">Add connection</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function CsvWizard() {
  const [csv, setCsv] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleImport = async () => {
    setIsLoading(true)
    setStatus(null)
    setPreview([])
    try {
      const res = await fetch("/api/imports/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          csv,
          mapping: {
            symbol: "symbol",
            entryTime: "entry_time",
            tradeType: "trade_type",
            marketType: "market_type",
            quantity: "quantity",
            entryPrice: "entry_price",
            exitPrice: "exit_price",
            status: "status",
            profitLoss: "profit_loss",
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Import failed")
      setStatus(`Imported ${json.inserted} rows`)
      setPreview(json.preview || [])
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Import failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border/70 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CloudUpload className="h-5 w-5" />
          CSV Upload
        </CardTitle>
        <CardDescription>Paste CSV, we map typical columns automatically.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder="symbol,trade_type,market_type,entry_time,entry_price,exit_price,quantity,status,profit_loss"
          className="min-h-[160px]"
        />
        <Button onClick={handleImport} disabled={isLoading} className="w-full gap-2">
          <Upload className="h-4 w-4" />
          {isLoading ? "Importing..." : "Import CSV"}
        </Button>
        {status && <div className="text-sm text-muted-foreground">{status}</div>}
        {preview.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Preview:{" "}
            {preview.map((p, i) => (
              <span key={i} className="mr-3">
                {p.symbol} @ {p.entryPrice}
              </span>
            ))}
          </div>
        )}
        <Separator />
        <div className="text-sm text-muted-foreground">
          Required headers: symbol, trade_type, market_type, entry_time, entry_price, quantity. Optional: exit_price,
          status, profit_loss.
        </div>
      </CardContent>
    </Card>
  )
}
