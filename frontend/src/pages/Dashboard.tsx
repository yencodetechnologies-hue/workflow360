import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/store'
import { DonutChart, SparkBars } from '../components/charts/MiniCharts'
import { formatDateTime, formatNumber } from '../lib/format'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { CardContent, CardHeader, CardTitle, GlassCard, GradientCard, InteractiveCard } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { useDashboardData } from '../hooks/useDashboardData'
import { CreateDeliveryModal } from './Deliveries/CreateDeliveryModal'

function badgeVariant(status: string) {
  if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return 'green'
  if (status === 'PROCESSED' || status === 'UPCOMING') return 'blue'
  if (status === 'PACKED') return 'slate'
  if (status === 'RETURN_PICKUP') return 'amber'
  if (status === 'PENDING_RETURN' || status === 'DELIVERED') return 'amber'
  if (status === 'COMPLETED') return 'slate'
  return 'slate'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PROCESSED: 'Processed',
    PACKED: 'Packed',
    OUT_FOR_DELIVERY: 'Out for delivery',
    RETURN_PICKUP: 'Return pickup',
    UPCOMING: 'Processed',
    DISPATCHED: 'Out for delivery',
    DELIVERED: 'Delivered',
    PENDING_RETURN: 'Pending return',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  }
  return map[status] ?? status
}

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
      <div className="h-3 w-24 rounded bg-slate-200" />
      <div className="mt-3 h-8 w-16 rounded bg-slate-200" />
    </div>
  )
}

function CardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/80 p-6 animate-pulse ${tall ? 'min-h-[220px]' : 'min-h-[160px]'}`}
    >
      <div className="h-4 w-32 rounded bg-slate-200" />
      <div className="mt-6 h-24 rounded bg-slate-100" />
    </div>
  )
}

export function DashboardPage() {
  const auth = useAuth()
  const nav = useNavigate()
  const { loading, error, refresh, kpis, trend, godownsWithStock, recentActivity, alerts } =
    useDashboardData()
  const [createOpen, setCreateOpen] = useState(false)

  if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY') {
    return <Navigate to="/deliveries" replace />
  }

  const trendValues = useMemo(() => trend.map((t) => t.total), [trend])
  const trendLabels = useMemo(() => trend.map((t) => t.label), [trend])
  const trendTotal = useMemo(() => trendValues.reduce((a, b) => a + b, 0), [trendValues])
  const peakIndex = useMemo(() => {
    if (!trendValues.length) return 0
    return trendValues.indexOf(Math.max(...trendValues))
  }, [trendValues])

  const yesterdayTotal = trendValues.length >= 2 ? trendValues[trendValues.length - 2]! : 0
  const todayDelta =
    yesterdayTotal > 0
      ? `${kpis.today >= yesterdayTotal ? '+' : ''}${kpis.today - yesterdayTotal} vs yesterday`
      : undefined

  const donutSegments = useMemo(
    () => [
      { label: 'Upcoming', value: kpis.byStatus.upcoming, color: '#60a5fa' },
      { label: 'Dispatched', value: kpis.byStatus.dispatched, color: '#34d399' },
      { label: 'PendingReturn', value: kpis.byStatus.pendingReturn, color: '#fbbf24' },
      { label: 'Completed', value: kpis.byStatus.completed, color: '#e5e7eb' },
    ],
    [kpis.byStatus],
  )

  return (
    <div className="fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Live operations overview — deliveries, stock, returns, and alerts."
        right={
          <>
            <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
            <Button variant="secondary" onClick={() => nav('/godowns')}>
              Godowns
            </Button>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              Create Delivery
            </Button>
          </>
        }
      />

      {error ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={() => void refresh()}>
            Retry
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total deliveries today"
              value={`${kpis.today}`}
              delta={todayDelta}
              className="hover-lift"
            />
            <StatCard label="Dispatched" value={`${kpis.running}`} tone="good" className="hover-lift" />
            <StatCard
              label="Pending returns"
              value={`${kpis.pendingReturn}`}
              tone="warn"
              className="hover-lift"
            />
            <StatCard label="Completed" value={`${kpis.completed}`} className="hover-lift" />
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {loading ? (
          <>
            <CardSkeleton tall />
            <CardSkeleton tall />
          </>
        ) : (
          <>
            <GlassCard className="lg:col-span-2 hover-lift">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="gradient-text">Daily delivery trend</CardTitle>
                <Badge variant="slate" className="bg-primary-100 text-primary-700">
                  Last 7 days
                </Badge>
              </CardHeader>
              <CardContent className="flex items-end justify-between gap-6">
                <div>
                  <div className="text-sm text-slate-600">
                    This week total:{' '}
                    <span className="font-bold gradient-text">{formatNumber(trendTotal)}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Peak day: {trend[peakIndex]?.label ?? '—'} ({trend[peakIndex]?.total ?? 0})
                  </div>
                </div>
                <SparkBars
                  values={trendValues.length ? trendValues : [0, 0, 0, 0, 0, 0, 0]}
                  labels={trendLabels}
                  highlightIndex={peakIndex}
                  className="py-2"
                />
              </CardContent>
            </GlassCard>

            <GradientCard variant="primary" className="hover-lift">
              <CardHeader className="flex items-center justify-between border-0">
                <CardTitle className="text-white">Delivery status</CardTitle>
                <Badge className="bg-white/20 text-white border-white/30 animate-pulse">Today</Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <DonutChart segments={donutSegments} />
                <div className="space-y-2 text-sm text-white">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/80">Upcoming</span>
                    <span className="font-bold text-white">{kpis.byStatus.upcoming}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/80">Dispatched</span>
                    <span className="font-bold text-white">{kpis.byStatus.dispatched}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/80">Pending return</span>
                    <span className="font-bold text-white">{kpis.byStatus.pendingReturn}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/80">Completed</span>
                    <span className="font-bold text-white">{kpis.byStatus.completed}</span>
                  </div>
                </div>
              </CardContent>
            </GradientCard>
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <InteractiveCard className="hover-lift">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="gradient-text">Godown stock overview</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => nav('/godowns')} className="hover:bg-primary-50">
                  View all
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {godownsWithStock.length === 0 ? (
                  <p className="text-sm text-slate-500">No godowns configured yet.</p>
                ) : (
                  godownsWithStock.slice(0, 6).map((g, index) => (
                    <Link
                      key={g.id}
                      to={`/godowns/${g.id}`}
                      className={`flex items-center justify-between gap-4 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 hover:border-primary-200 transition-all duration-300 slide-up`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-slate-900 gradient-text">{g.name}</div>
                        <div className="text-xs text-slate-500">
                          {g.city || '—'} &#8226; Manager: {g.manager || '—'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold gradient-text">{formatNumber(g.stockQty)}</div>
                        <div className="text-xs text-slate-500">units</div>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </InteractiveCard>

            <GlassCard className="hover-lift">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="gradient-text">Recent deliveries</CardTitle>
                <Badge variant="slate" className="bg-accent-100 text-accent-700 animate-pulse">
                  Latest
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-slate-500">No recent deliveries.</p>
                ) : (
                  recentActivity.map((a, index) => (
                    <Link
                      key={a.id}
                      to={`/deliveries/${a.id}`}
                      className={`block rounded-xl border border-slate-100/50 bg-white/50 backdrop-blur-sm p-3 hover:bg-white/70 transition-all duration-300 slide-up hover:shadow-md`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-900">{a.deliveryNo}</span>
                        <Badge variant={badgeVariant(a.status)}>{statusLabel(a.status)}</Badge>
                      </div>
                      <div className="mt-1 text-sm text-slate-700">{a.customerName}</div>
                      <div className="mt-1 text-xs text-slate-500">{formatDateTime(a.deliveryAt)}</div>
                    </Link>
                  ))
                )}
              </CardContent>
            </GlassCard>

            <GradientCard variant="primary" className="hover-lift">
              <CardHeader className="flex items-center justify-between border-0">
                <CardTitle className="text-white">Alerts</CardTitle>
                <Badge className="bg-white/20 text-white border-white/30 animate-pulse">
                  {alerts.length ? `${alerts.length} active` : 'All clear'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 text-center">
                    <div className="text-sm font-bold text-white">All clear</div>
                    <div className="mt-1 text-xs text-white/80">No issues need attention right now.</div>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <Link
                      key={alert.id}
                      to={alert.href}
                      className="block rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-3 hover:bg-white/20 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-bold text-white">{alert.title}</div>
                        <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold text-white">
                          {alert.count}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-white/80">{alert.description}</div>
                    </Link>
                  ))
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => nav('/products')}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    Products
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setCreateOpen(true)}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    New delivery
                  </Button>
                </div>
              </CardContent>
            </GradientCard>
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total godown stock"
              value={formatNumber(kpis.totalStock)}
              className="hover-lift fade-in"
            />
            <StatCard
              label="Damaged items (today)"
              value={formatNumber(kpis.damaged)}
              tone="warn"
              className="hover-lift fade-in"
            />
            <StatCard
              label="Lost items (today)"
              value={formatNumber(kpis.lost)}
              tone="bad"
              className="hover-lift fade-in"
            />
          </>
        )}
      </div>

      <CreateDeliveryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false)
          void refresh()
        }}
      />
    </div>
  )
}

