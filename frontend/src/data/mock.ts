export type DeliveryStatus = 'Upcoming' | 'Running' | 'PendingReturn' | 'Completed'

export type Godown = {
  id: string
  name: string
  city: string
  manager: string
  stockUnits: number
  lowStockSkus: number
}

export type Product = {
  id: string
  name: string
  sku: string
  category: string
  unit: string
  totalStock: number
  damaged: number
  lost: number
  reorderLevel: number
}

export type Delivery = {
  id: string
  biller: string
  godownId: string
  productSummary: string
  status: DeliveryStatus
  assignedTo?: string
  createdAt: string
  eta: string
}

export type Activity = {
  id: string
  type: 'delivery' | 'return' | 'stock_transfer' | 'damage'
  message: string
  at: string
}

export const godowns: Godown[] = [
  {
    id: 'gd-a',
    name: 'Godown A',
    city: 'Chennai',
    manager: 'Arun',
    stockUnits: 1200,
    lowStockSkus: 4,
  },
  {
    id: 'gd-b',
    name: 'Godown B',
    city: 'Bengaluru',
    manager: 'Meena',
    stockUnits: 800,
    lowStockSkus: 2,
  },
  {
    id: 'gd-c',
    name: 'Godown C',
    city: 'Coimbatore',
    manager: 'Ravi',
    stockUnits: 540,
    lowStockSkus: 6,
  },
]

export const products: Product[] = [
  {
    id: 'p-1001',
    name: 'Plastic Chair',
    sku: 'CHR-PL-001',
    category: 'Furniture',
    unit: 'pcs',
    totalStock: 860,
    damaged: 12,
    lost: 3,
    reorderLevel: 120,
  },
  {
    id: 'p-1002',
    name: 'Steel Rack',
    sku: 'RCK-ST-009',
    category: 'Storage',
    unit: 'pcs',
    totalStock: 210,
    damaged: 4,
    lost: 1,
    reorderLevel: 60,
  },
  {
    id: 'p-1003',
    name: 'Packing Tape',
    sku: 'PKG-TP-120',
    category: 'Packaging',
    unit: 'roll',
    totalStock: 95,
    damaged: 1,
    lost: 0,
    reorderLevel: 100,
  },
]

export const deliveries: Delivery[] = [
  {
    id: 'DLV-24031',
    biller: 'Sri Traders',
    godownId: 'gd-a',
    productSummary: 'Plastic Chair × 50, Tape × 20',
    status: 'Running',
    assignedTo: 'Karthik (DP-12)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    eta: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'DLV-24032',
    biller: 'Metro Mart',
    godownId: 'gd-b',
    productSummary: 'Steel Rack × 10',
    status: 'Upcoming',
    assignedTo: 'Priya (DP-07)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    eta: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'DLV-24033',
    biller: 'JK Supplies',
    godownId: 'gd-a',
    productSummary: 'Plastic Chair × 20',
    status: 'PendingReturn',
    assignedTo: 'Karthik (DP-12)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    eta: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'DLV-24027',
    biller: 'Sunrise Stores',
    godownId: 'gd-c',
    productSummary: 'Tape × 60',
    status: 'Completed',
    assignedTo: 'Vijay (DP-03)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 44).toISOString(),
    eta: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
  },
]

export const activities: Activity[] = [
  {
    id: 'a1',
    type: 'delivery',
    message: 'Delivery DLV-24033 marked as Pending Return.',
    at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'a2',
    type: 'stock_transfer',
    message: 'Stock transfer initiated: Godown A → Godown C.',
    at: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
  },
  {
    id: 'a3',
    type: 'damage',
    message: 'Damage reported: Plastic Chair (12 pcs).',
    at: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
  },
]

export function getGodownById(id: string) {
  return godowns.find((g) => g.id === id)
}

