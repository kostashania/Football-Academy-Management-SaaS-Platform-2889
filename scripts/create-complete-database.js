const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client
const supabaseUrl = 'https://bjelydvroavsqczejpgd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWx5ZHZyb2F2c3FjemVqcGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjE2MDcsImV4cCI6MjA2NjU5NzYwN30.f-693IO1d0TCBQRiWcSTvjCT8I7bb0t9Op_gvD5LeIE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createCompleteDatabase() {
  console.log('🚀 Starting complete database setup...');
  
  try {
    // 1. Create tenant_users table
    console.log('📋 Creating tenant_users table...');
    const { error: tenantUsersError } = await supabase.rpc('execute_query', {
      query_text: `
        CREATE TABLE IF NOT EXISTS public.tenant_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          schema_name TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('superadmin', 'tenantadmin', 'trainer', 'training_supervisor', 'match_supervisor', 'user', 'player')),
          email TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, schema_name)
        );

        -- Enable RLS
        ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

        -- Create policy for tenant_users
        DROP POLICY IF EXISTS "Users can access their own tenant data" ON public.tenant_users;
        CREATE POLICY "Users can access their own tenant data" 
        ON public.tenant_users 
        FOR ALL 
        USING (auth.uid() = user_id OR auth.uid() IN (
          SELECT user_id FROM public.tenant_users WHERE role = 'superadmin'
        ));
      `
    });
    
    if (tenantUsersError) {
      console.error('❌ Error creating tenant_users table:', tenantUsersError);
    } else {
      console.log('✅ tenant_users table created successfully');
    }

    // 2. Create players table
    console.log('👥 Creating players table...');
    const { error: playersError } = await supabase.rpc('execute_query', {
      query_text: `
        CREATE TABLE IF NOT EXISTS public.players_x12345 (
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

        -- Enable RLS
        ALTER TABLE public.players_x12345 ENABLE ROW LEVEL SECURITY;

        -- Create policy for players
        DROP POLICY IF EXISTS "Tenant users can access their players" ON public.players_x12345;
        CREATE POLICY "Tenant users can access their players" 
        ON public.players_x12345 
        FOR ALL 
        USING (auth.uid() IN (
          SELECT user_id FROM public.tenant_users WHERE schema_name = 'club01_'
        ));
      `
    });
    
    if (playersError) {
      console.error('❌ Error creating players table:', playersError);
    } else {
      console.log('✅ players table created successfully');
    }

    // 3. Create trainings table
    console.log('🏃 Creating trainings table...');
    const { error: trainingsError } = await supabase.rpc('execute_query', {
      query_text: `
        CREATE TABLE IF NOT EXISTS public.trainings_x12345 (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          date DATE NOT NULL,
          notes TEXT,
          created_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.trainings_x12345 ENABLE ROW LEVEL SECURITY;

        -- Create policy for trainings
        DROP POLICY IF EXISTS "Tenant users can access their trainings" ON public.trainings_x12345;
        CREATE POLICY "Tenant users can access their trainings" 
        ON public.trainings_x12345 
        FOR ALL 
        USING (auth.uid() IN (
          SELECT user_id FROM public.tenant_users WHERE schema_name = 'club01_'
        ));
      `
    });
    
    if (trainingsError) {
      console.error('❌ Error creating trainings table:', trainingsError);
    } else {
      console.log('✅ trainings table created successfully');
    }

    // 4. Create matches table
    console.log('⚽ Creating matches table...');
    const { error: matchesError } = await supabase.rpc('execute_query', {
      query_text: `
        CREATE TABLE IF NOT EXISTS public.matches_x12345 (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          date DATE NOT NULL,
          opponent TEXT NOT NULL,
          location TEXT,
          score_us INTEGER,
          score_them INTEGER,
          notes TEXT,
          created_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.matches_x12345 ENABLE ROW LEVEL SECURITY;

        -- Create policy for matches
        DROP POLICY IF EXISTS "Tenant users can access their matches" ON public.matches_x12345;
        CREATE POLICY "Tenant users can access their matches" 
        ON public.matches_x12345 
        FOR ALL 
        USING (auth.uid() IN (
          SELECT user_id FROM public.tenant_users WHERE schema_name = 'club01_'
        ));
      `
    });
    
    if (matchesError) {
      console.error('❌ Error creating matches table:', matchesError);
    } else {
      console.log('✅ matches table created successfully');
    }

    // 5. Get existing auth users and create tenant_users entries
    console.log('👤 Setting up tenant users...');
    
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ Error fetching auth users:', authError);
      } else {
        console.log(`📊 Found ${authUsers.users.length} auth users`);
        
        // Filter for sportiko.eu users
        const sportikoUsers = authUsers.users.filter(user => 
          user.email && user.email.includes('sportiko.eu')
        );
        
        console.log('🏢 Sportiko users found:', sportikoUsers.map(u => u.email));
        
        // Create tenant users for each
        for (const authUser of sportikoUsers) {
          let role = 'user';
          
          // Determine role based on email
          if (authUser.email === 'superadmin@sportiko.eu') {
            role = 'superadmin';
          } else if (authUser.email === 'admin@sportiko.eu') {
            role = 'tenantadmin';
          } else if (authUser.email === 'test1@sportiko.eu') {
            role = 'trainer';
          } else if (authUser.email === 'test2@sportiko.eu') {
            role = 'user';
          }
          
          // Insert into tenant_users
          const { error: insertError } = await supabase.rpc('execute_query', {
            query_text: `
              INSERT INTO public.tenant_users (
                user_id, 
                schema_name, 
                role, 
                email, 
                created_at, 
                updated_at
              ) VALUES (
                '${authUser.id}', 
                'club01_', 
                '${role}', 
                '${authUser.email}', 
                NOW(), 
                NOW()
              ) ON CONFLICT (user_id, schema_name) DO UPDATE SET
                role = EXCLUDED.role,
                email = EXCLUDED.email,
                updated_at = NOW();
            `
          });
          
          if (insertError) {
            console.error(`❌ Error creating tenant user for ${authUser.email}:`, insertError);
          } else {
            console.log(`✅ Created/updated tenant user for ${authUser.email} with role ${role}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in tenant user setup:', error);
    }

    // 6. Insert sample data
    console.log('📝 Inserting sample data...');
    
    // Insert sample players
    const { error: samplePlayersError } = await supabase.rpc('execute_query', {
      query_text: `
        INSERT INTO public.players_x12345 (
          first_name, last_name, father_name, mother_name, national_id, 
          nationality, place_of_birth, birthday, position_ids, email, phone,
          epo_record_number, epo_record_expiry, health_card_expiry, comments
        ) VALUES 
        (
          'John', 'Smith', 'Robert Smith', 'Mary Smith', '123456789',
          'USA', 'New York', '2005-03-15', ARRAY['fwd'], 'john.smith@email.com', '+1234567890',
          'EPO123', '2024-12-31', '2024-06-30', 'Promising young striker with excellent finishing ability.'
        ),
        (
          'Alex', 'Johnson', 'Mike Johnson', 'Sarah Johnson', '987654321',
          'Canada', 'Toronto', '2004-08-22', ARRAY['mid'], 'alex.johnson@email.com', '+1987654321',
          'EPO456', '2024-11-15', '2024-09-30', 'Creative midfielder with excellent passing range.'
        ),
        (
          'David', 'Garcia', 'Carlos Garcia', 'Elena Garcia', '456789123',
          'Spain', 'Madrid', '2006-01-10', ARRAY['def'], 'david.garcia@email.com', '+34123456789',
          'EPO789', '2025-02-28', '2024-12-15', 'Solid defender with strong aerial ability.'
        )
        ON CONFLICT DO NOTHING;
      `
    });
    
    if (samplePlayersError) {
      console.error('❌ Error inserting sample players:', samplePlayersError);
    } else {
      console.log('✅ Sample players inserted successfully');
    }

    console.log('🎉 Database setup completed successfully!');
    
    // 7. Display final status
    console.log('\n=== FINAL DATABASE STATUS ===');
    
    // Check tables
    const { data: tables } = await supabase.rpc('execute_query', {
      query_text: `
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE' 
        AND table_name IN ('tenant_users', 'players_x12345', 'trainings_x12345', 'matches_x12345')
        ORDER BY table_name;
      `
    });
    
    console.log('📊 Created tables:', tables);
    
    // Check tenant users
    const { data: tenantUsers } = await supabase.rpc('execute_query', {
      query_text: `SELECT email, role FROM public.tenant_users ORDER BY email;`
    });
    
    console.log('👥 Tenant users:', tenantUsers);
    
    // Check players count
    const { data: playersCount } = await supabase.rpc('execute_query', {
      query_text: `SELECT COUNT(*) as count FROM public.players_x12345;`
    });
    
    console.log('⚽ Players count:', playersCount);
    
  } catch (error) {
    console.error('💥 Fatal error in database setup:', error);
  }
}

createCompleteDatabase();