
// import { Fragment, useEffect, useMemo, useState } from 'react'
// import { Link, useNavigate, useSearchParams } from 'react-router-dom'
// import { formatDateTime } from '../../lib/format'
// import { apiFetch } from '../../lib/api'
// import { getToken, useAuth } from '../../auth/store'
// import { DeliveryStatusSelect } from '../../components/delivery/DeliveryStatusSelect'
// import { DeliveryRowActions } from '../../components/delivery/DeliveryRowActions'
// import { GodownDeliveryWorkflow } from '../../components/delivery/GodownDeliveryWorkflow'
// import type { DeliveryStatusPatch } from '../../components/delivery/DeliveryStatusSelect'
// import { CreateDeliveryModal } from './CreateDeliveryModal'
// import { DriverDeliveriesDashboard } from '../../components/delivery/DriverDeliveriesDashboard'

// type Tab =
//   | 'all'
//   | 'PROCESSED'
//   | 'PACKED'
//   | 'OUT_FOR_DELIVERY'
//   | 'DELIVERED'
//   | 'RETURN_PICKUP'
//   | 'PENDING_RETURN'
//   | 'COMPLETED'

// type DeliveryRow = {
//   id: string
//   deliveryNo: string
//   customerName: string
//   siteName?: string
//   siteAddress?: string
//   status: string
//   vehicleLabel?: string
//   returnPickupVehicleLabel?: string
//   deliveryAt: string
//   fromGodownId?: string
//   billerUserId?: string
//   dispatchedTagIds?: string[]
//   pickedUpTagIds?: string[]
//   deliveredTagIds?: string[]
//   returnPickedUpTagIds?: string[]
//   returnedTagIds?: string[]
//   damagedTagIds?: string[]
//   lostTagIds?: string[]
//   lines?: Array<{
//     productId: string
//     qty: number
//     dispatchedQty?: number
//     returnedQty?: number
//   }>
//   qtyProgress?: { dispatchComplete?: boolean }
//   scanProgress?: { dispatchComplete?: boolean }
//   deliveryVerifiedAt?: string
//   billerReturnSubmittedAt?: string
//   godownNames?: string[]
//   primaryGodownName?: string
//   linesSummary?: Array<{
//     productId: string
//     particulars?: string
//     sku?: string
//     qty: number
//     godownName?: string
//   }>
//   productCount?: number
//   totalQty?: number
// }

// function formatGodownLabel(names?: string[], primary?: string): string {
//   if (!names?.length) return primary || '—'
//   if (names.length === 1) return names[0]
//   if (names.length === 2) return `${names[0]}, ${names[1]}`
//   return `${names[0]}, ${names[1]} +${names.length - 2}`
// }

// function DeliveryProductsPanel({ lines }: { lines: DeliveryRow['linesSummary'] }) {
//   if (!lines?.length) {
//     return <div style={{ fontSize: 12, color: '#94a3b8', padding: 12 }}>No products on this delivery.</div>
//   }
//   return (
//     <div style={{ overflowX: 'auto' }}>
//       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
//         <thead>
//           <tr>
//             {['Product', 'Godown', 'Qty'].map((h) => (
//               <th
//                 key={h}
//                 style={{
//                   padding: '8px 12px',
//                   fontSize: 11,
//                   fontWeight: 700,
//                   color: '#047857',
//                   textTransform: 'uppercase',
//                   letterSpacing: '0.06em',
//                   textAlign: h === 'Qty' ? 'right' : 'left',
//                   borderBottom: '1px solid #bbf7d0',
//                 }}
//               >
//                 {h}
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {lines.map((line) => (
//             <tr key={line.productId}>
//               <td style={{ padding: '8px 12px', fontSize: 13, color: '#0f172a' }}>
//                 {line.particulars || line.sku || line.productId}
//                 {line.sku && line.particulars ? (
//                   <span style={{ display: 'block', fontSize: 11, color: '#94a3b8' }}>{line.sku}</span>
//                 ) : null}
//               </td>
//               <td style={{ padding: '8px 12px', fontSize: 13, color: '#64748b' }}>{line.godownName || '—'}</td>
//               <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>
//                 {line.qty}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// // ── icons ──────────────────────────────────────────────────────────────────

// function SearchIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="15" height="15" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
//       <circle cx="11" cy="11" r="7" />
//       <path d="M16.5 16.5 21 21" />
//     </svg>
//   )
// }

// function RefreshIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
//       <path d="M23 4v6h-6" />
//       <path d="M1 20v-6h6" />
//       <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
//     </svg>
//   )
// }

// // ── action icon button ─────────────────────────────────────────────────────

// // function IconBtn({
// //   children,
// //   title,
// //   onClick,
// //   danger = false,
// // }: {
// //   children: React.ReactNode
// //   title: string
// //   onClick?: () => void
// //   danger?: boolean
// // }) {
// //   return (
// //     <button
// //       type="button"
// //       title={title}
// //       onClick={onClick}
// //       style={{
// //         display: 'inline-flex',
// //         alignItems: 'center',
// //         justifyContent: 'center',
// //         width: 34,
// //         height: 34,
// //         borderRadius: 9,
// //         border: '1px solid #e2e8f0',
// //         background: '#fff',
// //         color: danger ? '#dc2626' : '#64748b',
// //         cursor: 'pointer',
// //         transition: 'all 0.15s',
// //         flexShrink: 0,
// //       }}
// //       onMouseEnter={(e) => {
// //         const el = e.currentTarget as HTMLElement
// //         if (danger) {
// //           el.style.background = '#fef2f2'
// //           el.style.borderColor = '#fecaca'
// //           el.style.color = '#dc2626'
// //         } else {
// //           el.style.background = '#f0eeff'
// //           el.style.borderColor = '#c4b5fd'
// //           el.style.color = '#059669'
// //         }
// //       }}
// //       onMouseLeave={(e) => {
// //         const el = e.currentTarget as HTMLElement
// //         el.style.background = '#fff'
// //         el.style.borderColor = '#e2e8f0'
// //         el.style.color = danger ? '#dc2626' : '#64748b'
// //       }}
// //     >
// //       {children}
// //     </button>
// //   )
// // }

// // ── main component ─────────────────────────────────────────────────────────

// export function DeliveriesListPage() {
//   const auth = useAuth()
//   const nav = useNavigate()
//   const [searchParams] = useSearchParams()
//   const statusFromUrl = searchParams.get('status') as Tab | null

//   const validTabs: Tab[] = ['all','PROCESSED','PACKED','OUT_FOR_DELIVERY','DELIVERED','RETURN_PICKUP','PENDING_RETURN','COMPLETED']

//   const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
//   const [error, setError] = useState<string | null>(null)
//   const [tab, setTab] = useState<Tab>(
//     statusFromUrl && validTabs.includes(statusFromUrl) ? statusFromUrl : 'all'
//   )
//   const [q, setQ] = useState('')
//   const [createOpen, setCreateOpen] = useState(false)
//   const [editDeliveryId, setEditDeliveryId] = useState<string | null>(null)
//   const [loading, setLoading] = useState(false)
//   const [successMessage, setSuccessMessage] = useState<string | null>(null)
//   const [expandedId, setExpandedId] = useState<string | null>(null)

//   const canCreate =
//     auth.status === 'authenticated' &&
//     (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')

//   const isGodownUser = auth.status === 'authenticated' && auth.user.role === 'GODOWN'
//   const godownUnlinked = isGodownUser && auth.status === 'authenticated' && !auth.user.godownId

//   const removeFromList = (id: string) =>
//     setDeliveries((prev) => prev.filter((r) => r.id !== id))

//   const patchDeliveryRow = (id: string, patch: Partial<DeliveryRow>) =>
//     setDeliveries((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

//   const handleStatusUpdated = (id: string, patch: DeliveryStatusPatch) => {
//     patchDeliveryRow(id, patch)
//     loadDeliveries()
//   }

//   const handleWorkflowUpdated = (id: string, patch?: Partial<DeliveryRow>) => {
//     if (patch) patchDeliveryRow(id, patch)
//     loadDeliveries()
//   }

//   const loadDeliveries = () => {
//     const token = getToken()
//     if (!token) return
//     setLoading(true)
//     setError(null)
//     apiFetch<DeliveryRow[]>('/deliveries?limit=200', { token })
//       .then(setDeliveries)
//       .catch((e: unknown) =>
//         setError(e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Failed to load deliveries')
//       )
//       .finally(() => setLoading(false))
//   }

//   useEffect(() => { loadDeliveries() }, [])

//   const rows = useMemo(() => {
//     const s = q.trim().toLowerCase()
//     return deliveries.filter((d) => {
//       if (tab !== 'all' && d.status !== tab) return false
//       if (!s) return true
//       const godownMatch = d.godownNames?.some((n) => n.toLowerCase().includes(s)) ?? false
//       const productMatch =
//         d.linesSummary?.some(
//           (l) =>
//             (l.particulars?.toLowerCase().includes(s) ?? false) ||
//             (l.sku?.toLowerCase().includes(s) ?? false),
//         ) ?? false
//       return (
//         d.deliveryNo.toLowerCase().includes(s) ||
//         d.customerName.toLowerCase().includes(s) ||
//         (d.siteName?.toLowerCase().includes(s) ?? false) ||
//         (d.siteAddress?.toLowerCase().includes(s) ?? false) ||
//         godownMatch ||
//         productMatch
//       )
//     })
//   }, [deliveries, q, tab])

//   const tabs: Array<{ id: Tab; label: string }> = [
//     { id: 'all', label: 'All' },
//     { id: 'PROCESSED', label: 'Processed' },
//     { id: 'PACKED', label: 'Packed' },
//     { id: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
//     { id: 'DELIVERED', label: 'Delivered' },
//     { id: 'RETURN_PICKUP', label: 'Return pickup' },
//     { id: 'PENDING_RETURN', label: 'Pending return' },
//     { id: 'COMPLETED', label: 'Completed' },
//   ]

//   if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY') {
//     return <DriverDeliveriesDashboard />
//   }

//   // ── column header style ──────────────────────────────────────────────────

//   const colHead: React.CSSProperties = {
//     padding: '10px 16px',
//     fontSize: 11,
//     fontWeight: 700,
//     color: '#94a3b8',
//     textTransform: 'uppercase',
//     letterSpacing: '0.07em',
//     textAlign: 'left',
//     whiteSpace: 'nowrap',
//     borderBottom: '1px solid #f1f5f9',
//     background: 'transparent',
//   }

//   // ── render ────────────────────────────────────────────────────────────────

//   return (
//     // AppShell provides 20px 24px padding — no extra wrapper needed
//     <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 20 }}>

//       {/* ── PAGE HEADER ── */}
//       <div style={{
//         display: 'flex', alignItems: 'flex-start',
//         justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
//       }}>
//         <div>
//           <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Delivery Manager</h1>
//           <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
//             Manage customer deliveries, schedules and dispatch workflow.
//           </p>
//         </div>

//         {canCreate && (
//           <button
//             onClick={() => setCreateOpen(true)}
//             style={{
//               display: 'inline-flex', alignItems: 'center', gap: 8,
//               padding: '10px 22px', borderRadius: 12, border: 'none',
//               background: '#059669', fontSize: 14, fontWeight: 600,
//               color: '#fff', cursor: 'pointer',
//               boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
//               whiteSpace: 'nowrap',
//             }}
//             onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#047857')}
//             onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#059669')}
//           >
//             <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2.5">
//               <path d="M12 5v14M5 12h14" />
//             </svg>
//              Create Delivery
//           </button>
//         )}
//       </div>

//       {/* ── MAIN CARD ── */}
//       <div style={{
//         background: '#fff',
//         border: '1px solid #e8eaf0',
//         borderRadius: 16,
//         overflow: 'hidden',
//       }}>

//         {/* ── CARD HEADER: title + search + refresh ── */}
//         <div style={{
//           display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//           padding: '18px 22px', borderBottom: '1px solid #f1f5f9',
//           flexWrap: 'wrap', gap: 12,
//         }}>
//           <div>
//             <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Delivery List</div>
//             <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
//               {rows.length} deliveries available
//             </div>
//           </div>

//           <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
//             {/* search */}
//             <div style={{ position: 'relative', width: 220 }}>
//               <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
//                 <SearchIcon />
//               </div>
//               <input
//                 value={q}
//                 onChange={(e) => setQ(e.target.value)}
//                 placeholder="Search deliveries..."
//                 style={{
//                   width: '100%', height: 36, paddingLeft: 34, paddingRight: 12,
//                   border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13,
//                   color: '#374151', background: '#f8fafc', outline: 'none',
//                   boxSizing: 'border-box', transition: 'border-color 0.15s',
//                 }}
//                 onFocus={(e) => (e.currentTarget.style.borderColor = '#6ee7b7')}
//                 onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
//               />
//             </div>

//             {/* refresh */}
//             <button
//               onClick={loadDeliveries}
//               style={{
//                 display: 'inline-flex', alignItems: 'center', gap: 6,
//                 height: 36, padding: '0 16px', borderRadius: 9,
//                 border: '1px solid #e2e8f0', background: '#fff',
//                 fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
//                 transition: 'all 0.15s',
//               }}
//               onMouseEnter={(e) => {
//                 const el = e.currentTarget as HTMLElement
//                 el.style.background = '#f8fafc'
//                 el.style.borderColor = '#a7f3d0'
//               }}
//               onMouseLeave={(e) => {
//                 const el = e.currentTarget as HTMLElement
//                 el.style.background = '#fff'
//                 el.style.borderColor = '#e2e8f0'
//               }}
//             >
//               <RefreshIcon />
//               Refresh
//             </button>
//           </div>
//         </div>

//         {/* ── TABS ── */}
//         <div style={{
//           display: 'flex', flexWrap: 'wrap', gap: 6,
//           padding: '14px 22px', borderBottom: '1px solid #f1f5f9',
//         }}>
//           {tabs.map((t) => {
//             const active = tab === t.id
//             return (
//               <button
//                 key={t.id}
//                 onClick={() => setTab(t.id)}
//                 style={{
//                   padding: '6px 14px',
//                   borderRadius: 20,
//                   fontSize: 13,
//                   fontWeight: active ? 700 : 500,
//                   border: active ? 'none' : '1px solid #e2e8f0',
//                   background: active ? '#059669' : '#fff',
//                   color: active ? '#fff' : '#64748b',
//                   cursor: 'pointer',
//                   transition: 'all 0.15s',
//                   whiteSpace: 'nowrap',
//                 }}
//                 onMouseEnter={(e) => {
//                   if (!active) {
//                     const el = e.currentTarget as HTMLElement
//                     el.style.background = '#ecfdf5'
//                     el.style.color = '#059669'
//                     el.style.borderColor = '#a7f3d0'
//                   }
//                 }}
//                 onMouseLeave={(e) => {
//                   if (!active) {
//                     const el = e.currentTarget as HTMLElement
//                     el.style.background = '#fff'
//                     el.style.color = '#64748b'
//                     el.style.borderColor = '#e2e8f0'
//                   }
//                 }}
//               >
//                 {t.label}
//               </button>
//             )
//           })}
//         </div>

//         {/* ── GODOWN UNLINKED ── */}
//         {godownUnlinked ? (
//           <div style={{
//             margin: '12px 22px', padding: '10px 14px', borderRadius: 10,
//             background: '#fffbeb', color: '#92400e', fontSize: 13,
//             border: '1px solid #fde68a',
//           }}>
//             Godown account is not linked to a warehouse. Log out and sign in again with your godown mobile.
//           </div>
//         ) : null}

//         {/* ── ERROR ── */}
//         {error && (
//           <div style={{
//             margin: '12px 22px', padding: '10px 14px', borderRadius: 10,
//             background: '#fef2f2', color: '#b91c1c', fontSize: 13,
//             border: '1px solid #fecaca',
//           }}>{error}</div>
//         )}

//         {/* ── SUCCESS ── */}
//         {successMessage && (
//           <div style={{
//             margin: '12px 22px', padding: '10px 14px', borderRadius: 10,
//             background: '#f0fdf4', color: '#15803d', fontSize: 13,
//             border: '1px solid #bbf7d0',
//             display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//           }}>
//             <span>{successMessage}</span>
//             <button onClick={() => setSuccessMessage(null)} style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', fontWeight: 700, fontSize: 16, lineHeight: 1 }}>×</button>
//           </div>
//         )}

//         {/* ── LOADING ── */}
//         {loading && (
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
//             <div style={{
//               width: 36, height: 36, borderRadius: '50%',
//               border: '3px solid #e2e8f0', borderTopColor: '#10b981',
//               animation: 'spin 0.7s linear infinite',
//             }} />
//             <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//           </div>
//         )}

//         {/* ── EMPTY ── */}
//         {!loading && rows.length === 0 && (
//           <div style={{ padding: '48px 22px', textAlign: 'center' }}>
//             <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
//             <div style={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>No deliveries found</div>
//             <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Try changing the search or delivery status filter.</div>
//           </div>
//         )}

//         {/* ── TABLE ── */}
//         {!loading && rows.length > 0 && (
//           <div style={{ overflowX: 'auto' }}>
//             <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
//               <thead>
//                 <tr>
//                   <th style={colHead}>Delivery</th>
//                   <th style={colHead}>Customer</th>
//                   <th style={colHead}>Area</th>
//                   <th style={colHead}>Godown</th>
//                   <th style={colHead}>Products</th>
//                   <th style={colHead}>Status</th>
//                   <th style={{ ...colHead, textAlign: 'right' }}>Scheduled</th>
//                   <th style={{ ...colHead, textAlign: 'right' }}>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {rows.map((d, index) => {
//                   const rowBg = index % 2 === 0 ? '#ffffff' : '#fafbfc'
//                   const hasProducts = (d.linesSummary?.length ?? 0) > 0
//                   return (
//                     <Fragment key={d.id}>
//                       <tr
//                         style={{
//                           background: rowBg,
//                           borderBottom: expandedId === d.id ? 'none' : '1px solid #f1f5f9',
//                           transition: 'background 0.12s',
//                           cursor: 'pointer',
//                         }}
//                         onClick={() => nav(`/deliveries/${d.id}`)}
//                         onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(236,253,245,0.7)')}
//                         onMouseLeave={(e) => (e.currentTarget.style.background = rowBg)}
//                       >
//                         <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
//                           <Link
//                             to={`/deliveries/${d.id}`}
//                             onClick={(e) => e.stopPropagation()}
//                             style={{
//                               fontWeight: 700,
//                               fontSize: 14,
//                               color: '#059669',
//                               textDecoration: 'none',
//                             }}
//                             onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
//                             onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
//                           >
//                             {d.deliveryNo}
//                           </Link>
//                         </td>

//                         <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
//                           <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{d.customerName}</span>
//                         </td>

//                         <td style={{ padding: '14px 16px', verticalAlign: 'middle', maxWidth: 180 }}>
//                           <div
//                             style={{
//                               fontSize: 13,
//                               fontWeight: 500,
//                               color: '#0f172a',
//                               overflow: 'hidden',
//                               textOverflow: 'ellipsis',
//                               whiteSpace: 'nowrap',
//                             }}
//                           >
//                             {d.siteName || '—'}
//                           </div>
//                           {d.siteAddress ? (
//                             <div
//                               style={{
//                                 fontSize: 11,
//                                 color: '#94a3b8',
//                                 marginTop: 2,
//                                 overflow: 'hidden',
//                                 textOverflow: 'ellipsis',
//                                 whiteSpace: 'nowrap',
//                               }}
//                             >
//                               {d.siteAddress}
//                             </div>
//                           ) : null}
//                         </td>

//                         <td style={{ padding: '14px 16px', verticalAlign: 'middle', maxWidth: 140 }}>
//                           <span
//                             style={{
//                               fontSize: 13,
//                               color: '#374151',
//                               display: 'block',
//                               overflow: 'hidden',
//                               textOverflow: 'ellipsis',
//                               whiteSpace: 'nowrap',
//                             }}
//                           >
//                             {formatGodownLabel(d.godownNames, d.primaryGodownName)}
//                           </span>
//                         </td>

//                         <td style={{ padding: '14px 16px', verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
//                           <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
//                             <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
//                               {d.productCount ?? 0} items · {d.totalQty ?? 0} qty
//                             </span>
//                             {hasProducts ? (
//                               <button
//                                 type="button"
//                                 onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
//                                 style={{
//                                   padding: '4px 10px',
//                                   borderRadius: 8,
//                                   border: '1px solid #bbf7d0',
//                                   background: expandedId === d.id ? '#ecfdf5' : '#fff',
//                                   fontSize: 12,
//                                   fontWeight: 600,
//                                   color: '#059669',
//                                   cursor: 'pointer',
//                                 }}
//                               >
//                                 {expandedId === d.id ? 'Hide' : 'View'}
//                               </button>
//                             ) : null}
//                           </div>
//                         </td>

//                         <td style={{ padding: '14px 16px', verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
//                           <DeliveryStatusSelect
//                             deliveryId={d.id}
//                             status={d.status}
//                             vehicleLabel={d.vehicleLabel}
//                             returnPickupVehicleLabel={d.returnPickupVehicleLabel}
//                             onUpdated={(patch) => handleStatusUpdated(d.id, patch)}
//                             onError={(msg) => setError(msg)}
//                           />
//                         </td>

//                         <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
//                           <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap' }}>
//                             {formatDateTime(d.deliveryAt)}
//                           </span>
//                         </td>

//                         <td
//                           style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}
//                           onClick={(e) => e.stopPropagation()}
//                         >
//                           <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
//                             {isGodownUser ? (
//                               <GodownDeliveryWorkflow
//                                 delivery={{
//                                   id: d.id,
//                                   status: d.status,
//                                   vehicleLabel: d.vehicleLabel,
//                                   returnPickupVehicleLabel: d.returnPickupVehicleLabel,
//                                   lines: d.lines,
//                                   qtyProgress: d.qtyProgress,
//                                   scanProgress: d.scanProgress,
//                                   deliveryVerifiedAt: d.deliveryVerifiedAt,
//                                   billerReturnSubmittedAt: d.billerReturnSubmittedAt,
//                                 }}
//                                 compact
//                                 onUpdated={(patch) => handleWorkflowUpdated(d.id, patch)}
//                                 onError={(msg) => setError(msg)}
//                               />
//                             ) : null}
//                             <DeliveryRowActions
//                               delivery={d}
//                               onEdit={(deliveryId) => setEditDeliveryId(deliveryId)}
//                               onScan={(path) => nav(path)}
//                               onDeleted={() => {
//                                 removeFromList(d.id)
//                                 setSuccessMessage(`${d.deliveryNo} deleted successfully`)
//                                 setError(null)
//                               }}
//                               onError={(msg) => setError(msg)}
//                             />
//                           </div>
//                         </td>
//                       </tr>
//                       {expandedId === d.id && hasProducts ? (
//                         <tr>
//                           <td colSpan={8} style={{ padding: '0 16px 14px', background: rowBg }}>
//                             <div
//                               style={{
//                                 background: '#f0fdf4',
//                                 border: '1px solid #bbf7d0',
//                                 borderRadius: 10,
//                                 padding: '4px 4px 8px',
//                               }}
//                             >
//                               <DeliveryProductsPanel lines={d.linesSummary} />
//                             </div>
//                           </td>
//                         </tr>
//                       ) : null}
//                     </Fragment>
//                   )
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* ── MODALS ── */}
//       <CreateDeliveryModal
//         open={createOpen}
//         onClose={() => setCreateOpen(false)}
//         onCreated={loadDeliveries}
//       />
//       <CreateDeliveryModal
//         open={!!editDeliveryId}
//         deliveryId={editDeliveryId}
//         onClose={() => setEditDeliveryId(null)}
//         onCreated={loadDeliveries}
//         onUpdated={loadDeliveries}
//       />
//     </div>
//   )
// }

// import { Fragment, useEffect, useMemo, useState } from 'react'
// import { Link, useNavigate, useSearchParams } from 'react-router-dom'
// import { formatDateTime } from '../../lib/format'
// import { apiFetch } from '../../lib/api'
// import { getToken, useAuth } from '../../auth/store'
// import { DeliveryStatusSelect } from '../../components/delivery/DeliveryStatusSelect'
// import { DeliveryRowActions } from '../../components/delivery/DeliveryRowActions'
// import { GodownDeliveryWorkflow } from '../../components/delivery/GodownDeliveryWorkflow'
// import type { DeliveryStatusPatch } from '../../components/delivery/DeliveryStatusSelect'
// import { CreateDeliveryModal } from './CreateDeliveryModal'
// import { DriverDeliveriesDashboard } from '../../components/delivery/DriverDeliveriesDashboard'

// type Tab =
//   | 'all'
//   | 'PROCESSED'
//   | 'PACKED'
//   | 'OUT_FOR_DELIVERY'
//   | 'DELIVERED'
//   | 'RETURN_PICKUP'
//   | 'PENDING_RETURN'
//   | 'COMPLETED'

// type DeliveryRow = {
//   id: string
//   deliveryNo: string
//   customerName: string
//   siteName?: string
//   siteAddress?: string
//   status: string
//   vehicleLabel?: string
//   returnPickupVehicleLabel?: string
//   deliveryAt: string
//   fromGodownId?: string
//   billerUserId?: string
//   dispatchedTagIds?: string[]
//   pickedUpTagIds?: string[]
//   deliveredTagIds?: string[]
//   returnPickedUpTagIds?: string[]
//   returnedTagIds?: string[]
//   damagedTagIds?: string[]
//   lostTagIds?: string[]
//   lines?: Array<{
//     productId: string
//     qty: number
//     dispatchedQty?: number
//     returnedQty?: number
//   }>
//   qtyProgress?: { dispatchComplete?: boolean }
//   scanProgress?: { dispatchComplete?: boolean }
//   deliveryVerifiedAt?: string
//   billerReturnSubmittedAt?: string
//   godownNames?: string[]
//   primaryGodownName?: string
//   linesSummary?: Array<{
//     productId: string
//     particulars?: string
//     sku?: string
//     qty: number
//     godownName?: string
//   }>
//   productCount?: number
//   totalQty?: number
// }

// function formatGodownLabel(names?: string[], primary?: string): string {
//   if (!names?.length) return primary || '—'
//   if (names.length === 1) return names[0]
//   if (names.length === 2) return `${names[0]}, ${names[1]}`
//   return `${names[0]}, ${names[1]} +${names.length - 2}`
// }

// function DeliveryProductsPanel({ lines }: { lines: DeliveryRow['linesSummary'] }) {
//   if (!lines?.length) {
//     return <div style={{ fontSize: 12, color: '#94a3b8', padding: 12 }}>No products on this delivery.</div>
//   }
//   return (
//     <div style={{ overflowX: 'auto' }}>
//       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
//         <thead>
//           <tr>
//             {['Product', 'Godown', 'Qty'].map((h) => (
//               <th
//                 key={h}
//                 style={{
//                   padding: '8px 12px',
//                   fontSize: 11,
//                   fontWeight: 700,
//                   color: '#047857',
//                   textTransform: 'uppercase',
//                   letterSpacing: '0.06em',
//                   textAlign: h === 'Qty' ? 'right' : 'left',
//                   borderBottom: '1px solid #bbf7d0',
//                 }}
//               >
//                 {h}
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {lines.map((line) => (
//             <tr key={line.productId}>
//               <td style={{ padding: '8px 12px', fontSize: 13, color: '#0f172a' }}>
//                 {line.particulars || line.sku || line.productId}
//                 {line.sku && line.particulars ? (
//                   <span style={{ display: 'block', fontSize: 11, color: '#94a3b8' }}>{line.sku}</span>
//                 ) : null}
//               </td>
//               <td style={{ padding: '8px 12px', fontSize: 13, color: '#64748b' }}>{line.godownName || '—'}</td>
//               <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>
//                 {line.qty}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// // ── icons ──────────────────────────────────────────────────────────────────

// function SearchIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="15" height="15" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
//       <circle cx="11" cy="11" r="7" />
//       <path d="M16.5 16.5 21 21" />
//     </svg>
//   )
// }

// function RefreshIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
//       <path d="M23 4v6h-6" />
//       <path d="M1 20v-6h6" />
//       <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
//     </svg>
//   )
// }

// // ── action icon button ─────────────────────────────────────────────────────

// // function IconBtn({
// //   children,
// //   title,
// //   onClick,
// //   danger = false,
// // }: {
// //   children: React.ReactNode
// //   title: string
// //   onClick?: () => void
// //   danger?: boolean
// // }) {
// //   return (
// //     <button
// //       type="button"
// //       title={title}
// //       onClick={onClick}
// //       style={{
// //         display: 'inline-flex',
// //         alignItems: 'center',
// //         justifyContent: 'center',
// //         width: 34,
// //         height: 34,
// //         borderRadius: 9,
// //         border: '1px solid #e2e8f0',
// //         background: '#fff',
// //         color: danger ? '#dc2626' : '#64748b',
// //         cursor: 'pointer',
// //         transition: 'all 0.15s',
// //         flexShrink: 0,
// //       }}
// //       onMouseEnter={(e) => {
// //         const el = e.currentTarget as HTMLElement
// //         if (danger) {
// //           el.style.background = '#fef2f2'
// //           el.style.borderColor = '#fecaca'
// //           el.style.color = '#dc2626'
// //         } else {
// //           el.style.background = '#f0eeff'
// //           el.style.borderColor = '#c4b5fd'
// //           el.style.color = '#059669'
// //         }
// //       }}
// //       onMouseLeave={(e) => {
// //         const el = e.currentTarget as HTMLElement
// //         el.style.background = '#fff'
// //         el.style.borderColor = '#e2e8f0'
// //         el.style.color = danger ? '#dc2626' : '#64748b'
// //       }}
// //     >
// //       {children}
// //     </button>
// //   )
// // }

// // ── main component ─────────────────────────────────────────────────────────

// export function DeliveriesListPage() {
//   const auth = useAuth()
//   const nav = useNavigate()
//   const [searchParams] = useSearchParams()
//   const statusFromUrl = searchParams.get('status') as Tab | null

//   const validTabs: Tab[] = ['all','PROCESSED','PACKED','OUT_FOR_DELIVERY','DELIVERED','RETURN_PICKUP','PENDING_RETURN','COMPLETED']

//   const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
//   const [error, setError] = useState<string | null>(null)
//   const [tab, setTab] = useState<Tab>(
//     statusFromUrl && validTabs.includes(statusFromUrl) ? statusFromUrl : 'all'
//   )
//   const [q, setQ] = useState('')
//   const [createOpen, setCreateOpen] = useState(false)
//   const [editDeliveryId, setEditDeliveryId] = useState<string | null>(null)
//   const [loading, setLoading] = useState(false)
//   const [successMessage, setSuccessMessage] = useState<string | null>(null)
//   const [expandedId, setExpandedId] = useState<string | null>(null)

//   const canCreate =
//     auth.status === 'authenticated' &&
//     (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')

//   const isGodownUser = auth.status === 'authenticated' && auth.user.role === 'GODOWN'
//   const godownUnlinked = isGodownUser && auth.status === 'authenticated' && !auth.user.godownId

//   const removeFromList = (id: string) =>
//     setDeliveries((prev) => prev.filter((r) => r.id !== id))

//   const patchDeliveryRow = (id: string, patch: Partial<DeliveryRow>) =>
//     setDeliveries((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

//   const handleStatusUpdated = (id: string, patch: DeliveryStatusPatch) => {
//     patchDeliveryRow(id, patch)
//     loadDeliveries()
//   }

//   const handleWorkflowUpdated = (id: string, patch?: Partial<DeliveryRow>) => {
//     if (patch) patchDeliveryRow(id, patch)
//     loadDeliveries()
//   }

//   const loadDeliveries = () => {
//     const token = getToken()
//     if (!token) return
//     setLoading(true)
//     setError(null)
//     apiFetch<DeliveryRow[]>('/deliveries?limit=200', { token })
//       .then(setDeliveries)
//       .catch((e: unknown) =>
//         setError(e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Failed to load deliveries')
//       )
//       .finally(() => setLoading(false))
//   }

//   useEffect(() => { loadDeliveries() }, [])

//   const rows = useMemo(() => {
//     const s = q.trim().toLowerCase()
//     return deliveries.filter((d) => {
//       if (tab !== 'all' && d.status !== tab) return false
//       if (!s) return true
//       const godownMatch = d.godownNames?.some((n) => n.toLowerCase().includes(s)) ?? false
//       const productMatch =
//         d.linesSummary?.some(
//           (l) =>
//             (l.particulars?.toLowerCase().includes(s) ?? false) ||
//             (l.sku?.toLowerCase().includes(s) ?? false),
//         ) ?? false
//       return (
//         d.deliveryNo.toLowerCase().includes(s) ||
//         d.customerName.toLowerCase().includes(s) ||
//         (d.siteName?.toLowerCase().includes(s) ?? false) ||
//         (d.siteAddress?.toLowerCase().includes(s) ?? false) ||
//         godownMatch ||
//         productMatch
//       )
//     })
//   }, [deliveries, q, tab])

//   const tabs: Array<{ id: Tab; label: string }> = [
//     { id: 'all', label: 'All' },
//     { id: 'PROCESSED', label: 'Processed' },
//     { id: 'PACKED', label: 'Packed' },
//     { id: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
//     { id: 'DELIVERED', label: 'Delivered' },
//     { id: 'RETURN_PICKUP', label: 'Return pickup' },
//     { id: 'PENDING_RETURN', label: 'Pending return' },
//     { id: 'COMPLETED', label: 'Completed' },
//   ]

//   if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY') {
//     return <DriverDeliveriesDashboard />
//   }

//   // ── column header style ──────────────────────────────────────────────────

//   const colHead: React.CSSProperties = {
//     padding: '10px 16px',
//     fontSize: 11,
//     fontWeight: 700,
//     color: '#94a3b8',
//     textTransform: 'uppercase',
//     letterSpacing: '0.07em',
//     textAlign: 'left',
//     whiteSpace: 'nowrap',
//     borderBottom: '1px solid #f1f5f9',
//     background: 'transparent',
//   }

//   // ── render ────────────────────────────────────────────────────────────────

//   return (
//     // AppShell provides 20px 24px padding — no extra wrapper needed
//     <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 20 }}>

//       {/* ── PAGE HEADER ── */}
//       <div style={{
//         display: 'flex', alignItems: 'flex-start',
//         justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
//       }}>
//         <div>
//           <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Delivery Manager</h1>
//           <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
//             Manage customer deliveries, schedules and dispatch workflow.
//           </p>
//         </div>

//         {canCreate && (
//           <button
//             onClick={() => setCreateOpen(true)}
//             style={{
//               display: 'inline-flex', alignItems: 'center', gap: 8,
//               padding: '10px 22px', borderRadius: 12, border: 'none',
//               background: '#059669', fontSize: 14, fontWeight: 600,
//               color: '#fff', cursor: 'pointer',
//               boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
//               whiteSpace: 'nowrap',
//             }}
//             onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#047857')}
//             onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#059669')}
//           >
//             <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2.5">
//               <path d="M12 5v14M5 12h14" />
//             </svg>
//              Create Delivery
//           </button>
//         )}
//       </div>

//       {/* ── MAIN CARD ── */}
//       <div style={{
//         background: '#fff',
//         border: '1px solid #e8eaf0',
//         borderRadius: 16,
//         overflow: 'hidden',
//       }}>

//         {/* ── CARD HEADER: title + search + refresh ── */}
//         <div style={{
//           display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//           padding: '18px 22px', borderBottom: '1px solid #f1f5f9',
//           flexWrap: 'wrap', gap: 12,
//         }}>
//           <div>
//             <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Delivery List</div>
//             <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
//               {rows.length} deliveries available
//             </div>
//           </div>

//           <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
//             {/* search */}
//             <div style={{ position: 'relative', width: 220 }}>
//               <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
//                 <SearchIcon />
//               </div>
//               <input
//                 value={q}
//                 onChange={(e) => setQ(e.target.value)}
//                 placeholder="Search deliveries..."
//                 style={{
//                   width: '100%', height: 36, paddingLeft: 34, paddingRight: 12,
//                   border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13,
//                   color: '#374151', background: '#f8fafc', outline: 'none',
//                   boxSizing: 'border-box', transition: 'border-color 0.15s',
//                 }}
//                 onFocus={(e) => (e.currentTarget.style.borderColor = '#6ee7b7')}
//                 onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
//               />
//             </div>

//             {/* refresh */}
//             <button
//               onClick={loadDeliveries}
//               style={{
//                 display: 'inline-flex', alignItems: 'center', gap: 6,
//                 height: 36, padding: '0 16px', borderRadius: 9,
//                 border: '1px solid #e2e8f0', background: '#fff',
//                 fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
//                 transition: 'all 0.15s',
//               }}
//               onMouseEnter={(e) => {
//                 const el = e.currentTarget as HTMLElement
//                 el.style.background = '#f8fafc'
//                 el.style.borderColor = '#a7f3d0'
//               }}
//               onMouseLeave={(e) => {
//                 const el = e.currentTarget as HTMLElement
//                 el.style.background = '#fff'
//                 el.style.borderColor = '#e2e8f0'
//               }}
//             >
//               <RefreshIcon />
//               Refresh
//             </button>
//           </div>
//         </div>

//         {/* ── TABS ── */}
//         <div style={{
//           display: 'flex', flexWrap: 'wrap', gap: 6,
//           padding: '14px 22px', borderBottom: '1px solid #f1f5f9',
//         }}>
//           {tabs.map((t) => {
//             const active = tab === t.id
//             return (
//               <button
//                 key={t.id}
//                 onClick={() => setTab(t.id)}
//                 style={{
//                   padding: '6px 14px',
//                   borderRadius: 20,
//                   fontSize: 13,
//                   fontWeight: active ? 700 : 500,
//                   border: active ? 'none' : '1px solid #e2e8f0',
//                   background: active ? '#059669' : '#fff',
//                   color: active ? '#fff' : '#64748b',
//                   cursor: 'pointer',
//                   transition: 'all 0.15s',
//                   whiteSpace: 'nowrap',
//                 }}
//                 onMouseEnter={(e) => {
//                   if (!active) {
//                     const el = e.currentTarget as HTMLElement
//                     el.style.background = '#ecfdf5'
//                     el.style.color = '#059669'
//                     el.style.borderColor = '#a7f3d0'
//                   }
//                 }}
//                 onMouseLeave={(e) => {
//                   if (!active) {
//                     const el = e.currentTarget as HTMLElement
//                     el.style.background = '#fff'
//                     el.style.color = '#64748b'
//                     el.style.borderColor = '#e2e8f0'
//                   }
//                 }}
//               >
//                 {t.label}
//               </button>
//             )
//           })}
//         </div>

//         {/* ── GODOWN UNLINKED ── */}
//         {godownUnlinked ? (
//           <div style={{
//             margin: '12px 22px', padding: '10px 14px', borderRadius: 10,
//             background: '#fffbeb', color: '#92400e', fontSize: 13,
//             border: '1px solid #fde68a',
//           }}>
//             Godown account is not linked to a warehouse. Log out and sign in again with your godown mobile.
//           </div>
//         ) : null}

//         {/* ── ERROR ── */}
//         {error && (
//           <div style={{
//             margin: '12px 22px', padding: '10px 14px', borderRadius: 10,
//             background: '#fef2f2', color: '#b91c1c', fontSize: 13,
//             border: '1px solid #fecaca',
//           }}>{error}</div>
//         )}

//         {/* ── SUCCESS ── */}
//         {successMessage && (
//           <div style={{
//             margin: '12px 22px', padding: '10px 14px', borderRadius: 10,
//             background: '#f0fdf4', color: '#15803d', fontSize: 13,
//             border: '1px solid #bbf7d0',
//             display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//           }}>
//             <span>{successMessage}</span>
//             <button onClick={() => setSuccessMessage(null)} style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', fontWeight: 700, fontSize: 16, lineHeight: 1 }}>×</button>
//           </div>
//         )}

//         {/* ── LOADING ── */}
//         {loading && (
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
//             <div style={{
//               width: 36, height: 36, borderRadius: '50%',
//               border: '3px solid #e2e8f0', borderTopColor: '#10b981',
//               animation: 'spin 0.7s linear infinite',
//             }} />
//             <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//           </div>
//         )}

//         {/* ── EMPTY ── */}
//         {!loading && rows.length === 0 && (
//           <div style={{ padding: '48px 22px', textAlign: 'center' }}>
//             <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
//             <div style={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>No deliveries found</div>
//             <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Try changing the search or delivery status filter.</div>
//           </div>
//         )}

//         {/* ── TABLE ── */}
//         {!loading && rows.length > 0 && (
//           <div style={{ overflowX: 'auto' }}>
//             <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
//               <thead>
//                 <tr>
//                   <th style={colHead}>Delivery</th>
//                   <th style={colHead}>Customer</th>
//                   <th style={colHead}>Area</th>
//                   <th style={colHead}>Godown</th>
//                   <th style={colHead}>Products</th>
//                   <th style={colHead}>Status</th>
//                   <th style={{ ...colHead, textAlign: 'right' }}>Scheduled</th>
//                   <th style={{ ...colHead, textAlign: 'right' }}>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {rows.map((d, index) => {
//                   const rowBg = index % 2 === 0 ? '#ffffff' : '#fafbfc'
//                   const hasProducts = (d.linesSummary?.length ?? 0) > 0
//                   return (
//                     <Fragment key={d.id}>
//                       <tr
//                         style={{
//                           background: rowBg,
//                           borderBottom: expandedId === d.id ? 'none' : '1px solid #f1f5f9',
//                           transition: 'background 0.12s',
//                           cursor: 'pointer',
//                         }}
//                         onClick={() => nav(`/deliveries/${d.id}`)}
//                         onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(236,253,245,0.7)')}
//                         onMouseLeave={(e) => (e.currentTarget.style.background = rowBg)}
//                       >
//                         <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
//                           <Link
//                             to={`/deliveries/${d.id}`}
//                             onClick={(e) => e.stopPropagation()}
//                             style={{
//                               fontWeight: 700,
//                               fontSize: 14,
//                               color: '#059669',
//                               textDecoration: 'none',
//                             }}
//                             onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
//                             onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
//                           >
//                             {d.deliveryNo}
//                           </Link>
//                         </td>

//                         <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
//                           <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{d.customerName}</span>
//                         </td>

//                         <td style={{ padding: '14px 16px', verticalAlign: 'middle', maxWidth: 180 }}>
//                           <div
//                             style={{
//                               fontSize: 13,
//                               fontWeight: 500,
//                               color: '#0f172a',
//                               overflow: 'hidden',
//                               textOverflow: 'ellipsis',
//                               whiteSpace: 'nowrap',
//                             }}
//                           >
//                             {d.siteName || '—'}
//                           </div>
//                           {d.siteAddress ? (
//                             <div
//                               style={{
//                                 fontSize: 11,
//                                 color: '#94a3b8',
//                                 marginTop: 2,
//                                 overflow: 'hidden',
//                                 textOverflow: 'ellipsis',
//                                 whiteSpace: 'nowrap',
//                               }}
//                             >
//                               {d.siteAddress}
//                             </div>
//                           ) : null}
//                         </td>

//                         <td style={{ padding: '14px 16px', verticalAlign: 'middle', maxWidth: 140 }}>
//                           <span
//                             style={{
//                               fontSize: 13,
//                               color: '#374151',
//                               display: 'block',
//                               overflow: 'hidden',
//                               textOverflow: 'ellipsis',
//                               whiteSpace: 'nowrap',
//                             }}
//                           >
//                             {formatGodownLabel(d.godownNames, d.primaryGodownName)}
//                           </span>
//                         </td>

//                         <td style={{ padding: '14px 16px', verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
//                           <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
//                             <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
//                               {d.productCount ?? 0} items · {d.totalQty ?? 0} qty
//                             </span>
//                             {hasProducts ? (
//                               <button
//                                 type="button"
//                                 onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
//                                 style={{
//                                   padding: '4px 10px',
//                                   borderRadius: 8,
//                                   border: '1px solid #bbf7d0',
//                                   background: expandedId === d.id ? '#ecfdf5' : '#fff',
//                                   fontSize: 12,
//                                   fontWeight: 600,
//                                   color: '#059669',
//                                   cursor: 'pointer',
//                                 }}
//                               >
//                                 {expandedId === d.id ? 'Hide' : 'View'}
//                               </button>
//                             ) : null}
//                           </div>
//                         </td>

//                         <td style={{ padding: '14px 16px', verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
//                           <DeliveryStatusSelect
//                             deliveryId={d.id}
//                             status={d.status}
//                             vehicleLabel={d.vehicleLabel}
//                             returnPickupVehicleLabel={d.returnPickupVehicleLabel}
//                             onUpdated={(patch) => handleStatusUpdated(d.id, patch)}
//                             onError={(msg) => setError(msg)}
//                           />
//                         </td>

//                         <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
//                           <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap' }}>
//                             {formatDateTime(d.deliveryAt)}
//                           </span>
//                         </td>

//                         <td
//                           style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}
//                           onClick={(e) => e.stopPropagation()}
//                         >
//                           <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
//                             {isGodownUser ? (
//                               <GodownDeliveryWorkflow
//                                 delivery={{
//                                   id: d.id,
//                                   status: d.status,
//                                   vehicleLabel: d.vehicleLabel,
//                                   returnPickupVehicleLabel: d.returnPickupVehicleLabel,
//                                   lines: d.lines,
//                                   qtyProgress: d.qtyProgress,
//                                   scanProgress: d.scanProgress,
//                                   deliveryVerifiedAt: d.deliveryVerifiedAt,
//                                   billerReturnSubmittedAt: d.billerReturnSubmittedAt,
//                                 }}
//                                 compact
//                                 onUpdated={(patch) => handleWorkflowUpdated(d.id, patch)}
//                                 onError={(msg) => setError(msg)}
//                               />
//                             ) : null}
//                             <DeliveryRowActions
//                               delivery={d}
//                               onEdit={(deliveryId) => setEditDeliveryId(deliveryId)}
//                               onScan={(path) => nav(path)}
//                               onDeleted={() => {
//                                 removeFromList(d.id)
//                                 setSuccessMessage(`${d.deliveryNo} deleted successfully`)
//                                 setError(null)
//                               }}
//                               onError={(msg) => setError(msg)}
//                             />
//                           </div>
//                         </td>
//                       </tr>
//                       {expandedId === d.id && hasProducts ? (
//                         <tr>
//                           <td colSpan={8} style={{ padding: '0 16px 14px', background: rowBg }}>
//                             <div
//                               style={{
//                                 background: '#f0fdf4',
//                                 border: '1px solid #bbf7d0',
//                                 borderRadius: 10,
//                                 padding: '4px 4px 8px',
//                               }}
//                             >
//                               <DeliveryProductsPanel lines={d.linesSummary} />
//                             </div>
//                           </td>
//                         </tr>
//                       ) : null}
//                     </Fragment>
//                   )
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* ── MODALS ── */}
//       <CreateDeliveryModal
//         open={createOpen}
//         onClose={() => setCreateOpen(false)}
//         onCreated={loadDeliveries}
//       />
//       <CreateDeliveryModal
//         open={!!editDeliveryId}
//         deliveryId={editDeliveryId}
//         onClose={() => setEditDeliveryId(null)}
//         onCreated={loadDeliveries}
//         onUpdated={loadDeliveries}
//       />
//     </div>
//   )
// }

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { formatDateTime } from '../../lib/format'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'
import { DeliveryStatusSelect } from '../../components/delivery/DeliveryStatusSelect'
import { DeliveryRowActions } from '../../components/delivery/DeliveryRowActions'
// import { GodownDeliveryWorkflow } from '../../components/delivery/GodownDeliveryWorkflow'
import type { DeliveryStatusPatch } from '../../components/delivery/DeliveryStatusSelect'
import { CreateDeliveryModal } from './CreateDeliveryModal'
import { DriverDeliveriesDashboard } from '../../components/delivery/DriverDeliveriesDashboard'

type Tab =
  | 'all'
  | 'PROCESSED'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RETURN_PICKUP'
  | 'PENDING_RETURN'
  | 'COMPLETED'

type DeliveryRow = {
  id: string
  deliveryNo: string
  customerName: string
  siteName?: string
  siteAddress?: string
  status: string
  vehicleLabel?: string
  driverName?: string
  driverPhone?: string
  returnPickupVehicleLabel?: string
  returnPickupDriverName?: string
  returnPickupDriverPhone?: string
  deliveryAt: string
  fromGodownId?: string
  billerUserId?: string
  dispatchedTagIds?: string[]
  pickedUpTagIds?: string[]
  deliveredTagIds?: string[]
  returnPickedUpTagIds?: string[]
  returnedTagIds?: string[]
  damagedTagIds?: string[]
  lostTagIds?: string[]
  lines?: Array<{
    productId: string
    qty: number
    dispatchedQty?: number
    returnedQty?: number
  }>
  qtyProgress?: { dispatchComplete?: boolean }
  scanProgress?: { dispatchComplete?: boolean }
  deliveryVerifiedAt?: string
  billerReturnSubmittedAt?: string
  godownNames?: string[]
  primaryGodownName?: string
  linesSummary?: Array<{
    productId: string
    particulars?: string
    sku?: string
    qty: number
    godownName?: string
  }>
  productCount?: number
  totalQty?: number
}

function formatGodownLabel(names?: string[], primary?: string): string {
  if (!names?.length) return primary || '—'
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]}, ${names[1]}`
  return `${names[0]}, ${names[1]} +${names.length - 2}`
}

function DeliveryProductsPanel({ lines }: { lines: DeliveryRow['linesSummary'] }) {
  if (!lines?.length) {
    return <div style={{ fontSize: 12, color: '#94a3b8', padding: 12 }}>No products on this delivery.</div>
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
        <thead>
          <tr>
            {['Product', 'Godown', 'Qty'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '8px 12px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#047857',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  textAlign: h === 'Qty' ? 'right' : 'left',
                  borderBottom: '1px solid #bbf7d0',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.productId}>
              <td style={{ padding: '8px 12px', fontSize: 13, color: '#0f172a' }}>
                {line.particulars || line.sku || line.productId}
                {line.sku && line.particulars ? (
                  <span style={{ display: 'block', fontSize: 11, color: '#94a3b8' }}>{line.sku}</span>
                ) : null}
              </td>
              <td style={{ padding: '8px 12px', fontSize: 13, color: '#64748b' }}>{line.godownName || '—'}</td>
              <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>
                {line.qty}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── icons ──────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="15" height="15" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5 21 21" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

// ── action icon button ─────────────────────────────────────────────────────

// function IconBtn({
//   children,
//   title,
//   onClick,
//   danger = false,
// }: {
//   children: React.ReactNode
//   title: string
//   onClick?: () => void
//   danger?: boolean
// }) {
//   return (
//     <button
//       type="button"
//       title={title}
//       onClick={onClick}
//       style={{
//         display: 'inline-flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         width: 34,
//         height: 34,
//         borderRadius: 9,
//         border: '1px solid #e2e8f0',
//         background: '#fff',
//         color: danger ? '#dc2626' : '#64748b',
//         cursor: 'pointer',
//         transition: 'all 0.15s',
//         flexShrink: 0,
//       }}
//       onMouseEnter={(e) => {
//         const el = e.currentTarget as HTMLElement
//         if (danger) {
//           el.style.background = '#fef2f2'
//           el.style.borderColor = '#fecaca'
//           el.style.color = '#dc2626'
//         } else {
//           el.style.background = '#f0eeff'
//           el.style.borderColor = '#c4b5fd'
//           el.style.color = '#059669'
//         }
//       }}
//       onMouseLeave={(e) => {
//         const el = e.currentTarget as HTMLElement
//         el.style.background = '#fff'
//         el.style.borderColor = '#e2e8f0'
//         el.style.color = danger ? '#dc2626' : '#64748b'
//       }}
//     >
//       {children}
//     </button>
//   )
// }

// ── main component ─────────────────────────────────────────────────────────

export function DeliveriesListPage() {
  const auth = useAuth()
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const statusFromUrl = searchParams.get('status') as Tab | null

  const validTabs: Tab[] = ['all','PROCESSED','PACKED','OUT_FOR_DELIVERY','DELIVERED','RETURN_PICKUP','PENDING_RETURN','COMPLETED']

  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>(
    statusFromUrl && validTabs.includes(statusFromUrl) ? statusFromUrl : 'all'
  )
  const [q, setQ] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editDeliveryId, setEditDeliveryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  const canCreate =
    auth.status === 'authenticated' &&
    (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')

  const isGodownUser = auth.status === 'authenticated' && auth.user.role === 'GODOWN'
  const godownUnlinked = isGodownUser && auth.status === 'authenticated' && !auth.user.godownId

  const removeFromList = (id: string) =>
    setDeliveries((prev) => prev.filter((r) => r.id !== id))

  const patchDeliveryRow = (id: string, patch: Partial<DeliveryRow>) =>
    setDeliveries((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const handleStatusUpdated = (id: string, patch: DeliveryStatusPatch) => {
    patchDeliveryRow(id, patch)
    loadDeliveries()
  }

  // const handleWorkflowUpdated = (id: string, patch?: Partial<DeliveryRow>) => {
  //   if (patch) patchDeliveryRow(id, patch)
  //   loadDeliveries()
  // }

  const loadDeliveries = () => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    setError(null)
    apiFetch<DeliveryRow[]>('/deliveries?limit=200', { token })
      .then(setDeliveries)
      .catch((e: unknown) =>
        setError(e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Failed to load deliveries')
      )
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadDeliveries() }, [])

  const rows = useMemo(() => {
    setCurrentPage(1)
    const s = q.trim().toLowerCase()
    return deliveries.filter((d) => {
      if (tab !== 'all' && d.status !== tab) return false
      if (!s) return true
      const godownMatch = d.godownNames?.some((n) => n.toLowerCase().includes(s)) ?? false
      const productMatch =
        d.linesSummary?.some(
          (l) =>
            (l.particulars?.toLowerCase().includes(s) ?? false) ||
            (l.sku?.toLowerCase().includes(s) ?? false),
        ) ?? false
      return (
        d.deliveryNo.toLowerCase().includes(s) ||
        d.customerName.toLowerCase().includes(s) ||
        (d.siteName?.toLowerCase().includes(s) ?? false) ||
        (d.siteAddress?.toLowerCase().includes(s) ?? false) ||
        godownMatch ||
        productMatch
      )
    })
  }, [deliveries, q, tab])
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'PROCESSED', label: 'Processed' },
    { id: 'PACKED', label: 'Packed' },
    { id: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'RETURN_PICKUP', label: 'Return pickup' },
    { id: 'PENDING_RETURN', label: 'Pending return' },
    { id: 'COMPLETED', label: 'Completed' },
  ]

  if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY') {
    return <DriverDeliveriesDashboard />
  }

  // ── column header style ──────────────────────────────────────────────────

  const colHead: React.CSSProperties = {
    padding: '10px 16px',
    fontSize: 11,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid #f1f5f9',
    background: 'transparent',
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    // AppShell provides 20px 24px padding — no extra wrapper needed
    <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── PAGE HEADER ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Delivery Manager</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
            Manage customer deliveries, schedules and dispatch workflow.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setCreateOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 22px', borderRadius: 12, border: 'none',
              background: '#059669', fontSize: 14, fontWeight: 600,
              color: '#fff', cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#047857')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#059669')}
          >
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
             Create Delivery
          </button>
        )}
      </div>

      {/* ── MAIN CARD ── */}
      <div style={{
        background: '#fff',
        border: '1px solid #e8eaf0',
        borderRadius: 16,
        overflow: 'hidden',
      }}>

        {/* ── CARD HEADER: title + search + refresh ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid #f1f5f9',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Delivery List</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              {rows.length} deliveries available
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* search */}
            <div style={{ position: 'relative', width: 220 }}>
              <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <SearchIcon />
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search deliveries..."
                style={{
                  width: '100%', height: 36, paddingLeft: 34, paddingRight: 12,
                  border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13,
                  color: '#374151', background: '#f8fafc', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#6ee7b7')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
              />
            </div>

            {/* refresh */}
            <button
              onClick={loadDeliveries}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                height: 36, padding: '0 16px', borderRadius: 9,
                border: '1px solid #e2e8f0', background: '#fff',
                fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.background = '#f8fafc'
                el.style.borderColor = '#a7f3d0'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.background = '#fff'
                el.style.borderColor = '#e2e8f0'
              }}
            >
              <RefreshIcon />
              Refresh
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          padding: '14px 22px', borderBottom: '1px solid #f1f5f9',
        }}>
          {tabs.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  border: active ? 'none' : '1px solid #e2e8f0',
                  background: active ? '#059669' : '#fff',
                  color: active ? '#fff' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = '#ecfdf5'
                    el.style.color = '#059669'
                    el.style.borderColor = '#a7f3d0'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = '#fff'
                    el.style.color = '#64748b'
                    el.style.borderColor = '#e2e8f0'
                  }
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {/* ── GODOWN UNLINKED ── */}
        {godownUnlinked ? (
          <div style={{
            margin: '12px 22px', padding: '10px 14px', borderRadius: 10,
            background: '#fffbeb', color: '#92400e', fontSize: 13,
            border: '1px solid #fde68a',
          }}>
            Godown account is not linked to a warehouse. Log out and sign in again with your godown mobile.
          </div>
        ) : null}

        {/* ── ERROR ── */}
        {error && (
          <div style={{
            margin: '12px 22px', padding: '10px 14px', borderRadius: 10,
            background: '#fef2f2', color: '#b91c1c', fontSize: 13,
            border: '1px solid #fecaca',
          }}>{error}</div>
        )}

        {/* ── SUCCESS ── */}
        {successMessage && (
          <div style={{
            margin: '12px 22px', padding: '10px 14px', borderRadius: 10,
            background: '#f0fdf4', color: '#15803d', fontSize: 13,
            border: '1px solid #bbf7d0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', fontWeight: 700, fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid #e2e8f0', borderTopColor: '#10b981',
              animation: 'spin 0.7s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── EMPTY ── */}
        {!loading && rows.length === 0 && (
          <div style={{ padding: '48px 22px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>No deliveries found</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Try changing the search or delivery status filter.</div>
          </div>
        )}

        {/* ── TABLE ── */}
        {!loading && rows.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
              <thead>
                <tr>
                  <th style={colHead}>Delivery</th>
                  <th style={colHead}>Customer</th>
                  <th style={colHead}>Area</th>
                  <th style={colHead}>Godown</th>
                  <th style={colHead}>Products</th>
                  <th style={colHead}>Status</th>
                  <th style={{ ...colHead, textAlign: 'right' }}>Scheduled</th>
                  {!isGodownUser && <th style={{ ...colHead, textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((d, index) => {
                  const rowBg = index % 2 === 0 ? '#ffffff' : '#fafbfc'
                  const hasProducts = (d.linesSummary?.length ?? 0) > 0
                  return (
                    <Fragment key={d.id}>
                      <tr
                        style={{
                          background: rowBg,
                          borderBottom: expandedId === d.id ? 'none' : '1px solid #f1f5f9',
                          transition: 'background 0.12s',
                          cursor: 'pointer',
                        }}
                        onClick={() => nav(`/deliveries/${d.id}`)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(236,253,245,0.7)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = rowBg)}
                      >
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <Link
                            to={`/deliveries/${d.id}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontWeight: 700,
                              fontSize: 14,
                              color: '#059669',
                              textDecoration: 'none',
                            }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
                          >
                            {d.deliveryNo}
                          </Link>
                        </td>

                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{d.customerName}</span>
                        </td>

                        <td style={{ padding: '14px 16px', verticalAlign: 'middle', maxWidth: 180 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: '#0f172a',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {d.siteName || '—'}
                          </div>
                          {d.siteAddress ? (
                            <div
                              style={{
                                fontSize: 11,
                                color: '#94a3b8',
                                marginTop: 2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {d.siteAddress}
                            </div>
                          ) : null}
                        </td>

                        <td style={{ padding: '14px 16px', verticalAlign: 'middle', maxWidth: 140 }}>
                          <span
                            style={{
                              fontSize: 13,
                              color: '#374151',
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatGodownLabel(d.godownNames, d.primaryGodownName)}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                              {d.productCount ?? 0} items · {d.totalQty ?? 0} qty
                            </span>
                            {hasProducts ? (
                              <button
                                type="button"
                                onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 8,
                                  border: '1px solid #bbf7d0',
                                  background: expandedId === d.id ? '#ecfdf5' : '#fff',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: '#059669',
                                  cursor: 'pointer',
                                }}
                              >
                                {expandedId === d.id ? 'Hide' : 'View'}
                              </button>
                            ) : null}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
                          <DeliveryStatusSelect
                            deliveryId={d.id}
                            status={d.status}
                            vehicleLabel={d.vehicleLabel}
                            driverName={d.driverName}
                            driverPhone={d.driverPhone}
                            returnPickupVehicleLabel={d.returnPickupVehicleLabel}
                            returnPickupDriverName={d.returnPickupDriverName}
                            returnPickupDriverPhone={d.returnPickupDriverPhone}
                            onUpdated={(patch) => handleStatusUpdated(d.id, patch)}
                            onError={(msg) => setError(msg)}
                          />
                        </td>

                        <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap' }}>
                            {formatDateTime(d.deliveryAt)}
                          </span>
                        </td>

                        {!isGodownUser && (
                          <td
                            style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <DeliveryRowActions
                                delivery={d}
                                onEdit={(deliveryId) => setEditDeliveryId(deliveryId)}
                                onScan={(path) => nav(path)}
                                onDeleted={() => {
                                  removeFromList(d.id)
                                  setSuccessMessage(`${d.deliveryNo} deleted successfully`)
                                  setError(null)
                                }}
                                onError={(msg) => setError(msg)}
                              />
                            </div>
                          </td>
                        )}
                      </tr>
                      {expandedId === d.id && hasProducts ? (
                        <tr>
                          <td colSpan={isGodownUser ? 7 : 8} style={{ padding: '0 16px 14px', background: rowBg }}>
                            <div
                              style={{
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: 10,
                                padding: '4px 4px 8px',
                              }}
                            >
                              <DeliveryProductsPanel lines={d.linesSummary} />
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── PAGINATION ── */}
      {!loading && rows.length > PAGE_SIZE && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 4px' }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, rows.length)} of {rows.length}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{
                height: 34, minWidth: 34, padding: '0 10px', borderRadius: 8,
                border: '1px solid #e2e8f0', background: currentPage === 1 ? '#f8fafc' : '#fff',
                fontSize: 13, fontWeight: 600, color: currentPage === 1 ? '#cbd5e1' : '#374151',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((item, i) =>
                item === '...' ? (
                  <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: 13 }}>…</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item as number)}
                    style={{
                      height: 34, minWidth: 34, padding: '0 10px', borderRadius: 8,
                      border: `1px solid ${currentPage === item ? '#059669' : '#e2e8f0'}`,
                      background: currentPage === item ? '#059669' : '#fff',
                      fontSize: 13, fontWeight: 600,
                      color: currentPage === item ? '#fff' : '#374151',
                      cursor: 'pointer',
                    }}
                  >
                    {item}
                  </button>
                )
              )}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{
                height: 34, minWidth: 34, padding: '0 10px', borderRadius: 8,
                border: '1px solid #e2e8f0', background: currentPage === totalPages ? '#f8fafc' : '#fff',
                fontSize: 13, fontWeight: 600, color: currentPage === totalPages ? '#cbd5e1' : '#374151',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      <CreateDeliveryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={loadDeliveries}
      />
      <CreateDeliveryModal
        open={!!editDeliveryId}
        deliveryId={editDeliveryId}
        onClose={() => setEditDeliveryId(null)}
        onCreated={loadDeliveries}
        onUpdated={loadDeliveries}
      />
    </div>
  )
}