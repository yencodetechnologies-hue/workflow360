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
//   driverName?: string
//   driverPhone?: string
//   returnPickupVehicleLabel?: string
//   returnPickupDriverName?: string
//   returnPickupDriverPhone?: string
//   billingType?: 'FREE' | 'INVOICE'
//   invoiceNo?: string
//   invoiceAmount?: string
//   billedAt?: string
// }

// type Props = {
//   deliveryId: string
//   status: string
//   vehicleLabel?: string
//   driverName?: string
//   driverPhone?: string
//   returnPickupVehicleLabel?: string
//   returnPickupDriverName?: string
//   returnPickupDriverPhone?: string
//   billingType?: 'FREE' | 'INVOICE'
//   invoiceNo?: string
//   onUpdated?: (patch: DeliveryStatusPatch) => void
//   onError?: (message: string) => void
//   className?: string
// }

// export function DeliveryStatusSelect({
//   deliveryId,
//   status,
//   vehicleLabel,
//   driverName,
//   driverPhone,
//   returnPickupVehicleLabel,
//   returnPickupDriverName,
//   returnPickupDriverPhone,
//   billingType,
//   invoiceNo,
//   onUpdated,
//   onError,
//   className,
// }: Props) {
//   const auth = useAuth()
//   const [busy, setBusy] = useState(false)
//   const [value, setValue] = useState(status)
//   const [vehicleOutOpen, setVehicleOutOpen] = useState(false)
//   const [vehicleReturnOpen, setVehicleReturnOpen] = useState(false)
//   const [billingModalOpen, setBillingModalOpen] = useState(false)
//   const [billingMode, setBillingMode] = useState<'FREE' | 'INVOICE'>('FREE')
//   const [invoiceNoInput, setInvoiceNoInput] = useState('')
//   const [invoiceAmountInput, setInvoiceAmountInput] = useState('')
//   const [billingBusy, setBillingBusy] = useState(false)
//   const [billingError, setBillingError] = useState<string | null>(null)

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
//         onUpdated?.({ status: res.status, vehicleLabel: res.vehicleLabel, driverName, driverPhone })
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
//           returnPickupDriverName: driverName,
//           returnPickupDriverPhone: driverPhone,
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

//   const confirmBilling = async () => {
//     if (billingMode === 'INVOICE' && !invoiceNoInput.trim()) {
//       setBillingError('Invoice number is required.')
//       return
//     }
//     const token = getToken()
//     if (!token) return
//     setBillingBusy(true); setBillingError(null)
//     try {
//       const res = await apiFetch<{ status: string; billingType?: string; invoiceNo?: string; invoiceAmount?: string; billedAt?: string }>(
//         `/deliveries/${deliveryId}/status`,
//         {
//           token,
//           method: 'PATCH',
//           body: JSON.stringify({
//             status: 'BILLED',
//             billingType: billingMode,
//             invoiceNo: billingMode === 'INVOICE' ? invoiceNoInput.trim() : undefined,
//             invoiceAmount: billingMode === 'INVOICE' && invoiceAmountInput.trim() ? invoiceAmountInput.trim() : undefined,
//           }),
//         },
//       )
//       setValue(res.status)
//       onUpdated?.({
//         status: res.status,
//         billingType: res.billingType as 'FREE' | 'INVOICE' | undefined,
//         invoiceNo: res.invoiceNo,
//         invoiceAmount: res.invoiceAmount,
//         billedAt: res.billedAt,
//       })
//       setBillingModalOpen(false)
//       setInvoiceNoInput('')
//       setInvoiceAmountInput('')
//     } catch (e: unknown) {
//       const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Billing update failed'
//       setBillingError(msg)
//     } finally {
//       setBillingBusy(false)
//     }
//   }

//   const handleChange = (next: string) => {
//     if (next === 'BILLED' && status !== 'BILLED') {
//       setBillingMode(billingType ?? 'FREE')
//       setInvoiceNoInput(invoiceNo || '')
//       setInvoiceAmountInput('')
//       setBillingError(null)
//       setBillingModalOpen(true)
//       return
//     }
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
//       {/* {['PROCESSED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status) ? (
//         <button
//           type="button"
//           disabled={busy}
//           onClick={openVehicleOutModal}
//           className="text-xs font-semibold text-primary-700 hover:text-primary-900 disabled:opacity-60"
//         >
//           {status === 'OUT_FOR_DELIVERY' ? 'Change vehicle' : 'Set vehicle'}
//         </button>
//       ) : null} */}
//       {['PROCESSED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(status) ? (
//         <button
//           type="button"
//           disabled={busy}
//           onClick={openVehicleOutModal}
//           className="text-xs font-semibold text-primary-700 hover:text-primary-900 disabled:opacity-60"
//         >
//           {status === 'OUT_FOR_DELIVERY' ? 'Change vehicle' : status === 'COMPLETED' ? 'Edit driver info' : 'Set vehicle'}
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
//         initialDriverName={driverName}
//         initialDriverPhone={driverPhone}
//         onClose={cancelVehicleModal}
//         onConfirm={(v, driverName, driverPhone) =>
//     postVehicleTransition('out', v, driverName, driverPhone)
//   }
//       />

//       <ReturnPickupVehicleModal
//         open={vehicleReturnOpen}
//         busy={busy}
//         initialValue={returnPickupVehicleLabel}
//         initialDriverName={returnPickupDriverName}
//         initialDriverPhone={returnPickupDriverPhone}
//         onClose={cancelVehicleModal}
//           onConfirm={(v, driverName, driverPhone) =>
//     postVehicleTransition('return', v, driverName, driverPhone)
//   }

//       />

//       {/* ── Billing modal ──────────────────────────────────────────────── */}
//       {billingModalOpen && (
//         <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
//           <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)' }} onClick={() => !billingBusy && setBillingModalOpen(false)} />
//           <div style={{ position: 'relative', width: '100%', maxWidth: 420, background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
//             {/* Header */}
//             <div style={{ padding: '18px 22px 16px', background: 'linear-gradient(135deg, #059669, #064e3b)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//               <div>
//                 <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Mark as Billed</div>
//                 <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Choose how this delivery was billed</div>
//               </div>
//               <button type="button" onClick={() => setBillingModalOpen(false)} disabled={billingBusy}
//                 style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                 <svg viewBox="0 0 24 24" fill="none" width="13" height="13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
//               </button>
//             </div>
//             {/* Body */}
//             <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
//               {billingError && (
//                 <div style={{ padding: '9px 13px', borderRadius: 9, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, color: '#b91c1c' }}>{billingError}</div>
//               )}
//               {/* Toggle */}
//               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
//                 {(['FREE', 'INVOICE'] as const).map((mode) => (
//                   <button key={mode} type="button" onClick={() => { setBillingMode(mode); setBillingError(null) }}
//                     style={{
//                       padding: '12px 10px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
//                       border: billingMode === mode ? '2px solid #059669' : '1.5px solid #e2e8f0',
//                       background: billingMode === mode ? '#ecfdf5' : '#f8fafc',
//                       transition: 'all 0.15s',
//                     }}>
//                     <div style={{ fontSize: 20, marginBottom: 4 }}>{mode === 'FREE' ? '🎁' : '🧾'}</div>
//                     <div style={{ fontSize: 13, fontWeight: 700, color: billingMode === mode ? '#059669' : '#374151' }}>
//                       {mode === 'FREE' ? 'Free' : 'Invoice'}
//                     </div>
//                     <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
//                       {mode === 'FREE' ? 'No charge' : 'Enter invoice no.'}
//                     </div>
//                   </button>
//                 ))}
//               </div>

//               {/* Invoice fields */}
//               {billingMode === 'INVOICE' && (
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
//                   <div>
//                     <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Invoice number <span style={{ color: '#dc2626' }}>*</span></label>
//                     <input
//                       autoFocus
//                       value={invoiceNoInput}
//                       onChange={(e) => { setInvoiceNoInput(e.target.value); setBillingError(null) }}
//                       placeholder="e.g. INV-2024-001"
//                       style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#111827', background: '#f9fafb', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
//                       onKeyDown={(e) => { if (e.key === 'Enter') void confirmBilling() }}
//                     />
//                   </div>
//                   <div>
//                     <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Amount (optional)</label>
//                     <input
//                       value={invoiceAmountInput}
//                       onChange={(e) => setInvoiceAmountInput(e.target.value)}
//                       placeholder="e.g. ₹5,000"
//                       style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#111827', background: '#f9fafb', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
//                     />
//                   </div>
//                 </div>
//               )}

//               {billingMode === 'FREE' && (
//                 <div style={{ padding: '12px 14px', borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: 13, color: '#065f46' }}>
//                   This delivery will be marked as <strong>Billed Free</strong> — no invoice will be recorded.
//                 </div>
//               )}
//             </div>
//             {/* Footer */}
//             <div style={{ padding: '12px 22px 18px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
//               <button type="button" onClick={() => setBillingModalOpen(false)} disabled={billingBusy}
//                 style={{ height: 38, padding: '0 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
//                 Cancel
//               </button>
//               <button type="button" onClick={() => void confirmBilling()} disabled={billingBusy || (billingMode === 'INVOICE' && !invoiceNoInput.trim())}
//                 style={{
//                   height: 38, padding: '0 22px', borderRadius: 10, border: 'none',
//                   background: billingBusy || (billingMode === 'INVOICE' && !invoiceNoInput.trim()) ? '#6ee7b7' : 'linear-gradient(135deg, #34d399, #059669)',
//                   fontSize: 13, fontWeight: 700, color: '#fff',
//                   cursor: billingBusy || (billingMode === 'INVOICE' && !invoiceNoInput.trim()) ? 'not-allowed' : 'pointer',
//                 }}>
//                 {billingBusy ? 'Saving…' : billingMode === 'FREE' ? 'Mark as Billed Free' : 'Mark as Billed Invoice'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
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
  vehicleType?: 'PRIVATE' | 'PORTER'
  returnPickupVehicleLabel?: string
  returnPickupDriverName?: string
  returnPickupDriverPhone?: string
  returnPickupVehicleType?: 'PRIVATE' | 'PORTER'
  billingType?: 'FREE' | 'INVOICE'
  invoiceNo?: string
  invoiceAmount?: string
  billedAt?: string
}

type Props = {
  deliveryId: string
  status: string
  vehicleLabel?: string
  driverName?: string
  driverPhone?: string
  vehicleType?: 'PRIVATE' | 'PORTER'
  returnPickupVehicleLabel?: string
  returnPickupDriverName?: string
  returnPickupDriverPhone?: string
  returnPickupVehicleType?: 'PRIVATE' | 'PORTER'
  billingType?: 'FREE' | 'INVOICE'
  invoiceNo?: string
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
  vehicleType,
  returnPickupVehicleLabel,
  returnPickupDriverName,
  returnPickupDriverPhone,
  returnPickupVehicleType,
  billingType,
  invoiceNo,
  onUpdated,
  onError,
  className,
}: Props) {
  const auth = useAuth()
  const [busy, setBusy] = useState(false)
  const [value, setValue] = useState(status)
  const [vehicleOutOpen, setVehicleOutOpen] = useState(false)
  const [vehicleReturnOpen, setVehicleReturnOpen] = useState(false)
  const [billingModalOpen, setBillingModalOpen] = useState(false)
  const [billingMode, setBillingMode] = useState<'FREE' | 'INVOICE'>('FREE')
  const [invoiceNoInput, setInvoiceNoInput] = useState('')
  const [invoiceAmountInput, setInvoiceAmountInput] = useState('')
  const [billingBusy, setBillingBusy] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)

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
  vehicleType?: 'PRIVATE' | 'PORTER',
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
  vehicleType,
)
        setValue(res.status)
        onUpdated?.({ status: res.status, vehicleLabel: res.vehicleLabel, driverName, driverPhone, vehicleType: res.vehicleType })
      } else {
        const res = await apiFetch<{ status: string; returnPickupVehicleLabel?: string; returnPickupVehicleType?: 'PRIVATE' | 'PORTER' }>(
          `/deliveries/${deliveryId}/assign-return-pickup`,
          {
            token,
            method: 'POST',
           body: JSON.stringify({
  vehicleNumber,
  driverName,
  driverPhone,
  vehicleType,
}),
          },
        )
        setValue(res.status)
        onUpdated?.({
          status: res.status,
          returnPickupVehicleLabel: res.returnPickupVehicleLabel,
          returnPickupDriverName: driverName,
          returnPickupDriverPhone: driverPhone,
          returnPickupVehicleType: res.returnPickupVehicleType,
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

  const confirmBilling = async () => {
    if (billingMode === 'INVOICE' && !invoiceNoInput.trim()) {
      setBillingError('Invoice number is required.')
      return
    }
    const token = getToken()
    if (!token) return
    setBillingBusy(true); setBillingError(null)
    try {
      const res = await apiFetch<{ status: string; billingType?: string; invoiceNo?: string; invoiceAmount?: string; billedAt?: string }>(
        `/deliveries/${deliveryId}/status`,
        {
          token,
          method: 'PATCH',
          body: JSON.stringify({
            status: 'BILLED',
            billingType: billingMode,
            invoiceNo: billingMode === 'INVOICE' ? invoiceNoInput.trim() : undefined,
            invoiceAmount: billingMode === 'INVOICE' && invoiceAmountInput.trim() ? invoiceAmountInput.trim() : undefined,
          }),
        },
      )
      setValue(res.status)
      onUpdated?.({
        status: res.status,
        billingType: res.billingType as 'FREE' | 'INVOICE' | undefined,
        invoiceNo: res.invoiceNo,
        invoiceAmount: res.invoiceAmount,
        billedAt: res.billedAt,
      })
      setBillingModalOpen(false)
      setInvoiceNoInput('')
      setInvoiceAmountInput('')
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Billing update failed'
      setBillingError(msg)
    } finally {
      setBillingBusy(false)
    }
  }

  const handleChange = (next: string) => {
    if (next === 'BILLED' && status !== 'BILLED') {
      setBillingMode(billingType ?? 'FREE')
      setInvoiceNoInput(invoiceNo || '')
      setInvoiceAmountInput('')
      setBillingError(null)
      setBillingModalOpen(true)
      return
    }
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
      {/* {['PROCESSED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status) ? (
        <button
          type="button"
          disabled={busy}
          onClick={openVehicleOutModal}
          className="text-xs font-semibold text-primary-700 hover:text-primary-900 disabled:opacity-60"
        >
          {status === 'OUT_FOR_DELIVERY' ? 'Change vehicle' : 'Set vehicle'}
        </button>
      ) : null} */}
      {['PROCESSED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(status) ? (
        <button
          type="button"
          disabled={busy}
          onClick={openVehicleOutModal}
          className="text-xs font-semibold text-primary-700 hover:text-primary-900 disabled:opacity-60"
        >
          {status === 'OUT_FOR_DELIVERY' ? 'Change vehicle' : status === 'COMPLETED' ? 'Edit driver info' : 'Set vehicle'}
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
        initialVehicleType={vehicleType}
        onClose={cancelVehicleModal}
        onConfirm={(v, driverName, driverPhone, vehicleType) =>
    postVehicleTransition('out', v, driverName, driverPhone, vehicleType)
  }
      />

      <ReturnPickupVehicleModal
        open={vehicleReturnOpen}
        busy={busy}
        initialValue={returnPickupVehicleLabel}
        initialDriverName={returnPickupDriverName}
        initialDriverPhone={returnPickupDriverPhone}
        initialVehicleType={returnPickupVehicleType}
        onClose={cancelVehicleModal}
          onConfirm={(v, driverName, driverPhone, vehicleType) =>
    postVehicleTransition('return', v, driverName, driverPhone, vehicleType)
  }

      />

      {/* ── Billing modal ──────────────────────────────────────────────── */}
      {billingModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)' }} onClick={() => !billingBusy && setBillingModalOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 420, background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '18px 22px 16px', background: 'linear-gradient(135deg, #059669, #064e3b)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Mark as Billed</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Choose how this delivery was billed</div>
              </div>
              <button type="button" onClick={() => setBillingModalOpen(false)} disabled={billingBusy}
                style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" width="13" height="13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Body */}
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {billingError && (
                <div style={{ padding: '9px 13px', borderRadius: 9, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, color: '#b91c1c' }}>{billingError}</div>
              )}
              {/* Toggle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['FREE', 'INVOICE'] as const).map((mode) => (
                  <button key={mode} type="button" onClick={() => { setBillingMode(mode); setBillingError(null) }}
                    style={{
                      padding: '12px 10px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                      border: billingMode === mode ? '2px solid #059669' : '1.5px solid #e2e8f0',
                      background: billingMode === mode ? '#ecfdf5' : '#f8fafc',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{mode === 'FREE' ? '🎁' : '🧾'}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: billingMode === mode ? '#059669' : '#374151' }}>
                      {mode === 'FREE' ? 'Free' : 'Invoice'}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {mode === 'FREE' ? 'No charge' : 'Enter invoice no.'}
                    </div>
                  </button>
                ))}
              </div>

              {/* Invoice fields */}
              {billingMode === 'INVOICE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Invoice number <span style={{ color: '#dc2626' }}>*</span></label>
                    <input
                      autoFocus
                      value={invoiceNoInput}
                      onChange={(e) => { setInvoiceNoInput(e.target.value); setBillingError(null) }}
                      placeholder="e.g. INV-2024-001"
                      style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#111827', background: '#f9fafb', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      onKeyDown={(e) => { if (e.key === 'Enter') void confirmBilling() }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Amount (optional)</label>
                    <input
                      value={invoiceAmountInput}
                      onChange={(e) => setInvoiceAmountInput(e.target.value)}
                      placeholder="e.g. ₹5,000"
                      style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#111827', background: '#f9fafb', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              )}

              {billingMode === 'FREE' && (
                <div style={{ padding: '12px 14px', borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: 13, color: '#065f46' }}>
                  This delivery will be marked as <strong>Billed Free</strong> — no invoice will be recorded.
                </div>
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: '12px 22px 18px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setBillingModalOpen(false)} disabled={billingBusy}
                style={{ height: 38, padding: '0 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="button" onClick={() => void confirmBilling()} disabled={billingBusy || (billingMode === 'INVOICE' && !invoiceNoInput.trim())}
                style={{
                  height: 38, padding: '0 22px', borderRadius: 10, border: 'none',
                  background: billingBusy || (billingMode === 'INVOICE' && !invoiceNoInput.trim()) ? '#6ee7b7' : 'linear-gradient(135deg, #34d399, #059669)',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                  cursor: billingBusy || (billingMode === 'INVOICE' && !invoiceNoInput.trim()) ? 'not-allowed' : 'pointer',
                }}>
                {billingBusy ? 'Saving…' : billingMode === 'FREE' ? 'Mark as Billed Free' : 'Mark as Billed Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}