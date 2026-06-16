
// import React, { Fragment, useEffect, useMemo, useState } from 'react'
// import { Link } from 'react-router-dom'
// import { apiFetch } from '../lib/api'
// import { getToken, useAuth } from '../auth/store'
// import { useReportFilters } from '../hooks/useReportFilters'
// import type { IssueDeliveryRow, ProductReturnRow } from '../types/reports'
// import ReactDOM from 'react-dom'

// // ── helpers ────────────────────────────────────────────────────────────────

// function formatCurrency(n: number) {
//   return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
// }
// function formatNumber(n: number) { return n.toLocaleString('en-IN') }
// function formatDeliveryDate(iso: string) {
//   return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
// }

// const PAGE_SIZE = 10

// // ── table styles ───────────────────────────────────────────────────────────

// const tHead: React.CSSProperties = {
//   padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#94a3b8',
//   textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left',
//   whiteSpace: 'nowrap', background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
// }
// const tCell: React.CSSProperties = {
//   padding: '13px 14px', fontSize: 13, color: '#374151',
//   borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle',
// }

// // ── shared UI components ───────────────────────────────────────────────────

// function ReportCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
//   return <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: 14, ...style }}>{children}</div>
// }

// function CardHead({ title, sub }: { title: string; sub?: string }) {
//   return (
//     <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
//       <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</div>
//       {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
//     </div>
//   )
// }

// function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
//   return (
//     <button onClick={onClick} style={{
//       padding: '7px 18px', borderRadius: 20, fontSize: 13,
//       fontWeight: active ? 700 : 500,
//       border: active ? 'none' : '1px solid #e2e8f0',
//       background: active ? '#059669' : '#fff',
//       color: active ? '#fff' : '#64748b',
//       cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
//     }}>{label}</button>
//   )
// }

// function Empty({ title, sub }: { title: string; sub: string }) {
//   return (
//     <div style={{ padding: '48px 0', textAlign: 'center' }}>
//       <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{title}</div>
//       <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div>
//     </div>
//   )
// }

// function Spinner() {
//   return (
//     <div style={{ display: 'flex', justifyContent: 'center', padding: '36px 0' }}>
//       <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#10b981', animation: 'spin 0.7s linear infinite' }} />
//       <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//     </div>
//   )
// }

// // ── Pagination bar ─────────────────────────────────────────────────────────

// function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
//   const totalPages = Math.max(1, Math.ceil(total / pageSize))
//   if (totalPages <= 1) return null
//   const pages: (number | '…')[] = []
//   for (let i = 1; i <= totalPages; i++) {
//     if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i)
//     else if (pages[pages.length - 1] !== '…') pages.push('…')
//   }
//   const btnBase: React.CSSProperties = { padding: '5px 10px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', minWidth: 34, textAlign: 'center' }
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #f1f5f9' }}>
//       <span style={{ fontSize: 12, color: '#64748b' }}>
//         Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {formatNumber(total)}
//       </span>
//       <div style={{ display: 'flex', gap: 4 }}>
//         <button onClick={() => onChange(page - 1)} disabled={page === 1} style={{ ...btnBase, background: page === 1 ? '#f8fafc' : '#fff', color: page === 1 ? '#cbd5e1' : '#374151' }}>‹</button>
//         {pages.map((p, i) =>
//           p === '…' ? <span key={`e${i}`} style={{ ...btnBase, border: 'none', color: '#94a3b8', cursor: 'default' }}>…</span>
//             : <button key={p} onClick={() => onChange(p as number)} style={{ ...btnBase, background: p === page ? '#059669' : '#fff', color: p === page ? '#fff' : '#374151', borderColor: p === page ? '#059669' : '#e2e8f0', fontWeight: p === page ? 700 : 400 }}>{p}</button>
//         )}
//         <button onClick={() => onChange(page + 1)} disabled={page === totalPages} style={{ ...btnBase, background: page === totalPages ? '#f8fafc' : '#fff', color: page === totalPages ? '#cbd5e1' : '#374151' }}>›</button>
//       </div>
//     </div>
//   )
// }

// // ── Searchable dropdown (reusable) ─────────────────────────────────────────

// function SearchableSelect({ value, onChange, options, placeholder }: {
//   value: string
//   onChange: (v: string) => void
//   options: Array<{ value: string; label: string }>
//   placeholder?: string
// }) {
//   const [open, setOpen] = useState(false)
//   const [search, setSearch] = useState('')
//   const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
//   const wrapRef = React.useRef<HTMLDivElement>(null)
//   const btnRef = React.useRef<HTMLButtonElement>(null)
//   const inputRef = React.useRef<HTMLInputElement>(null)
//   const dropRef = React.useRef<HTMLDivElement>(null)

//   React.useEffect(() => {
//     if (!open) return
//     const h = (e: MouseEvent) => {
//       const t = e.target as Node
//       if (wrapRef.current?.contains(t) || dropRef.current?.contains(t)) return
//       setOpen(false); setSearch('')
//     }
//     document.addEventListener('mousedown', h)
//     return () => document.removeEventListener('mousedown', h)
//   }, [open])

//   React.useEffect(() => {
//     if (!open) return
//     const repo = () => {
//       if (btnRef.current) {
//         const r = btnRef.current.getBoundingClientRect()
//         const W = 340
//         setDropPos({ top: r.bottom + 4, left: Math.max(8, Math.min(r.left, window.innerWidth - W - 8)), width: Math.max(r.width, W) })
//       }
//     }
//     repo()
//     window.addEventListener('scroll', repo, true); window.addEventListener('resize', repo)
//     return () => { window.removeEventListener('scroll', repo, true); window.removeEventListener('resize', repo) }
//   }, [open])

//   React.useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])

//   const filtered = search.trim() ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase())) : options
//   const selectedLabel = options.find(o => o.value === value)?.label ?? (placeholder || '— All —')

//   return (
//     <div ref={wrapRef} style={{ position: 'relative', minWidth: 220, flex: '1 1 220px', maxWidth: 340 }}>
//       <button ref={btnRef} type="button" onClick={() => { setOpen(o => !o); setSearch('') }} style={{
//         height: 38, width: '100%', padding: '0 32px 0 12px',
//         border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff',
//         fontSize: 13, color: value ? '#0f172a' : '#94a3b8', textAlign: 'left',
//         cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
//         overflow: 'hidden', textOverflow: 'ellipsis',
//         outline: open ? '2px solid #a7f3d0' : 'none',
//       }}>
//         {selectedLabel}
//         <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
//           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
//         </span>
//       </button>
//       {open ? ReactDOM.createPortal(
//         <div ref={dropRef} style={{
//           position: 'fixed', top: dropPos.top, left: dropPos.left, minWidth: dropPos.width, maxWidth: 400,
//           zIndex: 99999, background: '#fff', border: '1px solid #d1fae5', borderRadius: 10,
//           boxShadow: '0 12px 32px rgba(0,0,0,0.14)', overflow: 'hidden',
//         }}>
//           <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
//             <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
//               style={{ width: '100%', height: 30, padding: '0 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
//               onKeyDown={e => e.key === 'Escape' && (setOpen(false), setSearch(''))} />
//           </div>
//           <div style={{ maxHeight: 240, overflowY: 'auto' }}>
//             {filtered.length === 0
//               ? <div style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>No results</div>
//               : filtered.map(o => (
//                 <div key={o.value}
//                   onMouseDown={e => { e.preventDefault(); onChange(o.value); setOpen(false); setSearch('') }}
//                   style={{ padding: '9px 14px', fontSize: 13, cursor: 'pointer', color: o.value === value ? '#059669' : '#0f172a', fontWeight: o.value === value ? 700 : 400, background: o.value === value ? '#f0fdf4' : undefined }}
//                   onMouseEnter={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
//                   onMouseLeave={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = o.value === value ? '#f0fdf4' : '' }}
//                 >{o.label}</div>
//               ))}
//           </div>
//         </div>,
//         document.body,
//       ) : null}
//     </div>
//   )
// }

// // ── Missing by biller table ────────────────────────────────────────────────

// function MissingByBillerTable({ rows, billerMap }: { rows: IssueDeliveryRow[]; billerMap: Map<string, string> }) {
//   const [page, setPage] = useState(1)
//   const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

//   if (!rows.length) return <Empty title="No returns found" sub="No deliveries with biller-reported damaged / missing quantities for the selected filters." />
//   return (
//     <>
//       <div style={{ overflowX: 'auto' }}>
//         <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
//           <thead>
//             <tr>
//               {['Order', 'Date', 'Biller', 'Customer', 'Site', 'Status', 'Return qty', 'Value'].map((h, i) => (
//                 <th key={h} style={{ ...tHead, textAlign: i >= 6 ? 'right' : 'left' }}>{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {paged.map((m) => (
//               <tr key={m.id}
//                 onMouseEnter={e => (e.currentTarget.style.background = 'rgba(254,242,242,0.35)')}
//                 onMouseLeave={e => (e.currentTarget.style.background = '')}
//               >
//                 <td style={tCell}>
//                   <Link to={`/deliveries/${m.id}`} style={{ fontWeight: 600, color: '#dc2626', textDecoration: 'none' }}
//                     onMouseEnter={e => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
//                     onMouseLeave={e => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
//                   >{m.deliveryNo}</Link>
//                 </td>
//                 <td style={{ ...tCell, whiteSpace: 'nowrap' }}>{formatDeliveryDate(m.deliveryAt)}</td>
//                 <td style={{ ...tCell, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#475569' }}>
//                   {billerMap.get(m.id) || '—'}
//                 </td>
//                 <td style={{ ...tCell, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.customerName}</td>
//                 <td style={{ ...tCell, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.siteName || '—'}</td>
//                 <td style={tCell}>
//                   <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#475569' }}>{m.status}</span>
//                 </td>
//                 <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(m.missingQty)}</td>
//                 <td style={{ ...tCell, textAlign: 'right' }}>{m.damageTotal != null && m.damageTotal > 0 ? formatCurrency(m.damageTotal) : '—'}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//       <Pagination page={page} total={rows.length} pageSize={PAGE_SIZE} onChange={p => { setPage(p) }} />
//     </>
//   )
// }

// // ── Missing by product table ───────────────────────────────────────────────

// function MissingByProductTable({ rows }: { rows: ProductReturnRow[] }) {
//   const [page, setPage] = useState(1)
//   const [expandedId, setExpandedId] = useState<string | null>(null)
//   const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

//   if (!rows.length) return <Empty title="No returned products" sub="No product-level return data for the selected filters." />
//   return (
//     <>
//       <div style={{ overflowX: 'auto' }}>
//         <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
//           <thead>
//             <tr>
//               {['Product', 'SKU', 'Return qty', 'Orders', ''].map((h, i) => (
//                 <th key={i} style={{ ...tHead, textAlign: i === 2 || i === 3 ? 'right' : 'left' }}>{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {paged.map((r) => (
//               <Fragment key={r.productId}>
//                 <tr
//                   onMouseEnter={e => (e.currentTarget.style.background = 'rgba(254,242,242,0.2)')}
//                   onMouseLeave={e => (e.currentTarget.style.background = '')}
//                 >
//                   <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{r.particulars || r.productId}</td>
//                   <td style={{ ...tCell, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{r.sku || '—'}</td>
//                   <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(r.totalQty)}</td>
//                   <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(r.deliveryCount)}</td>
//                   <td style={tCell}>
//                     {r.deliveries.length > 0 && (
//                       <button
//                         onClick={() => setExpandedId(expandedId === r.productId ? null : r.productId)}
//                         style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', fontSize: 12, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}
//                       >{expandedId === r.productId ? 'Hide orders' : 'View orders'}</button>
//                     )}
//                   </td>
//                 </tr>
//                 {expandedId === r.productId && (
//                   <tr>
//                     <td colSpan={5} style={{ padding: '0 14px 14px' }}>
//                       <div style={{ background: '#fef2f2', borderRadius: 8, padding: 14, border: '1px solid #fecaca' }}>
//                         <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
//                           Return orders — {r.particulars || r.productId}
//                         </div>
//                         {r.deliveries.map((d) => (
//                           <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, fontSize: 12, color: '#374151', paddingBottom: 8, borderBottom: '1px solid #fee2e2', marginBottom: 8 }}>
//                             <div>
//                               <Link to={`/deliveries/${d.id}`} style={{ fontWeight: 600, color: '#dc2626', textDecoration: 'none' }}>{d.deliveryNo}</Link>
//                               {d.customerName ? <span style={{ color: '#64748b', marginLeft: 8 }}>{d.customerName}</span> : null}
//                               {d.deliveryAt ? <span style={{ color: '#94a3b8', marginLeft: 8 }}>{formatDeliveryDate(d.deliveryAt)}</span> : null}
//                             </div>
//                             <span style={{ fontWeight: 700, color: '#dc2626', whiteSpace: 'nowrap' }}>qty {formatNumber(d.qty)}</span>
//                           </div>
//                         ))}
//                       </div>
//                     </td>
//                   </tr>
//                 )}
//               </Fragment>
//             ))}
//           </tbody>
//         </table>
//       </div>
//       <Pagination page={page} total={rows.length} pageSize={PAGE_SIZE} onChange={p => { setPage(p); setExpandedId(null) }} />
//     </>
//   )
// }

// // ── Main page ──────────────────────────────────────────────────────────────

// type Tab = 'missing-by-biller' | 'missing-by-product'

// export function ReportsPage() {
//   const auth = useAuth()
//   const {
//     date, dateTo, billerUserId, productId,
//     billers: billersRaw, products: productsRaw,
//     dateQuery, setFilters,
//   } = useReportFilters()

//   const billers = (billersRaw as typeof billersRaw | undefined) ?? []
//   const products = (productsRaw as typeof productsRaw | undefined) ?? []
//   const isBillerRole = auth.status === 'authenticated' && auth.user.role === 'BILLER'

//   // Biller-role users are already implicitly scoped to themselves, so their
//   // data isn't "all data" — show it right away. For everyone else, require
//   // at least one filter (date / biller / product) to be picked before
//   // fetching and displaying anything.
//   const hasFilter = isBillerRole || Boolean(date || dateTo || billerUserId || productId)

//   const [activeTab, setActiveTab] = useState<Tab>('missing-by-biller')
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   // Raw data from API — full unfiltered dataset
//   const [allOrders, setAllOrders] = useState<IssueDeliveryRow[]>([])
//   const [allProductReturns, setAllProductReturns] = useState<ProductReturnRow[]>([])

//   // Load data when a filter is selected, or when the date range changes
//   useEffect(() => {
//     if (!hasFilter) {
//       setAllOrders([])
//       setAllProductReturns([])
//       setError(null)
//       return
//     }

//     const token = getToken()
//     if (!token) return
//     setLoading(true)
//     setError(null)

//     // Build biller filter if BILLER role (always scope to self)
//     const billerSelfPart = isBillerRole
//       ? (auth.status === 'authenticated' ? `billerUserId=${encodeURIComponent(auth.user.id)}&` : '')
//       : ''

//     const ordersQ = `/reports/issues/by-delivery?${dateQuery}${billerSelfPart}limit=500`
//     const productQ = `/reports/returns/by-product?${dateQuery}${billerSelfPart}metric=missing`

//     Promise.all([
//       apiFetch<IssueDeliveryRow[]>(ordersQ, { token }),
//       apiFetch<ProductReturnRow[]>(productQ, { token }),
//     ])
//       .then(([orders, prods]) => {
//         setAllOrders(orders.filter(o => o.missingQty > 0))
//         setAllProductReturns(prods)
//       })
//       .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
//       .finally(() => setLoading(false))
//   }, [dateQuery, isBillerRole, auth, hasFilter])

//   // Re-fetch when billerUserId filter changes (server-side filter for biller)
//   const [billerFilteredOrders, setBillerFilteredOrders] = useState<IssueDeliveryRow[]>([])
//   const [billerFilteredProducts, setBillerFilteredProducts] = useState<ProductReturnRow[]>([])
//   const [billerLoading, setBillerLoading] = useState(false)

//   useEffect(() => {
//     const token = getToken()
//     if (!token) return

//     if (!billerUserId && !isBillerRole) {
//       // No biller filter — use full dataset
//       setBillerFilteredOrders(allOrders)
//       setBillerFilteredProducts(allProductReturns)
//       return
//     }

//     setBillerLoading(true)
//     const billerPart = billerUserId ? `billerUserId=${encodeURIComponent(billerUserId)}&` : ''
//     const selfPart = isBillerRole && auth.status === 'authenticated'
//       ? `billerUserId=${encodeURIComponent(auth.user.id)}&` : ''
//     const bp = billerPart || selfPart

//     const ordersQ = `/reports/issues/by-delivery?${dateQuery}${bp}limit=500`
//     const productQ = `/reports/returns/by-product?${dateQuery}${bp}metric=missing`

//     Promise.all([
//       apiFetch<IssueDeliveryRow[]>(ordersQ, { token }),
//       apiFetch<ProductReturnRow[]>(productQ, { token }),
//     ])
//       .then(([orders, prods]) => {
//         setBillerFilteredOrders(orders.filter(o => o.missingQty > 0))
//         setBillerFilteredProducts(prods)
//       })
//       .catch(() => {})
//       .finally(() => setBillerLoading(false))
//   }, [billerUserId, dateQuery, isBillerRole, auth, allOrders, allProductReturns])

//   // Client-side filter: Missing by product — filter by productId
//   const filteredProductReturns = useMemo(() => {
//     const base = (billerUserId || isBillerRole) ? billerFilteredProducts : allProductReturns
//     if (!productId) return base
//     return base.filter(r => r.productId === productId)
//   }, [allProductReturns, billerFilteredProducts, billerUserId, isBillerRole, productId])

//   // Orders shown in biller tab
//   const ordersToShow = (billerUserId || isBillerRole) ? billerFilteredOrders : allOrders

//   // Summary stats
//   const totalQty = ordersToShow.reduce((s, o) => s + o.missingQty, 0)
//   const totalValue = ordersToShow.reduce((s, o) => s + (o.damageTotal || 0), 0)

//   const isLoading = loading || billerLoading

//   // Build biller display map from all orders
//   const deliveryBillerMap = useMemo(() => {
//     const map = new Map<string, string>()
//     if (billerUserId) {
//       const b = billers.find(x => x.id === billerUserId)
//       if (b) ordersToShow.forEach(o => map.set(o.id, b.name + (b.siteName ? ` — ${b.siteName}` : '')))
//     }
//     return map
//   }, [ordersToShow, billers, billerUserId])

//   const billerOptions = [
//     { value: '', label: '— All billers —' },
//     ...billers.map(b => ({ value: b.id, label: b.name + (b.siteName ? ` — ${b.siteName}` : '') })),
//   ]

//   const productOptions = [
//     { value: '', label: '— All products —' },
//     ...products.map(p => ({ value: p.id, label: p.name + (p.sku ? ` (${p.sku})` : '') })),
//   ]

//   return (
//     <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 16 }}>

//       {/* ── Filters card ── */}
//       <ReportCard>
//         <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
//           <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Filters</div>
//         </div>
//         <div style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>

//           {/* Date from */}
//           <div>
//             <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>From date</label>
//             <input type="date" value={date} onChange={e => setFilters({ date: e.target.value })}
//               style={{ height: 38, padding: '0 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', background: '#fff', cursor: 'pointer', outline: 'none' }} />
//           </div>

//           {/* Date to */}
//           <div>
//             <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>To date</label>
//             <input type="date" value={dateTo} onChange={e => setFilters({ dateTo: e.target.value })}
//               style={{ height: 38, padding: '0 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', background: '#fff', cursor: 'pointer', outline: 'none' }} />
//           </div>

//           {/* Biller filter — always shown (locked to self for biller-role users) */}
//           {!isBillerRole && (
//             <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
//               <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Biller</label>
//               <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
//                 <SearchableSelect value={billerUserId} onChange={id => setFilters({ billerUserId: id })} options={billerOptions} placeholder="— All billers —" />
//                 {billerUserId && (
//                   <button onClick={() => setFilters({ billerUserId: '' })}
//                     style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
//                     Clear
//                   </button>
//                 )}
//               </div>
//             </div>
//           )}

//           {/* Product filter — always shown, next to Biller */}
//           <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
//             <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</label>
//             <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
//               <SearchableSelect value={productId} onChange={id => setFilters({ productId: id })} options={productOptions} placeholder="— All products —" />
//               {productId && (
//                 <button onClick={() => setFilters({ productId: '' })}
//                   style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
//                   Clear
//                 </button>
//               )}
//             </div>
//           </div>

//           {/* Reset all */}
//           {(date || dateTo || billerUserId || productId) && (
//             <button
//               onClick={() => setFilters({ date: '', dateTo: '', billerUserId: '', productId: '' })}
//               style={{ height: 38, padding: '0 14px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fff5f5', fontSize: 12, color: '#dc2626', cursor: 'pointer', whiteSpace: 'nowrap', alignSelf: 'flex-end' }}>
//               Reset filters
//             </button>
//           )}
//         </div>
//       </ReportCard>

//       {/* ── Tab bar ── */}
//       <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
//         <TabBtn label="Missing by biller" active={activeTab === 'missing-by-biller'}
//           onClick={() => setActiveTab('missing-by-biller')} />
//         <TabBtn label="Missing by product" active={activeTab === 'missing-by-product'}
//           onClick={() => setActiveTab('missing-by-product')} />
//       </div>

//       {/* ── Error ── */}
//       {error && (
//         <div style={{ padding: '10px 16px', borderRadius: 10, background: '#fef2f2', color: '#b91c1c', fontSize: 13, border: '1px solid #fecaca' }}>{error}</div>
//       )}

//       {/* ── Loading ── */}
//       {isLoading && <Spinner />}

//       {/* ── No filter selected yet — don't show any data until the user picks one ── */}
//       {!hasFilter && !isLoading && (
//         <ReportCard>
//           <Empty
//             title="Select a filter to view data"
//             sub="Choose a biller or product above (or a date range) to load the missing-returns report."
//           />
//         </ReportCard>
//       )}

//       {/* ══ MISSING BY BILLER ══ */}
//       {hasFilter && activeTab === 'missing-by-biller' && !isLoading && (
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

//           {/* Summary stats */}
//           <ReportCard>
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
//               {[
//                 { label: 'Orders with returns', value: formatNumber(ordersToShow.length), accent: '#dc2626' },
//                 { label: 'Total return qty', value: formatNumber(totalQty), accent: '#dc2626' },
//                 { label: 'Total value', value: totalValue > 0 ? formatCurrency(totalValue) : '—', accent: '#d97706' },
//               ].map(({ label, value, accent }, i) => (
//                 <div key={label} style={{ padding: '18px 20px', borderRight: i < 2 ? '1px solid #f1f5f9' : undefined }}>
//                   <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
//                   <div style={{ fontSize: 22, fontWeight: 700, color: accent, marginTop: 4 }}>{value}</div>
//                 </div>
//               ))}
//             </div>
//           </ReportCard>

//           {/* Orders table */}
//           <ReportCard>
//             <CardHead
//               title={billerUserId
//                 ? `Returns — ${billers.find(b => b.id === billerUserId)?.name ?? 'selected biller'}`
//                 : 'All biller returns'}
//               sub="Deliveries where biller reported damaged / missing quantities"
//             />
//             <div style={{ padding: '0 0 4px' }}>
//               <MissingByBillerTable rows={ordersToShow} billerMap={deliveryBillerMap} />
//             </div>
//           </ReportCard>
//         </div>
//       )}

//       {/* ══ MISSING BY PRODUCT ══ */}
//       {hasFilter && activeTab === 'missing-by-product' && !isLoading && (
//         <ReportCard>
//           <CardHead
//             title={productId
//               ? `Returns — ${products.find(p => p.id === productId)?.name ?? 'selected product'}`
//               : 'All returned products'}
//             sub="Aggregated return quantities per product — expand to see individual orders"
//           />
//           <div style={{ padding: '0 0 4px' }}>
//             <MissingByProductTable rows={filteredProductReturns} />
//           </div>
//         </ReportCard>
//       )}

//     </div>
//   )
// }

import React, { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { getToken, useAuth } from '../auth/store'
import { useReportFilters } from '../hooks/useReportFilters'
import type { IssueDeliveryRow, ProductReturnRow } from '../types/reports'
import ReactDOM from 'react-dom'

// ── helpers ────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}
function formatNumber(n: number) { return n.toLocaleString('en-IN') }
function formatDeliveryDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PAGE_SIZE = 10

// ── table styles ───────────────────────────────────────────────────────────

const tHead: React.CSSProperties = {
  padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#94a3b8',
  textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left',
  whiteSpace: 'nowrap', background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
}
const tCell: React.CSSProperties = {
  padding: '13px 14px', fontSize: 13, color: '#374151',
  borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle',
}

// ── shared UI components ───────────────────────────────────────────────────

function ReportCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: 14, ...style }}>{children}</div>
}

function CardHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 18px', borderRadius: 20, fontSize: 13,
      fontWeight: active ? 700 : 500,
      border: active ? 'none' : '1px solid #e2e8f0',
      background: active ? '#059669' : '#fff',
      color: active ? '#fff' : '#64748b',
      cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}>{label}</button>
  )
}

function Empty({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{title}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '36px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#10b981', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Pagination bar ─────────────────────────────────────────────────────────

function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null
  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }
  const btnBase: React.CSSProperties = { padding: '5px 10px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', minWidth: 34, textAlign: 'center' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 12, color: '#64748b' }}>
        Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {formatNumber(total)}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => onChange(page - 1)} disabled={page === 1} style={{ ...btnBase, background: page === 1 ? '#f8fafc' : '#fff', color: page === 1 ? '#cbd5e1' : '#374151' }}>‹</button>
        {pages.map((p, i) =>
          p === '…' ? <span key={`e${i}`} style={{ ...btnBase, border: 'none', color: '#94a3b8', cursor: 'default' }}>…</span>
            : <button key={p} onClick={() => onChange(p as number)} style={{ ...btnBase, background: p === page ? '#059669' : '#fff', color: p === page ? '#fff' : '#374151', borderColor: p === page ? '#059669' : '#e2e8f0', fontWeight: p === page ? 700 : 400 }}>{p}</button>
        )}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages} style={{ ...btnBase, background: page === totalPages ? '#f8fafc' : '#fff', color: page === totalPages ? '#cbd5e1' : '#374151' }}>›</button>
      </div>
    </div>
  )
}

// ── Searchable dropdown (reusable) ─────────────────────────────────────────

function SearchableSelect({ value, onChange, options, placeholder }: {
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const btnRef = React.useRef<HTMLButtonElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dropRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      const t = e.target as Node
      if (wrapRef.current?.contains(t) || dropRef.current?.contains(t)) return
      setOpen(false); setSearch('')
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const repo = () => {
      if (btnRef.current) {
        const r = btnRef.current.getBoundingClientRect()
        const W = 340
        setDropPos({ top: r.bottom + 4, left: Math.max(8, Math.min(r.left, window.innerWidth - W - 8)), width: Math.max(r.width, W) })
      }
    }
    repo()
    window.addEventListener('scroll', repo, true); window.addEventListener('resize', repo)
    return () => { window.removeEventListener('scroll', repo, true); window.removeEventListener('resize', repo) }
  }, [open])

  React.useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])

  const filtered = search.trim() ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase())) : options
  const selectedLabel = options.find(o => o.value === value)?.label ?? (placeholder || '— All —')

  return (
    <div ref={wrapRef} style={{ position: 'relative', minWidth: 220, flex: '1 1 220px', maxWidth: 340 }}>
      <button ref={btnRef} type="button" onClick={() => { setOpen(o => !o); setSearch('') }} style={{
        height: 38, width: '100%', padding: '0 32px 0 12px',
        border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff',
        fontSize: 13, color: value ? '#0f172a' : '#94a3b8', textAlign: 'left',
        cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
        overflow: 'hidden', textOverflow: 'ellipsis',
        outline: open ? '2px solid #a7f3d0' : 'none',
      }}>
        {selectedLabel}
        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
        </span>
      </button>
      {open ? ReactDOM.createPortal(
        <div ref={dropRef} style={{
          position: 'fixed', top: dropPos.top, left: dropPos.left, minWidth: dropPos.width, maxWidth: 400,
          zIndex: 99999, background: '#fff', border: '1px solid #d1fae5', borderRadius: 10,
          boxShadow: '0 12px 32px rgba(0,0,0,0.14)', overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
            <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              style={{ width: '100%', height: 30, padding: '0 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              onKeyDown={e => e.key === 'Escape' && (setOpen(false), setSearch(''))} />
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filtered.length === 0
              ? <div style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>No results</div>
              : filtered.map(o => (
                <div key={o.value}
                  onMouseDown={e => { e.preventDefault(); onChange(o.value); setOpen(false); setSearch('') }}
                  style={{ padding: '9px 14px', fontSize: 13, cursor: 'pointer', color: o.value === value ? '#059669' : '#0f172a', fontWeight: o.value === value ? 700 : 400, background: o.value === value ? '#f0fdf4' : undefined }}
                  onMouseEnter={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                  onMouseLeave={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = o.value === value ? '#f0fdf4' : '' }}
                >{o.label}</div>
              ))}
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  )
}

// ── Missing by biller table ────────────────────────────────────────────────

function MissingByBillerTable({ rows, billerMap }: { rows: IssueDeliveryRow[]; billerMap: Map<string, string> }) {
  const [page, setPage] = useState(1)
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (!rows.length) return <Empty title="No returns found" sub="No deliveries with biller-reported damaged / missing quantities for the selected filters." />
  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
          <thead>
            <tr>
              {['Order', 'Date', 'Biller', 'Customer', 'Site', 'Status', 'Return qty', 'Value'].map((h, i) => (
                <th key={h} style={{ ...tHead, textAlign: i >= 6 ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((m) => (
              <tr key={m.id}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(254,242,242,0.35)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <td style={tCell}>
                  <Link to={`/deliveries/${m.id}`} style={{ fontWeight: 600, color: '#dc2626', textDecoration: 'none' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
                  >{m.deliveryNo}</Link>
                </td>
                <td style={{ ...tCell, whiteSpace: 'nowrap' }}>{formatDeliveryDate(m.deliveryAt)}</td>
                <td style={{ ...tCell, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#475569' }}>
                  {billerMap.get(m.id) || '—'}
                </td>
                <td style={{ ...tCell, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.customerName}</td>
                <td style={{ ...tCell, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.siteName || '—'}</td>
                <td style={tCell}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#475569' }}>{m.status}</span>
                </td>
                <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(m.missingQty)}</td>
                <td style={{ ...tCell, textAlign: 'right' }}>{m.damageTotal != null && m.damageTotal > 0 ? formatCurrency(m.damageTotal) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={rows.length} pageSize={PAGE_SIZE} onChange={p => { setPage(p) }} />
    </>
  )
}

// ── Missing by product table ───────────────────────────────────────────────

function MissingByProductTable({ rows }: { rows: ProductReturnRow[] }) {
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (!rows.length) return <Empty title="No returned products" sub="No product-level return data for the selected filters." />
  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
          <thead>
            <tr>
              {['Product', 'SKU', 'Return qty', 'Orders', ''].map((h, i) => (
                <th key={i} style={{ ...tHead, textAlign: i === 2 || i === 3 ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <Fragment key={r.productId}>
                <tr
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(254,242,242,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{r.particulars || r.productId}</td>
                  <td style={{ ...tCell, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{r.sku || '—'}</td>
                  <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(r.totalQty)}</td>
                  <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(r.deliveryCount)}</td>
                  <td style={tCell}>
                    {r.deliveries.length > 0 && (
                      <button
                        onClick={() => setExpandedId(expandedId === r.productId ? null : r.productId)}
                        style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', fontSize: 12, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}
                      >{expandedId === r.productId ? 'Hide orders' : 'View orders'}</button>
                    )}
                  </td>
                </tr>
                {expandedId === r.productId && (
                  <tr>
                    <td colSpan={5} style={{ padding: '0 14px 14px' }}>
                      <div style={{ background: '#fef2f2', borderRadius: 8, padding: 14, border: '1px solid #fecaca' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                          Return orders — {r.particulars || r.productId}
                        </div>
                        {r.deliveries.map((d) => (
                          <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, fontSize: 12, color: '#374151', paddingBottom: 8, borderBottom: '1px solid #fee2e2', marginBottom: 8 }}>
                            <div>
                              <Link to={`/deliveries/${d.id}`} style={{ fontWeight: 600, color: '#dc2626', textDecoration: 'none' }}>{d.deliveryNo}</Link>
                              {d.customerName ? <span style={{ color: '#64748b', marginLeft: 8 }}>{d.customerName}</span> : null}
                              {d.deliveryAt ? <span style={{ color: '#94a3b8', marginLeft: 8 }}>{formatDeliveryDate(d.deliveryAt)}</span> : null}
                            </div>
                            <span style={{ fontWeight: 700, color: '#dc2626', whiteSpace: 'nowrap' }}>qty {formatNumber(d.qty)}</span>
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
      <Pagination page={page} total={rows.length} pageSize={PAGE_SIZE} onChange={p => { setPage(p); setExpandedId(null) }} />
    </>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

type Tab = 'missing-by-biller' | 'missing-by-product'

export function ReportsPage() {
  const auth = useAuth()
  const {
    date, dateTo, billerUserId, productId,
    billers: billersRaw, products: productsRaw,
    dateQuery, setFilters,
  } = useReportFilters()

  const billers = (billersRaw as typeof billersRaw | undefined) ?? []
  const products = (productsRaw as typeof productsRaw | undefined) ?? []
  const isBillerRole = auth.status === 'authenticated' && auth.user.role === 'BILLER'

  const [activeTab, setActiveTab] = useState<Tab>('missing-by-biller')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Raw data from API — full unfiltered dataset
  const [allOrders, setAllOrders] = useState<IssueDeliveryRow[]>([])
  const [allProductReturns, setAllProductReturns] = useState<ProductReturnRow[]>([])

  // Load ALL data on mount and whenever the date range changes — the full
  // dataset is shown by default; biller/product selects then narrow it down.
  useEffect(() => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    setError(null)

    // Build biller filter if BILLER role (always scope to self)
    const billerSelfPart = isBillerRole
      ? (auth.status === 'authenticated' ? `billerUserId=${encodeURIComponent(auth.user.id)}&` : '')
      : ''

    const ordersQ = `/reports/issues/by-delivery?${dateQuery}${billerSelfPart}limit=500`
    const productQ = `/reports/returns/by-product?${dateQuery}${billerSelfPart}metric=missing`

    Promise.all([
      apiFetch<IssueDeliveryRow[]>(ordersQ, { token }),
      apiFetch<ProductReturnRow[]>(productQ, { token }),
    ])
      .then(([orders, prods]) => {
        setAllOrders(orders.filter(o => o.missingQty > 0))
        setAllProductReturns(prods)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [dateQuery, isBillerRole, auth])

  // Re-fetch when billerUserId filter changes (server-side filter for biller)
  const [billerFilteredOrders, setBillerFilteredOrders] = useState<IssueDeliveryRow[]>([])
  const [billerFilteredProducts, setBillerFilteredProducts] = useState<ProductReturnRow[]>([])
  const [billerLoading, setBillerLoading] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) return

    if (!billerUserId && !isBillerRole) {
      // No biller filter — use full dataset
      setBillerFilteredOrders(allOrders)
      setBillerFilteredProducts(allProductReturns)
      return
    }

    setBillerLoading(true)
    const billerPart = billerUserId ? `billerUserId=${encodeURIComponent(billerUserId)}&` : ''
    const selfPart = isBillerRole && auth.status === 'authenticated'
      ? `billerUserId=${encodeURIComponent(auth.user.id)}&` : ''
    const bp = billerPart || selfPart

    const ordersQ = `/reports/issues/by-delivery?${dateQuery}${bp}limit=500`
    const productQ = `/reports/returns/by-product?${dateQuery}${bp}metric=missing`

    Promise.all([
      apiFetch<IssueDeliveryRow[]>(ordersQ, { token }),
      apiFetch<ProductReturnRow[]>(productQ, { token }),
    ])
      .then(([orders, prods]) => {
        setBillerFilteredOrders(orders.filter(o => o.missingQty > 0))
        setBillerFilteredProducts(prods)
      })
      .catch(() => {})
      .finally(() => setBillerLoading(false))
  }, [billerUserId, dateQuery, isBillerRole, auth, allOrders, allProductReturns])

  // Client-side filter: Missing by product — filter by productId
  const filteredProductReturns = useMemo(() => {
    const base = (billerUserId || isBillerRole) ? billerFilteredProducts : allProductReturns
    if (!productId) return base
    return base.filter(r => r.productId === productId)
  }, [allProductReturns, billerFilteredProducts, billerUserId, isBillerRole, productId])

  // Orders shown in biller tab
  const ordersToShow = (billerUserId || isBillerRole) ? billerFilteredOrders : allOrders

  // Summary stats
  const totalQty = ordersToShow.reduce((s, o) => s + o.missingQty, 0)
  const totalValue = ordersToShow.reduce((s, o) => s + (o.damageTotal || 0), 0)

  const isLoading = loading || billerLoading

  // Build biller display map from all orders
  const deliveryBillerMap = useMemo(() => {
    const map = new Map<string, string>()
    if (billerUserId) {
      const b = billers.find(x => x.id === billerUserId)
      if (b) ordersToShow.forEach(o => map.set(o.id, b.name + (b.siteName ? ` — ${b.siteName}` : '')))
    }
    return map
  }, [ordersToShow, billers, billerUserId])

  const billerOptions = [
    { value: '', label: '— All billers —' },
    ...billers.map(b => ({ value: b.id, label: b.name + (b.siteName ? ` — ${b.siteName}` : '') })),
  ]

  const productOptions = [
    { value: '', label: '— All products —' },
    ...products.map(p => ({ value: p.id, label: p.name + (p.sku ? ` (${p.sku})` : '') })),
  ]

  return (
    <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Filters card ── */}
      <ReportCard>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Filters</div>
        </div>
        <div style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>

          {/* Date from */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>From date</label>
            <input type="date" value={date} onChange={e => setFilters({ date: e.target.value })}
              style={{ height: 38, padding: '0 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', background: '#fff', cursor: 'pointer', outline: 'none' }} />
          </div>

          {/* Date to */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>To date</label>
            <input type="date" value={dateTo} onChange={e => setFilters({ dateTo: e.target.value })}
              style={{ height: 38, padding: '0 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', background: '#fff', cursor: 'pointer', outline: 'none' }} />
          </div>

          {/* Biller filter — always shown (locked to self for biller-role users) */}
          {!isBillerRole && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Biller</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <SearchableSelect value={billerUserId} onChange={id => setFilters({ billerUserId: id })} options={billerOptions} placeholder="— All billers —" />
                {billerUserId && (
                  <button onClick={() => setFilters({ billerUserId: '' })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Product filter — always shown, next to Biller */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <SearchableSelect value={productId} onChange={id => setFilters({ productId: id })} options={productOptions} placeholder="— All products —" />
              {productId && (
                <button onClick={() => setFilters({ productId: '' })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Reset all */}
          {(date || dateTo || billerUserId || productId) && (
            <button
              onClick={() => setFilters({ date: '', dateTo: '', billerUserId: '', productId: '' })}
              style={{ height: 38, padding: '0 14px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fff5f5', fontSize: 12, color: '#dc2626', cursor: 'pointer', whiteSpace: 'nowrap', alignSelf: 'flex-end' }}>
              Reset filters
            </button>
          )}
        </div>
      </ReportCard>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <TabBtn label="Missing by biller" active={activeTab === 'missing-by-biller'}
          onClick={() => setActiveTab('missing-by-biller')} />
        <TabBtn label="Missing by product" active={activeTab === 'missing-by-product'}
          onClick={() => setActiveTab('missing-by-product')} />
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: '10px 16px', borderRadius: 10, background: '#fef2f2', color: '#b91c1c', fontSize: 13, border: '1px solid #fecaca' }}>{error}</div>
      )}

      {/* ── Loading ── */}
      {isLoading && <Spinner />}

      {/* ══ MISSING BY BILLER ══ */}
      {activeTab === 'missing-by-biller' && !isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Summary stats */}
          <ReportCard>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[
                { label: 'Orders with returns', value: formatNumber(ordersToShow.length), accent: '#dc2626' },
                { label: 'Total return qty', value: formatNumber(totalQty), accent: '#dc2626' },
                { label: 'Total value', value: totalValue > 0 ? formatCurrency(totalValue) : '—', accent: '#d97706' },
              ].map(({ label, value, accent }, i) => (
                <div key={label} style={{ padding: '18px 20px', borderRight: i < 2 ? '1px solid #f1f5f9' : undefined }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: accent, marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>
          </ReportCard>

          {/* Orders table */}
          <ReportCard>
            <CardHead
              title={billerUserId
                ? `Returns — ${billers.find(b => b.id === billerUserId)?.name ?? 'selected biller'}`
                : 'All biller returns'}
              sub="Deliveries where biller reported damaged / missing quantities"
            />
            <div style={{ padding: '0 0 4px' }}>
              <MissingByBillerTable rows={ordersToShow} billerMap={deliveryBillerMap} />
            </div>
          </ReportCard>
        </div>
      )}

      {/* ══ MISSING BY PRODUCT ══ */}
      {activeTab === 'missing-by-product' && !isLoading && (
        <ReportCard>
          <CardHead
            title={productId
              ? `Returns — ${products.find(p => p.id === productId)?.name ?? 'selected product'}`
              : 'All returned products'}
            sub="Aggregated return quantities per product — expand to see individual orders"
          />
          <div style={{ padding: '0 0 4px' }}>
            <MissingByProductTable rows={filteredProductReturns} />
          </div>
        </ReportCard>
      )}

    </div>
  )
}