# Hệ thống Flash Sale

Một hệ thống giả lập thương mại điện tử Flash Sale chịu tải cao, được thiết kế để xử lý lượng truy cập lớn, ngăn chặn vượt quá tồn kho (oversell) và quản lý trạng thái đơn hàng hiệu quả.

## Tuân thủ Yêu cầu
Dự án này đáp ứng các yêu cầu:
- **Chống Oversell**: Sử dụng Pessimistic Locking ở Database.
- **Hệ thống Giữ chỗ (Reservation)**: TTL 10 phút, tự động nhả tồn kho.
- **Máy trạng thái Đơn hàng (State Machine)**: Pending -> Paid/Expired/Cancelled.
- **Realtime (Thời gian thực)**: Sự kiện Socket.IO cho cập nhật tồn kho và đơn hàng.
- **Audit Logs (Nhật ký)**: Truy vết đầy đủ hành động với thông tin người dùng.
- **Tech Stack**: Next.js 14, NestJS, PostgreSQL (TypeORM).

## Công nghệ sử dụng
- **Frontend**: Next.js 14 (App Router), TailwindCSS, shadcn/ui.
- **Backend**: NestJS, TypeORM, Socket.IO.
- **Database**: PostgreSQL 16.

## Cài đặt & Thiết lập

### 1. Yêu cầu tiên quyết
- Docker & Docker Compose
- Node.js 18+

### 2. Biến môi trường
Copy các file môi trường mẫu:
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Chạy với Docker (Khuyên dùng)
Lệnh này sẽ khởi động Postgres, Backend và Frontend.
```bash
docker compose up --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:3001](http://localhost:3001)

### 4. Dữ liệu mẫu (Seed Data)
Sau khi backend chạy, ứng dụng sẽ tự động seed dữ liệu ban đầu (Users, Products).
- **Admin**: `admin@example.com` / `password123`
- **User**: `user@example.com` / `password123`

---

## Kiểm thử (Testing)

### Chạy Test Đồng thời (Chống Oversell)
Giả lập 20 người dùng cùng mua 6 sản phẩm (Tổng cầu 120 > Kho 100).
```bash
cd backend
npx ts-node scripts/test-oversell.ts
```
Kỳ vọng: ~16 thành công, ~4 thất bại (Bị chặn do hết hàng).

### Chạy Test Idempotency
Xác minh rằng gửi lại cùng một request (retry) sẽ trả về cùng kết quả.
```bash
cd backend
npx ts-node scripts/test-idempotency.ts
```

---

## Cấu trúc Dự án
- `backend/`: NestJS API & WebSocket Gateway.
- `frontend/`: Next.js Client App.
- `DESIGN.md`: Chi tiết kiến trúc và cơ chế khóa.
