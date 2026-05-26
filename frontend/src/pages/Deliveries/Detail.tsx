import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatDateTime } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, Td, Th } from '../../components/ui/Table'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'
import { deliveryBadgeVariant, deliveryStatusLabel } from '../../lib/deliveryStatus'
import { scanPathForDelivery } from '../../lib/scanMode'

type DeliveryLine = {
  productId: string
  godownId?: string
  godownName?: string
  qty: number
  particulars?: string
  sku?: string
  rate?: string
  parsedRate?: number
  unit?: string
}

type BillerReturnLine = {
  productId: string
  qty: number
  particulars?: string
  sku?: string
  note?: string
}

type DeliveryDetail = {
  id: string
  deliveryNo: string
  customerName: string
  siteName?: string
  siteAddress?: string
  contactPhone?: string
  billerUserId?: string
  fromGodownId: string
  deliveryAt: string
  returnExpectedAt?: string
  vehicleLabel?: string
  returnPickupVehicleLabel?: string
  status: string
  lines: DeliveryLine[]
  scanProgress?: {
    dispatchComplete?: boolean
    returnPickupComplete?: boolean
  }
  deliveryVerifierName?: string
  deliveryVerifiedAt?: string
  billerReturnSubmittedAt?: string
  billerMissingLines?: BillerReturnLine[]
  billerDamagedLines?: BillerReturnLine[]
  damageTotal?: number
  missingTotal?: number
  deliveryVerifyUrl?: string
  billerReturnUrl?: string
}

export function DeliveryDetailPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const auth = useAuth()
  const [d, setD] = useState<DeliveryDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false)
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [returnVehicle, setReturnVehicle] = useState('')
  const [actionBusy, setActionBusy] = useState(false)

  const load = () => {
    const token = getToken()
    if (!token || !id) return
    setError(null)
    apiFetch<DeliveryDetail>(`/deliveries/${id}`, { token })
      .then(setD)
      .catch((e: unknown) =>
        setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load'),
      )
  }

  useEffect(() => {
    load()
  }, [id])

  const role = auth.status === 'authenticated' ? auth.user.role : ''
  const canRegen = role === 'ADMIN'
  const isGodown = role === 'GODOWN' || role === 'ADMIN'
  const isAdmin = role === 'ADMIN'

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const markPacked = async () => {
    const token = getToken()
    if (!token || !id) return
    setActionBusy(true)
    try {
      await apiFetch(`/deliveries/${id}/mark-packed`, { token, method: 'POST' })
      load()
    } catch (e: unknown) {
      setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Mark packed failed')
    } finally {
      setActionBusy(false)
    }
  }

  const outForDelivery = async () => {
    const token = getToken()
    if (!token || !id) return
    const v = vehicleNumber.trim()
    if (!v) return
    setActionBusy(true)
    try {
      await apiFetch(`/deliveries/${id}/out-for-delivery`, {
        token,
        method: 'POST',
        body: JSON.stringify({ vehicleNumber: v }),
      })
      setVehicleModalOpen(false)
      setVehicleNumber('')
      load()
    } catch (e: unknown) {
      setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Out for delivery failed')
    } finally {
      setActionBusy(false)
    }
  }

  const assignReturnPickup = async () => {
    const token = getToken()
    if (!token || !id) return
    const v = returnVehicle.trim()
    if (!v) return
    setActionBusy(true)
    try {
      await apiFetch(`/deliveries/${id}/assign-return-pickup`, {
        token,
        method: 'POST',
        body: JSON.stringify({ vehicleNumber: v }),
      })
      setReturnModalOpen(false)
      setReturnVehicle('')
      load()
    } catch (e: unknown) {
      setError(
        e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Assign return pickup failed',
      )
    } finally {
      setActionBusy(false)
    }
  }

  if (!id) return null

  if (error && !d) {
    return (
      <div>
        <PageHeader title="Delivery" subtitle="Error" right={<Link to="/deliveries" className="text-sm font-semibold">Back</Link>} />
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      </div>
    )
  }

  if (!d) {
    return (
      <div>
        <PageHeader title="Delivery" subtitle="Loading…" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={d.deliveryNo}
        subtitle={`${d.customerName} • ${d.siteName || d.siteAddress || '—'}`}
        right={
          <Link to="/deliveries" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
            Back to list
          </Link>
        }
      />

      {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <Modal open={vehicleModalOpen} title="Out for delivery" onClose={() => setVehicleModalOpen(false)}>
        <p className="mb-3 text-sm text-slate-600">
          Enter vehicle number. Driver logs in with this number; default password <span className="font-mono">123456</span>{' '}
          for auto-created accounts.
        </p>
        <Input label="Vehicle number" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
        <div className="mt-4 flex gap-2">
          <Button onClick={outForDelivery} disabled={actionBusy || !vehicleNumber.trim()}>
            Confirm
          </Button>
          <Button variant="secondary" onClick={() => setVehicleModalOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal open={returnModalOpen} title="Assign return pickup" onClose={() => setReturnModalOpen(false)}>
        <Input label="Vehicle number" value={returnVehicle} onChange={(e) => setReturnVehicle(e.target.value)} />
        <div className="mt-4 flex gap-2">
          <Button onClick={assignReturnPickup} disabled={actionBusy || !returnVehicle.trim()}>
            Assign
          </Button>
          <Button variant="secondary" onClick={() => setReturnModalOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      {isGodown ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {(d.status === 'PROCESSED' || d.status === 'PACKED') && (
            <Button variant="secondary" onClick={() => nav(scanPathForDelivery(role, d.status, d.id))}>
              Dispatch scan
            </Button>
          )}
          {d.status === 'PROCESSED' && d.scanProgress?.dispatchComplete ? (
            <Button variant="secondary" onClick={markPacked} disabled={actionBusy}>
              Mark packed
            </Button>
          ) : null}
          {d.status === 'PACKED' ? (
            <Button onClick={() => setVehicleModalOpen(true)}>Out for delivery</Button>
          ) : null}
          {(d.status === 'RETURN_PICKUP' || d.status === 'DELIVERED') && (
            <Button variant="secondary" onClick={() => nav(`/scan/return/${d.id}`)}>
              Return scan at godown
            </Button>
          )}
        </div>
      ) : null}

      {isAdmin && d.status === 'DELIVERED' ? (
        <div className="mb-4">
          <Button onClick={() => setReturnModalOpen(true)}>Assign return pickup</Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-600">Status</span>
              <Badge variant={deliveryBadgeVariant(d.status)}>{deliveryStatusLabel(d.status)}</Badge>
            </div>
            <div>
              <span className="text-slate-600">Scheduled: </span>
              {formatDateTime(d.deliveryAt)}
            </div>
            {d.returnExpectedAt ? (
              <div>
                <span className="text-slate-600">Return expected: </span>
                {formatDateTime(d.returnExpectedAt)}
              </div>
            ) : null}
            {d.vehicleLabel ? (
              <div>
                <span className="text-slate-600">Vehicle: </span>
                {d.vehicleLabel}
              </div>
            ) : null}
            {d.returnPickupVehicleLabel ? (
              <div>
                <span className="text-slate-600">Return pickup vehicle: </span>
                {d.returnPickupVehicleLabel}
              </div>
            ) : null}
            {d.contactPhone ? (
              <div>
                <span className="text-slate-600">Contact: </span>
                {d.contactPhone}
              </div>
            ) : null}
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="font-semibold text-slate-900">Delivery handover</div>
              {d.deliveryVerifiedAt ? (
                <div className="text-slate-700">
                  Verified by {d.deliveryVerifierName || '—'} ({formatDateTime(d.deliveryVerifiedAt)})
                </div>
              ) : (
                <div className="text-amber-700">Pending — share delivery verify link</div>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="font-semibold text-slate-900">Biller return</div>
              {d.billerReturnSubmittedAt ? (
                <>
                  <div className="text-slate-600">Submitted {formatDateTime(d.billerReturnSubmittedAt)}</div>
                  <div className="mt-1 text-slate-700">
                    Damage total: {d.damageTotal ?? '—'} · Missing total: {d.missingTotal ?? '—'}
                  </div>
                </>
              ) : (
                <div className="text-amber-700">Pending — share biller return link after delivery</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle>Magic links</CardTitle>
            {canRegen ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const token = getToken()
                  if (!token || !id) return
                  apiFetch<{ deliveryVerifyUrl: string; billerReturnUrl: string }>(`/deliveries/${id}/regenerate-tokens`, {
                    token,
                    method: 'POST',
                  })
                    .then(() => load())
                    .catch((e: unknown) =>
                      setError(
                        e && typeof e === 'object' && 'message' in e
                          ? String((e as { message: string }).message)
                          : 'Regenerate failed',
                      ),
                    )
                }}
              >
                Regenerate links
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <div className="font-semibold text-slate-800">Delivery verify</div>
              <div className="break-all text-slate-600">{d.deliveryVerifyUrl || '—'}</div>
              {d.deliveryVerifyUrl ? (
                <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.deliveryVerifyUrl || '')}>
                  Copy
                </Button>
              ) : null}
            </div>
            <div>
              <div className="font-semibold text-slate-800">Biller return</div>
              <div className="break-all text-slate-600">{d.billerReturnUrl || '—'}</div>
              {d.billerReturnUrl ? (
                <Button size="sm" variant="secondary" className="mt-1" onClick={() => copy(d.billerReturnUrl || '')}>
                  Copy
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {d.billerReturnSubmittedAt && (d.billerMissingLines?.length || d.billerDamagedLines?.length) ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Missing and damage (biller return)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-semibold text-slate-800">Missing products</div>
              {d.billerMissingLines?.length ? (
                <ul className="space-y-1 text-sm text-slate-700">
                  {d.billerMissingLines.map((l) => (
                    <li key={l.productId} className="flex justify-between gap-2">
                      <span>{l.particulars || l.sku || l.productId}</span>
                      <span className="font-semibold">qty {l.qty}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">None reported.</p>
              )}
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold text-slate-800">Damaged products</div>
              {d.billerDamagedLines?.length ? (
                <ul className="space-y-1 text-sm text-slate-700">
                  {d.billerDamagedLines.map((l) => (
                    <li key={l.productId} className="flex justify-between gap-2">
                      <span>{l.particulars || l.sku || l.productId}</span>
                      <span className="font-semibold">qty {l.qty}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">None reported.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Products in delivery</CardTitle>
        </CardHeader>
        <CardContent>
          {d.lines.length === 0 ? (
            <p className="text-sm text-slate-600">No products on this delivery.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>SKU</Th>
                  <Th>Godown</Th>
                  <Th className="text-right">Qty</Th>
                  <Th className="text-right">Rate</Th>
                </tr>
              </thead>
              <tbody>
                {d.lines.map((l) => (
                  <tr key={`${l.productId}-${l.godownId ?? ''}`} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{l.particulars || l.productId}</Td>
                    <Td className="font-mono text-xs text-slate-600">{l.sku || '—'}</Td>
                    <Td className="text-slate-700">{l.godownName || '—'}</Td>
                    <Td className="text-right font-semibold text-slate-900">
                      {l.qty}
                      {l.unit ? <span className="ml-1 font-normal text-slate-500">{l.unit}</span> : null}
                    </Td>
                    <Td className="text-right text-slate-700">{l.rate ?? '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
