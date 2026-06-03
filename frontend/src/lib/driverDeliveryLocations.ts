export type DriverPickupLocation = {
  godownId?: string
  name: string
  address?: string
  mobile?: string
}

export type DriverDropLocation = {
  customerName: string
  siteName?: string
  siteAddress?: string
  contactPhone?: string
}

export type DriverLocationBlock = {
  label: string
  name: string
  address: string
  phone?: string
}

export type DriverDeliveryListRow = {
  id: string
  deliveryNo: string
  status: string
  phase?: string
  deliveryAt: string
  returnExpectedAt?: string
  contactPhone?: string
  vehicleLabel?: string
  pickupLocation: DriverPickupLocation
  dropLocation: DriverDropLocation
  lines: Array<{
    productId: string
    particulars?: string
    sku?: string
    qty: number
    unit?: string
  }>
}

type LegacyDriverDeliveryPayload = Partial<DriverDeliveryListRow> & {
  customerName?: string
  siteName?: string
  siteAddress?: string
}

/** Supports driver API rows and legacy list payloads (pre–pickup/drop locations). */
export function normalizeDriverDeliveryRow(raw: LegacyDriverDeliveryPayload): DriverDeliveryListRow {
  const lines = Array.isArray(raw.lines) ? raw.lines : []
  const pickupLocation: DriverPickupLocation =
    raw.pickupLocation ??
    ({
      name: 'Godown',
      address: '',
    } satisfies DriverPickupLocation)
  const dropLocation: DriverDropLocation =
    raw.dropLocation ??
    ({
      customerName: raw.customerName?.trim() || 'Customer',
      siteName: raw.siteName,
      siteAddress: raw.siteAddress,
      contactPhone: raw.contactPhone,
    } satisfies DriverDropLocation)

  return {
    id: String(raw.id ?? ''),
    deliveryNo: String(raw.deliveryNo ?? ''),
    status: String(raw.status ?? ''),
    phase: raw.phase,
    deliveryAt: String(raw.deliveryAt ?? ''),
    returnExpectedAt: raw.returnExpectedAt,
    contactPhone: raw.contactPhone,
    vehicleLabel: raw.vehicleLabel,
    pickupLocation,
    dropLocation,
    lines,
  }
}

function siteDisplayName(drop: DriverDropLocation) {
  return drop.siteName?.trim() || drop.customerName
}

function siteAddress(drop: DriverDropLocation) {
  return drop.siteAddress?.trim() || ''
}

/** Forward: godown → site. Return phase: site → godown. */
export function driverStopsForDelivery(
  phase: string | undefined,
  pickup: DriverPickupLocation,
  drop: DriverDropLocation,
): { pickup: DriverLocationBlock; drop: DriverLocationBlock } {
  const isReturn = phase === 'RETURN'
  const godownStop: DriverLocationBlock = {
    label: 'Pickup',
    name: pickup.name,
    address: pickup.address || '—',
    phone: pickup.mobile,
  }
  const siteStop: DriverLocationBlock = {
    label: 'Drop',
    name: siteDisplayName(drop),
    address: siteAddress(drop) || '—',
    phone: drop.contactPhone,
  }

  if (isReturn) {
    return {
      pickup: { ...siteStop, label: 'Pickup' },
      drop: { ...godownStop, label: 'Drop' },
    }
  }
  return { pickup: godownStop, drop: siteStop }
}
