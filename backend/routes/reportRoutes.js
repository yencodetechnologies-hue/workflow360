

const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const {
  dailyDeliveryReport,
  dailyReturnsReport,
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
  customerProductsReport,
  returnsByBiller,
  returnsByProduct,
  productsSummaryReport,
  statusCounts,
} = require('../controllers/reportController')

const router = express.Router()

router.use(requireAuth)

const reportRoles = ['ADMIN', 'GODOWN', 'DELIVERY', 'BILLER']

router.get('/daily', requireRole(reportRoles), dailyDeliveryReport)
router.get('/daily-returns', requireRole(reportRoles), dailyReturnsReport)
router.get('/calendar', requireRole(reportRoles), calendarReport)
router.get('/sites', requireRole(reportRoles), sitesList)
router.get('/customers', requireRole(reportRoles), customersList)
router.get('/issues/by-godown', requireRole(reportRoles), issuesByGodown)
router.get('/issues/by-delivery', requireRole(reportRoles), issuesByDelivery)
router.get('/issues/customer', requireRole(reportRoles), issuesCustomerReport)
router.get('/issues/customer-products', requireRole(reportRoles), customerProductsReport)
router.get('/returns/by-biller', requireRole(reportRoles), returnsByBiller)
router.get('/returns/by-product', requireRole(reportRoles), returnsByProduct)
router.get('/missing', requireRole(reportRoles), missingReport)
router.get('/missing-products', requireRole(reportRoles), missingProductsReport)
router.get('/stock', requireRole(['ADMIN', 'GODOWN', 'BILLER']), stockReport)
router.get('/products-summary', requireRole(['ADMIN', 'GODOWN', 'BILLER']), productsSummaryReport)
router.get('/customer-history', requireRole(['ADMIN', 'BILLER']), customerHistory)
router.get('/status-counts', requireRole(reportRoles), statusCounts)

module.exports = router