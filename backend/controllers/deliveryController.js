const crypto = require('crypto')
const mongoose = require('mongoose')
const Delivery = require('../models/Delivery')
const DeliveryScanEvent = require('../models/DeliveryScanEvent')
const AssetTag = require('../models/AssetTag')
const Godown = require('../models/Godown')
const GodownProduct = require('../models/GodownProduct')
const InventoryLedger = require('../models/InventoryLedger')
const User = require('../models/User')
const Order = require('../models/Order')
const PDFDocument = require('pdfkit')
const { populateLineDetails, populateBillerReturnLines, enrichListRows } = require('../utils/deliveryLineDetails')
const { renderChallanPdf } = require('../utils/renderChallanPdf')
const { renderReturnChallanPdf, buildReturnLines } = require('../utils/renderReturnChallanPdf')
const {
  deliveryGodownIds,
  ensureDeliveryDriver,
  syncOrderStatus,
  notifyDeliveryProcessed,
  notifyDeliveryPacked,
  notifyOutForDelivery,
  notifyReturnPickupAssigned,
} = require('../utils/deliveryWorkflow')
const { publicBaseUrl } = require('../utils/publicBaseUrl')
const {
  validGodownId,
  godownCanAccessDelivery,
  godownAccessDeniedMessage,
} = require('../utils/godownAccess')

function makeDeliveryNo() {
  const n = Math.floor(10000 + Math.random() * 89999)
  return `DLV-${n}`
}

function makeVerifyToken() {
  return crypto.randomBytes(24).toString('base64url')
}

function shareUrls(d, req) {
  const base = publicBaseUrl(req)
  return {
    deliveryVerifyUrl: `${base}/p/delivery/${encodeURIComponent(d.deliveryVerifyToken || '')}`,
    billerReturnUrl: `${base}/p/biller/${encodeURIComponent(d.billerReturnVerifyToken || '')}`,
  }
}

function uniqPush(arr, value) {
  if (!value) return arr
  const s = new Set(arr)
  s.add(value)
  return Array.from(s)
}

function uniqPushMany(arr, values) {
  const s = new Set(arr)
  for (const v of values || []) {
    if (!v) continue
    s.add(v)
  }
  return Array.from(s)
}

function requiredQtyByProduct(delivery) {
  const map = new Map()
  for (const line of delivery.lines || []) {
    const id = String(line.productId)
    map.set(id, (map.get(id) || 0) + Number(line.qty))
  }
  return map
}

function dispatchedQtyByProduct(delivery) {
  const map = new Map()
  for (const line of delivery.lines || []) {
    const id = String(line.productId)
    map.set(id, (map.get(id) || 0) + (Number(line.dispatchedQty) || 0))
  }
  return map
}

function returnedQtyByProduct(delivery) {
  const map = new Map()
  for (const line of delivery.lines || []) {
    const id = String(line.productId)
    map.set(id, (map.get(id) || 0) + (Number(line.returnedQty) || 0))
  }
  return map
}

function godownIdForLine(line, delivery) {
  return line.godownId || delivery.fromGodownId
}

function deliveryStockLocked(delivery) {
  return ['OUT_FOR_DELIVERY', 'DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN', 'COMPLETED'].includes(
    delivery.status,
  )
}

function godownIdForProduct(delivery, productId) {
  for (const line of delivery.lines || []) {
    if (String(line.productId) === String(productId)) {
      return godownIdForLine(line, delivery)
    }
  }
  return delivery.fromGodownId
}

function countsMatchDispatchedQty(required, dispatched) {
  for (const [pid, need] of required) {
    const got = dispatched.get(pid) || 0
    if (got !== need) return false
  }
  return true
}

function dispatchQtyComplete(delivery) {
  const required = requiredQtyByProduct(delivery)
  const dispatched = dispatchedQtyByProduct(delivery)
  return countsMatchDispatchedQty(required, dispatched)
}

async function dispatchCompleteAsync(delivery) {
  if (dispatchQtyComplete(delivery)) return true
  const required = requiredQtyByProduct(delivery)
  const dispatchCounts = await scannedCountsByProduct(delivery.dispatchedTagIds || [])
  return countsMatchRequired(required, dispatchCounts)
}

async function stockByGodownForDelivery(delivery) {
  const godownIds = [...new Set((delivery.lines || []).map((l) => String(godownIdForLine(l, delivery))))]
  const stockByGodown = {}
  for (const gid of godownIds) {
    const map = await stockQtyByGodownProduct(gid)
    stockByGodown[gid] = Object.fromEntries(map)
  }
  return stockByGodown
}

async function writeLedgerEntry({ godownId, productId, qtyDelta, reason, delivery, userId }) {
  const gid = new mongoose.Types.ObjectId(String(godownId))
  const pid = new mongoose.Types.ObjectId(String(productId))
  return InventoryLedger.create({
    godownId: gid,
    productId: pid,
    qtyDelta,
    reason,
    refType: 'Delivery',
    refId: String(delivery._id),
    byUserId: userId ? new mongoose.Types.ObjectId(String(userId)) : undefined,
  })
}

function outstandingDispatchByProduct(delivery) {
  const map = new Map()
  for (const line of delivery.lines || []) {
    const dispatched = Number(line.dispatchedQty) || 0
    const returned = Number(line.returnedQty) || 0
    const remaining = dispatched - returned
    if (remaining <= 0) continue
    const pid = String(line.productId)
    map.set(pid, (map.get(pid) || 0) + remaining)
  }
  return map
}

/**
 * @param {import('mongoose').Document} delivery
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {Map<string, number>} [qtyByProduct]
 * @param {{ lines?: Array<{ productId: unknown; godownId?: unknown; qty: number; dispatchedQty?: number }> }} [options]
 */
async function applyDispatchToLines(delivery, userId, qtyByProduct = new Map(), options = {}) {
  const useExplicitQty = qtyByProduct.size > 0
  const pending = new Map(qtyByProduct)
  const ledgerWrites = []
  const lines = options.lines?.length ? options.lines : delivery.lines || []

  for (const line of lines) {
    const pid = String(line.productId)
    const ordered = Number(line.qty) || 0
    const already = Number(line.dispatchedQty) || 0
    const remaining = ordered - already
    if (remaining <= 0) continue

    const delta = useExplicitQty ? pending.get(pid) || 0 : remaining
    if (delta <= 0) continue
    if (already + delta > ordered) {
      return {
        ok: false,
        status: 400,
        message: `Cannot dispatch more than ordered qty for product ${pid} (ordered ${ordered}, already ${already})`,
      }
    }

    const gid = godownIdForLine(line, delivery)
    const stockMap = await stockQtyByGodownProduct(gid)
    const available = stockMap.get(pid) || 0
    if (delta > available) {
      return {
        ok: false,
        status: 400,
        message: `Insufficient stock for product ${pid} in godown (need ${delta}, have ${available})`,
      }
    }

    line.dispatchedQty = already + delta
    ledgerWrites.push(
      writeLedgerEntry({
        godownId: gid,
        productId: line.productId,
        qtyDelta: -delta,
        reason: 'DISPATCH',
        delivery,
        userId,
      }),
    )
    if (pending.has(pid)) pending.delete(pid)
  }

  if (useExplicitQty && pending.size > 0) {
    return { ok: false, status: 400, message: 'Unknown or extra products in dispatch request' }
  }

  if (ledgerWrites.length) await Promise.all(ledgerWrites)
  return { ok: true, count: ledgerWrites.length }
}

/**
 * @param {import('mongoose').Document} delivery
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {Map<string, number>} qtyByProduct
 * @param {{ rejectUnknown?: boolean }} [options]
 */
async function applyReturnToLines(delivery, userId, qtyByProduct, options = {}) {
  const { rejectUnknown = false } = options
  const pending = new Map(qtyByProduct)
  const ledgerWrites = []

  for (const line of delivery.lines || []) {
    const pid = String(line.productId)
    const delta = pending.get(pid)
    if (!delta) continue

    const dispatched = Number(line.dispatchedQty) || 0
    const alreadyReturned = Number(line.returnedQty) || 0
    if (alreadyReturned + delta > dispatched) {
      return {
        ok: false,
        status: 400,
        message: `Cannot return more than dispatched for product ${pid} (dispatched ${dispatched}, already returned ${alreadyReturned})`,
      }
    }

    line.returnedQty = alreadyReturned + delta
    const gid = godownIdForLine(line, delivery)
    ledgerWrites.push(
      writeLedgerEntry({
        godownId: gid,
        productId: line.productId,
        qtyDelta: delta,
        reason: 'RETURN',
        delivery,
        userId,
      }),
    )
    pending.delete(pid)
  }

  if (rejectUnknown && pending.size > 0) {
    return { ok: false, status: 400, message: 'Unknown products in return request' }
  }

  if (ledgerWrites.length) await Promise.all(ledgerWrites)
  return { ok: true, count: ledgerWrites.length }
}

async function reverseOutstandingDispatch(delivery, userId) {
  const qtyByProduct = outstandingDispatchByProduct(delivery)
  if (!qtyByProduct.size) return { ok: true, count: 0 }
  return applyReturnToLines(delivery, userId, qtyByProduct)
}

function totalRequiredQty(delivery) {
  let n = 0
  for (const q of requiredQtyByProduct(delivery).values()) n += q
  return n
}

async function scannedCountsByProduct(tagIds) {
  if (!tagIds?.length) return new Map()
  const assets = await AssetTag.find({ tagId: { $in: tagIds } }).lean()
  const counts = new Map()
  for (const a of assets) {
    const pid = String(a.productId)
    counts.set(pid, (counts.get(pid) || 0) + 1)
  }
  return counts
}

function countsMatchRequired(required, scanned) {
  for (const [pid, need] of required) {
    const got = scanned.get(pid) || 0
    if (got !== need) return false
  }
  for (const [pid, got] of scanned) {
    if (!required.has(pid) && got > 0) return false
  }
  return true
}

function scanProgress(delivery, tagIds) {
  const required = requiredQtyByProduct(delivery)
  const totalRequired = totalRequiredQty(delivery)
  return {
    required: Object.fromEntries(required),
    scanned: tagIds.length,
    totalRequired,
    complete: tagIds.length >= totalRequired,
  }
}

function vehicleMatchesUser(delivery, user) {
  if (!user?.loginId) return false
  const login = String(user.loginId).toUpperCase()
  if (delivery.vehicleLabel && String(delivery.vehicleLabel).toUpperCase() === login) return true
  if (
    delivery.returnPickupVehicleLabel &&
    String(delivery.returnPickupVehicleLabel).toUpperCase() === login
  ) {
    return true
  }
  return false
}

function deliveryHasScanActivity(delivery) {
  const lists = [
    delivery.dispatchedTagIds,
    delivery.pickedUpTagIds,
    delivery.deliveredTagIds,
    delivery.returnPickedUpTagIds,
    delivery.returnedTagIds,
    delivery.damagedTagIds,
    delivery.lostTagIds,
  ]
  return lists.some((arr) => Array.isArray(arr) && arr.length > 0)
}

function deliveryDeletable(delivery) {
  if (!['PROCESSED', 'CANCELLED'].includes(delivery.status)) return false
  return !deliveryHasScanActivity(delivery)
}

function deliveryAccessOk(req, delivery) {
  if (req.user.role === 'ADMIN') return true
  if (req.user.role === 'DELIVERY') {
    const assigned = String(delivery.assignedDeliveryUserId || '') === String(req.user.id)
    return assigned || vehicleMatchesUser(delivery, req.user)
  }
  if (req.user.role === 'GODOWN') {
    return godownCanAccessDelivery(req, delivery)
  }
  if (req.user.role === 'BILLER') {
    return String(delivery.billerUserId || '') === String(req.user.id)
  }
  return false
}

function deliveryAccessDeniedMessage(req, delivery) {
  if (req.user.role === 'GODOWN') return godownAccessDeniedMessage(req, delivery)
  return 'Forbidden'
}

function pickupLocationFromGodown(g, godownId) {
  const gid = godownId ? String(godownId) : g ? String(g._id) : undefined
  return {
    godownId: gid,
    name: g?.name || 'Godown',
    address: g?.address || '',
    mobile: g?.mobile,
  }
}

function dropLocationFromDelivery(d) {
  return {
    customerName: d.customerName,
    siteName: d.siteName,
    siteAddress: d.siteAddress,
    contactPhone: d.contactPhone,
  }
}

function slimDriverLines(lines) {
  return (lines || []).map((l) => ({
    productId: l.productId,
    godownId: l.godownId,
    godownName: l.godownName,
    particulars: l.particulars,
    sku: l.sku,
    qty: l.qty,
    unit: l.unit,
    dispatchedQty: l.dispatchedQty,
    returnedQty: l.returnedQty,
  }))
}

function pickupLocationsFromLines(delivery, enrichedLines, godownMap) {
  const idSet = new Set()
  for (const line of enrichedLines || []) {
    if (line.godownId) idSet.add(String(line.godownId))
  }
  for (const line of delivery.lines || []) {
    const gid = godownIdForLine(line, delivery)
    if (gid) idSet.add(String(gid))
  }
  if (!idSet.size && delivery.fromGodownId) {
    idSet.add(String(delivery.fromGodownId))
  }
  return [...idSet].map((gid) => pickupLocationFromGodown(godownMap.get(gid), gid))
}

async function loadGodownMapForDeliveries(list) {
  const allGodownIds = new Set()
  for (const d of list) {
    for (const id of deliveryGodownIds(d)) allGodownIds.add(String(id))
  }
  if (!allGodownIds.size) return new Map()
  const godowns = await Godown.find({ _id: { $in: [...allGodownIds] } }).lean()
  return new Map(godowns.map((g) => [String(g._id), g]))
}

async function mapDriverListRows(list) {
  const godownMap = await loadGodownMapForDeliveries(list)

  return Promise.all(
    list.map(async (d) => {
      const enriched = await populateLineDetails(d)
      const pickupLocations = pickupLocationsFromLines(d, enriched, godownMap)
      return {
        id: String(d._id),
        deliveryNo: d.deliveryNo,
        status: d.status,
        phase: d.phase || 'FORWARD',
        deliveryAt: d.deliveryAt,
        returnExpectedAt: d.returnExpectedAt,
        contactPhone: d.contactPhone,
        vehicleLabel: d.vehicleLabel,
        driverName: d.driverName,
        driverPhone: d.driverPhone,
        pickupLocation: pickupLocations[0] || pickupLocationFromGodown(null, d.fromGodownId),
        pickupLocations,
        dropLocation: dropLocationFromDelivery(d),
        lines: slimDriverLines(enriched),
      }
    }),
  )
}

async function mapListRow(d, enrichment = {}) {
  const dispatchComplete = await dispatchCompleteAsync(d)
  return {
    id: String(d._id),
    deliveryNo: d.deliveryNo,
    orderId: d.orderId ? String(d.orderId) : undefined,
    customerName: d.customerName,
    siteName: d.siteName,
    siteAddress: d.siteAddress,
    deliveryAt: d.deliveryAt,
    returnExpectedAt: d.returnExpectedAt,
    deliveryTimeSlot: d.deliveryTimeSlot,
    returnTimeSlot: d.returnTimeSlot,
    selfDelivery: d.selfDelivery,
    fromGodownId: String(d.fromGodownId),
    billerUserId: d.billerUserId ? String(d.billerUserId) : undefined,
    vehicleLabel: d.vehicleLabel,
    driverName: d.driverName,
    driverPhone: d.driverPhone,
    vehicleType: d.vehicleType,
    returnPickupVehicleLabel: d.returnPickupVehicleLabel,
    returnPickupDriverName: d.returnPickupDriverName,
    returnPickupDriverPhone: d.returnPickupDriverPhone,
    returnPickupVehicleType: d.returnPickupVehicleType,
    status: d.status,
    phase: d.phase,
    lines: d.lines,
    godownNames: enrichment.godownNames,
    primaryGodownName: enrichment.primaryGodownName,
    linesSummary: enrichment.linesSummary,
    productCount: enrichment.productCount,
    totalQty: enrichment.totalQty,
    dispatchedTagIds: d.dispatchedTagIds,
    pickedUpTagIds: d.pickedUpTagIds,
    deliveredTagIds: d.deliveredTagIds,
    returnPickedUpTagIds: d.returnPickedUpTagIds,
    returnedTagIds: d.returnedTagIds,
    damagedTagIds: d.damagedTagIds,
    lostTagIds: d.lostTagIds,
    packedAt: d.packedAt,
    outForDeliveryAt: d.outForDeliveryAt,
    vehicleVerifiedAt: d.vehicleVerifiedAt,
    pickedUpAt: d.pickedUpAt,
    returnPickupAssignedAt: d.returnPickupAssignedAt,
    challanNo: d.challanNo,
    deliveryVerifiedAt: d.deliveryVerifiedAt,
    billerReturnSubmittedAt: d.billerReturnSubmittedAt,
    billingType: d.billingType,
    invoiceNo: d.invoiceNo,
    invoiceAmount: d.invoiceAmount,
    billedAt: d.billedAt,
    damageTotal: d.damageTotal,
    missingTotal: d.missingTotal,
    billerPendingReturnAt: d.billerPendingReturnAt,
    billerPendingReturnSlot: d.billerPendingReturnSlot,
    billerDamagedLines: d.billerDamagedLines,
    qtyProgress: {
      dispatchComplete,
    },
    scanProgress: {
      dispatchComplete,
    },
  }
}

async function stockQtyByGodownProduct(godownId) {
  const rows = await InventoryLedger.aggregate([
    { $match: { godownId: new mongoose.Types.ObjectId(String(godownId)) } },
    { $group: { _id: '$productId', qty: { $sum: '$qtyDelta' } } },
  ])
  const map = new Map()
  for (const r of rows) map.set(String(r._id), Number(r.qty) || 0)
  return map
}

async function createDelivery(req, res) {
  try {
    const {
      deliveryNo: deliveryNoInput,
      orderId,
      customerName,
      siteName,
      siteAddress,
      contactPhone,
      billerUserId,
      fromGodownId,
      deliveryAt,
      returnExpectedAt,
      deliveryTimeSlot,
      returnTimeSlot,
      selfDelivery,
      assignedDeliveryUserId,
      vehicleLabel,
      lines,
    } = req.body || {}

    if (!customerName || !deliveryAt) {
      return res.status(400).json({ message: 'customerName and deliveryAt required' })
    }
    if (!billerUserId) return res.status(400).json({ message: 'billerUserId required' })

    // Delivery number must be supplied manually
    const deliveryNoTrimmed = deliveryNoInput ? String(deliveryNoInput).trim() : ''
    if (!deliveryNoTrimmed) {
      return res.status(400).json({ message: 'Delivery number is required' })
    }
    // Check uniqueness
    const existing = await Delivery.findOne({ deliveryNo: deliveryNoTrimmed }).lean()
    if (existing) {
      return res.status(400).json({ message: `Delivery number "${deliveryNoTrimmed}" already exists. Please use a different number.` })
    }

    const rawLines = Array.isArray(lines) ? lines : []
    const filteredLines = rawLines.filter((l) => l && l.productId && Number(l.qty) > 0)
    if (!filteredLines.length) {
      return res.status(400).json({ message: 'At least one product line with qty > 0 required' })
    }

    const primaryGodownId = fromGodownId || filteredLines[0].godownId
    if (!primaryGodownId) {
      return res.status(400).json({ message: 'fromGodownId or godownId on each line required' })
    }

    const normalizedLines = filteredLines.map((l) => ({
      productId: new mongoose.Types.ObjectId(String(l.productId)),
      godownId: new mongoose.Types.ObjectId(String(l.godownId || fromGodownId || primaryGodownId)),
      qty: Number(l.qty),
      dispatchedQty: 0,
      returnedQty: 0,
    }))

    for (const line of normalizedLines) {
      if (!line.godownId) {
        return res.status(400).json({ message: 'Each line must include godownId when using multiple godowns' })
      }
    }

    const needByGodown = new Map()
    for (const line of normalizedLines) {
      const gid = String(line.godownId)
      const pid = String(line.productId)
      const key = `${gid}:${pid}`
      needByGodown.set(key, (needByGodown.get(key) || 0) + line.qty)
    }

    const godownIds = [...new Set(normalizedLines.map((l) => String(l.godownId)))]
    for (const gid of godownIds) {
      const stockMap = await stockQtyByGodownProduct(gid)
      for (const [key, need] of needByGodown) {
        if (!key.startsWith(`${gid}:`)) continue
        const pid = key.split(':')[1]
        const available = stockMap.get(pid) || 0
        if (need > available) {
          return res.status(400).json({
            message: `Insufficient stock for product ${pid} in godown (need ${need}, have ${available})`,
          })
        }
      }
    }

    const biller = await User.findById(billerUserId).lean()
    if (!biller || biller.role !== 'BILLER') return res.status(400).json({ message: 'Invalid biller user' })

    let assignedId = assignedDeliveryUserId || undefined
    const vehicle = vehicleLabel ? String(vehicleLabel).trim().toUpperCase() : undefined
    if (vehicle && !assignedId) {
      const driver = await User.findOne({ role: 'DELIVERY', loginId: vehicle, active: true }).lean()
      if (driver) assignedId = driver._id
    }

    const deliveryNo = deliveryNoTrimmed
    const delivery = await Delivery.create({
      deliveryNo,
      challanNo: deliveryNo,
      orderId: orderId || undefined,
      customerName,
      siteName,
      siteAddress,
      contactPhone,
      billerUserId,
      fromGodownId: primaryGodownId,
      deliveryAt: new Date(deliveryAt),
      returnExpectedAt: returnExpectedAt ? new Date(returnExpectedAt) : undefined,
      deliveryTimeSlot: deliveryTimeSlot || undefined,
      returnTimeSlot: returnTimeSlot || undefined,
      selfDelivery: selfDelivery !== undefined ? Boolean(selfDelivery) : false,
      assignedDeliveryUserId: assignedId,
      vehicleLabel: vehicle,
      lines: normalizedLines,
      status: 'PROCESSED',
      phase: 'FORWARD',
      deliveryVerifyToken: makeVerifyToken(),
      billerReturnVerifyToken: makeVerifyToken(),
      createdByUserId: req.user?.id,
    })

    if (orderId) {
      const order = await Order.findById(orderId)
      if (order) {
        order.fromGodownId = primaryGodownId
        order.status = 'ALLOCATED'
        await order.save()
      }
    }

    // Deduct stock immediately on delivery creation so the godown stock view
    // reflects the reservation as soon as the delivery is processed.
    const ledgerWrites = normalizedLines.map((line) =>
      writeLedgerEntry({
        godownId: line.godownId,
        productId: line.productId,
        qtyDelta: -Number(line.qty),
        reason: 'DISPATCH',
        delivery,
        userId: req.user?.id,
      }),
    )
    await Promise.all(ledgerWrites)

    // Update dispatchedQty on lines to reflect the reservation
    for (const line of delivery.lines) {
      line.dispatchedQty = line.qty
    }
    delivery.markModified('lines')
    await delivery.save()

    await syncOrderStatus(delivery, 'PROCESSED')
    await notifyDeliveryProcessed(delivery)

    const urls = shareUrls(delivery, req)
    return res.status(201).json({
      id: String(delivery._id),
      deliveryNo: delivery.deliveryNo,
      status: delivery.status,
      deliveryVerifyUrl: urls.deliveryVerifyUrl,
      billerReturnUrl: urls.billerReturnUrl,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Create delivery failed' })
  }
}

function lineKey(godownId, productId) {
  return `${String(godownId)}:${String(productId)}`
}

function normalizeIncomingLines(rawLines, fromGodownId) {
  const filteredLines = (Array.isArray(rawLines) ? rawLines : []).filter(
    (l) => l && l.productId && Number(l.qty) > 0,
  )
  if (!filteredLines.length) {
    return { error: 'At least one product line with qty > 0 required' }
  }

  const primaryGodownId = fromGodownId || filteredLines[0].godownId
  if (!primaryGodownId) {
    return { error: 'fromGodownId or godownId on each line required' }
  }

  const normalizedLines = filteredLines.map((l) => ({
    productId: new mongoose.Types.ObjectId(String(l.productId)),
    godownId: new mongoose.Types.ObjectId(String(l.godownId || fromGodownId || primaryGodownId)),
    qty: Number(l.qty),
    dispatchedQty: 0,
    returnedQty: 0,
  }))

  for (const line of normalizedLines) {
    if (!line.godownId) {
      return { error: 'Each line must include godownId when using multiple godowns' }
    }
  }

  const needByGodown = new Map()
  for (const line of normalizedLines) {
    const gid = String(line.godownId)
    const pid = String(line.productId)
    const key = lineKey(gid, pid)
    needByGodown.set(key, (needByGodown.get(key) || 0) + line.qty)
  }

  return { normalizedLines, primaryGodownId, needByGodown }
}

async function assertStockForNeed(needByGodown) {
  const godownIds = [...new Set([...needByGodown.keys()].map((k) => k.split(':')[0]))]
  for (const gid of godownIds) {
    const stockMap = await stockQtyByGodownProduct(gid)
    for (const [key, need] of needByGodown) {
      if (!key.startsWith(`${gid}:`)) continue
      const pid = key.split(':')[1]
      const available = stockMap.get(pid) || 0
      if (need > available) {
        return {
          ok: false,
          message: `Insufficient stock for product ${pid} in godown (need ${need}, have ${available})`,
        }
      }
    }
  }
  return { ok: true }
}

async function maxScannedQtyByProduct(delivery) {
  const tagLists = [
    delivery.dispatchedTagIds,
    delivery.pickedUpTagIds,
    delivery.deliveredTagIds,
    delivery.returnPickedUpTagIds,
  ]
  const maps = await Promise.all(tagLists.map((ids) => scannedCountsByProduct(ids || [])))
  const max = new Map()
  for (const m of maps) {
    for (const [pid, count] of m) {
      max.set(pid, Math.max(max.get(pid) || 0, count))
    }
  }
  return max
}

async function lineHasTagActivity(delivery, productId, godownId) {
  const pid = String(productId)
  const gid = String(godownId)
  const tagIds = allDeliveryTagIds(delivery)
  if (!tagIds.length) return false
  const assets = await AssetTag.find({ tagId: { $in: tagIds }, productId }).lean()
  return assets.some((a) => {
    if (String(a.productId) !== pid) return false
    if (a.currentGodownId && String(a.currentGodownId) === gid) return true
    return godownIdForProduct(delivery, pid) === gid
  })
}

async function applyConstrainedLineUpdate(delivery, userId, desiredByKey) {
  const scannedMax = await maxScannedQtyByProduct(delivery)
  const existingByKey = new Map()
  for (const line of delivery.lines || []) {
    const gid = String(godownIdForLine(line, delivery))
    const pid = String(line.productId)
    existingByKey.set(lineKey(gid, pid), line)
  }

  const desiredQtyByProduct = new Map()
  for (const [key, qty] of desiredByKey) {
    const pid = key.split(':')[1]
    desiredQtyByProduct.set(pid, (desiredQtyByProduct.get(pid) || 0) + qty)
  }

  for (const [pid, need] of scannedMax) {
    const want = desiredQtyByProduct.get(pid) || 0
    if (want < need) {
      return {
        ok: false,
        status: 409,
        message: `Cannot reduce below ${need} scanned unit(s) for product ${pid}`,
      }
    }
  }

  for (const [key, line] of existingByKey) {
    if (desiredByKey.has(key)) continue
    const dispatched = Number(line.dispatchedQty) || 0
    if (dispatched > 0) {
      return {
        ok: false,
        status: 409,
        message: `Cannot remove product ${line.productId} — stock already dispatched`,
      }
    }
  }

  for (const [key, desiredQty] of desiredByKey) {
    const existing = existingByKey.get(key)
    if (!existing) continue
    const newGid = key.split(':')[0]
    const oldGid = String(godownIdForLine(existing, delivery))
    if (newGid !== oldGid) {
      const active = await lineHasTagActivity(delivery, existing.productId, oldGid)
      if (active || Number(existing.dispatchedQty) > 0) {
        return {
          ok: false,
          status: 409,
          message: `Cannot change godown for product ${existing.productId} after dispatch activity`,
        }
      }
    }
    const minQty = Number(existing.dispatchedQty) || 0
    if (desiredQty < minQty) {
      return {
        ok: false,
        status: 409,
        message: `Cannot reduce below ${minQty} dispatched for product ${existing.productId}`,
      }
    }
  }

  for (const [key, line] of existingByKey) {
    if (desiredByKey.has(key)) continue
    const outstanding = Math.max(0, (Number(line.dispatchedQty) || 0) - (Number(line.returnedQty) || 0))
    if (outstanding > 0) {
      const pid = String(line.productId)
      const returnResult = await applyReturnToLines(delivery, userId, new Map([[pid, outstanding]]))
      if (!returnResult.ok) return returnResult
    }
  }

  delivery.lines = (delivery.lines || []).filter((line) => {
    const key = lineKey(godownIdForLine(line, delivery), line.productId)
    return desiredByKey.has(key)
  })

  for (const [key, desiredQty] of desiredByKey) {
    const [gid, pid] = key.split(':')
    let line = (delivery.lines || []).find(
      (l) => lineKey(godownIdForLine(l, delivery), l.productId) === key,
    )
    if (!line) {
      line = {
        productId: new mongoose.Types.ObjectId(pid),
        godownId: new mongoose.Types.ObjectId(gid),
        qty: desiredQty,
        dispatchedQty: 0,
        returnedQty: 0,
      }
      delivery.lines.push(line)
      if (deliveryStockLocked(delivery)) {
        const dispatchResult = await applyDispatchToLines(delivery, userId, new Map(), { lines: [line] })
        if (!dispatchResult.ok) return dispatchResult
      }
      continue
    }

    const oldQty = Number(line.qty) || 0
    if (desiredQty === oldQty) continue

    if (desiredQty > oldQty) {
      const delta = desiredQty - oldQty
      line.qty = desiredQty
      if (deliveryStockLocked(delivery)) {
        const dispatchResult = await applyDispatchToLines(delivery, userId, new Map([[pid, delta]]))
        if (!dispatchResult.ok) return dispatchResult
      }
    } else {
      const reduceBy = oldQty - desiredQty
      const outstanding = Math.max(0, (Number(line.dispatchedQty) || 0) - (Number(line.returnedQty) || 0))
      const returnQty = Math.min(reduceBy, outstanding)
      if (returnQty > 0) {
        const returnResult = await applyReturnToLines(delivery, userId, new Map([[pid, returnQty]]))
        if (!returnResult.ok) return returnResult
      }
      line.qty = desiredQty
    }
  }

  delivery.markModified('lines')
  return { ok: true }
}

async function updateDelivery(req, res) {
  try {
    const delivery = await Delivery.findById(req.params.id)
    if (!delivery) return res.status(404).json({ message: 'Not found' })

    if (!deliveryAccessOk(req, delivery)) {
      return res.status(403).json({ message: deliveryAccessDeniedMessage(req, delivery) })
    }

    const isAdmin = req.user.role === 'ADMIN'
    if (req.user.role === 'BILLER' && String(delivery.billerUserId || '') !== String(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    if (req.user.role !== 'ADMIN' && req.user.role !== 'BILLER') {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const {
      customerName,
      siteName,
      siteAddress,
      contactPhone,
      billerUserId,
      fromGodownId,
      deliveryAt,
      returnExpectedAt,
      deliveryTimeSlot,
      returnTimeSlot,
      selfDelivery,
      vehicleLabel,
      lines,
    } = req.body || {}

    if (!customerName || !deliveryAt) {
      return res.status(400).json({ message: 'customerName and deliveryAt required' })
    }
    if (!billerUserId) return res.status(400).json({ message: 'billerUserId required' })

    const biller = await User.findById(billerUserId).lean()
    if (!biller || biller.role !== 'BILLER') return res.status(400).json({ message: 'Invalid biller user' })

    const canFullReplace = deliveryDeletable(delivery)
    if (!isAdmin && !canFullReplace) {
      return res.status(409).json({
        message:
          'Only processed or cancelled deliveries with no scans can be edited. Cancel the delivery or contact admin.',
      })
    }

    delivery.customerName = customerName
    delivery.siteName = siteName
    delivery.siteAddress = siteAddress
    delivery.contactPhone = contactPhone
    delivery.billerUserId = billerUserId
    delivery.deliveryAt = new Date(deliveryAt)
    delivery.returnExpectedAt = returnExpectedAt ? new Date(returnExpectedAt) : undefined
    delivery.deliveryTimeSlot = deliveryTimeSlot || undefined
    delivery.returnTimeSlot = returnTimeSlot || undefined
    delivery.selfDelivery = selfDelivery !== undefined ? Boolean(selfDelivery) : delivery.selfDelivery

    const vehicle = vehicleLabel ? String(vehicleLabel).trim().toUpperCase() : undefined
    delivery.vehicleLabel = vehicle
    if (vehicle) {
      const driver = await User.findOne({ role: 'DELIVERY', loginId: vehicle, active: true }).lean()
      if (driver) delivery.assignedDeliveryUserId = driver._id
    }

    if (Array.isArray(lines) && lines.length > 0) {
      const parsed = normalizeIncomingLines(lines, fromGodownId)
      if (parsed.error) return res.status(400).json({ message: parsed.error })

      const desiredByKey = new Map()
      for (const line of parsed.normalizedLines) {
        const key = lineKey(line.godownId, line.productId)
        desiredByKey.set(key, (desiredByKey.get(key) || 0) + line.qty)
      }

      if (canFullReplace || !isAdmin) {
        const reverseResult = await reverseOutstandingDispatch(delivery, req.user.id)
        if (!reverseResult.ok) {
          return res.status(reverseResult.status).json({ message: reverseResult.message })
        }

        const stockCheck = await assertStockForNeed(parsed.needByGodown)
        if (!stockCheck.ok) return res.status(400).json({ message: stockCheck.message })

        delivery.fromGodownId = parsed.primaryGodownId
        delivery.lines = parsed.normalizedLines
        delivery.markModified('lines')
      } else {
        const increaseNeed = new Map()
        for (const [key, qty] of desiredByKey) {
          const existing = (delivery.lines || []).find(
            (l) => lineKey(godownIdForLine(l, delivery), l.productId) === key,
          )
          const oldQty = existing ? Number(existing.qty) || 0 : 0
          if (qty > oldQty) {
            const gid = key.split(':')[0]
            const pid = key.split(':')[1]
            increaseNeed.set(key, (increaseNeed.get(key) || 0) + (qty - oldQty))
          }
        }
        if (increaseNeed.size > 0) {
          const stockCheck = await assertStockForNeed(increaseNeed)
          if (!stockCheck.ok) return res.status(400).json({ message: stockCheck.message })
        }

        const lineResult = await applyConstrainedLineUpdate(delivery, req.user.id, desiredByKey)
        if (!lineResult.ok) {
          return res.status(lineResult.status || 400).json({ message: lineResult.message })
        }

        const primaryGodownId = parsed.primaryGodownId
        if (primaryGodownId) delivery.fromGodownId = primaryGodownId
      }
    }

    await delivery.save()

    const urls = shareUrls(delivery, req)
    return res.json({
      id: String(delivery._id),
      deliveryNo: delivery.deliveryNo,
      status: delivery.status,
      deliveryVerifyUrl: urls.deliveryVerifyUrl,
      billerReturnUrl: urls.billerReturnUrl,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Update delivery failed' })
  }
}

async function listDeliveries(req, res) {
  const billerUserIdFilter = req.query.billerUserId
  const limit = billerUserIdFilter ? Math.min(1000, Number(req.query.limit || 1000)) : Math.min(200, Number(req.query.limit || 50))
  const status = req.query.status
  const fromGodownId = req.query.fromGodownId
  const q = {}
  if (status) q.status = status

  if (req.user.role === 'DELIVERY') {
    const login = req.user.loginId ? String(req.user.loginId).toUpperCase() : null
    const or = [{ assignedDeliveryUserId: req.user.id }]
    if (login) {
      or.push({ vehicleLabel: login })
      or.push({ returnPickupVehicleLabel: login })
    }
    q.$or = or
  }
  if (req.user.role === 'GODOWN') {
    const gid = validGodownId(req.user.godownId)
    if (!gid) return res.json([])
    const objId = new mongoose.Types.ObjectId(gid)
    q.$or = [{ fromGodownId: objId }, { 'lines.godownId': objId }]
  }
  if (req.user.role === 'BILLER') q.billerUserId = req.user.id
  if (req.user.role === 'ADMIN' && fromGodownId) q.fromGodownId = fromGodownId
  if (req.user.role === 'ADMIN' && billerUserIdFilter) {
    try { q.billerUserId = new mongoose.Types.ObjectId(String(billerUserIdFilter)) } catch { /* ignore bad id */ }
  }

  const list = await Delivery.find(q).sort({ createdAt: -1, _id: -1 }).limit(limit).lean()
  if (req.user.role === 'DELIVERY') {
    return res.json(await mapDriverListRows(list))
  }
  const enrichments = await enrichListRows(list)
  return res.json(await Promise.all(list.map((d, i) => mapListRow(d, enrichments[i]))))
}

async function getDelivery(req, res) {
  const d = await Delivery.findById(req.params.id).lean()
  if (!d) return res.status(404).json({ message: 'Not found' })

  if (!deliveryAccessOk(req, d)) {
    return res.status(403).json({ message: deliveryAccessDeniedMessage(req, d) })
  }

  if (req.user.role === 'DELIVERY') {
    const godownMap = await loadGodownMapForDeliveries([d])
    const lines = await populateLineDetails(d)
    const pickupLocations = pickupLocationsFromLines(d, lines, godownMap)
    const required = requiredQtyByProduct(d)
    const dispatchCounts = await scannedCountsByProduct(d.dispatchedTagIds)
    const returnPickupCounts = await scannedCountsByProduct(d.returnPickedUpTagIds || [])
    return res.json({
      id: String(d._id),
      deliveryNo: d.deliveryNo,
      customerName: d.customerName,
      siteName: d.siteName,
      siteAddress: d.siteAddress,
      contactPhone: d.contactPhone,
      fromGodownId: String(d.fromGodownId),
      deliveryAt: d.deliveryAt,
      returnExpectedAt: d.returnExpectedAt,
      status: d.status,
      phase: d.phase || 'FORWARD',
      vehicleLabel: d.vehicleLabel,
      driverName: d.driverName,
      driverPhone: d.driverPhone,
      challanNo: d.challanNo,
      // phase: d.phase || 'FORWARD',
      // vehicleLabel: d.vehicleLabel,
      // challanNo: d.challanNo,
      pickupLocation: pickupLocations[0] || pickupLocationFromGodown(null, d.fromGodownId),
      pickupLocations,
      dropLocation: dropLocationFromDelivery(d),
      lines: slimDriverLines(lines),
      dispatchedTagIds: d.dispatchedTagIds,
      pickedUpTagIds: d.pickedUpTagIds,
      deliveredTagIds: d.deliveredTagIds,
      returnPickedUpTagIds: d.returnPickedUpTagIds || [],
      scanProgress: {
        dispatch: scanProgress(d, d.dispatchedTagIds || []),
        pickup: scanProgress(d, d.pickedUpTagIds || []),
        deliver: scanProgress(d, d.deliveredTagIds || []),
        returnPickup: scanProgress(d, d.returnPickedUpTagIds || []),
        dispatchComplete: dispatchQtyComplete(d) || countsMatchRequired(required, dispatchCounts),
        returnPickupComplete: countsMatchRequired(required, returnPickupCounts),
      },
    })
  }

  const urls = shareUrls(d, req)
  const required = requiredQtyByProduct(d)
  const dispatchCounts = await scannedCountsByProduct(d.dispatchedTagIds)
  const deliverCounts = await scannedCountsByProduct(d.deliveredTagIds || [])
  const returnPickupCounts = await scannedCountsByProduct(d.returnPickedUpTagIds || [])
  const dispatchedQtyMap = dispatchedQtyByProduct(d)
  const returnedQtyMap = returnedQtyByProduct(d)
  const lines = await populateLineDetails(d)
  const stockByGodown = await stockByGodownForDelivery(d)
  const [billerMissingLines, billerDamagedLines, billerCollectedLines, billerPendingReturnLines] = await Promise.all([
    populateBillerReturnLines(d.billerMissingLines),
    populateBillerReturnLines(d.billerDamagedLines),
    populateBillerReturnLines(d.billerCollectedLines),
    populateBillerReturnLines(d.billerPendingReturnLines),
  ])

  return res.json({
    id: String(d._id),
    orderId: d.orderId ? String(d.orderId) : undefined,
    deliveryNo: d.deliveryNo,
    customerName: d.customerName,
    siteName: d.siteName,
    siteAddress: d.siteAddress,
    contactPhone: d.contactPhone,
    billerUserId: d.billerUserId ? String(d.billerUserId) : undefined,
    fromGodownId: String(d.fromGodownId),
    deliveryAt: d.deliveryAt,
    returnExpectedAt: d.returnExpectedAt,
    deliveryTimeSlot: d.deliveryTimeSlot,
    returnTimeSlot: d.returnTimeSlot,
    selfDelivery: d.selfDelivery,
    assignedDeliveryUserId: d.assignedDeliveryUserId ? String(d.assignedDeliveryUserId) : undefined,
    vehicleLabel: d.vehicleLabel,
    driverName: d.driverName,
    driverPhone: d.driverPhone,
    vehicleType: d.vehicleType,
    returnPickupVehicleLabel: d.returnPickupVehicleLabel,
    returnPickupDriverName: d.returnPickupDriverName,
    returnPickupDriverPhone: d.returnPickupDriverPhone,
    returnPickupVehicleType: d.returnPickupVehicleType,
    status: d.status,
    billingType: d.billingType,
    invoiceNo: d.invoiceNo,
    invoiceAmount: d.invoiceAmount,
    billedAt: d.billedAt,
    // selfDelivery: d.selfDelivery,
    // assignedDeliveryUserId: d.assignedDeliveryUserId ? String(d.assignedDeliveryUserId) : undefined,
    // vehicleLabel: d.vehicleLabel,
    // returnPickupVehicleLabel: d.returnPickupVehicleLabel,
    // status: d.status,
    phase: d.phase,
    lines,
    dispatchedTagIds: d.dispatchedTagIds,
    pickedUpTagIds: d.pickedUpTagIds,
    deliveredTagIds: d.deliveredTagIds,
    returnPickedUpTagIds: d.returnPickedUpTagIds || [],
    returnedTagIds: d.returnedTagIds,
    damagedTagIds: d.damagedTagIds,
    lostTagIds: d.lostTagIds,
    packedAt: d.packedAt,
    outForDeliveryAt: d.outForDeliveryAt,
    vehicleVerifiedAt: d.vehicleVerifiedAt,
    pickedUpAt: d.pickedUpAt,
    returnPickupAssignedAt: d.returnPickupAssignedAt,
    challanNo: d.challanNo,
    challanGeneratedAt: d.challanGeneratedAt,
    deliveryVerifierName: d.deliveryVerifierName,
    deliveryVerifiedAt: d.deliveryVerifiedAt,
    deliveryLineChecks: d.deliveryLineChecks,
    deliverySignature: d.deliverySignature,
    billerReturnSubmittedAt: d.billerReturnSubmittedAt,
    billerDamagedLines,
    billerMissingLines,
    billerCollectedLines,
    damageTotal: d.damageTotal,
    missingTotal: d.missingTotal,
    billerPendingReturnLines,
    billerPendingReturnAt: d.billerPendingReturnAt,
    billerPendingReturnSlot: d.billerPendingReturnSlot,
    billerPendingReturnNote: d.billerPendingReturnNote,
    deliveryVerifyUrl: urls.deliveryVerifyUrl,
    billerReturnUrl: urls.billerReturnUrl,
    stockByGodown,
    qtyProgress: {
      dispatchComplete: dispatchQtyComplete(d) || countsMatchRequired(required, dispatchCounts),
      dispatchedByProduct: Object.fromEntries(dispatchedQtyMap),
      deliveredByProduct: Object.fromEntries(deliverCounts),
      deliverComplete: countsMatchRequired(required, deliverCounts),
      returnedByProduct: Object.fromEntries(returnedQtyMap),
    },
    scanProgress: {
      dispatch: scanProgress(d, d.dispatchedTagIds || []),
      pickup: scanProgress(d, d.pickedUpTagIds || []),
      deliver: scanProgress(d, d.deliveredTagIds || []),
      returnPickup: scanProgress(d, d.returnPickedUpTagIds || []),
      dispatchComplete: dispatchQtyComplete(d) || countsMatchRequired(required, dispatchCounts),
      returnPickupComplete: countsMatchRequired(required, returnPickupCounts),
    },
  })
}

const DELIVERY_STATUSES = [
  'PROCESSED',
  'PACKED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURN_PICKUP',
  'PENDING_RETURN',
  'COMPLETED',
    'BILLED',
  'CANCELLED',
]

const STATUS_CHAIN = [
  'PROCESSED',
  'PACKED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURN_PICKUP',
  'PENDING_RETURN',
  'COMPLETED',
    'BILLED'
]

function isAdjacentStatusTransition(from, to) {
  if (from === to) return true
  if (to === 'CANCELLED') return from !== 'COMPLETED' && from !== 'BILLED'
  if (from === 'CANCELLED') return to === 'PROCESSED'

  const i = STATUS_CHAIN.indexOf(from)
  const j = STATUS_CHAIN.indexOf(to)
  if (i === -1 || j === -1) return false
  return Math.abs(i - j) === 1
}

function validatePatchStatusTransition(from, to, role) {
  if (role === 'ADMIN') return { ok: true }

  if (to === 'OUT_FOR_DELIVERY') {
    return {
      ok: false,
      status: 409,
      message: 'Use Out for delivery with a vehicle number instead of changing status directly',
    }
  }
  if (to === 'RETURN_PICKUP') {
    return {
      ok: false,
      status: 409,
      message: 'Use Assign return pickup with a vehicle number instead of changing status directly',
    }
  }
  if (!isAdjacentStatusTransition(from, to)) {
    return {
      ok: false,
      status: 409,
      message: `Cannot change status from ${from} to ${to}. Follow the delivery workflow one step at a time.`,
    }
  }
  return { ok: true }
}

function allDeliveryTagIds(delivery) {
  const ids = new Set()
  for (const key of [
    'dispatchedTagIds',
    'pickedUpTagIds',
    'deliveredTagIds',
    'returnPickedUpTagIds',
    'returnedTagIds',
    'damagedTagIds',
    'lostTagIds',
  ]) {
    for (const t of delivery[key] || []) {
      if (t) ids.add(String(t))
    }
  }
  return Array.from(ids)
}

async function deleteDelivery(req, res) {
  try {
    const delivery = await Delivery.findById(req.params.id)
    if (!delivery) return res.status(404).json({ message: 'Not found' })

    const isAdmin = req.user.role === 'ADMIN'

    if (req.user.role === 'BILLER' && String(delivery.billerUserId || '') !== String(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    if (req.user.role !== 'ADMIN' && req.user.role !== 'BILLER') {
      return res.status(403).json({ message: 'Forbidden' })
    }

    if (!isAdmin && !deliveryDeletable(delivery)) {
      return res.status(409).json({
        message:
          'Only processed or cancelled deliveries with no scans can be deleted. Cancel the delivery or contact admin.',
      })
    }

    if (delivery.orderId) {
      const order = await Order.findById(delivery.orderId)
      if (order) {
        if (isAdmin && order.status !== 'CANCELLED') {
          order.status = 'CREATED'
          await order.save()
        } else if (order.status === 'ALLOCATED') {
          order.status = 'CREATED'
          await order.save()
        }
      }
    }

    const tagIds = allDeliveryTagIds(delivery)
    const tagFilter =
      tagIds.length > 0
        ? { $or: [{ currentDeliveryId: delivery._id }, { tagId: { $in: tagIds } }] }
        : { currentDeliveryId: delivery._id }

    await AssetTag.updateMany(tagFilter, {
      $set: {
        status: 'IN_STOCK',
        currentDeliveryId: null,
        currentGodownId: delivery.fromGodownId,
      },
    })

    if (isAdmin && !deliveryDeletable(delivery)) {
      await InventoryLedger.deleteMany({
        refType: 'Delivery',
        refId: String(delivery._id),
      })
    } else {
      const reverseResult = await reverseOutstandingDispatch(delivery, req.user.id)
      if (!reverseResult.ok) {
        return res.status(reverseResult.status).json({ message: reverseResult.message })
      }
      if (reverseResult.count > 0) {
        delivery.markModified('lines')
        await delivery.save()
      }
    }

    await DeliveryScanEvent.deleteMany({ deliveryId: delivery._id })
    await Delivery.findByIdAndDelete(delivery._id)

    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Delete delivery failed' })
  }
}

async function updateDeliveryStatus(req, res) {
  try {
    const { status, billingType, invoiceNo, invoiceAmount } = req.body || {}
    if (!status || !DELIVERY_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    // When moving to BILLED, billingType is required
    if (status === 'BILLED') {
      if (!billingType || !['FREE', 'INVOICE'].includes(billingType)) {
        return res.status(400).json({ message: 'billingType must be FREE or INVOICE when marking as Billed' })
      }
      if (billingType === 'INVOICE' && !String(invoiceNo || '').trim()) {
        return res.status(400).json({ message: 'invoiceNo is required when billing type is Invoice' })
      }
    }

    const delivery = await Delivery.findById(req.params.id)
    if (!delivery) return res.status(404).json({ message: 'Not found' })
    if (!deliveryAccessOk(req, delivery)) {
      return res.status(403).json({ message: deliveryAccessDeniedMessage(req, delivery) })
    }

    const previousStatus = delivery.status
    if (previousStatus === status) {
      return res.json({ ok: true, status: delivery.status, previousStatus })
    }

    const transitionCheck = validatePatchStatusTransition(previousStatus, status, req.user.role)
    if (!transitionCheck.ok) {
      return res.status(transitionCheck.status).json({ message: transitionCheck.message })
    }

    if (status === 'CANCELLED' && previousStatus !== 'CANCELLED') {
      const reverseResult = await reverseOutstandingDispatch(delivery, req.user.id)
      if (!reverseResult.ok) {
        return res.status(reverseResult.status).json({ message: reverseResult.message })
      }
      if (reverseResult.count > 0) delivery.markModified('lines')
    }

    delivery.status = status

    if (status === 'BILLED') {
      delivery.billingType = billingType
      delivery.invoiceNo = billingType === 'INVOICE' ? String(invoiceNo).trim() : undefined
      delivery.invoiceAmount = billingType === 'INVOICE' && invoiceAmount ? String(invoiceAmount).trim() : undefined
      delivery.billedAt = new Date()
    }

    if (['RETURN_PICKUP', 'PENDING_RETURN'].includes(status)) {
      delivery.phase = 'RETURN'
    } else if (['PROCESSED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
      delivery.phase = 'FORWARD'
    }

    const now = new Date()
    if (status === 'PACKED' && !delivery.packedAt) delivery.packedAt = now
    if (status === 'OUT_FOR_DELIVERY' && !delivery.outForDeliveryAt) delivery.outForDeliveryAt = now

    await delivery.save()
    await syncOrderStatus(delivery, status)

    return res.json({
      ok: true, status: delivery.status, previousStatus,
      billingType: delivery.billingType,
      invoiceNo: delivery.invoiceNo,
      invoiceAmount: delivery.invoiceAmount,
      billedAt: delivery.billedAt,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Update status failed' })
  }
}

async function regenerateDeliveryTokens(req, res) {
  try {
    const delivery = await Delivery.findById(req.params.id)
    if (!delivery) return res.status(404).json({ message: 'Not found' })
    delivery.deliveryVerifyToken = makeVerifyToken()
    delivery.billerReturnVerifyToken = makeVerifyToken()
    await delivery.save()
    const urls = shareUrls(delivery, req)
    return res.json({
      deliveryVerifyUrl: urls.deliveryVerifyUrl,
      billerReturnUrl: urls.billerReturnUrl,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed' })
  }
}

async function markPacked(req, res) {
  try {
    const delivery = await Delivery.findById(req.params.id)
    if (!delivery) return res.status(404).json({ message: 'Not found' })
    if (!deliveryAccessOk(req, delivery)) {
      return res.status(403).json({ message: deliveryAccessDeniedMessage(req, delivery) })
    }

    delivery.status = 'PACKED'
    delivery.packedAt = new Date()
    await delivery.save()
    await syncOrderStatus(delivery, 'PACKED')
    await notifyDeliveryPacked(delivery)

    return res.json({ ok: true, status: delivery.status, packedAt: delivery.packedAt })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Mark packed failed' })
  }
}

async function assignOutForDeliveryVehicle(delivery, userId, vehicleNumber, driverName, driverPhone, vehicleType) {
  const vehicle = String(vehicleNumber).trim().toUpperCase()
  const driver = await ensureDeliveryDriver(vehicle)

  // Update driver contactName/contactPhone if provided
  let updated = false
  if (driverName && String(driverName).trim()) {
    driver.contactName = String(driverName).trim()
    updated = true
  }
  if (driverPhone && String(driverPhone).trim()) {
    driver.contactPhone = String(driverPhone).trim()
    updated = true
  }
  if (updated) await driver.save()

  // delivery.vehicleLabel = vehicle
  // delivery.driverName = driver.contactName
  // delivery.driverPhone = driver.contactPhone
  // delivery.vehicleVerifiedAt = new Date()
  // delivery.vehicleVerifiedByUserId = userId
  // delivery.assignedDeliveryUserId = driver._id

delivery.vehicleLabel = vehicle

  delivery.driverName =
    String(driverName || driver.contactName || `Vehicle ${vehicle}`).trim()

  delivery.driverPhone =
    String(driverPhone || driver.contactPhone || '').trim()

  if (vehicleType === 'PORTER' || vehicleType === 'PRIVATE' || vehicleType === 'OWN') {
    delivery.vehicleType = vehicleType
  }

  delivery.vehicleVerifiedAt = new Date()
  delivery.vehicleVerifiedByUserId = userId
  delivery.assignedDeliveryUserId = driver._id

  return { vehicle, driver }
}

async function outForDelivery(req, res) {
  try {
    const { vehicleNumber, driverName, driverPhone, vehicleType } = req.body || {}
    if (!vehicleNumber || !String(vehicleNumber).trim()) {
      return res.status(400).json({ message: 'vehicleNumber required' })
    }

    const delivery = await Delivery.findById(req.params.id)
    if (!delivery) return res.status(404).json({ message: 'Not found' })
    if (!deliveryAccessOk(req, delivery)) {
      return res.status(403).json({ message: deliveryAccessDeniedMessage(req, delivery) })
    }

    if (req.user.role === 'ADMIN') {
      return updateOutForDeliveryVehicle(req, res, delivery, vehicleNumber)
    }

    if (delivery.status === 'OUT_FOR_DELIVERY') {
      return updateOutForDeliveryVehicle(req, res, delivery, vehicleNumber)
    }

    if (!['PROCESSED', 'PACKED'].includes(delivery.status)) {
      return res.status(409).json({
        message: 'Delivery must be processed or packed before out for delivery',
      })
    }

    if (!dispatchQtyComplete(delivery)) {
      const required = requiredQtyByProduct(delivery)
      const dispatchCounts = await scannedCountsByProduct(delivery.dispatchedTagIds || [])
      const rfidDispatchComplete = countsMatchRequired(required, dispatchCounts)
      if (!rfidDispatchComplete) {
        const dispatchResult = await applyDispatchToLines(delivery, req.user.id)
        if (!dispatchResult.ok) {
          return res.status(dispatchResult.status).json({ message: dispatchResult.message })
        }
        if (dispatchResult.count > 0) delivery.markModified('lines')
      }
    }

    const dispatchDone = await dispatchCompleteAsync(delivery)
    if (!dispatchDone) {
      return res.status(400).json({
        message: 'Dispatch must be complete (RFID scans) before out for delivery',
        scanProgress: scanProgress(delivery, delivery.dispatchedTagIds),
      })
    }

    const { driver } = await assignOutForDeliveryVehicle(delivery, req.user.id, vehicleNumber, driverName, driverPhone, vehicleType)

    delivery.status = 'OUT_FOR_DELIVERY'
    delivery.outForDeliveryAt = new Date()
    delivery.phase = 'FORWARD'
    await delivery.save()

    await syncOrderStatus(delivery, 'OUT_FOR_DELIVERY')
    await notifyOutForDelivery(delivery, driver._id)

    return res.json({
      ok: true,
      status: delivery.status,
      vehicleLabel: delivery.vehicleLabel,
      driverName: delivery.driverName,
      driverPhone: delivery.driverPhone,
      vehicleType: delivery.vehicleType,
      vehicleVerifiedAt: delivery.vehicleVerifiedAt,
      outForDeliveryAt: delivery.outForDeliveryAt,
      assignedDeliveryUserId: String(delivery.assignedDeliveryUserId),
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Out for delivery failed' })
  }
}

async function updateOutForDeliveryVehicle(req, res, existingDelivery, vehicleNumber) {
  try {
    const delivery = existingDelivery || (await Delivery.findById(req.params.id))
    if (!delivery) return res.status(404).json({ message: 'Not found' })
    if (!existingDelivery && !deliveryAccessOk(req, delivery)) {
      return res.status(403).json({ message: deliveryAccessDeniedMessage(req, delivery) })
    }

    const number = vehicleNumber ?? req.body?.vehicleNumber
    if (!number || !String(number).trim()) {
      return res.status(400).json({ message: 'vehicleNumber required' })
    }

    // const isAdminUser = req.user.role === 'ADMIN'

    // if (!isAdminUser && delivery.status !== 'OUT_FOR_DELIVERY') {
    //   return res.status(409).json({
    //     message: 'Vehicle can only be changed while the delivery is out for delivery',
    //   })
    // }

    // if (['COMPLETED', 'CANCELLED'].includes(delivery.status)) {
    //   return res.status(409).json({ message: 'Cannot change vehicle on a completed or cancelled delivery' })
    // }

    // const { driver } = await assignOutForDeliveryVehicle(delivery, req.user.id, number, req.body?.driverName, req.body?.driverPhone)

    // const promoteToOutForDelivery = isAdminUser && ['PROCESSED', 'PACKED'].includes(delivery.status)

    const isAdminUser = req.user.role === 'ADMIN'

    if (!isAdminUser && delivery.status !== 'OUT_FOR_DELIVERY') {
      return res.status(409).json({
        message: 'Vehicle can only be changed while the delivery is out for delivery',
      })
    }

    if (!isAdminUser && ['COMPLETED', 'CANCELLED'].includes(delivery.status)) {
      return res.status(409).json({ message: 'Cannot change vehicle on a completed or cancelled delivery' })
    }

    if (isAdminUser && delivery.status === 'CANCELLED') {
      return res.status(409).json({ message: 'Cannot change vehicle on a cancelled delivery' })
    }

    const { driver } = await assignOutForDeliveryVehicle(delivery, req.user.id, number, req.body?.driverName, req.body?.driverPhone, req.body?.vehicleType)

    const promoteToOutForDelivery = isAdminUser && ['PROCESSED', 'PACKED'].includes(delivery.status)
    if (promoteToOutForDelivery) {
      delivery.status = 'OUT_FOR_DELIVERY'
      delivery.outForDeliveryAt = delivery.outForDeliveryAt || new Date()
      delivery.phase = 'FORWARD'
    }

    await delivery.save()

    if (promoteToOutForDelivery) {
      await syncOrderStatus(delivery, 'OUT_FOR_DELIVERY')
      await notifyOutForDelivery(delivery, driver._id)
    }

return res.json({
      ok: true,
      status: delivery.status,
      vehicleLabel: delivery.vehicleLabel,
      driverName: delivery.driverName,
      driverPhone: delivery.driverPhone,
      vehicleType: delivery.vehicleType,
      vehicleVerifiedAt: delivery.vehicleVerifiedAt,
      outForDeliveryAt: delivery.outForDeliveryAt,
      assignedDeliveryUserId: String(delivery.assignedDeliveryUserId),
      driverId: String(driver._id),
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Update vehicle failed' })
  }
}

async function vehicleVerify(req, res) {
  return outForDelivery(req, res)
}

async function assignReturnPickup(req, res) {
  try {
    const { vehicleNumber, returnPickupAt, driverName, driverPhone, vehicleType } = req.body || {}
    if (!vehicleNumber || !String(vehicleNumber).trim()) {
      return res.status(400).json({ message: 'vehicleNumber required' })
    }

    const delivery = await Delivery.findById(req.params.id)
    if (!delivery) return res.status(404).json({ message: 'Not found' })
    if (!deliveryAccessOk(req, delivery)) {
      return res.status(403).json({ message: deliveryAccessDeniedMessage(req, delivery) })
    }

    if (delivery.status !== 'DELIVERED') {
      return res.status(409).json({ message: 'Return pickup can only be assigned for DELIVERED deliveries' })
    }

    const vehicle = String(vehicleNumber).trim().toUpperCase()
    const driver = await ensureDeliveryDriver(vehicle)

    // Update driver contactName/contactPhone if provided
    let driverUpdated = false
    if (driverName && String(driverName).trim()) { driver.contactName = String(driverName).trim(); driverUpdated = true }
    if (driverPhone && String(driverPhone).trim()) { driver.contactPhone = String(driverPhone).trim(); driverUpdated = true }
    if (driverUpdated) await driver.save()

    delivery.returnPickupVehicleLabel = vehicle
    delivery.returnPickupDriverName = driver.contactName
    delivery.returnPickupDriverPhone = driver.contactPhone
    if (vehicleType === 'PORTER' || vehicleType === 'PRIVATE' || vehicleType === 'OWN') {
      delivery.returnPickupVehicleType = vehicleType
    }
    delivery.returnPickupAssignedAt = returnPickupAt ? new Date(returnPickupAt) : new Date()
    delivery.returnPickupAssignedByUserId = req.user.id
    delivery.assignedDeliveryUserId = driver._id
    delivery.status = 'RETURN_PICKUP'
    delivery.phase = 'RETURN'
    delivery.returnPickedUpTagIds = delivery.returnPickedUpTagIds || []
    await delivery.save()

    await notifyReturnPickupAssigned(delivery, driver._id)

    return res.json({
      ok: true,
      status: delivery.status,
      returnPickupVehicleLabel: delivery.returnPickupVehicleLabel,
      returnPickupDriverName: delivery.returnPickupDriverName,
      returnPickupDriverPhone: delivery.returnPickupDriverPhone,
      returnPickupVehicleType: delivery.returnPickupVehicleType,
      returnPickupAssignedAt: delivery.returnPickupAssignedAt,
      assignedDeliveryUserId: String(delivery.assignedDeliveryUserId),
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Assign return pickup failed' })
  }
}

async function scan(req, res, action) {
  try {
    const { tagId, note } = req.body || {}
    if (!tagId) return res.status(400).json({ message: 'tagId required' })

    const delivery = await Delivery.findById(req.params.id)
    if (!delivery) return res.status(404).json({ message: 'Not found' })
    if (!deliveryAccessOk(req, delivery)) {
      return res.status(403).json({ message: deliveryAccessDeniedMessage(req, delivery) })
    }

    const normalizedTag = String(tagId).trim()
    if (action === 'DISPATCH' && delivery.dispatchedTagIds.includes(normalizedTag)) {
      return res.status(400).json({ message: 'Tag already scanned for dispatch' })
    }

    const asset = await AssetTag.findOne({ tagId: normalizedTag })
    if (!asset) return res.status(404).json({ message: 'Unknown tagId' })

    const allowedProductIds = new Set((delivery.lines || []).map((l) => String(l.productId)))
    if (!allowedProductIds.has(String(asset.productId))) {
      return res.status(400).json({ message: 'Tag does not match any product in this delivery' })
    }

    if (action === 'DISPATCH') {
      if (!['PROCESSED', 'PACKED'].includes(delivery.status)) {
        return res.status(409).json({ message: 'Cannot dispatch in current status' })
      }
      const required = requiredQtyByProduct(delivery)
      const dispatchCounts = await scannedCountsByProduct(delivery.dispatchedTagIds)
      const pid = String(asset.productId)
      const current = dispatchCounts.get(pid) || 0
      const max = required.get(pid) || 0
      if (current >= max) {
        return res.status(400).json({ message: 'Required qty already scanned for this product' })
      }

      delivery.dispatchedTagIds = uniqPush(delivery.dispatchedTagIds, normalizedTag)
      asset.status = 'IN_DELIVERY'
      asset.currentDeliveryId = delivery._id
      asset.currentGodownId = undefined
      // Stock was already deducted from the ledger at delivery creation.

      const dispatchCountsAfter = await scannedCountsByProduct(delivery.dispatchedTagIds)
      if (countsMatchRequired(required, dispatchCountsAfter)) {
        delivery.status = 'PACKED'
        delivery.packedAt = new Date()
        await syncOrderStatus(delivery, 'PACKED')
        await notifyDeliveryPacked(delivery)
      }
    } else if (action === 'PICKUP') {
      if (delivery.status !== 'OUT_FOR_DELIVERY') {
        return res.status(409).json({ message: 'Pickup scan only allowed when out for delivery' })
      }
      if (!delivery.dispatchedTagIds.includes(normalizedTag)) {
        return res.status(400).json({ message: 'Tag must be dispatched before pickup' })
      }
      if (delivery.pickedUpTagIds.includes(normalizedTag)) {
        return res.status(400).json({ message: 'Tag already picked up' })
      }
      delivery.pickedUpTagIds = uniqPush(delivery.pickedUpTagIds, normalizedTag)
      if (!delivery.pickedUpAt) {
        delivery.pickedUpAt = new Date()
        delivery.pickedUpByUserId = req.user.id
      }
    } else if (action === 'DELIVER') {
      if (delivery.status !== 'OUT_FOR_DELIVERY') {
        return res.status(409).json({ message: 'Delivery scan only allowed when out for delivery' })
      }
      if (!delivery.dispatchedTagIds.includes(normalizedTag)) {
        return res.status(400).json({ message: 'Tag must be dispatched for this delivery' })
      }
      if (!delivery.pickedUpTagIds.includes(normalizedTag)) {
        return res.status(400).json({ message: 'Tag must be picked up at godown before delivery scan' })
      }
      if (delivery.deliveredTagIds.includes(normalizedTag)) {
        return res.status(400).json({ message: 'Tag already delivered' })
      }

      const required = requiredQtyByProduct(delivery)
      const deliverCounts = await scannedCountsByProduct(delivery.deliveredTagIds)
      const pid = String(asset.productId)
      const current = deliverCounts.get(pid) || 0
      const max = required.get(pid) || 0
      if (current >= max) {
        return res.status(400).json({ message: 'Required qty already delivered for this product' })
      }

      delivery.deliveredTagIds = uniqPush(delivery.deliveredTagIds, normalizedTag)
      const deliverCountsAfter = await scannedCountsByProduct(delivery.deliveredTagIds)
      if (countsMatchRequired(required, deliverCountsAfter)) {
        delivery.status = 'DELIVERED'
        delivery.phase = 'FORWARD'
        await syncOrderStatus(delivery, 'DELIVERED')
      }
    } else if (action === 'RETURN_PICKUP') {
      if (delivery.status !== 'RETURN_PICKUP') {
        return res.status(409).json({ message: 'Return pickup scan only allowed during return pickup' })
      }
      if (!delivery.dispatchedTagIds.includes(normalizedTag)) {
        return res.status(400).json({ message: 'Tag was not part of this delivery dispatch' })
      }
      if ((delivery.returnPickedUpTagIds || []).includes(normalizedTag)) {
        return res.status(400).json({ message: 'Tag already scanned for return pickup' })
      }

      const required = requiredQtyByProduct(delivery)
      const returnPickupCounts = await scannedCountsByProduct(delivery.returnPickedUpTagIds || [])
      const pid = String(asset.productId)
      const current = returnPickupCounts.get(pid) || 0
      const max = required.get(pid) || 0
      if (current >= max) {
        return res.status(400).json({ message: 'Required qty already scanned for return pickup' })
      }

      delivery.returnPickedUpTagIds = uniqPush(delivery.returnPickedUpTagIds || [], normalizedTag)
    } else if (action === 'RETURN') {
      if (!['RETURN_PICKUP', 'DELIVERED', 'PENDING_RETURN'].includes(delivery.status)) {
        return res.status(409).json({ message: 'Cannot return scan in current status' })
      }

      const required = requiredQtyByProduct(delivery)
      const returnPickupCounts = await scannedCountsByProduct(delivery.returnPickedUpTagIds || [])
      if (
        delivery.status === 'RETURN_PICKUP' &&
        !countsMatchRequired(required, returnPickupCounts)
      ) {
        return res.status(400).json({
          message: 'Driver must complete return pickup scans at site before godown return scan',
          scanProgress: scanProgress(delivery, delivery.returnPickedUpTagIds || []),
        })
      }

      if (!delivery.dispatchedTagIds.includes(normalizedTag)) {
        return res.status(400).json({ message: 'Tag was not part of this delivery dispatch' })
      }
      delivery.returnedTagIds = uniqPush(delivery.returnedTagIds, normalizedTag)
      delivery.status = 'PENDING_RETURN'
      asset.status = 'IN_STOCK'
      const returnGodownId = godownIdForProduct(delivery, asset.productId)
      asset.currentGodownId = returnGodownId
      asset.currentDeliveryId = undefined
      await writeLedgerEntry({
        godownId: returnGodownId,
        productId: asset.productId,
        qtyDelta: 1,
        reason: 'RETURN',
        delivery,
        userId: req.user.id,
      })
    }

    await Promise.all([
      delivery.save(),
      asset.save(),
      DeliveryScanEvent.create({
        deliveryId: delivery._id,
        tagId: normalizedTag,
        action,
        byUserId: req.user.id,
        note: note || undefined,
      }),
    ])

    const required = requiredQtyByProduct(delivery)
    const dispatchCounts = await scannedCountsByProduct(delivery.dispatchedTagIds)
    const pickupCounts = await scannedCountsByProduct(delivery.pickedUpTagIds)
    const deliverCounts = await scannedCountsByProduct(delivery.deliveredTagIds)
    const returnPickupCounts = await scannedCountsByProduct(delivery.returnPickedUpTagIds || [])
    const dispatched = new Set(delivery.dispatchedTagIds)
    const returned = new Set(delivery.returnedTagIds)
    const missing = Array.from(dispatched).filter((t) => !returned.has(t))

    return res.json({
      status: 'ok',
      deliveryId: String(delivery._id),
      deliveryStatus: delivery.status,
      counts: {
        dispatched: delivery.dispatchedTagIds.length,
        pickedUp: delivery.pickedUpTagIds.length,
        delivered: delivery.deliveredTagIds.length,
        returnPickedUp: (delivery.returnPickedUpTagIds || []).length,
        returned: delivery.returnedTagIds.length,
        missing: missing.length,
      },
      scanProgress: {
        dispatchComplete: countsMatchRequired(required, dispatchCounts),
        pickupComplete: countsMatchRequired(required, pickupCounts),
        deliverComplete: countsMatchRequired(required, deliverCounts),
        returnPickupComplete: countsMatchRequired(required, returnPickupCounts),
      },
      missingTagIds: missing,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Scan failed' })
  }
}

async function dispatchScan(req, res) {
  return scan(req, res, 'DISPATCH')
}

async function pickupScan(req, res) {
  return scan(req, res, 'PICKUP')
}

async function deliverScan(req, res) {
  return scan(req, res, 'DELIVER')
}

async function returnPickupScan(req, res) {
  return scan(req, res, 'RETURN_PICKUP')
}

async function returnScan(req, res) {
  return scan(req, res, 'RETURN')
}

async function confirmDispatch(req, res) {
  try {
    const delivery = await Delivery.findById(req.params.id)
    if (!delivery) return res.status(404).json({ message: 'Not found' })
    if (!deliveryAccessOk(req, delivery)) {
      return res.status(403).json({ message: deliveryAccessDeniedMessage(req, delivery) })
    }

    if (!['PROCESSED', 'PACKED'].includes(delivery.status)) {
      return res.status(409).json({ message: 'Cannot confirm dispatch in current status' })
    }

    // Qty-based stock leaves the godown when the vehicle goes out for delivery.
    // Confirm dispatch here only marks the delivery as packed and ready.
    if (delivery.status === 'PROCESSED') {
      delivery.status = 'PACKED'
      delivery.packedAt = new Date()
      await syncOrderStatus(delivery, 'PACKED')
      await notifyDeliveryPacked(delivery)
    }

    await delivery.save()

    const stockByGodown = await stockByGodownForDelivery(delivery)
    return res.json({
      ok: true,
      status: delivery.status,
      lines: delivery.lines,
      stockByGodown,
      qtyProgress: {
        dispatchComplete: dispatchQtyComplete(delivery),
        dispatchedByProduct: Object.fromEntries(dispatchedQtyByProduct(delivery)),
      },
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Confirm dispatch failed' })
  }
}

async function confirmReturn(req, res) {
  try {
    const delivery = await Delivery.findById(req.params.id)
    if (!delivery) return res.status(404).json({ message: 'Not found' })
    if (!deliveryAccessOk(req, delivery)) {
      return res.status(403).json({ message: deliveryAccessDeniedMessage(req, delivery) })
    }

    if (!['DELIVERED', 'RETURN_PICKUP', 'PENDING_RETURN'].includes(delivery.status)) {
      return res.status(409).json({ message: 'Cannot confirm return in current status' })
    }

    const bodyLines = Array.isArray(req.body?.lines) ? req.body.lines : []
    if (!bodyLines.length) {
      return res.status(400).json({ message: 'lines array with productId and qty required' })
    }

    const qtyByProduct = new Map()
    for (const bl of bodyLines) {
      if (!bl?.productId || Number(bl.qty) <= 0) continue
      const pid = String(bl.productId)
      qtyByProduct.set(pid, (qtyByProduct.get(pid) || 0) + Number(bl.qty))
    }

    const returnResult = await applyReturnToLines(delivery, req.user.id, qtyByProduct, {
      rejectUnknown: true,
    })
    if (!returnResult.ok) {
      return res.status(returnResult.status).json({ message: returnResult.message })
    }

    if (!returnResult.count) {
      return res.status(400).json({ message: 'No matching lines to return' })
    }

    delivery.status = 'PENDING_RETURN'
    delivery.phase = 'RETURN'
    delivery.markModified('lines')
    await delivery.save()

    const stockByGodown = await stockByGodownForDelivery(delivery)
    return res.json({
      ok: true,
      status: delivery.status,
      lines: delivery.lines,
      stockByGodown,
      qtyProgress: {
        returnedByProduct: Object.fromEntries(returnedQtyByProduct(delivery)),
      },
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Confirm return failed' })
  }
}

async function markDelivered(req, res) {
  try {
    const delivery = await Delivery.findById(req.params.id)
    if (!delivery) return res.status(404).json({ message: 'Not found' })
    if (!deliveryAccessOk(req, delivery)) {
      return res.status(403).json({ message: deliveryAccessDeniedMessage(req, delivery) })
    }

    if (!['PROCESSED', 'PACKED', 'OUT_FOR_DELIVERY', 'DISPATCHED'].includes(delivery.status)) {
      return res.status(409).json({ message: 'Cannot mark delivered in current status' })
    }

    delivery.status = 'DELIVERED'
    delivery.phase = 'FORWARD'
    await delivery.save()
    await syncOrderStatus(delivery, 'DELIVERED')

    return res.json({ ok: true, status: delivery.status })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Mark delivered failed' })
  }
}

async function closeReturn(req, res) {
  try {
    const delivery = await Delivery.findById(req.params.id)
    if (!delivery) return res.status(404).json({ message: 'Not found' })
    if (!deliveryAccessOk(req, delivery)) {
      return res.status(403).json({ message: deliveryAccessDeniedMessage(req, delivery) })
    }

    if (delivery.status !== 'PENDING_RETURN') {
      return res.status(409).json({
        message: 'Complete return is only allowed when status is Pending return',
      })
    }

    const dispatched = new Set(delivery.dispatchedTagIds || [])
    const returned = new Set(delivery.returnedTagIds || [])
    const missingTags = Array.from(dispatched).filter((t) => !returned.has(t))

    const restockByProduct = Object.fromEntries(outstandingDispatchByProduct(delivery))
    const restockMap = outstandingDispatchByProduct(delivery)

    if (restockMap.size > 0) {
      const returnResult = await applyReturnToLines(delivery, req.user.id, restockMap)
      if (!returnResult.ok) {
        return res.status(returnResult.status).json({ message: returnResult.message })
      }
      delivery.markModified('lines')
    }

    const missingQtyByProduct = {}
    for (const line of delivery.lines || []) {
      const dispatchedQty = Number(line.dispatchedQty) || 0
      const returnedQty = Number(line.returnedQty) || 0
      const missing = dispatchedQty - returnedQty
      if (missing > 0) missingQtyByProduct[String(line.productId)] = missing
    }

    delivery.lostTagIds = uniqPushMany(delivery.lostTagIds, missingTags)
    delivery.status = 'COMPLETED'
    delivery.phase = 'RETURN'

    await delivery.save()
    await syncOrderStatus(delivery, 'COMPLETED')

    const stockByGodown = await stockByGodownForDelivery(delivery)
    return res.json({
      status: 'ok',
      missingTagIds: missingTags,
      missingQtyByProduct,
      restockedQtyByProduct: restockByProduct,
      stockByGodown,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Close return failed' })
  }
}

async function enrollTag(req, res) {
  try {
    const { tagId, productId, godownId } = req.body || {}
    const trimmedTag = String(tagId || '').trim()
    if (!trimmedTag || !productId) {
      return res.status(400).json({ message: 'tagId and productId required' })
    }

    if (godownId) {
      if (!mongoose.Types.ObjectId.isValid(godownId)) {
        return res.status(400).json({ message: 'godownId must be a valid id' })
      }
      if (req.user.role === 'GODOWN' && req.user.godownId && String(req.user.godownId) !== String(godownId)) {
        return res.status(403).json({ message: 'Forbidden' })
      }
      const godown = await Godown.findById(godownId).lean()
      if (!godown || !godown.active) {
        return res.status(404).json({ message: 'Godown not found' })
      }
      const gp = await GodownProduct.findOne({ godownId, productId }).lean()
      if (gp && gp.enabled === false) {
        return res.status(400).json({ message: 'Product is not enabled for this godown' })
      }
    }

    const exists = await AssetTag.findOne({ tagId: trimmedTag }).lean()
    if (exists) return res.status(400).json({ message: 'tagId already enrolled' })

    const tag = await AssetTag.create({
      tagId: trimmedTag,
      productId,
      currentGodownId: godownId || undefined,
      status: 'IN_STOCK',
    })
    return res.status(201).json({ id: String(tag._id), tagId: tag.tagId })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'tagId already enrolled' })
    }
    return res.status(500).json({ message: err.message || 'Enroll failed' })
  }
}

async function challanPdf(req, res) {
  const delivery = await Delivery.findById(req.params.id).lean()
  if (!delivery) return res.status(404).json({ message: 'Not found' })
  if (!deliveryAccessOk(req, delivery)) {
      return res.status(403).json({ message: deliveryAccessDeniedMessage(req, delivery) })
    }

  const [enrichedLines, godownMap] = await Promise.all([
    populateLineDetails(delivery),
    loadGodownMapForDeliveries([delivery]),
  ])
  const pickupLocations = pickupLocationsFromLines(delivery, enrichedLines, godownMap)
  const pdfDelivery = {
    ...delivery,
    lines: enrichedLines,
    pickupLocations,
    godownLabel: pickupLocations.map((p) => p.name).filter(Boolean).join(', ') || undefined,
  }

  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="challan-${delivery.deliveryNo}.pdf"`)
  doc.pipe(res)

  renderChallanPdf(doc, pdfDelivery)
  doc.end()
}

async function returnChallanPdf(req, res) {
  const delivery = await Delivery.findById(req.params.id)
    .populate('lines.productId')
    .populate('fromGodownId', 'name')
    .lean()
  if (!delivery) return res.status(404).json({ message: 'Not found' })
  if (!deliveryAccessOk(req, delivery)) {
    return res.status(403).json({ message: deliveryAccessDeniedMessage(req, delivery) })
  }

  const [billerMissingLines, billerDamagedLines, billerCollectedLines, billerPendingReturnLines] = await Promise.all([
    populateBillerReturnLines(delivery.billerMissingLines),
    populateBillerReturnLines(delivery.billerDamagedLines),
    populateBillerReturnLines(delivery.billerCollectedLines),
    populateBillerReturnLines(delivery.billerPendingReturnLines),
  ])

  const pdfDelivery = {
    ...delivery,
    billerMissingLines,
    billerDamagedLines,
    billerCollectedLines,
    billerPendingReturnLines,
  }

  const returnLines = buildReturnLines(pdfDelivery)
  if (!returnLines.length) {
    return res.status(400).json({ message: 'No return items recorded for this delivery' })
  }

  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `inline; filename="return-challan-${delivery.deliveryNo}.pdf"`,
  )
  doc.pipe(res)

  renderReturnChallanPdf(doc, pdfDelivery)
  doc.end()
}

// ── Driver search (vehicle / driver name / phone typeahead) ────────────────
// Used by the vehicle-assignment modals (out for delivery / return pickup)
// so godown & admin users can search existing drivers instead of retyping.
// Typing a vehicle number that doesn't match any result simply creates a
// new driver on confirm (see ensureDeliveryDriver).
async function searchDrivers(req, res) {
  try {
    const q = String(req.query.q || '').trim()
    const filter = { role: 'DELIVERY' }
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [{ loginId: rx }, { contactName: rx }, { contactPhone: rx }]
    }

    const drivers = await User.find(filter)
      .sort({ updatedAt: -1 })
      .limit(25)
      .select('loginId contactName contactPhone active')
      .lean()

    return res.json({
      drivers: drivers.map((u) => ({
        id: String(u._id),
        vehicleNumber: u.loginId,
        driverName: u.contactName || '',
        driverPhone: u.contactPhone || '',
      })),
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Driver search failed' })
  }
}

module.exports = {
  dispatchCompleteAsync,
  createDelivery,
  updateDelivery,
  listDeliveries,
  getDelivery,
  deleteDelivery,
  updateDeliveryStatus,
  regenerateDeliveryTokens,
  markPacked,
  outForDelivery,
  updateOutForDeliveryVehicle,
  vehicleVerify,
  searchDrivers,
  assignReturnPickup,
  dispatchScan,
  pickupScan,
  deliverScan,
  returnPickupScan,
  returnScan,
  confirmDispatch,
  confirmReturn,
  markDelivered,
  closeReturn,
  enrollTag,
  challanPdf,
  returnChallanPdf,
}