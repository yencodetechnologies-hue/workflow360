import { cn } from '../../lib/cn'

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'group relative rounded-2xl border border-slate-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border-b border-slate-100/50 px-6 py-5 relative z-10', className)} {...props} />
  )
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-bold text-slate-900 gradient-text', className)} {...props} />
  )
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-5 relative z-10', className)} {...props} />
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border-t border-slate-100/50 px-6 py-4 relative z-10', className)} {...props} />
  )
}

// Glass card variant
export function GlassCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'group relative rounded-2xl border border-white/20 bg-white/10 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden',
        'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-50',
        'after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-tr after:from-primary-500/10 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300',
        className,
      )}
      {...props}
    />
  )
}

// Gradient card variant
export function GradientCard({
  className,
  variant = 'primary',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' }) {
  const gradientVariant = {
    primary: 'from-primary-500 to-primary-600',
    secondary: 'from-secondary-500 to-secondary-600',
    success: 'from-success-500 to-success-600',
    danger: 'from-danger-500 to-danger-600',
    warning: 'from-warning-500 to-warning-600',
  }

  return (
    <div
      className={cn(
        `group relative rounded-2xl bg-gradient-to-br ${gradientVariant[variant]} shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden`,
        'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300',
        className,
      )}
      {...props}
    />
  )
}

// Interactive card with hover effects
export function InteractiveCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'group relative rounded-2xl border border-slate-200/50 bg-white shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden cursor-pointer',
        'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-primary-500/5 before:to-transparent before:opacity-0 group-hover:before:opacity-100 before:transition-all before:duration-500',
        'after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-tr after:from-transparent after:to-primary-500/5 after:opacity-0 group-hover:after:opacity-100 after:transition-all after:duration-500',
        className,
      )}
      {...props}
    >
      <div className="relative z-10 transform transition-transform duration-500 group-hover:scale-105">
        {children}
      </div>
    </div>
  )
}

