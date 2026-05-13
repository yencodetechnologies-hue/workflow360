const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

function signToken(user) {
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev_jwt_secret_change_me')
  if (!secret) throw new Error('JWT_SECRET not configured')
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  return jwt.sign({ sub: String(user._id), role: user.role }, secret, { expiresIn })
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })

    const user = await User.findOne({ email: String(email).toLowerCase().trim() })
    if (!user || !user.active) return res.status(401).json({ message: 'Invalid credentials' })

    const ok = await bcrypt.compare(String(password), user.passwordHash)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

    const token = signToken(user)
    return res.json({
      token,
      user: {
        id: String(user._id),
        email: user.email,
        role: user.role,
        godownId: user.godownId,
        siteName: user.siteName,
        contactPhone: user.contactPhone,
      },
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Login failed' })
  }
}

async function me(req, res) {
  return res.json({ user: req.user })
}

module.exports = { login, me }

