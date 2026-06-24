import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { getToken } from '../auth/store'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { deliveryBadgeVariant, deliveryStatusLabel } from '../lib/deliveryStatus'
import { formatDateTime } from '../lib/format'
import { useReportFilters } from '../hooks/useReportFilters'

// ── Types ──────────────────────────────────────────────────────────────────

type PartialReturnLine = {
  productId: string
  productName: string
  qty: number
  dispatchedQty: number
  returnedQty: number
  pendingQty: number
}

type PartialReturnDelivery = {
  _id: string
  deliveryNo: string
  customerName: string
  siteName?: string
  siteAddress?: string
  contactPhone?: string
  returnExpectedAt: string
  reDeliveryDate?: string
  reDeliveryNote?: string
  status: string
  lines: PartialReturnLine[]
  totalQty: number
  returnedQty: number
  pendingQty: number
}

type PartialCalendarDay = {
  date: string
  partialCount: number
}

type PartialCalendarResponse = {
  days: PartialCalendarDay[]
  totalPartial: number
}

// ── Helpers ────────────────────────────────────────────────────────────────

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, (m || 1) - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatSelectedDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ── Schedule Re-Delivery Modal ─────────────────────────────────────────────
// Uses the project's existing Modal component with footer prop so the
// submit button is ALWAYS visible even when the item list is long.

function ScheduleReDeliveryModal({
  delivery,
  onClose,
  onSaved,
}: {
  delivery: PartialReturnDelivery
  onClose: () => void
  onSaved: () => void
}) {
  const [date, setDate] = useState<string>(
    delivery.reDeliveryDate ? delivery.reDeliveryDate.slice(0, 10) : '',
  )
  const [note, setNote] = useState<string>(delivery.reDeliveryNote ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lines that are still with the customer (sent > returned)
  const pendingLines = delivery.lines.filter((l) => l.pendingQty > 0)
  const totalPending = delivery.pendingQty

  async function handleSave() {
    if (!date) { setError('Please select a re-delivery date.'); return }
    setSaving(true)
    setError(null)
    try {
      const token = getToken()
      await apiFetch<void>(`/deliveries/${delivery._id}/re-delivery`, {
        token,
        method: 'PATCH',
        body: JSON.stringify({ reDeliveryDate: date, note }),
      })
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Footer is always visible — pinned below scrollable content
  const footer = (
    <div className="space-y-3">
      {/* Date picker */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          New delivery date *
        </label>
        <input
          type="date"
          value={date}
          min={todayKey()}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Note */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Note (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Client requested morning slot, call before arriving"
          rows={2}
          className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => void handleSave()}
          disabled={saving || !date}
          className="flex-1"
        >
          {saving ? 'Saving…' : 'Schedule Re-Delivery'}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )

  return (
    <Modal
      open
      title={`Re-Delivery — ${delivery.deliveryNo} · ${delivery.customerName}`}
      onClose={onClose}
      footer={footer}
    >
      {/* Scrollable content: items still with customer */}
      <div className="space-y-3">
        {/* Summary banner */}
        <div className="rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
            Items still outstanding
          </p>
          <p className="mt-0.5 text-sm text-amber-700">
            These items were sent but not yet returned by the client.
          </p>
        </div>

        {/* Per-product breakdown */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          {/* Header */}
          <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">
            <span className="col-span-2">Product</span>
            <span className="text-right">Returned</span>
            <span className="text-right text-amber-700">Still with client</span>
          </div>
          {/* Rows */}
          {pendingLines.map((line) => (
            <div
              key={line.productId}
              className="grid grid-cols-4 items-center border-b border-slate-100 px-4 py-2.5 last:border-0"
            >
              <span className="col-span-2 text-sm font-medium text-slate-800">
                {line.productName}
              </span>
              <span className="text-right text-sm text-emerald-700 font-semibold">
                {line.returnedQty} / {line.dispatchedQty}
              </span>
              <span className="text-right text-sm font-bold text-amber-700">
                {line.pendingQty}
              </span>
            </div>
          ))}
          {/* Total */}
          <div className="grid grid-cols-4 items-center bg-amber-50 px-4 py-2.5">
            <span className="col-span-2 text-sm font-bold text-amber-900">Total pending</span>
            <span className="text-right" />
            <span className="text-right text-sm font-bold text-amber-900">{totalPending} items</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ── Partial Return Row ─────────────────────────────────────────────────────

function PartialReturnRow({
  delivery,
  onSchedule,
}: {
  delivery: PartialReturnDelivery
  onSchedule: (d: PartialReturnDelivery) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const returnPct = delivery.totalQty > 0
    ? Math.round((delivery.returnedQty / delivery.totalQty) * 100)
    : 0

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Header row — click to expand */}
      <div
        className="flex cursor-pointer select-none items-center gap-3 px-4 py-3"
        onClick={() => setExpanded((o) => !o)}
      >
        {/* Status badge */}
        <Badge variant={deliveryBadgeVariant(delivery.status)}>
          {deliveryStatusLabel(delivery.status)}
        </Badge>

        {/* Customer + delivery info */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-slate-900">{delivery.customerName}</div>
          <div className="text-xs text-slate-500">
            {delivery.deliveryNo}
            {delivery.siteName ? ` · ${delivery.siteName}` : ''}
          </div>
        </div>

        {/* Returned / dispatched */}
        <div className="shrink-0 text-right">
          <div className="text-xs text-slate-400">Returned</div>
          <div className={`text-sm font-bold ${returnPct === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {delivery.returnedQty} / {delivery.totalQty}
          </div>
        </div>

        {/* Pending badge */}
        {delivery.pendingQty > 0 && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
            {delivery.pendingQty} pending
          </span>
        )}

        {/* Re-delivery scheduled indicator */}
        {delivery.reDeliveryDate && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
            ✓ Rescheduled
          </span>
        )}

        {/* Chevron */}
        <svg
          viewBox="0 0 24 24" fill="none" width="16" height="16"
          stroke="#94a3b8" strokeWidth="2.5"
          style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-slate-100">
        <div
          className={`h-full transition-all duration-500 ${returnPct === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
          style={{ width: `${returnPct}%` }}
        />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 space-y-4">

          {/* Original return date */}
          <p className="text-xs text-slate-500">
            <span className="font-semibold">Original return date:</span>{' '}
            {formatDateTime(delivery.returnExpectedAt)}
          </p>

          {/* Product table */}
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            {/* Table header */}
            <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
              <span className="col-span-2">Product</span>
              <span className="text-right">Sent → Returned</span>
              <span className="text-right text-amber-600">Still with client</span>
            </div>
            {delivery.lines.map((line) => (
              <div
                key={line.productId}
                className={`grid grid-cols-4 items-center border-b border-slate-100 px-3 py-2 last:border-0 ${line.pendingQty > 0 ? 'bg-amber-50/40' : ''}`}
              >
                <span className="col-span-2 text-sm text-slate-800 font-medium truncate pr-2">
                  {line.productName}
                </span>
                <span className="text-right text-xs text-slate-600">
                  {line.dispatchedQty} → {line.returnedQty}
                </span>
                <span className={`text-right text-sm font-bold ${line.pendingQty > 0 ? 'text-amber-700' : 'text-emerald-600'}`}>
                  {line.pendingQty > 0 ? line.pendingQty : '✓'}
                </span>
              </div>
            ))}
          </div>

          {/* Re-delivery section */}
          {delivery.reDeliveryDate ? (
            <div className="flex items-start justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
              <div>
                <p className="text-xs font-bold text-emerald-800">Re-delivery scheduled</p>
                <p className="mt-0.5 text-sm font-semibold text-emerald-900">
                  {formatSelectedDate(delivery.reDeliveryDate.slice(0, 10))}
                </p>
                {delivery.reDeliveryNote && (
                  <p className="mt-1 text-xs text-emerald-700">{delivery.reDeliveryNote}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => { e.stopPropagation(); onSchedule(delivery) }}
              >
                Reschedule
              </Button>
            </div>
          ) : delivery.pendingQty > 0 ? (
            <Button
              onClick={(e) => { e.stopPropagation(); onSchedule(delivery) }}
              className="w-full"
            >
              Schedule re-delivery for {delivery.pendingQty} pending items →
            </Button>
          ) : (
            <p className="text-sm font-semibold text-emerald-700">
              ✓ All items returned — no re-delivery needed
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Calendar grid helper ───────────────────────────────────────────────────

function buildCalDays(month: string) {
  const [y, mn] = month.split('-').map(Number)
  const days: { date: string; dayOfWeek: number }[] = []
  const lastDay = new Date(y, mn, 0).getDate()
  for (let d = 1; d <= lastDay; d++) {
    const date = `${y}-${String(mn).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({ date, dayOfWeek: new Date(y, mn - 1, d).getDay() })
  }
  return days
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function ReturnDeliveryCalendarPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const { month, godownId, filterQuery, setFilters, godowns, lockGodownFilter } = useReportFilters()

  // ── Calendar data ──────────────────────────────────────────────────────
  const [calData, setCalData] = useState<PartialCalendarResponse | null>(null)
  const [calLoading, setCalLoading] = useState(false)

  // ── All partial returns for the month (default list) ───────────────────
  const [allData, setAllData] = useState<PartialReturnDelivery[] | null>(null)
  const [allLoading, setAllLoading] = useState(false)
  const [allError, setAllError] = useState<string | null>(null)

  // ── Selected date filtered list ────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string | null>(searchParams.get('date'))
  const [dailyData, setDailyData] = useState<PartialReturnDelivery[] | null>(null)
  const [dailyLoading, setDailyLoading] = useState(false)
  const [dailyError, setDailyError] = useState<string | null>(null)

  // ── Modal ──────────────────────────────────────────────────────────────
  const [scheduleTarget, setScheduleTarget] = useState<PartialReturnDelivery | null>(null)

  // ── Load month calendar dots ───────────────────────────────────────────
  useEffect(() => {
    const token = getToken()
    if (!token) return
    setCalLoading(true)
    apiFetch<PartialCalendarResponse>(
      `/deliveries/partial-returns/calendar?month=${encodeURIComponent(month)}${filterQuery}`,
      { token },
    )
      .then(setCalData)
      .catch(() => {})
      .finally(() => setCalLoading(false))
  }, [month, filterQuery])

  // ── Load ALL partial returns for this month (default view) ─────────────
  useEffect(() => {
    const token = getToken()
    if (!token) return
    setAllLoading(true)
    setAllError(null)
    apiFetch<PartialReturnDelivery[]>(
      `/deliveries/partial-returns/all?month=${encodeURIComponent(month)}${filterQuery}`,
      { token },
    )
      .then(setAllData)
      .catch((e: unknown) => setAllError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setAllLoading(false))
  }, [month, filterQuery])

  // ── Load filtered list when date is selected ───────────────────────────
  useEffect(() => {
    if (!selectedDate) { setDailyData(null); return }
    const token = getToken()
    if (!token) return
    setDailyLoading(true)
    setDailyError(null)
    apiFetch<PartialReturnDelivery[]>(
      `/deliveries/partial-returns/daily?date=${encodeURIComponent(selectedDate)}${filterQuery}`,
      { token },
    )
      .then(setDailyData)
      .catch((e: unknown) => setDailyError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setDailyLoading(false))
  }, [selectedDate, filterQuery])

  // ── Reload active list after scheduling ───────────────────────────────
  function reloadActiveList() {
    const token = getToken()
    if (!token) return
    if (selectedDate) {
      setDailyLoading(true)
      apiFetch<PartialReturnDelivery[]>(
        `/deliveries/partial-returns/daily?date=${encodeURIComponent(selectedDate)}${filterQuery}`,
        { token },
      )
        .then(setDailyData)
        .finally(() => setDailyLoading(false))
    } else {
      setAllLoading(true)
      apiFetch<PartialReturnDelivery[]>(
        `/deliveries/partial-returns/all?month=${encodeURIComponent(month)}${filterQuery}`,
        { token },
      )
        .then(setAllData)
        .finally(() => setAllLoading(false))
    }
  }

  // ── Calendar grid ──────────────────────────────────────────────────────
  const calDays = useMemo(() => buildCalDays(month), [month])
  const dotMap = useMemo(() => {
    const m: Record<string, number> = {}
    calData?.days.forEach((d) => { m[d.date] = d.partialCount })
    return m
  }, [calData])

  const currentMonthLabel = useMemo(() => {
    const [y, mn] = month.split('-').map(Number)
    return new Date(y, mn - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
  }, [month])

  const today = todayKey()
  const firstDow = calDays[0]?.dayOfWeek ?? 0
  const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  // Active list = daily (if date selected) or all-month
  const activeList = selectedDate ? dailyData : allData
  const activeLoading = selectedDate ? dailyLoading : allLoading
  const activeError = selectedDate ? dailyError : allError

  const pendingCount = useMemo(
    () => (activeList ?? []).filter((d) => d.pendingQty > 0 && !d.reDeliveryDate).length,
    [activeList],
  )
  const scheduledCount = useMemo(
    () => (activeList ?? []).filter((d) => d.reDeliveryDate).length,
    [activeList],
  )

  function selectDate(date: string) {
    if (selectedDate === date) {
      // clicking same date again clears the filter
      setSelectedDate(null)
      const next = new URLSearchParams(searchParams)
      next.delete('date')
      setSearchParams(next)
    } else {
      setSelectedDate(date)
      const next = new URLSearchParams(searchParams)
      next.set('date', date)
      setSearchParams(next)
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 font-[inherit]">

      {/* ── Page header ── */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
          <button
            type="button"
            onClick={() => navigate('/calendar')}
            className="hover:text-slate-700"
          >
            Calendar
          </button>
          <span>›</span>
          <span className="font-medium text-slate-800">Return Calendar</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 14l-4-4 4-4" />
                <path d="M5 10h11a4 4 0 0 1 0 8h-1" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Return Calendar</h1>
              <p className="mt-1 text-sm text-slate-500">
                Track partial returns · Schedule re-deliveries for outstanding items
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-center">
            <div className="text-xl font-extrabold text-amber-700">
              {calLoading ? '…' : (calData?.totalPartial ?? 0)}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-amber-800">
              Pending returns this month
            </div>
          </div>
        </div>
      </div>

      {/* ── Godown filter ── */}
      {!lockGodownFilter && godowns.length > 1 && (
        <div className="mb-5 flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600">Godown:</label>
          <select
            value={godownId}
            onChange={(e) => setFilters({ godownId: e.target.value || undefined })}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
          >
            <option value="">All godowns</option>
            {godowns.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[380px_1fr] lg:items-start">

        {/* ── Calendar card ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Card header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600">
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Return Calendar</p>
                <p className="text-xs text-slate-400">Partial return overview</p>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 px-3 py-1 ring-1 ring-amber-200">
              <span className="text-base font-extrabold text-amber-700">
                {calLoading ? '…' : (calData?.totalPartial ?? 0)}
              </span>
              <span className="ml-1 text-[10px] font-semibold text-amber-600">this month</span>
            </div>
          </div>

          {/* Month nav */}
          <div className="flex items-center justify-center gap-4 px-5 py-3">
            <button
              type="button"
              onClick={() => setFilters({ month: shiftMonth(month, -1) })}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <span className="min-w-[120px] text-center text-sm font-semibold text-slate-700">
              {currentMonthLabel}
            </span>
            <button
              type="button"
              onClick={() => setFilters({ month: shiftMonth(month, 1) })}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>

          {/* Calendar grid */}
          <div className="px-3 pb-4">
            {/* Day headers */}
            <div className="mb-1 grid grid-cols-7">
              {DAYS.map((d, i) => (
                <div key={i} className="py-1.5 text-center text-[11px] font-bold text-slate-400">{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDow }).map((_, i) => <div key={`pad-${i}`} />)}
              {calDays.map(({ date }) => {
                const count = dotMap[date] ?? 0
                const isSelected = date === selectedDate
                const isToday = date === today
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => selectDate(date)}
                    className={[
                      'flex flex-col items-center justify-center rounded-lg py-1.5 transition-all text-xs',
                      isSelected
                        ? 'bg-amber-500 text-white font-bold'
                        : count > 0
                          ? 'bg-amber-50 text-slate-800 hover:bg-amber-100'
                          : 'text-slate-600 hover:bg-slate-50',
                      isToday && !isSelected ? 'ring-2 ring-amber-400 ring-offset-1' : '',
                    ].join(' ')}
                  >
                    <span className={isSelected || isToday ? 'font-bold' : ''}>
                      {parseInt(date.slice(8), 10)}
                    </span>
                    {count > 0 && (
                      <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-amber-600'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-400">
            🟡 Tap a date to filter · numbers show count per day · tap again to clear
          </div>
        </div>

        {/* ── List panel ── */}
        <div className="flex flex-col gap-4">

          {/* List header */}
          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-bold text-amber-900">
                  {selectedDate
                    ? `Pending Returns — ${formatSelectedDate(selectedDate)}`
                    : `All Pending Returns — ${currentMonthLabel}`}
                </p>
                <p className="mt-0.5 text-xs text-amber-700">
                  {selectedDate
                    ? 'Deliveries with outstanding items on this date · tap date again to show all'
                    : 'All deliveries with items still with the client this month'}
                </p>
              </div>
              <div className="flex gap-2">
                {pendingCount > 0 && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                    {pendingCount} unscheduled
                  </span>
                )}
                {scheduledCount > 0 && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                    {scheduledCount} scheduled
                  </span>
                )}
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => selectDate(selectedDate)}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    Clear filter ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Loading */}
          {activeLoading && (
            <div className="py-12 text-center text-sm text-slate-400">Loading…</div>
          )}

          {/* Error */}
          {activeError && (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
              {activeError}
            </div>
          )}

          {/* Empty state */}
          {!activeLoading && !activeError && activeList && activeList.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
              <div className="mb-3 text-4xl">📦</div>
              <p className="font-semibold text-slate-700">
                {selectedDate
                  ? 'No partial returns on this date'
                  : 'No partial returns this month'}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {selectedDate
                  ? 'All items for this date were fully returned.'
                  : 'All deliveries this month were fully returned.'}
              </p>
            </div>
          )}

          {/* List */}
          {!activeLoading && !activeError && activeList && activeList.length > 0 && (
            <div className="flex flex-col gap-3">
              {activeList.map((delivery) => (
                <PartialReturnRow
                  key={delivery._id}
                  delivery={delivery}
                  onSchedule={setScheduleTarget}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Schedule Re-Delivery Modal ── */}
      {scheduleTarget && (
        <ScheduleReDeliveryModal
          delivery={scheduleTarget}
          onClose={() => setScheduleTarget(null)}
          onSaved={() => {
            setScheduleTarget(null)
            reloadActiveList()
          }}
        />
      )}
    </div>
  )
}