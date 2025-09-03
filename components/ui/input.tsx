import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary/90 selection:text-primary-foreground",
        "flex h-10 w-full min-w-0 rounded-lg border border-input bg-background/50 px-4 py-2 text-sm font-medium shadow-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "dark:bg-input/20 dark:border-input/50 dark:focus-visible:ring-ring/30",
        "aria-invalid:border-destructive/50 aria-invalid:ring-destructive/20",
        "hover:border-primary/50 transition-all duration-200 ease-in-out",
        className
      )}
      {...props}
    />
  )
}

export { Input }
