"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"
import { BarChart3, Calendar, Home, Layers, PlayCircle, Upload, Wallet } from "lucide-react"

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
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/backtesting", label: "Backtesting", icon: PlayCircle },
  { href: "/risk", label: "Risk", icon: Layers },
  { href: "/replay", label: "Replay", icon: PlayCircle },
  { href: "/watchlist", label: "Watchlist", icon: Upload },
  { href: "/imports", label: "Imports", icon: Upload },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/strategies", label: "Strategies", icon: Layers },
  { href: "/export", label: "Exports", icon: Wallet },
]

export function AppShell({ title, cta, children }: { title?: string; cta?: ReactNode; children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen text-foreground">
      <div className="flex">
        <aside className="hidden md:flex w-64 flex-col border-r border-border/60 bg-[--color-sidebar] text-[--color-sidebar-foreground] glass-panel">
          <div className="p-6 text-lg font-semibold tracking-tight">Trading Journal</div>
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href} className="block">
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm soft-transition",
                      active
                        ? "bg-[--color-sidebar-primary]/20 text-[--color-sidebar-primary] border border-[--color-sidebar-border] glow"
                        : "text-[--color-sidebar-foreground] hover:bg-[--color-sidebar-accent] hover:text-[--color-sidebar-accent-foreground]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </nav>
          <div className="p-4">
            <Button asChild variant="outline" className="w-full border-[--color-sidebar-border] text-[--color-sidebar-foreground]">
              <Link href="/auth/login">Sign out</Link>
            </Button>
          </div>
        </aside>
        <main className="flex-1">
          <header className="sticky top-0 z-10 border-b border-border/60 backdrop-blur glass-panel">
            <div className="flex items-center justify-between px-4 py-4 md:px-8">
              <div className="flex items-center gap-3">
                <span className="text-xl font-semibold">{title}</span>
              </div>
              {cta}
            </div>
          </header>
          <div className="px-4 py-6 md:px-8 animate-in fade-in slide-in-from-bottom-2 duration-300">{children}</div>
        </main>
      </div>
    </div>
  )
}
