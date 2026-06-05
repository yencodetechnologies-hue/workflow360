import type { GodownRow } from '../../pages/Godowns/List'
import { Input } from '../ui/Input'

type Props = {
  godowns: GodownRow[]
  sites: string[]
  customers?: string[]
  godownId: string
  site: string
  customerName?: string
  onGodownChange: (id: string) => void
  onSiteChange: (site: string) => void
  onCustomerChange?: (name: string) => void
  showDate?: boolean
  showDateTo?: boolean
  date?: string
  dateTo?: string
  onDateChange?: (date: string) => void
  onDateToChange?: (date: string) => void
  showCustomer?: boolean
  hideGodownFilter?: boolean
}

export function ReportFiltersBar({
  godowns,
  
  customers = [],
  godownId,

  customerName = '',
  onGodownChange,
  
  onCustomerChange,
  showDate,
  showDateTo,
  date,
  dateTo,
  onDateChange,
  onDateToChange,
  showCustomer,
  hideGodownFilter,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      {showDate && date && onDateChange ? (
        <div className="w-44">
          <Input type="date" label={showDateTo ? 'From date' : 'Date'} value={date} onChange={(e) => onDateChange(e.target.value)} />
        </div>
      ) : null}
      {showDateTo && onDateToChange ? (
        <div className="w-44">
          <Input type="date" label="To date" value={dateTo || ''} onChange={(e) => onDateToChange(e.target.value)} />
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
 
      {showCustomer && onCustomerChange ? (
        <div className="min-w-[12rem] flex-1">
          <label className="mb-1 block text-sm font-medium text-slate-800">Customer</label>
          <input
            value={customerName}
            onChange={(e) => onCustomerChange(e.target.value)}
            placeholder="Select or type customer..."
            list="report-customers-list"
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <datalist id="report-customers-list">
            {customers.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      ) : null}
    </div>
  )
}
