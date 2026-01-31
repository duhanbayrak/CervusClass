export type ProfileRole = 'student' | 'teacher' | 'admin' | 'super_admin';

export const PROTECTED_PATHS = {
    '/student': ['student'],
    '/teacher': ['teacher'],
    '/admin': ['admin'],
    '/super-admin': ['super_admin']
};
