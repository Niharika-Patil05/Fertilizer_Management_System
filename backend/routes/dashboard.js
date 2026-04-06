const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');

// @GET /api/dashboard/overview
router.get('/overview', protect, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Today's sales
    const todayInvoices = await Invoice.find({ createdAt: { $gte: startOfDay } });
    const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const todayProfit = todayInvoices.reduce((sum, inv) => sum + (inv.profit || 0), 0);

    // Monthly sales
    const monthInvoices = await Invoice.find({ createdAt: { $gte: startOfMonth } });
    const monthlySales = monthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const monthlyProfit = monthInvoices.reduce((sum, inv) => sum + (inv.profit || 0), 0);

    // Yearly sales
    const yearInvoices = await Invoice.find({ createdAt: { $gte: startOfYear } });
    const yearlySales = yearInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Inventory stats
    const products = await Product.find({ isActive: true });
    const allProducts = products.map(p => p.toJSON());

    // Customers
    const customers = await Customer.find({ isActive: true });
    const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

    // Pending invoices
    const pendingInvoices = await Invoice.find({ paymentStatus: { $in: ['pending', 'partial'] } });
    const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);

    res.json({
      success: true,
      data: {
        sales: {
          today: Math.round(todaySales),
          monthly: Math.round(monthlySales),
          yearly: Math.round(yearlySales)
        },
        profit: {
          today: Math.round(todayProfit),
          monthly: Math.round(monthlyProfit)
        },
        inventory: {
          totalProducts: allProducts.length,
          lowStock: allProducts.filter(p => p.isLowStock).length,
          nearExpiry: allProducts.filter(p => p.isNearExpiry).length,
          expired: allProducts.filter(p => p.isExpired).length,
          deadStock: allProducts.filter(p => p.isDeadStock).length
        },
        credit: {
          totalCustomers: customers.length,
          totalOutstanding: Math.round(totalOutstanding),
          totalPending: Math.round(totalPending),
          pendingCount: pendingInvoices.length
        },
        recentInvoices: await Invoice.find().sort({ createdAt: -1 }).limit(5)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/dashboard/sales-chart - Monthly sales for last 6 months
router.get('/sales-chart', protect, async (req, res) => {
  try {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const invoices = await Invoice.find({ createdAt: { $gte: start, $lte: end } });
      const sales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const profit = invoices.reduce((sum, inv) => sum + (inv.profit || 0), 0);

      months.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        sales: Math.round(sales),
        profit: Math.round(profit),
        orders: invoices.length
      });
    }
    res.json({ success: true, data: months });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/dashboard/top-products
router.get('/top-products', protect, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, totalSold: { $gt: 0 } })
      .sort({ totalSold: -1 }).limit(10);
    res.json({ success: true, data: products.map(p => p.toJSON()) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
