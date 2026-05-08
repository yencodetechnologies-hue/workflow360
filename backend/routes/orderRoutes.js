const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const { createOrder, listOrders } = require('../controllers/orderController')

const router = express.Router()

router.use(requireAuth)
router.get('/', requireRole(['ADMIN', 'BILLER']), listOrders)
router.post('/', requireRole(['ADMIN', 'BILLER']), createOrder)

module.exports = router

