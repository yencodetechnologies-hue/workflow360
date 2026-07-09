import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { apiFetch, API_BASE } from '../../lib/api'
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
  deliveryAt: string; returnExpectedAt?: string; deliveryTimeSlot?: string; returnTimeSlot?: string;
  selfDelivery?: boolean; vehicleLabel?: string; status: string;
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
  const remaining = Math.max(0, max - value)
  const btn: React.CSSProperties = {
    width: 34, height: 34, border: 'none', background: 'none', cursor: 'pointer',
    fontSize: 18, color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
      <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
        {value > 0 ? `${remaining} left · ${max} in stock` : `In stock: ${max}`}
      </span>
    </div>
  )
}

// ── Mini qty stepper (compact, for the picked-products list in left panel) ──
function MiniQtyStepper({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  const clamp = (n: number) => Math.max(0, Math.min(max, n))
  const btn: React.CSSProperties = {
    width: 16, height: 16, border: 'none', background: 'none', cursor: 'pointer',
    fontSize: 11, fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 4, lineHeight: 1, padding: 0, flexShrink: 0,
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onChange(clamp(value - 1)) }}
        disabled={value <= 0}
        style={{ ...btn, opacity: value <= 0 ? 0.3 : 1, cursor: value <= 0 ? 'not-allowed' : 'pointer' }}
        title="Decrease quantity"
      >
        −
      </button>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#065f46', minWidth: 14, textAlign: 'center' }}>{value}</span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onChange(clamp(value + 1)) }}
        disabled={value >= max}
        style={{ ...btn, opacity: value >= max ? 0.3 : 1, cursor: value >= max ? 'not-allowed' : 'pointer' }}
        title="Increase quantity"
      >
        +
      </button>
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
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #34d399, #059669)', borderRadius: 99, transition: 'width 0.4s ease' }} />
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
                background: done || active ? 'linear-gradient(135deg, #34d399, #059669)' : '#fff',
                border: done || active ? 'none' : '2px solid #e2e8f0',
                color: done || active ? '#fff' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? '0 4px 14px rgba(83,74,183,0.35)' : 'none',
                outline: active ? '3px solid rgba(5,150,105,0.15)' : 'none',
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
    <div style={{ borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 12px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#059669' }}>{label}</div>
      <div style={{ marginTop: 2, fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )
}

// ── Date + time-slot helpers ─────────────────────────────────────────────────
const TIME_SLOTS = [
  { value: 'MORNING', label: 'Morning ', hour: 9 },
  { value: 'AFTERNOON', label: 'Afternoon', hour: 13 },
  { value: 'EVENING', label: 'Evening ', hour: 18 },
] as const

function slotHour(slot: string): number {
  return TIME_SLOTS.find((s) => s.value === slot)?.hour ?? 9
}

function slotFromHour(hour: number): string {
  if (hour < 12) return 'MORNING'
  if (hour < 17) return 'AFTERNOON'
  return 'EVENING'
}

function dateAndSlotToISO(date: string, slot: string): string {
  if (!date) return ''
  const hour = slotHour(slot || 'MORNING')
  const d = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString()
}

function toDateValue(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function toSlotValue(iso: string | undefined, explicitSlot?: string): string {
  if (explicitSlot) return explicitSlot
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return slotFromHour(d.getHours())
}

// ── Self delivery toggle switch ──────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{label}</div>
        {description && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
          background: checked ? '#059669' : '#cbd5e1', position: 'relative', flexShrink: 0,
          transition: 'background 0.15s', padding: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: checked ? 22 : 2,
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)', transition: 'left 0.15s',
        }} />
      </button>
    </div>
  )
}

// ── Shared input style ────────────────────────────────────────────────────────
const fieldInp: React.CSSProperties = {
  width: '100%', height: 38, padding: '0 12px',
  border: '1px solid #e2e8f0', borderRadius: 9,
  fontSize: 13, color: '#111827', background: '#f9fafb',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}

// ── Searchable biller dropdown (search box lives INSIDE the open list) ──────
function SearchableBillerSelect({
  billers, value, onChange, onRegisterNew,
}: { billers: UserRow[]; value: string; onChange: (id: string) => void; onRegisterNew?: () => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)

  const selected = billers.find((b) => b.id === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return billers
    return billers.filter((b) =>
      (b.siteName?.toLowerCase().includes(q) ?? false) ||
      (b.contactName?.toLowerCase().includes(q) ?? false) ||
      (b.contactPhone?.toLowerCase().includes(q) ?? false) ||
      (b.email?.toLowerCase().includes(q) ?? false)
    )
  }, [billers, query])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Biller</label>
        {onRegisterNew && (
          <button
            type="button"
            onClick={onRegisterNew}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: '1px dashed #6ee7b7', background: '#ecfdf5', fontSize: 11, fontWeight: 600, color: '#059669', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + Register new biller
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ ...fieldInp, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ color: selected ? '#0f172a' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected
            ? `${selected.siteName || selected.contactName || 'Biller'}${selected.contactPhone ? ` · ${selected.contactPhone}` : ''}`
            : 'Select biller…'}
        </span>
        <span style={{ color: '#94a3b8', flexShrink: 0, marginLeft: 8 }}>▾</span>
      </button>

      {open && (
        <div style={{
          marginTop: 6, zIndex: 5,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
        }}>
          {/* search box lives inside the open dropdown */}
          <div style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
            <input
              autoFocus
              placeholder="Search name or mobile number…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ ...fieldInp, height: 34 }}
            />
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <p style={{ padding: 14, fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>No billers match.</p>
            ) : (
              filtered.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => { onChange(b.id); setOpen(false); setQuery('') }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none',
                    borderBottom: '1px solid #f8fafc', background: b.id === value ? '#ecfdf5' : '#fff',
                    cursor: 'pointer', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', gap: 10,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{b.siteName || b.contactName || 'Biller'}</span>
                  <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, whiteSpace: 'nowrap' }}>{b.contactPhone || ''}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
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
  const [deliveryDate,      setDeliveryDate]      = useState('')
  const [deliveryTimeSlot,  setDeliveryTimeSlot]  = useState('')
  const [returnDate,        setReturnDate]        = useState('')
  const [returnTimeSlot,    setReturnTimeSlot]    = useState('')
  const [selfDelivery,      setSelfDelivery]      = useState(false)
  const [vehicleLabel,      setVehicleLabel]      = useState('')
  const [siteName,          setSiteName]          = useState('')
  const [siteAddress,       setSiteAddress]       = useState('')
  const [contactPhone,      setContactPhone]      = useState('')
  const [createBusy,        setCreateBusy]        = useState(false)
  const [createLinks,       setCreateLinks]       = useState<{ deliveryVerifyUrl: string; billerReturnUrl: string; id: string } | null>(null)
  const [createBillerMode,  setCreateBillerMode]  = useState(false)
  const [newBiller,         setNewBiller]         = useState({ siteName: '', siteAddress: '', contactName: '', contactPhone: '' })
  const [billerCreateBusy,  setBillerCreateBusy]  = useState(false)
  const [branchFilter,      setBranchFilter]      = useState('')
  const [createGodownOpen,  setCreateGodownOpen]  = useState(false)
  const [newGodown,         setNewGodown]         = useState({ name: '', code: '', address: '', mobile: '', location: '', city: '', password: '' })
  const [godownCreateBusy,  setGodownCreateBusy]  = useState(false)
  const [wizardError,       setWizardError]       = useState<string | null>(null)
  const [orderId,           setOrderId]           = useState<string | undefined>()
  const [manualDeliveryNo,  setManualDeliveryNo]  = useState('')
  const [addProductOpen,    setAddProductOpen]    = useState(false)
  const [addProductForm,    setAddProductForm]    = useState({ name: '', sku: '', category: '', specification: '', rate: '', imagePath: '', initialStockQty: '', stockGodownId: '' })
  const [addProductBusy,    setAddProductBusy]    = useState(false)
  const [addProductError,   setAddProductError]   = useState<string | null>(null)
  const [addProductUploading, setAddProductUploading] = useState(false)
  // Track max sNo for auto-generation
  const [allProducts,       setAllProducts]       = useState<Array<{ sNo: string; particulars: string; productId: string }>>([])

  const canCreate       = auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')
  const canCreateBiller = auth.status === 'authenticated' && auth.user.role === 'ADMIN'
  const canCreateGodown = auth.status === 'authenticated' && auth.user.role === 'ADMIN'

  const resetWizard = () => {
    setStep(1); setBillerId(''); setSelectedGodownIds([]); setActiveGodownId('')
    setGodownProducts({}); setProductsLoading(false); setLineQty({}); setProductSearch('')
    setCustomerName(''); setDeliveryDate(''); setDeliveryTimeSlot(''); setReturnDate(''); setReturnTimeSlot(''); setSelfDelivery(false); setVehicleLabel('')
    setSiteName(''); setSiteAddress(''); setContactPhone(''); setCreateLinks(null)
    setCreateBillerMode(false); setNewBiller({ siteName: '', siteAddress: '', contactName: '', contactPhone: '' })
    setBranchFilter(''); setCreateGodownOpen(false)
    setNewGodown({ name: '', code: '', address: '', mobile: '', location: '', city: '', password: '' })
    setWizardError(null); setOrderId(undefined); setManualDeliveryNo('')
  }

  useEffect(() => {
    if (!open || !prefill) return
    if (prefill.orderId) setOrderId(prefill.orderId)
    if (prefill.customerName) setCustomerName(prefill.customerName)
    if (prefill.siteName) setSiteName(prefill.siteName)
    if (prefill.siteAddress) setSiteAddress(prefill.siteAddress)
    if (prefill.contactPhone) setContactPhone(prefill.contactPhone)
    if (prefill.deliveryAt) { const d = new Date(prefill.deliveryAt); if (!isNaN(d.getTime())) { setDeliveryDate(toDateValue(prefill.deliveryAt)); setDeliveryTimeSlot(toSlotValue(prefill.deliveryAt)) } }
    if (prefill.returnExpectedAt) { const d = new Date(prefill.returnExpectedAt); if (!isNaN(d.getTime())) { setReturnDate(toDateValue(prefill.returnExpectedAt)); setReturnTimeSlot(toSlotValue(prefill.returnExpectedAt)) } }
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
      setDeliveryDate(toDateValue(d.deliveryAt)); setDeliveryTimeSlot(toSlotValue(d.deliveryAt, d.deliveryTimeSlot))
      setReturnDate(toDateValue(d.returnExpectedAt)); setReturnTimeSlot(toSlotValue(d.returnExpectedAt, d.returnTimeSlot))
      setSelfDelivery(Boolean(d.selfDelivery))
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
    apiFetch<Array<Record<string, unknown>>>('/products', { token })
      .then((rows) => setAllProducts(rows.map((r) => ({ sNo: String(r.s_no ?? r.sNo ?? ''), particulars: String(r.particulars ?? r.name ?? ''), productId: String(r.id ?? '') }))))
      .catch(() => {})
  }, [open, canCreate, auth])

  useEffect(() => {
  if (!open || isEditMode) return
  if (godowns.length === 0) return
  if (selectedGodownIds.length > 0) return
  const first = godowns[0]
  setSelectedGodownIds([first.id])
  setActiveGodownId(first.id)
  void loadGodownProducts(first.id)
}, [open, isEditMode, godowns])

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
    if (b) { setSiteName(b.siteName || ''); setContactPhone(b.contactPhone || ''); setCustomerName(b.siteName || b.contactName || b.contactPhone || ''); setSiteAddress(b.siteAddress || '') }
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
  const stockSummaryByGodownId = useMemo(() => {
    const m = new Map<string, { products: number; units: number }>()
    for (const [gid, products] of Object.entries(godownProducts)) {
      m.set(gid, {
        products: products.length,
        units: products.reduce((sum, p) => {
          const key = lineKey(gid, p.productId)
          const ordered = lineQty[key] ?? 0
          return sum + Math.max(0, p.stockQty - ordered)
        }, 0),
      })
    }
    return m
  }, [godownProducts, lineQty])
  const selectGodownForProducts = (gid: string) => { setActiveGodownId(gid); setProductSearch(''); if (!godownProducts[gid]) void loadGodownProducts(gid) }
  const branchOptions = useMemo(() => Array.from(new Set(godowns.map(godownBranch))).sort((a, b) => a.localeCompare(b)), [godowns])
  const godownsInBranch = useMemo(() => branchFilter ? godowns.filter((g) => godownBranch(g) === branchFilter) : godowns, [godowns, branchFilter])
  const selectedInBranch = useMemo(() => selectedGodownIds.map((id) => godowns.find((g) => g.id === id)).filter((g): g is GodownRow => !!g && (!branchFilter || godownBranch(g) === branchFilter)), [selectedGodownIds, godowns, branchFilter])
  const availableInBranch = useMemo(() => godownsInBranch.filter((g) => !selectedGodownIds.includes(g.id)), [godownsInBranch, selectedGodownIds])

  const nextDisabled =
    (step === 1 && ((createBillerMode || billers.length === 0) ? !newBiller.siteName.trim() : !billerId)) ||
    (step === 2 && selectedGodownIds.length === 0) ||
    (step === 3 && linesPayload.length === 0) ||
    (step === 4 && (!customerName.trim() || !deliveryDate || !deliveryTimeSlot || !manualDeliveryNo.trim() || createBusy))

  const handleNext = async () => {
    setWizardError(null)
    if (step === 1 && (createBillerMode || billers.length === 0) && !billerId) {
      if (!newBiller.siteName.trim()) return
      const token = getToken(); if (!token || !canCreateBiller) { setWizardError('Only admin can create a new biller'); return }
      setBillerCreateBusy(true)
      try {
        const created = await apiFetch<UserRow>('/users/billers', { token, method: 'POST', body: JSON.stringify({ siteName: newBiller.siteName.trim(), siteAddress: newBiller.siteAddress.trim() || undefined, contactName: newBiller.contactName.trim() || undefined, contactPhone: newBiller.contactPhone.trim() || undefined, password: '123456' }) })
        setBillers((prev) => [...prev, created]); setBillerId(created.id); setCreateBillerMode(false); setStep(2)
      } catch (e: unknown) { setWizardError(e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Create biller failed') }
      finally { setBillerCreateBusy(false) }
      return
    }
    if (step < 4) { setStep((s) => s + 1); return }
    const token = getToken(); if (!token) return
    setCreateBusy(true)
    const body = {
      deliveryNo: manualDeliveryNo.trim(),
      orderId: orderId || undefined, billerUserId: billerId, fromGodownId: selectedGodownIds[0],
      customerName: customerName.trim(), siteName: siteName.trim() || undefined, siteAddress: siteAddress.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      deliveryAt: dateAndSlotToISO(deliveryDate, deliveryTimeSlot),
      returnExpectedAt: returnDate ? dateAndSlotToISO(returnDate, returnTimeSlot || deliveryTimeSlot) : undefined,
      deliveryTimeSlot: deliveryTimeSlot || undefined,
      returnTimeSlot: returnDate ? (returnTimeSlot || deliveryTimeSlot || undefined) : undefined,
      selfDelivery,
      vehicleLabel: vehicleLabel.trim() || undefined, lines: linesPayload,
    }
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
          background: nextDisabled ? '#6ee7b7' : 'linear-gradient(135deg, #34d399, #059669)',
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
    <>
    {/* <Modal open={open} onClose={handleClose} className="max-w-5xl overflow-hidden w-full" title={undefined} footer={footer}> */}
    <Modal open={open} onClose={handleClose} className="overflow-hidden w-full" style={{ maxWidth: '72rem', maxHeight: 'min(95vh, 56rem)' }} title={undefined} footer={footer}>
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
          <div style={{ margin: '-20px -24px 0', padding: '22px 24px 20px', background: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>{isEditMode ? 'Edit delivery' : 'New delivery'}</h2>
                <p style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.80)', margin: '4px 0 0' }}>
                  {isEditMode
                    ? editMetadataOnly ? 'Update schedule and customer details.' : 'Update biller, godowns, products, and schedule.'
                    : 'Select godowns first, then pick in-stock products from each.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', marginTop: 2 }}
              >
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
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
                  <div style={{ border: '1px solid #a7f3d0', borderRadius: 14, background: '#ecfdf5', padding: 18 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#059669', marginBottom: 14 }}>
                      {billers.length === 0 ? 'No billers yet — create one' : 'New biller'} <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>(default password: 123456)</span>
                    </p>
                    <div className="grid grid-cols-1 gap-3 mb-3 sm:grid-cols-2">
                      <Input label="Company / office name *" value={newBiller.siteName} onChange={(e) => setNewBiller((f) => ({ ...f, siteName: e.target.value }))} />
                      <Input label="Contact person" value={newBiller.contactName} onChange={(e) => setNewBiller((f) => ({ ...f, contactName: e.target.value }))} />
                      <Input label="Mobile number" value={newBiller.contactPhone} onChange={(e) => setNewBiller((f) => ({ ...f, contactPhone: e.target.value }))} />
                    </div>
                    <Input label="Address" value={newBiller.siteAddress} onChange={(e) => setNewBiller((f) => ({ ...f, siteAddress: e.target.value }))} />
                    {billers.length > 0 && (
                      <button onClick={() => setCreateBillerMode(false)} style={{ marginTop: 10, background: 'none', border: 'none', fontSize: 12, color: '#059669', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                        ← Select existing biller
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <SearchableBillerSelect billers={billers} value={billerId} onChange={setBillerId} onRegisterNew={canCreateBiller && !isEditMode ? () => setCreateBillerMode(true) : undefined} />
                    {selectedBiller && (
                      <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 4 }}>Selected</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{selectedBiller.siteName || selectedBiller.contactName || 'Biller'}</div>
                        {selectedBiller.siteAddress && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{selectedBiller.siteAddress}</div>}
                        {selectedBiller.contactPhone && <div style={{ fontSize: 12, color: '#059669', marginTop: 2, fontWeight: 600 }}>{selectedBiller.contactPhone}</div>}
                      </div>
                    )}
                    {canCreateBiller && !isEditMode && (
                      <div style={{ height: 0 }} />
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
                      <div style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: 13, fontWeight: 700, color: '#059669' }}>
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
                        border: selected ? '2px solid #059669' : '1px solid #e2e8f0',
                        background: selected ? '#ecfdf5' : '#fff',
                        boxShadow: selected ? '0 2px 10px rgba(83,74,183,0.12)' : 'none',
                        transition: 'all 0.15s',
                      }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: selected ? '#059669' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: selected ? '#fff' : '#64748b' }}>
                            <StepIcon step={2} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{g.name}</div>
                            {g.code && <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>{g.code}</div>}
                            <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 2 }}>Branch: {godownBranch(g)}</div>
                          </div>
                          {selected && (
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
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
                  <div style={{ marginTop: 14, border: '1px dashed #6ee7b7', borderRadius: 12, background: '#ecfdf5', padding: 14 }}>
                    {!createGodownOpen ? (
                      <button onClick={() => setCreateGodownOpen(true)} style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: '#059669', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
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
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <StepHeader title="Select products" description="Choose branch, switch godown on the left, pick products on the right." />
                  <button
                    type="button"
                    onClick={() => {
                      // auto-generate next S.No
                      const maxSNo = allProducts.reduce((max, p) => {
                        const n = parseInt(p.sNo, 10)
                        return isNaN(n) ? max : Math.max(max, n)
                      }, 0)
                      setAddProductForm({ name: '', sku: `SKU-${maxSNo + 1}`, category: '', specification: '', rate: '', imagePath: '', initialStockQty: '', stockGodownId: activeGodownId || selectedGodownIds[0] || '' })
                      setAddProductError(null)
                      setAddProductOpen(true)
                    }}
                    style={{
                      flexShrink: 0, marginTop: 2, padding: '8px 14px', borderRadius: 9,
                      border: '1px dashed #6ee7b7', background: '#ecfdf5',
                      fontSize: 12, fontWeight: 600, color: '#059669', cursor: 'pointer', fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    + Add Product
                  </button>
                </div>
                {editMetadataOnly && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', fontSize: 13, color: '#92400e' }}>This delivery has scan activity. Quantity adjustments may be limited.</div>}
                {selectedGodownIds.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', borderRadius: 12, border: '1px dashed #fcd34d', background: '#fffbeb', fontSize: 13, color: '#92400e' }}>Go back and select at least one godown first.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[210px_1fr]" style={{ minHeight: 320 }}>
                    {/* LEFT: godown list — scroll area is bounded, Add godown pinned at bottom */}
                    <div style={{ border: '1px solid rgba(5,150,105,0.13)', borderRadius: 12, background: '#ecfdf540', padding: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                            // Get picked product details for this godown, including the per-product stock max for +/- bounds
                            const pickedProductsForGodown = linesPayload
                              .filter((l) => l.godownId === g.id)
                              .map((l) => {
                                const product = (godownProducts[g.id] ?? []).find((p) => p.productId === l.productId)
                                return { productId: l.productId, name: product?.particulars ?? l.productId, qty: l.qty, stockQty: product?.stockQty ?? l.qty }
                              })
                            return (
                              <button key={g.id} type="button" onClick={() => selectGodownForProducts(g.id)} style={{ textAlign: 'left', padding: '9px 10px', borderRadius: 9, border: isActive ? '2px solid #059669' : '1px solid rgba(5,150,105,0.13)', background: '#fff', cursor: 'pointer', boxShadow: isActive ? '0 2px 8px rgba(5,150,105,0.15)' : 'none', fontFamily: 'inherit', width: '100%' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#1E1A4E' }}>{g.name}</div>
                                <div style={{ fontSize: 10, color: '#059669' }}>{godownBranch(g)}</div>
                                <div style={{ fontSize: 10, color: '#7C7A9A' }}>
                                  {stockSummaryByGodownId.get(g.id)?.products ?? 0} products
                                  {(stockSummaryByGodownId.get(g.id)?.units ?? 0) > 0
                                    ? ` · ${stockSummaryByGodownId.get(g.id)?.units} units`
                                    : ''}
                                </div>
                                {picked && (
                                  <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {pickedProductsForGodown.map((pp) => (
                                      <div
                                        key={pp.productId}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, background: '#ecfdf5', borderRadius: 6, padding: '3px 4px 3px 6px' }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <span style={{ fontSize: 10, fontWeight: 600, color: '#065f46', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {pp.name}
                                        </span>
                                        <MiniQtyStepper
                                          value={pp.qty}
                                          max={pp.stockQty}
                                          onChange={(n) => {
                                            const key = lineKey(g.id, pp.productId)
                                            setLineQty((m) => {
                                              if (n <= 0) { const next = { ...m }; delete next[key]; return next }
                                              return { ...m, [key]: n }
                                            })
                                          }}
                                        />
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            const key = lineKey(g.id, pp.productId)
                                            setLineQty((m) => { const next = { ...m }; delete next[key]; return next })
                                          }}
                                          style={{ flexShrink: 0, width: 16, height: 16, borderRadius: '50%', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, lineHeight: 1, padding: 0 }}
                                          title={`Remove ${pp.name}`}
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </>}
                        {availableInBranch.length > 0 && <>
                          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#7C7A9A', padding: '4px 2px 0' }}>Add from branch</p>
                          {availableInBranch.map((g) => (
                            <button key={g.id} type="button" onClick={() => addGodownToSelection(g.id)} style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'left', padding: '8px 10px', borderRadius: 9, border: '1px dashed rgba(83,74,183,0.2)', background: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                              <span><span style={{ fontWeight: 600, color: '#1E1A4E', display: 'block' }}>{g.name}</span><span style={{ fontSize: 10, color: '#7C7A9A' }}>{godownBranch(g)}</span></span>
                              <span style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>+</span>
                            </button>
                          ))}
                        </>}
                      </div>
                      {/* ─── "+ Add godown" PINNED at bottom, outside scroll div ─── */}
                      {canCreateGodown && !isEditMode && (
                        <div style={{ flexShrink: 0, borderTop: '1px solid rgba(83,74,183,0.1)', paddingTop: 8, marginTop: 6 }}>
                          {!createGodownOpen ? (
                            <button type="button" onClick={() => setCreateGodownOpen(true)} style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: '1px solid rgba(5,150,105,0.13)', background: '#fff', fontSize: 13, fontWeight: 600, color: '#1E1A4E', cursor: 'pointer', fontFamily: 'inherit' }}>
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
                          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(83,74,183,0.08)', background: 'linear-gradient(to right, #ecfdf5, #fff)' }}>
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#059669', marginBottom: 2 }}>2. Select products from</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1E1A4E' }}>{activeGodown?.name}</div>
                          </div>
                          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(83,74,183,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <Input placeholder="Search product or SKU…" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="h-9" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', whiteSpace: 'nowrap' }}>{linesPayload.length} lines · {totalUnits} units</span>
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
                                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', borderRadius: 10, border: selected ? '1.5px solid #6ee7b7' : '1px solid rgba(83,74,183,0.1)', background: selected ? '#ecfdf560' : '#ecfdf530', transition: 'all 0.12s' }}>
                                      <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1E1A4E' }}>{c.particulars}</div>
                                        <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#7C7A9A' }}>{c.sku || '—'}</div>
                                      </div>
                                      <QtyStepper value={qty} max={c.stockQty} onChange={(n) => setLineQty((m) => ({ ...m, [key]: n }))} />
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

                {/* ── Delivery number ── */}
                <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 12, border: '1.5px solid #a7f3d0', background: '#ecfdf5', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 10, background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h12M4 17h8" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#059669', marginBottom: 6 }}>
                      Delivery number <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      value={manualDeliveryNo}
                      onChange={(e) => setManualDeliveryNo(e.target.value)}
                      placeholder="e.g. DLV-001 or any custom number"
                      style={{ ...fieldInp, height: 38, fontWeight: 700, fontSize: 14, letterSpacing: '0.03em', background: '#fff', borderColor: manualDeliveryNo.trim() ? '#6ee7b7' : '#e2e8f0' }}
                    />
                    {!manualDeliveryNo.trim() && (
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>This number will appear on the delivery list and all documents.</p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 10 }}>Customer & site</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input label="Customer name *" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                      <Input label="Site name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                      <Input label="Contact phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                      <Input label="Site address" value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} className="col-span-1 sm:col-span-2" />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <ToggleSwitch
                        checked={selfDelivery}
                        onChange={setSelfDelivery}
                        label="Self delivery"
                        description="Customer will arrange their own pickup / delivery"
                      />
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 10 }}>Timing</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input label="Delivery date *" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                      <Select label="Delivery time *" value={deliveryTimeSlot} onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                        options={[{ value: '', label: 'Select time…' }, ...TIME_SLOTS.map((t) => ({ value: t.value, label: t.label }))]}
                      />
                      <Input label="Return date (optional)" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                      <Select label="Return time" value={returnTimeSlot} onChange={(e) => setReturnTimeSlot(e.target.value)}
                        options={[{ value: '', label: 'Select time…' }, ...TIME_SLOTS.map((t) => ({ value: t.value, label: t.label }))]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>

    {/* ── Add Product inline modal ─────────────────────────────── */}
    {addProductOpen && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(2px)' }} onClick={() => setAddProductOpen(false)} />
        <div style={{ position: 'relative', width: '100%', maxWidth: 500, background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
          {/* Header */}
          <div style={{ padding: '18px 24px 16px', background: 'linear-gradient(135deg, #059669, #064e3b)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>Add New Product</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>S.No auto-generated. Product added to catalog.</p>
            </div>
            <button type="button" onClick={() => setAddProductOpen(false)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {addProductError && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, color: '#b91c1c' }}>{addProductError}</div>
            )}
            <Input label="Particulars (Product Name) *" value={addProductForm.name} onChange={(e) => setAddProductForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Steel Chair" />
            <Input label="Category" value={addProductForm.category} onChange={(e) => setAddProductForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Furniture" />
            <Input label="Specification" value={addProductForm.specification} onChange={(e) => setAddProductForm((f) => ({ ...f, specification: e.target.value }))} placeholder="e.g. Size, color, material" />
            <Input label="Rate" value={addProductForm.rate} onChange={(e) => setAddProductForm((f) => ({ ...f, rate: e.target.value }))} placeholder="e.g. 150" />
            {/* Initial stock */}
            <div style={{ borderRadius: 14, border: '1px solid #a7f3d0', background: '#ecfdf5', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#059669' }}>Initial stock (optional)</label>
                <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Add opening stock for this product at a godown. It updates instantly here and on the Products page.</p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 600, color: '#374151' }}>Godown {addProductForm.initialStockQty && parseInt(addProductForm.initialStockQty, 10) > 0 ? <span style={{ color: '#dc2626' }}>*</span> : null}</label>
                  <select
                    value={addProductForm.stockGodownId}
                    onChange={(e) => setAddProductForm((f) => ({ ...f, stockGodownId: e.target.value }))}
                    style={{ ...fieldInp, height: 36, fontSize: 12.5, borderColor: addProductForm.initialStockQty && parseInt(addProductForm.initialStockQty, 10) > 0 && !addProductForm.stockGodownId ? '#fca5a5' : '#e2e8f0' }}
                  >
                    <option value="">Select godown…</option>
                    {godowns.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 600, color: '#374151' }}>Quantity</label>
                  <div style={{ display: 'inline-flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: 9, background: '#fff', overflow: 'hidden', height: 36, width: '100%' }}>
                    <button
                      type="button"
                      onClick={() => setAddProductForm((f) => {
                        const cur = parseInt(f.initialStockQty, 10) || 0
                        return { ...f, initialStockQty: String(Math.max(0, cur - 1)) }
                      })}
                      style={{ width: 32, height: '100%', border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={addProductForm.initialStockQty}
                      onChange={(e) => setAddProductForm((f) => ({ ...f, initialStockQty: e.target.value.replace(/[^0-9]/g, '') }))}
                      placeholder="0"
                      style={{ flex: 1, height: '100%', border: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#0f172a', background: '#f8fafc', outline: 'none', fontFamily: 'inherit', minWidth: 0 }}
                    />
                    <button
                      type="button"
                      onClick={() => setAddProductForm((f) => {
                        const cur = parseInt(f.initialStockQty, 10) || 0
                        return { ...f, initialStockQty: String(cur + 1) }
                      })}
                      style={{ width: 32, height: '100%', border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Image upload */}
            <div style={{ borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', padding: 16 }}>
              <label style={{ display: 'block', marginBottom: 10, fontSize: 13, fontWeight: 600, color: '#374151' }}>Product Image (optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {addProductForm.imagePath ? (
                    <img src={addProductForm.imagePath.startsWith('http') ? addProductForm.imagePath : `${API_BASE.replace(/\/api$/, '')}/${addProductForm.imagePath.replace(/^\//, '')}`} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input type="file" id="add-product-image" style={{ display: 'none' }} accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]; if (!file) return
                      const token = getToken(); if (!token) return
                      setAddProductUploading(true)
                      try {
                        const formData = new FormData(); formData.append('image', file)
                        const res = await fetch(`${API_BASE}/products/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data?.message || 'Upload failed')
                        setAddProductForm((f) => ({ ...f, imagePath: data.filePath as string }))
                      } catch { alert('Image upload failed') } finally { setAddProductUploading(false) }
                    }}
                  />
                  <button type="button" disabled={addProductUploading} onClick={() => document.getElementById('add-product-image')?.click()} style={{ height: 34, padding: '0 16px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#374151', cursor: addProductUploading ? 'not-allowed' : 'pointer', opacity: addProductUploading ? 0.6 : 1 }}>
                    {addProductUploading ? 'Uploading…' : 'Choose image'}
                  </button>
                  {addProductForm.imagePath && (
                    <button type="button" onClick={() => setAddProductForm((f) => ({ ...f, imagePath: '' }))} style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>Remove</button>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={() => setAddProductOpen(false)} style={{ height: 38, padding: '0 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Cancel</button>
            <button
              type="button"
              disabled={addProductBusy || !addProductForm.name.trim()}
              onClick={async () => {
                const qtyEntered = parseInt(addProductForm.initialStockQty, 10)
                if (Number.isFinite(qtyEntered) && qtyEntered > 0 && !addProductForm.stockGodownId) {
                  setAddProductError('Pick a godown to receive the initial stock, or clear the quantity.')
                  return
                }
                setAddProductBusy(true); setAddProductError(null)
                const token = getToken(); if (!token) { setAddProductBusy(false); return }
                try {
                  const maxSNo = allProducts.reduce((max, p) => { const n = parseInt(p.sNo, 10); return isNaN(n) ? max : Math.max(max, n) }, 0)
                  const nextSNo = maxSNo + 1
                  const body = {
                    s_no: String(nextSNo),
                    particulars: addProductForm.name.trim(),
                    category: addProductForm.category.trim() || 'General',
                    specification: addProductForm.specification.trim() || '—',
                    rate: addProductForm.rate.trim() || '—',
                    sku: addProductForm.sku.trim() || `SKU-${nextSNo}`,
                    unit: 'pcs', reorderLevel: 0,
                    image_path: addProductForm.imagePath.trim() || undefined,
                  }
                  const created = await apiFetch<Record<string, unknown>>('/products', { token, method: 'POST', body: JSON.stringify(body) })
                  const createdProductId = String((created as any)?._id ?? (created as any)?.id ?? '')

                  // Optional initial stock: post an inventory adjustment for the chosen godown
                  const stockQty = parseInt(addProductForm.initialStockQty, 10)
                  if (createdProductId && addProductForm.stockGodownId && Number.isFinite(stockQty) && stockQty > 0) {
                    await apiFetch(`/godowns/${addProductForm.stockGodownId}/inventory/adjust`, {
                      token, method: 'POST',
                      body: JSON.stringify({ productId: createdProductId, qtyDelta: stockQty, note: 'Initial stock on product creation' }),
                    })
                  }

                  const rows = await apiFetch<Array<Record<string, unknown>>>('/products', { token })
                  setAllProducts(rows.map((r) => ({ sNo: String(r.s_no ?? r.sNo ?? ''), particulars: String(r.particulars ?? r.name ?? ''), productId: String(r.id ?? '') })))
                  // Refresh whichever godown(s) might show this product now (the one we stocked, plus the one currently active)
                  const godownsToRefresh = new Set<string>()
                  if (addProductForm.stockGodownId) godownsToRefresh.add(addProductForm.stockGodownId)
                  if (activeGodownId) godownsToRefresh.add(activeGodownId)
                  for (const gid of godownsToRefresh) void loadGodownProducts(gid)
                  // Jump the picker to the godown that now holds this product, so it's visible right away
                  if (addProductForm.stockGodownId) {
                    setSelectedGodownIds((prev) => prev.includes(addProductForm.stockGodownId) ? prev : [...prev, addProductForm.stockGodownId])
                    setActiveGodownId(addProductForm.stockGodownId)
                  }
                  // Let other open pages (Products list, Godown details, Dashboard) pick up the change immediately
                  window.dispatchEvent(new CustomEvent('godown-stock-changed'))
                  setAddProductOpen(false)
                } catch (e: unknown) { setAddProductError((e as any)?.message ?? 'Failed to create product') } finally { setAddProductBusy(false) }
              }}
              style={{ height: 38, padding: '0 24px', borderRadius: 10, border: 'none', background: addProductBusy || !addProductForm.name.trim() ? '#6ee7b7' : 'linear-gradient(135deg, #34d399, #059669)', fontSize: 13, fontWeight: 700, color: '#fff', cursor: addProductBusy || !addProductForm.name.trim() ? 'not-allowed' : 'pointer' }}
            >
              {addProductBusy ? 'Saving…' : 'Save Product'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}