// import { formatDateTime } from '../../lib/format'
// import { Button } from '../ui/Button'
// import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

// type Props = {
//   status: string
//   billerReturnUrl?: string
//   billerReturnSubmittedAt?: string
//   damageTotal?: number
//   missingTotal?: number
//   onCopyLink?: (url: string) => void
//   compact?: boolean
// }

// const RETURN_PHASE_STATUSES = new Set(['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN'])

// export function ReturnReconciliationCard({
//   status,
//   billerReturnUrl,
//   billerReturnSubmittedAt,
//   damageTotal,
//   missingTotal,
//   onCopyLink,
//   compact,
// }: Props) {
//   if (!RETURN_PHASE_STATUSES.has(status)) return null

//   const copy = (url: string) => {
//     if (onCopyLink) onCopyLink(url)
//     else navigator.clipboard.writeText(url).catch(() => {})
//   }

//   return (
//     <Card className={compact ? 'mb-2' : 'mb-4'}>
//       <CardHeader>
//         <CardTitle className={compact ? 'text-base' : undefined}>Return reconciliation</CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-3 text-sm">
//         <p className="text-slate-600">
//           Biller submits missing items, damage, and notes via the return link before godown completes the return.
//         </p>
//         {billerReturnUrl ? (
//           <div className="flex flex-wrap items-center gap-2">
//             <Button size="sm" variant="secondary" onClick={() => copy(billerReturnUrl)}>
//               Copy biller return link
//             </Button>
//             <a
//               href={billerReturnUrl}
//               target="_blank"
//               rel="noreferrer"
//               className="text-sm font-semibold text-primary-700 hover:text-primary-900"
//             >
//               Open form
//             </a>
//           </div>
//         ) : (
//           <p className="text-amber-700">Biller return link not available.</p>
//         )}
//         {billerReturnSubmittedAt ? (
//           <p className="rounded-xl bg-primary-50 px-3 py-2 text-primary-800 ring-1 ring-primary-100">
//             Submitted {formatDateTime(billerReturnSubmittedAt)}
//             {damageTotal != null || missingTotal != null ? (
//               <span>
//                 {' '}
//                 · Damage {damageTotal != null ? damageTotal.toFixed(2) : '—'} · Missing{' '}
//                 {missingTotal != null ? missingTotal.toFixed(2) : '—'}
//               </span>
//             ) : null}
//             . See biller return details in Overview below.
//           </p>
//         ) : (
//           <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-800 ring-1 ring-amber-100">
//             Biller has not submitted the return report yet. Share the link above so missing items and notes can be
//             recorded.
//           </p>
//         )}
//       </CardContent>
//     </Card>
//   )
// }


import { formatDateTime } from '../../lib/format'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

type ReturnLine = {
  productId: string
  particulars?: string
  sku?: string
  qty: number
  note?: string
}

type Props = {
  status: string
  billerReturnUrl?: string
  billerReturnSubmittedAt?: string
  billerReturnName?: string
  billerSignature?: string
  damageTotal?: number
  missingTotal?: number
  pendingProducts?: ReturnLine[]
  collectedProducts?: ReturnLine[]
  onCopyLink?: (url: string) => void
  compact?: boolean
}

const RETURN_PHASE_STATUSES = new Set(['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN'])

export function ReturnReconciliationCard({
  status,
  billerReturnUrl,
  billerReturnSubmittedAt,
  billerReturnName,
  billerSignature,
  damageTotal,
  missingTotal,
  pendingProducts = [],
  collectedProducts = [],
  onCopyLink,
  compact,
}: Props) {
  if (!RETURN_PHASE_STATUSES.has(status)) return null

  const copy = (url: string) => {
    if (onCopyLink) onCopyLink(url)
    else navigator.clipboard.writeText(url).catch(() => {})
  }

  const combinedTotal = (damageTotal ?? 0) + (missingTotal ?? 0)
  const hasTotal = damageTotal != null || missingTotal != null
  const showPendingPickupLink =
    status === 'PENDING_RETURN' || status === 'RETURN_PICKUP' || pendingProducts.length > 0
  const linkLabel = showPendingPickupLink ? 'Copy pending return pickup link' : 'Copy biller return link'
  const pendingQty = pendingProducts.reduce((s, p) => s + (Number(p.qty) || 0), 0)
  const collectedQty = collectedProducts.reduce((s, p) => s + (Number(p.qty) || 0), 0)
  const hasSignature = Boolean(billerSignature)

  return (
    <Card className={compact ? 'mb-2' : 'mb-4'}>
      <CardHeader>
        <CardTitle className={compact ? 'text-base' : undefined}>
          {showPendingPickupLink ? 'Pending return pickup link' : 'Return reconciliation'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-slate-600">
          {showPendingPickupLink
            ? 'Share this link for balance products still with the customer — only not-yet-picked-up products appear on the form.'
            : 'Biller submits missing items, damage, and notes via the return link before godown completes the return.'}
        </p>
        {billerReturnUrl ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => copy(billerReturnUrl)}>
              {linkLabel}
            </Button>
            <a
              href={billerReturnUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-primary-700 hover:text-primary-900"
            >
              Open form
            </a>
          </div>
        ) : (
          <p className="text-amber-700">Pending return pickup link not available.</p>
        )}
        {pendingProducts.length > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
              Not picked up from customer ({pendingQty} qty)
            </div>
            <ul className="space-y-1 text-sm text-amber-950">
              {pendingProducts.map((p) => (
                <li key={p.productId} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate">{p.particulars || p.productId}</span>
                  <span className="shrink-0 font-semibold">{p.qty}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {collectedProducts.length > 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-800">
              Collected &amp; restocked ({collectedQty} qty)
            </div>
            <ul className="divide-y divide-emerald-100 overflow-hidden rounded-lg border border-emerald-200 bg-white">
              {collectedProducts.map((p, i) => (
                <li key={`collected-${p.productId}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-slate-900">
                        {p.particulars || p.sku || p.productId}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Collected
                      </span>
                    </div>
                    {p.sku ? <div className="text-xs text-slate-500">{p.sku}</div> : null}
                    {p.note ? <div className="mt-0.5 text-xs text-slate-600">Note: {p.note}</div> : null}
                  </div>
                  <span className="shrink-0 font-semibold text-emerald-800">{p.qty}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {hasSignature ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signature</span>
              <Badge variant="green">On file</Badge>
            </div>
            {billerReturnName ? (
              <div className="px-3 pt-2 text-xs text-slate-500">Returned by {billerReturnName}</div>
            ) : null}
            <img
              src={billerSignature}
              alt="Biller return signature"
              className="mx-auto block max-h-40 w-full object-contain bg-white p-2"
            />
          </div>
        ) : null}

        {billerReturnSubmittedAt ? (
          <p className="rounded-xl bg-primary-50 px-3 py-2 text-primary-800 ring-1 ring-primary-100">
            Submitted {formatDateTime(billerReturnSubmittedAt)}
            {hasTotal ? <span> · Damage/Missing {combinedTotal.toFixed(2)}</span> : null}
            {pendingProducts.length > 0
              ? '. Balance products remain — the link above opens only those items.'
              : '. See biller return details in Overview below.'}
          </p>
        ) : (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-800 ring-1 ring-amber-100">
            Biller has not submitted the return report yet. Share the link above so missing items and notes can be
            recorded.
          </p>
        )}
      </CardContent>
    </Card>
  )
}