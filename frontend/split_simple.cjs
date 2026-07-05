const fs = require('fs');

const data = fs.readFileSync('../seed.sql', 'utf8');

// Split by \nINSERT OR IGNORE INTO
// We add it back to each statement
const parts = data.split('\nINSERT OR IGNORE INTO ');

let chunks = [];
let currentChunk = '';
let currentSize = 0;
const MAX_CHUNK_SIZE = 80 * 1024; // 80KB

// First part might contain comments
let firstPart = parts[0];
currentChunk = firstPart;
currentSize = Buffer.byteLength(firstPart, 'utf8');

for (let i = 1; i < parts.length; i++) {
  let stmt = 'INSERT OR IGNORE INTO ' + parts[i];
  
  // Truncate if statement is too large (e.g. > 50KB)
  if (Buffer.byteLength(stmt, 'utf8') > 50000) {
    console.log(`Truncating massive statement of size ${Buffer.byteLength(stmt, 'utf8')}`);
    // Extract everything up to VALUES (
    const valuesMatch = stmt.match(/VALUES \((.*?)(, ')/);
    if (valuesMatch) {
       // Just blindly cut it to prevent issues, this is for extreme Elementor posts
       stmt = stmt.substring(0, 5000) + " (TRUNCATED)', 'post', '2023-01-01 00:00:00', '2023-01-01 00:00:00');\n";
    }
  }

  let stmtSize = Buffer.byteLength(stmt, 'utf8');
  
  if (currentSize + stmtSize > MAX_CHUNK_SIZE && currentSize > 0) {
    chunks.push(currentChunk);
    currentChunk = stmt;
    currentSize = stmtSize;
  } else {
    // Add a newline if it doesn't have one (though it should)
    if (!currentChunk.endsWith('\n')) currentChunk += '\n';
    currentChunk += stmt;
    currentSize += stmtSize;
  }
}

if (currentChunk.trim().length > 0) {
  chunks.push(currentChunk);
}

// Clean up old chunks
const files = fs.readdirSync('.');
for (const file of files) {
  if (file.startsWith('final_chunk_')) {
    fs.unlinkSync(file);
  }
}

// Write new chunks
for (let i = 0; i < chunks.length; i++) {
  fs.writeFileSync(`final_chunk_${i + 1}.sql`, chunks[i]);
  console.log(`Wrote final chunk ${i + 1} (${Buffer.byteLength(chunks[i], 'utf8')} bytes)`);
}
