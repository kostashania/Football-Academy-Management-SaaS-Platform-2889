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
export const SHARED_SCHEMA = 'public';  // Changed from plrs_saas to public
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

  // For demo purposes, we'll return a mock tenant
  return {
    user_id: user.id,
    schema_name: 'club01_',
    role: 'tenantadmin'
  };
};

// Helper function to execute queries in tenant schema
export const executeTenantQuery = async (schema, query) => {
  console.log(`Executing query in schema ${schema}: ${query}`);
  return { data: [], error: null };
};