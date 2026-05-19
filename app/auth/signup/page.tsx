"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"
import { signIn } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [tradingExperience, setTradingExperience] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!fullName.trim()) {
      setError("Full name is required")
      setIsLoading(false)
      return
    }

    if (!tradingExperience) {
      setError("Please select your trading experience level")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, tradingExperience }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Unable to create account")
        setIsLoading(false)
        return
      }

      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard",
        redirect: false,
      })

      if (result?.error) {
        setError("Account created, but automatic sign in failed. Please log in.")
        setIsLoading(false)
        router.push("/auth/login")
        return
      }

      router.push(result?.url || "/dashboard")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="terminal-shell flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="terminal-panel hidden p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="terminal-kicker mb-4">Create Workspace</div>
            <h1 className="text-5xl font-semibold leading-tight tracking-tight text-white">Start a disciplined review loop from day one.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              Build a terminal-grade journal to track execution, identify patterns and refine your strategy with actual evidence.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="terminal-panel-muted p-4 text-sm text-white">Create your account and define your experience level.</div>
            <div className="terminal-panel-muted p-4 text-sm text-white">Import trades later or start logging executions manually.</div>
          </div>
        </div>
        <Card className="terminal-panel py-8">
          <CardHeader className="text-center">
            <div className="terminal-kicker">Sign Up</div>
            <CardTitle className="text-3xl font-semibold text-white">Create your workspace</CardTitle>
            <CardDescription>Create your account to start tracking trades</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-200/90">Full Name</Label>
                <Input id="fullName" type="text" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 rounded-xl border-border/80 bg-black/20 text-white placeholder:text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200/90">Email</Label>
                <Input id="email" type="email" placeholder="trader@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl border-border/80 bg-black/20 text-white placeholder:text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradingExperience" className="text-slate-200/90">Trading Experience</Label>
                <Select value={tradingExperience} onValueChange={setTradingExperience}>
                  <SelectTrigger className="h-11 rounded-xl border-border/80 bg-black/20 text-white">
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent className="border-border/80 bg-zinc-950 text-white">
                    <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                    <SelectItem value="advanced">Advanced (3-5 years)</SelectItem>
                    <SelectItem value="professional">Professional (5+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200/90">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl border-border/80 bg-black/20 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-200/90">Confirm Password</Label>
                <Input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11 rounded-xl border-border/80 bg-black/20 text-white" />
              </div>
              {error && <div className="rounded-xl border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:text-primary/80 underline underline-offset-4">Sign in</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
