"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TradingViewChart } from "@/components/charts/tradingview-chart"

type Bar = {
  tradingDay: string
  open: string
  high: string
  low: string
  close: string
  volume: string | null
}

type ReplayResponse = {
  bars: Bar[]
  source?: "local" | "yahoo"
  message?: string
}

export default function ReplayPage() {
  const [symbol, setSymbol] = useState("AAPL")
  const [start, setStart] = useState("2024-01-01")
  const [end, setEnd] = useState("2024-02-01")
  const [bars, setBars] = useState<Bar[]>([])
  const [source, setSource] = useState<ReplayResponse["source"]>(undefined)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const sym = symbol.trim().toUpperCase()
    setSymbol(sym)
    setLoading(true)
    try {
      const res = await fetch(`/api/replay?symbol=${encodeURIComponent(sym)}&start=${start}&end=${end}`)
      if (!res.ok) throw new Error("No se pudieron cargar barras")
      const json = await res.json().catch(() => ({ bars: [] })) as ReplayResponse
      setBars(json.bars ?? [])
      setSource(json.source)
      setMessage(json.message ?? null)
    } catch (e) {
      console.error(e)
      setBars([])
      setSource(undefined)
      setMessage("No market data available for the selected range.")
    } finally {
      setLoading(false)
    }
  }

  // Convert for Lightweight Charts
  const chartData = bars.map((b) => ({
    time: b.tradingDay.split("T")[0],
    open: Number(b.open),
    high: Number(b.high),
    low: Number(b.low),
    close: Number(b.close),
  }))

  return (
    <AppShell
      title="Market Replay"
      cta={
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {loading ? "Cargando..." : "Cargar datos"}
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="terminal-panel lg:col-span-2">
          <CardHeader>
            <CardTitle>TradingView Replay Engine</CardTitle>
            <CardDescription>
              Replay over historical daily candles. Local database bars are preferred; Yahoo fallback is used only when local history is missing.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[600px] p-4 flex flex-col">
            {source && <div className="mb-3 text-xs text-muted-foreground">Source: {source === "local" ? "Local database" : "Yahoo fallback"}</div>}
            {chartData.length > 0 ? (
              <TradingViewChart data={chartData} />
            ) : (
              <div className="terminal-panel-muted flex h-full w-full items-center justify-center rounded-lg text-center font-medium text-muted-foreground">
                {loading ? "Cargando serie de tiempo..." : message || "Selecciona un Ticker y presiona Cargar para iniciar el simulador"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="terminal-panel">
          <CardHeader>
            <CardTitle>Fuente y Parámetros</CardTitle>
            <CardDescription>Configura el Activo a simular</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Ticker Bursátil (Ej. AAPL, BTC-USD)" value={symbol} onChange={(v) => setSymbol(v.toUpperCase())} />
            <Field label="Fecha Inicial (YYYY-MM-DD)" value={start} onChange={setStart} />
            <Field label="Fecha Final (YYYY-MM-DD)" value={end} onChange={setEnd} />
            
            <Button className="w-full mt-2" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "Sincronizando..." : "Extraer Datos del Mercado"}
            </Button>
            
            <p className="terminal-panel-muted mt-4 rounded-lg p-3 text-xs leading-relaxed text-muted-foreground">
              Local bars from your synced watchlist are preferred. Yahoo is only a fallback when your database does not have the requested history yet.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-slate-300 font-medium">{label}</Label>
      <Input 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
    </div>
  )
}
