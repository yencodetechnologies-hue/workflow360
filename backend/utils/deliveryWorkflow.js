const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Order = require('../models/Order')
const { notifyUser, notifyGodownUsers } = require('./notify')

const DEFAULT_DRIVER_PASSWORD = '123456'

function deliveryGodownIds(delivery) {
  const ids = new Set()
  if (delivery.fromGodownId) ids.add(String(delivery.fromGodownId))
  for (const line of delivery.lines || []) {
    if (line.godownId) ids.add(String(line.godownId))
  }
  return [...ids]
}

async function ensureDeliveryDriver(vehicleNumber) {
  const vehicle = String(vehicleNumber).trim().toUpperCase()
  let driver = await User.findOne({ role: 'DELIVERY', loginId: vehicle })
  if (driver) {
    if (!driver.active) {
      driver.active = true
      await driver.save()
    }
    return driver
  }

  const saltRounds = Number(process.env.BCRYPT_ROUNDS || 10)
  const passwordHash = await bcrypt.hash(DEFAULT_DRIVER_PASSWORD, saltRounds)
  const internalEmail = `vehicle_${vehicle.toLowerCase().replace(/[^a-z0-9]/g, '_')}@wf360.local`

  driver = await User.create({
    role: 'DELIVERY',
    loginId: vehicle,
    email: internalEmail,
    passwordHash,
    active: true,
    contactName: `Vehicle ${vehicle}`,
  })
  return driver
}

async function syncOrderStatus(delivery, deliveryStatus) {
  if (!delivery.orderId) return
  const order = await Order.findById(delivery.orderId)
  if (!order) return

  const map = {
    PROCESSED: 'ALLOCATED',
    PACKED: 'DISPATCHED',
    OUT_FOR_DELIVERY: 'DISPATCHED',
    DELIVERED: 'DELIVERED',
    RETURN_PICKUP: 'DELIVERED',
    PENDING_RETURN: 'DELIVERED',
    COMPLETED: 'CLOSED',
  }
  const next = map[deliveryStatus]
  if (next && order.status !== next && order.status !== 'CANCELLED') {
    order.status = next
    await order.save()
  }
}

async function notifyDeliveryProcessed(delivery) {
  const godownIds = deliveryGodownIds(delivery)
  await notifyGodownUsers(godownIds, {
    type: 'DELIVERY_PROCESSED',
    title: 'New delivery to process',
    body: `${delivery.deliveryNo} — ${delivery.customerName}`,
    refType: 'Delivery',
    refId: delivery._id,
  })
}

async function notifyDeliveryPacked(delivery) {
  const godownIds = deliveryGodownIds(delivery)
  await notifyGodownUsers(godownIds, {
    type: 'DELIVERY_PACKED',
    title: 'Delivery packed',
    body: `${delivery.deliveryNo} is ready for vehicle assignment`,
    refType: 'Delivery',
    refId: delivery._id,
  })
}

async function notifyOutForDelivery(delivery, driverId) {
  if (driverId) {
    await notifyUser(driverId, {
      type: 'DELIVERY_OUT_FOR_DELIVERY',
      title: 'Out for delivery',
      body: `${delivery.deliveryNo} — ${delivery.siteAddress || delivery.siteName || delivery.customerName}`,
      refType: 'Delivery',
      refId: delivery._id,
    })
  }
}

async function notifyReturnPickupAssigned(delivery, driverId) {
  if (driverId) {
    await notifyUser(driverId, {
      type: 'RETURN_PICKUP_ASSIGNED',
      title: 'Return pickup assigned',
      body: `${delivery.deliveryNo} — collect from ${delivery.siteAddress || delivery.siteName || delivery.customerName}`,
      refType: 'Delivery',
      refId: delivery._id,
    })
  }
}

module.exports = {
  DEFAULT_DRIVER_PASSWORD,
  deliveryGodownIds,
  ensureDeliveryDriver,
  syncOrderStatus,
  notifyDeliveryProcessed,
  notifyDeliveryPacked,
  notifyOutForDelivery,
  notifyReturnPickupAssigned,
}
