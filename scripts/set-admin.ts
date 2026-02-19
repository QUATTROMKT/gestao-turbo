import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setAdmin() {
    const email = 'cadu@turbo.com';

    console.log(`Promoting ${email} to admin...`);

    // Update profile
    const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('email', email)
        .select();

    if (error) {
        console.error('Error updating profile:', error.message);
    } else {
        console.log('✅ User updated successfully:', data);
    }

    // Double check
    const { data: check } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', email)
        .single();

    console.log('Current Role:', check?.role);
}

setAdmin();
