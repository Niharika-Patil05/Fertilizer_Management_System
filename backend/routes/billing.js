const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');

// @GET /api/billing - Get all invoices
router.get('/', protect, async (req, res) => {
  try {
    const { status, paymentType, startDate, endDate, search } = req.query;
    let query = {};
    if (status) query.paymentStatus = status;
    if (paymentType) query.paymentType = paymentType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59');
    }
    if (search) query.customerName = { $regex: search, $options: 'i' };

    const invoices = await Invoice.find(query).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/billing/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('customer');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/billing - Create new invoice
router.post('/', protect, async (req, res) => {
  try {
    const { customerId, customerName, customerPhone, items, discount, tax, paymentType, amountPaid, dueDate, notes } = req.body;

    // Validate and update stock
    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}` });
      }

      enrichedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        unit: product.unit,
        purchasePrice: product.purchasePrice,
        sellingPrice: item.sellingPrice || product.sellingPrice,
        totalAmount: (item.sellingPrice || product.sellingPrice) * item.quantity
      });

      // Deduct stock
      product.stockQuantity -= item.quantity;
      product.totalSold += item.quantity;
      product.lastSaleDate = new Date();
      await product.save();
    }

    const subtotal = enrichedItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalAmount = subtotal - (discount || 0) + (tax || 0);

    const invoiceData = {
      customerName,
      customerPhone,
      items: enrichedItems,
      subtotal,
      discount: discount || 0,
      tax: tax || 0,
      totalAmount,
      paymentType: paymentType || 'cash',
      amountPaid: paymentType === 'cash' ? totalAmount : (amountPaid || 0),
      dueDate,
      notes
    };

    if (customerId) {
      invoiceData.customer = customerId;
      // Update customer balance if credit
      if (paymentType === 'credit' || paymentType === 'partial') {
        const customer = await Customer.findById(customerId);
        if (customer) {
          const due = totalAmount - (amountPaid || 0);
          customer.outstandingBalance += due;
          customer.totalPurchases += totalAmount;
          await customer.save();
        }
      }
    }

    const invoice = await Invoice.create(invoiceData);
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @PUT /api/billing/:id/payment - Record a payment
router.put('/:id/payment', protect, async (req, res) => {
  try {
    const { amount, isOnTime } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    invoice.amountPaid += Number(amount);
    if (invoice.amountPaid >= invoice.totalAmount) {
      invoice.amountPaid = invoice.totalAmount;
      invoice.paymentStatus = 'paid';
    } else {
      invoice.paymentStatus = 'partial';
    }
    invoice.amountDue = invoice.totalAmount - invoice.amountPaid;
    await invoice.save();

    // Update customer
    if (invoice.customer) {
      const customer = await Customer.findById(invoice.customer);
      if (customer) {
        customer.outstandingBalance = Math.max(0, customer.outstandingBalance - Number(amount));
        customer.paymentHistory.push({
          amount: Number(amount),
          paymentDate: new Date(),
          dueDate: invoice.dueDate,
          isOnTime: isOnTime !== undefined ? isOnTime : true,
          invoiceId: invoice._id
        });
        await customer.save();
      }
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
