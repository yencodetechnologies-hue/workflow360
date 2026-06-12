// import React, { Fragment, useEffect, useMemo, useState } from 'react'
// import { Link } from 'react-router-dom'
// import { ReportFiltersBar } from '../components/reports/ReportFiltersBar'
// import { formatNumber } from '../lib/format'
// import { Badge } from '../components/ui/Badge'
// // import { StatCard } from '../components/ui/StatCard'
// import { apiFetch } from '../lib/api'
// import { getToken, useAuth } from '../auth/store'
// import { useReportFilters } from '../hooks/useReportFilters'
// // At the top of the file, add this import:
// import ReactDOM from 'react-dom'
// import type {
//   BillerReturnRow,
//   CustomerIssueReport,
//   CustomerProductsReport,
//   GodownIssueRow,
//   IssueDeliveryRow,
//   ProductReturnRow,
//   ReportTab,
// } from '../types/reports'

// // -- constants --------------------------------------------------------------

// const ISSUE_SUB_TABS: { id: ReportTab; label: string }[] = [
//   { id: 'issues-godown', label: 'By godown' },
//   { id: 'issues-biller', label: 'Missing by biller' },
//   { id: 'issues-delivery', label: 'By delivery' },
//   { id: 'issues-customer', label: 'By customer' },
// ]

// const ISSUE_TABS = new Set<ReportTab>(['issues-godown', 'issues-biller', 'issues-delivery', 'issues-customer'])

// // -- helpers ----------------------------------------------------------------

// function formatCurrency(n: number) {
//   return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
// }

// function badgeVariant(status: string) {
//   if (status === 'PROCESSED' || status === 'UPCOMING') return 'green'
//   if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return 'green'
//   if (status === 'PACKED') return 'slate'
//   if (status === 'RETURN_PICKUP') return 'amber'
//   if (status === 'COMPLETED') return 'slate'
//   return 'amber'
// }

// function formatDeliveryDate(iso: string) {
//   return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
// }

// // -- shared inline table styles ---------------------------------------------

// const tHead: React.CSSProperties = {
//   padding: '10px 14px',
//   fontSize: 11,
//   fontWeight: 700,
//   color: '#94a3b8',
//   textTransform: 'uppercase',
//   letterSpacing: '0.07em',
//   textAlign: 'left',
//   whiteSpace: 'nowrap',
//   background: '#f8fafc',
//   borderBottom: '1px solid #f1f5f9',
// }

// const tCell: React.CSSProperties = {
//   padding: '13px 14px',
//   fontSize: 13,
//   color: '#374151',
//   borderBottom: '1px solid #f1f5f9',
//   verticalAlign: 'middle',
// }

// // -- reusable card ----------------------------------------------------------

// function ReportCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
//   return (
//     // overflow must NOT be 'hidden' — SearchableSelect dropdowns need to escape the card boundary
//     <div style={{
//       background: '#fff',
//       border: '1px solid #e8eaf0',
//       borderRadius: 14,
//       ...style,
//     }}>
//       {children}
//     </div>
//   )
// }

// function CardHead({ title, sub }: { title: string; sub?: string }) {
//   return (
//     <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
//       <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</div>
//       {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
//     </div>
//   )
// }

// // -- pill tab button --------------------------------------------------------

// // function PillTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
// //   return (
// //     <button
// //       onClick={onClick}
// //       style={{
// //         padding: '7px 16px',
// //         borderRadius: 20,
// //         fontSize: 13,
// //         fontWeight: active ? 700 : 500,
// //         border: active ? 'none' : '1px solid #e2e8f0',
// //         background: active ? '#059669' : '#fff',
// //         color: active ? '#fff' : '#64748b',
// //         cursor: 'pointer',
// //         transition: 'all 0.15s',
// //         whiteSpace: 'nowrap',
// //       }}
// //       onMouseEnter={(e) => {
// //         if (!active) {
// //           const el = e.currentTarget as HTMLElement
// //           el.style.background = '#ecfdf5'
// //           el.style.color = '#059669'
// //           el.style.borderColor = '#a7f3d0'
// //         }
// //       }}
// //       onMouseLeave={(e) => {
// //         if (!active) {
// //           const el = e.currentTarget as HTMLElement
// //           el.style.background = '#fff'
// //           el.style.color = '#64748b'
// //           el.style.borderColor = '#e2e8f0'
// //         }
// //       }}
// //     >
// //       {label}
// //     </button>
// //   )
// // }

// // -- sub-pill tab (smaller, for issue sub-tabs) -----------------------------

// function SubPillTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
//   return (
//     <button
//       onClick={onClick}
//       style={{
//         padding: '5px 13px',
//         borderRadius: 20,
//         fontSize: 12,
//         fontWeight: active ? 700 : 500,
//         border: active ? 'none' : '1px solid #e2e8f0',
//         background: active ? '#10b981' : '#fff',
//         color: active ? '#fff' : '#64748b',
//         cursor: 'pointer',
//         transition: 'all 0.15s',
//         whiteSpace: 'nowrap',
//       }}
//       onMouseEnter={(e) => {
//         if (!active) {
//           const el = e.currentTarget as HTMLElement
//           el.style.background = '#ecfdf5'
//           el.style.color = '#059669'
//         }
//       }}
//       onMouseLeave={(e) => {
//         if (!active) {
//           const el = e.currentTarget as HTMLElement
//           el.style.background = '#fff'
//           el.style.color = '#64748b'
//         }
//       }}
//     >
//       {label}
//     </button>
//   )
// }

// // -- empty state ------------------------------------------------------------

// function Empty({ title, sub }: { title: string; sub: string }) {
//   return (
//     <div style={{ padding: '40px 0', textAlign: 'center' }}>
//       <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{title}</div>
//       <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div>
//     </div>
//   )
// }

// // -- product lines expandable panel ----------------------------------------

// function ProductLinesPanel({ row }: { row: IssueDeliveryRow }) {
//   if (!row.productMissing.length && !row.productDamaged.length) return null
//   return (
//     <div style={{
//       display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
//       background: '#f8fafc', borderRadius: 8, padding: 16,
//     }}>
//       {[
//         { label: 'Missing products', items: row.productMissing },
//         { label: 'Damaged products', items: row.productDamaged },
//       ].map(({ label, items }) => (
//         <div key={label}>
//           <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{label}</div>
//           {items.length ? items.map((p) => (
//             <div key={p.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', paddingBottom: 6 }}>
//               <span>{p.particulars || p.sku || p.productId}</span>
//               <span style={{ fontWeight: 600 }}>qty {p.qty}</span>
//             </div>
//           )) : <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>None reported.</p>}
//         </div>
//       ))}
//     </div>
//   )
// }


// // -- product-wise panel: aggregated product list with godown/biller/delivery/customer ──

// type PwLine = {
//   productId: string
//   particulars?: string
//   sku?: string
//   missingQty: number
//   damageQty: number
//   rows: Array<{
//     deliveryId: string
//     deliveryNo: string
//     customerName: string
//     siteName?: string
//     godownName?: string
//     deliveryAt: string
//     qty: number
//     type: 'missing' | 'damage'
//   }>
// }

// function buildPwLines(deliveries: IssueDeliveryRow[]): PwLine[] {
//   const map = new Map<string, PwLine>()
//   const add = (
//     p: { productId: string; particulars?: string; sku?: string; qty: number },
//     d: IssueDeliveryRow,
//     type: 'missing' | 'damage',
//   ) => {
//     if (!map.has(p.productId)) {
//       map.set(p.productId, { productId: p.productId, particulars: p.particulars, sku: p.sku, missingQty: 0, damageQty: 0, rows: [] })
//     }
//     const e = map.get(p.productId)!
//     if (type === 'missing') e.missingQty += p.qty; else e.damageQty += p.qty
//     e.rows.push({ deliveryId: d.id, deliveryNo: d.deliveryNo, customerName: d.customerName, siteName: d.siteName, godownName: d.godownName, deliveryAt: d.deliveryAt, qty: p.qty, type })
//   }
//   for (const d of deliveries) {
//     for (const p of d.productMissing) add(p, d, 'missing')
//     for (const p of d.productDamaged) add(p, d, 'damage')
//   }
//   return Array.from(map.values()).sort((a, b) => (b.missingQty + b.damageQty) - (a.missingQty + a.damageQty))
// }

// function ProductWisePanel({
//   lines, expandedId, onToggle,
//   showGodown = true, showCustomer = true,
// }: {
//   lines: PwLine[]
//   expandedId: string | null
//   onToggle: (id: string | null) => void
//   showGodown?: boolean
//   showCustomer?: boolean
// }) {
//   if (!lines.length) return <Empty title="No product issues" sub="No missing or damaged products for the selected filters." />
//   return (
//     <div style={{ overflowX: 'auto' }}>
//       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
//         <thead>
//           <tr>
//             <th style={tHead}>Product</th>
//             <th style={tHead}>SKU</th>
//             <th style={{ ...tHead, textAlign: 'right', color: '#dc2626' }}>Missing qty</th>
//             <th style={{ ...tHead, textAlign: 'right', color: '#d97706' }}>Damage qty</th>
//             <th style={{ ...tHead, textAlign: 'right' }}>Deliveries</th>
//             <th style={tHead}></th>
//           </tr>
//         </thead>
//         <tbody>
//           {lines.map((p) => (
//             <Fragment key={p.productId}>
//               <tr
//                 style={{ transition: 'background 0.12s', cursor: 'pointer' }}
//                 onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.25)')}
//                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//               >
//                 <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{p.particulars || p.productId}</td>
//                 <td style={{ ...tCell, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{p.sku || '—'}</td>
//                 <td style={{ ...tCell, textAlign: 'right', fontWeight: p.missingQty > 0 ? 700 : undefined, color: p.missingQty > 0 ? '#dc2626' : '#94a3b8' }}>{formatNumber(p.missingQty)}</td>
//                 <td style={{ ...tCell, textAlign: 'right', fontWeight: p.damageQty > 0 ? 700 : undefined, color: p.damageQty > 0 ? '#d97706' : '#94a3b8' }}>{formatNumber(p.damageQty)}</td>
//                 <td style={{ ...tCell, textAlign: 'right' }}>{p.rows.length}</td>
//                 <td style={tCell}>
//                   <button
//                     onClick={() => onToggle(expandedId === p.productId ? null : p.productId)}
//                     style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', fontSize: 12, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}
//                   >{expandedId === p.productId ? 'Hide' : 'View details'}</button>
//                 </td>
//               </tr>
//               {expandedId === p.productId && (
//                 <tr>
//                   <td colSpan={6} style={{ padding: '0 14px 14px' }}>
//                     <div style={{ background: '#fef9f9', border: '1px solid #fecaca', borderRadius: 10, padding: 14, marginTop: 2 }}>
//                       <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
//                         Delivery breakdown — {p.particulars || p.productId}
//                       </div>
//                       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                         <thead>
//                           <tr>
//                             <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Delivery</th>
//                             <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Date</th>
//                             {showCustomer && <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Customer</th>}
//                             {showCustomer && <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Site</th>}
//                             {showGodown && <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Godown</th>}
//                             <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px', textAlign: 'right' }}>Qty</th>
//                             <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Type</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {p.rows.map((r, idx) => (
//                             <tr key={idx}
//                               onMouseEnter={(e) => (e.currentTarget.style.background = '#fff5f5')}
//                               onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//                             >
//                               <td style={{ ...tCell, padding: '8px 10px' }}>
//                                 <Link to={`/deliveries/${r.deliveryId}`}
//                                   style={{ fontWeight: 600, color: '#059669', textDecoration: 'none', fontSize: 12 }}
//                                   onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
//                                   onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
//                                 >{r.deliveryNo}</Link>
//                               </td>
//                               <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDeliveryDate(r.deliveryAt)}</td>
//                               {showCustomer && <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.customerName}</td>}
//                               {showCustomer && <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.siteName || '—'}</td>}
//                               {showGodown && <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.godownName || '—'}</td>}
//                               <td style={{ ...tCell, padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: r.type === 'missing' ? '#dc2626' : '#d97706', fontSize: 13 }}>{formatNumber(r.qty)}</td>
//                               <td style={{ ...tCell, padding: '8px 10px' }}>
//                                 <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: r.type === 'missing' ? '#fef2f2' : '#fffbeb', color: r.type === 'missing' ? '#dc2626' : '#d97706' }}>
//                                   {r.type === 'missing' ? 'Missing' : 'Damaged'}
//                                 </span>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </td>
//                 </tr>
//               )}
//             </Fragment>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// // -- issue delivery table ---------------------------------------------------

// function IssueDeliveryTable({
//   rows, expandedId, onToggleExpand,
// }: {
//   rows: IssueDeliveryRow[]
//   expandedId: string | null
//   onToggleExpand: (id: string | null) => void
// }) {
//   if (!rows.length) return <Empty title="No deliveries" sub="No deliveries match the selected filters." />
//   return (
//     <div style={{ overflowX: 'auto' }}>
//       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
//         <thead>
//           <tr>
//             {['Delivery','Date','Customer','Site','Godown','Status','Missing qty','Damage qty','Tags missing',''].map((h, i) => (
//               <th key={i} style={{ ...tHead, textAlign: i >= 6 && i <= 8 ? 'right' : 'left' }}>{h}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((m) => (
//             <Fragment key={m.id}>
//               <tr
//                 style={{ transition: 'background 0.12s' }}
//                 onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.4)')}
//                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//               >
//                 <td style={tCell}>
//                   <Link to={`/deliveries/${m.id}`} style={{ fontWeight: 600, color: '#059669', textDecoration: 'none' }}
//                     onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
//                     onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
//                   >{m.deliveryNo}</Link>
//                 </td>
//                 <td style={{ ...tCell, whiteSpace: 'nowrap' }}>{formatDeliveryDate(m.deliveryAt)}</td>
//                 <td style={{ ...tCell, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.customerName}</td>
//                 <td style={{ ...tCell, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.siteName || '—'}</td>
//                 <td style={{ ...tCell, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.godownName || '—'}</td>
//                 <td style={tCell}><Badge variant={badgeVariant(m.status)}>{m.status}</Badge></td>
//                 <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.missingQty)}</td>
//                 <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.damageQty)}</td>
//                 <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.missingTagCount ?? m.missingCount)}</td>
//                 <td style={{ ...tCell }}>
//                   {(m.productMissing.length || m.productDamaged.length) ? (
//                     <button
//                       onClick={() => onToggleExpand(expandedId === m.id ? null : m.id)}
//                       style={{
//                         padding: '4px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
//                         background: '#fff', fontSize: 12, fontWeight: 600, color: '#059669',
//                         cursor: 'pointer',
//                       }}
//                     >{expandedId === m.id ? 'Hide' : 'Products'}</button>
//                   ) : null}
//                 </td>
//               </tr>
//               {expandedId === m.id && (
//                 <tr>
//                   <td colSpan={10} style={{ padding: '0 14px 12px' }}>
//                     <ProductLinesPanel row={m} />
//                   </td>
//                 </tr>
//               )}
//             </Fragment>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// // -- missing report step indicator ------------------------------------------

// // function MissingStepper({ step, labels }: { step: 1 | 2 | 3; labels: [string, string, string] }) {
// // ...
// // }

// // -- missing orders table (per biller) --------------------------------------

// function MissingOrdersTable({ rows }: { rows: IssueDeliveryRow[] }) {
//   if (!rows.length) {
//     return <Empty title="No missing orders" sub="This biller has no orders with missing items in the selected period." />
//   }
//   return (
//     <div style={{ overflowX: 'auto' }}>
//       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
//         <thead>
//           <tr>
//             {['Order', 'Date', 'Customer', 'Site', 'Status', 'Missing qty', 'Value (?)', 'Products'].map((h, i) => (
//               <th key={h} style={{ ...tHead, textAlign: i >= 5 && i <= 6 ? 'right' : 'left' }}>{h}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((m) => (
//             <tr key={m.id} style={{ transition: 'background 0.12s' }}
//               onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.35)')}
//               onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//             >
//               <td style={tCell}>
//                 <Link to={`/deliveries/${m.id}`} style={{ fontWeight: 600, color: '#dc2626', textDecoration: 'none' }}
//                   onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
//                   onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
//                 >{m.deliveryNo}</Link>
//               </td>
//               <td style={{ ...tCell, whiteSpace: 'nowrap' }}>{formatDeliveryDate(m.deliveryAt)}</td>
//               <td style={{ ...tCell, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.customerName}</td>
//               <td style={{ ...tCell, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.siteName || '—'}</td>
//               <td style={tCell}><Badge variant={badgeVariant(m.status)}>{m.status}</Badge></td>
//               <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(m.missingQty)}</td>
//               <td style={{ ...tCell, textAlign: 'right' }}>{m.missingTotal != null ? formatCurrency(m.missingTotal) : '—'}</td>
//               <td style={{ ...tCell, fontSize: 12, color: '#64748b', maxWidth: 180 }}>
//                 {m.productMissing.slice(0, 2).map((p) => p.particulars || p.sku).join(', ')}
//                 {m.productMissing.length > 2 ? ` +${m.productMissing.length - 2}` : ''}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// // -- product missing table (per biller, with orders) ------------------------

// function ProductMissingTable({
//   rows,
//   expandedId,
//   onToggleExpand,
// }: {
//   rows: ProductReturnRow[]
//   expandedId: string | null
//   onToggleExpand: (id: string | null) => void
// }) {
//   if (!rows.length) {
//     return <Empty title="No missing products" sub="No product-level missing data for this biller and period." />
//   }
//   return (
//     <div style={{ overflowX: 'auto' }}>
//       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
//         <thead>
//           <tr>
//             {['Product', 'SKU', 'Missing qty', 'Orders', ''].map((h, i) => (
//               <th key={i} style={{ ...tHead, textAlign: i === 2 || i === 3 ? 'right' : 'left' }}>{h}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((r) => (
//             <Fragment key={r.productId}>
//               <tr
//                 style={{ transition: 'background 0.12s' }}
//                 onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.25)')}
//                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//               >
//                 <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{r.particulars || r.productId}</td>
//                 <td style={tCell}>{r.sku || '—'}</td>
//                 <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(r.totalQty)}</td>
//                 <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(r.deliveryCount)}</td>
//                 <td style={tCell}>
//                   {r.deliveries.length ? (
//                     <button
//                       onClick={() => onToggleExpand(expandedId === r.productId ? null : r.productId)}
//                       style={{
//                         padding: '4px 12px', borderRadius: 8, border: '1px solid #fecaca',
//                         background: '#fff', fontSize: 12, fontWeight: 600, color: '#dc2626',
//                         cursor: 'pointer',
//                       }}
//                     >{expandedId === r.productId ? 'Hide orders' : 'View orders'}</button>
//                   ) : null}
//                 </td>
//               </tr>
//               {expandedId === r.productId && (
//                 <tr>
//                   <td colSpan={5} style={{ padding: '0 14px 12px' }}>
//                     <div style={{ background: '#fef2f2', borderRadius: 8, padding: 14, border: '1px solid #fecaca' }}>
//                       <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
//                         Missing orders for this product
//                       </div>
//                       {r.deliveries.map((d) => (
//                         <div key={d.id} style={{
//                           display: 'grid', gridTemplateColumns: '1fr auto', gap: 8,
//                           fontSize: 12, color: '#374151', paddingBottom: 8,
//                           borderBottom: '1px solid #fee2e2', marginBottom: 8,
//                         }}>
//                           <div>
//                             <Link to={`/deliveries/${d.id}`} style={{ fontWeight: 600, color: '#dc2626', textDecoration: 'none' }}>
//                               {d.deliveryNo}
//                             </Link>
//                             {d.customerName ? (
//                               <span style={{ color: '#64748b', marginLeft: 8 }}>{d.customerName}</span>
//                             ) : null}
//                             {d.deliveryAt ? (
//                               <span style={{ color: '#94a3b8', marginLeft: 8 }}>{formatDeliveryDate(d.deliveryAt)}</span>
//                             ) : null}
//                           </div>
//                           <span style={{ fontWeight: 700, color: '#dc2626', whiteSpace: 'nowrap' }}>
//                             qty {formatNumber(d.qty)}{d.note ? ` · ${d.note}` : ''}
//                           </span>
//                         </div>
//                       ))}
//                     </div>
//                   </td>
//                 </tr>
//               )}
//             </Fragment>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// // -- inline searchable select for biller ------------------------------------

// function InlineSearchableSelect({
//   value, onChange, options, placeholder = '— Select —',
// }: {
//   value: string
//   onChange: (v: string) => void
//   options: Array<{ value: string; label: string }>
//   placeholder?: string
// }) {
//   const [open, setOpen] = React.useState(false)
//   const [search, setSearch] = React.useState('')
//   const [dropPos, setDropPos] = React.useState({ top: 0, left: 0, width: 0 })
//   const wrapRef = React.useRef<HTMLDivElement>(null)
//   const btnRef = React.useRef<HTMLButtonElement>(null)
//   const inputRef = React.useRef<HTMLInputElement>(null)
//   const dropRef = React.useRef<HTMLDivElement>(null)

//   // Close on outside click — must check both the trigger and the portal
//   React.useEffect(() => {
//     if (!open) return
//     const handler = (e: MouseEvent) => {
//       const t = e.target as Node
//       if (wrapRef.current?.contains(t)) return
//       if (dropRef.current?.contains(t)) return
//       setOpen(false)
//       setSearch('')
//     }
//     document.addEventListener('mousedown', handler)
//     return () => document.removeEventListener('mousedown', handler)
//   }, [open])

//   // Compute and update dropdown position whenever open or on scroll/resize
//   React.useEffect(() => {
//     if (!open) return
//     const reposition = () => {
//       if (btnRef.current) {
//         const r = btnRef.current.getBoundingClientRect()
//         const DROPDOWN_W = 360
//         const clampedLeft = Math.max(8, Math.min(r.left, window.innerWidth - DROPDOWN_W - 8))
//         setDropPos({ top: r.bottom + 4, left: clampedLeft, width: Math.max(r.width, DROPDOWN_W) })
//       }
//     }
//     reposition() // set position immediately when opened
//     window.addEventListener('scroll', reposition, true)
//     window.addEventListener('resize', reposition)
//     return () => {
//       window.removeEventListener('scroll', reposition, true)
//       window.removeEventListener('resize', reposition)
//     }
//   }, [open])

//   React.useEffect(() => {
//     if (open) setTimeout(() => inputRef.current?.focus(), 50)
//   }, [open])

//   const handleToggle = () => {
//     setOpen(o => !o)
//     setSearch('')
//   }

//   const handleSelect = (val: string) => {
//     onChange(val)
//     setOpen(false)
//     setSearch('')
//   }

//   const filtered = search.trim()
//     ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
//     : options

//   const selectedLabel = options.find(o => o.value === value)?.label ?? placeholder

//   const dropdown = open ? ReactDOM.createPortal(
//     <div
//       ref={dropRef}
//       style={{
//         position: 'fixed',
//         top: dropPos.top,
//         left: dropPos.left,
//         minWidth: dropPos.width,
//         maxWidth: 360,
//         zIndex: 99999,
//         background: '#fff',
//         border: '1px solid #d1fae5',
//         borderRadius: 10,
//         boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
//         overflow: 'hidden',
//       }}
//     >
//       {/* Search box */}
//       <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
//         <div style={{ position: 'relative' }}>
//           <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}
//             width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//             <circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4.5 4.5" strokeLinecap="round" />
//           </svg>
//           <input
//             ref={inputRef}
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//             placeholder="Search…"
//             style={{
//               width: '100%', height: 30, paddingLeft: 26, paddingRight: 8,
//               border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12,
//               color: '#0f172a', background: '#f8fafc', outline: 'none',
//               boxSizing: 'border-box', fontFamily: 'inherit',
//             }}
//             onKeyDown={e => e.key === 'Escape' && (setOpen(false), setSearch(''))}
//           />
//         </div>
//       </div>
//       {/* Options */}
//       <div style={{ maxHeight: 220, overflowY: 'auto' }}>
//         {filtered.length === 0
//           ? <div style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>No results</div>
//           : filtered.map(o => (
//             <div
//               key={o.value}
//               onMouseDown={e => { e.preventDefault(); handleSelect(o.value) }}
//               style={{
//                 padding: '8px 14px', fontSize: 13, cursor: 'pointer',
//                 color: o.value === value ? '#059669' : '#0f172a',
//                 fontWeight: o.value === value ? 700 : 400,
//                 background: o.value === value ? '#f0fdf4' : undefined,
//               }}
//               onMouseEnter={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
//               onMouseLeave={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = o.value === value ? '#f0fdf4' : '' }}
//             >{o.label}</div>
//           ))
//         }
//       </div>
//     </div>,
//     document.body,
//   ) : null

//   return (
//     <div ref={wrapRef} style={{ position: 'relative', minWidth: 220 }}>
//       <button
//         ref={btnRef}
//         type="button"
//         onClick={handleToggle}
//         style={{
//           height: 38, width: '100%', minWidth: 220, padding: '0 32px 0 12px',
//           border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff',
//           fontSize: 13, color: value ? '#0f172a' : '#94a3b8', textAlign: 'left',
//           cursor: 'pointer', position: 'relative', fontFamily: 'inherit',
//           boxShadow: '0 1px 2px rgba(0,0,0,0.04)', whiteSpace: 'nowrap',
//           overflow: 'hidden', textOverflow: 'ellipsis',
//           outline: open ? '2px solid #a7f3d0' : 'none',
//         }}
//       >
//         {selectedLabel}
//         <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
//           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//             <path d="m6 9 6 6 6-6" />
//           </svg>
//         </span>
//       </button>
//       {dropdown}
//     </div>
//   )
// }

// // -- main component ---------------------------------------------------------

// export function ReportsPage() {
//   const auth = useAuth()
//   const {
//     date, dateTo, godownId, site, customerName, billerUserId, productId, tab, godowns, sites, customers,
//     billers: billersRaw, products: productsRaw,
//     filterQuery, dateQuery, setFilters, lockGodownFilter,
//   } = useReportFilters()

//   // Defensive fallbacks — guard against hook not returning these
//   const billers = (billersRaw as typeof billersRaw | undefined) ?? []
//   const products = (productsRaw as typeof productsRaw | undefined) ?? []

//   const resolvedTab = (ISSUE_TABS.has(tab as ReportTab) ? tab : 'issues-godown') as ReportTab
//   const activeTab = resolvedTab
//   const issueSubTab = ISSUE_TABS.has(activeTab) ? activeTab : 'issues-godown'
//   const showIssueSection = ISSUE_TABS.has(activeTab) || activeTab === 'issues-godown'

//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [godownIssues, setGodownIssues] = useState<GodownIssueRow[] | null>(null)
//   const [deliveryIssues, setDeliveryIssues] = useState<IssueDeliveryRow[] | null>(null)
//   const [customerReport, setCustomerReport] = useState<CustomerIssueReport | null>(null)
//   const [customerProducts, setCustomerProducts] = useState<CustomerProductsReport | null>(null)
//   // const [stock, setStock] = useState<StockReportRow[] | null>(null)
//   const [billerReturns, setBillerReturns] = useState<BillerReturnRow[] | null>(null) // kept for selectedBillerStats
//   const [productReturns, setProductReturns] = useState<ProductReturnRow[] | null>(null)
//   const [missingOrders, setMissingOrders] = useState<IssueDeliveryRow[] | null>(null)
//   const [expandedId, setExpandedId] = useState<string | null>(null)
//   const [pwExpandedId, setPwExpandedId] = useState<string | null>(null)
//   const [showPwView, setShowPwView] = useState(false)

//   const isBillerRole = auth.status === 'authenticated' && auth.user.role === 'BILLER'
//   const selectedGodownName = godowns.find((g) => g.id === godownId)?.name
//   const selectedBillerName = useMemo(() => {
//     if (isBillerRole && auth.status === 'authenticated') {
//       return auth.user.contactName || auth.user.siteName || 'My returns'
//     }
//     return billerReturns?.find((b) => b.billerUserId === billerUserId)?.billerName || billerUserId
//   }, [isBillerRole, auth, billerReturns, billerUserId])

//   // const showBillerGodowns = false // removed drill-down flow
//   // const showBillerList = false    // removed drill-down flow
//   const showProductList = activeTab === 'issues-biller' && (Boolean(billerUserId) || isBillerRole)

//   // const billerStep: 1 | 2 | 3 = showProductList ? 3 : showBillerList ? 2 : 1

//   const selectedBillerStats = useMemo(() => {
//     const b = billerReturns?.find((row) => row.billerUserId === billerUserId)
//     if (b) return b
//     if (!missingOrders?.length) return null
//     return {
//       missingOrderCount: missingOrders.length,
//       missingQty: missingOrders.reduce((s, o) => s + o.missingQty, 0),
//       missingTotal: missingOrders.reduce((s, o) => s + (o.missingTotal || 0), 0),
//     }
//   }, [billerReturns, billerUserId, missingOrders])

//   useEffect(() => { setShowPwView(false); setPwExpandedId(null) }, [activeTab, godownId, billerUserId, customerName])

//   useEffect(() => {
//     if (!ISSUE_TABS.has(activeTab)) return
//     const token = getToken(); if (!token) return
//     if (activeTab === 'issues-customer' && !customerName.trim()) { setCustomerReport(null); setCustomerProducts(null); return }
//     setLoading(true); setError(null)

//     const loadGodown = () =>
//       apiFetch<GodownIssueRow[]>(`/reports/issues/by-godown?${dateQuery}limit=100${filterQuery}`, { token })
//         .then(setGodownIssues).catch(() => setGodownIssues([]))
//     const loadDelivery = () =>
//       apiFetch<IssueDeliveryRow[]>(`/reports/issues/by-delivery?${dateQuery}limit=100${filterQuery}`, { token })
//         .then(setDeliveryIssues).catch(() => setDeliveryIssues([]))
//     const loadCustomer = () => {
//       const cn = encodeURIComponent(customerName.trim())
//       const fq = filterQuery.replace(/&?customerName=[^&]*/g, '')
//       return Promise.all([
//         apiFetch<CustomerIssueReport>(`/reports/issues/customer?${dateQuery}customerName=${cn}${fq}`, { token })
//           .then(setCustomerReport).catch(() => setCustomerReport(null)),
//         apiFetch<CustomerProductsReport>(`/reports/issues/customer-products?${dateQuery}customerName=${cn}${fq}`, { token })
//           .then(setCustomerProducts).catch(() => setCustomerProducts(null)),
//       ]).then(() => undefined)
//     }

//     const promises: Promise<void>[] = []
//     if (activeTab === 'issues-godown' || (activeTab === 'issues-biller' && !godownId && !lockGodownFilter)) {
//       promises.push(loadGodown())
//     }
//     if (activeTab === 'issues-godown' || activeTab === 'issues-delivery') promises.push(loadDelivery())
//     if (activeTab === 'issues-customer') promises.push(loadCustomer())
//     Promise.all(promises).finally(() => setLoading(false))
//   }, [date, dateTo, dateQuery, filterQuery, activeTab, customerName, godownId, site, lockGodownFilter])

//   useEffect(() => {
//     if (activeTab !== 'issues-biller') return
//     const token = getToken(); if (!token) return

//     if (showProductList) {
//       setLoading(true); setError(null)
//       const fq = filterQuery.includes('billerUserId')
//         ? filterQuery
//         : `${filterQuery}&billerUserId=${encodeURIComponent(billerUserId)}`
//       const godownPart = godownId ? `godownId=${encodeURIComponent(godownId)}&` : ''

// const productQ =`/reports/returns/by-product?date=${date}&godownId=6a06a76afb0121a70a2c12bc&billerUserId=${encodeURIComponent(billerUserId)}&metric=missing`

// // `/reports/returns/by-product?${dateQuery}${godownId ? `godownId=${encodeURIComponent(godownId)}&` : ''}billerUserId=${encodeURIComponent(billerUserId)}&metric=missing`
//       const ordersQ = `/reports/issues/by-delivery?${dateQuery}${godownPart}${fq.replace(/^&/, '')}&limit=200`
//       Promise.all([
//         apiFetch<ProductReturnRow[]>(productQ, { token }),
//         apiFetch<IssueDeliveryRow[]>(ordersQ, { token }),
//       ])
//         .then(([prods, orders]) => {
//           setProductReturns(prods)
//           setMissingOrders(orders.filter((o) => o.missingQty > 0))
//         })
//         .catch((e: unknown) => {
//           setError(e instanceof Error ? e.message : 'Failed to load missing report')
//           setProductReturns([])
//           setMissingOrders([])
//         })
//         .finally(() => setLoading(false))
//       return
//     }

//     setBillerReturns(null)
//     setProductReturns(null)
//     setMissingOrders(null)
//   }, [activeTab, date, dateTo, dateQuery, filterQuery, godownId, billerUserId, showProductList])

//   // useEffect(() => {
//   //   if (activeTab !== 'stock') return
//   //   const token = getToken(); if (!token) return
//   //   if (auth.status !== 'authenticated' || (auth.user.role !== 'ADMIN' && auth.user.role !== 'GODOWN')) return
//   //   setLoading(true); setError(null)
//   //   const gidQ = godownId ? `?godownId=${encodeURIComponent(godownId)}` : ''
//   //   apiFetch<StockReportRow[]>(`/reports/stock${gidQ}`, { token })
//   //     .then(setStock)
//   //     .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load stock'))
//   //     .finally(() => setLoading(false))
//   // }, [activeTab, godownId, auth])

//   const pwLines = useMemo(
//     () => buildPwLines(deliveryIssues || []),
//     [deliveryIssues],
//   )

//   const customerPwLines = useMemo(
//     () => buildPwLines(customerReport?.deliveries || []),
//     [customerReport],
//   )

//   const billerPwLines = useMemo(
//     () => buildPwLines(missingOrders || []),
//     [missingOrders],
//   )

//   // -- shared table styles ------------------------------------------------

//   const tableWrap: React.CSSProperties = { overflowX: 'auto' }
//   const tableEl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 800 }

//   return (
//     // AppShell provides 20px 24px padding
//     <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 16 }}>

//       {/* -- FILTERS CARD -- */}
//       <ReportCard>
//         <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f0f9' }}>
//           <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Filters</div>
//         </div>
//         <div style={{ padding: '18px 20px' }}>
//           <ReportFiltersBar
//             godowns={godowns}
//             sites={sites}
//             customers={customers}
//             billers={billers}
//             products={products}
//             godownId={godownId}
//             site={site}
//             customerName={customerName}
//             billerUserId={billerUserId}
//             productId={productId}
//             onGodownChange={(id) => setFilters({
//               godownId: id,
//               billerUserId: activeTab === 'issues-biller' && !isBillerRole ? billerUserId : billerUserId,
//             })}
//             onSiteChange={(s) => setFilters({ site: s })}
//             onCustomerChange={(name) => setFilters({ customerName: name })}
//             onBillerChange={(id) => setFilters({ billerUserId: id })}
//             onProductChange={(id) => setFilters({ productId: id })}
//             showDate
//             showDateTo={showIssueSection}
//             date={date}
//             dateTo={dateTo}
//             onDateChange={(d) => setFilters({ date: d })}
//             onDateToChange={(d) => setFilters({ dateTo: d })}
//             showCustomer={activeTab === 'issues-customer'}
//             showBiller={false}
//             showProduct
//             hideGodownFilter={lockGodownFilter}
//           />
//         </div>
//       </ReportCard>

//       {/* -- ISSUE SUB TABS -- */}
//       {showIssueSection && (
//         <div style={{
//           display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
//           paddingLeft: 12, paddingRight: 0, paddingTop: 0, paddingBottom: 0,
//           borderLeftWidth: 2, borderLeftStyle: 'solid', borderLeftColor: '#a7f3d0',
//         }}>
//           {ISSUE_SUB_TABS.map((t) => (
//             <SubPillTab
//               key={t.id}
//               label={t.label}
//               active={issueSubTab === t.id}
//               onClick={() => setFilters({ tab: t.id })}
//             />
//           ))}
//         </div>
//       )}

//       {/* -- ERROR -- */}
//       {error && (
//         <div style={{
//           padding: '10px 16px', borderRadius: 10, background: '#fef2f2',
//           color: '#b91c1c', fontSize: 13,
//           borderWidth: 1, borderStyle: 'solid', borderColor: '#fecaca',
//         }}>{error}</div>
//       )}

//       {/* -- LOADING SPINNER -- */}
//       {loading && (
//         <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
//           <div style={{
//             width: 32, height: 32, borderRadius: '50%',
//             border: '3px solid #e2e8f0', borderTopColor: '#10b981',
//             animation: 'spin 0.7s linear infinite',
//           }} />
//           <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//         </div>
//       )}

//       {/* ----------------------------------------------
//           ISSUES — BY BILLER (direct select)
//       ---------------------------------------------- */}
//       {activeTab === 'issues-biller' && (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

//           {/* Card with title + inline biller select */}
//           <ReportCard>
//             <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
//               <div>
//                 <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing by biller</div>
//                 <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
//                   Select a biller to view their missing orders and product breakdown.
//                 </div>
//               </div>
//               {!isBillerRole && (
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
//                   <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Biller</label>
//                   <InlineSearchableSelect
//                     value={billerUserId}
//                     onChange={(id) => setFilters({ billerUserId: id })}
//                     options={[
//                       { value: '', label: '— Select a biller —' },
//                       ...billers.map((b) => ({ value: b.id, label: b.name + (b.siteName ? ` — ${b.siteName}` : '') })),
//                     ]}
//                     placeholder="— Select a biller —"
//                   />
//                   {billerUserId && (
//                     <button
//                       onClick={() => setFilters({ billerUserId: '' })}
//                       style={{
//                         padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
//                         background: '#fff', fontSize: 12, color: '#64748b', cursor: 'pointer',
//                       }}
//                     >Clear</button>
//                   )}
//                 </div>
//               )}
//             </div>

//             {/* Prompt when no biller selected */}
//             {!billerUserId && !isBillerRole && (
//               <div style={{ padding: '32px 20px', textAlign: 'center' }}>
//                 <div style={{ fontSize: 13, color: '#64748b' }}>Select a biller above to view their missing report.</div>
//               </div>
//             )}

//             {/* Stat summary row */}
//             {showProductList && (
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #f1f5f9' }}>
//                 {[
//                   { label: 'Missing orders', value: formatNumber(selectedBillerStats?.missingOrderCount ?? missingOrders?.length ?? 0), accent: '#dc2626' },
//                   { label: 'Missing quantity', value: formatNumber(selectedBillerStats?.missingQty ?? 0), accent: '#dc2626' },
//                   { label: 'Missing value', value: formatCurrency(selectedBillerStats?.missingTotal ?? 0), accent: '#d97706' },
//                 ].map(({ label, value, accent }, i) => (
//                   <div key={label} style={{
//                     padding: '16px 20px',
//                     borderRight: i < 2 ? '1px solid #f1f5f9' : undefined,
//                   }}>
//                     <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
//                     <div style={{ fontSize: 22, fontWeight: 700, color: accent, marginTop: 4 }}>{value}</div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </ReportCard>

//           {showProductList && (
//             <>
//               <ReportCard>
//                 <CardHead
//                   title="Missing orders"
//                   sub={`${selectedBillerName}${selectedGodownName ? ` — ${selectedGodownName}` : ''} — deliveries with biller-reported missing items`}
//                 />
//                 <div style={{ padding: '0 0 4px' }}>
//                   {missingOrders ? <MissingOrdersTable rows={missingOrders} /> : null}
//                 </div>
//               </ReportCard>

//               <ReportCard>
//                 <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
//                   <div>
//                     <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing by product</div>
//                     <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Products reported missing — expand to see godown, delivery, and customer details</div>
//                   </div>
//                   <div style={{ display: 'flex', gap: 6 }}>
//                     <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>Orders view</button>
//                     <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
//                   </div>
//                 </div>
//                 <div style={{ padding: '0 0 4px' }}>
//                   {!showPwView ? (
//                     productReturns ? (
//                       <ProductMissingTable rows={productReturns} expandedId={expandedId} onToggleExpand={setExpandedId} />
//                     ) : !loading ? (
//                       <Empty title="No missing products" sub="No product-level missing data for this biller." />
//                     ) : null
//                   ) : (
//                     <ProductWisePanel lines={billerPwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer />
//                   )}
//                 </div>
//               </ReportCard>
//             </>
//           )}
//         </div>
//       )}

//       {/* ----------------------------------------------
//           ISSUES — BY GODOWN
//       ---------------------------------------------- */}
//       {activeTab === 'issues-godown' && (
//         <ReportCard>
//           <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
//             <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing &amp; damage by godown</div>
//             <div style={{ display: 'flex', gap: 6 }}>
//               <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>By godown</button>
//               <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
//             </div>
//           </div>
//           {!showPwView ? (
//             godownIssues?.length ? (
//               <div style={tableWrap}>
//                 <table style={{ ...tableEl, minWidth: 980 }}>
//                   <thead>
//                     <tr>
//                       {['Godown','Deliveries','With issues','Missing qty','Missing value','Damage qty','Damage value','Tags missing',''].map((h, i) => (
//                         <th key={i} style={{ ...tHead, textAlign: i >= 1 && i <= 7 ? 'right' : 'left' }}>{h}</th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {godownIssues.map((g) => (
//                       <tr key={g.godownId} style={{ transition: 'background 0.12s' }}
//                         onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.4)')}
//                         onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//                       >
//                         <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{g.godownName || g.godownId}</td>
//                         <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(g.totalDeliveries)}</td>
//                         <td style={{ ...tCell, textAlign: 'right', fontWeight: g.issueDeliveryCount > 0 ? 700 : undefined, color: g.issueDeliveryCount > 0 ? '#dc2626' : undefined }}>{formatNumber(g.issueDeliveryCount)}</td>
//                         <td style={{ ...tCell, textAlign: 'right', fontWeight: g.missingQty > 0 ? 700 : undefined, color: g.missingQty > 0 ? '#dc2626' : undefined }}>{formatNumber(g.missingQty)}</td>
//                         <td style={{ ...tCell, textAlign: 'right', color: g.missingTotal > 0 ? '#dc2626' : undefined }}>{g.missingTotal > 0 ? formatCurrency(g.missingTotal) : '—'}</td>
//                         <td style={{ ...tCell, textAlign: 'right', fontWeight: g.damageQty > 0 ? 700 : undefined, color: g.damageQty > 0 ? '#d97706' : undefined }}>{formatNumber(g.damageQty)}</td>
//                         <td style={{ ...tCell, textAlign: 'right', color: g.damageTotal > 0 ? '#d97706' : undefined }}>{g.damageTotal > 0 ? formatCurrency(g.damageTotal) : '—'}</td>
//                         <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(g.missingTagCount)}</td>
//                         <td style={tCell}>
//                           <button
//                             onClick={() => setFilters({ godownId: g.godownId, tab: 'issues-delivery' })}
//                             style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#059669', cursor: 'pointer', whiteSpace: 'nowrap' }}
//                           >View deliveries</button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             ) : !loading ? (
//               <div style={{ padding: '0 0 4px' }}>
//                 <Empty title="No godown data" sub="No deliveries in the selected period." />
//               </div>
//             ) : null
//           ) : (
//             <div style={{ padding: '0 0 4px' }}>
//               <ProductWisePanel lines={pwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer />
//             </div>
//           )}
//         </ReportCard>
//       )}

//       {/* ----------------------------------------------
//           ISSUES — BY DELIVERY
//       ---------------------------------------------- */}
//       {activeTab === 'issues-delivery' && (
//         <ReportCard>
//           <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
//             <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing &amp; damage by delivery</div>
//             <div style={{ display: 'flex', gap: 6 }}>
//               <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>By delivery</button>
//               <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
//             </div>
//           </div>
//           <div style={{ padding: '0 0 4px' }}>
//             {!showPwView ? (
//               deliveryIssues ? (
//                 <IssueDeliveryTable rows={deliveryIssues} expandedId={expandedId} onToggleExpand={setExpandedId} />
//               ) : !loading ? (
//                 <Empty title="No issue deliveries" sub="No missing or damage for this period and filters." />
//               ) : null
//             ) : (
//               <ProductWisePanel lines={pwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer />
//             )}
//           </div>
//         </ReportCard>
//       )}

//       {/* ----------------------------------------------
//           ISSUES — BY CUSTOMER
//       ---------------------------------------------- */}
//       {activeTab === 'issues-customer' && (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
//           {!customerName.trim() ? (
//             <ReportCard>
//               <div style={{ padding: '20px' }}>
//                 <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
//                   Select a customer above to load their delivery and issue summary.
//                 </p>
//               </div>
//             </ReportCard>
//           ) : null}

//           {customerReport && (
//             <>
//               {/* summary metrics */}
//               <ReportCard>
//                 <CardHead title={customerReport.customerName} />
//                 <div style={{
//                   display: 'grid',
//                   gridTemplateColumns: 'repeat(3, 1fr)',
//                   gap: 0,
//                 }}>
//                   {[
//                     { label: 'Deliveries', val: customerReport.summary.deliveryCount },
//                     { label: 'With issues', val: customerReport.summary.issueDeliveryCount },
//                     { label: 'Missing qty', val: customerReport.summary.missingQty, accent: '#dc2626' },
//                     { label: 'Damage qty', val: customerReport.summary.damageQty, accent: '#d97706' },
//                     { label: 'Tags missing', val: customerReport.summary.missingTagCount, accent: '#dc2626' },
//                     { label: 'Dmg/lost tags', val: customerReport.summary.damagedTagCount + customerReport.summary.lostTagCount, accent: '#d97706' },
//                   ].map(({ label, val, accent }, i) => (
//                     <div key={label} style={{
//                       padding: '14px 18px',
//                       borderBottom: i < 3 ? '1px solid #f1f5f9' : undefined,
//                       borderRight: (i + 1) % 3 !== 0 ? '1px solid #f1f5f9' : undefined,
//                     }}>
//                       <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{label}</div>
//                       <div style={{ fontSize: 18, fontWeight: 700, color: accent || '#0f172a', marginTop: 4 }}>
//                         {formatNumber(val)}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//                 {(customerReport.summary.missingTotal > 0 || customerReport.summary.damageTotal > 0) && (
//                   <div style={{ display: 'flex', gap: 24, padding: '12px 18px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
//                     {customerReport.summary.missingTotal > 0 && (
//                       <div>
//                         <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Missing value </span>
//                         <span style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>{formatCurrency(customerReport.summary.missingTotal)}</span>
//                       </div>
//                     )}
//                     {customerReport.summary.damageTotal > 0 && (
//                       <div>
//                         <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Damage value </span>
//                         <span style={{ fontSize: 14, fontWeight: 700, color: '#d97706' }}>{formatCurrency(customerReport.summary.damageTotal)}</span>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </ReportCard>

//               {/* product breakdown */}
//               {customerProducts && (customerProducts.missingByProduct.length > 0 || customerProducts.damagedByProduct.length > 0) && (
//                 <ReportCard>
//                   <CardHead title="Product breakdown" sub="Missing and damaged products aggregated across all deliveries for this customer" />
//                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
//                     {/* Missing products */}
//                     <div style={{ borderRight: '1px solid #f1f5f9' }}>
//                       <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#fef2f2' }}>
//                         <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
//                           Missing products ({customerProducts.missingByProduct.length})
//                         </span>
//                       </div>
//                       {customerProducts.missingByProduct.length ? (
//                         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                           <thead>
//                             <tr>
//                               <th style={{ ...tHead, background: '#fff5f5' }}>Product</th>
//                               <th style={{ ...tHead, textAlign: 'right', background: '#fff5f5' }}>Missing qty</th>
//                               <th style={{ ...tHead, textAlign: 'right', background: '#fff5f5' }}>Orders</th>
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {customerProducts.missingByProduct.map((p) => (
//                               <tr key={p.productId}
//                                 onMouseEnter={(e) => (e.currentTarget.style.background = '#fff5f5')}
//                                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//                               >
//                                 <td style={{ ...tCell, fontWeight: 500 }}>{p.particulars || p.sku || p.productId}</td>
//                                 <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(p.totalQty)}</td>
//                                 <td style={{ ...tCell, textAlign: 'right', color: '#64748b' }}>{formatNumber(p.deliveryCount)}</td>
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       ) : (
//                         <div style={{ padding: '16px', fontSize: 12, color: '#94a3b8' }}>No missing products.</div>
//                       )}
//                     </div>
//                     {/* Damaged products */}
//                     <div>
//                       <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#fffbeb' }}>
//                         <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
//                           Damaged products ({customerProducts.damagedByProduct.length})
//                         </span>
//                       </div>
//                       {customerProducts.damagedByProduct.length ? (
//                         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                           <thead>
//                             <tr>
//                               <th style={{ ...tHead, background: '#fffdf0' }}>Product</th>
//                               <th style={{ ...tHead, textAlign: 'right', background: '#fffdf0' }}>Damaged qty</th>
//                               <th style={{ ...tHead, textAlign: 'right', background: '#fffdf0' }}>Orders</th>
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {customerProducts.damagedByProduct.map((p) => (
//                               <tr key={p.productId}
//                                 onMouseEnter={(e) => (e.currentTarget.style.background = '#fffdf0')}
//                                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//                               >
//                                 <td style={{ ...tCell, fontWeight: 500 }}>{p.particulars || p.sku || p.productId}</td>
//                                 <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#d97706' }}>{formatNumber(p.totalQty)}</td>
//                                 <td style={{ ...tCell, textAlign: 'right', color: '#64748b' }}>{formatNumber(p.deliveryCount)}</td>
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       ) : (
//                         <div style={{ padding: '16px', fontSize: 12, color: '#94a3b8' }}>No damaged products.</div>
//                       )}
//                     </div>
//                   </div>
//                 </ReportCard>
//               )}

//               {/* deliveries table */}
//               <ReportCard>
//                 <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
//                   <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Deliveries (date-wise)</div>
//                   <div style={{ display: 'flex', gap: 6 }}>
//                     <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>By delivery</button>
//                     <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
//                   </div>
//                 </div>
//                 {!showPwView ? (
//                   <IssueDeliveryTable rows={customerReport.deliveries} expandedId={expandedId} onToggleExpand={setExpandedId} />
//                 ) : (
//                   <div style={{ padding: '0 0 4px' }}>
//                     <ProductWisePanel lines={customerPwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer={false} />
//                   </div>
//                 )}
//               </ReportCard>
//             </>
//           )}

//           {customerName.trim() && !loading && !customerReport && (
//             <Empty title="No data" sub="No deliveries for this customer in the selected period." />
//           )}
//         </div>
//       )}

//     </div>
//   )
// }

// // import React, { Fragment, useEffect, useMemo, useState } from 'react'
// // import { Link } from 'react-router-dom'
// // import { ReportFiltersBar } from '../components/reports/ReportFiltersBar'
// // import { formatNumber } from '../lib/format'
// // import { Badge } from '../components/ui/Badge'
// // // import { StatCard } from '../components/ui/StatCard'
// // import { apiFetch } from '../lib/api'
// // import { getToken, useAuth } from '../auth/store'
// // import { useReportFilters } from '../hooks/useReportFilters'
// // // At the top of the file, add this import:
// // import ReactDOM from 'react-dom'
// // import type {
// //   BillerReturnRow,
// //   CustomerIssueReport,
// //   CustomerProductsReport,
// //   GodownIssueRow,
// //   IssueDeliveryRow,
// //   ProductReturnRow,
// //   ReportTab,
// // } from '../types/reports'

// // // -- constants --------------------------------------------------------------

// // const MAIN_TABS: { id: ReportTab; label: string }[] = [
// //   { id: 'issues-godown', label: 'Missing & damage' },
// // ]

// // const ISSUE_SUB_TABS: { id: ReportTab; label: string }[] = [
// //   { id: 'issues-godown', label: 'By godown' },
// //   { id: 'issues-biller', label: 'Missing by biller' },
// //   { id: 'issues-delivery', label: 'By delivery' },
// //   { id: 'issues-customer', label: 'By customer' },
// // ]

// // const ISSUE_TABS = new Set<ReportTab>(['issues-godown', 'issues-biller', 'issues-delivery', 'issues-customer'])

// // // -- helpers ----------------------------------------------------------------

// // function formatCurrency(n: number) {
// //   return `?${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
// // }

// // function badgeVariant(status: string) {
// //   if (status === 'PROCESSED' || status === 'UPCOMING') return 'green'
// //   if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return 'green'
// //   if (status === 'PACKED') return 'slate'
// //   if (status === 'RETURN_PICKUP') return 'amber'
// //   if (status === 'COMPLETED') return 'slate'
// //   return 'amber'
// // }

// // function formatDeliveryDate(iso: string) {
// //   return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
// // }

// // // -- shared inline table styles ---------------------------------------------

// // const tHead: React.CSSProperties = {
// //   padding: '10px 14px',
// //   fontSize: 11,
// //   fontWeight: 700,
// //   color: '#94a3b8',
// //   textTransform: 'uppercase',
// //   letterSpacing: '0.07em',
// //   textAlign: 'left',
// //   whiteSpace: 'nowrap',
// //   background: '#f8fafc',
// //   borderBottom: '1px solid #f1f5f9',
// // }

// // const tCell: React.CSSProperties = {
// //   padding: '13px 14px',
// //   fontSize: 13,
// //   color: '#374151',
// //   borderBottom: '1px solid #f1f5f9',
// //   verticalAlign: 'middle',
// // }

// // // -- reusable card ----------------------------------------------------------

// // function ReportCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
// //   return (
// //     // overflow must NOT be 'hidden' — SearchableSelect dropdowns need to escape the card boundary
// //     <div style={{
// //       background: '#fff',
// //       border: '1px solid #e8eaf0',
// //       borderRadius: 14,
// //       ...style,
// //     }}>
// //       {children}
// //     </div>
// //   )
// // }

// // function CardHead({ title, sub }: { title: string; sub?: string }) {
// //   return (
// //     <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
// //       <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</div>
// //       {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
// //     </div>
// //   )
// // }

// // // -- pill tab button --------------------------------------------------------

// // function PillTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
// //   return (
// //     <button
// //       onClick={onClick}
// //       style={{
// //         padding: '7px 16px',
// //         borderRadius: 20,
// //         fontSize: 13,
// //         fontWeight: active ? 700 : 500,
// //         border: active ? 'none' : '1px solid #e2e8f0',
// //         background: active ? '#059669' : '#fff',
// //         color: active ? '#fff' : '#64748b',
// //         cursor: 'pointer',
// //         transition: 'all 0.15s',
// //         whiteSpace: 'nowrap',
// //       }}
// //       onMouseEnter={(e) => {
// //         if (!active) {
// //           const el = e.currentTarget as HTMLElement
// //           el.style.background = '#ecfdf5'
// //           el.style.color = '#059669'
// //           el.style.borderColor = '#a7f3d0'
// //         }
// //       }}
// //       onMouseLeave={(e) => {
// //         if (!active) {
// //           const el = e.currentTarget as HTMLElement
// //           el.style.background = '#fff'
// //           el.style.color = '#64748b'
// //           el.style.borderColor = '#e2e8f0'
// //         }
// //       }}
// //     >
// //       {label}
// //     </button>
// //   )
// // }

// // // -- sub-pill tab (smaller, for issue sub-tabs) -----------------------------

// // function SubPillTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
// //   return (
// //     <button
// //       onClick={onClick}
// //       style={{
// //         padding: '5px 13px',
// //         borderRadius: 20,
// //         fontSize: 12,
// //         fontWeight: active ? 700 : 500,
// //         border: active ? 'none' : '1px solid #e2e8f0',
// //         background: active ? '#10b981' : '#fff',
// //         color: active ? '#fff' : '#64748b',
// //         cursor: 'pointer',
// //         transition: 'all 0.15s',
// //         whiteSpace: 'nowrap',
// //       }}
// //       onMouseEnter={(e) => {
// //         if (!active) {
// //           const el = e.currentTarget as HTMLElement
// //           el.style.background = '#ecfdf5'
// //           el.style.color = '#059669'
// //         }
// //       }}
// //       onMouseLeave={(e) => {
// //         if (!active) {
// //           const el = e.currentTarget as HTMLElement
// //           el.style.background = '#fff'
// //           el.style.color = '#64748b'
// //         }
// //       }}
// //     >
// //       {label}
// //     </button>
// //   )
// // }

// // // -- empty state ------------------------------------------------------------

// // function Empty({ title, sub }: { title: string; sub: string }) {
// //   return (
// //     <div style={{ padding: '40px 0', textAlign: 'center' }}>
// //       <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{title}</div>
// //       <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div>
// //     </div>
// //   )
// // }

// // // -- product lines expandable panel ----------------------------------------

// // function ProductLinesPanel({ row }: { row: IssueDeliveryRow }) {
// //   if (!row.productMissing.length && !row.productDamaged.length) return null
// //   return (
// //     <div style={{
// //       display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
// //       background: '#f8fafc', borderRadius: 8, padding: 16,
// //     }}>
// //       {[
// //         { label: 'Missing products', items: row.productMissing },
// //         { label: 'Damaged products', items: row.productDamaged },
// //       ].map(({ label, items }) => (
// //         <div key={label}>
// //           <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{label}</div>
// //           {items.length ? items.map((p) => (
// //             <div key={p.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', paddingBottom: 6 }}>
// //               <span>{p.particulars || p.sku || p.productId}</span>
// //               <span style={{ fontWeight: 600 }}>qty {p.qty}</span>
// //             </div>
// //           )) : <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>None reported.</p>}
// //         </div>
// //       ))}
// //     </div>
// //   )
// // }


// // // -- product-wise panel: aggregated product list with godown/biller/delivery/customer ──

// // type PwLine = {
// //   productId: string
// //   particulars?: string
// //   sku?: string
// //   missingQty: number
// //   damageQty: number
// //   rows: Array<{
// //     deliveryId: string
// //     deliveryNo: string
// //     customerName: string
// //     siteName?: string
// //     godownName?: string
// //     deliveryAt: string
// //     qty: number
// //     type: 'missing' | 'damage'
// //   }>
// // }

// // function buildPwLines(deliveries: IssueDeliveryRow[]): PwLine[] {
// //   const map = new Map<string, PwLine>()
// //   const add = (
// //     p: { productId: string; particulars?: string; sku?: string; qty: number },
// //     d: IssueDeliveryRow,
// //     type: 'missing' | 'damage',
// //   ) => {
// //     if (!map.has(p.productId)) {
// //       map.set(p.productId, { productId: p.productId, particulars: p.particulars, sku: p.sku, missingQty: 0, damageQty: 0, rows: [] })
// //     }
// //     const e = map.get(p.productId)!
// //     if (type === 'missing') e.missingQty += p.qty; else e.damageQty += p.qty
// //     e.rows.push({ deliveryId: d.id, deliveryNo: d.deliveryNo, customerName: d.customerName, siteName: d.siteName, godownName: d.godownName, deliveryAt: d.deliveryAt, qty: p.qty, type })
// //   }
// //   for (const d of deliveries) {
// //     for (const p of d.productMissing) add(p, d, 'missing')
// //     for (const p of d.productDamaged) add(p, d, 'damage')
// //   }
// //   return Array.from(map.values()).sort((a, b) => (b.missingQty + b.damageQty) - (a.missingQty + a.damageQty))
// // }

// // function ProductWisePanel({
// //   lines, expandedId, onToggle,
// //   showGodown = true, showCustomer = true,
// // }: {
// //   lines: PwLine[]
// //   expandedId: string | null
// //   onToggle: (id: string | null) => void
// //   showGodown?: boolean
// //   showCustomer?: boolean
// // }) {
// //   if (!lines.length) return <Empty title="No product issues" sub="No missing or damaged products for the selected filters." />
// //   return (
// //     <div style={{ overflowX: 'auto' }}>
// //       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
// //         <thead>
// //           <tr>
// //             <th style={tHead}>Product</th>
// //             <th style={tHead}>SKU</th>
// //             <th style={{ ...tHead, textAlign: 'right', color: '#dc2626' }}>Missing qty</th>
// //             <th style={{ ...tHead, textAlign: 'right', color: '#d97706' }}>Damage qty</th>
// //             <th style={{ ...tHead, textAlign: 'right' }}>Deliveries</th>
// //             <th style={tHead}></th>
// //           </tr>
// //         </thead>
// //         <tbody>
// //           {lines.map((p) => (
// //             <Fragment key={p.productId}>
// //               <tr
// //                 style={{ transition: 'background 0.12s', cursor: 'pointer' }}
// //                 onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.25)')}
// //                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
// //               >
// //                 <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{p.particulars || p.productId}</td>
// //                 <td style={{ ...tCell, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{p.sku || '—'}</td>
// //                 <td style={{ ...tCell, textAlign: 'right', fontWeight: p.missingQty > 0 ? 700 : undefined, color: p.missingQty > 0 ? '#dc2626' : '#94a3b8' }}>{formatNumber(p.missingQty)}</td>
// //                 <td style={{ ...tCell, textAlign: 'right', fontWeight: p.damageQty > 0 ? 700 : undefined, color: p.damageQty > 0 ? '#d97706' : '#94a3b8' }}>{formatNumber(p.damageQty)}</td>
// //                 <td style={{ ...tCell, textAlign: 'right' }}>{p.rows.length}</td>
// //                 <td style={tCell}>
// //                   <button
// //                     onClick={() => onToggle(expandedId === p.productId ? null : p.productId)}
// //                     style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', fontSize: 12, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}
// //                   >{expandedId === p.productId ? 'Hide' : 'View details'}</button>
// //                 </td>
// //               </tr>
// //               {expandedId === p.productId && (
// //                 <tr>
// //                   <td colSpan={6} style={{ padding: '0 14px 14px' }}>
// //                     <div style={{ background: '#fef9f9', border: '1px solid #fecaca', borderRadius: 10, padding: 14, marginTop: 2 }}>
// //                       <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
// //                         Delivery breakdown — {p.particulars || p.productId}
// //                       </div>
// //                       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
// //                         <thead>
// //                           <tr>
// //                             <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Delivery</th>
// //                             <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Date</th>
// //                             {showCustomer && <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Customer</th>}
// //                             {showCustomer && <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Site</th>}
// //                             {showGodown && <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Godown</th>}
// //                             <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px', textAlign: 'right' }}>Qty</th>
// //                             <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Type</th>
// //                           </tr>
// //                         </thead>
// //                         <tbody>
// //                           {p.rows.map((r, idx) => (
// //                             <tr key={idx}
// //                               onMouseEnter={(e) => (e.currentTarget.style.background = '#fff5f5')}
// //                               onMouseLeave={(e) => (e.currentTarget.style.background = '')}
// //                             >
// //                               <td style={{ ...tCell, padding: '8px 10px' }}>
// //                                 <Link to={`/deliveries/${r.deliveryId}`}
// //                                   style={{ fontWeight: 600, color: '#059669', textDecoration: 'none', fontSize: 12 }}
// //                                   onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
// //                                   onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
// //                                 >{r.deliveryNo}</Link>
// //                               </td>
// //                               <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDeliveryDate(r.deliveryAt)}</td>
// //                               {showCustomer && <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.customerName}</td>}
// //                               {showCustomer && <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.siteName || '—'}</td>}
// //                               {showGodown && <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.godownName || '—'}</td>}
// //                               <td style={{ ...tCell, padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: r.type === 'missing' ? '#dc2626' : '#d97706', fontSize: 13 }}>{formatNumber(r.qty)}</td>
// //                               <td style={{ ...tCell, padding: '8px 10px' }}>
// //                                 <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: r.type === 'missing' ? '#fef2f2' : '#fffbeb', color: r.type === 'missing' ? '#dc2626' : '#d97706' }}>
// //                                   {r.type === 'missing' ? 'Missing' : 'Damaged'}
// //                                 </span>
// //                               </td>
// //                             </tr>
// //                           ))}
// //                         </tbody>
// //                       </table>
// //                     </div>
// //                   </td>
// //                 </tr>
// //               )}
// //             </Fragment>
// //           ))}
// //         </tbody>
// //       </table>
// //     </div>
// //   )
// // }

// // // -- issue delivery table ---------------------------------------------------

// // function IssueDeliveryTable({
// //   rows, expandedId, onToggleExpand,
// // }: {
// //   rows: IssueDeliveryRow[]
// //   expandedId: string | null
// //   onToggleExpand: (id: string | null) => void
// // }) {
// //   if (!rows.length) return <Empty title="No deliveries" sub="No deliveries match the selected filters." />
// //   return (
// //     <div style={{ overflowX: 'auto' }}>
// //       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
// //         <thead>
// //           <tr>
// //             {['Delivery','Date','Customer','Site','Godown','Status','Missing qty','Damage qty','Tags missing',''].map((h, i) => (
// //               <th key={i} style={{ ...tHead, textAlign: i >= 6 && i <= 8 ? 'right' : 'left' }}>{h}</th>
// //             ))}
// //           </tr>
// //         </thead>
// //         <tbody>
// //           {rows.map((m) => (
// //             <Fragment key={m.id}>
// //               <tr
// //                 style={{ transition: 'background 0.12s' }}
// //                 onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.4)')}
// //                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
// //               >
// //                 <td style={tCell}>
// //                   <Link to={`/deliveries/${m.id}`} style={{ fontWeight: 600, color: '#059669', textDecoration: 'none' }}
// //                     onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
// //                     onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
// //                   >{m.deliveryNo}</Link>
// //                 </td>
// //                 <td style={{ ...tCell, whiteSpace: 'nowrap' }}>{formatDeliveryDate(m.deliveryAt)}</td>
// //                 <td style={{ ...tCell, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.customerName}</td>
// //                 <td style={{ ...tCell, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.siteName || '?'}</td>
// //                 <td style={{ ...tCell, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.godownName || '?'}</td>
// //                 <td style={tCell}><Badge variant={badgeVariant(m.status)}>{m.status}</Badge></td>
// //                 <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.missingQty)}</td>
// //                 <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.damageQty)}</td>
// //                 <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.missingTagCount ?? m.missingCount)}</td>
// //                 <td style={{ ...tCell }}>
// //                   {(m.productMissing.length || m.productDamaged.length) ? (
// //                     <button
// //                       onClick={() => onToggleExpand(expandedId === m.id ? null : m.id)}
// //                       style={{
// //                         padding: '4px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
// //                         background: '#fff', fontSize: 12, fontWeight: 600, color: '#059669',
// //                         cursor: 'pointer',
// //                       }}
// //                     >{expandedId === m.id ? 'Hide' : 'Products'}</button>
// //                   ) : null}
// //                 </td>
// //               </tr>
// //               {expandedId === m.id && (
// //                 <tr>
// //                   <td colSpan={10} style={{ padding: '0 14px 12px' }}>
// //                     <ProductLinesPanel row={m} />
// //                   </td>
// //                 </tr>
// //               )}
// //             </Fragment>
// //           ))}
// //         </tbody>
// //       </table>
// //     </div>
// //   )
// // }

// // // -- missing report step indicator ------------------------------------------

// // // function MissingStepper({ step, labels }: { step: 1 | 2 | 3; labels: [string, string, string] }) {
// // //   return (
// // //     <div style={{
// // //       display: 'flex', alignItems: 'center', gap: 0, padding: '14px 20px',
// // //       borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(180deg, #f8fafc 0%, #fff 100%)',
// // //       flexWrap: 'wrap',
// // //     }}>
// // //       {labels.map((label, i) => {
// // //         const n = (i + 1) as 1 | 2 | 3
// // //         const active = step === n
// // //         const done = step > n
// // //         return (
// // //           <Fragment key={label}>
// // //             {i > 0 ? (
// // //               <div style={{ flex: '1 1 24px', height: 2, minWidth: 20, maxWidth: 48, background: done || active ? '#10b981' : '#e2e8f0', margin: '0 8px' }} />
// // //             ) : null}
// // //             <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
// // //               <div style={{
// // //                 width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
// // //                 background: active ? '#059669' : done ? '#d1fae5' : '#f1f5f9',
// // //                 color: active ? '#fff' : done ? '#059669' : '#94a3b8',
// // //                 fontSize: 12, fontWeight: 700,
// // //                 display: 'flex', alignItems: 'center', justifyContent: 'center',
// // //               }}>{n}</div>
// // //               <span style={{
// // //                 fontSize: 12, fontWeight: active ? 700 : 500,
// // //                 color: active ? '#0f172a' : '#64748b', whiteSpace: 'nowrap',
// // //               }}>{label}</span>
// // //             </div>
// // //           </Fragment>
// // //         )
// // //       })}
// // //     </div>
// // //   )
// // // }

// // // -- missing orders table (per biller) --------------------------------------

// // function MissingOrdersTable({ rows }: { rows: IssueDeliveryRow[] }) {
// //   if (!rows.length) {
// //     return <Empty title="No missing orders" sub="This biller has no orders with missing items in the selected period." />
// //   }
// //   return (
// //     <div style={{ overflowX: 'auto' }}>
// //       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
// //         <thead>
// //           <tr>
// //             {['Order', 'Date', 'Customer', 'Site', 'Status', 'Missing qty', 'Value (?)', 'Products'].map((h, i) => (
// //               <th key={h} style={{ ...tHead, textAlign: i >= 5 && i <= 6 ? 'right' : 'left' }}>{h}</th>
// //             ))}
// //           </tr>
// //         </thead>
// //         <tbody>
// //           {rows.map((m) => (
// //             <tr key={m.id} style={{ transition: 'background 0.12s' }}
// //               onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.35)')}
// //               onMouseLeave={(e) => (e.currentTarget.style.background = '')}
// //             >
// //               <td style={tCell}>
// //                 <Link to={`/deliveries/${m.id}`} style={{ fontWeight: 600, color: '#dc2626', textDecoration: 'none' }}
// //                   onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
// //                   onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
// //                 >{m.deliveryNo}</Link>
// //               </td>
// //               <td style={{ ...tCell, whiteSpace: 'nowrap' }}>{formatDeliveryDate(m.deliveryAt)}</td>
// //               <td style={{ ...tCell, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.customerName}</td>
// //               <td style={{ ...tCell, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.siteName || '?'}</td>
// //               <td style={tCell}><Badge variant={badgeVariant(m.status)}>{m.status}</Badge></td>
// //               <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(m.missingQty)}</td>
// //               <td style={{ ...tCell, textAlign: 'right' }}>{m.missingTotal != null ? formatCurrency(m.missingTotal) : '?'}</td>
// //               <td style={{ ...tCell, fontSize: 12, color: '#64748b', maxWidth: 180 }}>
// //                 {m.productMissing.slice(0, 2).map((p) => p.particulars || p.sku).join(', ')}
// //                 {m.productMissing.length > 2 ? ` +${m.productMissing.length - 2}` : ''}
// //               </td>
// //             </tr>
// //           ))}
// //         </tbody>
// //       </table>
// //     </div>
// //   )
// // }

// // // -- product missing table (per biller, with orders) ------------------------

// // function ProductMissingTable({
// //   rows,
// //   expandedId,
// //   onToggleExpand,
// // }: {
// //   rows: ProductReturnRow[]
// //   expandedId: string | null
// //   onToggleExpand: (id: string | null) => void
// // }) {
// //   if (!rows.length) {
// //     return <Empty title="No missing products" sub="No product-level missing data for this biller and period." />
// //   }
// //   return (
// //     <div style={{ overflowX: 'auto' }}>
// //       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
// //         <thead>
// //           <tr>
// //             {['Product', 'SKU', 'Missing qty', 'Orders', ''].map((h, i) => (
// //               <th key={i} style={{ ...tHead, textAlign: i === 2 || i === 3 ? 'right' : 'left' }}>{h}</th>
// //             ))}
// //           </tr>
// //         </thead>
// //         <tbody>
// //           {rows.map((r) => (
// //             <Fragment key={r.productId}>
// //               <tr
// //                 style={{ transition: 'background 0.12s' }}
// //                 onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.25)')}
// //                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
// //               >
// //                 <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{r.particulars || r.productId}</td>
// //                 <td style={tCell}>{r.sku || '?'}</td>
// //                 <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(r.totalQty)}</td>
// //                 <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(r.deliveryCount)}</td>
// //                 <td style={tCell}>
// //                   {r.deliveries.length ? (
// //                     <button
// //                       onClick={() => onToggleExpand(expandedId === r.productId ? null : r.productId)}
// //                       style={{
// //                         padding: '4px 12px', borderRadius: 8, border: '1px solid #fecaca',
// //                         background: '#fff', fontSize: 12, fontWeight: 600, color: '#dc2626',
// //                         cursor: 'pointer',
// //                       }}
// //                     >{expandedId === r.productId ? 'Hide orders' : 'View orders'}</button>
// //                   ) : null}
// //                 </td>
// //               </tr>
// //               {expandedId === r.productId && (
// //                 <tr>
// //                   <td colSpan={5} style={{ padding: '0 14px 12px' }}>
// //                     <div style={{ background: '#fef2f2', borderRadius: 8, padding: 14, border: '1px solid #fecaca' }}>
// //                       <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
// //                         Missing orders for this product
// //                       </div>
// //                       {r.deliveries.map((d) => (
// //                         <div key={d.id} style={{
// //                           display: 'grid', gridTemplateColumns: '1fr auto', gap: 8,
// //                           fontSize: 12, color: '#374151', paddingBottom: 8,
// //                           borderBottom: '1px solid #fee2e2', marginBottom: 8,
// //                         }}>
// //                           <div>
// //                             <Link to={`/deliveries/${d.id}`} style={{ fontWeight: 600, color: '#dc2626', textDecoration: 'none' }}>
// //                               {d.deliveryNo}
// //                             </Link>
// //                             {d.customerName ? (
// //                               <span style={{ color: '#64748b', marginLeft: 8 }}>{d.customerName}</span>
// //                             ) : null}
// //                             {d.deliveryAt ? (
// //                               <span style={{ color: '#94a3b8', marginLeft: 8 }}>{formatDeliveryDate(d.deliveryAt)}</span>
// //                             ) : null}
// //                           </div>
// //                           <span style={{ fontWeight: 700, color: '#dc2626', whiteSpace: 'nowrap' }}>
// //                             qty {formatNumber(d.qty)}{d.note ? ` ? ${d.note}` : ''}
// //                           </span>
// //                         </div>
// //                       ))}
// //                     </div>
// //                   </td>
// //                 </tr>
// //               )}
// //             </Fragment>
// //           ))}
// //         </tbody>
// //       </table>
// //     </div>
// //   )
// // }

// // // -- breadcrumb for biller drill-down ---------------------------------------

// // // function BillerBreadcrumb({
// // //   godownName,
// // //   billerName,
// // //   hideAllGodowns,
// // //   onAllGodowns,
// // //   onGodown,
// // // }: {
// // //   godownName?: string
// // //   billerName?: string
// // //   hideAllGodowns?: boolean
// // //   onAllGodowns: () => void
// // //   onGodown: () => void
// // // }) {
// // //   const linkStyle: React.CSSProperties = {
// // //     background: 'none', border: 'none', padding: 0, fontSize: 13, fontWeight: 600,
// // //     color: '#059669', cursor: 'pointer', textDecoration: 'underline',
// // //   }
// // //   const sep = <span style={{ color: '#94a3b8', margin: '0 6px' }}>/</span>
// // //   return (
// // //     <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
// // //       {!hideAllGodowns ? (
// // //         <button type="button" onClick={onAllGodowns} style={linkStyle}>All godowns</button>
// // //       ) : null}
// // //       {godownName ? (
// // //         <>
// // //           {!hideAllGodowns ? sep : null}
// // //           {billerName ? (
// // //             <button type="button" onClick={onGodown} style={linkStyle}>{godownName}</button>
// // //           ) : (
// // //             <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{godownName}</span>
// // //           )}
// // //         </>
// // //       ) : null}
// // //       {billerName ? (
// // //         <>
// // //           {sep}
// // //           <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{billerName}</span>
// // //         </>
// // //       ) : null}
// // //     </div>
// // //   )
// // // }

// // // -- inline searchable select for biller (reused from ReportFiltersBar pattern) --

// // // function InlineSearchableSelect({
// // //   value, onChange, options, placeholder = '— Select —',
// // // }: {
// // //   value: string
// // //   onChange: (v: string) => void
// // //   options: Array<{ value: string; label: string }>
// // //   placeholder?: string
// // // }) {
// // //   const [open, setOpen] = React.useState(false)
// // //   const [search, setSearch] = React.useState('')
// // //   const ref = React.useRef<HTMLDivElement>(null)
// // //   const inputRef = React.useRef<HTMLInputElement>(null)

// // //   React.useEffect(() => {
// // //     const handler = (e: MouseEvent) => {
// // //       if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch('') }
// // //     }
// // //     document.addEventListener('mousedown', handler)
// // //     return () => document.removeEventListener('mousedown', handler)
// // //   }, [])

// // //   React.useEffect(() => {
// // //     if (open) setTimeout(() => inputRef.current?.focus(), 50)
// // //   }, [open])

// // //   const filtered = search.trim()
// // //     ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
// // //     : options

// // //   const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder

// // //   return (
// // //     <div ref={ref} style={{ position: 'relative', minWidth: 220 }}>
// // //       <button
// // //         type="button"
// // //         onClick={() => { setOpen((o) => !o); setSearch('') }}
// // //         style={{
// // //           height: 38, width: '100%', minWidth: 220, padding: '0 32px 0 12px',
// // //           border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff',
// // //           fontSize: 13, color: value ? '#0f172a' : '#94a3b8', textAlign: 'left',
// // //           cursor: 'pointer', position: 'relative', fontFamily: 'inherit',
// // //           boxShadow: '0 1px 2px rgba(0,0,0,0.04)', whiteSpace: 'nowrap',
// // //           overflow: 'hidden', textOverflow: 'ellipsis',
// // //           outline: open ? '2px solid #a7f3d0' : 'none',
// // //         }}
// // //       >
// // //         {selectedLabel}
// // //         <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
// // //           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
// // //         </span>
// // //       </button>
// // //       {open && (
// // //         <div style={{
// // //           position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 9999,
// // //           minWidth: '100%', maxWidth: 360, background: '#fff',
// // //           border: '1px solid #d1fae5', borderRadius: 10,
// // //           boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
// // //         }}>
// // //           <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
// // //             <div style={{ position: 'relative' }}>
// // //               <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4.5 4.5" strokeLinecap="round" /></svg>
// // //               <input
// // //                 ref={inputRef}
// // //                 value={search}
// // //                 onChange={(e) => setSearch(e.target.value)}
// // //                 placeholder="Search…"
// // //                 style={{ width: '100%', height: 30, paddingLeft: 26, paddingRight: 8, border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
// // //                 onKeyDown={(e) => e.key === 'Escape' && (setOpen(false), setSearch(''))}
// // //               />
// // //             </div>
// // //           </div>
// // //           <div style={{ maxHeight: 220, overflowY: 'auto' }}>
// // //             {filtered.length === 0
// // //               ? <div style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>No results</div>
// // //               : filtered.map((o) => (
// // //                 <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); setSearch('') }}
// // //                   style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer', color: o.value === value ? '#059669' : '#0f172a', fontWeight: o.value === value ? 700 : 400, background: o.value === value ? '#f0fdf4' : undefined }}
// // //                   onMouseEnter={(e) => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
// // //                   onMouseLeave={(e) => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = '' }}
// // //                 >{o.label}</div>
// // //               ))
// // //             }
// // //           </div>
// // //         </div>
// // //       )}
// // //     </div>
// // //   )
// // // }

// // function InlineSearchableSelect({
// //   value, onChange, options, placeholder = '— Select —',
// // }: {
// //   value: string
// //   onChange: (v: string) => void
// //   options: Array<{ value: string; label: string }>
// //   placeholder?: string
// // }) {
// //   const [open, setOpen] = React.useState(false)
// //   const [search, setSearch] = React.useState('')
// //   const [dropPos, setDropPos] = React.useState({ top: 0, left: 0, width: 0 })
// //   const wrapRef = React.useRef<HTMLDivElement>(null)
// //   const btnRef = React.useRef<HTMLButtonElement>(null)
// //   const inputRef = React.useRef<HTMLInputElement>(null)
// //   const dropRef = React.useRef<HTMLDivElement>(null)

// //   // Close on outside click — must check both the trigger and the portal
// //   React.useEffect(() => {
// //     if (!open) return
// //     const handler = (e: MouseEvent) => {
// //       const t = e.target as Node
// //       if (wrapRef.current?.contains(t)) return
// //       if (dropRef.current?.contains(t)) return
// //       setOpen(false)
// //       setSearch('')
// //     }
// //     document.addEventListener('mousedown', handler)
// //     return () => document.removeEventListener('mousedown', handler)
// //   }, [open])

// //   // Compute and update dropdown position whenever open or on scroll/resize
// //   React.useEffect(() => {
// //     if (!open) return
// //     const reposition = () => {
// //       if (btnRef.current) {
// //         const r = btnRef.current.getBoundingClientRect()
// //         const DROPDOWN_W = 360
// //         const clampedLeft = Math.max(8, Math.min(r.left, window.innerWidth - DROPDOWN_W - 8))
// //         setDropPos({ top: r.bottom + 4, left: clampedLeft, width: Math.max(r.width, DROPDOWN_W) })
// //       }
// //     }
// //     reposition() // set position immediately when opened
// //     window.addEventListener('scroll', reposition, true)
// //     window.addEventListener('resize', reposition)
// //     return () => {
// //       window.removeEventListener('scroll', reposition, true)
// //       window.removeEventListener('resize', reposition)
// //     }
// //   }, [open])

// //   React.useEffect(() => {
// //     if (open) setTimeout(() => inputRef.current?.focus(), 50)
// //   }, [open])

// //   const handleToggle = () => {
// //     setOpen(o => !o)
// //     setSearch('')
// //   }

// //   const handleSelect = (val: string) => {
// //     onChange(val)
// //     setOpen(false)
// //     setSearch('')
// //   }

// //   const filtered = search.trim()
// //     ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
// //     : options

// //   const selectedLabel = options.find(o => o.value === value)?.label ?? placeholder

// //   const dropdown = open ? ReactDOM.createPortal(
// //     <div
// //       ref={dropRef}
// //       style={{
// //         position: 'fixed',
// //         top: dropPos.top,
// //         left: dropPos.left,
// //         minWidth: dropPos.width,
// //         maxWidth: 360,
// //         zIndex: 99999,
// //         background: '#fff',
// //         border: '1px solid #d1fae5',
// //         borderRadius: 10,
// //         boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
// //         overflow: 'hidden',
// //       }}
// //     >
// //       {/* Search box */}
// //       <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
// //         <div style={{ position: 'relative' }}>
// //           <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}
// //             width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
// //             <circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4.5 4.5" strokeLinecap="round" />
// //           </svg>
// //           <input
// //             ref={inputRef}
// //             value={search}
// //             onChange={e => setSearch(e.target.value)}
// //             placeholder="Search…"
// //             style={{
// //               width: '100%', height: 30, paddingLeft: 26, paddingRight: 8,
// //               border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12,
// //               color: '#0f172a', background: '#f8fafc', outline: 'none',
// //               boxSizing: 'border-box', fontFamily: 'inherit',
// //             }}
// //             onKeyDown={e => e.key === 'Escape' && (setOpen(false), setSearch(''))}
// //           />
// //         </div>
// //       </div>
// //       {/* Options */}
// //       <div style={{ maxHeight: 220, overflowY: 'auto' }}>
// //         {filtered.length === 0
// //           ? <div style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>No results</div>
// //           : filtered.map(o => (
// //             <div
// //               key={o.value}
// //               onMouseDown={e => { e.preventDefault(); handleSelect(o.value) }}   // ← onMouseDown, not onClick
// //               style={{
// //                 padding: '8px 14px', fontSize: 13, cursor: 'pointer',
// //                 color: o.value === value ? '#059669' : '#0f172a',
// //                 fontWeight: o.value === value ? 700 : 400,
// //                 background: o.value === value ? '#f0fdf4' : undefined,
// //               }}
// //               onMouseEnter={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
// //               onMouseLeave={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = o.value === value ? '#f0fdf4' : '' }}
// //             >{o.label}</div>
// //           ))
// //         }
// //       </div>
// //     </div>,
// //     document.body,
// //   ) : null

// //   return (
// //     <div ref={wrapRef} style={{ position: 'relative', minWidth: 220 }}>
// //       <button
// //         ref={btnRef}
// //         type="button"
// //         onClick={handleToggle}
// //         style={{
// //           height: 38, width: '100%', minWidth: 220, padding: '0 32px 0 12px',
// //           border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff',
// //           fontSize: 13, color: value ? '#0f172a' : '#94a3b8', textAlign: 'left',
// //           cursor: 'pointer', position: 'relative', fontFamily: 'inherit',
// //           boxShadow: '0 1px 2px rgba(0,0,0,0.04)', whiteSpace: 'nowrap',
// //           overflow: 'hidden', textOverflow: 'ellipsis',
// //           outline: open ? '2px solid #a7f3d0' : 'none',
// //         }}
// //       >
// //         {selectedLabel}
// //         <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
// //           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
// //             <path d="m6 9 6 6 6-6" />
// //           </svg>
// //         </span>
// //       </button>
// //       {dropdown}
// //     </div>
// //   )
// // }

// // // -- main component ---------------------------------------------------------

// // export function ReportsPage() {
// //   const auth = useAuth()
// //   const {
// //     date, dateTo, godownId, site, customerName, billerUserId, productId, tab, godowns, sites, customers,
// //     billers: billersRaw, products: productsRaw,
// //     filterQuery, dateQuery, setFilters, lockGodownFilter,
// //   } = useReportFilters()

// //   // Defensive fallbacks — guard against hook not returning these
// //   const billers = (billersRaw as typeof billersRaw | undefined) ?? []
// //   const products = (productsRaw as typeof productsRaw | undefined) ?? []

// //   const resolvedTab = (MAIN_TABS.some((t) => t.id === tab) || ISSUE_TABS.has(tab as ReportTab) ? tab : 'issues-godown') as ReportTab
// //   const activeTab = resolvedTab
// //   const issueSubTab = ISSUE_TABS.has(activeTab) ? activeTab : 'issues-godown'
// //   const showIssueSection = ISSUE_TABS.has(activeTab) || activeTab === 'issues-godown'

// //   const [loading, setLoading] = useState(false)
// //   const [error, setError] = useState<string | null>(null)
// //   const [godownIssues, setGodownIssues] = useState<GodownIssueRow[] | null>(null)
// //   const [deliveryIssues, setDeliveryIssues] = useState<IssueDeliveryRow[] | null>(null)
// //   const [customerReport, setCustomerReport] = useState<CustomerIssueReport | null>(null)
// //   const [customerProducts, setCustomerProducts] = useState<CustomerProductsReport | null>(null)
// //   // const [stock, setStock] = useState<StockReportRow[] | null>(null)
// //   const [billerReturns, setBillerReturns] = useState<BillerReturnRow[] | null>(null) // kept for selectedBillerStats
// //   const [productReturns, setProductReturns] = useState<ProductReturnRow[] | null>(null)
// //   const [missingOrders, setMissingOrders] = useState<IssueDeliveryRow[] | null>(null)
// //   const [expandedId, setExpandedId] = useState<string | null>(null)
// //   const [pwExpandedId, setPwExpandedId] = useState<string | null>(null)
// //   const [showPwView, setShowPwView] = useState(false)

// //   const isBillerRole = auth.status === 'authenticated' && auth.user.role === 'BILLER'
// //   const selectedGodownName = godowns.find((g) => g.id === godownId)?.name
// //   const selectedBillerName = useMemo(() => {
// //     if (isBillerRole && auth.status === 'authenticated') {
// //       return auth.user.contactName || auth.user.siteName || 'My returns'
// //     }
// //     return billerReturns?.find((b) => b.billerUserId === billerUserId)?.billerName || billerUserId
// //   }, [isBillerRole, auth, billerReturns, billerUserId])

// //   // const showBillerGodowns = false // removed drill-down flow
// //   // const showBillerList = false    // removed drill-down flow
// //   const showProductList = activeTab === 'issues-biller' && (Boolean(billerUserId) || isBillerRole)

// //   // const billerStep: 1 | 2 | 3 = showProductList ? 3 : showBillerList ? 2 : 1

// //   const selectedBillerStats = useMemo(() => {
// //     const b = billerReturns?.find((row) => row.billerUserId === billerUserId)
// //     if (b) return b
// //     if (!missingOrders?.length) return null
// //     return {
// //       missingOrderCount: missingOrders.length,
// //       missingQty: missingOrders.reduce((s, o) => s + o.missingQty, 0),
// //       missingTotal: missingOrders.reduce((s, o) => s + (o.missingTotal || 0), 0),
// //     }
// //   }, [billerReturns, billerUserId, missingOrders])

// //   useEffect(() => { setShowPwView(false); setPwExpandedId(null) }, [activeTab, godownId, billerUserId, customerName])

// //   useEffect(() => {
// //     if (!ISSUE_TABS.has(activeTab)) return
// //     const token = getToken(); if (!token) return
// //     if (activeTab === 'issues-customer' && !customerName.trim()) { setCustomerReport(null); setCustomerProducts(null); return }
// //     setLoading(true); setError(null)

// //     const loadGodown = () =>
// //       apiFetch<GodownIssueRow[]>(`/reports/issues/by-godown?${dateQuery}limit=100${filterQuery}`, { token })
// //         .then(setGodownIssues).catch(() => setGodownIssues([]))
// //     const loadDelivery = () =>
// //       apiFetch<IssueDeliveryRow[]>(`/reports/issues/by-delivery?${dateQuery}limit=100${filterQuery}`, { token })
// //         .then(setDeliveryIssues).catch(() => setDeliveryIssues([]))
// //     const loadCustomer = () => {
// //       const cn = encodeURIComponent(customerName.trim())
// //       const fq = filterQuery.replace(/&?customerName=[^&]*/g, '')
// //       return Promise.all([
// //         apiFetch<CustomerIssueReport>(`/reports/issues/customer?${dateQuery}customerName=${cn}${fq}`, { token })
// //           .then(setCustomerReport).catch(() => setCustomerReport(null)),
// //         apiFetch<CustomerProductsReport>(`/reports/issues/customer-products?${dateQuery}customerName=${cn}${fq}`, { token })
// //           .then(setCustomerProducts).catch(() => setCustomerProducts(null)),
// //       ]).then(() => undefined)
// //     }

// //     const promises: Promise<void>[] = []
// //     if (activeTab === 'issues-godown' || (activeTab === 'issues-biller' && !godownId && !lockGodownFilter)) {
// //       promises.push(loadGodown())
// //     }
// //     if (activeTab === 'issues-godown' || activeTab === 'issues-delivery') promises.push(loadDelivery())
// //     if (activeTab === 'issues-customer') promises.push(loadCustomer())
// //     Promise.all(promises).finally(() => setLoading(false))
// //   }, [date, dateTo, dateQuery, filterQuery, activeTab, customerName, godownId, site, lockGodownFilter])

// //   useEffect(() => {
// //     if (activeTab !== 'issues-biller') return
// //     const token = getToken(); if (!token) return

// //     if (showProductList) {
// //       setLoading(true); setError(null)
// //       const fq = filterQuery.includes('billerUserId')
// //         ? filterQuery
// //         : `${filterQuery}&billerUserId=${encodeURIComponent(billerUserId)}`
// //       const godownPart = godownId ? `godownId=${encodeURIComponent(godownId)}&` : ''


// // const productQ =`/reports/returns/by-product?date=${date}&godownId=6a06a76afb0121a70a2c12bc&billerUserId=${encodeURIComponent(billerUserId)}&metric=missing`

// // // `/reports/returns/by-product?${dateQuery}${godownId ? `godownId=${encodeURIComponent(godownId)}&` : ''}billerUserId=${encodeURIComponent(billerUserId)}&metric=missing`
// //       const ordersQ = `/reports/issues/by-delivery?${dateQuery}${godownPart}${fq.replace(/^&/, '')}&limit=200`
// //       Promise.all([
// //         apiFetch<ProductReturnRow[]>(productQ, { token }),
// //         apiFetch<IssueDeliveryRow[]>(ordersQ, { token }),
// //       ])
// //         .then(([prods, orders]) => {
// //           setProductReturns(prods)
// //           setMissingOrders(orders.filter((o) => o.missingQty > 0))
// //         })
// //         .catch((e: unknown) => {
// //           setError(e instanceof Error ? e.message : 'Failed to load missing report')
// //           setProductReturns([])
// //           setMissingOrders([])
// //         })
// //         .finally(() => setLoading(false))
// //       return
// //     }

// //     setBillerReturns(null)
// //     setProductReturns(null)
// //     setMissingOrders(null)
// //   }, [activeTab, date, dateTo, dateQuery, filterQuery, godownId, billerUserId, showProductList])

// //   // useEffect(() => {
// //   //   if (activeTab !== 'stock') return
// //   //   const token = getToken(); if (!token) return
// //   //   if (auth.status !== 'authenticated' || (auth.user.role !== 'ADMIN' && auth.user.role !== 'GODOWN')) return
// //   //   setLoading(true); setError(null)
// //   //   const gidQ = godownId ? `?godownId=${encodeURIComponent(godownId)}` : ''
// //   //   apiFetch<StockReportRow[]>(`/reports/stock${gidQ}`, { token })
// //   //     .then(setStock)
// //   //     .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load stock'))
// //   //     .finally(() => setLoading(false))
// //   // }, [activeTab, godownId, auth])

// //   const onMainTab = (id: ReportTab) => {
// //     if (id === 'issues-godown') {
// //       setFilters({ tab: ISSUE_TABS.has(activeTab) ? activeTab : 'issues-godown' })
// //       return
// //     }
// //     setFilters({ tab: id })
// //   }

// //   const pwLines = useMemo(
// //     () => buildPwLines(deliveryIssues || []),
// //     [deliveryIssues],
// //   )

// //   const customerPwLines = useMemo(
// //     () => buildPwLines(customerReport?.deliveries || []),
// //     [customerReport],
// //   )

// //   const billerPwLines = useMemo(
// //     () => buildPwLines(missingOrders || []),
// //     [missingOrders],
// //   )

// //   // -- shared table styles ------------------------------------------------

// //   const tableWrap: React.CSSProperties = { overflowX: 'auto' }
// //   const tableEl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 800 }

// //   return (
// //     // AppShell provides 20px 24px padding
// //     <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 16 }}>

  
// //       {/* -- FILTERS CARD -- */}
// //       <ReportCard>
// //         <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f0f9' }}>
// //           <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Filters</div>
// //         </div>
// //         <div style={{ padding: '18px 20px' }}>
// //           <ReportFiltersBar
// //             godowns={godowns}
// //             sites={sites}
// //             customers={customers}
// //             billers={billers}
// //             products={products}
// //             godownId={godownId}
// //             site={site}
// //             customerName={customerName}
// //             billerUserId={billerUserId}
// //             productId={productId}
// //             onGodownChange={(id) => setFilters({
// //               godownId: id,
// //               billerUserId: activeTab === 'issues-biller' && !isBillerRole ? billerUserId : billerUserId,
// //             })}
// //             onSiteChange={(s) => setFilters({ site: s })}
// //             onCustomerChange={(name) => setFilters({ customerName: name })}
// //             onBillerChange={(id) => setFilters({ billerUserId: id })}
// //             onProductChange={(id) => setFilters({ productId: id })}
// //             showDate
// //             showDateTo={showIssueSection}
// //             date={date}
// //             dateTo={dateTo}
// //             onDateChange={(d) => setFilters({ date: d })}
// //             onDateToChange={(d) => setFilters({ dateTo: d })}
// //             showCustomer={activeTab === 'issues-customer'}
// //             showBiller={false}
// //             showProduct
// //             hideGodownFilter={lockGodownFilter}
// //           />
// //         </div>
// //       </ReportCard>

// //       {/* -- MAIN TAB ROW -- */}
// //       <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
// //         {MAIN_TABS.map((t) => (
// //           <PillTab
// //             key={t.id}
// //             label={t.label}
// //             active={activeTab === t.id || (t.id === 'issues-godown' && ISSUE_TABS.has(activeTab))}
// //             onClick={() => onMainTab(t.id)}
// //           />
// //         ))}
// //       </div>

// //       {/* -- ISSUE SUB TABS -- */}
// //       {showIssueSection && (
// //         <div style={{
// //           display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
// //           paddingLeft: 12, paddingRight: 0, paddingTop: 0, paddingBottom: 0,
// //           borderLeftWidth: 2, borderLeftStyle: 'solid', borderLeftColor: '#a7f3d0',
// //         }}>
// //           {ISSUE_SUB_TABS.map((t) => (
// //             <SubPillTab
// //               key={t.id}
// //               label={t.label}
// //               active={issueSubTab === t.id}
// //               onClick={() => setFilters({ tab: t.id })}
// //             />
// //           ))}
// //         </div>
// //       )}

// //       {/* -- ERROR -- */}
// //       {error && (
// //         <div style={{
// //           padding: '10px 16px', borderRadius: 10, background: '#fef2f2',
// //           color: '#b91c1c', fontSize: 13,
// //           borderWidth: 1, borderStyle: 'solid', borderColor: '#fecaca',
// //         }}>{error}</div>
// //       )}

// //       {/* -- LOADING SPINNER -- */}
// //       {loading && (
// //         <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
// //           <div style={{
// //             width: 32, height: 32, borderRadius: '50%',
// //             border: '3px solid #e2e8f0', borderTopColor: '#10b981',
// //             animation: 'spin 0.7s linear infinite',
// //           }} />
// //           <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
// //         </div>
// //       )}

// //       {/* ----------------------------------------------
// //           ISSUES — BY BILLER (direct select)
// //       ---------------------------------------------- */}
// //       {activeTab === 'issues-biller' && (
// //         <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

// //           {/* Card with title + inline biller select */}
// //           <ReportCard>
// //             <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
// //               <div>
// //                 <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing by biller</div>
// //                 <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
// //                   Select a biller to view their missing orders and product breakdown.
// //                 </div>
// //               </div>
// //               {!isBillerRole && (
// //                 <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
// //                   <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Biller</label>
// //                   <InlineSearchableSelect
// //                     value={billerUserId}
// //                     onChange={(id) => setFilters({ billerUserId: id })}
// //                     options={[
// //                       { value: '', label: '— Select a biller —' },
// //                       ...billers.map((b) => ({ value: b.id, label: b.name + (b.siteName ? ` — ${b.siteName}` : '') })),
// //                     ]}
// //                     placeholder="— Select a biller —"
// //                   />
// //                   {billerUserId && (
// //                     <button
// //                       onClick={() => setFilters({ billerUserId: '' })}
// //                       style={{
// //                         padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
// //                         background: '#fff', fontSize: 12, color: '#64748b', cursor: 'pointer',
// //                       }}
// //                     >Clear</button>
// //                   )}
// //                 </div>
// //               )}
// //             </div>

// //             {/* Prompt when no biller selected */}
// //             {!billerUserId && !isBillerRole && (
// //               <div style={{ padding: '32px 20px', textAlign: 'center' }}>
// //                 <div style={{ fontSize: 13, color: '#64748b' }}>Select a biller above to view their missing report.</div>
// //               </div>
// //             )}

// //             {/* Stat summary row */}
// //             {showProductList && (
// //               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #f1f5f9' }}>
// //                 {[
// //                   { label: 'Missing orders', value: formatNumber(selectedBillerStats?.missingOrderCount ?? missingOrders?.length ?? 0), accent: '#dc2626' },
// //                   { label: 'Missing quantity', value: formatNumber(selectedBillerStats?.missingQty ?? 0), accent: '#dc2626' },
// //                   { label: 'Missing value', value: formatCurrency(selectedBillerStats?.missingTotal ?? 0), accent: '#d97706' },
// //                 ].map(({ label, value, accent }, i) => (
// //                   <div key={label} style={{
// //                     padding: '16px 20px',
// //                     borderRight: i < 2 ? '1px solid #f1f5f9' : undefined,
// //                   }}>
// //                     <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
// //                     <div style={{ fontSize: 22, fontWeight: 700, color: accent, marginTop: 4 }}>{value}</div>
// //                   </div>
// //                 ))}
// //               </div>
// //             )}
// //           </ReportCard>

// //           {showProductList && (
// //             <>
// //               <ReportCard>
// //                 <CardHead
// //                   title="Missing orders"
// //                   sub={`${selectedBillerName}${selectedGodownName ? ` — ${selectedGodownName}` : ''} — deliveries with biller-reported missing items`}
// //                 />
// //                 <div style={{ padding: '0 0 4px' }}>
// //                   {missingOrders ? <MissingOrdersTable rows={missingOrders} /> : null}
// //                 </div>
// //               </ReportCard>

// //               <ReportCard>
// //                 <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
// //                   <div>
// //                     <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing by product</div>
// //                     <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Products reported missing — expand to see godown, delivery, and customer details</div>
// //                   </div>
// //                   <div style={{ display: 'flex', gap: 6 }}>
// //                     <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>Orders view</button>
// //                     <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
// //                   </div>
// //                 </div>
// //                 <div style={{ padding: '0 0 4px' }}>
// //                   {!showPwView ? (
// //                     productReturns ? (
// //                       <ProductMissingTable rows={productReturns} expandedId={expandedId} onToggleExpand={setExpandedId} />
// //                     ) : !loading ? (
// //                       <Empty title="No missing products" sub="No product-level missing data for this biller." />
// //                     ) : null
// //                   ) : (
// //                     <ProductWisePanel lines={billerPwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer />
// //                   )}
// //                 </div>
// //               </ReportCard>
// //             </>
// //           )}
// //         </div>
// //       )}

// //       {/* ----------------------------------------------
// //           ISSUES ? BY GODOWN
// //       ---------------------------------------------- */}
// //       {activeTab === 'issues-godown' && (
// //         <ReportCard>
// //           <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
// //             <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing &amp; damage by godown</div>
// //             <div style={{ display: 'flex', gap: 6 }}>
// //               <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>By godown</button>
// //               <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
// //             </div>
// //           </div>
// //           {!showPwView ? (
// //             godownIssues?.length ? (
// //               <div style={tableWrap}>
// //                 <table style={{ ...tableEl, minWidth: 980 }}>
// //                   <thead>
// //                     <tr>
// //                       {['Godown','Deliveries','With issues','Missing qty','Missing value','Damage qty','Damage value','Tags missing',''].map((h, i) => (
// //                         <th key={i} style={{ ...tHead, textAlign: i >= 1 && i <= 7 ? 'right' : 'left' }}>{h}</th>
// //                       ))}
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     {godownIssues.map((g) => (
// //                       <tr key={g.godownId} style={{ transition: 'background 0.12s' }}
// //                         onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.4)')}
// //                         onMouseLeave={(e) => (e.currentTarget.style.background = '')}
// //                       >
// //                         <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{g.godownName || g.godownId}</td>
// //                         <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(g.totalDeliveries)}</td>
// //                         <td style={{ ...tCell, textAlign: 'right', fontWeight: g.issueDeliveryCount > 0 ? 700 : undefined, color: g.issueDeliveryCount > 0 ? '#dc2626' : undefined }}>{formatNumber(g.issueDeliveryCount)}</td>
// //                         <td style={{ ...tCell, textAlign: 'right', fontWeight: g.missingQty > 0 ? 700 : undefined, color: g.missingQty > 0 ? '#dc2626' : undefined }}>{formatNumber(g.missingQty)}</td>
// //                         <td style={{ ...tCell, textAlign: 'right', color: g.missingTotal > 0 ? '#dc2626' : undefined }}>{g.missingTotal > 0 ? formatCurrency(g.missingTotal) : '—'}</td>
// //                         <td style={{ ...tCell, textAlign: 'right', fontWeight: g.damageQty > 0 ? 700 : undefined, color: g.damageQty > 0 ? '#d97706' : undefined }}>{formatNumber(g.damageQty)}</td>
// //                         <td style={{ ...tCell, textAlign: 'right', color: g.damageTotal > 0 ? '#d97706' : undefined }}>{g.damageTotal > 0 ? formatCurrency(g.damageTotal) : '—'}</td>
// //                         <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(g.missingTagCount)}</td>
// //                         <td style={tCell}>
// //                           <button
// //                             onClick={() => setFilters({ godownId: g.godownId, tab: 'issues-delivery' })}
// //                             style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#059669', cursor: 'pointer', whiteSpace: 'nowrap' }}
// //                           >View deliveries</button>
// //                         </td>
// //                       </tr>
// //                     ))}
// //                   </tbody>
// //                 </table>
// //               </div>
// //             ) : !loading ? (
// //               <div style={{ padding: '0 0 4px' }}>
// //                 <Empty title="No godown data" sub="No deliveries in the selected period." />
// //               </div>
// //             ) : null
// //           ) : (
// //             <div style={{ padding: '0 0 4px' }}>
// //               <ProductWisePanel lines={pwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer />
// //             </div>
// //           )}
// //         </ReportCard>
// //       )}

// //       {/* ----------------------------------------------
// //           ISSUES ? BY DELIVERY
// //       ---------------------------------------------- */}
// //       {activeTab === 'issues-delivery' && (
// //         <ReportCard>
// //           <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
// //             <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing &amp; damage by delivery</div>
// //             <div style={{ display: 'flex', gap: 6 }}>
// //               <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>By delivery</button>
// //               <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
// //             </div>
// //           </div>
// //           <div style={{ padding: '0 0 4px' }}>
// //             {!showPwView ? (
// //               deliveryIssues ? (
// //                 <IssueDeliveryTable rows={deliveryIssues} expandedId={expandedId} onToggleExpand={setExpandedId} />
// //               ) : !loading ? (
// //                 <Empty title="No issue deliveries" sub="No missing or damage for this period and filters." />
// //               ) : null
// //             ) : (
// //               <ProductWisePanel lines={pwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer />
// //             )}
// //           </div>
// //         </ReportCard>
// //       )}

// //       {/* ----------------------------------------------
// //           ISSUES ? BY CUSTOMER
// //       ---------------------------------------------- */}
// //       {activeTab === 'issues-customer' && (
// //         <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
// //           {!customerName.trim() ? (
// //             <ReportCard>
// //               <div style={{ padding: '20px' }}>
// //                 <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
// //                   Select a customer above to load their delivery and issue summary.
// //                 </p>
// //               </div>
// //             </ReportCard>
// //           ) : null}

// //           {customerReport && (
// //             <>
// //               {/* summary metrics */}
// //               <ReportCard>
// //                 <CardHead title={customerReport.customerName} />
// //                 <div style={{
// //                   display: 'grid',
// //                   gridTemplateColumns: 'repeat(3, 1fr)',
// //                   gap: 0,
// //                 }}>
// //                   {[
// //                     { label: 'Deliveries', val: customerReport.summary.deliveryCount },
// //                     { label: 'With issues', val: customerReport.summary.issueDeliveryCount },
// //                     { label: 'Missing qty', val: customerReport.summary.missingQty, accent: '#dc2626' },
// //                     { label: 'Damage qty', val: customerReport.summary.damageQty, accent: '#d97706' },
// //                     { label: 'Tags missing', val: customerReport.summary.missingTagCount, accent: '#dc2626' },
// //                     { label: 'Dmg/lost tags', val: customerReport.summary.damagedTagCount + customerReport.summary.lostTagCount, accent: '#d97706' },
// //                   ].map(({ label, val, accent }, i) => (
// //                     <div key={label} style={{
// //                       padding: '14px 18px',
// //                       borderBottom: i < 3 ? '1px solid #f1f5f9' : undefined,
// //                       borderRight: (i + 1) % 3 !== 0 ? '1px solid #f1f5f9' : undefined,
// //                     }}>
// //                       <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{label}</div>
// //                       <div style={{ fontSize: 18, fontWeight: 700, color: accent || '#0f172a', marginTop: 4 }}>
// //                         {formatNumber(val)}
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //                 {(customerReport.summary.missingTotal > 0 || customerReport.summary.damageTotal > 0) && (
// //                   <div style={{ display: 'flex', gap: 24, padding: '12px 18px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
// //                     {customerReport.summary.missingTotal > 0 && (
// //                       <div>
// //                         <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Missing value </span>
// //                         <span style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>{formatCurrency(customerReport.summary.missingTotal)}</span>
// //                       </div>
// //                     )}
// //                     {customerReport.summary.damageTotal > 0 && (
// //                       <div>
// //                         <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Damage value </span>
// //                         <span style={{ fontSize: 14, fontWeight: 700, color: '#d97706' }}>{formatCurrency(customerReport.summary.damageTotal)}</span>
// //                       </div>
// //                     )}
// //                   </div>
// //                 )}
// //               </ReportCard>

// //               {/* product breakdown */}
// //               {customerProducts && (customerProducts.missingByProduct.length > 0 || customerProducts.damagedByProduct.length > 0) && (
// //                 <ReportCard>
// //                   <CardHead title="Product breakdown" sub="Missing and damaged products aggregated across all deliveries for this customer" />
// //                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
// //                     {/* Missing products */}
// //                     <div style={{ borderRight: '1px solid #f1f5f9' }}>
// //                       <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#fef2f2' }}>
// //                         <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
// //                           Missing products ({customerProducts.missingByProduct.length})
// //                         </span>
// //                       </div>
// //                       {customerProducts.missingByProduct.length ? (
// //                         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
// //                           <thead>
// //                             <tr>
// //                               <th style={{ ...tHead, background: '#fff5f5' }}>Product</th>
// //                               <th style={{ ...tHead, textAlign: 'right', background: '#fff5f5' }}>Missing qty</th>
// //                               <th style={{ ...tHead, textAlign: 'right', background: '#fff5f5' }}>Orders</th>
// //                             </tr>
// //                           </thead>
// //                           <tbody>
// //                             {customerProducts.missingByProduct.map((p) => (
// //                               <tr key={p.productId}
// //                                 onMouseEnter={(e) => (e.currentTarget.style.background = '#fff5f5')}
// //                                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
// //                               >
// //                                 <td style={{ ...tCell, fontWeight: 500 }}>{p.particulars || p.sku || p.productId}</td>
// //                                 <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(p.totalQty)}</td>
// //                                 <td style={{ ...tCell, textAlign: 'right', color: '#64748b' }}>{formatNumber(p.deliveryCount)}</td>
// //                               </tr>
// //                             ))}
// //                           </tbody>
// //                         </table>
// //                       ) : (
// //                         <div style={{ padding: '16px', fontSize: 12, color: '#94a3b8' }}>No missing products.</div>
// //                       )}
// //                     </div>
// //                     {/* Damaged products */}
// //                     <div>
// //                       <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#fffbeb' }}>
// //                         <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
// //                           Damaged products ({customerProducts.damagedByProduct.length})
// //                         </span>
// //                       </div>
// //                       {customerProducts.damagedByProduct.length ? (
// //                         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
// //                           <thead>
// //                             <tr>
// //                               <th style={{ ...tHead, background: '#fffdf0' }}>Product</th>
// //                               <th style={{ ...tHead, textAlign: 'right', background: '#fffdf0' }}>Damaged qty</th>
// //                               <th style={{ ...tHead, textAlign: 'right', background: '#fffdf0' }}>Orders</th>
// //                             </tr>
// //                           </thead>
// //                           <tbody>
// //                             {customerProducts.damagedByProduct.map((p) => (
// //                               <tr key={p.productId}
// //                                 onMouseEnter={(e) => (e.currentTarget.style.background = '#fffdf0')}
// //                                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
// //                               >
// //                                 <td style={{ ...tCell, fontWeight: 500 }}>{p.particulars || p.sku || p.productId}</td>
// //                                 <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#d97706' }}>{formatNumber(p.totalQty)}</td>
// //                                 <td style={{ ...tCell, textAlign: 'right', color: '#64748b' }}>{formatNumber(p.deliveryCount)}</td>
// //                               </tr>
// //                             ))}
// //                           </tbody>
// //                         </table>
// //                       ) : (
// //                         <div style={{ padding: '16px', fontSize: 12, color: '#94a3b8' }}>No damaged products.</div>
// //                       )}
// //                     </div>
// //                   </div>
// //                 </ReportCard>
// //               )}

// //               {/* deliveries table */}
// //               <ReportCard>
// //                 <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
// //                   <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Deliveries (date-wise)</div>
// //                   <div style={{ display: 'flex', gap: 6 }}>
// //                     <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>By delivery</button>
// //                     <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
// //                   </div>
// //                 </div>
// //                 {!showPwView ? (
// //                   <IssueDeliveryTable rows={customerReport.deliveries} expandedId={expandedId} onToggleExpand={setExpandedId} />
// //                 ) : (
// //                   <div style={{ padding: '0 0 4px' }}>
// //                     <ProductWisePanel lines={customerPwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer={false} />
// //                   </div>
// //                 )}
// //               </ReportCard>
// //             </>
// //           )}

// //           {customerName.trim() && !loading && !customerReport && (
// //             <Empty title="No data" sub="No deliveries for this customer in the selected period." />
// //           )}
// //         </div>
// //       )}


// //     </div>
// //   )
// // }

// import React, { Fragment, useEffect, useMemo, useState } from 'react'
// import { Link } from 'react-router-dom'
// import { ReportFiltersBar } from '../components/reports/ReportFiltersBar'
// import { formatNumber } from '../lib/format'
// import { Badge } from '../components/ui/Badge'
// // import { StatCard } from '../components/ui/StatCard'
// import { apiFetch } from '../lib/api'
// import { getToken, useAuth } from '../auth/store'
// import { useReportFilters } from '../hooks/useReportFilters'
// // At the top of the file, add this import:
// import ReactDOM from 'react-dom'
// import type {
//   BillerReturnRow,
//   CustomerIssueReport,
//   CustomerProductsReport,
//   GodownIssueRow,
//   IssueDeliveryRow,
//   ProductReturnRow,
//   ReportTab,
// } from '../types/reports'

// // -- constants --------------------------------------------------------------

// const ISSUE_SUB_TABS: { id: ReportTab; label: string }[] = [
//   { id: 'issues-godown', label: 'By godown' },
//   { id: 'issues-biller', label: 'Missing by biller' },
//   { id: 'issues-delivery', label: 'By delivery' },
//   { id: 'issues-customer', label: 'By customer' },
// ]

// const ISSUE_TABS = new Set<ReportTab>(['issues-godown', 'issues-biller', 'issues-delivery', 'issues-customer'])

// // -- helpers ----------------------------------------------------------------

// function formatCurrency(n: number) {
//   return `?${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
// }

// function badgeVariant(status: string) {
//   if (status === 'PROCESSED' || status === 'UPCOMING') return 'green'
//   if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return 'green'
//   if (status === 'PACKED') return 'slate'
//   if (status === 'RETURN_PICKUP') return 'amber'
//   if (status === 'COMPLETED') return 'slate'
//   return 'amber'
// }

// function formatDeliveryDate(iso: string) {
//   return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
// }

// // -- shared inline table styles ---------------------------------------------

// const tHead: React.CSSProperties = {
//   padding: '10px 14px',
//   fontSize: 11,
//   fontWeight: 700,
//   color: '#94a3b8',
//   textTransform: 'uppercase',
//   letterSpacing: '0.07em',
//   textAlign: 'left',
//   whiteSpace: 'nowrap',
//   background: '#f8fafc',
//   borderBottom: '1px solid #f1f5f9',
// }

// const tCell: React.CSSProperties = {
//   padding: '13px 14px',
//   fontSize: 13,
//   color: '#374151',
//   borderBottom: '1px solid #f1f5f9',
//   verticalAlign: 'middle',
// }

// // -- reusable card ----------------------------------------------------------

// function ReportCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
//   return (
//     // overflow must NOT be 'hidden' — SearchableSelect dropdowns need to escape the card boundary
//     <div style={{
//       background: '#fff',
//       border: '1px solid #e8eaf0',
//       borderRadius: 14,
//       ...style,
//     }}>
//       {children}
//     </div>
//   )
// }

// function CardHead({ title, sub }: { title: string; sub?: string }) {
//   return (
//     <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
//       <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</div>
//       {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
//     </div>
//   )
// }

// // -- pill tab button --------------------------------------------------------

// // function PillTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
// //   return (
// //     <button
// //       onClick={onClick}
// //       style={{
// //         padding: '7px 16px',
// //         borderRadius: 20,
// //         fontSize: 13,
// //         fontWeight: active ? 700 : 500,
// //         border: active ? 'none' : '1px solid #e2e8f0',
// //         background: active ? '#059669' : '#fff',
// //         color: active ? '#fff' : '#64748b',
// //         cursor: 'pointer',
// //         transition: 'all 0.15s',
// //         whiteSpace: 'nowrap',
// //       }}
// //       onMouseEnter={(e) => {
// //         if (!active) {
// //           const el = e.currentTarget as HTMLElement
// //           el.style.background = '#ecfdf5'
// //           el.style.color = '#059669'
// //           el.style.borderColor = '#a7f3d0'
// //         }
// //       }}
// //       onMouseLeave={(e) => {
// //         if (!active) {
// //           const el = e.currentTarget as HTMLElement
// //           el.style.background = '#fff'
// //           el.style.color = '#64748b'
// //           el.style.borderColor = '#e2e8f0'
// //         }
// //       }}
// //     >
// //       {label}
// //     </button>
// //   )
// // }

// // -- sub-pill tab (smaller, for issue sub-tabs) -----------------------------

// function SubPillTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
//   return (
//     <button
//       onClick={onClick}
//       style={{
//         padding: '5px 13px',
//         borderRadius: 20,
//         fontSize: 12,
//         fontWeight: active ? 700 : 500,
//         border: active ? 'none' : '1px solid #e2e8f0',
//         background: active ? '#10b981' : '#fff',
//         color: active ? '#fff' : '#64748b',
//         cursor: 'pointer',
//         transition: 'all 0.15s',
//         whiteSpace: 'nowrap',
//       }}
//       onMouseEnter={(e) => {
//         if (!active) {
//           const el = e.currentTarget as HTMLElement
//           el.style.background = '#ecfdf5'
//           el.style.color = '#059669'
//         }
//       }}
//       onMouseLeave={(e) => {
//         if (!active) {
//           const el = e.currentTarget as HTMLElement
//           el.style.background = '#fff'
//           el.style.color = '#64748b'
//         }
//       }}
//     >
//       {label}
//     </button>
//   )
// }

// // -- empty state ------------------------------------------------------------

// function Empty({ title, sub }: { title: string; sub: string }) {
//   return (
//     <div style={{ padding: '40px 0', textAlign: 'center' }}>
//       <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{title}</div>
//       <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div>
//     </div>
//   )
// }

// // -- product lines expandable panel ----------------------------------------

// function ProductLinesPanel({ row }: { row: IssueDeliveryRow }) {
//   if (!row.productMissing.length && !row.productDamaged.length) return null
//   return (
//     <div style={{
//       display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
//       background: '#f8fafc', borderRadius: 8, padding: 16,
//     }}>
//       {[
//         { label: 'Missing products', items: row.productMissing },
//         { label: 'Damaged products', items: row.productDamaged },
//       ].map(({ label, items }) => (
//         <div key={label}>
//           <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{label}</div>
//           {items.length ? items.map((p) => (
//             <div key={p.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', paddingBottom: 6 }}>
//               <span>{p.particulars || p.sku || p.productId}</span>
//               <span style={{ fontWeight: 600 }}>qty {p.qty}</span>
//             </div>
//           )) : <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>None reported.</p>}
//         </div>
//       ))}
//     </div>
//   )
// }


// // -- product-wise panel: aggregated product list with godown/biller/delivery/customer ──

// type PwLine = {
//   productId: string
//   particulars?: string
//   sku?: string
//   missingQty: number
//   damageQty: number
//   rows: Array<{
//     deliveryId: string
//     deliveryNo: string
//     customerName: string
//     siteName?: string
//     godownName?: string
//     deliveryAt: string
//     qty: number
//     type: 'missing' | 'damage'
//   }>
// }

// function buildPwLines(deliveries: IssueDeliveryRow[]): PwLine[] {
//   const map = new Map<string, PwLine>()
//   const add = (
//     p: { productId: string; particulars?: string; sku?: string; qty: number },
//     d: IssueDeliveryRow,
//     type: 'missing' | 'damage',
//   ) => {
//     if (!map.has(p.productId)) {
//       map.set(p.productId, { productId: p.productId, particulars: p.particulars, sku: p.sku, missingQty: 0, damageQty: 0, rows: [] })
//     }
//     const e = map.get(p.productId)!
//     if (type === 'missing') e.missingQty += p.qty; else e.damageQty += p.qty
//     e.rows.push({ deliveryId: d.id, deliveryNo: d.deliveryNo, customerName: d.customerName, siteName: d.siteName, godownName: d.godownName, deliveryAt: d.deliveryAt, qty: p.qty, type })
//   }
//   for (const d of deliveries) {
//     for (const p of d.productMissing) add(p, d, 'missing')
//     for (const p of d.productDamaged) add(p, d, 'damage')
//   }
//   return Array.from(map.values()).sort((a, b) => (b.missingQty + b.damageQty) - (a.missingQty + a.damageQty))
// }

// function ProductWisePanel({
//   lines, expandedId, onToggle,
//   showGodown = true, showCustomer = true,
// }: {
//   lines: PwLine[]
//   expandedId: string | null
//   onToggle: (id: string | null) => void
//   showGodown?: boolean
//   showCustomer?: boolean
// }) {
//   if (!lines.length) return <Empty title="No product issues" sub="No missing or damaged products for the selected filters." />
//   return (
//     <div style={{ overflowX: 'auto' }}>
//       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
//         <thead>
//           <tr>
//             <th style={tHead}>Product</th>
//             <th style={tHead}>SKU</th>
//             <th style={{ ...tHead, textAlign: 'right', color: '#dc2626' }}>Missing qty</th>
//             <th style={{ ...tHead, textAlign: 'right', color: '#d97706' }}>Damage qty</th>
//             <th style={{ ...tHead, textAlign: 'right' }}>Deliveries</th>
//             <th style={tHead}></th>
//           </tr>
//         </thead>
//         <tbody>
//           {lines.map((p) => (
//             <Fragment key={p.productId}>
//               <tr
//                 style={{ transition: 'background 0.12s', cursor: 'pointer' }}
//                 onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.25)')}
//                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//               >
//                 <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{p.particulars || p.productId}</td>
//                 <td style={{ ...tCell, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{p.sku || '—'}</td>
//                 <td style={{ ...tCell, textAlign: 'right', fontWeight: p.missingQty > 0 ? 700 : undefined, color: p.missingQty > 0 ? '#dc2626' : '#94a3b8' }}>{formatNumber(p.missingQty)}</td>
//                 <td style={{ ...tCell, textAlign: 'right', fontWeight: p.damageQty > 0 ? 700 : undefined, color: p.damageQty > 0 ? '#d97706' : '#94a3b8' }}>{formatNumber(p.damageQty)}</td>
//                 <td style={{ ...tCell, textAlign: 'right' }}>{p.rows.length}</td>
//                 <td style={tCell}>
//                   <button
//                     onClick={() => onToggle(expandedId === p.productId ? null : p.productId)}
//                     style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', fontSize: 12, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}
//                   >{expandedId === p.productId ? 'Hide' : 'View details'}</button>
//                 </td>
//               </tr>
//               {expandedId === p.productId && (
//                 <tr>
//                   <td colSpan={6} style={{ padding: '0 14px 14px' }}>
//                     <div style={{ background: '#fef9f9', border: '1px solid #fecaca', borderRadius: 10, padding: 14, marginTop: 2 }}>
//                       <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
//                         Delivery breakdown — {p.particulars || p.productId}
//                       </div>
//                       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                         <thead>
//                           <tr>
//                             <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Delivery</th>
//                             <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Date</th>
//                             {showCustomer && <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Customer</th>}
//                             {showCustomer && <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Site</th>}
//                             {showGodown && <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Godown</th>}
//                             <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px', textAlign: 'right' }}>Qty</th>
//                             <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Type</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {p.rows.map((r, idx) => (
//                             <tr key={idx}
//                               onMouseEnter={(e) => (e.currentTarget.style.background = '#fff5f5')}
//                               onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//                             >
//                               <td style={{ ...tCell, padding: '8px 10px' }}>
//                                 <Link to={`/deliveries/${r.deliveryId}`}
//                                   style={{ fontWeight: 600, color: '#059669', textDecoration: 'none', fontSize: 12 }}
//                                   onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
//                                   onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
//                                 >{r.deliveryNo}</Link>
//                               </td>
//                               <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDeliveryDate(r.deliveryAt)}</td>
//                               {showCustomer && <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.customerName}</td>}
//                               {showCustomer && <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.siteName || '—'}</td>}
//                               {showGodown && <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.godownName || '—'}</td>}
//                               <td style={{ ...tCell, padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: r.type === 'missing' ? '#dc2626' : '#d97706', fontSize: 13 }}>{formatNumber(r.qty)}</td>
//                               <td style={{ ...tCell, padding: '8px 10px' }}>
//                                 <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: r.type === 'missing' ? '#fef2f2' : '#fffbeb', color: r.type === 'missing' ? '#dc2626' : '#d97706' }}>
//                                   {r.type === 'missing' ? 'Missing' : 'Damaged'}
//                                 </span>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </td>
//                 </tr>
//               )}
//             </Fragment>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// // -- issue delivery table ---------------------------------------------------

// function IssueDeliveryTable({
//   rows, expandedId, onToggleExpand,
// }: {
//   rows: IssueDeliveryRow[]
//   expandedId: string | null
//   onToggleExpand: (id: string | null) => void
// }) {
//   if (!rows.length) return <Empty title="No deliveries" sub="No deliveries match the selected filters." />
//   return (
//     <div style={{ overflowX: 'auto' }}>
//       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
//         <thead>
//           <tr>
//             {['Delivery','Date','Customer','Site','Godown','Status','Missing qty','Damage qty','Tags missing',''].map((h, i) => (
//               <th key={i} style={{ ...tHead, textAlign: i >= 6 && i <= 8 ? 'right' : 'left' }}>{h}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((m) => (
//             <Fragment key={m.id}>
//               <tr
//                 style={{ transition: 'background 0.12s' }}
//                 onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.4)')}
//                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//               >
//                 <td style={tCell}>
//                   <Link to={`/deliveries/${m.id}`} style={{ fontWeight: 600, color: '#059669', textDecoration: 'none' }}
//                     onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
//                     onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
//                   >{m.deliveryNo}</Link>
//                 </td>
//                 <td style={{ ...tCell, whiteSpace: 'nowrap' }}>{formatDeliveryDate(m.deliveryAt)}</td>
//                 <td style={{ ...tCell, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.customerName}</td>
//                 <td style={{ ...tCell, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.siteName || '?'}</td>
//                 <td style={{ ...tCell, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.godownName || '?'}</td>
//                 <td style={tCell}><Badge variant={badgeVariant(m.status)}>{m.status}</Badge></td>
//                 <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.missingQty)}</td>
//                 <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.damageQty)}</td>
//                 <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.missingTagCount ?? m.missingCount)}</td>
//                 <td style={{ ...tCell }}>
//                   {(m.productMissing.length || m.productDamaged.length) ? (
//                     <button
//                       onClick={() => onToggleExpand(expandedId === m.id ? null : m.id)}
//                       style={{
//                         padding: '4px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
//                         background: '#fff', fontSize: 12, fontWeight: 600, color: '#059669',
//                         cursor: 'pointer',
//                       }}
//                     >{expandedId === m.id ? 'Hide' : 'Products'}</button>
//                   ) : null}
//                 </td>
//               </tr>
//               {expandedId === m.id && (
//                 <tr>
//                   <td colSpan={10} style={{ padding: '0 14px 12px' }}>
//                     <ProductLinesPanel row={m} />
//                   </td>
//                 </tr>
//               )}
//             </Fragment>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// // -- missing report step indicator ------------------------------------------

// // function MissingStepper({ step, labels }: { step: 1 | 2 | 3; labels: [string, string, string] }) {
// // ...
// // }

// // -- missing orders table (per biller) --------------------------------------

// function MissingOrdersTable({ rows }: { rows: IssueDeliveryRow[] }) {
//   if (!rows.length) {
//     return <Empty title="No missing orders" sub="This biller has no orders with missing items in the selected period." />
//   }
//   return (
//     <div style={{ overflowX: 'auto' }}>
//       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
//         <thead>
//           <tr>
//             {['Order', 'Date', 'Customer', 'Site', 'Status', 'Missing qty', 'Value (?)', 'Products'].map((h, i) => (
//               <th key={h} style={{ ...tHead, textAlign: i >= 5 && i <= 6 ? 'right' : 'left' }}>{h}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((m) => (
//             <tr key={m.id} style={{ transition: 'background 0.12s' }}
//               onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.35)')}
//               onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//             >
//               <td style={tCell}>
//                 <Link to={`/deliveries/${m.id}`} style={{ fontWeight: 600, color: '#dc2626', textDecoration: 'none' }}
//                   onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
//                   onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
//                 >{m.deliveryNo}</Link>
//               </td>
//               <td style={{ ...tCell, whiteSpace: 'nowrap' }}>{formatDeliveryDate(m.deliveryAt)}</td>
//               <td style={{ ...tCell, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.customerName}</td>
//               <td style={{ ...tCell, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.siteName || '?'}</td>
//               <td style={tCell}><Badge variant={badgeVariant(m.status)}>{m.status}</Badge></td>
//               <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(m.missingQty)}</td>
//               <td style={{ ...tCell, textAlign: 'right' }}>{m.missingTotal != null ? formatCurrency(m.missingTotal) : '?'}</td>
//               <td style={{ ...tCell, fontSize: 12, color: '#64748b', maxWidth: 180 }}>
//                 {m.productMissing.slice(0, 2).map((p) => p.particulars || p.sku).join(', ')}
//                 {m.productMissing.length > 2 ? ` +${m.productMissing.length - 2}` : ''}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// // -- product missing table (per biller, with orders) ------------------------

// function ProductMissingTable({
//   rows,
//   expandedId,
//   onToggleExpand,
// }: {
//   rows: ProductReturnRow[]
//   expandedId: string | null
//   onToggleExpand: (id: string | null) => void
// }) {
//   if (!rows.length) {
//     return <Empty title="No missing products" sub="No product-level missing data for this biller and period." />
//   }
//   return (
//     <div style={{ overflowX: 'auto' }}>
//       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
//         <thead>
//           <tr>
//             {['Product', 'SKU', 'Missing qty', 'Orders', ''].map((h, i) => (
//               <th key={i} style={{ ...tHead, textAlign: i === 2 || i === 3 ? 'right' : 'left' }}>{h}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((r) => (
//             <Fragment key={r.productId}>
//               <tr
//                 style={{ transition: 'background 0.12s' }}
//                 onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.25)')}
//                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//               >
//                 <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{r.particulars || r.productId}</td>
//                 <td style={tCell}>{r.sku || '?'}</td>
//                 <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(r.totalQty)}</td>
//                 <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(r.deliveryCount)}</td>
//                 <td style={tCell}>
//                   {r.deliveries.length ? (
//                     <button
//                       onClick={() => onToggleExpand(expandedId === r.productId ? null : r.productId)}
//                       style={{
//                         padding: '4px 12px', borderRadius: 8, border: '1px solid #fecaca',
//                         background: '#fff', fontSize: 12, fontWeight: 600, color: '#dc2626',
//                         cursor: 'pointer',
//                       }}
//                     >{expandedId === r.productId ? 'Hide orders' : 'View orders'}</button>
//                   ) : null}
//                 </td>
//               </tr>
//               {expandedId === r.productId && (
//                 <tr>
//                   <td colSpan={5} style={{ padding: '0 14px 12px' }}>
//                     <div style={{ background: '#fef2f2', borderRadius: 8, padding: 14, border: '1px solid #fecaca' }}>
//                       <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
//                         Missing orders for this product
//                       </div>
//                       {r.deliveries.map((d) => (
//                         <div key={d.id} style={{
//                           display: 'grid', gridTemplateColumns: '1fr auto', gap: 8,
//                           fontSize: 12, color: '#374151', paddingBottom: 8,
//                           borderBottom: '1px solid #fee2e2', marginBottom: 8,
//                         }}>
//                           <div>
//                             <Link to={`/deliveries/${d.id}`} style={{ fontWeight: 600, color: '#dc2626', textDecoration: 'none' }}>
//                               {d.deliveryNo}
//                             </Link>
//                             {d.customerName ? (
//                               <span style={{ color: '#64748b', marginLeft: 8 }}>{d.customerName}</span>
//                             ) : null}
//                             {d.deliveryAt ? (
//                               <span style={{ color: '#94a3b8', marginLeft: 8 }}>{formatDeliveryDate(d.deliveryAt)}</span>
//                             ) : null}
//                           </div>
//                           <span style={{ fontWeight: 700, color: '#dc2626', whiteSpace: 'nowrap' }}>
//                             qty {formatNumber(d.qty)}{d.note ? ` ? ${d.note}` : ''}
//                           </span>
//                         </div>
//                       ))}
//                     </div>
//                   </td>
//                 </tr>
//               )}
//             </Fragment>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// // -- inline searchable select for biller ------------------------------------

// function InlineSearchableSelect({
//   value, onChange, options, placeholder = '— Select —',
// }: {
//   value: string
//   onChange: (v: string) => void
//   options: Array<{ value: string; label: string }>
//   placeholder?: string
// }) {
//   const [open, setOpen] = React.useState(false)
//   const [search, setSearch] = React.useState('')
//   const [dropPos, setDropPos] = React.useState({ top: 0, left: 0, width: 0 })
//   const wrapRef = React.useRef<HTMLDivElement>(null)
//   const btnRef = React.useRef<HTMLButtonElement>(null)
//   const inputRef = React.useRef<HTMLInputElement>(null)
//   const dropRef = React.useRef<HTMLDivElement>(null)

//   // Close on outside click — must check both the trigger and the portal
//   React.useEffect(() => {
//     if (!open) return
//     const handler = (e: MouseEvent) => {
//       const t = e.target as Node
//       if (wrapRef.current?.contains(t)) return
//       if (dropRef.current?.contains(t)) return
//       setOpen(false)
//       setSearch('')
//     }
//     document.addEventListener('mousedown', handler)
//     return () => document.removeEventListener('mousedown', handler)
//   }, [open])

//   // Compute and update dropdown position whenever open or on scroll/resize
//   React.useEffect(() => {
//     if (!open) return
//     const reposition = () => {
//       if (btnRef.current) {
//         const r = btnRef.current.getBoundingClientRect()
//         const DROPDOWN_W = 360
//         const clampedLeft = Math.max(8, Math.min(r.left, window.innerWidth - DROPDOWN_W - 8))
//         setDropPos({ top: r.bottom + 4, left: clampedLeft, width: Math.max(r.width, DROPDOWN_W) })
//       }
//     }
//     reposition() // set position immediately when opened
//     window.addEventListener('scroll', reposition, true)
//     window.addEventListener('resize', reposition)
//     return () => {
//       window.removeEventListener('scroll', reposition, true)
//       window.removeEventListener('resize', reposition)
//     }
//   }, [open])

//   React.useEffect(() => {
//     if (open) setTimeout(() => inputRef.current?.focus(), 50)
//   }, [open])

//   const handleToggle = () => {
//     setOpen(o => !o)
//     setSearch('')
//   }

//   const handleSelect = (val: string) => {
//     onChange(val)
//     setOpen(false)
//     setSearch('')
//   }

//   const filtered = search.trim()
//     ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
//     : options

//   const selectedLabel = options.find(o => o.value === value)?.label ?? placeholder

//   const dropdown = open ? ReactDOM.createPortal(
//     <div
//       ref={dropRef}
//       style={{
//         position: 'fixed',
//         top: dropPos.top,
//         left: dropPos.left,
//         minWidth: dropPos.width,
//         maxWidth: 360,
//         zIndex: 99999,
//         background: '#fff',
//         border: '1px solid #d1fae5',
//         borderRadius: 10,
//         boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
//         overflow: 'hidden',
//       }}
//     >
//       {/* Search box */}
//       <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
//         <div style={{ position: 'relative' }}>
//           <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}
//             width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//             <circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4.5 4.5" strokeLinecap="round" />
//           </svg>
//           <input
//             ref={inputRef}
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//             placeholder="Search…"
//             style={{
//               width: '100%', height: 30, paddingLeft: 26, paddingRight: 8,
//               border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12,
//               color: '#0f172a', background: '#f8fafc', outline: 'none',
//               boxSizing: 'border-box', fontFamily: 'inherit',
//             }}
//             onKeyDown={e => e.key === 'Escape' && (setOpen(false), setSearch(''))}
//           />
//         </div>
//       </div>
//       {/* Options */}
//       <div style={{ maxHeight: 220, overflowY: 'auto' }}>
//         {filtered.length === 0
//           ? <div style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>No results</div>
//           : filtered.map(o => (
//             <div
//               key={o.value}
//               onMouseDown={e => { e.preventDefault(); handleSelect(o.value) }}
//               style={{
//                 padding: '8px 14px', fontSize: 13, cursor: 'pointer',
//                 color: o.value === value ? '#059669' : '#0f172a',
//                 fontWeight: o.value === value ? 700 : 400,
//                 background: o.value === value ? '#f0fdf4' : undefined,
//               }}
//               onMouseEnter={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
//               onMouseLeave={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = o.value === value ? '#f0fdf4' : '' }}
//             >{o.label}</div>
//           ))
//         }
//       </div>
//     </div>,
//     document.body,
//   ) : null

//   return (
//     <div ref={wrapRef} style={{ position: 'relative', minWidth: 220 }}>
//       <button
//         ref={btnRef}
//         type="button"
//         onClick={handleToggle}
//         style={{
//           height: 38, width: '100%', minWidth: 220, padding: '0 32px 0 12px',
//           border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff',
//           fontSize: 13, color: value ? '#0f172a' : '#94a3b8', textAlign: 'left',
//           cursor: 'pointer', position: 'relative', fontFamily: 'inherit',
//           boxShadow: '0 1px 2px rgba(0,0,0,0.04)', whiteSpace: 'nowrap',
//           overflow: 'hidden', textOverflow: 'ellipsis',
//           outline: open ? '2px solid #a7f3d0' : 'none',
//         }}
//       >
//         {selectedLabel}
//         <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
//           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//             <path d="m6 9 6 6 6-6" />
//           </svg>
//         </span>
//       </button>
//       {dropdown}
//     </div>
//   )
// }

// // -- main component ---------------------------------------------------------

// export function ReportsPage() {
//   const auth = useAuth()
//   const {
//     date, dateTo, godownId, site, customerName, billerUserId, productId, tab, godowns, sites, customers,
//     billers: billersRaw, products: productsRaw,
//     filterQuery, dateQuery, setFilters, lockGodownFilter,
//   } = useReportFilters()

//   // Defensive fallbacks — guard against hook not returning these
//   const billers = (billersRaw as typeof billersRaw | undefined) ?? []
//   const products = (productsRaw as typeof productsRaw | undefined) ?? []

//   const resolvedTab = (ISSUE_TABS.has(tab as ReportTab) ? tab : 'issues-godown') as ReportTab
//   const activeTab = resolvedTab
//   const issueSubTab = ISSUE_TABS.has(activeTab) ? activeTab : 'issues-godown'
//   const showIssueSection = ISSUE_TABS.has(activeTab) || activeTab === 'issues-godown'

//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [godownIssues, setGodownIssues] = useState<GodownIssueRow[] | null>(null)
//   const [deliveryIssues, setDeliveryIssues] = useState<IssueDeliveryRow[] | null>(null)
//   const [customerReport, setCustomerReport] = useState<CustomerIssueReport | null>(null)
//   const [customerProducts, setCustomerProducts] = useState<CustomerProductsReport | null>(null)
//   // const [stock, setStock] = useState<StockReportRow[] | null>(null)
//   const [billerReturns, setBillerReturns] = useState<BillerReturnRow[] | null>(null) // kept for selectedBillerStats
//   const [productReturns, setProductReturns] = useState<ProductReturnRow[] | null>(null)
//   const [missingOrders, setMissingOrders] = useState<IssueDeliveryRow[] | null>(null)
//   const [expandedId, setExpandedId] = useState<string | null>(null)
//   const [pwExpandedId, setPwExpandedId] = useState<string | null>(null)
//   const [showPwView, setShowPwView] = useState(false)

//   const isBillerRole = auth.status === 'authenticated' && auth.user.role === 'BILLER'
//   const selectedGodownName = godowns.find((g) => g.id === godownId)?.name
//   const selectedBillerName = useMemo(() => {
//     if (isBillerRole && auth.status === 'authenticated') {
//       return auth.user.contactName || auth.user.siteName || 'My returns'
//     }
//     return billerReturns?.find((b) => b.billerUserId === billerUserId)?.billerName || billerUserId
//   }, [isBillerRole, auth, billerReturns, billerUserId])

//   // const showBillerGodowns = false // removed drill-down flow
//   // const showBillerList = false    // removed drill-down flow
//   const showProductList = activeTab === 'issues-biller' && (Boolean(billerUserId) || isBillerRole)

//   // const billerStep: 1 | 2 | 3 = showProductList ? 3 : showBillerList ? 2 : 1

//   const selectedBillerStats = useMemo(() => {
//     const b = billerReturns?.find((row) => row.billerUserId === billerUserId)
//     if (b) return b
//     if (!missingOrders?.length) return null
//     return {
//       missingOrderCount: missingOrders.length,
//       missingQty: missingOrders.reduce((s, o) => s + o.missingQty, 0),
//       missingTotal: missingOrders.reduce((s, o) => s + (o.missingTotal || 0), 0),
//     }
//   }, [billerReturns, billerUserId, missingOrders])

//   useEffect(() => { setShowPwView(false); setPwExpandedId(null) }, [activeTab, godownId, billerUserId, customerName])

//   useEffect(() => {
//     if (!ISSUE_TABS.has(activeTab)) return
//     const token = getToken(); if (!token) return
//     if (activeTab === 'issues-customer' && !customerName.trim()) { setCustomerReport(null); setCustomerProducts(null); return }
//     setLoading(true); setError(null)

//     const loadGodown = () =>
//       apiFetch<GodownIssueRow[]>(`/reports/issues/by-godown?${dateQuery}limit=100${filterQuery}`, { token })
//         .then(setGodownIssues).catch(() => setGodownIssues([]))
//     const loadDelivery = () =>
//       apiFetch<IssueDeliveryRow[]>(`/reports/issues/by-delivery?${dateQuery}limit=100${filterQuery}`, { token })
//         .then(setDeliveryIssues).catch(() => setDeliveryIssues([]))
//     const loadCustomer = () => {
//       const cn = encodeURIComponent(customerName.trim())
//       const fq = filterQuery.replace(/&?customerName=[^&]*/g, '')
//       return Promise.all([
//         apiFetch<CustomerIssueReport>(`/reports/issues/customer?${dateQuery}customerName=${cn}${fq}`, { token })
//           .then(setCustomerReport).catch(() => setCustomerReport(null)),
//         apiFetch<CustomerProductsReport>(`/reports/issues/customer-products?${dateQuery}customerName=${cn}${fq}`, { token })
//           .then(setCustomerProducts).catch(() => setCustomerProducts(null)),
//       ]).then(() => undefined)
//     }

//     const promises: Promise<void>[] = []
//     if (activeTab === 'issues-godown' || (activeTab === 'issues-biller' && !godownId && !lockGodownFilter)) {
//       promises.push(loadGodown())
//     }
//     if (activeTab === 'issues-godown' || activeTab === 'issues-delivery') promises.push(loadDelivery())
//     if (activeTab === 'issues-customer') promises.push(loadCustomer())
//     Promise.all(promises).finally(() => setLoading(false))
//   }, [date, dateTo, dateQuery, filterQuery, activeTab, customerName, godownId, site, lockGodownFilter])

//   useEffect(() => {
//     if (activeTab !== 'issues-biller') return
//     const token = getToken(); if (!token) return

//     if (showProductList) {
//       setLoading(true); setError(null)
//       const fq = filterQuery.includes('billerUserId')
//         ? filterQuery
//         : `${filterQuery}&billerUserId=${encodeURIComponent(billerUserId)}`
//       const godownPart = godownId ? `godownId=${encodeURIComponent(godownId)}&` : ''

// const productQ =`/reports/returns/by-product?date=${date}&godownId=6a06a76afb0121a70a2c12bc&billerUserId=${encodeURIComponent(billerUserId)}&metric=missing`

// // `/reports/returns/by-product?${dateQuery}${godownId ? `godownId=${encodeURIComponent(godownId)}&` : ''}billerUserId=${encodeURIComponent(billerUserId)}&metric=missing`
//       const ordersQ = `/reports/issues/by-delivery?${dateQuery}${godownPart}${fq.replace(/^&/, '')}&limit=200`
//       Promise.all([
//         apiFetch<ProductReturnRow[]>(productQ, { token }),
//         apiFetch<IssueDeliveryRow[]>(ordersQ, { token }),
//       ])
//         .then(([prods, orders]) => {
//           setProductReturns(prods)
//           setMissingOrders(orders.filter((o) => o.missingQty > 0))
//         })
//         .catch((e: unknown) => {
//           setError(e instanceof Error ? e.message : 'Failed to load missing report')
//           setProductReturns([])
//           setMissingOrders([])
//         })
//         .finally(() => setLoading(false))
//       return
//     }

//     setBillerReturns(null)
//     setProductReturns(null)
//     setMissingOrders(null)
//   }, [activeTab, date, dateTo, dateQuery, filterQuery, godownId, billerUserId, showProductList])

//   // useEffect(() => {
//   //   if (activeTab !== 'stock') return
//   //   const token = getToken(); if (!token) return
//   //   if (auth.status !== 'authenticated' || (auth.user.role !== 'ADMIN' && auth.user.role !== 'GODOWN')) return
//   //   setLoading(true); setError(null)
//   //   const gidQ = godownId ? `?godownId=${encodeURIComponent(godownId)}` : ''
//   //   apiFetch<StockReportRow[]>(`/reports/stock${gidQ}`, { token })
//   //     .then(setStock)
//   //     .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load stock'))
//   //     .finally(() => setLoading(false))
//   // }, [activeTab, godownId, auth])

//   const pwLines = useMemo(
//     () => buildPwLines(deliveryIssues || []),
//     [deliveryIssues],
//   )

//   const customerPwLines = useMemo(
//     () => buildPwLines(customerReport?.deliveries || []),
//     [customerReport],
//   )

//   const billerPwLines = useMemo(
//     () => buildPwLines(missingOrders || []),
//     [missingOrders],
//   )

//   // -- shared table styles ------------------------------------------------

//   const tableWrap: React.CSSProperties = { overflowX: 'auto' }
//   const tableEl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 800 }

//   return (
//     // AppShell provides 20px 24px padding
//     <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 16 }}>

//       {/* -- FILTERS CARD -- */}
//       <ReportCard>
//         <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f0f9' }}>
//           <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Filters</div>
//         </div>
//         <div style={{ padding: '18px 20px' }}>
//           <ReportFiltersBar
//             godowns={godowns}
//             sites={sites}
//             customers={customers}
//             billers={billers}
//             products={products}
//             godownId={godownId}
//             site={site}
//             customerName={customerName}
//             billerUserId={billerUserId}
//             productId={productId}
//             onGodownChange={(id) => setFilters({
//               godownId: id,
//               billerUserId: activeTab === 'issues-biller' && !isBillerRole ? billerUserId : billerUserId,
//             })}
//             onSiteChange={(s) => setFilters({ site: s })}
//             onCustomerChange={(name) => setFilters({ customerName: name })}
//             onBillerChange={(id) => setFilters({ billerUserId: id })}
//             onProductChange={(id) => setFilters({ productId: id })}
//             showDate
//             showDateTo={showIssueSection}
//             date={date}
//             dateTo={dateTo}
//             onDateChange={(d) => setFilters({ date: d })}
//             onDateToChange={(d) => setFilters({ dateTo: d })}
//             showCustomer={activeTab === 'issues-customer'}
//             showBiller={false}
//             showProduct
//             hideGodownFilter={lockGodownFilter}
//           />
//         </div>
//       </ReportCard>

//       {/* -- ISSUE SUB TABS -- */}
//       {showIssueSection && (
//         <div style={{
//           display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
//           paddingLeft: 12, paddingRight: 0, paddingTop: 0, paddingBottom: 0,
//           borderLeftWidth: 2, borderLeftStyle: 'solid', borderLeftColor: '#a7f3d0',
//         }}>
//           {ISSUE_SUB_TABS.map((t) => (
//             <SubPillTab
//               key={t.id}
//               label={t.label}
//               active={issueSubTab === t.id}
//               onClick={() => setFilters({ tab: t.id })}
//             />
//           ))}
//         </div>
//       )}

//       {/* -- ERROR -- */}
//       {error && (
//         <div style={{
//           padding: '10px 16px', borderRadius: 10, background: '#fef2f2',
//           color: '#b91c1c', fontSize: 13,
//           borderWidth: 1, borderStyle: 'solid', borderColor: '#fecaca',
//         }}>{error}</div>
//       )}

//       {/* -- LOADING SPINNER -- */}
//       {loading && (
//         <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
//           <div style={{
//             width: 32, height: 32, borderRadius: '50%',
//             border: '3px solid #e2e8f0', borderTopColor: '#10b981',
//             animation: 'spin 0.7s linear infinite',
//           }} />
//           <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//         </div>
//       )}

//       {/* ----------------------------------------------
//           ISSUES — BY BILLER (direct select)
//       ---------------------------------------------- */}
//       {activeTab === 'issues-biller' && (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

//           {/* Card with title + inline biller select */}
//           <ReportCard>
//             <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
//               <div>
//                 <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing by biller</div>
//                 <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
//                   Select a biller to view their missing orders and product breakdown.
//                 </div>
//               </div>
//               {!isBillerRole && (
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
//                   <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Biller</label>
//                   <InlineSearchableSelect
//                     value={billerUserId}
//                     onChange={(id) => setFilters({ billerUserId: id })}
//                     options={[
//                       { value: '', label: '— Select a biller —' },
//                       ...billers.map((b) => ({ value: b.id, label: b.name + (b.siteName ? ` — ${b.siteName}` : '') })),
//                     ]}
//                     placeholder="— Select a biller —"
//                   />
//                   {billerUserId && (
//                     <button
//                       onClick={() => setFilters({ billerUserId: '' })}
//                       style={{
//                         padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
//                         background: '#fff', fontSize: 12, color: '#64748b', cursor: 'pointer',
//                       }}
//                     >Clear</button>
//                   )}
//                 </div>
//               )}
//             </div>

//             {/* Prompt when no biller selected */}
//             {!billerUserId && !isBillerRole && (
//               <div style={{ padding: '32px 20px', textAlign: 'center' }}>
//                 <div style={{ fontSize: 13, color: '#64748b' }}>Select a biller above to view their missing report.</div>
//               </div>
//             )}

//             {/* Stat summary row */}
//             {showProductList && (
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #f1f5f9' }}>
//                 {[
//                   { label: 'Missing orders', value: formatNumber(selectedBillerStats?.missingOrderCount ?? missingOrders?.length ?? 0), accent: '#dc2626' },
//                   { label: 'Missing quantity', value: formatNumber(selectedBillerStats?.missingQty ?? 0), accent: '#dc2626' },
//                   { label: 'Missing value', value: formatCurrency(selectedBillerStats?.missingTotal ?? 0), accent: '#d97706' },
//                 ].map(({ label, value, accent }, i) => (
//                   <div key={label} style={{
//                     padding: '16px 20px',
//                     borderRight: i < 2 ? '1px solid #f1f5f9' : undefined,
//                   }}>
//                     <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
//                     <div style={{ fontSize: 22, fontWeight: 700, color: accent, marginTop: 4 }}>{value}</div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </ReportCard>

//           {showProductList && (
//             <>
//               <ReportCard>
//                 <CardHead
//                   title="Missing orders"
//                   sub={`${selectedBillerName}${selectedGodownName ? ` — ${selectedGodownName}` : ''} — deliveries with biller-reported missing items`}
//                 />
//                 <div style={{ padding: '0 0 4px' }}>
//                   {missingOrders ? <MissingOrdersTable rows={missingOrders} /> : null}
//                 </div>
//               </ReportCard>

//               <ReportCard>
//                 <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
//                   <div>
//                     <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing by product</div>
//                     <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Products reported missing — expand to see godown, delivery, and customer details</div>
//                   </div>
//                   <div style={{ display: 'flex', gap: 6 }}>
//                     <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>Orders view</button>
//                     <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
//                   </div>
//                 </div>
//                 <div style={{ padding: '0 0 4px' }}>
//                   {!showPwView ? (
//                     productReturns ? (
//                       <ProductMissingTable rows={productReturns} expandedId={expandedId} onToggleExpand={setExpandedId} />
//                     ) : !loading ? (
//                       <Empty title="No missing products" sub="No product-level missing data for this biller." />
//                     ) : null
//                   ) : (
//                     <ProductWisePanel lines={billerPwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer />
//                   )}
//                 </div>
//               </ReportCard>
//             </>
//           )}
//         </div>
//       )}

//       {/* ----------------------------------------------
//           ISSUES — BY GODOWN
//       ---------------------------------------------- */}
//       {activeTab === 'issues-godown' && (
//         <ReportCard>
//           <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
//             <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing &amp; damage by godown</div>
//             <div style={{ display: 'flex', gap: 6 }}>
//               <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>By godown</button>
//               <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
//             </div>
//           </div>
//           {!showPwView ? (
//             godownIssues?.length ? (
//               <div style={tableWrap}>
//                 <table style={{ ...tableEl, minWidth: 980 }}>
//                   <thead>
//                     <tr>
//                       {['Godown','Deliveries','With issues','Missing qty','Missing value','Damage qty','Damage value','Tags missing',''].map((h, i) => (
//                         <th key={i} style={{ ...tHead, textAlign: i >= 1 && i <= 7 ? 'right' : 'left' }}>{h}</th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {godownIssues.map((g) => (
//                       <tr key={g.godownId} style={{ transition: 'background 0.12s' }}
//                         onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.4)')}
//                         onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//                       >
//                         <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{g.godownName || g.godownId}</td>
//                         <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(g.totalDeliveries)}</td>
//                         <td style={{ ...tCell, textAlign: 'right', fontWeight: g.issueDeliveryCount > 0 ? 700 : undefined, color: g.issueDeliveryCount > 0 ? '#dc2626' : undefined }}>{formatNumber(g.issueDeliveryCount)}</td>
//                         <td style={{ ...tCell, textAlign: 'right', fontWeight: g.missingQty > 0 ? 700 : undefined, color: g.missingQty > 0 ? '#dc2626' : undefined }}>{formatNumber(g.missingQty)}</td>
//                         <td style={{ ...tCell, textAlign: 'right', color: g.missingTotal > 0 ? '#dc2626' : undefined }}>{g.missingTotal > 0 ? formatCurrency(g.missingTotal) : '—'}</td>
//                         <td style={{ ...tCell, textAlign: 'right', fontWeight: g.damageQty > 0 ? 700 : undefined, color: g.damageQty > 0 ? '#d97706' : undefined }}>{formatNumber(g.damageQty)}</td>
//                         <td style={{ ...tCell, textAlign: 'right', color: g.damageTotal > 0 ? '#d97706' : undefined }}>{g.damageTotal > 0 ? formatCurrency(g.damageTotal) : '—'}</td>
//                         <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(g.missingTagCount)}</td>
//                         <td style={tCell}>
//                           <button
//                             onClick={() => setFilters({ godownId: g.godownId, tab: 'issues-delivery' })}
//                             style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#059669', cursor: 'pointer', whiteSpace: 'nowrap' }}
//                           >View deliveries</button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             ) : !loading ? (
//               <div style={{ padding: '0 0 4px' }}>
//                 <Empty title="No godown data" sub="No deliveries in the selected period." />
//               </div>
//             ) : null
//           ) : (
//             <div style={{ padding: '0 0 4px' }}>
//               <ProductWisePanel lines={pwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer />
//             </div>
//           )}
//         </ReportCard>
//       )}

//       {/* ----------------------------------------------
//           ISSUES — BY DELIVERY
//       ---------------------------------------------- */}
//       {activeTab === 'issues-delivery' && (
//         <ReportCard>
//           <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
//             <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing &amp; damage by delivery</div>
//             <div style={{ display: 'flex', gap: 6 }}>
//               <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>By delivery</button>
//               <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
//             </div>
//           </div>
//           <div style={{ padding: '0 0 4px' }}>
//             {!showPwView ? (
//               deliveryIssues ? (
//                 <IssueDeliveryTable rows={deliveryIssues} expandedId={expandedId} onToggleExpand={setExpandedId} />
//               ) : !loading ? (
//                 <Empty title="No issue deliveries" sub="No missing or damage for this period and filters." />
//               ) : null
//             ) : (
//               <ProductWisePanel lines={pwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer />
//             )}
//           </div>
//         </ReportCard>
//       )}

//       {/* ----------------------------------------------
//           ISSUES — BY CUSTOMER
//       ---------------------------------------------- */}
//       {activeTab === 'issues-customer' && (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
//           {!customerName.trim() ? (
//             <ReportCard>
//               <div style={{ padding: '20px' }}>
//                 <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
//                   Select a customer above to load their delivery and issue summary.
//                 </p>
//               </div>
//             </ReportCard>
//           ) : null}

//           {customerReport && (
//             <>
//               {/* summary metrics */}
//               <ReportCard>
//                 <CardHead title={customerReport.customerName} />
//                 <div style={{
//                   display: 'grid',
//                   gridTemplateColumns: 'repeat(3, 1fr)',
//                   gap: 0,
//                 }}>
//                   {[
//                     { label: 'Deliveries', val: customerReport.summary.deliveryCount },
//                     { label: 'With issues', val: customerReport.summary.issueDeliveryCount },
//                     { label: 'Missing qty', val: customerReport.summary.missingQty, accent: '#dc2626' },
//                     { label: 'Damage qty', val: customerReport.summary.damageQty, accent: '#d97706' },
//                     { label: 'Tags missing', val: customerReport.summary.missingTagCount, accent: '#dc2626' },
//                     { label: 'Dmg/lost tags', val: customerReport.summary.damagedTagCount + customerReport.summary.lostTagCount, accent: '#d97706' },
//                   ].map(({ label, val, accent }, i) => (
//                     <div key={label} style={{
//                       padding: '14px 18px',
//                       borderBottom: i < 3 ? '1px solid #f1f5f9' : undefined,
//                       borderRight: (i + 1) % 3 !== 0 ? '1px solid #f1f5f9' : undefined,
//                     }}>
//                       <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{label}</div>
//                       <div style={{ fontSize: 18, fontWeight: 700, color: accent || '#0f172a', marginTop: 4 }}>
//                         {formatNumber(val)}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//                 {(customerReport.summary.missingTotal > 0 || customerReport.summary.damageTotal > 0) && (
//                   <div style={{ display: 'flex', gap: 24, padding: '12px 18px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
//                     {customerReport.summary.missingTotal > 0 && (
//                       <div>
//                         <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Missing value </span>
//                         <span style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>{formatCurrency(customerReport.summary.missingTotal)}</span>
//                       </div>
//                     )}
//                     {customerReport.summary.damageTotal > 0 && (
//                       <div>
//                         <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Damage value </span>
//                         <span style={{ fontSize: 14, fontWeight: 700, color: '#d97706' }}>{formatCurrency(customerReport.summary.damageTotal)}</span>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </ReportCard>

//               {/* product breakdown */}
//               {customerProducts && (customerProducts.missingByProduct.length > 0 || customerProducts.damagedByProduct.length > 0) && (
//                 <ReportCard>
//                   <CardHead title="Product breakdown" sub="Missing and damaged products aggregated across all deliveries for this customer" />
//                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
//                     {/* Missing products */}
//                     <div style={{ borderRight: '1px solid #f1f5f9' }}>
//                       <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#fef2f2' }}>
//                         <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
//                           Missing products ({customerProducts.missingByProduct.length})
//                         </span>
//                       </div>
//                       {customerProducts.missingByProduct.length ? (
//                         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                           <thead>
//                             <tr>
//                               <th style={{ ...tHead, background: '#fff5f5' }}>Product</th>
//                               <th style={{ ...tHead, textAlign: 'right', background: '#fff5f5' }}>Missing qty</th>
//                               <th style={{ ...tHead, textAlign: 'right', background: '#fff5f5' }}>Orders</th>
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {customerProducts.missingByProduct.map((p) => (
//                               <tr key={p.productId}
//                                 onMouseEnter={(e) => (e.currentTarget.style.background = '#fff5f5')}
//                                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//                               >
//                                 <td style={{ ...tCell, fontWeight: 500 }}>{p.particulars || p.sku || p.productId}</td>
//                                 <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(p.totalQty)}</td>
//                                 <td style={{ ...tCell, textAlign: 'right', color: '#64748b' }}>{formatNumber(p.deliveryCount)}</td>
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       ) : (
//                         <div style={{ padding: '16px', fontSize: 12, color: '#94a3b8' }}>No missing products.</div>
//                       )}
//                     </div>
//                     {/* Damaged products */}
//                     <div>
//                       <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#fffbeb' }}>
//                         <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
//                           Damaged products ({customerProducts.damagedByProduct.length})
//                         </span>
//                       </div>
//                       {customerProducts.damagedByProduct.length ? (
//                         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                           <thead>
//                             <tr>
//                               <th style={{ ...tHead, background: '#fffdf0' }}>Product</th>
//                               <th style={{ ...tHead, textAlign: 'right', background: '#fffdf0' }}>Damaged qty</th>
//                               <th style={{ ...tHead, textAlign: 'right', background: '#fffdf0' }}>Orders</th>
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {customerProducts.damagedByProduct.map((p) => (
//                               <tr key={p.productId}
//                                 onMouseEnter={(e) => (e.currentTarget.style.background = '#fffdf0')}
//                                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//                               >
//                                 <td style={{ ...tCell, fontWeight: 500 }}>{p.particulars || p.sku || p.productId}</td>
//                                 <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#d97706' }}>{formatNumber(p.totalQty)}</td>
//                                 <td style={{ ...tCell, textAlign: 'right', color: '#64748b' }}>{formatNumber(p.deliveryCount)}</td>
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       ) : (
//                         <div style={{ padding: '16px', fontSize: 12, color: '#94a3b8' }}>No damaged products.</div>
//                       )}
//                     </div>
//                   </div>
//                 </ReportCard>
//               )}

//               {/* deliveries table */}
//               <ReportCard>
//                 <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
//                   <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Deliveries (date-wise)</div>
//                   <div style={{ display: 'flex', gap: 6 }}>
//                     <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>By delivery</button>
//                     <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
//                   </div>
//                 </div>
//                 {!showPwView ? (
//                   <IssueDeliveryTable rows={customerReport.deliveries} expandedId={expandedId} onToggleExpand={setExpandedId} />
//                 ) : (
//                   <div style={{ padding: '0 0 4px' }}>
//                     <ProductWisePanel lines={customerPwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer={false} />
//                   </div>
//                 )}
//               </ReportCard>
//             </>
//           )}

//           {customerName.trim() && !loading && !customerReport && (
//             <Empty title="No data" sub="No deliveries for this customer in the selected period." />
//           )}
//         </div>
//       )}

//     </div>
//   )
// }

// import React, { Fragment, useEffect, useMemo, useState } from 'react'
// import { Link } from 'react-router-dom'
// import { ReportFiltersBar } from '../components/reports/ReportFiltersBar'
// import { formatNumber } from '../lib/format'
// import { Badge } from '../components/ui/Badge'
// // import { StatCard } from '../components/ui/StatCard'
// import { apiFetch } from '../lib/api'
// import { getToken, useAuth } from '../auth/store'
// import { useReportFilters } from '../hooks/useReportFilters'
// // At the top of the file, add this import:
// import ReactDOM from 'react-dom'
// import type {
//   BillerReturnRow,
//   CustomerIssueReport,
//   CustomerProductsReport,
//   GodownIssueRow,
//   IssueDeliveryRow,
//   ProductReturnRow,
//   ReportTab,
// } from '../types/reports'

// // -- constants --------------------------------------------------------------

// const MAIN_TABS: { id: ReportTab; label: string }[] = [
//   { id: 'issues-godown', label: 'Missing & damage' },
// ]

// const ISSUE_SUB_TABS: { id: ReportTab; label: string }[] = [
//   { id: 'issues-godown', label: 'By godown' },
//   { id: 'issues-biller', label: 'Missing by biller' },
//   { id: 'issues-delivery', label: 'By delivery' },
//   { id: 'issues-customer', label: 'By customer' },
// ]

// const ISSUE_TABS = new Set<ReportTab>(['issues-godown', 'issues-biller', 'issues-delivery', 'issues-customer'])

// // -- helpers ----------------------------------------------------------------

// function formatCurrency(n: number) {
//   return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
// }

// function badgeVariant(status: string) {
//   if (status === 'PROCESSED' || status === 'UPCOMING') return 'green'
//   if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return 'green'
//   if (status === 'PACKED') return 'slate'
//   if (status === 'RETURN_PICKUP') return 'amber'
//   if (status === 'COMPLETED') return 'slate'
//   return 'amber'
// }

// function formatDeliveryDate(iso: string) {
//   return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
// }

// // -- shared inline table styles ---------------------------------------------

// const tHead: React.CSSProperties = {
//   padding: '10px 14px',
//   fontSize: 11,
//   fontWeight: 700,
//   color: '#94a3b8',
//   textTransform: 'uppercase',
//   letterSpacing: '0.07em',
//   textAlign: 'left',
//   whiteSpace: 'nowrap',
//   background: '#f8fafc',
//   borderBottom: '1px solid #f1f5f9',
// }

// const tCell: React.CSSProperties = {
//   padding: '13px 14px',
//   fontSize: 13,
//   color: '#374151',
//   borderBottom: '1px solid #f1f5f9',
//   verticalAlign: 'middle',
// }

// // -- reusable card ----------------------------------------------------------

// function ReportCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
//   return (
//     // overflow must NOT be 'hidden' — SearchableSelect dropdowns need to escape the card boundary
//     <div style={{
//       background: '#fff',
//       border: '1px solid #e8eaf0',
//       borderRadius: 14,
//       ...style,
//     }}>
//       {children}
//     </div>
//   )
// }

// function CardHead({ title, sub }: { title: string; sub?: string }) {
//   return (
//     <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
//       <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</div>
//       {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
//     </div>
//   )
// }

// // -- pill tab button --------------------------------------------------------

// function PillTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
//   return (
//     <button
//       onClick={onClick}
//       style={{
//         padding: '7px 16px',
//         borderRadius: 20,
//         fontSize: 13,
//         fontWeight: active ? 700 : 500,
//         border: active ? 'none' : '1px solid #e2e8f0',
//         background: active ? '#059669' : '#fff',
//         color: active ? '#fff' : '#64748b',
//         cursor: 'pointer',
//         transition: 'all 0.15s',
//         whiteSpace: 'nowrap',
//       }}
//       onMouseEnter={(e) => {
//         if (!active) {
//           const el = e.currentTarget as HTMLElement
//           el.style.background = '#ecfdf5'
//           el.style.color = '#059669'
//           el.style.borderColor = '#a7f3d0'
//         }
//       }}
//       onMouseLeave={(e) => {
//         if (!active) {
//           const el = e.currentTarget as HTMLElement
//           el.style.background = '#fff'
//           el.style.color = '#64748b'
//           el.style.borderColor = '#e2e8f0'
//         }
//       }}
//     >
//       {label}
//     </button>
//   )
// }

// // -- sub-pill tab (smaller, for issue sub-tabs) -----------------------------

// function SubPillTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
//   return (
//     <button
//       onClick={onClick}
//       style={{
//         padding: '5px 13px',
//         borderRadius: 20,
//         fontSize: 12,
//         fontWeight: active ? 700 : 500,
//         border: active ? 'none' : '1px solid #e2e8f0',
//         background: active ? '#10b981' : '#fff',
//         color: active ? '#fff' : '#64748b',
//         cursor: 'pointer',
//         transition: 'all 0.15s',
//         whiteSpace: 'nowrap',
//       }}
//       onMouseEnter={(e) => {
//         if (!active) {
//           const el = e.currentTarget as HTMLElement
//           el.style.background = '#ecfdf5'
//           el.style.color = '#059669'
//         }
//       }}
//       onMouseLeave={(e) => {
//         if (!active) {
//           const el = e.currentTarget as HTMLElement
//           el.style.background = '#fff'
//           el.style.color = '#64748b'
//         }
//       }}
//     >
//       {label}
//     </button>
//   )
// }

// // -- empty state ------------------------------------------------------------

// function Empty({ title, sub }: { title: string; sub: string }) {
//   return (
//     <div style={{ padding: '40px 0', textAlign: 'center' }}>
//       <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{title}</div>
//       <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div>
//     </div>
//   )
// }

// // -- product lines expandable panel ----------------------------------------

// function ProductLinesPanel({ row }: { row: IssueDeliveryRow }) {
//   if (!row.productMissing.length && !row.productDamaged.length) return null
//   return (
//     <div style={{
//       display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
//       background: '#f8fafc', borderRadius: 8, padding: 16,
//     }}>
//       {[
//         { label: 'Missing products', items: row.productMissing },
//         { label: 'Damaged products', items: row.productDamaged },
//       ].map(({ label, items }) => (
//         <div key={label}>
//           <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{label}</div>
//           {items.length ? items.map((p) => (
//             <div key={p.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', paddingBottom: 6 }}>
//               <span>{p.particulars || p.sku || p.productId}</span>
//               <span style={{ fontWeight: 600 }}>qty {p.qty}</span>
//             </div>
//           )) : <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>None reported.</p>}
//         </div>
//       ))}
//     </div>
//   )
// }


// // -- product-wise panel: aggregated product list with godown/biller/delivery/customer ──

// type PwLine = {
//   productId: string
//   particulars?: string
//   sku?: string
//   missingQty: number
//   damageQty: number
//   rows: Array<{
//     deliveryId: string
//     deliveryNo: string
//     customerName: string
//     siteName?: string
//     godownName?: string
//     deliveryAt: string
//     qty: number
//     type: 'missing' | 'damage'
//   }>
// }

// function buildPwLines(deliveries: IssueDeliveryRow[]): PwLine[] {
//   const map = new Map<string, PwLine>()
//   const add = (
//     p: { productId: string; particulars?: string; sku?: string; qty: number },
//     d: IssueDeliveryRow,
//     type: 'missing' | 'damage',
//   ) => {
//     if (!map.has(p.productId)) {
//       map.set(p.productId, { productId: p.productId, particulars: p.particulars, sku: p.sku, missingQty: 0, damageQty: 0, rows: [] })
//     }
//     const e = map.get(p.productId)!
//     if (type === 'missing') e.missingQty += p.qty; else e.damageQty += p.qty
//     e.rows.push({ deliveryId: d.id, deliveryNo: d.deliveryNo, customerName: d.customerName, siteName: d.siteName, godownName: d.godownName, deliveryAt: d.deliveryAt, qty: p.qty, type })
//   }
//   for (const d of deliveries) {
//     for (const p of d.productMissing) add(p, d, 'missing')
//     for (const p of d.productDamaged) add(p, d, 'damage')
//   }
//   return Array.from(map.values()).sort((a, b) => (b.missingQty + b.damageQty) - (a.missingQty + a.damageQty))
// }

// function ProductWisePanel({
//   lines, expandedId, onToggle,
//   showGodown = true, showCustomer = true,
// }: {
//   lines: PwLine[]
//   expandedId: string | null
//   onToggle: (id: string | null) => void
//   showGodown?: boolean
//   showCustomer?: boolean
// }) {
//   if (!lines.length) return <Empty title="No product issues" sub="No missing or damaged products for the selected filters." />
//   return (
//     <div style={{ overflowX: 'auto' }}>
//       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
//         <thead>
//           <tr>
//             <th style={tHead}>Product</th>
//             <th style={tHead}>SKU</th>
//             <th style={{ ...tHead, textAlign: 'right', color: '#dc2626' }}>Missing qty</th>
//             <th style={{ ...tHead, textAlign: 'right', color: '#d97706' }}>Damage qty</th>
//             <th style={{ ...tHead, textAlign: 'right' }}>Deliveries</th>
//             <th style={tHead}></th>
//           </tr>
//         </thead>
//         <tbody>
//           {lines.map((p) => (
//             <Fragment key={p.productId}>
//               <tr
//                 style={{ transition: 'background 0.12s', cursor: 'pointer' }}
//                 onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.25)')}
//                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//               >
//                 <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{p.particulars || p.productId}</td>
//                 <td style={{ ...tCell, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{p.sku || '—'}</td>
//                 <td style={{ ...tCell, textAlign: 'right', fontWeight: p.missingQty > 0 ? 700 : undefined, color: p.missingQty > 0 ? '#dc2626' : '#94a3b8' }}>{formatNumber(p.missingQty)}</td>
//                 <td style={{ ...tCell, textAlign: 'right', fontWeight: p.damageQty > 0 ? 700 : undefined, color: p.damageQty > 0 ? '#d97706' : '#94a3b8' }}>{formatNumber(p.damageQty)}</td>
//                 <td style={{ ...tCell, textAlign: 'right' }}>{p.rows.length}</td>
//                 <td style={tCell}>
//                   <button
//                     onClick={() => onToggle(expandedId === p.productId ? null : p.productId)}
//                     style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', fontSize: 12, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}
//                   >{expandedId === p.productId ? 'Hide' : 'View details'}</button>
//                 </td>
//               </tr>
//               {expandedId === p.productId && (
//                 <tr>
//                   <td colSpan={6} style={{ padding: '0 14px 14px' }}>
//                     <div style={{ background: '#fef9f9', border: '1px solid #fecaca', borderRadius: 10, padding: 14, marginTop: 2 }}>
//                       <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
//                         Delivery breakdown — {p.particulars || p.productId}
//                       </div>
//                       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                         <thead>
//                           <tr>
//                             <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Delivery</th>
//                             <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Date</th>
//                             {showCustomer && <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Customer</th>}
//                             {showCustomer && <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Site</th>}
//                             {showGodown && <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Godown</th>}
//                             <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px', textAlign: 'right' }}>Qty</th>
//                             <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Type</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {p.rows.map((r, idx) => (
//                             <tr key={idx}
//                               onMouseEnter={(e) => (e.currentTarget.style.background = '#fff5f5')}
//                               onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//                             >
//                               <td style={{ ...tCell, padding: '8px 10px' }}>
//                                 <Link to={`/deliveries/${r.deliveryId}`}
//                                   style={{ fontWeight: 600, color: '#059669', textDecoration: 'none', fontSize: 12 }}
//                                   onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
//                                   onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
//                                 >{r.deliveryNo}</Link>
//                               </td>
//                               <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDeliveryDate(r.deliveryAt)}</td>
//                               {showCustomer && <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.customerName}</td>}
//                               {showCustomer && <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.siteName || '—'}</td>}
//                               {showGodown && <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.godownName || '—'}</td>}
//                               <td style={{ ...tCell, padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: r.type === 'missing' ? '#dc2626' : '#d97706', fontSize: 13 }}>{formatNumber(r.qty)}</td>
//                               <td style={{ ...tCell, padding: '8px 10px' }}>
//                                 <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: r.type === 'missing' ? '#fef2f2' : '#fffbeb', color: r.type === 'missing' ? '#dc2626' : '#d97706' }}>
//                                   {r.type === 'missing' ? 'Missing' : 'Damaged'}
//                                 </span>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </td>
//                 </tr>
//               )}
//             </Fragment>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// // -- issue delivery table ---------------------------------------------------

// function IssueDeliveryTable({
//   rows, expandedId, onToggleExpand,
// }: {
//   rows: IssueDeliveryRow[]
//   expandedId: string | null
//   onToggleExpand: (id: string | null) => void
// }) {
//   if (!rows.length) return <Empty title="No deliveries" sub="No deliveries match the selected filters." />
//   return (
//     <div style={{ overflowX: 'auto' }}>
//       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
//         <thead>
//           <tr>
//             {['Delivery','Date','Customer','Site','Godown','Status','Missing qty','Damage qty','Tags missing',''].map((h, i) => (
//               <th key={i} style={{ ...tHead, textAlign: i >= 6 && i <= 8 ? 'right' : 'left' }}>{h}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((m) => (
//             <Fragment key={m.id}>
//               <tr
//                 style={{ transition: 'background 0.12s' }}
//                 onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.4)')}
//                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//               >
//                 <td style={tCell}>
//                   <Link to={`/deliveries/${m.id}`} style={{ fontWeight: 600, color: '#059669', textDecoration: 'none' }}
//                     onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
//                     onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
//                   >{m.deliveryNo}</Link>
//                 </td>
//                 <td style={{ ...tCell, whiteSpace: 'nowrap' }}>{formatDeliveryDate(m.deliveryAt)}</td>
//                 <td style={{ ...tCell, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.customerName}</td>
//                 <td style={{ ...tCell, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.siteName || '—'}</td>
//                 <td style={{ ...tCell, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.godownName || '—'}</td>
//                 <td style={tCell}><Badge variant={badgeVariant(m.status)}>{m.status}</Badge></td>
//                 <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.missingQty)}</td>
//                 <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.damageQty)}</td>
//                 <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.missingTagCount ?? m.missingCount)}</td>
//                 <td style={{ ...tCell }}>
//                   {(m.productMissing.length || m.productDamaged.length) ? (
//                     <button
//                       onClick={() => onToggleExpand(expandedId === m.id ? null : m.id)}
//                       style={{
//                         padding: '4px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
//                         background: '#fff', fontSize: 12, fontWeight: 600, color: '#059669',
//                         cursor: 'pointer',
//                       }}
//                     >{expandedId === m.id ? 'Hide' : 'Products'}</button>
//                   ) : null}
//                 </td>
//               </tr>
//               {expandedId === m.id && (
//                 <tr>
//                   <td colSpan={10} style={{ padding: '0 14px 12px' }}>
//                     <ProductLinesPanel row={m} />
//                   </td>
//                 </tr>
//               )}
//             </Fragment>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// // -- missing report step indicator ------------------------------------------

// // function MissingStepper({ step, labels }: { step: 1 | 2 | 3; labels: [string, string, string] }) {
// //   return (
// //     <div style={{
// //       display: 'flex', alignItems: 'center', gap: 0, padding: '14px 20px',
// //       borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(180deg, #f8fafc 0%, #fff 100%)',
// //       flexWrap: 'wrap',
// //     }}>
// //       {labels.map((label, i) => {
// //         const n = (i + 1) as 1 | 2 | 3
// //         const active = step === n
// //         const done = step > n
// //         return (
// //           <Fragment key={label}>
// //             {i > 0 ? (
// //               <div style={{ flex: '1 1 24px', height: 2, minWidth: 20, maxWidth: 48, background: done || active ? '#10b981' : '#e2e8f0', margin: '0 8px' }} />
// //             ) : null}
// //             <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
// //               <div style={{
// //                 width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
// //                 background: active ? '#059669' : done ? '#d1fae5' : '#f1f5f9',
// //                 color: active ? '#fff' : done ? '#059669' : '#94a3b8',
// //                 fontSize: 12, fontWeight: 700,
// //                 display: 'flex', alignItems: 'center', justifyContent: 'center',
// //               }}>{n}</div>
// //               <span style={{
// //                 fontSize: 12, fontWeight: active ? 700 : 500,
// //                 color: active ? '#0f172a' : '#64748b', whiteSpace: 'nowrap',
// //               }}>{label}</span>
// //             </div>
// //           </Fragment>
// //         )
// //       })}
// //     </div>
// //   )
// // }

// // -- missing orders table (per biller) --------------------------------------

// function MissingOrdersTable({ rows }: { rows: IssueDeliveryRow[] }) {
//   if (!rows.length) {
//     return <Empty title="No missing orders" sub="This biller has no orders with missing items in the selected period." />
//   }
//   return (
//     <div style={{ overflowX: 'auto' }}>
//       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
//         <thead>
//           <tr>
//             {['Order', 'Date', 'Customer', 'Site', 'Status', 'Missing qty', 'Value (?)', 'Products'].map((h, i) => (
//               <th key={h} style={{ ...tHead, textAlign: i >= 5 && i <= 6 ? 'right' : 'left' }}>{h}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((m) => (
//             <tr key={m.id} style={{ transition: 'background 0.12s' }}
//               onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.35)')}
//               onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//             >
//               <td style={tCell}>
//                 <Link to={`/deliveries/${m.id}`} style={{ fontWeight: 600, color: '#dc2626', textDecoration: 'none' }}
//                   onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
//                   onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
//                 >{m.deliveryNo}</Link>
//               </td>
//               <td style={{ ...tCell, whiteSpace: 'nowrap' }}>{formatDeliveryDate(m.deliveryAt)}</td>
//               <td style={{ ...tCell, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.customerName}</td>
//               <td style={{ ...tCell, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.siteName || '—'}</td>
//               <td style={tCell}><Badge variant={badgeVariant(m.status)}>{m.status}</Badge></td>
//               <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(m.missingQty)}</td>
//               <td style={{ ...tCell, textAlign: 'right' }}>{m.missingTotal != null ? formatCurrency(m.missingTotal) : '—'}</td>
//               <td style={{ ...tCell, fontSize: 12, color: '#64748b', maxWidth: 180 }}>
//                 {m.productMissing.slice(0, 2).map((p) => p.particulars || p.sku).join(', ')}
//                 {m.productMissing.length > 2 ? ` +${m.productMissing.length - 2}` : ''}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// // -- product missing table (per biller, with orders) ------------------------

// function ProductMissingTable({
//   rows,
//   expandedId,
//   onToggleExpand,
// }: {
//   rows: ProductReturnRow[]
//   expandedId: string | null
//   onToggleExpand: (id: string | null) => void
// }) {
//   if (!rows.length) {
//     return <Empty title="No missing products" sub="No product-level missing data for this biller and period." />
//   }
//   return (
//     <div style={{ overflowX: 'auto' }}>
//       <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
//         <thead>
//           <tr>
//             {['Product', 'SKU', 'Missing qty', 'Orders', ''].map((h, i) => (
//               <th key={i} style={{ ...tHead, textAlign: i === 2 || i === 3 ? 'right' : 'left' }}>{h}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((r) => (
//             <Fragment key={r.productId}>
//               <tr
//                 style={{ transition: 'background 0.12s' }}
//                 onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.25)')}
//                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//               >
//                 <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{r.particulars || r.productId}</td>
//                 <td style={tCell}>{r.sku || '—'}</td>
//                 <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(r.totalQty)}</td>
//                 <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(r.deliveryCount)}</td>
//                 <td style={tCell}>
//                   {r.deliveries.length ? (
//                     <button
//                       onClick={() => onToggleExpand(expandedId === r.productId ? null : r.productId)}
//                       style={{
//                         padding: '4px 12px', borderRadius: 8, border: '1px solid #fecaca',
//                         background: '#fff', fontSize: 12, fontWeight: 600, color: '#dc2626',
//                         cursor: 'pointer',
//                       }}
//                     >{expandedId === r.productId ? 'Hide orders' : 'View orders'}</button>
//                   ) : null}
//                 </td>
//               </tr>
//               {expandedId === r.productId && (
//                 <tr>
//                   <td colSpan={5} style={{ padding: '0 14px 12px' }}>
//                     <div style={{ background: '#fef2f2', borderRadius: 8, padding: 14, border: '1px solid #fecaca' }}>
//                       <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
//                         Missing orders for this product
//                       </div>
//                       {r.deliveries.map((d) => (
//                         <div key={d.id} style={{
//                           display: 'grid', gridTemplateColumns: '1fr auto', gap: 8,
//                           fontSize: 12, color: '#374151', paddingBottom: 8,
//                           borderBottom: '1px solid #fee2e2', marginBottom: 8,
//                         }}>
//                           <div>
//                             <Link to={`/deliveries/${d.id}`} style={{ fontWeight: 600, color: '#dc2626', textDecoration: 'none' }}>
//                               {d.deliveryNo}
//                             </Link>
//                             {d.customerName ? (
//                               <span style={{ color: '#64748b', marginLeft: 8 }}>{d.customerName}</span>
//                             ) : null}
//                             {d.deliveryAt ? (
//                               <span style={{ color: '#94a3b8', marginLeft: 8 }}>{formatDeliveryDate(d.deliveryAt)}</span>
//                             ) : null}
//                           </div>
//                           <span style={{ fontWeight: 700, color: '#dc2626', whiteSpace: 'nowrap' }}>
//                             qty {formatNumber(d.qty)}{d.note ? ` · ${d.note}` : ''}
//                           </span>
//                         </div>
//                       ))}
//                     </div>
//                   </td>
//                 </tr>
//               )}
//             </Fragment>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// // -- breadcrumb for biller drill-down ---------------------------------------

// // function BillerBreadcrumb({
// //   godownName,
// //   billerName,
// //   hideAllGodowns,
// //   onAllGodowns,
// //   onGodown,
// // }: {
// //   godownName?: string
// //   billerName?: string
// //   hideAllGodowns?: boolean
// //   onAllGodowns: () => void
// //   onGodown: () => void
// // }) {
// //   const linkStyle: React.CSSProperties = {
// //     background: 'none', border: 'none', padding: 0, fontSize: 13, fontWeight: 600,
// //     color: '#059669', cursor: 'pointer', textDecoration: 'underline',
// //   }
// //   const sep = <span style={{ color: '#94a3b8', margin: '0 6px' }}>/</span>
// //   return (
// //     <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
// //       {!hideAllGodowns ? (
// //         <button type="button" onClick={onAllGodowns} style={linkStyle}>All godowns</button>
// //       ) : null}
// //       {godownName ? (
// //         <>
// //           {!hideAllGodowns ? sep : null}
// //           {billerName ? (
// //             <button type="button" onClick={onGodown} style={linkStyle}>{godownName}</button>
// //           ) : (
// //             <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{godownName}</span>
// //           )}
// //         </>
// //       ) : null}
// //       {billerName ? (
// //         <>
// //           {sep}
// //           <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{billerName}</span>
// //         </>
// //       ) : null}
// //     </div>
// //   )
// // }

// // -- inline searchable select for biller (reused from ReportFiltersBar pattern) --

// // function InlineSearchableSelect({
// //   value, onChange, options, placeholder = '— Select —',
// // }: {
// //   value: string
// //   onChange: (v: string) => void
// //   options: Array<{ value: string; label: string }>
// //   placeholder?: string
// // }) {
// //   const [open, setOpen] = React.useState(false)
// //   const [search, setSearch] = React.useState('')
// //   const ref = React.useRef<HTMLDivElement>(null)
// //   const inputRef = React.useRef<HTMLInputElement>(null)

// //   React.useEffect(() => {
// //     const handler = (e: MouseEvent) => {
// //       if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch('') }
// //     }
// //     document.addEventListener('mousedown', handler)
// //     return () => document.removeEventListener('mousedown', handler)
// //   }, [])

// //   React.useEffect(() => {
// //     if (open) setTimeout(() => inputRef.current?.focus(), 50)
// //   }, [open])

// //   const filtered = search.trim()
// //     ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
// //     : options

// //   const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder

// //   return (
// //     <div ref={ref} style={{ position: 'relative', minWidth: 220 }}>
// //       <button
// //         type="button"
// //         onClick={() => { setOpen((o) => !o); setSearch('') }}
// //         style={{
// //           height: 38, width: '100%', minWidth: 220, padding: '0 32px 0 12px',
// //           border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff',
// //           fontSize: 13, color: value ? '#0f172a' : '#94a3b8', textAlign: 'left',
// //           cursor: 'pointer', position: 'relative', fontFamily: 'inherit',
// //           boxShadow: '0 1px 2px rgba(0,0,0,0.04)', whiteSpace: 'nowrap',
// //           overflow: 'hidden', textOverflow: 'ellipsis',
// //           outline: open ? '2px solid #a7f3d0' : 'none',
// //         }}
// //       >
// //         {selectedLabel}
// //         <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
// //           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
// //         </span>
// //       </button>
// //       {open && (
// //         <div style={{
// //           position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 9999,
// //           minWidth: '100%', maxWidth: 360, background: '#fff',
// //           border: '1px solid #d1fae5', borderRadius: 10,
// //           boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
// //         }}>
// //           <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
// //             <div style={{ position: 'relative' }}>
// //               <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4.5 4.5" strokeLinecap="round" /></svg>
// //               <input
// //                 ref={inputRef}
// //                 value={search}
// //                 onChange={(e) => setSearch(e.target.value)}
// //                 placeholder="Search…"
// //                 style={{ width: '100%', height: 30, paddingLeft: 26, paddingRight: 8, border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
// //                 onKeyDown={(e) => e.key === 'Escape' && (setOpen(false), setSearch(''))}
// //               />
// //             </div>
// //           </div>
// //           <div style={{ maxHeight: 220, overflowY: 'auto' }}>
// //             {filtered.length === 0
// //               ? <div style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>No results</div>
// //               : filtered.map((o) => (
// //                 <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); setSearch('') }}
// //                   style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer', color: o.value === value ? '#059669' : '#0f172a', fontWeight: o.value === value ? 700 : 400, background: o.value === value ? '#f0fdf4' : undefined }}
// //                   onMouseEnter={(e) => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
// //                   onMouseLeave={(e) => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = '' }}
// //                 >{o.label}</div>
// //               ))
// //             }
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   )
// // }

// function InlineSearchableSelect({
//   value, onChange, options, placeholder = '— Select —',
// }: {
//   value: string
//   onChange: (v: string) => void
//   options: Array<{ value: string; label: string }>
//   placeholder?: string
// }) {
//   const [open, setOpen] = React.useState(false)
//   const [search, setSearch] = React.useState('')
//   const [dropPos, setDropPos] = React.useState({ top: 0, left: 0, width: 0 })
//   const wrapRef = React.useRef<HTMLDivElement>(null)
//   const btnRef = React.useRef<HTMLButtonElement>(null)
//   const inputRef = React.useRef<HTMLInputElement>(null)
//   const dropRef = React.useRef<HTMLDivElement>(null)

//   // Close on outside click — must check both the trigger and the portal
//   React.useEffect(() => {
//     if (!open) return
//     const handler = (e: MouseEvent) => {
//       const t = e.target as Node
//       if (wrapRef.current?.contains(t)) return
//       if (dropRef.current?.contains(t)) return
//       setOpen(false)
//       setSearch('')
//     }
//     document.addEventListener('mousedown', handler)
//     return () => document.removeEventListener('mousedown', handler)
//   }, [open])

//   // Compute and update dropdown position whenever open or on scroll/resize
//   React.useEffect(() => {
//     if (!open) return
//     const reposition = () => {
//       if (btnRef.current) {
//         const r = btnRef.current.getBoundingClientRect()
//         const DROPDOWN_W = 360
//         const clampedLeft = Math.max(8, Math.min(r.left, window.innerWidth - DROPDOWN_W - 8))
//         setDropPos({ top: r.bottom + 4, left: clampedLeft, width: Math.max(r.width, DROPDOWN_W) })
//       }
//     }
//     reposition() // set position immediately when opened
//     window.addEventListener('scroll', reposition, true)
//     window.addEventListener('resize', reposition)
//     return () => {
//       window.removeEventListener('scroll', reposition, true)
//       window.removeEventListener('resize', reposition)
//     }
//   }, [open])

//   React.useEffect(() => {
//     if (open) setTimeout(() => inputRef.current?.focus(), 50)
//   }, [open])

//   const handleToggle = () => {
//     setOpen(o => !o)
//     setSearch('')
//   }

//   const handleSelect = (val: string) => {
//     onChange(val)
//     setOpen(false)
//     setSearch('')
//   }

//   const filtered = search.trim()
//     ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
//     : options

//   const selectedLabel = options.find(o => o.value === value)?.label ?? placeholder

//   const dropdown = open ? ReactDOM.createPortal(
//     <div
//       ref={dropRef}
//       style={{
//         position: 'fixed',
//         top: dropPos.top,
//         left: dropPos.left,
//         minWidth: dropPos.width,
//         maxWidth: 360,
//         zIndex: 99999,
//         background: '#fff',
//         border: '1px solid #d1fae5',
//         borderRadius: 10,
//         boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
//         overflow: 'hidden',
//       }}
//     >
//       {/* Search box */}
//       <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
//         <div style={{ position: 'relative' }}>
//           <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}
//             width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//             <circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4.5 4.5" strokeLinecap="round" />
//           </svg>
//           <input
//             ref={inputRef}
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//             placeholder="Search…"
//             style={{
//               width: '100%', height: 30, paddingLeft: 26, paddingRight: 8,
//               border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12,
//               color: '#0f172a', background: '#f8fafc', outline: 'none',
//               boxSizing: 'border-box', fontFamily: 'inherit',
//             }}
//             onKeyDown={e => e.key === 'Escape' && (setOpen(false), setSearch(''))}
//           />
//         </div>
//       </div>
//       {/* Options */}
//       <div style={{ maxHeight: 220, overflowY: 'auto' }}>
//         {filtered.length === 0
//           ? <div style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>No results</div>
//           : filtered.map(o => (
//             <div
//               key={o.value}
//               onMouseDown={e => { e.preventDefault(); handleSelect(o.value) }}   // ← onMouseDown, not onClick
//               style={{
//                 padding: '8px 14px', fontSize: 13, cursor: 'pointer',
//                 color: o.value === value ? '#059669' : '#0f172a',
//                 fontWeight: o.value === value ? 700 : 400,
//                 background: o.value === value ? '#f0fdf4' : undefined,
//               }}
//               onMouseEnter={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
//               onMouseLeave={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = o.value === value ? '#f0fdf4' : '' }}
//             >{o.label}</div>
//           ))
//         }
//       </div>
//     </div>,
//     document.body,
//   ) : null

//   return (
//     <div ref={wrapRef} style={{ position: 'relative', minWidth: 220 }}>
//       <button
//         ref={btnRef}
//         type="button"
//         onClick={handleToggle}
//         style={{
//           height: 38, width: '100%', minWidth: 220, padding: '0 32px 0 12px',
//           border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff',
//           fontSize: 13, color: value ? '#0f172a' : '#94a3b8', textAlign: 'left',
//           cursor: 'pointer', position: 'relative', fontFamily: 'inherit',
//           boxShadow: '0 1px 2px rgba(0,0,0,0.04)', whiteSpace: 'nowrap',
//           overflow: 'hidden', textOverflow: 'ellipsis',
//           outline: open ? '2px solid #a7f3d0' : 'none',
//         }}
//       >
//         {selectedLabel}
//         <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
//           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//             <path d="m6 9 6 6 6-6" />
//           </svg>
//         </span>
//       </button>
//       {dropdown}
//     </div>
//   )
// }

// // -- main component ---------------------------------------------------------

// export function ReportsPage() {
//   const auth = useAuth()
//   const {
//     date, dateTo, godownId, site, customerName, billerUserId, productId, tab, godowns, sites, customers,
//     billers: billersRaw, products: productsRaw,
//     filterQuery, dateQuery, setFilters, lockGodownFilter,
//   } = useReportFilters()

//   // Defensive fallbacks — guard against hook not returning these
//   const billers = (billersRaw as typeof billersRaw | undefined) ?? []
//   const products = (productsRaw as typeof productsRaw | undefined) ?? []

//   const resolvedTab = (MAIN_TABS.some((t) => t.id === tab) || ISSUE_TABS.has(tab as ReportTab) ? tab : 'issues-godown') as ReportTab
//   const activeTab = resolvedTab
//   const issueSubTab = ISSUE_TABS.has(activeTab) ? activeTab : 'issues-godown'
//   const showIssueSection = ISSUE_TABS.has(activeTab) || activeTab === 'issues-godown'

//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [godownIssues, setGodownIssues] = useState<GodownIssueRow[] | null>(null)
//   const [deliveryIssues, setDeliveryIssues] = useState<IssueDeliveryRow[] | null>(null)
//   const [customerReport, setCustomerReport] = useState<CustomerIssueReport | null>(null)
//   const [customerProducts, setCustomerProducts] = useState<CustomerProductsReport | null>(null)
//   // const [stock, setStock] = useState<StockReportRow[] | null>(null)
//   const [billerReturns, setBillerReturns] = useState<BillerReturnRow[] | null>(null) // kept for selectedBillerStats
//   const [productReturns, setProductReturns] = useState<ProductReturnRow[] | null>(null)
//   const [missingOrders, setMissingOrders] = useState<IssueDeliveryRow[] | null>(null)
//   const [expandedId, setExpandedId] = useState<string | null>(null)
//   const [pwExpandedId, setPwExpandedId] = useState<string | null>(null)
//   const [showPwView, setShowPwView] = useState(false)

//   const isBillerRole = auth.status === 'authenticated' && auth.user.role === 'BILLER'
//   const selectedGodownName = godowns.find((g) => g.id === godownId)?.name
//   const selectedBillerName = useMemo(() => {
//     if (isBillerRole && auth.status === 'authenticated') {
//       return auth.user.contactName || auth.user.siteName || 'My returns'
//     }
//     return billerReturns?.find((b) => b.billerUserId === billerUserId)?.billerName || billerUserId
//   }, [isBillerRole, auth, billerReturns, billerUserId])

//   // const showBillerGodowns = false // removed drill-down flow
//   // const showBillerList = false    // removed drill-down flow
//   const showProductList = activeTab === 'issues-biller' && (Boolean(billerUserId) || isBillerRole)

//   // const billerStep: 1 | 2 | 3 = showProductList ? 3 : showBillerList ? 2 : 1

//   const selectedBillerStats = useMemo(() => {
//     const b = billerReturns?.find((row) => row.billerUserId === billerUserId)
//     if (b) return b
//     if (!missingOrders?.length) return null
//     return {
//       missingOrderCount: missingOrders.length,
//       missingQty: missingOrders.reduce((s, o) => s + o.missingQty, 0),
//       missingTotal: missingOrders.reduce((s, o) => s + (o.missingTotal || 0), 0),
//     }
//   }, [billerReturns, billerUserId, missingOrders])

//   useEffect(() => { setShowPwView(false); setPwExpandedId(null) }, [activeTab, godownId, billerUserId, customerName])

//   useEffect(() => {
//     if (!ISSUE_TABS.has(activeTab)) return
//     const token = getToken(); if (!token) return
//     if (activeTab === 'issues-customer' && !customerName.trim()) { setCustomerReport(null); setCustomerProducts(null); return }
//     setLoading(true); setError(null)

//     const loadGodown = () =>
//       apiFetch<GodownIssueRow[]>(`/reports/issues/by-godown?${dateQuery}limit=100${filterQuery}`, { token })
//         .then(setGodownIssues).catch(() => setGodownIssues([]))
//     const loadDelivery = () =>
//       apiFetch<IssueDeliveryRow[]>(`/reports/issues/by-delivery?${dateQuery}limit=100${filterQuery}`, { token })
//         .then(setDeliveryIssues).catch(() => setDeliveryIssues([]))
//     const loadCustomer = () => {
//       const cn = encodeURIComponent(customerName.trim())
//       const fq = filterQuery.replace(/&?customerName=[^&]*/g, '')
//       return Promise.all([
//         apiFetch<CustomerIssueReport>(`/reports/issues/customer?${dateQuery}customerName=${cn}${fq}`, { token })
//           .then(setCustomerReport).catch(() => setCustomerReport(null)),
//         apiFetch<CustomerProductsReport>(`/reports/issues/customer-products?${dateQuery}customerName=${cn}${fq}`, { token })
//           .then(setCustomerProducts).catch(() => setCustomerProducts(null)),
//       ]).then(() => undefined)
//     }

//     const promises: Promise<void>[] = []
//     if (activeTab === 'issues-godown' || (activeTab === 'issues-biller' && !godownId && !lockGodownFilter)) {
//       promises.push(loadGodown())
//     }
//     if (activeTab === 'issues-godown' || activeTab === 'issues-delivery') promises.push(loadDelivery())
//     if (activeTab === 'issues-customer') promises.push(loadCustomer())
//     Promise.all(promises).finally(() => setLoading(false))
//   }, [date, dateTo, dateQuery, filterQuery, activeTab, customerName, godownId, site, lockGodownFilter])

//   useEffect(() => {
//     if (activeTab !== 'issues-biller') return
//     const token = getToken(); if (!token) return

//     if (showProductList) {
//       setLoading(true); setError(null)
//       const fq = filterQuery.includes('billerUserId')
//         ? filterQuery
//         : `${filterQuery}&billerUserId=${encodeURIComponent(billerUserId)}`
//       const godownPart = godownId ? `godownId=${encodeURIComponent(godownId)}&` : ''


// const productQ =`/reports/returns/by-product?date=${date}&godownId=6a06a76afb0121a70a2c12bc&billerUserId=${encodeURIComponent(billerUserId)}&metric=missing`

// // `/reports/returns/by-product?${dateQuery}${godownId ? `godownId=${encodeURIComponent(godownId)}&` : ''}billerUserId=${encodeURIComponent(billerUserId)}&metric=missing`
//       const ordersQ = `/reports/issues/by-delivery?${dateQuery}${godownPart}${fq.replace(/^&/, '')}&limit=200`
//       Promise.all([
//         apiFetch<ProductReturnRow[]>(productQ, { token }),
//         apiFetch<IssueDeliveryRow[]>(ordersQ, { token }),
//       ])
//         .then(([prods, orders]) => {
//           setProductReturns(prods)
//           setMissingOrders(orders.filter((o) => o.missingQty > 0))
//         })
//         .catch((e: unknown) => {
//           setError(e instanceof Error ? e.message : 'Failed to load missing report')
//           setProductReturns([])
//           setMissingOrders([])
//         })
//         .finally(() => setLoading(false))
//       return
//     }

//     setBillerReturns(null)
//     setProductReturns(null)
//     setMissingOrders(null)
//   }, [activeTab, date, dateTo, dateQuery, filterQuery, godownId, billerUserId, showProductList])

//   // useEffect(() => {
//   //   if (activeTab !== 'stock') return
//   //   const token = getToken(); if (!token) return
//   //   if (auth.status !== 'authenticated' || (auth.user.role !== 'ADMIN' && auth.user.role !== 'GODOWN')) return
//   //   setLoading(true); setError(null)
//   //   const gidQ = godownId ? `?godownId=${encodeURIComponent(godownId)}` : ''
//   //   apiFetch<StockReportRow[]>(`/reports/stock${gidQ}`, { token })
//   //     .then(setStock)
//   //     .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load stock'))
//   //     .finally(() => setLoading(false))
//   // }, [activeTab, godownId, auth])

//   const onMainTab = (id: ReportTab) => {
//     if (id === 'issues-godown') {
//       setFilters({ tab: ISSUE_TABS.has(activeTab) ? activeTab : 'issues-godown' })
//       return
//     }
//     setFilters({ tab: id })
//   }

//   const pwLines = useMemo(
//     () => buildPwLines(deliveryIssues || []),
//     [deliveryIssues],
//   )

//   const customerPwLines = useMemo(
//     () => buildPwLines(customerReport?.deliveries || []),
//     [customerReport],
//   )

//   const billerPwLines = useMemo(
//     () => buildPwLines(missingOrders || []),
//     [missingOrders],
//   )

//   // -- shared table styles ------------------------------------------------

//   const tableWrap: React.CSSProperties = { overflowX: 'auto' }
//   const tableEl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 800 }

//   return (
//     // AppShell provides 20px 24px padding
//     <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 16 }}>

  
//       {/* -- FILTERS CARD -- */}
//       <ReportCard>
//         <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f0f9' }}>
//           <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Filters</div>
//         </div>
//         <div style={{ padding: '18px 20px' }}>
//           <ReportFiltersBar
//             godowns={godowns}
//             sites={sites}
//             customers={customers}
//             billers={billers}
//             products={products}
//             godownId={godownId}
//             site={site}
//             customerName={customerName}
//             billerUserId={billerUserId}
//             productId={productId}
//             onGodownChange={(id) => setFilters({
//               godownId: id,
//               billerUserId: activeTab === 'issues-biller' && !isBillerRole ? billerUserId : billerUserId,
//             })}
//             onSiteChange={(s) => setFilters({ site: s })}
//             onCustomerChange={(name) => setFilters({ customerName: name })}
//             onBillerChange={(id) => setFilters({ billerUserId: id })}
//             onProductChange={(id) => setFilters({ productId: id })}
//             showDate
//             showDateTo={showIssueSection}
//             date={date}
//             dateTo={dateTo}
//             onDateChange={(d) => setFilters({ date: d })}
//             onDateToChange={(d) => setFilters({ dateTo: d })}
//             showCustomer={activeTab === 'issues-customer'}
//             showBiller={false}
//             showProduct
//             hideGodownFilter={lockGodownFilter}
//           />
//         </div>
//       </ReportCard>

//       {/* -- MAIN TAB ROW -- */}
//       <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
//         {MAIN_TABS.map((t) => (
//           <PillTab
//             key={t.id}
//             label={t.label}
//             active={activeTab === t.id || (t.id === 'issues-godown' && ISSUE_TABS.has(activeTab))}
//             onClick={() => onMainTab(t.id)}
//           />
//         ))}
//       </div>

//       {/* -- ISSUE SUB TABS -- */}
//       {showIssueSection && (
//         <div style={{
//           display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
//           paddingLeft: 12, paddingRight: 0, paddingTop: 0, paddingBottom: 0,
//           borderLeftWidth: 2, borderLeftStyle: 'solid', borderLeftColor: '#a7f3d0',
//         }}>
//           {ISSUE_SUB_TABS.map((t) => (
//             <SubPillTab
//               key={t.id}
//               label={t.label}
//               active={issueSubTab === t.id}
//               onClick={() => setFilters({ tab: t.id })}
//             />
//           ))}
//         </div>
//       )}

//       {/* -- ERROR -- */}
//       {error && (
//         <div style={{
//           padding: '10px 16px', borderRadius: 10, background: '#fef2f2',
//           color: '#b91c1c', fontSize: 13,
//           borderWidth: 1, borderStyle: 'solid', borderColor: '#fecaca',
//         }}>{error}</div>
//       )}

//       {/* -- LOADING SPINNER -- */}
//       {loading && (
//         <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
//           <div style={{
//             width: 32, height: 32, borderRadius: '50%',
//             border: '3px solid #e2e8f0', borderTopColor: '#10b981',
//             animation: 'spin 0.7s linear infinite',
//           }} />
//           <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//         </div>
//       )}

//       {/* ----------------------------------------------
//           ISSUES — BY BILLER (direct select)
//       ---------------------------------------------- */}
//       {activeTab === 'issues-biller' && (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

//           {/* Card with title + inline biller select */}
//           <ReportCard>
//             <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
//               <div>
//                 <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing by biller</div>
//                 <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
//                   Select a biller to view their missing orders and product breakdown.
//                 </div>
//               </div>
//               {!isBillerRole && (
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
//                   <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Biller</label>
//                   <InlineSearchableSelect
//                     value={billerUserId}
//                     onChange={(id) => setFilters({ billerUserId: id })}
//                     options={[
//                       { value: '', label: '— Select a biller —' },
//                       ...billers.map((b) => ({ value: b.id, label: b.name + (b.siteName ? ` — ${b.siteName}` : '') })),
//                     ]}
//                     placeholder="— Select a biller —"
//                   />
//                   {billerUserId && (
//                     <button
//                       onClick={() => setFilters({ billerUserId: '' })}
//                       style={{
//                         padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
//                         background: '#fff', fontSize: 12, color: '#64748b', cursor: 'pointer',
//                       }}
//                     >Clear</button>
//                   )}
//                 </div>
//               )}
//             </div>

//             {/* Prompt when no biller selected */}
//             {!billerUserId && !isBillerRole && (
//               <div style={{ padding: '32px 20px', textAlign: 'center' }}>
//                 <div style={{ fontSize: 13, color: '#64748b' }}>Select a biller above to view their missing report.</div>
//               </div>
//             )}

//             {/* Stat summary row */}
//             {showProductList && (
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #f1f5f9' }}>
//                 {[
//                   { label: 'Missing orders', value: formatNumber(selectedBillerStats?.missingOrderCount ?? missingOrders?.length ?? 0), accent: '#dc2626' },
//                   { label: 'Missing quantity', value: formatNumber(selectedBillerStats?.missingQty ?? 0), accent: '#dc2626' },
//                   { label: 'Missing value', value: formatCurrency(selectedBillerStats?.missingTotal ?? 0), accent: '#d97706' },
//                 ].map(({ label, value, accent }, i) => (
//                   <div key={label} style={{
//                     padding: '16px 20px',
//                     borderRight: i < 2 ? '1px solid #f1f5f9' : undefined,
//                   }}>
//                     <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
//                     <div style={{ fontSize: 22, fontWeight: 700, color: accent, marginTop: 4 }}>{value}</div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </ReportCard>

//           {showProductList && (
//             <>
//               <ReportCard>
//                 <CardHead
//                   title="Missing orders"
//                   sub={`${selectedBillerName}${selectedGodownName ? ` — ${selectedGodownName}` : ''} — deliveries with biller-reported missing items`}
//                 />
//                 <div style={{ padding: '0 0 4px' }}>
//                   {missingOrders ? <MissingOrdersTable rows={missingOrders} /> : null}
//                 </div>
//               </ReportCard>

//               <ReportCard>
//                 <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
//                   <div>
//                     <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing by product</div>
//                     <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Products reported missing — expand to see godown, delivery, and customer details</div>
//                   </div>
//                   <div style={{ display: 'flex', gap: 6 }}>
//                     <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>Orders view</button>
//                     <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
//                   </div>
//                 </div>
//                 <div style={{ padding: '0 0 4px' }}>
//                   {!showPwView ? (
//                     productReturns ? (
//                       <ProductMissingTable rows={productReturns} expandedId={expandedId} onToggleExpand={setExpandedId} />
//                     ) : !loading ? (
//                       <Empty title="No missing products" sub="No product-level missing data for this biller." />
//                     ) : null
//                   ) : (
//                     <ProductWisePanel lines={billerPwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer />
//                   )}
//                 </div>
//               </ReportCard>
//             </>
//           )}
//         </div>
//       )}

//       {/* ----------------------------------------------
//           ISSUES ? BY GODOWN
//       ---------------------------------------------- */}
//       {activeTab === 'issues-godown' && (
//         <ReportCard>
//           <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
//             <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing &amp; damage by godown</div>
//             <div style={{ display: 'flex', gap: 6 }}>
//               <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>By godown</button>
//               <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
//             </div>
//           </div>
//           {!showPwView ? (
//             godownIssues?.length ? (
//               <div style={tableWrap}>
//                 <table style={{ ...tableEl, minWidth: 980 }}>
//                   <thead>
//                     <tr>
//                       {['Godown','Deliveries','With issues','Missing qty','Missing value','Damage qty','Damage value','Tags missing',''].map((h, i) => (
//                         <th key={i} style={{ ...tHead, textAlign: i >= 1 && i <= 7 ? 'right' : 'left' }}>{h}</th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {godownIssues.map((g) => (
//                       <tr key={g.godownId} style={{ transition: 'background 0.12s' }}
//                         onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.4)')}
//                         onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//                       >
//                         <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{g.godownName || g.godownId}</td>
//                         <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(g.totalDeliveries)}</td>
//                         <td style={{ ...tCell, textAlign: 'right', fontWeight: g.issueDeliveryCount > 0 ? 700 : undefined, color: g.issueDeliveryCount > 0 ? '#dc2626' : undefined }}>{formatNumber(g.issueDeliveryCount)}</td>
//                         <td style={{ ...tCell, textAlign: 'right', fontWeight: g.missingQty > 0 ? 700 : undefined, color: g.missingQty > 0 ? '#dc2626' : undefined }}>{formatNumber(g.missingQty)}</td>
//                         <td style={{ ...tCell, textAlign: 'right', color: g.missingTotal > 0 ? '#dc2626' : undefined }}>{g.missingTotal > 0 ? formatCurrency(g.missingTotal) : '—'}</td>
//                         <td style={{ ...tCell, textAlign: 'right', fontWeight: g.damageQty > 0 ? 700 : undefined, color: g.damageQty > 0 ? '#d97706' : undefined }}>{formatNumber(g.damageQty)}</td>
//                         <td style={{ ...tCell, textAlign: 'right', color: g.damageTotal > 0 ? '#d97706' : undefined }}>{g.damageTotal > 0 ? formatCurrency(g.damageTotal) : '—'}</td>
//                         <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(g.missingTagCount)}</td>
//                         <td style={tCell}>
//                           <button
//                             onClick={() => setFilters({ godownId: g.godownId, tab: 'issues-delivery' })}
//                             style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#059669', cursor: 'pointer', whiteSpace: 'nowrap' }}
//                           >View deliveries</button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             ) : !loading ? (
//               <div style={{ padding: '0 0 4px' }}>
//                 <Empty title="No godown data" sub="No deliveries in the selected period." />
//               </div>
//             ) : null
//           ) : (
//             <div style={{ padding: '0 0 4px' }}>
//               <ProductWisePanel lines={pwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer />
//             </div>
//           )}
//         </ReportCard>
//       )}

//       {/* ----------------------------------------------
//           ISSUES ? BY DELIVERY
//       ---------------------------------------------- */}
//       {activeTab === 'issues-delivery' && (
//         <ReportCard>
//           <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
//             <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing &amp; damage by delivery</div>
//             <div style={{ display: 'flex', gap: 6 }}>
//               <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>By delivery</button>
//               <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
//             </div>
//           </div>
//           <div style={{ padding: '0 0 4px' }}>
//             {!showPwView ? (
//               deliveryIssues ? (
//                 <IssueDeliveryTable rows={deliveryIssues} expandedId={expandedId} onToggleExpand={setExpandedId} />
//               ) : !loading ? (
//                 <Empty title="No issue deliveries" sub="No missing or damage for this period and filters." />
//               ) : null
//             ) : (
//               <ProductWisePanel lines={pwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer />
//             )}
//           </div>
//         </ReportCard>
//       )}

//       {/* ----------------------------------------------
//           ISSUES ? BY CUSTOMER
//       ---------------------------------------------- */}
//       {activeTab === 'issues-customer' && (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
//           {!customerName.trim() ? (
//             <ReportCard>
//               <div style={{ padding: '20px' }}>
//                 <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
//                   Select a customer above to load their delivery and issue summary.
//                 </p>
//               </div>
//             </ReportCard>
//           ) : null}

//           {customerReport && (
//             <>
//               {/* summary metrics */}
//               <ReportCard>
//                 <CardHead title={customerReport.customerName} />
//                 <div style={{
//                   display: 'grid',
//                   gridTemplateColumns: 'repeat(3, 1fr)',
//                   gap: 0,
//                 }}>
//                   {[
//                     { label: 'Deliveries', val: customerReport.summary.deliveryCount },
//                     { label: 'With issues', val: customerReport.summary.issueDeliveryCount },
//                     { label: 'Missing qty', val: customerReport.summary.missingQty, accent: '#dc2626' },
//                     { label: 'Damage qty', val: customerReport.summary.damageQty, accent: '#d97706' },
//                     { label: 'Tags missing', val: customerReport.summary.missingTagCount, accent: '#dc2626' },
//                     { label: 'Dmg/lost tags', val: customerReport.summary.damagedTagCount + customerReport.summary.lostTagCount, accent: '#d97706' },
//                   ].map(({ label, val, accent }, i) => (
//                     <div key={label} style={{
//                       padding: '14px 18px',
//                       borderBottom: i < 3 ? '1px solid #f1f5f9' : undefined,
//                       borderRight: (i + 1) % 3 !== 0 ? '1px solid #f1f5f9' : undefined,
//                     }}>
//                       <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{label}</div>
//                       <div style={{ fontSize: 18, fontWeight: 700, color: accent || '#0f172a', marginTop: 4 }}>
//                         {formatNumber(val)}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//                 {(customerReport.summary.missingTotal > 0 || customerReport.summary.damageTotal > 0) && (
//                   <div style={{ display: 'flex', gap: 24, padding: '12px 18px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
//                     {customerReport.summary.missingTotal > 0 && (
//                       <div>
//                         <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Missing value </span>
//                         <span style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>{formatCurrency(customerReport.summary.missingTotal)}</span>
//                       </div>
//                     )}
//                     {customerReport.summary.damageTotal > 0 && (
//                       <div>
//                         <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Damage value </span>
//                         <span style={{ fontSize: 14, fontWeight: 700, color: '#d97706' }}>{formatCurrency(customerReport.summary.damageTotal)}</span>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </ReportCard>

//               {/* product breakdown */}
//               {customerProducts && (customerProducts.missingByProduct.length > 0 || customerProducts.damagedByProduct.length > 0) && (
//                 <ReportCard>
//                   <CardHead title="Product breakdown" sub="Missing and damaged products aggregated across all deliveries for this customer" />
//                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
//                     {/* Missing products */}
//                     <div style={{ borderRight: '1px solid #f1f5f9' }}>
//                       <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#fef2f2' }}>
//                         <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
//                           Missing products ({customerProducts.missingByProduct.length})
//                         </span>
//                       </div>
//                       {customerProducts.missingByProduct.length ? (
//                         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                           <thead>
//                             <tr>
//                               <th style={{ ...tHead, background: '#fff5f5' }}>Product</th>
//                               <th style={{ ...tHead, textAlign: 'right', background: '#fff5f5' }}>Missing qty</th>
//                               <th style={{ ...tHead, textAlign: 'right', background: '#fff5f5' }}>Orders</th>
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {customerProducts.missingByProduct.map((p) => (
//                               <tr key={p.productId}
//                                 onMouseEnter={(e) => (e.currentTarget.style.background = '#fff5f5')}
//                                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//                               >
//                                 <td style={{ ...tCell, fontWeight: 500 }}>{p.particulars || p.sku || p.productId}</td>
//                                 <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(p.totalQty)}</td>
//                                 <td style={{ ...tCell, textAlign: 'right', color: '#64748b' }}>{formatNumber(p.deliveryCount)}</td>
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       ) : (
//                         <div style={{ padding: '16px', fontSize: 12, color: '#94a3b8' }}>No missing products.</div>
//                       )}
//                     </div>
//                     {/* Damaged products */}
//                     <div>
//                       <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#fffbeb' }}>
//                         <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
//                           Damaged products ({customerProducts.damagedByProduct.length})
//                         </span>
//                       </div>
//                       {customerProducts.damagedByProduct.length ? (
//                         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                           <thead>
//                             <tr>
//                               <th style={{ ...tHead, background: '#fffdf0' }}>Product</th>
//                               <th style={{ ...tHead, textAlign: 'right', background: '#fffdf0' }}>Damaged qty</th>
//                               <th style={{ ...tHead, textAlign: 'right', background: '#fffdf0' }}>Orders</th>
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {customerProducts.damagedByProduct.map((p) => (
//                               <tr key={p.productId}
//                                 onMouseEnter={(e) => (e.currentTarget.style.background = '#fffdf0')}
//                                 onMouseLeave={(e) => (e.currentTarget.style.background = '')}
//                               >
//                                 <td style={{ ...tCell, fontWeight: 500 }}>{p.particulars || p.sku || p.productId}</td>
//                                 <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#d97706' }}>{formatNumber(p.totalQty)}</td>
//                                 <td style={{ ...tCell, textAlign: 'right', color: '#64748b' }}>{formatNumber(p.deliveryCount)}</td>
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       ) : (
//                         <div style={{ padding: '16px', fontSize: 12, color: '#94a3b8' }}>No damaged products.</div>
//                       )}
//                     </div>
//                   </div>
//                 </ReportCard>
//               )}

//               {/* deliveries table */}
//               <ReportCard>
//                 <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
//                   <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Deliveries (date-wise)</div>
//                   <div style={{ display: 'flex', gap: 6 }}>
//                     <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>By delivery</button>
//                     <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
//                   </div>
//                 </div>
//                 {!showPwView ? (
//                   <IssueDeliveryTable rows={customerReport.deliveries} expandedId={expandedId} onToggleExpand={setExpandedId} />
//                 ) : (
//                   <div style={{ padding: '0 0 4px' }}>
//                     <ProductWisePanel lines={customerPwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer={false} />
//                   </div>
//                 )}
//               </ReportCard>
//             </>
//           )}

//           {customerName.trim() && !loading && !customerReport && (
//             <Empty title="No data" sub="No deliveries for this customer in the selected period." />
//           )}
//         </div>
//       )}


//     </div>
//   )
// }

import React, { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReportFiltersBar } from '../components/reports/ReportFiltersBar'
import { formatNumber } from '../lib/format'
import { Badge } from '../components/ui/Badge'
// import { StatCard } from '../components/ui/StatCard'
import { apiFetch } from '../lib/api'
import { getToken, useAuth } from '../auth/store'
import { useReportFilters } from '../hooks/useReportFilters'
// At the top of the file, add this import:
import ReactDOM from 'react-dom'
import type {
  BillerReturnRow,
  CustomerIssueReport,
  CustomerProductsReport,
  GodownIssueRow,
  IssueDeliveryRow,
  ProductReturnRow,
  ReportTab,
} from '../types/reports'

// -- constants --------------------------------------------------------------

const ISSUE_SUB_TABS: { id: ReportTab; label: string }[] = [
  { id: 'issues-godown', label: 'By godown' },
  { id: 'issues-biller', label: 'Missing by biller' },
  { id: 'issues-delivery', label: 'By delivery' },
  { id: 'issues-customer', label: 'By customer' },
]

const ISSUE_TABS = new Set<ReportTab>(['issues-godown', 'issues-biller', 'issues-delivery', 'issues-customer'])

// -- helpers ----------------------------------------------------------------

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function badgeVariant(status: string) {
  if (status === 'PROCESSED' || status === 'UPCOMING') return 'green'
  if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return 'green'
  if (status === 'PACKED') return 'slate'
  if (status === 'RETURN_PICKUP') return 'amber'
  if (status === 'COMPLETED') return 'slate'
  return 'amber'
}

function formatDeliveryDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// -- shared inline table styles ---------------------------------------------

const tHead: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 11,
  fontWeight: 700,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  background: '#f8fafc',
  borderBottom: '1px solid #f1f5f9',
}

const tCell: React.CSSProperties = {
  padding: '13px 14px',
  fontSize: 13,
  color: '#374151',
  borderBottom: '1px solid #f1f5f9',
  verticalAlign: 'middle',
}

// -- reusable card ----------------------------------------------------------

function ReportCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    // overflow must NOT be 'hidden' — SearchableSelect dropdowns need to escape the card boundary
    <div style={{
      background: '#fff',
      border: '1px solid #e8eaf0',
      borderRadius: 14,
      ...style,
    }}>
      {children}
    </div>
  )
}

function CardHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// -- pill tab button --------------------------------------------------------

// function PillTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
//   return (
//     <button
//       onClick={onClick}
//       style={{
//         padding: '7px 16px',
//         borderRadius: 20,
//         fontSize: 13,
//         fontWeight: active ? 700 : 500,
//         border: active ? 'none' : '1px solid #e2e8f0',
//         background: active ? '#059669' : '#fff',
//         color: active ? '#fff' : '#64748b',
//         cursor: 'pointer',
//         transition: 'all 0.15s',
//         whiteSpace: 'nowrap',
//       }}
//       onMouseEnter={(e) => {
//         if (!active) {
//           const el = e.currentTarget as HTMLElement
//           el.style.background = '#ecfdf5'
//           el.style.color = '#059669'
//           el.style.borderColor = '#a7f3d0'
//         }
//       }}
//       onMouseLeave={(e) => {
//         if (!active) {
//           const el = e.currentTarget as HTMLElement
//           el.style.background = '#fff'
//           el.style.color = '#64748b'
//           el.style.borderColor = '#e2e8f0'
//         }
//       }}
//     >
//       {label}
//     </button>
//   )
// }

// -- sub-pill tab (smaller, for issue sub-tabs) -----------------------------

function SubPillTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 13px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        border: active ? 'none' : '1px solid #e2e8f0',
        background: active ? '#10b981' : '#fff',
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
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.background = '#fff'
          el.style.color = '#64748b'
        }
      }}
    >
      {label}
    </button>
  )
}

// -- empty state ------------------------------------------------------------

function Empty({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ padding: '40px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{title}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

// -- product lines expandable panel ----------------------------------------

function ProductLinesPanel({ row }: { row: IssueDeliveryRow }) {
  if (!row.productMissing.length && !row.productDamaged.length) return null
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
      background: '#f8fafc', borderRadius: 8, padding: 16,
    }}>
      {[
        { label: 'Missing products', items: row.productMissing },
        { label: 'Damaged products', items: row.productDamaged },
      ].map(({ label, items }) => (
        <div key={label}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{label}</div>
          {items.length ? items.map((p) => (
            <div key={p.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', paddingBottom: 6 }}>
              <span>{p.particulars || p.sku || p.productId}</span>
              <span style={{ fontWeight: 600 }}>qty {p.qty}</span>
            </div>
          )) : <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>None reported.</p>}
        </div>
      ))}
    </div>
  )
}


// -- product-wise panel: aggregated product list with godown/biller/delivery/customer ──

type PwLine = {
  productId: string
  particulars?: string
  sku?: string
  missingQty: number
  damageQty: number
  rows: Array<{
    deliveryId: string
    deliveryNo: string
    customerName: string
    siteName?: string
    godownName?: string
    deliveryAt: string
    qty: number
    type: 'missing' | 'damage'
  }>
}

function buildPwLines(deliveries: IssueDeliveryRow[]): PwLine[] {
  const map = new Map<string, PwLine>()
  const add = (
    p: { productId: string; particulars?: string; sku?: string; qty: number },
    d: IssueDeliveryRow,
    type: 'missing' | 'damage',
  ) => {
    if (!map.has(p.productId)) {
      map.set(p.productId, { productId: p.productId, particulars: p.particulars, sku: p.sku, missingQty: 0, damageQty: 0, rows: [] })
    }
    const e = map.get(p.productId)!
    if (type === 'missing') e.missingQty += p.qty; else e.damageQty += p.qty
    e.rows.push({ deliveryId: d.id, deliveryNo: d.deliveryNo, customerName: d.customerName, siteName: d.siteName, godownName: d.godownName, deliveryAt: d.deliveryAt, qty: p.qty, type })
  }
  for (const d of deliveries) {
    for (const p of d.productMissing) add(p, d, 'missing')
    for (const p of d.productDamaged) add(p, d, 'damage')
  }
  return Array.from(map.values()).sort((a, b) => (b.missingQty + b.damageQty) - (a.missingQty + a.damageQty))
}

function ProductWisePanel({
  lines, expandedId, onToggle,
  showGodown = true, showCustomer = true,
}: {
  lines: PwLine[]
  expandedId: string | null
  onToggle: (id: string | null) => void
  showGodown?: boolean
  showCustomer?: boolean
}) {
  if (!lines.length) return <Empty title="No product issues" sub="No missing or damaged products for the selected filters." />
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
        <thead>
          <tr>
            <th style={tHead}>Product</th>
            <th style={tHead}>SKU</th>
            <th style={{ ...tHead, textAlign: 'right', color: '#dc2626' }}>Missing qty</th>
            <th style={{ ...tHead, textAlign: 'right', color: '#d97706' }}>Damage qty</th>
            <th style={{ ...tHead, textAlign: 'right' }}>Deliveries</th>
            <th style={tHead}></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((p) => (
            <Fragment key={p.productId}>
              <tr
                style={{ transition: 'background 0.12s', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{p.particulars || p.productId}</td>
                <td style={{ ...tCell, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{p.sku || '—'}</td>
                <td style={{ ...tCell, textAlign: 'right', fontWeight: p.missingQty > 0 ? 700 : undefined, color: p.missingQty > 0 ? '#dc2626' : '#94a3b8' }}>{formatNumber(p.missingQty)}</td>
                <td style={{ ...tCell, textAlign: 'right', fontWeight: p.damageQty > 0 ? 700 : undefined, color: p.damageQty > 0 ? '#d97706' : '#94a3b8' }}>{formatNumber(p.damageQty)}</td>
                <td style={{ ...tCell, textAlign: 'right' }}>{p.rows.length}</td>
                <td style={tCell}>
                  <button
                    onClick={() => onToggle(expandedId === p.productId ? null : p.productId)}
                    style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', fontSize: 12, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}
                  >{expandedId === p.productId ? 'Hide' : 'View details'}</button>
                </td>
              </tr>
              {expandedId === p.productId && (
                <tr>
                  <td colSpan={6} style={{ padding: '0 14px 14px' }}>
                    <div style={{ background: '#fef9f9', border: '1px solid #fecaca', borderRadius: 10, padding: 14, marginTop: 2 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                        Delivery breakdown — {p.particulars || p.productId}
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Delivery</th>
                            <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Date</th>
                            {showCustomer && <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Customer</th>}
                            {showCustomer && <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Site</th>}
                            {showGodown && <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Godown</th>}
                            <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px', textAlign: 'right' }}>Qty</th>
                            <th style={{ ...tHead, background: '#fff5f5', padding: '7px 10px' }}>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.rows.map((r, idx) => (
                            <tr key={idx}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#fff5f5')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                            >
                              <td style={{ ...tCell, padding: '8px 10px' }}>
                                <Link to={`/deliveries/${r.deliveryId}`}
                                  style={{ fontWeight: 600, color: '#059669', textDecoration: 'none', fontSize: 12 }}
                                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
                                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
                                >{r.deliveryNo}</Link>
                              </td>
                              <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDeliveryDate(r.deliveryAt)}</td>
                              {showCustomer && <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.customerName}</td>}
                              {showCustomer && <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.siteName || '—'}</td>}
                              {showGodown && <td style={{ ...tCell, padding: '8px 10px', fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.godownName || '—'}</td>}
                              <td style={{ ...tCell, padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: r.type === 'missing' ? '#dc2626' : '#d97706', fontSize: 13 }}>{formatNumber(r.qty)}</td>
                              <td style={{ ...tCell, padding: '8px 10px' }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: r.type === 'missing' ? '#fef2f2' : '#fffbeb', color: r.type === 'missing' ? '#dc2626' : '#d97706' }}>
                                  {r.type === 'missing' ? 'Missing' : 'Damaged'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// -- issue delivery table ---------------------------------------------------

function IssueDeliveryTable({
  rows, expandedId, onToggleExpand,
}: {
  rows: IssueDeliveryRow[]
  expandedId: string | null
  onToggleExpand: (id: string | null) => void
}) {
  if (!rows.length) return <Empty title="No deliveries" sub="No deliveries match the selected filters." />
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
        <thead>
          <tr>
            {['Delivery','Date','Customer','Site','Godown','Status','Missing qty','Damage qty','Tags missing',''].map((h, i) => (
              <th key={i} style={{ ...tHead, textAlign: i >= 6 && i <= 8 ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <Fragment key={m.id}>
              <tr
                style={{ transition: 'background 0.12s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.4)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                <td style={tCell}>
                  <Link to={`/deliveries/${m.id}`} style={{ fontWeight: 600, color: '#059669', textDecoration: 'none' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
                  >{m.deliveryNo}</Link>
                </td>
                <td style={{ ...tCell, whiteSpace: 'nowrap' }}>{formatDeliveryDate(m.deliveryAt)}</td>
                <td style={{ ...tCell, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.customerName}</td>
                <td style={{ ...tCell, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.siteName || '—'}</td>
                <td style={{ ...tCell, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.godownName || '—'}</td>
                <td style={tCell}><Badge variant={badgeVariant(m.status)}>{m.status}</Badge></td>
                <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.missingQty)}</td>
                <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.damageQty)}</td>
                <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.missingTagCount ?? m.missingCount)}</td>
                <td style={{ ...tCell }}>
                  {(m.productMissing.length || m.productDamaged.length) ? (
                    <button
                      onClick={() => onToggleExpand(expandedId === m.id ? null : m.id)}
                      style={{
                        padding: '4px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                        background: '#fff', fontSize: 12, fontWeight: 600, color: '#059669',
                        cursor: 'pointer',
                      }}
                    >{expandedId === m.id ? 'Hide' : 'Products'}</button>
                  ) : null}
                </td>
              </tr>
              {expandedId === m.id && (
                <tr>
                  <td colSpan={10} style={{ padding: '0 14px 12px' }}>
                    <ProductLinesPanel row={m} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// -- missing report step indicator ------------------------------------------

// function MissingStepper({ step, labels }: { step: 1 | 2 | 3; labels: [string, string, string] }) {
// ...
// }

// -- missing orders table (per biller) --------------------------------------

function MissingOrdersTable({ rows }: { rows: IssueDeliveryRow[] }) {
  if (!rows.length) {
    return <Empty title="No missing orders" sub="This biller has no orders with missing items in the selected period." />
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
        <thead>
          <tr>
            {['Order', 'Date', 'Customer', 'Site', 'Status', 'Missing qty', 'Value (?)', 'Products'].map((h, i) => (
              <th key={h} style={{ ...tHead, textAlign: i >= 5 && i <= 6 ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id} style={{ transition: 'background 0.12s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.35)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            >
              <td style={tCell}>
                <Link to={`/deliveries/${m.id}`} style={{ fontWeight: 600, color: '#dc2626', textDecoration: 'none' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
                >{m.deliveryNo}</Link>
              </td>
              <td style={{ ...tCell, whiteSpace: 'nowrap' }}>{formatDeliveryDate(m.deliveryAt)}</td>
              <td style={{ ...tCell, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.customerName}</td>
              <td style={{ ...tCell, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.siteName || '—'}</td>
              <td style={tCell}><Badge variant={badgeVariant(m.status)}>{m.status}</Badge></td>
              <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(m.missingQty)}</td>
              <td style={{ ...tCell, textAlign: 'right' }}>{m.missingTotal != null ? formatCurrency(m.missingTotal) : '—'}</td>
              <td style={{ ...tCell, fontSize: 12, color: '#64748b', maxWidth: 180 }}>
                {m.productMissing.slice(0, 2).map((p) => p.particulars || p.sku).join(', ')}
                {m.productMissing.length > 2 ? ` +${m.productMissing.length - 2}` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// -- product missing table (per biller, with orders) ------------------------

function ProductMissingTable({
  rows,
  expandedId,
  onToggleExpand,
}: {
  rows: ProductReturnRow[]
  expandedId: string | null
  onToggleExpand: (id: string | null) => void
}) {
  if (!rows.length) {
    return <Empty title="No missing products" sub="No product-level missing data for this biller and period." />
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
        <thead>
          <tr>
            {['Product', 'SKU', 'Missing qty', 'Orders', ''].map((h, i) => (
              <th key={i} style={{ ...tHead, textAlign: i === 2 || i === 3 ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Fragment key={r.productId}>
              <tr
                style={{ transition: 'background 0.12s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{r.particulars || r.productId}</td>
                <td style={tCell}>{r.sku || '—'}</td>
                <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(r.totalQty)}</td>
                <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(r.deliveryCount)}</td>
                <td style={tCell}>
                  {r.deliveries.length ? (
                    <button
                      onClick={() => onToggleExpand(expandedId === r.productId ? null : r.productId)}
                      style={{
                        padding: '4px 12px', borderRadius: 8, border: '1px solid #fecaca',
                        background: '#fff', fontSize: 12, fontWeight: 600, color: '#dc2626',
                        cursor: 'pointer',
                      }}
                    >{expandedId === r.productId ? 'Hide orders' : 'View orders'}</button>
                  ) : null}
                </td>
              </tr>
              {expandedId === r.productId && (
                <tr>
                  <td colSpan={5} style={{ padding: '0 14px 12px' }}>
                    <div style={{ background: '#fef2f2', borderRadius: 8, padding: 14, border: '1px solid #fecaca' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                        Missing orders for this product
                      </div>
                      {r.deliveries.map((d) => (
                        <div key={d.id} style={{
                          display: 'grid', gridTemplateColumns: '1fr auto', gap: 8,
                          fontSize: 12, color: '#374151', paddingBottom: 8,
                          borderBottom: '1px solid #fee2e2', marginBottom: 8,
                        }}>
                          <div>
                            <Link to={`/deliveries/${d.id}`} style={{ fontWeight: 600, color: '#dc2626', textDecoration: 'none' }}>
                              {d.deliveryNo}
                            </Link>
                            {d.customerName ? (
                              <span style={{ color: '#64748b', marginLeft: 8 }}>{d.customerName}</span>
                            ) : null}
                            {d.deliveryAt ? (
                              <span style={{ color: '#94a3b8', marginLeft: 8 }}>{formatDeliveryDate(d.deliveryAt)}</span>
                            ) : null}
                          </div>
                          <span style={{ fontWeight: 700, color: '#dc2626', whiteSpace: 'nowrap' }}>
                            qty {formatNumber(d.qty)}{d.note ? ` · ${d.note}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// -- inline searchable select for biller ------------------------------------

function InlineSearchableSelect({
  value, onChange, options, placeholder = '— Select —',
}: {
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [dropPos, setDropPos] = React.useState({ top: 0, left: 0, width: 0 })
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const btnRef = React.useRef<HTMLButtonElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dropRef = React.useRef<HTMLDivElement>(null)

  // Close on outside click — must check both the trigger and the portal
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (wrapRef.current?.contains(t)) return
      if (dropRef.current?.contains(t)) return
      setOpen(false)
      setSearch('')
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Compute and update dropdown position whenever open or on scroll/resize
  React.useEffect(() => {
    if (!open) return
    const reposition = () => {
      if (btnRef.current) {
        const r = btnRef.current.getBoundingClientRect()
        const DROPDOWN_W = 360
        const clampedLeft = Math.max(8, Math.min(r.left, window.innerWidth - DROPDOWN_W - 8))
        setDropPos({ top: r.bottom + 4, left: clampedLeft, width: Math.max(r.width, DROPDOWN_W) })
      }
    }
    reposition() // set position immediately when opened
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [open])

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const handleToggle = () => {
    setOpen(o => !o)
    setSearch('')
  }

  const handleSelect = (val: string) => {
    onChange(val)
    setOpen(false)
    setSearch('')
  }

  const filtered = search.trim()
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  const selectedLabel = options.find(o => o.value === value)?.label ?? placeholder

  const dropdown = open ? ReactDOM.createPortal(
    <div
      ref={dropRef}
      style={{
        position: 'fixed',
        top: dropPos.top,
        left: dropPos.left,
        minWidth: dropPos.width,
        maxWidth: 360,
        zIndex: 99999,
        background: '#fff',
        border: '1px solid #d1fae5',
        borderRadius: 10,
        boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
        overflow: 'hidden',
      }}
    >
      {/* Search box */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4.5 4.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            style={{
              width: '100%', height: 30, paddingLeft: 26, paddingRight: 8,
              border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12,
              color: '#0f172a', background: '#f8fafc', outline: 'none',
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
            onKeyDown={e => e.key === 'Escape' && (setOpen(false), setSearch(''))}
          />
        </div>
      </div>
      {/* Options */}
      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
        {filtered.length === 0
          ? <div style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>No results</div>
          : filtered.map(o => (
            <div
              key={o.value}
              onMouseDown={e => { e.preventDefault(); handleSelect(o.value) }}
              style={{
                padding: '8px 14px', fontSize: 13, cursor: 'pointer',
                color: o.value === value ? '#059669' : '#0f172a',
                fontWeight: o.value === value ? 700 : 400,
                background: o.value === value ? '#f0fdf4' : undefined,
              }}
              onMouseEnter={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
              onMouseLeave={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = o.value === value ? '#f0fdf4' : '' }}
            >{o.label}</div>
          ))
        }
      </div>
    </div>,
    document.body,
  ) : null

  return (
    <div ref={wrapRef} style={{ position: 'relative', minWidth: 220 }}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        style={{
          height: 38, width: '100%', minWidth: 220, padding: '0 32px 0 12px',
          border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff',
          fontSize: 13, color: value ? '#0f172a' : '#94a3b8', textAlign: 'left',
          cursor: 'pointer', position: 'relative', fontFamily: 'inherit',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)', whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
          outline: open ? '2px solid #a7f3d0' : 'none',
        }}
      >
        {selectedLabel}
        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      {dropdown}
    </div>
  )
}

// -- main component ---------------------------------------------------------

export function ReportsPage() {
  const auth = useAuth()
  const {
    date, dateTo, godownId, site, customerName, billerUserId, productId, tab, godowns, sites, customers,
    billers: billersRaw, products: productsRaw,
    filterQuery, dateQuery, setFilters, lockGodownFilter,
  } = useReportFilters()

  // Defensive fallbacks — guard against hook not returning these
  const billers = (billersRaw as typeof billersRaw | undefined) ?? []
  const products = (productsRaw as typeof productsRaw | undefined) ?? []

  const resolvedTab = (ISSUE_TABS.has(tab as ReportTab) ? tab : 'issues-godown') as ReportTab
  const activeTab = resolvedTab
  const issueSubTab = ISSUE_TABS.has(activeTab) ? activeTab : 'issues-godown'
  const showIssueSection = ISSUE_TABS.has(activeTab) || activeTab === 'issues-godown'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [godownIssues, setGodownIssues] = useState<GodownIssueRow[] | null>(null)
  const [deliveryIssues, setDeliveryIssues] = useState<IssueDeliveryRow[] | null>(null)
  const [customerReport, setCustomerReport] = useState<CustomerIssueReport | null>(null)
  const [customerProducts, setCustomerProducts] = useState<CustomerProductsReport | null>(null)
  // const [stock, setStock] = useState<StockReportRow[] | null>(null)
  const [billerReturns, setBillerReturns] = useState<BillerReturnRow[] | null>(null) // kept for selectedBillerStats
  const [productReturns, setProductReturns] = useState<ProductReturnRow[] | null>(null)
  const [missingOrders, setMissingOrders] = useState<IssueDeliveryRow[] | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pwExpandedId, setPwExpandedId] = useState<string | null>(null)
  const [showPwView, setShowPwView] = useState(false)

  const isBillerRole = auth.status === 'authenticated' && auth.user.role === 'BILLER'
  const selectedGodownName = godowns.find((g) => g.id === godownId)?.name
  const selectedBillerName = useMemo(() => {
    if (isBillerRole && auth.status === 'authenticated') {
      return auth.user.contactName || auth.user.siteName || 'My returns'
    }
    return billerReturns?.find((b) => b.billerUserId === billerUserId)?.billerName || billerUserId
  }, [isBillerRole, auth, billerReturns, billerUserId])

  // const showBillerGodowns = false // removed drill-down flow
  // const showBillerList = false    // removed drill-down flow
  const showProductList = activeTab === 'issues-biller' && (Boolean(billerUserId) || isBillerRole)

  // const billerStep: 1 | 2 | 3 = showProductList ? 3 : showBillerList ? 2 : 1

  const selectedBillerStats = useMemo(() => {
    const b = billerReturns?.find((row) => row.billerUserId === billerUserId)
    if (b) return b
    if (!missingOrders?.length) return null
    return {
      missingOrderCount: missingOrders.length,
      missingQty: missingOrders.reduce((s, o) => s + o.missingQty, 0),
      missingTotal: missingOrders.reduce((s, o) => s + (o.missingTotal || 0), 0),
    }
  }, [billerReturns, billerUserId, missingOrders])

  useEffect(() => { setShowPwView(false); setPwExpandedId(null) }, [activeTab, godownId, billerUserId, customerName])

  useEffect(() => {
    if (!ISSUE_TABS.has(activeTab)) return
    const token = getToken(); if (!token) return
    if (activeTab === 'issues-customer' && !customerName.trim()) { setCustomerReport(null); setCustomerProducts(null); return }
    setLoading(true); setError(null)

    const loadGodown = () =>
      apiFetch<GodownIssueRow[]>(`/reports/issues/by-godown?${dateQuery}limit=100${filterQuery}`, { token })
        .then(setGodownIssues).catch(() => setGodownIssues([]))
    const loadDelivery = () =>
      apiFetch<IssueDeliveryRow[]>(`/reports/issues/by-delivery?${dateQuery}limit=100${filterQuery}`, { token })
        .then(setDeliveryIssues).catch(() => setDeliveryIssues([]))
    const loadCustomer = () => {
      const cn = encodeURIComponent(customerName.trim())
      const fq = filterQuery.replace(/&?customerName=[^&]*/g, '')
      return Promise.all([
        apiFetch<CustomerIssueReport>(`/reports/issues/customer?${dateQuery}customerName=${cn}${fq}`, { token })
          .then(setCustomerReport).catch(() => setCustomerReport(null)),
        apiFetch<CustomerProductsReport>(`/reports/issues/customer-products?${dateQuery}customerName=${cn}${fq}`, { token })
          .then(setCustomerProducts).catch(() => setCustomerProducts(null)),
      ]).then(() => undefined)
    }

    const promises: Promise<void>[] = []
    if (activeTab === 'issues-godown' || (activeTab === 'issues-biller' && !godownId && !lockGodownFilter)) {
      promises.push(loadGodown())
    }
    if (activeTab === 'issues-godown' || activeTab === 'issues-delivery') promises.push(loadDelivery())
    if (activeTab === 'issues-customer') promises.push(loadCustomer())
    Promise.all(promises).finally(() => setLoading(false))
  }, [date, dateTo, dateQuery, filterQuery, activeTab, customerName, godownId, site, lockGodownFilter])

  useEffect(() => {
    if (activeTab !== 'issues-biller') return
    const token = getToken(); if (!token) return

    if (showProductList) {
      setLoading(true); setError(null)
      const fq = filterQuery.includes('billerUserId')
        ? filterQuery
        : `${filterQuery}&billerUserId=${encodeURIComponent(billerUserId)}`
      const godownPart = godownId ? `godownId=${encodeURIComponent(godownId)}&` : ''

const productQ = `/reports/returns/by-product?${dateQuery}${godownId ? `godownId=${encodeURIComponent(godownId)}&` : ''}billerUserId=${encodeURIComponent(billerUserId)}&metric=missing`
      const ordersQ = `/reports/issues/by-delivery?${dateQuery}${godownPart}${fq.replace(/^&/, '')}&limit=200`
      Promise.all([
        apiFetch<ProductReturnRow[]>(productQ, { token }),
        apiFetch<IssueDeliveryRow[]>(ordersQ, { token }),
      ])
        .then(([prods, orders]) => {
          setProductReturns(prods)
          setMissingOrders(orders.filter((o) => o.missingQty > 0))
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : 'Failed to load missing report')
          setProductReturns([])
          setMissingOrders([])
        })
        .finally(() => setLoading(false))
      return
    }

    setBillerReturns(null)
    setProductReturns(null)
    setMissingOrders(null)
  }, [activeTab, date, dateTo, dateQuery, filterQuery, godownId, billerUserId, showProductList])

  // useEffect(() => {
  //   if (activeTab !== 'stock') return
  //   const token = getToken(); if (!token) return
  //   if (auth.status !== 'authenticated' || (auth.user.role !== 'ADMIN' && auth.user.role !== 'GODOWN')) return
  //   setLoading(true); setError(null)
  //   const gidQ = godownId ? `?godownId=${encodeURIComponent(godownId)}` : ''
  //   apiFetch<StockReportRow[]>(`/reports/stock${gidQ}`, { token })
  //     .then(setStock)
  //     .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load stock'))
  //     .finally(() => setLoading(false))
  // }, [activeTab, godownId, auth])

  const pwLines = useMemo(
    () => buildPwLines(deliveryIssues || []),
    [deliveryIssues],
  )

  const customerPwLines = useMemo(
    () => buildPwLines(customerReport?.deliveries || []),
    [customerReport],
  )

  const billerPwLines = useMemo(
    () => buildPwLines(missingOrders || []),
    [missingOrders],
  )

  // -- shared table styles ------------------------------------------------

  const tableWrap: React.CSSProperties = { overflowX: 'auto' }
  const tableEl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 800 }

  return (
    // AppShell provides 20px 24px padding
    <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* -- FILTERS CARD -- */}
      <ReportCard>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f0f9' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Filters</div>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <ReportFiltersBar
            godowns={godowns}
            sites={sites}
            customers={customers}
            billers={billers}
            products={products}
            godownId={godownId}
            site={site}
            customerName={customerName}
            billerUserId={billerUserId}
            productId={productId}
            onGodownChange={(id) => setFilters({
              godownId: id,
              billerUserId: activeTab === 'issues-biller' && !isBillerRole ? billerUserId : billerUserId,
            })}
            onSiteChange={(s) => setFilters({ site: s })}
            onCustomerChange={(name) => setFilters({ customerName: name })}
            onBillerChange={(id) => setFilters({ billerUserId: id })}
            onProductChange={(id) => setFilters({ productId: id })}
            showDate
            showDateTo={showIssueSection}
            date={date}
            dateTo={dateTo}
            onDateChange={(d) => setFilters({ date: d })}
            onDateToChange={(d) => setFilters({ dateTo: d })}
            showCustomer={activeTab === 'issues-customer'}
            showBiller={false}
            showProduct
            hideGodownFilter={lockGodownFilter}
          />
        </div>
      </ReportCard>

      {/* -- ISSUE SUB TABS -- */}
      {showIssueSection && (
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
          paddingLeft: 12, paddingRight: 0, paddingTop: 0, paddingBottom: 0,
          borderLeftWidth: 2, borderLeftStyle: 'solid', borderLeftColor: '#a7f3d0',
        }}>
          {ISSUE_SUB_TABS.map((t) => (
            <SubPillTab
              key={t.id}
              label={t.label}
              active={issueSubTab === t.id}
              onClick={() => setFilters({ tab: t.id })}
            />
          ))}
        </div>
      )}

      {/* -- ERROR -- */}
      {error && (
        <div style={{
          padding: '10px 16px', borderRadius: 10, background: '#fef2f2',
          color: '#b91c1c', fontSize: 13,
          borderWidth: 1, borderStyle: 'solid', borderColor: '#fecaca',
        }}>{error}</div>
      )}

      {/* -- LOADING SPINNER -- */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '3px solid #e2e8f0', borderTopColor: '#10b981',
            animation: 'spin 0.7s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ----------------------------------------------
          ISSUES — BY BILLER (direct select)
      ---------------------------------------------- */}
      {activeTab === 'issues-biller' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Card with title + inline biller select */}
          <ReportCard>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing by biller</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  Select a biller to view their missing orders and product breakdown.
                </div>
              </div>
              {!isBillerRole && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Biller</label>
                  <InlineSearchableSelect
                    value={billerUserId}
                    onChange={(id) => setFilters({ billerUserId: id })}
                    options={[
                      { value: '', label: '— Select a biller —' },
                      ...billers.map((b) => ({ value: b.id, label: b.name + (b.siteName ? ` — ${b.siteName}` : '') })),
                    ]}
                    placeholder="— Select a biller —"
                  />
                  {billerUserId && (
                    <button
                      onClick={() => setFilters({ billerUserId: '' })}
                      style={{
                        padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                        background: '#fff', fontSize: 12, color: '#64748b', cursor: 'pointer',
                      }}
                    >Clear</button>
                  )}
                </div>
              )}
            </div>

            {/* Prompt when no biller selected */}
            {!billerUserId && !isBillerRole && (
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#64748b' }}>Select a biller above to view their missing report.</div>
              </div>
            )}

            {/* Stat summary row */}
            {showProductList && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #f1f5f9' }}>
                {[
                  { label: 'Missing orders', value: formatNumber(selectedBillerStats?.missingOrderCount ?? missingOrders?.length ?? 0), accent: '#dc2626' },
                  { label: 'Missing quantity', value: formatNumber(selectedBillerStats?.missingQty ?? 0), accent: '#dc2626' },
                  { label: 'Missing value', value: formatCurrency(selectedBillerStats?.missingTotal ?? 0), accent: '#d97706' },
                ].map(({ label, value, accent }, i) => (
                  <div key={label} style={{
                    padding: '16px 20px',
                    borderRight: i < 2 ? '1px solid #f1f5f9' : undefined,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: accent, marginTop: 4 }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </ReportCard>

          {showProductList && (
            <>
              <ReportCard>
                <CardHead
                  title="Missing orders"
                  sub={`${selectedBillerName}${selectedGodownName ? ` — ${selectedGodownName}` : ''} — deliveries with biller-reported missing items`}
                />
                <div style={{ padding: '0 0 4px' }}>
                  {missingOrders ? <MissingOrdersTable rows={missingOrders} /> : null}
                </div>
              </ReportCard>

              <ReportCard>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing by product</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Products reported missing — expand to see godown, delivery, and customer details</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>Orders view</button>
                    <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
                  </div>
                </div>
                <div style={{ padding: '0 0 4px' }}>
                  {!showPwView ? (
                    productReturns ? (
                      <ProductMissingTable rows={productReturns} expandedId={expandedId} onToggleExpand={setExpandedId} />
                    ) : !loading ? (
                      <Empty title="No missing products" sub="No product-level missing data for this biller." />
                    ) : null
                  ) : (
                    <ProductWisePanel lines={billerPwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer />
                  )}
                </div>
              </ReportCard>
            </>
          )}
        </div>
      )}

      {/* ----------------------------------------------
          ISSUES — BY GODOWN
      ---------------------------------------------- */}
      {activeTab === 'issues-godown' && (
        <ReportCard>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing &amp; damage by godown</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>By godown</button>
              <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
            </div>
          </div>
          {!showPwView ? (
            godownIssues?.length ? (
              <div style={tableWrap}>
                <table style={{ ...tableEl, minWidth: 980 }}>
                  <thead>
                    <tr>
                      {['Godown','Deliveries','With issues','Missing qty','Missing value','Damage qty','Damage value','Tags missing',''].map((h, i) => (
                        <th key={i} style={{ ...tHead, textAlign: i >= 1 && i <= 7 ? 'right' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {godownIssues.map((g) => (
                      <tr key={g.godownId} style={{ transition: 'background 0.12s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.4)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                      >
                        <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{g.godownName || g.godownId}</td>
                        <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(g.totalDeliveries)}</td>
                        <td style={{ ...tCell, textAlign: 'right', fontWeight: g.issueDeliveryCount > 0 ? 700 : undefined, color: g.issueDeliveryCount > 0 ? '#dc2626' : undefined }}>{formatNumber(g.issueDeliveryCount)}</td>
                        <td style={{ ...tCell, textAlign: 'right', fontWeight: g.missingQty > 0 ? 700 : undefined, color: g.missingQty > 0 ? '#dc2626' : undefined }}>{formatNumber(g.missingQty)}</td>
                        <td style={{ ...tCell, textAlign: 'right', color: g.missingTotal > 0 ? '#dc2626' : undefined }}>{g.missingTotal > 0 ? formatCurrency(g.missingTotal) : '—'}</td>
                        <td style={{ ...tCell, textAlign: 'right', fontWeight: g.damageQty > 0 ? 700 : undefined, color: g.damageQty > 0 ? '#d97706' : undefined }}>{formatNumber(g.damageQty)}</td>
                        <td style={{ ...tCell, textAlign: 'right', color: g.damageTotal > 0 ? '#d97706' : undefined }}>{g.damageTotal > 0 ? formatCurrency(g.damageTotal) : '—'}</td>
                        <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(g.missingTagCount)}</td>
                        <td style={tCell}>
                          <button
                            onClick={() => setFilters({ godownId: g.godownId, tab: 'issues-delivery' })}
                            style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#059669', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >View deliveries</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !loading ? (
              <div style={{ padding: '0 0 4px' }}>
                <Empty title="No godown data" sub="No deliveries in the selected period." />
              </div>
            ) : null
          ) : (
            <div style={{ padding: '0 0 4px' }}>
              <ProductWisePanel lines={pwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer />
            </div>
          )}
        </ReportCard>
      )}

      {/* ----------------------------------------------
          ISSUES — BY DELIVERY
      ---------------------------------------------- */}
      {activeTab === 'issues-delivery' && (
        <ReportCard>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Missing &amp; damage by delivery</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>By delivery</button>
              <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
            </div>
          </div>
          <div style={{ padding: '0 0 4px' }}>
            {!showPwView ? (
              deliveryIssues ? (
                <IssueDeliveryTable rows={deliveryIssues} expandedId={expandedId} onToggleExpand={setExpandedId} />
              ) : !loading ? (
                <Empty title="No issue deliveries" sub="No missing or damage for this period and filters." />
              ) : null
            ) : (
              <ProductWisePanel lines={pwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer />
            )}
          </div>
        </ReportCard>
      )}

      {/* ----------------------------------------------
          ISSUES — BY CUSTOMER
      ---------------------------------------------- */}
      {activeTab === 'issues-customer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!customerName.trim() ? (
            <ReportCard>
              <div style={{ padding: '20px' }}>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Select a customer above to load their delivery and issue summary.
                </p>
              </div>
            </ReportCard>
          ) : null}

          {customerReport && (
            <>
              {/* summary metrics */}
              <ReportCard>
                <CardHead title={customerReport.customerName} />
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 0,
                }}>
                  {[
                    { label: 'Deliveries', val: customerReport.summary.deliveryCount },
                    { label: 'With issues', val: customerReport.summary.issueDeliveryCount },
                    { label: 'Missing qty', val: customerReport.summary.missingQty, accent: '#dc2626' },
                    { label: 'Damage qty', val: customerReport.summary.damageQty, accent: '#d97706' },
                    { label: 'Tags missing', val: customerReport.summary.missingTagCount, accent: '#dc2626' },
                    { label: 'Dmg/lost tags', val: customerReport.summary.damagedTagCount + customerReport.summary.lostTagCount, accent: '#d97706' },
                  ].map(({ label, val, accent }, i) => (
                    <div key={label} style={{
                      padding: '14px 18px',
                      borderBottom: i < 3 ? '1px solid #f1f5f9' : undefined,
                      borderRight: (i + 1) % 3 !== 0 ? '1px solid #f1f5f9' : undefined,
                    }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: accent || '#0f172a', marginTop: 4 }}>
                        {formatNumber(val)}
                      </div>
                    </div>
                  ))}
                </div>
                {(customerReport.summary.missingTotal > 0 || customerReport.summary.damageTotal > 0) && (
                  <div style={{ display: 'flex', gap: 24, padding: '12px 18px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                    {customerReport.summary.missingTotal > 0 && (
                      <div>
                        <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Missing value </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>{formatCurrency(customerReport.summary.missingTotal)}</span>
                      </div>
                    )}
                    {customerReport.summary.damageTotal > 0 && (
                      <div>
                        <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Damage value </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#d97706' }}>{formatCurrency(customerReport.summary.damageTotal)}</span>
                      </div>
                    )}
                  </div>
                )}
              </ReportCard>

              {/* product breakdown */}
              {customerProducts && (customerProducts.missingByProduct.length > 0 || customerProducts.damagedByProduct.length > 0) && (
                <ReportCard>
                  <CardHead title="Product breakdown" sub="Missing and damaged products aggregated across all deliveries for this customer" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                    {/* Missing products */}
                    <div style={{ borderRight: '1px solid #f1f5f9' }}>
                      <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#fef2f2' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Missing products ({customerProducts.missingByProduct.length})
                        </span>
                      </div>
                      {customerProducts.missingByProduct.length ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ ...tHead, background: '#fff5f5' }}>Product</th>
                              <th style={{ ...tHead, textAlign: 'right', background: '#fff5f5' }}>Missing qty</th>
                              <th style={{ ...tHead, textAlign: 'right', background: '#fff5f5' }}>Orders</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerProducts.missingByProduct.map((p) => (
                              <tr key={p.productId}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#fff5f5')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                              >
                                <td style={{ ...tCell, fontWeight: 500 }}>{p.particulars || p.sku || p.productId}</td>
                                <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(p.totalQty)}</td>
                                <td style={{ ...tCell, textAlign: 'right', color: '#64748b' }}>{formatNumber(p.deliveryCount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ padding: '16px', fontSize: 12, color: '#94a3b8' }}>No missing products.</div>
                      )}
                    </div>
                    {/* Damaged products */}
                    <div>
                      <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#fffbeb' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Damaged products ({customerProducts.damagedByProduct.length})
                        </span>
                      </div>
                      {customerProducts.damagedByProduct.length ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ ...tHead, background: '#fffdf0' }}>Product</th>
                              <th style={{ ...tHead, textAlign: 'right', background: '#fffdf0' }}>Damaged qty</th>
                              <th style={{ ...tHead, textAlign: 'right', background: '#fffdf0' }}>Orders</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerProducts.damagedByProduct.map((p) => (
                              <tr key={p.productId}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#fffdf0')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                              >
                                <td style={{ ...tCell, fontWeight: 500 }}>{p.particulars || p.sku || p.productId}</td>
                                <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#d97706' }}>{formatNumber(p.totalQty)}</td>
                                <td style={{ ...tCell, textAlign: 'right', color: '#64748b' }}>{formatNumber(p.deliveryCount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ padding: '16px', fontSize: 12, color: '#94a3b8' }}>No damaged products.</div>
                      )}
                    </div>
                  </div>
                </ReportCard>
              )}

              {/* deliveries table */}
              <ReportCard>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Deliveries (date-wise)</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setShowPwView(false)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 500 : 700, border: showPwView ? '1px solid #e2e8f0' : 'none', background: showPwView ? '#fff' : '#059669', color: showPwView ? '#64748b' : '#fff', cursor: 'pointer' }}>By delivery</button>
                    <button onClick={() => setShowPwView(true)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: showPwView ? 700 : 500, border: showPwView ? 'none' : '1px solid #e2e8f0', background: showPwView ? '#059669' : '#fff', color: showPwView ? '#fff' : '#64748b', cursor: 'pointer' }}>Product-wise</button>
                  </div>
                </div>
                {!showPwView ? (
                  <IssueDeliveryTable rows={customerReport.deliveries} expandedId={expandedId} onToggleExpand={setExpandedId} />
                ) : (
                  <div style={{ padding: '0 0 4px' }}>
                    <ProductWisePanel lines={customerPwLines} expandedId={pwExpandedId} onToggle={setPwExpandedId} showGodown showCustomer={false} />
                  </div>
                )}
              </ReportCard>
            </>
          )}

          {customerName.trim() && !loading && !customerReport && (
            <Empty title="No data" sub="No deliveries for this customer in the selected period." />
          )}
        </div>
      )}

    </div>
  )
}