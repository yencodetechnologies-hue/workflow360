const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const {
  createDelivery,
  updateDelivery,
  listDeliveries,
  getDelivery,
  deleteDelivery,
  updateDeliveryStatus,
  regenerateDeliveryTokens,
  markPacked,
  outForDelivery,
  vehicleVerify,
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
} = require('../controllers/deliveryController')

const router = express.Router()

router.use(requireAuth)

router.get('/', requireRole(['ADMIN', 'GODOWN', 'DELIVERY', 'BILLER']), listDeliveries)
router.post('/', requireRole(['ADMIN', 'BILLER']), createDelivery)
router.patch('/:id', requireRole(['ADMIN', 'BILLER']), updateDelivery)

router.delete('/:id', requireRole(['ADMIN', 'BILLER']), deleteDelivery)
router.patch('/:id/status', requireRole(['ADMIN']), updateDeliveryStatus)
router.post('/:id/regenerate-tokens', requireRole(['ADMIN']), regenerateDeliveryTokens)

router.post('/asset-tags/enroll', requireRole(['ADMIN', 'GODOWN']), enrollTag)

router.get('/:id/challan.pdf', requireRole(['ADMIN', 'GODOWN', 'DELIVERY', 'BILLER']), challanPdf)

router.post('/:id/mark-packed', requireRole(['ADMIN', 'GODOWN']), markPacked)
router.post('/:id/out-for-delivery', requireRole(['ADMIN', 'GODOWN']), outForDelivery)
router.post('/:id/vehicle-verify', requireRole(['ADMIN', 'GODOWN']), vehicleVerify)
router.post('/:id/assign-return-pickup', requireRole(['ADMIN', 'GODOWN']), assignReturnPickup)
router.post('/:id/dispatch-scan', requireRole(['ADMIN', 'GODOWN']), dispatchScan)
router.post('/:id/pickup-scan', requireRole(['ADMIN', 'DELIVERY']), pickupScan)
router.post('/:id/deliver-scan', requireRole(['ADMIN', 'DELIVERY']), deliverScan)
router.post('/:id/return-pickup-scan', requireRole(['ADMIN', 'DELIVERY']), returnPickupScan)
router.post('/:id/return-scan', requireRole(['ADMIN', 'GODOWN']), returnScan)
router.post('/:id/confirm-dispatch', requireRole(['ADMIN', 'GODOWN']), confirmDispatch)
router.post('/:id/confirm-return', requireRole(['ADMIN', 'GODOWN']), confirmReturn)
router.post('/:id/mark-delivered', requireRole(['ADMIN', 'GODOWN']), markDelivered)
router.post('/:id/close-return', requireRole(['ADMIN', 'GODOWN']), closeReturn)

router.get('/:id', requireRole(['ADMIN', 'GODOWN', 'DELIVERY', 'BILLER']), getDelivery)

module.exports = router
