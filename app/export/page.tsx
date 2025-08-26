"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, FileText, Database, Calendar, Filter } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface Trade {
  id: string
  symbol: string
  trade_type: string
  market_type: string
  entry_price: number
  exit_price: number | null
  quantity: number
  stop_loss: number | null
  take_profit: number | null
  risk_amount: number | null
  profit_loss: number | null
  profit_loss_percentage: number | null
  entry_time: string
  exit_time: string | null
  status: string
  trade_setup: string | null
  trade_outcome: string | null
  lessons_learned: string | null
  confidence_level: number | null
  emotional_state: string | null
  market_condition: string | null
  news_impact: string | null
  additional_notes: string | null
  created_at: string
}

interface Strategy {
  id: string
  name: string
}

export default function ExportPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [filteredCount, setFilteredCount] = useState(0)

  // Filter state
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    marketType: "",
    tradeType: "",
    status: "",
    strategyId: "",
  })

  // Export options
  const [exportOptions, setExportOptions] = useState({
    format: "csv",
    includeAnalysis: true,
    includeNotes: true,
    includeMetadata: false,
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, trades])

  const fetchData = async () => {
    const supabase = createClient()

    // Fetch trades
    const { data: tradesData, error: tradesError } = await supabase
      .from("trades")
      .select("*")
      .order("entry_time", { ascending: false })

    if (tradesError) {
      setError("Failed to fetch trades data")
      return
    }

    // Fetch strategies
    const { data: strategiesData } = await supabase.from("trading_strategies").select("id, name")

    setTrades(tradesData || [])
    setStrategies(strategiesData || [])
  }

  const applyFilters = () => {
    let filtered = trades

    if (filters.dateFrom) {
      filtered = filtered.filter((trade) => new Date(trade.entry_time) >= new Date(filters.dateFrom))
    }

    if (filters.dateTo) {
      filtered = filtered.filter((trade) => new Date(trade.entry_time) <= new Date(filters.dateTo))
    }

    if (filters.marketType) {
      filtered = filtered.filter((trade) => trade.market_type === filters.marketType)
    }

    if (filters.tradeType) {
      filtered = filtered.filter((trade) => trade.trade_type === filters.tradeType)
    }

    if (filters.status) {
      filtered = filtered.filter((trade) => trade.status === filters.status)
    }

    if (filters.strategyId) {
      filtered = filtered.filter((trade) => trade.strategy_id === filters.strategyId)
    }

    setFilteredCount(filtered.length)
  }

  const getFilteredTrades = () => {
    let filtered = trades

    if (filters.dateFrom) {
      filtered = filtered.filter((trade) => new Date(trade.entry_time) >= new Date(filters.dateFrom))
    }

    if (filters.dateTo) {
      filtered = filtered.filter((trade) => new Date(trade.entry_time) <= new Date(filters.dateTo))
    }

    if (filters.marketType) {
      filtered = filtered.filter((trade) => trade.market_type === filters.marketType)
    }

    if (filters.tradeType) {
      filtered = filtered.filter((trade) => trade.trade_type === filters.tradeType)
    }

    if (filters.status) {
      filtered = filtered.filter((trade) => trade.status === filters.status)
    }

    if (filters.strategyId) {
      filtered = filtered.filter((trade) => trade.strategy_id === filters.strategyId)
    }

    return filtered
  }

  const prepareExportData = (trades: Trade[]) => {
    return trades.map((trade) => {
      const baseData = {
        id: trade.id,
        symbol: trade.symbol,
        trade_type: trade.trade_type,
        market_type: trade.market_type,
        entry_price: trade.entry_price,
        exit_price: trade.exit_price,
        quantity: trade.quantity,
        stop_loss: trade.stop_loss,
        take_profit: trade.take_profit,
        risk_amount: trade.risk_amount,
        profit_loss: trade.profit_loss,
        profit_loss_percentage: trade.profit_loss_percentage,
        entry_time: trade.entry_time,
        exit_time: trade.exit_time,
        status: trade.status,
      }

      if (exportOptions.includeAnalysis) {
        Object.assign(baseData, {
          trade_setup: trade.trade_setup,
          trade_outcome: trade.trade_outcome,
          lessons_learned: trade.lessons_learned,
          confidence_level: trade.confidence_level,
          emotional_state: trade.emotional_state,
          market_condition: trade.market_condition,
          news_impact: trade.news_impact,
        })
      }

      if (exportOptions.includeNotes) {
        Object.assign(baseData, {
          additional_notes: trade.additional_notes,
        })
      }

      if (exportOptions.includeMetadata) {
        Object.assign(baseData, {
          created_at: trade.created_at,
        })
      }

      return baseData
    })
  }

  const exportToCSV = (data: any[]) => {
    if (data.length === 0) {
      setError("No data to export")
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            // Handle null/undefined values and escape commas/quotes
            if (value === null || value === undefined) return ""
            const stringValue = String(value)
            if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `trading-journal-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToJSON = (data: any[]) => {
    if (data.length === 0) {
      setError("No data to export")
      return
    }

    const exportData = {
      exported_at: new Date().toISOString(),
      total_records: data.length,
      filters_applied: filters,
      data: data,
    }

    const jsonContent = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `trading-journal-${new Date().toISOString().split("T")[0]}.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExport = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const filteredTrades = getFilteredTrades()
      const exportData = prepareExportData(filteredTrades)

      if (exportOptions.format === "csv") {
        exportToCSV(exportData)
      } else {
        exportToJSON(exportData)
      }
    } catch (error) {
      setError("Failed to export data")
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      marketType: "",
      tradeType: "",
      status: "",
      strategyId: "",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
              <h1 className="text-2xl font-bold text-white">Export Trading Data</h1>
              <Badge variant="outline" className="border-green-600 text-green-400">
                Data Export
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Export Summary */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5" />
                Export Summary
              </CardTitle>
              <CardDescription className="text-slate-400">
                Export your trading data with customizable filters and formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{trades.length}</div>
                  <div className="text-sm text-slate-400">Total Trades</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{filteredCount}</div>
                  <div className="text-sm text-slate-400">Filtered Results</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {trades.filter((t) => t.status === "closed").length}
                  </div>
                  <div className="text-sm text-slate-400">Closed Trades</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Data Filters
                  </CardTitle>
                  <CardDescription className="text-slate-400">Filter the data you want to export</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  Clear Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom" className="text-slate-200">
                    From Date
                  </Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo" className="text-slate-200">
                    To Date
                  </Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              {/* Other Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marketType" className="text-slate-200">
                    Market Type
                  </Label>
                  <Select
                    value={filters.marketType}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, marketType: value }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="All markets" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="all">All Markets</SelectItem>
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
                  <Label htmlFor="tradeType" className="text-slate-200">
                    Trade Type
                  </Label>
                  <Select
                    value={filters.tradeType}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, tradeType: value }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-slate-200">
                    Status
                  </Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="strategyId" className="text-slate-200">
                    Strategy
                  </Label>
                  <Select
                    value={filters.strategyId}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, strategyId: value }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="All strategies" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="all">All Strategies</SelectItem>
                      {strategies.map((strategy) => (
                        <SelectItem key={strategy.id} value={strategy.id}>
                          {strategy.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Export Options
              </CardTitle>
              <CardDescription className="text-slate-400">
                Customize your export format and included data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Format Selection */}
              <div className="space-y-2">
                <Label className="text-slate-200">Export Format</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="csv"
                      name="format"
                      value="csv"
                      checked={exportOptions.format === "csv"}
                      onChange={(e) => setExportOptions((prev) => ({ ...prev, format: e.target.value }))}
                      className="text-blue-600"
                    />
                    <Label htmlFor="csv" className="text-slate-200">
                      CSV (Comma Separated Values)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="json"
                      name="format"
                      value="json"
                      checked={exportOptions.format === "json"}
                      onChange={(e) => setExportOptions((prev) => ({ ...prev, format: e.target.value }))}
                      className="text-blue-600"
                    />
                    <Label htmlFor="json" className="text-slate-200">
                      JSON (JavaScript Object Notation)
                    </Label>
                  </div>
                </div>
              </div>

              {/* Include Options */}
              <div className="space-y-4">
                <Label className="text-slate-200">Include in Export</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeAnalysis"
                      checked={exportOptions.includeAnalysis}
                      onCheckedChange={(checked) =>
                        setExportOptions((prev) => ({ ...prev, includeAnalysis: checked as boolean }))
                      }
                    />
                    <Label htmlFor="includeAnalysis" className="text-slate-200">
                      Trade Analysis
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeNotes"
                      checked={exportOptions.includeNotes}
                      onCheckedChange={(checked) =>
                        setExportOptions((prev) => ({ ...prev, includeNotes: checked as boolean }))
                      }
                    />
                    <Label htmlFor="includeNotes" className="text-slate-200">
                      Additional Notes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeMetadata"
                      checked={exportOptions.includeMetadata}
                      onCheckedChange={(checked) =>
                        setExportOptions((prev) => ({ ...prev, includeMetadata: checked as boolean }))
                      }
                    />
                    <Label htmlFor="includeMetadata" className="text-slate-200">
                      Metadata
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Action */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">Ready to Export</h3>
                  <p className="text-slate-400">
                    {filteredCount} trades will be exported in {exportOptions.format.toUpperCase()} format
                  </p>
                </div>
                <Button
                  onClick={handleExport}
                  disabled={isLoading || filteredCount === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isLoading ? "Exporting..." : "Export Data"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="border-red-800 bg-red-900/20">
              <CardContent className="pt-6">
                <div className="text-red-400 text-sm">{error}</div>
              </CardContent>
            </Card>
          )}

          {/* Quick Export Actions */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Quick Export</CardTitle>
              <CardDescription className="text-slate-400">Common export scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    clearFilters()
                    setExportOptions({
                      format: "csv",
                      includeAnalysis: false,
                      includeNotes: false,
                      includeMetadata: false,
                    })
                    setTimeout(handleExport, 100)
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  All Trades (Basic CSV)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, status: "closed" }))
                    setExportOptions({
                      format: "csv",
                      includeAnalysis: true,
                      includeNotes: true,
                      includeMetadata: false,
                    })
                    setTimeout(handleExport, 100)
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Closed Trades (Full CSV)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    clearFilters()
                    setExportOptions({
                      format: "json",
                      includeAnalysis: true,
                      includeNotes: true,
                      includeMetadata: true,
                    })
                    setTimeout(handleExport, 100)
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Complete Backup (JSON)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
