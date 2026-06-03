
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
//     <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

//   const monthTotal = useMemo(
//     () => data?.days.reduce((n, d) => n + d.total, 0) ?? 0,
//     [data],
//   )

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

//   // ── shared card style ──────────────────────────────────────────────────────
//   const card: React.CSSProperties = {
//     background: '#ffffff',
//     border: '1px solid #e8e4f8',
//     borderRadius: 16,
//     overflow: 'hidden',
//   }

//   // ── nav button style ───────────────────────────────────────────────────────
//   const navBtn: React.CSSProperties = {
//     display: 'inline-flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: 34,
//     height: 34,
//     borderRadius: 8,
//     border: '1px solid #e2e0f0',
//     background: '#ffffff',
//     color: '#6b7280',
//     cursor: 'pointer',
//     transition: 'all 0.15s ease',
//   }

//   return (
//     <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 20 }}>

//       {/* ── page title row ── */}
//       {/* <div>
//         <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Calendar</h1>
//         <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
//           Track and manage scheduled deliveries across all godowns and customer locations.
//         </p>
//       </div> */}

//       {/* ── filters card ── */}
//       <div style={card}>
//         {/* card header */}
//         <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f0f9' }}>
//           <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Filters</div>
//           <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>
//             Filter deliveries by warehouse and site.
//           </div>
//         </div>
//         {/* filter controls */}
//         <div style={{ padding: '18px 22px' }}>
//           <ReportFiltersBar
//             godowns={godowns}
//             sites={sites}
//             godownId={godownId}
//             site={site}
//             onGodownChange={(id) => setFilters({ godownId: id })}
//             onSiteChange={(s) => setFilters({ site: s })}
//             hideGodownFilter={lockGodownFilter}
//           />
//         </div>
//       </div>

//       {/* ── error ── */}
//       {error && (
//         <div style={{
//           padding: '12px 16px',
//           borderRadius: 12,
//           background: '#fef2f2',
//           color: '#b91c1c',
//           fontSize: 13,
//           border: '1px solid #fecaca',
//         }}>
//           {error}
//         </div>
//       )}

//       {/* ── calendar card ── */}
//       <div style={card}>

//         {/* ── card header: icon + title + stat pills ── */}
//         <div
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             padding: '20px 24px',
//             flexWrap: 'wrap',
//             gap: 16,
//           }}
//         >
//           {/* left: icon + month title */}
//           <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
//             {/* purple gradient icon box */}
//             <div
//               style={{
//                 width: 48,
//                 height: 48,
//                 borderRadius: 12,
//                 background: 'linear-gradient(135deg, #7c6cf6 0%, #4f46e5 100%)',
//                 boxShadow: '0 6px 16px rgba(79, 70, 229, 0.30)',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 flexShrink: 0,
//               }}
//             >
//               <CalendarIcon />
//             </div>
//             <div>
//               <div style={{ fontSize: 24, fontWeight: 600, color: '#111827', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
//                 {currentMonthLabel}
//               </div>
//               <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
//                 Delivery activity overview
//               </div>
//             </div>
//           </div>

//           {/* right: stat pills */}
//           <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
//             {/* Total Deliveries pill */}
//             <div
//               style={{
//                 border: '1px solid #e0dafd',
//                 borderRadius: 12,
//                 padding: '12px 20px',
//                 background: '#faf8ff',
//                 minWidth: 140,
//                 display: 'flex',
//                 flexDirection: 'column',
//                 gap: 6,
//               }}
//             >
//               <div style={{
//                 fontSize: 10,
//                 fontWeight: 700,
//                 color: '#7c6cf6',
//                 letterSpacing: '0.10em',
//                 textTransform: 'uppercase',
//               }}>
//                 Total Deliveries
//               </div>
//               <div style={{
//                 fontSize: 28,
//                 fontWeight: 600,
//                 color: '#4338ca',
//                 lineHeight: 1,
//                 textAlign: 'center',
//               }}>
//                 {loading ? '…' : monthTotal}
//               </div>
//             </div>

//             {/* Active Month pill */}
//             <div
//               style={{
//                 border: '1px solid #e0dafd',
//                 borderRadius: 12,
//                 padding: '12px 20px',
//                 background: '#faf8ff',
//                 minWidth: 140,
//                 display: 'flex',
//                 flexDirection: 'column',
//                 gap: 6,
//               }}
//             >
//               <div style={{
//                 fontSize: 10,
//                 fontWeight: 700,
//                 color: '#9ca3af',
//                 letterSpacing: '0.10em',
//                 textTransform: 'uppercase',
//               }}>
//                 Active Month
//               </div>
//               <div style={{
//                 fontSize: 18,
//                 fontWeight: 600,
//                 color: '#1e1b4b',
//                 lineHeight: 1,
//                 textAlign: 'center',
//                 marginTop: 4,
//               }}>
//                 {month}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* ── month navigation row ── */}
//         <div
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'flex-end',
//             gap: 10,
//             padding: '10px 24px 14px',
//           }}
//         >
//           <button
//             style={navBtn}
//             onClick={() => setFilters({ month: shiftMonth(month, -1) })}
//             title="Previous month"
//             onMouseEnter={(e) => {
//               const el = e.currentTarget as HTMLElement
//               el.style.background = '#f5f3ff'
//               el.style.borderColor = '#c4b5fd'
//               el.style.color = '#4f46e5'
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

//           <span style={{
//             fontSize: 14,
//             fontWeight: 600,
//             color: '#374151',
//             minWidth: 96,
//             textAlign: 'center',
//           }}>
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
//               el.style.color = '#4f46e5'
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

//         {/* ── calendar grid ── */}
//    {/* calendar grid */}
// <div style={{ background: '#f8f7ff' }}>
//   <MonthCalendar
//     month={month}
//     days={data?.days ?? []}
//     selectedDate={selectedDate}
//     onSelectDate={(date) => {
//       setSelectedDate(date)
//       openReports(date)
//     }}
//   />
// </div>

//         {/* ── footer hint ── */}
//         <div
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             padding: '12px 22px',
//             borderTop: '1px solid #f1f0f9',
//             background: '#faf9ff',
//             flexWrap: 'wrap',
//             gap: 8,
//           }}
//         >
//           <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b7280' }}>
//             <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
//             Click any date to open detailed reports.
//           </div>
//           <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
//             Live delivery scheduling overview
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MonthCalendar } from '../components/calendar/MonthCalendar'
import { ReportFiltersBar } from '../components/reports/ReportFiltersBar'
import { apiFetch } from '../lib/api'
import { getToken } from '../auth/store'
import { useReportFilters } from '../hooks/useReportFilters'
import type { CalendarResponse } from '../types/reports'

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
  const [selectedDate, setSelectedDate] = useState<string | undefined>()

  // ── fetch calendar data whenever month or filters change ────────────────
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

  // ── total deliveries for the month ─────────────────────────────────────
  const monthTotal = useMemo(
    () => data?.days.reduce((n, d) => n + d.total, 0) ?? 0,
    [data],
  )

  // ── navigate to reports page for a specific date, carrying filters ──────
  const openReports = (date: string) => {
    const params = new URLSearchParams({ date, tab: 'daily' })
    if (godownId) params.set('godownId', godownId)
    if (site) params.set('site', site)
    navigate(`/reports?${params.toString()}`)
  }

  const currentMonthLabel = useMemo(() => {
    const [year, monthNum] = month.split('-').map(Number)
    return new Date(year, monthNum - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
  }, [month])

  // ── shared styles ───────────────────────────────────────────────────────

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
  }

  return (
    // AppShell provides 20px 24px padding — gap:12 keeps everything tight
    <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ══════════════════════════════════════════════
          FILTERS CARD — label + inputs on ONE row
      ══════════════════════════════════════════════ */}
      <div style={card}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '12px 22px',
          flexWrap: 'wrap',
        }}>
          {/* Filters label — left, inline */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Filters</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
              Filter by warehouse &amp; site.
            </div>
          </div>

          {/* Thin divider */}
          <div style={{ width: 1, height: 32, background: '#ede9fe', flexShrink: 0 }} />

          {/* Godown + Site inputs — same row as label */}
          <div style={{ flex: 1, minWidth: 0 }}>
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
      </div>

      {/* ── error ── */}
      {error && (
        <div style={{
          padding: '10px 16px', borderRadius: 10,
          background: '#fef2f2', color: '#b91c1c',
          fontSize: 13, border: '1px solid #fecaca',
        }}>
          {error}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          CALENDAR CARD
      ══════════════════════════════════════════════ */}
      <div style={card}>

        {/* ── header: icon + month title + stat pills ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 22px',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          {/* left: icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg, #7c6cf6 0%, #4f46e5 100%)',
              boxShadow: '0 4px 12px rgba(79,70,229,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <CalendarIcon />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#111827', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                {currentMonthLabel}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                Delivery activity overview
              </div>
            </div>
          </div>

          {/* right: stat pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* Total Deliveries */}
            <div style={{
              border: '1px solid #e0dafd', borderRadius: 10,
              padding: '10px 18px', background: '#faf8ff',
              minWidth: 120, display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#7c6cf6', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                Total Deliveries
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#4338ca', lineHeight: 1, textAlign: 'center' }}>
                {loading ? '…' : monthTotal}
              </div>
            </div>

            {/* Active Month */}
            <div style={{
              border: '1px solid #e0dafd', borderRadius: 10,
              padding: '10px 18px', background: '#faf8ff',
              minWidth: 120, display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                Active Month
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1e1b4b', lineHeight: 1, textAlign: 'center', marginTop: 2 }}>
                {month}
              </div>
            </div>
          </div>
        </div>

        {/* ── month navigation row ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          padding: '6px 22px 10px',
        }}>
          <button
            style={navBtn}
            onClick={() => setFilters({ month: shiftMonth(month, -1) })}
            title="Previous month"
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = '#f5f3ff'
              el.style.borderColor = '#c4b5fd'
              el.style.color = '#4f46e5'
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

          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', minWidth: 90, textAlign: 'center' }}>
            {currentMonthLabel}
          </span>

          <button
            style={navBtn}
            onClick={() => setFilters({ month: shiftMonth(month, 1) })}
            title="Next month"
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = '#f5f3ff'
              el.style.borderColor = '#c4b5fd'
              el.style.color = '#4f46e5'
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

        {/* ── calendar grid ── */}
        {/*
          data?.days carries the CalendarDay[] array from the API.
          Each day has .date (YYYY-MM-DD), .total (delivery count), .byStatus.
          MonthCalendar renders them as colored cells; clicking calls
          onSelectDate → openReports() which navigates to /reports?date=...
          carrying the currently-active godownId and site filters.
        */}
        <div style={{ background: '#f8f7ff' }}>
          <MonthCalendar
            month={month}
            days={data?.days ?? []}
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date)
              openReports(date)
            }}
          />
        </div>

        {/* ── footer hint ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 22px',
          borderTop: '1px solid #f1f0f9',
          background: '#faf9ff',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#6b7280' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
            Click any date to open detailed reports.
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
            Live delivery scheduling overview
          </div>
        </div>
      </div>
    </div>
  )
}