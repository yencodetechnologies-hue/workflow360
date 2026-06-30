// import { useCallback, useEffect, useState } from 'react'
// import { getToken } from '../auth/store'
// import { apiFetch, API_BASE } from '../lib/api'
// import { mapApiProduct, type Product } from '../types/catalog'

// function compareSNo(a: string, b: string): number {
//   return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
// }

// export function useProducts() {
//   const [products, setProducts] = useState<Product[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   const load = useCallback(async () => {
//     const token = getToken()
//     setError(null)
//     setLoading(true)
//     try {
//       const data = await apiFetch<Record<string, unknown>[]>('/products', { token: token ?? undefined })
//       const mapped = Array.isArray(data) ? data.map(mapApiProduct) : []
//       mapped.sort((a, b) => compareSNo(a.sNo, b.sNo))
//       setProducts(mapped)
//     } catch (e: unknown) {
//       const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load products'
//       setError(msg)
//       setProducts([])
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => {
//     load()
//   }, [load])

//   const createProduct = async (body: Record<string, unknown>) => {
//     const token = getToken()
//     if (!token) throw new Error('Not authenticated')
//     await apiFetch('/products', { token, method: 'POST', body: JSON.stringify(body) })
//     await load()
//   }

//   const updateProduct = async (id: string, body: Record<string, unknown>) => {
//     const token = getToken()
//     if (!token) throw new Error('Not authenticated')
//     await apiFetch(`/products/${id}`, { token, method: 'PUT', body: JSON.stringify(body) })
//     await load()
//   }

//   const deleteProduct = async (id: string) => {
//     const token = getToken()
//     if (!token) throw new Error('Not authenticated')
//     await apiFetch(`/products/${id}`, { token, method: 'DELETE' })
//     await load()
//   }

//   const uploadImage = async (file: File): Promise<string> => {
//     const token = getToken()
//     const formData = new FormData()
//     formData.append('image', file)
//     const res = await fetch(`${API_BASE}/products/upload`, {
//       method: 'POST',
//       headers: token ? { Authorization: `Bearer ${token}` } : {},
//       body: formData,
//     })
//     const data = await res.json()
//     if (!res.ok) throw new Error(data?.message || 'Upload failed')
//     return data.filePath as string
//   }

//   return { products, loading, error, reload: load, createProduct, updateProduct, deleteProduct, uploadImage }
// }

import { useCallback, useEffect, useState } from 'react'
import { getToken } from '../auth/store'
import { apiFetch, API_BASE } from '../lib/api'
import { mapApiProduct, type Product } from '../types/catalog'

function compareSNo(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const token = getToken()
    setError(null)
    setLoading(true)
    try {
      const data = await apiFetch<Record<string, unknown>[]>('/products', { token: token ?? undefined })
      const mapped = Array.isArray(data) ? data.map(mapApiProduct) : []
      mapped.sort((a, b) => compareSNo(a.sNo, b.sNo))
      setProducts(mapped)
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load products'
      setError(msg)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const onStockChanged = () => { void load() }
    window.addEventListener('godown-stock-changed', onStockChanged)
    return () => window.removeEventListener('godown-stock-changed', onStockChanged)
  }, [load])

  const createProduct = async (body: Record<string, unknown>) => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')
    await apiFetch('/products', { token, method: 'POST', body: JSON.stringify(body) })
    await load()
  }

  const updateProduct = async (id: string, body: Record<string, unknown>) => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')
    await apiFetch(`/products/${id}`, { token, method: 'PUT', body: JSON.stringify(body) })
    await load()
  }

  const deleteProduct = async (id: string) => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')
    await apiFetch(`/products/${id}`, { token, method: 'DELETE' })
    await load()
  }

  const uploadImage = async (file: File): Promise<string> => {
    const token = getToken()
    const formData = new FormData()
    formData.append('image', file)
    const res = await fetch(`${API_BASE}/products/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.message || 'Upload failed')
    return data.filePath as string
  }

  return { products, loading, error, reload: load, createProduct, updateProduct, deleteProduct, uploadImage }
}