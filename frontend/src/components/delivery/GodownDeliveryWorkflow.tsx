import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'
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
  lines?: GodownWorkflowLine[]
  scanProgress?: { dispatchComplete?: boolean }
  qtyProgress?: { dispatchComplete?: boolean }
  billerReturnUrl?: string
  billerReturnSubmittedAt?: string
}

type Props = {
  delivery: GodownWorkflowDelivery
  onUpdated?: () => void
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
  if (role !== 'GODOWN') return null

  const lines = delivery.lines || []
  const dispatchComplete =
    delivery.qtyProgress?.dispatchComplete ?? delivery.scanProgress?.dispatchComplete ?? false

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
      notifyStockChanged()
      onUpdated?.()
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
      await apiFetch(`/deliveries/${delivery.id}/confirm-dispatch`, {
        token,
        method: 'POST',
        body: JSON.stringify({}),
      })
    })

  const markPacked = () =>
    run(async () => {
      const token = getToken()
      if (!token) return
      await apiFetch(`/deliveries/${delivery.id}/mark-packed`, { token, method: 'POST' })
    })

  const outForDelivery = (vehicleNumber: string) =>
    run(async () => {
      const token = getToken()
      if (!token) return
      await apiFetch(`/deliveries/${delivery.id}/out-for-delivery`, {
        token,
        method: 'POST',
        body: JSON.stringify({ vehicleNumber }),
      })
      setVehicleOpen(false)
    })

  const assignReturnPickup = (vehicleNumber: string) =>
    run(async () => {
      const token = getToken()
      if (!token) return
      await apiFetch(`/deliveries/${delivery.id}/assign-return-pickup`, {
        token,
        method: 'POST',
        body: JSON.stringify({ vehicleNumber }),
      })
      setReturnPickupOpen(false)
    })

  const markDelivered = () =>
    run(async () => {
      const token = getToken()
      if (!token) return
      await apiFetch(`/deliveries/${delivery.id}/mark-delivered`, { token, method: 'POST' })
    })

  const openReturnModal = () => {
    const initial: Record<string, string> = {}
    for (const l of lines) {
      const dispatched = l.dispatchedQty ?? 0
      const returned = l.returnedQty ?? 0
      const remaining = Math.max(0, dispatched - returned)
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
        onError?.('Enter return quantity for at least one product')
        return
      }
      await apiFetch(`/deliveries/${delivery.id}/confirm-return`, {
        token,
        method: 'POST',
        body: JSON.stringify({ lines: bodyLines }),
      })
      setReturnOpen(false)
    })

  const closeReturn = () =>
    run(async () => {
      const token = getToken()
      if (!token) return
      await apiFetch(`/deliveries/${delivery.id}/close-return`, { token, method: 'POST' })
    })

  const btnSize = compact ? ('sm' as const) : undefined
  const status = delivery.status

  const buttons: ReactNode[] = []

  if (status === 'PROCESSED' && !dispatchComplete) {
    buttons.push(
      <Button key="dispatch" size={btnSize} variant="secondary" disabled={busy} onClick={() => void confirmDispatch()}>
        Confirm dispatch
      </Button>,
    )
    buttons.push(
      <Button
        key="scan"
        size={btnSize}
        variant="secondary"
        disabled={busy}
        onClick={() => nav(scanPathForDelivery(role, status, delivery.id))}
      >
        RFID scan
      </Button>,
    )
  }

  if (status === 'PROCESSED' && dispatchComplete) {
    buttons.push(
      <Button key="packed" size={btnSize} variant="secondary" disabled={busy} onClick={() => void markPacked()}>
        Mark packed
      </Button>,
    )
  }

  if ((status === 'PROCESSED' || status === 'PACKED') && dispatchComplete) {
    buttons.push(
      <Button key="ofd" size={btnSize} disabled={busy} onClick={() => setVehicleOpen(true)}>
        Out for delivery
      </Button>,
    )
  }

  if (status === 'OUT_FOR_DELIVERY') {
    buttons.push(
      <Button key="delivered" size={btnSize} variant="secondary" disabled={busy} onClick={() => void markDelivered()}>
        Mark delivered
      </Button>,
    )
  }

  if (status === 'DELIVERED') {
    buttons.push(
      <Button key="assign-rp" size={btnSize} disabled={busy} onClick={() => setReturnPickupOpen(true)}>
        Assign return pickup
      </Button>,
    )
  }

  if (status === 'RETURN_PICKUP' || status === 'PENDING_RETURN') {
    buttons.push(
      <Button key="return" size={btnSize} variant="secondary" disabled={busy} onClick={openReturnModal}>
        Record return
      </Button>,
    )
    buttons.push(
      <Button
        key="scan-ret"
        size={btnSize}
        variant="secondary"
        disabled={busy}
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
          disabled={busy}
          onClick={() => nav(`/scan/return-pickup/${delivery.id}`)}
        >
          RFID return pickup scan
        </Button>,
      )
    }
  }

  if (status === 'PENDING_RETURN') {
    buttons.push(
      <Button key="complete" size={btnSize} disabled={busy} onClick={() => void closeReturn()}>
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
        title="Out for delivery"
        description="Enter vehicle number for the driver."
        confirmLabel="Confirm"
        busy={busy}
        onClose={() => setVehicleOpen(false)}
        onConfirm={outForDelivery}
      />

      <ReturnPickupVehicleModal
        open={returnPickupOpen}
        busy={busy}
        onClose={() => setReturnPickupOpen(false)}
        onConfirm={assignReturnPickup}
      />

      <Modal open={returnOpen} title="Record return quantities" onClose={() => setReturnOpen(false)}>
        <div className="space-y-3">
          {lines.map((l) => {
            const dispatched = l.dispatchedQty ?? 0
            const returned = l.returnedQty ?? 0
            const max = Math.max(0, dispatched - returned)
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
          <Button onClick={() => void confirmReturn()} disabled={busy}>
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
