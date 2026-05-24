const mongoose = require('mongoose')
const Godown = require('../models/Godown')
const Product = require('../models/Product')
const GodownProduct = require('../models/GodownProduct')
const InventoryLedger = require('../models/InventoryLedger')
const AssetTag = require('../models/AssetTag')

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

async function postRfidIntake(req, res) {
  let createdTag = null
  try {
    const { godownId } = req.params
    const { tagId, productId, note } = req.body || {}

    if (!mongoose.Types.ObjectId.isValid(godownId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'godownId and productId must be valid ids' })
    }

    const trimmedTag = String(tagId || '').trim()
    if (!trimmedTag) {
      return res.status(400).json({ message: 'tagId is required' })
    }

    const godown = await Godown.findById(godownId).lean()
    if (!godown || !godown.active) {
      return res.status(404).json({ message: 'Godown not found' })
    }

    if (req.user.role === 'GODOWN' && req.user.godownId && String(req.user.godownId) !== String(godownId)) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const product = await Product.findById(productId).select('_id').lean()
    if (!product) {
      return res.status(400).json({ message: 'Product not found' })
    }

    const gp = await GodownProduct.findOne({ godownId, productId }).lean()
    if (!gp || !gp.enabled) {
      return res.status(400).json({ message: 'Product is not enabled for this godown' })
    }

    const exists = await AssetTag.findOne({ tagId: trimmedTag }).lean()
    if (exists) {
      return res.status(400).json({ message: 'tagId already enrolled' })
    }

    createdTag = await AssetTag.create({
      tagId: trimmedTag,
      productId: new mongoose.Types.ObjectId(productId),
      currentGodownId: new mongoose.Types.ObjectId(godownId),
      status: 'IN_STOCK',
    })

    const noteStr =
      typeof note === 'string' && note.trim()
        ? note.trim().slice(0, 500)
        : `RFID intake ${trimmedTag}`

    await InventoryLedger.create({
      godownId,
      productId,
      qtyDelta: 1,
      reason: 'ADJUSTMENT',
      refType: 'RfidIntake',
      refId: trimmedTag,
      note: noteStr,
      byUserId: new mongoose.Types.ObjectId(req.user.id),
    })

    const balanceAfter = (await sumQtyFor(godownId, productId)) + 0

    return res.status(201).json({
      ok: true,
      tagId: createdTag.tagId,
      assetTagId: String(createdTag._id),
      godownId: String(godownId),
      productId: String(productId),
      qtyDelta: 1,
      balanceAfter,
    })
  } catch (err) {
    if (createdTag?._id) {
      await AssetTag.deleteOne({ _id: createdTag._id }).catch(() => {})
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'tagId already enrolled' })
    }
    return res.status(500).json({ message: err.message || 'RFID intake failed' })
  }
}

async function assertGodownAccess(req, godownId) {
  if (!mongoose.Types.ObjectId.isValid(godownId)) {
    return { error: { status: 400, message: 'godownId must be a valid id' } }
  }
  const godown = await Godown.findById(godownId).lean()
  if (!godown || !godown.active) {
    return { error: { status: 404, message: 'Godown not found' } }
  }
  if (req.user.role === 'GODOWN' && req.user.godownId && String(req.user.godownId) !== String(godownId)) {
    return { error: { status: 403, message: 'Forbidden' } }
  }
  return { godown }
}

async function listProductAssetTags(req, res) {
  try {
    const { godownId, productId } = req.params
    if (!mongoose.Types.ObjectId.isValid(godownId)) {
      return res.status(400).json({ message: 'godownId must be a valid id' })
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'productId must be a valid id' })
    }
    const access = await assertGodownAccess(req, godownId)
    if (access.error) return res.status(access.error.status).json({ message: access.error.message })

    const gid = new mongoose.Types.ObjectId(godownId)
    const pid = new mongoose.Types.ObjectId(productId)

    const product = await Product.findById(pid).select('_id').lean()
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    const gp = await GodownProduct.findOne({ godownId: gid, productId: pid }).lean()
    if (!gp || !gp.enabled) {
      return res.status(400).json({ message: 'Product is not enabled for this godown' })
    }

    const tags = await AssetTag.find({
      productId: pid,
      currentGodownId: gid,
      status: 'IN_STOCK',
    })
      .sort({ createdAt: -1 })
      .lean()

    return res.json(
      tags.map((t) => ({
        tagId: t.tagId,
        assetTagId: String(t._id),
        productId: String(t.productId),
        godownId: String(godownId),
        status: t.status,
        enrolledAt: t.createdAt,
      })),
    )
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to list asset tags' })
  }
}

async function lookupAssetTags(req, res) {
  try {
    const { godownId } = req.params
    const { tagIds, productId } = req.body || {}
    const access = await assertGodownAccess(req, godownId)
    if (access.error) return res.status(access.error.status).json({ message: access.error.message })

    const ids = Array.isArray(tagIds)
      ? [...new Set(tagIds.map((t) => String(t || '').trim()).filter(Boolean))]
      : []
    if (ids.length === 0) return res.json([])

    const assets = await AssetTag.find({ tagId: { $in: ids } }).lean()
    if (assets.length === 0) return res.json([])

    const productIds = [...new Set(assets.map((a) => String(a.productId)))]
    const products = await Product.find({ _id: { $in: productIds } })
      .select('particulars sku')
      .lean()
    const productById = new Map(products.map((p) => [String(p._id), p]))

    const currentProductId = productId && mongoose.Types.ObjectId.isValid(productId) ? String(productId) : null

    return res.json(
      assets.map((a) => {
        const p = productById.get(String(a.productId))
        const pid = String(a.productId)
        return {
          tagId: a.tagId,
          productId: pid,
          productName: p?.particulars || p?.sku || pid,
          godownId: a.currentGodownId ? String(a.currentGodownId) : null,
          isCurrentProduct: currentProductId ? pid === currentProductId : false,
        }
      }),
    )
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Tag lookup failed' })
  }
}

async function deleteRfidIntake(req, res) {
  try {
    const { godownId } = req.params
    const { tagId, productId, note } = req.body || {}

    if (!mongoose.Types.ObjectId.isValid(godownId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'godownId and productId must be valid ids' })
    }

    const trimmedTag = String(tagId || '').trim()
    if (!trimmedTag) {
      return res.status(400).json({ message: 'tagId is required' })
    }

    const access = await assertGodownAccess(req, godownId)
    if (access.error) return res.status(access.error.status).json({ message: access.error.message })

    const gid = new mongoose.Types.ObjectId(godownId)
    const pid = new mongoose.Types.ObjectId(productId)

    const asset = await AssetTag.findOne({
      tagId: trimmedTag,
      productId: pid,
      currentGodownId: gid,
    })
    if (!asset) {
      return res.status(404).json({ message: 'Tag not found for this product in godown' })
    }
    if (asset.status !== 'IN_STOCK') {
      return res.status(400).json({ message: 'Tag cannot be removed while not in stock' })
    }

    const current = await sumQtyFor(godownId, productId)
    if (current < 1) {
      return res.status(400).json({ message: 'Insufficient stock to revoke this tag' })
    }

    await AssetTag.deleteOne({ _id: asset._id })

    const noteStr =
      typeof note === 'string' && note.trim()
        ? note.trim().slice(0, 500)
        : `RFID revoke ${trimmedTag}`

    await InventoryLedger.create({
      godownId: gid,
      productId: pid,
      qtyDelta: -1,
      reason: 'ADJUSTMENT',
      refType: 'RfidRevoke',
      refId: trimmedTag,
      note: noteStr,
      byUserId: new mongoose.Types.ObjectId(req.user.id),
    })

    const balanceAfter = await sumQtyFor(godownId, productId)

    return res.json({
      ok: true,
      tagId: trimmedTag,
      godownId: String(godownId),
      productId: String(productId),
      qtyDelta: -1,
      balanceAfter,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'RFID revoke failed' })
  }
}

module.exports = {
  postGodownAdjustment,
  postRfidIntake,
  listProductAssetTags,
  lookupAssetTags,
  deleteRfidIntake,
}
