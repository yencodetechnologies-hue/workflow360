import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MonthCalendar } from '../components/calendar/MonthCalendar'
import { ReportFiltersBar } from '../components/reports/ReportFiltersBar'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { apiFetch } from '../lib/api'
import { getToken } from '../auth/store'
import { useReportFilters } from '../hooks/useReportFilters'
import type { CalendarResponse } from '../types/reports'

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, (m || 1) - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function CalendarPage() {
  const navigate = useNavigate()
  const { month, godownId, site, godowns, sites, filterQuery, setFilters } = useReportFilters()
  const [data, setData] = useState<CalendarResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | undefined>()

  useEffect(() => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    setError(null)
    apiFetch<CalendarResponse>(`/reports/calendar?month=${encodeURIComponent(month)}${filterQuery}`, { token })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load calendar'))
      .finally(() => setLoading(false))
  }, [month, filterQuery])

  const monthTotal = useMemo(() => data?.days.reduce((n, d) => n + d.total, 0) ?? 0, [data])

  const openReports = (date: string) => {
    const params = new URLSearchParams({ date, tab: 'daily' })
    if (godownId) params.set('godownId', godownId)
    if (site) params.set('site', site)
    navigate(`/reports?${params.toString()}`)
  }

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Deliveries scheduled by date. Filter by godown or customer site."
        right={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setFilters({ month: shiftMonth(month, -1) })}>
              Prev
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setFilters({ month: shiftMonth(month, 1) })}>
              Next
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="pt-6">
          <ReportFiltersBar
            godowns={godowns}
            sites={sites}
            godownId={godownId}
            site={site}
            onGodownChange={(id) => setFilters({ godownId: id })}
            onSiteChange={(s) => setFilters({ site: s })}
          />
        </CardContent>
      </Card>

      {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{month}</CardTitle>
          <div className="text-xs text-slate-500">
            {loading ? 'Loading...' : `${monthTotal} deliveries this month`}
          </div>
        </CardHeader>
        <CardContent>
          <MonthCalendar
            month={month}
            days={data?.days ?? []}
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date)
              openReports(date)
            }}
          />
          <p className="mt-4 text-xs text-slate-500">Click a day to open that date in Reports.</p>
        </CardContent>
      </Card>
    </div>
  )
}

