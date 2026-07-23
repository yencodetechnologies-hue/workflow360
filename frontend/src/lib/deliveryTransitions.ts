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

function normalizeWorkflowStatus(status: string): string {
  if (status === 'DISPATCHED') return 'OUT_FOR_DELIVERY'
  return status
}

function isAdjacentInChain(from: string, to: string): boolean {
  from = normalizeWorkflowStatus(from)
  to = normalizeWorkflowStatus(to)
  if (from === to) return true
  if (to === 'CANCELLED') return from !== 'COMPLETED'
  if (from === 'CANCELLED') return to === 'PROCESSED'

  const i = STATUS_CHAIN.indexOf(from as DeliveryStatus)
  const j = STATUS_CHAIN.indexOf(to as DeliveryStatus)
  if (i === -1 || j === -1) return false
  return Math.abs(i - j) === 1
}

export function transitionKind(from: string, to: string, options?: { forAdmin?: boolean }): TransitionKind {
  from = normalizeWorkflowStatus(from)
  to = normalizeWorkflowStatus(to)

  if (options?.forAdmin) {
    if (from === to) {
      if (to === 'OUT_FOR_DELIVERY') return 'vehicleOut'
      if (to === 'RETURN_PICKUP') return 'vehicleReturn'
      return 'patch'
    }
    if (to === 'OUT_FOR_DELIVERY') return 'vehicleOut'
    if (to === 'RETURN_PICKUP') return 'vehicleReturn'
    return 'patch'
  }

  if (from === to) {
    if (to === 'OUT_FOR_DELIVERY') return 'vehicleOut'
    if (to === 'RETURN_PICKUP') return 'vehicleReturn'
    return 'patch'
  }
  if (to === 'CANCELLED') return 'patch'
  if (to === 'OUT_FOR_DELIVERY') return 'vehicleOut'
  if (to === 'RETURN_PICKUP' && (from === 'DELIVERED' || from === 'PENDING_RETURN')) return 'vehicleReturn'
  if (to === 'OUT_FOR_DELIVERY' || to === 'RETURN_PICKUP') return 'blocked'
  if (isAdjacentInChain(from, to)) return 'patch'
  return 'blocked'
}

export function allowedNextStatuses(current: string): DeliveryStatus[] {
  const normalized = normalizeWorkflowStatus(current)
  const adjacent = STATUS_CHAIN.filter((s) => isAdjacentInChain(normalized, s) && s !== normalized)
  const extras: DeliveryStatus[] = []
  if (normalized !== 'COMPLETED' && normalized !== 'CANCELLED') extras.push('CANCELLED')
  if (normalized === 'CANCELLED') extras.push('PROCESSED')
  // Balance pickup: always allow assigning return vehicle from pending return.
  if (normalized === 'PENDING_RETURN') extras.push('RETURN_PICKUP')
  if (normalized === 'DELIVERED') extras.push('RETURN_PICKUP')
  const currentOption =
    normalized === current ? (current as DeliveryStatus) : ('OUT_FOR_DELIVERY' as DeliveryStatus)
  return [...new Set([currentOption, ...adjacent, ...extras])]
}

export function statusOptionsForSelect(
  current: string,
  options?: { forGodown?: boolean },
): { value: DeliveryStatus; label: string }[] {
  const allowed = new Set(allowedNextStatuses(current))
  if (options?.forGodown && ['PROCESSED', 'PACKED', 'OUT_FOR_DELIVERY'].includes(normalizeWorkflowStatus(current))) {
    allowed.add('DELIVERED')
  }
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
