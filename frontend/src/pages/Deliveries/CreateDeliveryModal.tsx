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
  id: string
  email?: string
  role: string
  siteName?: string
  siteAddress?: string
  contactPhone?: string
  contactName?: string
  active?: boolean
}

type CatalogRow = {
  productId: string
  enabled: boolean
  particulars?: string
  sku?: string
}

type StockedProduct = CatalogRow & { stockQty: number }

function lineKey(godownId: string, productId: string) {
  return `${godownId}:${productId}`
}

function godownBranch(g: GodownRow): string {
  const city = g.city?.trim()
  if (city) return city
  const loc = g.location?.trim()
  if (loc) return loc
  return 'Other'
}

const STEPS = [
  { id: 1, title: 'Biller', subtitle: 'Customer account' },
  { id: 2, title: 'Godowns', subtitle: 'Select sources' },
  { id: 3, title: 'Products', subtitle: 'Per godown stock' },
  { id: 4, title: 'Schedule', subtitle: 'Delivery details' },
] as const

export type CreateDeliveryPrefill = {
  orderId?: string
  customerName?: string
  siteName?: string
  siteAddress?: string
  contactPhone?: string
  deliveryAt?: string
  returnExpectedAt?: string
  fromGodownId?: string
}

type DeliveryDetailForEdit = {
  id: string
  billerUserId?: string
  customerName: string
  siteName?: string
  siteAddress?: string
  contactPhone?: string
  fromGodownId: string
  deliveryAt: string
  returnExpectedAt?: string
  vehicleLabel?: string
  status: string
  dispatchedTagIds?: string[]
  pickedUpTagIds?: string[]
  deliveredTagIds?: string[]
  returnPickedUpTagIds?: string[]
  returnedTagIds?: string[]
  damagedTagIds?: string[]
  lostTagIds?: string[]
  lines: Array<{ productId: string; godownId?: string; qty: number }>
}

type Props = {
  open: boolean
  onClose: () => void
  onCreated: () => void
  onUpdated?: () => void
  deliveryId?: string | null
  prefill?: CreateDeliveryPrefill | null
}

function StepIcon({ step }: { step: number }) {
  const cls = 'h-5 w-5'
  if (step === 1) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  }
  if (step === 2) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 9.5 12 5l8 4.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5Z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    )
  }
  if (step === 3) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M7 7.5 12 5l5 2.5v5L12 15l-5-2.5v-5Z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 15v6M7 12.5 12 15l5-2.5" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    )
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="18" cy="17" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12.5 9.5 17 19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function QtyStepper({
  value,
  max,
  onChange,
}: {
  value: number
  max: number
  onChange: (n: number) => void
}) {
  const clamp = (n: number) => Math.max(0, Math.min(max, n))
  return (
    <div className="inline-flex flex-col items-end gap-1">
    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-l-xl text-lg text-slate-600 transition hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"
        disabled={value <= 0}
        onClick={() => onChange(clamp(value - 1))}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        max={max}
        className="h-9 w-14 border-x border-slate-200 bg-slate-50/80 text-center text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-200"
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
      />
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-r-xl text-lg text-slate-600 transition hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
        aria-label="Increase quantity"
      >
        +
      </button>
      </div>
      <span className="text-[10px] font-medium text-slate-500">In stock: {max}</span>
    </div>
  )
}

function WizardStepper({ step }: { step: number }) {
  const progress = ((step - 1) / (STEPS.length - 1)) * 100
  return (
    <div className="mb-6">
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="grid grid-cols-4 gap-1">
        {STEPS.map((s) => {
          const done = step > s.id
          const active = step === s.id
          return (
            <li key={s.id} className="flex flex-col items-center text-center">
              <div
                className={
                  done
                    ? 'flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-200'
                    : active
                      ? 'flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white ring-4 ring-violet-100 shadow-lg shadow-violet-200'
                      : 'flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-400'
                }
              >
                {done ? <CheckIcon /> : <StepIcon step={s.id} />}
              </div>
              <span className={`mt-2 text-xs font-semibold ${active || done ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.title}
              </span>
              <span className="hidden text-[10px] text-slate-500 sm:block">{s.subtitle}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-0.5 text-sm text-slate-500">{description}</p>
    </div>
  )
}

function LinkCard({
  label,
  description,
  url,
}: {
  label: string
  description: string
  url: string
}) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{label}</div>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
        <Button
          size="sm"
          variant={copied ? 'success' : 'secondary'}
          onClick={() => {
            void navigator.clipboard.writeText(url)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2000)
          }}
        >
          <CopyIcon />
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className="mt-3 break-all rounded-xl bg-white px-3 py-2 font-mono text-xs text-slate-600 ring-1 ring-slate-100">
        {url}
      </div>
    </div>
  )
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="rounded-xl bg-violet-50/80 px-3 py-2 ring-1 ring-violet-100">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-violet-600">{label}</div>
      <div className="mt-0.5 truncate text-sm font-medium text-slate-900">{value}</div>
    </div>
  )
}

function toDatetimeLocalValue(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 16)
}

export function CreateDeliveryModal({ open, onClose, onCreated, onUpdated, deliveryId, prefill }: Props) {
  const auth = useAuth()
  const nav = useNavigate()

  const [continueEditId, setContinueEditId] = useState<string | null>(null)
  const effectiveEditId = deliveryId ?? continueEditId
  const isEditMode = !!effectiveEditId

  const [step, setStep] = useState(1)
  const [editLoading, setEditLoading] = useState(false)
  const [editMetadataOnly, setEditMetadataOnly] = useState(false)
  const [billers, setBillers] = useState<UserRow[]>([])
  const [godowns, setGodowns] = useState<GodownRow[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [billerId, setBillerId] = useState('')
  const [selectedGodownIds, setSelectedGodownIds] = useState<string[]>([])
  const [activeGodownId, setActiveGodownId] = useState('')
  const [godownProducts, setGodownProducts] = useState<Record<string, StockedProduct[]>>({})
  const [productsLoading, setProductsLoading] = useState(false)
  const [lineQty, setLineQty] = useState<Record<string, number>>({})
  const [customerName, setCustomerName] = useState('')
  const [deliveryAt, setDeliveryAt] = useState('')
  const [returnExpectedAt, setReturnExpectedAt] = useState('')
  const [vehicleLabel, setVehicleLabel] = useState('')
  const [siteName, setSiteName] = useState('')
  const [siteAddress, setSiteAddress] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [createBusy, setCreateBusy] = useState(false)
  const [createLinks, setCreateLinks] = useState<{
    deliveryVerifyUrl: string
    billerReturnUrl: string
    id: string
  } | null>(null)
  const [createBillerMode, setCreateBillerMode] = useState(false)
  const [newBiller, setNewBiller] = useState({
    siteName: '',
    siteAddress: '',
    contactName: '',
    contactPhone: '',
    email: '',
  })
  const [billerCreateBusy, setBillerCreateBusy] = useState(false)
  const [branchFilter, setBranchFilter] = useState('')
  const [createGodownOpen, setCreateGodownOpen] = useState(false)
  const [newGodown, setNewGodown] = useState({
    name: '',
    code: '',
    address: '',
    mobile: '',
    location: '',
    city: '',
    password: '',
  })
  const [godownCreateBusy, setGodownCreateBusy] = useState(false)
  const [wizardError, setWizardError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | undefined>()

  const canCreate = auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')
  const canCreateBiller = auth.status === 'authenticated' && auth.user.role === 'ADMIN'
  const canCreateGodown = auth.status === 'authenticated' && auth.user.role === 'ADMIN'

  const resetWizard = () => {
    setStep(1)
    setBillerId('')
    setSelectedGodownIds([])
    setActiveGodownId('')
    setGodownProducts({})
    setProductsLoading(false)
    setLineQty({})
    setProductSearch('')
    setCustomerName('')
    setDeliveryAt('')
    setReturnExpectedAt('')
    setVehicleLabel('')
    setSiteName('')
    setSiteAddress('')
    setContactPhone('')
    setCreateLinks(null)
    setCreateBillerMode(false)
    setNewBiller({ siteName: '', siteAddress: '', contactName: '', contactPhone: '', email: '' })
    setBranchFilter('')
    setCreateGodownOpen(false)
    setNewGodown({ name: '', code: '', address: '', mobile: '', location: '', city: '', password: '' })
    setWizardError(null)
    setOrderId(undefined)
  }

  useEffect(() => {
    if (!open || !prefill) return
    if (prefill.orderId) setOrderId(prefill.orderId)
    if (prefill.customerName) setCustomerName(prefill.customerName)
    if (prefill.siteName) setSiteName(prefill.siteName)
    if (prefill.siteAddress) setSiteAddress(prefill.siteAddress)
    if (prefill.contactPhone) setContactPhone(prefill.contactPhone)
    if (prefill.deliveryAt) {
      const d = new Date(prefill.deliveryAt)
      if (!Number.isNaN(d.getTime())) {
        setDeliveryAt(d.toISOString().slice(0, 16))
      }
    }
    if (prefill.returnExpectedAt) {
      const d = new Date(prefill.returnExpectedAt)
      if (!Number.isNaN(d.getTime())) {
        setReturnExpectedAt(d.toISOString().slice(0, 16))
      }
    }
    if (prefill.fromGodownId) {
      setSelectedGodownIds([prefill.fromGodownId])
      setActiveGodownId(prefill.fromGodownId)
    }
  }, [open, prefill])

  const createGodownInline = async () => {
    const token = getToken()
    if (!token || !canCreateGodown) return
    if (!newGodown.name.trim() || !newGodown.code.trim() || !newGodown.mobile.trim() || newGodown.password.length < 6) {
      setWizardError('Godown name, code, mobile, and password (min 6) are required')
      return
    }
    setGodownCreateBusy(true)
    setWizardError(null)
    try {
      const created = await apiFetch<GodownRow>('/godowns', {
        token,
        method: 'POST',
        body: JSON.stringify({
          name: newGodown.name.trim(),
          code: newGodown.code.trim(),
          address: newGodown.address.trim() || undefined,
          mobile: newGodown.mobile.trim(),
          location: newGodown.location.trim() || undefined,
          city: newGodown.city.trim() || undefined,
          password: newGodown.password,
        }),
      })
      setGodowns((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      const branch = godownBranch(created)
      setBranchFilter(branch)
      setSelectedGodownIds((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]))
      setActiveGodownId(created.id)
      void loadGodownProducts(created.id)
      setCreateGodownOpen(false)
      setNewGodown({ name: '', code: '', address: '', mobile: '', location: '', city: '', password: '' })
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Create godown failed'
      setWizardError(msg)
    } finally {
      setGodownCreateBusy(false)
    }
  }

  const handleClose = () => {
    onClose()
    setContinueEditId(null)
    if (createLinks) resetWizard()
  }

  const loadDeliveryForEdit = async (id: string) => {
    const token = getToken()
    if (!token) return
    setEditLoading(true)
    setWizardError(null)
    try {
      const d = await apiFetch<DeliveryDetailForEdit>(`/deliveries/${id}`, { token })
      setBillerId(d.billerUserId || '')
      setCustomerName(d.customerName)
      setSiteName(d.siteName || '')
      setSiteAddress(d.siteAddress || '')
      setContactPhone(d.contactPhone || '')
      setVehicleLabel(d.vehicleLabel || '')
      setDeliveryAt(toDatetimeLocalValue(d.deliveryAt))
      setReturnExpectedAt(toDatetimeLocalValue(d.returnExpectedAt))
      const godownIds = [
        ...new Set(
          d.lines.map((l) => l.godownId || d.fromGodownId).filter((gid): gid is string => !!gid),
        ),
      ]
      if (godownIds.length === 0 && d.fromGodownId) godownIds.push(d.fromGodownId)
      setSelectedGodownIds(godownIds)
      setActiveGodownId(godownIds[0] || '')
      const qty: Record<string, number> = {}
      for (const line of d.lines) {
        const gid = line.godownId || d.fromGodownId
        if (!gid) continue
        const key = lineKey(gid, line.productId)
        qty[key] = (qty[key] || 0) + line.qty
      }
      setLineQty(qty)
      setGodownProducts({})
      setStep(1)
      setCreateLinks(null)
      const role = auth.status === 'authenticated' ? auth.user.role : ''
      setEditMetadataOnly(
        role === 'ADMIN' &&
          !isDeliveryDeletable({
            status: d.status,
            dispatchedTagIds: d.dispatchedTagIds,
            pickedUpTagIds: d.pickedUpTagIds,
            deliveredTagIds: d.deliveredTagIds,
            returnPickedUpTagIds: d.returnPickedUpTagIds,
            returnedTagIds: d.returnedTagIds,
            damagedTagIds: d.damagedTagIds,
            lostTagIds: d.lostTagIds,
          }),
      )
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load delivery'
      setWizardError(msg)
    } finally {
      setEditLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    if (!deliveryId) {
      resetWizard()
      setContinueEditId(null)
      setEditMetadataOnly(false)
    }
  }, [open, deliveryId])

  useEffect(() => {
    if (!open || !effectiveEditId) return
    void loadDeliveryForEdit(effectiveEditId)
  }, [open, effectiveEditId])

  useEffect(() => {
    if (!open || !canCreate) return
    const token = getToken()
    if (!token) return
    apiFetch<UserRow[]>('/users/billers', { token })
      .then((rows) => {
        setBillers(rows)
        if (auth.status === 'authenticated' && auth.user.role === 'BILLER') {
          setBillerId(auth.user.id)
        }
      })
      .catch(() => setBillers([]))
    apiFetch<GodownRow[]>('/godowns', { token }).then(setGodowns).catch(() => {})
  }, [open, canCreate, auth])

  const loadGodownProducts = async (godownId: string) => {
    const token = getToken()
    if (!token) return
    setProductsLoading(true)
    try {
      const [catalog, stock] = await Promise.all([
        apiFetch<CatalogRow[]>(`/godowns/${godownId}/products`, { token }),
        apiFetch<Array<{ godownId: string; productId: string; qty: number }>>(
          `/reports/stock?godownId=${encodeURIComponent(godownId)}`,
          { token },
        ),
      ])
      const stockMap = new Map(stock.map((s) => [s.productId, s.qty]))
      const stocked: StockedProduct[] = catalog
        .filter((c) => c.enabled && (stockMap.get(c.productId) ?? 0) > 0)
        .map((c) => ({ ...c, stockQty: stockMap.get(c.productId) ?? 0 }))
        .sort((a, b) => (a.particulars || '').localeCompare(b.particulars || ''))
      setGodownProducts((prev) => ({ ...prev, [godownId]: stocked }))
    } catch {
      setGodownProducts((prev) => ({ ...prev, [godownId]: [] }))
    } finally {
      setProductsLoading(false)
    }
  }

  const addGodownToSelection = (id: string) => {
    if (selectedGodownIds.includes(id)) {
      selectGodownForProducts(id)
      return
    }
    void loadGodownProducts(id)
    setSelectedGodownIds((prev) => [...prev, id])
    setActiveGodownId(id)
  }

  const toggleGodown = (id: string) => {
    setSelectedGodownIds((prev) => {
      if (prev.includes(id)) {
        setLineQty((q) => {
          const next = { ...q }
          for (const k of Object.keys(next)) {
            if (k.startsWith(`${id}:`)) delete next[k]
          }
          return next
        })
        setGodownProducts((gp) => {
          const next = { ...gp }
          delete next[id]
          return next
        })
        const next = prev.filter((x) => x !== id)
        if (activeGodownId === id) setActiveGodownId(next[0] || '')
        return next
      }
      void loadGodownProducts(id)
      setActiveGodownId(id)
      return [...prev, id]
    })
  }

  useEffect(() => {
    if (step !== 3 || !open || selectedGodownIds.length === 0) return
    const token = getToken()
    if (!token) return
    for (const gid of selectedGodownIds) {
      if (!godownProducts[gid]) void loadGodownProducts(gid)
    }
    if (!activeGodownId || !selectedGodownIds.includes(activeGodownId)) {
      setActiveGodownId(selectedGodownIds[0])
    }
  }, [step, open, selectedGodownIds])

  useEffect(() => {
    const b = billers.find((x) => x.id === billerId)
    if (b) {
      setSiteName(b.siteName || '')
      setContactPhone(b.contactPhone || '')
      setCustomerName(b.siteName || b.contactName || b.email?.split('@')[0] || '')
      setSiteAddress(b.siteAddress || '')
    }
  }, [billerId, billers])

  const linesPayload = useMemo(() => {
    const lines: Array<{ productId: string; godownId: string; qty: number }> = []
    for (const [key, qty] of Object.entries(lineQty)) {
      if (qty <= 0) continue
      const sep = key.indexOf(':')
      if (sep <= 0) continue
      const godownId = key.slice(0, sep)
      const productId = key.slice(sep + 1)
      lines.push({ godownId, productId, qty })
    }
    return lines
  }, [lineQty])

  const totalUnits = useMemo(
    () => Object.values(lineQty).reduce((sum, q) => sum + (q > 0 ? q : 0), 0),
    [lineQty],
  )

  const selectedBiller = billers.find((b) => b.id === billerId)
  const selectedGodownLabels = useMemo(
    () =>
      selectedGodownIds
        .map((id) => godowns.find((g) => g.id === id)?.name)
        .filter(Boolean)
        .join(', '),
    [selectedGodownIds, godowns],
  )

  const activeProducts = godownProducts[activeGodownId] ?? []

  const filteredCatalog = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return activeProducts
    return activeProducts.filter(
      (c) =>
        (c.particulars?.toLowerCase().includes(q) ?? false) ||
        (c.sku?.toLowerCase().includes(q) ?? false),
    )
  }, [activeProducts, productSearch])

  const activeGodown = godowns.find((g) => g.id === activeGodownId)

  const pickedByGodownId = useMemo(() => {
    const m = new Map<string, { lines: number; units: number }>()
    for (const line of linesPayload) {
      const cur = m.get(line.godownId) ?? { lines: 0, units: 0 }
      cur.lines += 1
      cur.units += line.qty
      m.set(line.godownId, cur)
    }
    return m
  }, [linesPayload])

  const selectGodownForProducts = (gid: string) => {
    setActiveGodownId(gid)
    setProductSearch('')
    if (!godownProducts[gid]) void loadGodownProducts(gid)
  }

  const branchOptions = useMemo(() => {
    const set = new Set(godowns.map(godownBranch))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [godowns])

  const godownsInBranch = useMemo(() => {
    if (!branchFilter) return godowns
    return godowns.filter((g) => godownBranch(g) === branchFilter)
  }, [godowns, branchFilter])

  const selectedInBranch = useMemo(
    () => selectedGodownIds.map((id) => godowns.find((g) => g.id === id)).filter((g): g is GodownRow => !!g && (!branchFilter || godownBranch(g) === branchFilter)),
    [selectedGodownIds, godowns, branchFilter],
  )

  const availableInBranch = useMemo(
    () => godownsInBranch.filter((g) => !selectedGodownIds.includes(g.id)),
    [godownsInBranch, selectedGodownIds],
  )

  const nextDisabled =
    (step === 1 && ((createBillerMode || billers.length === 0) ? !newBiller.siteName.trim() : !billerId)) ||
    (step === 2 && selectedGodownIds.length === 0) ||
    (step === 3 && linesPayload.length === 0) ||
    (step === 4 && (!customerName.trim() || !deliveryAt || createBusy))

  const handleNext = async () => {
    setWizardError(null)
    if (step === 1 && (createBillerMode || billers.length === 0) && !billerId) {
      if (!newBiller.siteName.trim()) return
      const token = getToken()
      if (!token || !canCreateBiller) {
        setWizardError('Only admin can create a new biller')
        return
      }
      setBillerCreateBusy(true)
      try {
        const created = await apiFetch<UserRow>('/users/billers', {
          token,
          method: 'POST',
          body: JSON.stringify({
            siteName: newBiller.siteName.trim(),
            siteAddress: newBiller.siteAddress.trim() || undefined,
            contactName: newBiller.contactName.trim() || undefined,
            contactPhone: newBiller.contactPhone.trim() || undefined,
            email: newBiller.email.trim() || undefined,
            password: '123456',
          }),
        })
        setBillers((prev) => [...prev, created])
        setBillerId(created.id)
        setCreateBillerMode(false)
        setStep(2)
      } catch (e: unknown) {
        const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Create biller failed'
        setWizardError(msg)
      } finally {
        setBillerCreateBusy(false)
      }
      return
    }
    if (step < 4) {
      setStep((s) => s + 1)
      return
    }
    const token = getToken()
    if (!token) return
    setCreateBusy(true)
    const body = {
      orderId: orderId || undefined,
      billerUserId: billerId,
      fromGodownId: selectedGodownIds[0],
      customerName: customerName.trim(),
      siteName: siteName.trim() || undefined,
      siteAddress: siteAddress.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      deliveryAt: new Date(deliveryAt).toISOString(),
      returnExpectedAt: returnExpectedAt ? new Date(returnExpectedAt).toISOString() : undefined,
      vehicleLabel: vehicleLabel.trim() || undefined,
      lines: linesPayload,
    }
    try {
      const res = await apiFetch<{
        id: string
        deliveryNo: string
        deliveryVerifyUrl: string
        billerReturnUrl: string
      }>(isEditMode ? `/deliveries/${effectiveEditId}` : '/deliveries', {
        token,
        method: isEditMode ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      })
      setCreateLinks({
        id: res.id,
        deliveryVerifyUrl: res.deliveryVerifyUrl,
        billerReturnUrl: res.billerReturnUrl,
      })
      window.dispatchEvent(new CustomEvent('godown-stock-changed'))
      setGodownProducts({})
      if (isEditMode) onUpdated?.()
      else onCreated()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : isEditMode
            ? 'Update failed'
            : 'Create failed'
      setWizardError(msg)
    } finally {
      setCreateBusy(false)
    }
  }

  const footer = createLinks ? (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
      <Button variant="secondary" onClick={handleClose}>
        Close
      </Button>
      {!isEditMode && auth.status === 'authenticated' && auth.user.role === 'ADMIN' ? (
        <Button
          variant="secondary"
          onClick={() => {
            const id = createLinks.id
            setCreateLinks(null)
            setContinueEditId(id)
            void loadDeliveryForEdit(id)
          }}
        >
          Edit delivery
        </Button>
      ) : null}
      <Button
        onClick={() => {
          nav(`/deliveries/${createLinks.id}`)
          handleClose()
        }}
      >
        Open delivery details
      </Button>
    </div>
  ) : (
    <div className="flex items-center justify-between gap-3">
      <Button
        variant="ghost"
        onClick={() => {
          if (step <= 1) handleClose()
          else setStep((s) => s - 1)
        }}
      >
        {step <= 1 ? 'Cancel' : 'Back'}
      </Button>
      <Button
        disabled={nextDisabled}
        loading={step === 4 ? createBusy : step === 1 && billerCreateBusy}
        onClick={() => void handleNext()}
      >
        {step === 4
          ? isEditMode
            ? 'Update delivery'
            : 'Create delivery'
          : step === 1 && billerCreateBusy
            ? 'Saving biller…'
            : 'Continue'}
      </Button>
    </div>
  )

  return (
    <Modal
      open={open}
      onClose={handleClose}
      className="max-w-3xl overflow-hidden"
      title={undefined}
      footer={footer}
    >
      {editLoading ? (
        <p className="py-16 text-center text-sm text-slate-500">Loading delivery…</p>
      ) : createLinks ? (
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-200">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12.5 9.5 17 19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {isEditMode ? 'Delivery updated' : 'Delivery created'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Share the links below with your delivery person and biller.
          </p>
          <div className="mt-6 space-y-3 text-left">
            <LinkCard
              label="Delivery verify link"
              description="For the delivery person to confirm handover"
              url={createLinks.deliveryVerifyUrl}
            />
            <LinkCard
              label="Biller return link"
              description="For the biller to confirm equipment return"
              url={createLinks.billerReturnUrl}
            />
          </div>
        </div>
      ) : (
        <div>
          <div className="-mx-5 -mt-4 mb-0 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700 px-5 py-5 text-white">
            <h2 className="text-lg font-bold">{isEditMode ? 'Edit delivery' : 'New delivery'}</h2>
            <p className="mt-0.5 text-sm text-violet-100">
              {isEditMode
                ? editMetadataOnly
                  ? 'Update schedule and customer details. Line changes are limited while scans are in progress.'
                  : 'Update biller, godowns, products, and schedule.'
                : 'Select godowns first, then pick in-stock products from each.'}
            </p>
          </div>

          <div className="mt-5">
            <WizardStepper step={step} />

            {wizardError ? (
              <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
                {wizardError}
              </div>
            ) : null}

            {step === 1 ? (
              <div>
                <StepHeader
                  title="Select biller"
                  description="Choose the customer account for this delivery, or register a new biller."
                />
                {billers.length === 0 || createBillerMode ? (
                  <div className="space-y-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/50 to-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                        <StepIcon step={1} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {billers.length === 0 ? 'No billers yet' : 'New biller'}
                        </p>
                        <p className="text-xs text-slate-500">Default login password: 123456</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="Company / office name *"
                        value={newBiller.siteName}
                        onChange={(e) => setNewBiller((f) => ({ ...f, siteName: e.target.value }))}
                      />
                      <Input
                        label="Contact person"
                        value={newBiller.contactName}
                        onChange={(e) => setNewBiller((f) => ({ ...f, contactName: e.target.value }))}
                      />
                      <Input
                        label="Mobile number"
                        value={newBiller.contactPhone}
                        onChange={(e) => setNewBiller((f) => ({ ...f, contactPhone: e.target.value }))}
                      />
                      <Input
                        label="Email (optional)"
                        value={newBiller.email}
                        onChange={(e) => setNewBiller((f) => ({ ...f, email: e.target.value }))}
                        placeholder="optional@example.com"
                      />
                    </div>
                    <Input
                      label="Address"
                      value={newBiller.siteAddress}
                      onChange={(e) => setNewBiller((f) => ({ ...f, siteAddress: e.target.value }))}
                    />
                    {billers.length > 0 ? (
                      <Button variant="ghost" size="sm" onClick={() => setCreateBillerMode(false)}>
                        ← Select existing biller
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Select
                      label="Biller"
                      value={billerId}
                      onChange={(e) => setBillerId(e.target.value)}
                      options={[
                        { value: '', label: 'Select biller…' },
                        ...billers.map((b) => ({
                          value: b.id,
                          label: `${b.siteName || b.contactName || 'Biller'}${b.contactPhone ? ` · ${b.contactPhone}` : ''}`,
                        })),
                      ]}
                    />
                    {selectedBiller ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {selectedBiller.siteName || selectedBiller.contactName || 'Biller'}
                        </p>
                        {selectedBiller.siteAddress ? (
                          <p className="mt-1 text-sm text-slate-600">{selectedBiller.siteAddress}</p>
                        ) : null}
                        {selectedBiller.contactPhone ? (
                          <p className="mt-1 text-sm text-violet-700">{selectedBiller.contactPhone}</p>
                        ) : null}
                      </div>
                    ) : null}
                    {canCreateBiller && !isEditMode ? (
                      <Button variant="secondary" size="sm" onClick={() => setCreateBillerMode(true)}>
                        + Register new biller
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}

            {step === 2 ? (
              <div>
                <StepHeader
                  title="Select godowns"
                  description="Filter by branch, select godowns, or add a new godown if it is missing."
                />
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <Select
                    label="Branch / location"
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    options={[
                      { value: '', label: 'All branches' },
                      ...branchOptions.map((b) => ({ value: b, label: b })),
                    ]}
                  />
                  {selectedGodownIds.length > 0 ? (
                    <div className="flex items-end">
                      <p className="w-full rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800 ring-1 ring-violet-100">
                        {selectedGodownIds.length} godown{selectedGodownIds.length > 1 ? 's' : ''} selected
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {godownsInBranch.map((g) => {
                    const selected = selectedGodownIds.includes(g.id)
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGodown(g.id)}
                        className={
                          selected
                            ? 'rounded-2xl border-2 border-violet-500 bg-violet-50 p-4 text-left shadow-md shadow-violet-100 ring-2 ring-violet-200 transition'
                            : 'rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-violet-200 hover:bg-violet-50/30 hover:shadow-sm'
                        }
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={
                              selected
                                ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white'
                                : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600'
                            }
                          >
                            <StepIcon step={2} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900">{g.name}</p>
                            {g.code ? <p className="text-xs font-mono text-slate-500">{g.code}</p> : null}
                            <p className="mt-1 text-xs font-medium text-violet-600">Branch: {godownBranch(g)}</p>
                            {g.location ? <p className="mt-0.5 text-sm text-slate-600">{g.location}</p> : null}
                          </div>
                          {selected ? (
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
                              <CheckIcon />
                            </div>
                          ) : null}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {godownsInBranch.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    No godowns in this branch. Try another branch or add a new godown below.
                  </p>
                ) : null}
                {canCreateGodown && !isEditMode ? (
                  <div className="mt-4 space-y-3 rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-4">
                    {!createGodownOpen ? (
                      <Button variant="secondary" size="sm" onClick={() => setCreateGodownOpen(true)}>
                        + Add new godown
                      </Button>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-900">New godown</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input label="Name *" value={newGodown.name} onChange={(e) => setNewGodown((f) => ({ ...f, name: e.target.value }))} />
                          <Input label="Code *" value={newGodown.code} onChange={(e) => setNewGodown((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
                          <Input label="Branch / city *" value={newGodown.city} onChange={(e) => setNewGodown((f) => ({ ...f, city: e.target.value }))} placeholder="e.g. Chennai" />
                          <Input label="Location" value={newGodown.location} onChange={(e) => setNewGodown((f) => ({ ...f, location: e.target.value }))} />
                          <Input label="Mobile *" value={newGodown.mobile} onChange={(e) => setNewGodown((f) => ({ ...f, mobile: e.target.value }))} />
                          <Input label="Password *" type="password" value={newGodown.password} onChange={(e) => setNewGodown((f) => ({ ...f, password: e.target.value }))} />
                          <Input label="Address" value={newGodown.address} onChange={(e) => setNewGodown((f) => ({ ...f, address: e.target.value }))} className="sm:col-span-2" />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setCreateGodownOpen(false)}>
                            Cancel
                          </Button>
                          <Button size="sm" loading={godownCreateBusy} onClick={() => void createGodownInline()}>
                            Save godown
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                <StepHeader
                  title="Select products"
                  description="Choose branch, switch godown on the left, pick products on the right. Add godown if missing."
                />
                {editMetadataOnly ? (
                  <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
                    This delivery has scan activity. You can adjust quantities only within dispatched and scanned limits.
                  </div>
                ) : null}
                {selectedGodownIds.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-8 text-center text-sm text-amber-900">
                    Go back and select at least one godown first.
                  </div>
                ) : (
                  <div className="grid min-h-[22rem] grid-cols-1 gap-4 lg:grid-cols-[minmax(11rem,13rem)_1fr]">
                    <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-2">
                      <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        1. Branch & godown
                      </p>
                      <div className="px-2 pb-2">
                        <Select
                          label="Branch"
                          value={branchFilter}
                          onChange={(e) => setBranchFilter(e.target.value)}
                          options={[
                            { value: '', label: 'All branches' },
                            ...branchOptions.map((b) => ({ value: b, label: b })),
                          ]}
                        />
                      </div>
                      <div className="flex max-h-[14rem] flex-col gap-2 overflow-y-auto px-2 pb-2">
                        {selectedInBranch.length > 0 ? (
                          <>
                            <p className="text-[10px] font-semibold uppercase text-slate-400">Selected</p>
                            {selectedInBranch.map((g) => {
                              const isActive = activeGodownId === g.id
                              const picked = pickedByGodownId.get(g.id)
                              const inStock = godownProducts[g.id]?.length ?? 0
                              return (
                                <button
                                  key={g.id}
                                  type="button"
                                  onClick={() => selectGodownForProducts(g.id)}
                                  className={
                                    isActive
                                      ? 'rounded-xl border-2 border-violet-500 bg-white p-3 text-left shadow-md ring-2 ring-violet-100'
                                      : 'rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-violet-300'
                                  }
                                >
                                  <p className="font-semibold text-slate-900">{g.name}</p>
                                  <p className="text-xs text-violet-600">{godownBranch(g)}</p>
                                  <p className="mt-1 text-xs text-slate-500">{inStock} in stock</p>
                                  {picked ? (
                                    <p className="mt-1 text-xs font-semibold text-violet-700">
                                      {picked.lines} picked · {picked.units} units
                                    </p>
                                  ) : null}
                                </button>
                              )
                            })}
                          </>
                        ) : (
                          <p className="text-xs text-slate-500">No selected godown in this branch.</p>
                        )}
                        {availableInBranch.length > 0 ? (
                          <>
                            <p className="mt-2 text-[10px] font-semibold uppercase text-slate-400">Add from branch</p>
                            {availableInBranch.map((g) => (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => addGodownToSelection(g.id)}
                                className="flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-white p-2 text-left text-sm hover:border-violet-400 hover:bg-violet-50/50"
                              >
                                <span>
                                  <span className="font-medium text-slate-900">{g.name}</span>
                                  <span className="block text-xs text-slate-500">{godownBranch(g)}</span>
                                </span>
                                <span className="text-lg font-bold text-violet-600">+</span>
                              </button>
                            ))}
                          </>
                        ) : null}
                      </div>
                      {canCreateGodown && !isEditMode ? (
                        <div className="mt-auto border-t border-slate-200 p-2">
                          {!createGodownOpen ? (
                            <Button variant="secondary" size="sm" className="w-full" onClick={() => setCreateGodownOpen(true)}>
                              + Add godown
                            </Button>
                          ) : (
                            <div className="space-y-2">
                              <Input label="Name *" value={newGodown.name} onChange={(e) => setNewGodown((f) => ({ ...f, name: e.target.value }))} />
                              <Input label="Code *" value={newGodown.code} onChange={(e) => setNewGodown((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
                              <Input label="Branch *" value={newGodown.city} onChange={(e) => setNewGodown((f) => ({ ...f, city: e.target.value }))} />
                              <Input label="Mobile *" value={newGodown.mobile} onChange={(e) => setNewGodown((f) => ({ ...f, mobile: e.target.value }))} />
                              <Input label="Password *" type="password" value={newGodown.password} onChange={(e) => setNewGodown((f) => ({ ...f, password: e.target.value }))} />
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => setCreateGodownOpen(false)}>
                                  Cancel
                                </Button>
                                <Button size="sm" loading={godownCreateBusy} onClick={() => void createGodownInline()}>
                                  Save
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex min-h-[18rem] flex-col rounded-2xl border border-slate-200 bg-white">
                      {activeGodownId ? (
                        <>
                          <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                              2. Select products from
                            </p>
                            <p className="text-base font-bold text-slate-900">{activeGodown?.name}</p>
                            {activeGodown?.location ? (
                              <p className="text-xs text-slate-500">{activeGodown.location}</p>
                            ) : null}
                          </div>
                          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <Input
                              placeholder="Search product name or SKU…"
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              className="h-10 sm:max-w-xs"
                            />
                            <p className="text-sm font-semibold text-violet-800">
                              Total: {linesPayload.length} lines · {totalUnits} units
                            </p>
                          </div>
                          <div className="flex-1 overflow-y-auto p-3">
                            {productsLoading && !godownProducts[activeGodownId] ? (
                              <p className="py-12 text-center text-sm text-slate-500">Loading products…</p>
                            ) : activeProducts.length === 0 ? (
                              <p className="py-12 text-center text-sm text-slate-500">
                                No in-stock products here. Pick another godown on the left.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {filteredCatalog.map((c) => {
                                  const key = lineKey(activeGodownId, c.productId)
                                  const qty = lineQty[key] ?? 0
                                  const selected = qty > 0
                                  return (
                                    <div
                                      key={key}
                                      className={
                                        selected
                                          ? 'flex items-center justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3'
                                          : 'flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 hover:border-slate-200'
                                      }
                                    >
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium text-slate-900">{c.particulars}</p>
                                        <p className="font-mono text-xs text-slate-500">{c.sku || '—'}</p>
                                      </div>
                                      <QtyStepper
                                        value={qty}
                                        max={c.stockQty + qty}
                                        onChange={(n) => setLineQty((m) => ({ ...m, [key]: n }))}
                                      />
                                    </div>
                                  )
                                })}
                                {filteredCatalog.length === 0 ? (
                                  <p className="py-8 text-center text-sm text-slate-500">No match for your search.</p>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-500">
                          Select a godown on the left to see and pick products.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {step === 4 ? (
              <div>
                <StepHeader title="Schedule & location" description="Confirm delivery timing and site details." />
                {(selectedBiller || selectedGodownLabels || linesPayload.length > 0) && (
                  <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <SummaryChip
                      label="Biller"
                      value={selectedBiller?.siteName || selectedBiller?.contactName || ''}
                    />
                    <SummaryChip label="Godowns" value={selectedGodownLabels} />
                    <SummaryChip label="Items" value={`${linesPayload.length} lines · ${totalUnits} units`} />
                  </div>
                )}
                <div className="space-y-5">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Customer & site</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="Customer name *" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                      <Input label="Site name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                      <Input
                        label="Site address"
                        value={siteAddress}
                        onChange={(e) => setSiteAddress(e.target.value)}
                        className="sm:col-span-2"
                      />
                      <Input label="Contact phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                      <Input
                        label="Vehicle no. / label"
                        value={vehicleLabel}
                        onChange={(e) => setVehicleLabel(e.target.value)}
                        placeholder="e.g. TN-01-AB-1234"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Timing</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="Delivery at *"
                        type="datetime-local"
                        value={deliveryAt}
                        onChange={(e) => setDeliveryAt(e.target.value)}
                      />
                      <Input
                        label="Return expected (optional)"
                        type="datetime-local"
                        value={returnExpectedAt}
                        onChange={(e) => setReturnExpectedAt(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </Modal>
  )
}
