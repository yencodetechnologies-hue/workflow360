import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatNumber } from '../../lib/format'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
import { apiFetch } from '../../lib/api'
import { getToken } from '../../auth/store'

export type GodownRow = {
  id: string
  name: string
  code?: string
  address?: string
  mobile?: string
  location?: string
  city?: string
  manager?: string
}

export function GodownsListPage() {
  const [godowns, setGodowns] = useState<GodownRow[]>([])
  const [stockByGodown, setStockByGodown] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '',
    code: '',
    address: '',
    mobile: '',
    location: '',
    password: '',
  })
  const [saving, setSaving] = useState(false)

  const load = () => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    setError(null)
    setLoading(true)
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

  useEffect(() => {
    load()
  }, [])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return godowns
    return godowns.filter((g) => {
      const hay = [
        g.name,
        g.code,
        g.address,
        g.mobile,
        g.location,
        g.city,
        g.manager,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(s)
    })
  }, [godowns, q])

  return (
    <div>
      <PageHeader
        title="Godowns"
        subtitle="Manage warehouses and view stock distribution."
        right={
          <Button variant="secondary" onClick={() => setAddOpen(true)}>
            Add Godown
          </Button>
        }
      />

      <Modal
        open={addOpen}
        title="Add godown"
        onClose={() => setAddOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                saving ||
                !addForm.name.trim() ||
                !addForm.code.trim() ||
                !addForm.mobile.trim() ||
                addForm.password.length < 6
              }
              onClick={() => {
                const token = getToken()
                if (!token) return
                setSaving(true)
                apiFetch<GodownRow>('/godowns', {
                  token,
                  method: 'POST',
                  body: JSON.stringify({
                    name: addForm.name.trim(),
                    code: addForm.code.trim(),
                    address: addForm.address.trim(),
                    mobile: addForm.mobile.trim(),
                    location: addForm.location.trim(),
                    password: addForm.password,
                  }),
                })
                  .then(() => {
                    setAddForm({
                      name: '',
                      code: '',
                      address: '',
                      mobile: '',
                      location: '',
                      password: '',
                    })
                    setAddOpen(false)
                    load()
                  })
                  .catch((e: any) => setError(e?.message || 'Create failed'))
                  .finally(() => setSaving(false))
              }}
            >
              {saving ? 'Saving…' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Godown name"
            value={addForm.name}
            onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. North warehouse"
          />
          <Input
            label="Godown code"
            value={addForm.code}
            onChange={(e) => setAddForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="e.g. GD-N01"
          />
          <Input
            label="Address"
            value={addForm.address}
            onChange={(e) => setAddForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="Street, area, PIN"
          />
          <Input
            label="Mobile number"
            value={addForm.mobile}
            onChange={(e) => setAddForm((f) => ({ ...f, mobile: e.target.value }))}
            placeholder="Contact mobile"
            inputMode="tel"
            autoComplete="tel"
          />
          <Input
            type="password"
            label="Godown login password"
            value={addForm.password}
            onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Min. 6 characters"
            autoComplete="new-password"
            hint="Stored on the server as a bcrypt hash (plain text is never saved)."
          />
          <Input
            label="Location"
            value={addForm.location}
            onChange={(e) => setAddForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="City / region / landmark"
          />
        </div>
      </Modal>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader className="flex items-center justify-between gap-4">
            <CardTitle>Godown list</CardTitle>
            <div className="w-full max-w-xs">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search godown…" className="h-10" />
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : loading ? (
              <div className="text-sm text-slate-600">Loading…</div>
            ) : rows.length === 0 ? (
              <EmptyState title="No godowns found" subtitle="Try a different search or add a godown." />
            ) : (
              <Table className="min-w-[720px]">
                <thead>
                  <tr>
                    <Th>Code</Th>
                    <Th>Name</Th>
                    <Th>Location</Th>
                    <Th>Mobile</Th>
                    <Th className="hidden lg:table-cell">Address</Th>
                    <Th className="text-right">Stock units</Th>
                    <Th className="text-right">Open</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((g, idx) => (
                    <tr key={g.id || `row-${idx}`} className="hover:bg-slate-50">
                      <Td className="font-mono text-xs font-semibold text-slate-900">{g.code || '—'}</Td>
                      <Td className="font-semibold text-slate-900">{g.name || '—'}</Td>
                      <Td className="max-w-[10rem] truncate text-sm">{g.location || '—'}</Td>
                      <Td className="text-sm">{g.mobile || '—'}</Td>
                      <Td className="hidden max-w-[14rem] truncate text-sm text-slate-600 lg:table-cell">{g.address || '—'}</Td>
                      <Td className="text-right font-semibold">{formatNumber(stockByGodown[g.id] ?? 0)}</Td>
                      <Td className="text-right">
                        <Link
                          className="text-sm font-semibold text-slate-900 hover:text-slate-700"
                          to={`/godowns/${g.id}`}
                        >
                          View
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="rounded-xl bg-slate-50 p-3">
              Use a unique godown code for reports and delivery creation.
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              Stock units are summed from inventory ledger balances for each warehouse.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
