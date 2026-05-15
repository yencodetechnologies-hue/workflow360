const crypto = require('crypto')
const mongoose = require('mongoose')
const Delivery = require('../models/Delivery')
const DeliveryScanEvent = require('../models/DeliveryScanEvent')
const AssetTag = require('../models/AssetTag')
const InventoryLedger = require('../models/InventoryLedger')
const User = require('../models/User')
const PDFDocument = require('pdfkit')

function makeDeliveryNo() {
  const n = Math.floor(10000 + Math.random() * 89999)
  return `DLV-${n}`
}

function makeVerifyToken() {
  return crypto.randomBytes(24).toString('base64url')
}

function publicBaseUrl() {
  const u = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:5173'
  return String(u).replace(/\/$/, '')
}

function shareUrls(d) {
  const base = publicBaseUrl()
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

function deliveryGodownIds(delivery) {
  const ids = new Set()
  if (delivery.fromGodownId) ids.add(String(delivery.fromGodownId))
  for (const line of delivery.lines || []) {
    if (line.godownId) ids.add(String(line.godownId))
  }
  return ids
}

function deliveryAccessOk(req, delivery) {
  if (req.user.role === 'ADMIN') return true
  if (req.user.role === 'DELIVERY') {
    const assigned = String(delivery.assignedDeliveryUserId || '') === String(req.user.id)
    const vehicle =
      req.user.loginId &&
      delivery.vehicleLabel &&
      String(delivery.vehicleLabel).toUpperCase() === String(req.user.loginId).toUpperCase()
    return assigned || vehicle
  }
  if (req.user.role === 'GODOWN' && req.user.godownId) {
    return deliveryGodownIds(delivery).has(String(req.user.godownId))
  }
  if (req.user.role === 'BILLER') {
    return String(delivery.billerUserId || '') === String(req.user.id)
  }
  return false
}

function mapListRow(d) {
  return {
    id: String(d._id),
    deliveryNo: d.deliveryNo,
    customerName: d.customerName,
    siteName: d.siteName,
    siteAddress: d.siteAddress,
    deliveryAt: d.deliveryAt,
    returnExpectedAt: d.returnExpectedAt,
    fromGodownId: String(d.fromGodownId),
    billerUserId: d.billerUserId ? String(d.billerUserId) : undefined,
    vehicleLabel: d.vehicleLabel,
    status: d.status,
    lines: d.lines,
    dispatchedTagIds: d.dispatchedTagIds,
    pickedUpTagIds: d.pickedUpTagIds,
    deliveredTagIds: d.deliveredTagIds,
    returnedTagIds: d.returnedTagIds,
    damagedTagIds: d.damagedTagIds,
    lostTagIds: d.lostTagIds,
    vehicleVerifiedAt: d.vehicleVerifiedAt,
    pickedUpAt: d.pickedUpAt,
    challanNo: d.challanNo,
    deliveryVerifiedAt: d.deliveryVerifiedAt,
    billerReturnSubmittedAt: d.billerReturnSubmittedAt,
    damageTotal: d.damageTotal,
    missingTotal: d.missingTotal,
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
      orderId,
      customerName,
      siteName,
      siteAddress,
      contactPhone,
      billerUserId,
      fromGodownId,
      deliveryAt,
      returnExpectedAt,
      assignedDeliveryUserId,
      vehicleLabel,
      lines,
    } = req.body || {}

    if (!customerName || !deliveryAt) {
      return res.status(400).json({ message: 'customerName and deliveryAt required' })
    }
    if (!billerUserId) return res.status(400).json({ message: 'billerUserId required' })

    const rawLines = Array.isArray(lines) ? lines : []
    const normalizedLines = rawLines
      .filter((l) => l && l.productId && Number(l.qty) > 0)
      .map((l) => ({
        productId: l.productId,
        godownId: l.godownId || fromGodownId,
        qty: Number(l.qty),
      }))

    if (!normalizedLines.length) {
      return res.status(400).json({ message: 'At least one product line with qty > 0 required' })
    }

    const primaryGodownId = fromGodownId || normalizedLines[0].godownId
    if (!primaryGodownId) {
      return res.status(400).json({ message: 'fromGodownId or godownId on each line required' })
    }

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

    const delivery = await Delivery.create({
      deliveryNo: makeDeliveryNo(),
      orderId: orderId || undefined,
      customerName,
      siteName,
      siteAddress,
      contactPhone,
      billerUserId,
      fromGodownId: primaryGodownId,
      deliveryAt: new Date(deliveryAt),
      returnExpectedAt: returnExpectedAt ? new Date(returnExpectedAt) : undefined,
      assignedDeliveryUserId: assignedId,
      vehicleLabel: vehicle,
      lines: normalizedLines,
      deliveryVerifyToken: makeVerifyToken(),
      billerReturnVerifyToken: makeVerifyToken(),
      createdByUserId: req.user?.id,
    })

    const urls = shareUrls(delivery)
    return res.status(201).json({
      id: String(delivery._id),
      deliveryNo: delivery.deliveryNo,
      deliveryVerifyUrl: urls.deliveryVerifyUrl,
      billerReturnUrl: urls.billerReturnUrl,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Create delivery failed' })
  }
}

async function listDeliveries(req, res) {
  const limit = Math.min(200, Number(req.query.limit || 50))
  const status = req.query.status
  const fromGodownId = req.query.fromGodownId
  const q = {}
  if (status) q.status = status

  if (req.user.role === 'DELIVERY') {
    const or = [{ assignedDeliveryUserId: req.user.id }]
    if (req.user.loginId) or.push({ vehicleLabel: String(req.user.loginId).toUpperCase() })
    q.$or = or
  }
  if (req.user.role === 'GODOWN' && req.user.godownId) {
    q.$or = [{ fromGodownId: req.user.godownId }, { 'lines.godownId': req.user.godownId }]
  }
  if (req.user.role === 'BILLER') q.billerUserId = req.user.id
  if (req.user.role === 'ADMIN' && fromGodownId) q.fromGodownId = fromGodownId

  const list = await Delivery.find(q).sort({ deliveryAt: -1 }).limit(limit).lean()
  return res.json(list.map(mapListRow))
}

async function getDelivery(req, res) {
  const d = await Delivery.findById(req.params.id).lean()
  if (!d) return res.status(404).json({ message: 'Not found' })

  if (!deliveryAccessOk(req, d)) return res.status(403).json({ message: 'Forbidden' })

  const urls = shareUrls(d)
  const required = requiredQtyByProduct(d)
  const dispatchCounts = await scannedCountsByProduct(d.dispatchedTagIds)

  return res.json({
    id: String(d._id),
    deliveryNo: d.deliveryNo,
    customerName: d.customerName,
    siteName: d.siteName,
    siteAddress: d.siteAddress,
    contactPhone: d.contactPhone,
    billerUserId: d.billerUserId ? String(d.billerUserId) : undefined,
    fromGodownId: String(d.fromGodownId),
    deliveryAt: d.deliveryAt,
    returnExpectedAt: d.returnExpectedAt,
    assignedDeliveryUserId: d.assignedDeliveryUserId ? String(d.assignedDeliveryUserId) : undefined,
    vehicleLabel: d.vehicleLabel,
    status: d.status,
    lines: d.lines,
    dispatchedTagIds: d.dispatchedTagIds,
    pickedUpTagIds: d.pickedUpTagIds,
    deliveredTagIds: d.deliveredTagIds,
    returnedTagIds: d.returnedTagIds,
    damagedTagIds: d.damagedTagIds,
    lostTagIds: d.lostTagIds,
    vehicleVerifiedAt: d.vehicleVerifiedAt,
    pickedUpAt: d.pickedUpAt,
    challanNo: d.challanNo,
    challanGeneratedAt: d.challanGeneratedAt,
    deliveryVerifierName: d.deliveryVerifierName,
    deliveryVerifiedAt: d.deliveryVerifiedAt,
    deliveryLineChecks: d.deliveryLineChecks,
    deliverySignature: d.deliverySignature,
    billerReturnSubmittedAt: d.billerReturnSubmittedAt,
    billerDamagedLines: d.billerDamagedLines,
    billerMissingLines: d.billerMissingLines,
    damageTotal: d.damageTotal,
    missingTotal: d.missingTotal,
    deliveryVerifyUrl: urls.deliveryVerifyUrl,
    billerReturnUrl: urls.billerReturnUrl,
    scanProgress: {
      dispatch: scanProgress(d, d.dispatchedTagIds || []),
      pickup: scanProgress(d, d.pickedUpTagIds || []),
      deliver: scanProgress(d, d.deliveredTagIds || []),
      dispatchComplete: countsMatchRequired(required, dispatchCounts),
    },
  })
}

async function regenerateDeliveryTokens(req, res) {
  try {
    const delivery = await Delivery.findById(req.params.id)
    if (!delivery) return res.status(404).json({ message: 'Not found' })
    delivery.deliveryVerifyToken = makeVerifyToken()
    delivery.billerReturnVerifyToken = makeVerifyToken()
    await delivery.save()
    const urls = shareUrls(delivery)
    return res.json({
      deliveryVerifyUrl: urls.deliveryVerifyUrl,
      billerReturnUrl: urls.billerReturnUrl,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed' })
  }
}

async function vehicleVerify(req, res) {
  try {
    const { vehicleNumber } = req.body || {}
    if (!vehicleNumber || !String(vehicleNumber).trim()) {
      return res.status(400).json({ message: 'vehicleNumber required' })
    }

    const delivery = await Delivery.findById(req.params.id)
    if (!delivery) return res.status(404).json({ message: 'Not found' })
    if (!deliveryAccessOk(req, delivery) && req.user.role !== 'GODOWN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' })
    }
    if (req.user.role === 'GODOWN' && req.user.godownId && !deliveryGodownIds(delivery).has(String(req.user.godownId))) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const required = requiredQtyByProduct(delivery)
    const dispatchCounts = await scannedCountsByProduct(delivery.dispatchedTagIds)
    if (!countsMatchRequired(required, dispatchCounts)) {
      return res.status(400).json({
        message: 'Dispatch scanning must be complete before vehicle verification',
        scanProgress: scanProgress(delivery, delivery.dispatchedTagIds),
      })
    }

    const vehicle = String(vehicleNumber).trim().toUpperCase()
    delivery.vehicleLabel = vehicle
    delivery.vehicleVerifiedAt = new Date()
    delivery.vehicleVerifiedByUserId = req.user.id

    const driver = await User.findOne({ role: 'DELIVERY', loginId: vehicle, active: true })
    if (driver) delivery.assignedDeliveryUserId = driver._id

    await delivery.save()

    return res.json({
      ok: true,
      vehicleLabel: delivery.vehicleLabel,
      vehicleVerifiedAt: delivery.vehicleVerifiedAt,
      assignedDeliveryUserId: delivery.assignedDeliveryUserId ? String(delivery.assignedDeliveryUserId) : undefined,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Vehicle verify failed' })
  }
}

async function scan(req, res, action) {
  try {
    const { tagId, note } = req.body || {}
    if (!tagId) return res.status(400).json({ message: 'tagId required' })

    const delivery = await Delivery.findById(req.params.id)
    if (!delivery) return res.status(404).json({ message: 'Not found' })
    if (!deliveryAccessOk(req, delivery)) return res.status(403).json({ message: 'Forbidden' })

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
      if (!['UPCOMING', 'DISPATCHED'].includes(delivery.status)) {
        return res.status(409).json({ message: 'Cannot dispatch in current status' })
      }
      const required = requiredQtyByProduct(delivery)
      const dispatchCounts = await scannedCountsByProduct(delivery.dispatchedTagIds)
      const pid = String(asset.productId)
      const current = dispatchCounts.get(pid) || 0
      const max = required.get(pid) || 0
      if (current >= max) {
        return res.status(400).json({ message: `Required qty already scanned for this product` })
      }

      delivery.dispatchedTagIds = uniqPush(delivery.dispatchedTagIds, normalizedTag)
      delivery.status = 'DISPATCHED'
      asset.status = 'IN_DELIVERY'
      asset.currentDeliveryId = delivery._id
      asset.currentGodownId = undefined
      const dispatchGodownId = asset.currentGodownId || delivery.fromGodownId
      await InventoryLedger.create({
        godownId: dispatchGodownId,
        productId: asset.productId,
        qtyDelta: -1,
        reason: 'DISPATCH',
        refType: 'Delivery',
        refId: String(delivery._id),
        byUserId: req.user.id,
      })
    } else if (action === 'PICKUP') {
      if (!delivery.vehicleVerifiedAt) {
        return res.status(400).json({ message: 'Vehicle must be verified before pickup scan' })
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
      if (!delivery.vehicleVerifiedAt) {
        return res.status(400).json({ message: 'Vehicle must be verified before delivery scan' })
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
      }
    } else if (action === 'RETURN') {
      if (!delivery.dispatchedTagIds.includes(normalizedTag)) {
        return res.status(400).json({ message: 'Tag was not part of this delivery dispatch' })
      }
      delivery.returnedTagIds = uniqPush(delivery.returnedTagIds, normalizedTag)
      delivery.status = 'PENDING_RETURN'
      asset.status = 'IN_STOCK'
      asset.currentGodownId = delivery.fromGodownId
      asset.currentDeliveryId = undefined
      await InventoryLedger.create({
        godownId: delivery.fromGodownId,
        productId: asset.productId,
        qtyDelta: 1,
        reason: 'RETURN',
        refType: 'Delivery',
        refId: String(delivery._id),
        byUserId: req.user.id,
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
        returned: delivery.returnedTagIds.length,
        missing: missing.length,
      },
      scanProgress: {
        dispatchComplete: countsMatchRequired(required, dispatchCounts),
        pickupComplete: countsMatchRequired(required, pickupCounts),
        deliverComplete: countsMatchRequired(required, deliverCounts),
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

async function returnScan(req, res) {
  return scan(req, res, 'RETURN')
}

async function closeReturn(req, res) {
  const delivery = await Delivery.findById(req.params.id)
  if (!delivery) return res.status(404).json({ message: 'Not found' })

  const dispatched = new Set(delivery.dispatchedTagIds)
  const returned = new Set(delivery.returnedTagIds)
  const missing = Array.from(dispatched).filter((t) => !returned.has(t))

  delivery.lostTagIds = uniqPushMany(delivery.lostTagIds, missing)
  delivery.status = 'COMPLETED'
  await delivery.save()

  return res.json({ status: 'ok', missingTagIds: missing })
}

async function enrollTag(req, res) {
  const { tagId, productId, godownId } = req.body || {}
  if (!tagId || !productId) return res.status(400).json({ message: 'tagId and productId required' })
  const exists = await AssetTag.findOne({ tagId: String(tagId).trim() }).lean()
  if (exists) return res.status(400).json({ message: 'tagId already enrolled' })

  const tag = await AssetTag.create({
    tagId: String(tagId).trim(),
    productId,
    currentGodownId: godownId || undefined,
    status: 'IN_STOCK',
  })
  return res.status(201).json({ id: String(tag._id), tagId: tag.tagId })
}

async function challanPdf(req, res) {
  const delivery = await Delivery.findById(req.params.id).populate('lines.productId').lean()
  if (!delivery) return res.status(404).json({ message: 'Not found' })

  const doc = new PDFDocument({ size: 'A4', margin: 40 })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="challan-${delivery.deliveryNo}.pdf"`)
  doc.pipe(res)

  doc.fontSize(18).text('Delivery Challan', { align: 'center' })
  doc.moveDown(0.8)
  doc.fontSize(10).fillColor('#333')
  doc.text(`Challan for: ${delivery.deliveryNo}`)
  doc.text(`Customer: ${delivery.customerName}`)
  if (delivery.siteName || delivery.siteAddress) doc.text(`Site: ${delivery.siteName || ''} ${delivery.siteAddress || ''}`.trim())
  doc.text(`Delivery at: ${new Date(delivery.deliveryAt).toLocaleString()}`)
  if (delivery.vehicleLabel) doc.text(`Vehicle: ${delivery.vehicleLabel}`)
  doc.moveDown(0.6)

  doc.fontSize(12).text('Items', { underline: true })
  doc.moveDown(0.3)
  doc.fontSize(10)

  const startX = doc.x
  const col1 = startX
  const col2 = startX + 330
  const col3 = startX + 420

  doc.text('Particulars', col1, doc.y, { continued: false })
  doc.text('SKU', col2, doc.y - 12)
  doc.text('Qty', col3, doc.y - 12)
  doc.moveDown(0.4)
  doc.moveTo(startX, doc.y).lineTo(startX + 500, doc.y).strokeColor('#ddd').stroke()
  doc.moveDown(0.4)

  for (const line of delivery.lines || []) {
    const p = line.productId
    const name = p?.particulars || p?.name || 'Item'
    const sku = p?.sku || p?.s_no || '—'
    doc.text(String(name), col1, doc.y, { width: 320 })
    doc.text(String(sku), col2, doc.y - 12, { width: 80 })
    doc.text(String(line.qty), col3, doc.y - 12, { width: 60 })
    doc.moveDown(0.3)
  }

  doc.moveDown(1)
  doc.strokeColor('#999')
  doc.text('Customer signature: ____________________________')
  doc.moveDown(0.6)
  doc.text('Delivery staff: ________________________________')

  doc.end()
}

module.exports = {
  createDelivery,
  listDeliveries,
  getDelivery,
  regenerateDeliveryTokens,
  vehicleVerify,
  dispatchScan,
  pickupScan,
  deliverScan,
  returnScan,
  closeReturn,
  enrollTag,
  challanPdf,
}
