import { ChatCompletionCreateParams } from "openai/resources/chat/completions"

type TradeLite = {
  symbol: string
  profitLoss: number | null
  entryTime: string
  exitTime: string | null
  tradeType: string
  marketType: string
  strategyId: string | null
  emotionalState: string | null
}

export async function generateAiInsights(trades: TradeLite[]) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { error: "OPENAI_API_KEY not set", insights: null }
  }

  const wins = trades.filter((t) => (t.profitLoss ?? 0) > 0).length
  const losses = trades.filter((t) => (t.profitLoss ?? 0) < 0).length
  const total = trades.length

  const prompt = `
Eres un coach de trading. Resume patrones y ofrece 3 recomendaciones accionables.
Datos:
- Total trades: ${total}, ganadores: ${wins}, perdedores: ${losses}
- Muestra (JSON): ${JSON.stringify(trades.slice(0, 200))}
Responde en español, en viñetas cortas. No inventes datos que no estén.
`

  const payload: ChatCompletionCreateParams = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Eres un analista de rendimiento de trading conciso y accionable." },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 300,
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    return { error: `OpenAI error ${res.status}: ${text}`, insights: null }
  }

  const json = await res.json()
  const content = json.choices?.[0]?.message?.content ?? ""
  return { insights: content, error: null }
}
