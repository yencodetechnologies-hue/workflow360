import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatDateTime } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, Td, Th } from '../../components/ui/Table'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'

type DeliveryLine = {
  productId: string
  godownId?: string
  godownName?: string
  qty: number
  particulars?: string
  sku?: string
  rate?: string
  parsedRate?: number
  unit?: string
}

type BillerReturnLine = {
  productId: string
  qty: number
  particulars?: string
  sku?: string
  note?: string
}

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
  lines: DeliveryLine[]
  deliveryVerifierName?: string
  deliveryVerifiedAt?: string
  billerReturnSubmittedAt?: string
  billerMissingLines?: BillerReturnLine[]
  billerDamagedLines?: BillerReturnLine[]
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
        <PageHeader title="Delivery" subtitle="Loadingâ€¦" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={d.deliveryNo}
        subtitle={`${d.customerName} â€¢ ${d.siteName || d.siteAddress || 'â€”'}`}
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
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="font-semibold text-slate-900">Delivery handover</div>
              {d.deliveryVerifiedAt ? (
                <div className="text-slate-700">
                  Verified by {d.deliveryVerifierName || 'â€”'} ({formatDateTime(d.deliveryVerifiedAt)})
                </div>
              ) : (
                <div className="text-amber-700">Pending â€” share delivery verify link</div>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="font-semibold text-slate-900">Biller return</div>
              {d.billerReturnSubmittedAt ? (
                <>
                  <div className="text-slate-600">Submitted {formatDateTime(d.billerReturnSubmittedAt)}</div>
                  <div className="mt-1 text-slate-700">
                    Damage total: {d.damageTotal ?? 'â€”'} Â· Missing total: {d.missingTotal ?? 'â€”'}
                  </div>
                </>
              ) : (
                <div className="text-amber-700">Pending â€” share biller return link after delivery</div>
              )}
            </div>
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
              <div className="break-all text-slate-600">{d.deliveryVerifyUrl || 'â€”'}</div>
              {d.deliveryVerifyUrl ? (
                <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.deliveryVerifyUrl || '')}>
                  Copy
                </Button>
              ) : null}
            </div>
            <div>
              <div className="font-semibold text-slate-800">Biller return</div>
              <div className="break-all text-slate-600">{d.billerReturnUrl || 'â€”'}</div>
              {d.billerReturnUrl ? (
                <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.billerReturnUrl || '')}>
                  Copy
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {d.billerReturnSubmittedAt && (d.billerMissingLines?.length || d.billerDamagedLines?.length) ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Missing and damage (biller return)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-semibold text-slate-800">Missing products</div>
              {d.billerMissingLines?.length ? (
                <ul className="space-y-1 text-sm text-slate-700">
                  {d.billerMissingLines.map((l) => (
                    <li key={l.productId} className="flex justify-between gap-2">
                      <span>{l.particulars || l.sku || l.productId}</span>
                      <span className="font-semibold">qty {l.qty}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">None reported.</p>
              )}
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold text-slate-800">Damaged products</div>
              {d.billerDamagedLines?.length ? (
                <ul className="space-y-1 text-sm text-slate-700">
                  {d.billerDamagedLines.map((l) => (
                    <li key={l.productId} className="flex justify-between gap-2">
                      <span>{l.particulars || l.sku || l.productId}</span>
                      <span className="font-semibold">qty {l.qty}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">None reported.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Products in delivery</CardTitle>
        </CardHeader>
        <CardContent>
          {d.lines.length === 0 ? (
            <p className="text-sm text-slate-600">No products on this delivery.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>SKU</Th>
                  <Th>Godown</Th>
                  <Th className="text-right">Qty</Th>
                  <Th className="text-right">Rate</Th>
                </tr>
              </thead>
              <tbody>
                {d.lines.map((l) => (
                  <tr key={`${l.productId}-${l.godownId ?? ''}`} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{l.particulars || l.productId}</Td>
                    <Td className="font-mono text-xs text-slate-600">{l.sku || 'â€”'}</Td>
                    <Td className="text-slate-700">{l.godownName || 'â€”'}</Td>
                    <Td className="text-right font-semibold text-slate-900">
                      {l.qty}
                      {l.unit ? <span className="ml-1 font-normal text-slate-500">{l.unit}</span> : null}
                    </Td>
                    <Td className="text-right text-slate-700">{l.rate ?? 'â€”'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <p className="mt-3 text-xs text-slate-500">
            {d.lines.length} line{d.lines.length === 1 ? '' : 's'} Â·{' '}
            {d.lines.reduce((sum, l) => sum + l.qty, 0)} total units
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

