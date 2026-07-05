const fs = require('fs');
const path = require('path');

const downloads = JSON.parse(fs.readFileSync('downloads.json', 'utf-8'));
const filesToProcess = [
  'frontend/src/components/Header.astro',
  'frontend/src/components/Footer.astro',
  'frontend/src/components/HomeContent.astro',
  'frontend/src/components/Styles.astro'
];

const mediaDir = path.join(__dirname, 'frontend/public/media');
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
}

// match image urls with dimensions like -150x150
const dimRegex = /-\d+x\d+(\.[a-z]+)$/i;
const urlRegex = /https?:\/\/(media\.)?huynhhieutravel\.com\/(wp-content\/uploads\/\d{4}\/\d{2}\/)?([^"'\s\?]+\.(jpg|jpeg|png|webp|gif|svg))/gi;

async function processFiles() {
  let toDownload = new Map();

  for (const file of filesToProcess) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf-8');
    
    let match;
    while ((match = urlRegex.exec(content)) !== null) {
      const fullUrl = match[0];
      let filename = match[3].replace(/^\/+/, '');
      
      // If it's a thumbnail (e.g. -150x150.png), find the original filename
      let originalFilename = filename;
      if (dimRegex.test(filename)) {
        originalFilename = filename.replace(dimRegex, '$1');
      }
      
      let originalUrl = fullUrl;
      const downloadItem = downloads.find(d => d.filename === originalFilename);
      
      if (downloadItem) {
        originalUrl = downloadItem.url;
      } else if (fullUrl.includes('wp-content/uploads')) {
         // Keep fullUrl if it has wp-content since it works
      } else {
        originalUrl = `https://huynhhieutravel.com/wp-content/uploads/${originalFilename}`;
      }
      
      // Use original image instead of thumbnail
      toDownload.set(originalFilename, originalUrl);
      
      // Replace the full URL in HTML with the local /media/ path pointing to the original image!
      content = content.replace(fullUrl, `/media/${originalFilename}`);
    }
    
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }

  console.log(`Found ${toDownload.size} unique original images to download for Home.`);
  
  for (const [filename, originalUrl] of toDownload.entries()) {
    const dest = path.join(mediaDir, filename);
    if (!fs.existsSync(dest)) {
      console.log(`Downloading ${filename}...`);
      try {
        const res = await fetch(originalUrl);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          fs.writeFileSync(dest, Buffer.from(arrayBuffer));
        } else {
            console.error(`Failed to download ${originalUrl}: ${res.status}`);
        }
      } catch (e) {
        console.error(`Error downloading ${originalUrl}:`, e);
      }
    } else {
      console.log(`Exists: ${filename}`);
    }
  }
  
  console.log('Home media download and replace complete!');
}

processFiles();
