import { API_BASE } from './api'

async function openChallanPdf(deliveryId: string, token: string, path: 'challan.pdf' | 'return-challan.pdf'): Promise<void> {
  const res = await fetch(`${API_BASE}/deliveries/${deliveryId}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    let message = 'Failed to generate PDF'
    try {
      const data = await res.json()
      if (data?.message) message = String(data.message)
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function openDeliveryChallanPdf(deliveryId: string, token: string): Promise<void> {
  return openChallanPdf(deliveryId, token, 'challan.pdf')
}

export async function openReturnChallanPdf(deliveryId: string, token: string): Promise<void> {
  return openChallanPdf(deliveryId, token, 'return-challan.pdf')
}

export function ChallanPdfIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="12" y1="9" x2="8" y2="9" />
    </svg>
  )
}