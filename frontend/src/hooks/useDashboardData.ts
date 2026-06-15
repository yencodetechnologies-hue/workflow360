

import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'
import { getToken, readState } from '../auth/store'
import type {
  DailyReport,
  DashboardAlert,
  DeliveryActivity,
  GodownWithStock,
  MissingRow,
  ReturnKpis,
  TodayKpis,
  TrendDay,
} from '../types/dashboard'
import type { GodownRow } from '../pages/Godowns/List'

const LOW_STOCK_THRESHOLD = 20
const OVERDUE_DAYS = 3

function formatDate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function weekdayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, (m || 1) - 1, d || 1)
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getDay()] ?? ''
}

function lastNDates(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    out.push(formatDate(d))
  }
  return out
}

type DailyReturnsReport = {
  date: string
  summary: {
    total: number
    byStatus: Record<string, number>
    returnDelivery: number
    returnDispatch: number
    returnsPending: number
    returnsCompleted: number
  }
}

// Build today's KPIs from the daily report (deliveryAt within today)
function mapTodayKpis(report: DailyReport | null): TodayKpis {
  const s = report?.summary
  const by = s?.byStatus ?? {}
  const pending = (by.PROCESSED ?? 0) + (by.UPCOMING ?? 0)
  const dispatched = (by.OUT_FOR_DELIVERY ?? 0) + (by.DISPATCHED ?? 0) + (by.PACKED ?? 0)
  const pendingReturn = (by.PENDING_RETURN ?? 0) + (by.DELIVERED ?? 0)
  const completed = by.COMPLETED ?? 0
  return {
    today: s?.total ?? 0,
    running: pending + dispatched,
    pendingReturn,
    completed,
    damaged: s?.damaged ?? 0,
    lost: s?.lost ?? 0,
    totalStock: 0,
    byStatus: {
      upcoming: pending,
      dispatched,
      pendingReturn,
      completed,
      delivered: by.DELIVERED ?? 0,
    },
  }
}

// Build today's return KPIs from the daily-returns report (returnExpectedAt within today)
function mapReturnKpis(report: DailyReturnsReport | null): ReturnKpis {
  const s = report?.summary
  return {
    returnDelivery: s?.returnDelivery ?? 0,
    returnDispatch: s?.returnDispatch ?? 0,
    returnsPending: s?.returnsPending ?? 0,
    returnsCompleted: s?.returnsCompleted ?? 0,
  }
}

type DeliveryRow = {
  id: string
  deliveryNo: string
  customerName: string
  status: string
  deliveryAt: string
  returnExpectedAt?: string
}

export function useDashboardData() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [todayReport, setTodayReport] = useState<DailyReport | null>(null)
  const [returnReport, setReturnReport] = useState<DailyReturnsReport | null>(null)
  const [trend, setTrend] = useState<TrendDay[]>([])
  const [godownsWithStock, setGodownsWithStock] = useState<GodownWithStock[]>([])
  const [recentActivity, setRecentActivity] = useState<DeliveryActivity[]>([])
  const [missing, setMissing] = useState<MissingRow[]>([])
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
  const [totalStock, setTotalStock] = useState(0)

  const refresh = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const dates = lastNDates(7)
    const auth = readState()
    const godownId =
      auth.status === 'authenticated' && auth.user.role === 'GODOWN' ? auth.user.godownId : undefined
    const godownQ = godownId ? `&godownId=${encodeURIComponent(godownId)}` : ''

    try {
      const [dailyResults, returnsResult, missingRows, godownRows, stockRows, deliveryRows] = await Promise.all([
        // 7-day trend
        Promise.all(
          dates.map((date) =>
            apiFetch<DailyReport>(`/reports/daily?date=${encodeURIComponent(date)}${godownQ}`, { token }),
          ),
        ),
        // Today's return counts for the return dashboard cards
        apiFetch<DailyReturnsReport>(`/reports/daily-returns?date=${encodeURIComponent(dates[dates.length - 1] ?? '')}${godownQ}`, { token }).catch(() => null),
        apiFetch<MissingRow[]>(`/reports/missing?limit=100${godownQ}`, { token }).catch(() => [] as MissingRow[]),
        apiFetch<GodownRow[]>('/godowns', { token }),
        apiFetch<Array<{ godownId: string; productId: string; qty: number }>>(
          `/reports/stock${godownId ? `?godownId=${encodeURIComponent(godownId)}` : ''}`,
          { token },
        ).catch(() => [] as Array<{ godownId: string; productId: string; qty: number }>),
        apiFetch<DeliveryRow[]>('/deliveries?limit=50', { token }),
      ])

      const trendDays: TrendDay[] = dates.map((date, i) => ({
        date,
        label: weekdayLabel(date),
        total: dailyResults[i]?.summary?.total ?? 0,
      }))
      setTrend(trendDays)

      const todayData = dailyResults[dailyResults.length - 1] ?? null
      setTodayReport(todayData)
      setReturnReport(returnsResult)

      const stockMap: Record<string, number> = {}
      let stockSum = 0
      if (Array.isArray(stockRows)) {
        for (const r of stockRows) {
          const gid = String(r.godownId)
          const qty = Number(r.qty) || 0
          stockMap[gid] = (stockMap[gid] ?? 0) + qty
          stockSum += qty
        }
      }
      setTotalStock(stockSum)

      const godowns: GodownWithStock[] = (Array.isArray(godownRows) ? godownRows : []).map((g) => ({
        id: g.id,
        name: g.name,
        city: g.city,
        manager: g.manager,
        stockQty: stockMap[g.id] ?? 0,
      }))
      godowns.sort((a, b) => b.stockQty - a.stockQty)
      setGodownsWithStock(godowns)

      setMissing(Array.isArray(missingRows) ? missingRows : [])
      setDeliveries(Array.isArray(deliveryRows) ? deliveryRows : [])

      const activities: DeliveryActivity[] = (Array.isArray(deliveryRows) ? deliveryRows : [])
        .slice()
        .sort((a, b) => new Date(b.deliveryAt).getTime() - new Date(a.deliveryAt).getTime())
        .slice(0, 6)
        .map((d) => ({
          id: d.id,
          deliveryNo: d.deliveryNo,
          customerName: d.customerName,
          status: d.status,
          deliveryAt: d.deliveryAt,
        }))
      setRecentActivity(activities)
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Failed to load dashboard'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onStockChanged = () => {
      void refresh()
    }
    window.addEventListener('godown-stock-changed', onStockChanged)
    return () => window.removeEventListener('godown-stock-changed', onStockChanged)
  }, [refresh])

  const kpis = useMemo(() => {
    const k = mapTodayKpis(todayReport)
    return { ...k, totalStock }
  }, [todayReport, totalStock])

  const returnKpis = useMemo(() => mapReturnKpis(returnReport), [returnReport])

  const alerts = useMemo((): DashboardAlert[] => {
    const out: DashboardAlert[] = []
    const cutoff = Date.now() - OVERDUE_DAYS * 24 * 60 * 60 * 1000

    const overdue = deliveries.filter((d) => {
      if (d.status !== 'PENDING_RETURN') return false
      if (!d.returnExpectedAt) return false
      return new Date(d.returnExpectedAt).getTime() < cutoff
    })
    if (overdue.length > 0) {
      const sample = overdue
        .slice(0, 2)
        .map((d) => d.deliveryNo)
        .join(', ')
      out.push({
        id: 'overdue',
        title: `Pending returns > ${OVERDUE_DAYS} days`,
        description: sample
          ? `${overdue.length} overdue — e.g. ${sample}`
          : `${overdue.length} delivery(ies) overdue for return confirmation`,
        count: overdue.length,
        href: '/deliveries',
        severity: 'warn',
      })
    }

    const missingCount = missing.length
    if (missingCount > 0) {
      const sample = missing
        .slice(0, 2)
        .map((m) => m.deliveryNo)
        .join(', ')
      out.push({
        id: 'missing',
        title: 'Missing tags / pending return',
        description: sample
          ? `${missingCount} delivery(ies) need attention — e.g. ${sample}`
          : `${missingCount} delivery(ies) need attention`,
        count: missingCount,
        href: '/deliveries',
        severity: 'warn',
      })
    }

    const lowStock = godownsWithStock.filter((g) => g.stockQty < LOW_STOCK_THRESHOLD)
    if (lowStock.length > 0) {
      const names = lowStock
        .slice(0, 2)
        .map((g) => `${g.name} (${g.stockQty})`)
        .join(', ')
      out.push({
        id: 'low-stock',
        title: 'Low stock warning',
        description: `${lowStock.length} godown(s) below ${LOW_STOCK_THRESHOLD} units — ${names}`,
        count: lowStock.length,
        href: '/godowns',
        severity: 'warn',
      })
    }

    if (kpis.damaged > 0) {
      out.push({
        id: 'damaged',
        title: 'Damaged items today',
        description: `${kpis.damaged} damaged tag(s) recorded today. Review reports for details.`,
        count: kpis.damaged,
        href: '/reports',
        severity: 'bad',
      })
    }

    if (kpis.lost > 0) {
      out.push({
        id: 'lost',
        title: 'Lost items today',
        description: `${kpis.lost} lost tag(s) recorded today. Review reports for details.`,
        count: kpis.lost,
        href: '/reports',
        severity: 'bad',
      })
    }

    return out
  }, [deliveries, missing, godownsWithStock, kpis.damaged, kpis.lost])

  return {
    loading,
    error,
    refresh,
    kpis,
    returnKpis,
    trend,
    godownsWithStock,
    recentActivity,
    alerts,
    todayDate: lastNDates(1)[0] ?? formatDate(new Date()),
  }
}