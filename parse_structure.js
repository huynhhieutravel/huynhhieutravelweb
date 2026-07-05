const fs = require('fs');

const html = fs.readFileSync('frontend/src/components/HomeContent_Old.html', 'utf-8');

// Use a simple regex approach to find sections and their contents
let sections = html.split('data-element_type="section"');
// Note: Elementor uses 'data-element_type="container"' for flexbox layouts in modern versions
if (sections.length <= 1) {
    sections = html.split('data-element_type="container"');
}

console.log(`Found ${sections.length} main containers/sections.`);

sections.forEach((sec, i) => {
    if (i === 0) return; // skip the prefix before the first section
    
    console.log(`\n--- SECTION ${i} ---`);
    
    // Extract text nodes inside heading/paragraphs
    const texts = sec.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>|<p[^>]*>([\s\S]*?)<\/p>|<span[^>]*class="elementor-icon-list-text"[^>]*>([\s\S]*?)<\/span>/g);
    if (texts) {
        texts.forEach(t => console.log('TEXT:', t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()));
    }
    
    // Extract images
    const images = sec.match(/<img[^>]+src="([^">]+)"/g);
    if (images) {
        images.forEach(img => {
            const m = img.match(/src="([^">]+)"/);
            if (m) console.log('IMAGE:', m[1]);
        });
    }
    
    // Extract links (excluding image wrapping links)
    const links = sec.match(/<a[^>]+href="([^">]+)"[^>]*>([\s\S]*?)<\/a>/g);
    if (links) {
        links.forEach(l => {
            const text = l.replace(/<[^>]+>/g, '').trim();
            if (text) {
                const m = l.match(/href="([^">]+)"/);
                if (m) console.log('LINK:', text, '->', m[1]);
            }
        });
    }
});
