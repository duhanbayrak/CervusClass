import { ClassList } from "@/components/class/class-list";

export default function ClassManagementPage() {
    return (
        <div className="flex flex-col gap-4 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Sınıf Yönetimi</h2>
                    <p className="text-muted-foreground">
                        Sınıfları yönetin.
                    </p>
                </div>
            </div>

            <ClassList />
        </div>
    );
}
