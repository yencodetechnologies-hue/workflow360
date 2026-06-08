import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDateTime } from '../../lib/format'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { Input } from '../ui/Input'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'
import { deliveryBadgeVariant, deliveryStatusLabel } from '../../lib/deliveryStatus'
import { scanPathForDelivery } from '../../lib/scanMode'
import {
  driverStopsForDelivery,
  godownNameByIdFromPickups,
  normalizeDriverDeliveryRow,
  resolvePickupLocations,
  type DriverDeliveryListRow,
} from '../../lib/driverDeliveryLocations'
import { groupLinesByGodown } from '../../lib/deliveryLineGroups'

function groupDriverLines(d: DriverDeliveryRow) {
  return groupLinesByGodown(d.lines, {
    fallbackGodownId: d.fromGodownId,
    godownNameById: godownNameByIdFromPickups(d.pickupLocations),
  })
}

export type DriverDeliveryRow = DriverDeliveryListRow

type DriverTab = 'active' | 'all'

const ACTIVE_STATUSES = new Set(['PACKED', 'OUT_FOR_DELIVERY', 'RETURN_PICKUP'])

function LocationBlock({ label, name, address, phone }: { label: string; name: string; address: string; phone?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-primary-600">{label}</div>
      <div className="mt-1 font-semibold text-slate-900">{name}</div>
      <div className="mt-0.5 text-sm text-slate-600">{address}</div>
      {phone ? (
        <a href={`tel:${phone}`} className="mt-1 inline-block text-sm font-medium text-primary-700 hover:underline">
          {phone}
        </a>
      ) : null}
    </div>
  )
}

export function DriverDeliveriesDashboard() {
  const auth = useAuth()
  const nav = useNavigate()
  const [deliveries, setDeliveries] = useState<DriverDeliveryRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<DriverTab>('active')
  const [q, setQ] = useState('')

  const vehicleId = auth.status === 'authenticated' ? auth.user.loginId || auth.user.email : ''

  const loadDeliveries = () => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    setError(null)
    apiFetch<DriverDeliveryRow[]>('/deliveries?limit=200', { token })
      .then((rows) => setDeliveries(rows.map((row) => normalizeDriverDeliveryRow(row))))
      .catch((e: unknown) => {
        const msg =
          e && typeof e === 'object' && 'message' in e
            ? String((e as { message: string }).message)
            : 'Failed to load deliveries'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDeliveries()
  }, [])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return deliveries.filter((d) => {
      if (tab === 'active' && !ACTIVE_STATUSES.has(d.status)) return false
      if (!s) return true
      const { pickup, drop } = driverStopsForDelivery(d.phase, d.pickupLocation, d.dropLocation)
      return (
        d.deliveryNo.toLowerCase().includes(s) ||
        d.dropLocation.customerName.toLowerCase().includes(s) ||
        (d.dropLocation.siteName?.toLowerCase().includes(s) ?? false) ||
        (d.dropLocation.siteAddress?.toLowerCase().includes(s) ?? false) ||
        pickup.name.toLowerCase().includes(s) ||
        pickup.address.toLowerCase().includes(s) ||
        drop.name.toLowerCase().includes(s) ||
        drop.address.toLowerCase().includes(s)
      )
    })
  }, [deliveries, q, tab])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My deliveries</h1>
        <p className="mt-2 text-sm text-slate-500">
          {vehicleId ? `Vehicle ${vehicleId}` : 'Your assigned pickup and drop jobs'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={tab === 'active' ? 'primary' : 'secondary'}
          onClick={() => setTab('active')}
        >
          Active
        </Button>
        <Button
          size="sm"
          variant={tab === 'all' ? 'primary' : 'secondary'}
          onClick={() => setTab('all')}
        >
          All
        </Button>
      </div>

      <Input
        placeholder="Search delivery, customer, or address…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}

      {!loading && rows.length === 0 ? (
        <p className="text-sm text-slate-600">
          {tab === 'active' ? 'No active deliveries right now.' : 'No deliveries found.'}
        </p>
      ) : null}

      <div className="space-y-4">
        {rows.map((d) => {
          const stops = driverStopsForDelivery(d.phase, d.pickupLocation, d.dropLocation)
          const scanPath = scanPathForDelivery('DELIVERY', d.status, d.id)
          const linesByGodown = groupDriverLines(d)
          const pickupLocations = resolvePickupLocations(d, linesByGodown)
          return (
            <Card key={d.id} className="overflow-hidden">
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-sm font-semibold text-primary-700">{d.deliveryNo}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatDateTime(d.deliveryAt)}</div>
                  </div>
                  <Badge variant={deliveryBadgeVariant(d.status)}>{deliveryStatusLabel(d.status)}</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {d.phase !== 'RETURN' && pickupLocations.length > 1 ? (
                    <div className="space-y-2 sm:col-span-2">
                      {pickupLocations.map((loc, i) => (
                        <LocationBlock
                          key={loc.godownId || i}
                          label={`Pickup · ${loc.name}`}
                          name={loc.name}
                          address={loc.address || '—'}
                          phone={loc.mobile}
                        />
                      ))}
                    </div>
                  ) : (
                    <LocationBlock {...stops.pickup} />
                  )}
                  <LocationBlock {...stops.drop} />
                </div>

                {d.lines.length > 0 ? (
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Products by godown</div>
                    <div className="space-y-3">
                      {linesByGodown.map((group) => (
                        <div key={group.godownId} className="rounded-xl border border-slate-200 overflow-hidden">
                          <div className="bg-slate-50 px-3 py-2 text-xs font-semibold text-primary-700">{group.godownName}</div>
                          <ul className="space-y-1 p-3 text-sm">
                            {group.lines.map((l) => (
                              <li key={`${group.godownId}-${l.productId}`} className="flex justify-between gap-2">
                                <span className="text-slate-800">{l.particulars || l.sku || l.productId}</span>
                                <span className="shrink-0 font-semibold text-slate-900">
                                  {l.qty}
                                  {l.unit ? <span className="ml-0.5 font-normal text-slate-500">{l.unit}</span> : null}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => nav(`/deliveries/${d.id}`)}>
                    Open
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => nav(scanPath)}>
                    Scan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="text-center text-xs text-slate-400">
        <Link to="/deliveries" className="text-primary-600 hover:underline" onClick={(e) => { e.preventDefault(); loadDeliveries() }}>
          Refresh list
        </Link>
      </p>
    </div>
  )
}
