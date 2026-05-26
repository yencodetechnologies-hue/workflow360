// import { useEffect, useMemo, useState } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import { formatDateTime } from '../../lib/format'
// import { Badge } from '../../components/ui/Badge'
// import { Button } from '../../components/ui/Button'
// import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// import { Input } from '../../components/ui/Input'
// import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
// import { apiFetch } from '../../lib/api'
// import { getToken, useAuth } from '../../auth/store'
// import { CreateDeliveryModal } from './CreateDeliveryModal'

// type Tab = 'all' | 'UPCOMING' | 'DISPATCHED' | 'DELIVERED' | 'PENDING_RETURN' | 'COMPLETED'

// function badgeVariant(status: string) {
//   if (status === 'DISPATCHED') return 'green'
//   if (status === 'UPCOMING') return 'blue'
//   if (status === 'PENDING_RETURN') return 'amber'
//   if (status === 'DELIVERED') return 'amber'
//   return 'slate'
// }

// type DeliveryRow = {
//   id: string
//   deliveryNo: string
//   customerName: string
//   siteName?: string
//   siteAddress?: string
//   status: string
//   deliveryAt: string
//   fromGodownId?: string
// }

// export function DeliveriesListPage() {
//   const auth = useAuth()
//   const nav = useNavigate()
//   const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
//   const [error, setError] = useState<string | null>(null)
//   const [tab, setTab] = useState<Tab>('all')
//   const [q, setQ] = useState('')
//   const [createOpen, setCreateOpen] = useState(false)

//   const canCreate = auth.status === 'authenticated' && (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')

//   const loadDeliveries = () => {
//     const token = getToken()
//     if (!token) return
//     setError(null)
//     apiFetch<DeliveryRow[]>('/deliveries?limit=200', { token })
//       .then(setDeliveries)
//       .catch((e: unknown) => {
//         const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load deliveries'
//         setError(msg)
//       })
//   }

//   useEffect(() => {
//     loadDeliveries()
//   }, [])

//   const rows = useMemo(() => {
//     const s = q.trim().toLowerCase()
//     return deliveries.filter((d) => {
//       if (tab !== 'all' && d.status !== tab) return false
//       if (!s) return true
//       return (
//         d.deliveryNo.toLowerCase().includes(s) ||
//         d.customerName.toLowerCase().includes(s) ||
//         (d.siteName?.toLowerCase().includes(s) ?? false) ||
//         (d.siteAddress?.toLowerCase().includes(s) ?? false)
//       )
//     })
//   }, [deliveries, q, tab])

//   const tabs: Array<{ id: Tab; label: string }> = [
//     { id: 'all', label: 'All' },
//     { id: 'UPCOMING', label: 'Upcoming' },
//     { id: 'DISPATCHED', label: 'Dispatched' },
//     { id: 'DELIVERED', label: 'Delivered' },
//     { id: 'PENDING_RETURN', label: 'Pending returns' },
//     { id: 'COMPLETED', label: 'Completed' },
//   ]

//   return (
//     <div>
//       {canCreate ? (
//         <div className="mb-6 flex justify-end">
//           <Button onClick={() => setCreateOpen(true)} className="gap-2 shadow-lg shadow-violet-200/50">
//             <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
//               <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
//             </svg>
//             Create delivery
//           </Button>
//         </div>
//       ) : null}

//       <Card>
//         <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//           <CardTitle>Delivery list</CardTitle>
//           <div className="w-full sm:w-72">
//             <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search deliveries…" className="h-10" />
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="mb-4 flex flex-wrap gap-2">
//             {tabs.map((t) => {
//               const active = tab === t.id
//               return (
//                 <button
//                   key={t.id}
//                   onClick={() => setTab(t.id)}
//                   className={
//                     active
//                       ? 'rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm'
//                       : 'rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200'
//                   }
//                 >
//                   {t.label}
//                 </button>
//               )
//             })}
//           </div>

//           {error ? (
//             <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
//           ) : rows.length === 0 ? (
//             <EmptyState title="No deliveries found" subtitle="Try a different tab or search." />
//           ) : (
//             <Table>
//               <thead>
//                 <tr>
//                   <Th>Delivery</Th>
//                   <Th>Customer</Th>
//                   <Th>Location</Th>
//                   <Th>Status</Th>
//                   <Th className="text-right">Scheduled</Th>
//                   <Th className="text-right">Actions</Th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {rows.map((d) => {
//                   return (
//                     <tr key={d.id} className="hover:bg-slate-50">
//                       <Td className="font-semibold text-slate-900">{d.deliveryNo}</Td>
//                       <Td>{d.customerName}</Td>
//                       <Td className="max-w-[22rem] truncate">{d.siteName || d.siteAddress || '—'}</Td>
//                       <Td>
//                         <Badge variant={badgeVariant(d.status)}>{d.status}</Badge>
//                       </Td>
//                       <Td className="text-right text-xs text-slate-500">{formatDateTime(d.deliveryAt)}</Td>
//                       <Td className="text-right space-x-2">
//                         <Link
//                           to={`/deliveries/${d.id}`}
//                           className="mr-2 inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-sm font-medium text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
//                         >
//                           Details
//                         </Link>
//                         <Button
//                           size="sm"
//                           variant="secondary"
//                           onClick={() => {
//                             if (auth.status !== 'authenticated') return
//                             if (auth.user.role === 'DELIVERY') {
//                               if (d.status === 'DISPATCHED') nav(`/scan/pickup/${d.id}`)
//                               else nav(`/scan/deliver/${d.id}`)
//                             } else if (auth.user.role === 'GODOWN') nav(`/scan/dispatch/${d.id}`)
//                             else nav(`/scan/dispatch/${d.id}`)
//                           }}
//                         >
//                           Scan
//                         </Button>
//                       </Td>
//                     </tr>
//                   )
//                 })}
//               </tbody>
//             </Table>
//           )}
//         </CardContent>
//       </Card>

//       <CreateDeliveryModal
//         open={createOpen}
//         onClose={() => setCreateOpen(false)}
//         onCreated={loadDeliveries}
//       />
//     </div>
//   )
// }

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { formatDateTime } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'
import { scanPathForDelivery } from '../../lib/scanMode'
import { CreateDeliveryModal } from './CreateDeliveryModal'

type Tab =
  | 'all'
  | 'UPCOMING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'PENDING_RETURN'
  | 'COMPLETED'

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

export function DeliveriesListPage() {
  const auth = useAuth()
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const statusFromUrl = searchParams.get('status') as Tab | null

  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>(
    statusFromUrl &&
      ['all', 'UPCOMING', 'DISPATCHED', 'DELIVERED', 'PENDING_RETURN', 'COMPLETED'].includes(statusFromUrl)
      ? statusFromUrl
      : 'all',
  )
  const [q, setQ] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const canCreate =
    auth.status === 'authenticated' &&
    (auth.user.role === 'ADMIN' || auth.user.role === 'BILLER')

  const loadDeliveries = () => {
    const token = getToken()
    if (!token) return

    setLoading(true)
    setError(null)

    apiFetch<DeliveryRow[]>('/deliveries?limit=200', { token })
      .then(setDeliveries)
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
    { id: 'PENDING_RETURN', label: 'Pending Returns' },
    { id: 'COMPLETED', label: 'Completed' },
  ]

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Deliveries
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage customer deliveries, schedules and dispatch workflow.
          </p>
        </div>

        {/* {canCreate ? (
          <Button
            onClick={() => setCreateOpen(true)}
            className="
              inline-flex h-12 items-center justify-center gap-2
              rounded-2xl border-0
              bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600
              px-5 text-sm font-semibold text-white
              shadow-lg shadow-violet-500/20
              transition-all duration-200
              hover:scale-[1.02]
              hover:shadow-xl hover:shadow-violet-500/30
              active:scale-[0.99]
            "
          >
            <svg
              className="h-5 w-5 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>

            <span className="leading-none">Create Delivery</span>
          </Button>
        ) : null} */}

        {canCreate ? (
  <Button
    onClick={() => setCreateOpen(true)}
    className="
      group flex h-12 items-center
      rounded-1xl border-0
      bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600
      px-5
      text-white
      shadow-lg shadow-violet-500/25
      transition-all duration-200
      hover:scale-[1.02]
      hover:shadow-xl hover:shadow-violet-500/30
      active:scale-[0.99]
    "
  >
    {/* INNER WRAPPER */}
    <div className="flex items-center gap-3">
      {/* ICON BOX */}
      <div
        className="
          flex h-8 w-10 items-center justify-center
          rounded-xl
          bg-white/10
          ring-1 ring-white/20
        "
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M12 5V19"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M5 12H19"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* TEXT */}
      <div className="flex items-center">
        <span className="text-base font-semibold leading-none">
          Create Delivery
        </span>
      </div>
    </div>
  </Button>
) : null}
      </div>

      {/* MAIN CARD */}
      <Card className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)]">
        {/* TOP BAR */}
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                Delivery List
              </CardTitle>

              <p className="mt-1 text-sm text-slate-500">
                {rows.length} deliveries available
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
              {/* SEARCH */}
              <div className="relative w-full xl:w-80">
                <svg
                  className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M21 21l-4.35-4.35"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="11"
                    cy="11"
                    r="6"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>

                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search deliveries..."
                  className="
                    h-12 rounded-2xl border-slate-200
                    bg-white pl-11 text-sm
                    shadow-sm transition-all
                    focus:border-violet-400 focus:ring-4 focus:ring-violet-100
                  "
                />
              </div>

              {/* REFRESH */}
              <Button
                variant="secondary"
                onClick={loadDeliveries}
                className="
                  h-12 rounded-2xl border border-slate-200
                  bg-white px-5 font-semibold text-slate-700
                  shadow-sm transition-all
                  hover:border-slate-300 hover:bg-slate-50
                "
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* STATUS TABS */}
          <div className="mb-6 flex flex-wrap gap-3">
            {tabs.map((t) => {
              const active = tab === t.id

              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`
                    rounded-2xl px-5 py-2.5 text-sm font-semibold
                    transition-all duration-200
                    ${
                      active
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }
                  `}
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* ERROR */}
          {error ? (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          {/* EMPTY */}
          {!loading && rows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16">
              <EmptyState
                title="No deliveries found"
                subtitle="Try changing search or delivery status."
              />
            </div>
          ) : null}

          {/* LOADING */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
            </div>
          ) : null}

          {/* TABLE */}
          {!loading && rows.length > 0 ? (
            <div className="overflow-hidden rounded-3xl border border-slate-100">
              <div className="overflow-x-auto">
                <Table className="min-w-[950px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <Th className="py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Delivery
                      </Th>

                      <Th className="py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Customer
                      </Th>

                      <Th className="py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Location
                      </Th>

                      <Th className="py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </Th>

                      <Th className="py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Scheduled
                      </Th>

                      <Th className="py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Actions
                      </Th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((d, index) => {
                      return (
                        <tr
                          key={d.id}
                          className={`
                            border-b border-slate-100
                            transition-all duration-150
                            hover:bg-violet-50/40
                            ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}
                          `}
                        >
                          {/* DELIVERY */}
                          <Td className="py-5">
                            <div>
                              <div className="font-bold tracking-wide text-slate-900">
                                {d.deliveryNo}
                              </div>

                              <div className="mt-1 text-xs text-slate-400">
                                ID: {d.id.slice(0, 8)}
                              </div>
                            </div>
                          </Td>

                          {/* CUSTOMER */}
                          <Td className="py-5">
                            <div className="font-semibold text-slate-800">
                              {d.customerName}
                            </div>
                          </Td>

                          {/* LOCATION */}
                          <Td className="max-w-[280px] py-5">
                            <div className="truncate text-sm text-slate-600">
                              {d.siteName || d.siteAddress || '—'}
                            </div>
                          </Td>

                          {/* STATUS */}
                          <Td className="py-5">
                            <Badge variant={badgeVariant(d.status)}>
                              {d.status.replace('_', ' ')}
                            </Badge>
                          </Td>

                          {/* DATE */}
                          <Td className="py-5 text-right">
                            <div className="text-sm font-medium text-slate-700">
                              {formatDateTime(d.deliveryAt)}
                            </div>
                          </Td>

                          {/* ACTIONS */}
                          <Td className="py-5 text-right">
                            <div className="flex justify-end gap-2">
                              <Link
                                to={`/deliveries/${d.id}`}
                                className="
                                  inline-flex h-10 items-center justify-center
                                  rounded-xl border border-slate-200
                                  bg-white px-4 text-sm font-semibold text-slate-700
                                  transition-all
                                  hover:border-slate-300 hover:bg-slate-50
                                "
                              >
                                Details
                              </Link>

                              <Button
                                size="sm"
                                variant="secondary"
                                className="
                                  h-10 rounded-xl border border-violet-200
                                  bg-violet-50 px-4 font-semibold text-violet-700
                                  hover:bg-violet-100
                                "
                                onClick={() => {
                                  if (auth.status !== 'authenticated') return

                                  nav(
                                    scanPathForDelivery(
                                      auth.user.role,
                                      d.status,
                                      d.id,
                                    ),
                                  )
                                }}
                              >
                                Scan
                              </Button>
                            </div>
                          </Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* CREATE MODAL */}
      <CreateDeliveryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={loadDeliveries}
      />
    </div>
  )
}