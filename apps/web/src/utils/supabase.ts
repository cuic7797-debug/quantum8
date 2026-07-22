import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gomowvpstlmwcvvgnujo.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_7Sl3_rntp_65_3xK4nDu2g_KXqMdgbq';

export const supabase = createClient(supabaseUrl, supabaseKey);
