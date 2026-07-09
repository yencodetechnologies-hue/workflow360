// import { Badge } from '../ui/Badge'

// export type CompletionLine = {
//   particulars?: string
//   productId?: string
//   sku?: string
//   qty: number
// }

// export type PublicCompletionScreenProps = {
//   variant: 'thankYou' | 'alreadyDone'
//   title: string
//   subtitle: string
//   statusLabel: string
//   deliveryNo: string
//   customerName: string
//   meta: { label: string; value: string }[]
//   lines: CompletionLine[]
//   completedAt?: string
//   completedAtLabel?: string
//   verifierName?: string
//   hasSignature?: boolean
// }

// function CheckIcon() {
//   return (
//     <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden>
//       <path d="M5 12.5 9.5 17 19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
//     </svg>
//   )
// }

// function LineCheckIcon() {
//   return (
//     <svg className="h-5 w-5 shrink-0 text-primary-600" viewBox="0 0 24 24" fill="none" aria-hidden>
//       <circle cx="12" cy="12" r="10" className="fill-emerald-50 stroke-emerald-200" strokeWidth="1.5" />
//       <path d="M8 12.5 10.5 15 16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//     </svg>
//   )
// }

// function formatDateTime(iso?: string) {
//   if (!iso) return '—'
//   return new Date(iso).toLocaleString(undefined, {
//     dateStyle: 'medium',
//     timeStyle: 'short',
//   })
// }

// export function PublicCompletionScreen({
//   variant,
//   title,
//   subtitle,
//   statusLabel,
//   deliveryNo,
//   customerName,
//   meta,
//   lines,
//   completedAt,
//   completedAtLabel,
//   verifierName,
//   hasSignature,
// }: PublicCompletionScreenProps) {
//   const dateLabel = completedAtLabel ?? (variant === 'thankYou' ? 'Verified on' : 'Completed on')
//   return (
//     <div className="mx-auto w-full max-w-lg animate-fade-in">
//       <div className="animate-slide-up rounded-2xl bg-white p-6 shadow-xl ring-1 ring-primary-100 sm:p-8">
//         <div className="text-center">
//           <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg shadow-primary-200">
//             <CheckIcon />
//           </div>

//           <Badge variant="green" className="mb-3">
//             {statusLabel}
//           </Badge>

//           <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
//           <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>

//           <p className="mt-4 text-sm font-medium text-slate-800">
//             {deliveryNo} · {customerName}
//           </p>
//         </div>

//         <div className="mt-6 space-y-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
//           {meta.map((m) => (
//             <div key={m.label} className="flex justify-between gap-4">
//               <span className="text-slate-500">{m.label}</span>
//               <span className="text-right font-medium text-slate-800">{m.value}</span>
//             </div>
//           ))}
//           {completedAt ? (
//             <div className="flex justify-between gap-4 border-t border-slate-200/80 pt-2">
//               <span className="text-slate-500">{dateLabel}</span>
//               <span className="text-right font-medium text-slate-800">{formatDateTime(completedAt)}</span>
//             </div>
//           ) : null}
//           {verifierName ? (
//             <div className="flex justify-between gap-4">
//               <span className="text-slate-500">Verified by</span>
//               <span className="text-right font-medium text-slate-800">{verifierName}</span>
//             </div>
//           ) : null}
//           {hasSignature ? (
//             <div className="pt-1">
//               <Badge variant="green">Signature on file</Badge>
//             </div>
//           ) : null}
//         </div>

//         {lines.length > 0 ? (
//           <div className="mt-6">
//             <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Items</h2>
//             <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
//               {lines.map((l, i) => (
//                 <li key={`line-${i}`} className="flex items-start gap-3 p-3">
//                   <LineCheckIcon />
//                   <div className="min-w-0 flex-1">
//                     <div className="font-semibold text-slate-900">{l.particulars || l.productId || 'Item'}</div>
//                     <div className="text-xs text-slate-500">
//                       {l.sku ? `${l.sku} · ` : ''}Qty {l.qty}
//                     </div>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         ) : null}
//       </div>
//     </div>
//   )
// }

import { useRef, useState } from 'react'
import { Badge } from '../ui/Badge'

export type CompletionLine = {
  particulars?: string
  productId?: string
  sku?: string
  qty: number
}

export type PublicCompletionScreenProps = {
  variant: 'thankYou' | 'alreadyDone'
  title: string
  subtitle: string
  statusLabel: string
  deliveryNo: string
  customerName: string
  meta: { label: string; value: string }[]
  lines: CompletionLine[]
  completedAt?: string
  completedAtLabel?: string
  verifierName?: string
  hasSignature?: boolean
}

function CheckIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12.5 9.5 17 19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LineCheckIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-primary-600" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" className="fill-emerald-50 stroke-emerald-200" strokeWidth="1.5" />
      <path d="M8 12.5 10.5 15 16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function MailIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

function formatDateTime(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

async function captureCardAsBlob(element: HTMLElement): Promise<Blob> {
  const html2canvas = (await import('html2canvas')).default
  // Render at a high, fixed pixel density so the exported PNG is crisp
  // regardless of the device's own screen resolution/zoom level. A plain
  // scale:2 could still look soft on high-DPI phones, so we factor in the
  // device pixel ratio too (capped so file size stays reasonable).
  const dpr = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1
  const scale = Math.min(4, Math.max(3, dpr * 2))
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale,
    useCORS: true,
    logging: false,
    imageTimeout: 15000,
    // Let html2canvas measure the element at its natural size instead of
    // the (often narrower) window width, avoiding text reflow/blur.
    windowWidth: document.documentElement.scrollWidth,
    windowHeight: document.documentElement.scrollHeight,
    // html2canvas doesn't run CSS animations/transitions — it snapshots
    // whatever keyframe the animated element happens to resolve to, which
    // for our mount-in fade/slide (opacity 0 → 1) comes out as a hazy,
    // washed-out "smoke white" card. The card has finished animating on
    // screen by the time someone taps Download, so on the *clone* only
    // (never the live page) we force every animated node to its settled
    // end state — full opacity, no transform — before html2canvas paints it.
    onclone: (clonedDoc) => {
      const nodes = clonedDoc.querySelectorAll<HTMLElement>(
        '[class*="animate-"]'
      )
      nodes.forEach((node) => {
        node.style.animation = 'none'
        node.style.opacity = '1'
        node.style.transform = 'none'
      })
    },
  })
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create image'))
    }, 'image/png', 1)
  })
}

export function PublicCompletionScreen({
  variant,
  title,
  subtitle,
  statusLabel,
  deliveryNo,
  customerName,
  meta,
  lines,
  completedAt,
  completedAtLabel,
  verifierName,
  hasSignature,
}: PublicCompletionScreenProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState<'whatsapp' | 'email' | 'download' | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)

  const dateLabel = completedAtLabel ?? (variant === 'thankYou' ? 'Verified on' : 'Completed on')

  const shareText = `${statusLabel}: ${title}\n${deliveryNo} · ${customerName}\n${meta.map(m => `${m.label}: ${m.value}`).join('\n')}${completedAt ? `\n${dateLabel}: ${formatDateTime(completedAt)}` : ''}${verifierName ? `\nVerified by: ${verifierName}` : ''}`

  const handleDownload = async () => {
    if (!cardRef.current) return
    setSharing('download')
    setShareError(null)
    try {
      const blob = await captureCardAsBlob(cardRef.current)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${deliveryNo}-${statusLabel.toLowerCase()}.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setShareError('Failed to capture image')
    } finally {
      setSharing(null)
    }
  }

  const handleWhatsApp = async () => {
    if (!cardRef.current) return
    setSharing('whatsapp')
    setShareError(null)
    try {
      const blob = await captureCardAsBlob(cardRef.current)
      const file = new File([blob], `${deliveryNo}-${statusLabel.toLowerCase()}.png`, { type: 'image/png' })

      // Try native share first (mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${statusLabel}: ${deliveryNo}`,
          text: shareText,
        })
      } else {
        // Fallback: download + open WhatsApp web with text
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${deliveryNo}-${statusLabel.toLowerCase()}.png`
        a.click()
        URL.revokeObjectURL(url)
        setTimeout(() => {
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n\n(Image downloaded — please attach it to this message)')}`, '_blank')
        }, 800)
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        setShareError('Could not share via WhatsApp')
      }
    } finally {
      setSharing(null)
    }
  }

  const handleEmail = async () => {
    if (!cardRef.current) return
    setSharing('email')
    setShareError(null)
    try {
      const blob = await captureCardAsBlob(cardRef.current)
      const file = new File([blob], `${deliveryNo}-${statusLabel.toLowerCase()}.png`, { type: 'image/png' })

      // Try native share with email on mobile
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${statusLabel}: ${deliveryNo}`,
          text: shareText,
        })
      } else {
        // Fallback: download image + open mailto
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${deliveryNo}-${statusLabel.toLowerCase()}.png`
        a.click()
        URL.revokeObjectURL(url)
        const subject = encodeURIComponent(`${statusLabel}: ${deliveryNo} · ${customerName}`)
        const body = encodeURIComponent(shareText + '\n\n(Please attach the downloaded image to this email)')
        setTimeout(() => {
          window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
        }, 800)
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        setShareError('Could not share via email')
      }
    } finally {
      setSharing(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg animate-fade-in">
      {/* Capturable card */}
      <div
        ref={cardRef}
        className="animate-slide-up rounded-2xl bg-white p-6 shadow-xl ring-1 ring-primary-100 sm:p-8"
      >
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg shadow-primary-200">
            <CheckIcon />
          </div>

          <Badge variant="green" className="mb-3">
            {statusLabel}
          </Badge>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>

          <p className="mt-4 text-sm font-medium text-slate-800">
            {deliveryNo} · {customerName}
          </p>
        </div>

        <div className="mt-6 space-y-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
          {meta.map((m) => (
            <div key={m.label} className="flex justify-between gap-4">
              <span className="text-slate-500">{m.label}</span>
              <span className="text-right font-medium text-slate-800">{m.value}</span>
            </div>
          ))}
          {completedAt ? (
            <div className="flex justify-between gap-4 border-t border-slate-200/80 pt-2">
              <span className="text-slate-500">{dateLabel}</span>
              <span className="text-right font-medium text-slate-800">{formatDateTime(completedAt)}</span>
            </div>
          ) : null}
          {verifierName ? (
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Verified by</span>
              <span className="text-right font-medium text-slate-800">{verifierName}</span>
            </div>
          ) : null}
          {hasSignature ? (
            <div className="pt-1">
              <Badge variant="green">Signature on file</Badge>
            </div>
          ) : null}
        </div>

        {lines.length > 0 ? (
          <div className="mt-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Items</h2>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {lines.map((l, i) => (
                <li key={`line-${i}`} className="flex items-start gap-3 p-3">
                  <LineCheckIcon />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900">{l.particulars || l.productId || 'Item'}</div>
                    <div className="text-xs text-slate-500">
                      {l.sku ? `${l.sku} · ` : ''}Qty {l.qty}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* Share buttons — outside the capturable area */}
      <div className="mt-4 space-y-3">
        {shareError ? (
          <p className="text-center text-xs text-rose-600">{shareError}</p>
        ) : null}

        <p className="text-center text-xs text-slate-500 font-medium uppercase tracking-wide">Share confirmation</p>

        <div className="grid grid-cols-3 gap-2">
          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            disabled={sharing !== null}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-green-50 hover:border-green-300 hover:text-green-700 disabled:opacity-50"
          >
            {sharing === 'whatsapp' ? (
              <svg className="h-5 w-5 animate-spin text-green-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <WhatsAppIcon />
            )}
            <span>WhatsApp</span>
          </button>

          {/* Email */}
          <button
            onClick={handleEmail}
            disabled={sharing !== null}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50"
          >
            {sharing === 'email' ? (
              <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <MailIcon />
            )}
            <span>Email</span>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={sharing !== null}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 hover:border-slate-400 disabled:opacity-50"
          >
            {sharing === 'download' ? (
              <svg className="h-5 w-5 animate-spin text-slate-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <DownloadIcon />
            )}
            <span>Download</span>
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-400 leading-snug">
          On mobile, tap WhatsApp or Email to share the image directly.<br/>
          On desktop, the image will download first — then attach it.
        </p>
      </div>
    </div>
  )
}