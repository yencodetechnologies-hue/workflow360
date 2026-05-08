import { useEffect, useMemo, useState } from 'react'
import { formatDateTime } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'
import { useNavigate } from 'react-router-dom'

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
  createdAt?: string
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

  useEffect(() => {
    const token = getToken()
    if (!token) return
    setError(null)
    apiFetch<any[]>('/deliveries?limit=200', { token })
      .then((rows) =>
        setDeliveries(
          rows.map((d) => ({
            id: d.id,
            deliveryNo: d.deliveryNo,
            customerName: d.customerName,
            siteName: d.siteName,
            siteAddress: d.siteAddress,
            status: d.status,
            deliveryAt: d.deliveryAt,
          })),
        ),
      )
      .catch((e: any) => setError(e?.message || 'Failed to load deliveries'))
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
          canCreate ? <Button onClick={() => setCreateOpen(true)}>Create Delivery</Button> : null
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
                      ? 'rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white'
                      : 'rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200'
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
                  <Th className="text-right">Action</Th>
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
                        <Badge variant={badgeVariant(d.status)}>
                          {d.status}
                        </Badge>
                      </Td>
                      <Td className="text-right text-xs text-slate-500">
                        {formatDateTime(d.deliveryAt)}
                      </Td>
                      <Td className="text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            if (auth.status !== 'authenticated') return
                            if (auth.user.role === 'DELIVERY') nav(`/scan/deliver/${d.id}`)
                            else if (auth.user.role === 'GODOWN') nav(`/scan/dispatch/${d.id}`)
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

      <Modal open={createOpen} title="Create delivery" onClose={() => setCreateOpen(false)}>
        <div className="text-sm text-slate-600">
          Delivery creation UI will be implemented next (this screen is now wired to real scanning + backend deliveries).
        </div>
      </Modal>
    </div>
  )
}
