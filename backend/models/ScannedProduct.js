const mongoose = require('mongoose');

const scannedProductSchema = mongoose.Schema({
    productId: {
        type: String,
        required: true
    },
    tagId: {
        type: String,
        required: true
    },
    particulars: {
        type: String
    },
    rate: {
        type: String
    },
    scannedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const ScannedProduct = mongoose.model('ScannedProduct', scannedProductSchema);

module.exports = ScannedProduct;
