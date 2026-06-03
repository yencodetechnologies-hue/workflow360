import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDateTime } from '../../lib/format'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { PageHeader } from '../ui/PageHeader'
import { Table, Td, Th } from '../ui/Table'
import { apiFetch } from '../../lib/api'
import { getToken } from '../../auth/store'
import { ChallanPdfIcon, openDeliveryChallanPdf } from '../../lib/openChallanPdf'
import { Badge } from '../ui/Badge'
import { deliveryBadgeVariant, deliveryStatusLabel } from '../../lib/deliveryStatus'
import { scanPathForDelivery } from '../../lib/scanMode'
import {
  driverStopsForDelivery,
  normalizeDriverDeliveryRow,
  type DriverDeliveryListRow,
} from '../../lib/driverDeliveryLocations'

type DriverDeliveryDetailData = DriverDeliveryListRow & {
  challanNo?: string
}

function StopCard({ label, name, address, phone }: { label: string; name: string; address: string; phone?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-violet-700">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <div className="font-semibold text-slate-900">{name}</div>
        <div className="text-slate-600">{address}</div>
        {phone ? (
          <a href={`tel:${phone}`} className="inline-block font-medium text-violet-700 hover:underline">
            {phone}
          </a>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function DriverDeliveryDetail({ deliveryId }: { deliveryId?: string }) {
  const nav = useNavigate()
  const [d, setD] = useState<DriverDeliveryDetailData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [challanError, setChallanError] = useState<string | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token || !deliveryId) return
    setError(null)
    apiFetch<DriverDeliveryDetailData>(`/deliveries/${deliveryId}`, { token })
      .then((row) => setD(normalizeDriverDeliveryRow(row)))
      .catch((e: unknown) =>
        setError(
          e && typeof e === 'object' && 'message' in e
            ? String((e as { message: string }).message)
            : 'Failed to load',
        ),
      )
  }, [deliveryId])

  const openChallan = async () => {
    const token = getToken()
    if (!token || !deliveryId) return
    setChallanError(null)
    try {
      await openDeliveryChallanPdf(deliveryId, token)
    } catch (e: unknown) {
      setChallanError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to open challan')
    }
  }

  if (!deliveryId) return null

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

  const stops = driverStopsForDelivery(d.phase, d.pickupLocation, d.dropLocation)
  const scanPath = scanPathForDelivery('DELIVERY', d.status, d.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title={d.deliveryNo}
        subtitle={formatDateTime(d.deliveryAt)}
        right={
          <Link to="/deliveries" className="text-sm font-semibold text-slate-900 hover:text-slate-700">
            Back to list
          </Link>
        }
      />

      {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {challanError ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{challanError}</div> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={deliveryBadgeVariant(d.status)}>{deliveryStatusLabel(d.status)}</Badge>
        {d.vehicleLabel ? <span className="text-sm text-slate-600">Vehicle {d.vehicleLabel}</span> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StopCard {...stops.pickup} />
        <StopCard {...stops.drop} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-slate-700">
          <div>
            <span className="text-slate-500">Delivery: </span>
            {formatDateTime(d.deliveryAt)}
          </div>
          {d.returnExpectedAt ? (
            <div>
              <span className="text-slate-500">Return expected: </span>
              {formatDateTime(d.returnExpectedAt)}
            </div>
          ) : null}
          {d.contactPhone ? (
            <div>
              <span className="text-slate-500">Contact: </span>
              <a href={`tel:${d.contactPhone}`} className="font-medium text-violet-700 hover:underline">
                {d.contactPhone}
              </a>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          {d.lines.length === 0 ? (
            <p className="text-sm text-slate-600">No products on this delivery.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th className="text-right">Qty</Th>
                </tr>
              </thead>
              <tbody>
                {d.lines.map((l) => (
                  <tr key={l.productId} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{l.particulars || l.sku || l.productId}</Td>
                    <Td className="text-right font-semibold text-slate-900">
                      {l.qty}
                      {l.unit ? <span className="ml-1 font-normal text-slate-500">{l.unit}</span> : null}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => nav(scanPath)}>Scan</Button>
        <Button variant="secondary" onClick={openChallan} className="inline-flex items-center gap-2">
          <ChallanPdfIcon />
          Challan PDF
        </Button>
      </div>
    </div>
  )
}
