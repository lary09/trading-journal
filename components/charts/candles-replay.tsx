"use client"

type Candle = {
  tradingDay: string
  open: number
  high: number
  low: number
  close: number
}

export function CandlesReplay({ data, overlay }: { data: Candle[]; overlay?: number[] }) {
  if (!data.length) return <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>

  const width = Math.max(600, data.length * 18)
  const height = 320
  const minVals = [...data.map((d) => d.low), ...(overlay ?? [])]
  const maxVals = [...data.map((d) => d.high), ...(overlay ?? [])]
  const min = Math.min(...minVals)
  const max = Math.max(...maxVals)
  const scaleY = (v: number) => {
    if (max === min) return height / 2
    return height - ((v - min) / (max - min)) * height
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border/50 bg-slate-900/40 p-2">
      <svg width={width} height={height}>
        {data.map((d, i) => {
          const x = 20 + i * 16
          const wickTop = scaleY(d.high)
          const wickBottom = scaleY(d.low)
          const bodyTop = scaleY(Math.max(d.open, d.close))
          const bodyBottom = scaleY(Math.min(d.open, d.close))
          const rising = d.close >= d.open
          const color = rising ? "#22c55e" : "#ef4444"
          return (
            <g key={d.tradingDay}>
              {/* wick */}
              <line x1={x + 6} x2={x + 6} y1={wickTop} y2={wickBottom} stroke={color} strokeWidth={2} />
              {/* body */}
              <rect
                x={x}
                y={bodyTop}
                width={12}
                height={Math.max(4, bodyBottom - bodyTop)}
                fill={color}
                opacity={0.9}
                rx={2}
              />
            </g>
          )
        })}
        {overlay && overlay.length === data.length && (
          <polyline
            fill="none"
            stroke="#38bdf8"
            strokeWidth={2}
            points={overlay
              .map((v, i) => {
                const x = 26 + i * 16
                const y = scaleY(v)
                return `${x},${y}`
              })
              .join(" ")}
          />
        )}
        {/* price labels */}
        <text x={4} y={12} fill="#94a3b8" fontSize={10}>{max.toFixed(2)}</text>
        <text x={4} y={height - 4} fill="#94a3b8" fontSize={10}>{min.toFixed(2)}</text>
      </svg>
    </div>
  )
}
