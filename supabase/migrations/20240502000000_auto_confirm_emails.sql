-- Confirm all existing user emails that are not confirmed
UPDATE auth.users
SET email_confirmed_at = CURRENT_TIMESTAMP
WHERE email_confirmed_at IS NULL;

-- Make sure confirm_user_email function exists
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

-- Insert a test user if it doesn't exist
DO $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Check if test user exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'test@example.com'
  ) INTO user_exists;
  
  -- If the test user doesn't exist, create one
  IF NOT user_exists THEN
    -- Create a sample user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
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