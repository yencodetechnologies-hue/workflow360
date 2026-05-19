import { API_BASE } from '../lib/api'

const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

export type Product = {
  id: string
  name: string
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

export function mapApiProduct(p: Record<string, unknown>): Product {
  const id = String(p._id ?? p.id ?? '')
  const imagePath = p.image_url
    ? String(p.image_url)
    : p.image_path
      ? `${API_ORIGIN}/${String(p.image_path).replace(/^\//, '')}`
      : undefined
  return {
    id,
    name: String(p.particulars ?? p.name ?? ''),
    sku: String(p.sku ?? `SKU-${p.s_no ?? id}`),
    category: String(p.category ?? 'General'),
    unit: String(p.unit ?? 'pcs'),
    reorderLevel: Number(p.reorderLevel ?? 0),
    imagePath,
    sNo: String(p.s_no ?? ''),
    particulars: String(p.particulars ?? p.name ?? ''),
    specification: String(p.specification ?? '—'),
    rate: String(p.rate ?? '—'),
  }
}
