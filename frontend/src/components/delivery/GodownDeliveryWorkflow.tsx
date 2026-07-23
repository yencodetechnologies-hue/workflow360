// import { useState, type ReactNode } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { Button } from '../ui/Button'
// import { Input } from '../ui/Input'
// import { Modal } from '../ui/Modal'
// import { apiFetch } from '../../lib/api'
// import { postDeliveryVehicle } from '../../lib/deliveryVehicleApi'
// import { getToken, useAuth } from '../../auth/store'
// import { isDispatchComplete, isOutForDeliveryStatus, lineFulfilledQty } from '../../lib/deliveryStatus'
// import { scanPathForDelivery } from '../../lib/scanMode'
// import { ReturnPickupVehicleModal } from './ReturnPickupVehicleModal'
// import { VehicleNumberModal } from './VehicleNumberModal'

// export type GodownWorkflowLine = {
//   productId: string
//   qty: number
//   dispatchedQty?: number
//   returnedQty?: number
//   particulars?: string
//   godownId?: string
// }

// export type GodownWorkflowDelivery = {
//   id: string
//   status: string
//   vehicleLabel?: string
//   driverName?: string
//   driverPhone?: string
//   returnPickupVehicleLabel?: string
//   returnPickupDriverName?: string
//   returnPickupDriverPhone?: string
//   lines?: GodownWorkflowLine[]
//   scanProgress?: { dispatchComplete?: boolean }
//   qtyProgress?: {
//     dispatchComplete?: boolean
//     deliveredByProduct?: Record<string, number>
//     returnedByProduct?: Record<string, number>
//   }
//   deliveryVerifiedAt?: string
//   deliveryLineChecks?: Array<{ productId: string; qtyAck?: number; ok?: boolean }>
//   deliveredTagIds?: string[]
//   billerReturnUrl?: string
//   billerReturnSubmittedAt?: string
// }

// type Props = {
//   delivery: GodownWorkflowDelivery
//   onUpdated?: (patch?: Partial<GodownWorkflowDelivery>) => void
//   onError?: (message: string) => void
//   compact?: boolean
// }

// function notifyStockChanged() {
//   window.dispatchEvent(new CustomEvent('godown-stock-changed'))
// }

// export function GodownDeliveryWorkflow({ delivery, onUpdated, onError, compact }: Props) {
//   const auth = useAuth()
//   const nav = useNavigate()
//   const [busy, setBusy] = useState(false)
//   const [vehicleOpen, setVehicleOpen] = useState(false)
//   const [returnPickupOpen, setReturnPickupOpen] = useState(false)
//   const [returnOpen, setReturnOpen] = useState(false)
//   const [returnQty, setReturnQty] = useState<Record<string, string>>({})

//   const role = auth.status === 'authenticated' ? auth.user.role : ''
//   const godownLinked = auth.status === 'authenticated' && !!auth.user.godownId
//   if (role !== 'GODOWN') return null

//   const lines = delivery.lines || []
//   const dispatchComplete = isDispatchComplete(delivery)

//   const controlsDisabled = busy || !godownLinked

//   const run = async (fn: () => Promise<Partial<GodownWorkflowDelivery> | undefined>) => {
//     if (!godownLinked) return
//     setBusy(true)
//     try {
//       const patch = await fn()
//       notifyStockChanged()
//       onUpdated?.(patch)
//     } catch (e: unknown) {
//       const msg =
//         e && typeof e === 'object' && 'message' in e
//           ? String((e as { message: string }).message)
//           : 'Action failed'
//       onError?.(msg)
//     } finally {
//       setBusy(false)
//     }
//   }

//   const confirmDispatch = () =>
//     run(async () => {
//       const token = getToken()
//       if (!token) return
//       const res = await apiFetch<{
//         status: string
//         lines?: GodownWorkflowLine[]
//         qtyProgress?: { dispatchComplete?: boolean }
//       }>(`/deliveries/${delivery.id}/confirm-dispatch`, {
//         token,
//         method: 'POST',
//         body: JSON.stringify({}),
//       })
//       return { status: res.status, lines: res.lines, qtyProgress: res.qtyProgress }
//     })

//   const outForDelivery = (vehicleNumber: string, driverName: string, driverPhone: string) =>
//     run(async () => {
//       const token = getToken()
//       if (!token) return
//       const res = await postDeliveryVehicle(delivery.id, token, vehicleNumber, delivery.status, undefined, driverName, driverPhone)
//       setVehicleOpen(false)
//       return { status: res.status, vehicleLabel: res.vehicleLabel, driverName: res.driverName, driverPhone: res.driverPhone }
//     })

//   const assignReturnPickup = (vehicleNumber: string, driverName: string, driverPhone: string) =>
//     run(async () => {
//       const token = getToken()
//       if (!token) return
//       const res = await apiFetch<{ status: string; returnPickupVehicleLabel?: string; returnPickupDriverName?: string; returnPickupDriverPhone?: string }>(
//         `/deliveries/${delivery.id}/assign-return-pickup`,
//         {
//           token,
//           method: 'POST',
//           body: JSON.stringify({ vehicleNumber, driverName, driverPhone }),
//         },
//       )
//       setReturnPickupOpen(false)
//       return { status: res.status, returnPickupVehicleLabel: res.returnPickupVehicleLabel, returnPickupDriverName: res.returnPickupDriverName, returnPickupDriverPhone: res.returnPickupDriverPhone }
//     })

//   const markDelivered = () =>
//     run(async () => {
//       const token = getToken()
//       if (!token) return
//       const res = await apiFetch<{ status: string }>(`/deliveries/${delivery.id}/mark-delivered`, {
//         token,
//         method: 'POST',
//       })
//       return { status: res.status }
//     })

//   const fulfillmentContext = {
//     deliveryVerifiedAt: delivery.deliveryVerifiedAt,
//     deliveryLineChecks: delivery.deliveryLineChecks,
//     qtyProgress: delivery.qtyProgress,
//     deliveredTagIds: delivery.deliveredTagIds,
//   }

//   const openReturnModal = () => {
//     const initial: Record<string, string> = {}
//     for (const l of lines) {
//       const fulfilled = lineFulfilledQty(delivery.status, l, fulfillmentContext)
//       const returned = l.returnedQty ?? 0
//       const remaining = Math.max(0, fulfilled - returned)
//       if (remaining > 0) initial[l.productId] = String(remaining)
//     }
//     setReturnQty(initial)
//     setReturnOpen(true)
//   }

//   const confirmReturn = () =>
//     run(async () => {
//       const token = getToken()
//       if (!token) return
//       const bodyLines = lines
//         .map((l) => {
//           const q = Number(returnQty[l.productId] || 0)
//           if (q <= 0) return null
//           return { productId: l.productId, qty: q }
//         })
//         .filter(Boolean) as Array<{ productId: string; qty: number }>
//       if (!bodyLines.length) {
//         throw new Error('Enter return quantity for at least one product')
//       }
//       const res = await apiFetch<{
//         status: string
//         lines?: GodownWorkflowLine[]
//         qtyProgress?: { returnedByProduct?: Record<string, number> }
//       }>(`/deliveries/${delivery.id}/confirm-return`, {
//         token,
//         method: 'POST',
//         body: JSON.stringify({ lines: bodyLines }),
//       })
//       setReturnOpen(false)
//       return { status: res.status, lines: res.lines, qtyProgress: res.qtyProgress }
//     })

//   const closeReturn = () =>
//     run(async () => {
//       const token = getToken()
//       if (!token) return
//       await apiFetch(`/deliveries/${delivery.id}/close-return`, { token, method: 'POST' })
//       return { status: 'COMPLETED' }
//     })

//   const btnSize = compact ? ('sm' as const) : undefined
//   const status = delivery.status

//   const buttons: ReactNode[] = []

//   if (status === 'PROCESSED' && !dispatchComplete) {
//     buttons.push(
//       <Button key="packed" size={btnSize} variant="secondary" disabled={controlsDisabled} onClick={() => void confirmDispatch()}>
//         Mark packed
//       </Button>,
//     )
//     buttons.push(
//       <Button
//         key="scan"
//         size={btnSize}
//         variant="secondary"
//         disabled={controlsDisabled}
//         onClick={() => nav(scanPathForDelivery(role, status, delivery.id))}
//       >
//         RFID scan
//       </Button>,
//     )
//   }

//   if (status === 'PACKED' || (status === 'PROCESSED' && dispatchComplete)) {
//     buttons.push(
//       <Button key="ofd" size={btnSize} disabled={controlsDisabled} onClick={() => setVehicleOpen(true)}>
//         Out for delivery
//       </Button>,
//     )
//   }

//   if (['PROCESSED', 'PACKED'].includes(status) || isOutForDeliveryStatus(status)) {
//     if (isOutForDeliveryStatus(status)) {
//       buttons.push(
//         <Button key="ofd-edit" size={btnSize} variant="secondary" disabled={controlsDisabled} onClick={() => setVehicleOpen(true)}>
//           Change vehicle
//         </Button>,
//       )
//     }
//     buttons.push(
//       <Button key="delivered" size={btnSize} variant="secondary" disabled={controlsDisabled} onClick={() => void markDelivered()}>
//         Mark delivered
//       </Button>,
//     )
//   }

//   if (status === 'DELIVERED') {
//     buttons.push(
//       <Button key="assign-rp" size={btnSize} disabled={controlsDisabled} onClick={() => setReturnPickupOpen(true)}>
//         Assign return pickup
//       </Button>,
//     )
//   }

//   if (status === 'RETURN_PICKUP' || status === 'PENDING_RETURN') {
//     buttons.push(
//       <Button key="return" size={btnSize} variant="secondary" disabled={controlsDisabled} onClick={openReturnModal}>
//         Record return
//       </Button>,
//     )
//     buttons.push(
//       <Button
//         key="scan-ret"
//         size={btnSize}
//         variant="secondary"
//         disabled={controlsDisabled}
//         onClick={() => nav(`/scan/return/${delivery.id}`)}
//       >
//         RFID return scan
//       </Button>,
//     )
//     if (status === 'RETURN_PICKUP') {
//       buttons.push(
//         <Button
//           key="scan-rp"
//           size={btnSize}
//           variant="secondary"
//           disabled={controlsDisabled}
//           onClick={() => nav(`/scan/return-pickup/${delivery.id}`)}
//         >
//           RFID return pickup scan
//         </Button>,
//       )
//     }
//   }

//   if (status === 'PENDING_RETURN') {
//     buttons.push(
//       <Button key="complete" size={btnSize} disabled={controlsDisabled} onClick={() => void closeReturn()}>
//         Complete return
//       </Button>,
//     )
//   }

//   const showBillerBanner =
//     (status === 'RETURN_PICKUP' || status === 'PENDING_RETURN') && !delivery.billerReturnSubmittedAt

//   if (!buttons.length && !showBillerBanner) return null

//   return (
//     <>
//       <div
//         className={
//           compact ? 'flex flex-col items-end gap-1' : 'mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center'
//         }
//       >
//         {showBillerBanner ? (
//           <p
//             className={
//               compact
//                 ? 'w-full text-[10px] text-amber-700'
//                 : 'w-full rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-100 sm:flex-1'
//             }
//           >
//             Share the biller return link so missing items and notes are recorded before completing return.
//             {delivery.billerReturnUrl ? (
//               <>
//                 {' '}
//                 <button
//                   type="button"
//                   className="font-semibold underline"
//                   onClick={() => navigator.clipboard.writeText(delivery.billerReturnUrl || '').catch(() => {})}
//                 >
//                   Copy link
//                 </button>
//               </>
//             ) : null}
//           </p>
//         ) : null}
//         {status === 'PENDING_RETURN' && (
//           <p className={compact ? 'text-[10px] text-slate-500' : 'w-full text-xs text-slate-500 sm:flex-1'}>
//             Complete return adds any remaining dispatched quantity back to godown stock.
//           </p>
//         )}
//         {buttons.length ? (
//           <div className={compact ? 'flex flex-wrap justify-end gap-1' : 'flex flex-wrap gap-2'}>{buttons}</div>
//         ) : null}
//       </div>

//       <VehicleNumberModal
//         open={vehicleOpen}
//         title={status === 'OUT_FOR_DELIVERY' ? 'Change vehicle' : 'Out for delivery'}
//         description="Enter the vehicle number and driver details for the delivery."
//         confirmLabel="Confirm"
//         busy={controlsDisabled}
//         initialValue={delivery.vehicleLabel}
//         initialDriverName={delivery.driverName}
//         initialDriverPhone={delivery.driverPhone}
//         onClose={() => setVehicleOpen(false)}
//         onConfirm={outForDelivery}
//       />

//       <ReturnPickupVehicleModal
//         open={returnPickupOpen}
//         busy={controlsDisabled}
//         initialValue={delivery.returnPickupVehicleLabel}
//         initialDriverName={delivery.returnPickupDriverName}
//         initialDriverPhone={delivery.returnPickupDriverPhone}
//         onClose={() => setReturnPickupOpen(false)}
//         onConfirm={assignReturnPickup}
//       />

//       <Modal open={returnOpen} title="Record return quantities" onClose={() => setReturnOpen(false)}>
//         <div className="space-y-3">
//           {lines.map((l) => {
//             const fulfilled = lineFulfilledQty(delivery.status, l, fulfillmentContext)
//             const returned = l.returnedQty ?? 0
//             const max = Math.max(0, fulfilled - returned)
//             if (max <= 0) return null
//             return (
//               <div key={l.productId}>
//                 <Input
//                   label={`${l.particulars || l.productId} (max ${max})`}
//                   type="number"
//                   min={0}
//                   max={max}
//                   value={returnQty[l.productId] ?? ''}
//                   onChange={(e) => setReturnQty((prev) => ({ ...prev, [l.productId]: e.target.value }))}
//                 />
//               </div>
//             )
//           })}
//         </div>
//         <div className="mt-4 flex gap-2">
//           <Button onClick={() => void confirmReturn()} disabled={controlsDisabled}>
//             Confirm return
//           </Button>
//           <Button variant="secondary" onClick={() => setReturnOpen(false)}>
//             Cancel
//           </Button>
//         </div>
//       </Modal>
//     </>
//   )
// }

import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { apiFetch } from '../../lib/api'
import { postDeliveryVehicle } from '../../lib/deliveryVehicleApi'
import { getToken, useAuth } from '../../auth/store'
import { isDispatchComplete, isOutForDeliveryStatus, lineFulfilledQty } from '../../lib/deliveryStatus'
import { scanPathForDelivery } from '../../lib/scanMode'
import { ReturnPickupVehicleModal } from './ReturnPickupVehicleModal'
import { VehicleNumberModal } from './VehicleNumberModal'

export type GodownWorkflowLine = {
  productId: string
  qty: number
  dispatchedQty?: number
  returnedQty?: number
  particulars?: string
  godownId?: string
}

export type GodownWorkflowDelivery = {
  id: string
  status: string
  vehicleLabel?: string
  driverName?: string
  driverPhone?: string
  vehicleType?: 'PRIVATE' | 'PORTER' | 'OWN'
  returnPickupVehicleLabel?: string
  returnPickupDriverName?: string
  returnPickupDriverPhone?: string
  returnPickupVehicleType?: 'PRIVATE' | 'PORTER' | 'OWN'
  lines?: GodownWorkflowLine[]
  scanProgress?: { dispatchComplete?: boolean }
  qtyProgress?: {
    dispatchComplete?: boolean
    deliveredByProduct?: Record<string, number>
    returnedByProduct?: Record<string, number>
  }
  deliveryVerifiedAt?: string
  deliveryLineChecks?: Array<{ productId: string; qtyAck?: number; ok?: boolean }>
  deliveredTagIds?: string[]
  billerReturnUrl?: string
  billerReturnSubmittedAt?: string
}

type Props = {
  delivery: GodownWorkflowDelivery
  onUpdated?: (patch?: Partial<GodownWorkflowDelivery>) => void
  onError?: (message: string) => void
  compact?: boolean
}

function notifyStockChanged() {
  window.dispatchEvent(new CustomEvent('godown-stock-changed'))
}

export function GodownDeliveryWorkflow({ delivery, onUpdated, onError, compact }: Props) {
  const auth = useAuth()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const [vehicleOpen, setVehicleOpen] = useState(false)
  const [returnPickupOpen, setReturnPickupOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [returnQty, setReturnQty] = useState<Record<string, string>>({})

  const role = auth.status === 'authenticated' ? auth.user.role : ''
  const godownLinked = auth.status === 'authenticated' && !!auth.user.godownId
  if (role !== 'GODOWN') return null

  const lines = delivery.lines || []
  const dispatchComplete = isDispatchComplete(delivery)

  const controlsDisabled = busy || !godownLinked

  const run = async (fn: () => Promise<Partial<GodownWorkflowDelivery> | undefined>) => {
    if (!godownLinked) return
    setBusy(true)
    try {
      const patch = await fn()
      notifyStockChanged()
      onUpdated?.(patch)
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Action failed'
      onError?.(msg)
    } finally {
      setBusy(false)
    }
  }

  const confirmDispatch = () =>
    run(async () => {
      const token = getToken()
      if (!token) return
      const res = await apiFetch<{
        status: string
        lines?: GodownWorkflowLine[]
        qtyProgress?: { dispatchComplete?: boolean }
      }>(`/deliveries/${delivery.id}/confirm-dispatch`, {
        token,
        method: 'POST',
        body: JSON.stringify({}),
      })
      return { status: res.status, lines: res.lines, qtyProgress: res.qtyProgress }
    })

  const outForDelivery = (vehicleNumber: string, driverName: string, driverPhone: string, vehicleType: 'PRIVATE' | 'PORTER' | 'OWN') =>
    run(async () => {
      const token = getToken()
      if (!token) return
      const res = await postDeliveryVehicle(delivery.id, token, vehicleNumber, delivery.status, undefined, driverName, driverPhone, vehicleType)
      setVehicleOpen(false)
      return { status: res.status, vehicleLabel: res.vehicleLabel, driverName: res.driverName, driverPhone: res.driverPhone, vehicleType: res.vehicleType }
    })

  const assignReturnPickup = (vehicleNumber: string, driverName: string, driverPhone: string, vehicleType: 'PRIVATE' | 'PORTER' | 'OWN') =>
    run(async () => {
      const token = getToken()
      if (!token) return
      const res = await apiFetch<{ status: string; returnPickupVehicleLabel?: string; returnPickupDriverName?: string; returnPickupDriverPhone?: string; returnPickupVehicleType?: 'PRIVATE' | 'PORTER' | 'OWN' }>(
        `/deliveries/${delivery.id}/assign-return-pickup`,
        {
          token,
          method: 'POST',
          body: JSON.stringify({ vehicleNumber, driverName, driverPhone, vehicleType }),
        },
      )
      setReturnPickupOpen(false)
      return { status: res.status, returnPickupVehicleLabel: res.returnPickupVehicleLabel, returnPickupDriverName: res.returnPickupDriverName, returnPickupDriverPhone: res.returnPickupDriverPhone, returnPickupVehicleType: res.returnPickupVehicleType }
    })

  const markDelivered = () =>
    run(async () => {
      const token = getToken()
      if (!token) return
      const res = await apiFetch<{ status: string }>(`/deliveries/${delivery.id}/mark-delivered`, {
        token,
        method: 'POST',
      })
      return { status: res.status }
    })

  const fulfillmentContext = {
    deliveryVerifiedAt: delivery.deliveryVerifiedAt,
    deliveryLineChecks: delivery.deliveryLineChecks,
    qtyProgress: delivery.qtyProgress,
    deliveredTagIds: delivery.deliveredTagIds,
  }

  const openReturnModal = () => {
    const initial: Record<string, string> = {}
    for (const l of lines) {
      const fulfilled = lineFulfilledQty(delivery.status, l, fulfillmentContext)
      const returned = l.returnedQty ?? 0
      const remaining = Math.max(0, fulfilled - returned)
      if (remaining > 0) initial[l.productId] = String(remaining)
    }
    setReturnQty(initial)
    setReturnOpen(true)
  }

  const confirmReturn = () =>
    run(async () => {
      const token = getToken()
      if (!token) return
      const bodyLines = lines
        .map((l) => {
          const q = Number(returnQty[l.productId] || 0)
          if (q <= 0) return null
          return { productId: l.productId, qty: q }
        })
        .filter(Boolean) as Array<{ productId: string; qty: number }>
      if (!bodyLines.length) {
        throw new Error('Enter return quantity for at least one product')
      }
      const res = await apiFetch<{
        status: string
        lines?: GodownWorkflowLine[]
        qtyProgress?: { returnedByProduct?: Record<string, number> }
      }>(`/deliveries/${delivery.id}/confirm-return`, {
        token,
        method: 'POST',
        body: JSON.stringify({ lines: bodyLines }),
      })
      setReturnOpen(false)
      return { status: res.status, lines: res.lines, qtyProgress: res.qtyProgress }
    })

  const closeReturn = () =>
    run(async () => {
      const token = getToken()
      if (!token) return
      await apiFetch(`/deliveries/${delivery.id}/close-return`, { token, method: 'POST' })
      return { status: 'COMPLETED' }
    })

  const btnSize = compact ? ('sm' as const) : undefined
  const status = delivery.status

  const buttons: ReactNode[] = []

  if (status === 'PROCESSED' && !dispatchComplete) {
    buttons.push(
      <Button key="packed" size={btnSize} variant="secondary" disabled={controlsDisabled} onClick={() => void confirmDispatch()}>
        Mark packed
      </Button>,
    )
    buttons.push(
      <Button
        key="scan"
        size={btnSize}
        variant="secondary"
        disabled={controlsDisabled}
        onClick={() => nav(scanPathForDelivery(role, status, delivery.id))}
      >
        RFID scan
      </Button>,
    )
  }

  if (status === 'PACKED' || (status === 'PROCESSED' && dispatchComplete)) {
    buttons.push(
      <Button key="ofd" size={btnSize} disabled={controlsDisabled} onClick={() => setVehicleOpen(true)}>
        Out for delivery
      </Button>,
    )
  }

  if (['PROCESSED', 'PACKED'].includes(status) || isOutForDeliveryStatus(status)) {
    if (isOutForDeliveryStatus(status)) {
      buttons.push(
        <Button key="ofd-edit" size={btnSize} variant="secondary" disabled={controlsDisabled} onClick={() => setVehicleOpen(true)}>
          Change vehicle
        </Button>,
      )
    }
    buttons.push(
      <Button key="delivered" size={btnSize} variant="secondary" disabled={controlsDisabled} onClick={() => void markDelivered()}>
        Mark delivered
      </Button>,
    )
  }

  if (status === 'DELIVERED') {
    buttons.push(
      <Button key="assign-rp" size={btnSize} disabled={controlsDisabled} onClick={() => setReturnPickupOpen(true)}>
        Assign return pickup
      </Button>,
    )
  }

  if (status === 'RETURN_PICKUP' || status === 'PENDING_RETURN') {
    buttons.push(
      <Button key="return" size={btnSize} variant="secondary" disabled={controlsDisabled} onClick={openReturnModal}>
        Record return
      </Button>,
    )
    buttons.push(
      <Button
        key="scan-ret"
        size={btnSize}
        variant="secondary"
        disabled={controlsDisabled}
        onClick={() => nav(`/scan/return/${delivery.id}`)}
      >
        RFID return scan
      </Button>,
    )
    if (status === 'RETURN_PICKUP') {
      buttons.push(
        <Button
          key="scan-rp"
          size={btnSize}
          variant="secondary"
          disabled={controlsDisabled}
          onClick={() => nav(`/scan/return-pickup/${delivery.id}`)}
        >
          RFID return pickup scan
        </Button>,
      )
    }
  }

  if (status === 'PENDING_RETURN') {
    buttons.push(
      <Button key="complete" size={btnSize} disabled={controlsDisabled} onClick={() => void closeReturn()}>
        Complete return
      </Button>,
    )
  }

  const showBillerBanner =
    (status === 'RETURN_PICKUP' || status === 'PENDING_RETURN') && !delivery.billerReturnSubmittedAt

  if (!buttons.length && !showBillerBanner) return null

  return (
    <>
      <div
        className={
          compact ? 'flex flex-col items-end gap-1' : 'mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center'
        }
      >
        {showBillerBanner ? (
          <p
            className={
              compact
                ? 'w-full text-[10px] text-amber-700'
                : 'w-full rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-100 sm:flex-1'
            }
          >
            Share the biller return link so missing items and notes are recorded before completing return.
            {delivery.billerReturnUrl ? (
              <>
                {' '}
                <button
                  type="button"
                  className="font-semibold underline"
                  onClick={() => navigator.clipboard.writeText(delivery.billerReturnUrl || '').catch(() => {})}
                >
                  Copy link
                </button>
              </>
            ) : null}
          </p>
        ) : null}
        {status === 'PENDING_RETURN' && (
          <p className={compact ? 'text-[10px] text-slate-500' : 'w-full text-xs text-slate-500 sm:flex-1'}>
            Complete return adds any remaining dispatched quantity back to godown stock.
          </p>
        )}
        {buttons.length ? (
          <div className={compact ? 'flex flex-wrap justify-end gap-1' : 'flex flex-wrap gap-2'}>{buttons}</div>
        ) : null}
      </div>

      <VehicleNumberModal
        open={vehicleOpen}
        title={status === 'OUT_FOR_DELIVERY' ? 'Change vehicle' : 'Out for delivery'}
        description="Type the driver name — matching drivers fill phone and vehicle automatically. All fields stay editable."
        confirmLabel="Confirm"
        busy={controlsDisabled}
        initialValue={delivery.vehicleLabel}
        initialDriverName={delivery.driverName}
        initialDriverPhone={delivery.driverPhone}
        initialVehicleType={delivery.vehicleType}
        onClose={() => setVehicleOpen(false)}
        onConfirm={outForDelivery}
      />

      <ReturnPickupVehicleModal
        open={returnPickupOpen}
        busy={controlsDisabled}
        initialValue={delivery.returnPickupVehicleLabel}
        initialDriverName={delivery.returnPickupDriverName}
        initialDriverPhone={delivery.returnPickupDriverPhone}
        initialVehicleType={delivery.returnPickupVehicleType}
        onClose={() => setReturnPickupOpen(false)}
        onConfirm={assignReturnPickup}
      />

      <Modal open={returnOpen} title="Record return quantities" onClose={() => setReturnOpen(false)}>
        <div className="space-y-3">
          {lines.map((l) => {
            const fulfilled = lineFulfilledQty(delivery.status, l, fulfillmentContext)
            const returned = l.returnedQty ?? 0
            const max = Math.max(0, fulfilled - returned)
            if (max <= 0) return null
            return (
              <div key={l.productId}>
                <Input
                  label={`${l.particulars || l.productId} (max ${max})`}
                  type="number"
                  min={0}
                  max={max}
                  value={returnQty[l.productId] ?? ''}
                  onChange={(e) => setReturnQty((prev) => ({ ...prev, [l.productId]: e.target.value }))}
                />
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => void confirmReturn()} disabled={controlsDisabled}>
            Confirm return
          </Button>
          <Button variant="secondary" onClick={() => setReturnOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  )
}