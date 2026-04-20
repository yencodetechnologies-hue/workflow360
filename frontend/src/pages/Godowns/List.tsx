import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatNumber } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
import { useDb } from '../../store/useStore'

export function GodownsListPage() {
  const state = useDb()
  const godowns = state.godowns
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return godowns
    return godowns.filter(
      (g) =>
        g.name.toLowerCase().includes(s) ||
        g.city.toLowerCase().includes(s) ||
        g.manager.toLowerCase().includes(s),
    )
  }, [godowns, q])

  return (
    <div>
      <PageHeader
        title="Godowns"
        subtitle="Manage warehouses and view stock distribution."
        right={
          <>
            <Button variant="secondary" onClick={() => alert('Add Godown (template placeholder).')}>
              Add Godown
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between gap-4">
            <CardTitle>Godown list</CardTitle>
            <div className="w-full max-w-xs">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search godown…" className="h-10" />
            </div>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <EmptyState title="No godowns found" subtitle="Try a different search." />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>City</Th>
                    <Th>Manager</Th>
                    <Th className="text-right">Stock</Th>
                    <Th className="text-right">Low SKUs</Th>
                    <Th className="text-right">Open</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50">
                      <Td className="font-semibold text-slate-900">{g.name}</Td>
                      <Td>{g.city}</Td>
                      <Td>{g.manager}</Td>
                    <Td className="text-right font-semibold">
                      {formatNumber(
                        Object.values(state.stockByGodown[g.id] ?? {}).reduce((a, b) => a + b, 0),
                      )}
                    </Td>
                      <Td className="text-right">
                      <Badge variant="slate">—</Badge>
                      </Td>
                      <Td className="text-right">
                        <Link
                          className="text-sm font-semibold text-slate-900 hover:text-slate-700"
                          to={`/godowns/${g.id}`}
                        >
                          View
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="rounded-xl bg-slate-50 p-3">
              Use “Low SKUs” to identify warehouses needing replenishment.
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              Open a godown to see stock view and transfer timeline.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

