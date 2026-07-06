const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.startsWith('final_chunk_') && f.endsWith('.sql'));

let elementorInserts = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const parts = content.split('INSERT OR IGNORE INTO Post');
  
  for (let i = 1; i < parts.length; i++) {
    const statement = 'INSERT OR IGNORE INTO Page' + parts[i].split(';\n')[0] + ';';
    if (statement.includes('fit-tour-website') || 
        statement.includes('parallax-scrolling-effect-ha-long-bay-elementor') ||
        statement.includes('fme-ecosystem-project') ||
        statement.includes('quan-ly-ban-dai-viet') ||
        statement.includes('bay-tu-tin')) {
        
        let fixedStatement = statement
          .replace('(id, title, slug, content, excerpt, featuredImage, type, createdAt, updatedAt)', 
                   '(id, title, slug, content, seoDescription, featuredImage, status, publishedAt, updatedAt)');
        
        elementorInserts.push(fixedStatement);
    }
  }
});

fs.writeFileSync(path.join(dir, 'restore_elementor.sql'), elementorInserts.join('\n'));
console.log(`Found ${elementorInserts.length} elementor posts to restore.`);
try {
  execSync(`npx wrangler d1 execute huynhhieutravel-db --remote --file=restore_elementor.sql`, { stdio: 'inherit' });
} catch (e) {
  console.error(e);
}
