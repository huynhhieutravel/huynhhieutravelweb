import fs from 'fs';
import path from 'path';

const files = [
  'src/pages/api/admin/links.ts',
  'src/pages/api/admin/media.ts',
  'src/pages/api/admin/pages.ts',
  'src/pages/api/admin/posts.ts',
  'src/pages/api/admin/upload.ts'
];

files.forEach(file => {
  const fullPath = path.resolve(file);
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  // Remove import
  content = content.replace(/import \{ env \} from 'cloudflare:workers';\n/g, '');
  
  // Add locals to destructured args
  content = content.replace(/async \(\{\s*request\s*\}\) =>/g, 'async ({ request, locals }) =>');
  content = content.replace(/async \(\{\s*url\s*\}\) =>/g, 'async ({ url, locals }) =>');
  content = content.replace(/async \(\{\s*request,\s*url\s*\}\) =>/g, 'async ({ request, url, locals }) =>');
  
  // Replace env.DB
  content = content.replace(/\(env as any\)\?\.DB/g, '(locals as any).runtime?.env?.DB');
  
  // Replace env.KV (in links.ts)
  content = content.replace(/\(env as any\)\?\.KV/g, '(locals as any).runtime?.env?.KV');
  
  fs.writeFileSync(fullPath, content);
  console.log('Fixed', file);
});
