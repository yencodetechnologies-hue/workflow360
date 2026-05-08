const Order = require('../models/Order')

async function createOrder(req, res) {
  try {
    const { customerName, siteName, siteAddress, contactPhone, deliveryAt, returnExpectedAt, lines } =
      req.body || {}
    if (!customerName || !deliveryAt) return res.status(400).json({ message: 'customerName and deliveryAt required' })

    const order = await Order.create({
      customerName,
      siteName,
      siteAddress,
      contactPhone,
      deliveryAt: new Date(deliveryAt),
      returnExpectedAt: returnExpectedAt ? new Date(returnExpectedAt) : undefined,
      lines: Array.isArray(lines) ? lines : [],
      createdByUserId: req.user?.id,
    })
    return res.status(201).json({ id: String(order._id) })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Create order failed' })
  }
}

async function listOrders(req, res) {
  const limit = Math.min(200, Number(req.query.limit || 50))
  const orders = await Order.find({}).sort({ createdAt: -1 }).limit(limit).lean()
  return res.json(
    orders.map((o) => ({
      id: String(o._id),
      customerName: o.customerName,
      siteName: o.siteName,
      siteAddress: o.siteAddress,
      deliveryAt: o.deliveryAt,
      returnExpectedAt: o.returnExpectedAt,
      status: o.status,
      lines: o.lines,
      createdAt: o.createdAt,
    })),
  )
}

module.exports = { createOrder, listOrders }

