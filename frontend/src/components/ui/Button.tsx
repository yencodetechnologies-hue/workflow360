import { cn } from '../../lib/cn'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'gradient' | 'glow'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants: Record<NonNullable<Props['variant']>, string> = {
  primary:
    'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 focus-visible:ring-violet-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200',
  secondary:
    'bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 focus-visible:ring-slate-400 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400 transition-all duration-200',
  danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus-visible:ring-red-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200',
  success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 focus-visible:ring-emerald-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200',
  gradient: 'bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white hover:from-violet-600 hover:via-purple-600 hover:to-pink-600 focus-visible:ring-violet-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300',
  glow: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white focus-visible:ring-violet-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300',
}

const sizes: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 relative overflow-hidden group',
        variants[variant],
        sizes[size],
        loading && 'cursor-not-allowed',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      
      <span className="relative z-10">{children}</span>
      
      {/* Subtle hover overlay */}
      <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </button>
  )
}

