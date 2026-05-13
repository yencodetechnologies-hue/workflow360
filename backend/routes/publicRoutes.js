const express = require('express')
const {
  getDeliveryVerify,
  postDeliveryVerify,
  getBillerReturn,
  postBillerReturn,
} = require('../controllers/publicVerifyController')

const router = express.Router()

router.get('/delivery-verify/:token', getDeliveryVerify)
router.post('/delivery-verify/:token', postDeliveryVerify)
router.get('/biller-return/:token', getBillerReturn)
router.post('/biller-return/:token', postBillerReturn)

module.exports = router
