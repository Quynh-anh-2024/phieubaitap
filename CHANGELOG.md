# Thay đổi trong bản tinh gọn

## Trải nghiệm người dùng

- Giảm loại phiếu từ 10 xuống 4 mục đích rõ ràng.
- Gộp mức độ và đối tượng học sinh thành một lựa chọn duy nhất.
- Đổi số câu sang thời lượng dự kiến; hệ thống tự cân đối số câu.
- Giảm lựa chọn dạng bài từ 8 preset xuống 3 chế độ.
- Bỏ phần tóm tắt cấu hình bị lặp.
- Thu gọn tùy chọn mở rộng còn ma trận và liên hệ địa phương.

## Nội dung và logic AI

- Tách Tiếng Việt thành Đọc hiểu, Luyện từ và câu, Luyện viết và Tổng hợp.
- Chỉ hiện và gửi nguồn ngữ liệu khi phạm vi có Đọc hiểu.
- Không tự gộp dạng bài mặc định làm sai lựa chọn người dùng.
- Loại bỏ xung đột giữa “Chỉ đáp án” và yêu cầu giải thích dài.
- Tạo cấu trúc đầu ra động, không sinh mục ma trận khi đã tắt.

## Xuất Word

- `PhieuBaiTap_BanLamBai.docx`: dành cho học sinh, không có đáp án.
- `PhieuBaiTap_DapAn.docx`: đề bài, đáp án và hướng dẫn giáo viên.

## Kiểm tra

- TypeScript: `npx tsc --noEmit`
- Production build: `npm run build`
