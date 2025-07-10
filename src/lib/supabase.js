import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bjelydvroavsqczejpgd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWx5ZHZyb2F2c3FjemVqcGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjE2MDcsImV4cCI6MjA2NjU5NzYwN30.f-693IO1d0TCBQRiWcSTvjCT8I7bb0t9Op_gvD5LeIE';

if (SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>') {
  throw new Error('Missing Supabase variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
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
  
  try {
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
  } catch (error) {
    console.error('Exception in getCurrentUserTenant:', error);
    return null;
  }
};

// Helper function to execute queries in tenant schema
export const executeTenantQuery = async (schema, query) => {
  try {
    // For now, just execute directly in the public schema
    // since we don't have the proper schema setup yet
    const { data, error } = await supabase.rpc('execute_in_schema', {
      schema_name: schema,
      query_text: query
    }).catch(err => {
      console.log("RPC error:", err);
      return { data: null, error: err };
    });
    
    return { data, error };
  } catch (error) {
    console.error('Error in executeTenantQuery:', error);
    return { data: null, error };
  }
};