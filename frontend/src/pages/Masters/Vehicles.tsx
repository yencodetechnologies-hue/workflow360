import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
import { apiFetch } from '../../lib/api'
import { getToken } from '../../auth/store'

type DeliveryRow = {
  id: string
  deliveryNo: string
  vehicleLabel?: string
  status: string
  customerName: string
}

export function VehiclesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const load = () => {
    const token = getToken()
    if (!token) return
    setError(null)
    setLoading(true)
    apiFetch<DeliveryRow[]>('/deliveries?limit=200', { token })
      .then(setDeliveries)
      .catch((e: { message?: string }) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const vehicles = useMemo(() => {
    const map = new Map<string, { label: string; count: number; lastStatus: string }>()
    for (const d of deliveries) {
      const label = (d.vehicleLabel || '').trim().toUpperCase()
      if (!label) continue
      const prev = map.get(label)
      map.set(label, {
        label,
        count: (prev?.count ?? 0) + 1,
        lastStatus: d.status,
      })
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [deliveries])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return vehicles
    return vehicles.filter((v) => v.label.toLowerCase().includes(s))
  }, [vehicles, q])

  return (
    <div>
      <PageHeader
        title="Masters: Vehicles"
        subtitle="Vehicle numbers from deliveries on the server (set when creating a delivery)."
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Vehicle numbers</CardTitle>
          <div className="flex w-full gap-2 sm:w-auto">
            <div className="w-full sm:w-72">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-10" />
            </div>
            <Button variant="secondary" onClick={load}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            To register a new delivery driver account, use{' '}
            <a href="/masters/delivery-persons" className="font-semibold text-slate-900 underline">
              Delivery Persons
            </a>
            . Vehicle labels here come from scheduled deliveries.
          </p>

          {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          {loading ? (
            <div className="text-sm text-slate-600">Loading…</div>
          ) : rows.length === 0 ? (
            <EmptyState title="No vehicles yet" subtitle="Create a delivery with a vehicle number to see it here." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Vehicle label</Th>
                  <Th className="text-right">Deliveries</Th>
                  <Th>Latest status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v.label} className="hover:bg-slate-50">
                    <Td className="font-mono font-semibold text-slate-900">{v.label}</Td>
                    <Td className="text-right">{v.count}</Td>
                    <Td>{v.lastStatus}</Td>
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
