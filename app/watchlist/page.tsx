"use client"

import { useEffect, useState } from "react"
import { Plus, RefreshCw } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type SymbolRow = {
  id: string
  ticker: string
  name: string | null
  exchange: string | null
  assetType: string | null
  currency: string | null
  isActive: boolean | null
}

export default function WatchlistPage() {
  const [symbols, setSymbols] = useState<SymbolRow[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ ticker: "", name: "", exchange: "", assetType: "", currency: "USD" })

  const load = async () => {
    setLoading(true)
    const res = await fetch("/api/watchlist", { cache: "no-store" })
    const json = await res.json().catch(() => ({ data: [] }))
    setSymbols(json.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const add = async () => {
    if (!form.ticker) return toast.error("Ticker requerido")
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      toast.error("No se pudo guardar el ticker")
      return
    }
    toast.success("Agregado a watchlist")
    setForm({ ticker: "", name: "", exchange: "", assetType: "", currency: "USD" })
    load()
  }

  return (
    <AppShell
      title="Watchlist & Screener"
      cta={
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refrescar
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Watchlist</CardTitle>
            <CardDescription>Activos marcados para seguimiento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <div className="text-sm text-muted-foreground">Cargando...</div>}
            {!loading && symbols.length === 0 && (
              <div className="text-sm text-muted-foreground">Aún no hay símbolos. Agrega uno.</div>
            )}
            <div className="grid gap-2">
              {symbols.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded border border-border/60 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-base font-semibold">
                      {s.ticker}
                    </Badge>
                    <div className="text-sm text-slate-300">
                      {s.name ?? "Sin nombre"} {s.exchange ? `· ${s.exchange}` : ""}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{s.assetType ?? "asset"}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agregar símbolo</CardTitle>
            <CardDescription>Deja nombre y exchange opcionales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Ticker *</Label>
              <Input value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })} />
            </div>
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Exchange</Label>
              <Input value={form.exchange} onChange={(e) => setForm({ ...form, exchange: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Tipo de activo</Label>
              <Input value={form.assetType} onChange={(e) => setForm({ ...form, assetType: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Moneda</Label>
              <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
            <Button className="w-full gap-2" onClick={add}>
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
