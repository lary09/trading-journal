"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Target, TrendingUp, BarChart3, Settings, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

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
  const [strategies, setStrategies] = useState<Strategy[]>([
    {
      id: "1",
      name: "Breakout Trading",
      description: "Trade breakouts from key support/resistance levels with volume confirmation",
      type: "Technical",
      timeframe: "4H",
      success_rate: 68,
      total_trades: 45,
      avg_profit: 2.5,
      status: "active"
    },
    {
      id: "2", 
      name: "Mean Reversion",
      description: "Trade reversals when price deviates significantly from moving averages",
      type: "Technical",
      timeframe: "1D",
      success_rate: 72,
      total_trades: 32,
      avg_profit: 1.8,
      status: "active"
    },
    {
      id: "3",
      name: "News Trading",
      description: "Trade based on fundamental news and economic events",
      type: "Fundamental",
      timeframe: "1H",
      success_rate: 55,
      total_trades: 28,
      avg_profit: 3.2,
      status: "testing"
    }
  ])

  const [showNewForm, setShowNewForm] = useState(false)
  const [newStrategy, setNewStrategy] = useState({
    name: "",
    description: "",
    type: "",
    timeframe: "",
    status: "testing"
  })

  const handleCreateStrategy = () => {
    if (!newStrategy.name || !newStrategy.description || !newStrategy.type || !newStrategy.timeframe) {
      return
    }

    const strategy: Strategy = {
      id: Date.now().toString(),
      name: newStrategy.name,
      description: newStrategy.description,
      type: newStrategy.type,
      timeframe: newStrategy.timeframe,
      success_rate: 0,
      total_trades: 0,
      avg_profit: 0,
      status: newStrategy.status
    }

    setStrategies([...strategies, strategy])
    setNewStrategy({ name: "", description: "", type: "", timeframe: "", status: "testing" })
    setShowNewForm(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-white">Trading Strategies</h1>
              <Badge variant="outline" className="border-blue-600 text-blue-400">
                Strategy Management
              </Badge>
            </div>
            <Button onClick={() => setShowNewForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Strategy
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Strategy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategies.map((strategy) => (
            <Card key={strategy.id} className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">{strategy.name}</CardTitle>
                    <CardDescription className="text-slate-300 mt-2">
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
                      <span className="text-slate-400">Type:</span>
                      <div className="text-white font-medium">{strategy.type}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Timeframe:</span>
                      <div className="text-white font-medium">{strategy.timeframe}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{strategy.success_rate}%</div>
                      <div className="text-xs text-slate-400">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{strategy.total_trades}</div>
                      <div className="text-xs text-slate-400">Total Trades</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{strategy.avg_profit}%</div>
                      <div className="text-xs text-slate-400">Avg Profit</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Trades
                    </Button>
                    <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* New Strategy Form */}
        {showNewForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Create New Strategy</CardTitle>
                <CardDescription className="text-slate-300">
                  Define a new trading strategy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-200">Strategy Name</Label>
                  <Input
                    id="name"
                    value={newStrategy.name}
                    onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="e.g., Breakout Trading"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-slate-200">Description</Label>
                  <Textarea
                    id="description"
                    value={newStrategy.description}
                    onChange={(e) => setNewStrategy({...newStrategy, description: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Describe your strategy..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type" className="text-slate-200">Type</Label>
                    <Select value={newStrategy.type} onValueChange={(value) => setNewStrategy({...newStrategy, type: value})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Fundamental">Fundamental</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="timeframe" className="text-slate-200">Timeframe</Label>
                    <Select value={newStrategy.timeframe} onValueChange={(value) => setNewStrategy({...newStrategy, timeframe: value})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Create Strategy
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowNewForm(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
