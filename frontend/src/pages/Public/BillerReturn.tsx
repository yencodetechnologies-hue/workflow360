import { useEffect, useMemo, useRef, useState } from 'react'
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
  parsedRate?: number
}

type PendingLine = { productId: string; qty: number; particulars?: string; sku?: string }

type GetRes = {
  deliveryNo: string
  customerName: string
  siteName?: string
  status: string
  challanNo?: string
  deliveryAt?: string
  vehicleLabel?: string
  driverName?: string
  driverPhone?: string
  returnDriverName?: string
  lines: Line[]
  damageTotal?: number
  missingTotal?: number
  billerReturnSubmittedAt?: string
  billerReturnName?: string
  billerDamagedLines?: { productId: string; qty: number }[]
  billerMissingLines?: { productId: string; qty: number }[]
  billerCollectedLines?: { productId: string; qty: number }[]
  billerPendingReturnLines?: PendingLine[]
  canSubmit?: boolean
}

// How many days a still-pending item has been sitting with the client,
// counted from the delivery date. No manual scheduling needed — this is
// always live off today's date.
function daysWithClient(deliveryAt?: string): number | null {
  if (!deliveryAt) return null
  const start = new Date(deliveryAt)
  if (Number.isNaN(start.getTime())) return null
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const today = new Date()
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diff = Math.round((todayDay.getTime() - startDay.getTime()) / 86_400_000)
  return Math.max(0, diff)
}

type SelectAllState = 'none' | 'some' | 'all'

function getSelectAllState(checks: boolean[]): SelectAllState {
  if (checks.length === 0) return 'none'
  const checked = checks.filter(Boolean).length
  if (checked === 0) return 'none'
  if (checked === checks.length) return 'all'
  return 'some'
}

type Phase = 'form' | 'thankYou'

const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

function aggregateLines(lines: Line[]): Line[] {
  const byProduct = new Map<string, Line>()
  for (const l of lines) {
    const existing = byProduct.get(l.productId)
    if (existing) {
      existing.qty += l.qty
    } else {
      byProduct.set(l.productId, { ...l })
    }
  }
  return Array.from(byProduct.values())
}

export function PublicBillerReturnPage() {
  const { token } = useParams()
  const [data, setData] = useState<GetRes | null>(null)
  const [phase, setPhase] = useState<Phase>('form')
  const [error, setError] = useState<string | null>(null)
  const [checks, setChecks] = useState<boolean[]>([])
  // Two separate quantities per product: how many are damaged/missing
  // (write-off, not restocked) and how many are being physically collected
  // back right now (restocked into the godown).
  const [damagedQty, setDamagedQty] = useState<Record<string, string>>({})
  const [collectedQty, setCollectedQty] = useState<Record<string, string>>({})
  const [returnedByName, setReturnedByName] = useState('')
  const [hasDrawn, setHasDrawn] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const [submitting, setSubmitting] = useState(false)
  const selectAllRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!token) return
    const t = decodeURIComponent(token)
    apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
      .then((r) => {
        setData(r)
        setPhase('form')
        const agg = aggregateLines(r.lines)
        const z: Record<string, string> = {}
        for (const l of agg) z[l.productId] = '0'

        const dmg = { ...z }
        if (r.billerDamagedLines) {
          for (const l of r.billerDamagedLines) dmg[l.productId] = String((Number(dmg[l.productId]) || 0) + l.qty)
        }
        const col = { ...z }
        if (r.billerCollectedLines) {
          for (const l of r.billerCollectedLines) col[l.productId] = String((Number(col[l.productId]) || 0) + l.qty)
        }
        setDamagedQty(dmg)
        setCollectedQty(col)

        // Pre-check products that already have a qty entered
        const preChecks = agg.map((l) => Number(dmg[l.productId]) > 0 || Number(col[l.productId]) > 0)
        setChecks(preChecks)
        if (r.billerReturnName) setReturnedByName(r.billerReturnName)
      })
      .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
  }, [token])

  const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

  // Sync indeterminate state on select-all checkbox
  useEffect(() => {
    if (!selectAllRef.current) return
    const state = getSelectAllState(checks)
    selectAllRef.current.indeterminate = state === 'some'
  }, [checks])

  // ── Signature canvas setup ────────────────────────────────────────────────
  const BILLER_SIG_HEIGHT = 160
  const setupCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const width = Math.max(rect.width, 280)
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(BILLER_SIG_HEIGHT * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.lineCap = 'round'
  }
  useEffect(() => {
    setupCanvas()
    window.addEventListener('resize', setupCanvas)
    return () => window.removeEventListener('resize', setupCanvas)
  }, [])

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return
    drawing.current = true; canvas.setPointerCapture(e.pointerId)
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const { x, y } = pointerPos(e); ctx.beginPath(); ctx.moveTo(x, y); setHasDrawn(true)
  }
  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const { x, y } = pointerPos(e); ctx.lineTo(x, y); ctx.stroke()
  }
  const endDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return; drawing.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }
  const clearSignature = () => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height); setHasDrawn(false)
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
    // Reset qty when unchecked
    if (!checked) {
      const productId = formLines[index]?.productId
      if (productId) {
        setDamagedQty((q) => ({ ...q, [productId]: '0' }))
        setCollectedQty((q) => ({ ...q, [productId]: '0' }))
      }
    }
  }

  const toggleSelectAll = () => {
    const state = getSelectAllState(checks)
    const next = state === 'all' ? checks.map(() => false) : checks.map(() => true)
    setChecks(next)
    // Reset qtys for unchecked items
    if (state === 'all') {
      const z: Record<string, string> = {}
      for (const l of formLines) z[l.productId] = '0'
      setDamagedQty(z)
      setCollectedQty(z)
    }
  }

  const previewTotals = useMemo(() => {
    if (!data) return { damage: 0, missing: 0, damagedQtyTotal: 0 }
    let damage = 0
    let damagedQtyTotal = 0
    for (const l of formLines) {
      const q = Number(damagedQty[l.productId]) || 0
      const rate = l.parsedRate ?? 0
      damage += rate * q
      damagedQtyTotal += q
    }
    return { damage, missing: 0, damagedQtyTotal }
  }, [data, formLines, damagedQty])

  // Whatever isn't reported as damaged/missing or collected now is still
  // outstanding with the customer — these are the items that need a
  // scheduled return date & time-of-day.
  const pendingSummary = useMemo(() => {
    const lines = formLines
      .map((l) => {
        // collectedQty now stores "pending left with client" directly
        const pending = Number(collectedQty[l.productId]) || 0
        return { productId: l.productId, particulars: l.particulars, sku: l.sku, qty: pending }
      })
      .filter((l) => l.qty > 0)
    const total = lines.reduce((s, l) => s + l.qty, 0)
    return { lines, total }
  }, [formLines, collectedQty])

  const handleSubmit = async () => {
    if (!token || !data) return
    const t = decodeURIComponent(token)
    // collected = dispatched - damaged - pendingLeft
    const damagedLines = formLines.map((l) => ({
      productId: l.productId,
      qty: Number(damagedQty[l.productId]) || 0,
    }))
    const collectedLines = formLines.map((l) => {
      const dispatched = l.qty
      const dmg = Number(damagedQty[l.productId]) || 0
      const pending = Number(collectedQty[l.productId]) || 0 // collectedQty now stores "pending left"
      const collected = Math.max(0, dispatched - dmg - pending)
      return { productId: l.productId, qty: collected }
    })
    setSubmitting(true)
    setError(null)
    try {
      await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
        method: 'POST',
        body: JSON.stringify({
          damagedLines: damagedLines.filter((x) => x.qty > 0),
          collectedLines: collectedLines.filter((x) => x.qty > 0),
          returnedByName: returnedByName.trim() || undefined,
          signature: getSignatureDataUrl(),
        }),
      })
      const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
      setData(refreshed)
      setPhase('thankYou')
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message || 'Submit failed'
      setError(msg)
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
          <LoadingSpinner size="lg" className="text-primary-600" />
          <p className="text-sm">Loading return form…</p>
        </div>
      </div>
    )
  }

  // Reflect the actual reported damaged/missing + collected qty per product
  // (not the originally dispatched qty) so the thank-you page matches what
  // was submitted.
  const reportedQtyByProduct = new Map<string, number>()
  for (const l of data.billerDamagedLines || []) {
    reportedQtyByProduct.set(l.productId, (reportedQtyByProduct.get(l.productId) || 0) + l.qty)
  }
  for (const l of data.billerCollectedLines || []) {
    reportedQtyByProduct.set(l.productId, (reportedQtyByProduct.get(l.productId) || 0) + l.qty)
  }
  // const completionLines = formLines
  //   .map((l) => ({
  //     productId: l.productId,
  //     particulars: l.particulars,
  //     sku: l.sku,
  //     qty: reportedQtyByProduct.get(l.productId) || 0,
  //   }))
  //   .filter((l) => l.qty > 0)

  const damagedQtyTotal = (data.billerDamagedLines || []).reduce((s, l) => s + (Number(l.qty) || 0), 0)
  const pendingLinesDisplay = data.billerPendingReturnLines || []
  const pendingDays = daysWithClient(data.deliveryAt)

  if (phase === 'thankYou') {
    const collectedQtyTotal = (data.billerCollectedLines || []).reduce((s, l) => s + (Number(l.qty) || 0), 0)
    const pendingTotal = pendingLinesDisplay.reduce((s, l) => s + l.qty, 0)

    // Build per-product breakdown using formLines (which always has product names)
    const collectedByProduct = new Map<string, number>()
    for (const l of data.billerCollectedLines || []) collectedByProduct.set(String(l.productId), (collectedByProduct.get(String(l.productId)) || 0) + Number(l.qty))
    const damagedByProduct = new Map<string, number>()
    for (const l of data.billerDamagedLines || []) damagedByProduct.set(String(l.productId), (damagedByProduct.get(String(l.productId)) || 0) + Number(l.qty))
    const pendingByProduct = new Map<string, number>()
    for (const l of pendingLinesDisplay) pendingByProduct.set(String(l.productId), (pendingByProduct.get(String(l.productId)) || 0) + Number(l.qty))

    const returnTable = (
      <div>
        {/* Summary totals */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: 12 }}>
          {[
            { label: 'Collected', value: collectedQtyTotal, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
            { label: 'Damaged/Missing', value: damagedQtyTotal, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
            { label: 'Pending w/ client', value: pendingTotal, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: '10px 8px', textAlign: 'center', background: s.bg, borderRight: i < 2 ? `1px solid ${s.border}` : undefined }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: s.color, marginTop: 3, opacity: 0.8 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Per-product table */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px 60px', padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Product</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Collected</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Dmg/Miss</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Pending</div>
          </div>

          {/* Rows */}
          {formLines.map((l, i) => {
            const collected = collectedByProduct.get(l.productId) || 0
            const damaged = damagedByProduct.get(l.productId) || 0
            const pending = pendingByProduct.get(l.productId) || 0
            return (
              <div key={l.productId} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px 60px', padding: '10px 12px', alignItems: 'center', background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: i < formLines.length - 1 ? '1px solid #f1f5f9' : undefined }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>{l.particulars || l.productId}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{l.sku} · Dispatched {l.qty}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {collected > 0 ? <span style={{ display: 'inline-block', borderRadius: 99, background: '#ecfdf5', color: '#059669', fontSize: 12, fontWeight: 700, padding: '2px 8px' }}>{collected}</span> : <span style={{ color: '#e2e8f0', fontSize: 12 }}>—</span>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {damaged > 0 ? <span style={{ display: 'inline-block', borderRadius: 99, background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 700, padding: '2px 8px' }}>{damaged}</span> : <span style={{ color: '#e2e8f0', fontSize: 12 }}>—</span>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {pending > 0 ? <span style={{ display: 'inline-block', borderRadius: 99, background: '#fffbeb', color: '#d97706', fontSize: 12, fontWeight: 700, padding: '2px 8px' }}>{pending}</span> : <span style={{ color: '#e2e8f0', fontSize: 12 }}>—</span>}
                </div>
              </div>
            )
          })}

          {/* Pending days footer */}
          {pendingTotal > 0 && pendingDays != null && (
            <div style={{ padding: '8px 12px', background: '#fffbeb', borderTop: '1px solid #fde68a', fontSize: 11, fontWeight: 600, color: '#b45309' }}>
              ⏱ {pendingTotal} qty with client for {pendingDays} day{pendingDays === 1 ? '' : 's'} since delivery
            </div>
          )}
        </div>
      </div>
    )

    return (
      <div className={pageShell}>
        <PublicCompletionScreen
          variant="thankYou"
          statusLabel="Submitted"
          title="Thank you!"
          subtitle="Your return report has been submitted successfully."
          deliveryNo={data.deliveryNo}
          customerName={data.customerName}
          meta={[
            { label: 'Challan', value: data.challanNo || '—' },
            { label: 'Site', value: data.siteName || '—' },
            { label: 'Return by', value: data.billerReturnName || data.returnDriverName || data.driverName || '—' },
            { label: 'Submitted on', value: data.billerReturnSubmittedAt ? new Date(data.billerReturnSubmittedAt).toLocaleString() : '—' },
          ]}
          lines={[]}
          completedAt={data.billerReturnSubmittedAt}
          completedAtLabel="Submitted on"
          afterLines={returnTable}
        />
      </div>
    )
  }

  const lineCount = formLines.length
  const checkedCount = checks.filter(Boolean).length
  const selectAllState = getSelectAllState(checks)
  const progressPct = lineCount > 0 ? Math.round((checkedCount / lineCount) * 100) : 0

  return (
    <div className={pageShell}>
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Header card */}
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
          <div className="mt-1 text-sm text-slate-600">
            {data.deliveryNo} · {data.customerName}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
            {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
            {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
            {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
          </div>
          {data.billerReturnSubmittedAt ? (
            <div className="mt-2 text-xs text-emerald-600 font-medium">
              ✓ Previously submitted — you can re-submit to update
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
        ) : null}

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Return reconciliation</CardTitle>
              <span className="text-sm font-medium text-slate-600">
                {checkedCount} of {lineCount} selected
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-primary-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-slate-600">
              Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
            </div>

            {/* Checklist with Select All */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {/* Select all row */}
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

              {/* Per-product rows */}
              <div className="divide-y divide-slate-100">
                {formLines.map((l, i) => (
                  <div
                    key={l.productId}
                    className={`transition-colors ${checks[i] ? 'bg-primary-50/60' : 'hover:bg-slate-50'}`}
                  >
                    {/* Checkbox row */}
                    <label className="flex cursor-pointer items-start gap-3 px-4 py-4">
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
                              {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>

                    {/* Qty inputs — only visible when checked */}
                    {checks[i] && (
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Damage/Missing qty"
                            type="number"
                            min={0}
                            max={l.qty}
                            value={damagedQty[l.productId] ?? '0'}
                            onChange={(e) =>
                              setDamagedQty((q) => ({ ...q, [l.productId]: e.target.value }))
                            }
                          />
                          <Input
                            label="Pending left with client"
                            type="number"
                            min={0}
                            max={l.qty}
                            value={collectedQty[l.productId] ?? '0'}
                            onChange={(e) =>
                              setCollectedQty((q) => ({ ...q, [l.productId]: e.target.value }))
                            }
                          />
                        </div>
                        {(() => {
                          const dmg = Number(damagedQty[l.productId]) || 0
                          const pending = Number(collectedQty[l.productId]) || 0
                          const collected = Math.max(0, l.qty - dmg - pending)
                          return pending > 0 ? (
                            <p className="mt-1.5 text-xs font-medium text-amber-700">
                              {pending} qty still with client · {collected} will be collected back
                            </p>
                          ) : collected > 0 ? (
                            <p className="mt-1.5 text-xs font-medium text-emerald-700">
                              ✓ All {collected} qty being collected
                            </p>
                          ) : null
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
              Damage/Missing qty: {previewTotals.damagedQtyTotal}
            </div>

            {/* Pending items — days with client is computed automatically from the delivery date */}
            {pendingSummary.total > 0 ? (
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <div className="font-semibold text-amber-900">
                  {pendingSummary.total} item(s) still pending return
                </div>
                <ul className="space-y-0.5 text-xs text-amber-800">
                  {pendingSummary.lines.map((l) => (
                    <li key={l.productId}>
                      {l.particulars || l.productId}
                      {l.sku ? ` (${l.sku})` : ''} — qty {l.qty}
                    </li>
                  ))}
                </ul>
                {daysWithClient(data.deliveryAt) != null ? (
                  <p className="text-xs font-medium text-amber-700">
                    With the client for {daysWithClient(data.deliveryAt)} day{daysWithClient(data.deliveryAt) === 1 ? '' : 's'} since delivery
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* Returned by + Signature */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
              <Input
                label="Returned by (name)"
                value={returnedByName}
                onChange={(e) => setReturnedByName(e.target.value)}
                placeholder="Enter your name"
              />
              <div>
                <div className="mb-1 text-sm font-medium text-slate-700">Signature</div>
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    style={{ height: 160 }}
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
            </div>

            <Button
              variant="success"
              className="w-full"
              loading={submitting}
              disabled={submitting}
              onClick={handleSubmit}
            >
              Submit return report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}