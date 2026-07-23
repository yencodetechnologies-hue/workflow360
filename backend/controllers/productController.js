const Product = require('../models/Product');
const ScannedProduct = require('../models/ScannedProduct');
const AssetTag = require('../models/AssetTag');
const { findProductByRouteId } = require('../utils/resolveProduct');

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
        const product = await findProductByRouteId(req.params.id);

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Pick a free s_no. Product names (particulars) may be duplicated;
 * only serial numbers must stay unique. If the client sends a taken
 * (or empty) s_no, allocate the next available numeric value.
 */
async function allocateSNo(preferred) {
    const products = await Product.find({}).select('s_no').lean()
    const used = new Set(
        products.map((p) => String(p.s_no ?? '').trim()).filter(Boolean),
    )
    let max = 0
    for (const s of used) {
        const n = parseInt(s, 10)
        if (!Number.isNaN(n)) max = Math.max(max, n)
    }
    const pref = preferred != null ? String(preferred).trim() : ''
    if (pref && !used.has(pref)) return pref
    let next = max + 1
    while (used.has(String(next))) next += 1
    return String(next)
}

// @desc    Create a product (duplicate particulars / names allowed)
// @route   POST /api/products
// @access  Public
const createProduct = async (req, res) => {
    try {
        const { s_no, category, particulars, specification, rate, image_path, image_status, sku, unit, reorderLevel } = req.body;

        if (!particulars || !String(particulars).trim()) {
            return res.status(400).json({ message: 'Product name (particulars) is required' });
        }
        if (!category || !String(category).trim()) {
            return res.status(400).json({ message: 'Category is required' });
        }

        const allocatedSNo = await allocateSNo(s_no)
        const resolvedSku = (sku && String(sku).trim()) || `SKU-${allocatedSNo}`

        const product = await Product.create({
            s_no: allocatedSNo,
            category: String(category).trim(),
            particulars: String(particulars).trim(),
            specification,
            rate,
            image_path,
            image_status,
            sku: resolvedSku,
            unit,
            reorderLevel
        });

        if (product) {
            res.status(201).json(product);
        } else {
            res.status(400).json({ message: 'Invalid product data' });
        }
    } catch (error) {
        // Race: another create took the same s_no/productId — retry once with a fresh serial
        if (error && error.code === 11000) {
            try {
                const { category, particulars, specification, rate, image_path, image_status, unit, reorderLevel } = req.body;
                const allocatedSNo = await allocateSNo(null)
                const product = await Product.create({
                    s_no: allocatedSNo,
                    category: String(category).trim(),
                    particulars: String(particulars).trim(),
                    specification,
                    rate,
                    image_path,
                    image_status,
                    sku: `SKU-${allocatedSNo}`,
                    unit,
                    reorderLevel
                });
                return res.status(201).json(product);
            } catch (retryErr) {
                return res.status(500).json({ message: retryErr.message });
            }
        }
        console.error('CREATE PRODUCT ERROR:', error);
        res.status(500).json({
            message: error.message,
            name: error.name,
            errors: error.errors
        });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Public
const updateProduct = async (req, res) => {
    try {
        const product = await findProductByRouteId(req.params.id);

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
        const product = await findProductByRouteId(req.params.id);

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
// @access  Public (called from mobile device after physical write)
const assignTag = async (req, res) => {
    try {
        const { productId, tagId } = req.body;

        if (!productId || !tagId) {
            return res.status(400).json({ status: "error", message: "productId and tagId are required" });
        }

        // Resolve by either MongoDB _id or productId string field
        const product = await findProductByRouteId(productId);
        if (!product) {
            return res.status(404).json({ status: "not_found", message: "Product not found" });
        }

        // Check if this tag is already assigned to a DIFFERENT product
        const existingOwner = await Product.findOne({ tagId, _id: { $ne: product._id } });
        if (existingOwner) {
            return res.status(409).json({
                status: "conflict",
                message: `Tag already assigned to "${existingOwner.particulars}" (ID ${existingOwner.productId}). Unassign it first.`,
                conflictProduct: {
                    productId: existingOwner.productId,
                    name: existingOwner.particulars
                }
            });
        }

        product.tagId = tagId;
        const updated = await product.save();

        res.json({
            status: "success",
            message: "Tag assigned",
            product: updated
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
// @access  Private (ADMIN, GODOWN) — JWT via productRoutes
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
// @access  Private (ADMIN, GODOWN) — JWT via productRoutes
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

// @desc    Unassign RFID tag from product
// @route   POST /api/products/unassign-tag
// @access  Private (ADMIN, GODOWN) — JWT via productRoutes
const unassignTag = async (req, res) => {
    try {
        const { tagId } = req.body;

        if (!tagId) {
            return res.status(400).json({ status: "error", message: "tagId is required" });
        }

        const product = await Product.findOneAndUpdate(
            { tagId },
            { $unset: { tagId: "" } },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ status: "not_found", message: "No product found with this tag" });
        }

        res.json({
            status: "success",
            message: "Tag unassigned",
            product
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

// @desc    Bulk lookup: given EPCs, return assigned product for each (checks both AssetTag and Product.tagId)
// @route   POST /api/products/tags/lookup
// @access  Public (same auth level as /products/scan — used by RFID scanner)
const lookupByTagIds = async (req, res) => {
    try {
        const { tagIds } = req.body;
        if (!Array.isArray(tagIds) || tagIds.length === 0) return res.json([]);

        const ids = [...new Set(tagIds.map(t => String(t || '').trim()).filter(Boolean))];

        // AssetTag collection (new godown-based enrollment)
        const assetTags = await AssetTag.find({ tagId: { $in: ids } }).lean();
        const assetProductIds = [...new Set(assetTags.map(a => String(a.productId)))];
        const assetProducts = await Product.find({ _id: { $in: assetProductIds } })
            .select('particulars sku productId')
            .lean();
        const productById = new Map(assetProducts.map(p => [String(p._id), p]));

        const result = [];
        const covered = new Set();

        for (const at of assetTags) {
            const p = productById.get(String(at.productId));
            result.push({
                tagId: at.tagId,
                productId: String(at.productId),
                productName: p?.particulars || p?.sku || String(at.productId),
                sku: p?.sku || '',
                source: 'asset',
            });
            covered.add(at.tagId);
        }

        // Product.tagId field (old direct-assign style) — for any tags not already covered
        const uncovered = ids.filter(id => !covered.has(id));
        if (uncovered.length > 0) {
            const products = await Product.find({ tagId: { $in: uncovered } })
                .select('tagId particulars sku productId')
                .lean();
            for (const p of products) {
                result.push({
                    tagId: p.tagId,
                    productId: String(p.productId || p._id),
                    productName: p.particulars || p.sku || String(p._id),
                    sku: p.sku || '',
                    source: 'product',
                });
            }
        }

        return res.json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
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
    bulkAssignTags,
    unassignTag,
    lookupByTagIds,
};
