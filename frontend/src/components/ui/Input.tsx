import { forwardRef, useState } from 'react'
import { cn } from '../../lib/cn'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
}

function PasswordToggleButton({
  visible,
  onToggle,
}: {
  visible: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-600"
      onClick={onToggle}
      aria-label={visible ? 'Hide password' : 'Show password'}
    >
      {visible ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  )
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, label, hint, error, id, type, ...props },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  const inputId = id ?? props.name ?? undefined
  return (
    <label className="block">
      {label ? (
        <div className="mb-1 text-sm font-medium text-slate-800">{label}</div>
      ) : null}
      <div className={isPassword ? 'relative' : undefined}>
        <input
          id={inputId}
          ref={ref}
          type={inputType}
          className={cn(
            'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200',
            isPassword ? 'pr-10' : '',
            error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : '',
            className,
          )}
          {...props}
        />
        {isPassword ? (
          <PasswordToggleButton
            visible={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
          />
        ) : null}
      </div>
      {error ? (
        <div className="mt-1 text-xs text-rose-600">{error}</div>
      ) : hint ? (
        <div className="mt-1 text-xs text-slate-500">{hint}</div>
      ) : null}
    </label>
  )
})

