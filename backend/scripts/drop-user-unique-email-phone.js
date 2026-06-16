// /**
//  * Drop the old unique indexes on User.email and User.contactPhone so that
//  * billers (and any other users) can be created with duplicate emails / phone
//  * numbers. Mongoose only creates missing indexes on connect — it does not
//  * drop indexes that were removed from the schema — so this one-time script
//  * removes them from the existing database.
//  *
//  * Usage:
//  *   node scripts/drop-user-unique-email-phone.js
//  *
//  * Requires MONGODB_URI (or MONGO_URI) in backend/.env
//  */
// const { getMongoUri, printMongoConnectHelp } = require('./script-bootstrap')
// const mongoose = require('mongoose')

// async function main() {
//   const uri = getMongoUri()
//   if (!uri) {
//     console.error('Set MONGODB_URI (or MONGO_URI) in backend/.env')
//     process.exit(1)
//   }

//   await mongoose.connect(uri)
//   const coll = mongoose.connection.collection('users')

//   const indexes = await coll.indexes()
//   for (const idx of indexes) {
//     const isEmailUnique = idx.key && Object.keys(idx.key).join(',') === 'email' && idx.unique
//     const isPhoneUnique = idx.key && Object.keys(idx.key).join(',') === 'contactPhone' && idx.unique
//     if (isEmailUnique || isPhoneUnique) {
//       console.log(`Dropping index ${idx.name} ...`)
//       await coll.dropIndex(idx.name)
//     }
//   }

//   // Recreate as plain (non-unique) indexes for query performance.
//   await coll.createIndex({ email: 1 })
//   await coll.createIndex({ contactPhone: 1 })

//   console.log('Done. Email and contactPhone are no longer unique.')
//   await mongoose.disconnect()
// }

// main().catch((err) => {
//   printMongoConnectHelp(err)
//   console.error(err)
//   process.exit(1)
// })

/**
 * Drop the old unique indexes on User.email and User.contactPhone so that
 * billers (and any other users) can be created with duplicate emails / phone
 * numbers. Mongoose only creates missing indexes on connect — it does not
 * drop indexes that were removed from the schema — so this one-time script
 * removes them from the existing database.
 *
 * Usage:
 *   node scripts/drop-user-unique-email-phone.js
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
  const coll = mongoose.connection.collection('users')

  const indexes = await coll.indexes()
  for (const idx of indexes) {
    const isEmailUnique = idx.key && Object.keys(idx.key).join(',') === 'email' && idx.unique
    const isPhoneUnique = idx.key && Object.keys(idx.key).join(',') === 'contactPhone' && idx.unique
    if (isEmailUnique || isPhoneUnique) {
      console.log(`Dropping index ${idx.name} ...`)
      await coll.dropIndex(idx.name)
    }
  }

  // Recreate as plain (non-unique) indexes for query performance.
  await coll.createIndex({ email: 1 })
  await coll.createIndex({ contactPhone: 1 })

  console.log('Done. Email and contactPhone are no longer unique.')
  await mongoose.disconnect()
}

main().catch((err) => {
  printMongoConnectHelp(err)
  console.error(err)
  process.exit(1)
})