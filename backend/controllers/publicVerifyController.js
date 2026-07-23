const mongoose = require('mongoose')
const Delivery = require('../models/Delivery')
const Product = require('../models/Product')
const User = require('../models/User')
const InventoryLedger = require('../models/InventoryLedger')
const { parseRate, populateLineDetails } = require('../utils/deliveryLineDetails')
const {
  shrinkOrderQtyForImmediateReturns,
  applyLineImmediateShortfall,
} = require('../utils/immediateReturn')

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

  // The person collecting the RETURN isn't necessarily the same person who
  // delivered it, so resolve the return-pickup driver separately (falling
  // back to the delivery driver if a return vehicle hasn't been assigned).
  const returnDriverName = delivery.returnPickupDriverName || driverName
  const returnVehicleLabel = delivery.returnPickupVehicleLabel || vehicleLabel

  return { vehicleLabel, driverName, driverPhone, returnDriverName, returnVehicleLabel }
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
      deliverySignature: delivery.deliverySignature,
      canSubmit: !delivery.deliveryVerifiedAt,
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
    if (delivery.deliveryVerifiedAt)
      return res.status(400).json({
        message: 'This delivery has already been verified. The link can only be used once.',
        alreadyVerified: true,
        deliveryVerifiedAt: delivery.deliveryVerifiedAt,
      })

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

    // Delivered qty defaults to the full dispatched qty for each line, but
    // the recipient can enter fewer than what was dispatched (e.g. 8 of 10)
    // — the shortfall is treated as an immediate on-the-spot return: restock
    // godown, shrink line.qty + dispatchedQty to what was kept, and shrink the
    // linked order. returnedQty stays reserved for the biller return flow.
    const ledgerEntries = []
    const orderDeltaByGodownProduct = new Map()
    for (let idx = 0; idx < deliveryLines.length; idx++) {
      const line = deliveryLines[idx]
      const row = mapped[idx]
      if (!row || String(row.productId) !== String(line.productId)) {
        return res.status(400).json({ message: 'lineChecks must match delivery lines in order' })
      }
      const baseline = Number(line.dispatchedQty) > 0 ? Number(line.dispatchedQty) : Number(line.qty) || 0
      const deliveredQtyRaw = row.qtyAck != null ? Number(row.qtyAck) : baseline
      const deliveredQty = Math.max(
        0,
        Math.min(baseline, Number.isFinite(deliveredQtyRaw) ? deliveredQtyRaw : baseline),
      )
      row.qtyAck = deliveredQty
      applyLineImmediateShortfall(line, deliveredQty, delivery, orderDeltaByGodownProduct, ledgerEntries, {
        refType: 'DeliveryVerify',
        note: `Immediate return at delivery - ${delivery.deliveryNo}`,
      })
    }
    if (ledgerEntries.length > 0) {
      await InventoryLedger.insertMany(ledgerEntries)
    }
    await shrinkOrderQtyForImmediateReturns(delivery.orderId, orderDeltaByGodownProduct)
    delivery.markModified('lines')

    delivery.deliveryVerifierName = String(verifierName).trim()
    delivery.deliveryVerifiedAt = new Date()
    delivery.deliveryLineChecks = mapped
    if (signature && typeof signature === 'string' && signature.startsWith('data:image')) {
      delivery.deliverySignature = signature.slice(0, 500_000)
    }
    delivery.status = 'DELIVERED'
    await delivery.save()

    return res.json({ ok: true, deliveryVerifiedAt: delivery.deliveryVerifiedAt, deliverySignature: delivery.deliverySignature })
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
    const { vehicleLabel, driverName, driverPhone, returnDriverName } = await resolveVehicleInfo(delivery)

    return res.json({
      deliveryNo: delivery.deliveryNo,
      customerName: delivery.customerName,
      siteName: delivery.siteName,
      status: delivery.status,
      challanNo: delivery.challanNo,
      deliveryAt: delivery.deliveryAt,
      vehicleLabel,
      driverName,
      driverPhone,
      returnDriverName,
      lines,
      billerDamagedLines: delivery.billerDamagedLines,
      billerMissingLines: delivery.billerMissingLines,
      billerCollectedLines: delivery.billerCollectedLines,
      damageTotal: delivery.damageTotal,
      missingTotal: delivery.missingTotal,
      billerReturnSubmittedAt: delivery.billerReturnSubmittedAt,
      billerReturnName: delivery.billerReturnName,
      billerSignature: delivery.billerSignature,
      billerPendingReturnLines: delivery.billerPendingReturnLines,
      canSubmit: !delivery.billerReturnSubmittedAt,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed' })
  }
}

// ── Biller Return POST ─────────────────────────────────────────────────────
async function postBillerReturn(req, res) {
  try {
    const token = decodeURIComponent(String(req.params.token || '').trim())
    const { damagedLines, missingLines, collectedLines, returnedByName, signature } = req.body || {}
    if (!token) return res.status(400).json({ message: 'token required' })

    const delivery = await Delivery.findOne({ billerReturnVerifyToken: token })
    if (!delivery) return res.status(404).json({ message: 'Not found' })
    if (delivery.billerReturnSubmittedAt)
      return res.status(400).json({
        message: 'This return report has already been submitted. The link can only be used once.',
        alreadySubmitted: true,
        billerReturnSubmittedAt: delivery.billerReturnSubmittedAt,
      })

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
    // does NOT go back into sellable stock. The biller resubmits the full
    // current total each time (the form pre-fills with what was already
    // reported), so this can simply overwrite — there's no stock side effect.
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

    // Collected qty IS a stock-affecting total, so it needs different
    // handling: the biller resubmits the full current total (e.g. "3 of 5
    // collected so far"), not just what's new this time. If we restocked
    // the full total on every submission, resubmitting the same number
    // would silently re-restock it again and again. So we only ever apply
    // the INCREMENTAL increase over what was already recorded as collected
    // — the difference between this submission's total and the delivery's
    // previously stored total — to the ledger and to each line's returnedQty.
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
      billerCollectedLines.push({
        productId: pid,
        qty,
        note: row.note ? String(row.note).slice(0, 500) : undefined,
      })
      collectedByProduct.set(pid, (collectedByProduct.get(pid) || 0) + qty)
    }

    const prevCollectedByProduct = new Map()
    for (const l of delivery.billerCollectedLines || []) {
      const pid = String(l.productId)
      prevCollectedByProduct.set(pid, (prevCollectedByProduct.get(pid) || 0) + (Number(l.qty) || 0))
    }

    if (collectedByProduct.size > 0) {
      const deltas = new Map()
      for (const [pid, newTotal] of collectedByProduct.entries()) {
        const prevTotal = prevCollectedByProduct.get(pid) || 0
        const delta = Math.max(0, newTotal - prevTotal)
        if (delta > 0) deltas.set(pid, delta)
      }

      const pending = new Map(deltas)
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
    // with the customer.
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

    delivery.billerDamagedLines = billerDamagedLines
    delivery.billerMissingLines = billerMissingLines
    delivery.billerCollectedLines = billerCollectedLines
    delivery.damageTotal = Math.round(damageTotal * 100) / 100
    delivery.missingTotal = Math.round(missingTotal * 100) / 100
    delivery.billerReturnSubmittedAt = new Date()
    delivery.billerPendingReturnLines = billerPendingReturnLines
    if (returnedByName && String(returnedByName).trim()) {
      delivery.billerReturnName = String(returnedByName).trim().slice(0, 200)
    }
    if (signature && typeof signature === 'string' && signature.startsWith('data:image')) {
      delivery.billerSignature = signature.slice(0, 500_000)
    }
    // Only fully COMPLETED when nothing is still outstanding with the
    // customer; otherwise the delivery stays in PENDING_RETURN so it shows
    // up correctly on the "Pending return" tab and the Return Calendar.
    delivery.status = billerPendingReturnLines.length > 0 ? 'PENDING_RETURN' : 'COMPLETED'
    await delivery.save()

    return res.json({
      ok: true,
      damageTotal: delivery.damageTotal,
      missingTotal: delivery.missingTotal,
      billerReturnSubmittedAt: delivery.billerReturnSubmittedAt,
      billerReturnName: delivery.billerReturnName,
      billerSignature: delivery.billerSignature,
      billerPendingReturnLines: delivery.billerPendingReturnLines,
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