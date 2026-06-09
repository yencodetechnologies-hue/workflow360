const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const {
  dailyDeliveryReport,
  calendarReport,
  sitesList,
  customersList,
  missingReport,
  missingProductsReport,
  customerHistory,
  issuesByGodown,
  issuesByDelivery,
  returnsByBiller,
  returnsByProduct,
} = require('../controllers/reportController')

const router = express.Router()

router.use(requireAuth)

const reportRoles = ['ADMIN', 'GODOWN', 'DELIVERY', 'BILLER']

router.get('/daily', requireRole(reportRoles), dailyDeliveryReport)
router.get('/calendar', requireRole(reportRoles), calendarReport)
router.get('/sites', requireRole(reportRoles), sitesList)
router.get('/customers', requireRole(reportRoles), customersList)
router.get('/issues/by-godown', requireRole(reportRoles), issuesByGodown)
router.get('/issues/by-delivery', requireRole(reportRoles), issuesByDelivery)
router.get('/returns/by-biller', requireRole(reportRoles), returnsByBiller)
router.get('/returns/by-product', requireRole(reportRoles), returnsByProduct)
router.get('/missing', requireRole(reportRoles), missingReport)
router.get('/missing-products', requireRole(reportRoles), missingProductsReport)
router.get('/customer-history', requireRole(['ADMIN', 'BILLER']), customerHistory)

module.exports = router
