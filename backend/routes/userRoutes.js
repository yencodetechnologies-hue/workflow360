const express = require('express')
const {
  listUsers,
  listBillers,
  createUser,
  createBiller,
  updateUser,
  setUserActive,
  resetPassword,
  deleteUser,
  getMyProfile,
  updateMyProfile
} = require('../controllers/userController')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

router.use(requireAuth)

router.get('/billers', requireRole(['ADMIN', 'BILLER']), listBillers)
router.post('/billers', requireRole(['ADMIN']), createBiller)

router.use(requireRole(['ADMIN']))

router.get('/me', getMyProfile)
router.put('/me', updateMyProfile)

router.get('/', listUsers)
router.post('/', createUser)
router.patch('/:id/active', setUserActive)
router.post('/:id/reset-password', resetPassword)
router.delete('/:id', deleteUser)
router.patch('/:id', updateUser)


module.exports = router
