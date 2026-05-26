import { cn } from '../../lib/cn'
import type { CalendarDay } from '../../types/reports'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type Props = {
  month: string
  days: CalendarDay[]
  selectedDate?: string
  onSelectDate: (date: string) => void
}

function parseMonth(month: string) {
  const [y, m] = month.split('-').map(Number)
  return { year: y, monthIndex: (m || 1) - 1 }
}

function dateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function cellTone(byStatus: Record<string, number>) {
  const upcoming = (byStatus.PROCESSED || 0) + (byStatus.UPCOMING || 0)
  const dispatched =
    (byStatus.OUT_FOR_DELIVERY || 0) + (byStatus.PACKED || 0) + (byStatus.DISPATCHED || 0) + (byStatus.DELIVERED || 0)
  const pending = byStatus.PENDING_RETURN || 0
  const completed = byStatus.COMPLETED || 0
  if (pending > 0) return 'border-amber-200 bg-amber-50'
  if (dispatched > upcoming) return 'border-emerald-200 bg-emerald-50'
  if (completed > 0 && upcoming === 0) return 'border-slate-200 bg-slate-50'
  if (upcoming > 0) return 'border-blue-200 bg-blue-50'
  return 'border-slate-100 bg-white'
}

export function MonthCalendar({ month, days, selectedDate, onSelectDate }: Props) {
  const { year, monthIndex } = parseMonth(month)
  const dayMap = new Map(days.map((d) => [d.date, d]))
  const firstDow = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const monthLabel = new Date(year, monthIndex, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })

  const cells: Array<{ key: string; day?: number; data?: CalendarDay }> = []
  for (let i = 0; i < firstDow; i++) cells.push({ key: `pad-${i}` })
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(year, monthIndex, d)
    cells.push({ key, day: d, data: dayMap.get(key) })
  }

  return (
    <div>
      <div className="mb-3 text-center text-sm font-semibold text-slate-700">{monthLabel}</div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center text-xs font-medium text-slate-500">
            {w}
          </div>
        ))}
        {cells.map((cell) => {
          if (!cell.day) {
            return <div key={cell.key} className="min-h-[4.5rem] rounded-lg" />
          }
          const total = cell.data?.total ?? 0
          const isSelected = selectedDate === cell.key
          const tone = total > 0 ? cellTone(cell.data?.byStatus ?? {}) : 'border-slate-100 bg-white'

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelectDate(cell.key)}
              className={cn(
                'min-h-[4.5rem] rounded-lg border p-1.5 text-left transition hover:ring-2 hover:ring-slate-200',
                tone,
                isSelected && 'ring-2 ring-violet-500',
              )}
            >
              <div className="text-xs font-semibold text-slate-800">{cell.day}</div>
              {total > 0 ? (
                <div>
                  <div className="mt-1 rounded-md bg-white/80 px-1 py-0.5 text-[10px] font-semibold text-slate-700">
                    {total} {total === 1 ? 'delivery' : 'deliveries'}
                  </div>
                </div>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
