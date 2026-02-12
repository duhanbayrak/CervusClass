'use server'

import { createClient } from '@supabase/supabase-js' // Use supabase-js for admin client
import * as XLSX from 'xlsx'

interface ExamStats {
    correct: number;
    incorrect: number;
    empty: number;
    net: number;
}

function generateStats(totalQuestions: number): ExamStats {
    // Constraint: Correct >= 10
    const minCorrect = 10;
    const maxCorrect = totalQuestions;

    // Random correct between 10 and total
    const correct = Math.floor(Math.random() * (maxCorrect - minCorrect + 1)) + minCorrect;

    // Remaining for incorrect/empty
    const remaining = totalQuestions - correct;

    // Random incorrect from remaining
    const incorrect = Math.floor(Math.random() * (remaining + 1));

    const empty = remaining - incorrect;

    // Net calculation: Correct - (Incorrect / 4)
    const net = correct - (incorrect / 4);

    return { correct, incorrect, empty, net };
}

export async function generateMockExamExcel() {
    try {
        // Initialize Supabase Admin Client to bypass RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('Missing Supabase credentials for Admin client.');
            return { success: false, message: 'Sunucu yapılandırma hatası: Admin anahtarı eksik.' };
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 1. Fetch all students, ordered alphabetically by name
        // Using upsert/select with admin client bypasses RLS
        const { data: students, error } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, student_number')
            .not('student_number', 'is', null) // Ensure student number exists
            .order('full_name', { ascending: true }); // Alphabetical sort

        if (error) {
            console.error('Error fetching students with Admin client:', error);
            return { success: false, message: 'Öğrenciler getirilemedi (DB Hatası).' };
        }

        if (!students || students.length === 0) {
            console.warn('No students found in profiles table.');
            return { success: false, message: 'Kayıtlı öğrenci bulunamadı.' };
        }

        // 2. Prepare Excel Data (Array of Arrays)
        // Explicit Header Row
        const headerRow = [
            'Ad Soyad',
            'Numara',
            'Türkçe Doğru', 'Türkçe Yanlış', 'Türkçe Boş', 'Türkçe Net',
            'Matematik Doğru', 'Matematik Yanlış', 'Matematik Boş', 'Matematik Net',
            'Sosyal Doğru', 'Sosyal Yanlış', 'Sosyal Boş', 'Sosyal Net',
            'Fen Doğru', 'Fen Yanlış', 'Fen Boş', 'Fen Net',
            'Toplam Net'
        ];

        const dataRows = students.map(student => {
            // Generate stats for each lesson
            const turkish = generateStats(40);
            const math = generateStats(40);
            const social = generateStats(20);
            const science = generateStats(20);

            const totalNet = turkish.net + math.net + social.net + science.net;

            return [
                student.full_name,
                student.student_number,

                // Turkish
                turkish.correct, turkish.incorrect, turkish.empty, turkish.net,

                // Math
                math.correct, math.incorrect, math.empty, math.net,

                // Social
                social.correct, social.incorrect, social.empty, social.net,

                // Science
                science.correct, science.incorrect, science.empty, science.net,

                // Total
                totalNet
            ];
        });

        const allRows = [headerRow, ...dataRows];

        // 3. Create Workbook using aoa_to_sheet
        const worksheet = XLSX.utils.aoa_to_sheet(allRows);

        // Adjust column widths for better readability
        const wscols = [
            { wch: 25 }, // Ad Soyad
            { wch: 15 }, // Numara
            { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, // Turkish
            { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, // Math
            { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, // Social
            { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, // Science
            { wch: 12 }  // Total
        ];
        worksheet['!cols'] = wscols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sonuçlar');

        // 4. Generate Buffer
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });

        return {
            success: true,
            data: excelBuffer,
            filename: `mock_exam_${new Date().toISOString().split('T')[0]}.xlsx`
        };

    } catch (error: any) {
        console.error('Error generating mock exam:', error);
        return {
            success: false,
            message: 'Excel oluşturulurken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata')
        };
    }
}
