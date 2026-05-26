/**
 * Remove invalid godownId values from User documents (e.g. "123456" mistaken for ObjectId).
 *
 * Usage:
 *   node scripts/fix-invalid-godown-ids.js --dry-run
 *   node scripts/fix-invalid-godown-ids.js --apply
 *
 * After --apply, re-link godown login users:
 *   node scripts/sync-godown-users.js
 *
 * Requires MONGODB_URI (or MONGO_URI) in backend/.env
 */
const { getMongoUri, printMongoConnectHelp } = require('./script-bootstrap')
const mongoose = require('mongoose')
const User = require('../models/User')

function isValidGodownObjectId(id) {
  return id != null && mongoose.Types.ObjectId.isValid(String(id))
}

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const dryRun = args.includes('--dry-run') || !apply

  if (!dryRun && !apply) {
    console.error('Pass --dry-run (default) or --apply')
    process.exit(1)
  }

  const uri = getMongoUri()
  if (!uri) {
    console.error('Set MONGODB_URI or MONGO_URI in backend/.env')
    process.exit(1)
  }

  try {
    await mongoose.connect(uri)
  } catch (err) {
    printMongoConnectHelp(err)
    throw err
  }

  const users = await User.find({
    godownId: { $exists: true, $nin: [null, ''] },
  }).lean()

  const invalid = users.filter((u) => !isValidGodownObjectId(u.godownId))

  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`Users with godownId: ${users.length}`)
  console.log(`Invalid godownId: ${invalid.length}`)

  if (invalid.length === 0) {
    console.log('Nothing to fix.')
    await mongoose.disconnect()
    return
  }

  for (const u of invalid) {
    console.log({
      id: String(u._id),
      email: u.email,
      role: u.role,
      godownId: u.godownId,
    })
  }

  if (!apply) {
    console.log('\nRe-run with --apply to $unset invalid godownId fields.')
    console.log('Then run: node scripts/sync-godown-users.js')
    await mongoose.disconnect()
    return
  }

  const ids = invalid.map((u) => u._id)
  const result = await User.updateMany(
    { _id: { $in: ids } },
    { $unset: { godownId: 1 } },
  )

  console.log(`\nUpdated ${result.modifiedCount} user(s).`)
  console.log('Next: node scripts/sync-godown-users.js')

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
