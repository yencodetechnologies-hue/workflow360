const express = require('express');
const dns = require('dns');

// Force public DNS to resolve MongoDB SRV records
dns.setServers(['8.8.8.8', '1.1.1.1']);

const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const Product = require('./models/Product');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static images
app.use('/images', express.static(path.join(__dirname, '..', 'frontend', 'images')));

// Routes
app.use('/api/products', productRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Seeding logic
const seedData = async (force = false) => {
    try {
        const count = await Product.countDocuments();
        if (count === 0 || force) {
            console.log('Syncing data from price_list_2026.json...');
            const filePath = path.join(__dirname, '..', 'frontend', 'price_list_2026.json');
            
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                
                if (force) {
                    await Product.deleteMany({});
                    console.log('Cleared existing products for refresh.');
                }

                // Map the JSON data to current model
                const formattedData = data.map(item => ({
                    s_no: item.s_no,
                    productId: item.productId,
                    category: item.category,
                    particulars: item.particulars,
                    specification: item.specification,
                    rate: item.rate,
                    image_path: item.image_path,
                    image_url: item.image_url,
                    image_status: item.image_status,
                    sku: item.sku || `SKU-${item.s_no}`,
                    unit: item.unit || 'pcs',
                    reorderLevel: item.reorderLevel || 10
                }));

                await Product.insertMany(formattedData);
                console.log(`Successfully synced ${formattedData.length} products!`);
            } else {
                console.warn('price_list_2026.json not found in frontend folder. Skipping sync.');
            }
        }
    } catch (error) {
        console.error('Sync error:', error.message);
    }
};

// You can set FORCE_SEED=true in .env to refresh on startup
seedData(process.env.FORCE_SEED === 'true');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
