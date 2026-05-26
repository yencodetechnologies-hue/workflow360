const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Godown = require('../models/Godown')
const { normalizePhone } = require('../utils/phone')
const { syncGodownLoginUser } = require('../utils/syncGodownUser')

function signToken(user) {
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev_jwt_secret_change_me')
  if (!secret) throw new Error('JWT_SECRET not configured')
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  return jwt.sign({ sub: String(user._id), role: user.role }, secret, { expiresIn })
}

async function mapUser(user) {
  const base = {
    id: String(user._id),
    email: user.email,
    loginId: user.loginId,
    role: user.role,
    godownId: user.godownId ? String(user.godownId) : undefined,
    siteName: user.siteName,
    siteAddress: user.siteAddress,
    contactPhone: user.contactPhone,
    contactName: user.contactName,
  }

  if (user.godownId) {
    const g = await Godown.findById(user.godownId).select('name').lean()
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

async function loginViaGodownFallback(normalizedPhone, password) {
  const godowns = await Godown.find({ active: true }).select('+passwordHash').lean()
  const g = godowns.find((gd) => normalizePhone(gd.mobile) === normalizedPhone)
  if (!g || !g.passwordHash) return null

  const ok = await bcrypt.compare(String(password), g.passwordHash)
  if (!ok) return null

  return syncGodownLoginUser(g, { passwordHash: g.passwordHash })
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

    let user = await resolveUser({ identifier: identifier || email, email, loginId })

    if (!user && !loginId && !(String(identifier || email || '').includes('@'))) {
      const phone = normalizePhone(identifier || email)
      if (phone) {
        user = await loginViaGodownFallback(phone, password)
      }
    }

    if (!user || !user.active) return res.status(401).json({ message: 'Invalid credentials' })

    const ok = await bcrypt.compare(String(password), user.passwordHash)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

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
