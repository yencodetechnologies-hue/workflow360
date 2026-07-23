/**
 * Drop the unique index on Delivery.deliveryNo so the same number
 * (e.g. 918) can be reused on multiple deliveries.
 * Mongoose does not drop indexes removed from the schema — run this once.
 *
 * Usage:
 *   node scripts/drop-deliveryNo-unique.js
 *
 * Requires MONGODB_URI (or MONGO_URI) in backend/.env
 */
const { getMongoUri, printMongoConnectHelp } = require('./script-bootstrap')
const mongoose = require('mongoose')

async function main() {
  const uri = getMongoUri()
  if (!uri) {
    console.error('Set MONGODB_URI (or MONGO_URI) in backend/.env')
    process.exit(1)
  }

  await mongoose.connect(uri)
  const coll = mongoose.connection.collection('deliveries')

  const indexes = await coll.indexes()
  for (const idx of indexes) {
    const isDeliveryNoUnique =
      idx.key && Object.keys(idx.key).join(',') === 'deliveryNo' && idx.unique
    if (isDeliveryNoUnique) {
      console.log(`Dropping index ${idx.name} ...`)
      await coll.dropIndex(idx.name)
    }
  }

  // Recreate as a plain (non-unique) index for query performance.
  await coll.createIndex({ deliveryNo: 1 })

  console.log('Done. deliveryNo is no longer unique.')
  await mongoose.disconnect()
}

main().catch((err) => {
  printMongoConnectHelp(err)
  console.error(err)
  process.exit(1)
})
