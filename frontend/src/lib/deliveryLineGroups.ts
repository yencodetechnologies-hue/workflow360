export type GroupableDeliveryLine = {
  productId: string
  godownId?: string
  godownName?: string
  qty: number
  particulars?: string
  sku?: string
  unit?: string
  dispatchedQty?: number
  returnedQty?: number
}

export type DeliveryLineGodownGroup = {
  godownId: string
  godownName: string
  lines: GroupableDeliveryLine[]
}

export type GroupLinesByGodownOptions = {
  fallbackGodownId?: string
  godownNameById?: Record<string, string>
}

function resolveGodownName(
  godownId: string,
  line: GroupableDeliveryLine,
  godownNameById?: Record<string, string>,
): string {
  return line.godownName || godownNameById?.[godownId] || 'Godown'
}

export function groupLinesByGodown(
  lines: GroupableDeliveryLine[],
  options?: string | GroupLinesByGodownOptions,
): DeliveryLineGodownGroup[] {
  const opts: GroupLinesByGodownOptions =
    typeof options === 'string' ? { fallbackGodownId: options } : options ?? {}
  const groups = new Map<string, DeliveryLineGodownGroup>()
  for (const line of lines) {
    const godownId = line.godownId || opts.fallbackGodownId
    if (!godownId) continue
    const existing = groups.get(godownId)
    if (existing) {
      existing.lines.push(line)
      if (existing.godownName === 'Godown') {
        existing.godownName = resolveGodownName(godownId, line, opts.godownNameById)
      }
    } else {
      groups.set(godownId, {
        godownId,
        godownName: resolveGodownName(godownId, line, opts.godownNameById),
        lines: [line],
      })
    }
  }
  return [...groups.values()].sort((a, b) => a.godownName.localeCompare(b.godownName))
}
