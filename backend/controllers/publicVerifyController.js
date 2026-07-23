const mongoose = require('mongoose')
const Delivery = require('../models/Delivery')
const Product = require('../models/Product')
const User = require('../models/User')
const InventoryLedger = require('../models/InventoryLedger')
const { parseRate, populateLineDetails, populateBillerReturnLines } = require('../utils/deliveryLineDetails')
const {
  shrinkOrderQtyForImmediateReturns,
  applyLineImmediateShortfall,
} = require('../utils/immediateReturn')

function allowedLineProductIds(delivery) {
  return new Set((delivery.lines || []).map((l) => String(l.productId)))
}

/** Dispatched qty per product from delivery lines. */
function dispatchedQtyByProduct(delivery) {
  const map = new Map()
  for (const line of delivery.lines || []) {
    const pid = String(line.productId)
    const dispatched = Number(line.dispatchedQty) > 0 ? Number(line.dispatchedQty) : Number(line.qty) || 0
    map.set(pid, (map.get(pid) || 0) + dispatched)
  }
  return map
}

/** Qty still outstanding with the customer (pending return), per product. */
function outstandingPendingByProduct(delivery) {
  const pendingStored = delivery.billerPendingReturnLines || []
  if (pendingStored.some((l) => (Number(l.qty) || 0) > 0)) {
    const map = new Map()
    for (const l of pendingStored) {
      const qty = Math.max(0, Number(l.qty) || 0)
      if (qty <= 0) continue
      const pid = String(l.productId)
      map.set(pid, (map.get(pid) || 0) + qty)
    }
    return map
  }

  const reported = new Map()
  for (const l of [...(delivery.billerDamagedLines || []), ...(delivery.billerCollectedLines || [])]) {
    const pid = String(l.productId)
    reported.set(pid, (reported.get(pid) || 0) + (Number(l.qty) || 0))
  }

  const map = new Map()
  for (const [pid, dispatched] of dispatchedQtyByProduct(delivery).entries()) {
    // Prefer line.returnedQty when biller has not recorded pending lines
    // (e.g. godown confirm-return path) — still with client ≈ dispatched − returned.
    const lineReturned = (delivery.lines || [])
      .filter((l) => String(l.productId) === pid)
      .reduce((s, l) => s + (Number(l.returnedQty) || 0), 0)
    const reportedQty = reported.get(pid) || 0
    const remaining = Math.max(0, dispatched - Math.max(reportedQty, lineReturned))
    if (remaining > 0) map.set(pid, remaining)
  }
  return map
}

function totalOutstandingPending(delivery) {
  let n = 0
  for (const qty of outstandingPendingByProduct(delivery).values()) n += qty
  return n
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
async function buildBillerReturnGetResponse(delivery, { forcePendingOnly = false } = {}) {
  const allLines = await populateLineDetails(delivery)
  const pendingByProduct = outstandingPendingByProduct(delivery)
  const pendingTotal = totalOutstandingPending(delivery)
  const returnableStatuses = ['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN']
  const canSubmit =
    returnableStatuses.includes(delivery.status) &&
    (pendingTotal > 0 || !delivery.billerReturnSubmittedAt || forcePendingOnly)

  // When there are outstanding pending products, the public form should only
  // list those — pending-return-assign link always forces this filter.
  let lines = allLines
  let pendingResubmit = false
  const shouldFilterPending =
    forcePendingOnly ||
    (pendingTotal > 0 &&
      (delivery.billerReturnSubmittedAt ||
        delivery.status === 'PENDING_RETURN' ||
        delivery.status === 'RETURN_PICKUP'))

  if (shouldFilterPending && pendingTotal > 0) {
    pendingResubmit = true
    const byProduct = new Map(allLines.map((l) => [String(l.productId), l]))
    lines = []
    for (const [pid, qty] of pendingByProduct.entries()) {
      const base = byProduct.get(pid)
      if (!base) {
        lines.push({ productId: pid, qty, dispatchedQty: qty, returnedQty: 0 })
        continue
      }
      lines.push({
        ...base,
        qty,
        dispatchedQty: qty,
      })
    }
  }

  const [billerPendingReturnLines, pendingReturnCollectedLines] = await Promise.all([
    populateBillerReturnLines(
      [...pendingByProduct.entries()].map(([productId, qty]) => ({ productId, qty })),
    ),
    populateBillerReturnLines(delivery.pendingReturnCollectedLines),
  ])

  const { vehicleLabel, driverName, driverPhone, returnDriverName } = await resolveVehicleInfo(delivery)

  return {
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
    allLines,
    pendingResubmit,
    linkKind: forcePendingOnly ? 'pendingReturnAssign' : 'billerReturn',
    billerDamagedLines: delivery.billerDamagedLines,
    billerMissingLines: delivery.billerMissingLines,
    billerCollectedLines: delivery.billerCollectedLines,
    damageTotal: delivery.damageTotal,
    missingTotal: delivery.missingTotal,
    billerReturnSubmittedAt: delivery.billerReturnSubmittedAt,
    billerReturnName: delivery.billerReturnName,
    billerSignature: delivery.billerSignature,
    billerPendingReturnLines,
    pendingReturnCollectedLines,
    pendingReturnCollectedAt: delivery.pendingReturnCollectedAt,
    pendingReturnCollectedName: delivery.pendingReturnCollectedName,
    pendingReturnSignature: delivery.pendingReturnSignature,
    canSubmit: forcePendingOnly
      ? returnableStatuses.includes(delivery.status) && pendingTotal > 0
      : canSubmit,
    pendingTotal,
  }
}

async function getBillerReturn(req, res) {
  try {
    const token = decodeURIComponent(String(req.params.token || '').trim())
    if (!token) return res.status(400).json({ message: 'token required' })

    const delivery = await Delivery.findOne({ billerReturnVerifyToken: token }).lean()
    if (!delivery) return res.status(404).json({ message: 'Not found' })

    return res.json(await buildBillerReturnGetResponse(delivery, { forcePendingOnly: false }))
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed' })
  }
}

async function getPendingReturnAssign(req, res) {
  try {
    const token = decodeURIComponent(String(req.params.token || '').trim())
    if (!token) return res.status(400).json({ message: 'token required' })

    const delivery = await Delivery.findOne({ pendingReturnAssignVerifyToken: token }).lean()
    if (!delivery) return res.status(404).json({ message: 'Not found' })

    return res.json(await buildBillerReturnGetResponse(delivery, { forcePendingOnly: true }))
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed' })
  }
}

// ── Biller Return POST ─────────────────────────────────────────────────────
async function postBillerReturn(req, res) {
  return postReturnByToken(req, res, 'billerReturnVerifyToken')
}

async function postPendingReturnAssign(req, res) {
  return postReturnByToken(req, res, 'pendingReturnAssignVerifyToken')
}

async function postReturnByToken(req, res, tokenField) {
  try {
    const token = decodeURIComponent(String(req.params.token || '').trim())
    const { damagedLines, missingLines, collectedLines, returnedByName, signature } = req.body || {}
    if (!token) return res.status(400).json({ message: 'token required' })

    const delivery = await Delivery.findOne({ [tokenField]: token })
    if (!delivery) return res.status(404).json({ message: 'Not found' })

    const outstandingBefore = outstandingPendingByProduct(delivery)
    const outstandingTotal = totalOutstandingPending(delivery)
    const isPendingResubmit =
      Boolean(delivery.billerReturnSubmittedAt) ||
      delivery.status === 'PENDING_RETURN' ||
      tokenField === 'pendingReturnAssignVerifyToken'

    if (delivery.billerReturnSubmittedAt && outstandingTotal <= 0) {
      return res.status(400).json({
        message: 'This return report has already been submitted. The link can only be used once.',
        alreadySubmitted: true,
        billerReturnSubmittedAt: delivery.billerReturnSubmittedAt,
      })
    }

    if (!['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN'].includes(delivery.status)) {
      return res.status(409).json({ message: 'Cannot submit return in current status' })
    }

    const allowed = allowedLineProductIds(delivery)
    const qtyByProduct = dispatchedQtyByProduct(delivery)
    // Pending-product resubmit validates against outstanding qty, not full dispatch.
    const maxByProduct = isPendingResubmit && outstandingTotal > 0 ? outstandingBefore : qtyByProduct

    const dmgIn = Array.isArray(damagedLines) ? damagedLines : []
    const missIn = Array.isArray(missingLines) ? missingLines : []
    const collectedIn = Array.isArray(collectedLines) ? collectedLines : []

    const prevDamagedByProduct = new Map()
    for (const l of delivery.billerDamagedLines || []) {
      const pid = String(l.productId)
      prevDamagedByProduct.set(pid, (prevDamagedByProduct.get(pid) || 0) + (Number(l.qty) || 0))
    }

    const batchDamagedByProduct = new Map()
    for (const row of dmgIn) {
      const pid = String(row.productId || '')
      if (!allowed.has(pid))
        return res.status(400).json({ message: `Invalid productId: ${pid}` })
      const qty = Math.max(0, Number(row.qty) || 0)
      if (qty <= 0) continue
      const maxQ = maxByProduct.get(pid) || 0
      if (qty > maxQ)
        return res.status(400).json({ message: `Damaged qty exceeds outstanding for product ${pid}` })
      batchDamagedByProduct.set(pid, (batchDamagedByProduct.get(pid) || 0) + qty)
    }

    const finalDamagedByProduct = new Map(isPendingResubmit ? prevDamagedByProduct : new Map())
    for (const [pid, qty] of batchDamagedByProduct.entries()) {
      finalDamagedByProduct.set(pid, (finalDamagedByProduct.get(pid) || 0) + qty)
    }

    const billerDamagedLines = []
    let damageTotal = 0
    for (const [pid, qty] of finalDamagedByProduct.entries()) {
      if (qty <= 0) continue
      const p = await Product.findById(pid).lean()
      const rate = parseRate(p?.rate)
      damageTotal += rate * qty
      const noteFromBatch = dmgIn.find((r) => String(r.productId) === pid)?.note
      const prevNote = (delivery.billerDamagedLines || []).find((l) => String(l.productId) === pid)?.note
      billerDamagedLines.push({
        productId: pid,
        qty,
        note: noteFromBatch ? String(noteFromBatch).slice(0, 500) : prevNote,
      })
    }

    const billerMissingLines = []
    let missingTotal = 0
    if (isPendingResubmit) {
      for (const l of delivery.billerMissingLines || []) {
        billerMissingLines.push({
          productId: String(l.productId),
          qty: Number(l.qty) || 0,
          note: l.note,
        })
        const p = await Product.findById(l.productId).lean()
        missingTotal += parseRate(p?.rate) * (Number(l.qty) || 0)
      }
    }
    for (const row of missIn) {
      const pid = String(row.productId || '')
      if (!allowed.has(pid))
        return res.status(400).json({ message: `Invalid productId: ${pid}` })
      const qty = Math.max(0, Number(row.qty) || 0)
      if (qty <= 0) continue
      const p = await Product.findById(pid).lean()
      const rate = parseRate(p?.rate)
      missingTotal += rate * qty
      const existing = billerMissingLines.find((l) => l.productId === pid)
      if (existing) {
        existing.qty += qty
        if (row.note) existing.note = String(row.note).slice(0, 500)
      } else {
        billerMissingLines.push({
          productId: pid,
          qty,
          note: row.note ? String(row.note).slice(0, 500) : undefined,
        })
      }
    }

    const prevCollectedByProduct = new Map()
    for (const l of delivery.billerCollectedLines || []) {
      const pid = String(l.productId)
      prevCollectedByProduct.set(pid, (prevCollectedByProduct.get(pid) || 0) + (Number(l.qty) || 0))
    }

    const batchCollectedByProduct = new Map()
    for (const row of collectedIn) {
      const pid = String(row.productId || '')
      if (!allowed.has(pid))
        return res.status(400).json({ message: `Invalid productId: ${pid}` })
      const qty = Math.max(0, Number(row.qty) || 0)
      if (qty <= 0) continue
      const alreadyBatchDamage = batchDamagedByProduct.get(pid) || 0
      const maxQ = (maxByProduct.get(pid) || 0) - alreadyBatchDamage
      if (qty > maxQ)
        return res.status(400).json({ message: `Collected qty exceeds outstanding for product ${pid}` })
      batchCollectedByProduct.set(pid, (batchCollectedByProduct.get(pid) || 0) + qty)
    }

    const collectedByProduct = new Map(isPendingResubmit ? prevCollectedByProduct : new Map())
    for (const [pid, qty] of batchCollectedByProduct.entries()) {
      collectedByProduct.set(pid, (collectedByProduct.get(pid) || 0) + qty)
    }

    const billerCollectedLines = []
    for (const [pid, qty] of collectedByProduct.entries()) {
      if (qty <= 0) continue
      const noteFromBatch = collectedIn.find((r) => String(r.productId) === pid)?.note
      const prevNote = (delivery.billerCollectedLines || []).find((l) => String(l.productId) === pid)?.note
      billerCollectedLines.push({
        productId: pid,
        qty,
        note: noteFromBatch ? String(noteFromBatch).slice(0, 500) : prevNote,
      })
    }

    // Restock only this batch's newly collected qty.
    if (batchCollectedByProduct.size > 0) {
      const pending = new Map(batchCollectedByProduct)
      const ledgerEntries = []
      for (const line of delivery.lines || []) {
        const pid = String(line.productId)
        const delta = pending.get(pid)
        if (!delta) continue
        const dispatched = Number(line.dispatchedQty) || Number(line.qty) || 0
        const alreadyReturned = Number(line.returnedQty) || 0
        const applyQty = Math.min(delta, Math.max(0, dispatched - alreadyReturned))
        if (applyQty <= 0) {
          pending.delete(pid)
          continue
        }
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

    // Track only this pending-return batch's collected products for the Detail card.
    if (isPendingResubmit && batchCollectedByProduct.size > 0) {
      const prevPendingCollected = new Map()
      for (const l of delivery.pendingReturnCollectedLines || []) {
        const pid = String(l.productId)
        prevPendingCollected.set(pid, (prevPendingCollected.get(pid) || 0) + (Number(l.qty) || 0))
      }
      for (const [pid, qty] of batchCollectedByProduct.entries()) {
        prevPendingCollected.set(pid, (prevPendingCollected.get(pid) || 0) + qty)
      }
      const pendingReturnCollectedLines = []
      for (const [pid, qty] of prevPendingCollected.entries()) {
        if (qty <= 0) continue
        const noteFromBatch = collectedIn.find((r) => String(r.productId) === pid)?.note
        const prevNote = (delivery.pendingReturnCollectedLines || []).find(
          (l) => String(l.productId) === pid,
        )?.note
        pendingReturnCollectedLines.push({
          productId: pid,
          qty,
          note: noteFromBatch ? String(noteFromBatch).slice(0, 500) : prevNote,
        })
      }
      delivery.pendingReturnCollectedLines = pendingReturnCollectedLines
      delivery.pendingReturnCollectedAt = new Date()
      if (returnedByName && String(returnedByName).trim()) {
        delivery.pendingReturnCollectedName = String(returnedByName).trim().slice(0, 200)
      }
      if (signature && typeof signature === 'string' && signature.startsWith('data:image')) {
        delivery.pendingReturnSignature = signature.slice(0, 500_000)
      }
    }

    delivery.status = billerPendingReturnLines.length > 0 ? 'PENDING_RETURN' : 'COMPLETED'
    if (billerPendingReturnLines.length > 0) delivery.phase = 'RETURN'
    delivery.markModified('lines')
    await delivery.save()

    return res.json({
      ok: true,
      damageTotal: delivery.damageTotal,
      missingTotal: delivery.missingTotal,
      billerReturnSubmittedAt: delivery.billerReturnSubmittedAt,
      billerReturnName: delivery.billerReturnName,
      billerSignature: delivery.billerSignature,
      billerPendingReturnLines: delivery.billerPendingReturnLines,
      pendingReturnCollectedLines: delivery.pendingReturnCollectedLines,
      pendingReturnCollectedAt: delivery.pendingReturnCollectedAt,
      pendingReturnCollectedName: delivery.pendingReturnCollectedName,
      pendingReturnSignature: delivery.pendingReturnSignature,
      status: delivery.status,
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
  getPendingReturnAssign,
  postPendingReturnAssign,
}