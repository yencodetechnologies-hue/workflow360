// const mongoose = require('mongoose')
// const Delivery = require('../models/Delivery')
// const Product = require('../models/Product')
// const User = require('../models/User')
// const InventoryLedger = require('../models/InventoryLedger')
// const { parseRate, populateLineDetails } = require('../utils/deliveryLineDetails')

// function allowedLineProductIds(delivery) {
//   return new Set((delivery.lines || []).map((l) => String(l.productId)))
// }

// // Resolve vehicle/driver info for a delivery, falling back to the assigned
// // delivery user's profile for older records that predate this feature.
// async function resolveVehicleInfo(delivery) {
//   let vehicleLabel = delivery.vehicleLabel || ''
//   let driverName = delivery.driverName || ''
//   let driverPhone = delivery.driverPhone || ''

//   if ((!vehicleLabel || !driverName || !driverPhone) && delivery.assignedDeliveryUserId) {
//     try {
//       const driver = await User.findById(delivery.assignedDeliveryUserId).lean()
//       if (driver) {
//         if (!vehicleLabel && driver.loginId) vehicleLabel = driver.loginId
//         if (!driverName && driver.contactName) driverName = driver.contactName
//         if (!driverPhone && driver.contactPhone) driverPhone = driver.contactPhone
//       }
//     } catch {
//       // ignore lookup errors and fall back to whatever was on the delivery
//     }
//   }

//   return { vehicleLabel, driverName, driverPhone }
// }
// // ── Delivery Verify GET ────────────────────────────────────────────────────
// async function getDeliveryVerify(req, res) {
//   try {
//     const token = decodeURIComponent(String(req.params.token || '').trim())
//     if (!token) return res.status(400).json({ message: 'token required' })

//     const delivery = await Delivery.findOne({ deliveryVerifyToken: token }).lean()
//     if (!delivery) return res.status(404).json({ message: 'Not found' })
// const lines = await populateLineDetails(delivery)
//     const { vehicleLabel, driverName, driverPhone } = await resolveVehicleInfo(delivery)

//     return res.json({
//       deliveryNo: delivery.deliveryNo,
//       customerName: delivery.customerName,
//       siteName: delivery.siteName,
//       status: delivery.status,
//       deliveryAt: delivery.deliveryAt,
//       vehicleLabel,
//       driverName,
//       driverPhone,
//       lines,
//       deliveryVerifierName: delivery.deliveryVerifierName,
//       deliveryVerifiedAt: delivery.deliveryVerifiedAt,
//       deliveryLineChecks: delivery.deliveryLineChecks,
//       hasSignature: Boolean(delivery.deliverySignature),
//       canSubmit: true,
//     })
//   } catch (err) {
//     return res.status(500).json({ message: err.message || 'Failed' })
//   }
// }

// // ── Delivery Verify POST ───────────────────────────────────────────────────
// async function postDeliveryVerify(req, res) {
//   try {
//     const token = decodeURIComponent(String(req.params.token || '').trim())
//     const { verifierName, lineChecks, signature } = req.body || {}
//     if (!token) return res.status(400).json({ message: 'token required' })
//     if (!verifierName || !String(verifierName).trim())
//       return res.status(400).json({ message: 'verifierName required' })

//     const delivery = await Delivery.findOne({ deliveryVerifyToken: token })
//     if (!delivery) return res.status(404).json({ message: 'Not found' })

//     const allowed = allowedLineProductIds(delivery)
//     const checks = Array.isArray(lineChecks) ? lineChecks : []
//     const mapped = []
//     for (const c of checks) {
//       const pid = String(c.productId || '')
//       if (!allowed.has(pid))
//         return res.status(400).json({ message: `Invalid productId in checks: ${pid}` })
//       mapped.push({
//         productId: pid,
//         qtyAck: c.qtyAck != null ? Number(c.qtyAck) : undefined,
//         ok: Boolean(c.ok),
//       })
//     }

//     const deliveryLines = delivery.lines || []
//     if (mapped.length !== deliveryLines.length) {
//       return res.status(400).json({ message: 'All line items must be acknowledged with ok: true' })
//     }
//     for (const row of mapped) {
//       if (!row.ok)
//         return res.status(400).json({ message: 'All line items must be acknowledged with ok: true' })
//     }

//     delivery.deliveryVerifierName = String(verifierName).trim()
//     delivery.deliveryVerifiedAt = new Date()
//     delivery.deliveryLineChecks = mapped
//     if (signature && typeof signature === 'string' && signature.startsWith('data:image')) {
//       delivery.deliverySignature = signature.slice(0, 500_000)
//     }
//     delivery.status = 'DELIVERED'
//     await delivery.save()

//     return res.json({ ok: true, deliveryVerifiedAt: delivery.deliveryVerifiedAt })
//   } catch (err) {
//     return res.status(500).json({ message: err.message || 'Failed' })
//   }
// }

// // ── Biller Return GET ──────────────────────────────────────────────────────
// async function getBillerReturn(req, res) {
//   try {
//     const token = decodeURIComponent(String(req.params.token || '').trim())
//     if (!token) return res.status(400).json({ message: 'token required' })

//     const delivery = await Delivery.findOne({ billerReturnVerifyToken: token }).lean()
//     if (!delivery) return res.status(404).json({ message: 'Not found' })

// const lines = await populateLineDetails(delivery)
//     const { vehicleLabel, driverName, driverPhone } = await resolveVehicleInfo(delivery)

//     return res.json({
//       deliveryNo: delivery.deliveryNo,
//       customerName: delivery.customerName,
//       siteName: delivery.siteName,
//       status: delivery.status,
//       challanNo: delivery.challanNo,
//       vehicleLabel,
//       driverName,
//       driverPhone,
//       lines,
//       billerDamagedLines: delivery.billerDamagedLines,
//       billerMissingLines: delivery.billerMissingLines,
//       billerCollectedLines: delivery.billerCollectedLines,
//       damageTotal: delivery.damageTotal,
//       missingTotal: delivery.missingTotal,
//       billerReturnSubmittedAt: delivery.billerReturnSubmittedAt,
//       billerPendingReturnLines: delivery.billerPendingReturnLines,
//       billerPendingReturnAt: delivery.billerPendingReturnAt,
//       billerPendingReturnSlot: delivery.billerPendingReturnSlot,
//       billerPendingReturnNote: delivery.billerPendingReturnNote,
//       canSubmit: true,
//     })
//   } catch (err) {
//     return res.status(500).json({ message: err.message || 'Failed' })
//   }
// }

// // ── Biller Return POST ─────────────────────────────────────────────────────
// const PENDING_SLOT_HOURS = { MORNING: 9, AFTERNOON: 14, EVENING: 18 }

// async function postBillerReturn(req, res) {
//   try {
//     const token = decodeURIComponent(String(req.params.token || '').trim())
//     const {
//       damagedLines,
//       missingLines,
//       collectedLines,
//       pendingReturnDate,
//       pendingReturnSlot,
//       pendingReturnNote,
//     } = req.body || {}
//     if (!token) return res.status(400).json({ message: 'token required' })

//     const delivery = await Delivery.findOne({ billerReturnVerifyToken: token })
//     if (!delivery) return res.status(404).json({ message: 'Not found' })

//     const allowed = allowedLineProductIds(delivery)
//     const qtyByProduct = new Map()
//     for (const line of delivery.lines || []) {
//       const id = String(line.productId)
//       qtyByProduct.set(id, (qtyByProduct.get(id) || 0) + Number(line.qty))
//     }

//     const dmgIn = Array.isArray(damagedLines) ? damagedLines : []
//     const missIn = Array.isArray(missingLines) ? missingLines : []
//     const collectedIn = Array.isArray(collectedLines) ? collectedLines : []

//     // Damage/missing qty is a write-off — it's reported for accounting but
//     // does NOT go back into sellable stock.
//     const billerDamagedLines = []
//     let damageTotal = 0
//     for (const row of dmgIn) {
//       const pid = String(row.productId || '')
//       if (!allowed.has(pid))
//         return res.status(400).json({ message: `Invalid productId: ${pid}` })
//       const qty = Math.max(0, Number(row.qty) || 0)
//       const maxQ = qtyByProduct.get(pid) || 0
//       if (qty > maxQ)
//         return res.status(400).json({ message: `Damaged qty exceeds dispatched for product ${pid}` })
//       const p = await Product.findById(pid).lean()
//       const rate = parseRate(p?.rate)
//       damageTotal += rate * qty
//       billerDamagedLines.push({
//         productId: pid,
//         qty,
//         note: row.note ? String(row.note).slice(0, 500) : undefined,
//       })
//     }

//     const billerMissingLines = []
//     let missingTotal = 0
//     for (const row of missIn) {
//       const pid = String(row.productId || '')
//       if (!allowed.has(pid))
//         return res.status(400).json({ message: `Invalid productId: ${pid}` })
//       const qty = Math.max(0, Number(row.qty) || 0)
//       const p = await Product.findById(pid).lean()
//       const rate = parseRate(p?.rate)
//       missingTotal += rate * qty
//       billerMissingLines.push({
//         productId: pid,
//         qty,
//         note: row.note ? String(row.note).slice(0, 500) : undefined,
//       })
//     }

//     // Collected qty is physically back in hand right now — this restocks the
//     // godown and updates each line's returnedQty, same as the driver-side
//     // scan-return flow, so it shows up in "Products by godown" (RETURNED /
//     // IN STOCK) immediately.
//     const billerCollectedLines = []
//     const collectedByProduct = new Map()
//     for (const row of collectedIn) {
//       const pid = String(row.productId || '')
//       if (!allowed.has(pid))
//         return res.status(400).json({ message: `Invalid productId: ${pid}` })
//       const qty = Math.max(0, Number(row.qty) || 0)
//       if (qty <= 0) continue
//       const alreadyReportedDamage = billerDamagedLines
//         .filter((l) => l.productId === pid)
//         .reduce((s, l) => s + l.qty, 0)
//       const maxQ = (qtyByProduct.get(pid) || 0) - alreadyReportedDamage
//       if (qty > maxQ)
//         return res.status(400).json({ message: `Collected qty exceeds dispatched for product ${pid}` })
//       billerCollectedLines.push({ productId: pid, qty })
//       collectedByProduct.set(pid, (collectedByProduct.get(pid) || 0) + qty)
//     }

//     if (collectedByProduct.size > 0) {
//       const pending = new Map(collectedByProduct)
//       const ledgerEntries = []
//       for (const line of delivery.lines || []) {
//         const pid = String(line.productId)
//         const delta = pending.get(pid)
//         if (!delta) continue
//         const dispatched = Number(line.dispatchedQty) || 0
//         const alreadyReturned = Number(line.returnedQty) || 0
//         const applyQty = Math.min(delta, Math.max(0, dispatched - alreadyReturned))
//         if (applyQty <= 0) { pending.delete(pid); continue }
//         line.returnedQty = alreadyReturned + applyQty
//         const gid = line.godownId || delivery.fromGodownId
//         if (gid) {
//           ledgerEntries.push({
//             godownId: new mongoose.Types.ObjectId(String(gid)),
//             productId: new mongoose.Types.ObjectId(String(pid)),
//             qtyDelta: +applyQty,
//             reason: 'RETURN',
//             refType: 'BillerReturn',
//             refId: String(delivery._id),
//             note: `Collected from biller & restocked - ${delivery.deliveryNo}`,
//           })
//         }
//         const remaining = delta - applyQty
//         if (remaining > 0) pending.set(pid, remaining)
//         else pending.delete(pid)
//       }
//       if (ledgerEntries.length > 0) {
//         await InventoryLedger.insertMany(ledgerEntries)
//       }
//     }

//     // Whatever wasn't reported as damaged or collected is still outstanding
//     // with the customer. If anything remains, the biller must schedule when
//     // it will be returned (a date plus a rough time-of-day slot).
//     const reportedByProduct = new Map()
//     for (const l of billerDamagedLines) {
//       reportedByProduct.set(l.productId, (reportedByProduct.get(l.productId) || 0) + l.qty)
//     }
//     for (const l of billerCollectedLines) {
//       reportedByProduct.set(l.productId, (reportedByProduct.get(l.productId) || 0) + l.qty)
//     }

//     const billerPendingReturnLines = []
//     for (const [pid, dispatchedQty] of qtyByProduct.entries()) {
//       const reported = reportedByProduct.get(pid) || 0
//       const remaining = Math.max(0, dispatchedQty - reported)
//       if (remaining > 0) {
//         billerPendingReturnLines.push({ productId: pid, qty: remaining })
//       }
//     }

//     let pendingReturnAtDate
//     let slot
//     if (billerPendingReturnLines.length > 0) {
//       if (!pendingReturnDate) {
//         return res.status(400).json({
//           message: 'Please choose a date for when the remaining pending items will be returned.',
//         })
//       }
//       slot = ['MORNING', 'AFTERNOON', 'EVENING'].includes(pendingReturnSlot) ? pendingReturnSlot : undefined
//       if (!slot) {
//         return res.status(400).json({
//           message: 'Please choose morning, afternoon, or evening for the pending return.',
//         })
//       }
//       pendingReturnAtDate = new Date(pendingReturnDate)
//       if (Number.isNaN(pendingReturnAtDate.getTime())) {
//         return res.status(400).json({ message: 'Invalid pending return date' })
//       }
//       pendingReturnAtDate.setHours(PENDING_SLOT_HOURS[slot], 0, 0, 0)
//     }

//     delivery.billerDamagedLines = billerDamagedLines
//     delivery.billerMissingLines = billerMissingLines
//     delivery.billerCollectedLines = billerCollectedLines
//     delivery.damageTotal = Math.round(damageTotal * 100) / 100
//     delivery.missingTotal = Math.round(missingTotal * 100) / 100
//     delivery.billerReturnSubmittedAt = new Date()
//     delivery.billerPendingReturnLines = billerPendingReturnLines
//     delivery.billerPendingReturnAt = pendingReturnAtDate || undefined
//     delivery.billerPendingReturnSlot = slot || undefined
//     delivery.billerPendingReturnNote = pendingReturnNote ? String(pendingReturnNote).slice(0, 500) : undefined
//     // Only fully COMPLETED when nothing is still outstanding with the
//     // customer. If items are still pending (scheduled for later pickup),
//     // the delivery stays in PENDING_RETURN so it correctly shows up under
//     // the "Pending return" tab and on the Return Calendar with its real
//     // outstanding count — it previously always jumped to COMPLETED here
//     // even with items still pending, which made the return calendar/list
//     // show contradictory "Completed" + large pending counts.
//     delivery.status = billerPendingReturnLines.length > 0 ? 'PENDING_RETURN' : 'COMPLETED'
//     await delivery.save()

//     return res.json({
//       ok: true,
//       damageTotal: delivery.damageTotal,
//       missingTotal: delivery.missingTotal,
//       billerReturnSubmittedAt: delivery.billerReturnSubmittedAt,
//       billerPendingReturnLines: delivery.billerPendingReturnLines,
//       billerPendingReturnAt: delivery.billerPendingReturnAt,
//       billerPendingReturnSlot: delivery.billerPendingReturnSlot,
//     })
//   } catch (err) {
//     return res.status(500).json({ message: err.message || 'Failed' })
//   }
// }

// module.exports = {
//   getDeliveryVerify,
//   postDeliveryVerify,
//   getBillerReturn,
//   postBillerReturn,
// }

const mongoose = require('mongoose')
const Delivery = require('../models/Delivery')
const Product = require('../models/Product')
const User = require('../models/User')
const InventoryLedger = require('../models/InventoryLedger')
const { parseRate, populateLineDetails } = require('../utils/deliveryLineDetails')

function allowedLineProductIds(delivery) {
  return new Set((delivery.lines || []).map((l) => String(l.productId)))
}

// Resolve vehicle/driver info for a delivery, falling back to the assigned
// delivery user's profile for older records that predate this feature.
async function resolveVehicleInfo(delivery) {
  let vehicleLabel = delivery.vehicleLabel || ''
  let driverName = delivery.driverName || ''
  let driverPhone = delivery.driverPhone || ''

  if ((!vehicleLabel || !driverName || !driverPhone) && delivery.assignedDeliveryUserId) {
    try {
      const driver = await User.findById(delivery.assignedDeliveryUserId).lean()
      if (driver) {
        if (!vehicleLabel && driver.loginId) vehicleLabel = driver.loginId
        if (!driverName && driver.contactName) driverName = driver.contactName
        if (!driverPhone && driver.contactPhone) driverPhone = driver.contactPhone
      }
    } catch {
      // ignore lookup errors and fall back to whatever was on the delivery
    }
  }

  return { vehicleLabel, driverName, driverPhone }
}
// ── Delivery Verify GET ────────────────────────────────────────────────────
async function getDeliveryVerify(req, res) {
  try {
    const token = decodeURIComponent(String(req.params.token || '').trim())
    if (!token) return res.status(400).json({ message: 'token required' })

    const delivery = await Delivery.findOne({ deliveryVerifyToken: token }).lean()
    if (!delivery) return res.status(404).json({ message: 'Not found' })
const lines = await populateLineDetails(delivery)
    const { vehicleLabel, driverName, driverPhone } = await resolveVehicleInfo(delivery)

    return res.json({
      deliveryNo: delivery.deliveryNo,
      customerName: delivery.customerName,
      siteName: delivery.siteName,
      status: delivery.status,
      deliveryAt: delivery.deliveryAt,
      vehicleLabel,
      driverName,
      driverPhone,
      lines,
      deliveryVerifierName: delivery.deliveryVerifierName,
      deliveryVerifiedAt: delivery.deliveryVerifiedAt,
      deliveryLineChecks: delivery.deliveryLineChecks,
      hasSignature: Boolean(delivery.deliverySignature),
      billingType: delivery.billingType,
      invoiceNo: delivery.invoiceNo,
      invoiceAmount: delivery.invoiceAmount,
      billedAt: delivery.billedAt,
      canSubmit: true,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed' })
  }
}

// ── Delivery Verify POST ───────────────────────────────────────────────────
async function postDeliveryVerify(req, res) {
  try {
    const token = decodeURIComponent(String(req.params.token || '').trim())
    const { verifierName, lineChecks, signature } = req.body || {}
    if (!token) return res.status(400).json({ message: 'token required' })
    if (!verifierName || !String(verifierName).trim())
      return res.status(400).json({ message: 'verifierName required' })

    const delivery = await Delivery.findOne({ deliveryVerifyToken: token })
    if (!delivery) return res.status(404).json({ message: 'Not found' })

    const allowed = allowedLineProductIds(delivery)
    const checks = Array.isArray(lineChecks) ? lineChecks : []
    const mapped = []
    for (const c of checks) {
      const pid = String(c.productId || '')
      if (!allowed.has(pid))
        return res.status(400).json({ message: `Invalid productId in checks: ${pid}` })
      mapped.push({
        productId: pid,
        qtyAck: c.qtyAck != null ? Number(c.qtyAck) : undefined,
        ok: Boolean(c.ok),
      })
    }

    const deliveryLines = delivery.lines || []
    if (mapped.length !== deliveryLines.length) {
      return res.status(400).json({ message: 'All line items must be acknowledged with ok: true' })
    }
    for (const row of mapped) {
      if (!row.ok)
        return res.status(400).json({ message: 'All line items must be acknowledged with ok: true' })
    }

    delivery.deliveryVerifierName = String(verifierName).trim()
    delivery.deliveryVerifiedAt = new Date()
    delivery.deliveryLineChecks = mapped
    if (signature && typeof signature === 'string' && signature.startsWith('data:image')) {
      delivery.deliverySignature = signature.slice(0, 500_000)
    }
    delivery.status = 'DELIVERED'
    await delivery.save()

    return res.json({ ok: true, deliveryVerifiedAt: delivery.deliveryVerifiedAt })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed' })
  }
}

// ── Biller Return GET ──────────────────────────────────────────────────────
async function getBillerReturn(req, res) {
  try {
    const token = decodeURIComponent(String(req.params.token || '').trim())
    if (!token) return res.status(400).json({ message: 'token required' })

    const delivery = await Delivery.findOne({ billerReturnVerifyToken: token }).lean()
    if (!delivery) return res.status(404).json({ message: 'Not found' })

const lines = await populateLineDetails(delivery)
    const { vehicleLabel, driverName, driverPhone } = await resolveVehicleInfo(delivery)

    return res.json({
      deliveryNo: delivery.deliveryNo,
      customerName: delivery.customerName,
      siteName: delivery.siteName,
      status: delivery.status,
      challanNo: delivery.challanNo,
      vehicleLabel,
      driverName,
      driverPhone,
      lines,
      billerDamagedLines: delivery.billerDamagedLines,
      billerMissingLines: delivery.billerMissingLines,
      billerCollectedLines: delivery.billerCollectedLines,
      damageTotal: delivery.damageTotal,
      missingTotal: delivery.missingTotal,
      billerReturnSubmittedAt: delivery.billerReturnSubmittedAt,
      billerPendingReturnLines: delivery.billerPendingReturnLines,
      billerPendingReturnAt: delivery.billerPendingReturnAt,
      billerPendingReturnSlot: delivery.billerPendingReturnSlot,
      billerPendingReturnNote: delivery.billerPendingReturnNote,
      billingType: delivery.billingType,
      invoiceNo: delivery.invoiceNo,
      invoiceAmount: delivery.invoiceAmount,
      billedAt: delivery.billedAt,
      canSubmit: true,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed' })
  }
}

// ── Biller Return POST ─────────────────────────────────────────────────────
const PENDING_SLOT_HOURS = { MORNING: 9, AFTERNOON: 14, EVENING: 18 }

async function postBillerReturn(req, res) {
  try {
    const token = decodeURIComponent(String(req.params.token || '').trim())
    const {
      damagedLines,
      missingLines,
      collectedLines,
      pendingReturnDate,
      pendingReturnSlot,
      pendingReturnNote,
    } = req.body || {}
    if (!token) return res.status(400).json({ message: 'token required' })

    const delivery = await Delivery.findOne({ billerReturnVerifyToken: token })
    if (!delivery) return res.status(404).json({ message: 'Not found' })

    const allowed = allowedLineProductIds(delivery)
    const qtyByProduct = new Map()
    for (const line of delivery.lines || []) {
      const id = String(line.productId)
      qtyByProduct.set(id, (qtyByProduct.get(id) || 0) + Number(line.qty))
    }

    const dmgIn = Array.isArray(damagedLines) ? damagedLines : []
    const missIn = Array.isArray(missingLines) ? missingLines : []
    const collectedIn = Array.isArray(collectedLines) ? collectedLines : []

    // Damage/missing qty is a write-off — it's reported for accounting but
    // does NOT go back into sellable stock.
    const billerDamagedLines = []
    let damageTotal = 0
    for (const row of dmgIn) {
      const pid = String(row.productId || '')
      if (!allowed.has(pid))
        return res.status(400).json({ message: `Invalid productId: ${pid}` })
      const qty = Math.max(0, Number(row.qty) || 0)
      const maxQ = qtyByProduct.get(pid) || 0
      if (qty > maxQ)
        return res.status(400).json({ message: `Damaged qty exceeds dispatched for product ${pid}` })
      const p = await Product.findById(pid).lean()
      const rate = parseRate(p?.rate)
      damageTotal += rate * qty
      billerDamagedLines.push({
        productId: pid,
        qty,
        note: row.note ? String(row.note).slice(0, 500) : undefined,
      })
    }

    const billerMissingLines = []
    let missingTotal = 0
    for (const row of missIn) {
      const pid = String(row.productId || '')
      if (!allowed.has(pid))
        return res.status(400).json({ message: `Invalid productId: ${pid}` })
      const qty = Math.max(0, Number(row.qty) || 0)
      const p = await Product.findById(pid).lean()
      const rate = parseRate(p?.rate)
      missingTotal += rate * qty
      billerMissingLines.push({
        productId: pid,
        qty,
        note: row.note ? String(row.note).slice(0, 500) : undefined,
      })
    }

    // Collected qty is physically back in hand right now — this restocks the
    // godown and updates each line's returnedQty, same as the driver-side
    // scan-return flow, so it shows up in "Products by godown" (RETURNED /
    // IN STOCK) immediately.
    const billerCollectedLines = []
    const collectedByProduct = new Map()
    for (const row of collectedIn) {
      const pid = String(row.productId || '')
      if (!allowed.has(pid))
        return res.status(400).json({ message: `Invalid productId: ${pid}` })
      const qty = Math.max(0, Number(row.qty) || 0)
      if (qty <= 0) continue
      const alreadyReportedDamage = billerDamagedLines
        .filter((l) => l.productId === pid)
        .reduce((s, l) => s + l.qty, 0)
      const maxQ = (qtyByProduct.get(pid) || 0) - alreadyReportedDamage
      if (qty > maxQ)
        return res.status(400).json({ message: `Collected qty exceeds dispatched for product ${pid}` })
      billerCollectedLines.push({ productId: pid, qty })
      collectedByProduct.set(pid, (collectedByProduct.get(pid) || 0) + qty)
    }

    if (collectedByProduct.size > 0) {
      const pending = new Map(collectedByProduct)
      const ledgerEntries = []
      for (const line of delivery.lines || []) {
        const pid = String(line.productId)
        const delta = pending.get(pid)
        if (!delta) continue
        const dispatched = Number(line.dispatchedQty) || 0
        const alreadyReturned = Number(line.returnedQty) || 0
        const applyQty = Math.min(delta, Math.max(0, dispatched - alreadyReturned))
        if (applyQty <= 0) { pending.delete(pid); continue }
        line.returnedQty = alreadyReturned + applyQty
        const gid = line.godownId || delivery.fromGodownId
        if (gid) {
          ledgerEntries.push({
            godownId: new mongoose.Types.ObjectId(String(gid)),
            productId: new mongoose.Types.ObjectId(String(pid)),
            qtyDelta: +applyQty,
            reason: 'RETURN',
            refType: 'BillerReturn',
            refId: String(delivery._id),
            note: `Collected from biller & restocked - ${delivery.deliveryNo}`,
          })
        }
        const remaining = delta - applyQty
        if (remaining > 0) pending.set(pid, remaining)
        else pending.delete(pid)
      }
      if (ledgerEntries.length > 0) {
        await InventoryLedger.insertMany(ledgerEntries)
      }
    }

    // Whatever wasn't reported as damaged or collected is still outstanding
    // with the customer. If anything remains, the biller must schedule when
    // it will be returned (a date plus a rough time-of-day slot).
    const reportedByProduct = new Map()
    for (const l of billerDamagedLines) {
      reportedByProduct.set(l.productId, (reportedByProduct.get(l.productId) || 0) + l.qty)
    }
    for (const l of billerCollectedLines) {
      reportedByProduct.set(l.productId, (reportedByProduct.get(l.productId) || 0) + l.qty)
    }

    const billerPendingReturnLines = []
    for (const [pid, dispatchedQty] of qtyByProduct.entries()) {
      const reported = reportedByProduct.get(pid) || 0
      const remaining = Math.max(0, dispatchedQty - reported)
      if (remaining > 0) {
        billerPendingReturnLines.push({ productId: pid, qty: remaining })
      }
    }

    let pendingReturnAtDate
    let slot
    if (billerPendingReturnLines.length > 0) {
      if (!pendingReturnDate) {
        return res.status(400).json({
          message: 'Please choose a date for when the remaining pending items will be returned.',
        })
      }
      slot = ['MORNING', 'AFTERNOON', 'EVENING'].includes(pendingReturnSlot) ? pendingReturnSlot : undefined
      if (!slot) {
        return res.status(400).json({
          message: 'Please choose morning, afternoon, or evening for the pending return.',
        })
      }
      pendingReturnAtDate = new Date(pendingReturnDate)
      if (Number.isNaN(pendingReturnAtDate.getTime())) {
        return res.status(400).json({ message: 'Invalid pending return date' })
      }
      pendingReturnAtDate.setHours(PENDING_SLOT_HOURS[slot], 0, 0, 0)
    }

    delivery.billerDamagedLines = billerDamagedLines
    delivery.billerMissingLines = billerMissingLines
    delivery.billerCollectedLines = billerCollectedLines
    delivery.damageTotal = Math.round(damageTotal * 100) / 100
    delivery.missingTotal = Math.round(missingTotal * 100) / 100
    delivery.billerReturnSubmittedAt = new Date()
    delivery.billerPendingReturnLines = billerPendingReturnLines
    delivery.billerPendingReturnAt = pendingReturnAtDate || undefined
    delivery.billerPendingReturnSlot = slot || undefined
    delivery.billerPendingReturnNote = pendingReturnNote ? String(pendingReturnNote).slice(0, 500) : undefined
    // Only fully COMPLETED when nothing is still outstanding with the
    // customer. If items are still pending (scheduled for later pickup),
    // the delivery stays in PENDING_RETURN so it correctly shows up under
    // the "Pending return" tab and on the Return Calendar with its real
    // outstanding count — it previously always jumped to COMPLETED here
    // even with items still pending, which made the return calendar/list
    // show contradictory "Completed" + large pending counts.
    delivery.status = billerPendingReturnLines.length > 0 ? 'PENDING_RETURN' : 'COMPLETED'
    await delivery.save()

    return res.json({
      ok: true,
      damageTotal: delivery.damageTotal,
      missingTotal: delivery.missingTotal,
      billerReturnSubmittedAt: delivery.billerReturnSubmittedAt,
      billerPendingReturnLines: delivery.billerPendingReturnLines,
      billerPendingReturnAt: delivery.billerPendingReturnAt,
      billerPendingReturnSlot: delivery.billerPendingReturnSlot,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed' })
  }
}

module.exports = {
  getDeliveryVerify,
  postDeliveryVerify,
  getBillerReturn,
  postBillerReturn,
}