"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, ShieldCheck } from "lucide-react"

import { Card } from "@/components/ui/card"

type RiskStatus = {
  rule: {
    dailyLossLimit: number | null
    weeklyLossLimit: number | null
  } | null
  dailyPnl: number
  weeklyPnl: number
  breaches: { daily: boolean; weekly: boolean }
}

export function RiskBanner() {
  const [status, setStatus] = useState<RiskStatus | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/risk/status", { cache: "no-store" })
        if (!res.ok) return
        const json = await res.json()
        setStatus(json)
      } catch (_e) {
        // ignore
      }
    }
    load()
  }, [])

  if (!status?.rule) return null

  const breached = status.breaches.daily || status.breaches.weekly

  return (
    <Card
      className={`mb-4 flex items-center justify-between px-4 py-3 border ${
        breached ? "border-rose-400/60 bg-rose-950/30" : "border-emerald-400/30 bg-emerald-900/20"
      }`}
    >
      <div className="flex items-center gap-2 text-sm">
        {breached ? (
          <AlertTriangle className="h-4 w-4 text-rose-400" />
        ) : (
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
        )}
        <span className="text-slate-100">
          {breached
            ? "Cuidado: límite de riesgo alcanzado."
            : "Riesgo dentro de los límites definidos."}
        </span>
      </div>
      <div className="text-xs text-slate-300 flex gap-3">
        <span>
          Diario: {format(status.dailyPnl)} /{" "}
          {status.rule.dailyLossLimit ? `-${status.rule.dailyLossLimit}` : "sin límite"}
        </span>
        <span>
          Semanal: {format(status.weeklyPnl)} /{" "}
          {status.rule.weeklyLossLimit ? `-${status.rule.weeklyLossLimit}` : "sin límite"}
        </span>
      </div>
    </Card>
  )
}

const format = (v: number) => `${v >= 0 ? "$" : "-$"}${Math.abs(v).toFixed(2)}`
