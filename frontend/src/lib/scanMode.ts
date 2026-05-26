export function scanPathForDelivery(role: string, status: string, deliveryId: string): string {
  if (role === 'DELIVERY') {
    if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return `/scan/pickup/${deliveryId}`
    if (status === 'RETURN_PICKUP') return `/scan/return-pickup/${deliveryId}`
    return `/scan/deliver/${deliveryId}`
  }
  if (role === 'GODOWN') {
    if (status === 'PROCESSED' || status === 'PACKED' || status === 'UPCOMING') {
      return `/scan/dispatch/${deliveryId}`
    }
    if (status === 'RETURN_PICKUP' || status === 'DELIVERED' || status === 'PENDING_RETURN') {
      return `/scan/return/${deliveryId}`
    }
    return `/scan/dispatch/${deliveryId}`
  }
  if (status === 'PROCESSED' || status === 'PACKED' || status === 'UPCOMING') {
    return `/scan/dispatch/${deliveryId}`
  }
  if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return `/scan/pickup/${deliveryId}`
  if (status === 'RETURN_PICKUP') return `/scan/return-pickup/${deliveryId}`
  if (status === 'DELIVERED' || status === 'PENDING_RETURN') return `/scan/return/${deliveryId}`
  return `/scan/deliver/${deliveryId}`
}

export type ScanAction = 'dispatch' | 'pickup' | 'deliver' | 'return' | 'return-pickup'

export function scanActionFromPath(path: string): ScanAction {
  if (path.includes('return-pickup')) return 'return-pickup'
  if (path.includes('dispatch')) return 'dispatch'
  if (path.includes('pickup')) return 'pickup'
  if (path.includes('deliver')) return 'deliver'
  return 'return'
}
