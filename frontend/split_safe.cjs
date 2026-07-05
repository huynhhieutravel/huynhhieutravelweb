const fs = require('fs');

const data = fs.readFileSync('../seed.sql', 'utf8');

let inString = false;
let currentChunk = '';
let chunkIndex = 1;
let currentStmt = '';

for (let i = 0; i < data.length; i++) {
  const char = data[i];
  currentStmt += char;

  if (char === "'") {
    // Check if it's escaped (two single quotes)
    if (i + 1 < data.length && data[i + 1] === "'") {
      currentStmt += "'";
      i++;
    } else {
      inString = !inString;
    }
  }

  // If we reach the end of a statement (semicolon outside of string)
  if (char === ';' && !inString) {
    if (currentStmt.length > 90000) {
      console.log(`Truncating statement (length ${currentStmt.length})`);
      const match = currentStmt.match(/VALUES \((\d+),/);
      if (match) {
        const id = match[1];
        currentStmt = `\nINSERT OR IGNORE INTO Post (id, title, slug, content, excerpt, featuredImage, type, createdAt, updatedAt) VALUES (${id}, 'Truncated Post', 'truncated-${id}', 'Content was too large for D1 import.', '', '', 'post', '2023-01-01 00:00:00', '2023-01-01 00:00:00');`;
      }
    }
    
    currentChunk += currentStmt + "\n";
    currentStmt = '';

    if (currentChunk.length > 100 * 1024) {
      fs.writeFileSync(`../safe_chunk_${chunkIndex}.sql`, currentChunk);
      console.log(`Wrote safe chunk ${chunkIndex} (${currentChunk.length} bytes)`);
      currentChunk = '';
      chunkIndex++;
    }
  }
}

if (currentStmt.length > 0 || currentChunk.length > 0) {
  fs.writeFileSync(`../safe_chunk_${chunkIndex}.sql`, currentChunk + currentStmt);
  console.log(`Wrote safe chunk ${chunkIndex}`);
}
