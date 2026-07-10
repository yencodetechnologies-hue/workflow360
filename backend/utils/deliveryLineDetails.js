// // const Product = require('../models/Product')
// // const Godown = require('../models/Godown')

// // function parseRate(rateStr) {
// //   if (rateStr == null || rateStr === '') return 0
// //   const n = Number(String(rateStr).replace(/[^0-9.-]/g, ''))
// //   return Number.isFinite(n) ? n : 0
// // }

// // function godownIdForLine(line, delivery) {
// //   return line.godownId || delivery.fromGodownId
// // }

// // async function populateLineDetails(delivery) {
// //   const lines = delivery.lines || []
// //   const productIds = [...new Set(lines.map((l) => String(l.productId)))]
// //   const godownIds = [
// //     ...new Set(
// //       lines
// //         .map((l) => {
// //           const gid = godownIdForLine(l, delivery)
// //           return gid ? String(gid) : null
// //         })
// //         .filter(Boolean),
// //     ),
// //   ]

// //   const [products, godowns] = await Promise.all([
// //     productIds.length ? Product.find({ _id: { $in: productIds } }).lean() : [],
// //     godownIds.length ? Godown.find({ _id: { $in: godownIds } }).lean() : [],
// //   ])

// //   const byProduct = new Map(products.map((p) => [String(p._id), p]))
// //   const byGodown = new Map(godowns.map((g) => [String(g._id), g]))

// //   return lines.map((line) => {
// //     const p = byProduct.get(String(line.productId))
// //     const gidRaw = godownIdForLine(line, delivery)
// //     const gid = gidRaw ? String(gidRaw) : undefined
// //     const g = gid ? byGodown.get(gid) : undefined
// //     return {
// //       productId: String(line.productId),
// //       godownId: gid,
// //       godownName: g?.name,
// //       qty: line.qty,
// //       dispatchedQty: Number(line.dispatchedQty) || 0,
// //       returnedQty: Number(line.returnedQty) || 0,
// //       particulars: p?.particulars,
// //       sku: p?.sku || p?.s_no,
// //       rate: p?.rate,
// //       parsedRate: parseRate(p?.rate),
// //       unit: p?.unit,
// //     }
// //   })
// // }

// // async function populateBillerReturnLines(lines) {
// //   const productIds = [...new Set((lines || []).map((l) => String(l.productId)))]
// //   if (!productIds.length) return []
// //   const products = await Product.find({ _id: { $in: productIds } }).lean()
// //   const byProduct = new Map(products.map((p) => [String(p._id), p]))
// //   return (lines || [])
// //     .filter((l) => (l.qty || 0) > 0)
// //     .map((l) => {
// //       const p = byProduct.get(String(l.productId))
// //       return {
// //         productId: String(l.productId),
// //         qty: l.qty,
// //         note: l.note,
// //         particulars: p?.particulars,
// //         sku: p?.sku || p?.s_no,
// //         rate: p?.rate,
// //         parsedRate: parseRate(p?.rate),
// //         unit: p?.unit,
// //       }
// //     })
// // }

// // /**
// //  * Batch-enrich delivery list rows with godown names and product summaries.
// //  * @param {object[]} deliveries - lean delivery documents
// //  */
// // async function enrichListRows(deliveries) {
// //   if (!deliveries.length) return []

// //   const productIds = new Set()
// //   const godownIds = new Set()

// //   for (const d of deliveries) {
// //     for (const line of d.lines || []) {
// //       if (line.productId) productIds.add(String(line.productId))
// //       const gid = godownIdForLine(line, d)
// //       if (gid) godownIds.add(String(gid))
// //     }
// //     if (d.fromGodownId) godownIds.add(String(d.fromGodownId))
// //   }

// //   const [products, godowns] = await Promise.all([
// //     productIds.size ? Product.find({ _id: { $in: [...productIds] } }).lean() : [],
// //     godownIds.size ? Godown.find({ _id: { $in: [...godownIds] } }).lean() : [],
// //   ])

// //   const byProduct = new Map(products.map((p) => [String(p._id), p]))
// //   const byGodown = new Map(godowns.map((g) => [String(g._id), g]))

// //   return deliveries.map((d) => {
// //     const linesSummary = (d.lines || []).map((line) => {
// //       const p = byProduct.get(String(line.productId))
// //       const gid = godownIdForLine(line, d)
// //       const g = gid ? byGodown.get(String(gid)) : undefined
// //       return {
// //         productId: String(line.productId),
// //         particulars: p?.particulars || p?.name,
// //         sku: p?.sku || p?.s_no,
// //         qty: line.qty,
// //         godownName: g?.name,
// //       }
// //     })

// //     const godownNames = [...new Set(linesSummary.map((l) => l.godownName).filter(Boolean))]
// //     const productCount = linesSummary.length
// //     const totalQty = linesSummary.reduce((sum, l) => sum + (Number(l.qty) || 0), 0)

// //     return {
// //       godownNames,
// //       primaryGodownName: godownNames[0] || undefined,
// //       linesSummary,
// //       productCount,
// //       totalQty,
// //     }
// //   })
// // }

// // module.exports = {
// //   parseRate,
// //   godownIdForLine,
// //   populateLineDetails,
// //   populateBillerReturnLines,
// //   enrichListRows,
// // }

// const Product = require('../models/Product')
// const Godown = require('../models/Godown')

// function parseRate(rateStr) {
//   if (rateStr == null || rateStr === '') return 0
//   const n = Number(String(rateStr).replace(/[^0-9.-]/g, ''))
//   return Number.isFinite(n) ? n : 0
// }

// function godownIdForLine(line, delivery) {
//   return line.godownId || delivery.fromGodownId
// }

// async function populateLineDetails(delivery) {
//   const lines = delivery.lines || []
//   const productIds = [...new Set(lines.map((l) => String(l.productId)))]
//   const godownIds = [
//     ...new Set(
//       lines
//         .map((l) => {
//           const gid = godownIdForLine(l, delivery)
//           return gid ? String(gid) : null
//         })
//         .filter(Boolean),
//     ),
//   ]

//   const [products, godowns] = await Promise.all([
//     productIds.length ? Product.find({ _id: { $in: productIds } }).lean() : [],
//     godownIds.length ? Godown.find({ _id: { $in: godownIds } }).lean() : [],
//   ])

//   const byProduct = new Map(products.map((p) => [String(p._id), p]))
//   const byGodown = new Map(godowns.map((g) => [String(g._id), g]))

//   return lines.map((line) => {
//     const p = byProduct.get(String(line.productId))
//     const gidRaw = godownIdForLine(line, delivery)
//     const gid = gidRaw ? String(gidRaw) : undefined
//     const g = gid ? byGodown.get(gid) : undefined
//     return {
//       productId: String(line.productId),
//       godownId: gid,
//       godownName: g?.name,
//       qty: line.qty,
//       dispatchedQty: Number(line.dispatchedQty) || 0,
//       returnedQty: Number(line.returnedQty) || 0,
//       particulars: p?.particulars,
//       sku: p?.sku || p?.s_no,
//       rate: p?.rate,
//       parsedRate: parseRate(p?.rate),
//       unit: p?.unit,
//     }
//   })
// }

// async function populateBillerReturnLines(lines) {
//   const productIds = [...new Set((lines || []).map((l) => String(l.productId)))]
//   if (!productIds.length) return []
//   const products = await Product.find({ _id: { $in: productIds } }).lean()
//   const byProduct = new Map(products.map((p) => [String(p._id), p]))
//   return (lines || [])
//     .filter((l) => (l.qty || 0) > 0)
//     .map((l) => {
//       const p = byProduct.get(String(l.productId))
//       return {
//         productId: String(l.productId),
//         qty: l.qty,
//         note: l.note,
//         particulars: p?.particulars,
//         sku: p?.sku || p?.s_no,
//         rate: p?.rate,
//         parsedRate: parseRate(p?.rate),
//         unit: p?.unit,
//       }
//     })
// }

// /**
//  * Batch-enrich delivery list rows with godown names and product summaries.
//  * @param {object[]} deliveries - lean delivery documents
//  */
// async function enrichListRows(deliveries) {
//   if (!deliveries.length) return []

//   const productIds = new Set()
//   const godownIds = new Set()

//   for (const d of deliveries) {
//     for (const line of d.lines || []) {
//       if (line.productId) productIds.add(String(line.productId))
//       const gid = godownIdForLine(line, d)
//       if (gid) godownIds.add(String(gid))
//     }
//     if (d.fromGodownId) godownIds.add(String(d.fromGodownId))
//   }

//   const [products, godowns] = await Promise.all([
//     productIds.size ? Product.find({ _id: { $in: [...productIds] } }).lean() : [],
//     godownIds.size ? Godown.find({ _id: { $in: [...godownIds] } }).lean() : [],
//   ])

//   const byProduct = new Map(products.map((p) => [String(p._id), p]))
//   const byGodown = new Map(godowns.map((g) => [String(g._id), g]))

//   return deliveries.map((d) => {
//     // Per-product missing/damaged qty reported by the biller (used on the
//     // Delivery Manager "Pending return" list to show Delivered/Collected/Missing).
//     const missingByProduct = new Map()
//     for (const l of [...(d.billerDamagedLines || []), ...(d.billerMissingLines || [])]) {
//       const key = String(l.productId)
//       missingByProduct.set(key, (missingByProduct.get(key) || 0) + (Number(l.qty) || 0))
//     }

//     const linesSummary = (d.lines || []).map((line) => {
//       const p = byProduct.get(String(line.productId))
//       const gid = godownIdForLine(line, d)
//       const g = gid ? byGodown.get(String(gid)) : undefined
//       const dispatchedQty = Number(line.dispatchedQty) || 0
//       const returnedQty = Number(line.returnedQty) || 0
//       return {
//         productId: String(line.productId),
//         particulars: p?.particulars || p?.name,
//         sku: p?.sku || p?.s_no,
//         qty: line.qty,
//         godownName: g?.name,
//         dispatchedQty,
//         returnedQty,
//         missingQty: missingByProduct.get(String(line.productId)) || 0,
//         pendingQty: Math.max(0, dispatchedQty - returnedQty),
//       }
//     })

//     const godownNames = [...new Set(linesSummary.map((l) => l.godownName).filter(Boolean))]
//     const productCount = linesSummary.length
//     const totalQty = linesSummary.reduce((sum, l) => sum + (Number(l.qty) || 0), 0)

//     return {
//       godownNames,
//       primaryGodownName: godownNames[0] || undefined,
//       linesSummary,
//       productCount,
//       totalQty,
//     }
//   })
// }

// module.exports = {
//   parseRate,
//   godownIdForLine,
//   populateLineDetails,
//   populateBillerReturnLines,
//   enrichListRows,
// }

const Product = require('../models/Product')
const Godown = require('../models/Godown')

function parseRate(rateStr) {
  if (rateStr == null || rateStr === '') return 0
  const n = Number(String(rateStr).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function godownIdForLine(line, delivery) {
  return line.godownId || delivery.fromGodownId
}

async function populateLineDetails(delivery) {
  const lines = delivery.lines || []
  const productIds = [...new Set(lines.map((l) => String(l.productId)))]
  const godownIds = [
    ...new Set(
      lines
        .map((l) => {
          const gid = godownIdForLine(l, delivery)
          return gid ? String(gid) : null
        })
        .filter(Boolean),
    ),
  ]

  const [products, godowns] = await Promise.all([
    productIds.length ? Product.find({ _id: { $in: productIds } }).lean() : [],
    godownIds.length ? Godown.find({ _id: { $in: godownIds } }).lean() : [],
  ])

  const byProduct = new Map(products.map((p) => [String(p._id), p]))
  const byGodown = new Map(godowns.map((g) => [String(g._id), g]))

  return lines.map((line) => {
    const p = byProduct.get(String(line.productId))
    const gidRaw = godownIdForLine(line, delivery)
    const gid = gidRaw ? String(gidRaw) : undefined
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

/**
 * Batch-enrich delivery list rows with godown names and product summaries.
 * @param {object[]} deliveries - lean delivery documents
 */
async function enrichListRows(deliveries) {
  if (!deliveries.length) return []

  const productIds = new Set()
  const godownIds = new Set()

  for (const d of deliveries) {
    for (const line of d.lines || []) {
      if (line.productId) productIds.add(String(line.productId))
      const gid = godownIdForLine(line, d)
      if (gid) godownIds.add(String(gid))
    }
    if (d.fromGodownId) godownIds.add(String(d.fromGodownId))
  }

  const [products, godowns] = await Promise.all([
    productIds.size ? Product.find({ _id: { $in: [...productIds] } }).lean() : [],
    godownIds.size ? Godown.find({ _id: { $in: [...godownIds] } }).lean() : [],
  ])

  const byProduct = new Map(products.map((p) => [String(p._id), p]))
  const byGodown = new Map(godowns.map((g) => [String(g._id), g]))

  return deliveries.map((d) => {
    const missingByProduct = new Map()
    for (const l of d.billerDamagedLines || []) {
      const pid = String(l.productId)
      missingByProduct.set(pid, (missingByProduct.get(pid) || 0) + (Number(l.qty) || 0))
    }
    const pendingByProduct = new Map()
    for (const l of d.billerPendingReturnLines || []) {
      const pid = String(l.productId)
      pendingByProduct.set(pid, (pendingByProduct.get(pid) || 0) + (Number(l.qty) || 0))
    }

    const linesSummary = (d.lines || []).map((line) => {
      const p = byProduct.get(String(line.productId))
      const gid = godownIdForLine(line, d)
      const g = gid ? byGodown.get(String(gid)) : undefined
      const pid = String(line.productId)
      return {
        productId: pid,
        particulars: p?.particulars || p?.name,
        sku: p?.sku || p?.s_no,
        qty: line.qty,
        godownName: g?.name,
        dispatchedQty: Number(line.dispatchedQty) || 0,
        returnedQty: Number(line.returnedQty) || 0,
        missingQty: missingByProduct.get(pid) || 0,
        pendingQty: pendingByProduct.get(pid) || 0,
      }
    })

    const godownNames = [...new Set(linesSummary.map((l) => l.godownName).filter(Boolean))]
    const productCount = linesSummary.length
    const totalQty = linesSummary.reduce((sum, l) => sum + (Number(l.qty) || 0), 0)

    return {
      godownNames,
      primaryGodownName: godownNames[0] || undefined,
      linesSummary,
      productCount,
      totalQty,
    }
  })
}

module.exports = {
  parseRate,
  godownIdForLine,
  populateLineDetails,
  populateBillerReturnLines,
  enrichListRows,
}