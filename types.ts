export enum GradeLevel {
  GRADE_3 = '3',
  GRADE_4 = '4',
  GRADE_5 = '5',
}

export const SUBJECTS_BY_GRADE: Record<GradeLevel, string[]> = {
  [GradeLevel.GRADE_3]: ['Toán', 'Tiếng Việt', 'Công nghệ', 'Tin học'],
  [GradeLevel.GRADE_4]: ['Toán', 'Tiếng Việt', 'Công nghệ', 'Tin học', 'Khoa học', 'Lịch sử và Địa lý'],
  [GradeLevel.GRADE_5]: ['Toán', 'Tiếng Việt', 'Công nghệ', 'Tin học', 'Khoa học', 'Lịch sử và Địa lý'],
};

export type ExerciseType = 'general' | 'reading';

export interface WorksheetRequest {
  grade: GradeLevel;
  subject: string;
  topic: string;
  exerciseType: ExerciseType;
}

export interface WorksheetResponse {
  content: string;
}
