const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client
const supabaseUrl = 'https://bjelydvroavsqczejpgd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWx5ZHZyb2F2c3FjemVqcGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjE2MDcsImV4cCI6MjA2NjU5NzYwN30.f-693IO1d0TCBQRiWcSTvjCT8I7bb0t9Op_gvD5LeIE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupDatabase() {
  console.log('Setting up database...');
  
  try {
    // Create tenant_users table if it doesn't exist
    const { error: tenantUsersError } = await supabase.rpc('execute_query', { 
      query_text: `
        CREATE TABLE IF NOT EXISTS tenant_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          schema_name TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('superadmin', 'tenantadmin', 'trainer', 'training_supervisor', 'match_supervisor', 'user', 'player')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          email TEXT
        );
        
        ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Allow all access" ON tenant_users
          USING (true)
          WITH CHECK (true);
      `
    });
    
    if (tenantUsersError) {
      console.error('Error creating tenant_users table:', tenantUsersError);
    } else {
      console.log('tenant_users table created or already exists');
    }
    
    // Create players_x12345 table if it doesn't exist
    const { error: playersError } = await supabase.rpc('execute_query', { 
      query_text: `
        CREATE TABLE IF NOT EXISTS players_x12345 (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          father_name TEXT,
          mother_name TEXT,
          national_id TEXT,
          passport_number TEXT,
          nationality TEXT,
          place_of_birth TEXT,
          birthday DATE,
          position_ids TEXT[],
          email TEXT,
          phone TEXT,
          epo_record_number TEXT,
          epo_record_expiry DATE,
          health_card_expiry DATE,
          profile_image_url TEXT,
          comments TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE players_x12345 ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Allow all access" ON players_x12345
          USING (true)
          WITH CHECK (true);
      `
    });
    
    if (playersError) {
      console.error('Error creating players_x12345 table:', playersError);
    } else {
      console.log('players_x12345 table created or already exists');
      
      // Check if we need to insert sample data
      const { data: existingPlayers, error: countError } = await supabase
        .from('players_x12345')
        .select('id')
        .limit(1);
        
      if (countError) {
        console.error('Error checking players count:', countError);
      } else if (!existingPlayers || existingPlayers.length === 0) {
        // Insert sample data
        const { error: insertError } = await supabase.rpc('execute_query', { 
          query_text: `
            INSERT INTO players_x12345 (
              first_name, last_name, father_name, mother_name, 
              national_id, nationality, place_of_birth, birthday,
              position_ids, email, phone, epo_record_number,
              epo_record_expiry, health_card_expiry, comments
            ) VALUES 
            (
              'John', 'Smith', 'Robert Smith', 'Mary Smith',
              '123456789', 'USA', 'New York', '2005-03-15',
              ARRAY['fwd'], 'john.smith@email.com', '+1234567890', 'EPO123',
              '2024-12-31', '2024-06-30', 'Promising young striker with excellent finishing ability.'
            ),
            (
              'Alex', 'Johnson', 'Mike Johnson', 'Sarah Johnson',
              '987654321', 'Canada', 'Toronto', '2004-08-22',
              ARRAY['mid'], 'alex.johnson@email.com', '+1987654321', 'EPO456',
              '2024-11-15', '2024-09-30', 'Creative midfielder with excellent passing range.'
            ),
            (
              'David', 'Garcia', 'Carlos Garcia', 'Elena Garcia',
              '456789123', 'Spain', 'Madrid', '2006-01-10',
              ARRAY['def'], 'david.garcia@email.com', '+34123456789', 'EPO789',
              '2025-02-28', '2024-12-15', 'Solid defender with strong aerial ability.'
            );
          `
        });
        
        if (insertError) {
          console.error('Error inserting sample players:', insertError);
        } else {
          console.log('Sample player data inserted');
        }
      } else {
        console.log('Player data already exists, skipping sample data insertion');
      }
    }
    
    // Create execute_query function if it doesn't exist
    const { error: functionError } = await supabase.rpc('execute_query', { 
      query_text: `
        CREATE OR REPLACE FUNCTION execute_query(query_text TEXT) 
        RETURNS JSONB 
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          result JSONB;
        BEGIN
          EXECUTE query_text INTO result;
          RETURN result;
        EXCEPTION 
          WHEN OTHERS THEN
            RETURN jsonb_build_object('error', SQLERRM);
        END;
        $$;
      `
    });
    
    if (functionError) {
      console.error('Error creating execute_query function:', functionError);
    } else {
      console.log('execute_query function created or already exists');
    }
    
    console.log('Database setup complete!');
    
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase();