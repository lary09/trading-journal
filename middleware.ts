import { auth } from "@/auth"
import { NextResponse } from "next/server"

const publicRoutes = ["/", "/auth/login", "/auth/signup"]

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = Boolean(req.auth?.user)
  const isAuthRoute = nextUrl.pathname.startsWith("/auth")
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname) || isAuthRoute || nextUrl.pathname.startsWith("/api/auth")

  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/auth/login", nextUrl)
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
