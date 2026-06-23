// import { useEffect, useMemo, useState } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import { MonthCalendar } from '../components/calendar/MonthCalendar'
// import { ReportFiltersBar } from '../components/reports/ReportFiltersBar'
// import { Badge } from '../components/ui/Badge'
// import { apiFetch } from '../lib/api'
// import { getToken } from '../auth/store'
// import { deliveryBadgeVariant, deliveryStatusLabel } from '../lib/deliveryStatus'
// import { formatDateTime } from '../lib/format'
// import { useReportFilters } from '../hooks/useReportFilters'
// import type { CalendarResponse, DailyReport } from '../types/reports'

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

// function todayKey() {
//   const d = new Date()
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
// }

// function formatSelectedDate(date: string) {
//   const [y, m, d] = date.split('-').map(Number)
//   return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('en-IN', {
//     weekday: 'long',
//     day: 'numeric',
//     month: 'long',
//     year: 'numeric',
//   })
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
//   const [selectedDate, setSelectedDate] = useState<string>(todayKey)
//   const [daily, setDaily] = useState<DailyReport | null>(null)
//   const [dailyLoading, setDailyLoading] = useState(false)
//   const [dailyError, setDailyError] = useState<string | null>(null)

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

//   const selectedDayTotal = useMemo(() => {
//     if (!selectedDate) return 0
//     return data?.days.find((d) => d.date === selectedDate)?.total ?? daily?.deliveries.length ?? 0
//   }, [data, selectedDate, daily])

//   useEffect(() => {
//     if (!selectedDate) return
//     const token = getToken()
//     if (!token) return
//     setDailyLoading(true)
//     setDailyError(null)
//     apiFetch<DailyReport>(
//       `/reports/daily?date=${encodeURIComponent(selectedDate)}${filterQuery}`,
//       { token },
//     )
//       .then(setDaily)
//       .catch((e: unknown) =>
//         setDailyError(e instanceof Error ? e.message : 'Failed to load deliveries'),
//       )
//       .finally(() => setDailyLoading(false))
//   }, [selectedDate, filterQuery])

//   const currentMonthLabel = useMemo(() => {
//     const [year, monthNum] = month.split('-').map(Number)
//     return new Date(year, monthNum - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
//   }, [month])

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
//     flexShrink: 0,
//   }

//   return (
//     <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 10 }}>

//       {/* -- FILTERS CARD -- */}
//       <div style={card}>
//         <div style={{ padding: '10px 12px' }}>
//           {/* Label row */}
//           <div style={{ marginBottom: 8 }}>
//             <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Filters</div>
//             <div style={{ fontSize: 11, color: '#6b7280' }}>Filter by warehouse &amp; site.</div>
//           </div>
//           {/* Inputs � full width, stacks on mobile */}
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

//       {/* -- error -- */}
//       {error && (
//         <div style={{
//           padding: '10px 12px', borderRadius: 10,
//           background: '#fef2f2', color: '#b91c1c',
//           fontSize: 13, border: '1px solid #fecaca',
//         }}>
//           {error}
//         </div>
//       )}

//       {/* -- CALENDAR CARD -- */}
//       <div style={card}>

//         {/* Header: icon + title + stat pills � all in one wrapping row */}
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           padding: '12px 12px 8px',
//           flexWrap: 'wrap',
//           gap: 10,
//         }}>
//           {/* Icon + title */}
//           <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//             <div style={{
//               width: 38, height: 38, borderRadius: 10, flexShrink: 0,
//               background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
//               boxShadow: '0 4px 12px rgba(16,185,129,0.28)',
//               display: 'flex', alignItems: 'center', justifyContent: 'center',
//             }}>
//               <CalendarIcon />
//             </div>
//             <div>
//               <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', lineHeight: 1.2 }}>
//                 {currentMonthLabel}
//               </div>
//               <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
//                 Delivery activity overview
//               </div>
//             </div>
//           </div>

//           {/* Stat pills � flex-row, wrap below title on very narrow screens */}
//           <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
//             <div style={{
//               border: '1px solid #bbf7d0', borderRadius: 9,
//               padding: '6px 12px', background: '#f0fdf4',
//               display: 'flex', flexDirection: 'column', gap: 3, minWidth: 80,
//             }}>
//               <div style={{ fontSize: 8, fontWeight: 700, color: '#10b981', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
//                 Deliveries
//               </div>
//               <div style={{ fontSize: 20, fontWeight: 700, color: '#047857', lineHeight: 1, textAlign: 'center' }}>
//                 {loading ? '�' : monthTotal}
//               </div>
//             </div>
//             <div style={{
//               border: '1px solid #bbf7d0', borderRadius: 9,
//               padding: '6px 12px', background: '#f0fdf4',
//               display: 'flex', flexDirection: 'column', gap: 3, minWidth: 80,
//             }}>
//               <div style={{ fontSize: 8, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
//                 Month
//               </div>
//               <div style={{ fontSize: 13, fontWeight: 600, color: '#064e3b', lineHeight: 1, textAlign: 'center', marginTop: 2 }}>
//                 {month}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Month navigation */}
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           gap: 12,
//           padding: '4px 12px 8px',
//         }}>
//           <button
//             style={navBtn}
//             onClick={() => setFilters({ month: shiftMonth(month, -1) })}
//             title="Previous month"
//             onMouseEnter={(e) => {
//               const el = e.currentTarget as HTMLElement
//               el.style.background = '#ecfdf5'
//               el.style.borderColor = '#a7f3d0'
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

//           <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', textAlign: 'center' }}>
//             {currentMonthLabel}
//           </span>

//           <button
//             style={navBtn}
//             onClick={() => setFilters({ month: shiftMonth(month, 1) })}
//             title="Next month"
//             onMouseEnter={(e) => {
//               const el = e.currentTarget as HTMLElement
//               el.style.background = '#ecfdf5'
//               el.style.borderColor = '#a7f3d0'
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

//         {/* Calendar grid � overflow:hidden clips any accidental bleed */}
//         <div style={{ background: '#f0fdf4', overflow: 'hidden' }}>
//           <MonthCalendar
//             month={month}
//             days={data?.days ?? []}
//             selectedDate={selectedDate}
//             onSelectDate={setSelectedDate}
//           />
//         </div>

//         {/* Footer hint */}
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           padding: '8px 12px',
//           borderTop: '1px solid #f1f0f9',
//           background: '#faf9ff',
//           flexWrap: 'wrap',
//           gap: 6,
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}>
//             <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
//             Tap a date to view deliveries below; tap a delivery to open its details.
//           </div>
//           <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>
//             Live delivery scheduling overview
//           </div>
//         </div>
//       </div>

//       {/* -- DELIVERIES FOR SELECTED DATE -- */}
//       {selectedDate && (
//         <div style={card}>
//           <div style={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             padding: '12px 12px 10px',
//             borderBottom: '1px solid #f1f5f9',
//             flexWrap: 'wrap',
//             gap: 8,
//           }}>
//             <div>
//               <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
//                 Deliveries for {formatSelectedDate(selectedDate)}
//               </div>
//               <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
//                 {dailyLoading ? 'Loading�' : `${selectedDayTotal} ${selectedDayTotal === 1 ? 'delivery' : 'deliveries'}`}
//               </div>
//             </div>
//             <Link
//               to={`/reports?date=${encodeURIComponent(selectedDate)}&tab=daily${godownId ? `&godownId=${encodeURIComponent(godownId)}` : ''}${site ? `&site=${encodeURIComponent(site)}` : ''}`}
//               style={{ fontSize: 12, fontWeight: 600, color: '#059669', textDecoration: 'none' }}
//             >
//               Full report ?
//             </Link>
//           </div>

//           {dailyError && (
//             <div style={{
//               margin: '10px 12px',
//               padding: '10px 12px',
//               borderRadius: 10,
//               background: '#fef2f2',
//               color: '#b91c1c',
//               fontSize: 13,
//               border: '1px solid #fecaca',
//             }}>
//               {dailyError}
//             </div>
//           )}

//           <div style={{ overflowX: 'auto' }}>
//             {dailyLoading ? (
//               <div style={{ padding: '28px 12px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
//                 Loading deliveries�
//               </div>
//             ) : daily?.deliveries.length ? (
//               <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
//                 <thead>
//                   <tr>
//                     {['Delivery', 'Customer', 'Site', 'Godown', 'Status', 'Scheduled'].map((h) => (
//                       <th
//                         key={h}
//                         style={{
//                           padding: '10px 12px',
//                           fontSize: 10,
//                           fontWeight: 700,
//                           color: '#94a3b8',
//                           textTransform: 'uppercase',
//                           letterSpacing: '0.06em',
//                           textAlign: 'left',
//                           whiteSpace: 'nowrap',
//                           background: '#f8fafc',
//                           borderBottom: '1px solid #f1f5f9',
//                         }}
//                       >
//                         {h}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {daily.deliveries.map((d) => (
//                     <tr
//                       key={d.id}
//                       role="link"
//                       tabIndex={0}
//                       title={`Open ${d.deliveryNo}`}
//                       style={{ transition: 'background 0.12s', cursor: 'pointer' }}
//                       onClick={() => navigate(`/deliveries/${d.id}`)}
//                       onKeyDown={(e) => {
//                         if (e.key === 'Enter' || e.key === ' ') {
//                           e.preventDefault()
//                           navigate(`/deliveries/${d.id}`)
//                         }
//                       }}
//                       onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4' }}
//                       onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
//                     >
//                       <td style={{ padding: '12px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
//                         <span style={{ fontWeight: 600, color: '#059669' }}>
//                           {d.deliveryNo}
//                         </span>
//                       </td>
//                       <td style={{
//                         padding: '12px',
//                         fontSize: 13,
//                         color: '#374151',
//                         borderBottom: '1px solid #f1f5f9',
//                         maxWidth: 140,
//                         overflow: 'hidden',
//                         textOverflow: 'ellipsis',
//                         whiteSpace: 'nowrap',
//                       }}>
//                         {d.customerName}
//                       </td>
//                       <td style={{
//                         padding: '12px',
//                         fontSize: 13,
//                         color: '#374151',
//                         borderBottom: '1px solid #f1f5f9',
//                         maxWidth: 120,
//                         overflow: 'hidden',
//                         textOverflow: 'ellipsis',
//                         whiteSpace: 'nowrap',
//                       }}>
//                         {d.siteName || d.siteAddress || '�'}
//                       </td>
//                       <td style={{
//                         padding: '12px',
//                         fontSize: 13,
//                         color: '#374151',
//                         borderBottom: '1px solid #f1f5f9',
//                         maxWidth: 110,
//                         overflow: 'hidden',
//                         textOverflow: 'ellipsis',
//                         whiteSpace: 'nowrap',
//                       }}>
//                         {d.godownName || '�'}
//                       </td>
//                       <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
//                         <Badge variant={deliveryBadgeVariant(d.status)}>
//                           {deliveryStatusLabel(d.status)}
//                         </Badge>
//                       </td>
//                       <td style={{
//                         padding: '12px',
//                         fontSize: 13,
//                         color: '#64748b',
//                         borderBottom: '1px solid #f1f5f9',
//                         whiteSpace: 'nowrap',
//                       }}>
//                         {formatDateTime(d.deliveryAt)}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             ) : !dailyError ? (
//               <div style={{ padding: '32px 12px', textAlign: 'center' }}>
//                 <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>No deliveries</div>
//                 <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
//                   No deliveries scheduled for this date with the current filters.
//                 </div>
//               </div>
//             ) : null}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// import { useEffect, useMemo, useState } from 'react'
// import { Link, useNavigate, useSearchParams } from 'react-router-dom'
// import { MonthCalendar } from '../components/calendar/MonthCalendar'
// import { ReportFiltersBar } from '../components/reports/ReportFiltersBar'
// import { Badge } from '../components/ui/Badge'
// import { apiFetch } from '../lib/api'
// import { getToken } from '../auth/store'
// import { deliveryBadgeVariant, deliveryStatusLabel } from '../lib/deliveryStatus'
// import { formatDateTime } from '../lib/format'
// import { useReportFilters } from '../hooks/useReportFilters'
// import type { CalendarResponse, DailyReport } from '../types/reports'

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

// function ReturnIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M9 14l-4-4 4-4" />
//       <path d="M5 10h11a4 4 0 0 1 0 8h-1" />
//     </svg>
//   )
// }

// function todayKey() {
//   const d = new Date()
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
// }

// function formatSelectedDate(date: string) {
//   const [y, m, d] = date.split('-').map(Number)
//   return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('en-IN', {
//     weekday: 'long',
//     day: 'numeric',
//     month: 'long',
//     year: 'numeric',
//   })
// }

// // ── status label for the active filter pill ───────────────────────────────

// function statusFilterLabel(status: string | null, phase: string | null): string | null {
//   if (phase === 'return') {
//     if (status === 'active') return 'Return dispatch'
//     if (status === 'pending') return 'Returns pending'
//     if (status === 'completed') return 'Returns completed'
//     return 'All returns'
//   }
//   if (status === 'active') return 'Pending / Dispatched'
//   if (status === 'pending_return') return 'Pending returns'
//   if (status === 'completed') return 'Completed'
//   return null
// }

// export function CalendarPage() {
//   const navigate = useNavigate()
//   const [searchParams, setSearchParams] = useSearchParams()

//   // ── URL-driven filters from dashboard navigation ──────────────────────
//   const phaseFromUrl  = searchParams.get('phase')   // 'return' | null
//   const statusFromUrl = searchParams.get('status')  // 'active' | 'pending_return' | 'pending' | 'completed' | null
//   const dateFromUrl   = searchParams.get('date')    // 'YYYY-MM-DD' | null

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

//   // If dashboard passed a date param, start with that date selected
//   const [selectedDate, setSelectedDate] = useState<string>(
//     dateFromUrl ?? todayKey()
//   )
//   const [daily, setDaily] = useState<DailyReport | null>(null)
//   const [dailyLoading, setDailyLoading] = useState(false)
//   const [dailyError, setDailyError] = useState<string | null>(null)

//   // ── load calendar month data ──────────────────────────────────────────
//   useEffect(() => {
//     const token = getToken()
//     if (!token) return
//     setLoading(true)
//     setError(null)
//     apiFetch<CalendarResponse>(
//       `/reports/calendar?month=${encodeURIComponent(month)}${filterQuery}${phaseFromUrl ? `&phase=${encodeURIComponent(phaseFromUrl)}` : ''}`,
//       { token },
//     )
//       .then(setData)
//       .catch((e: unknown) =>
//         setError(e instanceof Error ? e.message : 'Failed to load calendar'),
//       )
//       .finally(() => setLoading(false))
//   }, [month, filterQuery, phaseFromUrl])

//   const monthTotal = useMemo(
//     () => data?.days.reduce((n, d) => n + d.total, 0) ?? 0,
//     [data],
//   )

//   const selectedDayTotal = useMemo(() => {
//     if (!selectedDate) return 0
//     return data?.days.find((d) => d.date === selectedDate)?.total ?? daily?.deliveries.length ?? 0
//   }, [data, selectedDate, daily])

//   // ── load daily deliveries ─────────────────────────────────────────────
//   useEffect(() => {
//     if (!selectedDate) return
//     const token = getToken()
//     if (!token) return
//     setDailyLoading(true)
//     setDailyError(null)

//     const phaseParam  = phaseFromUrl  ? `&phase=${encodeURIComponent(phaseFromUrl)}`   : ''
//     const statusParam = statusFromUrl ? `&status=${encodeURIComponent(statusFromUrl)}` : ''

//     apiFetch<DailyReport>(
//       `/reports/daily?date=${encodeURIComponent(selectedDate)}${filterQuery}${phaseParam}${statusParam}`,
//       { token },
//     )
//       .then(setDaily)
//       .catch((e: unknown) =>
//         setDailyError(e instanceof Error ? e.message : 'Failed to load deliveries'),
//       )
//       .finally(() => setDailyLoading(false))
//   }, [selectedDate, filterQuery, phaseFromUrl, statusFromUrl])

//   // ── clear phase/status filters ────────────────────────────────────────
//   const clearDashboardFilters = () => {
//     const next = new URLSearchParams(searchParams)
//     next.delete('phase')
//     next.delete('status')
//     next.delete('date')
//     setSearchParams(next)
//   }

//   const currentMonthLabel = useMemo(() => {
//     const [year, monthNum] = month.split('-').map(Number)
//     return new Date(year, monthNum - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
//   }, [month])

//   const isReturnPhase = phaseFromUrl === 'return'
//   const activeFilterLabel = statusFilterLabel(statusFromUrl, phaseFromUrl)

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
//     flexShrink: 0,
//   }

//   // Icon gradient: green for forward, amber for return
//   const iconGradient = isReturnPhase
//     ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)'
//     : 'linear-gradient(135deg, #34d399 0%, #059669 100%)'
//   const iconShadow = isReturnPhase
//     ? '0 4px 12px rgba(217,119,6,0.28)'
//     : '0 4px 12px rgba(16,185,129,0.28)'

//   return (
//     <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 10 }}>

//       {/* -- FILTERS CARD -- */}
//       <div style={card}>
//         <div style={{ padding: '10px 12px' }}>
//           <div style={{ marginBottom: 8 }}>
//             <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Filters</div>
//             <div style={{ fontSize: 11, color: '#6b7280' }}>Filter by warehouse &amp; site.</div>
//           </div>
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

//       {/* -- active dashboard filter pill -- */}
//       {(phaseFromUrl || statusFromUrl) && (
//         <div style={{
//           display: 'flex', alignItems: 'center', gap: 8,
//           padding: '8px 12px',
//           background: isReturnPhase ? '#fffbeb' : '#f0fdf4',
//           border: `1px solid ${isReturnPhase ? '#fde68a' : '#bbf7d0'}`,
//           borderRadius: 10,
//           flexWrap: 'wrap',
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
//             <span style={{
//               fontSize: 11, fontWeight: 700,
//               color: isReturnPhase ? '#92400e' : '#065f46',
//               textTransform: 'uppercase', letterSpacing: '0.06em',
//             }}>
//               {isReturnPhase ? '↩ Return phase' : '📦 Delivery'}{activeFilterLabel ? ' ·' : ''}
//             </span>
//             {activeFilterLabel && (
//               <span style={{
//                 display: 'inline-flex', alignItems: 'center',
//                 padding: '2px 10px', borderRadius: 20,
//                 fontSize: 11, fontWeight: 600,
//                 background: isReturnPhase ? '#fef9c3' : '#d1fae5',
//                 color: isReturnPhase ? '#b45309' : '#047857',
//                 border: `1px solid ${isReturnPhase ? '#fde68a' : '#a7f3d0'}`,
//               }}>
//                 {activeFilterLabel}
//               </span>
//             )}
//             <span style={{ fontSize: 11, color: '#6b7280' }}>
//               Showing filtered deliveries for selected date.
//             </span>
//           </div>
//           <button
//             onClick={clearDashboardFilters}
//             style={{
//               fontSize: 11, fontWeight: 600,
//               color: isReturnPhase ? '#b45309' : '#059669',
//               background: 'none', border: 'none', cursor: 'pointer',
//               padding: '2px 6px', borderRadius: 6,
//               textDecoration: 'underline',
//             }}
//           >
//             Clear filter
//           </button>
//         </div>
//       )}

//       {/* -- error -- */}
//       {error && (
//         <div style={{
//           padding: '10px 12px', borderRadius: 10,
//           background: '#fef2f2', color: '#b91c1c',
//           fontSize: 13, border: '1px solid #fecaca',
//         }}>
//           {error}
//         </div>
//       )}

//       {/* -- CALENDAR CARD -- */}
//       <div style={card}>

//         {/* Header */}
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           padding: '12px 12px 8px',
//           flexWrap: 'wrap',
//           gap: 10,
//         }}>
//           {/* Icon + title */}
//           <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//             <div style={{
//               width: 38, height: 38, borderRadius: 10, flexShrink: 0,
//               background: iconGradient,
//               boxShadow: iconShadow,
//               display: 'flex', alignItems: 'center', justifyContent: 'center',
//             }}>
//               {isReturnPhase ? <ReturnIcon /> : <CalendarIcon />}
//             </div>
//             <div>
//               <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', lineHeight: 1.2 }}>
//                 {isReturnPhase ? 'Return Calendar — ' : ''}{currentMonthLabel}
//               </div>
//               <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
//                 {isReturnPhase ? 'Return delivery activity overview' : 'Delivery activity overview'}
//               </div>
//             </div>
//           </div>

//           {/* Stat pills */}
//           <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
//             <div style={{
//               border: `1px solid ${isReturnPhase ? '#fde68a' : '#bbf7d0'}`,
//               borderRadius: 9,
//               padding: '6px 12px',
//               background: isReturnPhase ? '#fffbeb' : '#f0fdf4',
//               display: 'flex', flexDirection: 'column', gap: 3, minWidth: 80,
//             }}>
//               <div style={{
//                 fontSize: 8, fontWeight: 700,
//                 color: isReturnPhase ? '#d97706' : '#10b981',
//                 letterSpacing: '0.08em', textTransform: 'uppercase',
//               }}>
//                 {isReturnPhase ? 'Returns' : 'Deliveries'}
//               </div>
//               <div style={{
//                 fontSize: 20, fontWeight: 700,
//                 color: isReturnPhase ? '#92400e' : '#047857',
//                 lineHeight: 1, textAlign: 'center',
//               }}>
//                 {loading ? '…' : monthTotal}
//               </div>
//             </div>
//             <div style={{
//               border: '1px solid #bbf7d0', borderRadius: 9,
//               padding: '6px 12px', background: '#f0fdf4',
//               display: 'flex', flexDirection: 'column', gap: 3, minWidth: 80,
//             }}>
//               <div style={{ fontSize: 8, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
//                 Month
//               </div>
//               <div style={{ fontSize: 13, fontWeight: 600, color: '#064e3b', lineHeight: 1, textAlign: 'center', marginTop: 2 }}>
//                 {month}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Month navigation */}
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           gap: 12,
//           padding: '4px 12px 8px',
//         }}>
//           <button
//             style={navBtn}
//             onClick={() => setFilters({ month: shiftMonth(month, -1) })}
//             title="Previous month"
//             onMouseEnter={(e) => {
//               const el = e.currentTarget as HTMLElement
//               el.style.background = '#ecfdf5'
//               el.style.borderColor = '#a7f3d0'
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

//           <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', textAlign: 'center' }}>
//             {currentMonthLabel}
//           </span>

//           <button
//             style={navBtn}
//             onClick={() => setFilters({ month: shiftMonth(month, 1) })}
//             title="Next month"
//             onMouseEnter={(e) => {
//               const el = e.currentTarget as HTMLElement
//               el.style.background = '#ecfdf5'
//               el.style.borderColor = '#a7f3d0'
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

//         {/* Calendar grid */}
//         <div style={{ background: isReturnPhase ? '#fffbeb' : '#f0fdf4', overflow: 'hidden' }}>
//           <MonthCalendar
//             month={month}
//             days={data?.days ?? []}
//             selectedDate={selectedDate}
//             onSelectDate={setSelectedDate}
//           />
//         </div>

//         {/* Footer hint */}
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           padding: '8px 12px',
//           borderTop: '1px solid #f1f0f9',
//           background: '#faf9ff',
//           flexWrap: 'wrap',
//           gap: 6,
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}>
//             <div style={{
//               width: 6, height: 6, borderRadius: '50%',
//               background: isReturnPhase ? '#f59e0b' : '#10b981',
//               flexShrink: 0,
//             }} />
//             Tap a date to view {isReturnPhase ? 'returns' : 'deliveries'} below; tap a row to open its details.
//           </div>
//           <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>
//             {isReturnPhase ? 'Return scheduling overview' : 'Live delivery scheduling overview'}
//           </div>
//         </div>
//       </div>

//       {/* -- DELIVERIES / RETURNS FOR SELECTED DATE -- */}
//       {selectedDate && (
//         <div style={card}>
//           <div style={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             padding: '12px 12px 10px',
//             borderBottom: '1px solid #f1f5f9',
//             flexWrap: 'wrap',
//             gap: 8,
//           }}>
//             <div>
//               <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
//                 <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
//                   {isReturnPhase ? 'Returns' : 'Deliveries'} for {formatSelectedDate(selectedDate)}
//                 </div>
//                 {/* Phase badge */}
//                 {isReturnPhase && (
//                   <span style={{
//                     display: 'inline-flex', alignItems: 'center', gap: 4,
//                     padding: '2px 10px', borderRadius: 20,
//                     fontSize: 11, fontWeight: 700,
//                     background: '#fef9c3', color: '#b45309',
//                     border: '1px solid #fde68a',
//                   }}>
//                     ↩ Return phase
//                   </span>
//                 )}
//                 {/* Status filter badge */}
//                 {activeFilterLabel && (
//                   <span style={{
//                     display: 'inline-flex', alignItems: 'center',
//                     padding: '2px 10px', borderRadius: 20,
//                     fontSize: 11, fontWeight: 600,
//                     background: isReturnPhase ? '#fef9c3' : '#d1fae5',
//                     color: isReturnPhase ? '#b45309' : '#047857',
//                     border: `1px solid ${isReturnPhase ? '#fde68a' : '#a7f3d0'}`,
//                   }}>
//                     {activeFilterLabel}
//                   </span>
//                 )}
//               </div>
//               <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
//                 {dailyLoading
//                   ? 'Loading…'
//                   : `${selectedDayTotal} ${selectedDayTotal === 1 ? (isReturnPhase ? 'return' : 'delivery') : (isReturnPhase ? 'returns' : 'deliveries')}`}
//               </div>
//             </div>
//             <Link
//               to={`/reports?date=${encodeURIComponent(selectedDate)}&tab=daily${godownId ? `&godownId=${encodeURIComponent(godownId)}` : ''}${site ? `&site=${encodeURIComponent(site)}` : ''}${phaseFromUrl ? `&phase=${encodeURIComponent(phaseFromUrl)}` : ''}${statusFromUrl ? `&status=${encodeURIComponent(statusFromUrl)}` : ''}`}
//               style={{ fontSize: 12, fontWeight: 600, color: '#059669', textDecoration: 'none', whiteSpace: 'nowrap' }}
//             >
//               Full report →
//             </Link>
//           </div>

//           {dailyError && (
//             <div style={{
//               margin: '10px 12px',
//               padding: '10px 12px',
//               borderRadius: 10,
//               background: '#fef2f2',
//               color: '#b91c1c',
//               fontSize: 13,
//               border: '1px solid #fecaca',
//             }}>
//               {dailyError}
//             </div>
//           )}

//           <div style={{ overflowX: 'auto' }}>
//             {dailyLoading ? (
//               <div style={{ padding: '28px 12px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
//                 Loading {isReturnPhase ? 'returns' : 'deliveries'}…
//               </div>
//             ) : daily?.deliveries.length ? (
//               <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
//                 <thead>
//                   <tr>
//                     {['Delivery', 'Customer', 'Site', 'Godown', 'Status', 'Scheduled'].map((h) => (
//                       <th
//                         key={h}
//                         style={{
//                           padding: '10px 12px',
//                           fontSize: 10,
//                           fontWeight: 700,
//                           color: '#94a3b8',
//                           textTransform: 'uppercase',
//                           letterSpacing: '0.06em',
//                           textAlign: 'left',
//                           whiteSpace: 'nowrap',
//                           background: '#f8fafc',
//                           borderBottom: '1px solid #f1f5f9',
//                         }}
//                       >
//                         {h}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {daily.deliveries.map((d) => (
//                     <tr
//                       key={d.id}
//                       role="link"
//                       tabIndex={0}
//                       title={`Open ${d.deliveryNo}`}
//                       style={{ transition: 'background 0.12s', cursor: 'pointer' }}
//                       onClick={() => navigate(`/deliveries/${d.id}`)}
//                       onKeyDown={(e) => {
//                         if (e.key === 'Enter' || e.key === ' ') {
//                           e.preventDefault()
//                           navigate(`/deliveries/${d.id}`)
//                         }
//                       }}
//                       onMouseEnter={(e) => {
//                         e.currentTarget.style.background = isReturnPhase ? '#fffbeb' : '#f0fdf4'
//                       }}
//                       onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
//                     >
//                       <td style={{ padding: '12px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
//                         <span style={{ fontWeight: 600, color: '#059669' }}>
//                           {d.deliveryNo}
//                         </span>
//                         {d.selfDelivery && (
//                           <span style={{
//                             display: 'inline-block', marginLeft: 6,
//                             padding: '1px 7px', borderRadius: 6,
//                             fontSize: 10, fontWeight: 700,
//                             background: '#eff6ff', color: '#2563eb',
//                             border: '1px solid #bfdbfe',
//                           }}>Self</span>
//                         )}
//                       </td>
//                       <td style={{
//                         padding: '12px',
//                         fontSize: 13,
//                         color: '#374151',
//                         borderBottom: '1px solid #f1f5f9',
//                         maxWidth: 140,
//                         overflow: 'hidden',
//                         textOverflow: 'ellipsis',
//                         whiteSpace: 'nowrap',
//                       }}>
//                         {d.customerName}
//                       </td>
//                       <td style={{
//                         padding: '12px',
//                         fontSize: 13,
//                         color: '#374151',
//                         borderBottom: '1px solid #f1f5f9',
//                         maxWidth: 120,
//                         overflow: 'hidden',
//                         textOverflow: 'ellipsis',
//                         whiteSpace: 'nowrap',
//                       }}>
//                         {d.siteName || d.siteAddress || '—'}
//                       </td>
//                       <td style={{
//                         padding: '12px',
//                         fontSize: 13,
//                         color: '#374151',
//                         borderBottom: '1px solid #f1f5f9',
//                         maxWidth: 110,
//                         overflow: 'hidden',
//                         textOverflow: 'ellipsis',
//                         whiteSpace: 'nowrap',
//                       }}>
//                         {d.godownName || '—'}
//                       </td>
//                       <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
//                         <Badge variant={deliveryBadgeVariant(d.status)}>
//                           {deliveryStatusLabel(d.status)}
//                         </Badge>
//                       </td>
//                       <td style={{
//                         padding: '12px',
//                         fontSize: 13,
//                         color: '#64748b',
//                         borderBottom: '1px solid #f1f5f9',
//                         whiteSpace: 'nowrap',
//                       }}>
//                         {formatDateTime(d.deliveryAt)}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             ) : !dailyError ? (
//               <div style={{ padding: '32px 12px', textAlign: 'center' }}>
//                 <div style={{ fontSize: 22, marginBottom: 6 }}>{isReturnPhase ? '↩' : '📦'}</div>
//                 <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
//                   No {isReturnPhase ? 'returns' : 'deliveries'} found
//                 </div>
//                 <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
//                   No {isReturnPhase ? 'return deliveries' : 'deliveries'} scheduled for this date
//                   {activeFilterLabel ? ` with filter "${activeFilterLabel}"` : ''}.
//                 </div>
//                 {(phaseFromUrl || statusFromUrl) && (
//                   <button
//                     onClick={clearDashboardFilters}
//                     style={{
//                       marginTop: 10, fontSize: 12, fontWeight: 600,
//                       color: '#059669', background: 'none', border: 'none',
//                       cursor: 'pointer', textDecoration: 'underline',
//                     }}
//                   >
//                     Clear filter to see all
//                   </button>
//                 )}
//               </div>
//             ) : null}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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

function ReturnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14l-4-4 4-4" />
      <path d="M5 10h11a4 4 0 0 1 0 8h-1" />
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

function statusFilterLabel(status: string | null, phase: string | null): string | null {
  if (phase === 'return') {
    if (status === 'active') return 'Return dispatch'
    if (status === 'pending') return 'Returns pending'
    if (status === 'completed') return 'Returns completed'
    return 'All returns'
  }
  if (status === 'active') return 'Pending / Dispatched'
  if (status === 'pending_return') return 'Pending returns'
  if (status === 'completed') return 'Completed'
  return null
}

// ── return status badge colour ────────────────────────────────────────────

function returnStatusStyle(status: string): React.CSSProperties {
  if (status === 'RETURN_PICKUP' || status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED')
    return { background: '#dcfce7', color: '#16a34a' }
  if (status === 'COMPLETED')
    return { background: '#f1f5f9', color: '#475569' }
  if (status === 'CANCELLED')
    return { background: '#fee2e2', color: '#dc2626' }
  // PROCESSED, PACKED, PENDING_RETURN, DELIVERED → amber (pending / not started)
  return { background: '#fef9c3', color: '#b45309' }
}

export function CalendarPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const phaseFromUrl  = searchParams.get('phase')   // 'return' | null
  const statusFromUrl = searchParams.get('status')  // 'active' | 'pending_return' | 'pending' | 'completed' | null
  const dateFromUrl   = searchParams.get('date')    // 'YYYY-MM-DD' | null

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

  const [selectedDate, setSelectedDate] = useState<string>(dateFromUrl ?? todayKey())
  const [daily, setDaily] = useState<DailyReport | null>(null)
  const [dailyLoading, setDailyLoading] = useState(false)
  const [dailyError, setDailyError] = useState<string | null>(null)

  const isReturnPhase = phaseFromUrl === 'return'

  // ── load calendar month data ──────────────────────────────────────────
  useEffect(() => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    setError(null)
    apiFetch<CalendarResponse>(
      `/reports/calendar?month=${encodeURIComponent(month)}${filterQuery}${isReturnPhase ? `&phase=return` : ''}`,
      { token },
    )
      .then(setData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Failed to load calendar'),
      )
      .finally(() => setLoading(false))
  }, [month, filterQuery, isReturnPhase])

  const monthTotal = useMemo(
    () => data?.days.reduce((n, d) => n + d.total, 0) ?? 0,
    [data],
  )

  const selectedDayTotal = useMemo(() => {
    if (!selectedDate) return 0
    return data?.days.find((d) => d.date === selectedDate)?.total ?? daily?.deliveries.length ?? 0
  }, [data, selectedDate, daily])

  // ── load daily deliveries ─────────────────────────────────────────────
  // In return phase: always fetch ALL return-phase deliveries for the day
  // (ignore the dashboard status filter — the calendar date click shows everything)
  // In forward phase: apply status filter from dashboard navigation if present
  useEffect(() => {
    if (!selectedDate) return
    const token = getToken()
    if (!token) return
    setDailyLoading(true)
    setDailyError(null)

    const phaseParam  = isReturnPhase ? `&phase=return` : ''
    // In return phase, don't narrow by status — show all return deliveries for the date
    const statusParam = (!isReturnPhase && statusFromUrl)
      ? `&status=${encodeURIComponent(statusFromUrl)}`
      : ''

    apiFetch<DailyReport>(
      `/reports/daily?date=${encodeURIComponent(selectedDate)}${filterQuery}${phaseParam}${statusParam}`,
      { token },
    )
      .then(setDaily)
      .catch((e: unknown) =>
        setDailyError(e instanceof Error ? e.message : 'Failed to load deliveries'),
      )
      .finally(() => setDailyLoading(false))
  }, [selectedDate, filterQuery, isReturnPhase, statusFromUrl])

  const clearDashboardFilters = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('phase')
    next.delete('status')
    next.delete('date')
    setSearchParams(next)
  }

  const currentMonthLabel = useMemo(() => {
    const [year, monthNum] = month.split('-').map(Number)
    return new Date(year, monthNum - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
  }, [month])

  const activeFilterLabel = statusFilterLabel(statusFromUrl, phaseFromUrl)

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

  const iconGradient = isReturnPhase
    ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)'
    : 'linear-gradient(135deg, #34d399 0%, #059669 100%)'
  const iconShadow = isReturnPhase
    ? '0 4px 12px rgba(217,119,6,0.28)'
    : '0 4px 12px rgba(16,185,129,0.28)'

  // ── return summary bar ────────────────────────────────────────────────
  const returnSummary = useMemo(() => {
    if (!isReturnPhase || !daily) return null
    const deliveries = daily.deliveries
    const total = deliveries.length
    const dispatched = deliveries.filter((d) =>
      ['RETURN_PICKUP', 'OUT_FOR_DELIVERY', 'DISPATCHED'].includes(d.status)
    ).length
    const pending = deliveries.filter((d) =>
      ['PROCESSED', 'PACKED', 'PENDING_RETURN', 'DELIVERED'].includes(d.status)
    ).length
    const completed = deliveries.filter((d) => d.status === 'COMPLETED').length
    return { total, dispatched, pending, completed }
  }, [isReturnPhase, daily])

  return (
    <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* -- FILTERS CARD -- */}
      <div style={card}>
        <div style={{ padding: '10px 12px' }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Filters</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Filter by warehouse &amp; site.</div>
          </div>
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

      {/* -- active dashboard filter pill -- */}
      {(phaseFromUrl || statusFromUrl) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px',
          background: isReturnPhase ? '#fffbeb' : '#f0fdf4',
          border: `1px solid ${isReturnPhase ? '#fde68a' : '#bbf7d0'}`,
          borderRadius: 10,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: isReturnPhase ? '#92400e' : '#065f46',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {isReturnPhase ? '↩ Return phase' : '📦 Delivery'}{activeFilterLabel ? ' ·' : ''}
            </span>
            {activeFilterLabel && !isReturnPhase && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '2px 10px', borderRadius: 20,
                fontSize: 11, fontWeight: 600,
                background: '#d1fae5', color: '#047857',
                border: '1px solid #a7f3d0',
              }}>
                {activeFilterLabel}
              </span>
            )}
            <span style={{ fontSize: 11, color: '#6b7280' }}>
              {isReturnPhase
                ? 'Showing all return deliveries for selected date.'
                : 'Showing filtered deliveries for selected date.'}
            </span>
          </div>
          <button
            onClick={clearDashboardFilters}
            style={{
              fontSize: 11, fontWeight: 600,
              color: isReturnPhase ? '#b45309' : '#059669',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px 6px', borderRadius: 6,
              textDecoration: 'underline',
            }}
          >
            Clear filter
          </button>
        </div>
      )}

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

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 12px 8px',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: iconGradient,
              boxShadow: iconShadow,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isReturnPhase ? <ReturnIcon /> : <CalendarIcon />}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', lineHeight: 1.2 }}>
                {isReturnPhase ? 'Return Calendar — ' : ''}{currentMonthLabel}
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
                {isReturnPhase ? 'Return delivery activity overview' : 'Delivery activity overview'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <div style={{
              border: `1px solid ${isReturnPhase ? '#fde68a' : '#bbf7d0'}`,
              borderRadius: 9,
              padding: '6px 12px',
              background: isReturnPhase ? '#fffbeb' : '#f0fdf4',
              display: 'flex', flexDirection: 'column', gap: 3, minWidth: 80,
            }}>
              <div style={{
                fontSize: 8, fontWeight: 700,
                color: isReturnPhase ? '#d97706' : '#10b981',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                {isReturnPhase ? 'Returns' : 'Deliveries'}
              </div>
              <div style={{
                fontSize: 20, fontWeight: 700,
                color: isReturnPhase ? '#92400e' : '#047857',
                lineHeight: 1, textAlign: 'center',
              }}>
                {loading ? '…' : monthTotal}
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

        {/* Calendar grid */}
        <div style={{ background: isReturnPhase ? '#fffbeb' : '#f0fdf4', overflow: 'hidden' }}>
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
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: isReturnPhase ? '#f59e0b' : '#10b981',
              flexShrink: 0,
            }} />
            Tap a date to view {isReturnPhase ? 'returns' : 'deliveries'} below; tap a row to open its details.
          </div>
          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>
            {isReturnPhase ? 'Return scheduling overview' : 'Live delivery scheduling overview'}
          </div>
        </div>
      </div>

      {/* ── RETURNS FOR SELECTED DATE (return phase) ── */}
      {isReturnPhase && selectedDate && (
        <div style={card}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 12px 10px',
            borderBottom: '1px solid #fde68a',
            flexWrap: 'wrap',
            gap: 8,
            background: '#fffbeb',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#92400e' }}>
                  ↩ Returns for {formatSelectedDate(selectedDate)}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 700,
                  background: '#fef9c3', color: '#b45309',
                  border: '1px solid #fde68a',
                }}>
                  Return phase
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#b45309', marginTop: 4 }}>
                {dailyLoading ? 'Loading…' : `${selectedDayTotal} ${selectedDayTotal === 1 ? 'return' : 'returns'} scheduled`}
              </div>
            </div>
            <Link
              to={`/reports?date=${encodeURIComponent(selectedDate)}&tab=daily${godownId ? `&godownId=${encodeURIComponent(godownId)}` : ''}${site ? `&site=${encodeURIComponent(site)}` : ''}&phase=return`}
              style={{ fontSize: 12, fontWeight: 600, color: '#d97706', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              Full report →
            </Link>
          </div>

          {/* Return summary bar */}
          {!dailyLoading && returnSummary && returnSummary.total > 0 && (
            <div style={{
              display: 'flex', gap: 0,
              borderBottom: '1px solid #fde68a',
            }}>
              {[
                { label: 'Total', value: returnSummary.total, color: '#92400e', bg: '#fef9c3' },
                { label: 'Out for pickup', value: returnSummary.dispatched, color: '#16a34a', bg: '#dcfce7' },
                { label: 'Pending', value: returnSummary.pending, color: '#b45309', bg: '#fffbeb' },
                { label: 'Completed', value: returnSummary.completed, color: '#475569', bg: '#f8fafc' },
              ].map((s, i, arr) => (
                <div key={s.label} style={{
                  flex: 1, padding: '10px 12px', textAlign: 'center',
                  background: s.bg,
                  borderRight: i < arr.length - 1 ? '1px solid #fde68a' : 'none',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {dailyError && (
            <div style={{
              margin: '10px 12px', padding: '10px 12px', borderRadius: 10,
              background: '#fef2f2', color: '#b91c1c', fontSize: 13, border: '1px solid #fecaca',
            }}>
              {dailyError}
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            {dailyLoading ? (
              <div style={{ padding: '28px 12px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
                Loading returns…
              </div>
            ) : daily?.deliveries.length ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                <thead>
                  <tr>
                    {['Delivery', 'Customer', 'Site', 'Godown', 'Status', 'Scheduled'].map((h) => (
                      <th key={h} style={{
                        padding: '10px 12px',
                        fontSize: 10, fontWeight: 700, color: '#b45309',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        textAlign: 'left', whiteSpace: 'nowrap',
                        background: '#fffbeb', borderBottom: '1px solid #fde68a',
                      }}>
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
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#fffbeb' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
                    >
                      <td style={{ padding: '12px', fontSize: 13, borderBottom: '1px solid #fef9c3' }}>
                        <span style={{ fontWeight: 600, color: '#d97706' }}>{d.deliveryNo}</span>
                        {d.selfDelivery && (
                          <span style={{
                            display: 'inline-block', marginLeft: 6,
                            padding: '1px 7px', borderRadius: 6,
                            fontSize: 10, fontWeight: 700,
                            background: '#eff6ff', color: '#2563eb',
                            border: '1px solid #bfdbfe',
                          }}>Self</span>
                        )}
                      </td>
                      <td style={{
                        padding: '12px', fontSize: 13, color: '#374151',
                        borderBottom: '1px solid #fef9c3',
                        maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {d.customerName}
                      </td>
                      <td style={{
                        padding: '12px', fontSize: 13, color: '#374151',
                        borderBottom: '1px solid #fef9c3',
                        maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {d.siteName || d.siteAddress || '—'}
                      </td>
                      <td style={{
                        padding: '12px', fontSize: 13, color: '#374151',
                        borderBottom: '1px solid #fef9c3',
                        maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {d.godownName || '—'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #fef9c3' }}>
                        <span style={{
                          ...returnStatusStyle(d.status),
                          fontSize: 10, fontWeight: 600,
                          padding: '3px 9px', borderRadius: 20,
                          whiteSpace: 'nowrap', display: 'inline-block',
                        }}>
                          {deliveryStatusLabel(d.status)}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px', fontSize: 13, color: '#64748b',
                        borderBottom: '1px solid #fef9c3', whiteSpace: 'nowrap',
                      }}>
                        {formatDateTime(d.deliveryAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : !dailyError ? (
              <div style={{ padding: '32px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>↩</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>No returns found</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  No return deliveries scheduled for this date.
                </div>
                {phaseFromUrl && (
                  <button
                    onClick={clearDashboardFilters}
                    style={{
                      marginTop: 10, fontSize: 12, fontWeight: 600,
                      color: '#d97706', background: 'none', border: 'none',
                      cursor: 'pointer', textDecoration: 'underline',
                    }}
                  >
                    Clear filter to see all deliveries
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── DELIVERIES FOR SELECTED DATE (forward / normal phase) ── */}
      {!isReturnPhase && selectedDate && (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Deliveries for {formatSelectedDate(selectedDate)}
                </div>
                {activeFilterLabel && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '2px 10px', borderRadius: 20,
                    fontSize: 11, fontWeight: 600,
                    background: '#d1fae5', color: '#047857',
                    border: '1px solid #a7f3d0',
                  }}>
                    {activeFilterLabel}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                {dailyLoading
                  ? 'Loading…'
                  : `${selectedDayTotal} ${selectedDayTotal === 1 ? 'delivery' : 'deliveries'}`}
              </div>
            </div>
            <Link
              to={`/reports?date=${encodeURIComponent(selectedDate)}&tab=daily${godownId ? `&godownId=${encodeURIComponent(godownId)}` : ''}${site ? `&site=${encodeURIComponent(site)}` : ''}${statusFromUrl ? `&status=${encodeURIComponent(statusFromUrl)}` : ''}`}
              style={{ fontSize: 12, fontWeight: 600, color: '#059669', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              Full report →
            </Link>
          </div>

          {dailyError && (
            <div style={{
              margin: '10px 12px', padding: '10px 12px', borderRadius: 10,
              background: '#fef2f2', color: '#b91c1c', fontSize: 13, border: '1px solid #fecaca',
            }}>
              {dailyError}
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            {dailyLoading ? (
              <div style={{ padding: '28px 12px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
                Loading deliveries…
              </div>
            ) : daily?.deliveries.length ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr>
                    {['Delivery', 'Customer', 'Site', 'Godown', 'Status', 'Scheduled'].map((h) => (
                      <th key={h} style={{
                        padding: '10px 12px',
                        fontSize: 10, fontWeight: 700, color: '#94a3b8',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        textAlign: 'left', whiteSpace: 'nowrap',
                        background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
                      }}>
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
                        <span style={{ fontWeight: 600, color: '#059669' }}>{d.deliveryNo}</span>
                        {d?.selfDelivery && (
                          <span style={{
                            display: 'inline-block', marginLeft: 6,
                            padding: '1px 7px', borderRadius: 6,
                            fontSize: 10, fontWeight: 700,
                            background: '#eff6ff', color: '#2563eb',
                            border: '1px solid #bfdbfe',
                          }}>Self</span>
                        )}
                      </td>
                      <td style={{
                        padding: '12px', fontSize: 13, color: '#374151',
                        borderBottom: '1px solid #f1f5f9',
                        maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {d.customerName}
                      </td>
                      <td style={{
                        padding: '12px', fontSize: 13, color: '#374151',
                        borderBottom: '1px solid #f1f5f9',
                        maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {d.siteName || d.siteAddress || '—'}
                      </td>
                      <td style={{
                        padding: '12px', fontSize: 13, color: '#374151',
                        borderBottom: '1px solid #f1f5f9',
                        maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {d.godownName || '—'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                        <Badge variant={deliveryBadgeVariant(d.status)}>
                          {deliveryStatusLabel(d.status)}
                        </Badge>
                      </td>
                      <td style={{
                        padding: '12px', fontSize: 13, color: '#64748b',
                        borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap',
                      }}>
                        {formatDateTime(d.deliveryAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : !dailyError ? (
              <div style={{ padding: '32px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>📦</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>No deliveries found</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  No deliveries scheduled for this date
                  {activeFilterLabel ? ` with filter "${activeFilterLabel}"` : ''}.
                </div>
                {statusFromUrl && (
                  <button
                    onClick={clearDashboardFilters}
                    style={{
                      marginTop: 10, fontSize: 12, fontWeight: 600,
                      color: '#059669', background: 'none', border: 'none',
                      cursor: 'pointer', textDecoration: 'underline',
                    }}
                  >
                    Clear filter to see all
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}