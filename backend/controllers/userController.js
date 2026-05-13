const bcrypt = require('bcryptjs')
const User = require('../models/User')

async function listUsers(req, res) {
  const users = await User.find({}).sort({ createdAt: -1 }).lean()
  return res.json(
    users.map((u) => ({
      id: String(u._id),
      email: u.email,
      role: u.role,
      godownId: u.godownId,
      siteName: u.siteName,
      contactPhone: u.contactPhone,
      active: u.active,
      createdAt: u.createdAt,
    })),
  )
}

async function createUser(req, res) {
  try {
    const { email, password, role, godownId, active, siteName, contactPhone } = req.body || {}
    if (!email || !password || !role) return res.status(400).json({ message: 'email, password, role required' })

    const normalized = String(email).toLowerCase().trim()
    const exists = await User.findOne({ email: normalized }).lean()
    if (exists) return res.status(400).json({ message: 'User already exists' })

    const saltRounds = Number(process.env.BCRYPT_ROUNDS || 10)
    const passwordHash = await bcrypt.hash(String(password), saltRounds)
    const user = await User.create({
      email: normalized,
      passwordHash,
      role,
      godownId: godownId || undefined,
      siteName: siteName ? String(siteName).trim() : undefined,
      contactPhone: contactPhone ? String(contactPhone).trim() : undefined,
      active: active !== undefined ? Boolean(active) : true,
    })

    return res.status(201).json({
      id: String(user._id),
      email: user.email,
      role: user.role,
      godownId: user.godownId,
      siteName: user.siteName,
      contactPhone: user.contactPhone,
      active: user.active,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Create user failed' })
  }
}

async function updateUser(req, res) {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'Not found' })
    const { siteName, contactPhone, godownId, active } = req.body || {}
    if (siteName !== undefined) user.siteName = siteName ? String(siteName).trim() : undefined
    if (contactPhone !== undefined) user.contactPhone = contactPhone ? String(contactPhone).trim() : undefined
    if (godownId !== undefined) user.godownId = godownId || undefined
    if (active !== undefined) user.active = Boolean(active)
    await user.save()
    return res.json({
      id: String(user._id),
      email: user.email,
      role: user.role,
      godownId: user.godownId,
      siteName: user.siteName,
      contactPhone: user.contactPhone,
      active: user.active,
    })
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

module.exports = { listUsers, createUser, updateUser, setUserActive, resetPassword }

