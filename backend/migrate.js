/**
 * Minimal, tracked, idempotent migration runner for MongoDB / Mongoose.
 *
 *  - Every file in ./migrations named `NNN-description.js` exporting `async up(mongoose)`
 *    is a migration.
 *  - Applied migrations are recorded in the `_migrations` collection by filename.
 *  - Pending migrations run in filename order; each is recorded only after it succeeds.
 *  - Any failure aborts the process with a non-zero exit code, which (via the container
 *    command `node migrate.js && node server.js`) prevents the API from starting on a
 *    half-migrated database.
 *  - Migrations must be idempotent and must NEVER drop or blindly overwrite collections.
 *
 * Run manually:  npm run migrate
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fertilizer_mgmt';
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('migrate: connected to MongoDB');

  const Migration = mongoose.connection.collection('_migrations');
  const applied = new Set((await Migration.find({}).toArray()).map(d => d.name));

  const files = fs.existsSync(MIGRATIONS_DIR)
    ? fs.readdirSync(MIGRATIONS_DIR).filter(f => /^\d+.*\.js$/.test(f)).sort()
    : [];

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`migrate: skip   ${file} (already applied)`);
      continue;
    }
    console.log(`migrate: apply  ${file}`);
    const migration = require(path.join(MIGRATIONS_DIR, file));
    await migration.up(mongoose);
    await Migration.insertOne({ name: file, appliedAt: new Date() });
    ran++;
  }

  console.log(`migrate: done (${ran} applied, ${files.length - ran} already up to date)`);
  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('migrate: FAILED —', err);
    process.exit(1);
  });
