'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRegistration } from '../RegistrationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const personalSchema = z.object({
    firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
    lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    tcNo: z.string().length(11, 'TC Kimlik No tam 11 haneli olmalıdır').regex(/^[0-9]+$/, 'Sadece rakam giriniz'),
    phone: z.string().optional(),
    birthDate: z.string().optional(),
    parentFirstName: z.string().min(2, 'Veli adı en az 2 karakter olmalıdır'),
    parentLastName: z.string().min(2, 'Veli soyadı en az 2 karakter olmalıdır'),
    parentPhone: z.string().min(10, 'Geçerli bir telefon numarası giriniz'),
    parentEmail: z.string().email('Geçerli bir e-posta adresi giriniz').optional().or(z.literal('')),
    parentTcNo: z.string().optional().refine(val => !val || (val.length === 11 && /^[0-9]+$/.test(val)), 'TC Kimlik No tam 11 haneli rakam olmalıdır'),
    parentRelationship: z.string().min(2, 'Yakınlık derecesi zorunludur'),
    parentAddress: z.string().optional(),
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
            tcNo: formData.tcNo || '',
            phone: formData.phone || '',
            birthDate: formData.birthDate || '',
            parentFirstName: formData.parentFirstName || '',
            parentLastName: formData.parentLastName || '',
            parentPhone: formData.parentPhone || '',
            parentEmail: formData.parentEmail || '',
            parentTcNo: formData.parentTcNo || '',
            parentRelationship: formData.parentRelationship || '',
            parentAddress: formData.parentAddress || '',
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
                                <Label htmlFor="tcNo">TC Kimlik No <span className="text-red-500">*</span></Label>
                                <Input id="tcNo" maxLength={11} {...register('tcNo')} placeholder="11 haneli TC kimlik numarası" />
                                {errors.tcNo && <p className="text-sm text-red-500">{errors.tcNo.message}</p>}
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
                            <CardTitle className="text-lg">Veli Bilgileri</CardTitle>
                            <CardDescription>Öğrencinin velisine ait zorunlu ve isteğe bağlı belgeler.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="parentFirstName">Veli Adı <span className="text-red-500">*</span></Label>
                                <Input id="parentFirstName" {...register('parentFirstName')} placeholder="Veli Adı" />
                                {errors.parentFirstName && <p className="text-sm text-red-500">{errors.parentFirstName.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parentLastName">Veli Soyadı <span className="text-red-500">*</span></Label>
                                <Input id="parentLastName" {...register('parentLastName')} placeholder="Veli Soyadı" />
                                {errors.parentLastName && <p className="text-sm text-red-500">{errors.parentLastName.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parentPhone">Veli Telefon <span className="text-red-500">*</span></Label>
                                <Input id="parentPhone" {...register('parentPhone')} placeholder="05XX XXX XX XX" />
                                {errors.parentPhone && <p className="text-sm text-red-500">{errors.parentPhone.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parentRelationship">Yakınlık Türü (Örn: Anne, Baba) <span className="text-red-500">*</span></Label>
                                <Input id="parentRelationship" {...register('parentRelationship')} placeholder="Yakınlık Derecesi" />
                                {errors.parentRelationship && <p className="text-sm text-red-500">{errors.parentRelationship.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parentEmail">Veli E-posta</Label>
                                <Input id="parentEmail" type="email" {...register('parentEmail')} placeholder="veli@email.com" />
                                {errors.parentEmail && <p className="text-sm text-red-500">{errors.parentEmail.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parentTcNo">Veli TC Kimlik No</Label>
                                <Input id="parentTcNo" maxLength={11} {...register('parentTcNo')} placeholder="11 haneli TC No" />
                                {errors.parentTcNo && <p className="text-sm text-red-500">{errors.parentTcNo.message}</p>}
                            </div>
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <Label htmlFor="parentAddress">Veli Adres</Label>
                                <Textarea id="parentAddress" {...register('parentAddress')} placeholder="Tam Adres" rows={3} className="resize-none" />
                                {errors.parentAddress && <p className="text-sm text-red-500">{errors.parentAddress.message}</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end pt-4">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                        <Button type="submit">
                            İleri: Akademik Bilgiler
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </motion.div>
                </div>
            </form>
        </div>
    );
}
