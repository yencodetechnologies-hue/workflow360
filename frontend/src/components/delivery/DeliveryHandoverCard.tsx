import { Badge } from '../ui/Badge'
import { formatDateTime } from '../../lib/format'

type HandoverLine = {
  productId: string
  particulars?: string
  sku?: string
  qty: number
}

type DeliveryHandoverCardProps = {
  deliveryVerifiedAt?: string
  deliveryVerifierName?: string
  vehicleLabel?: string
  deliverySignature?: string
  lines: HandoverLine[]
}

function LineCheckIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-primary-600" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" className="fill-emerald-50 stroke-emerald-200" strokeWidth="1.5" />
      <path d="M8 12.5 10.5 15 16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function DeliveryHandoverCard({
  deliveryVerifiedAt,
  deliveryVerifierName,
  vehicleLabel,
  deliverySignature,
  lines,
}: DeliveryHandoverCardProps) {
  if (!deliveryVerifiedAt) {
    return (
      <div className="rounded-xl border border-slate-200 p-3">
        <div className="font-semibold text-slate-900">Delivery handover</div>
        <div className="mt-1 text-amber-700">Pending — share delivery verify link</div>
      </div>
    )
  }

  const hasSignature = Boolean(deliverySignature)

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="font-semibold text-slate-900">Delivery handover</div>
        <Badge variant="green">Verified</Badge>
      </div>

      <div className="mt-3 space-y-2 rounded-xl bg-white/80 px-4 py-3 text-sm">
        {vehicleLabel ? (
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Vehicle</span>
            <span className="text-right font-medium text-slate-800">{vehicleLabel}</span>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Verified on</span>
          <span className="text-right font-medium text-slate-800">{formatDateTime(deliveryVerifiedAt)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Verified by</span>
          <span className="text-right font-medium text-slate-800">{deliveryVerifierName || '—'}</span>
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
            src={deliverySignature}
            alt="Delivery verification signature"
            className="mx-auto block max-h-40 w-full object-contain bg-white p-2"
          />
        </div>
      ) : null}

      {lines.length > 0 ? (
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Verified items</h3>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {lines.map((l, i) => (
              <li key={`${l.productId}-${i}`} className="flex items-start gap-3 p-3">
                <LineCheckIcon />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
                  <div className="text-xs text-slate-500">
                    {l.sku ? `${l.sku} · ` : ''}Qty {l.qty}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
