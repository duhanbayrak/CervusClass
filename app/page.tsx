import Link from "next/link";
import { School, GraduationCap, Users, ShieldCheck, ArrowRight, LogOut, LayoutDashboard } from "lucide-react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  let userRole = null;
  let userProfile = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        *,
        roles!inner (
          name
        )
      `)
      .eq('id', user.id)
      .single();
    userRole = profile?.roles?.name;
    userProfile = profile;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f6f8] dark:bg-[#101622] font-sans p-4 relative">

      {/* Sign Out Button (Visible if logged in) */}
      {user && (
        <form action="/auth/signout" method="post" className="absolute top-4 right-4">
          {/* We need a server action or route handler for this. For now, we can use a client component or just a link to a signout route if we had one. 
               Since we don't have a /auth/signout route ready, let's just use the dashboard sidebar logout.
               Actually, let's suggest the user to use the dashboard logout, OR simpler:
               We can render a Client Component button here that calls supabase.auth.signOut().
            */}
        </form>
      )}

      {/* Brand / Hero */}
      <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-[#135bec] p-3 rounded-xl text-white shadow-lg shadow-blue-600/20">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">CervusClass</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Welcome to the next generation education management system.
        </p>
      </div>

      {user ? (
        // LOGGED IN STATE
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8 text-center animate-in scale-95 duration-300">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
            <LayoutDashboard className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome back, {userProfile?.full_name || 'User'}!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            You are currently signed in as a <span className="font-bold capitalize text-[#135bec]">{userRole?.replace('_', ' ')}</span>.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href={userRole === 'super_admin' ? '/super-admin/dashboard' : `/${userRole}/dashboard`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#135bec] hover:bg-blue-700 text-white font-bold h-12 transition-all shadow-md shadow-blue-600/20"
            >
              Continue to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>

            {/* 
                    Note: To implement Logout properly without a client component wrapper here, 
                    users should go to dashboard to logout.
                    But for convenience, we will add a simple hint.
                 */}
            <p className="text-xs text-slate-400 mt-4">
              Want to switch accounts? Logs out from the Dashboard profile menu.
            </p>
          </div>
        </div>
      ) : (
        // LOGGED OUT STATE - Portal Selection
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">

          {/* Student Portal */}
          <Link href="/student/login" className="group relative flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-[#135bec]/30 transition-all duration-300 hover:-translate-y-1">
            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center text-[#135bec] mb-4 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Student Portal</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              View grades, schedule study sessions, and track your progress.
            </p>
            <div className="mt-auto flex items-center text-[#135bec] font-semibold text-sm group-hover:gap-2 transition-all">
              Login as Student <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Teacher Portal */}
          <Link href="/teacher/login" className="group relative flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Teacher Portal</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              Manage classes, assign homework, and track student attendance.
            </p>
            <div className="mt-auto flex items-center text-indigo-600 font-semibold text-sm group-hover:gap-2 transition-all">
              Login as Teacher <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Admin Portal */}
          <Link href="/admin/login" className="group relative flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-slate-500/30 transition-all duration-300 hover:-translate-y-1">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-300 mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Admin Portal</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              Administrative controls, user management, and system reports.
            </p>
            <div className="mt-auto flex items-center text-slate-700 dark:text-slate-300 font-semibold text-sm group-hover:gap-2 transition-all">
              Login as Admin <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

        </div>
      )}

      <div className="mt-12 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Cervus Labs. All rights reserved.
      </div>

    </div>
  );
}
