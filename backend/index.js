const express = require('express');
const dns = require('dns');

// Force public DNS to resolve MongoDB SRV records
dns.setServers(['8.8.8.8', '1.1.1.1']);

const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const routes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const godownRoutes = require('./routes/godownRoutes')
const orderRoutes = require('./routes/orderRoutes')
const deliveryRoutes = require('./routes/deliveryRoutes')
const reportRoutes = require('./routes/reportRoutes')
const Product = require('./models/Product');
const fs = require('fs');
const path = require('path');
const User = require('./models/User')
const bcrypt = require('bcryptjs')

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
app.use('/workflow360/api/products', routes);
app.use('/workflow360/api/auth', authRoutes)
app.use('/workflow360/api/users', userRoutes)
app.use('/workflow360/api/godowns', godownRoutes)
app.use('/workflow360/api/orders', orderRoutes)
app.use('/workflow360/api/deliveries', deliveryRoutes)
app.use('/workflow360/api/reports', reportRoutes)

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

const ensureSeedAdmin = async () => {
  try {
    if (process.env.SEED_ADMIN_ON_START !== 'true') return
    const email = (process.env.SEED_ADMIN_EMAIL || 'admin@godown.local').toLowerCase().trim()
    const password = process.env.SEED_ADMIN_PASSWORD || 'admin123'
    const exists = await User.findOne({ email }).lean()
    if (exists) return
    const saltRounds = Number(process.env.BCRYPT_ROUNDS || 10)
    const passwordHash = await bcrypt.hash(password, saltRounds)
    await User.create({ email, passwordHash, role: 'ADMIN', active: true })
    console.log(`Seeded admin user: ${email}`)
  } catch (err) {
    console.error('Admin seed error:', err.message)
  }
}

ensureSeedAdmin()

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
