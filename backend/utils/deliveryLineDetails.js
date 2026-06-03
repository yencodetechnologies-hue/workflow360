const Product = require('../models/Product')
const Godown = require('../models/Godown')

function parseRate(rateStr) {
  if (rateStr == null || rateStr === '') return 0
  const n = Number(String(rateStr).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

async function populateLineDetails(delivery) {
  const lines = delivery.lines || []
  const productIds = [...new Set(lines.map((l) => String(l.productId)))]
  const godownIds = [
    ...new Set(lines.map((l) => (l.godownId ? String(l.godownId) : null)).filter(Boolean)),
  ]

  const [products, godowns] = await Promise.all([
    productIds.length ? Product.find({ _id: { $in: productIds } }).lean() : [],
    godownIds.length ? Godown.find({ _id: { $in: godownIds } }).lean() : [],
  ])

  const byProduct = new Map(products.map((p) => [String(p._id), p]))
  const byGodown = new Map(godowns.map((g) => [String(g._id), g]))

  return lines.map((line) => {
    const p = byProduct.get(String(line.productId))
    const gid = line.godownId ? String(line.godownId) : undefined
    const g = gid ? byGodown.get(gid) : undefined
    return {
      productId: String(line.productId),
      godownId: gid,
      godownName: g?.name,
      qty: line.qty,
      dispatchedQty: Number(line.dispatchedQty) || 0,
      returnedQty: Number(line.returnedQty) || 0,
      particulars: p?.particulars,
      sku: p?.sku || p?.s_no,
      rate: p?.rate,
      parsedRate: parseRate(p?.rate),
      unit: p?.unit,
    }
  })
}

async function populateBillerReturnLines(lines) {
  const productIds = [...new Set((lines || []).map((l) => String(l.productId)))]
  if (!productIds.length) return []
  const products = await Product.find({ _id: { $in: productIds } }).lean()
  const byProduct = new Map(products.map((p) => [String(p._id), p]))
  return (lines || [])
    .filter((l) => (l.qty || 0) > 0)
    .map((l) => {
      const p = byProduct.get(String(l.productId))
      return {
        productId: String(l.productId),
        qty: l.qty,
        note: l.note,
        particulars: p?.particulars,
        sku: p?.sku || p?.s_no,
        rate: p?.rate,
        parsedRate: parseRate(p?.rate),
        unit: p?.unit,
      }
    })
}

module.exports = { parseRate, populateLineDetails, populateBillerReturnLines }
