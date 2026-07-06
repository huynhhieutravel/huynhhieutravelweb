const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.startsWith('final_chunk_') && f.endsWith('.sql'));

let specificSlugs = [
  'fit-tour-website',
  'parallax-scrolling-effect-ha-long-bay-elementor',
  'quan-ly-ban-dai-viet',
  'bay-tu-tin'
];

let elementorInserts = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const parts = content.split('INSERT OR IGNORE INTO Post');
  
  for (let i = 1; i < parts.length; i++) {
    const rawStatement = parts[i].split(';\n')[0];
    
    let found = false;
    for (const slug of specificSlugs) {
      if (rawStatement.includes(`'${slug}'`)) {
        found = true;
        break;
      }
    }
    
    if (found) {
        // Keep it as INSERT INTO Post!
        const statement = 'INSERT OR IGNORE INTO Post' + rawStatement + ';';
        elementorInserts.push(statement);
    }
  }
});

fs.writeFileSync(path.join(dir, 'restore_specific_posts.sql'), elementorInserts.join('\n'));
console.log(`Found ${elementorInserts.length} specific posts to restore.`);
try {
  execSync(`npx wrangler d1 execute huynhhieutravel-db --remote --file=restore_specific_posts.sql`, { stdio: 'inherit' });
} catch (e) {
  console.error(e);
}
