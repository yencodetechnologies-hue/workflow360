const bcrypt = require('bcryptjs')
const User = require('../models/User')
const { normalizePhone } = require('./phone')

const saltRounds = () => Number(process.env.BCRYPT_ROUNDS || 10)

function makeGodownEmail(godownId) {
  const id = String(godownId).replace(/[^a-zA-Z0-9]/g, '')
  return `godown_${id}@wf360.local`
}

/**
 * Create or update a GODOWN User linked to a godown (mobile + password login).
 * @param {object} godown - Mongoose godown doc or lean object with _id, mobile
 * @param {{ passwordHash?: string, passwordPlain?: string }} opts
 */
async function syncGodownLoginUser(godown, opts = {}) {
  const godownId = String(godown._id)
  const phone = normalizePhone(godown.mobile)
  if (!phone) return null

  let passwordHash = opts.passwordHash
  if (!passwordHash && opts.passwordPlain) {
    passwordHash = await bcrypt.hash(String(opts.passwordPlain), saltRounds())
  }

  let user = await User.findOne({ role: 'GODOWN', godownId })
  if (!user) {
    user = await User.findOne({ email: makeGodownEmail(godownId) })
  }

  if (!passwordHash) {
    if (user) passwordHash = user.passwordHash
    else return null
  }

  const email = makeGodownEmail(godownId)

  if (user) {
    user.email = email
    user.passwordHash = passwordHash
    user.contactPhone = phone
    user.role = 'GODOWN'
    user.godownId = godownId
    user.active = true
    await user.save()
    return user
  }

  return User.create({
    email,
    passwordHash,
    role: 'GODOWN',
    godownId,
    contactPhone: phone,
    active: true,
  })
}

module.exports = { syncGodownLoginUser, makeGodownEmail }
