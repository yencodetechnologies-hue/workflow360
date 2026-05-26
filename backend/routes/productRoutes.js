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
    unassignTag,
    bulkAssignTags,
    lookupByTagIds,
} = require('../controllers/productController');
const { uploadImage } = require('../controllers/uploadController');
const { requireAuth, requireRole } = require('../middleware/auth')

router.route('/')
    .get(getProducts)
    .post(requireAuth, requireRole(['ADMIN', 'GODOWN']), createProduct);

router.post('/upload', requireAuth, requireRole(['ADMIN', 'GODOWN']), uploadImage);

// RFID Tag Routes (mutations + scan history: ADMIN / GODOWN JWT; scan remains public for kiosk identify)
router.post('/assign-tag', assignTag);
router.post('/unassign-tag', requireAuth, requireRole(['ADMIN', 'GODOWN']), unassignTag);
router.post('/scan', scanProduct);
router.get('/scan-history', requireAuth, requireRole(['ADMIN', 'GODOWN']), getScanHistory);
router.post('/bulk-assign', requireAuth, requireRole(['ADMIN', 'GODOWN']), bulkAssignTags);
router.post('/tags/lookup', lookupByTagIds);

router.route('/:id')
    .get(getProductById)
    .put(requireAuth, requireRole(['ADMIN', 'GODOWN']), updateProduct)
    .delete(requireAuth, requireRole(['ADMIN']), deleteProduct);

module.exports = router;
