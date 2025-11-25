import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin client for user management operations (requires service role key)
// Check if service key is available and log for debugging
console.log('🔍 Debug - Service Key Check:', {
  exists: !!supabaseServiceKey,
  length: supabaseServiceKey?.length || 0,
  firstChars: supabaseServiceKey?.substring(0, 20) || 'não encontrada',
  allViteVars: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
});

if (!supabaseServiceKey) {
  console.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY não encontrada. Funcionalidades de administração podem não funcionar.');
  console.warn('Variáveis disponíveis:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
}

export const supabaseAdmin = supabaseServiceKey
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase; // Fallback to regular client if service key not available

// Flag to check if admin operations are available
export const isAdminAvailable = !!supabaseServiceKey;
