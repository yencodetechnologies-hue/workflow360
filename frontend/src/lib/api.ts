export const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ??
  'http://127.0.0.1:2030/workflow360/api'

export type ApiError = { message: string; status?: number }

export async function apiFetch<T>(
  path: string,
  opts: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const headers = new Headers(opts.headers || {})
  if (!headers.has('Content-Type') && opts.body) headers.set('Content-Type', 'application/json')
  if (opts.token) headers.set('Authorization', `Bearer ${opts.token}`)

  const res = await fetch(url, { ...opts, headers })
  const text = await res.text()
  const data = text ? (JSON.parse(text) as any) : null
  if (!res.ok) {
    const err: ApiError = { message: data?.message || res.statusText || 'Request failed', status: res.status }
    throw err
  }
  return data as T
}

