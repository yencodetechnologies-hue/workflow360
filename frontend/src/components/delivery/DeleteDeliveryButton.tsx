import { useState } from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'
import {
  deliveryBadgeVariant,
  deliveryStatusLabel,
  getDeliveryDeleteState,
} from '../../lib/deliveryStatus'
import { cn } from '../../lib/cn'

type Props = {
  deliveryId: string
  deliveryNo: string
  customerName?: string
  status: string
  billerUserId?: string
  dispatchedTagIds?: string[]
  pickedUpTagIds?: string[]
  deliveredTagIds?: string[]
  returnPickedUpTagIds?: string[]
  returnedTagIds?: string[]
  damagedTagIds?: string[]
  lostTagIds?: string[]
  onDeleted?: () => void
  onError?: (message: string) => void
  variant?: 'button' | 'icon'
  size?: 'sm' | 'md'
  className?: string
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

const iconBtnClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600'

export function DeleteDeliveryButton({
  deliveryId,
  deliveryNo,
  customerName,
  status,
  billerUserId,
  dispatchedTagIds,
  pickedUpTagIds,
  deliveredTagIds,
  returnPickedUpTagIds,
  returnedTagIds,
  damagedTagIds,
  lostTagIds,
  onDeleted,
  onError,
  variant = 'icon',
  size = 'sm',
  className,
}: Props) {
  const auth = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const role = auth.status === 'authenticated' ? auth.user.role : ''
  const userId = auth.status === 'authenticated' ? auth.user.id : undefined

  const deleteState = getDeliveryDeleteState(role, userId, {
    status,
    billerUserId,
    dispatchedTagIds,
    pickedUpTagIds,
    deliveredTagIds,
    returnPickedUpTagIds,
    returnedTagIds,
    damagedTagIds,
    lostTagIds,
  })

  if (!deleteState.canDelete && !deleteState.reason && role !== 'ADMIN' && role !== 'BILLER') {
    return null
  }

  if (!deleteState.canDelete && !deleteState.reason) return null

  const disabled = !deleteState.canDelete
  const force = deleteState.force
  const canConfirm = !force || confirmText.trim() === deliveryNo

  const openModal = () => {
    if (disabled) return
    setConfirmText('')
    setOpen(true)
  }

  const confirmDelete = async () => {
    const token = getToken()
    if (!token) return

    setBusy(true)
    try {
      await apiFetch(`/deliveries/${deliveryId}`, { token, method: 'DELETE' })
      setOpen(false)
      setConfirmText('')
      onDeleted?.()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Delete failed'
      onError?.(msg)
    } finally {
      setBusy(false)
    }
  }

  const trigger =
    variant === 'icon' ? (
      <button
        type="button"
        className={cn(iconBtnClass, className)}
        onClick={openModal}
        disabled={disabled}
        title={disabled ? deleteState.reason : 'Delete delivery'}
        aria-label={disabled ? deleteState.reason : 'Delete delivery'}
      >
        <TrashIcon />
      </button>
    ) : (
      <Button
        size={size}
        variant="secondary"
        className={cn(
          'border-rose-200 bg-rose-50 font-semibold text-rose-700 hover:bg-rose-100',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
        onClick={openModal}
        disabled={disabled}
        title={disabled ? deleteState.reason : undefined}
      >
        Delete
      </Button>
    )

  return (
    <>
      {trigger}

      <Modal open={open} title="Delete delivery" onClose={() => !busy && setOpen(false)}>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900">{deliveryNo}</span>
              <Badge variant={deliveryBadgeVariant(status)}>{deliveryStatusLabel(status)}</Badge>
            </div>
            {customerName ? (
              <p className="mt-2 text-sm text-slate-600">{customerName}</p>
            ) : null}
          </div>

          {force ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              This delivery is <strong>{deliveryStatusLabel(status)}</strong> and may have RFID
              scans. Deleting will remove scan history, reverse stock ledger entries, and reset
              linked asset tags. Linked orders will be set back to created.
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Delete this delivery? This is only allowed before any scans. Linked orders in
              allocated state will be set back to created.
            </p>
          )}

          {force ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Type <span className="font-semibold text-slate-900">{deliveryNo}</span> to confirm
              </label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={deliveryNo}
                className="h-11"
                disabled={busy}
                autoComplete="off"
              />
            </div>
          ) : null}

          <div className="flex gap-2">
            <Button
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => void confirmDelete()}
              disabled={busy || !canConfirm}
            >
              {busy ? 'Deleting…' : 'Delete'}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
