// import type { GodownRow } from '../../pages/Godowns/List'
// import { Input } from '../ui/Input'

// type Props = {
//   godowns: GodownRow[]
//   sites: string[]
//   customers?: string[]
//   godownId: string
//   site: string
//   customerName?: string
//   onGodownChange: (id: string) => void
//   onSiteChange: (site: string) => void
//   onCustomerChange?: (name: string) => void
//   showDate?: boolean
//   showDateTo?: boolean
//   date?: string
//   dateTo?: string
//   onDateChange?: (date: string) => void
//   onDateToChange?: (date: string) => void
//   showCustomer?: boolean
//   hideGodownFilter?: boolean
// }

// export function ReportFiltersBar({
//   godowns,
  
//   customers = [],
//   godownId,

//   customerName = '',
//   onGodownChange,
  
//   onCustomerChange,
//   showDate,
//   showDateTo,
//   date,
//   dateTo,
//   onDateChange,
//   onDateToChange,
//   showCustomer,
//   hideGodownFilter,
// }: Props) {
//   return (
//     <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
//       {showDate && date && onDateChange ? (
//         <div className="w-44">
//           <Input type="date" label={showDateTo ? 'From date' : 'Date'} value={date} onChange={(e) => onDateChange(e.target.value)} />
//         </div>
//       ) : null}
//       {showDateTo && onDateToChange ? (
//         <div className="w-44">
//           <Input type="date" label="To date" value={dateTo || ''} onChange={(e) => onDateToChange(e.target.value)} />
//         </div>
//       ) : null}
//       {!hideGodownFilter ? (
//         <div className="w-48">
//           <label className="mb-1 block text-sm font-medium text-slate-800">Godown</label>
//           <select
//             value={godownId}
//             onChange={(e) => onGodownChange(e.target.value)}
//             className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
//           >
//             <option value="">All godowns</option>
//             {godowns.map((g) => (
//               <option key={g.id} value={g.id}>
//                 {g.name}
//               </option>
//             ))}
//           </select>
//         </div>
//       ) : null}
 
//       {showCustomer && onCustomerChange ? (
//         <div className="min-w-[12rem] flex-1">
//           <label className="mb-1 block text-sm font-medium text-slate-800">Customer</label>
//           <input
//             value={customerName}
//             onChange={(e) => onCustomerChange(e.target.value)}
//             placeholder="Select or type customer..."
//             list="report-customers-list"
//             className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
//           />
//           <datalist id="report-customers-list">
//             {customers.map((c) => (
//               <option key={c} value={c} />
//             ))}
//           </datalist>
//         </div>
//       ) : null}
//     </div>
//   )
// }

// import type { GodownRow } from '../../pages/Godowns/List'
// import { Input } from '../ui/Input'

// type Props = {
//   godowns: GodownRow[]
//   sites: string[]
//   customers?: string[]
//   godownId: string
//   site: string
//   customerName?: string
//   onGodownChange: (id: string) => void
//   onSiteChange: (site: string) => void
//   onCustomerChange?: (name: string) => void
//   showDate?: boolean
//   showDateTo?: boolean
//   date?: string
//   dateTo?: string
//   onDateChange?: (date: string) => void
//   onDateToChange?: (date: string) => void
//   showCustomer?: boolean
//   hideGodownFilter?: boolean
// }

// export function ReportFiltersBar({
//   godowns,
  
//   customers = [],
//   godownId,

//   customerName = '',
//   onGodownChange,
  
//   onCustomerChange,
//   showDate,
//   showDateTo,
//   date,
//   dateTo,
//   onDateChange,
//   onDateToChange,
//   showCustomer,
//   hideGodownFilter,
// }: Props) {
//   return (
//     <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
//       {showDate && date && onDateChange ? (
//         <div className="w-full sm:w-44">
//           <Input type="date" label={showDateTo ? 'From date' : 'Date'} value={date} onChange={(e) => onDateChange(e.target.value)} />
//         </div>
//       ) : null}
//       {showDateTo && onDateToChange ? (
//         <div className="w-full sm:w-44">
//           <Input type="date" label="To date" value={dateTo || ''} onChange={(e) => onDateToChange(e.target.value)} />
//         </div>
//       ) : null}
//       {!hideGodownFilter ? (
//         <div className="w-full sm:w-48">
//           <label className="mb-1 block text-sm font-medium text-slate-800">Godown</label>
//           <select
//             value={godownId}
//             onChange={(e) => onGodownChange(e.target.value)}
//             className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
//           >
//             <option value="">All godowns</option>
//             {godowns.map((g) => (
//               <option key={g.id} value={g.id}>
//                 {g.name}
//               </option>
//             ))}
//           </select>
//         </div>
//       ) : null}
 
//       {showCustomer && onCustomerChange ? (
//         <div className="w-full sm:min-w-[12rem] sm:flex-1">
//           <label className="mb-1 block text-sm font-medium text-slate-800">Customer</label>
//           <input
//             value={customerName}
//             onChange={(e) => onCustomerChange(e.target.value)}
//             placeholder="Select or type customer..."
//             list="report-customers-list"
//             className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
//           />
//           <datalist id="report-customers-list">
//             {customers.map((c) => (
//               <option key={c} value={c} />
//             ))}
//           </datalist>
//         </div>
//       ) : null}
//     </div>
//   )
// }

// import type { GodownRow } from '../../pages/Godowns/List'
// import { Input } from '../ui/Input'
// import type { BillerOption, ProductOption } from '../../hooks/useReportFilters'

// type Props = {
//   godowns: GodownRow[]
//   sites: string[]
//   customers?: string[]
//   billers?: BillerOption[]
//   products?: ProductOption[]
//   godownId: string
//   site: string
//   customerName?: string
//   billerUserId?: string
//   productId?: string
//   onGodownChange: (id: string) => void
//   onSiteChange: (site: string) => void
//   onCustomerChange?: (name: string) => void
//   onBillerChange?: (id: string) => void
//   onProductChange?: (id: string) => void
//   showDate?: boolean
//   showDateTo?: boolean
//   date?: string
//   dateTo?: string
//   onDateChange?: (date: string) => void
//   onDateToChange?: (date: string) => void
//   showCustomer?: boolean
//   showBiller?: boolean
//   showProduct?: boolean
//   hideGodownFilter?: boolean
// }

// const selectClass =
//   'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200'

// export function ReportFiltersBar({
//   godowns,
//   customers = [],
//   billers = [],
//   products = [],
//   godownId,
//   customerName = '',
//   billerUserId = '',
//   productId = '',
//   onGodownChange,
//   onCustomerChange,
//   onBillerChange,
//   onProductChange,
//   showDate,
//   showDateTo,
//   date,
//   dateTo,
//   onDateChange,
//   onDateToChange,
//   showCustomer,
//   showBiller,
//   showProduct,
//   hideGodownFilter,
// }: Props) {
//   return (
//     <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
//       {showDate && date && onDateChange ? (
//         <div className="w-full sm:w-44">
//           <Input type="date" label={showDateTo ? 'From date' : 'Date'} value={date} onChange={(e) => onDateChange(e.target.value)} />
//         </div>
//       ) : null}
//       {showDateTo && onDateToChange ? (
//         <div className="w-full sm:w-44">
//           <Input type="date" label="To date" value={dateTo || ''} onChange={(e) => onDateToChange(e.target.value)} />
//         </div>
//       ) : null}
//       {!hideGodownFilter ? (
//         <div className="w-full sm:w-48">
//           <label className="mb-1 block text-sm font-medium text-slate-800">Godown</label>
//           <select
//             value={godownId}
//             onChange={(e) => onGodownChange(e.target.value)}
//             className={selectClass}
//           >
//             <option value="">All godowns</option>
//             {(godowns ?? []).map((g) => (
//               <option key={g.id} value={g.id}>
//                 {g.name}
//               </option>
//             ))}
//           </select>
//         </div>
//       ) : null}

//       {onProductChange ? (
//         <div className="w-full sm:w-52">
//           <label className="mb-1 block text-sm font-medium text-slate-800">Product</label>
//           <select
//             value={productId}
//             onChange={(e) => onProductChange(e.target.value)}
//             className={selectClass}
//           >
//             <option value="">All products</option>
//             {(products ?? []).map((p) => (
//               <option key={p.id} value={p.id}>
//                 {p.name}{p.sku ? ` (${p.sku})` : ''}
//               </option>
//             ))}
//           </select>
//         </div>
//       ) : null}

//       {showCustomer && onCustomerChange ? (
//         <div className="w-full sm:min-w-[12rem] sm:flex-1">
//           <label className="mb-1 block text-sm font-medium text-slate-800">Customer</label>
//           <input
//             value={customerName}
//             onChange={(e) => onCustomerChange(e.target.value)}
//             placeholder="Select or type customer..."
//             list="report-customers-list"
//             className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
//           />
//           <datalist id="report-customers-list">
//             {(customers ?? []).map((c) => (
//               <option key={c} value={c} />
//             ))}
//           </datalist>
//         </div>
//       ) : null}
//     </div>
//   )
// } 
// import type { GodownRow } from '../../pages/Godowns/List'
// import { Input } from '../ui/Input'

// type Props = {
//   godowns: GodownRow[]
//   sites: string[]
//   customers?: string[]
//   godownId: string
//   site: string
//   customerName?: string
//   onGodownChange: (id: string) => void
//   onSiteChange: (site: string) => void
//   onCustomerChange?: (name: string) => void
//   showDate?: boolean
//   showDateTo?: boolean
//   date?: string
//   dateTo?: string
//   onDateChange?: (date: string) => void
//   onDateToChange?: (date: string) => void
//   showCustomer?: boolean
//   hideGodownFilter?: boolean
// }

// export function ReportFiltersBar({
//   godowns,
  
//   customers = [],
//   godownId,

//   customerName = '',
//   onGodownChange,
  
//   onCustomerChange,
//   showDate,
//   showDateTo,
//   date,
//   dateTo,
//   onDateChange,
//   onDateToChange,
//   showCustomer,
//   hideGodownFilter,
// }: Props) {
//   return (
//     <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
//       {showDate && date && onDateChange ? (
//         <div className="w-44">
//           <Input type="date" label={showDateTo ? 'From date' : 'Date'} value={date} onChange={(e) => onDateChange(e.target.value)} />
//         </div>
//       ) : null}
//       {showDateTo && onDateToChange ? (
//         <div className="w-44">
//           <Input type="date" label="To date" value={dateTo || ''} onChange={(e) => onDateToChange(e.target.value)} />
//         </div>
//       ) : null}
//       {!hideGodownFilter ? (
//         <div className="w-48">
//           <label className="mb-1 block text-sm font-medium text-slate-800">Godown</label>
//           <select
//             value={godownId}
//             onChange={(e) => onGodownChange(e.target.value)}
//             className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
//           >
//             <option value="">All godowns</option>
//             {godowns.map((g) => (
//               <option key={g.id} value={g.id}>
//                 {g.name}
//               </option>
//             ))}
//           </select>
//         </div>
//       ) : null}
 
//       {showCustomer && onCustomerChange ? (
//         <div className="min-w-[12rem] flex-1">
//           <label className="mb-1 block text-sm font-medium text-slate-800">Customer</label>
//           <input
//             value={customerName}
//             onChange={(e) => onCustomerChange(e.target.value)}
//             placeholder="Select or type customer..."
//             list="report-customers-list"
//             className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
//           />
//           <datalist id="report-customers-list">
//             {customers.map((c) => (
//               <option key={c} value={c} />
//             ))}
//           </datalist>
//         </div>
//       ) : null}
//     </div>
//   )
// }

// import type { GodownRow } from '../../pages/Godowns/List'
// import { Input } from '../ui/Input'

// type Props = {
//   godowns: GodownRow[]
//   sites: string[]
//   customers?: string[]
//   godownId: string
//   site: string
//   customerName?: string
//   onGodownChange: (id: string) => void
//   onSiteChange: (site: string) => void
//   onCustomerChange?: (name: string) => void
//   showDate?: boolean
//   showDateTo?: boolean
//   date?: string
//   dateTo?: string
//   onDateChange?: (date: string) => void
//   onDateToChange?: (date: string) => void
//   showCustomer?: boolean
//   hideGodownFilter?: boolean
// }

// export function ReportFiltersBar({
//   godowns,
  
//   customers = [],
//   godownId,

//   customerName = '',
//   onGodownChange,
  
//   onCustomerChange,
//   showDate,
//   showDateTo,
//   date,
//   dateTo,
//   onDateChange,
//   onDateToChange,
//   showCustomer,
//   hideGodownFilter,
// }: Props) {
//   return (
//     <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
//       {showDate && date && onDateChange ? (
//         <div className="w-full sm:w-44">
//           <Input type="date" label={showDateTo ? 'From date' : 'Date'} value={date} onChange={(e) => onDateChange(e.target.value)} />
//         </div>
//       ) : null}
//       {showDateTo && onDateToChange ? (
//         <div className="w-full sm:w-44">
//           <Input type="date" label="To date" value={dateTo || ''} onChange={(e) => onDateToChange(e.target.value)} />
//         </div>
//       ) : null}
//       {!hideGodownFilter ? (
//         <div className="w-full sm:w-48">
//           <label className="mb-1 block text-sm font-medium text-slate-800">Godown</label>
//           <select
//             value={godownId}
//             onChange={(e) => onGodownChange(e.target.value)}
//             className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
//           >
//             <option value="">All godowns</option>
//             {godowns.map((g) => (
//               <option key={g.id} value={g.id}>
//                 {g.name}
//               </option>
//             ))}
//           </select>
//         </div>
//       ) : null}
 
//       {showCustomer && onCustomerChange ? (
//         <div className="w-full sm:min-w-[12rem] sm:flex-1">
//           <label className="mb-1 block text-sm font-medium text-slate-800">Customer</label>
//           <input
//             value={customerName}
//             onChange={(e) => onCustomerChange(e.target.value)}
//             placeholder="Select or type customer..."
//             list="report-customers-list"
//             className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
//           />
//           <datalist id="report-customers-list">
//             {customers.map((c) => (
//               <option key={c} value={c} />
//             ))}
//           </datalist>
//         </div>
//       ) : null}
//     </div>
//   )
// }

// import type { GodownRow } from '../../pages/Godowns/List'
// import { Input } from '../ui/Input'
// import type { BillerOption, ProductOption } from '../../hooks/useReportFilters'

// type Props = {
//   godowns: GodownRow[]
//   sites: string[]
//   customers?: string[]
//   billers?: BillerOption[]
//   products?: ProductOption[]
//   godownId: string
//   site: string
//   customerName?: string
//   billerUserId?: string
//   productId?: string
//   onGodownChange: (id: string) => void
//   onSiteChange: (site: string) => void
//   onCustomerChange?: (name: string) => void
//   onBillerChange?: (id: string) => void
//   onProductChange?: (id: string) => void
//   showDate?: boolean
//   showDateTo?: boolean
//   date?: string
//   dateTo?: string
//   onDateChange?: (date: string) => void
//   onDateToChange?: (date: string) => void
//   showCustomer?: boolean
//   showBiller?: boolean
//   showProduct?: boolean
//   hideGodownFilter?: boolean
// }

// const selectClass =
//   'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200'

// export function ReportFiltersBar({
//   godowns,
//   customers = [],
//   billers = [],
//   products = [],
//   godownId,
//   customerName = '',
//   billerUserId = '',
//   productId = '',
//   onGodownChange,
//   onCustomerChange,
//   onBillerChange,
//   onProductChange,
//   showDate,
//   showDateTo,
//   date,
//   dateTo,
//   onDateChange,
//   onDateToChange,
//   showCustomer,
//   showBiller,
//   showProduct,
//   hideGodownFilter,
// }: Props) {
//   return (
//     <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
//       {showDate && date && onDateChange ? (
//         <div className="w-full sm:w-44">
//           <Input type="date" label={showDateTo ? 'From date' : 'Date'} value={date} onChange={(e) => onDateChange(e.target.value)} />
//         </div>
//       ) : null}
//       {showDateTo && onDateToChange ? (
//         <div className="w-full sm:w-44">
//           <Input type="date" label="To date" value={dateTo || ''} onChange={(e) => onDateToChange(e.target.value)} />
//         </div>
//       ) : null}
//       {!hideGodownFilter ? (
//         <div className="w-full sm:w-48">
//           <label className="mb-1 block text-sm font-medium text-slate-800">Godown</label>
//           <select
//             value={godownId}
//             onChange={(e) => onGodownChange(e.target.value)}
//             className={selectClass}
//           >
//             <option value="">All godowns</option>
//             {(godowns ?? []).map((g) => (
//               <option key={g.id} value={g.id}>
//                 {g.name}
//               </option>
//             ))}
//           </select>
//         </div>
//       ) : null}

//       {onProductChange ? (
//         <div className="w-full sm:w-52">
//           <label className="mb-1 block text-sm font-medium text-slate-800">Product</label>
//           <select
//             value={productId}
//             onChange={(e) => onProductChange(e.target.value)}
//             className={selectClass}
//           >
//             <option value="">All products</option>
//             {(products ?? []).map((p) => (
//               <option key={p.id} value={p.id}>
//                 {p.name}{p.sku ? ` (${p.sku})` : ''}
//               </option>
//             ))}
//           </select>
//         </div>
//       ) : null}

//       {showCustomer && onCustomerChange ? (
//         <div className="w-full sm:min-w-[12rem] sm:flex-1">
//           <label className="mb-1 block text-sm font-medium text-slate-800">Customer</label>
//           <input
//             value={customerName}
//             onChange={(e) => onCustomerChange(e.target.value)}
//             placeholder="Select or type customer..."
//             list="report-customers-list"
//             className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
//           />
//           <datalist id="report-customers-list">
//             {(customers ?? []).map((c) => (
//               <option key={c} value={c} />
//             ))}
//           </datalist>
//         </div>
//       ) : null}
//     </div>
//   )
// } 

import { useEffect, useRef, useState } from 'react'
import type { GodownRow } from '../../pages/Godowns/List'
import { Input } from '../ui/Input'
import type { BillerOption, ProductOption } from '../../hooks/useReportFilters'

// ── Searchable dropdown ─────────────────────────────────────────────────────

type Option = { value: string; label: string }

function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'All',
  width,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Option[]
  placeholder?: string
  width?: string | number
}) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref                 = useRef<HTMLDivElement>(null)
  const inputRef            = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder

  return (
    <div ref={ref} style={{ position: 'relative', width: width ?? '100%' }}>
      <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
        {label}
      </label>

      {/* Trigger button — looks exactly like the date selects */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setSearch('') }}
        style={{
          width: '100%', height: 44, padding: '0 36px 0 12px',
          border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff',
          fontSize: 13, color: value ? '#0f172a' : '#94a3b8',
          textAlign: 'left', cursor: 'pointer', position: 'relative',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          outline: open ? '2px solid #a7f3d0' : 'none',
          transition: 'border-color 0.15s',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontFamily: 'inherit',
        }}
      >
        {selectedLabel}
        {/* chevron */}
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 200,
          minWidth: '100%', maxWidth: 360,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}>
          {/* Search box */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4.5 4.5" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                style={{
                  width: '100%', height: 32, paddingLeft: 28, paddingRight: 8,
                  border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12,
                  color: '#0f172a', background: '#f8fafc', outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }}
                onKeyDown={(e) => e.key === 'Escape' && (setOpen(false), setSearch(''))}
              />
            </div>
          </div>

          {/* Options list */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>No results</div>
            ) : filtered.map((o) => (
              <div
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); setSearch('') }}
                style={{
                  padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                  color: o.value === value ? '#059669' : '#0f172a',
                  fontWeight: o.value === value ? 700 : 400,
                  background: o.value === value ? '#f0fdf4' : undefined,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                onMouseLeave={(e) => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = '' }}
              >
                {o.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Props ───────────────────────────────────────────────────────────────────

type Props = {
  godowns: GodownRow[]
  sites: string[]
  customers?: string[]
  billers?: BillerOption[]
  products?: ProductOption[]
  godownId: string
  site: string
  customerName?: string
  billerUserId?: string
  productId?: string
  onGodownChange: (id: string) => void
  onSiteChange: (site: string) => void
  onCustomerChange?: (name: string) => void
  onBillerChange?: (id: string) => void
  onProductChange?: (id: string) => void
  showDate?: boolean
  showDateTo?: boolean
  date?: string
  dateTo?: string
  onDateChange?: (date: string) => void
  onDateToChange?: (date: string) => void
  showCustomer?: boolean
  showBiller?: boolean
  showProduct?: boolean
  hideGodownFilter?: boolean
}

// ── Component ───────────────────────────────────────────────────────────────

export function ReportFiltersBar({
  godowns,
  customers = [],
  billers = [],
  products = [],
  godownId,
  customerName = '',
  billerUserId = '',
  productId = '',
  onGodownChange,
  onCustomerChange,
  onBillerChange,
  onProductChange,
  showDate,
  showDateTo,
  date,
  dateTo,
  onDateChange,
  onDateToChange,
  showCustomer,
  showBiller,
  showProduct,
  hideGodownFilter,
}: Props) {

  const godownOptions: Option[] = [
    { value: '', label: 'All godowns' },
    ...(godowns ?? []).map((g) => ({ value: g.id, label: g.name })),
  ]

  const productOptions: Option[] = [
    { value: '', label: 'All products' },
    ...(products ?? []).map((p) => ({ value: p.id, label: p.name + (p.sku ? ` (${p.sku})` : '') })),
  ]

  const customerOptions: Option[] = [
    { value: '', label: 'All customers' },
    ...(customers ?? []).map((c) => ({ value: c, label: c })),
  ]

  const billerOptions: Option[] = [
    { value: '', label: '— Select a biller —' },
    ...(billers ?? []).map((b) => ({ value: b.id, label: b.name + (b.siteName ? ` — ${b.siteName}` : '') })),
  ]

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>

      {/* From date */}
      {showDate && date && onDateChange ? (
        <div style={{ width: 176 }}>
          <Input type="date" label={showDateTo ? 'From date' : 'Date'} value={date} onChange={(e) => onDateChange(e.target.value)} />
        </div>
      ) : null}

      {/* To date */}
      {showDateTo && onDateToChange ? (
        <div style={{ width: 176 }}>
          <Input type="date" label="To date" value={dateTo || ''} onChange={(e) => onDateToChange(e.target.value)} />
        </div>
      ) : null}

      {/* Godown */}
      {!hideGodownFilter ? (
        <div style={{ width: 200 }}>
          <SearchableSelect
            label="Godown"
            value={godownId}
            onChange={onGodownChange}
            options={godownOptions}
            placeholder="All godowns"
          />
        </div>
      ) : null}

      {/* Product */}
      {onProductChange ? (
        <div style={{ width: 220 }}>
          <SearchableSelect
            label="Product"
            value={productId}
            onChange={onProductChange}
            options={productOptions}
            placeholder="All products"
          />
        </div>
      ) : null}

      {/* Customer — fixed width, same as Godown / Product selects */}
      {showCustomer && onCustomerChange ? (
        <div style={{ width: 220 }}>
          <SearchableSelect
            label="Customer"
            value={customerName}
            onChange={onCustomerChange}
            options={customerOptions}
            placeholder="All customers"
          />
        </div>
      ) : null}

      {/* Biller (if shown) */}
      {showBiller && onBillerChange ? (
        <div style={{ width: 240 }}>
          <SearchableSelect
            label="Biller"
            value={billerUserId}
            onChange={onBillerChange}
            options={billerOptions}
            placeholder="— Select a biller —"
          />
        </div>
      ) : null}

    </div>
  )
}