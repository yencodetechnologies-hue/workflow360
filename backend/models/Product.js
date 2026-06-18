const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    s_no: {
        type: String,
        required: true,
        unique: true
    },
    productId: {
        type: String,
        unique: true
    },
    category: {
        type: String,
        required: true
    },
    particulars: {
        type: String,
        required: true
    },
    specification: {
        type: String
    },
    rate: {
        type: String
    },
    image_path: {
        type: String
    },
    image_url: {
        type: String
    },
    image_status: {
        type: String
    },
    // Adding fields expected by the frontend
    sku: {
        type: String
    },
    unit: {
        type: String,
        default: 'pcs'
    },
    tagId: { type: String, unique: true, sparse: true },
    reorderLevel: {
        type: Number,
        default: 0
    }
    
}, {
    timestamps: true
});

// Middleware to set SKU if not provided
productSchema.pre('save', function () {

    if (!this.productId) {
        this.productId = `PROD-${this.s_no}`;
    }

    if (!this.sku) {
        this.sku = `SKU-${this.s_no}`;
    }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
