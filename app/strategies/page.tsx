"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Target, TrendingUp, BarChart3, Settings, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Strategy {
  id: string
  name: string
  description: string
  type: string
  timeframe: string
  success_rate: number
  total_trades: number
  avg_profit: number
  status: string
}

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([])

  const [showNewForm, setShowNewForm] = useState(false)
  const [newStrategy, setNewStrategy] = useState({
    name: "",
    description: "",
    type: "",
    timeframe: "",
    status: "testing"
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/strategies", { credentials: "include" })
        if (res.ok) {
          const json = await res.json()
          setStrategies(json.data || [])
        }
      } catch (error) {
        console.error("Error loading strategies", error)
      }
    }
    load()
  }, [])

  const handleCreateStrategy = () => {
    if (!newStrategy.name || !newStrategy.description || !newStrategy.type || !newStrategy.timeframe) {
      return
    }

    fetch("/api/strategies", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newStrategy.name,
        description: newStrategy.description,
        riskLevel: newStrategy.type,
        isActive: newStrategy.status === "active",
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json?.data) {
          setStrategies([json.data, ...strategies])
        }
      })
      .finally(() => {
        setNewStrategy({ name: "", description: "", type: "", timeframe: "", status: "testing" })
        setShowNewForm(false)
      })
  }

  return (
    <AppShell
      title="Strategies"
      cta={
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
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
                Keep your setups, timeframes and live testing status organized before they hit the ledger.
              </p>
            </div>
            <div className="terminal-panel-muted px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Strategies</div>
              <div className="mt-2 text-3xl font-semibold text-white">{strategies.length}</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategies.map((strategy) => (
            <Card key={strategy.id} className="terminal-panel">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">{strategy.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {strategy.description}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={strategy.status === "active" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {strategy.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <div className="text-white font-medium">{strategy.type}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timeframe:</span>
                      <div className="text-white font-medium">{strategy.timeframe}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="terminal-panel-muted p-3 text-center">
                      <div className="text-2xl font-bold text-green-400">{strategy.success_rate}%</div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                    <div className="terminal-panel-muted p-3 text-center">
                      <div className="text-2xl font-bold text-sky-400">{strategy.total_trades}</div>
                      <div className="text-xs text-muted-foreground">Total Trades</div>
                    </div>
                    <div className="terminal-panel-muted p-3 text-center">
                      <div className="text-2xl font-bold text-primary">{strategy.avg_profit}%</div>
                      <div className="text-xs text-muted-foreground">Avg Profit</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Trades
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {showNewForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <Card className="terminal-panel w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-white">Create New Strategy</CardTitle>
                <CardDescription>Define a new trading strategy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-200">Strategy Name</Label>
                  <Input
                    id="name"
                    value={newStrategy.name}
                    onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
                    placeholder="e.g., Breakout Trading"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-slate-200">Description</Label>
                  <Textarea
                    id="description"
                    value={newStrategy.description}
                    onChange={(e) => setNewStrategy({...newStrategy, description: e.target.value})}
                    placeholder="Describe your strategy..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type" className="text-slate-200">Type</Label>
                    <Select value={newStrategy.type} onValueChange={(value) => setNewStrategy({...newStrategy, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Fundamental">Fundamental</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="timeframe" className="text-slate-200">Timeframe</Label>
                    <Select value={newStrategy.timeframe} onValueChange={(value) => setNewStrategy({...newStrategy, timeframe: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1M">1 Minute</SelectItem>
                        <SelectItem value="5M">5 Minutes</SelectItem>
                        <SelectItem value="15M">15 Minutes</SelectItem>
                        <SelectItem value="1H">1 Hour</SelectItem>
                        <SelectItem value="4H">4 Hours</SelectItem>
                        <SelectItem value="1D">1 Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleCreateStrategy}
                    className="flex-1"
                  >
                    Create Strategy
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowNewForm(false)}
                  >
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
