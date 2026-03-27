"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Pause, Play, RefreshCw } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { CandlesReplay } from "@/components/charts/candles-replay"

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
  const [idx, setIdx] = useState(0)
  const [speed, setSpeed] = useState(750) // ms per bar
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [smaWindow, setSmaWindow] = useState(5)
  const timer = useRef<NodeJS.Timeout | null>(null)

  const current = bars[idx] ?? null
  const sliced = useMemo(() => bars.slice(0, idx + 1).map((b) => ({
    tradingDay: b.tradingDay,
    open: Number(b.open),
    high: Number(b.high),
    low: Number(b.low),
    close: Number(b.close),
  })), [bars, idx])

  const sma = useMemo(() => {
    const window = Math.max(1, smaWindow)
    const values: number[] = []
    for (let i = 0; i < sliced.length; i++) {
      const startIdx = Math.max(0, i - window + 1)
      const subset = sliced.slice(startIdx, i + 1).map((b) => b.close)
      const avg = subset.reduce((a, v) => a + v, 0) / subset.length
      values.push(avg)
    }
    return values
  }, [sliced, smaWindow])

  const load = async () => {
    setPlaying(false)
    setIdx(0)
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

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  useEffect(() => {
    if (!playing || bars.length === 0) return
    timer.current = setTimeout(() => {
      setIdx((i) => {
        const next = i + 1
        if (next >= bars.length) {
          setPlaying(false)
          return i
        }
        return next
      })
    }, speed)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [playing, idx, speed, bars.length])

  const progress = useMemo(
    () => (bars.length > 0 ? Math.round(((idx + 1) / bars.length) * 100) : 0),
    [idx, bars.length]
  )

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
            <CardTitle>Reproducción</CardTitle>
            <CardDescription>Recorre barras diarias como si fuera en vivo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={() => setPlaying((p) => !p)} disabled={bars.length === 0}>
                {playing ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" /> Pausar
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" /> Play
                  </>
                )}
              </Button>
              <div className="text-sm text-muted-foreground">
                {current ? `Bar ${idx + 1} / ${bars.length} · ${current.tradingDay}` : "Sin datos"}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Velocidad (ms por barra)</Label>
              <Slider value={[speed]} min={100} max={2000} step={50} onValueChange={(v) => setSpeed(v[0])} />
            </div>

            <div className="rounded-lg border border-border/60 p-4 bg-slate-900/50">
              {current ? (
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
                  <Metric label="Open" value={current.open} />
                  <Metric label="Close" value={current.close} />
                  <Metric label="High" value={current.high} />
                  <Metric label="Low" value={current.low} />
                  <Metric label="Volume" value={current.volume ?? "—"} />
                  <div className="col-span-2 text-xs text-muted-foreground">
                    Reproduciendo barras 1D desde {start} hasta {end}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Carga datos y presiona Play.</div>
              )}
            </div>

            <CandlesReplay data={sliced} overlay={sma} />

            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuente</CardTitle>
            <CardDescription>Define símbolo y fechas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Ticker" value={symbol} onChange={(v) => setSymbol(v.toUpperCase())} />
            <Field label="Inicio (YYYY-MM-DD)" value={start} onChange={setStart} />
            <Field label="Fin (YYYY-MM-DD)" value={end} onChange={setEnd} />
            <Field label="SMA window (barras)" value={String(smaWindow)} onChange={(v) => setSmaWindow(Number(v) || 1)} />
            <Button className="w-full" onClick={load}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Cargar
            </Button>
            <p className="text-xs text-muted-foreground">
              Usa barras existentes en `bars_1d`. Carga datos con Imports o proveedores antes de reproducir.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
      <span className="text-muted-foreground text-xs uppercase tracking-wide">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
