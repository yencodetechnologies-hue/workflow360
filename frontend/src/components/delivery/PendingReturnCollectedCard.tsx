import { Badge } from '../ui/Badge'
import { formatDateTime } from '../../lib/format'

type ReturnLine = {
  productId: string
  qty: number
  particulars?: string
  sku?: string
  note?: string
}

type Props = {
  status: string
  billerReturnSubmittedAt?: string
  billerReturnName?: string
  billerSignature?: string
  deliveryAt?: string
  billerCollectedLines?: ReturnLine[]
  billerPendingReturnLines?: ReturnLine[]
}

const RETURN_PHASE_STATUSES = new Set(['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN', 'COMPLETED'])

function daysWithClientSince(deliveryAt?: string): number | null {
  if (!deliveryAt) return null
  const start = new Date(deliveryAt)
  if (Number.isNaN(start.getTime())) return null
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const today = new Date()
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diff = Math.round((todayDay.getTime() - startDay.getTime()) / 86_400_000)
  return Math.max(0, diff)
}

export function PendingReturnCollectedCard({
  status,
  billerReturnSubmittedAt,
  billerReturnName,
  billerSignature,
  deliveryAt,
  billerCollectedLines,
  billerPendingReturnLines,
}: Props) {
  const collected = billerCollectedLines ?? []
  const pending = billerPendingReturnLines ?? []
  const hasActivity =
    collected.length > 0 ||
    pending.length > 0 ||
    Boolean(billerSignature) ||
    status === 'PENDING_RETURN' ||
    status === 'RETURN_PICKUP'

  if (!RETURN_PHASE_STATUSES.has(status) && !hasActivity) return null

  if (!billerReturnSubmittedAt && collected.length === 0 && pending.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 p-3">
        <div className="font-semibold text-slate-900">Pending return collected</div>
        <div className="mt-1 text-amber-700">
          Pending — share pending return assign link for balance products still with the customer
        </div>
      </div>
    )
  }

  if (!hasActivity) return null

  const collectedQty = collected.reduce((s, l) => s + (Number(l.qty) || 0), 0)
  const pendingQty = pending.reduce((s, l) => s + (Number(l.qty) || 0), 0)
  const hasSignature = Boolean(billerSignature)
  const daysWithClient = daysWithClientSince(deliveryAt)

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="font-semibold text-slate-900">Pending return collected</div>
        {collectedQty > 0 ? <Badge variant="green">Collected</Badge> : null}
        {pendingQty > 0 ? <Badge variant="amber">Balance pending</Badge> : null}
      </div>

      <div className="mt-3 space-y-2 rounded-xl bg-white/80 px-4 py-3 text-sm">
        {billerReturnSubmittedAt ? (
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Submitted on</span>
            <span className="text-right font-medium text-slate-800">
              {formatDateTime(billerReturnSubmittedAt)}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Collected qty</span>
          <span className="text-right font-medium text-slate-800">{collectedQty}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Still with customer</span>
          <span className="text-right font-medium text-slate-800">{pendingQty}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Returned by</span>
          <span className="text-right font-medium text-slate-800">{billerReturnName || '—'}</span>
        </div>
        {hasSignature ? (
          <div className="pt-1">
            <Badge variant="green">Signature on file</Badge>
          </div>
        ) : null}
      </div>

      {hasSignature ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <img
            src={billerSignature}
            alt="Pending return signature"
            className="mx-auto block max-h-40 w-full object-contain bg-white p-2"
          />
        </div>
      ) : null}

      {collected.length > 0 ? (
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Collected &amp; restocked
          </h3>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {collected.map((l, i) => (
              <li key={`collected-${l.productId}-${i}`} className="p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-slate-900">
                    {l.particulars || l.sku || l.productId}
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Collected
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {l.sku ? `${l.sku} · ` : ''}Qty {l.qty}
                </div>
                {l.note ? <div className="mt-1 text-xs text-slate-600">Note: {l.note}</div> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pending.length > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-800">
              Still with customer ({pendingQty} qty)
            </h3>
            {daysWithClient != null ? (
              <span className="text-xs font-medium text-amber-800">
                With client {daysWithClient} day{daysWithClient === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>
          <ul className="mt-2 divide-y divide-amber-100 overflow-hidden rounded-lg border border-amber-200 bg-white">
            {pending.map((l, i) => (
              <li key={`pending-${l.productId}-${i}`} className="p-2.5 text-sm">
                <div className="font-medium text-slate-900">{l.particulars || l.sku || l.productId}</div>
                <div className="text-xs text-slate-500">
                  {l.sku ? `${l.sku} · ` : ''}Qty {l.qty}
                </div>
                {l.note ? <div className="mt-1 text-xs text-slate-600">Note: {l.note}</div> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
