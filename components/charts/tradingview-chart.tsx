"use client"

import * as React from "react"
import { Play, Pause, RotateCcw, FastForward, Settings2 } from "lucide-react"
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
  const chartRef = React.useRef<IChartApi | null>(null)
  const seriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null)

  // Replay State
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [replaySpeed, setReplaySpeed] = React.useState(500) // ms per candle
  const [currentIndex, setCurrentIndex] = React.useState<number>(Math.max(0, data.length - 20)) // Start showing some candles

  // Initialize the chart
  React.useEffect(() => {
    if (!chartContainerRef.current) return

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
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

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
    }
  }, [backgroundColor, textColor, upColor, downColor, wickUpColor, wickDownColor, gridColor])

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

  return (
    <div className="relative w-full h-full min-h-[400px] group rounded-lg overflow-hidden border border-slate-800 bg-slate-900/50">
      <div ref={chartContainerRef} className="absolute inset-0" />
      
      {/* Replay Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/80 backdrop-blur-md rounded-md p-1.5 flex items-center gap-1 border border-slate-800 shadow-xl">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800" onClick={resetReplay} title="Reset Replay">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800" onClick={fastForward} title={`Speed: ${replaySpeed}ms`}>
          <FastForward className={`h-4 w-4 ${replaySpeed < 500 ? "text-amber-400" : ""}`} />
        </Button>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800" onClick={jumpToEnd} title="Skip to End">
          <Settings2 className="h-4 w-4" />
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
