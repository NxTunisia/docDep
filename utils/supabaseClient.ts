import { createClient } from '@supabase/supabase-js';

const getMetaEnv = () => {
  try {
    // @ts-ignore
    return (import.meta && import.meta.env) ? import.meta.env : {};
  } catch {
    return {};
  }
};

const env = getMetaEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

// Only export client if keys are present
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
