"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, BarChart3, Layers, Plus, Settings, Target } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Strategy = {
  id: string
  name: string
  description: string | null
  riskLevel: string | null
  maxRiskPerTrade: string | null
  targetProfitRatio: string | null
  isActive: boolean | null
}

const EMPTY_FORM = {
  name: "",
  description: "",
  riskLevel: "medium",
  maxRiskPerTrade: "",
  targetProfitRatio: "",
  status: "active",
}

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [showNewForm, setShowNewForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newStrategy, setNewStrategy] = useState(EMPTY_FORM)

  const loadStrategies = async () => {
    try {
      const res = await fetch("/api/strategies", { credentials: "include" })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setError(json?.error || "Unable to load strategies")
        return
      }

      setStrategies(Array.isArray(json?.data) ? json.data : [])
    } catch {
      setError("Unable to load strategies")
    }
  }

  useEffect(() => {
    void loadStrategies()
  }, [])

  const handleCreateStrategy = async () => {
    if (!newStrategy.name.trim()) {
      setError("Strategy name is required")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/strategies", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStrategy.name.trim(),
          description: newStrategy.description.trim() || null,
          riskLevel: newStrategy.riskLevel,
          maxRiskPerTrade: newStrategy.maxRiskPerTrade || null,
          targetProfitRatio: newStrategy.targetProfitRatio || null,
          isActive: newStrategy.status === "active",
        }),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok || !json?.data) {
        setError(json?.error || "Unable to create strategy")
        return
      }

      setStrategies((current) => [json.data, ...current])
      setNewStrategy(EMPTY_FORM)
      setShowNewForm(false)
    } catch {
      setError("Unable to create strategy")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleStrategy = async (strategy: Strategy) => {
    setError(null)
    const res = await fetch(`/api/strategies/${strategy.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !strategy.isActive }),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      setError(json?.error || "Unable to update strategy")
      return
    }
    setStrategies((current) => current.map((item) => item.id === strategy.id ? json.data : item))
  }

  const deleteStrategy = async (strategy: Strategy) => {
    setError(null)
    const res = await fetch(`/api/strategies/${strategy.id}`, {
      method: "DELETE",
      credentials: "include",
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      setError(json?.error || "Unable to delete strategy")
      return
    }
    setStrategies((current) => current.filter((item) => item.id !== strategy.id))
  }

  return (
    <AppShell
      title="Strategies"
      cta={
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => setShowNewForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Strategy
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card className="terminal-panel py-6">
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="terminal-kicker mb-2">Playbook</div>
              <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Strategy library</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Organize your trading playbooks with the risk parameters you actually use when logging trades.
              </p>
            </div>
            <div className="terminal-panel-muted px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Strategies</div>
              <div className="mt-2 text-3xl font-semibold text-white">{strategies.length}</div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-800 bg-red-950/20 py-4">
            <CardContent className="text-sm text-red-300">{error}</CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {strategies.map((strategy) => (
            <Card key={strategy.id} className="terminal-panel">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg text-white">{strategy.name}</CardTitle>
                    <CardDescription className="mt-2">{strategy.description || "No description yet."}</CardDescription>
                  </div>
                  <Badge variant={strategy.isActive ? "default" : "secondary"} className="capitalize">
                    {strategy.isActive ? "active" : "paused"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <InfoTile label="Risk level" value={strategy.riskLevel || "Not set"} />
                  <InfoTile label="Target R" value={strategy.targetProfitRatio || "Not set"} />
                </div>

                <div className="terminal-panel-muted grid grid-cols-2 gap-4 p-3 text-sm">
                  <MetricBlock label="Max risk / trade" value={strategy.maxRiskPerTrade ? `${strategy.maxRiskPerTrade}%` : "-"} />
                  <MetricBlock label="Linked trades" value="Available from trade log" />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href="/trades">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Trades
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleStrategy(strategy)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteStrategy(strategy)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {strategies.length === 0 && (
            <Card className="terminal-panel border-dashed py-8 md:col-span-2 lg:col-span-3">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <Layers className="mb-3 h-8 w-8 text-muted-foreground" />
                <div className="text-lg font-medium text-white">No strategies yet</div>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Create your first strategy so you can tag trades with a repeatable playbook and risk profile.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {showNewForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <Card className="terminal-panel w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-white">Create New Strategy</CardTitle>
                <CardDescription>Save the strategy fields the backend actually tracks today.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-200">Strategy Name</Label>
                  <Input id="name" value={newStrategy.name} onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })} placeholder="e.g., Opening Range Breakout" />
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-200">Description</Label>
                  <Textarea id="description" value={newStrategy.description} onChange={(e) => setNewStrategy({ ...newStrategy, description: e.target.value })} placeholder="Describe the setup, trigger and invalidation..." rows={3} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="riskLevel" className="text-slate-200">Risk Level</Label>
                    <Select value={newStrategy.riskLevel} onValueChange={(value) => setNewStrategy({ ...newStrategy, riskLevel: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-slate-200">Status</Label>
                    <Select value={newStrategy.status} onValueChange={(value) => setNewStrategy({ ...newStrategy, status: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxRiskPerTrade" className="text-slate-200">Max Risk %</Label>
                    <Input id="maxRiskPerTrade" type="number" min="0" step="0.01" value={newStrategy.maxRiskPerTrade} onChange={(e) => setNewStrategy({ ...newStrategy, maxRiskPerTrade: e.target.value })} placeholder="1.00" />
                  </div>

                  <div>
                    <Label htmlFor="targetProfitRatio" className="text-slate-200">Target R</Label>
                    <Input id="targetProfitRatio" type="number" min="0" step="0.01" value={newStrategy.targetProfitRatio} onChange={(e) => setNewStrategy({ ...newStrategy, targetProfitRatio: e.target.value })} placeholder="2.00" />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateStrategy} className="flex-1" disabled={isSaving}>
                    <Target className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Create Strategy"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewForm(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium text-white">{value}</div>
    </div>
  )
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  )
}
