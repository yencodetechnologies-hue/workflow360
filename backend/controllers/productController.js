const Product = require('../models/Product');
const ScannedProduct = require('../models/ScannedProduct');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Public
const createProduct = async (req, res) => {
    try {
        const { s_no, category, particulars, specification, rate, image_path, image_status, sku, unit, reorderLevel } = req.body;

        const productExists = await Product.findOne({ s_no });

        if (productExists) {
            return res.status(400).json({ message: 'Product already exists' });
        }

        const product = await Product.create({
            s_no,
            category,
            particulars,
            specification,
            rate,
            image_path,
            image_status,
            sku,
            unit,
            reorderLevel
        });

        if (product) {
            res.status(201).json(product);
        } else {
            res.status(400).json({ message: 'Invalid product data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Public
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            product.category = req.body.category || product.category;
            product.particulars = req.body.particulars || product.particulars;
            product.specification = req.body.specification || product.specification;
            product.rate = req.body.rate || product.rate;
            product.image_path = req.body.image_path || product.image_path;
            product.image_status = req.body.image_status || product.image_status;
            product.sku = req.body.sku || product.sku;
            product.unit = req.body.unit || product.unit;
            product.reorderLevel = req.body.reorderLevel !== undefined ? req.body.reorderLevel : product.reorderLevel;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Public
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Assign RFID tag to product
// @route   POST /api/products/assign-tag
// @access  Public
const assignTag = async (req, res) => {
    try {
        const { productId, tagId } = req.body;

        const product = await Product.findOneAndUpdate(
            { productId },
            { tagId },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ status: "not_found", message: "Product not found" });
        }

        res.json({
            status: "success",
            message: "Tag assigned",
            product
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

// @desc    Scan RFID tag to get product and log the scan
// @route   POST /api/products/scan
// @access  Public
const scanProduct = async (req, res) => {
    try {
        const { tagId } = req.body;

        const product = await Product.findOne({ tagId });

        if (!product) {
            return res.json({ status: "not_found" });
        }

        // Log the scan to the new collection
        await ScannedProduct.create({
            productId: product.productId,
            tagId: tagId,
            particulars: product.particulars,
            rate: product.rate
        });

        res.json({
            status: "success",
            product
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

// @desc    Get scan history
// @route   GET /api/products/scan-history
// @access  Public
const getScanHistory = async (req, res) => {
    try {
        const history = await ScannedProduct.find({}).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk assign RFID tags to products
// @route   POST /api/products/bulk-assign
// @access  Public
const bulkAssignTags = async (req, res) => {
    try {
        const updates = req.body;

        if (!Array.isArray(updates)) {
            return res.status(400).json({ message: "Request body must be an array" });
        }

        for (let item of updates) {
            await Product.updateOne(
                { productId: item.productId },
                { tagId: item.tagId }
            );
        }

        res.json({ status: "bulk updated", count: updates.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    assignTag,
    scanProduct,
    getScanHistory,
    bulkAssignTags
};
