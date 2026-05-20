"use client"

import * as React from "react"
import {
  FastForward,
  Maximize2,
  Minimize2,
  Minus,
  MousePointer2,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Settings2,
  Square,
  Trash2,
} from "lucide-react"
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  SeriesMarker,
  Time,
  CandlestickSeries,
} from "lightweight-charts"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TradingViewChartProps {
  data: CandlestickData[]
  markers?: SeriesMarker<Time>[]
  colors?: {
    backgroundColor?: string
    textColor?: string
    upColor?: string
    downColor?: string
    wickUpColor?: string
    wickDownColor?: string
    gridColor?: string
  }
}

type DrawingTool = "cursor" | "trend" | "horizontal" | "vertical" | "rectangle"
type Point = { x: number; y: number }
type Drawing = {
  id: string
  tool: Exclude<DrawingTool, "cursor">
  start: Point
  end: Point
}

export function TradingViewChart({
  data,
  markers = [],
  colors: {
    backgroundColor = "transparent",
    textColor = "#94a3b8",
    upColor = "#10b981",
    downColor = "#f43f5e",
    wickUpColor = "#10b981",
    wickDownColor = "#f43f5e",
    gridColor = "rgba(30, 41, 59, 0.4)",
  } = {},
}: TradingViewChartProps) {
  const chartContainerRef = React.useRef<HTMLDivElement>(null)
  const drawingLayerRef = React.useRef<HTMLDivElement>(null)
  const chartRef = React.useRef<IChartApi | null>(null)
  const seriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null)

  // Replay State
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [replaySpeed, setReplaySpeed] = React.useState(500) // ms per candle
  const [currentIndex, setCurrentIndex] = React.useState<number>(Math.max(0, data.length - 20)) // Start showing some candles
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [activeTool, setActiveTool] = React.useState<DrawingTool>("cursor")
  const [drawings, setDrawings] = React.useState<Drawing[]>([])
  const [draftDrawing, setDraftDrawing] = React.useState<Drawing | null>(null)

  // Initialize the chart
  React.useEffect(() => {
    if (!chartContainerRef.current) return

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || 400,
        })
      }
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: gridColor,
      },
      rightPriceScale: { borderColor: gridColor },
      crosshair: { mode: 1 },
    })

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor,
      downColor,
      borderVisible: false,
      wickUpColor,
      wickDownColor,
    }) as unknown as ISeriesApi<"Candlestick">


    chartRef.current = chart
    seriesRef.current = candlestickSeries

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(chartContainerRef.current)
    window.addEventListener("resize", handleResize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", handleResize)
      chart.remove()
    }
  }, [backgroundColor, textColor, upColor, downColor, wickUpColor, wickDownColor, gridColor])

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || 400,
        })
        chartRef.current.timeScale().fitContent()
      }
    }, 50)

    return () => window.clearTimeout(timeout)
  }, [isFullscreen])

  // Apply initial data when data changes or replay resets
  React.useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      if (!isPlaying && currentIndex === data.length) {
         seriesRef.current.setData(data)
         if (markers.length > 0 && typeof (seriesRef.current as any).setMarkers === 'function') {
           (seriesRef.current as any).setMarkers(markers)
         }
      } else {
         const slicedData = data.slice(0, currentIndex)
         seriesRef.current.setData(slicedData)
         if (markers.length > 0 && typeof (seriesRef.current as any).setMarkers === 'function') {
           const slicedMarkers = markers.filter(m => slicedData.some(d => d.time === m.time))
           ;(seriesRef.current as any).setMarkers(slicedMarkers)
         }
      }
      chartRef.current?.timeScale().scrollToPosition(0, false)
    }
  }, [currentIndex, data, markers]) // intentionally excluded isPlaying to only trigger on manual scrub or reset

  // The Replay Loop
  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && currentIndex < data.length) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= data.length) {
            setIsPlaying(false)
            return data.length
          }
          const nextCandle = data[prev]
          if (seriesRef.current && nextCandle) {
             seriesRef.current.update(nextCandle)
             // Check if this new candle has a marker
             if (markers.length > 0 && typeof (seriesRef.current as any).setMarkers === 'function') {
               const relevantMarkers = markers.filter(m => data.slice(0, prev + 1).some(d => d.time === m.time))
               if(relevantMarkers.length > 0) (seriesRef.current as any).setMarkers(relevantMarkers)
             }
          }
          return prev + 1
        })
      }, replaySpeed)
    } else if (isPlaying && currentIndex >= data.length) {
      setIsPlaying(false)
    }

    return () => clearInterval(interval)
  }, [isPlaying, currentIndex, data, markers, replaySpeed])

  const togglePlay = () => setIsPlaying(!isPlaying)
  const resetReplay = () => {
    setIsPlaying(false)
    setCurrentIndex(Math.max(10, Math.floor(data.length * 0.1))) // start early but not zero
    chartRef.current?.timeScale().fitContent()
  }
  const fastForward = () => setReplaySpeed((s) => (s === 500 ? 100 : s === 100 ? 50 : 500))
  const jumpToEnd = () => {
    setIsPlaying(false)
    setCurrentIndex(data.length)
    chartRef.current?.timeScale().fitContent()
  }

  const getPointerPoint = (event: React.PointerEvent<HTMLDivElement>): Point | null => {
    if (!drawingLayerRef.current) return null
    const rect = drawingLayerRef.current.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(event.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(event.clientY - rect.top, rect.height)),
    }
  }

  const startDrawing = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool === "cursor") return
    const point = getPointerPoint(event)
    if (!point) return

    event.currentTarget.setPointerCapture(event.pointerId)
    setDraftDrawing({
      id: crypto.randomUUID(),
      tool: activeTool,
      start: point,
      end: point,
    })
  }

  const updateDrawing = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draftDrawing) return
    const point = getPointerPoint(event)
    if (!point) return
    setDraftDrawing((current) => (current ? { ...current, end: point } : null))
  }

  const finishDrawing = () => {
    if (!draftDrawing) return

    const distance = Math.hypot(draftDrawing.end.x - draftDrawing.start.x, draftDrawing.end.y - draftDrawing.start.y)
    if (distance > 4 || draftDrawing.tool === "horizontal" || draftDrawing.tool === "vertical") {
      setDrawings((current) => [...current, draftDrawing])
    }
    setDraftDrawing(null)
    setActiveTool("cursor")
  }

  const toolButtonClass = (tool: DrawingTool) =>
    cn(
      "h-8 w-8 text-slate-400 hover:bg-slate-800 hover:text-white",
      activeTool === tool && "border border-primary/40 bg-primary/15 text-primary"
    )

  const renderDrawing = (drawing: Drawing, isDraft = false) => {
    const { start, end, tool } = drawing
    const stroke = isDraft ? "#fbbf24" : "#38bdf8"
    const strokeWidth = isDraft ? 2 : 1.7

    if (tool === "horizontal") {
      return <line key={drawing.id} x1={0} y1={start.y} x2="100%" y2={start.y} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={isDraft ? "6 4" : undefined} />
    }

    if (tool === "vertical") {
      return <line key={drawing.id} x1={start.x} y1={0} x2={start.x} y2="100%" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={isDraft ? "6 4" : undefined} />
    }

    if (tool === "rectangle") {
      const x = Math.min(start.x, end.x)
      const y = Math.min(start.y, end.y)
      const width = Math.abs(end.x - start.x)
      const height = Math.abs(end.y - start.y)

      return (
        <rect
          key={drawing.id}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={isDraft ? "rgba(251, 191, 36, 0.12)" : "rgba(56, 189, 248, 0.1)"}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={isDraft ? "6 4" : undefined}
        />
      )
    }

    return <line key={drawing.id} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={isDraft ? "6 4" : undefined} />
  }

  return (
    <div
      className={cn(
        "group relative h-full w-full overflow-hidden border border-slate-800 bg-slate-900/50",
        isFullscreen
          ? "fixed inset-0 z-[80] rounded-none"
          : "min-h-[420px] rounded-lg md:min-h-[560px] lg:min-h-[680px]"
      )}
    >
      <div ref={chartContainerRef} className="absolute inset-0" />

      <div
        ref={drawingLayerRef}
        className={cn("absolute inset-0 z-[8]", activeTool === "cursor" ? "pointer-events-none" : "cursor-crosshair")}
        onPointerDown={startDrawing}
        onPointerMove={updateDrawing}
        onPointerUp={finishDrawing}
        onPointerCancel={() => setDraftDrawing(null)}
      >
        <svg className="h-full w-full">
          {drawings.map((drawing) => renderDrawing(drawing))}
          {draftDrawing && renderDrawing(draftDrawing, true)}
        </svg>
      </div>

      <div className="absolute left-3 top-3 z-20 flex flex-wrap items-center gap-1 rounded-md border border-slate-800 bg-slate-950/85 p-1.5 shadow-xl backdrop-blur-md md:left-4 md:top-4">
        <Button variant="ghost" size="icon" className={toolButtonClass("cursor")} onClick={() => setActiveTool("cursor")} title="Cursor">
          <MousePointer2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className={toolButtonClass("trend")} onClick={() => setActiveTool("trend")} title="Trend line">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className={toolButtonClass("horizontal")} onClick={() => setActiveTool("horizontal")} title="Horizontal line">
          <Minus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className={toolButtonClass("vertical")} onClick={() => setActiveTool("vertical")} title="Vertical line">
          <div className="h-4 w-px bg-current" />
        </Button>
        <Button variant="ghost" size="icon" className={toolButtonClass("rectangle")} onClick={() => setActiveTool("rectangle")} title="Rectangle">
          <Square className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-4 w-px bg-slate-700" />
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-800 hover:text-white" onClick={() => setDrawings([])} title="Clear drawings">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-800 hover:text-white" onClick={() => setIsFullscreen((value) => !value)} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Replay Controls Overlay */}
      <div className="absolute right-3 top-16 z-20 flex flex-wrap items-center justify-end gap-1 rounded-md border border-slate-800 bg-slate-950/80 p-1.5 opacity-0 shadow-xl backdrop-blur-md transition-opacity group-hover:opacity-100 md:right-4 md:top-4">
        <Button variant="ghost" size="icon" className="h-7 md:h-8 w-7 md:w-8 text-slate-400 hover:text-white hover:bg-slate-800" onClick={resetReplay} title="Reset Replay">
          <RotateCcw className="h-3.5 md:h-4 w-3.5 md:w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 md:h-8 w-7 md:w-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <Pause className="h-3.5 md:h-4 w-3.5 md:w-4" /> : <Play className="h-3.5 md:h-4 w-3.5 md:w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 md:h-8 w-7 md:w-8 text-slate-400 hover:text-white hover:bg-slate-800" onClick={fastForward} title={`Speed: ${replaySpeed}ms`}>
          <FastForward className={`h-3.5 md:h-4 w-3.5 md:w-4 ${replaySpeed < 500 ? "text-amber-400" : ""}`} />
        </Button>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <Button variant="ghost" size="icon" className="h-7 md:h-8 w-7 md:w-8 text-slate-400 hover:text-white hover:bg-slate-800" onClick={jumpToEnd} title="Skip to End">
          <Settings2 className="h-3.5 md:h-4 w-3.5 md:w-4" />
        </Button>
      </div>

      {currentIndex < data.length && (
         <div className="absolute bottom-4 left-4 z-10 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 font-mono shadow-md flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {isPlaying && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
            </span>
            Replay Mode: {currentIndex} / {data.length}
         </div>
      )}
    </div>
  )
}
