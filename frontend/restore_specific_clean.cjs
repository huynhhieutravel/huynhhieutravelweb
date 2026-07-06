const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.startsWith('final_chunk_') && f.endsWith('.sql'));

let specificSlugs = [
  'fit-tour-website',
  'parallax-scrolling-effect-ha-long-bay-elementor',
  'quan-ly-ban-dai-viet',
  'fme-ecosystem-project',
  'about',
  'lien-he'
];

let elementorInserts = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  // Use regex to find INSERT OR IGNORE INTO Post (...) VALUES (...);
  // This avoids splitting by string which breaks if the string is inside the content
  const regex = /INSERT OR IGNORE INTO Post \([^)]+\) VALUES \(\d+, '[^']+', '([^']+)',/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const slug = match[1];
    if (specificSlugs.includes(slug)) {
      // Find the end of this statement.
      // It ends with ');\n'
      const startIdx = match.index;
      const endIdx = content.indexOf(');\n', startIdx);
      if (endIdx !== -1) {
        const fullStatement = content.substring(startIdx, endIdx + 2);
        const fixedStatement = fullStatement
          .replace('INSERT OR IGNORE INTO Post', 'INSERT OR IGNORE INTO Page')
          .replace('(id, title, slug, content, excerpt, featuredImage, type, createdAt, updatedAt)', 
                   '(id, title, slug, content, seoDescription, featuredImage, status, publishedAt, updatedAt)');
        elementorInserts.push(fixedStatement + ';');
      }
    }
  }
});

fs.writeFileSync(path.join(dir, 'restore_specific_clean.sql'), elementorInserts.join('\n'));
console.log(`Found ${elementorInserts.length} specific pages to restore.`);
try {
  execSync(`npx wrangler d1 execute huynhhieutravel-db --remote --file=restore_specific_clean.sql`, { stdio: 'inherit' });
} catch (e) {
  console.error(e);
}
