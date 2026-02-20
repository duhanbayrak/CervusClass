'use client';

import { useRegistration } from './RegistrationContext';
import { Step1Personal } from './steps/Step1Personal';
import { Step2Academic } from './steps/Step2Academic';
import { Step3Financial } from './steps/Step3Financial';
import { Step4Summary } from './steps/Step4Summary';

export function RegistrationWizard() {
    const { step } = useRegistration();

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 min-h-[500px]">
            {step === 1 && <Step1Personal />}
            {step === 2 && <Step2Academic />}
            {step === 3 && <Step3Financial />}
            {step === 4 && <Step4Summary />}
        </div>
    );
}
