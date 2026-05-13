const Delivery = require('../models/Delivery')
const Product = require('../models/Product')

function parseRate(rateStr) {
  if (rateStr == null || rateStr === '') return 0
  const n = Number(String(rateStr).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function allowedLineProductIds(delivery) {
  return new Set((delivery.lines || []).map((l) => String(l.productId)))
}

async function populateLineDetails(delivery) {
  const ids = [...new Set((delivery.lines || []).map((l) => String(l.productId)))]
  const products = await Product.find({ _id: { $in: ids } }).lean()
  const byId = new Map(products.map((p) => [String(p._id), p]))
  const linesOut = (delivery.lines || []).map((line) => {
    const p = byId.get(String(line.productId))
    return {
      productId: String(line.productId),
      qty: line.qty,
      particulars: p?.particulars,
      sku: p?.sku || p?.s_no,
      rate: p?.rate,
      parsedRate: parseRate(p?.rate),
      unit: p?.unit,
    }
  })
  return linesOut
}

async function getDeliveryVerify(req, res) {
  try {
    const token = decodeURIComponent(String(req.params.token || '').trim())
    if (!token) return res.status(400).json({ message: 'token required' })

    const delivery = await Delivery.findOne({ deliveryVerifyToken: token }).lean()
    if (!delivery) return res.status(404).json({ message: 'Not found' })

    const lines = await populateLineDetails(delivery)
    const allowedStatuses = ['UPCOMING', 'DISPATCHED']
    const canSubmit = allowedStatuses.includes(delivery.status) && !delivery.deliveryVerifiedAt

    return res.json({
      deliveryNo: delivery.deliveryNo,
      customerName: delivery.customerName,
      siteName: delivery.siteName,
      status: delivery.status,
      deliveryAt: delivery.deliveryAt,
      vehicleLabel: delivery.vehicleLabel,
      lines,
      deliveryVerifierName: delivery.deliveryVerifierName,
      deliveryVerifiedAt: delivery.deliveryVerifiedAt,
      deliveryLineChecks: delivery.deliveryLineChecks,
      canSubmit,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed' })
  }
}

async function postDeliveryVerify(req, res) {
  try {
    const token = decodeURIComponent(String(req.params.token || '').trim())
    const { verifierName, lineChecks } = req.body || {}
    if (!token) return res.status(400).json({ message: 'token required' })
    if (!verifierName || !String(verifierName).trim()) return res.status(400).json({ message: 'verifierName required' })

    const delivery = await Delivery.findOne({ deliveryVerifyToken: token })
    if (!delivery) return res.status(404).json({ message: 'Not found' })

    if (!['UPCOMING', 'DISPATCHED'].includes(delivery.status)) {
      return res.status(409).json({ message: 'Delivery cannot be verified in current status' })
    }
    if (delivery.deliveryVerifiedAt) return res.status(409).json({ message: 'Already verified' })

    const allowed = allowedLineProductIds(delivery)
    const checks = Array.isArray(lineChecks) ? lineChecks : []
    const mapped = []
    for (const c of checks) {
      const pid = String(c.productId || '')
      if (!allowed.has(pid)) return res.status(400).json({ message: `Invalid productId in checks: ${pid}` })
      mapped.push({
        productId: pid,
        qtyAck: c.qtyAck != null ? Number(c.qtyAck) : undefined,
        ok: Boolean(c.ok),
      })
    }

    for (const pid of allowed) {
      const row = mapped.find((m) => String(m.productId) === pid)
      if (!row || !row.ok) return res.status(400).json({ message: 'All line items must be acknowledged with ok: true' })
    }

    delivery.deliveryVerifierName = String(verifierName).trim()
    delivery.deliveryVerifiedAt = new Date()
    delivery.deliveryLineChecks = mapped
    await delivery.save()

    return res.json({ ok: true, deliveryVerifiedAt: delivery.deliveryVerifiedAt })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed' })
  }
}

async function getBillerReturn(req, res) {
  try {
    const token = decodeURIComponent(String(req.params.token || '').trim())
    if (!token) return res.status(400).json({ message: 'token required' })

    const delivery = await Delivery.findOne({ billerReturnVerifyToken: token }).lean()
    if (!delivery) return res.status(404).json({ message: 'Not found' })

    const lines = await populateLineDetails(delivery)
    const allowedStatuses = ['DELIVERED', 'PENDING_RETURN']
    const canSubmit = allowedStatuses.includes(delivery.status) && !delivery.billerReturnSubmittedAt

    return res.json({
      deliveryNo: delivery.deliveryNo,
      customerName: delivery.customerName,
      siteName: delivery.siteName,
      status: delivery.status,
      challanNo: delivery.challanNo,
      lines,
      billerDamagedLines: delivery.billerDamagedLines,
      billerMissingLines: delivery.billerMissingLines,
      damageTotal: delivery.damageTotal,
      missingTotal: delivery.missingTotal,
      billerReturnSubmittedAt: delivery.billerReturnSubmittedAt,
      canSubmit,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed' })
  }
}

async function postBillerReturn(req, res) {
  try {
    const token = decodeURIComponent(String(req.params.token || '').trim())
    const { damagedLines, missingLines } = req.body || {}
    if (!token) return res.status(400).json({ message: 'token required' })

    const delivery = await Delivery.findOne({ billerReturnVerifyToken: token })
    if (!delivery) return res.status(404).json({ message: 'Not found' })

    if (!['DELIVERED', 'PENDING_RETURN'].includes(delivery.status)) {
      return res.status(409).json({ message: 'Return cannot be submitted in current status' })
    }
    if (delivery.billerReturnSubmittedAt) return res.status(409).json({ message: 'Already submitted' })

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
      if (!allowed.has(pid)) return res.status(400).json({ message: `Invalid productId: ${pid}` })
      const qty = Math.max(0, Number(row.qty) || 0)
      const maxQ = qtyByProduct.get(pid) || 0
      if (qty > maxQ) return res.status(400).json({ message: `Damaged qty exceeds dispatched for product ${pid}` })
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
      if (!allowed.has(pid)) return res.status(400).json({ message: `Invalid productId: ${pid}` })
      const qty = Math.max(0, Number(row.qty) || 0)
      const maxQ = qtyByProduct.get(pid) || 0
      if (qty > maxQ) return res.status(400).json({ message: `Missing qty exceeds dispatched for product ${pid}` })
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
    await delivery.save()

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
