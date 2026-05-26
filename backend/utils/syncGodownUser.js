const bcrypt = require('bcryptjs')
const User = require('../models/User')
const { normalizePhone } = require('./phone')

const saltRounds = () => Number(process.env.BCRYPT_ROUNDS || 10)

function makeGodownEmail(godownId) {
  const id = String(godownId).replace(/[^a-zA-Z0-9]/g, '')
  return `godown_${id}@wf360.local`
}

function contactPhoneConflictError() {
  const err = new Error(
    'Mobile number is already used by another account. Change that user’s phone or use a different godown mobile.',
  )
  err.code = 'CONTACT_PHONE_CONFLICT'
  return err
}

function isDuplicateKeyError(err) {
  return err && (err.code === 11000 || err.code === 11001)
}

function isContactPhoneDuplicate(err) {
  if (!isDuplicateKeyError(err)) return false
  const key = err.keyPattern || err.keyValue
  if (key && (key.contactPhone !== undefined || key.contactPhone === '')) return true
  const msg = String(err.message || '')
  return msg.includes('contactPhone')
}

async function saveGodownUser(user) {
  try {
    await user.save()
    return user
  } catch (err) {
    if (isContactPhoneDuplicate(err)) throw contactPhoneConflictError()
    throw err
  }
}

async function createGodownUser(payload) {
  try {
    return await User.create(payload)
  } catch (err) {
    if (isContactPhoneDuplicate(err)) throw contactPhoneConflictError()
    throw err
  }
}

async function contactPhoneTakenByOther(phone, userId) {
  const conflict = await User.findOne({
    contactPhone: phone,
    _id: { $ne: userId },
  }).lean()
  return Boolean(conflict)
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

  const siteName = godown.name ? String(godown.name).trim() : undefined

  if (user) {
    user.email = email
    user.passwordHash = passwordHash
    user.role = 'GODOWN'
    user.godownId = godownId
    if (siteName) user.siteName = siteName
    user.active = true
    if (!(await contactPhoneTakenByOther(phone, user._id))) {
      user.contactPhone = phone
    }
    return saveGodownUser(user)
  }

  const payload = {
    email,
    passwordHash,
    role: 'GODOWN',
    godownId,
    contactPhone: phone,
    siteName,
    active: true,
  }

  try {
    return await createGodownUser(payload)
  } catch (err) {
    if (err.code !== 'CONTACT_PHONE_CONFLICT') throw err
    const linked = await User.findOne({ role: 'GODOWN', godownId })
    if (linked) {
      linked.email = email
      linked.passwordHash = passwordHash
      linked.role = 'GODOWN'
      linked.godownId = godownId
      if (siteName) linked.siteName = siteName
      linked.active = true
      return saveGodownUser(linked)
    }
    return createGodownUser({ ...payload, contactPhone: undefined })
  }
}

/**
 * Deactivate the GODOWN User linked to a godown (on soft-delete).
 * @param {string} godownId
 */
async function deactivateGodownLoginUser(godownId) {
  const id = String(godownId)
  const user = await User.findOne({ role: 'GODOWN', godownId: id })
  if (!user) return null
  user.active = false
  await user.save()
  return user
}

module.exports = { syncGodownLoginUser, deactivateGodownLoginUser, makeGodownEmail }
