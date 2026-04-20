import { cn } from '../../lib/cn'

export function PageHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: string
  subtitle?: string
  right?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        <div className="text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
        ) : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  )
}

