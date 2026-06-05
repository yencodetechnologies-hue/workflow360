

import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { apiFetch } from '../../lib/api'
import { getToken } from '../../auth/store'

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
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  // const [form, setForm] = useState({
  //   siteName: '', contactName: '', contactPhone: '', email: '', password: '',
  // })
  const [saving, setSaving] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [editForm, setEditForm] = useState({
    siteName: '', contactName: '', contactPhone: '', siteAddress: '',
  })

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

  // ── render ────────────────────────────────────────────────────────────────

  return (
    // AppShell provides 20px 24px padding
    <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── PAGE HEADER ── */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Masters: Billers</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
          Create biller accounts (site, contact, login).
        </p>
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
              onFocus={(e) => (e.currentTarget.style.borderColor = '#a5b4fc')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
            />
          </div>
        </div>

        {/* ── ADD BILLER FORM ── */}
     

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
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Add your first biller above.</div>
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
                      {b.siteName || '—'}
                    </td>

                    {/* CONTACT */}
                    <td style={tCell}>{b.contactName || '—'}</td>

                    {/* PHONE */}
                    <td style={tCell}>{b.contactPhone || '—'}</td>

                    {/* EMAIL */}
                    <td style={{ ...tCell, fontFamily: 'monospace', fontSize: 12, color: '#4f46e5' }}>
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
                            el.style.background = '#f0eeff'
                            el.style.borderColor = '#c4b5fd'
                            el.style.color = '#4f46e5'
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
                            el.style.background = '#f0eeff'
                            el.style.borderColor = '#c4b5fd'
                            el.style.color = '#4f46e5'
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── EDIT MODAL ── */}
      <Modal
        open={editOpen}
        title={editing ? `Edit ${editing.siteName || editing.email}` : 'Edit biller'}
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditOpen(false)}
              style={{
                height: 38, padding: '0 18px', borderRadius: 10,
                border: '1px solid #e2e8f0', background: '#fff',
                fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
              }}
            >Cancel</button>
            <button
              disabled={saving || !editing}
              onClick={() => {
                const token = getToken(); if (!token || !editing) return
                setSaving(true)
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
                  .finally(() => setSaving(false))
              }}
              style={{
                height: 38, padding: '0 18px', borderRadius: 10, border: 'none',
                background: saving || !editing ? '#a5b4fc' : '#4f46e5',
                fontSize: 13, fontWeight: 600, color: '#fff',
                cursor: saving || !editing ? 'not-allowed' : 'pointer',
              }}
            >{saving ? 'Saving…' : 'Save'}</button>
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
              Login email: <span style={{ fontFamily: 'monospace', color: '#4f46e5' }}>{editing.email}</span> (cannot be changed here)
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}

