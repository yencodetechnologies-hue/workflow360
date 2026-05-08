import { useMemo, useState } from 'react'
import { DonutChart, SparkBars } from '../components/charts/MiniCharts'
import { formatDateTime, formatNumber } from '../lib/format'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { CardContent, CardHeader, CardTitle, GlassCard, GradientCard, InteractiveCard } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { useDb } from '../store/useStore'

function countByStatus(deliveries: Array<{ status: string; pendingReturn?: boolean }>) {
  const initial = { Upcoming: 0, Running: 0, PendingReturn: 0, Completed: 0 }
  for (const d of deliveries) {
    if (d.pendingReturn) initial.PendingReturn += 1
    else initial[d.status as keyof typeof initial] += 1
  }
  return initial
}

export function DashboardPage() {
  const state = useDb()
  const deliveries = state.deliveries
  const [quickAction, setQuickAction] = useState<
    null | 'delivery' | 'product' | 'godown' | 'transfer'
  >(null)

  const totals = useMemo(() => {
    const by = countByStatus(deliveries)
    const totalStock = Object.values(state.stockByGodown).reduce(
      (a, m) => a + Object.values(m).reduce((x, y) => x + y, 0),
      0,
    )
    const damaged = deliveries.reduce((a, d) => {
      const m = d.damagedByProductId ?? {}
      return a + Object.values(m).reduce((x, y) => x + (Number(y) || 0), 0)
    }, 0)
    const lost = deliveries.reduce((a, d) => {
      const m = d.lostByProductId ?? {}
      return a + Object.values(m).reduce((x, y) => x + (Number(y) || 0), 0)
    }, 0)
    const today = deliveries.filter((d) => {
      const dt = new Date(d.createdAt)
      const now = new Date()
      return (
        dt.getFullYear() === now.getFullYear() &&
        dt.getMonth() === now.getMonth() &&
        dt.getDate() === now.getDate()
      )
    }).length
    return { by, totalStock, damaged, lost, today }
  }, [deliveries, state.stockByGodown])

  const trend = useMemo(() => {
    // simple last-7 bars using mock counts
    return [5, 8, 6, 10, 7, 12, 9]
  }, [])

  return (
    <div className="fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Operations overview for deliveries, stock, returns, and alerts."
        right={
          <>
            <Button variant="secondary" onClick={() => setQuickAction('transfer')}>
              Transfer Stock
            </Button>
            <Button variant="primary" onClick={() => setQuickAction('delivery')}>Create Delivery</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total deliveries today" value={`${totals.today}`} className="hover-lift" />
        <StatCard label="Running deliveries" value={`${totals.by.Running}`} tone="good" className="hover-lift" />
        <StatCard
          label="Pending returns"
          value={`${totals.by.PendingReturn}`}
          tone="warn"
          className="hover-lift"
        />
        <StatCard label="Completed" value={`${totals.by.Completed}`} className="hover-lift" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 hover-lift">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="gradient-text">Daily delivery trend</CardTitle>
            <Badge variant="slate" className="bg-primary-100 text-primary-700">Last 7 days</Badge>
          </CardHeader>
          <CardContent className="flex items-end justify-between gap-6">
            <div>
              <div className="text-sm text-slate-600">
                This week total: <span className="font-bold gradient-text">{trend.reduce((a, b) => a + b, 0)}</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Peak day highlighted by highest bar.
              </div>
            </div>
            <SparkBars values={trend} className="py-2" />
          </CardContent>
        </GlassCard>

        <GradientCard variant="primary" className="hover-lift">
          <CardHeader className="flex items-center justify-between border-0">
            <CardTitle className="text-white">Delivery status</CardTitle>
            <Badge className="bg-white/20 text-white border-white/30 animate-pulse">Live</Badge>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <DonutChart
              segments={[
                { label: 'Upcoming', value: totals.by.Upcoming, color: '#60a5fa' },
                { label: 'Running', value: totals.by.Running, color: '#34d399' },
                { label: 'PendingReturn', value: totals.by.PendingReturn, color: '#fbbf24' },
                { label: 'Completed', value: totals.by.Completed, color: '#e5e7eb' },
              ]}
            />
            <div className="space-y-2 text-sm text-white">
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/80">Upcoming</span>
                <span className="font-bold text-white">{totals.by.Upcoming}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/80">Running</span>
                <span className="font-bold text-white">{totals.by.Running}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/80">Pending</span>
                <span className="font-bold text-white">{totals.by.PendingReturn}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/80">Completed</span>
                <span className="font-bold text-white">{totals.by.Completed}</span>
              </div>
            </div>
          </CardContent>
        </GradientCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <InteractiveCard className="hover-lift">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="gradient-text">Godown stock overview</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setQuickAction('godown')} className="hover:bg-primary-50">
              Add Godown
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.godowns.map((g, index) => (
              <div key={g.id} className={`flex items-center justify-between gap-4 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 hover:border-primary-200 transition-all duration-300 slide-up`} style={{ animationDelay: `${index * 100}ms` }}>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-900 gradient-text">
                    {g.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {g.city} &#8226; Manager: {g.manager}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold gradient-text">
                    {formatNumber(
                      Object.values(state.stockByGodown[g.id] ?? {}).reduce((a, b) => a + b, 0),
                    )}
                  </div>
                  <div className="text-xs text-slate-500">units</div>
                </div>
              </div>
            ))}
          </CardContent>
        </InteractiveCard>

        <GlassCard className="hover-lift">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="gradient-text">Recent activity</CardTitle>
            <Badge variant="slate" className="bg-accent-100 text-accent-700 animate-pulse">Latest</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.activities.slice(0, 6).map((a, index) => (
              <div key={a.id} className={`rounded-xl border border-slate-100/50 bg-white/50 backdrop-blur-sm p-3 hover:bg-white/70 transition-all duration-300 slide-up hover:shadow-md`} style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-sm font-medium text-slate-900">{a.message}</div>
                <div className="mt-1 text-xs text-slate-500">{formatDateTime(a.at)}</div>
              </div>
            ))}
          </CardContent>
        </GlassCard>

        <GradientCard variant="warning" className="hover-lift">
          <CardHeader className="flex items-center justify-between border-0">
            <CardTitle className="text-white">Alerts</CardTitle>
            <Badge className="bg-white/20 text-white border-white/30 animate-pulse">Needs attention</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-3 hover:bg-white/20 transition-all duration-300">
              <div className="text-sm font-bold text-white">
                Pending returns &gt; 3 days
              </div>
              <div className="mt-1 text-xs text-white/80">
                Review deliveries with delayed return confirmation.
              </div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-3 hover:bg-white/20 transition-all duration-300">
              <div className="text-sm font-bold text-white">Low stock warning</div>
              <div className="mt-1 text-xs text-white/80">
                Some SKUs are below reorder level.
              </div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-3 hover:bg-white/20 transition-all duration-300">
              <div className="text-sm font-bold text-white">High damage rate</div>
              <div className="mt-1 text-xs text-white/80">
                Check damaged items report and improve packing.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="secondary" onClick={() => setQuickAction('product')} className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                Add Product
              </Button>
              <Button variant="secondary" onClick={() => setQuickAction('delivery')} className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                Create Delivery
              </Button>
            </div>
          </CardContent>
        </GradientCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard label="Total godown stock" value={formatNumber(totals.totalStock)} className="hover-lift fade-in" />
        <StatCard label="Damaged items" value={formatNumber(totals.damaged)} tone="warn" className="hover-lift fade-in" />
        <StatCard label="Lost items" value={formatNumber(totals.lost)} tone="bad" className="hover-lift fade-in" />
      </div>

      <Modal
        open={quickAction !== null}
        title={
          quickAction === 'delivery'
            ? 'Quick action: Create delivery'
            : quickAction === 'product'
              ? 'Quick action: Add product'
              : quickAction === 'godown'
                ? 'Quick action: Add godown'
                : 'Quick action: Transfer stock'
        }
        onClose={() => setQuickAction(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setQuickAction(null)}>
              Cancel
            </Button>
            <Button onClick={() => setQuickAction(null)}>Save</Button>
          </div>
        }
      >
        <div className="text-sm text-slate-600">
          This is a UI template placeholder. In the real app, this modal would
          contain a small form and call an API.
        </div>
      </Modal>
    </div>
  )
}

