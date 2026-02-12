import { AdminExamUploader } from '@/components/admin/exams/admin-exam-uploader'
import { GenerateMockButton } from "@/components/admin/exams/generate-mock-button"

export default function ExamUploadPage() {
    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col gap-4 max-w-md mx-auto">
                <h1 className="text-2xl font-bold text-center mb-6">Sınav Yükleme Paneli</h1>

                <AdminExamUploader />

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Test Araçları
                        </span>
                    </div>
                </div>

                <GenerateMockButton />
            </div>
        </div>
    )
}
