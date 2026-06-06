// import { useEffect, useMemo, useState, type ReactNode } from 'react'
// import { Link, Navigate } from 'react-router-dom'

// import { formatNumber } from '../../lib/format'
// import { Button } from '../../components/ui/Button'
// import { Input } from '../../components/ui/Input'
// import { Modal } from '../../components/ui/Modal'
// import { PageHeader } from '../../components/ui/PageHeader'
// import { EmptyState } from '../../components/ui/Table'
// import { apiFetch } from '../../lib/api'
// import { getToken, useAuth } from '../../auth/store'

// export type GodownRow = {
//   id: string
//   name: string
//   code?: string
//   address?: string
//   mobile?: string
//   location?: string
//   city?: string
//   manager?: string
// }

// // ── icons ──────────────────────────────────────────────────────────────────

// function EyeIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden>
//       <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.7" />
//       <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
//     </svg>
//   )
// }

// function PencilIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden>
//       <path d="M4 20h4l9.5-9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
//       <path d="M13.5 6.5 17.5 10.5" stroke="currentColor" strokeWidth="1.7" />
//     </svg>
//   )
// }

// function TrashIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden>
//       <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
//     </svg>
//   )
// }

// function SearchIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden>
//       <circle cx="11" cy="11" r="7" stroke="#94a3b8" strokeWidth="1.8" />
//       <path d="M16.5 16.5 21 21" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
//     </svg>
//   )
// }

// // ── action button style ────────────────────────────────────────────────────

// const actionBtn: React.CSSProperties = {
//   display: 'inline-flex',
//   alignItems: 'center',
//   justifyContent: 'center',
//   width: 34,
//   height: 34,
//   borderRadius: 10,
//   border: '1px solid #e2e8f0',
//   background: '#fff',
//   color: '#64748b',
//   cursor: 'pointer',
//   transition: 'all 0.15s',
// }

// // ── stat card ──────────────────────────────────────────────────────────────

// function StatCard({
//   label,
//   value,
//   variant = 'white',
// }: {
//   label: string
//   value: string | number
//   variant?: 'purple' | 'white'
// }) {
//   if (variant === 'purple') {
//     return (
//       <div
//         style={{
//           background: 'linear-gradient(135deg,#4338ca 0%,rgb(49, 46, 129) 100%)',
//           borderRadius: 20,
//           padding: '20px 24px',
//           flex: '1.5',
//           minWidth: 0,
//           position: 'relative',
//           overflow: 'hidden',
//         }}
//       >
//         <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 300, marginBottom: 12 }}>
//           {label}
//         </div>
//         <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
//         {/* decorative circles */}
//         <div style={{
//           position: 'absolute', right: -30, top: -30, width: 130, height: 130,
//           borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
//         }} />
//         <div style={{
//           position: 'absolute', right: 20, bottom: -40, width: 90, height: 90,
//           borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
//         }} />
//       </div>
//     )
//   }
//   return (
//     <div
//       style={{
//         background: '#fff',
//         border: '1px solid #e2e8f0',
//         borderRadius: 20,
//         padding: '26px 30px',
//         flex: 1,
//         minWidth: 0,
//         position: 'relative',
//         overflow: 'hidden',
//       }}
//     >
//       <div style={{ fontSize: 13, color: '#64748b', fontWeight: 300, marginBottom: 12 }}>{label}</div>
//       <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
//       {/* decorative circle */}
//       <div style={{
//         position: 'absolute', right: -30, bottom: -30, width: 120, height: 120,
//         borderRadius: '50%', background: '#f1f5f9',
//       }} />
//     </div>
//   )
// }

// // ── table th / td ─────────────────────────────────────────────────────────

// function Th({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
//   return (
//     <th
//       style={{
//         padding: '12px 16px',
//         fontSize: 11,
//         fontWeight: 700,
//         color: '#94a3b8',
//         textTransform: 'uppercase',
//         letterSpacing: '0.06em',
//         textAlign: align,
//         whiteSpace: 'nowrap',
//         background: '#f8fafc',
//         borderBottom: '1px solid #f1f5f9',
//       }}
//     >
//       {children}
//     </th>
//   )
// }

// function Td({
//   children,
//   align = 'left',
//   truncate = false,
//   style: extraStyle,
// }: {
//   children: ReactNode
//   align?: 'left' | 'right'
//   truncate?: boolean
//   style?: React.CSSProperties
// }) {
//   return (
//     <td
//       style={{
//         padding: '16px',
//         fontSize: 13,
//         color: '#374151',
//         textAlign: align,
//         maxWidth: truncate ? 180 : undefined,
//         overflow: truncate ? 'hidden' : undefined,
//         textOverflow: truncate ? 'ellipsis' : undefined,
//         whiteSpace: truncate ? 'nowrap' : undefined,
//         borderBottom: '1px solid #f1f5f9',
//         verticalAlign: 'middle',
//         ...extraStyle,
//       }}
//     >
//       {children}
//     </td>
//   )
// }

// // ── main component ─────────────────────────────────────────────────────────

// export function GodownsListPage() {
//   const auth = useAuth()

//   if (
//     auth.status === 'authenticated' &&
//     auth.user.role === 'GODOWN' &&
//     auth.user.godownId
//   ) {
//     return <Navigate to={`/godowns/${auth.user.godownId}`} replace />
//   }

//   const isAdmin = auth.status === 'authenticated' && auth.user.role === 'ADMIN'

//   const [godowns, setGodowns] = useState<GodownRow[]>([])
//   const [stockByGodown, setStockByGodown] = useState<Record<string, number>>({})
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [q, setQ] = useState('')

//   // ── add modal ──
//   const [addOpen, setAddOpen] = useState(false)
//   const [addForm, setAddForm] = useState({ name: '', code: '', address: '', mobile: '', location: '', password: '' })
//   const [saving, setSaving] = useState(false)

//   // ── edit modal ──
//   const [editOpen, setEditOpen] = useState(false)
//   const [editingGodownId, setEditingGodownId] = useState<string | null>(null)
//   const [editForm, setEditForm] = useState({ name: '', code: '', address: '', mobile: '', location: '', newPassword: '' })
//   const [editSaving, setEditSaving] = useState(false)

//   // ── delete modal ──
//   const [deleteOpen, setDeleteOpen] = useState(false)
//   const [deletingGodown, setDeletingGodown] = useState<GodownRow | null>(null)
//   const [deleteSaving, setDeleteSaving] = useState(false)

//   const openEdit = (g: GodownRow) => {
//     setEditingGodownId(g.id)
//     setEditForm({ name: g.name || '', code: g.code || '', address: g.address || '', mobile: g.mobile || '', location: g.location || '', newPassword: '' })
//     setEditOpen(true)
//   }

//   const load = () => {
//     const token = getToken()
//     if (!token) { setLoading(false); return }
//     setError(null)
//     setLoading(true)
//     Promise.all([
//       apiFetch<GodownRow[]>('/godowns', { token }),
//       apiFetch<Array<{ godownId: string; productId: string; qty: number }>>('/reports/stock', { token }).catch(() => []),
//     ])
//       .then(([gRows, stockRows]) => {
//         const list = Array.isArray(gRows) ? gRows : []
//         setGodowns(list)
//         const map: Record<string, number> = {}
//         if (Array.isArray(stockRows)) {
//           for (const r of stockRows) {
//             const gid = String(r.godownId)
//             map[gid] = (map[gid] ?? 0) + Number(r.qty)
//           }
//         }
//         setStockByGodown(map)
//       })
//       .catch((e: any) => setError(e?.message || 'Failed to load'))
//       .finally(() => setLoading(false))
//   }

//   useEffect(() => { load() }, [])
//   useEffect(() => {
//     const onStockChanged = () => load()
//     window.addEventListener('godown-stock-changed', onStockChanged)
//     return () => window.removeEventListener('godown-stock-changed', onStockChanged)
//   }, [])

//   const rows = useMemo(() => {
//     const s = q.trim().toLowerCase()
//     if (!s) return godowns
//     return godowns.filter((g) =>
//       [g.name, g.code, g.address, g.mobile, g.location, g.city, g.manager]
//         .filter(Boolean).join(' ').toLowerCase().includes(s)
//     )
//   }, [godowns, q])

//   const totalStock = Object.values(stockByGodown).reduce((a, b) => a + b, 0)

//   // ── render ─────────────────────────────────────────────────────────────

//   return (
//     <div style={{ fontFamily: 'inherit' }}>
//       {/* ── page header ── */}
//       <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
//         <div>
//           <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Godowns</h1>
//           <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
//             Manage warehouses, inventory flow and stock distribution.
//           </p>
//         </div>
//         {isAdmin && (
//           <button
//             onClick={() => setAddOpen(true)}
//             style={{
//               display: 'flex', alignItems: 'center', gap: 6,
//               padding: '10px 22px', borderRadius: 12, border: 'none',
//               background: '#4338ca', fontSize: 14, fontWeight: 600,
//               color: '#fff', cursor: 'pointer',
//             }}
//           >
//             <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2.5">
//               <path d="M12 5v14M5 12h14" />
//             </svg>
//             Add Godown
//           </button>
//         )}
//       </div>

//       {/* ── error banner ── */}
//       {error && (
//         <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: '#fef2f2', color: '#b91c1c', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
//           <span>{error}</span>
//           <button onClick={load} style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
//         </div>
//       )}

//       {/* ── stat cards ── */}
//       {/* <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
//         <StatCard label="Total Godowns" value={godowns.length} variant="purple" />
//         <StatCard label="Total Stock Units" value={formatNumber(totalStock)} />
//         <StatCard label="Search Results" value={rows.length} />
//       </div> */}

//       {/* ── stat cards ── */}
// <div
//   style={{
//     display: 'grid',
//     gridTemplateColumns: '1.4fr 1fr 1fr',
//     gap: 20,
//     marginBottom: 24,
//   }}
// >
//   <StatCard
//     label="Total Godowns"
//     value={godowns.length}
//     variant="purple"
//   />

//   <StatCard
//     label="Total Stock Units"
//     value={formatNumber(totalStock)}
//   />

//   <StatCard
//     label="Search Results"
//     value={rows.length}
//   />
// </div>

//       {/* ── table card ── */}
//       <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, overflow: 'hidden' }}>
//         {/* card header */}
//         <div style={{
//           display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//           padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
//           flexWrap: 'wrap', gap: 12,
//         }}>
//           <div>
//             <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Godown List</div>
//             <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Warehouse details and stock overview</div>
//           </div>
//           {/* search */}
//           <div style={{ position: 'relative', width: 240 }}>
//             <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
//               <SearchIcon />
//             </div>
//             <input
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//               placeholder="Search godown..."
//               style={{
//                 width: '100%', height: 38, paddingLeft: 36, paddingRight: 12,
//                 border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13,
//                 color: '#374151', background: '#f8fafc', outline: 'none',
//                 boxSizing: 'border-box',
//               }}
//             />
//           </div>
//         </div>

//         {/* table body */}
//         {loading ? (
//           <div style={{ padding: 32, fontSize: 13, color: '#94a3b8' }}>Loading…</div>
//         ) : rows.length === 0 ? (
//           <div style={{ padding: 32 }}>
//             <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
//               <div style={{ fontSize: 32, marginBottom: 8 }}>🏭</div>
//               <div style={{ fontWeight: 600, color: '#475569' }}>No godowns found</div>
//               <div style={{ fontSize: 12, marginTop: 4 }}>Try a different search or add a new godown.</div>
//             </div>
//           </div>
//         ) : (
//           <div style={{ overflowX: 'auto' }}>
//             <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
//               <thead>
//                 <tr>
//                   <Th>Code</Th>
//                   <Th>Name</Th>
//                   <Th>Location</Th>
//                   <Th>Mobile</Th>
//                   <Th>Address</Th>
//                   <Th align="right">Stock</Th>
//                   <Th align="right">Actions</Th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {rows.map((g, idx) => (
//                   <tr
//                     key={g.id || `row-${idx}`}
//                     style={{ transition: 'background 0.15s' }}
//                     onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
//                     onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
//                   >
//                     {/* CODE */}
//                     <Td>
//                       <span style={{
//                         display: 'inline-block', padding: '4px 10px',
//                         borderRadius: 8, background: '#f1f5f9',
//                         fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
//                         color: '#334155', letterSpacing: '0.02em',
//                       }}>
//                         {g.code || '—'}
//                       </span>
//                     </Td>

//                     {/* NAME */}
//                     <Td>
//                       <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{g.name || '—'}</span>
//                     </Td>

//                     {/* LOCATION */}
//                     <Td truncate>{g.location || '—'}</Td>

//                     {/* MOBILE */}
//                     <Td>{g.mobile || '—'}</Td>

//                     {/* ADDRESS */}
//                     <Td truncate>{g.address || '—'}</Td>

//                     {/* STOCK */}
//                     <Td align="right">
//                       <span style={{ fontWeight: 700, color: '#4338ca', fontSize: 14 }}>
//                         {formatNumber(stockByGodown[g.id] ?? 0)}
//                       </span>
//                     </Td>

//                     {/* ACTIONS */}
//                     <Td align="right">
//                       <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
//                         <Link
//                           to={`/godowns/${g.id}`}
//                           title="View godown"
//                           style={{ ...actionBtn, textDecoration: 'none' }}
//                           onMouseEnter={(e) => {
//                             const el = e.currentTarget as HTMLElement
//                             el.style.background = '#ede9fe'
//                             el.style.borderColor = '#c4b5fd'
//                             el.style.color = '#4338ca'
//                           }}
//                           onMouseLeave={(e) => {
//                             const el = e.currentTarget as HTMLElement
//                             el.style.background = '#fff'
//                             el.style.borderColor = '#e2e8f0'
//                             el.style.color = '#64748b'
//                           }}
//                         >
//                           <EyeIcon />
//                         </Link>
//                         {isAdmin && (
//                           <>
//                             <button
//                               type="button"
//                               title="Edit godown"
//                               style={actionBtn}
//                               onClick={() => openEdit(g)}
//                               onMouseEnter={(e) => {
//                                 const el = e.currentTarget as HTMLElement
//                                 el.style.background = '#ede9fe'
//                                 el.style.borderColor = '#c4b5fd'
//                                 el.style.color = '#4338ca'
//                               }}
//                               onMouseLeave={(e) => {
//                                 const el = e.currentTarget as HTMLElement
//                                 el.style.background = '#fff'
//                                 el.style.borderColor = '#e2e8f0'
//                                 el.style.color = '#64748b'
//                               }}
//                             >
//                               <PencilIcon />
//                             </button>
//                             <button
//                               type="button"
//                               title="Delete godown"
//                               style={actionBtn}
//                               onClick={() => { setDeletingGodown(g); setDeleteOpen(true) }}
//                               onMouseEnter={(e) => {
//                                 const el = e.currentTarget as HTMLElement
//                                 el.style.background = '#fef2f2'
//                                 el.style.borderColor = '#fecaca'
//                                 el.style.color = '#dc2626'
//                               }}
//                               onMouseLeave={(e) => {
//                                 const el = e.currentTarget as HTMLElement
//                                 el.style.background = '#fff'
//                                 el.style.borderColor = '#e2e8f0'
//                                 el.style.color = '#64748b'
//                               }}
//                             >
//                               <TrashIcon />
//                             </button>
//                           </>
//                         )}
//                       </div>
//                     </Td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* ── ADD MODAL ── */}
//       <Modal
//         open={addOpen}
//         title="Add godown"
//         onClose={() => setAddOpen(false)}
//         footer={
//           <div className="flex justify-end gap-3">
//             <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
//             <Button
//               disabled={saving || !addForm.name.trim() || !addForm.code.trim() || !addForm.mobile.trim() || addForm.password.length < 6}
//               onClick={() => {
//                 const token = getToken()
//                 if (!token) return
//                 setSaving(true)
//                 apiFetch<GodownRow>('/godowns', {
//                   token, method: 'POST',
//                   body: JSON.stringify({ name: addForm.name.trim(), code: addForm.code.trim(), address: addForm.address.trim(), mobile: addForm.mobile.trim(), location: addForm.location.trim(), password: addForm.password }),
//                 })
//                   .then(() => { setAddForm({ name: '', code: '', address: '', mobile: '', location: '', password: '' }); setAddOpen(false); load() })
//                   .catch((e: any) => setError(e?.message || 'Create failed'))
//                   .finally(() => setSaving(false))
//               }}
//             >
//               {saving ? 'Saving…' : 'Create'}
//             </Button>
//           </div>
//         }
//       >
//         <div className="space-y-4">
//           <Input label="Godown name" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. North warehouse" />
//           <Input label="Godown code" value={addForm.code} onChange={(e) => setAddForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. GD-N01" />
//           <Input label="Address" value={addForm.address} onChange={(e) => setAddForm((f) => ({ ...f, address: e.target.value }))} placeholder="Street, area, PIN" />
//           <Input label="Mobile number" value={addForm.mobile} onChange={(e) => setAddForm((f) => ({ ...f, mobile: e.target.value }))} placeholder="Contact mobile" inputMode="tel" autoComplete="tel" />
//           <Input type="password" label="Godown login password" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" autoComplete="new-password" />
//           <Input label="Location" value={addForm.location} onChange={(e) => setAddForm((f) => ({ ...f, location: e.target.value }))} placeholder="City / region / landmark" />
//         </div>
//       </Modal>

//       {/* ── EDIT MODAL ── */}
//       <Modal
//         open={editOpen}
//         title="Edit godown"
//         onClose={() => setEditOpen(false)}
//         footer={
//           <div className="flex justify-end gap-3">
//             <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
//             <Button
//               disabled={editSaving || !editForm.name.trim() || !editForm.code.trim() || (editForm.newPassword.length > 0 && editForm.newPassword.length < 6)}
//               onClick={() => {
//                 const token = getToken()
//                 if (!token || !editingGodownId) return
//                 setEditSaving(true)
//                 apiFetch<GodownRow>(`/godowns/${editingGodownId}`, {
//                   token, method: 'PATCH',
//                   body: JSON.stringify({ name: editForm.name.trim(), code: editForm.code.trim(), address: editForm.address.trim(), mobile: editForm.mobile.trim(), location: editForm.location.trim(), ...(editForm.newPassword.trim().length >= 6 ? { password: editForm.newPassword } : {}) }),
//                 })
//                   .then(() => { setEditOpen(false); setEditingGodownId(null); load() })
//                   .catch((e: any) => setError(e?.message || 'Update failed'))
//                   .finally(() => setEditSaving(false))
//               }}
//             >
//               {editSaving ? 'Saving…' : 'Save'}
//             </Button>
//           </div>
//         }
//       >
//         <div className="space-y-4">
//           <Input label="Godown name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
//           <Input label="Godown code" value={editForm.code} onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
//           <Input label="Address" value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />
//           <Input label="Mobile number" value={editForm.mobile} onChange={(e) => setEditForm((f) => ({ ...f, mobile: e.target.value }))} />
//           <Input label="Location" value={editForm.location} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} />
//           <Input type="password" label="New password (optional)" value={editForm.newPassword} onChange={(e) => setEditForm((f) => ({ ...f, newPassword: e.target.value }))} placeholder="Leave blank to keep current" />
//         </div>
//       </Modal>

//       {/* ── DELETE MODAL ── */}
//       <Modal
//         open={deleteOpen}
//         title="Delete godown"
//         onClose={() => { if (deleteSaving) return; setDeleteOpen(false); setDeletingGodown(null) }}
//         footer={
//           <div className="flex justify-end gap-3">
//             <Button variant="secondary" disabled={deleteSaving} onClick={() => { setDeleteOpen(false); setDeletingGodown(null) }}>Cancel</Button>
//             <Button
//               variant="danger"
//               disabled={deleteSaving || !deletingGodown}
//               onClick={() => {
//                 const token = getToken()
//                 if (!token || !deletingGodown) return
//                 setDeleteSaving(true)
//                 apiFetch(`/godowns/${deletingGodown.id}`, { token, method: 'DELETE' })
//                   .then(() => { setDeleteOpen(false); setDeletingGodown(null); load() })
//                   .catch((e: any) => setError(e?.message || 'Delete failed'))
//                   .finally(() => setDeleteSaving(false))
//               }}
//             >
//               {deleteSaving ? 'Deleting…' : 'Delete'}
//             </Button>
//           </div>
//         }
//       >
//         <p className="text-sm text-slate-600">
//           Are you sure you want to delete{' '}
//           <span className="font-semibold text-slate-900">{deletingGodown?.name || 'this godown'}</span>?
//           {' '}This cannot be undone.
//         </p>
//       </Modal>
//     </div>
//   )
// }


import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { formatNumber } from '../../lib/format'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'

export type GodownRow = {
  id: string; name: string; code?: string; address?: string
  mobile?: string; location?: string; city?: string; manager?: string
}

function EyeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.7" /><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" /></svg>
}
function PencilIcon() {
  return <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden><path d="M4 20h4l9.5-9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M13.5 6.5 17.5 10.5" stroke="currentColor" strokeWidth="1.7" /></svg>
}
function TrashIcon() {
  return <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
}

const actionBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 34, height: 34, borderRadius: 10, border: '1px solid #e2e8f0',
  background: '#fff', color: '#64748b', cursor: 'pointer', transition: 'all 0.15s',
}

// ── stat card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, variant = 'white' }: { label: string; value: string | number; variant?: 'purple' | 'white' }) {
  if (variant === 'purple') {
    return (
      <div style={{
        background: 'linear-gradient(135deg,#4338ca 0%,rgb(49,46,129) 100%)',
        borderRadius: 20, padding: '20px 24px',
        flex: '1 1 140px', minWidth: 0,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 300, marginBottom: 12 }}>{label}</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', right: 20, bottom: -40, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
      </div>
    )
  }
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20,
      padding: '20px 24px',
      flex: '1 1 120px', minWidth: 0,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 300, marginBottom: 12 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
      <div style={{ position: 'absolute', right: -30, bottom: -30, width: 120, height: 100, borderRadius: '50%', background: '#f1f5f9' }} />
    </div>
  )
}

function Th({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
  return (
    <th style={{
      padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8',
      textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: align,
      whiteSpace: 'nowrap', background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
    }}>{children}</th>
  )
}

function Td({ children, align = 'left', truncate = false, style: s }: { children: ReactNode; align?: 'left' | 'right'; truncate?: boolean; style?: React.CSSProperties }) {
  return (
    <td style={{
      padding: '16px', fontSize: 13, color: '#374151', textAlign: align,
      maxWidth: truncate ? 180 : undefined, overflow: truncate ? 'hidden' : undefined,
      textOverflow: truncate ? 'ellipsis' : undefined, whiteSpace: truncate ? 'nowrap' : undefined,
      borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle', ...s,
    }}>{children}</td>
  )
}

// ── main ───────────────────────────────────────────────────────────────────

export function GodownsListPage() {
  const auth = useAuth()
  if (auth.status === 'authenticated' && auth.user.role === 'GODOWN' && auth.user.godownId)
    return <Navigate to={`/godowns/${auth.user.godownId}`} replace />

  const isAdmin = auth.status === 'authenticated' && auth.user.role === 'ADMIN'

  const [godowns, setGodowns] = useState<GodownRow[]>([])
  const [stockByGodown, setStockByGodown] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', code: '', address: '', mobile: '', location: '', password: '' })
  const [saving, setSaving] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editingGodownId, setEditingGodownId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', code: '', address: '', mobile: '', location: '', newPassword: '' })
  const [editSaving, setEditSaving] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingGodown, setDeletingGodown] = useState<GodownRow | null>(null)
  const [deleteSaving, setDeleteSaving] = useState(false)

  const openEdit = (g: GodownRow) => {
    setEditingGodownId(g.id)
    setEditForm({ name: g.name || '', code: g.code || '', address: g.address || '', mobile: g.mobile || '', location: g.location || '', newPassword: '' })
    setEditOpen(true)
  }

  const load = () => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    setError(null); setLoading(true)
    Promise.all([
      apiFetch<GodownRow[]>('/godowns', { token }),
      apiFetch<Array<{ godownId: string; productId: string; qty: number }>>('/reports/stock', { token }).catch(() => []),
    ])
      .then(([gRows, stockRows]) => {
        const list = Array.isArray(gRows) ? gRows : []
        setGodowns(list)
        const map: Record<string, number> = {}
        if (Array.isArray(stockRows)) {
          for (const r of stockRows) {
            const gid = String(r.godownId)
            map[gid] = (map[gid] ?? 0) + Number(r.qty)
          }
        }
        setStockByGodown(map)
      })
      .catch((e: any) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    const onStockChanged = () => load()
    window.addEventListener('godown-stock-changed', onStockChanged)
    return () => window.removeEventListener('godown-stock-changed', onStockChanged)
  }, [])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return godowns
    return godowns.filter((g) =>
      [g.name, g.code, g.address, g.mobile, g.location, g.city, g.manager]
        .filter(Boolean).join(' ').toLowerCase().includes(s)
    )
  }, [godowns, q])

  const totalStock = Object.values(stockByGodown).reduce((a, b) => a + b, 0)

  return (
    // No extra padding — AppShell provides 20px 24px padding
    <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Godowns</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
            Manage warehouses, inventory flow and stock distribution.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setAddOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 22px', borderRadius: 12, border: 'none',
              background: '#4338ca', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
             Add Godown
          </button>
        )}
      </div>

      {/* ── error ── */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: '#fef2f2', color: '#b91c1c', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button onClick={load} style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {/* ── stat cards ── */}
      <div className="godown-stat-cards" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard label="Total Godowns" value={godowns.length} variant="purple" />
        <StatCard label="Total Stock Units" value={formatNumber(totalStock)} />
        <StatCard label="Search Results" value={rows.length} />
      </div>

      {/* ── table card ── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, overflow: 'hidden' }}>
        {/* card header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Godown List</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Warehouse details and stock overview</div>
          </div>
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280, minWidth: 0 }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden><circle cx="11" cy="11" r="7" stroke="#94a3b8" strokeWidth="1.8" /><path d="M16.5 16.5 21 21" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </div>
            <input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search godown..."
              style={{
                width: '100%', height: 38, paddingLeft: 36, paddingRight: 12,
                border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13,
                color: '#374151', background: '#f8fafc', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* table */}
        {loading ? (
          <div style={{ padding: 32, fontSize: 13, color: '#94a3b8' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏭</div>
            <div style={{ fontWeight: 600, color: '#475569' }}>No godowns found</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Try a different search or add a new godown.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr>
                  <Th>Code</Th><Th>Name</Th><Th>Location</Th>
                  <Th>Mobile</Th><Th>Address</Th>
                  <Th align="right">Stock</Th><Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((g, idx) => (
                  <tr key={g.id || `row-${idx}`}
                    style={{ transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Td>
                      <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 8, background: '#f1f5f9', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#334155', letterSpacing: '0.02em' }}>
                        {g.code || '—'}
                      </span>
                    </Td>
                    <Td><span style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{g.name || '—'}</span></Td>
                    <Td truncate>{g.location || '—'}</Td>
                    <Td>{g.mobile || '—'}</Td>
                    <Td truncate>{g.address || '—'}</Td>
                    <Td align="right">
                      <span style={{ fontWeight: 700, color: '#4338ca', fontSize: 14 }}>{formatNumber(stockByGodown[g.id] ?? 0)}</span>
                    </Td>
                    <Td align="right">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Link to={`/godowns/${g.id}`} title="View godown" style={{ ...actionBtn, textDecoration: 'none' }}
                          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#ede9fe'; el.style.borderColor = '#c4b5fd'; el.style.color = '#4338ca' }}
                          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff'; el.style.borderColor = '#e2e8f0'; el.style.color = '#64748b' }}
                        ><EyeIcon /></Link>
                        {isAdmin && (
                          <>
                            <button type="button" title="Edit" style={actionBtn} onClick={() => openEdit(g)}
                              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#ede9fe'; el.style.borderColor = '#c4b5fd'; el.style.color = '#4338ca' }}
                              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff'; el.style.borderColor = '#e2e8f0'; el.style.color = '#64748b' }}
                            ><PencilIcon /></button>
                            <button type="button" title="Delete" style={actionBtn} onClick={() => { setDeletingGodown(g); setDeleteOpen(true) }}
                              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#fef2f2'; el.style.borderColor = '#fecaca'; el.style.color = '#dc2626' }}
                              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff'; el.style.borderColor = '#e2e8f0'; el.style.color = '#64748b' }}
                            ><TrashIcon /></button>
                          </>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ADD MODAL ── */}
      <Modal open={addOpen} title="Add godown" onClose={() => setAddOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button disabled={saving || !addForm.name.trim() || !addForm.code.trim() || !addForm.mobile.trim() || addForm.password.length < 6}
              onClick={() => {
                const token = getToken(); if (!token) return; setSaving(true)
                apiFetch<GodownRow>('/godowns', { token, method: 'POST', body: JSON.stringify({ name: addForm.name.trim(), code: addForm.code.trim(), address: addForm.address.trim(), mobile: addForm.mobile.trim(), location: addForm.location.trim(), password: addForm.password }) })
                  .then(() => { setAddForm({ name: '', code: '', address: '', mobile: '', location: '', password: '' }); setAddOpen(false); load() })
                  .catch((e: any) => setError(e?.message || 'Create failed'))
                  .finally(() => setSaving(false))
              }}
            >{saving ? 'Saving…' : 'Create'}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Godown name" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. North warehouse" />
          <Input label="Godown code" value={addForm.code} onChange={(e) => setAddForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. GD-N01" />
          <Input label="Address" value={addForm.address} onChange={(e) => setAddForm((f) => ({ ...f, address: e.target.value }))} placeholder="Street, area, PIN" />
          <Input label="Mobile number" value={addForm.mobile} onChange={(e) => setAddForm((f) => ({ ...f, mobile: e.target.value }))} placeholder="Contact mobile" />
          <Input type="password" label="Godown login password" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" autoComplete="new-password" />
          <Input label="Location" value={addForm.location} onChange={(e) => setAddForm((f) => ({ ...f, location: e.target.value }))} placeholder="City / region / landmark" />
        </div>
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal open={editOpen} title="Edit godown" onClose={() => setEditOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button disabled={editSaving || !editForm.name.trim() || !editForm.code.trim() || (editForm.newPassword.length > 0 && editForm.newPassword.length < 6)}
              onClick={() => {
                const token = getToken(); if (!token || !editingGodownId) return; setEditSaving(true)
                apiFetch<GodownRow>(`/godowns/${editingGodownId}`, { token, method: 'PATCH', body: JSON.stringify({ name: editForm.name.trim(), code: editForm.code.trim(), address: editForm.address.trim(), mobile: editForm.mobile.trim(), location: editForm.location.trim(), ...(editForm.newPassword.trim().length >= 6 ? { password: editForm.newPassword } : {}) }) })
                  .then(() => { setEditOpen(false); setEditingGodownId(null); load() })
                  .catch((e: any) => setError(e?.message || 'Update failed'))
                  .finally(() => setEditSaving(false))
              }}
            >{editSaving ? 'Saving…' : 'Save'}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Godown name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Godown code" value={editForm.code} onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
          <Input label="Address" value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />
          <Input label="Mobile number" value={editForm.mobile} onChange={(e) => setEditForm((f) => ({ ...f, mobile: e.target.value }))} />
          <Input label="Location" value={editForm.location} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} />
          <Input type="password" label="New password (optional)" value={editForm.newPassword} onChange={(e) => setEditForm((f) => ({ ...f, newPassword: e.target.value }))} placeholder="Leave blank to keep current" />
        </div>
      </Modal>

      {/* ── DELETE MODAL ── */}
      <Modal open={deleteOpen} title="Delete godown" onClose={() => { if (deleteSaving) return; setDeleteOpen(false); setDeletingGodown(null) }}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" disabled={deleteSaving} onClick={() => { setDeleteOpen(false); setDeletingGodown(null) }}>Cancel</Button>
            <Button variant="danger" disabled={deleteSaving || !deletingGodown}
              onClick={() => {
                const token = getToken(); if (!token || !deletingGodown) return; setDeleteSaving(true)
                apiFetch(`/godowns/${deletingGodown.id}`, { token, method: 'DELETE' })
                  .then(() => { setDeleteOpen(false); setDeletingGodown(null); load() })
                  .catch((e: any) => setError(e?.message || 'Delete failed'))
                  .finally(() => setDeleteSaving(false))
              }}
            >{deleteSaving ? 'Deleting…' : 'Delete'}</Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-slate-900">{deletingGodown?.name || 'this godown'}</span>?
          {' '}This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}