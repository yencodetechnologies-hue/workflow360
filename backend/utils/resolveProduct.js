const mongoose = require('mongoose')
const Product = require('../models/Product')

/** Resolve route/body id as Mongo `_id` or business `productId` string. */
async function findProductByRouteId(id) {
  if (id == null || id === '') return null
  const idStr = String(id).trim()
  if (mongoose.Types.ObjectId.isValid(idStr) && String(new mongoose.Types.ObjectId(idStr)) === idStr) {
    const byMongo = await Product.findById(idStr)
    if (byMongo) return byMongo
  }
  return Product.findOne({ productId: idStr })
}

/** Mongo `_id` string for ledger / AssetTag, or null if product not found. */
async function resolveProductMongoId(id) {
  const product = await findProductByRouteId(id)
  return product ? String(product._id) : null
}

module.exports = { findProductByRouteId, resolveProductMongoId }
