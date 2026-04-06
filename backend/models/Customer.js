const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  isOnTime: { type: Boolean, default: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  notes: { type: String }
});

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  address: { type: String },
  email: { type: String },
  aadharNo: { type: String },
  creditLimit: { type: Number, default: 10000 },
  outstandingBalance: { type: Number, default: 0 },
  totalPurchases: { type: Number, default: 0 },
  paymentHistory: [paymentHistorySchema],
  isActive: { type: Boolean, default: true },
  notes: { type: String }
}, { timestamps: true });

// Virtual: reliability score
customerSchema.virtual('reliabilityScore').get(function() {
  const history = this.paymentHistory;
  if (!history || history.length === 0) return 100;
  const onTimePayments = history.filter(p => p.isOnTime).length;
  return Math.round((onTimePayments / history.length) * 100);
});

// Virtual: credit status
customerSchema.virtual('creditStatus').get(function() {
  const score = this.reliabilityScore;
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
});

customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Customer', customerSchema);
