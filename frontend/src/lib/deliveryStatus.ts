export type DeliveryStatus =
  | 'PROCESSED'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RETURN_PICKUP'
  | 'PENDING_RETURN'
  | 'COMPLETED'
  | 'CANCELLED'

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

export function deliveryBadgeVariant(status: string): 'blue' | 'green' | 'amber' | 'slate' {
  if (status === 'PROCESSED' || status === 'UPCOMING') return 'blue'
  if (status === 'PACKED') return 'slate'
  if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return 'green'
  if (status === 'DELIVERED' || status === 'RETURN_PICKUP' || status === 'PENDING_RETURN') return 'amber'
  return 'slate'
}
