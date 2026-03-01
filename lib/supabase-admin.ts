import { createClient } from '@supabase/supabase-js';

// WARNING: This client bypasses Row Level Security (RLS).
// Never use this on the client side.
// Only use in trusted server-side contexts (API routes, Server Actions).

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing. Please add it to your environment variables.');
}

export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // NOSONAR
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);
