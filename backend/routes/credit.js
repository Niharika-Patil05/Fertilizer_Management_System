const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const { protect } = require('../middleware/auth');

// @GET /api/credit/customers
router.get('/customers', protect, async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = { isActive: true };
    if (search) query.name = { $regex: search, $options: 'i' };

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    let result = customers.map(c => c.toJSON());
    if (status === 'outstanding') result = result.filter(c => c.outstandingBalance > 0);

    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/credit/customers/:id
router.get('/customers/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const invoices = await Invoice.find({ customer: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { ...customer.toJSON(), invoices } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/credit/customers
router.post('/customers', protect, async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @PUT /api/credit/customers/:id
router.put('/customers/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @GET /api/credit/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const customers = await Customer.find({ isActive: true });
    const all = customers.map(c => c.toJSON());
    const totalOutstanding = all.reduce((sum, c) => sum + c.outstandingBalance, 0);
    const totalCustomers = all.length;
    const customersWithDues = all.filter(c => c.outstandingBalance > 0).length;

    res.json({
      success: true,
      data: {
        totalCustomers,
        customersWithDues,
        totalOutstanding: Math.round(totalOutstanding),
        topDefaulters: all.filter(c => c.outstandingBalance > 0)
          .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
          .slice(0, 5),
        reliabilityBreakdown: {
          excellent: all.filter(c => c.reliabilityScore >= 80).length,
          good: all.filter(c => c.reliabilityScore >= 60 && c.reliabilityScore < 80).length,
          fair: all.filter(c => c.reliabilityScore >= 40 && c.reliabilityScore < 60).length,
          poor: all.filter(c => c.reliabilityScore < 40).length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
