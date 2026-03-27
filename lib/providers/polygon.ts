export async function ingestPolygonDaily(ticker: string, start?: string) {
  const apiKey = process.env.POLYGON_API_KEY
  if (!apiKey) throw new Error("POLYGON_API_KEY missing")
  const url = new URL(`https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day`)
  url.searchParams.set("apiKey", apiKey)
  if (start) url.searchParams.set("from", start)
  url.searchParams.set("to", new Date().toISOString().split("T")[0])
  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Polygon error ${res.status}`)
  // Simplified: only returning status; insert logic can be added mirroring Tiingo if needed
  return { ok: true }
}
