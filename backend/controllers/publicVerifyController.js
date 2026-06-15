const mongoose = require('mongoose')
const Delivery = require('../models/Delivery')
const Product = require('../models/Product')
const InventoryLedger = require('../models/InventoryLedger')
const { parseRate, populateLineDetails } = require('../utils/deliveryLineDetails')

function allowedLineProductIds(delivery) {
  return new Set((delivery.lines || []).map((l) => String(l.productId)))
}

// ── Delivery Verify GET ────────────────────────────────────────────────────
async function getDeliveryVerify(req, res) {
  try {
    const token = decodeURIComponent(String(req.params.token || '').trim())
    if (!token) return res.status(400).json({ message: 'token required' })

    const delivery = await Delivery.findOne({ deliveryVerifyToken: token }).lean()
    if (!delivery) return res.status(404).json({ message: 'Not found' })

    const lines = await populateLineDetails(delivery)

    return res.json({
      deliveryNo: delivery.deliveryNo,
      customerName: delivery.customerName,
      siteName: delivery.siteName,
      status: delivery.status,
      deliveryAt: delivery.deliveryAt,
      vehicleLabel: delivery.vehicleLabel,
      driverName: delivery.driverName,
      driverPhone: delivery.driverPhone,
      lines,
      deliveryVerifierName: delivery.deliveryVerifierName,
      deliveryVerifiedAt: delivery.deliveryVerifiedAt,
      deliveryLineChecks: delivery.deliveryLineChecks,
      hasSignature: Boolean(delivery.deliverySignature),
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

    return res.json({
      deliveryNo: delivery.deliveryNo,
      customerName: delivery.customerName,
      siteName: delivery.siteName,
      status: delivery.status,
      challanNo: delivery.challanNo,
      vehicleLabel: delivery.vehicleLabel,
      driverName: delivery.driverName,
      driverPhone: delivery.driverPhone,
      lines,
      billerDamagedLines: delivery.billerDamagedLines,
      billerMissingLines: delivery.billerMissingLines,
      damageTotal: delivery.damageTotal,
      missingTotal: delivery.missingTotal,
      billerReturnSubmittedAt: delivery.billerReturnSubmittedAt,
      canSubmit: true,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed' })
  }
}

// ── Biller Return POST ─────────────────────────────────────────────────────
async function postBillerReturn(req, res) {
  try {
    const token = decodeURIComponent(String(req.params.token || '').trim())
    const { damagedLines, missingLines } = req.body || {}
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
      const maxQ = qtyByProduct.get(pid) || 0
      if (qty > maxQ)
        return res.status(400).json({ message: `Missing qty exceeds dispatched for product ${pid}` })
      const p = await Product.findById(pid).lean()
      const rate = parseRate(p?.rate)
      missingTotal += rate * qty
      billerMissingLines.push({
        productId: pid,
        qty,
        note: row.note ? String(row.note).slice(0, 500) : undefined,
      })
    }

    delivery.billerDamagedLines = billerDamagedLines
    delivery.billerMissingLines = billerMissingLines
    delivery.damageTotal = Math.round(damageTotal * 100) / 100
    delivery.missingTotal = Math.round(missingTotal * 100) / 100
    delivery.billerReturnSubmittedAt = new Date()
    delivery.status = 'COMPLETED'
    await delivery.save()

    // Deduct damaged and missing items from inventory stock
    const godownId = delivery.fromGodownId
    if (godownId) {
      const ledgerEntries = []
      for (const line of billerDamagedLines) {
        if (line.qty > 0) {
          ledgerEntries.push({
            godownId: new mongoose.Types.ObjectId(String(godownId)),
            productId: new mongoose.Types.ObjectId(String(line.productId)),
            qtyDelta: -line.qty,
            reason: 'DAMAGE',
            refType: 'BillerReturn',
            refId: String(delivery._id),
            note: line.note || `Damage reported - ${delivery.deliveryNo}`,
          })
        }
      }
      for (const line of billerMissingLines) {
        if (line.qty > 0) {
          ledgerEntries.push({
            godownId: new mongoose.Types.ObjectId(String(godownId)),
            productId: new mongoose.Types.ObjectId(String(line.productId)),
            qtyDelta: -line.qty,
            reason: 'LOSS',
            refType: 'BillerReturn',
            refId: String(delivery._id),
            note: line.note || `Missing reported - ${delivery.deliveryNo}`,
          })
        }
      }
      if (ledgerEntries.length > 0) {
        await InventoryLedger.insertMany(ledgerEntries)
      }
    }

    return res.json({
      ok: true,
      damageTotal: delivery.damageTotal,
      missingTotal: delivery.missingTotal,
      billerReturnSubmittedAt: delivery.billerReturnSubmittedAt,
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