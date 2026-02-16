import { createClient } from '@supabase/supabase-js';

/**
 * Initialize the Supabase Client.
 * These variables are pulled from your .env file to keep your 
 * project-specific keys secure during development.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);