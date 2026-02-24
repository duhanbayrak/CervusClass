'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRegistration } from '../RegistrationContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { getClasses } from '@/lib/actions/class';
import { ClassWithCount } from '@/types/database';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const academicSchema = z.object({
    classId: z.string().min(1, 'Sınıf seçimi zorunludur'),
    academicPeriod: z.string().min(1, 'Akademik dönem girilmelidir'),
});

type AcademicFormData = z.infer<typeof academicSchema>;

export function Step2Academic() {
    const { formData, updateFormData, setStep } = useRegistration();
    const [classes, setClasses] = useState<ClassWithCount[]>([]);
    const [loading, setLoading] = useState(true);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AcademicFormData>({
        resolver: zodResolver(academicSchema),
        defaultValues: {
            classId: formData.classId || '',
            academicPeriod: formData.academicPeriod || '2025-2026',
        }
    });

    const currentClassId = watch('classId');

    useEffect(() => {
        async function fetchClasses() {
            setLoading(true);
            const res = await getClasses();
            if (res.success) {
                setClasses(res.data);
            }
            setLoading(false);
        }
        fetchClasses();
    }, []);

    const onSubmit = (data: AcademicFormData) => {
        const selectedClass = classes.find(c => c.id === data.classId);
        updateFormData({
            ...data,
            className: selectedClass ? selectedClass.name : undefined
        });
        setStep(3); // Adım 3 (Finansal)
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Akademik Bilgiler</h2>
                <p className="text-muted-foreground">Öğrencinin yerleştirileceği sınıfı ve dönemi seçin.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Yerleştirme</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="space-y-2">
                            <Label htmlFor="academicPeriod">Akademik Dönem <span className="text-red-500">*</span></Label>
                            <Input id="academicPeriod" {...register('academicPeriod')} placeholder="Örn: 2025-2026" />
                            {errors.academicPeriod && <p className="text-sm text-red-500">{errors.academicPeriod.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Sınıf / Şube <span className="text-red-500">*</span></Label>
                            <Select
                                disabled={loading}
                                value={currentClassId}
                                onValueChange={(val) => {
                                    setValue('classId', val, { shouldValidate: true });
                                }}
                            >
                                <SelectTrigger className={errors.classId ? "border-red-500" : ""}>
                                    <SelectValue placeholder={loading ? "Sınıflar Yükleniyor..." : "Sınıf Seçiniz"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id}>
                                            {cls.name} (Grup: {cls.grade_level})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.classId && <p className="text-sm text-red-500">{errors.classId.message}</p>}
                        </div>

                    </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                        <Button type="button" variant="outline" onClick={() => setStep(1)}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Geri: Kişisel Bilgiler
                        </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                        <Button type="submit">
                            İleri: Finansal Bilgiler
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </motion.div>
                </div>
            </form>
        </div>
    );
}
