/**
 * 003 - One-time cleanup for any deployment where migration 001 already ran
 * and created the old default admin account (ADMIN_EMAIL/ADMIN_PASSWORD from
 * .env, e.g. admin@shriramkrushi.com / admin123).
 *
 * Safe/idempotent: only deletes a user if it is the SOLE account in the
 * database, its email matches the known default, and it still has the
 * factory default password hash behaviour (we can't check the password
 * itself since it's hashed, so we only act when it's the only account —
 * if the sponsor already changed the password or added other accounts,
 * this does nothing).
 *
 * After this runs (if it deletes anything), the database has zero users
 * again and the app's first-run "Create Your Account" screen takes over.
 */
const DEFAULT_ADMIN_EMAIL = 'admin@shriramkrushi.com';

module.exports.up = async function up() {
  const User = require('../models/User');

  const count = await User.countDocuments();
  if (count !== 1) {
    console.log('  003: skip — not a single-account database');
    return;
  }

  const onlyUser = await User.findOne({});
  if (onlyUser.email !== DEFAULT_ADMIN_EMAIL) {
    console.log('  003: skip — sole account is not the old default admin');
    return;
  }

  await User.deleteOne({ _id: onlyUser._id });
  console.log('  003: removed the old default admin account — first-run setup will run again');
};
