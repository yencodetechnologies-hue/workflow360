const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const { listActivityLogs } = require('../controllers/activityLogController')

const router = express.Router()

router.use(requireAuth)

router.get('/', requireRole(['ADMIN', 'GODOWN', 'DELIVERY', 'BILLER']), listActivityLogs)

module.exports = router
