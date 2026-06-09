const mongoose = require('mongoose')
const Delivery = require('../models/Delivery')
const InventoryLedger = require('../models/InventoryLedger')
const Product = require('../models/Product')
const Godown = require('../models/Godown')
const User = require('../models/User')

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

function isValidDateStr(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s))
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function applyRoleScope(req, q) {
  if (req.user.role === 'DELIVERY') q.assignedDeliveryUserId = req.user.id
  if (req.user.role === 'BILLER') {
    q.billerUserId = new mongoose.Types.ObjectId(String(req.user.id))
  }
  if (req.user.role === 'GODOWN' && req.user.godownId) {
    const gid = new mongoose.Types.ObjectId(String(req.user.godownId))
    q.$or = [{ fromGodownId: gid }, { 'lines.godownId': gid }]
  }
}

function applyAdminFilters(req, q) {
  const canFilter =
    req.user.role === 'ADMIN' || req.user.role === 'BILLER' || req.user.role === 'GODOWN'

  if (!canFilter && req.user.role !== 'DELIVERY') return null

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

  const customerName = String(req.query.customerName || '').trim()
  if (customerName) {
    q.customerName = customerName
  }

  if (req.user.role !== 'BILLER') {
    const billerUserId = String(req.query.billerUserId || '').trim()
    if (billerUserId) {
      if (!mongoose.Types.ObjectId.isValid(billerUserId)) return { error: 'Invalid billerUserId' }
      q.billerUserId = new mongoose.Types.ObjectId(billerUserId)
    }
  }

  return null
}

function applyDeliveryDateFilter(req, q) {
  const dateFrom = String(req.query.dateFrom || req.query.date || '').trim()
  const dateTo = String(req.query.dateTo || '').trim()

  if (dateTo && !dateFrom) return { error: 'date or dateFrom required when dateTo is set' }
  if (dateFrom && !isValidDateStr(dateFrom)) return { error: 'Invalid date' }
  if (dateTo && !isValidDateStr(dateTo)) return { error: 'Invalid dateTo' }
  if (dateFrom && dateTo && dateFrom > dateTo) return { error: 'dateFrom must be <= dateTo' }

  if (dateFrom) {
    const { start } = dayRange(dateFrom)
    if (dateTo) {
      const { end } = dayRange(dateTo)
      q.deliveryAt = { $gte: start, $lt: end }
    } else {
      const { start: s, end } = dayRange(dateFrom)
      q.deliveryAt = { $gte: s, $lt: end }
    }
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

function sumLineQty(lines) {
  return (lines || []).reduce((s, l) => s + (Number(l.qty) || 0), 0)
}

function deliveryHasIssue(d) {
  if (d.status === 'PENDING_RETURN') return true
  if ((d.missingTotal || 0) > 0 || (d.damageTotal || 0) > 0) return true
  if (sumLineQty(d.billerMissingLines) > 0 || sumLineQty(d.billerDamagedLines) > 0) return true
  if (tagMissingCount(d) > 0) return true
  if ((d.damagedTagIds || []).length > 0 || (d.lostTagIds || []).length > 0) return true
  return false
}

function deliveryHasMissing(d) {
  return deliveryHasIssue(d)
}

function issueMetricsFromDelivery(d) {
  return {
    missingQty: sumLineQty(d.billerMissingLines),
    damageQty: sumLineQty(d.billerDamagedLines),
    missingTotal: Number(d.missingTotal) || 0,
    damageTotal: Number(d.damageTotal) || 0,
    missingTagCount: tagMissingCount(d),
    damagedTagCount: (d.damagedTagIds || []).length,
    lostTagCount: (d.lostTagIds || []).length,
  }
}

function physicalReturnMetrics(d) {
  let dispatchedQty = 0
  let returnedQty = 0
  for (const line of d.lines || []) {
    dispatchedQty += Number(line.dispatchedQty) || 0
    returnedQty += Number(line.returnedQty) || 0
  }
  return {
    dispatchedQty,
    returnedQty,
    outstandingQty: Math.max(0, dispatchedQty - returnedQty),
  }
}

function ensureGodownQueryParam(req) {
  if (!req.query.godownId && req.user.role === 'GODOWN' && req.user.godownId) {
    req.query.godownId = String(req.user.godownId)
  }
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

async function loadBillerMap(userIds) {
  const ids = [...new Set(userIds.filter(Boolean))]
  if (!ids.length) return new Map()
  const users = await User.find({ _id: { $in: ids }, role: 'BILLER' }).lean()
  return new Map(users.map((u) => [String(u._id), u]))
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

async function buildDeliveryQuery(req) {
  const q = {}
  applyRoleScope(req, q)

  const filterErr = applyAdminFilters(req, q)
  if (filterErr) return { error: filterErr }

  const dateErr = applyDeliveryDateFilter(req, q)
  if (dateErr) return { error: dateErr }

  const deliveries = await Delivery.find(q).sort({ deliveryAt: -1, updatedAt: -1 }).limit(500).lean()
  return { deliveries, issueDeliveries: deliveries.filter(deliveryHasIssue) }
}

async function buildMissingQuery(req) {
  const result = await buildDeliveryQuery(req)
  if (result.error) return result
  return { deliveries: result.issueDeliveries }
}

async function mapIssueDeliveryRows(deliveries) {
  const productIds = deliveries.flatMap((d) => [
    ...(d.billerMissingLines || []).map((l) => String(l.productId)),
    ...(d.billerDamagedLines || []).map((l) => String(l.productId)),
  ])
  const godownIds = deliveries.map((d) => String(d.fromGodownId))
  const [productMap, godownMap] = await Promise.all([loadProductMap(productIds), loadGodownMap(godownIds)])

  return deliveries.map((d) => {
    const missing = tagMissingIds(d)
    const metrics = issueMetricsFromDelivery(d)
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
      productMissing: mapBillerLines(d.billerMissingLines, productMap),
      productDamaged: mapBillerLines(d.billerDamagedLines, productMap),
      hasIssue: deliveryHasIssue(d),
      ...metrics,
    }
  })
}

async function mapMissingRows(deliveries) {
  return mapIssueDeliveryRows(deliveries)
}

async function dailyDeliveryReport(req, res) {
  const date = String(req.query.date || req.query.dateFrom || '').trim()
  if (!date) return res.status(400).json({ message: 'date=YYYY-MM-DD required' })

  const q = {}
  applyRoleScope(req, q)
  const filterErr = applyAdminFilters(req, q)
  if (filterErr) return res.status(400).json({ message: filterErr.error })

  const dateErr = applyDeliveryDateFilter(req, q)
  if (dateErr) return res.status(400).json({ message: dateErr.error })

  const deliveries = await Delivery.find(q).sort({ deliveryAt: 1 }).lean()
  const godownIds = deliveries.map((d) => String(d.fromGodownId))
  const godownMap = await loadGodownMap(godownIds)

  const counts = deliveries.reduce(
    (a, d) => {
      a.total += 1
      a.byStatus[d.status] = (a.byStatus[d.status] || 0) + 1
      a.lost += (d.lostTagIds || []).length
      a.damaged += (d.damagedTagIds || []).length
      a.missingQty += sumLineQty(d.billerMissingLines)
      a.damageQty += sumLineQty(d.billerDamagedLines)
      a.missingTotal += Number(d.missingTotal) || 0
      a.damageTotal += Number(d.damageTotal) || 0
      return a
    },
    { total: 0, byStatus: {}, lost: 0, damaged: 0, missingQty: 0, damageQty: 0, missingTotal: 0, damageTotal: 0 },
  )

  const dateTo = String(req.query.dateTo || '').trim()

  return res.json({
    date,
    dateTo: dateTo || undefined,
    summary: counts,
    deliveries: deliveries.map((d) => {
      const g = godownMap.get(String(d.fromGodownId))
      const metrics = issueMetricsFromDelivery(d)
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
        lost: metrics.lostTagCount,
        damaged: metrics.damagedTagCount,
        missingTotal: d.missingTotal,
        damageTotal: d.damageTotal,
        missingQty: metrics.missingQty,
        damageQty: metrics.damageQty,
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

async function customersList(req, res) {
  const monthsBack = Math.min(24, Math.max(1, Number(req.query.months || 6)))
  const since = new Date()
  since.setUTCMonth(since.getUTCMonth() - monthsBack)

  const q = { deliveryAt: { $gte: since }, customerName: { $exists: true, $ne: '' } }
  applyRoleScope(req, q)
  const filterErr = applyAdminFilters(req, q)
  if (filterErr) return res.status(400).json({ message: filterErr.error })

  const names = await Delivery.distinct('customerName', q)
  return res.json(names.filter(Boolean).sort((a, b) => a.localeCompare(b)).slice(0, 300))
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

async function issuesByGodown(req, res) {
  const result = await buildDeliveryQuery(req)
  if (result.error) return res.status(400).json({ message: result.error.error })

  const godownIds = result.deliveries.map((d) => String(d.fromGodownId))
  const godownMap = await loadGodownMap(godownIds)

  const byGodown = new Map()

  for (const d of result.deliveries) {
    const gid = String(d.fromGodownId)
    if (!byGodown.has(gid)) {
      const g = godownMap.get(gid)
      byGodown.set(gid, {
        godownId: gid,
        godownName: g?.name,
        totalDeliveries: 0,
        issueDeliveryCount: 0,
        missingQty: 0,
        damageQty: 0,
        missingTotal: 0,
        damageTotal: 0,
        missingTagCount: 0,
        damagedTagCount: 0,
        lostTagCount: 0,
      })
    }
    const row = byGodown.get(gid)
    row.totalDeliveries += 1
    if (!deliveryHasIssue(d)) continue

    row.issueDeliveryCount += 1
    const m = issueMetricsFromDelivery(d)
    row.missingQty += m.missingQty
    row.damageQty += m.damageQty
    row.missingTotal += m.missingTotal
    row.damageTotal += m.damageTotal
    row.missingTagCount += m.missingTagCount
    row.damagedTagCount += m.damagedTagCount
    row.lostTagCount += m.lostTagCount
  }

  const rows = [...byGodown.values()].sort((a, b) => {
    if (b.issueDeliveryCount !== a.issueDeliveryCount) return b.issueDeliveryCount - a.issueDeliveryCount
    return (a.godownName || '').localeCompare(b.godownName || '')
  })

  return res.json(rows)
}

async function issuesByDelivery(req, res) {
  const limit = Math.min(200, Number(req.query.limit || 100))
  const result = await buildDeliveryQuery(req)
  if (result.error) return res.status(400).json({ message: result.error.error })

  const rows = await mapIssueDeliveryRows(result.issueDeliveries.slice(0, limit))
  return res.json(rows)
}

async function stockReport(req, res) {
  const match = {}
  if (req.user.role === 'GODOWN' && req.user.godownId) {
    if (!mongoose.Types.ObjectId.isValid(req.user.godownId)) {
      return res.status(400).json({ message: 'Invalid user godownId' })
    }
    match.godownId = new mongoose.Types.ObjectId(req.user.godownId)
  } else if (req.user.role === 'ADMIN' || req.user.role === 'BILLER') {
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

const RETURN_PHASE_STATUSES = new Set(['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN'])

async function returnsByBiller(req, res) {
  ensureGodownQueryParam(req)
  const godownId = String(req.query.godownId || '').trim()
  if (!godownId) return res.status(400).json({ message: 'godownId required' })
  if (!mongoose.Types.ObjectId.isValid(godownId)) return res.status(400).json({ message: 'Invalid godownId' })

  const result = await buildDeliveryQuery(req)
  if (result.error) return res.status(400).json({ message: result.error.error })

  const byBiller = new Map()

  for (const d of result.deliveries) {
    if (!d.billerUserId) continue
    const bid = String(d.billerUserId)
    if (!byBiller.has(bid)) {
      byBiller.set(bid, {
        billerUserId: bid,
        deliveryCount: 0,
        missingOrderCount: 0,
        damageOrderCount: 0,
        returnSubmittedCount: 0,
        pendingReturnCount: 0,
        missingQty: 0,
        damageQty: 0,
        missingTotal: 0,
        damageTotal: 0,
        returnedQty: 0,
        dispatchedQty: 0,
        outstandingQty: 0,
      })
    }
    const row = byBiller.get(bid)
    row.deliveryCount += 1
    if (sumLineQty(d.billerMissingLines) > 0) row.missingOrderCount += 1
    if (sumLineQty(d.billerDamagedLines) > 0) row.damageOrderCount += 1
    if (d.billerReturnSubmittedAt) row.returnSubmittedCount += 1
    if (!d.billerReturnSubmittedAt && RETURN_PHASE_STATUSES.has(d.status)) {
      row.pendingReturnCount += 1
    }
    const metrics = issueMetricsFromDelivery(d)
    row.missingQty += metrics.missingQty
    row.damageQty += metrics.damageQty
    row.missingTotal += metrics.missingTotal
    row.damageTotal += metrics.damageTotal
    const physical = physicalReturnMetrics(d)
    row.returnedQty += physical.returnedQty
    row.dispatchedQty += physical.dispatchedQty
    row.outstandingQty += physical.outstandingQty
  }

  const billerIds = [...byBiller.keys()]
  const billerMap = await loadBillerMap(billerIds)

  const onlyIssues = String(req.query.onlyMissing || '1') !== '0'

  let rows = [...byBiller.values()]
    .map((row) => {
      const b = billerMap.get(row.billerUserId)
      return {
        ...row,
        billerName: b?.contactName || b?.siteName || row.billerUserId,
        siteName: b?.siteName,
      }
    })
    .sort((a, b) => {
      const aIssues = a.missingOrderCount + a.damageOrderCount
      const bIssues = b.missingOrderCount + b.damageOrderCount
      if (bIssues !== aIssues) return bIssues - aIssues
      if (b.missingQty + b.damageQty !== a.missingQty + a.damageQty) return (b.missingQty + b.damageQty) - (a.missingQty + a.damageQty)
      return (a.billerName || '').localeCompare(b.billerName || '')
    })

  if (onlyIssues) rows = rows.filter((r) => r.missingOrderCount > 0 || r.damageOrderCount > 0)

  return res.json(rows)
}

async function returnsByProduct(req, res) {
  ensureGodownQueryParam(req)
  const godownId = String(req.query.godownId || '').trim()
  if (!godownId) return res.status(400).json({ message: 'godownId required' })
  if (!mongoose.Types.ObjectId.isValid(godownId)) return res.status(400).json({ message: 'Invalid godownId' })

  const metric = String(req.query.metric || 'missing').trim()
  if (!['missing', 'damage', 'return'].includes(metric)) {
    return res.status(400).json({ message: 'metric must be missing, damage, or return' })
  }

  if (req.user.role !== 'BILLER') {
    const billerUserId = String(req.query.billerUserId || '').trim()
    if (!billerUserId) return res.status(400).json({ message: 'billerUserId required' })
    if (!mongoose.Types.ObjectId.isValid(billerUserId)) {
      return res.status(400).json({ message: 'Invalid billerUserId' })
    }
  }

  const result = await buildDeliveryQuery(req)
  if (result.error) return res.status(400).json({ message: result.error.error })

  const agg = new Map()

  for (const d of result.deliveries) {
    if (metric === 'missing') {
      for (const line of d.billerMissingLines || []) {
        if (!line.qty || line.qty <= 0) continue
        const pid = String(line.productId)
        if (!agg.has(pid)) {
          agg.set(pid, { productId: pid, totalQty: 0, deliveries: [] })
        }
        const row = agg.get(pid)
        row.totalQty += line.qty
        row.deliveries.push({
          id: String(d._id),
          deliveryNo: d.deliveryNo,
          customerName: d.customerName,
          deliveryAt: d.deliveryAt,
          qty: line.qty,
          note: line.note,
        })
      }
    } else if (metric === 'damage') {
      for (const line of d.billerDamagedLines || []) {
        if (!line.qty || line.qty <= 0) continue
        const pid = String(line.productId)
        if (!agg.has(pid)) {
          agg.set(pid, { productId: pid, totalQty: 0, deliveries: [] })
        }
        const row = agg.get(pid)
        row.totalQty += line.qty
        row.deliveries.push({
          id: String(d._id),
          deliveryNo: d.deliveryNo,
          customerName: d.customerName,
          deliveryAt: d.deliveryAt,
          qty: line.qty,
          note: line.note,
        })
      }
    } else {
      for (const line of d.lines || []) {
        const returned = Number(line.returnedQty) || 0
        if (returned <= 0) continue
        const pid = String(line.productId)
        if (!agg.has(pid)) {
          agg.set(pid, { productId: pid, totalQty: 0, deliveries: [] })
        }
        const row = agg.get(pid)
        row.totalQty += returned
        const dispatched = Number(line.dispatchedQty) || 0
        row.deliveries.push({
          id: String(d._id),
          deliveryNo: d.deliveryNo,
          qty: returned,
          dispatchedQty: dispatched,
          outstandingQty: Math.max(0, dispatched - returned),
        })
      }
    }
  }

  const productIds = [...agg.keys()]
  const productMap = await loadProductMap(productIds)

  const rows = [...agg.values()]
    .map((r) => {
      const p = productMap.get(r.productId)
      return {
        productId: r.productId,
        particulars: p?.particulars,
        sku: p?.sku || p?.s_no,
        totalQty: r.totalQty,
        deliveryCount: r.deliveries.length,
        deliveries: r.deliveries,
      }
    })
    .sort((a, b) => b.totalQty - a.totalQty)

  return res.json(rows)
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
  customersList,
  missingReport,
  missingProductsReport,
  stockReport,
  customerHistory,
  issuesByGodown,
  issuesByDelivery,
  returnsByBiller,
  returnsByProduct,
}
