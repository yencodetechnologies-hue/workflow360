import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDateTime } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'
import { CreateDeliveryModal } from './CreateDeliveryModal'

type Tab = 'all' | 'UPCOMING' | 'DISPATCHED' | 'DELIVERED' | 'PENDING_RETURN' | 'COMPLETED'

function badgeVariant(status: string) {
  if (status === 'DISPATCHED') return 'green'
  if (status === 'UPCOMING') return 'blue'
  if (status === 'PENDING_RETURN') return 'amber'
  if (status === 'DELIVERED') return 'amber'
  return 'slate'
}

type DeliveryRow = {
  id: string
  deliveryNo: string
  customerName: string
  siteName?: string
  siteAddress?: string
  status: string
  deliveryAt: string
  fromGodownId?: string
}

export function DeliveriesListPage() {
  const auth = useAuth()
  const nav = useNavigate()
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const canCreate = auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')

  const loadDeliveries = () => {
    const token = getToken()
    if (!token) return
    setError(null)
    apiFetch<DeliveryRow[]>('/deliveries?limit=200', { token })
      .then(setDeliveries)
      .catch((e: unknown) => {
        const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load deliveries'
        setError(msg)
      })
  }

  useEffect(() => {
    loadDeliveries()
  }, [])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return deliveries.filter((d) => {
      if (tab !== 'all' && d.status !== tab) return false
      if (!s) return true
      return (
        d.deliveryNo.toLowerCase().includes(s) ||
        d.customerName.toLowerCase().includes(s) ||
        (d.siteName?.toLowerCase().includes(s) ?? false) ||
        (d.siteAddress?.toLowerCase().includes(s) ?? false)
      )
    })
  }, [deliveries, q, tab])

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'UPCOMING', label: 'Upcoming' },
    { id: 'DISPATCHED', label: 'Dispatched' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'PENDING_RETURN', label: 'Pending returns' },
    { id: 'COMPLETED', label: 'Completed' },
  ]

  return (
    <div>
      <PageHeader
        title="Deliveries"
        subtitle="Create, assign, and track delivery status updates."
        right={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)} className="gap-2 shadow-lg shadow-violet-200/50">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Create delivery
            </Button>
          ) : null
        }
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Delivery list</CardTitle>
          <div className="w-full sm:w-72">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search deliveries…" className="h-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {tabs.map((t) => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={
                    active
                      ? 'rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm'
                      : 'rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200'
                  }
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          {error ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : rows.length === 0 ? (
            <EmptyState title="No deliveries found" subtitle="Try a different tab or search." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Delivery</Th>
                  <Th>Customer</Th>
                  <Th>Location</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Scheduled</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <Td className="font-semibold text-slate-900">{d.deliveryNo}</Td>
                      <Td>{d.customerName}</Td>
                      <Td className="max-w-[22rem] truncate">{d.siteName || d.siteAddress || '—'}</Td>
                      <Td>
                        <Badge variant={badgeVariant(d.status)}>{d.status}</Badge>
                      </Td>
                      <Td className="text-right text-xs text-slate-500">{formatDateTime(d.deliveryAt)}</Td>
                      <Td className="text-right space-x-2">
                        <Link
                          to={`/deliveries/${d.id}`}
                          className="mr-2 inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-sm font-medium text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
                        >
                          Details
                        </Link>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            if (auth.status !== 'authenticated') return
                            if (auth.user.role === 'DELIVERY') {
                              if (d.status === 'DISPATCHED') nav(`/scan/pickup/${d.id}`)
                              else nav(`/scan/deliver/${d.id}`)
                            } else if (auth.user.role === 'GODOWN') nav(`/scan/dispatch/${d.id}`)
                            else nav(`/scan/dispatch/${d.id}`)
                          }}
                        >
                          Scan
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

      <CreateDeliveryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={loadDeliveries}
      />
    </div>
  )
}
