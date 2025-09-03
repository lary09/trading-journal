"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Plus, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface TradeModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string | null
}

export function TradeModal({ isOpen, onClose, selectedDate }: TradeModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    symbol: "",
    trade_type: "",
    market_type: "",
    entry_price: "",
    entry_date: "",
    exit_price: "",
    quantity: "",
    stop_loss: "",
    take_profit: "",
    profit_loss: "",
    status: "open",
    trade_setup: "",
    additional_notes: "",
    confidence_level: "",
    emotional_state: "",
    market_condition: ""
  })

  const resetForm = () => {
    setFormData({
      symbol: "",
      trade_type: "",
      market_type: "",
      entry_price: "",
      entry_date: "",
      exit_price: "",
      quantity: "",
      stop_loss: "",
      take_profit: "",
      profit_loss: "",
      status: "open",
      trade_setup: "",
      additional_notes: "",
      confidence_level: "",
      emotional_state: "",
      market_condition: ""
    })
    // Don't call onClose here to avoid infinite loop
  }

  useEffect(() => {
    if (isOpen && selectedDate) {
      // When modal opens with a selected date, set it as the entry date
      setFormData(prev => ({
        ...prev,
        entry_date: selectedDate
      }))
    } else if (!isOpen) {
      // Reset form when modal is closed
      resetForm()
    }
  }, [isOpen, selectedDate])

  const handleClose = () => {
    onClose()
    // Don't reset form here to avoid flicker when closing
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error("User not authenticated")
      }

      // Prepare trade data with selected date if available
      const entryTime = selectedDate ? new Date(selectedDate) : new Date()
      
      // Prepare trade data with selected date if available
      const tradeData = {
        user_id: user.id,
        symbol: formData.symbol,
        trade_type: formData.trade_type,
        market_type: formData.market_type,
        entry_price: formData.entry_price ? parseFloat(formData.entry_price) : null,
        entry_date: formData.entry_date || new Date().toISOString().split('T')[0],
        entry_time: formData.entry_date ? `${formData.entry_date}T${new Date().toTimeString().split(' ')[0]}` : new Date().toISOString(),
        exit_price: formData.exit_price ? parseFloat(formData.exit_price) : null,
        exit_time: formData.status === 'closed' && formData.exit_price ? new Date().toISOString() : null,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
        take_profit: formData.take_profit ? parseFloat(formData.take_profit) : null,
        profit_loss: formData.profit_loss ? parseFloat(formData.profit_loss) : null,
        status: formData.status,
        trade_setup: formData.trade_setup || null,
        additional_notes: formData.additional_notes || null,
        confidence_level: formData.confidence_level ? parseInt(formData.confidence_level) : null,
        emotional_state: formData.emotional_state || null,
        market_condition: formData.market_condition || null
      }

      const { error } = await supabase
        .from('trades')
        .insert([tradeData])

      if (error) {
        throw error
      }

      toast({
        title: "Trade Created",
        description: "Your trade has been recorded successfully.",
      })

      handleClose()
      // Optionally refresh the calendar data here
      window.location.reload()
    } catch (error) {
      console.error('Error creating trade:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create trade. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] bg-slate-800 border-slate-700 text-white flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl font-bold">Add New Trade</DialogTitle>
              <DialogDescription className="text-slate-400">
                {selectedDate ? `Trade for ${new Date(selectedDate).toLocaleDateString()}` : 'Fill in the details of your trade'}
              </DialogDescription>
            </div>
            {selectedDate && (
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                className="text-slate-300 border-slate-600 hover:bg-slate-700"
                onClick={() => setFormData(prev => ({ ...prev, entry_date: '' }))}
              >
                <X className="h-4 w-4 mr-1" /> Clear Date
              </Button>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2 -mr-2 max-h-[60vh] flex-1">
          {/* Basic Trade Information */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-sm text-slate-300">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="e.g., AAPL"
                    value={formData.symbol}
                    onChange={(e) => handleInputChange('symbol', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entry_date">Entry Date & Time</Label>
                  <div className="relative">
                    <Input
                      id="entry_date"
                      type="datetime-local"
                      value={formData.entry_date ? formData.entry_date.slice(0, 16) : ''}
                      onChange={(e) => {
                        const newDate = e.target.value ? new Date(e.target.value).toISOString() : null;
                        setFormData(prev => ({ ...prev, entry_date: newDate || '' }));
                      }}
                      className="pr-10"
                    />
                    <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trade_type" className="text-slate-300">Trade Type</Label>
                  <Select 
                    value={formData.trade_type} 
                    onValueChange={(value) => handleInputChange("trade_type", value)}
                    required
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="market_type" className="text-slate-300">Market Type</Label>
                  <Select 
                    value={formData.market_type} 
                    onValueChange={(value) => handleInputChange("market_type", value)}
                    required
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select market" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="forex">Forex</SelectItem>
                      <SelectItem value="stocks">Stocks</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="commodities">Commodities</SelectItem>
                      <SelectItem value="indices">Indices</SelectItem>
                      <SelectItem value="futures">Futures</SelectItem>
                      <SelectItem value="options">Options</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-slate-300">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleInputChange("status", value)}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price and Quantity */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-sm text-slate-300">Price & Quantity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entry_price" className="text-slate-300">Entry Price</Label>
                  <Input
                    id="entry_price"
                    type="number"
                    step="0.00001"
                    placeholder="0.00"
                    value={formData.entry_price}
                    onChange={(e) => handleInputChange("entry_price", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exit_price" className="text-slate-300">Exit Price</Label>
                  <Input
                    id="exit_price"
                    type="number"
                    step="0.00001"
                    placeholder="0.00"
                    value={formData.exit_price}
                    onChange={(e) => handleInputChange("exit_price", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-slate-300">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.00001"
                    placeholder="0.00"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stop_loss" className="text-slate-300">Stop Loss</Label>
                  <Input
                    id="stop_loss"
                    type="number"
                    step="0.00001"
                    placeholder="0.00"
                    value={formData.stop_loss}
                    onChange={(e) => handleInputChange("stop_loss", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="take_profit" className="text-slate-300">Take Profit</Label>
                  <Input
                    id="take_profit"
                    type="number"
                    step="0.00001"
                    placeholder="0.00"
                    value={formData.take_profit}
                    onChange={(e) => handleInputChange("take_profit", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profit_loss" className="text-slate-300">P&L</Label>
                  <Input
                    id="profit_loss"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.profit_loss}
                    onChange={(e) => handleInputChange("profit_loss", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis & Psychology */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-sm text-slate-300">Analysis & Psychology</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="confidence_level" className="text-slate-300">Confidence (1-10)</Label>
                  <Select 
                    value={formData.confidence_level} 
                    onValueChange={(value) => handleInputChange("confidence_level", value)}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {[...Array(10)].map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emotional_state" className="text-slate-300">Emotional State</Label>
                  <Select 
                    value={formData.emotional_state} 
                    onValueChange={(value) => handleInputChange("emotional_state", value)}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select" />
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
                  <Label htmlFor="market_condition" className="text-slate-300">Market Condition</Label>
                  <Select 
                    value={formData.market_condition} 
                    onValueChange={(value) => handleInputChange("market_condition", value)}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="trending">Trending</SelectItem>
                      <SelectItem value="ranging">Ranging</SelectItem>
                      <SelectItem value="volatile">Volatile</SelectItem>
                      <SelectItem value="calm">Calm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade_setup" className="text-slate-300">Trade Setup</Label>
                <Textarea
                  id="trade_setup"
                  placeholder="Describe your trade setup and reasoning..."
                  value={formData.trade_setup}
                  onChange={(e) => handleInputChange("trade_setup", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_notes" className="text-slate-300">Additional Notes</Label>
                <Textarea
                  id="additional_notes"
                  placeholder="Any additional notes or observations..."
                  value={formData.additional_notes}
                  onChange={(e) => handleInputChange("additional_notes", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-slate-500 text-slate-200 hover:bg-slate-600 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Creating..." : "Create Trade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
