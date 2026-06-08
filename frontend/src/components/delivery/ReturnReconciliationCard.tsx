import { formatDateTime } from '../../lib/format'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

type Props = {
  status: string
  billerReturnUrl?: string
  billerReturnSubmittedAt?: string
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
              className="text-sm font-semibold text-primary-700 hover:text-primary-900"
            >
              Open form
            </a>
          </div>
        ) : (
          <p className="text-amber-700">Biller return link not available.</p>
        )}
        {billerReturnSubmittedAt ? (
          <p className="rounded-xl bg-primary-50 px-3 py-2 text-primary-800 ring-1 ring-primary-100">
            Submitted {formatDateTime(billerReturnSubmittedAt)}
            {damageTotal != null || missingTotal != null ? (
              <span>
                {' '}
                · Damage {damageTotal != null ? damageTotal.toFixed(2) : '—'} · Missing{' '}
                {missingTotal != null ? missingTotal.toFixed(2) : '—'}
              </span>
            ) : null}
            . See biller return details in Overview below.
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
