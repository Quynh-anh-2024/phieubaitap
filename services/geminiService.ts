import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, READING_SYSTEM_INSTRUCTION, SUBJECT_QUALITY_RULES } from '../constants';
import {
    WorksheetRequest,
    EXERCISE_TYPE_OPTIONS,
    DIFFICULTY_OPTIONS,
    STUDENT_TARGET_OPTIONS,
    ANSWER_MODE_OPTIONS,
    QUESTION_FORMAT_OPTIONS,
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

    const isReadingWorksheet = request.exerciseType === 'reading' && request.subject === 'Tiếng Việt';
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
