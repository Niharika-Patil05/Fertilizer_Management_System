/**
 * 002 - Backfill the `isActive` flag on legacy Product / Customer documents.
 *
 * Older records created before `isActive` was relied upon may not have the field.
 * This sets `isActive: true` ONLY where the field is missing. It never deletes,
 * never flips an existing value, and is safe to run repeatedly (idempotent).
 */
module.exports.up = async function up(mongoose) {
  const Product = require('../models/Product');
  const Customer = require('../models/Customer');

  const p = await Product.updateMany({ isActive: { $exists: false } }, { $set: { isActive: true } });
  const c = await Customer.updateMany({ isActive: { $exists: false } }, { $set: { isActive: true } });

  console.log(`  002: products backfilled=${p.modifiedCount}, customers backfilled=${c.modifiedCount}`);
};
