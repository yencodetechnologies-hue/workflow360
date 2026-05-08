const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const { dailyDeliveryReport, missingReport, stockReport, customerHistory } = require('../controllers/reportController')

const router = express.Router()

router.use(requireAuth)

router.get('/daily', requireRole(['ADMIN', 'GODOWN', 'DELIVERY', 'BILLER']), dailyDeliveryReport)
router.get('/missing', requireRole(['ADMIN', 'GODOWN', 'DELIVERY', 'BILLER']), missingReport)
router.get('/stock', requireRole(['ADMIN', 'GODOWN']), stockReport)
router.get('/customer-history', requireRole(['ADMIN', 'BILLER']), customerHistory)

module.exports = router

