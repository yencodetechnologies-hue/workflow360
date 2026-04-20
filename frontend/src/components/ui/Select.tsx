import { cn } from '../../lib/cn'

type Option = { value: string; label: string }

type Props = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  label?: string
  options: Option[]
}

export function Select({ className, label, options, ...props }: Props) {
  return (
    <label className="block">
      {label ? (
        <div className="mb-1 text-sm font-medium text-slate-800">{label}</div>
      ) : null}
      <select
        className={cn(
          'h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200',
          className,
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

