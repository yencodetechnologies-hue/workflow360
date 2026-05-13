import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDateTime } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'
import type { GodownRow } from '../Godowns/List'

type Tab = 'all' | 'UPCOMING' | 'DISPATCHED' | 'DELIVERED' | 'PENDING_RETURN' | 'COMPLETED'

function badgeVariant(status: string) {
  if (status === 'DISPATCHED') return 'green'
  if (status === 'UPCOMING') return 'blue'
  if (status === 'PENDING_RETURN') return 'amber'
  if (status === 'DELIVERED') return 'amber'
  return 'slate'
}

type DeliveryRow = {
  id: string
  deliveryNo: string
  customerName: string
  siteName?: string
  siteAddress?: string
  status: string
  deliveryAt: string
  fromGodownId?: string
}

type UserRow = {
  id: string
  email: string
  role: string
  siteName?: string
  contactPhone?: string
  active?: boolean
}

type CatalogRow = {
  productId: string
  enabled: boolean
  particulars?: string
  sku?: string
}

export function DeliveriesListPage() {
  const auth = useAuth()
  const nav = useNavigate()
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [billers, setBillers] = useState<UserRow[]>([])
  const [godowns, setGodowns] = useState<GodownRow[]>([])
  const [catalog, setCatalog] = useState<CatalogRow[]>([])
  const [billerId, setBillerId] = useState('')
  const [godownId, setGodownId] = useState('')
  const [lineQty, setLineQty] = useState<Record<string, number>>({})
  const [customerName, setCustomerName] = useState('')
  const [deliveryAt, setDeliveryAt] = useState('')
  const [returnExpectedAt, setReturnExpectedAt] = useState('')
  const [vehicleLabel, setVehicleLabel] = useState('')
  const [siteName, setSiteName] = useState('')
  const [siteAddress, setSiteAddress] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [createBusy, setCreateBusy] = useState(false)
  const [createLinks, setCreateLinks] = useState<{ deliveryVerifyUrl: string; billerReturnUrl: string; id: string } | null>(null)

  const canCreate = auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')

  const loadDeliveries = () => {
    const token = getToken()
    if (!token) return
    setError(null)
    apiFetch<DeliveryRow[]>('/deliveries?limit=200', { token })
      .then(setDeliveries)
      .catch((e: any) => setError(e?.message || 'Failed to load deliveries'))
  }

  useEffect(() => {
    loadDeliveries()
  }, [])

  useEffect(() => {
    if (!createOpen || !canCreate) return
    const token = getToken()
    if (!token) return
    apiFetch<UserRow[]>('/users', { token })
      .then((u) => setBillers(u.filter((x) => x.role === 'BILLER' && x.active !== false)))
      .catch(() => {})
    apiFetch<GodownRow[]>('/godowns', { token }).then(setGodowns).catch(() => {})
  }, [createOpen, canCreate])

  useEffect(() => {
    if (!godownId || !createOpen) {
      setCatalog([])
      return
    }
    const token = getToken()
    if (!token) return
    apiFetch<CatalogRow[]>(`/godowns/${godownId}/products`, { token })
      .then((rows) => {
        setCatalog(rows.filter((r) => r.enabled))
        const qmap: Record<string, number> = {}
        for (const r of rows) {
          if (r.enabled) qmap[r.productId] = 0
        }
        setLineQty(qmap)
      })
      .catch(() => setCatalog([]))
  }, [godownId, createOpen])

  useEffect(() => {
    const b = billers.find((x) => x.id === billerId)
    if (b) {
      setSiteName(b.siteName || '')
      setContactPhone(b.contactPhone || '')
      setCustomerName(b.siteName || b.email.split('@')[0] || '')
    }
  }, [billerId, billers])

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
    { id: 'UPCOMING', label: 'Upcoming' },
    { id: 'DISPATCHED', label: 'Dispatched' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'PENDING_RETURN', label: 'Pending returns' },
    { id: 'COMPLETED', label: 'Completed' },
  ]

  const linesPayload = useMemo(() => {
    const lines: Array<{ productId: string; qty: number }> = []
    for (const [productId, qty] of Object.entries(lineQty)) {
      if (qty > 0) lines.push({ productId, qty })
    }
    return lines
  }, [lineQty])

  const resetWizard = () => {
    setStep(1)
    setBillerId('')
    setGodownId('')
    setCatalog([])
    setLineQty({})
    setCustomerName('')
    setDeliveryAt('')
    setReturnExpectedAt('')
    setVehicleLabel('')
    setSiteName('')
    setSiteAddress('')
    setContactPhone('')
    setCreateLinks(null)
  }

  const openCreate = () => {
    resetWizard()
    setCreateOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Deliveries"
        subtitle="Create, assign, and track delivery status updates."
        right={canCreate ? <Button onClick={openCreate}>Create Delivery</Button> : null}
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Delivery list</CardTitle>
          <div className="w-full sm:w-72">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search deliveries…" className="h-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {tabs.map((t) => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={
                    active
                      ? 'rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white'
                      : 'rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200'
                  }
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          {error ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : rows.length === 0 ? (
            <EmptyState title="No deliveries found" subtitle="Try a different tab or search." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Delivery</Th>
                  <Th>Customer</Th>
                  <Th>Location</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Scheduled</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <Td className="font-semibold text-slate-900">{d.deliveryNo}</Td>
                      <Td>{d.customerName}</Td>
                      <Td className="max-w-[22rem] truncate">{d.siteName || d.siteAddress || '—'}</Td>
                      <Td>
                        <Badge variant={badgeVariant(d.status)}>{d.status}</Badge>
                      </Td>
                      <Td className="text-right text-xs text-slate-500">{formatDateTime(d.deliveryAt)}</Td>
                      <Td className="text-right space-x-2">
                        <Link
                          to={`/deliveries/${d.id}`}
                          className="mr-2 inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-sm font-medium text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
                        >
                          Details
                        </Link>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            if (auth.status !== 'authenticated') return
                            if (auth.user.role === 'DELIVERY') nav(`/scan/deliver/${d.id}`)
                            else if (auth.user.role === 'GODOWN') nav(`/scan/dispatch/${d.id}`)
                            else nav(`/scan/dispatch/${d.id}`)
                          }}
                        >
                          Scan
                        </Button>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        open={createOpen}
        title={createLinks ? 'Delivery created' : 'Create delivery'}
        onClose={() => setCreateOpen(false)}
      >
        {createLinks ? (
          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-900">
              Saved. Share these links with the delivery person and biller.
            </div>
            <div>
              <div className="font-semibold text-slate-800">Delivery verify</div>
              <div className="break-all text-xs text-slate-600">{createLinks.deliveryVerifyUrl}</div>
              <Button size="sm" variant="secondary" className="mt-1" onClick={() => navigator.clipboard.writeText(createLinks.deliveryVerifyUrl)}>
                Copy
              </Button>
            </div>
            <div>
              <div className="font-semibold text-slate-800">Biller return</div>
              <div className="break-all text-xs text-slate-600">{createLinks.billerReturnUrl}</div>
              <Button size="sm" variant="secondary" className="mt-1" onClick={() => navigator.clipboard.writeText(createLinks.billerReturnUrl)}>
                Copy
              </Button>
            </div>
            <Button
              onClick={() => {
                nav(`/deliveries/${createLinks.id}`)
                setCreateOpen(false)
              }}
            >
              Open delivery details
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="flex gap-2 text-xs font-semibold text-slate-500">
              <span className={step >= 1 ? 'text-slate-900' : ''}>1 Biller</span>
              <span>→</span>
              <span className={step >= 2 ? 'text-slate-900' : ''}>2 Godown</span>
              <span>→</span>
              <span className={step >= 3 ? 'text-slate-900' : ''}>3 Products</span>
              <span>→</span>
              <span className={step >= 4 ? 'text-slate-900' : ''}>4 Schedule</span>
            </div>

            {step === 1 ? (
              <Select
                label="Biller"
                value={billerId}
                onChange={(e) => setBillerId(e.target.value)}
                options={[
                  { value: '', label: 'Select biller' },
                  ...billers.map((b) => ({
                    value: b.id,
                    label: `${b.siteName || b.email} (${b.email})`,
                  })),
                ]}
              />
            ) : null}

            {step === 2 ? (
              <Select
                label="Source godown"
                value={godownId}
                onChange={(e) => setGodownId(e.target.value)}
                options={[
                  { value: '', label: 'Select godown' },
                  ...godowns.map((g) => ({
                    value: g.id,
                    label: `${g.code ? `${g.code} · ` : ''}${g.name}${g.location ? ` (${g.location})` : ''}`,
                  })),
                ]}
              />
            ) : null}

            {step === 3 ? (
              <div className="max-h-72 overflow-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalog.map((c) => (
                      <tr key={c.productId} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-900">{c.particulars}</td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-600">{c.sku}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            className="w-20 rounded border border-slate-200 px-2 py-1 text-right"
                            value={lineQty[c.productId] ?? 0}
                            onChange={(e) =>
                              setLineQty((m) => ({
                                ...m,
                                [c.productId]: Math.max(0, Number(e.target.value) || 0),
                              }))
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {catalog.length === 0 ? <div className="p-3 text-slate-600">No enabled products for this godown.</div> : null}
              </div>
            ) : null}

            {step === 4 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                <Input label="Site name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                <Input label="Site address" value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} />
                <Input label="Contact phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                <Input
                  label="Delivery at (local)"
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
                <Input label="Vehicle no. / label" value={vehicleLabel} onChange={(e) => setVehicleLabel(e.target.value)} />
              </div>
            ) : null}

            <div className="flex justify-between gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  if (step <= 1) setCreateOpen(false)
                  else setStep((s) => s - 1)
                }}
              >
                {step <= 1 ? 'Cancel' : 'Back'}
              </Button>
              <Button
                disabled={
                  (step === 1 && !billerId) ||
                  (step === 2 && !godownId) ||
                  (step === 3 && linesPayload.length === 0) ||
                  (step === 4 && (!customerName.trim() || !deliveryAt || createBusy))
                }
                onClick={() => {
                  if (step < 4) {
                    setStep((s) => s + 1)
                    return
                  }
                  const token = getToken()
                  if (!token) return
                  setCreateBusy(true)
                  const body = {
                    billerUserId: billerId,
                    fromGodownId: godownId,
                    customerName: customerName.trim(),
                    siteName: siteName.trim() || undefined,
                    siteAddress: siteAddress.trim() || undefined,
                    contactPhone: contactPhone.trim() || undefined,
                    deliveryAt: new Date(deliveryAt).toISOString(),
                    returnExpectedAt: returnExpectedAt ? new Date(returnExpectedAt).toISOString() : undefined,
                    vehicleLabel: vehicleLabel.trim() || undefined,
                    lines: linesPayload,
                  }
                  apiFetch<{ id: string; deliveryNo: string; deliveryVerifyUrl: string; billerReturnUrl: string }>('/deliveries', {
                    token,
                    method: 'POST',
                    body: JSON.stringify(body),
                  })
                    .then((res) => {
                      setCreateLinks({
                        id: res.id,
                        deliveryVerifyUrl: res.deliveryVerifyUrl,
                        billerReturnUrl: res.billerReturnUrl,
                      })
                      loadDeliveries()
                    })
                    .catch((e: any) => setError(e?.message || 'Create failed'))
                    .finally(() => setCreateBusy(false))
                }}
              >
                {step === 4 ? (createBusy ? 'Creating…' : 'Create') : 'Next'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
