'use server'

import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { logger } from '@/lib/logger'

interface ExamStats {
    correct: number;
    incorrect: number;
    empty: number;
    net: number;
}

function generateStats(totalQuestions: number): ExamStats {
    const minCorrect = Math.max(0, Math.floor(totalQuestions * 0.2)); // At least 20% correct to avoid 0s
    const maxCorrect = totalQuestions;

    const correct = Math.floor(Math.random() * (maxCorrect - minCorrect + 1)) + minCorrect;
    const remaining = totalQuestions - correct;
    const incorrect = Math.floor(Math.random() * (remaining + 1));
    const empty = remaining - incorrect;
    const net = correct - (incorrect / 4);

    return { correct, incorrect, empty, net };
}

export async function generateMockExamExcel(type: 'TYT' | 'AYT' = 'TYT') {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return { success: false, message: 'Sunucu yapılandırma hatası: Admin anahtarı eksik.' };
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const { data: students, error } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, student_number')
            .not('student_number', 'is', null)
            .order('full_name', { ascending: true });

        if (error || !students) {
            return { success: false, message: 'Öğrenciler getirilemedi.' };
        }

        let headerRow: string[] = [];
        let dataRows: any[] = [];
        let colWidths: any[] = [];

        if (type === 'TYT') {
            headerRow = [
                'Ad Soyad', 'Numara',
                'Türkçe Doğru', 'Türkçe Yanlış', 'Türkçe Boş', 'Türkçe Net',
                'Matematik Doğru', 'Matematik Yanlış', 'Matematik Boş', 'Matematik Net',
                'Sosyal Doğru', 'Sosyal Yanlış', 'Sosyal Boş', 'Sosyal Net',
                'Fen Doğru', 'Fen Yanlış', 'Fen Boş', 'Fen Net',
                'TYT Toplam Net'
            ];

            dataRows = students.map(student => {
                const tr = generateStats(40);
                const mat = generateStats(40);
                const sos = generateStats(20);
                const fen = generateStats(20);
                const total = tr.net + mat.net + sos.net + fen.net;

                return [
                    student.full_name, student.student_number,
                    tr.correct, tr.incorrect, tr.empty, tr.net,
                    mat.correct, mat.incorrect, mat.empty, mat.net,
                    sos.correct, sos.incorrect, sos.empty, sos.net,
                    fen.correct, fen.incorrect, fen.empty, fen.net,
                    total
                ];
            });

            // Widths: Name(25), Num(15), 4*4=16 cols (10), Total(12)
            colWidths = [
                { wch: 25 }, { wch: 15 },
                ...new Array(16).fill({ wch: 8 }),
                { wch: 12 }
            ];

        } else {
            // AYT Schema
            headerRow = [
                'Ad Soyad', 'Numara',
                // Matematik (40)
                'Matematik Doğru', 'Matematik Yanlış', 'Matematik Boş', 'Matematik Net',
                // Fen (Fizik 14, Kimya 13, Biyoloji 13)
                'Fizik Doğru', 'Fizik Yanlış', 'Fizik Boş', 'Fizik Net',
                'Kimya Doğru', 'Kimya Yanlış', 'Kimya Boş', 'Kimya Net',
                'Biyoloji Doğru', 'Biyoloji Yanlış', 'Biyoloji Boş', 'Biyoloji Net',
                'AYT Fen Toplam Net', // Aggregated
                // TDE-Sos1 (Edebiyat 24, Tarih1 10, Cog1 6)
                'Edebiyat Doğru', 'Edebiyat Yanlış', 'Edebiyat Boş', 'Edebiyat Net',
                'Tarih-1 Doğru', 'Tarih-1 Yanlış', 'Tarih-1 Boş', 'Tarih-1 Net',
                'Coğrafya-1 Doğru', 'Coğrafya-1 Yanlış', 'Coğrafya-1 Boş', 'Coğrafya-1 Net',
                'AYT TDE-Sos1 Toplam Net', // Aggregated
                // Sosyal-2 (Tarih2 11, Cog2 11, Felsefe 12, Din 6)
                'Tarih-2 Doğru', 'Tarih-2 Yanlış', 'Tarih-2 Boş', 'Tarih-2 Net',
                'Coğrafya-2 Doğru', 'Coğrafya-2 Yanlış', 'Coğrafya-2 Boş', 'Coğrafya-2 Net',
                'Felsefe Doğru', 'Felsefe Yanlış', 'Felsefe Boş', 'Felsefe Net',
                'Din K. Doğru', 'Din K. Yanlış', 'Din K. Boş', 'Din K. Net',
                'AYT Sosyal-2 Toplam Net', // Aggregated
                // Grand Total
                'AYT Toplam Net'
            ];

            dataRows = students.map(student => {
                // Mat
                const mat = generateStats(40);

                // Fen
                const fiz = generateStats(14);
                const kim = generateStats(13);
                const bio = generateStats(13);
                const fenTotal = fiz.net + kim.net + bio.net;

                // TDE-Sos1
                const edb = generateStats(24);
                const tar1 = generateStats(10);
                const cog1 = generateStats(6);
                const tdeTotal = edb.net + tar1.net + cog1.net;

                // Sos2
                const tar2 = generateStats(11);
                const cog2 = generateStats(11);
                const fel = generateStats(12);
                const din = generateStats(6);
                const sos2Total = tar2.net + cog2.net + fel.net + din.net;

                const grandTotal = mat.net + fenTotal + tdeTotal + sos2Total;

                return [
                    student.full_name, student.student_number,
                    // Mat
                    mat.correct, mat.incorrect, mat.empty, mat.net,
                    // Fen
                    fiz.correct, fiz.incorrect, fiz.empty, fiz.net,
                    kim.correct, kim.incorrect, kim.empty, kim.net,
                    bio.correct, bio.incorrect, bio.empty, bio.net,
                    fenTotal,
                    // TDE
                    edb.correct, edb.incorrect, edb.empty, edb.net,
                    tar1.correct, tar1.incorrect, tar1.empty, tar1.net,
                    cog1.correct, cog1.incorrect, cog1.empty, cog1.net,
                    tdeTotal,
                    // Sos2
                    tar2.correct, tar2.incorrect, tar2.empty, tar2.net,
                    cog2.correct, cog2.incorrect, cog2.empty, cog2.net,
                    fel.correct, fel.incorrect, fel.empty, fel.net,
                    din.correct, din.incorrect, din.empty, din.net,
                    sos2Total,
                    // Grand
                    grandTotal
                ];
            });

            // Standard width for all data columns
            colWidths = [
                { wch: 25 }, { wch: 15 },
                // Mat (4)
                ...new Array(4).fill({ wch: 9 }),
                // Fen (3*4 + 1) = 13
                ...new Array(13).fill({ wch: 9 }),
                // TDE (3*4 + 1) = 13
                ...new Array(13).fill({ wch: 9 }),
                // Sos2 (4*4 + 1) = 17
                ...new Array(17).fill({ wch: 9 }),
                // Total
                { wch: 12 }
            ];
        }

        const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sonuçlar');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });

        return {
            success: true,
            data: excelBuffer,
            filename: `mock_exam_${type}_${new Date().toISOString().split('T')[0]}.xlsx`
        };

    } catch (error: unknown) {
        logger.error('Deneme sınavı oluşturma hatası', { action: 'generateMockExam' }, error);
        return { success: false, message: 'Hata: ' + (error instanceof Error ? error.message : 'Beklenmedik hata') };
    }
}
