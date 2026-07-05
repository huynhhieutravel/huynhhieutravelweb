-- Categories
INSERT INTO Category (id, name, slug, description) VALUES
('cat-1', 'Tin tức & Khuyến mãi', 'tin-tuc-khuyen-mai', 'Các tin tức mới nhất và chương trình khuyến mãi'),
('cat-2', 'Cẩm nang du lịch', 'cam-nang-du-lich', 'Kinh nghiệm và mẹo du lịch'),
('cat-3', 'Review Điểm Đến', 'review-diem-den', 'Đánh giá chân thực về các địa điểm nổi tiếng');

-- Tags
INSERT INTO Tag (id, name, slug) VALUES
('tag-1', 'Châu Á', 'chau-a'),
('tag-2', 'Mùa Thu', 'mua-thu'),
('tag-3', 'Ẩm Thực', 'am-thuc'),
('tag-4', 'Check-in', 'check-in');

-- Posts
INSERT INTO Post (id, slug, title, excerpt, content, featuredImage, status, categoryId, author, createdAt) VALUES
('post-1', 'kham-pha-ve-dep-mua-thu-nhat-ban', 'Khám phá vẻ đẹp mùa thu Nhật Bản', 'Nhật Bản luôn là điểm đến lý tưởng khi tiết trời sang thu...', '<p>Chi tiết bài viết mùa thu Nhật Bản...</p>', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=400&auto=format&fit=crop', 'published', 'cat-2', 'Admin', datetime('now', '-2 days')),
('post-2', 'top-5-mon-an-duong-pho-thai-lan', 'Top 5 món ăn đường phố Thái Lan phải thử', 'Đến Thái Lan mà chưa thử các món này thì quả là thiếu sót lớn.', '<p>Chi tiết bài viết ẩm thực...</p>', 'https://images.unsplash.com/photo-1559314809-0d155014e29e?q=80&w=400&auto=format&fit=crop', 'published', 'cat-3', 'Hieu', datetime('now', '-5 days')),
('post-3', 'chuong-trinh-giam-gia-tour-he', 'Chương trình giảm giá tour hè cực sốc', 'Giảm đến 30% cho các hành trình đặt sớm trước 30 ngày.', '<p>Nội dung khuyến mãi...</p>', '', 'draft', 'cat-1', 'Admin', datetime('now')),
('post-4', 'cam-nang-xin-visa-chau-au', 'Cẩm nang xin Visa Châu Âu (Schengen) bao đậu', 'Hướng dẫn từ A đến Z cách chuẩn bị hồ sơ xin visa Châu Âu.', '<p>Chi tiết thủ tục xin visa...</p>', 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?q=80&w=400&auto=format&fit=crop', 'pending', 'cat-2', 'Hieu', datetime('now', '-10 days'));

-- PostCategory & PostTag relationships
INSERT INTO PostCategory (postId, categoryId) VALUES
('post-1', 'cat-2'),
('post-2', 'cat-3'),
('post-3', 'cat-1'),
('post-4', 'cat-2');

INSERT INTO PostTag (postId, tagId) VALUES
('post-1', 'tag-1'),
('post-1', 'tag-2'),
('post-2', 'tag-1'),
('post-2', 'tag-3'),
('post-4', 'tag-2');

-- Pages
INSERT INTO Page (id, slug, title, status, featuredImage, content, publishedAt) VALUES
('page-1', 'gioi-thieu', 'Giới Thiệu Về FIT Tour', 'published', '', '<p>Nội dung giới thiệu công ty...</p>', datetime('now', '-30 days')),
('page-2', 'chinh-sach-bao-mat', 'Chính Sách Bảo Mật', 'published', '', '<p>Chính sách bảo mật thông tin...</p>', datetime('now', '-30 days')),
('page-3', 'lien-he', 'Liên Hệ', 'draft', '', '<p>Thông tin liên hệ...</p>', datetime('now'));

-- Media
INSERT INTO Media (id, url, filename, title, mimeType, sizeBytes, width, height, createdAt) VALUES
('media-1', 'https://images.unsplash.com/photo-1506744626753-1401305415c6', 'mua-thu-kyoto.jpg', 'Mùa thu Kyoto', 'image/jpeg', 1520000, 1920, 1080, datetime('now', '-1 days')),
('media-2', 'https://images.unsplash.com/photo-1559314809-0d155014e29e', 'am-thuc-thai-lan.png', 'Pad Thái', 'image/png', 2145000, 1200, 800, datetime('now', '-2 days')),
('media-3', 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05', 'may-bay.jpg', 'Chuyến bay quốc tế', 'image/jpeg', 3020000, 2048, 1365, datetime('now', '-3 days'));

-- Links
INSERT INTO Link (slug, label, url, statusCode, isActive) VALUES
('fb', 'Facebook Fanpage', 'https://facebook.com/fittour', 301, 1),
('zalo', 'Zalo OA', 'https://zalo.me/123456789', 302, 1),
('promo', 'Khuyến Mãi Hè', 'https://huynhhieutravel.com/khuyen-mai-he-2026', 302, 0);

-- Users (Recreate to match UI expectations)
DROP TABLE IF EXISTS User;
CREATE TABLE User (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'user',
  is_active INTEGER DEFAULT 1,
  failed_login_attempts INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  last_login_at TEXT
);

INSERT INTO User (id, email, username, role, is_active) VALUES
('user-1', 'admin@fittour.vn', 'admin', 'admin', 1),
('user-2', 'editor@fittour.vn', 'hieu', 'editor', 1);
