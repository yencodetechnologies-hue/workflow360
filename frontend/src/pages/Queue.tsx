import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { EmptyState, Table, Td, Th } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { apiFetch } from '../lib/api'
import { getToken, useAuth } from '../auth/store'
import { useGodownScope } from '../hooks/useGodownScope'
import { formatDateTime } from '../lib/format'
import { deliveryBadgeVariant, deliveryStatusLabel } from '../lib/deliveryStatus'
import { scanPathForDelivery } from '../lib/scanMode'

type QueueRow = {
  id: string
  deliveryNo: string
  customerName: string
  siteName?: string
  siteAddress?: string
  deliveryAt: string
  returnExpectedAt?: string
  status: string
  fromGodownId: string
  lines: Array<{ productId: string; qty: number }>
}

function todayKey() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function QueuePage() {
  const auth = useAuth()
  const nav = useNavigate()
  const { godownName } = useGodownScope()
  const [date, setDate] = useState(todayKey)
  const [rows, setRows] = useState<QueueRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vehicleModal, setVehicleModal] = useState<{ id: string; deliveryNo: string } | null>(null)
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [actionBusy, setActionBusy] = useState(false)

  const load = () => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    setError(null)
    apiFetch<QueueRow[]>(`/godowns/queue?date=${encodeURIComponent(date)}`, { token })
      .then(setRows)
      .catch((e: { message?: string }) => setError(e?.message || 'Failed to load queue'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [date])

  const subtitle = useMemo(() => {
    if (auth.status !== 'authenticated') return '—'
    if (auth.user.role === 'GODOWN') {
      return godownName
        ? `${godownName} — dispatch queue for selected date.`
        : 'Godown dispatch queue for selected date.'
    }
    return 'Date-wise delivery queue.'
  }, [auth, godownName])

  const isGodown =
    auth.status === 'authenticated' && (auth.user.role === 'GODOWN' || auth.user.role === 'ADMIN')

  const runOutForDelivery = async () => {
    const token = getToken()
    if (!token || !vehicleModal) return
    const v = vehicleNumber.trim()
    if (!v) return
    setActionBusy(true)
    try {
      await apiFetch(`/deliveries/${vehicleModal.id}/out-for-delivery`, {
        token,
        method: 'POST',
        body: JSON.stringify({ vehicleNumber: v }),
      })
      setVehicleModal(null)
      setVehicleNumber('')
      load()
    } catch (e: { message?: string }) {
      setError(e?.message || 'Failed')
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Godown queue"
        subtitle={subtitle}
        right={
          <div className="w-48">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        }
      />

      <Modal
        open={Boolean(vehicleModal)}
        title="Out for delivery"
        onClose={() => {
          setVehicleModal(null)
          setVehicleNumber('')
        }}
      >
        <p className="mb-3 text-sm text-slate-600">
          Assign vehicle for {vehicleModal?.deliveryNo}. Driver login uses this number; default password is{' '}
          <span className="font-mono font-semibold">123456</span> for new vehicles.
        </p>
        <Input
          label="Vehicle number"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value)}
          placeholder="e.g. TN09AB1234"
        />
        <div className="mt-4 flex gap-2">
          <Button onClick={runOutForDelivery} disabled={actionBusy || !vehicleNumber.trim()}>
            {actionBusy ? 'Saving…' : 'Confirm'}
          </Button>
          <Button variant="secondary" onClick={() => setVehicleModal(null)}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Scheduled deliveries</CardTitle>
          <div className="text-xs text-slate-500">{loading ? 'Loading…' : `${rows.length} deliveries`}</div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : rows.length === 0 ? (
            <EmptyState title="No deliveries scheduled" subtitle="Pick another date or create a delivery." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Delivery</Th>
                  <Th>Customer</Th>
                  <Th>Location</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Time</Th>
                  {isGodown ? <Th className="text-right">Actions</Th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">
                      <Link to={`/deliveries/${d.id}`} className="text-violet-600 hover:underline">
                        {d.deliveryNo}
                      </Link>
                    </Td>
                    <Td>{d.customerName}</Td>
                    <Td className="max-w-[24rem] truncate">{d.siteName || d.siteAddress || '—'}</Td>
                    <Td>
                      <Badge variant={deliveryBadgeVariant(d.status)}>{deliveryStatusLabel(d.status)}</Badge>
                    </Td>
                    <Td className="text-right text-xs text-slate-500">{formatDateTime(d.deliveryAt)}</Td>
                    {isGodown ? (
                      <Td className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          {d.status === 'PROCESSED' || d.status === 'PACKED' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                nav(
                                  scanPathForDelivery(
                                    auth.status === 'authenticated' ? auth.user.role : 'GODOWN',
                                    d.status,
                                    d.id,
                                  ),
                                )
                              }
                            >
                              Scan
                            </Button>
                          ) : null}
                          {d.status === 'PACKED' ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                setVehicleModal({ id: d.id, deliveryNo: d.deliveryNo })
                                setVehicleNumber('')
                              }}
                            >
                              Out for delivery
                            </Button>
                          ) : null}
                          {d.status === 'RETURN_PICKUP' || d.status === 'DELIVERED' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => nav(`/scan/return/${d.id}`)}
                            >
                              Return scan
                            </Button>
                          ) : null}
                        </div>
                      </Td>
                    ) : null}
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
