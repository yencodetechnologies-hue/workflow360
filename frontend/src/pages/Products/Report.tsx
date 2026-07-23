import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { getToken } from '../../auth/store'
import { Modal } from '../../components/ui/Modal'
import type { ProductSummaryDeliveryLine, ProductSummaryRow } from '../../types/reports'

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const tHead: React.CSSProperties = {
  padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#94a3b8',
  textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left',
  whiteSpace: 'nowrap', background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
}
const tCell: React.CSSProperties = {
  padding: '13px 14px', fontSize: 13, color: '#374151',
  borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle',
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

function DeliveryListModal({
  title, lines, onClose,
}: {
  title: string
  lines: ProductSummaryDeliveryLine[] | null
  onClose: () => void
}) {
  return (
    <Modal open={!!lines} title={title} onClose={onClose}>
      {!lines || lines.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>No deliveries found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lines.map((l) => (
            <div key={`${l.id}-${l.qty}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              padding: '10px 12px', borderRadius: 10, border: '1px solid #f1f5f9', background: '#f8fafc',
            }}>
              <div style={{ minWidth: 0 }}>
                <Link to={`/deliveries/${l.id}`} style={{ fontWeight: 600, color: '#059669', textDecoration: 'none', fontSize: 13 }}>
                  {l.deliveryNo}
                </Link>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.customerName || '—'} · {formatDate(l.deliveryAt)}
                </div>
                {l.note && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{l.note}</div>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{l.qty}</div>
            </div>
          ))}
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
  const [popup, setPopup] = useState<{ title: string; lines: ProductSummaryDeliveryLine[] } | null>(null)

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
                        count={r.outOfDeliveryDeliveries.length}
                        tone="amber"
                        onClick={() => setPopup({ title: `${r.particulars || 'Product'} — Out of delivery`, lines: r.outOfDeliveryDeliveries })}
                      />
                    </td>
                    <td style={{ ...tCell, textAlign: 'right' }}>
                      <CountBadge
                        count={r.missingDeliveries.length}
                        tone="rose"
                        onClick={() => setPopup({ title: `${r.particulars || 'Product'} — Missing`, lines: r.missingDeliveries })}
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
        onClose={() => setPopup(null)}
      />
    </div>
  )
}
