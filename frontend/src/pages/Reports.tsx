import { useEffect, useMemo, useState } from 'react'
import { formatNumber } from '../lib/format'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Input } from '../components/ui/Input'
import { EmptyState, Table, Td, Th } from '../components/ui/Table'
import { apiFetch } from '../lib/api'
import { getToken, useAuth } from '../auth/store'

export function ReportsPage() {
  const auth = useAuth()
  const [date, setDate] = useState(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<any | null>(null)
  const [missing, setMissing] = useState<any[] | null>(null)
  const [stock, setStock] = useState<any[] | null>(null)
  const [customerQ, setCustomerQ] = useState('')
  const [customerHistory, setCustomerHistory] = useState<any[] | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    setError(null)
    apiFetch(`/reports/daily?date=${encodeURIComponent(date)}`, { token })
      .then(setReport)
      .catch((e: any) => setError(e?.message || 'Failed to load report'))
      .finally(() => setLoading(false))
  }, [date])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    apiFetch<any[]>('/reports/missing?limit=100', { token }).then(setMissing).catch(() => {})
  }, [date])

  const loadStock = async () => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const rows = await apiFetch<any[]>('/reports/stock', { token })
      setStock(rows)
    } catch (e: any) {
      setError(e?.message || 'Failed to load stock report')
    } finally {
      setLoading(false)
    }
  }

  const searchCustomer = async () => {
    const token = getToken()
    if (!token) return
    const q = customerQ.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    try {
      const rows = await apiFetch<any[]>(`/reports/customer-history?q=${encodeURIComponent(q)}`, { token })
      setCustomerHistory(rows)
    } catch (e: any) {
      setError(e?.message || 'Failed to load customer history')
    } finally {
      setLoading(false)
    }
  }

  const summary = useMemo(() => {
    const s = report?.summary
    return {
      total: s?.total ?? 0,
      pending: (s?.byStatus?.PENDING_RETURN ?? 0) + (s?.byStatus?.DELIVERED ?? 0),
      dispatched: s?.byStatus?.DISPATCHED ?? 0,
      upcoming: s?.byStatus?.UPCOMING ?? 0,
      completed: s?.byStatus?.COMPLETED ?? 0,
      damaged: s?.damaged ?? 0,
      lost: s?.lost ?? 0,
    }
  }, [report])

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Daily delivery, product-wise movement, stock, damage & loss."
        right={
          <>
            <div className="w-44">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Daily delivery report</CardTitle>
            <div className="text-xs text-slate-500">{loading ? 'Loading…' : date}</div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : report?.deliveries?.length ? (
              <Table>
                <thead>
                  <tr>
                    <Th>Delivery</Th>
                    <Th>Customer</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Dispatch</Th>
                    <Th className="text-right">Return</Th>
                    <Th className="text-right">Lost</Th>
                  </tr>
                </thead>
                <tbody>
                  {report.deliveries.map((d: any) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <Td className="font-semibold text-slate-900">{d.deliveryNo}</Td>
                      <Td className="max-w-[18rem] truncate">{d.customerName}</Td>
                      <Td>
                        <Badge variant={d.status === 'UPCOMING' ? 'blue' : d.status === 'DISPATCHED' ? 'green' : d.status === 'COMPLETED' ? 'slate' : 'amber'}>
                          {d.status}
                        </Badge>
                      </Td>
                      <Td className="text-right">{formatNumber(d.dispatched)}</Td>
                      <Td className="text-right">{formatNumber(d.returned)}</Td>
                      <Td className="text-right">{formatNumber(d.lost)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyState title="No data" subtitle="No deliveries found for the selected date." />
            )}

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-500">Missing / pending return</div>
                <div className="mt-2 text-sm text-slate-700">
                  {missing ? `${missing.length} deliveries` : 'Loading…'}
                </div>
                {missing?.length ? (
                  <div className="mt-3 space-y-2">
                    {missing.slice(0, 5).map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="truncate">{m.deliveryNo}</div>
                        <Badge variant="amber">{formatNumber(m.missingCount)}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-slate-600">No missing items reported.</div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-500">Inventory stock report</div>
                <div className="mt-2 text-sm text-slate-700">
                  Stock is derived from the inventory ledger (dispatch/return).
                </div>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={loadStock}
                    disabled={
                      auth.status !== 'authenticated' ||
                      (auth.user.role !== 'ADMIN' && auth.user.role !== 'GODOWN') ||
                      loading
                    }
                  >
                    Load stock
                  </Button>
                </div>
                {stock ? (
                  <div className="mt-3 text-xs text-slate-600">
                    Rows: <span className="font-semibold">{formatNumber(stock.length)}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Customer-wise history</div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Input
                    label="Customer name"
                    value={customerQ}
                    onChange={(e) => setCustomerQ(e.target.value)}
                    placeholder="Search customer…"
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={searchCustomer}
                  disabled={
                    auth.status !== 'authenticated' ||
                    (auth.user.role !== 'ADMIN' && auth.user.role !== 'BILLER') ||
                    loading
                  }
                >
                  Search
                </Button>
              </div>
              {customerHistory?.length ? (
                <div className="mt-3 space-y-1 text-sm text-slate-700">
                  {customerHistory.slice(0, 8).map((x) => (
                    <div key={x.id} className="flex items-center justify-between gap-3">
                      <div className="truncate font-semibold">{x.deliveryNo}</div>
                      <div className="text-xs text-slate-500">{new Date(x.deliveryAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              ) : customerHistory ? (
                <div className="mt-3 text-xs text-slate-600">No history found.</div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div className="text-sm text-slate-600">Total deliveries</div>
              <div className="text-sm font-semibold text-slate-900">{formatNumber(summary.total)}</div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div className="text-sm text-slate-600">Upcoming</div>
              <div className="text-sm font-semibold text-slate-900">{formatNumber(summary.upcoming)}</div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div className="text-sm text-slate-600">Dispatched</div>
              <div className="text-sm font-semibold text-slate-900">{formatNumber(summary.dispatched)}</div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div className="text-sm text-slate-600">Completed</div>
              <div className="text-sm font-semibold text-slate-900">{formatNumber(summary.completed)}</div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-amber-50 p-3">
              <div className="text-sm text-amber-900">Damaged items</div>
              <div className="text-sm font-semibold text-amber-950">{formatNumber(summary.damaged)}</div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-rose-50 p-3">
              <div className="text-sm text-rose-900">Lost items</div>
              <div className="text-sm font-semibold text-rose-950">{formatNumber(summary.lost)}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

