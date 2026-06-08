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

export type DriverDeliveryLine = {
  productId: string
  godownId?: string
  godownName?: string
  particulars?: string
  sku?: string
  qty: number
  unit?: string
  dispatchedQty?: number
  returnedQty?: number
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
  fromGodownId?: string
  pickupLocation: DriverPickupLocation
  pickupLocations?: DriverPickupLocation[]
  dropLocation: DriverDropLocation
  lines: DriverDeliveryLine[]
}

export function godownNameByIdFromPickups(
  pickupLocations?: DriverPickupLocation[],
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const loc of pickupLocations ?? []) {
    if (loc.godownId && loc.name) map[loc.godownId] = loc.name
  }
  return map
}

/** Merge API pickup locations with godown groups so every source godown gets a pickup stop. */
export function resolvePickupLocations(
  row: Pick<DriverDeliveryListRow, 'pickupLocations' | 'pickupLocation'>,
  godownGroups: Array<{ godownId: string; godownName: string }>,
): DriverPickupLocation[] {
  const fromApi =
    row.pickupLocations?.length ? row.pickupLocations : row.pickupLocation ? [row.pickupLocation] : []
  const byId = new Map<string, DriverPickupLocation>()
  for (const loc of fromApi) {
    if (loc.godownId) byId.set(loc.godownId, loc)
  }
  for (const group of godownGroups) {
    const existing = byId.get(group.godownId)
    if (existing) {
      if (existing.name === 'Godown' && group.godownName !== 'Godown') {
        byId.set(group.godownId, { ...existing, name: group.godownName })
      }
      continue
    }
    byId.set(group.godownId, {
      godownId: group.godownId,
      name: group.godownName,
      address: '',
    })
  }
  const merged = [...byId.values()]
  return merged.length ? merged : fromApi
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

  const pickupLocations = Array.isArray(raw.pickupLocations) && raw.pickupLocations.length
    ? raw.pickupLocations
    : pickupLocation
      ? [pickupLocation]
      : []

  return {
    id: String(raw.id ?? ''),
    deliveryNo: String(raw.deliveryNo ?? ''),
    status: String(raw.status ?? ''),
    phase: raw.phase,
    deliveryAt: String(raw.deliveryAt ?? ''),
    returnExpectedAt: raw.returnExpectedAt,
    contactPhone: raw.contactPhone,
    vehicleLabel: raw.vehicleLabel,
    fromGodownId: raw.fromGodownId ? String(raw.fromGodownId) : undefined,
    pickupLocation: pickupLocations[0] ?? pickupLocation,
    pickupLocations,
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
