const mongoose = require('mongoose')
const Delivery = require('../models/Delivery')
const InventoryLedger = require('../models/InventoryLedger')
const Product = require('../models/Product')
const Godown = require('../models/Godown')

function dayRange(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map((x) => Number(x))
  const start = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0))
  const end = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + 1, 0, 0, 0))
  return { start, end }
}

function monthRange(monthStr) {
  const [y, m] = String(monthStr).split('-').map((x) => Number(x))
  const start = new Date(Date.UTC(y, (m || 1) - 1, 1, 0, 0, 0))
  const end = new Date(Date.UTC(y, m || 1, 1, 0, 0, 0))
  return { start, end }
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function applyRoleScope(req, q) {
  if (req.user.role === 'DELIVERY') q.assignedDeliveryUserId = req.user.id
  if (req.user.role === 'GODOWN' && req.user.godownId) {
    const gid = new mongoose.Types.ObjectId(String(req.user.godownId))
    q.$or = [{ fromGodownId: gid }, { 'lines.godownId': gid }]
  }
}

function applyAdminFilters(req, q) {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'BILLER') return

  const godownId = String(req.query.godownId || '').trim()
  if (godownId) {
    if (!mongoose.Types.ObjectId.isValid(godownId)) return { error: 'Invalid godownId' }
    q.fromGodownId = new mongoose.Types.ObjectId(godownId)
  }

  const site = String(req.query.site || '').trim()
  if (site) {
    const rx = { $regex: escapeRegex(site), $options: 'i' }
    q.$and = q.$and || []
    q.$and.push({ $or: [{ siteName: rx }, { siteAddress: rx }] })
  }

  return null
}

function tagMissingCount(d) {
  const dispatched = new Set(d.dispatchedTagIds || [])
  const returned = new Set(d.returnedTagIds || [])
  return Array.from(dispatched).filter((t) => !returned.has(t)).length
}

function tagMissingIds(d) {
  const dispatched = new Set(d.dispatchedTagIds || [])
  const returned = new Set(d.returnedTagIds || [])
  return Array.from(dispatched).filter((t) => !returned.has(t))
}

async function loadProductMap(productIds) {
  const ids = [...new Set(productIds.filter(Boolean))]
  if (!ids.length) return new Map()
  const products = await Product.find({ _id: { $in: ids } }).lean()
  return new Map(products.map((p) => [String(p._id), p]))
}

async function loadGodownMap(godownIds) {
  const ids = [...new Set(godownIds.filter(Boolean))]
  if (!ids.length) return new Map()
  const godowns = await Godown.find({ _id: { $in: ids } }).lean()
  return new Map(godowns.map((g) => [String(g._id), g]))
}

function mapBillerLines(lines, productMap) {
  return (lines || [])
    .filter((l) => (l.qty || 0) > 0)
    .map((l) => {
      const p = productMap.get(String(l.productId))
      return {
        productId: String(l.productId),
        qty: l.qty,
        note: l.note,
        particulars: p?.particulars,
        sku: p?.sku || p?.s_no,
      }
    })
}

function deliveryHasMissing(d) {
  const tagMissing = tagMissingCount(d)
  const billerMissing = (d.billerMissingLines || []).some((l) => (l.qty || 0) > 0)
  return tagMissing > 0 || billerMissing || d.status === 'PENDING_RETURN'
}

async function buildMissingQuery(req) {
  const q = {}
  applyRoleScope(req, q)

  const filterErr = applyAdminFilters(req, q)
  if (filterErr) return { error: filterErr }

  const date = String(req.query.date || '').trim()
  if (date) {
    const { start, end } = dayRange(date)
    q.deliveryAt = { $gte: start, $lt: end }
  }

  const deliveries = await Delivery.find(q).sort({ deliveryAt: -1, updatedAt: -1 }).limit(500).lean()
  const filtered = deliveries.filter(deliveryHasMissing)
  return { deliveries: filtered }
}

async function mapMissingRows(deliveries) {
  const productIds = deliveries.flatMap((d) => (d.billerMissingLines || []).map((l) => String(l.productId)))
  const godownIds = deliveries.map((d) => String(d.fromGodownId))
  const [productMap, godownMap] = await Promise.all([loadProductMap(productIds), loadGodownMap(godownIds)])

  return deliveries.map((d) => {
    const missing = tagMissingIds(d)
    const productMissing = mapBillerLines(d.billerMissingLines, productMap)
    const g = godownMap.get(String(d.fromGodownId))
    return {
      id: String(d._id),
      deliveryNo: d.deliveryNo,
      customerName: d.customerName,
      siteName: d.siteName,
      siteAddress: d.siteAddress,
      deliveryAt: d.deliveryAt,
      status: d.status,
      fromGodownId: String(d.fromGodownId),
      godownName: g?.name,
      missingCount: missing.length,
      missingTagIds: missing.slice(0, 50),
      missingTotal: d.missingTotal,
      damageTotal: d.damageTotal,
      productMissing,
    }
  })
}

async function dailyDeliveryReport(req, res) {
  const date = req.query.date
  if (!date) return res.status(400).json({ message: 'date=YYYY-MM-DD required' })
  const { start, end } = dayRange(date)

  const q = { deliveryAt: { $gte: start, $lt: end } }
  applyRoleScope(req, q)
  const filterErr = applyAdminFilters(req, q)
  if (filterErr) return res.status(400).json({ message: filterErr.error })

  const deliveries = await Delivery.find(q).sort({ deliveryAt: 1 }).lean()
  const godownIds = deliveries.map((d) => String(d.fromGodownId))
  const godownMap = await loadGodownMap(godownIds)

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
    deliveries: deliveries.map((d) => {
      const g = godownMap.get(String(d.fromGodownId))
      return {
        id: String(d._id),
        deliveryNo: d.deliveryNo,
        customerName: d.customerName,
        siteName: d.siteName,
        siteAddress: d.siteAddress,
        fromGodownId: String(d.fromGodownId),
        godownName: g?.name,
        deliveryAt: d.deliveryAt,
        status: d.status,
        dispatched: (d.dispatchedTagIds || []).length,
        returned: (d.returnedTagIds || []).length,
        lost: (d.lostTagIds || []).length,
        damaged: (d.damagedTagIds || []).length,
        missingTotal: d.missingTotal,
      }
    }),
  })
}

async function calendarReport(req, res) {
  const month = String(req.query.month || '').trim()
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: 'month=YYYY-MM required' })
  }

  const { start, end } = monthRange(month)
  const q = { deliveryAt: { $gte: start, $lt: end } }
  applyRoleScope(req, q)
  const filterErr = applyAdminFilters(req, q)
  if (filterErr) return res.status(400).json({ message: filterErr.error })

  const deliveries = await Delivery.find(q).select('deliveryAt status').lean()
  const byDay = new Map()

  for (const d of deliveries) {
    const dt = new Date(d.deliveryAt)
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
    if (!byDay.has(key)) byDay.set(key, { total: 0, byStatus: {} })
    const bucket = byDay.get(key)
    bucket.total += 1
    bucket.byStatus[d.status] = (bucket.byStatus[d.status] || 0) + 1
  }

  const days = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }))

  return res.json({ month, days })
}

async function sitesList(req, res) {
  const monthsBack = Math.min(24, Math.max(1, Number(req.query.months || 6)))
  const since = new Date()
  since.setUTCMonth(since.getUTCMonth() - monthsBack)

  const q = { deliveryAt: { $gte: since }, siteName: { $exists: true, $ne: '' } }
  applyRoleScope(req, q)
  const filterErr = applyAdminFilters(req, q)
  if (filterErr) return res.status(400).json({ message: filterErr.error })

  const sites = await Delivery.distinct('siteName', q)
  return res.json(sites.filter(Boolean).sort((a, b) => a.localeCompare(b)).slice(0, 200))
}

async function missingReport(req, res) {
  const limit = Math.min(200, Number(req.query.limit || 100))
  const result = await buildMissingQuery(req)
  if (result.error) return res.status(400).json({ message: result.error.error })

  const rows = await mapMissingRows(result.deliveries.slice(0, limit))
  return res.json(rows)
}

async function missingProductsReport(req, res) {
  const result = await buildMissingQuery(req)
  if (result.error) return res.status(400).json({ message: result.error.error })

  const limit = Math.min(200, Number(req.query.limit || 100))
  const deliveries = result.deliveries.slice(0, limit)

  const productIds = deliveries.flatMap((d) => (d.billerMissingLines || []).map((l) => String(l.productId)))
  const productMap = await loadProductMap(productIds)

  const agg = new Map()

  for (const d of deliveries) {
    for (const line of d.billerMissingLines || []) {
      if (!line.qty || line.qty <= 0) continue
      const pid = String(line.productId)
      if (!agg.has(pid)) {
        const p = productMap.get(pid)
        agg.set(pid, {
          productId: pid,
          particulars: p?.particulars,
          sku: p?.sku || p?.s_no,
          totalQty: 0,
          deliveries: [],
        })
      }
      const row = agg.get(pid)
      row.totalQty += line.qty
      row.deliveries.push({
        id: String(d._id),
        deliveryNo: d.deliveryNo,
        qty: line.qty,
      })
    }
  }

  const rows = [...agg.values()]
    .map((r) => ({
      ...r,
      deliveryCount: r.deliveries.length,
    }))
    .sort((a, b) => b.totalQty - a.totalQty)

  return res.json(rows)
}

async function stockReport(req, res) {
  const match = {}
  if (req.user.role === 'GODOWN' && req.user.godownId) {
    if (!mongoose.Types.ObjectId.isValid(req.user.godownId)) {
      return res.status(400).json({ message: 'Invalid user godownId' })
    }
    match.godownId = new mongoose.Types.ObjectId(req.user.godownId)
  } else if (req.user.role === 'ADMIN') {
    const gid = String(req.query.godownId || '').trim()
    if (gid) {
      if (!mongoose.Types.ObjectId.isValid(gid)) return res.status(400).json({ message: 'Invalid godownId' })
      match.godownId = new mongoose.Types.ObjectId(gid)
    }
  }

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

  const productIds = rows.map((r) => String(r._id.productId))
  const godownIds = rows.map((r) => String(r._id.godownId))
  const [productMap, godownMap] = await Promise.all([loadProductMap(productIds), loadGodownMap(godownIds)])

  return res.json(
    rows.map((r) => {
      const p = productMap.get(String(r._id.productId))
      const g = godownMap.get(String(r._id.godownId))
      return {
        godownId: String(r._id.godownId),
        godownName: g?.name,
        productId: String(r._id.productId),
        particulars: p?.particulars,
        sku: p?.sku || p?.s_no,
        qty: r.qty,
      }
    }),
  )
}

async function customerHistory(req, res) {
  const q = String(req.query.q || '').trim()
  if (!q) return res.status(400).json({ message: 'q required' })

  const deliveries = await Delivery.find({
    customerName: { $regex: escapeRegex(q), $options: 'i' },
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

module.exports = {
  dailyDeliveryReport,
  calendarReport,
  sitesList,
  missingReport,
  missingProductsReport,
  stockReport,
  customerHistory,
}
