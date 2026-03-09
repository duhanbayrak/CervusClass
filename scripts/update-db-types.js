const fs = require('node:fs');
const path = require('node:path');

// CLI çıktısını oku
const raw = fs.readFileSync(
    'C:/Users/duhan/.gemini/antigravity/brain/bbc7e5fe-fa35-4220-ba59-c1e84e6ba0ff/.system_generated/steps/234/output.txt',
    'utf8'
);
const parsed = JSON.parse(raw);

// Özel tipleri ekle
const customTypes = [
    '',
    '// ============================================',
    '// Projeye özel tip alias\'ları',
    '// ============================================',
    '',
    '/** Profil satır tipi */',
    "export type Profile = Tables<'profiles'>;",
    '/** Profil rolü */',
    "export type ProfileRole = 'student' | 'teacher' | 'admin' | 'superadmin' | 'super_admin';",
    '/** Sınıf satır tipi */',
    "export type Class = Tables<'classes'>;",
    '/** Sınıf + öğrenci sayısı */',
    'export interface ClassWithCount extends Class {',
    '  student_count?: number;',
    '  profiles?: { count: number }[];',
    '}',
    '/** Ders programı satır tipi */',
    "export type Schedule = Tables<'schedule'>;",
    '/** Ödev satır tipi */',
    "export type Homework = Tables<'homework'>;",
    '/** Ödev teslimi satır tipi */',
    "export type HomeworkSubmission = Tables<'homework_submissions'>;",
    '/** Sınav sonucu satır tipi */',
    "export type ExamResult = Tables<'exam_results'>;",
    '/** Etüt oturumu satır tipi */',
    "export type StudySession = Tables<'study_sessions'>;",
    '',
].join('\n');

const output = parsed.types + customTypes;
fs.writeFileSync(path.join(__dirname, '..', 'types', 'database.ts'), output, 'utf8');
console.log('OK - written ' + output.length + ' bytes');
