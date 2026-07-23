import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'
import { formatDateTime } from '../../lib/format'

type UserRow = {
  id: string
  email: string
  role: string
  siteName?: string
  siteAddress?: string
  contactName?: string
  contactPhone?: string
  active?: boolean
}

type DeliveryRow = {
  id: string
  deliveryNo: string
  customerName: string
  siteName?: string
  siteAddress?: string
  status: string
  deliveryAt: string
  returnExpectedAt?: string
  primaryGodownName?: string
  productCount?: number
  totalQty?: number
  billingType?: 'FREE' | 'INVOICE'
  invoiceNo?: string
  invoiceName?: string
  invoiceAmount?: string
  billedAt?: string
}

// ── shared styles ──────────────────────────────────────────────────────────

const tHead: React.CSSProperties = {
  padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8',
  textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left',
  whiteSpace: 'nowrap', background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
}

const tCell: React.CSSProperties = {
  padding: '13px 16px', fontSize: 13, color: '#374151',
  borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle',
}

function statusColor(s: string) {
  if (s === 'BILLED') return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
  if (s === 'COMPLETED') return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' }
  if (s === 'CANCELLED') return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
  if (s === 'DELIVERED' || s === 'PENDING_RETURN') return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' }
  return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' }
}

function StatusBadge({ status }: { status: string }) {
  const c = statusColor(status)
  const label = status.replace(/_/g, ' ')
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
      {label.charAt(0) + label.slice(1).toLowerCase()}
    </span>
  )
}

function TrashIcon() {
  return <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
}

function EditIcon() {
  return <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function KeyIcon() {
  return <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M15.5 8.5a3.5 3.5 0 1 0-3.36 3.49L9 15.13V17h-2v2H5v2H3v-3.59l6.04-6.04A3.5 3.5 0 0 1 15.5 8.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><circle cx="14.5" cy="8.5" r="0.6" fill="currentColor" stroke="none" /></svg>
}

function BillerRowIcon() {
  return <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M3 21h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><path d="M6 21V10l6-4 6 4v11" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M10 14h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" width="15" height="15" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5 21 21" /></svg>
}

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" fill="none" width="15" height="15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
}

const iconActionBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 34, height: 34, borderRadius: 10, border: '1px solid #e2e8f0',
  background: '#fff', color: '#64748b', cursor: 'pointer', transition: 'all 0.15s',
}

const PAGE_SIZE = 15

// ── Biller Deliveries Panel ────────────────────────────────────────────────
function BillerDeliveriesPanel({ biller, onClose }: { biller: UserRow; onClose: () => void }) {
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const token = getToken(); if (!token) return
    setLoading(true)
    apiFetch<DeliveryRow[]>(`/deliveries?billerUserId=${encodeURIComponent(biller.id)}&limit=1000`, { token })
      .then(setDeliveries)
      .catch(() => setDeliveries([]))
      .finally(() => setLoading(false))
  }, [biller.id])

  // Reset page on filter changes
  useEffect(() => { setPage(1) }, [search, dateFrom, dateTo])

  const filtered = useMemo(() => {
    let rows = deliveries
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter((d) =>
        d.deliveryNo?.toLowerCase().includes(q) ||
        d.customerName?.toLowerCase().includes(q) ||
        d.siteName?.toLowerCase().includes(q) ||
        d.siteAddress?.toLowerCase().includes(q) ||
        d.status?.toLowerCase().includes(q) ||
        d.primaryGodownName?.toLowerCase().includes(q) ||
        d.invoiceNo?.toLowerCase().includes(q) ||
        d.billingType?.toLowerCase().includes(q)
      )
    }
    if (dateFrom) {
      const from = new Date(dateFrom); from.setHours(0, 0, 0, 0)
      rows = rows.filter((d) => new Date(d.deliveryAt) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo); to.setHours(23, 59, 59, 999)
      rows = rows.filter((d) => new Date(d.deliveryAt) <= to)
    }
    return rows
  }, [deliveries, search, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Summary stats
  const stats = useMemo(() => ({
    total: deliveries.length,
    billed: deliveries.filter((d) => d.status === 'BILLED').length,
    completed: deliveries.filter((d) => d.status === 'COMPLETED').length,
    pending: deliveries.filter((d) => !['BILLED', 'COMPLETED', 'CANCELLED'].includes(d.status)).length,
  }), [deliveries])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex' }}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)' }} onClick={onClose} />

      {/* Panel */}
      <div style={{ position: 'relative', marginLeft: 'auto', width: '100%', maxWidth: 860, background: '#f8fafc', display: 'flex', flexDirection: 'column', height: '100%', boxShadow: '-12px 0 40px rgba(0,0,0,0.15)' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px 16px', background: 'linear-gradient(135deg, #059669, #064e3b)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <BillerRowIcon />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{biller.siteName || biller.contactName || 'Biller'}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                  {biller.contactPhone && <span>{biller.contactPhone}</span>}
                  {biller.siteAddress && <span style={{ marginLeft: 8 }}>· {biller.siteAddress}</span>}
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" width="15" height="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Stats */}
          {!loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16 }}>
              {[
                { label: 'Total', value: stats.total, color: '#fff' },
                { label: 'Pending', value: stats.pending, color: '#fcd34d' },
                { label: 'Completed', value: stats.completed, color: '#6ee7b7' },
                { label: 'Billed', value: stats.billed, color: '#93c5fd' },
              ].map((s) => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={{ padding: '14px 20px', background: '#fff', borderBottom: '1px solid #e8eaf0', display: 'flex', flexWrap: 'wrap', gap: 10, flexShrink: 0 }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><SearchIcon /></div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search delivery no, customer, area, status, invoice…"
              style={{ width: '100%', height: 36, paddingLeft: 34, paddingRight: 12, border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#374151', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#6ee7b7')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
            />
          </div>
          {/* Date range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#94a3b8' }}><CalendarIcon /></span>
            <input
              type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              style={{ height: 36, padding: '0 10px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 12, color: '#374151', background: '#f8fafc', outline: 'none', cursor: 'pointer' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#6ee7b7')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
            />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>to</span>
            <input
              type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              style={{ height: 36, padding: '0 10px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 12, color: '#374151', background: '#f8fafc', outline: 'none', cursor: 'pointer' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#6ee7b7')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
            />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo('') }}
                style={{ height: 36, padding: '0 10px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, color: '#64748b', cursor: 'pointer' }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results summary */}
        <div style={{ padding: '8px 20px', background: '#fff', borderBottom: '1px solid #f1f5f9', fontSize: 12, color: '#64748b', flexShrink: 0 }}>
          {loading ? 'Loading…' : `${filtered.length} deliveries${search || dateFrom || dateTo ? ' (filtered)' : ''}`}
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>Loading deliveries…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>No deliveries found</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                {search || dateFrom || dateTo ? 'Try adjusting your search or date range.' : 'No deliveries recorded for this biller yet.'}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={tHead}>Delivery No</th>
                  <th style={tHead}>Customer / Site</th>
                  <th style={tHead}>Godown</th>
                  <th style={tHead}>Items</th>
                  <th style={tHead}>Delivery Date</th>
                  <th style={tHead}>Status</th>
                  <th style={tHead}>Billing</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((d, idx) => (
                  <tr key={d.id}
                    style={{ background: idx % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafbfc')}>
                    <td style={{ ...tCell, fontWeight: 700, color: '#059669' }}>{d.deliveryNo}</td>
                    <td style={tCell}>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{d.customerName}</div>
                      {d.siteAddress && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{d.siteAddress}</div>}
                    </td>
                    <td style={{ ...tCell, fontSize: 12, color: '#64748b' }}>{d.primaryGodownName || '—'}</td>
                    <td style={{ ...tCell, fontSize: 12 }}>
                      {d.productCount != null ? (
                        <span><span style={{ fontWeight: 600 }}>{d.productCount}</span> items · <span style={{ fontWeight: 600 }}>{d.totalQty}</span> qty</span>
                      ) : '—'}
                    </td>
                    <td style={{ ...tCell, fontSize: 12, whiteSpace: 'nowrap' }}>
                      <div>{d.deliveryAt ? formatDateTime(d.deliveryAt) : '—'}</div>
                      {d.returnExpectedAt && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>↩ {formatDateTime(d.returnExpectedAt)}</div>}
                    </td>
                    <td style={tCell}><StatusBadge status={d.status} /></td>
                    <td style={tCell}>
                      {d.billingType === 'FREE' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20, background: '#ecfdf5', border: '1px solid #6ee7b7', fontSize: 11, fontWeight: 700, color: '#059669' }}>Billed Free</span>
                      )}
                      {d.billingType === 'INVOICE' && (
                        <div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 11, fontWeight: 700, color: '#1d4ed8' }}>Invoice</span>
                          <div style={{ fontSize: 11, color: '#374151', fontWeight: 600, marginTop: 3 }}>{d.invoiceNo}</div>
                          {d.invoiceName && <div style={{ fontSize: 11, color: '#64748b' }}>{d.invoiceName}</div>}
                        </div>
                      )}
                      {!d.billingType && <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ padding: '12px 20px', background: '#fff', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Page {page} of {totalPages} · {filtered.length} total
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button disabled={page <= 1} onClick={() => setPage(1)}
                style={{ height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: page <= 1 ? '#f8fafc' : '#fff', fontSize: 12, color: page <= 1 ? '#cbd5e1' : '#374151', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>«</button>
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: page <= 1 ? '#f8fafc' : '#fff', fontSize: 12, color: page <= 1 ? '#cbd5e1' : '#374151', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>‹ Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                const p = start + i
                return p <= totalPages ? (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ height: 32, width: 32, borderRadius: 8, border: '1px solid ' + (p === page ? '#059669' : '#e2e8f0'), background: p === page ? '#059669' : '#fff', fontSize: 12, fontWeight: p === page ? 700 : 400, color: p === page ? '#fff' : '#374151', cursor: 'pointer' }}>{p}</button>
                ) : null
              })}
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: page >= totalPages ? '#f8fafc' : '#fff', fontSize: 12, color: page >= totalPages ? '#cbd5e1' : '#374151', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>Next ›</button>
              <button disabled={page >= totalPages} onClick={() => setPage(totalPages)}
                style={{ height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: page >= totalPages ? '#f8fafc' : '#fff', fontSize: 12, color: page >= totalPages ? '#cbd5e1' : '#374151', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── main ───────────────────────────────────────────────────────────────────
export function BillersPage() {
  const auth = useAuth()
  const isAdmin = auth.status === 'authenticated' && auth.user.role === 'ADMIN'

  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ siteName: '', contactName: '', contactPhone: '', siteAddress: '', password: '' })
  const [addSaving, setAddSaving] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [editForm, setEditForm] = useState({ siteName: '', contactName: '', contactPhone: '', siteAddress: '' })
  const [editSaving, setEditSaving] = useState(false)

  const [selectedBiller, setSelectedBiller] = useState<UserRow | null>(null)

  const load = () => {
    const token = getToken(); if (!token) return
    setError(null); setLoading(true)
    apiFetch<UserRow[]>('/users', { token })
      .then(setUsers)
      .catch((e: any) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const billers = useMemo(() => users.filter((u) => u.role === 'BILLER'), [users])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return billers
    return billers.filter((b) =>
      (b.siteName?.toLowerCase().includes(s) ?? false) ||
      (b.contactPhone?.toLowerCase().includes(s) ?? false) ||
      (b.contactName?.toLowerCase().includes(s) ?? false)
    )
  }, [billers, q])

  const openEdit = (b: UserRow) => {
    setEditing(b)
    setEditForm({ siteName: b.siteName || '', contactName: b.contactName || '', contactPhone: b.contactPhone || '', siteAddress: b.siteAddress || '' })
    setEditOpen(true)
  }

  const openAdd = () => {
    setAddForm({ siteName: '', contactName: '', contactPhone: '', siteAddress: '', password: '' })
    setAddOpen(true)
  }

  const handleAdd = () => {
    const token = getToken(); if (!token || !addForm.siteName.trim()) return
    setAddSaving(true)
    apiFetch('/users/billers', { token, method: 'POST', body: JSON.stringify({ siteName: addForm.siteName.trim(), siteAddress: addForm.siteAddress.trim() || undefined, contactName: addForm.contactName.trim() || undefined, contactPhone: addForm.contactPhone.trim() || undefined, password: addForm.password || undefined }) })
      .then(() => { setAddOpen(false); setAddForm({ siteName: '', contactName: '', contactPhone: '', siteAddress: '', password: '' }); load() })
      .catch((e: any) => setError(e?.message || 'Create failed'))
      .finally(() => setAddSaving(false))
  }

  const handleResetPassword = (b: UserRow) => {
    const pwd = window.prompt('New password for ' + (b.siteName || b.contactPhone || 'this biller') + '?')
    if (!pwd || pwd.length < 4) return
    const token = getToken(); if (!token) return
    apiFetch(`/users/${b.id}/reset-password`, { token, method: 'POST', body: JSON.stringify({ password: pwd }) })
      .then(() => load())
      .catch((e: any) => setError(e?.message || 'Reset failed'))
  }

  const handleDelete = (b: UserRow) => {
    const label = b.siteName || b.contactPhone || 'this biller'
    if (!confirm(`Permanently delete biller "${label}"? This cannot be undone.`)) return
    const token = getToken(); if (!token) return
    apiFetch(`/users/${b.id}`, { token, method: 'DELETE' })
      .then(() => load())
      .catch((e: any) => setError(e?.message || 'Delete failed'))
  }

  return (
    <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Masters: Billers</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>Create biller accounts (site, contact, login). Click a row to view their delivery history.</p>
        </div>
        {isAdmin && (
          <button type="button" onClick={openAdd}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 12, border: 'none', background: '#059669', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            Add Biller
          </button>
        )}
      </div>

      {/* ── MAIN CARD ── */}
      <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Billers <span style={{ fontSize: 13, fontWeight: 400, color: '#94a3b8' }}>({rows.length})</span></div>
          <div style={{ position: 'relative', width: 240 }}>
            <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><SearchIcon /></div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search billers..."
              style={{ width: '100%', height: 36, paddingLeft: 34, paddingRight: 12, border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#374151', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#6ee7b7')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')} />
          </div>
        </div>

        {error && <div style={{ margin: '12px 22px', padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#b91c1c', fontSize: 13, border: '1px solid #fecaca' }}>{error}</div>}

        {loading ? (
          <div style={{ padding: '32px 22px', fontSize: 13, color: '#94a3b8' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '40px 22px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>No billers found</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{isAdmin ? 'Click "Add Biller" to create your first biller account.' : 'No billers match your search.'}</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={tHead}>Site</th>
                  <th style={tHead}>Contact</th>
                  <th style={tHead}>Phone</th>
                  <th style={{ ...tHead, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b, index) => (
                  <tr key={b.id}
                    style={{ background: index % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background 0.12s', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#ecfdf5')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = index % 2 === 0 ? '#fff' : '#fafbfc')}
                    onClick={() => setSelectedBiller(b)}>

                    <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 10, background: '#ecfdf5', color: '#059669', flexShrink: 0 }}>
                          <BillerRowIcon />
                        </span>
                        <div>
                          <span>{b.siteName || '—'}</span>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Click to view deliveries</div>
                        </div>
                      </div>
                    </td>
                    <td style={tCell}>{b.contactName || '—'}</td>
                    <td style={tCell}>{b.contactPhone || '—'}</td>
                    <td style={{ ...tCell, textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                        <button type="button" title="Edit biller" onClick={() => openEdit(b)} style={iconActionBtn}
                          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#ecfdf5'; el.style.borderColor = '#a7f3d0'; el.style.color = '#059669' }}
                          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff'; el.style.borderColor = '#e2e8f0'; el.style.color = '#64748b' }}>
                          <EditIcon />
                        </button>
                        <button type="button" title="Reset password" onClick={() => handleResetPassword(b)} style={iconActionBtn}
                          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#ecfdf5'; el.style.borderColor = '#a7f3d0'; el.style.color = '#059669' }}
                          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff'; el.style.borderColor = '#e2e8f0'; el.style.color = '#64748b' }}>
                          <KeyIcon />
                        </button>
                        {isAdmin && (
                          <button type="button" title="Delete biller" onClick={() => handleDelete(b)} style={iconActionBtn}
                            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#fef2f2'; el.style.borderColor = '#fecaca'; el.style.color = '#dc2626' }}
                            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff'; el.style.borderColor = '#e2e8f0'; el.style.color = '#64748b' }}>
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ADD MODAL ── */}
      <Modal open={addOpen} title="Add biller" onClose={() => setAddOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAddOpen(false)} style={{ height: 38, padding: '0 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Cancel</button>
            <button type="button" disabled={addSaving || !addForm.siteName.trim()} onClick={handleAdd}
              style={{ height: 38, padding: '0 18px', borderRadius: 10, border: 'none', background: addSaving || !addForm.siteName.trim() ? '#6ee7b7' : '#059669', fontSize: 13, fontWeight: 600, color: '#fff', cursor: addSaving || !addForm.siteName.trim() ? 'not-allowed' : 'pointer' }}>
              {addSaving ? 'Adding…' : 'Add biller'}
            </button>
          </div>
        }>
        <div className="space-y-4">
          <Input label="Site name" value={addForm.siteName} onChange={(e) => setAddForm((f) => ({ ...f, siteName: e.target.value }))} placeholder="Outlet / site" />
          <Input label="Contact name" value={addForm.contactName} onChange={(e) => setAddForm((f) => ({ ...f, contactName: e.target.value }))} placeholder="Person name" />
          <Input label="Contact phone" value={addForm.contactPhone} onChange={(e) => setAddForm((f) => ({ ...f, contactPhone: e.target.value }))} placeholder="Mobile number" />
          <Input label="Site address" value={addForm.siteAddress} onChange={(e) => setAddForm((f) => ({ ...f, siteAddress: e.target.value }))} placeholder="Street, area" />
          <Input type="password" label="Password" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} placeholder="Optional — defaults to 123456" autoComplete="new-password" />
        </div>
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal open={editOpen} title={editing ? `Edit ${editing.siteName || 'biller'}` : 'Edit biller'} onClose={() => setEditOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditOpen(false)} style={{ height: 38, padding: '0 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Cancel</button>
            <button type="button" disabled={editSaving || !editing}
              onClick={() => {
                const token = getToken(); if (!token || !editing) return
                setEditSaving(true)
                apiFetch(`/users/${editing.id}`, { token, method: 'PATCH', body: JSON.stringify({ siteName: editForm.siteName.trim() || undefined, contactName: editForm.contactName.trim() || undefined, contactPhone: editForm.contactPhone.trim() || undefined, siteAddress: editForm.siteAddress.trim() || undefined }) })
                  .then(() => { setEditOpen(false); setEditing(null); load() })
                  .catch((e: any) => setError(e?.message || 'Update failed'))
                  .finally(() => setEditSaving(false))
              }}
              style={{ height: 38, padding: '0 18px', borderRadius: 10, border: 'none', background: editSaving || !editing ? '#6ee7b7' : '#059669', fontSize: 13, fontWeight: 600, color: '#fff', cursor: editSaving || !editing ? 'not-allowed' : 'pointer' }}>
              {editSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        }>
        <div className="space-y-4">
          <Input label="Site name" value={editForm.siteName} onChange={(e) => setEditForm((f) => ({ ...f, siteName: e.target.value }))} />
          <Input label="Contact name" value={editForm.contactName} onChange={(e) => setEditForm((f) => ({ ...f, contactName: e.target.value }))} />
          <Input label="Contact phone" value={editForm.contactPhone} onChange={(e) => setEditForm((f) => ({ ...f, contactPhone: e.target.value }))} />
          <Input label="Site address" value={editForm.siteAddress} onChange={(e) => setEditForm((f) => ({ ...f, siteAddress: e.target.value }))} />
        </div>
      </Modal>

      {/* ── BILLER DELIVERIES PANEL ── */}
      {selectedBiller && <BillerDeliveriesPanel biller={selectedBiller} onClose={() => setSelectedBiller(null)} />}
    </div>
  )
}