const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['Fertilizer', 'Pesticide', 'Seeds', 'Other'],
    default: 'Fertilizer'
  },
  brand: { type: String, trim: true },
  sku: { type: String, unique: true, sparse: true },
  unit: { type: String, enum: ['kg', 'g', 'litre', 'ml', 'bag', 'packet', 'piece'], default: 'kg' },
  purchasePrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  stockQuantity: { type: Number, required: true, default: 0, min: 0 },
  minimumStock: { type: Number, default: 10 },
  expiryDate: { type: Date },
  manufacturingDate: { type: Date },
  supplier: {
    name: { type: String },
    contact: { type: String },
    address: { type: String }
  },
  lastSaleDate: { type: Date },
  totalSold: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  description: { type: String }
}, { timestamps: true });

// Virtual: days until expiry
productSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const diff = Math.floor((this.expiryDate - today) / (1000 * 60 * 60 * 24));
  return diff;
});

// Virtual: is near expiry (within 30 days)
productSchema.virtual('isNearExpiry').get(function() {
  const days = this.daysUntilExpiry;
  return days !== null && days <= 30 && days >= 0;
});

// Virtual: is expired
productSchema.virtual('isExpired').get(function() {
  const days = this.daysUntilExpiry;
  return days !== null && days < 0;
});

// Virtual: is dead stock (no sales for 90 days)
productSchema.virtual('isDeadStock').get(function() {
  if (!this.lastSaleDate && this.createdAt) {
    const daysSinceCreation = Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
    return daysSinceCreation > 90;
  }
  if (!this.lastSaleDate) return false;
  const daysSinceLastSale = Math.floor((new Date() - this.lastSaleDate) / (1000 * 60 * 60 * 24));
  return daysSinceLastSale > 90;
});

// Virtual: is low stock
productSchema.virtual('isLowStock').get(function() {
  return this.stockQuantity <= this.minimumStock;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
