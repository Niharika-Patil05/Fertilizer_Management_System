const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// @POST /api/inventory/restock - Add stock to a product
router.post('/restock', protect, async (req, res) => {
  try {
    const { productId, quantity, purchasePrice } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.stockQuantity += Number(quantity);
    if (purchasePrice) product.purchasePrice = purchasePrice;
    await product.save();

    res.json({ success: true, message: 'Stock updated successfully', data: product.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/inventory/stats - Overall inventory statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    const all = products.map(p => p.toJSON());

    const totalProducts = all.length;
    const totalStockValue = all.reduce((sum, p) => sum + (p.stockQuantity * p.purchasePrice), 0);
    const totalSellingValue = all.reduce((sum, p) => sum + (p.stockQuantity * p.sellingPrice), 0);
    const lowStockCount = all.filter(p => p.isLowStock).length;
    const nearExpiryCount = all.filter(p => p.isNearExpiry).length;
    const expiredCount = all.filter(p => p.isExpired).length;
    const deadStockCount = all.filter(p => p.isDeadStock).length;

    res.json({
      success: true,
      data: {
        totalProducts,
        totalStockValue: Math.round(totalStockValue),
        totalSellingValue: Math.round(totalSellingValue),
        potentialProfit: Math.round(totalSellingValue - totalStockValue),
        alerts: { lowStockCount, nearExpiryCount, expiredCount, deadStockCount }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
