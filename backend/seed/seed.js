const dotenv = require('dotenv')
const connectDB = require('../config/db')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

dotenv.config()

async function ensureAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@godown.local').toLowerCase().trim()
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin123'

  const exists = await User.findOne({ email }).lean()
  if (exists) return { created: false, email }

  const saltRounds = Number(process.env.BCRYPT_ROUNDS || 10)
  const passwordHash = await bcrypt.hash(password, saltRounds)
  await User.create({ email, passwordHash, role: 'ADMIN', active: true })
  return { created: true, email }
}

async function main() {
  await connectDB()
  const result = await ensureAdmin()
  // eslint-disable-next-line no-console
  console.log(result.created ? `Seeded admin: ${result.email}` : `Admin already exists: ${result.email}`)
  process.exit(0)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})

