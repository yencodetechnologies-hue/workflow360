const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Force public DNS to resolve MongoDB SRV records
dns.setServers(['8.8.8.8', '1.1.1.1']);

const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const Product = require('../models/Product');

dotenv.config();

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const JSON_PATH = path.join(__dirname, '..', '..', 'frontend', 'price_list_2026.json');
const IMAGES_DIR = path.join(__dirname, '..', '..', 'frontend');

async function syncProducts() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Read JSON
        const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
        console.log(`Found ${data.length} products in JSON`);

        const updatedData = [];

        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const s_no = item.s_no;
            
            // Generate Product ID if not exists
            if (!item.productId) {
                item.productId = `WF360-${s_no.padStart(4, '0')}`;
            }

            console.log(`[${i+1}/${data.length}] Processing Product: ${item.particulars} (ID: ${item.productId})`);

            let imageUrl = item.image_url;

            // Upload to Cloudinary if image_path exists and image_url is missing
            if (item.image_path && !item.image_url) {
                const localImagePath = path.join(IMAGES_DIR, item.image_path);
                
                if (fs.existsSync(localImagePath)) {
                    try {
                        const result = await cloudinary.uploader.upload(localImagePath, {
                            folder: 'products',
                            use_filename: true,
                            unique_filename: false,
                            overwrite: true,
                            public_id: `prod_${s_no}`
                        });
                        imageUrl = result.secure_url;
                        item.image_url = imageUrl;
                        console.log(`   Uploaded image to Cloudinary: ${imageUrl}`);
                    } catch (uploadErr) {
                        console.error(`   Failed to upload image for s_no ${s_no}:`, uploadErr.message);
                    }
                } else {
                    console.warn(`   Local image not found at ${localImagePath}`);
                }
            } else if (item.image_url) {
                console.log(`   Image already on Cloudinary: ${item.image_url}`);
            }

            // Sync with MongoDB
            const productData = {
                s_no: item.s_no,
                productId: item.productId,
                category: item.category,
                particulars: item.particulars,
                specification: item.specification,
                rate: item.rate,
                image_path: item.image_path,
                image_url: imageUrl,
                image_status: 'cloudinary_synced',
                sku: item.sku || `SKU-${item.s_no}`
            };

            await Product.findOneAndUpdate(
                { s_no: item.s_no },
                productData,
                { upsert: true, new: true }
            );

            updatedData.push(item);
        }

        // Write updated JSON back
        fs.writeFileSync(JSON_PATH, JSON.stringify(updatedData, null, 4));
        console.log('Successfully updated JSON and MongoDB');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (err) {
        console.error('Sync failed:', err);
    }
}

syncProducts();
