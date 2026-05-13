import { useEffect, useMemo, useState } from 'react'
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
  parsedRate?: number
}

type GetRes = {
  deliveryNo: string
  customerName: string
  siteName?: string
  status: string
  challanNo?: string
  lines: Line[]
  damageTotal?: number
  missingTotal?: number
  billerReturnSubmittedAt?: string
  canSubmit?: boolean
}

export function PublicBillerReturnPage() {
  const { token } = useParams()
  const [data, setData] = useState<GetRes | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [damaged, setDamaged] = useState<Record<string, string>>({})
  const [missing, setMissing] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return
    const t = decodeURIComponent(token)
    apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
      .then((r) => {
        setData(r)
        const z: Record<string, string> = {}
        for (const l of r.lines) {
          z[l.productId] = '0'
        }
        setDamaged({ ...z })
        setMissing({ ...z })
      })
      .catch((e: any) => setError(e?.message || 'Failed to load'))
  }, [token])

  const previewTotals = useMemo(() => {
    if (!data) return { damage: 0, missing: 0 }
    let damage = 0
    let miss = 0
    for (const l of data.lines) {
      const dq = Number(damaged[l.productId]) || 0
      const mq = Number(missing[l.productId]) || 0
      const rate = l.parsedRate ?? 0
      damage += rate * dq
      miss += rate * mq
    }
    return { damage, missing: miss }
  }, [data, damaged, missing])

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

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
          <div className="mt-1 text-sm text-slate-600">
            {data.deliveryNo} · {data.customerName}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Return reconciliation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.billerReturnSubmittedAt ? (
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Submitted on {new Date(data.billerReturnSubmittedAt).toLocaleString()}. Damage total: {data.damageTotal ?? '—'} · Missing
                total: {data.missingTotal ?? '—'}
              </div>
            ) : null}

            <div className="text-sm text-slate-600">
              Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
            </div>

            <div className="space-y-4">
              {data.lines.map((l) => (
                <div key={l.productId} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
                  <div className="text-xs text-slate-500">
                    {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Input
                      label="Damaged qty"
                      type="number"
                      min={0}
                      disabled={!data.canSubmit}
                      value={damaged[l.productId] ?? '0'}
                      onChange={(e) => setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))}
                    />
                    <Input
                      label="Missing qty"
                      type="number"
                      min={0}
                      disabled={!data.canSubmit}
                      value={missing[l.productId] ?? '0'}
                      onChange={(e) => setMissing((d) => ({ ...d, [l.productId]: e.target.value }))}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
              Estimated damage: {previewTotals.damage.toFixed(2)} · Estimated missing: {previewTotals.missing.toFixed(2)} (preview;
              server confirms on submit)
            </div>

            <Button
              disabled={!data.canSubmit || submitting}
              onClick={() => {
                if (!token || !data) return
                const t = decodeURIComponent(token)
                const damagedLines = data.lines.map((l) => ({
                  productId: l.productId,
                  qty: Number(damaged[l.productId]) || 0,
                }))
                const missingLines = data.lines.map((l) => ({
                  productId: l.productId,
                  qty: Number(missing[l.productId]) || 0,
                }))
                setSubmitting(true)
                apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
                  method: 'POST',
                  body: JSON.stringify({
                    damagedLines: damagedLines.filter((x) => x.qty > 0),
                    missingLines: missingLines.filter((x) => x.qty > 0),
                  }),
                })
                  .then(() => apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`).then(setData))
                  .catch((e: any) => setError(e?.message || 'Submit failed'))
                  .finally(() => setSubmitting(false))
              }}
            >
              {submitting ? 'Submitting…' : 'Submit return report'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
