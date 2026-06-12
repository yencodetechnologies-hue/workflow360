const express = require('express')
const { login, me } = require('../controllers/authController')
const { sendOtp, verifyOtp, resetPassword } = require('../controllers/forgotPasswordController')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.post('/login', login)
router.get('/me', requireAuth, me)

// Forgot password flow
router.post('/forgot-password', sendOtp)
router.post('/verify-otp', verifyOtp)
router.post('/reset-password', resetPassword)

module.exports = router