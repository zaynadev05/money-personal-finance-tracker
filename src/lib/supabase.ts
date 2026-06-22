import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get credentials from env or local storage
export const getSupabaseConfig = () => {
  const metaEnv = (import.meta as any).env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL || '';
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';
  
  const localUrl = localStorage.getItem('moneyplus_sb_url') || '';
  const localKey = localStorage.getItem('moneyplus_sb_key') || '';
  
  return {
    url: envUrl || localUrl || '',
    key: envKey || localKey || '',
    isFromEnv: !!(envUrl && envKey)
  };
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;
  
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  
  try {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
};

export const resetSupabaseInstance = () => {
  supabaseInstance = null;
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return !!(url && key);
};
