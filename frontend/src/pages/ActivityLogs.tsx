import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'
import { getToken, useAuth } from '../auth/store'

type ActivityLogEntry = {
  id: string
  at: string
  actor: { userId?: string; role?: string; name?: string }
  action: string
  category: string
  targetType?: string
  targetId?: string
  targetName?: string
  details?: Record<string, unknown>
  ip?: string
}

type LogsResponse = {
  logs: ActivityLogEntry[]
  total: number
  page: number
  pages: number
  limit: number
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'AUTH', label: 'Auth' },
  { value: 'USER', label: 'Users' },
  { value: 'GODOWN', label: 'Godown' },
  { value: 'DELIVERY', label: 'Delivery' },
]

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Signed in',
  LOGIN_FAILED: 'Login failed',
  USER_CREATED: 'User created',
  USER_UPDATED: 'User updated',
  USER_ACTIVATED: 'User activated',
  USER_DEACTIVATED: 'User deactivated',
  USER_DELETED: 'User deleted',
  PASSWORD_RESET: 'Password reset',
  PROFILE_UPDATED: 'Profile updated',
  GODOWN_CREATED: 'Godown created',
  GODOWN_UPDATED: 'Godown updated',
  GODOWN_DELETED: 'Godown deleted',
  DELIVERY_CREATED: 'Delivery created',
  DELIVERY_UPDATED: 'Delivery updated',
  DELIVERY_DELETED: 'Delivery deleted',
  DELIVERY_LINK_USED: 'Delivery link used',
  DELIVERY_STATUS_UPDATED: 'Delivery status updated',
  DELIVERY_TOKENS_REGENERATED: 'Delivery links regenerated',
  DELIVERY_MARKED_PACKED: 'Delivery marked packed',
  DELIVERY_OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERY_VEHICLE_UPDATED: 'Delivery vehicle updated',
  DELIVERY_VEHICLE_VERIFIED: 'Delivery vehicle verified',
  DELIVERY_RETURN_PICKUP_ASSIGNED: 'Return pickup assigned',
  DELIVERY_SCAN: 'Delivery scan',
  DELIVERY_DISPATCH_CONFIRMED: 'Dispatch confirmed',
  DELIVERY_RETURN_CONFIRMED: 'Return confirmed',
  DELIVERY_MARKED_DELIVERED: 'Marked delivered',
  DELIVERY_RETURN_CLOSED: 'Return closed',
  ASSET_TAG_ENROLLED: 'Asset tag enrolled',
  RE_DELIVERY_SCHEDULED: 'Re-delivery scheduled',
}

const CATEGORY_META: Record<string, { bg: string; color: string; border: string; soft: string; label: string }> = {
  AUTH: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', soft: '#dbeafe', label: 'Auth' },
  USER: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', soft: '#d1fae5', label: 'User' },
  GODOWN: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', soft: '#fef3c7', label: 'Godown' },
  DELIVERY: { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4', soft: '#ccfbf1', label: 'Delivery' },
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  ADMIN: { bg: '#f1f5f9', color: '#334155' },
  GODOWN: { bg: '#fffbeb', color: '#b45309' },
  DELIVERY: { bg: '#eff6ff', color: '#1d4ed8' },
  BILLER: { bg: '#ecfdf5', color: '#047857' },
  PUBLIC: { bg: '#f0fdfa', color: '#0f766e' },
}

function isDestructive(action: string) {
  return action === 'LOGIN_FAILED' || action.endsWith('_DELETED') || action.endsWith('_DEACTIVATED')
}

function isPositive(action: string) {
  return action === 'LOGIN' || action.endsWith('_CREATED') || action.endsWith('_ACTIVATED')
}

function actionLabel(action: string) {
  return ACTION_LABELS[action] || action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

function formatAbsolute(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 45) return 'Just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  return formatAbsolute(iso)
}

function initials(name?: string) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function CategoryIcon({ category }: { category: string }) {
  const stroke = 'currentColor'
  const props = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (category === 'AUTH') {
    return (
      <svg {...props}>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    )
  }
  if (category === 'USER') {
    return (
      <svg {...props}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  }
  if (category === 'GODOWN') {
    return (
      <svg {...props}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  }
  return (
    <svg {...props}>
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

function detailEntries(details?: Record<string, unknown>) {
  if (!details) return []
  return Object.entries(details).filter(([, v]) => v != null && v !== '')
}

function ActivityRow({ log }: { log: ActivityLogEntry }) {
  const [open, setOpen] = useState(false)
  const meta = CATEGORY_META[log.category] || { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', soft: '#f1f5f9', label: log.category }
  const roleStyle = ROLE_COLORS[log.actor?.role || ''] || { bg: '#f1f5f9', color: '#64748b' }
  const details = detailEntries(log.details)
  const destructive = isDestructive(log.action)
  const positive = isPositive(log.action)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr',
        gap: 14,
        padding: '16px 20px',
        borderBottom: '1px solid #f1f5f9',
        transition: 'background 0.15s',
        background: open ? '#f8fafc' : '#fff',
      }}
      onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = 'rgba(236,253,245,0.45)' }}
      onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = '#fff' }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
        flexShrink: 0,
      }}>
        <CategoryIcon category={log.category} />
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 14, fontWeight: 700,
                color: destructive ? '#dc2626' : positive ? '#047857' : '#0f172a',
              }}>
                {actionLabel(log.action)}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: meta.soft, color: meta.color, letterSpacing: '0.03em',
              }}>
                {meta.label}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'linear-gradient(145deg, #059669, #10b981)',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  letterSpacing: '0.02em',
                }}>
                  {initials(log.actor?.name)}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  {log.actor?.name || 'Unknown'}
                </span>
              </div>
              {log.actor?.role ? (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  background: roleStyle.bg, color: roleStyle.color,
                }}>
                  {log.actor.role}
                </span>
              ) : null}
              {log.targetName ? (
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  on <span style={{ fontWeight: 600, color: '#475569' }}>{log.targetName}</span>
                  {log.targetType ? (
                    <span style={{ color: '#94a3b8' }}> · {log.targetType}</span>
                  ) : null}
                </span>
              ) : null}
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{formatRelative(log.at)}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, whiteSpace: 'nowrap' }}>{formatAbsolute(log.at)}</div>
          </div>
        </div>

        {(details.length > 0 || log.ip) && (
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              style={{
                border: 'none', background: 'transparent', padding: 0,
                fontSize: 12, fontWeight: 600, color: '#059669', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              {open ? 'Hide details' : 'View details'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {open ? (
              <div style={{
                marginTop: 8, padding: '10px 12px', borderRadius: 12,
                background: '#fff', border: '1px solid #e2e8f0',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                {details.map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12, lineHeight: 1.4 }}>
                    <span style={{ color: '#94a3b8', minWidth: 88, fontWeight: 600, textTransform: 'capitalize' }}>
                      {k.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span style={{ color: '#334155', wordBreak: 'break-word' }}>{String(v)}</span>
                  </div>
                ))}
                {log.ip ? (
                  <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                    <span style={{ color: '#94a3b8', minWidth: 88, fontWeight: 600 }}>IP</span>
                    <span style={{ color: '#334155', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{log.ip}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export function ActivityLogsPage() {
  const auth = useAuth()
  const isAdmin = auth.status === 'authenticated' && auth.user.role === 'ADMIN'

  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [category, setCategory] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')

  async function fetchLogs() {
    const token = getToken()
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      params.set('page', String(page))
      params.set('limit', '50')

      const data = await apiFetch<LogsResponse>(`/activity-logs?${params.toString()}`, { token })
      setLogs(data.logs)
      setTotal(data.total)
      setPages(data.pages)
    } catch (e: unknown) {
      setError((e as { message?: string }).message || 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [category, dateFrom, dateTo, page])

  function clearFilters() {
    setCategory('')
    setDateFrom('')
    setDateTo('')
    setQ('')
    setPage(1)
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return logs
    return logs.filter((log) => {
      const hay = [
        actionLabel(log.action),
        log.action,
        log.category,
        log.actor?.name,
        log.actor?.role,
        log.targetName,
        log.targetType,
        log.ip,
        ...detailEntries(log.details).flatMap(([k, v]) => [k, String(v)]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(s)
    })
  }, [logs, q])

  const hasFilters = !!(category || dateFrom || dateTo || q)
  const pageButtons = useMemo(() => {
    const max = Math.min(7, pages)
    return Array.from({ length: max }, (_, i) => {
      if (pages <= 7) return i + 1
      if (page <= 4) return i + 1
      if (page >= pages - 3) return pages - 6 + i
      return page - 3 + i
    }).filter((n) => n >= 1 && n <= pages)
  }, [page, pages])

  const inputStyle: React.CSSProperties = {
    height: 38,
    padding: '0 12px',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    background: '#fff',
    fontSize: 13,
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Activity Logs</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
            {isAdmin
              ? 'Track logins, user changes, godown updates, and delivery activity across the system.'
              : 'Your recent actions across the system.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchLogs()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            height: 40, padding: '0 16px', borderRadius: 12,
            border: '1px solid #e2e8f0', background: '#fff',
            fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
          }}
        >
          <RefreshIcon />
          Refresh
        </button>
      </div>

      <div style={{
        background: '#fff',
        border: '1px solid #e8eaf0',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid #f1f5f9', gap: 12, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Activity feed</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              {loading
                ? 'Loading activity…'
                : total > 0
                  ? `${total.toLocaleString()} event${total === 1 ? '' : 's'} · Page ${page} of ${Math.max(pages, 1)}`
                  : 'No events for the selected filters'}
            </div>
          </div>

          <div style={{ position: 'relative', width: 260, maxWidth: '100%' }}>
            <svg
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search actor, action, target…"
              style={{ ...inputStyle, width: '100%', paddingLeft: 36, background: '#f8fafc' }}
            />
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, flexWrap: 'wrap', padding: '14px 22px', borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(180deg, #fafbfc 0%, #fff 100%)',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORY_OPTIONS.map((opt) => {
              const active = category === opt.value
              return (
                <button
                  key={opt.value || 'all'}
                  type="button"
                  onClick={() => { setCategory(opt.value); setPage(1) }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    border: active ? 'none' : '1px solid #e2e8f0',
                    background: active ? '#059669' : '#fff',
                    color: active ? '#fff' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              style={inputStyle}
              aria-label="From date"
            />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              style={inputStyle}
              aria-label="To date"
            />
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  height: 38, padding: '0 14px', borderRadius: 10,
                  border: '1px solid #e2e8f0', background: '#fff',
                  color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <div style={{
            margin: '14px 22px', padding: '10px 14px', borderRadius: 10,
            background: '#fef2f2', color: '#b91c1c', fontSize: 13,
            border: '1px solid #fecaca',
          }}>
            {error}
          </div>
        ) : null}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 20px', gap: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid #e2e8f0', borderTopColor: '#10b981',
              animation: 'activitySpin 0.7s linear infinite',
            }} />
            <style>{`@keyframes activitySpin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Loading activity…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18, margin: '0 auto 14px',
              background: '#ecfdf5', color: '#059669',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #a7f3d0',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#475569' }}>
              {q.trim() ? 'No matching activity' : 'No activity yet'}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>
              {q.trim() ? 'Try a different search or clear filters.' : 'Events will appear here as people use the system.'}
            </div>
          </div>
        ) : (
          <div>
            {q.trim() ? (
              <div style={{ padding: '10px 22px', fontSize: 12, color: '#64748b', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                Showing <span style={{ fontWeight: 700, color: '#0f172a' }}>{filtered.length}</span> of {logs.length} on this page
              </div>
            ) : null}
            {filtered.map((log) => (
              <ActivityRow key={log.id} log={log} />
            ))}
          </div>
        )}

        {pages > 1 ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, flexWrap: 'wrap', padding: '16px 22px',
            borderTop: '1px solid #f1f5f9', background: '#fafbfc',
          }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                height: 36, padding: '0 14px', borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: page <= 1 ? '#f8fafc' : '#fff',
                color: page <= 1 ? '#cbd5e1' : '#374151',
                fontSize: 13, fontWeight: 600,
                cursor: page <= 1 ? 'default' : 'pointer',
              }}
            >
              Previous
            </button>
            {pageButtons.map((pageNo) => (
              <button
                key={pageNo}
                type="button"
                onClick={() => setPage(pageNo)}
                style={{
                  minWidth: 36, height: 36, padding: '0 10px', borderRadius: 10,
                  border: page === pageNo ? 'none' : '1px solid #e2e8f0',
                  background: page === pageNo ? '#059669' : '#fff',
                  color: page === pageNo ? '#fff' : '#374151',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  boxShadow: page === pageNo ? '0 2px 8px rgba(5,150,105,0.28)' : 'none',
                }}
              >
                {pageNo}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              style={{
                height: 36, padding: '0 14px', borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: page >= pages ? '#f8fafc' : '#fff',
                color: page >= pages ? '#cbd5e1' : '#374151',
                fontSize: 13, fontWeight: 600,
                cursor: page >= pages ? 'default' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
