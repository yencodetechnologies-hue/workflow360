/**
 * One-time migration: UPCOMING/DISPATCHED -> PROCESSED/PACKED/OUT_FOR_DELIVERY
 * Run: node backend/scripts/migrate-delivery-statuses.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const connectDB = require('../config/db')
const Delivery = require('../models/Delivery')

function totalRequiredQty(delivery) {
  let n = 0
  for (const line of delivery.lines || []) n += Number(line.qty) || 0
  return n
}

function dispatchComplete(delivery) {
  const required = totalRequiredQty(delivery)
  return required > 0 && (delivery.dispatchedTagIds || []).length >= required
}

async function migrateStatus(doc) {
  const old = doc.status
  if (!['UPCOMING', 'DISPATCHED'].includes(old)) return null

  let next = 'PROCESSED'
  if (old === 'DISPATCHED') {
    if (doc.vehicleVerifiedAt) next = 'OUT_FOR_DELIVERY'
    else if (dispatchComplete(doc)) next = 'PACKED'
    else next = 'PROCESSED'
  } else if (old === 'UPCOMING') {
    if (dispatchComplete(doc)) next = 'PACKED'
    else next = 'PROCESSED'
  }

  const updates = { status: next }
  if (next === 'PACKED' && !doc.packedAt) updates.packedAt = doc.updatedAt || new Date()
  if (next === 'OUT_FOR_DELIVERY' && !doc.outForDeliveryAt) {
    updates.outForDeliveryAt = doc.vehicleVerifiedAt || doc.updatedAt || new Date()
  }
  return updates
}

async function main() {
  await connectDB()
  const cursor = Delivery.find({ status: { $in: ['UPCOMING', 'DISPATCHED'] } }).cursor()
  let updated = 0
  for await (const doc of cursor) {
    const updates = await migrateStatus(doc)
    if (!updates) continue
    await Delivery.updateOne({ _id: doc._id }, { $set: updates })
    updated += 1
    console.log(`${doc.deliveryNo}: ${doc.status} -> ${updates.status}`)
  }
  console.log(`Done. Updated ${updated} deliveries.`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
