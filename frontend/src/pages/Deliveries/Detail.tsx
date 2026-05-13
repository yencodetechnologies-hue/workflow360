import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatDateTime } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'

type DeliveryDetail = {
  id: string
  deliveryNo: string
  customerName: string
  siteName?: string
  siteAddress?: string
  contactPhone?: string
  billerUserId?: string
  fromGodownId: string
  deliveryAt: string
  returnExpectedAt?: string
  vehicleLabel?: string
  status: string
  lines: Array<{ productId: string; qty: number }>
  deliveryVerifierName?: string
  deliveryVerifiedAt?: string
  billerReturnSubmittedAt?: string
  damageTotal?: number
  missingTotal?: number
  deliveryVerifyUrl?: string
  billerReturnUrl?: string
}

export function DeliveryDetailPage() {
  const { id } = useParams()
  const auth = useAuth()
  const [d, setD] = useState<DeliveryDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    const token = getToken()
    if (!token || !id) return
    setError(null)
    apiFetch<DeliveryDetail>(`/deliveries/${id}`, { token })
      .then(setD)
      .catch((e: any) => setError(e?.message || 'Failed to load'))
  }

  useEffect(() => {
    load()
  }, [id])

  const canRegen = auth.status === 'authenticated' && auth.user.role === 'ADMIN'

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  if (!id) return null

  if (error && !d) {
    return (
      <div>
        <PageHeader title="Delivery" subtitle="Error" right={<Link to="/deliveries" className="text-sm font-semibold">Back</Link>} />
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      </div>
    )
  }

  if (!d) {
    return (
      <div>
        <PageHeader title="Delivery" subtitle="Loading…" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={d.deliveryNo}
        subtitle={`${d.customerName} • ${d.siteName || d.siteAddress || '—'}`}
        right={
          <Link to="/deliveries" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
            Back to list
          </Link>
        }
      />

      {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-600">Status</span>
              <Badge variant="slate">{d.status}</Badge>
            </div>
            <div>
              <span className="text-slate-600">Scheduled: </span>
              {formatDateTime(d.deliveryAt)}
            </div>
            {d.returnExpectedAt ? (
              <div>
                <span className="text-slate-600">Return expected: </span>
                {formatDateTime(d.returnExpectedAt)}
              </div>
            ) : null}
            {d.vehicleLabel ? (
              <div>
                <span className="text-slate-600">Vehicle: </span>
                {d.vehicleLabel}
              </div>
            ) : null}
            {d.contactPhone ? (
              <div>
                <span className="text-slate-600">Contact: </span>
                {d.contactPhone}
              </div>
            ) : null}
            {d.deliveryVerifierName ? (
              <div>
                <span className="text-slate-600">Verified by (delivery): </span>
                {d.deliveryVerifierName}{' '}
                {d.deliveryVerifiedAt ? <span className="text-slate-500">({formatDateTime(d.deliveryVerifiedAt)})</span> : null}
              </div>
            ) : null}
            {d.billerReturnSubmittedAt ? (
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="font-semibold text-slate-900">Biller return</div>
                <div className="text-slate-600">Submitted {formatDateTime(d.billerReturnSubmittedAt)}</div>
                <div className="mt-1 text-slate-700">
                  Damage total: {d.damageTotal ?? '—'} · Missing total: {d.missingTotal ?? '—'}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle>Magic links</CardTitle>
            {canRegen ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const token = getToken()
                  if (!token || !id) return
                  apiFetch<{ deliveryVerifyUrl: string; billerReturnUrl: string }>(`/deliveries/${id}/regenerate-tokens`, {
                    token,
                    method: 'POST',
                  })
                    .then(() => load())
                    .catch((e: any) => setError(e?.message || 'Regenerate failed'))
                }}
              >
                Regenerate links
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <div className="font-semibold text-slate-800">Delivery verify</div>
              <div className="break-all text-slate-600">{d.deliveryVerifyUrl || '—'}</div>
              {d.deliveryVerifyUrl ? (
                <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.deliveryVerifyUrl || '')}>
                  Copy
                </Button>
              ) : null}
            </div>
            <div>
              <div className="font-semibold text-slate-800">Biller return</div>
              <div className="break-all text-slate-600">{d.billerReturnUrl || '—'}</div>
              {d.billerReturnUrl ? (
                <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.billerReturnUrl || '')}>
                  Copy
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
