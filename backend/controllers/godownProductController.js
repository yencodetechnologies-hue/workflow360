const mongoose = require('mongoose')
const Godown = require('../models/Godown')
const Product = require('../models/Product')
const GodownProduct = require('../models/GodownProduct')

async function ensureCatalogRows(godownId) {
  const gid = new mongoose.Types.ObjectId(godownId)
  const count = await GodownProduct.countDocuments({ godownId: gid })
  if (count > 0) return
  const products = await Product.find({}).select('_id').lean()
  if (!products.length) return
  await GodownProduct.insertMany(products.map((p) => ({ godownId: gid, productId: p._id, enabled: true })))
}

async function listGodownProducts(req, res) {
  try {
    const { godownId } = req.params
    if (!mongoose.Types.ObjectId.isValid(godownId)) {
      return res.status(400).json({ message: 'Invalid godown id' })
    }
    const godown = await Godown.findById(godownId).lean()
    if (!godown || !godown.active) return res.status(404).json({ message: 'Godown not found' })

    if (req.user.role === 'GODOWN' && req.user.godownId && String(req.user.godownId) !== String(godownId)) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    await ensureCatalogRows(godownId)

    const rows = await GodownProduct.find({ godownId }).lean()
    const productIds = rows.map((r) => r.productId)
    const products = await Product.find({ _id: { $in: productIds } }).lean()
    const byId = new Map(products.map((p) => [String(p._id), p]))

    return res.json(
      rows.map((r) => {
        const p = byId.get(String(r.productId))
        return {
          productId: String(r.productId),
          enabled: r.enabled,
          particulars: p?.particulars,
          sku: p?.sku || p?.s_no,
          category: p?.category,
          rate: p?.rate,
          unit: p?.unit,
        }
      }),
    )
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to list catalog' })
  }
}

async function patchGodownProduct(req, res) {
  try {
    const { godownId } = req.params
    const { productId, enabled } = req.body || {}
    if (!mongoose.Types.ObjectId.isValid(godownId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'godownId and productId required as valid ids' })
    }
    if (typeof enabled !== 'boolean') return res.status(400).json({ message: 'enabled boolean required' })

    const godown = await Godown.findById(godownId).lean()
    if (!godown || !godown.active) return res.status(404).json({ message: 'Godown not found' })

    if (req.user.role === 'GODOWN' && req.user.godownId && String(req.user.godownId) !== String(godownId)) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    await ensureCatalogRows(godownId)

    await GodownProduct.findOneAndUpdate(
      { godownId, productId },
      { $set: { enabled } },
      { upsert: true, new: true },
    )

    return res.json({ ok: true, godownId: String(godownId), productId: String(productId), enabled })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Update failed' })
  }
}

module.exports = { listGodownProducts, patchGodownProduct }
