"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"
import { BarChart3, Calendar, ChevronRight, Home, Layers, PlayCircle, Shield, Target, Upload, Wallet } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/insights", label: "Insights", icon: Target },
  { href: "/backtesting", label: "Backtesting", icon: PlayCircle },
  { href: "/risk", label: "Risk", icon: Shield },
  { href: "/replay", label: "Replay", icon: PlayCircle },
  { href: "/watchlist", label: "Watchlist", icon: Upload },
  { href: "/imports", label: "Imports", icon: Upload },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/strategies", label: "Strategies", icon: Layers },
  { href: "/export", label: "Exports", icon: Wallet },
]

export function AppShell({ title, cta, children }: { title?: string; cta?: ReactNode; children: ReactNode }) {
  const pathname = usePathname()
  const mobileItems = navItems.slice(0, 6)

  return (
    <div className="terminal-shell min-h-screen text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-[288px] shrink-0 border-r border-border/60 bg-[--color-sidebar]/90 px-4 py-5 text-[--color-sidebar-foreground] backdrop-blur-xl md:flex md:flex-col">
          <div className="terminal-panel mb-5 overflow-hidden px-5 py-5">
            <div className="terminal-kicker mb-2">Trading Ops</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-semibold tracking-tight text-white">Trading Journal</div>
                <div className="mt-1 text-sm text-[--color-sidebar-foreground]/65">Graphite terminal workspace</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href} className="block">
                  <div
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm soft-transition",
                      active
                        ? "border-primary/25 bg-primary/10 text-white shadow-[inset_0_0_0_1px_rgba(245,180,73,0.08)]"
                        : "border-transparent text-[--color-sidebar-foreground]/72 hover:border-border/70 hover:bg-[--color-sidebar-accent] hover:text-[--color-sidebar-accent-foreground]"
                    )}
                  >
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03]", active ? "text-primary" : "text-[--color-sidebar-foreground]/60 group-hover:text-primary") }>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-medium">{item.label}</span>
                      <ChevronRight className={cn("h-4 w-4 opacity-0 transition-opacity", active ? "opacity-100 text-primary" : "group-hover:opacity-60")} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>
          <div className="terminal-panel mt-5 px-4 py-4">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Session</div>
            <Button variant="outline" className="w-full" onClick={() => signOut({ callbackUrl: "/auth/login" })}>
              Sign out
            </Button>
          </div>
        </aside>
        <main className="flex-1">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 px-4 py-3 md:py-4 md:px-8">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="md:hidden flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary flex-shrink-0">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="terminal-kicker truncate">Workspace</div>
                  <span className="text-lg md:text-xl font-semibold tracking-tight text-white truncate">{title}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {cta}
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto px-4 pb-4 md:hidden">
              {mobileItems.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} className={cn("terminal-chip shrink-0", active && "border-primary/35 bg-primary/10 text-primary")}>
                    <Icon className="mr-2 h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </header>
          <div className="px-4 py-6 md:px-8 animate-in fade-in slide-in-from-bottom-2 duration-300">{children}</div>
        </main>
      </div>
    </div>
  )
}
