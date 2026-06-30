// import { useEffect, useMemo, useState } from 'react'
// import { Link, useParams, useSearchParams } from 'react-router-dom'
// import { formatDateTime, formatNumber } from '../../lib/format'
// import { Button } from '../../components/ui/Button'
// import { Input } from '../../components/ui/Input'
// import { Modal } from '../../components/ui/Modal'
// import { apiFetch } from '../../lib/api'
// import { getToken, useAuth } from '../../auth/store'
// import type { GodownRow } from './List'

// type Godown = GodownRow
// type CatalogRow = { productId: string; enabled: boolean; particulars?: string; sku?: string; category?: string; rate?: string }
// type StockAgg = { productId: string; qty: number }
// type DeliveryRow = { id: string; deliveryNo: string; customerName: string; siteName?: string; status: string; deliveryAt: string }
// type DeliveryLineRow = { productId: string; godownId?: string; qty: number }
// type DeliveryDetailRow = DeliveryRow & { fromGodownId: string; lines: DeliveryLineRow[] }
// type Tab = 'catalog' | 'stock' | 'update'

// // ── Toggle ────────────────────────────────────────────────────────────────
// function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }} onClick={() => onChange(!checked)}>
//       <div style={{ width: 44, height: 24, borderRadius: 12, background: checked ? '#059669' : '#d1d0d8', transition: 'background 0.2s', display: 'flex', alignItems: 'center', padding: '2px', flexShrink: 0 }}>
//         <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.18)', transform: checked ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
//       </div>
//       <span style={{ fontSize: 11.5, fontWeight: 600, color: checked ? '#059669' : '#7C7A9A', minWidth: 22 }}>{checked ? 'On' : 'Off'}</span>
//     </div>
//   )
// }

// // ── Status badge ──────────────────────────────────────────────────────────
// function deliveryBadgeStyle(status: string): React.CSSProperties {
//   if (status === 'COMPLETED') return { background: '#E1F5EE', color: '#0F6E56' }
//   if (status === 'PROCESSED' || status === 'UPCOMING') return { background: '#ecfdf5', color: '#059669' }
//   if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return { background: '#E1F5EE', color: '#0F6E56' }
//   if (status === 'PENDING_RETURN' || status === 'DELIVERED') return { background: '#FAEEDA', color: '#BA7517' }
//   if (status === 'CANCELLED' || status === 'RETURNED') return { background: '#FCEBEB', color: '#E24B4A' }
//   return { background: '#ecfdf5', color: '#059669' }
// }

// function statusLabel(s: string) {
//   return ({ PROCESSED: 'Processed', PACKED: 'Packed', OUT_FOR_DELIVERY: 'Out for delivery', RETURN_PICKUP: 'Return pickup', UPCOMING: 'Upcoming', DISPATCHED: 'Dispatched', DELIVERED: 'Delivered', PENDING_RETURN: 'Pending return', COMPLETED: 'Completed', CANCELLED: 'Cancelled', RETURNED: 'Returned', PENDING: 'Pending' } as Record<string, string>)[s] ?? s
// }

// const TH: React.CSSProperties = { padding: '9px 16px', fontSize: 10, fontWeight: 700, color: '#7C7A9A', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', background: '#faf9ff', borderBottom: '1px solid rgba(83,74,183,0.10)', whiteSpace: 'nowrap' }
// const TD: React.CSSProperties = { padding: '14px 16px', fontSize: 13.5, color: '#1E1A4E', borderBottom: '1px solid rgba(83,74,183,0.07)', verticalAlign: 'middle' }

// export function GodownsDetailsPage() {
//   const { id } = useParams()
//   const [searchParams] = useSearchParams()
//   const auth = useAuth()
//   const initialTab = (searchParams.get('tab') as Tab | null) || 'catalog'
//   const [tab, setTab] = useState<Tab>(['catalog', 'stock', 'update'].includes(initialTab) ? initialTab as Tab : 'catalog')
//   const [godown, setGodown] = useState<Godown | null>(null)
//   const [editOpen, setEditOpen] = useState(false)
//   const [editForm, setEditForm] = useState({ name: '', code: '', address: '', mobile: '', location: '', newPassword: '' })
//   const [editSaving, setEditSaving] = useState(false)
//   const [catalog, setCatalog] = useState<CatalogRow[]>([])
//   const [stockRows, setStockRows] = useState<StockAgg[]>([])
//   const [deliveries, setDeliveries] = useState<DeliveryDetailRow[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [catSearch, setCatSearch] = useState('')
//   const [adjustApplyingProductId, setAdjustApplyingProductId] = useState<string | null>(null)
//   // Selected product row for right panel detail
//   const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

//   const load = () => {
//     const token = getToken(); if (!token || !id) return
//     setError(null); setLoading(true)
//     Promise.all([
//       apiFetch<Godown>(`/godowns/${id}`, { token }),
//       apiFetch<CatalogRow[]>(`/godowns/${id}/products`, { token }),
//       apiFetch<Array<{ godownId: string; productId: string; qty: number }>>(`/reports/stock?godownId=${encodeURIComponent(id)}`, { token }).catch(() => []),
//       apiFetch<Array<DeliveryDetailRow>>('/deliveries?limit=200', { token }),
//     ])
//       .then(([g, cat, stockAll, dlv]) => {
//         setGodown(g)
//         setEditForm({ name: g.name, code: g.code || '', address: g.address || '', mobile: g.mobile || '', location: g.location || '', newPassword: '' })
//         setCatalog(cat.sort((a, b) => (a.particulars || '').localeCompare(b.particulars || '')))
//         const fg = stockAll.filter(r => r.godownId === id)
//         setStockRows(fg.map(r => ({ productId: r.productId, qty: r.qty })))
//         setDeliveries(dlv.filter(d => d.fromGodownId === id))
//       })
//       .catch((e: any) => setError(e?.message || 'Failed to load'))
//       .finally(() => setLoading(false))
//   }

//   const reloadStock = () => {
//     const token = getToken(); if (!token || !id) return Promise.resolve()
//     return apiFetch<Array<{ godownId: string; productId: string; qty: number }>>(`/reports/stock?godownId=${encodeURIComponent(id)}`, { token })
//       .then(stockAll => { const fg = stockAll.filter(r => r.godownId === id); setStockRows(fg.map(r => ({ productId: r.productId, qty: r.qty }))) })
//       .catch(() => {})
//   }

//   useEffect(() => { load() }, [id])
//   useEffect(() => {
//     const h1 = () => void reloadStock(), h2 = () => void reloadStock()
//     window.addEventListener('godown-stock-changed', h1)
//     window.addEventListener('focus', h2)
//     return () => { window.removeEventListener('godown-stock-changed', h1); window.removeEventListener('focus', h2) }
//   }, [id])

//   const catalogById = useMemo(() => new Map(catalog.map(c => [c.productId, c])), [catalog])
//   const stockQtyByProductId = useMemo(() => { const m = new Map<string, number>(); for (const r of stockRows) m.set(r.productId, r.qty); return m }, [stockRows])
//   const enabledCatalogRows = useMemo(() => catalog.filter(c => c.enabled), [catalog])
//   const maxStock = useMemo(() => Math.max(...stockRows.map(r => r.qty), 1), [stockRows])
//   const filteredCatalog = useMemo(() => {
//     const q = catSearch.trim().toLowerCase()
//     if (!q) return catalog
//     return catalog.filter(p => (p.particulars || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))
//   }, [catalog, catSearch])

//   // ── Compute out-of-delivery and missing per product ───────────────────────
//   // "Out of delivery" = qty currently dispatched/in active deliveries for this product
//   // "Missing" = dispatched qty that hasn't been returned/confirmed
//   const deliveryStatsByProduct = useMemo(() => {
//     const stats = new Map<string, { outOfDelivery: number; missing: number; deliveries: DeliveryDetailRow[] }>()
//     const activeStatuses = ['PROCESSED', 'PACKED', 'OUT_FOR_DELIVERY', 'DISPATCHED', 'DELIVERED', 'PENDING_RETURN']
//     const missingStatuses = ['PENDING_RETURN', 'DELIVERED']
//     for (const d of deliveries) {
//       if (!d.lines) continue
//       for (const line of d.lines) {
//         if (!line.productId) continue
//         const existing = stats.get(line.productId) ?? { outOfDelivery: 0, missing: 0, deliveries: [] }
//         if (activeStatuses.includes(d.status)) {
//           existing.outOfDelivery += line.qty
//           if (!existing.deliveries.find(x => x.id === d.id)) existing.deliveries.push(d)
//         }
//         if (missingStatuses.includes(d.status)) {
//           existing.missing += line.qty
//         }
//         stats.set(line.productId, existing)
//       }
//     }
//     return stats
//   }, [deliveries])

//   // Stock table rows with out-of-delivery and missing
//   const stockTableRows = useMemo(() => stockRows.map(s => {
//     const p = catalogById.get(s.productId)
//     const dStats = deliveryStatsByProduct.get(s.productId) ?? { outOfDelivery: 0, missing: 0, deliveries: [] }
//     return { productId: s.productId, name: p?.particulars ?? s.productId, sku: p?.sku ?? '—', category: p?.category ?? '—', qty: s.qty, outOfDelivery: dStats.outOfDelivery, missing: dStats.missing, productDeliveries: dStats.deliveries }
//   }), [stockRows, catalogById, deliveryStatsByProduct])

//   // Update stock table rows with out-of-delivery and missing
//   const updateStockRows = useMemo(() => enabledCatalogRows.map(p => {
//     const dStats = deliveryStatsByProduct.get(p.productId) ?? { outOfDelivery: 0, missing: 0, deliveries: [] }
//     return { ...p, qty: stockQtyByProductId.get(p.productId) ?? 0, outOfDelivery: dStats.outOfDelivery, missing: dStats.missing, productDeliveries: dStats.deliveries }
//   }), [enabledCatalogRows, stockQtyByProductId, deliveryStatsByProduct])

//   // Selected product detail for right panel
//   const selectedProductStats = useMemo(() => {
//     if (!selectedProductId) return null
//     const p = catalogById.get(selectedProductId)
//     const dStats = deliveryStatsByProduct.get(selectedProductId) ?? { outOfDelivery: 0, missing: 0, deliveries: [] }
//     return { name: p?.particulars ?? selectedProductId, sku: p?.sku ?? '—', ...dStats }
//   }, [selectedProductId, catalogById, deliveryStatsByProduct])

//   const [adjustDeltaByProduct, setAdjustDeltaByProduct] = useState<Record<string, string>>({})
//   const [adjustNoteByProduct, setAdjustNoteByProduct] = useState<Record<string, string>>({})

//   const canEditGodown = auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || (auth.user.role === 'GODOWN' && auth.user.godownId === id))
//   useEffect(() => { if (tab === 'update' && !canEditGodown) setTab('catalog') }, [tab, canEditGodown])

//   const toggleEnabled = (productId: string, enabled: boolean) => {
//     const token = getToken(); if (!token || !id) return
//     apiFetch(`/godowns/${id}/products`, { token, method: 'PATCH', body: JSON.stringify({ productId, enabled }) })
//       .then(() => setCatalog(prev => prev.map(r => r.productId === productId ? { ...r, enabled } : r)))
//       .catch((e: any) => setError(e?.message || 'Update failed'))
//   }

//   const applyStockAdjustment = (productId: string) => {
//     const token = getToken(); if (!token || !id || !canEditGodown) return
//     const raw = (adjustDeltaByProduct[productId] ?? '').trim()
//     if (!/^-?\d+$/.test(raw)) { setError('Enter a whole number (e.g. 10 or -3).'); return }
//     const qtyDelta = parseInt(raw, 10)
//     if (qtyDelta === 0) { setError('Quantity change cannot be zero.'); return }
//     const note = (adjustNoteByProduct[productId] ?? '').trim()
//     setError(null); setAdjustApplyingProductId(productId)
//     apiFetch<{ ok: boolean; balanceAfter: number }>(`/godowns/${id}/inventory/adjust`, { token, method: 'POST', body: JSON.stringify({ productId, qtyDelta, note: note || undefined }) })
//       .then(() => { setAdjustDeltaByProduct(p => ({ ...p, [productId]: '' })); setAdjustNoteByProduct(p => ({ ...p, [productId]: '' })); return reloadStock() })
//       .catch((e: any) => setError(e?.message || 'Adjustment failed'))
//       .finally(() => setAdjustApplyingProductId(null))
//   }

//   if (!id) return <div style={{ padding: 24 }}>Invalid godown ID.</div>
//   if (loading && !godown) return <div style={{ padding: 24, fontSize: 13, color: '#7C7A9A' }}>Loading…</div>
//   if (error && !godown) return <div style={{ padding: 24 }}><div style={{ padding: '10px 14px', borderRadius: 10, background: '#FCEBEB', color: '#E24B4A', fontSize: 13, marginBottom: 12 }}>{error}</div><Link to="/godowns" style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>← Back</Link></div>
//   if (!godown) return <div style={{ padding: 24, fontSize: 13 }}>Not found. <Link to="/godowns" style={{ color: '#059669', fontWeight: 600 }}>Back</Link></div>

//   const tabBtn = (t: Tab): React.CSSProperties => ({
//     padding: '12px 22px', fontSize: 13.5,
//     fontWeight: tab === t ? 600 : 500,
//     color: tab === t ? '#059669' : '#7C7A9A',
//     border: 'none',
//     borderBottom: tab === t ? '2.5px solid #059669' : '2.5px solid transparent',
//     background: 'transparent',
//     cursor: 'pointer', transition: 'all 0.14s',
//     whiteSpace: 'nowrap', fontFamily: 'inherit',
//   })

//   // Right panel: product delivery detail or empty state
//   const rightPanel = (
//     <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
//       <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(83,74,183,0.10)' }}>
//         <div style={{ fontSize: 15, fontWeight: 700, color: '#1E1A4E' }}>Delivery details</div>
//         <div style={{ fontSize: 11, color: '#7C7A9A', marginTop: 2 }}>Click a row to see delivery breakdown</div>
//       </div>
//       <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
//         {!selectedProductStats ? (
//           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200, color: '#7C7A9A', textAlign: 'center', gap: 10 }}>
//             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CECBF6" strokeWidth="1.5"><path d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><path d="M13 21l2-2 4 4"/><path d="M15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/></svg>
//             <div style={{ fontSize: 12 }}>Select a product row to<br />view delivery details</div>
//           </div>
//         ) : (
//           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
//             {/* Product name */}
//             <div style={{ padding: '10px 14px', background: '#faf9ff', border: '1px solid rgba(83,74,183,0.12)', borderRadius: 10 }}>
//               <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1A4E' }}>{selectedProductStats.name}</div>
//               <div style={{ fontSize: 11, color: '#7C7A9A', fontFamily: 'monospace', marginTop: 2 }}>{selectedProductStats.sku}</div>
//             </div>

//             {/* Stats */}
//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
//               <div style={{ padding: '12px 14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, textAlign: 'center' }}>
//                 <div style={{ fontSize: 22, fontWeight: 800, color: '#C2410C' }}>{selectedProductStats.outOfDelivery}</div>
//                 <div style={{ fontSize: 10, fontWeight: 600, color: '#9A3412', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>Out of delivery</div>
//               </div>
//               <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, textAlign: 'center' }}>
//                 <div style={{ fontSize: 22, fontWeight: 800, color: '#DC2626' }}>{selectedProductStats.missing}</div>
//                 <div style={{ fontSize: 10, fontWeight: 600, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>Missing</div>
//               </div>
//             </div>

//             {/* Active deliveries for this product */}
//             {selectedProductStats.deliveries.length > 0 ? (
//               <>
//                 <div style={{ fontSize: 11, fontWeight: 700, color: '#7C7A9A', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>Active deliveries</div>
//                 {selectedProductStats.deliveries.map(d => (
//                   <Link key={d.id} to={`/deliveries/${d.id}`} style={{ textDecoration: 'none' }}>
//                     <div style={{ background: '#faf9ff', border: '1px solid rgba(83,74,183,0.12)', borderRadius: 10, padding: '10px 12px', transition: 'all 0.14s' }}
//                       onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6ee7b7'; (e.currentTarget as HTMLElement).style.background = '#ecfdf5' }}
//                       onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(83,74,183,0.12)'; (e.currentTarget as HTMLElement).style.background = '#faf9ff' }}
//                     >
//                       <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E1A4E' }}>{d.deliveryNo}</div>
//                       <div style={{ fontSize: 11, color: '#7C7A9A', marginTop: 2 }}>{d.customerName}</div>
//                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 }}>
//                         <div style={{ fontSize: 10.5, color: '#7C7A9A' }}>{formatDateTime(d.deliveryAt)}</div>
//                         <span style={{ ...deliveryBadgeStyle(d.status), fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>{statusLabel(d.status)}</span>
//                       </div>
//                     </div>
//                   </Link>
//                 ))}
//               </>
//             ) : (
//               <div style={{ textAlign: 'center', padding: '16px 0', color: '#7C7A9A', fontSize: 12 }}>No active deliveries for this product.</div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   )

//   return (
//     <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 16 }}>

//       {/* PAGE HEADER */}
//       <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
//         <div>
//           <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E1A4E', margin: 0 }}>{godown.name}</h1>
//           <p style={{ fontSize: 12, color: '#7C7A9A', marginTop: 4, marginBottom: 0 }}>
//             {[godown.code ? `Code: ${godown.code}` : null, godown.location].filter(Boolean).join(' · ') || 'Godown details'}
//           </p>
//         </div>
//         <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
//           {canEditGodown && (
//             <button onClick={() => setEditOpen(true)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(83,74,183,0.20)', background: '#fff', fontSize: 12.5, fontWeight: 500, color: '#059669', cursor: 'pointer' }}>
//               Edit
//             </button>
//           )}
//           <Link to="/godowns" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(5,150,105,0.15)', background: '#fff', fontSize: 12.5, fontWeight: 500, color: '#7C7A9A', textDecoration: 'none' }}>
//             ← Back to list
//           </Link>
//         </div>
//       </div>

//       {/* WAREHOUSE DETAILS CARD */}
//       <div style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.13)', borderRadius: 12, padding: '20px 24px' }}>
//         <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1E1A4E', marginBottom: 18, fontFamily: 'inherit' }}>Warehouse details</h3>
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
//           {[{ label: 'Godown Code', value: godown.code || '—' }, { label: 'Mobile', value: godown.mobile || '—' }, { label: 'Address', value: godown.address || '—' }, { label: 'Location', value: godown.location || '—' }].map(({ label, value }) => (
//             <div key={label}>
//               <div style={{ fontSize: 10, fontWeight: 700, color: '#7C7A9A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{label}</div>
//               <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1E1A4E' }}>{value}</div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FCEBEB', color: '#E24B4A', fontSize: 13, border: '1px solid rgba(226,75,74,0.2)' }}>{error}</div>}

//       {/* TABS + CONTENT CARD */}
//       <div style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.13)', borderRadius: 12, overflow: 'hidden' }}>

//         {/* Tab bar */}
//         <div style={{ display: 'flex', borderBottom: '1px solid rgba(83,74,183,0.12)', background: '#fff' }}>
//         <button style={tabBtn('catalog')} onClick={() => setTab('catalog')}>
//   Product catalog
// </button>

// {canEditGodown && (
//   <button style={tabBtn('update')} onClick={() => setTab('update')}>
//     Update stock
//   </button>
// )}

// <button style={tabBtn('stock')} onClick={() => setTab('stock')}>
//   Stock at godown
// </button>
//         </div>

//         {/* Split grid: left content | right detail panel */}
//         <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 400 }}>

//           {/* LEFT */}
//           <div style={{ borderRight: '1px solid rgba(83,74,183,0.10)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

//             {/* ═══ CATALOG ═══ */}
//             {tab === 'catalog' && <>
//               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid rgba(83,74,183,0.08)' }}>
//                 <div style={{ fontSize: 15, fontWeight: 700, color: '#1E1A4E' }}>
//                   Catalog <span style={{ fontSize: 13, fontWeight: 400, color: '#7C7A9A' }}>(enable for this godown)</span>
//                 </div>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: '1px solid rgba(83,74,183,0.18)', borderRadius: 8, background: '#faf9ff', fontSize: 12, fontWeight: 500, color: '#7C7A9A' }}>
//                   On/off per SKU
//                 </div>
//               </div>
//               <div style={{ padding: '12px 22px', borderBottom: '1px solid rgba(83,74,183,0.06)' }}>
//                 <div style={{ position: 'relative' }}>
//                   <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
//                     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5 21 21" /></svg>
//                   </div>
//                   <input value={catSearch} onChange={e => setCatSearch(e.target.value)} placeholder="Search product or SKU..."
//                     style={{ width: '100%', padding: '9px 14px 9px 36px', border: '1px solid #e8eaf0', borderRadius: 9, fontSize: 13.5, color: '#1E1A4E', background: '#f8fafc', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
//                     onFocus={e => (e.currentTarget.style.borderColor = '#34d399')} onBlur={e => (e.currentTarget.style.borderColor = '#e8eaf0')} />
//                 </div>
//               </div>
//               <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
//                 <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
//                   <colgroup><col style={{ width: '42%' }} /><col style={{ width: '16%' }} /><col style={{ width: '24%' }} /><col style={{ width: '18%' }} /></colgroup>
//                   <thead>
//                     <tr>
//                       <th style={TH}>Product</th><th style={TH}>SKU</th><th style={TH}>Category</th>
//                       <th style={{ ...TH, textAlign: 'center' }}>Enabled</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {filteredCatalog.length === 0 ? (
//                       <tr><td colSpan={4} style={{ ...TD, textAlign: 'center', color: '#7C7A9A', padding: '36px' }}>No products found</td></tr>
//                     ) : filteredCatalog.map(p => (
//                       <tr key={p.productId} onMouseEnter={e => (e.currentTarget.style.background = '#faf9ff')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
//                         <td style={{ ...TD, fontWeight: 500, lineHeight: 1.4 }}>{p.particulars ?? p.productId}</td>
//                         <td style={{ ...TD, whiteSpace: 'nowrap' }}>
//                           <span style={{ fontFamily: 'monospace', fontSize: 11.5, fontWeight: 600, color: '#047857', background: '#ecfdf5', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: 6, display: 'inline-block' }}>{p.sku}</span>
//                         </td>
//                         <td style={{ ...TD, whiteSpace: 'nowrap' }}>
//                           <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: 20, display: 'inline-block', letterSpacing: '0.02em' }}>{p.category}</span>
//                         </td>
//                         <td style={{ ...TD, textAlign: 'center' }}>
//                           <Toggle checked={p.enabled} onChange={v => toggleEnabled(p.productId, v)} />
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </>}

           
//             {/* ═══ UPDATE STOCK ═══ */}
//             {tab === 'update' && <>
//               <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(83,74,183,0.08)' }}>
//                 <div style={{ fontSize: 15, fontWeight: 700, color: '#1E1A4E' }}>Update stock</div>
//                 <div style={{ fontSize: 12, color: '#7C7A9A', marginTop: 2 }}>Adjust quantities for this godown</div>
//               </div>
//               {updateStockRows.length === 0 ? (
//                 <div style={{ padding: '40px 22px', textAlign: 'center', color: '#7C7A9A', fontSize: 13 }}>Turn products On in the Product catalog tab first.</div>
//               ) : (
//                 <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
//                   <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                     <thead>
//                       <tr>
//                         <th style={TH}>Product</th>
//                         <th style={TH}>SKU</th>
//                         <th style={{ ...TH, textAlign: 'right' }}>Current</th>
//                         <th style={{ ...TH, textAlign: 'right', color: '#C2410C' }}>Out of delivery</th>
//                         <th style={{ ...TH, textAlign: 'right', color: '#DC2626' }}>Missing</th>
//                         <th style={{ ...TH, textAlign: 'right' }}> </th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {updateStockRows.map(p => {
//                         const applying = adjustApplyingProductId === p.productId
//                         return (
//                           <tr key={p.productId}
//                             onClick={() => setSelectedProductId(prev => prev === p.productId ? null : p.productId)}
//                             style={{ cursor: 'pointer', background: selectedProductId === p.productId ? '#ecfdf5' : '' }}
//                             onMouseEnter={e => { if (selectedProductId !== p.productId) e.currentTarget.style.background = '#faf9ff' }}
//                             onMouseLeave={e => { if (selectedProductId !== p.productId) e.currentTarget.style.background = '' }}
//                           >
//                             <td style={{ ...TD, fontWeight: 500 }}>{p.particulars ?? p.productId}</td>
//                             <td style={{ ...TD, whiteSpace: 'nowrap' }}><span style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#7C7A9A' }}>{p.sku}</span></td>
//                             <td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: '#059669' }}>{formatNumber(p.qty)}</td>
//                             <td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: '#C2410C' }}>{p.outOfDelivery}</td>
//                             <td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>{p.missing}</td>
//                             <td style={{ ...TD, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
//                               <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
//                                 <input placeholder="+/-" value={adjustDeltaByProduct[p.productId] ?? ''} onChange={e => setAdjustDeltaByProduct(prev => ({ ...prev, [p.productId]: e.target.value }))}
//                                   style={{ width: 60, height: 32, padding: '0 8px', border: '1px solid rgba(83,74,183,0.18)', borderRadius: 7, fontSize: 12, color: '#1E1A4E', background: '#fff', outline: 'none', fontFamily: 'inherit' }} />
//                                 <button disabled={applying} onClick={() => applyStockAdjustment(p.productId)}
//                                   style={{ height: 32, padding: '0 12px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#34d399,#059669)', fontSize: 12, fontWeight: 600, color: '#fff', cursor: applying ? 'not-allowed' : 'pointer' }}>
//                                   {applying ? '…' : 'Apply'}
//                                 </button>
//                               </div>
//                             </td>
//                           </tr>
//                         )
//                       })}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </>}
//              {/* ═══ STOCK ═══ */}
//             {tab === 'stock' && <>
//               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid rgba(83,74,183,0.08)' }}>
//                 <div style={{ fontSize: 15, fontWeight: 700, color: '#1E1A4E' }}>
//                   Stock at godown <span style={{ fontSize: 13, fontWeight: 400, color: '#7C7A9A' }}>(current quantities)</span>
//                 </div>
//                 <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Total: {formatNumber(stockRows.reduce((a, r) => a + r.qty, 0))} units</span>
//               </div>
//               {stockTableRows.length === 0 ? (
//                 <div style={{ padding: '40px 22px', textAlign: 'center', color: '#7C7A9A', fontSize: 13 }}>No stock rows yet.</div>
//               ) : (
//                 <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
//                   {stockTableRows.map(p => (
//                     <div key={p.productId}
//                       onClick={() => setSelectedProductId(prev => prev === p.productId ? null : p.productId)}
//                       style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: `1px solid ${selectedProductId === p.productId ? '#34d399' : 'rgba(83,74,183,0.12)'}`, borderRadius: 9, background: selectedProductId === p.productId ? '#ecfdf5' : '#faf9ff', cursor: 'pointer', transition: 'all 0.14s' }}
//                     >
//                       <div style={{ flex: 1, minWidth: 0 }}>
//                         <div style={{ fontSize: 13, fontWeight: 500, color: '#1E1A4E' }}>{p.name}</div>
//                         <div style={{ fontSize: 10.5, color: '#7C7A9A', marginTop: 1 }}>{p.sku}</div>
//                         <div style={{ height: 4, background: '#ecfdf5', borderRadius: 4, overflow: 'hidden', marginTop: 5 }}>
//                           <div style={{ height: '100%', width: `${Math.round((p.qty / maxStock) * 100)}%`, background: 'linear-gradient(90deg,#34d399,#6ee7b7)', borderRadius: 4 }} />
//                         </div>
//                       </div>
//                       <div style={{ textAlign: 'right', flexShrink: 0 }}>
//                         <div style={{ fontSize: 16, fontWeight: 700, color: '#059669' }}>{formatNumber(p.qty)}</div>
//                         <div style={{ fontSize: 10, color: '#7C7A9A' }}>units</div>
//                       </div>
//                       {/* Out of delivery badge */}
//                       <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 56 }}>
//                         <div style={{ fontSize: 15, fontWeight: 700, color: '#C2410C' }}>{p.outOfDelivery}</div>
//                         <div style={{ fontSize: 9, color: '#9A3412', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Out</div>
//                       </div>
//                       {/* Missing badge */}
//                       <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 56 }}>
//                         <div style={{ fontSize: 15, fontWeight: 700, color: '#DC2626' }}>{p.missing}</div>
//                         <div style={{ fontSize: 9, color: '#991B1B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Missing</div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </>}

//           </div>

//           {/* RIGHT: Delivery detail panel */}
//           <div style={{ display: 'flex', flexDirection: 'column' }}>
//             {rightPanel}
//           </div>
//         </div>
//       </div>

//       {/* EDIT MODAL */}
//       <Modal open={editOpen} title="Edit godown" onClose={() => setEditOpen(false)}
//         footer={
//           <div className="flex justify-end gap-2">
//             <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
//             <Button
//               disabled={editSaving || !editForm.name.trim() || !editForm.code.trim() || (editForm.newPassword.length > 0 && editForm.newPassword.length < 6)}
//               onClick={() => {
//                 const token = getToken(); if (!token || !id) return
//                 setEditSaving(true)
//                 apiFetch<Godown>(`/godowns/${id}`, { token, method: 'PATCH', body: JSON.stringify({ name: editForm.name.trim(), code: editForm.code.trim(), address: editForm.address.trim(), mobile: editForm.mobile.trim(), location: editForm.location.trim(), ...(editForm.newPassword.trim().length >= 6 ? { password: editForm.newPassword } : {}) }) })
//                   .then(g => { setGodown(g); setEditForm(f => ({ ...f, newPassword: '' })); setEditOpen(false) })
//                   .catch((e: any) => setError(e?.message || 'Update failed'))
//                   .finally(() => setEditSaving(false))
//               }}
//             >{editSaving ? 'Saving…' : 'Save'}</Button>
//           </div>
//         }
//       >
//         <div className="space-y-4">
//           <Input label="Godown name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
//           <Input label="Godown code" value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
//           <Input label="Address" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
//           <Input label="Mobile number" value={editForm.mobile} onChange={e => setEditForm(f => ({ ...f, mobile: e.target.value }))} />
//           <Input label="Location" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
//           <Input type="password" label="New password (optional)" value={editForm.newPassword} onChange={e => setEditForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Leave blank to keep current" autoComplete="new-password" />
//         </div>
//       </Modal>
//     </div>
//   )
// }

// import { useEffect, useMemo, useState } from 'react'
// import { Link, useParams, useSearchParams } from 'react-router-dom'
// import { formatDateTime, formatNumber } from '../../lib/format'
// import { Button } from '../../components/ui/Button'
// import { Input } from '../../components/ui/Input'
// import { Modal } from '../../components/ui/Modal'
// import { apiFetch } from '../../lib/api'
// import { getToken, useAuth } from '../../auth/store'
// import type { GodownRow } from './List'

// type Godown = GodownRow
// type CatalogRow = { productId: string; enabled: boolean; particulars?: string; sku?: string; category?: string; rate?: string }
// type StockAgg = { productId: string; qty: number }
// type DeliveryRow = { id: string; deliveryNo: string; customerName: string; siteName?: string; status: string; deliveryAt: string }
// type DeliveryLineRow = { productId: string; godownId?: string; qty: number }
// type DeliveryDetailRow = DeliveryRow & { fromGodownId: string; lines: DeliveryLineRow[] }
// type Tab = 'catalog' | 'stock' | 'update'

// // ── Toggle ────────────────────────────────────────────────────────────────
// function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }} onClick={() => onChange(!checked)}>
//       <div style={{ width: 44, height: 24, borderRadius: 12, background: checked ? '#059669' : '#d1d0d8', transition: 'background 0.2s', display: 'flex', alignItems: 'center', padding: '2px', flexShrink: 0 }}>
//         <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.18)', transform: checked ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
//       </div>
//       <span style={{ fontSize: 11.5, fontWeight: 600, color: checked ? '#059669' : '#7C7A9A', minWidth: 22 }}>{checked ? 'On' : 'Off'}</span>
//     </div>
//   )
// }

// // ── Status badge ──────────────────────────────────────────────────────────
// function deliveryBadgeStyle(status: string): React.CSSProperties {
//   if (status === 'COMPLETED') return { background: '#E1F5EE', color: '#0F6E56' }
//   if (status === 'PROCESSED' || status === 'UPCOMING') return { background: '#ecfdf5', color: '#059669' }
//   if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return { background: '#E1F5EE', color: '#0F6E56' }
//   if (status === 'PENDING_RETURN' || status === 'DELIVERED') return { background: '#FAEEDA', color: '#BA7517' }
//   if (status === 'CANCELLED' || status === 'RETURNED') return { background: '#FCEBEB', color: '#E24B4A' }
//   return { background: '#ecfdf5', color: '#059669' }
// }

// function statusLabel(s: string) {
//   return ({ PROCESSED: 'Processed', PACKED: 'Packed', OUT_FOR_DELIVERY: 'Out for delivery', RETURN_PICKUP: 'Return pickup', UPCOMING: 'Upcoming', DISPATCHED: 'Dispatched', DELIVERED: 'Delivered', PENDING_RETURN: 'Pending return', COMPLETED: 'Completed', CANCELLED: 'Cancelled', RETURNED: 'Returned', PENDING: 'Pending' } as Record<string, string>)[s] ?? s
// }

// const TH: React.CSSProperties = { padding: '9px 16px', fontSize: 10, fontWeight: 700, color: '#7C7A9A', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', background: '#faf9ff', borderBottom: '1px solid rgba(83,74,183,0.10)', whiteSpace: 'nowrap' }
// const TD: React.CSSProperties = { padding: '14px 16px', fontSize: 13.5, color: '#1E1A4E', borderBottom: '1px solid rgba(83,74,183,0.07)', verticalAlign: 'middle' }

// export function GodownsDetailsPage() {
//   const { id } = useParams()
//   const [searchParams] = useSearchParams()
//   const auth = useAuth()
//   const initialTab = (searchParams.get('tab') as Tab | null) || 'catalog'
//   const [tab, setTab] = useState<Tab>(['catalog', 'stock', 'update'].includes(initialTab) ? initialTab as Tab : 'catalog')
//   const [godown, setGodown] = useState<Godown | null>(null)
//   const [editOpen, setEditOpen] = useState(false)
//   const [editForm, setEditForm] = useState({ name: '', code: '', address: '', mobile: '', location: '', newPassword: '' })
//   const [editSaving, setEditSaving] = useState(false)
//   const [catalog, setCatalog] = useState<CatalogRow[]>([])
//   const [stockRows, setStockRows] = useState<StockAgg[]>([])
//   const [deliveries, setDeliveries] = useState<DeliveryDetailRow[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [catSearch, setCatSearch] = useState('')
//   const [adjustApplyingProductId, setAdjustApplyingProductId] = useState<string | null>(null)
//   // Selected product row for right panel detail
//   const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

//   const load = () => {
//     const token = getToken(); if (!token || !id) return
//     setError(null); setLoading(true)
//     Promise.all([
//       apiFetch<Godown>(`/godowns/${id}`, { token }),
//       apiFetch<CatalogRow[]>(`/godowns/${id}/products`, { token }),
//       apiFetch<Array<{ godownId: string; productId: string; qty: number }>>(`/reports/stock?godownId=${encodeURIComponent(id)}`, { token }).catch(() => []),
//       apiFetch<Array<DeliveryDetailRow>>('/deliveries?limit=200', { token }),
//     ])
//       .then(([g, cat, stockAll, dlv]) => {
//         setGodown(g)
//         setEditForm({ name: g.name, code: g.code || '', address: g.address || '', mobile: g.mobile || '', location: g.location || '', newPassword: '' })
//         setCatalog(cat.sort((a, b) => (a.particulars || '').localeCompare(b.particulars || '')))
//         const fg = stockAll.filter(r => r.godownId === id)
//         setStockRows(fg.map(r => ({ productId: r.productId, qty: r.qty })))
//         setDeliveries(dlv.filter(d => d.fromGodownId === id))
//       })
//       .catch((e: any) => setError(e?.message || 'Failed to load'))
//       .finally(() => setLoading(false))
//   }

//   const reloadStock = () => {
//     const token = getToken(); if (!token || !id) return Promise.resolve()
//     return apiFetch<Array<{ godownId: string; productId: string; qty: number }>>(`/reports/stock?godownId=${encodeURIComponent(id)}`, { token })
//       .then(stockAll => { const fg = stockAll.filter(r => r.godownId === id); setStockRows(fg.map(r => ({ productId: r.productId, qty: r.qty }))) })
//       .catch(() => {})
//   }

//   useEffect(() => { load() }, [id])
//   useEffect(() => {
//     const h1 = () => void reloadStock(), h2 = () => void reloadStock()
//     window.addEventListener('godown-stock-changed', h1)
//     window.addEventListener('focus', h2)
//     return () => { window.removeEventListener('godown-stock-changed', h1); window.removeEventListener('focus', h2) }
//   }, [id])

//   const catalogById = useMemo(() => new Map(catalog.map(c => [c.productId, c])), [catalog])
//   const stockQtyByProductId = useMemo(() => { const m = new Map<string, number>(); for (const r of stockRows) m.set(r.productId, r.qty); return m }, [stockRows])
//   const enabledCatalogRows = useMemo(() => catalog.filter(c => c.enabled), [catalog])
//   const maxStock = useMemo(() => Math.max(...stockRows.map(r => r.qty), 1), [stockRows])
//   const filteredCatalog = useMemo(() => {
//     const q = catSearch.trim().toLowerCase()
//     if (!q) return catalog
//     return catalog.filter(p => (p.particulars || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))
//   }, [catalog, catSearch])

//   // ── Compute out-of-delivery and missing per product ───────────────────────
//   // "Out of delivery" = qty currently dispatched/in active deliveries for this product
//   // "Missing" = dispatched qty that hasn't been returned/confirmed
//   const deliveryStatsByProduct = useMemo(() => {
//     const stats = new Map<string, { outOfDelivery: number; missing: number; deliveries: DeliveryDetailRow[] }>()
//     const activeStatuses = ['PROCESSED', 'PACKED', 'OUT_FOR_DELIVERY', 'DISPATCHED', 'DELIVERED', 'PENDING_RETURN']
//     const missingStatuses = ['PENDING_RETURN', 'DELIVERED']
//     for (const d of deliveries) {
//       if (!d.lines) continue
//       for (const line of d.lines) {
//         if (!line.productId) continue
//         const existing = stats.get(line.productId) ?? { outOfDelivery: 0, missing: 0, deliveries: [] }
//         if (activeStatuses.includes(d.status)) {
//           existing.outOfDelivery += line.qty
//           if (!existing.deliveries.find(x => x.id === d.id)) existing.deliveries.push(d)
//         }
//         if (missingStatuses.includes(d.status)) {
//           existing.missing += line.qty
//         }
//         stats.set(line.productId, existing)
//       }
//     }
//     return stats
//   }, [deliveries])

//   // Stock table rows with out-of-delivery and missing
//   const stockTableRows = useMemo(() => stockRows.map(s => {
//     const p = catalogById.get(s.productId)
//     const dStats = deliveryStatsByProduct.get(s.productId) ?? { outOfDelivery: 0, missing: 0, deliveries: [] }
//     return { productId: s.productId, name: p?.particulars ?? s.productId, sku: p?.sku ?? '—', category: p?.category ?? '—', qty: s.qty, outOfDelivery: dStats.outOfDelivery, missing: dStats.missing, productDeliveries: dStats.deliveries }
//   }), [stockRows, catalogById, deliveryStatsByProduct])

//   // Update stock table rows with out-of-delivery and missing
//   const updateStockRows = useMemo(() => enabledCatalogRows.map(p => {
//     const dStats = deliveryStatsByProduct.get(p.productId) ?? { outOfDelivery: 0, missing: 0, deliveries: [] }
//     return { ...p, qty: stockQtyByProductId.get(p.productId) ?? 0, outOfDelivery: dStats.outOfDelivery, missing: dStats.missing, productDeliveries: dStats.deliveries }
//   }), [enabledCatalogRows, stockQtyByProductId, deliveryStatsByProduct])

//   // Selected product detail for right panel
//   const selectedProductStats = useMemo(() => {
//     if (!selectedProductId) return null
//     const p = catalogById.get(selectedProductId)
//     const dStats = deliveryStatsByProduct.get(selectedProductId) ?? { outOfDelivery: 0, missing: 0, deliveries: [] }
//     return { name: p?.particulars ?? selectedProductId, sku: p?.sku ?? '—', ...dStats }
//   }, [selectedProductId, catalogById, deliveryStatsByProduct])

//   const [adjustDeltaByProduct, setAdjustDeltaByProduct] = useState<Record<string, string>>({})
//   const [adjustNoteByProduct, setAdjustNoteByProduct] = useState<Record<string, string>>({})

//   const canEditGodown = auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || (auth.user.role === 'GODOWN' && auth.user.godownId === id))
//   useEffect(() => { if (tab === 'update' && !canEditGodown) setTab('catalog') }, [tab, canEditGodown])

//   const toggleEnabled = (productId: string, enabled: boolean) => {
//     const token = getToken(); if (!token || !id) return
//     apiFetch(`/godowns/${id}/products`, { token, method: 'PATCH', body: JSON.stringify({ productId, enabled }) })
//       .then(() => setCatalog(prev => prev.map(r => r.productId === productId ? { ...r, enabled } : r)))
//       .catch((e: any) => setError(e?.message || 'Update failed'))
//   }

//   const applyStockAdjustment = (productId: string) => {
//     const token = getToken(); if (!token || !id || !canEditGodown) return
//     const raw = (adjustDeltaByProduct[productId] ?? '').trim()
//     if (!/^-?\d+$/.test(raw)) { setError('Enter a whole number (e.g. 10 or -3).'); return }
//     const qtyDelta = parseInt(raw, 10)
//     if (qtyDelta === 0) { setError('Quantity change cannot be zero.'); return }
//     const note = (adjustNoteByProduct[productId] ?? '').trim()
//     setError(null); setAdjustApplyingProductId(productId)
//     apiFetch<{ ok: boolean; balanceAfter: number }>(`/godowns/${id}/inventory/adjust`, { token, method: 'POST', body: JSON.stringify({ productId, qtyDelta, note: note || undefined }) })
//       .then(() => { setAdjustDeltaByProduct(p => ({ ...p, [productId]: '' })); setAdjustNoteByProduct(p => ({ ...p, [productId]: '' })); return reloadStock() })
//       .catch((e: any) => setError(e?.message || 'Adjustment failed'))
//       .finally(() => setAdjustApplyingProductId(null))
//   }

//   if (!id) return <div style={{ padding: 24 }}>Invalid godown ID.</div>
//   if (loading && !godown) return <div style={{ padding: 24, fontSize: 13, color: '#7C7A9A' }}>Loading…</div>
//   if (error && !godown) return <div style={{ padding: 24 }}><div style={{ padding: '10px 14px', borderRadius: 10, background: '#FCEBEB', color: '#E24B4A', fontSize: 13, marginBottom: 12 }}>{error}</div><Link to="/godowns" style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>← Back</Link></div>
//   if (!godown) return <div style={{ padding: 24, fontSize: 13 }}>Not found. <Link to="/godowns" style={{ color: '#059669', fontWeight: 600 }}>Back</Link></div>

//   const tabBtn = (t: Tab): React.CSSProperties => ({
//     padding: '12px 22px', fontSize: 13.5,
//     fontWeight: tab === t ? 600 : 500,
//     color: tab === t ? '#059669' : '#7C7A9A',
//     border: 'none',
//     borderBottom: tab === t ? '2.5px solid #059669' : '2.5px solid transparent',
//     background: 'transparent',
//     cursor: 'pointer', transition: 'all 0.14s',
//     whiteSpace: 'nowrap', fontFamily: 'inherit',
//   })

//   // Right panel: product delivery detail or empty state
//   const rightPanel = (
//     <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
//       <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(83,74,183,0.10)' }}>
//         <div style={{ fontSize: 15, fontWeight: 700, color: '#1E1A4E' }}>Delivery details</div>
//         <div style={{ fontSize: 11, color: '#7C7A9A', marginTop: 2 }}>Click a row to see delivery breakdown</div>
//       </div>
//       <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
//         {!selectedProductStats ? (
//           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200, color: '#7C7A9A', textAlign: 'center', gap: 10 }}>
//             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CECBF6" strokeWidth="1.5"><path d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><path d="M13 21l2-2 4 4"/><path d="M15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/></svg>
//             <div style={{ fontSize: 12 }}>Select a product row to<br />view delivery details</div>
//           </div>
//         ) : (
//           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
//             {/* Product name */}
//             <div style={{ padding: '10px 14px', background: '#faf9ff', border: '1px solid rgba(83,74,183,0.12)', borderRadius: 10 }}>
//               <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1A4E' }}>{selectedProductStats.name}</div>
//               <div style={{ fontSize: 11, color: '#7C7A9A', fontFamily: 'monospace', marginTop: 2 }}>{selectedProductStats.sku}</div>
//             </div>

//             {/* Stats */}
//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
//               <div style={{ padding: '12px 14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, textAlign: 'center' }}>
//                 <div style={{ fontSize: 22, fontWeight: 800, color: '#C2410C' }}>{selectedProductStats.outOfDelivery}</div>
//                 <div style={{ fontSize: 10, fontWeight: 600, color: '#9A3412', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>Out of delivery</div>
//               </div>
//               <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, textAlign: 'center' }}>
//                 <div style={{ fontSize: 22, fontWeight: 800, color: '#DC2626' }}>{selectedProductStats.missing}</div>
//                 <div style={{ fontSize: 10, fontWeight: 600, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>Missing</div>
//               </div>
//             </div>

//             {/* Active deliveries for this product */}
//             {selectedProductStats.deliveries.length > 0 ? (
//               <>
//                 <div style={{ fontSize: 11, fontWeight: 700, color: '#7C7A9A', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>Active deliveries</div>
//                 {selectedProductStats.deliveries.map(d => (
//                   <Link key={d.id} to={`/deliveries/${d.id}`} style={{ textDecoration: 'none' }}>
//                     <div style={{ background: '#faf9ff', border: '1px solid rgba(83,74,183,0.12)', borderRadius: 10, padding: '10px 12px', transition: 'all 0.14s' }}
//                       onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6ee7b7'; (e.currentTarget as HTMLElement).style.background = '#ecfdf5' }}
//                       onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(83,74,183,0.12)'; (e.currentTarget as HTMLElement).style.background = '#faf9ff' }}
//                     >
//                       <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E1A4E' }}>{d.deliveryNo}</div>
//                       <div style={{ fontSize: 11, color: '#7C7A9A', marginTop: 2 }}>{d.customerName}</div>
//                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 }}>
//                         <div style={{ fontSize: 10.5, color: '#7C7A9A' }}>{formatDateTime(d.deliveryAt)}</div>
//                         <span style={{ ...deliveryBadgeStyle(d.status), fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>{statusLabel(d.status)}</span>
//                       </div>
//                     </div>
//                   </Link>
//                 ))}
//               </>
//             ) : (
//               <div style={{ textAlign: 'center', padding: '16px 0', color: '#7C7A9A', fontSize: 12 }}>No active deliveries for this product.</div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   )

//   return (
//     <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 16 }}>

//       {/* PAGE HEADER */}
//       <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
//         <div>
//           <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E1A4E', margin: 0 }}>{godown.name}</h1>
//           <p style={{ fontSize: 12, color: '#7C7A9A', marginTop: 4, marginBottom: 0 }}>
//             {[godown.code ? `Code: ${godown.code}` : null, godown.location].filter(Boolean).join(' · ') || 'Godown details'}
//           </p>
//         </div>
//         <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
//           {canEditGodown && (
//             <button onClick={() => setEditOpen(true)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(83,74,183,0.20)', background: '#fff', fontSize: 12.5, fontWeight: 500, color: '#059669', cursor: 'pointer' }}>
//               Edit
//             </button>
//           )}
//           <Link to="/godowns" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(5,150,105,0.15)', background: '#fff', fontSize: 12.5, fontWeight: 500, color: '#7C7A9A', textDecoration: 'none' }}>
//             ← Back to list
//           </Link>
//         </div>
//       </div>

//       {/* WAREHOUSE DETAILS CARD */}
//       <div style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.13)', borderRadius: 12, padding: '20px 24px' }}>
//         <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1E1A4E', marginBottom: 18, fontFamily: 'inherit' }}>Warehouse details</h3>
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
//           {[{ label: 'Godown Code', value: godown.code || '—' }, { label: 'Mobile', value: godown.mobile || '—' }, { label: 'Address', value: godown.address || '—' }, { label: 'Location', value: godown.location || '—' }].map(({ label, value }) => (
//             <div key={label}>
//               <div style={{ fontSize: 10, fontWeight: 700, color: '#7C7A9A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{label}</div>
//               <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1E1A4E' }}>{value}</div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FCEBEB', color: '#E24B4A', fontSize: 13, border: '1px solid rgba(226,75,74,0.2)' }}>{error}</div>}

//       {/* TABS + CONTENT CARD */}
//       <div style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.13)', borderRadius: 12, overflow: 'hidden' }}>

//         {/* Tab bar */}
//         <div style={{ display: 'flex', borderBottom: '1px solid rgba(83,74,183,0.12)', background: '#fff' }}>
//         <button style={tabBtn('catalog')} onClick={() => setTab('catalog')}>
//   Product catalog
// </button>

// {canEditGodown && (
//   <button style={tabBtn('update')} onClick={() => setTab('update')}>
//     Update stock
//   </button>
// )}

// <button style={tabBtn('stock')} onClick={() => setTab('stock')}>
//   Stock at godown
// </button>
//         </div>

//         {/* Split grid: left content | right detail panel */}
//         <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 400 }}>

//           {/* LEFT */}
//           <div style={{ borderRight: '1px solid rgba(83,74,183,0.10)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

//             {/* ═══ CATALOG ═══ */}
//             {tab === 'catalog' && <>
//               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid rgba(83,74,183,0.08)' }}>
//                 <div style={{ fontSize: 15, fontWeight: 700, color: '#1E1A4E' }}>
//                   Catalog <span style={{ fontSize: 13, fontWeight: 400, color: '#7C7A9A' }}>(enable for this godown)</span>
//                 </div>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: '1px solid rgba(83,74,183,0.18)', borderRadius: 8, background: '#faf9ff', fontSize: 12, fontWeight: 500, color: '#7C7A9A' }}>
//                   On/off per SKU
//                 </div>
//               </div>
//               <div style={{ padding: '12px 22px', borderBottom: '1px solid rgba(83,74,183,0.06)' }}>
//                 <div style={{ position: 'relative' }}>
//                   <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
//                     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5 21 21" /></svg>
//                   </div>
//                   <input value={catSearch} onChange={e => setCatSearch(e.target.value)} placeholder="Search product or SKU..."
//                     style={{ width: '100%', padding: '9px 14px 9px 36px', border: '1px solid #e8eaf0', borderRadius: 9, fontSize: 13.5, color: '#1E1A4E', background: '#f8fafc', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
//                     onFocus={e => (e.currentTarget.style.borderColor = '#34d399')} onBlur={e => (e.currentTarget.style.borderColor = '#e8eaf0')} />
//                 </div>
//               </div>
//               <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
//                 <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
//                   <colgroup><col style={{ width: '42%' }} /><col style={{ width: '16%' }} /><col style={{ width: '24%' }} /><col style={{ width: '18%' }} /></colgroup>
//                   <thead>
//                     <tr>
//                       <th style={TH}>Product</th><th style={TH}>SKU</th><th style={TH}>Category</th>
//                       <th style={{ ...TH, textAlign: 'center' }}>Enabled</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {filteredCatalog.length === 0 ? (
//                       <tr><td colSpan={4} style={{ ...TD, textAlign: 'center', color: '#7C7A9A', padding: '36px' }}>No products found</td></tr>
//                     ) : filteredCatalog.map(p => (
//                       <tr key={p.productId} onMouseEnter={e => (e.currentTarget.style.background = '#faf9ff')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
//                         <td style={{ ...TD, fontWeight: 500, lineHeight: 1.4 }}>{p.particulars ?? p.productId}</td>
//                         <td style={{ ...TD, whiteSpace: 'nowrap' }}>
//                           <span style={{ fontFamily: 'monospace', fontSize: 11.5, fontWeight: 600, color: '#047857', background: '#ecfdf5', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: 6, display: 'inline-block' }}>{p.sku}</span>
//                         </td>
//                         <td style={{ ...TD, whiteSpace: 'nowrap' }}>
//                           <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: 20, display: 'inline-block', letterSpacing: '0.02em' }}>{p.category}</span>
//                         </td>
//                         <td style={{ ...TD, textAlign: 'center' }}>
//                           <Toggle checked={p.enabled} onChange={v => toggleEnabled(p.productId, v)} />
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </>}

           
//             {/* ═══ UPDATE STOCK ═══ */}
//             {tab === 'update' && <>
//               <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(83,74,183,0.08)' }}>
//                 <div style={{ fontSize: 15, fontWeight: 700, color: '#1E1A4E' }}>Update stock</div>
//                 <div style={{ fontSize: 12, color: '#7C7A9A', marginTop: 2 }}>Adjust quantities for this godown</div>
//               </div>
//               {updateStockRows.length === 0 ? (
//                 <div style={{ padding: '40px 22px', textAlign: 'center', color: '#7C7A9A', fontSize: 13 }}>Turn products On in the Product catalog tab first.</div>
//               ) : (
//                 <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
//                   <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                     <thead>
//                       <tr>
//                         <th style={TH}>Product</th>
//                         <th style={TH}>SKU</th>
//                         <th style={{ ...TH, textAlign: 'right' }}>Current</th>
//                         <th style={{ ...TH, textAlign: 'right', color: '#C2410C' }}>Out of delivery</th>
//                         <th style={{ ...TH, textAlign: 'right', color: '#DC2626' }}>Missing</th>
//                         <th style={{ ...TH, textAlign: 'right' }}> </th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {updateStockRows.map(p => {
//                         const applying = adjustApplyingProductId === p.productId
//                         return (
//                           <tr key={p.productId}
//                             onClick={() => setSelectedProductId(prev => prev === p.productId ? null : p.productId)}
//                             style={{ cursor: 'pointer', background: selectedProductId === p.productId ? '#ecfdf5' : '' }}
//                             onMouseEnter={e => { if (selectedProductId !== p.productId) e.currentTarget.style.background = '#faf9ff' }}
//                             onMouseLeave={e => { if (selectedProductId !== p.productId) e.currentTarget.style.background = '' }}
//                           >
//                             <td style={{ ...TD, fontWeight: 500 }}>{p.particulars ?? p.productId}</td>
//                             <td style={{ ...TD, whiteSpace: 'nowrap' }}><span style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#7C7A9A' }}>{p.sku}</span></td>
//                             <td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: '#059669' }}>{formatNumber(p.qty)}</td>
//                             <td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: '#C2410C' }}>{p.outOfDelivery}</td>
//                             <td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>{p.missing}</td>
//                             <td style={{ ...TD, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
//                               <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
//                                 <input placeholder="+/-" value={adjustDeltaByProduct[p.productId] ?? ''} onChange={e => setAdjustDeltaByProduct(prev => ({ ...prev, [p.productId]: e.target.value }))}
//                                   style={{ width: 60, height: 32, padding: '0 8px', border: '1px solid rgba(83,74,183,0.18)', borderRadius: 7, fontSize: 12, color: '#1E1A4E', background: '#fff', outline: 'none', fontFamily: 'inherit' }} />
//                                 <button disabled={applying} onClick={() => applyStockAdjustment(p.productId)}
//                                   style={{ height: 32, padding: '0 12px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#34d399,#059669)', fontSize: 12, fontWeight: 600, color: '#fff', cursor: applying ? 'not-allowed' : 'pointer' }}>
//                                   {applying ? '…' : 'Apply'}
//                                 </button>
//                               </div>
//                             </td>
//                           </tr>
//                         )
//                       })}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </>}
//              {/* ═══ STOCK ═══ */}
//             {tab === 'stock' && <>
//               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid rgba(83,74,183,0.08)' }}>
//                 <div style={{ fontSize: 15, fontWeight: 700, color: '#1E1A4E' }}>
//                   Stock at godown <span style={{ fontSize: 13, fontWeight: 400, color: '#7C7A9A' }}>(current quantities)</span>
//                 </div>
//                 <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Total: {formatNumber(stockRows.reduce((a, r) => a + r.qty, 0))} units</span>
//               </div>
//               {stockTableRows.length === 0 ? (
//                 <div style={{ padding: '40px 22px', textAlign: 'center', color: '#7C7A9A', fontSize: 13 }}>No stock rows yet.</div>
//               ) : (
//                 <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
//                   {stockTableRows.map(p => (
//                     <div key={p.productId}
//                       onClick={() => setSelectedProductId(prev => prev === p.productId ? null : p.productId)}
//                       style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: `1px solid ${selectedProductId === p.productId ? '#34d399' : 'rgba(83,74,183,0.12)'}`, borderRadius: 9, background: selectedProductId === p.productId ? '#ecfdf5' : '#faf9ff', cursor: 'pointer', transition: 'all 0.14s' }}
//                     >
//                       <div style={{ flex: 1, minWidth: 0 }}>
//                         <div style={{ fontSize: 13, fontWeight: 500, color: '#1E1A4E' }}>{p.name}</div>
//                         <div style={{ fontSize: 10.5, color: '#7C7A9A', marginTop: 1 }}>{p.sku}</div>
//                         <div style={{ height: 4, background: '#ecfdf5', borderRadius: 4, overflow: 'hidden', marginTop: 5 }}>
//                           <div style={{ height: '100%', width: `${Math.round((p.qty / maxStock) * 100)}%`, background: 'linear-gradient(90deg,#34d399,#6ee7b7)', borderRadius: 4 }} />
//                         </div>
//                       </div>
//                       <div style={{ textAlign: 'right', flexShrink: 0 }}>
//                         <div style={{ fontSize: 16, fontWeight: 700, color: '#059669' }}>{formatNumber(p.qty)}</div>
//                         <div style={{ fontSize: 10, color: '#7C7A9A' }}>units</div>
//                       </div>
//                       {/* Out of delivery badge */}
//                       <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 56 }}>
//                         <div style={{ fontSize: 15, fontWeight: 700, color: '#C2410C' }}>{p.outOfDelivery}</div>
//                         <div style={{ fontSize: 9, color: '#9A3412', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Out</div>
//                       </div>
//                       {/* Missing badge */}
//                       <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 56 }}>
//                         <div style={{ fontSize: 15, fontWeight: 700, color: '#DC2626' }}>{p.missing}</div>
//                         <div style={{ fontSize: 9, color: '#991B1B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Missing</div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </>}

//           </div>

//           {/* RIGHT: Delivery detail panel */}
//           <div style={{ display: 'flex', flexDirection: 'column' }}>
//             {rightPanel}
//           </div>
//         </div>
//       </div>

//       {/* EDIT MODAL */}
//       <Modal open={editOpen} title="Edit godown" onClose={() => setEditOpen(false)}
//         footer={
//           <div className="flex justify-end gap-2">
//             <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
//             <Button
//               disabled={editSaving || !editForm.name.trim() || !editForm.code.trim() || (editForm.newPassword.length > 0 && editForm.newPassword.length < 6)}
//               onClick={() => {
//                 const token = getToken(); if (!token || !id) return
//                 setEditSaving(true)
//                 apiFetch<Godown>(`/godowns/${id}`, { token, method: 'PATCH', body: JSON.stringify({ name: editForm.name.trim(), code: editForm.code.trim(), address: editForm.address.trim(), mobile: editForm.mobile.trim(), location: editForm.location.trim(), ...(editForm.newPassword.trim().length >= 6 ? { password: editForm.newPassword } : {}) }) })
//                   .then(g => { setGodown(g); setEditForm(f => ({ ...f, newPassword: '' })); setEditOpen(false) })
//                   .catch((e: any) => setError(e?.message || 'Update failed'))
//                   .finally(() => setEditSaving(false))
//               }}
//             >{editSaving ? 'Saving…' : 'Save'}</Button>
//           </div>
//         }
//       >
//         <div className="space-y-4">
//           <Input label="Godown name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
//           <Input label="Godown code" value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
//           <Input label="Address" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
//           <Input label="Mobile number" value={editForm.mobile} onChange={e => setEditForm(f => ({ ...f, mobile: e.target.value }))} />
//           <Input label="Location" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
//           <Input type="password" label="New password (optional)" value={editForm.newPassword} onChange={e => setEditForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Leave blank to keep current" autoComplete="new-password" />
//         </div>
//       </Modal>
//     </div>
//   )
// }

// // import { useEffect, useMemo, useState } from 'react'
// // import { Link, useParams, useSearchParams } from 'react-router-dom'
// // import { formatDateTime, formatNumber } from '../../lib/format'
// // import { Badge } from '../../components/ui/Badge'
// // import { Button } from '../../components/ui/Button'
// // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // import { Input } from '../../components/ui/Input'
// // import { Modal } from '../../components/ui/Modal'
// // import { PageHeader } from '../../components/ui/PageHeader'
// // import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
// // import { apiFetch } from '../../lib/api'
// // import { getToken, useAuth } from '../../auth/store'
// // import type { GodownRow } from './List'

// // type Godown = GodownRow

// // type CatalogRow = {
// //   productId: string
// //   enabled: boolean
// //   particulars?: string
// //   sku?: string
// //   category?: string
// //   rate?: string
// // }

// // type StockAgg = { productId: string; qty: number }

// // type DeliveryRow = {
// //   id: string
// //   deliveryNo: string
// //   customerName: string
// //   siteName?: string
// //   status: string
// //   deliveryAt: string
// // }

// // type Tab = 'catalog' | 'stock' | 'update'

// // export function GodownsDetailsPage() {
// //   const { id } = useParams()
// //   const [searchParams] = useSearchParams()
// //   const auth = useAuth()
// //   const initialTab = (searchParams.get('tab') as Tab | null) || 'catalog'
// //   const [tab, setTab] = useState<Tab>(
// //     initialTab === 'stock' || initialTab === 'update' || initialTab === 'catalog' ? initialTab : 'catalog',
// //   )
// //   const [godown, setGodown] = useState<Godown | null>(null)
// //   const [editOpen, setEditOpen] = useState(false)
// //   const [editForm, setEditForm] = useState({
// //     name: '',
// //     code: '',
// //     address: '',
// //     mobile: '',
// //     location: '',
// //     newPassword: '',
// //   })
// //   const [editSaving, setEditSaving] = useState(false)
// //   const [catalog, setCatalog] = useState<CatalogRow[]>([])
// //   const [stockRows, setStockRows] = useState<StockAgg[]>([])
// //   const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
// //   const [loading, setLoading] = useState(true)
// //   const [error, setError] = useState<string | null>(null)
// //   const [adjustDeltaByProduct, setAdjustDeltaByProduct] = useState<Record<string, string>>({})
// //   const [adjustNoteByProduct, setAdjustNoteByProduct] = useState<Record<string, string>>({})
// //   const [adjustApplyingProductId, setAdjustApplyingProductId] = useState<string | null>(null)

// //   const load = () => {
// //     const token = getToken()
// //     if (!token || !id) return
// //     setError(null)
// //     setLoading(true)
// //     Promise.all([
// //       apiFetch<Godown>(`/godowns/${id}`, { token }),
// //       apiFetch<CatalogRow[]>(`/godowns/${id}/products`, { token }),
// //       apiFetch<Array<{ godownId: string; productId: string; qty: number }>>(`/reports/stock?godownId=${encodeURIComponent(id)}`, {
// //         token,
// //       }).catch(() => []),
// //       apiFetch<Array<DeliveryRow & { fromGodownId: string }>>('/deliveries?limit=200', { token }),
// //     ])
// //       .then(([g, cat, stockAll, dlv]) => {
// //         setGodown(g)
// //         setEditForm({
// //           name: g.name,
// //           code: g.code || '',
// //           address: g.address || '',
// //           mobile: g.mobile || '',
// //           location: g.location || '',
// //           newPassword: '',
// //         })
// //         setCatalog(cat.sort((a, b) => (a.particulars || '').localeCompare(b.particulars || '')))
// //         const forGodown = stockAll.filter((r) => r.godownId === id)
// //         setStockRows(forGodown.map((r) => ({ productId: r.productId, qty: r.qty })))
// //         setDeliveries(
// //           dlv
// //             .filter((d) => d.fromGodownId === id)
// //             .slice(0, 8)
// //             .map((d) => ({
// //               id: d.id,
// //               deliveryNo: d.deliveryNo,
// //               customerName: d.customerName,
// //               siteName: d.siteName,
// //               status: d.status,
// //               deliveryAt: d.deliveryAt,
// //             })),
// //         )
// //       })
// //       .catch((e: any) => setError(e?.message || 'Failed to load'))
// //       .finally(() => setLoading(false))
// //   }

// //   const reloadStock = () => {
// //     const token = getToken()
// //     if (!token || !id) return Promise.resolve()
// //     return apiFetch<Array<{ godownId: string; productId: string; qty: number }>>(
// //       `/reports/stock?godownId=${encodeURIComponent(id)}`,
// //       { token },
// //     )
// //       .then((stockAll) => {
// //         const forGodown = stockAll.filter((r) => r.godownId === id)
// //         setStockRows(forGodown.map((r) => ({ productId: r.productId, qty: r.qty })))
// //       })
// //       .catch(() => {})
// //   }

// //   useEffect(() => {
// //     load()
// //   }, [id])

// //   useEffect(() => {
// //     const onStockChanged = () => {
// //       void reloadStock()
// //     }
// //     const onFocus = () => {
// //       void reloadStock()
// //     }
// //     window.addEventListener('godown-stock-changed', onStockChanged)
// //     window.addEventListener('focus', onFocus)
// //     return () => {
// //       window.removeEventListener('godown-stock-changed', onStockChanged)
// //       window.removeEventListener('focus', onFocus)
// //     }
// //   }, [id])

// //   const catalogById = useMemo(() => new Map(catalog.map((c) => [c.productId, c])), [catalog])

// //   const stockQtyByProductId = useMemo(() => {
// //     const m = new Map<string, number>()
// //     for (const r of stockRows) m.set(r.productId, r.qty)
// //     return m
// //   }, [stockRows])

// //   const enabledCatalogRows = useMemo(
// //     () => catalog.filter((c) => c.enabled).sort((a, b) => (a.particulars || '').localeCompare(b.particulars || '')),
// //     [catalog],
// //   )

// //   const stockTableRows = useMemo(() => {
// //     return stockRows.map((s) => {
// //       const p = catalogById.get(s.productId)
// //       return {
// //         productId: s.productId,
// //         name: p?.particulars ?? s.productId,
// //         sku: p?.sku ?? '—',
// //         category: p?.category ?? '—',
// //         qty: s.qty,
// //       }
// //     })
// //   }, [stockRows, catalogById])

// //   const canEditGodown =
// //     auth.status === 'authenticated' &&
// //     (auth.user.role === 'ADMIN' || (auth.user.role === 'GODOWN' && auth.user.godownId === id))

// //   useEffect(() => {
// //     if (tab === 'update' && !canEditGodown) setTab('catalog')
// //   }, [tab, canEditGodown])

// //   const toggleEnabled = (productId: string, enabled: boolean) => {
// //     const token = getToken()
// //     if (!token || !id) return
// //     apiFetch(`/godowns/${id}/products`, {
// //       token,
// //       method: 'PATCH',
// //       body: JSON.stringify({ productId, enabled }),
// //     })
// //       .then(() => {
// //         setCatalog((prev) => prev.map((r) => (r.productId === productId ? { ...r, enabled } : r)))
// //       })
// //       .catch((e: any) => setError(e?.message || 'Update failed'))
// //   }

// //   const applyStockAdjustment = (productId: string) => {
// //     const token = getToken()
// //     if (!token || !id || !canEditGodown) return
// //     const raw = (adjustDeltaByProduct[productId] ?? '').trim()
// //     if (!/^-?\d+$/.test(raw)) {
// //       setError('Enter a whole number for quantity change (e.g. 10 or -3).')
// //       return
// //     }
// //     const qtyDelta = Number.parseInt(raw, 10)
// //     if (qtyDelta === 0) {
// //       setError('Quantity change cannot be zero.')
// //       return
// //     }
// //     const note = (adjustNoteByProduct[productId] ?? '').trim()
// //     setError(null)
// //     setAdjustApplyingProductId(productId)
// //     apiFetch<{ ok: boolean; balanceAfter: number }>(`/godowns/${id}/inventory/adjust`, {
// //       token,
// //       method: 'POST',
// //       body: JSON.stringify({ productId, qtyDelta, note: note || undefined }),
// //     })
// //       .then(() => {
// //         setAdjustDeltaByProduct((prev) => ({ ...prev, [productId]: '' }))
// //         setAdjustNoteByProduct((prev) => ({ ...prev, [productId]: '' }))
// //         return reloadStock()
// //       })
// //       .catch((e: any) => setError(e?.message || 'Adjustment failed'))
// //       .finally(() => setAdjustApplyingProductId(null))
// //   }

// //   if (!id) {
// //     return (
// //       <div>
// //         <PageHeader title="Invalid" subtitle="Missing godown id." />
// //       </div>
// //     )
// //   }

// //   if (loading && !godown) {
// //     return (
// //       <div>
// //         <PageHeader title="Godown" subtitle="Loading…" />
// //         <div className="text-sm text-slate-600">Loading…</div>
// //       </div>
// //     )
// //   }

// //   if (error && !godown) {
// //     return (
// //       <div>
// //         <PageHeader title="Godown" subtitle="Could not load." right={<Link to="/godowns" className="text-sm font-semibold text-slate-900">Back</Link>} />
// //         <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
// //       </div>
// //     )
// //   }

// //   if (!godown) {
// //     return (
// //       <div>
// //         <PageHeader title="Godown not found" subtitle="Please go back to the list." right={<Link to="/godowns" className="text-sm font-semibold text-slate-900">Back</Link>} />
// //         <EmptyState title="Missing godown" subtitle="This godown does not exist." />
// //       </div>
// //     )
// //   }

// //   return (
// //     <div>
// //       <PageHeader
// //         title={godown.name}
// //         subtitle={[godown.code ? `Code: ${godown.code}` : null, godown.location].filter(Boolean).join(' · ') || 'Godown details'}
// //         right={
// //           <div className="flex flex-wrap items-center gap-3">
          
// //             <Link to="/godowns" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
// //               Back to list
// //             </Link>
// //           </div>
// //         }
// //       />

// //       <Modal
// //         open={editOpen}
// //         title="Edit godown"
// //         onClose={() => setEditOpen(false)}
// //         footer={
// //           <div className="flex justify-end gap-2">
// //             <Button variant="secondary" onClick={() => setEditOpen(false)}>
// //               Cancel
// //             </Button>
// //             <Button
// //               disabled={
// //                 editSaving ||
// //                 !editForm.name.trim() ||
// //                 !editForm.code.trim() ||
// //                 (editForm.newPassword.length > 0 && editForm.newPassword.length < 6)
// //               }
// //               onClick={() => {
// //                 const token = getToken()
// //                 if (!token || !id) return
// //                 setEditSaving(true)
// //                 apiFetch<Godown>(`/godowns/${id}`, {
// //                   token,
// //                   method: 'PATCH',
// //                   body: JSON.stringify({
// //                     name: editForm.name.trim(),
// //                     code: editForm.code.trim(),
// //                     address: editForm.address.trim(),
// //                     mobile: editForm.mobile.trim(),
// //                     location: editForm.location.trim(),
// //                     ...(editForm.newPassword.trim().length >= 6
// //                       ? { password: editForm.newPassword }
// //                       : {}),
// //                   }),
// //                 })
// //                   .then((g) => {
// //                     setGodown(g)
// //                     setEditForm((f) => ({ ...f, newPassword: '' }))
// //                     setEditOpen(false)
// //                   })
// //                   .catch((e: any) => setError(e?.message || 'Update failed'))
// //                   .finally(() => setEditSaving(false))
// //               }}
// //             >
// //               {editSaving ? 'Saving…' : 'Save'}
// //             </Button>
// //           </div>
// //         }
// //       >
// //         <div className="space-y-4">
// //           <Input label="Godown name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
// //           <Input
// //             label="Godown code"
// //             value={editForm.code}
// //             onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
// //           />
// //           <Input label="Address" value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />
// //           <Input
// //             label="Mobile number"
// //             value={editForm.mobile}
// //             onChange={(e) => setEditForm((f) => ({ ...f, mobile: e.target.value }))}
// //             inputMode="tel"
// //             autoComplete="tel"
// //           />
// //           <Input label="Location" value={editForm.location} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} />
// //           <Input
// //             type="password"
// //             label="New godown password (optional)"
// //             value={editForm.newPassword}
// //             onChange={(e) => setEditForm((f) => ({ ...f, newPassword: e.target.value }))}
// //             placeholder="Leave blank to keep current"
// //             autoComplete="new-password"
// //             hint="Leave blank to keep the current password."
// //           />
// //         </div>
// //       </Modal>

// //       <Card className="mb-4">
// //         <CardHeader>
// //           <CardTitle>Warehouse details</CardTitle>
// //         </CardHeader>
// //         <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
// //           <div>
// //             <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Godown code</div>
// //             <div className="font-mono font-semibold text-slate-900">{godown.code || '—'}</div>
// //           </div>
// //           <div>
// //             <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mobile</div>
// //             <div className="text-slate-900">{godown.mobile || '—'}</div>
// //           </div>
// //           <div className="sm:col-span-2">
// //             <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</div>
// //             <div className="text-slate-900">{godown.address || '—'}</div>
// //           </div>
// //           <div className="sm:col-span-2">
// //             <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</div>
// //             <div className="text-slate-900">{godown.location || '—'}</div>
// //           </div>
// //         </CardContent>
// //       </Card>

// //       {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

// //       <div className="mb-4 flex flex-wrap gap-2">
// //         <button
// //           type="button"
// //           onClick={() => setTab('catalog')}
// //           className={
// //             tab === 'catalog'
// //               ? 'rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white'
// //               : 'rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200'
// //           }
// //         >
// //           Product catalog
// //         </button>
// //         <button
// //           type="button"
// //           onClick={() => setTab('stock')}
// //           className={
// //             tab === 'stock'
// //               ? 'rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white'
// //               : 'rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200'
// //           }
// //         >
// //           Stock at godown
// //         </button>
// //         {canEditGodown ? (
// //           <button
// //             type="button"
// //             onClick={() => setTab('update')}
// //             className={
// //               tab === 'update'
// //                 ? 'rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white'
// //                 : 'rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200'
// //             }
// //           >
// //             Update stock
// //           </button>
// //         ) : null}
// //       </div>

// //       <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
// //         <Card className="lg:col-span-2">
// //           <CardHeader className="flex items-center justify-between">
// //             <CardTitle>
// //               {tab === 'catalog'
// //                 ? 'Catalog (enable for this godown)'
// //                 : tab === 'stock'
// //                   ? canEditGodown
// //                     ? 'Stock at godown (view & adjust)'
// //                     : 'Stock at godown'
// //                   : 'Update stock'}
// //             </CardTitle>
// //             <Badge variant="slate">
// //               {tab === 'catalog'
// //                 ? 'On/off per SKU'
// //                 : tab === 'stock'
// //                   ? canEditGodown
// //                     ? 'Ledger · adjust here'
// //                     : 'Ledger'
// //                   : 'Delta → ledger'}
// //             </Badge>
// //           </CardHeader>
// //           <CardContent>
// //             {tab === 'catalog' ? (
// //               catalog.length === 0 ? (
// //                 <EmptyState title="No products" subtitle="Products will appear here once synced." />
// //               ) : (
// //                 <Table>
// //                   <thead>
// //                     <tr>
// //                       <Th>Product</Th>
// //                       <Th>SKU</Th>
// //                       <Th>Category</Th>
// //                       <Th className="text-right">Enabled</Th>
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     {catalog.map((p) => (
// //                       <tr key={p.productId} className="hover:bg-slate-50">
// //                         <Td className="font-semibold text-slate-900">{p.particulars ?? p.productId}</Td>
// //                         <Td className="font-mono text-xs text-slate-600">{p.sku}</Td>
// //                         <Td>{p.category}</Td>
// //                         <Td className="text-right">
// //                           <Button size="sm" variant={p.enabled ? 'secondary' : 'primary'} onClick={() => toggleEnabled(p.productId, !p.enabled)}>
// //                             {p.enabled ? 'On' : 'Off'}
// //                           </Button>
// //                         </Td>
// //                       </tr>
// //                     ))}
// //                   </tbody>
// //                 </Table>
// //               )
// //             ) : tab === 'stock' ? (
// //               stockTableRows.length === 0 ? (
// //                 <EmptyState title="No stock rows" subtitle="Ledger may be empty until transfers or scans post inventory." />
// //               ) : (
// //                 <Table>
// //                   <thead>
// //                     <tr>
// //                       <Th>Product</Th>
// //                       <Th>SKU</Th>
// //                       <Th>Category</Th>
// //                       <Th className="text-right">Qty</Th>
// //                       {canEditGodown ? (
// //                         <>
// //                           <Th>Change (+/−)</Th>
// //                           <Th>Note</Th>
// //                           <Th className="text-right"> </Th>
// //                         </>
// //                       ) : null}
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     {stockTableRows.map((p) => {
// //                       const catalogRow = catalogById.get(p.productId)
// //                       const canAdjustThis = catalogRow?.enabled === true
// //                       const applying = adjustApplyingProductId === p.productId
// //                       return (
// //                         <tr key={p.productId} className="hover:bg-slate-50">
// //                           <Td className="font-semibold text-slate-900">{p.name}</Td>
// //                           <Td className="font-mono text-xs text-slate-600">{p.sku}</Td>
// //                           <Td>{p.category}</Td>
// //                           <Td className="text-right font-semibold">{formatNumber(p.qty)}</Td>
// //                           {canEditGodown ? (
// //                             <>
// //                               <Td className="min-w-[7rem]">
// //                                 <Input
// //                                   className="h-9"
// //                                   inputMode="numeric"
// //                                   placeholder="e.g. 10"
// //                                   disabled={!canAdjustThis}
// //                                   title={!canAdjustThis ? 'Turn this product On in the Product catalog tab to post adjustments.' : undefined}
// //                                   value={adjustDeltaByProduct[p.productId] ?? ''}
// //                                   onChange={(e) =>
// //                                     setAdjustDeltaByProduct((prev) => ({ ...prev, [p.productId]: e.target.value }))
// //                                   }
// //                                 />
// //                               </Td>
// //                               <Td className="min-w-[8rem]">
// //                                 <Input
// //                                   className="h-9"
// //                                   placeholder="Optional"
// //                                   disabled={!canAdjustThis}
// //                                   value={adjustNoteByProduct[p.productId] ?? ''}
// //                                   onChange={(e) =>
// //                                     setAdjustNoteByProduct((prev) => ({ ...prev, [p.productId]: e.target.value }))
// //                                   }
// //                                 />
// //                               </Td>
// //                               <Td className="text-right">
// //                                 <Button
// //                                   size="sm"
// //                                   variant="primary"
// //                                   disabled={applying || !canAdjustThis}
// //                                   title={!canAdjustThis ? 'Enable product in catalog first' : undefined}
// //                                   onClick={() => applyStockAdjustment(p.productId)}
// //                                 >
// //                                   {applying ? '…' : 'Apply'}
// //                                 </Button>
// //                               </Td>
// //                             </>
// //                           ) : null}
// //                         </tr>
// //                       )
// //                     })}
// //                   </tbody>
// //                 </Table>
// //               )
// //             ) : enabledCatalogRows.length === 0 ? (
// //               <EmptyState
// //                 title="No enabled products"
// //                 subtitle="Turn products On in the Product catalog tab, then enter quantity changes here."
// //               />
// //             ) : (
// //               <Table>
// //                 <thead>
// //                   <tr>
// //                     <Th>Product</Th>
// //                     <Th>SKU</Th>
// //                     <Th>Category</Th>
// //                     <Th className="text-right">Current</Th>
// //                     <Th>Change (+/−)</Th>
// //                     <Th>Note</Th>
// //                     <Th className="text-right"> </Th>
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   {enabledCatalogRows.map((p) => {
// //                     const applying = adjustApplyingProductId === p.productId
// //                     return (
// //                       <tr key={p.productId} className="hover:bg-slate-50">
// //                         <Td className="font-semibold text-slate-900">{p.particulars ?? p.productId}</Td>
// //                         <Td className="font-mono text-xs text-slate-600">{p.sku}</Td>
// //                         <Td>{p.category}</Td>
// //                         <Td className="text-right font-semibold">{formatNumber(stockQtyByProductId.get(p.productId) ?? 0)}</Td>
// //                         <Td className="min-w-[7rem]">
// //                           <Input
// //                             className="h-9"
// //                             inputMode="numeric"
// //                             placeholder="e.g. 10"
// //                             value={adjustDeltaByProduct[p.productId] ?? ''}
// //                             onChange={(e) =>
// //                               setAdjustDeltaByProduct((prev) => ({ ...prev, [p.productId]: e.target.value }))
// //                             }
// //                           />
// //                         </Td>
// //                         <Td className="min-w-[8rem]">
// //                           <Input
// //                             className="h-9"
// //                             placeholder="Optional"
// //                             value={adjustNoteByProduct[p.productId] ?? ''}
// //                             onChange={(e) =>
// //                               setAdjustNoteByProduct((prev) => ({ ...prev, [p.productId]: e.target.value }))
// //                             }
// //                           />
// //                         </Td>
// //                         <Td className="text-right">
// //                           <Button
// //                             size="sm"
// //                             variant="primary"
// //                             disabled={applying}
// //                             onClick={() => applyStockAdjustment(p.productId)}
// //                           >
// //                             {applying ? '…' : 'Apply'}
// //                           </Button>
// //                         </Td>
// //                       </tr>
// //                     )
// //                   })}
// //                 </tbody>
// //               </Table>
// //             )}
// //           </CardContent>
// //         </Card>

// //         <Card>
// //           <CardHeader>
// //             <CardTitle>Recent deliveries</CardTitle>
// //           </CardHeader>
// //           <CardContent className="space-y-3">
// //             {deliveries.length === 0 ? (
// //               <div className="text-sm text-slate-600">No deliveries yet.</div>
// //             ) : (
// //               deliveries.map((d) => (
// //                 <div key={d.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
// //                   <div className="flex items-start justify-between gap-3">
// //                     <div className="min-w-0">
// //                       <div className="truncate text-sm font-semibold text-slate-900">{d.deliveryNo}</div>
// //                       <div className="mt-1 text-xs text-slate-600">{d.customerName}</div>
// //                       <div className="truncate text-xs text-slate-500">{d.siteName || '—'}</div>
// //                     </div>
// //                     <Badge
// //                       variant={
// //                         d.status === 'OUT_FOR_DELIVERY' || d.status === 'DISPATCHED'
// //                           ? 'green'
// //                           : d.status === 'PROCESSED' || d.status === 'UPCOMING'
// //                             ? 'blue'
// //                             : d.status === 'PENDING_RETURN'
// //                               ? 'amber'
// //                               : 'slate'
// //                       }
// //                     >
// //                       {d.status}
// //                     </Badge>
// //                   </div>
// //                   <div className="mt-2 text-xs text-slate-500">{formatDateTime(d.deliveryAt)}</div>
// //                   <div className="mt-2">
// //                     <Link to={`/deliveries/${d.id}`} className="text-xs font-semibold text-slate-900 hover:text-slate-700">
// //                       Details
// //                     </Link>
// //                   </div>
// //                 </div>
// //               ))
// //             )}
// //           </CardContent>
// //         </Card>
// //       </div>
// //     </div>
// //   )
// // }

// import { useEffect, useMemo, useState } from 'react'
// import { Link, useParams, useSearchParams } from 'react-router-dom'
// import { formatDateTime, formatNumber } from '../../lib/format'
// import { Button } from '../../components/ui/Button'
// import { Input } from '../../components/ui/Input'
// import { Modal } from '../../components/ui/Modal'
// import { apiFetch } from '../../lib/api'
// import { getToken, useAuth } from '../../auth/store'
// import type { GodownRow } from './List'

// type Godown = GodownRow
// type CatalogRow = { productId: string; enabled: boolean; particulars?: string; sku?: string; category?: string; rate?: string }
// type StockAgg = { productId: string; qty: number }
// type DeliveryRow = { id: string; deliveryNo: string; customerName: string; siteName?: string; status: string; deliveryAt: string }
// type Tab = 'catalog' | 'stock' | 'update'

// // ── Toggle ────────────────────────────────────────────────────────────────
// function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }} onClick={() => onChange(!checked)}>
//       <div style={{
//         width: 44, height: 24, borderRadius: 12,
//         background: checked ? '#059669' : '#d1d0d8',
//         transition: 'background 0.2s',
//         display: 'flex', alignItems: 'center', padding: '2px', flexShrink: 0,
//       }}>
//         <div style={{
//           width: 20, height: 20, borderRadius: '50%', background: '#fff',
//           boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
//           transform: checked ? 'translateX(20px)' : 'translateX(0)',
//           transition: 'transform 0.2s',
//         }} />
//       </div>
//       <span style={{ fontSize: 11.5, fontWeight: 600, color: checked ? '#059669' : '#7C7A9A', minWidth: 22 }}>
//         {checked ? 'On' : 'Off'}
//       </span>
//     </div>
//   )
// }

// // ── Status badge ──────────────────────────────────────────────────────────
// function deliveryBadgeStyle(status: string): React.CSSProperties {
//   if (status === 'COMPLETED') return { background: '#E1F5EE', color: '#0F6E56' }
//   if (status === 'PROCESSED' || status === 'UPCOMING') return { background: '#ecfdf5', color: '#059669' }
//   if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return { background: '#E1F5EE', color: '#0F6E56' }
//   if (status === 'PENDING_RETURN' || status === 'DELIVERED') return { background: '#FAEEDA', color: '#BA7517' }
//   if (status === 'CANCELLED' || status === 'RETURNED') return { background: '#FCEBEB', color: '#E24B4A' }
//   return { background: '#ecfdf5', color: '#059669' }
// }

// function statusLabel(s: string) {
//   return ({ PROCESSED:'Processed',PACKED:'Packed',OUT_FOR_DELIVERY:'Out for delivery',
//     RETURN_PICKUP:'Return pickup',UPCOMING:'Upcoming',DISPATCHED:'Dispatched',
//     DELIVERED:'Delivered',PENDING_RETURN:'Pending return',COMPLETED:'Completed',
//     CANCELLED:'Cancelled',RETURNED:'Returned',PENDING:'Pending' } as Record<string,string>)[s] ?? s
// }

// // ── Shared cell styles ─────────────────────────────────────────────────────
// const TH: React.CSSProperties = {
//   padding: '9px 16px', fontSize: 10, fontWeight: 700, color: '#7C7A9A',
//   textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left',
//   background: '#faf9ff', borderBottom: '1px solid rgba(83,74,183,0.10)',
//   whiteSpace: 'nowrap',
// }
// const TD: React.CSSProperties = {
//   padding: '14px 16px', fontSize: 13.5, color: '#1E1A4E',
//   borderBottom: '1px solid rgba(83,74,183,0.07)', verticalAlign: 'middle',
// }

// // ── Main ──────────────────────────────────────────────────────────────────
// export function GodownsDetailsPage() {
//   const { id } = useParams()
//   const [searchParams] = useSearchParams()
//   const auth = useAuth()
//   const initialTab = (searchParams.get('tab') as Tab | null) || 'catalog'
//   const [tab, setTab] = useState<Tab>(
//     ['catalog','stock','update'].includes(initialTab) ? initialTab as Tab : 'catalog'
//   )
//   const [godown, setGodown] = useState<Godown | null>(null)
//   const [editOpen, setEditOpen] = useState(false)
//   const [editForm, setEditForm] = useState({ name:'', code:'', address:'', mobile:'', location:'', newPassword:'' })
//   const [editSaving, setEditSaving] = useState(false)
//   const [catalog, setCatalog] = useState<CatalogRow[]>([])
//   const [stockRows, setStockRows] = useState<StockAgg[]>([])
//   const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [catSearch, setCatSearch] = useState('')
//   const [adjustDeltaByProduct, setAdjustDeltaByProduct] = useState<Record<string,string>>({})
//   const [adjustNoteByProduct, setAdjustNoteByProduct] = useState<Record<string,string>>({})
//   const [adjustApplyingProductId, setAdjustApplyingProductId] = useState<string | null>(null)

//   const load = () => {
//     const token = getToken(); if (!token || !id) return
//     setError(null); setLoading(true)
//     Promise.all([
//       apiFetch<Godown>(`/godowns/${id}`, { token }),
//       apiFetch<CatalogRow[]>(`/godowns/${id}/products`, { token }),
//       apiFetch<Array<{ godownId: string; productId: string; qty: number }>>(`/reports/stock?godownId=${encodeURIComponent(id)}`, { token }).catch(() => []),
//       apiFetch<Array<DeliveryRow & { fromGodownId: string }>>('/deliveries?limit=200', { token }),
//     ])
//       .then(([g, cat, stockAll, dlv]) => {
//         setGodown(g)
//         setEditForm({ name: g.name, code: g.code||'', address: g.address||'', mobile: g.mobile||'', location: g.location||'', newPassword: '' })
//         setCatalog(cat.sort((a,b) => (a.particulars||'').localeCompare(b.particulars||'')))
//         const fg = stockAll.filter(r => r.godownId === id)
//         setStockRows(fg.map(r => ({ productId: r.productId, qty: r.qty })))
//         setDeliveries(dlv.filter(d => d.fromGodownId === id).slice(0,8).map(d => ({ id:d.id, deliveryNo:d.deliveryNo, customerName:d.customerName, siteName:d.siteName, status:d.status, deliveryAt:d.deliveryAt })))
//       })
//       .catch((e:any) => setError(e?.message||'Failed to load'))
//       .finally(() => setLoading(false))
//   }

//   const reloadStock = () => {
//     const token = getToken(); if (!token || !id) return Promise.resolve()
//     return apiFetch<Array<{ godownId: string; productId: string; qty: number }>>(`/reports/stock?godownId=${encodeURIComponent(id)}`, { token })
//       .then(stockAll => { const fg = stockAll.filter(r => r.godownId===id); setStockRows(fg.map(r=>({productId:r.productId,qty:r.qty}))) })
//       .catch(()=>{})
//   }

//   useEffect(() => { load() }, [id])
//   useEffect(() => {
//     const h1 = () => void reloadStock(), h2 = () => void reloadStock()
//     window.addEventListener('godown-stock-changed', h1)
//     window.addEventListener('focus', h2)
//     return () => { window.removeEventListener('godown-stock-changed', h1); window.removeEventListener('focus', h2) }
//   }, [id])

//   const catalogById = useMemo(() => new Map(catalog.map(c=>[c.productId,c])), [catalog])
//   const stockQtyByProductId = useMemo(() => { const m = new Map<string,number>(); for (const r of stockRows) m.set(r.productId,r.qty); return m }, [stockRows])
//   const enabledCatalogRows = useMemo(() => catalog.filter(c=>c.enabled), [catalog])
//   const stockTableRows = useMemo(() => stockRows.map(s => { const p=catalogById.get(s.productId); return { productId:s.productId, name:p?.particulars??s.productId, sku:p?.sku??'—', category:p?.category??'—', qty:s.qty } }), [stockRows, catalogById])
//   const maxStock = useMemo(() => Math.max(...stockRows.map(r=>r.qty), 1), [stockRows])
//   const filteredCatalog = useMemo(() => {
//     const q = catSearch.trim().toLowerCase()
//     if (!q) return catalog
//     return catalog.filter(p => (p.particulars||'').toLowerCase().includes(q) || (p.sku||'').toLowerCase().includes(q))
//   }, [catalog, catSearch])

//   const canEditGodown = auth.status==='authenticated' && (auth.user.role==='ADMIN' || (auth.user.role==='GODOWN' && auth.user.godownId===id))
//   useEffect(() => { if (tab==='update' && !canEditGodown) setTab('catalog') }, [tab, canEditGodown])

//   const toggleEnabled = (productId: string, enabled: boolean) => {
//     const token = getToken(); if (!token||!id) return
//     apiFetch(`/godowns/${id}/products`, { token, method:'PATCH', body:JSON.stringify({productId,enabled}) })
//       .then(() => setCatalog(prev=>prev.map(r=>r.productId===productId?{...r,enabled}:r)))
//       .catch((e:any) => setError(e?.message||'Update failed'))
//   }

//   const applyStockAdjustment = (productId: string) => {
//     const token = getToken(); if (!token||!id||!canEditGodown) return
//     const raw = (adjustDeltaByProduct[productId]??'').trim()
//     if (!/^-?\d+$/.test(raw)) { setError('Enter a whole number (e.g. 10 or -3).'); return }
//     const qtyDelta = parseInt(raw, 10)
//     if (qtyDelta===0) { setError('Quantity change cannot be zero.'); return }
//     const note = (adjustNoteByProduct[productId]??'').trim()
//     setError(null); setAdjustApplyingProductId(productId)
//     apiFetch<{ok:boolean;balanceAfter:number}>(`/godowns/${id}/inventory/adjust`, { token, method:'POST', body:JSON.stringify({productId,qtyDelta,note:note||undefined}) })
//       .then(() => { setAdjustDeltaByProduct(p=>({...p,[productId]:''})); setAdjustNoteByProduct(p=>({...p,[productId]:''})); return reloadStock() })
//       .catch((e:any) => setError(e?.message||'Adjustment failed'))
//       .finally(() => setAdjustApplyingProductId(null))
//   }

//   if (!id) return <div style={{padding:24}}>Invalid godown ID.</div>
//   if (loading && !godown) return <div style={{padding:24,fontSize:13,color:'#7C7A9A'}}>Loading…</div>
//   if (error && !godown) return <div style={{padding:24}}><div style={{padding:'10px 14px',borderRadius:10,background:'#FCEBEB',color:'#E24B4A',fontSize:13,marginBottom:12}}>{error}</div><Link to="/godowns" style={{fontSize:13,color:'#059669',fontWeight:600}}>← Back</Link></div>
//   if (!godown) return <div style={{padding:24,fontSize:13}}>Not found. <Link to="/godowns" style={{color:'#059669',fontWeight:600}}>Back</Link></div>

//   const tabBtn = (t: Tab): React.CSSProperties => ({
//     padding: '12px 22px', fontSize: 13.5,
//     fontWeight: tab===t ? 600 : 500,
//     color: tab===t ? '#059669' : '#7C7A9A',
//     border: 'none',
//     borderBottom: tab===t ? '2.5px solid #059669' : '2.5px solid transparent',
//     background: 'transparent',
//     cursor: 'pointer', transition: 'all 0.14s',
//     whiteSpace: 'nowrap', fontFamily: 'inherit',
//   })

//   return (
//     <div style={{ fontFamily:'inherit', display:'flex', flexDirection:'column', gap:16 }}>

//       {/* PAGE HEADER */}
//       <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
//         <div>
//           <h1 style={{ fontSize:22, fontWeight:700, color:'#1E1A4E', margin:0 }}>{godown.name}</h1>
//           <p style={{ fontSize:12, color:'#7C7A9A', marginTop:4, marginBottom:0 }}>
//             {[godown.code?`Code: ${godown.code}`:null, godown.location].filter(Boolean).join(' · ')||'Godown details'}
//           </p>
//         </div>
//         <div style={{ display:'flex', gap:8, alignItems:'center' }}>
//           {canEditGodown && (
//             <button onClick={() => setEditOpen(true)} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid rgba(83,74,183,0.20)', background:'#fff', fontSize:12.5, fontWeight:500, color:'#059669', cursor:'pointer' }}>
//               Edit
//             </button>
//           )}
//           <Link to="/godowns" style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 16px', borderRadius:8, border:'1px solid rgba(5,150,105,0.15)', background:'#fff', fontSize:12.5, fontWeight:500, color:'#7C7A9A', textDecoration:'none' }}>
//             ← Back to list
//           </Link>
//         </div>
//       </div>

//       {/* WAREHOUSE DETAILS CARD */}
//       <div style={{ background:'#fff', border:'1px solid rgba(5,150,105,0.13)', borderRadius:12, padding:'20px 24px' }}>
//         <h3 style={{ fontSize:15, fontWeight:600, color:'#1E1A4E', marginBottom:18, fontFamily:'inherit' }}>Warehouse details</h3>
//         <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
//           {[{label:'Godown Code',value:godown.code||'—'},{label:'Mobile',value:godown.mobile||'—'},{label:'Address',value:godown.address||'—'},{label:'Location',value:godown.location||'—'}].map(({label,value}) => (
//             <div key={label}>
//               <div style={{ fontSize:10, fontWeight:700, color:'#7C7A9A', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{label}</div>
//               <div style={{ fontSize:13.5, fontWeight:600, color:'#1E1A4E' }}>{value}</div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {error && <div style={{ padding:'10px 14px', borderRadius:10, background:'#FCEBEB', color:'#E24B4A', fontSize:13, border:'1px solid rgba(226,75,74,0.2)' }}>{error}</div>}

//       {/* TABS + CONTENT CARD */}
//       <div style={{ background:'#fff', border:'1px solid rgba(5,150,105,0.13)', borderRadius:12, overflow:'hidden' }}>

//         {/* Tab bar — same style as design image */}
//         <div style={{ display:'flex', borderBottom:'1px solid rgba(83,74,183,0.12)', background:'#fff' }}>
//           <button style={tabBtn('catalog')} onClick={() => setTab('catalog')}>Product catalog</button>
//           <button style={tabBtn('stock')} onClick={() => setTab('stock')}>Stock at godown</button>
//           {canEditGodown && <button style={tabBtn('update')} onClick={() => setTab('update')}>Update stock</button>}
//         </div>

//         {/* Split grid: left content | right recent deliveries */}
//         <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', minHeight:400 }}>

//           {/* LEFT */}
//           <div style={{ borderRight:'1px solid rgba(83,74,183,0.10)', display:'flex', flexDirection:'column', minWidth:0 }}>

//             {/* ═══ CATALOG ═══ */}
//             {tab==='catalog' && <>
//               {/* sub-header */}
//               <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 22px', borderBottom:'1px solid rgba(83,74,183,0.08)' }}>
//                 <div style={{ fontSize:15, fontWeight:700, color:'#1E1A4E' }}>
//                   Catalog <span style={{ fontSize:13, fontWeight:400, color:'#7C7A9A' }}>(enable for this godown)</span>
//                 </div>
//                 <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', border:'1px solid rgba(83,74,183,0.18)', borderRadius:8, background:'#faf9ff', fontSize:12, fontWeight:500, color:'#7C7A9A' }}>
//                   On/off per SKU
//                 </div>
//               </div>

//               {/* search */}
//               <div style={{ padding:'12px 22px', borderBottom:'1px solid rgba(83,74,183,0.06)' }}>
//                 <div style={{ position:'relative' }}>
//                   <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
//                     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5 21 21"/></svg>
//                   </div>
//                   <input
//                     value={catSearch} onChange={e=>setCatSearch(e.target.value)}
//                     placeholder="Search product or SKU..."
//                     style={{ width:'100%', padding:'9px 14px 9px 36px', border:'1px solid #e8eaf0', borderRadius:9, fontSize:13.5, color:'#1E1A4E', background:'#f8fafc', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
//                     onFocus={e=>(e.currentTarget.style.borderColor='#34d399')}
//                     onBlur={e=>(e.currentTarget.style.borderColor='#e8eaf0')}
//                   />
//                 </div>
//               </div>

//               {/* table — key fix: table-layout fixed + nowrap on all cells */}
//               <div style={{ flex:1, overflowY:'auto', overflowX:'auto' }}>
//                 <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
//                   <colgroup>
//                     <col style={{ width:'42%' }} />
//                     <col style={{ width:'16%' }} />
//                     <col style={{ width:'24%' }} />
//                     <col style={{ width:'18%' }} />
//                   </colgroup>
//                   <thead>
//                     <tr>
//                       <th style={TH}>Product</th>
//                       <th style={TH}>SKU</th>
//                       <th style={TH}>Category</th>
//                       <th style={{ ...TH, textAlign:'center' }}>Enabled</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {filteredCatalog.length===0 ? (
//                       <tr><td colSpan={4} style={{ ...TD, textAlign:'center', color:'#7C7A9A', padding:'36px' }}>No products found</td></tr>
//                     ) : filteredCatalog.map(p => (
//                       <tr key={p.productId}
//                         onMouseEnter={e=>(e.currentTarget.style.background='#faf9ff')}
//                         onMouseLeave={e=>(e.currentTarget.style.background='')}
//                       >
//                         {/* PRODUCT — allow wrapping only here */}
//                         <td style={{ ...TD, fontWeight:500, lineHeight:1.4 }}>{p.particulars??p.productId}</td>

//                         {/* SKU — monospace pill, no wrap */}
//                         <td style={{ ...TD, whiteSpace:'nowrap' }}>
//                           <span style={{ fontFamily:'monospace', fontSize:11.5, fontWeight:600, color:'#047857', background:'#ecfdf5', border:'1px solid #bbf7d0', padding:'3px 8px', borderRadius:6, display:'inline-block' }}>
//                             {p.sku}
//                           </span>
//                         </td>

//                         {/* CATEGORY — pill badge, no wrap */}
//                         <td style={{ ...TD, whiteSpace:'nowrap' }}>
//                           <span style={{ fontSize:11, fontWeight:700, color:'#059669', background:'#ecfdf5', border:'1px solid #a7f3d0', padding:'3px 10px', borderRadius:20, display:'inline-block', letterSpacing:'0.02em', whiteSpace:'nowrap' }}>
//                             {p.category}
//                           </span>
//                         </td>

//                         {/* TOGGLE — centered */}
//                         <td style={{ ...TD, textAlign:'center' }}>
//                           <Toggle checked={p.enabled} onChange={v=>toggleEnabled(p.productId,v)} />
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </>}

//             {/* ═══ STOCK ═══ */}
//             {tab==='stock' && <>
//               <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 22px', borderBottom:'1px solid rgba(83,74,183,0.08)' }}>
//                 <div style={{ fontSize:15, fontWeight:700, color:'#1E1A4E' }}>
//                   Stock at godown <span style={{ fontSize:13, fontWeight:400, color:'#7C7A9A' }}>(current quantities)</span>
//                 </div>
//                 <span style={{ fontSize:12, color:'#059669', fontWeight:600 }}>Total: {formatNumber(stockRows.reduce((a,r)=>a+r.qty,0))} units</span>
//               </div>
//               {stockTableRows.length===0 ? (
//                 <div style={{ padding:'40px 22px', textAlign:'center', color:'#7C7A9A', fontSize:13 }}>No stock rows yet.</div>
//               ) : (
//                 <div style={{ flex:1, overflowY:'auto', padding:'14px 18px', display:'flex', flexDirection:'column', gap:10 }}>
//                   {stockTableRows.map(p => {
//                     const canAdjustThis = catalogById.get(p.productId)?.enabled === true
//                     return (
//                     <div key={p.productId} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', border:'1px solid rgba(83,74,183,0.12)', borderRadius:9, background:'#faf9ff', transition:'border-color 0.12s' }}
//                       onMouseEnter={e=>(e.currentTarget.style.borderColor='#6ee7b7')}
//                       onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(83,74,183,0.12)')}
//                     >
//                       <div style={{ flex:1, minWidth:0 }}>
//                         <div style={{ fontSize:13, fontWeight:500, color:'#1E1A4E' }}>{p.name}</div>
//                         <div style={{ fontSize:10.5, color:'#7C7A9A', marginTop:1 }}>{p.sku}</div>
//                         <div style={{ height:4, background:'#ecfdf5', borderRadius:4, overflow:'hidden', marginTop:5 }}>
//                           <div style={{ height:'100%', width:`${Math.round((p.qty/maxStock)*100)}%`, background:'linear-gradient(90deg,#34d399,#6ee7b7)', borderRadius:4 }} />
//                         </div>
//                       </div>
//                       <div style={{ textAlign:'right', flexShrink:0 }}>
//                         <div style={{ fontSize:16, fontWeight:700, color:'#059669' }}>{formatNumber(p.qty)}</div>
//                         <div style={{ fontSize:10, color:'#7C7A9A' }}>units</div>
//                       </div>
//                       {canEditGodown && (
//                         <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
//                           <input
//                             value={adjustDeltaByProduct[p.productId]??''}
//                             onChange={e=>setAdjustDeltaByProduct(prev=>({...prev,[p.productId]:e.target.value}))}
//                             placeholder="+/-"
//                             disabled={!canAdjustThis}
//                             title={!canAdjustThis ? 'Enable this product in the Product catalog tab first' : undefined}
//                             style={{ width:60, height:32, padding:'0 8px', border:'1px solid rgba(83,74,183,0.18)', borderRadius:7, fontSize:12, color:'#1E1A4E', background: canAdjustThis ? '#fff' : '#f1f5f9', outline:'none', fontFamily:'inherit', cursor: canAdjustThis ? 'text' : 'not-allowed' }}
//                           />
//                           <button
//                             disabled={adjustApplyingProductId===p.productId || !canAdjustThis}
//                             onClick={()=>applyStockAdjustment(p.productId)}
//                             title={!canAdjustThis ? 'Enable this product in the Product catalog tab first' : undefined}
//                             style={{ height:32, padding:'0 12px', borderRadius:7, border:'none', background: canAdjustThis ? '#059669' : '#94a3b8', fontSize:12, fontWeight:600, color:'#fff', cursor: canAdjustThis ? 'pointer' : 'not-allowed' }}>
//                             {adjustApplyingProductId===p.productId?'…':'Apply'}
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                     )
//                   })}
//                 </div>
//               )}
//             </>}

//             {/* ═══ UPDATE STOCK ═══ */}
//             {tab==='update' && <>
//               <div style={{ padding:'16px 22px', borderBottom:'1px solid rgba(83,74,183,0.08)' }}>
//                 <div style={{ fontSize:15, fontWeight:700, color:'#1E1A4E' }}>Update stock</div>
//                 <div style={{ fontSize:12, color:'#7C7A9A', marginTop:2 }}>Adjust quantities for this godown</div>
//               </div>
//               {enabledCatalogRows.length===0 ? (
//                 <div style={{ padding:'40px 22px', textAlign:'center', color:'#7C7A9A', fontSize:13 }}>
//                   Turn products On in the Product catalog tab first.
//                 </div>
//               ) : (
//                 <div style={{ flex:1, overflowY:'auto', overflowX:'auto' }}>
//                   <table style={{ width:'100%', borderCollapse:'collapse' }}>
//                     <thead>
//                       <tr>
//                         <th style={TH}>Product</th>
//                         <th style={TH}>SKU</th>
//                         <th style={{ ...TH, textAlign:'right' }}>Current</th>
//                         <th style={TH}>Change (+/−)</th>
//                         <th style={TH}>Note</th>
//                         <th style={{ ...TH, textAlign:'right' }}> </th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {enabledCatalogRows.map(p => {
//                         const applying = adjustApplyingProductId===p.productId
//                         return (
//                           <tr key={p.productId}
//                             onMouseEnter={e=>(e.currentTarget.style.background='#faf9ff')}
//                             onMouseLeave={e=>(e.currentTarget.style.background='')}
//                           >
//                             <td style={{ ...TD, fontWeight:500 }}>{p.particulars??p.productId}</td>
//                             <td style={{ ...TD, whiteSpace:'nowrap' }}><span style={{ fontFamily:'monospace', fontSize:11.5, color:'#7C7A9A' }}>{p.sku}</span></td>
//                             <td style={{ ...TD, textAlign:'right', fontWeight:700, color:'#059669' }}>{formatNumber(stockQtyByProductId.get(p.productId)??0)}</td>
//                             <td style={{ ...TD, minWidth:110 }}>
//                               <input placeholder="e.g. 10" value={adjustDeltaByProduct[p.productId]??''} onChange={e=>setAdjustDeltaByProduct(prev=>({...prev,[p.productId]:e.target.value}))}
//                                 style={{ width:'100%', height:34, padding:'0 10px', border:'1px solid rgba(83,74,183,0.18)', borderRadius:7, fontSize:12.5, color:'#1E1A4E', background:'#faf9ff', outline:'none', fontFamily:'inherit' }}
//                                 onFocus={e=>(e.currentTarget.style.borderColor='#34d399')} onBlur={e=>(e.currentTarget.style.borderColor='rgba(83,74,183,0.18)')} />
//                             </td>
//                             <td style={{ ...TD, minWidth:130 }}>
//                               <input placeholder="Optional" value={adjustNoteByProduct[p.productId]??''} onChange={e=>setAdjustNoteByProduct(prev=>({...prev,[p.productId]:e.target.value}))}
//                                 style={{ width:'100%', height:34, padding:'0 10px', border:'1px solid rgba(83,74,183,0.18)', borderRadius:7, fontSize:12.5, color:'#1E1A4E', background:'#faf9ff', outline:'none', fontFamily:'inherit' }} />
//                             </td>
//                             <td style={{ ...TD, textAlign:'right' }}>
//                               <button disabled={applying} onClick={()=>applyStockAdjustment(p.productId)}
//                                 style={{ padding:'6px 14px', borderRadius:7, border:'none', background:'linear-gradient(135deg,#34d399,#059669)', fontSize:12, fontWeight:600, color:'#fff', cursor:applying?'not-allowed':'pointer', boxShadow:'0 2px 6px rgba(83,74,183,0.25)' }}>
//                                 {applying?'…':'Apply'}
//                               </button>
//                             </td>
//                           </tr>
//                         )
//                       })}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </>}
//           </div>

//           {/* RIGHT: Recent deliveries */}
//           <div style={{ display:'flex', flexDirection:'column' }}>
//             <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(83,74,183,0.10)' }}>
//               <div style={{ fontSize:15, fontWeight:700, color:'#1E1A4E' }}>Recent deliveries</div>
//             </div>
//             <div style={{ flex:1, overflowY:'auto', padding:'14px 14px', display:'flex', flexDirection:'column', gap:10 }}>
//               {deliveries.length===0 ? (
//                 <div style={{ textAlign:'center', padding:'32px 0', color:'#7C7A9A', fontSize:13 }}>No deliveries yet.</div>
//               ) : deliveries.map(d => (
//                 <Link key={d.id} to={`/deliveries/${d.id}`} style={{ textDecoration:'none' }}>
//                   <div style={{ background:'#faf9ff', border:'1px solid rgba(83,74,183,0.12)', borderRadius:10, padding:'12px 14px', transition:'all 0.14s' }}
//                     onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor='#6ee7b7'; (e.currentTarget as HTMLElement).style.background='#ecfdf5' }}
//                     onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor='rgba(83,74,183,0.12)'; (e.currentTarget as HTMLElement).style.background='#faf9ff' }}
//                   >
//                     <div style={{ fontSize:13, fontWeight:700, color:'#1E1A4E' }}>{d.deliveryNo}</div>
//                     <div style={{ fontSize:12, color:'#7C7A9A', marginTop:3 }}>{d.customerName}</div>
//                     <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
//                       <div style={{ fontSize:11, color:'#7C7A9A' }}>{formatDateTime(d.deliveryAt)}</div>
//                       <span style={{ ...deliveryBadgeStyle(d.status), fontSize:10.5, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>
//                         {statusLabel(d.status)}
//                       </span>
//                     </div>
//                   </div>
//                 </Link>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* EDIT MODAL */}
//       <Modal open={editOpen} title="Edit godown" onClose={() => setEditOpen(false)}
//         footer={
//           <div className="flex justify-end gap-2">
//             <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
//             <Button
//               disabled={editSaving || !editForm.name.trim() || !editForm.code.trim() || (editForm.newPassword.length>0 && editForm.newPassword.length<6)}
//               onClick={() => {
//                 const token = getToken(); if (!token||!id) return
//                 setEditSaving(true)
//                 apiFetch<Godown>(`/godowns/${id}`, { token, method:'PATCH', body:JSON.stringify({ name:editForm.name.trim(), code:editForm.code.trim(), address:editForm.address.trim(), mobile:editForm.mobile.trim(), location:editForm.location.trim(), ...(editForm.newPassword.trim().length>=6?{password:editForm.newPassword}:{}) }) })
//                   .then(g => { setGodown(g); setEditForm(f=>({...f,newPassword:''})); setEditOpen(false) })
//                   .catch((e:any) => setError(e?.message||'Update failed'))
//                   .finally(() => setEditSaving(false))
//               }}
//             >{editSaving?'Saving…':'Save'}</Button>
//           </div>
//         }
//       >
//         <div className="space-y-4">
//           <Input label="Godown name" value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} />
//           <Input label="Godown code" value={editForm.code} onChange={e=>setEditForm(f=>({...f,code:e.target.value.toUpperCase()}))} />
//           <Input label="Address" value={editForm.address} onChange={e=>setEditForm(f=>({...f,address:e.target.value}))} />
//           <Input label="Mobile number" value={editForm.mobile} onChange={e=>setEditForm(f=>({...f,mobile:e.target.value}))} />
//           <Input label="Location" value={editForm.location} onChange={e=>setEditForm(f=>({...f,location:e.target.value}))} />
//           <Input type="password" label="New password (optional)" value={editForm.newPassword} onChange={e=>setEditForm(f=>({...f,newPassword:e.target.value}))} placeholder="Leave blank to keep current" autoComplete="new-password" />
//         </div>
//       </Modal>
//     </div>
//   )
// }


import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { formatNumber } from '../../lib/format'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'
import type { GodownRow } from './List'

type Godown = GodownRow
type CatalogRow = { productId: string; enabled: boolean; particulars?: string; sku?: string; category?: string; rate?: string }
type StockAgg = { productId: string; qty: number }
type DeliveryRow = { id: string; deliveryNo: string; customerName: string; siteName?: string; status: string; deliveryAt: string }
type DeliveryLineRow = { productId: string; godownId?: string; qty: number }
type DeliveryDetailRow = DeliveryRow & { fromGodownId: string; lines: DeliveryLineRow[] }
type Tab = 'catalog' | 'stock' | 'update'

// ── Toggle ────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }} onClick={() => onChange(!checked)}>
      <div style={{ width: 44, height: 24, borderRadius: 12, background: checked ? '#059669' : '#d1d0d8', transition: 'background 0.2s', display: 'flex', alignItems: 'center', padding: '2px', flexShrink: 0 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.18)', transform: checked ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
      </div>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: checked ? '#059669' : '#7C7A9A', minWidth: 22 }}>{checked ? 'On' : 'Off'}</span>
    </div>
  )
}

const TH: React.CSSProperties = { padding: '9px 16px', fontSize: 10, fontWeight: 700, color: '#7C7A9A', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', background: '#faf9ff', borderBottom: '1px solid rgba(83,74,183,0.10)', whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '14px 16px', fontSize: 13.5, color: '#1E1A4E', borderBottom: '1px solid rgba(83,74,183,0.07)', verticalAlign: 'middle' }

export function GodownsDetailsPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const auth = useAuth()
  const initialTab = (searchParams.get('tab') as Tab | null) || 'catalog'
  const [tab, setTab] = useState<Tab>(['catalog', 'stock', 'update'].includes(initialTab) ? initialTab as Tab : 'catalog')
  const [godown, setGodown] = useState<Godown | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', code: '', address: '', mobile: '', location: '', newPassword: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [catalog, setCatalog] = useState<CatalogRow[]>([])
  const [stockRows, setStockRows] = useState<StockAgg[]>([])
  const [deliveries, setDeliveries] = useState<DeliveryDetailRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [catSearch, setCatSearch] = useState('')
  const [updateSearch, setUpdateSearch] = useState('')
  const [adjustApplyingProductId, setAdjustApplyingProductId] = useState<string | null>(null)
  // Selected product row for right panel detail
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  const load = () => {
    const token = getToken(); if (!token || !id) return
    setError(null); setLoading(true)
    Promise.all([
      apiFetch<Godown>(`/godowns/${id}`, { token }),
      apiFetch<CatalogRow[]>(`/godowns/${id}/products`, { token }),
      apiFetch<Array<{ godownId: string; productId: string; qty: number }>>(`/reports/stock?godownId=${encodeURIComponent(id)}`, { token }).catch(() => []),
      apiFetch<Array<DeliveryDetailRow>>('/deliveries?limit=200', { token }),
    ])
      .then(([g, cat, stockAll, dlv]) => {
        setGodown(g)
        setEditForm({ name: g.name, code: g.code || '', address: g.address || '', mobile: g.mobile || '', location: g.location || '', newPassword: '' })
        setCatalog(cat.sort((a, b) => (a.particulars || '').localeCompare(b.particulars || '')))
        const fg = stockAll.filter(r => r.godownId === id)
        setStockRows(fg.map(r => ({ productId: r.productId, qty: r.qty })))
        setDeliveries(dlv.filter(d => d.fromGodownId === id))
      })
      .catch((e: any) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  const reloadStock = () => {
    const token = getToken(); if (!token || !id) return Promise.resolve()
    return apiFetch<Array<{ godownId: string; productId: string; qty: number }>>(`/reports/stock?godownId=${encodeURIComponent(id)}`, { token })
      .then(stockAll => { const fg = stockAll.filter(r => r.godownId === id); setStockRows(fg.map(r => ({ productId: r.productId, qty: r.qty }))) })
      .catch(() => {})
  }

  useEffect(() => { load() }, [id])
  useEffect(() => {
    const h1 = () => void reloadStock(), h2 = () => void reloadStock()
    window.addEventListener('godown-stock-changed', h1)
    window.addEventListener('focus', h2)
    return () => { window.removeEventListener('godown-stock-changed', h1); window.removeEventListener('focus', h2) }
  }, [id])

  const catalogById = useMemo(() => new Map(catalog.map(c => [c.productId, c])), [catalog])
  const stockQtyByProductId = useMemo(() => { const m = new Map<string, number>(); for (const r of stockRows) m.set(r.productId, r.qty); return m }, [stockRows])
  const enabledCatalogRows = useMemo(() => catalog.filter(c => c.enabled), [catalog])
  const maxStock = useMemo(() => Math.max(...stockRows.map(r => r.qty), 1), [stockRows])
  const filteredCatalog = useMemo(() => {
    const q = catSearch.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter(p => (p.particulars || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))
  }, [catalog, catSearch])

  // ── Compute out-of-delivery and missing per product ───────────────────────
  // "Out of delivery" = qty currently dispatched/in active deliveries for this product
  // "Missing" = dispatched qty that hasn't been returned/confirmed
  const deliveryStatsByProduct = useMemo(() => {
    const stats = new Map<string, { outOfDelivery: number; missing: number; deliveries: DeliveryDetailRow[] }>()
    const activeStatuses = ['PROCESSED', 'PACKED', 'OUT_FOR_DELIVERY', 'DISPATCHED', 'DELIVERED', 'PENDING_RETURN']
    const missingStatuses = ['PENDING_RETURN', 'DELIVERED']
    for (const d of deliveries) {
      if (!d.lines) continue
      for (const line of d.lines) {
        if (!line.productId) continue
        const existing = stats.get(line.productId) ?? { outOfDelivery: 0, missing: 0, deliveries: [] }
        if (activeStatuses.includes(d.status)) {
          existing.outOfDelivery += line.qty
          if (!existing.deliveries.find(x => x.id === d.id)) existing.deliveries.push(d)
        }
        if (missingStatuses.includes(d.status)) {
          existing.missing += line.qty
        }
        stats.set(line.productId, existing)
      }
    }
    return stats
  }, [deliveries])

  // Stock table rows with out-of-delivery and missing
  const stockTableRows = useMemo(() => stockRows.map(s => {
    const p = catalogById.get(s.productId)
    const dStats = deliveryStatsByProduct.get(s.productId) ?? { outOfDelivery: 0, missing: 0, deliveries: [] }
    return { productId: s.productId, name: p?.particulars ?? s.productId, sku: p?.sku ?? '—', category: p?.category ?? '—', qty: s.qty, outOfDelivery: dStats.outOfDelivery, missing: dStats.missing, productDeliveries: dStats.deliveries }
  }), [stockRows, catalogById, deliveryStatsByProduct])

  // Update stock table rows with out-of-delivery and missing
  const updateStockRows = useMemo(() => enabledCatalogRows.map(p => {
    const dStats = deliveryStatsByProduct.get(p.productId) ?? { outOfDelivery: 0, missing: 0, deliveries: [] }
    return { ...p, qty: stockQtyByProductId.get(p.productId) ?? 0, outOfDelivery: dStats.outOfDelivery, missing: dStats.missing, productDeliveries: dStats.deliveries }
  }), [enabledCatalogRows, stockQtyByProductId, deliveryStatsByProduct])

  const filteredUpdateStockRows = useMemo(() => {
    const q = updateSearch.trim().toLowerCase()
    if (!q) return updateStockRows
    return updateStockRows.filter(p => (p.particulars || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))
  }, [updateStockRows, updateSearch])

  const [adjustDeltaByProduct, setAdjustDeltaByProduct] = useState<Record<string, string>>({})
  const [adjustNoteByProduct, setAdjustNoteByProduct] = useState<Record<string, string>>({})

  const canEditGodown = auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || (auth.user.role === 'GODOWN' && auth.user.godownId === id))
  useEffect(() => { if (tab === 'update' && !canEditGodown) setTab('catalog') }, [tab, canEditGodown])

  const toggleEnabled = (productId: string, enabled: boolean) => {
    const token = getToken(); if (!token || !id) return
    apiFetch(`/godowns/${id}/products`, { token, method: 'PATCH', body: JSON.stringify({ productId, enabled }) })
      .then(() => setCatalog(prev => prev.map(r => r.productId === productId ? { ...r, enabled } : r)))
      .catch((e: any) => setError(e?.message || 'Update failed'))
  }

  const applyStockAdjustment = (productId: string) => {
    const token = getToken(); if (!token || !id || !canEditGodown) return
    const raw = (adjustDeltaByProduct[productId] ?? '').trim()
    if (!/^-?\d+$/.test(raw)) { setError('Enter a whole number (e.g. 10 or -3).'); return }
    const qtyDelta = parseInt(raw, 10)
    if (qtyDelta === 0) { setError('Quantity change cannot be zero.'); return }
    const note = (adjustNoteByProduct[productId] ?? '').trim()
    setError(null); setAdjustApplyingProductId(productId)
    apiFetch<{ ok: boolean; balanceAfter: number }>(`/godowns/${id}/inventory/adjust`, { token, method: 'POST', body: JSON.stringify({ productId, qtyDelta, note: note || undefined }) })
      .then(() => { setAdjustDeltaByProduct(p => ({ ...p, [productId]: '' })); setAdjustNoteByProduct(p => ({ ...p, [productId]: '' })); return reloadStock() })
      .catch((e: any) => setError(e?.message || 'Adjustment failed'))
      .finally(() => setAdjustApplyingProductId(null))
  }

  if (!id) return <div style={{ padding: 24 }}>Invalid godown ID.</div>
  if (loading && !godown) return <div style={{ padding: 24, fontSize: 13, color: '#7C7A9A' }}>Loading…</div>
  if (error && !godown) return <div style={{ padding: 24 }}><div style={{ padding: '10px 14px', borderRadius: 10, background: '#FCEBEB', color: '#E24B4A', fontSize: 13, marginBottom: 12 }}>{error}</div><Link to="/godowns" style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>← Back</Link></div>
  if (!godown) return <div style={{ padding: 24, fontSize: 13 }}>Not found. <Link to="/godowns" style={{ color: '#059669', fontWeight: 600 }}>Back</Link></div>

  const tabBtn = (t: Tab): React.CSSProperties => ({
    padding: '12px 22px', fontSize: 13.5,
    fontWeight: tab === t ? 600 : 500,
    color: tab === t ? '#059669' : '#7C7A9A',
    border: 'none',
    borderBottom: tab === t ? '2.5px solid #059669' : '2.5px solid transparent',
    background: 'transparent',
    cursor: 'pointer', transition: 'all 0.14s',
    whiteSpace: 'nowrap', fontFamily: 'inherit',
  })

  return (
    <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E1A4E', margin: 0 }}>{godown.name}</h1>
          <p style={{ fontSize: 12, color: '#7C7A9A', marginTop: 4, marginBottom: 0 }}>
            {[godown.code ? `Code: ${godown.code}` : null, godown.location].filter(Boolean).join(' · ') || 'Godown details'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {canEditGodown && (
            <button onClick={() => setEditOpen(true)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(83,74,183,0.20)', background: '#fff', fontSize: 12.5, fontWeight: 500, color: '#059669', cursor: 'pointer' }}>
              Edit
            </button>
          )}
          <Link to="/godowns" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(5,150,105,0.15)', background: '#fff', fontSize: 12.5, fontWeight: 500, color: '#7C7A9A', textDecoration: 'none' }}>
            ← Back to list
          </Link>
        </div>
      </div>

      {/* WAREHOUSE DETAILS CARD */}
      <div style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.13)', borderRadius: 12, padding: '20px 24px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1E1A4E', marginBottom: 18, fontFamily: 'inherit' }}>Warehouse details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
          {[{ label: 'Godown Code', value: godown.code || '—' }, { label: 'Mobile', value: godown.mobile || '—' }, { label: 'Address', value: godown.address || '—' }, { label: 'Location', value: godown.location || '—' }].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#7C7A9A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1E1A4E' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FCEBEB', color: '#E24B4A', fontSize: 13, border: '1px solid rgba(226,75,74,0.2)' }}>{error}</div>}

      {/* TABS + CONTENT CARD */}
      <div style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.13)', borderRadius: 12, overflow: 'hidden' }}>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(83,74,183,0.12)', background: '#fff' }}>
        <button style={tabBtn('catalog')} onClick={() => setTab('catalog')}>
  Product catalog
</button>

{canEditGodown && (
  <button style={tabBtn('update')} onClick={() => setTab('update')}>
    Update stock
  </button>
)}

<button style={tabBtn('stock')} onClick={() => setTab('stock')}>
  Stock at godown
</button>
        </div>

        {/* Full-width content (delivery detail panel removed) */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 400 }}>

          {/* MAIN */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {/* ═══ CATALOG ═══ */}
            {tab === 'catalog' && <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid rgba(83,74,183,0.08)' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1E1A4E' }}>
                  Catalog <span style={{ fontSize: 13, fontWeight: 400, color: '#7C7A9A' }}>(enable for this godown)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: '1px solid rgba(83,74,183,0.18)', borderRadius: 8, background: '#faf9ff', fontSize: 12, fontWeight: 500, color: '#7C7A9A' }}>
                  On/off per SKU
                </div>
              </div>
              <div style={{ padding: '12px 22px', borderBottom: '1px solid rgba(83,74,183,0.06)' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5 21 21" /></svg>
                  </div>
                  <input value={catSearch} onChange={e => setCatSearch(e.target.value)} placeholder="Search product or SKU..."
                    style={{ width: '100%', padding: '9px 14px 9px 36px', border: '1px solid #e8eaf0', borderRadius: 9, fontSize: 13.5, color: '#1E1A4E', background: '#f8fafc', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#34d399')} onBlur={e => (e.currentTarget.style.borderColor = '#e8eaf0')} />
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <colgroup><col style={{ width: '8%' }} /><col style={{ width: '38%' }} /><col style={{ width: '14%' }} /><col style={{ width: '22%' }} /><col style={{ width: '18%' }} /></colgroup>
                  <thead>
                    <tr>
                      <th style={TH}>S.No</th><th style={TH}>Product</th><th style={TH}>SKU</th><th style={TH}>Category</th>
                      <th style={{ ...TH, textAlign: 'center' }}>Enabled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCatalog.length === 0 ? (
                      <tr><td colSpan={5} style={{ ...TD, textAlign: 'center', color: '#7C7A9A', padding: '36px' }}>No products found</td></tr>
                    ) : filteredCatalog.map((p, idx) => (
                      <tr key={p.productId} onMouseEnter={e => (e.currentTarget.style.background = '#faf9ff')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <td style={{ ...TD, color: '#7C7A9A', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ ...TD, fontWeight: 500, lineHeight: 1.4 }}>{p.particulars ?? p.productId}</td>
                        <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 11.5, fontWeight: 600, color: '#047857', background: '#ecfdf5', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: 6, display: 'inline-block' }}>{p.sku}</span>
                        </td>
                        <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: 20, display: 'inline-block', letterSpacing: '0.02em' }}>{p.category}</span>
                        </td>
                        <td style={{ ...TD, textAlign: 'center' }}>
                          <Toggle checked={p.enabled} onChange={v => toggleEnabled(p.productId, v)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>}

           
            {/* ═══ UPDATE STOCK ═══ */}
            {tab === 'update' && <>
              <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(83,74,183,0.08)' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1E1A4E' }}>Update stock</div>
                <div style={{ fontSize: 12, color: '#7C7A9A', marginTop: 2 }}>Adjust quantities for this godown</div>
              </div>
              <div style={{ padding: '12px 22px', borderBottom: '1px solid rgba(83,74,183,0.06)' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5 21 21" /></svg>
                  </div>
                  <input value={updateSearch} onChange={e => setUpdateSearch(e.target.value)} placeholder="Search product or SKU..."
                    style={{ width: '100%', padding: '9px 14px 9px 36px', border: '1px solid #e8eaf0', borderRadius: 9, fontSize: 13.5, color: '#1E1A4E', background: '#f8fafc', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#34d399')} onBlur={e => (e.currentTarget.style.borderColor = '#e8eaf0')} />
                </div>
              </div>
              {updateStockRows.length === 0 ? (
                <div style={{ padding: '40px 22px', textAlign: 'center', color: '#7C7A9A', fontSize: 13 }}>Turn products On in the Product catalog tab first.</div>
              ) : filteredUpdateStockRows.length === 0 ? (
                <div style={{ padding: '40px 22px', textAlign: 'center', color: '#7C7A9A', fontSize: 13 }}>No products match your search.</div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={TH}>S.No</th>
                        <th style={TH}>Product</th>
                        <th style={TH}>SKU</th>
                        <th style={{ ...TH, textAlign: 'right' }}>Current</th>
                        <th style={{ ...TH, textAlign: 'right', color: '#C2410C' }}>Out of delivery</th>
                        <th style={{ ...TH, textAlign: 'right', color: '#DC2626' }}>Missing</th>
                        <th style={{ ...TH, textAlign: 'right' }}> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUpdateStockRows.map((p, idx) => {
                        const applying = adjustApplyingProductId === p.productId
                        return (
                          <tr key={p.productId}
                            onClick={() => setSelectedProductId(prev => prev === p.productId ? null : p.productId)}
                            style={{ cursor: 'pointer', background: selectedProductId === p.productId ? '#ecfdf5' : '' }}
                            onMouseEnter={e => { if (selectedProductId !== p.productId) e.currentTarget.style.background = '#faf9ff' }}
                            onMouseLeave={e => { if (selectedProductId !== p.productId) e.currentTarget.style.background = '' }}
                          >
                            <td style={{ ...TD, color: '#7C7A9A', fontWeight: 600 }}>{idx + 1}</td>
                            <td style={{ ...TD, fontWeight: 500 }}>{p.particulars ?? p.productId}</td>
                            <td style={{ ...TD, whiteSpace: 'nowrap' }}><span style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#7C7A9A' }}>{p.sku}</span></td>
                            <td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: '#059669' }}>{formatNumber(p.qty)}</td>
                            <td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: '#C2410C' }}>{p.outOfDelivery}</td>
                            <td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>{p.missing}</td>
                            <td style={{ ...TD, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                                <input placeholder="+/-" value={adjustDeltaByProduct[p.productId] ?? ''} onChange={e => setAdjustDeltaByProduct(prev => ({ ...prev, [p.productId]: e.target.value }))}
                                  style={{ width: 60, height: 32, padding: '0 8px', border: '1px solid rgba(83,74,183,0.18)', borderRadius: 7, fontSize: 12, color: '#1E1A4E', background: '#fff', outline: 'none', fontFamily: 'inherit' }} />
                                <button disabled={applying} onClick={() => applyStockAdjustment(p.productId)}
                                  style={{ height: 32, padding: '0 12px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#34d399,#059669)', fontSize: 12, fontWeight: 600, color: '#fff', cursor: applying ? 'not-allowed' : 'pointer' }}>
                                  {applying ? '…' : 'Apply'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>}
             {/* ═══ STOCK ═══ */}
            {tab === 'stock' && <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid rgba(83,74,183,0.08)' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1E1A4E' }}>
                  Stock at godown <span style={{ fontSize: 13, fontWeight: 400, color: '#7C7A9A' }}>(current quantities)</span>
                </div>
                <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Total: {formatNumber(stockRows.reduce((a, r) => a + r.qty, 0))} units</span>
              </div>
              {stockTableRows.length === 0 ? (
                <div style={{ padding: '40px 22px', textAlign: 'center', color: '#7C7A9A', fontSize: 13 }}>No stock rows yet.</div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stockTableRows.map(p => (
                    <div key={p.productId}
                      onClick={() => setSelectedProductId(prev => prev === p.productId ? null : p.productId)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: `1px solid ${selectedProductId === p.productId ? '#34d399' : 'rgba(83,74,183,0.12)'}`, borderRadius: 9, background: selectedProductId === p.productId ? '#ecfdf5' : '#faf9ff', cursor: 'pointer', transition: 'all 0.14s' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#1E1A4E' }}>{p.name}</div>
                        <div style={{ fontSize: 10.5, color: '#7C7A9A', marginTop: 1 }}>{p.sku}</div>
                        <div style={{ height: 4, background: '#ecfdf5', borderRadius: 4, overflow: 'hidden', marginTop: 5 }}>
                          <div style={{ height: '100%', width: `${Math.round((p.qty / maxStock) * 100)}%`, background: 'linear-gradient(90deg,#34d399,#6ee7b7)', borderRadius: 4 }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#059669' }}>{formatNumber(p.qty)}</div>
                        <div style={{ fontSize: 10, color: '#7C7A9A' }}>units</div>
                      </div>
                      {/* Out of delivery badge */}
                      <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 56 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#C2410C' }}>{p.outOfDelivery}</div>
                        <div style={{ fontSize: 9, color: '#9A3412', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Out</div>
                      </div>
                      {/* Missing badge */}
                      <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 56 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#DC2626' }}>{p.missing}</div>
                        <div style={{ fontSize: 9, color: '#991B1B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Missing</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>}

          </div>

        </div>
      </div>

      {/* EDIT MODAL */}
      <Modal open={editOpen} title="Edit godown" onClose={() => setEditOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              disabled={editSaving || !editForm.name.trim() || !editForm.code.trim() || (editForm.newPassword.length > 0 && editForm.newPassword.length < 6)}
              onClick={() => {
                const token = getToken(); if (!token || !id) return
                setEditSaving(true)
                apiFetch<Godown>(`/godowns/${id}`, { token, method: 'PATCH', body: JSON.stringify({ name: editForm.name.trim(), code: editForm.code.trim(), address: editForm.address.trim(), mobile: editForm.mobile.trim(), location: editForm.location.trim(), ...(editForm.newPassword.trim().length >= 6 ? { password: editForm.newPassword } : {}) }) })
                  .then(g => { setGodown(g); setEditForm(f => ({ ...f, newPassword: '' })); setEditOpen(false) })
                  .catch((e: any) => setError(e?.message || 'Update failed'))
                  .finally(() => setEditSaving(false))
              }}
            >{editSaving ? 'Saving…' : 'Save'}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Godown name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Godown code" value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
          <Input label="Address" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
          <Input label="Mobile number" value={editForm.mobile} onChange={e => setEditForm(f => ({ ...f, mobile: e.target.value }))} />
          <Input label="Location" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
          <Input type="password" label="New password (optional)" value={editForm.newPassword} onChange={e => setEditForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Leave blank to keep current" autoComplete="new-password" />
        </div>
      </Modal>
    </div>
  )
}