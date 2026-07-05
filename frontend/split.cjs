const fs = require('fs');

const data = fs.readFileSync('../seed.sql', 'utf8');
const stmts = data.split(/(?=\nINSERT OR IGNORE INTO)/g);

let currentChunk = '';
let chunkIndex = 1;

for (let i = 0; i < stmts.length; i++) {
  currentChunk += stmts[i];
  if (currentChunk.length > 800 * 1024 || i === stmts.length - 1) { // 800KB chunks
    fs.writeFileSync(`../seed_chunk_${chunkIndex}.sql`, currentChunk);
    console.log(`Wrote chunk ${chunkIndex} (${currentChunk.length} bytes)`);
    currentChunk = '';
    chunkIndex++;
  }
}
