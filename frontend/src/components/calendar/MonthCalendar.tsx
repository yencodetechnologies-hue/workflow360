// import { cn } from '../../lib/cn'
// import type { CalendarDay } from '../../types/reports'

// const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// type Props = {
//   month: string
//   days: CalendarDay[]
//   selectedDate?: string
//   onSelectDate: (date: string) => void
// }

// function parseMonth(month: string) {
//   const [y, m] = month.split('-').map(Number)
//   return { year: y, monthIndex: (m || 1) - 1 }
// }

// function dateKey(year: number, monthIndex: number, day: number) {
//   return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
// }

// function getTodayKey() {
//   const now = new Date()
//   return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
// }

// export function MonthCalendar({ month, days, selectedDate, onSelectDate }: Props) {
//   const { year, monthIndex } = parseMonth(month)
//   const dayMap = new Map(days.map((d) => [d.date, d]))
//   const firstDow = new Date(year, monthIndex, 1).getDay()
//   const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
//   const monthLabel = new Date(year, monthIndex, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })
//   const todayKey = getTodayKey()

//   const cells: Array<{ key: string; day?: number; data?: CalendarDay }> = []
//   for (let i = 0; i < firstDow; i++) cells.push({ key: `pad-${i}` })
//   for (let d = 1; d <= daysInMonth; d++) {
//     const key = dateKey(year, monthIndex, d)
//     cells.push({ key, day: d, data: dayMap.get(key) })
//   }

//   return (
//     <div style={{ padding: '0 16px 16px' }}>
//       {/* Month label */}
//       <div style={{
//         textAlign: 'center',
//         fontSize: 13,
//         fontWeight: 600,
//         color: '#374151',
//         padding: '12px 0 10px',
//       }}>
//         {monthLabel}
//       </div>

//       {/* Grid */}
//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>

//         {/* Weekday headers */}
//         {WEEKDAYS.map((w) => (
//           <div
//             key={w}
//             style={{
//               padding: '6px 0',
//               textAlign: 'center',
//               fontSize: 12,
//               fontWeight: 600,
//               color: '#6b7280',
//               letterSpacing: '0.02em',
//             }}
//           >
//             {w}
//           </div>
//         ))}

//         {/* Day cells */}
//         {cells.map((cell) => {
//           if (!cell.day) {
//             // empty padding cell
//             return (
//               <div
//                 key={cell.key}
//                 style={{ minHeight: 72 }}
//               />
//             )
//           }

//           const total = cell.data?.total ?? 0
//           const isSelected = selectedDate === cell.key
//           const isToday = cell.key === todayKey
//           const hasDeliveries = total > 0

//           return (
//             <button
//               key={cell.key}
//               type="button"
//               onClick={() => onSelectDate(cell.key)}
//               style={{
//                 minHeight: 72,
//                 borderRadius: 10,
//                 border: isToday
//                   ? '2px solid #6366f1'
//                   : isSelected
//                   ? '2px solid #7c6cf6'
//                   : hasDeliveries
//                   ? '1px solid #c7d2fe'
//                   : '1px solid #ede9fe',
//                 background: hasDeliveries
//                   ? '#eef2ff'
//                   : '#ffffff',
//                 padding: '10px 12px',
//                 textAlign: 'left',
//                 cursor: 'pointer',
//                 transition: 'background 0.15s ease, border-color 0.15s ease',
//                 outline: 'none',
//                 // hover handled via onMouseEnter/Leave below
//               }}
//               onMouseEnter={(e) => {
//                 const el = e.currentTarget as HTMLElement
//                 if (!isToday && !isSelected) {
//                   el.style.background = '#f0eeff'
//                   el.style.borderColor = '#a5b4fc'
//                 }
//               }}
//               onMouseLeave={(e) => {
//                 const el = e.currentTarget as HTMLElement
//                 if (!isToday && !isSelected) {
//                   el.style.background = hasDeliveries ? '#eef2ff' : '#ffffff'
//                   el.style.borderColor = hasDeliveries ? '#c7d2fe' : '#ede9fe'
//                 }
//               }}
//             >
//               {/* Day number */}
//               <div style={{
//                 fontSize: 13,
//                 fontWeight: isToday ? 700 : 500,
//                 color: isToday ? '#4f46e5' : '#111827',
//                 lineHeight: 1,
//               }}>
//                 {cell.day}
//               </div>

//               {/* Delivery count */}
//               {hasDeliveries && (
//                 <div style={{
//                   marginTop: 8,
//                   fontSize: 11,
//                   fontWeight: 500,
//                   color: '#4338ca',
//                   lineHeight: 1.3,
//                 }}>
//                   {total} {total === 1 ? 'delivery' : 'deliveries'}
//                 </div>
//               )}
//             </button>
//           )
//         })}
//       </div>
//     </div>
//   )
// }

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

function getTodayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function MonthCalendar({ month, days, selectedDate, onSelectDate }: Props) {
  const { year, monthIndex } = parseMonth(month)
  const dayMap = new Map(days.map((d) => [d.date, d]))
  const firstDow = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const monthLabel = new Date(year, monthIndex, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const todayKey = getTodayKey()

  const cells: Array<{ key: string; day?: number; data?: CalendarDay }> = []
  for (let i = 0; i < firstDow; i++) cells.push({ key: `pad-${i}` })
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(year, monthIndex, d)
    cells.push({ key, day: d, data: dayMap.get(key) })
  }

  return (
    <div style={{ padding: '0 14px 14px' }}>
      {/* Month label */}
      <div style={{
        textAlign: 'center', fontSize: 12, fontWeight: 600,
        color: '#374151', padding: '10px 0 8px',
      }}>
        {monthLabel}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>

        {/* Weekday headers */}
        {WEEKDAYS.map((w) => (
          <div key={w} style={{
            padding: '5px 0', textAlign: 'center',
            fontSize: 11, fontWeight: 600, color: '#6b7280',
            letterSpacing: '0.02em',
          }}>
            {w}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((cell) => {
          if (!cell.day) {
            return <div key={cell.key} style={{ minHeight: 58 }} />
          }

          const total = cell.data?.total ?? 0
          const isSelected = selectedDate === cell.key
          const isToday = cell.key === todayKey
          const hasDeliveries = total > 0

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelectDate(cell.key)}
              style={{
                minHeight: 58,
                borderRadius: 9,
                border: isToday
                  ? '2px solid #6366f1'
                  : isSelected
                  ? '2px solid #7c6cf6'
                  : hasDeliveries
                  ? '1px solid #c7d2fe'
                  : '1px solid #ede9fe',
                background: hasDeliveries ? '#eef2ff' : '#ffffff',
                padding: '8px 10px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.15s ease, border-color 0.15s ease',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                if (!isToday && !isSelected) {
                  el.style.background = '#f0eeff'
                  el.style.borderColor = '#a5b4fc'
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                if (!isToday && !isSelected) {
                  el.style.background = hasDeliveries ? '#eef2ff' : '#ffffff'
                  el.style.borderColor = hasDeliveries ? '#c7d2fe' : '#ede9fe'
                }
              }}
            >
              {/* Day number */}
              <div style={{
                fontSize: 12,
                fontWeight: isToday ? 700 : 500,
                color: isToday ? '#4f46e5' : '#111827',
                lineHeight: 1,
              }}>
                {cell.day}
              </div>

              {/* Delivery count */}
              {hasDeliveries && (
                <div style={{
                  marginTop: 5, fontSize: 10,
                  fontWeight: 500, color: '#4338ca', lineHeight: 1.3,
                }}>
                  {total} {total === 1 ? 'delivery' : 'deliveries'}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}