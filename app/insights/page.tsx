"use client"

import { useEffect, useState } from "react"
import { Lightbulb, RefreshCw, Sparkles } from "lucide-react"
import Link from "next/link"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function InsightsPage() {
  const [insights, setInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [aiText, setAiText] = useState<string>("")
  const [aiLoading, setAiLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch("/api/insights", { cache: "no-store" })
    const json = await res.json().catch(() => ({}))
    setInsights(json.insights ?? ["Aún no hay datos suficientes."])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const generateAi = async () => {
    setAiLoading(true)
    setAiText("")
    const res = await fetch("/api/insights/ai", { cache: "no-store" })
    const json = await res.json().catch(() => ({}))
    if (json.error) setAiText(`⚠️ ${json.error}`)
    else setAiText(json.insights ?? "Sin respuesta")
    setAiLoading(false)
  }

  return (
    <AppShell
      title="AI Insights"
      cta={
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {loading ? "Actualizando..." : "Refrescar"}
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Observaciones personalizadas
            </CardTitle>
            <CardDescription>Basadas en tus trades cerrados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <div className="text-sm text-muted-foreground">Calculando insights...</div>}
            {!loading &&
              insights.map((text, i) => (
                <div key={i} className="rounded-lg border border-border/70 bg-card/70 p-3 flex gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5" />
                  <div className="text-sm leading-relaxed">{text}</div>
                </div>
              ))}
            <div className="border-t border-border/70 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Insights con GPT
                </div>
                <Button size="sm" variant="outline" onClick={generateAi} disabled={aiLoading}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  {aiLoading ? "Generando..." : "Generar"}
                </Button>
              </div>
              <div className="rounded-md border border-border/60 bg-slate-900/60 p-3 text-sm text-slate-200 min-h-[80px] whitespace-pre-wrap">
                {aiLoading ? "Consultando modelo..." : aiText || "Pulsa Generar para ver un resumen con IA."}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cómo mejorar las señales</CardTitle>
            <CardDescription>Acciones rápidas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Registra más contexto (emoción, horario, estrategia) para que las recomendaciones sean más finas.</p>
            <p>• Cierra trades con estado “closed” para que se incluyan en el modelo.</p>
            <p>
              • Carga barras históricas y usa <Link href="/backtesting" className="underline">Backtesting</Link> para validar cambios
              antes de ir en vivo.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
