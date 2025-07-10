-- Add confirm_user_email function
CREATE OR REPLACE FUNCTION public.confirm_user_email(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update the user's email_confirmed_at timestamp to confirm their email
  UPDATE auth.users
  SET email_confirmed_at = CURRENT_TIMESTAMP
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add delete_user function
CREATE OR REPLACE FUNCTION public.delete_user(user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM auth.users
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add execute_in_schema function if it doesn't exist
CREATE OR REPLACE FUNCTION public.execute_in_schema(schema_name TEXT, query_text TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE format('SET LOCAL search_path TO %I, public', schema_name);
  EXECUTE query_text INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error executing query in schema %: %', schema_name, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create public views for tenant tables
DO $$
DECLARE
  schemas RECORD;
  tables RECORD;
BEGIN
  -- Loop through all tenant schemas (those starting with 'club')
  FOR schemas IN 
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'club%_'
  LOOP
    -- For each schema, loop through its tables
    FOR tables IN
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = schemas.schema_name
    LOOP
      -- Create a public view for each table
      EXECUTE format(
        'CREATE OR REPLACE VIEW public.%I AS SELECT * FROM %I.%I;',
        schemas.schema_name || '_' || tables.table_name,
        schemas.schema_name,
        tables.table_name
      );
      
      -- Enable RLS on the view
      EXECUTE format(
        'ALTER VIEW public.%I SECURITY INVOKER;',
        schemas.schema_name || '_' || tables.table_name
      );
    END LOOP;
  END LOOP;
END $$;

-- Create or update the create_tenant_schema function with RLS
CREATE OR REPLACE FUNCTION plrs_saas.create_tenant_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Create the schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
  
  -- Create positions table
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.positions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      short_code TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name);
  
  -- Enable RLS on positions table
  EXECUTE format('ALTER TABLE %I.positions ENABLE ROW LEVEL SECURITY', schema_name);
  
  -- Create RLS policy for positions
  EXECUTE format('
    DROP POLICY IF EXISTS "Tenant users can access their positions" ON %I.positions;
    CREATE POLICY "Tenant users can access their positions" ON %I.positions
    USING (
      EXISTS (
        SELECT 1 FROM plrs_saas.tenant_users
        WHERE user_id = auth.uid() AND schema_name = ''%I''
      )
    )', schema_name, schema_name, schema_name);
  
  -- Insert default positions
  EXECUTE format('
    INSERT INTO %I.positions (name, short_code)
    VALUES 
      (''Goalkeeper'', ''GK''),
      (''Defender'', ''DEF''),
      (''Midfielder'', ''MID''),
      (''Forward'', ''FWD'')
    ON CONFLICT DO NOTHING
  ', schema_name);
  
  -- Create players table
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.players (
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
    )', schema_name);
  
  -- Enable RLS on players table
  EXECUTE format('ALTER TABLE %I.players ENABLE ROW LEVEL SECURITY', schema_name);
  
  -- Create RLS policy for players
  EXECUTE format('
    DROP POLICY IF EXISTS "Tenant users can access their players" ON %I.players;
    CREATE POLICY "Tenant users can access their players" ON %I.players
    USING (
      EXISTS (
        SELECT 1 FROM plrs_saas.tenant_users
        WHERE user_id = auth.uid() AND schema_name = ''%I''
      )
    )', schema_name, schema_name, schema_name);
  
  -- Create trainings table
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.trainings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      notes TEXT,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name);
  
  -- Enable RLS on trainings table
  EXECUTE format('ALTER TABLE %I.trainings ENABLE ROW LEVEL SECURITY', schema_name);
  
  -- Create RLS policy for trainings
  EXECUTE format('
    DROP POLICY IF EXISTS "Tenant users can access their trainings" ON %I.trainings;
    CREATE POLICY "Tenant users can access their trainings" ON %I.trainings
    USING (
      EXISTS (
        SELECT 1 FROM plrs_saas.tenant_users
        WHERE user_id = auth.uid() AND schema_name = ''%I''
      )
    )', schema_name, schema_name, schema_name);
  
  -- Create matches table
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.matches (
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
    )', schema_name);
  
  -- Enable RLS on matches table
  EXECUTE format('ALTER TABLE %I.matches ENABLE ROW LEVEL SECURITY', schema_name);
  
  -- Create RLS policy for matches
  EXECUTE format('
    DROP POLICY IF EXISTS "Tenant users can access their matches" ON %I.matches;
    CREATE POLICY "Tenant users can access their matches" ON %I.matches
    USING (
      EXISTS (
        SELECT 1 FROM plrs_saas.tenant_users
        WHERE user_id = auth.uid() AND schema_name = ''%I''
      )
    )', schema_name, schema_name, schema_name);
  
  -- Create a view in the public schema for each table
  EXECUTE format('
    CREATE OR REPLACE VIEW public.%I_positions AS SELECT * FROM %I.positions;
    CREATE OR REPLACE VIEW public.%I_players AS SELECT * FROM %I.players;
    CREATE OR REPLACE VIEW public.%I_trainings AS SELECT * FROM %I.trainings;
    CREATE OR REPLACE VIEW public.%I_matches AS SELECT * FROM %I.matches;
  ', 
  schema_name, schema_name,
  schema_name, schema_name,
  schema_name, schema_name,
  schema_name, schema_name);
  
  -- Make the views respect RLS
  EXECUTE format('
    ALTER VIEW public.%I_positions SECURITY INVOKER;
    ALTER VIEW public.%I_players SECURITY INVOKER;
    ALTER VIEW public.%I_trainings SECURITY INVOKER;
    ALTER VIEW public.%I_matches SECURITY INVOKER;
  ',
  schema_name, schema_name, schema_name, schema_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the tenant schema if it doesn't exist
SELECT plrs_saas.create_tenant_schema('club01_');

-- Create a sample user for testing if it doesn't exist
DO $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Check if test user exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'test@example.com'
  ) INTO user_exists;
  
  -- If user doesn't exist, create it
  IF NOT user_exists THEN
    -- Create a user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      uuid_generate_v4(),
      'authenticated',
      'authenticated',
      'test@example.com',
      crypt('password123', gen_salt('bf')),
      now(), -- Email already confirmed
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now()
    );
    
    -- Add the user to tenant_users
    INSERT INTO plrs_saas.tenant_users (
      user_id,
      schema_name,
      role,
      created_at,
      updated_at
    )
    VALUES (
      (SELECT id FROM auth.users WHERE email = 'test@example.com'),
      'club01_',
      'tenantadmin',
      now(),
      now()
    );
  END IF;
END $$;