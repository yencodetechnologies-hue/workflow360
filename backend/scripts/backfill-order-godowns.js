/**
 * Backfill Order.fromGodownId from linked deliveries.
 * Usage: node scripts/backfill-order-godowns.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const Order = require('../models/Order')
const Delivery = require('../models/Delivery')

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) {
    console.error('Set MONGODB_URI')
    process.exit(1)
  }
  await mongoose.connect(uri)

  const deliveries = await Delivery.find({
    orderId: { $exists: true, $ne: null },
    fromGodownId: { $exists: true, $ne: null },
  })
    .select('orderId fromGodownId')
    .lean()

  let updated = 0
  let skipped = 0

  for (const d of deliveries) {
    const order = await Order.findById(d.orderId)
    if (!order) {
      skipped++
      continue
    }
    if (order.fromGodownId) {
      skipped++
      continue
    }
    order.fromGodownId = d.fromGodownId
    await order.save()
    updated++
  }

  console.log(`Done. updated=${updated}, skipped=${skipped}`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
