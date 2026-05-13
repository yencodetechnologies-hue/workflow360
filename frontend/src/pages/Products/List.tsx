import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
import { db, useDb } from '../../store/useStore'
import { getToken } from '../../auth/store'

export function ProductsListPage() {
  const state = useDb()
  const products = state.products
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    specification: '',
    rate: '',
    sNo: '',
    imagePath: '',
  })

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category))
    return ['all', ...Array.from(set)]
  }, [products])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return products.filter((p) => {
      if (cat !== 'all' && p.category !== cat) return false
      if (!s) return true
      return (
        p.name.toLowerCase().includes(s) ||
        p.sku.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s)
      )
    })
  }, [cat, products, q])

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Maintain SKU catalog and monitor stock health."
        right={
          <Button
            variant="secondary"
            onClick={() => {
              setEditingId(null)
              setForm({
                name: '',
                sku: '',
                category: '',
                specification: '',
                rate: '',
                sNo: '',
                imagePath: '',
              })
              setOpen(true)
            }}
          >
            Add Product
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Product list</CardTitle>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="w-full sm:w-64">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="h-10" />
            </div>
            <div className="w-full sm:w-56">
              <Select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                options={categories.map((c) => ({ value: c, label: c === 'all' ? 'All categories' : c }))}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState title="No products found" subtitle="Try different filters or search terms." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th className="w-16">S.No</Th>
                  <Th className="w-16">Image</Th>
                  <Th>Category</Th>
                  <Th>Particulars</Th>
                  <Th>Specification</Th>
                  <Th className="text-right">Rate</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 text-sm">
                      <Td className="text-slate-500 font-medium">{p.sNo}</Td>
                      <Td>
                        {p.imagePath ? (
                          <div className="h-10 w-10 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                            <img src={p.imagePath} alt={p.name} className="h-full w-full object-contain" />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-400">
                            No Item
                          </div>
                        )}
                      </Td>
                      <Td className="text-slate-600">{p.category}</Td>
                      <Td className="font-semibold text-slate-900 leading-tight">{p.particulars}</Td>
                      <Td className="text-xs text-slate-500 max-w-xs">{p.specification}</Td>
                      <Td className="text-right font-mono font-semibold text-sky-700">{p.rate}</Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditingId(p.id)
                              setForm({
                                name: p.name,
                                sku: p.sku,
                                category: p.category,
                                specification: p.specification,
                                rate: p.rate,
                                sNo: p.sNo,
                                imagePath: p.imagePath || '',
                              })
                              setOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              if (confirm(`Delete product ${p.name}?`)) db.deleteProduct(p.id)
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        open={open}
        title={editingId ? 'Edit product' : 'Add product'}
        onClose={() => setOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!form.name.trim()) return
                const data = {
                  name: form.name.trim(),
                  category: form.category.trim() || 'General',
                  specification: form.specification.trim(),
                  rate: form.rate.trim(),
                  sNo: form.sNo.trim(),
                  imagePath: form.imagePath.trim(),
                  sku: form.sku || `SKU-${form.sNo.trim() || Date.now()}`,
                  unit: 'pcs',
                  reorderLevel: 0,
                }
                if (editingId) {
                  db.updateProduct(editingId, data)
                } else {
                  db.addProduct(data)
                }
                setOpen(false)
              }}
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <Input label="S.No" value={form.sNo} onChange={(e) => setForm((f) => ({ ...f, sNo: e.target.value }))} placeholder="e.g. 1" />
          <Input label="Particulars" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          <Input label="Specification" value={form.specification} onChange={(e) => setForm((f) => ({ ...f, specification: e.target.value }))} />
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Product Image</label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {form.imagePath ? (
                  <img 
                    src={form.imagePath.startsWith('http') ? form.imagePath : `http://127.0.0.1:5001/${form.imagePath}`} 
                    alt="Preview" 
                    className="h-full w-full object-contain" 
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">No Image</div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  id="image-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    
                    setUploading(true)
                    const formData = new FormData()
                    formData.append('image', file)
                    
                    try {
                      const res = await fetch('http://127.0.0.1:5001/workflow360/api/products/upload', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${getToken()}` },
                        body: formData,
                      })
                      const data = await res.json()
                      if (data.filePath) {
                        setForm((f) => ({ ...f, imagePath: data.filePath }))
                      }
                    } catch (err) {
                      console.error('Upload failed:', err)
                      alert('Image upload failed')
                    } finally {
                      setUploading(false)
                    }
                  }}
                />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="relative h-9 min-w-[120px]"
                  disabled={uploading}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  {uploading ? 'Uploading...' : 'Choose from Gallery'}
                </Button>
                {form.imagePath && (
                  <button 
                    className="text-left text-xs text-red-600 hover:text-red-700 font-medium"
                    onClick={() => setForm(f => ({ ...f, imagePath: '' }))}
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
          </div>

          <Input label="Rate" value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}

