// import { useEffect, useMemo, useState } from 'react'
// import { useParams } from 'react-router-dom'
// import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// import { Button } from '../../components/ui/Button'
// import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// import { Input } from '../../components/ui/Input'
// import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// import { apiFetch } from '../../lib/api'
// import { deliveryStatusLabel } from '../../lib/deliveryStatus'

// type Line = {
//   productId: string
//   qty: number
//   particulars?: string
//   sku?: string
//   parsedRate?: number
// }

// type GetRes = {
//   deliveryNo: string
//   customerName: string
//   siteName?: string
//   status: string
//   challanNo?: string
//   lines: Line[]
//   damageTotal?: number
//   missingTotal?: number
//   billerReturnSubmittedAt?: string
//   canSubmit?: boolean
// }

// type Phase = 'form' | 'thankYou' | 'alreadyDone'

// const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

// const BILLER_RETURN_STATUSES = new Set(['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN'])

// function aggregateLines(lines: Line[]): Line[] {
//   const byProduct = new Map<string, Line>()
//   for (const l of lines) {
//     const existing = byProduct.get(l.productId)
//     if (existing) {
//       existing.qty += l.qty
//     } else {
//       byProduct.set(l.productId, { ...l })
//     }
//   }
//   return Array.from(byProduct.values())
// }

// export function PublicBillerReturnPage() {
//   const { token } = useParams()
//   const [data, setData] = useState<GetRes | null>(null)
//   const [phase, setPhase] = useState<Phase>('form')
//   const [error, setError] = useState<string | null>(null)
//   const [damaged, setDamaged] = useState<Record<string, string>>({})
//   const [missing, setMissing] = useState<Record<string, string>>({})
//   const [submitting, setSubmitting] = useState(false)

//   useEffect(() => {
//     if (!token) return
//     const t = decodeURIComponent(token)
//     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
//       .then((r) => {
//         setData(r)
//         setPhase(r.billerReturnSubmittedAt ? 'alreadyDone' : 'form')
//         const z: Record<string, string> = {}
//         for (const l of aggregateLines(r.lines)) {
//           z[l.productId] = '0'
//         }
//         setDamaged({ ...z })
//         setMissing({ ...z })
//       })
//       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
//   }, [token])

//   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

//   const previewTotals = useMemo(() => {
//     if (!data) return { damage: 0, missing: 0 }
//     let damage = 0
//     let miss = 0
//     for (const l of formLines) {
//       const dq = Number(damaged[l.productId]) || 0
//       const mq = Number(missing[l.productId]) || 0
//       const rate = l.parsedRate ?? 0
//       damage += rate * dq
//       miss += rate * mq
//     }
//     return { damage, missing: miss }
//   }, [data, formLines, damaged, missing])

//   const handleSubmit = async () => {
//     if (!token || !data) return
//     const t = decodeURIComponent(token)
//     const damagedLines = formLines.map((l) => ({
//       productId: l.productId,
//       qty: Number(damaged[l.productId]) || 0,
//     }))
//     const missingLines = formLines.map((l) => ({
//       productId: l.productId,
//       qty: Number(missing[l.productId]) || 0,
//     }))
//     setSubmitting(true)
//     setError(null)
//     try {
//       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
//         method: 'POST',
//         body: JSON.stringify({
//           damagedLines: damagedLines.filter((x) => x.qty > 0),
//           missingLines: missingLines.filter((x) => x.qty > 0),
//         }),
//       })
//       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
//       setData(refreshed)
//       setPhase('thankYou')
//     } catch (e: unknown) {
//       const msg = (e as { message?: string })?.message || 'Submit failed'
//       if (msg.toLowerCase().includes('already submitted')) {
//         const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
//         setData(refreshed)
//         setPhase('alreadyDone')
//       } else {
//         setError(msg)
//       }
//     } finally {
//       setSubmitting(false)
//     }
//   }

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
//           <p className="text-sm">Loading return form…</p>
//         </div>
//       </div>
//     )
//   }

//   const completionLines = formLines.map((l) => ({
//     productId: l.productId,
//     particulars: l.particulars,
//     sku: l.sku,
//     qty: l.qty,
//   }))

//   const damageDisplay =
//     data.damageTotal != null ? data.damageTotal.toFixed(2) : previewTotals.damage.toFixed(2)
//   const missingDisplay =
//     data.missingTotal != null ? data.missingTotal.toFixed(2) : previewTotals.missing.toFixed(2)

//   if (phase === 'thankYou' || phase === 'alreadyDone') {
//     const isThankYou = phase === 'thankYou'
//     return (
//       <div className={pageShell}>
//         <PublicCompletionScreen
//           variant={isThankYou ? 'thankYou' : 'alreadyDone'}
//           statusLabel={isThankYou ? 'Submitted' : 'Already submitted'}
//           title={isThankYou ? 'Thank you!' : 'Already submitted'}
//           subtitle={
//             isThankYou
//               ? 'Your return report has been submitted successfully.'
//               : 'This return report was submitted earlier. No further action is needed.'
//           }
//           deliveryNo={data.deliveryNo}
//           customerName={data.customerName}
//           meta={[
//             { label: 'Challan', value: data.challanNo || '—' },
//             { label: 'Site', value: data.siteName || '—' },
//             { label: 'Damage total', value: damageDisplay },
//             { label: 'Missing total', value: missingDisplay },
//           ]}
//           lines={completionLines}
//           completedAt={data.billerReturnSubmittedAt}
//           completedAtLabel="Submitted on"
//         />
//       </div>
//     )
//   }

//   return (
//     <div className={pageShell}>
//       <div className="mx-auto max-w-2xl space-y-4">
//         <div className="text-center">
//           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
//           <div className="mt-1 text-sm text-slate-600">
//             {data.deliveryNo} · {data.customerName}
//           </div>
//         </div>

//         {error ? (
//           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
//         ) : null}

//         <Card>
//           <CardHeader>
//             <CardTitle>Return reconciliation</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="text-sm text-slate-600">
//               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
//             </div>

//             {!data.canSubmit && !BILLER_RETURN_STATUSES.has(data.status) ? (
//               <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-100">
//                 Return report is not available while this delivery is in{' '}
//                 {deliveryStatusLabel(data.status)} status.
//               </div>
//             ) : null}

//             <div className="space-y-4">
//               {formLines.map((l) => (
//                 <div key={l.productId} className="rounded-xl border border-slate-200 bg-white p-3">
//                   <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
//                   <div className="text-xs text-slate-500">
//                     {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
//                   </div>
//                   <div className="mt-2 grid grid-cols-2 gap-2">
//                     <Input
//                       label="Damaged qty"
//                       type="number"
//                       min={0}
//                       max={l.qty}
//                       disabled={!data.canSubmit}
//                       value={damaged[l.productId] ?? '0'}
//                       onChange={(e) => setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))}
//                     />
//                     <Input
//                       label="Missing qty"
//                       type="number"
//                       min={0}
//                       max={l.qty}
//                       disabled={!data.canSubmit}
//                       value={missing[l.productId] ?? '0'}
//                       onChange={(e) => setMissing((d) => ({ ...d, [l.productId]: e.target.value }))}
//                     />
//                   </div>
//                 </div>
//               ))}
//             </div>

//             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
//               Estimated damage: {previewTotals.damage.toFixed(2)} · Estimated missing:{' '}
//               {previewTotals.missing.toFixed(2)} (preview; server confirms on submit)
//             </div>

//             <Button
//               variant="success"
//               className="w-full"
//               loading={submitting}
//               disabled={!data.canSubmit || submitting}
//               onClick={handleSubmit}
//             >
//               Submit return report
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )
// }

import { useEffect, useMemo, useState } from 'react'
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
  billerDamagedLines?: { productId: string; qty: number }[]
  billerMissingLines?: { productId: string; qty: number }[]
  canSubmit?: boolean
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
  const [damaged, setDamaged] = useState<Record<string, string>>({})
  const [missing, setMissing] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return
    const t = decodeURIComponent(token)
    apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
      .then((r) => {
        setData(r)
        setPhase('form')
        // Start with zeros for all products
        const z: Record<string, string> = {}
        for (const l of aggregateLines(r.lines)) {
          z[l.productId] = '0'
        }
        // Pre-fill with previously submitted values if any
        const dmg = { ...z }
        const miss = { ...z }
        if (r.billerDamagedLines) {
          for (const l of r.billerDamagedLines) dmg[l.productId] = String(l.qty)
        }
        if (r.billerMissingLines) {
          for (const l of r.billerMissingLines) miss[l.productId] = String(l.qty)
        }
        setDamaged(dmg)
        setMissing(miss)
      })
      .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
  }, [token])

  const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

  const previewTotals = useMemo(() => {
    if (!data) return { damage: 0, missing: 0 }
    let damage = 0
    let miss = 0
    for (const l of formLines) {
      const dq = Number(damaged[l.productId]) || 0
      const mq = Number(missing[l.productId]) || 0
      const rate = l.parsedRate ?? 0
      damage += rate * dq
      miss += rate * mq
    }
    return { damage, missing: miss }
  }, [data, formLines, damaged, missing])

  const handleSubmit = async () => {
    if (!token || !data) return
    const t = decodeURIComponent(token)
    const damagedLines = formLines.map((l) => ({
      productId: l.productId,
      qty: Number(damaged[l.productId]) || 0,
    }))
    const missingLines = formLines.map((l) => ({
      productId: l.productId,
      qty: Number(missing[l.productId]) || 0,
    }))
    setSubmitting(true)
    setError(null)
    try {
      await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
        method: 'POST',
        body: JSON.stringify({
          damagedLines: damagedLines.filter((x) => x.qty > 0),
          missingLines: missingLines.filter((x) => x.qty > 0),
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

  const completionLines = formLines.map((l) => ({
    productId: l.productId,
    particulars: l.particulars,
    sku: l.sku,
    qty: l.qty,
  }))

  const damageDisplay =
    data.damageTotal != null ? data.damageTotal.toFixed(2) : previewTotals.damage.toFixed(2)
  const missingDisplay =
    data.missingTotal != null ? data.missingTotal.toFixed(2) : previewTotals.missing.toFixed(2)

  if (phase === 'thankYou') {
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
            { label: 'Damage total', value: damageDisplay },
            { label: 'Missing total', value: missingDisplay },
          ]}
          lines={completionLines}
          completedAt={data.billerReturnSubmittedAt}
          completedAtLabel="Submitted on"
        />
      </div>
    )
  }

  return (
    <div className={pageShell}>
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
          <div className="mt-1 text-sm text-slate-600">
            {data.deliveryNo} · {data.customerName}
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
            <CardTitle>Return reconciliation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-slate-600">
              Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
            </div>

            <div className="space-y-4">
              {formLines.map((l) => (
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
                      max={l.qty}
                      value={damaged[l.productId] ?? '0'}
                      onChange={(e) => setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))}
                    />
                    <Input
                      label="Missing qty"
                      type="number"
                      min={0}
                      max={l.qty}
                      value={missing[l.productId] ?? '0'}
                      onChange={(e) => setMissing((d) => ({ ...d, [l.productId]: e.target.value }))}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
              Estimated damage: {previewTotals.damage.toFixed(2)} · Estimated missing:{' '}
              {previewTotals.missing.toFixed(2)} (preview; server confirms on submit)
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