import { createClient } from '@supabase/supabase-js';
import getSupabaseConfig from '../config/supabase.config';
import { Database } from '../types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const config = getSupabaseConfig();

export const supabase = createClient<Database>(config.url, config.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key: string) => AsyncStorage.getItem(key),
      setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
      removeItem: (key: string) => AsyncStorage.removeItem(key),
    },
  },
});

export default supabase; 