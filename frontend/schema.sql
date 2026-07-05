DROP TABLE IF EXISTS PostCategory;
DROP TABLE IF EXISTS PostTag;
DROP TABLE IF EXISTS Post;
DROP TABLE IF EXISTS Page;
DROP TABLE IF EXISTS Media;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS Tag;
DROP TABLE IF EXISTS Link;
DROP TABLE IF EXISTS SiteSetting;
DROP TABLE IF EXISTS UserRole;
DROP TABLE IF EXISTS RolePermission;
DROP TABLE IF EXISTS Role;
DROP TABLE IF EXISTS User;

CREATE TABLE Media (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  filename TEXT,
  title TEXT,
  altText TEXT,
  caption TEXT,
  description TEXT,
  mimeType TEXT,
  sizeBytes INTEGER,
  width INTEGER,
  height INTEGER,
  createdAt TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_media_filename ON Media(filename);

CREATE TABLE Category (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parentId TEXT,
  count INTEGER DEFAULT 0
);

CREATE TABLE Tag (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  count INTEGER DEFAULT 0
);

CREATE TABLE Post (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  featuredImage TEXT,
  status TEXT DEFAULT 'draft',
  categoryId TEXT,
  author TEXT,
  type TEXT DEFAULT 'post',
  isElementor INTEGER DEFAULT 0,
  seoTitle TEXT,
  seoDescription TEXT,
  ogImage TEXT,
  customSchema TEXT,
  schemaEnabled INTEGER DEFAULT 1,
  schemaUpdatedAt TEXT,
  schemaUpdatedBy TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE Page (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  featuredImage TEXT,
  raw_content TEXT,
  content TEXT,
  css_content TEXT,
  seoTitle TEXT,
  seoDescription TEXT,
  ogImage TEXT,
  publishedAt TEXT,
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE PostCategory (
  postId TEXT,
  categoryId TEXT,
  PRIMARY KEY (postId, categoryId),
  FOREIGN KEY (postId) REFERENCES Post(id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES Category(id) ON DELETE CASCADE
);

CREATE TABLE PostTag (
  postId TEXT,
  tagId TEXT,
  PRIMARY KEY (postId, tagId),
  FOREIGN KEY (postId) REFERENCES Post(id) ON DELETE CASCADE,
  FOREIGN KEY (tagId) REFERENCES Tag(id) ON DELETE CASCADE
);

CREATE TABLE Link (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  statusCode INTEGER DEFAULT 302,
  target TEXT DEFAULT '_blank',
  rel TEXT DEFAULT 'nofollow sponsored',
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE SiteSetting (
  key TEXT PRIMARY KEY,
  value TEXT,
  version INTEGER DEFAULT 1,
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE User (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT,
  name TEXT,
  displayName TEXT,
  bio TEXT,
  avatar TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE Role (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE UserRole (
  userId TEXT,
  roleId TEXT,
  PRIMARY KEY (userId, roleId),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (roleId) REFERENCES Role(id) ON DELETE CASCADE
);

CREATE TABLE RolePermission (
  roleId TEXT,
  permission TEXT NOT NULL,
  PRIMARY KEY (roleId, permission),
  FOREIGN KEY (roleId) REFERENCES Role(id) ON DELETE CASCADE
);

INSERT INTO Role (id, name, description) VALUES ('admin', 'Admin', 'Toàn quyền hệ thống');
INSERT INTO Role (id, name, description) VALUES ('editor', 'Editor', 'Quyền đăng và sửa bài');
