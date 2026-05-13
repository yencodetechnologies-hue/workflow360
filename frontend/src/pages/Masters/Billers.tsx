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
  email: string
  role: string
  siteName?: string
  contactPhone?: string
  active?: boolean
}

export function BillersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [form, setForm] = useState({ siteName: '', contactPhone: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    const token = getToken()
    if (!token) return
    setError(null)
    setLoading(true)
    apiFetch<UserRow[]>('/users', { token })
      .then(setUsers)
      .catch((e: any) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const billers = useMemo(() => users.filter((u) => u.role === 'BILLER'), [users])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return billers
    return billers.filter(
      (b) =>
        b.email.toLowerCase().includes(s) ||
        (b.siteName?.toLowerCase().includes(s) ?? false) ||
        (b.contactPhone?.toLowerCase().includes(s) ?? false),
    )
  }, [billers, q])

  return (
    <div>
      <PageHeader title="Masters: Billers" subtitle="Create biller accounts (site, contact, login)." />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Billers</CardTitle>
          <div className="w-full sm:w-72">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search billers…" className="h-10" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Site name"
              value={form.siteName}
              onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))}
              placeholder="Outlet / site"
            />
            <Input
              label="Contact phone"
              value={form.contactPhone}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
              placeholder="Phone"
            />
            <Input
              label="Email (login)"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="name@company.com"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <Button
            disabled={saving || !form.email.trim() || !form.password.trim()}
            onClick={() => {
              const token = getToken()
              if (!token) return
              setSaving(true)
              apiFetch('/users', {
                token,
                method: 'POST',
                body: JSON.stringify({
                  email: form.email.trim(),
                  password: form.password,
                  role: 'BILLER',
                  siteName: form.siteName.trim() || undefined,
                  contactPhone: form.contactPhone.trim() || undefined,
                }),
              })
                .then(() => {
                  setForm({ siteName: '', contactPhone: '', email: '', password: '' })
                  load()
                })
                .catch((e: any) => setError(e?.message || 'Create failed'))
                .finally(() => setSaving(false))
            }}
          >
            {saving ? 'Adding…' : 'Add biller'}
          </Button>

          {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          {loading ? (
            <div className="text-sm text-slate-600">Loading…</div>
          ) : rows.length === 0 ? (
            <EmptyState title="No billers" subtitle="Add your first biller above." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Site</Th>
                  <Th>Contact</Th>
                  <Th>Email</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{b.siteName || '—'}</Td>
                    <Td>{b.contactPhone || '—'}</Td>
                    <Td className="font-mono text-xs">{b.email}</Td>
                    <Td>
                      <span className={b.active === false ? 'text-rose-600' : 'text-slate-700'}>
                        {b.active === false ? 'Inactive' : 'Active'}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const token = getToken()
                          if (!token) return
                          const pwd = window.prompt('New password for ' + b.email + '?')
                          if (!pwd || pwd.length < 4) return
                          apiFetch(`/users/${b.id}/reset-password`, {
                            token,
                            method: 'POST',
                            body: JSON.stringify({ password: pwd }),
                          })
                            .then(() => load())
                            .catch((e: any) => setError(e?.message || 'Reset failed'))
                        }}
                      >
                        Reset password
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className="ml-2"
                        onClick={() => {
                          if (!confirm(`Deactivate ${b.email}?`)) return
                          const token = getToken()
                          if (!token) return
                          apiFetch(`/users/${b.id}/active`, {
                            token,
                            method: 'PATCH',
                            body: JSON.stringify({ active: false }),
                          })
                            .then(() => load())
                            .catch((e: any) => setError(e?.message || 'Update failed'))
                        }}
                      >
                        Deactivate
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
