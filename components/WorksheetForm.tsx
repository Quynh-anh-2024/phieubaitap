import React, { useState, useEffect } from 'react';
import {
  GradeLevel,
  SUBJECTS_BY_GRADE,
  WorksheetRequest,
  ExerciseType,
  DifficultyLevel,
  StudentTarget,
  AnswerMode,
  QuestionFormat,
  EXERCISE_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  STUDENT_TARGET_OPTIONS,
  ANSWER_MODE_OPTIONS,
  OptionItem,
} from '../types';
import { BookOpen, ClipboardList, GraduationCap, Layers, PenTool, Settings2, Sparkles } from 'lucide-react';

interface WorksheetFormProps {
  onSubmit: (data: WorksheetRequest) => void;
  isLoading: boolean;
}

type FormatPreset =
  | 'diverse'
  | 'multiple_choice_focus'
  | 'basic_mix'
  | 'matching_focus'
  | 'short_answer_focus'
  | 'real_context_focus'
  | 'error_finding_focus'
  | 'creative_focus';

const QUESTION_COUNTS = [6, 8, 10, 12, 15, 20];

const FORMAT_PRESET_OPTIONS: OptionItem<FormatPreset>[] = [
  {
    value: 'diverse',
    label: 'Đa dạng dạng bài',
    description: 'Trắc nghiệm, điền khuyết, đúng/sai, nối, tự luận, tình huống và vận dụng.',
  },
  {
    value: 'multiple_choice_focus',
    label: 'Chủ yếu trắc nghiệm',
    description: 'Phù hợp kiểm tra nhanh, chấm nhanh, câu hỏi ngắn.',
  },
  {
    value: 'basic_mix',
    label: 'Điền khuyết, đúng/sai',
    description: 'Phù hợp củng cố kiến thức cơ bản, học sinh cần hỗ trợ.',
  },
  {
    value: 'matching_focus',
    label: 'Tăng bài nối cột',
    description: 'Có bảng nối cột rõ ràng, dễ làm, dễ chấm.',
  },
  {
    value: 'short_answer_focus',
    label: 'Tăng tự luận ngắn',
    description: 'Yêu cầu học sinh giải thích, trình bày ngắn gọn.',
  },
  {
    value: 'real_context_focus',
    label: 'Tăng tình huống thực tế',
    description: 'Gắn bài học với đời sống, học tập và địa phương.',
  },
  {
    value: 'error_finding_focus',
    label: 'Tăng phát hiện lỗi sai',
    description: 'Rèn tư duy phân tích, sửa lỗi và giải thích.',
  },
  {
    value: 'creative_focus',
    label: 'Tăng nâng cao, sáng tạo',
    description: 'Phù hợp học sinh khá, giỏi hoặc phần thử thách.',
  },
];

const FORMAT_PRESET_MAP: Record<FormatPreset, QuestionFormat[]> = {
  diverse: [
    'multiple_choice',
    'true_false',
    'fill_blank',
    'matching',
    'ordering',
    'short_answer',
    'real_context',
    'error_finding',
  ],
  multiple_choice_focus: ['multiple_choice', 'true_false', 'fill_blank', 'short_answer'],
  basic_mix: ['fill_blank', 'true_false', 'matching', 'multiple_choice', 'short_answer'],
  matching_focus: ['matching', 'fill_blank', 'true_false', 'ordering', 'short_answer'],
  short_answer_focus: ['short_answer', 'fill_blank', 'real_context', 'error_finding', 'multiple_choice'],
  real_context_focus: ['real_context', 'short_answer', 'error_finding', 'creative', 'multiple_choice'],
  error_finding_focus: ['error_finding', 'real_context', 'short_answer', 'ordering', 'multiple_choice'],
  creative_focus: ['creative', 'real_context', 'error_finding', 'short_answer', 'ordering'],
};

const DEFAULT_FORMAT_PRESET: FormatPreset = 'diverse';

const getOptionLabel = <T extends string>(options: OptionItem<T>[], value: T) => {
  return options.find((option) => option.value === value)?.label || value;
};

const getOptionDescription = <T extends string>(options: OptionItem<T>[], value: T) => {
  return options.find((option) => option.value === value)?.description || '';
};

const SelectField = <T extends string | number>({
  label,
  value,
  onChange,
  options,
  icon,
  hint,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; description?: string }>;
  icon?: React.ReactNode;
  hint?: string;
}) => (
  <label className="block">
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
  </label>
);

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
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('differentiated');
  const [studentTarget, setStudentTarget] = useState<StudentTarget>('mixed');
  const [questionCount, setQuestionCount] = useState<number>(12);
  const [answerMode, setAnswerMode] = useState<AnswerMode>('explain');
  const [formatPreset, setFormatPreset] = useState<FormatPreset>(DEFAULT_FORMAT_PRESET);
  const [includeMatrix, setIncludeMatrix] = useState<boolean>(true);
  const [includeChallenge, setIncludeChallenge] = useState<boolean>(true);
  const [includeTeacherGuide, setIncludeTeacherGuide] = useState<boolean>(true);
  const [includeSelfAssessment, setIncludeSelfAssessment] = useState<boolean>(true);
  const [includeLocalContext, setIncludeLocalContext] = useState<boolean>(false);

  const preferredFormats = FORMAT_PRESET_MAP[formatPreset];
  const availableSubjects = SUBJECTS_BY_GRADE[grade];
  const availableExerciseTypes = EXERCISE_TYPE_OPTIONS.filter(
    (option) => option.value !== 'reading' || subject === 'Tiếng Việt'
  );

  useEffect(() => {
    if (!availableSubjects.includes(subject)) {
      setSubject(availableSubjects[0]);
    }
  }, [grade, availableSubjects, subject]);

  useEffect(() => {
    if (subject !== 'Tiếng Việt' && exerciseType === 'reading') {
      setExerciseType('weekly_practice');
    }
  }, [subject, exerciseType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    onSubmit({
      grade,
      subject,
      topic: topic.trim(),
      exerciseType,
      difficultyLevel,
      studentTarget,
      questionCount,
      answerMode,
      preferredFormats: preferredFormats.length ? preferredFormats : FORMAT_PRESET_MAP[DEFAULT_FORMAT_PRESET],
      includeMatrix,
      includeChallenge,
      includeTeacherGuide,
      includeSelfAssessment,
      includeLocalContext,
    });
  };

  const gradeOptions = Object.values(GradeLevel).map((item) => ({ value: item, label: `Lớp ${item}` }));
  const subjectOptions = availableSubjects.map((item) => ({ value: item, label: item }));
  const questionCountOptions = QUESTION_COUNTS.map((item) => ({ value: item, label: `${item} câu` }));

  const summaryItems = [
    { label: 'Môn - Lớp', value: `${subject || 'Chưa chọn'} - Lớp ${grade}` },
    { label: 'Loại phiếu', value: getOptionLabel(EXERCISE_TYPE_OPTIONS, exerciseType) },
    { label: 'Mức độ', value: getOptionLabel(DIFFICULTY_OPTIONS, difficultyLevel) },
    { label: 'Đối tượng', value: getOptionLabel(STUDENT_TARGET_OPTIONS, studentTarget) },
    { label: 'Số câu', value: `${questionCount} câu` },
    { label: 'Dạng bài', value: getOptionLabel(FORMAT_PRESET_OPTIONS, formatPreset) },
    { label: 'Đáp án', value: getOptionLabel(ANSWER_MODE_OPTIONS, answerMode) },
  ];

  const advancedOptions = [
    { checked: includeMatrix, setter: setIncludeMatrix, label: 'Có bảng ma trận trong bản giáo viên' },
    { checked: includeChallenge, setter: setIncludeChallenge, label: 'Có phần thử thách' },
    { checked: includeTeacherGuide, setter: setIncludeTeacherGuide, label: 'Có gợi ý sử dụng cho giáo viên' },
    { checked: includeSelfAssessment, setter: setIncludeSelfAssessment, label: 'Có học sinh tự đánh giá và PHHS theo dõi' },
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
            <SelectField
              label="Khối lớp"
              value={grade}
              onChange={setGrade}
              options={gradeOptions}
              icon={<GraduationCap className="w-4 h-4 text-teal-500" />}
            />
            <SelectField
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
              placeholder={exerciseType === 'reading' ? 'Ví dụ: Tuần 20 - Ngày tết quê em...' : 'Ví dụ: Ôn tập bảng nhân 7, bảng chia 7...'}
              className="w-full min-h-[54px] px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-100 focus:border-teal-400 outline-none transition-all placeholder:text-slate-400 text-lg shadow-inner font-medium"
              required
            />
          </label>
        </section>

        <section className="bg-white/70 border-2 border-slate-100 rounded-3xl p-4 md:p-6 shadow-sm">
          <SectionTitle
            icon={<ClipboardList className="w-5 h-5" />}
            title="2. Cấu hình phiếu"
            description="Các mục chính được gom thành list sổ xuống để dễ nhìn và tránh rối giao diện."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Loại phiếu"
              value={exerciseType}
              onChange={setExerciseType}
              options={availableExerciseTypes}
              hint={getOptionDescription(EXERCISE_TYPE_OPTIONS, exerciseType)}
            />
            <SelectField
              label="Mức độ phiếu"
              value={difficultyLevel}
              onChange={setDifficultyLevel}
              options={DIFFICULTY_OPTIONS}
              hint={getOptionDescription(DIFFICULTY_OPTIONS, difficultyLevel)}
            />
            <SelectField
              label="Đối tượng học sinh"
              value={studentTarget}
              onChange={setStudentTarget}
              options={STUDENT_TARGET_OPTIONS}
              hint={getOptionDescription(STUDENT_TARGET_OPTIONS, studentTarget)}
            />
            <SelectField
              label="Số lượng câu"
              value={questionCount}
              onChange={setQuestionCount}
              options={questionCountOptions}
              hint="Mặc định 12 câu phù hợp phiếu phân hóa. Kiểm tra nhanh có thể chọn 6 hoặc 8 câu."
            />
            <SelectField
              label="Dạng bài ưu tiên"
              value={formatPreset}
              onChange={setFormatPreset}
              options={FORMAT_PRESET_OPTIONS}
              hint={getOptionDescription(FORMAT_PRESET_OPTIONS, formatPreset)}
            />
            <SelectField
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

        <section className="bg-gradient-to-br from-teal-50 to-orange-50 border-2 border-teal-100 rounded-3xl p-4 md:p-6 shadow-sm">
          <SectionTitle
            icon={<Sparkles className="w-5 h-5" />}
            title="3. Tóm tắt phiếu sẽ tạo"
            description="Kiểm tra nhanh các lựa chọn trước khi bấm tạo phiếu."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {summaryItems.map((item) => (
              <div key={item.label} className="bg-white/90 rounded-2xl border border-white p-3 shadow-sm">
                <p className="text-[11px] uppercase tracking-wide font-black text-slate-400">{item.label}</p>
                <p className="text-sm font-extrabold text-slate-800 mt-1 leading-snug">{item.value}</p>
              </div>
            ))}
          </div>

          {topic.trim() && (
            <div className="mt-4 p-3 rounded-2xl bg-white/80 border border-white text-sm text-slate-700">
              <span className="font-black text-teal-700">Bài/chủ đề:</span> {topic.trim()}
            </div>
          )}
        </section>

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
              {exerciseType === 'reading' ? 'Tạo Phiếu Đọc Hiểu' : 'Tạo Phiếu Bài Tập'}
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

export default WorksheetForm;
