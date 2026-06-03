import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, READING_SYSTEM_INSTRUCTION, SUBJECT_QUALITY_RULES } from '../constants';
import {
    WorksheetRequest,
    EXERCISE_TYPE_OPTIONS,
    DIFFICULTY_OPTIONS,
    STUDENT_TARGET_OPTIONS,
    ANSWER_MODE_OPTIONS,
    QUESTION_FORMAT_OPTIONS,
    READING_SOURCE_OPTIONS,
    QuestionFormat,
} from '../types';

const getGeminiClient = (apiKey: string) => {
    if (!apiKey) {
        throw new Error("API Key is missing. Please provide a valid API Key.");
    }
    return new GoogleGenAI({ apiKey });
};

const getOptionLabel = <T extends string>(options: { value: T; label: string }[], value: T): string => {
    return options.find((option) => option.value === value)?.label || value;
};

const SUBJECT_DEFAULT_FORMATS: Record<string, QuestionFormat[]> = {
    'Toán': ['multiple_choice', 'fill_blank', 'true_false', 'real_context', 'error_finding', 'short_answer'],
    'Tiếng Việt': ['multiple_choice', 'fill_blank', 'short_answer', 'real_context', 'creative'],
    'Tự nhiên và Xã hội': ['true_false', 'matching', 'short_answer', 'real_context', 'creative'],
    'Đạo đức': ['true_false', 'multiple_choice', 'short_answer', 'real_context', 'creative'],
    'Công nghệ': ['matching', 'ordering', 'true_false', 'short_answer', 'real_context', 'creative'],
    'Tin học': ['matching', 'ordering', 'true_false', 'short_answer', 'real_context', 'error_finding', 'creative'],
    'Khoa học': ['multiple_choice', 'true_false', 'matching', 'short_answer', 'real_context', 'error_finding'],
    'Lịch sử và Địa lý': ['matching', 'multiple_choice', 'fill_blank', 'short_answer', 'real_context', 'creative'],
};

const SUBJECT_MINIMUM_REQUIREMENTS: Record<string, string> = {
    'Toán': `
YÊU CẦU TỐI THIỂU MÔN TOÁN:
- Có câu tính toán cơ bản hoặc điền số.
- Có ít nhất 1 bài toán có lời văn nếu phiếu từ 8 câu trở lên.
- Có câu phân biệt/giải thích quy tắc hoặc nhận diện lỗi thường gặp.
- Nếu phiếu phân hóa hoặc nâng cao, có câu phát hiện lỗi sai, đặt đề toán hoặc bài toán ngược.
`,
    'Tiếng Việt': `
YÊU CẦU TỐI THIỂU MÔN TIẾNG VIỆT:
- Có câu đọc hiểu/tìm chi tiết hoặc hiểu nội dung nếu chủ đề cho phép.
- Có bài luyện từ và câu: tìm từ, đặt câu, dấu câu, sửa câu hoặc nối từ với nghĩa.
- Có phần viết câu/đoạn ngắn nếu phiếu từ 8 câu trở lên hoặc giáo viên chọn vận dụng/sáng tạo.
- Câu hỏi phải có liên hệ hoặc suy luận ở phần vận dụng.
`,
    'Tự nhiên và Xã hội': `
YÊU CẦU TỐI THIỂU MÔN TỰ NHIÊN VÀ XÃ HỘI:
- Có câu nhận biết sự vật/hiện tượng/hành vi.
- Có câu phân biệt hoặc giải thích đơn giản.
- Có ít nhất 1 tình huống đời sống về an toàn, vệ sinh, gia đình, trường học hoặc môi trường nếu phiếu từ 8 câu trở lên.
`,
    'Đạo đức': `
YÊU CẦU TỐI THIỂU MÔN ĐẠO ĐỨC:
- Có câu nhận diện hành vi đúng/sai.
- Có câu giải thích vì sao hành vi nên hoặc không nên làm.
- Có ít nhất 1 tình huống xử lí và 1 câu liên hệ bản thân nếu phiếu từ 8 câu trở lên.
`,
    'Công nghệ': `
YÊU CẦU TỐI THIỂU MÔN CÔNG NGHỆ:
- Có câu về dụng cụ/vật liệu/công dụng.
- Có câu sắp xếp hoặc hoàn thiện quy trình.
- Có câu về an toàn khi thực hành hoặc lựa chọn vật liệu/cách làm phù hợp.
- Nếu phiếu nâng cao, có câu đề xuất sản phẩm/cải tiến sản phẩm.
`,
    'Tin học': `
YÊU CẦU TỐI THIỂU MÔN TIN HỌC:
- Có câu nhận biết công cụ/lệnh/biểu tượng hoặc thao tác.
- Có câu sắp xếp quy trình, chọn thao tác đúng hoặc dự đoán kết quả.
- Có câu an toàn số hoặc bảo vệ thông tin cá nhân nếu phù hợp chủ đề.
- Nếu chủ đề liên quan Scratch/lập trình, bắt buộc có câu sắp xếp lệnh, tìm lỗi hoặc dự đoán kết quả chương trình.
- Nếu phiếu nâng cao/phân hóa, có câu thiết kế sản phẩm số hoặc kịch bản thao tác.
`,
    'Khoa học': `
YÊU CẦU TỐI THIỂU MÔN KHOA HỌC:
- Có câu nhận biết/ phân loại sự vật, hiện tượng hoặc bộ phận.
- Có câu giải thích vì sao hoặc nêu chức năng.
- Có ít nhất 1 tình huống vận dụng về an toàn, sức khỏe, môi trường hoặc hiện tượng đời sống.
- Nếu phiếu nâng cao, có câu dự đoán kết quả thí nghiệm hoặc đề xuất cách kiểm chứng.
`,
    'Lịch sử và Địa lý': `
YÊU CẦU TỐI THIỂU MÔN LỊCH SỬ VÀ ĐỊA LÝ:
- Có câu về nhân vật/sự kiện/địa danh/đặc điểm cơ bản theo chủ đề.
- Có câu hiểu ý nghĩa, nguyên nhân - kết quả hoặc đặc điểm vùng miền.
- Có câu liên hệ địa phương, đọc thông tin/bảng/lược đồ dạng mô tả hoặc giới thiệu quê hương nếu phù hợp.
`,
};

const getDifficultyDistribution = (request: WorksheetRequest): string => {
    if (request.studentTarget === 'support') {
        return 'Phân bổ ưu tiên: khoảng 60% Nhận biết, 30% Thông hiểu, 10% Vận dụng nhẹ; có mẫu/gợi ý ở câu khó.';
    }
    if (request.studentTarget === 'good') {
        return 'Phân bổ ưu tiên: khoảng 20% Nhận biết, 30% Thông hiểu, 35% Vận dụng, 15% Thử thách; tăng giải thích, tìm lỗi, sáng tạo.';
    }
    if (request.difficultyLevel === 'basic') {
        return 'Phân bổ ưu tiên: khoảng 60% Nhận biết, 30% Thông hiểu, 10% Vận dụng nhẹ.';
    }
    if (request.difficultyLevel === 'advanced') {
        return 'Phân bổ ưu tiên: khoảng 20% Nhận biết, 30% Thông hiểu, 35% Vận dụng, 15% Thử thách.';
    }
    if (request.difficultyLevel === 'differentiated' || request.studentTarget === 'mixed' || request.exerciseType === 'differentiated') {
        return 'Phân bổ bắt buộc: chia rõ A. Củng cố cơ bản, B. Luyện tập chuẩn, C. Vận dụng, D. Thử thách nếu có; mỗi phần phải khác nhau rõ về yêu cầu tư duy.';
    }
    return 'Phân bổ ưu tiên: khoảng 40% Nhận biết, 35% Thông hiểu, 25% Vận dụng.';
};

const getQuestionCountPlan = (request: WorksheetRequest): string => {
    const count = request.questionCount || 10;
    if (count <= 6) {
        return 'Gợi ý chia câu: 2 câu Nhận biết, 2 câu Thông hiểu, 2 câu Vận dụng; nếu là kiểm tra nhanh thì không cần phần thử thách dài.';
    }
    if (count <= 8) {
        return 'Gợi ý chia câu: 3 câu Cơ bản, 2 câu Thông hiểu, 2 câu Vận dụng, 1 câu Thử thách nếu giáo viên yêu cầu.';
    }
    if (count <= 10) {
        return 'Gợi ý chia câu: 3 câu Cơ bản, 3 câu Chuẩn/Thông hiểu, 3 câu Vận dụng, 1 câu Thử thách nếu có.';
    }
    if (count <= 12) {
        return 'Gợi ý chia câu: 3 câu Cơ bản, 4 câu Luyện tập chuẩn, 3 câu Vận dụng, 2 câu Thử thách nếu có.';
    }
    if (count <= 15) {
        return 'Gợi ý chia câu: 4 câu Cơ bản, 5 câu Luyện tập chuẩn, 4 câu Vận dụng, 2 câu Thử thách nếu có.';
    }
    return 'Gợi ý chia câu: 5-6 câu Cơ bản, 6-7 câu Luyện tập chuẩn, 5 câu Vận dụng, 2 câu Thử thách nếu có; tránh phiếu quá dài gây mệt cho học sinh.';
};

const getFormatLabels = (formats: QuestionFormat[]): string => {
    return formats
        .map((format) => getOptionLabel(QUESTION_FORMAT_OPTIONS, format))
        .join(', ');
};

const getSelectedFormats = (request: WorksheetRequest): QuestionFormat[] => {
    const selected = request.preferredFormats || [];
    const subjectDefaults = SUBJECT_DEFAULT_FORMATS[request.subject] || ['multiple_choice', 'true_false', 'fill_blank', 'short_answer', 'real_context'];
    const merged = [...selected, ...subjectDefaults];
    return Array.from(new Set(merged));
};

const getSubjectQualityBlock = (subject: string): string => {
    return SUBJECT_QUALITY_RULES[subject] || 'Áp dụng quy tắc chung: đúng lớp, đúng chủ đề, phân hóa rõ, đa dạng dạng bài, có đáp án chấm được.';
};

const getSubjectMinimumRequirements = (subject: string): string => {
    return SUBJECT_MINIMUM_REQUIREMENTS[subject] || 'Yêu cầu tối thiểu: có câu nhận biết, thông hiểu, vận dụng và đáp án rõ ràng.';
};


const clipReadingText = (text?: string): string => {
    const clean = (text || '').trim();
    if (!clean) return '';
    return clean.length > 6000 ? `${clean.slice(0, 6000)}\n[Đã rút gọn văn bản giáo viên nhập do quá dài. Khi tạo phiếu, chỉ dùng phần văn bản trên và không tự thêm nguồn khác.]` : clean;
};


const buildReadingCitationLine = (request: WorksheetRequest): string => {
    const manualLine = (request.readingCitationLine || '').trim();
    if (manualLine) return manualLine;

    const grade = (request.readingBookGrade || '').trim();
    const year = (request.readingBookYear || '').trim();
    const title = (request.readingBookTitle || '').trim();
    const lesson = (request.readingLessonTitle || '').trim();

    if (request.readingSource !== 'verified_textbook_excerpt' || !grade || !year) return '';

    const detailParts: string[] = [];
    if (title) detailParts.push(title);
    if (lesson) detailParts.push(`bài "${lesson}"`);
    const detail = detailParts.length ? ` (${detailParts.join(', ')})` : '';
    return `Trích từ SGK Tiếng Việt lớp ${grade}, năm ${year}${detail}`;
};

const getVietnameseGradeReadingGuide = (grade: string): string => {
    switch (grade) {
        case '1':
            return 'Lớp 1: ngữ liệu rất ngắn, câu đơn giản, ưu tiên đọc tiếng/từ/câu, tìm chi tiết trực tiếp, nối, điền tiếng/từ, viết từ hoặc 1 câu ngắn; không yêu cầu phân tích.';
        case '2':
            return 'Lớp 2: ngữ liệu ngắn, gần gũi; câu hỏi tìm chi tiết, hiểu nghĩa từ đơn giản, đặt câu, viết 2-3 câu theo gợi ý.';
        case '3':
            return 'Lớp 3: ngữ liệu vừa phải; có tìm chi tiết, hiểu nội dung, giải nghĩa từ trong ngữ cảnh, đặt câu, sửa câu, viết đoạn 4-5 câu.';
        case '4':
            return 'Lớp 4: ngữ liệu có nội dung sâu hơn nhưng vẫn vừa sức; tăng suy luận, nhận xét nhân vật/sự việc, luyện từ và câu theo lớp, viết đoạn có lí do/cảm xúc.';
        case '5':
            return 'Lớp 5: ngữ liệu có thông điệp rõ; tăng hiểu chủ đề, suy luận, liên hệ, liên kết câu/vốn từ/biện pháp tu từ phù hợp, viết đoạn/bài ngắn theo yêu cầu.';
        default:
            return 'Ngữ liệu và câu hỏi phải phù hợp học sinh tiểu học, tăng dần độ khó nhưng không hàn lâm.';
    }
};

const getVietnameseReadingSourceBlock = (request: WorksheetRequest): string => {
    if (request.subject !== 'Tiếng Việt') return '';

    const source = request.readingSource || 'auto_new';
    const sourceLabel = getOptionLabel(READING_SOURCE_OPTIONS, source);
    const note = (request.readingSourceNote || '').trim();
    const providedText = clipReadingText(request.readingText);
    const citationLine = buildReadingCitationLine(request);
    const gradeGuide = getVietnameseGradeReadingGuide(request.grade);

    const common = `
KHÓA CHUẨN DỮ LIỆU ĐỌC HIỂU TIẾNG VIỆT:
- Nguồn ngữ liệu giáo viên chọn: ${sourceLabel}.
- ${gradeGuide}
- Phần kiến thức, câu hỏi Luyện từ và câu, Viết, đáp án và tiêu chí chấm phải bám Tiếng Việt Kết nối tri thức hiện hành của lớp ${request.grade}; ngữ liệu đọc chỉ là văn bản luyện đọc hiểu.
- Không tự lấy/sao chép nguyên văn văn bản từ internet, SGK cũ, PDF scan hoặc website nếu giáo viên không dán văn bản cụ thể.
- Không bịa tên sách, tên tác giả, số trang, nguồn xuất bản. Nếu chỉ mô phỏng phong cách thì ghi “Nguồn ngữ liệu: Văn bản mới theo phong cách trong sáng, giản dị”.
- Chỉ được ghi dòng “Trích từ SGK Tiếng Việt lớp..., năm...” khi giáo viên chọn nguồn “Trích từ SGK cũ đã kiểm duyệt”, có dán văn bản và có thông tin lớp/năm xuất bản.
- Nếu dùng văn bản dân gian, có thể ghi “phỏng theo truyện dân gian/đồng dao/ca dao” khi phù hợp; không gán tác giả cụ thể nếu không chắc.
- Ghi rõ trong phiếu: “Nguồn ngữ liệu” theo đúng lựa chọn, nhưng tránh khẳng định sai về bản quyền/nguồn.
${citationLine ? `- Dòng trích nguồn bắt buộc đặt ngay dưới bài đọc: ${citationLine}` : ''}
${note ? `- Ghi chú của giáo viên về nguồn/yêu cầu: ${note}` : ''}`;

    if (source === 'verified_textbook_excerpt') {
        if (providedText && citationLine) {
            return `${common}

VĂN BẢN TRÍCH TỪ SGK CŨ ĐÃ KIỂM DUYỆT - BẮT BUỘC BÁM VÀO VĂN BẢN NÀY:
<<<VAN_BAN_TRICH_SGK_CU_DA_KIEM_DUYET
${providedText}
VAN_BAN_TRICH_SGK_CU_DA_KIEM_DUYET>>>
Yêu cầu bắt buộc:
- Dùng đúng văn bản trên để tạo phần Đọc hiểu; không thay bằng bài đọc khác.
- Ngay dưới bài đọc, ghi đúng dòng: “${citationLine}”.
- Không tự bổ sung tên sách, tác giả, số trang hoặc nguồn khác nếu giáo viên không nhập.
- Phần câu hỏi kiến thức vẫn bám Tiếng Việt Kết nối tri thức hiện hành của lớp ${request.grade}.`;
        }
        return `${common}

Giáo viên chọn “Trích từ SGK cũ đã kiểm duyệt” nhưng chưa đủ văn bản hoặc chưa đủ lớp/năm xuất bản. Không được ghi “Trích từ...”. Hãy tạo văn bản mới theo chủ đề và ghi “Nguồn ngữ liệu: Văn bản mới do hệ thống biên soạn theo chủ đề”.`;
    }

    if (source === 'teacher_provided') {
        if (providedText) {
            return `${common}

VĂN BẢN GIÁO VIÊN CUNG CẤP - BẮT BUỘC BÁM VÀO VĂN BẢN NÀY:
<<<VAN_BAN_GIAO_VIEN_CUNG_CAP
${providedText}
VAN_BAN_GIAO_VIEN_CUNG_CAP>>>
Yêu cầu: dùng đúng văn bản trên để tạo phần Đọc hiểu; không thay bằng bài đọc khác. Có thể chỉnh rất nhẹ lỗi chính tả/dấu câu nếu cần, nhưng không làm thay đổi nội dung. Nếu không có thông tin SGK lớp/năm xuất bản, không ghi “Trích từ SGK...”.`;
        }
        return `${common}

Giáo viên chọn “Tự nhập bài đọc đã kiểm duyệt” nhưng chưa dán văn bản. Hãy tự tạo một văn bản mới phù hợp chủ đề, không sao chép internet, và ghi rõ “Nguồn ngữ liệu: Văn bản mới do hệ thống biên soạn theo chủ đề”.`;
    }

    if (source === 'old_textbook_style') {
        return `${common}

YÊU CẦU RIÊNG KHI CHỌN PHONG CÁCH SGK CŨ TRƯỚC 2006:
- Chỉ mô phỏng phong cách: câu văn giản dị, ấm áp, gần gũi gia đình - nhà trường - quê hương - thiên nhiên - lao động - tình bạn.
- Không sao chép nguyên văn bài đọc cũ, không ghi là trích từ SGK cũ, không nêu tên bài/tác giả/sách nếu không được giáo viên cung cấp.
- Bài đọc phải là văn bản mới, có thể có cảm giác quen thuộc như bài đọc xưa nhưng nội dung phải tự biên soạn.`;
    }

    if (source === 'folk_public') {
        return `${common}

YÊU CẦU RIÊNG KHI CHỌN NGỮ LIỆU DÂN GIAN:
- Ưu tiên truyện dân gian, ngụ ngôn, đồng dao, ca dao, tục ngữ phù hợp lứa tuổi; có thể kể lại/chuyển thể ngắn bằng lời văn mới.
- Không dùng dị bản quá dài hoặc có chi tiết không phù hợp học sinh tiểu học.
- Câu hỏi phải khai thác bài học, từ ngữ, nhân vật/sự việc và liên hệ bản thân.`;
    }

    return `${common}

YÊU CẦU RIÊNG KHI TỰ TẠO VĂN BẢN MỚI:
- Tự biên soạn bài đọc mới theo chủ đề giáo viên nhập, độ dài vừa sức lớp ${request.grade}, ngôn ngữ trong sáng.
- Bài đọc cần có chi tiết đủ rõ để tạo câu hỏi đọc hiểu, luyện từ và câu, viết; không quá chung chung.`;
};

const buildWorksheetPrompt = (request: WorksheetRequest): string => {
    const exerciseTypeLabel = getOptionLabel(EXERCISE_TYPE_OPTIONS, request.exerciseType);
    const difficultyLabel = getOptionLabel(DIFFICULTY_OPTIONS, request.difficultyLevel);
    const studentTargetLabel = getOptionLabel(STUDENT_TARGET_OPTIONS, request.studentTarget);
    const answerModeLabel = getOptionLabel(ANSWER_MODE_OPTIONS, request.answerMode);
    const selectedFormats = getSelectedFormats(request);
    const formatLabel = getFormatLabels(selectedFormats);
    const subjectQualityBlock = getSubjectQualityBlock(request.subject);
    const subjectMinimumRequirements = getSubjectMinimumRequirements(request.subject);
    const difficultyDistribution = getDifficultyDistribution(request);
    const questionCountPlan = getQuestionCountPlan(request);
    const vietnameseReadingSourceBlock = getVietnameseReadingSourceBlock(request);

    return `
Hãy tạo phiếu bài tập ôn luyện chất lượng cao theo đúng thông tin sau:
- Môn học: ${request.subject}
- Lớp: ${request.grade}
- Bài/chủ đề: "${request.topic}"
- Loại phiếu: ${exerciseTypeLabel}
- Mức độ phiếu: ${difficultyLabel}
- Đối tượng học sinh: ${studentTargetLabel}
- Số lượng câu hỏi mong muốn: ${request.questionCount || 10} câu
- Dạng bài cần ưu tiên/kết hợp: ${formatLabel}
- Kiểu đáp án: ${answerModeLabel}
- Có bảng ma trận nhỏ: ${request.includeMatrix ? 'Có' : 'Không'}
- Có phần thử thách dành cho học sinh khá, giỏi: ${request.includeChallenge ? 'Có' : 'Không'}
- Có gợi ý sử dụng cho giáo viên: ${request.includeTeacherGuide ? 'Có' : 'Không'}
- Có mục học sinh tự đánh giá và PHHS theo dõi: ${request.includeSelfAssessment ? 'Có' : 'Không'}
- Có liên hệ thực tế địa phương/vùng cao: ${request.includeLocalContext ? 'Có' : 'Không'}

${subjectQualityBlock}
${subjectMinimumRequirements}
${vietnameseReadingSourceBlock}

PHÂN HÓA BẮT BUỘC:
${difficultyDistribution}
${questionCountPlan}

YÊU CẦU KIỂM SOÁT CHẤT LƯỢNG KIẾN THỨC:
1. Câu hỏi phải bám sát bài/chủ đề "${request.topic}" và phù hợp lớp ${request.grade}; không tạo kiến thức ngoài chương trình tiểu học.
2. Mỗi câu phải có giá trị ôn luyện rõ: kiểm tra kiến thức nền, hiểu bản chất, vận dụng hoặc phát triển tư duy.
3. Ghi rõ mức độ trong từng câu hoặc từng phần: Nhận biết, Thông hiểu, Vận dụng, Thử thách.
4. Không dùng câu hỏi chung chung như “em hãy nêu cảm nhận” nếu không có tiêu chí/gợi ý cụ thể.
5. Câu vận dụng phải có tình huống, dữ kiện hoặc nhiệm vụ thực tế; không gọi câu nhớ lại hoặc phép tính đơn giản là vận dụng.
6. Câu thử thách phải phân hóa nhưng không vượt chương trình; có thể yêu cầu giải thích, tìm lỗi, thiết kế, đặt đề hoặc liên hệ.
7. Trắc nghiệm phải có đúng 1 đáp án; phương án nhiễu phải hợp lí, không vô nghĩa.
8. Nếu có nối cột, dùng bảng 3 cột: Cột A, Cột B, Trả lời.
9. Nếu có sắp xếp thứ tự, các bước phải cùng một quy trình thật, không trộn bước không liên quan.
10. Đáp án phải đủ rõ để giáo viên, học sinh và phụ huynh đối chiếu; với câu mở phải có tiêu chí chấp nhận.

YÊU CẦU TRÌNH BÀY SẠCH ĐỂ XUẤT WORD:
- Không dùng LaTeX. Không dùng ký tự đô la, dấu gạch chéo ngược, dòng phân cách ---, ký hiệu căn bảng :--- trong đề và đáp án.
- Phép tính viết bằng văn bản thường: 7 × 8, 42 : 7, 1/2, 15 m².
- Ma trận câu hỏi trình bày thành bảng rõ ràng để khi xuất Word nằm trong khung.
- Bài nối cột bắt buộc có bảng 3 cột: Cột A, Cột B, Trả lời. Cột Trả lời để học sinh ghi 1 - ...., 2 - ....

CẤU TRÚC CẦN TRẢ VỀ:
# PHIẾU BÀI TẬP ${request.subject.toUpperCase()} - LỚP ${request.grade}
Bài/Chủ đề: ${request.topic}
Loại phiếu: ${exerciseTypeLabel}
Đối tượng: ${studentTargetLabel}

## I. MỤC TIÊU PHIẾU HỌC TẬP
## II. MA TRẬN CÂU HỎI
## III. ĐỀ BÀI
## IV. ĐÁP ÁN VÀ HƯỚNG DẪN
## V. GỢI Ý SỬ DỤNG CHO GIÁO VIÊN
## VI. GỢI Ý PHỤ HUYNH THEO DÕI CON HỌC Ở NHÀ
## VII. HỌC SINH TỰ ĐÁNH GIÁ

Trước khi trả kết quả, hãy tự kiểm định: đúng môn, đúng lớp, đúng chủ đề, đủ phân hóa, đủ dạng bài phù hợp môn, không sai kiến thức, không trùng lặp, không ký tự lạ, đáp án khớp đề.
`;
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
    try {
        const client = getGeminiClient(apiKey);
        await client.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: 'Test',
        });
        return true;
    } catch (error) {
        console.error("API Key Validation Failed:", error);
        return false;
    }
};

export const generateWorksheet = async (request: WorksheetRequest, apiKey: string): Promise<ReadableStream<string>> => {
    const client = getGeminiClient(apiKey);
    const model = 'gemini-3-flash-preview';

    const isReadingWorksheet = request.subject === 'Tiếng Việt';
    const systemInstruction = isReadingWorksheet ? READING_SYSTEM_INSTRUCTION : SYSTEM_INSTRUCTION;
    const userPrompt = buildWorksheetPrompt(request);

    try {
        const responseStream = await client.models.generateContentStream({
            model: model,
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.55,
            }
        });

        return new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of responseStream) {
                        const text = chunk.text;
                        if (text) {
                            controller.enqueue(text);
                        }
                    }
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            }
        });

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};
