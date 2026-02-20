import {
    LayoutDashboard,
    Calendar,
    Library,
    Award,
    ClipboardList,
    Users,
    BookOpen,
    FileText,
    GraduationCap,
    School,
    BarChart,
    Building,
    Settings,
    CalendarCheck,
    Wallet,
    UserPlus
} from 'lucide-react';

export interface NavItem {
    title: string;
    href: string;
    icon: any;
    badge?: number; // Optional badge count
}

export const STUDENT_NAV: NavItem[] = [
    { title: 'Kontrol Paneli', href: '/student/dashboard', icon: LayoutDashboard },
    { title: 'Ders Programım', href: '/student/schedule', icon: Calendar },
    { title: 'Etüt Talepleri', href: '/student/study-requests', icon: Library },
    { title: 'Notlarım', href: '/student/grades', icon: Award },
    { title: 'Sınavlar', href: '/student/exams', icon: FileText },
    { title: 'Ödevler', href: '/student/homework', icon: ClipboardList },
    { title: 'Ödeme Durumum', href: '/student/payments', icon: Wallet },
];

export const TEACHER_NAV: NavItem[] = [
    { title: 'Kontrol Paneli', href: '/teacher/dashboard', icon: LayoutDashboard },
    { title: 'Ders Programı', href: '/teacher/schedule', icon: Calendar },
    { title: 'Öğrencilerim', href: '/teacher/students', icon: Users }, // Changed from 'Öğrenciler' to 'Öğrencilerim'
    { title: 'Yoklama', href: '/teacher/attendance', icon: CalendarCheck }, // Added Attendance item
    { title: 'Ödev Yönetimi', href: '/teacher/homework', icon: BookOpen },
    { title: 'Sınavlar', href: '/teacher/exams', icon: FileText },
];

export const ADMIN_NAV: NavItem[] = [
    { title: 'Kontrol Paneli', href: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Ders Programı', href: '/admin/schedule', icon: Calendar },
    { title: 'Öğretmenler', href: '/admin/teachers', icon: GraduationCap },
    { title: 'Öğrenciler', href: '/admin/students', icon: Users },
    { title: 'Yeni Kayıt', href: '/admin/registrations/new', icon: UserPlus },
    { title: 'Sınavlar', href: '/admin/exams', icon: FileText },
    { title: 'Sınıflar', href: '/admin/classes', icon: School },
    { title: 'Muhasebe', href: '/admin/accounting', icon: Wallet },
    { title: 'Raporlar', href: '/admin/reports', icon: BarChart },
];

export const SUPER_ADMIN_NAV: NavItem[] = [
    { title: 'Kontrol Paneli', href: '/super-admin/dashboard', icon: LayoutDashboard },
    { title: 'Kurumlar (Tenants)', href: '/super-admin/tenants', icon: Building },
    { title: 'Ayarlar', href: '/super-admin/settings', icon: Settings },
];
