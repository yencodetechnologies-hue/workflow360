import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReportFiltersBar } from '../components/reports/ReportFiltersBar'
import { formatNumber } from '../lib/format'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Input } from '../components/ui/Input'
import { EmptyState, Table, Td, Th } from '../components/ui/Table'
import { apiFetch } from '../lib/api'
import { getToken, useAuth } from '../auth/store'
import { useReportFilters } from '../hooks/useReportFilters'
import type {
  DailyReport,
  MissingDeliveryRow,
  MissingProductRow,
  ReportTab,
  StockReportRow,
} from '../types/reports'

const TABS: { id: ReportTab; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'missing', label: 'Missing by delivery' },
  { id: 'missing-products', label: 'Missing products' },
  { id: 'stock', label: 'Stock' },
  { id: 'customer', label: 'Customer history' },
]

function badgeVariant(status: string) {
  if (status === 'UPCOMING') return 'blue'
  if (status === 'DISPATCHED') return 'green'
  if (status === 'COMPLETED') return 'slate'
  return 'amber'
}

export function ReportsPage() {
  const auth = useAuth()
  const { date, godownId, site, tab, godowns, sites, filterQuery, setFilters } = useReportFilters()
  const activeTab = (TABS.some((t) => t.id === tab) ? tab : 'daily') as ReportTab

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [daily, setDaily] = useState<DailyReport | null>(null)
  const [missing, setMissing] = useState<MissingDeliveryRow[] | null>(null)
  const [missingProducts, setMissingProducts] = useState<MissingProductRow[] | null>(null)
  const [stock, setStock] = useState<StockReportRow[] | null>(null)
  const [customerQ, setCustomerQ] = useState('')
  const [customerHistory, setCustomerHistory] = useState<Array<{
    id: string
    deliveryNo: string
    customerName: string
    deliveryAt: string
    status: string
  }> | null>(null)
  const [expandedMissing, setExpandedMissing] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab !== 'daily') return
    const token = getToken()
    if (!token) return
    setLoading(true)
    setError(null)
    apiFetch<DailyReport>(`/reports/daily?date=${encodeURIComponent(date)}${filterQuery}`, { token })
      .then(setDaily)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load report'))
      .finally(() => setLoading(false))
  }, [date, filterQuery, activeTab])

  useEffect(() => {
    if (activeTab !== 'missing' && activeTab !== 'missing-products') return
    const token = getToken()
    if (!token) return
    setLoading(true)
    setError(null)
    const dateQ = `date=${encodeURIComponent(date)}&`
    const promises: Promise<void>[] = []
    if (activeTab === 'missing') {
      promises.push(
        apiFetch<MissingDeliveryRow[]>(`/reports/missing?${dateQ}limit=100${filterQuery}`, { token })
          .then(setMissing)
          .catch(() => setMissing([])),
      )
    }
    if (activeTab === 'missing-products') {
      promises.push(
        apiFetch<MissingProductRow[]>(`/reports/missing-products?${dateQ}limit=100${filterQuery}`, { token })
          .then(setMissingProducts)
          .catch(() => setMissingProducts([])),
      )
    }
    Promise.all(promises).finally(() => setLoading(false))
  }, [date, filterQuery, activeTab])

  useEffect(() => {
    if (activeTab !== 'stock') return
    const token = getToken()
    if (!token) return
    if (auth.status !== 'authenticated' || (auth.user.role !== 'ADMIN' && auth.user.role !== 'GODOWN')) return
    setLoading(true)
    setError(null)
    const gidQ = godownId ? `?godownId=${encodeURIComponent(godownId)}` : ''
    apiFetch<StockReportRow[]>(`/reports/stock${gidQ}`, { token })
      .then(setStock)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load stock'))
      .finally(() => setLoading(false))
  }, [activeTab, godownId, auth])

  const summary = useMemo(() => {
    const s = daily?.summary
    return {
      total: s?.total ?? 0,
      pending: (s?.byStatus?.PENDING_RETURN ?? 0) + (s?.byStatus?.DELIVERED ?? 0),
      dispatched: s?.byStatus?.DISPATCHED ?? 0,
      upcoming: s?.byStatus?.UPCOMING ?? 0,
      completed: s?.byStatus?.COMPLETED ?? 0,
      damaged: s?.damaged ?? 0,
      lost: s?.lost ?? 0,
    }
  }, [daily])

  const searchCustomer = async () => {
    const token = getToken()
    if (!token) return
    const q = customerQ.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    try {
      const rows = await apiFetch<Array<{ id: string; deliveryNo: string; customerName: string; deliveryAt: string; status: string }>>(
        `/reports/customer-history?q=${encodeURIComponent(q)}`,
        { token },
      )
      setCustomerHistory(rows)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load customer history')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Daily deliveries, missing products, stock, and customer history."
      />

      <Card className="mb-4">
        <CardContent className="pt-6">
          <ReportFiltersBar
            godowns={godowns}
            sites={sites}
            godownId={godownId}
            site={site}
            showDate
            date={date}
            onGodownChange={(id) => setFilters({ godownId: id })}
            onSiteChange={(s) => setFilters({ site: s })}
            onDateChange={(d) => setFilters({ date: d })}
          />
        </CardContent>
      </Card>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={activeTab === t.id ? 'primary' : 'secondary'}
            onClick={() => setFilters({ tab: t.id })}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {activeTab === 'daily' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Daily delivery report</CardTitle>
              <div className="text-xs text-slate-500">{loading ? 'Loading...' : date}</div>
            </CardHeader>
            <CardContent>
              {daily?.deliveries?.length ? (
                <Table>
                  <thead>
                    <tr>
                      <Th>Delivery</Th>
                      <Th>Customer</Th>
                      <Th>Site</Th>
                      <Th>Godown</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Dispatch</Th>
                      <Th className="text-right">Return</Th>
                      <Th className="text-right">Lost</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {daily.deliveries.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <Td>
                          <Link to={`/deliveries/${d.id}`} className="font-semibold text-violet-700 hover:underline">
                            {d.deliveryNo}
                          </Link>
                        </Td>
                        <Td className="max-w-[12rem] truncate">{d.customerName}</Td>
                        <Td className="max-w-[10rem] truncate">{d.siteName || d.siteAddress || '—'}</Td>
                        <Td className="max-w-[8rem] truncate">{d.godownName || '—'}</Td>
                        <Td>
                          <Badge variant={badgeVariant(d.status)}>{d.status}</Badge>
                        </Td>
                        <Td className="text-right">{formatNumber(d.dispatched)}</Td>
                        <Td className="text-right">{formatNumber(d.returned)}</Td>
                        <Td className="text-right">{formatNumber(d.lost)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <EmptyState title="No data" subtitle="No deliveries found for the selected date and filters." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ['Total deliveries', summary.total, 'bg-slate-50'],
                ['Upcoming', summary.upcoming, 'bg-slate-50'],
                ['Dispatched', summary.dispatched, 'bg-slate-50'],
                ['Completed', summary.completed, 'bg-slate-50'],
                ['Damaged items', summary.damaged, 'bg-amber-50'],
                ['Lost items', summary.lost, 'bg-rose-50'],
              ].map(([label, val, bg]) => (
                <div key={String(label)} className={`flex items-center justify-between rounded-xl p-3 ${bg}`}>
                  <div className="text-sm text-slate-600">{label}</div>
                  <div className="text-sm font-semibold text-slate-900">{formatNumber(Number(val))}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === 'missing' ? (
        <Card>
          <CardHeader>
            <CardTitle>Missing by delivery</CardTitle>
          </CardHeader>
          <CardContent>
            {missing?.length ? (
              <Table>
                <thead>
                  <tr>
                    <Th>Delivery</Th>
                    <Th>Customer</Th>
                    <Th>Site</Th>
                    <Th>Godown</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Tags missing</Th>
                    <Th className="text-right">Biller missing</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {missing.map((m) => (
                    <Fragment key={m.id}>
                      <tr className="hover:bg-slate-50">
                        <Td>
                          <Link to={`/deliveries/${m.id}`} className="font-semibold text-violet-700 hover:underline">
                            {m.deliveryNo}
                          </Link>
                        </Td>
                        <Td className="max-w-[10rem] truncate">{m.customerName}</Td>
                        <Td className="max-w-[8rem] truncate">{m.siteName || '—'}</Td>
                        <Td className="max-w-[8rem] truncate">{m.godownName || '—'}</Td>
                        <Td>
                          <Badge variant="amber">{m.status}</Badge>
                        </Td>
                        <Td className="text-right">{formatNumber(m.missingCount)}</Td>
                        <Td className="text-right">{m.missingTotal != null ? formatNumber(m.missingTotal) : '—'}</Td>
                        <Td>
                          {m.productMissing.length ? (
                            <Button size="sm" variant="secondary" onClick={() => setExpandedMissing(expandedMissing === m.id ? null : m.id)}>
                              {expandedMissing === m.id ? 'Hide' : 'Products'}
                            </Button>
                          ) : null}
                        </Td>
                      </tr>
                      {expandedMissing === m.id && m.productMissing.length ? (
                        <tr key={`${m.id}-detail`}>
                          <Td colSpan={8}>
                            <div className="rounded-lg bg-slate-50 p-3 text-sm">
                              {m.productMissing.map((p) => (
                                <div key={p.productId} className="flex justify-between gap-2 py-1">
                                  <span>{p.particulars || p.sku || p.productId}</span>
                                  <span className="font-semibold">qty {p.qty}</span>
                                </div>
                              ))}
                            </div>
                          </Td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyState title="No missing deliveries" subtitle="No tag or biller missing items for this date and filters." />
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'missing-products' ? (
        <Card>
          <CardHeader>
            <CardTitle>Missing products (aggregated)</CardTitle>
          </CardHeader>
          <CardContent>
            {missingProducts?.length ? (
              <Table>
                <thead>
                  <tr>
                    <Th>Product</Th>
                    <Th>SKU</Th>
                    <Th className="text-right">Total qty</Th>
                    <Th className="text-right">Deliveries</Th>
                    <Th>Delivery links</Th>
                  </tr>
                </thead>
                <tbody>
                  {missingProducts.map((row) => (
                    <tr key={row.productId} className="hover:bg-slate-50">
                      <Td className="font-semibold">{row.particulars || row.productId}</Td>
                      <Td>{row.sku || '—'}</Td>
                      <Td className="text-right">{formatNumber(row.totalQty)}</Td>
                      <Td className="text-right">{formatNumber(row.deliveryCount)}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-2">
                          {row.deliveries.map((d) => (
                            <Link key={d.id} to={`/deliveries/${d.id}`} className="text-sm font-semibold text-violet-700 hover:underline">
                              {d.deliveryNo} ({d.qty})
                            </Link>
                          ))}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyState title="No missing products" subtitle="No biller-reported missing products for this date and filters." />
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'stock' ? (
        <Card>
          <CardHeader>
            <CardTitle>Inventory stock</CardTitle>
          </CardHeader>
          <CardContent>
            {auth.status === 'authenticated' && auth.user.role !== 'ADMIN' && auth.user.role !== 'GODOWN' ? (
              <p className="text-sm text-slate-600">Stock report is available for admin and godown roles.</p>
            ) : stock?.length ? (
              <Table>
                <thead>
                  <tr>
                    <Th>Godown</Th>
                    <Th>Product</Th>
                    <Th>SKU</Th>
                    <Th className="text-right">Qty</Th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((r) => (
                    <tr key={`${r.godownId}-${r.productId}`}>
                      <Td>{r.godownName || r.godownId}</Td>
                      <Td>{r.particulars || r.productId}</Td>
                      <Td>{r.sku || '—'}</Td>
                      <Td className="text-right">{formatNumber(r.qty)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : loading ? (
              <p className="text-sm text-slate-600">Loading...</p>
            ) : (
              <EmptyState title="No stock rows" subtitle="Load stock or adjust godown filter." />
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'customer' ? (
        <Card>
          <CardHeader>
            <CardTitle>Customer-wise history</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input label="Customer name" value={customerQ} onChange={(e) => setCustomerQ(e.target.value)} placeholder="Search customer..." />
              </div>
              <Button
                variant="secondary"
                onClick={searchCustomer}
                disabled={auth.status !== 'authenticated' || (auth.user.role !== 'ADMIN' && auth.user.role !== 'BILLER') || loading}
              >
                Search
              </Button>
            </div>
            {customerHistory?.length ? (
              <div className="mt-4 space-y-1 text-sm">
                {customerHistory.map((x) => (
                  <div key={x.id} className="flex items-center justify-between gap-3">
                    <Link to={`/deliveries/${x.id}`} className="truncate font-semibold text-violet-700 hover:underline">
                      {x.deliveryNo} — {x.customerName}
                    </Link>
                    <div className="text-xs text-slate-500">{new Date(x.deliveryAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            ) : customerHistory ? (
              <p className="mt-3 text-xs text-slate-600">No history found.</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

