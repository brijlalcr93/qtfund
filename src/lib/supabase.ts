import { createClient } from '@supabase/supabase-js';

// Capture OAuth callback state before Supabase client initializes and strips the URL hash/query
if (typeof window !== 'undefined') {
  const hasOAuthParams = window.location.hash.includes('access_token=') || 
                         window.location.hash.includes('id_token=') || 
                         window.location.search.includes('code=');
  const hasOAuthError = window.location.hash.includes('error=') || 
                        window.location.search.includes('error=');
  
  if (hasOAuthParams) {
    sessionStorage.setItem('supabase_oauth_pending', 'true');
  } else if (hasOAuthError) {
    sessionStorage.setItem('supabase_oauth_error', 'true');
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
