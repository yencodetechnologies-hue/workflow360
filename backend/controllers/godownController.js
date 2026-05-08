const Godown = require('../models/Godown')
const Delivery = require('../models/Delivery')

async function listGodowns(req, res) {
  const list = await Godown.find({ active: true }).sort({ name: 1 }).lean()
  return res.json(list.map((g) => ({ id: String(g._id), name: g.name, city: g.city, manager: g.manager })))
}

async function createGodown(req, res) {
  const { name, city, manager } = req.body || {}
  if (!name) return res.status(400).json({ message: 'name required' })
  const g = await Godown.create({ name: String(name).trim(), city: city || '', manager: manager || '' })
  return res.status(201).json({ id: String(g._id), name: g.name, city: g.city, manager: g.manager })
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

module.exports = { listGodowns, createGodown, queueByDate }

