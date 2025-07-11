export * from './database';

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  platform?: string;
  siteName?: string;
  timestamp?: number;
}

export interface ShareData {
  url: string;
  title?: string;
  text?: string;
}

export type Platform = 'instagram' | 'youtube' | 'tiktok' | 'twitter' | 'web' | 'other';

export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appName: string;
  appVersion: string;
} 