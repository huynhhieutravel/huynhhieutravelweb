const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

async function extract() {
    console.log("Fetching live site...");
    const res = await fetch('https://huynhhieutravel.com');
    const html = await res.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // 1. Extract CSS Links
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    let cssString = '';
    links.forEach(l => cssString += l.outerHTML + '\n');
    
    // 2. Extract Scripts
    const scripts = document.querySelectorAll('script[src*="wp-content"], script[src*="wp-includes"]');
    let jsString = '';
    scripts.forEach(s => jsString += s.outerHTML + '\n');
    
    // 3. Extract Header
    let header = document.querySelector('[data-elementor-type="header"]');
    if (!header) header = document.querySelector('header');
    const headerHtml = header ? header.outerHTML : '';

    // 4. Extract Footer
    let footer = document.querySelector('[data-elementor-type="footer"]');
    if (!footer) footer = document.querySelector('footer');
    const footerHtml = footer ? footer.outerHTML : '';

    fs.writeFileSync('extracted_css.html', cssString);
    fs.writeFileSync('extracted_js.html', jsString);
    fs.writeFileSync('extracted_header.html', headerHtml);
    fs.writeFileSync('extracted_footer.html', footerHtml);

    console.log("Extraction complete!");
}
extract();
