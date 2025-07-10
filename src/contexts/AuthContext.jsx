```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { ROLES } from '../config/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userTenant, setUserTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  const createTenantSchema = async (schemaName) => {
    try {
      const { error: schemaError } = await supabase.rpc('create_tenant_schema', {
        schema_name: schemaName
      });

      if (schemaError) {
        console.error('Error creating schema:', schemaError);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error in createTenantSchema:', error);
      return false;
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        if (error.message === 'Email not confirmed') {
          toast.error('Please check your email and confirm your account first');
        } else {
          toast.error(error.message);
        }
        throw error;
      }

      // Get tenant info
      const { data: tenantData, error: tenantError } = await supabase
        .from('plrs_saas.tenant_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (tenantError) {
        console.error('Error fetching tenant:', tenantError);
        throw tenantError;
      }

      // Create schema if it doesn't exist
      if (tenantData.schema_name !== 'shared') {
        await createTenantSchema(tenantData.schema_name);
      }

      setUser(user);
      setUserTenant(tenantData);
      return { user, tenantData };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email, password, role = ROLES.USER, schema_name = 'shared') => {
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            role,
            schema_name
          }
        }
      });

      if (error) throw error;

      // Create tenant user mapping
      const { error: mappingError } = await supabase
        .from('plrs_saas.tenant_users')
        .insert([
          {
            user_id: user.id,
            schema_name,
            role
          }
        ]);

      if (mappingError) throw mappingError;

      toast.success('Please check your email for confirmation link');
      return { user };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  // ... rest of the context implementation

  return (
    <AuthContext.Provider value={{
      user,
      userTenant,
      loading,
      signIn,
      signUp,
      signOut,
      // ... other values
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
```