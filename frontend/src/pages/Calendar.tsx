// import { useEffect, useMemo, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { MonthCalendar } from '../components/calendar/MonthCalendar'
// import { ReportFiltersBar } from '../components/reports/ReportFiltersBar'
// import { Button } from '../components/ui/Button'
// import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
// import { PageHeader } from '../components/ui/PageHeader'
// import { apiFetch } from '../lib/api'
// import { getToken } from '../auth/store'
// import { useReportFilters } from '../hooks/useReportFilters'
// import type { CalendarResponse } from '../types/reports'

// function shiftMonth(month: string, delta: number) {
//   const [y, m] = month.split('-').map(Number)
//   const d = new Date(y, (m || 1) - 1 + delta, 1)
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
// }

// export function CalendarPage() {
//   const navigate = useNavigate()
//   const { month, godownId, site, godowns, sites, filterQuery, setFilters } = useReportFilters()
//   const [data, setData] = useState<CalendarResponse | null>(null)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [selectedDate, setSelectedDate] = useState<string | undefined>()

//   useEffect(() => {
//     const token = getToken()
//     if (!token) return
//     setLoading(true)
//     setError(null)
//     apiFetch<CalendarResponse>(`/reports/calendar?month=${encodeURIComponent(month)}${filterQuery}`, { token })
//       .then(setData)
//       .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load calendar'))
//       .finally(() => setLoading(false))
//   }, [month, filterQuery])

//   const monthTotal = useMemo(() => data?.days.reduce((n, d) => n + d.total, 0) ?? 0, [data])

//   const openReports = (date: string) => {
//     const params = new URLSearchParams({ date, tab: 'daily' })
//     if (godownId) params.set('godownId', godownId)
//     if (site) params.set('site', site)
//     navigate(`/reports?${params.toString()}`)
//   }

//   return (
//     <div>
//       <PageHeader
//         title="Calendar"
//         subtitle="Deliveries scheduled by date. Filter by godown or customer site."
//         right={
//           <div className="flex items-center gap-2">
//             <Button size="sm" variant="secondary" onClick={() => setFilters({ month: shiftMonth(month, -1) })}>
//               Prev
//             </Button>
//             <Button size="sm" variant="secondary" onClick={() => setFilters({ month: shiftMonth(month, 1) })}>
//               Next
//             </Button>
//           </div>
//         }
//       />

//       <Card className="mb-4">
//         <CardContent className="pt-6">
//           <ReportFiltersBar
//             godowns={godowns}
//             sites={sites}
//             godownId={godownId}
//             site={site}
//             onGodownChange={(id) => setFilters({ godownId: id })}
//             onSiteChange={(s) => setFilters({ site: s })}
//           />
//         </CardContent>
//       </Card>

//       {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

//       <Card>
//         <CardHeader className="flex items-center justify-between">
//           <CardTitle>{month}</CardTitle>
//           <div className="text-xs text-slate-500">
//             {loading ? 'Loading...' : `${monthTotal} deliveries this month`}
//           </div>
//         </CardHeader>
//         <CardContent>
//           <MonthCalendar
//             month={month}
//             days={data?.days ?? []}
//             selectedDate={selectedDate}
//             onSelectDate={(date) => {
//               setSelectedDate(date)
//               openReports(date)
//             }}
//           />
//           <p className="mt-4 text-xs text-slate-500">Click a day to open that date in Reports.</p>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

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

  const {
    month,
    godownId,
    site,
    godowns,
    sites,
    filterQuery,
    setFilters,
    lockGodownFilter,
  } = useReportFilters()

  const [data, setData] = useState<CalendarResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | undefined>()

  useEffect(() => {
    const token = getToken()

    if (!token) return

    setLoading(true)
    setError(null)

    apiFetch<CalendarResponse>(
      `/reports/calendar?month=${encodeURIComponent(month)}${filterQuery}`,
      { token },
    )
      .then(setData)
      .catch((e: unknown) =>
        setError(
          e instanceof Error
            ? e.message
            : 'Failed to load calendar',
        ),
      )
      .finally(() => setLoading(false))
  }, [month, filterQuery])

  const monthTotal = useMemo(
    () =>
      data?.days.reduce((n, d) => n + d.total, 0) ?? 0,
    [data],
  )

  const openReports = (date: string) => {
    const params = new URLSearchParams({
      date,
      tab: 'daily',
    })

    if (godownId) params.set('godownId', godownId)
    if (site) params.set('site', site)

    navigate(`/reports?${params.toString()}`)
  }

  const currentMonthLabel = useMemo(() => {
    const [year, monthNum] = month.split('-').map(Number)

    return new Date(year, monthNum - 1).toLocaleString(
      'en-US',
      {
        month: 'long',
        year: 'numeric',
      },
    )
  }, [month])

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageHeader
        title="Calendar"
        subtitle="Track and manage scheduled deliveries across all godowns and customer locations."
        right={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-11 rounded-2xl border-slate-200 px-5 shadow-sm hover:border-violet-200 hover:bg-violet-50"
              onClick={() =>
                setFilters({
                  month: shiftMonth(month, -1),
                })
              }
            >
              Prev
            </Button>

            <Button
              size="sm"
              className="h-11 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 text-white shadow-lg shadow-violet-300/40 hover:opacity-95"
              onClick={() =>
                setFilters({
                  month: shiftMonth(month, 1),
                })
              }
            >
              Next
            </Button>
          </div>
        }
      />

      {/* FILTERS */}
      <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40">
        <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50/70 via-white to-white px-6 py-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-slate-900">
              Filters
            </h2>

            <p className="text-sm text-slate-500">
              Filter deliveries by warehouse and site.
            </p>
          </div>
        </div>

        <CardContent className="p-6">
          <ReportFiltersBar
            godowns={godowns}
            sites={sites}
            godownId={godownId}
            site={site}
            onGodownChange={(id) =>
              setFilters({ godownId: id })
            }
            onSiteChange={(s) =>
              setFilters({ site: s })
            }
            hideGodownFilter={lockGodownFilter}
          />
        </CardContent>
      </Card>

      {/* ERROR */}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
          {error}
        </div>
      ) : null}

      {/* CALENDAR CARD */}
      <Card className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/50">
        {/* TOP SECTION */}
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-white px-6 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            {/* LEFT */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-300/40">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                    {currentMonthLabel}
                  </CardTitle>

                  <p className="text-sm text-slate-500">
                    Delivery activity overview
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT STATS */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-violet-100 bg-violet-50 px-5 py-3 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-violet-500">
                  Total Deliveries
                </div>

                <div className="mt-1 text-2xl font-bold text-violet-700">
                  {loading ? '...' : monthTotal}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Active Month
                </div>

                <div className="mt-1 text-lg font-bold text-slate-800">
                  {month}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* CALENDAR */}
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-hidden rounded-[28px] border border-slate-100 bg-gradient-to-b from-slate-50/40 to-white p-2 sm:p-4">
            <MonthCalendar
              month={month}
              days={data?.days ?? []}
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date)
                openReports(date)
              }}
            />
          </div>

          {/* FOOTER INFO */}
          <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-violet-500" />

              <span>
                Click any date to open detailed reports.
              </span>
            </div>

            <div className="font-medium text-slate-500">
              Live delivery scheduling overview
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}