const crypto = require('crypto')
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
    deliveredTagIds: d.deliveredTagIds,
    returnedTagIds: d.returnedTagIds,
    damagedTagIds: d.damagedTagIds,
    lostTagIds: d.lostTagIds,
    challanNo: d.challanNo,
    deliveryVerifiedAt: d.deliveryVerifiedAt,
    billerReturnSubmittedAt: d.billerReturnSubmittedAt,
    damageTotal: d.damageTotal,
    missingTotal: d.missingTotal,
  }
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

    if (!customerName || !fromGodownId || !deliveryAt) {
      return res.status(400).json({ message: 'customerName, fromGodownId, deliveryAt required' })
    }
    if (!billerUserId) return res.status(400).json({ message: 'billerUserId required' })

    const biller = await User.findById(billerUserId).lean()
    if (!biller || biller.role !== 'BILLER') return res.status(400).json({ message: 'Invalid biller user' })

    const delivery = await Delivery.create({
      deliveryNo: makeDeliveryNo(),
      orderId: orderId || undefined,
      customerName,
      siteName,
      siteAddress,
      contactPhone,
      billerUserId,
      fromGodownId,
      deliveryAt: new Date(deliveryAt),
      returnExpectedAt: returnExpectedAt ? new Date(returnExpectedAt) : undefined,
      assignedDeliveryUserId: assignedDeliveryUserId || undefined,
      vehicleLabel: vehicleLabel || undefined,
      lines: Array.isArray(lines) ? lines : [],
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

  if (req.user.role === 'DELIVERY') q.assignedDeliveryUserId = req.user.id
  if (req.user.role === 'GODOWN' && req.user.godownId) q.fromGodownId = req.user.godownId
  if (req.user.role === 'BILLER') q.billerUserId = req.user.id
  if (req.user.role === 'ADMIN' && fromGodownId) q.fromGodownId = fromGodownId

  const list = await Delivery.find(q).sort({ deliveryAt: -1 }).limit(limit).lean()
  return res.json(list.map(mapListRow))
}

async function getDelivery(req, res) {
  const d = await Delivery.findById(req.params.id).lean()
  if (!d) return res.status(404).json({ message: 'Not found' })

  if (req.user.role === 'DELIVERY' && String(d.assignedDeliveryUserId || '') !== String(req.user.id)) {
    return res.status(403).json({ message: 'Forbidden' })
  }
  if (req.user.role === 'GODOWN' && req.user.godownId && String(d.fromGodownId) !== String(req.user.godownId)) {
    return res.status(403).json({ message: 'Forbidden' })
  }
  if (req.user.role === 'BILLER' && String(d.billerUserId || '') !== String(req.user.id)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  const urls = shareUrls(d)

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
    deliveredTagIds: d.deliveredTagIds,
    returnedTagIds: d.returnedTagIds,
    damagedTagIds: d.damagedTagIds,
    lostTagIds: d.lostTagIds,
    challanNo: d.challanNo,
    challanGeneratedAt: d.challanGeneratedAt,
    deliveryVerifierName: d.deliveryVerifierName,
    deliveryVerifiedAt: d.deliveryVerifiedAt,
    deliveryLineChecks: d.deliveryLineChecks,
    billerReturnSubmittedAt: d.billerReturnSubmittedAt,
    billerDamagedLines: d.billerDamagedLines,
    billerMissingLines: d.billerMissingLines,
    damageTotal: d.damageTotal,
    missingTotal: d.missingTotal,
    deliveryVerifyUrl: urls.deliveryVerifyUrl,
    billerReturnUrl: urls.billerReturnUrl,
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

async function scan(req, res, action) {
  const { tagId, note } = req.body || {}
  if (!tagId) return res.status(400).json({ message: 'tagId required' })

  const delivery = await Delivery.findById(req.params.id)
  if (!delivery) return res.status(404).json({ message: 'Not found' })

  if (req.user.role === 'DELIVERY') {
    if (String(delivery.assignedDeliveryUserId || '') !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' })
  }
  if (req.user.role === 'GODOWN' && req.user.godownId) {
    if (String(delivery.fromGodownId) !== String(req.user.godownId)) return res.status(403).json({ message: 'Forbidden' })
  }

  const normalizedTag = String(tagId).trim()
  const asset = await AssetTag.findOne({ tagId: normalizedTag })
  if (!asset) return res.status(404).json({ message: 'Unknown tagId' })

  const allowedProductIds = new Set(delivery.lines.map((l) => String(l.productId)))
  if (!allowedProductIds.has(String(asset.productId))) {
    return res.status(400).json({ message: 'Tag does not match any product in this delivery' })
  }

  if (action === 'DISPATCH') {
    delivery.dispatchedTagIds = uniqPush(delivery.dispatchedTagIds, normalizedTag)
    delivery.status = 'DISPATCHED'
    asset.status = 'IN_DELIVERY'
    asset.currentDeliveryId = delivery._id
    asset.currentGodownId = undefined
    await InventoryLedger.create({
      godownId: delivery.fromGodownId,
      productId: asset.productId,
      qtyDelta: -1,
      reason: 'DISPATCH',
      refType: 'Delivery',
      refId: String(delivery._id),
      byUserId: req.user.id,
    })
  } else if (action === 'DELIVER') {
    delivery.deliveredTagIds = uniqPush(delivery.deliveredTagIds, normalizedTag)
    delivery.status = 'DELIVERED'
  } else if (action === 'RETURN') {
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

  const dispatched = new Set(delivery.dispatchedTagIds)
  const returned = new Set(delivery.returnedTagIds)
  const missing = Array.from(dispatched).filter((t) => !returned.has(t))

  return res.json({
    status: 'ok',
    deliveryId: String(delivery._id),
    deliveryStatus: delivery.status,
    counts: {
      dispatched: delivery.dispatchedTagIds.length,
      delivered: delivery.deliveredTagIds.length,
      returned: delivery.returnedTagIds.length,
      missing: missing.length,
    },
    missingTagIds: missing,
  })
}

async function dispatchScan(req, res) {
  return scan(req, res, 'DISPATCH')
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
  dispatchScan,
  deliverScan,
  returnScan,
  closeReturn,
  enrollTag,
  challanPdf,
}
