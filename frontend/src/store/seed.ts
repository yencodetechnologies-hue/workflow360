import {
  activities as seedActivities,
  deliveries as seedDeliveries,
  godowns as seedGodowns,
  products as seedProducts,
} from '../data/mock'

export type Id = string

export type Biller = { id: Id; name: string }
export type DeliveryPerson = { id: Id; name: string; code: string; phone?: string }
export type Vehicle = { id: Id; label: string; regNo: string }

export type Godown = {
  id: Id
  name: string
  city: string
  manager: string
}

export type Product = {
  id: Id
  name: string // This maps to particulars
  sku: string
  category: string
  unit: string
  reorderLevel: number
  imagePath?: string
  sNo: string
  particulars: string
  specification: string
  rate: string
}

export type DeliveryStatus = 'Upcoming' | 'Running' | 'PendingReturn' | 'Completed'

export type DeliveryLine = {
  productId: Id
  qty: number
}

export type Delivery = {
  id: Id
  billerId: Id
  godownId: Id
  lines: DeliveryLine[]
  status: DeliveryStatus
  assignedDeliveryPersonId?: Id
  vehicleId?: Id
  createdAt: string
  eta: string
  pendingReturn: boolean
  returnedAt?: string
  damagedByProductId?: Record<Id, number>
  lostByProductId?: Record<Id, number>
}

export type Transfer = {
  id: Id
  fromGodownId: Id
  toGodownId: Id
  productId: Id
  qty: number
  at: string
}

export type Activity = {
  id: Id
  message: string
  at: string
  type: 'delivery' | 'return' | 'stock_transfer' | 'damage'
}

export type Db = {
  version: 1
  godowns: Godown[]
  products: Product[]
  billers: Biller[]
  deliveryPersons: DeliveryPerson[]
  vehicles: Vehicle[]
  deliveries: Delivery[]
  transfers: Transfer[]
  activities: Activity[]
  stockByGodown: Record<Id, Record<Id, number>>
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}-${Date.now().toString(16)}`
}

export function createSeedDb(): Db {
  const billers: Biller[] = Array.from(
    new Set(seedDeliveries.map((d) => d.biller)),
  ).map((name) => ({
    id: `biller-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name,
  }))

  const deliveryPersons: DeliveryPerson[] = [
    { id: 'dp-12', name: 'Karthik', code: 'DP-12', phone: '90000 00012' },
    { id: 'dp-07', name: 'Priya', code: 'DP-07', phone: '90000 00007' },
    { id: 'dp-03', name: 'Vijay', code: 'DP-03', phone: '90000 00003' },
  ]

  const vehicles: Vehicle[] = [
    { id: 'vh-01', label: 'Mini Truck', regNo: 'TN-09-AA-1234' },
    { id: 'vh-02', label: 'Van', regNo: 'KA-05-BB-9911' },
  ]

  const godowns: Godown[] = seedGodowns.map((g) => ({
    id: g.id,
    name: g.name,
    city: g.city,
    manager: g.manager,
  }))

  const products: Product[] = seedProducts.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    unit: p.unit,
    reorderLevel: p.reorderLevel,
  }))

  const productByName = new Map(products.map((p) => [p.name.toLowerCase(), p]))
  const billerByName = new Map(billers.map((b) => [b.name.toLowerCase(), b]))
  const dpByName = new Map(deliveryPersons.map((dp) => [dp.name.toLowerCase(), dp]))

  // stockByGodown seeded by distributing original totalStock across godowns
  const stockByGodown: Record<Id, Record<Id, number>> = {}
  for (const g of godowns) stockByGodown[g.id] = {}
  for (const p of seedProducts) {
    const factors =
      godowns.length === 3
        ? { 'gd-a': 0.52, 'gd-b': 0.31, 'gd-c': 0.17 }
        : Object.fromEntries(godowns.map((g) => [g.id, 1 / godowns.length]))
    for (const g of godowns) {
      const f = (factors as Record<string, number>)[g.id] ?? 0
      stockByGodown[g.id][p.id] = Math.max(0, Math.round(p.totalStock * f))
    }
  }

  const deliveries: Delivery[] = seedDeliveries.map((d) => {
    const biller = billerByName.get(d.biller.toLowerCase())!
    const assignedName = d.assignedTo?.split('(')[0]?.trim().toLowerCase()
    const dp = assignedName ? dpByName.get(assignedName) : undefined

    // very simple parsing from productSummary
    const lines: DeliveryLine[] = d.productSummary.split(',').map((part) => {
      const [nameRaw, qtyRaw] = part.split('×').map((s) => s.trim())
      const p = productByName.get(nameRaw.toLowerCase())
      return { productId: p?.id ?? products[0].id, qty: Number(qtyRaw ?? 1) || 1 }
    })

    return {
      id: d.id,
      billerId: biller.id,
      godownId: d.godownId,
      lines,
      status: d.status,
      assignedDeliveryPersonId: dp?.id,
      vehicleId: vehicles[0]?.id,
      createdAt: d.createdAt,
      eta: d.eta,
      pendingReturn: d.status === 'PendingReturn',
    }
  })

  const activities: Activity[] = seedActivities.map((a) => ({
    id: a.id,
    message: a.message,
    at: a.at,
    type: a.type,
  }))

  return {
    version: 1,
    godowns,
    products,
    billers,
    deliveryPersons,
    vehicles,
    deliveries,
    transfers: [
      {
        id: makeId('tr'),
        fromGodownId: 'gd-a',
        toGodownId: 'gd-c',
        productId: products[0]?.id ?? seedProducts[0].id,
        qty: 10,
        at: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
      },
    ],
    activities,
    stockByGodown,
  }
}

