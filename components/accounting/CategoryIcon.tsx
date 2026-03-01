import {
    GraduationCap, UserPlus, BookOpen, Award, PartyPopper, Plus, Users,
    Building, Zap, Droplets, Flame, Wifi, Paperclip, Wrench, Megaphone,
    Shield, Receipt, Minus, HelpCircle, LucideIcon
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
    GraduationCap, UserPlus, BookOpen, Award, PartyPopper, Plus, Users,
    Building, Zap, Droplets, Flame, Wifi, Paperclip, Wrench, Megaphone,
    Shield, Receipt, Minus
};

interface CategoryIconProps {
    iconName?: string | null;
    className?: string;
}

export function CategoryIcon({ iconName, className = "w-4 h-4" }: CategoryIconProps) { // NOSONAR
    if (!iconName) return null;

    // Eğer emoji ise text olarak renderla
    if (/\p{Emoji}/u.test(iconName) || iconName.length <= 2) {
        return <span className={`mr-1 inline-block text-base leading-none ${className || ''}`}>{iconName}</span>;
    }

    const Icon = CATEGORY_ICONS[iconName] || HelpCircle;
    return <Icon className={`mr-1 inline-block ${className}`} />;
}
