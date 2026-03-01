import Link from "next/link";
import Image from "next/image";
import { GraduationCap, Users, ShieldCheck, ArrowRight, LayoutDashboard } from "lucide-react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import SignOutButton from "@/components/auth/sign-out-button";
import { getUserRole } from "@/lib/auth-helpers";
import { Profile } from "@/types/database";

function getRoleLabel(role: string | null): string {
  if (role === 'admin') return 'Yönetici'
  if (role === 'teacher') return 'Öğretmen'
  if (role === 'student') return 'Öğrenci'
  return role?.replace('_', ' ') ?? ''
}

function getDashboardHref(role: string | null): string {
  if (!role) return '#'
  if (role === 'super_admin') return '/super-admin/dashboard'
  return `/${role}/dashboard`
}

async function getAuthData() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // NOSONAR
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // NOSONAR
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, userRole: null, userProfile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, roles(name)')
    .eq('id', user.id)
    .single()

  return {
    user,
    userRole: getUserRole(profile as unknown as Profile),
    userProfile: profile,
  }
}

export default async function Home() {
  const { user, userRole, userProfile } = await getAuthData()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f6f8] dark:bg-[#101622] font-sans p-4 relative">

      {/* Brand / Hero */}
      <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-[#135bec]/10 p-2 rounded-xl text-[#135bec] shadow-lg shadow-blue-600/20">
            <Image src="/deer-logo.svg" alt="Cervus Class Logo" width={64} height={64} className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">CervusClass</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Yeni nesil eğitim yönetim sistemine hoş geldiniz.
        </p>
      </div>

      {user ? (
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8 text-center animate-in scale-95 duration-300">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
            <LayoutDashboard className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Tekrar hoş geldiniz, {userProfile?.full_name || 'Kullanıcı'}!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Şu anda{' '}
            <span className="font-bold capitalize text-[#135bec]">{getRoleLabel(userRole)}</span>
            {' '}olarak oturum açtınız.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={getDashboardHref(userRole)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl bg-[#135bec] hover:bg-blue-700 text-white font-bold h-12 transition-all shadow-md shadow-blue-600/20 ${!userRole ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`} // NOSONAR
            >
              {userRole ? 'Panele Devam Et' : 'Rol Bulunamadı (Yöneticiyle İletişime Geçin)'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="mt-4 flex justify-center">
              <SignOutButton variant="ghost" className="text-slate-500 hover:text-red-600" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">

          <Link href="/student/login" className="group relative flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-[#135bec]/30 transition-all duration-300 hover:-translate-y-1">
            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center text-[#135bec] mb-4 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Öğrenci Portalı</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              Notlarınızı görüntüleyin, etüt alın ve gelişiminizi takip edin.
            </p>
            <div className="mt-auto flex items-center text-[#135bec] font-semibold text-sm group-hover:gap-2 transition-all">
              Öğrenci Girişi <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link href="/teacher/login" className="group relative flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Öğretmen Portalı</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              Sınıfları yönetin, ödev atayın ve yoklama takibi yapın.
            </p>
            <div className="mt-auto flex items-center text-indigo-600 font-semibold text-sm group-hover:gap-2 transition-all">
              Öğretmen Girişi <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link href="/admin/login" className="group relative flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-slate-500/30 transition-all duration-300 hover:-translate-y-1">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-300 mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Yönetici Paneli</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              İdari kontroller, kullanıcı yönetimi ve sistem raporları.
            </p>
            <div className="mt-auto flex items-center text-slate-700 dark:text-slate-300 font-semibold text-sm group-hover:gap-2 transition-all">
              Yönetici Girişi <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

        </div>
      )}

      <div className="mt-12 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Cervus Labs. Tüm hakları saklıdır.
      </div>

    </div>
  )
}
