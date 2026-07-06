const crypto = require('crypto');
const { execSync } = require('child_process');

const password = 'admin';
const salt = 'huynhhieu_salt_';
const hash = crypto.createHash('sha256').update(salt + password).digest('hex');

const email = 'admin@huynhhieutravel.com';
const id = crypto.randomUUID();

const sql = `INSERT INTO User (id, email, passwordHash, name, displayName) VALUES ('${id}', '${email}', '${hash}', 'Admin', 'Administrator');`;

console.log("SQL:", sql);

try {
  execSync(`npx wrangler d1 execute huynhhieutravel-db --remote --command="${sql}"`, { stdio: 'inherit' });
  console.log("Admin user created successfully.");
} catch (e) {
  console.error("Error creating admin user:", e.message);
}
