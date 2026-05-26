export function scanPathForDelivery(role: string, status: string, deliveryId: string): string {
  if (role === 'DELIVERY') {
    if (status === 'DISPATCHED') return `/scan/pickup/${deliveryId}`
    return `/scan/deliver/${deliveryId}`
  }
  if (role === 'GODOWN') {
    if (status === 'PENDING_RETURN' || status === 'DELIVERED') return `/scan/return/${deliveryId}`
    return `/scan/dispatch/${deliveryId}`
  }
  if (status === 'UPCOMING') return `/scan/dispatch/${deliveryId}`
  if (status === 'DISPATCHED') return `/scan/pickup/${deliveryId}`
  if (status === 'PENDING_RETURN' || status === 'DELIVERED') return `/scan/return/${deliveryId}`
  return `/scan/deliver/${deliveryId}`
}
