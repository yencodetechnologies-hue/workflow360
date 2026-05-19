const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const { listGodowns, createGodown, updateGodown, getGodown, queueByDate } = require('../controllers/godownController')
const { listGodownProducts, patchGodownProduct } = require('../controllers/godownProductController')
const { postGodownAdjustment, postRfidIntake } = require('../controllers/godownInventoryController')

const router = express.Router()

router.use(requireAuth)

router.get('/', requireRole(['ADMIN', 'GODOWN', 'BILLER', 'DELIVERY']), listGodowns)
router.post('/', requireRole(['ADMIN']), createGodown)

router.get('/queue', requireRole(['ADMIN', 'GODOWN']), queueByDate)

router.get('/:godownId/products', requireRole(['ADMIN', 'GODOWN', 'BILLER']), listGodownProducts)
router.patch('/:godownId/products', requireRole(['ADMIN', 'GODOWN']), patchGodownProduct)
router.post('/:godownId/inventory/adjust', requireRole(['ADMIN', 'GODOWN']), postGodownAdjustment)
router.post('/:godownId/inventory/rfid-intake', requireRole(['ADMIN', 'GODOWN']), postRfidIntake)

router.patch('/:godownId', requireRole(['ADMIN', 'GODOWN']), updateGodown)

router.get('/:godownId', requireRole(['ADMIN', 'GODOWN', 'BILLER', 'DELIVERY']), getGodown)

module.exports = router

