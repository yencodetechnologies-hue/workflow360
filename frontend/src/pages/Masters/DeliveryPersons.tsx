// import { useEffect, useMemo, useState } from 'react'
// import { Button } from '../../components/ui/Button'
// import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// import { Input } from '../../components/ui/Input'
// import { PageHeader } from '../../components/ui/PageHeader'
// import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
// import { apiFetch } from '../../lib/api'
// import { getToken } from '../../auth/store'

// type UserRow = {
//   id: string
//   role: string
//   loginId?: string
//   email?: string
//   contactName?: string
//   contactPhone?: string
//   active?: boolean
// }

// export function DeliveryPersonsPage() {
//   const [users, setUsers] = useState<UserRow[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [saving, setSaving] = useState(false)
//   const [q, setQ] = useState('')
//   const [form, setForm] = useState({ name: '', loginId: '', phone: '', password: '' })

//   const load = () => {
//     const token = getToken()
//     if (!token) return
//     setError(null)
//     setLoading(true)
//     apiFetch<UserRow[]>('/users', { token })
//       .then((list) => setUsers(list.filter((u) => u.role === 'DELIVERY')))
//       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
//       .finally(() => setLoading(false))
//   }

//   useEffect(() => {
//     load()
//   }, [])

//   const rows = useMemo(() => {
//     const s = q.trim().toLowerCase()
//     if (!s) return users
//     return users.filter(
//       (p) =>
//         (p.contactName?.toLowerCase().includes(s) ?? false) ||
//         (p.loginId?.toLowerCase().includes(s) ?? false) ||
//         (p.contactPhone?.toLowerCase().includes(s) ?? false),
//     )
//   }, [users, q])

//   return (
//     <div>
//       <PageHeader
//         title="Masters: Delivery Persons"
//         subtitle="Delivery staff accounts (vehicle login ID + password)."
//       />

//       <Card>
//         <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//           <CardTitle>Delivery persons</CardTitle>
//           <div className="w-full sm:w-72">
//             <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-10" />
//           </div>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
//             <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
//             <Input
//               label="Vehicle / login ID"
//               value={form.loginId}
//               onChange={(e) => setForm((f) => ({ ...f, loginId: e.target.value.toUpperCase() }))}
//               placeholder="TN09AB1234"
//             />
//             <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
//             <Input
//               label="Password"
//               type="password"
//               value={form.password}
//               onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
//             />
//           </div>
//           <Button
//             disabled={saving || !form.loginId.trim() || !form.password.trim()}
//             onClick={() => {
//               const token = getToken()
//               if (!token) return
//               setSaving(true)
//               apiFetch('/users', {
//                 token,
//                 method: 'POST',
//                 body: JSON.stringify({
//                   role: 'DELIVERY',
//                   loginId: form.loginId.trim(),
//                   password: form.password,
//                   contactName: form.name.trim() || undefined,
//                   contactPhone: form.phone.trim() || undefined,
//                 }),
//               })
//                 .then(() => {
//                   setForm({ name: '', loginId: '', phone: '', password: '' })
//                   load()
//                 })
//                 .catch((e: { message?: string }) => setError(e?.message || 'Create failed'))
//                 .finally(() => setSaving(false))
//             }}
//           >
//             {saving ? 'Adding…' : 'Add delivery person'}
//           </Button>

//           {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

//           {loading ? (
//             <div className="text-sm text-slate-600">Loading…</div>
//           ) : rows.length === 0 ? (
//             <EmptyState title="No delivery persons" subtitle="Add a delivery account above." />
//           ) : (
//             <Table>
//               <thead>
//                 <tr>
//                   <Th>Name</Th>
//                   <Th>Login ID</Th>
//                   <Th>Phone</Th>
//                   <Th>Status</Th>
//                   <Th className="text-right">Actions</Th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {rows.map((p) => (
//                   <tr key={p.id} className="hover:bg-slate-50">
//                     <Td className="font-semibold text-slate-900">{p.contactName || '—'}</Td>
//                     <Td className="font-mono text-xs text-slate-600">{p.loginId || '—'}</Td>
//                     <Td>{p.contactPhone || '—'}</Td>
//                     <Td>{p.active === false ? 'Inactive' : 'Active'}</Td>
//                     <Td className="text-right">
//                       <Button
//                         size="sm"
//                         variant="secondary"
//                         onClick={() => {
//                           const token = getToken()
//                           if (!token) return
//                           const pwd = window.prompt(`New password for ${p.loginId}?`)
//                           if (!pwd || pwd.length < 4) return
//                           apiFetch(`/users/${p.id}/reset-password`, {
//                             token,
//                             method: 'POST',
//                             body: JSON.stringify({ password: pwd }),
//                           })
//                             .then(() => load())
//                             .catch((e: { message?: string }) => setError(e?.message || 'Reset failed'))
//                         }}
//                       >
//                         Reset password
//                       </Button>
//                     </Td>
//                   </tr>
//                 ))}
//               </tbody>
//             </Table>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }


import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { getToken } from '../../auth/store'

type UserRow = {
  id: string
  role: string
  loginId?: string
  email?: string
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

const fieldInput: React.CSSProperties = {
  width: '100%',
  height: 38,
  padding: '0 12px',
  border: '1px solid #e2e8f0',
  borderRadius: 9,
  fontSize: 13,
  color: '#374151',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

// ── main ───────────────────────────────────────────────────────────────────

export function DeliveryPersonsPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [q, setQ] = useState('')
  const [form, setForm] = useState({ name: '', loginId: '', phone: '', password: '' })

  const load = () => {
    const token = getToken()
    if (!token) return
    setError(null); setLoading(true)
    apiFetch<UserRow[]>('/users', { token })
      .then((list) => setUsers(list.filter((u) => u.role === 'DELIVERY')))
      .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return users
    return users.filter(
      (p) =>
        (p.contactName?.toLowerCase().includes(s) ?? false) ||
        (p.loginId?.toLowerCase().includes(s) ?? false) ||
        (p.contactPhone?.toLowerCase().includes(s) ?? false),
    )
  }, [users, q])

  const handleAdd = () => {
    const token = getToken(); if (!token) return
    setSaving(true)
    apiFetch('/users', {
      token, method: 'POST',
      body: JSON.stringify({
        role: 'DELIVERY',
        loginId: form.loginId.trim(),
        password: form.password,
        contactName: form.name.trim() || undefined,
        contactPhone: form.phone.trim() || undefined,
      }),
    })
      .then(() => { setForm({ name: '', loginId: '', phone: '', password: '' }); load() })
      .catch((e: { message?: string }) => setError(e?.message || 'Create failed'))
      .finally(() => setSaving(false))
  }

  const handleResetPassword = (p: UserRow) => {
    const token = getToken(); if (!token) return
    const pwd = window.prompt(`New password for ${p.loginId}?`)
    if (!pwd || pwd.length < 4) return
    apiFetch(`/users/${p.id}/reset-password`, {
      token, method: 'POST',
      body: JSON.stringify({ password: pwd }),
    })
      .then(() => load())
      .catch((e: { message?: string }) => setError(e?.message || 'Reset failed'))
  }

  const isDisabled = saving || !form.loginId.trim() || !form.password.trim()

  // ── render ────────────────────────────────────────────────────────────────

  return (
    // AppShell provides 20px 24px padding
    <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── PAGE HEADER ── */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Masters: Delivery Persons
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
          Delivery staff accounts (vehicle login ID + password).
        </p>
      </div>

      {/* ── MAIN CARD ── */}
      <div style={{
        background: '#fff',
        border: '1px solid #e8eaf0',
        borderRadius: 16,
        overflow: 'hidden',
      }}>

        {/* ── card header: title + search ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid #f1f5f9',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            Delivery persons
          </div>

          {/* search */}
          <div style={{ position: 'relative', width: 240 }}>
            <div style={{
              position: 'absolute', left: 11, top: '50%',
              transform: 'translateY(-50%)', pointerEvents: 'none',
            }}>
              <svg viewBox="0 0 24 24" fill="none" width="15" height="15"
                stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M16.5 16.5 21 21" />
              </svg>
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              style={{
                ...fieldInput,
                paddingLeft: 34,
                background: '#f8fafc',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#a5b4fc')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
            />
          </div>
        </div>

        {/* ── ADD FORM ── */}
        <div style={{ padding: '20px 22px', borderBottom: '1px solid #f1f5f9' }}>
          {/* 4-column input grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 16,
          }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Driver name"
                style={fieldInput}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#a5b4fc')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
              />
            </div>

            {/* Vehicle / Login ID */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Vehicle / login ID
              </label>
              <input
                value={form.loginId}
                onChange={(e) => setForm((f) => ({ ...f, loginId: e.target.value.toUpperCase() }))}
                placeholder="TN09AB1234"
                style={fieldInput}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#a5b4fc')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Mobile number"
                style={fieldInput}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#a5b4fc')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Password
              </label>
              <input
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                type="password"
                style={fieldInput}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#a5b4fc')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
              />
            </div>
          </div>

          {/* Add button */}
          <button
            disabled={isDisabled}
            onClick={handleAdd}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 38, padding: '0 20px', borderRadius: 10, border: 'none',
              background: isDisabled ? '#a5b4fc' : '#4f46e5',
              fontSize: 13, fontWeight: 600, color: '#fff',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isDisabled) (e.currentTarget as HTMLElement).style.background = '#4338ca'
            }}
            onMouseLeave={(e) => {
              if (!isDisabled) (e.currentTarget as HTMLElement).style.background = '#4f46e5'
            }}
          >
            {saving ? 'Adding…' : 'Add delivery person'}
          </button>
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
            <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>No delivery persons found</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Add a delivery account above.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={tHead}>Name</th>
                  <th style={tHead}>Login ID</th>
                  <th style={tHead}>Phone</th>
                  <th style={tHead}>Status</th>
                  <th style={{ ...tHead, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p, index) => (
                  <tr
                    key={p.id}
                    style={{
                      background: index % 2 === 0 ? '#fff' : '#fafbfc',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.5)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = index % 2 === 0 ? '#fff' : '#fafbfc')}
                  >
                    {/* NAME */}
                    <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>
                      {p.contactName || '—'}
                    </td>

                    {/* LOGIN ID */}
                    <td style={{ ...tCell, fontFamily: 'monospace', fontSize: 12, color: '#4f46e5' }}>
                      {p.loginId || '—'}
                    </td>

                    {/* PHONE */}
                    <td style={tCell}>{p.contactPhone || '—'}</td>

                    {/* STATUS */}
                    <td style={tCell}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: 12, fontWeight: 600,
                        color: p.active === false ? '#dc2626' : '#16a34a',
                      }}>
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: p.active === false ? '#ef4444' : '#22c55e',
                          flexShrink: 0,
                        }} />
                        {p.active === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td style={{ ...tCell, textAlign: 'right' }}>
                      <button
                        onClick={() => handleResetPassword(p)}
                        style={{
                          display: 'inline-flex', alignItems: 'center',
                          height: 32, padding: '0 14px', borderRadius: 8,
                          border: '1px solid #e2e8f0', background: '#fff',
                          fontSize: 12, fontWeight: 600, color: '#374151',
                          cursor: 'pointer', transition: 'all 0.15s',
                          whiteSpace: 'nowrap',
                        }}
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
                      >
                        Reset password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}