// import { useMemo, useState } from 'react'
// import { Button } from '../../components/ui/Button'
// import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
// import { Input } from '../../components/ui/Input'
// import { Modal } from '../../components/ui/Modal'
// import { Select } from '../../components/ui/Select'
// import { PageHeader } from '../../components/ui/PageHeader'
// import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
// import { useProducts } from '../../hooks/useProducts'
// import { API_BASE } from '../../lib/api'

// export function ProductsListPage() {
//   const { products, loading, error, reload, createProduct, updateProduct, deleteProduct, uploadImage } =
//     useProducts()
//   const [q, setQ] = useState('')
//   const [cat, setCat] = useState('all')
//   const [open, setOpen] = useState(false)
//   const [uploading, setUploading] = useState(false)
//   const [saving, setSaving] = useState(false)
//   const [saveError, setSaveError] = useState<string | null>(null)
//   const [editingId, setEditingId] = useState<string | null>(null)
//   const [form, setForm] = useState({
//     name: '',
//     sku: '',
//     category: '',
//     specification: '',
//     rate: '',
//     sNo: '',
//     imagePath: '',
//   })

//   const categories = useMemo(() => {
//     const set = new Set(products.map((p) => p.category))
//     return ['all', ...Array.from(set)]
//   }, [products])

//   const rows = useMemo(() => {
//     const s = q.trim().toLowerCase()
//     return products.filter((p) => {
//       if (cat !== 'all' && p.category !== cat) return false
//       if (!s) return true
//       return (
//         p.name.toLowerCase().includes(s) ||
//         p.sku.toLowerCase().includes(s) ||
//         p.category.toLowerCase().includes(s)
//       )
//     })
//   }, [cat, products, q])

//   const imageSrc = (path: string) =>
//     path.startsWith('http') ? path : `${API_BASE.replace(/\/api$/, '')}/${path.replace(/^\//, '')}`

//   return (
//     <div>
//       <PageHeader
//         title="Products"
//         subtitle="Product catalog from the server."
//         right={
//           <Button
//             variant="secondary"
//             onClick={() => {
//               setEditingId(null)
//               setSaveError(null)
//               setForm({
//                 name: '',
//                 sku: '',
//                 category: '',
//                 specification: '',
//                 rate: '',
//                 sNo: '',
//                 imagePath: '',
//               })
//               setOpen(true)
//             }}
//           >
//             Add Product
//           </Button>
//         }
//       />

//       <Card>
//         <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//           <CardTitle>Product list</CardTitle>
//           <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
//             <div className="w-full sm:w-64">
//               <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="h-10" />
//             </div>
//             <div className="w-full sm:w-56">
//               <Select
//                 value={cat}
//                 onChange={(e) => setCat(e.target.value)}
//                 options={categories.map((c) => ({ value: c, label: c === 'all' ? 'All categories' : c }))}
//               />
//             </div>
//             <Button variant="secondary" onClick={reload}>
//               Refresh
//             </Button>
//           </div>
//         </CardHeader>
//         <CardContent>
//           {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
//           {loading ? (
//             <div className="text-sm text-slate-600">Loading products…</div>
//           ) : rows.length === 0 ? (
//             <EmptyState title="No products found" subtitle="Add a product or adjust your filters." />
//           ) : (
//             <Table>
//               <thead>
//                 <tr>
//                   <Th className="w-16">S.No</Th>
//                   <Th className="w-16">Image</Th>
//                   <Th>Category</Th>
//                   <Th>Particulars</Th>
//                   <Th>Specification</Th>
//                   <Th className="text-right">Rate</Th>
//                   <Th className="text-right">Actions</Th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {rows.map((p) => (
//                   <tr key={p.id} className="hover:bg-slate-50 text-sm">
//                     <Td className="text-slate-500 font-medium">{p.sNo}</Td>
//                     <Td>
//                       {p.imagePath ? (
//                         <div className="h-10 w-10 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
//                           <img src={imageSrc(p.imagePath)} alt={p.name} className="h-full w-full object-contain" />
//                         </div>
//                       ) : (
//                         <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-400">
//                           No Item
//                         </div>
//                       )}
//                     </Td>
//                     <Td className="text-slate-600">{p.category}</Td>
//                     <Td className="font-semibold text-slate-900 leading-tight">{p.particulars}</Td>
//                     <Td className="text-xs text-slate-500 max-w-xs">{p.specification}</Td>
//                     <Td className="text-right font-mono font-semibold text-sky-700">{p.rate}</Td>
//                     <Td className="text-right">
//                       <div className="flex justify-end gap-2">
//                         <Button
//                           size="sm"
//                           variant="secondary"
//                           onClick={() => {
//                             setEditingId(p.id)
//                             setSaveError(null)
//                             setForm({
//                               name: p.name,
//                               sku: p.sku,
//                               category: p.category,
//                               specification: p.specification,
//                               rate: p.rate,
//                               sNo: p.sNo,
//                               imagePath: p.imagePath || '',
//                             })
//                             setOpen(true)
//                           }}
//                         >
//                           Edit
//                         </Button>
//                         <Button
//                           size="sm"
//                           variant="danger"
//                           onClick={async () => {
//                             if (!confirm(`Delete product ${p.name}?`)) return
//                             try {
//                               await deleteProduct(p.id)
//                             } catch (e: unknown) {
//                               const msg =
//                                 e && typeof e === 'object' && 'message' in e
//                                   ? String((e as { message: string }).message)
//                                   : 'Delete failed'
//                               alert(msg)
//                             }
//                           }}
//                         >
//                           Delete
//                         </Button>
//                       </div>
//                     </Td>
//                   </tr>
//                 ))}
//               </tbody>
//             </Table>
//           )}
//         </CardContent>
//       </Card>

//       <Modal
//         open={open}
//         title={editingId ? 'Edit product' : 'Add product'}
//         onClose={() => setOpen(false)}
//         footer={
//           <div className="flex justify-end gap-2">
//             <Button variant="secondary" onClick={() => setOpen(false)}>
//               Cancel
//             </Button>
//             <Button
//               disabled={saving || !form.name.trim() || !form.sNo.trim()}
//               onClick={async () => {
//                 setSaving(true)
//                 setSaveError(null)
//                 const body = {
//                   s_no: form.sNo.trim(),
//                   particulars: form.name.trim(),
//                   category: form.category.trim() || 'General',
//                   specification: form.specification.trim() || '—',
//                   rate: form.rate.trim() || '—',
//                   sku: form.sku.trim() || `SKU-${form.sNo.trim()}`,
//                   unit: 'pcs',
//                   reorderLevel: 0,
//                   image_path: form.imagePath.trim() || undefined,
//                 }
//                 try {
//                   if (editingId) {
//                     await updateProduct(editingId, body)
//                   } else {
//                     await createProduct(body)
//                   }
//                   setOpen(false)
//                 } catch (e: unknown) {
//                   const msg =
//                     e && typeof e === 'object' && 'message' in e
//                       ? String((e as { message: string }).message)
//                       : 'Save failed'
//                   setSaveError(msg)
//                 } finally {
//                   setSaving(false)
//                 }
//               }}
//             >
//               {saving ? 'Saving…' : 'Save'}
//             </Button>
//           </div>
//         }
//       >
//         {saveError ? <div className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{saveError}</div> : null}
//         <div className="grid grid-cols-1 gap-4">
//           <Input label="S.No" value={form.sNo} onChange={(e) => setForm((f) => ({ ...f, sNo: e.target.value }))} placeholder="e.g. 1" />
//           <Input label="Particulars" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
//           <Input label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
//           <Input label="Specification" value={form.specification} onChange={(e) => setForm((f) => ({ ...f, specification: e.target.value }))} />

//           <div className="space-y-2">
//             <label className="text-sm font-medium text-slate-700">Product Image</label>
//             <div className="flex items-center gap-4">
//               <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
//                 {form.imagePath ? (
//                   <img src={imageSrc(form.imagePath)} alt="Preview" className="h-full w-full object-contain" />
//                 ) : (
//                   <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">No Image</div>
//                 )}
//               </div>
//               <div className="flex flex-col gap-2">
//                 <input
//                   type="file"
//                   id="image-upload"
//                   className="hidden"
//                   accept="image/*"
//                   onChange={async (e) => {
//                     const file = e.target.files?.[0]
//                     if (!file) return
//                     setUploading(true)
//                     try {
//                       const filePath = await uploadImage(file)
//                       setForm((f) => ({ ...f, imagePath: filePath }))
//                     } catch {
//                       alert('Image upload failed')
//                     } finally {
//                       setUploading(false)
//                     }
//                   }}
//                 />
//                 <Button
//                   variant="secondary"
//                   size="sm"
//                   className="relative h-9 min-w-[120px]"
//                   disabled={uploading}
//                   onClick={() => document.getElementById('image-upload')?.click()}
//                 >
//                   {uploading ? 'Uploading...' : 'Choose from Gallery'}
//                 </Button>
//                 {form.imagePath ? (
//                   <button
//                     type="button"
//                     className="text-left text-xs font-medium text-red-600 hover:text-red-700"
//                     onClick={() => setForm((f) => ({ ...f, imagePath: '' }))}
//                   >
//                     Remove Image
//                   </button>
//                 ) : null}
//               </div>
//             </div>
//           </div>

//           <Input label="Rate" value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} />
//         </div>
//       </Modal>
//     </div>
//   )
// }

import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
import { useProducts } from '../../hooks/useProducts'
import { API_BASE } from '../../lib/api'

export function ProductsListPage() {
  const {
    products,
    loading,
    error,
    reload,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadImage,
  } = useProducts()

  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')

  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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

  const imageSrc = (path: string) =>
    path.startsWith('http')
      ? path
      : `${API_BASE.replace(/\/api$/, '')}/${path.replace(/^\//, '')}`

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageHeader
        title="Products"
        subtitle="Manage your product catalog, pricing, categories, and inventory visuals."
        right={
          <Button
            className="h-11 rounded-2xl px-5 shadow-lg shadow-violet-200/50"
            onClick={() => {
              setEditingId(null)
              setSaveError(null)

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
            + Add Product
          </Button>
        }
      />

      {/* MAIN CARD */}
      <Card className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
        {/* TOP FILTER SECTION */}
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Product Inventory
              </CardTitle>

              <p className="mt-1 text-sm text-slate-500">
                Search, filter, edit, and manage your products professionally.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 md:flex-row xl:w-auto">
              <div className="w-full md:w-72">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search products..."
                  className="h-12 rounded-2xl border-slate-200 bg-white"
                />
              </div>

              <div className="w-full md:w-60">
                <Select
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  options={categories.map((c) => ({
                    value: c,
                    label: c === 'all' ? 'All categories' : c,
                  }))}
                />
              </div>

              <Button
                variant="secondary"
                className="h-12 rounded-2xl px-5"
                onClick={reload}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* TABLE */}
        <CardContent className="p-0">
          {error ? (
            <div className="m-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm text-slate-500">
              Loading products...
            </div>
          ) : rows.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No products found"
                subtitle="Add a product or adjust your filters."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[1150px]">
                <thead className="bg-slate-50/80">
                  <tr>
                    <Th className="w-16">S.No</Th>

                    <Th className="w-24">Image</Th>

                    <Th>Category</Th>

                    <Th>Particulars</Th>

                    <Th>Specification</Th>

                    <Th className="text-right">Rate</Th>

                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-100 transition-all hover:bg-violet-50/40"
                    >
                      {/* SNO */}
                      <Td className="font-semibold text-slate-600">
                        {p.sNo}
                      </Td>

                      {/* IMAGE */}
                      <Td>
                        {p.imagePath ? (
                          <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <img
                              src={imageSrc(p.imagePath)}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-400">
                            No Image
                          </div>
                        )}
                      </Td>

                      {/* CATEGORY */}
                      <Td>
                        <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                          {p.category}
                        </div>
                      </Td>

                      {/* PARTICULARS */}
                      <Td>
                        <div className="max-w-[260px]">
                          <div className="text-base font-semibold leading-snug text-slate-900">
                            {p.particulars}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            SKU: {p.sku}
                          </div>
                        </div>
                      </Td>

                      {/* SPEC */}
                      <Td>
                        <div className="max-w-[320px] text-sm leading-relaxed text-slate-600">
                          {p.specification}
                        </div>
                      </Td>

                      {/* RATE */}
                      <Td className="text-right">
                        <div className="inline-flex rounded-xl bg-emerald-50 px-3 py-2 font-mono text-sm font-bold text-emerald-700">
                          ₹ {p.rate}
                        </div>
                      </Td>

                      {/* ACTIONS */}
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="rounded-xl px-4"
                            onClick={() => {
                              setEditingId(p.id)
                              setSaveError(null)

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
                            className="rounded-xl px-4"
                            onClick={async () => {
                              if (!confirm(`Delete product ${p.name}?`))
                                return

                              try {
                                await deleteProduct(p.id)
                              } catch (e: unknown) {
                                const msg =
                                  e &&
                                  typeof e === 'object' &&
                                  'message' in e
                                    ? String(
                                        (e as { message: string }).message,
                                      )
                                    : 'Delete failed'

                                alert(msg)
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL */}
      <Modal
        open={open}
        title={editingId ? 'Edit Product' : 'Add Product'}
        onClose={() => setOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              className="rounded-xl"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button
              className="rounded-xl px-5"
              disabled={saving || !form.name.trim() || !form.sNo.trim()}
              onClick={async () => {
                setSaving(true)
                setSaveError(null)

                const body = {
                  s_no: form.sNo.trim(),
                  particulars: form.name.trim(),
                  category: form.category.trim() || 'General',
                  specification: form.specification.trim() || '—',
                  rate: form.rate.trim() || '—',
                  sku: form.sku.trim() || `SKU-${form.sNo.trim()}`,
                  unit: 'pcs',
                  reorderLevel: 0,
                  image_path: form.imagePath.trim() || undefined,
                }

                try {
                  if (editingId) {
                    await updateProduct(editingId, body)
                  } else {
                    await createProduct(body)
                  }

                  setOpen(false)
                } catch (e: unknown) {
                  const msg =
                    e &&
                    typeof e === 'object' &&
                    'message' in e
                      ? String((e as { message: string }).message)
                      : 'Save failed'

                  setSaveError(msg)
                } finally {
                  setSaving(false)
                }
              }}
            >
              {saving ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        }
      >
        {saveError ? (
          <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {saveError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5">
          <Input
            label="S.No"
            value={form.sNo}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                sNo: e.target.value,
              }))
            }
            placeholder="e.g. 1"
          />

          <Input
            label="Particulars"
            value={form.name}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                name: e.target.value,
              }))
            }
          />

          <Input
            label="Category"
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                category: e.target.value,
              }))
            }
          />

          <Input
            label="Specification"
            value={form.specification}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                specification: e.target.value,
              }))
            }
          />

          {/* IMAGE */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <label className="mb-4 block text-sm font-semibold text-slate-700">
              Product Image
            </label>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="h-28 w-28 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {form.imagePath ? (
                  <img
                    src={imageSrc(form.imagePath)}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                    No Image
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  id="image-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]

                    if (!file) return

                    setUploading(true)

                    try {
                      const filePath = await uploadImage(file)

                      setForm((f) => ({
                        ...f,
                        imagePath: filePath,
                      }))
                    } catch {
                      alert('Image upload failed')
                    } finally {
                      setUploading(false)
                    }
                  }}
                />

                <Button
                  variant="secondary"
                  className="h-11 rounded-xl px-5"
                  disabled={uploading}
                  onClick={() =>
                    document.getElementById('image-upload')?.click()
                  }
                >
                  {uploading
                    ? 'Uploading...'
                    : 'Choose from Gallery'}
                </Button>

                {form.imagePath ? (
                  <button
                    type="button"
                    className="text-left text-sm font-semibold text-red-600 transition hover:text-red-700"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        imagePath: '',
                      }))
                    }
                  >
                    Remove Image
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <Input
            label="Rate"
            value={form.rate}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                rate: e.target.value,
              }))
            }
            placeholder="e.g. 150"
          />
        </div>
      </Modal>
    </div>
  )
}