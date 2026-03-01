'use client';

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
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
        services: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateFormData = (data: Partial<RegistrationFormData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    const contextValue = useMemo(() => ({
        step,
        setStep,
        formData,
        updateFormData,
        isSubmitting,
        setIsSubmitting,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [step, formData, isSubmitting]);

    return (
        <RegistrationContext.Provider value={contextValue}>
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
