'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { RegistrationFormData } from '@/lib/actions/student-registration';

// Context State
type RegistrationState = {
    step: number;
    setStep: (step: number) => void;
    formData: Partial<RegistrationFormData>;
    updateFormData: (data: Partial<RegistrationFormData>) => void;
    isSubmitting: boolean;
    setIsSubmitting: (isSubmitting: boolean) => void;
};

const RegistrationContext = createContext<RegistrationState | undefined>(undefined);

export function RegistrationProvider({ children }: { children: ReactNode }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<Partial<RegistrationFormData>>({
        paymentDueDay: 5, // Default
        installmentCount: 1, // Default
        discountAmount: 0,
        downPayment: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateFormData = (data: Partial<RegistrationFormData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    return (
        <RegistrationContext.Provider value={{
            step,
            setStep,
            formData,
            updateFormData,
            isSubmitting,
            setIsSubmitting
        }}>
            {children}
        </RegistrationContext.Provider>
    );
}

export function useRegistration() {
    const context = useContext(RegistrationContext);
    if (context === undefined) {
        throw new Error('useRegistration must be used within a RegistrationProvider');
    }
    return context;
}
