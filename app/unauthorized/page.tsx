import { Button } from "@/components/ui/button";
import Link from "next/link";
import SignOutButton from "@/components/auth/sign-out-button";

export default async function UnauthorizedPage() {
    // We can try to get role info here too, but middleware is the one redirecting.
    // Let's just provide navigation options.

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md text-center space-y-6 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto text-red-600 text-3xl font-bold">
                    !
                </div>

                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Yetkisiz Erişim</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Bu sayfaya erişim yetkiniz bulunmamaktadır.
                </p>

                <div className="flex flex-col gap-3 pt-4">
                    <Link href="/">
                        <Button className="w-full bg-[#135bec] hover:bg-blue-700">
                            Ana Sayfaya Dön
                        </Button>
                    </Link>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-slate-800 px-2 text-slate-500">veya</span>
                        </div>
                    </div>

                    <SignOutButton className="w-full" variant="outline" />
                </div>
            </div>
        </div>
    );
}
