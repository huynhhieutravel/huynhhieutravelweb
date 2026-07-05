const fs = require('fs');

const html = fs.readFileSync('frontend/src/components/HomeContent_Old.html', 'utf-8');

// Basic extraction of headings, paragraphs, and images
const headings = html.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/g) || [];
const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/g) || [];
const images = html.match(/<img[^>]+src="([^">]+)"/g) || [];
const links = html.match(/<a[^>]+href="([^">]+)"[^>]*>([\s\S]*?)<\/a>/g) || [];

console.log("=== HEADINGS ===");
headings.forEach(h => console.log(h.replace(/<[^>]+>/g, '').trim()));

console.log("\n=== PARAGRAPHS ===");
paragraphs.forEach(p => console.log(p.replace(/<[^>]+>/g, '').trim()));

console.log("\n=== IMAGES ===");
images.forEach(i => {
  const match = i.match(/src="([^">]+)"/);
  if (match) console.log(match[1]);
});

console.log("\n=== LINKS ===");
links.forEach(l => {
  const hrefMatch = l.match(/href="([^">]+)"/);
  const textMatch = l.replace(/<[^>]+>/g, '').trim();
  if (hrefMatch) console.log(`${textMatch} -> ${hrefMatch[1]}`);
});
