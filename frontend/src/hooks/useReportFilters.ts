import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { getToken, readState } from '../auth/store'
import type { GodownRow } from '../pages/Godowns/List'

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
  const tab = searchParams.get('tab') || 'daily'

  const [godowns, setGodowns] = useState<GodownRow[]>([])
  const [sites, setSites] = useState<string[]>([])
  const [customers, setCustomers] = useState<string[]>([])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    apiFetch<GodownRow[]>('/godowns', { token }).then(setGodowns).catch(() => {})
    apiFetch<string[]>('/reports/sites', { token }).then(setSites).catch(() => [])
    apiFetch<string[]>('/reports/customers', { token }).then(setCustomers).catch(() => [])
  }, [])

  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    if (date) p.set('date', date)
    if (dateTo) p.set('dateTo', dateTo)
    if (godownId) p.set('godownId', godownId)
    if (site) p.set('site', site)
    if (customerName) p.set('customerName', customerName)
    return p.toString()
  }, [date, dateTo, godownId, site, customerName])

  const filterQuery = useMemo(() => {
    const p = new URLSearchParams()
    if (godownId) p.set('godownId', godownId)
    if (site) p.set('site', site)
    if (customerName) p.set('customerName', customerName)
    const s = p.toString()
    return s ? `&${s}` : ''
  }, [godownId, site, customerName])

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
    tab,
    godowns,
    sites,
    customers,
    queryString,
    filterQuery,
    dateQuery,
    setFilters,
    lockGodownFilter: Boolean(lockedGodownId),
  }
}
