import { cn } from '../../lib/cn'
import { Card } from './Card'

type Props = {
  label: string
  value: string
  delta?: string
  tone?: 'neutral' | 'good' | 'warn' | 'bad'
  icon?: React.ReactNode
  className?: string
}

const tones: Record<NonNullable<Props['tone']>, string> = {
  neutral: 'bg-slate-900/5 text-slate-700 ring-slate-200',
  good: 'bg-emerald-500/10 text-emerald-700 ring-emerald-200',
  warn: 'bg-amber-500/10 text-amber-800 ring-amber-200',
  bad: 'bg-rose-500/10 text-rose-700 ring-rose-200',
}

export function StatCard({
  label,
  value,
  delta,
  tone = 'neutral',
  icon,
  className,
}: Props) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </div>
          {delta ? (
            <div className="mt-1 text-xs text-slate-500">{delta}</div>
          ) : null}
        </div>
        {icon ? (
          <div className={cn('rounded-xl p-2 ring-1 ring-inset', tones[tone])}>
            <div className="h-5 w-5">{icon}</div>
          </div>
        ) : null}
      </div>
    </Card>
  )
}

