import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { getToken } from '../../auth/store'
import { Modal } from '../../components/ui/Modal'
import { formatDateTime } from '../../lib/format'
import type { ProductSummaryDeliveryLine, ProductSummaryRow } from '../../types/reports'

const tHead: React.CSSProperties = {
  padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#94a3b8',
  textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left',
  whiteSpace: 'nowrap', background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
}
const tCell: React.CSSProperties = {
  padding: '13px 14px', fontSize: 13, color: '#374151',
  borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle',
}

const listColHead: React.CSSProperties = {
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

function CountBadge({ count, tone, onClick }: { count: number; tone: 'amber' | 'rose'; onClick: () => void }) {
  const colors = tone === 'amber'
    ? { bg: '#fffbeb', color: '#b45309', border: '#fde68a' }
    : { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' }
  if (!count) {
    return <span style={{ fontSize: 13, color: '#94a3b8' }}>0</span>
  }
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 28, height: 26, padding: '0 8px', borderRadius: 20,
        background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`,
        fontSize: 12, fontWeight: 700, cursor: 'pointer',
      }}
    >
      {count}
    </button>
  )
}

function vehicleTypeLabel(t?: string) {
  if (t === 'PORTER') return 'Porter'
  if (t === 'OWN') return 'Own'
  if (t === 'PRIVATE') return 'Private'
  return null
}

function DeliveryListModal({
  title, lines, qtyLabel, onClose,
}: {
  title: string
  lines: ProductSummaryDeliveryLine[] | null
  qtyLabel: string
  onClose: () => void
}) {
  const nav = useNavigate()
  const [q, setQ] = useState('')

  useEffect(() => {
    setQ('')
  }, [lines])

  const filtered = useMemo(() => {
    if (!lines) return []
    const s = q.trim().toLowerCase()
    if (!s) return lines
    return lines.filter((d) => {
      const hay = [
        d.deliveryNo,
        d.customerName,
        d.siteName,
        d.siteAddress,
        d.godownName,
        d.status,
        d.vehicleLabel,
        d.note,
        String(d.qty ?? ''),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(s)
    })
  }, [lines, q])

  return (
    <Modal
      open={!!lines}
      title={title}
      onClose={onClose}
      className="sm:max-w-3xl"
      bodyClassName="!px-0 !py-0"
    >
      {!lines || lines.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
          No deliveries found
        </div>
      ) : (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, flexWrap: 'wrap', padding: '12px 20px', borderBottom: '1px solid #f1f5f9',
          }}>
            <div style={{ position: 'relative', width: 260, maxWidth: '100%' }}>
              <svg
                style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search delivery no, customer..."
                style={{
                  width: '100%', height: 36, paddingLeft: 34, paddingRight: 12,
                  borderRadius: 9, border: '1px solid #e2e8f0', background: '#f8fafc',
                  fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              Showing <span style={{ fontWeight: 600, color: '#0f172a' }}>{filtered.length}</span>
              {q.trim() ? ` of ${lines.length}` : ''} deliver{filtered.length === 1 ? 'y' : 'ies'}
            </span>
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
              No deliveries match your search
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr>
                    <th style={listColHead}>Delivery</th>
                    <th style={listColHead}>Customer</th>
                    <th style={{ ...listColHead, textAlign: 'right' }}>Scheduled</th>
                    <th style={{ ...listColHead, textAlign: 'right' }}>{qtyLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, index) => {
                    const rowBg = index % 2 === 0 ? '#fff' : '#fafbfc'
                    const vLabel = vehicleTypeLabel(d.vehicleType)
                    return (
                      <tr
                        key={`${d.id}-${d.qty}-${index}`}
                        style={{
                          background: rowBg,
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background 0.12s',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          onClose()
                          nav(`/deliveries/${d.id}`)
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(236,253,245,0.7)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = rowBg)}
                      >
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <Link
                            to={`/deliveries/${d.id}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ fontWeight: 700, fontSize: 14, color: '#059669', textDecoration: 'none' }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
                          >
                            {d.deliveryNo}
                          </Link>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                            {d.selfDelivery ? (
                              <span style={{
                                display: 'inline-block', padding: '2px 8px', borderRadius: 6,
                                fontSize: 11, fontWeight: 700, background: '#eff6ff', color: '#2563eb',
                                border: '1px solid #bfdbfe', letterSpacing: '0.04em',
                              }}>
                                Self
                              </span>
                            ) : null}
                            {d.vehicleLabel && vLabel ? (
                              <span style={{
                                display: 'inline-block', padding: '2px 8px', borderRadius: 6,
                                fontSize: 11, fontWeight: 700, background: '#7c2d12', color: '#fff',
                                letterSpacing: '0.04em',
                              }}>
                                {vLabel}
                              </span>
                            ) : null}
                          </div>
                          {d.note ? (
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{d.note}</div>
                          ) : null}
                        </td>
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{d.customerName || '—'}</span>
                        </td>
                        <td style={{
                          padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right',
                          fontSize: 13, color: '#475569', whiteSpace: 'nowrap',
                        }}>
                          {d.deliveryAt ? formatDateTime(d.deliveryAt) : '—'}
                        </td>
                        <td style={{
                          padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right',
                          fontSize: 14, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap',
                        }}>
                          {d.qty}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

export function ProductReportPage() {
  const [rows, setRows] = useState<ProductSummaryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [popup, setPopup] = useState<{
    title: string
    lines: ProductSummaryDeliveryLine[]
    qtyLabel: string
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    apiFetch<ProductSummaryRow[]>('/reports/products-summary', { token: getToken() })
      .then((data) => { if (!cancelled) setRows(data) })
      .catch((err) => { if (!cancelled) setError(err?.message || 'Failed to load product report') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((r) => (r.particulars || '').toLowerCase().includes(s) || (r.sku || '').toLowerCase().includes(s))
  }, [rows, q])

  return (
    <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Product Report</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
          Stock levels and delivery/return status for every product.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ position: 'relative', width: 280 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by product name or SKU..."
              style={{ width: '100%', height: 38, paddingLeft: 36, paddingRight: 12, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            Showing <span style={{ fontWeight: 600, color: '#0f172a' }}>{filtered.length}</span> products
          </span>
        </div>

        {error && (
          <div style={{ margin: '12px 16px', borderRadius: 10, border: '1px solid #fecdd3', background: '#fff1f2', padding: '10px 14px', fontSize: 13, color: '#be123c' }}>{error}</div>
        )}

        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>Loading products...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#475569', margin: 0 }}>No products found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
              <thead>
                <tr>
                  {['S.No', 'Product Name', 'SKU', 'Total Stock', 'Current Stock', 'Out of Delivery', 'Missing'].map((h, i) => (
                    <th key={h} style={{ ...tHead, textAlign: i >= 3 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.productId}>
                    <td style={tCell}>{i + 1}</td>
                    <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{r.particulars || '—'}</td>
                    <td style={tCell}>{r.sku || '—'}</td>
                    <td style={{ ...tCell, textAlign: 'right' }}>{r.totalStock}</td>
                    <td style={{ ...tCell, textAlign: 'right' }}>{r.currentStock}</td>
                    <td style={{ ...tCell, textAlign: 'right' }}>
                      <CountBadge
                        count={r.outOfDeliveryQty}
                        tone="amber"
                        onClick={() => setPopup({
                          title: `${r.particulars || 'Product'} — Out of delivery`,
                          lines: r.outOfDeliveryDeliveries,
                          qtyLabel: 'Out qty',
                        })}
                      />
                    </td>
                    <td style={{ ...tCell, textAlign: 'right' }}>
                      <CountBadge
                        count={r.missingQty}
                        tone="rose"
                        onClick={() => setPopup({
                          title: `${r.particulars || 'Product'} — Missing`,
                          lines: r.missingDeliveries,
                          qtyLabel: 'Missing',
                        })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeliveryListModal
        title={popup?.title || ''}
        lines={popup?.lines || null}
        qtyLabel={popup?.qtyLabel || 'Qty'}
        onClose={() => setPopup(null)}
      />
    </div>
  )
}
