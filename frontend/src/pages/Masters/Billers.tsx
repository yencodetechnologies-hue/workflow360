import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
import { db, useDb } from '../../store/useStore'

export function BillersPage() {
  const state = useDb()
  const [name, setName] = useState('')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return state.billers
    return state.billers.filter((b) => b.name.toLowerCase().includes(s))
  }, [q, state.billers])

  return (
    <div>
      <PageHeader
        title="Masters: Billers"
        subtitle="Editable master list for billers (demo)."
        right={
          <Button variant="secondary" onClick={() => db.reset()}>
            Reset demo data
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Billers</CardTitle>
          <div className="w-full sm:w-72">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search billers…" className="h-10" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input label="Add biller" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Metro Mart" />
            </div>
            <Button
              onClick={() => {
                db.addBiller(name)
                setName('')
              }}
            >
              Add
            </Button>
          </div>

          {rows.length === 0 ? (
            <EmptyState title="No billers" subtitle="Add your first biller above." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{b.name}</Td>
                    <Td className="text-right">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm(`Delete biller ${b.name}?`)) db.deleteBiller(b.id)
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

