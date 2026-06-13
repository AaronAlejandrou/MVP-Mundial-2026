import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY_VALUE } from './config';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY_VALUE, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
