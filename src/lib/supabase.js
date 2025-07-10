```javascript
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
    const { data, error } = await supabase.rpc('execute_in_schema', {
      schema_name: schema,
      query_text: query
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error executing in schema:', error);
    return { data: null, error };
  }
};

// Create stored procedure for schema creation
const createSchemaFunction = `
CREATE OR REPLACE FUNCTION create_tenant_schema(schema_name TEXT)
RETURNS void AS $$
BEGIN
  -- Create schema if it doesn't exist
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
  
  -- Create tables
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.players (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      -- other columns...
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name);
    
  -- Add other tables as needed
  -- Enable RLS
  EXECUTE format('ALTER TABLE %I.players ENABLE ROW LEVEL SECURITY', schema_name);
  
  -- Create RLS policies
  EXECUTE format('
    CREATE POLICY "Enable read for users in same tenant" ON %I.players
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM plrs_saas.tenant_users
        WHERE user_id = auth.uid()
        AND schema_name = %L
      )
    )', schema_name, schema_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

// Run this once to create the function
export const initializeDatabase = async () => {
  const { error } = await supabase.rpc('create_schema_function', {
    function_sql: createSchemaFunction
  });
  
  if (error) {
    console.error('Error creating schema function:', error);
  }
};
```