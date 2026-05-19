import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { getToken } from '../auth/store'
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

  const date = searchParams.get('date') || todayKey()
  const month = searchParams.get('month') || currentMonthKey()
  const godownId = searchParams.get('godownId') || ''
  const site = searchParams.get('site') || ''
  const tab = searchParams.get('tab') || 'daily'

  const [godowns, setGodowns] = useState<GodownRow[]>([])
  const [sites, setSites] = useState<string[]>([])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    apiFetch<GodownRow[]>('/godowns', { token }).then(setGodowns).catch(() => {})
    apiFetch<string[]>('/reports/sites', { token }).then(setSites).catch(() => [])
  }, [])

  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    if (date) p.set('date', date)
    if (godownId) p.set('godownId', godownId)
    if (site) p.set('site', site)
    return p.toString()
  }, [date, godownId, site])

  const filterQuery = useMemo(() => {
    const p = new URLSearchParams()
    if (godownId) p.set('godownId', godownId)
    if (site) p.set('site', site)
    const s = p.toString()
    return s ? `&${s}` : ''
  }, [godownId, site])

  const setFilters = useCallback(
    (patch: Partial<{ date: string; month: string; godownId: string; site: string; tab: string }>) => {
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
    month,
    godownId,
    site,
    tab,
    godowns,
    sites,
    queryString,
    filterQuery,
    setFilters,
  }
}
