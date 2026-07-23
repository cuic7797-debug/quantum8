import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gomowvpstlmwcvvgnujo.supabase.co';
const supabaseKey = 'sb_publishable_7Sl3_rntp_65_3xK4nDu2g_KXqMdgbq';

export const supabase = createClient(supabaseUrl, supabaseKey);
