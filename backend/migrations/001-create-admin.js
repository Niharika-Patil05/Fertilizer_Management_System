/**
 * 001 - Formerly bootstrapped a default admin user with ADMIN_EMAIL/ADMIN_PASSWORD
 * from .env. That account was never real — it's now a no-op.
 *
 * The system instead prompts for first-run setup in the browser: when the
 * database has zero users, the login screen offers "Create Your Account" so
 * the sponsor picks their own email and password directly. See
 * POST /api/auth/register and GET /api/auth/setup-status.
 *
 * Kept as a no-op (rather than deleted) so its filename stays recorded in the
 * `_migrations` collection and the migration numbering doesn't shift.
 */
module.exports.up = async function up() {
  console.log('  001: no-op (default admin bootstrap removed — sponsor now self-registers on first run)');
};
