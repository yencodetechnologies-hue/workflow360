// import { useEffect, useState } from 'react'
// import { Badge } from '../ui/Badge'
// import { apiFetch } from '../../lib/api'
// import { postDeliveryVehicle } from '../../lib/deliveryVehicleApi'
// import { getToken, useAuth } from '../../auth/store'
// import {
//   DELIVERY_STATUS_OPTIONS,
//   deliveryBadgeVariant,
//   deliveryStatusLabel,
//   type DeliveryStatus,
// } from '../../lib/deliveryStatus'
// import {
//   statusOptionsForSelect,
//   transitionBlockedMessage,
//   transitionKind,
// } from '../../lib/deliveryTransitions'
// import { cn } from '../../lib/cn'
// import { ReturnPickupVehicleModal } from './ReturnPickupVehicleModal'
// import { VehicleNumberModal } from './VehicleNumberModal'

// export type DeliveryStatusPatch = {
//   status: string
//   vehicleLabel?: string
//   returnPickupVehicleLabel?: string
// }

// type Props = {
//   deliveryId: string
//   status: string
//   vehicleLabel?: string
//   returnPickupVehicleLabel?: string
//   onUpdated?: (patch: DeliveryStatusPatch) => void
//   onError?: (message: string) => void
//   className?: string
// }

// export function DeliveryStatusSelect({
//   deliveryId,
//   status,
//   vehicleLabel,
//   returnPickupVehicleLabel,
//   onUpdated,
//   onError,
//   className,
// }: Props) {
//   const auth = useAuth()
//   const [busy, setBusy] = useState(false)
//   const [value, setValue] = useState(status)
//   const [vehicleOutOpen, setVehicleOutOpen] = useState(false)
//   const [vehicleReturnOpen, setVehicleReturnOpen] = useState(false)

//   useEffect(() => {
//     setValue(status)
//   }, [status])

//   const isAdmin = auth.status === 'authenticated' && auth.user.role === 'ADMIN'
//   const isGodown = auth.status === 'authenticated' && auth.user.role === 'GODOWN'
//   const godownLinked = !isGodown || (auth.status === 'authenticated' && !!auth.user.godownId)
//   const canChangeStatus = (isAdmin || isGodown) && godownLinked
//   const forAdmin = isAdmin

//   if (!canChangeStatus) {
//     return (
//       <Badge variant={deliveryBadgeVariant(status)} className={className}>
//         {deliveryStatusLabel(status)}
//       </Badge>
//     )
//   }

//   const markDelivered = async () => {
//     const token = getToken()
//     if (!token) return

//     const previous = value
//     setValue('DELIVERED')
//     setBusy(true)

//     try {
//       const res = await apiFetch<{ status: string }>(`/deliveries/${deliveryId}/mark-delivered`, {
//         token,
//         method: 'POST',
//       })
//       setValue(res.status)
//       onUpdated?.({ status: res.status })
//     } catch (e: unknown) {
//       setValue(previous)
//       const msg =
//         e && typeof e === 'object' && 'message' in e
//           ? String((e as { message: string }).message)
//           : 'Status update failed'
//       onError?.(msg)
//     } finally {
//       setBusy(false)
//     }
//   }

//   const patchStatus = async (next: string) => {
//     const token = getToken()
//     if (!token) return

//     const previous = value
//     setValue(next)
//     setBusy(true)

//     try {
//       const res = await apiFetch<{ status: string }>(`/deliveries/${deliveryId}/status`, {
//         token,
//         method: 'PATCH',
//         body: JSON.stringify({ status: next }),
//       })
//       setValue(res.status)
//       onUpdated?.({ status: res.status })
//     } catch (e: unknown) {
//       setValue(previous)
//       const msg =
//         e && typeof e === 'object' && 'message' in e
//           ? String((e as { message: string }).message)
//           : 'Status update failed'
//       onError?.(msg)
//     } finally {
//       setBusy(false)
//     }
//   }

// const postVehicleTransition = async (
//   kind: 'out' | 'return',
//   vehicleNumber: string,
//   driverName?: string,
//   driverPhone?: string,
// ) => {
//     const token = getToken()
//     if (!token) return

//     setBusy(true)
//     try {
//       if (kind === 'out') {
//         const res = await postDeliveryVehicle(
//   deliveryId,
//   token,
//   vehicleNumber,
//   status,
//   { forAdmin },
//   driverName,
//   driverPhone,
// )
//         setValue(res.status)
//         onUpdated?.({ status: res.status, vehicleLabel: res.vehicleLabel })
//       } else {
//         const res = await apiFetch<{ status: string; returnPickupVehicleLabel?: string }>(
//           `/deliveries/${deliveryId}/assign-return-pickup`,
//           {
//             token,
//             method: 'POST',
//            body: JSON.stringify({
//   vehicleNumber,
//   driverName,
//   driverPhone,
// }),
//           },
//         )
//         setValue(res.status)
//         onUpdated?.({
//           status: res.status,
//           returnPickupVehicleLabel: res.returnPickupVehicleLabel,
//         })
//       }
//       setVehicleOutOpen(false)
//       setVehicleReturnOpen(false)
//     } catch (e: unknown) {
//       setValue(status)
//       const msg =
//         e && typeof e === 'object' && 'message' in e
//           ? String((e as { message: string }).message)
//           : 'Status update failed'
//       onError?.(msg)
//     } finally {
//       setBusy(false)
//     }
//   }

//   const openVehicleOutModal = () => setVehicleOutOpen(true)
//   const openVehicleReturnModal = () => setVehicleReturnOpen(true)

//   const handleChange = (next: string) => {
//     if (next === status) {
//       if (next === 'OUT_FOR_DELIVERY') {
//         openVehicleOutModal()
//       } else if (next === 'RETURN_PICKUP') {
//         openVehicleReturnModal()
//       }
//       return
//     }

//     if (isGodown && next === 'DELIVERED' && ['PROCESSED', 'PACKED', 'OUT_FOR_DELIVERY', 'DISPATCHED'].includes(status)) {
//       void markDelivered()
//       return
//     }

//     const kind = transitionKind(status, next, { forAdmin })
//     if (kind === 'blocked') {
//       onError?.(transitionBlockedMessage(status, next))
//       return
//     }

//     if (kind === 'vehicleOut') {
//       openVehicleOutModal()
//       return
//     }

//     if (kind === 'vehicleReturn') {
//       openVehicleReturnModal()
//       return
//     }

//     void patchStatus(next)
//   }

//   const cancelVehicleModal = () => {
//     setVehicleOutOpen(false)
//     setVehicleReturnOpen(false)
//   }

//   const options = isAdmin ? DELIVERY_STATUS_OPTIONS : statusOptionsForSelect(status, { forGodown: isGodown })
//   const selectValue = options.some((o) => o.value === value) ? value : (options[0]?.value ?? 'PROCESSED')

//   return (
//     <div className={cn('inline-flex flex-wrap items-center gap-2', className)}>
//       <select
//         value={selectValue}
//         disabled={busy}
//         onChange={(e) => handleChange(e.target.value)}
//         className={cn(
//           'h-9 min-w-[10.5rem] rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-800 shadow-sm',
//           'focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100',
//           'disabled:cursor-wait disabled:opacity-60',
//         )}
//         aria-label="Delivery status"
//       >
//         {options.map((o) => (
//           <option key={o.value} value={o.value}>
//             {o.label}
//           </option>
//         ))}
//         {!options.some((o) => o.value === (value as DeliveryStatus)) ? (
//           <option value={value}>{deliveryStatusLabel(value)}</option>
//         ) : null}
//       </select>
//       {['PROCESSED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status) ? (
//         <button
//           type="button"
//           disabled={busy}
//           onClick={openVehicleOutModal}
//           className="text-xs font-semibold text-primary-700 hover:text-primary-900 disabled:opacity-60"
//         >
//           {status === 'OUT_FOR_DELIVERY' ? 'Change vehicle' : 'Set vehicle'}
//         </button>
//       ) : null}
//       {status === 'RETURN_PICKUP' ? (
//         <button
//           type="button"
//           disabled={busy}
//           onClick={openVehicleReturnModal}
//           className="text-xs font-semibold text-primary-700 hover:text-primary-900 disabled:opacity-60"
//         >
//           Change vehicle
//         </button>
//       ) : null}

//       <VehicleNumberModal
//         open={vehicleOutOpen}
//         title="Out for delivery"
//         description="Enter or update the vehicle number for the driver."
//         confirmLabel="Confirm"
//         busy={busy}
//         initialValue={vehicleLabel}
//         onClose={cancelVehicleModal}
//         onConfirm={(v, driverName, driverPhone) =>
//     postVehicleTransition('out', v, driverName, driverPhone)
//   }
//       />

//       <ReturnPickupVehicleModal
//         open={vehicleReturnOpen}
//         busy={busy}
//         initialValue={returnPickupVehicleLabel}
//         onClose={cancelVehicleModal}
//           onConfirm={(v, driverName, driverPhone) =>
//     postVehicleTransition('return', v, driverName, driverPhone)
//   }

//       />
//     </div>
//   )
// }

import { useEffect, useState } from 'react'
import { Badge } from '../ui/Badge'
import { apiFetch } from '../../lib/api'
import { postDeliveryVehicle } from '../../lib/deliveryVehicleApi'
import { getToken, useAuth } from '../../auth/store'
import {
  DELIVERY_STATUS_OPTIONS,
  deliveryBadgeVariant,
  deliveryStatusLabel,
  type DeliveryStatus,
} from '../../lib/deliveryStatus'
import {
  statusOptionsForSelect,
  transitionBlockedMessage,
  transitionKind,
} from '../../lib/deliveryTransitions'
import { cn } from '../../lib/cn'
import { ReturnPickupVehicleModal } from './ReturnPickupVehicleModal'
import { VehicleNumberModal } from './VehicleNumberModal'

export type DeliveryStatusPatch = {
  status: string
  vehicleLabel?: string
  driverName?: string
  driverPhone?: string
  returnPickupVehicleLabel?: string
  returnPickupDriverName?: string
  returnPickupDriverPhone?: string
}

type Props = {
  deliveryId: string
  status: string
  vehicleLabel?: string
  driverName?: string
  driverPhone?: string
  returnPickupVehicleLabel?: string
  returnPickupDriverName?: string
  returnPickupDriverPhone?: string
  onUpdated?: (patch: DeliveryStatusPatch) => void
  onError?: (message: string) => void
  className?: string
}

export function DeliveryStatusSelect({
  deliveryId,
  status,
  vehicleLabel,
  driverName,
  driverPhone,
  returnPickupVehicleLabel,
  returnPickupDriverName,
  returnPickupDriverPhone,
  onUpdated,
  onError,
  className,
}: Props) {
  const auth = useAuth()
  const [busy, setBusy] = useState(false)
  const [value, setValue] = useState(status)
  const [vehicleOutOpen, setVehicleOutOpen] = useState(false)
  const [vehicleReturnOpen, setVehicleReturnOpen] = useState(false)

  useEffect(() => {
    setValue(status)
  }, [status])

  const isAdmin = auth.status === 'authenticated' && auth.user.role === 'ADMIN'
  const isGodown = auth.status === 'authenticated' && auth.user.role === 'GODOWN'
  const godownLinked = !isGodown || (auth.status === 'authenticated' && !!auth.user.godownId)
  const canChangeStatus = (isAdmin || isGodown) && godownLinked
  const forAdmin = isAdmin

  if (!canChangeStatus) {
    return (
      <Badge variant={deliveryBadgeVariant(status)} className={className}>
        {deliveryStatusLabel(status)}
      </Badge>
    )
  }

  const markDelivered = async () => {
    const token = getToken()
    if (!token) return

    const previous = value
    setValue('DELIVERED')
    setBusy(true)

    try {
      const res = await apiFetch<{ status: string }>(`/deliveries/${deliveryId}/mark-delivered`, {
        token,
        method: 'POST',
      })
      setValue(res.status)
      onUpdated?.({ status: res.status })
    } catch (e: unknown) {
      setValue(previous)
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Status update failed'
      onError?.(msg)
    } finally {
      setBusy(false)
    }
  }

  const patchStatus = async (next: string) => {
    const token = getToken()
    if (!token) return

    const previous = value
    setValue(next)
    setBusy(true)

    try {
      const res = await apiFetch<{ status: string }>(`/deliveries/${deliveryId}/status`, {
        token,
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      })
      setValue(res.status)
      onUpdated?.({ status: res.status })
    } catch (e: unknown) {
      setValue(previous)
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Status update failed'
      onError?.(msg)
    } finally {
      setBusy(false)
    }
  }

const postVehicleTransition = async (
  kind: 'out' | 'return',
  vehicleNumber: string,
  driverName?: string,
  driverPhone?: string,
) => {
    const token = getToken()
    if (!token) return

    setBusy(true)
    try {
      if (kind === 'out') {
        const res = await postDeliveryVehicle(
  deliveryId,
  token,
  vehicleNumber,
  status,
  { forAdmin },
  driverName,
  driverPhone,
)
        setValue(res.status)
        onUpdated?.({ status: res.status, vehicleLabel: res.vehicleLabel, driverName, driverPhone })
      } else {
        const res = await apiFetch<{ status: string; returnPickupVehicleLabel?: string }>(
          `/deliveries/${deliveryId}/assign-return-pickup`,
          {
            token,
            method: 'POST',
           body: JSON.stringify({
  vehicleNumber,
  driverName,
  driverPhone,
}),
          },
        )
        setValue(res.status)
        onUpdated?.({
          status: res.status,
          returnPickupVehicleLabel: res.returnPickupVehicleLabel,
          returnPickupDriverName: driverName,
          returnPickupDriverPhone: driverPhone,
        })
      }
      setVehicleOutOpen(false)
      setVehicleReturnOpen(false)
    } catch (e: unknown) {
      setValue(status)
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Status update failed'
      onError?.(msg)
    } finally {
      setBusy(false)
    }
  }

  const openVehicleOutModal = () => setVehicleOutOpen(true)
  const openVehicleReturnModal = () => setVehicleReturnOpen(true)

  const handleChange = (next: string) => {
    if (next === status) {
      if (next === 'OUT_FOR_DELIVERY') {
        openVehicleOutModal()
      } else if (next === 'RETURN_PICKUP') {
        openVehicleReturnModal()
      }
      return
    }

    if (isGodown && next === 'DELIVERED' && ['PROCESSED', 'PACKED', 'OUT_FOR_DELIVERY', 'DISPATCHED'].includes(status)) {
      void markDelivered()
      return
    }

    const kind = transitionKind(status, next, { forAdmin })
    if (kind === 'blocked') {
      onError?.(transitionBlockedMessage(status, next))
      return
    }

    if (kind === 'vehicleOut') {
      openVehicleOutModal()
      return
    }

    if (kind === 'vehicleReturn') {
      openVehicleReturnModal()
      return
    }

    void patchStatus(next)
  }

  const cancelVehicleModal = () => {
    setVehicleOutOpen(false)
    setVehicleReturnOpen(false)
  }

  const options = isAdmin ? DELIVERY_STATUS_OPTIONS : statusOptionsForSelect(status, { forGodown: isGodown })
  const selectValue = options.some((o) => o.value === value) ? value : (options[0]?.value ?? 'PROCESSED')

  return (
    <div className={cn('inline-flex flex-wrap items-center gap-2', className)}>
      <select
        value={selectValue}
        disabled={busy}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          'h-9 min-w-[10.5rem] rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-800 shadow-sm',
          'focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100',
          'disabled:cursor-wait disabled:opacity-60',
        )}
        aria-label="Delivery status"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {!options.some((o) => o.value === (value as DeliveryStatus)) ? (
          <option value={value}>{deliveryStatusLabel(value)}</option>
        ) : null}
      </select>
      {['PROCESSED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status) ? (
        <button
          type="button"
          disabled={busy}
          onClick={openVehicleOutModal}
          className="text-xs font-semibold text-primary-700 hover:text-primary-900 disabled:opacity-60"
        >
          {status === 'OUT_FOR_DELIVERY' ? 'Change vehicle' : 'Set vehicle'}
        </button>
      ) : null}
      {status === 'RETURN_PICKUP' ? (
        <button
          type="button"
          disabled={busy}
          onClick={openVehicleReturnModal}
          className="text-xs font-semibold text-primary-700 hover:text-primary-900 disabled:opacity-60"
        >
          Change vehicle
        </button>
      ) : null}

      <VehicleNumberModal
        open={vehicleOutOpen}
        title="Out for delivery"
        description="Enter or update the vehicle number for the driver."
        confirmLabel="Confirm"
        busy={busy}
        initialValue={vehicleLabel}
        initialDriverName={driverName}
        initialDriverPhone={driverPhone}
        onClose={cancelVehicleModal}
        onConfirm={(v, driverName, driverPhone) =>
    postVehicleTransition('out', v, driverName, driverPhone)
  }
      />

      <ReturnPickupVehicleModal
        open={vehicleReturnOpen}
        busy={busy}
        initialValue={returnPickupVehicleLabel}
        initialDriverName={returnPickupDriverName}
        initialDriverPhone={returnPickupDriverPhone}
        onClose={cancelVehicleModal}
          onConfirm={(v, driverName, driverPhone) =>
    postVehicleTransition('return', v, driverName, driverPhone)
  }

      />
    </div>
  )
}