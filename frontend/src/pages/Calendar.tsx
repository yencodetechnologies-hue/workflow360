// import { useEffect, useMemo, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { MonthCalendar } from '../components/calendar/MonthCalendar'
// import { ReportFiltersBar } from '../components/reports/ReportFiltersBar'
// import { apiFetch } from '../lib/api'
// import { getToken } from '../auth/store'
// import { useReportFilters } from '../hooks/useReportFilters'
// import type { CalendarResponse } from '../types/reports'

// function shiftMonth(month: string, delta: number) {
//   const [y, m] = month.split('-').map(Number)
//   const d = new Date(y, (m || 1) - 1 + delta, 1)
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
// }

// function ChevronLeft() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
//       <path d="M15 18l-6-6 6-6" />
//     </svg>
//   )
// }

// function ChevronRight() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
//       <path d="M9 18l6-6-6-6" />
//     </svg>
//   )
// }

// function CalendarIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <rect x="3" y="4" width="18" height="18" rx="2" />
//       <path d="M16 2v4M8 2v4M3 10h18" />
//     </svg>
//   )
// }

// export function CalendarPage() {
//   const navigate = useNavigate()

//   const {
//     month,
//     godownId,
//     site,
//     godowns,
//     sites,
//     filterQuery,
//     setFilters,
//     lockGodownFilter,
//   } = useReportFilters()

//   const [data, setData] = useState<CalendarResponse | null>(null)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [selectedDate, setSelectedDate] = useState<string | undefined>()

//   // -- fetch calendar data whenever month or filters change ----------------
//   useEffect(() => {
//     const token = getToken()
//     if (!token) return
//     setLoading(true)
//     setError(null)
//     apiFetch<CalendarResponse>(
//       `/reports/calendar?month=${encodeURIComponent(month)}${filterQuery}`,
//       { token },
//     )
//       .then(setData)
//       .catch((e: unknown) =>
//         setError(e instanceof Error ? e.message : 'Failed to load calendar'),
//       )
//       .finally(() => setLoading(false))
//   }, [month, filterQuery])

//   // -- total deliveries for the month -------------------------------------
//   const monthTotal = useMemo(
//     () => data?.days.reduce((n, d) => n + d.total, 0) ?? 0,
//     [data],
//   )

//   // -- navigate to reports page for a specific date, carrying filters ------
//   const openReports = (date: string) => {
//     const params = new URLSearchParams({ date, tab: 'daily' })
//     if (godownId) params.set('godownId', godownId)
//     if (site) params.set('site', site)
//     navigate(`/reports?${params.toString()}`)
//   }

//   const currentMonthLabel = useMemo(() => {
//     const [year, monthNum] = month.split('-').map(Number)
//     return new Date(year, monthNum - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
//   }, [month])

//   // -- shared styles -------------------------------------------------------

//   const card: React.CSSProperties = {
//     background: '#ffffff',
//     border: '1px solid #e8e4f8',
//     borderRadius: 16,
//     overflow: 'hidden',
//   }

//   const navBtn: React.CSSProperties = {
//     display: 'inline-flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: 32,
//     height: 32,
//     borderRadius: 8,
//     border: '1px solid #e2e0f0',
//     background: '#ffffff',
//     color: '#6b7280',
//     cursor: 'pointer',
//     transition: 'all 0.15s ease',
//   }

//   return (
//     // AppShell provides 20px 24px padding ù gap:12 keeps everything tight
//     <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 12 }}>

//       {/* ----------------------------------------------
//           FILTERS CARD ù label + inputs on ONE row
//       ---------------------------------------------- */}
//       <div style={card}>
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           gap: 20,
//           padding: '12px 22px',
//           flexWrap: 'wrap',
//         }}>
//           {/* Filters label ù left, inline */}
//           <div style={{ flexShrink: 0 }}>
//             <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Filters</div>
//             <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
//               Filter by warehouse &amp; site.
//             </div>
//           </div>

//           {/* Thin divider */}
//           <div style={{ width: 1, height: 32, background: '#ede9fe', flexShrink: 0 }} />

//           {/* Godown + Site inputs ù same row as label */}
//           <div style={{ flex: 1, minWidth: 0 }}>
//             <ReportFiltersBar
//               godowns={godowns}
//               sites={sites}
//               godownId={godownId}
//               site={site}
//               onGodownChange={(id) => setFilters({ godownId: id })}
//               onSiteChange={(s) => setFilters({ site: s })}
//               hideGodownFilter={lockGodownFilter}
//             />
//           </div>
//         </div>
//       </div>

//       {/* -- error -- */}
//       {error && (
//         <div style={{
//           padding: '10px 16px', borderRadius: 10,
//           background: '#fef2f2', color: '#b91c1c',
//           fontSize: 13, border: '1px solid #fecaca',
//         }}>
//           {error}
//         </div>
//       )}

//       {/* ----------------------------------------------
//           CALENDAR CARD
//       ---------------------------------------------- */}
//       <div style={card}>

//         {/* -- header: icon + month title + stat pills -- */}
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           padding: '14px 22px',
//           flexWrap: 'wrap',
//           gap: 12,
//         }}>
//           {/* left: icon + title */}
//           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//             <div style={{
//               width: 42, height: 42, borderRadius: 12,
//               background: 'linear-gradient(135deg, #7c6cf6 0%, #059669 100%)',
//               boxShadow: '0 4px 12px rgba(79,70,229,0.28)',
//               display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
//             }}>
//               <CalendarIcon />
//             </div>
//             <div>
//               <div style={{ fontSize: 20, fontWeight: 600, color: '#111827', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
//                 {currentMonthLabel}
//               </div>
//               <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
//                 Delivery activity overview
//               </div>
//             </div>
//           </div>

//           {/* right: stat pills */}
//           <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
//             {/* Total Deliveries */}
//             <div style={{
//               border: '1px solid #e0dafd', borderRadius: 10,
//               padding: '10px 18px', background: '#faf8ff',
//               minWidth: 120, display: 'flex', flexDirection: 'column', gap: 4,
//             }}>
//               <div style={{ fontSize: 9, fontWeight: 700, color: '#7c6cf6', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
//                 Total Deliveries
//               </div>
//               <div style={{ fontSize: 24, fontWeight: 600, color: '#4338ca', lineHeight: 1, textAlign: 'center' }}>
//                 {loading ? 'ù' : monthTotal}
//               </div>
//             </div>

//             {/* Active Month */}
//             <div style={{
//               border: '1px solid #e0dafd', borderRadius: 10,
//               padding: '10px 18px', background: '#faf8ff',
//               minWidth: 120, display: 'flex', flexDirection: 'column', gap: 4,
//             }}>
//               <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
//                 Active Month
//               </div>
//               <div style={{ fontSize: 16, fontWeight: 600, color: '#064e3b', lineHeight: 1, textAlign: 'center', marginTop: 2 }}>
//                 {month}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* -- month navigation row -- */}
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'flex-end',
//           gap: 8,
//           padding: '6px 22px 10px',
//         }}>
//           <button
//             style={navBtn}
//             onClick={() => setFilters({ month: shiftMonth(month, -1) })}
//             title="Previous month"
//             onMouseEnter={(e) => {
//               const el = e.currentTarget as HTMLElement
//               el.style.background = '#f5f3ff'
//               el.style.borderColor = '#c4b5fd'
//               el.style.color = '#059669'
//             }}
//             onMouseLeave={(e) => {
//               const el = e.currentTarget as HTMLElement
//               el.style.background = '#ffffff'
//               el.style.borderColor = '#e2e0f0'
//               el.style.color = '#6b7280'
//             }}
//           >
//             <ChevronLeft />
//           </button>

//           <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', minWidth: 90, textAlign: 'center' }}>
//             {currentMonthLabel}
//           </span>

//           <button
//             style={navBtn}
//             onClick={() => setFilters({ month: shiftMonth(month, 1) })}
//             title="Next month"
//             onMouseEnter={(e) => {
//               const el = e.currentTarget as HTMLElement
//               el.style.background = '#f5f3ff'
//               el.style.borderColor = '#c4b5fd'
//               el.style.color = '#059669'
//             }}
//             onMouseLeave={(e) => {
//               const el = e.currentTarget as HTMLElement
//               el.style.background = '#ffffff'
//               el.style.borderColor = '#e2e0f0'
//               el.style.color = '#6b7280'
//             }}
//           >
//             <ChevronRight />
//           </button>
//         </div>

//         {/* -- calendar grid -- */}
//         {/*
//           data?.days carries the CalendarDay[] array from the API.
//           Each day has .date (YYYY-MM-DD), .total (delivery count), .byStatus.
//           MonthCalendar renders them as colored cells; clicking calls
//           onSelectDate ? openReports() which navigates to /reports?date=...
//           carrying the currently-active godownId and site filters.
//         */}
//         <div style={{ background: '#f8f7ff' }}>
//           <MonthCalendar
//             month={month}
//             days={data?.days ?? []}
//             selectedDate={selectedDate}
//             onSelectDate={(date) => {
//               setSelectedDate(date)
//               openReports(date)
//             }}
//           />
//         </div>

//         {/* -- footer hint -- */}
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           padding: '10px 22px',
//           borderTop: '1px solid #f1f0f9',
//           background: '#faf9ff',
//           flexWrap: 'wrap',
//           gap: 8,
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#6b7280' }}>
//             <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
//             Click any date to open detailed reports.
//           </div>
//           <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
//             Live delivery scheduling overview
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MonthCalendar } from '../components/calendar/MonthCalendar'
import { ReportFiltersBar } from '../components/reports/ReportFiltersBar'
import { Badge } from '../components/ui/Badge'
import { apiFetch } from '../lib/api'
import { getToken } from '../auth/store'
import { deliveryBadgeVariant, deliveryStatusLabel } from '../lib/deliveryStatus'
import { formatDateTime } from '../lib/format'
import { useReportFilters } from '../hooks/useReportFilters'
import type { CalendarResponse, DailyReport } from '../types/reports'

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, (m || 1) - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatSelectedDate(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function CalendarPage() {
  const navigate = useNavigate()
  const {
    month,
    godownId,
    site,
    godowns,
    sites,
    filterQuery,
    setFilters,
    lockGodownFilter,
  } = useReportFilters()

  const [data, setData] = useState<CalendarResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(todayKey)
  const [daily, setDaily] = useState<DailyReport | null>(null)
  const [dailyLoading, setDailyLoading] = useState(false)
  const [dailyError, setDailyError] = useState<string | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    setError(null)
    apiFetch<CalendarResponse>(
      `/reports/calendar?month=${encodeURIComponent(month)}${filterQuery}`,
      { token },
    )
      .then(setData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Failed to load calendar'),
      )
      .finally(() => setLoading(false))
  }, [month, filterQuery])

  const monthTotal = useMemo(
    () => data?.days.reduce((n, d) => n + d.total, 0) ?? 0,
    [data],
  )

  const selectedDayTotal = useMemo(() => {
    if (!selectedDate) return 0
    return data?.days.find((d) => d.date === selectedDate)?.total ?? daily?.deliveries.length ?? 0
  }, [data, selectedDate, daily])

  useEffect(() => {
    if (!selectedDate) return
    const token = getToken()
    if (!token) return
    setDailyLoading(true)
    setDailyError(null)
    apiFetch<DailyReport>(
      `/reports/daily?date=${encodeURIComponent(selectedDate)}${filterQuery}`,
      { token },
    )
      .then(setDaily)
      .catch((e: unknown) =>
        setDailyError(e instanceof Error ? e.message : 'Failed to load deliveries'),
      )
      .finally(() => setDailyLoading(false))
  }, [selectedDate, filterQuery])

  const currentMonthLabel = useMemo(() => {
    const [year, monthNum] = month.split('-').map(Number)
    return new Date(year, monthNum - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
  }, [month])

  const card: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e8e4f8',
    borderRadius: 16,
    overflow: 'hidden',
  }

  const navBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid #e2e0f0',
    background: '#ffffff',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  }

  return (
    <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* -- FILTERS CARD -- */}
      <div style={card}>
        <div style={{ padding: '10px 12px' }}>
          {/* Label row */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Filters</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Filter by warehouse &amp; site.</div>
          </div>
          {/* Inputs ù full width, stacks on mobile */}
          <ReportFiltersBar
            godowns={godowns}
            sites={sites}
            godownId={godownId}
            site={site}
            onGodownChange={(id) => setFilters({ godownId: id })}
            onSiteChange={(s) => setFilters({ site: s })}
            hideGodownFilter={lockGodownFilter}
          />
        </div>
      </div>

      {/* -- error -- */}
      {error && (
        <div style={{
          padding: '10px 12px', borderRadius: 10,
          background: '#fef2f2', color: '#b91c1c',
          fontSize: 13, border: '1px solid #fecaca',
        }}>
          {error}
        </div>
      )}

      {/* -- CALENDAR CARD -- */}
      <div style={card}>

        {/* Header: icon + title + stat pills ù all in one wrapping row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 12px 8px',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          {/* Icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
              boxShadow: '0 4px 12px rgba(16,185,129,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CalendarIcon />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', lineHeight: 1.2 }}>
                {currentMonthLabel}
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
                Delivery activity overview
              </div>
            </div>
          </div>

          {/* Stat pills ù flex-row, wrap below title on very narrow screens */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <div style={{
              border: '1px solid #bbf7d0', borderRadius: 9,
              padding: '6px 12px', background: '#f0fdf4',
              display: 'flex', flexDirection: 'column', gap: 3, minWidth: 80,
            }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#10b981', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Deliveries
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#047857', lineHeight: 1, textAlign: 'center' }}>
                {loading ? 'ù' : monthTotal}
              </div>
            </div>
            <div style={{
              border: '1px solid #bbf7d0', borderRadius: 9,
              padding: '6px 12px', background: '#f0fdf4',
              display: 'flex', flexDirection: 'column', gap: 3, minWidth: 80,
            }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Month
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#064e3b', lineHeight: 1, textAlign: 'center', marginTop: 2 }}>
                {month}
              </div>
            </div>
          </div>
        </div>

        {/* Month navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '4px 12px 8px',
        }}>
          <button
            style={navBtn}
            onClick={() => setFilters({ month: shiftMonth(month, -1) })}
            title="Previous month"
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = '#ecfdf5'
              el.style.borderColor = '#a7f3d0'
              el.style.color = '#059669'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = '#ffffff'
              el.style.borderColor = '#e2e0f0'
              el.style.color = '#6b7280'
            }}
          >
            <ChevronLeft />
          </button>

          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', textAlign: 'center' }}>
            {currentMonthLabel}
          </span>

          <button
            style={navBtn}
            onClick={() => setFilters({ month: shiftMonth(month, 1) })}
            title="Next month"
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = '#ecfdf5'
              el.style.borderColor = '#a7f3d0'
              el.style.color = '#059669'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = '#ffffff'
              el.style.borderColor = '#e2e0f0'
              el.style.color = '#6b7280'
            }}
          >
            <ChevronRight />
          </button>
        </div>

        {/* Calendar grid ù overflow:hidden clips any accidental bleed */}
        <div style={{ background: '#f0fdf4', overflow: 'hidden' }}>
          <MonthCalendar
            month={month}
            days={data?.days ?? []}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* Footer hint */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderTop: '1px solid #f1f0f9',
          background: '#faf9ff',
          flexWrap: 'wrap',
          gap: 6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
            Tap a date to view deliveries below; tap a delivery to open its details.
          </div>
          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>
            Live delivery scheduling overview
          </div>
        </div>
      </div>

      {/* -- DELIVERIES FOR SELECTED DATE -- */}
      {selectedDate && (
        <div style={card}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 12px 10px',
            borderBottom: '1px solid #f1f5f9',
            flexWrap: 'wrap',
            gap: 8,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                Deliveries for {formatSelectedDate(selectedDate)}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                {dailyLoading ? 'Loadingù' : `${selectedDayTotal} ${selectedDayTotal === 1 ? 'delivery' : 'deliveries'}`}
              </div>
            </div>
            <Link
              to={`/reports?date=${encodeURIComponent(selectedDate)}&tab=daily${godownId ? `&godownId=${encodeURIComponent(godownId)}` : ''}${site ? `&site=${encodeURIComponent(site)}` : ''}`}
              style={{ fontSize: 12, fontWeight: 600, color: '#059669', textDecoration: 'none' }}
            >
              Full report ?
            </Link>
          </div>

          {dailyError && (
            <div style={{
              margin: '10px 12px',
              padding: '10px 12px',
              borderRadius: 10,
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: 13,
              border: '1px solid #fecaca',
            }}>
              {dailyError}
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            {dailyLoading ? (
              <div style={{ padding: '28px 12px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
                Loading deliveriesù
              </div>
            ) : daily?.deliveries.length ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr>
                    {['Delivery', 'Customer', 'Site', 'Godown', 'Status', 'Scheduled'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 12px',
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#94a3b8',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          textAlign: 'left',
                          whiteSpace: 'nowrap',
                          background: '#f8fafc',
                          borderBottom: '1px solid #f1f5f9',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {daily.deliveries.map((d) => (
                    <tr
                      key={d.id}
                      role="link"
                      tabIndex={0}
                      title={`Open ${d.deliveryNo}`}
                      style={{ transition: 'background 0.12s', cursor: 'pointer' }}
                      onClick={() => navigate(`/deliveries/${d.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          navigate(`/deliveries/${d.id}`)
                        }
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
                    >
                      <td style={{ padding: '12px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontWeight: 600, color: '#059669' }}>
                          {d.deliveryNo}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px',
                        fontSize: 13,
                        color: '#374151',
                        borderBottom: '1px solid #f1f5f9',
                        maxWidth: 140,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {d.customerName}
                      </td>
                      <td style={{
                        padding: '12px',
                        fontSize: 13,
                        color: '#374151',
                        borderBottom: '1px solid #f1f5f9',
                        maxWidth: 120,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {d.siteName || d.siteAddress || 'ù'}
                      </td>
                      <td style={{
                        padding: '12px',
                        fontSize: 13,
                        color: '#374151',
                        borderBottom: '1px solid #f1f5f9',
                        maxWidth: 110,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {d.godownName || 'ù'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                        <Badge variant={deliveryBadgeVariant(d.status)}>
                          {deliveryStatusLabel(d.status)}
                        </Badge>
                      </td>
                      <td style={{
                        padding: '12px',
                        fontSize: 13,
                        color: '#64748b',
                        borderBottom: '1px solid #f1f5f9',
                        whiteSpace: 'nowrap',
                      }}>
                        {formatDateTime(d.deliveryAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : !dailyError ? (
              <div style={{ padding: '32px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>No deliveries</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  No deliveries scheduled for this date with the current filters.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}