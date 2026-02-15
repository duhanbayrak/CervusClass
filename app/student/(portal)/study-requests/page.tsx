import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Library, Plus } from 'lucide-react';

async function getRequests(userId: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                }
            }
        }
    );

    const { data: requests } = await supabase
        .from('study_sessions')
        .select(`
            *,
            teacher:profiles!teacher_id(full_name)
        `)
        .eq('student_id', userId)
        .order('created_at', { ascending: false });

    return requests || [];
}

import { BookSessionDialog } from '@/components/student/book-session-dialog';

export default async function StudentStudyRequestsPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                }
            }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const requests = await getRequests(user.id);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Etüt Talepleri</h2>
                    <p className="text-slate-500 dark:text-slate-400">Birebir ders taleplerinizi yönetin</p>
                </div>
                <BookSessionDialog userId={user.id} />
            </div>

            <div className="grid grid-cols-1 gap-4">
                {requests.length > 0 ? (
                    requests.map((req) => (
                        <Card key={req.id} className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:border-blue-200 transition-colors">
                            <div className="flex flex-col sm:flex-row">
                                <div className={`w-full sm:w-2 ${req.status === 'pending' ? 'bg-yellow-400' :
                                    req.status === 'approved' ? 'bg-green-500' :
                                        req.status === 'rejected' ? 'bg-red-500' : 'bg-slate-300'
                                    } h-2 sm:h-auto`}></div>

                                <div className="p-6 flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{req.topic}</h3>
                                            <Badge variant="outline" className={`capitalize ${req.status === 'pending' ? 'text-yellow-600 border-yellow-200 bg-yellow-50' :
                                                req.status === 'approved' ? 'text-green-600 border-green-200 bg-green-50' :
                                                    'text-slate-500'
                                                }`}>
                                                {req.status === 'pending' ? 'Bekliyor' : req.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                                            </Badge>
                                        </div>
                                        <p className="text-slate-500 flex items-center gap-2 text-sm">
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{req.teacher?.full_name}</span>
                                            <span>•</span>
                                            <span>{new Date(req.scheduled_at).toLocaleDateString('tr-TR', { dateStyle: 'full' })} - {new Date(req.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </p>
                                        {req.notes && (
                                            <p className="text-sm text-slate-500 mt-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-md italic">
                                                "{req.notes}"
                                            </p>
                                        )}
                                    </div>

                                    {req.status === 'pending' && (
                                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                                            İptal Et
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 flex flex-col items-center justify-center text-center">
                        <Library className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">Talep Bulunamadı</h3>
                        <p className="text-slate-500 mb-6 max-w-sm">
                            Henüz hiç etüt talebi oluşturmadınız. Eksik hissettiğiniz konularda öğretmenlerinizden yardım isteyebilirsiniz.
                        </p>
                        <div className="mt-4">
                            <BookSessionDialog userId={user.id} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
