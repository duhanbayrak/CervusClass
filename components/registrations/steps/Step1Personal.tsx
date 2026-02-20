'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRegistration } from '../RegistrationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const personalSchema = z.object({
    firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
    lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    studentNumber: z.string().optional(),
    phone: z.string().optional(),
    birthDate: z.string().optional(),
    parentName: z.string().optional(),
    parentPhone: z.string().optional(),
});

type PersonalFormData = z.infer<typeof personalSchema>;

export function Step1Personal() {
    const { formData, updateFormData, setStep } = useRegistration();

    const { register, handleSubmit, formState: { errors } } = useForm<PersonalFormData>({
        resolver: zodResolver(personalSchema),
        defaultValues: {
            firstName: formData.firstName || '',
            lastName: formData.lastName || '',
            email: formData.email || '',
            studentNumber: formData.studentNumber || '',
            phone: formData.phone || '',
            birthDate: formData.birthDate || '',
            parentName: formData.parentName || '',
            parentPhone: formData.parentPhone || '',
        }
    });

    const onSubmit = (data: PersonalFormData) => {
        updateFormData(data);
        setStep(2); // İleri
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Kişisel Bilgiler</h2>
                <p className="text-muted-foreground">Öğrenci ve iletişim bilgilerini eksiksiz girin.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Öğrenci Bilgileri */}
                    <Card className="col-span-1 md:col-span-2">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Öğrenci Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Ad <span className="text-red-500">*</span></Label>
                                <Input id="firstName" {...register('firstName')} placeholder="Ad" />
                                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Soyad <span className="text-red-500">*</span></Label>
                                <Input id="lastName" {...register('lastName')} placeholder="Soyad" />
                                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta <span className="text-red-500">*</span></Label>
                                <Input id="email" type="email" {...register('email')} placeholder="ogrenci@email.com" />
                                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="studentNumber">TC Kimlik / Öğrenci No</Label>
                                <Input id="studentNumber" {...register('studentNumber')} placeholder="Kimlik no veya okul no" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon</Label>
                                <Input id="phone" {...register('phone')} placeholder="05XX XXX XX XX" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birthDate">Doğum Tarihi</Label>
                                <Input id="birthDate" type="date" {...register('birthDate')} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Veli Bilgileri */}
                    <Card className="col-span-1 md:col-span-2">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Veli İletişim Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="parentName">Veli Ad Soyad</Label>
                                <Input id="parentName" {...register('parentName')} placeholder="Veli Adı Soyadı" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parentPhone">Veli Telefon</Label>
                                <Input id="parentPhone" {...register('parentPhone')} placeholder="05XX XXX XX XX" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit">İleri: Akademik Bilgiler</Button>
                </div>
            </form>
        </div>
    );
}
