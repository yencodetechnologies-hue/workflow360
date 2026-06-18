const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { validGodownId } = require('../utils/godownAccess')

function getTokenFromReq(req) {
  const header = req.headers.authorization || ''
  if (header.toLowerCase().startsWith('bearer ')) return header.slice(7)
  return null
}

async function requireAuth(req, res, next) {
    console.log("requireAuth called");
  console.log("next type =", typeof next);

  try {
    const token = getTokenFromReq(req)
    if (!token) return res.status(401).json({ message: 'Missing token' })

    const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev_jwt_secret_change_me')
    if (!secret) return res.status(500).json({ message: 'JWT_SECRET not configured' })

    const payload = jwt.verify(token, secret)
    const user = await User.findById(payload.sub).lean()
    if (!user || !user.active) return res.status(401).json({ message: 'Invalid token' })

    req.user = {
      id: String(user._id),
      email: user.email,
      loginId: user.loginId,
      role: user.role,
      godownId: validGodownId(user.role === 'GODOWN' ? user.godownId : undefined),
      siteName: user.siteName,
      siteAddress: user.siteAddress,
      contactPhone: user.contactPhone,
      contactName: user.contactName,
    }
    next()
  } catch (err) {
   console.error("AUTH ERROR:", err)
    return res.status(401).json({
      message: err.message,
      stack: err.stack
    })
  }
}

function requireRole(roles) {
  const allowed = new Set(roles)
  return (req, res, next) => {
     console.log("requireRole called")
    console.log("next type =", typeof next)
    console.log("user =", req.user)
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' })
    if (!allowed.has(req.user.role)) return res.status(403).json({ message: 'Forbidden' })
    next()
  }
}

module.exports = { requireAuth, requireRole }

