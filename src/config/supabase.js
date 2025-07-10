import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database schema constants
export const SHARED_SCHEMA = 'plrs_SAAS';
export const TENANT_PREFIX = 'club';

// User roles
export const ROLES = {
  SUPERADMIN: 'superadmin',
  TENANTADMIN: 'tenantadmin',
  TRAINER: 'trainer',
  TRAINING_SUPERVISOR: 'training_supervisor',
  MATCH_SUPERVISOR: 'match_supervisor',
  USER: 'user',
  PLAYER: 'player'
};

// Helper function to get current user's tenant info
export const getCurrentUserTenant = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('tenant_users')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return data;
};

// Helper function to execute queries in tenant schema
export const executeTenantQuery = async (schema, query) => {
  const { data, error } = await supabase.rpc('execute_in_schema', {
    schema_name: schema,
    query_text: query
  });
  
  return { data, error };
};