export type ProfileRole = 'student' | 'teacher' | 'admin' | 'super_admin';

export const ROLES = {
    STUDENT: 'student',
    TEACHER: 'teacher',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
} as const;

export const PROTECTED_PATHS = {
    '/student': ['student'],
    '/teacher': ['teacher', 'admin', 'super_admin'],
    '/admin': ['admin', 'super_admin'],
    '/super-admin': ['super_admin']
};
