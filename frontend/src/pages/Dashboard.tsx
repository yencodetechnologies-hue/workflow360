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
//   return (
//     <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 115, width: '100%' }}>
//       {values.map((v, i) => {
//         const pct = (v / max) * 100
//         const isPeak = i === peakIndex
//         return (
//           <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
//             <div style={{
//               width: '100%',
//               height: `${Math.max(pct, 3)}%`,
//               background: isPeak ? '#10b981' : '#d1fae5',
//               borderRadius: '4px 4px 0 0',
//               transition: 'height 0.4s ease',
//             }} />
//             <span style={{
//               fontSize: 11,
//               color: isPeak ? '#059669' : '#94a3b8',
//               fontWeight: isPeak ? 700 : 400,
//               whiteSpace: 'nowrap',
//             }}>{labels[i]}</span>
//           </div>
//         )
//       })}
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
//   const { loading, error, refresh, kpis, trend, godownsWithStock, recentActivity, alerts } = useDashboardData()
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
//     { value: kpis.byStatus.upcoming, color: '#34d399' },
//     { value: kpis.byStatus.dispatched, color: '#34d399' },
//     { value: kpis.byStatus.pendingReturn, color: '#fbbf24' },
//     { value: kpis.byStatus.completed, color: 'rgba(255,255,255,0.22)' },
//   ]
//   const donutTotal = kpis.byStatus.upcoming + kpis.byStatus.dispatched + kpis.byStatus.pendingReturn + kpis.byStatus.completed
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
//             <StatCard tone="neutral" label="Total deliveries today" value={String(kpis.today)} delta={todayDelta}
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 4v4h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>}
//             />
//             <StatCard tone="good" label="Dispatched / Processed" value={String(kpis.running)} delta="— Active deliveries"
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>}
//             />
//             <StatCard tone="warn" label="Pending returns" value={String(kpis.pendingReturn)} delta="✓ All clear"
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
//             />
//             <StatCard tone="good" label="Completed" value={String(kpis.completed)} delta={`↗ This week: ${trendTotal} total`}
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
//                 { label: 'Upcoming', value: kpis.byStatus.upcoming },
//                 { label: 'Dispatched', value: kpis.byStatus.dispatched },
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

// // import { useMemo, useState } from 'react'
// // import { Link, Navigate, useNavigate } from 'react-router-dom'
// // import { useAuth } from '../auth/store'
// // import { DonutChart, SparkBars } from '../components/charts/MiniCharts'
// // import { formatDateTime, formatNumber } from '../lib/format'
// // import { Badge } from '../components/ui/Badge'
// // import { Button } from '../components/ui/Button'
// // import { CardContent, CardHeader, CardTitle, GlassCard, GradientCard, InteractiveCard } from '../components/ui/Card'
// // import { PageHeader } from '../components/ui/PageHeader'
// // import { StatCard } from '../components/ui/StatCard'
// // import { useDashboardData } from '../hooks/useDashboardData'
// // import { CreateDeliveryModal } from './Deliveries/CreateDeliveryModal'

// // function badgeVariant(status: string) {
// //   if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return 'green'
// //   if (status === 'PROCESSED' || status === 'UPCOMING') return 'blue'
// //   if (status === 'PACKED') return 'slate'
// //   if (status === 'RETURN_PICKUP') return 'amber'
// //   if (status === 'PENDING_RETURN' || status === 'DELIVERED') return 'amber'
// //   if (status === 'COMPLETED') return 'slate'
// //   return 'slate'
// // }

// // function statusLabel(status: string) {
// //   const map: Record<string, string> = {
// //     PROCESSED: 'Processed',
// //     PACKED: 'Packed',
// //     OUT_FOR_DELIVERY: 'Out for delivery',
// //     RETURN_PICKUP: 'Return pickup',
// //     UPCOMING: 'Processed',
// //     DISPATCHED: 'Out for delivery',
// //     DELIVERED: 'Delivered',
// //     PENDING_RETURN: 'Pending return',
// //     COMPLETED: 'Completed',
// //     CANCELLED: 'Cancelled',
// //   }
// //   return map[status] ?? status
// // }

// // function StatSkeleton() {
// //   return (
// //     <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
// //       <div className="h-3 w-24 rounded bg-slate-200" />
// //       <div className="mt-3 h-8 w-16 rounded bg-slate-200" />
// //     </div>
// //   )
// // }

// // function CardSkeleton({ tall = false }: { tall?: boolean }) {
// //   return (
// //     <div
// //       className={`rounded-2xl border border-slate-200 bg-white/80 p-6 animate-pulse ${tall ? 'min-h-[220px]' : 'min-h-[160px]'}`}
// //     >
// //       <div className="h-4 w-32 rounded bg-slate-200" />
// //       <div className="mt-6 h-24 rounded bg-slate-100" />
// //     </div>
// //   )
// // }

// // export function DashboardPage() {
// //   const auth = useAuth()
// //   const nav = useNavigate()
// //   const { loading, error, refresh, kpis, trend, godownsWithStock, recentActivity, alerts } =
// //     useDashboardData()
// //   const [createOpen, setCreateOpen] = useState(false)

// //   if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY') {
// //     return <Navigate to="/deliveries" replace />
// //   }

// //   const trendValues = useMemo(() => trend.map((t) => t.total), [trend])
// //   const trendLabels = useMemo(() => trend.map((t) => t.label), [trend])
// //   const trendTotal = useMemo(() => trendValues.reduce((a, b) => a + b, 0), [trendValues])
// //   const peakIndex = useMemo(() => {
// //     if (!trendValues.length) return 0
// //     return trendValues.indexOf(Math.max(...trendValues))
// //   }, [trendValues])

// //   const yesterdayTotal = trendValues.length >= 2 ? trendValues[trendValues.length - 2]! : 0
// //   const todayDelta =
// //     yesterdayTotal > 0
// //       ? `${kpis.today >= yesterdayTotal ? '+' : ''}${kpis.today - yesterdayTotal} vs yesterday`
// //       : undefined

// //   const donutSegments = useMemo(
// //     () => [
// //       { label: 'Upcoming', value: kpis.byStatus.upcoming, color: '#60a5fa' },
// //       { label: 'Dispatched', value: kpis.byStatus.dispatched, color: '#34d399' },
// //       { label: 'PendingReturn', value: kpis.byStatus.pendingReturn, color: '#fbbf24' },
// //       { label: 'Completed', value: kpis.byStatus.completed, color: '#e5e7eb' },
// //     ],
// //     [kpis.byStatus],
// //   )

// //   return (
// //     <div className="fade-in">
// //       <PageHeader
// //         title="Dashboard"
// //         subtitle="Live operations overview — deliveries, stock, returns, and alerts."
// //         right={
// //           <>
// //             <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
// //               {loading ? 'Refreshing…' : 'Refresh'}
// //             </Button>
// //             <Button variant="secondary" onClick={() => nav('/godowns')}>
// //               Godowns
// //             </Button>
// //             <Button variant="primary" onClick={() => setCreateOpen(true)}>
// //               Create Delivery
// //             </Button>
// //           </>
// //         }
// //       />

// //       {error ? (
// //         <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
// //           <span>{error}</span>
// //           <Button variant="secondary" size="sm" onClick={() => void refresh()}>
// //             Retry
// //           </Button>
// //         </div>
// //       ) : null}

// //       <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
// //         {loading ? (
// //           <>
// //             <StatSkeleton />
// //             <StatSkeleton />
// //             <StatSkeleton />
// //             <StatSkeleton />
// //           </>
// //         ) : (
// //           <>
// //             <StatCard
// //               label="Total deliveries today"
// //               value={`${kpis.today}`}
// //               delta={todayDelta}
// //               className="hover-lift"
// //             />
// //             <StatCard label="Dispatched" value={`${kpis.running}`} tone="good" className="hover-lift" />
// //             <StatCard
// //               label="Pending returns"
// //               value={`${kpis.pendingReturn}`}
// //               tone="warn"
// //               className="hover-lift"
// //             />
// //             <StatCard label="Completed" value={`${kpis.completed}`} className="hover-lift" />
// //           </>
// //         )}
// //       </div>

// //       <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
// //         {loading ? (
// //           <>
// //             <CardSkeleton tall />
// //             <CardSkeleton tall />
// //           </>
// //         ) : (
// //           <>
// //             <GlassCard className="lg:col-span-2 hover-lift">
// //               <CardHeader className="flex items-center justify-between">
// //                 <CardTitle className="gradient-text">Daily delivery trend</CardTitle>
// //                 <Badge variant="slate" className="bg-primary-100 text-primary-700">
// //                   Last 7 days
// //                 </Badge>
// //               </CardHeader>
// //               <CardContent className="flex items-end justify-between gap-6">
// //                 <div>
// //                   <div className="text-sm text-slate-600">
// //                     This week total:{' '}
// //                     <span className="font-bold gradient-text">{formatNumber(trendTotal)}</span>
// //                   </div>
// //                   <div className="mt-1 text-xs text-slate-500">
// //                     Peak day: {trend[peakIndex]?.label ?? '—'} ({trend[peakIndex]?.total ?? 0})
// //                   </div>
// //                 </div>
// //                 <SparkBars
// //                   values={trendValues.length ? trendValues : [0, 0, 0, 0, 0, 0, 0]}
// //                   labels={trendLabels}
// //                   highlightIndex={peakIndex}
// //                   className="py-2"
// //                 />
// //               </CardContent>
// //             </GlassCard>

// //             <GradientCard variant="primary" className="hover-lift">
// //               <CardHeader className="flex items-center justify-between border-0">
// //                 <CardTitle className="text-white">Delivery status</CardTitle>
// //                 <Badge className="bg-white/20 text-white border-white/30 animate-pulse">Today</Badge>
// //               </CardHeader>
// //               <CardContent className="flex items-center justify-between gap-4">
// //                 <DonutChart segments={donutSegments} />
// //                 <div className="space-y-2 text-sm text-white">
// //                   <div className="flex items-center justify-between gap-4">
// //                     <span className="text-white/80">Upcoming</span>
// //                     <span className="font-bold text-white">{kpis.byStatus.upcoming}</span>
// //                   </div>
// //                   <div className="flex items-center justify-between gap-4">
// //                     <span className="text-white/80">Dispatched</span>
// //                     <span className="font-bold text-white">{kpis.byStatus.dispatched}</span>
// //                   </div>
// //                   <div className="flex items-center justify-between gap-4">
// //                     <span className="text-white/80">Pending return</span>
// //                     <span className="font-bold text-white">{kpis.byStatus.pendingReturn}</span>
// //                   </div>
// //                   <div className="flex items-center justify-between gap-4">
// //                     <span className="text-white/80">Completed</span>
// //                     <span className="font-bold text-white">{kpis.byStatus.completed}</span>
// //                   </div>
// //                 </div>
// //               </CardContent>
// //             </GradientCard>
// //           </>
// //         )}
// //       </div>

// //       <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
// //         {loading ? (
// //           <>
// //             <CardSkeleton />
// //             <CardSkeleton />
// //             <CardSkeleton />
// //           </>
// //         ) : (
// //           <>
// //             <InteractiveCard className="hover-lift">
// //               <CardHeader className="flex items-center justify-between">
// //                 <CardTitle className="gradient-text">Godown stock overview</CardTitle>
// //                 <Button variant="ghost" size="sm" onClick={() => nav('/godowns')} className="hover:bg-primary-50">
// //                   View all
// //                 </Button>
// //               </CardHeader>
// //               <CardContent className="space-y-3">
// //                 {godownsWithStock.length === 0 ? (
// //                   <p className="text-sm text-slate-500">No godowns configured yet.</p>
// //                 ) : (
// //                   godownsWithStock.slice(0, 6).map((g, index) => (
// //                     <Link
// //                       key={g.id}
// //                       to={`/godowns/${g.id}`}
// //                       className={`flex items-center justify-between gap-4 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 hover:border-primary-200 transition-all duration-300 slide-up`}
// //                       style={{ animationDelay: `${index * 100}ms` }}
// //                     >
// //                       <div className="min-w-0">
// //                         <div className="truncate text-sm font-bold text-slate-900 gradient-text">{g.name}</div>
// //                         <div className="text-xs text-slate-500">
// //                           {g.city || '—'} &#8226; Manager: {g.manager || '—'}
// //                         </div>
// //                       </div>
// //                       <div className="text-right">
// //                         <div className="text-sm font-bold gradient-text">{formatNumber(g.stockQty)}</div>
// //                         <div className="text-xs text-slate-500">units</div>
// //                       </div>
// //                     </Link>
// //                   ))
// //                 )}
// //               </CardContent>
// //             </InteractiveCard>

// //             <GlassCard className="hover-lift">
// //               <CardHeader className="flex items-center justify-between">
// //                 <CardTitle className="gradient-text">Recent deliveries</CardTitle>
// //                 <Badge variant="slate" className="bg-accent-100 text-accent-700 animate-pulse">
// //                   Latest
// //                 </Badge>
// //               </CardHeader>
// //               <CardContent className="space-y-3">
// //                 {recentActivity.length === 0 ? (
// //                   <p className="text-sm text-slate-500">No recent deliveries.</p>
// //                 ) : (
// //                   recentActivity.map((a, index) => (
// //                     <Link
// //                       key={a.id}
// //                       to={`/deliveries/${a.id}`}
// //                       className={`block rounded-xl border border-slate-100/50 bg-white/50 backdrop-blur-sm p-3 hover:bg-white/70 transition-all duration-300 slide-up hover:shadow-md`}
// //                       style={{ animationDelay: `${index * 100}ms` }}
// //                     >
// //                       <div className="flex items-center justify-between gap-2">
// //                         <span className="text-sm font-medium text-slate-900">{a.deliveryNo}</span>
// //                         <Badge variant={badgeVariant(a.status)}>{statusLabel(a.status)}</Badge>
// //                       </div>
// //                       <div className="mt-1 text-sm text-slate-700">{a.customerName}</div>
// //                       <div className="mt-1 text-xs text-slate-500">{formatDateTime(a.deliveryAt)}</div>
// //                     </Link>
// //                   ))
// //                 )}
// //               </CardContent>
// //             </GlassCard>

// //             <GradientCard variant="primary" className="hover-lift">
// //               <CardHeader className="flex items-center justify-between border-0">
// //                 <CardTitle className="text-white">Alerts</CardTitle>
// //                 <Badge className="bg-white/20 text-white border-white/30 animate-pulse">
// //                   {alerts.length ? `${alerts.length} active` : 'All clear'}
// //                 </Badge>
// //               </CardHeader>
// //               <CardContent className="space-y-3">
// //                 {alerts.length === 0 ? (
// //                   <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 text-center">
// //                     <div className="text-sm font-bold text-white">All clear</div>
// //                     <div className="mt-1 text-xs text-white/80">No issues need attention right now.</div>
// //                   </div>
// //                 ) : (
// //                   alerts.map((alert) => (
// //                     <Link
// //                       key={alert.id}
// //                       to={alert.href}
// //                       className="block rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-3 hover:bg-white/20 transition-all duration-300"
// //                     >
// //                       <div className="flex items-center justify-between gap-2">
// //                         <div className="text-sm font-bold text-white">{alert.title}</div>
// //                         <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold text-white">
// //                           {alert.count}
// //                         </span>
// //                       </div>
// //                       <div className="mt-1 text-xs text-white/80">{alert.description}</div>
// //                     </Link>
// //                   ))
// //                 )}

// //                 <div className="grid grid-cols-2 gap-3 pt-2">
// //                   <Button
// //                     variant="secondary"
// //                     onClick={() => nav('/products')}
// //                     className="bg-white/20 hover:bg-white/30 text-white border-white/30"
// //                   >
// //                     Products
// //                   </Button>
// //                   <Button
// //                     variant="secondary"
// //                     onClick={() => setCreateOpen(true)}
// //                     className="bg-white/20 hover:bg-white/30 text-white border-white/30"
// //                   >
// //                     New delivery
// //                   </Button>
// //                 </div>
// //               </CardContent>
// //             </GradientCard>
// //           </>
// //         )}
// //       </div>

// //       <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
// //         {loading ? (
// //           <>
// //             <StatSkeleton />
// //             <StatSkeleton />
// //             <StatSkeleton />
// //           </>
// //         ) : (
// //           <>
// //             <StatCard
// //               label="Total godown stock"
// //               value={formatNumber(kpis.totalStock)}
// //               className="hover-lift fade-in"
// //             />
// //             <StatCard
// //               label="Damaged items (today)"
// //               value={formatNumber(kpis.damaged)}
// //               tone="warn"
// //               className="hover-lift fade-in"
// //             />
// //             <StatCard
// //               label="Lost items (today)"
// //               value={formatNumber(kpis.lost)}
// //               tone="bad"
// //               className="hover-lift fade-in"
// //             />
// //           </>
// //         )}
// //       </div>

// //       <CreateDeliveryModal
// //         open={createOpen}
// //         onClose={() => setCreateOpen(false)}
// //         onCreated={() => {
// //           setCreateOpen(false)
// //           void refresh()
// //         }}
// //       />
// //     </div>
// //   )
// // }

// // import { useMemo, useState } from 'react'
// // import { Link, Navigate, useNavigate } from 'react-router-dom'
// // import { useAuth } from '../auth/store'
// // import { formatDateTime, formatNumber } from '../lib/format'
// // import { useDashboardData } from '../hooks/useDashboardData'
// // import { CreateDeliveryModal } from './Deliveries/CreateDeliveryModal'
// // import { StatCard } from '../components/ui/StatCard'

// // // ── helpers ────────────────────────────────────────────────────────────────

// // function badgeStyle(status: string): React.CSSProperties {
// //   if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED')
// //     return { background: '#dcfce7', color: '#16a34a' }
// //   if (status === 'PROCESSED' || status === 'UPCOMING')
// //     return { background: '#e0e7ff', color: '#4338ca' }
// //   if (status === 'PACKED') return { background: '#f1f5f9', color: '#475569' }
// //   if (status === 'RETURN_PICKUP' || status === 'PENDING_RETURN' || status === 'DELIVERED')
// //     return { background: '#fef9c3', color: '#b45309' }
// //   if (status === 'COMPLETED') return { background: '#f1f5f9', color: '#475569' }
// //   if (status === 'CANCELLED') return { background: '#fee2e2', color: '#dc2626' }
// //   if (status === 'RETURNED') return { background: '#fee2e2', color: '#dc2626' }
// //   if (status === 'PENDING') return { background: '#fef9c3', color: '#b45309' }
// //   return { background: '#f1f5f9', color: '#475569' }
// // }

// // function statusLabel(status: string) {
// //   const map: Record<string, string> = {
// //     PROCESSED: 'Processed',
// //     PACKED: 'Packed',
// //     OUT_FOR_DELIVERY: 'Out for delivery',
// //     RETURN_PICKUP: 'Return pickup',
// //     UPCOMING: 'Upcoming',
// //     DISPATCHED: 'Dispatched',
// //     DELIVERED: 'Delivered',
// //     PENDING_RETURN: 'Pending return',
// //     COMPLETED: 'Completed',
// //     CANCELLED: 'Cancelled',
// //     RETURNED: 'Returned',
// //     PENDING: 'Pending',
// //   }
// //   return map[status] ?? status
// // }

// // function dotColor(index: number) {
// //   const colors = ['#10b981', '#059669', '#22c55e', '#047857', '#34d399', '#14b8a6']
// //   return colors[index % colors.length]
// // }

// // function progressColor(index: number) {
// //   const colors = ['#10b981', '#059669', '#22c55e', '#047857', '#34d399', '#14b8a6']
// //   return colors[index % colors.length]
// // }

// // function deliveryDotColor(status: string) {
// //   if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return '#22c55e'
// //   if (status === 'PROCESSED' || status === 'UPCOMING') return '#10b981'
// //   if (status === 'PENDING_RETURN' || status === 'DELIVERED' || status === 'PENDING') return '#f59e0b'
// //   if (status === 'COMPLETED') return '#94a3b8'
// //   if (status === 'CANCELLED' || status === 'RETURNED') return '#ef4444'
// //   return '#10b981'
// // }

// // // ── skeleton ───────────────────────────────────────────────────────────────

// // function Skeleton({ style }: { style?: React.CSSProperties }) {
// //   return (
// //     <div
// //       style={{
// //         borderRadius: 8,
// //         background: '#e2e8f0',
// //         animation: 'pulse 1.5s ease-in-out infinite',
// //         ...style,
// //       }}
// //     />
// //   )
// // }

// // // ── bar chart ──────────────────────────────────────────────────────────────

// // function BarChart({ values, labels, peakIndex }: { values: number[]; labels: string[]; peakIndex: number }) {
// //   const max = Math.max(...values, 1)
// //   return (
// //     <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, width: '100%' }}>
// //       {values.map((v, i) => {
// //         const pct = (v / max) * 100
// //         const isPeak = i === peakIndex
// //         return (
// //           <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
// //             <div
// //               style={{
// //                 width: '100%',
// //                 height: `${Math.max(pct, 3)}%`,
// //                 background: isPeak ? '#10b981' : '#d1fae5',
// //                 borderRadius: '5px 5px 0 0',
// //                 transition: 'height 0.4s ease',
// //               }}
// //             />
// //             <span style={{
// //               fontSize: 11,
// //               color: isPeak ? '#059669' : '#94a3b8',
// //               fontWeight: isPeak ? 700 : 400,
// //               whiteSpace: 'nowrap',
// //             }}>
// //               {labels[i]}
// //             </span>
// //           </div>
// //         )
// //       })}
// //     </div>
// //   )
// // }

// // // ── donut chart ────────────────────────────────────────────────────────────

// // function DonutChart({ segments, total }: { segments: { value: number; color: string }[]; total: number }) {
// //   const size = 86
// //   const r = 30
// //   const cx = size / 2
// //   const cy = size / 2
// //   const circ = 2 * Math.PI * r
// //   const tot = segments.reduce((a, s) => a + s.value, 0) || 1

// //   let offset = 0
// //   const arcs = segments.map((s) => {
// //     const dash = (s.value / tot) * circ
// //     const arc = { dash, offset, color: s.color }
// //     offset += dash
// //     return arc
// //   })

// //   return (
// //     <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
// //       <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
// //         <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={13} />
// //         {arcs.map((a, i) => (
// //           <circle
// //             key={i}
// //             cx={cx}
// //             cy={cy}
// //             r={r}
// //             fill="none"
// //             stroke={a.color}
// //             strokeWidth={13}
// //             strokeDasharray={`${a.dash} ${circ - a.dash}`}
// //             strokeDashoffset={-a.offset}
// //           />
// //         ))}
// //       </svg>
// //       <div style={{
// //         position: 'absolute', inset: 0,
// //         display: 'flex', alignItems: 'center', justifyContent: 'center',
// //         fontSize: 15, fontWeight: 700, color: '#fff',
// //       }}>
// //         {total}
// //       </div>
// //     </div>
// //   )
// // }

// // // ── main component ─────────────────────────────────────────────────────────

// // export function DashboardPage() {
// //   const auth = useAuth()
// //   const nav = useNavigate()
// //   const { loading, error, refresh, kpis, trend, godownsWithStock, recentActivity, alerts } =
// //     useDashboardData()
// //   const [createOpen, setCreateOpen] = useState(false)

// //   if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY') {
// //     return <Navigate to="/deliveries" replace />
// //   }

// //   const trendValues = useMemo(() => trend.map((t) => t.total), [trend])
// //   const trendLabels = useMemo(() => trend.map((t) => t.label), [trend])
// //   const trendTotal = useMemo(() => trendValues.reduce((a, b) => a + b, 0), [trendValues])
// //   const peakIndex = useMemo(() => {
// //     if (!trendValues.length) return 0
// //     return trendValues.indexOf(Math.max(...trendValues))
// //   }, [trendValues])

// //   const yesterdayTotal = trendValues.length >= 2 ? trendValues[trendValues.length - 2]! : 0
// //   const todayDelta =
// //     yesterdayTotal > 0
// //       ? `${kpis.today >= yesterdayTotal ? '+' : ''}${kpis.today - yesterdayTotal} vs yesterday`
// //       : '— No change from yesterday'

// //   const donutSegments = [
// //     { value: kpis.byStatus.upcoming, color: '#34d399' },
// //     { value: kpis.byStatus.dispatched, color: '#34d399' },
// //     { value: kpis.byStatus.pendingReturn, color: '#fbbf24' },
// //     { value: kpis.byStatus.completed, color: 'rgba(255,255,255,0.22)' },
// //   ]
// //   const donutTotal =
// //     kpis.byStatus.upcoming + kpis.byStatus.dispatched +
// //     kpis.byStatus.pendingReturn + kpis.byStatus.completed

// //   const maxStock = Math.max(...godownsWithStock.map((g) => g.stockQty), 1)

// //   // ── shared styles ──────────────────────────────────────────────────────

// //   const card: React.CSSProperties = {
// //     background: '#ffffff',
// //     border: '1px solid #e8eaf0',
// //     borderRadius: 14,
// //     padding: '18px 20px',
// //   }

// //   const darkCard: React.CSSProperties = {
// //     background: '#065f46',
// //     borderRadius: 14,
// //     padding: '18px 20px',
// //   }

// //   const sectionTitle: React.CSSProperties = {
// //     fontSize: 14,
// //     fontWeight: 700,
// //     color: '#0f172a',
// //     margin: 0,
// //   }

// //   const sectionTitleLight: React.CSSProperties = {
// //     fontSize: 14,
// //     fontWeight: 700,
// //     color: '#ffffff',
// //     margin: 0,
// //   }

// //   const pillBadge = (text: string, style?: React.CSSProperties): React.ReactNode => (
// //     <span style={{
// //       fontSize: 11,
// //       fontWeight: 500,
// //       padding: '3px 10px',
// //       borderRadius: 20,
// //       background: '#f1f5f9',
// //       color: '#64748b',
// //       border: '1px solid #e8eaf0',
// //       ...style,
// //     }}>
// //       {text}
// //     </span>
// //   )

// //   // ── render ────────────────────────────────────────────────────────────

// //   return (
// //     // KEY FIX: margin:0, padding flush, no outer gaps, fills entire content area
// //     <div style={{
// //       margin: 0,
// //       padding: '16px 20px 20px',
// //       background: '#edf0f8',
// //       minHeight: '100%',
// //       width: '100%',
// //       boxSizing: 'border-box',
// //       display: 'flex',
// //       flexDirection: 'column',
// //       gap: 12,
// //     }}>

// //       {/* ── page header ── */}
// //       <div style={{
// //         display: 'flex',
// //         alignItems: 'center',
// //         justifyContent: 'space-between',
// //         flexWrap: 'wrap',
// //         gap: 10,
// //       }}>
// //         <div>
// //           <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>Dashboard</h1>
// //           <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, marginBottom: 0 }}>
// //             Live operations overview — deliveries, stock, returns, and alerts.
// //           </p>
// //         </div>
// //         <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
// //           {/* <button
// //             onClick={() => void refresh()}
// //             disabled={loading}
// //             style={{
// //               display: 'flex', alignItems: 'center', gap: 6,
// //               padding: '8px 16px', borderRadius: 10,
// //               border: '1px solid #e2e8f0', background: '#ffffff',
// //               fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
// //               whiteSpace: 'nowrap',
// //             }}
// //           >
// //             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
// //               <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
// //               <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
// //             </svg>
// //             {loading ? 'Refreshing…' : 'Refresh'}
// //           </button> */}
// //           <button
// //             onClick={() => nav('/godowns')}
// //             style={{
// //               display: 'flex', alignItems: 'center', gap: 6,
// //               padding: '8px 16px', borderRadius: 10,
// //               border: '1px solid #e2e8f0', background: '#ffffff',
// //               fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
// //               whiteSpace: 'nowrap',
// //             }}
// //           >
// //             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
// //               <rect x="2" y="7" width="20" height="14" rx="2" />
// //               <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
// //             </svg>
// //             Godowns
// //           </button>
// //           <button
// //             onClick={() => setCreateOpen(true)}
// //             style={{
// //               display: 'flex', alignItems: 'center', gap: 6,
// //               padding: '8px 18px', borderRadius: 10,
// //               border: 'none', background: '#059669',
// //               fontSize: 13, fontWeight: 600, color: '#ffffff', cursor: 'pointer',
// //               whiteSpace: 'nowrap',
// //             }}
// //           >
// //             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
// //               <path d="M12 5v14M5 12h14" />
// //             </svg>
// //              Create Delivery
// //           </button>
// //         </div>
// //       </div>

// //       {/* ── error banner ── */}
// //       {error && (
// //         <div style={{
// //           padding: '10px 16px', borderRadius: 10,
// //           background: '#fef2f2', color: '#b91c1c', fontSize: 13,
// //           display: 'flex', justifyContent: 'space-between', alignItems: 'center',
// //           border: '1px solid #fecaca',
// //         }}>
// //           <span>{error}</span>
// //           <button onClick={() => void refresh()} style={{
// //             background: 'none', border: 'none', color: '#b91c1c', fontWeight: 600, cursor: 'pointer',
// //           }}>Retry</button>
// //         </div>
// //       )}

// //       {/* ── 4 stat cards ── */}
// //       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
// //         {loading ? (
// //           Array.from({ length: 4 }).map((_, i) => (
// //             <div key={i} style={{ ...card, minHeight: 160 }}>
// //               <Skeleton style={{ width: 40, height: 40, marginBottom: 12 }} />
// //               <Skeleton style={{ width: '60%', height: 12, marginBottom: 10 }} />
// //               <Skeleton style={{ width: '40%', height: 28, marginBottom: 8 }} />
// //               <Skeleton style={{ width: '70%', height: 10 }} />
// //             </div>
// //           ))
// //         ) : (
// //           <>
// //             <StatCard
// //               tone="neutral"
// //               label="Total deliveries today"
// //               value={String(kpis.today)}
// //               delta={todayDelta}
// //               icon={
// //                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
// //                   <rect x="1" y="3" width="15" height="13" rx="1" />
// //                   <path d="M16 8h4l3 4v4h-7V8z" />
// //                   <circle cx="5.5" cy="18.5" r="2.5" />
// //                   <circle cx="18.5" cy="18.5" r="2.5" />
// //                 </svg>
// //               }
// //             />
// //             <StatCard
// //               tone="good"
// //               label="Dispatched"
// //               value={String(kpis.running)}
// //               delta="— Awaiting dispatch"
// //               icon={
// //                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
// //                   <path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" />
// //                 </svg>
// //               }
// //             />
// //             <StatCard
// //               tone="warn"
// //               label="Pending returns"
// //               value={String(kpis.pendingReturn)}
// //               delta="✓ All clear"
// //               icon={
// //                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
// //                   <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
// //                   <polyline points="9 22 9 12 15 12 15 22" />
// //                 </svg>
// //               }
// //             />
// //             <StatCard
// //               tone="good"
// //               label="Completed"
// //               value={String(kpis.completed)}
// //               delta={`↗ This week: ${trendTotal} total`}
// //               icon={
// //                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
// //                   <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
// //                   <polyline points="22 4 12 14.01 9 11.01" />
// //                 </svg>
// //               }
// //             />
// //           </>
// //         )}
// //       </div>

// //       {/* ── trend + delivery status ── */}
// //       <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
// //         {/* trend */}
// //         <div style={card}>
// //           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
// //             <h2 style={sectionTitle}>Daily delivery trend</h2>
// //             {pillBadge('Last 7 days')}
// //           </div>
// //           <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
// //             This week total:{' '}
// //             <span style={{ fontWeight: 700, color: '#059669' }}>{trendTotal}</span>
// //             {'   '}Peak day:{' '}
// //             <span style={{ fontWeight: 700, color: '#059669' }}>
// //               {trend[peakIndex]?.label ?? '—'} ({trend[peakIndex]?.total ?? 0})
// //             </span>
// //           </div>
// //           {loading
// //             ? <Skeleton style={{ height: 120, width: '100%' }} />
// //             : <BarChart
// //                 values={trendValues.length ? trendValues : [0, 0, 0, 0, 0, 0, 0]}
// //                 labels={trendLabels.length ? trendLabels : ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed']}
// //                 peakIndex={peakIndex}
// //               />
// //           }
// //         </div>

// //         {/* delivery status */}
// //         <div style={darkCard}>
// //           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
// //             <h2 style={sectionTitleLight}>Delivery status</h2>
// //             <span style={{
// //               fontSize: 11, fontWeight: 600, padding: '3px 10px',
// //               borderRadius: 20, background: 'rgba(255,255,255,0.18)', color: '#ffffff',
// //             }}>Today</span>
// //           </div>
// //           <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
// //             {loading
// //               ? <Skeleton style={{ width: 86, height: 86, borderRadius: '50%', flexShrink: 0 }} />
// //               : <DonutChart segments={donutSegments} total={donutTotal} />
// //             }
// //             <div style={{ flex: 1 }}>
// //               {[
// //                 { label: 'Upcoming', value: kpis.byStatus.upcoming },
// //                 { label: 'Dispatched', value: kpis.byStatus.dispatched },
// //                 { label: 'Pending return', value: kpis.byStatus.pendingReturn },
// //                 { label: 'Completed', value: kpis.byStatus.completed },
// //               ].map((row) => (
// //                 <div key={row.label} style={{
// //                   display: 'flex', justifyContent: 'space-between', alignItems: 'center',
// //                   fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 9,
// //                 }}>
// //                   <span>{row.label}</span>
// //                   <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 13 }}>{row.value}</span>
// //                 </div>
// //               ))}
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* ── bottom row ── */}
// //       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

// //         {/* godown stock */}
// //         <div style={card}>
// //           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
// //             <h2 style={sectionTitle}>Godown stock overview</h2>
// //             <button onClick={() => nav('/godowns')} style={{
// //               fontSize: 12, fontWeight: 600, color: '#059669',
// //               background: 'none', border: 'none', cursor: 'pointer', padding: 0,
// //             }}>View all</button>
// //           </div>
// //           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
// //             {loading ? (
// //               Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} style={{ height: 36 }} />)
// //             ) : godownsWithStock.length === 0 ? (
// //               <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No godowns configured yet.</p>
// //             ) : (
// //               godownsWithStock.slice(0, 6).map((g, index) => (
// //                 <Link key={g.id} to={`/godowns/${g.id}`} style={{ textDecoration: 'none' }}>
// //                   <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
// //                     <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
// //                       <div style={{
// //                         width: 8, height: 8, borderRadius: '50%',
// //                         background: dotColor(index), flexShrink: 0, marginTop: 2,
// //                       }} />
// //                       <div>
// //                         <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{g.name}</div>
// //                         <div style={{ fontSize: 11, color: '#94a3b8' }}>
// //                           {g.city || '—'} · Manager: {g.manager || '—'}
// //                         </div>
// //                       </div>
// //                     </div>
// //                     <div style={{ textAlign: 'right', flexShrink: 0 }}>
// //                       <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{formatNumber(g.stockQty)}</div>
// //                       <div style={{ fontSize: 10, color: '#94a3b8' }}>units</div>
// //                     </div>
// //                   </div>
// //                   <div style={{
// //                     marginTop: 5, marginLeft: 16, height: 3,
// //                     borderRadius: 99, background: '#f1f5f9', overflow: 'hidden',
// //                   }}>
// //                     <div style={{
// //                       height: '100%',
// //                       width: `${(g.stockQty / maxStock) * 100}%`,
// //                       background: progressColor(index), borderRadius: 99,
// //                     }} />
// //                   </div>
// //                 </Link>
// //               ))
// //             )}
// //           </div>
// //         </div>

// //         {/* recent deliveries */}
// //         <div style={card}>
// //           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
// //             <h2 style={sectionTitle}>Recent deliveries</h2>
// //             {pillBadge('Latest', { background: '#ede9fe', color: '#7c3aed', border: 'none' })}
// //           </div>
// //           <div style={{ display: 'flex', flexDirection: 'column' }}>
// //             {loading ? (
// //               Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} style={{ height: 52, marginBottom: 8 }} />)
// //             ) : recentActivity.length === 0 ? (
// //               <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No recent deliveries.</p>
// //             ) : (
// //               recentActivity.map((a) => (
// //                 <Link key={a.id} to={`/deliveries/${a.id}`} style={{
// //                   textDecoration: 'none', display: 'block',
// //                   padding: '9px 0', borderBottom: '1px solid #f1f5f9',
// //                 }}>
// //                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
// //                     <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
// //                       <div style={{
// //                         width: 7, height: 7, borderRadius: '50%',
// //                         background: deliveryDotColor(a.status), flexShrink: 0,
// //                       }} />
// //                       <div>
// //                         <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.deliveryNo}</div>
// //                         <div style={{ fontSize: 11, color: '#64748b' }}>{a.customerName}</div>
// //                         <div style={{ fontSize: 10, color: '#94a3b8' }}>{formatDateTime(a.deliveryAt)}</div>
// //                       </div>
// //                     </div>
// //                     <span style={{
// //                       ...badgeStyle(a.status),
// //                       fontSize: 10, fontWeight: 600,
// //                       padding: '2px 8px', borderRadius: 20, flexShrink: 0,
// //                     }}>
// //                       {statusLabel(a.status)}
// //                     </span>
// //                   </div>
// //                 </Link>
// //               ))
// //             )}
// //           </div>
// //         </div>

// //         {/* alerts */}
// //         <div style={darkCard}>
// //           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
// //             <h2 style={sectionTitleLight}>Alerts</h2>
// //             <span style={{
// //               fontSize: 11, fontWeight: 600, padding: '3px 10px',
// //               borderRadius: 20, background: 'rgba(255,255,255,0.18)', color: '#ffffff',
// //             }}>
// //               {alerts.length ? `${alerts.length} active` : 'All clear'}
// //             </span>
// //           </div>

// //           {alerts.length === 0 ? (
// //             <div style={{
// //               textAlign: 'center', padding: '16px 0',
// //               display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
// //             }}>
// //               <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
// //                 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
// //               </svg>
// //               <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>All clear</div>
// //               <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
// //                 No issues need attention right now.
// //               </div>
// //             </div>
// //           ) : (
// //             <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
// //               {alerts.map((alert) => (
// //                 <Link key={alert.id} to={alert.href} style={{
// //                   textDecoration: 'none', display: 'block',
// //                   padding: '9px 11px', borderRadius: 9,
// //                   background: 'rgba(255,255,255,0.1)',
// //                 }}>
// //                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// //                     <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{alert.title}</div>
// //                     <span style={{
// //                       fontSize: 11, fontWeight: 700, padding: '2px 7px',
// //                       borderRadius: 99, background: 'rgba(255,255,255,0.2)', color: '#ffffff',
// //                     }}>{alert.count}</span>
// //                   </div>
// //                   <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
// //                     {alert.description}
// //                   </div>
// //                 </Link>
// //               ))}
// //             </div>
// //           )}

// //           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
// //             <button onClick={() => nav('/products')} style={{
// //               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
// //               padding: '8px 0', borderRadius: 9,
// //               border: '1px solid rgba(255,255,255,0.2)',
// //               background: 'rgba(255,255,255,0.1)',
// //               fontSize: 12, fontWeight: 600, color: '#ffffff', cursor: 'pointer',
// //             }}>
// //               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
// //                 <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
// //                 <line x1="3" y1="6" x2="21" y2="6" />
// //                 <path d="M16 10a4 4 0 01-8 0" />
// //               </svg>
// //               Products
// //             </button>
// //             <button onClick={() => setCreateOpen(true)} style={{
// //               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
// //               padding: '8px 0', borderRadius: 9,
// //               border: '1px solid rgba(255,255,255,0.2)',
// //               background: 'rgba(255,255,255,0.1)',
// //               fontSize: 12, fontWeight: 600, color: '#ffffff', cursor: 'pointer',
// //             }}>
// //               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
// //                 <path d="M12 5v14M5 12h14" />
// //               </svg>
// //               New delivery
// //             </button>
// //           </div>
// //         </div>
// //       </div>

// //       <CreateDeliveryModal
// //         open={createOpen}
// //         onClose={() => setCreateOpen(false)}
// //         onCreated={() => { setCreateOpen(false); void refresh() }}
// //       />
// //     </div>
// //   )
// // }

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
//     return { background: '#e0e7ff', color: '#4338ca' }
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
//   return (
//     <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 115, width: '100%' }}>
//       {values.map((v, i) => {
//         const pct = (v / max) * 100
//         const isPeak = i === peakIndex
//         return (
//           <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
//             <div style={{
//               width: '100%',
//               height: `${Math.max(pct, 3)}%`,
//               background: isPeak ? '#10b981' : '#d1fae5',
//               borderRadius: '4px 4px 0 0',
//               transition: 'height 0.4s ease',
//             }} />
//             <span style={{
//               fontSize: 11,
//               color: isPeak ? '#059669' : '#94a3b8',
//               fontWeight: isPeak ? 700 : 400,
//               whiteSpace: 'nowrap',
//             }}>{labels[i]}</span>
//           </div>
//         )
//       })}
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
//   const { loading, error, refresh, kpis, trend, godownsWithStock, recentActivity, alerts } = useDashboardData()
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
//     { value: kpis.byStatus.upcoming, color: '#34d399' },
//     { value: kpis.byStatus.dispatched, color: '#34d399' },
//     { value: kpis.byStatus.pendingReturn, color: '#fbbf24' },
//     { value: kpis.byStatus.completed, color: 'rgba(255,255,255,0.22)' },
//   ]
//   const donutTotal = kpis.byStatus.upcoming + kpis.byStatus.dispatched + kpis.byStatus.pendingReturn + kpis.byStatus.completed
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
//       padding: '16px 20px 24px',
//       boxSizing: 'border-box',
//       display: 'flex',
//       flexDirection: 'column',
//       gap: 12,
//       fontFamily: 'inherit',
//     }}>

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
//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
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
//             <StatCard tone="neutral" label="Total deliveries today" value={String(kpis.today)} delta={todayDelta}
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 4v4h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>}
//             />
//             <StatCard tone="good" label="Dispatched" value={String(kpis.running)} delta="— Awaiting dispatch"
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>}
//             />
//             <StatCard tone="warn" label="Pending returns" value={String(kpis.pendingReturn)} delta="✓ All clear"
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
//             />
//             <StatCard tone="good" label="Completed" value={String(kpis.completed)} delta={`↗ This week: ${trendTotal} total`}
//               icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
//             />
//           </>
//         )}
//       </div>

//       {/* ── trend + delivery status ── */}
//       <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
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
//                 { label: 'Upcoming', value: kpis.byStatus.upcoming },
//                 { label: 'Dispatched', value: kpis.byStatus.dispatched },
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
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

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
// import { DonutChart, SparkBars } from '../components/charts/MiniCharts'
// import { formatDateTime, formatNumber } from '../lib/format'
// import { Badge } from '../components/ui/Badge'
// import { Button } from '../components/ui/Button'
// import { CardContent, CardHeader, CardTitle, GlassCard, GradientCard, InteractiveCard } from '../components/ui/Card'
// import { PageHeader } from '../components/ui/PageHeader'
// import { StatCard } from '../components/ui/StatCard'
// import { useDashboardData } from '../hooks/useDashboardData'
// import { CreateDeliveryModal } from './Deliveries/CreateDeliveryModal'

// function badgeVariant(status: string) {
//   if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return 'green'
//   if (status === 'PROCESSED' || status === 'UPCOMING') return 'blue'
//   if (status === 'PACKED') return 'slate'
//   if (status === 'RETURN_PICKUP') return 'amber'
//   if (status === 'PENDING_RETURN' || status === 'DELIVERED') return 'amber'
//   if (status === 'COMPLETED') return 'slate'
//   return 'slate'
// }

// function statusLabel(status: string) {
//   const map: Record<string, string> = {
//     PROCESSED: 'Processed',
//     PACKED: 'Packed',
//     OUT_FOR_DELIVERY: 'Out for delivery',
//     RETURN_PICKUP: 'Return pickup',
//     UPCOMING: 'Processed',
//     DISPATCHED: 'Out for delivery',
//     DELIVERED: 'Delivered',
//     PENDING_RETURN: 'Pending return',
//     COMPLETED: 'Completed',
//     CANCELLED: 'Cancelled',
//   }
//   return map[status] ?? status
// }

// function StatSkeleton() {
//   return (
//     <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
//       <div className="h-3 w-24 rounded bg-slate-200" />
//       <div className="mt-3 h-8 w-16 rounded bg-slate-200" />
//     </div>
//   )
// }

// function CardSkeleton({ tall = false }: { tall?: boolean }) {
//   return (
//     <div
//       className={`rounded-2xl border border-slate-200 bg-white/80 p-6 animate-pulse ${tall ? 'min-h-[220px]' : 'min-h-[160px]'}`}
//     >
//       <div className="h-4 w-32 rounded bg-slate-200" />
//       <div className="mt-6 h-24 rounded bg-slate-100" />
//     </div>
//   )
// }

// export function DashboardPage() {
//   const auth = useAuth()
//   const nav = useNavigate()
//   const { loading, error, refresh, kpis, trend, godownsWithStock, recentActivity, alerts } =
//     useDashboardData()
//   const [createOpen, setCreateOpen] = useState(false)

//   if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY') {
//     return <Navigate to="/deliveries" replace />
//   }

//   const trendValues = useMemo(() => trend.map((t) => t.total), [trend])
//   const trendLabels = useMemo(() => trend.map((t) => t.label), [trend])
//   const trendTotal = useMemo(() => trendValues.reduce((a, b) => a + b, 0), [trendValues])
//   const peakIndex = useMemo(() => {
//     if (!trendValues.length) return 0
//     return trendValues.indexOf(Math.max(...trendValues))
//   }, [trendValues])

//   const yesterdayTotal = trendValues.length >= 2 ? trendValues[trendValues.length - 2]! : 0
//   const todayDelta =
//     yesterdayTotal > 0
//       ? `${kpis.today >= yesterdayTotal ? '+' : ''}${kpis.today - yesterdayTotal} vs yesterday`
//       : undefined

//   const donutSegments = useMemo(
//     () => [
//       { label: 'Upcoming', value: kpis.byStatus.upcoming, color: '#60a5fa' },
//       { label: 'Dispatched', value: kpis.byStatus.dispatched, color: '#34d399' },
//       { label: 'PendingReturn', value: kpis.byStatus.pendingReturn, color: '#fbbf24' },
//       { label: 'Completed', value: kpis.byStatus.completed, color: '#e5e7eb' },
//     ],
//     [kpis.byStatus],
//   )

//   return (
//     <div className="fade-in">
//       <PageHeader
//         title="Dashboard"
//         subtitle="Live operations overview — deliveries, stock, returns, and alerts."
//         right={
//           <>
//             <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
//               {loading ? 'Refreshing…' : 'Refresh'}
//             </Button>
//             <Button variant="secondary" onClick={() => nav('/godowns')}>
//               Godowns
//             </Button>
//             <Button variant="primary" onClick={() => setCreateOpen(true)}>
//               Create Delivery
//             </Button>
//           </>
//         }
//       />

//       {error ? (
//         <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
//           <span>{error}</span>
//           <Button variant="secondary" size="sm" onClick={() => void refresh()}>
//             Retry
//           </Button>
//         </div>
//       ) : null}

//       <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
//         {loading ? (
//           <>
//             <StatSkeleton />
//             <StatSkeleton />
//             <StatSkeleton />
//             <StatSkeleton />
//           </>
//         ) : (
//           <>
//             <StatCard
//               label="Total deliveries today"
//               value={`${kpis.today}`}
//               delta={todayDelta}
//               className="hover-lift"
//             />
//             <StatCard label="Dispatched" value={`${kpis.running}`} tone="good" className="hover-lift" />
//             <StatCard
//               label="Pending returns"
//               value={`${kpis.pendingReturn}`}
//               tone="warn"
//               className="hover-lift"
//             />
//             <StatCard label="Completed" value={`${kpis.completed}`} className="hover-lift" />
//           </>
//         )}
//       </div>

//       <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
//         {loading ? (
//           <>
//             <CardSkeleton tall />
//             <CardSkeleton tall />
//           </>
//         ) : (
//           <>
//             <GlassCard className="lg:col-span-2 hover-lift">
//               <CardHeader className="flex items-center justify-between">
//                 <CardTitle className="gradient-text">Daily delivery trend</CardTitle>
//                 <Badge variant="slate" className="bg-primary-100 text-primary-700">
//                   Last 7 days
//                 </Badge>
//               </CardHeader>
//               <CardContent className="flex items-end justify-between gap-6">
//                 <div>
//                   <div className="text-sm text-slate-600">
//                     This week total:{' '}
//                     <span className="font-bold gradient-text">{formatNumber(trendTotal)}</span>
//                   </div>
//                   <div className="mt-1 text-xs text-slate-500">
//                     Peak day: {trend[peakIndex]?.label ?? '—'} ({trend[peakIndex]?.total ?? 0})
//                   </div>
//                 </div>
//                 <SparkBars
//                   values={trendValues.length ? trendValues : [0, 0, 0, 0, 0, 0, 0]}
//                   labels={trendLabels}
//                   highlightIndex={peakIndex}
//                   className="py-2"
//                 />
//               </CardContent>
//             </GlassCard>

//             <GradientCard variant="primary" className="hover-lift">
//               <CardHeader className="flex items-center justify-between border-0">
//                 <CardTitle className="text-white">Delivery status</CardTitle>
//                 <Badge className="bg-white/20 text-white border-white/30 animate-pulse">Today</Badge>
//               </CardHeader>
//               <CardContent className="flex items-center justify-between gap-4">
//                 <DonutChart segments={donutSegments} />
//                 <div className="space-y-2 text-sm text-white">
//                   <div className="flex items-center justify-between gap-4">
//                     <span className="text-white/80">Upcoming</span>
//                     <span className="font-bold text-white">{kpis.byStatus.upcoming}</span>
//                   </div>
//                   <div className="flex items-center justify-between gap-4">
//                     <span className="text-white/80">Dispatched</span>
//                     <span className="font-bold text-white">{kpis.byStatus.dispatched}</span>
//                   </div>
//                   <div className="flex items-center justify-between gap-4">
//                     <span className="text-white/80">Pending return</span>
//                     <span className="font-bold text-white">{kpis.byStatus.pendingReturn}</span>
//                   </div>
//                   <div className="flex items-center justify-between gap-4">
//                     <span className="text-white/80">Completed</span>
//                     <span className="font-bold text-white">{kpis.byStatus.completed}</span>
//                   </div>
//                 </div>
//               </CardContent>
//             </GradientCard>
//           </>
//         )}
//       </div>

//       <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
//         {loading ? (
//           <>
//             <CardSkeleton />
//             <CardSkeleton />
//             <CardSkeleton />
//           </>
//         ) : (
//           <>
//             <InteractiveCard className="hover-lift">
//               <CardHeader className="flex items-center justify-between">
//                 <CardTitle className="gradient-text">Godown stock overview</CardTitle>
//                 <Button variant="ghost" size="sm" onClick={() => nav('/godowns')} className="hover:bg-primary-50">
//                   View all
//                 </Button>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 {godownsWithStock.length === 0 ? (
//                   <p className="text-sm text-slate-500">No godowns configured yet.</p>
//                 ) : (
//                   godownsWithStock.slice(0, 6).map((g, index) => (
//                     <Link
//                       key={g.id}
//                       to={`/godowns/${g.id}`}
//                       className={`flex items-center justify-between gap-4 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 hover:border-primary-200 transition-all duration-300 slide-up`}
//                       style={{ animationDelay: `${index * 100}ms` }}
//                     >
//                       <div className="min-w-0">
//                         <div className="truncate text-sm font-bold text-slate-900 gradient-text">{g.name}</div>
//                         <div className="text-xs text-slate-500">
//                           {g.city || '—'} &#8226; Manager: {g.manager || '—'}
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-sm font-bold gradient-text">{formatNumber(g.stockQty)}</div>
//                         <div className="text-xs text-slate-500">units</div>
//                       </div>
//                     </Link>
//                   ))
//                 )}
//               </CardContent>
//             </InteractiveCard>

//             <GlassCard className="hover-lift">
//               <CardHeader className="flex items-center justify-between">
//                 <CardTitle className="gradient-text">Recent deliveries</CardTitle>
//                 <Badge variant="slate" className="bg-accent-100 text-accent-700 animate-pulse">
//                   Latest
//                 </Badge>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 {recentActivity.length === 0 ? (
//                   <p className="text-sm text-slate-500">No recent deliveries.</p>
//                 ) : (
//                   recentActivity.map((a, index) => (
//                     <Link
//                       key={a.id}
//                       to={`/deliveries/${a.id}`}
//                       className={`block rounded-xl border border-slate-100/50 bg-white/50 backdrop-blur-sm p-3 hover:bg-white/70 transition-all duration-300 slide-up hover:shadow-md`}
//                       style={{ animationDelay: `${index * 100}ms` }}
//                     >
//                       <div className="flex items-center justify-between gap-2">
//                         <span className="text-sm font-medium text-slate-900">{a.deliveryNo}</span>
//                         <Badge variant={badgeVariant(a.status)}>{statusLabel(a.status)}</Badge>
//                       </div>
//                       <div className="mt-1 text-sm text-slate-700">{a.customerName}</div>
//                       <div className="mt-1 text-xs text-slate-500">{formatDateTime(a.deliveryAt)}</div>
//                     </Link>
//                   ))
//                 )}
//               </CardContent>
//             </GlassCard>

//             <GradientCard variant="primary" className="hover-lift">
//               <CardHeader className="flex items-center justify-between border-0">
//                 <CardTitle className="text-white">Alerts</CardTitle>
//                 <Badge className="bg-white/20 text-white border-white/30 animate-pulse">
//                   {alerts.length ? `${alerts.length} active` : 'All clear'}
//                 </Badge>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 {alerts.length === 0 ? (
//                   <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 text-center">
//                     <div className="text-sm font-bold text-white">All clear</div>
//                     <div className="mt-1 text-xs text-white/80">No issues need attention right now.</div>
//                   </div>
//                 ) : (
//                   alerts.map((alert) => (
//                     <Link
//                       key={alert.id}
//                       to={alert.href}
//                       className="block rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-3 hover:bg-white/20 transition-all duration-300"
//                     >
//                       <div className="flex items-center justify-between gap-2">
//                         <div className="text-sm font-bold text-white">{alert.title}</div>
//                         <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold text-white">
//                           {alert.count}
//                         </span>
//                       </div>
//                       <div className="mt-1 text-xs text-white/80">{alert.description}</div>
//                     </Link>
//                   ))
//                 )}

//                 <div className="grid grid-cols-2 gap-3 pt-2">
//                   <Button
//                     variant="secondary"
//                     onClick={() => nav('/products')}
//                     className="bg-white/20 hover:bg-white/30 text-white border-white/30"
//                   >
//                     Products
//                   </Button>
//                   <Button
//                     variant="secondary"
//                     onClick={() => setCreateOpen(true)}
//                     className="bg-white/20 hover:bg-white/30 text-white border-white/30"
//                   >
//                     New delivery
//                   </Button>
//                 </div>
//               </CardContent>
//             </GradientCard>
//           </>
//         )}
//       </div>

//       <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
//         {loading ? (
//           <>
//             <StatSkeleton />
//             <StatSkeleton />
//             <StatSkeleton />
//           </>
//         ) : (
//           <>
//             <StatCard
//               label="Total godown stock"
//               value={formatNumber(kpis.totalStock)}
//               className="hover-lift fade-in"
//             />
//             <StatCard
//               label="Damaged items (today)"
//               value={formatNumber(kpis.damaged)}
//               tone="warn"
//               className="hover-lift fade-in"
//             />
//             <StatCard
//               label="Lost items (today)"
//               value={formatNumber(kpis.lost)}
//               tone="bad"
//               className="hover-lift fade-in"
//             />
//           </>
//         )}
//       </div>

//       <CreateDeliveryModal
//         open={createOpen}
//         onClose={() => setCreateOpen(false)}
//         onCreated={() => {
//           setCreateOpen(false)
//           void refresh()
//         }}
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
//     return { background: '#e0e7ff', color: '#4338ca' }
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
//     PROCESSED: 'Processed',
//     PACKED: 'Packed',
//     OUT_FOR_DELIVERY: 'Out for delivery',
//     RETURN_PICKUP: 'Return pickup',
//     UPCOMING: 'Upcoming',
//     DISPATCHED: 'Dispatched',
//     DELIVERED: 'Delivered',
//     PENDING_RETURN: 'Pending return',
//     COMPLETED: 'Completed',
//     CANCELLED: 'Cancelled',
//     RETURNED: 'Returned',
//     PENDING: 'Pending',
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

// function Skeleton({ style }: { style?: React.CSSProperties }) {
//   return (
//     <div
//       style={{
//         borderRadius: 8,
//         background: '#e2e8f0',
//         animation: 'pulse 1.5s ease-in-out infinite',
//         ...style,
//       }}
//     />
//   )
// }

// // ── bar chart ──────────────────────────────────────────────────────────────

// function BarChart({ values, labels, peakIndex }: { values: number[]; labels: string[]; peakIndex: number }) {
//   const max = Math.max(...values, 1)
//   return (
//     <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, width: '100%' }}>
//       {values.map((v, i) => {
//         const pct = (v / max) * 100
//         const isPeak = i === peakIndex
//         return (
//           <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
//             <div
//               style={{
//                 width: '100%',
//                 height: `${Math.max(pct, 3)}%`,
//                 background: isPeak ? '#10b981' : '#d1fae5',
//                 borderRadius: '5px 5px 0 0',
//                 transition: 'height 0.4s ease',
//               }}
//             />
//             <span style={{
//               fontSize: 11,
//               color: isPeak ? '#059669' : '#94a3b8',
//               fontWeight: isPeak ? 700 : 400,
//               whiteSpace: 'nowrap',
//             }}>
//               {labels[i]}
//             </span>
//           </div>
//         )
//       })}
//     </div>
//   )
// }

// // ── donut chart ────────────────────────────────────────────────────────────

// function DonutChart({ segments, total }: { segments: { value: number; color: string }[]; total: number }) {
//   const size = 86
//   const r = 30
//   const cx = size / 2
//   const cy = size / 2
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
//         <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={13} />
//         {arcs.map((a, i) => (
//           <circle
//             key={i}
//             cx={cx}
//             cy={cy}
//             r={r}
//             fill="none"
//             stroke={a.color}
//             strokeWidth={13}
//             strokeDasharray={`${a.dash} ${circ - a.dash}`}
//             strokeDashoffset={-a.offset}
//           />
//         ))}
//       </svg>
//       <div style={{
//         position: 'absolute', inset: 0,
//         display: 'flex', alignItems: 'center', justifyContent: 'center',
//         fontSize: 15, fontWeight: 700, color: '#fff',
//       }}>
//         {total}
//       </div>
//     </div>
//   )
// }

// // ── main component ─────────────────────────────────────────────────────────

// export function DashboardPage() {
//   const auth = useAuth()
//   const nav = useNavigate()
//   const { loading, error, refresh, kpis, trend, godownsWithStock, recentActivity, alerts } =
//     useDashboardData()
//   const [createOpen, setCreateOpen] = useState(false)

//   if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY') {
//     return <Navigate to="/deliveries" replace />
//   }

//   const trendValues = useMemo(() => trend.map((t) => t.total), [trend])
//   const trendLabels = useMemo(() => trend.map((t) => t.label), [trend])
//   const trendTotal = useMemo(() => trendValues.reduce((a, b) => a + b, 0), [trendValues])
//   const peakIndex = useMemo(() => {
//     if (!trendValues.length) return 0
//     return trendValues.indexOf(Math.max(...trendValues))
//   }, [trendValues])

//   const yesterdayTotal = trendValues.length >= 2 ? trendValues[trendValues.length - 2]! : 0
//   const todayDelta =
//     yesterdayTotal > 0
//       ? `${kpis.today >= yesterdayTotal ? '+' : ''}${kpis.today - yesterdayTotal} vs yesterday`
//       : '— No change from yesterday'

//   const donutSegments = [
//     { value: kpis.byStatus.upcoming, color: '#34d399' },
//     { value: kpis.byStatus.dispatched, color: '#34d399' },
//     { value: kpis.byStatus.pendingReturn, color: '#fbbf24' },
//     { value: kpis.byStatus.completed, color: 'rgba(255,255,255,0.22)' },
//   ]
//   const donutTotal =
//     kpis.byStatus.upcoming + kpis.byStatus.dispatched +
//     kpis.byStatus.pendingReturn + kpis.byStatus.completed

//   const maxStock = Math.max(...godownsWithStock.map((g) => g.stockQty), 1)

//   // ── shared styles ──────────────────────────────────────────────────────

//   const card: React.CSSProperties = {
//     background: '#ffffff',
//     border: '1px solid #e8eaf0',
//     borderRadius: 14,
//     padding: '18px 20px',
//   }

//   const darkCard: React.CSSProperties = {
//     background: '#065f46',
//     borderRadius: 14,
//     padding: '18px 20px',
//   }

//   const sectionTitle: React.CSSProperties = {
//     fontSize: 14,
//     fontWeight: 700,
//     color: '#0f172a',
//     margin: 0,
//   }

//   const sectionTitleLight: React.CSSProperties = {
//     fontSize: 14,
//     fontWeight: 700,
//     color: '#ffffff',
//     margin: 0,
//   }

//   const pillBadge = (text: string, style?: React.CSSProperties): React.ReactNode => (
//     <span style={{
//       fontSize: 11,
//       fontWeight: 500,
//       padding: '3px 10px',
//       borderRadius: 20,
//       background: '#f1f5f9',
//       color: '#64748b',
//       border: '1px solid #e8eaf0',
//       ...style,
//     }}>
//       {text}
//     </span>
//   )

//   // ── render ────────────────────────────────────────────────────────────

//   return (
//     // KEY FIX: margin:0, padding flush, no outer gaps, fills entire content area
//     <div style={{
//       margin: 0,
//       padding: '16px 20px 20px',
//       background: '#edf0f8',
//       minHeight: '100%',
//       width: '100%',
//       boxSizing: 'border-box',
//       display: 'flex',
//       flexDirection: 'column',
//       gap: 12,
//     }}>

//       {/* ── page header ── */}
//       <div style={{
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         flexWrap: 'wrap',
//         gap: 10,
//       }}>
//         <div>
//           <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>Dashboard</h1>
//           <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, marginBottom: 0 }}>
//             Live operations overview — deliveries, stock, returns, and alerts.
//           </p>
//         </div>
//         <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
//           {/* <button
//             onClick={() => void refresh()}
//             disabled={loading}
//             style={{
//               display: 'flex', alignItems: 'center', gap: 6,
//               padding: '8px 16px', borderRadius: 10,
//               border: '1px solid #e2e8f0', background: '#ffffff',
//               fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
//               whiteSpace: 'nowrap',
//             }}
//           >
//             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
//               <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
//               <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
//             </svg>
//             {loading ? 'Refreshing…' : 'Refresh'}
//           </button> */}
//           <button
//             onClick={() => nav('/godowns')}
//             style={{
//               display: 'flex', alignItems: 'center', gap: 6,
//               padding: '8px 16px', borderRadius: 10,
//               border: '1px solid #e2e8f0', background: '#ffffff',
//               fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
//               whiteSpace: 'nowrap',
//             }}
//           >
//             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//               <rect x="2" y="7" width="20" height="14" rx="2" />
//               <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
//             </svg>
//             Godowns
//           </button>
//           <button
//             onClick={() => setCreateOpen(true)}
//             style={{
//               display: 'flex', alignItems: 'center', gap: 6,
//               padding: '8px 18px', borderRadius: 10,
//               border: 'none', background: '#059669',
//               fontSize: 13, fontWeight: 600, color: '#ffffff', cursor: 'pointer',
//               whiteSpace: 'nowrap',
//             }}
//           >
//             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
//               <path d="M12 5v14M5 12h14" />
//             </svg>
//              Create Delivery
//           </button>
//         </div>
//       </div>

//       {/* ── error banner ── */}
//       {error && (
//         <div style={{
//           padding: '10px 16px', borderRadius: 10,
//           background: '#fef2f2', color: '#b91c1c', fontSize: 13,
//           display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//           border: '1px solid #fecaca',
//         }}>
//           <span>{error}</span>
//           <button onClick={() => void refresh()} style={{
//             background: 'none', border: 'none', color: '#b91c1c', fontWeight: 600, cursor: 'pointer',
//           }}>Retry</button>
//         </div>
//       )}

//       {/* ── 4 stat cards ── */}
//       <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
//         {loading ? (
//           Array.from({ length: 4 }).map((_, i) => (
//             <div key={i} style={{ ...card, minHeight: 160 }}>
//               <Skeleton style={{ width: 40, height: 40, marginBottom: 12 }} />
//               <Skeleton style={{ width: '60%', height: 12, marginBottom: 10 }} />
//               <Skeleton style={{ width: '40%', height: 28, marginBottom: 8 }} />
//               <Skeleton style={{ width: '70%', height: 10 }} />
//             </div>
//           ))
//         ) : (
//           <>
//             <StatCard
//               tone="neutral"
//               label="Total deliveries today"
//               value={String(kpis.today)}
//               delta={todayDelta}
//               icon={
//                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
//                   <rect x="1" y="3" width="15" height="13" rx="1" />
//                   <path d="M16 8h4l3 4v4h-7V8z" />
//                   <circle cx="5.5" cy="18.5" r="2.5" />
//                   <circle cx="18.5" cy="18.5" r="2.5" />
//                 </svg>
//               }
//             />
//             <StatCard
//               tone="good"
//               label="Dispatched"
//               value={String(kpis.running)}
//               delta="— Awaiting dispatch"
//               icon={
//                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
//                   <path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" />
//                 </svg>
//               }
//             />
//             <StatCard
//               tone="warn"
//               label="Pending returns"
//               value={String(kpis.pendingReturn)}
//               delta="✓ All clear"
//               icon={
//                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
//                   <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
//                   <polyline points="9 22 9 12 15 12 15 22" />
//                 </svg>
//               }
//             />
//             <StatCard
//               tone="good"
//               label="Completed"
//               value={String(kpis.completed)}
//               delta={`↗ This week: ${trendTotal} total`}
//               icon={
//                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
//                   <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
//                   <polyline points="22 4 12 14.01 9 11.01" />
//                 </svg>
//               }
//             />
//           </>
//         )}
//       </div>

//       {/* ── trend + delivery status ── */}
//       <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr]" style={{ gap: 12 }}>
//         {/* trend */}
//         <div style={card}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
//             <h2 style={sectionTitle}>Daily delivery trend</h2>
//             {pillBadge('Last 7 days')}
//           </div>
//           <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
//             This week total:{' '}
//             <span style={{ fontWeight: 700, color: '#059669' }}>{trendTotal}</span>
//             {'   '}Peak day:{' '}
//             <span style={{ fontWeight: 700, color: '#059669' }}>
//               {trend[peakIndex]?.label ?? '—'} ({trend[peakIndex]?.total ?? 0})
//             </span>
//           </div>
//           {loading
//             ? <Skeleton style={{ height: 120, width: '100%' }} />
//             : <BarChart
//                 values={trendValues.length ? trendValues : [0, 0, 0, 0, 0, 0, 0]}
//                 labels={trendLabels.length ? trendLabels : ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed']}
//                 peakIndex={peakIndex}
//               />
//           }
//         </div>

//         {/* delivery status */}
//         <div style={darkCard}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
//             <h2 style={sectionTitleLight}>Delivery status</h2>
//             <span style={{
//               fontSize: 11, fontWeight: 600, padding: '3px 10px',
//               borderRadius: 20, background: 'rgba(255,255,255,0.18)', color: '#ffffff',
//             }}>Today</span>
//           </div>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
//             {loading
//               ? <Skeleton style={{ width: 86, height: 86, borderRadius: '50%', flexShrink: 0 }} />
//               : <DonutChart segments={donutSegments} total={donutTotal} />
//             }
//             <div style={{ flex: 1 }}>
//               {[
//                 { label: 'Upcoming', value: kpis.byStatus.upcoming },
//                 { label: 'Dispatched', value: kpis.byStatus.dispatched },
//                 { label: 'Pending return', value: kpis.byStatus.pendingReturn },
//                 { label: 'Completed', value: kpis.byStatus.completed },
//               ].map((row) => (
//                 <div key={row.label} style={{
//                   display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                   fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 9,
//                 }}>
//                   <span>{row.label}</span>
//                   <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 13 }}>{row.value}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ── bottom row ── */}
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
//             {loading ? (
//               Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} style={{ height: 36 }} />)
//             ) : godownsWithStock.length === 0 ? (
//               <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No godowns configured yet.</p>
//             ) : (
//               godownsWithStock.slice(0, 6).map((g, index) => (
//                 <Link key={g.id} to={`/godowns/${g.id}`} style={{ textDecoration: 'none' }}>
//                   <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                       <div style={{
//                         width: 8, height: 8, borderRadius: '50%',
//                         background: dotColor(index), flexShrink: 0, marginTop: 2,
//                       }} />
//                       <div>
//                         <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{g.name}</div>
//                         <div style={{ fontSize: 11, color: '#94a3b8' }}>
//                           {g.city || '—'} · Manager: {g.manager || '—'}
//                         </div>
//                       </div>
//                     </div>
//                     <div style={{ textAlign: 'right', flexShrink: 0 }}>
//                       <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{formatNumber(g.stockQty)}</div>
//                       <div style={{ fontSize: 10, color: '#94a3b8' }}>units</div>
//                     </div>
//                   </div>
//                   <div style={{
//                     marginTop: 5, marginLeft: 16, height: 3,
//                     borderRadius: 99, background: '#f1f5f9', overflow: 'hidden',
//                   }}>
//                     <div style={{
//                       height: '100%',
//                       width: `${(g.stockQty / maxStock) * 100}%`,
//                       background: progressColor(index), borderRadius: 99,
//                     }} />
//                   </div>
//                 </Link>
//               ))
//             )}
//           </div>
//         </div>

//         {/* recent deliveries */}
//         <div style={card}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
//             <h2 style={sectionTitle}>Recent deliveries</h2>
//             {pillBadge('Latest', { background: '#ede9fe', color: '#7c3aed', border: 'none' })}
//           </div>
//           <div style={{ display: 'flex', flexDirection: 'column' }}>
//             {loading ? (
//               Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} style={{ height: 52, marginBottom: 8 }} />)
//             ) : recentActivity.length === 0 ? (
//               <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No recent deliveries.</p>
//             ) : (
//               recentActivity.map((a) => (
//                 <Link key={a.id} to={`/deliveries/${a.id}`} style={{
//                   textDecoration: 'none', display: 'block',
//                   padding: '9px 0', borderBottom: '1px solid #f1f5f9',
//                 }}>
//                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                       <div style={{
//                         width: 7, height: 7, borderRadius: '50%',
//                         background: deliveryDotColor(a.status), flexShrink: 0,
//                       }} />
//                       <div>
//                         <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.deliveryNo}</div>
//                         <div style={{ fontSize: 11, color: '#64748b' }}>{a.customerName}</div>
//                         <div style={{ fontSize: 10, color: '#94a3b8' }}>{formatDateTime(a.deliveryAt)}</div>
//                       </div>
//                     </div>
//                     <span style={{
//                       ...badgeStyle(a.status),
//                       fontSize: 10, fontWeight: 600,
//                       padding: '2px 8px', borderRadius: 20, flexShrink: 0,
//                     }}>
//                       {statusLabel(a.status)}
//                     </span>
//                   </div>
//                 </Link>
//               ))
//             )}
//           </div>
//         </div>

//         {/* alerts */}
//         <div style={darkCard}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
//             <h2 style={sectionTitleLight}>Alerts</h2>
//             <span style={{
//               fontSize: 11, fontWeight: 600, padding: '3px 10px',
//               borderRadius: 20, background: 'rgba(255,255,255,0.18)', color: '#ffffff',
//             }}>
//               {alerts.length ? `${alerts.length} active` : 'All clear'}
//             </span>
//           </div>

//           {alerts.length === 0 ? (
//             <div style={{
//               textAlign: 'center', padding: '16px 0',
//               display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
//             }}>
//               <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
//                 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
//               </svg>
//               <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>All clear</div>
//               <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
//                 No issues need attention right now.
//               </div>
//             </div>
//           ) : (
//             <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
//               {alerts.map((alert) => (
//                 <Link key={alert.id} to={alert.href} style={{
//                   textDecoration: 'none', display: 'block',
//                   padding: '9px 11px', borderRadius: 9,
//                   background: 'rgba(255,255,255,0.1)',
//                 }}>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{alert.title}</div>
//                     <span style={{
//                       fontSize: 11, fontWeight: 700, padding: '2px 7px',
//                       borderRadius: 99, background: 'rgba(255,255,255,0.2)', color: '#ffffff',
//                     }}>{alert.count}</span>
//                   </div>
//                   <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
//                     {alert.description}
//                   </div>
//                 </Link>
//               ))}
//             </div>
//           )}

//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
//             <button onClick={() => nav('/products')} style={{
//               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
//               padding: '8px 0', borderRadius: 9,
//               border: '1px solid rgba(255,255,255,0.2)',
//               background: 'rgba(255,255,255,0.1)',
//               fontSize: 12, fontWeight: 600, color: '#ffffff', cursor: 'pointer',
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
//               border: '1px solid rgba(255,255,255,0.2)',
//               background: 'rgba(255,255,255,0.1)',
//               fontSize: 12, fontWeight: 600, color: '#ffffff', cursor: 'pointer',
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
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 115, width: '100%' }}>
      {values.map((v, i) => {
        const pct = (v / max) * 100
        const isPeak = i === peakIndex
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: '100%',
              height: `${Math.max(pct, 3)}%`,
              background: isPeak ? '#10b981' : '#d1fae5',
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.4s ease',
            }} />
            <span style={{
              fontSize: 11,
              color: isPeak ? '#059669' : '#94a3b8',
              fontWeight: isPeak ? 700 : 400,
              whiteSpace: 'nowrap',
            }}>{labels[i]}</span>
          </div>
        )
      })}
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

// ── main ───────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const auth = useAuth()
  const nav = useNavigate()
  const { loading, error, refresh, kpis, trend, godownsWithStock, recentActivity, alerts } = useDashboardData()
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
    { value: kpis.byStatus.upcoming, color: '#34d399' },
    { value: kpis.byStatus.dispatched, color: '#34d399' },
    { value: kpis.byStatus.pendingReturn, color: '#fbbf24' },
    { value: kpis.byStatus.completed, color: 'rgba(255,255,255,0.22)' },
  ]
  const donutTotal = kpis.byStatus.upcoming + kpis.byStatus.dispatched + kpis.byStatus.pendingReturn + kpis.byStatus.completed
  const maxStock = Math.max(...godownsWithStock.map((g) => g.stockQty), 1)

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
    /*
      padding: '16px 20px 24px' — page owns its own spacing.
      No extra margin. Fills the full content area provided by AppShell.
    */
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
            <StatCard tone="neutral" label="All deliveries" value={String(kpis.today)} delta={todayDelta}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 4v4h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>}
            />
            <StatCard tone="good" label="Pending / Dispatched" value={String(kpis.running)} delta="Processed + out for delivery"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>}
            />
            <StatCard tone="warn" label="Pending returns" value={String(kpis.pendingReturn)} delta="Delivered + awaiting return"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
            />
            <StatCard tone="good" label="Completed" value={String(kpis.completed)} delta={`↗ This week: ${trendTotal} total`}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
            />
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
                { label: 'Upcoming', value: kpis.byStatus.upcoming },
                { label: 'Dispatched', value: kpis.byStatus.dispatched },
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