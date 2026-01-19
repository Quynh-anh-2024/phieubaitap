import React, { useState, useEffect } from 'react';
import { GradeLevel, SUBJECTS_BY_GRADE, WorksheetRequest, ExerciseType } from '../types';
import { BookOpen, GraduationCap, PenTool, Sparkles, FileText, BookOpenCheck, Layers } from 'lucide-react';

interface WorksheetFormProps {
  onSubmit: (data: WorksheetRequest) => void;
  isLoading: boolean;
}

const WorksheetForm: React.FC<WorksheetFormProps> = ({ onSubmit, isLoading }) => {
  const [grade, setGrade] = useState<GradeLevel>(GradeLevel.GRADE_3);
  const [subject, setSubject] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('general');

  // Update available subjects when grade changes
  const availableSubjects = SUBJECTS_BY_GRADE[grade];

  // Reset subject if it's not available in the new grade
  useEffect(() => {
    if (!availableSubjects.includes(subject)) {
      setSubject(availableSubjects[0]);
    }
  }, [grade, availableSubjects, subject]);

  // Reset exercise type if subject changes from Tiếng Việt
  useEffect(() => {
    if (subject !== 'Tiếng Việt') {
        setExerciseType('general');
    }
  }, [subject]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onSubmit({ grade, subject, topic, exerciseType });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 border border-slate-100 max-w-2xl mx-auto transform transition-all hover:shadow-2xl relative overflow-hidden">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400"></div>

      <div className="flex items-center gap-3 mb-8 text-teal-700">
        <div className="p-2 bg-teal-50 rounded-lg">
             <Layers className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold">Thông Tin Phiếu Bài Tập</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Grade Selection */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-teal-600" /> KHỐI LỚP
          </label>
          <div className="grid grid-cols-3 gap-4">
            {Object.values(GradeLevel).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={`py-3 px-4 rounded-xl border-2 font-bold text-lg transition-all duration-200 ${
                  grade === g
                    ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-md transform scale-[1.02]'
                    : 'border-slate-100 text-slate-400 hover:border-teal-200 hover:bg-slate-50'
                }`}
              >
                Lớp {g}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Selection */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" /> MÔN HỌC
          </label>
          <div className="relative">
            <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-slate-700 font-semibold text-lg appearance-none cursor-pointer hover:bg-white"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%230d9488' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
            >
                {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                    {sub}
                </option>
                ))}
            </select>
          </div>
        </div>

        {/* Exercise Type Selection (Only for Tiếng Việt) */}
        {subject === 'Tiếng Việt' && (
            <div className="animate-fade-in bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" /> LOẠI BÀI TẬP
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setExerciseType('general')}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border font-semibold transition-all ${
                            exerciseType === 'general'
                                ? 'border-teal-500 bg-white text-teal-700 shadow-sm ring-1 ring-teal-500'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-teal-300'
                        }`}
                    >
                        <BookOpenCheck className="w-4 h-4" />
                        Ôn Tập Chung
                    </button>
                    <button
                        type="button"
                        onClick={() => setExerciseType('reading')}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border font-semibold transition-all ${
                            exerciseType === 'reading'
                                ? 'border-amber-500 bg-white text-amber-700 shadow-sm ring-1 ring-amber-500'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-amber-300'
                        }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        Luyện Đọc Hiểu
                    </button>
                </div>
            </div>
        )}

        {/* Topic Input */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <PenTool className="w-5 h-5 text-teal-600" /> TÊN BÀI / CHỦ ĐỀ
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={exerciseType === 'reading' ? "Ví dụ: Mùa hè của em, Tình bạn,..." : "Ví dụ: Bài 10 - Ôn tập giữa học kì 1..."}
            className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 text-lg shadow-sm"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transform transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] ${
            isLoading || !topic.trim()
              ? 'bg-slate-300 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-teal-200'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang Phân Tích & Soạn Thảo...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                {exerciseType === 'reading' ? 'Tạo Phiếu Đọc Hiểu' : 'Tạo Phiếu Bài Tập'}
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

export default WorksheetForm;