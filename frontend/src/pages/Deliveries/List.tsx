
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { formatDateTime } from '../../lib/format'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'
import { DeliveryStatusSelect } from '../../components/delivery/DeliveryStatusSelect'
import { DeliveryRowActions } from '../../components/delivery/DeliveryRowActions'
import { GodownDeliveryWorkflow } from '../../components/delivery/GodownDeliveryWorkflow'
import { Badge } from '../../components/ui/Badge'
import { deliveryBadgeVariant, deliveryStatusLabel } from '../../lib/deliveryStatus'
import { CreateDeliveryModal } from './CreateDeliveryModal'
import { DriverDeliveriesDashboard } from '../../components/delivery/DriverDeliveriesDashboard'

type Tab =
  | 'all'
  | 'PROCESSED'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RETURN_PICKUP'
  | 'PENDING_RETURN'
  | 'COMPLETED'

type DeliveryRow = {
  id: string
  deliveryNo: string
  customerName: string
  siteName?: string
  siteAddress?: string
  status: string
  deliveryAt: string
  fromGodownId?: string
  billerUserId?: string
  dispatchedTagIds?: string[]
  pickedUpTagIds?: string[]
  deliveredTagIds?: string[]
  returnPickedUpTagIds?: string[]
  returnedTagIds?: string[]
  damagedTagIds?: string[]
  lostTagIds?: string[]
  lines?: Array<{
    productId: string
    qty: number
    dispatchedQty?: number
    returnedQty?: number
  }>
}

// ── icons ──────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="15" height="15" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5 21 21" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

// ── action icon button ─────────────────────────────────────────────────────

// function IconBtn({
//   children,
//   title,
//   onClick,
//   danger = false,
// }: {
//   children: React.ReactNode
//   title: string
//   onClick?: () => void
//   danger?: boolean
// }) {
//   return (
//     <button
//       type="button"
//       title={title}
//       onClick={onClick}
//       style={{
//         display: 'inline-flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         width: 34,
//         height: 34,
//         borderRadius: 9,
//         border: '1px solid #e2e8f0',
//         background: '#fff',
//         color: danger ? '#dc2626' : '#64748b',
//         cursor: 'pointer',
//         transition: 'all 0.15s',
//         flexShrink: 0,
//       }}
//       onMouseEnter={(e) => {
//         const el = e.currentTarget as HTMLElement
//         if (danger) {
//           el.style.background = '#fef2f2'
//           el.style.borderColor = '#fecaca'
//           el.style.color = '#dc2626'
//         } else {
//           el.style.background = '#f0eeff'
//           el.style.borderColor = '#c4b5fd'
//           el.style.color = '#4f46e5'
//         }
//       }}
//       onMouseLeave={(e) => {
//         const el = e.currentTarget as HTMLElement
//         el.style.background = '#fff'
//         el.style.borderColor = '#e2e8f0'
//         el.style.color = danger ? '#dc2626' : '#64748b'
//       }}
//     >
//       {children}
//     </button>
//   )
// }

// ── main component ─────────────────────────────────────────────────────────

export function DeliveriesListPage() {
  const auth = useAuth()
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const statusFromUrl = searchParams.get('status') as Tab | null

  const validTabs: Tab[] = ['all','PROCESSED','PACKED','OUT_FOR_DELIVERY','DELIVERED','RETURN_PICKUP','PENDING_RETURN','COMPLETED']

  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>(
    statusFromUrl && validTabs.includes(statusFromUrl) ? statusFromUrl : 'all'
  )
  const [q, setQ] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editDeliveryId, setEditDeliveryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const canCreate =
    auth.status === 'authenticated' &&
    (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')

  const isGodownUser = auth.status === 'authenticated' && auth.user.role === 'GODOWN'

  const removeFromList = (id: string) =>
    setDeliveries((prev) => prev.filter((r) => r.id !== id))

  const loadDeliveries = () => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    setError(null)
    apiFetch<DeliveryRow[]>('/deliveries?limit=200', { token })
      .then(setDeliveries)
      .catch((e: unknown) =>
        setError(e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Failed to load deliveries')
      )
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadDeliveries() }, [])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return deliveries.filter((d) => {
      if (tab !== 'all' && d.status !== tab) return false
      if (!s) return true
      return (
        d.deliveryNo.toLowerCase().includes(s) ||
        d.customerName.toLowerCase().includes(s) ||
        (d.siteName?.toLowerCase().includes(s) ?? false) ||
        (d.siteAddress?.toLowerCase().includes(s) ?? false)
      )
    })
  }, [deliveries, q, tab])

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'PROCESSED', label: 'Processed' },
    { id: 'PACKED', label: 'Packed' },
    { id: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'RETURN_PICKUP', label: 'Return pickup' },
    { id: 'PENDING_RETURN', label: 'Pending return' },
    { id: 'COMPLETED', label: 'Completed' },
  ]

  if (auth.status === 'authenticated' && auth.user.role === 'DELIVERY') {
    return <DriverDeliveriesDashboard />
  }

  // ── column header style ──────────────────────────────────────────────────

  const colHead: React.CSSProperties = {
    padding: '10px 16px',
    fontSize: 11,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid #f1f5f9',
    background: 'transparent',
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    // AppShell provides 20px 24px padding — no extra wrapper needed
    <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── PAGE HEADER ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Deliveries</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
            Manage customer deliveries, schedules and dispatch workflow.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setCreateOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 22px', borderRadius: 12, border: 'none',
              background: '#4f46e5', fontSize: 14, fontWeight: 600,
              color: '#fff', cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(79,70,229,0.3)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#4338ca')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#4f46e5')}
          >
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
             Create Delivery
          </button>
        )}
      </div>

      {/* ── MAIN CARD ── */}
      <div style={{
        background: '#fff',
        border: '1px solid #e8eaf0',
        borderRadius: 16,
        overflow: 'hidden',
      }}>

        {/* ── CARD HEADER: title + search + refresh ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid #f1f5f9',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Delivery List</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              {rows.length} deliveries available
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* search */}
            <div style={{ position: 'relative', width: 220 }}>
              <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <SearchIcon />
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search deliveries..."
                style={{
                  width: '100%', height: 36, paddingLeft: 34, paddingRight: 12,
                  border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13,
                  color: '#374151', background: '#f8fafc', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#a5b4fc')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
              />
            </div>

            {/* refresh */}
            <button
              onClick={loadDeliveries}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                height: 36, padding: '0 16px', borderRadius: 9,
                border: '1px solid #e2e8f0', background: '#fff',
                fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.background = '#f8fafc'
                el.style.borderColor = '#c7d2fe'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.background = '#fff'
                el.style.borderColor = '#e2e8f0'
              }}
            >
              <RefreshIcon />
              Refresh
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          padding: '14px 22px', borderBottom: '1px solid #f1f5f9',
        }}>
          {tabs.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  border: active ? 'none' : '1px solid #e2e8f0',
                  background: active ? '#4f46e5' : '#fff',
                  color: active ? '#fff' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = '#f0eeff'
                    el.style.color = '#4f46e5'
                    el.style.borderColor = '#c4b5fd'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = '#fff'
                    el.style.color = '#64748b'
                    el.style.borderColor = '#e2e8f0'
                  }
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div style={{
            margin: '12px 22px', padding: '10px 14px', borderRadius: 10,
            background: '#fef2f2', color: '#b91c1c', fontSize: 13,
            border: '1px solid #fecaca',
          }}>{error}</div>
        )}

        {/* ── SUCCESS ── */}
        {successMessage && (
          <div style={{
            margin: '12px 22px', padding: '10px 14px', borderRadius: 10,
            background: '#f0fdf4', color: '#15803d', fontSize: 13,
            border: '1px solid #bbf7d0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', fontWeight: 700, fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid #e2e8f0', borderTopColor: '#6366f1',
              animation: 'spin 0.7s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── EMPTY ── */}
        {!loading && rows.length === 0 && (
          <div style={{ padding: '48px 22px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>No deliveries found</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Try changing the search or delivery status filter.</div>
          </div>
        )}

        {/* ── TABLE ── */}
        {!loading && rows.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
              <thead>
                <tr>
                  <th style={colHead}>Delivery</th>
                  <th style={colHead}>Customer</th>
                  <th style={colHead}>Location</th>
                  <th style={colHead}>Status</th>
                  <th style={{ ...colHead, textAlign: 'right' }}>Scheduled</th>
                  <th style={{ ...colHead, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d, index) => (
                  <tr
                    key={d.id}
                    style={{
                      background: index % 2 === 0 ? '#ffffff' : '#fafbfc',
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.5)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#fafbfc')}
                  >
                    {/* DELIVERY */}
                    <td style={{ padding: '16px 16px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', letterSpacing: '0.01em' }}>
                        {d.deliveryNo}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        ID: {d.id.slice(0, 8)}
                      </div>
                    </td>

                    {/* CUSTOMER */}
                    <td style={{ padding: '16px 16px', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                        {d.customerName}
                      </span>
                    </td>

                    {/* LOCATION */}
                    <td style={{ padding: '16px 16px', verticalAlign: 'middle', maxWidth: 200 }}>
                      <span style={{
                        fontSize: 13, color: '#64748b',
                        display: 'block', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {d.siteName || d.siteAddress || '—'}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td style={{ padding: '16px 16px', verticalAlign: 'middle' }}>
                      {isGodownUser ? (
                        <Badge variant={deliveryBadgeVariant(d.status)}>
                          {deliveryStatusLabel(d.status)}
                        </Badge>
                      ) : (
                        <DeliveryStatusSelect
                          deliveryId={d.id}
                          status={d.status}
                          onUpdated={(status) =>
                            setDeliveries((prev) =>
                              prev.map((row) => row.id === d.id ? { ...row, status } : row)
                            )
                          }
                          onError={(msg) => setError(msg)}
                        />
                      )}
                    </td>

                    {/* SCHEDULED */}
                    <td style={{ padding: '16px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap' }}>
                        {formatDateTime(d.deliveryAt)}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td style={{ padding: '16px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {isGodownUser && (
                          <GodownDeliveryWorkflow
                            delivery={{ id: d.id, status: d.status, lines: d.lines }}
                            compact
                            onUpdated={loadDeliveries}
                            onError={(msg) => setError(msg)}
                          />
                        )}
                        <DeliveryRowActions
                          delivery={d}
                          onEdit={(deliveryId) => setEditDeliveryId(deliveryId)}
                          onScan={(path) => nav(path)}
                          onDeleted={() => {
                            removeFromList(d.id)
                            setSuccessMessage(`${d.deliveryNo} deleted successfully`)
                            setError(null)
                          }}
                          onError={(msg) => setError(msg)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      <CreateDeliveryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={loadDeliveries}
      />
      <CreateDeliveryModal
        open={!!editDeliveryId}
        deliveryId={editDeliveryId}
        onClose={() => setEditDeliveryId(null)}
        onCreated={loadDeliveries}
        onUpdated={loadDeliveries}
      />
    </div>
  )
}