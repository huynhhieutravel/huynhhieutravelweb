const fs = require('fs');

const WP_URL = 'https://huynhhieutravel.com/wp-json/wp/v2';
const DOMAIN = 'huynhhieutravel.com';

function stripHtml(html) {
    if (!html) return '';
    let text = html.replace(/<[^>]+>/g, '');
    text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ');
    text = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    return text;
}

function escapeSql(str) {
    if (!str) return '';
    return str.replace(/'/g, "''");
}

async function fetchAll(endpoint) {
    let allData = [];
    let page = 1;
    let totalPages = 1;
    
    while (page <= totalPages) {
        console.log(`Fetching ${endpoint} page ${page}/${totalPages}...`);
        try {
            const res = await fetch(`${WP_URL}/${endpoint}?per_page=100&page=${page}`);
            if (!res.ok) {
                console.error(`Failed to fetch ${endpoint} page ${page}: ${res.statusText}`);
                break;
            }
            
            if (page === 1) {
                totalPages = parseInt(res.headers.get('X-WP-TotalPages')) || 1;
                console.log(`Total pages: ${totalPages}`);
            }
            
            const data = await res.json();
            if (data.length === 0) break;
            allData = allData.concat(data);
            page++;
        } catch (e) {
            console.error(`Error fetching ${endpoint} page ${page}:`, e);
            break;
        }
    }
    return allData;
}

async function main() {
    let sql = `-- huynhhieutravel DB Seed\n`;
    
    // 1. Fetch Categories
    const categories = await fetchAll('categories');
    sql += `\n-- CATEGORIES\n`;
    for (const cat of categories) {
        const desc = stripHtml(cat.description || '');
        sql += `INSERT OR IGNORE INTO Category (id, name, slug, description) VALUES (${cat.id}, '${escapeSql(cat.name)}', '${escapeSql(cat.slug)}', '${escapeSql(desc)}');\n`;
    }
    
    // 2. Fetch Tags
    const tags = await fetchAll('tags');
    sql += `\n-- TAGS\n`;
    for (const tag of tags) {
        sql += `INSERT OR IGNORE INTO Tag (id, name, slug) VALUES (${tag.id}, '${escapeSql(tag.name)}', '${escapeSql(tag.slug)}');\n`;
    }
    
    // 3. Fetch Media
    const mediaList = await fetchAll('media');
    sql += `\n-- MEDIA\n`;
    let downloads = [];
    let mediaMapping = {};
    for (const m of mediaList) {
        let caption = stripHtml(m.caption?.rendered || '');
        let desc = stripHtml(m.description?.rendered || '');
        let altText = stripHtml(m.alt_text || '');
        
        let url = m.source_url;
        let originalUrl = url;
        
        let filename = url.substring(url.lastIndexOf('/') + 1);
        let newUrl = `https://media.huynhhieutravel.com/${filename}`;
        
        sql += `INSERT OR IGNORE INTO Media (id, url, caption, description, altText, createdAt) VALUES (${m.id}, '${escapeSql(newUrl)}', '${escapeSql(caption)}', '${escapeSql(desc)}', '${escapeSql(altText)}', '${m.date.replace('T', ' ')}');\n`;
        
        downloads.push({
            id: m.id,
            url: originalUrl,
            filename: filename,
            newUrl: newUrl
        });
        
        mediaMapping[m.id] = newUrl;
    }
    
    fs.writeFileSync('downloads.json', JSON.stringify(downloads, null, 2));
    console.log(`Saved ${downloads.length} media items to downloads.json`);
    
    // 4. Fetch Posts
    const posts = await fetchAll('posts');
    sql += `\n-- POSTS\n`;
    for (const p of posts) {
        let title = stripHtml(p.title?.rendered || '');
        let excerpt = stripHtml(p.excerpt?.rendered || '');
        let content = p.content?.rendered || '';
        
        // Simple regex replace for old domains
        content = content.replace(/https?:\/\/huynhhieutravel\.com\/wp-content\/uploads\/\d{4}\/\d{2}\/([^\/"]+?\.[a-z0-9]+)/gi, 'https://media.huynhhieutravel.com/$1');
        
        let featuredImage = p.featured_media || 'NULL';
        
        sql += `INSERT OR IGNORE INTO Post (id, title, slug, content, excerpt, featuredImage, type, createdAt, updatedAt) VALUES (${p.id}, '${escapeSql(title)}', '${escapeSql(p.slug)}', '${escapeSql(content)}', '${escapeSql(excerpt)}', ${featuredImage}, 'post', '${p.date.replace('T', ' ')}', '${p.modified.replace('T', ' ')}');\n`;
        
        // PostCategory
        if (p.categories && p.categories.length > 0) {
            for (let catId of p.categories) {
                sql += `INSERT OR IGNORE INTO PostCategory (postId, categoryId) VALUES (${p.id}, ${catId});\n`;
            }
        }
        
        // PostTag
        if (p.tags && p.tags.length > 0) {
            for (let tagId of p.tags) {
                sql += `INSERT OR IGNORE INTO PostTag (postId, tagId) VALUES (${p.id}, ${tagId});\n`;
            }
        }
    }
    
    // 5. Fetch Pages
    const pages = await fetchAll('pages');
    sql += `\n-- PAGES\n`;
    for (const p of pages) {
        let title = stripHtml(p.title?.rendered || '');
        let excerpt = stripHtml(p.excerpt?.rendered || '');
        let content = p.content?.rendered || '';
        
        content = content.replace(/https?:\/\/huynhhieutravel\.com\/wp-content\/uploads\/\d{4}\/\d{2}\/([^\/"]+?\.[a-z0-9]+)/gi, 'https://media.huynhhieutravel.com/$1');
        
        let featuredImage = p.featured_media || 'NULL';
        
        sql += `INSERT OR IGNORE INTO Post (id, title, slug, content, excerpt, featuredImage, type, createdAt, updatedAt) VALUES (${p.id}, '${escapeSql(title)}', '${escapeSql(p.slug)}', '${escapeSql(content)}', '${escapeSql(excerpt)}', ${featuredImage}, 'page', '${p.date.replace('T', ' ')}', '${p.modified.replace('T', ' ')}');\n`;
    }
    
    fs.writeFileSync('seed.sql', sql);
    console.log(`Generated seed.sql successfully!`);
}

main().catch(console.error);
