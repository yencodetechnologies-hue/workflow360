export type DeliveryStatus =
  | 'PROCESSED'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RETURN_PICKUP'
  | 'PENDING_RETURN'
  | 'COMPLETED'
  | 'CANCELLED'

export const DELIVERY_STATUS_OPTIONS: { value: DeliveryStatus; label: string }[] = [
  { value: 'PROCESSED', label: 'Processed' },
  { value: 'PACKED', label: 'Packed' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'RETURN_PICKUP', label: 'Return pickup' },
  { value: 'PENDING_RETURN', label: 'Pending return' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export function deliveryStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PROCESSED: 'Processed',
    PACKED: 'Packed',
    OUT_FOR_DELIVERY: 'Out for delivery',
    DELIVERED: 'Delivered',
    RETURN_PICKUP: 'Return pickup',
    PENDING_RETURN: 'Pending return',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    UPCOMING: 'Processed',
    DISPATCHED: 'Out for delivery',
  }
  return map[status] || status
}

type DeliveryScanFields = {
  status: string
  dispatchedTagIds?: string[]
  pickedUpTagIds?: string[]
  deliveredTagIds?: string[]
  returnPickedUpTagIds?: string[]
  returnedTagIds?: string[]
  damagedTagIds?: string[]
  lostTagIds?: string[]
}

function deliveryHasScanActivity(d: DeliveryScanFields): boolean {
  const lists = [
    d.dispatchedTagIds,
    d.pickedUpTagIds,
    d.deliveredTagIds,
    d.returnPickedUpTagIds,
    d.returnedTagIds,
    d.damagedTagIds,
    d.lostTagIds,
  ]
  return lists.some((arr) => Array.isArray(arr) && arr.length > 0)
}

/** Matches backend: only early-stage deliveries with no RFID scans may be removed. */
export function isDeliveryDeletable(d: DeliveryScanFields): boolean {
  if (!['PROCESSED', 'CANCELLED'].includes(d.status)) return false
  return !deliveryHasScanActivity(d)
}

export type DeliveryDeleteState = {
  canDelete: boolean
  force: boolean
  reason?: string
}

export type DeliveryDeleteFields = DeliveryScanFields & {
  billerUserId?: string
}

export type DeliveryEditState = {
  canEdit: boolean
  fullLines: boolean
  metadataOnly: boolean
  reason?: string
}

export function getDeliveryEditState(
  role: string,
  userId: string | undefined,
  d: DeliveryDeleteFields,
): DeliveryEditState {
  const deletable = isDeliveryDeletable(d)

  if (role === 'ADMIN') {
    return {
      canEdit: true,
      fullLines: deletable,
      metadataOnly: !deletable,
    }
  }

  if (role === 'BILLER') {
    if (d.billerUserId && userId && String(d.billerUserId) !== String(userId)) {
      return {
        canEdit: false,
        fullLines: false,
        metadataOnly: false,
        reason: 'This delivery belongs to another biller',
      }
    }
    if (!deletable) {
      if (!['PROCESSED', 'CANCELLED'].includes(d.status)) {
        return {
          canEdit: false,
          fullLines: false,
          metadataOnly: false,
          reason: 'Only processed or cancelled deliveries can be edited',
        }
      }
      return {
        canEdit: false,
        fullLines: false,
        metadataOnly: false,
        reason: 'Deliveries with RFID scans cannot be edited',
      }
    }
    return { canEdit: true, fullLines: true, metadataOnly: false }
  }

  return { canEdit: false, fullLines: false, metadataOnly: false }
}

export function getDeliveryDeleteState(
  role: string,
  userId: string | undefined,
  d: DeliveryDeleteFields,
): DeliveryDeleteState {
  const deletable = isDeliveryDeletable(d)

  if (role === 'ADMIN') {
    return { canDelete: true, force: !deletable }
  }

  if (role === 'BILLER') {
    if (d.billerUserId && userId && String(d.billerUserId) !== String(userId)) {
      return {
        canDelete: false,
        force: false,
        reason: 'This delivery belongs to another biller',
      }
    }
    if (!deletable) {
      if (!['PROCESSED', 'CANCELLED'].includes(d.status)) {
        return {
          canDelete: false,
          force: false,
          reason: 'Only processed or cancelled deliveries can be deleted',
        }
      }
      return {
        canDelete: false,
        force: false,
        reason: 'Deliveries with RFID scans cannot be deleted',
      }
    }
    return { canDelete: true, force: false }
  }

  return { canDelete: false, force: false }
}

export function deliveryBadgeVariant(status: string): 'blue' | 'green' | 'amber' | 'slate' {
  if (status === 'PROCESSED' || status === 'UPCOMING') return 'blue'
  if (status === 'PACKED') return 'slate'
  if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return 'green'
  if (status === 'DELIVERED' || status === 'RETURN_PICKUP' || status === 'PENDING_RETURN') return 'amber'
  return 'slate'
}
