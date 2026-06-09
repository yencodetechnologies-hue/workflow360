export type CalendarDay = {
  date: string
  total: number
  byStatus: Record<string, number>
}

export type CalendarResponse = {
  month: string
  days: CalendarDay[]
}

export type DailyReport = {
  date: string
  summary: {
    total: number
    byStatus: Record<string, number>
    lost: number
    damaged: number
    missingQty: number
    damageQty: number
    missingTotal: number
    damageTotal: number
  }
  deliveries: DailyDeliveryRow[]
}

export type DailyDeliveryRow = {
  id: string
  deliveryNo: string
  customerName: string
  siteName?: string
  siteAddress?: string
  fromGodownId?: string
  godownName?: string
  deliveryAt: string
  status: string
  dispatched: number
  returned: number
  lost: number
  damaged: number
  missingTotal?: number
  damageTotal?: number
  missingQty?: number
  damageQty?: number
}

export type ProductMissingLine = {
  productId: string
  qty: number
  particulars?: string
  sku?: string
  note?: string
}

export type IssueDeliveryRow = {
  id: string
  deliveryNo: string
  customerName: string
  siteName?: string
  siteAddress?: string
  deliveryAt: string
  status: string
  fromGodownId: string
  godownName?: string
  missingCount: number
  missingTagIds: string[]
  missingTotal?: number
  damageTotal?: number
  missingQty: number
  damageQty: number
  missingTagCount: number
  damagedTagCount: number
  lostTagCount: number
  hasIssue?: boolean
  productMissing: ProductMissingLine[]
  productDamaged: ProductMissingLine[]
}

/** @deprecated use IssueDeliveryRow */
export type MissingDeliveryRow = IssueDeliveryRow

export type GodownIssueRow = {
  godownId: string
  godownName?: string
  totalDeliveries: number
  issueDeliveryCount: number
  missingQty: number
  damageQty: number
  missingTotal: number
  damageTotal: number
  missingTagCount: number
  damagedTagCount: number
  lostTagCount: number
}

export type MissingProductRow = {
  productId: string
  particulars?: string
  sku?: string
  totalQty: number
  deliveryCount: number
  deliveries: Array<{ id: string; deliveryNo: string; qty: number }>
}

export type ReturnMetric = 'missing' | 'damage' | 'return'

export type BillerReturnRow = {
  billerUserId: string
  billerName?: string
  siteName?: string
  deliveryCount: number
  missingOrderCount: number
  damageOrderCount: number
  returnSubmittedCount: number
  pendingReturnCount: number
  missingQty: number
  damageQty: number
  missingTotal: number
  damageTotal: number
  returnedQty: number
  dispatchedQty: number
  outstandingQty: number
}

export type ProductReturnDeliveryLine = {
  id: string
  deliveryNo: string
  customerName?: string
  deliveryAt?: string
  qty: number
  note?: string
  dispatchedQty?: number
  outstandingQty?: number
}

export type ProductReturnRow = {
  productId: string
  particulars?: string
  sku?: string
  totalQty: number
  deliveryCount: number
  deliveries: ProductReturnDeliveryLine[]
}

export type ReportTab =
  | 'daily'
  | 'issues-godown'
  | 'issues-delivery'
  | 'issues-biller'
  | 'missing'
  | 'missing-products'
  | 'customer'
