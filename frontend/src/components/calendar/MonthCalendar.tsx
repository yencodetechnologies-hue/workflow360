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
//     <div style={{ padding: '0 14px 14px' }}>
//       {/* Month label */}
//       <div style={{
//         textAlign: 'center', fontSize: 12, fontWeight: 600,
//         color: '#374151', padding: '10px 0 8px',
//       }}>
//         {monthLabel}
//       </div>

//       {/* Grid */}
//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>

//         {/* Weekday headers */}
//         {WEEKDAYS.map((w) => (
//           <div key={w} style={{
//             padding: '5px 0', textAlign: 'center',
//             fontSize: 11, fontWeight: 600, color: '#6b7280',
//             letterSpacing: '0.02em',
//           }}>
//             {w}
//           </div>
//         ))}

//         {/* Day cells */}
//         {cells.map((cell) => {
//           if (!cell.day) {
//             return <div key={cell.key} style={{ minHeight: 58 }} />
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
//                 minHeight: 58,
//                 borderRadius: 9,
//                 border: isToday
//                   ? '2px solid #10b981'
//                   : isSelected
//                   ? '2px solid #7c6cf6'
//                   : hasDeliveries
//                   ? '1px solid #c7d2fe'
//                   : '1px solid #ede9fe',
//                 background: hasDeliveries ? '#eef2ff' : '#ffffff',
//                 padding: '8px 10px',
//                 textAlign: 'left',
//                 cursor: 'pointer',
//                 transition: 'background 0.15s ease, border-color 0.15s ease',
//                 outline: 'none',
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
//                 fontSize: 12,
//                 fontWeight: isToday ? 700 : 500,
//                 color: isToday ? '#059669' : '#111827',
//                 lineHeight: 1,
//               }}>
//                 {cell.day}
//               </div>

//               {/* Delivery count */}
//               {hasDeliveries && (
//                 <div style={{
//                   marginTop: 5, fontSize: 10,
//                   fontWeight: 500, color: '#4338ca', lineHeight: 1.3,
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

import type { CalendarDay } from '../../types/reports'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const WEEKDAYS_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
    <div style={{ padding: '0 4px 8px' }}>
      {/* Month label */}
      <div style={{
        textAlign: 'center', fontSize: 12, fontWeight: 600,
        color: '#374151', padding: '10px 0 8px',
      }}>
        {monthLabel}
      </div>

      {/*
        Grid: 7 equal columns, 2px gap.
        No min-width on cells ù they shrink to fit whatever width is available.
        This is the key: 1fr columns with no content forcing a min-width.
      */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 2,
        width: '100%',
      }}>

        {/* Weekday headers ù single letter on mobile to save space */}
        {WEEKDAYS.map((w, i) => (
          <div key={w + i} style={{
            padding: '4px 0',
            textAlign: 'center',
            fontSize: 10,
            fontWeight: 600,
            color: '#6b7280',
          }}>
            {/* Show 3-letter on wider screens via title, single letter always */}
            <span title={WEEKDAYS_FULL[i]}>{w}</span>
          </div>
        ))}

        {/* Day cells */}
        {cells.map((cell) => {
          if (!cell.day) {
            return <div key={cell.key} style={{ minHeight: 44 }} />
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
                /* No fixed width/padding ù let the 1fr column own it */
                minHeight: 44,
                width: '100%',
                boxSizing: 'border-box',
                borderRadius: 7,
                border: isToday
                  ? '2px solid #10b981'
                  : isSelected
                    ? '2px solid #10b981'
                    : hasDeliveries
                      ? '1px solid #a7f3d0'
                      : '1px solid #d1fae5',
                background: isSelected
                  ? '#d1fae5'
                  : hasDeliveries
                    ? '#ecfdf5'
                    : '#ffffff',
                padding: '4px 2px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s ease, border-color 0.15s ease',
                outline: 'none',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                if (!isToday && !isSelected) {
                  el.style.background = '#ecfdf5'
                  el.style.borderColor = '#6ee7b7'
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                if (!isToday && !isSelected) {
                  el.style.background = hasDeliveries ? '#ecfdf5' : '#ffffff'
                  el.style.borderColor = hasDeliveries ? '#a7f3d0' : '#d1fae5'
                }
              }}
            >
              {/* Day number */}
              <div style={{
                fontSize: 11,
                fontWeight: isToday ? 700 : 500,
                color: isToday ? '#059669' : '#111827',
                lineHeight: 1,
              }}>
                {cell.day}
              </div>

              {/* Delivery dot ù just a colored dot on mobile, no text */}
              {hasDeliveries && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: '#059669', flexShrink: 0,
                  }} />
                  <div style={{
                    fontSize: 8,
                    fontWeight: 600,
                    color: '#047857',
                    lineHeight: 1,
                  }}>
                    {total}
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}