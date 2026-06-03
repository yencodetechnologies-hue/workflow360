import { DELIVERY_STATUS_OPTIONS, type DeliveryStatus } from './deliveryStatus'

export type TransitionKind = 'patch' | 'vehicleOut' | 'vehicleReturn' | 'blocked'

const STATUS_CHAIN: DeliveryStatus[] = [
  'PROCESSED',
  'PACKED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURN_PICKUP',
  'PENDING_RETURN',
  'COMPLETED',
]

function isAdjacentInChain(from: string, to: string): boolean {
  if (from === to) return true
  if (to === 'CANCELLED') return from !== 'COMPLETED'
  if (from === 'CANCELLED') return to === 'PROCESSED'

  const i = STATUS_CHAIN.indexOf(from as DeliveryStatus)
  const j = STATUS_CHAIN.indexOf(to as DeliveryStatus)
  if (i === -1 || j === -1) return false
  return Math.abs(i - j) === 1
}

export function transitionKind(from: string, to: string): TransitionKind {
  if (from === to) return 'patch'
  if (to === 'CANCELLED') return 'patch'
  if (to === 'OUT_FOR_DELIVERY') return 'vehicleOut'
  if (to === 'RETURN_PICKUP' && from === 'DELIVERED') return 'vehicleReturn'
  if (to === 'OUT_FOR_DELIVERY' || to === 'RETURN_PICKUP') return 'blocked'
  if (isAdjacentInChain(from, to)) return 'patch'
  return 'blocked'
}

export function allowedNextStatuses(current: string): DeliveryStatus[] {
  const adjacent = STATUS_CHAIN.filter((s) => isAdjacentInChain(current, s) && s !== current)
  const extras: DeliveryStatus[] = []
  if (current !== 'COMPLETED' && current !== 'CANCELLED') extras.push('CANCELLED')
  if (current === 'CANCELLED') extras.push('PROCESSED')
  return [...new Set([current as DeliveryStatus, ...adjacent, ...extras])]
}

export function statusOptionsForSelect(current: string): { value: DeliveryStatus; label: string }[] {
  const allowed = new Set(allowedNextStatuses(current))
  return DELIVERY_STATUS_OPTIONS.filter((o) => allowed.has(o.value))
}

export function transitionBlockedMessage(from: string, to: string): string {
  const kind = transitionKind(from, to)
  if (kind === 'vehicleOut') {
    return 'Use Out for delivery and enter a vehicle number.'
  }
  if (kind === 'vehicleReturn') {
    return 'Use Assign return pickup and enter a vehicle number.'
  }
  if (kind === 'blocked') {
    return `Cannot change status from ${from} to ${to}. Follow the workflow one step at a time.`
  }
  return 'Status update failed'
}
