import { StudentList } from "@/components/student/student-list";
import { StudentUploader } from "@/components/student/student-uploader";

export default function StudentManagementPage() {
    return (
        <div className="flex flex-col gap-4 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Öğrenci Yönetimi</h2>
                    <p className="text-muted-foreground">
                        Sistemdeki öğrencileri görüntüleyin, ekleyin veya düzenleyin.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="md:col-span-1">
                    <StudentUploader />
                </div>
            </div>

            <StudentList />
        </div>
    );
}
