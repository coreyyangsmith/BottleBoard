import * as React from "react"
import { cn } from "@/lib/utils"

export function Badge({ className, variant = "default", ...props }: React.ComponentProps<"span"> & { variant?: "default" | "outline" }) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
  const styles = variant === "outline" ? "border" : "bg-muted text-muted-foreground"
  return <span className={cn(base, styles, className)} {...props} />
}

