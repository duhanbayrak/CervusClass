
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
    // Lunch
    { start: '12:40', end: '13:20' },
    { start: '13:20', end: '14:00' },
];

const DAYS = [1, 2, 3, 4, 5]; // Mon-Fri

// Target Class ID for Baris Ozturk (12-D)
const TARGET_CLASS_ID = 'cc0e40e9-3eda-4158-b79b-89ac57c3e16b';

async function generateScheduleForClass() {
    console.log('Fetching data for specific class...');

    // 1. Fetch Teacher Role ID
    const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'teacher')
        .single();

    if (roleError) throw roleError;
    const teacherRoleId = roleData.id;

    // 2. Fetch Teachers
    const { data: teachers, error: teachersError } = await supabase
        .from('profiles')
        .select('id, full_name, branch_id, organization_id')
        .eq('role_id', teacherRoleId);

    if (teachersError) throw teachersError;

    // 3. Fetch Specific Class
    const { data: cls, error: classError } = await supabase
        .from('classes')
        .select('id, name, organization_id')
        .eq('id', TARGET_CLASS_ID)
        .single();

    if (classError) throw classError;
    console.log(`Target Class: ${cls.name}`);

    // 4. Fetch Courses
    const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, name, branch_id')
        .eq('organization_id', cls.organization_id);

    if (coursesError) throw coursesError;

    // 5. Fetch Existing Schedule to avoid conflicts
    // Fetch ALL schedule for the organization to check teacher availability globally in the org
    const { data: existingSchedule, error: scheduleError } = await supabase
        .from('schedule')
        .select('teacher_id, day_of_week, start_time, end_time')
        .eq('organization_id', cls.organization_id);

    if (scheduleError) throw scheduleError;

    // Helper to check if teacher is busy
    // Normalize time to HH:MM for comparison
    const normalizeTime = (t: string) => t.substring(0, 5); // '08:00:00' -> '08:00'

    const isTeacherBusy = (teacherId: string, day: number, start: string) => {
        return existingSchedule?.some(s =>
            s.teacher_id === teacherId &&
            s.day_of_week === day &&
            normalizeTime(s.start_time) === normalizeTime(start)
        );
    };

    const orgTeachers = teachers.filter(t => t.organization_id === cls.organization_id);
    const scheduleEntries: any[] = [];

    console.log(`Scheduling Class: ${cls.name}`);

    for (const day of DAYS) {
        for (let i = 0; i < TIME_SLOTS.length; i++) {
            const slot = TIME_SLOTS[i];

            // Randomly pick a subject/teacher
            const availableCourses = courses.filter(crs =>
                orgTeachers.some(t => t.branch_id === crs.branch_id)
            );

            if (availableCourses.length === 0) continue;

            // Shuffle courses to avoid stuck on same course if teacher is busy
            availableCourses.sort(() => Math.random() - 0.5);

            let assigned = false;

            for (const course of availableCourses) {
                if (assigned) break;

                const potentialTeachers = orgTeachers.filter(t => t.branch_id === course.branch_id);
                // Filter out busy teachers
                const freeTeachers = potentialTeachers.filter(t => !isTeacherBusy(t.id, day, slot.start));

                if (freeTeachers.length > 0) {
                    const teacher = freeTeachers[Math.floor(Math.random() * freeTeachers.length)];

                    scheduleEntries.push({
                        organization_id: cls.organization_id,
                        class_id: cls.id,
                        teacher_id: teacher.id,
                        course_id: course.id,
                        day_of_week: day,
                        start_time: slot.start,
                        end_time: slot.end,
                        room_name: cls.name
                    });

                    // Locally mark as busy for next iterations in same run
                    existingSchedule?.push({
                        teacher_id: teacher.id,
                        day_of_week: day,
                        start_time: slot.start,
                        end_time: slot.end
                    });

                    assigned = true;
                }
            }
            if (!assigned) {
                console.warn(`Could not find free teacher for Day ${day} at ${slot.start}`);
            }
        }
    }

    console.log(`Generated ${scheduleEntries.length} entries for 12-D.`);

    if (scheduleEntries.length > 0) {
        const { error } = await supabase.from('schedule').insert(scheduleEntries);
        if (error) {
            console.error('Insert Error:', error);
        } else {
            console.log('Successfully inserted schedule for 12-D!');
        }
    }
}

generateScheduleForClass().catch(console.error);
