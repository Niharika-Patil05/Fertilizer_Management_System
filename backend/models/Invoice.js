const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String },
  purchasePrice: { type: Number },
  sellingPrice: { type: Number, required: true },
  totalAmount: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  items: [invoiceItemSchema],
  subtotal: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  discount: { type: Number, default: 0 }, // computed Rs. amount = subtotal * discountPercent / 100
  taxPercent: { type: Number, default: 0 },
  tax: { type: Number, default: 0 }, // computed Rs. amount = (subtotal - discount) * taxPercent / 100
  totalAmount: { type: Number, required: true },
  paymentType: { type: String, enum: ['cash', 'credit', 'partial'], default: 'cash' },
  amountPaid: { type: Number, default: 0 },
  amountDue: { type: Number, default: 0 },
  dueDate: { type: Date },
  paymentStatus: { type: String, enum: ['paid', 'pending', 'partial', 'overdue'], default: 'paid' },
  notes: { type: String }
}, { timestamps: true });

// Auto-generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  }
  this.amountDue = this.totalAmount - this.amountPaid;
  if (this.amountDue <= 0) this.paymentStatus = 'paid';
  else if (this.amountPaid === 0) this.paymentStatus = 'pending';
  else this.paymentStatus = 'partial';
  next();
});

// Virtual: profit calculation
invoiceSchema.virtual('profit').get(function() {
  return this.items.reduce((total, item) => {
    const profit = (item.sellingPrice - (item.purchasePrice || 0)) * item.quantity;
    return total + profit;
  }, 0) - this.discount;
});

invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
