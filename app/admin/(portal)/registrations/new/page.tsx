import { RegistrationProvider } from '@/components/registrations/RegistrationContext';
import { RegistrationStepper } from '@/components/registrations/RegistrationStepper';
import { RegistrationWizard } from '@/components/registrations/RegistrationWizard';

export default function NewRegistrationPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Yeni Öğrenci Kaydı</h2>
                    <p className="text-muted-foreground">Birkaç adımda öğrencinin sisteme, sınıfa ve muhasebeye kaydını tamamlayın.</p>
                </div>
            </div>
            <RegistrationProvider>
                <div className="flex flex-col lg:flex-row gap-6 mt-6">
                    {/* Sol Kısım: Stepper */}
                    <div className="w-full lg:w-1/4">
                        <RegistrationStepper />
                    </div>

                    {/* Sağ Kısım: Form İçeriği */}
                    <div className="w-full lg:w-3/4">
                        <RegistrationWizard />
                    </div>
                </div>
            </RegistrationProvider>
        </div>
    );
}
