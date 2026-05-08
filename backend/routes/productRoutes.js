const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    assignTag,
    scanProduct,
    getScanHistory,
    bulkAssignTags
} = require('../controllers/productController');
const { uploadImage } = require('../controllers/uploadController');
const { requireAuth, requireRole } = require('../middleware/auth')

router.route('/')
    .get(getProducts)
    .post(requireAuth, requireRole(['ADMIN', 'GODOWN']), createProduct);

router.post('/upload', requireAuth, requireRole(['ADMIN', 'GODOWN']), uploadImage);

// RFID Tag Routes
router.post('/assign-tag', requireAuth, requireRole(['ADMIN', 'GODOWN']), assignTag);
router.post('/scan', scanProduct);
router.get('/scan-history', getScanHistory);
router.post('/bulk-assign', requireAuth, requireRole(['ADMIN', 'GODOWN']), bulkAssignTags);

router.route('/:id')
    .get(getProductById)
    .put(requireAuth, requireRole(['ADMIN', 'GODOWN']), updateProduct)
    .delete(requireAuth, requireRole(['ADMIN']), deleteProduct);

module.exports = router;
