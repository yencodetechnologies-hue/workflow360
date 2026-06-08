import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { EmptyState, Table, Td, Th } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { apiFetch } from '../lib/api'
import { getToken, useAuth } from '../auth/store'
import { useGodownScope } from '../hooks/useGodownScope'
import { formatDateTime } from '../lib/format'
import { deliveryBadgeVariant, deliveryStatusLabel } from '../lib/deliveryStatus'
import { GodownDeliveryWorkflow } from '../components/delivery/GodownDeliveryWorkflow'

type QueueRow = {
  id: string
  deliveryNo: string
  customerName: string
  siteName?: string
  siteAddress?: string
  deliveryAt: string
  returnExpectedAt?: string
  status: string
  fromGodownId: string
  lines: Array<{
    productId: string
    qty: number
    dispatchedQty?: number
    returnedQty?: number
  }>
  qtyProgress?: { dispatchComplete?: boolean }
  scanProgress?: { dispatchComplete?: boolean }
}

function todayKey() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function QueuePage() {
  const auth = useAuth()
  const { godownName } = useGodownScope()
  const [date, setDate] = useState(todayKey)
  const [rows, setRows] = useState<QueueRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const load = () => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    setError(null)
    apiFetch<QueueRow[]>(`/godowns/queue?date=${encodeURIComponent(date)}`, { token })
      .then(setRows)
      .catch((e: { message?: string }) => setError(e?.message || 'Failed to load queue'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [date])

  const subtitle = useMemo(() => {
    if (auth.status !== 'authenticated') return '—'
    if (auth.user.role === 'GODOWN') {
      return godownName
        ? `${godownName} — dispatch queue for selected date.`
        : 'Godown dispatch queue for selected date.'
    }
    return 'Date-wise delivery queue.'
  }, [auth, godownName])

  const isGodownUser = auth.status === 'authenticated' && auth.user.role === 'GODOWN'

  return (
    <div className="fade-in">
      <PageHeader
        title="Godown queue"
        subtitle={subtitle}
        right={
          <div className="w-48">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        }
      />

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Scheduled deliveries</CardTitle>
          <div className="text-xs text-slate-500">{loading ? 'Loading…' : `${rows.length} deliveries`}</div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : rows.length === 0 ? (
            <EmptyState title="No deliveries scheduled" subtitle="Pick another date or create a delivery." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Delivery</Th>
                  <Th>Customer</Th>
                  <Th>Location</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Time</Th>
                  {isGodownUser ? <Th className="text-right">Actions</Th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">
                      <Link to={`/deliveries/${d.id}`} className="text-primary-600 hover:underline">
                        {d.deliveryNo}
                      </Link>
                    </Td>
                    <Td>{d.customerName}</Td>
                    <Td className="max-w-[24rem] truncate">{d.siteName || d.siteAddress || '—'}</Td>
                    <Td>
                      <Badge variant={deliveryBadgeVariant(d.status)}>{deliveryStatusLabel(d.status)}</Badge>
                    </Td>
                    <Td className="text-right text-xs text-slate-500">{formatDateTime(d.deliveryAt)}</Td>
                    {isGodownUser ? (
                      <Td className="text-right">
                        <GodownDeliveryWorkflow
                          delivery={{
                            id: d.id,
                            status: d.status,
                            lines: d.lines,
                            qtyProgress: d.qtyProgress,
                            scanProgress: d.scanProgress,
                          }}
                          compact
                          onUpdated={load}
                          onError={(msg) => setError(msg)}
                        />
                      </Td>
                    ) : null}
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
