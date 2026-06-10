import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { getToken, readState } from '../auth/store'
import type { GodownRow } from '../pages/Godowns/List'
import type { ReturnMetric } from '../types/reports'

function todayKey() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function currentMonthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export type BillerOption = {
  id: string
  name: string
  siteName?: string
}

export type ProductOption = {
  id: string
  name: string
  sku?: string
}

export function useReportFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const auth = readState()
  const lockedGodownId =
    auth.status === 'authenticated' && auth.user.role === 'GODOWN' ? auth.user.godownId || '' : ''

  const date = searchParams.get('date') || todayKey()
  const dateTo = searchParams.get('dateTo') || ''
  const month = searchParams.get('month') || currentMonthKey()
  const godownId = lockedGodownId || searchParams.get('godownId') || ''
  const site = searchParams.get('site') || ''
  const customerName = searchParams.get('customerName') || ''
  const billerUserId =
    auth.status === 'authenticated' && auth.user.role === 'BILLER'
      ? auth.user.id
      : searchParams.get('billerUserId') || ''
  const productId = searchParams.get('productId') || ''
  const metricRaw = searchParams.get('metric') || 'missing'
  const metric: ReturnMetric = metricRaw === 'damage' || metricRaw === 'return' ? metricRaw : 'missing'
  const tab = searchParams.get('tab') || 'daily'

  const [godowns, setGodowns] = useState<GodownRow[]>([])
  const [sites, setSites] = useState<string[]>([])
  const [customers, setCustomers] = useState<string[]>([])
  const [billers, setBillers] = useState<BillerOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    apiFetch<GodownRow[]>('/godowns', { token }).then(setGodowns).catch(() => {})
    apiFetch<string[]>('/reports/sites', { token }).then(setSites).catch(() => [])
    apiFetch<string[]>('/reports/customers', { token }).then(setCustomers).catch(() => [])

    // Fetch billers list
    apiFetch<Array<{ id: string; contactName?: string; siteName?: string; email?: string }>>(
      '/users?role=BILLER',
      { token },
    )
      .then((rows) =>
        setBillers(
          rows.map((r) => ({
            id: r.id,
            name: r.contactName || r.email || r.id,
            siteName: r.siteName,
          })),
        ),
      )
      .catch(() => {})

    // Fetch products list
    apiFetch<Array<{ _id?: string; id?: string; particulars?: string; name?: string; sku?: string }>>(
      '/products',
      { token },
    )
      .then((rows) =>
        setProducts(
          rows.map((r) => ({
            id: String(r._id ?? r.id ?? ''),
            name: String(r.particulars ?? r.name ?? ''),
            sku: r.sku ? String(r.sku) : undefined,
          })),
        ),
      )
      .catch(() => {})
  }, [])

  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    if (date) p.set('date', date)
    if (dateTo) p.set('dateTo', dateTo)
    if (godownId) p.set('godownId', godownId)
    if (site) p.set('site', site)
    if (customerName) p.set('customerName', customerName)
    if (billerUserId) p.set('billerUserId', billerUserId)
    if (productId) p.set('productId', productId)
    if (metric && metric !== 'missing') p.set('metric', metric)
    return p.toString()
  }, [date, dateTo, godownId, site, customerName, billerUserId, productId, metric])

  const filterQuery = useMemo(() => {
    const p = new URLSearchParams()
    if (godownId) p.set('godownId', godownId)
    if (site) p.set('site', site)
    if (customerName) p.set('customerName', customerName)
    if (billerUserId) p.set('billerUserId', billerUserId)
    if (productId) p.set('productId', productId)
    const s = p.toString()
    return s ? `&${s}` : ''
  }, [godownId, site, customerName, billerUserId, productId])

  const dateQuery = useMemo(() => {
    const p = new URLSearchParams()
    if (dateTo) {
      p.set('dateFrom', date)
      p.set('dateTo', dateTo)
    } else if (date) {
      p.set('date', date)
    }
    const s = p.toString()
    return s ? `${s}&` : ''
  }, [date, dateTo])

  const setFilters = useCallback(
    (patch: Partial<{
      date: string
      dateTo: string
      month: string
      godownId: string
      site: string
      customerName: string
      billerUserId: string
      productId: string
      metric: ReturnMetric
      tab: string
    }>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, val] of Object.entries(patch)) {
          if (val === undefined) continue
          if (val === '' || val === null) next.delete(key)
          else next.set(key, val)
        }
        return next
      })
    },
    [setSearchParams],
  )

  return {
    date,
    dateTo,
    month,
    godownId,
    site,
    customerName,
    billerUserId,
    productId,
    metric,
    tab,
    godowns,
    sites,
    customers,
    billers,
    products,
    queryString,
    filterQuery,
    dateQuery,
    setFilters,
    lockGodownFilter: Boolean(lockedGodownId),
  }
}