import { useEffect } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  open: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  bodyClassName?: string
    style?: React.CSSProperties 
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  className,
  bodyClassName,
  style
}: Props) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (!open) return
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-end justify-center p-4 sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
            style={style}  
          // className={cn(
          //   'flex max-h-[min(90vh,48rem)] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl',
          //   className,
          // )}

          className={cn(
  'flex max-h-[min(90vh,48rem)] w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl',
  className,
)}
        >
          {title ? (
            <div className="shrink-0 border-b border-slate-100 px-5 py-4">
              <div className="text-base font-semibold text-slate-900">{title}</div>
            </div>
          ) : null}
          <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-4', bodyClassName)}>{children}</div>
          {footer ? (
            <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-5 py-4">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}


