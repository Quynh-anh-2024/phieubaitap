export enum GradeLevel {
  GRADE_1 = '1',
  GRADE_2 = '2',
  GRADE_3 = '3',
  GRADE_4 = '4',
  GRADE_5 = '5',
}

export interface OptionItem<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

export type ExerciseType =
  | 'weekly_practice'
  | 'quick_test'
  | 'review'
  | 'homework';

export type StudentTarget =
  | 'support'
  | 'standard'
  | 'mixed'
  | 'advanced';

export type AnswerMode =
  | 'short'
  | 'explain'
  | 'detailed';

export type QuestionFormat =
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'matching'
  | 'short_answer'
  | 'real_context'
  | 'error_finding'
  | 'creative';

export type VietnameseScope =
  | 'language'
  | 'reading'
  | 'comprehensive';

export type ReadingSource =
  | 'auto_new'
  | 'old_textbook_style'
  | 'teacher_provided'
  | 'verified_textbook_excerpt';

export type ImageMode =
  | 'auto'
  | 'visual_focus'
  | 'none';

export const SUBJECTS_BY_GRADE: Record<GradeLevel, string[]> = {
  [GradeLevel.GRADE_1]: [
    'Toán',
    'Tiếng Việt',
    'Tự nhiên và Xã hội',
    'Đạo đức',
    'Hoạt động trải nghiệm',
    'Mĩ thuật',
    'Tiếng Anh',
  ],
  [GradeLevel.GRADE_2]: [
    'Toán',
    'Tiếng Việt',
    'Tự nhiên và Xã hội',
    'Đạo đức',
    'Hoạt động trải nghiệm',
    'Mĩ thuật',
    'Tiếng Anh',
  ],
  [GradeLevel.GRADE_3]: [
    'Toán',
    'Tiếng Việt',
    'Tin học',
    'Công nghệ',
    'Tự nhiên và Xã hội',
    'Đạo đức',
    'Hoạt động trải nghiệm',
    'Mĩ thuật',
    'Tiếng Anh',
  ],
  [GradeLevel.GRADE_4]: [
    'Toán',
    'Tiếng Việt',
    'Tin học',
    'Công nghệ',
    'Khoa học',
    'Lịch sử và Địa lí',
    'Đạo đức',
    'Hoạt động trải nghiệm',
    'Mĩ thuật',
    'Tiếng Anh',
  ],
  [GradeLevel.GRADE_5]: [
    'Toán',
    'Tiếng Việt',
    'Tin học',
    'Công nghệ',
    'Khoa học',
    'Lịch sử và Địa lí',
    'Đạo đức',
    'Hoạt động trải nghiệm',
    'Mĩ thuật',
    'Tiếng Anh',
  ],
};

export const EXERCISE_TYPE_OPTIONS: OptionItem<ExerciseType>[] = [
  {
    value: 'weekly_practice',
    label: 'Phiếu luyện tập tuần / bài học',
    description: 'Củng cố kiến thức vừa học, cân đối các mức độ nhận thức.',
  },
  {
    value: 'quick_test',
    label: 'Kiểm tra nhanh (10 - 15 phút)',
    description: 'Ngắn gọn, tập trung vào trọng tâm bài học để đánh giá nhanh.',
  },
  {
    value: 'review',
    label: 'Ôn tập chủ đề / Định kì',
    description: 'Tổng hợp kiến thức theo giai đoạn, có phân hóa và ma trận đi kèm.',
  },
  {
    value: 'homework',
    label: 'Phiếu tự học / Cuối tuần',
    description: 'Nhẹ nhàng, gắn với thực tế, có hướng dẫn để học sinh tự hoàn thành.',
  },
];

export const STUDENT_TARGET_OPTIONS: OptionItem<StudentTarget>[] = [
  {
    value: 'mixed',
    label: 'Phân hóa chung cả lớp',
    description: 'Kết hợp câu cơ bản (Mức 1, 2) và câu vận dụng (Mức 3) cho toàn lớp.',
  },
  {
    value: 'support',
    label: 'Hỗ trợ học sinh còn chậm',
    description: 'Câu lệnh ngắn, tường minh, chia nhỏ bước làm, ưu tiên nhận biết - thông hiểu.',
  },
  {
    value: 'standard',
    label: 'Chuẩn yêu cầu cần đạt',
    description: 'Bám sát chuẩn kiến thức kĩ năng chương trình GDPT 2018.',
  },
  {
    value: 'advanced',
    label: 'Nâng cao & Phát triển năng lực',
    description: 'Tăng cường bài toán có lời văn, tư duy logic, xử lý tình huống thực tiễn.',
  },
];

export const ANSWER_MODE_OPTIONS: OptionItem<AnswerMode>[] = [
  {
    value: 'explain',
    label: 'Đáp án kèm giải thích chi tiết',
    description: 'Có lời giải, giải thích ngắn gọn và lưu ý lỗi học sinh hay mắc.',
  },
  {
    value: 'short',
    label: 'Đáp án ngắn gọn (Chấm nhanh)',
    description: 'Chỉ hiển thị kết quả và biểu điểm gợi ý để giáo viên đối chiếu nhanh.',
  },
  {
    value: 'detailed',
    label: 'Đáp án + Hướng dẫn sư phạm & PHHS',
    description: 'Đầy đủ lời giải, phân tích lỗi sai phổ biến và gợi ý phối hợp phụ huynh.',
  },
];

export const VIETNAMESE_SCOPE_OPTIONS: OptionItem<VietnameseScope>[] = [
  {
    value: 'language',
    label: 'Luyện từ và câu / Chính tả / Viết đoạn',
    description: 'Tập trung vào kiến thức tiếng Việt, từ ngữ, câu và thực hành viết ngắn.',
  },
  {
    value: 'reading',
    label: 'Đọc hiểu văn bản',
    description: 'Gồm ngữ liệu đọc hiểu và hệ thống câu hỏi trắc nghiệm + tự luận bám sát bài đọc.',
  },
  {
    value: 'comprehensive',
    label: 'Tổng hợp (Đọc hiểu + Luyện từ và câu + Viết)',
    description: 'Cấu trúc phiếu hoàn chỉnh gồm bài đọc, câu hỏi đọc hiểu, từ câu và viết.',
  },
];

export const READING_SOURCE_OPTIONS: OptionItem<ReadingSource>[] = [
  {
    value: 'auto_new',
    label: 'AI tự sáng tác ngữ liệu mới (An toàn bản quyền)',
    description: 'Tự viết văn bản mới phù hợp lứa tuổi, trong sáng, giàu tính giáo dục.',
  },
  {
    value: 'old_textbook_style',
    label: 'Phong cách SGK cũ trước 2006',
    description: 'Văn phong giản dị, giàu hình ảnh quê hương, thiên nhiên, tình cảm gia đình, học đường.',
  },
  {
    value: 'teacher_provided',
    label: 'Giáo viên tự dán văn bản đã kiểm duyệt',
    description: 'Sử dụng nguyên văn ngữ liệu do giáo viên cung cấp để ra câu hỏi.',
  },
  {
    value: 'verified_textbook_excerpt',
    label: 'Bài đọc trích từ SGK cũ (Có ghi rõ nguồn)',
    description: 'Dùng văn bản giáo viên dán và tự động gắn dòng trích nguồn SGK lớp/năm xuất bản.',
  },
];

export const IMAGE_MODE_OPTIONS: OptionItem<ImageMode>[] = [
  {
    value: 'auto',
    label: 'AI tự minh họa câu phù hợp (Khuyên dùng)',
    description: 'Chỉ vẽ hình (SVG) cho các câu cần trực quan: đếm vật, hình học, đồng hồ, biểu tượng/thiết bị...',
  },
  {
    value: 'visual_focus',
    label: 'Ưu tiên nhiều hình trực quan (Lớp 1 - 3)',
    description: 'Tăng cường hình vẽ minh họa sinh động cho các bài tập nhận biết, đếm số lượng, nối hình.',
  },
  {
    value: 'none',
    label: 'Không tự vẽ (Giáo viên tự chèn sau)',
    description: 'AI chỉ tạo văn bản; thầy/cô có thể bấm chèn hoặc dán ảnh (Ctrl+V) vào từng câu ở bước xem phiếu.',
  },
];

export interface WorksheetRequest {
  grade: GradeLevel;
  subject: string;
  topic: string;
  exerciseType: ExerciseType;
  studentTarget: StudentTarget;
  durationMinutes: number;
  questionCount: number;
  answerMode: AnswerMode;
  preferredFormats: QuestionFormat[];
  imageMode?: ImageMode;
  includeMatrix?: boolean;
  includeLocalContext?: boolean;
  vietnameseScope?: VietnameseScope;
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