# 🛡️ Pactkeeper Web SDK & Player Portal

> **Dự án tốt nghiệp:** SEP490 - FPT University  
> **Repository:** `VHoangThang2004/SDK_Pactkeeper`  
> **Trạng thái:** Đang phát triển & Triển khai thử nghiệm (In Progress)  
> **Production URL:** [https://pactkeeper-web.vercel.app](https://pactkeeper-web.vercel.app)

---

## 📖 1. Giới thiệu tổng quan (Overview)

**Pactkeeper Web SDK** là cổng thông tin và dịch vụ web đồng hành cùng tựa game chiến thuật **Pactkeeper (SRPG)**. Hệ thống cung cấp cho người chơi nền tảng an toàn, tiện lợi để thực hiện các giao dịch nạp tiền, theo dõi hồ sơ cá nhân, lịch sử giao dịch và kết nối hỗ trợ trực tuyến thời gian thực với đội ngũ quản trị viên (Admin/Game Master).

### Các phân hệ chính:
- **Treasury (Nạp ngọc):** Danh mục gói ngọc và vật phẩm tặng kèm, tích hợp thanh toán trực tuyến.
- **Player Profile (Hồ sơ người chơi):** Cấp bậc, điểm kinh nghiệm, số ngọc sở hữu và avatar phiêu lưu.
- **Treasury Ledger (Lịch sử giao dịch):** Bảng kê chi tiết các giao dịch nạp tiền, trạng thái đơn hàng và mã giao dịch.
- **Counsel (Hỗ trợ trực tuyến Real-time):** Kênh trao đổi trực tiếp giữa người chơi và Admin/Bot thông qua SignalR.
- **Keeper's Archives (Bảng quản trị Admin):** Tiếp nhận yêu cầu tư vấn, quản lý phòng chat hỗ trợ từng người chơi.

---

## 🚀 2. Báo cáo tiến trình dự án (Project Progress)

### 📊 Bảng tổng hợp các mốc tính năng

| Phân hệ / Tính năng | Trạng thái | Mô tả chi tiết |
| :--- | :---: | :--- |
| **Google OAuth 2.0 Login** |  Hoàn thành | Đăng nhập an toàn qua tài khoản Google, tự động xác thực và nhận diện người chơi. |
| **Admin Entrance Authentication** |  Hoàn thành | Cổng đăng nhập bảo mật dành riêng cho Quản trị viên (True Name & Secret Word). |
| **Role-based Route Guarding** |  Hoàn thành | Phân quyền tuyến đường (`/profile/*`, `/checkout`, `/admin-dashboard`, `/admin-chat/*`). |
| **Player Profile & Resilience Fallback** |  Hoàn thành | Hiển thị hồ sơ, cấp độ, kinh nghiệm và cơ chế fallback an toàn chống treo loading. |
| **Gem Acquisition & Package Catalog** |  Hoàn thành | Hiển thị các gói nạp ngọc, tự động map tên tướng/vũ khí/phụ kiện tặng kèm. |
| **Checkout & Payment Flow** |  Hoàn thành | Màn hình xác nhận giỏ hàng, thông tin thanh toán, chuyển tiếp cổng thanh toán PayOS/VNPAY. |
| **Payment Result Handling** |  Hoàn thành | Trang điều hướng kết quả thanh toán thành công (`/payment/success`) hoặc hủy (`/payment/cancel`). |
| **Treasury Ledger (Lịch sử giao dịch)** |  Hoàn thành | Bảng theo dõi lịch sử nạp tiền, trạng thái `CONFIRMED` / `PENDING` / `CANCELLED`. |
| **Missives (Hòm thư / Thông báo)** |  Hoàn thành | Giao diện tiếp nhận thư tín và thông điệp từ hệ thống. |
| **Counsel / Live Support (SignalR)** |  Hoàn thành | Chat hỗ trợ real-time hai chiều, gửi văn bản và tải lên hình ảnh đính kèm. |
| **Admin Support Dashboard** |  Hoàn thành | Danh sách người chơi gửi yêu cầu hỗ trợ và truy cập phòng chat tương ứng. |
| **Reverse Proxy & Deployment** |  Hoàn thành | Cấu hình Vercel Rewrite chuyển tiếp API và WebSocket/SignalR về Backend Kestrel. |

---

### 📝 Chi tiết tiến trình các đợt cập nhật gần nhất

- **Giai đoạn 1: Nền tảng giao diện & Xác thực**
  - Khởi tạo kiến trúc dự án với React 19, TypeScript và Vite.
  - Thiết kế giao diện phong cách giấy cổ (Parchment & Fantasy Medieval UI).
  - Tích hợp `@react-oauth/google` và hệ thống quản lý trạng thái phiên đăng nhập Zustand (`authStore`).

- **Giai đoạn 2: Tích hợp Dịch vụ Thanh toán (Payment & Top-Up)**
  - Xây dựng module Treasury hiển thị danh sách gói nạp lấy từ API `/api/topuppack`.
  - Hoàn thiện luồng thanh toán Checkout (`CheckoutScreen`) và xử lý kết quả giao dịch (`PaymentResultScreen`).
  - Xây dựng trang Ledger theo dõi lịch sử dòng tiền từ `/api/payment/history`.

- **Giai đoạn 3: Tính năng Tư vấn Trực tuyến (Counsel / SignalR)**
  - Tích hợp `@microsoft/signalr` kết nối tới `/hubs/support`.
  - Hỗ trợ tải ảnh đính kèm thông qua endpoint upload `/api/support/upload`.
  - Xây dựng giao diện chat kép: Client Support Chat và Admin Support Console.

- **Giai đoạn 4: Tối ưu hóa Kết nối & Bảo mật (Current)**
  - Khắc phục triệt để lỗi kẹt trạng thái Loading khi gọi API hồ sơ người chơi.
  - Nâng cấp `apiClient` Axios: tăng timeout lên 30s, tự động xử lý token hết hạn (401).
  - Chuẩn hóa Client ID Google OAuth, bổ sung fallback an toàn cho hệ thống.

---

## 🛠️ 3. Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ | Phiên bản |
| :--- | :--- | :--- |
| **Core Framework** | React | `19.2.x` |
| **Ngôn ngữ** | TypeScript | `~6.0.x` |
| **Bundler & Build Tool** | Vite | `^8.1.x` |
| **State Management** | Zustand | `^5.0.x` |
| **Routing** | React Router DOM | `^7.18.x` |
| **Network Client** | Axios | `^1.18.x` |
| **Realtime Gateway** | Microsoft SignalR Client | `^10.0.x` |
| **Authentication** | Google OAuth (`@react-oauth/google`) | `^0.13.x` |
| **Iconography** | Lucide React | `^1.25.x` |
| **Linter** | Oxlint | `^1.71.x` |
| **Deployment** | Vercel Edge / Serverless Proxy | - |

---

## 📁 4. Cấu trúc thư mục (Folder Structure)

```text
SDK_Pactkeeper/
├── public/                 # Tài nguyên tĩnh (favicon, icons)
├── src/
│   ├── assets/             # Hình ảnh đồ họa và biểu tượng nền
│   ├── components/         # Các thành phần UI tái sử dụng
│   │   ├── BottomNav/      # Thanh điều hướng người chơi (Mobile/Web)
│   │   ├── Button/         # Nút bấm phong cách Fantasy
│   │   ├── Input/          # Ô nhập liệu chuẩn hóa
│   │   ├── LayoutWrapper/  # Khung bao bố cục chung
│   │   ├── ParchmentBackground/ # Nền giấy cổ
│   │   └── ScrollHeader/   # Tiêu đề cuộn chỉ phong cách cổ
│   ├── core/
│   │   ├── network/        # Cấu hình API Client & Axios Interceptors
│   │   └── services/       # Quản lý lưu trữ LocalStorage / Tokens
│   ├── features/
│   │   ├── auth/           # Đăng nhập Google & Quản trị viên
│   │   ├── payment/        # Thanh toán, Checkout & Kết quả giao dịch
│   │   ├── profile/        # Nạp ngọc, Hồ sơ, Lịch sử & Admin Dashboard
│   │   └── support/        # Chat hỗ trợ real-time SignalR
│   ├── store/              # Zustand Auth Store (quản lý session & roles)
│   ├── styles/             # Global CSS, Design Tokens & Color Palettes
│   ├── App.tsx             # Định tuyến cấp cao (Routing & Route Guards)
│   └── main.tsx            # Điểm khởi chạy ứng dụng & Google OAuth Provider
├── vercel.json             # Cấu hình Reverse Proxy chuyển tiếp API/Hubs
├── vite.config.ts          # Cấu hình Vite & Development Proxy
└── package.json            # Khai báo phụ thuộc và kịch bản thực thi
```

---

## ⚙️ 5. Cài đặt và Chạy thử (Getting Started)

### 1. Yêu cầu tiên quyết
- **Node.js:** phiên bản `18.x` hoặc cao hơn
- **npm** hoặc **yarn / pnpm**

### 2. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env` tại thư mục gốc của project:
```env
VITE_GOOGLE_CLIENT_ID=978068800706-gr8nfa4iq66m4e6njggntupslphdar10.apps.googleusercontent.com
```

### 4. Khởi chạy môi trường phát triển (Development)
```bash
npm run dev
```
Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5173`

### 5. Kiểm tra mã nguồn & Đóng gói (Build)
```bash
# Kiểm tra lint
npm run lint

# Biên dịch TypeScript và đóng gói Production
npm run build
```

---

## 🌐 6. Cấu hình Backend & Proxy

Dự án kết nối tới Backend Kestrel của Pactkeeper tại:
- **Backend Host:** `http://srpg-backend.duckdns.org:5276`
- **Tập lệnh API:** `/api/*`
- **SignalR Hub:** `/hubs/support`

Trên môi trường **Vercel**, việc định tuyến được cấu hình tự động thông qua [`vercel.json`](./vercel.json) để tránh lỗi Mixed Content (HTTPS sang HTTP) và hạn chế rò rỉ địa chỉ IP backend.

---

## 👥 7. Nhóm phát triển (Development Team)
- **Sinh viên thực hiện:** Võ Hoàng Thắng (SE182121)
- **Đề tài:** SRPG Pactkeeper - Đồ án tốt nghiệp Kỹ thuật phần mềm (SEP490), Đại học FPT.
