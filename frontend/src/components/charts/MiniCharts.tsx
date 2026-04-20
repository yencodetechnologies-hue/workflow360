import { cn } from '../../lib/cn'

export function SparkBars({
  values,
  className,
}: {
  values: number[]
  className?: string
}) {
  const max = Math.max(1, ...values)
  return (
    <div className={cn('flex items-end gap-1', className)}>
      {values.map((v, i) => (
        <div
          key={i}
          className="w-2 rounded-sm bg-slate-900/70"
          style={{ height: `${Math.round((v / max) * 42) + 6}px` }}
          title={`${v}`}
        />
      ))}
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

