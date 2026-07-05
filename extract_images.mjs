import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto('https://huynhhieutravel.com/', { waitUntil: 'networkidle2' });
  
  const images = await page.evaluate(() => {
    const urls = new Set();
    
    // Get all img tags
    document.querySelectorAll('img').forEach(img => {
      if (img.src) urls.add(img.src);
    });
    
    // Get all elements with background-image
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const bg = window.getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none') {
        const match = bg.match(/url\(['"]?(.*?)['"]?\)/);
        if (match) urls.add(match[1]);
      }
    }
    
    return Array.from(urls);
  });
  
  console.log(images.join('\n'));
  await browser.close();
})();
