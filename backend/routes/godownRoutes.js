const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const { listGodowns, createGodown, queueByDate } = require('../controllers/godownController')

const router = express.Router()

router.use(requireAuth)

router.get('/', requireRole(['ADMIN', 'GODOWN', 'BILLER', 'DELIVERY']), listGodowns)
router.post('/', requireRole(['ADMIN']), createGodown)

router.get('/queue', requireRole(['ADMIN', 'GODOWN']), queueByDate)

module.exports = router

