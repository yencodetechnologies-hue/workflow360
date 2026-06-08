// import { cn } from '../../lib/cn'
// import { Card } from './Card'

// type Props = {
//   label: string
//   value: string
//   delta?: string
//   tone?: 'neutral' | 'good' | 'warn' | 'bad'
//   icon?: React.ReactNode
//   className?: string
// }

// const tones: Record<NonNullable<Props['tone']>, string> = {
//   neutral: 'bg-slate-900/5 text-slate-700 ring-slate-200',
//   good: 'bg-primary-500/10 text-primary-700 ring-primary-200',
//   warn: 'bg-amber-500/10 text-amber-800 ring-amber-200',
//   bad: 'bg-rose-500/10 text-rose-700 ring-rose-200',
// }

// export function StatCard({
//   label,
//   value,
//   delta,
//   tone = 'neutral',
//   icon,
//   className,
// }: Props) {
//   return (
//     <Card className={cn('p-4', className)}>
//       <div className="flex items-start justify-between gap-3">
//         <div>
//           <div className="text-xs font-medium text-slate-500">{label}</div>
//           <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
//             {value}
//           </div>
//           {delta ? (
//             <div className="mt-1 text-xs text-slate-500">{delta}</div>
//           ) : null}
//         </div>
//         {icon ? (
//           <div className={cn('rounded-xl p-2 ring-1 ring-inset', tones[tone])}>
//             <div className="h-5 w-5">{icon}</div>
//           </div>
//         ) : null}
//       </div>
//     </Card>
//   )
// }

import { cn } from '../../lib/cn'

type Props = {
  label: string
  value: string
  delta?: string
  tone?: 'neutral' | 'good' | 'warn' | 'bad'
  icon?: React.ReactNode
  className?: string
}

const iconBgMap: Record<NonNullable<Props['tone']>, string> = {
  neutral: '#d1fae5',
  good:    '#d1fae5',
  warn:    '#fef3c7',
  bad:     '#fee2e2',
}

const bubbleBgMap: Record<NonNullable<Props['tone']>, string> = {
  neutral: '#d1fae5',
  good:    '#d1fae5',
  warn:    '#fef3c7',
  bad:     '#fee2e2',
}

export function StatCard({ label, value, delta, tone = 'neutral', icon, className }: Props) {
  return (
    <div
      className={cn(className)}
      style={{
        background: '#ffffff',
        border: '1px solid #e4e7f0',
        borderRadius: 14,
        padding: '18px 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 158,
        boxSizing: 'border-box',
      }}
    >
      {/* icon box */}
      {icon && (
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: iconBgMap[tone],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginBottom: 12,
        }}>
          <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
        </div>
      )}

      {/* label */}
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginBottom: 5, lineHeight: 1.3 }}>
        {label}
      </div>

      {/* value */}
      <div style={{
        fontSize: 36, fontWeight: 700, color: '#0f172a', lineHeight: 1,
        marginBottom: delta ? 7 : 0, letterSpacing: '-0.02em',
      }}>
        {value}
      </div>

      {/* delta */}
      {delta && (
        <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>
          {delta}
        </div>
      )}

      {/* decorative bubble */}
      <div style={{
        position: 'absolute', right: -22, bottom: -22,
        width: 88, height: 88, borderRadius: '50%',
        background: bubbleBgMap[tone], opacity: 0.5,
        pointerEvents: 'none',
      }} />
    </div>
  )
}