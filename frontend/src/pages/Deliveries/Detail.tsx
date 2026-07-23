// // // import { useEffect, useMemo, useState } from 'react'
// // // import { Link, useNavigate, useParams } from 'react-router-dom'
// // // import { formatDateTime } from '../../lib/format'
// // // import { Button } from '../../components/ui/Button'
// // // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // // import { PageHeader } from '../../components/ui/PageHeader'
// // // import { Table, Td, Th } from '../../components/ui/Table'
// // // import { apiFetch } from '../../lib/api'
// // // import { getToken, useAuth } from '../../auth/store'
// // // import { DeliveryStatusSelect } from '../../components/delivery/DeliveryStatusSelect'
// // // import { DeleteDeliveryButton } from '../../components/delivery/DeleteDeliveryButton'
// // // import { GodownDeliveryWorkflow } from '../../components/delivery/GodownDeliveryWorkflow'
// // // import { ReturnPickupVehicleModal } from '../../components/delivery/ReturnPickupVehicleModal'
// // // import { ReturnReconciliationCard } from '../../components/delivery/ReturnReconciliationCard'
// // // import {
// // //   displayFulfillmentQty,
// // //   fulfillmentColumnLabel,
// // //   getDeliveryEditState,
// // //   showDispatchedQty,
// // // } from '../../lib/deliveryStatus'
// // // import { DriverDeliveryDetail } from '../../components/delivery/DriverDeliveryDetail'
// // // import { BillerReturnCard } from '../../components/delivery/BillerReturnCard'
// // // import { DeliveryHandoverCard } from '../../components/delivery/DeliveryHandoverCard'
// // // import { CreateDeliveryModal } from './CreateDeliveryModal'
// // // import { ChallanPdfIcon, openDeliveryChallanPdf, openReturnChallanPdf } from '../../lib/openChallanPdf'
// // // import { groupLinesByGodown } from '../../lib/deliveryLineGroups'

// // // const RETURN_CHALLAN_STATUSES = ['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN', 'COMPLETED']

// // // type DeliveryLine = {
// // //   productId: string
// // //   godownId?: string
// // //   godownName?: string
// // //   qty: number
// // //   dispatchedQty?: number
// // //   returnedQty?: number
// // //   particulars?: string
// // //   sku?: string
// // //   rate?: string
// // //   parsedRate?: number
// // //   unit?: string
// // // }

// // // type BillerReturnLine = {
// // //   productId: string
// // //   qty: number
// // //   particulars?: string
// // //   sku?: string
// // //   note?: string
// // // }

// // // type DeliveryDetail = {
// // //   id: string
// // //   deliveryNo: string
// // //   customerName: string
// // //   siteName?: string
// // //   siteAddress?: string
// // //   contactPhone?: string
// // //   billerUserId?: string
// // //   fromGodownId: string
// // //   deliveryAt: string
// // //   returnExpectedAt?: string
// // // vehicleLabel?: string
// // //   driverName?: string
// // //   driverPhone?: string
// // //   returnPickupVehicleLabel?: string
// // //   returnPickupDriverName?: string
// // //   returnPickupDriverPhone?: string
// // //   status: string
// // //   lines: DeliveryLine[]
// // //   scanProgress?: {
// // //     dispatchComplete?: boolean
// // //     returnPickupComplete?: boolean
// // //   }
// // //   qtyProgress?: {
// // //     dispatchComplete?: boolean
// // //     dispatchedByProduct?: Record<string, number>
// // //     deliveredByProduct?: Record<string, number>
// // //     returnedByProduct?: Record<string, number>
// // //   }
// // //   deliveryLineChecks?: Array<{ productId: string; qtyAck?: number; ok?: boolean }>
// // //   stockByGodown?: Record<string, Record<string, number>>
// // //   deliveryVerifierName?: string
// // //   deliveryVerifiedAt?: string
// // //   deliverySignature?: string
// // //   billerReturnSubmittedAt?: string
// // //   billerMissingLines?: BillerReturnLine[]
// // //   billerDamagedLines?: BillerReturnLine[]
// // //   damageTotal?: number
// // //   missingTotal?: number
// // //   deliveryVerifyUrl?: string
// // //   billerReturnUrl?: string
// // //   dispatchedTagIds?: string[]
// // //   pickedUpTagIds?: string[]
// // //   deliveredTagIds?: string[]
// // //   returnPickedUpTagIds?: string[]
// // //   returnedTagIds?: string[]
// // //   damagedTagIds?: string[]
// // //   lostTagIds?: string[]
// // // }

// // // export function DeliveryDetailPage() {
// // //   const { id } = useParams()
// // //   const auth = useAuth()
// // //   if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY') {
// // //     return <DriverDeliveryDetail deliveryId={id} />
// // //   }
// // //   return <AdminDeliveryDetailPage />
// // // }

// // // function AdminDeliveryDetailPage() {
// // //   const { id } = useParams()
// // //   const nav = useNavigate()
// // //   const auth = useAuth()
// // //   const [d, setD] = useState<DeliveryDetail | null>(null)
// // //   const [error, setError] = useState<string | null>(null)
// // //   const [returnPickupModalOpen, setReturnPickupModalOpen] = useState(false)
// // //   const [actionBusy, setActionBusy] = useState(false)
// // //   const [editOpen, setEditOpen] = useState(false)
// // //   const [challanError, setChallanError] = useState<string | null>(null)

// // //   const load = () => {
// // //     const token = getToken()
// // //     if (!token || !id) return
// // //     setError(null)
// // //     apiFetch<DeliveryDetail>(`/deliveries/${id}`, { token })
// // //       .then(setD)
// // //       .catch((e: unknown) =>
// // //         setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load'),
// // //       )
// // //   }

// // //   useEffect(() => {
// // //     load()
// // //   }, [id])

// // //   const role = auth.status === 'authenticated' ? auth.user.role : ''
// // //   const canRegen = role === 'ADMIN'
// // //   const isGodownUser = role === 'GODOWN'
// // //   const isAdmin = role === 'ADMIN'
// // //   const showDeleteDelivery =
// // //     auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')

// // //   const editState =
// // //     d && auth.status === 'authenticated'
// // //       ? getDeliveryEditState(auth.user.role, auth.user.id, {
// // //           status: d.status,
// // //           billerUserId: d.billerUserId,
// // //           dispatchedTagIds: d.dispatchedTagIds,
// // //           pickedUpTagIds: d.pickedUpTagIds,
// // //           deliveredTagIds: d.deliveredTagIds,
// // //           returnPickedUpTagIds: d.returnPickedUpTagIds,
// // //           returnedTagIds: d.returnedTagIds,
// // //           damagedTagIds: d.damagedTagIds,
// // //           lostTagIds: d.lostTagIds,
// // //         })
// // //       : { canEdit: false, fullLines: false, metadataOnly: false }

// // //   const copy = (text: string) => {
// // //     navigator.clipboard.writeText(text).catch(() => {})
// // //   }

// // //   const assignReturnPickup = async (vehicleNumber: string) => {
// // //     const token = getToken()
// // //     if (!token || !id) return
// // //     setActionBusy(true)
// // //     try {
// // //       await apiFetch(`/deliveries/${id}/assign-return-pickup`, {
// // //         token,
// // //         method: 'POST',
// // //         body: JSON.stringify({ vehicleNumber }),
// // //       })
// // //       setReturnPickupModalOpen(false)
// // //       load()
// // //     } catch (e: unknown) {
// // //       setError(
// // //         e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Assign return pickup failed',
// // //       )
// // //     } finally {
// // //       setActionBusy(false)
// // //     }
// // //   }

// // //   const showReturnPhase = ['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN'].includes(d?.status ?? '')
// // //   const showReturnChallan = RETURN_CHALLAN_STATUSES.includes(d?.status ?? '')

// // //   const openDeliveryChallan = async () => {
// // //     const token = getToken()
// // //     if (!token || !id) return
// // //     setChallanError(null)
// // //     try {
// // //       await openDeliveryChallanPdf(id, token)
// // //     } catch (e: unknown) {
// // //       setChallanError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to open delivery challan')
// // //     }
// // //   }

// // //   const openReturnChallan = async () => {
// // //     const token = getToken()
// // //     if (!token || !id) return
// // //     setChallanError(null)
// // //     try {
// // //       await openReturnChallanPdf(id, token)
// // //     } catch (e: unknown) {
// // //       setChallanError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to open return challan')
// // //     }
// // //   }
// // //   const canAssignReturnPickup =
// // //     d?.status === 'DELIVERED' && (isAdmin || isGodownUser)

// // //   const linesByGodown = useMemo(() => {
// // //     if (!d) return []
// // //     return groupLinesByGodown(d.lines, d.fromGodownId)
// // //   }, [d])

// // //   if (!id) return null

// // //   if (error && !d) {
// // //     return (
// // //       <div>
// // //         <PageHeader title="Delivery" subtitle="Error" right={<Link to="/deliveries" className="text-sm font-semibold">Back</Link>} />
// // //         <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
// // //       </div>
// // //     )
// // //   }

// // //   if (!d) {
// // //     return (
// // //       <div>
// // //         <PageHeader title="Delivery" subtitle="Loading?" />
// // //       </div>
// // //     )
// // //   }

// // //   return (
// // //     <div>
// // //       <PageHeader
// // //         title={d.deliveryNo}
// // //         subtitle={`${d.customerName} · ${d.siteName || d.siteAddress || ''}`}
// // //         right={
// // //           <div className="flex flex-wrap items-center gap-2">
// // //             <Button variant="secondary" size="sm" onClick={openDeliveryChallan} className="inline-flex items-center gap-1.5">
// // //               <ChallanPdfIcon className="h-3.5 w-3.5" />
// // //               Delivery Challan
// // //             </Button>
// // //             {showReturnChallan ? (
// // //               <Button variant="secondary" size="sm" onClick={openReturnChallan} className="inline-flex items-center gap-1.5">
// // //                 <ChallanPdfIcon className="h-3.5 w-3.5" />
// // //                 Return Challan
// // //               </Button>
// // //             ) : null}
// // //             {editState.canEdit ? (
// // //               <Button
// // //                 variant="secondary"
// // //                 size="sm"
// // //                 onClick={() => setEditOpen(true)}
// // //                 title={editState.reason || (editState.metadataOnly ? 'Edit delivery (limited)' : 'Edit delivery')}
// // //               >
// // //                 Edit
// // //               </Button>
// // //             ) : null}
// // //             {showDeleteDelivery ? (
// // //               <DeleteDeliveryButton
// // //                 deliveryId={d.id}
// // //                 deliveryNo={d.deliveryNo}
// // //                 customerName={d.customerName}
// // //                 status={d.status}
// // //                 billerUserId={d.billerUserId}
// // //                 dispatchedTagIds={d.dispatchedTagIds}
// // //                 pickedUpTagIds={d.pickedUpTagIds}
// // //                 deliveredTagIds={d.deliveredTagIds}
// // //                 returnPickedUpTagIds={d.returnPickedUpTagIds}
// // //                 returnedTagIds={d.returnedTagIds}
// // //                 damagedTagIds={d.damagedTagIds}
// // //                 lostTagIds={d.lostTagIds}
// // //                 variant="button"
// // //                 onDeleted={() => nav('/deliveries')}
// // //                 onError={(msg) => setError(msg)}
// // //               />
// // //             ) : null}
// // //             <Link to="/deliveries" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
// // //               Back to list
// // //             </Link>
// // //           </div>
// // //         }
// // //       />

// // //       {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
// // //       {challanError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{challanError}</div> : null}

// // //       <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm">
// // //         <div>
// // //           <span className="font-medium text-emerald-800">Area: </span>
// // //           <span className="text-slate-700">{d.siteName || '—'}</span>
// // //           {d.siteAddress ? <span className="text-slate-500"> · {d.siteAddress}</span> : null}
// // //         </div>
// // //         <div>
// // //           <span className="font-medium text-emerald-800">Godown: </span>
// // //           <span className="text-slate-700">
// // //             {linesByGodown.map((g) => g.godownName).join(', ') || '?'}
// // //           </span>
// // //         </div>
// // //         <div>
// // //           <span className="font-medium text-emerald-800">Products: </span>
// // //           <span className="text-slate-700">{d.lines.length} items</span>
// // //         </div>
// // //         {/* {d.vehicleLabel ? (
// // //           <div>
// // //             <span className="font-medium text-emerald-800">Vehicle: </span>
// // //             <span className="text-slate-700">{d.vehicleLabel}</span>
// // //           </div>
// // //         ) : null} */}
// // //         {d.vehicleLabel ? (
// // //           <div>
// // //             <span className="font-medium text-emerald-800">Vehicle: </span>
// // //             <span className="text-slate-700">{d.vehicleLabel}</span>
// // //           </div>
// // //         ) : null}
// // //         {d.driverName ? (
// // //           <div>
// // //             <span className="font-medium text-emerald-800">Driver: </span>
// // //             <span className="text-slate-700">{d.driverName}</span>
// // //           </div>
// // //         ) : null}
// // //         {d.driverPhone ? (
// // //           <div>
// // //             <span className="font-medium text-emerald-800">Driver phone: </span>
// // //             <span className="text-slate-700">{d.driverPhone}</span>
// // //           </div>
// // //         ) : null}
// // //       </div>

// // //       <ReturnPickupVehicleModal
// // //         open={returnPickupModalOpen}
// // //         busy={actionBusy}
// // //         initialValue={d?.returnPickupVehicleLabel}
// // //         onClose={() => setReturnPickupModalOpen(false)}
// // //         onConfirm={assignReturnPickup}
// // //       />

// // //       {showReturnPhase ? (
// // //         <ReturnReconciliationCard
// // //           status={d.status}
// // //           billerReturnUrl={d.billerReturnUrl}
// // //           billerReturnSubmittedAt={d.billerReturnSubmittedAt}
// // //           damageTotal={d.damageTotal}
// // //           missingTotal={d.missingTotal}
// // //           onCopyLink={copy}
// // //         />
// // //       ) : null}

// // //       {canAssignReturnPickup && isAdmin && !isGodownUser ? (
// // //         <div className="mb-4">
// // //           <Button onClick={() => setReturnPickupModalOpen(true)} disabled={actionBusy}>
// // //             Assign return pickup
// // //           </Button>
// // //         </div>
// // //       ) : null}

// // //       {isGodownUser && d ? (
// // //         <GodownDeliveryWorkflow
// // //           delivery={{
// // //             ...d,
// // //             billerReturnUrl: d.billerReturnUrl,
// // //             billerReturnSubmittedAt: d.billerReturnSubmittedAt,
// // //           }}
// // //           onUpdated={load}
// // //           onError={(msg) => setError(msg)}
// // //         />
// // //       ) : null}

// // //       <div className="grid gap-4 lg:grid-cols-3">
// // //         <Card className="lg:col-span-2">
// // //           <CardHeader>
// // //             <CardTitle>Overview</CardTitle>
// // //           </CardHeader>
// // //           <CardContent className="space-y-2 text-sm">
// // //             <div className="flex flex-wrap items-center gap-2">
// // //               <span className="text-slate-600">Status</span>
// // //               <DeliveryStatusSelect
// // //                 deliveryId={d.id}
// // //                 status={d.status}
// // //                 vehicleLabel={d.vehicleLabel}
// // //                 driverName={d.driverName}
// // //                 driverPhone={d.driverPhone}
// // //                 returnPickupVehicleLabel={d.returnPickupVehicleLabel}
// // //                 returnPickupDriverName={d.returnPickupDriverName}
// // //                 returnPickupDriverPhone={d.returnPickupDriverPhone}
// // //                 onUpdated={() => load()}
// // //                 onError={(msg) => setError(msg)}
// // //               />
// // //             </div>
// // //             <div>
// // //               <span className="text-slate-600">Scheduled: </span>
// // //               {formatDateTime(d.deliveryAt)}
// // //             </div>
// // //             {d.returnExpectedAt ? (
// // //               <div>
// // //                 <span className="text-slate-600">Return expected: </span>
// // //                 {formatDateTime(d.returnExpectedAt)}
// // //               </div>
// // //             ) : null}
// // //             {d.vehicleLabel ? (
// // //               <div>
// // //                 <span className="text-slate-600">Vehicle: </span>
// // //                 {d.vehicleLabel}
// // //               </div>
// // //             ) : null}
// // //             {d.driverName ? (
// // //               <div>
// // //                 <span className="text-slate-600">Driver: </span>
// // //                 {d.driverName}
// // //               </div>
// // //             ) : null}
// // //             {d.driverPhone ? (
// // //               <div>
// // //                 <span className="text-slate-600">Driver phone: </span>
// // //                 {d.driverPhone}
// // //               </div>
// // //             ) : null}
// // //             {d.returnPickupVehicleLabel ? (
// // //               <div>
// // //                 <span className="text-slate-600">Return pickup vehicle: </span>
// // //                 {d.returnPickupVehicleLabel}
// // //               </div>
// // //             ) : null}
// // //             {d.returnPickupDriverName ? (
// // //               <div>
// // //                 <span className="text-slate-600">Return pickup driver: </span>
// // //                 {d.returnPickupDriverName}
// // //               </div>
// // //             ) : null}
// // //             {d.returnPickupDriverPhone ? (
// // //               <div>
// // //                 <span className="text-slate-600">Return pickup driver phone: </span>
// // //                 {d.returnPickupDriverPhone}
// // //               </div>
// // //             ) : null}
// // //             {d.contactPhone ? (
// // //               <div>
// // //                 <span className="text-slate-600">Contact: </span>
// // //                 {d.contactPhone}
// // //               </div>
// // //             ) : null}
// // //             {linesByGodown.length > 0 ? (
// // //               <div>
// // //                 <span className="text-slate-600">Source godowns: </span>
// // //                 <span className="text-slate-900">
// // //                   {linesByGodown.map((g, i) => (
// // //                     <span key={g.godownId}>
// // //                       {i > 0 ? ', ' : null}
// // //                       <Link to={`/godowns/${g.godownId}`} className="font-semibold text-primary-700 hover:text-primary-900">
// // //                         {g.godownName}
// // //                       </Link>
// // //                     </span>
// // //                   ))}
// // //                 </span>
// // //               </div>
// // //             ) : null}
// // //             <DeliveryHandoverCard
// // //               deliveryVerifiedAt={d.deliveryVerifiedAt}
// // //               deliveryVerifierName={d.deliveryVerifierName}
// // //               vehicleLabel={d.vehicleLabel}
// // //               deliverySignature={d.deliverySignature}
// // //               lines={d.lines}
// // //             />
// // //             <BillerReturnCard
// // //               status={d.status}
// // //               billerReturnSubmittedAt={d.billerReturnSubmittedAt}
// // //               billerMissingLines={d.billerMissingLines}
// // //               billerDamagedLines={d.billerDamagedLines}
// // //               damageTotal={d.damageTotal}
// // //               missingTotal={d.missingTotal}
// // //             />
// // //           </CardContent>
// // //         </Card>

// // //         <Card>
// // //           <CardHeader className="flex flex-col gap-2">
// // //             <CardTitle>Magic links</CardTitle>
// // //             {canRegen ? (
// // //               <Button
// // //                 size="sm"
// // //                 variant="secondary"
// // //                 onClick={() => {
// // //                   const token = getToken()
// // //                   if (!token || !id) return
// // //                   apiFetch<{ deliveryVerifyUrl: string; billerReturnUrl: string }>(`/deliveries/${id}/regenerate-tokens`, {
// // //                     token,
// // //                     method: 'POST',
// // //                   })
// // //                     .then(() => load())
// // //                     .catch((e: unknown) =>
// // //                       setError(
// // //                         e && typeof e === 'object' && 'message' in e
// // //                           ? String((e as { message: string }).message)
// // //                           : 'Regenerate failed',
// // //                       ),
// // //                     )
// // //                 }}
// // //               >
// // //                 Regenerate links
// // //               </Button>
// // //             ) : null}
// // //           </CardHeader>
// // //           <CardContent className="space-y-3 text-xs">
// // //             <div>
// // //               <div className="font-semibold text-slate-800">Delivery verify</div>
// // //               <div className="break-all text-slate-600">{d.deliveryVerifyUrl || '?'}</div>
// // //               {d.deliveryVerifyUrl ? (
// // //                 <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.deliveryVerifyUrl || '')}>
// // //                   Copy
// // //                 </Button>
// // //               ) : null}
// // //             </div>
// // //             <div>
// // //               <div className="font-semibold text-slate-800">Biller return</div>
// // //               <div className="break-all text-slate-600">{d.billerReturnUrl || '?'}</div>
// // //               {d.billerReturnUrl ? (
// // //                 <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.billerReturnUrl || '')}>
// // //                   Copy
// // //                 </Button>
// // //               ) : null}
// // //             </div>
// // //           </CardContent>
// // //         </Card>
// // //       </div>

// // //       <Card className="mt-4">
// // //         <CardHeader>
// // //           <CardTitle>Products by godown</CardTitle>
// // //         </CardHeader>
// // //         <CardContent className="space-y-6">
// // //           {d.lines.length === 0 ? (
// // //             <p className="text-sm text-slate-600">No products on this delivery.</p>
// // //           ) : (
// // //             linesByGodown.map((group) => {
// // //               const units = group.lines.reduce((sum, l) => sum + l.qty, 0)
// // //               return (
// // //                 <div key={group.godownId} className="overflow-hidden rounded-xl border border-slate-200">
// // //                   <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
// // //                     <div>
// // //                       <Link
// // //                         to={`/godowns/${group.godownId}`}
// // //                         className="font-semibold text-primary-800 hover:text-primary-950"
// // //                       >
// // //                         {group.godownName}
// // //                       </Link>
// // //                       <div className="text-xs text-slate-500">
// // //                         {group.lines.length} product{group.lines.length === 1 ? '' : 's'} · {units} unit{units === 1 ? '' : 's'}
// // //                       </div>
// // //                     </div>
// // //                   </div>
// // //                   <Table>
// // //                     <thead>
// // //                       <tr>
// // //                         <Th>Product</Th>
// // //                         <Th>SKU</Th>
// // //                         <Th className="text-right">Ordered</Th>
// // //                         <Th className="text-right">{fulfillmentColumnLabel(d.status)}</Th>
// // //                         <Th className="text-right">Returned</Th>
// // //                         <Th className="text-right">In stock</Th>
// // //                       </tr>
// // //                     </thead>
// // //                     <tbody>
// // //                       {group.lines.map((l) => {
// // //                         const stock = d.stockByGodown?.[group.godownId]?.[l.productId]
// // //                         return (
// // //                           <tr key={`${group.godownId}-${l.productId}`} className="hover:bg-slate-50">
// // //                             <Td className="font-semibold text-slate-900">{l.particulars || l.productId}</Td>
// // //                             <Td className="font-mono text-xs text-slate-600">{l.sku || '—'}</Td>
// // //                             <Td className="text-right font-semibold text-slate-900">
// // //                               {l.qty}
// // //                               {l.unit ? <span className="ml-1 font-normal text-slate-500">{l.unit}</span> : null}
// // //                             </Td>
// // //                             <Td className="text-right text-slate-700">
// // //                               {displayFulfillmentQty(d.status, l, {
// // //                                 deliveryVerifiedAt: d.deliveryVerifiedAt,
// // //                                 deliveryLineChecks: d.deliveryLineChecks,
// // //                                 qtyProgress: d.qtyProgress,
// // //                                 deliveredTagIds: d.deliveredTagIds,
// // //                               })}
// // //                             </Td>
// // //                             <Td className="text-right text-slate-700">
// // //                               {showDispatchedQty(d.status) ? (l.returnedQty ?? 0) : '—'}
// // //                             </Td>
// // //                             <Td className="text-right font-semibold text-primary-700">
// // //                               {stock !== undefined ? stock : '—'}
// // //                             </Td>
// // //                           </tr>
// // //                         )
// // //                       })}
// // //                     </tbody>
// // //                   </Table>
// // //                 </div>
// // //               )
// // //             })
// // //           )}
// // //         </CardContent>
// // //       </Card>

// // //       <CreateDeliveryModal
// // //         open={editOpen}
// // //         deliveryId={d.id}
// // //         onClose={() => setEditOpen(false)}
// // //         onCreated={load}
// // //         onUpdated={load}
// // //       />
// // //     </div>
// // //   )
// // // }


// // import { useEffect, useMemo, useState } from 'react'
// // import { Link, useNavigate, useParams } from 'react-router-dom'
// // import { formatDateTime } from '../../lib/format'
// // import { Button } from '../../components/ui/Button'
// // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // import { PageHeader } from '../../components/ui/PageHeader'
// // import { Table, Td, Th } from '../../components/ui/Table'
// // import { apiFetch } from '../../lib/api'
// // import { getToken, useAuth } from '../../auth/store'
// // import { DeliveryStatusSelect } from '../../components/delivery/DeliveryStatusSelect'
// // import { DeleteDeliveryButton } from '../../components/delivery/DeleteDeliveryButton'
// // import { GodownDeliveryWorkflow } from '../../components/delivery/GodownDeliveryWorkflow'
// // import { ReturnPickupVehicleModal } from '../../components/delivery/ReturnPickupVehicleModal'
// // import { ReturnReconciliationCard } from '../../components/delivery/ReturnReconciliationCard'
// // import {
// //   displayFulfillmentQty,
// //   fulfillmentColumnLabel,
// //   getDeliveryEditState,
// //   showDispatchedQty,
// // } from '../../lib/deliveryStatus'
// // import { DriverDeliveryDetail } from '../../components/delivery/DriverDeliveryDetail'
// // import { BillerReturnCard } from '../../components/delivery/BillerReturnCard'
// // import { DeliveryHandoverCard } from '../../components/delivery/DeliveryHandoverCard'
// // import { CreateDeliveryModal } from './CreateDeliveryModal'
// // import { ChallanPdfIcon, openDeliveryChallanPdf, openReturnChallanPdf } from '../../lib/openChallanPdf'
// // import { groupLinesByGodown } from '../../lib/deliveryLineGroups'

// // const RETURN_CHALLAN_STATUSES = ['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN', 'COMPLETED']

// // type DeliveryLine = {
// //   productId: string
// //   godownId?: string
// //   godownName?: string
// //   qty: number
// //   dispatchedQty?: number
// //   returnedQty?: number
// //   particulars?: string
// //   sku?: string
// //   rate?: string
// //   parsedRate?: number
// //   unit?: string
// // }

// // type BillerReturnLine = {
// //   productId: string
// //   qty: number
// //   particulars?: string
// //   sku?: string
// //   note?: string
// // }

// // type DeliveryDetail = {
// //   id: string
// //   deliveryNo: string
// //   customerName: string
// //   siteName?: string
// //   siteAddress?: string
// //   contactPhone?: string
// //   billerUserId?: string
// //   fromGodownId: string
// //   deliveryAt: string
// //   returnExpectedAt?: string
// // vehicleLabel?: string
// //   driverName?: string
// //   driverPhone?: string
// //   vehicleType?: 'PRIVATE' | 'PORTER' | 'OWN'
// //   returnPickupVehicleLabel?: string
// //   returnPickupDriverName?: string
// //   returnPickupDriverPhone?: string
// //   returnPickupVehicleType?: 'PRIVATE' | 'PORTER' | 'OWN'
// //   status: string
// //   lines: DeliveryLine[]
// //   scanProgress?: {
// //     dispatchComplete?: boolean
// //     returnPickupComplete?: boolean
// //   }
// //   qtyProgress?: {
// //     dispatchComplete?: boolean
// //     dispatchedByProduct?: Record<string, number>
// //     deliveredByProduct?: Record<string, number>
// //     returnedByProduct?: Record<string, number>
// //   }
// //   deliveryLineChecks?: Array<{ productId: string; qtyAck?: number; ok?: boolean }>
// //   stockByGodown?: Record<string, Record<string, number>>
// //   deliveryVerifierName?: string
// //   deliveryVerifiedAt?: string
// //   deliverySignature?: string
// //   billerReturnSubmittedAt?: string
// //   billerMissingLines?: BillerReturnLine[]
// //   billerDamagedLines?: BillerReturnLine[]
// //   damageTotal?: number
// //   missingTotal?: number
// //   deliveryVerifyUrl?: string
// //   billerReturnUrl?: string
// //   dispatchedTagIds?: string[]
// //   pickedUpTagIds?: string[]
// //   deliveredTagIds?: string[]
// //   returnPickedUpTagIds?: string[]
// //   returnedTagIds?: string[]
// //   damagedTagIds?: string[]
// //   lostTagIds?: string[]
// // }

// // export function DeliveryDetailPage() {
// //   const { id } = useParams()
// //   const auth = useAuth()
// //   if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY') {
// //     return <DriverDeliveryDetail deliveryId={id} />
// //   }
// //   return <AdminDeliveryDetailPage />
// // }

// // function AdminDeliveryDetailPage() {
// //   const { id } = useParams()
// //   const nav = useNavigate()
// //   const auth = useAuth()
// //   const [d, setD] = useState<DeliveryDetail | null>(null)
// //   const [error, setError] = useState<string | null>(null)
// //   const [returnPickupModalOpen, setReturnPickupModalOpen] = useState(false)
// //   const [actionBusy, setActionBusy] = useState(false)
// //   const [editOpen, setEditOpen] = useState(false)
// //   const [challanError, setChallanError] = useState<string | null>(null)

// //   const load = () => {
// //     const token = getToken()
// //     if (!token || !id) return
// //     setError(null)
// //     apiFetch<DeliveryDetail>(`/deliveries/${id}`, { token })
// //       .then(setD)
// //       .catch((e: unknown) =>
// //         setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load'),
// //       )
// //   }

// //   useEffect(() => {
// //     load()
// //   }, [id])

// //   const role = auth.status === 'authenticated' ? auth.user.role : ''
// //   const canRegen = role === 'ADMIN'
// //   const isGodownUser = role === 'GODOWN'
// //   const isAdmin = role === 'ADMIN'
// //   const showDeleteDelivery =
// //     auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')

// //   const editState =
// //     d && auth.status === 'authenticated'
// //       ? getDeliveryEditState(auth.user.role, auth.user.id, {
// //           status: d.status,
// //           billerUserId: d.billerUserId,
// //           dispatchedTagIds: d.dispatchedTagIds,
// //           pickedUpTagIds: d.pickedUpTagIds,
// //           deliveredTagIds: d.deliveredTagIds,
// //           returnPickedUpTagIds: d.returnPickedUpTagIds,
// //           returnedTagIds: d.returnedTagIds,
// //           damagedTagIds: d.damagedTagIds,
// //           lostTagIds: d.lostTagIds,
// //         })
// //       : { canEdit: false, fullLines: false, metadataOnly: false }

// //   const copy = (text: string) => {
// //     navigator.clipboard.writeText(text).catch(() => {})
// //   }

// //   const assignReturnPickup = async (vehicleNumber: string, driverName: string, driverPhone: string, vehicleType: 'PRIVATE' | 'PORTER' | 'OWN') => {
// //     const token = getToken()
// //     if (!token || !id) return
// //     setActionBusy(true)
// //     try {
// //       await apiFetch(`/deliveries/${id}/assign-return-pickup`, {
// //         token,
// //         method: 'POST',
// //         body: JSON.stringify({ vehicleNumber, driverName, driverPhone, vehicleType }),
// //       })
// //       setReturnPickupModalOpen(false)
// //       load()
// //     } catch (e: unknown) {
// //       setError(
// //         e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Assign return pickup failed',
// //       )
// //     } finally {
// //       setActionBusy(false)
// //     }
// //   }

// //   const showReturnPhase = ['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN'].includes(d?.status ?? '')
// //   const showReturnChallan = RETURN_CHALLAN_STATUSES.includes(d?.status ?? '')

// //   const openDeliveryChallan = async () => {
// //     const token = getToken()
// //     if (!token || !id) return
// //     setChallanError(null)
// //     try {
// //       await openDeliveryChallanPdf(id, token)
// //     } catch (e: unknown) {
// //       setChallanError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to open delivery challan')
// //     }
// //   }

// //   const openReturnChallan = async () => {
// //     const token = getToken()
// //     if (!token || !id) return
// //     setChallanError(null)
// //     try {
// //       await openReturnChallanPdf(id, token)
// //     } catch (e: unknown) {
// //       setChallanError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to open return challan')
// //     }
// //   }
// //   const canAssignReturnPickup =
// //     d?.status === 'DELIVERED' && (isAdmin || isGodownUser)

// //   const linesByGodown = useMemo(() => {
// //     if (!d) return []
// //     return groupLinesByGodown(d.lines, d.fromGodownId)
// //   }, [d])

// //   if (!id) return null

// //   if (error && !d) {
// //     return (
// //       <div>
// //         <PageHeader title="Delivery" subtitle="Error" right={<Link to="/deliveries" className="text-sm font-semibold">Back</Link>} />
// //         <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
// //       </div>
// //     )
// //   }

// //   if (!d) {
// //     return (
// //       <div>
// //         <PageHeader title="Delivery" subtitle="Loading?" />
// //       </div>
// //     )
// //   }

// //   return (
// //     <div>
// //       <PageHeader
// //         title={d.deliveryNo}
// //         subtitle={`${d.customerName} · ${d.siteName || d.siteAddress || ''}`}
// //         right={
// //           <div className="flex flex-wrap items-center gap-2">
// //             <Button variant="secondary" size="sm" onClick={openDeliveryChallan} className="inline-flex items-center gap-1.5">
// //               <ChallanPdfIcon className="h-3.5 w-3.5" />
// //               Delivery Challan
// //             </Button>
// //             {showReturnChallan ? (
// //               <Button variant="secondary" size="sm" onClick={openReturnChallan} className="inline-flex items-center gap-1.5">
// //                 <ChallanPdfIcon className="h-3.5 w-3.5" />
// //                 Return Challan
// //               </Button>
// //             ) : null}
// //             {editState.canEdit ? (
// //               <Button
// //                 variant="secondary"
// //                 size="sm"
// //                 onClick={() => setEditOpen(true)}
// //                 title={editState.reason || (editState.metadataOnly ? 'Edit delivery (limited)' : 'Edit delivery')}
// //               >
// //                 Edit
// //               </Button>
// //             ) : null}
// //             {showDeleteDelivery ? (
// //               <DeleteDeliveryButton
// //                 deliveryId={d.id}
// //                 deliveryNo={d.deliveryNo}
// //                 customerName={d.customerName}
// //                 status={d.status}
// //                 billerUserId={d.billerUserId}
// //                 dispatchedTagIds={d.dispatchedTagIds}
// //                 pickedUpTagIds={d.pickedUpTagIds}
// //                 deliveredTagIds={d.deliveredTagIds}
// //                 returnPickedUpTagIds={d.returnPickedUpTagIds}
// //                 returnedTagIds={d.returnedTagIds}
// //                 damagedTagIds={d.damagedTagIds}
// //                 lostTagIds={d.lostTagIds}
// //                 variant="button"
// //                 onDeleted={() => nav('/deliveries')}
// //                 onError={(msg) => setError(msg)}
// //               />
// //             ) : null}
// //             <Link to="/deliveries" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
// //               Back to list
// //             </Link>
// //           </div>
// //         }
// //       />

// //       {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
// //       {challanError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{challanError}</div> : null}

// //       <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm">
// //         <div>
// //           <span className="font-medium text-emerald-800">Area: </span>
// //           <span className="text-slate-700">{d.siteName || '—'}</span>
// //           {d.siteAddress ? <span className="text-slate-500"> · {d.siteAddress}</span> : null}
// //         </div>
// //         <div>
// //           <span className="font-medium text-emerald-800">Godown: </span>
// //           <span className="text-slate-700">
// //             {linesByGodown.map((g) => g.godownName).join(', ') || '?'}
// //           </span>
// //         </div>
// //         <div>
// //           <span className="font-medium text-emerald-800">Products: </span>
// //           <span className="text-slate-700">{d.lines.length} items</span>
// //         </div>
// //         {/* {d.vehicleLabel ? (
// //           <div>
// //             <span className="font-medium text-emerald-800">Vehicle: </span>
// //             <span className="text-slate-700">{d.vehicleLabel}</span>
// //           </div>
// //         ) : null} */}
// //         {d.vehicleLabel ? (
// //           <div>
// //             <span className="font-medium text-emerald-800">Vehicle: </span>
// //             <span className="text-slate-700">{d.vehicleLabel}</span>
// //             {d.vehicleType ? (
// //               <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
// //                 {d.vehicleType === 'PORTER' ? 'Porter' : 'Private'}
// //               </span>
// //             ) : null}
// //           </div>
// //         ) : null}
// //         {d.driverName ? (
// //           <div>
// //             <span className="font-medium text-emerald-800">Driver: </span>
// //             <span className="text-slate-700">{d.driverName}</span>
// //           </div>
// //         ) : null}
// //         {d.driverPhone ? (
// //           <div>
// //             <span className="font-medium text-emerald-800">Driver phone: </span>
// //             <span className="text-slate-700">{d.driverPhone}</span>
// //           </div>
// //         ) : null}
// //       </div>

// //       <ReturnPickupVehicleModal
// //         open={returnPickupModalOpen}
// //         busy={actionBusy}
// //         initialValue={d?.returnPickupVehicleLabel}
// //         initialDriverName={d?.returnPickupDriverName}
// //         initialDriverPhone={d?.returnPickupDriverPhone}
// //         initialVehicleType={d?.returnPickupVehicleType}
// //         onClose={() => setReturnPickupModalOpen(false)}
// //         onConfirm={assignReturnPickup}
// //       />

// //       {showReturnPhase ? (
// //         <ReturnReconciliationCard
// //           status={d.status}
// //           billerReturnUrl={d.billerReturnUrl}
// //           billerReturnSubmittedAt={d.billerReturnSubmittedAt}
// //           damageTotal={d.damageTotal}
// //           missingTotal={d.missingTotal}
// //           onCopyLink={copy}
// //         />
// //       ) : null}

// //       {canAssignReturnPickup && isAdmin && !isGodownUser ? (
// //         <div className="mb-4">
// //           <Button onClick={() => setReturnPickupModalOpen(true)} disabled={actionBusy}>
// //             Assign return pickup
// //           </Button>
// //         </div>
// //       ) : null}

// //       {isGodownUser && d ? (
// //         <GodownDeliveryWorkflow
// //           delivery={{
// //             ...d,
// //             billerReturnUrl: d.billerReturnUrl,
// //             billerReturnSubmittedAt: d.billerReturnSubmittedAt,
// //           }}
// //           onUpdated={load}
// //           onError={(msg) => setError(msg)}
// //         />
// //       ) : null}

// //       <div className="grid gap-4 lg:grid-cols-3">
// //         <Card className="lg:col-span-2">
// //           <CardHeader>
// //             <CardTitle>Overview</CardTitle>
// //           </CardHeader>
// //           <CardContent className="space-y-2 text-sm">
// //             <div className="flex flex-wrap items-center gap-2">
// //               <span className="text-slate-600">Status</span>
// //               <DeliveryStatusSelect
// //                 deliveryId={d.id}
// //                 status={d.status}
// //                 vehicleLabel={d.vehicleLabel}
// //                 driverName={d.driverName}
// //                 driverPhone={d.driverPhone}
// //                 vehicleType={d.vehicleType}
// //                 returnPickupVehicleLabel={d.returnPickupVehicleLabel}
// //                 returnPickupDriverName={d.returnPickupDriverName}
// //                 returnPickupDriverPhone={d.returnPickupDriverPhone}
// //                 returnPickupVehicleType={d.returnPickupVehicleType}
// //                 onUpdated={() => load()}
// //                 onError={(msg) => setError(msg)}
// //               />
// //             </div>
// //             <div>
// //               <span className="text-slate-600">Scheduled: </span>
// //               {formatDateTime(d.deliveryAt)}
// //             </div>
// //             {d.returnExpectedAt ? (
// //               <div>
// //                 <span className="text-slate-600">Return expected: </span>
// //                 {formatDateTime(d.returnExpectedAt)}
// //               </div>
// //             ) : null}
// //             {d.vehicleLabel ? (
// //               <div>
// //                 <span className="text-slate-600">Vehicle: </span>
// //                 {d.vehicleLabel}
// //                 {d.vehicleType ? (
// //                   <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
// //                     {d.vehicleType === 'PORTER' ? 'Porter' : 'Private'}
// //                   </span>
// //                 ) : null}
// //               </div>
// //             ) : null}
// //             {d.driverName ? (
// //               <div>
// //                 <span className="text-slate-600">Driver: </span>
// //                 {d.driverName}
// //               </div>
// //             ) : null}
// //             {d.driverPhone ? (
// //               <div>
// //                 <span className="text-slate-600">Driver phone: </span>
// //                 {d.driverPhone}
// //               </div>
// //             ) : null}
// //             {d.returnPickupVehicleLabel ? (
// //               <div>
// //                 <span className="text-slate-600">Return pickup vehicle: </span>
// //                 {d.returnPickupVehicleLabel}
// //                 {d.returnPickupVehicleType ? (
// //                   <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
// //                     {d.returnPickupVehicleType === 'PORTER' ? 'Porter' : 'Private'}
// //                   </span>
// //                 ) : null}
// //               </div>
// //             ) : null}
// //             {d.returnPickupDriverName ? (
// //               <div>
// //                 <span className="text-slate-600">Return pickup driver: </span>
// //                 {d.returnPickupDriverName}
// //               </div>
// //             ) : null}
// //             {d.returnPickupDriverPhone ? (
// //               <div>
// //                 <span className="text-slate-600">Return pickup driver phone: </span>
// //                 {d.returnPickupDriverPhone}
// //               </div>
// //             ) : null}
// //             {d.contactPhone ? (
// //               <div>
// //                 <span className="text-slate-600">Contact: </span>
// //                 {d.contactPhone}
// //               </div>
// //             ) : null}
// //             {linesByGodown.length > 0 ? (
// //               <div>
// //                 <span className="text-slate-600">Source godowns: </span>
// //                 <span className="text-slate-900">
// //                   {linesByGodown.map((g, i) => (
// //                     <span key={g.godownId}>
// //                       {i > 0 ? ', ' : null}
// //                       <Link to={`/godowns/${g.godownId}`} className="font-semibold text-primary-700 hover:text-primary-900">
// //                         {g.godownName}
// //                       </Link>
// //                     </span>
// //                   ))}
// //                 </span>
// //               </div>
// //             ) : null}
// //             <DeliveryHandoverCard
// //               deliveryVerifiedAt={d.deliveryVerifiedAt}
// //               deliveryVerifierName={d.deliveryVerifierName}
// //               vehicleLabel={d.vehicleLabel}
// //               deliverySignature={d.deliverySignature}
// //               lines={d.lines}
// //             />
// //             <BillerReturnCard
// //               status={d.status}
// //               billerReturnSubmittedAt={d.billerReturnSubmittedAt}
// //               billerMissingLines={d.billerMissingLines}
// //               billerDamagedLines={d.billerDamagedLines}
// //               damageTotal={d.damageTotal}
// //               missingTotal={d.missingTotal}
// //             />
// //           </CardContent>
// //         </Card>

// //         <Card>
// //           <CardHeader className="flex flex-col gap-2">
// //             <CardTitle>Magic links</CardTitle>
// //             {canRegen ? (
// //               <Button
// //                 size="sm"
// //                 variant="secondary"
// //                 onClick={() => {
// //                   const token = getToken()
// //                   if (!token || !id) return
// //                   apiFetch<{ deliveryVerifyUrl: string; billerReturnUrl: string }>(`/deliveries/${id}/regenerate-tokens`, {
// //                     token,
// //                     method: 'POST',
// //                   })
// //                     .then(() => load())
// //                     .catch((e: unknown) =>
// //                       setError(
// //                         e && typeof e === 'object' && 'message' in e
// //                           ? String((e as { message: string }).message)
// //                           : 'Regenerate failed',
// //                       ),
// //                     )
// //                 }}
// //               >
// //                 Regenerate links
// //               </Button>
// //             ) : null}
// //           </CardHeader>
// //           <CardContent className="space-y-3 text-xs">
// //             <div>
// //               <div className="font-semibold text-slate-800">Delivery verify</div>
// //               <div className="break-all text-slate-600">{d.deliveryVerifyUrl || '?'}</div>
// //               {d.deliveryVerifyUrl ? (
// //                 <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.deliveryVerifyUrl || '')}>
// //                   Copy
// //                 </Button>
// //               ) : null}
// //             </div>
// //             <div>
// //               <div className="font-semibold text-slate-800">Biller return</div>
// //               <div className="break-all text-slate-600">{d.billerReturnUrl || '?'}</div>
// //               {d.billerReturnUrl ? (
// //                 <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.billerReturnUrl || '')}>
// //                   Copy
// //                 </Button>
// //               ) : null}
// //             </div>
// //           </CardContent>
// //         </Card>
// //       </div>

// //       <Card className="mt-4">
// //         <CardHeader>
// //           <CardTitle>Products by godown</CardTitle>
// //         </CardHeader>
// //         <CardContent className="space-y-6">
// //           {d.lines.length === 0 ? (
// //             <p className="text-sm text-slate-600">No products on this delivery.</p>
// //           ) : (
// //             linesByGodown.map((group) => {
// //               const units = group.lines.reduce((sum, l) => sum + l.qty, 0)
// //               return (
// //                 <div key={group.godownId} className="overflow-hidden rounded-xl border border-slate-200">
// //                   <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
// //                     <div>
// //                       <Link
// //                         to={`/godowns/${group.godownId}`}
// //                         className="font-semibold text-primary-800 hover:text-primary-950"
// //                       >
// //                         {group.godownName}
// //                       </Link>
// //                       <div className="text-xs text-slate-500">
// //                         {group.lines.length} product{group.lines.length === 1 ? '' : 's'} · {units} unit{units === 1 ? '' : 's'}
// //                       </div>
// //                     </div>
// //                   </div>
// //                   <Table>
// //                     <thead>
// //                       <tr>
// //                         <Th>Product</Th>
// //                         <Th>SKU</Th>
// //                         <Th className="text-right">Ordered</Th>
// //                         <Th className="text-right">{fulfillmentColumnLabel(d.status)}</Th>
// //                         <Th className="text-right">Returned</Th>
// //                         <Th className="text-right">In stock</Th>
// //                       </tr>
// //                     </thead>
// //                     <tbody>
// //                       {group.lines.map((l) => {
// //                         const stock = d.stockByGodown?.[group.godownId]?.[l.productId]
// //                         return (
// //                           <tr key={`${group.godownId}-${l.productId}`} className="hover:bg-slate-50">
// //                             <Td className="font-semibold text-slate-900">{l.particulars || l.productId}</Td>
// //                             <Td className="font-mono text-xs text-slate-600">{l.sku || '—'}</Td>
// //                             <Td className="text-right font-semibold text-slate-900">
// //                               {l.qty}
// //                               {l.unit ? <span className="ml-1 font-normal text-slate-500">{l.unit}</span> : null}
// //                             </Td>
// //                             <Td className="text-right text-slate-700">
// //                               {displayFulfillmentQty(d.status, l, {
// //                                 deliveryVerifiedAt: d.deliveryVerifiedAt,
// //                                 deliveryLineChecks: d.deliveryLineChecks,
// //                                 qtyProgress: d.qtyProgress,
// //                                 deliveredTagIds: d.deliveredTagIds,
// //                               })}
// //                             </Td>
// //                             <Td className="text-right text-slate-700">
// //                               {showDispatchedQty(d.status) ? (l.returnedQty ?? 0) : '—'}
// //                             </Td>
// //                             <Td className="text-right font-semibold text-primary-700">
// //                               {stock !== undefined ? stock : '—'}
// //                             </Td>
// //                           </tr>
// //                         )
// //                       })}
// //                     </tbody>
// //                   </Table>
// //                 </div>
// //               )
// //             })
// //           )}
// //         </CardContent>
// //       </Card>

// //       <CreateDeliveryModal
// //         open={editOpen}
// //         deliveryId={d.id}
// //         onClose={() => setEditOpen(false)}
// //         onCreated={load}
// //         onUpdated={load}
// //       />
// //     </div>
// //   )
// // }

// // import { useEffect, useMemo, useState } from 'react'
// // import { Link, useNavigate, useParams } from 'react-router-dom'
// // import { formatDateTime } from '../../lib/format'
// // import { Button } from '../../components/ui/Button'
// // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // import { PageHeader } from '../../components/ui/PageHeader'
// // import { Table, Td, Th } from '../../components/ui/Table'
// // import { apiFetch } from '../../lib/api'
// // import { getToken, useAuth } from '../../auth/store'
// // import { DeliveryStatusSelect } from '../../components/delivery/DeliveryStatusSelect'
// // import { DeleteDeliveryButton } from '../../components/delivery/DeleteDeliveryButton'
// // import { GodownDeliveryWorkflow } from '../../components/delivery/GodownDeliveryWorkflow'
// // import { ReturnPickupVehicleModal } from '../../components/delivery/ReturnPickupVehicleModal'
// // import { ReturnReconciliationCard } from '../../components/delivery/ReturnReconciliationCard'
// // import {
// //   displayFulfillmentQty,
// //   fulfillmentColumnLabel,
// //   getDeliveryEditState,
// //   showDispatchedQty,
// // } from '../../lib/deliveryStatus'
// // import { DriverDeliveryDetail } from '../../components/delivery/DriverDeliveryDetail'
// // import { BillerReturnCard } from '../../components/delivery/BillerReturnCard'
// // import { DeliveryHandoverCard } from '../../components/delivery/DeliveryHandoverCard'
// // import { CreateDeliveryModal } from './CreateDeliveryModal'
// // import { ChallanPdfIcon, openDeliveryChallanPdf, openReturnChallanPdf } from '../../lib/openChallanPdf'
// // import { groupLinesByGodown } from '../../lib/deliveryLineGroups'

// // const RETURN_CHALLAN_STATUSES = ['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN', 'COMPLETED']

// // type DeliveryLine = {
// //   productId: string
// //   godownId?: string
// //   godownName?: string
// //   qty: number
// //   dispatchedQty?: number
// //   returnedQty?: number
// //   particulars?: string
// //   sku?: string
// //   rate?: string
// //   parsedRate?: number
// //   unit?: string
// // }

// // type BillerReturnLine = {
// //   productId: string
// //   qty: number
// //   particulars?: string
// //   sku?: string
// //   note?: string
// // }

// // type DeliveryDetail = {
// //   id: string
// //   deliveryNo: string
// //   customerName: string
// //   siteName?: string
// //   siteAddress?: string
// //   contactPhone?: string
// //   billerUserId?: string
// //   fromGodownId: string
// //   deliveryAt: string
// //   returnExpectedAt?: string
// // vehicleLabel?: string
// //   driverName?: string
// //   driverPhone?: string
// //   returnPickupVehicleLabel?: string
// //   returnPickupDriverName?: string
// //   returnPickupDriverPhone?: string
// //   status: string
// //   lines: DeliveryLine[]
// //   scanProgress?: {
// //     dispatchComplete?: boolean
// //     returnPickupComplete?: boolean
// //   }
// //   qtyProgress?: {
// //     dispatchComplete?: boolean
// //     dispatchedByProduct?: Record<string, number>
// //     deliveredByProduct?: Record<string, number>
// //     returnedByProduct?: Record<string, number>
// //   }
// //   deliveryLineChecks?: Array<{ productId: string; qtyAck?: number; ok?: boolean }>
// //   stockByGodown?: Record<string, Record<string, number>>
// //   deliveryVerifierName?: string
// //   deliveryVerifiedAt?: string
// //   deliverySignature?: string
// //   billerReturnSubmittedAt?: string
// //   billerMissingLines?: BillerReturnLine[]
// //   billerDamagedLines?: BillerReturnLine[]
// //   damageTotal?: number
// //   missingTotal?: number
// //   deliveryVerifyUrl?: string
// //   billerReturnUrl?: string
// //   dispatchedTagIds?: string[]
// //   pickedUpTagIds?: string[]
// //   deliveredTagIds?: string[]
// //   returnPickedUpTagIds?: string[]
// //   returnedTagIds?: string[]
// //   damagedTagIds?: string[]
// //   lostTagIds?: string[]
// // }

// // export function DeliveryDetailPage() {
// //   const { id } = useParams()
// //   const auth = useAuth()
// //   if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY') {
// //     return <DriverDeliveryDetail deliveryId={id} />
// //   }
// //   return <AdminDeliveryDetailPage />
// // }

// // function AdminDeliveryDetailPage() {
// //   const { id } = useParams()
// //   const nav = useNavigate()
// //   const auth = useAuth()
// //   const [d, setD] = useState<DeliveryDetail | null>(null)
// //   const [error, setError] = useState<string | null>(null)
// //   const [returnPickupModalOpen, setReturnPickupModalOpen] = useState(false)
// //   const [actionBusy, setActionBusy] = useState(false)
// //   const [editOpen, setEditOpen] = useState(false)
// //   const [challanError, setChallanError] = useState<string | null>(null)

// //   const load = () => {
// //     const token = getToken()
// //     if (!token || !id) return
// //     setError(null)
// //     apiFetch<DeliveryDetail>(`/deliveries/${id}`, { token })
// //       .then(setD)
// //       .catch((e: unknown) =>
// //         setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load'),
// //       )
// //   }

// //   useEffect(() => {
// //     load()
// //   }, [id])

// //   const role = auth.status === 'authenticated' ? auth.user.role : ''
// //   const canRegen = role === 'ADMIN'
// //   const isGodownUser = role === 'GODOWN'
// //   const isAdmin = role === 'ADMIN'
// //   const showDeleteDelivery =
// //     auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')

// //   const editState =
// //     d && auth.status === 'authenticated'
// //       ? getDeliveryEditState(auth.user.role, auth.user.id, {
// //           status: d.status,
// //           billerUserId: d.billerUserId,
// //           dispatchedTagIds: d.dispatchedTagIds,
// //           pickedUpTagIds: d.pickedUpTagIds,
// //           deliveredTagIds: d.deliveredTagIds,
// //           returnPickedUpTagIds: d.returnPickedUpTagIds,
// //           returnedTagIds: d.returnedTagIds,
// //           damagedTagIds: d.damagedTagIds,
// //           lostTagIds: d.lostTagIds,
// //         })
// //       : { canEdit: false, fullLines: false, metadataOnly: false }

// //   const copy = (text: string) => {
// //     navigator.clipboard.writeText(text).catch(() => {})
// //   }

// //   const assignReturnPickup = async (vehicleNumber: string) => {
// //     const token = getToken()
// //     if (!token || !id) return
// //     setActionBusy(true)
// //     try {
// //       await apiFetch(`/deliveries/${id}/assign-return-pickup`, {
// //         token,
// //         method: 'POST',
// //         body: JSON.stringify({ vehicleNumber }),
// //       })
// //       setReturnPickupModalOpen(false)
// //       load()
// //     } catch (e: unknown) {
// //       setError(
// //         e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Assign return pickup failed',
// //       )
// //     } finally {
// //       setActionBusy(false)
// //     }
// //   }

// //   const showReturnPhase = ['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN'].includes(d?.status ?? '')
// //   const showReturnChallan = RETURN_CHALLAN_STATUSES.includes(d?.status ?? '')

// //   const openDeliveryChallan = async () => {
// //     const token = getToken()
// //     if (!token || !id) return
// //     setChallanError(null)
// //     try {
// //       await openDeliveryChallanPdf(id, token)
// //     } catch (e: unknown) {
// //       setChallanError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to open delivery challan')
// //     }
// //   }

// //   const openReturnChallan = async () => {
// //     const token = getToken()
// //     if (!token || !id) return
// //     setChallanError(null)
// //     try {
// //       await openReturnChallanPdf(id, token)
// //     } catch (e: unknown) {
// //       setChallanError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to open return challan')
// //     }
// //   }
// //   const canAssignReturnPickup =
// //     d?.status === 'DELIVERED' && (isAdmin || isGodownUser)

// //   const linesByGodown = useMemo(() => {
// //     if (!d) return []
// //     return groupLinesByGodown(d.lines, d.fromGodownId)
// //   }, [d])

// //   if (!id) return null

// //   if (error && !d) {
// //     return (
// //       <div>
// //         <PageHeader title="Delivery" subtitle="Error" right={<Link to="/deliveries" className="text-sm font-semibold">Back</Link>} />
// //         <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
// //       </div>
// //     )
// //   }

// //   if (!d) {
// //     return (
// //       <div>
// //         <PageHeader title="Delivery" subtitle="Loading?" />
// //       </div>
// //     )
// //   }

// //   return (
// //     <div>
// //       <PageHeader
// //         title={d.deliveryNo}
// //         subtitle={`${d.customerName} · ${d.siteName || d.siteAddress || ''}`}
// //         right={
// //           <div className="flex flex-wrap items-center gap-2">
// //             <Button variant="secondary" size="sm" onClick={openDeliveryChallan} className="inline-flex items-center gap-1.5">
// //               <ChallanPdfIcon className="h-3.5 w-3.5" />
// //               Delivery Challan
// //             </Button>
// //             {showReturnChallan ? (
// //               <Button variant="secondary" size="sm" onClick={openReturnChallan} className="inline-flex items-center gap-1.5">
// //                 <ChallanPdfIcon className="h-3.5 w-3.5" />
// //                 Return Challan
// //               </Button>
// //             ) : null}
// //             {editState.canEdit ? (
// //               <Button
// //                 variant="secondary"
// //                 size="sm"
// //                 onClick={() => setEditOpen(true)}
// //                 title={editState.reason || (editState.metadataOnly ? 'Edit delivery (limited)' : 'Edit delivery')}
// //               >
// //                 Edit
// //               </Button>
// //             ) : null}
// //             {showDeleteDelivery ? (
// //               <DeleteDeliveryButton
// //                 deliveryId={d.id}
// //                 deliveryNo={d.deliveryNo}
// //                 customerName={d.customerName}
// //                 status={d.status}
// //                 billerUserId={d.billerUserId}
// //                 dispatchedTagIds={d.dispatchedTagIds}
// //                 pickedUpTagIds={d.pickedUpTagIds}
// //                 deliveredTagIds={d.deliveredTagIds}
// //                 returnPickedUpTagIds={d.returnPickedUpTagIds}
// //                 returnedTagIds={d.returnedTagIds}
// //                 damagedTagIds={d.damagedTagIds}
// //                 lostTagIds={d.lostTagIds}
// //                 variant="button"
// //                 onDeleted={() => nav('/deliveries')}
// //                 onError={(msg) => setError(msg)}
// //               />
// //             ) : null}
// //             <Link to="/deliveries" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
// //               Back to list
// //             </Link>
// //           </div>
// //         }
// //       />

// //       {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
// //       {challanError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{challanError}</div> : null}

// //       <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm">
// //         <div>
// //           <span className="font-medium text-emerald-800">Area: </span>
// //           <span className="text-slate-700">{d.siteName || '—'}</span>
// //           {d.siteAddress ? <span className="text-slate-500"> · {d.siteAddress}</span> : null}
// //         </div>
// //         <div>
// //           <span className="font-medium text-emerald-800">Godown: </span>
// //           <span className="text-slate-700">
// //             {linesByGodown.map((g) => g.godownName).join(', ') || '?'}
// //           </span>
// //         </div>
// //         <div>
// //           <span className="font-medium text-emerald-800">Products: </span>
// //           <span className="text-slate-700">{d.lines.length} items</span>
// //         </div>
// //         {/* {d.vehicleLabel ? (
// //           <div>
// //             <span className="font-medium text-emerald-800">Vehicle: </span>
// //             <span className="text-slate-700">{d.vehicleLabel}</span>
// //           </div>
// //         ) : null} */}
// //         {d.vehicleLabel ? (
// //           <div>
// //             <span className="font-medium text-emerald-800">Vehicle: </span>
// //             <span className="text-slate-700">{d.vehicleLabel}</span>
// //           </div>
// //         ) : null}
// //         {d.driverName ? (
// //           <div>
// //             <span className="font-medium text-emerald-800">Driver: </span>
// //             <span className="text-slate-700">{d.driverName}</span>
// //           </div>
// //         ) : null}
// //         {d.driverPhone ? (
// //           <div>
// //             <span className="font-medium text-emerald-800">Driver phone: </span>
// //             <span className="text-slate-700">{d.driverPhone}</span>
// //           </div>
// //         ) : null}
// //       </div>

// //       <ReturnPickupVehicleModal
// //         open={returnPickupModalOpen}
// //         busy={actionBusy}
// //         initialValue={d?.returnPickupVehicleLabel}
// //         onClose={() => setReturnPickupModalOpen(false)}
// //         onConfirm={assignReturnPickup}
// //       />

// //       {showReturnPhase ? (
// //         <ReturnReconciliationCard
// //           status={d.status}
// //           billerReturnUrl={d.billerReturnUrl}
// //           billerReturnSubmittedAt={d.billerReturnSubmittedAt}
// //           damageTotal={d.damageTotal}
// //           missingTotal={d.missingTotal}
// //           onCopyLink={copy}
// //         />
// //       ) : null}

// //       {canAssignReturnPickup && isAdmin && !isGodownUser ? (
// //         <div className="mb-4">
// //           <Button onClick={() => setReturnPickupModalOpen(true)} disabled={actionBusy}>
// //             Assign return pickup
// //           </Button>
// //         </div>
// //       ) : null}

// //       {isGodownUser && d ? (
// //         <GodownDeliveryWorkflow
// //           delivery={{
// //             ...d,
// //             billerReturnUrl: d.billerReturnUrl,
// //             billerReturnSubmittedAt: d.billerReturnSubmittedAt,
// //           }}
// //           onUpdated={load}
// //           onError={(msg) => setError(msg)}
// //         />
// //       ) : null}

// //       <div className="grid gap-4 lg:grid-cols-3">
// //         <Card className="lg:col-span-2">
// //           <CardHeader>
// //             <CardTitle>Overview</CardTitle>
// //           </CardHeader>
// //           <CardContent className="space-y-2 text-sm">
// //             <div className="flex flex-wrap items-center gap-2">
// //               <span className="text-slate-600">Status</span>
// //               <DeliveryStatusSelect
// //                 deliveryId={d.id}
// //                 status={d.status}
// //                 vehicleLabel={d.vehicleLabel}
// //                 driverName={d.driverName}
// //                 driverPhone={d.driverPhone}
// //                 returnPickupVehicleLabel={d.returnPickupVehicleLabel}
// //                 returnPickupDriverName={d.returnPickupDriverName}
// //                 returnPickupDriverPhone={d.returnPickupDriverPhone}
// //                 onUpdated={() => load()}
// //                 onError={(msg) => setError(msg)}
// //               />
// //             </div>
// //             <div>
// //               <span className="text-slate-600">Scheduled: </span>
// //               {formatDateTime(d.deliveryAt)}
// //             </div>
// //             {d.returnExpectedAt ? (
// //               <div>
// //                 <span className="text-slate-600">Return expected: </span>
// //                 {formatDateTime(d.returnExpectedAt)}
// //               </div>
// //             ) : null}
// //             {d.vehicleLabel ? (
// //               <div>
// //                 <span className="text-slate-600">Vehicle: </span>
// //                 {d.vehicleLabel}
// //               </div>
// //             ) : null}
// //             {d.driverName ? (
// //               <div>
// //                 <span className="text-slate-600">Driver: </span>
// //                 {d.driverName}
// //               </div>
// //             ) : null}
// //             {d.driverPhone ? (
// //               <div>
// //                 <span className="text-slate-600">Driver phone: </span>
// //                 {d.driverPhone}
// //               </div>
// //             ) : null}
// //             {d.returnPickupVehicleLabel ? (
// //               <div>
// //                 <span className="text-slate-600">Return pickup vehicle: </span>
// //                 {d.returnPickupVehicleLabel}
// //               </div>
// //             ) : null}
// //             {d.returnPickupDriverName ? (
// //               <div>
// //                 <span className="text-slate-600">Return pickup driver: </span>
// //                 {d.returnPickupDriverName}
// //               </div>
// //             ) : null}
// //             {d.returnPickupDriverPhone ? (
// //               <div>
// //                 <span className="text-slate-600">Return pickup driver phone: </span>
// //                 {d.returnPickupDriverPhone}
// //               </div>
// //             ) : null}
// //             {d.contactPhone ? (
// //               <div>
// //                 <span className="text-slate-600">Contact: </span>
// //                 {d.contactPhone}
// //               </div>
// //             ) : null}
// //             {linesByGodown.length > 0 ? (
// //               <div>
// //                 <span className="text-slate-600">Source godowns: </span>
// //                 <span className="text-slate-900">
// //                   {linesByGodown.map((g, i) => (
// //                     <span key={g.godownId}>
// //                       {i > 0 ? ', ' : null}
// //                       <Link to={`/godowns/${g.godownId}`} className="font-semibold text-primary-700 hover:text-primary-900">
// //                         {g.godownName}
// //                       </Link>
// //                     </span>
// //                   ))}
// //                 </span>
// //               </div>
// //             ) : null}
// //             <DeliveryHandoverCard
// //               deliveryVerifiedAt={d.deliveryVerifiedAt}
// //               deliveryVerifierName={d.deliveryVerifierName}
// //               vehicleLabel={d.vehicleLabel}
// //               deliverySignature={d.deliverySignature}
// //               lines={d.lines}
// //             />
// //             <BillerReturnCard
// //               status={d.status}
// //               billerReturnSubmittedAt={d.billerReturnSubmittedAt}
// //               billerMissingLines={d.billerMissingLines}
// //               billerDamagedLines={d.billerDamagedLines}
// //               damageTotal={d.damageTotal}
// //               missingTotal={d.missingTotal}
// //             />
// //           </CardContent>
// //         </Card>

// //         <Card>
// //           <CardHeader className="flex flex-col gap-2">
// //             <CardTitle>Magic links</CardTitle>
// //             {canRegen ? (
// //               <Button
// //                 size="sm"
// //                 variant="secondary"
// //                 onClick={() => {
// //                   const token = getToken()
// //                   if (!token || !id) return
// //                   apiFetch<{ deliveryVerifyUrl: string; billerReturnUrl: string }>(`/deliveries/${id}/regenerate-tokens`, {
// //                     token,
// //                     method: 'POST',
// //                   })
// //                     .then(() => load())
// //                     .catch((e: unknown) =>
// //                       setError(
// //                         e && typeof e === 'object' && 'message' in e
// //                           ? String((e as { message: string }).message)
// //                           : 'Regenerate failed',
// //                       ),
// //                     )
// //                 }}
// //               >
// //                 Regenerate links
// //               </Button>
// //             ) : null}
// //           </CardHeader>
// //           <CardContent className="space-y-3 text-xs">
// //             <div>
// //               <div className="font-semibold text-slate-800">Delivery verify</div>
// //               <div className="break-all text-slate-600">{d.deliveryVerifyUrl || '?'}</div>
// //               {d.deliveryVerifyUrl ? (
// //                 <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.deliveryVerifyUrl || '')}>
// //                   Copy
// //                 </Button>
// //               ) : null}
// //             </div>
// //             <div>
// //               <div className="font-semibold text-slate-800">Biller return</div>
// //               <div className="break-all text-slate-600">{d.billerReturnUrl || '?'}</div>
// //               {d.billerReturnUrl ? (
// //                 <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.billerReturnUrl || '')}>
// //                   Copy
// //                 </Button>
// //               ) : null}
// //             </div>
// //           </CardContent>
// //         </Card>
// //       </div>

// //       <Card className="mt-4">
// //         <CardHeader>
// //           <CardTitle>Products by godown</CardTitle>
// //         </CardHeader>
// //         <CardContent className="space-y-6">
// //           {d.lines.length === 0 ? (
// //             <p className="text-sm text-slate-600">No products on this delivery.</p>
// //           ) : (
// //             linesByGodown.map((group) => {
// //               const units = group.lines.reduce((sum, l) => sum + l.qty, 0)
// //               return (
// //                 <div key={group.godownId} className="overflow-hidden rounded-xl border border-slate-200">
// //                   <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
// //                     <div>
// //                       <Link
// //                         to={`/godowns/${group.godownId}`}
// //                         className="font-semibold text-primary-800 hover:text-primary-950"
// //                       >
// //                         {group.godownName}
// //                       </Link>
// //                       <div className="text-xs text-slate-500">
// //                         {group.lines.length} product{group.lines.length === 1 ? '' : 's'} · {units} unit{units === 1 ? '' : 's'}
// //                       </div>
// //                     </div>
// //                   </div>
// //                   <Table>
// //                     <thead>
// //                       <tr>
// //                         <Th>Product</Th>
// //                         <Th>SKU</Th>
// //                         <Th className="text-right">Ordered</Th>
// //                         <Th className="text-right">{fulfillmentColumnLabel(d.status)}</Th>
// //                         <Th className="text-right">Returned</Th>
// //                         <Th className="text-right">In stock</Th>
// //                       </tr>
// //                     </thead>
// //                     <tbody>
// //                       {group.lines.map((l) => {
// //                         const stock = d.stockByGodown?.[group.godownId]?.[l.productId]
// //                         return (
// //                           <tr key={`${group.godownId}-${l.productId}`} className="hover:bg-slate-50">
// //                             <Td className="font-semibold text-slate-900">{l.particulars || l.productId}</Td>
// //                             <Td className="font-mono text-xs text-slate-600">{l.sku || '—'}</Td>
// //                             <Td className="text-right font-semibold text-slate-900">
// //                               {l.qty}
// //                               {l.unit ? <span className="ml-1 font-normal text-slate-500">{l.unit}</span> : null}
// //                             </Td>
// //                             <Td className="text-right text-slate-700">
// //                               {displayFulfillmentQty(d.status, l, {
// //                                 deliveryVerifiedAt: d.deliveryVerifiedAt,
// //                                 deliveryLineChecks: d.deliveryLineChecks,
// //                                 qtyProgress: d.qtyProgress,
// //                                 deliveredTagIds: d.deliveredTagIds,
// //                               })}
// //                             </Td>
// //                             <Td className="text-right text-slate-700">
// //                               {showDispatchedQty(d.status) ? (l.returnedQty ?? 0) : '—'}
// //                             </Td>
// //                             <Td className="text-right font-semibold text-primary-700">
// //                               {stock !== undefined ? stock : '—'}
// //                             </Td>
// //                           </tr>
// //                         )
// //                       })}
// //                     </tbody>
// //                   </Table>
// //                 </div>
// //               )
// //             })
// //           )}
// //         </CardContent>
// //       </Card>

// //       <CreateDeliveryModal
// //         open={editOpen}
// //         deliveryId={d.id}
// //         onClose={() => setEditOpen(false)}
// //         onCreated={load}
// //         onUpdated={load}
// //       />
// //     </div>
// //   )
// // }


// import { useEffect, useMemo, useState } from 'react'
// import { Link, useNavigate, useParams } from 'react-router-dom'
// import { formatDateTime } from '../../lib/format'
// import { Button } from '../../components/ui/Button'
// import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// import { PageHeader } from '../../components/ui/PageHeader'
// import { Table, Td, Th } from '../../components/ui/Table'
// import { apiFetch } from '../../lib/api'
// import { getToken, useAuth } from '../../auth/store'
// import { DeliveryStatusSelect } from '../../components/delivery/DeliveryStatusSelect'
// import { DeleteDeliveryButton } from '../../components/delivery/DeleteDeliveryButton'
// import { GodownDeliveryWorkflow } from '../../components/delivery/GodownDeliveryWorkflow'
// import { ReturnPickupVehicleModal } from '../../components/delivery/ReturnPickupVehicleModal'
// import { ReturnReconciliationCard } from '../../components/delivery/ReturnReconciliationCard'
// import {
//   displayFulfillmentQty,
//   fulfillmentColumnLabel,
//   getDeliveryEditState,
//   showDispatchedQty,
// } from '../../lib/deliveryStatus'
// import { DriverDeliveryDetail } from '../../components/delivery/DriverDeliveryDetail'
// import { BillerReturnCard } from '../../components/delivery/BillerReturnCard'
// import { DeliveryHandoverCard } from '../../components/delivery/DeliveryHandoverCard'
// import { CreateDeliveryModal } from './CreateDeliveryModal'
// import { ChallanPdfIcon, openDeliveryChallanPdf, openReturnChallanPdf } from '../../lib/openChallanPdf'
// import { groupLinesByGodown } from '../../lib/deliveryLineGroups'

// const RETURN_CHALLAN_STATUSES = ['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN', 'COMPLETED']

// type DeliveryLine = {
//   productId: string
//   godownId?: string
//   godownName?: string
//   qty: number
//   dispatchedQty?: number
//   returnedQty?: number
//   particulars?: string
//   sku?: string
//   rate?: string
//   parsedRate?: number
//   unit?: string
// }

// type BillerReturnLine = {
//   productId: string
//   qty: number
//   particulars?: string
//   sku?: string
//   note?: string
// }

// type DeliveryDetail = {
//   id: string
//   deliveryNo: string
//   customerName: string
//   siteName?: string
//   siteAddress?: string
//   contactPhone?: string
//   billerUserId?: string
//   fromGodownId: string
//   deliveryAt: string
//   returnExpectedAt?: string
// vehicleLabel?: string
//   driverName?: string
//   driverPhone?: string
//   vehicleType?: 'PRIVATE' | 'PORTER' | 'OWN'
//   returnPickupVehicleLabel?: string
//   returnPickupDriverName?: string
//   returnPickupDriverPhone?: string
//   returnPickupVehicleType?: 'PRIVATE' | 'PORTER' | 'OWN'
//   status: string
//   billingType?: 'FREE' | 'INVOICE'
//   invoiceNo?: string
//   invoiceAmount?: string
//   billedAt?: string
//   lines: DeliveryLine[]
//   scanProgress?: {
//     dispatchComplete?: boolean
//     returnPickupComplete?: boolean
//   }
//   qtyProgress?: {
//     dispatchComplete?: boolean
//     dispatchedByProduct?: Record<string, number>
//     deliveredByProduct?: Record<string, number>
//     returnedByProduct?: Record<string, number>
//   }
//   deliveryLineChecks?: Array<{ productId: string; qtyAck?: number; ok?: boolean }>
//   stockByGodown?: Record<string, Record<string, number>>
//   deliveryVerifierName?: string
//   deliveryVerifiedAt?: string
//   deliverySignature?: string
//   billerReturnSubmittedAt?: string
//   billerMissingLines?: BillerReturnLine[]
//   billerDamagedLines?: BillerReturnLine[]
//   billerCollectedLines?: BillerReturnLine[]
//   damageTotal?: number
//   missingTotal?: number
//   billerPendingReturnLines?: BillerReturnLine[]
//   billerPendingReturnAt?: string
//   billerPendingReturnSlot?: 'MORNING' | 'AFTERNOON' | 'EVENING'
//   billerPendingReturnNote?: string
//   deliveryVerifyUrl?: string
//   billerReturnUrl?: string
//   dispatchedTagIds?: string[]
//   pickedUpTagIds?: string[]
//   deliveredTagIds?: string[]
//   returnPickedUpTagIds?: string[]
//   returnedTagIds?: string[]
//   damagedTagIds?: string[]
//   lostTagIds?: string[]
// }

// export function DeliveryDetailPage() {
//   const { id } = useParams()
//   const auth = useAuth()
//   if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY') {
//     return <DriverDeliveryDetail deliveryId={id} />
//   }
//   return <AdminDeliveryDetailPage />
// }

// function AdminDeliveryDetailPage() {
//   const { id } = useParams()
//   const nav = useNavigate()
//   const auth = useAuth()
//   const [d, setD] = useState<DeliveryDetail | null>(null)
//   const [error, setError] = useState<string | null>(null)
//   const [returnPickupModalOpen, setReturnPickupModalOpen] = useState(false)
//   const [actionBusy, setActionBusy] = useState(false)
//   const [editOpen, setEditOpen] = useState(false)
//   const [challanError, setChallanError] = useState<string | null>(null)

//   const load = () => {
//     const token = getToken()
//     if (!token || !id) return
//     setError(null)
//     apiFetch<DeliveryDetail>(`/deliveries/${id}`, { token })
//       .then(setD)
//       .catch((e: unknown) =>
//         setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load'),
//       )
//   }

//   useEffect(() => {
//     load()
//   }, [id])

//   const role = auth.status === 'authenticated' ? auth.user.role : ''
//   const canRegen = role === 'ADMIN'
//   const isGodownUser = role === 'GODOWN'
//   const isAdmin = role === 'ADMIN'
//   const showDeleteDelivery =
//     auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')

//   const editState =
//     d && auth.status === 'authenticated'
//       ? getDeliveryEditState(auth.user.role, auth.user.id, {
//           status: d.status,
//           billerUserId: d.billerUserId,
//           dispatchedTagIds: d.dispatchedTagIds,
//           pickedUpTagIds: d.pickedUpTagIds,
//           deliveredTagIds: d.deliveredTagIds,
//           returnPickedUpTagIds: d.returnPickedUpTagIds,
//           returnedTagIds: d.returnedTagIds,
//           damagedTagIds: d.damagedTagIds,
//           lostTagIds: d.lostTagIds,
//         })
//       : { canEdit: false, fullLines: false, metadataOnly: false }

//   const copy = (text: string) => {
//     navigator.clipboard.writeText(text).catch(() => {})
//   }

//   const assignReturnPickup = async (vehicleNumber: string, driverName: string, driverPhone: string, vehicleType: 'PRIVATE' | 'PORTER' | 'OWN') => {
//     const token = getToken()
//     if (!token || !id) return
//     setActionBusy(true)
//     try {
//       await apiFetch(`/deliveries/${id}/assign-return-pickup`, {
//         token,
//         method: 'POST',
//         body: JSON.stringify({ vehicleNumber, driverName, driverPhone, vehicleType }),
//       })
//       setReturnPickupModalOpen(false)
//       load()
//     } catch (e: unknown) {
//       setError(
//         e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Assign return pickup failed',
//       )
//     } finally {
//       setActionBusy(false)
//     }
//   }

//   const showReturnPhase = ['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN'].includes(d?.status ?? '')
//   const showReturnChallan = RETURN_CHALLAN_STATUSES.includes(d?.status ?? '')

//   const openDeliveryChallan = async () => {
//     const token = getToken()
//     if (!token || !id) return
//     setChallanError(null)
//     try {
//       await openDeliveryChallanPdf(id, token)
//     } catch (e: unknown) {
//       setChallanError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to open delivery challan')
//     }
//   }

//   const openReturnChallan = async () => {
//     const token = getToken()
//     if (!token || !id) return
//     setChallanError(null)
//     try {
//       await openReturnChallanPdf(id, token)
//     } catch (e: unknown) {
//       setChallanError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to open return challan')
//     }
//   }
//   const canAssignReturnPickup =
//     d?.status === 'DELIVERED' && (isAdmin || isGodownUser)

//   const linesByGodown = useMemo(() => {
//     if (!d) return []
//     return groupLinesByGodown(d.lines, d.fromGodownId)
//   }, [d])

//   if (!id) return null

//   if (error && !d) {
//     return (
//       <div>
//         <PageHeader title="Delivery" subtitle="Error" right={<Link to="/deliveries" className="text-sm font-semibold">Back</Link>} />
//         <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
//       </div>
//     )
//   }

//   if (!d) {
//     return (
//       <div>
//         <PageHeader title="Delivery" subtitle="Loading?" />
//       </div>
//     )
//   }

//   return (
//     <div>
//       <PageHeader
//         title={d.deliveryNo}
//         subtitle={`${d.customerName} · ${d.siteName || d.siteAddress || ''}`}
//         right={
//           <div className="flex flex-wrap items-center gap-2">
//             <Button variant="secondary" size="sm" onClick={openDeliveryChallan} className="inline-flex items-center gap-1.5">
//               <ChallanPdfIcon className="h-3.5 w-3.5" />
//               Delivery Challan
//             </Button>
//             {showReturnChallan ? (
//               <Button variant="secondary" size="sm" onClick={openReturnChallan} className="inline-flex items-center gap-1.5">
//                 <ChallanPdfIcon className="h-3.5 w-3.5" />
//                 Return Challan
//               </Button>
//             ) : null}
//             {editState.canEdit ? (
//               <Button
//                 variant="secondary"
//                 size="sm"
//                 onClick={() => setEditOpen(true)}
//                 title={editState.reason || (editState.metadataOnly ? 'Edit delivery (limited)' : 'Edit delivery')}
//               >
//                 Edit
//               </Button>
//             ) : null}
//             {showDeleteDelivery ? (
//               <DeleteDeliveryButton
//                 deliveryId={d.id}
//                 deliveryNo={d.deliveryNo}
//                 customerName={d.customerName}
//                 status={d.status}
//                 billerUserId={d.billerUserId}
//                 dispatchedTagIds={d.dispatchedTagIds}
//                 pickedUpTagIds={d.pickedUpTagIds}
//                 deliveredTagIds={d.deliveredTagIds}
//                 returnPickedUpTagIds={d.returnPickedUpTagIds}
//                 returnedTagIds={d.returnedTagIds}
//                 damagedTagIds={d.damagedTagIds}
//                 lostTagIds={d.lostTagIds}
//                 variant="button"
//                 onDeleted={() => nav('/deliveries')}
//                 onError={(msg) => setError(msg)}
//               />
//             ) : null}
//             <Link to="/deliveries" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
//               Back to list
//             </Link>
//           </div>
//         }
//       />

//       {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
//       {challanError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{challanError}</div> : null}

//       <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm">
//         <div>
//           <span className="font-medium text-emerald-800">Area: </span>
//           <span className="text-slate-700">{d.siteName || '—'}</span>
//           {d.siteAddress ? <span className="text-slate-500"> · {d.siteAddress}</span> : null}
//         </div>
//         <div>
//           <span className="font-medium text-emerald-800">Godown: </span>
//           <span className="text-slate-700">
//             {linesByGodown.map((g) => g.godownName).join(', ') || '?'}
//           </span>
//         </div>
//         <div>
//           <span className="font-medium text-emerald-800">Products: </span>
//           <span className="text-slate-700">{d.lines.length} items</span>
//         </div>
//         {/* {d.vehicleLabel ? (
//           <div>
//             <span className="font-medium text-emerald-800">Vehicle: </span>
//             <span className="text-slate-700">{d.vehicleLabel}</span>
//           </div>
//         ) : null} */}
//         {d.vehicleLabel ? (
//           <div>
//             <span className="font-medium text-emerald-800">Vehicle: </span>
//             <span className="text-slate-700">{d.vehicleLabel}</span>
//             {d.vehicleType ? (
//               <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
//                 {d.vehicleType === 'PORTER' ? 'Porter' : d.vehicleType === 'OWN' ? 'Own' : 'Private'}
//               </span>
//             ) : null}
//           </div>
//         ) : null}
//         {d.driverName ? (
//           <div>
//             <span className="font-medium text-emerald-800">Driver: </span>
//             <span className="text-slate-700">{d.driverName}</span>
//           </div>
//         ) : null}
//         {d.driverPhone ? (
//           <div>
//             <span className="font-medium text-emerald-800">Driver phone: </span>
//             <span className="text-slate-700">{d.driverPhone}</span>
//           </div>
//         ) : null}
//       </div>

//       <ReturnPickupVehicleModal
//         open={returnPickupModalOpen}
//         busy={actionBusy}
//         initialValue={d?.returnPickupVehicleLabel}
//         initialDriverName={d?.returnPickupDriverName}
//         initialDriverPhone={d?.returnPickupDriverPhone}
//         initialVehicleType={d?.returnPickupVehicleType}
//         onClose={() => setReturnPickupModalOpen(false)}
//         onConfirm={assignReturnPickup}
//       />

//       {showReturnPhase ? (
//         <ReturnReconciliationCard
//           status={d.status}
//           billerReturnUrl={d.billerReturnUrl}
//           billerReturnSubmittedAt={d.billerReturnSubmittedAt}
//           damageTotal={d.damageTotal}
//           missingTotal={d.missingTotal}
//           onCopyLink={copy}
//         />
//       ) : null}

//       {canAssignReturnPickup && isAdmin && !isGodownUser ? (
//         <div className="mb-4">
//           <Button onClick={() => setReturnPickupModalOpen(true)} disabled={actionBusy}>
//             Assign return pickup
//           </Button>
//         </div>
//       ) : null}

//       {isGodownUser && d ? (
//         <GodownDeliveryWorkflow
//           delivery={{
//             ...d,
//             billerReturnUrl: d.billerReturnUrl,
//             billerReturnSubmittedAt: d.billerReturnSubmittedAt,
//           }}
//           onUpdated={load}
//           onError={(msg) => setError(msg)}
//         />
//       ) : null}

//       <div className="grid gap-4 lg:grid-cols-3">
//         <Card className="lg:col-span-2">
//           <CardHeader>
//             <CardTitle>Overview</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-2 text-sm">
//             <div className="flex flex-wrap items-center gap-2">
//               <span className="text-slate-600">Status</span>
//               <DeliveryStatusSelect
//                 deliveryId={d.id}
//                 status={d.status}
//                 vehicleLabel={d.vehicleLabel}
//                 driverName={d.driverName}
//                 driverPhone={d.driverPhone}
//                 vehicleType={d.vehicleType}
//                 returnPickupVehicleLabel={d.returnPickupVehicleLabel}
//                 returnPickupDriverName={d.returnPickupDriverName}
//                 returnPickupDriverPhone={d.returnPickupDriverPhone}
//                 returnPickupVehicleType={d.returnPickupVehicleType}
//                 billingType={d.billingType}
//                 invoiceNo={d.invoiceNo}
//                 onUpdated={() => load()}
//                 onError={(msg) => setError(msg)}
//               />
//               {d.status === 'BILLED' && d.billingType ? (
//                 d.billingType === 'FREE' ? (
//                   <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
//                     Billed Free
//                   </span>
//                 ) : (
//                   <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
//                     Invoice {d.invoiceNo}
//                     {d.invoiceAmount ? <span className="font-normal text-blue-500">· ₹{d.invoiceAmount}</span> : null}
//                   </span>
//                 )
//               ) : null}
//             </div>
//             <div>
//               <span className="text-slate-600">Scheduled: </span>
//               {formatDateTime(d.deliveryAt)}
//             </div>
//             {d.returnExpectedAt ? (
//               <div>
//                 <span className="text-slate-600">Return expected: </span>
//                 {formatDateTime(d.returnExpectedAt)}
//               </div>
//             ) : null}
//             {(d.vehicleLabel || d.driverName || d.driverPhone || d.returnPickupVehicleLabel || d.returnPickupDriverName || d.returnPickupDriverPhone) ? (
//               <div className="grid gap-3 sm:grid-cols-2">
//                 {/* Delivery vehicle — left side */}
//                 <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
//                   <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                     Delivery vehicle
//                   </p>
//                   {d.vehicleLabel ? (
//                     <div>
//                       <span className="text-slate-600">Vehicle: </span>
//                       {d.vehicleLabel}
//                       {d.vehicleType ? (
//                         <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
//                           {d.vehicleType === 'PORTER' ? 'Porter' : d.vehicleType === 'OWN' ? 'Own' : 'Private'}
//                         </span>
//                       ) : null}
//                     </div>
//                   ) : null}
//                   {d.driverName ? (
//                     <div>
//                       <span className="text-slate-600">Driver: </span>
//                       {d.driverName}
//                     </div>
//                   ) : null}
//                   {d.driverPhone ? (
//                     <div>
//                       <span className="text-slate-600">Driver phone: </span>
//                       {d.driverPhone}
//                     </div>
//                   ) : null}
//                   {!d.vehicleLabel && !d.driverName && !d.driverPhone ? (
//                     <p className="text-xs text-slate-400">Not assigned yet</p>
//                   ) : null}
//                 </div>

//                 {/* Return pickup vehicle — right side */}
//                 <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
//                   <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                     Return pickup vehicle
//                   </p>
//                   {d.returnPickupVehicleLabel ? (
//                     <div>
//                       <span className="text-slate-600">Vehicle: </span>
//                       {d.returnPickupVehicleLabel}
//                       {d.returnPickupVehicleType ? (
//                         <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
//                           {d.returnPickupVehicleType === 'PORTER' ? 'Porter' : d.returnPickupVehicleType === 'OWN' ? 'Own' : 'Private'}
//                         </span>
//                       ) : null}
//                     </div>
//                   ) : null}
//                   {d.returnPickupDriverName ? (
//                     <div>
//                       <span className="text-slate-600">Driver: </span>
//                       {d.returnPickupDriverName}
//                     </div>
//                   ) : null}
//                   {d.returnPickupDriverPhone ? (
//                     <div>
//                       <span className="text-slate-600">Driver phone: </span>
//                       {d.returnPickupDriverPhone}
//                     </div>
//                   ) : null}
//                   {!d.returnPickupVehicleLabel && !d.returnPickupDriverName && !d.returnPickupDriverPhone ? (
//                     <p className="text-xs text-slate-400">Not assigned yet</p>
//                   ) : null}
//                 </div>
//               </div>
//             ) : null}
//             {d.contactPhone ? (
//               <div>
//                 <span className="text-slate-600">Contact: </span>
//                 {d.contactPhone}
//               </div>
//             ) : null}
//             {linesByGodown.length > 0 ? (
//               <div>
//                 <span className="text-slate-600">Source godowns: </span>
//                 <span className="text-slate-900">
//                   {linesByGodown.map((g, i) => (
//                     <span key={g.godownId}>
//                       {i > 0 ? ', ' : null}
//                       <Link to={`/godowns/${g.godownId}`} className="font-semibold text-primary-700 hover:text-primary-900">
//                         {g.godownName}
//                       </Link>
//                     </span>
//                   ))}
//                 </span>
//               </div>
//             ) : null}
//             <DeliveryHandoverCard
//               deliveryVerifiedAt={d.deliveryVerifiedAt}
//               deliveryVerifierName={d.deliveryVerifierName}
//               vehicleLabel={d.vehicleLabel}
//               deliverySignature={d.deliverySignature}
//               lines={d.lines}
//             />
//             <BillerReturnCard
//               status={d.status}
//               billerReturnSubmittedAt={d.billerReturnSubmittedAt}
//               lines={d.lines}
//               billerMissingLines={d.billerMissingLines}
//               billerDamagedLines={d.billerDamagedLines}
//               billerCollectedLines={d.billerCollectedLines}
//               damageTotal={d.damageTotal}
//               missingTotal={d.missingTotal}
//               billerPendingReturnLines={d.billerPendingReturnLines}
//               billerPendingReturnAt={d.billerPendingReturnAt}
//               billerPendingReturnSlot={d.billerPendingReturnSlot}
//               billerPendingReturnNote={d.billerPendingReturnNote}
//             />
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-col gap-2">
//             <CardTitle>Magic links</CardTitle>
//             {canRegen ? (
//               <Button
//                 size="sm"
//                 variant="secondary"
//                 onClick={() => {
//                   const token = getToken()
//                   if (!token || !id) return
//                   apiFetch<{ deliveryVerifyUrl: string; billerReturnUrl: string }>(`/deliveries/${id}/regenerate-tokens`, {
//                     token,
//                     method: 'POST',
//                   })
//                     .then(() => load())
//                     .catch((e: unknown) =>
//                       setError(
//                         e && typeof e === 'object' && 'message' in e
//                           ? String((e as { message: string }).message)
//                           : 'Regenerate failed',
//                       ),
//                     )
//                 }}
//               >
//                 Regenerate links
//               </Button>
//             ) : null}
//           </CardHeader>
//           <CardContent className="space-y-3 text-xs">
//             <div>
//               <div className="font-semibold text-slate-800">Delivery verify</div>
//               <div className="break-all text-slate-600">{d.deliveryVerifyUrl || '?'}</div>
//               {d.deliveryVerifyUrl ? (
//                 <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.deliveryVerifyUrl || '')}>
//                   Copy
//                 </Button>
//               ) : null}
//             </div>
//             <div>
//               <div className="font-semibold text-slate-800">Biller return</div>
//               <div className="break-all text-slate-600">{d.billerReturnUrl || '?'}</div>
//               {d.billerReturnUrl ? (
//                 <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.billerReturnUrl || '')}>
//                   Copy
//                 </Button>
//               ) : null}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <Card className="mt-4">
//         <CardHeader>
//           <CardTitle>Products by godown</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           {d.lines.length === 0 ? (
//             <p className="text-sm text-slate-600">No products on this delivery.</p>
//           ) : (
//             linesByGodown.map((group) => {
//               const units = group.lines.reduce((sum, l) => sum + l.qty, 0)
//               return (
//                 <div key={group.godownId} className="overflow-hidden rounded-xl border border-slate-200">
//                   <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
//                     <div>
//                       <Link
//                         to={`/godowns/${group.godownId}`}
//                         className="font-semibold text-primary-800 hover:text-primary-950"
//                       >
//                         {group.godownName}
//                       </Link>
//                       <div className="text-xs text-slate-500">
//                         {group.lines.length} product{group.lines.length === 1 ? '' : 's'} · {units} unit{units === 1 ? '' : 's'}
//                       </div>
//                     </div>
//                   </div>
//                   <Table>
//                     <thead>
//                       <tr>
//                         <Th>Product</Th>
//                         <Th>SKU</Th>
//                         <Th className="text-right">Ordered</Th>
//                         <Th className="text-right">{fulfillmentColumnLabel(d.status)}</Th>
//                         <Th className="text-right">Returned</Th>
//                         <Th className="text-right">In stock</Th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {group.lines.map((l) => {
//                         const stock = d.stockByGodown?.[group.godownId]?.[l.productId]
//                         return (
//                           <tr key={`${group.godownId}-${l.productId}`} className="hover:bg-slate-50">
//                             <Td className="font-semibold text-slate-900">{l.particulars || l.productId}</Td>
//                             <Td className="font-mono text-xs text-slate-600">{l.sku || '—'}</Td>
//                             <Td className="text-right font-semibold text-slate-900">
//                               {l.qty}
//                               {l.unit ? <span className="ml-1 font-normal text-slate-500">{l.unit}</span> : null}
//                             </Td>
//                             <Td className="text-right text-slate-700">
//                               {displayFulfillmentQty(d.status, l, {
//                                 deliveryVerifiedAt: d.deliveryVerifiedAt,
//                                 deliveryLineChecks: d.deliveryLineChecks,
//                                 qtyProgress: d.qtyProgress,
//                                 deliveredTagIds: d.deliveredTagIds,
//                               })}
//                             </Td>
//                             <Td className="text-right text-slate-700">
//                               {showDispatchedQty(d.status) ? (l.returnedQty ?? 0) : '—'}
//                             </Td>
//                             <Td className="text-right font-semibold text-primary-700">
//                               {stock !== undefined ? stock : '—'}
//                             </Td>
//                           </tr>
//                         )
//                       })}
//                     </tbody>
//                   </Table>
//                 </div>
//               )
//             })
//           )}
//         </CardContent>
//       </Card>

//       <CreateDeliveryModal
//         open={editOpen}
//         deliveryId={d.id}
//         onClose={() => setEditOpen(false)}
//         onCreated={load}
//         onUpdated={load}
//       />
//     </div>
//   )
// }

// // import { useEffect, useMemo, useState } from 'react'
// // import { Link, useNavigate, useParams } from 'react-router-dom'
// // import { formatDateTime } from '../../lib/format'
// // import { Button } from '../../components/ui/Button'
// // import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// // import { PageHeader } from '../../components/ui/PageHeader'
// // import { Table, Td, Th } from '../../components/ui/Table'
// // import { apiFetch } from '../../lib/api'
// // import { getToken, useAuth } from '../../auth/store'
// // import { DeliveryStatusSelect } from '../../components/delivery/DeliveryStatusSelect'
// // import { DeleteDeliveryButton } from '../../components/delivery/DeleteDeliveryButton'
// // import { GodownDeliveryWorkflow } from '../../components/delivery/GodownDeliveryWorkflow'
// // import { ReturnPickupVehicleModal } from '../../components/delivery/ReturnPickupVehicleModal'
// // import { ReturnReconciliationCard } from '../../components/delivery/ReturnReconciliationCard'
// // import {
// //   displayFulfillmentQty,
// //   fulfillmentColumnLabel,
// //   getDeliveryEditState,
// //   showDispatchedQty,
// // } from '../../lib/deliveryStatus'
// // import { DriverDeliveryDetail } from '../../components/delivery/DriverDeliveryDetail'
// // import { BillerReturnCard } from '../../components/delivery/BillerReturnCard'
// // import { DeliveryHandoverCard } from '../../components/delivery/DeliveryHandoverCard'
// // import { CreateDeliveryModal } from './CreateDeliveryModal'
// // import { ChallanPdfIcon, openDeliveryChallanPdf, openReturnChallanPdf } from '../../lib/openChallanPdf'
// // import { groupLinesByGodown } from '../../lib/deliveryLineGroups'

// // const RETURN_CHALLAN_STATUSES = ['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN', 'COMPLETED']

// // type DeliveryLine = {
// //   productId: string
// //   godownId?: string
// //   godownName?: string
// //   qty: number
// //   dispatchedQty?: number
// //   returnedQty?: number
// //   particulars?: string
// //   sku?: string
// //   rate?: string
// //   parsedRate?: number
// //   unit?: string
// // }

// // type BillerReturnLine = {
// //   productId: string
// //   qty: number
// //   particulars?: string
// //   sku?: string
// //   note?: string
// // }

// // type DeliveryDetail = {
// //   id: string
// //   deliveryNo: string
// //   customerName: string
// //   siteName?: string
// //   siteAddress?: string
// //   contactPhone?: string
// //   billerUserId?: string
// //   fromGodownId: string
// //   deliveryAt: string
// //   returnExpectedAt?: string
// // vehicleLabel?: string
// //   driverName?: string
// //   driverPhone?: string
// //   returnPickupVehicleLabel?: string
// //   returnPickupDriverName?: string
// //   returnPickupDriverPhone?: string
// //   status: string
// //   lines: DeliveryLine[]
// //   scanProgress?: {
// //     dispatchComplete?: boolean
// //     returnPickupComplete?: boolean
// //   }
// //   qtyProgress?: {
// //     dispatchComplete?: boolean
// //     dispatchedByProduct?: Record<string, number>
// //     deliveredByProduct?: Record<string, number>
// //     returnedByProduct?: Record<string, number>
// //   }
// //   deliveryLineChecks?: Array<{ productId: string; qtyAck?: number; ok?: boolean }>
// //   stockByGodown?: Record<string, Record<string, number>>
// //   deliveryVerifierName?: string
// //   deliveryVerifiedAt?: string
// //   deliverySignature?: string
// //   billerReturnSubmittedAt?: string
// //   billerMissingLines?: BillerReturnLine[]
// //   billerDamagedLines?: BillerReturnLine[]
// //   damageTotal?: number
// //   missingTotal?: number
// //   deliveryVerifyUrl?: string
// //   billerReturnUrl?: string
// //   dispatchedTagIds?: string[]
// //   pickedUpTagIds?: string[]
// //   deliveredTagIds?: string[]
// //   returnPickedUpTagIds?: string[]
// //   returnedTagIds?: string[]
// //   damagedTagIds?: string[]
// //   lostTagIds?: string[]
// // }

// // export function DeliveryDetailPage() {
// //   const { id } = useParams()
// //   const auth = useAuth()
// //   if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY') {
// //     return <DriverDeliveryDetail deliveryId={id} />
// //   }
// //   return <AdminDeliveryDetailPage />
// // }

// // function AdminDeliveryDetailPage() {
// //   const { id } = useParams()
// //   const nav = useNavigate()
// //   const auth = useAuth()
// //   const [d, setD] = useState<DeliveryDetail | null>(null)
// //   const [error, setError] = useState<string | null>(null)
// //   const [returnPickupModalOpen, setReturnPickupModalOpen] = useState(false)
// //   const [actionBusy, setActionBusy] = useState(false)
// //   const [editOpen, setEditOpen] = useState(false)
// //   const [challanError, setChallanError] = useState<string | null>(null)

// //   const load = () => {
// //     const token = getToken()
// //     if (!token || !id) return
// //     setError(null)
// //     apiFetch<DeliveryDetail>(`/deliveries/${id}`, { token })
// //       .then(setD)
// //       .catch((e: unknown) =>
// //         setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load'),
// //       )
// //   }

// //   useEffect(() => {
// //     load()
// //   }, [id])

// //   const role = auth.status === 'authenticated' ? auth.user.role : ''
// //   const canRegen = role === 'ADMIN'
// //   const isGodownUser = role === 'GODOWN'
// //   const isAdmin = role === 'ADMIN'
// //   const showDeleteDelivery =
// //     auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')

// //   const editState =
// //     d && auth.status === 'authenticated'
// //       ? getDeliveryEditState(auth.user.role, auth.user.id, {
// //           status: d.status,
// //           billerUserId: d.billerUserId,
// //           dispatchedTagIds: d.dispatchedTagIds,
// //           pickedUpTagIds: d.pickedUpTagIds,
// //           deliveredTagIds: d.deliveredTagIds,
// //           returnPickedUpTagIds: d.returnPickedUpTagIds,
// //           returnedTagIds: d.returnedTagIds,
// //           damagedTagIds: d.damagedTagIds,
// //           lostTagIds: d.lostTagIds,
// //         })
// //       : { canEdit: false, fullLines: false, metadataOnly: false }

// //   const copy = (text: string) => {
// //     navigator.clipboard.writeText(text).catch(() => {})
// //   }

// //   const assignReturnPickup = async (vehicleNumber: string) => {
// //     const token = getToken()
// //     if (!token || !id) return
// //     setActionBusy(true)
// //     try {
// //       await apiFetch(`/deliveries/${id}/assign-return-pickup`, {
// //         token,
// //         method: 'POST',
// //         body: JSON.stringify({ vehicleNumber }),
// //       })
// //       setReturnPickupModalOpen(false)
// //       load()
// //     } catch (e: unknown) {
// //       setError(
// //         e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Assign return pickup failed',
// //       )
// //     } finally {
// //       setActionBusy(false)
// //     }
// //   }

// //   const showReturnPhase = ['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN'].includes(d?.status ?? '')
// //   const showReturnChallan = RETURN_CHALLAN_STATUSES.includes(d?.status ?? '')

// //   const openDeliveryChallan = async () => {
// //     const token = getToken()
// //     if (!token || !id) return
// //     setChallanError(null)
// //     try {
// //       await openDeliveryChallanPdf(id, token)
// //     } catch (e: unknown) {
// //       setChallanError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to open delivery challan')
// //     }
// //   }

// //   const openReturnChallan = async () => {
// //     const token = getToken()
// //     if (!token || !id) return
// //     setChallanError(null)
// //     try {
// //       await openReturnChallanPdf(id, token)
// //     } catch (e: unknown) {
// //       setChallanError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to open return challan')
// //     }
// //   }
// //   const canAssignReturnPickup =
// //     d?.status === 'DELIVERED' && (isAdmin || isGodownUser)

// //   const linesByGodown = useMemo(() => {
// //     if (!d) return []
// //     return groupLinesByGodown(d.lines, d.fromGodownId)
// //   }, [d])

// //   if (!id) return null

// //   if (error && !d) {
// //     return (
// //       <div>
// //         <PageHeader title="Delivery" subtitle="Error" right={<Link to="/deliveries" className="text-sm font-semibold">Back</Link>} />
// //         <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
// //       </div>
// //     )
// //   }

// //   if (!d) {
// //     return (
// //       <div>
// //         <PageHeader title="Delivery" subtitle="Loading?" />
// //       </div>
// //     )
// //   }

// //   return (
// //     <div>
// //       <PageHeader
// //         title={d.deliveryNo}
// //         subtitle={`${d.customerName} · ${d.siteName || d.siteAddress || ''}`}
// //         right={
// //           <div className="flex flex-wrap items-center gap-2">
// //             <Button variant="secondary" size="sm" onClick={openDeliveryChallan} className="inline-flex items-center gap-1.5">
// //               <ChallanPdfIcon className="h-3.5 w-3.5" />
// //               Delivery Challan
// //             </Button>
// //             {showReturnChallan ? (
// //               <Button variant="secondary" size="sm" onClick={openReturnChallan} className="inline-flex items-center gap-1.5">
// //                 <ChallanPdfIcon className="h-3.5 w-3.5" />
// //                 Return Challan
// //               </Button>
// //             ) : null}
// //             {editState.canEdit ? (
// //               <Button
// //                 variant="secondary"
// //                 size="sm"
// //                 onClick={() => setEditOpen(true)}
// //                 title={editState.reason || (editState.metadataOnly ? 'Edit delivery (limited)' : 'Edit delivery')}
// //               >
// //                 Edit
// //               </Button>
// //             ) : null}
// //             {showDeleteDelivery ? (
// //               <DeleteDeliveryButton
// //                 deliveryId={d.id}
// //                 deliveryNo={d.deliveryNo}
// //                 customerName={d.customerName}
// //                 status={d.status}
// //                 billerUserId={d.billerUserId}
// //                 dispatchedTagIds={d.dispatchedTagIds}
// //                 pickedUpTagIds={d.pickedUpTagIds}
// //                 deliveredTagIds={d.deliveredTagIds}
// //                 returnPickedUpTagIds={d.returnPickedUpTagIds}
// //                 returnedTagIds={d.returnedTagIds}
// //                 damagedTagIds={d.damagedTagIds}
// //                 lostTagIds={d.lostTagIds}
// //                 variant="button"
// //                 onDeleted={() => nav('/deliveries')}
// //                 onError={(msg) => setError(msg)}
// //               />
// //             ) : null}
// //             <Link to="/deliveries" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
// //               Back to list
// //             </Link>
// //           </div>
// //         }
// //       />

// //       {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
// //       {challanError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{challanError}</div> : null}

// //       <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm">
// //         <div>
// //           <span className="font-medium text-emerald-800">Area: </span>
// //           <span className="text-slate-700">{d.siteName || '—'}</span>
// //           {d.siteAddress ? <span className="text-slate-500"> · {d.siteAddress}</span> : null}
// //         </div>
// //         <div>
// //           <span className="font-medium text-emerald-800">Godown: </span>
// //           <span className="text-slate-700">
// //             {linesByGodown.map((g) => g.godownName).join(', ') || '?'}
// //           </span>
// //         </div>
// //         <div>
// //           <span className="font-medium text-emerald-800">Products: </span>
// //           <span className="text-slate-700">{d.lines.length} items</span>
// //         </div>
// //         {/* {d.vehicleLabel ? (
// //           <div>
// //             <span className="font-medium text-emerald-800">Vehicle: </span>
// //             <span className="text-slate-700">{d.vehicleLabel}</span>
// //           </div>
// //         ) : null} */}
// //         {d.vehicleLabel ? (
// //           <div>
// //             <span className="font-medium text-emerald-800">Vehicle: </span>
// //             <span className="text-slate-700">{d.vehicleLabel}</span>
// //           </div>
// //         ) : null}
// //         {d.driverName ? (
// //           <div>
// //             <span className="font-medium text-emerald-800">Driver: </span>
// //             <span className="text-slate-700">{d.driverName}</span>
// //           </div>
// //         ) : null}
// //         {d.driverPhone ? (
// //           <div>
// //             <span className="font-medium text-emerald-800">Driver phone: </span>
// //             <span className="text-slate-700">{d.driverPhone}</span>
// //           </div>
// //         ) : null}
// //       </div>

// //       <ReturnPickupVehicleModal
// //         open={returnPickupModalOpen}
// //         busy={actionBusy}
// //         initialValue={d?.returnPickupVehicleLabel}
// //         onClose={() => setReturnPickupModalOpen(false)}
// //         onConfirm={assignReturnPickup}
// //       />

// //       {showReturnPhase ? (
// //         <ReturnReconciliationCard
// //           status={d.status}
// //           billerReturnUrl={d.billerReturnUrl}
// //           billerReturnSubmittedAt={d.billerReturnSubmittedAt}
// //           damageTotal={d.damageTotal}
// //           missingTotal={d.missingTotal}
// //           onCopyLink={copy}
// //         />
// //       ) : null}

// //       {canAssignReturnPickup && isAdmin && !isGodownUser ? (
// //         <div className="mb-4">
// //           <Button onClick={() => setReturnPickupModalOpen(true)} disabled={actionBusy}>
// //             Assign return pickup
// //           </Button>
// //         </div>
// //       ) : null}

// //       {isGodownUser && d ? (
// //         <GodownDeliveryWorkflow
// //           delivery={{
// //             ...d,
// //             billerReturnUrl: d.billerReturnUrl,
// //             billerReturnSubmittedAt: d.billerReturnSubmittedAt,
// //           }}
// //           onUpdated={load}
// //           onError={(msg) => setError(msg)}
// //         />
// //       ) : null}

// //       <div className="grid gap-4 lg:grid-cols-3">
// //         <Card className="lg:col-span-2">
// //           <CardHeader>
// //             <CardTitle>Overview</CardTitle>
// //           </CardHeader>
// //           <CardContent className="space-y-2 text-sm">
// //             <div className="flex flex-wrap items-center gap-2">
// //               <span className="text-slate-600">Status</span>
// //               <DeliveryStatusSelect
// //                 deliveryId={d.id}
// //                 status={d.status}
// //                 vehicleLabel={d.vehicleLabel}
// //                 driverName={d.driverName}
// //                 driverPhone={d.driverPhone}
// //                 returnPickupVehicleLabel={d.returnPickupVehicleLabel}
// //                 returnPickupDriverName={d.returnPickupDriverName}
// //                 returnPickupDriverPhone={d.returnPickupDriverPhone}
// //                 onUpdated={() => load()}
// //                 onError={(msg) => setError(msg)}
// //               />
// //             </div>
// //             <div>
// //               <span className="text-slate-600">Scheduled: </span>
// //               {formatDateTime(d.deliveryAt)}
// //             </div>
// //             {d.returnExpectedAt ? (
// //               <div>
// //                 <span className="text-slate-600">Return expected: </span>
// //                 {formatDateTime(d.returnExpectedAt)}
// //               </div>
// //             ) : null}
// //             {d.vehicleLabel ? (
// //               <div>
// //                 <span className="text-slate-600">Vehicle: </span>
// //                 {d.vehicleLabel}
// //               </div>
// //             ) : null}
// //             {d.driverName ? (
// //               <div>
// //                 <span className="text-slate-600">Driver: </span>
// //                 {d.driverName}
// //               </div>
// //             ) : null}
// //             {d.driverPhone ? (
// //               <div>
// //                 <span className="text-slate-600">Driver phone: </span>
// //                 {d.driverPhone}
// //               </div>
// //             ) : null}
// //             {d.returnPickupVehicleLabel ? (
// //               <div>
// //                 <span className="text-slate-600">Return pickup vehicle: </span>
// //                 {d.returnPickupVehicleLabel}
// //               </div>
// //             ) : null}
// //             {d.returnPickupDriverName ? (
// //               <div>
// //                 <span className="text-slate-600">Return pickup driver: </span>
// //                 {d.returnPickupDriverName}
// //               </div>
// //             ) : null}
// //             {d.returnPickupDriverPhone ? (
// //               <div>
// //                 <span className="text-slate-600">Return pickup driver phone: </span>
// //                 {d.returnPickupDriverPhone}
// //               </div>
// //             ) : null}
// //             {d.contactPhone ? (
// //               <div>
// //                 <span className="text-slate-600">Contact: </span>
// //                 {d.contactPhone}
// //               </div>
// //             ) : null}
// //             {linesByGodown.length > 0 ? (
// //               <div>
// //                 <span className="text-slate-600">Source godowns: </span>
// //                 <span className="text-slate-900">
// //                   {linesByGodown.map((g, i) => (
// //                     <span key={g.godownId}>
// //                       {i > 0 ? ', ' : null}
// //                       <Link to={`/godowns/${g.godownId}`} className="font-semibold text-primary-700 hover:text-primary-900">
// //                         {g.godownName}
// //                       </Link>
// //                     </span>
// //                   ))}
// //                 </span>
// //               </div>
// //             ) : null}
// //             <DeliveryHandoverCard
// //               deliveryVerifiedAt={d.deliveryVerifiedAt}
// //               deliveryVerifierName={d.deliveryVerifierName}
// //               vehicleLabel={d.vehicleLabel}
// //               deliverySignature={d.deliverySignature}
// //               lines={d.lines}
// //             />
// //             <BillerReturnCard
// //               status={d.status}
// //               billerReturnSubmittedAt={d.billerReturnSubmittedAt}
// //               billerMissingLines={d.billerMissingLines}
// //               billerDamagedLines={d.billerDamagedLines}
// //               damageTotal={d.damageTotal}
// //               missingTotal={d.missingTotal}
// //             />
// //           </CardContent>
// //         </Card>

// //         <Card>
// //           <CardHeader className="flex flex-col gap-2">
// //             <CardTitle>Magic links</CardTitle>
// //             {canRegen ? (
// //               <Button
// //                 size="sm"
// //                 variant="secondary"
// //                 onClick={() => {
// //                   const token = getToken()
// //                   if (!token || !id) return
// //                   apiFetch<{ deliveryVerifyUrl: string; billerReturnUrl: string }>(`/deliveries/${id}/regenerate-tokens`, {
// //                     token,
// //                     method: 'POST',
// //                   })
// //                     .then(() => load())
// //                     .catch((e: unknown) =>
// //                       setError(
// //                         e && typeof e === 'object' && 'message' in e
// //                           ? String((e as { message: string }).message)
// //                           : 'Regenerate failed',
// //                       ),
// //                     )
// //                 }}
// //               >
// //                 Regenerate links
// //               </Button>
// //             ) : null}
// //           </CardHeader>
// //           <CardContent className="space-y-3 text-xs">
// //             <div>
// //               <div className="font-semibold text-slate-800">Delivery verify</div>
// //               <div className="break-all text-slate-600">{d.deliveryVerifyUrl || '?'}</div>
// //               {d.deliveryVerifyUrl ? (
// //                 <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.deliveryVerifyUrl || '')}>
// //                   Copy
// //                 </Button>
// //               ) : null}
// //             </div>
// //             <div>
// //               <div className="font-semibold text-slate-800">Biller return</div>
// //               <div className="break-all text-slate-600">{d.billerReturnUrl || '?'}</div>
// //               {d.billerReturnUrl ? (
// //                 <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.billerReturnUrl || '')}>
// //                   Copy
// //                 </Button>
// //               ) : null}
// //             </div>
// //           </CardContent>
// //         </Card>
// //       </div>

// //       <Card className="mt-4">
// //         <CardHeader>
// //           <CardTitle>Products by godown</CardTitle>
// //         </CardHeader>
// //         <CardContent className="space-y-6">
// //           {d.lines.length === 0 ? (
// //             <p className="text-sm text-slate-600">No products on this delivery.</p>
// //           ) : (
// //             linesByGodown.map((group) => {
// //               const units = group.lines.reduce((sum, l) => sum + l.qty, 0)
// //               return (
// //                 <div key={group.godownId} className="overflow-hidden rounded-xl border border-slate-200">
// //                   <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
// //                     <div>
// //                       <Link
// //                         to={`/godowns/${group.godownId}`}
// //                         className="font-semibold text-primary-800 hover:text-primary-950"
// //                       >
// //                         {group.godownName}
// //                       </Link>
// //                       <div className="text-xs text-slate-500">
// //                         {group.lines.length} product{group.lines.length === 1 ? '' : 's'} · {units} unit{units === 1 ? '' : 's'}
// //                       </div>
// //                     </div>
// //                   </div>
// //                   <Table>
// //                     <thead>
// //                       <tr>
// //                         <Th>Product</Th>
// //                         <Th>SKU</Th>
// //                         <Th className="text-right">Ordered</Th>
// //                         <Th className="text-right">{fulfillmentColumnLabel(d.status)}</Th>
// //                         <Th className="text-right">Returned</Th>
// //                         <Th className="text-right">In stock</Th>
// //                       </tr>
// //                     </thead>
// //                     <tbody>
// //                       {group.lines.map((l) => {
// //                         const stock = d.stockByGodown?.[group.godownId]?.[l.productId]
// //                         return (
// //                           <tr key={`${group.godownId}-${l.productId}`} className="hover:bg-slate-50">
// //                             <Td className="font-semibold text-slate-900">{l.particulars || l.productId}</Td>
// //                             <Td className="font-mono text-xs text-slate-600">{l.sku || '—'}</Td>
// //                             <Td className="text-right font-semibold text-slate-900">
// //                               {l.qty}
// //                               {l.unit ? <span className="ml-1 font-normal text-slate-500">{l.unit}</span> : null}
// //                             </Td>
// //                             <Td className="text-right text-slate-700">
// //                               {displayFulfillmentQty(d.status, l, {
// //                                 deliveryVerifiedAt: d.deliveryVerifiedAt,
// //                                 deliveryLineChecks: d.deliveryLineChecks,
// //                                 qtyProgress: d.qtyProgress,
// //                                 deliveredTagIds: d.deliveredTagIds,
// //                               })}
// //                             </Td>
// //                             <Td className="text-right text-slate-700">
// //                               {showDispatchedQty(d.status) ? (l.returnedQty ?? 0) : '—'}
// //                             </Td>
// //                             <Td className="text-right font-semibold text-primary-700">
// //                               {stock !== undefined ? stock : '—'}
// //                             </Td>
// //                           </tr>
// //                         )
// //                       })}
// //                     </tbody>
// //                   </Table>
// //                 </div>
// //               )
// //             })
// //           )}
// //         </CardContent>
// //       </Card>

// //       <CreateDeliveryModal
// //         open={editOpen}
// //         deliveryId={d.id}
// //         onClose={() => setEditOpen(false)}
// //         onCreated={load}
// //         onUpdated={load}
// //       />
// //     </div>
// //   )
// // }


// import { useEffect, useMemo, useState } from 'react'
// import { Link, useNavigate, useParams } from 'react-router-dom'
// import { formatDateTime } from '../../lib/format'
// import { Button } from '../../components/ui/Button'
// import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// import { PageHeader } from '../../components/ui/PageHeader'
// import { Table, Td, Th } from '../../components/ui/Table'
// import { apiFetch } from '../../lib/api'
// import { getToken, useAuth } from '../../auth/store'
// import { DeliveryStatusSelect } from '../../components/delivery/DeliveryStatusSelect'
// import { DeleteDeliveryButton } from '../../components/delivery/DeleteDeliveryButton'
// import { GodownDeliveryWorkflow } from '../../components/delivery/GodownDeliveryWorkflow'
// import { ReturnPickupVehicleModal } from '../../components/delivery/ReturnPickupVehicleModal'
// import { ReturnReconciliationCard } from '../../components/delivery/ReturnReconciliationCard'
// import {
//   displayFulfillmentQty,
//   fulfillmentColumnLabel,
//   getDeliveryEditState,
//   showDispatchedQty,
// } from '../../lib/deliveryStatus'
// import { DriverDeliveryDetail } from '../../components/delivery/DriverDeliveryDetail'
// import { BillerReturnCard } from '../../components/delivery/BillerReturnCard'
// import { DeliveryHandoverCard } from '../../components/delivery/DeliveryHandoverCard'
// import { CreateDeliveryModal } from './CreateDeliveryModal'
// import { ChallanPdfIcon, openDeliveryChallanPdf, openReturnChallanPdf } from '../../lib/openChallanPdf'
// import { groupLinesByGodown } from '../../lib/deliveryLineGroups'

// const RETURN_CHALLAN_STATUSES = ['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN', 'COMPLETED']

// type DeliveryLine = {
//   productId: string
//   godownId?: string
//   godownName?: string
//   qty: number
//   dispatchedQty?: number
//   returnedQty?: number
//   particulars?: string
//   sku?: string
//   rate?: string
//   parsedRate?: number
//   unit?: string
// }

// type BillerReturnLine = {
//   productId: string
//   qty: number
//   particulars?: string
//   sku?: string
//   note?: string
// }

// type DeliveryDetail = {
//   id: string
//   deliveryNo: string
//   customerName: string
//   siteName?: string
//   siteAddress?: string
//   contactPhone?: string
//   billerUserId?: string
//   fromGodownId: string
//   deliveryAt: string
//   returnExpectedAt?: string
// vehicleLabel?: string
//   driverName?: string
//   driverPhone?: string
//   vehicleType?: 'PRIVATE' | 'PORTER'
//   returnPickupVehicleLabel?: string
//   returnPickupDriverName?: string
//   returnPickupDriverPhone?: string
//   returnPickupVehicleType?: 'PRIVATE' | 'PORTER'
//   status: string
//   lines: DeliveryLine[]
//   scanProgress?: {
//     dispatchComplete?: boolean
//     returnPickupComplete?: boolean
//   }
//   qtyProgress?: {
//     dispatchComplete?: boolean
//     dispatchedByProduct?: Record<string, number>
//     deliveredByProduct?: Record<string, number>
//     returnedByProduct?: Record<string, number>
//   }
//   deliveryLineChecks?: Array<{ productId: string; qtyAck?: number; ok?: boolean }>
//   stockByGodown?: Record<string, Record<string, number>>
//   deliveryVerifierName?: string
//   deliveryVerifiedAt?: string
//   deliverySignature?: string
//   billerReturnSubmittedAt?: string
//   billerMissingLines?: BillerReturnLine[]
//   billerDamagedLines?: BillerReturnLine[]
//   damageTotal?: number
//   missingTotal?: number
//   deliveryVerifyUrl?: string
//   billerReturnUrl?: string
//   dispatchedTagIds?: string[]
//   pickedUpTagIds?: string[]
//   deliveredTagIds?: string[]
//   returnPickedUpTagIds?: string[]
//   returnedTagIds?: string[]
//   damagedTagIds?: string[]
//   lostTagIds?: string[]
// }

// export function DeliveryDetailPage() {
//   const { id } = useParams()
//   const auth = useAuth()
//   if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY') {
//     return <DriverDeliveryDetail deliveryId={id} />
//   }
//   return <AdminDeliveryDetailPage />
// }

// function AdminDeliveryDetailPage() {
//   const { id } = useParams()
//   const nav = useNavigate()
//   const auth = useAuth()
//   const [d, setD] = useState<DeliveryDetail | null>(null)
//   const [error, setError] = useState<string | null>(null)
//   const [returnPickupModalOpen, setReturnPickupModalOpen] = useState(false)
//   const [actionBusy, setActionBusy] = useState(false)
//   const [editOpen, setEditOpen] = useState(false)
//   const [challanError, setChallanError] = useState<string | null>(null)

//   const load = () => {
//     const token = getToken()
//     if (!token || !id) return
//     setError(null)
//     apiFetch<DeliveryDetail>(`/deliveries/${id}`, { token })
//       .then(setD)
//       .catch((e: unknown) =>
//         setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load'),
//       )
//   }

//   useEffect(() => {
//     load()
//   }, [id])

//   const role = auth.status === 'authenticated' ? auth.user.role : ''
//   const canRegen = role === 'ADMIN'
//   const isGodownUser = role === 'GODOWN'
//   const isAdmin = role === 'ADMIN'
//   const showDeleteDelivery =
//     auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')

//   const editState =
//     d && auth.status === 'authenticated'
//       ? getDeliveryEditState(auth.user.role, auth.user.id, {
//           status: d.status,
//           billerUserId: d.billerUserId,
//           dispatchedTagIds: d.dispatchedTagIds,
//           pickedUpTagIds: d.pickedUpTagIds,
//           deliveredTagIds: d.deliveredTagIds,
//           returnPickedUpTagIds: d.returnPickedUpTagIds,
//           returnedTagIds: d.returnedTagIds,
//           damagedTagIds: d.damagedTagIds,
//           lostTagIds: d.lostTagIds,
//         })
//       : { canEdit: false, fullLines: false, metadataOnly: false }

//   const copy = (text: string) => {
//     navigator.clipboard.writeText(text).catch(() => {})
//   }

//   const assignReturnPickup = async (vehicleNumber: string, driverName: string, driverPhone: string, vehicleType: 'PRIVATE' | 'PORTER') => {
//     const token = getToken()
//     if (!token || !id) return
//     setActionBusy(true)
//     try {
//       await apiFetch(`/deliveries/${id}/assign-return-pickup`, {
//         token,
//         method: 'POST',
//         body: JSON.stringify({ vehicleNumber, driverName, driverPhone, vehicleType }),
//       })
//       setReturnPickupModalOpen(false)
//       load()
//     } catch (e: unknown) {
//       setError(
//         e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Assign return pickup failed',
//       )
//     } finally {
//       setActionBusy(false)
//     }
//   }

//   const showReturnPhase = ['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN'].includes(d?.status ?? '')
//   const showReturnChallan = RETURN_CHALLAN_STATUSES.includes(d?.status ?? '')

//   const openDeliveryChallan = async () => {
//     const token = getToken()
//     if (!token || !id) return
//     setChallanError(null)
//     try {
//       await openDeliveryChallanPdf(id, token)
//     } catch (e: unknown) {
//       setChallanError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to open delivery challan')
//     }
//   }

//   const openReturnChallan = async () => {
//     const token = getToken()
//     if (!token || !id) return
//     setChallanError(null)
//     try {
//       await openReturnChallanPdf(id, token)
//     } catch (e: unknown) {
//       setChallanError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to open return challan')
//     }
//   }
//   const canAssignReturnPickup =
//     d?.status === 'DELIVERED' && (isAdmin || isGodownUser)

//   const linesByGodown = useMemo(() => {
//     if (!d) return []
//     return groupLinesByGodown(d.lines, d.fromGodownId)
//   }, [d])

//   if (!id) return null

//   if (error && !d) {
//     return (
//       <div>
//         <PageHeader title="Delivery" subtitle="Error" right={<Link to="/deliveries" className="text-sm font-semibold">Back</Link>} />
//         <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
//       </div>
//     )
//   }

//   if (!d) {
//     return (
//       <div>
//         <PageHeader title="Delivery" subtitle="Loading?" />
//       </div>
//     )
//   }

//   return (
//     <div>
//       <PageHeader
//         title={d.deliveryNo}
//         subtitle={`${d.customerName} · ${d.siteName || d.siteAddress || ''}`}
//         right={
//           <div className="flex flex-wrap items-center gap-2">
//             <Button variant="secondary" size="sm" onClick={openDeliveryChallan} className="inline-flex items-center gap-1.5">
//               <ChallanPdfIcon className="h-3.5 w-3.5" />
//               Delivery Challan
//             </Button>
//             {showReturnChallan ? (
//               <Button variant="secondary" size="sm" onClick={openReturnChallan} className="inline-flex items-center gap-1.5">
//                 <ChallanPdfIcon className="h-3.5 w-3.5" />
//                 Return Challan
//               </Button>
//             ) : null}
//             {editState.canEdit ? (
//               <Button
//                 variant="secondary"
//                 size="sm"
//                 onClick={() => setEditOpen(true)}
//                 title={editState.reason || (editState.metadataOnly ? 'Edit delivery (limited)' : 'Edit delivery')}
//               >
//                 Edit
//               </Button>
//             ) : null}
//             {showDeleteDelivery ? (
//               <DeleteDeliveryButton
//                 deliveryId={d.id}
//                 deliveryNo={d.deliveryNo}
//                 customerName={d.customerName}
//                 status={d.status}
//                 billerUserId={d.billerUserId}
//                 dispatchedTagIds={d.dispatchedTagIds}
//                 pickedUpTagIds={d.pickedUpTagIds}
//                 deliveredTagIds={d.deliveredTagIds}
//                 returnPickedUpTagIds={d.returnPickedUpTagIds}
//                 returnedTagIds={d.returnedTagIds}
//                 damagedTagIds={d.damagedTagIds}
//                 lostTagIds={d.lostTagIds}
//                 variant="button"
//                 onDeleted={() => nav('/deliveries')}
//                 onError={(msg) => setError(msg)}
//               />
//             ) : null}
//             <Link to="/deliveries" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
//               Back to list
//             </Link>
//           </div>
//         }
//       />

//       {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
//       {challanError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{challanError}</div> : null}

//       <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm">
//         <div>
//           <span className="font-medium text-emerald-800">Area: </span>
//           <span className="text-slate-700">{d.siteName || '—'}</span>
//           {d.siteAddress ? <span className="text-slate-500"> · {d.siteAddress}</span> : null}
//         </div>
//         <div>
//           <span className="font-medium text-emerald-800">Godown: </span>
//           <span className="text-slate-700">
//             {linesByGodown.map((g) => g.godownName).join(', ') || '?'}
//           </span>
//         </div>
//         <div>
//           <span className="font-medium text-emerald-800">Products: </span>
//           <span className="text-slate-700">{d.lines.length} items</span>
//         </div>
//         {/* {d.vehicleLabel ? (
//           <div>
//             <span className="font-medium text-emerald-800">Vehicle: </span>
//             <span className="text-slate-700">{d.vehicleLabel}</span>
//           </div>
//         ) : null} */}
//         {d.vehicleLabel ? (
//           <div>
//             <span className="font-medium text-emerald-800">Vehicle: </span>
//             <span className="text-slate-700">{d.vehicleLabel}</span>
//             {d.vehicleType ? (
//               <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
//                 {d.vehicleType === 'PORTER' ? 'Porter' : 'Private'}
//               </span>
//             ) : null}
//           </div>
//         ) : null}
//         {d.driverName ? (
//           <div>
//             <span className="font-medium text-emerald-800">Driver: </span>
//             <span className="text-slate-700">{d.driverName}</span>
//           </div>
//         ) : null}
//         {d.driverPhone ? (
//           <div>
//             <span className="font-medium text-emerald-800">Driver phone: </span>
//             <span className="text-slate-700">{d.driverPhone}</span>
//           </div>
//         ) : null}
//       </div>

//       <ReturnPickupVehicleModal
//         open={returnPickupModalOpen}
//         busy={actionBusy}
//         initialValue={d?.returnPickupVehicleLabel}
//         initialDriverName={d?.returnPickupDriverName}
//         initialDriverPhone={d?.returnPickupDriverPhone}
//         initialVehicleType={d?.returnPickupVehicleType}
//         onClose={() => setReturnPickupModalOpen(false)}
//         onConfirm={assignReturnPickup}
//       />

//       {showReturnPhase ? (
//         <ReturnReconciliationCard
//           status={d.status}
//           billerReturnUrl={d.billerReturnUrl}
//           billerReturnSubmittedAt={d.billerReturnSubmittedAt}
//           damageTotal={d.damageTotal}
//           missingTotal={d.missingTotal}
//           onCopyLink={copy}
//         />
//       ) : null}

//       {canAssignReturnPickup && isAdmin && !isGodownUser ? (
//         <div className="mb-4">
//           <Button onClick={() => setReturnPickupModalOpen(true)} disabled={actionBusy}>
//             Assign return pickup
//           </Button>
//         </div>
//       ) : null}

//       {isGodownUser && d ? (
//         <GodownDeliveryWorkflow
//           delivery={{
//             ...d,
//             billerReturnUrl: d.billerReturnUrl,
//             billerReturnSubmittedAt: d.billerReturnSubmittedAt,
//           }}
//           onUpdated={load}
//           onError={(msg) => setError(msg)}
//         />
//       ) : null}

//       <div className="grid gap-4 lg:grid-cols-3">
//         <Card className="lg:col-span-2">
//           <CardHeader>
//             <CardTitle>Overview</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-2 text-sm">
//             <div className="flex flex-wrap items-center gap-2">
//               <span className="text-slate-600">Status</span>
//               <DeliveryStatusSelect
//                 deliveryId={d.id}
//                 status={d.status}
//                 vehicleLabel={d.vehicleLabel}
//                 driverName={d.driverName}
//                 driverPhone={d.driverPhone}
//                 vehicleType={d.vehicleType}
//                 returnPickupVehicleLabel={d.returnPickupVehicleLabel}
//                 returnPickupDriverName={d.returnPickupDriverName}
//                 returnPickupDriverPhone={d.returnPickupDriverPhone}
//                 returnPickupVehicleType={d.returnPickupVehicleType}
//                 onUpdated={() => load()}
//                 onError={(msg) => setError(msg)}
//               />
//             </div>
//             <div>
//               <span className="text-slate-600">Scheduled: </span>
//               {formatDateTime(d.deliveryAt)}
//             </div>
//             {d.returnExpectedAt ? (
//               <div>
//                 <span className="text-slate-600">Return expected: </span>
//                 {formatDateTime(d.returnExpectedAt)}
//               </div>
//             ) : null}
//             {d.vehicleLabel ? (
//               <div>
//                 <span className="text-slate-600">Vehicle: </span>
//                 {d.vehicleLabel}
//                 {d.vehicleType ? (
//                   <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
//                     {d.vehicleType === 'PORTER' ? 'Porter' : 'Private'}
//                   </span>
//                 ) : null}
//               </div>
//             ) : null}
//             {d.driverName ? (
//               <div>
//                 <span className="text-slate-600">Driver: </span>
//                 {d.driverName}
//               </div>
//             ) : null}
//             {d.driverPhone ? (
//               <div>
//                 <span className="text-slate-600">Driver phone: </span>
//                 {d.driverPhone}
//               </div>
//             ) : null}
//             {d.returnPickupVehicleLabel ? (
//               <div>
//                 <span className="text-slate-600">Return pickup vehicle: </span>
//                 {d.returnPickupVehicleLabel}
//                 {d.returnPickupVehicleType ? (
//                   <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
//                     {d.returnPickupVehicleType === 'PORTER' ? 'Porter' : 'Private'}
//                   </span>
//                 ) : null}
//               </div>
//             ) : null}
//             {d.returnPickupDriverName ? (
//               <div>
//                 <span className="text-slate-600">Return pickup driver: </span>
//                 {d.returnPickupDriverName}
//               </div>
//             ) : null}
//             {d.returnPickupDriverPhone ? (
//               <div>
//                 <span className="text-slate-600">Return pickup driver phone: </span>
//                 {d.returnPickupDriverPhone}
//               </div>
//             ) : null}
//             {d.contactPhone ? (
//               <div>
//                 <span className="text-slate-600">Contact: </span>
//                 {d.contactPhone}
//               </div>
//             ) : null}
//             {linesByGodown.length > 0 ? (
//               <div>
//                 <span className="text-slate-600">Source godowns: </span>
//                 <span className="text-slate-900">
//                   {linesByGodown.map((g, i) => (
//                     <span key={g.godownId}>
//                       {i > 0 ? ', ' : null}
//                       <Link to={`/godowns/${g.godownId}`} className="font-semibold text-primary-700 hover:text-primary-900">
//                         {g.godownName}
//                       </Link>
//                     </span>
//                   ))}
//                 </span>
//               </div>
//             ) : null}
//             <DeliveryHandoverCard
//               deliveryVerifiedAt={d.deliveryVerifiedAt}
//               deliveryVerifierName={d.deliveryVerifierName}
//               vehicleLabel={d.vehicleLabel}
//               deliverySignature={d.deliverySignature}
//               lines={d.lines}
//             />
//             <BillerReturnCard
//               status={d.status}
//               billerReturnSubmittedAt={d.billerReturnSubmittedAt}
//               billerMissingLines={d.billerMissingLines}
//               billerDamagedLines={d.billerDamagedLines}
//               damageTotal={d.damageTotal}
//               missingTotal={d.missingTotal}
//             />
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-col gap-2">
//             <CardTitle>Magic links</CardTitle>
//             {canRegen ? (
//               <Button
//                 size="sm"
//                 variant="secondary"
//                 onClick={() => {
//                   const token = getToken()
//                   if (!token || !id) return
//                   apiFetch<{ deliveryVerifyUrl: string; billerReturnUrl: string }>(`/deliveries/${id}/regenerate-tokens`, {
//                     token,
//                     method: 'POST',
//                   })
//                     .then(() => load())
//                     .catch((e: unknown) =>
//                       setError(
//                         e && typeof e === 'object' && 'message' in e
//                           ? String((e as { message: string }).message)
//                           : 'Regenerate failed',
//                       ),
//                     )
//                 }}
//               >
//                 Regenerate links
//               </Button>
//             ) : null}
//           </CardHeader>
//           <CardContent className="space-y-3 text-xs">
//             <div>
//               <div className="font-semibold text-slate-800">Delivery verify</div>
//               <div className="break-all text-slate-600">{d.deliveryVerifyUrl || '?'}</div>
//               {d.deliveryVerifyUrl ? (
//                 <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.deliveryVerifyUrl || '')}>
//                   Copy
//                 </Button>
//               ) : null}
//             </div>
//             <div>
//               <div className="font-semibold text-slate-800">Biller return</div>
//               <div className="break-all text-slate-600">{d.billerReturnUrl || '?'}</div>
//               {d.billerReturnUrl ? (
//                 <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.billerReturnUrl || '')}>
//                   Copy
//                 </Button>
//               ) : null}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <Card className="mt-4">
//         <CardHeader>
//           <CardTitle>Products by godown</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           {d.lines.length === 0 ? (
//             <p className="text-sm text-slate-600">No products on this delivery.</p>
//           ) : (
//             linesByGodown.map((group) => {
//               const units = group.lines.reduce((sum, l) => sum + l.qty, 0)
//               return (
//                 <div key={group.godownId} className="overflow-hidden rounded-xl border border-slate-200">
//                   <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
//                     <div>
//                       <Link
//                         to={`/godowns/${group.godownId}`}
//                         className="font-semibold text-primary-800 hover:text-primary-950"
//                       >
//                         {group.godownName}
//                       </Link>
//                       <div className="text-xs text-slate-500">
//                         {group.lines.length} product{group.lines.length === 1 ? '' : 's'} · {units} unit{units === 1 ? '' : 's'}
//                       </div>
//                     </div>
//                   </div>
//                   <Table>
//                     <thead>
//                       <tr>
//                         <Th>Product</Th>
//                         <Th>SKU</Th>
//                         <Th className="text-right">Ordered</Th>
//                         <Th className="text-right">{fulfillmentColumnLabel(d.status)}</Th>
//                         <Th className="text-right">Returned</Th>
//                         <Th className="text-right">In stock</Th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {group.lines.map((l) => {
//                         const stock = d.stockByGodown?.[group.godownId]?.[l.productId]
//                         return (
//                           <tr key={`${group.godownId}-${l.productId}`} className="hover:bg-slate-50">
//                             <Td className="font-semibold text-slate-900">{l.particulars || l.productId}</Td>
//                             <Td className="font-mono text-xs text-slate-600">{l.sku || '—'}</Td>
//                             <Td className="text-right font-semibold text-slate-900">
//                               {l.qty}
//                               {l.unit ? <span className="ml-1 font-normal text-slate-500">{l.unit}</span> : null}
//                             </Td>
//                             <Td className="text-right text-slate-700">
//                               {displayFulfillmentQty(d.status, l, {
//                                 deliveryVerifiedAt: d.deliveryVerifiedAt,
//                                 deliveryLineChecks: d.deliveryLineChecks,
//                                 qtyProgress: d.qtyProgress,
//                                 deliveredTagIds: d.deliveredTagIds,
//                               })}
//                             </Td>
//                             <Td className="text-right text-slate-700">
//                               {showDispatchedQty(d.status) ? (l.returnedQty ?? 0) : '—'}
//                             </Td>
//                             <Td className="text-right font-semibold text-primary-700">
//                               {stock !== undefined ? stock : '—'}
//                             </Td>
//                           </tr>
//                         )
//                       })}
//                     </tbody>
//                   </Table>
//                 </div>
//               )
//             })
//           )}
//         </CardContent>
//       </Card>

//       <CreateDeliveryModal
//         open={editOpen}
//         deliveryId={d.id}
//         onClose={() => setEditOpen(false)}
//         onCreated={load}
//         onUpdated={load}
//       />
//     </div>
//   )
// }

// import { useEffect, useMemo, useState } from 'react'
// import { Link, useNavigate, useParams } from 'react-router-dom'
// import { formatDateTime } from '../../lib/format'
// import { Button } from '../../components/ui/Button'
// import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// import { PageHeader } from '../../components/ui/PageHeader'
// import { Table, Td, Th } from '../../components/ui/Table'
// import { apiFetch } from '../../lib/api'
// import { getToken, useAuth } from '../../auth/store'
// import { DeliveryStatusSelect } from '../../components/delivery/DeliveryStatusSelect'
// import { DeleteDeliveryButton } from '../../components/delivery/DeleteDeliveryButton'
// import { GodownDeliveryWorkflow } from '../../components/delivery/GodownDeliveryWorkflow'
// import { ReturnPickupVehicleModal } from '../../components/delivery/ReturnPickupVehicleModal'
// import { ReturnReconciliationCard } from '../../components/delivery/ReturnReconciliationCard'
// import {
//   displayFulfillmentQty,
//   fulfillmentColumnLabel,
//   getDeliveryEditState,
//   showDispatchedQty,
// } from '../../lib/deliveryStatus'
// import { DriverDeliveryDetail } from '../../components/delivery/DriverDeliveryDetail'
// import { BillerReturnCard } from '../../components/delivery/BillerReturnCard'
// import { DeliveryHandoverCard } from '../../components/delivery/DeliveryHandoverCard'
// import { CreateDeliveryModal } from './CreateDeliveryModal'
// import { ChallanPdfIcon, openDeliveryChallanPdf, openReturnChallanPdf } from '../../lib/openChallanPdf'
// import { groupLinesByGodown } from '../../lib/deliveryLineGroups'

// const RETURN_CHALLAN_STATUSES = ['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN', 'COMPLETED']

// type DeliveryLine = {
//   productId: string
//   godownId?: string
//   godownName?: string
//   qty: number
//   dispatchedQty?: number
//   returnedQty?: number
//   particulars?: string
//   sku?: string
//   rate?: string
//   parsedRate?: number
//   unit?: string
// }

// type BillerReturnLine = {
//   productId: string
//   qty: number
//   particulars?: string
//   sku?: string
//   note?: string
// }

// type DeliveryDetail = {
//   id: string
//   deliveryNo: string
//   customerName: string
//   siteName?: string
//   siteAddress?: string
//   contactPhone?: string
//   billerUserId?: string
//   fromGodownId: string
//   deliveryAt: string
//   returnExpectedAt?: string
// vehicleLabel?: string
//   driverName?: string
//   driverPhone?: string
//   returnPickupVehicleLabel?: string
//   returnPickupDriverName?: string
//   returnPickupDriverPhone?: string
//   status: string
//   lines: DeliveryLine[]
//   scanProgress?: {
//     dispatchComplete?: boolean
//     returnPickupComplete?: boolean
//   }
//   qtyProgress?: {
//     dispatchComplete?: boolean
//     dispatchedByProduct?: Record<string, number>
//     deliveredByProduct?: Record<string, number>
//     returnedByProduct?: Record<string, number>
//   }
//   deliveryLineChecks?: Array<{ productId: string; qtyAck?: number; ok?: boolean }>
//   stockByGodown?: Record<string, Record<string, number>>
//   deliveryVerifierName?: string
//   deliveryVerifiedAt?: string
//   deliverySignature?: string
//   billerReturnSubmittedAt?: string
//   billerMissingLines?: BillerReturnLine[]
//   billerDamagedLines?: BillerReturnLine[]
//   damageTotal?: number
//   missingTotal?: number
//   deliveryVerifyUrl?: string
//   billerReturnUrl?: string
//   dispatchedTagIds?: string[]
//   pickedUpTagIds?: string[]
//   deliveredTagIds?: string[]
//   returnPickedUpTagIds?: string[]
//   returnedTagIds?: string[]
//   damagedTagIds?: string[]
//   lostTagIds?: string[]
// }

// export function DeliveryDetailPage() {
//   const { id } = useParams()
//   const auth = useAuth()
//   if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY') {
//     return <DriverDeliveryDetail deliveryId={id} />
//   }
//   return <AdminDeliveryDetailPage />
// }

// function AdminDeliveryDetailPage() {
//   const { id } = useParams()
//   const nav = useNavigate()
//   const auth = useAuth()
//   const [d, setD] = useState<DeliveryDetail | null>(null)
//   const [error, setError] = useState<string | null>(null)
//   const [returnPickupModalOpen, setReturnPickupModalOpen] = useState(false)
//   const [actionBusy, setActionBusy] = useState(false)
//   const [editOpen, setEditOpen] = useState(false)
//   const [challanError, setChallanError] = useState<string | null>(null)

//   const load = () => {
//     const token = getToken()
//     if (!token || !id) return
//     setError(null)
//     apiFetch<DeliveryDetail>(`/deliveries/${id}`, { token })
//       .then(setD)
//       .catch((e: unknown) =>
//         setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load'),
//       )
//   }

//   useEffect(() => {
//     load()
//   }, [id])

//   const role = auth.status === 'authenticated' ? auth.user.role : ''
//   const canRegen = role === 'ADMIN'
//   const isGodownUser = role === 'GODOWN'
//   const isAdmin = role === 'ADMIN'
//   const showDeleteDelivery =
//     auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')

//   const editState =
//     d && auth.status === 'authenticated'
//       ? getDeliveryEditState(auth.user.role, auth.user.id, {
//           status: d.status,
//           billerUserId: d.billerUserId,
//           dispatchedTagIds: d.dispatchedTagIds,
//           pickedUpTagIds: d.pickedUpTagIds,
//           deliveredTagIds: d.deliveredTagIds,
//           returnPickedUpTagIds: d.returnPickedUpTagIds,
//           returnedTagIds: d.returnedTagIds,
//           damagedTagIds: d.damagedTagIds,
//           lostTagIds: d.lostTagIds,
//         })
//       : { canEdit: false, fullLines: false, metadataOnly: false }

//   const copy = (text: string) => {
//     navigator.clipboard.writeText(text).catch(() => {})
//   }

//   const assignReturnPickup = async (vehicleNumber: string) => {
//     const token = getToken()
//     if (!token || !id) return
//     setActionBusy(true)
//     try {
//       await apiFetch(`/deliveries/${id}/assign-return-pickup`, {
//         token,
//         method: 'POST',
//         body: JSON.stringify({ vehicleNumber }),
//       })
//       setReturnPickupModalOpen(false)
//       load()
//     } catch (e: unknown) {
//       setError(
//         e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Assign return pickup failed',
//       )
//     } finally {
//       setActionBusy(false)
//     }
//   }

//   const showReturnPhase = ['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN'].includes(d?.status ?? '')
//   const showReturnChallan = RETURN_CHALLAN_STATUSES.includes(d?.status ?? '')

//   const openDeliveryChallan = async () => {
//     const token = getToken()
//     if (!token || !id) return
//     setChallanError(null)
//     try {
//       await openDeliveryChallanPdf(id, token)
//     } catch (e: unknown) {
//       setChallanError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to open delivery challan')
//     }
//   }

//   const openReturnChallan = async () => {
//     const token = getToken()
//     if (!token || !id) return
//     setChallanError(null)
//     try {
//       await openReturnChallanPdf(id, token)
//     } catch (e: unknown) {
//       setChallanError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to open return challan')
//     }
//   }
//   const canAssignReturnPickup =
//     d?.status === 'DELIVERED' && (isAdmin || isGodownUser)

//   const linesByGodown = useMemo(() => {
//     if (!d) return []
//     return groupLinesByGodown(d.lines, d.fromGodownId)
//   }, [d])

//   if (!id) return null

//   if (error && !d) {
//     return (
//       <div>
//         <PageHeader title="Delivery" subtitle="Error" right={<Link to="/deliveries" className="text-sm font-semibold">Back</Link>} />
//         <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
//       </div>
//     )
//   }

//   if (!d) {
//     return (
//       <div>
//         <PageHeader title="Delivery" subtitle="Loading?" />
//       </div>
//     )
//   }

//   return (
//     <div>
//       <PageHeader
//         title={d.deliveryNo}
//         subtitle={`${d.customerName} · ${d.siteName || d.siteAddress || ''}`}
//         right={
//           <div className="flex flex-wrap items-center gap-2">
//             <Button variant="secondary" size="sm" onClick={openDeliveryChallan} className="inline-flex items-center gap-1.5">
//               <ChallanPdfIcon className="h-3.5 w-3.5" />
//               Delivery Challan
//             </Button>
//             {showReturnChallan ? (
//               <Button variant="secondary" size="sm" onClick={openReturnChallan} className="inline-flex items-center gap-1.5">
//                 <ChallanPdfIcon className="h-3.5 w-3.5" />
//                 Return Challan
//               </Button>
//             ) : null}
//             {editState.canEdit ? (
//               <Button
//                 variant="secondary"
//                 size="sm"
//                 onClick={() => setEditOpen(true)}
//                 title={editState.reason || (editState.metadataOnly ? 'Edit delivery (limited)' : 'Edit delivery')}
//               >
//                 Edit
//               </Button>
//             ) : null}
//             {showDeleteDelivery ? (
//               <DeleteDeliveryButton
//                 deliveryId={d.id}
//                 deliveryNo={d.deliveryNo}
//                 customerName={d.customerName}
//                 status={d.status}
//                 billerUserId={d.billerUserId}
//                 dispatchedTagIds={d.dispatchedTagIds}
//                 pickedUpTagIds={d.pickedUpTagIds}
//                 deliveredTagIds={d.deliveredTagIds}
//                 returnPickedUpTagIds={d.returnPickedUpTagIds}
//                 returnedTagIds={d.returnedTagIds}
//                 damagedTagIds={d.damagedTagIds}
//                 lostTagIds={d.lostTagIds}
//                 variant="button"
//                 onDeleted={() => nav('/deliveries')}
//                 onError={(msg) => setError(msg)}
//               />
//             ) : null}
//             <Link to="/deliveries" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
//               Back to list
//             </Link>
//           </div>
//         }
//       />

//       {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
//       {challanError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{challanError}</div> : null}

//       <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm">
//         <div>
//           <span className="font-medium text-emerald-800">Area: </span>
//           <span className="text-slate-700">{d.siteName || '—'}</span>
//           {d.siteAddress ? <span className="text-slate-500"> · {d.siteAddress}</span> : null}
//         </div>
//         <div>
//           <span className="font-medium text-emerald-800">Godown: </span>
//           <span className="text-slate-700">
//             {linesByGodown.map((g) => g.godownName).join(', ') || '?'}
//           </span>
//         </div>
//         <div>
//           <span className="font-medium text-emerald-800">Products: </span>
//           <span className="text-slate-700">{d.lines.length} items</span>
//         </div>
//         {/* {d.vehicleLabel ? (
//           <div>
//             <span className="font-medium text-emerald-800">Vehicle: </span>
//             <span className="text-slate-700">{d.vehicleLabel}</span>
//           </div>
//         ) : null} */}
//         {d.vehicleLabel ? (
//           <div>
//             <span className="font-medium text-emerald-800">Vehicle: </span>
//             <span className="text-slate-700">{d.vehicleLabel}</span>
//           </div>
//         ) : null}
//         {d.driverName ? (
//           <div>
//             <span className="font-medium text-emerald-800">Driver: </span>
//             <span className="text-slate-700">{d.driverName}</span>
//           </div>
//         ) : null}
//         {d.driverPhone ? (
//           <div>
//             <span className="font-medium text-emerald-800">Driver phone: </span>
//             <span className="text-slate-700">{d.driverPhone}</span>
//           </div>
//         ) : null}
//       </div>

//       <ReturnPickupVehicleModal
//         open={returnPickupModalOpen}
//         busy={actionBusy}
//         initialValue={d?.returnPickupVehicleLabel}
//         onClose={() => setReturnPickupModalOpen(false)}
//         onConfirm={assignReturnPickup}
//       />

//       {showReturnPhase ? (
//         <ReturnReconciliationCard
//           status={d.status}
//           billerReturnUrl={d.billerReturnUrl}
//           billerReturnSubmittedAt={d.billerReturnSubmittedAt}
//           damageTotal={d.damageTotal}
//           missingTotal={d.missingTotal}
//           onCopyLink={copy}
//         />
//       ) : null}

//       {canAssignReturnPickup && isAdmin && !isGodownUser ? (
//         <div className="mb-4">
//           <Button onClick={() => setReturnPickupModalOpen(true)} disabled={actionBusy}>
//             Assign return pickup
//           </Button>
//         </div>
//       ) : null}

//       {isGodownUser && d ? (
//         <GodownDeliveryWorkflow
//           delivery={{
//             ...d,
//             billerReturnUrl: d.billerReturnUrl,
//             billerReturnSubmittedAt: d.billerReturnSubmittedAt,
//           }}
//           onUpdated={load}
//           onError={(msg) => setError(msg)}
//         />
//       ) : null}

//       <div className="grid gap-4 lg:grid-cols-3">
//         <Card className="lg:col-span-2">
//           <CardHeader>
//             <CardTitle>Overview</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-2 text-sm">
//             <div className="flex flex-wrap items-center gap-2">
//               <span className="text-slate-600">Status</span>
//               <DeliveryStatusSelect
//                 deliveryId={d.id}
//                 status={d.status}
//                 vehicleLabel={d.vehicleLabel}
//                 driverName={d.driverName}
//                 driverPhone={d.driverPhone}
//                 returnPickupVehicleLabel={d.returnPickupVehicleLabel}
//                 returnPickupDriverName={d.returnPickupDriverName}
//                 returnPickupDriverPhone={d.returnPickupDriverPhone}
//                 onUpdated={() => load()}
//                 onError={(msg) => setError(msg)}
//               />
//             </div>
//             <div>
//               <span className="text-slate-600">Scheduled: </span>
//               {formatDateTime(d.deliveryAt)}
//             </div>
//             {d.returnExpectedAt ? (
//               <div>
//                 <span className="text-slate-600">Return expected: </span>
//                 {formatDateTime(d.returnExpectedAt)}
//               </div>
//             ) : null}
//             {d.vehicleLabel ? (
//               <div>
//                 <span className="text-slate-600">Vehicle: </span>
//                 {d.vehicleLabel}
//               </div>
//             ) : null}
//             {d.driverName ? (
//               <div>
//                 <span className="text-slate-600">Driver: </span>
//                 {d.driverName}
//               </div>
//             ) : null}
//             {d.driverPhone ? (
//               <div>
//                 <span className="text-slate-600">Driver phone: </span>
//                 {d.driverPhone}
//               </div>
//             ) : null}
//             {d.returnPickupVehicleLabel ? (
//               <div>
//                 <span className="text-slate-600">Return pickup vehicle: </span>
//                 {d.returnPickupVehicleLabel}
//               </div>
//             ) : null}
//             {d.returnPickupDriverName ? (
//               <div>
//                 <span className="text-slate-600">Return pickup driver: </span>
//                 {d.returnPickupDriverName}
//               </div>
//             ) : null}
//             {d.returnPickupDriverPhone ? (
//               <div>
//                 <span className="text-slate-600">Return pickup driver phone: </span>
//                 {d.returnPickupDriverPhone}
//               </div>
//             ) : null}
//             {d.contactPhone ? (
//               <div>
//                 <span className="text-slate-600">Contact: </span>
//                 {d.contactPhone}
//               </div>
//             ) : null}
//             {linesByGodown.length > 0 ? (
//               <div>
//                 <span className="text-slate-600">Source godowns: </span>
//                 <span className="text-slate-900">
//                   {linesByGodown.map((g, i) => (
//                     <span key={g.godownId}>
//                       {i > 0 ? ', ' : null}
//                       <Link to={`/godowns/${g.godownId}`} className="font-semibold text-primary-700 hover:text-primary-900">
//                         {g.godownName}
//                       </Link>
//                     </span>
//                   ))}
//                 </span>
//               </div>
//             ) : null}
//             <DeliveryHandoverCard
//               deliveryVerifiedAt={d.deliveryVerifiedAt}
//               deliveryVerifierName={d.deliveryVerifierName}
//               vehicleLabel={d.vehicleLabel}
//               deliverySignature={d.deliverySignature}
//               lines={d.lines}
//             />
//             <BillerReturnCard
//               status={d.status}
//               billerReturnSubmittedAt={d.billerReturnSubmittedAt}
//               billerMissingLines={d.billerMissingLines}
//               billerDamagedLines={d.billerDamagedLines}
//               damageTotal={d.damageTotal}
//               missingTotal={d.missingTotal}
//             />
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-col gap-2">
//             <CardTitle>Magic links</CardTitle>
//             {canRegen ? (
//               <Button
//                 size="sm"
//                 variant="secondary"
//                 onClick={() => {
//                   const token = getToken()
//                   if (!token || !id) return
//                   apiFetch<{ deliveryVerifyUrl: string; billerReturnUrl: string }>(`/deliveries/${id}/regenerate-tokens`, {
//                     token,
//                     method: 'POST',
//                   })
//                     .then(() => load())
//                     .catch((e: unknown) =>
//                       setError(
//                         e && typeof e === 'object' && 'message' in e
//                           ? String((e as { message: string }).message)
//                           : 'Regenerate failed',
//                       ),
//                     )
//                 }}
//               >
//                 Regenerate links
//               </Button>
//             ) : null}
//           </CardHeader>
//           <CardContent className="space-y-3 text-xs">
//             <div>
//               <div className="font-semibold text-slate-800">Delivery verify</div>
//               <div className="break-all text-slate-600">{d.deliveryVerifyUrl || '?'}</div>
//               {d.deliveryVerifyUrl ? (
//                 <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.deliveryVerifyUrl || '')}>
//                   Copy
//                 </Button>
//               ) : null}
//             </div>
//             <div>
//               <div className="font-semibold text-slate-800">Biller return</div>
//               <div className="break-all text-slate-600">{d.billerReturnUrl || '?'}</div>
//               {d.billerReturnUrl ? (
//                 <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.billerReturnUrl || '')}>
//                   Copy
//                 </Button>
//               ) : null}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <Card className="mt-4">
//         <CardHeader>
//           <CardTitle>Products by godown</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           {d.lines.length === 0 ? (
//             <p className="text-sm text-slate-600">No products on this delivery.</p>
//           ) : (
//             linesByGodown.map((group) => {
//               const units = group.lines.reduce((sum, l) => sum + l.qty, 0)
//               return (
//                 <div key={group.godownId} className="overflow-hidden rounded-xl border border-slate-200">
//                   <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
//                     <div>
//                       <Link
//                         to={`/godowns/${group.godownId}`}
//                         className="font-semibold text-primary-800 hover:text-primary-950"
//                       >
//                         {group.godownName}
//                       </Link>
//                       <div className="text-xs text-slate-500">
//                         {group.lines.length} product{group.lines.length === 1 ? '' : 's'} · {units} unit{units === 1 ? '' : 's'}
//                       </div>
//                     </div>
//                   </div>
//                   <Table>
//                     <thead>
//                       <tr>
//                         <Th>Product</Th>
//                         <Th>SKU</Th>
//                         <Th className="text-right">Ordered</Th>
//                         <Th className="text-right">{fulfillmentColumnLabel(d.status)}</Th>
//                         <Th className="text-right">Returned</Th>
//                         <Th className="text-right">In stock</Th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {group.lines.map((l) => {
//                         const stock = d.stockByGodown?.[group.godownId]?.[l.productId]
//                         return (
//                           <tr key={`${group.godownId}-${l.productId}`} className="hover:bg-slate-50">
//                             <Td className="font-semibold text-slate-900">{l.particulars || l.productId}</Td>
//                             <Td className="font-mono text-xs text-slate-600">{l.sku || '—'}</Td>
//                             <Td className="text-right font-semibold text-slate-900">
//                               {l.qty}
//                               {l.unit ? <span className="ml-1 font-normal text-slate-500">{l.unit}</span> : null}
//                             </Td>
//                             <Td className="text-right text-slate-700">
//                               {displayFulfillmentQty(d.status, l, {
//                                 deliveryVerifiedAt: d.deliveryVerifiedAt,
//                                 deliveryLineChecks: d.deliveryLineChecks,
//                                 qtyProgress: d.qtyProgress,
//                                 deliveredTagIds: d.deliveredTagIds,
//                               })}
//                             </Td>
//                             <Td className="text-right text-slate-700">
//                               {showDispatchedQty(d.status) ? (l.returnedQty ?? 0) : '—'}
//                             </Td>
//                             <Td className="text-right font-semibold text-primary-700">
//                               {stock !== undefined ? stock : '—'}
//                             </Td>
//                           </tr>
//                         )
//                       })}
//                     </tbody>
//                   </Table>
//                 </div>
//               )
//             })
//           )}
//         </CardContent>
//       </Card>

//       <CreateDeliveryModal
//         open={editOpen}
//         deliveryId={d.id}
//         onClose={() => setEditOpen(false)}
//         onCreated={load}
//         onUpdated={load}
//       />
//     </div>
//   )
// }


import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatDateTime } from '../../lib/format'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, Td, Th } from '../../components/ui/Table'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'
import { DeliveryStatusSelect } from '../../components/delivery/DeliveryStatusSelect'
import { DeleteDeliveryButton } from '../../components/delivery/DeleteDeliveryButton'
import { GodownDeliveryWorkflow } from '../../components/delivery/GodownDeliveryWorkflow'
import { ReturnPickupVehicleModal } from '../../components/delivery/ReturnPickupVehicleModal'
import { ReturnReconciliationCard } from '../../components/delivery/ReturnReconciliationCard'
import {
  displayFulfillmentQty,
  fulfillmentColumnLabel,
  getDeliveryEditState,
  showDispatchedQty,
} from '../../lib/deliveryStatus'
import { DriverDeliveryDetail } from '../../components/delivery/DriverDeliveryDetail'
import { BillerReturnCard } from '../../components/delivery/BillerReturnCard'
import { DeliveryHandoverCard } from '../../components/delivery/DeliveryHandoverCard'
import { CreateDeliveryModal } from './CreateDeliveryModal'
import { ChallanPdfIcon, openDeliveryChallanPdf, openReturnChallanPdf } from '../../lib/openChallanPdf'
import { groupLinesByGodown } from '../../lib/deliveryLineGroups'

const RETURN_CHALLAN_STATUSES = ['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN', 'COMPLETED']

type DeliveryLine = {
  productId: string
  godownId?: string
  godownName?: string
  qty: number
  dispatchedQty?: number
  returnedQty?: number
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
  driverName?: string
  driverPhone?: string
  vehicleType?: 'PRIVATE' | 'PORTER' | 'OWN'
  returnPickupVehicleLabel?: string
  returnPickupDriverName?: string
  returnPickupDriverPhone?: string
  returnPickupVehicleType?: 'PRIVATE' | 'PORTER' | 'OWN'
  status: string
  billingType?: 'FREE' | 'INVOICE'
  invoiceNo?: string
  invoiceName?: string
  invoiceAmount?: string
  billedAt?: string
  lines: DeliveryLine[]
  scanProgress?: {
    dispatchComplete?: boolean
    returnPickupComplete?: boolean
  }
  qtyProgress?: {
    dispatchComplete?: boolean
    dispatchedByProduct?: Record<string, number>
    deliveredByProduct?: Record<string, number>
    returnedByProduct?: Record<string, number>
  }
  deliveryLineChecks?: Array<{ productId: string; qtyAck?: number; ok?: boolean }>
  stockByGodown?: Record<string, Record<string, number>>
  deliveryVerifierName?: string
  deliveryVerifiedAt?: string
  deliverySignature?: string
  billerReturnSubmittedAt?: string
  billerReturnName?: string
  billerSignature?: string
  billerMissingLines?: BillerReturnLine[]
  billerDamagedLines?: BillerReturnLine[]
  billerCollectedLines?: BillerReturnLine[]
  damageTotal?: number
  missingTotal?: number
  billerPendingReturnLines?: BillerReturnLine[]
  billerPendingReturnAt?: string
  billerPendingReturnSlot?: 'MORNING' | 'AFTERNOON' | 'EVENING'
  billerPendingReturnNote?: string
  deliveryVerifyUrl?: string
  billerReturnUrl?: string
  dispatchedTagIds?: string[]
  pickedUpTagIds?: string[]
  deliveredTagIds?: string[]
  returnPickedUpTagIds?: string[]
  returnedTagIds?: string[]
  damagedTagIds?: string[]
  lostTagIds?: string[]
}

export function DeliveryDetailPage() {
  const { id } = useParams()
  const auth = useAuth()
  if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY') {
    return <DriverDeliveryDetail deliveryId={id} />
  }
  return <AdminDeliveryDetailPage />
}

function AdminDeliveryDetailPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const auth = useAuth()
  const [d, setD] = useState<DeliveryDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [returnPickupModalOpen, setReturnPickupModalOpen] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [challanError, setChallanError] = useState<string | null>(null)

  const load = () => {
    const token = getToken()
    if (!token || !id) return
    setError(null)
    apiFetch<DeliveryDetail>(`/deliveries/${id}`, { token })
      .then(setD)
      .catch((e: unknown) =>
        setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load'),
      )
  }

  useEffect(() => {
    load()
  }, [id])

  const role = auth.status === 'authenticated' ? auth.user.role : ''
  const canRegen = role === 'ADMIN'
  const isGodownUser = role === 'GODOWN'
  const isAdmin = role === 'ADMIN'
  const showDeleteDelivery =
    auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')

  const editState =
    d && auth.status === 'authenticated'
      ? getDeliveryEditState(auth.user.role, auth.user.id, {
          status: d.status,
          billerUserId: d.billerUserId,
          dispatchedTagIds: d.dispatchedTagIds,
          pickedUpTagIds: d.pickedUpTagIds,
          deliveredTagIds: d.deliveredTagIds,
          returnPickedUpTagIds: d.returnPickedUpTagIds,
          returnedTagIds: d.returnedTagIds,
          damagedTagIds: d.damagedTagIds,
          lostTagIds: d.lostTagIds,
        })
      : { canEdit: false, fullLines: false, metadataOnly: false }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const assignReturnPickup = async (vehicleNumber: string, driverName: string, driverPhone: string, vehicleType: 'PRIVATE' | 'PORTER' | 'OWN') => {
    const token = getToken()
    if (!token || !id) return
    setActionBusy(true)
    try {
      await apiFetch(`/deliveries/${id}/assign-return-pickup`, {
        token,
        method: 'POST',
        body: JSON.stringify({ vehicleNumber, driverName, driverPhone, vehicleType }),
      })
      setReturnPickupModalOpen(false)
      load()
    } catch (e: unknown) {
      setError(
        e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Assign return pickup failed',
      )
    } finally {
      setActionBusy(false)
    }
  }

  const showReturnPhase = ['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN'].includes(d?.status ?? '')
  const showReturnChallan = RETURN_CHALLAN_STATUSES.includes(d?.status ?? '')

  const openDeliveryChallan = async () => {
    const token = getToken()
    if (!token || !id) return
    setChallanError(null)
    try {
      await openDeliveryChallanPdf(id, token)
    } catch (e: unknown) {
      setChallanError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to open delivery challan')
    }
  }

  const openReturnChallan = async () => {
    const token = getToken()
    if (!token || !id) return
    setChallanError(null)
    try {
      await openReturnChallanPdf(id, token)
    } catch (e: unknown) {
      setChallanError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to open return challan')
    }
  }
  const canAssignReturnPickup =
    d?.status === 'DELIVERED' && (isAdmin || isGodownUser)

  const linesByGodown = useMemo(() => {
    if (!d) return []
    return groupLinesByGodown(d.lines, d.fromGodownId)
  }, [d])

  const returnQtyByProduct = useMemo(() => {
    const qtyByProduct = (lines?: BillerReturnLine[]) => {
      const map = new Map<string, number>()
      for (const l of lines || []) {
        const pid = String(l.productId)
        map.set(pid, (map.get(pid) || 0) + (Number(l.qty) || 0))
      }
      return map
    }
    if (!d) {
      return {
        missingByProduct: new Map<string, number>(),
        pendingByProduct: new Map<string, number>(),
        hasReturnActivity: false,
      }
    }
    const missingByProduct = qtyByProduct([
      ...(d.billerDamagedLines || []),
      ...(d.billerMissingLines || []),
    ])
    const pendingByProduct = qtyByProduct(d.billerPendingReturnLines)
    const hasReturnActivity =
      d.lines.some((l) => (l.returnedQty ?? 0) > 0) ||
      missingByProduct.size > 0 ||
      pendingByProduct.size > 0
    return { missingByProduct, pendingByProduct, hasReturnActivity }
  }, [d])

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
        <PageHeader title="Delivery" subtitle="Loading?" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={d.deliveryNo}
        subtitle={`${d.customerName} · ${d.siteName || d.siteAddress || ''}`}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={openDeliveryChallan} className="inline-flex items-center gap-1.5">
              <ChallanPdfIcon className="h-3.5 w-3.5" />
              Delivery Challan
            </Button>
            {showReturnChallan ? (
              <Button variant="secondary" size="sm" onClick={openReturnChallan} className="inline-flex items-center gap-1.5">
                <ChallanPdfIcon className="h-3.5 w-3.5" />
                Return Challan
              </Button>
            ) : null}
            {editState.canEdit ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditOpen(true)}
                title={editState.reason || (editState.metadataOnly ? 'Edit delivery (limited)' : 'Edit delivery')}
              >
                Edit
              </Button>
            ) : null}
            {showDeleteDelivery ? (
              <DeleteDeliveryButton
                deliveryId={d.id}
                deliveryNo={d.deliveryNo}
                customerName={d.customerName}
                status={d.status}
                billerUserId={d.billerUserId}
                dispatchedTagIds={d.dispatchedTagIds}
                pickedUpTagIds={d.pickedUpTagIds}
                deliveredTagIds={d.deliveredTagIds}
                returnPickedUpTagIds={d.returnPickedUpTagIds}
                returnedTagIds={d.returnedTagIds}
                damagedTagIds={d.damagedTagIds}
                lostTagIds={d.lostTagIds}
                variant="button"
                onDeleted={() => nav('/deliveries')}
                onError={(msg) => setError(msg)}
              />
            ) : null}
            <Link to="/deliveries" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
              Back to list
            </Link>
          </div>
        }
      />

      {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {challanError ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{challanError}</div> : null}

      <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm">
        <div>
          <span className="font-medium text-emerald-800">Area: </span>
          <span className="text-slate-700">{d.siteName || '—'}</span>
          {d.siteAddress ? <span className="text-slate-500"> · {d.siteAddress}</span> : null}
        </div>
        <div>
          <span className="font-medium text-emerald-800">Godown: </span>
          <span className="text-slate-700">
            {linesByGodown.map((g) => g.godownName).join(', ') || '?'}
          </span>
        </div>
        <div>
          <span className="font-medium text-emerald-800">Products: </span>
          <span className="text-slate-700">{d.lines.length} items</span>
        </div>
        {/* {d.vehicleLabel ? (
          <div>
            <span className="font-medium text-emerald-800">Vehicle: </span>
            <span className="text-slate-700">{d.vehicleLabel}</span>
          </div>
        ) : null} */}
        {d.vehicleLabel ? (
          <div>
            <span className="font-medium text-emerald-800">Vehicle: </span>
            <span className="text-slate-700">{d.vehicleLabel}</span>
            {d.vehicleType ? (
              <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {d.vehicleType === 'PORTER' ? 'Porter' : d.vehicleType === 'OWN' ? 'Own' : 'Private'}
              </span>
            ) : null}
          </div>
        ) : null}
        {d.driverName ? (
          <div>
            <span className="font-medium text-emerald-800">Driver: </span>
            <span className="text-slate-700">{d.driverName}</span>
          </div>
        ) : null}
        {d.driverPhone ? (
          <div>
            <span className="font-medium text-emerald-800">Driver phone: </span>
            <span className="text-slate-700">{d.driverPhone}</span>
          </div>
        ) : null}
      </div>

      <ReturnPickupVehicleModal
        open={returnPickupModalOpen}
        busy={actionBusy}
        initialValue={d?.returnPickupVehicleLabel}
        initialDriverName={d?.returnPickupDriverName}
        initialDriverPhone={d?.returnPickupDriverPhone}
        initialVehicleType={d?.returnPickupVehicleType}
        onClose={() => setReturnPickupModalOpen(false)}
        onConfirm={assignReturnPickup}
      />

      {showReturnPhase ? (
        <ReturnReconciliationCard
          status={d.status}
          billerReturnUrl={d.billerReturnUrl}
          billerReturnSubmittedAt={d.billerReturnSubmittedAt}
          damageTotal={d.damageTotal}
          missingTotal={d.missingTotal}
          onCopyLink={copy}
        />
      ) : null}

      {canAssignReturnPickup && isAdmin && !isGodownUser ? (
        <div className="mb-4">
          <Button onClick={() => setReturnPickupModalOpen(true)} disabled={actionBusy}>
            Assign return pickup
          </Button>
        </div>
      ) : null}

      {isGodownUser && d ? (
        <GodownDeliveryWorkflow
          delivery={{
            ...d,
            billerReturnUrl: d.billerReturnUrl,
            billerReturnSubmittedAt: d.billerReturnSubmittedAt,
          }}
          onUpdated={load}
          onError={(msg) => setError(msg)}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-600">Status</span>
              <DeliveryStatusSelect
                deliveryId={d.id}
                status={d.status}
                lines={d.lines}
                vehicleLabel={d.vehicleLabel}
                driverName={d.driverName}
                driverPhone={d.driverPhone}
                vehicleType={d.vehicleType}
                returnPickupVehicleLabel={d.returnPickupVehicleLabel}
                returnPickupDriverName={d.returnPickupDriverName}
                returnPickupDriverPhone={d.returnPickupDriverPhone}
                returnPickupVehicleType={d.returnPickupVehicleType}
                billingType={d.billingType}
                invoiceNo={d.invoiceNo}
                invoiceName={d.invoiceName}
                onUpdated={(patch) => {
                  setD((prev) => (prev ? { ...prev, ...patch } : prev))
                  load()
                }}
                onError={(msg) => setError(msg)}
              />
              {d.status === 'BILLED' && d.billingType ? (
                d.billingType === 'FREE' ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                    Billed Free
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                    Invoice {d.invoiceNo}
                    {d.invoiceName ? ` · ${d.invoiceName}` : ''}
                  </span>
                )
              ) : null}
            </div>
            <div>
              <span className="text-slate-600">Scheduled: </span>
              {formatDateTime(d.deliveryAt)}
            </div>
            {d.billedAt ? (
              <div>
                <span className="text-slate-600">Billed on: </span>
                {formatDateTime(d.billedAt)}
              </div>
            ) : null}
            {d.returnExpectedAt ? (
              <div>
                <span className="text-slate-600">Return expected: </span>
                {formatDateTime(d.returnExpectedAt)}
              </div>
            ) : null}
            {(d.vehicleLabel || d.driverName || d.driverPhone || d.returnPickupVehicleLabel || d.returnPickupDriverName || d.returnPickupDriverPhone) ? (
              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {(d.vehicleLabel || d.driverName || d.driverPhone) ? (
                  <div className="space-y-2">
                    {d.vehicleLabel ? (
                      <div>
                        <span className="text-slate-600">Vehicle: </span>
                        {d.vehicleLabel}
                        {d.vehicleType ? (
                          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            {d.vehicleType === 'PORTER' ? 'Porter' : d.vehicleType === 'OWN' ? 'Own' : 'Private'}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {d.driverName ? (
                      <div>
                        <span className="text-slate-600">Driver: </span>
                        {d.driverName}
                      </div>
                    ) : null}
                    {d.driverPhone ? (
                      <div>
                        <span className="text-slate-600">Driver phone: </span>
                        {d.driverPhone}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {(d.returnPickupVehicleLabel || d.returnPickupDriverName || d.returnPickupDriverPhone) ? (
                  <div className="space-y-2">
                    {d.returnPickupVehicleLabel ? (
                      <div>
                        <span className="text-slate-600">Return pickup vehicle: </span>
                        {d.returnPickupVehicleLabel}
                        {d.returnPickupVehicleType ? (
                          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            {d.returnPickupVehicleType === 'PORTER' ? 'Porter' : d.returnPickupVehicleType === 'OWN' ? 'Own' : 'Private'}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {d.returnPickupDriverName ? (
                      <div>
                        <span className="text-slate-600">Return pickup driver: </span>
                        {d.returnPickupDriverName}
                      </div>
                    ) : null}
                    {d.returnPickupDriverPhone ? (
                      <div>
                        <span className="text-slate-600">Return pickup driver phone: </span>
                        {d.returnPickupDriverPhone}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
            {d.contactPhone ? (
              <div>
                <span className="text-slate-600">Contact: </span>
                {d.contactPhone}
              </div>
            ) : null}
            {linesByGodown.length > 0 ? (
              <div>
                <span className="text-slate-600">Source godowns: </span>
                <span className="text-slate-900">
                  {linesByGodown.map((g, i) => (
                    <span key={g.godownId}>
                      {i > 0 ? ', ' : null}
                      <Link to={`/godowns/${g.godownId}`} className="font-semibold text-primary-700 hover:text-primary-900">
                        {g.godownName}
                      </Link>
                    </span>
                  ))}
                </span>
              </div>
            ) : null}
            <DeliveryHandoverCard
              deliveryVerifiedAt={d.deliveryVerifiedAt}
              deliveryVerifierName={d.deliveryVerifierName}
              vehicleLabel={d.vehicleLabel}
              deliverySignature={d.deliverySignature}
              lines={d.lines.map((l) => {
                const check = d.deliveryLineChecks?.find((c) => c.productId === l.productId)
                return {
                  productId: l.productId,
                  particulars: l.particulars,
                  sku: l.sku,
                  qty: l.qty,
                  qtyAck: check?.qtyAck,
                }
              })}
            />
            <BillerReturnCard
              status={d.status}
              billerReturnSubmittedAt={d.billerReturnSubmittedAt}
              billerReturnName={d.billerReturnName}
              billerSignature={d.billerSignature}
              deliveryAt={d.deliveryAt}
              lines={d.lines}
              billerMissingLines={d.billerMissingLines}
              billerDamagedLines={d.billerDamagedLines}
              billerCollectedLines={d.billerCollectedLines}
              damageTotal={d.damageTotal}
              missingTotal={d.missingTotal}
              billerPendingReturnLines={d.billerPendingReturnLines}
            />
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
                    .catch((e: unknown) =>
                      setError(
                        e && typeof e === 'object' && 'message' in e
                          ? String((e as { message: string }).message)
                          : 'Regenerate failed',
                      ),
                    )
                }}
              >
                Regenerate links
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <div className="font-semibold text-slate-800">Delivery verify</div>
              <div className="break-all text-slate-600">{d.deliveryVerifyUrl || '?'}</div>
              {d.deliveryVerifyUrl ? (
                <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.deliveryVerifyUrl || '')}>
                  Copy
                </Button>
              ) : null}
            </div>
            <div>
              <div className="font-semibold text-slate-800">Biller return</div>
              <div className="break-all text-slate-600">{d.billerReturnUrl || '?'}</div>
              {d.billerReturnUrl ? (
                <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.billerReturnUrl || '')}>
                  Copy
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Products by godown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {d.lines.length === 0 ? (
            <p className="text-sm text-slate-600">No products on this delivery.</p>
          ) : (
            linesByGodown.map((group) => {
              const units = group.lines.reduce((sum, l) => sum + l.qty, 0)
              const { missingByProduct, pendingByProduct, hasReturnActivity } = returnQtyByProduct
              return (
                <div key={group.godownId} className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <Link
                        to={`/godowns/${group.godownId}`}
                        className="font-semibold text-primary-800 hover:text-primary-950"
                      >
                        {group.godownName}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {group.lines.length} product{group.lines.length === 1 ? '' : 's'} · {units} unit{units === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Product</Th>
                        <Th>SKU</Th>
                        <Th className="text-right">Ordered</Th>
                        <Th className="text-right">{fulfillmentColumnLabel(d.status)}</Th>
                        <Th className="text-right">{hasReturnActivity ? 'Collected' : 'Biller returned'}</Th>
                        {hasReturnActivity ? (
                          <>
                            <Th className="text-right text-rose-700">Missing</Th>
                            <Th className="text-right text-amber-700">Pending</Th>
                          </>
                        ) : null}
                        <Th className="text-right">In stock</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.lines.map((l) => {
                        const stock = d.stockByGodown?.[group.godownId]?.[l.productId]
                        const missingQty = missingByProduct.get(String(l.productId)) || 0
                        const pendingQty = pendingByProduct.get(String(l.productId)) || 0
                        return (
                          <tr key={`${group.godownId}-${l.productId}`} className="hover:bg-slate-50">
                            <Td className="font-semibold text-slate-900">{l.particulars || l.productId}</Td>
                            <Td className="font-mono text-xs text-slate-600">{l.sku || '—'}</Td>
                            <Td className="text-right font-semibold text-slate-900">
                              {l.qty}
                              {l.unit ? <span className="ml-1 font-normal text-slate-500">{l.unit}</span> : null}
                            </Td>
                            <Td className="text-right text-slate-700">
                              {displayFulfillmentQty(d.status, l, {
                                deliveryVerifiedAt: d.deliveryVerifiedAt,
                                deliveryLineChecks: d.deliveryLineChecks,
                                qtyProgress: d.qtyProgress,
                                deliveredTagIds: d.deliveredTagIds,
                              })}
                            </Td>
                            <Td className="text-right text-slate-700">
                              {showDispatchedQty(d.status) ? (l.returnedQty ?? 0) : '—'}
                            </Td>
                            {hasReturnActivity ? (
                              <>
                                <Td className={`text-right font-semibold ${missingQty > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                  {missingQty}
                                </Td>
                                <Td className={`text-right font-semibold ${pendingQty > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                                  {pendingQty}
                                </Td>
                              </>
                            ) : null}
                            <Td className="text-right font-semibold text-primary-700">
                              {stock !== undefined ? stock : '—'}
                            </Td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <CreateDeliveryModal
        open={editOpen}
        deliveryId={d.id}
        onClose={() => setEditOpen(false)}
        onCreated={load}
        onUpdated={load}
      />
    </div>
  )
}