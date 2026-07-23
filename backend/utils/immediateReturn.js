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
  line.qty = kept
  line.dispatchedQty = kept

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
}
