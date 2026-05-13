const mongoose = require('mongoose')
const Godown = require('../models/Godown')
const Delivery = require('../models/Delivery')
const Product = require('../models/Product')
const GodownProduct = require('../models/GodownProduct')

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
  const list = await Godown.find({ active: true }).sort({ name: 1 }).lean()
  return res.json(list.map(mapGodown))
}

async function createGodown(req, res) {
  try {
    const { name, code, address, mobile, location, city, manager } = req.body || {}
    if (!name) return res.status(400).json({ message: 'name required' })
    if (!code || !String(code).trim()) return res.status(400).json({ message: 'code required' })

    const g = await Godown.create({
      name: String(name).trim(),
      code: String(code).trim().toUpperCase(),
      address: address ? String(address).trim() : '',
      mobile: mobile ? String(mobile).trim() : '',
      location: location ? String(location).trim() : '',
      city: city ? String(city).trim() : '',
      manager: manager ? String(manager).trim() : '',
    })

    const products = await Product.find({}).select('_id').lean()
    if (products.length) {
      await GodownProduct.insertMany(
        products.map((p) => ({ godownId: g._id, productId: p._id, enabled: true })),
        { ordered: false },
      )
    }

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

    const { name, code, address, mobile, location, city, manager } = req.body || {}

    if (name !== undefined) g.name = String(name).trim()
    if (code !== undefined) g.code = String(code).trim() ? String(code).trim().toUpperCase() : undefined
    if (address !== undefined) g.address = address ? String(address).trim() : ''
    if (mobile !== undefined) g.mobile = mobile ? String(mobile).trim() : ''
    if (location !== undefined) g.location = location ? String(location).trim() : ''
    if (city !== undefined) g.city = city ? String(city).trim() : ''
    if (manager !== undefined) g.manager = manager ? String(manager).trim() : ''

    if (!g.name) return res.status(400).json({ message: 'name cannot be empty' })
    if (!g.code || !String(g.code).trim()) return res.status(400).json({ message: 'code required' })

    await g.save()
    return res.json(mapGodown(g.toObject()))
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'Godown code already exists' })
    }
    return res.status(500).json({ message: err.message || 'Update failed' })
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
    status: { $in: ['UPCOMING', 'DISPATCHED', 'DELIVERED', 'PENDING_RETURN'] },
  }

  // GODOWN role can only see their own godown queue if user.godownId set
  if (req.user.role === 'GODOWN' && req.user.godownId) {
    q.fromGodownId = req.user.godownId
  }

  const deliveries = await Delivery.find(q).sort({ deliveryAt: 1 }).lean()
  return res.json(
    deliveries.map((d) => ({
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
    })),
  )
}

module.exports = { listGodowns, createGodown, updateGodown, getGodown, queueByDate }

