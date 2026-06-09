const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const Godown = require('../models/Godown')
const Delivery = require('../models/Delivery')
const { dispatchCompleteAsync } = require('./deliveryController')
const { normalizePhone } = require('../utils/phone')
const { syncGodownLoginUser, deactivateGodownLoginUser } = require('../utils/syncGodownUser')
const { logActivity } = require('../utils/activityLog')

const saltRounds = () => Number(process.env.BCRYPT_ROUNDS || 10)

function mapGodown(g) {
  return {
    id: String(g._id),
    name: g.name,
    code: g.code,
    address: g.address,
    mobile: g.mobile,
    location: g.location,
    city: g.city,
    manager: g.manager,
  }
}

async function listGodowns(req, res) {
  const filter = { active: true }
  if (req.user.role === 'GODOWN' && req.user.godownId) {
    if (!mongoose.Types.ObjectId.isValid(req.user.godownId)) {
      return res.json([])
    }
    filter._id = req.user.godownId
  }
  const list = await Godown.find(filter).sort({ name: 1 }).lean()
  return res.json(list.map(mapGodown))
}

async function createGodown(req, res) {
  try {
    const { name, code, address, mobile, location, city, manager, password } = req.body || {}
    if (!name) return res.status(400).json({ message: 'name required' })
    if (!code || !String(code).trim()) return res.status(400).json({ message: 'code required' })
    const mobileTrim = mobile ? String(mobile).trim() : ''
    if (!mobileTrim) return res.status(400).json({ message: 'mobile required' })
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'password required (min 6 characters)' })
    }

    const passwordHash = await bcrypt.hash(String(password), saltRounds())
    const mobileNormalized = normalizePhone(mobileTrim) || mobileTrim

    const g = await Godown.create({
      name: String(name).trim(),
      code: String(code).trim().toUpperCase(),
      address: address ? String(address).trim() : '',
      mobile: mobileNormalized,
      location: location ? String(location).trim() : '',
      city: city ? String(city).trim() : '',
      manager: manager ? String(manager).trim() : '',
      passwordHash,
    })

    try {
      const synced = await syncGodownLoginUser(g, { passwordHash })
      if (!synced) {
        await Godown.findByIdAndDelete(g._id)
        return res.status(400).json({
          message: 'Could not create godown login user: mobile number is invalid',
        })
      }
    } catch (syncErr) {
      await Godown.findByIdAndDelete(g._id)
      if (syncErr.code === 'CONTACT_PHONE_CONFLICT') {
        return res.status(400).json({ message: syncErr.message })
      }
      throw syncErr
    }

    logActivity({
      req,
      action: 'GODOWN_CREATED',
      category: 'GODOWN',
      targetType: 'GODOWN',
      targetId: String(g._id),
      targetName: g.name,
      details: { code: g.code, city: g.city },
    })
    return res.status(201).json(mapGodown(g.toObject()))
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'Godown code already exists' })
    }
    return res.status(500).json({ message: err.message || 'Create godown failed' })
  }
}

async function updateGodown(req, res) {
  try {
    const { godownId } = req.params
    if (!mongoose.Types.ObjectId.isValid(godownId)) return res.status(400).json({ message: 'Invalid godown id' })

    const g = await Godown.findById(godownId)
    if (!g || !g.active) return res.status(404).json({ message: 'Not found' })

    if (req.user.role === 'GODOWN') {
      if (!req.user.godownId || String(req.user.godownId) !== String(godownId)) {
        return res.status(403).json({ message: 'Forbidden' })
      }
    }

    const { name, code, address, mobile, location, city, manager, password } = req.body || {}

    if (name !== undefined) g.name = String(name).trim()
    if (code !== undefined) g.code = String(code).trim() ? String(code).trim().toUpperCase() : undefined
    if (address !== undefined) g.address = address ? String(address).trim() : ''
    if (mobile !== undefined) {
      const m = mobile ? String(mobile).trim() : ''
      g.mobile = m ? normalizePhone(m) || m : ''
    }
    if (location !== undefined) g.location = location ? String(location).trim() : ''
    if (city !== undefined) g.city = city ? String(city).trim() : ''
    if (manager !== undefined) g.manager = manager ? String(manager).trim() : ''

    if (password !== undefined && String(password).trim()) {
      if (String(password).length < 6) {
        return res.status(400).json({ message: 'password must be at least 6 characters' })
      }
      g.passwordHash = await bcrypt.hash(String(password), saltRounds())
    }

    if (!g.name) return res.status(400).json({ message: 'name cannot be empty' })
    if (!g.code || !String(g.code).trim()) return res.status(400).json({ message: 'code required' })

    await g.save()

    const passwordUpdated = password !== undefined && String(password).trim()
    if (passwordUpdated || mobile !== undefined) {
      try {
        const synced = await syncGodownLoginUser(g, {
          passwordHash: passwordUpdated ? g.passwordHash : undefined,
        })
        if (!synced) {
          return res.status(400).json({
            message: 'Could not update godown login user: mobile number is invalid',
          })
        }
      } catch (syncErr) {
        if (syncErr.code === 'CONTACT_PHONE_CONFLICT') {
          return res.status(400).json({ message: syncErr.message })
        }
        throw syncErr
      }
    }

    logActivity({
      req,
      action: 'GODOWN_UPDATED',
      category: 'GODOWN',
      targetType: 'GODOWN',
      targetId: String(g._id),
      targetName: g.name,
      details: { code: g.code },
    })
    return res.json(mapGodown(g.toObject()))
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'Godown code already exists' })
    }
    return res.status(500).json({ message: err.message || 'Update failed' })
  }
}

async function deleteGodown(req, res) {
  try {
    const { godownId } = req.params
    if (!mongoose.Types.ObjectId.isValid(godownId)) {
      return res.status(400).json({ message: 'Invalid godown id' })
    }

    const g = await Godown.findById(godownId)
    if (!g || !g.active) return res.status(404).json({ message: 'Not found' })

    const deletedName = g.name
    g.active = false
    await g.save()
    await deactivateGodownLoginUser(godownId)
    logActivity({
      req,
      action: 'GODOWN_DELETED',
      category: 'GODOWN',
      targetType: 'GODOWN',
      targetId: String(godownId),
      targetName: deletedName,
    })
    return res.json({ message: 'Godown deleted' })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Delete failed' })
  }
}

async function getGodown(req, res) {
  const { godownId } = req.params
  if (!mongoose.Types.ObjectId.isValid(godownId)) return res.status(400).json({ message: 'Invalid godown id' })
  const g = await Godown.findById(godownId).lean()
  if (!g || !g.active) return res.status(404).json({ message: 'Not found' })
  if (req.user.role === 'GODOWN' && req.user.godownId && String(req.user.godownId) !== String(godownId)) {
    return res.status(403).json({ message: 'Forbidden' })
  }
  return res.json(mapGodown(g))
}

function dayRange(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map((x) => Number(x))
  const start = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0))
  const end = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + 1, 0, 0, 0))
  return { start, end }
}

async function queueByDate(req, res) {
  const date = req.query.date
  if (!date) return res.status(400).json({ message: 'date=YYYY-MM-DD required' })

  const { start, end } = dayRange(date)
  const q = {
    deliveryAt: { $gte: start, $lt: end },
    status: {
      $in: ['PROCESSED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN'],
    },
  }

  if (req.user.role === 'GODOWN' && req.user.godownId) {
    const gid = new mongoose.Types.ObjectId(String(req.user.godownId))
    q.$or = [{ fromGodownId: gid }, { 'lines.godownId': gid }]
    delete q.fromGodownId
  }

  const deliveries = await Delivery.find(q).sort({ deliveryAt: 1 }).lean()
  return res.json(
    await Promise.all(
      deliveries.map(async (d) => {
        const dispatchComplete = await dispatchCompleteAsync(d)
        return {
          id: String(d._id),
          deliveryNo: d.deliveryNo,
          customerName: d.customerName,
          siteName: d.siteName,
          siteAddress: d.siteAddress,
          deliveryAt: d.deliveryAt,
          returnExpectedAt: d.returnExpectedAt,
          status: d.status,
          fromGodownId: String(d.fromGodownId),
          lines: d.lines,
          qtyProgress: { dispatchComplete },
          scanProgress: { dispatchComplete },
        }
      }),
    ),
  )
}

module.exports = { listGodowns, createGodown, updateGodown, deleteGodown, getGodown, queueByDate }

