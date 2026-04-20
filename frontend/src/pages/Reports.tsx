import { useMemo, useState } from 'react'
import { formatNumber } from '../lib/format'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { useDb } from '../store/useStore'

export function ReportsPage() {
  const state = useDb()
  const deliveries = state.deliveries
  const [range, setRange] = useState('7d')

  const summary = useMemo(() => {
    const total = deliveries.length
    const pending = deliveries.filter((d) => d.pendingReturn || d.status === 'PendingReturn').length
    const running = deliveries.filter((d) => d.status === 'Running').length
    const completed = deliveries.filter((d) => d.status === 'Completed').length
    const damaged = deliveries.reduce((a, d) => {
      const m = d.damagedByProductId ?? {}
      return a + Object.values(m).reduce((x, y) => x + (Number(y) || 0), 0)
    }, 0)
    const lost = deliveries.reduce((a, d) => {
      const m = d.lostByProductId ?? {}
      return a + Object.values(m).reduce((x, y) => x + (Number(y) || 0), 0)
    }, 0)
    return { total, pending, running, completed, damaged, lost }
  }, [deliveries])

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Daily delivery, product-wise movement, stock, damage & loss."
        right={
          <>
            <Button variant="secondary" onClick={() => alert('Export PDF (template placeholder).')}>
              Export PDF
            </Button>
            <Button variant="secondary" onClick={() => alert('Export Excel (template placeholder).')}>
              Export Excel
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Report range</CardTitle>
            <div className="w-full sm:w-64">
              <Select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                options={[
                  { value: '7d', label: 'Last 7 days' },
                  { value: '30d', label: 'Last 30 days' },
                  { value: 'mtd', label: 'Month to date' },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Daily delivery report</div>
              <div className="mt-2 text-sm text-slate-700">
                Summary for selected range ({range}).
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="blue">Upcoming</Badge>
                <Badge variant="green">Running</Badge>
                <Badge variant="amber">Pending</Badge>
                <Badge variant="slate">Completed</Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Product-wise report</div>
              <div className="mt-2 text-sm text-slate-700">
                Focus on top moving items and low stock.
              </div>
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => alert('Open product-wise report (template placeholder).')}
                >
                  Open
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Godown stock report</div>
              <div className="mt-2 text-sm text-slate-700">
                Snapshot by warehouse with low-stock alerts.
              </div>
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => alert('Open godown stock report (template placeholder).')}
                >
                  Open
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Damage & loss report</div>
              <div className="mt-2 text-sm text-slate-700">
                Track issues and reduce shrinkage.
              </div>
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => alert('Open damage & loss report (template placeholder).')}
                >
                  Open
                </Button>
              </div>
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
              <div className="text-sm text-slate-600">Running</div>
              <div className="text-sm font-semibold text-slate-900">{formatNumber(summary.running)}</div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div className="text-sm text-slate-600">Pending returns</div>
              <div className="text-sm font-semibold text-slate-900">{formatNumber(summary.pending)}</div>
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

