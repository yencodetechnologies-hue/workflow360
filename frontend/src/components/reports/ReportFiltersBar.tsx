import type { GodownRow } from '../../pages/Godowns/List'
import { Input } from '../ui/Input'

type Props = {
  godowns: GodownRow[]
  sites: string[]
  godownId: string
  site: string
  onGodownChange: (id: string) => void
  onSiteChange: (site: string) => void
  showDate?: boolean
  date?: string
  onDateChange?: (date: string) => void
  hideGodownFilter?: boolean
}

export function ReportFiltersBar({
  godowns,
  sites,
  godownId,
  site,
  onGodownChange,
  onSiteChange,
  showDate,
  date,
  onDateChange,
  hideGodownFilter,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      {showDate && date && onDateChange ? (
        <div className="w-44">
          <Input type="date" label="Date" value={date} onChange={(e) => onDateChange(e.target.value)} />
        </div>
      ) : null}
      {!hideGodownFilter ? (
      <div className="w-48">
        <label className="mb-1 block text-sm font-medium text-slate-800">Godown</label>
        <select
          value={godownId}
          onChange={(e) => onGodownChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <option value="">All godowns</option>
          {godowns.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      ) : null}
      <div className="min-w-[12rem] flex-1">
        <Input
          label="Site"
          value={site}
          onChange={(e) => onSiteChange(e.target.value)}
          placeholder="Filter by site name..."
          list="report-sites-list"
        />
        <datalist id="report-sites-list">
          {sites.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
    </div>
  )
}

