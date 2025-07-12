const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client
const supabaseUrl = 'https://bjelydvroavsqczejpgd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWx5ZHZyb2F2c3FjemVqcGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjE2MDcsImV4cCI6MjA2NjU5NzYwN30.f-693IO1d0TCBQRiWcSTvjCT8I7bb0t9Op_gvD5LeIE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupTenantUsers() {
  console.log('Setting up tenant users for existing auth users...');
  
  try {
    // First, get all auth users with sportiko.eu emails
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }
    
    console.log('Found auth users:', authUsers.users.length);
    
    // Filter for sportiko.eu users
    const sportikoUsers = authUsers.users.filter(user => 
      user.email && user.email.includes('sportiko.eu')
    );
    
    console.log('Sportiko users found:', sportikoUsers.map(u => u.email));
    
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
      const { data, error } = await supabase
        .from('tenant_users')
        .upsert({
          user_id: authUser.id,
          schema_name: 'club01_',
          role: role,
          email: authUser.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,schema_name'
        });
        
      if (error) {
        console.error(`Error creating tenant user for ${authUser.email}:`, error);
      } else {
        console.log(`✓ Created tenant user for ${authUser.email} with role ${role}`);
      }
    }
    
    console.log('Tenant users setup complete!');
    
  } catch (error) {
    console.error('Error setting up tenant users:', error);
  }
}

setupTenantUsers();