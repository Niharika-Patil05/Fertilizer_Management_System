const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
dotenv.config();

const User = require('./models/User');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Invoice = require('./models/Invoice');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fertilizer_mgmt';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing
    await User.deleteMany();
    await Product.deleteMany();
    await Customer.deleteMany();
    await Invoice.deleteMany();

    // Create admin user
    const user = await User.create({
      name: 'Pavan Khandekar',
      email: 'admin@shriramkrushi.com',
      password: 'admin123',
      shopName: 'Shriram Krushi Kendra'
    });
    console.log('✅ Admin user created: admin@shriramkrushi.com / admin123');

    // Create products
    const products = await Product.create([
      {
        name: 'Urea (46% N)', category: 'Fertilizer', brand: 'IFFCO',
        unit: 'kg', purchasePrice: 250, sellingPrice: 290, stockQuantity: 500,
        minimumStock: 50, expiryDate: new Date('2026-12-31'),
        supplier: { name: 'IFFCO Dealer', contact: '9876543210' },
        lastSaleDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), totalSold: 120
      },
      {
        name: 'DAP (Diammonium Phosphate)', category: 'Fertilizer', brand: 'Zuari',
        unit: 'kg', purchasePrice: 1350, sellingPrice: 1400, stockQuantity: 8,
        minimumStock: 25, expiryDate: new Date('2026-08-15'),
        supplier: { name: 'Zuari Agro', contact: '9876543211' },
        lastSaleDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), totalSold: 85
      },
      {
        name: 'MOP (Muriate of Potash)', category: 'Fertilizer', brand: 'ICL',
        unit: 'kg', purchasePrice: 850, sellingPrice: 920, stockQuantity: 200,
        minimumStock: 30, expiryDate: new Date('2027-03-31'),
        lastSaleDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), totalSold: 60
      },
      {
        name: 'NPK 19:19:19', category: 'Fertilizer', brand: 'Coromandel',
        unit: 'kg', purchasePrice: 1100, sellingPrice: 1200, stockQuantity: 150,
        minimumStock: 20, expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // Near expiry!
        lastSaleDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), totalSold: 45
      },
      {
        name: 'Chlorpyrifos 20% EC', category: 'Pesticide', brand: 'Dhanuka',
        unit: 'litre', purchasePrice: 320, sellingPrice: 380, stockQuantity: 50,
        minimumStock: 10, expiryDate: new Date('2025-06-30'), // Expired!
        lastSaleDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), totalSold: 30
      },
      {
        name: 'Hybrid Tomato Seeds', category: 'Seeds', brand: 'Seminis',
        unit: 'packet', purchasePrice: 180, sellingPrice: 220, stockQuantity: 75,
        minimumStock: 15, expiryDate: new Date('2026-09-30'),
        lastSaleDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), totalSold: 200
      },
      {
        name: 'Zinc Sulphate 21%', category: 'Fertilizer', brand: 'IFFCO',
        unit: 'kg', purchasePrice: 70, sellingPrice: 90, stockQuantity: 5,
        minimumStock: 20, expiryDate: new Date('2027-01-31'),
        lastSaleDate: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000), totalSold: 15 // Dead stock!
      },
      {
        name: 'Glyphosate 41% SL', category: 'Pesticide', brand: 'Bayer',
        unit: 'litre', purchasePrice: 280, sellingPrice: 330, stockQuantity: 30,
        minimumStock: 10, expiryDate: new Date('2026-11-30'),
        lastSaleDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), totalSold: 55
      }
    ]);
    console.log(`✅ ${products.length} products created`);

    // Create customers
    const customers = await Customer.create([
      {
        name: 'Ramesh Patil', phone: '9876500001', address: 'Ashta, Sangli',
        creditLimit: 50000, outstandingBalance: 12500, totalPurchases: 45000,
        paymentHistory: [
          { amount: 5000, isOnTime: true, paymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          { amount: 8000, isOnTime: false, paymentDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
          { amount: 10000, isOnTime: true, paymentDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        ]
      },
      {
        name: 'Sunita Deshmukh', phone: '9876500002', address: 'Walwa, Sangli',
        creditLimit: 30000, outstandingBalance: 0, totalPurchases: 28000,
        paymentHistory: [
          { amount: 7000, isOnTime: true, paymentDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
          { amount: 5000, isOnTime: true, paymentDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) }
        ]
      },
      {
        name: 'Vijay Shinde', phone: '9876500003', address: 'Miraj, Sangli',
        creditLimit: 20000, outstandingBalance: 8750, totalPurchases: 32000,
        paymentHistory: [
          { amount: 3000, isOnTime: false, paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
          { amount: 5000, isOnTime: false, paymentDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) }
        ]
      }
    ]);
    console.log(`✅ ${customers.length} customers created`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('🔑 Login: admin@shriramkrushi.com | Password: admin123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedData();
