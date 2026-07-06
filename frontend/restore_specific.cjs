const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.startsWith('final_chunk_') && f.endsWith('.sql'));

let specificSlugs = [
  'about',
  'home',
  'lien-he',
  'fme-ecosystem-project',
  'fit-tour-website',
  'parallax-scrolling-effect-ha-long-bay-elementor',
  'quan-ly-ban-dai-viet',
  'tai-lieu-quan-ly-doanh-nghiep',
  'edit-ban-dai-viet'
];

let elementorInserts = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const parts = content.split('INSERT OR IGNORE INTO Post');
  
  for (let i = 1; i < parts.length; i++) {
    const rawStatement = parts[i].split(';\n')[0];
    
    // Check if the statement contains one of the specific slugs
    // It's safer to check if it contains the slug in quotes to avoid partial matches
    let found = false;
    for (const slug of specificSlugs) {
      if (rawStatement.includes(`'${slug}'`)) {
        found = true;
        break;
      }
    }
    
    if (found) {
        const statement = 'INSERT OR IGNORE INTO Page' + rawStatement + ';';
        let fixedStatement = statement
          .replace('(id, title, slug, content, excerpt, featuredImage, type, createdAt, updatedAt)', 
                   '(id, title, slug, content, seoDescription, featuredImage, status, publishedAt, updatedAt)');
        
        elementorInserts.push(fixedStatement);
    }
  }
});

fs.writeFileSync(path.join(dir, 'restore_specific.sql'), elementorInserts.join('\n'));
console.log(`Found ${elementorInserts.length} specific pages to restore.`);
try {
  execSync(`npx wrangler d1 execute huynhhieutravel-db --remote --file=restore_specific.sql`, { stdio: 'inherit' });
} catch (e) {
  console.error(e);
}
