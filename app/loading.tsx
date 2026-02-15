import { BookOpen } from "lucide-react";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-all duration-300">
            <div className="relative flex items-center justify-center mb-6 scale-110">
                {/* Outer Pulsing Ring */}
                <div className="absolute w-24 h-24 rounded-full border-4 border-blue-100 dark:border-blue-900/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>

                {/* Rotating Border */}
                <div className="absolute w-20 h-20 rounded-full border-2 border-slate-100 dark:border-slate-800 border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>

                {/* Inner Icon Container */}
                <div className="relative bg-white dark:bg-slate-900 p-4 rounded-full shadow-xl border border-slate-100 dark:border-slate-800 z-10">
                    <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400 fill-blue-50 dark:fill-blue-900/20" />
                </div>
            </div>

            <div className="flex flex-col items-center gap-3">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-sans">
                    Cervus<span className="text-blue-600 dark:text-blue-400">Class</span>
                </h3>
                <div className="flex items-center gap-1.5 h-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"></span>
                </div>
            </div>
        </div>
    );
}
