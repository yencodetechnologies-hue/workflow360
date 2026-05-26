const mongoose = require('mongoose')
const Order = require('../models/Order')
const Delivery = require('../models/Delivery')

function mapOrderRow(o) {
  return {
    id: String(o._id),
    customerName: o.customerName,
    siteName: o.siteName,
    siteAddress: o.siteAddress,
    contactPhone: o.contactPhone,
    deliveryAt: o.deliveryAt,
    returnExpectedAt: o.returnExpectedAt,
    fromGodownId: o.fromGodownId ? String(o.fromGodownId) : undefined,
    status: o.status,
    lines: (o.lines || []).map((l) => ({
      productId: String(l.productId),
      godownId: l.godownId ? String(l.godownId) : undefined,
      qty: l.qty,
    })),
    createdAt: o.createdAt,
  }
}

async function orderIdsLinkedToGodown(godownId) {
  const gid = new mongoose.Types.ObjectId(String(godownId))
  const rows = await Delivery.find({
    orderId: { $exists: true, $ne: null },
    $or: [{ fromGodownId: gid }, { 'lines.godownId': gid }],
  })
    .select('orderId')
    .lean()
  return [...new Set(rows.map((d) => String(d.orderId)).filter(Boolean))]
}

async function buildGodownOrderFilter(godownId) {
  const gid = new mongoose.Types.ObjectId(String(godownId))
  const linkedIds = await orderIdsLinkedToGodown(godownId)
  const or = [{ fromGodownId: gid }, { 'lines.godownId': gid }]
  if (linkedIds.length) {
    or.push({ _id: { $in: linkedIds.map((id) => new mongoose.Types.ObjectId(id)) } })
  }
  return { $or: or }
}

async function orderAccessOk(req, order) {
  if (req.user.role === 'ADMIN' || req.user.role === 'BILLER') return true
  if (req.user.role !== 'GODOWN' || !req.user.godownId) return false

  const gid = String(req.user.godownId)
  if (order.fromGodownId && String(order.fromGodownId) === gid) return true
  if ((order.lines || []).some((l) => l.godownId && String(l.godownId) === gid)) return true

  const linked = await Delivery.exists({
    orderId: order._id,
    $or: [{ fromGodownId: gid }, { 'lines.godownId': gid }],
  })
  return Boolean(linked)
}

async function createOrder(req, res) {
  try {
    const {
      customerName,
      siteName,
      siteAddress,
      contactPhone,
      deliveryAt,
      returnExpectedAt,
      fromGodownId,
      lines,
    } = req.body || {}
    if (!customerName || !deliveryAt) return res.status(400).json({ message: 'customerName and deliveryAt required' })

    if (!fromGodownId) {
      return res.status(400).json({ message: 'fromGodownId is required' })
    }
    if (!mongoose.Types.ObjectId.isValid(fromGodownId)) {
      return res.status(400).json({ message: 'Invalid fromGodownId' })
    }

    const rawLines = Array.isArray(lines) ? lines : []
    const normalizedLines = rawLines
      .filter((l) => l && l.productId && Number(l.qty) > 0)
      .map((l) => ({
        productId: l.productId,
        godownId: l.godownId || fromGodownId,
        qty: Number(l.qty),
      }))

    const order = await Order.create({
      customerName,
      siteName,
      siteAddress,
      contactPhone,
      deliveryAt: new Date(deliveryAt),
      returnExpectedAt: returnExpectedAt ? new Date(returnExpectedAt) : undefined,
      fromGodownId,
      lines: normalizedLines,
      createdByUserId: req.user?.id,
    })
    return res.status(201).json({ id: String(order._id) })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Create order failed' })
  }
}

async function listOrders(req, res) {
  try {
    const limit = Math.min(200, Number(req.query.limit || 50))
    const status = req.query.status

    let filter = {}
    if (req.user.role === 'GODOWN' && req.user.godownId) {
      filter = await buildGodownOrderFilter(req.user.godownId)
    }
    if (status) filter.status = status

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(limit).lean()
    return res.json(orders.map(mapOrderRow))
  } catch (err) {
    return res.status(500).json({ message: err.message || 'List orders failed' })
  }
}

async function getOrder(req, res) {
  try {
    const order = await Order.findById(req.params.id).lean()
    if (!order) return res.status(404).json({ message: 'Not found' })

    if (!(await orderAccessOk(req, order))) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    return res.json(mapOrderRow(order))
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Get order failed' })
  }
}

module.exports = { createOrder, listOrders, getOrder, buildGodownOrderFilter, orderAccessOk }
