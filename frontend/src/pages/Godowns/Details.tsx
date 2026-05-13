import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatDateTime, formatNumber } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'
import type { GodownRow } from './List'

type Godown = GodownRow

type CatalogRow = {
  productId: string
  enabled: boolean
  particulars?: string
  sku?: string
  category?: string
  rate?: string
}

type StockAgg = { productId: string; qty: number }

type DeliveryRow = {
  id: string
  deliveryNo: string
  customerName: string
  siteName?: string
  status: string
  deliveryAt: string
}

type Tab = 'catalog' | 'stock'

export function GodownsDetailsPage() {
  const { id } = useParams()
  const auth = useAuth()
  const [tab, setTab] = useState<Tab>('catalog')
  const [godown, setGodown] = useState<Godown | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    address: '',
    mobile: '',
    location: '',
  })
  const [editSaving, setEditSaving] = useState(false)
  const [catalog, setCatalog] = useState<CatalogRow[]>([])
  const [stockRows, setStockRows] = useState<StockAgg[]>([])
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    const token = getToken()
    if (!token || !id) return
    setError(null)
    setLoading(true)
    Promise.all([
      apiFetch<Godown>(`/godowns/${id}`, { token }),
      apiFetch<CatalogRow[]>(`/godowns/${id}/products`, { token }),
      apiFetch<Array<{ godownId: string; productId: string; qty: number }>>(`/reports/stock?godownId=${encodeURIComponent(id)}`, {
        token,
      }).catch(() => []),
      apiFetch<Array<DeliveryRow & { fromGodownId: string }>>('/deliveries?limit=200', { token }),
    ])
      .then(([g, cat, stockAll, dlv]) => {
        setGodown(g)
        setEditForm({
          name: g.name,
          code: g.code || '',
          address: g.address || '',
          mobile: g.mobile || '',
          location: g.location || '',
        })
        setCatalog(cat.sort((a, b) => (a.particulars || '').localeCompare(b.particulars || '')))
        const forGodown = stockAll.filter((r) => r.godownId === id)
        setStockRows(forGodown.map((r) => ({ productId: r.productId, qty: r.qty })))
        setDeliveries(
          dlv
            .filter((d) => d.fromGodownId === id)
            .slice(0, 8)
            .map((d) => ({
              id: d.id,
              deliveryNo: d.deliveryNo,
              customerName: d.customerName,
              siteName: d.siteName,
              status: d.status,
              deliveryAt: d.deliveryAt,
            })),
        )
      })
      .catch((e: any) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [id])

  const catalogById = useMemo(() => new Map(catalog.map((c) => [c.productId, c])), [catalog])

  const stockTableRows = useMemo(() => {
    return stockRows.map((s) => {
      const p = catalogById.get(s.productId)
      return {
        productId: s.productId,
        name: p?.particulars ?? s.productId,
        sku: p?.sku ?? '—',
        category: p?.category ?? '—',
        qty: s.qty,
      }
    })
  }, [stockRows, catalogById])

  const canEditGodown =
    auth.status === 'authenticated' &&
    (auth.user.role === 'ADMIN' || (auth.user.role === 'GODOWN' && auth.user.godownId === id))

  const toggleEnabled = (productId: string, enabled: boolean) => {
    const token = getToken()
    if (!token || !id) return
    apiFetch(`/godowns/${id}/products`, {
      token,
      method: 'PATCH',
      body: JSON.stringify({ productId, enabled }),
    })
      .then(() => {
        setCatalog((prev) => prev.map((r) => (r.productId === productId ? { ...r, enabled } : r)))
      })
      .catch((e: any) => setError(e?.message || 'Update failed'))
  }

  if (!id) {
    return (
      <div>
        <PageHeader title="Invalid" subtitle="Missing godown id." />
      </div>
    )
  }

  if (loading && !godown) {
    return (
      <div>
        <PageHeader title="Godown" subtitle="Loading…" />
        <div className="text-sm text-slate-600">Loading…</div>
      </div>
    )
  }

  if (error && !godown) {
    return (
      <div>
        <PageHeader title="Godown" subtitle="Could not load." right={<Link to="/godowns" className="text-sm font-semibold text-slate-900">Back</Link>} />
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      </div>
    )
  }

  if (!godown) {
    return (
      <div>
        <PageHeader title="Godown not found" subtitle="Please go back to the list." right={<Link to="/godowns" className="text-sm font-semibold text-slate-900">Back</Link>} />
        <EmptyState title="Missing godown" subtitle="This godown does not exist." />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={godown.name}
        subtitle={[godown.code ? `Code: ${godown.code}` : null, godown.location].filter(Boolean).join(' · ') || 'Godown details'}
        right={
          <div className="flex flex-wrap items-center gap-3">
            {canEditGodown ? (
              <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
                Edit godown
              </Button>
            ) : null}
            <Link to="/godowns" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
              Back to list
            </Link>
          </div>
        }
      />

      <Modal
        open={editOpen}
        title="Edit godown"
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={editSaving || !editForm.name.trim() || !editForm.code.trim()}
              onClick={() => {
                const token = getToken()
                if (!token || !id) return
                setEditSaving(true)
                apiFetch<Godown>(`/godowns/${id}`, {
                  token,
                  method: 'PATCH',
                  body: JSON.stringify({
                    name: editForm.name.trim(),
                    code: editForm.code.trim(),
                    address: editForm.address.trim(),
                    mobile: editForm.mobile.trim(),
                    location: editForm.location.trim(),
                  }),
                })
                  .then((g) => {
                    setGodown(g)
                    setEditOpen(false)
                  })
                  .catch((e: any) => setError(e?.message || 'Update failed'))
                  .finally(() => setEditSaving(false))
              }}
            >
              {editSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Godown name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
          <Input
            label="Godown code"
            value={editForm.code}
            onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
          />
          <Input label="Address" value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />
          <Input label="Mobile number" value={editForm.mobile} onChange={(e) => setEditForm((f) => ({ ...f, mobile: e.target.value }))} />
          <Input label="Location" value={editForm.location} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} />
        </div>
      </Modal>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Warehouse details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Godown code</div>
            <div className="font-mono font-semibold text-slate-900">{godown.code || '—'}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mobile</div>
            <div className="text-slate-900">{godown.mobile || '—'}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</div>
            <div className="text-slate-900">{godown.address || '—'}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</div>
            <div className="text-slate-900">{godown.location || '—'}</div>
          </div>
        </CardContent>
      </Card>

      {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('catalog')}
          className={
            tab === 'catalog'
              ? 'rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white'
              : 'rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200'
          }
        >
          Product catalog
        </button>
        <button
          type="button"
          onClick={() => setTab('stock')}
          className={
            tab === 'stock'
              ? 'rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white'
              : 'rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200'
          }
        >
          Stock at godown
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>{tab === 'catalog' ? 'Catalog (enable for this godown)' : 'Stock view'}</CardTitle>
            <Badge variant="slate">{tab === 'catalog' ? 'On/off per SKU' : 'Ledger'}</Badge>
          </CardHeader>
          <CardContent>
            {tab === 'catalog' ? (
              catalog.length === 0 ? (
                <EmptyState title="No products" subtitle="Products will appear here once synced." />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Product</Th>
                      <Th>SKU</Th>
                      <Th>Category</Th>
                      <Th className="text-right">Enabled</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalog.map((p) => (
                      <tr key={p.productId} className="hover:bg-slate-50">
                        <Td className="font-semibold text-slate-900">{p.particulars ?? p.productId}</Td>
                        <Td className="font-mono text-xs text-slate-600">{p.sku}</Td>
                        <Td>{p.category}</Td>
                        <Td className="text-right">
                          <Button size="sm" variant={p.enabled ? 'secondary' : 'primary'} onClick={() => toggleEnabled(p.productId, !p.enabled)}>
                            {p.enabled ? 'On' : 'Off'}
                          </Button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )
            ) : stockTableRows.length === 0 ? (
              <EmptyState title="No stock rows" subtitle="Ledger may be empty until transfers or scans post inventory." />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Product</Th>
                    <Th>SKU</Th>
                    <Th>Category</Th>
                    <Th className="text-right">Qty</Th>
                  </tr>
                </thead>
                <tbody>
                  {stockTableRows.map((p) => (
                    <tr key={p.productId} className="hover:bg-slate-50">
                      <Td className="font-semibold text-slate-900">{p.name}</Td>
                      <Td className="font-mono text-xs text-slate-600">{p.sku}</Td>
                      <Td>{p.category}</Td>
                      <Td className="text-right font-semibold">{formatNumber(p.qty)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent deliveries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deliveries.length === 0 ? (
              <div className="text-sm text-slate-600">No deliveries yet.</div>
            ) : (
              deliveries.map((d) => (
                <div key={d.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{d.deliveryNo}</div>
                      <div className="mt-1 text-xs text-slate-600">{d.customerName}</div>
                      <div className="truncate text-xs text-slate-500">{d.siteName || '—'}</div>
                    </div>
                    <Badge
                      variant={
                        d.status === 'DISPATCHED'
                          ? 'green'
                          : d.status === 'UPCOMING'
                            ? 'blue'
                            : d.status === 'PENDING_RETURN'
                              ? 'amber'
                              : 'slate'
                      }
                    >
                      {d.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{formatDateTime(d.deliveryAt)}</div>
                  <div className="mt-2">
                    <Link to={`/deliveries/${d.id}`} className="text-xs font-semibold text-slate-900 hover:text-slate-700">
                      Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
