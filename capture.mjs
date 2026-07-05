import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('https://huynhhieutravel.com/', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/Users/tronghieuhuynh/.gemini/antigravity-ide/brain/601aa7e3-e93e-46d1-9c9d-120972a6ff5d/original_site_full.png', fullPage: true });
  await browser.close();
})();
