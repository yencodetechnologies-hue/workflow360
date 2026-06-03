import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReportFiltersBar } from '../components/reports/ReportFiltersBar'
import { formatNumber } from '../lib/format'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, Table, Td, Th } from '../components/ui/Table'
import { apiFetch } from '../lib/api'
import { getToken, useAuth } from '../auth/store'
import { useReportFilters } from '../hooks/useReportFilters'
import type {
  CustomerIssueReport,
  DailyReport,
  GodownIssueRow,
  IssueDeliveryRow,
  ReportTab,
  StockReportRow,
} from '../types/reports'

const MAIN_TABS: { id: ReportTab; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'issues-godown', label: 'Missing & damage' },
  { id: 'stock', label: 'Stock' },
]

const ISSUE_SUB_TABS: { id: ReportTab; label: string }[] = [
  { id: 'issues-godown', label: 'By godown' },
  { id: 'issues-delivery', label: 'By delivery' },
  { id: 'issues-customer', label: 'By customer' },
]

const ISSUE_TABS = new Set<ReportTab>(['issues-godown', 'issues-delivery', 'issues-customer'])

function formatRupee(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return '—'
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function badgeVariant(status: string) {
  if (status === 'PROCESSED' || status === 'UPCOMING') return 'blue'
  if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return 'green'
  if (status === 'PACKED') return 'slate'
  if (status === 'RETURN_PICKUP') return 'amber'
  if (status === 'COMPLETED') return 'slate'
  return 'amber'
}

function formatDeliveryDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function ProductLinesPanel({ row }: { row: IssueDeliveryRow }) {
  if (!row.productMissing.length && !row.productDamaged.length) return null
  return (
    <div className="grid gap-4 rounded-lg bg-slate-50 p-3 text-sm md:grid-cols-2">
      <div>
        <div className="mb-1 font-semibold text-slate-800">Missing products</div>
        {row.productMissing.length ? (
          row.productMissing.map((p) => (
            <div key={p.productId} className="flex justify-between gap-2 py-1">
              <span>{p.particulars || p.sku || p.productId}</span>
              <span className="font-semibold">qty {p.qty}</span>
            </div>
          ))
        ) : (
          <p className="text-slate-600">None reported.</p>
        )}
      </div>
      <div>
        <div className="mb-1 font-semibold text-slate-800">Damaged products</div>
        {row.productDamaged.length ? (
          row.productDamaged.map((p) => (
            <div key={p.productId} className="flex justify-between gap-2 py-1">
              <span>{p.particulars || p.sku || p.productId}</span>
              <span className="font-semibold">qty {p.qty}</span>
            </div>
          ))
        ) : (
          <p className="text-slate-600">None reported.</p>
        )}
      </div>
    </div>
  )
}

function IssueDeliveryTable({
  rows,
  expandedId,
  onToggleExpand,
}: {
  rows: IssueDeliveryRow[]
  expandedId: string | null
  onToggleExpand: (id: string | null) => void
}) {
  if (!rows.length) {
    return <EmptyState title="No deliveries" subtitle="No deliveries match the selected filters." />
  }
  return (
    <Table>
      <thead>
        <tr>
          <Th>Delivery</Th>
          <Th>Date</Th>
          <Th>Customer</Th>
          <Th>Site</Th>
          <Th>Godown</Th>
          <Th>Status</Th>
          <Th className="text-right">Missing qty</Th>
          <Th className="text-right">Damage qty</Th>
          <Th className="text-right">₹ missing</Th>
          <Th className="text-right">₹ damage</Th>
          <Th className="text-right">Tags missing</Th>
          <Th />
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => (
          <Fragment key={m.id}>
            <tr className="hover:bg-slate-50">
              <Td>
                <Link to={`/deliveries/${m.id}`} className="font-semibold text-violet-700 hover:underline">
                  {m.deliveryNo}
                </Link>
              </Td>
              <Td className="whitespace-nowrap text-sm">{formatDeliveryDate(m.deliveryAt)}</Td>
              <Td className="max-w-[10rem] truncate">{m.customerName}</Td>
              <Td className="max-w-[8rem] truncate">{m.siteName || '—'}</Td>
              <Td className="max-w-[8rem] truncate">{m.godownName || '—'}</Td>
              <Td>
                <Badge variant={badgeVariant(m.status)}>{m.status}</Badge>
              </Td>
              <Td className="text-right">{formatNumber(m.missingQty)}</Td>
              <Td className="text-right">{formatNumber(m.damageQty)}</Td>
              <Td className="text-right">{formatRupee(m.missingTotal)}</Td>
              <Td className="text-right">{formatRupee(m.damageTotal)}</Td>
              <Td className="text-right">{formatNumber(m.missingTagCount ?? m.missingCount)}</Td>
              <Td>
                {m.productMissing.length || m.productDamaged.length ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onToggleExpand(expandedId === m.id ? null : m.id)}
                  >
                    {expandedId === m.id ? 'Hide' : 'Products'}
                  </Button>
                ) : null}
              </Td>
            </tr>
            {expandedId === m.id ? (
              <tr>
                <Td colSpan={12}>
                  <ProductLinesPanel row={m} />
                </Td>
              </tr>
            ) : null}
          </Fragment>
        ))}
      </tbody>
    </Table>
  )
}

export function ReportsPage() {
  const auth = useAuth()
  const {
    date,
    dateTo,
    godownId,
    site,
    customerName,
    tab,
    godowns,
    sites,
    customers,
    filterQuery,
    dateQuery,
    setFilters,
    lockGodownFilter,
  } = useReportFilters()

  const resolvedTab = (MAIN_TABS.some((t) => t.id === tab) || ISSUE_TABS.has(tab as ReportTab) ? tab : 'daily') as ReportTab
  const activeTab = resolvedTab
  const issueSubTab = ISSUE_TABS.has(activeTab) ? activeTab : 'issues-godown'
  const showIssueSection = ISSUE_TABS.has(activeTab) || activeTab === 'issues-godown'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [daily, setDaily] = useState<DailyReport | null>(null)
  const [godownIssues, setGodownIssues] = useState<GodownIssueRow[] | null>(null)
  const [deliveryIssues, setDeliveryIssues] = useState<IssueDeliveryRow[] | null>(null)
  const [customerReport, setCustomerReport] = useState<CustomerIssueReport | null>(null)
  const [stock, setStock] = useState<StockReportRow[] | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab !== 'daily') return
    const token = getToken()
    if (!token) return
    setLoading(true)
    setError(null)
    const dateParam = dateTo ? `dateFrom=${encodeURIComponent(date)}&dateTo=${encodeURIComponent(dateTo)}` : `date=${encodeURIComponent(date)}`
    apiFetch<DailyReport>(`/reports/daily?${dateParam}${filterQuery}`, { token })
      .then(setDaily)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load report'))
      .finally(() => setLoading(false))
  }, [date, dateTo, filterQuery, activeTab])

  useEffect(() => {
    if (!ISSUE_TABS.has(activeTab)) return
    const token = getToken()
    if (!token) return

    if (activeTab === 'issues-customer' && !customerName.trim()) {
      setCustomerReport(null)
      return
    }

    setLoading(true)
    setError(null)

    const loadGodown = () =>
      apiFetch<GodownIssueRow[]>(`/reports/issues/by-godown?${dateQuery}limit=100${filterQuery}`, { token })
        .then(setGodownIssues)
        .catch(() => setGodownIssues([]))

    const loadDelivery = () =>
      apiFetch<IssueDeliveryRow[]>(`/reports/issues/by-delivery?${dateQuery}limit=100${filterQuery}`, { token })
        .then(setDeliveryIssues)
        .catch(() => setDeliveryIssues([]))

    const loadCustomer = () => {
      const cn = encodeURIComponent(customerName.trim())
      const fq = filterQuery.replace(/&?customerName=[^&]*/g, '')
      return apiFetch<CustomerIssueReport>(`/reports/issues/customer?${dateQuery}customerName=${cn}${fq}`, { token })
        .then(setCustomerReport)
        .catch(() => setCustomerReport(null))
    }

    const promises: Promise<void>[] = []
    if (activeTab === 'issues-godown') promises.push(loadGodown())
    if (activeTab === 'issues-delivery') promises.push(loadDelivery())
    if (activeTab === 'issues-customer') promises.push(loadCustomer())

    Promise.all(promises).finally(() => setLoading(false))
  }, [date, dateTo, dateQuery, filterQuery, activeTab, customerName, godownId, site])

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
      dispatched: (s?.byStatus?.OUT_FOR_DELIVERY ?? 0) + (s?.byStatus?.DISPATCHED ?? 0),
      upcoming: (s?.byStatus?.PROCESSED ?? 0) + (s?.byStatus?.UPCOMING ?? 0),
      completed: s?.byStatus?.COMPLETED ?? 0,
      damaged: s?.damaged ?? 0,
      lost: s?.lost ?? 0,
    }
  }, [daily])

  const onMainTab = (id: ReportTab) => {
    if (id === 'issues-godown') {
      setFilters({ tab: ISSUE_TABS.has(activeTab) ? activeTab : 'issues-godown' })
      return
    }
    setFilters({ tab: id })
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Daily deliveries, missing and damage by godown, delivery, or customer, and stock."
      />

      <Card className="mb-4">
        <CardContent className="pt-6">
          <ReportFiltersBar
            godowns={godowns}
            sites={sites}
            customers={customers}
            godownId={godownId}
            site={site}
            customerName={customerName}
            onGodownChange={(id) => setFilters({ godownId: id })}
            onSiteChange={(s) => setFilters({ site: s })}
            onCustomerChange={(name) => setFilters({ customerName: name })}
            showDate
            showDateTo={showIssueSection || activeTab === 'daily'}
            date={date}
            dateTo={dateTo}
            onDateChange={(d) => setFilters({ date: d })}
            onDateToChange={(d) => setFilters({ dateTo: d })}
            showCustomer={activeTab === 'issues-customer'}
            hideGodownFilter={lockGodownFilter}
          />
        </CardContent>
      </Card>

      <div className="mb-4 flex flex-wrap gap-2">
        {MAIN_TABS.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={
              activeTab === t.id || (t.id === 'issues-godown' && ISSUE_TABS.has(activeTab)) ? 'primary' : 'secondary'
            }
            onClick={() => onMainTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {showIssueSection ? (
        <div className="mb-4 flex flex-wrap gap-2 border-l-2 border-violet-200 pl-3">
          {ISSUE_SUB_TABS.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={issueSubTab === t.id ? 'primary' : 'secondary'}
              onClick={() => setFilters({ tab: t.id })}
            >
              {t.label}
            </Button>
          ))}
        </div>
      ) : null}

      {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {activeTab === 'daily' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Daily delivery report</CardTitle>
              <div className="text-xs text-slate-500">
                {loading ? 'Loading...' : dateTo ? `${date} → ${dateTo}` : date}
              </div>
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
                      <Th className="text-right">Damaged tags</Th>
                      <Th className="text-right">₹ missing</Th>
                      <Th className="text-right">₹ damage</Th>
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
                        <Td className="text-right">{formatNumber(d.damaged)}</Td>
                        <Td className="text-right">{formatRupee(d.missingTotal)}</Td>
                        <Td className="text-right">{formatRupee(d.damageTotal)}</Td>
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

      {activeTab === 'issues-godown' ? (
        <Card>
          <CardHeader>
            <CardTitle>Missing & damage by godown</CardTitle>
          </CardHeader>
          <CardContent>
            {godownIssues?.length ? (
              <Table>
                <thead>
                  <tr>
                    <Th>Godown</Th>
                    <Th className="text-right">Total deliveries</Th>
                    <Th className="text-right">With issues</Th>
                    <Th className="text-right">Missing qty</Th>
                    <Th className="text-right">Damage qty</Th>
                    <Th className="text-right">₹ missing</Th>
                    <Th className="text-right">₹ damage</Th>
                    <Th className="text-right">Tags missing</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {godownIssues.map((g) => (
                    <tr key={g.godownId} className="hover:bg-slate-50">
                      <Td className="font-semibold">{g.godownName || g.godownId}</Td>
                      <Td className="text-right">{formatNumber(g.totalDeliveries)}</Td>
                      <Td className="text-right">{formatNumber(g.issueDeliveryCount)}</Td>
                      <Td className="text-right">{formatNumber(g.missingQty)}</Td>
                      <Td className="text-right">{formatNumber(g.damageQty)}</Td>
                      <Td className="text-right">{formatRupee(g.missingTotal)}</Td>
                      <Td className="text-right">{formatRupee(g.damageTotal)}</Td>
                      <Td className="text-right">{formatNumber(g.missingTagCount)}</Td>
                      <Td>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setFilters({ godownId: g.godownId, tab: 'issues-delivery' })}
                        >
                          View deliveries
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : loading ? (
              <p className="text-sm text-slate-600">Loading...</p>
            ) : (
              <EmptyState title="No godown data" subtitle="No deliveries in the selected period." />
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'issues-delivery' ? (
        <Card>
          <CardHeader>
            <CardTitle>Missing & damage by delivery</CardTitle>
          </CardHeader>
          <CardContent>
            {deliveryIssues ? (
              <IssueDeliveryTable rows={deliveryIssues} expandedId={expandedId} onToggleExpand={setExpandedId} />
            ) : loading ? (
              <p className="text-sm text-slate-600">Loading...</p>
            ) : (
              <EmptyState title="No issue deliveries" subtitle="No missing or damage for this period and filters." />
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'issues-customer' ? (
        <div className="space-y-4">
          {!customerName.trim() ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Select a customer above to load their delivery and issue summary.</p>
              </CardContent>
            </Card>
          ) : null}
          {customerReport ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{customerReport.customerName}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ['Deliveries', customerReport.summary.deliveryCount],
                    ['With issues', customerReport.summary.issueDeliveryCount],
                    ['Missing qty', customerReport.summary.missingQty],
                    ['Damage qty', customerReport.summary.damageQty],
                    ['₹ missing', formatRupee(customerReport.summary.missingTotal)],
                    ['₹ damage', formatRupee(customerReport.summary.damageTotal)],
                    ['Tags missing', customerReport.summary.missingTagCount],
                    ['Damaged / lost tags', customerReport.summary.damagedTagCount + customerReport.summary.lostTagCount],
                  ].map(([label, val]) => (
                    <div key={String(label)} className="rounded-xl bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">{label}</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {typeof val === 'number' ? formatNumber(val) : val}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Deliveries (date-wise)</CardTitle>
                </CardHeader>
                <CardContent>
                  <IssueDeliveryTable
                    rows={customerReport.deliveries}
                    expandedId={expandedId}
                    onToggleExpand={setExpandedId}
                  />
                </CardContent>
              </Card>
            </>
          ) : customerName.trim() && !loading ? (
            <EmptyState title="No data" subtitle="No deliveries for this customer in the selected period." />
          ) : null}
        </div>
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
    </div>
  )
}
