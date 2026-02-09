import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load .env.local manually since we are running a script outside Next.js context
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing Supabase environment variables!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loginUser(email, password) {
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) {
        console.error(`Login failed for ${email}: ${error.message}`);
        return null;
    }
    console.log(`Login SUCCESS for ${email}`);
    return session;
}

async function verifyAdmin() {
    console.log("\n--- Verifying Admin Features ---");
    let session = await loginUser("admin@cervus.com", "password");
    if (!session) session = await loginUser("admin@cervus.com", "123456"); // Try fallback

    if (!session) {
        console.error("Could not login as Admin.");
        return;
    }

    // Verify Dashboard Stats Access (Profiles, Classes)
    const { count: profileCount, error: profilesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    if (profilesError) {
        console.error("Admin: Failed to fetch profiles:", profilesError.message);
    } else {
        console.log(`Admin: Successfully accessed profiles. Count: ${profileCount}`);
    }

    const { count: classCount, error: classesError } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true });

    if (classesError) {
        console.error("Admin: Failed to fetch classes:", classesError.message);
    } else {
        console.log(`Admin: Successfully accessed classes. Count: ${classCount}`);
    }

    await supabase.auth.signOut();
}

async function verifyTeacher() {
    console.log("\n--- Verifying Teacher Features ---");
    let session = await loginUser("teacher@cervus.com", "password");
    if (!session) session = await loginUser("teacher@cervus.com", "123456");

    if (!session) {
        console.error("Could not login as Teacher.");
        return;
    }

    // Verify Homework Access (Own homeworks)
    const { data: homeworks, error: homeworkError } = await supabase
        .from('homework')
        .select('*')
        .eq('teacher_id', session.user.id);

    if (homeworkError) {
        console.error("Teacher: Failed to fetch homework:", homeworkError.message);
    } else {
        console.log(`Teacher: Successfully fetched homework. Count: ${homeworks?.length}`);
    }

    await supabase.auth.signOut();
}

async function verifyStudent() {
    console.log("\n--- Verifying Student Features ---");
    let session = await loginUser("student@cervus.com", "password");
    if (!session) session = await loginUser("student@cervus.com", "123456");

    if (!session) {
        console.error("Could not login as Student.");
        return;
    }

    // Verify Homework Access (Assigned to class or student)
    // First, get student's class_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('class_id')
        .eq('id', session.user.id)
        .single();

    if (profile?.class_id) {
        const { data: homeworks, error: hwError } = await supabase
            .from('homework')
            .select('*')
            .eq('class_id', profile.class_id);

        if (hwError) {
            console.error("Student: Failed to fetch homework:", hwError.message);
        } else {
            console.log(`Student: Successfully fetched class homework. Count: ${homeworks?.length}`);
        }
    } else {
        console.log("Student: Not assigned to any class, skipping homework check.");
    }

    await supabase.auth.signOut();
}

async function main() {
    await verifyAdmin();
    await verifyTeacher();
    await verifyStudent();
}

main();
