import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseEnv } from './env'

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseEnv()

export function createClient() {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
