export function formatNumber(n: number) {
  return new Intl.NumberFormat(undefined).format(n)
}

export function formatDateShort(iso: string) {
  const d = new Date(iso)
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
  }).format(d)
}

export function formatDateTime(iso: string) {
  const d = new Date(iso)
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

