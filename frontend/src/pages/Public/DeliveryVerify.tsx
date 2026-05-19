import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
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
  deliveryVerifierName?: string
  deliveryVerifiedAt?: string
  hasSignature?: boolean
  canSubmit?: boolean
}

type Phase = 'form' | 'thankYou' | 'alreadyDone'

const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 px-4 py-10'

export function PublicDeliveryVerifyPage() {
  const { token } = useParams()
  const [data, setData] = useState<GetRes | null>(null)
  const [phase, setPhase] = useState<Phase>('form')
  const [error, setError] = useState<string | null>(null)
  const [verifierName, setVerifierName] = useState('')
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)

  useEffect(() => {
    if (!token) return
    const t = decodeURIComponent(token)
    apiFetch<GetRes>(`/public/delivery-verify/${encodeURIComponent(t)}`)
      .then((r) => {
        setData(r)
        setPhase(r.deliveryVerifiedAt ? 'alreadyDone' : 'form')
        const init: Record<string, boolean> = {}
        for (const l of r.lines) init[l.productId] = false
        setChecks(init)
      })
      .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
  }, [token])

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || phase !== 'form' || !data?.canSubmit) return
    drawing.current = true
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  const endDraw = () => {
    drawing.current = false
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const getSignatureDataUrl = () => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    return canvas.toDataURL('image/png')
  }

  const handleSubmit = async () => {
    if (!token || !data) return
    const t = decodeURIComponent(token)
    setSubmitting(true)
    setError(null)
    try {
      await apiFetch(`/public/delivery-verify/${encodeURIComponent(t)}`, {
        method: 'POST',
        body: JSON.stringify({
          verifierName: verifierName.trim(),
          signature: getSignatureDataUrl(),
          lineChecks: data.lines.map((l) => ({
            productId: l.productId,
            ok: !!checks[l.productId],
            qtyAck: l.qty,
          })),
        }),
      })
      const refreshed = await apiFetch<GetRes>(`/public/delivery-verify/${encodeURIComponent(t)}`)
      setData(refreshed)
      setPhase('thankYou')
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message || 'Submit failed'
      if (msg.toLowerCase().includes('already verified')) {
        const refreshed = await apiFetch<GetRes>(`/public/delivery-verify/${encodeURIComponent(t)}`)
        setData(refreshed)
        setPhase('alreadyDone')
      } else {
        setError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (error && !data) {
    return (
      <div className={pageShell}>
        <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
          {error}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={pageShell}>
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
          <LoadingSpinner size="lg" className="text-emerald-600" />
          <p className="text-sm">Loading verification…</p>
        </div>
      </div>
    )
  }

  const completionLines = data.lines.map((l) => ({
    productId: l.productId,
    particulars: l.particulars,
    sku: l.sku,
    qty: l.qty,
  }))

  const completionMeta = [
    { label: 'Site', value: data.siteName || '—' },
    { label: 'Vehicle', value: data.vehicleLabel || '—' },
  ]

  if (phase === 'thankYou' || phase === 'alreadyDone') {
    const isThankYou = phase === 'thankYou'
    return (
      <div className={pageShell}>
        <PublicCompletionScreen
          variant={isThankYou ? 'thankYou' : 'alreadyDone'}
          statusLabel={isThankYou ? 'Verified' : 'Already verified'}
          title={isThankYou ? 'Thank you!' : 'Already verified'}
          subtitle={
            isThankYou
              ? 'Your delivery has been verified successfully.'
              : 'This delivery was verified earlier. No further action is needed.'
          }
          deliveryNo={data.deliveryNo}
          customerName={data.customerName}
          meta={completionMeta}
          lines={completionLines}
          completedAt={data.deliveryVerifiedAt}
          verifierName={data.deliveryVerifierName || verifierName.trim() || undefined}
          hasSignature={data.hasSignature}
        />
      </div>
    )
  }

  const allOk = data.lines.length > 0 && data.lines.every((l) => checks[l.productId])

  return (
    <div className={pageShell}>
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-slate-900">Delivery verification</div>
          <div className="mt-1 text-sm text-slate-600">
            {data.deliveryNo} · {data.customerName}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-slate-600">
              Site: {data.siteName || '—'} · Vehicle: {data.vehicleLabel || '—'}
            </div>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {data.lines.map((l) => (
                <label key={l.productId} className="flex cursor-pointer items-start gap-3 p-3 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
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

            <div>
              <div className="mb-1 text-sm font-medium text-slate-700">Signature</div>
              <canvas
                ref={canvasRef}
                width={560}
                height={160}
                className="w-full touch-none rounded-xl border border-slate-300 bg-white"
                onPointerDown={startDraw}
                onPointerMove={draw}
                onPointerUp={endDraw}
                onPointerLeave={endDraw}
              />
              {data.canSubmit ? (
                <Button variant="secondary" size="sm" className="mt-2" onClick={clearSignature}>
                  Clear signature
                </Button>
              ) : null}
            </div>

            <Button
              variant="success"
              className="w-full"
              loading={submitting}
              disabled={!data.canSubmit || submitting || !verifierName.trim() || !allOk}
              onClick={handleSubmit}
            >
              Confirm verification
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
