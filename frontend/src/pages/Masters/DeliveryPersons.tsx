import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
import { db, useDb } from '../../store/useStore'

export function DeliveryPersonsPage() {
  const state = useDb()
  const [q, setQ] = useState('')
  const [form, setForm] = useState({ name: '', code: '', phone: '' })

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return state.deliveryPersons
    return state.deliveryPersons.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.code.toLowerCase().includes(s) ||
        (p.phone?.toLowerCase().includes(s) ?? false),
    )
  }, [q, state.deliveryPersons])

  return (
    <div>
      <PageHeader
        title="Masters: Delivery Persons"
        subtitle="Editable master list for delivery staff (demo)."
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Delivery persons</CardTitle>
          <div className="w-full sm:w-72">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-10" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
            <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input label="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="DP-01" />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="90000 00000" />
            <Button
              onClick={() => {
                db.addDeliveryPerson({ name: form.name, code: form.code, phone: form.phone || undefined })
                setForm({ name: '', code: '', phone: '' })
              }}
            >
              Add
            </Button>
          </div>

          {rows.length === 0 ? (
            <EmptyState title="No delivery persons" subtitle="Add your first delivery person above." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Code</Th>
                  <Th>Phone</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{p.name}</Td>
                    <Td className="font-mono text-xs text-slate-600">{p.code}</Td>
                    <Td>{p.phone ?? '—'}</Td>
                    <Td className="text-right">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm(`Delete ${p.name}?`)) db.deleteDeliveryPerson(p.id)
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

