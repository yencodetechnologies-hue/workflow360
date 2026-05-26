const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
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



/* =========================================================
   ADMIN EDIT PROFILE API
========================================================= */

async function getMyProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).lean()

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    return res.json({
      id: String(user._id),
      email: user.email,
      loginId: user.loginId,
      role: user.role,
      godownId: user.godownId,
      siteName: user.siteName,
      siteAddress: user.siteAddress,
      contactPhone: user.contactPhone,
      contactName: user.contactName,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  } catch (err) {
    return res.status(500).json({
      message: err.message || 'Failed to load profile',
    })
  }
}

async function updateMyProfile(req, res) {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    const {
      email,
      loginId,
      password,
      godownId,
      siteName,
      siteAddress,
      contactPhone,
      contactName,
    } = req.body || {}

    /* ==============================
       EMAIL UPDATE
    ============================== */

    if (email !== undefined) {
      const normalizedEmail = String(email)
        .toLowerCase()
        .trim()

      const emailExists = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      }).lean()

      if (emailExists) {
        return res.status(400).json({
          message: 'Email already exists',
        })
      }

      user.email = normalizedEmail
    }

    /* ==============================
       LOGIN ID UPDATE
    ============================== */

    if (loginId !== undefined) {
      const normalizedLoginId = String(loginId)
        .trim()
        .toUpperCase()

      const loginExists = await User.findOne({
        loginId: normalizedLoginId,
        _id: { $ne: user._id },
      }).lean()

      if (loginExists) {
        return res.status(400).json({
          message: 'loginId already exists',
        })
      }

      user.loginId = normalizedLoginId
    }

    /* ==============================
       PASSWORD UPDATE
    ============================== */

    if (password && String(password).trim()) {
      const saltRounds = Number(
        process.env.BCRYPT_ROUNDS || 10,
      )

      user.passwordHash = await bcrypt.hash(
        String(password),
        saltRounds,
      )
    }

    /* ==============================
       OTHER FIELDS
    ============================== */

    if (godownId !== undefined) {
      if (user.role !== 'GODOWN') {
        user.godownId = undefined
      } else {
        const trimmed = godownId != null ? String(godownId).trim() : ''
        if (!trimmed) {
          user.godownId = undefined
        } else if (!mongoose.Types.ObjectId.isValid(trimmed)) {
          return res.status(400).json({ message: 'godownId must be a valid MongoDB id' })
        } else {
          user.godownId = trimmed
        }
      }
    }

    if (siteName !== undefined) {
      user.siteName = siteName
        ? String(siteName).trim()
        : undefined
    }

    if (siteAddress !== undefined) {
      user.siteAddress = siteAddress
        ? String(siteAddress).trim()
        : undefined
    }

    if (contactPhone !== undefined) {
      user.contactPhone = contactPhone
        ? String(contactPhone).trim()
        : undefined
    }

    if (contactName !== undefined) {
      user.contactName = contactName
        ? String(contactName).trim()
        : undefined
    }

    await user.save()

    return res.json({
      message: 'Profile updated successfully',

      user: {
        id: String(user._id),
        email: user.email,
        loginId: user.loginId,
        role: user.role,
        godownId: user.godownId,
        siteName: user.siteName,
        siteAddress: user.siteAddress,
        contactPhone: user.contactPhone,
        contactName: user.contactName,
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (err) {
    console.log("adminprofileupdate",err);
    
    return res.status(500).json({
      message: err.message || 'Profile update failed',
    })
  }
}



module.exports = {   getMyProfile,
  updateMyProfile,listUsers, listBillers, createUser, createBiller, updateUser, setUserActive, resetPassword }
