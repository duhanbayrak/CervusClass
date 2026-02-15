import { ClassList } from "@/components/class/class-list";
import { GraduationCap } from "lucide-react";
import { getAuthContext } from "@/lib/auth-context";
import { getClasses } from "@/lib/actions/class";

export default async function ClassManagementPage() {
    // Merkezi auth context
    const { user } = await getAuthContext();
    if (!user) return null;

    // Sınıfları çek
    const res = await getClasses();
    const classes = res.success ? res.data : [];

    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                    <GraduationCap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Sınıf Yönetimi
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Sınıflarınızı görüntüleyin ve yönetin.
                    </p>
                </div>
            </div>

            <ClassList initialData={classes || []} />
        </div>
    );
}
