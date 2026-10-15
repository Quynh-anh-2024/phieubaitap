import {
  WorksheetRequest,
  EXERCISE_TYPE_OPTIONS,
  STUDENT_TARGET_OPTIONS,
  ANSWER_MODE_OPTIONS,
} from '../types';

/**
 * Cầu nối tương thích: Giúp chuỗi kết quả trả về từ generateWorksheet vừa dùng được như string bình thường,
 * vừa có sẵn phương thức .getReader() nếu App.tsx đọc dữ liệu theo luồng ReadableStream.
 */
if (typeof String !== 'undefined' && typeof (String.prototype as any).getReader !== 'function') {
  Object.defineProperty(String.prototype, 'getReader', {
    configurable: true,
    writable: true,
    value: function () {
      const fullText = String(this);
      let isRead = false;
      return {
        read: async () => {
          if (isRead) {
            return { done: true, value: undefined };
          }
          isRead = true;
          const bytes = new TextEncoder().encode(fullText);
          // Hỗ trợ cả trường hợp App.tsx dùng TextDecoder.decode(value) lẫn cộng chuỗi trực tiếp (text += value)
          Object.defineProperty(bytes, 'toString', { value: () => fullText });
          Object.defineProperty(bytes, Symbol.toPrimitive, { value: () => fullText });
          return { done: false, value: bytes as any };
        },
        releaseLock: () => {},
        cancel: async () => {},
      };
    },
  });
}

let runtimeApiKey = '';

const extractKeyPattern = (raw: string | null | undefined): string => {
  if (!raw) return '';
  const match = String(raw).match(/AIza[0-9A-Za-z\-_]{25,}/);
  return match ? match[0] : '';
};

const getApiKey = (customKey?: string): string => {
  const fromCustom = extractKeyPattern(customKey) || (customKey && customKey.trim());
  if (fromCustom) {
    runtimeApiKey = fromCustom;
    return runtimeApiKey;
  }

  if (runtimeApiKey) return runtimeApiKey;

  if (typeof window !== 'undefined') {
    const storages = [window.localStorage, window.sessionStorage];
    for (const storage of storages) {
      if (!storage) continue;
      try {
        for (let i = 0; i < storage.length; i += 1) {
          const k = storage.key(i);
          if (!k) continue;
          const val = storage.getItem(k);
          const extracted = extractKeyPattern(val);
          if (extracted) return extracted;
        }
      } catch {
        // Bỏ qua nếu trình duyệt chặn quyền truy cập storage
      }
    }
  }

  const viteKey =
    typeof import.meta !== 'undefined' && (import.meta as any).env
      ? (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.VITE_API_KEY
      : '';
  if (viteKey) return String(viteKey).trim();

  const nodeKey =
    typeof process !== 'undefined' && process.env
      ? process.env.GEMINI_API_KEY || process.env.API_KEY
      : '';
  return nodeKey ? String(nodeKey).trim() : '';
};

const callGeminiRestApi = async (prompt: string, apiKey: string): Promise<string> => {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = '';

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
          },
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        lastError = `HTTP ${response.status}: ${errBody}`;
        continue;
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        const text = parts
          .map((p: any) => p?.text || '')
          .join('')
          .trim();
        if (text) return text;
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  throw new Error(lastError || 'Không thể kết nối tới Gemini API.');
};

/**
 * Kiểm tra tính hợp lệ của Gemini API Key (được gọi từ App.tsx)
 */
export const validateApiKey = async (apiKey?: string): Promise<boolean> => {
  const keyToTest = getApiKey(apiKey);
  if (!keyToTest) return false;

  try {
    const result = await callGeminiRestApi('Trả lời ngắn gọn: OK', keyToTest);
    if (result) {
      runtimeApiKey = keyToTest;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Lỗi kiểm tra API Key:', error);
    return false;
  }
};

const FORMAT_LABELS: Record<string, string> = {
  multiple_choice: 'Trắc nghiệm 4 lựa chọn (A, B, C, D)',
  true_false: 'Đúng / Sai',
  fill_blank: 'Điền khuyết / Điền vào chỗ chấm',
  matching: 'Nối cột A với cột B (trình bày bằng bảng Markdown 2 cột: | Cột A | Cột B |)',
  short_answer: 'Tự luận ngắn / Trình bày lời giải',
  real_context: 'Bài tập gắn với tình huống thực tiễn',
  error_finding: 'Tìm lỗi sai và sửa lại cho đúng',
  creative: 'Vận dụng sáng tạo',
};

const buildImageInstruction = (request: WorksheetRequest): string => {
  const mode = request.imageMode || 'auto';
  if (mode === 'none') {
    return `- KHÔNG chèn hình vẽ hay mã SVG vào đề bài.`;
  }

  const ratioGuide =
    mode === 'visual_focus'
      ? 'Ưu tiên sinh hình vẽ trực quan cho khoảng 40% - 60% số câu hỏi phù hợp.'
      : 'Chỉ sinh hình vẽ minh họa (khoảng 2 đến 4 câu trong phiếu) tại những câu thực sự cần hình ảnh trực quan để học sinh quan sát và giải bài. Không vẽ hình cho các câu tính nhẩm hoặc lý thuyết thuần túy.';

  return `- QUY TẮC SƯ PHẠM KHI VẼ HÌNH MINH HỌA TRỰC QUAN BẰNG MÃ SVG (BẮT BUỘC TUÂN THỦ):
  + ${ratioGuide}
  + Đặt khối mã \`\`\`svg ... \`\`\` ngay bên dưới dòng đề bài của câu hỏi đó.
  + NGUYÊN TẮC LOGIC HÌNH ẢNH (TRÁNH GÂY NHẦM LẪN CHO HỌC SINH TIỂU HỌC):
    1. TUYỆT ĐỐI CẤM vẽ các hình tròn trơn (<circle>) hoặc hình vuông trơn (<rect>) rồi gọi đó là quả táo, quả cam, bông hoa, con vật hay đồ vật thực tế!
    2. Nếu câu hỏi yêu cầu đếm hoặc quan sát ĐỒ VẬT, HOA QUẢ, CON VẬT, ĐỒ DÙNG HỌC TẬP (ví dụ: quả táo, quả cam, bắp ngô, bông hoa, ngôi sao, bút chì, quyển sách, cái kẹo, con cá...):
       - BẮT BUỘC dùng biểu tượng đồ họa trực quan trong thẻ <text font-size="26" text-anchor="middle">...</text> (ví dụ: 🍎 cho quả táo, 🍊 cho quả cam, 🌽 cho bắp ngô, 🌸 cho bông hoa, ⭐ cho ngôi sao, ✏️ cho bút chì, 📘 cho quyển vở, 🍬 cho cái kẹo, 🐟 cho con cá...) đặt trong các khung nhóm minh họa gọn gàng, HOẶC nếu vẽ bằng các hình khối thì đề bài BẮT BUỘC phải gọi đúng tên là "viên bi" hoặc "chấm tròn".
    3. Nếu câu hỏi là HÌNH HỌC, ĐO LƯỜNG, ĐỒNG HỒ, SƠ ĐỒ ĐOẠN THẲNG:
       - Hình phẳng / Đường gấp khúc: Vẽ chính xác bằng <polygon>, <rect>, <polyline>, ghi rõ tên đỉnh (A, B, C...) và số đo độ dài.
       - Sơ đồ đoạn thẳng: Vẽ các đoạn thẳng có vạch giới hạn và nhãn tên rõ ràng.
       - Mặt đồng hồ: Vẽ hình tròn, đủ số, kim giờ ngắn và kim phút dài chỉ đúng giờ.
    4. Thẻ gốc phải ghi đầy đủ: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 155" width="380" height="155">.
    5. TUYỆT ĐỐI KHÔNG ghi sẵn tổng số đáp án đúng lộ ra bên trong hình vẽ ở phần Đề bài.`;
};

const buildVietnameseInstruction = (request: WorksheetRequest): string => {
  if (request.subject !== 'Tiếng Việt') return '';

  const scope = request.vietnameseScope || 'language';
  if (scope === 'language') {
    return `- PHẠM VI TIẾNG VIỆT: Tập trung luyện từ và câu, chính tả, ngữ pháp và viết câu/đoạn ngắn theo chủ đề "${request.topic}". Không bắt buộc tạo bài đọc dài.`;
  }

  const source = request.readingSource || 'auto_new';
  let sourceGuide = '';

  if (
    (source === 'teacher_provided' || source === 'verified_textbook_excerpt') &&
    request.readingText?.trim()
  ) {
    sourceGuide = `- NGỮ LIỆU ĐỌC HIỂU BẮT BUỘC:
  + Sử dụng NGUYÊN VĂN văn bản dưới đây để đưa vào đầu phần ĐỀ BÀI (không tự ý cắt xén hay sửa đổi nội dung):
"""
${request.readingText.trim()}
"""
  + ${
    request.readingCitationLine
      ? `Ngay bên dưới bài đọc, ghi chính xác dòng trích nguồn in nghiêng: *(${request.readingCitationLine}${
          request.readingBookTitle ? ` - ${request.readingBookTitle}` : ''
        }${request.readingLessonTitle ? `, bài: ${request.readingLessonTitle}` : ''})*`
      : 'Giữ nguyên văn bản thầy/cô đã cung cấp.'
  }`;
  } else if (source === 'old_textbook_style') {
    sourceGuide = `- NGỮ LIỆU ĐỌC HIỂU: Sáng tác một văn bản đọc hiểu ngắn (khoảng 120 - 220 chữ tùy khối lớp ${request.grade}) mang đậm phong cách Sách giáo khoa Tiếng Việt tiểu học giai đoạn trước năm 2006: câu văn trong sáng, giản dị, giàu hình ảnh thiên nhiên, quê hương, tình cảm ông bà - cha mẹ - thầy trò - bạn bè, giàu tính nhân văn. Lưu ý: Không bịa đặt dòng trích dẫn số trang hay năm xuất bản giả.`;
  } else {
    sourceGuide = `- NGỮ LIỆU ĐỌC HIỂU: Tự biên soạn một văn bản đọc hiểu mới (khoảng 100 - 200 chữ phù hợp học sinh lớp ${request.grade}), ngôn từ chuẩn mực, gần gũi và an toàn bản quyền.`;
  }

  const noteGuide = request.readingSourceNote
    ? `\n  + Yêu cầu bổ sung cho ngữ liệu đọc: ${request.readingSourceNote}`
    : '';

  return `${sourceGuide}${noteGuide}
- CẤU TRÚC ĐỀ TIẾNG VIỆT: ${
    scope === 'comprehensive'
      ? 'Gồm bài đọc hiểu, hệ thống câu hỏi Đọc hiểu (Mức 1, 2, 3), phần Luyện từ và câu và 1 bài tập Viết sáng tạo ngắn.'
      : 'Đặt văn bản đọc ở đầu phần Đề bài, theo sau là các câu hỏi Đọc hiểu bám sát chi tiết và nội dung chính của văn bản.'
  }`;
};

export const generateWorksheet = async (
  arg1: WorksheetRequest | string,
  arg2?: WorksheetRequest | string | ((chunk: string) => void),
  arg3?: (chunk: string) => void
): Promise<string> => {
  const request = (typeof arg1 === 'object' && arg1 !== null ? arg1 : arg2) as WorksheetRequest;
  const customApiKey =
    typeof arg1 === 'string' ? arg1 : typeof arg2 === 'string' ? arg2 : undefined;
  const onChunk =
    typeof arg2 === 'function' ? arg2 : typeof arg3 === 'function' ? arg3 : undefined;

  const apiKey = getApiKey(customApiKey);
  if (!apiKey) {
    throw new Error('Chưa tìm thấy Gemini API Key. Vui lòng bấm "Đổi API Key" để nhập khóa.');
  }

  const exerciseLabel =
    EXERCISE_TYPE_OPTIONS.find((item) => item.value === request.exerciseType)?.label ||
    request.exerciseType;
  const targetLabel =
    STUDENT_TARGET_OPTIONS.find((item) => item.value === request.studentTarget)?.label ||
    request.studentTarget;
  const answerLabel =
    ANSWER_MODE_OPTIONS.find((item) => item.value === request.answerMode)?.label ||
    request.answerMode;

  const preferredFormatText =
    request.preferredFormats && request.preferredFormats.length > 0
      ? request.preferredFormats.map((f) => FORMAT_LABELS[f] || f).join('; ')
      : 'Phối hợp hài hòa giữa Trắc nghiệm khách quan, Đúng/Sai, Nối cột (Bảng 2 cột Cột A - Cột B), Điền khuyết và Tự luận vận dụng.';

  const localContextText = request.includeLocalContext
    ? `- LIÊN HỆ THỰC TIỄN ĐỊA PHƯƠNG / VÙNG CAO: Lồng ghép tự nhiên, gần gũi các hình ảnh đời sống học sinh vùng cao (như trường PTDTBT, bản làng, nương ngô, ruộng bậc thang, phiên chợ vùng cao, giữ gìn vệ sinh trường lớp, giúp đỡ bố mẹ...) vào tình huống của 2 - 3 câu hỏi vận dụng.`
    : '';

  const matrixSectionInstruction = request.includeMatrix
    ? `## II. MA TRẬN ĐẶC TẢ CÂU HỎI
(Trình bày bằng bảng Markdown gồm các cột: | Mức độ nhận thức | Nội dung / Kỹ năng | Số câu | Câu số | Dạng câu hỏi | theo đúng Thông tư 27/2020/TT-BGDĐT gồm 3 mức: Mức 1 - Nhận biết, Mức 2 - Kết nối/Thông hiểu, Mức 3 - Vận dụng).`
    : '';

  const prompt = `Bạn là chuyên gia giáo dục Tiểu học giàu kinh nghiệm, am hiểu sâu sắc Chương trình Giáo dục phổ thông 2018 và Thông tư 27/2020/TT-BGDĐT.
Hãy biên soạn một PHIẾU BÀI TẬP chất lượng cao, chuẩn sư phạm và sẵn sàng in trên khổ giấy A4 với các thông số sau:

1. THÔNG TIN CHUNG:
- Khối lớp: Lớp ${request.grade}
- Môn học: ${request.subject}
- Tên bài / Chủ đề: ${request.topic}
- Loại phiếu: ${exerciseLabel}
- Đối tượng học sinh: ${targetLabel}
- Thời lượng làm bài: ${request.durationMinutes} phút (Tổng số câu hỏi: đúng ${request.questionCount} câu)
- Các dạng câu hỏi ưu tiên: ${preferredFormatText}
- Chế độ đáp án: ${answerLabel}
${localContextText}
${buildVietnameseInstruction(request)}
${buildImageInstruction(request)}

2. YÊU CẦU ĐỊNH DẠNG BẮT BUỘC (ĐỂ XUẤT FILE WORD .DOCX TỰ ĐỘNG):
- Dòng đầu tiên là tiêu đề phiếu in hoa, bắt đầu bằng dấu \`# \` (Ví dụ: \`# PHIẾU BÀI TẬP MÔN ${request.subject.toUpperCase()} LỚP ${request.grade} -${request.topic.toUpperCase()}\`).
- Chia rõ các phần bằng tiêu đề cấp 2 (\`## \`):
  + \`## I. MỤC TIÊU BÀI HỌC\` (Gạch đầu dòng 2-3 yêu cầu cần đạt ngắn gọn, rõ ràng).
  ${matrixSectionInstruction ? `+ ${matrixSectionInstruction}` : ''}
  + \`## ${request.includeMatrix ? 'III' : 'II'}. ĐỀ BÀI\`
    * Đánh số thứ tự từng câu rõ ràng theo mẫu: **Câu 1 (Mức 1):** ..., **Câu 2 (Mức 1):** ..., **Câu 3 (Mức 2):** ...
    * Luôn có khoảng trắng sau dấu hai chấm.
    * Với câu Nối cột: Bắt buộc kẻ bảng Markdown gồm đúng 2 cột \`| Cột A | Cột B |\`.
    * Với câu Tự luận / Điền lời giải / Sửa lỗi sai: Bắt buộc chèn 2 đến 3 dòng chấm \`........................................................................................\` bên dưới câu hỏi để học sinh có chỗ viết bài trên giấy in.
    * Không sử dụng công thức LaTeX phức tạp; hãy dùng ký hiệu toán học phổ thông dễ đọc cho học sinh tiểu học (như ×, :, ², ³, ≥, ≤, phân số a/b).
  + \`## ${request.includeMatrix ? 'IV' : 'III'}. ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM\`
    * Trình bày chi tiết đáp án cho từng câu từ Câu 1 đến Câu ${request.questionCount}.
    * Sử dụng các nhãn chuẩn như **Đáp án:**, **Bài giải:**, **Giải thích:**, **Lỗi học sinh thường gặp:** (tùy theo chế độ đáp án "${answerLabel}").
  + \`## ${request.includeMatrix ? 'V' : 'IV'}. GỢI Ý SỬ DỤNG CHO GIÁO VIÊN\`
    * Gợi ý ngắn gọn cách tổ chức trên lớp và hỗ trợ học sinh còn lúng túng.`;

  const resultText = await callGeminiRestApi(prompt, apiKey);

  if (onChunk) {
    onChunk(resultText);
  }

  return resultText;
};

export const generateWorksheetContent = generateWorksheet;
export default generateWorksheet;