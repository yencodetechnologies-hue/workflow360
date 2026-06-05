
// import { useMemo, useState } from 'react'
// import { Button } from '../../components/ui/Button'
// import { Card, CardContent, CardHeader } from '../../components/ui/Card'
// import { Input } from '../../components/ui/Input'
// import { Modal } from '../../components/ui/Modal'
// import { PageHeader } from '../../components/ui/PageHeader'
// import { EmptyState, Table, Td, Th } from '../../components/ui/Table'
// import { useProducts } from '../../hooks/useProducts'
// import { API_BASE } from '../../lib/api'

// export function ProductsListPage() {
//   const {
//     products,
//     loading,
//     error,
//     createProduct,
//     updateProduct,
//     deleteProduct,
//     uploadImage,
//   } = useProducts()

//   const [q, setQ] = useState('')

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

//   const rows = useMemo(() => {
//     const s = q.trim().toLowerCase()
//     return products.filter((p) => {
//       if (!s) return true
//       return (
//         p.name.toLowerCase().includes(s) ||
//         p.sku.toLowerCase().includes(s) ||
//         p.category.toLowerCase().includes(s)
//       )
//     })
//   }, [products, q])

//   const imageSrc = (path: string) =>
//     path.startsWith('http')
//       ? path
//       : `${API_BASE.replace(/\/api$/, '')}/${path.replace(/^\//, '')}`

//   return (
//     <div className="space-y-5">
//       {/* PAGE HEADER */}
//       <div className="flex items-start justify-between">
//         <div>
//           <h1 className="text-[22px] font-bold text-slate-900 leading-tight tracking-tight">
//             Products
//           </h1>
//           <p className="mt-0.5 text-[13px] text-slate-500">
//             Manage your product catalog, pricing, categories, and inventory visuals.
//           </p>
//         </div>

//         <button
//           onClick={() => {
//             setEditingId(null)
//             setSaveError(null)
//             setForm({ name: '', sku: '', category: '', specification: '', rate: '', sNo: '', imagePath: '' })
//             setOpen(true)
//           }}
//           className="inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[13.5px] font-semibold px-5 h-[42px] rounded-xl shadow-md shadow-indigo-200 transition-colors whitespace-nowrap border-0 cursor-pointer"
//         >
//           <span className="text-[17px] leading-none">+</span>
//           Add Product
//         </button>
//       </div>

//       {/* MAIN CARD */}
//       <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

//         {/* SEARCH ROW */}
//         <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
//           {/* Search box */}
//           <div className="relative w-[260px]">
//             <svg
//               className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
//               width="15" height="15" viewBox="0 0 24 24" fill="none"
//               stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
//             >
//               <circle cx="11" cy="11" r="8" />
//               <line x1="21" y1="21" x2="16.65" y2="16.65" />
//             </svg>
//             <input
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//               placeholder="Search products..."
//               className="w-full h-[38px] pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-700 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
//             />
//           </div>

//           {/* Showing N products */}
//           <span className="text-[13px] text-slate-500">
//             Showing <span className="font-semibold text-slate-800">{rows.length}</span> products
//           </span>
//         </div>

//         {/* ERROR */}
//         {error && (
//           <div className="mx-4 mt-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-[13px] font-medium text-rose-700">
//             {error}
//           </div>
//         )}

//         {/* TABLE STATES */}
//         {loading ? (
//           <div className="flex items-center justify-center py-16 text-[13px] text-slate-400">
//             Loading products...
//           </div>
//         ) : rows.length === 0 ? (
//           <div className="py-14 px-6 text-center">
//             <p className="text-[15px] font-semibold text-slate-600">No products found</p>
//             <p className="text-[13px] text-slate-400 mt-1">Add a product or adjust your filters.</p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full min-w-[900px] border-collapse">

//               {/* TABLE HEADER */}
//               <thead>
//                 <tr className="bg-slate-50 border-b border-slate-200">
//                   <th className="w-[64px] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
//                     S.NO
//                   </th>
//                   <th className="w-[80px] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
//                     IMAGE
//                   </th>
//                   <th className="w-[190px] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
//                     CATEGORY
//                   </th>
//                   <th className="min-w-[220px] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
//                     PARTICULARS
//                   </th>
//                   <th className="min-w-[200px] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
//                     SPECIFICATION
//                   </th>
//                   <th className="w-[100px] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
//                     RATE
//                   </th>
//                   <th className="w-[160px] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
//                     ACTIONS
//                   </th>
//                 </tr>
//               </thead>

//               {/* TABLE BODY */}
//               <tbody>
//                 {rows.map((p) => (
//                   <tr
//                     key={p.id}
//                     className="border-b border-slate-100 bg-white hover:bg-indigo-50/20 transition-colors duration-100"
//                   >
//                     {/* S.NO */}
//                     <td className="px-4 py-3.5 align-middle text-[14px] font-semibold text-slate-700">
//                       {p.sNo}
//                     </td>

//                     {/* IMAGE */}
//                     <td className="px-4 py-3.5 align-middle">
//                       {p.imagePath ? (
//                         <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
//                           <img
//                             src={imageSrc(p.imagePath)}
//                             alt={p.name}
//                             className="w-full h-full object-cover"
//                           />
//                         </div>
//                       ) : (
//                         <div className="w-12 h-12 rounded-xl border-[1.5px] border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
//                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//                             <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
//                             <circle cx="8.5" cy="8.5" r="1.5"/>
//                             <polyline points="21 15 16 10 5 21"/>
//                           </svg>
//                         </div>
//                       )}
//                     </td>

//                     {/* CATEGORY */}
//                     <td className="px-4 py-3.5 align-middle">
//                       <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
//                         {p.category}
//                       </span>
//                     </td>

//                     {/* PARTICULARS */}
//                     <td className="px-4 py-3.5 align-middle">
//                       <div className="max-w-[210px]">
//                         <div className="text-[14.5px] font-bold text-slate-900 leading-snug line-clamp-2">
//                           {p.particulars}
//                         </div>
//                         <div className="mt-0.5 text-[12px] text-slate-400 font-medium">
//                           SKU: {p.sku}
//                         </div>
//                       </div>
//                     </td>

//                     {/* SPECIFICATION */}
//                     <td className="px-4 py-3.5 align-middle">
//                       <div className="text-[13.5px] text-slate-600 max-w-[210px] leading-snug">
//                         {p.specification}
//                       </div>
//                     </td>

//                     {/* RATE */}
//                     <td className="px-4 py-3.5 align-middle">
//                       <span className="text-[14.5px] font-bold text-indigo-500">
//                         ₹{p.rate}
//                       </span>
//                     </td>

//                     {/* ACTIONS */}
//                     <td className="px-4 py-3.5 align-middle">
//                       <div className="flex items-center gap-2">
//                         {/* Edit */}
//                         <button
//                           className="h-[34px] px-4 rounded-lg border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
//                           onClick={() => {
//                             setEditingId(p.id)
//                             setSaveError(null)
//                             setForm({
//                               name: p.particulars,
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
//                         </button>

//                         {/* Delete */}
//                         <button
//                           className="h-[34px] px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold border-0 cursor-pointer transition-colors"
//                           onClick={async () => {
//                             if (!confirm(`Delete product ${p.particulars}?`)) return
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
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* ── MODAL ── */}
//       <Modal
//         open={open}
//         title={editingId ? 'Edit Product' : 'Add Product'}
//         onClose={() => setOpen(false)}
//         footer={
//           <div className="flex justify-end gap-3">
//             <button
//               className="h-10 px-5 rounded-xl border border-slate-200 bg-white text-[13.5px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
//               onClick={() => setOpen(false)}
//             >
//               Cancel
//             </button>

//             <button
//               disabled={saving || !form.name.trim() || !form.sNo.trim()}
//               className="h-10 px-5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white text-[13.5px] font-semibold border-0 cursor-pointer disabled:cursor-not-allowed transition-colors"
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
//               {saving ? 'Saving...' : 'Save Product'}
//             </button>
//           </div>
//         }
//       >
//         {saveError && (
//           <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-[13px] text-rose-700">
//             {saveError}
//           </div>
//         )}

//         <div className="grid grid-cols-1 gap-4">
//           <Input
//             label="S.No"
//             value={form.sNo}
//             onChange={(e) => setForm((f) => ({ ...f, sNo: e.target.value }))}
//             placeholder="e.g. 1"
//           />
//           <Input
//             label="Particulars"
//             value={form.name}
//             onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
//           />
//           <Input
//             label="Category"
//             value={form.category}
//             onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
//           />
//           <Input
//             label="Specification"
//             value={form.specification}
//             onChange={(e) => setForm((f) => ({ ...f, specification: e.target.value }))}
//           />

//           {/* IMAGE UPLOAD */}
//           <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
//             <label className="block mb-3 text-[13.5px] font-semibold text-slate-700">
//               Product Image
//             </label>
//             <div className="flex items-center gap-5">
//               {/* Preview */}
//               <div className="w-24 h-24 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center text-[11px] text-slate-400 flex-shrink-0">
//                 {form.imagePath ? (
//                   <img src={imageSrc(form.imagePath)} alt="Preview" className="w-full h-full object-cover" />
//                 ) : (
//                   'No Image'
//                 )}
//               </div>
//               <div className="flex flex-col gap-2.5">
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
//                 <button
//                   disabled={uploading}
//                   className="h-10 px-5 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-60"
//                   onClick={() => document.getElementById('image-upload')?.click()}
//                 >
//                   {uploading ? 'Uploading...' : 'Choose from Gallery'}
//                 </button>
//                 {form.imagePath && (
//                   <button
//                     className="text-left text-[13px] font-semibold text-red-500 hover:text-red-600 bg-transparent border-0 cursor-pointer p-0"
//                     onClick={() => setForm((f) => ({ ...f, imagePath: '' }))}
//                   >
//                     Remove Image
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>

//           <Input
//             label="Rate"
//             value={form.rate}
//             onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
//             placeholder="e.g. 150"
//           />
//         </div>
//       </Modal>
//     </div>
//   )
// }

import { useMemo, useState } from 'react'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { useProducts } from '../../hooks/useProducts'
import { API_BASE } from '../../lib/api'

export function ProductsListPage() {
  const { products, loading, error, createProduct, updateProduct, deleteProduct, uploadImage } = useProducts()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', sku: '', category: '', specification: '', rate: '', sNo: '', imagePath: '' })

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return products.filter((p) => !s || p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || p.category.toLowerCase().includes(s))
  }, [products, q])

  const imageSrc = (path: string) =>
    path.startsWith('http') ? path : `${API_BASE.replace(/\/api$/, '')}/${path.replace(/^\//, '')}`

  return (
    // No extra padding — AppShell provides 20px 24px padding
    <div style={{ fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Products</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
            Manage your product catalog, pricing, categories, and inventory visuals.
          </p>
        </div>
        <button
          onClick={() => { setEditingId(null); setSaveError(null); setForm({ name: '', sku: '', category: '', specification: '', rate: '', sNo: '', imagePath: '' }); setOpen(true) }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#4f46e5', color: '#fff', fontSize: 13, fontWeight: 600,
            padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
          }}
        >
          <span style={{ fontSize: 17, lineHeight: 1 }}>+</span>
          Add Product
        </button>
      </div>

      {/* ── main card ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

        {/* search row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ position: 'relative', width: 260 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..."
              style={{ width: '100%', height: 38, paddingLeft: 36, paddingRight: 12, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            Showing <span style={{ fontWeight: 600, color: '#0f172a' }}>{rows.length}</span> products
          </span>
        </div>

        {/* error */}
        {error && (
          <div style={{ margin: '12px 16px', borderRadius: 10, border: '1px solid #fecdd3', background: '#fff1f2', padding: '10px 14px', fontSize: 13, color: '#be123c' }}>{error}</div>
        )}

        {/* table states */}
        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>Loading products...</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#475569', margin: 0 }}>No products found</p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Add a product or adjust your filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['S.NO', 'IMAGE', 'CATEGORY', 'PARTICULARS', 'SPECIFICATION', , 'ACTIONS'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(238,242,255,0.4)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                  >
                    {/* S.NO */}
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#374151', verticalAlign: 'middle' }}>{p.sNo}</td>

                    {/* IMAGE */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      {p.imagePath ? (
                        <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff' }}>
                          <img src={imageSrc(p.imagePath)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: 10, border: '1.5px dashed #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                    </td>

                    {/* CATEGORY */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 6, background: '#f1f5f9', padding: '4px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                        {p.category}
                      </span>
                    </td>

                    {/* PARTICULARS */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <div style={{ maxWidth: 210 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>{p.particulars}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: 500 }}>SKU: {p.sku}</div>
                      </div>
                    </td>

                    {/* SPECIFICATION */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: 13, color: '#475569', maxWidth: 210, lineHeight: 1.4 }}>{p.specification}</div>
                    </td>

                

                    {/* ACTIONS */}
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          style={{ height: 34, padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
                          onClick={() => { setEditingId(p.id); setSaveError(null); setForm({ name: p.particulars, sku: p.sku, category: p.category, specification: p.specification, rate: p.rate, sNo: p.sNo, imagePath: p.imagePath || '' }); setOpen(true) }}
                        >Edit</button>
                        <button
                          style={{ height: 34, padding: '0 16px', borderRadius: 8, border: 'none', background: '#ef4444', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
                          onClick={async () => {
                            if (!confirm(`Delete product ${p.particulars}?`)) return
                            try { await deleteProduct(p.id) } catch (e: unknown) { alert((e as any)?.message ?? 'Delete failed') }
                          }}
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      <Modal open={open} title={editingId ? 'Edit Product' : 'Add Product'} onClose={() => setOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button className="h-10 px-5 rounded-xl border border-slate-200 bg-white text-[13.5px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer" onClick={() => setOpen(false)}>Cancel</button>
            <button
              disabled={saving || !form.name.trim() || !form.sNo.trim()}
              className="h-10 px-5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white text-[13.5px] font-semibold border-0 cursor-pointer disabled:cursor-not-allowed transition-colors"
              onClick={async () => {
                setSaving(true); setSaveError(null)
                const body = { s_no: form.sNo.trim(), particulars: form.name.trim(), category: form.category.trim() || 'General', specification: form.specification.trim() || '—', rate: form.rate.trim() || '—', sku: form.sku.trim() || `SKU-${form.sNo.trim()}`, unit: 'pcs', reorderLevel: 0, image_path: form.imagePath.trim() || undefined }
                try {
                  if (editingId) { await updateProduct(editingId, body) } else { await createProduct(body) }
                  setOpen(false)
                } catch (e: unknown) { setSaveError((e as any)?.message ?? 'Save failed') } finally { setSaving(false) }
              }}
            >{saving ? 'Saving...' : 'Save Product'}</button>
          </div>
        }
      >
        {saveError && <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-[13px] text-rose-700">{saveError}</div>}
        <div className="grid grid-cols-1 gap-4">
          <Input label="S.No" value={form.sNo} onChange={(e) => setForm((f) => ({ ...f, sNo: e.target.value }))} placeholder="e.g. 1" />
          <Input label="Particulars" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          <Input label="Specification" value={form.specification} onChange={(e) => setForm((f) => ({ ...f, specification: e.target.value }))} />
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <label className="block mb-3 text-[13.5px] font-semibold text-slate-700">Product Image</label>
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center text-[11px] text-slate-400 flex-shrink-0">
                {form.imagePath ? <img src={imageSrc(form.imagePath)} alt="Preview" className="w-full h-full object-cover" /> : 'No Image'}
              </div>
              <div className="flex flex-col gap-2.5">
                <input type="file" id="image-upload" className="hidden" accept="image/*"
                  onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); try { const fp = await uploadImage(file); setForm((f) => ({ ...f, imagePath: fp })) } catch { alert('Image upload failed') } finally { setUploading(false) } }} />
                <button disabled={uploading} className="h-10 px-5 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-60" onClick={() => document.getElementById('image-upload')?.click()}>
                  {uploading ? 'Uploading...' : 'Choose from Gallery'}
                </button>
                {form.imagePath && <button className="text-left text-[13px] font-semibold text-red-500 hover:text-red-600 bg-transparent border-0 cursor-pointer p-0" onClick={() => setForm((f) => ({ ...f, imagePath: '' }))}>Remove Image</button>}
              </div>
            </div>
          </div>
          <Input label="Rate" value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} placeholder="e.g. 150" />
        </div>
      </Modal>
    </div>
  )
}