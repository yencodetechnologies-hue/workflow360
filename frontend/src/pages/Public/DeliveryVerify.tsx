import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { apiFetch } from '../../lib/api'

type Line = {
  productId: string
  qty: number
  particulars?: string
  sku?: string
  rate?: string
  parsedRate?: number
}

type GetRes = {
  deliveryNo: string
  customerName: string
  siteName?: string
  status: string
  deliveryAt: string
  vehicleLabel?: string
  lines: Line[]
  deliveryVerifiedAt?: string
  canSubmit?: boolean
}

export function PublicDeliveryVerifyPage() {
  const { token } = useParams()
  const [data, setData] = useState<GetRes | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [verifierName, setVerifierName] = useState('')
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return
    const t = decodeURIComponent(token)
    apiFetch<GetRes>(`/public/delivery-verify/${encodeURIComponent(t)}`)
      .then((r) => {
        setData(r)
        const init: Record<string, boolean> = {}
        for (const l of r.lines) init[l.productId] = false
        setChecks(init)
      })
      .catch((e: any) => setError(e?.message || 'Failed to load'))
  }, [token])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-lg text-sm text-slate-600">Loading…</div>
      </div>
    )
  }

  const allOk = data.lines.length > 0 && data.lines.every((l) => checks[l.productId])

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-slate-900">Delivery verification</div>
          <div className="mt-1 text-sm text-slate-600">
            {data.deliveryNo} · {data.customerName}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.deliveryVerifiedAt ? (
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Verified on {new Date(data.deliveryVerifiedAt).toLocaleString()}
              </div>
            ) : null}
            <div className="text-sm text-slate-600">
              Site: {data.siteName || '—'} · Vehicle: {data.vehicleLabel || '—'}
            </div>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {data.lines.map((l) => (
                <label key={l.productId} className="flex cursor-pointer items-start gap-3 p-3 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={!!checks[l.productId]}
                    disabled={!data.canSubmit}
                    onChange={(e) => setChecks((c) => ({ ...c, [l.productId]: e.target.checked }))}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
                    <div className="text-xs text-slate-500">
                      {l.sku} · Qty {l.qty}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <Input
              label="Verified by (name)"
              value={verifierName}
              disabled={!data.canSubmit}
              onChange={(e) => setVerifierName(e.target.value)}
            />

            <Button
              disabled={!data.canSubmit || submitting || !verifierName.trim() || !allOk}
              onClick={() => {
                if (!token) return
                const t = decodeURIComponent(token)
                setSubmitting(true)
                apiFetch(`/public/delivery-verify/${encodeURIComponent(t)}`, {
                  method: 'POST',
                  body: JSON.stringify({
                    verifierName: verifierName.trim(),
                    lineChecks: data.lines.map((l) => ({
                      productId: l.productId,
                      ok: !!checks[l.productId],
                      qtyAck: l.qty,
                    })),
                  }),
                })
                  .then(() => {
                    return apiFetch<GetRes>(`/public/delivery-verify/${encodeURIComponent(t)}`).then(setData)
                  })
                  .catch((e: any) => setError(e?.message || 'Submit failed'))
                  .finally(() => setSubmitting(false))
              }}
            >
              {submitting ? 'Submitting…' : 'Confirm verification'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
