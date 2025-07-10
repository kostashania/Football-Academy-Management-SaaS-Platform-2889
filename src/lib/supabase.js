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
  },
  db: {
    schema: 'public'
  }
});

// Execute query in specific schema
export const executeInSchema = async (schema, query) => {
  try {
    // Since we can't use the RPC function, we'll have to use regular queries
    // This is a limited implementation
    if (schema === 'public') {
      const { data, error } = await supabase.rpc('execute_query', { query_text: query });
      if (error) throw error;
      return { data, error: null };
    } else {
      console.warn('Schema-specific queries not supported in this version');
      return { data: [], error: null };
    }
  } catch (error) {
    console.error('Error executing in schema:', error);
    return { data: null, error };
  }
};

// Helper function to query tables in tenant schemas
export const fromSchema = (schema, table) => {
  // For now, we'll just query the public schema
  return supabase.from(`${table}`);
};