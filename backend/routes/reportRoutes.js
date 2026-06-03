const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const {
  dailyDeliveryReport,
  calendarReport,
  sitesList,
  customersList,
  missingReport,
  missingProductsReport,
  stockReport,
  customerHistory,
  issuesByGodown,
  issuesByDelivery,
  issuesCustomerReport,
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
router.get('/issues/customer', requireRole(reportRoles), issuesCustomerReport)
router.get('/missing', requireRole(reportRoles), missingReport)
router.get('/missing-products', requireRole(reportRoles), missingProductsReport)
router.get('/stock', requireRole(['ADMIN', 'GODOWN']), stockReport)
router.get('/customer-history', requireRole(['ADMIN', 'BILLER']), customerHistory)

module.exports = router
