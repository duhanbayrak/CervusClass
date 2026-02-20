// types/supabase.ts
// Bu dosya artık database.ts'den re-export eder.
// Supabase CLI çıktısının tek bir kaynaktan yönetilmesini sağlar.
export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes } from './database';
export { Constants } from './database';
