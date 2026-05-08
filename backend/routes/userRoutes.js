const express = require('express')
const { listUsers, createUser, setUserActive, resetPassword } = require('../controllers/userController')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

router.use(requireAuth)
router.use(requireRole(['ADMIN']))

router.get('/', listUsers)
router.post('/', createUser)
router.patch('/:id/active', setUserActive)
router.post('/:id/reset-password', resetPassword)

module.exports = router

