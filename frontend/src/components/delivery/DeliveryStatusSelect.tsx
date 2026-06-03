import { useEffect, useState } from 'react'
import { Badge } from '../ui/Badge'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'
import {
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

type Props = {
  deliveryId: string
  status: string
  onUpdated?: (status: string) => void
  onError?: (message: string) => void
  className?: string
}

export function DeliveryStatusSelect({ deliveryId, status, onUpdated, onError, className }: Props) {
  const auth = useAuth()
  const [busy, setBusy] = useState(false)
  const [value, setValue] = useState(status)
  const [vehicleOutOpen, setVehicleOutOpen] = useState(false)
  const [vehicleReturnOpen, setVehicleReturnOpen] = useState(false)

  useEffect(() => {
    setValue(status)
  }, [status])

  const isAdmin = auth.status === 'authenticated' && auth.user.role === 'ADMIN'

  if (!isAdmin) {
    return (
      <Badge variant={deliveryBadgeVariant(status)} className={className}>
        {deliveryStatusLabel(status)}
      </Badge>
    )
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
      onUpdated?.(res.status)
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
    endpoint: 'out-for-delivery' | 'assign-return-pickup',
    vehicleNumber: string,
  ) => {
    const token = getToken()
    if (!token) return

    setBusy(true)
    try {
      const res = await apiFetch<{ status: string }>(`/deliveries/${deliveryId}/${endpoint}`, {
        token,
        method: 'POST',
        body: JSON.stringify({ vehicleNumber }),
      })
      setValue(res.status)
      onUpdated?.(res.status)
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

  const handleChange = (next: string) => {
    if (next === value) return

    const kind = transitionKind(value, next)
    if (kind === 'blocked') {
      onError?.(transitionBlockedMessage(value, next))
      return
    }

    if (kind === 'vehicleOut') {
      setVehicleOutOpen(true)
      return
    }

    if (kind === 'vehicleReturn') {
      setVehicleReturnOpen(true)
      return
    }

    void patchStatus(next)
  }

  const cancelVehicleModal = () => {
    setVehicleOutOpen(false)
    setVehicleReturnOpen(false)
  }

  const options = statusOptionsForSelect(value)
  const selectValue = options.some((o) => o.value === value) ? value : (options[0]?.value ?? 'PROCESSED')

  return (
    <>
      <select
        value={selectValue}
        disabled={busy}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          'h-9 min-w-[10.5rem] rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-800 shadow-sm',
          'focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100',
          'disabled:cursor-wait disabled:opacity-60',
          className,
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

      <VehicleNumberModal
        open={vehicleOutOpen}
        title="Out for delivery"
        description="Enter vehicle number for the driver."
        confirmLabel="Confirm"
        busy={busy}
        onClose={cancelVehicleModal}
        onConfirm={(v) => postVehicleTransition('out-for-delivery', v)}
      />

      <ReturnPickupVehicleModal
        open={vehicleReturnOpen}
        busy={busy}
        onClose={cancelVehicleModal}
        onConfirm={(v) => postVehicleTransition('assign-return-pickup', v)}
      />
    </>
  )
}
