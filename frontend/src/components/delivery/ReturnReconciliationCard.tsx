import { formatDateTime } from '../../lib/format'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

type BillerReturnLine = {
  productId: string
  qty: number
  particulars?: string
  sku?: string
  note?: string
}

type Props = {
  status: string
  billerReturnUrl?: string
  billerReturnSubmittedAt?: string
  billerMissingLines?: BillerReturnLine[]
  billerDamagedLines?: BillerReturnLine[]
  damageTotal?: number
  missingTotal?: number
  onCopyLink?: (url: string) => void
  compact?: boolean
}

const RETURN_PHASE_STATUSES = new Set(['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN'])

export function ReturnReconciliationCard({
  status,
  billerReturnUrl,
  billerReturnSubmittedAt,
  billerMissingLines,
  billerDamagedLines,
  damageTotal,
  missingTotal,
  onCopyLink,
  compact,
}: Props) {
  if (!RETURN_PHASE_STATUSES.has(status)) return null

  const copy = (url: string) => {
    if (onCopyLink) onCopyLink(url)
    else navigator.clipboard.writeText(url).catch(() => {})
  }

  return (
    <Card className={compact ? 'mb-2' : 'mb-4'}>
      <CardHeader>
        <CardTitle className={compact ? 'text-base' : undefined}>Return reconciliation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-slate-600">
          Biller submits missing items, damage, and notes via the return link before godown completes the return.
        </p>
        {billerReturnUrl ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => copy(billerReturnUrl)}>
              Copy biller return link
            </Button>
            <a
              href={billerReturnUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-violet-700 hover:text-violet-900"
            >
              Open form
            </a>
          </div>
        ) : (
          <p className="text-amber-700">Biller return link not available.</p>
        )}
        {billerReturnSubmittedAt ? (
          <>
            <p className="text-slate-700">Submitted {formatDateTime(billerReturnSubmittedAt)}</p>
            <p className="text-slate-700">
              Damage total: {damageTotal ?? '—'} · Missing total: {missingTotal ?? '—'}
            </p>
            {(billerMissingLines?.length || billerDamagedLines?.length) ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 font-semibold text-slate-800">Missing</div>
                  {billerMissingLines?.length ? (
                    <ul className="space-y-1 text-slate-700">
                      {billerMissingLines.map((l) => (
                        <li key={l.productId}>
                          {l.particulars || l.sku || l.productId} — qty {l.qty}
                          {l.note ? <span className="block text-xs text-slate-500">Note: {l.note}</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-600">None reported.</p>
                  )}
                </div>
                <div>
                  <div className="mb-1 font-semibold text-slate-800">Damaged</div>
                  {billerDamagedLines?.length ? (
                    <ul className="space-y-1 text-slate-700">
                      {billerDamagedLines.map((l) => (
                        <li key={l.productId}>
                          {l.particulars || l.sku || l.productId} — qty {l.qty}
                          {l.note ? <span className="block text-xs text-slate-500">Note: {l.note}</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-600">None reported.</p>
                  )}
                </div>
              </div>
            ) : null}
          </>
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
