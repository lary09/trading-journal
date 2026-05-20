"use client"

import type React from "react"
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, TrendingUp } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"

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
  initialData?: Partial<typeof DEFAULT_FORM> & { id?: string; isTradeOpen?: boolean }
  mode?: "create" | "edit"
}

const DEFAULT_FORM = {
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
}

export function NewTradeForm({ strategies: initialStrategies, initialData, mode = "create" }: NewTradeFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [strategies] = useState<StrategyOption[]>(initialStrategies)
  const [isTradeOpen, setIsTradeOpen] = useState(initialData?.isTradeOpen ?? true)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [formData, setFormData] = useState({ ...DEFAULT_FORM, ...initialData })

  useEffect(() => {
    if (mode === "edit") return
    const now = new Date()
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    setFormData((prev) => ({ ...prev, entryTime: localDateTime }))
  }, [mode])

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
      const submit = mode === "edit"
        ? fetch(`/api/trades/${initialData?.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...formData,
              strategyId: formData.strategyId || null,
              exitPrice: isTradeOpen ? null : formData.exitPrice || null,
              exitTime: isTradeOpen ? null : formData.exitTime || null,
              status: isTradeOpen ? "open" : "closed",
            }),
          }).then(async (res) => {
            const json = await res.json().catch(() => null)
            if (!res.ok) throw new Error(json?.error || "Unable to update trade")
            return json
          })
        : createTradeAction({
            ...formData,
            isTradeOpen,
          })

      void submit
        .then(() => {
          router.push(mode === "edit" && initialData?.id ? `/trades/${initialData.id}` : "/dashboard")
          router.refresh()
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "An error occurred")
        })
        .finally(() => setIsLoading(false))
    })
  }

  const saving = isLoading || isPending
  const panelClass = "terminal-panel"
  const labelClass = "text-slate-200"
  const inputClass =
    "border-border/80 bg-background/50 text-foreground placeholder:text-muted-foreground/65 focus-visible:ring-primary/25"
  const selectTriggerClass =
    "border-border/80 bg-background/50 text-foreground hover:border-primary/40 focus:ring-primary/25"
  const selectContentClass = "border-border bg-popover text-popover-foreground"
  const selectItemClass = "text-foreground focus:bg-primary/10 focus:text-foreground"
  const textareaClass =
    "min-h-[100px] border-border/80 bg-background/50 text-foreground placeholder:text-muted-foreground/65 focus-visible:ring-primary/25"

  return (
    <AppShell
       title={mode === "edit" ? "Edit Trade" : "New Trade Entry"}
      cta={
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card className="terminal-panel py-6">
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="terminal-kicker mb-2">Execution Capture</div>
                <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{mode === "edit" ? "Refine the trade record with final context." : "Log the trade before the details fade."}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Record setup, risk, timing and psychology in one structured workflow.
                </p>
              </div>
              <div className="terminal-panel-muted px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Mode</div>
                <div className="mt-2 text-xl font-semibold text-white">{isTradeOpen ? "Open trade" : "Closed trade"}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="terminal-panel py-6">
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="terminal-kicker">Checklist</div>
              <p>Capture required execution data first, then add context while it is still fresh.</p>
            </CardContent>
          </Card>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className={panelClass}>
            <CardHeader>
              <CardTitle className="text-white">Trade Status</CardTitle>
              <CardDescription>Is this an open trade or a completed trade?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trade-open"
                  checked={isTradeOpen}
                  onCheckedChange={(checked) => setIsTradeOpen(checked as boolean)}
                />
                <Label htmlFor="trade-open" className={labelClass}>
                  This is an open trade (not yet closed)
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card className={panelClass}>
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
              <CardDescription>Enter the fundamental details of your trade</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="symbol" className={labelClass}>
                  Symbol *
                </Label>
                <Input
                  id="symbol"
                  placeholder="EURUSD, AAPL, BTC/USD"
                  required
                  value={formData.symbol}
                  onChange={(e) => handleInputChange("symbol", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradeType" className={labelClass}>
                  Trade Type *
                </Label>
                <Select value={formData.tradeType} onValueChange={(value) => handleInputChange("tradeType", value)}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Select trade type" className={labelClass} />
                  </SelectTrigger>
                  <SelectContent className={selectContentClass}>
                    <SelectItem value="buy" className={selectItemClass}>Buy</SelectItem>
                    <SelectItem value="sell" className={selectItemClass}>Sell</SelectItem>
                    <SelectItem value="long" className={selectItemClass}>Long</SelectItem>
                    <SelectItem value="short" className={selectItemClass}>Short</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketType" className={labelClass}>
                  Market Type *
                </Label>
                <Select value={formData.marketType} onValueChange={(value) => handleInputChange("marketType", value)}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Select market" className={labelClass} />
                  </SelectTrigger>
                  <SelectContent className={selectContentClass}>
                    <SelectItem value="forex" className={selectItemClass}>Forex</SelectItem>
                    <SelectItem value="stocks" className={selectItemClass}>Stocks</SelectItem>
                    <SelectItem value="crypto" className={selectItemClass}>Cryptocurrency</SelectItem>
                    <SelectItem value="commodities" className={selectItemClass}>Commodities</SelectItem>
                    <SelectItem value="indices" className={selectItemClass}>Indices</SelectItem>
                    <SelectItem value="futures" className={selectItemClass}>Futures</SelectItem>
                    <SelectItem value="options" className={selectItemClass}>Options</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strategyId" className={labelClass}>
                  Trading Strategy
                </Label>
                <Select value={formData.strategyId} onValueChange={(value) => handleInputChange("strategyId", value)}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Select strategy (optional)" className={labelClass} />
                  </SelectTrigger>
                  <SelectContent className={selectContentClass}>
                    {strategies.map((strategy) => (
                      <SelectItem key={strategy.id} value={strategy.id} className={selectItemClass}>
                        {strategy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className={panelClass}>
            <CardHeader>
              <CardTitle className="text-white">Trade Execution</CardTitle>
              <CardDescription>Price and quantity details</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="entryPrice" className={labelClass}>
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
                  className={inputClass}
                />
              </div>

              {!isTradeOpen && (
                <div className="space-y-2">
                  <Label htmlFor="exitPrice" className={labelClass}>
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
                    className={inputClass}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="quantity" className={labelClass}>
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
                  className={inputClass}
                />
              </div>
            </CardContent>
          </Card>

          <Card className={panelClass}>
            <CardHeader>
              <CardTitle className="text-white">Risk Management</CardTitle>
              <CardDescription>Stop loss, take profit, and risk parameters</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="stopLoss" className={labelClass}>
                  Stop Loss
                </Label>
                <Input
                  id="stopLoss"
                  type="number"
                  step="any"
                  placeholder="1.2300"
                  value={formData.stopLoss}
                  onChange={(e) => handleInputChange("stopLoss", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="takeProfit" className={labelClass}>
                  Take Profit
                </Label>
                <Input
                  id="takeProfit"
                  type="number"
                  step="any"
                  placeholder="1.2400"
                  value={formData.takeProfit}
                  onChange={(e) => handleInputChange("takeProfit", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskAmount" className={labelClass}>
                  Risk Amount ($)
                </Label>
                <Input
                  id="riskAmount"
                  type="number"
                  step="any"
                  placeholder="100.00"
                  value={formData.riskAmount}
                  onChange={(e) => handleInputChange("riskAmount", e.target.value)}
                  className={inputClass}
                />
              </div>
            </CardContent>
          </Card>

          <Card className={panelClass}>
            <CardHeader>
              <CardTitle className="text-white">Trade Timing</CardTitle>
              <CardDescription>When the trade was executed</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="entryTime" className={labelClass}>
                  Entry Time *
                </Label>
                <Input
                  id="entryTime"
                  type="datetime-local"
                  required
                  value={formData.entryTime}
                  onChange={(e) => handleInputChange("entryTime", e.target.value)}
                  className={inputClass}
                />
              </div>

              {!isTradeOpen && (
                <div className="space-y-2">
                  <Label htmlFor="exitTime" className={labelClass}>
                    Exit Time
                  </Label>
                  <Input
                    id="exitTime"
                    type="datetime-local"
                    value={formData.exitTime}
                    onChange={(e) => handleInputChange("exitTime", e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={panelClass}>
            <CardHeader>
              <CardTitle className="text-white">Trade Analysis</CardTitle>
              <CardDescription>Document your trading setup and analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tradeSetup" className={labelClass}>
                  Trade Setup
                </Label>
                <Textarea
                  id="tradeSetup"
                  placeholder="Describe the technical setup, patterns, or signals that led to this trade..."
                  value={formData.tradeSetup}
                  onChange={(e) => handleInputChange("tradeSetup", e.target.value)}
                  className={textareaClass}
                />
              </div>

              {!isTradeOpen && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tradeOutcome" className={labelClass}>
                      Trade Outcome
                    </Label>
                    <Textarea
                      id="tradeOutcome"
                      placeholder="What happened with this trade? Did it go as expected?"
                      value={formData.tradeOutcome}
                      onChange={(e) => handleInputChange("tradeOutcome", e.target.value)}
                      className={textareaClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lessonsLearned" className={labelClass}>
                      Lessons Learned
                    </Label>
                    <Textarea
                      id="lessonsLearned"
                      placeholder="What did you learn from this trade? What would you do differently?"
                      value={formData.lessonsLearned}
                      onChange={(e) => handleInputChange("lessonsLearned", e.target.value)}
                      className={textareaClass}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className={panelClass}>
            <CardHeader>
              <CardTitle className="text-white">Psychology & Market Conditions</CardTitle>
              <CardDescription>
                Track your emotional state and market environment
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="confidenceLevel" className={labelClass}>
                  Confidence Level (1-10)
                </Label>
                <Select
                  value={formData.confidenceLevel}
                  onValueChange={(value) => handleInputChange("confidenceLevel", value)}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Rate your confidence" className={labelClass} />
                  </SelectTrigger>
                  <SelectContent className={selectContentClass}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                      <SelectItem key={level} value={level.toString()} className={selectItemClass}>
                        {level} - {level <= 3 ? "Low" : level <= 7 ? "Medium" : "High"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emotionalState" className={labelClass}>
                  Emotional State
                </Label>
                <Select
                  value={formData.emotionalState}
                  onValueChange={(value) => handleInputChange("emotionalState", value)}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="How did you feel?" className={labelClass} />
                  </SelectTrigger>
                  <SelectContent className={selectContentClass}>
                    <SelectItem value="calm" className={selectItemClass}>Calm</SelectItem>
                    <SelectItem value="excited" className={selectItemClass}>Excited</SelectItem>
                    <SelectItem value="fearful" className={selectItemClass}>Fearful</SelectItem>
                    <SelectItem value="greedy" className={selectItemClass}>Greedy</SelectItem>
                    <SelectItem value="confident" className={selectItemClass}>Confident</SelectItem>
                    <SelectItem value="uncertain" className={selectItemClass}>Uncertain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketCondition" className={labelClass}>
                  Market Condition
                </Label>
                <Select
                  value={formData.marketCondition}
                  onValueChange={(value) => handleInputChange("marketCondition", value)}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Market environment" className={labelClass} />
                  </SelectTrigger>
                  <SelectContent className={selectContentClass}>
                    <SelectItem value="trending" className={selectItemClass}>Trending</SelectItem>
                    <SelectItem value="ranging" className={selectItemClass}>Ranging</SelectItem>
                    <SelectItem value="volatile" className={selectItemClass}>Volatile</SelectItem>
                    <SelectItem value="calm" className={selectItemClass}>Calm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newsImpact" className={labelClass}>
                  News Impact
                </Label>
                <Select value={formData.newsImpact} onValueChange={(value) => handleInputChange("newsImpact", value)}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="News influence" className={labelClass} />
                  </SelectTrigger>
                  <SelectContent className={selectContentClass}>
                    <SelectItem value="none" className={selectItemClass}>None</SelectItem>
                    <SelectItem value="low" className={selectItemClass}>Low</SelectItem>
                    <SelectItem value="medium" className={selectItemClass}>Medium</SelectItem>
                    <SelectItem value="high" className={selectItemClass}>High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className={panelClass}>
            <CardHeader>
              <CardTitle className="text-white">Additional Notes</CardTitle>
              <CardDescription>Any other relevant information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="additionalNotes" className={labelClass}>
                  Notes
                </Label>
                <Textarea
                  id="additionalNotes"
                  placeholder="Any additional observations, screenshots references, or notes..."
                  value={formData.additionalNotes}
                  onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                  className={textareaClass}
                />
              </div>
            </CardContent>
          </Card>

          {!isTradeOpen && formData.entryPrice && formData.exitPrice && formData.quantity && (
            <Card className={panelClass}>
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trade Result Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profit/Loss:</span>
                    <span className={`font-medium ${calculateProfitLoss()! >= 0 ? "text-green-400" : "text-red-400"}`}>
                      ${calculateProfitLoss()?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Return %:</span>
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
            <Card className="border-rose-500/30 bg-rose-950/30">
              <CardContent className="pt-6">
                <div className="text-red-400 text-sm">{error}</div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              className="flex-1"
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" />
               {saving ? (mode === "edit" ? "Updating Trade..." : "Saving Trade...") : (mode === "edit" ? "Update Trade" : "Save Trade")}
             </Button>
            <Button
              type="button"
              variant="outline"
              asChild
            >
              <Link href="/dashboard">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
