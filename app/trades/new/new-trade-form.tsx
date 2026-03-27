"use client"

import type React from "react"
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createTradeAction } from "./actions"

type StrategyOption = {
  id: string
  name: string
}

interface NewTradeFormProps {
  strategies: StrategyOption[]
}

export function NewTradeForm({ strategies: initialStrategies }: NewTradeFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [strategies] = useState<StrategyOption[]>(initialStrategies)
  const [isTradeOpen, setIsTradeOpen] = useState(true)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [formData, setFormData] = useState({
    symbol: "",
    tradeType: "",
    marketType: "",
    strategyId: "",
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    stopLoss: "",
    takeProfit: "",
    riskAmount: "",
    entryTime: "",
    exitTime: "",
    tradeSetup: "",
    tradeOutcome: "",
    lessonsLearned: "",
    confidenceLevel: "",
    emotionalState: "",
    marketCondition: "",
    newsImpact: "",
    additionalNotes: "",
  })

  useEffect(() => {
    const now = new Date()
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    setFormData((prev) => ({ ...prev, entryTime: localDateTime }))
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateProfitLoss = () => {
    const entryPrice = Number.parseFloat(formData.entryPrice)
    const exitPrice = Number.parseFloat(formData.exitPrice)
    const quantity = Number.parseFloat(formData.quantity)

    if (entryPrice && exitPrice && quantity) {
      let profitLoss = 0
      if (formData.tradeType === "buy" || formData.tradeType === "long") {
        profitLoss = (exitPrice - entryPrice) * quantity
      } else {
        profitLoss = (entryPrice - exitPrice) * quantity
      }
      return profitLoss
    }
    return null
  }

  const calculateProfitLossPercentage = () => {
    const entryPrice = Number.parseFloat(formData.entryPrice)
    const exitPrice = Number.parseFloat(formData.exitPrice)

    if (entryPrice && exitPrice) {
      let percentage = 0
      if (formData.tradeType === "buy" || formData.tradeType === "long") {
        percentage = ((exitPrice - entryPrice) / entryPrice) * 100
      } else {
        percentage = ((entryPrice - exitPrice) / entryPrice) * 100
      }
      return percentage
    }
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    startTransition(() => {
      void createTradeAction({
        ...formData,
        isTradeOpen,
      })
        .then(() => {
          router.push("/dashboard")
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "An error occurred")
        })
        .finally(() => setIsLoading(false))
    })
  }

  const saving = isLoading || isPending

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-white">New Trade Entry</h1>
        </div>
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Trade Status</CardTitle>
              <CardDescription className="text-slate-400">Is this an open trade or a completed trade?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trade-open"
                  checked={isTradeOpen}
                  onCheckedChange={(checked) => setIsTradeOpen(checked as boolean)}
                />
                <Label htmlFor="trade-open" className="text-slate-200">
                  This is an open trade (not yet closed)
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
              <CardDescription className="text-slate-400">Enter the fundamental details of your trade</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="symbol" className="text-slate-200">
                  Symbol *
                </Label>
                <Input
                  id="symbol"
                  placeholder="EURUSD, AAPL, BTC/USD"
                  required
                  value={formData.symbol}
                  onChange={(e) => handleInputChange("symbol", e.target.value)}
                  className="bg-slate-700 border-slate-500 text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradeType" className="text-slate-200">
                  Trade Type *
                </Label>
                <Select value={formData.tradeType} onValueChange={(value) => handleInputChange("tradeType", value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-500 text-slate-200 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select trade type" className="text-slate-200" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="buy" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Buy</SelectItem>
                    <SelectItem value="sell" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Sell</SelectItem>
                    <SelectItem value="long" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Long</SelectItem>
                    <SelectItem value="short" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Short</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketType" className="text-slate-200">
                  Market Type *
                </Label>
                <Select value={formData.marketType} onValueChange={(value) => handleInputChange("marketType", value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-500 text-slate-200 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select market" className="text-slate-200" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="forex" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Forex</SelectItem>
                    <SelectItem value="stocks" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Stocks</SelectItem>
                    <SelectItem value="crypto" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Cryptocurrency</SelectItem>
                    <SelectItem value="commodities" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Commodities</SelectItem>
                    <SelectItem value="indices" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Indices</SelectItem>
                    <SelectItem value="futures" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Futures</SelectItem>
                    <SelectItem value="options" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Options</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strategyId" className="text-slate-200">
                  Trading Strategy
                </Label>
                <Select value={formData.strategyId} onValueChange={(value) => handleInputChange("strategyId", value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-500 text-slate-200 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select strategy (optional)" className="text-slate-200" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {strategies.map((strategy) => (
                      <SelectItem key={strategy.id} value={strategy.id} className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">
                        {strategy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Trade Execution</CardTitle>
              <CardDescription className="text-slate-400">Price and quantity details</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="entryPrice" className="text-slate-200">
                  Entry Price *
                </Label>
                <Input
                  id="entryPrice"
                  type="number"
                  step="any"
                  placeholder="1.2345"
                  required
                  value={formData.entryPrice}
                  onChange={(e) => handleInputChange("entryPrice", e.target.value)}
                  className="bg-slate-700 border-slate-500 text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {!isTradeOpen && (
                <div className="space-y-2">
                  <Label htmlFor="exitPrice" className="text-slate-200">
                    Exit Price *
                  </Label>
                  <Input
                    id="exitPrice"
                    type="number"
                    step="any"
                    placeholder="1.2400"
                    required={!isTradeOpen}
                    value={formData.exitPrice}
                    onChange={(e) => handleInputChange("exitPrice", e.target.value)}
                    className="bg-slate-700 border-slate-500 text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-slate-200">
                  Quantity *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="any"
                  placeholder="1000"
                  required
                  value={formData.quantity}
                  onChange={(e) => handleInputChange("quantity", e.target.value)}
                  className="bg-slate-700 border-slate-500 text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Risk Management</CardTitle>
              <CardDescription className="text-slate-400">Stop loss, take profit, and risk parameters</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="stopLoss" className="text-slate-200">
                  Stop Loss
                </Label>
                <Input
                  id="stopLoss"
                  type="number"
                  step="any"
                  placeholder="1.2300"
                  value={formData.stopLoss}
                  onChange={(e) => handleInputChange("stopLoss", e.target.value)}
                  className="bg-slate-700 border-slate-500 text-slate-200 focus:border-blue-500 focus:ring-blue-500 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="takeProfit" className="text-slate-200">
                  Take Profit
                </Label>
                <Input
                  id="takeProfit"
                  type="number"
                  step="any"
                  placeholder="1.2400"
                  value={formData.takeProfit}
                  onChange={(e) => handleInputChange("takeProfit", e.target.value)}
                  className="bg-slate-700 border-slate-500 text-slate-200 focus:border-blue-500 focus:ring-blue-500 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskAmount" className="text-slate-200">
                  Risk Amount ($)
                </Label>
                <Input
                  id="riskAmount"
                  type="number"
                  step="any"
                  placeholder="100.00"
                  value={formData.riskAmount}
                  onChange={(e) => handleInputChange("riskAmount", e.target.value)}
                  className="bg-slate-700 border-slate-500 text-slate-200 focus:border-blue-500 focus:ring-blue-500 placeholder:text-slate-400"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Trade Timing</CardTitle>
              <CardDescription className="text-slate-400">When the trade was executed</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="entryTime" className="text-slate-200">
                  Entry Time *
                </Label>
                <Input
                  id="entryTime"
                  type="datetime-local"
                  required
                  value={formData.entryTime}
                  onChange={(e) => handleInputChange("entryTime", e.target.value)}
                  className="bg-slate-700 border-slate-500 text-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {!isTradeOpen && (
                <div className="space-y-2">
                  <Label htmlFor="exitTime" className="text-slate-200">
                    Exit Time
                  </Label>
                  <Input
                    id="exitTime"
                    type="datetime-local"
                    value={formData.exitTime}
                    onChange={(e) => handleInputChange("exitTime", e.target.value)}
                    className="bg-slate-700 border-slate-500 text-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Trade Analysis</CardTitle>
              <CardDescription className="text-slate-400">Document your trading setup and analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tradeSetup" className="text-slate-200">
                  Trade Setup
                </Label>
                <Textarea
                  id="tradeSetup"
                  placeholder="Describe the technical setup, patterns, or signals that led to this trade..."
                  value={formData.tradeSetup}
                  onChange={(e) => handleInputChange("tradeSetup", e.target.value)}
                  className="bg-slate-700 border-slate-500 text-slate-200 focus:border-blue-500 focus:ring-blue-500 placeholder:text-slate-400 min-h-[100px]"
                />
              </div>

              {!isTradeOpen && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tradeOutcome" className="text-slate-200">
                      Trade Outcome
                    </Label>
                    <Textarea
                      id="tradeOutcome"
                      placeholder="What happened with this trade? Did it go as expected?"
                      value={formData.tradeOutcome}
                      onChange={(e) => handleInputChange("tradeOutcome", e.target.value)}
                      className="bg-slate-700 border-slate-500 text-slate-200 focus:border-blue-500 focus:ring-blue-500 placeholder:text-slate-400 min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lessonsLearned" className="text-slate-200">
                      Lessons Learned
                    </Label>
                    <Textarea
                      id="lessonsLearned"
                      placeholder="What did you learn from this trade? What would you do differently?"
                      value={formData.lessonsLearned}
                      onChange={(e) => handleInputChange("lessonsLearned", e.target.value)}
                      className="bg-slate-700 border-slate-500 text-slate-200 focus:border-blue-500 focus:ring-blue-500 placeholder:text-slate-400 min-h-[100px]"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Psychology & Market Conditions</CardTitle>
              <CardDescription className="text-slate-400">
                Track your emotional state and market environment
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="confidenceLevel" className="text-slate-200">
                  Confidence Level (1-10)
                </Label>
                <Select
                  value={formData.confidenceLevel}
                  onValueChange={(value) => handleInputChange("confidenceLevel", value)}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-500 text-slate-200 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Rate your confidence" className="text-slate-200" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                      <SelectItem key={level} value={level.toString()} className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">
                        {level} - {level <= 3 ? "Low" : level <= 7 ? "Medium" : "High"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emotionalState" className="text-slate-200">
                  Emotional State
                </Label>
                <Select
                  value={formData.emotionalState}
                  onValueChange={(value) => handleInputChange("emotionalState", value)}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-500 text-slate-200 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="How did you feel?" className="text-slate-200" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="calm" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Calm</SelectItem>
                    <SelectItem value="excited" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Excited</SelectItem>
                    <SelectItem value="fearful" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Fearful</SelectItem>
                    <SelectItem value="greedy" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Greedy</SelectItem>
                    <SelectItem value="confident" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Confident</SelectItem>
                    <SelectItem value="uncertain" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Uncertain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketCondition" className="text-slate-200">
                  Market Condition
                </Label>
                <Select
                  value={formData.marketCondition}
                  onValueChange={(value) => handleInputChange("marketCondition", value)}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-500 text-slate-200 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Market environment" className="text-slate-200" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="trending" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Trending</SelectItem>
                    <SelectItem value="ranging" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Ranging</SelectItem>
                    <SelectItem value="volatile" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Volatile</SelectItem>
                    <SelectItem value="calm" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Calm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newsImpact" className="text-slate-200">
                  News Impact
                </Label>
                <Select value={formData.newsImpact} onValueChange={(value) => handleInputChange("newsImpact", value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-500 text-slate-200 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="News influence" className="text-slate-200" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="none" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">None</SelectItem>
                    <SelectItem value="low" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Low</SelectItem>
                    <SelectItem value="medium" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">Medium</SelectItem>
                    <SelectItem value="high" className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Additional Notes</CardTitle>
              <CardDescription className="text-slate-400">Any other relevant information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="additionalNotes" className="text-slate-200">
                  Notes
                </Label>
                <Textarea
                  id="additionalNotes"
                  placeholder="Any additional observations, screenshots references, or notes..."
                  value={formData.additionalNotes}
                  onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                  className="bg-slate-700 border-slate-500 text-slate-200 focus:border-blue-500 focus:ring-blue-500 placeholder:text-slate-400 min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {!isTradeOpen && formData.entryPrice && formData.exitPrice && formData.quantity && (
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trade Result Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Profit/Loss:</span>
                    <span className={`font-medium ${calculateProfitLoss()! >= 0 ? "text-green-400" : "text-red-400"}`}>
                      ${calculateProfitLoss()?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Return %:</span>
                    <span
                      className={`font-medium ${calculateProfitLossPercentage()! >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {calculateProfitLossPercentage()?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-800 bg-red-900/20">
              <CardContent className="pt-6">
                <div className="text-red-400 text-sm">{error}</div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving Trade..." : "Save Trade"}
            </Button>
            <Button
              type="button"
              variant="outline"
              asChild
              className="border-slate-500 text-slate-200 hover:bg-slate-600 hover:text-white hover:border-slate-400 bg-slate-800/50 transition-all duration-200"
            >
              <Link href="/dashboard">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
