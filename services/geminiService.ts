import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, READING_SYSTEM_INSTRUCTION } from '../constants';
import {
    WorksheetRequest,
    EXERCISE_TYPE_OPTIONS,
    DIFFICULTY_OPTIONS,
    STUDENT_TARGET_OPTIONS,
    ANSWER_MODE_OPTIONS,
    QUESTION_FORMAT_OPTIONS,
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

const buildWorksheetPrompt = (request: WorksheetRequest): string => {
    const exerciseTypeLabel = getOptionLabel(EXERCISE_TYPE_OPTIONS, request.exerciseType);
    const difficultyLabel = getOptionLabel(DIFFICULTY_OPTIONS, request.difficultyLevel);
    const studentTargetLabel = getOptionLabel(STUDENT_TARGET_OPTIONS, request.studentTarget);
    const answerModeLabel = getOptionLabel(ANSWER_MODE_OPTIONS, request.answerMode);
    const selectedFormats = (request.preferredFormats || [])
        .map((format) => getOptionLabel(QUESTION_FORMAT_OPTIONS, format))
        .join(', ') || 'Trắc nghiệm, Đúng/Sai, Điền khuyết, Tự luận ngắn, Tình huống thực tế';

    return `
Hãy tạo phiếu bài tập theo thông tin sau:
- Môn học: ${request.subject}
- Lớp: ${request.grade}
- Bài/chủ đề: "${request.topic}"
- Loại phiếu: ${exerciseTypeLabel}
- Mức độ phiếu: ${difficultyLabel}
- Đối tượng học sinh: ${studentTargetLabel}
- Số lượng câu hỏi mong muốn: ${request.questionCount || 10} câu
- Dạng bài ưu tiên: ${selectedFormats}
- Kiểu đáp án: ${answerModeLabel}
- Có bảng ma trận nhỏ: ${request.includeMatrix ? 'Có' : 'Không'}
- Có phần thử thách dành cho học sinh khá, giỏi: ${request.includeChallenge ? 'Có' : 'Không'}
- Có gợi ý sử dụng cho giáo viên: ${request.includeTeacherGuide ? 'Có' : 'Không'}
- Có mục học sinh tự đánh giá: ${request.includeSelfAssessment ? 'Có' : 'Không'}
- Có liên hệ thực tế địa phương/vùng cao: ${request.includeLocalContext ? 'Có' : 'Không'}

Yêu cầu cụ thể:
1. Tạo đúng số lượng câu hỏi đã yêu cầu, trừ khi cần chia nhỏ thành bài tập con thì vẫn phải đảm bảo độ dài tương đương.
2. Không tạo toàn bộ phiếu chỉ bằng trắc nghiệm. Hãy ưu tiên phối hợp các dạng bài giáo viên đã chọn.
3. Độ khó phải tăng dần, có phân hóa rõ giữa phần cơ bản, chuẩn, vận dụng và thử thách nếu có.
4. Câu hỏi vận dụng phải gắn với tình huống thực tế, gần gũi học sinh tiểu học.
5. Nếu là môn Tin học, cần có câu thao tác thực hành, tình huống an toàn số và câu vận dụng/sản phẩm số nếu phù hợp với chủ đề.
6. Trình bày đẹp bằng Markdown, dễ xuất sang Word.
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
                temperature: 0.65,
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
