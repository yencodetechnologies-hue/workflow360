const Delivery = require('../models/Delivery')
const InventoryLedger = require('../models/InventoryLedger')

function dayRange(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map((x) => Number(x))
  const start = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0))
  const end = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + 1, 0, 0, 0))
  return { start, end }
}

async function dailyDeliveryReport(req, res) {
  const date = req.query.date
  if (!date) return res.status(400).json({ message: 'date=YYYY-MM-DD required' })
  const { start, end } = dayRange(date)

  const q = { deliveryAt: { $gte: start, $lt: end } }
  if (req.user.role === 'DELIVERY') q.assignedDeliveryUserId = req.user.id
  if (req.user.role === 'GODOWN' && req.user.godownId) q.fromGodownId = req.user.godownId

  const deliveries = await Delivery.find(q).sort({ deliveryAt: 1 }).lean()
  const counts = deliveries.reduce(
    (a, d) => {
      a.total += 1
      a.byStatus[d.status] = (a.byStatus[d.status] || 0) + 1
      a.lost += (d.lostTagIds || []).length
      a.damaged += (d.damagedTagIds || []).length
      return a
    },
    { total: 0, byStatus: {}, lost: 0, damaged: 0 },
  )

  return res.json({
    date,
    summary: counts,
    deliveries: deliveries.map((d) => ({
      id: String(d._id),
      deliveryNo: d.deliveryNo,
      customerName: d.customerName,
      siteName: d.siteName,
      siteAddress: d.siteAddress,
      deliveryAt: d.deliveryAt,
      status: d.status,
      dispatched: (d.dispatchedTagIds || []).length,
      returned: (d.returnedTagIds || []).length,
      lost: (d.lostTagIds || []).length,
      damaged: (d.damagedTagIds || []).length,
    })),
  })
}

async function missingReport(req, res) {
  const limit = Math.min(200, Number(req.query.limit || 50))
  const q = { $or: [{ lostTagIds: { $exists: true, $ne: [] } }, { status: 'PENDING_RETURN' }] }
  if (req.user.role === 'DELIVERY') q.assignedDeliveryUserId = req.user.id
  if (req.user.role === 'GODOWN' && req.user.godownId) q.fromGodownId = req.user.godownId

  const deliveries = await Delivery.find(q).sort({ updatedAt: -1 }).limit(limit).lean()
  return res.json(
    deliveries.map((d) => {
      const dispatched = new Set(d.dispatchedTagIds || [])
      const returned = new Set(d.returnedTagIds || [])
      const missing = Array.from(dispatched).filter((t) => !returned.has(t))
      return {
        id: String(d._id),
        deliveryNo: d.deliveryNo,
        customerName: d.customerName,
        deliveryAt: d.deliveryAt,
        status: d.status,
        missingCount: missing.length,
        missingTagIds: missing.slice(0, 50),
      }
    }),
  )
}

async function stockReport(req, res) {
  const match = {}
  if (req.user.role === 'GODOWN' && req.user.godownId) match.godownId = req.user.godownId
  const rows = await InventoryLedger.aggregate([
    { $match: match },
    {
      $group: {
        _id: { godownId: '$godownId', productId: '$productId' },
        qty: { $sum: '$qtyDelta' },
      },
    },
    { $sort: { qty: -1 } },
    { $limit: 5000 },
  ])

  return res.json(
    rows.map((r) => ({
      godownId: String(r._id.godownId),
      productId: String(r._id.productId),
      qty: r.qty,
    })),
  )
}

async function customerHistory(req, res) {
  const q = String(req.query.q || '').trim()
  if (!q) return res.status(400).json({ message: 'q required' })

  const deliveries = await Delivery.find({
    customerName: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
  })
    .sort({ deliveryAt: -1 })
    .limit(100)
    .lean()

  return res.json(
    deliveries.map((d) => ({
      id: String(d._id),
      deliveryNo: d.deliveryNo,
      customerName: d.customerName,
      siteName: d.siteName,
      siteAddress: d.siteAddress,
      deliveryAt: d.deliveryAt,
      status: d.status,
    })),
  )
}

module.exports = { dailyDeliveryReport, missingReport, stockReport, customerHistory }

