"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface Strategy {
  id: string
  name: string
}

export default function NewTradePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [isTradeOpen, setIsTradeOpen] = useState(true)
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    symbol: "",
    trade_type: "",
    market_type: "",
    strategy_id: "",
    entry_price: "",
    exit_price: "",
    quantity: "",
    stop_loss: "",
    take_profit: "",
    risk_amount: "",
    entry_time: "",
    exit_time: "",
    trade_setup: "",
    trade_outcome: "",
    lessons_learned: "",
    confidence_level: "",
    emotional_state: "",
    market_condition: "",
    news_impact: "",
    additional_notes: "",
  })

  useEffect(() => {
    // Set default entry time to now
    const now = new Date()
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    setFormData((prev) => ({ ...prev, entry_time: localDateTime }))

    // Fetch user's strategies
    fetchStrategies()
  }, [])

  const fetchStrategies = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("trading_strategies").select("id, name").eq("is_active", true)

    if (error) {
      console.error("Error fetching strategies:", error)
    } else {
      setStrategies(data || [])
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateProfitLoss = () => {
    const entryPrice = Number.parseFloat(formData.entry_price)
    const exitPrice = Number.parseFloat(formData.exit_price)
    const quantity = Number.parseFloat(formData.quantity)

    if (entryPrice && exitPrice && quantity) {
      let profitLoss = 0
      if (formData.trade_type === "buy" || formData.trade_type === "long") {
        profitLoss = (exitPrice - entryPrice) * quantity
      } else {
        profitLoss = (entryPrice - exitPrice) * quantity
      }
      return profitLoss
    }
    return null
  }

  const calculateProfitLossPercentage = () => {
    const entryPrice = Number.parseFloat(formData.entry_price)
    const exitPrice = Number.parseFloat(formData.exit_price)

    if (entryPrice && exitPrice) {
      let percentage = 0
      if (formData.trade_type === "buy" || formData.trade_type === "long") {
        percentage = ((exitPrice - entryPrice) / entryPrice) * 100
      } else {
        percentage = ((entryPrice - exitPrice) / entryPrice) * 100
      }
      return percentage
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const profitLoss = !isTradeOpen ? calculateProfitLoss() : null
      const profitLossPercentage = !isTradeOpen ? calculateProfitLossPercentage() : null

      const tradeData = {
        user_id: user.id,
        symbol: formData.symbol.toUpperCase(),
        trade_type: formData.trade_type,
        market_type: formData.market_type,
        strategy_id: formData.strategy_id || null,
        entry_price: Number.parseFloat(formData.entry_price),
        exit_price: !isTradeOpen && formData.exit_price ? Number.parseFloat(formData.exit_price) : null,
        quantity: Number.parseFloat(formData.quantity),
        stop_loss: formData.stop_loss ? Number.parseFloat(formData.stop_loss) : null,
        take_profit: formData.take_profit ? Number.parseFloat(formData.take_profit) : null,
        risk_amount: formData.risk_amount ? Number.parseFloat(formData.risk_amount) : null,
        profit_loss: profitLoss,
        profit_loss_percentage: profitLossPercentage,
        entry_time: formData.entry_time,
        exit_time: !isTradeOpen && formData.exit_time ? formData.exit_time : null,
        status: isTradeOpen ? "open" : "closed",
        trade_setup: formData.trade_setup || null,
        trade_outcome: formData.trade_outcome || null,
        lessons_learned: formData.lessons_learned || null,
        confidence_level: formData.confidence_level ? Number.parseInt(formData.confidence_level) : null,
        emotional_state: formData.emotional_state || null,
        market_condition: formData.market_condition || null,
        news_impact: formData.news_impact || null,
        additional_notes: formData.additional_notes || null,
      }

      const { error } = await supabase.from("trades").insert([tradeData])

      if (error) throw error

      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-white">New Trade Entry</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          {/* Trade Status Toggle */}
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

          {/* Basic Trade Information */}
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
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade_type" className="text-slate-200">
                  Trade Type *
                </Label>
                <Select value={formData.trade_type} onValueChange={(value) => handleInputChange("trade_type", value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select trade type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                    <SelectItem value="short">Short</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="market_type" className="text-slate-200">
                  Market Type *
                </Label>
                <Select value={formData.market_type} onValueChange={(value) => handleInputChange("market_type", value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="forex">Forex</SelectItem>
                    <SelectItem value="stocks">Stocks</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    <SelectItem value="commodities">Commodities</SelectItem>
                    <SelectItem value="indices">Indices</SelectItem>
                    <SelectItem value="futures">Futures</SelectItem>
                    <SelectItem value="options">Options</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strategy_id" className="text-slate-200">
                  Trading Strategy
                </Label>
                <Select value={formData.strategy_id} onValueChange={(value) => handleInputChange("strategy_id", value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select strategy (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {strategies.map((strategy) => (
                      <SelectItem key={strategy.id} value={strategy.id}>
                        {strategy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Trade Execution */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Trade Execution</CardTitle>
              <CardDescription className="text-slate-400">Price and quantity details</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="entry_price" className="text-slate-200">
                  Entry Price *
                </Label>
                <Input
                  id="entry_price"
                  type="number"
                  step="any"
                  placeholder="1.2345"
                  required
                  value={formData.entry_price}
                  onChange={(e) => handleInputChange("entry_price", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              {!isTradeOpen && (
                <div className="space-y-2">
                  <Label htmlFor="exit_price" className="text-slate-200">
                    Exit Price *
                  </Label>
                  <Input
                    id="exit_price"
                    type="number"
                    step="any"
                    placeholder="1.2400"
                    required={!isTradeOpen}
                    value={formData.exit_price}
                    onChange={(e) => handleInputChange("exit_price", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
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
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Risk Management */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Risk Management</CardTitle>
              <CardDescription className="text-slate-400">Stop loss, take profit, and risk parameters</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="stop_loss" className="text-slate-200">
                  Stop Loss
                </Label>
                <Input
                  id="stop_loss"
                  type="number"
                  step="any"
                  placeholder="1.2300"
                  value={formData.stop_loss}
                  onChange={(e) => handleInputChange("stop_loss", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="take_profit" className="text-slate-200">
                  Take Profit
                </Label>
                <Input
                  id="take_profit"
                  type="number"
                  step="any"
                  placeholder="1.2400"
                  value={formData.take_profit}
                  onChange={(e) => handleInputChange("take_profit", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="risk_amount" className="text-slate-200">
                  Risk Amount ($)
                </Label>
                <Input
                  id="risk_amount"
                  type="number"
                  step="any"
                  placeholder="100.00"
                  value={formData.risk_amount}
                  onChange={(e) => handleInputChange("risk_amount", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Trade Timing */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Trade Timing</CardTitle>
              <CardDescription className="text-slate-400">When the trade was executed</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="entry_time" className="text-slate-200">
                  Entry Time *
                </Label>
                <Input
                  id="entry_time"
                  type="datetime-local"
                  required
                  value={formData.entry_time}
                  onChange={(e) => handleInputChange("entry_time", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {!isTradeOpen && (
                <div className="space-y-2">
                  <Label htmlFor="exit_time" className="text-slate-200">
                    Exit Time
                  </Label>
                  <Input
                    id="exit_time"
                    type="datetime-local"
                    value={formData.exit_time}
                    onChange={(e) => handleInputChange("exit_time", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trade Analysis */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Trade Analysis</CardTitle>
              <CardDescription className="text-slate-400">Document your trading setup and analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="trade_setup" className="text-slate-200">
                  Trade Setup
                </Label>
                <Textarea
                  id="trade_setup"
                  placeholder="Describe the technical setup, patterns, or signals that led to this trade..."
                  value={formData.trade_setup}
                  onChange={(e) => handleInputChange("trade_setup", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 min-h-[100px]"
                />
              </div>

              {!isTradeOpen && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="trade_outcome" className="text-slate-200">
                      Trade Outcome
                    </Label>
                    <Textarea
                      id="trade_outcome"
                      placeholder="What happened with this trade? Did it go as expected?"
                      value={formData.trade_outcome}
                      onChange={(e) => handleInputChange("trade_outcome", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lessons_learned" className="text-slate-200">
                      Lessons Learned
                    </Label>
                    <Textarea
                      id="lessons_learned"
                      placeholder="What did you learn from this trade? What would you do differently?"
                      value={formData.lessons_learned}
                      onChange={(e) => handleInputChange("lessons_learned", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 min-h-[100px]"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Psychology & Market Conditions */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Psychology & Market Conditions</CardTitle>
              <CardDescription className="text-slate-400">
                Track your emotional state and market environment
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="confidence_level" className="text-slate-200">
                  Confidence Level (1-10)
                </Label>
                <Select
                  value={formData.confidence_level}
                  onValueChange={(value) => handleInputChange("confidence_level", value)}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Rate your confidence" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        {level} - {level <= 3 ? "Low" : level <= 7 ? "Medium" : "High"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emotional_state" className="text-slate-200">
                  Emotional State
                </Label>
                <Select
                  value={formData.emotional_state}
                  onValueChange={(value) => handleInputChange("emotional_state", value)}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="How did you feel?" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="excited">Excited</SelectItem>
                    <SelectItem value="fearful">Fearful</SelectItem>
                    <SelectItem value="greedy">Greedy</SelectItem>
                    <SelectItem value="confident">Confident</SelectItem>
                    <SelectItem value="uncertain">Uncertain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="market_condition" className="text-slate-200">
                  Market Condition
                </Label>
                <Select
                  value={formData.market_condition}
                  onValueChange={(value) => handleInputChange("market_condition", value)}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Market environment" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="trending">Trending</SelectItem>
                    <SelectItem value="ranging">Ranging</SelectItem>
                    <SelectItem value="volatile">Volatile</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="news_impact" className="text-slate-200">
                  News Impact
                </Label>
                <Select value={formData.news_impact} onValueChange={(value) => handleInputChange("news_impact", value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="News influence" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Additional Notes</CardTitle>
              <CardDescription className="text-slate-400">Any other relevant information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="additional_notes" className="text-slate-200">
                  Notes
                </Label>
                <Textarea
                  id="additional_notes"
                  placeholder="Any additional observations, screenshots references, or notes..."
                  value={formData.additional_notes}
                  onChange={(e) => handleInputChange("additional_notes", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Profit/Loss Preview for Closed Trades */}
          {!isTradeOpen && formData.entry_price && formData.exit_price && formData.quantity && (
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

          {/* Error Display */}
          {error && (
            <Card className="border-red-800 bg-red-900/20">
              <CardContent className="pt-6">
                <div className="text-red-400 text-sm">{error}</div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 flex-1" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving Trade..." : "Save Trade"}
            </Button>
            <Button
              type="button"
              variant="outline"
              asChild
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <Link href="/dashboard">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
