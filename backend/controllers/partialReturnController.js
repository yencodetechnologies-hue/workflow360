// /**
//  * partialReturnController.js
//  *
//  * GET  /deliveries/partial-returns/calendar?month=YYYY-MM&godownId=
//  * GET  /deliveries/partial-returns/all?month=YYYY-MM&godownId=      ← NEW (default list)
//  * GET  /deliveries/partial-returns/daily?date=YYYY-MM-DD&godownId=
//  * PATCH /deliveries/:id/re-delivery   { reDeliveryDate, note }
//  */

// const mongoose = require('mongoose')
// const Delivery  = require('../models/Delivery')
// const Product   = require('../models/Product')

// // ── date helpers ───────────────────────────────────────────────────────────

// function monthRange(monthStr) {
//   const [y, m] = monthStr.split('-').map(Number)
//   return {
//     start: new Date(Date.UTC(y, m - 1, 1)),
//     end:   new Date(Date.UTC(y, m,     1)),   // exclusive
//   }
// }

// function dayRange(dateStr) {
//   const [y, m, d] = dateStr.split('-').map(Number)
//   return {
//     start: new Date(Date.UTC(y, m - 1, d)),
//     end:   new Date(Date.UTC(y, m - 1, d + 1)),
//   }
// }

// function toDateKey(date) {
//   return date.toISOString().slice(0, 10)
// }

// // ── query builder ──────────────────────────────────────────────────────────
// // A delivery is a "partial return" when:
// //   phase = RETURN  AND  at least one line: dispatchedQty > returnedQty

// function buildBaseQuery(godownId) {
//   const q = {
//     status: { $nin: ['CANCELLED', 'PROCESSED', 'PACKED', 'OUT_FOR_DELIVERY'] },
//     phase:  'RETURN',
//     'lines.0': { $exists: true },
//   }
//   if (godownId && mongoose.Types.ObjectId.isValid(godownId)) {
//     q.fromGodownId = new mongoose.Types.ObjectId(godownId)
//   }
//   return q
// }

// function applyRoleScope(q, req) {
//   if (req.user.role === 'GODOWN') {
//     const gid = req.user.godownId
//     if (!gid || !mongoose.Types.ObjectId.isValid(gid)) return false   // no access
//     q.fromGodownId = new mongoose.Types.ObjectId(gid)
//   }
//   if (req.user.role === 'BILLER') {
//     q.billerUserId = req.user.id
//   }
//   return true
// }

// // ── partial-return detection ───────────────────────────────────────────────
// // Returns true if any line has sent items the client hasn't returned yet.
// // Sent 7, returned 3  →  pendingQty = 4  →  partial return exists

// function hasPartialReturn(delivery) {
//   return (delivery.lines || []).some(
//     (l) => (Number(l.dispatchedQty) || 0) > (Number(l.returnedQty) || 0),
//   )
// }

// // ── product name lookup ────────────────────────────────────────────────────

// async function loadProductMap(deliveries) {
//   const ids = new Set()
//   for (const d of deliveries)
//     for (const l of d.lines || []) ids.add(String(l.productId))
//   if (!ids.size) return {}

//   const products = await Product.find({
//     _id: { $in: [...ids].map((id) => new mongoose.Types.ObjectId(id)) },
//   }).select('_id particulars productId').lean()

//   return Object.fromEntries(products.map((p) => [String(p._id), p]))
// }

// // ── map delivery → frontend shape ─────────────────────────────────────────

// function mapDelivery(d, productMap) {
//   const lines = (d.lines || []).map((line) => {
//     const productId   = String(line.productId)
//     const product     = productMap[productId]
//     const dispatched  = Number(line.dispatchedQty) || 0
//     const returned    = Number(line.returnedQty)   || 0
//     const pending     = Math.max(0, dispatched - returned)  // items still with client

//     return {
//       productId,
//       productName:  product ? (product.particulars || product.productId || productId) : productId,
//       qty:          Number(line.qty) || 0,
//       dispatchedQty: dispatched,
//       returnedQty:  returned,
//       pendingQty:   pending,    // ← sent 7, returned 3 → pendingQty = 4
//     }
//   })

//   const totalQty    = lines.reduce((s, l) => s + l.dispatchedQty, 0)
//   const returnedQty = lines.reduce((s, l) => s + l.returnedQty,   0)
//   const pendingQty  = lines.reduce((s, l) => s + l.pendingQty,    0)

//   return {
//     _id:             String(d._id),
//     deliveryNo:      d.deliveryNo,
//     customerName:    d.customerName,
//     siteName:        d.siteName,
//     siteAddress:     d.siteAddress,
//     contactPhone:    d.contactPhone,
//     returnExpectedAt: d.returnExpectedAt,
//     reDeliveryDate:  d.reDeliveryDate  || null,
//     reDeliveryNote:  d.reDeliveryNote  || null,
//     status:          d.status,
//     lines,
//     totalQty,
//     returnedQty,
//     pendingQty,
//   }
// }

// // ── controllers ────────────────────────────────────────────────────────────

// /**
//  * GET /deliveries/partial-returns/calendar?month=YYYY-MM&godownId=
//  * Returns dot counts per day for the calendar grid.
//  */
// async function getPartialReturnCalendar(req, res) {
//   try {
//     const month = req.query.month || new Date().toISOString().slice(0, 7)
//     if (!/^\d{4}-\d{2}$/.test(month))
//       return res.status(400).json({ message: 'month must be YYYY-MM' })

//     const { start, end } = monthRange(month)
//     const q = { ...buildBaseQuery(req.query.godownId), returnExpectedAt: { $gte: start, $lt: end } }
//     if (!applyRoleScope(q, req)) return res.json({ days: [], totalPartial: 0 })

//     const deliveries = await Delivery.find(q)
//       .select('returnExpectedAt lines').lean()

//     const partials = deliveries.filter(hasPartialReturn)

//     const countByDate = {}
//     for (const d of partials) {
//       const key = toDateKey(new Date(d.returnExpectedAt))
//       countByDate[key] = (countByDate[key] || 0) + 1
//     }

//     const days = Object.entries(countByDate)
//       .map(([date, partialCount]) => ({ date, partialCount }))
//       .sort((a, b) => a.date.localeCompare(b.date))

//     return res.json({ days, totalPartial: partials.length })
//   } catch (err) {
//     console.error('[partialReturnCalendar]', err)
//     return res.status(500).json({ message: err.message || 'Failed to load calendar' })
//   }
// }

// /**
//  * GET /deliveries/partial-returns/all?page=&limit=&month=YYYY-MM&godownId=
//  * Returns partial-return deliveries, newest-due first, paginated.
//  * This is the DEFAULT list shown before the user picks a date — by default
//  * it spans ALL months (not just the currently viewed calendar month), since
//  * the calendar's month navigation is only for browsing the dot grid, not for
//  * scoping which pending returns show in the list below it. Pass `month` to
//  * additionally narrow to a specific month if needed.
//  */
// async function getAllPartialReturns(req, res) {
//   try {
//     const page = Math.max(1, parseInt(req.query.page, 10) || 1)
//     const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20))

//     const q = buildBaseQuery(req.query.godownId)
//     if (req.query.month) {
//       if (!/^\d{4}-\d{2}$/.test(req.query.month))
//         return res.status(400).json({ message: 'month must be YYYY-MM' })
//       const { start, end } = monthRange(req.query.month)
//       q.returnExpectedAt = { $gte: start, $lt: end }
//     }
//     if (!applyRoleScope(q, req)) return res.json({ items: [], total: 0, page, limit })

//     // hasPartialReturn() needs per-line qty, so we can't paginate purely in
//     // Mongo here — filter in app code, then paginate the filtered set.
//     const deliveries = await Delivery.find(q).sort({ returnExpectedAt: 1 }).lean()
//     const partials = deliveries.filter(hasPartialReturn)

//     const total = partials.length
//     const pageItems = partials.slice((page - 1) * limit, page * limit)
//     const productMap = await loadProductMap(pageItems)

//     return res.json({
//       items: pageItems.map((d) => mapDelivery(d, productMap)),
//       total,
//       page,
//       limit,
//     })
//   } catch (err) {
//     console.error('[getAllPartialReturns]', err)
//     return res.status(500).json({ message: err.message || 'Failed to load returns' })
//   }
// }

// /**
//  * GET /deliveries/partial-returns/daily?date=YYYY-MM-DD&godownId=
//  * Returns partial returns for a specific date only (when user clicks a calendar date).
//  */
// async function getPartialReturnDaily(req, res) {
//   try {
//     const date = req.query.date
//     if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
//       return res.status(400).json({ message: 'date must be YYYY-MM-DD' })

//     const { start, end } = dayRange(date)
//     const q = { ...buildBaseQuery(req.query.godownId), returnExpectedAt: { $gte: start, $lt: end } }
//     if (!applyRoleScope(q, req)) return res.json([])

//     const deliveries = await Delivery.find(q).sort({ returnExpectedAt: 1 }).lean()
//     const partials = deliveries.filter(hasPartialReturn)
//     if (!partials.length) return res.json([])

//     const productMap = await loadProductMap(partials)
//     return res.json(partials.map((d) => mapDelivery(d, productMap)))
//   } catch (err) {
//     console.error('[partialReturnDaily]', err)
//     return res.status(500).json({ message: err.message || 'Failed to load daily returns' })
//   }
// }

// /**
//  * PATCH /deliveries/:id/re-delivery
//  * Schedule or reschedule a re-delivery date for the remaining outstanding items.
//  * Body: { reDeliveryDate: 'YYYY-MM-DD', note?: string }
//  *
//  * Example: sent 7, client returned 3, pending 4.
//  * Admin picks a new date → those 4 items will be collected/returned on that date.
//  */
// async function scheduleReDelivery(req, res) {
//   try {
//     const { id } = req.params
//     const { reDeliveryDate, note } = req.body

//     if (!reDeliveryDate || !/^\d{4}-\d{2}-\d{2}$/.test(reDeliveryDate))
//       return res.status(400).json({ message: 'reDeliveryDate must be YYYY-MM-DD' })

//     const delivery = await Delivery.findById(id)
//     if (!delivery) return res.status(404).json({ message: 'Delivery not found' })

//     if (!['ADMIN', 'GODOWN'].includes(req.user.role))
//       return res.status(403).json({ message: 'Not authorised' })

//     if (req.user.role === 'GODOWN') {
//       if (String(delivery.fromGodownId) !== String(req.user.godownId))
//         return res.status(403).json({ message: 'This delivery belongs to a different godown' })
//     }

//     if (!hasPartialReturn(delivery))
//       return res.status(409).json({ message: 'All items have already been returned' })

//     const [y, m, d] = reDeliveryDate.split('-').map(Number)
//     delivery.reDeliveryDate = new Date(Date.UTC(y, m - 1, d))
//     delivery.reDeliveryNote = (note || '').trim() || undefined

//     await delivery.save()

//     // Return the pending summary so frontend can confirm
//     const pendingLines = (delivery.lines || [])
//       .filter((l) => (Number(l.dispatchedQty) || 0) > (Number(l.returnedQty) || 0))
//       .map((l) => ({
//         productId:    String(l.productId),
//         dispatchedQty: Number(l.dispatchedQty) || 0,
//         returnedQty:  Number(l.returnedQty)   || 0,
//         pendingQty:   (Number(l.dispatchedQty) || 0) - (Number(l.returnedQty) || 0),
//       }))

//     return res.json({
//       ok: true,
//       reDeliveryDate: delivery.reDeliveryDate,
//       reDeliveryNote: delivery.reDeliveryNote,
//       pendingLines,
//       totalPending: pendingLines.reduce((s, l) => s + l.pendingQty, 0),
//     })
//   } catch (err) {
//     console.error('[scheduleReDelivery]', err)
//     return res.status(500).json({ message: err.message || 'Failed to schedule re-delivery' })
//   }
// }

// module.exports = {
//   getPartialReturnCalendar,
//   getAllPartialReturns,
//   getPartialReturnDaily,
//   scheduleReDelivery,
// }

/**
 * partialReturnController.js
 *
 * GET  /deliveries/partial-returns/calendar?month=YYYY-MM&godownId=
 * GET  /deliveries/partial-returns/all?month=YYYY-MM&godownId=      ← NEW (default list)
 * GET  /deliveries/partial-returns/daily?date=YYYY-MM-DD&godownId=
 * PATCH /deliveries/:id/re-delivery   { reDeliveryDate, note }
 */

const mongoose = require('mongoose')
const Delivery  = require('../models/Delivery')
const Product   = require('../models/Product')
const { logActivity } = require('../utils/activityLog')

// ── date helpers (IST calendar days — matches reportController) ────────────
// Frontend date keys and returnExpectedAt are local IST days; UTC midnight
// ranges would shift items to the previous/next day.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

function dayRange(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map(Number)
  const istMidnightUTC = Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0) - IST_OFFSET_MS
  return {
    start: new Date(istMidnightUTC),
    end:   new Date(istMidnightUTC + 24 * 60 * 60 * 1000),
  }
}

function monthRange(monthStr) {
  const [y, m] = String(monthStr).split('-').map(Number)
  const start = dayRange(`${y}-${String(m).padStart(2, '0')}-01`).start
  const nextY = m === 12 ? y + 1 : y
  const nextM = m === 12 ? 1 : m + 1
  const end = dayRange(`${nextY}-${String(nextM).padStart(2, '0')}-01`).start
  return { start, end }
}

function toDateKey(date) {
  if (!date) return null
  const istMs = new Date(date).getTime() + IST_OFFSET_MS
  const ist = new Date(istMs)
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}-${String(ist.getUTCDate()).padStart(2, '0')}`
}

// ── query builder ──────────────────────────────────────────────────────────
// Return Calendar mirrors Delivery Manager return-flow statuses, date-wise
// by returnExpectedAt:
//   RETURN_PICKUP  — assigned return pickup (DM "Return pickup" tab)
//   PENDING_RETURN — biller pending return still outstanding

function buildBaseQuery(godownId) {
  const q = {
    status: { $in: ['RETURN_PICKUP', 'PENDING_RETURN'] },
    'lines.0': { $exists: true },
    returnExpectedAt: { $exists: true, $ne: null },
  }
  if (godownId && mongoose.Types.ObjectId.isValid(godownId)) {
    q.fromGodownId = new mongoose.Types.ObjectId(godownId)
  }
  return q
}

function applyRoleScope(q, req) {
  if (req.user.role === 'GODOWN') {
    const gid = req.user.godownId
    if (!gid || !mongoose.Types.ObjectId.isValid(gid)) return false   // no access
    q.fromGodownId = new mongoose.Types.ObjectId(gid)
  }
  if (req.user.role === 'BILLER') {
    q.billerUserId = req.user.id
  }
  return true
}

// ── outstanding return detection ───────────────────────────────────────────
// Prefer dispatchedQty; fall back to ordered qty when dispatch was never written.
function hasOutstandingReturn(delivery) {
  return (delivery.lines || []).some((l) => {
    const sent = Number(l.dispatchedQty) > 0 ? Number(l.dispatchedQty) : Number(l.qty) || 0
    const returned = Number(l.returnedQty) || 0
    return sent > returned
  })
}

// Calendar day = scheduled return date (returnExpectedAt).
// returnPickupAssignedAt is assignment metadata only (when vehicle was assigned),
// not the day the delivery appears on the Return Calendar.

// Include every RETURN_PICKUP (matches DM tab). PENDING_RETURN only if still outstanding.
function isReturnCalendarDelivery(delivery) {
  if (delivery.status === 'RETURN_PICKUP') return true
  if (delivery.status === 'PENDING_RETURN') return hasOutstandingReturn(delivery)
  return false
}

// ── product name lookup ────────────────────────────────────────────────────

async function loadProductMap(deliveries) {
  const ids = new Set()
  for (const d of deliveries)
    for (const l of d.lines || []) ids.add(String(l.productId))
  if (!ids.size) return {}

  const products = await Product.find({
    _id: { $in: [...ids].map((id) => new mongoose.Types.ObjectId(id)) },
  }).select('_id particulars productId').lean()

  return Object.fromEntries(products.map((p) => [String(p._id), p]))
}

// ── map delivery → frontend shape ─────────────────────────────────────────

function mapDelivery(d, productMap) {
  const lines = (d.lines || []).map((line) => {
    const productId   = String(line.productId)
    const product     = productMap[productId]
    const dispatched  = Number(line.dispatchedQty) > 0
      ? Number(line.dispatchedQty)
      : Number(line.qty) || 0
    const returned    = Number(line.returnedQty)   || 0
    const pending     = Math.max(0, dispatched - returned)  // items still with client

    return {
      productId,
      productName:  product ? (product.particulars || product.productId || productId) : productId,
      qty:          Number(line.qty) || 0,
      dispatchedQty: dispatched,
      returnedQty:  returned,
      pendingQty:   pending,    // ← sent 7, returned 3 → pendingQty = 4
    }
  })

  const totalQty    = lines.reduce((s, l) => s + l.dispatchedQty, 0)
  const returnedQty = lines.reduce((s, l) => s + l.returnedQty,   0)
  const pendingQty  = lines.reduce((s, l) => s + l.pendingQty,    0)

  return {
    _id:             String(d._id),
    deliveryNo:      d.deliveryNo,
    customerName:    d.customerName,
    siteName:        d.siteName,
    siteAddress:     d.siteAddress,
    contactPhone:    d.contactPhone,
    deliveryAt:      d.deliveryAt,
    returnExpectedAt: d.returnExpectedAt,
    billerPendingReturnAt: d.billerPendingReturnAt || null,
    returnPickupAssignedAt: d.returnPickupAssignedAt || null,
    returnPickupVehicleLabel: d.returnPickupVehicleLabel || null,
    reDeliveryDate:  d.reDeliveryDate  || null,
    reDeliveryNote:  d.reDeliveryNote  || null,
    status:          d.status,
    lines,
    totalQty,
    returnedQty,
    pendingQty,
  }
}

// ── controllers ────────────────────────────────────────────────────────────

/**
 * GET /deliveries/partial-returns/calendar?month=YYYY-MM&godownId=
 * Returns dot counts per day for the calendar grid.
 */
async function getPartialReturnCalendar(req, res) {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7)
    if (!/^\d{4}-\d{2}$/.test(month))
      return res.status(400).json({ message: 'month must be YYYY-MM' })

    const { start, end } = monthRange(month)
    const q = { ...buildBaseQuery(req.query.godownId), returnExpectedAt: { $gte: start, $lt: end } }
    if (!applyRoleScope(q, req)) return res.json({ days: [], totalPartial: 0 })

    const deliveries = await Delivery.find(q)
      .select('returnExpectedAt status lines').lean()

    const partials = deliveries.filter(isReturnCalendarDelivery)

    const countByDate = {}
    for (const d of partials) {
      const key = toDateKey(d.returnExpectedAt)
      if (!key) continue
      countByDate[key] = (countByDate[key] || 0) + 1
    }

    const days = Object.entries(countByDate)
      .map(([date, partialCount]) => ({ date, partialCount }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return res.json({ days, totalPartial: partials.length })
  } catch (err) {
    console.error('[partialReturnCalendar]', err)
    return res.status(500).json({ message: err.message || 'Failed to load calendar' })
  }
}

/**
 * GET /deliveries/partial-returns/all?page=&limit=&month=YYYY-MM&godownId=
 * Returns partial-return deliveries, newest-due first, paginated.
 * This is the DEFAULT list shown before the user picks a date — by default
 * it spans ALL months (not just the currently viewed calendar month), since
 * the calendar's month navigation is only for browsing the dot grid, not for
 * scoping which pending returns show in the list below it. Pass `month` to
 * additionally narrow to a specific month if needed.
 */
async function getAllPartialReturns(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20))

    const q = buildBaseQuery(req.query.godownId)
    if (req.query.month) {
      if (!/^\d{4}-\d{2}$/.test(req.query.month))
        return res.status(400).json({ message: 'month must be YYYY-MM' })
      const { start, end } = monthRange(req.query.month)
      q.returnExpectedAt = { $gte: start, $lt: end }
    }
    if (!applyRoleScope(q, req)) return res.json({ items: [], total: 0, page, limit })

    // isReturnCalendarDelivery needs status + line qty, so filter in app code
    // then paginate the filtered set.
    const deliveries = await Delivery.find(q).sort({ returnExpectedAt: 1 }).lean()
    const partials = deliveries.filter(isReturnCalendarDelivery)

    const total = partials.length
    const pageItems = partials.slice((page - 1) * limit, page * limit)
    const productMap = await loadProductMap(pageItems)

    return res.json({
      items: pageItems.map((d) => mapDelivery(d, productMap)),
      total,
      page,
      limit,
    })
  } catch (err) {
    console.error('[getAllPartialReturns]', err)
    return res.status(500).json({ message: err.message || 'Failed to load returns' })
  }
}

/**
 * GET /deliveries/partial-returns/daily?date=YYYY-MM-DD&godownId=
 * Returns partial returns for a specific date only (when user clicks a calendar date).
 */
async function getPartialReturnDaily(req, res) {
  try {
    const date = req.query.date
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      return res.status(400).json({ message: 'date must be YYYY-MM-DD' })

    const { start, end } = dayRange(date)
    const q = { ...buildBaseQuery(req.query.godownId), returnExpectedAt: { $gte: start, $lt: end } }
    if (!applyRoleScope(q, req)) return res.json([])

    const deliveries = await Delivery.find(q).sort({ returnExpectedAt: 1 }).lean()
    const partials = deliveries.filter(isReturnCalendarDelivery)
    if (!partials.length) return res.json([])

    const productMap = await loadProductMap(partials)
    return res.json(partials.map((d) => mapDelivery(d, productMap)))
  } catch (err) {
    console.error('[partialReturnDaily]', err)
    return res.status(500).json({ message: err.message || 'Failed to load daily returns' })
  }
}

/**
 * PATCH /deliveries/:id/re-delivery
 * Schedule or reschedule a re-delivery date for the remaining outstanding items.
 * Body: { reDeliveryDate: 'YYYY-MM-DD', note?: string }
 *
 * Example: sent 7, client returned 3, pending 4.
 * Admin picks a new date → those 4 items will be collected/returned on that date.
 */
async function scheduleReDelivery(req, res) {
  try {
    const { id } = req.params
    const { reDeliveryDate, note } = req.body

    if (!reDeliveryDate || !/^\d{4}-\d{2}-\d{2}$/.test(reDeliveryDate))
      return res.status(400).json({ message: 'reDeliveryDate must be YYYY-MM-DD' })

    const delivery = await Delivery.findById(id)
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' })

    if (!['ADMIN', 'GODOWN'].includes(req.user.role))
      return res.status(403).json({ message: 'Not authorised' })

    if (req.user.role === 'GODOWN') {
      if (String(delivery.fromGodownId) !== String(req.user.godownId))
        return res.status(403).json({ message: 'This delivery belongs to a different godown' })
    }

    if (!hasOutstandingReturn(delivery))
      return res.status(409).json({ message: 'All items have already been returned' })

    const [y, m, d] = reDeliveryDate.split('-').map(Number)
    delivery.reDeliveryDate = new Date(Date.UTC(y, m - 1, d))
    delivery.reDeliveryNote = (note || '').trim() || undefined

    await delivery.save()

    logActivity({
      req,
      action: 'RE_DELIVERY_SCHEDULED',
      category: 'DELIVERY',
      targetType: 'DELIVERY',
      targetId: String(delivery._id),
      targetName: delivery.deliveryNo || delivery.customerName || String(delivery._id),
      details: {
        reDeliveryDate: delivery.reDeliveryDate,
        reDeliveryNote: delivery.reDeliveryNote,
      },
    })

    // Return the pending summary so frontend can confirm
    const pendingLines = (delivery.lines || [])
      .filter((l) => {
        const sent = Number(l.dispatchedQty) > 0 ? Number(l.dispatchedQty) : Number(l.qty) || 0
        return sent > (Number(l.returnedQty) || 0)
      })
      .map((l) => {
        const dispatchedQty = Number(l.dispatchedQty) > 0 ? Number(l.dispatchedQty) : Number(l.qty) || 0
        const returnedQty = Number(l.returnedQty) || 0
        return {
          productId: String(l.productId),
          dispatchedQty,
          returnedQty,
          pendingQty: dispatchedQty - returnedQty,
        }
      })

    return res.json({
      ok: true,
      reDeliveryDate: delivery.reDeliveryDate,
      reDeliveryNote: delivery.reDeliveryNote,
      pendingLines,
      totalPending: pendingLines.reduce((s, l) => s + l.pendingQty, 0),
    })
  } catch (err) {
    console.error('[scheduleReDelivery]', err)
    return res.status(500).json({ message: err.message || 'Failed to schedule re-delivery' })
  }
}

module.exports = {
  getPartialReturnCalendar,
  getAllPartialReturns,
  getPartialReturnDaily,
  scheduleReDelivery,
}