const bcrypt = require('bcryptjs')
const User = require('../models/User')

function mapUser(u) {
  return {
    id: String(u._id),
    email: u.email,
    loginId: u.loginId,
    role: u.role,
    godownId: u.godownId,
    siteName: u.siteName,
    siteAddress: u.siteAddress,
    contactPhone: u.contactPhone,
    contactName: u.contactName,
    active: u.active,
    createdAt: u.createdAt,
  }
}

function makeInternalEmail(mobile, siteName) {
  const base = mobile ? String(mobile).replace(/\D/g, '') : String(siteName || 'biller')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 40)
  return `biller_${base || Date.now()}@wf360.local`
}

async function listUsers(req, res) {
  const users = await User.find({}).sort({ createdAt: -1 }).lean()
  return res.json(users.map(mapUser))
}

async function listBillers(req, res) {
  const users = await User.find({ role: 'BILLER', active: true }).sort({ siteName: 1 }).lean()
  return res.json(users.map(mapUser))
}

async function createUser(req, res) {
  try {
    const { email, loginId, password, role, godownId, active, siteName, siteAddress, contactPhone, contactName } =
      req.body || {}
    if (!password || !role) return res.status(400).json({ message: 'password and role required' })

    const normalizedLoginId = loginId ? String(loginId).trim().toUpperCase() : undefined
    let normalizedEmail = email ? String(email).toLowerCase().trim() : undefined

    if (!normalizedEmail && !normalizedLoginId) {
      return res.status(400).json({ message: 'email or loginId required' })
    }

    if (!normalizedEmail && role === 'BILLER') {
      normalizedEmail = makeInternalEmail(contactPhone, siteName)
    }

    if (normalizedEmail) {
      const exists = await User.findOne({ email: normalizedEmail }).lean()
      if (exists) return res.status(400).json({ message: 'User already exists' })
    }
    if (normalizedLoginId) {
      const exists = await User.findOne({ loginId: normalizedLoginId }).lean()
      if (exists) return res.status(400).json({ message: 'loginId already exists' })
    }

    const saltRounds = Number(process.env.BCRYPT_ROUNDS || 10)
    const passwordHash = await bcrypt.hash(String(password), saltRounds)
    const user = await User.create({
      email: normalizedEmail,
      loginId: normalizedLoginId,
      passwordHash,
      role,
      godownId: godownId || undefined,
      siteName: siteName ? String(siteName).trim() : undefined,
      siteAddress: siteAddress ? String(siteAddress).trim() : undefined,
      contactPhone: contactPhone ? String(contactPhone).trim() : undefined,
      contactName: contactName ? String(contactName).trim() : undefined,
      active: active !== undefined ? Boolean(active) : true,
    })

    return res.status(201).json(mapUser(user.toObject()))
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Create user failed' })
  }
}

async function createBiller(req, res) {
  try {
    const { email, siteName, siteAddress, contactPhone, contactName, password } = req.body || {}
    if (!siteName || !String(siteName).trim()) {
      return res.status(400).json({ message: 'siteName (company/office name) required' })
    }
    const pwd = password || '123456'
    req.body = {
      email: email || undefined,
      password: pwd,
      role: 'BILLER',
      siteName,
      siteAddress,
      contactPhone,
      contactName,
    }
    return createUser(req, res)
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Create biller failed' })
  }
}

async function updateUser(req, res) {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'Not found' })
    const { siteName, siteAddress, contactPhone, contactName, godownId, active } = req.body || {}
    if (siteName !== undefined) user.siteName = siteName ? String(siteName).trim() : undefined
    if (siteAddress !== undefined) user.siteAddress = siteAddress ? String(siteAddress).trim() : undefined
    if (contactPhone !== undefined) user.contactPhone = contactPhone ? String(contactPhone).trim() : undefined
    if (contactName !== undefined) user.contactName = contactName ? String(contactName).trim() : undefined
    if (godownId !== undefined) user.godownId = godownId || undefined
    if (active !== undefined) user.active = Boolean(active)
    await user.save()
    return res.json(mapUser(user.toObject()))
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Update failed' })
  }
}

async function setUserActive(req, res) {
  try {
    const { id } = req.params
    const { active } = req.body || {}
    const user = await User.findById(id)
    if (!user) return res.status(404).json({ message: 'Not found' })
    user.active = Boolean(active)
    await user.save()
    return res.json({ id: String(user._id), active: user.active })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Update failed' })
  }
}

async function resetPassword(req, res) {
  try {
    const { id } = req.params
    const { password } = req.body || {}
    if (!password) return res.status(400).json({ message: 'password required' })
    const user = await User.findById(id)
    if (!user) return res.status(404).json({ message: 'Not found' })
    const saltRounds = Number(process.env.BCRYPT_ROUNDS || 10)
    user.passwordHash = await bcrypt.hash(String(password), saltRounds)
    await user.save()
    return res.json({ id: String(user._id) })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Reset failed' })
  }
}

module.exports = { listUsers, listBillers, createUser, createBiller, updateUser, setUserActive, resetPassword }
