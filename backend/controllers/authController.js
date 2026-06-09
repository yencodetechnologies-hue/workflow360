const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('../models/User')
const Godown = require('../models/Godown')
const { normalizePhone } = require('../utils/phone')
const { syncGodownLoginUser } = require('../utils/syncGodownUser')
const { logActivity } = require('../utils/activityLog')

function signToken(user) {
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev_jwt_secret_change_me')
  if (!secret) throw new Error('JWT_SECRET not configured')
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  return jwt.sign({ sub: String(user._id), role: user.role }, secret, { expiresIn })
}

function isValidGodownObjectId(id) {
  return id != null && mongoose.Types.ObjectId.isValid(String(id))
}

async function mapUser(user) {
  const rawGodownId = user.godownId ? String(user.godownId) : undefined
  const godownId =
    user.role === 'GODOWN' && rawGodownId && isValidGodownObjectId(rawGodownId)
      ? rawGodownId
      : undefined

  const base = {
    id: String(user._id),
    email: user.email,
    loginId: user.loginId,
    role: user.role,
    godownId,
    siteName: user.siteName,
    siteAddress: user.siteAddress,
    contactPhone: user.contactPhone,
    contactName: user.contactName,
  }

  if (godownId) {
    const g = await Godown.findById(godownId).select('name').lean()
    if (g?.name) {
      base.godownName = g.name
      if (!base.siteName) base.siteName = g.name
    }
  }

  return base
}

async function findUserByLoginId(loginId) {
  const normalized = String(loginId).trim().toUpperCase()
  return User.findOne({ loginId: normalized })
}

async function findUserByEmail(email) {
  return User.findOne({ email: String(email).toLowerCase().trim() })
}

async function findUserByPhone(normalizedPhone) {
  if (!normalizedPhone) return null
  const direct = await User.findOne({ contactPhone: normalizedPhone })
  if (direct) return direct
  const users = await User.find({
    contactPhone: { $exists: true, $nin: [null, ''] },
  })
  return users.find((u) => normalizePhone(u.contactPhone) === normalizedPhone) || null
}

async function findActiveGodownByMobile(normalizedPhone) {
  if (!normalizedPhone) return null
  const direct = await Godown.findOne({ active: true, mobile: normalizedPhone })
    .select('+passwordHash')
    .lean()
  if (direct) return direct
  const candidates = await Godown.find({
    active: true,
    mobile: { $exists: true, $nin: [null, ''] },
  })
    .select('+passwordHash')
    .lean()
  return candidates.find((gd) => normalizePhone(gd.mobile) === normalizedPhone) || null
}

async function ensureGodownLinked(user) {
  if (user.role !== 'GODOWN') return user

  const raw = user.godownId ? String(user.godownId) : ''
  if (raw && isValidGodownObjectId(raw)) return user

  const phone = normalizePhone(user.contactPhone)
  if (!phone) return user

  const g = await findActiveGodownByMobile(phone)
  if (!g) return user

  try {
    const synced = await syncGodownLoginUser(g, { passwordHash: user.passwordHash })
    return synced || user
  } catch (err) {
    if (err.code !== 'CONTACT_PHONE_CONFLICT') throw err
    const linked = await User.findOne({ role: 'GODOWN', godownId: String(g._id) })
    return linked?.active ? linked : user
  }
}

async function loginViaGodownFallback(normalizedPhone, password) {
  const g = await findActiveGodownByMobile(normalizedPhone)
  if (!g || !g.passwordHash) return null

  const ok = await bcrypt.compare(String(password), g.passwordHash)
  if (!ok) return null

  try {
    return await syncGodownLoginUser(g, { passwordHash: g.passwordHash })
  } catch (err) {
    if (err.code !== 'CONTACT_PHONE_CONFLICT') throw err
    const linked = await User.findOne({ role: 'GODOWN', godownId: String(g._id) })
    return linked?.active ? linked : null
  }
}

async function resolveUser({ identifier, email, loginId }) {
  if (loginId) {
    return findUserByLoginId(loginId)
  }

  const raw = identifier != null ? String(identifier).trim() : email != null ? String(email).trim() : ''
  if (!raw) return null

  if (raw.includes('@')) {
    return findUserByEmail(raw)
  }

  const phone = normalizePhone(raw)
  if (phone) {
    const byPhone = await findUserByPhone(phone)
    if (byPhone) return byPhone
  }

  return findUserByLoginId(raw)
}

async function login(req, res) {
  try {
    const { identifier, email, loginId, password } = req.body || {}
    if (!password) {
      return res.status(400).json({ message: 'password is required' })
    }

    const id = loginId || identifier || email
    if (!id) {
      return res.status(400).json({ message: 'identifier (email, mobile, or loginId) and password are required' })
    }

    const rawId = identifier || email
    const isEmail = rawId && String(rawId).includes('@')
    const phone = !loginId && !isEmail ? normalizePhone(rawId) : null

    let user = await resolveUser({ identifier: identifier || email, email, loginId })

    let passwordOk = false
    if (user?.active) {
      passwordOk = await bcrypt.compare(String(password), user.passwordHash)
    }

    if (!passwordOk && phone) {
      const fromGodown = await loginViaGodownFallback(phone, password)
      if (fromGodown?.active) {
        user = fromGodown
        passwordOk = true
      }
    }

    if (!user || !user.active || !passwordOk) {
      logActivity({
        req,
        actor: { userId: null, role: null, name: String(loginId || identifier || email || '') },
        action: 'LOGIN_FAILED',
        category: 'AUTH',
        details: { identifier: String(loginId || identifier || email || '') },
      })
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    user = await ensureGodownLinked(user)

    logActivity({
      req,
      actor: {
        userId: String(user._id),
        role: user.role,
        name: user.email || user.loginId || user.siteName || user.contactName,
      },
      action: 'LOGIN',
      category: 'AUTH',
      details: { role: user.role },
    })

    const token = signToken(user)
    return res.json({ token, user: await mapUser(user) })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Login failed' })
  }
}

async function me(req, res) {
  const user = await User.findById(req.user.id).lean()
  if (!user || !user.active) return res.status(401).json({ message: 'Invalid token' })
  return res.json({ user: await mapUser(user) })
}

module.exports = { login, me }
