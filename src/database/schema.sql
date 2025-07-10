-- =============================================
-- FOOTBALL SAAS PLATFORM DATABASE SCHEMA
-- =============================================

-- Create the shared schema for global tables
CREATE SCHEMA IF NOT EXISTS plrs_SAAS;

-- =============================================
-- SHARED SCHEMA TABLES (plrs_SAAS)
-- =============================================

-- Tenant users mapping table
CREATE TABLE plrs_SAAS.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schema_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'tenantadmin', 'trainer', 'training_supervisor', 'match_supervisor', 'user', 'player')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, schema_name)
);

-- Global advertisements (managed by superadmin)
CREATE TABLE plrs_SAAS.ads_global (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenant-specific advertisements
CREATE TABLE plrs_SAAS.ads_tenant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_schema TEXT NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE plrs_SAAS.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  package_name TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  features_json JSONB,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TENANT SCHEMA TEMPLATE (to be created for each tenant)
-- =============================================

-- Example: CREATE SCHEMA club01_;

-- Function to create tenant schema with all required tables
CREATE OR REPLACE FUNCTION plrs_SAAS.create_tenant_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Create the schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
  
  -- Create positions table
  EXECUTE format('
    CREATE TABLE %I.positions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      short_code TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name);
  
  -- Insert default positions
  EXECUTE format('
    INSERT INTO %I.positions (name, short_code) VALUES 
    (''Goalkeeper'', ''GK''),
    (''Defender'', ''DEF''),
    (''Midfielder'', ''MID''),
    (''Forward'', ''FWD'')
  ', schema_name);
  
  -- Create players table
  EXECUTE format('
    CREATE TABLE %I.players (
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
      position_ids UUID[],
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
  
  -- Create trainings table
  EXECUTE format('
    CREATE TABLE %I.trainings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      notes TEXT,
      created_by UUID NOT NULL REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name);
  
  -- Create attendance table
  EXECUTE format('
    CREATE TABLE %I.attendance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      training_id UUID NOT NULL REFERENCES %I.trainings(id) ON DELETE CASCADE,
      player_id UUID NOT NULL REFERENCES %I.players(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK (status IN (''present'', ''absent'', ''injured'')),
      marked_by UUID NOT NULL REFERENCES auth.users(id),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(training_id, player_id)
    )', schema_name, schema_name, schema_name);
  
  -- Create training_characteristics table
  EXECUTE format('
    CREATE TABLE %I.training_characteristics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name);
  
  -- Create match_characteristics table
  EXECUTE format('
    CREATE TABLE %I.match_characteristics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name);
  
  -- Create player_evaluations table
  EXECUTE format('
    CREATE TABLE %I.player_evaluations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id UUID NOT NULL REFERENCES %I.players(id) ON DELETE CASCADE,
      training_id UUID NOT NULL REFERENCES %I.trainings(id) ON DELETE CASCADE,
      characteristic_id UUID NOT NULL REFERENCES %I.training_characteristics(id),
      score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(player_id, training_id, characteristic_id)
    )', schema_name, schema_name, schema_name, schema_name);
  
  -- Create matches table
  EXECUTE format('
    CREATE TABLE %I.matches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      opponent TEXT NOT NULL,
      location TEXT,
      report_url TEXT,
      created_by UUID NOT NULL REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name);
  
  -- Create match_stats table
  EXECUTE format('
    CREATE TABLE %I.match_stats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID NOT NULL REFERENCES %I.matches(id) ON DELETE CASCADE,
      player_id UUID NOT NULL REFERENCES %I.players(id) ON DELETE CASCADE,
      minutes INTEGER DEFAULT 0,
      goals INTEGER DEFAULT 0,
      assists INTEGER DEFAULT 0,
      yellow_cards INTEGER DEFAULT 0,
      red_cards INTEGER DEFAULT 0,
      position_id UUID REFERENCES %I.positions(id),
      score INTEGER CHECK (score >= 1 AND score <= 10),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(match_id, player_id)
    )', schema_name, schema_name, schema_name, schema_name);
  
  -- Create documents table
  EXECUTE format('
    CREATE TABLE %I.documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id UUID NOT NULL REFERENCES %I.players(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      uploaded_by UUID NOT NULL REFERENCES auth.users(id),
      uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name, schema_name);
  
  -- Create audit_logs table
  EXECUTE format('
    CREATE TABLE %I.audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      table_name TEXT NOT NULL,
      record_id UUID NOT NULL,
      action TEXT NOT NULL CHECK (action IN (''INSERT'', ''UPDATE'', ''DELETE'')),
      old_values JSONB,
      new_values JSONB,
      changed_by UUID NOT NULL REFERENCES auth.users(id),
      changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )', schema_name);
  
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE plrs_SAAS.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plrs_SAAS.ads_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE plrs_SAAS.ads_tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE plrs_SAAS.subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's tenant info
CREATE OR REPLACE FUNCTION plrs_SAAS.get_user_tenant(user_uuid UUID)
RETURNS TABLE (schema_name TEXT, role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT tu.schema_name, tu.role
  FROM plrs_SAAS.tenant_users tu
  WHERE tu.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is superadmin
CREATE OR REPLACE FUNCTION plrs_SAAS.is_superadmin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM plrs_SAAS.tenant_users 
    WHERE user_id = user_uuid AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for tenant_users
CREATE POLICY tenant_users_policy ON plrs_SAAS.tenant_users
  USING (plrs_SAAS.is_superadmin(auth.uid()) OR user_id = auth.uid());

-- RLS Policies for ads_global
CREATE POLICY ads_global_read_policy ON plrs_SAAS.ads_global
  FOR SELECT USING (is_active = true);

CREATE POLICY ads_global_write_policy ON plrs_SAAS.ads_global
  FOR ALL USING (plrs_SAAS.is_superadmin(auth.uid()));

-- RLS Policies for ads_tenant
CREATE POLICY ads_tenant_policy ON plrs_SAAS.ads_tenant
  USING (
    tenant_schema IN (
      SELECT schema_name FROM plrs_SAAS.get_user_tenant(auth.uid())
    )
  );

-- RLS Policies for subscriptions
CREATE POLICY subscriptions_policy ON plrs_SAAS.subscriptions
  USING (plrs_SAAS.is_superadmin(auth.uid()));

-- =============================================
-- NOTIFICATION FUNCTIONS
-- =============================================

-- Function to check for expiring documents
CREATE OR REPLACE FUNCTION plrs_SAAS.check_expiring_documents()
RETURNS TABLE (
  schema_name TEXT,
  player_name TEXT,
  document_type TEXT,
  expiry_date DATE,
  days_until_expiry INTEGER
) AS $$
DECLARE
  tenant_schema TEXT;
  sql_query TEXT;
BEGIN
  -- Loop through all tenant schemas
  FOR tenant_schema IN 
    SELECT DISTINCT t.schema_name 
    FROM plrs_SAAS.tenant_users t
  LOOP
    -- Check EPO record expiry
    sql_query := format('
      SELECT ''%s'' as schema_name,
             CONCAT(first_name, '' '', last_name) as player_name,
             ''EPO Record'' as document_type,
             epo_record_expiry as expiry_date,
             (epo_record_expiry - CURRENT_DATE) as days_until_expiry
      FROM %I.players 
      WHERE epo_record_expiry IS NOT NULL 
        AND epo_record_expiry <= CURRENT_DATE + INTERVAL ''30 days''
        AND epo_record_expiry > CURRENT_DATE
    ', tenant_schema, tenant_schema);
    
    RETURN QUERY EXECUTE sql_query;
    
    -- Check health card expiry
    sql_query := format('
      SELECT ''%s'' as schema_name,
             CONCAT(first_name, '' '', last_name) as player_name,
             ''Health Card'' as document_type,
             health_card_expiry as expiry_date,
             (health_card_expiry - CURRENT_DATE) as days_until_expiry
      FROM %I.players 
      WHERE health_card_expiry IS NOT NULL 
        AND health_card_expiry <= CURRENT_DATE + INTERVAL ''30 days''
        AND health_card_expiry > CURRENT_DATE
    ', tenant_schema, tenant_schema);
    
    RETURN QUERY EXECUTE sql_query;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SAMPLE DATA CREATION
-- =============================================

-- Create sample tenant
SELECT plrs_SAAS.create_tenant_schema('club01_');

-- Insert sample tenant user
INSERT INTO plrs_SAAS.tenant_users (user_id, schema_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'club01_',
  'tenantadmin'
);

-- Insert sample subscription
INSERT INTO plrs_SAAS.subscriptions (tenant_id, package_name, expires_at, features_json)
VALUES (
  'club01_',
  'Professional',
  NOW() + INTERVAL '1 year',
  '{"max_players": 100, "max_staff": 20, "features": ["reports", "analytics", "mobile_app"]}'::JSONB
);