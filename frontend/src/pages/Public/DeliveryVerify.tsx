// import { useCallback, useEffect, useRef, useState } from 'react'
// import { useParams } from 'react-router-dom'
// import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// import { Badge } from '../../components/ui/Badge'
// import { Button } from '../../components/ui/Button'
// import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// import { Input } from '../../components/ui/Input'
// import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// import { apiFetch } from '../../lib/api'

// type Line = {
//   productId: string
//   qty: number
//   particulars?: string
//   sku?: string
//   rate?: string
//   parsedRate?: number
// }

// type GetRes = {
//   deliveryNo: string
//   customerName: string
//   siteName?: string
//   status: string
//   deliveryAt: string
//   vehicleLabel?: string
//   driverName?: string
//   driverPhone?: string
//   lines: Line[]
//   deliveryVerifierName?: string
//   deliveryVerifiedAt?: string
//   hasSignature?: boolean
//   canSubmit?: boolean
// }

// type Phase = 'form' | 'thankYou'
// type SelectAllState = 'all' | 'none' | 'some'

// const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'
// const SIGNATURE_HEIGHT = 160

// function getSelectAllState(checks: boolean[]): SelectAllState {
//   if (checks.length === 0) return 'none'
//   const checked = checks.filter(Boolean).length
//   if (checked === 0) return 'none'
//   if (checked === checks.length) return 'all'
//   return 'some'
// }

// export function PublicDeliveryVerifyPage() {
//   const { token } = useParams()
//   const [data, setData] = useState<GetRes | null>(null)
//   const [phase, setPhase] = useState<Phase>('form')
//   const [error, setError] = useState<string | null>(null)
//   const [verifierName, setVerifierName] = useState('')
//   const [checks, setChecks] = useState<boolean[]>([])
//   const [submitting, setSubmitting] = useState(false)
//   const [hasDrawn, setHasDrawn] = useState(false)
//   const canvasRef = useRef<HTMLCanvasElement | null>(null)
//   const drawing = useRef(false)
//   const selectAllRef = useRef<HTMLInputElement | null>(null)

//   useEffect(() => {
//     if (!token) return
//     const t = decodeURIComponent(token)
//     apiFetch<GetRes>(`/public/delivery-verify/${encodeURIComponent(t)}`)
//       .then((r) => {
//         setData(r)
//         setPhase('form')
//         setChecks(r.lines.map(() => false))
//         if (r.deliveryVerifierName) setVerifierName(r.deliveryVerifierName)
//       })
//       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
//   }, [token])

//   const setupCanvas = useCallback(() => {
//     const canvas = canvasRef.current
//     if (!canvas) return
//     const dpr = window.devicePixelRatio || 1
//     const rect = canvas.getBoundingClientRect()
//     const width = Math.max(rect.width, 280)
//     canvas.width = Math.floor(width * dpr)
//     canvas.height = Math.floor(SIGNATURE_HEIGHT * dpr)
//     const ctx = canvas.getContext('2d')
//     if (!ctx) return
//     ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
//     ctx.strokeStyle = '#0f172a'
//     ctx.lineWidth = 2
//     ctx.lineCap = 'round'
//   }, [])

//   useEffect(() => {
//     if (phase !== 'form') return
//     setupCanvas()
//     const onResize = () => setupCanvas()
//     window.addEventListener('resize', onResize)
//     return () => window.removeEventListener('resize', onResize)
//   }, [phase, setupCanvas])

//   const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
//     const canvas = canvasRef.current
//     if (!canvas) return { x: 0, y: 0 }
//     const rect = canvas.getBoundingClientRect()
//     return { x: e.clientX - rect.left, y: e.clientY - rect.top }
//   }

//   const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
//     const canvas = canvasRef.current
//     if (!canvas) return
//     drawing.current = true
//     canvas.setPointerCapture(e.pointerId)
//     const ctx = canvas.getContext('2d')
//     if (!ctx) return
//     const { x, y } = pointerPos(e)
//     ctx.beginPath()
//     ctx.moveTo(x, y)
//     setHasDrawn(true)
//   }

//   const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
//     if (!drawing.current) return
//     const canvas = canvasRef.current
//     if (!canvas) return
//     const ctx = canvas.getContext('2d')
//     if (!ctx) return
//     const { x, y } = pointerPos(e)
//     ctx.lineTo(x, y)
//     ctx.stroke()
//   }

//   const endDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
//     if (!drawing.current) return
//     drawing.current = false
//     e.currentTarget.releasePointerCapture(e.pointerId)
//   }

//   const clearSignature = () => {
//     const canvas = canvasRef.current
//     if (!canvas) return
//     const ctx = canvas.getContext('2d')
//     if (!ctx) return
//     ctx.clearRect(0, 0, canvas.width, canvas.height)
//     setHasDrawn(false)
//   }

//   const getSignatureDataUrl = () => {
//     const canvas = canvasRef.current
//     if (!canvas || !hasDrawn) return undefined
//     return canvas.toDataURL('image/png')
//   }

//   const toggleLine = (index: number, checked: boolean) => {
//     setChecks((prev) => {
//       const next = [...prev]
//       next[index] = checked
//       return next
//     })
//   }

//   const toggleSelectAll = () => {
//     const state = getSelectAllState(checks)
//     const next = state === 'all' ? checks.map(() => false) : checks.map(() => true)
//     setChecks(next)
//   }

//   const handleSubmit = async () => {
//     if (!token || !data) return
//     const t = decodeURIComponent(token)
//     setSubmitting(true)
//     setError(null)
//     try {
//       await apiFetch(`/public/delivery-verify/${encodeURIComponent(t)}`, {
//         method: 'POST',
//         body: JSON.stringify({
//           verifierName: verifierName.trim(),
//           signature: getSignatureDataUrl(),
//           lineChecks: data.lines.map((l, i) => ({
//             productId: l.productId,
//             ok: !!checks[i],
//             qtyAck: l.qty,
//           })),
//         }),
//       })
//       const refreshed = await apiFetch<GetRes>(`/public/delivery-verify/${encodeURIComponent(t)}`)
//       setData(refreshed)
//       setPhase('thankYou')
//     } catch (e: unknown) {
//       const msg = (e as { message?: string })?.message || 'Submit failed'
//       setError(msg)
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   const lineCount = data?.lines.length ?? 0
//   const checkedCount = checks.filter(Boolean).length
//   const selectAllState = getSelectAllState(checks)
//   const allOk = lineCount > 0 && checks.length === lineCount && checks.every(Boolean)

//   useEffect(() => {
//     const el = selectAllRef.current
//     if (el) el.indeterminate = selectAllState === 'some'
//   }, [selectAllState])

//   if (error && !data) {
//     return (
//       <div className={pageShell}>
//         <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
//           {error}
//         </div>
//       </div>
//     )
//   }

//   if (!data) {
//     return (
//       <div className={pageShell}>
//         <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
//           <LoadingSpinner size="lg" className="text-primary-600" />
//           <p className="text-sm">Loading verification…</p>
//         </div>
//       </div>
//     )
//   }

//   const completionLines = data.lines.map((l) => ({
//     productId: l.productId,
//     particulars: l.particulars,
//     sku: l.sku,
//     qty: l.qty,
//   }))

//   const completionMeta = [
//     { label: 'Site', value: data.siteName || '—' },
//     { label: 'Vehicle', value: data.vehicleLabel || '—' },
//     { label: 'Driver', value: data.driverName || '—' },
//     { label: 'Driver phone', value: data.driverPhone || '—' },
//   ]

//   if (phase === 'thankYou') {
//     return (
//       <div className={pageShell}>
//         <PublicCompletionScreen
//           variant="thankYou"
//           statusLabel="Verified"
//           title="Thank you!"
//           subtitle="Your delivery has been verified successfully."
//           deliveryNo={data.deliveryNo}
//           customerName={data.customerName}
//           meta={completionMeta}
//           lines={completionLines}
//           completedAt={data.deliveryVerifiedAt}
//           verifierName={data.deliveryVerifierName || verifierName.trim() || undefined}
//           hasSignature={data.hasSignature}
//         />
//       </div>
//     )
//   }

//   const progressPct = lineCount > 0 ? Math.round((checkedCount / lineCount) * 100) : 0
//   const submitHints: string[] = []
//   if (!allOk) submitHints.push('Check all items')
//   if (!verifierName.trim()) submitHints.push('Enter your name')
//   const canSubmitForm = allOk && verifierName.trim().length > 0 && !submitting

//   return (
//     <div className={pageShell}>
//       <div className="mx-auto max-w-2xl space-y-4">
//         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
//           <div className="text-lg font-semibold text-slate-900">Delivery verification</div>
//           <div className="mt-1 text-sm text-slate-600">
//             {data.deliveryNo} · {data.customerName}
//           </div>
//           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
//             {data.siteName ? <Badge variant="slate">Site: {data.siteName}</Badge> : null}
//             <Badge variant="slate">Vehicle: {data.vehicleLabel || '—'}</Badge>
//             <Badge variant="slate">Driver: {data.driverName || '—'}</Badge>
//             <Badge variant="slate">Phone: {data.driverPhone || '—'}</Badge>
//           </div>
//           {data.deliveryVerifiedAt ? (
//             <div className="mt-2 text-xs text-emerald-600 font-medium">
//               ✓ Previously verified — you can re-submit to update
//             </div>
//           ) : null}
//         </div>

//         {error ? (
//           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
//         ) : null}

//         <Card className="hover:translate-y-0">
//           <CardHeader>
//             <div className="flex flex-wrap items-center justify-between gap-2">
//               <CardTitle>Checklist</CardTitle>
//               <span className="text-sm font-medium text-slate-600">
//                 {checkedCount} of {lineCount} verified
//               </span>
//             </div>
//             <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
//               <div
//                 className="h-full rounded-full bg-primary-500 transition-all duration-300"
//                 style={{ width: `${progressPct}%` }}
//               />
//             </div>
//           </CardHeader>
//           <CardContent className="space-y-5">
//             <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
//               <label className="flex cursor-pointer items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5">
//                 <input
//                   ref={selectAllRef}
//                   type="checkbox"
//                   className="h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
//                   checked={selectAllState === 'all'}
//                   onChange={toggleSelectAll}
//                 />
//                 <div className="min-w-0 flex-1">
//                   <div className="font-semibold text-slate-900">Select all</div>
//                   <div className="text-xs text-slate-500">
//                     {lineCount} item{lineCount === 1 ? '' : 's'}
//                   </div>
//                 </div>
//               </label>

//               <div className="divide-y divide-slate-100">
//                 {data.lines.map((l, i) => (
//                   <label
//                     key={`line-${i}`}
//                     className={`flex cursor-pointer items-start gap-3 px-4 py-4 transition-colors ${
//                       checks[i] ? 'bg-primary-50/60 hover:bg-primary-50' : 'hover:bg-slate-50'
//                     }`}
//                   >
//                     <input
//                       type="checkbox"
//                       className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
//                       checked={!!checks[i]}
//                       onChange={(e) => toggleLine(i, e.target.checked)}
//                     />
//                     <div className="min-w-0 flex-1">
//                       <div className="flex items-start gap-2">
//                         <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
//                           {i + 1}
//                         </span>
//                         <div className="min-w-0 flex-1">
//                           <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
//                           <div className="text-xs text-slate-500">
//                             {l.sku} · Qty {l.qty}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </label>
//                 ))}
//               </div>
//             </div>

//             <Input
//               label="Verified by (name)"
//               value={verifierName}
//               onChange={(e) => setVerifierName(e.target.value)}
//             />

//             <div>
//               <div className="mb-1 text-sm font-medium text-slate-700">Signature</div>
//               <div className="relative">
//                 <canvas
//                   ref={canvasRef}
//                   style={{ height: SIGNATURE_HEIGHT }}
//                   className="w-full touch-none rounded-xl border border-slate-300 bg-white"
//                   onPointerDown={startDraw}
//                   onPointerMove={draw}
//                   onPointerUp={endDraw}
//                   onPointerLeave={endDraw}
//                   onPointerCancel={endDraw}
//                 />
//                 {!hasDrawn ? (
//                   <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl">
//                     <span className="text-sm text-slate-400">Sign here</span>
//                   </div>
//                 ) : null}
//               </div>
//               <Button variant="secondary" size="sm" className="mt-2" onClick={clearSignature}>
//                 Clear signature
//               </Button>
//             </div>

//             <div className="space-y-2">
//               <Button
//                 variant="success"
//                 className="w-full"
//                 loading={submitting}
//                 disabled={!canSubmitForm}
//                 onClick={handleSubmit}
//               >
//                 Confirm verification
//               </Button>
//               {submitHints.length > 0 ? (
//                 <p className="text-center text-xs text-slate-500">Required: {submitHints.join(' · ')}</p>
//               ) : null}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )
// }

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
  deliveryLineChecks?: { productId: string; qtyAck?: number; ok?: boolean }[]
  hasSignature?: boolean
  deliverySignature?: string
  billingType?: 'FREE' | 'INVOICE'
  invoiceNo?: string
  invoiceAmount?: string
  billedAt?: string
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
  // Delivered qty per line (indexed to match data.lines / checks). Defaults
  // to the full dispatched qty; if the recipient enters fewer, the shortfall
  // is treated as an immediate on-the-spot return and restocked right away.
  const [deliveredQty, setDeliveredQty] = useState<string[]>([])
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
        setChecks(r.lines.map(() => false))
        setDeliveredQty(
          r.lines.map((l, i) => {
            const prev = r.deliveryLineChecks?.[i]
            const prevQty = prev && prev.productId === l.productId && prev.qtyAck != null ? prev.qtyAck : l.qty
            return String(prevQty)
          }),
        )
        if (r.deliveryVerifierName) setVerifierName(r.deliveryVerifierName)
        setPhase(r.canSubmit === false ? 'thankYou' : 'form')
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
    if (!checked) {
      setDeliveredQty((prev) => {
        const next = [...prev]
        const line = data?.lines[index]
        if (line) next[index] = String(line.qty)
        return next
      })
    }
  }

  const setLineDeliveredQty = (index: number, value: string) => {
    setDeliveredQty((prev) => {
      const next = [...prev]
      next[index] = value
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
      const res = await apiFetch<{ ok: boolean; deliveryVerifiedAt?: string; deliverySignature?: string }>(
        `/public/delivery-verify/${encodeURIComponent(t)}`,
        {
          method: 'POST',
          body: JSON.stringify({
            verifierName: verifierName.trim(),
            signature: getSignatureDataUrl(),
            lineChecks: data.lines.map((l, i) => ({
              productId: l.productId,
              ok: !!checks[i],
              qtyAck: Math.max(0, Math.min(l.qty, Number(deliveredQty[i]) || 0)),
            })),
          }),
        },
      )
      setData({
        ...data,
        status: 'DELIVERED',
        deliveryVerifierName: verifierName.trim(),
        deliveryVerifiedAt: res.deliveryVerifiedAt || new Date().toISOString(),
        deliverySignature: res.deliverySignature || data.deliverySignature,
        hasSignature: Boolean(res.deliverySignature || data.deliverySignature),
        deliveryLineChecks: data.lines.map((l, i) => ({
          productId: l.productId,
          ok: !!checks[i],
          qtyAck: Math.max(0, Math.min(l.qty, Number(deliveredQty[i]) || 0)),
        })),
      })
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

  const completionMeta = [
    { label: 'Site', value: data.siteName || '—' },
    { label: 'Vehicle', value: data.vehicleLabel || '—' },
    { label: 'Driver', value: data.driverName || '—' },
    { label: 'Driver phone', value: data.driverPhone || '—' },
    ...(data.billingType
      ? [{
          label: 'Billing',
          value: data.billingType === 'FREE' ? 'Billed Free' : `Invoice ${data.invoiceNo || ''}`.trim(),
        }]
      : []),
  ]

  if (phase === 'thankYou') {
    const deliveredByProduct = new Map<string, number>()
    const dispatchedByProduct = new Map<string, number>()
    for (const l of data.lines) {
      dispatchedByProduct.set(l.productId, (dispatchedByProduct.get(l.productId) || 0) + (Number(l.qty) || 0))
    }
    for (let i = 0; i < data.lines.length; i++) {
      const l = data.lines[i]
      const check = data.deliveryLineChecks?.[i]
      const delivered = check?.qtyAck != null ? Number(check.qtyAck) : l.qty
      deliveredByProduct.set(l.productId, (deliveredByProduct.get(l.productId) || 0) + delivered)
    }

    const productRows = Array.from(dispatchedByProduct.keys()).map((productId) => {
      const line = data.lines.find((l) => l.productId === productId)
      const dispatched = dispatchedByProduct.get(productId) || 0
      const delivered = Math.min(dispatched, deliveredByProduct.get(productId) || 0)
      const immediateReturn = Math.max(0, dispatched - delivered)
      return {
        productId,
        particulars: line?.particulars,
        sku: line?.sku,
        dispatched,
        delivered,
        immediateReturn,
      }
    })
    const deliveredTotal = productRows.reduce((s, r) => s + r.delivered, 0)
    const immediateReturnTotal = productRows.reduce((s, r) => s + r.immediateReturn, 0)

    const deliveryTable = (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: 12 }}>
          {[
            { label: 'Delivered', value: deliveredTotal, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
            { label: 'Immediate return', value: immediateReturnTotal, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: '10px 8px', textAlign: 'center', background: s.bg, borderRight: i < 1 ? `1px solid ${s.border}` : undefined }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: s.color, marginTop: 3, opacity: 0.8 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px', padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Product</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Delivered</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Immediate return</div>
          </div>
          {productRows.map((r, i) => (
            <div key={r.productId} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px', padding: '10px 12px', alignItems: 'center', background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: i < productRows.length - 1 ? '1px solid #f1f5f9' : undefined }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>{r.particulars || r.productId}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{r.sku} · Dispatched {r.dispatched}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'inline-block', borderRadius: 99, background: '#ecfdf5', color: '#059669', fontSize: 12, fontWeight: 700, padding: '2px 8px' }}>{r.delivered}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                {r.immediateReturn > 0 ? <span style={{ display: 'inline-block', borderRadius: 99, background: '#fffbeb', color: '#d97706', fontSize: 12, fontWeight: 700, padding: '2px 8px' }}>{r.immediateReturn}</span> : <span style={{ color: '#e2e8f0', fontSize: 12 }}>—</span>}
              </div>
            </div>
          ))}
          {immediateReturnTotal > 0 ? (
            <div style={{ padding: '8px 12px', background: '#fffbeb', borderTop: '1px solid #fde68a', fontSize: 11, fontWeight: 600, color: '#b45309' }}>
              ⏱ {immediateReturnTotal} qty short-delivered — restocked to godown; ordered qty reduced to match
            </div>
          ) : null}
        </div>
      </div>
    )

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
          lines={[]}
          completedAt={data.deliveryVerifiedAt}
          verifierName={data.deliveryVerifierName || verifierName.trim() || undefined}
          hasSignature={data.hasSignature}
          signatureUrl={data.deliverySignature}
          afterLines={deliveryTable}
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
                {data.lines.map((l, i) => {
                  const dQty = Math.max(0, Math.min(l.qty, Number(deliveredQty[i]) || 0))
                  const immediateReturn = Math.max(0, l.qty - dQty)
                  return (
                    <div
                      key={`line-${i}`}
                      className={`transition-colors ${
                        checks[i] ? 'bg-primary-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
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
                                {l.sku} · Qty {l.qty}
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>

                      {checks[i] ? (
                        <div className="px-4 pb-4">
                          <Input
                            label="Delivered qty"
                            type="number"
                            min={0}
                            max={l.qty}
                            value={deliveredQty[i] ?? String(l.qty)}
                            onChange={(e) => setLineDeliveredQty(i, e.target.value)}
                          />
                          {immediateReturn > 0 ? (
                            <p className="mt-1.5 text-xs font-medium text-amber-700">
                              {immediateReturn} qty short — restocked to godown; ordered qty becomes {dQty}
                            </p>
                          ) : (
                            <p className="mt-1.5 text-xs font-medium text-emerald-700">
                              ✓ Full qty delivered
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
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