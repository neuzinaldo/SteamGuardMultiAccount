import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Fallback para desenvolvimento local sem Supabase configurado
const isDevelopment = !supabaseUrl.includes('supabase.co') || supabaseUrl === 'https://your-project.supabase.co';

export const supabase = isDevelopment 
  ? null 
  : createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });

// Debug: mostrar status da configuração
console.log('Supabase configurado:', !isDevelopment);
if (!isDevelopment) {
  console.log('URL:', supabaseUrl);
}