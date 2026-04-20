import { cn } from '../../lib/cn'

// Hover tooltip component
export function Tooltip({ children, content, position = 'top' }: {
  children: React.ReactNode
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}) {
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  }

  return (
    <div className="relative group">
      {children}
      <div className={cn(
        'absolute z-50 px-2 py-1 text-xs text-white bg-slate-900 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap',
        positionClasses[position]
      )}>
        {content}
        <div className={cn(
          'absolute w-2 h-2 bg-slate-900 transform rotate-45',
          position === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1',
          position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
          position === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1',
          position === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1',
        )} />
      </div>
    </div>
  )
}

// Progress bar with animation
export function ProgressBar({ 
  value, 
  max = 100, 
  className, 
  animated = true,
  color = 'primary' 
}: {
  value: number
  max?: number
  className?: string
  animated?: boolean
  color?: 'primary' | 'success' | 'warning' | 'danger'
}) {
  const percentage = Math.min((value / max) * 100, 100)
  const colorClasses = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600',
    success: 'bg-gradient-to-r from-success-500 to-success-600',
    warning: 'bg-gradient-to-r from-warning-500 to-warning-600',
    danger: 'bg-gradient-to-r from-danger-500 to-danger-600',
  }

  return (
    <div className={cn('w-full bg-slate-200 rounded-full h-2 overflow-hidden', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500 ease-out',
          colorClasses[color],
          animated && 'animate-shimmer'
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

// Floating action button
export function FloatingActionButton({ 
  children, 
  onClick, 
  className,
  position = 'bottom-right'
}: {
  children: React.ReactNode
  onClick: () => void
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed z-50 w-14 h-14 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center group',
        'before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-primary-400 before:to-primary-500 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300',
        positionClasses[position],
        className
      )}
    >
      <div className="relative z-10 transform group-hover:rotate-90 transition-transform duration-300">
        {children}
      </div>
    </button>
  )
}

// Notification badge with animation
export function NotificationBadge({ 
  count, 
  className, 
  pulse = true 
}: {
  count: number
  className?: string
  pulse?: boolean
}) {
  return (
    <div className={cn('relative', className)}>
      {count > 0 && (
        <div className={cn(
          'absolute -top-2 -right-2 min-w-[20px] h-5 bg-gradient-to-r from-danger-500 to-danger-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-lg',
          pulse && 'animate-pulse'
        )}>
          {count > 99 ? '99+' : count}
        </div>
      )}
    </div>
  )
}

// Ripple effect component
export function RippleEffect({ children, className }: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {children}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700 ease-out" />
      </div>
    </div>
  )
}

// Magnetic button that follows cursor slightly
export function MagneticButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'relative transform transition-transform duration-200 ease-out hover:scale-105',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// Parallax background component
export function ParallaxBackground({ children, className }: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '6s' }} />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
