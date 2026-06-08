import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreateDeliveryModal, type CreateDeliveryPrefill } from '../Deliveries/CreateDeliveryModal'
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
import { useGodownScope } from '../../hooks/useGodownScope'
import type { GodownRow } from '../Godowns/List'

type OrderTab = 'all' | 'upcoming'

type OrderRow = {
  id: string
  customerName: string
  siteName?: string
  siteAddress?: string
  deliveryAt: string
  returnExpectedAt?: string
  status: string
  fromGodownId?: string
  createdAt?: string
}

function badgeVariant(status: string) {
  if (status === 'CREATED') return 'green'
  if (status === 'ALLOCATED') return 'green'
  if (status === 'DISPATCHED') return 'amber'
  return 'slate'
}

const GODOWN_ACTIVE_STATUSES = ['CREATED', 'ALLOCATED', 'DISPATCHED', 'DELIVERED'] as const
const BILLER_UPCOMING_STATUSES = ['CREATED', 'ALLOCATED'] as const

export function OrdersListPage() {
  const auth = useAuth()
  const { godownName, isGodown } = useGodownScope()
  const isGodownUser = isGodown
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [godowns, setGodowns] = useState<GodownRow[]>([])
  const [tab, setTab] = useState<OrderTab>(isGodownUser ? 'all' : 'upcoming')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createForm, setCreateForm] = useState({
    customerName: '',
    siteName: '',
    deliveryAt: '',
    fromGodownId: '',
  })
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false)
  const [deliveryPrefill, setDeliveryPrefill] = useState<CreateDeliveryPrefill | null>(null)

  const canCreate =
    auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')

  const loadOrders = useCallback(() => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    setError(null)
    apiFetch<OrderRow[]>('/orders?limit=200', { token })
      .then(setOrders)
      .catch((e: unknown) => {
        const msg =
          e && typeof e === 'object' && 'message' in e
            ? String((e as { message: string }).message)
            : 'Failed to load orders'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadOrders()
    if (!canCreate) return
    const token = getToken()
    if (!token) return
    apiFetch<GodownRow[]>('/godowns', { token }).then(setGodowns).catch(() => {})
  }, [loadOrders, canCreate])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    const upcomingStatuses: readonly string[] = isGodownUser
      ? GODOWN_ACTIVE_STATUSES
      : BILLER_UPCOMING_STATUSES
    return orders.filter((o) => {
      if (tab === 'upcoming' && !upcomingStatuses.includes(o.status)) return false
      if (!s) return true
      return (
        o.customerName.toLowerCase().includes(s) ||
        (o.siteName?.toLowerCase().includes(s) ?? false) ||
        (o.siteAddress?.toLowerCase().includes(s) ?? false)
      )
    })
  }, [orders, q, tab, isGodownUser])

  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="Orders"
        subtitle={
          godownName
            ? `Orders assigned to ${godownName} (read-only).`
            : 'Customer orders awaiting fulfillment.'
        }
        right={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>Create order</Button>
          ) : undefined
        }
      />

      <Modal open={createOpen} title="Create order" onClose={() => setCreateOpen(false)}>
        <div className="space-y-4">
          <Input
            label="Customer name"
            value={createForm.customerName}
            onChange={(e) => setCreateForm((f) => ({ ...f, customerName: e.target.value }))}
          />
          <Input
            label="Site name"
            value={createForm.siteName}
            onChange={(e) => setCreateForm((f) => ({ ...f, siteName: e.target.value }))}
          />
          <Input
            type="datetime-local"
            label="Delivery at"
            value={createForm.deliveryAt}
            onChange={(e) => setCreateForm((f) => ({ ...f, deliveryAt: e.target.value }))}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800">Fulfilling godown</label>
            <select
              value={createForm.fromGodownId}
              onChange={(e) => setCreateForm((f) => ({ ...f, fromGodownId: e.target.value }))}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">Select godown…</option>
              {godowns.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            disabled={createSaving}
            onClick={async () => {
              const token = getToken()
              if (!token) return
              if (!createForm.customerName.trim() || !createForm.deliveryAt || !createForm.fromGodownId) {
                setError('Customer, delivery time, and godown are required.')
                return
              }
              setCreateSaving(true)
              try {
                await apiFetch('/orders', {
                  method: 'POST',
                  token,
                  body: JSON.stringify({
                    customerName: createForm.customerName.trim(),
                    siteName: createForm.siteName.trim() || undefined,
                    deliveryAt: new Date(createForm.deliveryAt).toISOString(),
                    fromGodownId: createForm.fromGodownId,
                    lines: [],
                  }),
                })
                setCreateOpen(false)
                setCreateForm({ customerName: '', siteName: '', deliveryAt: '', fromGodownId: '' })
                loadOrders()
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'Create failed')
              } finally {
                setCreateSaving(false)
              }
            }}
          >
            {createSaving ? 'Saving…' : 'Save order'}
          </Button>
        </div>
      </Modal>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Order list</CardTitle>
          <div className="w-full sm:w-72">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orders…" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {(
              [
                { id: 'upcoming' as const, label: isGodownUser ? 'Active' : 'Upcoming' },
                { id: 'all' as const, label: 'All' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={
                  tab === t.id
                    ? 'rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white'
                    : 'rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200'
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading orders…</div>
          ) : rows.length === 0 ? (
            <EmptyState title="No orders" subtitle="Try another tab or search term." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Customer</Th>
                  <Th>Site</Th>
                  <Th>Status</Th>
                  <Th>Scheduled</Th>
                  {canCreate ? <Th className="text-right">Actions</Th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id}>
                    <Td className="font-medium text-slate-900">{o.customerName}</Td>
                    <Td className="text-slate-600">{o.siteName || o.siteAddress || '—'}</Td>
                    <Td>
                      <Badge variant={badgeVariant(o.status)}>{o.status}</Badge>
                    </Td>
                    <Td className="text-slate-600">{formatDateTime(o.deliveryAt)}</Td>
                    {canCreate ? (
                      <Td className="text-right">
                        {['CREATED', 'ALLOCATED'].includes(o.status) ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setDeliveryPrefill({
                                orderId: o.id,
                                customerName: o.customerName,
                                siteName: o.siteName,
                                siteAddress: o.siteAddress,
                                deliveryAt: o.deliveryAt,
                                returnExpectedAt: o.returnExpectedAt,
                                fromGodownId: o.fromGodownId,
                              })
                              setDeliveryModalOpen(true)
                            }}
                          >
                            Create delivery
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </Td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          <p className="mt-4 text-xs text-slate-500">
            {isGodownUser ? (
              <>
                Standalone deliveries (without a linked order) appear under{' '}
                <Link to="/deliveries" className="font-medium text-primary-600 hover:underline">
                  Deliveries
                </Link>
                , not here.
              </>
            ) : (
              <>
                Deliveries created from orders appear under{' '}
                <Link to="/deliveries" className="font-medium text-primary-600 hover:underline">
                  Deliveries
                </Link>
                .
              </>
            )}
          </p>
        </CardContent>
      </Card>

      <CreateDeliveryModal
        open={deliveryModalOpen}
        prefill={deliveryPrefill}
        onClose={() => {
          setDeliveryModalOpen(false)
          setDeliveryPrefill(null)
        }}
        onCreated={() => {
          loadOrders()
          setDeliveryModalOpen(false)
          setDeliveryPrefill(null)
        }}
      />
    </div>
  )
}
