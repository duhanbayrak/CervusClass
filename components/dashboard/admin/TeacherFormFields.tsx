'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface TeacherFormData {
    fullName: string;
    branch: string;
    email: string;
    password: string;
    phone: string;
    title: string;
    bio: string;
}

interface TeacherFormFieldsProps {
    formData: TeacherFormData;
    onChange: (data: TeacherFormData) => void;
    branches: string[];
    /** Düzenleme modunda şifre alanı gizlenir */
    isEditing: boolean;
}

/** Öğretmen ekleme/düzenleme formlarında kullanılan paylaşımlı alan bileşeni */
export function TeacherFormFields({ formData, onChange, branches, isEditing }: Readonly<TeacherFormFieldsProps>) {
    const set = (patch: Partial<TeacherFormData>) => onChange({ ...formData, ...patch });

    const handlePhoneChange = (value: string) => {
        let val = value.replaceAll(/\D/g, '');
        if (val.startsWith('0')) val = val.substring(1);
        if (val.length > 10) val = val.substring(0, 10);
        set({ phone: val });
    };

    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor="name">Ad Soyad</Label>
                <Input
                    id="name"
                    placeholder="Örn: Ahmet Yılmaz"
                    value={formData.fullName}
                    onChange={(e) => set({ fullName: e.target.value })}
                    required
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="branch">Branş</Label>
                <Select
                    value={formData.branch}
                    onValueChange={(val) => set({ branch: val })}
                    required
                >
                    <SelectTrigger id="branch">
                        <SelectValue placeholder="Branş Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                        {branches.length > 0 ? (
                            branches.map((branch) => (
                                <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                            ))
                        ) : (
                            <div className="p-2 text-sm text-slate-500 text-center">Branş bulunamadı.</div>
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="ornek@cervus.com"
                    value={formData.email}
                    onChange={(e) => set({ email: e.target.value })}
                    required
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                    id="phone"
                    placeholder="555 555 55 55"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="title">Unvan</Label>
                <Input
                    id="title"
                    placeholder="Örn: Uzman Matematik Öğretmeni"
                    value={formData.title}
                    onChange={(e) => set({ title: e.target.value })}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="bio">Biyografi</Label>
                <Input
                    id="bio"
                    placeholder="Kısa özgeçmiş..."
                    value={formData.bio}
                    onChange={(e) => set({ bio: e.target.value })}
                />
            </div>

            {!isEditing && (
                <div className="grid gap-2">
                    <Label htmlFor="password">Geçici Şifre</Label>
                    <Input
                        id="password"
                        type="text"
                        placeholder="Şifre belirleyin"
                        value={formData.password}
                        onChange={(e) => set({ password: e.target.value })}
                        required
                    />
                </div>
            )}
        </>
    );
}
