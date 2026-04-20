import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
import { db, useDb } from '../../store/useStore'

export function VehiclesPage() {
  const state = useDb()
  const [q, setQ] = useState('')
  const [form, setForm] = useState({ label: '', regNo: '' })

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return state.vehicles
    return state.vehicles.filter(
      (v) => v.label.toLowerCase().includes(s) || v.regNo.toLowerCase().includes(s),
    )
  }, [q, state.vehicles])

  return (
    <div>
      <PageHeader
        title="Masters: Vehicles"
        subtitle="Editable master list for vehicles used in deliveries (demo)."
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Vehicles</CardTitle>
          <div className="w-full sm:w-72">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-10" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
            <Input label="Label" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Van" />
            <Input label="Reg No" value={form.regNo} onChange={(e) => setForm((f) => ({ ...f, regNo: e.target.value }))} placeholder="TN-09-AA-1234" />
            <Button
              onClick={() => {
                db.addVehicle({ label: form.label, regNo: form.regNo })
                setForm({ label: '', regNo: '' })
              }}
            >
              Add
            </Button>
          </div>

          {rows.length === 0 ? (
            <EmptyState title="No vehicles" subtitle="Add your first vehicle above." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Label</Th>
                  <Th>Reg No</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{v.label}</Td>
                    <Td className="font-mono text-xs text-slate-600">{v.regNo}</Td>
                    <Td className="text-right">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm(`Delete vehicle ${v.label}?`)) db.deleteVehicle(v.id)
                        }}
                      >
                        Delete
                      </Button>
                    </Td>
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

