import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="terminal-shell flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md">
        <Card className="terminal-panel py-8">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/25 bg-rose-500/10">
              <AlertCircle className="h-6 w-6 text-rose-400" />
            </div>
            <div className="terminal-kicker">Access</div>
            <CardTitle className="text-3xl font-semibold text-white">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {params?.error ? (
              <p className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-sm text-rose-400">
                Error: {params.error}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">An authentication error occurred. Please try again.</p>
            )}
            <Link
              href="/auth/login"
              className="inline-block text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Return to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
