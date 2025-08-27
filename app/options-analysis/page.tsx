"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  BookOpen,
  Brain,
  Shield
} from "lucide-react"

interface OptionAnalysis {
  symbol: string
  strikePrice: number
  currentPrice: number
  expirationDate: string
  optionType: "call" | "put"
  optionPrice: number
  intrinsicValue: number
  timeValue: number
  impliedVolatility: number
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
}

export default function OptionsAnalysisPage() {
  const [analysis, setAnalysis] = useState<OptionAnalysis | null>(null)
  const [formData, setFormData] = useState({
    symbol: "",
    strikePrice: "",
    currentPrice: "",
    expirationDate: "",
    optionType: "call",
    optionPrice: "",
    impliedVolatility: "",
  })

  const calculateGreeks = (data: any) => {
    // Simplified Black-Scholes calculations (in real app, use a proper library)
    const S = parseFloat(data.currentPrice)
    const K = parseFloat(data.strikePrice)
    const T = (new Date(data.expirationDate).getTime() - new Date().getTime()) / (365 * 24 * 60 * 60 * 1000)
    const r = 0.02 // Risk-free rate
    const sigma = parseFloat(data.impliedVolatility) / 100

    // Simplified calculations (this is a basic approximation)
    const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T))
    const d2 = d1 - sigma * Math.sqrt(T)

    const delta = data.optionType === "call" ? 
      Math.exp(-r * T) * (1 / (1 + Math.exp(-d1 * Math.sqrt(2 * Math.PI)))) :
      Math.exp(-r * T) * (1 / (1 + Math.exp(-d1 * Math.sqrt(2 * Math.PI))) - 1)

    const gamma = Math.exp(-r * T) * Math.exp(-d1 * d1 / 2) / (S * sigma * Math.sqrt(T) * Math.sqrt(2 * Math.PI))
    const theta = -S * sigma * Math.exp(-d1 * d1 / 2) / (2 * Math.sqrt(T) * Math.sqrt(2 * Math.PI)) - r * K * Math.exp(-r * T)
    const vega = S * Math.sqrt(T) * Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI)
    const rho = K * T * Math.exp(-r * T)

    return { delta, gamma, theta, vega, rho }
  }

  const handleCalculate = () => {
    const greeks = calculateGreeks(formData)
    const intrinsicValue = formData.optionType === "call" ?
      Math.max(0, parseFloat(formData.currentPrice) - parseFloat(formData.strikePrice)) :
      Math.max(0, parseFloat(formData.strikePrice) - parseFloat(formData.currentPrice))
    
    const timeValue = parseFloat(formData.optionPrice) - intrinsicValue

    setAnalysis({
      symbol: formData.symbol,
      strikePrice: parseFloat(formData.strikePrice),
      currentPrice: parseFloat(formData.currentPrice),
      expirationDate: formData.expirationDate,
      optionType: formData.optionType as "call" | "put",
      optionPrice: parseFloat(formData.optionPrice),
      intrinsicValue,
      timeValue,
      impliedVolatility: parseFloat(formData.impliedVolatility),
      ...greeks
    })
  }

  const getBuffettRecommendation = (analysis: OptionAnalysis) => {
    const recommendations = []
    
    // Buffett's principles
    if (analysis.intrinsicValue > 0) {
      recommendations.push({
        type: "positive",
        message: "Intrinsic value exists - aligns with Buffett's value investing principle",
        icon: CheckCircle
      })
    } else {
      recommendations.push({
        type: "warning",
        message: "No intrinsic value - pure speculation, Buffett would avoid",
        icon: AlertTriangle
      })
    }

    if (analysis.timeValue > analysis.intrinsicValue * 0.5) {
      recommendations.push({
        type: "warning",
        message: "High time value - Buffett prefers intrinsic value over time value",
        icon: AlertTriangle
      })
    }

    if (analysis.impliedVolatility > 50) {
      recommendations.push({
        type: "negative",
        message: "High volatility - Buffett prefers stable, predictable businesses",
        icon: XCircle
      })
    }

    if (Math.abs(analysis.delta) > 0.7) {
      recommendations.push({
        type: "positive",
        message: "High delta - closer to stock-like behavior, more predictable",
        icon: CheckCircle
      })
    }

    return recommendations
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Options Analysis</h1>
          <p className="text-slate-400">Professional options analysis using Warren Buffett's value investing principles</p>
        </div>

        <Tabs defaultValue="calculator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger value="calculator" className="text-slate-300">Calculator</TabsTrigger>
            <TabsTrigger value="analysis" className="text-slate-300">Analysis</TabsTrigger>
            <TabsTrigger value="principles" className="text-slate-300">Buffett Principles</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Form */}
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Option Parameters
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Enter the option details for analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="symbol" className="text-slate-200">Symbol</Label>
                      <Input
                        id="symbol"
                        placeholder="AAPL"
                        value={formData.symbol}
                        onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="optionType" className="text-slate-200">Type</Label>
                      <Select value={formData.optionType} onValueChange={(value) => setFormData({...formData, optionType: value})}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="put">Put</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currentPrice" className="text-slate-200">Current Price</Label>
                      <Input
                        id="currentPrice"
                        type="number"
                        step="0.01"
                        placeholder="150.00"
                        value={formData.currentPrice}
                        onChange={(e) => setFormData({...formData, currentPrice: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="strikePrice" className="text-slate-200">Strike Price</Label>
                      <Input
                        id="strikePrice"
                        type="number"
                        step="0.01"
                        placeholder="155.00"
                        value={formData.strikePrice}
                        onChange={(e) => setFormData({...formData, strikePrice: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="optionPrice" className="text-slate-200">Option Price</Label>
                      <Input
                        id="optionPrice"
                        type="number"
                        step="0.01"
                        placeholder="5.50"
                        value={formData.optionPrice}
                        onChange={(e) => setFormData({...formData, optionPrice: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="impliedVolatility" className="text-slate-200">Implied Volatility (%)</Label>
                      <Input
                        id="impliedVolatility"
                        type="number"
                        step="0.1"
                        placeholder="25.0"
                        value={formData.impliedVolatility}
                        onChange={(e) => setFormData({...formData, impliedVolatility: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="expirationDate" className="text-slate-200">Expiration Date</Label>
                    <Input
                      id="expirationDate"
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({...formData, expirationDate: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <Button 
                    onClick={handleCalculate}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={!formData.symbol || !formData.strikePrice || !formData.currentPrice || !formData.optionPrice}
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Analysis
                  </Button>
                </CardContent>
              </Card>

              {/* Results */}
              {analysis && (
                <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-lg font-bold text-white">${analysis.intrinsicValue.toFixed(2)}</div>
                        <div className="text-sm text-slate-400">Intrinsic Value</div>
                      </div>
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-lg font-bold text-white">${analysis.timeValue.toFixed(2)}</div>
                        <div className="text-sm text-slate-400">Time Value</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-white font-medium">Greeks</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Delta:</span>
                          <span className="text-white">{analysis.delta.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Gamma:</span>
                          <span className="text-white">{analysis.gamma.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Theta:</span>
                          <span className="text-white">{analysis.theta.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Vega:</span>
                          <span className="text-white">{analysis.vega.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            {analysis ? (
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Buffett-Style Analysis
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Analysis based on Warren Buffett's value investing principles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getBuffettRecommendation(analysis).map((rec, index) => {
                      const Icon = rec.icon
                      return (
                        <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${
                          rec.type === "positive" ? "bg-green-900/20 border border-green-800" :
                          rec.type === "warning" ? "bg-yellow-900/20 border border-yellow-800" :
                          "bg-red-900/20 border border-red-800"
                        }`}>
                          <Icon className={`h-5 w-5 mt-0.5 ${
                            rec.type === "positive" ? "text-green-400" :
                            rec.type === "warning" ? "text-yellow-400" :
                            "text-red-400"
                          }`} />
                          <span className="text-slate-200">{rec.message}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                <CardContent className="text-center py-8">
                  <Info className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">Calculate an option first to see the Buffett-style analysis</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="principles" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Buffett's Options Philosophy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="text-white font-medium">Value Over Speculation</h4>
                        <p className="text-slate-400 text-sm">Buffett only invests when there's intrinsic value, not just time value</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-green-400 mt-0.5" />
                      <div>
                        <h4 className="text-white font-medium">Understand the Business</h4>
                        <p className="text-slate-400 text-sm">Only trade options on companies you understand deeply</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div>
                        <h4 className="text-white font-medium">Long-term Perspective</h4>
                        <p className="text-slate-400 text-sm">Focus on long-term value rather than short-term price movements</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    What Buffett Avoids
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                      <div>
                        <h4 className="text-white font-medium">High Volatility</h4>
                        <p className="text-slate-400 text-sm">Avoid options with excessive implied volatility</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                      <div>
                        <h4 className="text-white font-medium">Pure Time Value</h4>
                        <p className="text-slate-400 text-sm">Don't pay premium for options with no intrinsic value</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                      <div>
                        <h4 className="text-white font-medium">Complex Strategies</h4>
                        <p className="text-slate-400 text-sm">Avoid complex options strategies you don't understand</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
