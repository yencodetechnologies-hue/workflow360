// // // // // import { useEffect, useMemo, useState } from 'react'
// // // // // import { useParams } from 'react-router-dom'
// // // // // import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// // // // // import { Button } from '../../components/ui/Button'
// // // // // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // // // // import { Input } from '../../components/ui/Input'
// // // // // import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// // // // // import { apiFetch } from '../../lib/api'

// // // // // type Line = {
// // // // //   productId: string
// // // // //   qty: number
// // // // //   particulars?: string
// // // // //   sku?: string
// // // // //   parsedRate?: number
// // // // // }

// // // // // type GetRes = {
// // // // //   deliveryNo: string
// // // // //   customerName: string
// // // // //   siteName?: string
// // // // //   status: string
// // // // //   challanNo?: string
// // // // //   vehicleLabel?: string
// // // // //   driverName?: string
// // // // //   driverPhone?: string
// // // // //   lines: Line[]
// // // // //   damageTotal?: number
// // // // //   missingTotal?: number
// // // // //   billerReturnSubmittedAt?: string
// // // // //   billerDamagedLines?: { productId: string; qty: number }[]
// // // // //   billerMissingLines?: { productId: string; qty: number }[]
// // // // //   canSubmit?: boolean
// // // // // }

// // // // // type Phase = 'form' | 'thankYou'

// // // // // const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

// // // // // function aggregateLines(lines: Line[]): Line[] {
// // // // //   const byProduct = new Map<string, Line>()
// // // // //   for (const l of lines) {
// // // // //     const existing = byProduct.get(l.productId)
// // // // //     if (existing) {
// // // // //       existing.qty += l.qty
// // // // //     } else {
// // // // //       byProduct.set(l.productId, { ...l })
// // // // //     }
// // // // //   }
// // // // //   return Array.from(byProduct.values())
// // // // // }

// // // // // export function PublicBillerReturnPage() {
// // // // //   const { token } = useParams()
// // // // //   const [data, setData] = useState<GetRes | null>(null)
// // // // //   console.log("datauuu",data);
  
// // // // //   const [phase, setPhase] = useState<Phase>('form')
// // // // //   const [error, setError] = useState<string | null>(null)
// // // // //   const [damaged, setDamaged] = useState<Record<string, string>>({})
// // // // //   const [missing, setMissing] = useState<Record<string, string>>({})
// // // // //   const [submitting, setSubmitting] = useState(false)

// // // // //   useEffect(() => {
// // // // //     if (!token) return
// // // // //     const t = decodeURIComponent(token)
// // // // //     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // // // //       .then((r) => {
// // // // //         setData(r)
// // // // //         setPhase('form')
// // // // //         // Start with zeros for all products
// // // // //         const z: Record<string, string> = {}
// // // // //         for (const l of aggregateLines(r.lines)) {
// // // // //           z[l.productId] = '0'
// // // // //         }
// // // // //         // Pre-fill with previously submitted values if any
// // // // //         const dmg = { ...z }
// // // // //         const miss = { ...z }
// // // // //         if (r.billerDamagedLines) {
// // // // //           for (const l of r.billerDamagedLines) dmg[l.productId] = String(l.qty)
// // // // //         }
// // // // //         if (r.billerMissingLines) {
// // // // //           for (const l of r.billerMissingLines) miss[l.productId] = String(l.qty)
// // // // //         }
// // // // //         setDamaged(dmg)
// // // // //         setMissing(miss)
// // // // //       })
// // // // //       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
// // // // //   }, [token])

// // // // //   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

// // // // //   const previewTotals = useMemo(() => {
// // // // //     if (!data) return { damage: 0, missing: 0 }
// // // // //     let damage = 0
// // // // //     let miss = 0
// // // // //     for (const l of formLines) {
// // // // //       const dq = Number(damaged[l.productId]) || 0
// // // // //       const mq = Number(missing[l.productId]) || 0
// // // // //       const rate = l.parsedRate ?? 0
// // // // //       damage += rate * dq
// // // // //       miss += rate * mq
// // // // //     }
// // // // //     return { damage, missing: miss }
// // // // //   }, [data, formLines, damaged, missing])

// // // // //   const handleSubmit = async () => {
// // // // //     if (!token || !data) return
// // // // //     const t = decodeURIComponent(token)
// // // // //     const damagedLines = formLines.map((l) => ({
// // // // //       productId: l.productId,
// // // // //       qty: Number(damaged[l.productId]) || 0,
// // // // //     }))
// // // // //     const missingLines = formLines.map((l) => ({
// // // // //       productId: l.productId,
// // // // //       qty: Number(missing[l.productId]) || 0,
// // // // //     }))
// // // // //     setSubmitting(true)
// // // // //     setError(null)
// // // // //     try {
// // // // //       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
// // // // //         method: 'POST',
// // // // //         body: JSON.stringify({
// // // // //           damagedLines: damagedLines.filter((x) => x.qty > 0),
// // // // //           missingLines: missingLines.filter((x) => x.qty > 0),
// // // // //         }),
// // // // //       })
// // // // //       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // // // //       setData(refreshed)
// // // // //       setPhase('thankYou')
// // // // //     } catch (e: unknown) {
// // // // //       const msg = (e as { message?: string })?.message || 'Submit failed'
// // // // //       setError(msg)
// // // // //     } finally {
// // // // //       setSubmitting(false)
// // // // //     }
// // // // //   }

// // // // //   if (error && !data) {
// // // // //     return (
// // // // //       <div className={pageShell}>
// // // // //         <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
// // // // //           {error}
// // // // //         </div>
// // // // //       </div>
// // // // //     )
// // // // //   }

// // // // //   if (!data) {
// // // // //     return (
// // // // //       <div className={pageShell}>
// // // // //         <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
// // // // //           <LoadingSpinner size="lg" className="text-primary-600" />
// // // // //           <p className="text-sm">Loading return form…</p>
// // // // //         </div>
// // // // //       </div>
// // // // //     )
// // // // //   }

// // // // //   const completionLines = formLines.map((l) => ({
// // // // //     productId: l.productId,
// // // // //     particulars: l.particulars,
// // // // //     sku: l.sku,
// // // // //     qty: l.qty,
// // // // //   }))

// // // // //   const damageDisplay =
// // // // //     data.damageTotal != null ? data.damageTotal.toFixed(2) : previewTotals.damage.toFixed(2)
// // // // //   const missingDisplay =
// // // // //     data.missingTotal != null ? data.missingTotal.toFixed(2) : previewTotals.missing.toFixed(2)

// // // // //   if (phase === 'thankYou') {
// // // // //     return (
// // // // //       <div className={pageShell}>
// // // // //         <PublicCompletionScreen
// // // // //           variant="thankYou"
// // // // //           statusLabel="Submitted"
// // // // //           title="Thank you!"
// // // // //           subtitle="Your return report has been submitted successfully."
// // // // //           deliveryNo={data.deliveryNo}
// // // // //           customerName={data.customerName}
// // // // //           meta={[
// // // // //             { label: 'Challan', value: data.challanNo || '—' },
// // // // //             { label: 'Site', value: data.siteName || '—' },
// // // // //             { label: 'Damage total', value: damageDisplay },
// // // // //             { label: 'Missing total', value: missingDisplay },
// // // // //           ]}
// // // // //           lines={completionLines}
// // // // //           completedAt={data.billerReturnSubmittedAt}
// // // // //           completedAtLabel="Submitted on"
// // // // //         />
// // // // //       </div>
// // // // //     )
// // // // //   }

// // // // //   return (
// // // // //     <div className={pageShell}>
// // // // //       <div className="mx-auto max-w-2xl space-y-4">
// // // // //         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
// // // // //           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
// // // // //           <div className="mt-1 text-sm text-slate-600">
// // // // //             {data.deliveryNo} · {data.customerName}
// // // // //           </div>
// // // // //           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
// // // // //             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
// // // // //             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
// // // // //             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
// // // // //             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
// // // // //           </div>
// // // // //           {data.billerReturnSubmittedAt ? (
// // // // //             <div className="mt-2 text-xs text-emerald-600 font-medium">
// // // // //               ✓ Previously submitted — you can re-submit to update
// // // // //             </div>
// // // // //           ) : null}
// // // // //         </div>

// // // // //         {error ? (
// // // // //           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
// // // // //         ) : null}

// // // // //         <Card>
// // // // //           <CardHeader>
// // // // //             <CardTitle>Return reconciliation</CardTitle>
// // // // //           </CardHeader>
// // // // //           <CardContent className="space-y-4">
// // // // //             <div className="text-sm text-slate-600">
// // // // //               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
// // // // //             </div>

// // // // //             <div className="space-y-4">
// // // // //               {formLines.map((l) => (
// // // // //                 <div key={l.productId} className="rounded-xl border border-slate-200 bg-white p-3">
// // // // //                   <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
// // // // //                   <div className="text-xs text-slate-500">
// // // // //                     {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
// // // // //                   </div>
// // // // //                   <div className="mt-2">
// // // // //                     <Input
// // // // //                       label="Return qty (damaged / missing)"
// // // // //                       type="number"
// // // // //                       min={0}
// // // // //                       max={l.qty}
// // // // //                       value={damaged[l.productId] ?? '0'}
// // // // //                       onChange={(e) => setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))}
// // // // //                     />
// // // // //                   </div>
// // // // //                 </div>
// // // // //               ))}
// // // // //             </div>

// // // // //             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
// // // // //               Estimated damage: {previewTotals.damage.toFixed(2)} · Estimated missing:{' '}
// // // // //               {previewTotals.missing.toFixed(2)} (preview; server confirms on submit)
// // // // //             </div>

// // // // //             <Button
// // // // //               variant="success"
// // // // //               className="w-full"
// // // // //               loading={submitting}
// // // // //               disabled={submitting}
// // // // //               onClick={handleSubmit}
// // // // //             >
// // // // //               Submit return report
// // // // //             </Button>
// // // // //           </CardContent>
// // // // //         </Card>
// // // // //       </div>
// // // // //     </div>
// // // // //   )
// // // // // }

// // // // import { useEffect, useMemo, useRef, useState } from 'react'
// // // // import { useParams } from 'react-router-dom'
// // // // import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// // // // import { Button } from '../../components/ui/Button'
// // // // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // // // import { Input } from '../../components/ui/Input'
// // // // import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// // // // import { apiFetch } from '../../lib/api'

// // // // type Line = {
// // // //   productId: string
// // // //   qty: number
// // // //   particulars?: string
// // // //   sku?: string
// // // //   parsedRate?: number
// // // // }

// // // // type GetRes = {
// // // //   deliveryNo: string
// // // //   customerName: string
// // // //   siteName?: string
// // // //   status: string
// // // //   challanNo?: string
// // // //   vehicleLabel?: string
// // // //   driverName?: string
// // // //   driverPhone?: string
// // // //   lines: Line[]
// // // //   damageTotal?: number
// // // //   missingTotal?: number
// // // //   billerReturnSubmittedAt?: string
// // // //   billerDamagedLines?: { productId: string; qty: number }[]
// // // //   billerMissingLines?: { productId: string; qty: number }[]
// // // //   canSubmit?: boolean
// // // // }

// // // // type SelectAllState = 'none' | 'some' | 'all'

// // // // function getSelectAllState(checks: boolean[]): SelectAllState {
// // // //   if (checks.length === 0) return 'none'
// // // //   const checked = checks.filter(Boolean).length
// // // //   if (checked === 0) return 'none'
// // // //   if (checked === checks.length) return 'all'
// // // //   return 'some'
// // // // }

// // // // type Phase = 'form' | 'thankYou'

// // // // const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

// // // // function aggregateLines(lines: Line[]): Line[] {
// // // //   const byProduct = new Map<string, Line>()
// // // //   for (const l of lines) {
// // // //     const existing = byProduct.get(l.productId)
// // // //     if (existing) {
// // // //       existing.qty += l.qty
// // // //     } else {
// // // //       byProduct.set(l.productId, { ...l })
// // // //     }
// // // //   }
// // // //   return Array.from(byProduct.values())
// // // // }

// // // // export function PublicBillerReturnPage() {
// // // //   const { token } = useParams()
// // // //   const [data, setData] = useState<GetRes | null>(null)
// // // //   const [phase, setPhase] = useState<Phase>('form')
// // // //   const [error, setError] = useState<string | null>(null)
// // // //   const [checks, setChecks] = useState<boolean[]>([])
// // // //   const [damaged, setDamaged] = useState<Record<string, string>>({})
// // // //   const [missing, setMissing] = useState<Record<string, string>>({})
// // // //   const [submitting, setSubmitting] = useState(false)
// // // //   const selectAllRef = useRef<HTMLInputElement>(null)

// // // //   useEffect(() => {
// // // //     if (!token) return
// // // //     const t = decodeURIComponent(token)
// // // //     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // // //       .then((r) => {
// // // //         setData(r)
// // // //         setPhase('form')
// // // //         const agg = aggregateLines(r.lines)
// // // //         const z: Record<string, string> = {}
// // // //         for (const l of agg) z[l.productId] = '0'

// // // //         const dmg = { ...z }
// // // //         const miss = { ...z }
// // // //         if (r.billerDamagedLines) {
// // // //           for (const l of r.billerDamagedLines) dmg[l.productId] = String(l.qty)
// // // //         }
// // // //         if (r.billerMissingLines) {
// // // //           for (const l of r.billerMissingLines) miss[l.productId] = String(l.qty)
// // // //         }
// // // //         setDamaged(dmg)
// // // //         setMissing(miss)

// // // //         // Pre-check products that already have a qty entered
// // // //         const preChecks = agg.map(
// // // //           (l) => Number(dmg[l.productId]) > 0 || Number(miss[l.productId]) > 0
// // // //         )
// // // //         setChecks(preChecks)
// // // //       })
// // // //       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
// // // //   }, [token])

// // // //   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

// // // //   // Sync indeterminate state on select-all checkbox
// // // //   useEffect(() => {
// // // //     if (!selectAllRef.current) return
// // // //     const state = getSelectAllState(checks)
// // // //     selectAllRef.current.indeterminate = state === 'some'
// // // //   }, [checks])

// // // //   const toggleLine = (index: number, checked: boolean) => {
// // // //     setChecks((prev) => {
// // // //       const next = [...prev]
// // // //       next[index] = checked
// // // //       return next
// // // //     })
// // // //     // Reset qty when unchecked
// // // //     if (!checked) {
// // // //       const productId = formLines[index]?.productId
// // // //       if (productId) {
// // // //         setDamaged((d) => ({ ...d, [productId]: '0' }))
// // // //         setMissing((m) => ({ ...m, [productId]: '0' }))
// // // //       }
// // // //     }
// // // //   }

// // // //   const toggleSelectAll = () => {
// // // //     const state = getSelectAllState(checks)
// // // //     const next = state === 'all' ? checks.map(() => false) : checks.map(() => true)
// // // //     setChecks(next)
// // // //     // Reset qtys for unchecked items
// // // //     if (state === 'all') {
// // // //       const z: Record<string, string> = {}
// // // //       for (const l of formLines) z[l.productId] = '0'
// // // //       setDamaged(z)
// // // //       setMissing(z)
// // // //     }
// // // //   }

// // // //   const previewTotals = useMemo(() => {
// // // //     if (!data) return { damage: 0, missing: 0 }
// // // //     let damage = 0
// // // //     let miss = 0
// // // //     for (const l of formLines) {
// // // //       const dq = Number(damaged[l.productId]) || 0
// // // //       const mq = Number(missing[l.productId]) || 0
// // // //       const rate = l.parsedRate ?? 0
// // // //       damage += rate * dq
// // // //       miss += rate * mq
// // // //     }
// // // //     return { damage, missing: miss }
// // // //   }, [data, formLines, damaged, missing])

// // // //   const handleSubmit = async () => {
// // // //     if (!token || !data) return
// // // //     const t = decodeURIComponent(token)
// // // //     const damagedLines = formLines.map((l) => ({
// // // //       productId: l.productId,
// // // //       qty: Number(damaged[l.productId]) || 0,
// // // //     }))
// // // //     const missingLines = formLines.map((l) => ({
// // // //       productId: l.productId,
// // // //       qty: Number(missing[l.productId]) || 0,
// // // //     }))
// // // //     setSubmitting(true)
// // // //     setError(null)
// // // //     try {
// // // //       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
// // // //         method: 'POST',
// // // //         body: JSON.stringify({
// // // //           damagedLines: damagedLines.filter((x) => x.qty > 0),
// // // //           missingLines: missingLines.filter((x) => x.qty > 0),
// // // //         }),
// // // //       })
// // // //       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // // //       setData(refreshed)
// // // //       setPhase('thankYou')
// // // //     } catch (e: unknown) {
// // // //       const msg = (e as { message?: string })?.message || 'Submit failed'
// // // //       setError(msg)
// // // //     } finally {
// // // //       setSubmitting(false)
// // // //     }
// // // //   }

// // // //   if (error && !data) {
// // // //     return (
// // // //       <div className={pageShell}>
// // // //         <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
// // // //           {error}
// // // //         </div>
// // // //       </div>
// // // //     )
// // // //   }

// // // //   if (!data) {
// // // //     return (
// // // //       <div className={pageShell}>
// // // //         <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
// // // //           <LoadingSpinner size="lg" className="text-primary-600" />
// // // //           <p className="text-sm">Loading return form…</p>
// // // //         </div>
// // // //       </div>
// // // //     )
// // // //   }

// // // //   const completionLines = formLines.map((l) => ({
// // // //     productId: l.productId,
// // // //     particulars: l.particulars,
// // // //     sku: l.sku,
// // // //     qty: l.qty,
// // // //   }))

// // // //   const damageDisplay =
// // // //     data.damageTotal != null ? data.damageTotal.toFixed(2) : previewTotals.damage.toFixed(2)
// // // //   const missingDisplay =
// // // //     data.missingTotal != null ? data.missingTotal.toFixed(2) : previewTotals.missing.toFixed(2)

// // // //   if (phase === 'thankYou') {
// // // //     return (
// // // //       <div className={pageShell}>
// // // //         <PublicCompletionScreen
// // // //           variant="thankYou"
// // // //           statusLabel="Submitted"
// // // //           title="Thank you!"
// // // //           subtitle="Your return report has been submitted successfully."
// // // //           deliveryNo={data.deliveryNo}
// // // //           customerName={data.customerName}
// // // //           meta={[
// // // //             { label: 'Challan', value: data.challanNo || '—' },
// // // //             { label: 'Site', value: data.siteName || '—' },
// // // //             { label: 'Damage total', value: damageDisplay },
// // // //             { label: 'Missing total', value: missingDisplay },
// // // //           ]}
// // // //           lines={completionLines}
// // // //           completedAt={data.billerReturnSubmittedAt}
// // // //           completedAtLabel="Submitted on"
// // // //         />
// // // //       </div>
// // // //     )
// // // //   }

// // // //   const lineCount = formLines.length
// // // //   const checkedCount = checks.filter(Boolean).length
// // // //   const selectAllState = getSelectAllState(checks)
// // // //   const progressPct = lineCount > 0 ? Math.round((checkedCount / lineCount) * 100) : 0

// // // //   return (
// // // //     <div className={pageShell}>
// // // //       <div className="mx-auto max-w-2xl space-y-4">
// // // //         {/* Header card */}
// // // //         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
// // // //           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
// // // //           <div className="mt-1 text-sm text-slate-600">
// // // //             {data.deliveryNo} · {data.customerName}
// // // //           </div>
// // // //           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
// // // //             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
// // // //             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
// // // //             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
// // // //             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
// // // //           </div>
// // // //           {data.billerReturnSubmittedAt ? (
// // // //             <div className="mt-2 text-xs text-emerald-600 font-medium">
// // // //               ✓ Previously submitted — you can re-submit to update
// // // //             </div>
// // // //           ) : null}
// // // //         </div>

// // // //         {error ? (
// // // //           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
// // // //         ) : null}

// // // //         <Card>
// // // //           <CardHeader>
// // // //             <div className="flex flex-wrap items-center justify-between gap-2">
// // // //               <CardTitle>Return reconciliation</CardTitle>
// // // //               <span className="text-sm font-medium text-slate-600">
// // // //                 {checkedCount} of {lineCount} selected
// // // //               </span>
// // // //             </div>
// // // //             {/* Progress bar */}
// // // //             <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
// // // //               <div
// // // //                 className="h-full rounded-full bg-primary-500 transition-all duration-300"
// // // //                 style={{ width: `${progressPct}%` }}
// // // //               />
// // // //             </div>
// // // //           </CardHeader>
// // // //           <CardContent className="space-y-4">
// // // //             <div className="text-sm text-slate-600">
// // // //               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
// // // //             </div>

// // // //             {/* Checklist with Select All */}
// // // //             <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
// // // //               {/* Select all row */}
// // // //               <label className="flex cursor-pointer items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5">
// // // //                 <input
// // // //                   ref={selectAllRef}
// // // //                   type="checkbox"
// // // //                   className="h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
// // // //                   checked={selectAllState === 'all'}
// // // //                   onChange={toggleSelectAll}
// // // //                 />
// // // //                 <div className="min-w-0 flex-1">
// // // //                   <div className="font-semibold text-slate-900">Select all</div>
// // // //                   <div className="text-xs text-slate-500">
// // // //                     {lineCount} item{lineCount === 1 ? '' : 's'}
// // // //                   </div>
// // // //                 </div>
// // // //               </label>

// // // //               {/* Per-product rows */}
// // // //               <div className="divide-y divide-slate-100">
// // // //                 {formLines.map((l, i) => (
// // // //                   <div
// // // //                     key={l.productId}
// // // //                     className={`transition-colors ${checks[i] ? 'bg-primary-50/60' : 'hover:bg-slate-50'}`}
// // // //                   >
// // // //                     {/* Checkbox row */}
// // // //                     <label className="flex cursor-pointer items-start gap-3 px-4 py-4">
// // // //                       <input
// // // //                         type="checkbox"
// // // //                         className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
// // // //                         checked={!!checks[i]}
// // // //                         onChange={(e) => toggleLine(i, e.target.checked)}
// // // //                       />
// // // //                       <div className="min-w-0 flex-1">
// // // //                         <div className="flex items-start gap-2">
// // // //                           <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
// // // //                             {i + 1}
// // // //                           </span>
// // // //                           <div className="min-w-0 flex-1">
// // // //                             <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
// // // //                             <div className="text-xs text-slate-500">
// // // //                               {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
// // // //                             </div>
// // // //                           </div>
// // // //                         </div>
// // // //                       </div>
// // // //                     </label>

// // // //                     {/* Qty input — only visible when checked */}
// // // //                     {checks[i] && (
// // // //                       <div className="px-4 pb-4">
// // // //                         <Input
// // // //                           label="Return qty (damaged / missing)"
// // // //                           type="number"
// // // //                           min={0}
// // // //                           max={l.qty}
// // // //                           value={damaged[l.productId] ?? '0'}
// // // //                           onChange={(e) =>
// // // //                             setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))
// // // //                           }
// // // //                         />
// // // //                       </div>
// // // //                     )}
// // // //                   </div>
// // // //                 ))}
// // // //               </div>
// // // //             </div>

// // // //             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
// // // //               Estimated damage: {previewTotals.damage.toFixed(2)} · Estimated missing:{' '}
// // // //               {previewTotals.missing.toFixed(2)} (preview; server confirms on submit)
// // // //             </div>

// // // //             <Button
// // // //               variant="success"
// // // //               className="w-full"
// // // //               loading={submitting}
// // // //               disabled={submitting}
// // // //               onClick={handleSubmit}
// // // //             >
// // // //               Submit return report
// // // //             </Button>
// // // //           </CardContent>
// // // //         </Card>
// // // //       </div>
// // // //     </div>
// // // //   )
// // // // }

// // // // import { useEffect, useMemo, useState } from 'react'
// // // // import { useParams } from 'react-router-dom'
// // // // import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// // // // import { Button } from '../../components/ui/Button'
// // // // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // // // import { Input } from '../../components/ui/Input'
// // // // import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// // // // import { apiFetch } from '../../lib/api'

// // // // type Line = {
// // // //   productId: string
// // // //   qty: number
// // // //   particulars?: string
// // // //   sku?: string
// // // //   parsedRate?: number
// // // // }

// // // // type GetRes = {
// // // //   deliveryNo: string
// // // //   customerName: string
// // // //   siteName?: string
// // // //   status: string
// // // //   challanNo?: string
// // // //   vehicleLabel?: string
// // // //   driverName?: string
// // // //   driverPhone?: string
// // // //   lines: Line[]
// // // //   damageTotal?: number
// // // //   missingTotal?: number
// // // //   billerReturnSubmittedAt?: string
// // // //   billerDamagedLines?: { productId: string; qty: number }[]
// // // //   billerMissingLines?: { productId: string; qty: number }[]
// // // //   canSubmit?: boolean
// // // // }

// // // // type Phase = 'form' | 'thankYou'

// // // // const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

// // // // function aggregateLines(lines: Line[]): Line[] {
// // // //   const byProduct = new Map<string, Line>()
// // // //   for (const l of lines) {
// // // //     const existing = byProduct.get(l.productId)
// // // //     if (existing) {
// // // //       existing.qty += l.qty
// // // //     } else {
// // // //       byProduct.set(l.productId, { ...l })
// // // //     }
// // // //   }
// // // //   return Array.from(byProduct.values())
// // // // }

// // // // export function PublicBillerReturnPage() {
// // // //   const { token } = useParams()
// // // //   const [data, setData] = useState<GetRes | null>(null)
// // // //   console.log("datauuu",data);
  
// // // //   const [phase, setPhase] = useState<Phase>('form')
// // // //   const [error, setError] = useState<string | null>(null)
// // // //   const [damaged, setDamaged] = useState<Record<string, string>>({})
// // // //   const [missing, setMissing] = useState<Record<string, string>>({})
// // // //   const [submitting, setSubmitting] = useState(false)

// // // //   useEffect(() => {
// // // //     if (!token) return
// // // //     const t = decodeURIComponent(token)
// // // //     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // // //       .then((r) => {
// // // //         setData(r)
// // // //         setPhase('form')
// // // //         // Start with zeros for all products
// // // //         const z: Record<string, string> = {}
// // // //         for (const l of aggregateLines(r.lines)) {
// // // //           z[l.productId] = '0'
// // // //         }
// // // //         // Pre-fill with previously submitted values if any
// // // //         const dmg = { ...z }
// // // //         const miss = { ...z }
// // // //         if (r.billerDamagedLines) {
// // // //           for (const l of r.billerDamagedLines) dmg[l.productId] = String(l.qty)
// // // //         }
// // // //         if (r.billerMissingLines) {
// // // //           for (const l of r.billerMissingLines) miss[l.productId] = String(l.qty)
// // // //         }
// // // //         setDamaged(dmg)
// // // //         setMissing(miss)
// // // //       })
// // // //       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
// // // //   }, [token])

// // // //   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

// // // //   const previewTotals = useMemo(() => {
// // // //     if (!data) return { damage: 0, missing: 0 }
// // // //     let damage = 0
// // // //     let miss = 0
// // // //     for (const l of formLines) {
// // // //       const dq = Number(damaged[l.productId]) || 0
// // // //       const mq = Number(missing[l.productId]) || 0
// // // //       const rate = l.parsedRate ?? 0
// // // //       damage += rate * dq
// // // //       miss += rate * mq
// // // //     }
// // // //     return { damage, missing: miss }
// // // //   }, [data, formLines, damaged, missing])

// // // //   const handleSubmit = async () => {
// // // //     if (!token || !data) return
// // // //     const t = decodeURIComponent(token)
// // // //     const damagedLines = formLines.map((l) => ({
// // // //       productId: l.productId,
// // // //       qty: Number(damaged[l.productId]) || 0,
// // // //     }))
// // // //     const missingLines = formLines.map((l) => ({
// // // //       productId: l.productId,
// // // //       qty: Number(missing[l.productId]) || 0,
// // // //     }))
// // // //     setSubmitting(true)
// // // //     setError(null)
// // // //     try {
// // // //       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
// // // //         method: 'POST',
// // // //         body: JSON.stringify({
// // // //           damagedLines: damagedLines.filter((x) => x.qty > 0),
// // // //           missingLines: missingLines.filter((x) => x.qty > 0),
// // // //         }),
// // // //       })
// // // //       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // // //       setData(refreshed)
// // // //       setPhase('thankYou')
// // // //     } catch (e: unknown) {
// // // //       const msg = (e as { message?: string })?.message || 'Submit failed'
// // // //       setError(msg)
// // // //     } finally {
// // // //       setSubmitting(false)
// // // //     }
// // // //   }

// // // //   if (error && !data) {
// // // //     return (
// // // //       <div className={pageShell}>
// // // //         <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
// // // //           {error}
// // // //         </div>
// // // //       </div>
// // // //     )
// // // //   }

// // // //   if (!data) {
// // // //     return (
// // // //       <div className={pageShell}>
// // // //         <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
// // // //           <LoadingSpinner size="lg" className="text-primary-600" />
// // // //           <p className="text-sm">Loading return form…</p>
// // // //         </div>
// // // //       </div>
// // // //     )
// // // //   }

// // // //   const completionLines = formLines.map((l) => ({
// // // //     productId: l.productId,
// // // //     particulars: l.particulars,
// // // //     sku: l.sku,
// // // //     qty: l.qty,
// // // //   }))

// // // //   const damageDisplay =
// // // //     data.damageTotal != null ? data.damageTotal.toFixed(2) : previewTotals.damage.toFixed(2)
// // // //   const missingDisplay =
// // // //     data.missingTotal != null ? data.missingTotal.toFixed(2) : previewTotals.missing.toFixed(2)

// // // //   if (phase === 'thankYou') {
// // // //     return (
// // // //       <div className={pageShell}>
// // // //         <PublicCompletionScreen
// // // //           variant="thankYou"
// // // //           statusLabel="Submitted"
// // // //           title="Thank you!"
// // // //           subtitle="Your return report has been submitted successfully."
// // // //           deliveryNo={data.deliveryNo}
// // // //           customerName={data.customerName}
// // // //           meta={[
// // // //             { label: 'Challan', value: data.challanNo || '—' },
// // // //             { label: 'Site', value: data.siteName || '—' },
// // // //             { label: 'Damage total', value: damageDisplay },
// // // //             { label: 'Missing total', value: missingDisplay },
// // // //           ]}
// // // //           lines={completionLines}
// // // //           completedAt={data.billerReturnSubmittedAt}
// // // //           completedAtLabel="Submitted on"
// // // //         />
// // // //       </div>
// // // //     )
// // // //   }

// // // //   return (
// // // //     <div className={pageShell}>
// // // //       <div className="mx-auto max-w-2xl space-y-4">
// // // //         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
// // // //           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
// // // //           <div className="mt-1 text-sm text-slate-600">
// // // //             {data.deliveryNo} · {data.customerName}
// // // //           </div>
// // // //           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
// // // //             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
// // // //             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
// // // //             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
// // // //             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
// // // //           </div>
// // // //           {data.billerReturnSubmittedAt ? (
// // // //             <div className="mt-2 text-xs text-emerald-600 font-medium">
// // // //               ✓ Previously submitted — you can re-submit to update
// // // //             </div>
// // // //           ) : null}
// // // //         </div>

// // // //         {error ? (
// // // //           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
// // // //         ) : null}

// // // //         <Card>
// // // //           <CardHeader>
// // // //             <CardTitle>Return reconciliation</CardTitle>
// // // //           </CardHeader>
// // // //           <CardContent className="space-y-4">
// // // //             <div className="text-sm text-slate-600">
// // // //               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
// // // //             </div>

// // // //             <div className="space-y-4">
// // // //               {formLines.map((l) => (
// // // //                 <div key={l.productId} className="rounded-xl border border-slate-200 bg-white p-3">
// // // //                   <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
// // // //                   <div className="text-xs text-slate-500">
// // // //                     {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
// // // //                   </div>
// // // //                   <div className="mt-2">
// // // //                     <Input
// // // //                       label="Return qty (damaged / missing)"
// // // //                       type="number"
// // // //                       min={0}
// // // //                       max={l.qty}
// // // //                       value={damaged[l.productId] ?? '0'}
// // // //                       onChange={(e) => setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))}
// // // //                     />
// // // //                   </div>
// // // //                 </div>
// // // //               ))}
// // // //             </div>

// // // //             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
// // // //               Estimated damage: {previewTotals.damage.toFixed(2)} · Estimated missing:{' '}
// // // //               {previewTotals.missing.toFixed(2)} (preview; server confirms on submit)
// // // //             </div>

// // // //             <Button
// // // //               variant="success"
// // // //               className="w-full"
// // // //               loading={submitting}
// // // //               disabled={submitting}
// // // //               onClick={handleSubmit}
// // // //             >
// // // //               Submit return report
// // // //             </Button>
// // // //           </CardContent>
// // // //         </Card>
// // // //       </div>
// // // //     </div>
// // // //   )
// // // // }

// // // import { useEffect, useMemo, useRef, useState } from 'react'
// // // import { useParams } from 'react-router-dom'
// // // import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// // // import { Button } from '../../components/ui/Button'
// // // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // // import { Input } from '../../components/ui/Input'
// // // import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// // // import { apiFetch } from '../../lib/api'

// // // type Line = {
// // //   productId: string
// // //   qty: number
// // //   particulars?: string
// // //   sku?: string
// // //   parsedRate?: number
// // // }

// // // type PendingLine = { productId: string; qty: number }

// // // type PendingSlot = 'MORNING' | 'AFTERNOON' | 'EVENING'

// // // type GetRes = {
// // //   deliveryNo: string
// // //   customerName: string
// // //   siteName?: string
// // //   status: string
// // //   challanNo?: string
// // //   vehicleLabel?: string
// // //   driverName?: string
// // //   driverPhone?: string
// // //   lines: Line[]
// // //   damageTotal?: number
// // //   missingTotal?: number
// // //   billerReturnSubmittedAt?: string
// // //   billerDamagedLines?: { productId: string; qty: number }[]
// // //   billerMissingLines?: { productId: string; qty: number }[]
// // //   billerCollectedLines?: { productId: string; qty: number }[]
// // //   billerPendingReturnLines?: PendingLine[]
// // //   billerPendingReturnAt?: string
// // //   billerPendingReturnSlot?: PendingSlot
// // //   billerPendingReturnNote?: string
// // //   canSubmit?: boolean
// // // }

// // // // Converts an ISO datetime string to the value a <input type="date"> expects
// // // // (local date, no time), or '' if not set.
// // // function toDateValue(iso?: string): string {
// // //   if (!iso) return ''
// // //   const d = new Date(iso)
// // //   if (Number.isNaN(d.getTime())) return ''
// // //   const pad = (n: number) => String(n).padStart(2, '0')
// // //   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
// // // }

// // // const SLOT_LABELS: Record<PendingSlot, string> = {
// // //   MORNING: 'Morning',
// // //   AFTERNOON: 'Afternoon',
// // //   EVENING: 'Evening',
// // // }

// // // type SelectAllState = 'none' | 'some' | 'all'

// // // function getSelectAllState(checks: boolean[]): SelectAllState {
// // //   if (checks.length === 0) return 'none'
// // //   const checked = checks.filter(Boolean).length
// // //   if (checked === 0) return 'none'
// // //   if (checked === checks.length) return 'all'
// // //   return 'some'
// // // }

// // // type Phase = 'form' | 'thankYou'

// // // const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

// // // function aggregateLines(lines: Line[]): Line[] {
// // //   const byProduct = new Map<string, Line>()
// // //   for (const l of lines) {
// // //     const existing = byProduct.get(l.productId)
// // //     if (existing) {
// // //       existing.qty += l.qty
// // //     } else {
// // //       byProduct.set(l.productId, { ...l })
// // //     }
// // //   }
// // //   return Array.from(byProduct.values())
// // // }

// // // export function PublicBillerReturnPage() {
// // //   const { token } = useParams()
// // //   const [data, setData] = useState<GetRes | null>(null)
// // //   const [phase, setPhase] = useState<Phase>('form')
// // //   const [error, setError] = useState<string | null>(null)
// // //   const [checks, setChecks] = useState<boolean[]>([])
// // //   // Two separate quantities per product: how many are damaged/missing
// // //   // (write-off, not restocked) and how many are being physically collected
// // //   // back right now (restocked into the godown).
// // //   const [damagedQty, setDamagedQty] = useState<Record<string, string>>({})
// // //   const [collectedQty, setCollectedQty] = useState<Record<string, string>>({})
// // //   const [pendingReturnDate, setPendingReturnDate] = useState<string>('')
// // //   const [pendingReturnSlot, setPendingReturnSlot] = useState<PendingSlot | ''>('')
// // //   const [pendingReturnNote, setPendingReturnNote] = useState<string>('')
// // //   const [submitting, setSubmitting] = useState(false)
// // //   const selectAllRef = useRef<HTMLInputElement>(null)

// // //   useEffect(() => {
// // //     if (!token) return
// // //     const t = decodeURIComponent(token)
// // //     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // //       .then((r) => {
// // //         setData(r)
// // //         setPhase('form')
// // //         const agg = aggregateLines(r.lines)
// // //         const z: Record<string, string> = {}
// // //         for (const l of agg) z[l.productId] = '0'

// // //         const dmg = { ...z }
// // //         if (r.billerDamagedLines) {
// // //           for (const l of r.billerDamagedLines) dmg[l.productId] = String((Number(dmg[l.productId]) || 0) + l.qty)
// // //         }
// // //         const col = { ...z }
// // //         if (r.billerCollectedLines) {
// // //           for (const l of r.billerCollectedLines) col[l.productId] = String((Number(col[l.productId]) || 0) + l.qty)
// // //         }
// // //         setDamagedQty(dmg)
// // //         setCollectedQty(col)
// // //         setPendingReturnDate(toDateValue(r.billerPendingReturnAt))
// // //         setPendingReturnSlot(r.billerPendingReturnSlot || '')
// // //         setPendingReturnNote(r.billerPendingReturnNote || '')

// // //         // Pre-check products that already have a qty entered
// // //         const preChecks = agg.map((l) => Number(dmg[l.productId]) > 0 || Number(col[l.productId]) > 0)
// // //         setChecks(preChecks)
// // //       })
// // //       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
// // //   }, [token])

// // //   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

// // //   // Sync indeterminate state on select-all checkbox
// // //   useEffect(() => {
// // //     if (!selectAllRef.current) return
// // //     const state = getSelectAllState(checks)
// // //     selectAllRef.current.indeterminate = state === 'some'
// // //   }, [checks])

// // //   const toggleLine = (index: number, checked: boolean) => {
// // //     setChecks((prev) => {
// // //       const next = [...prev]
// // //       next[index] = checked
// // //       return next
// // //     })
// // //     // Reset qty when unchecked
// // //     if (!checked) {
// // //       const productId = formLines[index]?.productId
// // //       if (productId) {
// // //         setDamagedQty((q) => ({ ...q, [productId]: '0' }))
// // //         setCollectedQty((q) => ({ ...q, [productId]: '0' }))
// // //       }
// // //     }
// // //   }

// // //   const toggleSelectAll = () => {
// // //     const state = getSelectAllState(checks)
// // //     const next = state === 'all' ? checks.map(() => false) : checks.map(() => true)
// // //     setChecks(next)
// // //     // Reset qtys for unchecked items
// // //     if (state === 'all') {
// // //       const z: Record<string, string> = {}
// // //       for (const l of formLines) z[l.productId] = '0'
// // //       setDamagedQty(z)
// // //       setCollectedQty(z)
// // //     }
// // //   }

// // //   const previewTotals = useMemo(() => {
// // //     if (!data) return { damage: 0, missing: 0 }
// // //     let damage = 0
// // //     for (const l of formLines) {
// // //       const q = Number(damagedQty[l.productId]) || 0
// // //       const rate = l.parsedRate ?? 0
// // //       damage += rate * q
// // //     }
// // //     return { damage, missing: 0 }
// // //   }, [data, formLines, damagedQty])

// // //   // Whatever isn't reported as damaged/missing or collected now is still
// // //   // outstanding with the customer — these are the items that need a
// // //   // scheduled return date & time-of-day.
// // //   const pendingSummary = useMemo(() => {
// // //     const lines = formLines
// // //       .map((l) => {
// // //         const dq = Number(damagedQty[l.productId]) || 0
// // //         const cq = Number(collectedQty[l.productId]) || 0
// // //         const remaining = Math.max(0, l.qty - dq - cq)
// // //         return { productId: l.productId, particulars: l.particulars, sku: l.sku, qty: remaining }
// // //       })
// // //       .filter((l) => l.qty > 0)
// // //     const total = lines.reduce((s, l) => s + l.qty, 0)
// // //     return { lines, total }
// // //   }, [formLines, damagedQty, collectedQty])

// // //   const handleSubmit = async () => {
// // //     if (!token || !data) return
// // //     if (pendingSummary.total > 0 && (!pendingReturnDate || !pendingReturnSlot)) {
// // //       setError('Please choose a date and a time of day for when the remaining pending items will be returned.')
// // //       return
// // //     }
// // //     const t = decodeURIComponent(token)
// // //     const damagedLines = formLines.map((l) => ({
// // //       productId: l.productId,
// // //       qty: Number(damagedQty[l.productId]) || 0,
// // //     }))
// // //     const collectedLines = formLines.map((l) => ({
// // //       productId: l.productId,
// // //       qty: Number(collectedQty[l.productId]) || 0,
// // //     }))
// // //     setSubmitting(true)
// // //     setError(null)
// // //     try {
// // //       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
// // //         method: 'POST',
// // //         body: JSON.stringify({
// // //           damagedLines: damagedLines.filter((x) => x.qty > 0),
// // //           collectedLines: collectedLines.filter((x) => x.qty > 0),
// // //           pendingReturnDate: pendingReturnDate || undefined,
// // //           pendingReturnSlot: pendingReturnSlot || undefined,
// // //           pendingReturnNote: pendingReturnNote.trim() || undefined,
// // //         }),
// // //       })
// // //       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // //       setData(refreshed)
// // //       setPhase('thankYou')
// // //     } catch (e: unknown) {
// // //       const msg = (e as { message?: string })?.message || 'Submit failed'
// // //       setError(msg)
// // //     } finally {
// // //       setSubmitting(false)
// // //     }
// // //   }

// // //   if (error && !data) {
// // //     return (
// // //       <div className={pageShell}>
// // //         <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
// // //           {error}
// // //         </div>
// // //       </div>
// // //     )
// // //   }

// // //   if (!data) {
// // //     return (
// // //       <div className={pageShell}>
// // //         <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
// // //           <LoadingSpinner size="lg" className="text-primary-600" />
// // //           <p className="text-sm">Loading return form…</p>
// // //         </div>
// // //       </div>
// // //     )
// // //   }

// // //   // Reflect the actual reported damaged/missing + collected qty per product
// // //   // (not the originally dispatched qty) so the thank-you page matches what
// // //   // was submitted.
// // //   const reportedQtyByProduct = new Map<string, number>()
// // //   for (const l of data.billerDamagedLines || []) {
// // //     reportedQtyByProduct.set(l.productId, (reportedQtyByProduct.get(l.productId) || 0) + l.qty)
// // //   }
// // //   for (const l of data.billerCollectedLines || []) {
// // //     reportedQtyByProduct.set(l.productId, (reportedQtyByProduct.get(l.productId) || 0) + l.qty)
// // //   }
// // //   const completionLines = formLines
// // //     .map((l) => ({
// // //       productId: l.productId,
// // //       particulars: l.particulars,
// // //       sku: l.sku,
// // //       qty: reportedQtyByProduct.get(l.productId) || 0,
// // //     }))
// // //     .filter((l) => l.qty > 0)

// // //   const combinedTotal = (data.damageTotal ?? previewTotals.damage) + (data.missingTotal ?? 0)
// // //   const pendingLinesDisplay = data.billerPendingReturnLines || []
// // //   const pendingDueLabel = data.billerPendingReturnAt
// // //     ? `${new Date(data.billerPendingReturnAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}${data.billerPendingReturnSlot ? ` · ${SLOT_LABELS[data.billerPendingReturnSlot]}` : ''}`
// // //     : ''

// // //   if (phase === 'thankYou') {
// // //     return (
// // //       <div className={pageShell}>
// // //         <PublicCompletionScreen
// // //           variant="thankYou"
// // //           statusLabel="Submitted"
// // //           title="Thank you!"
// // //           subtitle="Your return report has been submitted successfully."
// // //           deliveryNo={data.deliveryNo}
// // //           customerName={data.customerName}
// // //           meta={[
// // //             { label: 'Challan', value: data.challanNo || '—' },
// // //             { label: 'Site', value: data.siteName || '—' },
// // //             { label: 'Delivery by', value: data.driverName || '—' },
// // //             { label: 'Damage/Missing total', value: combinedTotal.toFixed(2) },
// // //             ...(pendingDueLabel
// // //               ? [{ label: 'Pending items due back', value: pendingDueLabel }]
// // //               : []),
// // //           ]}
// // //           lines={completionLines}
// // //           completedAt={data.billerReturnSubmittedAt}
// // //           completedAtLabel="Submitted on"
// // //         />
// // //         {pendingLinesDisplay.length > 0 ? (
// // //           <div className="mx-auto mt-4 max-w-lg rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm">
// // //             <div className="font-semibold text-amber-800">
// // //               {pendingLinesDisplay.reduce((s, l) => s + l.qty, 0)} item(s) still with the customer
// // //             </div>
// // //             <div className="mt-1 text-amber-700">
// // //               Expected back{pendingDueLabel ? ` on ${pendingDueLabel}` : ''}
// // //               {data.billerPendingReturnNote ? ` · ${data.billerPendingReturnNote}` : ''}
// // //             </div>
// // //           </div>
// // //         ) : null}
// // //       </div>
// // //     )
// // //   }

// // //   const lineCount = formLines.length
// // //   const checkedCount = checks.filter(Boolean).length
// // //   const selectAllState = getSelectAllState(checks)
// // //   const progressPct = lineCount > 0 ? Math.round((checkedCount / lineCount) * 100) : 0

// // //   return (
// // //     <div className={pageShell}>
// // //       <div className="mx-auto max-w-2xl space-y-4">
// // //         {/* Header card */}
// // //         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
// // //           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
// // //           <div className="mt-1 text-sm text-slate-600">
// // //             {data.deliveryNo} · {data.customerName}
// // //           </div>
// // //           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
// // //             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
// // //             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
// // //             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
// // //             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
// // //           </div>
// // //           {data.billerReturnSubmittedAt ? (
// // //             <div className="mt-2 text-xs text-emerald-600 font-medium">
// // //               ✓ Previously submitted — you can re-submit to update
// // //             </div>
// // //           ) : null}
// // //         </div>

// // //         {error ? (
// // //           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
// // //         ) : null}

// // //         <Card>
// // //           <CardHeader>
// // //             <div className="flex flex-wrap items-center justify-between gap-2">
// // //               <CardTitle>Return reconciliation</CardTitle>
// // //               <span className="text-sm font-medium text-slate-600">
// // //                 {checkedCount} of {lineCount} selected
// // //               </span>
// // //             </div>
// // //             {/* Progress bar */}
// // //             <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
// // //               <div
// // //                 className="h-full rounded-full bg-primary-500 transition-all duration-300"
// // //                 style={{ width: `${progressPct}%` }}
// // //               />
// // //             </div>
// // //           </CardHeader>
// // //           <CardContent className="space-y-4">
// // //             <div className="text-sm text-slate-600">
// // //               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
// // //             </div>

// // //             {/* Checklist with Select All */}
// // //             <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
// // //               {/* Select all row */}
// // //               <label className="flex cursor-pointer items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5">
// // //                 <input
// // //                   ref={selectAllRef}
// // //                   type="checkbox"
// // //                   className="h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
// // //                   checked={selectAllState === 'all'}
// // //                   onChange={toggleSelectAll}
// // //                 />
// // //                 <div className="min-w-0 flex-1">
// // //                   <div className="font-semibold text-slate-900">Select all</div>
// // //                   <div className="text-xs text-slate-500">
// // //                     {lineCount} item{lineCount === 1 ? '' : 's'}
// // //                   </div>
// // //                 </div>
// // //               </label>

// // //               {/* Per-product rows */}
// // //               <div className="divide-y divide-slate-100">
// // //                 {formLines.map((l, i) => (
// // //                   <div
// // //                     key={l.productId}
// // //                     className={`transition-colors ${checks[i] ? 'bg-primary-50/60' : 'hover:bg-slate-50'}`}
// // //                   >
// // //                     {/* Checkbox row */}
// // //                     <label className="flex cursor-pointer items-start gap-3 px-4 py-4">
// // //                       <input
// // //                         type="checkbox"
// // //                         className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
// // //                         checked={!!checks[i]}
// // //                         onChange={(e) => toggleLine(i, e.target.checked)}
// // //                       />
// // //                       <div className="min-w-0 flex-1">
// // //                         <div className="flex items-start gap-2">
// // //                           <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
// // //                             {i + 1}
// // //                           </span>
// // //                           <div className="min-w-0 flex-1">
// // //                             <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
// // //                             <div className="text-xs text-slate-500">
// // //                               {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
// // //                             </div>
// // //                           </div>
// // //                         </div>
// // //                       </div>
// // //                     </label>

// // //                     {/* Qty inputs — only visible when checked */}
// // //                     {checks[i] && (
// // //                       <div className="px-4 pb-4">
// // //                         <div className="grid grid-cols-2 gap-3">
// // //                           <Input
// // //                             label="Damage/Missing qty"
// // //                             type="number"
// // //                             min={0}
// // //                             max={l.qty}
// // //                             value={damagedQty[l.productId] ?? '0'}
// // //                             onChange={(e) =>
// // //                               setDamagedQty((q) => ({ ...q, [l.productId]: e.target.value }))
// // //                             }
// // //                           />
// // //                           <Input
// // //                             label="Collecting now qty"
// // //                             type="number"
// // //                             min={0}
// // //                             max={l.qty}
// // //                             value={collectedQty[l.productId] ?? '0'}
// // //                             onChange={(e) =>
// // //                               setCollectedQty((q) => ({ ...q, [l.productId]: e.target.value }))
// // //                             }
// // //                           />
// // //                         </div>
// // //                         {Math.max(0, l.qty - (Number(damagedQty[l.productId]) || 0) - (Number(collectedQty[l.productId]) || 0)) > 0 ? (
// // //                           <p className="mt-1.5 text-xs font-medium text-amber-700">
// // //                             {l.qty - (Number(damagedQty[l.productId]) || 0) - (Number(collectedQty[l.productId]) || 0)} qty
// // //                             still with the customer — schedule its return below.
// // //                           </p>
// // //                         ) : null}
// // //                       </div>
// // //                     )}
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             </div>

// // //             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
// // //               Estimated damage/missing value: {previewTotals.damage.toFixed(2)} (preview; server
// // //               confirms on submit)
// // //             </div>

// // //             {/* Pending items — schedule when the rest will be returned */}
// // //             {pendingSummary.total > 0 ? (
// // //               <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
// // //                 <div>
// // //                   <div className="font-semibold text-amber-900">
// // //                     {pendingSummary.total} item(s) still pending return
// // //                   </div>
// // //                   <ul className="mt-1 space-y-0.5 text-xs text-amber-800">
// // //                     {pendingSummary.lines.map((l) => (
// // //                       <li key={l.productId}>
// // //                         {l.particulars || l.productId}
// // //                         {l.sku ? ` (${l.sku})` : ''} — qty {l.qty}
// // //                       </li>
// // //                     ))}
// // //                   </ul>
// // //                 </div>
// // //                 <div>
// // //                   <label className="mb-1 block text-sm font-medium text-slate-700">
// // //                     Expected return date
// // //                   </label>
// // //                   <input
// // //                     type="date"
// // //                     value={pendingReturnDate}
// // //                     onChange={(e) => setPendingReturnDate(e.target.value)}
// // //                     className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
// // //                   />
// // //                 </div>
// // //                 <div>
// // //                   <label className="mb-1 block text-sm font-medium text-slate-700">
// // //                     Time of day
// // //                   </label>
// // //                   <div className="grid grid-cols-3 gap-2">
// // //                     {(['MORNING', 'AFTERNOON', 'EVENING'] as const).map((slot) => (
// // //                       <button
// // //                         key={slot}
// // //                         type="button"
// // //                         onClick={() => setPendingReturnSlot(slot)}
// // //                         className={
// // //                           'h-10 rounded-lg border text-sm font-semibold transition ' +
// // //                           (pendingReturnSlot === slot
// // //                             ? 'border-primary-400 bg-primary-50 text-primary-800'
// // //                             : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')
// // //                         }
// // //                       >
// // //                         {SLOT_LABELS[slot]}
// // //                       </button>
// // //                     ))}
// // //                   </div>
// // //                 </div>
// // //                 <div>
// // //                   <Input
// // //                     label="Note (optional)"
// // //                     value={pendingReturnNote}
// // //                     onChange={(e) => setPendingReturnNote(e.target.value)}
// // //                     placeholder="e.g. will be sent back with the next delivery"
// // //                   />
// // //                 </div>
// // //               </div>
// // //             ) : null}

// // //             <Button
// // //               variant="success"
// // //               className="w-full"
// // //               loading={submitting}
// // //               disabled={submitting}
// // //               onClick={handleSubmit}
// // //             >
// // //               Submit return report
// // //             </Button>
// // //           </CardContent>
// // //         </Card>
// // //       </div>
// // //     </div>
// // //   )
// // // }

// // // // import { useEffect, useMemo, useState } from 'react'
// // // // import { useParams } from 'react-router-dom'
// // // // import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// // // // import { Button } from '../../components/ui/Button'
// // // // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // // // import { Input } from '../../components/ui/Input'
// // // // import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// // // // import { apiFetch } from '../../lib/api'

// // // // type Line = {
// // // //   productId: string
// // // //   qty: number
// // // //   particulars?: string
// // // //   sku?: string
// // // //   parsedRate?: number
// // // // }

// // // // type GetRes = {
// // // //   deliveryNo: string
// // // //   customerName: string
// // // //   siteName?: string
// // // //   status: string
// // // //   challanNo?: string
// // // //   vehicleLabel?: string
// // // //   driverName?: string
// // // //   driverPhone?: string
// // // //   lines: Line[]
// // // //   damageTotal?: number
// // // //   missingTotal?: number
// // // //   billerReturnSubmittedAt?: string
// // // //   billerDamagedLines?: { productId: string; qty: number }[]
// // // //   billerMissingLines?: { productId: string; qty: number }[]
// // // //   canSubmit?: boolean
// // // // }

// // // // type Phase = 'form' | 'thankYou'

// // // // const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

// // // // function aggregateLines(lines: Line[]): Line[] {
// // // //   const byProduct = new Map<string, Line>()
// // // //   for (const l of lines) {
// // // //     const existing = byProduct.get(l.productId)
// // // //     if (existing) {
// // // //       existing.qty += l.qty
// // // //     } else {
// // // //       byProduct.set(l.productId, { ...l })
// // // //     }
// // // //   }
// // // //   return Array.from(byProduct.values())
// // // // }

// // // // export function PublicBillerReturnPage() {
// // // //   const { token } = useParams()
// // // //   const [data, setData] = useState<GetRes | null>(null)
// // // //   console.log("datauuu",data);
  
// // // //   const [phase, setPhase] = useState<Phase>('form')
// // // //   const [error, setError] = useState<string | null>(null)
// // // //   const [damaged, setDamaged] = useState<Record<string, string>>({})
// // // //   const [missing, setMissing] = useState<Record<string, string>>({})
// // // //   const [submitting, setSubmitting] = useState(false)

// // // //   useEffect(() => {
// // // //     if (!token) return
// // // //     const t = decodeURIComponent(token)
// // // //     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // // //       .then((r) => {
// // // //         setData(r)
// // // //         setPhase('form')
// // // //         // Start with zeros for all products
// // // //         const z: Record<string, string> = {}
// // // //         for (const l of aggregateLines(r.lines)) {
// // // //           z[l.productId] = '0'
// // // //         }
// // // //         // Pre-fill with previously submitted values if any
// // // //         const dmg = { ...z }
// // // //         const miss = { ...z }
// // // //         if (r.billerDamagedLines) {
// // // //           for (const l of r.billerDamagedLines) dmg[l.productId] = String(l.qty)
// // // //         }
// // // //         if (r.billerMissingLines) {
// // // //           for (const l of r.billerMissingLines) miss[l.productId] = String(l.qty)
// // // //         }
// // // //         setDamaged(dmg)
// // // //         setMissing(miss)
// // // //       })
// // // //       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
// // // //   }, [token])

// // // //   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

// // // //   const previewTotals = useMemo(() => {
// // // //     if (!data) return { damage: 0, missing: 0 }
// // // //     let damage = 0
// // // //     let miss = 0
// // // //     for (const l of formLines) {
// // // //       const dq = Number(damaged[l.productId]) || 0
// // // //       const mq = Number(missing[l.productId]) || 0
// // // //       const rate = l.parsedRate ?? 0
// // // //       damage += rate * dq
// // // //       miss += rate * mq
// // // //     }
// // // //     return { damage, missing: miss }
// // // //   }, [data, formLines, damaged, missing])

// // // //   const handleSubmit = async () => {
// // // //     if (!token || !data) return
// // // //     const t = decodeURIComponent(token)
// // // //     const damagedLines = formLines.map((l) => ({
// // // //       productId: l.productId,
// // // //       qty: Number(damaged[l.productId]) || 0,
// // // //     }))
// // // //     const missingLines = formLines.map((l) => ({
// // // //       productId: l.productId,
// // // //       qty: Number(missing[l.productId]) || 0,
// // // //     }))
// // // //     setSubmitting(true)
// // // //     setError(null)
// // // //     try {
// // // //       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
// // // //         method: 'POST',
// // // //         body: JSON.stringify({
// // // //           damagedLines: damagedLines.filter((x) => x.qty > 0),
// // // //           missingLines: missingLines.filter((x) => x.qty > 0),
// // // //         }),
// // // //       })
// // // //       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // // //       setData(refreshed)
// // // //       setPhase('thankYou')
// // // //     } catch (e: unknown) {
// // // //       const msg = (e as { message?: string })?.message || 'Submit failed'
// // // //       setError(msg)
// // // //     } finally {
// // // //       setSubmitting(false)
// // // //     }
// // // //   }

// // // //   if (error && !data) {
// // // //     return (
// // // //       <div className={pageShell}>
// // // //         <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
// // // //           {error}
// // // //         </div>
// // // //       </div>
// // // //     )
// // // //   }

// // // //   if (!data) {
// // // //     return (
// // // //       <div className={pageShell}>
// // // //         <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
// // // //           <LoadingSpinner size="lg" className="text-primary-600" />
// // // //           <p className="text-sm">Loading return form…</p>
// // // //         </div>
// // // //       </div>
// // // //     )
// // // //   }

// // // //   const completionLines = formLines.map((l) => ({
// // // //     productId: l.productId,
// // // //     particulars: l.particulars,
// // // //     sku: l.sku,
// // // //     qty: l.qty,
// // // //   }))

// // // //   const damageDisplay =
// // // //     data.damageTotal != null ? data.damageTotal.toFixed(2) : previewTotals.damage.toFixed(2)
// // // //   const missingDisplay =
// // // //     data.missingTotal != null ? data.missingTotal.toFixed(2) : previewTotals.missing.toFixed(2)

// // // //   if (phase === 'thankYou') {
// // // //     return (
// // // //       <div className={pageShell}>
// // // //         <PublicCompletionScreen
// // // //           variant="thankYou"
// // // //           statusLabel="Submitted"
// // // //           title="Thank you!"
// // // //           subtitle="Your return report has been submitted successfully."
// // // //           deliveryNo={data.deliveryNo}
// // // //           customerName={data.customerName}
// // // //           meta={[
// // // //             { label: 'Challan', value: data.challanNo || '—' },
// // // //             { label: 'Site', value: data.siteName || '—' },
// // // //             { label: 'Damage total', value: damageDisplay },
// // // //             { label: 'Missing total', value: missingDisplay },
// // // //           ]}
// // // //           lines={completionLines}
// // // //           completedAt={data.billerReturnSubmittedAt}
// // // //           completedAtLabel="Submitted on"
// // // //         />
// // // //       </div>
// // // //     )
// // // //   }

// // // //   return (
// // // //     <div className={pageShell}>
// // // //       <div className="mx-auto max-w-2xl space-y-4">
// // // //         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
// // // //           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
// // // //           <div className="mt-1 text-sm text-slate-600">
// // // //             {data.deliveryNo} · {data.customerName}
// // // //           </div>
// // // //           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
// // // //             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
// // // //             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
// // // //             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
// // // //             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
// // // //           </div>
// // // //           {data.billerReturnSubmittedAt ? (
// // // //             <div className="mt-2 text-xs text-emerald-600 font-medium">
// // // //               ✓ Previously submitted — you can re-submit to update
// // // //             </div>
// // // //           ) : null}
// // // //         </div>

// // // //         {error ? (
// // // //           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
// // // //         ) : null}

// // // //         <Card>
// // // //           <CardHeader>
// // // //             <CardTitle>Return reconciliation</CardTitle>
// // // //           </CardHeader>
// // // //           <CardContent className="space-y-4">
// // // //             <div className="text-sm text-slate-600">
// // // //               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
// // // //             </div>

// // // //             <div className="space-y-4">
// // // //               {formLines.map((l) => (
// // // //                 <div key={l.productId} className="rounded-xl border border-slate-200 bg-white p-3">
// // // //                   <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
// // // //                   <div className="text-xs text-slate-500">
// // // //                     {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
// // // //                   </div>
// // // //                   <div className="mt-2">
// // // //                     <Input
// // // //                       label="Return qty (damaged / missing)"
// // // //                       type="number"
// // // //                       min={0}
// // // //                       max={l.qty}
// // // //                       value={damaged[l.productId] ?? '0'}
// // // //                       onChange={(e) => setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))}
// // // //                     />
// // // //                   </div>
// // // //                 </div>
// // // //               ))}
// // // //             </div>

// // // //             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
// // // //               Estimated damage: {previewTotals.damage.toFixed(2)} · Estimated missing:{' '}
// // // //               {previewTotals.missing.toFixed(2)} (preview; server confirms on submit)
// // // //             </div>

// // // //             <Button
// // // //               variant="success"
// // // //               className="w-full"
// // // //               loading={submitting}
// // // //               disabled={submitting}
// // // //               onClick={handleSubmit}
// // // //             >
// // // //               Submit return report
// // // //             </Button>
// // // //           </CardContent>
// // // //         </Card>
// // // //       </div>
// // // //     </div>
// // // //   )
// // // // }

// // // import { useEffect, useMemo, useRef, useState } from 'react'
// // // import { useParams } from 'react-router-dom'
// // // import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// // // import { Button } from '../../components/ui/Button'
// // // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // // import { Input } from '../../components/ui/Input'
// // // import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// // // import { apiFetch } from '../../lib/api'

// // // type Line = {
// // //   productId: string
// // //   qty: number
// // //   particulars?: string
// // //   sku?: string
// // //   parsedRate?: number
// // // }

// // // type GetRes = {
// // //   deliveryNo: string
// // //   customerName: string
// // //   siteName?: string
// // //   status: string
// // //   challanNo?: string
// // //   vehicleLabel?: string
// // //   driverName?: string
// // //   driverPhone?: string
// // //   lines: Line[]
// // //   damageTotal?: number
// // //   missingTotal?: number
// // //   billerReturnSubmittedAt?: string
// // //   billerDamagedLines?: { productId: string; qty: number }[]
// // //   billerMissingLines?: { productId: string; qty: number }[]
// // //   canSubmit?: boolean
// // // }

// // // type SelectAllState = 'none' | 'some' | 'all'

// // // function getSelectAllState(checks: boolean[]): SelectAllState {
// // //   if (checks.length === 0) return 'none'
// // //   const checked = checks.filter(Boolean).length
// // //   if (checked === 0) return 'none'
// // //   if (checked === checks.length) return 'all'
// // //   return 'some'
// // // }

// // // type Phase = 'form' | 'thankYou'

// // // const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

// // // function aggregateLines(lines: Line[]): Line[] {
// // //   const byProduct = new Map<string, Line>()
// // //   for (const l of lines) {
// // //     const existing = byProduct.get(l.productId)
// // //     if (existing) {
// // //       existing.qty += l.qty
// // //     } else {
// // //       byProduct.set(l.productId, { ...l })
// // //     }
// // //   }
// // //   return Array.from(byProduct.values())
// // // }

// // // export function PublicBillerReturnPage() {
// // //   const { token } = useParams()
// // //   const [data, setData] = useState<GetRes | null>(null)
// // //   const [phase, setPhase] = useState<Phase>('form')
// // //   const [error, setError] = useState<string | null>(null)
// // //   const [checks, setChecks] = useState<boolean[]>([])
// // //   const [damaged, setDamaged] = useState<Record<string, string>>({})
// // //   const [missing, setMissing] = useState<Record<string, string>>({})
// // //   const [submitting, setSubmitting] = useState(false)
// // //   const selectAllRef = useRef<HTMLInputElement>(null)

// // //   useEffect(() => {
// // //     if (!token) return
// // //     const t = decodeURIComponent(token)
// // //     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // //       .then((r) => {
// // //         setData(r)
// // //         setPhase('form')
// // //         const agg = aggregateLines(r.lines)
// // //         const z: Record<string, string> = {}
// // //         for (const l of agg) z[l.productId] = '0'

// // //         const dmg = { ...z }
// // //         const miss = { ...z }
// // //         if (r.billerDamagedLines) {
// // //           for (const l of r.billerDamagedLines) dmg[l.productId] = String(l.qty)
// // //         }
// // //         if (r.billerMissingLines) {
// // //           for (const l of r.billerMissingLines) miss[l.productId] = String(l.qty)
// // //         }
// // //         setDamaged(dmg)
// // //         setMissing(miss)

// // //         // Pre-check products that already have a qty entered
// // //         const preChecks = agg.map(
// // //           (l) => Number(dmg[l.productId]) > 0 || Number(miss[l.productId]) > 0
// // //         )
// // //         setChecks(preChecks)
// // //       })
// // //       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
// // //   }, [token])

// // //   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

// // //   // Sync indeterminate state on select-all checkbox
// // //   useEffect(() => {
// // //     if (!selectAllRef.current) return
// // //     const state = getSelectAllState(checks)
// // //     selectAllRef.current.indeterminate = state === 'some'
// // //   }, [checks])

// // //   const toggleLine = (index: number, checked: boolean) => {
// // //     setChecks((prev) => {
// // //       const next = [...prev]
// // //       next[index] = checked
// // //       return next
// // //     })
// // //     // Reset qty when unchecked
// // //     if (!checked) {
// // //       const productId = formLines[index]?.productId
// // //       if (productId) {
// // //         setDamaged((d) => ({ ...d, [productId]: '0' }))
// // //         setMissing((m) => ({ ...m, [productId]: '0' }))
// // //       }
// // //     }
// // //   }

// // //   const toggleSelectAll = () => {
// // //     const state = getSelectAllState(checks)
// // //     const next = state === 'all' ? checks.map(() => false) : checks.map(() => true)
// // //     setChecks(next)
// // //     // Reset qtys for unchecked items
// // //     if (state === 'all') {
// // //       const z: Record<string, string> = {}
// // //       for (const l of formLines) z[l.productId] = '0'
// // //       setDamaged(z)
// // //       setMissing(z)
// // //     }
// // //   }

// // //   const previewTotals = useMemo(() => {
// // //     if (!data) return { damage: 0, missing: 0 }
// // //     let damage = 0
// // //     let miss = 0
// // //     for (const l of formLines) {
// // //       const dq = Number(damaged[l.productId]) || 0
// // //       const mq = Number(missing[l.productId]) || 0
// // //       const rate = l.parsedRate ?? 0
// // //       damage += rate * dq
// // //       miss += rate * mq
// // //     }
// // //     return { damage, missing: miss }
// // //   }, [data, formLines, damaged, missing])

// // //   const handleSubmit = async () => {
// // //     if (!token || !data) return
// // //     const t = decodeURIComponent(token)
// // //     const damagedLines = formLines.map((l) => ({
// // //       productId: l.productId,
// // //       qty: Number(damaged[l.productId]) || 0,
// // //     }))
// // //     const missingLines = formLines.map((l) => ({
// // //       productId: l.productId,
// // //       qty: Number(missing[l.productId]) || 0,
// // //     }))
// // //     setSubmitting(true)
// // //     setError(null)
// // //     try {
// // //       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
// // //         method: 'POST',
// // //         body: JSON.stringify({
// // //           damagedLines: damagedLines.filter((x) => x.qty > 0),
// // //           missingLines: missingLines.filter((x) => x.qty > 0),
// // //         }),
// // //       })
// // //       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // //       setData(refreshed)
// // //       setPhase('thankYou')
// // //     } catch (e: unknown) {
// // //       const msg = (e as { message?: string })?.message || 'Submit failed'
// // //       setError(msg)
// // //     } finally {
// // //       setSubmitting(false)
// // //     }
// // //   }

// // //   if (error && !data) {
// // //     return (
// // //       <div className={pageShell}>
// // //         <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
// // //           {error}
// // //         </div>
// // //       </div>
// // //     )
// // //   }

// // //   if (!data) {
// // //     return (
// // //       <div className={pageShell}>
// // //         <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
// // //           <LoadingSpinner size="lg" className="text-primary-600" />
// // //           <p className="text-sm">Loading return form…</p>
// // //         </div>
// // //       </div>
// // //     )
// // //   }

// // //   const completionLines = formLines.map((l) => ({
// // //     productId: l.productId,
// // //     particulars: l.particulars,
// // //     sku: l.sku,
// // //     qty: l.qty,
// // //   }))

// // //   const damageDisplay =
// // //     data.damageTotal != null ? data.damageTotal.toFixed(2) : previewTotals.damage.toFixed(2)
// // //   const missingDisplay =
// // //     data.missingTotal != null ? data.missingTotal.toFixed(2) : previewTotals.missing.toFixed(2)

// // //   if (phase === 'thankYou') {
// // //     return (
// // //       <div className={pageShell}>
// // //         <PublicCompletionScreen
// // //           variant="thankYou"
// // //           statusLabel="Submitted"
// // //           title="Thank you!"
// // //           subtitle="Your return report has been submitted successfully."
// // //           deliveryNo={data.deliveryNo}
// // //           customerName={data.customerName}
// // //           meta={[
// // //             { label: 'Challan', value: data.challanNo || '—' },
// // //             { label: 'Site', value: data.siteName || '—' },
// // //             { label: 'Damage total', value: damageDisplay },
// // //             { label: 'Missing total', value: missingDisplay },
// // //           ]}
// // //           lines={completionLines}
// // //           completedAt={data.billerReturnSubmittedAt}
// // //           completedAtLabel="Submitted on"
// // //         />
// // //       </div>
// // //     )
// // //   }

// // //   const lineCount = formLines.length
// // //   const checkedCount = checks.filter(Boolean).length
// // //   const selectAllState = getSelectAllState(checks)
// // //   const progressPct = lineCount > 0 ? Math.round((checkedCount / lineCount) * 100) : 0

// // //   return (
// // //     <div className={pageShell}>
// // //       <div className="mx-auto max-w-2xl space-y-4">
// // //         {/* Header card */}
// // //         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
// // //           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
// // //           <div className="mt-1 text-sm text-slate-600">
// // //             {data.deliveryNo} · {data.customerName}
// // //           </div>
// // //           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
// // //             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
// // //             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
// // //             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
// // //             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
// // //           </div>
// // //           {data.billerReturnSubmittedAt ? (
// // //             <div className="mt-2 text-xs text-emerald-600 font-medium">
// // //               ✓ Previously submitted — you can re-submit to update
// // //             </div>
// // //           ) : null}
// // //         </div>

// // //         {error ? (
// // //           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
// // //         ) : null}

// // //         <Card>
// // //           <CardHeader>
// // //             <div className="flex flex-wrap items-center justify-between gap-2">
// // //               <CardTitle>Return reconciliation</CardTitle>
// // //               <span className="text-sm font-medium text-slate-600">
// // //                 {checkedCount} of {lineCount} selected
// // //               </span>
// // //             </div>
// // //             {/* Progress bar */}
// // //             <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
// // //               <div
// // //                 className="h-full rounded-full bg-primary-500 transition-all duration-300"
// // //                 style={{ width: `${progressPct}%` }}
// // //               />
// // //             </div>
// // //           </CardHeader>
// // //           <CardContent className="space-y-4">
// // //             <div className="text-sm text-slate-600">
// // //               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
// // //             </div>

// // //             {/* Checklist with Select All */}
// // //             <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
// // //               {/* Select all row */}
// // //               <label className="flex cursor-pointer items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5">
// // //                 <input
// // //                   ref={selectAllRef}
// // //                   type="checkbox"
// // //                   className="h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
// // //                   checked={selectAllState === 'all'}
// // //                   onChange={toggleSelectAll}
// // //                 />
// // //                 <div className="min-w-0 flex-1">
// // //                   <div className="font-semibold text-slate-900">Select all</div>
// // //                   <div className="text-xs text-slate-500">
// // //                     {lineCount} item{lineCount === 1 ? '' : 's'}
// // //                   </div>
// // //                 </div>
// // //               </label>

// // //               {/* Per-product rows */}
// // //               <div className="divide-y divide-slate-100">
// // //                 {formLines.map((l, i) => (
// // //                   <div
// // //                     key={l.productId}
// // //                     className={`transition-colors ${checks[i] ? 'bg-primary-50/60' : 'hover:bg-slate-50'}`}
// // //                   >
// // //                     {/* Checkbox row */}
// // //                     <label className="flex cursor-pointer items-start gap-3 px-4 py-4">
// // //                       <input
// // //                         type="checkbox"
// // //                         className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
// // //                         checked={!!checks[i]}
// // //                         onChange={(e) => toggleLine(i, e.target.checked)}
// // //                       />
// // //                       <div className="min-w-0 flex-1">
// // //                         <div className="flex items-start gap-2">
// // //                           <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
// // //                             {i + 1}
// // //                           </span>
// // //                           <div className="min-w-0 flex-1">
// // //                             <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
// // //                             <div className="text-xs text-slate-500">
// // //                               {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
// // //                             </div>
// // //                           </div>
// // //                         </div>
// // //                       </div>
// // //                     </label>

// // //                     {/* Qty input — only visible when checked */}
// // //                     {checks[i] && (
// // //                       <div className="px-4 pb-4">
// // //                         <Input
// // //                           label="Return qty (damaged / missing)"
// // //                           type="number"
// // //                           min={0}
// // //                           max={l.qty}
// // //                           value={damaged[l.productId] ?? '0'}
// // //                           onChange={(e) =>
// // //                             setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))
// // //                           }
// // //                         />
// // //                       </div>
// // //                     )}
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             </div>

// // //             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
// // //               Estimated damage: {previewTotals.damage.toFixed(2)} · Estimated missing:{' '}
// // //               {previewTotals.missing.toFixed(2)} (preview; server confirms on submit)
// // //             </div>

// // //             <Button
// // //               variant="success"
// // //               className="w-full"
// // //               loading={submitting}
// // //               disabled={submitting}
// // //               onClick={handleSubmit}
// // //             >
// // //               Submit return report
// // //             </Button>
// // //           </CardContent>
// // //         </Card>
// // //       </div>
// // //     </div>
// // //   )
// // // }

// // // import { useEffect, useMemo, useState } from 'react'
// // // import { useParams } from 'react-router-dom'
// // // import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// // // import { Button } from '../../components/ui/Button'
// // // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // // import { Input } from '../../components/ui/Input'
// // // import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// // // import { apiFetch } from '../../lib/api'

// // // type Line = {
// // //   productId: string
// // //   qty: number
// // //   particulars?: string
// // //   sku?: string
// // //   parsedRate?: number
// // // }

// // // type GetRes = {
// // //   deliveryNo: string
// // //   customerName: string
// // //   siteName?: string
// // //   status: string
// // //   challanNo?: string
// // //   vehicleLabel?: string
// // //   driverName?: string
// // //   driverPhone?: string
// // //   lines: Line[]
// // //   damageTotal?: number
// // //   missingTotal?: number
// // //   billerReturnSubmittedAt?: string
// // //   billerDamagedLines?: { productId: string; qty: number }[]
// // //   billerMissingLines?: { productId: string; qty: number }[]
// // //   canSubmit?: boolean
// // // }

// // // type Phase = 'form' | 'thankYou'

// // // const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

// // // function aggregateLines(lines: Line[]): Line[] {
// // //   const byProduct = new Map<string, Line>()
// // //   for (const l of lines) {
// // //     const existing = byProduct.get(l.productId)
// // //     if (existing) {
// // //       existing.qty += l.qty
// // //     } else {
// // //       byProduct.set(l.productId, { ...l })
// // //     }
// // //   }
// // //   return Array.from(byProduct.values())
// // // }

// // // export function PublicBillerReturnPage() {
// // //   const { token } = useParams()
// // //   const [data, setData] = useState<GetRes | null>(null)
// // //   console.log("datauuu",data);
  
// // //   const [phase, setPhase] = useState<Phase>('form')
// // //   const [error, setError] = useState<string | null>(null)
// // //   const [damaged, setDamaged] = useState<Record<string, string>>({})
// // //   const [missing, setMissing] = useState<Record<string, string>>({})
// // //   const [submitting, setSubmitting] = useState(false)

// // //   useEffect(() => {
// // //     if (!token) return
// // //     const t = decodeURIComponent(token)
// // //     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // //       .then((r) => {
// // //         setData(r)
// // //         setPhase('form')
// // //         // Start with zeros for all products
// // //         const z: Record<string, string> = {}
// // //         for (const l of aggregateLines(r.lines)) {
// // //           z[l.productId] = '0'
// // //         }
// // //         // Pre-fill with previously submitted values if any
// // //         const dmg = { ...z }
// // //         const miss = { ...z }
// // //         if (r.billerDamagedLines) {
// // //           for (const l of r.billerDamagedLines) dmg[l.productId] = String(l.qty)
// // //         }
// // //         if (r.billerMissingLines) {
// // //           for (const l of r.billerMissingLines) miss[l.productId] = String(l.qty)
// // //         }
// // //         setDamaged(dmg)
// // //         setMissing(miss)
// // //       })
// // //       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
// // //   }, [token])

// // //   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

// // //   const previewTotals = useMemo(() => {
// // //     if (!data) return { damage: 0, missing: 0 }
// // //     let damage = 0
// // //     let miss = 0
// // //     for (const l of formLines) {
// // //       const dq = Number(damaged[l.productId]) || 0
// // //       const mq = Number(missing[l.productId]) || 0
// // //       const rate = l.parsedRate ?? 0
// // //       damage += rate * dq
// // //       miss += rate * mq
// // //     }
// // //     return { damage, missing: miss }
// // //   }, [data, formLines, damaged, missing])

// // //   const handleSubmit = async () => {
// // //     if (!token || !data) return
// // //     const t = decodeURIComponent(token)
// // //     const damagedLines = formLines.map((l) => ({
// // //       productId: l.productId,
// // //       qty: Number(damaged[l.productId]) || 0,
// // //     }))
// // //     const missingLines = formLines.map((l) => ({
// // //       productId: l.productId,
// // //       qty: Number(missing[l.productId]) || 0,
// // //     }))
// // //     setSubmitting(true)
// // //     setError(null)
// // //     try {
// // //       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
// // //         method: 'POST',
// // //         body: JSON.stringify({
// // //           damagedLines: damagedLines.filter((x) => x.qty > 0),
// // //           missingLines: missingLines.filter((x) => x.qty > 0),
// // //         }),
// // //       })
// // //       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // //       setData(refreshed)
// // //       setPhase('thankYou')
// // //     } catch (e: unknown) {
// // //       const msg = (e as { message?: string })?.message || 'Submit failed'
// // //       setError(msg)
// // //     } finally {
// // //       setSubmitting(false)
// // //     }
// // //   }

// // //   if (error && !data) {
// // //     return (
// // //       <div className={pageShell}>
// // //         <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
// // //           {error}
// // //         </div>
// // //       </div>
// // //     )
// // //   }

// // //   if (!data) {
// // //     return (
// // //       <div className={pageShell}>
// // //         <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
// // //           <LoadingSpinner size="lg" className="text-primary-600" />
// // //           <p className="text-sm">Loading return form…</p>
// // //         </div>
// // //       </div>
// // //     )
// // //   }

// // //   const completionLines = formLines.map((l) => ({
// // //     productId: l.productId,
// // //     particulars: l.particulars,
// // //     sku: l.sku,
// // //     qty: l.qty,
// // //   }))

// // //   const damageDisplay =
// // //     data.damageTotal != null ? data.damageTotal.toFixed(2) : previewTotals.damage.toFixed(2)
// // //   const missingDisplay =
// // //     data.missingTotal != null ? data.missingTotal.toFixed(2) : previewTotals.missing.toFixed(2)

// // //   if (phase === 'thankYou') {
// // //     return (
// // //       <div className={pageShell}>
// // //         <PublicCompletionScreen
// // //           variant="thankYou"
// // //           statusLabel="Submitted"
// // //           title="Thank you!"
// // //           subtitle="Your return report has been submitted successfully."
// // //           deliveryNo={data.deliveryNo}
// // //           customerName={data.customerName}
// // //           meta={[
// // //             { label: 'Challan', value: data.challanNo || '—' },
// // //             { label: 'Site', value: data.siteName || '—' },
// // //             { label: 'Damage total', value: damageDisplay },
// // //             { label: 'Missing total', value: missingDisplay },
// // //           ]}
// // //           lines={completionLines}
// // //           completedAt={data.billerReturnSubmittedAt}
// // //           completedAtLabel="Submitted on"
// // //         />
// // //       </div>
// // //     )
// // //   }

// // //   return (
// // //     <div className={pageShell}>
// // //       <div className="mx-auto max-w-2xl space-y-4">
// // //         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
// // //           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
// // //           <div className="mt-1 text-sm text-slate-600">
// // //             {data.deliveryNo} · {data.customerName}
// // //           </div>
// // //           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
// // //             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
// // //             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
// // //             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
// // //             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
// // //           </div>
// // //           {data.billerReturnSubmittedAt ? (
// // //             <div className="mt-2 text-xs text-emerald-600 font-medium">
// // //               ✓ Previously submitted — you can re-submit to update
// // //             </div>
// // //           ) : null}
// // //         </div>

// // //         {error ? (
// // //           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
// // //         ) : null}

// // //         <Card>
// // //           <CardHeader>
// // //             <CardTitle>Return reconciliation</CardTitle>
// // //           </CardHeader>
// // //           <CardContent className="space-y-4">
// // //             <div className="text-sm text-slate-600">
// // //               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
// // //             </div>

// // //             <div className="space-y-4">
// // //               {formLines.map((l) => (
// // //                 <div key={l.productId} className="rounded-xl border border-slate-200 bg-white p-3">
// // //                   <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
// // //                   <div className="text-xs text-slate-500">
// // //                     {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
// // //                   </div>
// // //                   <div className="mt-2">
// // //                     <Input
// // //                       label="Return qty (damaged / missing)"
// // //                       type="number"
// // //                       min={0}
// // //                       max={l.qty}
// // //                       value={damaged[l.productId] ?? '0'}
// // //                       onChange={(e) => setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))}
// // //                     />
// // //                   </div>
// // //                 </div>
// // //               ))}
// // //             </div>

// // //             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
// // //               Estimated damage: {previewTotals.damage.toFixed(2)} · Estimated missing:{' '}
// // //               {previewTotals.missing.toFixed(2)} (preview; server confirms on submit)
// // //             </div>

// // //             <Button
// // //               variant="success"
// // //               className="w-full"
// // //               loading={submitting}
// // //               disabled={submitting}
// // //               onClick={handleSubmit}
// // //             >
// // //               Submit return report
// // //             </Button>
// // //           </CardContent>
// // //         </Card>
// // //       </div>
// // //     </div>
// // //   )
// // // }

// // import { useEffect, useMemo, useRef, useState } from 'react'
// // import { useParams } from 'react-router-dom'
// // import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// // import { Button } from '../../components/ui/Button'
// // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // import { Input } from '../../components/ui/Input'
// // import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// // import { apiFetch } from '../../lib/api'

// // type Line = {
// //   productId: string
// //   qty: number
// //   particulars?: string
// //   sku?: string
// //   parsedRate?: number
// // }

// // type PendingLine = { productId: string; qty: number }

// // type PendingSlot = 'MORNING' | 'AFTERNOON' | 'EVENING'

// // type GetRes = {
// //   deliveryNo: string
// //   customerName: string
// //   siteName?: string
// //   status: string
// //   challanNo?: string
// //   vehicleLabel?: string
// //   driverName?: string
// //   driverPhone?: string
// //   lines: Line[]
// //   damageTotal?: number
// //   missingTotal?: number
// //   billerReturnSubmittedAt?: string
// //   billerDamagedLines?: { productId: string; qty: number }[]
// //   billerMissingLines?: { productId: string; qty: number }[]
// //   billerCollectedLines?: { productId: string; qty: number }[]
// //   billerPendingReturnLines?: PendingLine[]
// //   billerPendingReturnAt?: string
// //   billerPendingReturnSlot?: PendingSlot
// //   billerPendingReturnNote?: string
// //   canSubmit?: boolean
// // }

// // // Converts an ISO datetime string to the value a <input type="date"> expects
// // // (local date, no time), or '' if not set.
// // function toDateValue(iso?: string): string {
// //   if (!iso) return ''
// //   const d = new Date(iso)
// //   if (Number.isNaN(d.getTime())) return ''
// //   const pad = (n: number) => String(n).padStart(2, '0')
// //   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
// // }

// // const SLOT_LABELS: Record<PendingSlot, string> = {
// //   MORNING: 'Morning',
// //   AFTERNOON: 'Afternoon',
// //   EVENING: 'Evening',
// // }

// // type SelectAllState = 'none' | 'some' | 'all'

// // function getSelectAllState(checks: boolean[]): SelectAllState {
// //   if (checks.length === 0) return 'none'
// //   const checked = checks.filter(Boolean).length
// //   if (checked === 0) return 'none'
// //   if (checked === checks.length) return 'all'
// //   return 'some'
// // }

// // type Phase = 'form' | 'thankYou'

// // const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

// // function aggregateLines(lines: Line[]): Line[] {
// //   const byProduct = new Map<string, Line>()
// //   for (const l of lines) {
// //     const existing = byProduct.get(l.productId)
// //     if (existing) {
// //       existing.qty += l.qty
// //     } else {
// //       byProduct.set(l.productId, { ...l })
// //     }
// //   }
// //   return Array.from(byProduct.values())
// // }

// // export function PublicBillerReturnPage() {
// //   const { token } = useParams()
// //   const [data, setData] = useState<GetRes | null>(null)
// //   const [phase, setPhase] = useState<Phase>('form')
// //   const [error, setError] = useState<string | null>(null)
// //   const [checks, setChecks] = useState<boolean[]>([])
// //   // Two separate quantities per product: how many are damaged/missing
// //   // (write-off, not restocked) and how many are being physically collected
// //   // back right now (restocked into the godown).
// //   const [damagedQty, setDamagedQty] = useState<Record<string, string>>({})
// //   const [collectedQty, setCollectedQty] = useState<Record<string, string>>({})
// //   const [pendingReturnDate, setPendingReturnDate] = useState<string>('')
// //   const [pendingReturnSlot, setPendingReturnSlot] = useState<PendingSlot | ''>('')
// //   const [pendingReturnNote, setPendingReturnNote] = useState<string>('')
// //   const [submitting, setSubmitting] = useState(false)
// //   const selectAllRef = useRef<HTMLInputElement>(null)

// //   useEffect(() => {
// //     if (!token) return
// //     const t = decodeURIComponent(token)
// //     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// //       .then((r) => {
// //         setData(r)
// //         setPhase('form')
// //         const agg = aggregateLines(r.lines)
// //         const z: Record<string, string> = {}
// //         for (const l of agg) z[l.productId] = '0'

// //         const dmg = { ...z }
// //         if (r.billerDamagedLines) {
// //           for (const l of r.billerDamagedLines) dmg[l.productId] = String((Number(dmg[l.productId]) || 0) + l.qty)
// //         }
// //         const col = { ...z }
// //         if (r.billerCollectedLines) {
// //           for (const l of r.billerCollectedLines) col[l.productId] = String((Number(col[l.productId]) || 0) + l.qty)
// //         }
// //         setDamagedQty(dmg)
// //         setCollectedQty(col)
// //         setPendingReturnDate(toDateValue(r.billerPendingReturnAt))
// //         setPendingReturnSlot(r.billerPendingReturnSlot || '')
// //         setPendingReturnNote(r.billerPendingReturnNote || '')

// //         // Pre-check products that already have a qty entered
// //         const preChecks = agg.map((l) => Number(dmg[l.productId]) > 0 || Number(col[l.productId]) > 0)
// //         setChecks(preChecks)
// //       })
// //       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
// //   }, [token])

// //   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

// //   // Sync indeterminate state on select-all checkbox
// //   useEffect(() => {
// //     if (!selectAllRef.current) return
// //     const state = getSelectAllState(checks)
// //     selectAllRef.current.indeterminate = state === 'some'
// //   }, [checks])

// //   const toggleLine = (index: number, checked: boolean) => {
// //     setChecks((prev) => {
// //       const next = [...prev]
// //       next[index] = checked
// //       return next
// //     })
// //     // Reset qty when unchecked
// //     if (!checked) {
// //       const productId = formLines[index]?.productId
// //       if (productId) {
// //         setDamagedQty((q) => ({ ...q, [productId]: '0' }))
// //         setCollectedQty((q) => ({ ...q, [productId]: '0' }))
// //       }
// //     }
// //   }

// //   const toggleSelectAll = () => {
// //     const state = getSelectAllState(checks)
// //     const next = state === 'all' ? checks.map(() => false) : checks.map(() => true)
// //     setChecks(next)
// //     // Reset qtys for unchecked items
// //     if (state === 'all') {
// //       const z: Record<string, string> = {}
// //       for (const l of formLines) z[l.productId] = '0'
// //       setDamagedQty(z)
// //       setCollectedQty(z)
// //     }
// //   }

// //   const previewTotals = useMemo(() => {
// //     if (!data) return { damage: 0, missing: 0, damagedQtyTotal: 0 }
// //     let damage = 0
// //     let damagedQtyTotal = 0
// //     for (const l of formLines) {
// //       const q = Number(damagedQty[l.productId]) || 0
// //       const rate = l.parsedRate ?? 0
// //       damage += rate * q
// //       damagedQtyTotal += q
// //     }
// //     return { damage, missing: 0, damagedQtyTotal }
// //   }, [data, formLines, damagedQty])

// //   // Whatever isn't reported as damaged/missing or collected now is still
// //   // outstanding with the customer — these are the items that need a
// //   // scheduled return date & time-of-day.
// //   const pendingSummary = useMemo(() => {
// //     const lines = formLines
// //       .map((l) => {
// //         const dq = Number(damagedQty[l.productId]) || 0
// //         const cq = Number(collectedQty[l.productId]) || 0
// //         const remaining = Math.max(0, l.qty - dq - cq)
// //         return { productId: l.productId, particulars: l.particulars, sku: l.sku, qty: remaining }
// //       })
// //       .filter((l) => l.qty > 0)
// //     const total = lines.reduce((s, l) => s + l.qty, 0)
// //     return { lines, total }
// //   }, [formLines, damagedQty, collectedQty])

// //   const handleSubmit = async () => {
// //     if (!token || !data) return
// //     if (pendingSummary.total > 0 && (!pendingReturnDate || !pendingReturnSlot)) {
// //       setError('Please choose a date and a time of day for when the remaining pending items will be returned.')
// //       return
// //     }
// //     const t = decodeURIComponent(token)
// //     const damagedLines = formLines.map((l) => ({
// //       productId: l.productId,
// //       qty: Number(damagedQty[l.productId]) || 0,
// //     }))
// //     const collectedLines = formLines.map((l) => ({
// //       productId: l.productId,
// //       qty: Number(collectedQty[l.productId]) || 0,
// //     }))
// //     setSubmitting(true)
// //     setError(null)
// //     try {
// //       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
// //         method: 'POST',
// //         body: JSON.stringify({
// //           damagedLines: damagedLines.filter((x) => x.qty > 0),
// //           collectedLines: collectedLines.filter((x) => x.qty > 0),
// //           pendingReturnDate: pendingReturnDate || undefined,
// //           pendingReturnSlot: pendingReturnSlot || undefined,
// //           pendingReturnNote: pendingReturnNote.trim() || undefined,
// //         }),
// //       })
// //       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// //       setData(refreshed)
// //       setPhase('thankYou')
// //     } catch (e: unknown) {
// //       const msg = (e as { message?: string })?.message || 'Submit failed'
// //       setError(msg)
// //     } finally {
// //       setSubmitting(false)
// //     }
// //   }

// //   if (error && !data) {
// //     return (
// //       <div className={pageShell}>
// //         <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
// //           {error}
// //         </div>
// //       </div>
// //     )
// //   }

// //   if (!data) {
// //     return (
// //       <div className={pageShell}>
// //         <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
// //           <LoadingSpinner size="lg" className="text-primary-600" />
// //           <p className="text-sm">Loading return form…</p>
// //         </div>
// //       </div>
// //     )
// //   }

// //   // Reflect the actual reported damaged/missing + collected qty per product
// //   // (not the originally dispatched qty) so the thank-you page matches what
// //   // was submitted.
// //   const reportedQtyByProduct = new Map<string, number>()
// //   for (const l of data.billerDamagedLines || []) {
// //     reportedQtyByProduct.set(l.productId, (reportedQtyByProduct.get(l.productId) || 0) + l.qty)
// //   }
// //   for (const l of data.billerCollectedLines || []) {
// //     reportedQtyByProduct.set(l.productId, (reportedQtyByProduct.get(l.productId) || 0) + l.qty)
// //   }
// //   const completionLines = formLines
// //     .map((l) => ({
// //       productId: l.productId,
// //       particulars: l.particulars,
// //       sku: l.sku,
// //       qty: reportedQtyByProduct.get(l.productId) || 0,
// //     }))
// //     .filter((l) => l.qty > 0)

// //   const damagedQtyTotal = (data.billerDamagedLines || []).reduce((s, l) => s + (Number(l.qty) || 0), 0)
// //   const pendingLinesDisplay = data.billerPendingReturnLines || []
// //   const pendingDueLabel = data.billerPendingReturnAt
// //     ? `${new Date(data.billerPendingReturnAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}${data.billerPendingReturnSlot ? ` · ${SLOT_LABELS[data.billerPendingReturnSlot]}` : ''}`
// //     : ''

// //   if (phase === 'thankYou') {
// //     return (
// //       <div className={pageShell}>
// //         <PublicCompletionScreen
// //           variant="thankYou"
// //           statusLabel="Submitted"
// //           title="Thank you!"
// //           subtitle="Your return report has been submitted successfully."
// //           deliveryNo={data.deliveryNo}
// //           customerName={data.customerName}
// //           meta={[
// //             { label: 'Challan', value: data.challanNo || '—' },
// //             { label: 'Site', value: data.siteName || '—' },
// //             { label: 'Delivery by', value: data.driverName || '—' },
// //             { label: 'Damage/Missing qty', value: String(damagedQtyTotal) },
// //             ...(pendingDueLabel
// //               ? [{ label: 'Pending items due back', value: pendingDueLabel }]
// //               : []),
// //           ]}
// //           lines={completionLines}
// //           completedAt={data.billerReturnSubmittedAt}
// //           completedAtLabel="Submitted on"
// //         />
// //         {pendingLinesDisplay.length > 0 ? (
// //           <div className="mx-auto mt-4 max-w-lg rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm">
// //             <div className="font-semibold text-amber-800">
// //               {pendingLinesDisplay.reduce((s, l) => s + l.qty, 0)} item(s) still with the customer
// //             </div>
// //             <div className="mt-1 text-amber-700">
// //               Expected back{pendingDueLabel ? ` on ${pendingDueLabel}` : ''}
// //               {data.billerPendingReturnNote ? ` · ${data.billerPendingReturnNote}` : ''}
// //             </div>
// //           </div>
// //         ) : null}
// //       </div>
// //     )
// //   }

// //   const lineCount = formLines.length
// //   const checkedCount = checks.filter(Boolean).length
// //   const selectAllState = getSelectAllState(checks)
// //   const progressPct = lineCount > 0 ? Math.round((checkedCount / lineCount) * 100) : 0

// //   return (
// //     <div className={pageShell}>
// //       <div className="mx-auto max-w-2xl space-y-4">
// //         {/* Header card */}
// //         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
// //           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
// //           <div className="mt-1 text-sm text-slate-600">
// //             {data.deliveryNo} · {data.customerName}
// //           </div>
// //           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
// //             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
// //             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
// //             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
// //             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
// //           </div>
// //           {data.billerReturnSubmittedAt ? (
// //             <div className="mt-2 text-xs text-emerald-600 font-medium">
// //               ✓ Previously submitted — you can re-submit to update
// //             </div>
// //           ) : null}
// //         </div>

// //         {error ? (
// //           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
// //         ) : null}

// //         <Card>
// //           <CardHeader>
// //             <div className="flex flex-wrap items-center justify-between gap-2">
// //               <CardTitle>Return reconciliation</CardTitle>
// //               <span className="text-sm font-medium text-slate-600">
// //                 {checkedCount} of {lineCount} selected
// //               </span>
// //             </div>
// //             {/* Progress bar */}
// //             <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
// //               <div
// //                 className="h-full rounded-full bg-primary-500 transition-all duration-300"
// //                 style={{ width: `${progressPct}%` }}
// //               />
// //             </div>
// //           </CardHeader>
// //           <CardContent className="space-y-4">
// //             <div className="text-sm text-slate-600">
// //               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
// //             </div>

// //             {/* Checklist with Select All */}
// //             <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
// //               {/* Select all row */}
// //               <label className="flex cursor-pointer items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5">
// //                 <input
// //                   ref={selectAllRef}
// //                   type="checkbox"
// //                   className="h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
// //                   checked={selectAllState === 'all'}
// //                   onChange={toggleSelectAll}
// //                 />
// //                 <div className="min-w-0 flex-1">
// //                   <div className="font-semibold text-slate-900">Select all</div>
// //                   <div className="text-xs text-slate-500">
// //                     {lineCount} item{lineCount === 1 ? '' : 's'}
// //                   </div>
// //                 </div>
// //               </label>

// //               {/* Per-product rows */}
// //               <div className="divide-y divide-slate-100">
// //                 {formLines.map((l, i) => (
// //                   <div
// //                     key={l.productId}
// //                     className={`transition-colors ${checks[i] ? 'bg-primary-50/60' : 'hover:bg-slate-50'}`}
// //                   >
// //                     {/* Checkbox row */}
// //                     <label className="flex cursor-pointer items-start gap-3 px-4 py-4">
// //                       <input
// //                         type="checkbox"
// //                         className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
// //                         checked={!!checks[i]}
// //                         onChange={(e) => toggleLine(i, e.target.checked)}
// //                       />
// //                       <div className="min-w-0 flex-1">
// //                         <div className="flex items-start gap-2">
// //                           <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
// //                             {i + 1}
// //                           </span>
// //                           <div className="min-w-0 flex-1">
// //                             <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
// //                             <div className="text-xs text-slate-500">
// //                               {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
// //                             </div>
// //                           </div>
// //                         </div>
// //                       </div>
// //                     </label>

// //                     {/* Qty inputs — only visible when checked */}
// //                     {checks[i] && (
// //                       <div className="px-4 pb-4">
// //                         <div className="grid grid-cols-2 gap-3">
// //                           <Input
// //                             label="Damage/Missing qty"
// //                             type="number"
// //                             min={0}
// //                             max={l.qty}
// //                             value={damagedQty[l.productId] ?? '0'}
// //                             onChange={(e) =>
// //                               setDamagedQty((q) => ({ ...q, [l.productId]: e.target.value }))
// //                             }
// //                           />
// //                           <Input
// //                             label="Collecting now qty"
// //                             type="number"
// //                             min={0}
// //                             max={l.qty}
// //                             value={collectedQty[l.productId] ?? '0'}
// //                             onChange={(e) =>
// //                               setCollectedQty((q) => ({ ...q, [l.productId]: e.target.value }))
// //                             }
// //                           />
// //                         </div>
// //                         {Math.max(0, l.qty - (Number(damagedQty[l.productId]) || 0) - (Number(collectedQty[l.productId]) || 0)) > 0 ? (
// //                           <p className="mt-1.5 text-xs font-medium text-amber-700">
// //                             {l.qty - (Number(damagedQty[l.productId]) || 0) - (Number(collectedQty[l.productId]) || 0)} qty
// //                             still with the customer — schedule its return below.
// //                           </p>
// //                         ) : null}
// //                       </div>
// //                     )}
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>

// //             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
// //               Damage/Missing qty: {previewTotals.damagedQtyTotal}
// //             </div>

// //             {/* Pending items — schedule when the rest will be returned */}
// //             {pendingSummary.total > 0 ? (
// //               <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
// //                 <div>
// //                   <div className="font-semibold text-amber-900">
// //                     {pendingSummary.total} item(s) still pending return
// //                   </div>
// //                   <ul className="mt-1 space-y-0.5 text-xs text-amber-800">
// //                     {pendingSummary.lines.map((l) => (
// //                       <li key={l.productId}>
// //                         {l.particulars || l.productId}
// //                         {l.sku ? ` (${l.sku})` : ''} — qty {l.qty}
// //                       </li>
// //                     ))}
// //                   </ul>
// //                 </div>
// //                 <div>
// //                   <label className="mb-1 block text-sm font-medium text-slate-700">
// //                     Expected return date
// //                   </label>
// //                   <input
// //                     type="date"
// //                     value={pendingReturnDate}
// //                     onChange={(e) => setPendingReturnDate(e.target.value)}
// //                     className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
// //                   />
// //                 </div>
// //                 <div>
// //                   <label className="mb-1 block text-sm font-medium text-slate-700">
// //                     Time of day
// //                   </label>
// //                   <div className="grid grid-cols-3 gap-2">
// //                     {(['MORNING', 'AFTERNOON', 'EVENING'] as const).map((slot) => (
// //                       <button
// //                         key={slot}
// //                         type="button"
// //                         onClick={() => setPendingReturnSlot(slot)}
// //                         className={
// //                           'h-10 rounded-lg border text-sm font-semibold transition ' +
// //                           (pendingReturnSlot === slot
// //                             ? 'border-primary-400 bg-primary-50 text-primary-800'
// //                             : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')
// //                         }
// //                       >
// //                         {SLOT_LABELS[slot]}
// //                       </button>
// //                     ))}
// //                   </div>
// //                 </div>
// //                 <div>
// //                   <Input
// //                     label="Note (optional)"
// //                     value={pendingReturnNote}
// //                     onChange={(e) => setPendingReturnNote(e.target.value)}
// //                     placeholder="e.g. will be sent back with the next delivery"
// //                   />
// //                 </div>
// //               </div>
// //             ) : null}

// //             <Button
// //               variant="success"
// //               className="w-full"
// //               loading={submitting}
// //               disabled={submitting}
// //               onClick={handleSubmit}
// //             >
// //               Submit return report
// //             </Button>
// //           </CardContent>
// //         </Card>
// //       </div>
// //     </div>
// //   )
// // }

// // // // import { useEffect, useMemo, useState } from 'react'
// // // // import { useParams } from 'react-router-dom'
// // // // import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// // // // import { Button } from '../../components/ui/Button'
// // // // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // // // import { Input } from '../../components/ui/Input'
// // // // import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// // // // import { apiFetch } from '../../lib/api'

// // // // type Line = {
// // // //   productId: string
// // // //   qty: number
// // // //   particulars?: string
// // // //   sku?: string
// // // //   parsedRate?: number
// // // // }

// // // // type GetRes = {
// // // //   deliveryNo: string
// // // //   customerName: string
// // // //   siteName?: string
// // // //   status: string
// // // //   challanNo?: string
// // // //   vehicleLabel?: string
// // // //   driverName?: string
// // // //   driverPhone?: string
// // // //   lines: Line[]
// // // //   damageTotal?: number
// // // //   missingTotal?: number
// // // //   billerReturnSubmittedAt?: string
// // // //   billerDamagedLines?: { productId: string; qty: number }[]
// // // //   billerMissingLines?: { productId: string; qty: number }[]
// // // //   canSubmit?: boolean
// // // // }

// // // // type Phase = 'form' | 'thankYou'

// // // // const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

// // // // function aggregateLines(lines: Line[]): Line[] {
// // // //   const byProduct = new Map<string, Line>()
// // // //   for (const l of lines) {
// // // //     const existing = byProduct.get(l.productId)
// // // //     if (existing) {
// // // //       existing.qty += l.qty
// // // //     } else {
// // // //       byProduct.set(l.productId, { ...l })
// // // //     }
// // // //   }
// // // //   return Array.from(byProduct.values())
// // // // }

// // // // export function PublicBillerReturnPage() {
// // // //   const { token } = useParams()
// // // //   const [data, setData] = useState<GetRes | null>(null)
// // // //   console.log("datauuu",data);
  
// // // //   const [phase, setPhase] = useState<Phase>('form')
// // // //   const [error, setError] = useState<string | null>(null)
// // // //   const [damaged, setDamaged] = useState<Record<string, string>>({})
// // // //   const [missing, setMissing] = useState<Record<string, string>>({})
// // // //   const [submitting, setSubmitting] = useState(false)

// // // //   useEffect(() => {
// // // //     if (!token) return
// // // //     const t = decodeURIComponent(token)
// // // //     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // // //       .then((r) => {
// // // //         setData(r)
// // // //         setPhase('form')
// // // //         // Start with zeros for all products
// // // //         const z: Record<string, string> = {}
// // // //         for (const l of aggregateLines(r.lines)) {
// // // //           z[l.productId] = '0'
// // // //         }
// // // //         // Pre-fill with previously submitted values if any
// // // //         const dmg = { ...z }
// // // //         const miss = { ...z }
// // // //         if (r.billerDamagedLines) {
// // // //           for (const l of r.billerDamagedLines) dmg[l.productId] = String(l.qty)
// // // //         }
// // // //         if (r.billerMissingLines) {
// // // //           for (const l of r.billerMissingLines) miss[l.productId] = String(l.qty)
// // // //         }
// // // //         setDamaged(dmg)
// // // //         setMissing(miss)
// // // //       })
// // // //       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
// // // //   }, [token])

// // // //   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

// // // //   const previewTotals = useMemo(() => {
// // // //     if (!data) return { damage: 0, missing: 0 }
// // // //     let damage = 0
// // // //     let miss = 0
// // // //     for (const l of formLines) {
// // // //       const dq = Number(damaged[l.productId]) || 0
// // // //       const mq = Number(missing[l.productId]) || 0
// // // //       const rate = l.parsedRate ?? 0
// // // //       damage += rate * dq
// // // //       miss += rate * mq
// // // //     }
// // // //     return { damage, missing: miss }
// // // //   }, [data, formLines, damaged, missing])

// // // //   const handleSubmit = async () => {
// // // //     if (!token || !data) return
// // // //     const t = decodeURIComponent(token)
// // // //     const damagedLines = formLines.map((l) => ({
// // // //       productId: l.productId,
// // // //       qty: Number(damaged[l.productId]) || 0,
// // // //     }))
// // // //     const missingLines = formLines.map((l) => ({
// // // //       productId: l.productId,
// // // //       qty: Number(missing[l.productId]) || 0,
// // // //     }))
// // // //     setSubmitting(true)
// // // //     setError(null)
// // // //     try {
// // // //       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
// // // //         method: 'POST',
// // // //         body: JSON.stringify({
// // // //           damagedLines: damagedLines.filter((x) => x.qty > 0),
// // // //           missingLines: missingLines.filter((x) => x.qty > 0),
// // // //         }),
// // // //       })
// // // //       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // // //       setData(refreshed)
// // // //       setPhase('thankYou')
// // // //     } catch (e: unknown) {
// // // //       const msg = (e as { message?: string })?.message || 'Submit failed'
// // // //       setError(msg)
// // // //     } finally {
// // // //       setSubmitting(false)
// // // //     }
// // // //   }

// // // //   if (error && !data) {
// // // //     return (
// // // //       <div className={pageShell}>
// // // //         <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
// // // //           {error}
// // // //         </div>
// // // //       </div>
// // // //     )
// // // //   }

// // // //   if (!data) {
// // // //     return (
// // // //       <div className={pageShell}>
// // // //         <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
// // // //           <LoadingSpinner size="lg" className="text-primary-600" />
// // // //           <p className="text-sm">Loading return form…</p>
// // // //         </div>
// // // //       </div>
// // // //     )
// // // //   }

// // // //   const completionLines = formLines.map((l) => ({
// // // //     productId: l.productId,
// // // //     particulars: l.particulars,
// // // //     sku: l.sku,
// // // //     qty: l.qty,
// // // //   }))

// // // //   const damageDisplay =
// // // //     data.damageTotal != null ? data.damageTotal.toFixed(2) : previewTotals.damage.toFixed(2)
// // // //   const missingDisplay =
// // // //     data.missingTotal != null ? data.missingTotal.toFixed(2) : previewTotals.missing.toFixed(2)

// // // //   if (phase === 'thankYou') {
// // // //     return (
// // // //       <div className={pageShell}>
// // // //         <PublicCompletionScreen
// // // //           variant="thankYou"
// // // //           statusLabel="Submitted"
// // // //           title="Thank you!"
// // // //           subtitle="Your return report has been submitted successfully."
// // // //           deliveryNo={data.deliveryNo}
// // // //           customerName={data.customerName}
// // // //           meta={[
// // // //             { label: 'Challan', value: data.challanNo || '—' },
// // // //             { label: 'Site', value: data.siteName || '—' },
// // // //             { label: 'Damage total', value: damageDisplay },
// // // //             { label: 'Missing total', value: missingDisplay },
// // // //           ]}
// // // //           lines={completionLines}
// // // //           completedAt={data.billerReturnSubmittedAt}
// // // //           completedAtLabel="Submitted on"
// // // //         />
// // // //       </div>
// // // //     )
// // // //   }

// // // //   return (
// // // //     <div className={pageShell}>
// // // //       <div className="mx-auto max-w-2xl space-y-4">
// // // //         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
// // // //           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
// // // //           <div className="mt-1 text-sm text-slate-600">
// // // //             {data.deliveryNo} · {data.customerName}
// // // //           </div>
// // // //           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
// // // //             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
// // // //             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
// // // //             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
// // // //             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
// // // //           </div>
// // // //           {data.billerReturnSubmittedAt ? (
// // // //             <div className="mt-2 text-xs text-emerald-600 font-medium">
// // // //               ✓ Previously submitted — you can re-submit to update
// // // //             </div>
// // // //           ) : null}
// // // //         </div>

// // // //         {error ? (
// // // //           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
// // // //         ) : null}

// // // //         <Card>
// // // //           <CardHeader>
// // // //             <CardTitle>Return reconciliation</CardTitle>
// // // //           </CardHeader>
// // // //           <CardContent className="space-y-4">
// // // //             <div className="text-sm text-slate-600">
// // // //               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
// // // //             </div>

// // // //             <div className="space-y-4">
// // // //               {formLines.map((l) => (
// // // //                 <div key={l.productId} className="rounded-xl border border-slate-200 bg-white p-3">
// // // //                   <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
// // // //                   <div className="text-xs text-slate-500">
// // // //                     {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
// // // //                   </div>
// // // //                   <div className="mt-2">
// // // //                     <Input
// // // //                       label="Return qty (damaged / missing)"
// // // //                       type="number"
// // // //                       min={0}
// // // //                       max={l.qty}
// // // //                       value={damaged[l.productId] ?? '0'}
// // // //                       onChange={(e) => setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))}
// // // //                     />
// // // //                   </div>
// // // //                 </div>
// // // //               ))}
// // // //             </div>

// // // //             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
// // // //               Estimated damage: {previewTotals.damage.toFixed(2)} · Estimated missing:{' '}
// // // //               {previewTotals.missing.toFixed(2)} (preview; server confirms on submit)
// // // //             </div>

// // // //             <Button
// // // //               variant="success"
// // // //               className="w-full"
// // // //               loading={submitting}
// // // //               disabled={submitting}
// // // //               onClick={handleSubmit}
// // // //             >
// // // //               Submit return report
// // // //             </Button>
// // // //           </CardContent>
// // // //         </Card>
// // // //       </div>
// // // //     </div>
// // // //   )
// // // // }

// // // import { useEffect, useMemo, useRef, useState } from 'react'
// // // import { useParams } from 'react-router-dom'
// // // import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// // // import { Button } from '../../components/ui/Button'
// // // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // // import { Input } from '../../components/ui/Input'
// // // import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// // // import { apiFetch } from '../../lib/api'

// // // type Line = {
// // //   productId: string
// // //   qty: number
// // //   particulars?: string
// // //   sku?: string
// // //   parsedRate?: number
// // // }

// // // type GetRes = {
// // //   deliveryNo: string
// // //   customerName: string
// // //   siteName?: string
// // //   status: string
// // //   challanNo?: string
// // //   vehicleLabel?: string
// // //   driverName?: string
// // //   driverPhone?: string
// // //   lines: Line[]
// // //   damageTotal?: number
// // //   missingTotal?: number
// // //   billerReturnSubmittedAt?: string
// // //   billerDamagedLines?: { productId: string; qty: number }[]
// // //   billerMissingLines?: { productId: string; qty: number }[]
// // //   canSubmit?: boolean
// // // }

// // // type SelectAllState = 'none' | 'some' | 'all'

// // // function getSelectAllState(checks: boolean[]): SelectAllState {
// // //   if (checks.length === 0) return 'none'
// // //   const checked = checks.filter(Boolean).length
// // //   if (checked === 0) return 'none'
// // //   if (checked === checks.length) return 'all'
// // //   return 'some'
// // // }

// // // type Phase = 'form' | 'thankYou'

// // // const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

// // // function aggregateLines(lines: Line[]): Line[] {
// // //   const byProduct = new Map<string, Line>()
// // //   for (const l of lines) {
// // //     const existing = byProduct.get(l.productId)
// // //     if (existing) {
// // //       existing.qty += l.qty
// // //     } else {
// // //       byProduct.set(l.productId, { ...l })
// // //     }
// // //   }
// // //   return Array.from(byProduct.values())
// // // }

// // // export function PublicBillerReturnPage() {
// // //   const { token } = useParams()
// // //   const [data, setData] = useState<GetRes | null>(null)
// // //   const [phase, setPhase] = useState<Phase>('form')
// // //   const [error, setError] = useState<string | null>(null)
// // //   const [checks, setChecks] = useState<boolean[]>([])
// // //   const [damaged, setDamaged] = useState<Record<string, string>>({})
// // //   const [missing, setMissing] = useState<Record<string, string>>({})
// // //   const [submitting, setSubmitting] = useState(false)
// // //   const selectAllRef = useRef<HTMLInputElement>(null)

// // //   useEffect(() => {
// // //     if (!token) return
// // //     const t = decodeURIComponent(token)
// // //     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // //       .then((r) => {
// // //         setData(r)
// // //         setPhase('form')
// // //         const agg = aggregateLines(r.lines)
// // //         const z: Record<string, string> = {}
// // //         for (const l of agg) z[l.productId] = '0'

// // //         const dmg = { ...z }
// // //         const miss = { ...z }
// // //         if (r.billerDamagedLines) {
// // //           for (const l of r.billerDamagedLines) dmg[l.productId] = String(l.qty)
// // //         }
// // //         if (r.billerMissingLines) {
// // //           for (const l of r.billerMissingLines) miss[l.productId] = String(l.qty)
// // //         }
// // //         setDamaged(dmg)
// // //         setMissing(miss)

// // //         // Pre-check products that already have a qty entered
// // //         const preChecks = agg.map(
// // //           (l) => Number(dmg[l.productId]) > 0 || Number(miss[l.productId]) > 0
// // //         )
// // //         setChecks(preChecks)
// // //       })
// // //       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
// // //   }, [token])

// // //   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

// // //   // Sync indeterminate state on select-all checkbox
// // //   useEffect(() => {
// // //     if (!selectAllRef.current) return
// // //     const state = getSelectAllState(checks)
// // //     selectAllRef.current.indeterminate = state === 'some'
// // //   }, [checks])

// // //   const toggleLine = (index: number, checked: boolean) => {
// // //     setChecks((prev) => {
// // //       const next = [...prev]
// // //       next[index] = checked
// // //       return next
// // //     })
// // //     // Reset qty when unchecked
// // //     if (!checked) {
// // //       const productId = formLines[index]?.productId
// // //       if (productId) {
// // //         setDamaged((d) => ({ ...d, [productId]: '0' }))
// // //         setMissing((m) => ({ ...m, [productId]: '0' }))
// // //       }
// // //     }
// // //   }

// // //   const toggleSelectAll = () => {
// // //     const state = getSelectAllState(checks)
// // //     const next = state === 'all' ? checks.map(() => false) : checks.map(() => true)
// // //     setChecks(next)
// // //     // Reset qtys for unchecked items
// // //     if (state === 'all') {
// // //       const z: Record<string, string> = {}
// // //       for (const l of formLines) z[l.productId] = '0'
// // //       setDamaged(z)
// // //       setMissing(z)
// // //     }
// // //   }

// // //   const previewTotals = useMemo(() => {
// // //     if (!data) return { damage: 0, missing: 0 }
// // //     let damage = 0
// // //     let miss = 0
// // //     for (const l of formLines) {
// // //       const dq = Number(damaged[l.productId]) || 0
// // //       const mq = Number(missing[l.productId]) || 0
// // //       const rate = l.parsedRate ?? 0
// // //       damage += rate * dq
// // //       miss += rate * mq
// // //     }
// // //     return { damage, missing: miss }
// // //   }, [data, formLines, damaged, missing])

// // //   const handleSubmit = async () => {
// // //     if (!token || !data) return
// // //     const t = decodeURIComponent(token)
// // //     const damagedLines = formLines.map((l) => ({
// // //       productId: l.productId,
// // //       qty: Number(damaged[l.productId]) || 0,
// // //     }))
// // //     const missingLines = formLines.map((l) => ({
// // //       productId: l.productId,
// // //       qty: Number(missing[l.productId]) || 0,
// // //     }))
// // //     setSubmitting(true)
// // //     setError(null)
// // //     try {
// // //       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
// // //         method: 'POST',
// // //         body: JSON.stringify({
// // //           damagedLines: damagedLines.filter((x) => x.qty > 0),
// // //           missingLines: missingLines.filter((x) => x.qty > 0),
// // //         }),
// // //       })
// // //       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // //       setData(refreshed)
// // //       setPhase('thankYou')
// // //     } catch (e: unknown) {
// // //       const msg = (e as { message?: string })?.message || 'Submit failed'
// // //       setError(msg)
// // //     } finally {
// // //       setSubmitting(false)
// // //     }
// // //   }

// // //   if (error && !data) {
// // //     return (
// // //       <div className={pageShell}>
// // //         <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
// // //           {error}
// // //         </div>
// // //       </div>
// // //     )
// // //   }

// // //   if (!data) {
// // //     return (
// // //       <div className={pageShell}>
// // //         <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
// // //           <LoadingSpinner size="lg" className="text-primary-600" />
// // //           <p className="text-sm">Loading return form…</p>
// // //         </div>
// // //       </div>
// // //     )
// // //   }

// // //   const completionLines = formLines.map((l) => ({
// // //     productId: l.productId,
// // //     particulars: l.particulars,
// // //     sku: l.sku,
// // //     qty: l.qty,
// // //   }))

// // //   const damageDisplay =
// // //     data.damageTotal != null ? data.damageTotal.toFixed(2) : previewTotals.damage.toFixed(2)
// // //   const missingDisplay =
// // //     data.missingTotal != null ? data.missingTotal.toFixed(2) : previewTotals.missing.toFixed(2)

// // //   if (phase === 'thankYou') {
// // //     return (
// // //       <div className={pageShell}>
// // //         <PublicCompletionScreen
// // //           variant="thankYou"
// // //           statusLabel="Submitted"
// // //           title="Thank you!"
// // //           subtitle="Your return report has been submitted successfully."
// // //           deliveryNo={data.deliveryNo}
// // //           customerName={data.customerName}
// // //           meta={[
// // //             { label: 'Challan', value: data.challanNo || '—' },
// // //             { label: 'Site', value: data.siteName || '—' },
// // //             { label: 'Damage total', value: damageDisplay },
// // //             { label: 'Missing total', value: missingDisplay },
// // //           ]}
// // //           lines={completionLines}
// // //           completedAt={data.billerReturnSubmittedAt}
// // //           completedAtLabel="Submitted on"
// // //         />
// // //       </div>
// // //     )
// // //   }

// // //   const lineCount = formLines.length
// // //   const checkedCount = checks.filter(Boolean).length
// // //   const selectAllState = getSelectAllState(checks)
// // //   const progressPct = lineCount > 0 ? Math.round((checkedCount / lineCount) * 100) : 0

// // //   return (
// // //     <div className={pageShell}>
// // //       <div className="mx-auto max-w-2xl space-y-4">
// // //         {/* Header card */}
// // //         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
// // //           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
// // //           <div className="mt-1 text-sm text-slate-600">
// // //             {data.deliveryNo} · {data.customerName}
// // //           </div>
// // //           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
// // //             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
// // //             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
// // //             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
// // //             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
// // //           </div>
// // //           {data.billerReturnSubmittedAt ? (
// // //             <div className="mt-2 text-xs text-emerald-600 font-medium">
// // //               ✓ Previously submitted — you can re-submit to update
// // //             </div>
// // //           ) : null}
// // //         </div>

// // //         {error ? (
// // //           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
// // //         ) : null}

// // //         <Card>
// // //           <CardHeader>
// // //             <div className="flex flex-wrap items-center justify-between gap-2">
// // //               <CardTitle>Return reconciliation</CardTitle>
// // //               <span className="text-sm font-medium text-slate-600">
// // //                 {checkedCount} of {lineCount} selected
// // //               </span>
// // //             </div>
// // //             {/* Progress bar */}
// // //             <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
// // //               <div
// // //                 className="h-full rounded-full bg-primary-500 transition-all duration-300"
// // //                 style={{ width: `${progressPct}%` }}
// // //               />
// // //             </div>
// // //           </CardHeader>
// // //           <CardContent className="space-y-4">
// // //             <div className="text-sm text-slate-600">
// // //               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
// // //             </div>

// // //             {/* Checklist with Select All */}
// // //             <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
// // //               {/* Select all row */}
// // //               <label className="flex cursor-pointer items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5">
// // //                 <input
// // //                   ref={selectAllRef}
// // //                   type="checkbox"
// // //                   className="h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
// // //                   checked={selectAllState === 'all'}
// // //                   onChange={toggleSelectAll}
// // //                 />
// // //                 <div className="min-w-0 flex-1">
// // //                   <div className="font-semibold text-slate-900">Select all</div>
// // //                   <div className="text-xs text-slate-500">
// // //                     {lineCount} item{lineCount === 1 ? '' : 's'}
// // //                   </div>
// // //                 </div>
// // //               </label>

// // //               {/* Per-product rows */}
// // //               <div className="divide-y divide-slate-100">
// // //                 {formLines.map((l, i) => (
// // //                   <div
// // //                     key={l.productId}
// // //                     className={`transition-colors ${checks[i] ? 'bg-primary-50/60' : 'hover:bg-slate-50'}`}
// // //                   >
// // //                     {/* Checkbox row */}
// // //                     <label className="flex cursor-pointer items-start gap-3 px-4 py-4">
// // //                       <input
// // //                         type="checkbox"
// // //                         className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
// // //                         checked={!!checks[i]}
// // //                         onChange={(e) => toggleLine(i, e.target.checked)}
// // //                       />
// // //                       <div className="min-w-0 flex-1">
// // //                         <div className="flex items-start gap-2">
// // //                           <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
// // //                             {i + 1}
// // //                           </span>
// // //                           <div className="min-w-0 flex-1">
// // //                             <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
// // //                             <div className="text-xs text-slate-500">
// // //                               {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
// // //                             </div>
// // //                           </div>
// // //                         </div>
// // //                       </div>
// // //                     </label>

// // //                     {/* Qty input — only visible when checked */}
// // //                     {checks[i] && (
// // //                       <div className="px-4 pb-4">
// // //                         <Input
// // //                           label="Return qty (damaged / missing)"
// // //                           type="number"
// // //                           min={0}
// // //                           max={l.qty}
// // //                           value={damaged[l.productId] ?? '0'}
// // //                           onChange={(e) =>
// // //                             setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))
// // //                           }
// // //                         />
// // //                       </div>
// // //                     )}
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             </div>

// // //             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
// // //               Estimated damage: {previewTotals.damage.toFixed(2)} · Estimated missing:{' '}
// // //               {previewTotals.missing.toFixed(2)} (preview; server confirms on submit)
// // //             </div>

// // //             <Button
// // //               variant="success"
// // //               className="w-full"
// // //               loading={submitting}
// // //               disabled={submitting}
// // //               onClick={handleSubmit}
// // //             >
// // //               Submit return report
// // //             </Button>
// // //           </CardContent>
// // //         </Card>
// // //       </div>
// // //     </div>
// // //   )
// // // }

// // // import { useEffect, useMemo, useState } from 'react'
// // // import { useParams } from 'react-router-dom'
// // // import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// // // import { Button } from '../../components/ui/Button'
// // // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // // import { Input } from '../../components/ui/Input'
// // // import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// // // import { apiFetch } from '../../lib/api'

// // // type Line = {
// // //   productId: string
// // //   qty: number
// // //   particulars?: string
// // //   sku?: string
// // //   parsedRate?: number
// // // }

// // // type GetRes = {
// // //   deliveryNo: string
// // //   customerName: string
// // //   siteName?: string
// // //   status: string
// // //   challanNo?: string
// // //   vehicleLabel?: string
// // //   driverName?: string
// // //   driverPhone?: string
// // //   lines: Line[]
// // //   damageTotal?: number
// // //   missingTotal?: number
// // //   billerReturnSubmittedAt?: string
// // //   billerDamagedLines?: { productId: string; qty: number }[]
// // //   billerMissingLines?: { productId: string; qty: number }[]
// // //   canSubmit?: boolean
// // // }

// // // type Phase = 'form' | 'thankYou'

// // // const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

// // // function aggregateLines(lines: Line[]): Line[] {
// // //   const byProduct = new Map<string, Line>()
// // //   for (const l of lines) {
// // //     const existing = byProduct.get(l.productId)
// // //     if (existing) {
// // //       existing.qty += l.qty
// // //     } else {
// // //       byProduct.set(l.productId, { ...l })
// // //     }
// // //   }
// // //   return Array.from(byProduct.values())
// // // }

// // // export function PublicBillerReturnPage() {
// // //   const { token } = useParams()
// // //   const [data, setData] = useState<GetRes | null>(null)
// // //   console.log("datauuu",data);
  
// // //   const [phase, setPhase] = useState<Phase>('form')
// // //   const [error, setError] = useState<string | null>(null)
// // //   const [damaged, setDamaged] = useState<Record<string, string>>({})
// // //   const [missing, setMissing] = useState<Record<string, string>>({})
// // //   const [submitting, setSubmitting] = useState(false)

// // //   useEffect(() => {
// // //     if (!token) return
// // //     const t = decodeURIComponent(token)
// // //     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // //       .then((r) => {
// // //         setData(r)
// // //         setPhase('form')
// // //         // Start with zeros for all products
// // //         const z: Record<string, string> = {}
// // //         for (const l of aggregateLines(r.lines)) {
// // //           z[l.productId] = '0'
// // //         }
// // //         // Pre-fill with previously submitted values if any
// // //         const dmg = { ...z }
// // //         const miss = { ...z }
// // //         if (r.billerDamagedLines) {
// // //           for (const l of r.billerDamagedLines) dmg[l.productId] = String(l.qty)
// // //         }
// // //         if (r.billerMissingLines) {
// // //           for (const l of r.billerMissingLines) miss[l.productId] = String(l.qty)
// // //         }
// // //         setDamaged(dmg)
// // //         setMissing(miss)
// // //       })
// // //       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
// // //   }, [token])

// // //   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

// // //   const previewTotals = useMemo(() => {
// // //     if (!data) return { damage: 0, missing: 0 }
// // //     let damage = 0
// // //     let miss = 0
// // //     for (const l of formLines) {
// // //       const dq = Number(damaged[l.productId]) || 0
// // //       const mq = Number(missing[l.productId]) || 0
// // //       const rate = l.parsedRate ?? 0
// // //       damage += rate * dq
// // //       miss += rate * mq
// // //     }
// // //     return { damage, missing: miss }
// // //   }, [data, formLines, damaged, missing])

// // //   const handleSubmit = async () => {
// // //     if (!token || !data) return
// // //     const t = decodeURIComponent(token)
// // //     const damagedLines = formLines.map((l) => ({
// // //       productId: l.productId,
// // //       qty: Number(damaged[l.productId]) || 0,
// // //     }))
// // //     const missingLines = formLines.map((l) => ({
// // //       productId: l.productId,
// // //       qty: Number(missing[l.productId]) || 0,
// // //     }))
// // //     setSubmitting(true)
// // //     setError(null)
// // //     try {
// // //       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
// // //         method: 'POST',
// // //         body: JSON.stringify({
// // //           damagedLines: damagedLines.filter((x) => x.qty > 0),
// // //           missingLines: missingLines.filter((x) => x.qty > 0),
// // //         }),
// // //       })
// // //       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // //       setData(refreshed)
// // //       setPhase('thankYou')
// // //     } catch (e: unknown) {
// // //       const msg = (e as { message?: string })?.message || 'Submit failed'
// // //       setError(msg)
// // //     } finally {
// // //       setSubmitting(false)
// // //     }
// // //   }

// // //   if (error && !data) {
// // //     return (
// // //       <div className={pageShell}>
// // //         <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
// // //           {error}
// // //         </div>
// // //       </div>
// // //     )
// // //   }

// // //   if (!data) {
// // //     return (
// // //       <div className={pageShell}>
// // //         <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
// // //           <LoadingSpinner size="lg" className="text-primary-600" />
// // //           <p className="text-sm">Loading return form…</p>
// // //         </div>
// // //       </div>
// // //     )
// // //   }

// // //   const completionLines = formLines.map((l) => ({
// // //     productId: l.productId,
// // //     particulars: l.particulars,
// // //     sku: l.sku,
// // //     qty: l.qty,
// // //   }))

// // //   const damageDisplay =
// // //     data.damageTotal != null ? data.damageTotal.toFixed(2) : previewTotals.damage.toFixed(2)
// // //   const missingDisplay =
// // //     data.missingTotal != null ? data.missingTotal.toFixed(2) : previewTotals.missing.toFixed(2)

// // //   if (phase === 'thankYou') {
// // //     return (
// // //       <div className={pageShell}>
// // //         <PublicCompletionScreen
// // //           variant="thankYou"
// // //           statusLabel="Submitted"
// // //           title="Thank you!"
// // //           subtitle="Your return report has been submitted successfully."
// // //           deliveryNo={data.deliveryNo}
// // //           customerName={data.customerName}
// // //           meta={[
// // //             { label: 'Challan', value: data.challanNo || '—' },
// // //             { label: 'Site', value: data.siteName || '—' },
// // //             { label: 'Damage total', value: damageDisplay },
// // //             { label: 'Missing total', value: missingDisplay },
// // //           ]}
// // //           lines={completionLines}
// // //           completedAt={data.billerReturnSubmittedAt}
// // //           completedAtLabel="Submitted on"
// // //         />
// // //       </div>
// // //     )
// // //   }

// // //   return (
// // //     <div className={pageShell}>
// // //       <div className="mx-auto max-w-2xl space-y-4">
// // //         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
// // //           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
// // //           <div className="mt-1 text-sm text-slate-600">
// // //             {data.deliveryNo} · {data.customerName}
// // //           </div>
// // //           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
// // //             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
// // //             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
// // //             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
// // //             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
// // //           </div>
// // //           {data.billerReturnSubmittedAt ? (
// // //             <div className="mt-2 text-xs text-emerald-600 font-medium">
// // //               ✓ Previously submitted — you can re-submit to update
// // //             </div>
// // //           ) : null}
// // //         </div>

// // //         {error ? (
// // //           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
// // //         ) : null}

// // //         <Card>
// // //           <CardHeader>
// // //             <CardTitle>Return reconciliation</CardTitle>
// // //           </CardHeader>
// // //           <CardContent className="space-y-4">
// // //             <div className="text-sm text-slate-600">
// // //               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
// // //             </div>

// // //             <div className="space-y-4">
// // //               {formLines.map((l) => (
// // //                 <div key={l.productId} className="rounded-xl border border-slate-200 bg-white p-3">
// // //                   <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
// // //                   <div className="text-xs text-slate-500">
// // //                     {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
// // //                   </div>
// // //                   <div className="mt-2">
// // //                     <Input
// // //                       label="Return qty (damaged / missing)"
// // //                       type="number"
// // //                       min={0}
// // //                       max={l.qty}
// // //                       value={damaged[l.productId] ?? '0'}
// // //                       onChange={(e) => setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))}
// // //                     />
// // //                   </div>
// // //                 </div>
// // //               ))}
// // //             </div>

// // //             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
// // //               Estimated damage: {previewTotals.damage.toFixed(2)} · Estimated missing:{' '}
// // //               {previewTotals.missing.toFixed(2)} (preview; server confirms on submit)
// // //             </div>

// // //             <Button
// // //               variant="success"
// // //               className="w-full"
// // //               loading={submitting}
// // //               disabled={submitting}
// // //               onClick={handleSubmit}
// // //             >
// // //               Submit return report
// // //             </Button>
// // //           </CardContent>
// // //         </Card>
// // //       </div>
// // //     </div>
// // //   )
// // // }

// // import { useEffect, useMemo, useRef, useState } from 'react'
// // import { useParams } from 'react-router-dom'
// // import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// // import { Button } from '../../components/ui/Button'
// // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // import { Input } from '../../components/ui/Input'
// // import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// // import { apiFetch } from '../../lib/api'

// // type Line = {
// //   productId: string
// //   qty: number
// //   particulars?: string
// //   sku?: string
// //   parsedRate?: number
// // }

// // type PendingLine = { productId: string; qty: number }

// // type PendingSlot = 'MORNING' | 'AFTERNOON' | 'EVENING'

// // type GetRes = {
// //   deliveryNo: string
// //   customerName: string
// //   siteName?: string
// //   status: string
// //   challanNo?: string
// //   vehicleLabel?: string
// //   driverName?: string
// //   driverPhone?: string
// //   lines: Line[]
// //   damageTotal?: number
// //   missingTotal?: number
// //   billerReturnSubmittedAt?: string
// //   billerDamagedLines?: { productId: string; qty: number }[]
// //   billerMissingLines?: { productId: string; qty: number }[]
// //   billerCollectedLines?: { productId: string; qty: number }[]
// //   billerPendingReturnLines?: PendingLine[]
// //   billerPendingReturnAt?: string
// //   billerPendingReturnSlot?: PendingSlot
// //   billerPendingReturnNote?: string
// //   canSubmit?: boolean
// // }

// // // Converts an ISO datetime string to the value a <input type="date"> expects
// // // (local date, no time), or '' if not set.
// // function toDateValue(iso?: string): string {
// //   if (!iso) return ''
// //   const d = new Date(iso)
// //   if (Number.isNaN(d.getTime())) return ''
// //   const pad = (n: number) => String(n).padStart(2, '0')
// //   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
// // }

// // const SLOT_LABELS: Record<PendingSlot, string> = {
// //   MORNING: 'Morning',
// //   AFTERNOON: 'Afternoon',
// //   EVENING: 'Evening',
// // }

// // type SelectAllState = 'none' | 'some' | 'all'

// // function getSelectAllState(checks: boolean[]): SelectAllState {
// //   if (checks.length === 0) return 'none'
// //   const checked = checks.filter(Boolean).length
// //   if (checked === 0) return 'none'
// //   if (checked === checks.length) return 'all'
// //   return 'some'
// // }

// // type Phase = 'form' | 'thankYou'

// // const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

// // function aggregateLines(lines: Line[]): Line[] {
// //   const byProduct = new Map<string, Line>()
// //   for (const l of lines) {
// //     const existing = byProduct.get(l.productId)
// //     if (existing) {
// //       existing.qty += l.qty
// //     } else {
// //       byProduct.set(l.productId, { ...l })
// //     }
// //   }
// //   return Array.from(byProduct.values())
// // }

// // export function PublicBillerReturnPage() {
// //   const { token } = useParams()
// //   const [data, setData] = useState<GetRes | null>(null)
// //   const [phase, setPhase] = useState<Phase>('form')
// //   const [error, setError] = useState<string | null>(null)
// //   const [checks, setChecks] = useState<boolean[]>([])
// //   // Two separate quantities per product: how many are damaged/missing
// //   // (write-off, not restocked) and how many are being physically collected
// //   // back right now (restocked into the godown).
// //   const [damagedQty, setDamagedQty] = useState<Record<string, string>>({})
// //   const [collectedQty, setCollectedQty] = useState<Record<string, string>>({})
// //   const [pendingReturnDate, setPendingReturnDate] = useState<string>('')
// //   const [pendingReturnSlot, setPendingReturnSlot] = useState<PendingSlot | ''>('')
// //   const [pendingReturnNote, setPendingReturnNote] = useState<string>('')
// //   const [submitting, setSubmitting] = useState(false)
// //   const selectAllRef = useRef<HTMLInputElement>(null)

// //   useEffect(() => {
// //     if (!token) return
// //     const t = decodeURIComponent(token)
// //     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// //       .then((r) => {
// //         setData(r)
// //         setPhase('form')
// //         const agg = aggregateLines(r.lines)
// //         const z: Record<string, string> = {}
// //         for (const l of agg) z[l.productId] = '0'

// //         const dmg = { ...z }
// //         if (r.billerDamagedLines) {
// //           for (const l of r.billerDamagedLines) dmg[l.productId] = String((Number(dmg[l.productId]) || 0) + l.qty)
// //         }
// //         const col = { ...z }
// //         if (r.billerCollectedLines) {
// //           for (const l of r.billerCollectedLines) col[l.productId] = String((Number(col[l.productId]) || 0) + l.qty)
// //         }
// //         setDamagedQty(dmg)
// //         setCollectedQty(col)
// //         setPendingReturnDate(toDateValue(r.billerPendingReturnAt))
// //         setPendingReturnSlot(r.billerPendingReturnSlot || '')
// //         setPendingReturnNote(r.billerPendingReturnNote || '')

// //         // Pre-check products that already have a qty entered
// //         const preChecks = agg.map((l) => Number(dmg[l.productId]) > 0 || Number(col[l.productId]) > 0)
// //         setChecks(preChecks)
// //       })
// //       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
// //   }, [token])

// //   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

// //   // Sync indeterminate state on select-all checkbox
// //   useEffect(() => {
// //     if (!selectAllRef.current) return
// //     const state = getSelectAllState(checks)
// //     selectAllRef.current.indeterminate = state === 'some'
// //   }, [checks])

// //   const toggleLine = (index: number, checked: boolean) => {
// //     setChecks((prev) => {
// //       const next = [...prev]
// //       next[index] = checked
// //       return next
// //     })
// //     // Reset qty when unchecked
// //     if (!checked) {
// //       const productId = formLines[index]?.productId
// //       if (productId) {
// //         setDamagedQty((q) => ({ ...q, [productId]: '0' }))
// //         setCollectedQty((q) => ({ ...q, [productId]: '0' }))
// //       }
// //     }
// //   }

// //   const toggleSelectAll = () => {
// //     const state = getSelectAllState(checks)
// //     const next = state === 'all' ? checks.map(() => false) : checks.map(() => true)
// //     setChecks(next)
// //     // Reset qtys for unchecked items
// //     if (state === 'all') {
// //       const z: Record<string, string> = {}
// //       for (const l of formLines) z[l.productId] = '0'
// //       setDamagedQty(z)
// //       setCollectedQty(z)
// //     }
// //   }

// //   const previewTotals = useMemo(() => {
// //     if (!data) return { damage: 0, missing: 0 }
// //     let damage = 0
// //     for (const l of formLines) {
// //       const q = Number(damagedQty[l.productId]) || 0
// //       const rate = l.parsedRate ?? 0
// //       damage += rate * q
// //     }
// //     return { damage, missing: 0 }
// //   }, [data, formLines, damagedQty])

// //   // Whatever isn't reported as damaged/missing or collected now is still
// //   // outstanding with the customer — these are the items that need a
// //   // scheduled return date & time-of-day.
// //   const pendingSummary = useMemo(() => {
// //     const lines = formLines
// //       .map((l) => {
// //         const dq = Number(damagedQty[l.productId]) || 0
// //         const cq = Number(collectedQty[l.productId]) || 0
// //         const remaining = Math.max(0, l.qty - dq - cq)
// //         return { productId: l.productId, particulars: l.particulars, sku: l.sku, qty: remaining }
// //       })
// //       .filter((l) => l.qty > 0)
// //     const total = lines.reduce((s, l) => s + l.qty, 0)
// //     return { lines, total }
// //   }, [formLines, damagedQty, collectedQty])

// //   const handleSubmit = async () => {
// //     if (!token || !data) return
// //     if (pendingSummary.total > 0 && (!pendingReturnDate || !pendingReturnSlot)) {
// //       setError('Please choose a date and a time of day for when the remaining pending items will be returned.')
// //       return
// //     }
// //     const t = decodeURIComponent(token)
// //     const damagedLines = formLines.map((l) => ({
// //       productId: l.productId,
// //       qty: Number(damagedQty[l.productId]) || 0,
// //     }))
// //     const collectedLines = formLines.map((l) => ({
// //       productId: l.productId,
// //       qty: Number(collectedQty[l.productId]) || 0,
// //     }))
// //     setSubmitting(true)
// //     setError(null)
// //     try {
// //       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
// //         method: 'POST',
// //         body: JSON.stringify({
// //           damagedLines: damagedLines.filter((x) => x.qty > 0),
// //           collectedLines: collectedLines.filter((x) => x.qty > 0),
// //           pendingReturnDate: pendingReturnDate || undefined,
// //           pendingReturnSlot: pendingReturnSlot || undefined,
// //           pendingReturnNote: pendingReturnNote.trim() || undefined,
// //         }),
// //       })
// //       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// //       setData(refreshed)
// //       setPhase('thankYou')
// //     } catch (e: unknown) {
// //       const msg = (e as { message?: string })?.message || 'Submit failed'
// //       setError(msg)
// //     } finally {
// //       setSubmitting(false)
// //     }
// //   }

// //   if (error && !data) {
// //     return (
// //       <div className={pageShell}>
// //         <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
// //           {error}
// //         </div>
// //       </div>
// //     )
// //   }

// //   if (!data) {
// //     return (
// //       <div className={pageShell}>
// //         <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
// //           <LoadingSpinner size="lg" className="text-primary-600" />
// //           <p className="text-sm">Loading return form…</p>
// //         </div>
// //       </div>
// //     )
// //   }

// //   // Reflect the actual reported damaged/missing + collected qty per product
// //   // (not the originally dispatched qty) so the thank-you page matches what
// //   // was submitted.
// //   const reportedQtyByProduct = new Map<string, number>()
// //   for (const l of data.billerDamagedLines || []) {
// //     reportedQtyByProduct.set(l.productId, (reportedQtyByProduct.get(l.productId) || 0) + l.qty)
// //   }
// //   for (const l of data.billerCollectedLines || []) {
// //     reportedQtyByProduct.set(l.productId, (reportedQtyByProduct.get(l.productId) || 0) + l.qty)
// //   }
// //   const completionLines = formLines
// //     .map((l) => ({
// //       productId: l.productId,
// //       particulars: l.particulars,
// //       sku: l.sku,
// //       qty: reportedQtyByProduct.get(l.productId) || 0,
// //     }))
// //     .filter((l) => l.qty > 0)

// //   const combinedTotal = (data.damageTotal ?? previewTotals.damage) + (data.missingTotal ?? 0)
// //   const pendingLinesDisplay = data.billerPendingReturnLines || []
// //   const pendingDueLabel = data.billerPendingReturnAt
// //     ? `${new Date(data.billerPendingReturnAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}${data.billerPendingReturnSlot ? ` · ${SLOT_LABELS[data.billerPendingReturnSlot]}` : ''}`
// //     : ''

// //   if (phase === 'thankYou') {
// //     return (
// //       <div className={pageShell}>
// //         <PublicCompletionScreen
// //           variant="thankYou"
// //           statusLabel="Submitted"
// //           title="Thank you!"
// //           subtitle="Your return report has been submitted successfully."
// //           deliveryNo={data.deliveryNo}
// //           customerName={data.customerName}
// //           meta={[
// //             { label: 'Challan', value: data.challanNo || '—' },
// //             { label: 'Site', value: data.siteName || '—' },
// //             { label: 'Delivery by', value: data.driverName || '—' },
// //             { label: 'Damage/Missing total', value: combinedTotal.toFixed(2) },
// //             ...(pendingDueLabel
// //               ? [{ label: 'Pending items due back', value: pendingDueLabel }]
// //               : []),
// //           ]}
// //           lines={completionLines}
// //           completedAt={data.billerReturnSubmittedAt}
// //           completedAtLabel="Submitted on"
// //         />
// //         {pendingLinesDisplay.length > 0 ? (
// //           <div className="mx-auto mt-4 max-w-lg rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm">
// //             <div className="font-semibold text-amber-800">
// //               {pendingLinesDisplay.reduce((s, l) => s + l.qty, 0)} item(s) still with the customer
// //             </div>
// //             <div className="mt-1 text-amber-700">
// //               Expected back{pendingDueLabel ? ` on ${pendingDueLabel}` : ''}
// //               {data.billerPendingReturnNote ? ` · ${data.billerPendingReturnNote}` : ''}
// //             </div>
// //           </div>
// //         ) : null}
// //       </div>
// //     )
// //   }

// //   const lineCount = formLines.length
// //   const checkedCount = checks.filter(Boolean).length
// //   const selectAllState = getSelectAllState(checks)
// //   const progressPct = lineCount > 0 ? Math.round((checkedCount / lineCount) * 100) : 0

// //   return (
// //     <div className={pageShell}>
// //       <div className="mx-auto max-w-2xl space-y-4">
// //         {/* Header card */}
// //         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
// //           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
// //           <div className="mt-1 text-sm text-slate-600">
// //             {data.deliveryNo} · {data.customerName}
// //           </div>
// //           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
// //             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
// //             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
// //             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
// //             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
// //           </div>
// //           {data.billerReturnSubmittedAt ? (
// //             <div className="mt-2 text-xs text-emerald-600 font-medium">
// //               ✓ Previously submitted — you can re-submit to update
// //             </div>
// //           ) : null}
// //         </div>

// //         {error ? (
// //           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
// //         ) : null}

// //         <Card>
// //           <CardHeader>
// //             <div className="flex flex-wrap items-center justify-between gap-2">
// //               <CardTitle>Return reconciliation</CardTitle>
// //               <span className="text-sm font-medium text-slate-600">
// //                 {checkedCount} of {lineCount} selected
// //               </span>
// //             </div>
// //             {/* Progress bar */}
// //             <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
// //               <div
// //                 className="h-full rounded-full bg-primary-500 transition-all duration-300"
// //                 style={{ width: `${progressPct}%` }}
// //               />
// //             </div>
// //           </CardHeader>
// //           <CardContent className="space-y-4">
// //             <div className="text-sm text-slate-600">
// //               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
// //             </div>

// //             {/* Checklist with Select All */}
// //             <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
// //               {/* Select all row */}
// //               <label className="flex cursor-pointer items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5">
// //                 <input
// //                   ref={selectAllRef}
// //                   type="checkbox"
// //                   className="h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
// //                   checked={selectAllState === 'all'}
// //                   onChange={toggleSelectAll}
// //                 />
// //                 <div className="min-w-0 flex-1">
// //                   <div className="font-semibold text-slate-900">Select all</div>
// //                   <div className="text-xs text-slate-500">
// //                     {lineCount} item{lineCount === 1 ? '' : 's'}
// //                   </div>
// //                 </div>
// //               </label>

// //               {/* Per-product rows */}
// //               <div className="divide-y divide-slate-100">
// //                 {formLines.map((l, i) => (
// //                   <div
// //                     key={l.productId}
// //                     className={`transition-colors ${checks[i] ? 'bg-primary-50/60' : 'hover:bg-slate-50'}`}
// //                   >
// //                     {/* Checkbox row */}
// //                     <label className="flex cursor-pointer items-start gap-3 px-4 py-4">
// //                       <input
// //                         type="checkbox"
// //                         className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
// //                         checked={!!checks[i]}
// //                         onChange={(e) => toggleLine(i, e.target.checked)}
// //                       />
// //                       <div className="min-w-0 flex-1">
// //                         <div className="flex items-start gap-2">
// //                           <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
// //                             {i + 1}
// //                           </span>
// //                           <div className="min-w-0 flex-1">
// //                             <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
// //                             <div className="text-xs text-slate-500">
// //                               {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
// //                             </div>
// //                           </div>
// //                         </div>
// //                       </div>
// //                     </label>

// //                     {/* Qty inputs — only visible when checked */}
// //                     {checks[i] && (
// //                       <div className="px-4 pb-4">
// //                         <div className="grid grid-cols-2 gap-3">
// //                           <Input
// //                             label="Damage/Missing qty"
// //                             type="number"
// //                             min={0}
// //                             max={l.qty}
// //                             value={damagedQty[l.productId] ?? '0'}
// //                             onChange={(e) =>
// //                               setDamagedQty((q) => ({ ...q, [l.productId]: e.target.value }))
// //                             }
// //                           />
// //                           <Input
// //                             label="Collecting now qty"
// //                             type="number"
// //                             min={0}
// //                             max={l.qty}
// //                             value={collectedQty[l.productId] ?? '0'}
// //                             onChange={(e) =>
// //                               setCollectedQty((q) => ({ ...q, [l.productId]: e.target.value }))
// //                             }
// //                           />
// //                         </div>
// //                         {Math.max(0, l.qty - (Number(damagedQty[l.productId]) || 0) - (Number(collectedQty[l.productId]) || 0)) > 0 ? (
// //                           <p className="mt-1.5 text-xs font-medium text-amber-700">
// //                             {l.qty - (Number(damagedQty[l.productId]) || 0) - (Number(collectedQty[l.productId]) || 0)} qty
// //                             still with the customer — schedule its return below.
// //                           </p>
// //                         ) : null}
// //                       </div>
// //                     )}
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>

// //             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
// //               Estimated damage/missing value: {previewTotals.damage.toFixed(2)} (preview; server
// //               confirms on submit)
// //             </div>

// //             {/* Pending items — schedule when the rest will be returned */}
// //             {pendingSummary.total > 0 ? (
// //               <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
// //                 <div>
// //                   <div className="font-semibold text-amber-900">
// //                     {pendingSummary.total} item(s) still pending return
// //                   </div>
// //                   <ul className="mt-1 space-y-0.5 text-xs text-amber-800">
// //                     {pendingSummary.lines.map((l) => (
// //                       <li key={l.productId}>
// //                         {l.particulars || l.productId}
// //                         {l.sku ? ` (${l.sku})` : ''} — qty {l.qty}
// //                       </li>
// //                     ))}
// //                   </ul>
// //                 </div>
// //                 <div>
// //                   <label className="mb-1 block text-sm font-medium text-slate-700">
// //                     Expected return date
// //                   </label>
// //                   <input
// //                     type="date"
// //                     value={pendingReturnDate}
// //                     onChange={(e) => setPendingReturnDate(e.target.value)}
// //                     className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
// //                   />
// //                 </div>
// //                 <div>
// //                   <label className="mb-1 block text-sm font-medium text-slate-700">
// //                     Time of day
// //                   </label>
// //                   <div className="grid grid-cols-3 gap-2">
// //                     {(['MORNING', 'AFTERNOON', 'EVENING'] as const).map((slot) => (
// //                       <button
// //                         key={slot}
// //                         type="button"
// //                         onClick={() => setPendingReturnSlot(slot)}
// //                         className={
// //                           'h-10 rounded-lg border text-sm font-semibold transition ' +
// //                           (pendingReturnSlot === slot
// //                             ? 'border-primary-400 bg-primary-50 text-primary-800'
// //                             : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')
// //                         }
// //                       >
// //                         {SLOT_LABELS[slot]}
// //                       </button>
// //                     ))}
// //                   </div>
// //                 </div>
// //                 <div>
// //                   <Input
// //                     label="Note (optional)"
// //                     value={pendingReturnNote}
// //                     onChange={(e) => setPendingReturnNote(e.target.value)}
// //                     placeholder="e.g. will be sent back with the next delivery"
// //                   />
// //                 </div>
// //               </div>
// //             ) : null}

// //             <Button
// //               variant="success"
// //               className="w-full"
// //               loading={submitting}
// //               disabled={submitting}
// //               onClick={handleSubmit}
// //             >
// //               Submit return report
// //             </Button>
// //           </CardContent>
// //         </Card>
// //       </div>
// //     </div>
// //   )
// // }

// // // import { useEffect, useMemo, useState } from 'react'
// // // import { useParams } from 'react-router-dom'
// // // import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// // // import { Button } from '../../components/ui/Button'
// // // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // // import { Input } from '../../components/ui/Input'
// // // import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// // // import { apiFetch } from '../../lib/api'

// // // type Line = {
// // //   productId: string
// // //   qty: number
// // //   particulars?: string
// // //   sku?: string
// // //   parsedRate?: number
// // // }

// // // type GetRes = {
// // //   deliveryNo: string
// // //   customerName: string
// // //   siteName?: string
// // //   status: string
// // //   challanNo?: string
// // //   vehicleLabel?: string
// // //   driverName?: string
// // //   driverPhone?: string
// // //   lines: Line[]
// // //   damageTotal?: number
// // //   missingTotal?: number
// // //   billerReturnSubmittedAt?: string
// // //   billerDamagedLines?: { productId: string; qty: number }[]
// // //   billerMissingLines?: { productId: string; qty: number }[]
// // //   canSubmit?: boolean
// // // }

// // // type Phase = 'form' | 'thankYou'

// // // const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

// // // function aggregateLines(lines: Line[]): Line[] {
// // //   const byProduct = new Map<string, Line>()
// // //   for (const l of lines) {
// // //     const existing = byProduct.get(l.productId)
// // //     if (existing) {
// // //       existing.qty += l.qty
// // //     } else {
// // //       byProduct.set(l.productId, { ...l })
// // //     }
// // //   }
// // //   return Array.from(byProduct.values())
// // // }

// // // export function PublicBillerReturnPage() {
// // //   const { token } = useParams()
// // //   const [data, setData] = useState<GetRes | null>(null)
// // //   console.log("datauuu",data);
  
// // //   const [phase, setPhase] = useState<Phase>('form')
// // //   const [error, setError] = useState<string | null>(null)
// // //   const [damaged, setDamaged] = useState<Record<string, string>>({})
// // //   const [missing, setMissing] = useState<Record<string, string>>({})
// // //   const [submitting, setSubmitting] = useState(false)

// // //   useEffect(() => {
// // //     if (!token) return
// // //     const t = decodeURIComponent(token)
// // //     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // //       .then((r) => {
// // //         setData(r)
// // //         setPhase('form')
// // //         // Start with zeros for all products
// // //         const z: Record<string, string> = {}
// // //         for (const l of aggregateLines(r.lines)) {
// // //           z[l.productId] = '0'
// // //         }
// // //         // Pre-fill with previously submitted values if any
// // //         const dmg = { ...z }
// // //         const miss = { ...z }
// // //         if (r.billerDamagedLines) {
// // //           for (const l of r.billerDamagedLines) dmg[l.productId] = String(l.qty)
// // //         }
// // //         if (r.billerMissingLines) {
// // //           for (const l of r.billerMissingLines) miss[l.productId] = String(l.qty)
// // //         }
// // //         setDamaged(dmg)
// // //         setMissing(miss)
// // //       })
// // //       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
// // //   }, [token])

// // //   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

// // //   const previewTotals = useMemo(() => {
// // //     if (!data) return { damage: 0, missing: 0 }
// // //     let damage = 0
// // //     let miss = 0
// // //     for (const l of formLines) {
// // //       const dq = Number(damaged[l.productId]) || 0
// // //       const mq = Number(missing[l.productId]) || 0
// // //       const rate = l.parsedRate ?? 0
// // //       damage += rate * dq
// // //       miss += rate * mq
// // //     }
// // //     return { damage, missing: miss }
// // //   }, [data, formLines, damaged, missing])

// // //   const handleSubmit = async () => {
// // //     if (!token || !data) return
// // //     const t = decodeURIComponent(token)
// // //     const damagedLines = formLines.map((l) => ({
// // //       productId: l.productId,
// // //       qty: Number(damaged[l.productId]) || 0,
// // //     }))
// // //     const missingLines = formLines.map((l) => ({
// // //       productId: l.productId,
// // //       qty: Number(missing[l.productId]) || 0,
// // //     }))
// // //     setSubmitting(true)
// // //     setError(null)
// // //     try {
// // //       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
// // //         method: 'POST',
// // //         body: JSON.stringify({
// // //           damagedLines: damagedLines.filter((x) => x.qty > 0),
// // //           missingLines: missingLines.filter((x) => x.qty > 0),
// // //         }),
// // //       })
// // //       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// // //       setData(refreshed)
// // //       setPhase('thankYou')
// // //     } catch (e: unknown) {
// // //       const msg = (e as { message?: string })?.message || 'Submit failed'
// // //       setError(msg)
// // //     } finally {
// // //       setSubmitting(false)
// // //     }
// // //   }

// // //   if (error && !data) {
// // //     return (
// // //       <div className={pageShell}>
// // //         <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
// // //           {error}
// // //         </div>
// // //       </div>
// // //     )
// // //   }

// // //   if (!data) {
// // //     return (
// // //       <div className={pageShell}>
// // //         <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
// // //           <LoadingSpinner size="lg" className="text-primary-600" />
// // //           <p className="text-sm">Loading return form…</p>
// // //         </div>
// // //       </div>
// // //     )
// // //   }

// // //   const completionLines = formLines.map((l) => ({
// // //     productId: l.productId,
// // //     particulars: l.particulars,
// // //     sku: l.sku,
// // //     qty: l.qty,
// // //   }))

// // //   const damageDisplay =
// // //     data.damageTotal != null ? data.damageTotal.toFixed(2) : previewTotals.damage.toFixed(2)
// // //   const missingDisplay =
// // //     data.missingTotal != null ? data.missingTotal.toFixed(2) : previewTotals.missing.toFixed(2)

// // //   if (phase === 'thankYou') {
// // //     return (
// // //       <div className={pageShell}>
// // //         <PublicCompletionScreen
// // //           variant="thankYou"
// // //           statusLabel="Submitted"
// // //           title="Thank you!"
// // //           subtitle="Your return report has been submitted successfully."
// // //           deliveryNo={data.deliveryNo}
// // //           customerName={data.customerName}
// // //           meta={[
// // //             { label: 'Challan', value: data.challanNo || '—' },
// // //             { label: 'Site', value: data.siteName || '—' },
// // //             { label: 'Damage total', value: damageDisplay },
// // //             { label: 'Missing total', value: missingDisplay },
// // //           ]}
// // //           lines={completionLines}
// // //           completedAt={data.billerReturnSubmittedAt}
// // //           completedAtLabel="Submitted on"
// // //         />
// // //       </div>
// // //     )
// // //   }

// // //   return (
// // //     <div className={pageShell}>
// // //       <div className="mx-auto max-w-2xl space-y-4">
// // //         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
// // //           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
// // //           <div className="mt-1 text-sm text-slate-600">
// // //             {data.deliveryNo} · {data.customerName}
// // //           </div>
// // //           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
// // //             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
// // //             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
// // //             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
// // //             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
// // //           </div>
// // //           {data.billerReturnSubmittedAt ? (
// // //             <div className="mt-2 text-xs text-emerald-600 font-medium">
// // //               ✓ Previously submitted — you can re-submit to update
// // //             </div>
// // //           ) : null}
// // //         </div>

// // //         {error ? (
// // //           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
// // //         ) : null}

// // //         <Card>
// // //           <CardHeader>
// // //             <CardTitle>Return reconciliation</CardTitle>
// // //           </CardHeader>
// // //           <CardContent className="space-y-4">
// // //             <div className="text-sm text-slate-600">
// // //               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
// // //             </div>

// // //             <div className="space-y-4">
// // //               {formLines.map((l) => (
// // //                 <div key={l.productId} className="rounded-xl border border-slate-200 bg-white p-3">
// // //                   <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
// // //                   <div className="text-xs text-slate-500">
// // //                     {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
// // //                   </div>
// // //                   <div className="mt-2">
// // //                     <Input
// // //                       label="Return qty (damaged / missing)"
// // //                       type="number"
// // //                       min={0}
// // //                       max={l.qty}
// // //                       value={damaged[l.productId] ?? '0'}
// // //                       onChange={(e) => setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))}
// // //                     />
// // //                   </div>
// // //                 </div>
// // //               ))}
// // //             </div>

// // //             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
// // //               Estimated damage: {previewTotals.damage.toFixed(2)} · Estimated missing:{' '}
// // //               {previewTotals.missing.toFixed(2)} (preview; server confirms on submit)
// // //             </div>

// // //             <Button
// // //               variant="success"
// // //               className="w-full"
// // //               loading={submitting}
// // //               disabled={submitting}
// // //               onClick={handleSubmit}
// // //             >
// // //               Submit return report
// // //             </Button>
// // //           </CardContent>
// // //         </Card>
// // //       </div>
// // //     </div>
// // //   )
// // // }

// // import { useEffect, useMemo, useRef, useState } from 'react'
// // import { useParams } from 'react-router-dom'
// // import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// // import { Button } from '../../components/ui/Button'
// // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // import { Input } from '../../components/ui/Input'
// // import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// // import { apiFetch } from '../../lib/api'

// // type Line = {
// //   productId: string
// //   qty: number
// //   particulars?: string
// //   sku?: string
// //   parsedRate?: number
// // }

// // type GetRes = {
// //   deliveryNo: string
// //   customerName: string
// //   siteName?: string
// //   status: string
// //   challanNo?: string
// //   vehicleLabel?: string
// //   driverName?: string
// //   driverPhone?: string
// //   lines: Line[]
// //   damageTotal?: number
// //   missingTotal?: number
// //   billerReturnSubmittedAt?: string
// //   billerDamagedLines?: { productId: string; qty: number }[]
// //   billerMissingLines?: { productId: string; qty: number }[]
// //   canSubmit?: boolean
// // }

// // type SelectAllState = 'none' | 'some' | 'all'

// // function getSelectAllState(checks: boolean[]): SelectAllState {
// //   if (checks.length === 0) return 'none'
// //   const checked = checks.filter(Boolean).length
// //   if (checked === 0) return 'none'
// //   if (checked === checks.length) return 'all'
// //   return 'some'
// // }

// // type Phase = 'form' | 'thankYou'

// // const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

// // function aggregateLines(lines: Line[]): Line[] {
// //   const byProduct = new Map<string, Line>()
// //   for (const l of lines) {
// //     const existing = byProduct.get(l.productId)
// //     if (existing) {
// //       existing.qty += l.qty
// //     } else {
// //       byProduct.set(l.productId, { ...l })
// //     }
// //   }
// //   return Array.from(byProduct.values())
// // }

// // export function PublicBillerReturnPage() {
// //   const { token } = useParams()
// //   const [data, setData] = useState<GetRes | null>(null)
// //   const [phase, setPhase] = useState<Phase>('form')
// //   const [error, setError] = useState<string | null>(null)
// //   const [checks, setChecks] = useState<boolean[]>([])
// //   const [damaged, setDamaged] = useState<Record<string, string>>({})
// //   const [missing, setMissing] = useState<Record<string, string>>({})
// //   const [submitting, setSubmitting] = useState(false)
// //   const selectAllRef = useRef<HTMLInputElement>(null)

// //   useEffect(() => {
// //     if (!token) return
// //     const t = decodeURIComponent(token)
// //     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// //       .then((r) => {
// //         setData(r)
// //         setPhase('form')
// //         const agg = aggregateLines(r.lines)
// //         const z: Record<string, string> = {}
// //         for (const l of agg) z[l.productId] = '0'

// //         const dmg = { ...z }
// //         const miss = { ...z }
// //         if (r.billerDamagedLines) {
// //           for (const l of r.billerDamagedLines) dmg[l.productId] = String(l.qty)
// //         }
// //         if (r.billerMissingLines) {
// //           for (const l of r.billerMissingLines) miss[l.productId] = String(l.qty)
// //         }
// //         setDamaged(dmg)
// //         setMissing(miss)

// //         // Pre-check products that already have a qty entered
// //         const preChecks = agg.map(
// //           (l) => Number(dmg[l.productId]) > 0 || Number(miss[l.productId]) > 0
// //         )
// //         setChecks(preChecks)
// //       })
// //       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
// //   }, [token])

// //   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

// //   // Sync indeterminate state on select-all checkbox
// //   useEffect(() => {
// //     if (!selectAllRef.current) return
// //     const state = getSelectAllState(checks)
// //     selectAllRef.current.indeterminate = state === 'some'
// //   }, [checks])

// //   const toggleLine = (index: number, checked: boolean) => {
// //     setChecks((prev) => {
// //       const next = [...prev]
// //       next[index] = checked
// //       return next
// //     })
// //     // Reset qty when unchecked
// //     if (!checked) {
// //       const productId = formLines[index]?.productId
// //       if (productId) {
// //         setDamaged((d) => ({ ...d, [productId]: '0' }))
// //         setMissing((m) => ({ ...m, [productId]: '0' }))
// //       }
// //     }
// //   }

// //   const toggleSelectAll = () => {
// //     const state = getSelectAllState(checks)
// //     const next = state === 'all' ? checks.map(() => false) : checks.map(() => true)
// //     setChecks(next)
// //     // Reset qtys for unchecked items
// //     if (state === 'all') {
// //       const z: Record<string, string> = {}
// //       for (const l of formLines) z[l.productId] = '0'
// //       setDamaged(z)
// //       setMissing(z)
// //     }
// //   }

// //   const previewTotals = useMemo(() => {
// //     if (!data) return { damage: 0, missing: 0 }
// //     let damage = 0
// //     let miss = 0
// //     for (const l of formLines) {
// //       const dq = Number(damaged[l.productId]) || 0
// //       const mq = Number(missing[l.productId]) || 0
// //       const rate = l.parsedRate ?? 0
// //       damage += rate * dq
// //       miss += rate * mq
// //     }
// //     return { damage, missing: miss }
// //   }, [data, formLines, damaged, missing])

// //   const handleSubmit = async () => {
// //     if (!token || !data) return
// //     const t = decodeURIComponent(token)
// //     const damagedLines = formLines.map((l) => ({
// //       productId: l.productId,
// //       qty: Number(damaged[l.productId]) || 0,
// //     }))
// //     const missingLines = formLines.map((l) => ({
// //       productId: l.productId,
// //       qty: Number(missing[l.productId]) || 0,
// //     }))
// //     setSubmitting(true)
// //     setError(null)
// //     try {
// //       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
// //         method: 'POST',
// //         body: JSON.stringify({
// //           damagedLines: damagedLines.filter((x) => x.qty > 0),
// //           missingLines: missingLines.filter((x) => x.qty > 0),
// //         }),
// //       })
// //       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// //       setData(refreshed)
// //       setPhase('thankYou')
// //     } catch (e: unknown) {
// //       const msg = (e as { message?: string })?.message || 'Submit failed'
// //       setError(msg)
// //     } finally {
// //       setSubmitting(false)
// //     }
// //   }

// //   if (error && !data) {
// //     return (
// //       <div className={pageShell}>
// //         <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
// //           {error}
// //         </div>
// //       </div>
// //     )
// //   }

// //   if (!data) {
// //     return (
// //       <div className={pageShell}>
// //         <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
// //           <LoadingSpinner size="lg" className="text-primary-600" />
// //           <p className="text-sm">Loading return form…</p>
// //         </div>
// //       </div>
// //     )
// //   }

// //   const completionLines = formLines.map((l) => ({
// //     productId: l.productId,
// //     particulars: l.particulars,
// //     sku: l.sku,
// //     qty: l.qty,
// //   }))

// //   const damageDisplay =
// //     data.damageTotal != null ? data.damageTotal.toFixed(2) : previewTotals.damage.toFixed(2)
// //   const missingDisplay =
// //     data.missingTotal != null ? data.missingTotal.toFixed(2) : previewTotals.missing.toFixed(2)

// //   if (phase === 'thankYou') {
// //     return (
// //       <div className={pageShell}>
// //         <PublicCompletionScreen
// //           variant="thankYou"
// //           statusLabel="Submitted"
// //           title="Thank you!"
// //           subtitle="Your return report has been submitted successfully."
// //           deliveryNo={data.deliveryNo}
// //           customerName={data.customerName}
// //           meta={[
// //             { label: 'Challan', value: data.challanNo || '—' },
// //             { label: 'Site', value: data.siteName || '—' },
// //             { label: 'Damage total', value: damageDisplay },
// //             { label: 'Missing total', value: missingDisplay },
// //           ]}
// //           lines={completionLines}
// //           completedAt={data.billerReturnSubmittedAt}
// //           completedAtLabel="Submitted on"
// //         />
// //       </div>
// //     )
// //   }

// //   const lineCount = formLines.length
// //   const checkedCount = checks.filter(Boolean).length
// //   const selectAllState = getSelectAllState(checks)
// //   const progressPct = lineCount > 0 ? Math.round((checkedCount / lineCount) * 100) : 0

// //   return (
// //     <div className={pageShell}>
// //       <div className="mx-auto max-w-2xl space-y-4">
// //         {/* Header card */}
// //         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
// //           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
// //           <div className="mt-1 text-sm text-slate-600">
// //             {data.deliveryNo} · {data.customerName}
// //           </div>
// //           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
// //             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
// //             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
// //             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
// //             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
// //           </div>
// //           {data.billerReturnSubmittedAt ? (
// //             <div className="mt-2 text-xs text-emerald-600 font-medium">
// //               ✓ Previously submitted — you can re-submit to update
// //             </div>
// //           ) : null}
// //         </div>

// //         {error ? (
// //           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
// //         ) : null}

// //         <Card>
// //           <CardHeader>
// //             <div className="flex flex-wrap items-center justify-between gap-2">
// //               <CardTitle>Return reconciliation</CardTitle>
// //               <span className="text-sm font-medium text-slate-600">
// //                 {checkedCount} of {lineCount} selected
// //               </span>
// //             </div>
// //             {/* Progress bar */}
// //             <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
// //               <div
// //                 className="h-full rounded-full bg-primary-500 transition-all duration-300"
// //                 style={{ width: `${progressPct}%` }}
// //               />
// //             </div>
// //           </CardHeader>
// //           <CardContent className="space-y-4">
// //             <div className="text-sm text-slate-600">
// //               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
// //             </div>

// //             {/* Checklist with Select All */}
// //             <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
// //               {/* Select all row */}
// //               <label className="flex cursor-pointer items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5">
// //                 <input
// //                   ref={selectAllRef}
// //                   type="checkbox"
// //                   className="h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
// //                   checked={selectAllState === 'all'}
// //                   onChange={toggleSelectAll}
// //                 />
// //                 <div className="min-w-0 flex-1">
// //                   <div className="font-semibold text-slate-900">Select all</div>
// //                   <div className="text-xs text-slate-500">
// //                     {lineCount} item{lineCount === 1 ? '' : 's'}
// //                   </div>
// //                 </div>
// //               </label>

// //               {/* Per-product rows */}
// //               <div className="divide-y divide-slate-100">
// //                 {formLines.map((l, i) => (
// //                   <div
// //                     key={l.productId}
// //                     className={`transition-colors ${checks[i] ? 'bg-primary-50/60' : 'hover:bg-slate-50'}`}
// //                   >
// //                     {/* Checkbox row */}
// //                     <label className="flex cursor-pointer items-start gap-3 px-4 py-4">
// //                       <input
// //                         type="checkbox"
// //                         className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
// //                         checked={!!checks[i]}
// //                         onChange={(e) => toggleLine(i, e.target.checked)}
// //                       />
// //                       <div className="min-w-0 flex-1">
// //                         <div className="flex items-start gap-2">
// //                           <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
// //                             {i + 1}
// //                           </span>
// //                           <div className="min-w-0 flex-1">
// //                             <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
// //                             <div className="text-xs text-slate-500">
// //                               {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
// //                             </div>
// //                           </div>
// //                         </div>
// //                       </div>
// //                     </label>

// //                     {/* Qty input — only visible when checked */}
// //                     {checks[i] && (
// //                       <div className="px-4 pb-4">
// //                         <Input
// //                           label="Return qty (damaged / missing)"
// //                           type="number"
// //                           min={0}
// //                           max={l.qty}
// //                           value={damaged[l.productId] ?? '0'}
// //                           onChange={(e) =>
// //                             setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))
// //                           }
// //                         />
// //                       </div>
// //                     )}
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>

// //             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
// //               Estimated damage: {previewTotals.damage.toFixed(2)} · Estimated missing:{' '}
// //               {previewTotals.missing.toFixed(2)} (preview; server confirms on submit)
// //             </div>

// //             <Button
// //               variant="success"
// //               className="w-full"
// //               loading={submitting}
// //               disabled={submitting}
// //               onClick={handleSubmit}
// //             >
// //               Submit return report
// //             </Button>
// //           </CardContent>
// //         </Card>
// //       </div>
// //     </div>
// //   )
// // }

// // import { useEffect, useMemo, useState } from 'react'
// // import { useParams } from 'react-router-dom'
// // import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// // import { Button } from '../../components/ui/Button'
// // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // import { Input } from '../../components/ui/Input'
// // import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// // import { apiFetch } from '../../lib/api'

// // type Line = {
// //   productId: string
// //   qty: number
// //   particulars?: string
// //   sku?: string
// //   parsedRate?: number
// // }

// // type GetRes = {
// //   deliveryNo: string
// //   customerName: string
// //   siteName?: string
// //   status: string
// //   challanNo?: string
// //   vehicleLabel?: string
// //   driverName?: string
// //   driverPhone?: string
// //   lines: Line[]
// //   damageTotal?: number
// //   missingTotal?: number
// //   billerReturnSubmittedAt?: string
// //   billerDamagedLines?: { productId: string; qty: number }[]
// //   billerMissingLines?: { productId: string; qty: number }[]
// //   canSubmit?: boolean
// // }

// // type Phase = 'form' | 'thankYou'

// // const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

// // function aggregateLines(lines: Line[]): Line[] {
// //   const byProduct = new Map<string, Line>()
// //   for (const l of lines) {
// //     const existing = byProduct.get(l.productId)
// //     if (existing) {
// //       existing.qty += l.qty
// //     } else {
// //       byProduct.set(l.productId, { ...l })
// //     }
// //   }
// //   return Array.from(byProduct.values())
// // }

// // export function PublicBillerReturnPage() {
// //   const { token } = useParams()
// //   const [data, setData] = useState<GetRes | null>(null)
// //   console.log("datauuu",data);
  
// //   const [phase, setPhase] = useState<Phase>('form')
// //   const [error, setError] = useState<string | null>(null)
// //   const [damaged, setDamaged] = useState<Record<string, string>>({})
// //   const [missing, setMissing] = useState<Record<string, string>>({})
// //   const [submitting, setSubmitting] = useState(false)

// //   useEffect(() => {
// //     if (!token) return
// //     const t = decodeURIComponent(token)
// //     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// //       .then((r) => {
// //         setData(r)
// //         setPhase('form')
// //         // Start with zeros for all products
// //         const z: Record<string, string> = {}
// //         for (const l of aggregateLines(r.lines)) {
// //           z[l.productId] = '0'
// //         }
// //         // Pre-fill with previously submitted values if any
// //         const dmg = { ...z }
// //         const miss = { ...z }
// //         if (r.billerDamagedLines) {
// //           for (const l of r.billerDamagedLines) dmg[l.productId] = String(l.qty)
// //         }
// //         if (r.billerMissingLines) {
// //           for (const l of r.billerMissingLines) miss[l.productId] = String(l.qty)
// //         }
// //         setDamaged(dmg)
// //         setMissing(miss)
// //       })
// //       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
// //   }, [token])

// //   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

// //   const previewTotals = useMemo(() => {
// //     if (!data) return { damage: 0, missing: 0 }
// //     let damage = 0
// //     let miss = 0
// //     for (const l of formLines) {
// //       const dq = Number(damaged[l.productId]) || 0
// //       const mq = Number(missing[l.productId]) || 0
// //       const rate = l.parsedRate ?? 0
// //       damage += rate * dq
// //       miss += rate * mq
// //     }
// //     return { damage, missing: miss }
// //   }, [data, formLines, damaged, missing])

// //   const handleSubmit = async () => {
// //     if (!token || !data) return
// //     const t = decodeURIComponent(token)
// //     const damagedLines = formLines.map((l) => ({
// //       productId: l.productId,
// //       qty: Number(damaged[l.productId]) || 0,
// //     }))
// //     const missingLines = formLines.map((l) => ({
// //       productId: l.productId,
// //       qty: Number(missing[l.productId]) || 0,
// //     }))
// //     setSubmitting(true)
// //     setError(null)
// //     try {
// //       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
// //         method: 'POST',
// //         body: JSON.stringify({
// //           damagedLines: damagedLines.filter((x) => x.qty > 0),
// //           missingLines: missingLines.filter((x) => x.qty > 0),
// //         }),
// //       })
// //       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// //       setData(refreshed)
// //       setPhase('thankYou')
// //     } catch (e: unknown) {
// //       const msg = (e as { message?: string })?.message || 'Submit failed'
// //       setError(msg)
// //     } finally {
// //       setSubmitting(false)
// //     }
// //   }

// //   if (error && !data) {
// //     return (
// //       <div className={pageShell}>
// //         <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
// //           {error}
// //         </div>
// //       </div>
// //     )
// //   }

// //   if (!data) {
// //     return (
// //       <div className={pageShell}>
// //         <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
// //           <LoadingSpinner size="lg" className="text-primary-600" />
// //           <p className="text-sm">Loading return form…</p>
// //         </div>
// //       </div>
// //     )
// //   }

// //   const completionLines = formLines.map((l) => ({
// //     productId: l.productId,
// //     particulars: l.particulars,
// //     sku: l.sku,
// //     qty: l.qty,
// //   }))

// //   const damageDisplay =
// //     data.damageTotal != null ? data.damageTotal.toFixed(2) : previewTotals.damage.toFixed(2)
// //   const missingDisplay =
// //     data.missingTotal != null ? data.missingTotal.toFixed(2) : previewTotals.missing.toFixed(2)

// //   if (phase === 'thankYou') {
// //     return (
// //       <div className={pageShell}>
// //         <PublicCompletionScreen
// //           variant="thankYou"
// //           statusLabel="Submitted"
// //           title="Thank you!"
// //           subtitle="Your return report has been submitted successfully."
// //           deliveryNo={data.deliveryNo}
// //           customerName={data.customerName}
// //           meta={[
// //             { label: 'Challan', value: data.challanNo || '—' },
// //             { label: 'Site', value: data.siteName || '—' },
// //             { label: 'Damage total', value: damageDisplay },
// //             { label: 'Missing total', value: missingDisplay },
// //           ]}
// //           lines={completionLines}
// //           completedAt={data.billerReturnSubmittedAt}
// //           completedAtLabel="Submitted on"
// //         />
// //       </div>
// //     )
// //   }

// //   return (
// //     <div className={pageShell}>
// //       <div className="mx-auto max-w-2xl space-y-4">
// //         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
// //           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
// //           <div className="mt-1 text-sm text-slate-600">
// //             {data.deliveryNo} · {data.customerName}
// //           </div>
// //           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
// //             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
// //             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
// //             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
// //             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
// //           </div>
// //           {data.billerReturnSubmittedAt ? (
// //             <div className="mt-2 text-xs text-emerald-600 font-medium">
// //               ✓ Previously submitted — you can re-submit to update
// //             </div>
// //           ) : null}
// //         </div>

// //         {error ? (
// //           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
// //         ) : null}

// //         <Card>
// //           <CardHeader>
// //             <CardTitle>Return reconciliation</CardTitle>
// //           </CardHeader>
// //           <CardContent className="space-y-4">
// //             <div className="text-sm text-slate-600">
// //               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
// //             </div>

// //             <div className="space-y-4">
// //               {formLines.map((l) => (
// //                 <div key={l.productId} className="rounded-xl border border-slate-200 bg-white p-3">
// //                   <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
// //                   <div className="text-xs text-slate-500">
// //                     {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
// //                   </div>
// //                   <div className="mt-2">
// //                     <Input
// //                       label="Return qty (damaged / missing)"
// //                       type="number"
// //                       min={0}
// //                       max={l.qty}
// //                       value={damaged[l.productId] ?? '0'}
// //                       onChange={(e) => setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))}
// //                     />
// //                   </div>
// //                 </div>
// //               ))}
// //             </div>

// //             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
// //               Estimated damage: {previewTotals.damage.toFixed(2)} · Estimated missing:{' '}
// //               {previewTotals.missing.toFixed(2)} (preview; server confirms on submit)
// //             </div>

// //             <Button
// //               variant="success"
// //               className="w-full"
// //               loading={submitting}
// //               disabled={submitting}
// //               onClick={handleSubmit}
// //             >
// //               Submit return report
// //             </Button>
// //           </CardContent>
// //         </Card>
// //       </div>
// //     </div>
// //   )
// // }

// import { useEffect, useMemo, useRef, useState } from 'react'
// import { useParams } from 'react-router-dom'
// import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
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
//   parsedRate?: number
// }

// type PendingLine = { productId: string; qty: number }

// type PendingSlot = 'MORNING' | 'AFTERNOON' | 'EVENING'

// type GetRes = {
//   deliveryNo: string
//   customerName: string
//   siteName?: string
//   status: string
//   challanNo?: string
//   vehicleLabel?: string
//   driverName?: string
//   driverPhone?: string
//   lines: Line[]
//   damageTotal?: number
//   missingTotal?: number
//   billerReturnSubmittedAt?: string
//   billerDamagedLines?: { productId: string; qty: number }[]
//   billerMissingLines?: { productId: string; qty: number }[]
//   billerCollectedLines?: { productId: string; qty: number }[]
//   billerPendingReturnLines?: PendingLine[]
//   billerPendingReturnAt?: string
//   billerPendingReturnSlot?: PendingSlot
//   billerPendingReturnNote?: string
//   billingType?: 'FREE' | 'INVOICE'
//   invoiceNo?: string
//   invoiceAmount?: string
//   billedAt?: string
//   canSubmit?: boolean
// }

// // Converts an ISO datetime string to the value a <input type="date"> expects
// // (local date, no time), or '' if not set.
// function toDateValue(iso?: string): string {
//   if (!iso) return ''
//   const d = new Date(iso)
//   if (Number.isNaN(d.getTime())) return ''
//   const pad = (n: number) => String(n).padStart(2, '0')
//   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
// }

// const SLOT_LABELS: Record<PendingSlot, string> = {
//   MORNING: 'Morning',
//   AFTERNOON: 'Afternoon',
//   EVENING: 'Evening',
// }

// type SelectAllState = 'none' | 'some' | 'all'

// function getSelectAllState(checks: boolean[]): SelectAllState {
//   if (checks.length === 0) return 'none'
//   const checked = checks.filter(Boolean).length
//   if (checked === 0) return 'none'
//   if (checked === checks.length) return 'all'
//   return 'some'
// }

// type Phase = 'form' | 'thankYou'

// const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

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
//   const [checks, setChecks] = useState<boolean[]>([])
//   // Two separate quantities per product: how many are damaged/missing
//   // (write-off, not restocked) and how many are being physically collected
//   // back right now (restocked into the godown).
//   const [damagedQty, setDamagedQty] = useState<Record<string, string>>({})
//   const [collectedQty, setCollectedQty] = useState<Record<string, string>>({})
//   const [pendingReturnDate, setPendingReturnDate] = useState<string>('')
//   const [pendingReturnSlot, setPendingReturnSlot] = useState<PendingSlot | ''>('')
//   const [pendingReturnNote, setPendingReturnNote] = useState<string>('')
//   const [submitting, setSubmitting] = useState(false)
//   const selectAllRef = useRef<HTMLInputElement>(null)

//   useEffect(() => {
//     if (!token) return
//     const t = decodeURIComponent(token)
//     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
//       .then((r) => {
//         setData(r)
//         setPhase('form')
//         const agg = aggregateLines(r.lines)
//         const z: Record<string, string> = {}
//         for (const l of agg) z[l.productId] = '0'

//         const dmg = { ...z }
//         if (r.billerDamagedLines) {
//           for (const l of r.billerDamagedLines) dmg[l.productId] = String((Number(dmg[l.productId]) || 0) + l.qty)
//         }
//         const col = { ...z }
//         if (r.billerCollectedLines) {
//           for (const l of r.billerCollectedLines) col[l.productId] = String((Number(col[l.productId]) || 0) + l.qty)
//         }
//         setDamagedQty(dmg)
//         setCollectedQty(col)
//         setPendingReturnDate(toDateValue(r.billerPendingReturnAt))
//         setPendingReturnSlot(r.billerPendingReturnSlot || '')
//         setPendingReturnNote(r.billerPendingReturnNote || '')

//         // Pre-check products that already have a qty entered
//         const preChecks = agg.map((l) => Number(dmg[l.productId]) > 0 || Number(col[l.productId]) > 0)
//         setChecks(preChecks)
//       })
//       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
//   }, [token])

//   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

//   // Sync indeterminate state on select-all checkbox
//   useEffect(() => {
//     if (!selectAllRef.current) return
//     const state = getSelectAllState(checks)
//     selectAllRef.current.indeterminate = state === 'some'
//   }, [checks])

//   const toggleLine = (index: number, checked: boolean) => {
//     setChecks((prev) => {
//       const next = [...prev]
//       next[index] = checked
//       return next
//     })
//     // Reset qty when unchecked
//     if (!checked) {
//       const productId = formLines[index]?.productId
//       if (productId) {
//         setDamagedQty((q) => ({ ...q, [productId]: '0' }))
//         setCollectedQty((q) => ({ ...q, [productId]: '0' }))
//       }
//     }
//   }

//   const toggleSelectAll = () => {
//     const state = getSelectAllState(checks)
//     const next = state === 'all' ? checks.map(() => false) : checks.map(() => true)
//     setChecks(next)
//     // Reset qtys for unchecked items
//     if (state === 'all') {
//       const z: Record<string, string> = {}
//       for (const l of formLines) z[l.productId] = '0'
//       setDamagedQty(z)
//       setCollectedQty(z)
//     }
//   }

//   const previewTotals = useMemo(() => {
//     if (!data) return { damage: 0, missing: 0, damagedQtyTotal: 0 }
//     let damage = 0
//     let damagedQtyTotal = 0
//     for (const l of formLines) {
//       const q = Number(damagedQty[l.productId]) || 0
//       const rate = l.parsedRate ?? 0
//       damage += rate * q
//       damagedQtyTotal += q
//     }
//     return { damage, missing: 0, damagedQtyTotal }
//   }, [data, formLines, damagedQty])

//   // Whatever isn't reported as damaged/missing or collected now is still
//   // outstanding with the customer — these are the items that need a
//   // scheduled return date & time-of-day.
//   const pendingSummary = useMemo(() => {
//     const lines = formLines
//       .map((l) => {
//         const dq = Number(damagedQty[l.productId]) || 0
//         const cq = Number(collectedQty[l.productId]) || 0
//         const remaining = Math.max(0, l.qty - dq - cq)
//         return { productId: l.productId, particulars: l.particulars, sku: l.sku, qty: remaining }
//       })
//       .filter((l) => l.qty > 0)
//     const total = lines.reduce((s, l) => s + l.qty, 0)
//     return { lines, total }
//   }, [formLines, damagedQty, collectedQty])

//   const handleSubmit = async () => {
//     if (!token || !data) return
//     if (pendingSummary.total > 0 && (!pendingReturnDate || !pendingReturnSlot)) {
//       setError('Please choose a date and a time of day for when the remaining pending items will be returned.')
//       return
//     }
//     const t = decodeURIComponent(token)
//     const damagedLines = formLines.map((l) => ({
//       productId: l.productId,
//       qty: Number(damagedQty[l.productId]) || 0,
//     }))
//     const collectedLines = formLines.map((l) => ({
//       productId: l.productId,
//       qty: Number(collectedQty[l.productId]) || 0,
//     }))
//     setSubmitting(true)
//     setError(null)
//     try {
//       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
//         method: 'POST',
//         body: JSON.stringify({
//           damagedLines: damagedLines.filter((x) => x.qty > 0),
//           collectedLines: collectedLines.filter((x) => x.qty > 0),
//           pendingReturnDate: pendingReturnDate || undefined,
//           pendingReturnSlot: pendingReturnSlot || undefined,
//           pendingReturnNote: pendingReturnNote.trim() || undefined,
//         }),
//       })
//       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
//       setData(refreshed)
//       setPhase('thankYou')
//     } catch (e: unknown) {
//       const msg = (e as { message?: string })?.message || 'Submit failed'
//       setError(msg)
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

//   // Reflect the actual reported damaged/missing + collected qty per product
//   // (not the originally dispatched qty) so the thank-you page matches what
//   // was submitted.
//   const reportedQtyByProduct = new Map<string, number>()
//   for (const l of data.billerDamagedLines || []) {
//     reportedQtyByProduct.set(l.productId, (reportedQtyByProduct.get(l.productId) || 0) + l.qty)
//   }
//   for (const l of data.billerCollectedLines || []) {
//     reportedQtyByProduct.set(l.productId, (reportedQtyByProduct.get(l.productId) || 0) + l.qty)
//   }
//   const completionLines = formLines
//     .map((l) => ({
//       productId: l.productId,
//       particulars: l.particulars,
//       sku: l.sku,
//       qty: reportedQtyByProduct.get(l.productId) || 0,
//     }))
//     .filter((l) => l.qty > 0)

//   const damagedQtyTotal = (data.billerDamagedLines || []).reduce((s, l) => s + (Number(l.qty) || 0), 0)
//   const pendingLinesDisplay = data.billerPendingReturnLines || []
//   const pendingDueLabel = data.billerPendingReturnAt
//     ? `${new Date(data.billerPendingReturnAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}${data.billerPendingReturnSlot ? ` · ${SLOT_LABELS[data.billerPendingReturnSlot]}` : ''}`
//     : ''

//   if (phase === 'thankYou') {
//     return (
//       <div className={pageShell}>
//         <PublicCompletionScreen
//           variant="thankYou"
//           statusLabel="Submitted"
//           title="Thank you!"
//           subtitle="Your return report has been submitted successfully."
//           deliveryNo={data.deliveryNo}
//           customerName={data.customerName}
//           meta={[
//             { label: 'Challan', value: data.challanNo || '—' },
//             { label: 'Site', value: data.siteName || '—' },
//             { label: 'Delivery by', value: data.driverName || '—' },
//             { label: 'Damage/Missing qty', value: String(damagedQtyTotal) },
//             ...(data.billingType
//               ? [{
//                   label: 'Billing',
//                   value: data.billingType === 'FREE' ? 'Billed Free' : `Invoice ${data.invoiceNo || ''}`.trim(),
//                 }]
//               : []),
//             ...(pendingDueLabel
//               ? [{ label: 'Pending items due back', value: pendingDueLabel }]
//               : []),
//           ]}
//           lines={completionLines}
//           completedAt={data.billerReturnSubmittedAt}
//           completedAtLabel="Submitted on"
//         />
//         {pendingLinesDisplay.length > 0 ? (
//           <div className="mx-auto mt-4 max-w-lg rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm">
//             <div className="font-semibold text-amber-800">
//               {pendingLinesDisplay.reduce((s, l) => s + l.qty, 0)} item(s) still with the customer
//             </div>
//             <div className="mt-1 text-amber-700">
//               Expected back{pendingDueLabel ? ` on ${pendingDueLabel}` : ''}
//               {data.billerPendingReturnNote ? ` · ${data.billerPendingReturnNote}` : ''}
//             </div>
//           </div>
//         ) : null}
//       </div>
//     )
//   }

//   const lineCount = formLines.length
//   const checkedCount = checks.filter(Boolean).length
//   const selectAllState = getSelectAllState(checks)
//   const progressPct = lineCount > 0 ? Math.round((checkedCount / lineCount) * 100) : 0

//   return (
//     <div className={pageShell}>
//       <div className="mx-auto max-w-2xl space-y-4">
//         {/* Header card */}
//         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
//           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
//           <div className="mt-1 text-sm text-slate-600">
//             {data.deliveryNo} · {data.customerName}
//           </div>
//           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
//             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
//             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
//             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
//             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
//           </div>
//           {data.billerReturnSubmittedAt ? (
//             <div className="mt-2 text-xs text-emerald-600 font-medium">
//               ✓ Previously submitted — you can re-submit to update
//             </div>
//           ) : null}
//         </div>

//         {error ? (
//           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
//         ) : null}

//         <Card>
//           <CardHeader>
//             <div className="flex flex-wrap items-center justify-between gap-2">
//               <CardTitle>Return reconciliation</CardTitle>
//               <span className="text-sm font-medium text-slate-600">
//                 {checkedCount} of {lineCount} selected
//               </span>
//             </div>
//             {/* Progress bar */}
//             <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
//               <div
//                 className="h-full rounded-full bg-primary-500 transition-all duration-300"
//                 style={{ width: `${progressPct}%` }}
//               />
//             </div>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="text-sm text-slate-600">
//               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
//             </div>

//             {/* Checklist with Select All */}
//             <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
//               {/* Select all row */}
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

//               {/* Per-product rows */}
//               <div className="divide-y divide-slate-100">
//                 {formLines.map((l, i) => (
//                   <div
//                     key={l.productId}
//                     className={`transition-colors ${checks[i] ? 'bg-primary-50/60' : 'hover:bg-slate-50'}`}
//                   >
//                     {/* Checkbox row */}
//                     <label className="flex cursor-pointer items-start gap-3 px-4 py-4">
//                       <input
//                         type="checkbox"
//                         className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
//                         checked={!!checks[i]}
//                         onChange={(e) => toggleLine(i, e.target.checked)}
//                       />
//                       <div className="min-w-0 flex-1">
//                         <div className="flex items-start gap-2">
//                           <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
//                             {i + 1}
//                           </span>
//                           <div className="min-w-0 flex-1">
//                             <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
//                             <div className="text-xs text-slate-500">
//                               {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </label>

//                     {/* Qty inputs — only visible when checked */}
//                     {checks[i] && (
//                       <div className="px-4 pb-4">
//                         <div className="grid grid-cols-2 gap-3">
//                           <Input
//                             label="Damage/Missing qty"
//                             type="number"
//                             min={0}
//                             max={l.qty}
//                             value={damagedQty[l.productId] ?? '0'}
//                             onChange={(e) =>
//                               setDamagedQty((q) => ({ ...q, [l.productId]: e.target.value }))
//                             }
//                           />
//                           <Input
//                             label="Collecting now qty"
//                             type="number"
//                             min={0}
//                             max={l.qty}
//                             value={collectedQty[l.productId] ?? '0'}
//                             onChange={(e) =>
//                               setCollectedQty((q) => ({ ...q, [l.productId]: e.target.value }))
//                             }
//                           />
//                         </div>
//                         {Math.max(0, l.qty - (Number(damagedQty[l.productId]) || 0) - (Number(collectedQty[l.productId]) || 0)) > 0 ? (
//                           <p className="mt-1.5 text-xs font-medium text-amber-700">
//                             {l.qty - (Number(damagedQty[l.productId]) || 0) - (Number(collectedQty[l.productId]) || 0)} qty
//                             still with the customer — schedule its return below.
//                           </p>
//                         ) : null}
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
//               Damage/Missing qty: {previewTotals.damagedQtyTotal}
//             </div>

//             {/* Pending items — schedule when the rest will be returned */}
//             {pendingSummary.total > 0 ? (
//               <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
//                 <div>
//                   <div className="font-semibold text-amber-900">
//                     {pendingSummary.total} item(s) still pending return
//                   </div>
//                   <ul className="mt-1 space-y-0.5 text-xs text-amber-800">
//                     {pendingSummary.lines.map((l) => (
//                       <li key={l.productId}>
//                         {l.particulars || l.productId}
//                         {l.sku ? ` (${l.sku})` : ''} — qty {l.qty}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//                 <div>
//                   <label className="mb-1 block text-sm font-medium text-slate-700">
//                     Expected return date
//                   </label>
//                   <input
//                     type="date"
//                     value={pendingReturnDate}
//                     onChange={(e) => setPendingReturnDate(e.target.value)}
//                     className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="mb-1 block text-sm font-medium text-slate-700">
//                     Time of day
//                   </label>
//                   <div className="grid grid-cols-3 gap-2">
//                     {(['MORNING', 'AFTERNOON', 'EVENING'] as const).map((slot) => (
//                       <button
//                         key={slot}
//                         type="button"
//                         onClick={() => setPendingReturnSlot(slot)}
//                         className={
//                           'h-10 rounded-lg border text-sm font-semibold transition ' +
//                           (pendingReturnSlot === slot
//                             ? 'border-primary-400 bg-primary-50 text-primary-800'
//                             : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')
//                         }
//                       >
//                         {SLOT_LABELS[slot]}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//                 <div>
//                   <Input
//                     label="Note (optional)"
//                     value={pendingReturnNote}
//                     onChange={(e) => setPendingReturnNote(e.target.value)}
//                     placeholder="e.g. will be sent back with the next delivery"
//                   />
//                 </div>
//               </div>
//             ) : null}

//             <Button
//               variant="success"
//               className="w-full"
//               loading={submitting}
//               disabled={submitting}
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

// // import { useEffect, useMemo, useState } from 'react'
// // import { useParams } from 'react-router-dom'
// // import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
// // import { Button } from '../../components/ui/Button'
// // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // import { Input } from '../../components/ui/Input'
// // import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
// // import { apiFetch } from '../../lib/api'

// // type Line = {
// //   productId: string
// //   qty: number
// //   particulars?: string
// //   sku?: string
// //   parsedRate?: number
// // }

// // type GetRes = {
// //   deliveryNo: string
// //   customerName: string
// //   siteName?: string
// //   status: string
// //   challanNo?: string
// //   vehicleLabel?: string
// //   driverName?: string
// //   driverPhone?: string
// //   lines: Line[]
// //   damageTotal?: number
// //   missingTotal?: number
// //   billerReturnSubmittedAt?: string
// //   billerDamagedLines?: { productId: string; qty: number }[]
// //   billerMissingLines?: { productId: string; qty: number }[]
// //   canSubmit?: boolean
// // }

// // type Phase = 'form' | 'thankYou'

// // const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

// // function aggregateLines(lines: Line[]): Line[] {
// //   const byProduct = new Map<string, Line>()
// //   for (const l of lines) {
// //     const existing = byProduct.get(l.productId)
// //     if (existing) {
// //       existing.qty += l.qty
// //     } else {
// //       byProduct.set(l.productId, { ...l })
// //     }
// //   }
// //   return Array.from(byProduct.values())
// // }

// // export function PublicBillerReturnPage() {
// //   const { token } = useParams()
// //   const [data, setData] = useState<GetRes | null>(null)
// //   console.log("datauuu",data);
  
// //   const [phase, setPhase] = useState<Phase>('form')
// //   const [error, setError] = useState<string | null>(null)
// //   const [damaged, setDamaged] = useState<Record<string, string>>({})
// //   const [missing, setMissing] = useState<Record<string, string>>({})
// //   const [submitting, setSubmitting] = useState(false)

// //   useEffect(() => {
// //     if (!token) return
// //     const t = decodeURIComponent(token)
// //     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// //       .then((r) => {
// //         setData(r)
// //         setPhase('form')
// //         // Start with zeros for all products
// //         const z: Record<string, string> = {}
// //         for (const l of aggregateLines(r.lines)) {
// //           z[l.productId] = '0'
// //         }
// //         // Pre-fill with previously submitted values if any
// //         const dmg = { ...z }
// //         const miss = { ...z }
// //         if (r.billerDamagedLines) {
// //           for (const l of r.billerDamagedLines) dmg[l.productId] = String(l.qty)
// //         }
// //         if (r.billerMissingLines) {
// //           for (const l of r.billerMissingLines) miss[l.productId] = String(l.qty)
// //         }
// //         setDamaged(dmg)
// //         setMissing(miss)
// //       })
// //       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
// //   }, [token])

// //   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

// //   const previewTotals = useMemo(() => {
// //     if (!data) return { damage: 0, missing: 0 }
// //     let damage = 0
// //     let miss = 0
// //     for (const l of formLines) {
// //       const dq = Number(damaged[l.productId]) || 0
// //       const mq = Number(missing[l.productId]) || 0
// //       const rate = l.parsedRate ?? 0
// //       damage += rate * dq
// //       miss += rate * mq
// //     }
// //     return { damage, missing: miss }
// //   }, [data, formLines, damaged, missing])

// //   const handleSubmit = async () => {
// //     if (!token || !data) return
// //     const t = decodeURIComponent(token)
// //     const damagedLines = formLines.map((l) => ({
// //       productId: l.productId,
// //       qty: Number(damaged[l.productId]) || 0,
// //     }))
// //     const missingLines = formLines.map((l) => ({
// //       productId: l.productId,
// //       qty: Number(missing[l.productId]) || 0,
// //     }))
// //     setSubmitting(true)
// //     setError(null)
// //     try {
// //       await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
// //         method: 'POST',
// //         body: JSON.stringify({
// //           damagedLines: damagedLines.filter((x) => x.qty > 0),
// //           missingLines: missingLines.filter((x) => x.qty > 0),
// //         }),
// //       })
// //       const refreshed = await apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
// //       setData(refreshed)
// //       setPhase('thankYou')
// //     } catch (e: unknown) {
// //       const msg = (e as { message?: string })?.message || 'Submit failed'
// //       setError(msg)
// //     } finally {
// //       setSubmitting(false)
// //     }
// //   }

// //   if (error && !data) {
// //     return (
// //       <div className={pageShell}>
// //         <div className="mx-auto max-w-lg rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
// //           {error}
// //         </div>
// //       </div>
// //     )
// //   }

// //   if (!data) {
// //     return (
// //       <div className={pageShell}>
// //         <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-20 text-slate-600">
// //           <LoadingSpinner size="lg" className="text-primary-600" />
// //           <p className="text-sm">Loading return form…</p>
// //         </div>
// //       </div>
// //     )
// //   }

// //   const completionLines = formLines.map((l) => ({
// //     productId: l.productId,
// //     particulars: l.particulars,
// //     sku: l.sku,
// //     qty: l.qty,
// //   }))

// //   const damageDisplay =
// //     data.damageTotal != null ? data.damageTotal.toFixed(2) : previewTotals.damage.toFixed(2)
// //   const missingDisplay =
// //     data.missingTotal != null ? data.missingTotal.toFixed(2) : previewTotals.missing.toFixed(2)

// //   if (phase === 'thankYou') {
// //     return (
// //       <div className={pageShell}>
// //         <PublicCompletionScreen
// //           variant="thankYou"
// //           statusLabel="Submitted"
// //           title="Thank you!"
// //           subtitle="Your return report has been submitted successfully."
// //           deliveryNo={data.deliveryNo}
// //           customerName={data.customerName}
// //           meta={[
// //             { label: 'Challan', value: data.challanNo || '—' },
// //             { label: 'Site', value: data.siteName || '—' },
// //             { label: 'Damage total', value: damageDisplay },
// //             { label: 'Missing total', value: missingDisplay },
// //           ]}
// //           lines={completionLines}
// //           completedAt={data.billerReturnSubmittedAt}
// //           completedAtLabel="Submitted on"
// //         />
// //       </div>
// //     )
// //   }

// //   return (
// //     <div className={pageShell}>
// //       <div className="mx-auto max-w-2xl space-y-4">
// //         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
// //           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
// //           <div className="mt-1 text-sm text-slate-600">
// //             {data.deliveryNo} · {data.customerName}
// //           </div>
// //           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
// //             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
// //             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
// //             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
// //             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
// //           </div>
// //           {data.billerReturnSubmittedAt ? (
// //             <div className="mt-2 text-xs text-emerald-600 font-medium">
// //               ✓ Previously submitted — you can re-submit to update
// //             </div>
// //           ) : null}
// //         </div>

// //         {error ? (
// //           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
// //         ) : null}

// //         <Card>
// //           <CardHeader>
// //             <CardTitle>Return reconciliation</CardTitle>
// //           </CardHeader>
// //           <CardContent className="space-y-4">
// //             <div className="text-sm text-slate-600">
// //               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
// //             </div>

// //             <div className="space-y-4">
// //               {formLines.map((l) => (
// //                 <div key={l.productId} className="rounded-xl border border-slate-200 bg-white p-3">
// //                   <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
// //                   <div className="text-xs text-slate-500">
// //                     {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
// //                   </div>
// //                   <div className="mt-2">
// //                     <Input
// //                       label="Return qty (damaged / missing)"
// //                       type="number"
// //                       min={0}
// //                       max={l.qty}
// //                       value={damaged[l.productId] ?? '0'}
// //                       onChange={(e) => setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))}
// //                     />
// //                   </div>
// //                 </div>
// //               ))}
// //             </div>

// //             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
// //               Estimated damage: {previewTotals.damage.toFixed(2)} · Estimated missing:{' '}
// //               {previewTotals.missing.toFixed(2)} (preview; server confirms on submit)
// //             </div>

// //             <Button
// //               variant="success"
// //               className="w-full"
// //               loading={submitting}
// //               disabled={submitting}
// //               onClick={handleSubmit}
// //             >
// //               Submit return report
// //             </Button>
// //           </CardContent>
// //         </Card>
// //       </div>
// //     </div>
// //   )
// // }

// import { useEffect, useMemo, useRef, useState } from 'react'
// import { useParams } from 'react-router-dom'
// import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
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
//   parsedRate?: number
// }

// type GetRes = {
//   deliveryNo: string
//   customerName: string
//   siteName?: string
//   status: string
//   challanNo?: string
//   vehicleLabel?: string
//   driverName?: string
//   driverPhone?: string
//   lines: Line[]
//   damageTotal?: number
//   missingTotal?: number
//   billerReturnSubmittedAt?: string
//   billerDamagedLines?: { productId: string; qty: number }[]
//   billerMissingLines?: { productId: string; qty: number }[]
//   canSubmit?: boolean
// }

// type SelectAllState = 'none' | 'some' | 'all'

// function getSelectAllState(checks: boolean[]): SelectAllState {
//   if (checks.length === 0) return 'none'
//   const checked = checks.filter(Boolean).length
//   if (checked === 0) return 'none'
//   if (checked === checks.length) return 'all'
//   return 'some'
// }

// type Phase = 'form' | 'thankYou'

// const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

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
//   const [checks, setChecks] = useState<boolean[]>([])
//   const [damaged, setDamaged] = useState<Record<string, string>>({})
//   const [missing, setMissing] = useState<Record<string, string>>({})
//   const [submitting, setSubmitting] = useState(false)
//   const selectAllRef = useRef<HTMLInputElement>(null)

//   useEffect(() => {
//     if (!token) return
//     const t = decodeURIComponent(token)
//     apiFetch<GetRes>(`/public/biller-return/${encodeURIComponent(t)}`)
//       .then((r) => {
//         setData(r)
//         setPhase('form')
//         const agg = aggregateLines(r.lines)
//         const z: Record<string, string> = {}
//         for (const l of agg) z[l.productId] = '0'

//         const dmg = { ...z }
//         const miss = { ...z }
//         if (r.billerDamagedLines) {
//           for (const l of r.billerDamagedLines) dmg[l.productId] = String(l.qty)
//         }
//         if (r.billerMissingLines) {
//           for (const l of r.billerMissingLines) miss[l.productId] = String(l.qty)
//         }
//         setDamaged(dmg)
//         setMissing(miss)

//         // Pre-check products that already have a qty entered
//         const preChecks = agg.map(
//           (l) => Number(dmg[l.productId]) > 0 || Number(miss[l.productId]) > 0
//         )
//         setChecks(preChecks)
//       })
//       .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
//   }, [token])

//   const formLines = useMemo(() => (data ? aggregateLines(data.lines) : []), [data])

//   // Sync indeterminate state on select-all checkbox
//   useEffect(() => {
//     if (!selectAllRef.current) return
//     const state = getSelectAllState(checks)
//     selectAllRef.current.indeterminate = state === 'some'
//   }, [checks])

//   const toggleLine = (index: number, checked: boolean) => {
//     setChecks((prev) => {
//       const next = [...prev]
//       next[index] = checked
//       return next
//     })
//     // Reset qty when unchecked
//     if (!checked) {
//       const productId = formLines[index]?.productId
//       if (productId) {
//         setDamaged((d) => ({ ...d, [productId]: '0' }))
//         setMissing((m) => ({ ...m, [productId]: '0' }))
//       }
//     }
//   }

//   const toggleSelectAll = () => {
//     const state = getSelectAllState(checks)
//     const next = state === 'all' ? checks.map(() => false) : checks.map(() => true)
//     setChecks(next)
//     // Reset qtys for unchecked items
//     if (state === 'all') {
//       const z: Record<string, string> = {}
//       for (const l of formLines) z[l.productId] = '0'
//       setDamaged(z)
//       setMissing(z)
//     }
//   }

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
//       setError(msg)
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

//   if (phase === 'thankYou') {
//     return (
//       <div className={pageShell}>
//         <PublicCompletionScreen
//           variant="thankYou"
//           statusLabel="Submitted"
//           title="Thank you!"
//           subtitle="Your return report has been submitted successfully."
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

//   const lineCount = formLines.length
//   const checkedCount = checks.filter(Boolean).length
//   const selectAllState = getSelectAllState(checks)
//   const progressPct = lineCount > 0 ? Math.round((checkedCount / lineCount) * 100) : 0

//   return (
//     <div className={pageShell}>
//       <div className="mx-auto max-w-2xl space-y-4">
//         {/* Header card */}
//         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
//           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
//           <div className="mt-1 text-sm text-slate-600">
//             {data.deliveryNo} · {data.customerName}
//           </div>
//           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
//             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
//             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
//             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
//             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
//           </div>
//           {data.billerReturnSubmittedAt ? (
//             <div className="mt-2 text-xs text-emerald-600 font-medium">
//               ✓ Previously submitted — you can re-submit to update
//             </div>
//           ) : null}
//         </div>

//         {error ? (
//           <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
//         ) : null}

//         <Card>
//           <CardHeader>
//             <div className="flex flex-wrap items-center justify-between gap-2">
//               <CardTitle>Return reconciliation</CardTitle>
//               <span className="text-sm font-medium text-slate-600">
//                 {checkedCount} of {lineCount} selected
//               </span>
//             </div>
//             {/* Progress bar */}
//             <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
//               <div
//                 className="h-full rounded-full bg-primary-500 transition-all duration-300"
//                 style={{ width: `${progressPct}%` }}
//               />
//             </div>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="text-sm text-slate-600">
//               Challan: {data.challanNo || '—'} · Site: {data.siteName || '—'}
//             </div>

//             {/* Checklist with Select All */}
//             <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
//               {/* Select all row */}
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

//               {/* Per-product rows */}
//               <div className="divide-y divide-slate-100">
//                 {formLines.map((l, i) => (
//                   <div
//                     key={l.productId}
//                     className={`transition-colors ${checks[i] ? 'bg-primary-50/60' : 'hover:bg-slate-50'}`}
//                   >
//                     {/* Checkbox row */}
//                     <label className="flex cursor-pointer items-start gap-3 px-4 py-4">
//                       <input
//                         type="checkbox"
//                         className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
//                         checked={!!checks[i]}
//                         onChange={(e) => toggleLine(i, e.target.checked)}
//                       />
//                       <div className="min-w-0 flex-1">
//                         <div className="flex items-start gap-2">
//                           <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
//                             {i + 1}
//                           </span>
//                           <div className="min-w-0 flex-1">
//                             <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
//                             <div className="text-xs text-slate-500">
//                               {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </label>

//                     {/* Qty input — only visible when checked */}
//                     {checks[i] && (
//                       <div className="px-4 pb-4">
//                         <Input
//                           label="Return qty (damaged / missing)"
//                           type="number"
//                           min={0}
//                           max={l.qty}
//                           value={damaged[l.productId] ?? '0'}
//                           onChange={(e) =>
//                             setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))
//                           }
//                         />
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
//               Estimated damage: {previewTotals.damage.toFixed(2)} · Estimated missing:{' '}
//               {previewTotals.missing.toFixed(2)} (preview; server confirms on submit)
//             </div>

//             <Button
//               variant="success"
//               className="w-full"
//               loading={submitting}
//               disabled={submitting}
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

// import { useEffect, useMemo, useState } from 'react'
// import { useParams } from 'react-router-dom'
// import { PublicCompletionScreen } from '../../components/public/PublicCompletionScreen'
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
//   parsedRate?: number
// }

// type GetRes = {
//   deliveryNo: string
//   customerName: string
//   siteName?: string
//   status: string
//   challanNo?: string
//   vehicleLabel?: string
//   driverName?: string
//   driverPhone?: string
//   lines: Line[]
//   damageTotal?: number
//   missingTotal?: number
//   billerReturnSubmittedAt?: string
//   billerDamagedLines?: { productId: string; qty: number }[]
//   billerMissingLines?: { productId: string; qty: number }[]
//   canSubmit?: boolean
// }

// type Phase = 'form' | 'thankYou'

// const pageShell = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 px-4 py-10'

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
//   console.log("datauuu",data);
  
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
//         setPhase('form')
//         // Start with zeros for all products
//         const z: Record<string, string> = {}
//         for (const l of aggregateLines(r.lines)) {
//           z[l.productId] = '0'
//         }
//         // Pre-fill with previously submitted values if any
//         const dmg = { ...z }
//         const miss = { ...z }
//         if (r.billerDamagedLines) {
//           for (const l of r.billerDamagedLines) dmg[l.productId] = String(l.qty)
//         }
//         if (r.billerMissingLines) {
//           for (const l of r.billerMissingLines) miss[l.productId] = String(l.qty)
//         }
//         setDamaged(dmg)
//         setMissing(miss)
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
//       setError(msg)
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

//   if (phase === 'thankYou') {
//     return (
//       <div className={pageShell}>
//         <PublicCompletionScreen
//           variant="thankYou"
//           statusLabel="Submitted"
//           title="Thank you!"
//           subtitle="Your return report has been submitted successfully."
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
//         <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
//           <div className="text-lg font-semibold text-slate-900">Biller return & damage</div>
//           <div className="mt-1 text-sm text-slate-600">
//             {data.deliveryNo} · {data.customerName}
//           </div>
//           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
//             {data.siteName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Site: {data.siteName}</span> : null}
//             {data.vehicleLabel ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Vehicle: {data.vehicleLabel}</span> : null}
//             {data.driverName ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Driver: {data.driverName}</span> : null}
//             {data.driverPhone ? <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Phone: {data.driverPhone}</span> : null}
//           </div>
//           {data.billerReturnSubmittedAt ? (
//             <div className="mt-2 text-xs text-emerald-600 font-medium">
//               ✓ Previously submitted — you can re-submit to update
//             </div>
//           ) : null}
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

//             <div className="space-y-4">
//               {formLines.map((l) => (
//                 <div key={l.productId} className="rounded-xl border border-slate-200 bg-white p-3">
//                   <div className="font-semibold text-slate-900">{l.particulars || l.productId}</div>
//                   <div className="text-xs text-slate-500">
//                     {l.sku} · Dispatched qty {l.qty} · Rate basis {l.parsedRate ?? '—'}
//                   </div>
//                   <div className="mt-2">
//                     <Input
//                       label="Return qty (damaged / missing)"
//                       type="number"
//                       min={0}
//                       max={l.qty}
//                       value={damaged[l.productId] ?? '0'}
//                       onChange={(e) => setDamaged((d) => ({ ...d, [l.productId]: e.target.value }))}
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
//               disabled={submitting}
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

type PendingLine = { productId: string; qty: number }

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
        const dq = Number(damagedQty[l.productId]) || 0
        const cq = Number(collectedQty[l.productId]) || 0
        const remaining = Math.max(0, l.qty - dq - cq)
        return { productId: l.productId, particulars: l.particulars, sku: l.sku, qty: remaining }
      })
      .filter((l) => l.qty > 0)
    const total = lines.reduce((s, l) => s + l.qty, 0)
    return { lines, total }
  }, [formLines, damagedQty, collectedQty])

  const handleSubmit = async () => {
    if (!token || !data) return
    const t = decodeURIComponent(token)
    const damagedLines = formLines.map((l) => ({
      productId: l.productId,
      qty: Number(damagedQty[l.productId]) || 0,
    }))
    const collectedLines = formLines.map((l) => ({
      productId: l.productId,
      qty: Number(collectedQty[l.productId]) || 0,
    }))
    setSubmitting(true)
    setError(null)
    try {
      await apiFetch(`/public/biller-return/${encodeURIComponent(t)}`, {
        method: 'POST',
        body: JSON.stringify({
          damagedLines: damagedLines.filter((x) => x.qty > 0),
          collectedLines: collectedLines.filter((x) => x.qty > 0),
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
  const completionLines = formLines
    .map((l) => ({
      productId: l.productId,
      particulars: l.particulars,
      sku: l.sku,
      qty: reportedQtyByProduct.get(l.productId) || 0,
    }))
    .filter((l) => l.qty > 0)

  const damagedQtyTotal = (data.billerDamagedLines || []).reduce((s, l) => s + (Number(l.qty) || 0), 0)
  const pendingLinesDisplay = data.billerPendingReturnLines || []
  const pendingDays = daysWithClient(data.deliveryAt)

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
            { label: 'Return by', value: data.returnDriverName || data.driverName || '—' },
            { label: 'Damage/Missing qty', value: String(damagedQtyTotal) },
          ]}
          lines={completionLines}
          completedAt={data.billerReturnSubmittedAt}
          completedAtLabel="Submitted on"
        />
        {pendingLinesDisplay.length > 0 ? (
          <div className="mx-auto mt-4 max-w-lg rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm">
            <div className="font-semibold text-amber-800">
              {pendingLinesDisplay.reduce((s, l) => s + l.qty, 0)} item(s) still with the customer
            </div>
            <div className="mt-1 text-amber-700">
              {pendingDays != null
                ? `With the client for ${pendingDays} day${pendingDays === 1 ? '' : 's'} since delivery`
                : 'Still with the client'}
            </div>
          </div>
        ) : null}
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
                            label="Collecting now qty"
                            type="number"
                            min={0}
                            max={l.qty}
                            value={collectedQty[l.productId] ?? '0'}
                            onChange={(e) =>
                              setCollectedQty((q) => ({ ...q, [l.productId]: e.target.value }))
                            }
                          />
                        </div>
                        {Math.max(0, l.qty - (Number(damagedQty[l.productId]) || 0) - (Number(collectedQty[l.productId]) || 0)) > 0 ? (
                          <p className="mt-1.5 text-xs font-medium text-amber-700">
                            {l.qty - (Number(damagedQty[l.productId]) || 0) - (Number(collectedQty[l.productId]) || 0)} qty
                            still with the customer — schedule its return below.
                          </p>
                        ) : null}
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