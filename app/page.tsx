import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Shield, BarChart3, Target } from "lucide-react"

export default async function HomePage() {
  // Check if we're in test mode
  const isTestMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('placeholder')

  if (!isTestMode) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      redirect("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">Professional Trading Journal</h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Track your trades, analyze performance, and improve your trading strategy with our comprehensive journal
            platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/auth/signup">Get Started</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent"
            >
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">Performance Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-300">
                Monitor your win rate, profit/loss, and trading performance with detailed analytics.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <Shield className="h-8 w-8 text-green-400 mb-2" />
              <CardTitle className="text-white">Risk Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-300">
                Track stop losses, take profits, and risk-reward ratios to improve your trading discipline.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-purple-400 mb-2" />
              <CardTitle className="text-white">Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-300">
                Visualize your trading data with charts, graphs, and comprehensive performance reports.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <Target className="h-8 w-8 text-orange-400 mb-2" />
              <CardTitle className="text-white">Strategy Development</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-300">
                Create and test trading strategies, track their performance, and refine your approach.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Ready to Improve Your Trading?</CardTitle>
              <CardDescription className="text-slate-300">
                Join thousands of traders who use our platform to track and improve their performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link href="/auth/signup">Start Your Free Account</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
