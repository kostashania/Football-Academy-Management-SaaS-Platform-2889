import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bjelydvroavsqczejpgd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWx5ZHZyb2F2c3FjemVqcGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjE2MDcsImV4cCI6MjA2NjU5NzYwN30.f-693IO1d0TCBQRiWcSTvjCT8I7bb0t9Op_gvD5LeIE';

if (SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>') {
  throw new Error('Missing Supabase variables');
}

// Create single instance to avoid multiple client warnings
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

// Execute query helper
export const executeQuery = async (query) => {
  try {
    const { data, error } = await supabase.rpc('execute_query', { query_text: query });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error executing query:', error);
    return { data: null, error };
  }
};

// Helper function to query tables
export const fromTable = (tableName) => {
  return supabase.from(tableName);
};