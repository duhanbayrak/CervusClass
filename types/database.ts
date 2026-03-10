/**
 * Bu dosya Supabase auto-generated tipleri için tek kaynak olan
 * supabase.ts'ten re-export yapar. Proje özel tip takma adları
 * burada tanımlanır; asla doğrudan supabase.ts'e eklenmez.
 *
 * supabase.ts'i güncellemek için: `supabase gen types typescript`
 */

export type {
  Json,
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from './supabase';

import type { Tables } from './supabase';

// --- Proje özel tip takma adları ---

export type Profile = Tables<'profiles'>;
export type ProfileRole = 'student' | 'teacher' | 'admin' | 'superadmin' | 'super_admin';
export type Schedule = Tables<'schedule'>;
export type Homework = Tables<'homework'>;
export type HomeworkSubmission = Tables<'homework_submissions'>;
export type ExamResult = Tables<'exam_results'>;
export type StudySession = Tables<'study_sessions'>;
export type Class = Tables<'classes'>;

export interface ClassWithCount extends Class {
  student_count?: number;
  profiles?: { count: number }[];
}

/** Öğrenci notu satır tipi */
export type StudentNote = Tables<'student_notes'>;
