export enum GradeLevel {
  GRADE_1 = '1',
  GRADE_2 = '2',
  GRADE_3 = '3',
  GRADE_4 = '4',
  GRADE_5 = '5',
}

export const SUBJECTS_BY_GRADE: Record<GradeLevel, string[]> = {
  [GradeLevel.GRADE_1]: ['Toán', 'Tiếng Việt', 'Tự nhiên và Xã hội', 'Đạo đức'],
  [GradeLevel.GRADE_2]: ['Toán', 'Tiếng Việt', 'Tự nhiên và Xã hội', 'Đạo đức'],
  [GradeLevel.GRADE_3]: ['Toán', 'Tiếng Việt', 'Tự nhiên và Xã hội', 'Đạo đức', 'Công nghệ', 'Tin học'],
  [GradeLevel.GRADE_4]: ['Toán', 'Tiếng Việt', 'Đạo đức', 'Công nghệ', 'Tin học', 'Khoa học', 'Lịch sử và Địa lý'],
  [GradeLevel.GRADE_5]: ['Toán', 'Tiếng Việt', 'Đạo đức', 'Công nghệ', 'Tin học', 'Khoa học', 'Lịch sử và Địa lý'],
};

export type ExerciseType =
  | 'general'
  | 'reading'
  | 'lesson_practice'
  | 'weekly_practice'
  | 'review'
  | 'quick_test'
  | 'remedial'
  | 'advanced'
  | 'homework'
  | 'differentiated';

export type DifficultyLevel = 'basic' | 'standard' | 'advanced' | 'differentiated';
export type StudentTarget = 'support' | 'standard' | 'good' | 'mixed';
export type AnswerMode = 'short' | 'explain' | 'rubric';
export type ReadingSource =
  | 'auto_new'
  | 'old_textbook_style'
  | 'folk_public'
  | 'teacher_provided'
  | 'verified_textbook_excerpt';

export type QuestionFormat =
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'matching'
  | 'ordering'
  | 'short_answer'
  | 'real_context'
  | 'error_finding'
  | 'creative';

export interface OptionItem<T extends string> {
  value: T;
  label: string;
  description?: string;
}

export const EXERCISE_TYPE_OPTIONS: OptionItem<ExerciseType>[] = [
  { value: 'general', label: 'Ôn tập chung', description: 'Tạo phiếu luyện tập tổng hợp theo bài/chủ đề.' },
  { value: 'lesson_practice', label: 'Củng cố sau bài học', description: 'Câu ngắn, bám sát kiến thức vừa học.' },
  { value: 'weekly_practice', label: 'Luyện tập cuối tuần', description: 'Tổng hợp kiến thức, có câu kết nối thực tế.' },
  { value: 'review', label: 'Ôn giữa kì/cuối kì', description: 'Bao quát chủ đề, có ma trận rõ ràng.' },
  { value: 'quick_test', label: 'Kiểm tra nhanh', description: 'Ít câu, chấm nhanh, dùng đầu/cuối tiết.' },
  { value: 'remedial', label: 'Phụ đạo', description: 'Dành cho học sinh cần hỗ trợ, có gợi ý.' },
  { value: 'advanced', label: 'Bồi dưỡng', description: 'Dành cho học sinh khá, giỏi.' },
  { value: 'homework', label: 'Giao về nhà', description: 'Vừa sức, có tự đánh giá.' },
  { value: 'differentiated', label: 'Phân hóa cả lớp', description: 'Có phần cơ bản, chuẩn, vận dụng, thử thách.' },
  { value: 'reading', label: 'Tiếng Việt đọc hiểu', description: 'Riêng môn Tiếng Việt: đọc hiểu, luyện từ và câu, viết.' },
];

export const DIFFICULTY_OPTIONS: OptionItem<DifficultyLevel>[] = [
  { value: 'basic', label: 'Cơ bản', description: 'Ưu tiên nhận biết, làm theo mẫu, củng cố kiến thức nền.' },
  { value: 'standard', label: 'Chuẩn', description: 'Cân bằng nhận biết, thông hiểu và vận dụng.' },
  { value: 'advanced', label: 'Nâng cao', description: 'Tăng câu tình huống, giải thích, tìm lỗi và sáng tạo.' },
  { value: 'differentiated', label: 'Phân hóa', description: 'Một phiếu có nhiều tầng độ khó cho các nhóm học sinh.' },
];

export const STUDENT_TARGET_OPTIONS: OptionItem<StudentTarget>[] = [
  { value: 'support', label: 'Cần hỗ trợ', description: 'Câu ngắn, rõ, có mẫu/gợi ý, tránh đánh đố.' },
  { value: 'standard', label: 'Đạt chuẩn', description: 'Bám sát yêu cầu cần đạt của bài học.' },
  { value: 'good', label: 'Khá, giỏi', description: 'Tăng vận dụng, phân tích, giải thích và sáng tạo.' },
  { value: 'mixed', label: 'Cả lớp', description: 'Phiếu phân hóa để học sinh nào cũng có phần phù hợp.' },
];

export const ANSWER_MODE_OPTIONS: OptionItem<AnswerMode>[] = [
  { value: 'short', label: 'Chỉ đáp án', description: 'Ngắn gọn, phù hợp trắc nghiệm và chấm nhanh.' },
  { value: 'explain', label: 'Đáp án + giải thích', description: 'Có lí do chọn đáp án, giúp học sinh tự sửa lỗi.' },
  { value: 'rubric', label: 'Đáp án + hướng dẫn chấm', description: 'Có thang/gợi ý chấm cho tự luận và vận dụng.' },
];

export const READING_SOURCE_OPTIONS: OptionItem<ReadingSource>[] = [
  {
    value: 'auto_new',
    label: 'Tự tạo văn bản mới',
    description: 'AI tự biên soạn bài đọc mới, phù hợp lớp học và chủ đề, không sao chép văn bản có bản quyền.',
  },
  {
    value: 'old_textbook_style',
    label: 'Phong cách SGK cũ trước 2006',
    description: 'Chỉ lấy phong cách trong sáng, gần gũi của ngữ liệu cũ; không sao chép nguyên văn từ sách/PDF trên mạng.',
  },
  {
    value: 'folk_public',
    label: 'Dân gian, đồng dao, ca dao',
    description: 'Ưu tiên truyện dân gian, đồng dao, ca dao, tục ngữ phù hợp học sinh tiểu học.',
  },
  {
    value: 'teacher_provided',
    label: 'Tự nhập bài đọc đã kiểm duyệt',
    description: 'Giáo viên dán văn bản đọc hiểu cụ thể; app chỉ tạo câu hỏi theo Kết nối tri thức hiện hành.',
  },
  {
    value: 'verified_textbook_excerpt',
    label: 'Trích từ SGK cũ đã kiểm duyệt',
    description: 'Giáo viên dán nguyên văn bài đọc và điền SGK lớp/năm xuất bản; app mới được ghi dòng “Trích từ...”.',
  },
];

export const QUESTION_FORMAT_OPTIONS: OptionItem<QuestionFormat>[] = [
  { value: 'multiple_choice', label: 'Trắc nghiệm' },
  { value: 'true_false', label: 'Đúng/Sai' },
  { value: 'fill_blank', label: 'Điền khuyết' },
  { value: 'matching', label: 'Nối' },
  { value: 'ordering', label: 'Sắp xếp thứ tự' },
  { value: 'short_answer', label: 'Tự luận ngắn' },
  { value: 'real_context', label: 'Tình huống thực tế' },
  { value: 'error_finding', label: 'Phát hiện lỗi sai' },
  { value: 'creative', label: 'Sáng tạo/mở rộng' },
];

export interface WorksheetRequest {
  grade: GradeLevel;
  subject: string;
  topic: string;
  exerciseType: ExerciseType;
  difficultyLevel: DifficultyLevel;
  studentTarget: StudentTarget;
  questionCount: number;
  answerMode: AnswerMode;
  preferredFormats: QuestionFormat[];
  includeMatrix: boolean;
  includeChallenge: boolean;
  includeTeacherGuide: boolean;
  includeSelfAssessment: boolean;
  includeLocalContext: boolean;
  readingSource?: ReadingSource;
  readingText?: string;
  readingSourceNote?: string;
  readingBookGrade?: string;
  readingBookYear?: string;
  readingBookTitle?: string;
  readingLessonTitle?: string;
  readingCitationLine?: string;
  lockReadingSource?: boolean;
}

export interface WorksheetResponse {
  content: string;
}
