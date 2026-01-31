import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, AlertCircle, FileText } from 'lucide-react';

async function getHomework(userId: string) {
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

    // Get user's class_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('class_id')
        .eq('id', userId)
        .single();

    if (!profile?.class_id) return [];

    const { data: homework } = await supabase
        .from('homework')
        .select(`
            *,
            teacher:profiles!teacher_id(full_name)
        `)
        .eq('class_id', profile.class_id)
        .order('due_date', { ascending: true });

    return homework || [];
}

export default async function StudentHomeworkPage() {
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

    const allHomework = await getHomework(user.id);

    // Simple mock logic for "submitted" vs "pending" - Schema doesn't have submissions yet
    // Assuming everything future is pending, everything past is overdue (or submitted if we had that data)
    // For now, listing all.
    const pendingHomework = allHomework.filter(hw => new Date(hw.due_date) >= new Date());
    const pastHomework = allHomework.filter(hw => new Date(hw.due_date) < new Date());

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Ödevlerim</h2>
                    <p className="text-slate-500 dark:text-slate-400">Bekleyen ve tamamlanan ödevler</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <FileText className="w-5 h-5 text-blue-500" />
                </div>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="pending">Bekleyen ({pendingHomework.length})</TabsTrigger>
                    <TabsTrigger value="past">Geçmiş ({pastHomework.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    {pendingHomework.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingHomework.map((hw) => (
                                <HomeworkCard key={hw.id} hw={hw} status="pending" />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mb-3">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Harika!</h3>
                            <p className="text-sm text-slate-500">Hiç bekleyen ödevin yok.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="past" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pastHomework.map((hw) => (
                            <HomeworkCard key={hw.id} hw={hw} status="past" />
                        ))}
                        {pastHomework.length === 0 && (
                            <p className="text-slate-500 text-center col-span-3 py-8">Geçmiş ödev bulunamadı.</p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function HomeworkCard({ hw, status }: { hw: any, status: 'pending' | 'past' }) {
    const dueDate = new Date(hw.due_date);
    const isUrgent = status === 'pending' && (dueDate.getTime() - new Date().getTime()) < (3 * 24 * 60 * 60 * 1000); // Less than 3 days

    return (
        <Card className={`border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-300 transition-colors flex flex-col ${status === 'past' ? 'opacity-75' : ''
            }`}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <Badge variant={isUrgent ? 'destructive' : 'secondary'} className="mb-2">
                        {isUrgent ? 'Acele Et' : 'Ödev'}
                    </Badge>
                    <span className="text-xs text-slate-400 font-medium">
                        {status === 'pending' ? 'Son Teslim:' : 'Bitiş:'} {dueDate.toLocaleDateString('tr-TR')}
                    </span>
                </div>
                <CardTitle className="text-base line-clamp-2">{hw.description}</CardTitle>
                <CardDescription className="text-xs">
                    {hw.teacher?.full_name}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end pt-0">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-3">
                    {/* Description is already in title but if we had a longer body here.. */}
                    Detaylı açıklama için tıklayın.
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-3 mt-auto">
                    <Clock className="w-3 h-3" />
                    <span>23:59'a kadar</span>
                </div>
            </CardContent>
        </Card>
    );
}
