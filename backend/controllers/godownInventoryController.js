const mongoose = require('mongoose')
const Godown = require('../models/Godown')
const Product = require('../models/Product')
const GodownProduct = require('../models/GodownProduct')
const InventoryLedger = require('../models/InventoryLedger')

const MAX_ABS_DELTA = 1_000_000

async function sumQtyFor(godownId, productId) {
  const gid = new mongoose.Types.ObjectId(godownId)
  const pid = new mongoose.Types.ObjectId(productId)
  const rows = await InventoryLedger.aggregate([
    { $match: { godownId: gid, productId: pid } },
    { $group: { _id: null, qty: { $sum: '$qtyDelta' } } },
  ])
  return rows[0]?.qty ?? 0
}

async function postGodownAdjustment(req, res) {
  try {
    const { godownId } = req.params
    const { productId, qtyDelta, note } = req.body || {}

    if (!mongoose.Types.ObjectId.isValid(godownId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'godownId and productId must be valid ids' })
    }

    const godown = await Godown.findById(godownId).lean()
    if (!godown || !godown.active) {
      return res.status(404).json({ message: 'Godown not found' })
    }

    if (req.user.role === 'GODOWN' && req.user.godownId && String(req.user.godownId) !== String(godownId)) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const n = Number(qtyDelta)
    if (!Number.isFinite(n) || !Number.isInteger(n) || n === 0) {
      return res.status(400).json({ message: 'qtyDelta must be a non-zero integer' })
    }
    if (Math.abs(n) > MAX_ABS_DELTA) {
      return res.status(400).json({ message: `qtyDelta must be between -${MAX_ABS_DELTA} and ${MAX_ABS_DELTA}` })
    }

    const product = await Product.findById(productId).select('_id').lean()
    if (!product) {
      return res.status(400).json({ message: 'Product not found' })
    }

    const gp = await GodownProduct.findOne({ godownId, productId }).lean()
    if (!gp || !gp.enabled) {
      return res.status(400).json({ message: 'Product is not enabled for this godown' })
    }

    const current = await sumQtyFor(godownId, productId)
    if (n < 0 && current + n < 0) {
      return res.status(400).json({ message: 'Insufficient stock for this adjustment' })
    }

    const noteStr = typeof note === 'string' ? note.trim().slice(0, 500) : ''
    const refId = `adj_${Date.now()}`

    await InventoryLedger.create({
      godownId,
      productId,
      qtyDelta: n,
      reason: 'ADJUSTMENT',
      refType: 'Manual',
      refId,
      note: noteStr || undefined,
      byUserId: new mongoose.Types.ObjectId(req.user.id),
    })

    const balanceAfter = current + n

    return res.status(201).json({
      ok: true,
      godownId: String(godownId),
      productId: String(productId),
      qtyDelta: n,
      balanceAfter,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Adjustment failed' })
  }
}

module.exports = { postGodownAdjustment }
