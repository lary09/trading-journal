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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-900/20">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {params?.error ? (
              <p className="text-sm text-red-400 bg-red-900/20 p-3 rounded border border-red-800">
                Error: {params.error}
              </p>
            ) : (
              <p className="text-sm text-slate-400">An authentication error occurred. Please try again.</p>
            )}
            <Link
              href="/auth/login"
              className="inline-block text-blue-400 hover:text-blue-300 underline underline-offset-4"
            >
              Return to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
