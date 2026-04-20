import { cn } from '../../lib/cn'

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-separate border-spacing-0" {...props} />
    </div>
  )
}

export function Th({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 backdrop-blur',
        className,
      )}
      {...props}
    />
  )
}

export function Td({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        'border-b border-slate-100 px-3 py-3 text-sm text-slate-800',
        className,
      )}
      {...props}
    />
  )
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
    </div>
  )
}

