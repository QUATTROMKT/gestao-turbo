import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Key exists' : 'Key missing');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Try to select from a table that might not exist yet, 
        // but the authentication check happens before table existence check usually,
        // or we can check health/auth endpoint.
        // simpler: try to fetch fetching session (offline) or just simple query
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Connection Error:', error.message);
            if (error.code === 'PGRST301' || error.message.includes('relation "public.profiles" does not exist')) {
                console.log('✅ Connection successful! (Table profiles missing, which is expected pending migration)');
            } else {
                console.log('❌ Connection failed with logic error.');
            }
        } else {
            console.log('✅ Connection successful!');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
