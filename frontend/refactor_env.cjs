const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.astro')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
let updatedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace (locals as any).runtime?.env?. with env.
  if (content.includes('.runtime?.env?.')) {
    content = content.replace(/\(locals as any\)\.runtime\?\.env\?\./g, 'env.');
    content = content.replace(/\(Astro\.locals as any\)\.runtime\?\.env\?\./g, 'env.');
    changed = true;
  }
  
  if (content.includes('.runtime?.env;')) {
    content = content.replace(/\(locals as any\)\.runtime\?\.env/g, 'env');
    content = content.replace(/\(Astro\.locals as any\)\.runtime\?\.env/g, 'env');
    changed = true;
  }

  if (changed) {
    // Add import { env } from "cloudflare:workers";
    if (!content.includes('import { env } from "cloudflare:workers";')) {
      if (file.endsWith('.astro')) {
        // Insert right after ---
        content = content.replace(/^---/, '---\nimport { env } from "cloudflare:workers";');
      } else {
        // Insert at top of TS file
        content = 'import { env } from "cloudflare:workers";\n' + content;
      }
    }
    fs.writeFileSync(file, content, 'utf8');
    updatedFiles++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Updated ${updatedFiles} files.`);
