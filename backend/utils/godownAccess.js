const mongoose = require('mongoose')
const { deliveryGodownIds } = require('./deliveryWorkflow')

function validGodownId(id) {
  if (id == null) return undefined
  const s = String(id)
  return mongoose.Types.ObjectId.isValid(s) ? s : undefined
}

function entityGodownIds(entity) {
  return deliveryGodownIds(entity)
}

function godownCanAccessDelivery(req, delivery) {
  const gid = validGodownId(req.user?.godownId)
  if (!gid) return false
  return entityGodownIds(delivery).includes(gid)
}

function godownAccessDeniedMessage(req, delivery) {
  const gid = validGodownId(req.user?.godownId)
  if (!gid) {
    return 'Godown account is not linked to a warehouse. Log out and sign in again with your godown mobile.'
  }
  if (!godownCanAccessDelivery(req, delivery)) {
    return 'This delivery belongs to another godown'
  }
  return 'Forbidden'
}

module.exports = {
  validGodownId,
  entityGodownIds,
  godownCanAccessDelivery,
  godownAccessDeniedMessage,
}
