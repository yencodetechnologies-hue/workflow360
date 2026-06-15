import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
import { Badge } from '../../components/ui/Badge'
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
  driverName?: string
  driverPhone?: string
  lines: Line[]
  deliveryVerifierName?: string
  deliveryVerifiedAt?: string
  hasSignature?: boolean
  canSubmit?: boolean
}

type Phase = 'form' | 'thankYou'
type SelectAllState = 'all' | 'none' | 'some'

const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'
const SIGNATURE_HEIGHT = 160

function getSelectAllState(checks: boolean[]): SelectAllState {
  if (checks.length === 0) return 'none'
  const checked = checks.filter(Boolean).length
  if (checked === 0) return 'none'
  if (checked === checks.length) return 'all'
  return 'some'
}

export function PublicDeliveryVerifyPage() {
  const { token } = useParams()
  const [data, setData] = useState<GetRes | null>(null)
  const [phase, setPhase] = useState<Phase>('form')
  const [error, setError] = useState<string | null>(null)
  const [verifierName, setVerifierName] = useState('')
  const [checks, setChecks] = useState<boolean[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const selectAllRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!token) return
    const t = decodeURIComponent(token)
    apiFetch<GetRes>(`/public/delivery-verify/${encodeURIComponent(t)}`)
      .then((r) => {
        setData(r)
        setPhase('form')
        setChecks(r.lines.map(() => false))
        if (r.deliveryVerifierName) setVerifierName(r.deliveryVerifierName)
      })
      .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
  }, [token])

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const width = Math.max(rect.width, 280)
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(SIGNATURE_HEIGHT * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
  }, [])

  useEffect(() => {
    if (phase !== 'form') return
    setupCanvas()
    const onResize = () => setupCanvas()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [phase, setupCanvas])

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawing.current = true
    canvas.setPointerCapture(e.pointerId)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = pointerPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setHasDrawn(true)
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = pointerPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    drawing.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const getSignatureDataUrl = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawn) return undefined
    return canvas.toDataURL('image/png')
  }

  const toggleLine = (index: number, checked: boolean) => {
    setChecks((prev) => {
      const next = [...prev]
      next[index] = checked
      return next
    })
  }

  const toggleSelectAll = () => {
    const state = getSelectAllState(checks)
    const next = state === 'all' ? checks.map(() => false) : checks.map(() => true)
    setChecks(next)
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
          lineChecks: data.lines.map((l, i) => ({
            productId: l.productId,
            ok: !!checks[i],
            qtyAck: l.qty,
          })),
        }),
      })
      const refreshed = await apiFetch<GetRes>(`/public/delivery-verify/${encodeURIComponent(t)}`)
      setData(refreshed)
      setPhase('thankYou')
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message || 'Submit failed'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const lineCount = data?.lines.length ?? 0
  const checkedCount = checks.filter(Boolean).length
  const selectAllState = getSelectAllState(checks)
  const allOk = lineCount > 0 && checks.length === lineCount && checks.every(Boolean)

  useEffect(() => {
    const el = selectAllRef.current
    if (el) el.indeterminate = selectAllState === 'some'
  }, [selectAllState])

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
          <LoadingSpinner size="lg" className="text-primary-600" />
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
    { label: 'Driver', value: data.driverName || '—' },
    { label: 'Driver phone', value: data.driverPhone || '—' },
  ]

  if (phase === 'thankYou') {
    return (
      <div className={pageShell}>
        <PublicCompletionScreen
          variant="thankYou"
          statusLabel="Verified"
          title="Thank you!"
          subtitle="Your delivery has been verified successfully."
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

  const progressPct = lineCount > 0 ? Math.round((checkedCount / lineCount) * 100) : 0
  const submitHints: string[] = []
  if (!allOk) submitHints.push('Check all items')
  if (!verifierName.trim()) submitHints.push('Enter your name')
  const canSubmitForm = allOk && verifierName.trim().length > 0 && !submitting

  return (
    <div className={pageShell}>
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Delivery verification</div>
          <div className="mt-1 text-sm text-slate-600">
            {data.deliveryNo} · {data.customerName}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {data.siteName ? <Badge variant="slate">Site: {data.siteName}</Badge> : null}
            <Badge variant="slate">Vehicle: {data.vehicleLabel || '—'}</Badge>
            <Badge variant="slate">Driver: {data.driverName || '—'}</Badge>
            <Badge variant="slate">Phone: {data.driverPhone || '—'}</Badge>
          </div>
          {data.deliveryVerifiedAt ? (
            <div className="mt-2 text-xs text-emerald-600 font-medium">
              ✓ Previously verified — you can re-submit to update
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
        ) : null}

        <Card className="hover:translate-y-0">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Checklist</CardTitle>
              <span className="text-sm font-medium text-slate-600">
                {checkedCount} of {lineCount} verified
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-primary-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <label className="flex cursor-pointer items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  checked={selectAllState === 'all'}
                  onChange={toggleSelectAll}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">Select all</div>
                  <div className="text-xs text-slate-500">
                    {lineCount} item{lineCount === 1 ? '' : 's'}
                  </div>
                </div>
              </label>

              <div className="divide-y divide-slate-100">
                {data.lines.map((l, i) => (
                  <label
                    key={`line-${i}`}
                    className={`flex cursor-pointer items-start gap-3 px-4 py-4 transition-colors ${
                      checks[i] ? 'bg-primary-50/60 hover:bg-primary-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      checked={!!checks[i]}
                      onChange={(e) => toggleLine(i, e.target.checked)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
                          <div className="text-xs text-slate-500">
                            {l.sku} · Qty {l.qty}
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Input
              label="Verified by (name)"
              value={verifierName}
              onChange={(e) => setVerifierName(e.target.value)}
            />

            <div>
              <div className="mb-1 text-sm font-medium text-slate-700">Signature</div>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  style={{ height: SIGNATURE_HEIGHT }}
                  className="w-full touch-none rounded-xl border border-slate-300 bg-white"
                  onPointerDown={startDraw}
                  onPointerMove={draw}
                  onPointerUp={endDraw}
                  onPointerLeave={endDraw}
                  onPointerCancel={endDraw}
                />
                {!hasDrawn ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl">
                    <span className="text-sm text-slate-400">Sign here</span>
                  </div>
                ) : null}
              </div>
              <Button variant="secondary" size="sm" className="mt-2" onClick={clearSignature}>
                Clear signature
              </Button>
            </div>

            <div className="space-y-2">
              <Button
                variant="success"
                className="w-full"
                loading={submitting}
                disabled={!canSubmitForm}
                onClick={handleSubmit}
              >
                Confirm verification
              </Button>
              {submitHints.length > 0 ? (
                <p className="text-center text-xs text-slate-500">Required: {submitHints.join(' · ')}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}