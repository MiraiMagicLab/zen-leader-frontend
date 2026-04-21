import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  stats?: Array<{
    label: string
    value: string | number
  }>
  className?: string
}

export function PageHeader({ title, subtitle, actions, stats, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-4", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {stats && stats.length > 0 && (
          <div className="hidden lg:flex items-center gap-2">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={cn("flex items-center gap-4 px-4", index < stats.length - 1 && "border-r")}
              >
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {actions}
      </div>
    </div>
  )
}
