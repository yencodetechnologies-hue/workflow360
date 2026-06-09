import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReportFiltersBar } from '../components/reports/ReportFiltersBar'
import { formatNumber } from '../lib/format'
import { Badge } from '../components/ui/Badge'
import { StatCard } from '../components/ui/StatCard'
import { apiFetch } from '../lib/api'
import { getToken, useAuth } from '../auth/store'
import { useReportFilters } from '../hooks/useReportFilters'
import type {
  BillerReturnRow,
  GodownIssueRow,
  IssueDeliveryRow,
  ProductReturnRow,
  ReportTab,
} from '../types/reports'

// -- constants --------------------------------------------------------------

const MAIN_TABS: { id: ReportTab; label: string }[] = [
  { id: 'issues-godown', label: 'Missing & damage' },
]

const ISSUE_SUB_TABS: { id: ReportTab; label: string }[] = [
  { id: 'issues-godown', label: 'By godown' },
  { id: 'issues-biller', label: 'Missing by biller' },
  { id: 'issues-delivery', label: 'By delivery' },
]

const ISSUE_TABS = new Set<ReportTab>(['issues-godown', 'issues-biller', 'issues-delivery'])

// -- helpers ----------------------------------------------------------------

function formatCurrency(n: number) {
  return `?${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function badgeVariant(status: string) {
  if (status === 'PROCESSED' || status === 'UPCOMING') return 'green'
  if (status === 'OUT_FOR_DELIVERY' || status === 'DISPATCHED') return 'green'
  if (status === 'PACKED') return 'slate'
  if (status === 'RETURN_PICKUP') return 'amber'
  if (status === 'COMPLETED') return 'slate'
  return 'amber'
}

function formatDeliveryDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// -- shared inline table styles ---------------------------------------------

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
  padding: '13px 14px',
  fontSize: 13,
  color: '#374151',
  borderBottom: '1px solid #f1f5f9',
  verticalAlign: 'middle',
}

// -- reusable card ----------------------------------------------------------

function ReportCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e8eaf0',
      borderRadius: 14,
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  )
}

function CardHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// -- pill tab button --------------------------------------------------------

function PillTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 16px',
        borderRadius: 20,
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        border: active ? 'none' : '1px solid #e2e8f0',
        background: active ? '#059669' : '#fff',
        color: active ? '#fff' : '#64748b',
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.background = '#ecfdf5'
          el.style.color = '#059669'
          el.style.borderColor = '#a7f3d0'
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
      {label}
    </button>
  )
}

// -- sub-pill tab (smaller, for issue sub-tabs) -----------------------------

function SubPillTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 13px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        border: active ? 'none' : '1px solid #e2e8f0',
        background: active ? '#10b981' : '#fff',
        color: active ? '#fff' : '#64748b',
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.background = '#ecfdf5'
          el.style.color = '#059669'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.background = '#fff'
          el.style.color = '#64748b'
        }
      }}
    >
      {label}
    </button>
  )
}

// -- empty state ------------------------------------------------------------

function Empty({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ padding: '40px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{title}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

// -- product lines expandable panel ----------------------------------------

function ProductLinesPanel({ row }: { row: IssueDeliveryRow }) {
  if (!row.productMissing.length && !row.productDamaged.length) return null
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
      background: '#f8fafc', borderRadius: 8, padding: 16,
    }}>
      {[
        { label: 'Missing products', items: row.productMissing },
        { label: 'Damaged products', items: row.productDamaged },
      ].map(({ label, items }) => (
        <div key={label}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{label}</div>
          {items.length ? items.map((p) => (
            <div key={p.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', paddingBottom: 6 }}>
              <span>{p.particulars || p.sku || p.productId}</span>
              <span style={{ fontWeight: 600 }}>qty {p.qty}</span>
            </div>
          )) : <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>None reported.</p>}
        </div>
      ))}
    </div>
  )
}

// -- issue delivery table ---------------------------------------------------

function IssueDeliveryTable({
  rows, expandedId, onToggleExpand,
}: {
  rows: IssueDeliveryRow[]
  expandedId: string | null
  onToggleExpand: (id: string | null) => void
}) {
  if (!rows.length) return <Empty title="No deliveries" sub="No deliveries match the selected filters." />
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
        <thead>
          <tr>
            {['Delivery','Date','Customer','Site','Godown','Status','Missing qty','Damage qty','Tags missing',''].map((h, i) => (
              <th key={i} style={{ ...tHead, textAlign: i >= 6 && i <= 8 ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <Fragment key={m.id}>
              <tr
                style={{ transition: 'background 0.12s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.4)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                <td style={tCell}>
                  <Link to={`/deliveries/${m.id}`} style={{ fontWeight: 600, color: '#059669', textDecoration: 'none' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
                  >{m.deliveryNo}</Link>
                </td>
                <td style={{ ...tCell, whiteSpace: 'nowrap' }}>{formatDeliveryDate(m.deliveryAt)}</td>
                <td style={{ ...tCell, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.customerName}</td>
                <td style={{ ...tCell, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.siteName || '?'}</td>
                <td style={{ ...tCell, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.godownName || '?'}</td>
                <td style={tCell}><Badge variant={badgeVariant(m.status)}>{m.status}</Badge></td>
                <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.missingQty)}</td>
                <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.damageQty)}</td>
                <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(m.missingTagCount ?? m.missingCount)}</td>
                <td style={{ ...tCell }}>
                  {(m.productMissing.length || m.productDamaged.length) ? (
                    <button
                      onClick={() => onToggleExpand(expandedId === m.id ? null : m.id)}
                      style={{
                        padding: '4px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                        background: '#fff', fontSize: 12, fontWeight: 600, color: '#059669',
                        cursor: 'pointer',
                      }}
                    >{expandedId === m.id ? 'Hide' : 'Products'}</button>
                  ) : null}
                </td>
              </tr>
              {expandedId === m.id && (
                <tr>
                  <td colSpan={10} style={{ padding: '0 14px 12px' }}>
                    <ProductLinesPanel row={m} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// -- missing report step indicator ------------------------------------------

function MissingStepper({ step, labels }: { step: 1 | 2 | 3; labels: [string, string, string] }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0, padding: '14px 20px',
      borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(180deg, #f8fafc 0%, #fff 100%)',
      flexWrap: 'wrap',
    }}>
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3
        const active = step === n
        const done = step > n
        return (
          <Fragment key={label}>
            {i > 0 ? (
              <div style={{ flex: '1 1 24px', height: 2, minWidth: 20, maxWidth: 48, background: done || active ? '#10b981' : '#e2e8f0', margin: '0 8px' }} />
            ) : null}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: active ? '#059669' : done ? '#d1fae5' : '#f1f5f9',
                color: active ? '#fff' : done ? '#059669' : '#94a3b8',
                fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{n}</div>
              <span style={{
                fontSize: 12, fontWeight: active ? 700 : 500,
                color: active ? '#0f172a' : '#64748b', whiteSpace: 'nowrap',
              }}>{label}</span>
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}

// -- missing orders table (per biller) --------------------------------------

function MissingOrdersTable({ rows }: { rows: IssueDeliveryRow[] }) {
  if (!rows.length) {
    return <Empty title="No missing orders" sub="This biller has no orders with missing items in the selected period." />
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
        <thead>
          <tr>
            {['Order', 'Date', 'Customer', 'Site', 'Status', 'Missing qty', 'Value (?)', 'Products'].map((h, i) => (
              <th key={h} style={{ ...tHead, textAlign: i >= 5 && i <= 6 ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id} style={{ transition: 'background 0.12s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.35)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            >
              <td style={tCell}>
                <Link to={`/deliveries/${m.id}`} style={{ fontWeight: 600, color: '#dc2626', textDecoration: 'none' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
                >{m.deliveryNo}</Link>
              </td>
              <td style={{ ...tCell, whiteSpace: 'nowrap' }}>{formatDeliveryDate(m.deliveryAt)}</td>
              <td style={{ ...tCell, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.customerName}</td>
              <td style={{ ...tCell, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.siteName || '?'}</td>
              <td style={tCell}><Badge variant={badgeVariant(m.status)}>{m.status}</Badge></td>
              <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(m.missingQty)}</td>
              <td style={{ ...tCell, textAlign: 'right' }}>{m.missingTotal != null ? formatCurrency(m.missingTotal) : '?'}</td>
              <td style={{ ...tCell, fontSize: 12, color: '#64748b', maxWidth: 180 }}>
                {m.productMissing.slice(0, 2).map((p) => p.particulars || p.sku).join(', ')}
                {m.productMissing.length > 2 ? ` +${m.productMissing.length - 2}` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// -- product missing table (per biller, with orders) ------------------------

function ProductMissingTable({
  rows,
  expandedId,
  onToggleExpand,
}: {
  rows: ProductReturnRow[]
  expandedId: string | null
  onToggleExpand: (id: string | null) => void
}) {
  if (!rows.length) {
    return <Empty title="No missing products" sub="No product-level missing data for this biller and period." />
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
        <thead>
          <tr>
            {['Product', 'SKU', 'Missing qty', 'Orders', ''].map((h, i) => (
              <th key={i} style={{ ...tHead, textAlign: i === 2 || i === 3 ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Fragment key={r.productId}>
              <tr
                style={{ transition: 'background 0.12s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{r.particulars || r.productId}</td>
                <td style={tCell}>{r.sku || '?'}</td>
                <td style={{ ...tCell, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatNumber(r.totalQty)}</td>
                <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(r.deliveryCount)}</td>
                <td style={tCell}>
                  {r.deliveries.length ? (
                    <button
                      onClick={() => onToggleExpand(expandedId === r.productId ? null : r.productId)}
                      style={{
                        padding: '4px 12px', borderRadius: 8, border: '1px solid #fecaca',
                        background: '#fff', fontSize: 12, fontWeight: 600, color: '#dc2626',
                        cursor: 'pointer',
                      }}
                    >{expandedId === r.productId ? 'Hide orders' : 'View orders'}</button>
                  ) : null}
                </td>
              </tr>
              {expandedId === r.productId && (
                <tr>
                  <td colSpan={5} style={{ padding: '0 14px 12px' }}>
                    <div style={{ background: '#fef2f2', borderRadius: 8, padding: 14, border: '1px solid #fecaca' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                        Missing orders for this product
                      </div>
                      {r.deliveries.map((d) => (
                        <div key={d.id} style={{
                          display: 'grid', gridTemplateColumns: '1fr auto', gap: 8,
                          fontSize: 12, color: '#374151', paddingBottom: 8,
                          borderBottom: '1px solid #fee2e2', marginBottom: 8,
                        }}>
                          <div>
                            <Link to={`/deliveries/${d.id}`} style={{ fontWeight: 600, color: '#dc2626', textDecoration: 'none' }}>
                              {d.deliveryNo}
                            </Link>
                            {d.customerName ? (
                              <span style={{ color: '#64748b', marginLeft: 8 }}>{d.customerName}</span>
                            ) : null}
                            {d.deliveryAt ? (
                              <span style={{ color: '#94a3b8', marginLeft: 8 }}>{formatDeliveryDate(d.deliveryAt)}</span>
                            ) : null}
                          </div>
                          <span style={{ fontWeight: 700, color: '#dc2626', whiteSpace: 'nowrap' }}>
                            qty {formatNumber(d.qty)}{d.note ? ` ? ${d.note}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// -- breadcrumb for biller drill-down ---------------------------------------

function BillerBreadcrumb({
  godownName,
  billerName,
  hideAllGodowns,
  onAllGodowns,
  onGodown,
}: {
  godownName?: string
  billerName?: string
  hideAllGodowns?: boolean
  onAllGodowns: () => void
  onGodown: () => void
}) {
  const linkStyle: React.CSSProperties = {
    background: 'none', border: 'none', padding: 0, fontSize: 13, fontWeight: 600,
    color: '#059669', cursor: 'pointer', textDecoration: 'underline',
  }
  const sep = <span style={{ color: '#94a3b8', margin: '0 6px' }}>/</span>
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
      {!hideAllGodowns ? (
        <button type="button" onClick={onAllGodowns} style={linkStyle}>All godowns</button>
      ) : null}
      {godownName ? (
        <>
          {!hideAllGodowns ? sep : null}
          {billerName ? (
            <button type="button" onClick={onGodown} style={linkStyle}>{godownName}</button>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{godownName}</span>
          )}
        </>
      ) : null}
      {billerName ? (
        <>
          {sep}
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{billerName}</span>
        </>
      ) : null}
    </div>
  )
}

// -- main component ---------------------------------------------------------

export function ReportsPage() {
  const auth = useAuth()
  const {
    date, dateTo, godownId, site, customerName, billerUserId, tab, godowns, sites, customers,
    filterQuery, dateQuery, setFilters, lockGodownFilter,
  } = useReportFilters()

  const resolvedTab = (MAIN_TABS.some((t) => t.id === tab) || ISSUE_TABS.has(tab as ReportTab) ? tab : 'issues-godown') as ReportTab
  const activeTab = resolvedTab
  const issueSubTab = ISSUE_TABS.has(activeTab) ? activeTab : 'issues-godown'
  const showIssueSection = ISSUE_TABS.has(activeTab) || activeTab === 'issues-godown'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [godownIssues, setGodownIssues] = useState<GodownIssueRow[] | null>(null)
  const [deliveryIssues, setDeliveryIssues] = useState<IssueDeliveryRow[] | null>(null)
  const [billerReturns, setBillerReturns] = useState<BillerReturnRow[] | null>(null)
  const [productReturns, setProductReturns] = useState<ProductReturnRow[] | null>(null)
  const [damageReturns, setDamageReturns] = useState<ProductReturnRow[] | null>(null)
  const [missingOrders, setMissingOrders] = useState<IssueDeliveryRow[] | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const isBillerRole = auth.status === 'authenticated' && auth.user.role === 'BILLER'
  const selectedGodownName = godowns.find((g) => g.id === godownId)?.name
  const selectedBillerName = useMemo(() => {
    if (isBillerRole && auth.status === 'authenticated') {
      return auth.user.contactName || auth.user.siteName || 'My returns'
    }
    return billerReturns?.find((b) => b.billerUserId === billerUserId)?.billerName || billerUserId
  }, [isBillerRole, auth, billerReturns, billerUserId])

  const showBillerGodowns = activeTab === 'issues-biller' && !godownId && !lockGodownFilter
  const showBillerList = activeTab === 'issues-biller' && Boolean(godownId) && !billerUserId && !isBillerRole
  const showProductList = activeTab === 'issues-biller' && Boolean(godownId) && Boolean(billerUserId)

  const godownsWithMissing = useMemo(
    () => (godownIssues || []).filter((g) => g.issueDeliveryCount > 0),
    [godownIssues],
  )

  const billerStep: 1 | 2 | 3 = showProductList ? 3 : showBillerList ? 2 : 1

  const selectedBillerStats = useMemo(() => {
    const b = billerReturns?.find((row) => row.billerUserId === billerUserId)
    if (b) return b
    if (!missingOrders?.length) return null
    return {
      missingOrderCount: missingOrders.filter((o) => o.missingQty > 0).length,
      damageOrderCount: missingOrders.filter((o) => o.damageQty > 0).length,
      missingQty: missingOrders.reduce((s, o) => s + o.missingQty, 0),
      damageQty: missingOrders.reduce((s, o) => s + o.damageQty, 0),
      missingTotal: missingOrders.reduce((s, o) => s + (o.missingTotal || 0), 0),
      damageTotal: missingOrders.reduce((s, o) => s + (o.damageTotal || 0), 0),
    }
  }, [billerReturns, billerUserId, missingOrders])

  useEffect(() => {
    if (!ISSUE_TABS.has(activeTab)) return
    const token = getToken(); if (!token) return
    setLoading(true); setError(null)

    const loadGodown = () =>
      apiFetch<GodownIssueRow[]>(`/reports/issues/by-godown?${dateQuery}limit=100${filterQuery}`, { token })
        .then(setGodownIssues).catch(() => setGodownIssues([]))
    const loadDelivery = () =>
      apiFetch<IssueDeliveryRow[]>(`/reports/issues/by-delivery?${dateQuery}limit=100${filterQuery}`, { token })
        .then(setDeliveryIssues).catch(() => setDeliveryIssues([]))

    const promises: Promise<void>[] = []
    if (activeTab === 'issues-godown' || (activeTab === 'issues-biller' && !godownId && !lockGodownFilter)) {
      promises.push(loadGodown())
    }
    if (activeTab === 'issues-delivery') promises.push(loadDelivery())
    Promise.all(promises).finally(() => setLoading(false))
  }, [date, dateTo, dateQuery, filterQuery, activeTab, godownId, site, lockGodownFilter])

  useEffect(() => {
    if (activeTab !== 'issues-biller') return
    const token = getToken(); if (!token) return

    if (showBillerList) {
      setLoading(true); setError(null); setProductReturns(null); setDamageReturns(null)
      apiFetch<BillerReturnRow[]>(`/reports/returns/by-biller?${dateQuery}godownId=${encodeURIComponent(godownId)}&onlyMissing=0${filterQuery.replace(/&?billerUserId=[^&]*/g, '')}`, { token })
        .then(setBillerReturns)
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : 'Failed to load biller report')
          setBillerReturns([])
        })
        .finally(() => setLoading(false))
      return
    }

    if (showProductList) {
      setLoading(true); setError(null)
      const fq = filterQuery.includes('billerUserId')
        ? filterQuery
        : `${filterQuery}&billerUserId=${encodeURIComponent(billerUserId)}`
      const missingQ = `/reports/returns/by-product?${dateQuery}godownId=${encodeURIComponent(godownId)}${fq}&metric=missing`
      const damageQ = `/reports/returns/by-product?${dateQuery}godownId=${encodeURIComponent(godownId)}${fq}&metric=damage`
      const ordersQ = `/reports/issues/by-delivery?${dateQuery}godownId=${encodeURIComponent(godownId)}${fq}&limit=200`
      Promise.all([
        apiFetch<ProductReturnRow[]>(missingQ, { token }),
        apiFetch<ProductReturnRow[]>(damageQ, { token }),
        apiFetch<IssueDeliveryRow[]>(ordersQ, { token }),
      ])
        .then(([missing, damage, orders]) => {
          setProductReturns(missing)
          setDamageReturns(damage)
          setMissingOrders(orders.filter((o) => o.missingQty > 0 || o.damageQty > 0))
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : 'Failed to load issue report')
          setProductReturns([])
          setDamageReturns([])
          setMissingOrders([])
        })
        .finally(() => setLoading(false))
      return
    }

    setBillerReturns(null)
    setProductReturns(null)
    setDamageReturns(null)
    setMissingOrders(null)
  }, [activeTab, date, dateTo, dateQuery, filterQuery, godownId, billerUserId, showBillerList, showProductList])

  const onMainTab = (id: ReportTab) => {
    if (id === 'issues-godown') {
      setFilters({ tab: ISSUE_TABS.has(activeTab) ? activeTab : 'issues-godown' })
      return
    }
    setFilters({ tab: id })
  }

  // -- shared table styles ------------------------------------------------

  const tableWrap: React.CSSProperties = { overflowX: 'auto' }
  const tableEl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 800 }

  return (
    // AppShell provides 20px 24px padding
    <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* -- PAGE HEADER -- */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Reports</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
          Daily deliveries, missing and damage by godown, biller, delivery, or customer, and stock.
        </p>
      </div>

      {/* -- FILTERS CARD -- */}
      <ReportCard>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f0f9' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Filters</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Narrow results by date, warehouse and site.</div>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <ReportFiltersBar
            godowns={godowns}
            sites={sites}
            customers={customers}
            godownId={godownId}
            site={site}
            customerName={customerName}
            onGodownChange={(id) => setFilters({
              godownId: id,
              billerUserId: activeTab === 'issues-biller' && !isBillerRole ? '' : billerUserId,
            })}
            onSiteChange={(s) => setFilters({ site: s })}
            onCustomerChange={(name) => setFilters({ customerName: name })}
            showDate
            showDateTo={showIssueSection}
            date={date}
            dateTo={dateTo}
            onDateChange={(d) => setFilters({ date: d })}
            onDateToChange={(d) => setFilters({ dateTo: d })}
            hideGodownFilter={lockGodownFilter}
          />
        </div>
      </ReportCard>

      {/* -- MAIN TAB ROW -- */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {MAIN_TABS.map((t) => (
          <PillTab
            key={t.id}
            label={t.label}
            active={activeTab === t.id || (t.id === 'issues-godown' && ISSUE_TABS.has(activeTab))}
            onClick={() => onMainTab(t.id)}
          />
        ))}
      </div>

      {/* -- ISSUE SUB TABS -- */}
      {showIssueSection && (
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
          paddingLeft: 12, borderLeft: '2px solid #a7f3d0',
        }}>
          {ISSUE_SUB_TABS.map((t) => (
            <SubPillTab
              key={t.id}
              label={t.label}
              active={issueSubTab === t.id}
              onClick={() => setFilters({ tab: t.id })}
            />
          ))}
        </div>
      )}

      {/* -- ERROR -- */}
      {error && (
        <div style={{
          padding: '10px 16px', borderRadius: 10, background: '#fef2f2',
          color: '#b91c1c', fontSize: 13, border: '1px solid #fecaca',
        }}>{error}</div>
      )}

      {/* -- LOADING SPINNER -- */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '3px solid #e2e8f0', borderTopColor: '#10b981',
            animation: 'spin 0.7s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ----------------------------------------------
          ISSUES ? BY BILLER (drill-down)
      ---------------------------------------------- */}
      {activeTab === 'issues-biller' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ReportCard>
            <CardHead
              title="Issues by biller"
              sub="Drill down from godown → biller → missing/damage orders and products."
            />
            <MissingStepper
              step={billerStep}
              labels={['Select godown', 'Biller issue summary', 'Orders & products']}
            />
            <BillerBreadcrumb
              godownName={selectedGodownName}
              billerName={showProductList ? selectedBillerName : undefined}
              hideAllGodowns={lockGodownFilter}
              onAllGodowns={() => setFilters({ godownId: '', billerUserId: '' })}
              onGodown={() => setFilters({ billerUserId: '' })}
            />

            {showBillerGodowns && (
              <>
                <div style={{ padding: '0 20px 8px' }}>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '8px 0 0' }}>
                    Warehouses with biller-reported missing or damage in the selected period.
                  </p>
                </div>
                {godownsWithMissing.length ? (
                  <div style={tableWrap}>
                    <table style={tableEl}>
                      <thead>
                        <tr>
                          {['Godown', 'Issue orders', 'Missing qty', 'Damage qty', ''].map((h, i) => (
                            <th key={i} style={{ ...tHead, textAlign: i >= 1 && i <= 3 ? 'right' : 'left' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {godownsWithMissing.map((g) => (
                          <tr key={g.godownId} style={{ transition: 'background 0.12s', cursor: 'pointer' }}
                            onClick={() => setFilters({ godownId: g.godownId })}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.35)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                          >
                            <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{g.godownName || g.godownId}</td>
                            <td style={{ ...tCell, textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>{formatNumber(g.issueDeliveryCount)}</td>
                            <td style={{ ...tCell, textAlign: 'right', fontWeight: g.missingQty > 0 ? 600 : undefined, color: g.missingQty > 0 ? '#dc2626' : '#64748b' }}>{formatNumber(g.missingQty)}</td>
                            <td style={{ ...tCell, textAlign: 'right', fontWeight: g.damageQty > 0 ? 600 : undefined, color: g.damageQty > 0 ? '#d97706' : '#64748b' }}>{formatNumber(g.damageQty)}</td>
                            <td style={tCell}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>View billers →</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : !loading ? (
                  <Empty title="No issues at godowns" sub="No biller-reported missing or damage for the selected period." />
                ) : null}
              </>
            )}

            {showBillerList && (
              <>
                <CardHead title="Billers with issues" sub={selectedGodownName || godownId} />
                {billerReturns?.length ? (
                  <div style={tableWrap}>
                    <table style={{ ...tableEl, minWidth: 800 }}>
                      <thead>
                        <tr>
                          {['Biller', 'Site / office', 'Missing orders', 'Missing qty', 'Damage qty', 'Value (₹)', ''].map((h, i) => (
                            <th key={i} style={{ ...tHead, textAlign: i >= 2 && i <= 5 ? 'right' : 'left' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {billerReturns.map((b) => (
                          <tr key={b.billerUserId} style={{ transition: 'background 0.12s', cursor: 'pointer' }}
                            onClick={() => setFilters({ billerUserId: b.billerUserId })}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(254,242,242,0.35)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                          >
                            <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{b.billerName || b.billerUserId}</td>
                            <td style={{ ...tCell, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.siteName || '—'}</td>
                            <td style={{ ...tCell, textAlign: 'right', fontWeight: b.missingOrderCount > 0 ? 700 : undefined, color: b.missingOrderCount > 0 ? '#dc2626' : '#64748b' }}>{formatNumber(b.missingOrderCount)}</td>
                            <td style={{ ...tCell, textAlign: 'right', fontWeight: b.missingQty > 0 ? 700 : undefined, color: b.missingQty > 0 ? '#dc2626' : '#64748b' }}>{formatNumber(b.missingQty)}</td>
                            <td style={{ ...tCell, textAlign: 'right', fontWeight: b.damageQty > 0 ? 700 : undefined, color: b.damageQty > 0 ? '#d97706' : '#64748b' }}>{formatNumber(b.damageQty)}</td>
                            <td style={{ ...tCell, textAlign: 'right' }}>{b.missingTotal + b.damageTotal > 0 ? formatCurrency(b.missingTotal + b.damageTotal) : '—'}</td>
                            <td style={tCell}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>View details →</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : !loading ? (
                  <Empty title="No billers with issues" sub="No biller-reported missing or damage for this godown and period." />
                ) : null}
              </>
            )}
          </ReportCard>

          {showProductList && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <StatCard
                  label="Missing qty"
                  value={formatNumber(selectedBillerStats?.missingQty ?? 0)}
                  tone="bad"
                />
                <StatCard
                  label="Damage qty"
                  value={formatNumber(selectedBillerStats?.damageQty ?? 0)}
                  tone="warn"
                />
                <StatCard
                  label="Missing value"
                  value={formatCurrency(selectedBillerStats?.missingTotal ?? 0)}
                  tone="bad"
                />
                <StatCard
                  label="Damage value"
                  value={formatCurrency(selectedBillerStats?.damageTotal ?? 0)}
                  tone="warn"
                />
              </div>

              <ReportCard>
                <CardHead
                  title="Issue orders"
                  sub={`${selectedBillerName}${selectedGodownName ? ` → ${selectedGodownName}` : ''} → deliveries with biller-reported missing or damage`}
                />
                <div style={{ padding: '0 0 4px' }}>
                  {missingOrders ? <MissingOrdersTable rows={missingOrders} /> : null}
                </div>
              </ReportCard>

              <ReportCard>
                <CardHead
                  title="Missing by product"
                  sub="Products reported missing — expand to see which orders"
                />
                <div style={{ padding: '0 0 4px' }}>
                  {productReturns ? (
                    <ProductMissingTable
                      rows={productReturns}
                      expandedId={expandedId}
                      onToggleExpand={setExpandedId}
                    />
                  ) : !loading ? (
                    <Empty title="No missing products" sub="No product-level missing data for this biller." />
                  ) : null}
                </div>
              </ReportCard>

              <ReportCard>
                <CardHead
                  title="Damage by product"
                  sub="Products reported damaged — expand to see which orders"
                />
                <div style={{ padding: '0 0 4px' }}>
                  {damageReturns ? (
                    <ProductMissingTable
                      rows={damageReturns}
                      expandedId={expandedId}
                      onToggleExpand={setExpandedId}
                    />
                  ) : !loading ? (
                    <Empty title="No damaged products" sub="No product-level damage data for this biller." />
                  ) : null}
                </div>
              </ReportCard>
            </>
          )}
        </div>
      )}

      {/* ----------------------------------------------
          ISSUES ? BY GODOWN
      ---------------------------------------------- */}
      {activeTab === 'issues-godown' && (
        <ReportCard>
          <CardHead title="Missing & damage by godown" />
          {godownIssues?.length ? (
            <div style={tableWrap}>
              <table style={{ ...tableEl, minWidth: 980 }}>
                <thead>
                  <tr>
                    {['Godown','Deliveries','With issues','Missing qty','Missing value','Damage qty','Damage value','Tags missing',''].map((h, i) => (
                      <th key={i} style={{ ...tHead, textAlign: i >= 1 && i <= 7 ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {godownIssues.map((g) => (
                    <tr key={g.godownId} style={{ transition: 'background 0.12s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.4)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      <td style={{ ...tCell, fontWeight: 600, color: '#0f172a' }}>{g.godownName || g.godownId}</td>
                      <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(g.totalDeliveries)}</td>
                      <td style={{ ...tCell, textAlign: 'right', fontWeight: g.issueDeliveryCount > 0 ? 700 : undefined, color: g.issueDeliveryCount > 0 ? '#dc2626' : undefined }}>{formatNumber(g.issueDeliveryCount)}</td>
                      <td style={{ ...tCell, textAlign: 'right', fontWeight: g.missingQty > 0 ? 700 : undefined, color: g.missingQty > 0 ? '#dc2626' : undefined }}>{formatNumber(g.missingQty)}</td>
                      <td style={{ ...tCell, textAlign: 'right', color: g.missingTotal > 0 ? '#dc2626' : undefined }}>{g.missingTotal > 0 ? formatCurrency(g.missingTotal) : '—'}</td>
                      <td style={{ ...tCell, textAlign: 'right', fontWeight: g.damageQty > 0 ? 700 : undefined, color: g.damageQty > 0 ? '#d97706' : undefined }}>{formatNumber(g.damageQty)}</td>
                      <td style={{ ...tCell, textAlign: 'right', color: g.damageTotal > 0 ? '#d97706' : undefined }}>{g.damageTotal > 0 ? formatCurrency(g.damageTotal) : '—'}</td>
                      <td style={{ ...tCell, textAlign: 'right' }}>{formatNumber(g.missingTagCount)}</td>
                      <td style={tCell}>
                        <button
                          onClick={() => setFilters({ godownId: g.godownId, tab: 'issues-delivery' })}
                          style={{
                            padding: '4px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                            background: '#fff', fontSize: 12, fontWeight: 600,
                            color: '#059669', cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                        >View deliveries</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !loading ? (
            <div style={{ padding: '0 0 4px' }}>
              <Empty title="No godown data" sub="No deliveries in the selected period." />
            </div>
          ) : null}
        </ReportCard>
      )}

      {/* ----------------------------------------------
          ISSUES ? BY DELIVERY
      ---------------------------------------------- */}
      {activeTab === 'issues-delivery' && (
        <ReportCard>
          <CardHead title="Missing & damage by delivery" />
          <div style={{ padding: '0 0 4px' }}>
            {deliveryIssues ? (
              <IssueDeliveryTable rows={deliveryIssues} expandedId={expandedId} onToggleExpand={setExpandedId} />
            ) : !loading ? (
              <Empty title="No issue deliveries" sub="No missing or damage for this period and filters." />
            ) : null}
          </div>
        </ReportCard>
      )}

    </div>
  )
}