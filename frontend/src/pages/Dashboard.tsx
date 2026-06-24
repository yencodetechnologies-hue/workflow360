// import { useMemo, useState } from 'react'
// import { Link, Navigate, useNavigate } from 'react-router-dom'
// import { useAuth } from '../auth/store'
// import { formatDateTime, formatNumber } from '../lib/format'
// import { useDashboardData } from '../hooks/useDashboardData'
// import { CreateDeliveryModal } from './Deliveries/CreateDeliveryModal'
// import { StatCard } from '../components/ui/StatCard'

// // ── helpers ────────────────────────────────────────────────────────────────

// function badgeStyle(status: string): React.CSSProperties {
//   if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED')
//     return { background: '#dcfce7', color: '#16a34a' }
//   if (status === 'PROCESSED' || status === 'UPCOMING')
//     return { background: '#d1fae5', color: '#047857' }
//   if (status === 'PACKED') return { background: '#f1f5f9', color: '#475569' }
//   if (status === 'RETURN_PICKUP' || status === 'PENDING_RETURN' || status === 'DELIVERED')
//     return { background: '#fef9c3', color: '#b45309' }
//   if (status === 'COMPLETED') return { background: '#f1f5f9', color: '#475569' }
//   if (status === 'CANCELLED') return { background: '#fee2e2', color: '#dc2626' }
//   if (status === 'RETURNED') return { background: '#fee2e2', color: '#dc2626' }
//   if (status === 'PENDING') return { background: '#fef9c3', color: '#b45309' }
//   return { background: '#f1f5f9', color: '#475569' }
// }

// function statusLabel(status: string) {
//   const map: Record<string, string> = {
//     PROCESSED: 'Processed', PACKED: 'Packed', OUT_FOR_DELIVERY: 'Out for delivery',
//     RETURN_PICKUP: 'Return pickup', UPCOMING: 'Upcoming', DISPATCHED: 'Dispatched',
//     DELIVERED: 'Delivered', PENDING_RETURN: 'Pending return', COMPLETED: 'Completed',
//     CANCELLED: 'Cancelled', RETURNED: 'Returned', PENDING: 'Pending',
//   }
//   return map[status] ?? status
// }

// function dotColor(index: number) {
//   const colors = ['#10b981', '#059669', '#22c55e', '#047857', '#34d399', '#14b8a6']
//   return colors[index % colors.length]
// }

// function progressColor(index: number) {
//   const colors = ['#10b981', '#059669', '#22c55e', '#047857', '#34d399', '#14b8a6']
//   return colors[index % colors.length]
// }

// function deliveryDotColor(status: string) {
//   if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return '#22c55e'
//   if (status === 'PROCESSED' || status === 'UPCOMING') return '#10b981'
//   if (status === 'PENDING_RETURN' || status === 'DELIVERED' || status === 'PENDING') return '#f59e0b'
//   if (status === 'COMPLETED') return '#94a3b8'
//   if (status === 'CANCELLED' || status === 'RETURNED') return '#ef4444'
//   return '#10b981'
// }

// // ── skeleton ───────────────────────────────────────────────────────────────

// function Skel({ w, h, radius = 8 }: { w: string | number; h: string | number; radius?: number }) {
//   return (
//     <div style={{
//       width: w, height: h, borderRadius: radius,
//       background: '#dde3ed',
//       animation: 'pulse 1.5s ease-in-out infinite',
//     }} />
//   )
// }

// // ── bar chart ──────────────────────────────────────────────────────────────

// function BarChart({ values, labels, peakIndex }: { values: number[]; labels: string[]; peakIndex: number }) {
//   const max = Math.max(...values, 1)
//   const BAR_AREA_H = 100 // px
//   return (
//     <div style={{ width: '100%', paddingTop: 20 }}>
//       {/* bar area */}
//       <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: BAR_AREA_H }}>
//         {values.map((v, i) => {
//           const pct = (v / max) * 100
//           const barH = Math.max((pct / 100) * BAR_AREA_H, 5)
//           const isPeak = i === peakIndex
//           const isToday = i === values.length - 1
//           return (
//             <div key={i} title={`${labels[i]}: ${v} deliveries`}
//               style={{ flex: 1, position: 'relative', height: barH }}>
//               {/* bar */}
//               <div style={{
//                 width: '100%', height: '100%',
//                 background: isToday
//                   ? 'linear-gradient(to top, #059669, #34d399)'
//                   : isPeak ? '#10b981' : '#d1fae5',
//                 borderRadius: '4px 4px 0 0',
//                 transition: 'height 0.4s ease',
//                 boxShadow: isPeak ? '0 2px 8px rgba(16,185,129,0.25)' : 'none',
//               }} />
//               {/* count pinned above bar */}
//               {v > 0 && (
//                 <span style={{
//                   position: 'absolute', bottom: '100%', left: '50%',
//                   transform: 'translateX(-50%)',
//                   marginBottom: 3,
//                   fontSize: 11, fontWeight: 700, lineHeight: 1,
//                   color: isPeak || isToday ? '#059669' : '#475569',
//                   whiteSpace: 'nowrap',
//                 }}>{v}</span>
//               )}
//             </div>
//           )
//         })}
//       </div>
//       {/* day labels */}
//       <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
//         {labels.map((lbl, i) => {
//           const isPeak = i === peakIndex
//           const isToday = i === values.length - 1
//           return (
//             <span key={i} style={{
//               flex: 1, textAlign: 'center', fontSize: 11,
//               color: isPeak ? '#059669' : isToday ? '#374151' : '#94a3b8',
//               fontWeight: isPeak || isToday ? 700 : 400,
//               whiteSpace: 'nowrap',
//             }}>{lbl}</span>
//           )
//         })}
//       </div>
//     </div>
//   )
// }

// // ── donut chart ────────────────────────────────────────────────────────────

// function DonutChart({ segments, total }: { segments: { value: number; color: string }[]; total: number }) {
//   const size = 84, r = 29, cx = 42, cy = 42
//   const circ = 2 * Math.PI * r
//   const tot = segments.reduce((a, s) => a + s.value, 0) || 1
//   let offset = 0
//   const arcs = segments.map((s) => {
//     const dash = (s.value / tot) * circ
//     const arc = { dash, offset, color: s.color }
//     offset += dash
//     return arc
//   })
//   return (
//     <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
//       <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
//         <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={12} />
//         {arcs.map((a, i) => (
//           <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth={12}
//             strokeDasharray={`${a.dash} ${circ - a.dash}`} strokeDashoffset={-a.offset} />
//         ))}
//       </svg>
//       <div style={{
//         position: 'absolute', inset: 0,
//         display: 'flex', alignItems: 'center', justifyContent: 'center',
//         fontSize: 14, fontWeight: 700, color: '#fff',
//       }}>{total}</div>
//     </div>
//   )
// }

// // ── main ───────────────────────────────────────────────────────────────────

// export function DashboardPage() {
//   const auth = useAuth()
//   const nav = useNavigate()
//   const { loading, error, refresh, kpis, returnKpis, trend, godownsWithStock, recentActivity, alerts } = useDashboardData()
//   const [createOpen, setCreateOpen] = useState(false)

//   if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY')
//     return <Navigate to="/deliveries" replace />

//   const trendValues = useMemo(() => trend.map((t) => t.total), [trend])
//   const trendLabels = useMemo(() => trend.map((t) => t.label), [trend])
//   const trendTotal  = useMemo(() => trendValues.reduce((a, b) => a + b, 0), [trendValues])
//   const peakIndex   = useMemo(() => trendValues.length ? trendValues.indexOf(Math.max(...trendValues)) : 0, [trendValues])

//   const yesterdayTotal = trendValues.length >= 2 ? trendValues[trendValues.length - 2]! : 0
//   const todayDelta = yesterdayTotal > 0
//     ? `${kpis.today >= yesterdayTotal ? '+' : ''}${kpis.today - yesterdayTotal} vs yesterday`
//     : '— No change from yesterday'

//   const donutSegments = [
//     { value: kpis.running, color: '#34d399' },           // pending + dispatched combined
//     { value: kpis.byStatus.pendingReturn, color: '#fbbf24' },
//     { value: kpis.byStatus.completed, color: 'rgba(255,255,255,0.22)' },
//   ]
//   const donutTotal = kpis.running + kpis.byStatus.pendingReturn + kpis.byStatus.completed
//   const maxStock = Math.max(...godownsWithStock.map((g) => g.stockQty), 1)

//   // ── style tokens ──────────────────────────────────────────────────────

//   const card: React.CSSProperties = {
//     background: '#ffffff',
//     border: '1px solid #e4e7f0',
//     borderRadius: 14,
//     padding: '18px 20px',
//   }

//   const darkCard: React.CSSProperties = {
//     background: '#065f46',
//     borderRadius: 14,
//     padding: '18px 20px',
//   }

//   const sectionTitle: React.CSSProperties = {
//     fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0,
//   }

//   const sectionTitleLight: React.CSSProperties = {
//     fontSize: 14, fontWeight: 700, color: '#ffffff', margin: 0,
//   }

//   const pill = (text: string, extra?: React.CSSProperties) => (
//     <span style={{
//       fontSize: 11, fontWeight: 500, padding: '3px 10px',
//       borderRadius: 20, background: '#f1f5f9', color: '#64748b',
//       border: '1px solid #e4e7f0', ...extra,
//     }}>{text}</span>
//   )

//   // ── render ────────────────────────────────────────────────────────────

//   return (
//     /*
//       padding: '16px 20px 24px' — page owns its own spacing.
//       No extra margin. Fills the full content area provided by AppShell.
//     */
//     <div style={{
//       width: '100%',
//       minHeight: '100%',
//       background: '#edf0f8',
//       padding: '12px 12px 24px',
//       boxSizing: 'border-box',
//       display: 'flex',
//       flexDirection: 'column',
//       gap: 12,
//       fontFamily: 'inherit',
//     }}
//     className="mobile-pb"
//     >

//       {/* ── header row ── */}
//       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
//         <div>
//           <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>Dashboard</h1>
//           <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, marginBottom: 0 }}>
//             Live operations overview — deliveries, stock, returns, and alerts.
//           </p>
//         </div>
//         <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
//           <button onClick={() => void refresh()} disabled={loading} style={{
//             display: 'flex', alignItems: 'center', gap: 6,
//             padding: '8px 16px', borderRadius: 10,
//             border: '1px solid #e2e8f0', background: '#fff',
//             fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
//           }}>
//             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
//               <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
//               <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
//             </svg>
//             {loading ? 'Refreshing…' : 'Refresh'}
//           </button>
//           <button onClick={() => nav('/godowns')} style={{
//             display: 'flex', alignItems: 'center', gap: 6,
//             padding: '8px 16px', borderRadius: 10,
//             border: '1px solid #e2e8f0', background: '#fff',
//             fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
//           }}>
//             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//               <rect x="2" y="7" width="20" height="14" rx="2" />
//               <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
//             </svg>
//             Godowns
//           </button>
//           <button onClick={() => setCreateOpen(true)} style={{
//             display: 'flex', alignItems: 'center', gap: 6,
//             padding: '8px 18px', borderRadius: 10,
//             border: 'none', background: '#059669',
//             fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
//           }}>
//             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
//               <path d="M12 5v14M5 12h14" />
//             </svg>
//              Create Delivery
//           </button>
//         </div>
//       </div>

//       {/* ── error ── */}
//       {error && (
//         <div style={{
//           padding: '10px 16px', borderRadius: 10,
//           background: '#fef2f2', color: '#b91c1c', fontSize: 13,
//           display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//           border: '1px solid #fecaca',
//         }}>
//           <span>{error}</span>
//           <button onClick={() => void refresh()} style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
//         </div>
//       )}

//       {/* ── 4 stat cards ── */}
//       <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
//         {loading ? (
//           Array.from({ length: 4 }).map((_, i) => (
//             <div key={i} style={{ ...card, minHeight: 158, display: 'flex', flexDirection: 'column', gap: 10 }}>
//               <Skel w={40} h={40} radius={10} />
//               <Skel w="60%" h={12} />
//               <Skel w="40%" h={30} />
//               <Skel w="70%" h={10} />
//             </div>
//           ))
//         ) : (
//           <>
//             <StatCard tone="neutral" label="All deliveries" value={String(kpis.today)} delta={todayDelta}
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 4v4h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>}
//             />
//             <StatCard tone="good" label="Pending / Dispatched" value={String(kpis.running)} delta="Processed + out for delivery"
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>}
//             />
//             <StatCard tone="warn" label="Pending returns" value={String(kpis.pendingReturn)} delta="Delivered + awaiting return"
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
//             />
//             <StatCard tone="good" label="Completed" value={String(kpis.completed)} delta={`↗ This week: ${trendTotal} total`}
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
//             />
//           </>
//         )}
//       </div>

//       {/* ── return dashboard heading ── */}
//       <div>
//         <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '4px 0 0' }}>Return dashboard</h2>
//         <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, marginBottom: 0 }}>
//           Today's returns — pickups, dispatches, pending and completed.
//         </p>
//       </div>

//       {/* ── return dashboard: 4 stat cards ── */}
//       <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
//         {loading ? (
//           Array.from({ length: 4 }).map((_, i) => (
//             <div key={i} style={{ ...card, minHeight: 158, display: 'flex', flexDirection: 'column', gap: 10 }}>
//               <Skel w={40} h={40} radius={10} />
//               <Skel w="60%" h={12} />
//               <Skel w="40%" h={30} />
//               <Skel w="70%" h={10} />
//             </div>
//           ))
//         ) : (
//           <>
//             <StatCard tone="neutral" label="Return delivery" value={String(returnKpis.returnDelivery)} delta="Returns scheduled today"
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 4v4h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>}
//             />
//             <StatCard tone="good" label="Return dispatch" value={String(returnKpis.returnDispatch)} delta="Out for return pickup"
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>}
//             />
//             <StatCard tone="warn" label="Returns pending" value={String(returnKpis.returnsPending)} delta="Awaiting pickup / return"
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
//             />
//             <StatCard tone="good" label="Returns completed" value={String(returnKpis.returnsCompleted)} delta="Completed today"
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
//             />
//           </>
//         )}
//       </div>

//       {/* ── trend + delivery status ── */}
//       <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr]" style={{ gap: 12 }}>
//         <div style={card}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
//             <h2 style={sectionTitle}>Daily delivery trend</h2>
//             {pill('Last 7 days')}
//           </div>
//           <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
//             This week total: <span style={{ fontWeight: 700, color: '#059669' }}>{trendTotal}</span>
//             {'   '}Peak day: <span style={{ fontWeight: 700, color: '#059669' }}>
//               {trend[peakIndex]?.label ?? '—'} ({trend[peakIndex]?.total ?? 0})
//             </span>
//           </div>
//           {loading
//             ? <Skel w="100%" h={115} />
//             : <BarChart
//                 values={trendValues.length ? trendValues : [0,0,0,0,0,0,0]}
//                 labels={trendLabels.length ? trendLabels : ['Thu','Fri','Sat','Sun','Mon','Tue','Wed']}
//                 peakIndex={peakIndex}
//               />}
//         </div>

//         <div style={darkCard}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
//             <h2 style={sectionTitleLight}>Delivery status</h2>
//             <span style={{
//               fontSize: 11, fontWeight: 600, padding: '3px 10px',
//               borderRadius: 20, background: 'rgba(255,255,255,0.18)', color: '#fff',
//             }}>Today</span>
//           </div>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
//             {loading
//               ? <Skel w={84} h={84} radius={42} />
//               : <DonutChart segments={donutSegments} total={donutTotal} />}
//             <div style={{ flex: 1 }}>
//               {[
//                 { label: 'Pending / Dispatched', value: kpis.running },
//                 { label: 'Pending return', value: kpis.byStatus.pendingReturn },
//                 { label: 'Completed', value: kpis.byStatus.completed },
//               ].map((row) => (
//                 <div key={row.label} style={{
//                   display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                   fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 9,
//                 }}>
//                   <span>{row.label}</span>
//                   <span style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>{row.value}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ── bottom 3 cards ── */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 12 }}>

//         {/* godown stock */}
//         <div style={card}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
//             <h2 style={sectionTitle}>Godown stock overview</h2>
//             <button onClick={() => nav('/godowns')} style={{
//               fontSize: 12, fontWeight: 600, color: '#059669',
//               background: 'none', border: 'none', cursor: 'pointer', padding: 0,
//             }}>View all</button>
//           </div>
//           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
//             {loading
//               ? Array.from({ length: 4 }).map((_, i) => <Skel key={i} w="100%" h={34} />)
//               : godownsWithStock.length === 0
//                 ? <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No godowns configured yet.</p>
//                 : godownsWithStock.slice(0, 6).map((g, index) => (
//                     <Link key={g.id} to={`/godowns/${g.id}`} style={{ textDecoration: 'none' }}>
//                       <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
//                         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                           <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor(index), flexShrink: 0, marginTop: 2 }} />
//                           <div>
//                             <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{g.name}</div>
//                             <div style={{ fontSize: 11, color: '#94a3b8' }}>{g.city || '—'} · Manager: {g.manager || '—'}</div>
//                           </div>
//                         </div>
//                         <div style={{ textAlign: 'right', flexShrink: 0 }}>
//                           <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{formatNumber(g.stockQty)}</div>
//                           <div style={{ fontSize: 10, color: '#94a3b8' }}>units</div>
//                         </div>
//                       </div>
//                       <div style={{ marginTop: 5, marginLeft: 16, height: 3, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
//                         <div style={{ height: '100%', width: `${(g.stockQty / maxStock) * 100}%`, background: progressColor(index), borderRadius: 99 }} />
//                       </div>
//                     </Link>
//                   ))
//             }
//           </div>
//         </div>

//         {/* recent deliveries */}
//         <div style={card}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
//             <h2 style={sectionTitle}>Recent deliveries</h2>
//             {pill('Latest', { background: '#d1fae5', color: '#047857', border: 'none' })}
//           </div>
//           <div style={{ display: 'flex', flexDirection: 'column' }}>
//             {loading
//               ? Array.from({ length: 4 }).map((_, i) => <Skel key={i} w="100%" h={50} radius={8} />)
//               : recentActivity.length === 0
//                 ? <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No recent deliveries.</p>
//                 : recentActivity.map((a) => (
//                     <Link key={a.id} to={`/deliveries/${a.id}`} style={{
//                       textDecoration: 'none', display: 'block',
//                       padding: '9px 0', borderBottom: '1px solid #f1f5f9',
//                     }}>
//                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
//                         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                           <div style={{ width: 7, height: 7, borderRadius: '50%', background: deliveryDotColor(a.status), flexShrink: 0 }} />
//                           <div>
//                             <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.deliveryNo}</div>
//                             <div style={{ fontSize: 11, color: '#64748b' }}>{a.customerName}</div>
//                             <div style={{ fontSize: 10, color: '#94a3b8' }}>{formatDateTime(a.deliveryAt)}</div>
//                           </div>
//                         </div>
//                         <span style={{ ...badgeStyle(a.status), fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>
//                           {statusLabel(a.status)}
//                         </span>
//                       </div>
//                     </Link>
//                   ))
//             }
//           </div>
//         </div>

//         {/* alerts */}
//         <div style={darkCard}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
//             <h2 style={sectionTitleLight}>Alerts</h2>
//             <span style={{
//               fontSize: 11, fontWeight: 600, padding: '3px 10px',
//               borderRadius: 20, background: 'rgba(255,255,255,0.18)', color: '#fff',
//             }}>
//               {alerts.length ? `${alerts.length} active` : 'All clear'}
//             </span>
//           </div>

//           {alerts.length === 0 ? (
//             <div style={{ textAlign: 'center', padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
//               <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
//                 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
//               </svg>
//               <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>All clear</div>
//               <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>No issues need attention right now.</div>
//             </div>
//           ) : (
//             <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
//               {alerts.map((alert) => (
//                 <Link key={alert.id} to={alert.href} style={{
//                   textDecoration: 'none', display: 'block',
//                   padding: '9px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.1)',
//                 }}>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{alert.title}</div>
//                     <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.2)', color: '#fff' }}>{alert.count}</span>
//                   </div>
//                   <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{alert.description}</div>
//                 </Link>
//               ))}
//             </div>
//           )}

//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
//             <button onClick={() => nav('/products')} style={{
//               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
//               padding: '8px 0', borderRadius: 9,
//               border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)',
//               fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer',
//             }}>
//               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
//                 <line x1="3" y1="6" x2="21" y2="6" />
//                 <path d="M16 10a4 4 0 01-8 0" />
//               </svg>
//               Products
//             </button>
//             <button onClick={() => setCreateOpen(true)} style={{
//               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
//               padding: '8px 0', borderRadius: 9,
//               border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)',
//               fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer',
//             }}>
//               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
//                 <path d="M12 5v14M5 12h14" />
//               </svg>
//               New delivery
//             </button>
//           </div>
//         </div>
//       </div>

//       <CreateDeliveryModal
//         open={createOpen}
//         onClose={() => setCreateOpen(false)}
//         onCreated={() => { setCreateOpen(false); void refresh() }}
//       />
//     </div>
//   )
// }
// import { useMemo, useState } from 'react'
// import { Link, Navigate, useNavigate } from 'react-router-dom'
// import { useAuth } from '../auth/store'
// import { formatDateTime, formatNumber } from '../lib/format'
// import { useDashboardData } from '../hooks/useDashboardData'
// import { CreateDeliveryModal } from './Deliveries/CreateDeliveryModal'
// import { StatCard } from '../components/ui/StatCard'

// // ── helpers ────────────────────────────────────────────────────────────────

// function badgeStyle(status: string): React.CSSProperties {
//   if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED')
//     return { background: '#dcfce7', color: '#16a34a' }
//   if (status === 'PROCESSED' || status === 'UPCOMING')
//     return { background: '#d1fae5', color: '#047857' }
//   if (status === 'PACKED') return { background: '#f1f5f9', color: '#475569' }
//   if (status === 'RETURN_PICKUP' || status === 'PENDING_RETURN' || status === 'DELIVERED')
//     return { background: '#fef9c3', color: '#b45309' }
//   if (status === 'COMPLETED') return { background: '#f1f5f9', color: '#475569' }
//   if (status === 'CANCELLED') return { background: '#fee2e2', color: '#dc2626' }
//   if (status === 'RETURNED') return { background: '#fee2e2', color: '#dc2626' }
//   if (status === 'PENDING') return { background: '#fef9c3', color: '#b45309' }
//   return { background: '#f1f5f9', color: '#475569' }
// }

// function statusLabel(status: string) {
//   const map: Record<string, string> = {
//     PROCESSED: 'Processed', PACKED: 'Packed', OUT_FOR_DELIVERY: 'Out for delivery',
//     RETURN_PICKUP: 'Return pickup', UPCOMING: 'Upcoming', DISPATCHED: 'Dispatched',
//     DELIVERED: 'Delivered', PENDING_RETURN: 'Pending return', COMPLETED: 'Completed',
//     CANCELLED: 'Cancelled', RETURNED: 'Returned', PENDING: 'Pending',
//   }
//   return map[status] ?? status
// }

// function dotColor(index: number) {
//   const colors = ['#10b981', '#059669', '#22c55e', '#047857', '#34d399', '#14b8a6']
//   return colors[index % colors.length]
// }

// function progressColor(index: number) {
//   const colors = ['#10b981', '#059669', '#22c55e', '#047857', '#34d399', '#14b8a6']
//   return colors[index % colors.length]
// }

// function deliveryDotColor(status: string) {
//   if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return '#22c55e'
//   if (status === 'PROCESSED' || status === 'UPCOMING') return '#10b981'
//   if (status === 'PENDING_RETURN' || status === 'DELIVERED' || status === 'PENDING') return '#f59e0b'
//   if (status === 'COMPLETED') return '#94a3b8'
//   if (status === 'CANCELLED' || status === 'RETURNED') return '#ef4444'
//   return '#10b981'
// }

// // ── skeleton ───────────────────────────────────────────────────────────────

// function Skel({ w, h, radius = 8 }: { w: string | number; h: string | number; radius?: number }) {
//   return (
//     <div style={{
//       width: w, height: h, borderRadius: radius,
//       background: '#dde3ed',
//       animation: 'pulse 1.5s ease-in-out infinite',
//     }} />
//   )
// }

// // ── bar chart ──────────────────────────────────────────────────────────────

// function BarChart({ values, labels, peakIndex }: { values: number[]; labels: string[]; peakIndex: number }) {
//   const max = Math.max(...values, 1)
//   const BAR_AREA_H = 100 // px
//   return (
//     <div style={{ width: '100%', paddingTop: 20 }}>
//       {/* bar area */}
//       <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: BAR_AREA_H }}>
//         {values.map((v, i) => {
//           const pct = (v / max) * 100
//           const barH = Math.max((pct / 100) * BAR_AREA_H, 5)
//           const isPeak = i === peakIndex
//           const isToday = i === values.length - 1
//           return (
//             <div key={i} title={`${labels[i]}: ${v} deliveries`}
//               style={{ flex: 1, position: 'relative', height: barH }}>
//               {/* bar */}
//               <div style={{
//                 width: '100%', height: '100%',
//                 background: isToday
//                   ? 'linear-gradient(to top, #059669, #34d399)'
//                   : isPeak ? '#10b981' : '#d1fae5',
//                 borderRadius: '4px 4px 0 0',
//                 transition: 'height 0.4s ease',
//                 boxShadow: isPeak ? '0 2px 8px rgba(16,185,129,0.25)' : 'none',
//               }} />
//               {/* count pinned above bar */}
//               {v > 0 && (
//                 <span style={{
//                   position: 'absolute', bottom: '100%', left: '50%',
//                   transform: 'translateX(-50%)',
//                   marginBottom: 3,
//                   fontSize: 11, fontWeight: 700, lineHeight: 1,
//                   color: isPeak || isToday ? '#059669' : '#475569',
//                   whiteSpace: 'nowrap',
//                 }}>{v}</span>
//               )}
//             </div>
//           )
//         })}
//       </div>
//       {/* day labels */}
//       <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
//         {labels.map((lbl, i) => {
//           const isPeak = i === peakIndex
//           const isToday = i === values.length - 1
//           return (
//             <span key={i} style={{
//               flex: 1, textAlign: 'center', fontSize: 11,
//               color: isPeak ? '#059669' : isToday ? '#374151' : '#94a3b8',
//               fontWeight: isPeak || isToday ? 700 : 400,
//               whiteSpace: 'nowrap',
//             }}>{lbl}</span>
//           )
//         })}
//       </div>
//     </div>
//   )
// }

// // ── donut chart ────────────────────────────────────────────────────────────

// function DonutChart({ segments, total }: { segments: { value: number; color: string }[]; total: number }) {
//   const size = 84, r = 29, cx = 42, cy = 42
//   const circ = 2 * Math.PI * r
//   const tot = segments.reduce((a, s) => a + s.value, 0) || 1
//   let offset = 0
//   const arcs = segments.map((s) => {
//     const dash = (s.value / tot) * circ
//     const arc = { dash, offset, color: s.color }
//     offset += dash
//     return arc
//   })
//   return (
//     <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
//       <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
//         <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={12} />
//         {arcs.map((a, i) => (
//           <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth={12}
//             strokeDasharray={`${a.dash} ${circ - a.dash}`} strokeDashoffset={-a.offset} />
//         ))}
//       </svg>
//       <div style={{
//         position: 'absolute', inset: 0,
//         display: 'flex', alignItems: 'center', justifyContent: 'center',
//         fontSize: 14, fontWeight: 700, color: '#fff',
//       }}>{total}</div>
//     </div>
//   )
// }

// // ── main ───────────────────────────────────────────────────────────────────

// export function DashboardPage() {
//   const auth = useAuth()
//   const nav = useNavigate()
//   const { loading, error, refresh, kpis, returnKpis, trend, godownsWithStock, recentActivity, alerts } = useDashboardData()
//   const [createOpen, setCreateOpen] = useState(false)

//   if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY')
//     return <Navigate to="/deliveries" replace />

//   const trendValues = useMemo(() => trend.map((t) => t.total), [trend])
//   const trendLabels = useMemo(() => trend.map((t) => t.label), [trend])
//   const trendTotal  = useMemo(() => trendValues.reduce((a, b) => a + b, 0), [trendValues])
//   const peakIndex   = useMemo(() => trendValues.length ? trendValues.indexOf(Math.max(...trendValues)) : 0, [trendValues])

//   const yesterdayTotal = trendValues.length >= 2 ? trendValues[trendValues.length - 2]! : 0
//   const todayDelta = yesterdayTotal > 0
//     ? `${kpis.today >= yesterdayTotal ? '+' : ''}${kpis.today - yesterdayTotal} vs yesterday`
//     : '— No change from yesterday'

//   const donutSegments = [
//     { value: kpis.running, color: '#34d399' },           // pending + dispatched combined
//     { value: kpis.byStatus.pendingReturn, color: '#fbbf24' },
//     { value: kpis.byStatus.completed, color: 'rgba(255,255,255,0.22)' },
//   ]
//   const donutTotal = kpis.running + kpis.byStatus.pendingReturn + kpis.byStatus.completed
//   const maxStock = Math.max(...godownsWithStock.map((g) => g.stockQty), 1)

//   // ── style tokens ──────────────────────────────────────────────────────

//   const card: React.CSSProperties = {
//     background: '#ffffff',
//     border: '1px solid #e4e7f0',
//     borderRadius: 14,
//     padding: '18px 20px',
//   }

//   const darkCard: React.CSSProperties = {
//     background: '#065f46',
//     borderRadius: 14,
//     padding: '18px 20px',
//   }

//   const sectionTitle: React.CSSProperties = {
//     fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0,
//   }

//   const sectionTitleLight: React.CSSProperties = {
//     fontSize: 14, fontWeight: 700, color: '#ffffff', margin: 0,
//   }

//   const pill = (text: string, extra?: React.CSSProperties) => (
//     <span style={{
//       fontSize: 11, fontWeight: 500, padding: '3px 10px',
//       borderRadius: 20, background: '#f1f5f9', color: '#64748b',
//       border: '1px solid #e4e7f0', ...extra,
//     }}>{text}</span>
//   )

//   // ── render ────────────────────────────────────────────────────────────

//   return (
//     /*
//       padding: '16px 20px 24px' — page owns its own spacing.
//       No extra margin. Fills the full content area provided by AppShell.
//     */
//     <div style={{
//       width: '100%',
//       minHeight: '100%',
//       background: '#edf0f8',
//       padding: '12px 12px 24px',
//       boxSizing: 'border-box',
//       display: 'flex',
//       flexDirection: 'column',
//       gap: 12,
//       fontFamily: 'inherit',
//     }}
//     className="mobile-pb"
//     >

//       {/* ── header row ── */}
//       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
//         <div>
//           <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>Dashboard</h1>
//           <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, marginBottom: 0 }}>
//             Live operations overview — deliveries, stock, returns, and alerts.
//           </p>
//         </div>
//         <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
//           <button onClick={() => void refresh()} disabled={loading} style={{
//             display: 'flex', alignItems: 'center', gap: 6,
//             padding: '8px 16px', borderRadius: 10,
//             border: '1px solid #e2e8f0', background: '#fff',
//             fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
//           }}>
//             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
//               <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
//               <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
//             </svg>
//             {loading ? 'Refreshing…' : 'Refresh'}
//           </button>
//           <button onClick={() => nav('/godowns')} style={{
//             display: 'flex', alignItems: 'center', gap: 6,
//             padding: '8px 16px', borderRadius: 10,
//             border: '1px solid #e2e8f0', background: '#fff',
//             fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
//           }}>
//             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//               <rect x="2" y="7" width="20" height="14" rx="2" />
//               <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
//             </svg>
//             Godowns
//           </button>
//           <button onClick={() => setCreateOpen(true)} style={{
//             display: 'flex', alignItems: 'center', gap: 6,
//             padding: '8px 18px', borderRadius: 10,
//             border: 'none', background: '#059669',
//             fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
//           }}>
//             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
//               <path d="M12 5v14M5 12h14" />
//             </svg>
//              Create Delivery
//           </button>
//         </div>
//       </div>

//       {/* ── error ── */}
//       {error && (
//         <div style={{
//           padding: '10px 16px', borderRadius: 10,
//           background: '#fef2f2', color: '#b91c1c', fontSize: 13,
//           display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//           border: '1px solid #fecaca',
//         }}>
//           <span>{error}</span>
//           <button onClick={() => void refresh()} style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
//         </div>
//       )}

//       {/* ── 4 stat cards ── */}
//       <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
//         {loading ? (
//           Array.from({ length: 4 }).map((_, i) => (
//             <div key={i} style={{ ...card, minHeight: 158, display: 'flex', flexDirection: 'column', gap: 10 }}>
//               <Skel w={40} h={40} radius={10} />
//               <Skel w="60%" h={12} />
//               <Skel w="40%" h={30} />
//               <Skel w="70%" h={10} />
//             </div>
//           ))
//         ) : (
//           <>
//             <StatCard tone="neutral" label="All deliveries" value={String(kpis.today)} delta={todayDelta}
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 4v4h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>}
//             />
//             <StatCard tone="good" label="Pending / Dispatched" value={String(kpis.running)} delta="Processed + out for delivery"
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>}
//             />
//             <StatCard tone="warn" label="Pending returns" value={String(kpis.pendingReturn)} delta="Delivered + awaiting return"
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
//             />
//             <StatCard tone="good" label="Completed" value={String(kpis.completed)} delta={`↗ This week: ${trendTotal} total`}
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
//             />
//           </>
//         )}
//       </div>

//       {/* ── return dashboard heading ── */}
//       <div>
//         <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '4px 0 0' }}>Return dashboard</h2>
//         <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, marginBottom: 0 }}>
//           Today's returns — pickups, dispatches, pending and completed.
//         </p>
//       </div>

//       {/* ── return dashboard: 4 stat cards ── */}
//       <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
//         {loading ? (
//           Array.from({ length: 4 }).map((_, i) => (
//             <div key={i} style={{ ...card, minHeight: 158, display: 'flex', flexDirection: 'column', gap: 10 }}>
//               <Skel w={40} h={40} radius={10} />
//               <Skel w="60%" h={12} />
//               <Skel w="40%" h={30} />
//               <Skel w="70%" h={10} />
//             </div>
//           ))
//         ) : (
//           <>
//             <StatCard tone="neutral" label="Return delivery" value={String(returnKpis.returnDelivery)} delta="Returns scheduled today"
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 4v4h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>}
//             />
//             <StatCard tone="good" label="Return dispatch" value={String(returnKpis.returnDispatch)} delta="Out for return pickup"
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>}
//             />
//             <StatCard tone="warn" label="Returns pending" value={String(returnKpis.returnsPending)} delta="Awaiting pickup / return"
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
//             />
//             <StatCard tone="good" label="Returns completed" value={String(returnKpis.returnsCompleted)} delta="Completed today"
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
//             />
//           </>
//         )}
//       </div>

//       {/* ── trend + delivery status ── */}
//       <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr]" style={{ gap: 12 }}>
//         <div style={card}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
//             <h2 style={sectionTitle}>Daily delivery trend</h2>
//             {pill('Last 7 days')}
//           </div>
//           <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
//             This week total: <span style={{ fontWeight: 700, color: '#059669' }}>{trendTotal}</span>
//             {'   '}Peak day: <span style={{ fontWeight: 700, color: '#059669' }}>
//               {trend[peakIndex]?.label ?? '—'} ({trend[peakIndex]?.total ?? 0})
//             </span>
//           </div>
//           {loading
//             ? <Skel w="100%" h={115} />
//             : <BarChart
//                 values={trendValues.length ? trendValues : [0,0,0,0,0,0,0]}
//                 labels={trendLabels.length ? trendLabels : ['Thu','Fri','Sat','Sun','Mon','Tue','Wed']}
//                 peakIndex={peakIndex}
//               />}
//         </div>

//         <div style={darkCard}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
//             <h2 style={sectionTitleLight}>Delivery status</h2>
//             <span style={{
//               fontSize: 11, fontWeight: 600, padding: '3px 10px',
//               borderRadius: 20, background: 'rgba(255,255,255,0.18)', color: '#fff',
//             }}>Today</span>
//           </div>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
//             {loading
//               ? <Skel w={84} h={84} radius={42} />
//               : <DonutChart segments={donutSegments} total={donutTotal} />}
//             <div style={{ flex: 1 }}>
//               {[
//                 { label: 'Pending / Dispatched', value: kpis.running },
//                 { label: 'Pending return', value: kpis.byStatus.pendingReturn },
//                 { label: 'Completed', value: kpis.byStatus.completed },
//               ].map((row) => (
//                 <div key={row.label} style={{
//                   display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                   fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 9,
//                 }}>
//                   <span>{row.label}</span>
//                   <span style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>{row.value}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ── bottom 3 cards ── */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 12 }}>

//         {/* godown stock */}
//         <div style={card}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
//             <h2 style={sectionTitle}>Godown stock overview</h2>
//             <button onClick={() => nav('/godowns')} style={{
//               fontSize: 12, fontWeight: 600, color: '#059669',
//               background: 'none', border: 'none', cursor: 'pointer', padding: 0,
//             }}>View all</button>
//           </div>
//           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
//             {loading
//               ? Array.from({ length: 4 }).map((_, i) => <Skel key={i} w="100%" h={34} />)
//               : godownsWithStock.length === 0
//                 ? <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No godowns configured yet.</p>
//                 : godownsWithStock.slice(0, 6).map((g, index) => (
//                     <Link key={g.id} to={`/godowns/${g.id}`} style={{ textDecoration: 'none' }}>
//                       <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
//                         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                           <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor(index), flexShrink: 0, marginTop: 2 }} />
//                           <div>
//                             <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{g.name}</div>
//                             <div style={{ fontSize: 11, color: '#94a3b8' }}>{g.city || '—'} · Manager: {g.manager || '—'}</div>
//                           </div>
//                         </div>
//                         <div style={{ textAlign: 'right', flexShrink: 0 }}>
//                           <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{formatNumber(g.stockQty)}</div>
//                           <div style={{ fontSize: 10, color: '#94a3b8' }}>units</div>
//                         </div>
//                       </div>
//                       <div style={{ marginTop: 5, marginLeft: 16, height: 3, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
//                         <div style={{ height: '100%', width: `${(g.stockQty / maxStock) * 100}%`, background: progressColor(index), borderRadius: 99 }} />
//                       </div>
//                     </Link>
//                   ))
//             }
//           </div>
//         </div>

//         {/* recent deliveries */}
//         <div style={card}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
//             <h2 style={sectionTitle}>Recent deliveries</h2>
//             {pill('Latest', { background: '#d1fae5', color: '#047857', border: 'none' })}
//           </div>
//           <div style={{ display: 'flex', flexDirection: 'column' }}>
//             {loading
//               ? Array.from({ length: 4 }).map((_, i) => <Skel key={i} w="100%" h={50} radius={8} />)
//               : recentActivity.length === 0
//                 ? <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No recent deliveries.</p>
//                 : recentActivity.map((a) => (
//                     <Link key={a.id} to={`/deliveries/${a.id}`} style={{
//                       textDecoration: 'none', display: 'block',
//                       padding: '9px 0', borderBottom: '1px solid #f1f5f9',
//                     }}>
//                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
//                         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                           <div style={{ width: 7, height: 7, borderRadius: '50%', background: deliveryDotColor(a.status), flexShrink: 0 }} />
//                           <div>
//                             <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.deliveryNo}</div>
//                             <div style={{ fontSize: 11, color: '#64748b' }}>{a.customerName}</div>
//                             <div style={{ fontSize: 10, color: '#94a3b8' }}>{formatDateTime(a.deliveryAt)}</div>
//                           </div>
//                         </div>
//                         <span style={{ ...badgeStyle(a.status), fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>
//                           {statusLabel(a.status)}
//                         </span>
//                       </div>
//                     </Link>
//                   ))
//             }
//           </div>
//         </div>

//         {/* alerts */}
//         <div style={darkCard}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
//             <h2 style={sectionTitleLight}>Alerts</h2>
//             <span style={{
//               fontSize: 11, fontWeight: 600, padding: '3px 10px',
//               borderRadius: 20, background: 'rgba(255,255,255,0.18)', color: '#fff',
//             }}>
//               {alerts.length ? `${alerts.length} active` : 'All clear'}
//             </span>
//           </div>

//           {alerts.length === 0 ? (
//             <div style={{ textAlign: 'center', padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
//               <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
//                 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
//               </svg>
//               <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>All clear</div>
//               <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>No issues need attention right now.</div>
//             </div>
//           ) : (
//             <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
//               {alerts.map((alert) => (
//                 <Link key={alert.id} to={alert.href} style={{
//                   textDecoration: 'none', display: 'block',
//                   padding: '9px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.1)',
//                 }}>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{alert.title}</div>
//                     <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.2)', color: '#fff' }}>{alert.count}</span>
//                   </div>
//                   <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{alert.description}</div>
//                 </Link>
//               ))}
//             </div>
//           )}

//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
//             <button onClick={() => nav('/products')} style={{
//               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
//               padding: '8px 0', borderRadius: 9,
//               border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)',
//               fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer',
//             }}>
//               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
//                 <line x1="3" y1="6" x2="21" y2="6" />
//                 <path d="M16 10a4 4 0 01-8 0" />
//               </svg>
//               Products
//             </button>
//             <button onClick={() => setCreateOpen(true)} style={{
//               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
//               padding: '8px 0', borderRadius: 9,
//               border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)',
//               fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer',
//             }}>
//               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
//                 <path d="M12 5v14M5 12h14" />
//               </svg>
//               New delivery
//             </button>
//           </div>
//         </div>
//       </div>

//       <CreateDeliveryModal
//         open={createOpen}
//         onClose={() => setCreateOpen(false)}
//         onCreated={() => { setCreateOpen(false); void refresh() }}
//       />
//     </div>
//   )
// }

import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/store'
import { formatDateTime, formatNumber } from '../lib/format'
import { useDashboardData } from '../hooks/useDashboardData'
import { CreateDeliveryModal } from './Deliveries/CreateDeliveryModal'
import { StatCard } from '../components/ui/StatCard'

// ── helpers ────────────────────────────────────────────────────────────────

function badgeStyle(status: string): React.CSSProperties {
  if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED')
    return { background: '#dcfce7', color: '#16a34a' }
  if (status === 'PROCESSED' || status === 'UPCOMING')
    return { background: '#d1fae5', color: '#047857' }
  if (status === 'PACKED') return { background: '#f1f5f9', color: '#475569' }
  if (status === 'RETURN_PICKUP' || status === 'PENDING_RETURN' || status === 'DELIVERED')
    return { background: '#fef9c3', color: '#b45309' }
  if (status === 'COMPLETED') return { background: '#f1f5f9', color: '#475569' }
  if (status === 'CANCELLED') return { background: '#fee2e2', color: '#dc2626' }
  if (status === 'RETURNED') return { background: '#fee2e2', color: '#dc2626' }
  if (status === 'PENDING') return { background: '#fef9c3', color: '#b45309' }
  return { background: '#f1f5f9', color: '#475569' }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PROCESSED: 'Processed', PACKED: 'Packed', OUT_FOR_DELIVERY: 'Out for delivery',
    RETURN_PICKUP: 'Return pickup', UPCOMING: 'Upcoming', DISPATCHED: 'Dispatched',
    DELIVERED: 'Delivered', PENDING_RETURN: 'Pending return', COMPLETED: 'Completed',
    CANCELLED: 'Cancelled', RETURNED: 'Returned', PENDING: 'Pending',
  }
  return map[status] ?? status
}

function dotColor(index: number) {
  const colors = ['#10b981', '#059669', '#22c55e', '#047857', '#34d399', '#14b8a6']
  return colors[index % colors.length]
}

function progressColor(index: number) {
  const colors = ['#10b981', '#059669', '#22c55e', '#047857', '#34d399', '#14b8a6']
  return colors[index % colors.length]
}

function deliveryDotColor(status: string) {
  if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return '#22c55e'
  if (status === 'PROCESSED' || status === 'UPCOMING') return '#10b981'
  if (status === 'PENDING_RETURN' || status === 'DELIVERED' || status === 'PENDING') return '#f59e0b'
  if (status === 'COMPLETED') return '#94a3b8'
  if (status === 'CANCELLED' || status === 'RETURNED') return '#ef4444'
  return '#10b981'
}

// ── skeleton ───────────────────────────────────────────────────────────────

function Skel({ w, h, radius = 8 }: { w: string | number; h: string | number; radius?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: '#dde3ed',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  )
}

// ── bar chart ──────────────────────────────────────────────────────────────

function BarChart({ values, labels, peakIndex }: { values: number[]; labels: string[]; peakIndex: number }) {
  const max = Math.max(...values, 1)
  const BAR_AREA_H = 100
  return (
    <div style={{ width: '100%', paddingTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: BAR_AREA_H }}>
        {values.map((v, i) => {
          const pct = (v / max) * 100
          const barH = Math.max((pct / 100) * BAR_AREA_H, 5)
          const isPeak = i === peakIndex
          const isToday = i === values.length - 1
          return (
            <div key={i} title={`${labels[i]}: ${v} deliveries`}
              style={{ flex: 1, position: 'relative', height: barH }}>
              <div style={{
                width: '100%', height: '100%',
                background: isToday
                  ? 'linear-gradient(to top, #059669, #34d399)'
                  : isPeak ? '#10b981' : '#d1fae5',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.4s ease',
                boxShadow: isPeak ? '0 2px 8px rgba(16,185,129,0.25)' : 'none',
              }} />
              {v > 0 && (
                <span style={{
                  position: 'absolute', bottom: '100%', left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: 3,
                  fontSize: 11, fontWeight: 700, lineHeight: 1,
                  color: isPeak || isToday ? '#059669' : '#475569',
                  whiteSpace: 'nowrap',
                }}>{v}</span>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {labels.map((lbl, i) => {
          const isPeak = i === peakIndex
          const isToday = i === values.length - 1
          return (
            <span key={i} style={{
              flex: 1, textAlign: 'center', fontSize: 11,
              color: isPeak ? '#059669' : isToday ? '#374151' : '#94a3b8',
              fontWeight: isPeak || isToday ? 700 : 400,
              whiteSpace: 'nowrap',
            }}>{lbl}</span>
          )
        })}
      </div>
    </div>
  )
}

// ── donut chart ────────────────────────────────────────────────────────────

function DonutChart({ segments, total }: { segments: { value: number; color: string }[]; total: number }) {
  const size = 84, r = 29, cx = 42, cy = 42
  const circ = 2 * Math.PI * r
  const tot = segments.reduce((a, s) => a + s.value, 0) || 1
  let offset = 0
  const arcs = segments.map((s) => {
    const dash = (s.value / tot) * circ
    const arc = { dash, offset, color: s.color }
    offset += dash
    return arc
  })
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={12} />
        {arcs.map((a, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth={12}
            strokeDasharray={`${a.dash} ${circ - a.dash}`} strokeDashoffset={-a.offset} />
        ))}
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, color: '#fff',
      }}>{total}</div>
    </div>
  )
}

// ── clickable card wrapper ─────────────────────────────────────────────────

function ClickableCard({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{ cursor: 'pointer', borderRadius: 14, transition: 'transform 0.12s, box-shadow 0.12s' }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = '0 6px 20px rgba(5,150,105,0.12)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      {children}
    </div>
  )
}

// ── main ───────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const auth = useAuth()
  const nav = useNavigate()
  const { loading, error, refresh, kpis, returnKpis, trend, godownsWithStock, recentActivity, alerts } = useDashboardData()
  const [createOpen, setCreateOpen] = useState(false)

  if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY')
    return <Navigate to="/deliveries" replace />

  const trendValues = useMemo(() => trend.map((t) => t.total), [trend])
  const trendLabels = useMemo(() => trend.map((t) => t.label), [trend])
  const trendTotal  = useMemo(() => trendValues.reduce((a, b) => a + b, 0), [trendValues])
  const peakIndex   = useMemo(() => trendValues.length ? trendValues.indexOf(Math.max(...trendValues)) : 0, [trendValues])

  const yesterdayTotal = trendValues.length >= 2 ? trendValues[trendValues.length - 2]! : 0
  const todayDelta = yesterdayTotal > 0
    ? `${kpis.today >= yesterdayTotal ? '+' : ''}${kpis.today - yesterdayTotal} vs yesterday`
    : '— No change from yesterday'

  const donutSegments = [
    { value: kpis.running, color: '#34d399' },
    { value: kpis.byStatus.pendingReturn, color: '#fbbf24' },
    { value: kpis.byStatus.completed, color: 'rgba(255,255,255,0.22)' },
  ]
  const donutTotal = kpis.running + kpis.byStatus.pendingReturn + kpis.byStatus.completed
  const maxStock = Math.max(...godownsWithStock.map((g) => g.stockQty), 1)

  // ── today's date for calendar navigation ──────────────────────────────
  const todayStr = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  // ── style tokens ──────────────────────────────────────────────────────

  const card: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e4e7f0',
    borderRadius: 14,
    padding: '18px 20px',
  }

  const darkCard: React.CSSProperties = {
    background: '#065f46',
    borderRadius: 14,
    padding: '18px 20px',
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0,
  }

  const sectionTitleLight: React.CSSProperties = {
    fontSize: 14, fontWeight: 700, color: '#ffffff', margin: 0,
  }

  const pill = (text: string, extra?: React.CSSProperties) => (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: '3px 10px',
      borderRadius: 20, background: '#f1f5f9', color: '#64748b',
      border: '1px solid #e4e7f0', ...extra,
    }}>{text}</span>
  )

  // ── render ────────────────────────────────────────────────────────────

  return (
    <div style={{
      width: '100%',
      minHeight: '100%',
      background: '#edf0f8',
      padding: '12px 12px 24px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      fontFamily: 'inherit',
    }}
    className="mobile-pb"
    >

      {/* ── header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>Dashboard</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, marginBottom: 0 }}>
            Live operations overview — deliveries, stock, returns, and alerts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => void refresh()} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10,
            border: '1px solid #e2e8f0', background: '#fff',
            fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button onClick={() => nav('/godowns')} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10,
            border: '1px solid #e2e8f0', background: '#fff',
            fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
            Godowns
          </button>
          <button onClick={() => setCreateOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 10,
            border: 'none', background: '#059669',
            fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
             Create Delivery
          </button>
        </div>
      </div>

      {/* ── error ── */}
      {error && (
        <div style={{
          padding: '10px 16px', borderRadius: 10,
          background: '#fef2f2', color: '#b91c1c', fontSize: 13,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '1px solid #fecaca',
        }}>
          <span>{error}</span>
          <button onClick={() => void refresh()} style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {/* ── 4 stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ ...card, minHeight: 158, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skel w={40} h={40} radius={10} />
              <Skel w="60%" h={12} />
              <Skel w="40%" h={30} />
              <Skel w="70%" h={10} />
            </div>
          ))
        ) : (
          <>
            <ClickableCard onClick={() => nav(`/calendar?date=${todayStr}`)}>
              <StatCard
                tone="neutral"
                label="All deliveries"
                value={String(kpis.today)}
                delta={todayDelta}
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 4v4h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>}
              />
            </ClickableCard>

            <ClickableCard onClick={() => nav(`/calendar?date=${todayStr}&status=active`)}>
              <StatCard
                tone="good"
                label="Pending / Dispatched"
                value={String(kpis.running)}
                delta="Processed + out for delivery"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>}
              />
            </ClickableCard>

            <ClickableCard onClick={() => nav(`/calendar?date=${todayStr}&status=pending_return`)}>
              <StatCard
                tone="warn"
                label="Pending returns"
                value={String(kpis.pendingReturn)}
                delta="Delivered + awaiting return"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
              />
            </ClickableCard>

            <ClickableCard onClick={() => nav(`/calendar?date=${todayStr}&status=completed`)}>
              <StatCard
                tone="good"
                label="Completed"
                value={String(kpis.completed)}
                delta={`↗ This week: ${trendTotal} total`}
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
              />
            </ClickableCard>
          </>
        )}
      </div>

      {/* ── return dashboard heading ── */}
      <div
        onClick={() => nav(`/return-calendar?date=${todayStr}`)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
            Return dashboard
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, marginBottom: 0 }}>
            Partial returns this month — click to view Return Calendar
          </p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '4px 12px' }}>
          View Return Calendar →
        </span>
      </div>

      {/* ── return dashboard: 4 stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ ...card, minHeight: 158, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skel w={40} h={40} radius={10} />
              <Skel w="60%" h={12} />
              <Skel w="40%" h={30} />
              <Skel w="70%" h={10} />
            </div>
          ))
        ) : (
          <>
            <ClickableCard onClick={() => nav(`/return-calendar?date=${todayStr}`)}>
              <StatCard
                tone="neutral"
                label="Return delivery"
                value={String(returnKpis.returnDelivery)}
                delta="Returns scheduled today"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 4v4h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>}
              />
            </ClickableCard>

            <ClickableCard onClick={() => nav(`/return-calendar?date=${todayStr}`)}>
              <StatCard
                tone="good"
                label="Return dispatch"
                value={String(returnKpis.returnDispatch)}
                delta="Out for return pickup"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>}
              />
            </ClickableCard>

            <ClickableCard onClick={() => nav(`/return-calendar?date=${todayStr}`)}>
              <StatCard
                tone="warn"
                label="returns pending"
                value={String(returnKpis.returnsPending)}
                delta="Items not yet fully returned"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
              />
            </ClickableCard>

            <ClickableCard onClick={() => nav(`/return-calendar?date=${todayStr}`)}>
              <StatCard
                tone="good"
                label="Returns completed"
                value={String(returnKpis.returnsCompleted)}
                delta="Completed today"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
              />
            </ClickableCard>
          </>
        )}
      </div>

      {/* ── trend + delivery status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr]" style={{ gap: 12 }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={sectionTitle}>Daily delivery trend</h2>
            {pill('Last 7 days')}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
            This week total: <span style={{ fontWeight: 700, color: '#059669' }}>{trendTotal}</span>
            {'   '}Peak day: <span style={{ fontWeight: 700, color: '#059669' }}>
              {trend[peakIndex]?.label ?? '—'} ({trend[peakIndex]?.total ?? 0})
            </span>
          </div>
          {loading
            ? <Skel w="100%" h={115} />
            : <BarChart
                values={trendValues.length ? trendValues : [0,0,0,0,0,0,0]}
                labels={trendLabels.length ? trendLabels : ['Thu','Fri','Sat','Sun','Mon','Tue','Wed']}
                peakIndex={peakIndex}
              />}
        </div>

        <div style={darkCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={sectionTitleLight}>Delivery status</h2>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px',
              borderRadius: 20, background: 'rgba(255,255,255,0.18)', color: '#fff',
            }}>Today</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {loading
              ? <Skel w={84} h={84} radius={42} />
              : <DonutChart segments={donutSegments} total={donutTotal} />}
            <div style={{ flex: 1 }}>
              {[
                { label: 'Pending / Dispatched', value: kpis.running },
                { label: 'Pending return', value: kpis.byStatus.pendingReturn },
                { label: 'Completed', value: kpis.byStatus.completed },
              ].map((row) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 9,
                }}>
                  <span>{row.label}</span>
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── bottom 3 cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 12 }}>

        {/* godown stock */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={sectionTitle}>Godown stock overview</h2>
            <button onClick={() => nav('/godowns')} style={{
              fontSize: 12, fontWeight: 600, color: '#059669',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}>View all</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <Skel key={i} w="100%" h={34} />)
              : godownsWithStock.length === 0
                ? <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No godowns configured yet.</p>
                : godownsWithStock.slice(0, 6).map((g, index) => (
                    <Link key={g.id} to={`/godowns/${g.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor(index), flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{g.name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{g.city || '—'} · Manager: {g.manager || '—'}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{formatNumber(g.stockQty)}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>units</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 5, marginLeft: 16, height: 3, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(g.stockQty / maxStock) * 100}%`, background: progressColor(index), borderRadius: 99 }} />
                      </div>
                    </Link>
                  ))
            }
          </div>
        </div>

        {/* recent deliveries */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={sectionTitle}>Recent deliveries</h2>
            {pill('Latest', { background: '#d1fae5', color: '#047857', border: 'none' })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <Skel key={i} w="100%" h={50} radius={8} />)
              : recentActivity.length === 0
                ? <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No recent deliveries.</p>
                : recentActivity.map((a) => (
                    <Link key={a.id} to={`/deliveries/${a.id}`} style={{
                      textDecoration: 'none', display: 'block',
                      padding: '9px 0', borderBottom: '1px solid #f1f5f9',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: deliveryDotColor(a.status), flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.deliveryNo}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{a.customerName}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{formatDateTime(a.deliveryAt)}</div>
                          </div>
                        </div>
                        <span style={{ ...badgeStyle(a.status), fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>
                          {statusLabel(a.status)}
                        </span>
                      </div>
                    </Link>
                  ))
            }
          </div>
        </div>

        {/* alerts */}
        <div style={darkCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={sectionTitleLight}>Alerts</h2>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px',
              borderRadius: 20, background: 'rgba(255,255,255,0.18)', color: '#fff',
            }}>
              {alerts.length ? `${alerts.length} active` : 'All clear'}
            </span>
          </div>

          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>All clear</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>No issues need attention right now.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {alerts.map((alert) => (
                <Link key={alert.id} to={alert.href} style={{
                  textDecoration: 'none', display: 'block',
                  padding: '9px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.1)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{alert.title}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.2)', color: '#fff' }}>{alert.count}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{alert.description}</div>
                </Link>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
            <button onClick={() => nav('/products')} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '8px 0', borderRadius: 9,
              border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)',
              fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              Products
            </button>
            <button onClick={() => setCreateOpen(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '8px 0', borderRadius: 9,
              border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)',
              fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New delivery
            </button>
          </div>
        </div>
      </div>

      <CreateDeliveryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); void refresh() }}
      />
    </div>
  )
}