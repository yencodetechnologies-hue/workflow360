import { useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  style,
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

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/*
        Mobile:  bottom-sheet — slides up from bottom, rounded top corners only
        Desktop: centered — rounded all corners (original behaviour)
      */}
      {/*
        Mobile:  bottom-sheet pinned to bottom, max 90% of screen height
        Desktop: centered dialog, max 90vh / 48rem
        Key: the dialog div must have an explicit max-height AND overflow:hidden
        so that flex children (body + footer) are bounded. The body scrolls;
        the footer (shrink-0) always stays visible at the bottom.
      */}
      <div className="absolute inset-0 flex items-end justify-center sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          style={style}
          className={cn(
            'flex w-full flex-col bg-white shadow-2xl border border-slate-200 overflow-hidden',
            'max-h-[90dvh] rounded-t-2xl sm:rounded-2xl sm:max-h-[min(90vh,48rem)]',
            className,
          )}
        >
          {title ? (
            <div className="shrink-0 border-b border-slate-100 px-5 py-4 flex items-center justify-between gap-3">
              <div className="text-base font-semibold text-slate-900">{title}</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : null}
          <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-4', bodyClassName)}>
            {children}
          </div>
          {footer ? (
            <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}