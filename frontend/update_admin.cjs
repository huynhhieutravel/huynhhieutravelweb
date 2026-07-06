const crypto = require('crypto');
const { execSync } = require('child_process');

const password = 'admin'; // Mật khẩu mặc định sau khi reset
const salt = 'huynhhieu_salt_';
const hash = crypto.createHash('sha256').update(salt + password).digest('hex');

const email = 'huynhhieutravel@gmail.com';

// Cập nhật lại mật khẩu cho email quản trị viên thay vì xóa User
const sql = `UPDATE User SET passwordHash = '${hash}' WHERE email = '${email}';`;

console.log("Đang chạy lệnh khôi phục mật khẩu...");

try {
  execSync(`npx wrangler d1 execute huynhhieutravel-db --remote --command="${sql}"`, { stdio: 'inherit' });
  console.log("✅ Thành công! Mật khẩu đã được reset về: " + password);
} catch (e) {
  console.error("❌ Lỗi khi khôi phục mật khẩu:", e.message);
}
