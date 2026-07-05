const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

// Replace these with actual Cloudflare R2 credentials later
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || 'dummy';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || 'dummy';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || 'dummy';
const BUCKET_NAME = 'huynhhieutravel-media';

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    }
});

function getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const map = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
        '.mp4': 'video/mp4', '.pdf': 'application/pdf'
    };
    return map[ext] || 'application/octet-stream';
}

async function fetchAndUpload(item) {
    try {
        console.log(`Downloading ${item.url}...`);
        const res = await fetch(item.url);
        if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
        
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log(`Uploading ${item.filename} to R2...`);
        await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: item.filename,
            Body: buffer,
            ContentType: getContentType(item.filename),
        }));
        
        return true;
    } catch (error) {
        console.error(`Failed to process ${item.filename}:`, error.message);
        return false;
    }
}

async function main() {
    const data = JSON.parse(fs.readFileSync('downloads.json', 'utf-8'));
    console.log(`Loaded ${data.length} items from downloads.json`);
    
    // We can run in batches to prevent memory/network issues
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(item => fetchAndUpload(item)));
        console.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(data.length / BATCH_SIZE)}`);
    }
    
    console.log("Upload complete!");
}

main();
