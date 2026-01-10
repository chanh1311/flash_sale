# Hệ thống Flash Sale

Hệ thống giả lập thương mại điện tử Flash Sale chịu tải cao, được thiết kế để xử lý lượng truy cập lớn, ngăn chặn vượt quá tồn kho (oversell) và quản lý trạng thái đơn hàng hiệu quả.

## Tuân thủ Yêu cầu
Dự án này đáp ứng các yêu cầu cốt lõi:
- **Chống Oversell**: Sử dụng Pessimistic Locking (SELECT ... FOR UPDATE) ở Database.
- **Hệ thống Giữ chỗ (Reservation)**: TTL 10 phút, tự động nhả tồn kho.
- **Máy trạng thái Đơn hàng (State Machine)**: Pending -> Paid/Expired/Cancelled.
- **Realtime (Thời gian thực)**: Socket.IO cập nhật tồn kho và đơn hàng tức thì.
- **Audit Logs (Nhật ký)**: Truy vết hành động đầy đủ.

## Công nghệ sử dụng
- **Backend Framework**: NestJS 11
- **Frontend Framework**: Next.js 16 (App Router)
- **Database ORM**: TypeORM 0.3
- **Cơ sở dữ liệu**: PostgreSQL 15
- **UI Component**: shadcn/ui + TailwindCSS 4

## Cài đặt & Thiết lập

### 1. Yêu cầu tiên quyết
- Docker Desktop (để chạy Database)
- Node.js 18+ (để chạy Backend/Frontend)

### 2. Biến môi trường
Copy file cấu hình mẫu:
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Khởi động Database (Docker)
Lệnh này chỉ khởi động **PostgreSQL Database**.
```bash
docker compose up -d
```

### 4. Cài đặt & Chạy Backend
Mở một terminal mới:
```bash
cd backend
npm install

# Chạy Migration (Tạo bảng)
npm run migration:run

# Seed Dữ liệu (Tạo Product, User mẫu) -> Quan trọng!
npm run seed

# Khởi động Server
npm run start:dev
```
Backend sẽ chạy tại: `http://localhost:3001`
Tài khoản test 1: `admin@example.com` / `password123`
Tài khoản test 2: `user@example.com` / `password123`

### 5. Cài đặt & Chạy Frontend
Mở thêm một terminal khác:
```bash
cd frontend
npm install

# Khởi động Client
npm run dev
```
Truy cập Web tại: `http://localhost:3000`

---

## Kiểm thử (Testing)

### 1. Test Chống Oversell (Concurrency)
Kịch bản: 20 user cùng tranh mua 6 iPhone (Tổng cầu 120 > Kho 100).
```bash
cd backend
npx ts-node scripts/test-oversell.ts
```
**Kết quả kỳ vọng**: ~16 giao dịch thành công, ~4 giao dịch thất bại (đúng logic chặn oversell). Việc log `FOR UPDATE` trong code server sẽ chứng minh khóa hoạt động.

### 2. Test Idempotency (Chống trùng lặp)
Kịch bản: Gửi cùng một request (kèm `idempotencyKey`) 2 lần liên tiếp.
```bash
cd backend
npx ts-node scripts/test-idempotency.ts
```
**Kết quả kỳ vọng**: Cả 2 lần đều trả về **cùng một ID đơn hàng**, không tạo đơn hàng rác.

---

## Cấu trúc Dự án
- `backend/`: API Server & WebSocket Gateway.
- `frontend/`: Giao diện người dùng Next.js.
- `DESIGN.md`: Tài liệu thiết kế chi tiết kiến trúc & logic khóa.
