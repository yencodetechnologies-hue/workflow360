const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const {
  dailyDeliveryReport,
  calendarReport,
  sitesList,
  missingReport,
  missingProductsReport,
  stockReport,
  customerHistory,
} = require('../controllers/reportController')

const router = express.Router()

router.use(requireAuth)

const reportRoles = ['ADMIN', 'GODOWN', 'DELIVERY', 'BILLER']

router.get('/daily', requireRole(reportRoles), dailyDeliveryReport)
router.get('/calendar', requireRole(reportRoles), calendarReport)
router.get('/sites', requireRole(reportRoles), sitesList)
router.get('/missing', requireRole(reportRoles), missingReport)
router.get('/missing-products', requireRole(reportRoles), missingProductsReport)
router.get('/stock', requireRole(['ADMIN', 'GODOWN']), stockReport)
router.get('/customer-history', requireRole(['ADMIN', 'BILLER']), customerHistory)

module.exports = router
