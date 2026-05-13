import { createSeedDb, type Db, type Id, type Product } from './seed'
import { getToken } from '../auth/store'

const API_URL = 'http://127.0.0.1:5001/workflow360/api/products'

const STORAGE_KEY = 'godown_manager_demo_db_v1'

type Listener = () => void

let listeners: Listener[] = []
let cached: Db | null = null
let isFetchingProducts = false

function notify() {
  for (const l of listeners) l()
}

export function subscribe(listener: Listener) {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

export function loadDb(): Db {
  if (cached) return cached
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    cached = createSeedDb()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))
  } else {
    try {
      cached = JSON.parse(raw) as Db
    } catch {
      cached = createSeedDb()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))
    }
  }

  // Trigger background fetch for products
  if (!isFetchingProducts) {
    isFetchingProducts = true
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (cached && Array.isArray(data)) {
          const products: Product[] = data.map((p: any) => ({
            id: p._id,
            name: p.particulars || p.name,
            sku: p.sku || `SKU-${p.s_no}`,
            category: p.category,
            unit: p.unit || 'pcs',
            reorderLevel: p.reorderLevel || 0,
            imagePath: p.image_url || (p.image_path ? `http://127.0.0.1:5001/${p.image_path}` : undefined),
            sNo: p.s_no,
            particulars: p.particulars || p.name,
            specification: p.specification || '—',
            rate: p.rate || '—',
          }))
          saveDb({ ...cached, products })
        }
      })
      .catch((err) => console.error('Failed to fetch products:', err))
      .finally(() => {
        isFetchingProducts = false
      })
  }

  return cached
}

function saveDb(next: Db) {
  cached = next
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  notify()
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}-${Date.now().toString(16)}`
}

export const db = {
  get(): Db {
    return loadDb()
  },

  reset() {
    const next = createSeedDb()
    saveDb(next)
  },

  // ===== Masters =====
  addBiller(name: string) {
    const s = name.trim()
    if (!s) return
    const next = this.get()
    const id = `biller-${s.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    if (next.billers.some((b) => b.id === id)) return
    saveDb({ ...next, billers: [...next.billers, { id, name: s }] })
  },
  deleteBiller(id: Id) {
    const next = this.get()
    saveDb({ ...next, billers: next.billers.filter((b) => b.id !== id) })
  },

  addDeliveryPerson(input: { name: string; code: string; phone?: string }) {
    const name = input.name.trim()
    const code = input.code.trim()
    if (!name || !code) return
    const next = this.get()
    saveDb({
      ...next,
      deliveryPersons: [
        ...next.deliveryPersons,
        { id: makeId('dp'), name, code, phone: input.phone?.trim() || undefined },
      ],
    })
  },
  deleteDeliveryPerson(id: Id) {
    const next = this.get()
    saveDb({
      ...next,
      deliveryPersons: next.deliveryPersons.filter((d) => d.id !== id),
    })
  },

  addVehicle(input: { label: string; regNo: string }) {
    const label = input.label.trim()
    const regNo = input.regNo.trim()
    if (!label || !regNo) return
    const next = this.get()
    saveDb({
      ...next,
      vehicles: [...next.vehicles, { id: makeId('vh'), label, regNo }],
    })
  },
  deleteVehicle(id: Id) {
    const next = this.get()
    saveDb({ ...next, vehicles: next.vehicles.filter((v) => v.id !== id) })
  },

  // ===== Products =====
  addProduct(input: {
    name: string
    sku: string
    category: string
    unit: string
    reorderLevel: number
    specification?: string
    rate?: string
    sNo?: string
    imagePath?: string
    initialStockByGodown?: Record<Id, number>
  }) {
    const next = this.get()
    const tempId = makeId('p_temp')
    const p: Product = {
      id: tempId,
      name: input.name.trim(),
      sku: input.sku.trim(),
      category: input.category.trim(),
      unit: input.unit.trim(),
      reorderLevel: Number(input.reorderLevel) || 0,
      specification: input.specification || '—',
      rate: input.rate || '—',
      sNo: input.sNo?.trim() || Date.now().toString(),
      particulars: input.name.trim(),
      imagePath: input.imagePath?.trim(),
    }
    if (!p.name || !p.sku) return

    const stockByGodown = { ...next.stockByGodown }
    for (const g of next.godowns) {
      const existing = stockByGodown[g.id] ?? {}
      const qty = input.initialStockByGodown?.[g.id] ?? 0
      stockByGodown[g.id] = { ...existing, [tempId]: Math.max(0, Math.floor(qty)) }
    }

    // Update local UI immediately
    saveDb({ ...next, products: [...next.products, p], stockByGodown })

    // Sync with backend
    fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        s_no: p.sNo,
        particulars: p.name,
        category: p.category,
        sku: p.sku,
        unit: p.unit,
        reorderLevel: p.reorderLevel,
        specification: p.specification,
        rate: p.rate,
        image_path: p.imagePath,
      })
    })
    .then(res => res.json())
    .then(saved => {
      // Replace tempId with real _id from MongoDB
      const current = this.get()
      const products = current.products.map(item => 
        item.id === tempId ? { ...item, id: saved._id } : item
      )
      const newStockByGodown = { ...current.stockByGodown }
      for (const gid in newStockByGodown) {
          const map = { ...newStockByGodown[gid] }
          map[saved._id] = map[tempId]
          delete map[tempId]
          newStockByGodown[gid] = map
      }
      saveDb({ ...current, products, stockByGodown: newStockByGodown })
    })
    .catch(err => console.error('Add product failed:', err))
  },

  updateProduct(id: Id, patch: Partial<Omit<Db['products'][number], 'id'>>) {
    const next = this.get()
    // Update local UI
    saveDb({
      ...next,
      products: next.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })

    // Sync with backend if it's a real MongoDB ID (24 chars hex usually)
    if (id.length >= 24) {
      fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          particulars: patch.name,
          category: patch.category,
          sku: patch.sku,
          unit: patch.unit,
          reorderLevel: patch.reorderLevel,
          specification: patch.specification,
          rate: patch.rate,
          s_no: patch.sNo,
          image_path: patch.imagePath,
        })
      })
      .catch(err => console.error('Update product failed:', err))
    }
  },

  deleteProduct(id: Id) {
    const next = this.get()
    const stockByGodown: Db['stockByGodown'] = {}
    for (const g of next.godowns) {
      const map = { ...(next.stockByGodown[g.id] ?? {}) }
      delete map[id]
      stockByGodown[g.id] = map
    }
    // Update local UI
    saveDb({
      ...next,
      products: next.products.filter((p) => p.id !== id),
      stockByGodown,
    })

    // Sync with backend
    if (id.length >= 24) {
      fetch(`${API_URL}/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      .catch(err => console.error('Delete product failed:', err))
    }
  },

  // ===== Deliveries =====
  addDelivery(input: {
    billerId: Id
    godownId: Id
    lines: Array<{ productId: Id; qty: number }>
    eta: string
    assignedDeliveryPersonId?: Id
    vehicleId?: Id
  }) {
    const next = this.get()
    const id = `DLV-${Math.floor(10000 + Math.random() * 89999)}`
    const createdAt = new Date().toISOString()
    const lines = input.lines
      .map((l) => ({ productId: l.productId, qty: Math.max(1, Math.floor(l.qty)) }))
      .filter((l) => Boolean(l.productId))
    if (!input.billerId || !input.godownId || lines.length === 0) return

    // reduce stock in godown
    const stockByGodown = { ...next.stockByGodown }
    const src = { ...(stockByGodown[input.godownId] ?? {}) }
    for (const l of lines) {
      src[l.productId] = Math.max(0, (src[l.productId] ?? 0) - l.qty)
    }
    stockByGodown[input.godownId] = src

    const delivery = {
      id,
      billerId: input.billerId,
      godownId: input.godownId,
      lines,
      status: 'Upcoming' as const,
      assignedDeliveryPersonId: input.assignedDeliveryPersonId,
      vehicleId: input.vehicleId,
      createdAt,
      eta: input.eta,
      pendingReturn: false,
    }

    saveDb({
      ...next,
      deliveries: [delivery, ...next.deliveries],
      activities: [
        { id: makeId('act'), type: 'delivery', message: `Delivery ${id} created.`, at: createdAt },
        ...next.activities,
      ],
      stockByGodown,
    })
  },

  updateDelivery(id: Id, patch: Partial<Db['deliveries'][number]>) {
    const next = this.get()
    saveDb({
      ...next,
      deliveries: next.deliveries.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    })
  },

  // ===== Returns / damage / loss =====
  markReturned(id: Id) {
    const next = this.get()
    const now = new Date().toISOString()
    saveDb({
      ...next,
      deliveries: next.deliveries.map((d) =>
        d.id === id ? { ...d, pendingReturn: false, status: 'Completed', returnedAt: now } : d,
      ),
      activities: [
        { id: makeId('act'), type: 'return', message: `Return received for ${id}.`, at: now },
        ...next.activities,
      ],
    })
  },

  recordDamageLoss(id: Id, damage: Record<Id, number>, loss: Record<Id, number>) {
    const next = this.get()
    const now = new Date().toISOString()
    saveDb({
      ...next,
      deliveries: next.deliveries.map((d) =>
        d.id === id
          ? {
              ...d,
              damagedByProductId: damage,
              lostByProductId: loss,
            }
          : d,
      ),
      activities: [
        {
          id: makeId('act'),
          type: 'damage',
          message: `Damage/Loss updated for ${id}.`,
          at: now,
        },
        ...next.activities,
      ],
    })
  },

  // ===== Transfers =====
  transferStock(input: { fromGodownId: Id; toGodownId: Id; productId: Id; qty: number }) {
    const next = this.get()
    const qty = Math.max(1, Math.floor(input.qty))
    if (!input.fromGodownId || !input.toGodownId || !input.productId) return
    if (input.fromGodownId === input.toGodownId) return

    const stockByGodown = { ...next.stockByGodown }
    const from = { ...(stockByGodown[input.fromGodownId] ?? {}) }
    const to = { ...(stockByGodown[input.toGodownId] ?? {}) }
    const available = from[input.productId] ?? 0
    const moved = Math.min(available, qty)
    from[input.productId] = Math.max(0, available - moved)
    to[input.productId] = (to[input.productId] ?? 0) + moved
    stockByGodown[input.fromGodownId] = from
    stockByGodown[input.toGodownId] = to

    const at = new Date().toISOString()
    const transfer = {
      id: makeId('tr'),
      fromGodownId: input.fromGodownId,
      toGodownId: input.toGodownId,
      productId: input.productId,
      qty: moved,
      at,
    }

    saveDb({
      ...next,
      transfers: [transfer, ...next.transfers],
      activities: [
        {
          id: makeId('act'),
          type: 'stock_transfer',
          message: `Stock transferred (${moved}) from ${input.fromGodownId} → ${input.toGodownId}.`,
          at,
        },
        ...next.activities,
      ],
      stockByGodown,
    })
  },
}

