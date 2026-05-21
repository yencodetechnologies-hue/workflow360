const express = require('express')
const {
  listUsers,
  listBillers,
  createUser,
  createBiller,
  updateUser,
  setUserActive,
  resetPassword,
  getMyProfile,
  updateMyProfile
} = require('../controllers/userController')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

router.use(requireAuth)

router.get('/billers', requireRole(['ADMIN', 'BILLER']), listBillers)
router.post('/billers', requireRole(['ADMIN']), createBiller)

router.use(requireRole(['ADMIN']))

router.get('/', listUsers)
router.post('/', createUser)
router.patch('/:id/active', setUserActive)
router.post('/:id/reset-password', resetPassword)
router.patch('/:id', updateUser)
router.get('/me',  getMyProfile)

/* UPDATE ADMIN PROFILE */
router.put('/me',  updateMyProfile)


module.exports = router
