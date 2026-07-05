const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const bucketName = 'huynhhieutravel-media';
const mediaDir = path.join(__dirname, 'public', 'media');

const files = fs.readdirSync(mediaDir).filter(f => {
  const ext = path.extname(f).toLowerCase();
  return ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp' || ext === '.gif' || ext === '.svg';
});

console.log(`Found ${files.length} images to upload.`);

let activeCount = 0;
let currentIndex = 0;
const MAX_CONCURRENT = 5; // Reduced concurrency to prevent 500 errors
let successCount = 0;
let failCount = 0;

function uploadFile(file, retries = 3) {
  const filePath = path.join(mediaDir, file);
  const cmd = `npx wrangler r2 object put ${bucketName}/"${file}" -f "${filePath}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      if (retries > 0) {
        console.log(`Retrying ${file}... (${retries} left)`);
        setTimeout(() => uploadFile(file, retries - 1), 1000);
      } else {
        console.error(`Failed to upload ${file} permanently.`);
        failCount++;
        activeCount--;
        uploadNext();
      }
    } else {
      console.log(`Uploaded ${file}`);
      successCount++;
      activeCount--;
      uploadNext();
    }
  });
}

function uploadNext() {
  if (currentIndex >= files.length) {
    if (activeCount === 0) {
      console.log(`Finished! Success: ${successCount}, Fail: ${failCount}`);
    }
    return;
  }

  const file = files[currentIndex++];
  activeCount++;
  uploadFile(file);
}

for (let i = 0; i < MAX_CONCURRENT && i < files.length; i++) {
  uploadNext();
}
