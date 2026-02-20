'use client';

import { useRegistration } from './RegistrationContext';
import { User, BookOpen, CreditCard, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
    { id: 1, title: 'Kişisel Bilgiler', icon: User, description: 'Öğrenci ve Veli Bilgileri' },
    { id: 2, title: 'Akademik', icon: BookOpen, description: 'Sınıf ve Dönem' },
    { id: 3, title: 'Finansal', icon: CreditCard, description: 'Ücret ve Taksitler' },
    { id: 4, title: 'Onay', icon: CheckCircle, description: 'Özet ve Kayıt' }
];

export function RegistrationStepper() {
    const { step } = useRegistration();

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-20">
            <h3 className="text-lg font-semibold mb-6">Kayıt Adımları</h3>
            <div className="space-y-6">
                {steps.map((s, index) => {
                    const isActive = step === s.id;
                    const isCompleted = step > s.id;

                    return (
                        <div key={s.id} className="relative flex items-start group">
                            {/* Connector Line */}
                            {index !== steps.length - 1 && (
                                <div className={cn("absolute left-5 top-10 bottom-[-24px] w-0.5", isCompleted ? "bg-primary" : "bg-gray-200")} />
                            )}

                            {/* Icon Circle */}
                            <div className={cn(
                                "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300",
                                isActive ? "border-primary bg-primary text-primary-foreground shadow-md" :
                                    isCompleted ? "border-primary bg-primary text-primary-foreground" :
                                        "border-gray-200 bg-white text-gray-400"
                            )}>
                                <s.icon className="w-5 h-5" />
                            </div>

                            {/* Text */}
                            <div className="ml-4 mt-1">
                                <p className={cn("text-sm font-medium transition-colors", isActive || isCompleted ? "text-gray-900" : "text-gray-500")}>{s.title}</p>
                                <p className="text-xs text-gray-400">{s.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
