import { createClient } from '@supabase/supabase-js';
import getSupabaseConfig from '../config/supabase.config';
import { Database } from '../types/database';

const config = getSupabaseConfig();

export const supabase = createClient<Database>(config.url, config.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase; 