"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, ShieldCheck, TrendingDown } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

type Rule = {
  dailyLossLimit: number | null
  weeklyLossLimit: number | null
  maxRiskPerTrade: number | null
  alertsEnabled: boolean
}

export default function RiskPage() {
  const [rule, setRule] = useState<Rule>({
    dailyLossLimit: null,
    weeklyLossLimit: null,
    maxRiskPerTrade: null,
    alertsEnabled: true,
  })
  const [status, setStatus] = useState<{ dailyPnl: number; weeklyPnl: number; breaches: { daily: boolean; weekly: boolean } }>({
    dailyPnl: 0,
    weeklyPnl: 0,
    breaches: { daily: false, weekly: false },
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [ruleRes, statusRes] = await Promise.all([fetch("/api/risk"), fetch("/api/risk/status")])
    const ruleJson = await ruleRes.json().catch(() => ({}))
    const statusJson = await statusRes.json().catch(() => ({}))
    if (ruleJson.rule) setRule({ ...rule, ...ruleJson.rule })
    if (statusJson) setStatus(statusJson)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = async () => {
    setSaving(true)
    await fetch("/api/risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rule),
    })
    await load()
    setSaving(false)
  }

  return (
    <AppShell title="Risk" cta={<Button onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar reglas"}</Button>}>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Reglas de riesgo</CardTitle>
            <CardDescription>Define tus límites para evitar días rojos catastróficos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="Límite diario de pérdida (USD)"
                value={rule.dailyLossLimit ?? ""}
                onChange={(v) => setRule({ ...rule, dailyLossLimit: v })}
              />
              <Field
                label="Límite semanal de pérdida (USD)"
                value={rule.weeklyLossLimit ?? ""}
                onChange={(v) => setRule({ ...rule, weeklyLossLimit: v })}
              />
              <Field
                label="Riesgo máx. por trade (%)"
                value={rule.maxRiskPerTrade ?? ""}
                onChange={(v) => setRule({ ...rule, maxRiskPerTrade: v })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={rule.alertsEnabled} onCheckedChange={(val) => setRule({ ...rule, alertsEnabled: val })} />
              <span className="text-sm text-muted-foreground">Habilitar alertas cuando se violen las reglas</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado</CardTitle>
            <CardDescription>PnL acumulado vs. límites</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <StatusLine
              label="P&L diario"
              value={status.dailyPnl}
              breached={status.breaches?.daily}
              limit={rule.dailyLossLimit}
            />
            <StatusLine
              label="P&L semanal"
              value={status.weeklyPnl}
              breached={status.breaches?.weekly}
              limit={rule.weeklyLossLimit}
            />
            <div className="text-muted-foreground text-xs">
              Basado en tus trades cerrados desde el inicio del día/semana UTC.
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function Field({ label, value, onChange }: { label: string; value: string | number; onChange: (v: number | null) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        type="number"
        step="0.01"
      />
    </div>
  )
}

function StatusLine({ label, value, limit, breached }: { label: string; value: number; limit: number | null; breached: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2">
      <div>
        <div className="text-slate-200">{label}</div>
        <div className="text-xs text-muted-foreground">Límite: {limit ? `-$${Number(limit).toFixed(2)}` : "No definido"}</div>
      </div>
      <div className={`flex items-center gap-2 text-sm ${breached ? "text-rose-400" : "text-emerald-400"}`}>
        {breached ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
        <span>{value >= 0 ? `$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`}</span>
      </div>
    </div>
  )
}
