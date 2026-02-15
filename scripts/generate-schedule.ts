
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Time Slots
const TIME_SLOTS = [
    { start: '08:00', end: '08:40' },
    { start: '08:50', end: '09:30' },
    { start: '09:40', end: '10:20' },
    { start: '10:30', end: '11:10' },
    { start: '11:20', end: '12:00', isLunchBefore: false },
    // Lunch 12:00 - 12:40
    { start: '12:40', end: '13:20' },
    { start: '13:20', end: '14:00' },
];

const DAYS = [1, 2, 3, 4, 5]; // Mon-Fri

async function generateSchedule() {
    console.log('Fetching data...');

    // 1. Fetch Teacher Role ID
    const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'teacher')
        .single();

    if (roleError) throw roleError;
    const teacherRoleId = roleData.id;

    // 2. Fetch Teachers with Role ID
    const { data: teachers, error: teachersError } = await supabase
        .from('profiles')
        .select('id, full_name, branch_id, organization_id')
        .eq('role_id', teacherRoleId);

    if (teachersError) throw teachersError;
    console.log(`Avg. Teachers found: ${teachers?.length}`);

    // 2. Fetch Classes
    const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name, organization_id');

    if (classesError) throw classesError;
    console.log(`Classes found: ${classes?.length}`);

    // 3. Fetch Courses
    const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, name, branch_id');

    if (coursesError) throw coursesError;
    console.log(`Courses found: ${courses?.length}`);

    if (!teachers || !classes || !courses) return;

    // Organization ID (Assume single org for now or group by org)
    // We'll use the first class's org or loop. Assuming single tenant for script simplicity or matching logic.
    // Let's group by organization_id to be safe.
    const orgs = [...new Set(classes.map(c => c.organization_id))];

    const scheduleEntries: any[] = [];

    for (const orgId of orgs) {
        console.log(`Processing Org: ${orgId}`);

        const orgClasses = classes.filter(c => c.organization_id === orgId);
        const orgTeachers = teachers.filter(t => t.organization_id === orgId);

        // Clear existing schedule for this org
        console.log('Deleting existing schedule...');
        await supabase.from('schedule').delete().eq('organization_id', orgId);

        // Teacher availability tracking: teacherId -> Set<"day-slotIndex">
        const teacherBusySlots = new Set<string>();

        for (const cls of orgClasses) {
            console.log(`Scheduling Class: ${cls.name}`);

            for (const day of DAYS) {
                for (let i = 0; i < TIME_SLOTS.length; i++) {
                    const slot = TIME_SLOTS[i];

                    // Simple constraint: Randomly pick a subject/teacher
                    // Better: Ensure balanced distribution. 
                    // For now: Random valid assignment.

                    // 1. Filter courses that have at least one teacher in this org
                    const availableCourses = courses.filter(crs =>
                        orgTeachers.some(t => t.branch_id === crs.branch_id)
                    );

                    if (availableCourses.length === 0) continue;

                    let tries = 0;
                    let assigned = false;

                    while (!assigned && tries < 20) {
                        tries++;
                        const randomCourse = availableCourses[Math.floor(Math.random() * availableCourses.length)];

                        // Find teachers for this course
                        const potentialTeachers = orgTeachers.filter(t => t.branch_id === randomCourse.branch_id);
                        if (potentialTeachers.length === 0) continue;

                        // Find a teacher who is free
                        const freeTeachers = potentialTeachers.filter(t => !teacherBusySlots.has(`${t.id}-${day}-${i}`));

                        if (freeTeachers.length > 0) {
                            const teacher = freeTeachers[Math.floor(Math.random() * freeTeachers.length)];

                            // Assign
                            scheduleEntries.push({
                                organization_id: orgId,
                                class_id: cls.id,
                                teacher_id: teacher.id,
                                course_id: randomCourse.id,
                                day_of_week: day,
                                start_time: slot.start,
                                end_time: slot.end,
                                room_name: cls.name // Virtual room = Class name
                            });

                            teacherBusySlots.add(`${teacher.id}-${day}-${i}`);
                            assigned = true;
                        }
                    }
                }
            }
        }
    }

    console.log(`Generated ${scheduleEntries.length} schedule entries.`);

    if (scheduleEntries.length > 0) {
        // Batch insert
        // Supabase limit is often around thousands, split chunks
        const chunkSize = 100;
        for (let i = 0; i < scheduleEntries.length; i += chunkSize) {
            const chunk = scheduleEntries.slice(i, i + chunkSize);
            const { error } = await supabase.from('schedule').insert(chunk);
            if (error) {
                console.error('Insert Error:', error);
            } else {
                console.log(`Inserted chunk ${i / chunkSize + 1}`);
            }
        }
    }

    console.log('Done!');
}

generateSchedule().catch(console.error);
