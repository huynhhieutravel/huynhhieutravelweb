const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mediaDir = path.join(__dirname, 'public', 'media');
const files = fs.readdirSync(mediaDir).filter(f => {
  const ext = path.extname(f).toLowerCase();
  return ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp' || ext === '.gif' || ext === '.svg';
});

console.log(`Found ${files.length} valid images.`);

if (files.length === 0) {
  console.log('No valid images to keep.');
  process.exit(1);
}

// Construct the SQL query
// DELETE FROM Media WHERE url NOT LIKE '%file1%' AND url NOT LIKE '%file2%' ...
const conditions = files.map(f => `url NOT LIKE '%${f.replace(/'/g, "''")}%'`).join(' AND ');
const sql = `DELETE FROM Media WHERE ${conditions};`;

fs.writeFileSync('cleanup.sql', sql);
console.log('Generated cleanup.sql');

try {
  console.log('Executing on remote D1...');
  const output = execSync(`npx wrangler d1 execute huynhhieutravel-db --remote --file=cleanup.sql`, { encoding: 'utf8' });
  console.log(output);
  console.log('Cleanup successful!');
} catch (e) {
  console.error('Error executing cleanup:', e.stdout || e.message);
}
