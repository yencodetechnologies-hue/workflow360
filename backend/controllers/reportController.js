// const mongoose = require('mongoose')
// const Delivery = require('../models/Delivery')
// const InventoryLedger = require('../models/InventoryLedger')
// const Product = require('../models/Product')
// const Godown = require('../models/Godown')
// const User = require('../models/User')

// // IST is UTC+5:30 = 330 minutes ahead of UTC.
// // To get the UTC boundaries for a local IST calendar day:
// //   IST midnight = UTC 18:30 of the *previous* day
// // We detect the server's TZ offset dynamically so this works even if the
// // server is running in UTC or IST.
// const SERVER_TZ_OFFSET_MS = new Date().getTimezoneOffset() * 60 * 1000 // negative for UTC
// const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000 // +5:30 in ms

// function dayRange(dateStr) {
//   const [y, m, d] = String(dateStr).split('-').map((x) => Number(x))
//   // Build IST midnight as a UTC instant
//   // IST midnight = UTC (day-1) 18:30:00
//   const istMidnightUTC = Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0) - IST_OFFSET_MS
//   const start = new Date(istMidnightUTC)
//   const end = new Date(istMidnightUTC + 24 * 60 * 60 * 1000)
//   return { start, end }
// }

// function monthRange(monthStr) {
//   const [y, m] = String(monthStr).split('-').map((x) => Number(x))
//   const start = new Date(Date.UTC(y, (m || 1) - 1, 1, 0, 0, 0))
//   const end = new Date(Date.UTC(y, m || 1, 1, 0, 0, 0))
//   return { start, end }
// }

// function isValidDateStr(s) {
//   return /^\d{4}-\d{2}-\d{2}$/.test(String(s))
// }

// function escapeRegex(s) {
//   return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// }

// function applyRoleScope(req, q) {
//   if (req.user.role === 'DELIVERY') q.assignedDeliveryUserId = req.user.id
//   if (req.user.role === 'BILLER') {
//     q.billerUserId = new mongoose.Types.ObjectId(String(req.user.id))
//   }
//   if (req.user.role === 'GODOWN' && req.user.godownId) {
//     const gid = new mongoose.Types.ObjectId(String(req.user.godownId))
//     q.$or = [{ fromGodownId: gid }, { 'lines.godownId': gid }]
//   }
// }

// function applyAdminFilters(req, q) {
//   const canFilter =
//     req.user.role === 'ADMIN' || req.user.role === 'BILLER' || req.user.role === 'GODOWN'

//   if (!canFilter && req.user.role !== 'DELIVERY') return null
// console.log("QUERY =", req.query);

//   // const godownId = String(req.query.godownId || '').trim()
// const godownId = Array.isArray(req.query.godownId)
//   ? req.query.godownId[0]
//   : String(req.query.godownId || '').trim()

//    console.log("Raw godownId:", req.query.godownId);
// console.log("Parsed godownId:", godownId);
  
//   if (godownId) {
//     if (!mongoose.Types.ObjectId.isValid(godownId)) return { error: 'Invalid godownId' }
//     q.fromGodownId = new mongoose.Types.ObjectId(godownId)
//   }
 
//   const site = String(req.query.site || '').trim()
//   if (site) {
//     const rx = { $regex: escapeRegex(site), $options: 'i' }
//     q.$and = q.$and || []
//     q.$and.push({ $or: [{ siteName: rx }, { siteAddress: rx }] })
//   }

//   const customerName = String(req.query.customerName || '').trim()
//   if (customerName) {
//     q.customerName = customerName
//   }

//   if (req.user.role !== 'BILLER') {
//     const billerUserId = String(req.query.billerUserId || '').trim()
//     if (billerUserId) {
//       if (!mongoose.Types.ObjectId.isValid(billerUserId)) return { error: 'Invalid billerUserId' }
//       q.billerUserId = new mongoose.Types.ObjectId(billerUserId)
//     }
//   }

//   return null
// }

// function applyDeliveryDateFilter(req, q) {
//   const dateFrom = String(req.query.dateFrom || req.query.date || '').trim()
//   const dateTo = String(req.query.dateTo || '').trim()

//   if (dateTo && !dateFrom) return { error: 'date or dateFrom required when dateTo is set' }
//   if (dateFrom && !isValidDateStr(dateFrom)) return { error: 'Invalid date' }
//   if (dateTo && !isValidDateStr(dateTo)) return { error: 'Invalid dateTo' }
//   if (dateFrom && dateTo && dateFrom > dateTo) return { error: 'dateFrom must be <= dateTo' }

//   if (dateFrom) {
//     const { start } = dayRange(dateFrom)
//     if (dateTo) {
//       const { end } = dayRange(dateTo)
//       q.deliveryAt = { $gte: start, $lt: end }
//     } else {
//       const { start: s, end } = dayRange(dateFrom)
//       q.deliveryAt = { $gte: s, $lt: end }
//     }
//   }

//   return null
// }

// function tagMissingCount(d) {
//   const dispatched = new Set(d.dispatchedTagIds || [])
//   const returned = new Set(d.returnedTagIds || [])
//   return Array.from(dispatched).filter((t) => !returned.has(t)).length
// }

// function tagMissingIds(d) {
//   const dispatched = new Set(d.dispatchedTagIds || [])
//   const returned = new Set(d.returnedTagIds || [])
//   return Array.from(dispatched).filter((t) => !returned.has(t))
// }

// function sumLineQty(lines) {
//   return (lines || []).reduce((s, l) => s + (Number(l.qty) || 0), 0)
// }

// function deliveryHasIssue(d) {
//   if (d.status === 'PENDING_RETURN') return true
//   if ((d.missingTotal || 0) > 0 || (d.damageTotal || 0) > 0) return true
//   if (sumLineQty(d.billerMissingLines) > 0 || sumLineQty(d.billerDamagedLines) > 0) return true
//   if (tagMissingCount(d) > 0) return true
//   if ((d.damagedTagIds || []).length > 0 || (d.lostTagIds || []).length > 0) return true
//   // Also flag COMPLETED deliveries that had a biller return submitted with qty
//   if (d.status === 'COMPLETED' && d.billerReturnSubmittedAt) {
//     if (sumLineQty(d.billerDamagedLines) > 0 || sumLineQty(d.billerMissingLines) > 0) return true
//   }
//   return false
// }

// function deliveryHasMissing(d) {
//   return deliveryHasIssue(d)
// }

// function issueMetricsFromDelivery(d) {
//   // billerDamagedLines is the combined "return qty (damaged / missing)" field
//   // from the biller return form. billerMissingLines is also checked for legacy data.
//   const returnQty = sumLineQty(d.billerDamagedLines) + sumLineQty(d.billerMissingLines)
//   return {
//     missingQty: returnQty,
//     damageQty: sumLineQty(d.billerDamagedLines),
//     missingTotal: Number(d.missingTotal) || 0,
//     damageTotal: Number(d.damageTotal) || 0,
//     missingTagCount: tagMissingCount(d),
//     damagedTagCount: (d.damagedTagIds || []).length,
//     lostTagCount: (d.lostTagIds || []).length,
//   }
// }

// function physicalReturnMetrics(d) {
//   let dispatchedQty = 0
//   let returnedQty = 0
//   for (const line of d.lines || []) {
//     dispatchedQty += Number(line.dispatchedQty) || 0
//     returnedQty += Number(line.returnedQty) || 0
//   }
//   return {
//     dispatchedQty,
//     returnedQty,
//     outstandingQty: Math.max(0, dispatchedQty - returnedQty),
//   }
// }

// function ensureGodownQueryParam(req) {
//   if (!req.query.godownId && req.user.role === 'GODOWN' && req.user.godownId) {
//     req.query.godownId = String(req.user.godownId)
//   }
// }

// async function loadProductMap(productIds) {
//   const ids = [...new Set(productIds.filter(Boolean))]
//   if (!ids.length) return new Map()
//   const products = await Product.find({ _id: { $in: ids } }).lean()
//   return new Map(products.map((p) => [String(p._id), p]))
// }

// async function loadGodownMap(godownIds) {
//   const ids = [...new Set(godownIds.filter(Boolean))]
//   if (!ids.length) return new Map()
//   const godowns = await Godown.find({ _id: { $in: ids } }).lean()
//   return new Map(godowns.map((g) => [String(g._id), g]))
// }

// async function loadBillerMap(userIds) {
//   const ids = [...new Set(userIds.filter(Boolean))]
//   if (!ids.length) return new Map()
//   const users = await User.find({ _id: { $in: ids }, role: 'BILLER' }).lean()
//   return new Map(users.map((u) => [String(u._id), u]))
// }

// function mapBillerLines(lines, productMap) {
//   return (lines || [])
//     .filter((l) => (l.qty || 0) > 0)
//     .map((l) => {
//       const p = productMap.get(String(l.productId))
//       return {
//         productId: String(l.productId),
//         qty: l.qty,
//         note: l.note,
//         particulars: p?.particulars,
//         sku: p?.sku || p?.s_no,
//       }
//     })
// }

// async function buildDeliveryQuery(req) {
//   const q = {}
//   applyRoleScope(req, q)

//   const filterErr = applyAdminFilters(req, q)
//   if (filterErr) return { error: filterErr }

//   const dateErr = applyDeliveryDateFilter(req, q)
//   if (dateErr) return { error: dateErr }

//   const deliveries = await Delivery.find(q).sort({ deliveryAt: -1, updatedAt: -1 }).limit(500).lean()
//   return { deliveries, issueDeliveries: deliveries.filter(deliveryHasIssue) }
// }

// async function buildMissingQuery(req) {
//   const result = await buildDeliveryQuery(req)
//   if (result.error) return result
//   return { deliveries: result.issueDeliveries }
// }

// async function mapIssueDeliveryRows(deliveries) {
//   const productIds = deliveries.flatMap((d) => [
//     ...(d.billerMissingLines || []).map((l) => String(l.productId)),
//     ...(d.billerDamagedLines || []).map((l) => String(l.productId)),
//   ])
//   const godownIds = deliveries.map((d) => String(d.fromGodownId))
//   const [productMap, godownMap] = await Promise.all([loadProductMap(productIds), loadGodownMap(godownIds)])

//   return deliveries.map((d) => {
//     const missing = tagMissingIds(d)
//     const metrics = issueMetricsFromDelivery(d)
//     const g = godownMap.get(String(d.fromGodownId))
//     return {
//       id: String(d._id),
//       deliveryNo: d.deliveryNo,
//       customerName: d.customerName,
//       siteName: d.siteName,
//       siteAddress: d.siteAddress,
//       deliveryAt: d.deliveryAt,
//       status: d.status,
//       fromGodownId: String(d.fromGodownId),
//       godownName: g?.name,
//       missingCount: missing.length,
//       missingTagIds: missing.slice(0, 50),
//       productMissing: mapBillerLines(d.billerMissingLines, productMap),
//       productDamaged: mapBillerLines(d.billerDamagedLines, productMap),
//       hasIssue: deliveryHasIssue(d),
//       ...metrics,
//     }
//   })
// }

// async function mapMissingRows(deliveries) {
//   return mapIssueDeliveryRows(deliveries)
// }

// async function dailyDeliveryReport(req, res) {
//   const date = String(req.query.date || req.query.dateFrom || '').trim()
//   if (!date) return res.status(400).json({ message: 'date=YYYY-MM-DD required' })

//   const q = {}
//   applyRoleScope(req, q)
//   const filterErr = applyAdminFilters(req, q)
//   if (filterErr) return res.status(400).json({ message: filterErr.error })

//   const dateErr = applyDeliveryDateFilter(req, q)
//   if (dateErr) return res.status(400).json({ message: dateErr.error })

//   const deliveries = await Delivery.find(q).sort({ deliveryAt: 1 }).lean()
//   const godownIds = deliveries.map((d) => String(d.fromGodownId))
//   const godownMap = await loadGodownMap(godownIds)

//   const counts = deliveries.reduce(
//     (a, d) => {
//       a.total += 1
//       a.byStatus[d.status] = (a.byStatus[d.status] || 0) + 1
//       a.lost += (d.lostTagIds || []).length
//       a.damaged += (d.damagedTagIds || []).length
//       a.missingQty += sumLineQty(d.billerMissingLines)
//       a.damageQty += sumLineQty(d.billerDamagedLines)
//       a.missingTotal += Number(d.missingTotal) || 0
//       a.damageTotal += Number(d.damageTotal) || 0
//       return a
//     },
//     { total: 0, byStatus: {}, lost: 0, damaged: 0, missingQty: 0, damageQty: 0, missingTotal: 0, damageTotal: 0 },
//   )

//   const dateTo = String(req.query.dateTo || '').trim()

//   return res.json({
//     date,
//     dateTo: dateTo || undefined,
//     summary: counts,
//     deliveries: deliveries.map((d) => {
//       const g = godownMap.get(String(d.fromGodownId))
//       const metrics = issueMetricsFromDelivery(d)
//       return {
//         id: String(d._id),
//         deliveryNo: d.deliveryNo,
//         customerName: d.customerName,
//         siteName: d.siteName,
//         siteAddress: d.siteAddress,
//         fromGodownId: String(d.fromGodownId),
//         godownName: g?.name,
//         deliveryAt: d.deliveryAt,
//         status: d.status,
//         dispatched: (d.dispatchedTagIds || []).length,
//         returned: (d.returnedTagIds || []).length,
//         lost: metrics.lostTagCount,
//         damaged: metrics.damagedTagCount,
//         missingTotal: d.missingTotal,
//         damageTotal: d.damageTotal,
//         missingQty: metrics.missingQty,
//         damageQty: metrics.damageQty,
//       }
//     }),
//   })
// }

// async function dailyReturnsReport(req, res) {
//   const date = String(req.query.date || req.query.dateFrom || '').trim()
//   if (!date) return res.status(400).json({ message: 'date=YYYY-MM-DD required' })
//   if (!isValidDateStr(date)) return res.status(400).json({ message: 'Invalid date' })

//   const q = {}
//   applyRoleScope(req, q)
//   const filterErr = applyAdminFilters(req, q)
//   if (filterErr) return res.status(400).json({ message: filterErr.error })

//   const { start, end } = dayRange(date)
//   q.returnExpectedAt = { $gte: start, $lt: end }

//   const deliveries = await Delivery.find(q).lean()

//   const counts = deliveries.reduce(
//     (a, d) => {
//       a.total += 1
//       a.byStatus[d.status] = (a.byStatus[d.status] || 0) + 1
//       return a
//     },
//     { total: 0, byStatus: {} },
//   )

//   const by = counts.byStatus
//   const returnDelivery = counts.total
//   const returnDispatch = by.RETURN_PICKUP || 0
//   const returnsPending = (by.PENDING_RETURN || 0) + (by.DELIVERED || 0)
//   const returnsCompleted = by.COMPLETED || 0

//   return res.json({
//     date,
//     summary: {
//       total: counts.total,
//       byStatus: counts.byStatus,
//       returnDelivery,
//       returnDispatch,
//       returnsPending,
//       returnsCompleted,
//     },
//   })
// }

// async function calendarReport(req, res) {
//   const month = String(req.query.month || '').trim()
//   if (!month || !/^\d{4}-\d{2}$/.test(month)) {
//     return res.status(400).json({ message: 'month=YYYY-MM required' })
//   }

//   const { start, end } = monthRange(month)
//   const q = { deliveryAt: { $gte: start, $lt: end } }
//   applyRoleScope(req, q)
//   const filterErr = applyAdminFilters(req, q)
//   if (filterErr) return res.status(400).json({ message: filterErr.error })

//   const deliveries = await Delivery.find(q).select('deliveryAt status').lean()
//   const byDay = new Map()

//   for (const d of deliveries) {
//     const dt = new Date(d.deliveryAt)
//     const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
//     if (!byDay.has(key)) byDay.set(key, { total: 0, byStatus: {} })
//     const bucket = byDay.get(key)
//     bucket.total += 1
//     bucket.byStatus[d.status] = (bucket.byStatus[d.status] || 0) + 1
//   }

//   const days = [...byDay.entries()]
//     .sort(([a], [b]) => a.localeCompare(b))
//     .map(([date, data]) => ({ date, ...data }))

//   return res.json({ month, days })
// }

// async function sitesList(req, res) {
//   const monthsBack = Math.min(24, Math.max(1, Number(req.query.months || 6)))
//   const since = new Date()
//   since.setUTCMonth(since.getUTCMonth() - monthsBack)

//   const q = { deliveryAt: { $gte: since }, siteName: { $exists: true, $ne: '' } }
//   applyRoleScope(req, q)
//   const filterErr = applyAdminFilters(req, q)
//   if (filterErr) return res.status(400).json({ message: filterErr.error })

//   const sites = await Delivery.distinct('siteName', q)
//   return res.json(sites.filter(Boolean).sort((a, b) => a.localeCompare(b)).slice(0, 200))
// }

// async function customersList(req, res) {
//   const monthsBack = Math.min(24, Math.max(1, Number(req.query.months || 6)))
//   const since = new Date()
//   since.setUTCMonth(since.getUTCMonth() - monthsBack)

//   const q = { deliveryAt: { $gte: since }, customerName: { $exists: true, $ne: '' } }
//   applyRoleScope(req, q)
//   const filterErr = applyAdminFilters(req, q)
//   if (filterErr) return res.status(400).json({ message: filterErr.error })

//   const names = await Delivery.distinct('customerName', q)
//   return res.json(names.filter(Boolean).sort((a, b) => a.localeCompare(b)).slice(0, 300))
// }

// async function missingReport(req, res) {
//   const limit = Math.min(200, Number(req.query.limit || 100))
//   const result = await buildMissingQuery(req)
//   if (result.error) return res.status(400).json({ message: result.error.error })

//   const rows = await mapMissingRows(result.deliveries.slice(0, limit))
//   return res.json(rows)
// }

// async function missingProductsReport(req, res) {
//   const result = await buildMissingQuery(req)
//   if (result.error) return res.status(400).json({ message: result.error.error })

//   const limit = Math.min(200, Number(req.query.limit || 100))
//   const deliveries = result.deliveries.slice(0, limit)

//   const productIds = deliveries.flatMap((d) => (d.billerMissingLines || []).map((l) => String(l.productId)))
//   const productMap = await loadProductMap(productIds)

//   const agg = new Map()

//   for (const d of deliveries) {
//     for (const line of d.billerMissingLines || []) {
//       if (!line.qty || line.qty <= 0) continue
//       const pid = String(line.productId)
//       if (!agg.has(pid)) {
//         const p = productMap.get(pid)
//         agg.set(pid, {
//           productId: pid,
//           particulars: p?.particulars,
//           sku: p?.sku || p?.s_no,
//           totalQty: 0,
//           deliveries: [],
//         })
//       }
//       const row = agg.get(pid)
//       row.totalQty += line.qty
//       row.deliveries.push({
//         id: String(d._id),
//         deliveryNo: d.deliveryNo,
//         qty: line.qty,
//       })
//     }
//   }

//   const rows = [...agg.values()]
//     .map((r) => ({
//       ...r,
//       deliveryCount: r.deliveries.length,
//     }))
//     .sort((a, b) => b.totalQty - a.totalQty)

//   return res.json(rows)
// }

// async function issuesByGodown(req, res) {
//   const result = await buildDeliveryQuery(req)
//   if (result.error) return res.status(400).json({ message: result.error.error })

//   const godownIds = result.deliveries.map((d) => String(d.fromGodownId))
//   const godownMap = await loadGodownMap(godownIds)

//   const byGodown = new Map()

//   for (const d of result.deliveries) {
//     const gid = String(d.fromGodownId)
//     if (!byGodown.has(gid)) {
//       const g = godownMap.get(gid)
//       byGodown.set(gid, {
//         godownId: gid,
//         godownName: g?.name,
//         totalDeliveries: 0,
//         issueDeliveryCount: 0,
//         missingQty: 0,
//         damageQty: 0,
//         missingTotal: 0,
//         damageTotal: 0,
//         missingTagCount: 0,
//         damagedTagCount: 0,
//         lostTagCount: 0,
//       })
//     }
//     const row = byGodown.get(gid)
//     row.totalDeliveries += 1
//     if (!deliveryHasIssue(d)) continue

//     row.issueDeliveryCount += 1
//     const m = issueMetricsFromDelivery(d)
//     row.missingQty += m.missingQty
//     row.damageQty += m.damageQty
//     row.missingTotal += m.missingTotal
//     row.damageTotal += m.damageTotal
//     row.missingTagCount += m.missingTagCount
//     row.damagedTagCount += m.damagedTagCount
//     row.lostTagCount += m.lostTagCount
//   }

//   const rows = [...byGodown.values()].sort((a, b) => {
//     if (b.issueDeliveryCount !== a.issueDeliveryCount) return b.issueDeliveryCount - a.issueDeliveryCount
//     return (a.godownName || '').localeCompare(b.godownName || '')
//   })

//   return res.json(rows)
// }

// async function issuesByDelivery(req, res) {
//   const limit = Math.min(200, Number(req.query.limit || 100))
//   const result = await buildDeliveryQuery(req)
//   if (result.error) return res.status(400).json({ message: result.error.error })

//   const rows = await mapIssueDeliveryRows(result.issueDeliveries.slice(0, limit))
//   return res.json(rows)
// }

// async function issuesCustomerReport(req, res) {
//   const customerName = String(req.query.customerName || '').trim()
//   if (!customerName) return res.status(400).json({ message: 'customerName required' })

//   const result = await buildDeliveryQuery(req)
//   if (result.error) return res.status(400).json({ message: result.error.error })

//   const all = result.deliveries.filter((d) => d.customerName === customerName)
//   const issues = all.filter(deliveryHasIssue)

//   const summary = {
//     deliveryCount: all.length,
//     issueDeliveryCount: issues.length,
//     missingQty: 0,
//     damageQty: 0,
//     missingTotal: 0,
//     damageTotal: 0,
//     missingTagCount: 0,
//     damagedTagCount: 0,
//     lostTagCount: 0,
//   }

//   for (const d of all) {
//     const m = issueMetricsFromDelivery(d)
//     summary.missingQty += m.missingQty
//     summary.damageQty += m.damageQty
//     summary.missingTotal += m.missingTotal
//     summary.damageTotal += m.damageTotal
//     summary.missingTagCount += m.missingTagCount
//     summary.damagedTagCount += m.damagedTagCount
//     summary.lostTagCount += m.lostTagCount
//   }

//   const deliveries = await mapIssueDeliveryRows(all)

//   return res.json({
//     customerName,
//     summary,
//     deliveries,
//   })
// }

// async function stockReport(req, res) {
//   const match = {}
//   if (req.user.role === 'GODOWN' && req.user.godownId) {
//     if (!mongoose.Types.ObjectId.isValid(req.user.godownId)) {
//       return res.status(400).json({ message: 'Invalid user godownId' })
//     }
//     match.godownId = new mongoose.Types.ObjectId(req.user.godownId)
//   } else if (req.user.role === 'ADMIN' || req.user.role === 'BILLER') {
//     const gid = String(req.query.godownId || '').trim()
//     if (gid) {
//       if (!mongoose.Types.ObjectId.isValid(gid)) return res.status(400).json({ message: 'Invalid godownId' })
//       match.godownId = new mongoose.Types.ObjectId(gid)
//     }
//   }

//   const rows = await InventoryLedger.aggregate([
//     { $match: match },
//     {
//       $group: {
//         _id: { godownId: '$godownId', productId: '$productId' },
//         qty: { $sum: '$qtyDelta' },
//       },
//     },
//     { $sort: { qty: -1 } },
//     { $limit: 5000 },
//   ])

//   const productIds = rows.map((r) => String(r._id.productId))
//   const godownIds = rows.map((r) => String(r._id.godownId))
//   const [productMap, godownMap] = await Promise.all([loadProductMap(productIds), loadGodownMap(godownIds)])

//   return res.json(
//     rows.map((r) => {
//       const p = productMap.get(String(r._id.productId))
//       const g = godownMap.get(String(r._id.godownId))
//       return {
//         godownId: String(r._id.godownId),
//         godownName: g?.name,
//         productId: String(r._id.productId),
//         particulars: p?.particulars,
//         sku: p?.sku || p?.s_no,
//         qty: r.qty,
//       }
//     }),
//   )
// }

// const RETURN_PHASE_STATUSES = new Set(['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN'])

// async function returnsByBiller(req, res) {
//   ensureGodownQueryParam(req)
//   const godownId = String(req.query.godownId || '').trim()
//   if (godownId && !mongoose.Types.ObjectId.isValid(godownId)) return res.status(400).json({ message: 'Invalid godownId' })

//   const result = await buildDeliveryQuery(req)
//   if (result.error) return res.status(400).json({ message: result.error.error })

//   const byBiller = new Map()

//   for (const d of result.deliveries) {
//     if (!d.billerUserId) continue
//     const bid = String(d.billerUserId)
//     if (!byBiller.has(bid)) {
//       byBiller.set(bid, {
//         billerUserId: bid,
//         deliveryCount: 0,
//         missingOrderCount: 0,
//         returnSubmittedCount: 0,
//         pendingReturnCount: 0,
//         missingQty: 0,
//         damageQty: 0,
//         missingTotal: 0,
//         damageTotal: 0,
//         returnedQty: 0,
//         dispatchedQty: 0,
//         outstandingQty: 0,
//       })
//     }
//     const row = byBiller.get(bid)
//     row.deliveryCount += 1
//     // billerDamagedLines holds the combined "damage/missing" return qty from the biller form
//     const hasReturn = sumLineQty(d.billerDamagedLines) > 0 || sumLineQty(d.billerMissingLines) > 0
//     if (hasReturn) row.missingOrderCount += 1
//     if (d.billerReturnSubmittedAt) row.returnSubmittedCount += 1
//     if (!d.billerReturnSubmittedAt && RETURN_PHASE_STATUSES.has(d.status)) {
//       row.pendingReturnCount += 1
//     }
//     const metrics = issueMetricsFromDelivery(d)
//     row.missingQty += metrics.missingQty
//     row.damageQty += metrics.damageQty
//     row.missingTotal += metrics.missingTotal
//     row.damageTotal += metrics.damageTotal
//     const physical = physicalReturnMetrics(d)
//     row.returnedQty += physical.returnedQty
//     row.dispatchedQty += physical.dispatchedQty
//     row.outstandingQty += physical.outstandingQty
//   }

//   const billerIds = [...byBiller.keys()]
//   const billerMap = await loadBillerMap(billerIds)

//   const onlyMissing = String(req.query.onlyMissing || '1') !== '0'

//   let rows = [...byBiller.values()]
//     .map((row) => {
//       const b = billerMap.get(row.billerUserId)
//       return {
//         ...row,
//         billerName: b?.contactName || b?.siteName || row.billerUserId,
//         siteName: b?.siteName,
//       }
//     })
//     .sort((a, b) => {
//       if (b.missingOrderCount !== a.missingOrderCount) return b.missingOrderCount - a.missingOrderCount
//       if (b.missingQty !== a.missingQty) return b.missingQty - a.missingQty
//       return (a.billerName || '').localeCompare(b.billerName || '')
//     })

//   if (onlyMissing) rows = rows.filter((r) => r.missingOrderCount > 0)

//   return res.json(rows)
// }

// async function returnsByProduct(req, res) {
//   ensureGodownQueryParam(req)
//   const godownId = String(req.query.godownId || '').trim()
//   if (godownId && !mongoose.Types.ObjectId.isValid(godownId)) return res.status(400).json({ message: 'Invalid godownId' })

//   const metric = String(req.query.metric || 'missing').trim()
//   if (!['missing', 'damage', 'return'].includes(metric)) {
//     return res.status(400).json({ message: 'metric must be missing, damage, or return' })
//   }

//   // billerUserId is now optional — omitting it returns all billers data
//   if (req.user.role !== 'BILLER') {
//     const billerUserId = String(req.query.billerUserId || '').trim()
//     if (billerUserId && !mongoose.Types.ObjectId.isValid(billerUserId)) {
//       return res.status(400).json({ message: 'Invalid billerUserId' })
//     }
//   }

//   // Optional productId filter
//   const filterProductId = String(req.query.productId || '').trim()
//   if (filterProductId && !mongoose.Types.ObjectId.isValid(filterProductId)) {
//     return res.status(400).json({ message: 'Invalid productId' })
//   }

//   const result = await buildDeliveryQuery(req)
//   if (result.error) return res.status(400).json({ message: result.error.error })

//   const agg = new Map()

//   for (const d of result.deliveries) {
//     if (metric === 'missing') {
//       // billerDamagedLines is the combined "Return qty (damaged / missing)" field
//       // from the biller return form — treat it as the primary return indicator
//       const returnLines = [
//         ...(d.billerDamagedLines || []),
//         ...(d.billerMissingLines || []),
//       ]
//       // Aggregate by productId to avoid double-counting
//       const byPid = new Map()
//       for (const line of returnLines) {
//         if (!line.qty || line.qty <= 0) continue
//         const pid = String(line.productId)
//         byPid.set(pid, (byPid.get(pid) || 0) + line.qty)
//       }
//       for (const [pid, qty] of byPid) {
//         // Apply productId filter if provided
//         if (filterProductId && pid !== filterProductId) continue
//         if (!agg.has(pid)) {
//           agg.set(pid, { productId: pid, totalQty: 0, deliveries: [] })
//         }
//         const row = agg.get(pid)
//         row.totalQty += qty
//         row.deliveries.push({
//           id: String(d._id),
//           deliveryNo: d.deliveryNo,
//           customerName: d.customerName,
//           deliveryAt: d.deliveryAt,
//           qty,
//           note: undefined,
//         })
//       }
//     } else if (metric === 'damage') {
//       for (const line of d.billerDamagedLines || []) {
//         if (!line.qty || line.qty <= 0) continue
//         const pid = String(line.productId)
//         if (!agg.has(pid)) {
//           agg.set(pid, { productId: pid, totalQty: 0, deliveries: [] })
//         }
//         const row = agg.get(pid)
//         row.totalQty += line.qty
//         row.deliveries.push({
//           id: String(d._id),
//           deliveryNo: d.deliveryNo,
//           customerName: d.customerName,
//           deliveryAt: d.deliveryAt,
//           qty: line.qty,
//           note: line.note,
//         })
//       }
//     } else {
//       for (const line of d.lines || []) {
//         const returned = Number(line.returnedQty) || 0
//         if (returned <= 0) continue
//         const pid = String(line.productId)
//         if (!agg.has(pid)) {
//           agg.set(pid, { productId: pid, totalQty: 0, deliveries: [] })
//         }
//         const row = agg.get(pid)
//         row.totalQty += returned
//         const dispatched = Number(line.dispatchedQty) || 0
//         row.deliveries.push({
//           id: String(d._id),
//           deliveryNo: d.deliveryNo,
//           qty: returned,
//           dispatchedQty: dispatched,
//           outstandingQty: Math.max(0, dispatched - returned),
//         })
//       }
//     }
//   }

//   const productIds = [...agg.keys()]
//   const productMap = await loadProductMap(productIds)

//   const rows = [...agg.values()]
//     .map((r) => {
//       const p = productMap.get(r.productId)
//       return {
//         productId: r.productId,
//         particulars: p?.particulars,
//         sku: p?.sku || p?.s_no,
//         totalQty: r.totalQty,
//         deliveryCount: r.deliveries.length,
//         deliveries: r.deliveries,
//       }
//     })
//     .sort((a, b) => b.totalQty - a.totalQty)

//   return res.json(rows)
// }

// async function customerProductsReport(req, res) {
//   const customerName = String(req.query.customerName || '').trim()
//   if (!customerName) return res.status(400).json({ message: 'customerName required' })

//   const result = await buildDeliveryQuery(req)
//   if (result.error) return res.status(400).json({ message: result.error.error })

//   const deliveries = result.deliveries.filter((d) => d.customerName === customerName)

//   const missingAgg = new Map()
//   const damagedAgg = new Map()
//   const productIds = []

//   for (const d of deliveries) {
//     for (const line of d.billerMissingLines || []) {
//       if (!line.qty || line.qty <= 0) continue
//       const pid = String(line.productId)
//       productIds.push(pid)
//       if (!missingAgg.has(pid)) missingAgg.set(pid, { productId: pid, totalQty: 0, deliveryCount: 0 })
//       const row = missingAgg.get(pid)
//       row.totalQty += line.qty
//       row.deliveryCount += 1
//     }
//     for (const line of d.billerDamagedLines || []) {
//       if (!line.qty || line.qty <= 0) continue
//       const pid = String(line.productId)
//       productIds.push(pid)
//       if (!damagedAgg.has(pid)) damagedAgg.set(pid, { productId: pid, totalQty: 0, deliveryCount: 0 })
//       const row = damagedAgg.get(pid)
//       row.totalQty += line.qty
//       row.deliveryCount += 1
//     }
//   }

//   const productMap = await loadProductMap(productIds)

//   const enrichRow = (row) => {
//     const p = productMap.get(row.productId)
//     return { ...row, particulars: p?.particulars, sku: p?.sku || p?.s_no }
//   }

//   return res.json({
//     customerName,
//     missingByProduct: [...missingAgg.values()].map(enrichRow).sort((a, b) => b.totalQty - a.totalQty),
//     damagedByProduct: [...damagedAgg.values()].map(enrichRow).sort((a, b) => b.totalQty - a.totalQty),
//   })
// }

// async function customerHistory(req, res) {
//   const q = String(req.query.q || '').trim()
//   if (!q) return res.status(400).json({ message: 'q required' })

//   const deliveries = await Delivery.find({
//     customerName: { $regex: escapeRegex(q), $options: 'i' },
//   })
//     .sort({ deliveryAt: -1 })
//     .limit(100)
//     .lean()

//   return res.json(
//     deliveries.map((d) => ({
//       id: String(d._id),
//       deliveryNo: d.deliveryNo,
//       customerName: d.customerName,
//       siteName: d.siteName,
//       siteAddress: d.siteAddress,
//       deliveryAt: d.deliveryAt,
//       status: d.status,
//     })),
//   )
// }

// async function statusCounts(req, res) {
//   const q = {}
//   applyRoleScope(req, q)
//   if (req.user.role === 'GODOWN' && req.user.godownId) {
//     const gid = new mongoose.Types.ObjectId(String(req.user.godownId))
//     q.$or = [{ fromGodownId: gid }, { 'lines.godownId': gid }]
//   }
//   const results = await Delivery.aggregate([
//     { $match: q },
//     { $group: { _id: '$status', count: { $sum: 1 } } },
//   ])
//   const byStatus = {}
//   let total = 0
//   for (const r of results) {
//     byStatus[r._id] = r.count
//     total += r.count
//   }
//   return res.json({ total, byStatus })
// }

// module.exports = {
//   dailyDeliveryReport,
//   dailyReturnsReport,
//   calendarReport,
//   sitesList,
//   customersList,
//   missingReport,
//   missingProductsReport,
//   stockReport,
//   customerHistory,
//   issuesByGodown,
//   issuesByDelivery,
//   issuesCustomerReport,
//   customerProductsReport,
//   returnsByBiller,
//   returnsByProduct,
//   statusCounts,
// }

const mongoose = require('mongoose')
const Delivery = require('../models/Delivery')
const InventoryLedger = require('../models/InventoryLedger')
const Product = require('../models/Product')
const Godown = require('../models/Godown')
const User = require('../models/User')

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000 // +5:30 in ms

function dayRange(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map((x) => Number(x))
  const istMidnightUTC = Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0) - IST_OFFSET_MS
  const start = new Date(istMidnightUTC)
  const end = new Date(istMidnightUTC + 24 * 60 * 60 * 1000)
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

  const godownId = Array.isArray(req.query.godownId)
    ? req.query.godownId[0]
    : String(req.query.godownId || '').trim()

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

function applyPhaseFilter(req, q) {
  const phase = String(req.query.phase || '').trim()
  if (phase === 'return') {
    q.phase = 'RETURN'
  }
}

function applyStatusFilter(req, q) {
  const status = String(req.query.status || '').trim()
  if (!status) return

  if (status === 'active') {
    q.status = { $in: ['PROCESSED', 'PACKED', 'OUT_FOR_DELIVERY'] }
  } else if (status === 'pending_return') {
    q.status = { $in: ['DELIVERED', 'PENDING_RETURN'] }
  } else if (status === 'pending') {
    q.status = { $in: ['PENDING_RETURN', 'DELIVERED', 'RETURN_PICKUP'] }
  } else if (status === 'completed') {
    q.status = 'COMPLETED'
  }
}

function applyDeliveryDateFilter(req, q) {
  const dateFrom = String(req.query.dateFrom || req.query.date || '').trim()
  const dateTo = String(req.query.dateTo || '').trim()

  if (dateTo && !dateFrom) return { error: 'date or dateFrom required when dateTo is set' }
  if (dateFrom && !isValidDateStr(dateFrom)) return { error: 'Invalid date' }
  if (dateTo && !isValidDateStr(dateTo)) return { error: 'Invalid dateTo' }
  if (dateFrom && dateTo && dateFrom > dateTo) return { error: 'dateFrom must be <= dateTo' }

  if (dateFrom) {
    if (dateTo) {
      const { start } = dayRange(dateFrom)
      const { end } = dayRange(dateTo)
      q.deliveryAt = { $gte: start, $lt: end }
    } else {
      const { start, end } = dayRange(dateFrom)
      q.deliveryAt = { $gte: start, $lt: end }
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
  if (d.status === 'COMPLETED' && d.billerReturnSubmittedAt) {
    if (sumLineQty(d.billerDamagedLines) > 0 || sumLineQty(d.billerMissingLines) > 0) return true
  }
  return false
}

function issueMetricsFromDelivery(d) {
  const returnQty = sumLineQty(d.billerDamagedLines) + sumLineQty(d.billerMissingLines)
  return {
    missingQty: returnQty,
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
      selfDelivery: d.selfDelivery || false,
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

// ── DAILY DELIVERY REPORT ─────────────────────────────────────────────────

async function dailyDeliveryReport(req, res) {
  const date = String(req.query.date || req.query.dateFrom || '').trim()
  if (!date) return res.status(400).json({ message: 'date=YYYY-MM-DD required' })

  const q = {}
  applyRoleScope(req, q)
  const filterErr = applyAdminFilters(req, q)
  if (filterErr) return res.status(400).json({ message: filterErr.error })

  applyPhaseFilter(req, q)
  applyStatusFilter(req, q)

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
        selfDelivery: d.selfDelivery || false,
        phase: d.phase,
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

// ── DAILY RETURNS REPORT ──────────────────────────────────────────────────
// FIX: Now filters by deliveryAt (same field the calendar uses) instead of
// returnExpectedAt, and queries phase=RETURN so counts match the calendar view.

async function dailyReturnsReport(req, res) {
  const date = String(req.query.date || req.query.dateFrom || '').trim()
  if (!date) return res.status(400).json({ message: 'date=YYYY-MM-DD required' })
  if (!isValidDateStr(date)) return res.status(400).json({ message: 'Invalid date' })

  const q = {}
  applyRoleScope(req, q)
  const filterErr = applyAdminFilters(req, q)
  if (filterErr) return res.status(400).json({ message: filterErr.error })

  // Filter by deliveryAt for the given day (same as calendar)
  const { start, end } = dayRange(date)
  q.deliveryAt = { $gte: start, $lt: end }

  // Only RETURN phase deliveries
  q.phase = 'RETURN'

  const deliveries = await Delivery.find(q).lean()

  const counts = deliveries.reduce(
    (a, d) => {
      a.total += 1
      a.byStatus[d.status] = (a.byStatus[d.status] || 0) + 1
      return a
    },
    { total: 0, byStatus: {} },
  )

  const by = counts.byStatus
  const returnDelivery = counts.total
  // Return dispatch: actively out for return pickup
  const returnDispatch = (by.RETURN_PICKUP || 0) + (by.OUT_FOR_DELIVERY || 0) + (by.DISPATCHED || 0)
  // Returns pending: scheduled but not yet picked up
  const returnsPending = (by.PENDING_RETURN || 0) + (by.DELIVERED || 0) + (by.PROCESSED || 0) + (by.PACKED || 0)
  const returnsCompleted = by.COMPLETED || 0

  return res.json({
    date,
    summary: {
      total: counts.total,
      byStatus: counts.byStatus,
      returnDelivery,
      returnDispatch,
      returnsPending,
      returnsCompleted,
    },
  })
}

// ── CALENDAR REPORT ───────────────────────────────────────────────────────

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

  applyPhaseFilter(req, q)

  const deliveries = await Delivery.find(q).select('deliveryAt status selfDelivery phase').lean()
  const byDay = new Map()

  for (const d of deliveries) {
    const dt = new Date(d.deliveryAt)
    const istMs = dt.getTime() + IST_OFFSET_MS
    const istDate = new Date(istMs)
    const key = `${istDate.getUTCFullYear()}-${String(istDate.getUTCMonth() + 1).padStart(2, '0')}-${String(istDate.getUTCDate()).padStart(2, '0')}`
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

async function issuesCustomerReport(req, res) {
  const customerName = String(req.query.customerName || '').trim()
  if (!customerName) return res.status(400).json({ message: 'customerName required' })

  const result = await buildDeliveryQuery(req)
  if (result.error) return res.status(400).json({ message: result.error.error })

  const all = result.deliveries.filter((d) => d.customerName === customerName)
  const issues = all.filter(deliveryHasIssue)

  const summary = {
    deliveryCount: all.length,
    issueDeliveryCount: issues.length,
    missingQty: 0,
    damageQty: 0,
    missingTotal: 0,
    damageTotal: 0,
    missingTagCount: 0,
    damagedTagCount: 0,
    lostTagCount: 0,
  }

  for (const d of all) {
    const m = issueMetricsFromDelivery(d)
    summary.missingQty += m.missingQty
    summary.damageQty += m.damageQty
    summary.missingTotal += m.missingTotal
    summary.damageTotal += m.damageTotal
    summary.missingTagCount += m.missingTagCount
    summary.damagedTagCount += m.damagedTagCount
    summary.lostTagCount += m.lostTagCount
  }

  const deliveries = await mapIssueDeliveryRows(all)

  return res.json({
    customerName,
    summary,
    deliveries,
  })
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
  if (godownId && !mongoose.Types.ObjectId.isValid(godownId)) return res.status(400).json({ message: 'Invalid godownId' })

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
    const hasReturn = sumLineQty(d.billerDamagedLines) > 0 || sumLineQty(d.billerMissingLines) > 0
    if (hasReturn) row.missingOrderCount += 1
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

  const onlyMissing = String(req.query.onlyMissing || '1') !== '0'

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
      if (b.missingOrderCount !== a.missingOrderCount) return b.missingOrderCount - a.missingOrderCount
      if (b.missingQty !== a.missingQty) return b.missingQty - a.missingQty
      return (a.billerName || '').localeCompare(b.billerName || '')
    })

  if (onlyMissing) rows = rows.filter((r) => r.missingOrderCount > 0)

  return res.json(rows)
}

async function returnsByProduct(req, res) {
  ensureGodownQueryParam(req)
  const godownId = String(req.query.godownId || '').trim()
  if (godownId && !mongoose.Types.ObjectId.isValid(godownId)) return res.status(400).json({ message: 'Invalid godownId' })

  const metric = String(req.query.metric || 'missing').trim()
  if (!['missing', 'damage', 'return'].includes(metric)) {
    return res.status(400).json({ message: 'metric must be missing, damage, or return' })
  }

  if (req.user.role !== 'BILLER') {
    const billerUserId = String(req.query.billerUserId || '').trim()
    if (billerUserId && !mongoose.Types.ObjectId.isValid(billerUserId)) {
      return res.status(400).json({ message: 'Invalid billerUserId' })
    }
  }

  const filterProductId = String(req.query.productId || '').trim()
  if (filterProductId && !mongoose.Types.ObjectId.isValid(filterProductId)) {
    return res.status(400).json({ message: 'Invalid productId' })
  }

  const result = await buildDeliveryQuery(req)
  if (result.error) return res.status(400).json({ message: result.error.error })

  const agg = new Map()

  for (const d of result.deliveries) {
    if (metric === 'missing') {
      const returnLines = [
        ...(d.billerDamagedLines || []),
        ...(d.billerMissingLines || []),
      ]
      const byPid = new Map()
      for (const line of returnLines) {
        if (!line.qty || line.qty <= 0) continue
        const pid = String(line.productId)
        byPid.set(pid, (byPid.get(pid) || 0) + line.qty)
      }
      for (const [pid, qty] of byPid) {
        if (filterProductId && pid !== filterProductId) continue
        if (!agg.has(pid)) {
          agg.set(pid, { productId: pid, totalQty: 0, deliveries: [] })
        }
        const row = agg.get(pid)
        row.totalQty += qty
        row.deliveries.push({
          id: String(d._id),
          deliveryNo: d.deliveryNo,
          customerName: d.customerName,
          deliveryAt: d.deliveryAt,
          qty,
          note: undefined,
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

// ── PRODUCT REPORT (S.No/Name/SKU + total/current stock + out-of-delivery + missing) ──

async function productsSummaryReport(req, res) {
  ensureGodownQueryParam(req)
  const godownId = String(req.query.godownId || '').trim()
  if (godownId && !mongoose.Types.ObjectId.isValid(godownId)) {
    return res.status(400).json({ message: 'Invalid godownId' })
  }

  const ledgerMatch = {}
  if (godownId) ledgerMatch.godownId = new mongoose.Types.ObjectId(godownId)

  const stockRows = await InventoryLedger.aggregate([
    { $match: ledgerMatch },
    {
      $group: {
        _id: '$productId',
        currentStock: { $sum: '$qtyDelta' },
        totalStock: { $sum: { $cond: [{ $gt: ['$qtyDelta', 0] }, '$qtyDelta', 0] } },
      },
    },
  ])
  const stockByProduct = new Map(stockRows.map((r) => [String(r._id), r]))

  const deliveryQuery = {}
  applyRoleScope(req, deliveryQuery)
  if (godownId) deliveryQuery.$or = [{ fromGodownId: new mongoose.Types.ObjectId(godownId) }, { 'lines.godownId': new mongoose.Types.ObjectId(godownId) }]
  const deliveries = await Delivery.find(deliveryQuery).lean()

  const outByProduct = new Map()
  const missingByProduct = new Map()
  const godownIds = deliveries.map((d) => String(d.fromGodownId)).filter(Boolean)
  const godownMap = await loadGodownMap(godownIds)

  const toDeliveryListRow = (d, qty, note) => {
    const g = godownMap.get(String(d.fromGodownId))
    return {
      id: String(d._id),
      deliveryNo: d.deliveryNo,
      customerName: d.customerName,
      siteName: d.siteName,
      siteAddress: d.siteAddress,
      status: d.status,
      deliveryAt: d.deliveryAt,
      selfDelivery: !!d.selfDelivery,
      vehicleType: d.returnPickupVehicleType || d.vehicleType,
      vehicleLabel: d.returnPickupVehicleLabel || d.vehicleLabel,
      godownName: g?.name,
      fromGodownId: d.fromGodownId ? String(d.fromGodownId) : undefined,
      qty,
      note,
    }
  }

  for (const d of deliveries) {
    for (const line of d.lines || []) {
      const dispatched = Number(line.dispatchedQty) || 0
      const returned = Number(line.returnedQty) || 0
      const outstanding = Math.max(0, dispatched - returned)
      if (outstanding <= 0) continue
      const pid = String(line.productId)
      if (!outByProduct.has(pid)) outByProduct.set(pid, { qty: 0, deliveries: [] })
      const row = outByProduct.get(pid)
      row.qty += outstanding
      row.deliveries.push(toDeliveryListRow(d, outstanding))
    }
    // Biller return form writes "damaged / missing" into billerDamagedLines;
    // billerMissingLines is kept for legacy / separate missing submissions.
    const missingLinesByPid = new Map()
    for (const line of [...(d.billerDamagedLines || []), ...(d.billerMissingLines || [])]) {
      if (!line.qty || line.qty <= 0) continue
      const pid = String(line.productId)
      const prev = missingLinesByPid.get(pid) || { qty: 0, note: undefined }
      prev.qty += line.qty
      if (!prev.note && line.note) prev.note = line.note
      missingLinesByPid.set(pid, prev)
    }
    for (const [pid, info] of missingLinesByPid) {
      if (!missingByProduct.has(pid)) missingByProduct.set(pid, { qty: 0, deliveries: [] })
      const row = missingByProduct.get(pid)
      row.qty += info.qty
      row.deliveries.push(toDeliveryListRow(d, info.qty, info.note))
    }
  }

  const products = await Product.find({}).sort({ s_no: 1, particulars: 1 }).lean()

  const search = String(req.query.search || '').trim().toLowerCase()
  const rows = products
    .map((p) => {
      const pid = String(p._id)
      const stock = stockByProduct.get(pid) || { currentStock: 0, totalStock: 0 }
      const out = outByProduct.get(pid)
      const missing = missingByProduct.get(pid)
      return {
        productId: pid,
        sNo: p.s_no,
        particulars: p.particulars,
        sku: p.sku || p.s_no,
        totalStock: stock.totalStock,
        currentStock: stock.currentStock,
        outOfDeliveryQty: out?.qty || 0,
        outOfDeliveryDeliveries: out?.deliveries || [],
        missingQty: missing?.qty || 0,
        missingDeliveries: missing?.deliveries || [],
      }
    })
    .filter((r) => {
      if (!search) return true
      return (r.particulars || '').toLowerCase().includes(search) || (r.sku || '').toLowerCase().includes(search)
    })

  return res.json(rows)
}

async function customerProductsReport(req, res) {
  const customerName = String(req.query.customerName || '').trim()
  if (!customerName) return res.status(400).json({ message: 'customerName required' })

  const result = await buildDeliveryQuery(req)
  if (result.error) return res.status(400).json({ message: result.error.error })

  const deliveries = result.deliveries.filter((d) => d.customerName === customerName)

  const missingAgg = new Map()
  const damagedAgg = new Map()
  const productIds = []

  for (const d of deliveries) {
    for (const line of d.billerMissingLines || []) {
      if (!line.qty || line.qty <= 0) continue
      const pid = String(line.productId)
      productIds.push(pid)
      if (!missingAgg.has(pid)) missingAgg.set(pid, { productId: pid, totalQty: 0, deliveryCount: 0 })
      const row = missingAgg.get(pid)
      row.totalQty += line.qty
      row.deliveryCount += 1
    }
    for (const line of d.billerDamagedLines || []) {
      if (!line.qty || line.qty <= 0) continue
      const pid = String(line.productId)
      productIds.push(pid)
      if (!damagedAgg.has(pid)) damagedAgg.set(pid, { productId: pid, totalQty: 0, deliveryCount: 0 })
      const row = damagedAgg.get(pid)
      row.totalQty += line.qty
      row.deliveryCount += 1
    }
  }

  const productMap = await loadProductMap(productIds)

  const enrichRow = (row) => {
    const p = productMap.get(row.productId)
    return { ...row, particulars: p?.particulars, sku: p?.sku || p?.s_no }
  }

  return res.json({
    customerName,
    missingByProduct: [...missingAgg.values()].map(enrichRow).sort((a, b) => b.totalQty - a.totalQty),
    damagedByProduct: [...damagedAgg.values()].map(enrichRow).sort((a, b) => b.totalQty - a.totalQty),
  })
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
      selfDelivery: d.selfDelivery || false,
    })),
  )
}

async function statusCounts(req, res) {
  const q = {}
  applyRoleScope(req, q)
  if (req.user.role === 'GODOWN' && req.user.godownId) {
    const gid = new mongoose.Types.ObjectId(String(req.user.godownId))
    q.$or = [{ fromGodownId: gid }, { 'lines.godownId': gid }]
  }
  const results = await Delivery.aggregate([
    { $match: q },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])
  const byStatus = {}
  let total = 0
  for (const r of results) {
    byStatus[r._id] = r.count
    total += r.count
  }
  return res.json({ total, byStatus })
}

module.exports = {
  dailyDeliveryReport,
  dailyReturnsReport,
  calendarReport,
  sitesList,
  customersList,
  missingReport,
  missingProductsReport,
  stockReport,
  customerHistory,
  issuesByGodown,
  issuesByDelivery,
  issuesCustomerReport,
  customerProductsReport,
  returnsByBiller,
  returnsByProduct,
  productsSummaryReport,
  statusCounts,
}