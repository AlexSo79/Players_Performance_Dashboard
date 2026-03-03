const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
    if (pErr) console.log(pErr);

    console.log("Profile Columns:", profiles.length > 0 ? Object.keys(profiles[0]) : "Empty Array");

    const varela = profiles.find(p => p.last_name && p.last_name.toLowerCase().includes('varela'));

    if (varela) {
        const { data: stats } = await supabase.from('performance_stats').select('*').eq('player_id', varela.id);

        console.log(`\n--- VARELA STATS LOG ---`);
        console.log(`Stats Rows Found: ${stats.length}`);

        // Per 90 Calculations
        const per90s = stats.filter(s => s.minutes > 0).map(s => {
            const p90 = s.total_distance * (90 / s.minutes);
            console.log(`Raw: ${s.total_distance}m in ${s.minutes}min -> Per90: ${p90.toFixed(1)}m`);
            return p90;
        });

        console.log(`\nMax Per 90 Target Value: ${Math.max(...per90s).toFixed(1)}m`);

        // Rolling Avg + 5% Calculation
        const distValues = stats.map(s => s.total_distance);
        const sum = distValues.reduce((a, b) => a + b, 0);
        const avg = sum / distValues.length;
        console.log(`Rolling Average + 5% Target Value: ${(avg * 1.05).toFixed(1)}m`);
    } else {
        console.log("no varela found in DB.");
    }
}
run();
