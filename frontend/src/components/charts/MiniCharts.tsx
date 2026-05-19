import { cn } from '../../lib/cn'

export function SparkBars({
  values,
  labels,
  highlightIndex,
  className,
}: {
  values: number[]
  labels?: string[]
  highlightIndex?: number
  className?: string
}) {
  const max = Math.max(1, ...values)
  const peak =
    highlightIndex !== undefined
      ? highlightIndex
      : values.length
        ? values.indexOf(Math.max(...values))
        : -1

  return (
    <div className={cn('flex items-end gap-2', className)}>
      {values.map((v, i) => {
        const isPeak = i === peak
        const h = Math.round((v / max) * 42) + 6
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'w-3 rounded-md transition-all duration-300',
                isPeak
                  ? 'bg-gradient-to-t from-primary-600 to-primary-400 shadow-md shadow-primary-200/50'
                  : 'bg-gradient-to-t from-slate-400 to-slate-300',
              )}
              style={{ height: `${h}px` }}
              title={`${labels?.[i] ?? ''}: ${v}`}
            />
            {labels?.[i] ? (
              <span
                className={cn(
                  'text-[10px] font-semibold',
                  isPeak ? 'text-primary-600' : 'text-slate-400',
                )}
              >
                {labels[i]}
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}


export function DonutChart({
  segments,
  size = 128,
  stroke = 14,
}: {
  segments: Array<{ label: string; value: number; color: string }>
  size?: number
  stroke?: number
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const circles = segments.reduce<Array<{ label: string; dash: number; offset: number; color: string }>>(
    (acc, s) => {
      const prev = acc.length ? acc[acc.length - 1] : undefined
      const offset = prev ? prev.offset + prev.dash : 0
      const dash = (s.value / total) * c
      acc.push({ label: s.label, dash, offset, color: s.color })
      return acc
    },
    [],
  )

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#e2e8f0"
        strokeWidth={stroke}
        fill="none"
      />
      {circles.map((s) => (
        <circle
          key={s.label}
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={s.color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${s.dash} ${c - s.dash}`}
          strokeDashoffset={-s.offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      ))}
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-slate-900"
        style={{ fontSize: 16, fontWeight: 700 }}
      >
        {Math.round(total)}
      </text>
      <text
        x="50%"
        y="62%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-slate-500"
        style={{ fontSize: 11, fontWeight: 600 }}
      >
        deliveries
      </text>
    </svg>
  )
}
