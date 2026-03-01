/**
 * update-passwords.js
 * Run this ONCE after importing the SQL to replace fake hashes with real bcrypt hashes.
 * Usage: node scripts/update-passwords.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const db     = require('../config/db');

const DEFAULT_PASSWORD = 'Password123!';

async function main() {
  console.log(`\n🔐 Updating all seed passwords to: "${DEFAULT_PASSWORD}"\n`);
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const [users] = await db.execute('SELECT UserId, UserEmail, password_hash FROM users');

  let updated = 0;
  for (const u of users) {
    const isReal = u.password_hash.startsWith('$2b$') && u.password_hash.length === 60;
    if (!isReal) {
      await db.execute('UPDATE users SET password_hash = ? WHERE UserId = ?', [hash, u.UserId]);
      console.log(`  ✅  ${u.UserEmail}`);
      updated++;
    } else {
      console.log(`  ⏭️  ${u.UserEmail} (already has real hash, skipped)`);
    }
  }

  console.log(`\nDone! Updated ${updated} accounts. All now use password: "${DEFAULT_PASSWORD}"\n`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
