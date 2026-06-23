import { Badge } from '../ui/Badge'
import { formatDateTime } from '../../lib/format'

type BillerReturnLine = {
  productId: string
  qty: number
  particulars?: string
  sku?: string
  note?: string
}

type BillerReturnCardProps = {
  status: string
  billerReturnSubmittedAt?: string
  billerMissingLines?: BillerReturnLine[]
  billerDamagedLines?: BillerReturnLine[]
  damageTotal?: number
  missingTotal?: number
}

const RETURN_ELIGIBLE_STATUSES = new Set(['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN', 'COMPLETED'])

type CombinedLine = BillerReturnLine & { kind: 'Missing' | 'Damaged' }

function CombinedReturnLineList({
  title,
  lines,
  emptyLabel,
}: {
  title: string
  lines: CombinedLine[]
  emptyLabel: string
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {lines.length > 0 ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {lines.map((l, i) => (
            <li key={`${l.kind}-${l.productId}-${i}`} className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-semibold text-slate-900">{l.particulars || l.sku || l.productId}</div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    l.kind === 'Missing' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {l.kind}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {l.sku ? `${l.sku} · ` : ''}Qty {l.qty}
              </div>
              {l.note ? <div className="mt-1 text-xs text-slate-600">Note: {l.note}</div> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">{emptyLabel}</p>
      )}
    </div>
  )
}

export function BillerReturnCard({
  status,
  billerReturnSubmittedAt,
  billerMissingLines,
  billerDamagedLines,
  damageTotal,
  missingTotal,
}: BillerReturnCardProps) {
  // If biller already submitted, show submitted state regardless of delivery status
  if (!billerReturnSubmittedAt) {
    if (!RETURN_ELIGIBLE_STATUSES.has(status)) {
      return (
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="font-semibold text-slate-900">Biller return</div>
          <div className="mt-1 text-amber-700">Available after delivery — share the biller return link</div>
        </div>
      )
    }
    return (
      <div className="rounded-xl border border-slate-200 p-3">
        <div className="font-semibold text-slate-900">Biller return</div>
        <div className="mt-1 text-amber-700">Pending — share biller return link for missing items and damage</div>
      </div>
    )
  }

  const missing = billerMissingLines ?? []
  const damaged = billerDamagedLines ?? []
  const combinedLines: CombinedLine[] = [
    ...missing.map((l) => ({ ...l, kind: 'Missing' as const })),
    ...damaged.map((l) => ({ ...l, kind: 'Damaged' as const })),
  ]
  const combinedTotal = (damageTotal ?? 0) + (missingTotal ?? 0)
  const formatTotal = (n?: number) => (n != null ? n.toFixed(2) : '—')

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="font-semibold text-slate-900">Biller return</div>
        <Badge variant="amber">Submitted</Badge>
      </div>

      <div className="mt-3 space-y-2 rounded-xl bg-white/80 px-4 py-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Submitted on</span>
          <span className="text-right font-medium text-slate-800">{formatDateTime(billerReturnSubmittedAt)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Damage/Missing total</span>
          <span className="text-right font-medium text-slate-800">{formatTotal(combinedTotal)}</span>
        </div>
      </div>

      <div className="mt-4">
        <CombinedReturnLineList title="Damage/Missing" lines={combinedLines} emptyLabel="None reported." />
      </div>
    </div>
  )
}