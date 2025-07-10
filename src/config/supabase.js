import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bjelydvroavsqczejpgd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWx5ZHZyb2F2c3FjemVqcGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjE2MDcsImV4cCI6MjA2NjU5NzYwN30.f-693IO1d0TCBQRiWcSTvjCT8I7bb0t9Op_gvD5LeIE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database schema constants
export const SHARED_SCHEMA = 'plrs_saas';
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
  
  const { data, error } = await supabase
    .from('plrs_saas.tenant_users')
    .select('*')
    .eq('user_id', user.id)
    .single();
    
  if (error) {
    console.error('Error fetching tenant info:', error);
    return null;
  }
  
  return data;
};

// Helper function to execute queries in tenant schema
export const executeTenantQuery = async (schema, query) => {
  const { data, error } = await supabase.rpc('execute_in_schema', {
    schema_name: schema,
    query_text: query
  }).catch(err => {
    console.log("RPC error:", err);
    return { data: null, error: err };
  });
  
  return { data, error };
};