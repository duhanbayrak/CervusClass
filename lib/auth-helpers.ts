import { Profile, ProfileRole } from '@/types/database';

/**
 * Kullanıcı rolünü güvenli bir şekilde `roles` ilişkisinden çıkarır.
 * Supabase bazen tekil nesne bazen dizi dönebilir, bu fonksiyon her iki durumu da yönetir.
 * 
 * @param profile Kullanıcı profili nesnesi
 * @returns ProfileRole ('student', 'teacher', 'admin', 'super_admin') veya null
 */
export function getUserRole(profile: Partial<Profile> | null): ProfileRole | null {
    if (!profile || !profile.roles) {
        return null; // Rol bilgisi yok
    }

    const rolesData = profile.roles as any;

    // Array gelirse ilk elemanı al
    if (Array.isArray(rolesData)) {
        return (rolesData[0]?.name as ProfileRole) || null;
    }

    // Obje gelirse doğrudan name al
    return (rolesData.name as ProfileRole) || null;
}

/**
 * Kullanıcının belirli bir role sahip olup olmadığını kontrol eder.
 */
export function hasRole(profile: Profile | null, role: ProfileRole): boolean {
    return getUserRole(profile) === role;
}

export function isAdmin(profile: Profile | null): boolean {
    const role = getUserRole(profile);
    return role === 'admin' || role === 'super_admin';
}

export function isTeacher(profile: Profile | null): boolean {
    return getUserRole(profile) === 'teacher';
}

export function isStudent(profile: Profile | null): boolean {
    return getUserRole(profile) === 'student';
}
