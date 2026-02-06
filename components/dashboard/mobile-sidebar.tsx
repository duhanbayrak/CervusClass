import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import Sidebar from './sidebar';
import { NavItem } from '@/lib/navigation';

interface MobileSidebarProps {
    items: NavItem[];
    basePath: string;
    title?: string;
    subtitle?: string;
}

export default function MobileSidebar({ items, basePath, title, subtitle }: MobileSidebarProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="md:hidden pr-4 hover:opacity-75 transition">
                <Menu className="w-6 h-6 text-slate-700 dark:text-white" />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-transparent border-none w-72">
                <SheetTitle className="sr-only">{title || "Menu"}</SheetTitle>
                <SheetDescription className="sr-only">Navigasyon menüsü</SheetDescription>
                <Sidebar
                    items={items}
                    basePath={basePath}
                    title={title}
                    subtitle={subtitle}
                    className="flex w-full h-full static"
                    onNavigate={() => setOpen(false)}
                />
            </SheetContent>
        </Sheet>
    );
}
