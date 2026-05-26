const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const { createOrder, listOrders, getOrder } = require('../controllers/orderController')

const router = express.Router()

router.use(requireAuth)
router.get('/', requireRole(['ADMIN', 'BILLER', 'GODOWN']), listOrders)
router.get('/:id', requireRole(['ADMIN', 'BILLER', 'GODOWN']), getOrder)
router.post('/', requireRole(['ADMIN', 'BILLER']), createOrder)

module.exports = router
