import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
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

type Tab = 'catalog' | 'stock' | 'update'

export function GodownsDetailsPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const auth = useAuth()
  const initialTab = (searchParams.get('tab') as Tab | null) || 'catalog'
  const [tab, setTab] = useState<Tab>(
    initialTab === 'stock' || initialTab === 'update' || initialTab === 'catalog' ? initialTab : 'catalog',
  )
  const [godown, setGodown] = useState<Godown | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    address: '',
    mobile: '',
    location: '',
    newPassword: '',
  })
  const [editSaving, setEditSaving] = useState(false)
  const [catalog, setCatalog] = useState<CatalogRow[]>([])
  const [stockRows, setStockRows] = useState<StockAgg[]>([])
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adjustDeltaByProduct, setAdjustDeltaByProduct] = useState<Record<string, string>>({})
  const [adjustNoteByProduct, setAdjustNoteByProduct] = useState<Record<string, string>>({})
  const [adjustApplyingProductId, setAdjustApplyingProductId] = useState<string | null>(null)

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
          newPassword: '',
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

  const reloadStock = () => {
    const token = getToken()
    if (!token || !id) return Promise.resolve()
    return apiFetch<Array<{ godownId: string; productId: string; qty: number }>>(
      `/reports/stock?godownId=${encodeURIComponent(id)}`,
      { token },
    )
      .then((stockAll) => {
        const forGodown = stockAll.filter((r) => r.godownId === id)
        setStockRows(forGodown.map((r) => ({ productId: r.productId, qty: r.qty })))
      })
      .catch(() => {})
  }

  useEffect(() => {
    load()
  }, [id])

  const catalogById = useMemo(() => new Map(catalog.map((c) => [c.productId, c])), [catalog])

  const stockQtyByProductId = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of stockRows) m.set(r.productId, r.qty)
    return m
  }, [stockRows])

  const enabledCatalogRows = useMemo(
    () => catalog.filter((c) => c.enabled).sort((a, b) => (a.particulars || '').localeCompare(b.particulars || '')),
    [catalog],
  )

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

  useEffect(() => {
    if (tab === 'update' && !canEditGodown) setTab('catalog')
  }, [tab, canEditGodown])

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

  const applyStockAdjustment = (productId: string) => {
    const token = getToken()
    if (!token || !id || !canEditGodown) return
    const raw = (adjustDeltaByProduct[productId] ?? '').trim()
    if (!/^-?\d+$/.test(raw)) {
      setError('Enter a whole number for quantity change (e.g. 10 or -3).')
      return
    }
    const qtyDelta = Number.parseInt(raw, 10)
    if (qtyDelta === 0) {
      setError('Quantity change cannot be zero.')
      return
    }
    const note = (adjustNoteByProduct[productId] ?? '').trim()
    setError(null)
    setAdjustApplyingProductId(productId)
    apiFetch<{ ok: boolean; balanceAfter: number }>(`/godowns/${id}/inventory/adjust`, {
      token,
      method: 'POST',
      body: JSON.stringify({ productId, qtyDelta, note: note || undefined }),
    })
      .then(() => {
        setAdjustDeltaByProduct((prev) => ({ ...prev, [productId]: '' }))
        setAdjustNoteByProduct((prev) => ({ ...prev, [productId]: '' }))
        return reloadStock()
      })
      .catch((e: any) => setError(e?.message || 'Adjustment failed'))
      .finally(() => setAdjustApplyingProductId(null))
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
            {/* {canEditGodown ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setEditForm((f) => ({ ...f, newPassword: '' }))
                  setEditOpen(true)
                }}
              >
                Edit godown
              </Button>
            ) : null} */}
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
              disabled={
                editSaving ||
                !editForm.name.trim() ||
                !editForm.code.trim() ||
                (editForm.newPassword.length > 0 && editForm.newPassword.length < 6)
              }
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
                    ...(editForm.newPassword.trim().length >= 6
                      ? { password: editForm.newPassword }
                      : {}),
                  }),
                })
                  .then((g) => {
                    setGodown(g)
                    setEditForm((f) => ({ ...f, newPassword: '' }))
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
          <Input
            label="Mobile number"
            value={editForm.mobile}
            onChange={(e) => setEditForm((f) => ({ ...f, mobile: e.target.value }))}
            inputMode="tel"
            autoComplete="tel"
          />
          <Input label="Location" value={editForm.location} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} />
          <Input
            type="password"
            label="New godown password (optional)"
            value={editForm.newPassword}
            onChange={(e) => setEditForm((f) => ({ ...f, newPassword: e.target.value }))}
            placeholder="Leave blank to keep current"
            autoComplete="new-password"
            hint="Leave blank to keep the current password."
          />
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
        {canEditGodown ? (
          <button
            type="button"
            onClick={() => setTab('update')}
            className={
              tab === 'update'
                ? 'rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white'
                : 'rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200'
            }
          >
            Update stock
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>
              {tab === 'catalog'
                ? 'Catalog (enable for this godown)'
                : tab === 'stock'
                  ? canEditGodown
                    ? 'Stock at godown (view & adjust)'
                    : 'Stock at godown'
                  : 'Update stock'}
            </CardTitle>
            <Badge variant="slate">
              {tab === 'catalog'
                ? 'On/off per SKU'
                : tab === 'stock'
                  ? canEditGodown
                    ? 'Ledger · adjust here'
                    : 'Ledger'
                  : 'Delta → ledger'}
            </Badge>
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
            ) : tab === 'stock' ? (
              stockTableRows.length === 0 ? (
                <EmptyState title="No stock rows" subtitle="Ledger may be empty until transfers or scans post inventory." />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Product</Th>
                      <Th>SKU</Th>
                      <Th>Category</Th>
                      <Th className="text-right">Qty</Th>
                      {canEditGodown ? (
                        <>
                          <Th>Change (+/−)</Th>
                          <Th>Note</Th>
                          <Th className="text-right"> </Th>
                        </>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {stockTableRows.map((p) => {
                      const catalogRow = catalogById.get(p.productId)
                      const canAdjustThis = catalogRow?.enabled === true
                      const applying = adjustApplyingProductId === p.productId
                      return (
                        <tr key={p.productId} className="hover:bg-slate-50">
                          <Td className="font-semibold text-slate-900">{p.name}</Td>
                          <Td className="font-mono text-xs text-slate-600">{p.sku}</Td>
                          <Td>{p.category}</Td>
                          <Td className="text-right font-semibold">{formatNumber(p.qty)}</Td>
                          {canEditGodown ? (
                            <>
                              <Td className="min-w-[7rem]">
                                <Input
                                  className="h-9"
                                  inputMode="numeric"
                                  placeholder="e.g. 10"
                                  disabled={!canAdjustThis}
                                  title={!canAdjustThis ? 'Turn this product On in the Product catalog tab to post adjustments.' : undefined}
                                  value={adjustDeltaByProduct[p.productId] ?? ''}
                                  onChange={(e) =>
                                    setAdjustDeltaByProduct((prev) => ({ ...prev, [p.productId]: e.target.value }))
                                  }
                                />
                              </Td>
                              <Td className="min-w-[8rem]">
                                <Input
                                  className="h-9"
                                  placeholder="Optional"
                                  disabled={!canAdjustThis}
                                  value={adjustNoteByProduct[p.productId] ?? ''}
                                  onChange={(e) =>
                                    setAdjustNoteByProduct((prev) => ({ ...prev, [p.productId]: e.target.value }))
                                  }
                                />
                              </Td>
                              <Td className="text-right">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  disabled={applying || !canAdjustThis}
                                  title={!canAdjustThis ? 'Enable product in catalog first' : undefined}
                                  onClick={() => applyStockAdjustment(p.productId)}
                                >
                                  {applying ? '…' : 'Apply'}
                                </Button>
                              </Td>
                            </>
                          ) : null}
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              )
            ) : enabledCatalogRows.length === 0 ? (
              <EmptyState
                title="No enabled products"
                subtitle="Turn products On in the Product catalog tab, then enter quantity changes here."
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Product</Th>
                    <Th>SKU</Th>
                    <Th>Category</Th>
                    <Th className="text-right">Current</Th>
                    <Th>Change (+/−)</Th>
                    <Th>Note</Th>
                    <Th className="text-right"> </Th>
                  </tr>
                </thead>
                <tbody>
                  {enabledCatalogRows.map((p) => {
                    const applying = adjustApplyingProductId === p.productId
                    return (
                      <tr key={p.productId} className="hover:bg-slate-50">
                        <Td className="font-semibold text-slate-900">{p.particulars ?? p.productId}</Td>
                        <Td className="font-mono text-xs text-slate-600">{p.sku}</Td>
                        <Td>{p.category}</Td>
                        <Td className="text-right font-semibold">{formatNumber(stockQtyByProductId.get(p.productId) ?? 0)}</Td>
                        <Td className="min-w-[7rem]">
                          <Input
                            className="h-9"
                            inputMode="numeric"
                            placeholder="e.g. 10"
                            value={adjustDeltaByProduct[p.productId] ?? ''}
                            onChange={(e) =>
                              setAdjustDeltaByProduct((prev) => ({ ...prev, [p.productId]: e.target.value }))
                            }
                          />
                        </Td>
                        <Td className="min-w-[8rem]">
                          <Input
                            className="h-9"
                            placeholder="Optional"
                            value={adjustNoteByProduct[p.productId] ?? ''}
                            onChange={(e) =>
                              setAdjustNoteByProduct((prev) => ({ ...prev, [p.productId]: e.target.value }))
                            }
                          />
                        </Td>
                        <Td className="text-right">
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={applying}
                            onClick={() => applyStockAdjustment(p.productId)}
                          >
                            {applying ? '…' : 'Apply'}
                          </Button>
                        </Td>
                      </tr>
                    )
                  })}
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
                        d.status === 'OUT_FOR_DELIVERY' || d.status === 'DISPATCHED'
                          ? 'green'
                          : d.status === 'PROCESSED' || d.status === 'UPCOMING'
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
