/**
 * 001 - Bootstrap the first admin user on an empty database.
 *
 * Idempotent & non-destructive: if ANY user already exists this migration does nothing,
 * so it can never overwrite a sponsor's real account or password. It only fills the gap
 * left by removing the destructive seed.js from the deployment path.
 *
 * Credentials come from the environment (see .env.example):
 *   ADMIN_EMAIL, ADMIN_PASSWORD, SHOP_NAME
 */
module.exports.up = async function up(mongoose) {
  const User = require('../models/User');

  const count = await User.countDocuments();
  if (count > 0) {
    console.log('  001: users already exist — nothing to do');
    return;
  }

  const email = (process.env.ADMIN_EMAIL || 'admin@shriramkrushi.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const shopName = process.env.SHOP_NAME || 'My Fertilizer Shop';

  // Use .create() so the User pre-save hook hashes the password.
  await User.create({ name: 'Administrator', email, password, shopName, role: 'admin' });
  console.log(`  001: created initial admin user "${email}" (change this password after first login)`);
};
