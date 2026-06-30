// const mongoose = require('mongoose')
// const Godown = require('../models/Godown')
// const Product = require('../models/Product')
// const GodownProduct = require('../models/GodownProduct')
// const { resolveProductMongoId } = require('../utils/resolveProduct')

// async function listGodownProducts(req, res) {
//   try {
//     const { godownId } = req.params
//     if (!mongoose.Types.ObjectId.isValid(godownId)) {
//       return res.status(400).json({ message: 'Invalid godown id' })
//     }
//     const godown = await Godown.findById(godownId).lean()
//     if (!godown || !godown.active) return res.status(404).json({ message: 'Godown not found' })

//     if (req.user.role === 'GODOWN' && req.user.godownId && String(req.user.godownId) !== String(godownId)) {
//       return res.status(403).json({ message: 'Forbidden' })
//     }

//     const [products, gpRows] = await Promise.all([
//       Product.find({}).select('particulars sku s_no category rate unit').lean(),
//       GodownProduct.find({ godownId }).lean(),
//     ])

//     const gpByProductId = new Map(gpRows.map((r) => [String(r.productId), r]))

//     const merged = products.map((p) => ({
//       productId: String(p._id),
//       enabled: gpByProductId.get(String(p._id))?.enabled === true,
//       particulars: p.particulars,
//       sku: p.sku || p.s_no,
//       category: p.category,
//       rate: p.rate,
//       unit: p.unit,
//     }))

//     merged.sort((a, b) => (a.particulars || '').localeCompare(b.particulars || ''))

//     return res.json(merged)
//   } catch (err) {
//     return res.status(500).json({ message: err.message || 'Failed to list catalog' })
//   }
// }

// async function patchGodownProduct(req, res) {
//   try {
//     const { godownId } = req.params
//     const { productId: rawProductId, enabled } = req.body || {}
//     if (!mongoose.Types.ObjectId.isValid(godownId)) {
//       return res.status(400).json({ message: 'godownId must be a valid id' })
//     }
//     const productId = await resolveProductMongoId(rawProductId)
//     if (!productId) {
//       return res.status(400).json({ message: 'Product not found' })
//     }
//     if (typeof enabled !== 'boolean') return res.status(400).json({ message: 'enabled boolean required' })

//     const godown = await Godown.findById(godownId).lean()
//     if (!godown || !godown.active) return res.status(404).json({ message: 'Godown not found' })

//     if (req.user.role === 'GODOWN' && req.user.godownId && String(req.user.godownId) !== String(godownId)) {
//       return res.status(403).json({ message: 'Forbidden' })
//     }

//     await GodownProduct.findOneAndUpdate(
//       { godownId, productId },
//       { $set: { enabled } },
//       { upsert: true, new: true },
//     )

//     return res.json({ ok: true, godownId: String(godownId), productId: String(productId), enabled })
//   } catch (err) {
//     return res.status(500).json({ message: err.message || 'Update failed' })
//   }
// }

// module.exports = { listGodownProducts, patchGodownProduct }

const mongoose = require('mongoose')
const Godown = require('../models/Godown')
const Product = require('../models/Product')
const GodownProduct = require('../models/GodownProduct')
const { resolveProductMongoId } = require('../utils/resolveProduct')

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

    const [products, gpRows] = await Promise.all([
      Product.find({}).select('particulars sku s_no category rate unit').lean(),
      GodownProduct.find({ godownId }).lean(),
    ])

    const gpByProductId = new Map(gpRows.map((r) => [String(r.productId), r]))

    const merged = products.map((p) => {
      const gp = gpByProductId.get(String(p._id))
      // No GodownProduct row yet means this product has never been explicitly
      // toggled for this godown — default it to enabled (auto-on for new products).
      const enabled = gp ? gp.enabled === true : true
      return {
        productId: String(p._id),
        enabled,
        particulars: p.particulars,
        sku: p.sku || p.s_no,
        category: p.category,
        rate: p.rate,
        unit: p.unit,
      }
    })

    merged.sort((a, b) => (a.particulars || '').localeCompare(b.particulars || ''))

    return res.json(merged)
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to list catalog' })
  }
}

async function patchGodownProduct(req, res) {
  try {
    const { godownId } = req.params
    const { productId: rawProductId, enabled } = req.body || {}
    if (!mongoose.Types.ObjectId.isValid(godownId)) {
      return res.status(400).json({ message: 'godownId must be a valid id' })
    }
    const productId = await resolveProductMongoId(rawProductId)
    if (!productId) {
      return res.status(400).json({ message: 'Product not found' })
    }
    if (typeof enabled !== 'boolean') return res.status(400).json({ message: 'enabled boolean required' })

    const godown = await Godown.findById(godownId).lean()
    if (!godown || !godown.active) return res.status(404).json({ message: 'Godown not found' })

    if (req.user.role === 'GODOWN' && req.user.godownId && String(req.user.godownId) !== String(godownId)) {
      return res.status(403).json({ message: 'Forbidden' })
    }

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