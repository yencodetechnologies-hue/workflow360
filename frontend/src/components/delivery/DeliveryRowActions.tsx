import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/store'
import { scanPathForDelivery } from '../../lib/scanMode'
import { getDeliveryEditState } from '../../lib/deliveryStatus'
import { DeleteDeliveryButton } from './DeleteDeliveryButton'
import { cn } from '../../lib/cn'

type DeliveryRow = {
  id: string
  deliveryNo: string
  customerName: string
  status: string
  billerUserId?: string
  dispatchedTagIds?: string[]
  pickedUpTagIds?: string[]
  deliveredTagIds?: string[]
  returnPickedUpTagIds?: string[]
  returnedTagIds?: string[]
  damagedTagIds?: string[]
  lostTagIds?: string[]
}

type Props = {
  delivery: DeliveryRow
  onDeleted: () => void
  onError: (message: string) => void
  onScan: (path: string) => void
  onEdit?: (deliveryId: string) => void
}

const actionBtnClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700'

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="m13.5 6.5 4 4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M4 7V5a2 2 0 0 1 2-2h2M4 17v2a2 2 0 0 0 2 2h2M16 3h2a2 2 0 0 1 2 2v2M16 21h2a2 2 0 0 0 2-2v-2M7 12h10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function DeliveryRowActions({ delivery, onDeleted, onError, onScan, onEdit }: Props) {
  const auth = useAuth()
  const role = auth.status === 'authenticated' ? auth.user.role : ''
  const userId = auth.status === 'authenticated' ? auth.user.id : undefined
  const showDelete = role === 'ADMIN' || role === 'BILLER'
  const editState = getDeliveryEditState(role, userId, delivery)

  const handleScan = () => {
    if (auth.status !== 'authenticated') return
    onScan(scanPathForDelivery(auth.user.role, delivery.status, delivery.id))
  }

  return (
    <div className="inline-flex items-center justify-end gap-2">
      <Link
        to={`/deliveries/${delivery.id}`}
        className={actionBtnClass}
        title="View details"
        aria-label="View details"
      >
        <EyeIcon />
      </Link>

      {editState.canEdit && onEdit ? (
        <button
          type="button"
          className={actionBtnClass}
          onClick={() => onEdit(delivery.id)}
          title={editState.metadataOnly ? 'Edit delivery (limited)' : 'Edit delivery'}
          aria-label="Edit delivery"
        >
          <PencilIcon />
        </button>
      ) : null}

      <button
        type="button"
        className={cn(actionBtnClass, 'hover:border-violet-300 hover:bg-violet-100 hover:text-violet-800')}
        onClick={handleScan}
        title="Scan"
        aria-label="Scan"
      >
        <ScanIcon />
      </button>

      {showDelete ? (
        <DeleteDeliveryButton
          deliveryId={delivery.id}
          deliveryNo={delivery.deliveryNo}
          customerName={delivery.customerName}
          status={delivery.status}
          billerUserId={delivery.billerUserId}
          dispatchedTagIds={delivery.dispatchedTagIds}
          pickedUpTagIds={delivery.pickedUpTagIds}
          deliveredTagIds={delivery.deliveredTagIds}
          returnPickedUpTagIds={delivery.returnPickedUpTagIds}
          returnedTagIds={delivery.returnedTagIds}
          damagedTagIds={delivery.damagedTagIds}
          lostTagIds={delivery.lostTagIds}
          variant="icon"
          onDeleted={onDeleted}
          onError={onError}
        />
      ) : null}
    </div>
  )
}
