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

router.route('/')
    .get(getProducts)
    .post(createProduct);

router.post('/upload', uploadImage);

// RFID Tag Routes
router.post('/assign-tag', assignTag);
router.post('/scan', scanProduct);
router.get('/scan-history', getScanHistory);
router.post('/bulk-assign', bulkAssignTags);

router.route('/:id')
    .get(getProductById)
    .put(updateProduct)
    .delete(deleteProduct);

module.exports = router;
