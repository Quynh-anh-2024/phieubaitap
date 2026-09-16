# Trợ lý học tập tiểu học

Ứng dụng React + Vite hỗ trợ giáo viên tạo phiếu bài tập lớp 1-5 bằng Gemini và xuất Word.

## Chức năng chính

- 4 mục đích rõ ràng: củng cố sau bài học, luyện cuối tuần, ôn giữa/cuối kì, kiểm tra nhanh.
- 4 mức phù hợp: cần hỗ trợ, đạt chuẩn, phân hóa cả lớp, nâng cao.
- Tiếng Việt tách riêng: đọc hiểu, luyện từ và câu, luyện viết, tổng hợp.
- Tùy chọn thời lượng, dạng câu hỏi, mức chi tiết đáp án, ma trận và ngữ cảnh địa phương.
- Xuất `Bản làm bài` không có đáp án và `Bản đáp án` dành cho giáo viên.

## Chạy trên máy

Yêu cầu Node.js 18 trở lên.

```bash
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal. Ở lần đầu sử dụng, nhập Google Gemini API Key trong giao diện. Key chỉ được lưu trong `localStorage` của trình duyệt hiện tại.

## Kiểm tra trước khi đẩy Git hoặc triển khai

```bash
npx tsc --noEmit
npm run build
```

Thư mục build production được tạo tại `dist/`.

## Lưu ý triển khai

Phiên bản hiện tại gọi Gemini trực tiếp từ trình duyệt, phù hợp dùng nội bộ. Nếu triển khai công khai, nên chuyển lệnh gọi Gemini sang backend để không yêu cầu người dùng nhập API Key và có thể kiểm soát hạn mức sử dụng.
