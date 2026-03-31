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

export default function ReplayPage() {
  const [symbol, setSymbol] = useState("AAPL")
  const [start, setStart] = useState("2024-01-01")
  const [end, setEnd] = useState("2024-02-01")
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const sym = symbol.trim().toUpperCase()
    setSymbol(sym)
    setLoading(true)
    try {
      const res = await fetch(`/api/replay?symbol=${encodeURIComponent(sym)}&start=${start}&end=${end}`)
      if (!res.ok) throw new Error("No se pudieron cargar barras")
      const json = await res.json().catch(() => ({ bars: [] }))
      setBars(json.bars ?? [])
    } catch (e) {
      console.error(e)
      setBars([])
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>TradingView Replay Engine</CardTitle>
            <CardDescription>
              Gráfica interactiva con datos institucionales. Usa los controles del overlay superior para iniciar el pase de velas histórico.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[600px] p-4 flex flex-col">
            {chartData.length > 0 ? (
              <TradingViewChart data={chartData} />
            ) : (
              <div className="h-full w-full rounded-lg border border-slate-800 bg-slate-900/50 flex items-center justify-center text-slate-500 font-medium">
                {loading ? "Cargando serie de tiempo..." : "Selecciona un Ticker y presiona Cargar para iniciar el simulador"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuente y Parámetros</CardTitle>
            <CardDescription>Configura el Activo a simular</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Ticker Bursátil (Ej. AAPL, BTC-USD)" value={symbol} onChange={(v) => setSymbol(v.toUpperCase())} />
            <Field label="Fecha Inicial (YYYY-MM-DD)" value={start} onChange={setStart} />
            <Field label="Fecha Final (YYYY-MM-DD)" value={end} onChange={setEnd} />
            
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg mt-2" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "Sincronizando..." : "Extraer Datos del Mercado"}
            </Button>
            
            <p className="text-xs text-slate-400 mt-4 leading-relaxed bg-slate-800/50 p-3 rounded-md border border-slate-700/50">
              💡 <strong>Pro Tip:</strong> Si no tienes el historial guardado en tu base de datos local (PostgreSQL), 
              el sistema utilizará el Bridge Serverless para descargar las cotizaciones directamente desde Yahoo Finance en milisegundos.
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
        className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-emerald-500 focus:border-emerald-500"
      />
    </div>
  )
}
