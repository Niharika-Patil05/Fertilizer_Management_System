const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// @GET /api/products - Get all products
router.get('/', protect, async (req, res) => {
  try {
    const { category, search, status } = req.query;
    let query = { isActive: true };
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await Product.find(query).sort({ createdAt: -1 });

    // Apply virtual filters
    let result = products.map(p => p.toJSON());
    if (status === 'lowstock') result = result.filter(p => p.isLowStock);
    if (status === 'nearexpiry') result = result.filter(p => p.isNearExpiry);
    if (status === 'expired') result = result.filter(p => p.isExpired);
    if (status === 'deadstock') result = result.filter(p => p.isDeadStock);

    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/products/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/products
router.post('/', protect, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @PUT /api/products/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @DELETE /api/products/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/products/alerts/summary
router.get('/alerts/summary', protect, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    const all = products.map(p => p.toJSON());
    res.json({
      success: true,
      data: {
        lowStock: all.filter(p => p.isLowStock),
        nearExpiry: all.filter(p => p.isNearExpiry),
        expired: all.filter(p => p.isExpired),
        deadStock: all.filter(p => p.isDeadStock)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
