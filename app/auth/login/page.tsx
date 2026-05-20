"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { type FormEvent, useEffect, useState } from "react"
import { signIn } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [callbackUrl, setCallbackUrl] = useState("/dashboard")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setCallbackUrl(params.get("callbackUrl") || "/dashboard")
  }, [])

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
        setIsLoading(false)
        return
      }

      router.push(result?.url || callbackUrl)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
    }
  }

  return (
    <div className="terminal-shell flex min-h-screen items-center justify-center p-3 sm:p-4 md:p-8">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="terminal-panel hidden flex-col justify-between overflow-hidden p-10 lg:flex">
          <div>
            <div className="terminal-kicker mb-4">Trading Desk Access</div>
            <h1 className="text-5xl font-semibold leading-tight tracking-tight text-white">
              Review faster. Trade cleaner. Keep your edge visible.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              Open your terminal workspace to inspect performance, journal decisions and manage risk from a single control surface.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <InfoTile label="Track" value="Execution quality" />
            <InfoTile label="Audit" value="Setups and edge" />
            <InfoTile label="Protect" value="Risk and process" />
          </div>
        </div>
        <Card className="terminal-panel w-full py-6 md:py-8">
          <CardHeader className="text-center">
            <div className="terminal-kicker">Sign In</div>
            <CardTitle className="text-2xl font-semibold text-white md:text-3xl">Open your workspace</CardTitle>
            <CardDescription>Sign in to access your trading dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200/90">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="trader@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border-border/80 bg-black/20 text-white placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200/90">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl border-border/80 bg-black/20 text-white"
                />
              </div>
              {error && <div className="rounded-xl border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-primary hover:text-primary/80 underline underline-offset-4">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="terminal-panel-muted p-4">
      <div className="terminal-kicker mb-2">{label}</div>
      <div className="text-sm text-white">{value}</div>
    </div>
  )
}
