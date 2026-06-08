import { Badge } from '../ui/Badge'

export type CompletionLine = {
  particulars?: string
  productId?: string
  sku?: string
  qty: number
}

export type PublicCompletionScreenProps = {
  variant: 'thankYou' | 'alreadyDone'
  title: string
  subtitle: string
  statusLabel: string
  deliveryNo: string
  customerName: string
  meta: { label: string; value: string }[]
  lines: CompletionLine[]
  completedAt?: string
  completedAtLabel?: string
  verifierName?: string
  hasSignature?: boolean
}

function CheckIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12.5 9.5 17 19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LineCheckIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-primary-600" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" className="fill-emerald-50 stroke-emerald-200" strokeWidth="1.5" />
      <path d="M8 12.5 10.5 15 16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function formatDateTime(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function PublicCompletionScreen({
  variant,
  title,
  subtitle,
  statusLabel,
  deliveryNo,
  customerName,
  meta,
  lines,
  completedAt,
  completedAtLabel,
  verifierName,
  hasSignature,
}: PublicCompletionScreenProps) {
  const dateLabel = completedAtLabel ?? (variant === 'thankYou' ? 'Verified on' : 'Completed on')
  return (
    <div className="mx-auto w-full max-w-lg animate-fade-in">
      <div className="animate-slide-up rounded-2xl bg-white p-6 shadow-xl ring-1 ring-primary-100 sm:p-8">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg shadow-primary-200">
            <CheckIcon />
          </div>

          <Badge variant="green" className="mb-3">
            {statusLabel}
          </Badge>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>

          <p className="mt-4 text-sm font-medium text-slate-800">
            {deliveryNo} · {customerName}
          </p>
        </div>

        <div className="mt-6 space-y-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
          {meta.map((m) => (
            <div key={m.label} className="flex justify-between gap-4">
              <span className="text-slate-500">{m.label}</span>
              <span className="text-right font-medium text-slate-800">{m.value}</span>
            </div>
          ))}
          {completedAt ? (
            <div className="flex justify-between gap-4 border-t border-slate-200/80 pt-2">
              <span className="text-slate-500">{dateLabel}</span>
              <span className="text-right font-medium text-slate-800">{formatDateTime(completedAt)}</span>
            </div>
          ) : null}
          {verifierName ? (
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Verified by</span>
              <span className="text-right font-medium text-slate-800">{verifierName}</span>
            </div>
          ) : null}
          {hasSignature ? (
            <div className="pt-1">
              <Badge variant="green">Signature on file</Badge>
            </div>
          ) : null}
        </div>

        {lines.length > 0 ? (
          <div className="mt-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Items</h2>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {lines.map((l, i) => (
                <li key={`line-${i}`} className="flex items-start gap-3 p-3">
                  <LineCheckIcon />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900">{l.particulars || l.productId || 'Item'}</div>
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
    </div>
  )
}
