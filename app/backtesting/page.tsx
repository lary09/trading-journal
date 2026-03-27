"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Play, Plus, RefreshCw, Shield, TrendingUp } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

type Backtest = {
  id: string
  name: string
  status: string
  parameters: any
  metrics: any
  createdAt: string
}

export default function BacktestingPage() {
  const [runs, setRuns] = useState<Backtest[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: "", symbol: "AAPL", start: "", end: "" })
  const [submitting, setSubmitting] = useState(false)

  const stats = useMemo(() => {
    if (!runs.length) return null
    const completed = runs.filter((r) => r.metrics)
    const avgReturn =
      completed.reduce((acc, r) => acc + (r.metrics?.simpleReturn ?? 0), 0) / Math.max(completed.length, 1)
    return { completed: completed.length, avgReturn }
  }, [runs])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await fetch("/api/backtests")
      if (res.ok) {
        const json = await res.json()
        setRuns(json.backtests ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const createRun = async () => {
    if (!form.name) return toast.error("Ponle un nombre al backtest")
    setSubmitting(true)
    const res = await fetch("/api/backtests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        runNow: true,
        parameters: {
          symbol: form.symbol,
          start: form.start || undefined,
          end: form.end || undefined,
        },
      }),
    })
    if (!res.ok) {
      toast.error("No se pudo lanzar el backtest")
    } else {
      const json = await res.json()
      toast.success("Backtest encolado")
      setRuns((prev) => [...prev, json.backtest])
      setForm({ ...form, name: "" })
    }
    setSubmitting(false)
  }

  return (
    <AppShell
      title="Backtesting"
      cta={
        <Button asChild variant="outline">
          <Link href="/imports">Cargar datos</Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/70">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Ejecuciones</CardTitle>
              <CardDescription>Estado y resultados</CardDescription>
            </div>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => location.reload()}>
              <RefreshCw className="h-4 w-4" />
              Refrescar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <div className="text-sm text-muted-foreground">Cargando...</div>}
            {!loading && runs.length === 0 && (
              <div className="text-sm text-muted-foreground">Aún no hay backtests. Crea uno.</div>
            )}
            {runs.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.parameters?.symbol ?? "—"} {s.parameters?.start && ` · ${s.parameters?.start}`}{" "}
                    {s.parameters?.end && `→ ${s.parameters?.end}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="capitalize">
                    {s.status}
                  </Badge>
                  <span className="text-sm font-mono text-[--chart-1]">
                    {s.metrics?.simpleReturn ? `${(s.metrics.simpleReturn * 100).toFixed(2)}%` : "—"}
                  </span>
                  <Button size="icon" variant="ghost" disabled>
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Nuevo backtest</CardTitle>
            <CardDescription>Usa tus barras diarias ya cargadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Símbolo</Label>
              <Input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Inicio (YYYY-MM-DD)</Label>
                <Input value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Fin (opcional)</Label>
                <Input value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
              </div>
            </div>
            <Button className="w-full gap-2" onClick={createRun} disabled={submitting}>
              <Plus className="h-4 w-4" />
              {submitting ? "Lanzando..." : "Lanzar backtest"}
            </Button>
            <Separator />
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[--chart-1]" />
                Basado en tus barras diarias (Polygon/Tiingo)
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[--chart-2]" />
                Simulación offline, no toca tu broker
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
