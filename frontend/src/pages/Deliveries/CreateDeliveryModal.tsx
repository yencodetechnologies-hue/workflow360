import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'
import { isDeliveryDeletable } from '../../lib/deliveryStatus'
import type { GodownRow } from '../Godowns/List'

type UserRow = {
  id: string; email?: string; role: string; siteName?: string;
  siteAddress?: string; contactPhone?: string; contactName?: string; active?: boolean
}
type CatalogRow = { productId: string; enabled: boolean; particulars?: string; sku?: string }
type StockedProduct = CatalogRow & { stockQty: number }

function lineKey(godownId: string, productId: string) { return `${godownId}:${productId}` }
function godownBranch(g: GodownRow): string {
  const city = g.city?.trim()
  if (city) return city
  const loc = g.location?.trim()
  if (loc) return loc
  return 'Other'
}

const STEPS = [
  { id: 1, title: 'Biller',    subtitle: 'Customer account' },
  { id: 2, title: 'Godowns',   subtitle: 'Select sources' },
  { id: 3, title: 'Products',  subtitle: 'Per godown stock' },
  { id: 4, title: 'Schedule',  subtitle: 'Delivery details' },
] as const

export type CreateDeliveryPrefill = {
  orderId?: string; customerName?: string; siteName?: string;
  siteAddress?: string; contactPhone?: string; deliveryAt?: string;
  returnExpectedAt?: string; fromGodownId?: string
}

type DeliveryDetailForEdit = {
  id: string; billerUserId?: string; customerName: string; siteName?: string;
  siteAddress?: string; contactPhone?: string; fromGodownId: string;
  deliveryAt: string; returnExpectedAt?: string; vehicleLabel?: string; status: string;
  dispatchedTagIds?: string[]; pickedUpTagIds?: string[]; deliveredTagIds?: string[];
  returnPickedUpTagIds?: string[]; returnedTagIds?: string[];
  damagedTagIds?: string[]; lostTagIds?: string[];
  lines: Array<{ productId: string; godownId?: string; qty: number }>
}

type Props = {
  open: boolean; onClose: () => void; onCreated: () => void;
  onUpdated?: () => void; deliveryId?: string | null; prefill?: CreateDeliveryPrefill | null
}

// ── Step icons ──────────────────────────────────────────────────────────────
function StepIcon({ step }: { step: number }) {
  const s = { stroke: 'currentColor', strokeWidth: '1.7', fill: 'none' } as const
  if (step === 1) return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" strokeLinecap="round" /></svg>
  if (step === 2) return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><path d="M4 9.5 12 5l8 4.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5Z" /><path d="M9 21V12h6v9" /></svg>
  if (step === 3) return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><path d="M7 7.5 12 5l5 2.5v5L12 15l-5-2.5v-5Z" /><path d="M12 15v6M7 12.5 12 15l5-2.5" /></svg>
  return <svg width="20" height="20" viewBox="0 0 24 24" {...s}><path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" /><circle cx="18" cy="17" r="3" /></svg>
}

function CheckIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 9.5 17 19 7" /></svg>
}

function CopyIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
}

// ── Qty stepper ─────────────────────────────────────────────────────────────
function QtyStepper({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  const clamp = (n: number) => Math.max(0, Math.min(max, n))
  const btn: React.CSSProperties = {
    width: 34, height: 34, border: 'none', background: 'none', cursor: 'pointer',
    fontSize: 18, color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, transition: 'background 0.15s',
  }
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
        <button type="button" style={{ ...btn, opacity: value <= 0 ? 0.3 : 1 }} disabled={value <= 0} onClick={() => onChange(clamp(value - 1))}>−</button>
        <input
          type="number" min={0} max={max} value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
          style={{ width: 52, height: 34, border: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#0f172a', background: '#f8fafc', outline: 'none', fontFamily: 'inherit' }}
        />
        <button type="button" style={{ ...btn, opacity: value >= max ? 0.3 : 1 }} disabled={value >= max} onClick={() => onChange(clamp(value + 1))}>+</button>
      </div>
      <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>In stock: {max}</span>
    </div>
  )
}

// ── Wizard stepper UI ────────────────────────────────────────────────────────
function WizardStepper({ step }: { step: number }) {
  const progress = ((step - 1) / (STEPS.length - 1)) * 100
  return (
    <div style={{ marginBottom: 24 }}>
      {/* progress bar */}
      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #7F77DD, #534AB7)', borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
      {/* step indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
        {STEPS.map((s) => {
          const done = step > s.id
          const active = step === s.id
          return (
            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              {/* circle */}
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: done || active ? 'linear-gradient(135deg, #7F77DD, #534AB7)' : '#fff',
                border: done || active ? 'none' : '2px solid #e2e8f0',
                color: done || active ? '#fff' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? '0 4px 14px rgba(83,74,183,0.35)' : 'none',
                outline: active ? '3px solid rgba(83,74,183,0.15)' : 'none',
                transition: 'all 0.25s',
              }}>
                {done ? <CheckIcon /> : <StepIcon step={s.id} />}
              </div>
              <span style={{ marginTop: 8, fontSize: 12, fontWeight: active || done ? 700 : 500, color: active || done ? '#0f172a' : '#94a3b8' }}>
                {s.title}
              </span>
              <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{s.subtitle}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h3>
      <p style={{ marginTop: 3, fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>{description}</p>
    </div>
  )
}

function LinkCard({ label, description, url }: { label: string; description: string; url: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, background: '#f8fafc', padding: 16, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{label}</div>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>{description}</p>
        </div>
        <button
          onClick={() => { void navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 2000) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            borderRadius: 8, border: '1px solid #e2e8f0', background: copied ? '#f0fdf4' : '#fff',
            fontSize: 12, fontWeight: 600, color: copied ? '#16a34a' : '#374151', cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          <CopyIcon />{copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: 8, padding: '8px 12px', fontFamily: 'monospace', fontSize: 11, color: '#475569', wordBreak: 'break-all' }}>
        {url}
      </div>
    </div>
  )
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div style={{ borderRadius: 10, background: '#F0EFFD', border: '1px solid #CECBF6', padding: '8px 12px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#534AB7' }}>{label}</div>
      <div style={{ marginTop: 2, fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )
}

function toDatetimeLocalValue(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 16)
}

// ── Shared input style ────────────────────────────────────────────────────────
const fieldInp: React.CSSProperties = {
  width: '100%', height: 38, padding: '0 12px',
  border: '1px solid #e2e8f0', borderRadius: 9,
  fontSize: 13, color: '#111827', background: '#f9fafb',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function CreateDeliveryModal({ open, onClose, onCreated, onUpdated, deliveryId, prefill }: Props) {
  const auth = useAuth()
  const nav  = useNavigate()

  const [continueEditId,    setContinueEditId]    = useState<string | null>(null)
  const effectiveEditId = deliveryId ?? continueEditId
  const isEditMode = !!effectiveEditId

  const [step,              setStep]              = useState(1)
  const [editLoading,       setEditLoading]       = useState(false)
  const [editMetadataOnly,  setEditMetadataOnly]  = useState(false)
  const [billers,           setBillers]           = useState<UserRow[]>([])
  const [godowns,           setGodowns]           = useState<GodownRow[]>([])
  const [productSearch,     setProductSearch]     = useState('')
  const [billerId,          setBillerId]          = useState('')
  const [selectedGodownIds, setSelectedGodownIds] = useState<string[]>([])
  const [activeGodownId,    setActiveGodownId]    = useState('')
  const [godownProducts,    setGodownProducts]    = useState<Record<string, StockedProduct[]>>({})
  const [productsLoading,   setProductsLoading]   = useState(false)
  const [lineQty,           setLineQty]           = useState<Record<string, number>>({})
  const [customerName,      setCustomerName]      = useState('')
  const [deliveryAt,        setDeliveryAt]        = useState('')
  const [returnExpectedAt,  setReturnExpectedAt]  = useState('')
  const [vehicleLabel,      setVehicleLabel]      = useState('')
  const [siteName,          setSiteName]          = useState('')
  const [siteAddress,       setSiteAddress]       = useState('')
  const [contactPhone,      setContactPhone]      = useState('')
  const [createBusy,        setCreateBusy]        = useState(false)
  const [createLinks,       setCreateLinks]       = useState<{ deliveryVerifyUrl: string; billerReturnUrl: string; id: string } | null>(null)
  const [createBillerMode,  setCreateBillerMode]  = useState(false)
  const [newBiller,         setNewBiller]         = useState({ siteName: '', siteAddress: '', contactName: '', contactPhone: '', email: '' })
  const [billerCreateBusy,  setBillerCreateBusy]  = useState(false)
  const [branchFilter,      setBranchFilter]      = useState('')
  const [createGodownOpen,  setCreateGodownOpen]  = useState(false)
  const [newGodown,         setNewGodown]         = useState({ name: '', code: '', address: '', mobile: '', location: '', city: '', password: '' })
  const [godownCreateBusy,  setGodownCreateBusy]  = useState(false)
  const [wizardError,       setWizardError]       = useState<string | null>(null)
  const [orderId,           setOrderId]           = useState<string | undefined>()

  const canCreate       = auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')
  const canCreateBiller = auth.status === 'authenticated' && auth.user.role === 'ADMIN'
  const canCreateGodown = auth.status === 'authenticated' && auth.user.role === 'ADMIN'

  const resetWizard = () => {
    setStep(1); setBillerId(''); setSelectedGodownIds([]); setActiveGodownId('')
    setGodownProducts({}); setProductsLoading(false); setLineQty({}); setProductSearch('')
    setCustomerName(''); setDeliveryAt(''); setReturnExpectedAt(''); setVehicleLabel('')
    setSiteName(''); setSiteAddress(''); setContactPhone(''); setCreateLinks(null)
    setCreateBillerMode(false); setNewBiller({ siteName: '', siteAddress: '', contactName: '', contactPhone: '', email: '' })
    setBranchFilter(''); setCreateGodownOpen(false)
    setNewGodown({ name: '', code: '', address: '', mobile: '', location: '', city: '', password: '' })
    setWizardError(null); setOrderId(undefined)
  }

  useEffect(() => {
    if (!open || !prefill) return
    if (prefill.orderId) setOrderId(prefill.orderId)
    if (prefill.customerName) setCustomerName(prefill.customerName)
    if (prefill.siteName) setSiteName(prefill.siteName)
    if (prefill.siteAddress) setSiteAddress(prefill.siteAddress)
    if (prefill.contactPhone) setContactPhone(prefill.contactPhone)
    if (prefill.deliveryAt) { const d = new Date(prefill.deliveryAt); if (!isNaN(d.getTime())) setDeliveryAt(d.toISOString().slice(0, 16)) }
    if (prefill.returnExpectedAt) { const d = new Date(prefill.returnExpectedAt); if (!isNaN(d.getTime())) setReturnExpectedAt(d.toISOString().slice(0, 16)) }
    if (prefill.fromGodownId) { setSelectedGodownIds([prefill.fromGodownId]); setActiveGodownId(prefill.fromGodownId) }
  }, [open, prefill])

  const createGodownInline = async () => {
    const token = getToken()
    if (!token || !canCreateGodown) return
    if (!newGodown.name.trim() || !newGodown.code.trim() || !newGodown.mobile.trim() || newGodown.password.length < 6) {
      setWizardError('Godown name, code, mobile, and password (min 6) are required'); return
    }
    setGodownCreateBusy(true); setWizardError(null)
    try {
      const created = await apiFetch<GodownRow>('/godowns', { token, method: 'POST', body: JSON.stringify({ name: newGodown.name.trim(), code: newGodown.code.trim(), address: newGodown.address.trim() || undefined, mobile: newGodown.mobile.trim(), location: newGodown.location.trim() || undefined, city: newGodown.city.trim() || undefined, password: newGodown.password }) })
      setGodowns((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setBranchFilter(godownBranch(created))
      setSelectedGodownIds((prev) => prev.includes(created.id) ? prev : [...prev, created.id])
      setActiveGodownId(created.id); void loadGodownProducts(created.id)
      setCreateGodownOpen(false); setNewGodown({ name: '', code: '', address: '', mobile: '', location: '', city: '', password: '' })
    } catch (e: unknown) {
      setWizardError(e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Create godown failed')
    } finally { setGodownCreateBusy(false) }
  }

  const handleClose = () => { onClose(); setContinueEditId(null); if (createLinks) resetWizard() }

  const loadDeliveryForEdit = async (id: string) => {
    const token = getToken(); if (!token) return
    setEditLoading(true); setWizardError(null)
    try {
      const d = await apiFetch<DeliveryDetailForEdit>(`/deliveries/${id}`, { token })
      setBillerId(d.billerUserId || ''); setCustomerName(d.customerName)
      setSiteName(d.siteName || ''); setSiteAddress(d.siteAddress || '')
      setContactPhone(d.contactPhone || ''); setVehicleLabel(d.vehicleLabel || '')
      setDeliveryAt(toDatetimeLocalValue(d.deliveryAt)); setReturnExpectedAt(toDatetimeLocalValue(d.returnExpectedAt))
      const godownIds = [...new Set(d.lines.map((l) => l.godownId || d.fromGodownId).filter((gid): gid is string => !!gid))]
      if (godownIds.length === 0 && d.fromGodownId) godownIds.push(d.fromGodownId)
      setSelectedGodownIds(godownIds); setActiveGodownId(godownIds[0] || '')
      const qty: Record<string, number> = {}
      for (const line of d.lines) { const gid = line.godownId || d.fromGodownId; if (!gid) continue; const key = lineKey(gid, line.productId); qty[key] = (qty[key] || 0) + line.qty }
      setLineQty(qty); setGodownProducts({}); setStep(1); setCreateLinks(null)
      const role = auth.status === 'authenticated' ? auth.user.role : ''
      setEditMetadataOnly(role === 'ADMIN' && !isDeliveryDeletable({ status: d.status, dispatchedTagIds: d.dispatchedTagIds, pickedUpTagIds: d.pickedUpTagIds, deliveredTagIds: d.deliveredTagIds, returnPickedUpTagIds: d.returnPickedUpTagIds, returnedTagIds: d.returnedTagIds, damagedTagIds: d.damagedTagIds, lostTagIds: d.lostTagIds }))
    } catch (e: unknown) {
      setWizardError(e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Failed to load delivery')
    } finally { setEditLoading(false) }
  }

  useEffect(() => { if (!open) return; if (!deliveryId) { resetWizard(); setContinueEditId(null); setEditMetadataOnly(false) } }, [open, deliveryId])
  useEffect(() => { if (!open || !effectiveEditId) return; void loadDeliveryForEdit(effectiveEditId) }, [open, effectiveEditId])

  useEffect(() => {
    if (!open || !canCreate) return
    const token = getToken(); if (!token) return
    apiFetch<UserRow[]>('/users/billers', { token })
      .then((rows) => { setBillers(rows); if (auth.status === 'authenticated' && auth.user.role === 'BILLER') setBillerId(auth.user.id) })
      .catch(() => setBillers([]))
    apiFetch<GodownRow[]>('/godowns', { token }).then(setGodowns).catch(() => {})
  }, [open, canCreate, auth])

  const loadGodownProducts = async (godownId: string) => {
    const token = getToken(); if (!token) return
    setProductsLoading(true)
    try {
      const [catalog, stock] = await Promise.all([
        apiFetch<CatalogRow[]>(`/godowns/${godownId}/products`, { token }),
        apiFetch<Array<{ godownId: string; productId: string; qty: number }>>(`/reports/stock?godownId=${encodeURIComponent(godownId)}`, { token }),
      ])
      const stockMap = new Map(stock.map((s) => [s.productId, s.qty]))
      const stocked: StockedProduct[] = catalog.filter((c) => c.enabled && (stockMap.get(c.productId) ?? 0) > 0).map((c) => ({ ...c, stockQty: stockMap.get(c.productId) ?? 0 })).sort((a, b) => (a.particulars || '').localeCompare(b.particulars || ''))
      setGodownProducts((prev) => ({ ...prev, [godownId]: stocked }))
    } catch { setGodownProducts((prev) => ({ ...prev, [godownId]: [] })) }
    finally { setProductsLoading(false) }
  }

  const addGodownToSelection = (id: string) => {
    if (selectedGodownIds.includes(id)) { selectGodownForProducts(id); return }
    void loadGodownProducts(id); setSelectedGodownIds((prev) => [...prev, id]); setActiveGodownId(id)
  }

  const toggleGodown = (id: string) => {
    setSelectedGodownIds((prev) => {
      if (prev.includes(id)) {
        setLineQty((q) => { const next = { ...q }; for (const k of Object.keys(next)) { if (k.startsWith(`${id}:`)) delete next[k] }; return next })
        setGodownProducts((gp) => { const next = { ...gp }; delete next[id]; return next })
        const next = prev.filter((x) => x !== id)
        if (activeGodownId === id) setActiveGodownId(next[0] || '')
        return next
      }
      void loadGodownProducts(id); setActiveGodownId(id); return [...prev, id]
    })
  }

  useEffect(() => {
    if (step !== 3 || !open || selectedGodownIds.length === 0) return
    for (const gid of selectedGodownIds) { if (!godownProducts[gid]) void loadGodownProducts(gid) }
    if (!activeGodownId || !selectedGodownIds.includes(activeGodownId)) setActiveGodownId(selectedGodownIds[0])
  }, [step, open, selectedGodownIds])

  useEffect(() => {
    const b = billers.find((x) => x.id === billerId)
    if (b) { setSiteName(b.siteName || ''); setContactPhone(b.contactPhone || ''); setCustomerName(b.siteName || b.contactName || b.email?.split('@')[0] || ''); setSiteAddress(b.siteAddress || '') }
  }, [billerId, billers])

  const linesPayload = useMemo(() => {
    const lines: Array<{ productId: string; godownId: string; qty: number }> = []
    for (const [key, qty] of Object.entries(lineQty)) {
      if (qty <= 0) continue; const sep = key.indexOf(':'); if (sep <= 0) continue
      lines.push({ godownId: key.slice(0, sep), productId: key.slice(sep + 1), qty })
    }
    return lines
  }, [lineQty])

  const totalUnits = useMemo(() => Object.values(lineQty).reduce((sum, q) => sum + (q > 0 ? q : 0), 0), [lineQty])
  const selectedBiller = billers.find((b) => b.id === billerId)
  const selectedGodownLabels = useMemo(() => selectedGodownIds.map((id) => godowns.find((g) => g.id === id)?.name).filter(Boolean).join(', '), [selectedGodownIds, godowns])
  const activeProducts = godownProducts[activeGodownId] ?? []
  const filteredCatalog = useMemo(() => { const q = productSearch.trim().toLowerCase(); if (!q) return activeProducts; return activeProducts.filter((c) => (c.particulars?.toLowerCase().includes(q) ?? false) || (c.sku?.toLowerCase().includes(q) ?? false)) }, [activeProducts, productSearch])
  const activeGodown = godowns.find((g) => g.id === activeGodownId)
  const pickedByGodownId = useMemo(() => { const m = new Map<string, { lines: number; units: number }>(); for (const line of linesPayload) { const cur = m.get(line.godownId) ?? { lines: 0, units: 0 }; cur.lines += 1; cur.units += line.qty; m.set(line.godownId, cur) }; return m }, [linesPayload])
  const selectGodownForProducts = (gid: string) => { setActiveGodownId(gid); setProductSearch(''); if (!godownProducts[gid]) void loadGodownProducts(gid) }
  const branchOptions = useMemo(() => Array.from(new Set(godowns.map(godownBranch))).sort((a, b) => a.localeCompare(b)), [godowns])
  const godownsInBranch = useMemo(() => branchFilter ? godowns.filter((g) => godownBranch(g) === branchFilter) : godowns, [godowns, branchFilter])
  const selectedInBranch = useMemo(() => selectedGodownIds.map((id) => godowns.find((g) => g.id === id)).filter((g): g is GodownRow => !!g && (!branchFilter || godownBranch(g) === branchFilter)), [selectedGodownIds, godowns, branchFilter])
  const availableInBranch = useMemo(() => godownsInBranch.filter((g) => !selectedGodownIds.includes(g.id)), [godownsInBranch, selectedGodownIds])

  const nextDisabled =
    (step === 1 && ((createBillerMode || billers.length === 0) ? !newBiller.siteName.trim() : !billerId)) ||
    (step === 2 && selectedGodownIds.length === 0) ||
    (step === 3 && linesPayload.length === 0) ||
    (step === 4 && (!customerName.trim() || !deliveryAt || createBusy))

  const handleNext = async () => {
    setWizardError(null)
    if (step === 1 && (createBillerMode || billers.length === 0) && !billerId) {
      if (!newBiller.siteName.trim()) return
      const token = getToken(); if (!token || !canCreateBiller) { setWizardError('Only admin can create a new biller'); return }
      setBillerCreateBusy(true)
      try {
        const created = await apiFetch<UserRow>('/users/billers', { token, method: 'POST', body: JSON.stringify({ siteName: newBiller.siteName.trim(), siteAddress: newBiller.siteAddress.trim() || undefined, contactName: newBiller.contactName.trim() || undefined, contactPhone: newBiller.contactPhone.trim() || undefined, email: newBiller.email.trim() || undefined, password: '123456' }) })
        setBillers((prev) => [...prev, created]); setBillerId(created.id); setCreateBillerMode(false); setStep(2)
      } catch (e: unknown) { setWizardError(e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Create biller failed') }
      finally { setBillerCreateBusy(false) }
      return
    }
    if (step < 4) { setStep((s) => s + 1); return }
    const token = getToken(); if (!token) return
    setCreateBusy(true)
    const body = { orderId: orderId || undefined, billerUserId: billerId, fromGodownId: selectedGodownIds[0], customerName: customerName.trim(), siteName: siteName.trim() || undefined, siteAddress: siteAddress.trim() || undefined, contactPhone: contactPhone.trim() || undefined, deliveryAt: new Date(deliveryAt).toISOString(), returnExpectedAt: returnExpectedAt ? new Date(returnExpectedAt).toISOString() : undefined, vehicleLabel: vehicleLabel.trim() || undefined, lines: linesPayload }
    try {
      const res = await apiFetch<{ id: string; deliveryNo: string; deliveryVerifyUrl: string; billerReturnUrl: string }>(isEditMode ? `/deliveries/${effectiveEditId}` : '/deliveries', { token, method: isEditMode ? 'PATCH' : 'POST', body: JSON.stringify(body) })
      setCreateLinks({ id: res.id, deliveryVerifyUrl: res.deliveryVerifyUrl, billerReturnUrl: res.billerReturnUrl })
      window.dispatchEvent(new CustomEvent('godown-stock-changed'))
      setGodownProducts({})
      if (isEditMode) onUpdated?.(); else onCreated()
    } catch (e: unknown) { setWizardError(e && typeof e === 'object' && 'message' in e ? String((e as any).message) : isEditMode ? 'Update failed' : 'Create failed') }
    finally { setCreateBusy(false) }
  }

  // ── Footer buttons ────────────────────────────────────────────────────────
  const footer = createLinks ? (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 }}>
      <Button variant="secondary" onClick={handleClose}>Close</Button>
      {!isEditMode && auth.status === 'authenticated' && auth.user.role === 'ADMIN' ? (
        <Button variant="secondary" onClick={() => { const id = createLinks.id; setCreateLinks(null); setContinueEditId(id); void loadDeliveryForEdit(id) }}>
          Edit delivery
        </Button>
      ) : null}
      <Button onClick={() => { nav(`/deliveries/${createLinks.id}`); handleClose() }}>
        Open delivery details
      </Button>
    </div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      {/* Cancel / Back */}
      <button
        onClick={() => { if (step <= 1) handleClose(); else setStep((s) => s - 1) }}
        style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        {step <= 1 ? 'Cancel' : '← Back'}
      </button>
      {/* Continue / Create */}
      <button
        disabled={nextDisabled}
        onClick={() => void handleNext()}
        style={{
          padding: '9px 24px', borderRadius: 10, border: 'none',
          background: nextDisabled ? '#AFA9EC' : 'linear-gradient(135deg, #7F77DD, #534AB7)',
          fontSize: 13, fontWeight: 700, color: '#fff',
          cursor: nextDisabled ? 'not-allowed' : 'pointer',
          boxShadow: nextDisabled ? 'none' : '0 4px 14px rgba(83,74,183,0.35)',
          fontFamily: 'inherit', transition: 'opacity 0.15s',
        }}
      >
        {step === 4
          ? isEditMode ? 'Update delivery' : 'Create delivery'
          : step === 1 && billerCreateBusy ? 'Saving…' : 'Continue'}
      </button>
    </div>
  )

  // ── shared inline input style for godown/biller create forms ──────────────
  const sInp = fieldInp

  return (
    <Modal open={open} onClose={handleClose} className="max-w-4xl overflow-hidden w-full" title={undefined} footer={footer}>
      {editLoading ? (
        <p style={{ padding: '64px 0', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>Loading delivery…</p>
      ) : createLinks ? (
        // ── Success screen ──────────────────────────────────────────────────
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #34d399, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(5,150,105,0.30)' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 9.5 17 19 7" /></svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{isEditMode ? 'Delivery updated' : 'Delivery created!'}</h2>
          <p style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>Share the links below with your delivery person and biller.</p>
          <div style={{ marginTop: 20, textAlign: 'left' }}>
            <LinkCard label="Delivery verify link" description="For the delivery person to confirm handover" url={createLinks.deliveryVerifyUrl} />
            <LinkCard label="Biller return link" description="For the biller to confirm equipment return" url={createLinks.billerReturnUrl} />
          </div>
        </div>
      ) : (
        <div>
          {/* ── Header ── */}
          <div style={{ margin: '-20px -24px 0', padding: '22px 24px 20px', background: 'linear-gradient(135deg, #534AB7 0%, #26215C 100%)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>{isEditMode ? 'Edit delivery' : 'New delivery'}</h2>
            <p style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.80)', margin: '4px 0 0' }}>
              {isEditMode
                ? editMetadataOnly ? 'Update schedule and customer details.' : 'Update biller, godowns, products, and schedule.'
                : 'Select godowns first, then pick in-stock products from each.'}
            </p>
          </div>

          <div style={{ marginTop: 22 }}>
            <WizardStepper step={step} />

            {/* error */}
            {wizardError && (
              <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#b91c1c', fontSize: 13, border: '1px solid #fecaca' }}>
                {wizardError}
              </div>
            )}

            {/* ══ STEP 1: BILLER ════════════════════════════════════════════ */}
            {step === 1 && (
              <div>
                <StepHeader title="Select biller" description="Choose the customer account for this delivery, or register a new biller." />

                {billers.length === 0 || createBillerMode ? (
                  // new biller form
                  <div style={{ border: '1px solid #CECBF6', borderRadius: 14, background: '#EEEDFE', padding: 18 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#534AB7', marginBottom: 14 }}>
                      {billers.length === 0 ? 'No billers yet — create one' : 'New biller'} <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>(default password: 123456)</span>
                    </p>
                    <div className="grid grid-cols-1 gap-3 mb-3 sm:grid-cols-2">
                      <Input label="Company / office name *" value={newBiller.siteName} onChange={(e) => setNewBiller((f) => ({ ...f, siteName: e.target.value }))} />
                      <Input label="Contact person" value={newBiller.contactName} onChange={(e) => setNewBiller((f) => ({ ...f, contactName: e.target.value }))} />
                      <Input label="Mobile number" value={newBiller.contactPhone} onChange={(e) => setNewBiller((f) => ({ ...f, contactPhone: e.target.value }))} />
                      <Input label="Email (optional)" value={newBiller.email} onChange={(e) => setNewBiller((f) => ({ ...f, email: e.target.value }))} placeholder="optional@example.com" />
                    </div>
                    <Input label="Address" value={newBiller.siteAddress} onChange={(e) => setNewBiller((f) => ({ ...f, siteAddress: e.target.value }))} />
                    {billers.length > 0 && (
                      <button onClick={() => setCreateBillerMode(false)} style={{ marginTop: 10, background: 'none', border: 'none', fontSize: 12, color: '#534AB7', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                        ← Select existing biller
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <Select label="Biller" value={billerId} onChange={(e) => setBillerId(e.target.value)}
                      options={[{ value: '', label: 'Select biller…' }, ...billers.map((b) => ({ value: b.id, label: `${b.siteName || b.contactName || 'Biller'}${b.contactPhone ? ` · ${b.contactPhone}` : ''}` }))]}
                    />
                    {selectedBiller && (
                      <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 4 }}>Selected</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{selectedBiller.siteName || selectedBiller.contactName || 'Biller'}</div>
                        {selectedBiller.siteAddress && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{selectedBiller.siteAddress}</div>}
                        {selectedBiller.contactPhone && <div style={{ fontSize: 12, color: '#534AB7', marginTop: 2, fontWeight: 600 }}>{selectedBiller.contactPhone}</div>}
                      </div>
                    )}
                    {canCreateBiller && !isEditMode && (
                      <button onClick={() => setCreateBillerMode(true)} style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: '1px dashed #AFA9EC', background: '#EEEDFE', fontSize: 12, fontWeight: 600, color: '#534AB7', cursor: 'pointer', fontFamily: 'inherit' }}>
                        + Register new biller
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══ STEP 2: GODOWNS ══════════════════════════════════════════ */}
            {step === 2 && (
              <div>
                <StepHeader title="Select godowns" description="Filter by branch, select godowns, or add a new godown if it is missing." />
                <div className="grid grid-cols-1 gap-3 mb-3 sm:grid-cols-2">
                  <Select label="Branch / location" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} options={[{ value: '', label: 'All branches' }, ...branchOptions.map((b) => ({ value: b, label: b }))]} />
                  {selectedGodownIds.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#F0EFFD', border: '1px solid #CECBF6', fontSize: 13, fontWeight: 700, color: '#534AB7' }}>
                        {selectedGodownIds.length} godown{selectedGodownIds.length > 1 ? 's' : ''} selected
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {godownsInBranch.map((g) => {
                    const selected = selectedGodownIds.includes(g.id)
                    return (
                      <button key={g.id} type="button" onClick={() => toggleGodown(g.id)} style={{
                        textAlign: 'left', borderRadius: 14, padding: 14, cursor: 'pointer', fontFamily: 'inherit',
                        border: selected ? '2px solid #534AB7' : '1px solid #e2e8f0',
                        background: selected ? '#EEEDFE' : '#fff',
                        boxShadow: selected ? '0 2px 10px rgba(83,74,183,0.12)' : 'none',
                        transition: 'all 0.15s',
                      }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: selected ? '#534AB7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: selected ? '#fff' : '#64748b' }}>
                            <StepIcon step={2} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{g.name}</div>
                            {g.code && <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>{g.code}</div>}
                            <div style={{ fontSize: 11, color: '#534AB7', fontWeight: 600, marginTop: 2 }}>Branch: {godownBranch(g)}</div>
                          </div>
                          {selected && (
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                              <CheckIcon />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {godownsInBranch.length === 0 && <p style={{ marginTop: 10, fontSize: 13, color: '#94a3b8' }}>No godowns in this branch.</p>}

                {canCreateGodown && !isEditMode && (
                  <div style={{ marginTop: 14, border: '1px dashed #AFA9EC', borderRadius: 12, background: '#EEEDFE', padding: 14 }}>
                    {!createGodownOpen ? (
                      <button onClick={() => setCreateGodownOpen(true)} style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: '#534AB7', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                        + Add new godown
                      </button>
                    ) : (
                      <>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>New godown</p>
                        <div className="grid grid-cols-1 gap-2 mb-2 sm:grid-cols-2">
                          <Input label="Name *" value={newGodown.name} onChange={(e) => setNewGodown((f) => ({ ...f, name: e.target.value }))} />
                          <Input label="Code *" value={newGodown.code} onChange={(e) => setNewGodown((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
                          <Input label="Branch / city *" value={newGodown.city} onChange={(e) => setNewGodown((f) => ({ ...f, city: e.target.value }))} placeholder="e.g. Chennai" />
                          <Input label="Location" value={newGodown.location} onChange={(e) => setNewGodown((f) => ({ ...f, location: e.target.value }))} />
                          <Input label="Mobile *" value={newGodown.mobile} onChange={(e) => setNewGodown((f) => ({ ...f, mobile: e.target.value }))} />
                          <Input label="Password *" type="password" value={newGodown.password} onChange={(e) => setNewGodown((f) => ({ ...f, password: e.target.value }))} />
                        </div>
                        <Input label="Address" value={newGodown.address} onChange={(e) => setNewGodown((f) => ({ ...f, address: e.target.value }))} />
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button onClick={() => setCreateGodownOpen(false)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                          <Button size="sm" loading={godownCreateBusy} onClick={() => void createGodownInline()}>Save godown</Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══ STEP 3: PRODUCTS ══════════════════════════════════════════ */}
            {step === 3 && (
              <div>
                <StepHeader title="Select products" description="Choose branch, switch godown on the left, pick products on the right." />
                {editMetadataOnly && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', fontSize: 13, color: '#92400e' }}>This delivery has scan activity. Quantity adjustments may be limited.</div>}
                {selectedGodownIds.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', borderRadius: 12, border: '1px dashed #fcd34d', background: '#fffbeb', fontSize: 13, color: '#92400e' }}>Go back and select at least one godown first.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[210px_1fr]" style={{ minHeight: 320 }}>
                    {/* LEFT: godown list — scroll area is bounded, Add godown pinned at bottom */}
                    <div style={{ border: '1px solid rgba(83,74,183,0.13)', borderRadius: 12, background: '#F0EFFD40', padding: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7C7A9A', marginBottom: 8, padding: '0 4px', flexShrink: 0 }}>1. Branch &amp; godown</p>
                      <div style={{ marginBottom: 8, flexShrink: 0 }}>
                        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ ...sInp, height: 32, fontSize: 12 }}>
                          <option value="">All branches</option>
                          {branchOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      {/* SCROLLABLE area — flex:1 + minHeight:0 keeps it bounded above the Add Godown button */}
                      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {selectedInBranch.length > 0 && <>
                          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', padding: '0 2px' }}>Selected</p>
                          {selectedInBranch.map((g) => {
                            const isActive = activeGodownId === g.id
                            const picked = pickedByGodownId.get(g.id)
                            return (
                              <button key={g.id} type="button" onClick={() => selectGodownForProducts(g.id)} style={{ textAlign: 'left', padding: '9px 10px', borderRadius: 9, border: isActive ? '2px solid #534AB7' : '1px solid rgba(83,74,183,0.13)', background: '#fff', cursor: 'pointer', boxShadow: isActive ? '0 2px 8px rgba(83,74,183,0.15)' : 'none', fontFamily: 'inherit' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#1E1A4E' }}>{g.name}</div>
                                <div style={{ fontSize: 10, color: '#534AB7' }}>{godownBranch(g)}</div>
                                <div style={{ fontSize: 10, color: '#7C7A9A' }}>{godownProducts[g.id]?.length ?? 0} in stock</div>
                                {picked && <div style={{ fontSize: 10, fontWeight: 700, color: '#534AB7' }}>{picked.lines} picked · {picked.units} units</div>}
                              </button>
                            )
                          })}
                        </>}
                        {availableInBranch.length > 0 && <>
                          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#7C7A9A', padding: '4px 2px 0' }}>Add from branch</p>
                          {availableInBranch.map((g) => (
                            <button key={g.id} type="button" onClick={() => addGodownToSelection(g.id)} style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'left', padding: '8px 10px', borderRadius: 9, border: '1px dashed rgba(83,74,183,0.2)', background: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                              <span><span style={{ fontWeight: 600, color: '#1E1A4E', display: 'block' }}>{g.name}</span><span style={{ fontSize: 10, color: '#7C7A9A' }}>{godownBranch(g)}</span></span>
                              <span style={{ fontSize: 18, fontWeight: 700, color: '#534AB7' }}>+</span>
                            </button>
                          ))}
                        </>}
                      </div>
                      {/* ─── "+ Add godown" PINNED at bottom, outside scroll div ─── */}
                      {canCreateGodown && !isEditMode && (
                        <div style={{ flexShrink: 0, borderTop: '1px solid rgba(83,74,183,0.1)', paddingTop: 8, marginTop: 6 }}>
                          {!createGodownOpen ? (
                            <button type="button" onClick={() => setCreateGodownOpen(true)} style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: '1px solid rgba(83,74,183,0.13)', background: '#fff', fontSize: 13, fontWeight: 600, color: '#1E1A4E', cursor: 'pointer', fontFamily: 'inherit' }}>
                              + Add godown
                            </button>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <Input label="Name *" value={newGodown.name} onChange={(e) => setNewGodown((f) => ({ ...f, name: e.target.value }))} />
                              <Input label="Code *" value={newGodown.code} onChange={(e) => setNewGodown((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
                              <Input label="Branch *" value={newGodown.city} onChange={(e) => setNewGodown((f) => ({ ...f, city: e.target.value }))} />
                              <Input label="Mobile *" value={newGodown.mobile} onChange={(e) => setNewGodown((f) => ({ ...f, mobile: e.target.value }))} />
                              <Input label="Password *" type="password" value={newGodown.password} onChange={(e) => setNewGodown((f) => ({ ...f, password: e.target.value }))} />
                              <div style={{ display: 'flex', gap: 6 }}>
                                <Button variant="ghost" size="sm" onClick={() => setCreateGodownOpen(false)}>Cancel</Button>
                                <Button size="sm" loading={godownCreateBusy} onClick={() => void createGodownInline()}>Save</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* RIGHT: product list */}
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      {activeGodownId ? (
                        <>
                          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(83,74,183,0.08)', background: 'linear-gradient(to right, #EEEDFE, #fff)' }}>
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#534AB7', marginBottom: 2 }}>2. Select products from</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1E1A4E' }}>{activeGodown?.name}</div>
                          </div>
                          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(83,74,183,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <Input placeholder="Search product or SKU…" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="h-9" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#534AB7', whiteSpace: 'nowrap' }}>{linesPayload.length} lines · {totalUnits} units</span>
                          </div>
                          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
                            {productsLoading && !godownProducts[activeGodownId] ? (
                              <p style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: '#94a3b8' }}>Loading products…</p>
                            ) : activeProducts.length === 0 ? (
                              <p style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: '#94a3b8' }}>No in-stock products here.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {filteredCatalog.map((c) => {
                                  const key = lineKey(activeGodownId, c.productId)
                                  const qty = lineQty[key] ?? 0
                                  const selected = qty > 0
                                  return (
                                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', borderRadius: 10, border: selected ? '1.5px solid #AFA9EC' : '1px solid rgba(83,74,183,0.1)', background: selected ? '#EEEDFE60' : '#F0EFFD30', transition: 'all 0.12s' }}>
                                      <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1E1A4E' }}>{c.particulars}</div>
                                        <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#7C7A9A' }}>{c.sku || '—'}</div>
                                      </div>
                                      <QtyStepper value={qty} max={c.stockQty + qty} onChange={(n) => setLineQty((m) => ({ ...m, [key]: n }))} />
                                    </div>
                                  )
                                })}
                                {filteredCatalog.length === 0 && <p style={{ textAlign: 'center', padding: '20px', fontSize: 13, color: '#94a3b8' }}>No match for your search.</p>}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>Select a godown on the left to see and pick products.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ STEP 4: SCHEDULE ══════════════════════════════════════════ */}
            {step === 4 && (
              <div>
                <StepHeader title="Schedule & location" description="Confirm delivery timing and site details." />
                {(selectedBiller || selectedGodownLabels || linesPayload.length > 0) && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" style={{ marginBottom: 20 }}>
                    <SummaryChip label="Biller" value={selectedBiller?.siteName || selectedBiller?.contactName || ''} />
                    <SummaryChip label="Godowns" value={selectedGodownLabels} />
                    <SummaryChip label="Items" value={`${linesPayload.length} lines · ${totalUnits} units`} />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 10 }}>Customer & site</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input label="Customer name *" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                      <Input label="Site name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                      <Input label="Contact phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                      <Input label="Vehicle no. / label" value={vehicleLabel} onChange={(e) => setVehicleLabel(e.target.value)} placeholder="e.g. TN-01-AB-1234" />
                      <Input label="Site address" value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} className="col-span-1 sm:col-span-2" />
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 10 }}>Timing</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input label="Delivery at *" type="datetime-local" value={deliveryAt} onChange={(e) => setDeliveryAt(e.target.value)} />
                      <Input label="Return expected (optional)" type="datetime-local" value={returnExpectedAt} onChange={(e) => setReturnExpectedAt(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}