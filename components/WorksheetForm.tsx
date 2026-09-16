import React, { useState, useEffect } from 'react';
import {
  GradeLevel,
  SUBJECTS_BY_GRADE,
  WorksheetRequest,
  ExerciseType,
  StudentTarget,
  AnswerMode,
  QuestionFormat,
  EXERCISE_TYPE_OPTIONS,
  STUDENT_TARGET_OPTIONS,
  ANSWER_MODE_OPTIONS,
  READING_SOURCE_OPTIONS,
  VIETNAMESE_SCOPE_OPTIONS,
  ReadingSource,
  VietnameseScope,
  OptionItem,
} from '../types';
import { BookOpen, ClipboardList, GraduationCap, Layers, PenTool, Settings2, Sparkles } from 'lucide-react';

interface WorksheetFormProps {
  onSubmit: (data: WorksheetRequest) => void;
  isLoading: boolean;
}

type FormatPreset =
  | 'balanced'
  | 'objective_focus'
  | 'constructed_focus';

const DURATION_OPTIONS = [
  { value: 10, label: '10 phút', description: 'Khoảng 5-6 câu, phù hợp kiểm tra nhanh.' },
  { value: 20, label: '20 phút', description: 'Khoảng 8-10 câu, phù hợp củng cố bài học.' },
  { value: 35, label: '35 phút', description: 'Khoảng 12 câu, phù hợp luyện tập và phân hóa.' },
  { value: 45, label: '45 phút', description: 'Khoảng 15 câu, phù hợp ôn tập theo giai đoạn.' },
];

const QUESTION_COUNT_BY_DURATION: Record<number, number> = { 10: 6, 20: 10, 35: 12, 45: 15 };

const FORMAT_PRESET_OPTIONS: OptionItem<FormatPreset>[] = [
  {
    value: 'balanced',
    label: 'AI tự cân đối',
    description: 'Tự chọn các dạng phù hợp nhất với môn học, mục tiêu và thời lượng.',
  },
  {
    value: 'objective_focus',
    label: 'Chủ yếu trắc nghiệm',
    description: 'Ưu tiên trắc nghiệm, đúng/sai và điền khuyết để chấm nhanh.',
  },
  {
    value: 'constructed_focus',
    label: 'Tự luận và vận dụng',
    description: 'Ưu tiên trình bày, tình huống thực tế, tìm lỗi và sáng tạo.',
  },
];

const FORMAT_PRESET_MAP: Record<FormatPreset, QuestionFormat[]> = {
  balanced: [],
  objective_focus: ['multiple_choice', 'true_false', 'fill_blank'],
  constructed_focus: ['short_answer', 'real_context', 'error_finding', 'creative'],
};

const DEFAULT_FORMAT_PRESET: FormatPreset = 'balanced';

const getOptionDescription = <T extends string>(options: OptionItem<T>[], value: T) => {
  return options.find((option) => option.value === value)?.description || '';
};

type SelectFieldProps<T extends string | number> = {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; description?: string }>;
  icon?: React.ReactNode;
  hint?: string;
};

function SelectField<T extends string | number>({
  label,
  value,
  onChange,
  options,
  icon,
  hint,
}: SelectFieldProps<T>) {
  return <label className="block">
    <span className="flex items-center gap-2 text-sm font-extrabold text-slate-700 uppercase tracking-wide mb-2">
      {icon}
      {label}
    </span>
    <select
      value={value}
      onChange={(e) => {
        const selected = options.find((option) => String(option.value) === e.target.value);
        if (selected) onChange(selected.value);
      }}
      className="w-full min-h-[54px] px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-slate-800 font-bold shadow-sm outline-none transition-all cursor-pointer focus:border-teal-400 focus:ring-4 focus:ring-teal-100 hover:border-teal-200"
    >
      {options.map((option) => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
    {hint && <span className="block mt-1.5 text-xs leading-relaxed text-slate-500">{hint}</span>}
  </label>;
}

const SectionTitle = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) => (
  <div className="flex items-start gap-3 mb-5">
    <div className="p-2.5 bg-teal-100 rounded-2xl text-teal-700 shrink-0">{icon}</div>
    <div>
      <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 leading-relaxed">{description}</p>}
    </div>
  </div>
);

const WorksheetForm: React.FC<WorksheetFormProps> = ({ onSubmit, isLoading }) => {
  const [grade, setGrade] = useState<GradeLevel>(GradeLevel.GRADE_3);
  const [subject, setSubject] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('weekly_practice');
  const [studentTarget, setStudentTarget] = useState<StudentTarget>('mixed');
  const [durationMinutes, setDurationMinutes] = useState<number>(35);
  const [answerMode, setAnswerMode] = useState<AnswerMode>('explain');
  const [formatPreset, setFormatPreset] = useState<FormatPreset>(DEFAULT_FORMAT_PRESET);
  const [includeMatrix, setIncludeMatrix] = useState<boolean>(false);
  const [includeLocalContext, setIncludeLocalContext] = useState<boolean>(false);
  const [vietnameseScope, setVietnameseScope] = useState<VietnameseScope>('language');
  const [readingSource, setReadingSource] = useState<ReadingSource>('auto_new');
  const [readingText, setReadingText] = useState<string>('');
  const [readingSourceNote, setReadingSourceNote] = useState<string>('');
  const [readingBookGrade, setReadingBookGrade] = useState<string>(GradeLevel.GRADE_3);
  const [readingBookYear, setReadingBookYear] = useState<string>('');
  const [readingBookTitle, setReadingBookTitle] = useState<string>('');
  const [readingLessonTitle, setReadingLessonTitle] = useState<string>('');

  const preferredFormats = FORMAT_PRESET_MAP[formatPreset];
  const availableSubjects = SUBJECTS_BY_GRADE[grade];
  const isVietnamese = subject === 'Tiếng Việt';
  const usesReadingText = isVietnamese && (vietnameseScope === 'reading' || vietnameseScope === 'comprehensive');

  useEffect(() => {
    if (!availableSubjects.includes(subject)) {
      setSubject(availableSubjects[0]);
    }
  }, [grade, availableSubjects, subject]);

  useEffect(() => {
    if (subject !== 'Tiếng Việt') {
      setReadingSource('auto_new');
      setReadingText('');
      setReadingSourceNote('');
      setReadingBookGrade(String(grade));
      setReadingBookYear('');
      setReadingBookTitle('');
      setReadingLessonTitle('');
    }
  }, [subject, grade]);

  useEffect(() => {
    if (subject === 'Tiếng Việt' && !readingBookGrade) {
      setReadingBookGrade(String(grade));
    }
  }, [subject, grade, readingBookGrade]);

  useEffect(() => {
    if (exerciseType === 'quick_test' && durationMinutes > 20) setDurationMinutes(10);
    if (exerciseType === 'review' && durationMinutes < 35) setDurationMinutes(45);
    setIncludeMatrix(exerciseType === 'review');
  }, [exerciseType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    onSubmit({
      grade,
      subject,
      topic: topic.trim(),
      exerciseType,
      studentTarget,
      durationMinutes,
      questionCount: QUESTION_COUNT_BY_DURATION[durationMinutes] || 10,
      answerMode,
      preferredFormats,
      includeMatrix,
      includeLocalContext,
      vietnameseScope: isVietnamese ? vietnameseScope : undefined,
      readingSource: usesReadingText ? readingSource : undefined,
      readingText: usesReadingText ? readingText.trim() : '',
      readingSourceNote: usesReadingText ? readingSourceNote.trim() : '',
      readingBookGrade: usesReadingText ? readingBookGrade.trim() : '',
      readingBookYear: usesReadingText ? readingBookYear.trim() : '',
      readingBookTitle: usesReadingText ? readingBookTitle.trim() : '',
      readingLessonTitle: usesReadingText ? readingLessonTitle.trim() : '',
      readingCitationLine:
        usesReadingText && readingSource === 'verified_textbook_excerpt' && readingBookGrade.trim() && readingBookYear.trim()
          ? `Trích từ SGK Tiếng Việt lớp ${readingBookGrade.trim()}, năm ${readingBookYear.trim()}`
          : '',
      lockReadingSource: usesReadingText,
    });
  };

  const gradeOptions = Object.values(GradeLevel).map((item) => ({ value: item, label: `Lớp ${item}` }));
  const subjectOptions = availableSubjects.map((item) => ({ value: item, label: item }));
  const advancedOptions = [
    { checked: includeMatrix, setter: setIncludeMatrix, label: 'Có bảng ma trận trong bản giáo viên' },
    { checked: includeLocalContext, setter: setIncludeLocalContext, label: 'Liên hệ thực tế địa phương/vùng cao' },
  ];

  return (
    <div className="glass-panel p-5 md:p-8 max-w-4xl mx-auto relative overflow-hidden transition-all hover:shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 via-yellow-400 to-purple-500"></div>

      <div className="flex items-center gap-3 mb-7 text-teal-700">
        <div className="p-3 bg-teal-100 rounded-2xl rotate-3">
          <Layers className="w-7 h-7 text-teal-600" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-slate-800">
            Tạo Phiếu Bài Tập
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Giao diện gọn hơn: chọn nhanh bằng danh sách sổ xuống, xem tóm tắt trước khi tạo phiếu.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white/70 border-2 border-slate-100 rounded-3xl p-4 md:p-6 shadow-sm">
          <SectionTitle
            icon={<BookOpen className="w-5 h-5" />}
            title="1. Thông tin bài học"
            description="Chỉ cần chọn lớp, môn và nhập tên bài/chủ đề cần tạo phiếu."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField<GradeLevel>
              label="Khối lớp"
              value={grade}
              onChange={(value) => {
                setGrade(value);
                if (subject === 'Tiếng Việt') {
                  setReadingBookGrade(String(value));
                }
              }}
              options={gradeOptions}
              icon={<GraduationCap className="w-4 h-4 text-teal-500" />}
            />
            <SelectField<string>
              label="Môn học"
              value={subject}
              onChange={setSubject}
              options={subjectOptions}
              icon={<BookOpen className="w-4 h-4 text-teal-500" />}
            />
          </div>

          <label className="block mt-4">
            <span className="flex items-center gap-2 text-sm font-extrabold text-slate-700 uppercase tracking-wide mb-2">
              <PenTool className="w-4 h-4 text-teal-500" />
              Tên bài / chủ đề
            </span>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={usesReadingText ? 'Ví dụ: Ngày Tết quê em...' : 'Ví dụ: Ôn tập bảng nhân 7, bảng chia 7...'}
              className="w-full min-h-[54px] px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-100 focus:border-teal-400 outline-none transition-all placeholder:text-slate-400 text-lg shadow-inner font-medium"
              required
            />
          </label>

          {isVietnamese && (
            <div className="mt-4 rounded-3xl border-2 border-amber-100 bg-amber-50/70 p-4">
              <div className="mb-3">
                <p className="text-sm font-black uppercase tracking-wide text-amber-800">Phạm vi ôn tập Tiếng Việt</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-700">
                  Chọn đúng nội dung cần luyện; nguồn bài đọc chỉ xuất hiện khi phiếu có phần đọc hiểu.
                </p>
              </div>
              <SelectField<VietnameseScope>
                label="Nội dung cần luyện"
                value={vietnameseScope}
                onChange={setVietnameseScope}
                options={VIETNAMESE_SCOPE_OPTIONS}
                hint={getOptionDescription(VIETNAMESE_SCOPE_OPTIONS, vietnameseScope)}
              />

              {usesReadingText && (
                <div className="mt-4">
                  <SelectField<ReadingSource>
                    label="Nguồn bài đọc hiểu"
                    value={readingSource}
                    onChange={setReadingSource}
                    options={READING_SOURCE_OPTIONS}
                    hint={getOptionDescription(READING_SOURCE_OPTIONS, readingSource)}
                  />
                </div>
              )}

              {usesReadingText && (readingSource === 'teacher_provided' || readingSource === 'verified_textbook_excerpt') && (
                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="flex items-center gap-2 text-sm font-extrabold text-slate-700 uppercase tracking-wide mb-2">
                      {readingSource === 'verified_textbook_excerpt' ? 'Bài đọc trích từ SGK đã kiểm duyệt' : 'Bài đọc đã kiểm duyệt'}
                    </span>
                    <textarea
                      value={readingText}
                      onChange={(e) => setReadingText(e.target.value)}
                      placeholder={
                        readingSource === 'verified_textbook_excerpt'
                          ? 'Dán nguyên văn bài đọc SGK cũ đã kiểm duyệt tại đây. App sẽ ghi dòng trích nguồn bên dưới bài đọc...'
                          : 'Dán bài đọc tại đây. App sẽ dùng đúng văn bản này để tạo câu hỏi đọc hiểu, luyện từ và câu, viết...'
                      }
                      required={readingSource === 'verified_textbook_excerpt'}
                      className="w-full min-h-[150px] px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all placeholder:text-slate-400 text-base shadow-inner font-medium"
                    />
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      {readingSource === 'verified_textbook_excerpt'
                        ? 'Chỉ dùng lựa chọn này khi thầy đã có văn bản và thông tin SGK lớp/năm xuất bản. Nếu không có đủ nguồn, chọn “Phong cách SGK cũ trước 2006”.'
                        : 'Nên dán văn bản thầy đã kiểm tra nguồn và phù hợp lớp học. Nếu để trống, app sẽ tự tạo văn bản mới, không sao chép nguyên văn từ internet.'}
                    </p>
                  </label>

                  {readingSource === 'verified_textbook_excerpt' && (
                    <div className="rounded-2xl border-2 border-amber-200 bg-white/80 p-4">
                      <p className="text-sm font-black uppercase tracking-wide text-amber-800 mb-3">
                        Thông tin trích nguồn hiển thị dưới bài đọc
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <SelectField<string>
                          label="SGK lớp"
                          value={readingBookGrade}
                          onChange={setReadingBookGrade}
                          options={Object.values(GradeLevel).map((item) => ({ value: String(item), label: `SGK Tiếng Việt lớp ${item}` }))}
                          hint="Dùng để tạo dòng: Trích từ SGK Tiếng Việt lớp..., năm..."
                        />
                        <label className="block">
                          <span className="flex items-center gap-2 text-sm font-extrabold text-slate-700 uppercase tracking-wide mb-2">
                            Năm xuất bản
                          </span>
                          <input
                            type="text"
                            value={readingBookYear}
                            onChange={(e) => setReadingBookYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                            placeholder="Ví dụ: 2004"
                            required={readingSource === 'verified_textbook_excerpt'}
                            className="w-full min-h-[50px] px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all placeholder:text-slate-400 text-base shadow-inner font-medium"
                          />
                        </label>
                        <label className="block">
                          <span className="flex items-center gap-2 text-sm font-extrabold text-slate-700 uppercase tracking-wide mb-2">
                            Tên sách/bộ sách
                          </span>
                          <input
                            type="text"
                            value={readingBookTitle}
                            onChange={(e) => setReadingBookTitle(e.target.value)}
                            placeholder="Ví dụ: Tiếng Việt 3, tập một"
                            className="w-full min-h-[50px] px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all placeholder:text-slate-400 text-base shadow-inner font-medium"
                          />
                        </label>
                        <label className="block">
                          <span className="flex items-center gap-2 text-sm font-extrabold text-slate-700 uppercase tracking-wide mb-2">
                            Tên bài đọc
                          </span>
                          <input
                            type="text"
                            value={readingLessonTitle}
                            onChange={(e) => setReadingLessonTitle(e.target.value)}
                            placeholder="Ví dụ: Người mẹ"
                            className="w-full min-h-[50px] px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all placeholder:text-slate-400 text-base shadow-inner font-medium"
                          />
                        </label>
                      </div>
                      <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-sm text-amber-900">
                        <span className="font-black">Dòng sẽ ghi dưới bài đọc: </span>
                        {readingBookYear
                          ? `Trích từ SGK Tiếng Việt lớp ${readingBookGrade}, năm ${readingBookYear}`
                          : 'Trích từ SGK Tiếng Việt lớp ..., năm ...'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {usesReadingText && (
                <label className="block mt-4">
                  <span className="flex items-center gap-2 text-sm font-extrabold text-slate-700 uppercase tracking-wide mb-2">
                    Ghi chú nguồn / yêu cầu thêm
                  </span>
                  <input
                    type="text"
                    value={readingSourceNote}
                    onChange={(e) => setReadingSourceNote(e.target.value)}
                    placeholder="Ví dụ: văn bản ngắn về quê hương, giọng văn giản dị, có từ chỉ đặc điểm..."
                    className="w-full min-h-[50px] px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all placeholder:text-slate-400 text-base shadow-inner font-medium"
                  />
                </label>
              )}
            </div>
          )}
        </section>

        <section className="bg-white/70 border-2 border-slate-100 rounded-3xl p-4 md:p-6 shadow-sm">
          <SectionTitle
            icon={<ClipboardList className="w-5 h-5" />}
            title="2. Cấu hình phiếu"
            description="Chọn mục đích, mức phù hợp và thời lượng. App sẽ tự cân đối số câu."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField<ExerciseType>
              label="Loại phiếu"
              value={exerciseType}
              onChange={setExerciseType}
              options={EXERCISE_TYPE_OPTIONS}
              hint={getOptionDescription(EXERCISE_TYPE_OPTIONS, exerciseType)}
            />
            <SelectField<StudentTarget>
              label="Mức độ phù hợp"
              value={studentTarget}
              onChange={setStudentTarget}
              options={STUDENT_TARGET_OPTIONS}
              hint={getOptionDescription(STUDENT_TARGET_OPTIONS, studentTarget)}
            />
            <SelectField<number>
              label="Thời lượng dự kiến"
              value={durationMinutes}
              onChange={setDurationMinutes}
              options={DURATION_OPTIONS}
              hint={DURATION_OPTIONS.find((item) => item.value === durationMinutes)?.description}
            />
            <SelectField<FormatPreset>
              label="Dạng bài ưu tiên"
              value={formatPreset}
              onChange={setFormatPreset}
              options={FORMAT_PRESET_OPTIONS}
              hint={getOptionDescription(FORMAT_PRESET_OPTIONS, formatPreset)}
            />
            <SelectField<AnswerMode>
              label="Kiểu đáp án"
              value={answerMode}
              onChange={setAnswerMode}
              options={ANSWER_MODE_OPTIONS}
              hint={getOptionDescription(ANSWER_MODE_OPTIONS, answerMode)}
            />
          </div>
        </section>

        <details className="group bg-slate-50/90 border-2 border-slate-100 rounded-3xl p-4 md:p-5 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span className="flex items-center gap-3 font-black text-slate-800 uppercase tracking-wide">
              <span className="p-2 bg-white rounded-2xl text-slate-600 border border-slate-200">
                <Settings2 className="w-5 h-5" />
              </span>
              Tùy chọn mở rộng
            </span>
            <span className="text-sm font-bold text-teal-700 group-open:hidden">Mở</span>
            <span className="text-sm font-bold text-teal-700 hidden group-open:inline">Thu gọn</span>
          </summary>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200">
            {advancedOptions.map((item) => (
              <label
                key={item.label}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 cursor-pointer hover:border-teal-200 transition-all"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => item.setter(e.target.checked)}
                  className="w-4 h-4 accent-teal-600"
                />
                <span className="font-semibold text-sm text-slate-700">{item.label}</span>
              </label>
            ))}
          </div>
        </details>

        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className={`w-full py-4 rounded-full font-black text-white text-xl shadow-lg transform transition-all hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] ${
            isLoading || !topic.trim()
              ? 'bg-slate-300 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 animate-pulse-action hover:shadow-orange-300/50'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang tạo phiếu...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2 uppercase tracking-wider">
              <Sparkles className="w-6 h-6" />
              Tạo Phiếu Bài Tập
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

export default WorksheetForm;
