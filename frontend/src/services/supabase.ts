import { createClient } from '@supabase/supabase-js';
import getSupabaseConfig from '../config/supabase.config';
import { Database } from '../types/database';

const config = getSupabaseConfig();

export const supabase = createClient<Database>(config.url, config.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export default supabase; 