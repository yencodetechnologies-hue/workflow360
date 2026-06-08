

import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'

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

// ── shared styles ──────────────────────────────────────────────────────────

const tHead: React.CSSProperties = {
  padding: '10px 16px',
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
  padding: '14px 16px',
  fontSize: 13,
  color: '#374151',
  borderBottom: '1px solid #f1f5f9',
  verticalAlign: 'middle',
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden>
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BillerRowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden>
      <path d="M3 21h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6 21V10l6-4 6 4v11" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 14h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

const iconActionBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#64748b',
  cursor: 'pointer',
  transition: 'all 0.15s',
}

const actionBtn = (variant: 'default' | 'danger'): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  height: 32,
  padding: '0 14px',
  borderRadius: 8,
  border: variant === 'danger' ? 'none' : '1px solid #e2e8f0',
  background: variant === 'danger' ? '#ef4444' : '#fff',
  fontSize: 12,
  fontWeight: 600,
  color: variant === 'danger' ? '#fff' : '#374151',
  cursor: 'pointer',
  transition: 'all 0.15s',
  whiteSpace: 'nowrap' as const,
})

// ── main ───────────────────────────────────────────────────────────────────

export function BillersPage() {
  const auth = useAuth()
  const isAdmin = auth.status === 'authenticated' && auth.user.role === 'ADMIN'

  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({
    siteName: '', contactName: '', contactPhone: '', siteAddress: '', email: '', password: '',
  })
  const [addSaving, setAddSaving] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [editForm, setEditForm] = useState({
    siteName: '', contactName: '', contactPhone: '', siteAddress: '',
  })
  const [editSaving, setEditSaving] = useState(false)

  const load = () => {
    const token = getToken()
    if (!token) return
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
      b.email.toLowerCase().includes(s) ||
      (b.siteName?.toLowerCase().includes(s) ?? false) ||
      (b.contactPhone?.toLowerCase().includes(s) ?? false) ||
      (b.contactName?.toLowerCase().includes(s) ?? false)
    )
  }, [billers, q])

  const openEdit = (b: UserRow) => {
    setEditing(b)
    setEditForm({
      siteName: b.siteName || '',
      contactName: b.contactName || '',
      contactPhone: b.contactPhone || '',
      siteAddress: b.siteAddress || '',
    })
    setEditOpen(true)
  }

  const openAdd = () => {
    setAddForm({ siteName: '', contactName: '', contactPhone: '', siteAddress: '', email: '', password: '' })
    setAddOpen(true)
  }

  const handleAdd = () => {
    const token = getToken()
    if (!token || !addForm.siteName.trim()) return
    setAddSaving(true)
    apiFetch('/users/billers', {
      token,
      method: 'POST',
      body: JSON.stringify({
        siteName: addForm.siteName.trim(),
        siteAddress: addForm.siteAddress.trim() || undefined,
        contactName: addForm.contactName.trim() || undefined,
        contactPhone: addForm.contactPhone.trim() || undefined,
        email: addForm.email.trim() || undefined,
        password: addForm.password || undefined,
      }),
    })
      .then(() => {
        setAddOpen(false)
        setAddForm({ siteName: '', contactName: '', contactPhone: '', siteAddress: '', email: '', password: '' })
        load()
      })
      .catch((e: any) => setError(e?.message || 'Create failed'))
      .finally(() => setAddSaving(false))
  }

  const handleDeactivate = (b: UserRow) => {
    if (!confirm(`Deactivate ${b.email}?`)) return
    const token = getToken(); if (!token) return
    apiFetch(`/users/${b.id}/active`, {
      token, method: 'PATCH',
      body: JSON.stringify({ active: false }),
    })
      .then(() => load())
      .catch((e: any) => setError(e?.message || 'Update failed'))
  }

  const handleActivate = (b: UserRow) => {
  const token = getToken()
  if (!token) return

  apiFetch(`/users/${b.id}/active`, {
    token,
    method: 'PATCH',
    body: JSON.stringify({
      active: true,
    }),
  })
    .then(() => load())
    .catch((e: any) =>
      setError(e?.message || 'Activation failed')
    )
}

  const handleResetPassword = (b: UserRow) => {
    const pwd = window.prompt('New password for ' + b.email + '?')
    if (!pwd || pwd.length < 4) return
    const token = getToken(); if (!token) return
    apiFetch(`/users/${b.id}/reset-password`, {
      token, method: 'POST',
      body: JSON.stringify({ password: pwd }),
    })
      .then(() => load())
      .catch((e: any) => setError(e?.message || 'Reset failed'))
  }

  const handleDelete = (b: UserRow) => {
    const label = b.siteName || b.email
    if (!confirm(`Permanently delete biller "${label}"? This cannot be undone.`)) return
    const token = getToken(); if (!token) return
    apiFetch(`/users/${b.id}`, { token, method: 'DELETE' })
      .then(() => load())
      .catch((e: any) => setError(e?.message || 'Delete failed'))
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    // AppShell provides 20px 24px padding
    <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Masters: Billers</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
            Create biller accounts (site, contact, login).
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={openAdd}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 22px', borderRadius: 12, border: 'none',
              background: '#059669', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Biller
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

        {/* card header: title + search */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid #f1f5f9',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Billers</div>

          {/* search */}
          <div style={{ position: 'relative', width: 240 }}>
            <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <svg viewBox="0 0 24 24" fill="none" width="15" height="15" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M16.5 16.5 21 21" />
              </svg>
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search billers..."
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
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div style={{
            margin: '12px 22px', padding: '10px 14px', borderRadius: 10,
            background: '#fef2f2', color: '#b91c1c', fontSize: 13,
            border: '1px solid #fecaca',
          }}>{error}</div>
        )}

        {/* ── TABLE ── */}
        {loading ? (
          <div style={{ padding: '32px 22px', fontSize: 13, color: '#94a3b8' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '40px 22px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>No billers found</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              {isAdmin ? 'Click "Add Biller" to create your first biller account.' : 'No billers match your search.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={tHead}>Site</th>
                  <th style={tHead}>Contact</th>
                  <th style={tHead}>Phone</th>
                  <th style={tHead}>Email</th>
                  <th style={tHead}>Status</th>
                  <th style={{ ...tHead, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b, index) => (
                  <tr
                    key={b.id}
                    style={{
                      background: index % 2 === 0 ? '#fff' : '#fafbfc',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.5)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = index % 2 === 0 ? '#fff' : '#fafbfc')}
                  >
                    {/* SITE */}
                    <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            background: '#ecfdf5',
                            color: '#059669',
                            flexShrink: 0,
                          }}
                        >
                          <BillerRowIcon />
                        </span>
                        <span>{b.siteName || '—'}</span>
                      </div>
                    </td>

                    {/* CONTACT */}
                    <td style={tCell}>{b.contactName || '—'}</td>

                    {/* PHONE */}
                    <td style={tCell}>{b.contactPhone || '—'}</td>

                    {/* EMAIL */}
                    <td style={{ ...tCell, fontFamily: 'monospace', fontSize: 12, color: '#059669' }}>
                      {b.email}
                    </td>

                    {/* STATUS */}
                    <td style={tCell}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: 12, fontWeight: 600,
                        color: b.active === false ? '#dc2626' : '#16a34a',
                      }}>
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: b.active === false ? '#ef4444' : '#22c55e',
                          flexShrink: 0,
                        }} />
                        {b.active === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td style={{ ...tCell, textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(b)}
                          style={actionBtn('default')}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLElement
                            el.style.background = '#ecfdf5'
                            el.style.borderColor = '#a7f3d0'
                            el.style.color = '#059669'
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLElement
                            el.style.background = '#fff'
                            el.style.borderColor = '#e2e8f0'
                            el.style.color = '#374151'
                          }}
                        >Edit</button>

                        {/* Reset password */}
                        <button
                          onClick={() => handleResetPassword(b)}
                          style={actionBtn('default')}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLElement
                            el.style.background = '#ecfdf5'
                            el.style.borderColor = '#a7f3d0'
                            el.style.color = '#059669'
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLElement
                            el.style.background = '#fff'
                            el.style.borderColor = '#e2e8f0'
                            el.style.color = '#374151'
                          }}
                        >Reset password</button>

                        {/* Deactivate */}
                        {/* <button
                          onClick={() => handleDeactivate(b)}
                          style={actionBtn('danger')}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#dc2626')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#ef4444')}
                        >Deactivate</button> */}

                        <button
  onClick={() =>
    b.active === false
      ? handleActivate(b)
      : handleDeactivate(b)
  }
  style={{
    ...actionBtn(b.active === false ? 'default' : 'danger'),
    background: b.active === false ? '#22c55e' : '#ef4444',
    color: '#fff',
    border: 'none',
  }}
>
  {b.active === false ? 'Activate' : 'Deactivate'}
</button>

                        {isAdmin && (
                          <button
                            type="button"
                            title="Delete biller"
                            onClick={() => handleDelete(b)}
                            style={iconActionBtn}
                            onMouseEnter={(e) => {
                              const el = e.currentTarget as HTMLElement
                              el.style.background = '#fef2f2'
                              el.style.borderColor = '#fecaca'
                              el.style.color = '#dc2626'
                            }}
                            onMouseLeave={(e) => {
                              const el = e.currentTarget as HTMLElement
                              el.style.background = '#fff'
                              el.style.borderColor = '#e2e8f0'
                              el.style.color = '#64748b'
                            }}
                          >
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
      <Modal
        open={addOpen}
        title="Add biller"
        onClose={() => setAddOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              style={{
                height: 38, padding: '0 18px', borderRadius: 10,
                border: '1px solid #e2e8f0', background: '#fff',
                fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
              }}
            >Cancel</button>
            <button
              type="button"
              disabled={addSaving || !addForm.siteName.trim()}
              onClick={handleAdd}
              style={{
                height: 38, padding: '0 18px', borderRadius: 10, border: 'none',
                background: addSaving || !addForm.siteName.trim() ? '#6ee7b7' : '#059669',
                fontSize: 13, fontWeight: 600, color: '#fff',
                cursor: addSaving || !addForm.siteName.trim() ? 'not-allowed' : 'pointer',
              }}
            >{addSaving ? 'Adding…' : 'Add biller'}</button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Site name" value={addForm.siteName} onChange={(e) => setAddForm((f) => ({ ...f, siteName: e.target.value }))} placeholder="Outlet / site" />
          <Input label="Contact name" value={addForm.contactName} onChange={(e) => setAddForm((f) => ({ ...f, contactName: e.target.value }))} placeholder="Person name" />
          <Input label="Contact phone" value={addForm.contactPhone} onChange={(e) => setAddForm((f) => ({ ...f, contactPhone: e.target.value }))} placeholder="Mobile number" />
          <Input label="Site address" value={addForm.siteAddress} onChange={(e) => setAddForm((f) => ({ ...f, siteAddress: e.target.value }))} placeholder="Street, area" />
          <Input label="Email (login)" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} placeholder="Optional — auto-generated if blank" />
          <Input type="password" label="Password" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} placeholder="Optional — defaults to 123456" autoComplete="new-password" />
        </div>
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal
        open={editOpen}
        title={editing ? `Edit ${editing.siteName || editing.email}` : 'Edit biller'}
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              style={{
                height: 38, padding: '0 18px', borderRadius: 10,
                border: '1px solid #e2e8f0', background: '#fff',
                fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
              }}
            >Cancel</button>
            <button
              type="button"
              disabled={editSaving || !editing}
              onClick={() => {
                const token = getToken(); if (!token || !editing) return
                setEditSaving(true)
                apiFetch(`/users/${editing.id}`, {
                  token, method: 'PATCH',
                  body: JSON.stringify({
                    siteName: editForm.siteName.trim() || undefined,
                    contactName: editForm.contactName.trim() || undefined,
                    contactPhone: editForm.contactPhone.trim() || undefined,
                    siteAddress: editForm.siteAddress.trim() || undefined,
                  }),
                })
                  .then(() => { setEditOpen(false); setEditing(null); load() })
                  .catch((e: any) => setError(e?.message || 'Update failed'))
                  .finally(() => setEditSaving(false))
              }}
              style={{
                height: 38, padding: '0 18px', borderRadius: 10, border: 'none',
                background: editSaving || !editing ? '#6ee7b7' : '#059669',
                fontSize: 13, fontWeight: 600, color: '#fff',
                cursor: editSaving || !editing ? 'not-allowed' : 'pointer',
              }}
            >{editSaving ? 'Saving…' : 'Save'}</button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Site name" value={editForm.siteName} onChange={(e) => setEditForm((f) => ({ ...f, siteName: e.target.value }))} />
          <Input label="Contact name" value={editForm.contactName} onChange={(e) => setEditForm((f) => ({ ...f, contactName: e.target.value }))} />
          <Input label="Contact phone" value={editForm.contactPhone} onChange={(e) => setEditForm((f) => ({ ...f, contactPhone: e.target.value }))} />
          <Input label="Site address" value={editForm.siteAddress} onChange={(e) => setEditForm((f) => ({ ...f, siteAddress: e.target.value }))} />
          {editing && (
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
              Login email: <span style={{ fontFamily: 'monospace', color: '#059669' }}>{editing.email}</span> (cannot be changed here)
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}

