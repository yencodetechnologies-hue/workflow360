const mongoose = require('mongoose')
const Order = require('../models/Order')

/**
 * A short-delivery (recipient acknowledges fewer than dispatched) means the
 * customer's order for that product is really only for what they kept —
 * the rest went straight back to the godown. Shrink the linked order's line
 * qty to match, so the order no longer overstates what the customer has.
 *
 * @param {import('mongoose').Types.ObjectId|string|undefined} orderId
 * @param {Map<string, number>} deltaByGodownProduct key `${godownId}|${productId}` → qty to remove
 */
async function shrinkOrderQtyForImmediateReturns(orderId, deltaByGodownProduct) {
  if (!orderId || !deltaByGodownProduct || deltaByGodownProduct.size === 0) return
  const order = await Order.findById(orderId)
  if (!order) return

  let changed = false
  for (const [key, delta] of deltaByGodownProduct.entries()) {
    if (delta <= 0) continue
    const [gid, pid] = key.split('|')
    const line = order.lines.find(
      (l) => String(l.productId) === pid && (!gid || !l.godownId || String(l.godownId) === gid),
    )
    if (!line) continue
    line.qty = Math.max(0, (Number(line.qty) || 0) - delta)
    changed = true
  }
  if (!changed) return
  order.lines = order.lines.filter((l) => l.qty > 0)
  await order.save()
}

/**
 * Short-delivery restock: shrink line.qty + line.dispatchedQty to the delivered
 * amount and queue a ledger restock. Does NOT touch returnedQty (reserved for
 * the biller return reconciliation flow).
 *
 * @param {object} line delivery line (mutated)
 * @param {number} deliveredQty already clamped to [0, baseline]
 * @param {object} delivery parent delivery
 * @param {Map<string, number>} orderDeltaByGodownProduct accumulates order shrinks
 * @param {object[]} ledgerEntries push ledger docs here
 * @param {{ refType: string, note: string, byUserId?: string|import('mongoose').Types.ObjectId }} meta
 * @returns {number} shortfall restocked (0 if none)
 */
function applyLineImmediateShortfall(line, deliveredQty, delivery, orderDeltaByGodownProduct, ledgerEntries, meta) {
  const baseline = Number(line.dispatchedQty) > 0 ? Number(line.dispatchedQty) : Number(line.qty) || 0
  const kept = Math.max(0, Math.min(baseline, Number(deliveredQty) || 0))
  const shortfall = baseline - kept
  if (shortfall <= 0) return 0

  // Shrink allocated + dispatched so Ordered/Delivered match and outstanding
  // (dispatchedQty - returnedQty) no longer counts the restocked units.
  // Do NOT increment returnedQty — that column is only for biller return pickup.
  line.qty = kept
  line.dispatchedQty = kept
  // If an older verify path had already parked the shortfall in returnedQty,
  // clear the overlapping amount so the detail "Biller returned" column stays 0.
  const prevReturned = Number(line.returnedQty) || 0
  if (prevReturned > 0) {
    line.returnedQty = Math.max(0, prevReturned - shortfall)
  }

  const gid = line.godownId || delivery.fromGodownId
  if (gid) {
    const entry = {
      godownId: new mongoose.Types.ObjectId(String(gid)),
      productId: new mongoose.Types.ObjectId(String(line.productId)),
      qtyDelta: shortfall,
      reason: 'RETURN',
      refType: meta.refType,
      refId: String(delivery._id),
      note: meta.note,
    }
    if (meta.byUserId) {
      entry.byUserId = new mongoose.Types.ObjectId(String(meta.byUserId))
    }
    ledgerEntries.push(entry)

    const key = `${String(gid)}|${String(line.productId)}`
    orderDeltaByGodownProduct.set(key, (orderDeltaByGodownProduct.get(key) || 0) + shortfall)
  }

  return shortfall
}

module.exports = {
  shrinkOrderQtyForImmediateReturns,
  applyLineImmediateShortfall,
  repairLegacyImmediateReturnOnDelivery,
}

/**
 * Older verify path stored shortfall in returnedQty and left qty at the
 * dispatched amount. Convert those rows to the shrink model so detail shows
 * Ordered = delivered and Biller returned = 0 (until a real biller return).
 *
 * Only runs when verify is done and biller return has not been submitted.
 * Pattern: qtyAck + returnedQty === line.qty (and dispatched matches).
 *
 * @param {import('mongoose').Document} delivery
 * @returns {Promise<boolean>} true if lines were rewritten and saved
 */
async function repairLegacyImmediateReturnOnDelivery(delivery) {
  if (!delivery?.deliveryVerifiedAt || delivery.billerReturnSubmittedAt) return false
  const checks = delivery.deliveryLineChecks || []
  if (!checks.length || !delivery.lines?.length) return false

  let changed = false

  for (let idx = 0; idx < delivery.lines.length; idx++) {
    const line = delivery.lines[idx]
    const check =
      checks.find((c) => String(c.productId) === String(line.productId)) || checks[idx]
    if (!check || check.qtyAck == null) continue

    const qty = Number(line.qty) || 0
    const dispatched = Number(line.dispatchedQty) > 0 ? Number(line.dispatchedQty) : qty
    const returned = Number(line.returnedQty) || 0
    const ack = Math.max(0, Math.min(dispatched, Number(check.qtyAck) || 0))
    if (returned <= 0) continue
    // Old short-delivery shape: kept + "returned" shortfall == what left the godown
    if (ack + returned !== dispatched && ack + returned !== qty) continue

    line.qty = ack
    line.dispatchedQty = ack
    line.returnedQty = 0
    changed = true
  }

  if (!changed) return false

  delivery.markModified('lines')
  await delivery.save()
  // Do not re-shrink the order — older builds that wrote returnedQty may already
  // have reduced order qty when verify ran.
  return true
}
