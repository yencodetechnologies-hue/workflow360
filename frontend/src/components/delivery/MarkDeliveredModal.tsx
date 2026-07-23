import { useEffect, useMemo, useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'

export type MarkDeliveredLine = {
  productId: string
  qty: number
  dispatchedQty?: number
  particulars?: string
  productName?: string
}

type Props = {
  open: boolean
  busy?: boolean
  lines: MarkDeliveredLine[]
  onClose: () => void
  onConfirm: (lines: Array<{ productId: string; qty: number }>) => void | Promise<void>
}

function dispatchedOf(line: MarkDeliveredLine) {
  return Number(line.dispatchedQty) || Number(line.qty) || 0
}

export function MarkDeliveredModal({ open, busy = false, lines, onClose, onConfirm }: Props) {
  const [deliveredQty, setDeliveredQty] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    const initial: Record<string, string> = {}
    for (const l of lines) {
      initial[l.productId] = String(dispatchedOf(l))
    }
    setDeliveredQty(initial)
  }, [open, lines])

  const rows = useMemo(
    () =>
      lines.map((l) => {
        const dispatched = dispatchedOf(l)
        const raw = Number(deliveredQty[l.productId])
        const delivered = Number.isFinite(raw) ? Math.max(0, Math.min(dispatched, raw)) : 0
        const restock = Math.max(0, dispatched - delivered)
        return { line: l, dispatched, delivered, restock }
      }),
    [lines, deliveredQty],
  )

  const totalRestock = rows.reduce((n, r) => n + r.restock, 0)

  const handleConfirm = () => {
    const payload = rows.map((r) => ({
      productId: r.line.productId,
      qty: r.delivered,
    }))
    void onConfirm(payload)
  }

  return (
    <Modal open={open} title="Mark delivered — quantities" onClose={onClose}>
      <p className="mb-3 text-sm text-slate-600">
        Enter how many were delivered. Any shortfall is returned to godown stock automatically.
      </p>

      <div className="space-y-3">
        {rows.map(({ line, dispatched, delivered, restock }) => (
          <div key={line.productId} className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
            <Input
              label={`${line.particulars || line.productName || line.productId} (dispatched ${dispatched})`}
              type="number"
              min={0}
              max={dispatched}
              value={deliveredQty[line.productId] ?? ''}
              onChange={(e) =>
                setDeliveredQty((prev) => ({ ...prev, [line.productId]: e.target.value }))
              }
            />
            <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-500">
              <span>
                Delivered: <strong className="text-emerald-700">{delivered}</strong>
              </span>
              <span>
                Restock to stock:{' '}
                <strong className={restock > 0 ? 'text-amber-700' : 'text-slate-600'}>{restock}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>

      {totalRestock > 0 ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 ring-1 ring-amber-100">
          {totalRestock} unit{totalRestock === 1 ? '' : 's'} will be added back to stock.
        </p>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button onClick={handleConfirm} disabled={busy || rows.length === 0}>
          Confirm delivered
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
      </div>
    </Modal>
  )
}
