/**
 * One-time backfill: create GODOWN User records for godowns that have mobile + passwordHash.
 * Usage: node scripts/sync-godown-users.js
 * Requires MONGODB_URI (or same env as backend).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const Godown = require('../models/Godown')
const User = require('../models/User')
const { syncGodownLoginUser } = require('../utils/syncGodownUser')

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) {
    console.error('Set MONGODB_URI')
    process.exit(1)
  }
  await mongoose.connect(uri)

  const godowns = await Godown.find({ active: true }).select('+passwordHash').lean()
  let created = 0
  let updated = 0
  let skipped = 0

  for (const g of godowns) {
    if (!g.mobile || !g.passwordHash) {
      skipped++
      continue
    }
    const existing = await User.findOne({ role: 'GODOWN', godownId: String(g._id) })
    await syncGodownLoginUser(g, { passwordHash: g.passwordHash })
    if (existing) updated++
    else created++
  }

  console.log(`Done. created/linked=${created + updated}, skipped=${skipped}`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
