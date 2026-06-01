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
  QUESTION_FORMAT_OPTIONS,
  OptionItem,
} from '../types';
import { BookOpen, GraduationCap, PenTool, Sparkles, FileText, BookOpenCheck, Layers } from 'lucide-react';

interface WorksheetFormProps {
  onSubmit: (data: WorksheetRequest) => void;
  isLoading: boolean;
}

const DEFAULT_FORMATS: QuestionFormat[] = [
  'multiple_choice',
  'true_false',
  'fill_blank',
  'short_answer',
  'real_context',
  'error_finding',
];

const QUESTION_COUNTS = [6, 8, 10, 12, 15, 20];

const WorksheetForm: React.FC<WorksheetFormProps> = ({ onSubmit, isLoading }) => {
  const [grade, setGrade] = useState<GradeLevel>(GradeLevel.GRADE_3);
  const [subject, setSubject] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('differentiated');
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('differentiated');
  const [studentTarget, setStudentTarget] = useState<StudentTarget>('mixed');
  const [questionCount, setQuestionCount] = useState<number>(12);
  const [answerMode, setAnswerMode] = useState<AnswerMode>('explain');
  const [preferredFormats, setPreferredFormats] = useState<QuestionFormat[]>(DEFAULT_FORMATS);
  const [includeMatrix, setIncludeMatrix] = useState<boolean>(true);
  const [includeChallenge, setIncludeChallenge] = useState<boolean>(true);
  const [includeTeacherGuide, setIncludeTeacherGuide] = useState<boolean>(true);
  const [includeSelfAssessment, setIncludeSelfAssessment] = useState<boolean>(true);
  const [includeLocalContext, setIncludeLocalContext] = useState<boolean>(false);

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
      setExerciseType('differentiated');
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
      preferredFormats: preferredFormats.length ? preferredFormats : DEFAULT_FORMATS,
      includeMatrix,
      includeChallenge,
      includeTeacherGuide,
      includeSelfAssessment,
      includeLocalContext,
    });
  };

  const toggleFormat = (format: QuestionFormat) => {
    setPreferredFormats((current) =>
      current.includes(format)
        ? current.filter((item) => item !== format)
        : [...current, format]
    );
  };

  const gradeColors: Record<GradeLevel, { active: string; inactive: string; border: string }> = {
    [GradeLevel.GRADE_1]: {
      active: 'bg-lime-500 text-white shadow-lime-200 ring-2 ring-lime-300',
      inactive: 'bg-white text-lime-600 hover:bg-lime-50 border-lime-200',
      border: 'border-lime-200',
    },
    [GradeLevel.GRADE_2]: {
      active: 'bg-yellow-400 text-white shadow-yellow-200 ring-2 ring-yellow-200',
      inactive: 'bg-white text-yellow-600 hover:bg-yellow-50 border-yellow-200',
      border: 'border-yellow-200',
    },
    [GradeLevel.GRADE_3]: {
      active: 'bg-orange-500 text-white shadow-orange-200 ring-2 ring-orange-300',
      inactive: 'bg-white text-orange-600 hover:bg-orange-50 border-orange-200',
      border: 'border-orange-200',
    },
    [GradeLevel.GRADE_4]: {
      active: 'bg-blue-500 text-white shadow-blue-200 ring-2 ring-blue-300',
      inactive: 'bg-white text-blue-600 hover:bg-blue-50 border-blue-200',
      border: 'border-blue-200',
    },
    [GradeLevel.GRADE_5]: {
      active: 'bg-purple-500 text-white shadow-purple-200 ring-2 ring-purple-300',
      inactive: 'bg-white text-purple-600 hover:bg-purple-50 border-purple-200',
      border: 'border-purple-200',
    },
  };

  const renderCompactOptions = <T extends string>(
    options: OptionItem<T>[],
    value: T,
    onChange: (value: T) => void,
    columns = 'sm:grid-cols-2'
  ) => (
    <div className={`grid grid-cols-1 ${columns} gap-3`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`text-left p-4 rounded-2xl border-2 transition-all shadow-sm ${
            value === option.value
              ? 'border-teal-400 bg-teal-50 text-teal-800 shadow-md scale-[1.01]'
              : 'border-slate-200 bg-white/80 text-slate-600 hover:border-teal-200 hover:bg-white'
          }`}
        >
          <span className="block font-extrabold text-base">{option.label}</span>
          {option.description && (
            <span className="block text-xs mt-1 leading-relaxed opacity-80">{option.description}</span>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="glass-panel p-6 md:p-10 max-w-3xl mx-auto relative overflow-hidden transition-all hover:shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 via-yellow-400 to-purple-500"></div>

      <div className="flex items-center gap-3 mb-8 text-teal-700">
        <div className="p-3 bg-teal-100 rounded-2xl rotate-3">
          <Layers className="w-7 h-7 text-teal-600" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-slate-800">
            Thông Tin Phiếu Bài Tập
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Có thể tạo phiếu cơ bản, nâng cao, phụ đạo hoặc phân hóa theo từng nhóm học sinh.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-base font-bold text-slate-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
            <GraduationCap className="w-5 h-5 text-teal-500" /> Chọn Khối Lớp
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {Object.values(GradeLevel).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={`py-3 px-2 rounded-full font-extrabold text-lg transition-all duration-300 shadow-sm border-2 ${
                  grade === g ? `${gradeColors[g].active} transform scale-105` : `${gradeColors[g].inactive}`
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-base font-bold text-slate-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
            <BookOpen className="w-5 h-5 text-teal-500" /> Chọn Môn Học
          </label>
          <div className="relative group">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-4 bg-white/80 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-100 focus:border-teal-400 outline-none transition-all text-slate-700 font-bold text-lg appearance-none cursor-pointer hover:bg-white shadow-sm"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2320c997' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 1.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
              }}
            >
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-base font-bold text-slate-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
            <PenTool className="w-5 h-5 text-teal-500" /> Nhập Tên Bài / Chủ Đề
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={exerciseType === 'reading' ? 'Ví dụ: Tuần 20 - Ngày tết quê em...' : 'Ví dụ: Bài 10 - Ôn tập giữa học kì 1...'}
            className="w-full p-4 bg-white/80 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-100 focus:border-teal-400 outline-none transition-all placeholder:text-slate-400 text-lg shadow-inner font-medium"
            required
          />
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-2xl border-2 border-emerald-100 border-dashed">
          <label className="block text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
            <FileText className="w-5 h-5" /> Loại phiếu muốn tạo
          </label>
          {renderCompactOptions(availableExerciseTypes, exerciseType, setExerciseType, 'sm:grid-cols-2')}
        </div>

        <div>
          <label className="block text-base font-bold text-slate-700 mb-3 uppercase tracking-wide">
            Mức độ phiếu
          </label>
          {renderCompactOptions(DIFFICULTY_OPTIONS, difficultyLevel, setDifficultyLevel, 'sm:grid-cols-2 lg:grid-cols-4')}
        </div>

        <div>
          <label className="block text-base font-bold text-slate-700 mb-3 uppercase tracking-wide">
            Đối tượng học sinh
          </label>
          {renderCompactOptions(STUDENT_TARGET_OPTIONS, studentTarget, setStudentTarget, 'sm:grid-cols-2 lg:grid-cols-4')}
        </div>

        <div>
          <label className="block text-base font-bold text-slate-700 mb-3 uppercase tracking-wide">
            Số lượng câu hỏi
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {QUESTION_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setQuestionCount(count)}
                className={`py-3 rounded-2xl border-2 font-extrabold transition-all ${
                  questionCount === count
                    ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-md scale-[1.03]'
                    : 'border-slate-200 bg-white/80 text-slate-500 hover:bg-white hover:border-orange-200'
                }`}
              >
                {count} câu
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-base font-bold text-slate-700 mb-3 uppercase tracking-wide">
            Dạng bài ưu tiên
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {QUESTION_FORMAT_OPTIONS.map((format) => (
              <label
                key={format.value}
                className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  preferredFormats.includes(format.value)
                    ? 'border-purple-300 bg-purple-50 text-purple-800 shadow-sm'
                    : 'border-slate-200 bg-white/80 text-slate-600 hover:bg-white hover:border-purple-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={preferredFormats.includes(format.value)}
                  onChange={() => toggleFormat(format.value)}
                  className="w-4 h-4 accent-purple-600"
                />
                <span className="font-bold text-sm">{format.label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2 italic">
            Nên chọn ít nhất 4 dạng để phiếu không bị đơn điệu. Nếu bỏ trống, app tự dùng bộ dạng bài mặc định.
          </p>
        </div>

        <div>
          <label className="block text-base font-bold text-slate-700 mb-3 uppercase tracking-wide">
            Kiểu đáp án
          </label>
          {renderCompactOptions(ANSWER_MODE_OPTIONS, answerMode, setAnswerMode, 'sm:grid-cols-3')}
        </div>

        <div className="bg-slate-50/70 p-4 rounded-2xl border-2 border-slate-100">
          <label className="block text-base font-bold text-slate-700 mb-3 uppercase tracking-wide">
            Tùy chọn nâng cao
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { checked: includeMatrix, setter: setIncludeMatrix, label: 'Có bảng ma trận nhỏ' },
              { checked: includeChallenge, setter: setIncludeChallenge, label: 'Có phần thử thách' },
              { checked: includeTeacherGuide, setter: setIncludeTeacherGuide, label: 'Có gợi ý sử dụng cho giáo viên' },
              { checked: includeSelfAssessment, setter: setIncludeSelfAssessment, label: 'Có mục học sinh tự đánh giá' },
              { checked: includeLocalContext, setter: setIncludeLocalContext, label: 'Liên hệ thực tế địa phương/vùng cao' },
            ].map((item) => (
              <label key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border border-slate-200 cursor-pointer hover:border-teal-200 transition-all">
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
        </div>

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
              Đang Suy Nghĩ...
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
