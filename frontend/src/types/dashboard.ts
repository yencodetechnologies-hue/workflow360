export type DailySummary = {
  total: number
  byStatus: Record<string, number>
  lost: number
  damaged: number
}

export type DailyReport = {
  date: string
  summary: DailySummary
}

export type TrendDay = {
  date: string
  label: string
  total: number
}

export type GodownWithStock = {
  id: string
  name: string
  city?: string
  manager?: string
  stockQty: number
}

export type DeliveryActivity = {
  id: string
  deliveryNo: string
  customerName: string
  status: string
  deliveryAt: string
}

export type MissingRow = {
  id: string
  deliveryNo: string
  customerName: string
  missingCount: number
}

export type DashboardAlert = {
  id: string
  title: string
  description: string
  count: number
  href: string
  severity: 'warn' | 'bad' | 'info'
}

export type ReturnKpis = {
  returnDelivery: number
  returnDispatch: number
  returnsPending: number
  returnsCompleted: number
}

export type TodayKpis = {
  today: number
  running: number
  pendingReturn: number
  completed: number
  damaged: number
  lost: number
  totalStock: number
  byStatus: {
    upcoming: number
    dispatched: number
    pendingReturn: number
    completed: number
    delivered: number
  }
}
