import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
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
    setError(null)
    setLoading(true)
    apiFetch<UserRow[]>('/users', { token })
      .then((list) => setUsers(list.filter((u) => u.role === 'DELIVERY')))
      .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

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

  return (
    <div>
      <PageHeader
        title="Masters: Delivery Persons"
        subtitle="Delivery staff accounts (vehicle login ID + password)."
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Delivery persons</CardTitle>
          <div className="w-full sm:w-72">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-10" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
            <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input
              label="Vehicle / login ID"
              value={form.loginId}
              onChange={(e) => setForm((f) => ({ ...f, loginId: e.target.value.toUpperCase() }))}
              placeholder="TN09AB1234"
            />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
          <Button
            disabled={saving || !form.loginId.trim() || !form.password.trim()}
            onClick={() => {
              const token = getToken()
              if (!token) return
              setSaving(true)
              apiFetch('/users', {
                token,
                method: 'POST',
                body: JSON.stringify({
                  role: 'DELIVERY',
                  loginId: form.loginId.trim(),
                  password: form.password,
                  contactName: form.name.trim() || undefined,
                  contactPhone: form.phone.trim() || undefined,
                }),
              })
                .then(() => {
                  setForm({ name: '', loginId: '', phone: '', password: '' })
                  load()
                })
                .catch((e: { message?: string }) => setError(e?.message || 'Create failed'))
                .finally(() => setSaving(false))
            }}
          >
            {saving ? 'Adding…' : 'Add delivery person'}
          </Button>

          {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          {loading ? (
            <div className="text-sm text-slate-600">Loading…</div>
          ) : rows.length === 0 ? (
            <EmptyState title="No delivery persons" subtitle="Add a delivery account above." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Login ID</Th>
                  <Th>Phone</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{p.contactName || '—'}</Td>
                    <Td className="font-mono text-xs text-slate-600">{p.loginId || '—'}</Td>
                    <Td>{p.contactPhone || '—'}</Td>
                    <Td>{p.active === false ? 'Inactive' : 'Active'}</Td>
                    <Td className="text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const token = getToken()
                          if (!token) return
                          const pwd = window.prompt(`New password for ${p.loginId}?`)
                          if (!pwd || pwd.length < 4) return
                          apiFetch(`/users/${p.id}/reset-password`, {
                            token,
                            method: 'POST',
                            body: JSON.stringify({ password: pwd }),
                          })
                            .then(() => load())
                            .catch((e: { message?: string }) => setError(e?.message || 'Reset failed'))
                        }}
                      >
                        Reset password
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
