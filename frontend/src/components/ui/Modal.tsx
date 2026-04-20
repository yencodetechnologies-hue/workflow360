import { useEffect } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  open: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  className,
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
          className={cn(
            'w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl',
            className,
          )}
        >
          {title ? (
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="text-sm font-semibold text-slate-900">{title}</div>
            </div>
          ) : null}
          <div className="px-5 py-4">{children}</div>
          {footer ? (
            <div className="border-t border-slate-100 px-5 py-4">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

