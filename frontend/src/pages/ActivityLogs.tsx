import { useEffect, useState } from 'react'
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
  { value: '', label: 'All categories' },
  { value: 'AUTH', label: 'Auth (Login)' },
  { value: 'USER', label: 'User management' },
  { value: 'GODOWN', label: 'Godown' },
  { value: 'DELIVERY', label: 'Delivery' },
]

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Login',
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
}

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  AUTH: { bg: '#eff6ff', color: '#2563eb' },
  USER: { bg: '#f0fdf4', color: '#16a34a' },
  GODOWN: { bg: '#fefce8', color: '#ca8a04' },
  DELIVERY: { bg: '#fdf4ff', color: '#9333ea' },
}

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  LOGIN_FAILED: { bg: '#fef2f2', color: '#dc2626' },
  USER_DELETED: { bg: '#fef2f2', color: '#dc2626' },
  GODOWN_DELETED: { bg: '#fef2f2', color: '#dc2626' },
  USER_ACTIVATED: { bg: '#f0fdf4', color: '#16a34a' },
}

function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_COLORS[category] || { bg: '#f1f5f9', color: '#64748b' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 700,
        background: style.bg,
        color: style.color,
        letterSpacing: '0.04em',
      }}
    >
      {category}
    </span>
  )
}

function ActionBadge({ action }: { action: string }) {
  const style = ACTION_COLORS[action] || { bg: '#f8fafc', color: '#374151' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        background: style.bg,
        color: style.color,
      }}
    >
      {ACTION_LABELS[action] || action}
    </span>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

function RoleBadge({ role }: { role?: string }) {
  if (!role) return <span style={{ color: '#94a3b8' }}>—</span>
  const colors: Record<string, string> = {
    ADMIN: '#7c3aed',
    GODOWN: '#d97706',
    DELIVERY: '#2563eb',
    BILLER: '#059669',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 7px',
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 700,
        background: '#f1f5f9',
        color: colors[role] || '#64748b',
      }}
    >
      {role}
    </span>
  )
}

const tHead: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 11,
  fontWeight: 700,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  background: '#f8fafc',
  borderBottom: '1px solid #f1f5f9',
}

const tCell: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: 13,
  color: '#374151',
  borderBottom: '1px solid #f1f5f9',
  verticalAlign: 'middle',
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

  function handleFilter(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchLogs()
  }

  function clearFilters() {
    setCategory('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  return (
    <div style={{ padding: '24px 20px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>Activity Logs</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
          {isAdmin ? 'All system activity — user management, logins, godown changes' : 'Your recent activity'}
        </p>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleFilter}
        style={{
          background: '#fff',
          border: '1px solid #e8eaf0',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Category</label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1) }}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '7px 10px',
              fontSize: 13,
              background: '#fff',
              color: '#1e293b',
              cursor: 'pointer',
            }}
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>From date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '7px 10px',
              fontSize: 13,
              background: '#fff',
              color: '#1e293b',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>To date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '7px 10px',
              fontSize: 13,
              background: '#fff',
              color: '#1e293b',
            }}
          />
        </div>

        {(category || dateFrom || dateTo) && (
          <button
            type="button"
            onClick={clearFilters}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#64748b',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: 500,
              alignSelf: 'flex-end',
            }}
          >
            Clear
          </button>
        )}
      </form>

      {/* Summary row */}
      {!loading && (
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
          {total > 0 ? `${total} log${total !== 1 ? 's' : ''} found` : 'No logs found'}
          {total > 0 && pages > 1 && ` · Page ${page} of ${pages}`}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 10,
          padding: '12px 16px',
          color: '#dc2626',
          fontSize: 14,
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            Loading…
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            No activity logs yet
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tHead}>Time</th>
                  <th style={tHead}>Category</th>
                  <th style={tHead}>Action</th>
                  <th style={tHead}>Actor</th>
                  <th style={tHead}>Role</th>
                  <th style={tHead}>Target</th>
                  <th style={tHead}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ transition: 'background 0.1s' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = '#f8fafc')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = '')}
                  >
                    <td style={{ ...tCell, whiteSpace: 'nowrap', color: '#64748b', fontSize: 12 }}>
                      {formatDate(log.at)}
                    </td>
                    <td style={tCell}>
                      <CategoryBadge category={log.category} />
                    </td>
                    <td style={tCell}>
                      <ActionBadge action={log.action} />
                    </td>
                    <td style={{ ...tCell, fontWeight: 500 }}>
                      {log.actor?.name || <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                    <td style={tCell}>
                      <RoleBadge role={log.actor?.role} />
                    </td>
                    <td style={tCell}>
                      {log.targetName ? (
                        <span>
                          <span style={{ color: '#64748b', fontSize: 11, marginRight: 4 }}>{log.targetType}</span>
                          {log.targetName}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ ...tCell, maxWidth: 220 }}>
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <span style={{ fontSize: 12, color: '#64748b', wordBreak: 'break-word' }}>
                          {Object.entries(log.details)
                            .filter(([, v]) => v != null && v !== '')
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              padding: '7px 16px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: page <= 1 ? '#f8fafc' : '#fff',
              color: page <= 1 ? '#cbd5e1' : '#374151',
              fontSize: 13,
              cursor: page <= 1 ? 'default' : 'pointer',
              fontWeight: 500,
            }}
          >
            Previous
          </button>
          {Array.from({ length: Math.min(7, pages) }, (_, i) => {
            const pageNo = page <= 4 ? i + 1 : i + page - 3
            if (pageNo > pages) return null
            return (
              <button
                key={pageNo}
                onClick={() => setPage(pageNo)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: page === pageNo ? '#2563eb' : '#fff',
                  color: page === pageNo ? '#fff' : '#374151',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: 600,
                  minWidth: 36,
                }}
              >
                {pageNo}
              </button>
            )
          })}
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            style={{
              padding: '7px 16px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: page >= pages ? '#f8fafc' : '#fff',
              color: page >= pages ? '#cbd5e1' : '#374151',
              fontSize: 13,
              cursor: page >= pages ? 'default' : 'pointer',
              fontWeight: 500,
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
