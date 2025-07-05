import Constants from 'expo-constants';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

const getSupabaseConfig = (): SupabaseConfig => {
  // Priority order: .env file -> app.json -> fallback
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 
                     Constants.expoConfig?.extra?.supabaseUrl || 
                     '';
  
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                         Constants.expoConfig?.extra?.supabaseAnonKey || 
                         '';

  // For development, provide default values to prevent crashes
  const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isDevelopment) {
      console.warn('⚠️  Missing Supabase configuration. Using placeholder values for development.');
      console.warn('Please set up your Supabase project and update app.json or .env with your credentials.');
      console.warn('Visit: https://supabase.com to create a project.');
      
      return {
        url: 'https://placeholder.supabase.co',
        anonKey: 'placeholder-anon-key'
      };
    } else {
      throw new Error('Missing Supabase configuration. Please check your environment variables.');
    }
  }

  // Log successful configuration (without exposing sensitive data)
  if (isDevelopment) {
    console.log('✅ Supabase configuration loaded successfully');
    console.log(`📡 Project URL: ${supabaseUrl}`);
    console.log(`🔑 API Key: ${supabaseAnonKey.substring(0, 20)}...`);
  }

  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey
  };
};

export default getSupabaseConfig; 