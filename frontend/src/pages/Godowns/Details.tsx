import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatDateTime, formatNumber } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
import { db, useDb } from '../../store/useStore'

export function GodownsDetailsPage() {
  const state = useDb()
  const { id } = useParams()
  const g = id ? state.godowns.find((x) => x.id === id) : undefined
  const [transferOpen, setTransferOpen] = useState(false)
  const [transfer, setTransfer] = useState({
    fromGodownId: id ?? '',
    toGodownId: '',
    productId: '',
    qty: 1,
  })

  const stockRows = useMemo(() => {
    if (!g) return []
    const map = state.stockByGodown[g.id] ?? {}
    return state.products.map((p) => ({
      ...p,
      atGodown: map[p.id] ?? 0,
    }))
  }, [g, state.products, state.stockByGodown])

  const related = useMemo(() => {
    if (!g) return []
    return state.deliveries.filter((d) => d.godownId === g.id).slice(0, 6)
  }, [g, state.deliveries])

  const transfers = useMemo(() => {
    if (!g) return []
    return state.transfers.filter(
      (t) => t.fromGodownId === g.id || t.toGodownId === g.id,
    )
  }, [g, state.transfers])

  if (!g) {
    return (
      <div>
        <PageHeader title="Godown not found" subtitle="Please go back to the list." right={<Link to="/godowns" className="text-sm font-semibold text-slate-900 hover:text-slate-700">Back</Link>} />
        <EmptyState title="Missing godown" subtitle="The selected godown does not exist in mock data." />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={g.name}
        subtitle={`${g.city} • Manager: ${g.manager}`}
        right={
          <>
            <Button variant="secondary" onClick={() => setTransferOpen(true)}>
              Transfer Stock
            </Button>
            <Link
              to="/godowns"
              className="text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              Back to list
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Stock view</CardTitle>
            <Badge variant="slate">Live</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>SKU</Th>
                  <Th>Category</Th>
                  <Th className="text-right">At this godown</Th>
                  <Th className="text-right">Reorder</Th>
                </tr>
              </thead>
              <tbody>
                {stockRows.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{p.name}</Td>
                    <Td className="font-mono text-xs text-slate-600">{p.sku}</Td>
                    <Td>{p.category}</Td>
                    <Td className="text-right font-semibold">{formatNumber(p.atGodown)}</Td>
                    <Td className="text-right">
                      <Badge variant={p.atGodown <= p.reorderLevel ? 'amber' : 'slate'}>
                        {p.reorderLevel}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent deliveries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {related.length === 0 ? (
              <div className="text-sm text-slate-600">No deliveries yet.</div>
            ) : (
              related.map((d) => (
                <div key={d.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {d.id}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        {state.billers.find((b) => b.id === d.billerId)?.name ?? '—'}
                      </div>
                    </div>
                    <Badge
                      variant={
                        d.status === 'Running'
                          ? 'green'
                          : d.status === 'Upcoming'
                            ? 'blue'
                            : d.status === 'PendingReturn'
                              ? 'amber'
                              : 'slate'
                      }
                    >
                      {d.status === 'PendingReturn' ? 'Pending' : d.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Created: {formatDateTime(d.createdAt)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Transfer history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {transfers.length === 0 ? (
              <div className="text-sm text-slate-600">No transfers yet.</div>
            ) : (
              transfers.slice(0, 8).map((t) => {
                const from = state.godowns.find((gg) => gg.id === t.fromGodownId)?.name ?? t.fromGodownId
                const to = state.godowns.find((gg) => gg.id === t.toGodownId)?.name ?? t.toGodownId
                const p = state.products.find((pp) => pp.id === t.productId)?.name ?? 'Item'
                return (
                  <div key={t.id} className="flex flex-col justify-between gap-2 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center">
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">{p}</span> • {t.qty} units
                      <div className="text-xs text-slate-500">{from} → {to}</div>
                    </div>
                    <div className="text-xs text-slate-500">{formatDateTime(t.at)}</div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={transferOpen}
        title="Transfer stock"
        onClose={() => setTransferOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setTransferOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                db.transferStock({
                  fromGodownId: transfer.fromGodownId || g.id,
                  toGodownId: transfer.toGodownId,
                  productId: transfer.productId,
                  qty: transfer.qty,
                })
                setTransferOpen(false)
              }}
            >
              Create transfer
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="From godown"
              value={transfer.fromGodownId || g.id}
              onChange={(e) => setTransfer((t) => ({ ...t, fromGodownId: e.target.value }))}
              options={state.godowns.map((gg) => ({ value: gg.id, label: gg.name }))}
            />
            <Select
              label="To godown"
              value={transfer.toGodownId}
              onChange={(e) => setTransfer((t) => ({ ...t, toGodownId: e.target.value }))}
              options={[
                { value: '', label: 'Select destination' },
                ...state.godowns
                  .filter((gg) => gg.id !== (transfer.fromGodownId || g.id))
                  .map((gg) => ({ value: gg.id, label: gg.name })),
              ]}
            />
          </div>

          <Select
            label="Product"
            value={transfer.productId}
            onChange={(e) => setTransfer((t) => ({ ...t, productId: e.target.value }))}
            options={[
              { value: '', label: 'Select product' },
              ...state.products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` })),
            ]}
          />
          <Input
            label="Quantity"
            type="number"
            value={`${transfer.qty}`}
            onChange={(e) => setTransfer((t) => ({ ...t, qty: Number(e.target.value) }))}
          />
          <div className="text-xs text-slate-500">
            Demo rule: quantity will be clamped to available stock in the source godown.
          </div>
        </div>
      </Modal>
    </div>
  )
}

