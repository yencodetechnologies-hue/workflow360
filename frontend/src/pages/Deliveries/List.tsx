import { useMemo, useState } from 'react'
import { formatDateTime } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
import { db, useDb } from '../../store/useStore'

type Tab = 'all' | 'Upcoming' | 'Running' | 'PendingReturn' | 'Completed'

function badgeVariant(status: string) {
  if (status === 'Running') return 'green'
  if (status === 'Upcoming') return 'blue'
  if (status === 'PendingReturn') return 'amber'
  return 'slate'
}

export function DeliveriesListPage() {
  const state = useDb()
  const deliveries = state.deliveries
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [manageId, setManageId] = useState<string | null>(null)

  const [create, setCreate] = useState(() => ({
    billerId: '',
    godownId: '',
    eta: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString().slice(0, 16),
    deliveryPersonId: '',
    vehicleId: '',
    productId: '',
    qty: 1,
    lines: [] as Array<{ productId: string; qty: number }>,
  }))

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return deliveries.filter((d) => {
      if (tab !== 'all' && d.status !== tab) return false
      if (!s) return true
      const g = state.godowns.find((x) => x.id === d.godownId)
      const biller = state.billers.find((b) => b.id === d.billerId)
      return (
        d.id.toLowerCase().includes(s) ||
        (biller?.name.toLowerCase().includes(s) ?? false) ||
        d.lines
          .map((l) => state.products.find((p) => p.id === l.productId)?.name ?? '')
          .join(', ')
          .toLowerCase()
          .includes(s) ||
        (g?.name.toLowerCase().includes(s) ?? false)
      )
    })
  }, [deliveries, q, state.billers, state.godowns, state.products, tab])

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'Upcoming', label: 'Upcoming' },
    { id: 'Running', label: 'Running' },
    { id: 'PendingReturn', label: 'Pending returns' },
    { id: 'Completed', label: 'Completed' },
  ]

  return (
    <div>
      <PageHeader
        title="Deliveries"
        subtitle="Create, assign, and track delivery status updates."
        right={
          <Button onClick={() => setCreateOpen(true)}>
            Create Delivery
          </Button>
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

          {rows.length === 0 ? (
            <EmptyState title="No deliveries found" subtitle="Try a different tab or search." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Biller</Th>
                  <Th>Godown</Th>
                  <Th>Items</Th>
                  <Th>Status</Th>
                  <Th>Assigned</Th>
                  <Th className="text-right">Created</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  const g = state.godowns.find((x) => x.id === d.godownId)
                  const biller = state.billers.find((b) => b.id === d.billerId)
                  const assigned = state.deliveryPersons.find(
                    (p) => p.id === d.assignedDeliveryPersonId,
                  )
                  const items = d.lines
                    .map((l) => {
                      const p = state.products.find((pp) => pp.id === l.productId)
                      return `${p?.name ?? 'Item'} × ${l.qty}`
                    })
                    .join(', ')
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <Td className="font-semibold text-slate-900">{d.id}</Td>
                      <Td>{biller?.name ?? '—'}</Td>
                      <Td>{g?.name ?? '—'}</Td>
                      <Td className="max-w-[22rem] truncate">{items}</Td>
                      <Td>
                        <Badge variant={badgeVariant(d.status)}>
                          {d.status === 'PendingReturn' ? 'Pending' : d.status}
                        </Badge>
                      </Td>
                      <Td className="text-slate-700">
                        {assigned ? `${assigned.name} (${assigned.code})` : 'Unassigned'}
                      </Td>
                      <Td className="text-right text-xs text-slate-500">
                        {formatDateTime(d.createdAt)}
                      </Td>
                      <Td className="text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setManageId(d.id)}
                        >
                          Manage
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

      <Modal
        open={createOpen}
        title="Create delivery"
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                db.addDelivery({
                  billerId: create.billerId,
                  godownId: create.godownId,
                  eta: new Date(create.eta).toISOString(),
                  assignedDeliveryPersonId: create.deliveryPersonId || undefined,
                  vehicleId: create.vehicleId || undefined,
                  lines: create.lines,
                })
                setCreateOpen(false)
              }}
            >
              Create
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Biller"
              value={create.billerId}
              onChange={(e) => setCreate((c) => ({ ...c, billerId: e.target.value }))}
              options={[
                { value: '', label: 'Select biller' },
                ...state.billers.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
            <Select
              label="Godown"
              value={create.godownId}
              onChange={(e) => setCreate((c) => ({ ...c, godownId: e.target.value }))}
              options={[
                { value: '', label: 'Select godown' },
                ...state.godowns.map((g) => ({ value: g.id, label: `${g.name} • ${g.city}` })),
              ]}
            />
          </div>

          <Input
            label="ETA"
            type="datetime-local"
            value={create.eta}
            onChange={(e) => setCreate((c) => ({ ...c, eta: e.target.value }))}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Assign delivery person (optional)"
              value={create.deliveryPersonId}
              onChange={(e) =>
                setCreate((c) => ({ ...c, deliveryPersonId: e.target.value }))
              }
              options={[
                { value: '', label: 'Unassigned' },
                ...state.deliveryPersons.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.code})`,
                })),
              ]}
            />
            <Select
              label="Vehicle (optional)"
              value={create.vehicleId}
              onChange={(e) => setCreate((c) => ({ ...c, vehicleId: e.target.value }))}
              options={[
                { value: '', label: 'None' },
                ...state.vehicles.map((v) => ({ value: v.id, label: `${v.label} • ${v.regNo}` })),
              ]}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Items</div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Select
                  value={create.productId}
                  onChange={(e) => setCreate((c) => ({ ...c, productId: e.target.value }))}
                  options={[
                    { value: '', label: 'Select product' },
                    ...state.products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` })),
                  ]}
                />
              </div>
              <Input
                type="number"
                value={`${create.qty}`}
                onChange={(e) => setCreate((c) => ({ ...c, qty: Number(e.target.value) }))}
              />
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (!create.productId) return
                  setCreate((c) => ({
                    ...c,
                    lines: [...c.lines, { productId: c.productId, qty: Math.max(1, Math.floor(c.qty)) }],
                    productId: '',
                    qty: 1,
                  }))
                }}
              >
                Add item
              </Button>
            </div>

            {create.lines.length ? (
              <div className="mt-3 space-y-2">
                {create.lines.map((l, idx) => {
                  const p = state.products.find((pp) => pp.id === l.productId)
                  return (
                    <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                      <div className="truncate text-slate-700">{p?.name ?? 'Item'}</div>
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-slate-900">× {l.qty}</div>
                        <button
                          className="text-xs font-semibold text-rose-700 hover:text-rose-600"
                          onClick={() =>
                            setCreate((c) => ({
                              ...c,
                              lines: c.lines.filter((_, i) => i !== idx),
                            }))
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="mt-3 text-xs text-slate-600">Add at least 1 item.</div>
            )}
          </div>
        </div>
      </Modal>

      <ManageDeliveryModal id={manageId} onClose={() => setManageId(null)} />
    </div>
  )
}

function ManageDeliveryModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const state = useDb()
  const delivery = id ? state.deliveries.find((d) => d.id === id) : undefined
  const [damageLossOpen, setDamageLossOpen] = useState(false)
  const [damage, setDamage] = useState<Record<string, number>>({})
  const [loss, setLoss] = useState<Record<string, number>>({})

  if (!delivery) {
    return <Modal open={Boolean(id)} title="Manage delivery" onClose={onClose} footer={<div className="flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div>}><div className="text-sm text-slate-600">Delivery not found.</div></Modal>
  }

  const biller = state.billers.find((b) => b.id === delivery.billerId)
  const godown = state.godowns.find((g) => g.id === delivery.godownId)

  return (
    <>
      <Modal
        open={Boolean(id)}
        title={`Manage ${delivery.id}`}
        onClose={onClose}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">{biller?.name ?? '—'}</div>
            <div className="mt-1 text-xs text-slate-600">{godown?.name ?? '—'}</div>
            <div className="mt-2 text-xs text-slate-500">Created {formatDateTime(delivery.createdAt)}</div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              variant="secondary"
              onClick={() =>
                db.updateDelivery(delivery.id, {
                  status: delivery.status === 'Upcoming' ? 'Running' : delivery.status,
                })
              }
            >
              Mark Running
            </Button>
            <Button
              variant="secondary"
              onClick={() => db.updateDelivery(delivery.id, { status: 'Completed' })}
            >
              Mark Completed
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                db.updateDelivery(delivery.id, {
                  status: 'PendingReturn',
                  pendingReturn: true,
                })
              }
            >
              Mark Pending Return
            </Button>
            <Button variant="secondary" onClick={() => db.markReturned(delivery.id)}>
              Mark Returned
            </Button>
          </div>

          <Button variant="danger" onClick={() => setDamageLossOpen(true)}>
            Record Damage / Loss
          </Button>
        </div>
      </Modal>

      <Modal
        open={damageLossOpen}
        title="Damage / Loss"
        onClose={() => setDamageLossOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDamageLossOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                db.recordDamageLoss(delivery.id, damage, loss)
                setDamageLossOpen(false)
              }}
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {delivery.lines.map((l) => {
            const p = state.products.find((pp) => pp.id === l.productId)
            return (
              <div key={l.productId} className="grid grid-cols-1 gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3 sm:items-end">
                <div className="sm:col-span-1">
                  <div className="text-sm font-semibold text-slate-900">{p?.name ?? 'Item'}</div>
                  <div className="text-xs text-slate-600">Delivered: {l.qty}</div>
                </div>
                <Input
                  label="Damaged"
                  type="number"
                  value={`${damage[l.productId] ?? 0}`}
                  onChange={(e) =>
                    setDamage((m) => ({ ...m, [l.productId]: Number(e.target.value) }))
                  }
                />
                <Input
                  label="Lost"
                  type="number"
                  value={`${loss[l.productId] ?? 0}`}
                  onChange={(e) =>
                    setLoss((m) => ({ ...m, [l.productId]: Number(e.target.value) }))
                  }
                />
              </div>
            )
          })}
        </div>
      </Modal>
    </>
  )
}

