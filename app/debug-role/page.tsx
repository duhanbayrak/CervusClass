import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/env";

export default async function DebugRolePage() {
    const cookieStore = await cookies();
    const { url, anonKey } = getSupabaseEnv();
    const supabase = createServerClient(
        url,
        anonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
            },
        }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let profile = null;
    let profileError = null;

    if (user) {
        const response = await supabase
            .from("profiles")
            .select(`
        *,
        roles (
            id,
            name
        )
      `)
            .eq("id", user.id)
            .single();
        profile = response.data;
        profileError = response.error;
    }

    return (
        <div className="p-8 font-mono text-sm whitespace-pre-wrap break-all">
            <h1 className="text-xl font-bold mb-4">Debug Role Info</h1>

            <div className="bg-slate-100 p-4 rounded mb-4">
                <h2 className="font-bold">Auth User</h2>
                {JSON.stringify({ user, authError }, null, 2)}
            </div>

            <div className="bg-blue-100 p-4 rounded mb-4">
                <h2 className="font-bold">Profile & Role</h2>
                {JSON.stringify({ profile, profileError }, null, 2)}
            </div>

            <div className="bg-yellow-100 p-4 rounded">
                <h2 className="font-bold">Calculated Role</h2>
                <div>
                    Is Array: {profile?.roles ? Array.isArray(profile.roles).toString() : 'N/A'}
                </div>
                <div>
                    Role Name: {(() => {
                        if (!profile?.roles) return 'UNDEFINED';
                        return Array.isArray(profile.roles) ? profile.roles[0]?.name : profile.roles?.name;
                    })()}
                </div>
            </div>
        </div>
    );
}
