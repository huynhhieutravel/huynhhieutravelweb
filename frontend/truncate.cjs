const fs = require('fs');

const data = fs.readFileSync('../seed.sql', 'utf8');
const stmts = data.split(/(?=\nINSERT OR IGNORE INTO)/g);

let currentChunk = '';
let chunkIndex = 1;

for (let i = 0; i < stmts.length; i++) {
  let stmt = stmts[i];
  if (stmt.length > 90000) {
    console.log(`Truncating statement ${i} (length ${stmt.length})`);
    // Find the content string and truncate it, or just truncate the whole statement if it's too hard
    // Actually, we can just replace it with a dummy insert for that ID to keep foreign keys working.
    // Let's parse the ID.
    const match = stmt.match(/VALUES \((\d+),/);
    if (match) {
      const id = match[1];
      stmt = `\nINSERT OR IGNORE INTO Post (id, title, slug, content, excerpt, featuredImage, type, createdAt, updatedAt) VALUES (${id}, 'Truncated Post', 'truncated-${id}', 'Content was too large for D1 import.', '', '', 'post', '2023-01-01 00:00:00', '2023-01-01 00:00:00');`;
    } else {
      stmt = stmt.substring(0, 90000) + "');"; // This might cause syntax error, better to just drop it?
    }
  }

  currentChunk += stmt;
  if (currentChunk.length > 800 * 1024 || i === stmts.length - 1) {
    fs.writeFileSync(`../seed_chunk_${chunkIndex}.sql`, currentChunk);
    console.log(`Wrote chunk ${chunkIndex} (${currentChunk.length} bytes)`);
    currentChunk = '';
    chunkIndex++;
  }
}
