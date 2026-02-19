
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkKeys() {
    console.log("Fetching exam results...");
    const { data, error } = await supabase
        .from('exam_results')
        .select('scores, exam_name')
        .not('scores', 'is', null) // Filter out null scores
        .limit(20); // Check more rows

    if (error) {
        console.error('Error:', error);
        return;
    }

    const allKeys = new Set();
    data.forEach(row => {
        let scores = row.scores;
        if (typeof scores === 'string') {
            try { scores = JSON.parse(scores); } catch (e) { }
        }
        if (scores && typeof scores === 'object') {
            Object.keys(scores).forEach(key => allKeys.add(key));
        }
    });

    console.log('Found keys:', Array.from(allKeys));
}

checkKeys();
